
import React, { useState, useEffect } from 'react';

interface RollingNumberProps {
    value: number;
    currency?: string;
    className?: string;
}

const RollingNumber: React.FC<RollingNumberProps> = ({ value, currency = '₺', className = '' }) => {
    const [displayValue, setDisplayValue] = useState(value);

    useEffect(() => {
        setDisplayValue(value);
    }, [value]);

    // Handle both integer and decimal parts
    const isPercent = currency === '%';
    const formatOptions = isPercent
        ? { minimumFractionDigits: 1, maximumFractionDigits: 1 }
        : { minimumFractionDigits: 0, maximumFractionDigits: 0 };

    const formattedStr = displayValue.toLocaleString('tr-TR', formatOptions);
    const chars = formattedStr.split('');

    return (
        <div className={`flex items-baseline ${className}`} dir="ltr">
            {currency && !isPercent && (
                <span className="mr-1 opacity-70 shrink-0 select-none">{currency}</span>
            )}
            <div className="flex items-baseline">
                {chars.map((char, index) => {
                    const isDigit = /\d/.test(char);
                    if (!isDigit) {
                        return (
                            <span key={index} className="px-[0.5px] opacity-70 select-none">
                                {char}
                            </span>
                        );
                    }

                    return (
                        <div key={index} className="relative h-[1.1em] overflow-hidden flex items-center">
                            <div
                                className="transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-col items-center"
                                style={{
                                    transform: `translateY(-${Number(char) * 10}%)`,
                                }}
                            >
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                    <span key={num} className="block leading-[1.1em]">
                                        {num}
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
            {isPercent && (
                <span className="ml-0.5 opacity-70 shrink-0 select-none">{currency}</span>
            )}
        </div>
    );
};

export default RollingNumber;
