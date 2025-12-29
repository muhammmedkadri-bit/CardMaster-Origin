
import React, { useState, useMemo } from 'react';
import RollingNumber from './RollingNumber';
import { CreditCard, Transaction, Category } from '../types';
import {
  ArrowLeft,
  Plus,
  CreditCard as CardIcon,
  Trash2,
  Edit2,
  CalendarPlus,
  TrendingUp,
  ChevronRight,
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
  CreditCard as PaymentIcon
} from 'lucide-react';

interface CardsListViewProps {
  cards: CreditCard[];
  transactions: Transaction[];
  isDarkMode: boolean;
  onEdit: (card: CreditCard) => void;
  onDelete: (card: CreditCard) => void;
  onAddToCalendar: (card: CreditCard) => void;
  onShowStatement: (card: CreditCard) => void;
  onAddCard: () => void;
  onBack: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
  categories: Category[];
}

type LocalTimeRange = 'all' | '7days' | '30days';

const CardsListView: React.FC<CardsListViewProps> = ({
  cards,
  transactions,
  isDarkMode,
  onEdit,
  onDelete,
  onAddToCalendar,
  onShowStatement,
  onAddCard,
  onBack,
  onEditTransaction,
  onDeleteTransaction,
  categories
}) => {
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [localRange, setLocalRange] = useState<LocalTimeRange>('30days');

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

    if (localRange === '7days') {
      const limit = new Date();
      limit.setDate(now.getDate() - 7);
      list = list.filter(t => new Date(t.date) >= limit);
    } else if (localRange === '30days') {
      const limit = new Date();
      limit.setDate(now.getDate() - 30);
      list = list.filter(t => new Date(t.date) >= limit);
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  return (
    <div className="pt-0 pb-10">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-5">
          <button
            onClick={onBack}
            className={`w-12 h-12 flex items-center justify-center rounded-full transition-all active:scale-90 ${isDarkMode
              ? 'bg-slate-800/50 text-slate-300 hover:bg-slate-700 backdrop-blur-md'
              : 'bg-white text-slate-600 hover:bg-white hover:shadow-md border border-slate-100 shadow-sm'
              }`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Kartlarım</h1>
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

      {/* Cards Detailed List */}
      <div className="space-y-6">
        {cards.length > 0 ? cards.map((card) => {
          const isCreditBalance = card.balance < 0;
          const displayBalance = Math.abs(card.balance);
          const utilization = isCreditBalance ? 0 : (card.balance / card.limit) * 100;
          const remainingLimit = card.limit - card.balance;
          const isHighUsage = utilization >= 80;
          const estimatedMinPayment = card.balance > 0 ? (card.balance * (card.minPaymentRatio / 100)) : 0;
          const isExpanded = expandedCardId === card.id;
          const cardTransactions = getFilteredTransactions(card.id);

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
                <div className="flex items-start gap-4 sm:gap-6">
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
                      <div className={`flex items-center gap-1 p-1 rounded-xl border shrink-0 ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100 shadow-inner'}`}>
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
                      <p className={`text-xs sm:text-base font-black truncate ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                        {estimatedMinPayment.toLocaleString('tr-TR')} ₺
                      </p>
                    </div>
                    <div className={`p-3 sm:p-5 rounded-[28px] flex flex-col justify-center ${isDarkMode ? 'bg-slate-800/30' : 'bg-slate-50'}`}>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 leading-tight">KALAN LİMİT</p>
                      <p className={`text-xs sm:text-base font-black truncate ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        {remainingLimit.toLocaleString('tr-TR')} ₺
                      </p>
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

                  <button
                    onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                    className={`lg:col-span-12 w-full mt-8 p-5 rounded-[32px] border border-dashed font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 ${isExpanded
                      ? (isDarkMode ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm')
                      : (isDarkMode ? 'border-slate-800 text-slate-500 hover:bg-slate-800/30 hover:text-blue-400 hover:border-blue-500/50' : 'border-slate-200 text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200')
                      }`}
                  >
                    <History size={18} className={`transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
                    <span className="font-black text-[10px] uppercase tracking-[0.35em]">İŞLEM GEÇMİŞİ</span>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>

                {/* Expanded Transaction List Area */}
                {isExpanded && (
                  <div className={`mt-2 p-6 sm:p-8 rounded-[32px] border animate-in slide-in-from-top-4 duration-500 ${isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/80 border-slate-200'}`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600/10 text-blue-600 rounded-xl"><History size={18} /></div>
                        <h4 className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>KART HAREKETLERİ</h4>
                      </div>

                      <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        {(['all', '7days', '30days'] as LocalTimeRange[]).map(r => (
                          <button
                            key={r}
                            onClick={() => setLocalRange(r)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${localRange === r ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                          >
                            {r === 'all' ? 'Tümü' : r === '7days' ? '7 Gün' : '30 Gün'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
                      {cardTransactions.length > 0 ? cardTransactions.map(tx => {
                        const categoryInfo = categories.find(c => c.name.toLocaleLowerCase('tr-TR') === tx.category.toLocaleLowerCase('tr-TR'));
                        const categoryColor = categoryInfo?.color || card.color;
                        const cardColor = card.color;
                        const isSpending = tx.type === 'spending';

                        return (
                          <div key={tx.id} className={`relative p-5 sm:p-6 rounded-[32px] border transition-all mb-4 ${isDarkMode ? 'bg-[#0b0f1a]/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                            {/* Mobile Layout (User Requested Specific Style) */}
                            <div className="flex flex-col gap-5 sm:hidden">
                              {/* Top Row: Category & Buttons */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-1.5 h-6 rounded-full shrink-0 ${isSpending ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]' : 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'}`} />
                                  <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {tx.category || 'Diğer'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => onEditTransaction(tx)} className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}><Edit2 size={14} /></button>
                                  <button onClick={() => onDeleteTransaction(tx)} className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}><Trash2 size={14} /></button>
                                </div>
                              </div>

                              {/* Middle Row: Description */}
                              <div className="text-left">
                                <p className={`text-[16px] font-black tracking-tight leading-relaxed ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                  {tx.description || (isSpending ? 'Harcama' : 'Ödeme')}
                                </p>
                              </div>

                              {/* Third Row: Card Pill & Amount */}
                              <div className="flex items-center justify-between gap-4">
                                <div className="px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-[0.1em] whitespace-nowrap" style={{ color: cardColor, borderColor: `${cardColor}40`, backgroundColor: `${cardColor}15` }}>
                                  {card.cardName}
                                </div>
                                <p className={`text-xl font-black tracking-tighter ${isSpending ? 'text-rose-500' : 'text-emerald-500'}`}>
                                  {isSpending ? '-' : '+'} {tx.amount.toLocaleString('tr-TR')} ₺
                                </p>
                              </div>

                              {/* Bottom Row: Date & Time */}
                              <div className="flex items-center gap-2 opacity-60">
                                <Clock size={12} className="text-slate-500" />
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{formatDateDisplay(tx.date)}</p>
                              </div>
                            </div>

                            {/* Desktop Layout (Dashboard sm Style) */}
                            <div className="hidden sm:flex items-center justify-between">
                              <div className="flex items-center gap-5 flex-1 min-w-0">
                                <div className={`p-4 rounded-2xl shrink-0 ${isSpending ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                  {isSpending ? <ShoppingBag size={20} /> : <PaymentIcon size={20} />}
                                </div>
                                <div className="flex flex-col min-w-0 pr-4">
                                  <p className={`font-black text-base tracking-tight truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                                    {tx.description || (isSpending ? 'HARCAMA' : 'ÖDEME')}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <div className="px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest" style={{ color: cardColor, borderColor: `${cardColor}40`, backgroundColor: `${cardColor}15` }}>
                                      {card.cardName}
                                    </div>
                                    <span className="text-[10px] text-slate-300 dark:text-slate-700">•</span>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{formatDateDisplay(tx.date)}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <p className={`text-xl font-black tracking-tighter ${isSpending ? 'text-rose-500' : 'text-emerald-500'}`}>
                                  {isSpending ? '-' : '+'} {tx.amount.toLocaleString('tr-TR')} ₺
                                </p>
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                  <button onClick={() => onEditTransaction(tx)} className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}><Edit2 size={16} /></button>
                                  <button onClick={() => onDeleteTransaction(tx)} className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600'}`}><Trash2 size={16} /></button>
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
        <div className={`mt-12 p-8 sm:p-10 rounded-[40px] border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-center gap-5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
              <Filter size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-0.5">TOPLAM KART</span>
              <span className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{cards.length} Adet</span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-0.5">TOPLAM LİMİT</span>
              <RollingNumber
                value={cards.reduce((a, b) => a + b.limit, 0)}
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
                value={cards.reduce((a, b) => a + (b.balance > 0 ? b.balance : 0), 0)}
                className="text-xl font-black text-rose-500"
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
                value={cards.reduce((acc, c) => acc + (c.balance > 0 ? (c.balance * (c.minPaymentRatio / 100)) : 0), 0)}
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
