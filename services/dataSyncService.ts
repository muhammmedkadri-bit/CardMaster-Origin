import { supabase } from './supabaseClient';
import { CreditCard, Transaction, Category, NotificationItem, ChatMessage } from '../types';

let activeSyncChannel: any = null;

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

        // Use a persistent channel name for the user to allow cross-device broadcasting
        // Session ID is removed to allow multiple devices to join the SAME physical room for broadcasts
        const channelName = `user_sync_${userId}`;
        console.log(`[Realtime] Subscribing to: ${channelName}`);

        const channel = supabase.channel(channelName)
            .on('postgres_changes', { event: '*', schema: 'public' }, (p) => {
                console.log(`[Realtime] DB Change [${p.table}]:`, p.eventType);
                onEvent(p.table, p);
            })
            .on('broadcast', { event: 'refresh' }, () => {
                console.log("[Realtime] Sync broadcast received! Forcing refetch...");
                onEvent('force_refresh', {});
            })
            .subscribe((status, err) => {
                console.log(`[Realtime] Status [${channelName}]:`, status);
                if (status === 'CHANNEL_ERROR') {
                    console.error('[Realtime] Connection Error:', err);
                }
            });

        activeSyncChannel = channel;
        return channel;
    },

    async sendSyncSignal(userId: string) {
        if (!supabase) return;

        // Reuse existing active channel if possible for 0-latency broadcast
        if (activeSyncChannel && activeSyncChannel.state === 'joined') {
            activeSyncChannel.send({
                type: 'broadcast',
                event: 'refresh',
                payload: { timestamp: Date.now() }
            });
            return;
        }

        const channel = supabase.channel(`user_sync_${userId}`);
        await channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.send({
                    type: 'broadcast',
                    event: 'refresh',
                    payload: { timestamp: Date.now() }
                });
                // We don't need to keep this temporary channel open
                setTimeout(() => supabase.removeChannel(channel), 1000);
            }
        });
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

    async updateNotificationReadStatus(notificationId: string, readState: boolean) {
        if (!supabase) return;
        return await supabase.from('notifications').update({ read: readState }).eq('id', notificationId);
    },

    async markAllNotificationsAsRead(userId: string) {
        if (!supabase) return;
        return await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
    },

    async deleteNotification(notificationId: string) {
        if (!supabase) return;
        return await supabase.from('notifications').delete().eq('id', notificationId);
    },

    async deleteAllNotifications(userId: string) {
        if (!supabase) return;
        return await supabase.from('notifications').delete().eq('user_id', userId);
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
