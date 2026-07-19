import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import {
  LayoutDashboard, History, Plus, BarChart3, User,
} from 'lucide-react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Text } from '@/components/Text';
import { Shadow, Spacing, BorderRadius } from '@/theme/spacing';
import { FontSize, FontWeight } from '@/theme/typography';
import { AddExpenseSheet } from '@/features/expense/AddExpenseSheet';

const TAB_ICONS = {
  Dashboard: LayoutDashboard,
  History:   History,
  Analytics: BarChart3,
  Profile:   User,
};

const TAB_LABELS: Record<string, string> = {
  Dashboard: 'Home',
  History:   'History',
  Analytics: 'Analytics',
  Profile:   'Profile',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const TabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [addSheetVisible, setAddSheetVisible] = useState(false);

  const routes = state.routes.filter(r => r.name !== 'AddExpense');

  return (
    <>
      {/* Add Expense Sheet — triggered by center FAB */}
      <AddExpenseSheet
        visible={addSheetVisible}
        onClose={() => setAddSheetVisible(false)}
      />

      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.tabBarBorder,
            paddingBottom: Math.max(insets.bottom, Spacing.md),
          },
          Shadow.lg,
        ]}
      >
        {/* Left two tabs */}
        {routes.slice(0, 2).map(route => (
          <TabItem
            key={route.key}
            route={route}
            isFocused={state.index === state.routes.findIndex(r => r.key === route.key)}
            navigation={navigation}
            icon={TAB_ICONS[route.name as keyof typeof TAB_ICONS]}
            label={TAB_LABELS[route.name]}
          />
        ))}

        {/* Centre FAB */}
        <View style={styles.fabWrap}>
          <Pressable
            onPress={() => setAddSheetVisible(true)}
            style={({ pressed }) => [
              styles.fab,
              { backgroundColor: colors.accent },
              pressed && { opacity: 0.9, transform: [{ scale: 0.95 }] },
              Shadow.accent,
            ]}
          >
            <Plus size={28} color="#fff" strokeWidth={2.5} />
          </Pressable>
        </View>

        {/* Right two tabs */}
        {routes.slice(2).map(route => (
          <TabItem
            key={route.key}
            route={route}
            isFocused={state.index === state.routes.findIndex(r => r.key === route.key)}
            navigation={navigation}
            icon={TAB_ICONS[route.name as keyof typeof TAB_ICONS]}
            label={TAB_LABELS[route.name]}
          />
        ))}
      </View>
    </>
  );
};

interface TabItemProps {
  route: any;
  isFocused: boolean;
  navigation: any;
  icon: any;
  label: string;
}

const TabItem: React.FC<TabItemProps> = ({ route, isFocused, navigation, icon: Icon, label }) => {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.88, { duration: 100 }, () => {
      scale.value = withSpring(1, { duration: 200 });
    });
    if (!isFocused) navigation.navigate(route.name);
  };

  const color = isFocused ? colors.tabActive : colors.tabInactive;

  return (
    <Pressable onPress={handlePress} style={styles.tabItem}>
      <Animated.View style={[styles.tabInner, animStyle]}>
        {isFocused && (
          <View style={[styles.activeDot, { backgroundColor: colors.accent }]} />
        )}
        <Icon size={22} color={color} strokeWidth={isFocused ? 2.2 : 1.8} />
        <Text style={[styles.tabLabel, { color }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    gap: 3,
    position: 'relative',
    paddingTop: Spacing.xs,
  },
  activeDot: {
    position: 'absolute',
    top: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  fabWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
