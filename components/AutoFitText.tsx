import React, { useRef, useEffect } from 'react';

interface AutoFitTextProps {
    text: string;
    color?: string;
    baseClass?: string;
}

const AutoFitText: React.FC<AutoFitTextProps> = React.memo(({ text, color, baseClass = "text-sm font-black truncate" }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        if (!containerRef.current || !textRef.current) return;

        const container = containerRef.current;
        const textEl = textRef.current;

        // Determine initial size based on baseClass to be more adaptive
        let size = 14;
        if (baseClass.includes('text-2xl') || baseClass.includes('sm:text-2xl')) size = 24;
        else if (baseClass.includes('text-xl') || baseClass.includes('sm:text-xl')) size = 20;
        else if (baseClass.includes('text-lg') || baseClass.includes('sm:text-lg')) size = 18;
        else if (baseClass.includes('text-base') || baseClass.includes('sm:text-base')) size = 16;

        // Reset to initial size
        textEl.style.fontSize = `${size}px`;

        // Synchronous shrink loop for instant fit
        // Checks if scrollWidth exceeds offsetWidth and reduces size
        while (textEl.scrollWidth > container.offsetWidth && size > 7) {
            size -= 0.5;
            textEl.style.fontSize = `${size}px`;
        }
    }, [text, baseClass]);

    return (
        <div ref={containerRef} className="w-full overflow-hidden">
            <p
                ref={textRef}
                className={baseClass}
                style={{ color, whiteSpace: 'nowrap' }}
            >
                {text}
            </p>
        </div>
    );
});

export default AutoFitText;
