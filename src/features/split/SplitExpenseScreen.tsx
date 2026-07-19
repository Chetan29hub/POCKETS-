import React, { useState, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable,
  Alert, TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Plus, Trash2, Users, Equal, Sliders, Percent } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useSplitStore } from '@/store/useSplitStore';
import {
  ScreenHeader, Text, Button, Input, Card,
  SegmentedControl, CategoryGrid,
} from '@/components';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { FontSize, FontWeight } from '@/theme/typography';
import type { SplitMode, Category } from '@/database/types';
import type { RootStackParamList } from '@/navigation/types';
import { format } from 'date-fns';
import { fetchCategoriesByType } from '@/database/queries/categories';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface MemberEntry { name: string; amount: string }

const MODE_OPTS = [
  { label: 'Equal',   value: 'equal'      },
  { label: 'Custom',  value: 'custom'     },
  { label: 'By %',    value: 'percentage' },
];

export const SplitExpenseScreen: React.FC = () => {
  const { colors }  = useTheme();
  const navigation  = useNavigation<Nav>();
  const { addSplit, splits, loadSplits } = useSplitStore();

  const [tab,        setTab]      = useState<'new' | 'history'>('new');
  const [totalAmt,   setTotalAmt] = useState('');
  const [desc,       setDesc]     = useState('');
  const [category,   setCategory] = useState<Category | null>(null);
  const [splitMode,  setSplitMode] = useState<SplitMode>('equal');
  const [members,    setMembers]  = useState<MemberEntry[]>([
    { name: '', amount: '' },
    { name: '', amount: '' },
  ]);
  const [errors,     setErrors]   = useState<Record<string, string>>({});
  const [saving,     setSaving]   = useState(false);

  const total = parseFloat(totalAmt) || 0;
  const validMembers = members.filter(m => m.name.trim().length > 0);
  const numMembers   = validMembers.length;

  // Computed per-person shares
  const computedShares = useCallback((): number[] => {
    if (numMembers === 0) return [];
    switch (splitMode) {
      case 'equal':
        return validMembers.map(() => total / numMembers);
      case 'custom':
        return validMembers.map(m => parseFloat(m.amount) || 0);
      case 'percentage':
        return validMembers.map(m => (total * (parseFloat(m.amount) || 0)) / 100);
      default:
        return validMembers.map(() => 0);
    }
  }, [total, splitMode, validMembers, numMembers]);

  const sharesSum  = computedShares().reduce((a, b) => a + b, 0);
  const myShare    = numMembers > 0 ? computedShares()[0] ?? 0 : 0;

  const addMember = () =>
    setMembers(prev => [...prev, { name: '', amount: '' }]);

  const removeMember = (idx: number) =>
    setMembers(prev => prev.filter((_, i) => i !== idx));

  const updateMember = (idx: number, field: 'name' | 'amount', val: string) =>
    setMembers(prev => prev.map((m, i) => i === idx ? { ...m, [field]: val } : m));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!totalAmt || total <= 0) e.total = 'Enter a valid total amount';
    if (validMembers.length < 2)  e.members = 'Add at least 2 members (including yourself)';
    if (splitMode !== 'equal') {
      const sum = sharesSum;
      if (splitMode === 'percentage' && Math.abs(sum - 100) > 0.5)
        e.split = `Percentages must add up to 100 (currently ${sum.toFixed(1)})`;
      if (splitMode === 'custom' && Math.abs(sum - total) > 0.5)
        e.split = `Custom amounts must add up to ${total} (currently ${sum.toFixed(2)})`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);

    const shares = computedShares();
    const memberPayloads = validMembers.map((m, i) => ({
      name:        m.name.trim(),
      amount_owed: shares[i],
    }));

    // First member = payer (me); rest are people who owe
    const payerShare   = shares[0];
    const othersShares = memberPayloads.slice(1);

    addSplit({
      total_amount: total,
      payer_share:  payerShare,
      category_id:  category?.id ?? null,
      description:  desc.trim() || undefined,
      date:         format(new Date(), 'yyyy-MM-dd'),
      num_members:  numMembers,
      split_mode:   splitMode,
      members:      othersShares,          // only people who OWE (not payer)
    });

    setSaving(false);
    setTotalAmt('');
    setDesc('');
    setCategory(null);
    setMembers([{ name: '', amount: '' }, { name: '', amount: '' }]);
    setTab('history');
    loadSplits();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Split Expense" onBack={() => navigation.goBack()} />

      <SegmentedControl
        options={[{ label: 'New Split', value: 'new' }, { label: 'History', value: 'history' }]}
        value={tab}
        onChange={v => { setTab(v as 'new' | 'history'); if (v === 'history') loadSplits(); }}
      />
      <View style={{ height: Spacing.base }} />

      {tab === 'new' ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Total amount */}
          <Input
            label="Total Amount (₹)"
            value={totalAmt}
            onChangeText={t => { setTotalAmt(t.replace(/[^0-9.]/g, '')); setErrors(e => ({ ...e, total: '' })); }}
            keyboardType="decimal-pad"
            placeholder="0"
            error={errors.total}
          />

          <Input
            label="Description (optional)"
            value={desc}
            onChangeText={setDesc}
            placeholder="Dinner, trip, etc."
          />

          {/* Category */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
          <CategoryGrid
            type="expense"
            selected={category?.id ?? null}
            onSelect={setCategory}
          />

          {/* Split mode */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Split Mode</Text>
          <SegmentedControl
            options={MODE_OPTS as any}
            value={splitMode}
            onChange={v => setSplitMode(v as SplitMode)}
          />

          {/* Members */}
          <View style={styles.membersHeader}>
            <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 0 }]}>
              Members ({validMembers.length})
            </Text>
            <Pressable onPress={addMember} style={[styles.addMemberBtn, { backgroundColor: colors.accentDim }]}>
              <Plus size={16} color={colors.accent} />
              <Text style={[styles.addMemberText, { color: colors.accent }]}>Add</Text>
            </Pressable>
          </View>
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            First member = You (the payer). Others owe you.
          </Text>

          {members.map((m, idx) => (
            <View key={idx} style={styles.memberRow}>
              <View style={[styles.memberIndex, { backgroundColor: idx === 0 ? colors.accent : colors.surfaceElevated }]}>
                <Text style={[styles.memberIndexText, { color: idx === 0 ? '#fff' : colors.textMuted }]}>
                  {idx === 0 ? 'Me' : idx + 1}
                </Text>
              </View>
              <TextInput
                value={m.name}
                onChangeText={v => updateMember(idx, 'name', v)}
                placeholder={idx === 0 ? 'Your name' : `Person ${idx + 1}`}
                placeholderTextColor={colors.textMuted}
                style={[styles.memberNameInput, {
                  color: colors.textPrimary,
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                }]}
              />
              {splitMode !== 'equal' && (
                <TextInput
                  value={m.amount}
                  onChangeText={v => updateMember(idx, 'amount', v.replace(/[^0-9.]/g, ''))}
                  placeholder={splitMode === 'percentage' ? '%' : '₹'}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  style={[styles.memberAmtInput, {
                    color: colors.textPrimary,
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  }]}
                />
              )}
              {members.length > 2 && idx > 0 && (
                <Pressable onPress={() => removeMember(idx)} style={styles.removeBtn}>
                  <Trash2 size={16} color={colors.expense} />
                </Pressable>
              )}
            </View>
          ))}
          {errors.members && <Text style={[styles.error, { color: colors.expense }]}>{errors.members}</Text>}
          {errors.split   && <Text style={[styles.error, { color: colors.expense }]}>{errors.split}</Text>}

          {/* Preview */}
          {total > 0 && numMembers > 0 && (
            <Card elevated style={[styles.preview, { borderColor: colors.accentDim }]}>
              <Text style={[styles.previewTitle, { color: colors.accent }]}>Split Preview</Text>
              <View style={styles.previewRow}>
                <Text style={{ color: colors.textSecondary }}>Your share (recorded as expense):</Text>
                <Text style={[styles.previewAmt, { color: colors.expense }]}>
                  ₹{myShare.toFixed(2)}
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={{ color: colors.textSecondary }}>Others owe you:</Text>
                <Text style={[styles.previewAmt, { color: colors.income }]}>
                  ₹{(total - myShare).toFixed(2)}
                </Text>
              </View>
              {splitMode !== 'equal' && (
                <View style={styles.previewRow}>
                  <Text style={{ color: colors.textMuted }}>Sum of all shares:</Text>
                  <Text style={{ color: Math.abs(sharesSum - (splitMode === 'percentage' ? 100 : total)) < 0.5 ? colors.income : colors.expense }}>
                    {splitMode === 'percentage' ? `${sharesSum.toFixed(1)}%` : `₹${sharesSum.toFixed(2)}`}
                  </Text>
                </View>
              )}
            </Card>
          )}

          <Button
            label={saving ? 'Saving…' : 'Save Split'}
            onPress={handleSave}
            fullWidth size="lg"
            loading={saving}
            icon={<Users size={18} color="#fff" />}
          />
        </ScrollView>
      ) : (
        <SplitHistory />
      )}
    </View>
  );
};

