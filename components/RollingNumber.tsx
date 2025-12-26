
import React, { useState, useEffect } from 'react';

interface RollingNumberProps {
    value: number;
    currency?: string;
    className?: string;
}

const RollingNumber: React.FC<RollingNumberProps> = ({ value, currency = '₺', className = '' }) => {
    const [displayValue, setDisplayValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDisplayValue(value);
        }, 50);
        return () => clearTimeout(timer);
    }, [value]);

    const formatted = Math.floor(displayValue)
        .toLocaleString('tr-TR')
        .split('');

    return (
        <div className={`flex items-baseline overflow-hidden ${className}`}>
            {currency && <span className="mr-1 opacity-70">{currency}</span>}
            <div className="flex">
                {formatted.map((char, index) => (
                    <div key={index} className="relative h-[1.2em] overflow-hidden flex items-center">
                        {char === '.' || char === ',' ? (
                            <span className="px-0.5">{char}</span>
                        ) : (
                            <div
                                className="transition-all duration-700 ease-[cubic-bezier(0.45,0.05,0.55,0.95)] flex flex-col"
                                style={{
                                    transform: `translateY(-${Number(char) * 10}%)`,
                                }}
                            >
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                    <span key={num} className="block leading-none">
                                        {num}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RollingNumber;
