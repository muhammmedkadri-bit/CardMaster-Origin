import React, { useRef, useEffect, useState, useCallback } from 'react';

interface PagePickerProps {
    totalPages: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    isDarkMode: boolean;
}

const PagePicker: React.FC<PagePickerProps> = ({ totalPages, currentPage, onPageChange, isDarkMode }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(currentPage - 1);
    const [sidePadding, setSidePadding] = useState(100);

    // Each item is 60px wide
    const ITEM_WIDTH = 60;

    // Calculate dynamic padding to ensure perfect centering based on actual container width
    useEffect(() => {
        const updatePadding = () => {
            if (containerRef.current) {
                const width = containerRef.current.clientWidth;
                setSidePadding((width - ITEM_WIDTH) / 2);
            }
        };

        updatePadding();
        window.addEventListener('resize', updatePadding);
        return () => window.removeEventListener('resize', updatePadding);
    }, []);

    // Handle scroll to detect active page
    const handleScroll = useCallback(() => {
        if (!containerRef.current) return;
        const sl = containerRef.current.scrollLeft;
        const newIndex = Math.round(sl / ITEM_WIDTH);

        if (newIndex !== activeIndex && newIndex >= 0 && newIndex < totalPages) {
            setActiveIndex(newIndex);
        }
    }, [activeIndex, totalPages]);

    // Handle scroll end to notify parent
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let timeout: NodeJS.Timeout;
        const onScrollStop = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const finalIndex = Math.round(container.scrollLeft / ITEM_WIDTH) + 1;
                if (finalIndex !== currentPage && finalIndex >= 1 && finalIndex <= totalPages) {
                    onPageChange(finalIndex);
                }
            }, 100);
        };

        container.addEventListener('scroll', handleScroll);
        container.addEventListener('scroll', onScrollStop);
        return () => {
            container.removeEventListener('scroll', handleScroll);
            container.removeEventListener('scroll', onScrollStop);
        };
    }, [handleScroll, currentPage, onPageChange, totalPages]);

    // Sync from outside (parent control)
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const targetX = (currentPage - 1) * ITEM_WIDTH;
        if (Math.abs(container.scrollLeft - targetX) > 1) {
            container.scrollTo({
                left: targetX,
                behavior: 'smooth'
            });
        }
    }, [currentPage]);

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="flex flex-col items-center w-full max-w-[280px] mx-auto select-none">
            {/* The Outer Frame with deep shadows and border */}
            <div
                className={`relative h-20 w-full rounded-[24px] border border-white/10 transition-all duration-500 overflow-hidden ${isDarkMode
                        ? 'bg-slate-900 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.05)]'
                        : 'bg-white shadow-[0_20px_40px_-15px_rgba(37,99,235,0.15),inset_0_1px_4px_rgba(0,0,0,0.05)]'
                    }`}
            >
                {/* Horizontal Scrolling Dial */}
                <div
                    ref={containerRef}
                    className="h-full flex items-center overflow-x-auto no-scrollbar relative z-10"
                    style={{
                        paddingLeft: `${sidePadding}px`,
                        paddingRight: `${sidePadding}px`,
                        scrollSnapType: 'x mandatory',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'none'
                    }}
                >
                    {pages.map((page, index) => {
                        const isActive = activeIndex === index;
                        return (
                            <div
                                key={page}
                                className="shrink-0 w-[60px] h-full flex items-center justify-center snap-center"
                            >
                                {/* Fixed width container for digit to ensure perfect center alignment */}
                                <div className="w-[40px] flex items-center justify-center">
                                    <span
                                        className={`text-2xl font-black transition-all duration-300 transform ${isActive
                                                ? (isDarkMode ? 'text-white scale-125' : 'text-blue-600 scale-125')
                                                : (isDarkMode ? 'text-slate-700 scale-75' : 'text-slate-300 scale-75')
                                            }`}
                                    >
                                        {page}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Vertical Center Indicators (Top & Bottom Markers) */}
                <div className="absolute inset-x-0 inset-y-0 flex justify-center pointer-events-none z-20">
                    <div className="flex flex-col justify-between h-full py-2">
                        <div className={`w-1 h-1 rounded-full ${isDarkMode ? 'bg-blue-500' : 'bg-blue-600'}`}></div>
                        <div className={`w-1.5 h-3.5 rounded-full ${isDarkMode ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]'}`}></div>
                    </div>
                </div>

                {/* Left/Right Fade Overlays */}
                <div className={`absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r pointer-events-none z-20 ${isDarkMode ? 'from-slate-900 via-slate-900/60' : 'from-white via-white/60'
                    } to-transparent`} />
                <div className={`absolute top-0 bottom-0 right-0 w-20 bg-gradient-to-l pointer-events-none z-20 ${isDarkMode ? 'from-slate-900 via-slate-900/60' : 'from-white via-white/60'
                    } to-transparent`} />
            </div>

            {/* Pagination Breadcrumbs Context */}
            <div className="mt-3 flex items-center gap-1.5 opacity-60">
                {pages.length <= 10 ? pages.map((_, i) => (
                    <div
                        key={i}
                        className={`transition-all duration-300 rounded-full ${activeIndex === i
                                ? `w-4 h-1 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-600'}`
                                : `w-1 h-1 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'}`
                            }`}
                    />
                )) : (
                    <span className="text-[10px] font-black tracking-widest text-slate-500">
                        {activeIndex + 1} / {totalPages} SAYFA
                    </span>
                )}
            </div>
        </div>
    );
};

export default PagePicker;
