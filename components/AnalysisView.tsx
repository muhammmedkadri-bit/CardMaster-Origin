
import React, { useMemo, useState, useRef } from 'react';
import RollingNumber from './RollingNumber';
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
  const [selectedCardId, setSelectedCardId] = React.useState<string>('all');
  const [timeRange, setTimeRange] = React.useState<TimeRange>('thismonth');
  const [customStart, setCustomStart] = React.useState<string>(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = React.useState<string>(new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const ITEMS_PER_PAGE = 10;

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


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

  const filteredTransactions = useMemo(() => {
    const cardFiltered = selectedCardId === 'all'
      ? transactions
      : transactions.filter(t => t.cardId === selectedCardId);

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
      .map(t => ({ ...t, _ts: new Date(t.date).getTime() }))
      .filter(t => t._ts >= startMs && t._ts <= endMs)
      .sort((a, b) => b._ts - a._ts);
  }, [selectedCardId, transactions, timeRange, customStart, customEnd, lastUpdate]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCardId, timeRange, customStart, customEnd]);

  const cardStats = useMemo(() => {
    const cardData = selectedCardId === 'all'
      ? { bankName: 'Tüm Kartlar', cardName: 'Genel Bakış', limit: cards.reduce((a, b) => a + b.limit, 0), balance: cards.reduce((a, b) => a + b.balance, 0) }
      : cards.find(c => c.id === selectedCardId);

    const spending = filteredTransactions
      .filter(t => t.type === 'spending')
      .reduce((acc, t) => acc + t.amount, 0);

    const payment = filteredTransactions
      .filter(t => t.type === 'payment')
      .reduce((acc, t) => acc + t.amount, 0);

    let minPayment = 0;
    if (cardData) {
      const ratio = (cardData as CreditCard).minPaymentRatio || 20;
      minPayment = (cardData.balance * ratio) / 100;
    }

    return { cardData, spending, payment, minPayment };
  }, [selectedCardId, cards, filteredTransactions, lastUpdate]);

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

    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    // Initialize data with all dates in range to ensure a continuous line
    const tempDate = new Date(start);
    while (tempDate <= end) {
      const label = timeRange === 'thisyear'
        ? `${monthNames[tempDate.getMonth()]} ${tempDate.getFullYear()}`
        : `${tempDate.getDate()} ${monthNames[tempDate.getMonth()]}`;

      if (!data[label]) {
        data[label] = { label, spending: 0, payment: 0, net: 0, timestamp: tempDate.getTime() };
      }

      if (timeRange === 'thisyear') {
        tempDate.setMonth(tempDate.getMonth() + 1);
      } else {
        tempDate.setDate(tempDate.getDate() + 1);
      }
    }

    filteredTransactions.forEach(t => {
      const d = new Date(t.date);
      const label = timeRange === 'thisyear'
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
    <div className="pt-0 pb-24">
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
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">İşlem Yapılan Kart</label>
              <div className="relative group">
                <select
                  value={selectedCardId}
                  onChange={(e) => {
                    React.startTransition(() => {
                      setSelectedCardId(e.target.value);
                    });
                  }}
                  className={`w-full h-16 px-6 pt-1 rounded-3xl border appearance-none outline-none font-black text-base cursor-pointer transition-all ${isDarkMode ? 'bg-slate-900/50 border-white/5 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-100 text-slate-800 focus:border-blue-500 shadow-sm'}`}
                >
                  <option value="all">TÜM KARTLAR</option>
                  {cards.map(card => (
                    <option key={card.id} value={card.id}>{card.bankName.toUpperCase()} - {card.cardName.toUpperCase()}</option>
                  ))}
                </select>
                <Filter className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors" size={20} />
              </div>
            </div>

            {timeRange === 'custom' && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Başlangıç</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className={`w-full h-16 px-6 rounded-3xl border outline-none font-black text-sm ${isDarkMode ? 'bg-slate-900/50 border-white/5 text-white' : 'bg-slate-50 border-slate-100'}`}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Bitiş</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className={`w-full h-16 px-6 rounded-3xl border outline-none font-black text-sm ${isDarkMode ? 'bg-slate-900/50 border-white/5 text-white' : 'bg-slate-50 border-slate-100'}`}
                  />
                </div>
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
            {selectedCardId === 'all' ? 'TÜM KARTLARIN TOPLAM BORCU' : 'SEÇİLİ KARTIN BORCU'}
          </p>
          <RollingNumber
            value={cardStats.cardData!.balance}
            className={`text-4xl font-black tracking-tighter mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
          />
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
        <style>
          {`
            @keyframes slide-infinite {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .marquee-animation {
              display: flex;
              width: fit-content;
              animation: slide-infinite 40s linear infinite;
            }
            .marquee-animation:hover {
              animation-play-state: paused;
            }
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .no-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}
        </style>
        <div className="flex items-center gap-4 mb-6 px-2">
          <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
          <h3 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>KATEGORİ DAĞILIMI</h3>
        </div>

        <div className="relative overflow-x-auto no-scrollbar py-2">
          <div className="marquee-animation gap-6 px-6">
            {/* Create a block with a spacer at the end, then duplicate for infinite effect */}
            {[...categoryData, null, ...categoryData, null].map((cat, idx) => (
              cat ? (
                <div
                  key={idx}
                  className={`flex-shrink-0 min-w-[240px] p-5 rounded-[32px] border flex items-center justify-between transition-all hover:scale-105 active:scale-95 ${isDarkMode ? 'bg-white/5 border-white/5 shadow-xl shadow-black/20' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-1.5 h-10 rounded-full shadow-lg" style={{ backgroundColor: (cat as any).color, boxShadow: `0 0 15px ${(cat as any).color}40` }} />
                    <div>
                      <p className={`text-[12px] font-black tracking-[0.1em] ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        {(cat as any).name}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                        %{(((cat as any).value / (cardStats.spending || 1)) * 100).toFixed(0)} PAY
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <RollingNumber
                      value={(cat as any).value}
                      className={`text-lg font-black tracking-tighter ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}
                    />
                    <span className="text-[11px] font-bold text-slate-500 ml-1">₺</span>
                  </div>
                </div>
              ) : (
                <div key={idx} className="flex-shrink-0 w-[240px] flex items-center justify-center">
                  <div className={`w-1 h-8 rounded-full opacity-10 ${isDarkMode ? 'bg-white' : 'bg-slate-900'}`} />
                </div>
              )
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="grid grid-cols-1 gap-8 mb-16">
        <div className={`p-8 sm:p-12 rounded-[40px] border transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-10 bg-blue-600 rounded-full"></div>
              <h3 className={`text-2xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>İŞLEM GEÇMİŞİ</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                TOPLAM {filteredTransactions.length} KAYIT
              </div>
              {totalPages > 1 && (
                <div className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                  SAYFA {currentPage} / {totalPages}
                </div>
              )}
            </div>
          </div>

          {filteredTransactions.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto no-scrollbar min-h-[600px]">
                <table className="w-full border-separate border-spacing-y-4">
                  <thead>
                    <tr className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] text-left">
                      <th className="px-6 py-2">TARİH</th>
                      <th className="px-6 py-2">AÇIKLAMA</th>
                      <th className="px-6 py-2">KART</th>
                      <th className="px-6 py-2 text-right">TUTAR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map(tx => {
                      const card = cards.find(c => c.id === tx.cardId);
                      const cardColor = card?.color || '#3b82f6';
                      const cardName = card?.cardName || tx.cardName || 'Bilinmeyen Kart';
                      return (
                        <tr key={tx.id} className={`group transition-all ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                          <td className="py-6 px-6 first:rounded-l-[32px] last:rounded-r-[32px]">
                            <p className="text-xs font-black text-slate-400">{formatDateDisplay(tx.date)}</p>
                          </td>
                          <td className="py-6 px-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tx.type === 'spending' ? 'bg-rose-500/10 text-rose-500 shadow-lg shadow-rose-500/10' : 'bg-emerald-500/10 text-emerald-500 shadow-lg shadow-emerald-500/10'}`}>
                                {tx.type === 'spending' ? <ShoppingBag size={20} /> : <PaymentIcon size={20} />}
                              </div>
                              <div className="flex items-center gap-2">
                                <p className={`text-sm sm:text-base font-black tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{tx.description || tx.category}</p>
                                {tx.confirmationUrl && (
                                  <a href={tx.confirmationUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 transition-colors" title="Dekont" onClick={(e) => e.stopPropagation()}><ExternalLink size={14} /></a>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-6 px-6">
                            <span className="px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest whitespace-nowrap" style={{ color: cardColor, borderColor: `${cardColor}40`, backgroundColor: `${cardColor}05` }}>
                              {cardName}
                            </span>
                          </td>
                          <td className={`py-6 px-6 text-right first:rounded-l-[32px] last:rounded-r-[32px]`}>
                            <div className="flex flex-col items-end gap-2">
                              <p className={`text-xl sm:text-2xl font-black tracking-tighter ${tx.type === 'spending' ? 'text-rose-500' : 'text-emerald-500'} whitespace-nowrap flex items-center justify-end`}>
                                <span className="opacity-70 mr-1">{tx.type === 'spending' ? '-' : '+'}</span>
                                <span>{tx.amount.toLocaleString('tr-TR')} ₺</span>
                              </p>
                              <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onEditTransaction?.(tx)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:text-blue-400 hover:bg-slate-700' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100'}`}><Edit2 size={16} /></button>
                                <button onClick={() => onDeleteTransaction?.(tx)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-700' : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100'}`}><Trash2 size={16} /></button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Transaction List View (Paginated) */}
              <div className="sm:hidden space-y-4">
                {paginatedTransactions.map(tx => {
                  const card = cards.find(c => c.id === tx.cardId);
                  const cardColor = card?.color || '#3b82f6';
                  const cardName = card?.cardName || tx.cardName || 'Bilinmeyen Kart';
                  const isSpending = tx.type === 'spending';

                  return (
                    <div key={tx.id} className={`p-6 rounded-[32px] border flex flex-col gap-4 ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50/50 border-slate-100'}`}>
                      {/* ... mobile transaction content same as before ... */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-1.5 h-6 rounded-full ${isSpending ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]' : 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'}`} />
                          <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {tx.category || 'Diğer'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => onEditTransaction?.(tx)} className={`p-2.5 rounded-xl transition-all active:scale-95 ${isDarkMode ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}><Edit2 size={14} /></button>
                          <button onClick={() => onDeleteTransaction?.(tx)} className={`p-2.5 rounded-xl transition-all active:scale-95 ${isDarkMode ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <div className="py-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-[15px] font-black tracking-tight leading-relaxed break-words ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                            {tx.description || tx.category}
                          </p>
                          {tx.confirmationUrl && (
                            <a href={tx.confirmationUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 transition-colors shrink-0" title="Dekont" onClick={(e) => e.stopPropagation()}><ExternalLink size={14} /></a>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-4 pt-4 border-t border-slate-200/10 dark:border-white/5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest whitespace-nowrap" style={{ color: cardColor, borderColor: `${cardColor}40`, backgroundColor: `${cardColor}15` }}>
                            {cardName}
                          </div>
                          <p className={`text-xl font-black tracking-tighter ${isSpending ? 'text-rose-500' : 'text-emerald-500'} whitespace-nowrap shrink-0 flex items-center`}>
                            <span className="opacity-70 mr-1">{isSpending ? '-' : '+'}</span>
                            <span>{tx.amount.toLocaleString('tr-TR')} ₺</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 opacity-50">
                          <Clock size={12} className="text-slate-400" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatDateDisplay(tx.date)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all border ${currentPage === 1
                        ? 'opacity-30 cursor-not-allowed border-slate-200'
                        : (isDarkMode ? 'bg-slate-800 border-white/5 text-white hover:bg-slate-700' : 'bg-white border-slate-100 text-slate-800 shadow-sm hover:border-blue-200')
                        }`}
                    >
                      <ChevronLeft size={20} />
                    </button>

                    <div className="flex items-center gap-2 px-4">
                      {/* Show current, first, last and dots if necessary */}
                      {[...Array(totalPages)].map((_, i) => {
                        const pg = i + 1;
                        const isCurrent = pg === currentPage;
                        // Show first, last, current, and pages around current
                        if (pg === 1 || pg === totalPages || (pg >= currentPage - 1 && pg <= currentPage + 1)) {
                          return (
                            <button
                              key={pg}
                              onClick={() => setCurrentPage(pg)}
                              className={`w-12 h-12 rounded-2xl text-xs font-black transition-all border ${isCurrent
                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : (isDarkMode ? 'bg-slate-800/50 border-white/5 text-slate-400 hover:text-white' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-blue-200')
                                }`}
                            >
                              {pg}
                            </button>
                          );
                        } else if (pg === currentPage - 2 || pg === currentPage + 2) {
                          return <span key={pg} className="text-slate-400">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all border ${currentPage === totalPages
                        ? 'opacity-30 cursor-not-allowed border-slate-200'
                        : (isDarkMode ? 'bg-slate-800 border-white/5 text-white hover:bg-slate-700' : 'bg-white border-slate-100 text-slate-800 shadow-sm hover:border-blue-200')
                        }`}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              )}
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
