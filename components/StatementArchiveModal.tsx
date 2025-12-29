
import React, { useState, useMemo } from 'react';
import { CreditCard, Transaction } from '../types';
import {
    X,
    FileText,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Download,
    Printer,
    History,
    TrendingDown,
    TrendingUp,
    CreditCard as CardIcon,
    ShoppingBag,
    Zap,
    ArrowRight
} from 'lucide-react';

interface StatementArchiveModalProps {
    card: CreditCard;
    transactions: Transaction[];
    isDarkMode: boolean;
    onClose: () => void;
}

const StatementArchiveModal: React.FC<StatementArchiveModalProps> = ({ card, transactions, isDarkMode, onClose }) => {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const years = useMemo(() => {
        const yearsSet = new Set<number>();
        yearsSet.add(new Date().getFullYear());
        transactions.forEach(t => {
            yearsSet.add(new Date(t.date).getFullYear());
        });
        return Array.from(yearsSet).sort((a, b) => b - a);
    }, [transactions]);

    const monthlyStatements = useMemo(() => {
        const months = Array.from({ length: 12 }, (_, i) => i);
        const cardTxs = transactions.filter(t => t.cardId === card.id);

        return months.map(monthIdx => {
            const monthTxs = cardTxs.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === monthIdx && d.getFullYear() === selectedYear;
            });

            const spending = monthTxs.filter(t => t.type === 'spending').reduce((sum, t) => sum + t.amount, 0);
            const payment = monthTxs.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0);

            return {
                monthIdx,
                monthName: new Date(selectedYear, monthIdx).toLocaleString('tr-TR', { month: 'long' }).toLocaleUpperCase('tr-TR'),
                spending,
                payment,
                transactionCount: monthTxs.length,
                transactions: monthTxs
            };
        }).reverse(); // Most recent months first
    }, [card.id, transactions, selectedYear]);

    const exportMonthToPDF = async (monthData: typeof monthlyStatements[0]) => {
        const reportPeriod = `${monthData.monthName} ${selectedYear}`;
        const currentDate = new Date().toLocaleString('tr-TR');

        try {
            const jspdfLib = (window as any).jspdf;
            if (!jspdfLib) throw new Error('jsPDF library not found');

            const doc = new jspdfLib.jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.width;
            const margin = 20;

            // Turkish font support
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
                doc.setFont('helvetica', 'normal');
            }

            const formatCurrency = (amount: number) => {
                return `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`;
            };

            // Header
            doc.setFillColor(37, 99, 235);
            doc.rect(0, 0, pageWidth, 2, 'F');

            doc.setTextColor(15, 23, 42);
            doc.setFontSize(18);
            doc.setFont('Roboto', 'bold');
            doc.text('CARD', margin, 20);
            doc.setTextColor(37, 99, 235);
            doc.text('MASTER', margin + 19, 20);

            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text('DÖNEM EKSTRESİ', pageWidth - margin, 18, { align: 'right' });
            doc.text(reportPeriod, pageWidth - margin, 23, { align: 'right' });

            // Card Details
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(10);
            doc.setFont('Roboto', 'bold');
            doc.text(card.bankName, margin, 35);
            doc.text(card.cardName, margin, 40);
            doc.setFont('Roboto', 'normal');
            doc.text(`**** **** **** ${card.lastFour}`, margin, 45);

            // Summary
            const summaryY = 55;
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(margin, summaryY, pageWidth - (margin * 2), 25, 3, 3, 'F');

            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text('TOPLAM HARCAMA', margin + 10, summaryY + 10);
            doc.text('TOPLAM ÖDEME', pageWidth / 2, summaryY + 10);

            doc.setFontSize(14);
            doc.setTextColor(15, 23, 42);
            doc.setFont('Roboto', 'bold');
            doc.text(formatCurrency(monthData.spending), margin + 10, summaryY + 18);
            doc.text(formatCurrency(monthData.payment), pageWidth / 2, summaryY + 18);

            // Transactions Table
            const tableData = monthData.transactions.map(t => [
                new Date(t.date).toLocaleDateString('tr-TR'),
                (t.description || 'İŞLEM').toUpperCase(),
                (t.category || 'DİĞER').toUpperCase(),
                t.type === 'spending' ? 'HARCAMA' : 'ÖDEME',
                formatCurrency(t.amount)
            ]);

            (doc as any).autoTable({
                startY: summaryY + 35,
                head: [['TARİH', 'AÇIKLAMA', 'KATEGORİ', 'TÜR', 'TUTAR']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [37, 99, 235], textColor: 255 },
                styles: { font: 'Roboto' }
            });

            doc.save(`Ekstre_${card.cardName}_${monthData.monthName}_${selectedYear}.pdf`);
        } catch (err) {
            console.error('PDF Export Error:', err);
            alert('Ekstre oluşturulurken bir hata oluştu.');
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[3000] flex items-center justify-center p-4 animate-in fade-in duration-500">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse delay-700"></div>
            </div>

            <div className="bg-white/90 dark:bg-slate-950/90 backdrop-blur-3xl rounded-[40px] w-full max-w-4xl p-0 shadow-[0_32px_80px_rgba(0,0,0,0.5)] relative border border-white/20 dark:border-slate-800/50 animate-in zoom-in-95 duration-500 overflow-hidden h-[85vh] flex flex-col">
                {/* Header Section */}
                <div className="p-8 sm:p-10 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20"></div>
                            <div className="relative w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3">
                                <History size={28} />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">DÖNEM EKSTRELERİ</h2>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="px-3 py-1 rounded-xl bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">{card.cardName}</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{card.bankName}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className={`p-1.5 rounded-2xl border flex items-center gap-1 ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            {years.map(y => (
                                <button
                                    key={y}
                                    onClick={() => setSelectedYear(y)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${selectedYear === y
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'text-slate-500 hover:text-blue-500'}`}
                                >
                                    {y}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/50 text-slate-400 hover:text-red-500 transition-all active:scale-95"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-8 sm:p-10 lg:p-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {monthlyStatements.map((m) => (
                            <div
                                key={m.monthIdx}
                                className={`group p-6 rounded-[32px] border transition-all flex flex-col gap-6 relative overflow-hidden ${m.transactionCount > 0
                                        ? (isDarkMode ? 'bg-slate-900/40 border-slate-800 hover:border-blue-500/50' : 'bg-white border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200')
                                        : 'opacity-40 grayscale pointer-events-none'
                                    }`}
                            >
                                <div className="flex items-center justify-between relative z-10">
                                    <h3 className={`text-base font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{m.monthName}</h3>
                                    <div className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                                        {m.transactionCount} İŞLEM
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><TrendingDown size={14} /></div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ÖDEME</p>
                                        </div>
                                        <p className={`text-base font-black tracking-tighter ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{m.payment.toLocaleString('tr-TR')} ₺</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500"><TrendingUp size={14} /></div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HARCAMA</p>
                                        </div>
                                        <p className={`text-base font-black tracking-tighter ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>-{m.spending.toLocaleString('tr-TR')} ₺</p>
                                    </div>
                                </div>

                                <div className="pt-2 flex gap-2 relative z-10">
                                    <button
                                        onClick={() => exportMonthToPDF(m)}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                                    >
                                        <Download size={14} /> PDF
                                    </button>
                                    <button
                                        onClick={() => window.print()}
                                        className={`flex-1 rounded-2xl py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                    >
                                        <Printer size={14} /> YAZDIR
                                    </button>
                                </div>

                                {/* Decorative background element */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] rounded-full group-hover:bg-blue-500/10 transition-all"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer info */}
                <div className={`p-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center gap-4 ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">KART EKSTRE ARŞİV SİSTEMİ</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatementArchiveModal;
