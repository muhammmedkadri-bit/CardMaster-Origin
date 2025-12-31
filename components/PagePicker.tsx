import React, { useRef, useEffect, useState } from 'react';

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
            container.scrollTo({
                left: targetX,
                behavior: 'smooth'
            });
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
        <div className="flex flex-col items-center w-full max-w-[280px] mx-auto select-none">
            {/* Main Container */}
            <div
                className={`relative h-[72px] w-full rounded-[20px] border transition-all duration-300 overflow-hidden ${isDarkMode
                        ? 'bg-slate-900 border-slate-800 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.03)]'
                        : 'bg-white border-slate-200 shadow-[0_15px_40px_-10px_rgba(37,99,235,0.12),inset_0_1px_2px_rgba(0,0,0,0.03)]'
                    }`}
            >
                {/* Scroll Container */}
                <div
                    ref={containerRef}
                    className="h-full flex items-center overflow-x-auto no-scrollbar"
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
                                <div
                                    className={`w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all duration-200 ${isActive
                                            ? (isDarkMode
                                                ? 'bg-blue-500/15 ring-2 ring-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3),inset_0_0_10px_rgba(59,130,246,0.1)]'
                                                : 'bg-blue-500/10 ring-2 ring-blue-500/40 shadow-[0_0_20px_rgba(37,99,235,0.2),inset_0_0_10px_rgba(37,99,235,0.05)]')
                                            : 'bg-transparent ring-0'
                                        }`}
                                >
                                    <span
                                        className={`text-lg font-black tabular-nums transition-all duration-200 ${isActive
                                                ? (isDarkMode ? 'text-white scale-110' : 'text-blue-600 scale-110')
                                                : (isDarkMode ? 'text-slate-600 scale-90' : 'text-slate-400 scale-90')
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

                {/* Center Focus Ring - Static Indicator */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div
                        className={`w-[48px] h-[48px] rounded-full border-2 transition-colors duration-300 ${isDarkMode
                                ? 'border-blue-500/20'
                                : 'border-blue-500/15'
                            }`}
                        style={{
                            boxShadow: isDarkMode
                                ? 'inset 0 0 15px rgba(59,130,246,0.1), 0 0 20px rgba(59,130,246,0.05)'
                                : 'inset 0 0 15px rgba(37,99,235,0.05), 0 0 20px rgba(37,99,235,0.03)'
                        }}
                    />
                </div>

                {/* Edge Fades */}
                <div className={`absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r pointer-events-none z-20 ${isDarkMode ? 'from-slate-900 via-slate-900/80' : 'from-white via-white/80'
                    } to-transparent`} />
                <div className={`absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l pointer-events-none z-20 ${isDarkMode ? 'from-slate-900 via-slate-900/80' : 'from-white via-white/80'
                    } to-transparent`} />
            </div>

            {/* Page Context - Ring Indicators */}
            <div className="mt-4 flex items-center justify-center gap-2">
                {pages.length <= 8 ? pages.map((_, i) => (
                    <div
                        key={i}
                        className={`transition-all duration-300 rounded-full ${activeIndex === i
                                ? `w-2.5 h-2.5 ${isDarkMode ? 'bg-blue-500 ring-2 ring-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-blue-600 ring-2 ring-blue-600/25 shadow-[0_0_8px_rgba(37,99,235,0.4)]'}`
                                : `w-1.5 h-1.5 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`
                            }`}
                    />
                )) : (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                        <span className={`text-xs font-black ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{activeIndex + 1}</span>
                        <span className={`text-[10px] font-bold ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>/</span>
                        <span className={`text-xs font-black ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{totalPages}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PagePicker;
