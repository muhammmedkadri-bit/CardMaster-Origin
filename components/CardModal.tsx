
import React, { useState, useEffect } from 'react';
import { CreditCard } from '../types';
import { COLORS } from '../constants';
import { X, Bell, Percent } from 'lucide-react';

interface CardModalProps {
  onClose: () => void;
  onSave: (card: CreditCard) => void;
  initialData?: CreditCard;
  title: string;
}

const CardModal: React.FC<CardModalProps> = ({ onClose, onSave, initialData, title }) => {
  const [formData, setFormData] = useState<Omit<CreditCard, 'id'>>({
    bankName: '',
    cardName: '',
    lastFour: '',
    limit: 0,
    balance: 0,
    statementDay: 1,
    dueDay: 10,
    color: COLORS[0],
    reminderDaysBefore: 1,
    minPaymentRatio: 20
  });

  useEffect(() => {
    // Robust scroll locking for mobile
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
      const { id, ...rest } = initialData;
      setFormData({
        ...rest,
        reminderDaysBefore: rest.reminderDaysBefore || 1,
        minPaymentRatio: rest.minPaymentRatio || 20
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(initialData || {}),
      ...formData,
      id: initialData?.id || crypto.randomUUID()
    } as CreditCard);
    onClose();
  };

  const handleNumberChange = (field: keyof typeof formData, value: string) => {
    const numValue = value === '' ? 0 : Number(value);
    setFormData(prev => ({ ...prev, [field]: numValue }));
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[3000] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300 overflow-hidden">
      <div className="bg-white dark:bg-[#1a1f2e] rounded-[28px] sm:rounded-[32px] w-full max-w-md p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative border border-transparent dark:border-slate-800 animate-in zoom-in-95 duration-300 max-h-[85vh] overflow-y-auto no-scrollbar mx-auto my-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mb-6 sm:mb-8 tracking-tight">{title}</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest">Banka Adı</label>
              <input
                required
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-all text-sm sm:text-base"
                value={formData.bankName}
                onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="Örn: Garanti"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest">Kart Adı</label>
              <input
                required
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-all text-sm sm:text-base"
                value={formData.cardName}
                onChange={e => setFormData({ ...formData, cardName: e.target.value })}
                placeholder="Örn: Bonus Platinum"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest">Son 4 Hane</label>
                <input
                  required
                  maxLength={4}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-all"
                  value={formData.lastFour}
                  onChange={e => setFormData({ ...formData, lastFour: e.target.value.replace(/\D/g, '') })}
                  onFocus={handleFocus}
                  placeholder="1234"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest">Limit (TL)</label>
                <input
                  required
                  type="number"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold transition-all"
                  value={formData.limit || ''}
                  onChange={e => handleNumberChange('limit', e.target.value)}
                  onFocus={handleFocus}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest flex justify-between">
                  <span>Güncel Borç (TL)</span>
                  <span className="text-[8px] opacity-60">İsteğe Bağlı</span>
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold transition-all"
                  value={formData.balance || ''}
                  onChange={e => handleNumberChange('balance', e.target.value)}
                  onFocus={handleFocus}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest">H. Kesim Günü</label>
                <input
                  required
                  type="number" min="1" max="31"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold transition-all"
                  value={formData.statementDay || ''}
                  onChange={e => handleNumberChange('statementDay', e.target.value)}
                  onFocus={handleFocus}
                  placeholder="1"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-widest">Son Ödeme Günü</label>
                <input
                  required
                  type="number" min="1" max="31"
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold transition-all"
                  value={formData.dueDay || ''}
                  onChange={e => handleNumberChange('dueDay', e.target.value)}
                  onFocus={handleFocus}
                  placeholder="10"
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30 grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-widest">
                  <Bell size={12} /> Hatırlatma
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="0" max="15"
                    className="w-14 px-2 py-2 border border-blue-200 dark:border-blue-700/50 rounded-xl outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-center"
                    value={formData.reminderDaysBefore || ''}
                    onChange={e => handleNumberChange('reminderDaysBefore', e.target.value)}
                    onFocus={handleFocus}
                    placeholder="1"
                  />
                  <span className="text-[10px] font-bold text-slate-500">gün</span>
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black text-amber-600 dark:text-amber-400 mb-2 uppercase tracking-widest">
                  <Percent size={12} /> Asgari Ödeme
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="1" max="100"
                    className="w-14 px-2 py-2 border border-amber-200 dark:border-amber-700/50 rounded-xl outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-center"
                    value={formData.minPaymentRatio || ''}
                    onChange={e => handleNumberChange('minPaymentRatio', e.target.value)}
                    onFocus={handleFocus}
                    placeholder="20"
                  />
                  <span className="text-[10px] font-bold text-slate-500">% borç</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-[0.2em]">Kart Teması</label>
            <div className="flex gap-2.5 flex-wrap bg-slate-50 dark:bg-slate-800/30 p-4 rounded-[20px] border border-slate-100 dark:border-slate-700/50">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-9 h-9 rounded-full border-2 transition-all transform hover:scale-110 ${formData.color === color ? 'border-slate-800 dark:border-white scale-110 ring-4 ring-blue-500/10' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <div className="flex items-center ml-auto">
                <input
                  type="color"
                  value={formData.color}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  className="w-9 h-9 rounded-full cursor-pointer bg-transparent border-none overflow-hidden scale-110"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 bg-blue-600 text-white rounded-[20px] font-black text-lg shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all transform active:scale-95 flex items-center justify-center gap-2"
            >
              KAYDET VE KAPAT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CardModal;
