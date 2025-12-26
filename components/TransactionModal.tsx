
import React, { useState, useEffect } from 'react';
import { CreditCard, Transaction, Category } from '../types';
import { X, ArrowDownRight, ArrowUpRight, Link as LinkIcon, Calendar, Plus } from 'lucide-react';

interface TransactionModalProps {
  type: 'spending' | 'payment';
  cards: CreditCard[];
  initialData?: Transaction;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  categories: Category[];
}

const isColorLight = (color: string) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return brightness > 155;
};

const TransactionModal: React.FC<TransactionModalProps> = ({ type, cards, initialData, onClose, onSave, categories }) => {
  const [formData, setFormData] = useState({
    cardId: initialData?.cardId || (cards[0]?.id || ''),
    amount: initialData?.amount ?? 0,
    category: initialData?.category || (type === 'payment' ? 'Ödeme' : (categories[0]?.name || 'Diğer')),
    description: initialData?.description || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    confirmationUrl: initialData?.confirmationUrl || ''
  });

  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        cardId: initialData.cardId,
        amount: initialData.amount,
        category: initialData.category,
        description: initialData.description,
        date: initialData.date,
        confirmationUrl: initialData.confirmationUrl || ''
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCard = cards.find(c => c.id === formData.cardId);
    if (!selectedCard) return;

    const finalCategory = (type === 'spending' && formData.category === 'Diğer' && newCategory.trim())
      ? newCategory.trim()
      : formData.category;

    // Combine date with time for precise sorting
    let finalDate = formData.date;
    const now = new Date();
    const timePart = now.toTimeString().split(' ')[0]; // HH:mm:ss

    if (!initialData) {
      // New transaction: current time
      finalDate = `${formData.date}T${timePart}`;
    } else if (initialData.date.includes('T')) {
      // Edit: keep existing time or use current if not present
      finalDate = `${formData.date}T${initialData.date.split('T')[1]}`;
    } else {
      finalDate = `${formData.date}T${timePart}`;
    }

    onSave({
      id: initialData?.id || crypto.randomUUID(),
      cardId: formData.cardId,
      cardName: selectedCard.cardName,
      type: initialData?.type || type,
      amount: Number(formData.amount),
      category: type === 'payment' ? 'Ödeme' : finalCategory,
      date: finalDate,
      description: formData.description,
      confirmationUrl: formData.confirmationUrl || undefined
    });
    onClose();
  };

  const handleAmountChange = (value: string) => {
    if (value === '') {
      setFormData(prev => ({ ...prev, amount: '' as any }));
      return;
    }
    setFormData(prev => ({ ...prev, amount: Number(value) }));
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[28px] sm:rounded-[32px] w-full max-w-md p-6 sm:p-8 shadow-2xl relative border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300 max-h-[92vh] overflow-y-auto no-scrollbar">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest text-left">Tutar (TL)</label>
              <input
                required
                type="number"
                step="0.01"
                autoFocus
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-white text-xl font-black h-[54px] sm:h-auto"
                value={formData.amount}
                onChange={e => handleAmountChange(e.target.value)}
                onFocus={handleFocus}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={12} /> İşlem Tarihi
              </label>
              <input
                required
                type="date"
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-white text-sm font-bold h-[54px] sm:h-auto"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>

          {type === 'spending' && (
            <div>
              <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Kategori</label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, category: cat.name });
                      if (cat.name !== 'Diğer') {
                        setIsAddingCategory(false);
                        setNewCategory('');
                      }
                    }}
                    style={{
                      backgroundColor: formData.category.toLocaleLowerCase('tr-TR') === cat.name.toLocaleLowerCase('tr-TR') ? cat.color : undefined,
                      borderColor: formData.category.toLocaleLowerCase('tr-TR') === cat.name.toLocaleLowerCase('tr-TR') ? cat.color : undefined,
                      color: formData.category.toLocaleLowerCase('tr-TR') === cat.name.toLocaleLowerCase('tr-TR') ? (isColorLight(cat.color) ? '#000' : '#fff') : undefined
                    }}
                    className={`py-2 px-1 text-[10px] rounded-xl border transition-all font-black tracking-widest flex items-center justify-center gap-1.5 ${formData.category.toLocaleLowerCase('tr-TR') === cat.name.toLocaleLowerCase('tr-TR')
                      ? 'shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                      }`}
                  >
                    {formData.category.toLocaleLowerCase('tr-TR') !== cat.name.toLocaleLowerCase('tr-TR') && (
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                    )}
                    {cat.name.toLocaleUpperCase('tr-TR')}
                  </button>
                ))}
              </div>

              {formData.category === 'Diğer' && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                  {!isAddingCategory ? (
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(true)}
                      className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      <Plus size={14} /> Yeni Kategori Ekle
                    </button>
                  ) : (
                    <input
                      autoFocus
                      className="w-full px-4 py-2 border border-blue-200 dark:border-blue-800 rounded-xl outline-none bg-blue-50/50 dark:bg-blue-900/10 dark:text-white text-sm font-bold placeholder:text-slate-400"
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
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">İŞLEM KATEGORİSİ</span>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200 mt-1">Ödeme / Borç Kapatma</p>
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

          <div>
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-2">
              <LinkIcon size={14} /> Dekont / Onay URL (İsteğe Bağlı)
            </label>
            <input
              type="url"
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-white"
              value={formData.confirmationUrl}
              onChange={e => setFormData({ ...formData, confirmationUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className={`w-full py-4 text-white rounded-[20px] font-bold text-lg shadow-lg transition-all active:scale-95 ${type === 'spending' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200 dark:shadow-rose-950/40' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200 dark:shadow-emerald-950/40'}`}
            >
              {initialData ? 'Değişiklikleri Kaydet' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
