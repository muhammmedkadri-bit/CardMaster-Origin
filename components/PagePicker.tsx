import React, { useRef, useEffect, useState } from 'react';

interface PagePickerProps {
    totalPages: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    isDarkMode: boolean;
}

const PagePicker: React.FC<PagePickerProps> = ({ totalPages, currentPage, onPageChange, isDarkMode }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isScrolling, setIsScrolling] = useState(false);
    const [internalPage, setInternalPage] = useState(currentPage);

    const ITEM_WIDTH = 60; // Each number's width in pixels

    // Sync internal page with prop
    useEffect(() => {
        if (!isScrolling) {
            setInternalPage(currentPage);
            // Scroll to the active page
            scrollToPage(currentPage);
        }
    }, [currentPage, isScrolling]);

    const scrollToPage = (page: number) => {
        if (containerRef.current) {
            const container = containerRef.current;
            const centerOffset = container.offsetWidth / 2;
            const targetScroll = (page - 1) * ITEM_WIDTH + (ITEM_WIDTH / 2) - centerOffset;

            container.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            });
        }
    };

    const handleScroll = () => {
        if (!containerRef.current) return;
        setIsScrolling(true);

        const container = containerRef.current;
        const centerOffset = container.offsetWidth / 2;
        const currentScroll = container.scrollLeft + centerOffset;
        const calculatedPage = Math.round((currentScroll - (ITEM_WIDTH / 2)) / ITEM_WIDTH) + 1;

        const validPage = Math.max(1, Math.min(totalPages, calculatedPage));
        if (validPage !== internalPage) {
            setInternalPage(validPage);
        }
    };

    const handleScrollEnd = () => {
        setIsScrolling(false);
        if (internalPage !== currentPage) {
            onPageChange(internalPage);
        }
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let timeout: NodeJS.Timeout;
        const onScroll = () => {
            handleScroll();
            clearTimeout(timeout);
            timeout = setTimeout(handleScrollEnd, 150);
        };

        container.addEventListener('scroll', onScroll);
        return () => container.removeEventListener('scroll', onScroll);
    }, [internalPage, currentPage, totalPages]);

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="relative w-full max-w-[280px] mx-auto overflow-hidden">
            {/* Container with mask for fade effect */}
            <div
                className={`relative h-16 rounded-full border transition-all duration-500 overflow-hidden ${isDarkMode
                        ? 'bg-black border-slate-800 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]'
                        : 'bg-slate-900 border-slate-700 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]'
                    }`}
            >
                {/* Horizontal Scroll Area */}
                <div
                    ref={containerRef}
                    className="h-full flex items-center overflow-x-auto no-scrollbar snap-x snap-mandatory px-[50%]"
                    style={{
                        paddingLeft: 'calc(50% - 30px)',
                        paddingRight: 'calc(50% - 30px)',
                        scrollbarWidth: 'none'
                    }}
                >
                    {pages.map((page) => {
                        const isActive = internalPage === page;
                        return (
                            <button
                                key={page}
                                onClick={() => {
                                    onPageChange(page);
                                    scrollToPage(page);
                                }}
                                className={`grow-0 shrink-0 w-[60px] h-full flex flex-col items-center justify-center transition-all duration-300 snap-center outline-none`}
                            >
                                <span className={`text-xl font-black transition-all duration-300 ${isActive
                                        ? 'text-white scale-125'
                                        : 'text-slate-600 scale-90'
                                    }`}>
                                    {page}
                                </span>
                                {/* Underline for active page */}
                                <div className={`mt-1 h-0.5 rounded-full bg-white transition-all duration-500 ${isActive ? 'w-4 opacity-100' : 'w-0 opacity-0'
                                    }`} />
                            </button>
                        );
                    })}
                </div>

                {/* Ambient Glows */}
                <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black to-transparent pointer-events-none z-10" />
                <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black to-transparent pointer-events-none z-10" />
            </div>

            {/* Helper text */}
            <div className="mt-2 text-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] opacity-50">
                    SAYFA SEÇMEK İÇİN KAYDIRIN
                </span>
            </div>
        </div>
    );
};

export default PagePicker;
