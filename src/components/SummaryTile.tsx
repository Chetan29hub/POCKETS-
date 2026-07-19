import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useCurrency } from '@/hooks/useCurrency';
import { Text } from './Text';
import { Card } from './Card';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { FontSize, FontWeight } from '@/theme/typography';
import type { LucideIcon } from 'lucide-react-native';

interface SummaryTileProps {
  label: string;
  amount: number;
  icon: LucideIcon;
  color: string;
  small?: boolean;
}

export const SummaryTile: React.FC<SummaryTileProps> = ({
  label, amount, icon: Icon, color, small,
}) => {
  const { colors } = useTheme();
  const { format } = useCurrency();

  return (
    <Card style={[styles.tile, small && styles.small]} elevated>
      <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
        <Icon size={small ? 16 : 18} color={color} />
      </View>
      <Text style={[styles.amount, { color: colors.textPrimary }]} numberOfLines={1}>
        {format(amount)}
      </Text>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    gap: Spacing.xs,
    alignItems: 'flex-start',
  },
  small: {
    paddingVertical: Spacing.sm,
  },
  iconWrap: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  amount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.3,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
