-- =====================================================
-- EKSİK KOLONLARI EKLE
-- =====================================================
-- "Could not find the 'expense_type' column" hatası için
-- Supabase SQL Editor'da çalıştırın
-- =====================================================

-- Transactions tablosuna eksik kolonları ekle
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS expense_type TEXT DEFAULT 'single';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installments INTEGER;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installment_amount NUMERIC;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS total_amount NUMERIC;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS confirmation_url TEXT;

-- Cards tablosuna eksik kolonları ekle
ALTER TABLE cards ADD COLUMN IF NOT EXISTS last_four TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS min_payment_ratio INTEGER DEFAULT 20;

-- Notifications tablosuna eksik kolonları ekle
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS date_key TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS card_color TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS card_name TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Auto_payments tablosuna eksik kolonları ekle
ALTER TABLE auto_payments ADD COLUMN IF NOT EXISTS last_processed_month TEXT;
ALTER TABLE auto_payments ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- Kontrol
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
ORDER BY ordinal_position;
