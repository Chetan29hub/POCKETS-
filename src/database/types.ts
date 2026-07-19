export type TransactionType = 'income' | 'expense';
export type SplitMode = 'equal' | 'custom' | 'percentage';
export type SettlementStatus = 'pending' | 'paid';
export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank_transfer' | 'other';

export interface User {
  id: number;
  name: string;
  currency: string;
  theme: 'dark' | 'light';
  reminder_enabled: number;
  reminder_time: string;
  monthly_budget: number;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  type: TransactionType | 'both';
}

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  category_id: number | null;
  description: string | null;
  date: string;           // YYYY-MM-DD
  time: string;           // HH:MM
  payment_method: PaymentMethod;
  created_at: string;
  // joined fields
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}

export interface Member {
  id: number;
  name: string;
  group_name: string | null;
  created_at: string;
}

export interface SplitExpense {
  id: number;
  total_amount: number;
  payer_share: number;
  category_id: number | null;
  description: string | null;
  date: string;
  num_members: number;
  split_mode: SplitMode;
  created_at: string;
  // joined
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}

export interface Settlement {
  id: number;
  split_id: number;
  member_id: number;
  amount_owed: number;
  status: SettlementStatus;
  settled_at: string | null;
  created_at: string;
  // joined
  member_name?: string;
  split_description?: string;
  split_date?: string;
  split_total?: number;
}

export interface Budget {
  id: number;
  category_id: number | null;
  monthly_limit: number;
  month: string;  // YYYY-MM
  created_at: string;
  // computed
  spent?: number;
  category_name?: string;
}

export interface SavingsGoal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  created_at: string;
}

export interface BalanceSummary {
  total_income: number;
  total_expense: number;
  balance: number;
  savings: number;
}

export interface PeriodSummary {
  period: string;
  total_income: number;
  total_expense: number;
  transaction_count: number;
}

export interface CategoryBreakdown {
  category_id: number;
  category_name: string;
  category_icon: string;
  category_color: string;
  total: number;
  percentage: number;
  count: number;
}

export interface DailySpend {
  date: string;
  total_expense: number;
  total_income: number;
}

export interface NewTransaction {
  type: TransactionType;
  amount: number;
  category_id: number | null;
  description?: string;
  date: string;
  time: string;
  payment_method: PaymentMethod;
}

export interface NewSplitExpense {
  total_amount: number;
  payer_share: number;
  category_id: number | null;
  description?: string;
  date: string;
  num_members: number;
  split_mode: SplitMode;
  members: Array<{ name: string; amount_owed: number }>;
}
