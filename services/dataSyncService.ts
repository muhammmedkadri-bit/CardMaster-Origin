
import { createClient } from '@supabase/supabase-js';
import { CreditCard, Transaction, Category, NotificationItem, ChatMessage } from '../types';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const dataSyncService = {
    // --- FETCH DATA ---
    async fetchAllData(userId: string) {
        if (!supabase) return null;

        const [cards, transactions, categories, notifications, chat] = await Promise.all([
            supabase.from('cards').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
            supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
            supabase.from('categories').select('*').eq('user_id', userId).order('name', { ascending: true }),
            supabase.from('notifications').select('*').eq('user_id', userId).order('timestamp', { ascending: false }),
            supabase.from('chat_history').select('*').eq('user_id', userId).order('created_at', { ascending: true })
        ]);

        return {
            cards: (cards.data || []).map(c => this.mapCardFromDB(c)),
            transactions: (transactions.data || []).map(t => this.mapTransactionFromDB(t)),
            categories: (categories.data || []).map(cat => this.mapCategoryFromDB(cat)),
            notifications: (notifications.data || []).map(n => this.mapNotificationFromDB(n)),
            chat: (chat.data || []).map(m => this.mapChatFromDB(m))
        };
    },

    // --- REALTIME SUBSCRIPTION ---
    subscribeToChanges(userId: string, onEvent: (table: string, payload: any) => void) {
        if (!supabase) return null;

        const sessionId = Math.random().toString(36).substring(7);
        console.log(`[Realtime] Subscribing for user: ${userId} (Session: ${sessionId})`);

        const channel = supabase.channel(`realtime_all_${userId}_${sessionId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, (p) => {
                console.log("[Realtime] Cards change:", p.eventType);
                onEvent('cards', p);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (p) => {
                console.log("[Realtime] Transactions change:", p.eventType);
                onEvent('transactions', p);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, (p) => {
                onEvent('categories', p);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (p) => {
                onEvent('notifications', p);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_history' }, (p) => {
                onEvent('chat_history', p);
            })
            .subscribe((status) => {
                console.log(`[Realtime] Status for ${userId}:`, status);
            });

        return channel;
    },

    // --- MUTATIONS ---
    async saveTransaction(userId: string, tx: Transaction) {
        if (!supabase) return;
        const dbTx = {
            id: tx.id.length > 20 ? tx.id : undefined,
            user_id: userId,
            card_id: tx.cardId,
            type: tx.type,
            amount: tx.amount,
            category: tx.category,
            date: tx.date,
            description: tx.description,
            confirmation_url: tx.confirmationUrl
        };
        const result = await supabase.from('transactions').upsert(dbTx).select().single();
        return result;
    },

    async deleteTransaction(txId: string) {
        if (!supabase) return;
        return await supabase.from('transactions').delete().eq('id', txId);
    },

    async upsertCard(userId: string, card: CreditCard) {
        if (!supabase) return;
        const dbCard = {
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
        };
        return await supabase.from('cards').upsert(dbCard).select().single();
    },

    async deleteCard(cardId: string) {
        if (!supabase) return;
        return await supabase.from('cards').delete().eq('id', cardId);
    },

    async saveChatMessage(userId: string, message: ChatMessage) {
        if (!supabase) return;
        return await supabase.from('chat_history').insert({
            user_id: userId,
            role: message.role,
            content: message.content
        });
    },

    // --- MAPPERS ---
    mapCardFromDB(c: any): CreditCard {
        return {
            id: c.id,
            bankName: c.bank_name,
            cardName: c.card_name,
            lastFour: c.last_four,
            limit: Number(c.limit),
            balance: Number(c.balance),
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
            cardName: '',
            type: t.type,
            amount: Number(t.amount),
            category: t.category,
            date: t.date,
            description: t.description,
            confirmationUrl: t.confirmation_url
        };
    },

    mapCategoryFromDB(c: any): Category {
        return { id: c.id, name: c.name, color: c.color };
    },

    mapNotificationFromDB(n: any): NotificationItem {
        return { id: n.id, message: n.message, type: n.type as any, timestamp: n.timestamp, read: n.read };
    },

    mapChatFromDB(m: any): ChatMessage {
        return { role: m.role as any, content: m.content };
    }
};
