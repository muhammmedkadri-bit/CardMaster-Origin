
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  CreditCard as CardIcon,
  TrendingUp,
  Calendar,
  PieChart as PieIcon,
  Zap,
  Trash2,
  Edit2,
  X,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  CreditCard as PaymentIcon,
  LayoutDashboard,
  BarChart3,
  Sun,
  Moon,
  ChevronRight,
  ChevronLeft,
  CalendarPlus,
  ExternalLink,
  AlertCircle,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Clock,
  CheckCircle2,
  Bell,
  Check,
  CalendarRange,
  Inbox,
  Settings as SettingsIcon
} from 'lucide-react';
import { CreditCard, AIInsight, Transaction, Category, NotificationItem, ChatMessage } from './types';
import CardVisual from './components/CardVisual';
import CardModal from './components/CardModal';
import TransactionModal from './components/TransactionModal';
import MonthlyAnalysis from './components/MonthlyAnalysis';
import CalendarReminderModal from './components/CalendarReminderModal';
import CardsListView from './components/CardsListView';
import AnalysisView from './components/AnalysisView';
import SettingsView from './components/SettingsView';
import StatementModal from './components/StatementModal';
import DistributionChart from './components/DistributionChart';
import { getFinancialAdvice, getChatResponse } from './services/geminiService';
import { apiService } from './services/apiService';
import { Send, Bot, User as UserIcon, MessageSquare, LogIn as LoginIcon, User as AccountIcon, LogOut } from 'lucide-react';
import { supabase } from './services/supabaseClient';
import AuthModal from './components/AuthModal';
import { User } from '@supabase/supabase-js';
import { dataSyncService } from './services/dataSyncService';

// Ultra-Modern & Aesthetic Layered Card Logo Component
const Logo: React.FC<{ isDarkMode: boolean; isAnimated?: boolean }> = ({ isDarkMode, isAnimated }) => (
  <div className={`flex items-center gap-4 group cursor-pointer select-none transition-all duration-700 ${isAnimated ? 'scale-110' : ''}`}>
    <div className={`relative w-14 h-14 flex items-center justify-center ${isAnimated ? 'animate-logo-orbit' : ''}`}>
      {/* Cinematic Glow Background */}
      <div className={`absolute inset-0 blur-[32px] rounded-full transition-all duration-1000 ${isDarkMode ? 'bg-blue-500/30' : 'bg-blue-600/10'} ${isAnimated ? 'scale-150 opacity-100' : 'scale-75 opacity-0 group-hover:opacity-40'}`}></div>

      {/* Modern Layered Cards SVG */}
      <div className={`relative ${isAnimated ? 'animate-logo-scan' : ''} rounded-xl`}>
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 transition-transform duration-700 group-hover:rotate-[-4deg]">
          <defs>
            <linearGradient id="card-grad-main" x1="0" x2="52" y2="52" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3B82F6" />
              <stop offset="1" stopColor="#1D4ED8" />
            </linearGradient>
            <linearGradient id="card-grad-accent" x1="0" x2="52" y2="52" gradientUnits="userSpaceOnUse">
              <stop stopColor="#60A5FA" stopOpacity="0.4" />
              <stop offset="1" stopColor="#3B82F6" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Back Card - Subtle Offset */}
          <rect x="14" y="6" width="34" height="22" rx="6" fill="url(#card-grad-accent)" className="transition-all duration-1000 group-hover:translate-x-1.5 group-hover:translate-y-[-1.5px]" />

          {/* Middle Card - Semi-Transparent */}
          <rect x="10" y="14" width="34" height="22" rx="6" fill={isDarkMode ? "#0f172a" : "#f1f5f9"} fillOpacity="0.7" stroke="url(#card-grad-main)" strokeWidth="0.5" />

          {/* Front Main Card */}
          <rect x="4" y="22" width="34" height="22" rx="6" fill="url(#card-grad-main)" className="shadow-2xl" />

          {/* Electronic Chip - Glowing on Animation */}
          <rect x="8" y="28" width="8" height="6" rx="2" fill="white" fillOpacity="0.3" className={isAnimated ? 'animate-chip-glow' : ''} />
          <path d="M26 33H32M28 33H30" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.4" />
        </svg>
      </div>
    </div>

    <div className="flex flex-col">
      <div className={`flex items-baseline ${isAnimated ? 'animate-text-reveal' : ''}`}>
        <span className={`text-2xl font-black tracking-tighter transition-all duration-500 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          CARD
        </span>
        <span className={`text-2xl font-[200] tracking-[0.3em] ml-1.5 transition-all duration-700 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          MASTER
        </span>
      </div>
      <div className="flex items-center gap-2 mt-0.5 overflow-hidden">
        <div className={`h-[1px] w-4 transition-all duration-1000 ${isDarkMode ? 'bg-slate-700' : 'bg-slate-300'} ${isAnimated ? 'w-full' : ''}`}></div>
        <span className={`text-[7px] font-black uppercase tracking-[0.4em] whitespace-nowrap ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} ${isAnimated ? 'animate-pulse' : ''}`}>
          KART TAKİP ASİSTANI
        </span>
      </div>
    </div>
  </div>
);



