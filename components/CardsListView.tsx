
import React, { useState, useMemo, useRef, useEffect } from 'react';
import RollingNumber from './RollingNumber';
import DateRangePicker from './DateRangePicker';
import PagePicker from './PagePicker';
import { CreditCard, Transaction, Category } from '../types';
import {
  Plus,
  CreditCard as CardIcon,
  Trash2,
  Edit2,
  CalendarPlus,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  AlertCircle,
  TrendingDown,
  FileText,
  Calculator,
  History,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  Inbox,
  ShoppingBag,
  Zap,
  CreditCard as PaymentIcon,
  ArrowRight
} from 'lucide-react';

interface CardsListViewProps {
  cards: CreditCard[];
  transactions: Transaction[];
  isDarkMode: boolean;
  onEdit: (card: CreditCard) => void;
  onDelete: (card: CreditCard) => void;
  onAddToCalendar: (card: CreditCard) => void;
  onShowStatement: (card: CreditCard) => void;
  onShowArchive: (card: CreditCard) => void;
  onAddCard: () => void;
  onBack: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
  categories: Category[];
}

type LocalTimeRange = 'today' | 'thisweek' | 'thismonth' | 'thisyear' | 'custom';

const AutoFitText: React.FC<{ text: string; color?: string; baseClass?: string }> = ({ text, color, baseClass = "text-sm font-black truncate" }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!containerRef.current || !textRef.current) return;

    const container = containerRef.current;
    const textEl = textRef.current;

    let size = baseClass.includes('sm:text-base') ? 16 : 14;
    textEl.style.fontSize = `${size}px`;

    const checkAndShrink = () => {
      if (textEl.scrollWidth > container.offsetWidth && size > 7) {
        size -= 0.5;
        textEl.style.fontSize = `${size}px`;
        requestAnimationFrame(checkAndShrink);
      }
    };

    checkAndShrink();
  }, [text, baseClass]);

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <p
        ref={textRef}
        className={baseClass}
        style={{ color, whiteSpace: 'nowrap', transition: 'font-size 0.2s ease' }}
      >
        {text}
      </p>
    </div>
  );
};

