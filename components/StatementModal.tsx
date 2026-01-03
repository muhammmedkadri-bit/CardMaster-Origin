
import React, { useState, useMemo } from 'react';
import { CreditCard, Transaction } from '../types';
import {
  X,
  FileText,
  Clock,
  CalendarDays,
  BarChart3,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  ShoppingBag,
  Zap
} from 'lucide-react';

interface StatementModalProps {
  card: CreditCard;
  transactions: Transaction[];
  isDarkMode: boolean;
  onClose: () => void;
}

type TimeRange = 'today' | 'thisweek' | '30days' | 'year' | 'custom';

// Helper: Get installment info from transaction
const getInstallmentInfo = (tx: Transaction): { current: number; total: number } | null => {
  const installments = (tx as any).installments || 1;
  const installmentNumber = (tx as any).installmentNumber || 1;
  if (installments <= 1 || (tx as any).expenseType !== 'installment') return null;
  return { current: installmentNumber, total: installments };
};

// Installment label for PDF description
const getInstallmentLabel = (tx: Transaction): string => {
  const info = getInstallmentInfo(tx);
  if (!info) return '';
  return ` (${info.current}/${info.total} Taksit)`;
};

const StatementModal: React.FC<StatementModalProps> = ({ card, transactions, isDarkMode, onClose }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');
  const [customStart, setCustomStart] = useState<string>(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = useState(false);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const onlyDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = onlyDate.split('-');
    if (parts.length < 3) return onlyDate;
    const [y, m, d] = parts;
    return `${d}.${m}.${y.slice(-2)}`;
  };

  const filteredTransactions = useMemo(() => {
    const cardFiltered = transactions.filter(t => t.cardId === card.id);
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (timeRange === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (timeRange === 'thisweek') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
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
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [card.id, transactions, timeRange, customStart, customEnd]);

  const stats = useMemo(() => {
    const spending = filteredTransactions.filter(t => t.type === 'spending').reduce((a, b) => a + b.amount, 0);
    const payment = filteredTransactions.filter(t => t.type === 'payment').reduce((a, b) => a + b.amount, 0);
    const minPayment = card.balance > 0 ? (card.balance * (card.minPaymentRatio / 100)) : 0;
    return { spending, payment, minPayment };
  }, [filteredTransactions, card]);

  const exportToPDF = async () => {
    setIsExporting(true);
    const reportPeriod = timeRange === 'custom'
      ? `${formatDateDisplay(customStart)} - ${formatDateDisplay(customEnd)}`
      : timeRange === 'today' ? 'Bugün'
        : timeRange === 'thisweek' ? 'Bu Hafta'
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
      doc.text('HESAP ÖZETİ', pageWidth - margin, logoY + 4, { align: 'right' });
      doc.setFontSize(8);
      doc.setFont('Roboto', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`DÖNEM: ${reportPeriod.toUpperCase()}`, pageWidth - margin, logoY + 8, { align: 'right' });
      doc.text(`TARİH: ${currentDate.split(' ')[0]}`, pageWidth - margin, logoY + 11.5, { align: 'right' });

      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.1);
      doc.line(margin, logoY + 18, pageWidth - margin, logoY + 18);

      // --- 2. CARD INFO SECTION ---
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.setFont('Roboto', 'bold');
      doc.text('KART BİLGİLERİ', margin, logoY + 28);
      doc.setFont('Roboto', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(`${card.bankName}`, margin, logoY + 33);
      doc.setFont('Roboto', 'bold');
      doc.text(`${card.cardName}`, margin, logoY + 37);
      doc.setFont('Roboto', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`**** **** **** ${card.lastFour}`, margin, logoY + 41);

      // --- 3. DASHBOARD METRICS (With Icons) ---
      const boxWidth = (pageWidth - (margin * 2) - 10) / 3;
      const metricsY = logoY + 50;

      const drawMetric = (x: number, label: string, value: string, color: number[], type: 'spending' | 'debt' | 'min') => {
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
        }

        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.setFont('Roboto', 'bold');
        doc.text(label, x + 13, metricsY + 7.5);

        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.setFont('Roboto', 'bold');
        doc.text(value, x + 6, metricsY + 16);
      };

      drawMetric(margin, 'TOPLAM HARCAMA', formatCurrency(stats.spending), [239, 68, 68], 'spending');
      drawMetric(margin + boxWidth + 5, 'GÜNCEL BORÇ', formatCurrency(card.balance, true), [37, 99, 235], 'debt');
      drawMetric(margin + (boxWidth * 2) + 10, 'ASGARİ ÖDEME', formatCurrency(stats.minPayment), [16, 185, 129], 'min');

      // --- 4. TRANSACTION TABLE ---
      const hexToRgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b];
      };

      const tableData = filteredTransactions.map(t => [
        formatDateDisplay(t.date),
        ((t.description || 'İŞLEM') + getInstallmentLabel(t)).toUpperCase(),
        (t.category || 'DİĞER').toUpperCase(),
        card.cardName.toUpperCase(),
        formatCurrency(t.amount)
      ]);

      (doc as any).autoTable({
        startY: metricsY + 32,
        head: [['TARİH', 'İŞLEM AÇIKLAMASI', 'KATEGORİ', 'KART', 'TUTAR']],
        body: tableData,
        theme: 'striped',
        styles: { font: 'Roboto', fontStyle: 'normal' },
        headStyles: {
          fillColor: [248, 250, 252],
          textColor: [71, 85, 105],
          fontSize: 7,
          fontStyle: 'bold',
          halign: 'left',
          cellPadding: { top: 7, right: 4, bottom: 5, left: 10 }
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59],
          cellPadding: 4
        },
        columnStyles: {
          4: { halign: 'right', fontStyle: 'bold' }
        },
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
              doc.line(x - 1, y + 1, x + 1.5, y + 1);
            } else if (data.column.index === 2) { // Category
              doc.circle(x + 0.5, y, 1.5, 'D');
              doc.line(x + 1.5, y - 1, x - 0.5, y + 1); // Tag slanted line
            } else if (data.column.index === 3) { // Card
              doc.roundedRect(x - 1.5, y - 1.2, 3.5, 2.5, 0.4, 0.4, 'D');
              doc.line(x - 1.5, y - 0.5, x + 2, y - 0.5);
            } else if (data.column.index === 4) { // Amount
              doc.circle(x + 0.5, y, 1.8, 'D');
              doc.line(x - 0.5, y, x + 1.5, y); // Lira symbol part
            }
          }

          if (data.section === 'body' && data.column.index === 3) {
            const [r, g, b] = hexToRgb(card.color);
            doc.setTextColor(r, g, b);
            doc.setFont('Roboto', 'bold');
          }
        },
        alternateRowStyles: { fillColor: [252, 254, 255] },
        margin: { left: margin, right: margin },
        tableLineColor: [241, 245, 249],
        tableLineWidth: 0.1
      });

      // --- 5. FOOTER ---
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, finalY, pageWidth - margin, finalY);

      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.setFont('Roboto', 'normal');
      doc.text('Bu rapor CardMaster otomatik finans sistemi tarafından üretilmiştir. Bilgi amaçlıdır.', margin, finalY + 8);
      doc.text('www.cardmaster.app', pageWidth - margin, finalY + 8, { align: 'right' });

      doc.save(`Ekstre_${card.cardName.replace(/\s+/g, '_')}.pdf`);
      onClose();
    } catch (err: any) {
      console.error('PDF Export Error:', err);
      alert('PDF oluşturulurken bir hata oluştu.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[3000] flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse delay-700"></div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[40px] w-full max-w-lg p-10 shadow-[0_32px_80px_rgba(0,0,0,0.3)] relative border border-white/20 dark:border-slate-800/50 animate-in zoom-in-95 duration-500 overflow-hidden mb-12">
        {/* Decorative Top Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400"></div>

        <button
          onClick={onClose}
          className="absolute top-8 right-8 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/50 text-slate-400 hover:text-red-500 transition-all hover:scale-110 active:scale-90"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-5 mb-12">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20"></div>
            <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3 group-hover:rotate-0 transition-transform">
              <FileText size={32} />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">HESAP ÖZETİ</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-lg uppercase tracking-widest">{card.bankName}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{card.cardName}</span>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div>
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 block">DÖNEM ARALIĞI SEÇİN</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(['today', 'thisweek', '30days', 'year', 'custom'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all relative overflow-hidden group ${timeRange === range
                    ? 'text-white shadow-lg shadow-blue-500/20'
                    : (isDarkMode ? 'bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-slate-700/50' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200/50')
                    }`}
                >
                  {timeRange === range && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 animate-in fade-in duration-300"></div>
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {range === 'today' ? 'Bugün' : range === 'thisweek' ? 'Bu Hafta' : range === '30days' ? 'Bu Ay' : range === 'year' ? 'Bu Yıl' : 'Özel'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {timeRange === 'custom' && (
            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-4 duration-500 p-6 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-200/50 dark:border-slate-700/50">
              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase mb-2 tracking-widest">BAŞLANGIÇ</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={14} />
                  <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className={`w-full pl-10 pr-4 py-3 rounded-xl text-xs font-bold border outline-none transition-all ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-slate-200 text-slate-700 focus:border-blue-500 shadow-sm'}`} />
                </div>
              </div>
              <div>
                <label className="block text-[8px] font-black text-slate-500 uppercase mb-2 tracking-widest">BİTİŞ</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" size={14} />
                  <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className={`w-full pl-10 pr-4 py-3 rounded-xl text-xs font-bold border outline-none transition-all ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-slate-200 text-slate-700 focus:border-blue-500 shadow-sm'}`} />
                </div>
              </div>
            </div>
          )}

          <div className={`p-8 rounded-[32px] border relative overflow-hidden transition-all ${isDarkMode ? 'bg-slate-800/20 border-slate-700/50' : 'bg-blue-50/30 border-blue-100'}`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] rounded-full"></div>
            <div className="flex justify-between items-center mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">DÖNEM ÖZETİ</span>
              </div>
              <div className="px-3 py-1 bg-white dark:bg-slate-800 rounded-full border border-slate-200/50 dark:border-slate-700/50 text-[10px] font-black dark:text-slate-300">
                {filteredTransactions.length} İŞLEM
              </div>
            </div>

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">TOPLAM HARCAMA</p>
                  <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-indigo-700 tracking-tighter leading-none">
                    {(stats.spending).toLocaleString('tr-TR')} ₺
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-right flex-row-reverse">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <Zap size={24} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">ASGARİ ÖDEME</p>
                  <p className={`text-2xl font-black tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    {stats.minPayment.toLocaleString('tr-TR')} ₺
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={exportToPDF}
            disabled={isExporting}
            className="group relative w-full h-[72px] bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[24px] font-black text-sm uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <div className="relative flex items-center justify-center gap-4">
              {isExporting ? <RefreshCw className="animate-spin" size={24} /> : <Download className="group-hover:translate-y-[-2px] transition-transform" size={24} />}
              {isExporting ? 'HAZIRLANIYOR' : 'EKSTRE DOSYASINI OLUŞTUR'}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatementModal;