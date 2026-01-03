
import React, { useMemo, useState, useRef, useEffect } from 'react';
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
  const [isMarqueePaused, setIsMarqueePaused] = useState(false);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const scrollPosRef = useRef(0);
  const dragRef = useRef({ isDragging: false, startX: 0, currentTranslation: 0 });

  const analysisData = useMemo(() => {
    const filteredTxs = selectedCardId === 'all'
      ? transactions
      : transactions.filter(t => t.cardId === selectedCardId);

    // Group by month using a more robust Map-based approach
    const monthlyMap = new Map<string, { month: string, spending: number, payment: number, timestamp: number }>();

    // Prepare all 12 months of the current year (January to December)
    const currentYear = new Date().getFullYear();
    for (let monthIdx = 0; monthIdx < 12; monthIdx++) {
      const d = new Date(currentYear, monthIdx, 1);
      const key = `${currentYear}-${monthIdx}`;
      const label = d.toLocaleString('tr-TR', { month: 'short' }).toUpperCase();
      monthlyMap.set(key, {
        month: label,
        spending: 0,
        payment: 0,
        timestamp: d.getTime()
      });
    }

    // Assign transactions to their respective months (only current year)
    filteredTxs.forEach(t => {
      const date = new Date(t.date);
      if (date.getFullYear() === currentYear) {
        const key = `${currentYear}-${date.getMonth()}`;
        if (monthlyMap.has(key)) {
          const entry = monthlyMap.get(key)!;
          if (t.type === 'spending') entry.spending += t.amount;
          else entry.payment += t.amount;
        }
      }
    });

    // Convert to sorted array for the chart (January to December)
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

    // Get current month name for display
    const currentMonthName = new Date().toLocaleString('tr-TR', { month: 'long' }).toUpperCase();
    const currentMonthData = monthlyChart[new Date().getMonth()] || { spending: 0, payment: 0 };

    return { monthlyChart, categoryBreakdown, currentMonthName, currentMonthData };
  }, [transactions, selectedCardId, categories]);

  // Ultra-Smooth GPU-Accelerated Infinite Scroll Logic
  useEffect(() => {
    const list = marqueeRef.current?.firstElementChild as HTMLDivElement;
    if (!list || isMarqueePaused || dragRef.current.isDragging || analysisData.categoryBreakdown.length === 0) return;

    let animationId: number;
    let lastTime = performance.now();

    // Initial sync
    const initialWidth = list.scrollWidth / 3;
    if (scrollPosRef.current === 0) {
      scrollPosRef.current = -initialWidth;
    }

    const animate = (time: number) => {
      if (list) {
        const deltaTime = time - lastTime;
        lastTime = time;
        const speed = 45;
        scrollPosRef.current -= (speed * deltaTime) / 1000;
        const singleWidth = list.scrollWidth / 3;

        if (Math.abs(scrollPosRef.current) >= singleWidth * 2) {
          scrollPosRef.current += singleWidth;
        } else if (scrollPosRef.current > -singleWidth / 2) {
          if (scrollPosRef.current >= 0) {
            scrollPosRef.current -= singleWidth;
          }
        }

        list.style.transform = `translate3d(${scrollPosRef.current}px, 0, 0)`;
        dragRef.current.currentTranslation = scrollPosRef.current;
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isMarqueePaused, analysisData.categoryBreakdown]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsMarqueePaused(true);
    dragRef.current.isDragging = true;
    dragRef.current.startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const list = marqueeRef.current?.firstElementChild as HTMLDivElement;
    if (list) list.style.transition = 'none';
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
      if (Math.abs(scrollPosRef.current) >= singleSetWidth * 2.5) scrollPosRef.current += singleSetWidth;
      if (scrollPosRef.current >= -singleSetWidth / 2) scrollPosRef.current -= singleSetWidth;
      list.style.transform = `translate3d(${scrollPosRef.current}px, 0, 0)`;
      dragRef.current.currentTranslation = scrollPosRef.current;
    }
  };

  const handleDragEnd = () => {
    dragRef.current.isDragging = false;
    setTimeout(() => setIsMarqueePaused(false), 50);
  };

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

      <div className="w-full">
        <div className="w-full">
          <div className="h-[280px] sm:h-[380px] w-full -ml-4 sm:-ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analysisData.monthlyChart}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barGap={8}
              >
                <defs>
                  {/* 3D Spending Gradient */}
                  <linearGradient id="3dSpendingMain" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#e11d48" />
                    <stop offset="50%" stopColor="#fb7185" />
                    <stop offset="100%" stopColor="#e11d48" />
                  </linearGradient>
                  {/* 3D Payment Gradient */}
                  <linearGradient id="3dPaymentMain" x1="0" y1="0" x2="1" y2="0">
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
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: isDarkMode ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  minTickGap={30}
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
                                <span className={`text-[13px] font-bold ${entry.name === 'Harcama' ? 'text-rose-500' : 'text-emerald-500'}`}>
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
                  name="Harcama"
                  dataKey="spending"
                  fill="url(#3dSpendingMain)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={20}
                  animationDuration={800}
                />
                <Bar
                  name="Ödeme"
                  dataKey="payment"
                  fill="url(#3dPaymentMain)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={20}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`p-5 rounded-[32px] border flex items-center gap-5 transition-all hover:translate-x-1 ${isDarkMode ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50 border-rose-100 shadow-sm'}`}>
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                <TrendingUp size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-slate-500/80 dark:text-slate-400 uppercase tracking-[0.15em] mb-1 text-nowrap">{analysisData.currentMonthName} AYI TOPLAM HARCAMASI</p>
                <p className={`text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tighter`}>
                  {analysisData.currentMonthData.spending.toLocaleString('tr-TR')} <span className="text-[0.7em] opacity-70">₺</span>
                </p>
              </div>
            </div>
            <div className={`p-5 rounded-[32px] border flex items-center gap-5 transition-all hover:translate-x-1 ${isDarkMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100 shadow-sm'}`}>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                <TrendingDown size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-slate-500/80 dark:text-slate-400 uppercase tracking-[0.15em] mb-1 text-nowrap">{analysisData.currentMonthName} AYI TOPLAM ÖDEMESİ</p>
                <p className={`text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter`}>
                  {analysisData.currentMonthData.payment.toLocaleString('tr-TR')} <span className="text-[0.7em] opacity-70">₺</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Distribution Scrolling Banner */}
      <div className="mt-12 overflow-hidden relative group pt-10 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4 mb-6 px-2">
          <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
          <h3 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>KATEGORİ DAĞILIMI ({analysisData.currentMonthName})</h3>
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
            {analysisData.categoryBreakdown.length > 0 ? (
              [...analysisData.categoryBreakdown, null, ...analysisData.categoryBreakdown, null, ...analysisData.categoryBreakdown, null].map((cat, idx) => (
                cat ? (
                  <div
                    key={idx}
                    className={`flex-shrink-0 min-w-[280px] sm:min-w-[320px] p-5 rounded-[32px] border flex items-center gap-4 transition-all hover:scale-105 active:scale-95 ${isDarkMode ? 'bg-white/5 border-white/5 shadow-xl shadow-black/20' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'
                      }`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-1.5 h-10 rounded-full shrink-0 shadow-lg" style={{ backgroundColor: (cat as any).color, boxShadow: `0 0 15px ${(cat as any).color}40` }} />
                      <div className="min-w-0 flex-1">
                        <p className={`text-[13px] font-black tracking-tight truncate leading-tight uppercase ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                          {(cat as any).name}
                        </p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 opacity-60">
                          {analysisData.currentMonthName} HARCAMASI
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
                  <div key={idx} className="flex-shrink-0 w-[50px] sm:w-[100px] flex items-center justify-center">
                    <div className={`w-1 h-8 rounded-full opacity-10 ${isDarkMode ? 'bg-white' : 'bg-slate-900'}`} />
                  </div>
                )
              ))
            ) : (
              <div className="py-10 text-center text-slate-500 italic text-sm w-full">Bu ay henüz harcama verisi yok.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyAnalysis;
