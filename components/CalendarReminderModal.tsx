
import React, { useState } from 'react';
import { CreditCard } from '../types';
import { X, Calendar, MessageSquare, Download } from 'lucide-react';

interface CalendarReminderModalProps {
  card: CreditCard;
  onClose: () => void;
  onAdd: (type: 'google' | 'ics', day: number, description: string) => void;
}

const CalendarReminderModal: React.FC<CalendarReminderModalProps> = ({ card, onClose, onAdd }) => {
  const [selectedDay, setSelectedDay] = useState(card.dueDay);
  const [description, setDescription] = useState(`CardMaster Hatırlatıcısı: Bugün ${card.bankName} (${card.cardName}) kartının ödeme günü. Borç tutarı: TL ${card.balance.toLocaleString('tr-TR')}`);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#1a1f2e] rounded-[32px] w-full max-w-md p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative border border-transparent dark:border-slate-800 animate-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-600/10 p-3 rounded-2xl text-blue-600">
            <Calendar size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Takvim Hatırlatıcısı</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{card.bankName} - {card.cardName}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-widest flex items-center gap-2">
              Ödeme Günü Seçin
            </label>
            <div className="grid grid-cols-7 gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 max-h-[160px] overflow-y-auto no-scrollbar">
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square flex items-center justify-center rounded-xl text-xs font-black transition-all ${selectedDay === day
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-110'
                      : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-widest flex items-center gap-2">
              <MessageSquare size={12} /> Hatırlatma Notu
            </label>
            <textarea
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-medium text-sm transition-all resize-none h-24"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Hatırlatıcı notunuzu buraya yazın..."
            />
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => onAdd('google', selectedDay, description)}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <Calendar size={18} />
              GOOGLE TAKVİM'E EKLE
            </button>
            <button
              onClick={() => onAdd('ics', selectedDay, description)}
              className="w-full py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <Download size={18} />
              CİHAZ TAKVİMİNE EKLE (iCal)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarReminderModal;
