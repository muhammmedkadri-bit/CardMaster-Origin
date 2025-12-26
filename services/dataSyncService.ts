import { supabase } from './supabaseClient';
import { CreditCard, Transaction, Category } from '../types';

export const dataSyncService = {
    // MIGRATE LOCAL STORAGE TO SUPABASE
    async migrateToCloud(userId: string, cards: CreditCard[], transactions: Transaction[], categories: Category[]) {
        try {
            // 1. Migrate Categories
            if (categories.length > 0) {
                const categoriesToInsert = categories.map(cat => ({
                    user_id: userId,
                    name: cat.name,
                    color: cat.color
                }));
                await supabase.from('categories').upsert(categoriesToInsert, { onConflict: 'user_id, name' });
            }

            // 2. Migrate Cards
            if (cards.length > 0) {
                for (const card of cards) {
                    const { data: insertedCard, error: cardError } = await supabase
                        .from('cards')
                        .upsert({
                            user_id: userId,
                            bank_name: card.bankName,
                            card_name: card.cardName,
                            last_four: card.lastFour,
                            limit: card.limit,
                            balance: card.balance,
                            statement_day: card.statementDay,
                            due_day: card.dueDay,
                            color: card.color,
                            reminder_days_before: card.reminderDaysBefore,
                            min_payment_ratio: card.minPaymentRatio
                        })
                        .select()
                        .single();

                    if (cardError) console.error('Card migration error:', cardError);

                    // 3. Migrate Transactions for this card
                    if (insertedCard) {
                        const cardTransactions = transactions.filter(t => t.cardId === card.id);
                        if (cardTransactions.length > 0) {
                            const transactionsToInsert = cardTransactions.map(t => ({
                                user_id: userId,
                                card_id: insertedCard.id,
                                type: t.type,
                                amount: t.amount,
                                category: t.category,
                                date: t.date,
                                description: t.description,
                                confirmation_url: t.confirmationUrl
                            }));
                            await supabase.from('transactions').insert(transactionsToInsert);
                        }
                    }
                }
            }
            return true;
        } catch (error) {
            console.error('Migration failed:', error);
            return false;
        }
    },

    // FETCH ALL DATA FROM CLOUD
    async fetchUserData(userId: string) {
        const { data: cards } = await supabase.from('cards').select('*').eq('user_id', userId);
        const { data: transactions } = await supabase.from('transactions').select('*').eq('user_id', userId);
        const { data: categories } = await supabase.from('categories').select('*').eq('user_id', userId);

        return {
            cards: (cards || []).map(c => ({
                id: c.id,
                bankName: c.bank_name,
                cardName: c.card_name,
                lastFour: c.last_four,
                limit: c.limit,
                balance: c.balance,
                statementDay: c.statement_day,
                dueDay: c.due_day,
                color: c.color,
                reminderDaysBefore: c.reminder_days_before,
                minPaymentRatio: c.min_payment_ratio
            })) as CreditCard[],
            transactions: (transactions || []).map(t => ({
                id: t.id,
                cardId: t.card_id,
                type: t.type,
                amount: t.amount,
                category: t.category,
                date: t.date,
                description: t.description,
                confirmationUrl: t.confirmation_url
            })) as Transaction[],
            categories: (categories || []).map(cat => ({
                id: cat.id,
                name: cat.name,
                color: cat.color
            })) as Category[]
        };
    },

    // SINGLE CARD UPSERT
    async upsertCard(userId: string, card: CreditCard) {
        return supabase.from('cards').upsert({
            id: card.id.length > 20 ? card.id : undefined, // uuid check (simple)
            user_id: userId,
            bank_name: card.bankName,
            card_name: card.cardName,
            last_four: card.lastFour,
            limit: card.limit,
            balance: card.balance,
            statement_day: card.statementDay,
            due_day: card.dueDay,
            color: card.color,
            reminder_days_before: card.reminderDaysBefore,
            min_payment_ratio: card.minPaymentRatio
        });
    },

    // DELETE CARD
    async deleteCard(cardId: string) {
        return supabase.from('cards').delete().eq('id', cardId);
    },

    // SAVE TRANSACTION
    async saveTransaction(userId: string, tx: Transaction) {
        return supabase.from('transactions').upsert({
            id: tx.id.length > 20 ? tx.id : undefined,
            user_id: userId,
            card_id: tx.cardId,
            type: tx.type,
            amount: tx.amount,
            category: tx.category,
            date: tx.date,
            description: tx.description,
            confirmation_url: tx.confirmationUrl
        });
    },

    // DELETE TRANSACTION
    async deleteTransaction(txId: string) {
        return supabase.from('transactions').delete().eq('id', txId);
    }
};
