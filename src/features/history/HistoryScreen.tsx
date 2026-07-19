import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, StyleSheet, SectionList, Pressable,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search, Filter, X } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTransactionStore } from '@/store/useTransactionStore';
import {
  ScreenHeader, Text, TransactionItem,
  EmptyState, SegmentedControl, Card,
} from '@/components';
import { Spacing } from '@/theme/spacing';
import { FontSize, FontWeight } from '@/theme/typography';
import { groupLabel, todayStr, yesterdayStr, weekStartStr, monthStartStr, monthEndStr } from '@/utils/dateHelpers';
import type { Transaction } from '@/database/types';
import type { RootStackParamList } from '@/navigation/types';
import { History } from 'lucide-react-native';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Period = 'all' | 'today' | 'yesterday' | 'week' | 'month';

interface Section { title: string; data: Transaction[] }

const PERIOD_OPTIONS = [
  { label: 'All',   value: 'all'       },
  { label: 'Today', value: 'today'     },
  { label: 'Week',  value: 'week'      },
  { label: 'Month', value: 'month'     },
];

export const HistoryScreen: React.FC = () => {
  const { colors }   = useTheme();
  const navigation   = useNavigation<Nav>();
  const {
    filteredTransactions, loadAllTransactions,
    loadFilteredTransactions, removeTransaction,
    isLoading,
  } = useTransactionStore();

  const [period,     setPeriod]     = useState<Period>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadAllTransactions(); }, []);

  useEffect(() => {
    const today = todayStr();
    const yest  = yesterdayStr();
    const wk    = weekStartStr();
    const ms    = monthStartStr();
    const me    = monthEndStr();

    switch (period) {
      case 'today':     loadFilteredTransactions(today, today); break;
      case 'yesterday': loadFilteredTransactions(yest,  yest);  break;
      case 'week':      loadFilteredTransactions(wk, today);    break;
      case 'month':     loadFilteredTransactions(ms, me);       break;
      default:          loadAllTransactions();                   break;
    }
  }, [period]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    loadAllTransactions();
    setRefreshing(false);
  }, []);

  // Group transactions by date into sections
  const sections = useMemo((): Section[] => {
    const map = new Map<string, Transaction[]>();
    for (const tx of filteredTransactions) {
      const key = tx.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, data]) => ({ title: groupLabel(date), data }));
  }, [filteredTransactions]);

  const handleEdit   = (tx: Transaction) => navigation.navigate('EditTransaction', { transactionId: tx.id });
  const handleDelete = (id: number)      => removeTransaction(id);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="History"
        right={
          <Pressable onPress={() => navigation.navigate('Search')}
            style={[styles.headerBtn, { backgroundColor: colors.surfaceElevated }]}
          >
            <Search size={18} color={colors.textSecondary} />
          </Pressable>
        }
      />

      {/* Period filter */}
      <View style={[styles.filterBar, { backgroundColor: colors.background, borderBottomColor: colors.borderLight }]}>
        <SegmentedControl
          options={PERIOD_OPTIONS as any}
          value={period}
          onChange={v => setPeriod(v as Period)}
        />
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : sections.length === 0 ? (
        <EmptyState
          icon={History}
          title="No transactions"
          subtitle="Add your first expense using the + button"
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={tx => String(tx.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
                {section.title}
              </Text>
              <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
                {section.data.length} {section.data.length === 1 ? 'item' : 'items'}
              </Text>
            </View>
          )}
          renderItem={({ item, index, section }) => (
            <View style={{ backgroundColor: colors.surface }}>
              <TransactionItem
                transaction={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
                showDate={false}
              />
              {index < section.data.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.borderLight, marginLeft: 72 }]} />
              )}
            </View>
          )}
          stickySectionHeadersEnabled
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root:          { flex: 1 },
  filterBar:     { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, borderBottomWidth: 1 },
  loader:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                   paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  sectionTitle:  { fontSize: FontSize.sm, fontWeight: FontWeight.semiBold, textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionCount:  { fontSize: FontSize.xs },
  divider:       { height: StyleSheet.hairlineWidth },
  list:          { paddingBottom: 100 },
  headerBtn:     { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
