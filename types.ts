
export interface CreditCard {
  id: string;
  bankName: string;
  cardName: string;
  lastFour: string;
  limit: number;
  currentDebt: number;      // Current period debt
  availableLimit: number;   // Calculated: limit - currentDebt
  statementDay: number;
  dueDay: number;
  color: string;
  minPaymentRatio: number;
  alertThreshold?: number;
}

export interface Transaction {
  id: string;
  cardId: string;
  cardName: string;
  type: 'spending' | 'payment';
  amount: number;
  category: string;
  date: string;
  description: string;
  expenseType: 'single' | 'installment';
  installments?: number;
  installmentAmount?: number;
  totalAmount?: number;
  installmentGroupId?: string;
  installmentNumber?: number;
  confirmationUrl?: string;
}

export interface AIInsight {
  type: 'tip' | 'warning' | 'strategy';
  message: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface NotificationItem {
  id: string;
  message: string;
  type: 'warning' | 'info' | 'success';
  timestamp: string;
  read: boolean;
  dateKey?: string;
  cardColor?: string;
  cardName?: string;
  isMandatory?: boolean;
  isDeleted?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AutoPayment {
  id: string;
  cardId: string;
  category: string;
  amount: number;
  dayOfMonth: number;
  description: string;
  lastProcessedMonth?: string; // Format: YYYY-MM
  active: boolean;
}