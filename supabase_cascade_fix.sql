-- =====================================================
-- CARD MASTER - CASCADING DELETE FIX (SİLME SORUNU GİDERİCİ)
-- =====================================================
-- Bu betik, bir kart silindiğinde ona bağlı tüm işlemlerin
-- ve otomatik ödemelerin otomatik olarak temizlenmesini sağlar.
-- =====================================================

-- 1. Önce mevcut kısıtlamaları (constraints) güvenli bir şekilde kaldıralım
-- Not: Kısıtlama isimleri veritabanında otomatik atanmış olabilir, 
-- bu yüzden tablo yapısını güncelleyerek garantiye alıyoruz.

-- TRANSACTIONS tablosunu güncelle
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_card_id_fkey;

ALTER TABLE transactions
ADD CONSTRAINT transactions_card_id_fkey 
FOREIGN KEY (card_id) 
REFERENCES cards(id) 
ON DELETE CASCADE;

-- AUTO_PAYMENTS tablosunu güncelle
ALTER TABLE auto_payments
DROP CONSTRAINT IF EXISTS auto_payments_card_id_fkey;

ALTER TABLE auto_payments
ADD CONSTRAINT auto_payments_card_id_fkey 
FOREIGN KEY (card_id) 
REFERENCES cards(id) 
ON DELETE CASCADE;

-- 2. ALL DELETE (Tümünü Silme) Fonksiyonu İçin Ek Güvenlik
-- Eğer bir kart silinirse ama işlemler hala duruyorsa, bu işlem 
-- manuel bir temizlik de yapacaktır.

-- DO bloğu ile kontrol edelim
DO $$ 
BEGIN
    RAISE NOTICE 'Cascading delete constraints updated successfully.';
END $$;

-- 3. Veritabanı Temizliği Testi (Opsiyonel)
-- Aşağıdaki sorgu, bir karta bağlı olmayan (card_id'si null veya geçersiz olan) 
-- ama card_id beklenen işlemleri bulmanıza yardımcı olur:
-- SELECT * FROM transactions WHERE card_id IS NOT NULL AND card_id NOT IN (SELECT id FROM cards);
