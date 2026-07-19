import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface DividerProps {
  style?: ViewStyle;
  inset?: number;
}

export const Divider: React.FC<DividerProps> = ({ style, inset = 0 }) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: colors.borderLight, marginLeft: inset },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    height: StyleSheet.hairlineWidth,
  },
});
