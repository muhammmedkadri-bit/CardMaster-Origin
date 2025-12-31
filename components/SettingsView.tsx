import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, Category } from '../types';
import {
  User,
  Moon,
  Sun,
  Globe,
  Trash2,
  ArrowLeft,
  ChevronRight,
  Shield,
  Info,
  Bell,
  Coins,
  Camera,
  LogOut,
  Sparkles,
  Plus,
  Tag,
  Download,
  Upload,
  RefreshCw,
  Database
} from 'lucide-react';

interface SettingsViewProps {
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onResetAll: () => void;
  onBack: () => void;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  onDeleteCategory: (id: string) => void;
}

const isColorLight = (color: string) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return brightness > 155;
};

const SettingsView: React.FC<SettingsViewProps> = ({ isDarkMode, onThemeToggle, onResetAll, onBack, categories, setCategories, onDeleteCategory }) => {
  const [userName, setUserName] = useState(() => localStorage.getItem('user_name') || 'Kullanıcı');
  const [currency, setCurrency] = useState(() => localStorage.getItem('user_currency') || 'TL');
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(() => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('user_name', userName);
  }, [userName]);

  useEffect(() => {
    localStorage.setItem('user_currency', currency);
  }, [currency]);

  const getRandomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

  const addCategory = () => {
    if (newCatName.trim() && !categories.some(c => c.name.toLocaleLowerCase('tr-TR') === newCatName.trim().toLocaleLowerCase('tr-TR'))) {
      const other = categories.find(c => c.name === 'Diğer');
      const filtered = categories.filter(c => c.name !== 'Diğer');
      const newCat: Category = {
        id: crypto.randomUUID(),
        name: newCatName.trim(),
        color: newCatColor // Uses current color picker value which starts random
      };
      const updated = [...filtered, newCat, other].filter(Boolean) as Category[];
      setCategories(updated);
      setNewCatName('');
      setNewCatColor(getRandomColor()); // Set next random color
    }
  };

  const removeCategory = (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (!cat || cat.name === 'Diğer') return;
    setCategories(categories.filter(c => c.id !== id));
    onDeleteCategory(id);
  };

  const updateCategoryColor = (id: string, color: string) => {
    const updated = categories.map(c => c.id === id ? { ...c, color } : c);
    setCategories(updated);
    // Sync with DB if user exists
    const cat = updated.find(c => c.id === id);
    if (cat && localStorage.getItem('supabase.auth.token')) { // Simple check or pass user
      // We'll let App.tsx handle the actual DB sync via setCategories if possible, 
      // but for now let's hope App.tsx's useEffect handles it or we'll add a sync prop.
    }
  };

  const renameCategory = (id: string, name: string) => {
    setCategories(categories.map(c => c.id === id ? { ...c, name } : c));
  };

  // VERİ DIŞA AKTAR (Export)
  const exportData = () => {
    const data = {
      cards: JSON.parse(localStorage.getItem('user_cards') || '[]'),
      transactions: JSON.parse(localStorage.getItem('user_transactions') || '[]'),
      categories: JSON.parse(localStorage.getItem('user_categories') || '[]'),
      notifications: JSON.parse(localStorage.getItem('notifications') || '[]'),
      settings: {
        userName,
        currency,
        theme: isDarkMode ? 'dark' : 'light'
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CardMaster_Yedek_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // VERİ İÇE AKTAR (Import)
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.cards && json.transactions) {
          if (confirm('Mevcut verileriniz silinecek ve yedek dosyası yüklenecek. Onaylıyor musunuz?')) {
            localStorage.setItem('user_cards', JSON.stringify(json.cards));
            localStorage.setItem('user_transactions', JSON.stringify(json.transactions));
            if (json.categories) localStorage.setItem('user_categories', JSON.stringify(json.categories));
            if (json.notifications) localStorage.setItem('notifications', JSON.stringify(json.notifications));

            // Uygulamayı yenileyerek verilerin güncellenmesini sağla
            window.location.reload();
          }
        } else {
          alert('Geçersiz yedek dosyası formatı.');
        }
      } catch (err) {
        alert('Dosya okunurken bir hata oluştu.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="pt-8 pb-8 max-w-3xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-center gap-6 mb-12">
        <button
          onClick={onBack}
          className={`p-4 rounded-2xl transition-all active:scale-90 border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-100 text-slate-600'
            }`}
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>AYARLAR</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Hesap ve uygulama tercihleriniz</p>
        </div>
      </div>

      <div className="space-y-10">
        {/* Profile Card */}
        <div className={`p-8 rounded-[40px] border shadow-xl relative overflow-hidden transition-all ${isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-100'
          }`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] rounded-full -mr-10 -mt-10"></div>
          <div className="relative flex flex-col sm:flex-row items-center gap-8">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-full flex items-center justify-center text-white shadow-2xl ring-4 ring-blue-600/10">
                <User size={40} />
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full border-4 border-white dark:border-slate-900 shadow-lg hover:scale-110 transition-transform">
                <Camera size={14} />
              </button>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">PROFİL</p>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className={`text-2xl font-black bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500/20 rounded-xl px-2 -ml-2 w-full max-w-[200px] sm:max-w-none ${isDarkMode ? 'text-white' : 'text-slate-800'
                  }`}
              />
              <p className="text-sm font-medium text-slate-500 mt-1">Kart Takip Asistanı Üyesi</p>
            </div>
            <div className="bg-emerald-500/10 text-emerald-500 px-6 py-3 rounded-2xl border border-emerald-500/20 flex items-center gap-2">
              <Shield size={16} />
              <span className="text-xs font-black uppercase tracking-widest">GÜVENLİ</span>
            </div>
          </div>
        </div>

        {/* Settings Groups */}
        <div className="grid grid-cols-1 gap-6">

          {/* VERİ YÖNETİMİ (Yeni Bölüm) */}
          <section className="space-y-4">
            <h3 className={`text-xs font-black uppercase tracking-[0.2em] px-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>VERİ YÖNETİMİ & SENKRONİZASYON</h3>
            <div className={`p-8 rounded-[32px] border transition-all ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={exportData}
                  className={`flex items-center gap-4 p-5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 text-left ${isDarkMode ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  <div className="p-3 bg-blue-600/10 text-blue-600 rounded-xl"><Download size={20} /></div>
                  <div>
                    <p className={`font-black text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Verileri Yedekle</p>
                    <p className="text-[10px] text-slate-500 font-bold">Cihaza JSON olarak indir</p>
                  </div>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex items-center gap-4 p-5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 text-left ${isDarkMode ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  <div className="p-3 bg-emerald-600/10 text-emerald-600 rounded-xl"><Upload size={20} /></div>
                  <div>
                    <p className={`font-black text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Geri Yükle</p>
                    <p className="text-[10px] text-slate-500 font-bold">Yedek dosyasını yükle</p>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={importData} />
                </button>
              </div>

              <div className="mt-6 flex items-start gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                <Database size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-medium text-slate-500 leading-relaxed">
                  Cihazlar arası veri taşıma için önce <span className="text-amber-600 font-black">Yedekle</span> butonuna basıp dosyayı telefonunuza gönderin, ardından telefondaki Ayarlar'dan <span className="text-amber-600 font-black">Geri Yükle</span> seçeneğini kullanın.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className={`text-xs font-black uppercase tracking-[0.2em] px-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>GENEL</h3>

            <div className={`rounded-[32px] border overflow-hidden ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
              <button onClick={onThemeToggle} className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-5">
                  <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-600/10 text-blue-600'}`}>
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                  </div>
                  <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Karanlık Mod</span>
                </div>
                <div className={`w-14 h-8 rounded-full relative transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-slate-200'}`}>
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${isDarkMode ? 'left-7' : 'left-1'}`}></div>
                </div>
              </button>

              <div className="w-full flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-5">
                  <div className="p-3 bg-indigo-600/10 text-indigo-600 rounded-2xl">
                    <Coins size={20} />
                  </div>
                  <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Para Birimi</span>
                </div>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={`bg-transparent font-black text-sm outline-none ${isDarkMode ? 'text-white' : 'text-slate-800'}`}
                >
                  <option value="TL">Türk Lirası (₺)</option>
                  <option value="USD">Amerikan Doları ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>

              <div className="w-full flex items-center justify-between p-6">
                <div className="flex items-center gap-5">
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
                    <Bell size={20} />
                  </div>
                  <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Bildirimler</span>
                </div>
                <div
                  onClick={() => setIsNotificationsEnabled(!isNotificationsEnabled)}
                  className={`w-14 h-8 rounded-full relative transition-colors cursor-pointer ${isNotificationsEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${isNotificationsEnabled ? 'left-7' : 'left-1'}`}></div>
                </div>
              </div>
            </div>
          </section>

          {/* New Category Management Section */}
          <section className="space-y-4">
            <h3 className={`text-xs font-black uppercase tracking-[0.2em] px-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>HARCAMA KATEGORİLERİ</h3>
            <div className={`p-8 rounded-[32px] border ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className="flex gap-3 mb-8">
                <div className="relative flex-1">
                  <input
                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    placeholder="Yeni kategori adı..."
                    onKeyDown={e => e.key === 'Enter' && addCategory()}
                  />
                </div>
                <div className="relative group">
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={e => setNewCatColor(e.target.value)}
                    className="w-12 h-12 rounded-2xl border-none p-0 overflow-hidden cursor-pointer"
                  />
                </div>
                <button
                  onClick={addCategory}
                  className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/20"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(() => {
                  const seen = new Set<string>();
                  const uniqueCats = categories.filter(c => {
                    const key = c.name.toLocaleLowerCase('tr-TR').trim();
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                  });
                  return uniqueCats.map(cat => (
                    <div key={cat.id} className={`flex items-center justify-between p-4 rounded-3xl border transition-all ${isDarkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex items-center gap-4">
                        <div className="relative group">
                          <input
                            type="color"
                            value={cat.color}
                            onChange={(e) => updateCategoryColor(cat.id, e.target.value)}
                            className="w-8 h-8 rounded-xl border-none p-0 overflow-hidden cursor-pointer opacity-0 absolute inset-0 z-10"
                          />
                          <div className="w-8 h-8 rounded-xl border border-white/10 shadow-sm transition-transform group-hover:scale-110" style={{ backgroundColor: cat.color }}></div>
                        </div>
                        <input
                          type="text"
                          value={cat.name}
                          onChange={(e) => renameCategory(cat.id, e.target.value)}
                          disabled={cat.name === 'Diğer'}
                          className={`text-[10px] font-black uppercase tracking-widest bg-transparent border-none outline-none focus:ring-1 focus:ring-blue-500/30 rounded px-1 w-full ${isDarkMode ? 'text-slate-300' : 'text-slate-600'
                            } ${cat.name === 'Diğer' ? 'opacity-50' : ''}`}
                        />
                      </div>
                      {cat.name !== 'Diğer' && (
                        <button
                          onClick={() => removeCategory(cat.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className={`text-xs font-black uppercase tracking-[0.2em] px-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>GÜVENLİK VE VERİ</h3>

            <div className={`rounded-[32px] border overflow-hidden ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
              <button
                onClick={onResetAll}
                className="w-full flex items-center justify-between p-6 hover:bg-rose-500/5 transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
                    <Trash2 size={20} />
                  </div>
                  <span className="font-bold text-rose-500">Tüm Verileri Sıfırla</span>
                </div>
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">GERİ DÖNÜLEMEZ</span>
              </button>
            </div>
          </section>

          <section className="space-y-4">
            <div className={`p-8 rounded-[40px] text-center border ${isDarkMode ? 'bg-slate-800/20 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
              <div className="w-16 h-16 bg-blue-600 p-4 rounded-[22px] text-white shadow-xl mx-auto mb-6 flex items-center justify-center">
                <Globe size={32} />
              </div>
              <h4 className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>CardMaster v2.5.0</h4>
              <p className="text-sm font-medium text-slate-500 mt-2 mb-8 leading-relaxed px-4">Her zaman en güncel finansal teknolojilerle kartlarınızı yönetmeniz için geliştirildi.</p>
              <div className="flex justify-center gap-4">
                <button className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 transition-colors">YARDIM</button>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 transition-colors">GİZLİLİK</button>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600 transition-colors">ŞARTLAR</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
