import React, { useRef, useEffect, useState } from 'react';
import { smoothScrollElement } from '../utils/scrollUtils';

interface PagePickerProps {
    totalPages: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    isDarkMode: boolean;
}

const PagePicker: React.FC<PagePickerProps> = ({ totalPages, currentPage, onPageChange, isDarkMode }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(currentPage - 1);
    const isScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const ITEM_WIDTH = 56;

    // Sync activeIndex with currentPage from parent
    useEffect(() => {
        if (!isScrollingRef.current) {
            setActiveIndex(currentPage - 1);
        }
    }, [currentPage]);

    // Scroll to correct position when parent changes currentPage
    useEffect(() => {
        const container = containerRef.current;
        if (!container || isScrollingRef.current) return;

        const targetX = (currentPage - 1) * ITEM_WIDTH;
        const diff = Math.abs(container.scrollLeft - targetX);

        if (diff > 2) {
            smoothScrollElement(container, { left: targetX }, 1200);
        }
    }, [currentPage]);

    // Handle native scroll
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            isScrollingRef.current = true;

            const sl = container.scrollLeft;
            const newIndex = Math.round(sl / ITEM_WIDTH);
            const clampedIndex = Math.max(0, Math.min(totalPages - 1, newIndex));

            if (clampedIndex !== activeIndex) {
                setActiveIndex(clampedIndex);
            }

            // Clear existing timeout
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }

            // Set new timeout for scroll end
            scrollTimeoutRef.current = setTimeout(() => {
                isScrollingRef.current = false;
                const finalIndex = Math.round(container.scrollLeft / ITEM_WIDTH);
                const finalPage = Math.max(1, Math.min(totalPages, finalIndex + 1));

                if (finalPage !== currentPage) {
                    onPageChange(finalPage);
                }
            }, 120);
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            container.removeEventListener('scroll', handleScroll);
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [activeIndex, currentPage, totalPages, onPageChange]);

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="flex flex-col items-center w-full max-w-[300px] mx-auto select-none">
            {/* Main Container - Premium Depth Effect matching Menu Bar */}
            <div
                className={`relative h-[76px] w-full rounded-[24px] border transition-all duration-500 overflow-hidden ${isDarkMode
                    ? 'bg-[#0f172a]/95 border-slate-800/80 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.05),inset_0_-1px_1px_rgba(0,0,0,0.3)] backdrop-blur-xl'
                    : 'bg-white/95 border-slate-200/60 shadow-[0_20px_50px_-15px_rgba(37,99,235,0.15),inset_0_1px_2px_rgba(255,255,255,1),inset_0_-1px_1px_rgba(0,0,0,0.02)] backdrop-blur-xl'
                    }`}
            >
                {/* Inner Depth Frame */}
                <div className={`absolute inset-[3px] rounded-[21px] pointer-events-none ${isDarkMode
                    ? 'shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]'
                    : 'shadow-[inset_0_2px_8px_rgba(0,0,0,0.04)]'
                    }`} />

                {/* Scroll Container */}
                <div
                    ref={containerRef}
                    className="h-full flex items-center overflow-x-auto no-scrollbar relative z-10"
                    style={{
                        paddingLeft: 'calc(50% - 28px)',
                        paddingRight: 'calc(50% - 28px)',
                        scrollSnapType: 'x mandatory',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'none',
                        scrollBehavior: 'auto'
                    }}
                >
                    {pages.map((page, index) => {
                        const isActive = activeIndex === index;
                        return (
                            <div
                                key={page}
                                className="shrink-0 w-[56px] h-full flex items-center justify-center snap-center"
                            >
                                {/* Number Container with Depth Effect */}
                                <div
                                    className={`w-[46px] h-[46px] rounded-[16px] flex items-center justify-center transition-all duration-300 ${isActive
                                        ? (isDarkMode
                                            ? 'bg-slate-800 border border-slate-700 shadow-[inset_0_2px_6px_rgba(0,0,0,0.5),0_0_15px_rgba(148,163,184,0.2),0_4px_12px_rgba(0,0,0,0.3)]'
                                            : 'bg-white border border-slate-100 shadow-[inset_0_2px_6px_rgba(0,0,0,0.06),0_0_15px_rgba(148,163,184,0.15),0_4px_12px_rgba(0,0,0,0.08)]')
                                        : 'bg-transparent border-transparent'
                                        }`}
                                >
                                    <span
                                        className={`text-xl font-black tabular-nums transition-all duration-300 ${isActive
                                            ? (isDarkMode ? 'text-white drop-shadow-[0_0_8px_rgba(148,163,184,0.5)]' : 'text-slate-900 drop-shadow-[0_0_8px_rgba(148,163,184,0.3)]')
                                            : (isDarkMode ? 'text-slate-600' : 'text-slate-400')
                                            }`}
                                        style={{ fontVariantNumeric: 'tabular-nums' }}
                                    >
                                        {page}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Center Focus Indicator - Vertical Lines */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <div className="flex flex-col items-center justify-between h-full py-2">
                        <div className={`w-0.5 h-2 rounded-full ${isDarkMode ? 'bg-slate-500/40' : 'bg-slate-400/30'}`} />
                        <div className={`w-0.5 h-2 rounded-full ${isDarkMode ? 'bg-slate-500/40' : 'bg-slate-400/30'}`} />
                    </div>
                </div>

                {/* Edge Fades - Matching container background */}
                <div className={`absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r pointer-events-none z-30 ${isDarkMode ? 'from-[#0f172a] via-[#0f172a]/70' : 'from-white via-white/70'
                    } to-transparent`} />
                <div className={`absolute top-0 bottom-0 right-0 w-20 bg-gradient-to-l pointer-events-none z-30 ${isDarkMode ? 'from-[#0f172a] via-[#0f172a]/70' : 'from-white via-white/70'
                    } to-transparent`} />
            </div>

            {/* Page Context - Premium Pill Indicators */}
            <div className="mt-4 flex items-center justify-center gap-1.5">
                {pages.length <= 8 ? pages.map((_, i) => (
                    <div
                        key={i}
                        className={`transition-all duration-300 rounded-full ${activeIndex === i
                            ? `w-5 h-1.5 ${isDarkMode ? 'bg-slate-400 shadow-[0_0_10px_rgba(148,163,184,0.5)]' : 'bg-slate-700 shadow-[0_0_10px_rgba(71,85,105,0.3)]'}`
                            : `w-1.5 h-1.5 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`
                            }`}
                    />
                )) : (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isDarkMode
                        ? 'bg-slate-900/50 border-slate-800 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]'
                        : 'bg-slate-50 border-slate-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]'
                        }`}>
                        <span className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{activeIndex + 1}</span>
                        <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>/</span>
                        <span className={`text-sm font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{totalPages}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PagePicker;