const CardsListView: React.FC<CardsListViewProps> = ({
  cards,
  transactions,
  isDarkMode,
  onEdit,
  onDelete,
  onAddToCalendar,
  onShowStatement,
  onShowArchive,
  onAddCard,
  onBack,
  onEditTransaction,
  onDeleteTransaction,
  categories
}) => {
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [localRange, setLocalRange] = useState<LocalTimeRange>('thismonth');
  const [customStart, setCustomStart] = useState<string>(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBank, setSelectedBank] = useState<string>('all');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const ITEMS_PER_PAGE = 5;

  // Custom page change handler with animation
  const handlePageChange = (newPage: number) => {
    if (newPage === currentPage || isAnimating) return;

    setSlideDirection(newPage > currentPage ? 'left' : 'right');
    setIsAnimating(true);

    setTimeout(() => {
      setCurrentPage(newPage);
      setSlideDirection(newPage > currentPage ? 'right' : 'left');

      setTimeout(() => {
        setSlideDirection(null);
        setIsAnimating(false);
      }, 50);
    }, 200);
  };

  const banks = useMemo(() => {
    const uniqueBanks = Array.from(new Set(cards.map(c => c.bankName))).filter(Boolean).sort();
    return ['all', ...uniqueBanks];
  }, [cards]);

  const filteredCards = useMemo(() => {
    if (selectedBank === 'all') return cards;
    return cards.filter(c => c.bankName === selectedBank);
  }, [cards, selectedBank]);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const onlyDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = onlyDate.split('-');
    if (parts.length < 3) return onlyDate;
    const [y, m, d] = parts;
    return `${d}.${m}.${y.slice(-2)}`;
  };

  const getFilteredTransactions = (cardId: string) => {
    let list = transactions.filter(t => t.cardId === cardId);
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    if (localRange === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      list = list.filter(t => {
        const d = new Date(t.date);
        return d >= start && d <= end;
      });
    } else if (localRange === 'thisweek') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      list = list.filter(t => new Date(t.date) >= start);
    } else if (localRange === 'thismonth') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      list = list.filter(t => new Date(t.date) >= start);
    } else if (localRange === 'thisyear') {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      list = list.filter(t => new Date(t.date) >= start);
    } else if (localRange === 'custom') {
      const cStart = new Date(customStart);
      cStart.setHours(0, 0, 0, 0);
      const cEnd = new Date(customEnd);
      cEnd.setHours(23, 59, 59, 999);
      list = list.filter(t => {
        const d = new Date(t.date);
        return d >= cStart && d <= cEnd;
      });
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleRangeChange = (r: LocalTimeRange) => {
    setLocalRange(r);
    setCurrentPage(1);
  };

  const handleCardExpand = (cardId: string) => {
    if (expandedCardId === cardId) {
      setExpandedCardId(null);
    } else {
      setExpandedCardId(cardId);
      setCurrentPage(1);
    }
  };

  return (
    <div className="pt-0 pb-0">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 flex items-center justify-center rounded-2xl ${isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
            <CardIcon size={24} />
          </div>
          <div>
            <h1 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Kartlarım</h1>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto sm:min-w-[200px]">
            <select
              value={selectedBank}
              onChange={(e) => {
                setSelectedBank(e.target.value);
                setExpandedCardId(null);
              }}
              className={`w-full appearance-none pl-11 pr-10 py-4 rounded-2xl border font-black text-xs uppercase tracking-widest outline-none transition-all cursor-pointer ${isDarkMode
                ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500/50'
                : 'bg-white border-slate-200 text-slate-800 focus:ring-blue-500/20 shadow-sm'
                }`}
            >
              {banks.map(b => (
                <option key={b} value={b}>
                  {b === 'all' ? 'TÜM BANKALAR' : b.toLocaleUpperCase('tr-TR')}
                </option>
              ))}
            </select>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500">
              <Filter size={16} strokeWidth={3} />
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
              <ChevronDown size={14} strokeWidth={3} />
            </div>
          </div>

          <button
            onClick={onAddCard}
            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-blue-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Plus size={20} strokeWidth={3} />
            <span>YENİ KART EKLE</span>
          </button>
        </div>
      </div>

      {/* Cards Detailed List */}
      <div className="space-y-6">
        {filteredCards.length > 0 ? filteredCards.map((card) => {
          const balanceValue = card.balance;
          const isCreditBalance = balanceValue < 0;
          const isNeutralBalance = balanceValue === 0;
          const displayBalance = Math.abs(balanceValue);
          const utilization = isNeutralBalance ? 0 : (balanceValue > 0 ? (balanceValue / card.limit) * 100 : 0);
          const remainingLimit = card.limit - card.balance;
          const isHighUsage = utilization >= 80;
          const estimatedMinPayment = card.balance > 0 ? (card.balance * (card.minPaymentRatio / 100)) : 0;
          const isExpanded = expandedCardId === card.id;
          const cardTransactions = getFilteredTransactions(card.id);
          const totalPages = Math.ceil(cardTransactions.length / ITEMS_PER_PAGE);
          const paginatedTransactions = cardTransactions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

          return (
            <div
              key={card.id}
              className={`group relative p-6 sm:p-10 pl-9 sm:pl-14 rounded-[40px] border overflow-hidden transition-all hover:shadow-2xl hover:z-10 ${isDarkMode ? 'bg-[#0b0f1a]/40 border-slate-800 hover:bg-[#0b0f1a]/60' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'
                } group-hover:scale-[1.01] sm:group-hover:scale-[1.02]`}
            >
              {/* Card Color Side Accent - Perfectly Integrated */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[14px] shadow-[rgba(0,0,0,0.1)_2px_0_10px]"
                style={{ backgroundColor: card.color }}
              />

              <div className="flex flex-col gap-8">
                {/* Header Section */}
                <div
                  className="flex items-start gap-4 sm:gap-6 cursor-pointer select-none"
                  onClick={() => handleCardExpand(card.id)}
                >
                  {/* Card Visual Identity */}
                  <div
                    className="w-16 h-11 sm:w-20 sm:h-14 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 transform -rotate-2 group-hover:rotate-0 transition-transform duration-500"
                    style={{ backgroundColor: card.color }}
                  >
                    <CardIcon size={24} className="sm:w-8 sm:h-8" />
                  </div>

                  {/* Card Name and Actions Side by Side */}
                  <div className="flex-1 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className={`text-lg sm:text-2xl font-black tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                        {card.cardName}
                      </h3>

                      {/* Actions Group */}
                      <div className={`flex items-center gap-1 p-1 rounded-xl border shrink-0 ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100 shadow-inner'}`} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onShowStatement(card)}
                          className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-90 ${isDarkMode ? 'text-blue-400 hover:bg-blue-500 hover:text-white' : 'text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                          title="Ekstre Al"
                        >
                          <FileText size={16} />
                        </button>
                        <button
                          onClick={() => onAddToCalendar(card)}
                          className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-90 ${isDarkMode ? 'text-blue-400 hover:bg-blue-500 hover:text-white' : 'text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                          title="Takvime Ekle"
                        >
                          <CalendarPlus size={16} />
                        </button>
                        <button
                          onClick={() => onEdit(card)}
                          className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-90 ${isDarkMode ? 'text-amber-400 hover:bg-amber-500 hover:text-white' : 'text-amber-600 hover:bg-amber-500 hover:text-white'}`}
                          title="Düzenle"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(card)}
                          className={`p-1.5 rounded-lg transition-all hover:scale-110 active:scale-90 ${isDarkMode ? 'text-rose-400 hover:bg-rose-500 hover:text-white' : 'text-rose-600 hover:bg-rose-500 hover:text-white'}`}
                          title="Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <p className={`text-xs sm:text-base font-bold opacity-60 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {card.bankName} • •••• {card.lastFour}
                      </p>
                      {isHighUsage && (
                        <div className="w-fit bg-rose-500/10 text-rose-500 text-[10px] font-black px-3 py-1 rounded-full border border-rose-500/20 flex items-center gap-2">
                          <AlertCircle size={12} /> YÜKSEK KULLANIM
                        </div>
                      )}
                      {isCreditBalance && (
                        <div className="w-fit bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-2">
                          <TrendingDown size={12} /> FAZLA ÖDEME VAR
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Stats Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative">
                  {/* Utilization Progress Bar */}
                  <div className="lg:col-span-5 space-y-3">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">KART KULLANIMI</span>
                      <span className={`text-sm font-black ${isCreditBalance ? 'text-emerald-500' : isHighUsage ? 'text-rose-500' : (isDarkMode ? 'text-white' : 'text-slate-700')}`}>
                        <span className="text-[0.85em] font-sans font-bold opacity-80 mr-0.5">%</span>{utilization.toFixed(1)}
                      </span>
                    </div>
                    <div className={`h-3 w-full rounded-full p-0.5 border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${isCreditBalance ? 'bg-emerald-500 shadow-[0_0_100px_rgba(16,185,129,0.3)]' : isHighUsage ? 'bg-rose-500 shadow-[0_0_100px_rgba(244,63,94,0.4)]' : 'bg-blue-600 shadow-[0_0_100px_rgba(37,99,235,0.3)]'
                          }`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-tight">
                      <span className={isCreditBalance ? 'text-emerald-500 font-black' : ''}>
                        {isCreditBalance ? 'ALACAK' : 'BORÇ'}: {displayBalance.toLocaleString('tr-TR')} ₺
                      </span>
                      <span>LİMİT: {card.limit.toLocaleString('tr-TR')} ₺</span>
                    </div>
                  </div>

                  {/* Financial Stats Grid */}
                  <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pr-0 sm:pr-12">
                    <div className={`p-3 sm:p-5 rounded-[28px] flex flex-col justify-center border ${isDarkMode ? 'bg-amber-500/5 border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]' : 'bg-amber-50 border-amber-100 shadow-sm'}`}>
                      <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1 leading-tight">TAHMİNİ ASGARİ</p>
                      <AutoFitText
                        text={`${estimatedMinPayment.toLocaleString('tr-TR')} ₺`}
                        color={isDarkMode ? '#fbbf24' : '#d97706'}
                        baseClass="text-xs sm:text-base font-black"
                      />
                    </div>
                    <div className={`p-3 sm:p-5 rounded-[28px] flex flex-col justify-center ${isDarkMode ? 'bg-slate-800/30' : 'bg-slate-50'}`}>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 leading-tight">KALAN LİMİT</p>
                      <AutoFitText
                        text={`${remainingLimit.toLocaleString('tr-TR')} ₺`}
                        color={isDarkMode ? '#34d399' : '#059669'}
                        baseClass="text-xs sm:text-base font-black"
                      />
                    </div>
                    <div className={`p-3 sm:p-5 rounded-[28px] flex flex-col justify-center ${isDarkMode ? 'bg-slate-800/30' : 'bg-slate-50'}`}>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 leading-tight">HESAP KESİM</p>
                      <p className={`text-xs sm:text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                        {card.statementDay}. GÜN
                      </p>
                    </div>
                    <div className={`p-3 sm:p-5 rounded-[28px] flex flex-col justify-center ${isDarkMode ? 'bg-slate-800/30' : 'bg-slate-50'}`}>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 leading-tight">SON ÖDEME</p>
                      <p className={`text-xs sm:text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                        {card.dueDay}. GÜN
                      </p>
                    </div>
                  </div>

                  <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                    <button
                      onClick={() => handleCardExpand(card.id)}
                      className={`w-full p-5 rounded-[24px] border border-dashed font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 ${isExpanded
                        ? (isDarkMode ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm')
                        : (isDarkMode ? 'border-slate-800 text-slate-500 hover:bg-slate-800/30 hover:text-blue-400 hover:border-blue-500/50' : 'border-slate-200 text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200')
                        }`}
                    >
                      <History size={18} className={`transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
                      <span className="font-black text-[10px] uppercase tracking-[0.35em]">İŞLEM GEÇMİŞİ</span>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                    <button
                      onClick={() => onShowArchive(card)}
                      className={`w-full p-5 rounded-[24px] border border-dashed font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 ${isDarkMode ? 'border-slate-800 text-slate-500 hover:bg-slate-800/30 hover:text-indigo-400 hover:border-indigo-500/50' : 'border-slate-200 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
                        }`}
                    >
                      <FileText size={18} />
                      <span className="font-black text-[10px] uppercase tracking-[0.35em]">DÖNEM EKSTRELERİ</span>
                      <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </button>
                  </div>
                </div>

                {/* Expanded Transaction List Area */}
                {isExpanded && (
                  <div className={`mt-2 p-6 sm:p-8 rounded-[32px] border animate-in slide-in-from-top-4 duration-500 ${isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/80 border-slate-200'}`}>
                    {/* Transaction Header & Pagination Controls */}
                    <div className="flex flex-col gap-6 mb-10">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-600/10 text-blue-600 rounded-2xl shrink-0"><History size={20} /></div>
                          <h4 className={`text-sm sm:text-base font-black uppercase tracking-widest leading-none ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>KART HAREKETLERİ</h4>
                        </div>

                        {/* Time Range Filters - Moved to top-right */}
                        <div className="grid grid-cols-3 sm:flex sm:items-center gap-2">
                          {(['today', 'thisweek', 'thismonth', 'thisyear', 'custom'] as LocalTimeRange[]).map(r => (
                            <button
                              key={r}
                              onClick={() => handleRangeChange(r)}
                              className={`flex-1 sm:flex-none px-4 py-3 rounded-[20px] text-[9px] font-black uppercase tracking-widest transition-all duration-300 border ${localRange === r
                                ? (isDarkMode
                                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20'
                                  : 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20')
                                : isDarkMode
                                  ? 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                                  : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50 hover:border-slate-200 shadow-sm'
                                } active:scale-95`}
                            >
                              {r === 'today' ? 'Bugün' : r === 'thisweek' ? 'Hafta' : r === 'thismonth' ? 'Ay' : r === 'thisyear' ? 'Yıl' : 'Özel'}
                            </button>
                          ))}
                        </div>
                      </div>


                    </div>

                    {localRange === 'custom' && (
                      <div className="mb-8 animate-in slide-in-from-top-4 duration-500 max-w-2xl">
                        <DateRangePicker
                          startDate={customStart}
                          endDate={customEnd}
                          onChange={(start, end) => {
                            setCustomStart(start);
                            setCustomEnd(end);
                          }}
                          isDarkMode={isDarkMode}
                        />
                      </div>
                    )}

                    {/* Main Content Area with Vertical Pagination on the Right */}
                    <div className="flex gap-4 sm:gap-6 items-stretch">
                      <div
                        className={`flex-1 space-y-2.5 min-w-0 transition-all duration-200 ease-out min-h-[560px] sm:min-h-0 ${slideDirection !== null ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
                          }`}
                      >
                        {paginatedTransactions.length > 0 ? paginatedTransactions.map(tx => {
                          const categoryName = tx.category || 'Diğer';
                          const categoryInfo = categories.find(c => c.name.toLocaleLowerCase('tr-TR') === categoryName.toLocaleLowerCase('tr-TR'));
                          const categoryColor = categoryInfo?.color || card.color;
                          const cardColor = card.color;
                          const isSpending = tx.type === 'spending';

                          return (
                            <div key={tx.id} className={`relative p-3.5 sm:px-5 sm:py-3.5 rounded-[24px] border transition-all ${isDarkMode ? 'bg-[#0b0f1a]/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                              {/* Mobile Layout */}
                              <div className="flex flex-col gap-3 sm:hidden">
                                {/* Top Row: Type & Buttons */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-1 h-4 rounded-full shrink-0 ${isSpending ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'}`} />
                                    <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                      {isSpending ? 'HARCAMA' : 'ÖDEME'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <button onClick={() => onEditTransaction(tx)} className={`p-2 rounded-lg transition-all ${isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}><Edit2 size={12} /></button>
                                    <button onClick={() => onDeleteTransaction(tx)} className={`p-2 rounded-lg transition-all ${isDarkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600'}`}><Trash2 size={12} /></button>
                                  </div>
                                </div>

                                {/* Middle Row: Description & Amount */}
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex flex-col flex-1 min-w-0">
                                    <p className={`text-[13px] font-black tracking-tight truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                      {tx.description || (isSpending ? 'Harcama' : 'Ödeme')}
                                    </p>
                                    {isSpending && tx.expenseType === 'installment' && (
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <TrendingUp size={10} className="text-blue-500" />
                                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
                                          {tx.installments} TAKSİT ({tx.installmentAmount?.toLocaleString('tr-TR')} ₺ / Ay)
                                        </span>
                                      </div>
                                    )}
                                    {isSpending && tx.expenseType === 'cash_advance' && (
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <Zap size={10} className="text-rose-500" />
                                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">
                                          TAKSİTLİ NAKİT AVANS
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <p className={`text-sm font-black tracking-tighter shrink-0 ${isSpending ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {isSpending ? '-' : '+'} {tx.amount.toLocaleString('tr-TR')} ₺
                                  </p>
                                </div>

                                {/* Bottom Row: Category Pill & Date */}
                                <div className="flex items-center justify-between">
                                  <div className="px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-white shadow-sm" style={{ backgroundColor: categoryColor }}>
                                    {tx.category}
                                  </div>
                                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest opacity-60">{formatDateDisplay(tx.date)}</p>
                                </div>
                              </div>

                              {/* Desktop Layout (Slimmed Down) */}
                              <div className="hidden sm:flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                  <div className={`p-2.5 rounded-xl shrink-0 ${isSpending ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                    {isSpending ? <ShoppingBag size={16} /> : <PaymentIcon size={16} />}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <p className={`font-black text-sm tracking-tight truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                                      {tx.description || (isSpending ? 'HARCAMA' : 'ÖDEME')}
                                    </p>
                                    {isSpending && tx.expenseType === 'installment' && (
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <TrendingUp size={10} className="text-blue-600" />
                                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                                          {tx.installments} TAKSİT ({tx.installmentAmount?.toLocaleString('tr-TR')} ₺ / AY)
                                        </span>
                                      </div>
                                    )}
                                    {isSpending && tx.expenseType === 'cash_advance' && (
                                      <div className="flex items-center gap-1.5 mb-1">
                                        <Zap size={10} className="text-rose-600" />
                                        <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">
                                          TAKSİTLİ NAKİT AVANS
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <div className="px-2 py-0.5 rounded-md border text-[8px] font-black tracking-widest" style={{ color: cardColor, borderColor: `${cardColor}40`, backgroundColor: `${cardColor}15` }}>
                                        {card.cardName.toLocaleUpperCase('tr-TR')}
                                      </div>
                                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{formatDateDisplay(tx.date)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-5">
                                  <p className={`text-base font-black tracking-tighter ${isSpending ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {isSpending ? '-' : '+'} {tx.amount.toLocaleString('tr-TR')} ₺
                                  </p>
                                  <div className="flex items-center gap-1.5 opacity-100 transition-all">
                                    <button onClick={() => onEditTransaction(tx)} className={`p-2 rounded-xl transition-all border ${isDarkMode ? 'bg-blue-500/5 text-blue-400 border-blue-500/10 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'}`} title="Düzenle"><Edit2 size={14} /></button>
                                    <button onClick={() => onDeleteTransaction(tx)} className={`p-2 rounded-xl transition-all border ${isDarkMode ? 'bg-rose-500/5 text-rose-400 border-rose-500/10 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'}`} title="Sil"><Trash2 size={14} /></button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }) : (
                          <div className="py-12 text-center">
                            <Inbox size={32} className="text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                            <p className="text-xs font-bold text-slate-500 italic uppercase tracking-widest">İşlem kaydı bulunmuyor</p>
                          </div>
                        )}
                      </div>

                      {/* Right: Vertical Pagination Control Tower - Centered Vertically (Hidden on Mobile) */}
                      {totalPages > 1 && (
                        <div className={`hidden sm:flex flex-col items-center gap-4 p-2.5 sm:p-3.5 rounded-[32px] border transition-all duration-500 self-center ${isDarkMode
                          ? 'bg-[#0f172a]/90 border-slate-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.5),_inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-xl'
                          : 'bg-white/90 border-slate-200/60 shadow-[0_20px_50px_rgba(37,99,235,0.1),_inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-xl'
                          }`}>
                          <button
                            disabled={currentPage === 1 || isAnimating}
                            onClick={() => handlePageChange(currentPage - 1)}
                            className={`p-3 rounded-2xl transition-all duration-300 border ${currentPage === 1
                              ? 'opacity-20 cursor-not-allowed border-transparent'
                              : `hover:bg-blue-600 hover:text-white active:scale-95 shadow-lg ${isDarkMode
                                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:shadow-blue-500/20'
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:shadow-blue-500/20 shadow-[0_4px_10px_rgba(0,0,0,0.05)]'
                              }`
                              }`}
                            title="Önceki Sayfa"
                          >
                            <ChevronUp size={20} className="stroke-[2.5px]" />
                          </button>

                          <div className="flex flex-col items-center gap-1.5 py-1">
                            {/* Animated Vertical Counter Window - Menu Bar Style Depth */}
                            <div className={`relative w-10 h-14 overflow-hidden rounded-[20px] border transition-all duration-500 ${isDarkMode
                              ? 'bg-slate-800 border-slate-700 shadow-[inset_0_3px_8px_rgba(0,0,0,0.5),_0_1px_1px_rgba(255,255,255,0.05)]'
                              : 'bg-white border-slate-200 shadow-[inset_0_3px_8px_rgba(0,0,0,0.1),_0_1px_2px_rgba(0,0,0,0.05)]'
                              }`}>
                              <div
                                className="absolute inset-0 flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                                style={{ transform: `translateY(-${(currentPage - 1) * 100}%)` }}
                              >
                                {[...Array(totalPages)].map((_, i) => (
                                  <div
                                    key={i}
                                    className={`min-h-full w-full flex items-center justify-center text-[13px] font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-blue-600'}`}
                                  >
                                    {i + 1}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="h-px w-5 bg-slate-300/50 dark:bg-slate-700/50 my-1" />
                            <span className={`text-[11px] font-black tracking-tighter ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{totalPages}</span>
                          </div>

                          <button
                            disabled={currentPage === totalPages || isAnimating}
                            onClick={() => handlePageChange(currentPage + 1)}
                            className={`p-3 rounded-2xl transition-all duration-300 border ${currentPage === totalPages
                              ? 'opacity-20 cursor-not-allowed border-transparent'
                              : `hover:bg-blue-600 hover:text-white active:scale-95 shadow-lg ${isDarkMode
                                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:shadow-blue-500/20'
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:shadow-blue-500/20 shadow-[0_4px_10px_rgba(0,0,0,0.05)]'
                              }`
                              }`}
                            title="Sonraki Sayfa"
                          >
                            <ChevronDown size={20} className="stroke-[2.5px]" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Mobile Optimized PagePicker - At the Very Bottom of Container */}
                    {totalPages > 1 && (
                      <div className="flex sm:hidden justify-center mt-8 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                        <PagePicker
                          totalPages={totalPages}
                          currentPage={currentPage}
                          onPageChange={handlePageChange}
                          isDarkMode={isDarkMode}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        }) : (
          <div className={`py-32 text-center rounded-[56px] border border-dashed ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
              <CardIcon size={48} />
            </div>
            <h3 className={`text-xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Henüz kart eklemediniz</h3>
            <p className="text-slate-500 max-w-xs mx-auto mb-8 font-medium">Finansal takibe başlamak için ilk kartınızı ekleyin.</p>
            <button
              onClick={onAddCard}
              className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95"
            >
              KART EKLE
            </button>
          </div>
        )}
      </div>

      {/* Quick Summary Footer */}
      {cards.length > 0 && (
        <div className={`mt-4 p-8 sm:p-10 rounded-[40px] border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-center gap-5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
              <Filter size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-0.5">TOPLAM KART</span>
              <span className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{filteredCards.length} Adet</span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-0.5">TOPLAM LİMİT</span>
              <RollingNumber
                value={filteredCards.reduce((a, b) => a + b.limit, 0)}
                className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}
              />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
              <CardIcon size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] block mb-0.5">TOPLAM BORÇ</span>
              <RollingNumber
                value={filteredCards.reduce((a, b) => a + (b.balance > 0 ? b.balance : 0), 0)}
                className="text-xl font-black text-rose-500"
                showSign={filteredCards.reduce((a, b) => a + (b.balance > 0 ? b.balance : 0), 0) > 0}
              />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
              <Zap size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] block mb-0.5">TOPLAM ASGARİ</span>
              <RollingNumber
                value={filteredCards.reduce((acc, c) => acc + (c.balance > 0 ? (c.balance * (c.minPaymentRatio / 100)) : 0), 0)}
                className="text-xl font-black text-blue-600"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardsListView;
