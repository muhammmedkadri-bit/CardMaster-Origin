
import React, { useState, useEffect } from 'react';
import { CreditCard, Transaction, Category } from '../types';
import { X, ArrowDownRight, ArrowUpRight, Link as LinkIcon, Calendar, Plus, TrendingUp } from 'lucide-react';

interface TransactionModalProps {
  type: 'spending' | 'payment';
  cards: CreditCard[];
  initialData?: Transaction;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  categories: Category[];
}

const isColorLight = (color: string) => {
  if (!color) return false;
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
    date: initialData?.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0],
    confirmationUrl: initialData?.confirmationUrl || '',
    extraAmount: 0,
    expenseType: (initialData?.expenseType || 'regular') as 'regular' | 'installment' | 'cash_advance',
    installments: initialData?.installments || 1,
    installmentAmount: initialData?.installmentAmount || 0,
  });

  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);


  useEffect(() => {
    // Robust scroll locking for mobile (especially iOS)
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflowY = 'scroll'; // Maintain scrollbar width to prevent shift

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
        cardId: initialData.cardId || (cards[0]?.id || ''),
        amount: initialData.amount ?? 0,
        category: initialData.category || '',
        description: initialData.description || '',
        date: initialData.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0],
        confirmationUrl: initialData.confirmationUrl || '',
        extraAmount: 0,
        expenseType: (initialData.expenseType || 'regular') as any,
        installments: initialData.installments || 1,
        installmentAmount: initialData.installmentAmount || 0
      });
    }
  }, [initialData, cards]);

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
    const ms = now.getMilliseconds().toString().padStart(3, '0');

    if (!initialData) {
      // New transaction: current time
      finalDate = `${formData.date}T${timePart}.${ms}`;
    } else if (initialData.date.includes('T')) {
      // Edit: keep existing time or use current if not present
      finalDate = `${formData.date}T${initialData.date.split('T')[1]}`;
    } else {
      finalDate = `${formData.date}T${timePart}.${ms}`;
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
      confirmationUrl: formData.confirmationUrl || undefined,
      expenseType: formData.expenseType,
      installments: formData.expenseType !== 'regular' ? formData.installments : undefined,
      installmentAmount: formData.expenseType !== 'regular' ? formData.installmentAmount : undefined,
      totalAmount: Number(formData.amount)
    });

    if (type === 'payment' && Number(formData.extraAmount) > 0) {
      onSave({
        id: crypto.randomUUID(),
        cardId: formData.cardId,
        cardName: selectedCard.cardName,
        type: 'spending',
        amount: Number(formData.extraAmount),
        category: 'Faiz & Ek Ücretler',
        date: finalDate,
        description: formData.description ? `${formData.description} (Faiz/Ücret)` : 'Faiz ve Ücret Ödemesi',
        confirmationUrl: formData.confirmationUrl || undefined
      });
    }
    onClose();
  };

  const handleAmountChange = (value: string) => {
    const num = value === '' ? 0 : Number(value);
    setFormData(prev => ({
      ...prev,
      amount: value === '' ? '' as any : num,
      installmentAmount: prev.expenseType !== 'regular' && prev.installments > 0 ? num / prev.installments : prev.installmentAmount
    }));
  };

  const handleInstallmentAmountChange = (value: string) => {
    const num = value === '' ? 0 : Number(value);
    setFormData(prev => ({
      ...prev,
      installmentAmount: value === '' ? '' as any : num,
      amount: prev.expenseType !== 'regular' ? num * prev.installments : prev.amount
    }));
  };

  const handleInstallmentChange = (count: number) => {
    setFormData(prev => ({
      ...prev,
      installments: count,
      amount: prev.expenseType !== 'regular' ? Number(prev.installmentAmount) * count : prev.amount
    }));
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

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

          {type === 'spending' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest leading-none">Harcama Türü</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'regular', label: 'DÜZENLİ', icon: <ArrowUpRight size={14} /> },
                    { id: 'installment', label: 'TAKSİTLİ ALIŞVERİŞ', icon: <TrendingUp size={14} /> },
                    { id: 'cash_advance', label: 'TAKSİTLİ NAKİT AVANS', icon: <Plus size={14} /> }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        const newType = mode.id as any;
                        setFormData(prev => ({
                          ...prev,
                          expenseType: newType,
                          // Ensure valid installment count when switching
                          installments: newType === 'regular' ? 1 : (prev.installments < 2 ? 2 : prev.installments),
                          // Recalculate amount if switching to installment
                          amount: newType !== 'regular' ? (Number(prev.installmentAmount) || 0) * (prev.installments < 2 ? 2 : prev.installments) : prev.amount
                        }));
                      }}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all gap-1 h-full text-center ${formData.expenseType === mode.id
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                    >
                      {mode.icon}
                      <span className="text-[7px] leading-tight font-black uppercase tracking-tight">{mode.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {formData.expenseType !== 'regular' && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-4 duration-500">
                  <div className="min-w-0">
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest leading-none">Taksit Sayısı</label>
                    <select
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-white font-bold text-sm appearance-none cursor-pointer h-[54px]"
                      value={formData.installments}
                      onChange={e => handleInstallmentChange(Number(e.target.value))}
                    >
                      {[2, 3, 4, 5, 6, 8, 9, 10, 12, 18, 24, 36].map(n => <option key={n} value={n}>{n} Taksit</option>)}
                    </select>
                  </div>
                  <div className="min-w-0">
                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest leading-none">Aylık Taksit</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-white text-base font-black h-[54px] appearance-none"
                      value={formData.installmentAmount}
                      onChange={e => handleInstallmentAmountChange(e.target.value)}
                      onFocus={handleFocus}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {formData.expenseType === 'regular' ? (
              <div className="min-w-0">
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest text-left">Tutar (TL)</label>
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
            ) : (
              <div className="min-w-0">
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest text-left">Toplam Tutar</label>
                <div className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl font-black text-lg text-slate-400 dark:text-slate-500 h-[54px] flex items-center">
                  {(Number(formData.amount) || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺
                </div>
              </div>
            )}
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
          </div>

          {type === 'spending' && (
            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest">Kategori Seçin</label>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-inner">
                <div className="grid grid-cols-2 xs:grid-cols-3 gap-1.5">
                  {(() => {
                    const uniqueCats = React.useMemo(() => {
                      const seen = new Set<string>();
                      let list = categories.filter(c => {
                        const key = c.name.toLocaleLowerCase('tr-TR').trim();
                        if (seen.has(key)) return false;
                        seen.add(key);
                        return true;
                      });

                      const hasOther = list.some(c => c.name.toLocaleLowerCase('tr-TR') === 'diğer');
                      if (!hasOther) {
                        list.push({ id: 'default-other', name: 'Diğer', color: '#64748B' });
                      } else {
                        const otherIndex = list.findIndex(c => c.name.toLocaleLowerCase('tr-TR') === 'diğer');
                        const otherCat = list.splice(otherIndex, 1)[0];
                        list.push(otherCat);
                      }
                      return list;
                    }, [categories]);

                    return uniqueCats.length > 0 ? uniqueCats.map(cat => {
                      const isSelected = formData.category.toLocaleLowerCase('tr-TR') === cat.name.toLocaleLowerCase('tr-TR');
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, category: cat.name });
                            if (cat.name.toLocaleLowerCase('tr-TR') !== 'diğer') {
                              setIsAddingCategory(false);
                              setNewCategory('');
                            }
                          }}
                          style={{
                            transform: isSelected ? 'translateY(-1px) scale(1.02)' : 'none'
                          }}
                          className={`py-3 px-1 text-[10px] rounded-2xl border transition-all duration-300 font-black tracking-widest flex items-center justify-center gap-1.5 ${isSelected
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-gray-100 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.12),0_2px_6px_-1px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.05)_inset] border-slate-200 dark:border-slate-700/50 z-10 ring-1 ring-slate-200 dark:ring-0'
                            : 'bg-white/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-transparent hover:bg-white dark:hover:bg-slate-800'
                            }`}
                        >
                          <div className={`w-2 h-2 rounded-full transition-transform ${isSelected ? 'scale-125' : ''}`} style={{ backgroundColor: cat.color }}></div>
                          {cat.name.toLocaleUpperCase('tr-TR')}
                        </button>);
                    }) : (
                      <div className="col-span-full py-4 text-center text-xs text-slate-400 italic">
                        Kategoriler yükleniyor...
                      </div>
                    );
                  })()}
                </div>
              </div>

              {formData.category.toLocaleLowerCase('tr-TR') === 'diğer' && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
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
              <div className="p-5 bg-emerald-500/5 dark:bg-emerald-500/5 rounded-2xl border border-emerald-500/20 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-emerald-500 text-white rounded-md"><ArrowDownRight size={12} /></div>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">İŞLEM KATEGORİSİ</span>
                </div>
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">Ödeme / Borç Kapatma</p>
              </div>

              <div className="p-5 bg-rose-500/5 dark:bg-rose-500/5 rounded-2xl border border-rose-500/20 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-rose-500 text-white rounded-md"><TrendingUp size={12} /></div>
                    <label className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-[0.2em]">Faiz & ek ücret (İsteğe Bağlı)</label>
                  </div>
                </div>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-3 border border-rose-100 dark:border-rose-900/40 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none bg-white dark:bg-slate-800 dark:text-white text-lg font-black appearance-none"
                  value={formData.extraAmount}
                  onChange={e => setFormData({ ...formData, extraAmount: Number(e.target.value) })}
                  onFocus={handleFocus}
                  placeholder="0.00"
                />
                <p className="mt-2 text-[10px] font-bold text-slate-400 italic leading-relaxed">Faiz veya ek ödemeniz var ise bu alanı doldurun. Bu tutar 'Faiz & Ek Ücretler' kategorisinde harcama olarak kaydedilir.</p>
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
