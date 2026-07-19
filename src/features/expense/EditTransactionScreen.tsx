import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { format } from 'date-fns';
import { Check, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTransactionStore } from '@/store/useTransactionStore';
import {
  ScreenHeader, Text, Button, Input,
  SegmentedControl, CategoryGrid, Card,
} from '@/components';
import { Spacing } from '@/theme/spacing';
import { fetchTransactionById } from '@/database/queries/transactions';
import { fetchCategoryById } from '@/database/queries/categories';
import type { TransactionType, PaymentMethod, Category } from '@/database/types';
import type { RootStackParamList } from '@/navigation/types';

type Nav   = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'EditTransaction'>;

const PAYMENT_METHODS: { label: string; value: PaymentMethod }[] = [
  { label: 'Cash', value: 'cash' },
  { label: 'UPI',  value: 'upi' },
  { label: 'Card', value: 'card' },
  { label: 'Bank', value: 'bank_transfer' },
];

export const EditTransactionScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const { transactionId } = route.params;

  const { editTransaction, removeTransaction } = useTransactionStore();

  const [txType,    setTxType]    = useState<TransactionType>('expense');
  const [amount,    setAmount]    = useState('');
  const [category,  setCategory]  = useState<Category | null>(null);
  const [desc,      setDesc]      = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [dateStr,   setDateStr]   = useState('');
  const [timeStr,   setTimeStr]   = useState('');
  const [errors,    setErrors]    = useState<Record<string, string>>({});

  useEffect(() => {
    const tx = fetchTransactionById(transactionId);
    if (!tx) { navigation.goBack(); return; }
    setTxType(tx.type);
    setAmount(String(tx.amount));
    setDesc(tx.description ?? '');
    setPayMethod(tx.payment_method as PaymentMethod);
    setDateStr(tx.date);
    setTimeStr(tx.time);
    if (tx.category_id) {
      const cat = fetchCategoryById(tx.category_id);
      if (cat) setCategory(cat);
    }
  }, [transactionId]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) e.amount = 'Enter a valid amount';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    editTransaction(transactionId, {
      type:           txType,
      amount:         parseFloat(amount),
      category_id:    category?.id ?? null,
      description:    desc.trim() || undefined,
      date:           dateStr,
      time:           timeStr,
      payment_method: payMethod,
    });
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert('Delete Transaction', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => { removeTransaction(transactionId); navigation.goBack(); },
      },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Edit Transaction" onBack={() => navigation.goBack()}
        right={
          <Button label="" onPress={handleDelete} variant="ghost"
            icon={<Trash2 size={20} color={colors.expense} />}
            style={{ paddingHorizontal: 0 }}
          />
        }
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SegmentedControl
          options={[{ label: 'Expense', value: 'expense' }, { label: 'Income', value: 'income' }]}
          value={txType}
          onChange={v => { setTxType(v as TransactionType); setCategory(null); }}
        />
        <View style={styles.gap} />
        <Input label="Amount (₹)" value={amount}
          onChangeText={t => setAmount(t.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad" placeholder="0" error={errors.amount}
        />
        <View style={styles.gap} />
        <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
        <CategoryGrid type={txType} selected={category?.id ?? null}
          onSelect={cat => setCategory(cat)}
        />
        <View style={styles.gap} />
        <Input label="Description (optional)" value={desc} onChangeText={setDesc} placeholder="What was this?" />
        <View style={styles.gap} />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Input label="Date" value={dateStr} onChangeText={setDateStr} placeholder="YYYY-MM-DD" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Time" value={timeStr} onChangeText={setTimeStr} placeholder="HH:MM" />
          </View>
        </View>
        <View style={styles.gap} />
        <Button label="Save Changes" onPress={handleSave} fullWidth size="lg"
          icon={<Check size={18} color="#fff" />}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root:    { flex: 1 },
  content: { padding: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing['4xl'] },
  gap:     { height: Spacing.sm },
  label:   { fontSize: 13, fontWeight: '500', marginBottom: Spacing.sm },
  row:     { flexDirection: 'row', gap: Spacing.sm },
});
