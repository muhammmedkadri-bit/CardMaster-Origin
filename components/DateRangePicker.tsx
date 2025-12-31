
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';

interface DatePickerProps {
    label: string;
    value: string; // YYYY-MM-DD
    onChange: (date: string) => void;
    isDarkMode: boolean;
    minDate?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({ label, value, onChange, isDarkMode, minDate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date(value || new Date()));
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const monthNames = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    const handleDateClick = (day: number) => {
        const clickedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        onChange(formatDate(clickedDate));
        setIsOpen(false);
    };

    const calendarDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;

        const result = [];
        for (let i = 0; i < firstDay; i++) result.push(null);
        for (let i = 1; i <= days; i++) result.push(i);
        return result;
    }, [viewDate]);

    const displayDate = () => {
        if (!value) return 'Seçiniz';
        return new Date(value).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="relative flex-1" ref={containerRef}>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block opacity-60">
                {label}
            </label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-14 px-5 rounded-2xl border flex items-center justify-between transition-all duration-300 ${isOpen
                        ? 'border-blue-500 ring-4 ring-blue-500/10'
                        : (isDarkMode ? 'bg-slate-900/50 border-white/5 hover:border-white/10' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm')
                    }`}
            >
                <div className="flex items-center gap-3">
                    <CalendarIcon size={16} className={isOpen ? 'text-blue-500' : 'text-slate-400'} />
                    <span className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {displayDate()}
                    </span>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className={`absolute top-full left-0 right-0 mt-2 z-[150] p-5 rounded-[28px] border shadow-2xl animate-in fade-in zoom-in-95 duration-200 min-w-[280px] ${isDarkMode ? 'bg-slate-950 border-white/10' : 'bg-white border-slate-100'
                    }`}>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-[11px] font-black uppercase tracking-widest">
                            {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                        </span>
                        <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-1">
                        {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map(d => (
                            <div key={d} className="text-center text-[8px] font-black text-slate-500 uppercase pb-1">
                                {d}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, idx) => {
                            if (day === null) return <div key={`p-${idx}`} />;
                            const dStr = formatDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
                            const isSelected = dStr === value;
                            const isToday = dStr === formatDate(new Date());

                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleDateClick(day)}
                                    className={`aspect-square rounded-xl text-[11px] font-bold transition-all flex items-center justify-center ${isSelected
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 active:scale-90 scale-105'
                                            : (isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600')
                                        } ${isToday && !isSelected ? 'border border-blue-500/30' : ''}`}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

interface DateRangePickerProps {
    startDate: string;
    endDate: string;
    onChange: (start: string, end: string) => void;
    isDarkMode: boolean;
    label?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ startDate, endDate, onChange, isDarkMode, label }) => {
    return (
        <div className="flex flex-col gap-2 w-full">
            {label && <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 ml-1">{label}</p>}
            <div className="flex flex-col sm:flex-row gap-4">
                <DatePicker
                    label="BAŞLANGIÇ"
                    value={startDate}
                    onChange={(d) => onChange(d, endDate > d ? endDate : d)}
                    isDarkMode={isDarkMode}
                />
                <DatePicker
                    label="BİTİŞ"
                    value={endDate}
                    onChange={(d) => onChange(startDate < d ? startDate : d, d)}
                    isDarkMode={isDarkMode}
                    minDate={startDate}
                />
            </div>
        </div>
    );
};

export default DateRangePicker;
