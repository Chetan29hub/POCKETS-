import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  SplitExpense: undefined;
  SplitDetail: { splitId: number };
  EditTransaction: { transactionId: number };
  Search: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  History: undefined;
  AddExpense: undefined;   // intercept — opens bottom sheet, never renders a screen
  Analytics: undefined;
  Profile: undefined;
};
