import { supabase } from './supabaseClient';
import { CreditCard, Transaction, Category, NotificationItem, ChatMessage } from '../types';

export const dataSyncService = {
    // MIGRATE LOCAL STORAGE TO SUPABASE
    async migrateToCloud(userId: string, cards: CreditCard[], transactions: Transaction[], categories: Category[]) {
        if (!supabase) return false;
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

                    if (cardError) {
                        console.error('Card migration error:', cardError);
                        return false; // Fail immediately on card error
                    }

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
                            const { error: txError } = await supabase.from('transactions').insert(transactionsToInsert);
                            if (txError) return false;
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
        if (!supabase) return { cards: [], transactions: [], categories: [] };
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
        if (!supabase) return { data: null, error: null };
        return supabase.from('cards').upsert({
            id: card.id.length > 20 ? card.id : undefined,
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
        }).select().single();
    },

    // DELETE CARD
    async deleteCard(cardId: string) {
        if (!supabase) return null;
        return supabase.from('cards').delete().eq('id', cardId);
    },

    // SAVE TRANSACTION
    async saveTransaction(userId: string, tx: Transaction) {
        if (!supabase) return { data: null, error: null };
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
        }).select().single();
    },

    // DELETE TRANSACTION
    async deleteTransaction(txId: string) {
        if (!supabase) return null;
        return supabase.from('transactions').delete().eq('id', txId);
    },

    // --- NOTIFICATIONS ---
    async fetchNotifications(userId: string) {
        if (!supabase) return [];
        const { data } = await supabase.from('notifications').select('*').eq('user_id', userId);
        return (data || []).map(n => ({
            id: n.id,
            message: n.message,
            type: n.type,
            timestamp: n.created_at,
            read: n.read,
            dateKey: n.date_key,
            cardColor: n.card_color,
            cardName: n.card_name
        })) as NotificationItem[];
    },

    async syncNotifications(userId: string, notifications: NotificationItem[]) {
        if (!supabase || notifications.length === 0) return;

        const toUpsert = notifications.map(n => ({
            id: n.id.length > 20 ? n.id : undefined,
            user_id: userId,
            message: n.message,
            type: n.type,
            created_at: n.timestamp,
            read: n.read,
            date_key: n.dateKey,
            card_color: n.cardColor,
            card_name: n.cardName
        }));

        const { error } = await supabase.from('notifications').upsert(toUpsert, { onConflict: 'id' });
        if (error) console.error("Notification sync error", error);
    },

    // --- CHAT HISTORY ---
    async fetchChatHistory(userId: string) {
        if (!supabase) return [];
        const { data } = await supabase.from('chat_history').select('*').eq('user_id', userId).order('created_at', { ascending: true });
        return (data || []).map(d => ({ role: d.role, content: d.content } as ChatMessage));
    },

    async saveChatMessage(userId: string, message: ChatMessage) {
        if (!supabase) return;
        await supabase.from('chat_history').insert({
            user_id: userId,
            role: message.role,
            content: message.content
        });
    },

    async clearChatHistory(userId: string) {
        if (!supabase) return;
        await supabase.from('chat_history').delete().eq('user_id', userId);
    },

    async migrateChatHistory(userId: string, messages: ChatMessage[]) {
        if (!supabase || messages.length === 0) return;
        const toInsert = messages.map(m => ({
            user_id: userId,
            role: m.role,
            content: m.content
        }));
        await supabase.from('chat_history').insert(toInsert);
    },

    // --- REALTIME HELPERS ---
    mapCardFromDB(c: any): CreditCard {
        return {
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
        };
    },

    mapTransactionFromDB(t: any): Transaction {
        return {
            id: t.id,
            cardId: t.card_id,
            cardName: '', // Usually joined, needs lookup or ignore
            type: t.type,
            amount: t.amount,
            category: t.category,
            date: t.date,
            description: t.description,
            confirmationUrl: t.confirmation_url
        };
    },

    mapCategoryFromDB(c: any): Category {
        return {
            id: c.id,
            name: c.name,
            color: c.color
        };
    },

    mapNotificationFromDB(n: any): NotificationItem {
        return {
            id: n.id,
            message: n.message,
            type: n.type,
            timestamp: n.created_at,
            read: n.read,
            dateKey: n.date_key,
            cardColor: n.card_color,
            cardName: n.card_name
        };
    },

    mapChatFromDB(c: any): ChatMessage {
        return {
            role: c.role,
            content: c.content
        };
    },

    subscribeToChanges(userId: string, callbacks: {
        onCardChange: (payload: any) => void,
        onTransactionChange: (payload: any) => void,
        onCategoryChange: (payload: any) => void,
        onNotificationChange: (payload: any) => void,
        onChatChange: (payload: any) => void,
        onStatusChange?: (status: string) => void
    }) {
        if (!supabase) return null;

        // Her cihaz için tamamen benzersiz bir kanal oluşturarak çakışmayı önle
        const sessionId = Math.random().toString(36).substring(2, 7);
        const channelName = `realtime_${userId}_${sessionId}`;

        const channel = supabase.channel(channelName)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'cards', filter: `user_id=eq.${userId}` }, callbacks.onCardChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` }, callbacks.onTransactionChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${userId}` }, callbacks.onCategoryChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, callbacks.onNotificationChange)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_history', filter: `user_id=eq.${userId}` }, callbacks.onChatChange)
            .subscribe((status) => {
                console.log(`Realtime Channel Status: ${status}`);
                if (callbacks.onStatusChange) callbacks.onStatusChange(status);
            });

        return channel;
    }
};
