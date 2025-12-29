
import React from 'react';
import { CreditCard } from '../types';
import { AlertTriangle, CalendarPlus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import RollingNumber from './RollingNumber';

interface CardVisualProps {
  card: CreditCard;
  scrollProgress?: number;
  onAddToCalendar?: (card: CreditCard) => void;
  onEdit?: (card: CreditCard) => void;
  onDelete?: (card: CreditCard) => void;
}

const CardVisual: React.FC<CardVisualProps> = ({ card, onAddToCalendar, onEdit, onDelete }) => {
  const isCreditBalance = card.balance < 0;
  const displayBalance = Math.abs(card.balance);
  const utilization = isCreditBalance ? 0 : (card.balance / card.limit) * 100;
  const isOverThreshold = !isCreditBalance && utilization >= (card.alertThreshold || 80);

  // Silver Embossed Text Class - For Card Number
  const silverTextStyle = "font-mono tracking-[0.15em] font-black bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent text-embossed drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)]";

  // High Contrast Style for Labels
  const labelStyle = "font-black uppercase tracking-[0.15em] text-white/70 drop-shadow-sm";
  const valueStyle = "font-mono font-black text-white drop-shadow-md";

  return (
    <div className="card-container group w-full max-w-[400px] mx-auto cursor-pointer">
      <div
        className="card-inner relative aspect-[1.586/1] w-full rounded-[20px] sm:rounded-[28px] p-3.5 sm:p-6 text-white overflow-hidden flex flex-col card-texture-brushed transition-all duration-500 group-hover:translate-y-[-4px]"
        style={{
          backgroundColor: card.color,
          backgroundImage: `linear-gradient(165deg, ${card.color} 0%, rgba(0,0,0,0.85) 100%)`,
          boxShadow: `0 20px 50px -15px ${card.color}60, 0 10px 25px -10px ${card.color}40, 0 -2px 10px rgba(255,255,255,0.1) inset`
        }}
      >
        {/* Realistic Lighting Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none"></div>

        {/* Realistic Card Border Highlight */}
        <div className="absolute inset-x-0 inset-y-0 border border-white/10 rounded-[20px] sm:rounded-[28px] pointer-events-none"></div>

        {/* Action Controls */}
        <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-30 flex gap-1 sm:gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex bg-black/40 backdrop-blur-xl rounded-xl p-0.5 sm:p-1 border border-white/10">
            {onAddToCalendar && (
              <button
                onClick={(e) => { e.stopPropagation(); onAddToCalendar(card); }}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 text-white transition-all active:scale-90"
              >
                <CalendarPlus size={14} className="sm:w-[16px] sm:h-[16px]" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(card); }}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 text-white transition-all active:scale-90"
              >
                <Edit2 size={14} className="sm:w-[16px] sm:h-[16px]" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(card); }}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-rose-500/30 text-rose-200 transition-all active:scale-90"
              >
                <Trash2 size={14} className="sm:w-[16px] sm:h-[16px]" />
              </button>
            )}
          </div>
        </div>

        {/* Bank & Type Header */}
        <div className="relative z-10 mb-0 sm:mb-1">
          <p className="text-[7px] sm:text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mb-0.5 leading-none">{card.bankName}</p>
          <h3 className="text-xs sm:text-base md:text-lg font-black tracking-tight leading-none text-white">{card.cardName}</h3>
        </div>

        {/* Chip Row */}
        <div className="mt-1 sm:mt-1.5 relative z-10">
          <div className="w-8 h-6 sm:w-10 sm:h-7 bg-gradient-to-br from-[#ffd700] via-[#f0c419] to-[#b8860b] rounded-md shadow-lg border border-black/20" />
        </div>

        {/* Card Number Area */}
        <div className="mt-1.5 sm:mt-3 relative z-10 flex items-center gap-1.5 sm:gap-2">
          <div className={`${silverTextStyle} text-[9px] sm:text-base opacity-70`}>•••• •••• ••••</div>
          <div className={`${silverTextStyle} text-sm sm:text-xl`}>{card.lastFour}</div>
        </div>

        {/* Footer Info Area - Lifted UP for better visibility and avoiding overflow */}
        <div className="mt-auto relative z-10 flex justify-between items-end pb-0.5 sm:pb-3">
          <div className="flex flex-col">
            <div className="flex flex-col mb-1 sm:mb-3">
              <span className={`text-[7px] sm:text-[10px] font-black uppercase tracking-[0.15em] mb-0.5 drop-shadow-md ${isCreditBalance ? 'text-emerald-400' : 'text-white'}`}>
                {isCreditBalance ? 'ARTI BAKİYE' : 'GÜNCEL BORÇ'}
              </span>
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className={`text-base sm:text-2xl font-mono font-black tracking-tighter ${isCreditBalance ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]' : isOverThreshold ? 'text-rose-200' : 'text-white'}`}>
                  <RollingNumber value={displayBalance} className="gap-0.5" />
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex gap-1.5 sm:gap-3">
                <div className="flex flex-col">
                  <p className={`text-[5px] sm:text-[8px] ${labelStyle} mb-0.5`}>H.KESİM</p>
                  <p className={`text-[9px] sm:text-[12px] ${valueStyle}`}>{card.statementDay}</p>
                </div>
                <div className="w-px h-2.5 sm:h-5 bg-white/20 self-center"></div>
                <div className="flex flex-col">
                  <p className={`text-[5px] sm:text-[8px] ${labelStyle} mb-0.5`}>SON ÖDEME</p>
                  <p className={`text-[9px] sm:text-[12px] ${valueStyle}`}>{card.dueDay}</p>
                </div>
              </div>
              <div className="w-px h-2.5 sm:h-5 bg-white/20 self-center"></div>
              <div className="flex flex-col">
                <p className={`text-[5px] sm:text-[8px] ${labelStyle} mb-0.5`}>KULLANIM</p>
                <p className={`text-[8px] sm:text-[12px] font-black ${isCreditBalance ? 'text-emerald-400' : isOverThreshold ? 'text-rose-400' : valueStyle}`}>
                  <span className="text-[0.8em] font-sans font-bold opacity-80 mr-0.5">%</span>{utilization.toFixed(0)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            {/* Dynamic Network Logo Area */}
            <div className="mb-2 sm:mb-3 filter drop-shadow-lg">
              {card.network === 'mastercard' && (
                <div className="flex -space-x-2 sm:-space-x-4">
                  <div className="w-5 h-5 sm:w-10 sm:h-10 rounded-full bg-rose-500/95 border border-white/10"></div>
                  <div className="w-5 h-5 sm:w-10 sm:h-10 rounded-full bg-amber-500/95 border border-white/10 backdrop-blur-sm"></div>
                </div>
              )}
              {card.network === 'visa' && (
                <div className="flex items-center gap-1">
                  <svg viewBox="0 0 100 32" className="h-4 sm:h-7 overflow-visible">
                    {/* Yellow Flick on V */}
                    <path
                      fill="#F7B600"
                      d="M13.5 1.5 C10.5 1.5, 4.5 3.5, 1.5 6.5 L4.5 9.5 C7.5 7.5, 12.5 5.5, 15.5 5.5 L13.5 1.5 Z"
                      className="drop-shadow-sm"
                    />
                    <path
                      fill="#FFFFFF"
                      d="M37.89 1.2h-6.2c-1.8 0-3.3 1.1-3.9 2.7l-13.8 23.9c-.3.6-.5 1.5.5 1.5h6.6c.9 0 1.5-.5 1.8-1l2.5-4.2h8.2c.4 1 1 1.7 1.9 1.7h5.8s1.6 0 1.1-1.6L37.89 1.2zm-7.6 18.2l3.2-5.4l1.6 5.4h-4.8zM57.7 21.6c-4.4 0-7.3-2.3-7.3-5.8 0-3.3 2.5-5.3 6.6-5.3h.8c0-1.2-.5-2.2-2.1-2.2-1.2 0-2.3.4-3.5 1.2-.5.3-.8.2-.9-.3l-.7-2.3c-.2-.5 0-.8.4-1 1.8-1.2 3.9-1.9 6.2-1.9 4.8 0 7.4 2.1 7.4 6.3v10c0 .9.8 1.4 1.4 1.4h.4c.5 0 .8.3.6.8l-.9 3c0 .5-.4.8-.9.8-1.7 0-3-.4-4-1.2l-.3-1h-.2c-1 1.5-3 2.5-5.4 2.5zm1.5-8c-2 0-3.2 1-3.2 2.5 0 1.5 1.1 2.3 2.9 2.3 2.2 0 3.8-1.7 3.8-3.8v-1h-3.5zM15.5 1.2 L8.5 25.5 L1.5 1.2 L8.5 1.2 Z"
                      className="hidden" // Hiding the old V path to use the accurate one below
                    />
                    {/* Accurate Wordmark */}
                    <path fill="#FFFFFF" d="M15.1 1.2L9.4 26.6h5.8l5.7-25.4zM32.1 1.2h-7.6c-1.8 0-3.2 1.1-3.8 2.6L10.3 26.6h6l1.2-3.3h7.3l.7 3.3h5.3L32.1 1.2zm-6.5 17.5l1.6-4.5l0.9 4.5h-2.5zM52.3 9.4c-1.3-0.6-3.2-1.3-5.5-1.3-5.8 0-9.9 3.1-9.9 7.5 0 3.3 2.9 5.1 5.1 6.2 2.3 1.1 3 1.8 3 2.8 0 1.5-1.9 2.2-3.6 2.2-2.4 0-3.7-0.4-5.7-1.3l-0.8-0.4-0.9 5.4c1.5 0.7 4.2 1.3 7 1.4 6.2 0 10.2-3.1 10.2-7.8 0-2.6-1.5-4.6-4.9-6.2-2-1.1-3.3-1.8-3.3-2.9 0-1 1.1-2 3.5-2 2 0 3.4 0.4 4.5 0.9l0.5 0.2 0.8-5.3zM70.3 1.2l-5.3 17.5-0.3-1.4c-0.9-4.7-4.2-8.7-8.9-11l5.8 20.3h6.2L77.3 1.2h-7z" />
                  </svg>
                </div>
              )}
              {card.network === 'troy' && (
                <div className="flex items-center gap-1 sm:gap-2">
                  <svg viewBox="0 0 120 40" className="h-5 sm:h-9 overflow-visible">
                    {/* "tr" */}
                    <path fill="#FFFFFF" d="M12.5 12h-4v-4h4v4zm0 24h-4V12h4v24zm14.5-10.5c-0.5-3.5-3.5-5.5-7-5.5-4.5 0-8 3.5-8 8.5s3.5 8.5 8 8.5c3.5 0 6.5-2 7.5-5.5h-4.5c-0.5 1.5-1.5 2-3 2-2 0-3.5-1.5-3.5-4h11zM17 21c1.5 0 2.5 0.5 3 2h-6.5C14 21.5 15.5 21 17 21z" className="hidden" />
                    {/* Lowercase t, r, y */}
                    <path fill="#FFFFFF" d="M11 11.5v4.5H7.5v4h3.5v9c0 4.5 2.5 7 7 7 1.5 0 3-.2 4-.6l-1-4.5c-.7.3-1.4.3-2.2.3-1.5 0-3-.8-3-2.2v-9h5.5v-4H15.3v-4.5H11zM28.5 16c-1.5 0-3.5.8-4.5 2.5h-.1V16h-4.5v16.5h4.5v-10c0-3 1.5-4.5 4-4.5 1 0 2 .2 3 .5l1-4.5c-1-.3-2.5-.5-3.9-.5zM76.5 16h-4.8l-4 10-4-10h-5l6.5 16-2.5 6.5h4.5l9.8-22.5z" />
                    {/* Troy 'o' semi-circles */}
                    <path fill="#00CED1" d="M48.5 14.5c-5.5 0-10 4.5-10 10s4.5 10 10 10v-5c-2.8 0-5-2.2-5-5s2.2-5 5-5v-5zM51.5 14.5v5c2.8 0 5 2.2 5 5s-2.2 5-5 5v5c5.5 0 10-4.5 10-10s-4.5-10-10-10z" />
                  </svg>
                </div>
              )}
              {card.network === 'amex' && (
                <div className="bg-sky-600/90 p-0.5 sm:p-1 rounded-sm border border-white/20">
                  <div className="font-bold text-[6px] sm:text-[10px] text-white leading-tight text-center px-1">
                    AMERICAN<br />EXPRESS
                  </div>
                </div>
              )}
              {/* Fallback to Mastercard style if no network selected */}
              {!card.network && (
                <div className="flex -space-x-2 sm:-space-x-4">
                  <div className="w-5 h-5 sm:w-10 sm:h-10 rounded-full bg-rose-500/95 border border-white/10"></div>
                  <div className="w-5 h-5 sm:w-10 sm:h-10 rounded-full bg-amber-500/95 border border-white/10 backdrop-blur-sm"></div>
                </div>
              )}
            </div>
            {/* Utilization Bar */}
            <div className="w-12 sm:w-28 bg-black/40 h-0.5 sm:h-1.5 rounded-full overflow-hidden border border-white/10 p-[0.5px]">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${isCreditBalance ? 'bg-emerald-500 shadow-lg' : isOverThreshold ? 'bg-rose-500 shadow-lg' : 'bg-white shadow-lg'}`}
                style={{ width: `${Math.min(utilization, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Decorators */}
        {isOverThreshold && (
          <div className="absolute -right-6 -bottom-6 sm:-right-8 sm:-bottom-8 opacity-[0.05] pointer-events-none scale-110 sm:scale-125 transform rotate-12">
            <AlertTriangle size={200} className="text-rose-500" />
          </div>
        )}
        {isCreditBalance && (
          <div className="absolute -right-6 -bottom-6 sm:-right-8 sm:-bottom-8 opacity-[0.1] pointer-events-none scale-90 sm:scale-110 transform -rotate-12">
            <CheckCircle2 size={180} className="text-emerald-400" />
          </div>
        )}
      </div>
    </div>
  );
};

export default CardVisual;
