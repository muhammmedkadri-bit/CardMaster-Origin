import { CreditCard, Transaction } from '../types';

export interface StatementPeriod {
    startDate: Date;
    endDate: Date;
    dueDate: Date;
}

export interface Statement {
    cardId: string;
    period: StatementPeriod;
    totalSpending: number;
    totalPayment: number;
    previousBalance: number; // Balance before this period started
    totalDebt: number;       // Current debt as of statement date
    minPayment: number;      // 20% or 40% of totalDebt
}

/**
 * Credit Card Calculation Service - Realistic Banking Logic
 */
// Interest Constants (TR Banking Standards)
const INTEREST_RATES = {
    PURCHASE: 3.66, // Akdi Faiz
    LATE: 3.96,     // Gecikme Faizi
    KKDF: 0.15,
    BSMV: 0.15
};

export const creditCardService = {
    // ... existing methodology ...

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

        // Adjust for months with fewer days
        periodEnd = this.getLastValidDayOfMonth(periodEnd.getFullYear(), periodEnd.getMonth(), statementDay);
        periodStart = this.getLastValidDayOfMonth(periodStart.getFullYear(), periodStart.getMonth(), statementDay + 1);

        // Calculate Due Date
        let dueMonth = periodEnd.getMonth();
        let dueYear = periodEnd.getFullYear();

        if (dueDay < statementDay) {
            dueMonth += 1;
        }

        let dueDate = this.getLastValidDayOfMonth(dueYear, dueMonth, dueDay);

        // Create boundaries with full daily coverage
        periodStart.setHours(0, 0, 0, 0);
        periodEnd.setHours(23, 59, 59, 999);
        dueDate.setHours(23, 59, 59, 999);

        return {
            startDate: periodStart,
            endDate: periodEnd,
            dueDate: dueDate
        };
    },

    getLastValidDayOfMonth(year: number, month: number, targetDay: number): Date {
        // month is 0-indexed
        const lastDay = new Date(year, month + 1, 0).getDate();
        const finalDay = Math.min(targetDay, lastDay);
        return new Date(year, month, finalDay);
    },

    getCurrentPeriod(card: CreditCard): StatementPeriod {
        return this.calculateStatementPeriod(new Date(), card.statementDay, card.dueDay);
    },

    getPreviousPeriod(card: CreditCard): StatementPeriod {
        // Approximate by going back 20 days from current start
        const current = this.getCurrentPeriod(card);
        const prevDate = new Date(current.startDate);
        prevDate.setDate(prevDate.getDate() - 15);
        return this.calculateStatementPeriod(prevDate, card.statementDay, card.dueDay);
    },

    getDaysRemaining(targetDate: Date): number {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(targetDate);
        target.setHours(0, 0, 0, 0);

        const diffTime = target.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    formatDate(date: Date): string {
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'long'
        });
    },

    calculateStatement(card: CreditCard, transactions: Transaction[], period: StatementPeriod): Statement {
        const cardTransactions = transactions.filter(t => t.cardId === card.id);

        // 1. Calculate Previous Balance (all transactions before the period start)
        const previousBalance = cardTransactions
            .filter(t => new Date(t.date) < period.startDate)
            .reduce((sum, t) => {
                // Interest behaves like spending (increases debt)
                const isDebtIncrease = t.type === 'spending';
                return isDebtIncrease ? sum + t.amount : sum - t.amount;
            }, 0);

        // 2. Calculate Current Period Activity
        let totalSpending = 0;
        let totalPayment = 0;

        cardTransactions
            .filter(t => {
                const d = new Date(t.date);
                return d >= period.startDate && d <= period.endDate;
            })
            .forEach(t => {
                if (t.type === 'spending') totalSpending += t.amount;
                else totalPayment += t.amount;
            });

        // 3. Totals
        const totalDebt = (previousBalance + totalSpending) - totalPayment;

        // 4. Minimum Payment
        const ratio = card.minPaymentRatio || 20;
        const minPayment = totalDebt > 0 ? (totalDebt * ratio) / 100 : 0;

        return {
            cardId: card.id,
            period,
            totalSpending,
            totalPayment,
            previousBalance,
            totalDebt: Math.max(0, totalDebt),
            minPayment: Math.round(minPayment * 100) / 100
        };
    },

    /**
     * Checks if a card needs an interest transaction added for the previous period.
     * Logic:
     * 1. Get Previous Period.
     * 2. Check if Due Date has passed.
     * 3. Calculate Statement for that period.
     * 4. Check 'Payments' made between Period End and Due Date.
     * 5. If (Statement Debt - Payments) > 0, calculate Interest.
     */
    calculateInterestTransaction(card: CreditCard, transactions: Transaction[]): Transaction | null {
        const prevPeriod = this.getPreviousPeriod(card);
        const today = new Date();

        // Only calculate if the Due Date of the previous period has passed
        if (today <= prevPeriod.dueDate) return null;

        // Check if we already have an 'interest' transaction for this period's due month
        // We assume borrowing check: if there is an interest transaction AFTER the period end, related to this cycle
        // A simple heuristic: check if any 'interest' tx exists with date > prevPeriod.endDate and date <= nextPeriod.startDate
        // Better: Unique logic or ID based. For now, check if any interest tx happened in the 'current' cycle for this card.
        const hasInterest = transactions.some(t =>
            t.cardId === card.id &&
            t.type === 'spending' &&
            t.category === 'Faiz & Ek Ücretler' &&
            new Date(t.date) > prevPeriod.endDate
        );

        if (hasInterest) return null;

        // Calculate Debt at end of Previous Period
        const statement = this.calculateStatement(card, transactions, prevPeriod);

        if (statement.totalDebt <= 0) return null;

        // Calculate Payments made AFTER the period end but BEFORE (or on) the Due Date
        // These count towards paying off that statement's debt
        const paymentsInGracePeriod = transactions
            .filter(t => t.cardId === card.id && t.type === 'payment')
            .filter(t => {
                const d = new Date(t.date);
                return d > prevPeriod.endDate && d <= prevPeriod.dueDate;
            })
            .reduce((sum, t) => sum + t.amount, 0);

        const paidAmount = paymentsInGracePeriod;
        // Effectively, the debt remaining from that statement is:
        const remainingDebt = Math.max(0, statement.totalDebt - paidAmount);
        const unpaidMinAmount = Math.max(0, statement.minPayment - paidAmount);

        if (remainingDebt <= 0) return null; // Fully paid, no interest

        // Calculate Interest
        // 1. Overdue Portion (if min payment not met) -> Late Rate
        // 2. Regular Rollover Portion (total - overdue) -> Purchase Rate

        const overdueAmount = unpaidMinAmount; // Amount subject to late fee
        const regularRolloverAmount = remainingDebt - overdueAmount; // Amount subject to normal interest

        // Simple Monthly Function (Standard Banking Approximation for UI)
        // Interest = Principal * Rate / 100
        // Taxes = Interest * (KKDF + BSMV)

        let rawInterest = 0;

        if (overdueAmount > 0) {
            rawInterest += overdueAmount * (INTEREST_RATES.LATE / 100);
        }
        if (regularRolloverAmount > 0) {
            rawInterest += regularRolloverAmount * (INTEREST_RATES.PURCHASE / 100);
        }

        const taxes = rawInterest * (INTEREST_RATES.KKDF + INTEREST_RATES.BSMV);
        const totalInterestAmount = rawInterest + taxes;

        // Create Transaction
        // Date should be the Due Date or the day after
        const interestDate = new Date(prevPeriod.dueDate);
        interestDate.setDate(interestDate.getDate() + 1); // Add day after due date

        return {
            id: `int-${card.id}-${prevPeriod.endDate.getTime()}`,
            cardId: card.id,
            cardName: card.cardName,
            type: 'spending', // Interest is debt increase (spending)
            amount: Math.round(totalInterestAmount * 100) / 100,
            category: 'Faiz & Ek Ücretler',
            date: interestDate.toISOString(),
            description: `Akdi Faiz ve Gecikme Bedeli (${prevPeriod.endDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })} Dönemi)`,
            expenseType: 'single'
        };
    },

    /**
     * Calculates future installment obligations grouped by month.
     * Returns a list of months with total installment amount for that month.
     */
    calculateFutureProjections(transactions: Transaction[], months: number = 12): { month: string; amount: number }[] {
        const today = new Date();
        const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

        const projections: Record<string, number> = {};

        transactions.forEach(t => {
            if (t.type !== 'spending') return;

            const d = new Date(t.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

            // Limit to logical future range (e.g. next 2 years) to avoid weird data
            // And strictly greater than current month for "Future" projection
            if (key > currentMonthKey) {
                if (!projections[key]) projections[key] = 0;
                projections[key] += t.amount;
            }
        });

        // Convert to array and sort
        return Object.entries(projections)
            .map(([month, amount]) => ({ month, amount }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(0, months);
    }
};
