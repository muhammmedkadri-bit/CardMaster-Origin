
/**
 * Custom smooth scroll implementation for a more premium, slower feel.
 * @param targetY The target scroll position in pixels.
 * @param duration The duration of the scroll animation in milliseconds.
 */
export const smoothScrollTo = (targetY: number, duration: number = 1500) => {
    const startY = window.scrollY;
    const difference = targetY - startY;
    const startTime = performance.now();

    function easeOutCubic(t: number): number {
        return (--t) * t * t + 1;
    }

    function step(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = easeOutCubic(progress);

        window.scrollTo(0, startY + (difference * easeProgress));

        if (progress < 1) {
            requestAnimationFrame(step);
        }
    }

    requestAnimationFrame(step);
};

/**
 * Custom smooth scroll for specific HTML elements (horizontal or vertical).
 */
export const smoothScrollElement = (
    element: HTMLElement,
    target: { left?: number; top?: number },
    duration: number = 800
) => {
    const startLeft = element.scrollLeft;
    const startTop = element.scrollTop;
    const diffLeft = target.left !== undefined ? target.left - startLeft : 0;
    const diffTop = target.top !== undefined ? target.top - startTop : 0;
    const startTime = performance.now();

    function easeOutCubic(t: number): number {
        return (--t) * t * t + 1;
    }

    function step(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = easeOutCubic(progress);

        if (target.left !== undefined) {
            element.scrollLeft = startLeft + (diffLeft * easeProgress);
        }
        if (target.top !== undefined) {
            element.scrollTop = startTop + (diffTop * easeProgress);
        }

        if (progress < 1) {
            requestAnimationFrame(step);
        }
    }

    requestAnimationFrame(step);
};
