import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList, TabParamList } from './types';
import { TabBar } from './TabBar';
import { useTheme } from '@/hooks/useTheme';

// Screens
import { DashboardScreen }   from '@/features/dashboard/DashboardScreen';
import { HistoryScreen }     from '@/features/history/HistoryScreen';
import { AnalyticsScreen }   from '@/features/analytics/AnalyticsScreen';
import { ProfileScreen }     from '@/features/profile/ProfileScreen';
import { SplitExpenseScreen } from '@/features/split/SplitExpenseScreen';
import { SplitDetailScreen } from '@/features/split/SplitDetailScreen';
import { EditTransactionScreen } from '@/features/expense/EditTransactionScreen';
import { SearchScreen }      from '@/features/history/SearchScreen';

const Tab   = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TabNavigator: React.FC = () => (
  <Tab.Navigator
    tabBar={props => <TabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="History"   component={HistoryScreen} />
    <Tab.Screen name="AddExpense" component={DashboardScreen} />
    <Tab.Screen name="Analytics" component={AnalyticsScreen} />
    <Tab.Screen name="Profile"   component={ProfileScreen} />
  </Tab.Navigator>
);

export const AppNavigator: React.FC = () => {
  const { colors } = useTheme();

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: colors.accent,
          background: colors.background,
          card: colors.surface,
          text: colors.textPrimary,
          border: colors.border,
          notification: colors.accent,
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs"        component={TabNavigator} />
        <Stack.Screen name="SplitExpense"    component={SplitExpenseScreen}
          options={{ presentation: 'modal' }} />
        <Stack.Screen name="SplitDetail"     component={SplitDetailScreen}
          options={{ presentation: 'modal' }} />
        <Stack.Screen name="EditTransaction" component={EditTransactionScreen}
          options={{ presentation: 'modal' }} />
        <Stack.Screen name="Search"          component={SearchScreen}
          options={{ presentation: 'modal', animation: 'fade' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
