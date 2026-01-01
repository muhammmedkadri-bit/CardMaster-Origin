import { CreditCard } from '../types';

export interface StatementPeriod {
    startDate: Date;
    endDate: Date;
    dueDate: Date;
}

/**
 * Credit Card Calculation Service - Realistic Banking Logic
 */
export const creditCardService = {
    /**
     * Calculates the statement period and due date for a given transaction date and card settings.
     * 
     * @param date The date of the transaction or the date to check
     * @param statementDay The day of the month the statement is cut (1-31)
     * @param dueDay The day of the month the payment is due (1-31)
     */
    calculateStatementPeriod(date: Date, statementDay: number, dueDay: number): StatementPeriod {
        const d = new Date(date);
        const day = d.getDate();

        let periodStart: Date;
        let periodEnd: Date;

        if (day <= statementDay) {
            // Transaction is within the current month's statement (ends this month)
            periodEnd = new Date(d.getFullYear(), d.getMonth(), statementDay);
            periodStart = new Date(d.getFullYear(), d.getMonth() - 1, statementDay + 1);
        } else {
            // Transaction is after this month's statement cut-off (ends next month)
            periodEnd = new Date(d.getFullYear(), d.getMonth() + 1, statementDay);
            periodStart = new Date(d.getFullYear(), d.getMonth(), statementDay + 1);
        }

        // Adjust for months with fewer days (e.g. if statement day is 31 and month has 30 days)
        // Date constructor handles overflow automatically: new Date(2023, 1, 31) becomes Mar 3rd.
        // We want to snap to the last day of the month if it exceeds.
        periodEnd = this.getLastValidDayOfMonth(periodEnd.getFullYear(), periodEnd.getMonth(), statementDay);
        periodStart = this.getLastValidDayOfMonth(periodStart.getFullYear(), periodStart.getMonth(), statementDay + 1);

        // Calculate Due Date
        // If dueDay < statementDay, it's usually the next month after the statement end.
        // If dueDay > statementDay, it's usually the same month as the statement end.
        let dueMonth = periodEnd.getMonth();
        let dueYear = periodEnd.getFullYear();

        if (dueDay < statementDay) {
            dueMonth += 1;
        }

        // Create the date and then snap to month end if necessary
        let dueDate = this.getLastValidDayOfMonth(dueYear, dueMonth, dueDay);

        return {
            startDate: periodStart,
            endDate: periodEnd,
            dueDate: dueDate
        };
    },

    /**
     * Helper to ensure the day doesn't overflow to the next month.
     * e.g. If day is 31 but month only has 30 days, returns the 30th.
     */
    getLastValidDayOfMonth(year: number, month: number, targetDay: number): Date {
        // month is 0-indexed
        const lastDay = new Date(year, month + 1, 0).getDate();
        const finalDay = Math.min(targetDay, lastDay);
        return new Date(year, month, finalDay);
    },

    /**
     * Returns the current statement period for a card based on today's date.
     */
    getCurrentPeriod(card: CreditCard): StatementPeriod {
        return this.calculateStatementPeriod(new Date(), card.statementDay, card.dueDay);
    },

    /**
     * Calculates the difference in days between two dates.
     */
    getDaysRemaining(targetDate: Date): number {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(targetDate);
        target.setHours(0, 0, 0, 0);

        const diffTime = target.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    /**
     * Formats a date for display (Turkish locale)
     */
    formatDate(date: Date): string {
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'long'
        });
    }
};
