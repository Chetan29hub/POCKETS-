import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { Text } from './Text';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { FontSize, FontWeight } from '@/theme/typography';

interface Option<T extends string> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  const selectedIndex = options.findIndex(o => o.value === value);

  const width = 100 / options.length;
  const thumbLeft = useSharedValue(selectedIndex * width);

  const thumbStyle = useAnimatedStyle(() => ({
    left: `${thumbLeft.value}%`,
    width: `${width}%`,
  }));

  const handlePress = (opt: Option<T>, idx: number) => {
    thumbLeft.value = withTiming(idx * width, { duration: 200 });
    onChange(opt.value);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <Animated.View
        style={[styles.thumb, { backgroundColor: colors.surface }, thumbStyle]}
      />
      {options.map((opt, idx) => (
        <Pressable
          key={opt.value}
          style={styles.option}
          onPress={() => handlePress(opt, idx)}
        >
          <Text
            style={[
              styles.label,
              { color: value === opt.value ? colors.textPrimary : colors.textMuted },
            ]}
          >
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: 3,
    position: 'relative',
    height: 40,
  },
  thumb: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    borderRadius: BorderRadius.sm,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
  },
});
