
import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Transaction, CreditCard, Category } from '../types';
import { PieChart as PieIcon, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

interface MonthlyAnalysisProps {
  transactions: Transaction[];
  cards: CreditCard[];
  isDarkMode: boolean;
  categories: Category[];
}

const MonthlyAnalysis: React.FC<MonthlyAnalysisProps> = ({ transactions, cards, isDarkMode, categories }) => {
  const [selectedCardId, setSelectedCardId] = useState<string>('all');

  const analysisData = useMemo(() => {
    const filteredTxs = selectedCardId === 'all'
      ? transactions
      : transactions.filter(t => t.cardId === selectedCardId);

    // Group by month using a more robust Map-based approach
    const monthlyMap = new Map<string, { month: string, spending: number, payment: number, timestamp: number }>();

    // Prepare exactly 12 months in chronological order
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(1); // Crucial: avoid month jumping
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = d.toLocaleString('tr-TR', { month: 'short', year: '2-digit' });
      monthlyMap.set(key, {
        month: label,
        spending: 0,
        payment: 0,
        timestamp: d.getTime()
      });
    }

    // Assign transactions to their respective months
    filteredTxs.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (monthlyMap.has(key)) {
        const entry = monthlyMap.get(key)!;
        if (t.type === 'spending') entry.spending += t.amount;
        else entry.payment += t.amount;
      }
    });

    // Convert to sorted array for the chart
    const monthlyChart = Array.from(monthlyMap.values())
      .sort((a, b) => a.timestamp - b.timestamp);

    // Category breakdown for current month - Include all dynamic categories + potentially unique ones
    const currentMonthTxs = filteredTxs.filter(t => {
      const tDate = new Date(t.date);
      const now = new Date();
      return tDate.getMonth() === now.getMonth() &&
        tDate.getFullYear() === now.getFullYear() &&
        t.type === 'spending';
    });

    // Category breakdown with Turkish normalization
    const catMap: Record<string, { name: string, amount: number }> = {};
    currentMonthTxs.forEach(t => {
      const key = t.category.trim().toLocaleLowerCase('tr-TR');
      if (!catMap[key]) {
        catMap[key] = { name: t.category.toLocaleUpperCase('tr-TR'), amount: 0 };
      }
      catMap[key].amount += t.amount;
    });

    const categoryBreakdown = Object.values(catMap)
      .filter(c => c.amount > 0)
      .map(c => {
        const catInfo = categories.find(cat => cat.name.toLocaleLowerCase('tr-TR') === c.name.toLocaleLowerCase('tr-TR'));
        return {
          name: c.name,
          value: c.amount,
          color: catInfo ? catInfo.color : '#3B82F6'
        };
      })
      .sort((a, b) => b.value - a.value);

    return { monthlyChart, categoryBreakdown };
  }, [transactions, selectedCardId, categories]);

  return (
    <div className={`p-5 sm:p-8 md:p-10 rounded-[32px] sm:rounded-[40px] border transition-all ${isDarkMode ? 'bg-[#0f172a]/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 sm:mb-10">
        <div>
          <h3 className={`text-lg sm:text-xl font-black flex items-center gap-3 sm:gap-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            <BarChart3 size={20} className="sm:w-6 sm:h-6 text-blue-500" />
            HARCAMA & ÖDEME ANALİZİ
          </h3>
          <p className="text-sm text-slate-500 font-medium mt-1">Geçmiş dönem finansal performansınız</p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="h-[250px] sm:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysisData.monthlyChart} margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendingGradientMonthly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="paymentGradientMonthly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 700 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={100}
                  domain={[0, 'auto']}
                  nice={true}
                  padding={{ top: 20 }}
                  tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 700 }}
                  tickFormatter={(val) => `${val.toLocaleString('tr-TR')} ₺`}
                />
                <Tooltip
                  cursor={{ fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', radius: 10 }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className={`p-4 rounded-[24px] border-none shadow-2xl animate-in zoom-in-95 duration-200 ${isDarkMode ? 'bg-slate-800/95 backdrop-blur-xl border border-slate-700' : 'bg-white/95 backdrop-blur-xl border border-slate-100'}`}>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2.5 pb-2 border-b border-slate-200 dark:border-slate-700">{label}</p>
                          <div className="space-y-1.5">
                            {payload.map((entry: any, index: number) => (
                              <div key={index} className="flex items-center justify-between gap-8">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                  <span className={`text-[11px] font-black uppercase tracking-tight ${entry.dataKey === 'spending' ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {entry.name}
                                  </span>
                                </div>
                                <span className={`text-sm font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
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
                  iconType="circle"
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}
                />
                <Bar name="Harcama" dataKey="spending" fill="url(#spendingGradientMonthly)" radius={[6, 6, 0, 0]} barSize={16} maxBarSize={24} />
                <Bar name="Ödeme" dataKey="payment" fill="url(#paymentGradientMonthly)" radius={[6, 6, 0, 0]} barSize={16} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`p-5 rounded-[32px] border flex items-center gap-5 transition-all hover:translate-x-1 ${isDarkMode ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50 border-rose-100 shadow-sm'}`}>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                <TrendingUp size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-slate-500/80 dark:text-slate-400 uppercase tracking-[0.15em] mb-1 text-nowrap">BU AYKİ TOPLAM HARCAMA</p>
                <p className={`text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tighter`}>
                  {analysisData.monthlyChart[analysisData.monthlyChart.length - 1].spending.toLocaleString('tr-TR')} <span className="text-[0.7em] opacity-70">₺</span>
                </p>
              </div>
            </div>
            <div className={`p-5 rounded-[32px] border flex items-center gap-5 transition-all hover:translate-x-1 ${isDarkMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100 shadow-sm'}`}>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                <TrendingDown size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-slate-500/80 dark:text-slate-400 uppercase tracking-[0.15em] mb-1 text-nowrap">BU AYKİ TOPLAM ÖDEME</p>
                <p className={`text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter`}>
                  {analysisData.monthlyChart[analysisData.monthlyChart.length - 1].payment.toLocaleString('tr-TR')} <span className="text-[0.7em] opacity-70">₺</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            BU AYIN ÖZETİ
          </h4>

          <div className="grid grid-cols-2 gap-3">
            {analysisData.categoryBreakdown.length > 0 ? (
              analysisData.categoryBreakdown.map((cat, i) => (
                <div key={i} className={`p-4 rounded-3xl border transition-all hover:scale-[1.05] flex flex-col gap-3 ${isDarkMode ? 'bg-slate-800/20 border-slate-800 hover:bg-slate-800/40' : 'bg-slate-50 border-slate-100 shadow-sm hover:bg-white'}`}>
                  <div className="flex flex-col gap-2">
                    <span
                      className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest w-fit border"
                      style={{
                        backgroundColor: `${cat.color}15`,
                        color: cat.color,
                        borderColor: `${cat.color}30`
                      }}
                    >
                      {cat.name}
                    </span>
                    <span className={`text-base font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                      -{cat.value.toLocaleString('tr-TR')} ₺
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 py-10 text-center text-slate-500 italic text-sm">Bu ay henüz harcama verisi yok.</div>
            )}
          </div>


        </div>
      </div>
    </div >
  );
};

export default MonthlyAnalysis;
