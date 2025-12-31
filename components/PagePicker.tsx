import React, { useRef, useEffect, useState, useCallback } from 'react';

interface PagePickerProps {
    totalPages: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    isDarkMode: boolean;
}

const PagePicker: React.FC<PagePickerProps> = ({ totalPages, currentPage, onPageChange, isDarkMode }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isUserScrolling, setIsUserScrolling] = useState(false);
    const [scrollX, setScrollX] = useState(0);
    const [activeIndex, setActiveIndex] = useState(currentPage - 1);

    const ITEM_WIDTH = 64; // Slightly wider for better spacing
    const VISIBLE_WIDTH = 260; // Total width of the picker window

    // Native scroll handler
    const onScroll = useCallback(() => {
        if (!containerRef.current) return;
        const sl = containerRef.current.scrollLeft;
        setScrollX(sl);

        // Calculate which page is in the center
        const newIndex = Math.round(sl / ITEM_WIDTH);
        if (newIndex !== activeIndex && newIndex >= 0 && newIndex < totalPages) {
            setActiveIndex(newIndex);
        }
    }, [activeIndex, totalPages]);

    // Handle scroll end to sync parent state
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let scrollTimeout: NodeJS.Timeout;
        const handleScrollStop = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const finalIndex = Math.round(container.scrollLeft / ITEM_WIDTH) + 1;
                if (finalIndex !== currentPage) {
                    onPageChange(finalIndex);
                }
                setIsUserScrolling(false);
            }, 100);
        };

        const handleScrollStart = () => {
            setIsUserScrolling(true);
            handleScrollStop();
        };

        container.addEventListener('scroll', onScroll);
        container.addEventListener('touchstart', handleScrollStart);
        container.addEventListener('mousedown', handleScrollStart);

        return () => {
            container.removeEventListener('scroll', onScroll);
            container.removeEventListener('touchstart', handleScrollStart);
            container.removeEventListener('mousedown', handleScrollStart);
        };
    }, [onScroll, currentPage, onPageChange]);

    // Externally controlled sync (when currentPage changes from outside)
    useEffect(() => {
        if (!isUserScrolling && containerRef.current) {
            const targetX = (currentPage - 1) * ITEM_WIDTH;
            if (Math.abs(containerRef.current.scrollLeft - targetX) > 5) {
                containerRef.current.scrollTo({
                    left: targetX,
                    behavior: 'smooth'
                });
            }
        }
    }, [currentPage, isUserScrolling]);

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    // Padding for the scroll area to allow first and last items to center
    const sidePadding = (VISIBLE_WIDTH - ITEM_WIDTH) / 2;

    return (
        <div className="flex flex-col items-center w-full max-w-[300px] mx-auto select-none">
            {/* The "Physical" Dial Container */}
            <div
                className={`relative h-20 w-full rounded-[28px] border transition-all duration-500 overflow-hidden group ${isDarkMode
                    ? 'bg-slate-900/40 border-slate-800 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.05)]'
                    : 'bg-white/40 border-slate-200 shadow-[0_10px_30px_-10px_rgba(37,99,235,0.1),inset_0_1px_1px_rgba(255,255,255,1)]'
                    } backdrop-blur-xl`}
            >
                {/* Horizontal Scroll Area */}
                <div
                    ref={containerRef}
                    className="h-full flex items-center overflow-x-auto no-scrollbar snap-x snap-mandatory relative z-20"
                    style={{
                        paddingLeft: `${sidePadding}px`,
                        paddingRight: `${sidePadding}px`,
                        scrollbarWidth: 'none',
                        scrollSnapType: 'x mandatory'
                    }}
                >
                    {pages.map((page, index) => {
                        // Calculate distance from center for "Lens Effect"
                        const distance = Math.abs(scrollX - (index * ITEM_WIDTH));
                        const scale = Math.max(0.7, 1.4 - (distance / (ITEM_WIDTH * 1.5)));
                        const opacity = Math.max(0.2, 1 - (distance / (ITEM_WIDTH * 2)));

                        return (
                            <div
                                key={page}
                                className="shrink-0 w-[64px] h-full flex flex-col items-center justify-center snap-center pointer-events-none"
                            >
                                <span
                                    className={`text-2xl font-black transition-colors duration-300 ${activeIndex === index
                                        ? (isDarkMode ? 'text-white' : 'text-blue-600')
                                        : (isDarkMode ? 'text-slate-600' : 'text-slate-400')
                                        }`}
                                    style={{
                                        transform: `scale(${scale})`,
                                        opacity: opacity
                                    }}
                                >
                                    {page}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Center Highlighter (Targeting Box) */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center pointer-events-none z-10">
                    <div
                        className={`w-14 h-14 rounded-2xl border-2 transition-all duration-500 ${isUserScrolling ? 'scale-110 opacity-30' : 'scale-100 opacity-100'
                            } ${isDarkMode ? 'border-blue-500/30' : 'border-blue-500/20'
                            }`}
                    />
                </div>

                {/* Active Underline Indicator */}
                <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none z-30">
                    <div className={`h-1 rounded-full transition-all duration-500 ${isDarkMode ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]'
                        }`}
                        style={{ width: isUserScrolling ? '4px' : '20px' }}
                    />
                </div>

                {/* Left & Right Shadow Mask for Smooth Fading */}
                <div className={`absolute inset-y-0 left-0 w-20 z-30 pointer-events-none ${isDarkMode ? 'bg-gradient-to-r from-slate-900/60 to-transparent' : 'bg-gradient-to-r from-white/60 to-transparent'
                    }`} />
                <div className={`absolute inset-y-0 right-0 w-20 z-30 pointer-events-none ${isDarkMode ? 'bg-gradient-to-l from-slate-900/60 to-transparent' : 'bg-gradient-to-l from-white/60 to-transparent'
                    }`} />
            </div>

            {/* Pagination Context Bar */}
            <div className="mt-4 flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-black text-blue-500">{activeIndex + 1}</span>
                    <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span className="text-[10px] font-black text-slate-400">{totalPages}</span>
                </div>
                <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] opacity-40">
                    KAYDIRARAK SAYFA SEÇİN
                </span>
            </div>
        </div>
    );
};

export default PagePicker;
