
import React, { useMemo, useState, useRef } from 'react';
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
  ArrowLeft,
  FileText,
  TrendingUp,
  TrendingDown,
  BarChart3,
  CreditCard as CardIcon,
  Filter,
  ChevronRight,
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
  Trash2
} from 'lucide-react';

interface AnalysisViewProps {
  cards: CreditCard[];
  transactions: Transaction[];
  isDarkMode: boolean;
  onBack: () => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (tx: Transaction) => void;
  categories: Category[];
}

type TimeRange = '7days' | '30days' | 'year' | 'custom';

const AnalysisView: React.FC<AnalysisViewProps> = ({ cards, transactions, isDarkMode, onBack, onEditTransaction, onDeleteTransaction, categories }) => {
  const [selectedCardId, setSelectedCardId] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');
  const [customStart, setCustomStart] = useState<string>(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = useState(false);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y.slice(-2)}`;
  };

  const filteredTransactions = useMemo(() => {
    const cardFiltered = selectedCardId === 'all'
      ? transactions
      : transactions.filter(t => t.cardId === selectedCardId);

    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (timeRange === '7days') {
      start.setDate(now.getDate() - 7);
    } else if (timeRange === '30days') {
      start.setMonth(now.getMonth() - 1);
    } else if (timeRange === 'year') {
      start.setFullYear(now.getFullYear() - 1);
    } else if (timeRange === 'custom') {
      start = new Date(customStart);
      end = new Date(customEnd);
      end.setHours(23, 59, 59);
    }

    return cardFiltered.filter(t => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });
  }, [selectedCardId, transactions, timeRange, customStart, customEnd]);

  const cardStats = useMemo(() => {
    const cardData = selectedCardId === 'all'
      ? { bankName: 'Tüm Kartlar', cardName: 'Genel Bakış', limit: cards.reduce((a, b) => a + b.limit, 0), balance: cards.reduce((a, b) => a + b.balance, 0) }
      : cards.find(c => c.id === selectedCardId);

    const spending = filteredTransactions.filter(t => t.type === 'spending').reduce((a, b) => a + b.amount, 0);
    const payment = filteredTransactions.filter(t => t.type === 'payment').reduce((a, b) => a + b.amount, 0);

    let minPayment = 0;
    if (selectedCardId === 'all') {
      minPayment = cards.reduce((acc, c) => acc + (c.balance > 0 ? (c.balance * (c.minPaymentRatio / 100)) : 0), 0);
    } else {
      const c = cards.find(x => x.id === selectedCardId);
      if (c && c.balance > 0) minPayment = c.balance * (c.minPaymentRatio / 100);
    }

    return { cardData, spending, payment, minPayment };
  }, [selectedCardId, cards, filteredTransactions]);

  const trendData = useMemo(() => {
    const data: Record<string, { label: string, spending: number, payment: number, timestamp: number }> = {};
    const now = new Date();
    let start = new Date();
    let resolution: 'day' | 'month' = 'day';

    if (timeRange === '7days') {
      start.setDate(now.getDate() - 7);
    } else if (timeRange === '30days') {
      start.setDate(now.getDate() - 30);
    } else if (timeRange === 'year') {
      start.setFullYear(now.getFullYear() - 1);
      resolution = 'month';
    } else {
      start = new Date(customStart);
      const end = new Date(customEnd);
      const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 365) resolution = 'month';
    }

    let curr = new Date(start);
    const endLimit = timeRange === 'custom' ? new Date(customEnd) : new Date();

    while (curr <= endLimit) {
      const key = resolution === 'day'
        ? curr.toISOString().split('T')[0]
        : `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, '0')}`;

      const label = resolution === 'day'
        ? `${curr.getDate()} ${curr.toLocaleString('tr-TR', { month: 'short' })}`
        : curr.toLocaleString('tr-TR', { month: 'short', year: '2-digit' });

      if (!data[key]) {
        data[key] = { label, spending: 0, payment: 0, timestamp: curr.getTime() };
      }
      if (resolution === 'day') curr.setDate(curr.getDate() + 1);
      else curr.setMonth(curr.getMonth() + 1);
    }

    filteredTransactions.forEach(t => {
      const d = new Date(t.date);
      const key = resolution === 'day' ? t.date : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (data[key]) {
        if (t.type === 'spending') data[key].spending += t.amount;
        else data[key].payment += t.amount;
      }
    });

    return Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
  }, [filteredTransactions, timeRange, customStart, customEnd]);

  const exportToPDF = async () => {
    setIsExporting(true);

    const cardInfo = selectedCardId === 'all'
      ? 'Tüm Kartlar - Genel Bakış'
      : `${(cardStats.cardData as CreditCard)?.bankName} - ${(cardStats.cardData as CreditCard)?.cardName}`;

    const reportPeriod = timeRange === 'custom'
      ? `${formatDateDisplay(customStart)} - ${formatDateDisplay(customEnd)}`
      : timeRange === '7days' ? 'Son 7 Gün'
        : timeRange === '30days' ? 'Son 30 Gün'
          : 'Bu Yıl';

    const currentDate = new Date().toLocaleString('tr-TR');

    try {
      const jspdfLib = (window as any).jspdf;
      if (!jspdfLib) throw new Error('jsPDF library not found on window.jspdf');

      const doc = new jspdfLib.jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;

      // --- TURKISH FONT SUPPORT ---
      try {
        const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
        const fontBoldUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf';

        const fetchFont = async (url: string) => {
          const resp = await fetch(url);
          const buff = await resp.arrayBuffer();
          let binary = '';
          const bytes = new Uint8Array(buff);
          for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
          return btoa(binary);
        };

        const fontBase64 = await fetchFont(fontUrl);
        const fontBoldBase64 = await fetchFont(fontBoldUrl);

        doc.addFileToVFS('Roboto-Regular.ttf', fontBase64);
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        doc.addFileToVFS('Roboto-Bold.ttf', fontBoldBase64);
        doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

        doc.setFont('Roboto', 'normal');
      } catch (fontErr) {
        console.warn('Custom font load failed, falling back to Helvetica', fontErr);
        doc.setFont('helvetica', 'normal');
      }

      const formatCurrency = (amount: number, showSign: boolean = false) => {
        const absAmount = Math.abs(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 });
        const sign = (showSign && amount > 0) ? '-' : '';
        return `${sign}${absAmount} ₺`;
      };

      // --- 1. PREMIUM HEADER ---
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, pageWidth, 2, 'F');

      const logoX = margin;
      const logoY = 15;

      doc.setFillColor(96, 165, 250);
      doc.roundedRect(logoX + 2.5, logoY, 9, 6, 1, 1, 'F');
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.2);
      doc.roundedRect(logoX + 1.25, logoY + 2, 9, 6, 1, 1, 'FD');
      doc.setFillColor(37, 99, 235);
      doc.roundedRect(logoX, logoY + 4, 9, 6, 1, 1, 'F');
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(logoX + 1, logoY + 5.5, 2, 1.5, 0.4, 0.4, 'F');

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(18);
      doc.setFont('Roboto', 'bold');
      doc.text('CARD', logoX + 14, logoY + 6.5);
      doc.setFont('Roboto', 'normal');
      doc.setTextColor(37, 99, 235);
      doc.text('MASTER', logoX + 33, logoY + 6.5);

      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.setFont('Roboto', 'bold');
      doc.text('KART TAKİP ASİSTANI', logoX + 14, logoY + 10, { charSpace: 0.5 });

      // Document Info
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('Roboto', 'bold');
      doc.text('ANALİZ RAPORU', pageWidth - margin, logoY + 4, { align: 'right' });
      doc.setFontSize(8);
      doc.setFont('Roboto', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`OLUŞTURULMA: ${currentDate.split(' ')[0]}`, pageWidth - margin, logoY + 8, { align: 'right' });
      doc.text(`DÖNEM: ${reportPeriod.toUpperCase()}`, pageWidth - margin, logoY + 11.5, { align: 'right' });

      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.1);
      doc.line(margin, logoY + 18, pageWidth - margin, logoY + 18);

      // --- 2. REPORT SCOPE ---
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.setFont('Roboto', 'bold');
      doc.text('RAPOR KAPSAMI', margin, logoY + 28);
      doc.setFont('Roboto', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(`${cardInfo}`, margin, logoY + 33);

      // --- 3. METRICS GRID (With Icons) ---
      const boxWidth = (pageWidth - (margin * 2) - 15) / 4;
      const metricsY = logoY + 45;

      const drawMetric = (x: number, label: string, value: string, color: number[], type: 'spending' | 'debt' | 'min' | 'limit') => {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(241, 245, 249);
        doc.roundedRect(x, metricsY, boxWidth, 22, 3, 3, 'FD');

        // Modern Alpha Fix: Handle potential "black background" by manually calculating light RGB
        const r = Math.round(255 - (255 - color[0]) * 0.12);
        const g = Math.round(255 - (255 - color[1]) * 0.12);
        const b = Math.round(255 - (255 - color[2]) * 0.12);
        doc.setFillColor(r, g, b);
        doc.circle(x + 7, metricsY + 7, 4, 'F');

        doc.setDrawColor(color[0], color[1], color[2]);
        doc.setLineWidth(0.35);
        if (type === 'spending') {
          // ShoppingBag Icon
          doc.rect(x + 5.5, metricsY + 6, 3, 2.5, 'D'); // Bag body
          doc.line(x + 6, metricsY + 6, x + 6, metricsY + 5.2); // Handle left
          doc.line(x + 8, metricsY + 6, x + 8, metricsY + 5.2); // Handle right
          doc.line(x + 6, metricsY + 5.2, x + 8, metricsY + 5.2); // Handle top
        } else if (type === 'debt') {
          // CreditCard Icon
          doc.roundedRect(x + 5, metricsY + 5.5, 4, 3, 0.5, 0.5, 'D'); // Card body
          doc.line(x + 5, metricsY + 6.3, x + 9, metricsY + 6.3); // Magnetic stripe
        } else if (type === 'min') {
          // Zap Icon (Lightning)
          doc.line(x + 7.5, metricsY + 4.5, x + 6, metricsY + 7); // Top segment
          doc.line(x + 6, metricsY + 7, x + 8, metricsY + 7); // Middle bar
          doc.line(x + 8, metricsY + 7, x + 6.5, metricsY + 9.5); // Bottom segment
        } else if (type === 'limit') {
          // TrendingUp Icon
          doc.line(x + 5.5, metricsY + 8.5, x + 8.5, metricsY + 5.5); // Diagonal
          doc.line(x + 7, metricsY + 5.5, x + 8.5, metricsY + 5.5); // Tip top
          doc.line(x + 8.5, metricsY + 7, x + 8.5, metricsY + 5.5); // Tip right
        }

        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.setFont('Roboto', 'bold');
        doc.text(label, x + 13, metricsY + 7.5);

        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.setFont('Roboto', 'bold');
        doc.text(value, x + 6, metricsY + 16);
      };

      drawMetric(margin, 'HARCAMA', formatCurrency(cardStats.spending), [239, 68, 68], 'spending');
      drawMetric(margin + boxWidth + 5, 'BORÇ', formatCurrency(cardStats.cardData?.balance || 0, true), [37, 99, 235], 'debt');
      drawMetric(margin + (boxWidth * 2) + 10, 'ASGARİ', formatCurrency(cardStats.minPayment), [16, 185, 129], 'min');
      drawMetric(margin + (boxWidth * 3) + 15, 'LİMİT', formatCurrency((cardStats.cardData?.limit || 0) - (cardStats.cardData?.balance || 0)), [71, 85, 105], 'limit');

      // --- 4. DATA TABLE ---
      const hexToRgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b];
      };

      const tableData = filteredTransactions.map(t => [
        formatDateDisplay(t.date),
        (t.description || 'İŞLEM').toUpperCase(),
        (t.category || 'DİĞER').toUpperCase(),
        (t.cardName || 'BİLİNMEYEN').toUpperCase(),
        formatCurrency(t.amount)
      ]);

      (doc as any).autoTable({
        startY: metricsY + 32,
        head: [['TARİH', 'İŞLEM AÇIKLAMASI', 'KATEGORİ', 'KART', 'TUTAR']],
        body: tableData,
        theme: 'grid',
        styles: { font: 'Roboto', fontStyle: 'normal' },
        headStyles: {
          fillColor: [248, 250, 252],
          textColor: [71, 85, 105],
          fontSize: 7,
          fontStyle: 'bold',
          cellPadding: { top: 7, right: 4, bottom: 5, left: 10 }
        },
        bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
        columnStyles: { 4: { halign: 'right', fontStyle: 'bold' } },
        didDrawCell: (data: any) => {
          if (data.section === 'head' && data.column.index !== undefined) {
            const x = data.cell.x + 4;
            const y = data.cell.y + data.cell.height / 2;
            doc.setDrawColor(71, 85, 105);
            doc.setLineWidth(0.25);

            if (data.column.index === 0) { // Date
              doc.rect(x - 1, y - 1.5, 3, 3, 'D'); // Calendar body
              doc.line(x - 1, y - 0.5, x + 2, y - 0.5); // Calendar line
            } else if (data.column.index === 1) { // Description
              doc.line(x - 1, y - 1, x + 2, y - 1);
              doc.line(x - 1, y, x + 1, y);
              doc.line(x - 1, y + 1.5, x + 1.5, y + 1.5);
            } else if (data.column.index === 2) { // Category
              doc.circle(x, y, 1.3, 'D');
              doc.line(x + 1, y - 1, x - 1, y + 1);
            } else if (data.column.index === 3) { // Card
              doc.roundedRect(x - 1.5, y - 1, 3, 2.2, 0.4, 0.4, 'D');
              doc.line(x - 1.5, y - 0.2, x + 1.5, y - 0.2);
            } else if (data.column.index === 4) { // Amount
              doc.circle(x + 0.5, y, 1.8, 'D');
              doc.line(x - 0.5, y, x + 1.5, y);
            }
          }

          if (data.section === 'body' && data.column.index === 3) {
            const tx = filteredTransactions[data.row.index];
            const cardData = cards.find(c => c.id === tx.cardId);
            if (cardData) {
              const [r, g, b] = hexToRgb(cardData.color);
              doc.setTextColor(r, g, b);
              doc.setFont('Roboto', 'bold');
            }
          }
        },
        margin: { left: margin, right: margin },
        tableLineColor: [241, 245, 249]
      });

      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('cardmaster.app - Stratejik Finansal Analiz Raporu', pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });

      doc.save(`Analiz_Raporu_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert('Analiz raporu oluşturulurken bir hata oluştu.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 pt-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      {/* Cinematic Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[-5%] w-[30%] h-[30%] bg-blue-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-indigo-500/10 blur-[120px] rounded-full"></div>
      </div>

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-16">
        <div className="flex items-center gap-8 group">
          <button
            onClick={onBack}
            className={`p-5 rounded-[24px] transition-all active:scale-95 shadow-2xl border flex items-center justify-center ${isDarkMode ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-blue-500/50' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-blue-200'}`}
          >
            <ArrowLeft size={28} />
          </button>
          <div className="relative">
            <h1 className={`text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-black'} group-hover:translate-x-1 transition-transform`}>
              ANALİZ PANELİ
            </h1>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-5 w-full lg:w-auto">
          <div className="relative group flex-1 sm:w-72">
            <div className={`absolute inset-0 bg-blue-500/30 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            <select
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className={`relative w-full px-8 py-5 rounded-[24px] border font-black text-sm outline-none appearance-none transition-all shadow-xl group-hover:scale-[1.02] active:scale-[0.98] ${isDarkMode ? 'bg-slate-900/90 border-white/5 text-white focus:border-blue-500/50' : 'bg-white border-slate-100 text-slate-700'
                }`}
            >
              <option value="all">Tüm Kartlar</option>
              {cards.map(c => <option key={c.id} value={c.id}>{c.bankName} - {c.cardName}</option>)}
            </select>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500">
              <Filter size={18} />
            </div>
          </div>

          <button
            onClick={exportToPDF}
            disabled={isExporting}
            className={`group relative overflow-hidden flex items-center justify-center gap-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white px-10 py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.5)] transition-all hover:scale-[1.05] active:scale-[0.95] disabled:opacity-50 min-w-[200px]`}
          >
            <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
            {isExporting ? <RefreshCw size={22} className="animate-spin" /> : <FileText size={22} className="group-hover:-translate-y-1 transition-transform" />}
            <span>{isExporting ? 'HAZIRLANIYOR' : 'PDF RAPORU'}</span>
          </button>
        </div>
      </div>

      {/* Modern Filter Tabs */}
      <div className="flex flex-col gap-8 mb-16">
        <div className={`p-2.5 rounded-[32px] border flex flex-wrap gap-2 transition-all p-3 shadow-inner ${isDarkMode ? 'bg-slate-900/20 border-white/5' : 'bg-slate-100/50 border-slate-200/50'}`}>
          {(['7days', '30days', 'year', 'custom'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-8 py-4 rounded-[24px] font-black text-[11px] tracking-[0.15em] uppercase transition-all flex items-center gap-3 relative overflow-hidden group ${timeRange === range
                ? 'text-white'
                : (isDarkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')
                }`}
            >
              {timeRange === range && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 animate-in fade-in duration-500"></div>
              )}
              <span className="relative z-10">{range === '7days' ? 'Haftalık' : range === '30days' ? 'Aylık' : range === 'year' ? 'Yıllık' : 'Özel Aralık'}</span>
              {timeRange === range && <div className="relative z-10 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
            </button>
          ))}
        </div>

        {timeRange === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-6 duration-700">
            <div className={`p-8 rounded-[32px] border flex items-center gap-6 ${isDarkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500"><CalendarIcon size={24} /></div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">BAŞLANGIÇ</p>
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="bg-transparent border-none text-xl font-black outline-none w-full text-slate-800 dark:text-white" />
              </div>
            </div>
            <div className={`p-8 rounded-[32px] border flex items-center gap-6 ${isDarkMode ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500"><CalendarIcon size={24} /></div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">BİTİŞ</p>
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="bg-transparent border-none text-xl font-black outline-none w-full text-slate-800 dark:text-white" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {[
          { label: 'TOPLAM HARCAMA', val: cardStats.spending, color: 'text-rose-500', bg: 'bg-rose-500/10', icon: <ShoppingBag size={28} /> },
          { label: 'DÖNEM SONU BORCU', val: cardStats.cardData!.balance, color: 'text-blue-500', bg: 'bg-blue-500/10', icon: <CardIcon size={28} /> },
          { label: 'TAHMİNİ ASGARİ', val: cardStats.minPayment, color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: <Zap size={28} /> },
          { label: 'KALAN LİMİT', val: (cardStats.cardData!.limit - cardStats.cardData!.balance), color: 'text-amber-500', bg: 'bg-amber-500/10', icon: <TrendingUp size={28} /> }
        ].map((item, idx) => (
          <div key={idx} className={`group p-10 rounded-[48px] border transition-all relative overflow-hidden flex flex-col items-start gap-6 ${isDarkMode ? 'bg-slate-900/40 border-white/5 hover:border-slate-700' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/20 hover:border-blue-100'}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className={`w-16 h-16 rounded-[22px] ${item.bg} flex items-center justify-center ${item.color} group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
              {item.icon}
            </div>
            <div>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.15em] mb-2">{item.label}</p>
              <p className={`text-4xl font-black tracking-tighter ${item.color}`}>₺{item.val.toLocaleString('tr-TR')}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Chart Section with Premium Look */}
      <div className={`p-10 sm:p-16 rounded-[64px] border mb-16 transition-all relative overflow-hidden ${isDarkMode ? 'bg-slate-900/60 border-white/5' : 'bg-white border-slate-100 shadow-2xl shadow-slate-200/50'}`}>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 blur-[120px] rounded-full"></div>
        <div className="flex items-center gap-4 mb-16">
          <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
          <h3 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>FİNANSAL TREND ANALİZİ</h3>
        </div>
        <div className="h-[400px] sm:h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2} />
                </linearGradient>
                <linearGradient id="paymentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 900 }}
                dy={15}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 900 }}
                tickFormatter={(val) => `₺${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
              />
              <Tooltip
                cursor={{ fill: isDarkMode ? '#1e293b' : '#f8fafc', radius: 15 }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className={`p-6 rounded-[32px] border-none shadow-[0_32px_80px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-slate-800/90 backdrop-blur-2xl border border-white/10' : 'bg-white/90 backdrop-blur-2xl border border-slate-100'}`}>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 pb-3 border-b border-white/10">{label}</p>
                        <div className="space-y-3">
                          {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center justify-between gap-12">
                              <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color, boxShadow: `0 0 10px ${entry.color}80` }}></div>
                                <span className={`text-xs font-black uppercase tracking-tight ${entry.dataKey === 'spending' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                  {entry.name}
                                </span>
                              </div>
                              <span className={`text-lg font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
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
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '30px', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
              />
              <Bar dataKey="spending" name="Harcama" fill="url(#spendingGradient)" radius={[10, 10, 0, 0]} barSize={timeRange === 'year' ? 14 : 28} />
              <Bar dataKey="payment" name="Ödeme" fill="url(#paymentGradient)" radius={[10, 10, 0, 0]} barSize={timeRange === 'year' ? 14 : 28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modern Transaction List */}
      <div className={`p-10 sm:p-16 rounded-[64px] border transition-all relative overflow-hidden ${isDarkMode ? 'bg-slate-900/60 border-white/5' : 'bg-white border-slate-100 shadow-2xl shadow-slate-200/50'}`}>
        <div className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-600/10 text-blue-600 rounded-3xl flex items-center justify-center shadow-inner"><CalendarIcon size={30} /></div>
            <div>
              <h3 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>İŞLEM TARİHÇESİ</h3>
              <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-widest">{filteredTransactions.length} İŞLEM BULUNDU</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 md:hidden">
          {filteredTransactions.length > 0 ? filteredTransactions.map(tx => {
            const cardColor = cards.find(c => c.id === tx.cardId)?.color;
            const catColor = categories.find(c => c.name.toLocaleLowerCase('tr-TR') === tx.category?.toLocaleLowerCase('tr-TR'))?.color || '#3B82F6';
            return (
              <div key={tx.id} className={`p-8 rounded-[36px] border flex flex-col gap-6 transition-all hover:scale-[1.02] ${isDarkMode ? 'bg-slate-900/60 border-white/5 hover:border-white/10' : 'bg-slate-50 border-slate-100 hover:shadow-xl'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex gap-4 items-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${tx.type === 'spending' ? 'bg-rose-500/10 text-rose-500 shadow-[0_8px_20px_rgba(244,63,94,0.1)]' : 'bg-emerald-500/10 text-emerald-500 shadow-[0_8px_20px_rgba(16,185,129,0.1)]'}`}>
                      {tx.type === 'spending' ? <ShoppingBag size={22} /> : <PaymentIcon size={22} />}
                    </div>
                    <div>
                      <p className={`text-base font-black uppercase tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{tx.description || 'İşlem'}</p>
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-1.5">{formatDateDisplay(tx.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black tracking-tighter ${tx.type === 'spending' ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {tx.type === 'spending' ? '-' : '+'} ₺{tx.amount.toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-white/5 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full ring-4 ring-offset-4 dark:ring-offset-slate-900" style={{ backgroundColor: catColor }}></div>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: catColor }}>{tx.category || 'Diğer'}</span>
                  </div>
                  <div className="px-4 py-1.5 rounded-full border border-current text-[10px] font-black uppercase tracking-widest opacity-80" style={{ color: cardColor }}>
                    {tx.cardName}
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="py-24 text-center">
              <Inbox size={64} className="mx-auto text-slate-200/50 mb-6" />
              <p className="text-slate-500 font-black uppercase tracking-[0.2em] italic">Henüz bir işlem kaydı bulunmuyor.</p>
            </div>
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-4">
            <thead>
              <tr className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-8 pb-8">TARİH</th>
                <th className="px-8 pb-8">AÇIKLAMA</th>
                <th className="px-8 pb-8">KATEGORİ</th>
                <th className="px-8 pb-8">KART</th>
                <th className="px-8 pb-8 text-right">TUTAR</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(tx => {
                const cardColor = cards.find(c => c.id === tx.cardId)?.color;
                const catColor = categories.find(c => c.name.toLocaleLowerCase('tr-TR') === tx.category?.toLocaleLowerCase('tr-TR'))?.color || '#3B82F6';
                return (
                  <tr key={tx.id} className={`group transition-all hover:scale-[1.01] ${isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                    <td className="py-8 px-8 text-xs font-black text-slate-400 rounded-l-[32px]">{formatDateDisplay(tx.date)}</td>
                    <td className="py-8 px-8">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.type === 'spending' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          {tx.type === 'spending' ? <ShoppingBag size={20} /> : <PaymentIcon size={20} />}
                        </div>
                        <p className={`text-base font-black uppercase tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{tx.description}</p>
                      </div>
                    </td>
                    <td className="py-8 px-8">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: catColor, boxShadow: `0 0 10px ${catColor}50` }}></div>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: catColor }}>{tx.category || 'Diğer'}</span>
                      </div>
                    </td>
                    <td className="py-8 px-8">
                      <span className="px-5 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest whitespace-nowrap" style={{ color: cardColor, borderColor: `${cardColor}40`, backgroundColor: `${cardColor}05` }}>
                        {tx.cardName}
                      </span>
                    </td>
                    <td className={`py-8 px-8 text-right font-black text-2xl tracking-tighter rounded-r-[32px] ${tx.type === 'spending' ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {tx.type === 'spending' ? '-' : '+'} ₺{tx.amount.toLocaleString('tr-TR')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredTransactions.length === 0 && (
            <div className="py-32 text-center">
              <Inbox size={80} className="mx-auto text-slate-200/30 mb-8" />
              <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-sm italic">Filtrelere uygun işlem bulunamadı.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
