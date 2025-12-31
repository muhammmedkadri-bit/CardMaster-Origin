
import React, { useMemo, useState, useRef } from 'react';
import RollingNumber from './RollingNumber';
import DateRangePicker from './DateRangePicker';
import PagePicker from './PagePicker';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { Transaction, CreditCard, Category } from '../types';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  BarChart3,
  CreditCard as CardIcon,
  Filter,
  ChevronRight,
  ChevronLeft,
  PieChart as PieIcon,
  Zap,
  CalendarDays,
  Calendar as CalendarIcon,
  Clock,
  Inbox,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Printer,
  Calculator,
  ShoppingBag,
  CreditCard as PaymentIcon,
  CalendarRange,
  Edit2,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AnalysisViewProps {
  cards: CreditCard[];
  transactions: Transaction[];
  isDarkMode: boolean;
  onBack: () => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (tx: Transaction) => void;
  categories: Category[];
  lastUpdate?: number;
}

type TimeRange = 'today' | 'thisweek' | 'thismonth' | 'thisyear' | 'custom';

const AnalysisView: React.FC<AnalysisViewProps> = ({ cards, transactions, isDarkMode, onBack, onEditTransaction, onDeleteTransaction, categories, lastUpdate }) => {
  const [selectedBank, setSelectedBank] = React.useState<string>('all');
  const [selectedCardId, setSelectedCardId] = React.useState<string>('all');
  const [timeRange, setTimeRange] = React.useState<TimeRange>('thismonth');
  const [customStart, setCustomStart] = React.useState<string>(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = React.useState<string>(new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isMarqueePaused, setIsMarqueePaused] = React.useState(false);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef(0);
  const dragRef = useRef({ isDragging: false, startX: 0, currentTranslation: 0 });
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const ITEMS_PER_PAGE = 5;
  const isFirstRender = useRef(true);

  // Scroll to top of transaction list when page changes on mobile
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (window.innerWidth < 640) {
      const element = document.getElementById('analysis-transactions');
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [currentPage]);

  // Reset page to 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [timeRange, selectedBank, selectedCardId, customStart, customEnd]);

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

  const bankFilteredCards = useMemo(() => {
    if (selectedBank === 'all') return cards;
    return cards.filter(c => c.bankName === selectedBank);
  }, [cards, selectedBank]);

  const filteredTransactions = useMemo(() => {
    let cardFiltered = transactions;

    if (selectedBank !== 'all') {
      const bankCardIds = cards.filter(c => c.bankName === selectedBank).map(c => c.id);
      if (selectedCardId === 'all') {
        cardFiltered = transactions.filter(t => bankCardIds.includes(t.cardId));
      } else {
        cardFiltered = transactions.filter(t => t.cardId === selectedCardId);
      }
    } else if (selectedCardId !== 'all') {
      cardFiltered = transactions.filter(t => t.cardId === selectedCardId);
    }

    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    if (timeRange === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (timeRange === 'thisweek') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (timeRange === 'thismonth') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (timeRange === 'thisyear') {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (timeRange === 'custom') {
      start = new Date(customStart);
      end = new Date(customEnd);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    // Pre-map dates to timestamps for faster comparison and sorting
    const startMs = start.getTime();
    const endMs = end.getTime();

    return cardFiltered
      .filter(t => {
        const d = new Date(t.date).getTime();
        return d >= startMs && d <= endMs;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedBank, selectedCardId, transactions, timeRange, customStart, customEnd, lastUpdate, cards]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

  const cardStats = useMemo(() => {
    const isBankOverview = selectedBank !== 'all' && selectedCardId === 'all';
    const isGeneralOverview = selectedBank === 'all' && selectedCardId === 'all';

    const spending = filteredTransactions
      .filter(t => t.type === 'spending')
      .reduce((acc, t) => acc + t.amount, 0);

    const payment = filteredTransactions
      .filter(t => t.type === 'payment')
      .reduce((acc, t) => acc + t.amount, 0);

    const periodBalance = spending - payment;

    const cardData = isGeneralOverview
      ? { bankName: 'Tüm Kartlar', cardName: 'Genel Bakış', limit: cards.reduce((a, b) => a + b.limit, 0), balance: periodBalance }
      : isBankOverview
        ? { bankName: selectedBank.toLocaleUpperCase('tr-TR'), cardName: 'Banka Özeti', limit: bankFilteredCards.reduce((a, b) => a + b.limit, 0), balance: periodBalance }
        : { ...(cards.find(c => c.id === selectedCardId) || {}), cardName: cards.find(c => c.id === selectedCardId)?.cardName || 'Bilinmeyen Kart', balance: periodBalance };

    let minPayment = 0;
    if (selectedCardId !== 'all') {
      const card = cards.find(c => c.id === selectedCardId);
      if (card) minPayment = (card.balance * (card.minPaymentRatio || 20)) / 100;
    } else {
      // For bank or general overview, sum all relevant cards' min payments
      minPayment = bankFilteredCards.reduce((acc, c) => acc + (c.balance > 0 ? (c.balance * (c.minPaymentRatio / 100)) : 0), 0);
    }

    return { cardData, spending, payment, minPayment };
  }, [selectedBank, selectedCardId, cards, bankFilteredCards, filteredTransactions, lastUpdate]);

  const trendData = useMemo(() => {
    const data: Record<string, { label: string, spending: number, payment: number, net: number, timestamp: number }> = {};
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    if (timeRange === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (timeRange === 'thisweek') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (timeRange === 'thismonth') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (timeRange === 'thisyear') {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (timeRange === 'custom') {
      start = new Date(customStart);
      end = new Date(customEnd);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    // Calculate duration in days to decide aggregation strategy
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Use monthly aggregation for 'thisyear' OR large custom ranges (> 90 days) to prevent chart lag
    const useMonthly = timeRange === 'thisyear' || (timeRange === 'custom' && diffDays > 90);

    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    // Initialize data with all dates in range to ensure a continuous line
    const tempDate = new Date(start);
    while (tempDate <= end) {
      const label = useMonthly
        ? `${monthNames[tempDate.getMonth()]} ${tempDate.getFullYear()}`
        : `${tempDate.getDate()} ${monthNames[tempDate.getMonth()]}`;

      if (!data[label]) {
        data[label] = { label, spending: 0, payment: 0, net: 0, timestamp: tempDate.getTime() };
      }

      if (useMonthly) {
        tempDate.setMonth(tempDate.getMonth() + 1);
      } else {
        tempDate.setDate(tempDate.getDate() + 1);
      }
    }

    filteredTransactions.forEach(t => {
      const d = new Date(t.date);
      const label = useMonthly
        ? `${monthNames[d.getMonth()]} ${d.getFullYear()}`
        : `${d.getDate()} ${monthNames[d.getMonth()]}`;

      if (data[label]) {
        if (t.type === 'spending') data[label].spending += t.amount;
        else data[label].payment += t.amount;
        data[label].net = data[label].payment - data[label].spending;
      }
    });

    return Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
  }, [filteredTransactions, timeRange, lastUpdate]);

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.type === 'spending')
      .forEach(t => {
        data[t.category] = (data[t.category] || 0) + t.amount;
      });

    return Object.entries(data)
      .map(([name, value]) => {
        const catInfo = categories.find(c => c.name.toLocaleLowerCase('tr-TR') === name.toLocaleLowerCase('tr-TR'));
        return {
          name: name.toLocaleUpperCase('tr-TR'),
          value,
          color: catInfo?.color || '#3b82f6'
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, categories, lastUpdate]);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCardId, timeRange, customStart, customEnd]);

  // Ultra-Smooth GPU-Accelerated Infinite Scroll Logic
  React.useEffect(() => {
    const list = marqueeRef.current?.firstElementChild as HTMLDivElement;
    if (!list || isMarqueePaused || dragRef.current.isDragging) return;

    let animationId: number;
    const animate = () => {
      if (list) {
        scrollPosRef.current -= 1.0; // Moving items to the left (negative translation)

        const singleSetWidth = list.scrollWidth / 3; // We use triple-duplication

        // Loop back seamlessly
        if (Math.abs(scrollPosRef.current) >= singleSetWidth * 2) {
          scrollPosRef.current = -singleSetWidth;
        } else if (scrollPosRef.current >= 0) {
          scrollPosRef.current = -singleSetWidth;
        }

        list.style.transform = `translate3d(${scrollPosRef.current}px, 0, 0)`;
        dragRef.current.currentTranslation = scrollPosRef.current;
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isMarqueePaused, categoryData]);

  // High-Performance Drag & Touch Handling
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsMarqueePaused(true);
    dragRef.current.isDragging = true;
    dragRef.current.startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const list = marqueeRef.current?.firstElementChild as HTMLDivElement;
    if (list) {
      list.style.transition = 'none';
    }
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragRef.current.isDragging) return;
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const walk = x - dragRef.current.startX;
    dragRef.current.startX = x;

    const list = marqueeRef.current?.firstElementChild as HTMLDivElement;
    if (list) {
      scrollPosRef.current += walk;

      const singleSetWidth = list.scrollWidth / 3;
      // Infinite Logic during drag
      if (Math.abs(scrollPosRef.current) >= singleSetWidth * 2) scrollPosRef.current = -singleSetWidth;
      if (scrollPosRef.current > 0) scrollPosRef.current = -singleSetWidth;

      list.style.transform = `translate3d(${scrollPosRef.current}px, 0, 0)`;
      dragRef.current.currentTranslation = scrollPosRef.current;
    }
  };

  const handleDragEnd = () => {
    dragRef.current.isDragging = false;
    // Delay resuming slightly for better UX
    setTimeout(() => setIsMarqueePaused(false), 50);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      const monthName = date.toLocaleDateString('tr-TR', { month: 'long' });
      const year = date.getFullYear();

      return `${date.getDate()} ${monthName} ${year} - ${hh}:${mm}`;
    } catch (e) {
      return dateStr;
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const timestamp = new Date().toLocaleString('tr-TR');

      // Title
      doc.setFontSize(22);
      doc.setTextColor(40);
      doc.text('KartMaster Finansal Analiz Raporu', 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Oluşturma Tarihi: ${timestamp}`, 14, 30);
      doc.text(`Dönem: ${formatDateDisplay(filteredTransactions[filteredTransactions.length - 1]?.date)} - ${formatDateDisplay(filteredTransactions[0]?.date)}`, 14, 35);

      // Summary
      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.text('Özet Bilgiler', 14, 48);

      autoTable(doc, {
        startY: 52,
        head: [['Tanım', 'Miktar']],
        body: [
          ['Seçili Kart', cardStats.cardData!.cardName],
          ['Toplam Harcama', `${cardStats.spending.toLocaleString('tr-TR')} ₺`],
          ['Toplam Ödeme', `${cardStats.payment.toLocaleString('tr-TR')} ₺`],
          ['Dönem Borcu', `${cardStats.cardData!.balance.toLocaleString('tr-TR')} ₺`],
          ['Asgari Ödeme', `${cardStats.minPayment.toLocaleString('tr-TR')} ₺`]
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }
      });

      // Transactions
      doc.text('İşlem Detayları', 14, (doc as any).lastAutoTable.finalY + 15);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Tarih', 'Açıklama', 'Kategori', 'Kart', 'Tutar']],
        body: filteredTransactions.map(tx => [
          formatDateDisplay(tx.date),
          tx.description || (tx.type === 'spending' ? 'Harcama' : 'Ödeme'),
          tx.category,
          tx.cardName,
          `${tx.type === 'spending' ? '-' : '+'} ${tx.amount.toLocaleString('tr-TR')} ₺`
        ]),
        styles: { fontSize: 8 },
        columnStyles: { 4: { halign: 'right' } }
      });

      doc.save(`kartmaster-analiz-${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (cards.length === 0) {
    return (
      <div className="min-h-screen pt-32 px-6 text-center">
        <div className="max-w-md mx-auto p-12 rounded-[40px] border bg-white shadow-xl">
          <Inbox size={64} className="mx-auto text-slate-200 mb-6" />
          <h2 className="text-2xl font-black text-slate-800 mb-4">HENÜZ KARTINIZ YOK</h2>
          <p className="text-slate-500 mb-8 font-medium">Analiz yapabilmek için önce bir kart eklemelisiniz.</p>
          <button onClick={onBack} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black">GERİ DÖN</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-0 pb-0">
      {/* Header Section */}
      <div className="flex flex-col gap-8 mb-12">
        {/* Top Row: Title and Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 flex items-center justify-center rounded-2xl ${isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              <BarChart3 size={24} />
            </div>
            <div>
              <h1 data-v-updated="header-new" className={`text-2xl sm:text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Analiz & Rapor</h1>
            </div>
          </div>
        </div>

        {/* Filtering Section - Now above PDF on mobile */}
        <div className={`p-6 sm:p-10 rounded-[40px] border transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              <h3 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>FİLTRELEME</h3>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4">
              {(['today', 'thisweek', 'thismonth', 'thisyear', 'custom'] as TimeRange[]).map(range => (
                <button
                  key={range}
                  onClick={() => {
                    React.startTransition(() => {
                      setTimeRange(range);
                    });
                  }}
                  className={`px-3 py-4 sm:px-6 sm:py-3.5 rounded-[20px] text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 select-none border ${timeRange === range
                    ? (isDarkMode
                      ? 'bg-slate-700 text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] border-black/20 translate-y-[1px]'
                      : 'bg-white text-blue-600 shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] border-slate-200/50 translate-y-[1px]')
                    : isDarkMode
                      ? 'bg-[#0f172a]/80 text-slate-400 border-slate-800/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] hover:bg-[#1e293b]'
                      : 'bg-white text-slate-500 border-slate-100 shadow-sm hover:bg-slate-50 hover:border-slate-200'
                    } active:scale-95`}
                >
                  {range === 'today' ? 'Bugün' : range === 'thisweek' ? 'Bu Hafta' : range === 'thismonth' ? 'Bu Ay' : range === 'thisyear' ? 'Bu Yıl' : 'Özel'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Banka Seçimi</label>
                <div className="relative group">
                  <select
                    value={selectedBank}
                    onChange={(e) => {
                      setSelectedBank(e.target.value);
                      setSelectedCardId('all');
                      setCurrentPage(1);
                    }}
                    className={`w-full h-16 px-6 pt-1 rounded-3xl border appearance-none outline-none font-black text-base cursor-pointer transition-all ${isDarkMode ? 'bg-slate-900/50 border-white/5 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-100 text-slate-800 focus:border-blue-500 shadow-sm'}`}
                  >
                    {banks.map(b => (
                      <option key={b} value={b}>
                        {b === 'all' ? 'TÜM BANKALAR' : b.toLocaleUpperCase('tr-TR')}
                      </option>
                    ))}
                  </select>
                  <Filter className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors" size={20} />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">İşlem Yapılan Kart</label>
                <div className="relative group">
                  <select
                    value={selectedCardId}
                    onChange={(e) => {
                      React.startTransition(() => {
                        setSelectedCardId(e.target.value);
                        setCurrentPage(1);
                      });
                    }}
                    className={`w-full h-16 px-6 pt-1 rounded-3xl border appearance-none outline-none font-black text-base cursor-pointer transition-all ${isDarkMode ? 'bg-slate-900/50 border-white/5 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-100 text-slate-800 focus:border-blue-500 shadow-sm'}`}
                  >
                    <option value="all">TÜM KARTLAR</option>
                    {bankFilteredCards.map(card => (
                      <option key={card.id} value={card.id}>{card.bankName.toLocaleUpperCase('tr-TR')} - {card.cardName.toLocaleUpperCase('tr-TR')}</option>
                    ))}
                  </select>
                  <CardIcon className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors" size={20} />
                </div>
              </div>
            </div>

            {timeRange === 'custom' && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <DateRangePicker
                  startDate={customStart}
                  endDate={customEnd}
                  onChange={(start, end) => {
                    setCustomStart(start);
                    setCustomEnd(end);
                  }}
                  isDarkMode={isDarkMode}
                  label="Özel Tarih Seçimi"
                />
              </div>
            )}
          </div>
        </div>

        <button onClick={exportToPDF} disabled={isExporting} className={`flex items-center justify-center gap-3 px-8 py-5 rounded-[40px] font-black text-sm transition-all active:scale-95 ${isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 shadow-xl'} ${isDarkMode ? 'bg-blue-600 text-white shadow-blue-900/40' : 'bg-blue-600 text-white shadow-blue-200'}`}>
          {isExporting ? <RefreshCw className="animate-spin" size={20} /> : <Printer size={20} />}
          {isExporting ? 'HAZIRLANIYOR...' : 'PDF RAPOR İNDİR'}
        </button>
      </div>

      {/* Stats and Trend Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className={`p-8 rounded-[40px] border relative overflow-hidden group ${isDarkMode ? 'bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border-white/10' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 shadow-sm'}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
          <p className="text-[11px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4">
            {selectedCardId === 'all' ? 'DÖNEM NET DURUMU' : 'SEÇİLİ KART DÖNEM NETİ'}
          </p>
          <div className="flex items-baseline gap-2 mb-2">
            <span className={`text-2xl font-black ${cardStats.cardData!.balance === 0 ? (isDarkMode ? 'text-white' : 'text-slate-900') : (cardStats.cardData!.balance < 0 ? 'text-emerald-500' : (isDarkMode ? 'text-white' : 'text-slate-900'))}`}>
              {cardStats.cardData!.balance === 0 ? '' : (cardStats.cardData!.balance < 0 ? '+' : '-')}
            </span>
            <RollingNumber
              value={Math.abs(cardStats.cardData!.balance)}
              className={`text-4xl font-black tracking-tighter ${cardStats.cardData!.balance === 0 ? (isDarkMode ? 'text-white' : 'text-slate-900') : (cardStats.cardData!.balance < 0 ? 'text-emerald-500' : (isDarkMode ? 'text-white' : 'text-slate-900'))}`}
            />
          </div>
          <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
            <Clock size={14} />
            <span>Son Güncelleme: {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        <div className={`p-8 rounded-[40px] border flex items-center justify-between ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white shadow-sm border-slate-100'}`}>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">DÖNEM HARCAMASI</p>
            <RollingNumber
              value={cardStats.spending}
              className={`text-2xl font-black ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}
            />
          </div>
          <div className={`w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center ${isDarkMode ? 'text-rose-400' : 'text-rose-500'}`}>
            <TrendingUp size={24} />
          </div>
        </div>

        <div className={`p-8 rounded-[40px] border flex items-center justify-between ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white shadow-sm border-slate-100'}`}>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">ASGARİ ÖDEME</p>
            <RollingNumber
              value={cardStats.minPayment}
              className={`text-2xl font-black ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}
            />
          </div>
          <div className={`w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center ${isDarkMode ? 'text-emerald-400' : 'text-emerald-500'}`}>
            <Zap size={24} />
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className={`p-10 rounded-[40px] border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-center gap-4 mb-10">
            <div className="w-1.5 h-6 bg-rose-500 rounded-full"></div>
            <h3 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>HARCAMA TRENDİ</h3>
          </div>
          <div className="h-[320px] sm:h-[400px] -ml-4 sm:-ml-2">
            <ResponsiveContainer width="100%" height="100%">
              {/* ... chart content remains the same ... */}
              <BarChart
                data={trendData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barGap={8}
              >
                <defs>
                  <linearGradient id="3dSpending" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#e11d48" />
                    <stop offset="50%" stopColor="#fb7185" />
                    <stop offset="100%" stopColor="#e11d48" />
                  </linearGradient>
                  <linearGradient id="3dPayment" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#059669" />
                    <stop offset="50%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  minTickGap={40}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(val) => `${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val} ₺`}
                />
                <Tooltip
                  cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className={`p-5 rounded-[24px] border-none shadow-2xl backdrop-blur-md transition-all duration-300 ${isDarkMode ? 'bg-[#1e293b]/90 border border-white/5' : 'bg-white/90 border border-slate-100'}`}>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">{label}</p>
                          <div className="space-y-2">
                            {payload.map((entry: any, index: number) => (
                              <div key={index} className="flex items-center justify-between gap-6">
                                <span className={`text-[13px] font-bold ${entry.name === 'Harcamalar' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                  {entry.name}:
                                </span>
                                <span className={`text-[13px] font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                  {entry.value.toLocaleString('tr-TR')} ₺
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="spending"
                  name="Harcamalar"
                  fill="url(#3dSpending)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={timeRange === 'thisyear' ? 20 : 12}
                  animationDuration={800}
                />
                <Bar
                  dataKey="payment"
                  name="Ödemeler"
                  fill="url(#3dPayment)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={timeRange === 'thisyear' ? 20 : 12}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Distribution Sliding Banner */}
      <div className="mb-12 overflow-hidden relative group">
        <div className="flex items-center gap-4 mb-6 px-2">
          <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
          <h3 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>KATEGORİ DAĞILIMI</h3>
        </div>

        <div
          ref={marqueeRef}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeaveCapture={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          className="relative overflow-hidden no-scrollbar py-6 cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: 'pan-y' }}
        >
          <div
            className="flex w-fit gap-6 px-6"
            style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
          >
            {/* Triple the list for robust infinite multi-directional effect */}
            {[...categoryData, null, ...categoryData, null, ...categoryData, null].map((cat, idx) => (
              cat ? (
                <div
                  key={idx}
                  className={`flex-shrink-0 min-w-[320px] p-5 rounded-[32px] border flex items-center gap-4 transition-all hover:scale-105 active:scale-95 ${isDarkMode ? 'bg-white/5 border-white/5 shadow-xl shadow-black/20' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'
                    }`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-1.5 h-10 rounded-full shrink-0 shadow-lg" style={{ backgroundColor: (cat as any).color, boxShadow: `0 0 15px ${(cat as any).color}40` }} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-[13px] font-black tracking-tight truncate leading-tight uppercase ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        {(cat as any).name}
                      </p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 opacity-60">
                        %{(((cat as any).value / (cardStats.spending || 1)) * 100).toFixed(0)} PAY
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <RollingNumber
                      value={(cat as any).value}
                      className={`text-lg font-black tracking-tighter ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}
                    />
                    <span className="text-[11px] font-bold text-slate-500 ml-1">₺</span>
                  </div>
                </div>
              ) : (
                <div key={idx} className="flex-shrink-0 w-[320px] flex items-center justify-center">
                  <div className={`w-1 h-8 rounded-full opacity-10 ${isDarkMode ? 'bg-white' : 'bg-slate-900'}`} />
                </div>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Section */}
      <div id="analysis-transactions" className="grid grid-cols-1 gap-8 mb-0 scroll-mt-14 sm:scroll-mt-24">
        <div className={`p-8 sm:p-12 rounded-[40px] border transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-10 bg-blue-600 rounded-full"></div>
              <h3 className={`text-2xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>İŞLEM GEÇMİŞİ</h3>
            </div>
          </div>



          {filteredTransactions.length > 0 ? (
            <>
              <div className="flex gap-4 sm:gap-6 items-stretch">
                {/* Left: Transaction List - Fixed min-height for 5 items */}
                <div
                  className={`flex-1 space-y-2.5 min-w-0 transition-all duration-200 ease-out min-h-[457px] ${slideDirection !== null ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
                    }`}
                >
                  {paginatedTransactions.map(tx => {
                    const card = cards.find(c => c.id === tx.cardId);
                    const cardColor = card?.color || '#3b82f6';
                    const cardName = card?.cardName || tx.cardName || 'Bilinmeyen Kart';
                    const categoryInfo = categories.find(c => c.name.toLocaleLowerCase('tr-TR') === (tx.category || 'Diğer').toLocaleLowerCase('tr-TR'));
                    const categoryColor = categoryInfo?.color || cardColor;
                    const isSpending = tx.type === 'spending';

                    return (
                      <div key={tx.id} className={`relative p-3.5 sm:px-5 sm:py-3.5 rounded-[24px] border transition-all ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                        {/* Mobile Layout */}
                        <div className="flex flex-col gap-3 sm:hidden">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-1 h-4 rounded-full shrink-0 ${isSpending ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'}`} />
                              <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {isSpending ? 'HARCAMA' : 'ÖDEME'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => onEditTransaction?.(tx)} className={`p-2 rounded-lg transition-all ${isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}><Edit2 size={12} /></button>
                              <button onClick={() => onDeleteTransaction?.(tx)} className={`p-2 rounded-lg transition-all ${isDarkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600'}`}><Trash2 size={12} /></button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <p className={`text-[13px] font-black tracking-tight truncate flex-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                {tx.description || tx.category}
                              </p>
                              {tx.confirmationUrl && (
                                <a href={tx.confirmationUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-blue-500" onClick={(e) => e.stopPropagation()}><ExternalLink size={12} /></a>
                              )}
                            </div>
                            <p className={`text-sm font-black tracking-tighter shrink-0 ${isSpending ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {isSpending ? '-' : '+'} {tx.amount.toLocaleString('tr-TR')} ₺
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-white shadow-sm" style={{ backgroundColor: categoryColor }}>
                              {tx.category || 'Diğer'}
                            </div>
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest opacity-60">{formatDateDisplay(tx.date)}</p>
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden sm:flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={`p-2.5 rounded-xl shrink-0 ${isSpending ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                              {isSpending ? <ShoppingBag size={16} /> : <PaymentIcon size={16} />}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`font-black text-sm tracking-tight truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                                  {tx.description || tx.category}
                                </p>
                                {tx.confirmationUrl && (
                                  <a href={tx.confirmationUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 p-1 rounded-md text-blue-500 hover:bg-blue-500/10 transition-colors" onClick={(e) => e.stopPropagation()}><ExternalLink size={12} /></a>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="px-2 py-0.5 rounded-md border text-[8px] font-black tracking-widest" style={{ color: cardColor, borderColor: `${cardColor}40`, backgroundColor: `${cardColor}15` }}>
                                  {cardName.toLocaleUpperCase('tr-TR')}
                                </div>
                                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{formatDateDisplay(tx.date)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-5">
                            <p className={`text-base font-black tracking-tighter ${isSpending ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {isSpending ? '-' : '+'} {tx.amount.toLocaleString('tr-TR')} ₺
                            </p>
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => onEditTransaction?.(tx)} className={`p-2 rounded-xl transition-all border ${isDarkMode ? 'bg-blue-500/5 text-blue-400 border-blue-500/10 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'}`} title="Düzenle"><Edit2 size={14} /></button>
                              <button onClick={() => onDeleteTransaction?.(tx)} className={`p-2 rounded-xl transition-all border ${isDarkMode ? 'bg-rose-500/5 text-rose-400 border-rose-500/10 hover:bg-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'}`} title="Sil"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right: Vertical Pagination tower (Hidden on Mobile) */}
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
                    >
                      <ChevronLeft size={20} className="stroke-[2.5px] rotate-90" />
                    </button>

                    <div className="flex flex-col items-center gap-1.5 py-1">
                      <div className={`relative w-10 h-14 overflow-hidden rounded-[20px] border transition-all duration-500 ${isDarkMode
                        ? 'bg-slate-800 border-slate-700 shadow-[inset_0_3px_8px_rgba(0,0,0,0.5),_0_1px_1px_rgba(255,255,255,0.05)]'
                        : 'bg-white border-slate-200 shadow-[inset_0_3px_8px_rgba(0,0,0,0.1),_0_1px_2px_rgba(0,0,0,0.05)]'
                        }`}>
                        <div
                          className="absolute inset-0 flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                          style={{ transform: `translateY(-${(currentPage - 1) * 100}%)` }}
                        >
                          {[...Array(totalPages)].map((_, i) => (
                            <div key={i} className={`min-h-full w-full flex items-center justify-center text-[13px] font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-blue-600'}`}>
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
                    >
                      <ChevronRight size={20} className="stroke-[2.5px] rotate-90" />
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

              <div className="mt-[30px] sm:mt-[-18px] flex justify-center">
                <div className={`px-8 py-3.5 rounded-[20px] text-[11px] font-black uppercase tracking-[0.2em] border transition-all ${isDarkMode
                  ? 'bg-slate-800/40 border-slate-800/60 text-slate-500 shadow-[0_4px_20px_rgba(0,0,0,0.2)]'
                  : 'bg-slate-50/80 border-slate-100 text-slate-400 shadow-[0_4px_15px_rgba(0,0,0,0.02)]'}`}
                >
                  TOPLAM {filteredTransactions.length} KAYIT BULUNUYOR
                </div>
              </div>
            </>
          ) : (
            <div className="py-32 text-center">
              <Inbox size={80} className="mx-auto text-slate-200/40 mb-8" />
              <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-sm animate-pulse italic">KAYIT BULUNAMADI</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
