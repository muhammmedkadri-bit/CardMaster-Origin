-- =====================================================
-- CARD MASTER - TAM VERİTABANI ŞEMASI (TAKSİT DESTEKLİ)
-- =====================================================
-- Her taksit ayrı bir kayıt olarak saklanır
-- installmentGroupId ile birbirine bağlanır
-- =====================================================

-- 1. CARDS TABLOSU
CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    card_name TEXT NOT NULL,
    last_four TEXT,
    "limit" NUMERIC NOT NULL DEFAULT 0,
    statement_day INTEGER NOT NULL DEFAULT 1,
    due_day INTEGER NOT NULL DEFAULT 15,
    color TEXT DEFAULT '#3B82F6',
    min_payment_ratio INTEGER DEFAULT 20,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TRANSACTIONS TABLOSU (TAKSİT DESTEKLİ - HER TAKSİT AYRI KAYIT)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'spending' veya 'payment'
    amount NUMERIC NOT NULL, -- Bu işlemin tutarı (tek çekim veya tek taksit tutarı)
    category TEXT,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    description TEXT,
    confirmation_url TEXT,
    
    -- TAKSİT ALANLARI
    expense_type TEXT DEFAULT 'single', -- 'single' veya 'installment'
    installments INTEGER DEFAULT 1, -- Toplam taksit sayısı
    installment_amount NUMERIC, -- Her taksitin tutarı
    total_amount NUMERIC, -- Toplam borç tutarı (tüm taksitler)
    installment_group_id UUID, -- Aynı taksit grubundaki işlemleri bağlar
    installment_number INTEGER DEFAULT 1, -- Bu kaçıncı taksit (1/3, 2/3, 3/3)
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CATEGORIES TABLOSU
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6B7280',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. NOTIFICATIONS TABLOSU
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    read BOOLEAN DEFAULT FALSE,
    date_key TEXT,
    card_color TEXT,
    card_name TEXT,
    is_mandatory BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- 5. CHAT_HISTORY TABLOSU
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AUTO_PAYMENTS TABLOSU
CREATE TABLE IF NOT EXISTS auto_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    day_of_month INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    last_processed_month TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- EKSİK KOLONLARI EKLE (Mevcut tablolar için)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS expense_type TEXT DEFAULT 'single';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 1;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installment_amount NUMERIC;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS total_amount NUMERIC;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS confirmation_url TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installment_group_id UUID;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installment_number INTEGER DEFAULT 1;

ALTER TABLE cards ADD COLUMN IF NOT EXISTS last_four TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS min_payment_ratio INTEGER DEFAULT 20;

-- İNDEKSLER
CREATE INDEX IF NOT EXISTS idx_cards_user ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_tx_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_tx_card ON transactions(card_id);
CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_tx_type ON transactions(expense_type);
CREATE INDEX IF NOT EXISTS idx_tx_group ON transactions(installment_group_id);
CREATE INDEX IF NOT EXISTS idx_cat_user ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_ap_user ON auto_payments(user_id);

-- RLS AKTİF
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_payments ENABLE ROW LEVEL SECURITY;

-- CARDS POLİTİKALARI
DROP POLICY IF EXISTS "cards_select" ON cards;
DROP POLICY IF EXISTS "cards_insert" ON cards;
DROP POLICY IF EXISTS "cards_update" ON cards;
DROP POLICY IF EXISTS "cards_delete" ON cards;
CREATE POLICY "cards_select" ON cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cards_insert" ON cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cards_update" ON cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cards_delete" ON cards FOR DELETE USING (auth.uid() = user_id);

-- TRANSACTIONS POLİTİKALARI
DROP POLICY IF EXISTS "tx_select" ON transactions;
DROP POLICY IF EXISTS "tx_insert" ON transactions;
DROP POLICY IF EXISTS "tx_update" ON transactions;
DROP POLICY IF EXISTS "tx_delete" ON transactions;
CREATE POLICY "tx_select" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tx_insert" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tx_update" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tx_delete" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- CATEGORIES POLİTİKALARI
DROP POLICY IF EXISTS "cat_select" ON categories;
DROP POLICY IF EXISTS "cat_insert" ON categories;
DROP POLICY IF EXISTS "cat_update" ON categories;
DROP POLICY IF EXISTS "cat_delete" ON categories;
CREATE POLICY "cat_select" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cat_insert" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cat_update" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cat_delete" ON categories FOR DELETE USING (auth.uid() = user_id);

-- NOTIFICATIONS POLİTİKALARI
DROP POLICY IF EXISTS "notif_select" ON notifications;
DROP POLICY IF EXISTS "notif_insert" ON notifications;
DROP POLICY IF EXISTS "notif_update" ON notifications;
DROP POLICY IF EXISTS "notif_delete" ON notifications;
CREATE POLICY "notif_select" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_insert" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notif_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notif_delete" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- CHAT_HISTORY POLİTİKALARI
DROP POLICY IF EXISTS "chat_select" ON chat_history;
DROP POLICY IF EXISTS "chat_insert" ON chat_history;
DROP POLICY IF EXISTS "chat_delete" ON chat_history;
CREATE POLICY "chat_select" ON chat_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "chat_insert" ON chat_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_delete" ON chat_history FOR DELETE USING (auth.uid() = user_id);

-- AUTO_PAYMENTS POLİTİKALARI
DROP POLICY IF EXISTS "ap_select" ON auto_payments;
DROP POLICY IF EXISTS "ap_insert" ON auto_payments;
DROP POLICY IF EXISTS "ap_update" ON auto_payments;
DROP POLICY IF EXISTS "ap_delete" ON auto_payments;
CREATE POLICY "ap_select" ON auto_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ap_insert" ON auto_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ap_update" ON auto_payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ap_delete" ON auto_payments FOR DELETE USING (auth.uid() = user_id);

-- BİTTİ
SELECT 'TAKSİT DESTEKLİ ŞEMA HAZIR!' as sonuc;
