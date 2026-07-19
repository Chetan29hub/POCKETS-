import React, { forwardRef } from 'react';
import {
  TextInput, TextInputProps, View, StyleSheet, Pressable,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Text } from './Text';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { FontSize } from '@/theme/typography';
import type { LucideIcon } from 'lucide-react-native';

interface InputProps extends TextInputProps {
  label?: string;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  onRightIconPress?: () => void;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<TextInput, InputProps>(({
  label,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  onRightIconPress,
  error,
  hint,
  style,
  ...props
}, ref) => {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      )}

      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: error ? colors.expense : colors.border,
          },
        ]}
      >
        {LeftIcon && (
          <LeftIcon size={18} color={colors.textMuted} style={styles.leftIcon} />
        )}

        <TextInput
          ref={ref}
          style={[
            styles.input,
            { color: colors.textPrimary },
            LeftIcon  && { paddingLeft: Spacing.xs },
            RightIcon && { paddingRight: Spacing.xs },
            style,
          ]}
          placeholderTextColor={colors.textMuted}
          {...props}
        />

        {RightIcon && (
          <Pressable onPress={onRightIconPress} style={styles.rightIconBtn}>
            <RightIcon size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {error && <Text style={[styles.error, { color: colors.expense }]}>{error}</Text>}
      {hint && !error && <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text>}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginBottom: 2,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: FontSize.base,
    height: '100%',
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIconBtn: {
    padding: Spacing.xs,
  },
  error: {
    fontSize: FontSize.xs,
  },
  hint: {
    fontSize: FontSize.xs,
  },
});
