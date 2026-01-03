/**
 * SUPABASE BAĞLANTI VE VERİTABANI TEŞHİS ARACI
 * 
 * KULLANIM:
 * 1. Tarayıcıda uygulamanızı açın
 * 2. F12 ile Developer Tools'u açın
 * 3. Console sekmesine gidin
 * 4. Bu dosyadaki fonksiyonları kopyalayıp yapıştırın ve çalıştırın
 */

// ============================================
// TEŞHİS 1: SUPABASE BAĞLANTI TESTİ
// ============================================
async function testSupabaseConnection() {
    console.log('🔍 Supabase bağlantı testi başlıyor...');

    // Supabase client'ı kontrol et
    if (typeof supabase === 'undefined') {
        console.error('❌ HATA: Supabase client bulunamadı! Window scope\'da değil.');
        console.log('💡 İPUCU: supabaseClient.ts dosyasında export doğru mu?');
        return false;
    }

    console.log('✅ Supabase client mevcut');

    // Auth durumunu kontrol et
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
        console.error('❌ Auth hatası:', authError);
        return false;
    }

    if (!user) {
        console.error('❌ Kullanıcı oturum açmamış!');
        return false;
    }

    console.log('✅ Oturum aktif, User ID:', user.id);
    return user.id;
}

// ============================================
// TEŞHİS 2: TABLO YAPISI KONTROLÜ
// ============================================
async function checkTableStructure() {
    console.log('🔍 Transactions tablosu yapısı kontrol ediliyor...');

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .limit(0);

    if (error) {
        console.error('❌ Tablo erişim hatası:', {
            code: error.code,
            message: error.message,
            hint: error.hint
        });

        if (error.code === '42P01') {
            console.error('🚨 TABLO BULUNAMADI: transactions tablosu mevcut değil!');
        }
        return false;
    }

    console.log('✅ Transactions tablosuna erişim başarılı');
    return true;
}

// ============================================
// TEŞHİS 3: YAZMA TESTİ (EN ÖNEMLİ)
// ============================================
async function testTransactionWrite(userId) {
    console.log('🔍 Transaction yazma testi başlıyor...');

    const testId = 'test-' + Date.now();
    const testTx = {
        id: testId,
        user_id: userId,
        card_id: 'test-card-id',
        type: 'spending',
        amount: 1,
        category: 'Test',
        date: new Date().toISOString(),
        description: 'Diagnostic test - can be deleted',
        expense_type: 'single'
    };

    console.log('📝 Test transaction gönderiliyor:', testTx);

    const { data, error } = await supabase
        .from('transactions')
        .insert(testTx)
        .select()
        .single();

    if (error) {
        console.error('❌ YAZMA HATASI:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
        });

        // Belirli hata kodlarını analiz et
        if (error.code === '42501') {
            console.error('🔒 RLS POLİCY HATASI: INSERT izni yok!');
            console.log('💡 ÇÖZÜM: supabase_rls_fix.sql dosyasını Supabase SQL Editor\'da çalıştırın');
        } else if (error.code === '23503') {
            console.error('🔗 FOREIGN KEY HATASI: card_id geçersiz');
        } else if (error.code === '23502') {
            console.error('📋 NOT NULL HATASI: Zorunlu alan eksik');
            console.log('Eksik alan:', error.message);
        } else if (error.code === '42703') {
            console.error('📋 KOLON HATASI: Veritabanında olmayan bir kolon gönderildi');
            console.log('Hatalı kolon:', error.message);
        }

        return false;
    }

    console.log('✅ YAZMA TESTİ BAŞARILI! Veri kaydedildi:', data);

    // Test verisini sil
    await supabase.from('transactions').delete().eq('id', testId);
    console.log('🧹 Test verisi silindi');

    return true;
}

// ============================================
// TEŞHİS 4: OKUMA TESTİ
// ============================================
async function testTransactionRead(userId) {
    console.log('🔍 Transaction okuma testi başlıyor...');

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .limit(5);

    if (error) {
        console.error('❌ OKUMA HATASI:', {
            code: error.code,
            message: error.message
        });

        if (error.code === '42501') {
            console.error('🔒 RLS POLİCY HATASI: SELECT izni yok!');
        }

        return false;
    }

    console.log(`✅ Okuma başarılı. ${data.length} transaction bulundu:`, data);
    return true;
}

// ============================================
// TÜM TEŞHİSLERİ ÇALIŞTIR
// ============================================
async function runFullDiagnostics() {
    console.log('═══════════════════════════════════════════════');
    console.log('🏥 SUPABASE TAM TEŞHİS BAŞLIYOR');
    console.log('═══════════════════════════════════════════════');

    // 1. Bağlantı testi
    const userId = await testSupabaseConnection();
    if (!userId) {
        console.error('⛔ Bağlantı testi başarısız. Teşhis durduruluyor.');
        return;
    }

    console.log('───────────────────────────────────────────────');

    // 2. Tablo yapısı
    const tableOk = await checkTableStructure();
    if (!tableOk) {
        console.error('⛔ Tablo erişimi başarısız.');
        return;
    }

    console.log('───────────────────────────────────────────────');

    // 3. Okuma testi
    await testTransactionRead(userId);

    console.log('───────────────────────────────────────────────');

    // 4. Yazma testi
    const writeOk = await testTransactionWrite(userId);

    console.log('═══════════════════════════════════════════════');

    if (writeOk) {
        console.log('✅✅✅ TÜM TESTLer BAŞARILI!');
        console.log('Supabase bağlantısı ve RLS politikaları doğru çalışıyor.');
        console.log('Sorun başka bir yerde olabilir - App.tsx sync logic\'i kontrol edin.');
    } else {
        console.log('❌❌❌ YAZMA TESTİ BAŞARISIZ');
        console.log('🔧 ÇÖZÜM: supabase_rls_fix.sql dosyasını çalıştırın');
    }

    console.log('═══════════════════════════════════════════════');
}

// ÇALIŞTIR:
// runFullDiagnostics();
