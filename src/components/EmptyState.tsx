import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Text } from './Text';
import { Button } from './Button';
import { Spacing } from '@/theme/spacing';
import type { LucideIcon } from 'lucide-react-native';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surfaceElevated }]}>
        <Icon size={36} color={colors.textMuted} />
      </View>
      <Text variant="h3" center style={{ color: colors.textPrimary }}>{title}</Text>
      {subtitle && (
        <Text center secondary style={styles.subtitle}>{subtitle}</Text>
      )}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} variant="secondary" style={styles.btn} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing['2xl'],
    marginTop: Spacing['3xl'],
  },
  iconWrap: {
    padding: Spacing.xl,
    borderRadius: 999,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: {
    marginTop: Spacing.sm,
  },
});
