import { create } from 'zustand';
import {
  fetchRecentTransactions,
  fetchBalanceSummary,
  fetchPeriodSummary,
  fetchTodaySpend,
  fetchTransactions,
  fetchTransactionsByDateRange,
  searchTransactions,
  insertTransaction,
  updateTransaction,
  deleteTransaction,
  fetchCategoryBreakdown,
  fetchDailySpend,
  fetchTopExpenses,
  fetchAverageDailySpend,
  fetchMonthlyTotals,
} from '@/database/queries/transactions';
import type {
  Transaction, NewTransaction, BalanceSummary,
  CategoryBreakdown, DailySpend,
} from '@/database/types';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

interface TransactionState {
  // Data
  recentTransactions: Transaction[];
  allTransactions: Transaction[];
  filteredTransactions: Transaction[];
  balanceSummary: BalanceSummary;
  todaySpend: number;
  weekSpend: number;
  monthSpend: number;
  categoryBreakdown: CategoryBreakdown[];
  dailySpend: DailySpend[];
  topExpenses: Transaction[];
  avgDailySpend: number;
  monthlyTotals: Array<{ month: string; total_expense: number; total_income: number }>;

  // UI state
  isLoading: boolean;
  searchQuery: string;

  // Actions
  loadDashboardData: () => void;
  loadAllTransactions: () => void;
  loadAnalyticsData: (from: string, to: string) => void;
  addTransaction: (tx: NewTransaction) => void;
  editTransaction: (id: number, tx: Partial<NewTransaction>) => void;
  removeTransaction: (id: number) => void;
  setSearchQuery: (q: string) => void;
  loadFilteredTransactions: (from?: string, to?: string, categoryId?: number) => void;
}

const today = () => format(new Date(), 'yyyy-MM-dd');
const monthStart = () => format(startOfMonth(new Date()), 'yyyy-MM-dd');
const monthEnd   = () => format(endOfMonth(new Date()), 'yyyy-MM-dd');
const weekStart  = () => format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
const weekEnd    = () => format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

const defaultBalance: BalanceSummary = {
  total_income: 0, total_expense: 0, balance: 0, savings: 0,
};

export const useTransactionStore = create<TransactionState>((set, get) => ({
  recentTransactions: [],
  allTransactions: [],
  filteredTransactions: [],
  balanceSummary: defaultBalance,
  todaySpend: 0,
  weekSpend: 0,
  monthSpend: 0,
  categoryBreakdown: [],
  dailySpend: [],
  topExpenses: [],
  avgDailySpend: 0,
  monthlyTotals: [],
  isLoading: false,
  searchQuery: '',

  loadDashboardData: () => {
    set({ isLoading: true });
    try {
      const t = today();
      const ws = weekStart();
      const we = weekEnd();
      const ms = monthStart();
      const me = monthEnd();

      const balanceSummary  = fetchBalanceSummary();
      const recentTransactions = fetchRecentTransactions(8);
      const todaySpend      = fetchTodaySpend(t);
      const weekData        = fetchPeriodSummary(ws, we);
      const monthData       = fetchPeriodSummary(ms, me);

      set({
        balanceSummary,
        recentTransactions,
        todaySpend,
        weekSpend: weekData.total_expense,
        monthSpend: monthData.total_expense,
        isLoading: false,
      });
    } catch (e) {
      set({ isLoading: false });
    }
  },

  loadAllTransactions: () => {
    set({ isLoading: true });
    try {
      const allTransactions = fetchTransactions(200, 0);
      set({ allTransactions, filteredTransactions: allTransactions, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  loadAnalyticsData: (from: string, to: string) => {
    set({ isLoading: true });
    try {
      const categoryBreakdown = fetchCategoryBreakdown(from, to);
      const dailySpend        = fetchDailySpend(from, to);
      const topExpenses       = fetchTopExpenses(from, to, 5);
      const avgDailySpend     = fetchAverageDailySpend(from, to);
      const monthlyTotals     = fetchMonthlyTotals(6);
      set({ categoryBreakdown, dailySpend, topExpenses, avgDailySpend, monthlyTotals, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addTransaction: (tx: NewTransaction) => {
    insertTransaction(tx);
    get().loadDashboardData();
    // Also refresh filtered list if it was loaded
    if (get().allTransactions.length > 0) get().loadAllTransactions();
  },

  editTransaction: (id: number, tx: Partial<NewTransaction>) => {
    updateTransaction(id, tx);
    get().loadDashboardData();
    get().loadAllTransactions();
  },

  removeTransaction: (id: number) => {
    deleteTransaction(id);
    get().loadDashboardData();
    get().loadAllTransactions();
  },

  setSearchQuery: (q: string) => {
    set({ searchQuery: q });
    if (q.trim().length === 0) {
      set({ filteredTransactions: get().allTransactions });
    } else {
      const results = searchTransactions(q.trim());
      set({ filteredTransactions: results });
    }
  },

  loadFilteredTransactions: (from?: string, to?: string, categoryId?: number) => {
    set({ isLoading: true });
    try {
      let results: Transaction[];
      if (from && to) {
        results = fetchTransactionsByDateRange(from, to, categoryId);
      } else {
        results = fetchTransactions(200, 0);
      }
      set({ filteredTransactions: results, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));
