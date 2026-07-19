import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, TextInput, Pressable, Switch, ScrollView } from 'react-native';
import { format } from 'date-fns';
import { DollarSign, FileText, Calendar, Clock, CreditCard, Check } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTransactionStore } from '@/store/useTransactionStore';
import { BottomSheet, Text, Button, Input, SegmentedControl, CategoryGrid } from '@/components';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { FontSize, FontWeight } from '@/theme/typography';
import type { PaymentMethod, Category } from '@/database/types';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface AddIncomeSheetProps {
  visible: boolean;
  onClose: () => void;
}

const PAYMENT_METHODS: { label: string; value: PaymentMethod }[] = [
  { label: 'Cash', value: 'cash' },
  { label: 'UPI', value: 'upi' },
  { label: 'Card', value: 'card' },
  { label: 'Bank', value: 'bank_transfer' },
];

export const AddIncomeSheet: React.FC<AddIncomeSheetProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const { addTransaction } = useTransactionStore();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category | null>(null);
  const [desc, setDesc] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [customDate, setCustomDate] = useState(false);
  const [dateStr, setDateStr] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [timeStr, setTimeStr] = useState(format(new Date(), 'HH:mm'));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const amountRef = useRef<TextInput>(null);

  const successScale = useSharedValue(0);
  const successStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successScale.value,
  }));

  const resetForm = useCallback(() => {
    setAmount('');
    setCategory(null);
    setDesc('');
    setPayMethod('cash');
    setCustomDate(false);
    setDateStr(format(new Date(), 'yyyy-MM-dd'));
    setTimeStr(format(new Date(), 'HH:mm'));
    setErrors({});
  }, []);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      e.amount = 'Enter a valid amount greater than 0';
    }
    if (customDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) e.date = 'Use YYYY-MM-DD format';
      if (!/^\d{2}:\d{2}$/.test(timeStr)) e.time = 'Use HH:MM format';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = useCallback(() => {
    if (!validate()) return;
    setSaving(true);
    const now = new Date();
    addTransaction({
      type: 'income',
      amount: parseFloat(amount),
      category_id: category?.id ?? null,
      description: desc.trim() || undefined,
      date: customDate ? dateStr : format(now, 'yyyy-MM-dd'),
      time: customDate ? timeStr : format(now, 'HH:mm'),
      payment_method: payMethod,
    });
    successScale.value = withSpring(1, { damping: 10 }, () => {
      successScale.value = withSpring(0, { damping: 10 });
    });
    setSaving(false);
    resetForm();
    onClose();
  }, [amount, category, desc, payMethod, customDate, dateStr, timeStr, onClose, resetForm, addTransaction]);

  return (
    <BottomSheet
      visible={visible}
      onClose={() => { resetForm(); onClose(); }}
      title="Add Money"
    >
      <Input
        label="Amount"
        value={amount}
        onChangeText={t => { setAmount(t.replace(/[^0-9.]/g, '')); setErrors(e => ({ ...e, amount: '' })); }}
        placeholder="0"
        keyboardType="decimal-pad"
        leftIcon={DollarSign}
        error={errors.amount}
        ref={amountRef}
      />
      <View style={styles.gap} />
      <Input
        label="Description (optional)"
        value={desc}
        onChangeText={setDesc}
        placeholder="Salary, refund, gift..."
        leftIcon={FileText}
      />
      <View style={styles.gap} />
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Category</Text>
      <CategoryGrid
        type="income"
        selected={category?.id ?? null}
        onSelect={cat => setCategory(cat)}
      />
      <View style={styles.gap} />
      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Payment Method</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.payRow}>
        {PAYMENT_METHODS.map(pm => {
          const active = payMethod === pm.value;
          return (
            <Pressable
              key={pm.value}
              onPress={() => setPayMethod(pm.value)}
              style={[
                styles.payChip,
                {
                  backgroundColor: active ? colors.accent + '22' : colors.surfaceElevated,
                  borderColor: active ? colors.accent : 'transparent',
                  borderWidth: active ? 1.5 : 1,
                },
              ]}
            >
              <CreditCard size={14} color={active ? colors.accent : colors.textMuted} />
              <Text style={[styles.payLabel, { color: active ? colors.accent : colors.textSecondary }]}>{pm.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.gap} />
      <View style={styles.dateToggleRow}>
        <View style={styles.dateToggleLeft}>
          <Calendar size={16} color={colors.textMuted} />
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginBottom: 0 }]}>Custom date & time</Text>
        </View>
        <Switch
          value={customDate}
          onValueChange={setCustomDate}
          trackColor={{ false: colors.border, true: colors.accent + '66' }}
          thumbColor={customDate ? colors.accent : colors.textMuted}
        />
      </View>
      {customDate && (
        <View style={styles.dateRow}>
          <Input
            label="Date (YYYY-MM-DD)"
            value={dateStr}
            onChangeText={v => { setDateStr(v); setErrors(e => ({ ...e, date: '' })); }}
            placeholder="2024-01-15"
            leftIcon={Calendar}
            error={errors.date}
            style={{ flex: 1 }}
          />
          <Input
            label="Time (HH:MM)"
            value={timeStr}
            onChangeText={v => { setTimeStr(v); setErrors(e => ({ ...e, time: '' })); }}
            placeholder="14:30"
            leftIcon={Clock}
            error={errors.time}
            style={{ flex: 1 }}
          />
        </View>
      )}
      <View style={styles.gap} />
      <Button
        label={saving ? 'Saving…' : 'Add Income'}
        onPress={handleSave}
        variant="income"
        loading={saving}
        fullWidth
        size="lg"
        icon={<Check size={18} color="#fff" />}
      />
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  gap: { height: Spacing.base },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.base,
    height: 72,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    marginRight: Spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: 40,
    fontWeight: FontWeight.bold,
    letterSpacing: -1,
    padding: 0,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: FontSize.xs,
    marginTop: 4,
  },
  payRow: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  payChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  payLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  dateToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
});