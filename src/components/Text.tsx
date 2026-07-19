import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { FontSize, FontWeight, LetterSpacing } from '@/theme/typography';

interface PocketTextProps extends TextProps {
  variant?: 'hero' | 'h1' | 'h2' | 'h3' | 'body' | 'bodyMd' | 'caption' | 'label' | 'mono';
  color?: string;
  muted?: boolean;
  secondary?: boolean;
  center?: boolean;
}

export const Text: React.FC<PocketTextProps> = ({
  variant = 'body',
  color,
  muted,
  secondary,
  center,
  style,
  ...props
}) => {
  const colors = useThemeStore(s => s.colors);

  const textColor = color
    ?? (muted ? colors.textMuted : secondary ? colors.textSecondary : colors.textPrimary);

  return (
    <RNText
      style={[styles[variant], { color: textColor }, center && { textAlign: 'center' }, style]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  hero:    { fontSize: FontSize['4xl'], fontWeight: FontWeight.bold,     letterSpacing: LetterSpacing.tight },
  h1:      { fontSize: FontSize['3xl'], fontWeight: FontWeight.bold,     letterSpacing: LetterSpacing.tight },
  h2:      { fontSize: FontSize['2xl'], fontWeight: FontWeight.semiBold, letterSpacing: LetterSpacing.tight },
  h3:      { fontSize: FontSize.xl,    fontWeight: FontWeight.semiBold  },
  body:    { fontSize: FontSize.base,  fontWeight: FontWeight.regular   },
  bodyMd:  { fontSize: FontSize.md,    fontWeight: FontWeight.regular   },
  caption: { fontSize: FontSize.xs,    fontWeight: FontWeight.regular,  letterSpacing: LetterSpacing.wide },
  label:   { fontSize: FontSize.sm,    fontWeight: FontWeight.medium,   letterSpacing: LetterSpacing.wide },
  mono:    { fontSize: FontSize.base,  fontFamily: 'monospace',         fontWeight: FontWeight.regular },
});
