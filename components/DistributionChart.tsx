import React, { useMemo, useState, useRef, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { CreditCard, Transaction, Category } from '../types';
import { PieChart as PieIcon, CreditCard as CardIcon, LayoutGrid, ArrowRight } from 'lucide-react';

interface DistributionChartProps {
  cards: CreditCard[];
  transactions: Transaction[];
  isDarkMode: boolean;
  categories: Category[];
}

interface DataItem {
  name: string;
  bankName?: string;
  value: number;
  originalValue: number;
  color: string;
  minPayment?: number;
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

  return (
    <g>
      {/* Glow Effect */}
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{ filter: 'url(#glow)', transition: 'all 0.3s ease' }}
      />
    </g>
  );
};

const DistributionChart: React.FC<DistributionChartProps> = ({ cards, transactions, isDarkMode, categories }) => {
  const [mode, setMode] = useState<'cards' | 'categories'>('cards');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);

  // Prepare Cards Data
  const cardsData = useMemo<DataItem[]>(() => {
    return cards
      .filter(c => c.balance !== 0)
      .map(c => ({
        name: c.cardName,
        bankName: c.bankName,
        value: Math.abs(c.balance),
        originalValue: c.balance,
        color: c.color,
        minPayment: (Math.abs(c.balance) * (c.minPaymentRatio || 20)) / 100
      }))
      .sort((a, b) => b.value - a.value);
  }, [cards]);

  // Prepare Categories Data
  const categoriesData = useMemo<DataItem[]>(() => {
    const now = new Date();
    const currentMonthTxs = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'spending';
    });

    const catMap: Record<string, { name: string, amount: number }> = {};
    currentMonthTxs.forEach(t => {
      const key = t.category.trim().toLocaleLowerCase('tr-TR');
      if (!catMap[key]) {
        catMap[key] = { name: t.category.toLocaleUpperCase('tr-TR'), amount: 0 };
      }
      catMap[key].amount += t.amount;
    });

    return Object.entries(catMap)
      .map(([_, data]) => {
        const catInfo = categories.find(cat => cat.name.toLocaleLowerCase('tr-TR') === data.name.toLocaleLowerCase('tr-TR'));
        return {
          name: data.name,
          value: Math.max(0.01, data.amount),
          originalValue: data.amount,
          color: catInfo ? catInfo.color : '#3B82F6'
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  const cardsTotal = useMemo(() => cardsData.reduce((acc, curr) => acc + curr.value, 0), [cardsData]);
  const categoriesTotal = useMemo(() => categoriesData.reduce((acc, curr) => acc + curr.value, 0), [categoriesData]);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (isScrolling) return; // Ignore scroll events if triggered by button click
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    const newMode = scrollLeft > width / 2 ? 'categories' : 'cards';
    if (newMode !== mode) {
      setMode(newMode);
      setActiveIndex(null);
    }
  };

  const scrollToMode = (targetMode: 'cards' | 'categories') => {
    if (scrollContainerRef.current) {
      setIsScrolling(true);
      const width = scrollContainerRef.current.offsetWidth;
      scrollContainerRef.current.scrollTo({
        left: targetMode === 'cards' ? 0 : width,
        behavior: 'smooth'
      });
      setMode(targetMode);
      setActiveIndex(null);
      setTimeout(() => setIsScrolling(false), 500);
    }
  };

  const renderChartSlide = (data: DataItem[], totalValue: number, type: 'cards' | 'categories') => {
    return (
      <div className="w-full h-full flex flex-col items-center justify-start flex-shrink-0 snap-center pb-8">
        {/* Chart Container */}
        <div className="relative w-full aspect-square sm:h-[360px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart
              onMouseLeave={onPieLeave}
              onClick={(e) => {
                if (e) e.stopPropagation();
                setActiveIndex(null);
              }}
            >
              <Pie
                activeIndex={activeIndex ?? undefined}
                activeShape={renderActiveShape}
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="58%"
                outerRadius="75%"
                paddingAngle={activeIndex !== null ? 2 : 4}
                dataKey="value"
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                onClick={(_: any, index: number, e: any) => {
                  if (e && e.stopPropagation) e.stopPropagation();
                  setActiveIndex(prev => prev === index ? null : index);
                }}
                stroke="none"
                animationBegin={0}
                animationDuration={600}
                animationEasing="ease-in-out"
                isAnimationActive={true}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    style={{ outline: 'none', cursor: 'pointer' }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Dynamic Center Info Panel */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4"
            style={{
              zIndex: activeIndex !== null ? 5 : 1
            }}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex(null);
              }}
              className={`flex flex-col items-center justify-center text-center w-[48%] aspect-square rounded-full transition-all duration-500 ${activeIndex !== null ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
                } group`}
            >
              {activeIndex === null || !data[activeIndex] ? (
                <div className="flex flex-col items-center animate-in fade-in zoom-in-90 duration-500">
                  <div className="p-2 mb-1 bg-blue-500/10 text-blue-500 rounded-full">
                    {type === 'cards' ? <CardIcon size={16} /> : <PieIcon size={16} />}
                  </div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    TOPLAM {type === 'cards' ? 'BORÇ' : 'GİDER'}
                  </span>
                  <span className={`text-xl sm:text-2xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {totalValue.toLocaleString('tr-TR')} ₺
                  </span>
                  <span className="text-[7px] font-bold text-slate-500 mt-1 uppercase opacity-60">
                    {data.length} KALEM ANALİZ
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-500 w-full">
                  <div
                    className="w-10 h-10 rounded-full mb-2 flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900"
                    style={{ backgroundColor: data[activeIndex].color }}
                  >
                    {type === 'cards' ? <CardIcon size={18} className="text-white" /> : <LayoutGrid size={18} className="text-white" />}
                  </div>

                  <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5 truncate max-w-[140px]">
                    {data[activeIndex].bankName ? `${data[activeIndex].bankName} - ` : ''}{data[activeIndex].name}
                  </span>
                  <span className={`text-xl sm:text-2xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {data[activeIndex].value.toLocaleString('tr-TR')} ₺
                  </span>

                  <div className="mt-2 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                    <span className="text-[9px] font-black text-blue-500">PAY: %{((data[activeIndex].value / totalValue) * 100).toFixed(0)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Legend Grid */}
        <div className="mt-2 sm:mt-6 w-full grid grid-cols-1 sm:grid-cols-2 gap-2 pr-1 pb-4 px-1">
          {data.length > 0 ? data.map((item, index) => {
            const isDebt = type === 'cards' ? item.originalValue > 0 : true;
            const isActive = activeIndex === index;
            return (
              <div
                key={index}
                onMouseEnter={() => onPieEnter(null, index)}
                onMouseLeave={onPieLeave}
                onClick={(e: any) => {
                  e.stopPropagation();
                  setActiveIndex(isActive ? null : index);
                }}
                className={`flex items-center justify-between p-3.5 rounded-2xl transition-all duration-300 border cursor-pointer ${isActive
                  ? (isDarkMode ? 'bg-slate-800 border-slate-600 shadow-[0_10px_20px_rgba(0,0,0,0.3)]' : 'bg-white border-blue-200 shadow-xl scale-[1.02]')
                  : 'bg-slate-50/50 dark:bg-slate-900/40 border-transparent hover:bg-white dark:hover:bg-slate-800'
                  }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-lg transition-transform ${isActive ? 'scale-125' : ''}`}
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex flex-col truncate">
                    <span className={`text-[10px] font-black uppercase tracking-tight truncate ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>
                      {item.name}
                    </span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase">%{((item.value / totalValue) * 100).toFixed(0)} PAY</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`text-xs font-black ${isDebt ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {isDebt ? '-' : '+'} {item.value.toLocaleString('tr-TR')} ₺
                  </span>
                  <ArrowRight size={12} className={`transition-transform duration-300 ${isActive ? 'translate-x-1 text-blue-500' : 'opacity-0'}`} />
                </div>
              </div>
            );
          }) : (
            <div className="col-span-1 sm:col-span-2 flex flex-col items-center justify-center py-10 text-slate-400 opacity-30 italic text-sm">
              <PieIcon size={32} className="mb-3" />
              BİR VERİ BULUNAMADI
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="flex flex-col h-full w-full select-none"
      onClick={() => setActiveIndex(null)}
    >
      {/* Header Tabs */}
      <div className="relative z-10 flex items-center justify-center gap-3 sm:gap-4 mb-2 sm:mb-4 px-1 pt-2">
        <div
          className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner relative z-20 overflow-x-auto no-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => { e.stopPropagation(); scrollToMode('cards'); }}
            className={`flex items-center gap-2 px-4 sm:px-5 py-3.5 min-h-[48px] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${mode === 'cards'
              ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600 dark:text-white scale-[1.02]'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
          >
            <CardIcon size={14} /> KARTLAR
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); scrollToMode('categories'); }}
            className={`flex items-center gap-2 px-4 sm:px-5 py-3.5 min-h-[48px] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${mode === 'categories'
              ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600 dark:text-white scale-[1.02]'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
          >
            <LayoutGrid size={14} /> KATEGORİ
          </button>
        </div>
      </div>

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex w-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
        style={{ scrollBehavior: isScrolling ? 'smooth' : 'auto' }}
      >
        {renderChartSlide(cardsData, cardsTotal, 'cards')}
        {renderChartSlide(categoriesData, categoriesTotal, 'categories')}
      </div>
    </div>
  );
};

export default DistributionChart;
