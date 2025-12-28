import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import {
    X,
    Mail,
    Lock,
    ArrowRight,
    Loader2,
    ShieldCheck,
    UserPlus,
    LogIn,
    AlertCircle
} from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    isDarkMode: boolean;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, isDarkMode }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: window.location.origin
                    }
                });
                if (error) throw error;
                setIsSuccess(true);
            }

            if (isLogin) onClose();
        } catch (err: any) {
            setError(err.message || 'Bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className={`relative w-full max-w-md overflow-hidden rounded-[40px] shadow-2xl animate-in zoom-in-95 duration-300 mb-10 ${isDarkMode ? 'bg-[#0f172a] border border-slate-800' : 'bg-white border border-slate-100'
                }`}>
                {/* Cinematic Header Background */}
                <div className={`absolute top-0 left-0 right-0 h-32 opacity-20 ${isDarkMode ? 'bg-gradient-to-b from-blue-500/20 to-transparent' : 'bg-gradient-to-b from-blue-600/10 to-transparent'
                    }`} />

                <div className="p-10 relative">
                    <div className="flex justify-between items-start mb-8">
                        <div className={`p-4 rounded-3xl shadow-xl ${isDarkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-600 text-white'
                            }`}>
                            <ShieldCheck size={32} />
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                                }`}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <h2 className={`text-3xl font-black italic tracking-tight mb-2 uppercase ${isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}>
                        {isLogin ? 'Hoş Geldiniz' : 'Hesap Oluştur'}
                    </h2>
                    <p className={`text-sm font-bold uppercase tracking-widest mb-10 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                        {isLogin ? 'Verilerinizi Tüm Cihazlarda Eşitleyin' : 'Card Master Dünyasına Katılın'}
                    </p>

                    {isSuccess ? (
                        <div className={`p-8 rounded-[32px] text-center ${isDarkMode ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50/50 border border-emerald-100'
                            }`}>
                            <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
                                <Mail size={32} />
                            </div>
                            <h3 className={`text-xl font-black mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>E-posta Doğrulama</h3>
                            <p className={`text-sm font-medium leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                Kaydı tamamlamak için {email} adresine gönderdiğimiz onay e-postasını kontrol edin.
                            </p>
                            <button
                                onClick={() => setIsSuccess(false)}
                                className="mt-8 text-xs font-black uppercase tracking-widest text-blue-500 hover:underline"
                            >
                                Giriş Sayfasına Dön
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleAuth} className="space-y-6">
                            {error && (
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold animate-in slide-in-from-top-2">
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className={`text-[10px] font-black uppercase tracking-widest ml-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'
                                    }`}>E-posta Adresi</label>
                                <div className="relative group">
                                    <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-slate-500 group-focus-within:text-blue-500' : 'text-slate-400 group-focus-within:text-blue-600'
                                        }`}>
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="ornek@email.com"
                                        className={`w-full py-5 pl-14 pr-6 rounded-[24px] text-sm font-semibold outline-none transition-all border ${isDarkMode
                                            ? 'bg-[#1e293b]/50 border-slate-700 text-white focus:border-blue-500/50 focus:bg-[#1e293b]'
                                            : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-400 focus:bg-white'
                                            }`}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className={`text-[10px] font-black uppercase tracking-widest ml-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'
                                    }`}>Şifre</label>
                                <div className="relative group">
                                    <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-slate-500 group-focus-within:text-blue-500' : 'text-slate-400 group-focus-within:text-blue-600'
                                        }`}>
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className={`w-full py-5 pl-14 pr-6 rounded-[24px] text-sm font-semibold outline-none transition-all border ${isDarkMode
                                            ? 'bg-[#1e293b]/50 border-slate-700 text-white focus:border-blue-500/50 focus:bg-[#1e293b]'
                                            : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-400 focus:bg-white'
                                            }`}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-6 rounded-[26px] bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <>
                                        {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                                        <span>{isLogin ? 'GİRİŞ YAP' : 'KAYIT OL'}</span>
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>

                            <div className="text-center pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsLogin(!isLogin)}
                                    className={`text-xs font-black uppercase tracking-widest hover:underline ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-blue-600'
                                        }`}
                                >
                                    {isLogin ? 'Henüz hesabınız yok mu? Kaydolun' : 'Zaten hesabınız var mı? Giriş yapın'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer Accent */}
                <div className={`h-2 w-full ${isDarkMode ? 'bg-blue-600/30' : 'bg-blue-600/10'}`} />
            </div>
        </div>
    );
};

export default AuthModal;
