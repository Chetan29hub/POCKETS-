import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Text } from './Text';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { FontSize, FontWeight } from '@/theme/typography';

type BadgeVariant = 'default' | 'income' | 'expense' | 'pending' | 'paid' | 'accent';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default' }) => {
  const { colors } = useTheme();

  const config: Record<BadgeVariant, { bg: string; text: string }> = {
    default:  { bg: colors.surfaceElevated, text: colors.textSecondary },
    income:   { bg: colors.incomeDim,       text: colors.income },
    expense:  { bg: colors.expenseDim,      text: colors.expense },
    pending:  { bg: colors.savingsDim,      text: colors.savings },
    paid:     { bg: colors.incomeDim,       text: colors.income },
    accent:   { bg: colors.accentDim,       text: colors.accent },
  };

  const { bg, text } = config[variant];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
