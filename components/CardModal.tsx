
import React, { useState, useEffect } from 'react';
import { CreditCard } from '../types';
import { COLORS } from '../constants';
import { X, Bell, Percent } from 'lucide-react';
import CardVisual from './CardVisual';

interface CardModalProps {
  onClose: () => void;
  onSave: (card: CreditCard) => void;
  initialData?: CreditCard;
  title: string;
  isDarkMode: boolean;
}

const CardModal: React.FC<CardModalProps> = ({ onClose, onSave, initialData, title, isDarkMode }) => {
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
    minPaymentRatio: 20,
    network: 'mastercard'
  });

  // Create a temporary card object for preview
  const previewCard: CreditCard = {
    ...formData,
    id: 'preview'
  };

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

        {/* Dynamic Card Preview */}
        <div className="mb-10 px-0.5">
          <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-[0.2em] ml-1">KART ÖNİZLEME</label>
          <div className="transform scale-[0.85] sm:scale-100 origin-top -mb-10 sm:mb-0">
            <CardVisual card={previewCard} />
          </div>
        </div>

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

            {/* Card Network Selection */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">KART AĞI</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'mastercard', label: 'Mastercard', color: 'bg-[#EB001B]' },
                  { id: 'visa', label: 'Visa', color: 'bg-[#1A1F71]' },
                  { id: 'troy', label: 'Troy', color: 'bg-[#00AEEF]' },
                  { id: 'amex', label: 'Amex', color: 'bg-[#007BC1]' }
                ].map((network) => (
                  <button
                    key={network.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, network: network.id as any })}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all gap-1.5 ${formData.network === network.id
                      ? 'border-blue-500 bg-blue-500/10 scale-105 shadow-md'
                      : 'border-slate-100 dark:border-slate-800 bg-transparent opacity-60 hover:opacity-100'
                      }`}
                  >
                    <div className="h-6 flex items-center justify-center">
                      {network.id === 'mastercard' && (
                        <div className="flex -space-x-2">
                          <div className="w-4 h-4 rounded-full bg-rose-500"></div>
                          <div className="w-4 h-4 rounded-full bg-amber-500 opacity-80"></div>
                        </div>
                      )}
                      {network.id === 'visa' && (
                        <span className="italic font-black text-[10px] text-blue-800 dark:text-white"><span className="text-amber-500">V</span>ISA</span>
                      )}
                      {network.id === 'troy' && (
                        <span className="font-black text-[10px] text-emerald-600 dark:text-emerald-400">troy</span>
                      )}
                      {network.id === 'amex' && (
                        <div className="bg-sky-600 px-1 rounded-[1px] text-[6px] text-white font-bold leading-none py-0.5 text-center">AMEX</div>
                      )}
                    </div>
                    <span className="text-[7px] font-black uppercase tracking-tighter opacity-80">{network.label}</span>
                  </button>
                ))}
              </div>
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
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-[0.2em]">Kart Teması</label>

            {/* 10 Mini Card Visuals */}
            <div className="grid grid-cols-5 gap-3 mb-6">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`relative aspect-[1.6/1] rounded-lg transition-all transform hover:scale-105 overflow-hidden group ${formData.color === color
                    ? 'ring-4 ring-blue-500 ring-offset-4 dark:ring-offset-[#1a1f2e] scale-110 z-10'
                    : 'opacity-70 hover:opacity-100 border border-transparent'
                    }`}
                  style={{
                    background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                    boxShadow: formData.color === color ? `0 10px 20px ${color}40` : 'none'
                  }}
                >
                  {/* Card Design Elements */}
                  <div className="absolute top-1 left-1.5 w-2 h-1.5 bg-yellow-400/30 rounded-sm" />
                  <div className="absolute bottom-1 right-1.5 flex gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  </div>
                  {formData.color === color && (
                    <div className="absolute inset-0 flex items-center justify-center bg-blue-600/20">
                      <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Custom Color Selector */}
            <div className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
              <div className="relative w-12 h-12 shrink-0">
                <input
                  type="color"
                  value={formData.color}
                  onChange={e => setFormData({ ...formData, color: e.target.value })}
                  className="absolute inset-0 w-full h-full cursor-pointer opacity-0 z-10"
                />
                <div
                  className="w-full h-full rounded-xl border-2 border-white dark:border-slate-800 shadow-lg"
                  style={{ backgroundColor: formData.color }}
                />
              </div>
              <div className="flex flex-col">
                <span className={`text-[11px] font-black uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  Kart renginizi kendiniz seçin
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                  Özel bir renk paleti oluşturun
                </span>
              </div>
              <div className="ml-auto w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
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
