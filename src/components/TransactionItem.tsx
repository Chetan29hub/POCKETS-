import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Trash2, Pencil } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useCurrency } from '@/hooks/useCurrency';
import { Text } from './Text';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { FontSize, FontWeight } from '@/theme/typography';
import { getCategoryIcon } from '@/utils/categoryIcons';
import { formatTime } from '@/utils/dateHelpers';
import type { Transaction } from '@/database/types';

interface TransactionItemProps {
  transaction: Transaction;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (id: number) => void;
  showDate?: boolean;
}

const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH    = 72;

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction: tx,
  onEdit,
  onDelete,
  showDate = false,
}) => {
  const { colors } = useTheme();
  const { format }  = useCurrency();

  const translateX = useSharedValue(0);
  const Icon = getCategoryIcon(tx.category_icon ?? 'MoreHorizontal');
  const isExpense = tx.type === 'expense';
  const amountColor = isExpense ? colors.expense : colors.income;

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      const clamped = Math.min(0, Math.max(-ACTION_WIDTH * 2 - 8, e.translationX));
      translateX.value = clamped;
    })
    .onEnd((e) => {
      if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-ACTION_WIDTH * 2 - 8);
      } else {
        translateX.value = withTiming(0);
      }
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleDelete = useCallback(() => {
    translateX.value = withTiming(0);
    onDelete?.(tx.id);
  }, [tx.id, onDelete]);

  const handleEdit = useCallback(() => {
    translateX.value = withTiming(0);
    onEdit?.(tx);
  }, [tx, onEdit]);

  return (
    <View style={styles.wrapper}>
      {/* Action buttons (behind the row) */}
      <View style={styles.actions}>
        <Pressable
          onPress={handleEdit}
          style={[styles.actionBtn, { backgroundColor: colors.info, width: ACTION_WIDTH }]}
        >
          <Pencil size={18} color="#fff" />
        </Pressable>
        <Pressable
          onPress={handleDelete}
          style={[styles.actionBtn, { backgroundColor: colors.expense, width: ACTION_WIDTH }]}
        >
          <Trash2 size={18} color="#fff" />
        </Pressable>
      </View>

      {/* Main row */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[styles.row, { backgroundColor: colors.surface }, animStyle]}
        >
          {/* Category icon */}
          <View style={[styles.iconWrap, { backgroundColor: (tx.category_color ?? '#6B7280') + '22' }]}>
            <Icon size={20} color={tx.category_color ?? '#6B7280'} />
          </View>

          {/* Details */}
          <View style={styles.details}>
            <Text style={styles.categoryText}>{tx.category_name ?? 'Other'}</Text>
            {tx.description ? (
              <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={1}>
                {tx.description}
              </Text>
            ) : null}
            {showDate && (
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                {tx.date} · {formatTime(tx.time)}
              </Text>
            )}
            {!showDate && (
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                {formatTime(tx.time)} · {tx.payment_method}
              </Text>
            )}
          </View>

          {/* Amount */}
          <Text style={[styles.amount, { color: amountColor }]}>
            {isExpense ? '-' : '+'}{format(tx.amount)}
          </Text>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: 2,
  },
  actions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  actionBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
    gap: 2,
  },
  categoryText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
  },
  desc: {
    fontSize: FontSize.sm,
  },
  meta: {
    fontSize: FontSize.xs,
  },
  amount: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semiBold,
  },
});
