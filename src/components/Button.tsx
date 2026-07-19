import React from 'react';
import {
  Pressable, ActivityIndicator, StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Text } from './Text';
import { BorderRadius, Shadow, Spacing } from '@/theme/spacing';
import { FontSize, FontWeight } from '@/theme/typography';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'income';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  fullWidth,
  icon,
  style,
  textStyle,
}) => {
  const { colors } = useTheme();

  const bg: Record<Variant, string> = {
    primary:   colors.accent,
    secondary: colors.surfaceElevated,
    ghost:     'transparent',
    danger:    colors.expense,
    income:    colors.income,
  };

  const textColor: Record<Variant, string> = {
    primary:   '#FFFFFF',
    secondary: colors.textPrimary,
    ghost:     colors.accent,
    danger:    '#FFFFFF',
    income:    '#FFFFFF',
  };

  const heights: Record<string, number> = { sm: 36, md: 48, lg: 56 };
  const fontSizes: Record<string, number> = { sm: FontSize.sm, md: FontSize.base, lg: FontSize.md };

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg[variant],
          height: heights[size],
          opacity: isDisabled ? 0.5 : pressed ? 0.88 : 1,
        },
        fullWidth && styles.fullWidth,
        variant === 'primary' && Shadow.accent,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor[variant]} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.label,
              { color: textColor[variant], fontSize: fontSizes[size] },
              textStyle,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    fontWeight: FontWeight.semiBold,
  },
});
