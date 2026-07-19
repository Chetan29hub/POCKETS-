import { create } from 'zustand';
import {
  fetchAllSplits,
  fetchAllSettlements,
  fetchTotalPending,
  insertSplitExpense,
  markSettlementPaid,
  markAllPaidForSplit,
  deleteSplitExpense,
  fetchSettlementsForSplit,
} from '@/database/queries/splits';
import type { SplitExpense, Settlement, NewSplitExpense } from '@/database/types';
import { useTransactionStore } from './useTransactionStore';

interface SplitState {
  splits: SplitExpense[];
  settlements: Settlement[];
  totalPending: number;
  isLoading: boolean;

  loadSplits: () => void;
  loadSettlements: () => void;
  addSplit: (data: NewSplitExpense) => void;
  paySettlement: (settlementId: number) => void;
  payAllForSplit: (splitId: number) => void;
  removeSplit: (splitId: number) => void;
  getSettlementsForSplit: (splitId: number) => Settlement[];
}

export const useSplitStore = create<SplitState>((set, get) => ({
  splits: [],
  settlements: [],
  totalPending: 0,
  isLoading: false,

  loadSplits: () => {
    set({ isLoading: true });
    try {
      const splits = fetchAllSplits();
      set({ splits, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  loadSettlements: () => {
    set({ isLoading: true });
    try {
      const settlements = fetchAllSettlements();
      const totalPending = fetchTotalPending();
      set({ settlements, totalPending, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addSplit: (data: NewSplitExpense) => {
    insertSplitExpense(data);
    get().loadSplits();
    get().loadSettlements();
    // Refresh balance since payer share was added as a transaction
    useTransactionStore.getState().loadDashboardData();
  },

  paySettlement: (settlementId: number) => {
    markSettlementPaid(settlementId);
    get().loadSettlements();
  },

  payAllForSplit: (splitId: number) => {
    markAllPaidForSplit(splitId);
    get().loadSettlements();
    get().loadSplits();
  },

  removeSplit: (splitId: number) => {
    deleteSplitExpense(splitId);
    get().loadSplits();
    get().loadSettlements();
  },

  getSettlementsForSplit: (splitId: number): Settlement[] => {
    return fetchSettlementsForSplit(splitId);
  },
}));
