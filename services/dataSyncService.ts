import { supabase } from './supabaseClient';
import { CreditCard, Transaction, Category, NotificationItem, ChatMessage, AutoPayment } from '../types';

let activeSyncChannel: any = null;

export const dataSyncService = {
    // --- FETCH DATA ---
    async fetchAllData(userId: string) {
        if (!supabase) return null;

        try {
            const [cards, transactions, categories, notifications, chat, autoPayments] = await Promise.all([
                supabase.from('cards').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
                supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
                supabase.from('categories').select('*').eq('user_id', userId).order('name', { ascending: true }),
                supabase.from('notifications').select('*').eq('user_id', userId).order('timestamp', { ascending: false }),
                supabase.from('chat_history').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
                supabase.from('auto_payments').select('*').eq('user_id', userId).order('day_of_month', { ascending: true })
            ]);

            // If any critical fetch failed, return null instead of empty arrays
            // This prevents overwriting local state with "nothing" due to a temporary network error
            if (cards.error || transactions.error || categories.error) {
                console.error('[DataSync] Fetch error:', {
                    cards: cards.error,
                    transactions: transactions.error,
                    categories: categories.error
                });
                return null;
            }

            return {
                cards: (cards.data || []).map(c => this.mapCardFromDB(c)),
                transactions: (transactions.data || []).map(t => this.mapTransactionFromDB(t)),
                categories: (categories.data || []).map(cat => this.mapCategoryFromDB(cat)),
                notifications: (notifications.data || []).map(n => this.mapNotificationFromDB(n)),
                chat: (chat.data || []).map(m => this.mapChatFromDB(m)),
                autoPayments: (autoPayments.data || []).map(ap => this.mapAutoPaymentFromDB(ap))
            };
        } catch (e) {
            console.error('[DataSync] Unknown fetch error:', e);
            return null;
        }
    },

    // --- REALTIME SUBSCRIPTION ---
    subscribeToChanges(userId: string, onEvent: (table: string, payload: any) => void) {
        if (!supabase) return null;

        // Use a persistent channel name for the user to allow cross-device broadcasting
        // Session ID is removed to allow multiple devices to join the SAME physical room for broadcasts
        const channelName = `user_sync_${userId}`;


        const channel = supabase.channel(channelName)
            .on('postgres_changes', { event: '*', schema: 'public' }, (p) => {

                onEvent(p.table, p);
            })
            .on('broadcast', { event: 'refresh' }, () => {

                onEvent('force_refresh', {});
            })
            .subscribe((status, err) => {

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
        if (!supabase) {
            console.error('[DataSync] Supabase client not initialized!');
            throw new Error('Supabase client not available');
        }

        const dbTx = {
            id: tx.id.length > 20 ? tx.id : undefined,
            user_id: userId,
            card_id: tx.cardId,
            type: tx.type,
            amount: tx.amount,
            category: tx.category,
            date: tx.date,
            description: tx.description,
            confirmation_url: tx.confirmationUrl,
            expense_type: tx.expenseType,
            installments: (tx as any).installments,
            installment_amount: (tx as any).installmentAmount,
            total_amount: (tx as any).totalAmount,
            installment_group_id: (tx as any).installmentGroupId,
            installment_number: (tx as any).installmentNumber
        };

        console.log('[DataSync] Saving transaction to Supabase:', {
            txId: tx.id,
            userId,
            amount: tx.amount,
            type: tx.type,
            dbPayload: dbTx
        });

        const { data, error } = await supabase.from('transactions').upsert(dbTx).select().single();

        if (error) {
            console.error('❌ [DataSync] Supabase transaction save FAILED:', {
                error,
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            // CRITICAL: Throw the error so App.tsx can handle it
            throw error;
        }

        console.log('✅ [DataSync] Transaction saved successfully:', data);
        return { data, error: null };
    },

    async deleteTransaction(txId: string) {
        if (!supabase) return;
        return await supabase.from('transactions').delete().eq('id', txId);
    },

    async upsertCard(userId: string, card: CreditCard) {
        if (!supabase) {
            console.error('[DataSync] Supabase client not initialized!');
            throw new Error('Supabase client not available');
        }

        const dbCard = {
            id: card.id.length > 20 ? card.id : undefined,
            user_id: userId,
            bank_name: card.bankName,
            card_name: card.cardName,
            last_four: card.lastFour,
            limit: card.limit,
            statement_day: card.statementDay,
            due_day: card.dueDay,
            color: card.color,
            min_payment_ratio: card.minPaymentRatio
        };

        console.log('[DataSync] Saving card to Supabase:', { cardId: card.id, userId, cardName: card.cardName });

        const { data, error } = await supabase.from('cards').upsert(dbCard).select().single();

        if (error) {
            console.error('❌ [DataSync] Supabase card save FAILED:', {
                error,
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            throw error;
        }

        console.log('✅ [DataSync] Card saved successfully:', data);
        return { data, error: null };
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
        // Soft delete: keep the record to prevent re-triggering, but hide from UI
        return await supabase.from('notifications').update({ is_deleted: true }).eq('id', notificationId);
    },

    async saveNotification(userId: string, notification: NotificationItem) {
        if (!supabase) return;
        return await supabase.from('notifications').insert({
            user_id: userId,
            message: notification.message,
            type: notification.type,
            timestamp: notification.timestamp,
            read: notification.read,
            date_key: notification.dateKey,
            card_color: notification.cardColor,
            card_name: notification.cardName,
            is_mandatory: notification.isMandatory,
            is_deleted: notification.isDeleted
        });
    },

    async deleteAllNotifications(userId: string) {
        if (!supabase) return;
        return await supabase.from('notifications').delete().eq('user_id', userId);
    },

    async upsertCategory(userId: string, category: Category) {
        if (!supabase) return;
        const dbCat = {
            id: category.id.length > 20 ? category.id : undefined,
            user_id: userId,
            name: category.name,
            color: category.color
        };
        return await supabase.from('categories').upsert(dbCat).select().single();
    },

    async deleteCategory(categoryId: string) {
        if (!supabase) return;
        return await supabase.from('categories').delete().eq('id', categoryId);
    },

    async saveChatMessage(userId: string, message: ChatMessage) {
        if (!supabase) return;
        return await supabase.from('chat_history').insert({
            user_id: userId,
            role: message.role,
            content: message.content
        });
    },

    async upsertAutoPayment(userId: string, ap: AutoPayment) {
        if (!supabase) return;
        const dbAp = {
            id: ap.id.length > 20 ? ap.id : undefined,
            user_id: userId,
            card_id: ap.cardId,
            category: ap.category,
            amount: ap.amount,
            day_of_month: ap.dayOfMonth,
            description: ap.description,
            last_processed_month: ap.lastProcessedMonth,
            active: ap.active
        };
        return await supabase.from('auto_payments').upsert(dbAp).select().single();
    },

    async resetUserData(userId: string) {
        if (!supabase) return;

        // Parallel deletion across all user-related tables for a clean slate
        return await Promise.all([
            supabase.from('cards').delete().eq('user_id', userId),
            supabase.from('transactions').delete().eq('user_id', userId),
            supabase.from('categories').delete().eq('user_id', userId),
            supabase.from('notifications').delete().eq('user_id', userId),
            supabase.from('chat_history').delete().eq('user_id', userId),
            supabase.from('auto_payments').delete().eq('user_id', userId)
        ]);
    },

    async deleteAutoPayment(id: string) {
        if (!supabase) return;
        return await supabase.from('auto_payments').delete().eq('id', id);
    },

    // --- MAPPERS ---
    mapCardFromDB(c: any): CreditCard {
        return {
            id: c.id,
            bankName: c.bank_name,
            cardName: c.card_name,
            lastFour: c.last_four,
            limit: Number(c.limit),
            statementDay: c.statement_day,
            dueDay: Number(c.due_day),
            color: c.color,
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
            confirmationUrl: t.confirmation_url,
            // Map metadata fields
            expenseType: t.expense_type,
            installments: t.installments,
            installmentAmount: Number(t.installment_amount) || undefined,
            totalAmount: Number(t.total_amount) || undefined,
            installmentGroupId: t.installment_group_id,
            installmentNumber: t.installment_number
        };
    },

    mapCategoryFromDB(c: any): Category {
        return { id: c.id, name: c.name, color: c.color };
    },

    mapNotificationFromDB(n: any): NotificationItem {
        return {
            id: n.id,
            message: n.message,
            type: n.type as any,
            timestamp: n.timestamp,
            read: n.read,
            dateKey: n.date_key,
            cardColor: n.card_color,
            cardName: n.card_name,
            isMandatory: n.is_mandatory,
            isDeleted: n.is_deleted
        };
    },

    mapChatFromDB(m: any): ChatMessage {
        return { role: m.role as any, content: m.content };
    },

    mapAutoPaymentFromDB(ap: any): AutoPayment {
        return {
            id: ap.id,
            cardId: ap.card_id,
            category: ap.category,
            amount: Number(ap.amount),
            dayOfMonth: ap.day_of_month,
            description: ap.description,
            lastProcessedMonth: ap.last_processed_month,
            active: ap.active
        };
    }
};