const Toast: React.FC<{ message: string; type: 'warning' | 'info' | 'success'; onClose: () => void }> = ({ message, type, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // 1.7 saniye sonra çıkış animasyonunu başlat
    const exitTimer = setTimeout(() => setIsExiting(true), 1700);
    // 2 saniye sonra tamamen kaldır
    const closeTimer = setTimeout(onClose, 2000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  const colors = {
    warning: 'bg-rose-600 border-rose-500 shadow-rose-900/20',
    info: 'bg-blue-600 border-blue-500 shadow-blue-900/20',
    success: 'bg-emerald-600 border-emerald-500 shadow-emerald-900/20'
  };

  return (
    <div
      className={`p-4 rounded-2xl shadow-2xl transition-all duration-300 ease-in-out flex items-center gap-3 border text-white ${colors[type]} ${isExiting
        ? 'opacity-0 translate-x-12 scale-95 blur-sm'
        : 'animate-in slide-in-from-right duration-300 opacity-100 translate-x-0 scale-100'
        }`}
    >
      <div className="bg-white/20 p-1.5 rounded-lg shrink-0">
        {type === 'warning' ? <AlertCircle size={18} /> : type === 'success' ? <RefreshCw size={18} /> : <Zap size={18} />}
      </div>
      <p className="font-bold text-xs pr-4 whitespace-nowrap">{message}</p>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(onClose, 300);
        }}
        className="hover:bg-white/10 p-1 rounded-lg transition-colors ml-auto"
      >
        <X size={16} />
      </button>
    </div>
  );
};

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const realtimeChannelRef = useRef<any>(null);
  const lastSyncTimeRef = useRef<number>(Date.now());
  const shownNotificationsRef = useRef<Set<string>>(new Set());

  const [cards, setCards] = useState<CreditCard[]>(() => {
    const saved = localStorage.getItem('user_cards');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('user_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('user_categories');
    const defaultCategories: Category[] = [
      { id: '1', name: 'Market', color: '#3B82F6' },
      { id: '2', name: 'Ulaşım', color: '#10B981' },
      { id: '3', name: 'Restoran', color: '#F59E0B' },
      { id: '4', name: 'Fatura', color: '#EF4444' },
      { id: '5', name: 'Eğlence', color: '#8B5CF6' },
      { id: '6', name: 'Diğer', color: '#64748B' }
    ];

    if (!saved) return defaultCategories;

    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // More robust migration: map everything to Category objects
        return parsed.map((item: any, index: number) => {
          if (typeof item === 'string') {
            return {
              id: `migrated-${index}-${Date.now()}`,
              name: item,
              color: defaultCategories.find(dc => dc.name === item)?.color || '#3B82F6'
            };
          }
          return item; // Keep existing objects
        });
      }
      return parsed;
    } catch (e) {
      return defaultCategories;
    }
  });

  const [notificationHistory, setNotificationHistory] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [view, setView] = useState<'dashboard' | 'cards' | 'analysis' | 'settings'>('dashboard');
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'spending' | 'payment' | 'edit_transaction' | 'calendar' | 'statement' | 'reset_confirm' | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCard | undefined>(undefined);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [selectedCardForAction, setSelectedCardForAction] = useState<CreditCard | null>(null);
  const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [toastNotifications, setToastNotifications] = useState<{ id: number; message: string; type: 'warning' | 'info' | 'success' }[]>([]);
  const [scrollY, setScrollY] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isChangingView, setIsChangingView] = useState(false);
  const [realtimeRetryTrigger, setRealtimeRetryTrigger] = useState(0);
  const [transitionData, setTransitionData] = useState<{ from: string, to: string } | null>(null);

  // Auth States
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // AI Chat States
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userMessage, setUserMessage] = useState('');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isAIPanelOpen) scrollToBottom();
  }, [chatHistory, isAIPanelOpen]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollX, setScrollX] = useState(0);

  // Helper to format date as dd.mm.yy
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = String(date.getFullYear()).slice(-2);

      // Check if there is a time component or if it's an ISO string
      if (dateStr.includes('T') || dateStr.includes(':')) {
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        return `${d}.${m}.${y} ${hh}.${mm}`;
      }
      return `${d}.${m}.${y}`;
    } catch (e) {
      return dateStr;
    }
  };

  useEffect(() => {
    localStorage.setItem('user_cards', JSON.stringify(cards));
    localStorage.setItem('user_transactions', JSON.stringify(transactions));
    checkFinancialDeadlines();
  }, [cards, transactions]);

  useEffect(() => {
    localStorage.setItem('user_categories', JSON.stringify(categories));
  }, [categories]);

  // --- LOCAL STORAGE SYNC ONLY ---
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notificationHistory));
  }, [notificationHistory]);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleWindowScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleWindowScroll);
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, []);

  useEffect(() => {
    // Initial loading simulation for premium welcome feel
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2200);

    if (cards.length > 0) {
      syncWithBank(false);
    }
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!supabase) return;

    // Listen for auth changes
    const handleAuthState = async (sessionUser: User | null) => {
      setUser(sessionUser);

      if (sessionUser) {
        setIsAuthModalOpen(false);
        const data = await dataSyncService.fetchAllData(sessionUser.id);

        if (data) {
          if (data.cards.length > 0) {
            setCards(data.cards);
            setTransactions(data.transactions);
          }
          if (data.categories.length > 0) {
            setCategories(data.categories);
          } else {
            setCategories([
              { id: '1', name: 'Market', color: '#3B82F6' },
              { id: '2', name: 'Ulaşım', color: '#10B981' },
              { id: '3', name: 'Restoran', color: '#F59E0B' },
              { id: '4', name: 'Fatura', color: '#EF4444' },
              { id: '5', name: 'Eğlence', color: '#8B5CF6' },
              { id: '6', name: 'Diğer', color: '#64748B' }
            ]);
          }
          setNotificationHistory(data.notifications);
          setChatHistory(data.chat);
        }
      } else {
        setCards([]);
        setTransactions([]);
        setNotificationHistory([]);
        setChatHistory([]);
        setIsAuthModalOpen(true);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthState(session?.user ?? null);
    });



    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthState(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Clear shown notifications when user changes
  useEffect(() => {
    if (user) {
      shownNotificationsRef.current.clear();
    }
  }, [user?.id]);

  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  // --- REF FOR STABLE STATE ACCESS IN REALTIME ---
  const cardsRef = useRef(cards);
  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  // --- HYBRID REALTIME + POLLING SYNC (Safari Compatibility) ---
  useEffect(() => {
    if (!user) return;

    let lastDataHash = '';

    const syncAll = async () => {
      const data = await dataSyncService.fetchAllData(user.id);
      if (data) {
        // Create hash to detect changes
        const newHash = JSON.stringify({
          cards: data.cards.length,
          transactions: data.transactions.length,
          lastTx: data.transactions[0]?.id
        });

        if (newHash !== lastDataHash) {
          console.log("[App] Data changed, updating UI...");
          setCards(data.cards);
          setTransactions(data.transactions);
          setCategories(data.categories);
          setNotificationHistory(data.notifications);
          setChatHistory(data.chat);
          setLastUpdate(Date.now());
          lastDataHash = newHash;
        }
      }
    };

    // 1. WebSocket Realtime (works great on desktop, spotty on mobile Safari)
    const connectRealtime = async () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }

      const channel = dataSyncService.subscribeToChanges(user.id, async () => {
        await syncAll();
      });

      realtimeChannelRef.current = channel;
      setRealtimeStatus('connected');
    };

    connectRealtime();

    // 2. HTTP Polling (fallback for mobile - checks every 2s when visible)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    let pollInterval: any;

    if (isMobile) {
      // Immediate sync on visibility change (critical for PWA mode)
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          console.log("[PWA] App visible, syncing immediately...");
          syncAll();
        }
      };

      window.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('pageshow', handleVisibilityChange);
      window.addEventListener('focus', handleVisibilityChange);

      // Continuous polling as backup (500ms for instant in-app sync)
      pollInterval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          syncAll();
        }
      }, 500);

      return () => {
        window.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('pageshow', handleVisibilityChange);
        window.removeEventListener('focus', handleVisibilityChange);
      };
    }

    // 3. Connection health check
    const checkInterval = setInterval(() => {
      const isBroken = !realtimeChannelRef.current || realtimeChannelRef.current.state !== 'joined';
      if (isBroken) {
        connectRealtime();
      }
    }, 5000);

    return () => {
      clearInterval(checkInterval);
      if (pollInterval) clearInterval(pollInterval);
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [user, realtimeRetryTrigger]);

  // --- MOBILE SYNC FIX: REFETCH ON FOCUS & SAFARI OPTIMIZATION ---
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log("[App] App became visible (Active), refreshing data...");

        // 1. Immediate Data Refresh
        const data = await dataSyncService.fetchAllData(user.id);
        if (data) {
          setCards(data.cards);
          setTransactions(data.transactions);
          setCategories(data.categories);
          setNotificationHistory(data.notifications);
          setChatHistory(data.chat);
          setLastUpdate(Date.now());
        }

        // 2. Safari Specific: Force Reconnect Realtime to wake up frozen sockets
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        if (isSafari) {
          console.log("[App] Safari detected, forcing Realtime reconnect...");
          setRealtimeRetryTrigger(prev => prev + 1);
        }
      }
    };

    // Safari specific: Auto-refresh every 30s as a fallback for potential dead sockets
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    let safariInterval: any;
    if (isSafari) {
      safariInterval = setInterval(async () => {
        if (document.visibilityState === 'visible') {
          console.log("[App] Safari periodic sync...");
          const data = await dataSyncService.fetchAllData(user.id);
          if (data) {
            setCards(data.cards);
            setTransactions(data.transactions);
          }
        }
      }, 30000);
    }

    // Event listeners for focus/visibility
    window.addEventListener('pageshow', handleVisibilityChange);
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      window.removeEventListener('pageshow', handleVisibilityChange);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      if (safariInterval) clearInterval(safariInterval);
    };
  }, [user]);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();

    }
  };

  const handleViewChange = (newView: 'dashboard' | 'cards' | 'analysis' | 'settings') => {
    if (newView === view) return;

    setTransitionData({ from: view, to: newView });
    setIsChangingView(true);

    // Adaptive duration based on view complexity (e.g., analysis takes longer)
    const duration = newView === 'analysis' || view === 'analysis' ? 600 : 400;

    setTimeout(() => {
      setView(newView);
      setTimeout(() => {
        setIsChangingView(false);
        setTransitionData(null);
      }, 300);
    }, duration);
  };

  const checkFinancialDeadlines = () => {
    if (cards.length === 0) return;

    const now = new Date();
    const today = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const dateKey = `${currentYear}-${currentMonth}-${today}`;

    cards.forEach(card => {
      const balanceVal = Math.max(0, card.balance).toLocaleString('tr-TR');
      const balanceStr = `(Borç: ₺${balanceVal})`;

      if (today > card.dueDay && card.balance > 0) {
        addFinancialAlert(
          `${card.cardName} ödemesi gecikti! ${balanceStr}`,
          'warning',
          `overdue-${card.id}-${dateKey}`,
          card.color,
          card.cardName
        );
      }

      if (today === card.dueDay) {
        addFinancialAlert(
          `Bugün ${card.cardName} son ödeme günü. ${balanceStr}`,
          'warning',
          `due-today-${card.id}-${dateKey}`,
          card.color,
          card.cardName
        );
      }

      const dueInThree = (today + 3);
      if (dueInThree === card.dueDay) {
        addFinancialAlert(
          `${card.cardName} ödemesine 3 gün kaldı. ${balanceStr}`,
          'info',
          `due-3days-${card.id}-${dateKey}`,
          card.color,
          card.cardName
        );
      }
    });
  };

  const addFinancialAlert = (message: string, type: 'warning' | 'info' | 'success', uniqueKey: string, cardColor?: string, cardName?: string) => {
    if (notificationHistory.some(n => n.dateKey === uniqueKey)) return;

    const id = Date.now().toString();
    showToast(message, type);

    const newItem: NotificationItem = {
      id,
      message,
      type,
      timestamp: new Date().toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      read: false,
      dateKey: uniqueKey,
      cardColor,
      cardName
    };
    setNotificationHistory(prev => [newItem, ...prev].slice(0, 50));
  };

  const showToast = (message: string, type: 'warning' | 'info' | 'success') => {
    // Create unique key for this notification
    const notificationKey = `${message}-${type}`;

    // Prevent duplicate notifications
    if (shownNotificationsRef.current.has(notificationKey)) {
      return;
    }

    shownNotificationsRef.current.add(notificationKey);

    const id = Date.now();
    setToastNotifications(prev => [...prev, { id, message, type }]);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      removeToast(id);
      // Allow showing this notification again after 30 seconds
      setTimeout(() => {
        shownNotificationsRef.current.delete(notificationKey);
      }, 30000);
    }, 3000);
  };

  const removeToast = (id: number) => {
    setToastNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllAsRead = async () => {
    setNotificationHistory(prev => prev.map(n => ({ ...n, read: true })));

    if (user) {
      await dataSyncService.markAllNotificationsAsRead(user.id);
      // Refetch to ensure sync across devices
      const data = await dataSyncService.fetchAllData(user.id);
      if (data) {
        setNotificationHistory(data.notifications);
      }
    }
  };

  const toggleNotificationRead = async (id: string) => {
    const notification = notificationHistory.find(n => n.id === id);
    const newReadState = !notification?.read;

    // Update local state immediately
    setNotificationHistory(prev => prev.map(n => n.id === id ? { ...n, read: newReadState } : n));

    // Sync to database (both read and unread states)
    if (user) {
      await dataSyncService.updateNotificationReadStatus(id, newReadState);
    }
  };

  const unreadCount = useMemo(() => notificationHistory.filter(n => !n.read).length, [notificationHistory]);

  const syncWithBank = async (notify: boolean = false) => {
    if (cards.length === 0 || isSyncing) return;
    setIsSyncing(true);
    try {
      const balanceUpdates = await apiService.fetchLatestBalances(cards);
      const newTransactions = await apiService.fetchNewTransactions(cards);
      setCards(prevCards => prevCards.map(card => ({
        ...card,
        balance: balanceUpdates[card.id] !== undefined ? balanceUpdates[card.id] : card.balance
      })));
      if (newTransactions.length > 0 && notify) {
        showToast(`${newTransactions.length} yeni işlem senkronize edildi.`, 'success');
      }
    } catch (error) {
      if (notify) showToast('Banka bağlantı hatası.', 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const totalLimit = useMemo(() => cards.reduce((acc, c) => acc + c.limit, 0), [cards]);
  const totalBalance = useMemo(() => cards.reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0), [cards]);
  const overallUtilization = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;

  const widgetsData = useMemo(() => {
    if (cards.length === 0) return { closestDue: null, highestDebt: null, overdue: null };
    const today = new Date().getDate();
    const futureDueDates = cards.filter(c => c.dueDay >= today).sort((a, b) => a.dueDay - b.dueDay);
    const pastDueDates = cards.filter(c => c.dueDay < today).sort((a, b) => a.dueDay - b.dueDay);
    const closestDue = futureDueDates.length > 0 ? futureDueDates[0] : pastDueDates[0];
    const highestDebt = [...cards].sort((a, b) => b.balance - a.balance)[0];
    const overdue = cards.find(c => c.dueDay < today && c.balance > 0);
    return { closestDue, highestDebt, overdue };
  }, [cards]);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [transactions]);

  const handleSaveCard = async (savedCard: CreditCard) => {
    // 1. Optimistic Update (Immediate Feedback)
    setCards(prev => {
      const exists = prev.find(c => c.id === savedCard.id);
      if (exists) return prev.map(c => c.id === savedCard.id ? savedCard : c);
      return [...prev, savedCard];
    });

    showToast(`${savedCard.cardName} kaydediliyor...`, 'info');
    setModalMode(null);
    setEditingCard(undefined);

    // 2. Server Sync
    if (user) {
      await dataSyncService.upsertCard(user.id, savedCard);
    }
  };

  const handleTransaction = async (finalTx: Transaction) => {
    if (!user) return;

    // 1. ANINDA ARAYÜZ GÜNCELLEME (SPEED & MATH)
    // Beklemek yok, anında sonuç.

    // A) İşlem Listesini Güncelle
    const related = cards.find(c => c.id === finalTx.cardId);
    const optimisticTx = { ...finalTx, cardName: related?.cardName || '' };
    setTransactions(prev => [optimisticTx, ...prev]);

    // B) Bakiyeyi Anında Hesapla (User's Idea: Calculate instantly from action)
    if (related) {
      setCards(prev => prev.map(c => {
        if (c.id === finalTx.cardId) {
          // Harcama ise borç artar (+), Ödeme ise borç azalır (-)
          const impact = finalTx.type === 'spending' ? finalTx.amount : -finalTx.amount;
          return { ...c, balance: c.balance + impact };
        }
        return c;
      }));
    }

    // C) Modalı Kapat ve Bildirim Ver
    setModalMode(null);
    setEditingTransaction(undefined);
    showToast('İşlem başarıyla eklendi', 'success');

    // 2. ARKA PLAN SENKRONİZASYONU
    try {
      await dataSyncService.saveTransaction(user.id, finalTx);

      // SEND SYNC SIGNAL: Tell other devices to refresh (Critical for Safari Mobile)
      dataSyncService.sendSyncSignal(user.id);

      // Sessizce doğrulama yap (Kullanıcıya hissettirmeden)
      const data = await dataSyncService.fetchAllData(user.id);
      if (data) {
        // Verileri senkronize et ama UI titremesin diye dikkatli olabiliriz
        // Şimdilik direkt set ediyoruz, çünkü veri doğruysa zaten aynı olacaktır.
        setCards(data.cards);
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error(error);
      // Hata olursa kullanıcıyı uyar (Rollback mantığı eklenebilir ama şu an basit tutuyoruz)
      showToast('Senkronizasyon hatası', 'warning');
    }
  };

  const deleteTransaction = async () => {
    if (!transactionToDelete || !user) return;
    const txId = transactionToDelete.id;
    const deletedTx = transactions.find(t => t.id === txId);

    // 1. ANINDA ARAYÜZ GÜNCELLEME

    // A) Listeden Sil
    setTransactions(prev => prev.filter(t => t.id !== txId));

    // B) Bakiyeyi Geri Al (Reverse Math)
    if (deletedTx) {
      setCards(prev => prev.map(c => {
        if (c.id === deletedTx.cardId) {
          // Silinen Harcama -> Borç Azalır (-)
          // Silinen Ödeme -> Borç Artar (+)
          // impact'in tersini alıyoruz.
          const reverseImpact = deletedTx.type === 'spending' ? -deletedTx.amount : deletedTx.amount;
          return { ...c, balance: c.balance + reverseImpact };
        }
        return c;
      }));
    }

    setTransactionToDelete(null);
    showToast('İşlem silindi', 'success');

    // 2. ARKA PLAN SENKRONİZASYONU
    try {
      await dataSyncService.deleteTransaction(txId);

      // SEND SYNC SIGNAL
      dataSyncService.sendSyncSignal(user.id);

      // Sessiz doğrulama
      const data = await dataSyncService.fetchAllData(user.id);
      if (data) {
        setCards(data.cards);
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteCard = async () => {
    if (!cardToDelete) return;
    const cardId = cardToDelete.id;

    // 1. Optimistic Update (Immediate Feedback)
    setCards(prev => prev.filter(c => c.id !== cardId));
    setCardToDelete(null);
    showToast('Kart kaldırılıyor...', 'info');

    // 2. Server Sync
    if (user) await dataSyncService.deleteCard(cardId);
  };

  const resetAllData = () => {
    setCards([]);
    setTransactions([]);
    setNotificationHistory([]);
    setAiInsights([]);
    setCategories([
      { id: '1', name: 'Market', color: '#3B82F6' },
      { id: '2', name: 'Ulaşım', color: '#10B981' },
      { id: '3', name: 'Restoran', color: '#F59E0B' },
      { id: '4', name: 'Fatura', color: '#EF4444' },
      { id: '5', name: 'Eğlence', color: '#8B5CF6' },
      { id: '6', name: 'Diğer', color: '#64748B' }
    ]);
    localStorage.removeItem('user_cards');
    localStorage.removeItem('user_transactions');
    localStorage.removeItem('notifications');
    localStorage.removeItem('user_categories');
    setModalMode(null);
    setView('dashboard');
    showToast('Tüm uygulama verileri sıfırlandı.', 'info');
  };

  const startEdit = (card: CreditCard) => {
    setEditingCard(card);
    setModalMode('edit');
  };

  const startEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setModalMode('edit_transaction');
  };

  const fetchInsights = async () => {
    if (cards.length === 0) return;
    setLoadingAI(true);
    const insights = await getFinancialAdvice(cards);
    setAiInsights(insights);
    setLoadingAI(false);
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) setScrollX(scrollContainerRef.current.scrollLeft);
  };

  const scrollBy = (amount: number) => {
    if (scrollContainerRef.current) scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const handleAddToCalendarClick = (card: CreditCard) => {
    setSelectedCardForAction(card);
    setModalMode('calendar');
  };

  const handleShowStatementClick = (card: CreditCard) => {
    setSelectedCardForAction(card);
    setModalMode('statement');
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userMessage.trim() || isAIThinking) return;

    const msg = userMessage;
    const userMsgObj: ChatMessage = { role: 'user', content: msg };

    setUserMessage('');
    setChatHistory(prev => [...prev, userMsgObj]);
    setIsAIThinking(true);

    if (user) {
      // Fire and forget save to avoid blocking UI
      dataSyncService.saveChatMessage(user.id, userMsgObj);
    }

    try {
      const response = await getChatResponse(cards, msg, chatHistory);
      const aiMsgObj: ChatMessage = { role: 'assistant', content: response };

      setChatHistory(prev => [...prev, aiMsgObj]);

      if (user) {
        dataSyncService.saveChatMessage(user.id, aiMsgObj);
      }
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Üzgünüm, şu an bağlantı kuramıyorum." }]);
    } finally {
      setIsAIThinking(false);
    }
  };

  const handleCalendarEntry = (type: 'google' | 'ics', day: number, customMsg: string) => {
    if (!selectedCardForAction) return;
    const card = selectedCardForAction;
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();

    // Geçmiş bir gün seçilirse sonraki aya at
    if (day < now.getDate()) {
      month++;
      if (month > 11) { month = 0; year++; }
    }

    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${year}${pad(month + 1)}${pad(day)}`;
    const startTime = `${dateStr}T090000Z`;
    const endTime = `${dateStr}T100000Z`;

    if (type === 'google') {
      const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Ödeme: ${card.cardName}`)}&dates=${startTime}/${endTime}&details=${encodeURIComponent(customMsg)}&sf=true&output=xml`;
      window.open(googleUrl, '_blank');
      showToast('Google Takvim açılıyor...', 'success');
    } else {
      const icsContent = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CardMaster//TR', 'BEGIN:VEVENT',
        `UID:${Date.now()}@cardmaster.app`, `DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d+/g, '')}`,
        `SUMMARY:Ödeme: ${card.cardName}`, `DTSTART:${startTime}`, `DTEND:${endTime}`,
        `DESCRIPTION:${customMsg.replace(/\n/g, '\\n')}`, 'STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

      if (isSafari) {
        window.location.assign(url);
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${card.cardName}_odeme.ics`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
      }
      showToast('Takvim dosyası hazırlandı.', 'success');
    }
    setModalMode(null);
  };

  const handleGoToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    setView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const logoScrollThreshold = 100;
  const logoOpacity = Math.max(0, 1 - scrollY / logoScrollThreshold);
  const logoBlur = Math.min(10, (scrollY / logoScrollThreshold) * 10);

  return (
    <div className={`min-h-screen transition-colors duration-500 pb-40 sm:pb-32 overflow-x-hidden ${isDarkMode ? 'bg-[#070b14] text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}>

      {/* Header with Revised Logo */}
      <header className="fixed top-0 left-0 right-0 z-40 pointer-events-none p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
          <div className="sm:hidden w-[42px] h-[42px]"></div>
          <div className="hidden sm:block w-12 h-12"></div>

          <div
            onClick={() => handleViewChange('dashboard')}
            className="cursor-pointer transition-opacity duration-200 active:scale-95"
            style={{
              opacity: logoOpacity,
              willChange: 'opacity',
            }}
          >
            <Logo isDarkMode={isDarkMode} />
          </div>

          <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
            {/* Realtime Status Indicator - Hidden per user request */}

            <button
              onClick={() => user ? handleLogout() : setIsAuthModalOpen(true)}
              className={`relative p-2.5 sm:p-3.5 rounded-2xl transition-all border group flex items-center gap-2 ${isDarkMode ? 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white' : 'bg-white/80 border-slate-100 text-slate-500 hover:text-blue-600 shadow-sm backdrop-blur-md'}`}
              title={user ? `${user.email} - Çıkış Yap` : 'Giriş Yap'}
            >
              {user ? <LogOut size={18} className="sm:w-5 sm:h-5" /> : <LoginIcon size={18} className="sm:w-5 sm:h-5" />}
              <span className="hidden md:block text-[10px] font-black uppercase tracking-widest">
                {user ? 'Çıkış' : 'Giriş Yap'}
              </span>
            </button>

            <button
              onClick={() => { setIsNotificationPanelOpen(true); }}
              className={`relative p-2.5 sm:p-3.5 rounded-2xl transition-all border group ${isDarkMode ? 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white' : 'bg-white/80 border-slate-100 text-slate-500 hover:text-blue-600 shadow-sm backdrop-blur-md'}`}
            >
              <Bell size={18} className="sm:w-5 sm:h-5 group-active:scale-90 transition-transform" />
              {unreadCount > 0 && (
                <>
                  <span className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-4 h-4 sm:w-4.5 sm:h-4.5 bg-rose-500 border-2 border-white dark:border-[#0b101d] rounded-full flex items-center justify-center text-[7px] sm:text-[8px] font-black text-white shadow-sm z-10">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                  <span className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-4 h-4 sm:w-4.5 sm:h-4.5 bg-rose-500 rounded-full animate-ping opacity-20"></span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="fixed top-24 right-6 z-[120] flex flex-col gap-3 pointer-events-none items-end">
        {toastNotifications.map(n => (
          <div key={n.id} className="pointer-events-auto">
            <Toast message={n.message} type={n.type} onClose={() => removeToast(n.id)} />
          </div>
        ))}
      </div>

      {/* Login Gate / Welcome Screen */}
      {!user ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#070b14] dark:to-[#0f172a]">
          <div className="animate-in fade-in zoom-in duration-1000 flex flex-col items-center max-w-sm text-center">
            <div className="scale-125 mb-12">
              <Logo isDarkMode={isDarkMode} isAnimated={true} />
            </div>

            <h1 className={`text-4xl sm:text-5xl font-black tracking-tighter mb-6 leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Finansal Özgürlüğe <span className="text-blue-600">Hoş Geldin.</span>
            </h1>

            <p className={`text-sm sm:text-base font-medium mb-10 leading-relaxed opacity-70 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Kartlarınızı yönetin, harcamalarınızı takip edin ve AI destekli asistanınızla bütçenizi kontrol altına alın.
            </p>

            <div className="flex flex-col gap-4 w-full">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[24px] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                HEMEN BAŞLAYIN <ArrowUpRight size={18} />
              </button>

              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4">
                Tüm verileriniz Supabase Realtime ile güvende.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <main className="max-w-7xl mx-auto pt-24 px-4 sm:px-6 space-y-8 sm:space-y-12">
            {view === 'dashboard' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 pt-4 sm:pt-8">
                  {[
                    { label: 'TOPLAM LİMİT', val: totalLimit, icon: <TrendingUp size={28} />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'TOPLAM BORÇ', val: totalBalance, icon: <CardIcon size={28} />, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                    { label: 'KULLANIM ORANI', val: overallUtilization, icon: <Zap size={28} />, color: 'text-blue-500', bg: 'bg-blue-500/10', suffix: '%' }
                  ].map((item, i) => (
                    <div key={i} className={`p-6 sm:p-8 rounded-[40px] border transition-all duration-300 group flex items-center gap-6 ${isDarkMode ? 'bg-[#0f172a]/40 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
                      <div className={`w-14 h-14 shrink-0 ${item.bg} ${item.color} rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        {item.icon}
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-500 tracking-[0.2em] block mb-1 uppercase">{item.label}</span>
                        <p className={`text-xl sm:text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                          {item.suffix === '%' ? `%${item.val.toFixed(1)}` : `₺${item.val.toLocaleString('tr-TR')}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-6 sm:gap-10 items-start max-w-5xl mx-auto">
                  <div className="space-y-6 sm:space-y-10">
                    {cards.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 pt-2 sm:pt-4">
                        <div className={`flex items-center gap-4 p-5 rounded-[24px] border ${isDarkMode ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-100 shadow-sm'}`}>
                          <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl"><Clock size={20} /></div>
                          <div className="overflow-hidden">
                            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">SIRADAKİ ÖDEME</p>
                            <p className={`text-sm font-black truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{widgetsData.closestDue?.cardName} ({widgetsData.closestDue?.dueDay}. Gün)</p>
                            <p className="text-[10px] font-bold text-slate-500">₺{Math.max(0, widgetsData.closestDue?.balance || 0).toLocaleString('tr-TR')}</p>
                          </div>
                        </div>

                        <div className={`flex items-center gap-4 p-5 rounded-[24px] border ${isDarkMode ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-100 shadow-sm'}`}>
                          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl"><TrendingUp size={20} /></div>
                          <div className="overflow-hidden">
                            <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">EN YÜKSEK BORÇ</p>
                            <p className={`text-sm font-black truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{widgetsData.highestDebt?.cardName}</p>
                            <p className="text-[10px] font-bold text-slate-500">₺{Math.max(0, widgetsData.highestDebt?.balance || 0).toLocaleString('tr-TR')}</p>
                          </div>
                        </div>

                        {widgetsData.overdue ? (
                          <div className={`flex items-center gap-4 p-5 rounded-[24px] border ${isDarkMode ? 'bg-rose-500/10 border-rose-500/30' : 'bg-rose-50 border-rose-200 shadow-sm'}`}>
                            <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl"><AlertTriangle size={20} className="animate-pulse" /></div>
                            <div className="overflow-hidden">
                              <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">ÖDEME GÜNÜ GEÇTİ</p>
                              <p className={`text-sm font-black truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{widgetsData.overdue.cardName}</p>
                              <p className="text-[10px] font-bold text-slate-500">Ayın {widgetsData.overdue.dueDay}. günüydü</p>
                            </div>
                          </div>
                        ) : (
                          <div className={`flex items-center gap-4 p-5 rounded-[24px] border ${isDarkMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100 shadow-sm'}`}>
                            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl"><CheckCircle2 size={20} /></div>
                            <div className="overflow-hidden">
                              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">DURUM ÖZETİ</p>
                              <p className={`text-sm font-black truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Ödemeler Güncel</p>
                              <p className="text-[10px] font-bold text-slate-500">Kritik borç bulunmuyor</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <section id="cuzdan" className="space-y-4 sm:space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>CÜZDANIM</h2>
                        <div className="hidden sm:flex gap-2">
                          <button onClick={() => scrollBy(-400)} className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-500 cursor-pointer transition-colors active:scale-90"><ChevronLeft size={20} /></button>
                          <button onClick={() => scrollBy(400)} className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-500 cursor-pointer transition-colors active:scale-90"><ChevronRight size={20} /></button>
                        </div>
                      </div>
                      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex overflow-x-auto gap-4 sm:gap-10 pt-6 sm:pt-10 pb-10 sm:pb-14 -mb-10 sm:-mb-14 snap-x no-scrollbar scroll-smooth min-h-[200px] sm:min-h-[220px]">
                        {cards.map((card, index) => {
                          const cardWidth = 380; const gap = 40; const cardCenter = index * (cardWidth + gap) + (cardWidth / 2);
                          const containerWidth = scrollContainerRef.current?.offsetWidth || 800; const viewportCenter = scrollX + (containerWidth / 2);
                          const relativePos = (cardCenter - viewportCenter) / containerWidth;
                          return (
                            <div key={card.id} className="snap-start shrink-0 w-[280px] sm:w-[380px] relative">
                              <CardVisual card={card} scrollProgress={relativePos} onAddToCalendar={handleAddToCalendarClick} onEdit={startEdit} onDelete={setCardToDelete} />
                            </div>
                          );
                        })}
                        <button onClick={() => setModalMode('add')} className={`snap-start shrink-0 w-[280px] sm:w-[380px] aspect-[1.586/1] border-2 border-dashed rounded-[32px] flex flex-col items-center justify-center gap-4 sm:gap-6 transition-all group ${isDarkMode ? 'border-slate-800 hover:bg-slate-900/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                            <Plus size={32} />
                          </div>
                          <span className={`font-black text-[9px] sm:text-[10px] tracking-[0.3em] uppercase ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>YENİ KART EKLE</span>
                        </button>
                      </div>
                    </section>

                    <div className={`p-6 sm:p-10 rounded-[40px] border transition-all ${isDarkMode ? 'bg-[#0f172a]/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <h3 className={`text-xl font-black flex items-center gap-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                          <ArrowUpRight size={24} className="text-blue-500" /> SON HAREKETLER
                        </h3>
                        {isSyncing && (
                          <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-4 py-2 rounded-full animate-pulse">
                            <RefreshCw size={12} className="animate-spin" /> GÜNCELLENİYOR
                          </div>
                        )}
                      </div>
                      <div className="space-y-4 sm:space-y-5">
                        {sortedTransactions.length > 0 ? (
                          <>
                            {sortedTransactions.slice(0, 5).map(tx => {
                              const catColor = categories.find(c => c.name.toLocaleLowerCase('tr-TR') === tx.category.toLocaleLowerCase('tr-TR'))?.color || '#3B82F6';
                              const isSpending = tx.type === 'spending';

                              return (
                                <div key={tx.id} className={`relative flex items-center justify-between p-3 sm:p-5 rounded-[24px] sm:rounded-[28px] transition-all group border border-transparent ${isDarkMode ? 'bg-slate-800/20 hover:bg-slate-800/40 hover:border-slate-700' : 'bg-white hover:bg-slate-50 hover:border-slate-100 shadow-sm hover:shadow-md'}`}>
                                  {/* Left: Icon & Details */}
                                  <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
                                    <div
                                      className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shrink-0 transition-colors ${isSpending
                                        ? 'bg-rose-500/10 text-rose-500'
                                        : 'bg-emerald-500/10 text-emerald-500'
                                        }`}
                                    >
                                      {isSpending ? <ShoppingBag size={18} className="sm:w-5 sm:h-5" /> : <PaymentIcon size={18} className="sm:w-5 sm:h-5" />}
                                    </div>
                                    <div className="flex flex-col min-w-0 pr-2">
                                      <div className="flex items-center gap-2">
                                        <p className={`font-black text-xs sm:text-base tracking-tight truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                                          {tx.description || (isSpending ? 'HARCAMA' : 'ÖDEME')}
                                        </p>
                                        {tx.confirmationUrl && (
                                          <a href={tx.confirmationUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 p-1 rounded-md text-blue-500 hover:bg-blue-500/10 transition-colors" title="Dekont" onClick={(e) => e.stopPropagation()}><ExternalLink size={12} className="sm:w-3.5 sm:h-3.5" /></a>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest truncate max-w-[100px] sm:max-w-none">{tx.cardName}</p>
                                        <span className="text-[9px] text-slate-300 dark:text-slate-700">•</span>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{formatDateDisplay(tx.date)}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right: Amount & Actions */}
                                  <div className="flex flex-col items-end gap-1 shrink-0">
                                    <p
                                      className={`font-black text-sm sm:text-xl tracking-tighter transition-colors ${isSpending ? 'text-rose-500' : 'text-emerald-500'
                                        }`}
                                    >
                                      {isSpending ? '-' : '+'}₺{tx.amount.toLocaleString('tr-TR')}
                                    </p>

                                    {/* Mobile Safe Actions */}
                                    <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => startEditTransaction(tx)} className={`p-1.5 sm:p-2 rounded-lg transition-colors ${isDarkMode ? 'text-slate-500 hover:text-blue-400 hover:bg-slate-700' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-200'}`}><Edit2 size={14} className="sm:w-4 sm:h-4" /></button>
                                      <button onClick={() => setTransactionToDelete(tx)} className={`p-1.5 sm:p-2 rounded-lg transition-colors ${isDarkMode ? 'text-slate-500 hover:text-rose-400 hover:bg-slate-700' : 'text-slate-400 hover:text-rose-600 hover:bg-slate-200'}`}><Trash2 size={14} className="sm:w-4 sm:h-4" /></button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {sortedTransactions.length > 5 && (
                              <button
                                onClick={() => handleViewChange('analysis')}
                                className={`w-full mt-4 p-5 rounded-3xl border border-dashed font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${isDarkMode
                                  ? 'border-slate-800 text-slate-500 hover:bg-slate-800/30 hover:text-blue-400 hover:border-blue-500/50'
                                  : 'border-slate-200 text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
                                  }`}
                              >
                                <span>Daha fazla hareket göster</span>
                                <ChevronRight size={16} />
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="py-20 text-center text-slate-500 font-bold italic">İşlem geçmişi bulunmuyor.</div>
                        )}
                      </div>
                    </div>

                    <div id="dağılım" className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className={`p-8 rounded-[32px] border transition-all min-h-[480px] h-auto ${isDarkMode ? 'bg-[#0f172a]/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <h3 className={`text-lg font-black mb-8 flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                          <PieIcon size={20} className="text-blue-500" /> DAĞILIM
                        </h3>
                        <div className="relative">
                          <DistributionChart cards={cards} transactions={transactions} isDarkMode={isDarkMode} categories={categories} />
                        </div>
                      </div>
                      <div id="odemeler" className={`p-8 rounded-[32px] border transition-all ${isDarkMode ? 'bg-[#0f172a]/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <h3 className={`text-lg font-black mb-8 flex items-center gap-3 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                          <Calendar size={20} className="text-blue-500" /> ÖDEMELER
                        </h3>
                        <div className="space-y-4">
                          {cards.length > 0 ? [...cards].sort((a, b) => a.dueDay - b.dueDay).map(card => (
                            <div key={card.id} className={`group flex items-center justify-between p-4 sm:p-5 rounded-[24px] transition-all border ${isDarkMode ? 'bg-slate-800/20 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-blue-100 hover:shadow-sm'}`}>
                              <div className="flex items-center gap-4">
                                <div className="w-1.5 h-10 rounded-full shadow-sm" style={{ backgroundColor: card.color }} />
                                <div>
                                  <p className={`font-black text-sm uppercase tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{card.cardName}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-white text-slate-500 shadow-xs'}`}>AYIN {card.dueDay}. GÜNÜ</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 sm:gap-4">
                                <div className="text-right">
                                  <p className={`font-black text-base sm:text-lg tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                    ₺{Math.max(0, card.balance).toLocaleString('tr-TR')}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleAddToCalendarClick(card)}
                                  className={`p-2 rounded-xl transition-all scale-100 sm:scale-0 group-hover:scale-100 ${isDarkMode ? 'bg-slate-700 text-blue-400 hover:bg-blue-600 hover:text-white' : 'bg-white text-blue-600 hover:bg-blue-600 hover:text-white border border-slate-200 shadow-sm'}`}
                                  title="Takvime Ekle"
                                >
                                  <CalendarPlus size={18} />
                                </button>
                              </div>
                            </div>
                          )) : <div className="py-12 flex flex-col items-center justify-center text-slate-500 italic text-sm opacity-40">
                            <Calendar size={24} className="mb-2" />
                            Henüz bir ödeme planı yok
                          </div>}
                        </div>
                      </div>
                    </div>

                    <MonthlyAnalysis transactions={transactions} cards={cards} isDarkMode={isDarkMode} categories={categories} />
                  </div>
                </div>
              </>
            ) : view === 'cards' ? (
              <CardsListView cards={cards} transactions={transactions} isDarkMode={isDarkMode} onEdit={startEdit} onDelete={setCardToDelete} onAddToCalendar={handleAddToCalendarClick} onShowStatement={handleShowStatementClick} onAddCard={() => setModalMode('add')} onBack={() => setView('dashboard')} onEditTransaction={startEditTransaction} onDeleteTransaction={setTransactionToDelete} />
            ) : view === 'analysis' ? (
              <AnalysisView
                cards={cards}
                transactions={transactions}
                isDarkMode={isDarkMode}
                onBack={() => setView('dashboard')}
                onEditTransaction={startEditTransaction}
                onDeleteTransaction={setTransactionToDelete}
                categories={categories}
                lastUpdate={lastUpdate}
              />
            ) : (
              <SettingsView
                isDarkMode={isDarkMode}
                onThemeToggle={() => setIsDarkMode(!isDarkMode)}
                onResetAll={() => setModalMode('reset_confirm')}
                onBack={() => setView('dashboard')}
                categories={categories}
                setCategories={setCategories}
              />
            )}
          </main>

          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center w-full max-w-[320px] sm:max-w-none pointer-events-none">
            <div className="pointer-events-auto flex flex-col items-center">
              {isFabOpen && (
                <div className="mb-4 flex flex-col gap-3 min-w-[210px] animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <button onClick={() => { setModalMode('spending'); setIsFabOpen(false); }} className={`p-4 rounded-[24px] shadow-2xl flex items-center gap-4 font-black uppercase text-[10px] tracking-widest transition-all border active:scale-95 group ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800' : 'bg-white border-slate-100 text-slate-800 hover:bg-slate-50'}`}>
                    <div className="bg-rose-500/10 text-rose-500 p-2.5 rounded-xl group-hover:rotate-45 transition-transform"><ArrowUpRight size={16} /></div>
                    <span>HARCAMA EKLE</span>
                  </button>
                  <button onClick={() => { setModalMode('payment'); setIsFabOpen(false); }} className={`p-4 rounded-[24px] shadow-2xl flex items-center gap-4 font-black uppercase text-[10px] tracking-widest transition-all border active:scale-95 group ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800' : 'bg-white border-slate-100 text-slate-800 hover:bg-slate-50'}`}>
                    <div className="bg-emerald-500/10 text-emerald-500 p-2.5 rounded-xl group-hover:-rotate-45 transition-transform"><ArrowDownRight size={16} /></div>
                    <span>ÖDEME YAP</span>
                  </button>
                  <button onClick={() => { setModalMode('add'); setIsFabOpen(false); }} className={`p-4 rounded-[24px] shadow-2xl flex items-center gap-4 font-black uppercase text-[10px] tracking-widest transition-all border active:scale-95 group ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800' : 'bg-white border-slate-100 text-slate-800 hover:bg-slate-50'}`}>
                    <div className="bg-blue-500/10 text-blue-500 p-2.5 rounded-xl group-hover:scale-110 transition-transform"><Plus size={16} /></div>
                    <span>YENİ KART EKLE</span>
                  </button>
                </div>
              )}

              <div className={`flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-[28px] sm:rounded-[32px] border shadow-2xl backdrop-blur-2xl transition-all ${isDarkMode ? 'bg-[#0f172a]/90 border-slate-800 shadow-black' : 'bg-white/90 border-slate-200 shadow-blue-900/10'}`}>
                <div className="flex items-center px-0.5 sm:px-1 gap-1">
                  <a href="#" onClick={(e) => { e.preventDefault(); handleViewChange('dashboard'); }} className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all ${view === 'dashboard' ? (isDarkMode ? 'bg-slate-800 text-white shadow-inner' : 'bg-slate-100 text-blue-600 shadow-inner') : (isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100')}`}><LayoutDashboard size={20} className="sm:w-5 sm:h-5" /></a>
                  <a href="#" onClick={(e) => { e.preventDefault(); handleViewChange('cards'); }} className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all ${view === 'cards' ? (isDarkMode ? 'bg-slate-800 text-white shadow-inner' : 'bg-slate-100 text-blue-600 shadow-inner') : (isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100')}`}><CardIcon size={20} className="sm:w-5 sm:h-5" /></a>
                  <a href="#" onClick={(e) => { e.preventDefault(); handleViewChange('analysis'); }} className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all ${view === 'analysis' ? (isDarkMode ? 'bg-slate-800 text-white shadow-inner' : 'bg-slate-100 text-blue-600 shadow-inner') : (isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100')}`}><BarChart3 size={20} className="sm:w-5 sm:h-5" /></a>
                </div>
                <button onClick={() => setIsFabOpen(!isFabOpen)} className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all transform hover:scale-105 active:scale-95 border-[3px] sm:border-4 ${isDarkMode ? 'border-[#0a1224]' : 'border-white'} ${isFabOpen ? 'bg-slate-800 rotate-45' : 'bg-blue-600 shadow-blue-600/30'}`}><Plus size={24} className="sm:w-8 sm:h-8" strokeWidth={3} /></button>
                <div className="flex items-center px-0.5 sm:px-1 gap-1">
                  <button onClick={() => setIsAIPanelOpen(true)} className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all ${isDarkMode ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-800' : 'text-slate-500 hover:text-amber-600 hover:bg-slate-100'}`}><Sparkles size={20} className="sm:w-5 sm:h-5" /></button>
                  <a href="#" onClick={(e) => { e.preventDefault(); handleViewChange('settings'); }} className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all ${view === 'settings' ? (isDarkMode ? 'bg-slate-800 text-white shadow-inner' : 'bg-slate-100 text-blue-600 shadow-inner') : (isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100')}`}><SettingsIcon size={20} className="sm:w-5 sm:h-5" /></a>
                  <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all ${isDarkMode ? 'text-slate-400 hover:text-yellow-400 hover:bg-slate-800' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'}`}>
                    {isDarkMode ? <Sun size={20} className="sm:w-5 sm:h-5" /> : <Moon size={20} className="sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {
            isNotificationPanelOpen && (
              <div className="fixed inset-0 z-[110] flex justify-end">
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsNotificationPanelOpen(false)} />
                <div className="relative w-full md:w-[480px] h-full bg-[#fdfdfe] dark:bg-[#0b101d] shadow-[0_0_100px_rgba(0,0,0,0.6)] flex flex-col animate-in slide-in-from-right duration-500 border-l border-white/5">
                  <div className="relative px-8 pt-10 pb-8">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600/10 rounded-[18px] flex items-center justify-center text-blue-600 shadow-inner">
                          <Bell size={24} />
                        </div>
                        <div>
                          <h2 className={`font-black text-2xl tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Bildirimler</h2>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${unreadCount > 0 ? 'text-blue-500' : 'text-slate-400'}`}>
                              {unreadCount > 0 ? `${unreadCount} YENİ` : 'GÜNCEL'}
                            </span>
                            {unreadCount > 0 && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setIsNotificationPanelOpen(false)} className="p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all active:scale-90"><X size={20} /></button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 space-y-4 custom-scrollbar pb-10">
                    {notificationHistory.length > 0 ? notificationHistory.map((item) => (
                      <div
                        key={item.id}
                        className={`relative group p-6 rounded-[28px] border transition-all flex gap-5 shadow-sm ${item.read
                          ? (isDarkMode ? 'bg-[#151b2b] border-slate-800 opacity-50 grayscale-[0.3]' : 'bg-[#f1f5f9] border-slate-200 opacity-60 grayscale-[0.3]')
                          : (item.type === 'warning'
                            ? (isDarkMode ? 'bg-rose-500/10 border-rose-500/40 shadow-[0_10px_30px_rgba(244,63,94,0.15)]' : 'bg-rose-50 border-rose-200 shadow-md')
                            : (isDarkMode ? 'bg-[#1a2235] border-blue-500/30 shadow-[0_10px_30px_rgba(59,130,246,0.1)]' : 'bg-white border-blue-100 shadow-md')
                          )
                          }`}
                      >
                        {!item.read && (
                          <div className={`absolute top-6 right-6 w-3 h-3 rounded-full animate-pulse ${item.type === 'warning' ? 'bg-rose-500 ring-4 ring-rose-500/20' : 'bg-emerald-500 ring-4 ring-emerald-500/20'
                            }`}></div>
                        )}

                        {/* Bireysel Okundu Toggle Butonu */}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleNotificationRead(item.id); }}
                          title={item.read ? "Okunmamış olarak işaretle" : "Okundu olarak işaretle"}
                          className={`shrink-0 w-12 h-12 rounded-[20px] flex items-center justify-center shadow-md transform transition-all active:scale-90 ${item.read
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                            : (item.type === 'warning' ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-blue-600 text-white hover:bg-blue-700')
                            }`}
                        >
                          {item.read ? <Check size={22} /> : item.type === 'warning' ? <AlertTriangle size={22} /> : <Bell size={22} />}
                        </button>

                        <div className="flex-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                            <Clock size={10} /> {item.timestamp}
                          </span>
                          <p className={`text-sm leading-relaxed tracking-tight ${item.read ? 'font-medium' : 'font-black'} ${isDarkMode ? 'text-white' : 'text-slate-900'
                            }`}>
                            {item.message}
                          </p>
                          {(item.cardColor || item.cardName) && (
                            <div className="mt-4 flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.cardColor || '#ccc' }}></div>
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">{item.cardName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )) : <div className="flex flex-col items-center justify-center py-40 text-center"><Inbox size={40} className="text-slate-300 dark:text-slate-700 mb-6" /><h3 className={`font-black text-lg ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Bildirim kutunuz boş</h3></div>}
                  </div>

                  {notificationHistory.length > 0 && (
                    <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl">
                      <button onClick={markAllAsRead} className="w-full py-5 rounded-[22px] bg-blue-600 text-white text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3"><CheckCircle2 size={18} /> TÜMÜNÜ OKUNDU İŞARETLE</button>
                    </div>
                  )}
                </div>
              </div>
            )
          }

          {
            isAIPanelOpen && (
              <div className="fixed inset-0 z-[100] flex justify-end">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsAIPanelOpen(false)} />
                <div className={`relative w-full md:w-[450px] h-full border-l shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden ${isDarkMode ? 'bg-[#0a0f1c] border-slate-800' : 'bg-white border-slate-200'}`}>

                  {/* Header */}
                  <div className={`p-8 border-b flex items-center justify-between ${isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl shadow-xl ${isDarkMode ? 'bg-amber-400 text-slate-950 shadow-amber-400/20' : 'bg-amber-500 text-white shadow-amber-500/20'}`}>
                        <Zap fill="currentColor" size={24} />
                      </div>
                      <div>
                        <h2 className={`font-black text-xl tracking-tight leading-none italic uppercase ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Smart Advisor</h2>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Asistan Hazır</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsAIPanelOpen(false)}
                      className={`p-3 rounded-full transition-all hover:rotate-90 ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                    >
                      <X size={24} />
                    </button>
                  </div>

                  {/* Chat Area */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar scrolling-touch relative">
                    {/* Initial Welcome */}
                    <div className={`p-8 rounded-[32px] border transition-all ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-blue-50/50 border-blue-100/50'}`}>
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-600/10 text-blue-600'}`}>
                          <MessageSquare size={14} />
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>BAŞLANGIÇ</p>
                      </div>
                      <p className={`text-base leading-relaxed font-semibold tracking-tight ${isDarkMode ? 'text-indigo-50' : 'text-slate-700'}`}>
                        Merhaba! Harcama verinizi analiz edebilir, borç kapatma stratejileri sunabilir veya finansal sorularınızı yanıtlayabilirim.
                      </p>
                    </div>

                    {/* Chat History */}
                    <div className="space-y-6">
                      {chatHistory.map((chat, idx) => (
                        <div key={idx} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                          <div className={`max-w-[85%] group`}>
                            <div className={`flex items-center gap-2 mb-1.5 px-2 ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              {chat.role === 'assistant' && <Bot size={10} className="text-amber-500" />}
                              <span className={`text-[9px] font-black uppercase tracking-widest opacity-40 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {chat.role === 'user' ? 'SİZ' : 'ADVISOR'}
                              </span>
                              {chat.role === 'user' && <UserIcon size={10} className="opacity-40" />}
                            </div>
                            <div className={`px-6 py-4 rounded-[26px] shadow-sm transition-all ${chat.role === 'user'
                              ? 'bg-blue-600 text-white rounded-tr-none'
                              : (isDarkMode
                                ? 'bg-[#1a2235] border border-slate-800 text-slate-100 rounded-tl-none'
                                : 'bg-slate-100 border border-slate-200/50 text-slate-800 rounded-tl-none')
                              }`}>
                              <p className="text-[15px] leading-relaxed font-medium whitespace-pre-wrap">{chat.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {isAIThinking && (
                      <div className="flex justify-start animate-in fade-in duration-300 pl-2">
                        <div className={`p-4 rounded-[20px] rounded-tl-none flex gap-1.5 items-center ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]"></div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} className="h-4" />
                  </div>

                  {/* Input Area */}
                  <div className={`p-8 border-t flex flex-col gap-5 ${isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-100'}`}>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {[
                        { label: "💡 Strateji", text: "Borç kapatma stratejisi öner" },
                        { label: "📊 Analiz", text: "En yüksek borçlu kartım hangisi?" },
                        { label: "💰 limitler", text: "Kalan limitlerimi özetle" }
                      ].map((s, i) => (
                        <button
                          key={i}
                          onClick={() => { setUserMessage(s.text); }}
                          className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${isDarkMode
                            ? 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-100'
                            }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>

                    <form onSubmit={handleSendMessage} className="relative group">
                      <input
                        type="text"
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        placeholder="Mesajınızı buraya yazın..."
                        className={`w-full py-5 pl-8 pr-16 rounded-[24px] text-sm focus:outline-none transition-all font-semibold shadow-inner border ${isDarkMode
                          ? 'bg-[#0f172a] border-slate-700 text-white focus:border-blue-500/50 placeholder:text-slate-600'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-400 placeholder:text-slate-400'
                          }`}
                      />
                      <button
                        type="submit"
                        disabled={!userMessage.trim() || isAIThinking}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-[18px] flex items-center justify-center transition-all active:scale-90 shadow-xl disabled:opacity-30 ${isDarkMode
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/10'
                          }`}
                      >
                        <Send size={20} />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )
          }

          {
            cardToDelete && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[130] flex items-center justify-center p-6 animate-in fade-in duration-300">
                <div className={`p-10 rounded-[40px] max-w-sm w-full text-center border shadow-2xl animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-[#0f172a] border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800'}`}>
                  <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8"><AlertTriangle size={32} /></div>
                  <h3 className="text-xl font-black mb-4 uppercase tracking-tight">KARTI SİL?</h3>
                  <p className="text-sm font-medium text-slate-500 mb-10 leading-relaxed"><span className="font-black text-rose-500 uppercase">{cardToDelete.cardName}</span> kartını silmek üzeresiniz.</p>
                  <div className="flex flex-col gap-3"><button onClick={deleteCard} className="w-full bg-rose-500 text-white py-4 rounded-[24px] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-rose-600 transition-all active:scale-95 shadow-xl">KALICI OLARAK SİL</button><button onClick={() => setCardToDelete(null)} className="w-full py-4 rounded-[24px] font-black uppercase tracking-[0.2em] text-[10px] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">VAZGEÇ</button></div>
                </div>
              </div>
            )
          }

          {
            transactionToDelete && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[130] flex items-center justify-center p-6 animate-in fade-in duration-300">
                <div className={`p-10 rounded-[40px] max-w-sm w-full text-center border shadow-2xl animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-[#0f172a] border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800'}`}>
                  <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-8"><AlertTriangle size={32} /></div>
                  <h3 className="text-xl font-black mb-4 uppercase tracking-tight">İŞLEMİ SİL?</h3>
                  <p className="text-sm font-medium text-slate-500 mb-10 leading-relaxed"><span className="font-black text-blue-500 uppercase">{transactionToDelete.description || (transactionToDelete.type === 'spending' ? 'Harcama' : 'Ödeme')}</span> işlemini silmek istediğinize emin misiniz?</p>
                  <div className="flex flex-col gap-3"><button onClick={deleteTransaction} className="w-full bg-blue-600 text-white py-4 rounded-[24px] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-700 transition-all active:scale-95 shadow-xl">İŞLEMİ SİL</button><button onClick={() => setTransactionToDelete(null)} className="w-full py-4 rounded-[24px] font-black uppercase tracking-[0.2em] text-[10px] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">VAZGEÇ</button></div>
                </div>
              </div>
            )
          }

          {
            modalMode === 'reset_confirm' && (
              <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
                <div className="p-12 rounded-[56px] max-w-md w-full text-center border border-rose-500/30 bg-[#0f172a] shadow-[0_0_100px_rgba(244,63,94,0.1)]">
                  <div className="w-24 h-24 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-10 ring-4 ring-rose-500/5"><AlertTriangle size={48} /></div>
                  <h3 className="text-3xl font-black mb-6 text-white tracking-tight italic uppercase">HER ŞEYİ SİL?</h3>
                  <p className="text-slate-400 font-medium mb-12 leading-relaxed">Bu işlem tüm kartlarınızı, harcamalarınızı ve ayarlarınızı kalıcı olarak silecektir. Bu işlemin geri dönüşü yoktur.</p>
                  <div className="flex flex-col gap-4">
                    <button onClick={resetAllData} className="w-full bg-rose-600 text-white py-5 rounded-3xl font-black uppercase tracking-[0.3em] text-xs hover:bg-rose-700 transition-all active:scale-95 shadow-2xl shadow-rose-600/20">VERİLERİ TAMAMEN SIFIRLA</button>
                    <button onClick={() => setModalMode(null)} className="w-full py-5 rounded-3xl font-black uppercase tracking-[0.3em] text-xs text-slate-500 hover:bg-slate-800/50 transition-all">VAZGEÇ</button>
                  </div>
                </div>
              </div>
            )
          }

          {
            (modalMode === 'add' || modalMode === 'edit') && (
              <CardModal title={modalMode === 'add' ? 'Yeni Kart Ekle' : 'Kartı Düzenle'} initialData={editingCard} onClose={() => { setModalMode(null); setEditingCard(undefined); }} onSave={handleSaveCard} />
            )
          }
          {
            (modalMode === 'spending' || modalMode === 'payment' || modalMode === 'edit_transaction') && cards.length > 0 && (
              <TransactionModal type={modalMode === 'edit_transaction' ? (editingTransaction?.type || 'spending') : (modalMode as 'spending' | 'payment')} cards={cards} initialData={editingTransaction} onClose={() => { setModalMode(null); setEditingTransaction(undefined); }} onSave={handleTransaction} categories={categories} />
            )
          }
          {
            modalMode === 'calendar' && selectedCardForAction && (
              <CalendarReminderModal card={selectedCardForAction} onClose={() => { setModalMode(null); setSelectedCardForAction(null); }} onAdd={handleCalendarEntry} />
            )
          }
          {
            modalMode === 'statement' && selectedCardForAction && (
              <StatementModal card={selectedCardForAction} transactions={transactions} isDarkMode={isDarkMode} onClose={() => { setModalMode(null); setSelectedCardForAction(null); }} />
            )
          }
          {
            (modalMode === 'spending' || modalMode === 'payment') && cards.length === 0 && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50 backdrop-blur-xl"><div className={`p-10 rounded-[48px] max-w-sm text-center border ${isDarkMode ? 'bg-[#0f172a] border-slate-800 text-white' : 'bg-white border-slate-100 shadow-2xl'}`}><div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-8 text-blue-600"><CardIcon size={40} /></div><p className="font-black text-xl mb-10 leading-tight uppercase">İşlem yapabilmek için önce bir kart eklemelisiniz.</p><button onClick={() => setModalMode('add')} className="w-full bg-blue-600 text-white py-4.5 rounded-[24px] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-700">İLK KARTIMI EKLE</button></div></div>
            )
          }
        </>
      )}

      {/* Welcome / Initial Loading Screen */}
      {isInitialLoading && (
        <div className={`fixed inset-0 z-[500] flex flex-col items-center justify-center p-6 ${isDarkMode ? 'bg-[#070b14]' : 'bg-[#f8fafc]'}`}>
          <div className="animate-in fade-in zoom-in duration-1000 flex flex-col items-center">
            <Logo isDarkMode={isDarkMode} isAnimated={true} />
            <div className="mt-12 w-48 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
              <div className="absolute inset-0 bg-blue-600 animate-loading-bar rounded-full"></div>
            </div>
            <div className="mt-12 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] mb-2 animate-pulse">BAŞLATILIYOR</span>
              <h2 className={`text-2xl font-black tracking-tighter uppercase ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                HOŞGELDİN, {localStorage.getItem('user_name')?.toLocaleUpperCase('tr-TR') || 'KULLANICI'}
              </h2>
            </div>
          </div>
        </div>
      )}

      {/* View Transition Overlay */}
      {isChangingView && (
        <div className={`fixed inset-0 z-[400] flex flex-col items-center justify-center p-6 animate-in fade-in duration-300 ${isDarkMode ? 'bg-[#070b14]' : 'bg-white'}`}>
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
            <div className="scale-110">
              <Logo isDarkMode={isDarkMode} isAnimated={true} />
            </div>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => { if (user) setIsAuthModalOpen(false); }}
        isDarkMode={isDarkMode}
      />
    </div >
  );
};

export default App;