// ── Split history sub-component ────────────────────────────────────────────
const SplitHistory: React.FC = () => {
  const { colors }   = useTheme();
  const navigation   = useNavigation<Nav>();
  const { splits }   = useSplitStore();

  if (splits.length === 0) {
    return (
      <View style={styles.emptyHistory}>
        <Users size={40} color={colors.textMuted} />
        <Text secondary center>No splits yet.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {splits.map(split => (
        <Pressable
          key={split.id}
          onPress={() => navigation.navigate('SplitDetail', { splitId: split.id })}
        >
          <Card elevated style={styles.splitCard}>
            <View style={styles.splitCardRow}>
              <View>
                <Text style={[styles.splitDesc, { color: colors.textPrimary }]}>
                  {split.description ?? 'Split expense'}
                </Text>
                <Text style={[styles.splitDate, { color: colors.textMuted }]}>{split.date}</Text>
              </View>
              <View style={styles.splitAmts}>
                <Text style={[styles.splitTotal, { color: colors.expense }]}>
                  ₹{split.total_amount.toFixed(0)}
                </Text>
                <Text style={[styles.splitShare, { color: colors.textMuted }]}>
                  My share: ₹{split.payer_share.toFixed(0)}
                </Text>
              </View>
            </View>
            <Text style={[styles.splitMembers, { color: colors.textMuted }]}>
              {split.num_members} members · {split.split_mode}
            </Text>
          </Card>
        </Pressable>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root:            { flex: 1 },
  content:         { padding: Spacing.base, gap: Spacing.md, paddingBottom: 100 },
  label:           { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginBottom: Spacing.sm, marginTop: Spacing.xs },
  hint:            { fontSize: FontSize.xs, marginBottom: Spacing.sm, marginTop: -Spacing.xs },
  membersHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xs },
  addMemberBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: BorderRadius.full },
  addMemberText:   { fontSize: FontSize.sm, fontWeight: FontWeight.semiBold },
  memberRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  memberIndex:     { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  memberIndexText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  memberNameInput: { flex: 1, height: 44, borderRadius: BorderRadius.md, borderWidth: 1, paddingHorizontal: Spacing.md, fontSize: FontSize.base },
  memberAmtInput:  { width: 64, height: 44, borderRadius: BorderRadius.md, borderWidth: 1, paddingHorizontal: Spacing.sm, fontSize: FontSize.base, textAlign: 'center' },
  removeBtn:       { padding: Spacing.sm },
  error:           { fontSize: FontSize.xs, marginTop: -Spacing.xs },
  preview:         { gap: Spacing.sm, borderWidth: 1 },
  previewTitle:    { fontSize: FontSize.sm, fontWeight: FontWeight.semiBold, textTransform: 'uppercase', letterSpacing: 0.8 },
  previewRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewAmt:      { fontWeight: FontWeight.bold },
  emptyHistory:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  splitCard:       { gap: Spacing.xs },
  splitCardRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  splitDesc:       { fontSize: FontSize.base, fontWeight: FontWeight.semiBold },
  splitDate:       { fontSize: FontSize.xs, marginTop: 2 },
  splitAmts:       { alignItems: 'flex-end' },
  splitTotal:      { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  splitShare:      { fontSize: FontSize.xs, marginTop: 2 },
  splitMembers:    { fontSize: FontSize.xs },
});
