import React from 'react';
import { View, ViewProps, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Shadow, Spacing } from '@/theme/spacing';

interface CardProps extends ViewProps {
  elevated?: boolean;
  onPress?: () => void;
  padding?: number;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  elevated,
  onPress,
  padding,
  noPadding,
  style,
  children,
  ...props
}) => {
  const { colors } = useTheme();

  const cardStyle = [
    styles.base,
    { backgroundColor: elevated ? colors.surfaceElevated : colors.surface },
    !noPadding && { padding: padding ?? Spacing.base },
    elevated ? Shadow.md : Shadow.sm,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && { opacity: 0.85 }]}
        {...(props as any)}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
});
