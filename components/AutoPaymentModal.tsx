
import React, { useState } from 'react';
import { CreditCard, Category, AutoPayment } from '../types';
import { X, RefreshCw, Calendar, Plus, Info } from 'lucide-react';

interface AutoPaymentModalProps {
    cards: CreditCard[];
    onClose: () => void;
    onSave: (autoPayment: AutoPayment) => void;
    categories: Category[];
    initialData?: AutoPayment;
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

const AutoPaymentModal: React.FC<AutoPaymentModalProps> = ({ cards, onClose, onSave, categories, initialData }) => {
    const [formData, setFormData] = useState({
        cardId: initialData?.cardId || (cards[0]?.id || ''),
        amount: initialData?.amount ?? 0,
        category: initialData?.category || (categories[0]?.name || 'Diğer'),
        description: initialData?.description || '',
        dayOfMonth: initialData?.dayOfMonth || 1,
        active: initialData?.active ?? true
    });

    const [newCategory, setNewCategory] = useState('');
    const [isAddingCategory, setIsAddingCategory] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedCard = cards.find(c => c.id === formData.cardId);
        if (!selectedCard) return;

        const finalCategory = (formData.category === 'Diğer' && newCategory.trim())
            ? newCategory.trim()
            : formData.category;

        onSave({
            id: initialData?.id || crypto.randomUUID(),
            cardId: formData.cardId,
            category: finalCategory,
            amount: Number(formData.amount),
            dayOfMonth: Number(formData.dayOfMonth),
            description: formData.description || `${finalCategory} Otomatik Ödemesi`,
            lastProcessedMonth: initialData?.lastProcessedMonth,
            active: formData.active
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[3000] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            <div className="bg-white dark:bg-[#1a1f2e] rounded-[28px] sm:rounded-[32px] w-full max-w-md p-6 sm:p-8 shadow-2xl relative border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300 max-h-[85vh] overflow-y-auto no-scrollbar mx-auto my-auto">
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                    <X size={24} />
                </button>

                <div className="flex items-center gap-3 mb-5 sm:mb-6">
                    <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <RefreshCw size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
                        {initialData ? 'Otomatik İşlemi Düzenle' : 'Otomatik Ödeme Tanımla'}
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
                                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-white text-xl font-black h-[54px] sm:h-auto"
                                value={formData.amount}
                                onChange={e => handleAmountChange(e.target.value)}
                                onFocus={handleFocus}
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={12} /> Her Ayın Günü (1-31)
                            </label>
                            <input
                                required
                                type="number"
                                min="1"
                                max="31"
                                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-white text-base font-black h-[54px] sm:h-auto"
                                value={formData.dayOfMonth}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val === '') {
                                        setFormData(prev => ({ ...prev, dayOfMonth: '' as any }));
                                    } else {
                                        setFormData(prev => ({ ...prev, dayOfMonth: Number(val) }));
                                    }
                                }}
                                onFocus={handleFocus}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Kategori</label>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-inner">
                            <div className="grid grid-cols-2 xs:grid-cols-3 gap-1.5">
                                {(() => {
                                    const seen = new Set<string>();
                                    const uniqueCats = categories.filter(c => {
                                        const key = c.name.toLocaleLowerCase('tr-TR').trim();
                                        if (seen.has(key)) return false;
                                        seen.add(key);
                                        return true;
                                    });
                                    return uniqueCats.map(cat => {
                                        const isSelected = formData.category === cat.name;
                                        return (
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
                                                    transform: isSelected ? 'translateY(-1px) scale(1.02)' : 'none'
                                                }}
                                                className={`py-3 px-1 text-[10px] rounded-2xl border transition-all duration-300 font-black tracking-widest flex items-center justify-center gap-1.5 ${isSelected
                                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-gray-100 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.12),0_2px_6px_-1px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.05)_inset] border-slate-200 dark:border-slate-700/50 z-10 ring-1 ring-slate-200 dark:ring-0'
                                                    : 'bg-white/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-transparent hover:bg-white dark:hover:bg-slate-800'
                                                    }`}
                                            >
                                                <div className={`w-2 h-2 rounded-full transition-transform ${isSelected ? 'scale-125' : ''}`} style={{ backgroundColor: cat.color }}></div>
                                                {cat.name.toLocaleUpperCase('tr-TR')}
                                            </button>
                                        );
                                    });
                                })()}
                            </div>
                        </div>

                        {formData.category === 'Diğer' && (
                            <div className="mt-4">
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

                    <div>
                        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Kısa Açıklama</label>
                        <input
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-white"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Örn: Netflix aboneliği"
                        />
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl flex items-start gap-3 border border-blue-100 dark:border-blue-800/30">
                        <Info size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] font-medium text-blue-800 dark:text-blue-300 leading-relaxed">
                            Belirlediğiniz gün geldiğinde sistem otomatik olarak harcama işlemini karta yansıtacaktır.
                        </p>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full py-4 text-white rounded-[20px] font-bold text-lg shadow-lg transition-all active:scale-95 bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-blue-950/40"
                        >
                            {initialData ? 'Değişiklikleri Kaydet' : 'Otomatik Ödemeyi Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AutoPaymentModal;
