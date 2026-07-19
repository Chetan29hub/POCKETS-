import React, { useEffect, useRef, useCallback } from 'react';
import {
  Modal, View, StyleSheet, Pressable, Dimensions,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing } from '@/theme/spacing';
import { Text } from './Text';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[];    // heights in px; default [0.55 * SCREEN_HEIGHT]
  scrollable?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
  snapPoints,
  scrollable = true,
}) => {
  const { colors } = useTheme();
  const sheetHeight = snapPoints?.[0] ?? SCREEN_HEIGHT * 0.75;

  const translateY = useSharedValue(sheetHeight);
  const overlayOpacity = useSharedValue(0);

  const open = useCallback(() => {
    overlayOpacity.value = withTiming(1, { duration: 250 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
  }, []);

  const close = useCallback(() => {
    overlayOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withSpring(sheetHeight, { damping: 20, stiffness: 200 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  }, [onClose, sheetHeight]);

  useEffect(() => {
    if (visible) open();
    else {
      overlayOpacity.value = withTiming(0, { duration: 200 });
      translateY.value = withSpring(sheetHeight, { damping: 20, stiffness: 200 });
    }
  }, [visible]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > sheetHeight * 0.3 || e.velocityY > 800) {
        runOnJS(close)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal transparent statusBarTranslucent animationType="none" visible={visible} onRequestClose={close}>
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        </Animated.View>

        {/* Sheet */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kvContainer}
          pointerEvents="box-none"
        >
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[
                styles.sheet,
                { backgroundColor: colors.surface, maxHeight: sheetHeight },
                sheetStyle,
              ]}
            >
              {/* Drag handle */}
              <View style={styles.handleRow}>
                <View style={[styles.handle, { backgroundColor: colors.border }]} />
              </View>

              {title && (
                <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
                  <Text variant="h3">{title}</Text>
                </View>
              )}

              {scrollable ? (
                <ScrollView
                  contentContainerStyle={styles.content}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {children}
                </ScrollView>
              ) : (
                <View style={styles.content}>{children}</View>
              )}
            </Animated.View>
          </GestureDetector>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  kvContainer: {
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    minHeight: 200,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
});
