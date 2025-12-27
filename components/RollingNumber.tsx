
import React, { useState, useEffect } from 'react';

interface RollingNumberProps {
    value: number;
    currency?: string;
    className?: string;
}

const RollingNumber: React.FC<RollingNumberProps> = ({ value, currency = '₺', className = '' }) => {
    const isPercent = currency === '%';
    const formatOptions = isPercent
        ? { minimumFractionDigits: 1, maximumFractionDigits: 1 }
        : { minimumFractionDigits: 0, maximumFractionDigits: 0 };

    const finalStr = value.toLocaleString('tr-TR', formatOptions);
    // Initialize with zeros in the same structure as the final number to ensure all digits roll on mount
    const [displayStr, setDisplayStr] = useState(finalStr.replace(/\d/g, '0'));

    useEffect(() => {
        const timer = setTimeout(() => {
            setDisplayStr(finalStr);
        }, 50);
        return () => clearTimeout(timer);
    }, [finalStr]);

    const chars = displayStr.split('');

    return (
        <div className={`inline-flex items-baseline font-mono tabular-nums ${className}`} dir="ltr">
            <div className="flex items-baseline leading-[1.2em]">
                {chars.map((char, index) => {
                    const isDigit = /\d/.test(char);

                    if (!isDigit) {
                        return (
                            <span key={`char-${index}`} className="opacity-70 select-none px-[0.5px] leading-[1.2em]">
                                {char}
                            </span>
                        );
                    }

                    return (
                        <div
                            key={`digit-${index}`}
                            className="relative w-[0.6em] h-[1.2em] overflow-hidden flex flex-col items-center"
                            style={{ height: '1.2em' }}
                        >
                            <div
                                className="transition-all ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-col items-center absolute left-0 right-0"
                                style={{
                                    transform: `translateY(-${Number(char) * 10}%)`,
                                    transitionDuration: '1500ms',
                                    transitionDelay: `${(chars.length - index - 1) * 50}ms`
                                }}
                            >
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                    <span key={num} className="block h-[1.2em] leading-[1.2em] text-center w-full">
                                        {num}
                                    </span>
                                ))}
                            </div>
                            <span className="invisible h-[1.2em] leading-[1.2em]">{char}</span>
                        </div>
                    );
                })}
            </div>

            {/* All currency symbols on the right */}
            {currency && (
                <span className="ml-1 opacity-70 shrink-0 select-none leading-[1.2em]">{currency}</span>
            )}
        </div>
    );
};

export default RollingNumber;
