import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { CheckCircle2, Circle, Users, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useSplitStore } from '@/store/useSplitStore';
import { ScreenHeader, Text, Card, Button, Badge } from '@/components';
import { Spacing } from '@/theme/spacing';
import { FontSize, FontWeight } from '@/theme/typography';
import type { RootStackParamList } from '@/navigation/types';
import type { Settlement } from '@/database/types';

type Nav   = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'SplitDetail'>;

export const SplitDetailScreen: React.FC = () => {
  const { colors }   = useTheme();
  const navigation   = useNavigation<Nav>();
  const route        = useRoute<Route>();
  const { splitId }  = route.params;

  const { splits, paySettlement, payAllForSplit, removeSplit, getSettlementsForSplit } = useSplitStore();
  const split = splits.find(s => s.id === splitId);

  const [settlements, setSettlements] = useState<Settlement[]>([]);

  const refresh = () => setSettlements(getSettlementsForSplit(splitId));
  useEffect(() => { refresh(); }, [splitId]);

  const handleMarkPaid = (sId: number) => {
    paySettlement(sId);
    refresh();
  };

  const handleMarkAll = () => {
    payAllForSplit(splitId);
    refresh();
  };

  const handleDelete = () => {
    Alert.alert('Delete Split', 'This will remove the split and all related settlements.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => { removeSplit(splitId); navigation.goBack(); },
      },
    ]);
  };

  if (!split) return null;

  const pending = settlements.filter(s => s.status === 'pending');
  const paid    = settlements.filter(s => s.status === 'paid');
  const totalOwed = pending.reduce((s, p) => s + p.amount_owed, 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Split Detail"
        onBack={() => navigation.goBack()}
        right={
          <Pressable onPress={handleDelete} style={{ padding: Spacing.sm }}>
            <Trash2 size={18} color={colors.expense} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Summary card */}
        <Card elevated style={styles.summaryCard}>
          <Text style={[styles.splitName, { color: colors.textPrimary }]}>
            {split.description ?? 'Split Expense'}
          </Text>
          <Text style={[styles.splitDate, { color: colors.textMuted }]}>{split.date}</Text>

          <View style={styles.amtRow}>
            <View style={styles.amtBlock}>
              <Text style={[styles.amtVal, { color: colors.expense }]}>
                ₹{split.total_amount.toFixed(0)}
              </Text>
              <Text style={[styles.amtLbl, { color: colors.textMuted }]}>Total</Text>
            </View>
            <View style={[styles.amtDivider, { backgroundColor: colors.borderLight }]} />
            <View style={styles.amtBlock}>
              <Text style={[styles.amtVal, { color: colors.accent }]}>
                ₹{split.payer_share.toFixed(0)}
              </Text>
              <Text style={[styles.amtLbl, { color: colors.textMuted }]}>My Share</Text>
            </View>
            <View style={[styles.amtDivider, { backgroundColor: colors.borderLight }]} />
            <View style={styles.amtBlock}>
              <Text style={[styles.amtVal, { color: colors.income }]}>
                ₹{(split.total_amount - split.payer_share).toFixed(0)}
              </Text>
              <Text style={[styles.amtLbl, { color: colors.textMuted }]}>Owed to You</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <Badge label={`${split.num_members} members`} variant="accent" />
            <Badge label={split.split_mode} variant="default" />
            {pending.length > 0 && (
              <Badge label={`₹${totalOwed.toFixed(0)} pending`} variant="pending" />
            )}
          </View>
        </Card>

        {/* Pending settlements */}
        {pending.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PENDING</Text>
              <Pressable onPress={handleMarkAll}>
                <Text style={[styles.markAll, { color: colors.accent }]}>Mark all paid</Text>
              </Pressable>
            </View>
            {pending.map(s => (
              <SettlementRow key={s.id} settlement={s} onMarkPaid={() => handleMarkPaid(s.id)} />
            ))}
          </>
        )}

        {/* Paid settlements */}
        {paid.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SETTLED</Text>
            {paid.map(s => (
              <SettlementRow key={s.id} settlement={s} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

interface SettlementRowProps {
  settlement: Settlement;
  onMarkPaid?: () => void;
}

const SettlementRow: React.FC<SettlementRowProps> = ({ settlement: s, onMarkPaid }) => {
  const { colors } = useTheme();
  const isPaid = s.status === 'paid';

  return (
    <Card elevated style={styles.settlRow}>
      <View style={styles.settlLeft}>
        {isPaid
          ? <CheckCircle2 size={22} color={colors.income} />
          : <Circle size={22} color={colors.textMuted} />
        }
        <View>
          <Text style={[styles.settlName, { color: colors.textPrimary }]}>{s.member_name}</Text>
          {s.settled_at && (
            <Text style={[styles.settlAt, { color: colors.textMuted }]}>
              Paid {s.settled_at.slice(0, 10)}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.settlRight}>
        <Text style={[styles.settlAmt, { color: isPaid ? colors.income : colors.expense }]}>
          ₹{s.amount_owed.toFixed(2)}
        </Text>
        {!isPaid && onMarkPaid && (
          <Pressable
            onPress={onMarkPaid}
            style={[styles.paidBtn, { backgroundColor: colors.incomeDim }]}
          >
            <Text style={[styles.paidBtnText, { color: colors.income }]}>Mark Paid</Text>
          </Pressable>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  root:         { flex: 1 },
  content:      { padding: Spacing.base, gap: Spacing.sm, paddingBottom: 100 },
  summaryCard:  { gap: Spacing.sm },
  splitName:    { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  splitDate:    { fontSize: FontSize.sm },
  amtRow:       { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.sm },
  amtBlock:     { flex: 1, alignItems: 'center' },
  amtVal:       { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  amtLbl:       { fontSize: FontSize.xs, marginTop: 2 },
  amtDivider:   { width: 1, height: 40 },
  metaRow:      { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  sectionHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  sectionTitle: { fontSize: FontSize.xs, fontWeight: FontWeight.semiBold, textTransform: 'uppercase', letterSpacing: 0.8 },
  markAll:      { fontSize: FontSize.sm, fontWeight: FontWeight.semiBold },
  settlRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settlLeft:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  settlName:    { fontSize: FontSize.base, fontWeight: FontWeight.medium },
  settlAt:      { fontSize: FontSize.xs, marginTop: 2 },
  settlRight:   { alignItems: 'flex-end', gap: Spacing.xs },
  settlAmt:     { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  paidBtn:      { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: 99 },
  paidBtnText:  { fontSize: FontSize.xs, fontWeight: FontWeight.semiBold },
});
