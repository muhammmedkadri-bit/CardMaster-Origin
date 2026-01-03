
import React, { useState, useEffect } from 'react';
import { CreditCard, Transaction, Category } from '../types';
import { X, ArrowDownRight, ArrowUpRight, Calendar, Plus, CreditCard as CardIcon } from 'lucide-react';

interface TransactionModalProps {
  type: 'spending' | 'payment';
  cards: CreditCard[];
  initialData?: Transaction;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  categories: Category[];
}

const TransactionModal: React.FC<TransactionModalProps> = ({ type, cards, initialData, onClose, onSave, categories }) => {
  const [formData, setFormData] = useState({
    id: initialData?.id || crypto.randomUUID(),
    cardId: initialData?.cardId || (cards[0]?.id || ''),
    amount: initialData?.amount ?? 0,
    category: initialData?.category || (type === 'payment' ? 'Ödeme' : (categories[0]?.name || 'Diğer')),
    description: initialData?.description || '',
    date: initialData?.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0],
    confirmationUrl: initialData?.confirmationUrl || '',
    extraAmount: 0,
    expenseType: ((initialData as any)?.expenseType || 'single') as 'single' | 'installment',
    installments: (initialData as any)?.installments || 1
  });

  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflowY = 'scroll';

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflowY = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        cardId: initialData.cardId || (cards[0]?.id || ''),
        amount: initialData.amount ?? 0,
        category: initialData.category || '',
        description: initialData.description || '',
        date: initialData.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0],
        confirmationUrl: initialData.confirmationUrl || '',
        extraAmount: 0,
        expenseType: ((initialData as any)?.expenseType || 'single') as 'single' | 'installment',
        installments: (initialData as any)?.installments || 1
      });
    }
  }, [initialData, cards]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const selectedCard = cards.find(c => c.id === formData.cardId);
    if (!selectedCard) return;

    setIsSubmitting(true);

    try {
      const finalCategory = (type === 'spending' && formData.category === 'Diğer' && newCategory.trim())
        ? newCategory.trim()
        : formData.category;

      let finalDate = formData.date;
      const now = new Date();
      const timePart = now.toTimeString().split(' ')[0];
      const ms = now.getMilliseconds().toString().padStart(3, '0');

      if (!initialData) {
        finalDate = `${formData.date}T${timePart}.${ms}`;
      } else if (initialData.date.includes('T')) {
        finalDate = `${formData.date}T${initialData.date.split('T')[1]}`;
      } else {
        finalDate = `${formData.date}T${timePart}.${ms}`;
      }

      const isInstallment = formData.expenseType === 'installment' && formData.installments > 1;

      if (isInstallment) {
        // Her taksit için ayrı işlem oluştur
        const installmentGroupId = crypto.randomUUID();
        const baseDate = new Date(formData.date);

        for (let i = 0; i < formData.installments; i++) {
          // Her taksit için tarih hesapla (her ay bir sonraki)
          const installmentDate = new Date(baseDate);
          installmentDate.setMonth(installmentDate.getMonth() + i);

          const dateStr = installmentDate.toISOString().split('T')[0];
          const installmentFinalDate = `${dateStr}T${timePart}.${ms.padStart(3, '0')}${i}`;

          await onSave({
            id: i === 0 ? formData.id : crypto.randomUUID(),
            cardId: formData.cardId,
            cardName: selectedCard.cardName,
            type: initialData?.type || type,
            amount: Number(formData.amount),
            category: type === 'payment' ? 'Ödeme' : finalCategory,
            date: installmentFinalDate,
            description: formData.description,
            confirmationUrl: formData.confirmationUrl || undefined,
            expenseType: 'installment',
            installments: formData.installments,
            installmentAmount: Number(formData.amount),
            totalAmount: Number(formData.amount) * formData.installments,
            installmentGroupId: installmentGroupId,
            installmentNumber: i + 1
          } as Transaction);
        }
      } else {
        // Tek çekim işlem
        await onSave({
          id: formData.id,
          cardId: formData.cardId,
          cardName: selectedCard.cardName,
          type: initialData?.type || type,
          amount: Number(formData.amount),
          category: type === 'payment' ? 'Ödeme' : finalCategory,
          date: finalDate,
          description: formData.description,
          confirmationUrl: formData.confirmationUrl || undefined,
          expenseType: 'single'
        } as Transaction);
      }

      if (type === 'payment' && Number(formData.extraAmount) > 0) {
        await onSave({
          id: crypto.randomUUID(),
          cardId: formData.cardId,
          cardName: selectedCard.cardName,
          type: 'spending',
          amount: Number(formData.extraAmount),
          category: 'Faiz & Ek Ücretler',
          date: finalDate,
          description: formData.description ? `${formData.description} (Faiz/Ücret)` : 'Faiz ve Ücret Ödemesi',
          confirmationUrl: formData.confirmationUrl || undefined,
          expenseType: 'single'
        } as Transaction);
      }

      onClose();
    } catch (error) {
      console.error("Submission failed", error);
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (value: string) => {
    const num = value === '' ? 0 : Number(value);
    setFormData(prev => ({
      ...prev,
      amount: value === '' ? '' as any : num
    }));
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  // Calculate total for installment display
  const installmentTotal = formData.expenseType === 'installment' && formData.installments > 1
    ? Number(formData.amount || 0) * formData.installments
    : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="bg-white dark:bg-slate-900 rounded-[28px] sm:rounded-[32px] w-full max-w-md p-6 sm:p-8 shadow-2xl relative border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300 max-h-[85vh] overflow-y-auto no-scrollbar mx-auto my-auto overflow-x-hidden">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
          <X size={24} />
        </button>

        <div className="flex items-center gap-3 mb-5 sm:mb-6">
          <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl ${type === 'spending' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
            {type === 'spending' ? <ArrowUpRight size={20} className="sm:w-6 sm:h-6" /> : <ArrowDownRight size={20} className="sm:w-6 sm:h-6" />}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
            {initialData ? 'İşlemi Düzenle' : (type === 'spending' ? 'Harcama Ekle' : 'Ödeme Yap')}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest">Kart Seçin</label>
            <select
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-slate-800 dark:text-white appearance-none cursor-pointer font-bold text-sm sm:text-base h-[50px] sm:h-auto"
              value={formData.cardId}
              onChange={e => setFormData({ ...formData, cardId: e.target.value })}
            >
              {cards.map(c => <option key={c.id} value={c.id}>{c.bankName} - {c.cardName}</option>)}
            </select>
          </div>

          {/* Expense Type Toggle - Only for spending */}
          {type === 'spending' && (
            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest">İşlem Türü</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, expenseType: 'single', installments: 1 })}
                  className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${formData.expenseType === 'single'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                >
                  Tek Çekim
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, expenseType: 'installment', installments: 3 })}
                  className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${formData.expenseType === 'installment'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                >
                  Taksitli
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div className="min-w-0">
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest text-left">
                {formData.expenseType === 'installment' ? 'Aylık Taksit (TL)' : 'Tutar (TL)'}
              </label>
              <input
                required
                type="number"
                step="0.01"
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-white text-xl font-black h-[54px] sm:h-auto appearance-none"
                value={formData.amount}
                onChange={e => handleAmountChange(e.target.value)}
                onFocus={handleFocus}
                placeholder="0.00"
              />
            </div>

            {formData.expenseType === 'installment' ? (
              <div className="min-w-0">
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest">Taksit Sayısı</label>
                <select
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none bg-white dark:bg-slate-800 dark:text-white text-xl font-black h-[54px] sm:h-auto appearance-none"
                  value={formData.installments}
                  onChange={e => setFormData({ ...formData, installments: Number(e.target.value) })}
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36].map(n => (
                    <option key={n} value={n}>{n} Taksit</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="min-w-0">
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={12} /> İşlem Tarihi
                </label>
                <input
                  required
                  type="date"
                  className="w-full min-w-0 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-white text-sm font-bold h-[54px] sm:h-auto appearance-none"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            )}
          </div>

          {/* Installment Total Display */}
          {formData.expenseType === 'installment' && installmentTotal > 0 && (
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardIcon size={18} className="text-purple-600" />
                  <span className="text-sm font-bold text-purple-700 dark:text-purple-300">Toplam Borç</span>
                </div>
                <span className="text-xl font-black text-purple-600 dark:text-purple-400">
                  {installmentTotal.toLocaleString('tr-TR')} ₺
                </span>
              </div>
              <p className="text-xs text-purple-500 mt-1">
                {formData.installments} × {Number(formData.amount || 0).toLocaleString('tr-TR')} ₺
              </p>
            </div>
          )}

          {/* Date for installment mode */}
          {formData.expenseType === 'installment' && (
            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={12} /> İlk Taksit Tarihi
              </label>
              <input
                required
                type="date"
                className="w-full min-w-0 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-white text-sm font-bold h-[54px] sm:h-auto appearance-none"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          )}

          {type === 'spending' && (
            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest">Kategori Seçin</label>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-inner">
                <div className="grid grid-cols-2 xs:grid-cols-3 gap-1.5">
                  {categories.map(cat => {
                    const isSelected = formData.category.toLocaleLowerCase('tr-TR') === cat.name.toLocaleLowerCase('tr-TR');
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, category: cat.name });
                          setIsAddingCategory(false);
                          setNewCategory('');
                        }}
                        className={`py-3 px-1 text-[10px] rounded-2xl border transition-all duration-300 font-black tracking-widest flex items-center justify-center gap-1.5 ${isSelected
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-gray-100 shadow-md border-slate-200 dark:border-slate-700/50 z-10'
                          : 'bg-white/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-transparent hover:bg-white'
                          }`}
                      >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                        {cat.name.toLocaleUpperCase('tr-TR')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {formData.category.toLocaleLowerCase('tr-TR') === 'diğer' && (
                <div className="mt-4">
                  {!isAddingCategory ? (
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(true)}
                      className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl w-full justify-center"
                    >
                      <Plus size={14} /> Yeni Kategori Ekle
                    </button>
                  ) : (
                    <input
                      required
                      className="w-full px-4 py-3 border border-blue-200 dark:border-blue-800 rounded-xl outline-none bg-blue-50/50 dark:bg-blue-900/10 dark:text-white text-sm font-bold placeholder:text-slate-400"
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      placeholder="Yeni kategori adı yazın..."
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {type === 'payment' && (
            <div className="space-y-4">
              <div className="p-5 bg-rose-500/5 dark:bg-rose-500/5 rounded-2xl border border-rose-500/20 shadow-sm">
                <label className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-[0.2em]">Faiz & ek ücret (İsteğe Bağlı)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-3 border border-rose-100 dark:border-rose-900/40 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none bg-white dark:bg-slate-800 dark:text-white text-lg font-black appearance-none mt-2"
                  value={formData.extraAmount}
                  onChange={e => setFormData({ ...formData, extraAmount: Number(e.target.value) })}
                  onFocus={handleFocus}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Açıklama</label>
            <input
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-white"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Örn: Market alışverişi"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 text-white rounded-[20px] font-bold text-lg shadow-lg transition-all active:scale-95 ${isSubmitting ? 'bg-slate-400' : (type === 'spending' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200')}`}
            >
              {isSubmitting ? 'İşleniyor...' : (initialData ? 'Değişiklikleri Kaydet' : 'Kaydet')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
