import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Text } from './Text';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { FontSize, FontWeight } from '@/theme/typography';
import { getCategoryIcon } from '@/utils/categoryIcons';
import { fetchCategoriesByType } from '@/database/queries/categories';
import type { Category, TransactionType } from '@/database/types';

interface CategoryPickerProps {
  type: TransactionType;
  selected: number | null;
  onSelect: (category: Category) => void;
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  type, selected, onSelect,
}) => {
  const { colors } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    setCategories(fetchCategoriesByType(type));
  }, [type]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map(cat => {
        const Icon = getCategoryIcon(cat.icon);
        const isSelected = selected === cat.id;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(cat)}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? cat.color + '25' : colors.surfaceElevated,
                borderColor: isSelected ? cat.color : 'transparent',
                borderWidth: isSelected ? 1.5 : 1,
              },
            ]}
          >
            <Icon size={16} color={isSelected ? cat.color : colors.textSecondary} />
            <Text
              style={[
                styles.chipLabel,
                { color: isSelected ? cat.color : colors.textSecondary },
              ]}
            >
              {cat.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

// Full grid version for the add expense sheet
export const CategoryGrid: React.FC<CategoryPickerProps> = ({
  type, selected, onSelect,
}) => {
  const { colors } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    setCategories(fetchCategoriesByType(type));
  }, [type]);

  return (
    <View style={styles.grid}>
      {categories.map(cat => {
        const Icon = getCategoryIcon(cat.icon);
        const isSelected = selected === cat.id;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(cat)}
            style={[
              styles.gridItem,
              {
                backgroundColor: isSelected ? cat.color + '22' : colors.surfaceElevated,
                borderColor: isSelected ? cat.color : colors.border,
                borderWidth: isSelected ? 2 : 1,
              },
            ]}
          >
            <View style={[styles.gridIcon, { backgroundColor: cat.color + '22' }]}>
              <Icon size={22} color={cat.color} />
            </View>
            <Text
              style={[styles.gridLabel, { color: isSelected ? cat.color : colors.textSecondary }]}
              numberOfLines={1}
            >
              {cat.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  chipLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  gridItem: {
    width: '22%',
    aspectRatio: 0.85,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  gridIcon: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
  },
  gridLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },
});
