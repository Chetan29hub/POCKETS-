import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, StyleSheet, FlatList, TextInput,
  Pressable, Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X, Search } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTransactionStore } from '@/store/useTransactionStore';
import { Text, TransactionItem, EmptyState } from '@/components';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { FontSize } from '@/theme/typography';
import type { RootStackParamList } from '@/navigation/types';
import type { Transaction } from '@/database/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const SearchScreen: React.FC = () => {
  const { colors }   = useTheme();
  const navigation   = useNavigation<Nav>();
  const insets       = useSafeAreaInsets();
  const inputRef     = useRef<TextInput>(null);

  const { filteredTransactions, setSearchQuery, searchQuery, removeTransaction } = useTransactionStore();

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleClear = useCallback(() => {
    setSearchQuery('');
    inputRef.current?.clear();
    inputRef.current?.focus();
  }, []);

  const handleEdit = (tx: Transaction) => {
    Keyboard.dismiss();
    navigation.navigate('EditTransaction', { transactionId: tx.id });
  };

  const showResults = searchQuery.trim().length > 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <View style={[styles.inputRow, { backgroundColor: colors.surfaceElevated }]}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            ref={inputRef}
            value={searchQuery}
            onChangeText={handleChange}
            placeholder="Search transactions…"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.textPrimary }]}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={handleClear} hitSlop={8}>
              <X size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
        <Pressable onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={[styles.cancelText, { color: colors.accent }]}>Cancel</Text>
        </Pressable>
      </View>

      {/* Results */}
      {!showResults ? (
        <View style={styles.hint}>
          <Text secondary center style={{ fontSize: FontSize.base }}>
            Search by category, description, amount, or date
          </Text>
        </View>
      ) : filteredTransactions.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No results"
          subtitle={`Nothing matched "${searchQuery}"`}
        />
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={tx => String(tx.id)}
          renderItem={({ item, index }) => (
            <View style={{ backgroundColor: colors.surface }}>
              <TransactionItem
                transaction={item}
                onEdit={handleEdit}
                onDelete={removeTransaction}
                showDate
              />
              {index < filteredTransactions.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.borderLight, marginLeft: 72 }]} />
              )}
            </View>
          )}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              <Text style={[styles.resultsCount, { color: colors.textMuted }]}>
                {filteredTransactions.length} result{filteredTransactions.length !== 1 ? 's' : ''}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root:          { flex: 1 },
  searchBar:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
                   padding: Spacing.base, borderBottomWidth: 1 },
  inputRow:      { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
                   borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, height: 44 },
  input:         { flex: 1, fontSize: FontSize.base, padding: 0 },
  cancelBtn:     { paddingVertical: Spacing.sm },
  cancelText:    { fontSize: FontSize.base, fontWeight: '600' },
  hint:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['2xl'] },
  resultsHeader: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  resultsCount:  { fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600' },
  divider:       { height: StyleSheet.hairlineWidth },
  list:          { paddingBottom: 40 },
});
