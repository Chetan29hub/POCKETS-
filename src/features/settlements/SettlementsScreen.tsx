import React, { useEffect } from 'react';
import { View, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CheckCircle2, Circle } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useSplitStore } from '@/store/useSplitStore';
import { useCurrency } from '@/hooks/useCurrency';
import { ScreenHeader, Text, Card, Badge, EmptyState } from '@/components';
import { Spacing } from '@/theme/spacing';
import { FontSize, FontWeight } from '@/theme/typography';
import type { Settlement } from '@/database/types';
import type { RootStackParamList } from '@/navigation/types';
import { Users } from 'lucide-react-native';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const SettlementsScreen: React.FC = () => {
  const { colors } = useTheme();
  const { format } = useCurrency();
  const navigation = useNavigation<Nav>();
  const { settlements, totalPending, loadSettlements, paySettlement, isLoading } = useSplitStore();

  useEffect(() => { loadSettlements(); }, []);

  const pending = settlements.filter(s => s.status === 'pending');
  const paid    = settlements.filter(s => s.status === 'paid');

  const handleMarkPaid = (id: number) => { paySettlement(id); };

  const renderItem = ({ item }: { item: Settlement }) => {
    const isPaid = item.status === 'paid';
    return (
      <Card elevated style={styles.row}>
        <View style={styles.left}>
          <Pressable onPress={() => !isPaid && handleMarkPaid(item.id)}>
            {isPaid
              ? <CheckCircle2 size={24} color={colors.income} />
              : <Circle size={24} color={colors.textMuted} />
            }
          </Pressable>
          <View style={styles.details}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>{item.member_name}</Text>
            <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
              {item.split_description ?? 'Split expense'} · {item.split_date}
            </Text>
          </View>
        </View>
        <View style={styles.right}>
          <Text style={[styles.amount, { color: isPaid ? colors.income : colors.expense }]}>
            {format(item.amount_owed)}
          </Text>
          <Badge label={item.status} variant={isPaid ? 'paid' : 'pending'} />
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Settlements"
        subtitle={totalPending > 0 ? `${format(totalPending)} pending` : 'All settled up'}
      />

      {settlements.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No settlements"
          subtitle="Add a split expense to track who owes you"
        />
      ) : (
        <FlatList
          data={[...pending, ...paid]}
          keyExtractor={s => String(s.id)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadSettlements} tintColor={colors.accent} />
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            pending.length > 0 ? (
              <Card style={[styles.pendingBanner, { backgroundColor: colors.savingsDim }]}>
                <Text style={[styles.pendingText, { color: colors.savings }]}>
                  {format(totalPending)} owed to you across {pending.length} settlement{pending.length !== 1 ? 's' : ''}
                </Text>
              </Card>
            ) : (
              <Card style={[styles.pendingBanner, { backgroundColor: colors.incomeDim }]}>
                <Text style={[styles.pendingText, { color: colors.income }]}>
                  All settled up 🎉
                </Text>
              </Card>
            )
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root:          { flex: 1 },
  list:          { padding: Spacing.base, gap: Spacing.sm, paddingBottom: 100 },
  pendingBanner: { marginBottom: Spacing.sm },
  pendingText:   { fontSize: FontSize.base, fontWeight: FontWeight.semiBold },
  row:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left:          { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  details:       { flex: 1 },
  name:          { fontSize: FontSize.base, fontWeight: FontWeight.medium },
  meta:          { fontSize: FontSize.xs, marginTop: 2 },
  right:         { alignItems: 'flex-end', gap: Spacing.xs },
  amount:        { fontSize: FontSize.md, fontWeight: FontWeight.bold },
});
