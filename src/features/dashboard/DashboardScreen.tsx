import React, { useEffect, useState, useCallback } from 'react';
import {
  View, ScrollView, StyleSheet, RefreshControl,
  Pressable, StatusBar, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  TrendingUp, TrendingDown, PiggyBank,
  Search, Bell, Users,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useCurrency } from '@/hooks/useCurrency';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useUserStore } from '@/store/useUserStore';
import { useSplitStore } from '@/store/useSplitStore';
import {
  Text, Card, AmountDisplay, SummaryTile,
  TransactionItem, EmptyState,
} from '@/components';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { FontSize, FontWeight } from '@/theme/typography';
import type { RootStackParamList } from '@/navigation/types';
import type { Transaction } from '@/database/types';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DARK_BG_SVG = `<svg width="1080" height="2340" viewBox="0 0 1080 2340" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="base" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f0a2e"/>
      <stop offset="35%" stop-color="#1a1145"/>
      <stop offset="65%" stop-color="#2a1763"/>
      <stop offset="100%" stop-color="#120b33"/>
    </linearGradient>
    <radialGradient id="glow1" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#7c3aed" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#c084fc" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#c084fc" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow3" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#facc15" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#facc15" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow4" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="#22d3ee" stop-opacity="0"/>
    </radialGradient>
    <filter id="softBlur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="80"/>
    </filter>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="noise"/>
      <feColorMatrix in="noise" type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.04"/>
      </feComponentTransfer>
      <feComposite operator="over" in2="SourceGraphic"/>
    </filter>
    <pattern id="dots" width="46" height="46" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.4" fill="#ffffff" fill-opacity="0.05"/>
    </pattern>
  </defs>
  <rect width="1080" height="2340" fill="url(#base)"/>
  <circle cx="180" cy="260" r="480" fill="url(#glow1)" filter="url(#softBlur)"/>
  <circle cx="920" cy="520" r="520" fill="url(#glow2)" filter="url(#softBlur)"/>
  <circle cx="860" cy="1500" r="460" fill="url(#glow3)" filter="url(#softBlur)"/>
  <circle cx="120" cy="1850" r="500" fill="url(#glow4)" filter="url(#softBlur)"/>
  <circle cx="540" cy="2200" r="600" fill="url(#glow1)" filter="url(#softBlur)" opacity="0.6"/>
  <rect width="1080" height="2340" fill="url(#dots)"/>
  <rect width="1080" height="2340" filter="url(#grain)" opacity="0.5"/>
  <line x1="0" y1="900" x2="1080" y2="900" stroke="#ffffff" stroke-opacity="0.04" stroke-width="1"/>
  <line x1="0" y1="1700" x2="1080" y2="1700" stroke="#ffffff" stroke-opacity="0.04" stroke-width="1"/>
</svg>`;

export const DashboardScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { format }         = useCurrency();
  const insets             = useSafeAreaInsets();
  const navigation         = useNavigation<Nav>();

  const {
    balanceSummary, recentTransactions,
    loadDashboardData, removeTransaction, isLoading,
  } = useTransactionStore();

  const { user, loadUser } = useUserStore();
  const { totalPending, loadSettlements } = useSplitStore();

  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(() => {
    loadDashboardData();
    loadSettlements();
  }, []);

  useEffect(() => {
    loadUser();
    refresh();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleEdit = (tx: Transaction) => {
    navigation.navigate('EditTransaction', { transactionId: tx.id });
  };

  const handleDelete = (id: number) => removeTransaction(id);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        contentContainerStyle={{ paddingBottom: Spacing['5xl'] }}
      >
        {/* ── Hero Header ─────────────────────────────────────────── */}
        <LinearGradient
          colors={isDark
            ? ['#1A0A35', '#0A0A0F']
            : ['#EDE9FE', '#F8F8FC']}
          style={[styles.hero, { paddingTop: insets.top + Spacing.lg }]}
        >
          {/* Background image */}
          <View style={styles.heroBg}>
            {isDark ? (
              <SvgXml xml={DARK_BG_SVG as any} />
            ) : (
              <Image
                source={require('../../../assets/light-dashboard-bg.png')}
                style={styles.heroBgImage}
                resizeMode="cover"
              />
            )}
          </View>

          {/* Top row */}
          <View style={styles.topRow}>
            <View>
              <Text style={[styles.greeting, { color: colors.textMuted }]}>
                Good {getGreeting()},
              </Text>
              <Text variant="h2" style={{ color: colors.textPrimary }}>
                {user?.name ?? 'You'} 👋
              </Text>
            </View>
            <View style={styles.headerActions}>
              {totalPending > 0 && (
                <Pressable
                  onPress={() => navigation.navigate('SplitExpense')}
                  style={[styles.iconBtn, { backgroundColor: colors.accentDim }]}
                >
                  <Users size={18} color={colors.accent} />
                </Pressable>
              )}
              <Pressable
                onPress={() => navigation.navigate('Search')}
                style={[styles.iconBtn, { backgroundColor: colors.surfaceElevated }]}
              >
                <Search size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* Balance */}
          <View style={styles.balanceBlock}>
            <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>Total Balance</Text>
            <AmountDisplay
              amount={balanceSummary.balance}
              size="hero"
              color={balanceSummary.balance >= 0 ? colors.textPrimary : colors.expense}
              animate
            />
            <Text style={[styles.balanceSubtitle, { color: colors.textMuted }]}>
              Know Every Rupee.
            </Text>
          </View>

          {/* Income / Expense / Savings row */}
          <View style={styles.summaryRow}>
            <SummaryTile
              label="Income"
              amount={balanceSummary.total_income}
              icon={TrendingUp}
              color={colors.income}
            />
            <SummaryTile
              label="Expense"
              amount={balanceSummary.total_expense}
              icon={TrendingDown}
              color={colors.expense}
            />
            <SummaryTile
              label="Savings"
              amount={balanceSummary.savings}
              icon={PiggyBank}
              color={colors.savings}
            />
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {/* ── Pending Splits banner ────────────────────────────── */}
          {totalPending > 0 && (
            <Pressable onPress={() => navigation.navigate('SplitExpense')}>
              <Card style={[styles.splitBanner, { backgroundColor: colors.accentDim }]} noPadding>
                <View style={styles.splitBannerInner}>
                  <Users size={20} color={colors.accent} />
                  <Text style={[styles.splitBannerText, { color: colors.accentLight }]}>
                    {format(totalPending)} pending from splits
                  </Text>
                  <Text style={[styles.splitBannerCta, { color: colors.accent }]}>View →</Text>
                </View>
              </Card>
            </Pressable>
          )}

          {/* ── Recent Transactions ──────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Text variant="label" muted style={styles.sectionLabel}>RECENT</Text>
            <Pressable onPress={() => navigation.navigate('MainTabs', { screen: 'History' } as any)}>
              <Text style={[styles.seeAll, { color: colors.accent }]}>See all</Text>
            </Pressable>
          </View>

          {recentTransactions.length === 0 ? (
            <EmptyState
              icon={PiggyBank}
              title="No transactions yet"
              subtitle={'Tap + to add your first transaction'}
            />
          ) : (
            <Card noPadding elevated>
              {recentTransactions.map((tx, idx) => (
                <View key={tx.id}>
                  <TransactionItem
                    transaction={tx}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    showDate
                  />
                  {idx < recentTransactions.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
                  )}
                </View>
              ))}
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  root:          { flex: 1 },
  hero:          { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl },
  heroBg:        { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroBgImage:   { width: '100%', height: '100%' },
  topRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xl },
  greeting:      { fontSize: FontSize.sm },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  iconBtn:       { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  balanceBlock:  { alignItems: 'center', marginBottom: Spacing.xl, gap: Spacing.xs },
  balanceLabel:  { fontSize: FontSize.sm, fontWeight: FontWeight.medium, textTransform: 'uppercase', letterSpacing: 1 },
  balanceSubtitle: { fontSize: FontSize.sm },
  summaryRow:    { flexDirection: 'row', gap: Spacing.sm },
  body:          { padding: Spacing.base, gap: Spacing.base },
  sectionLabel:  { marginBottom: -Spacing.xs },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seeAll:        { fontSize: FontSize.sm, fontWeight: FontWeight.semiBold },
  splitBanner:   { borderRadius: BorderRadius.lg },
  splitBannerInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md },
  splitBannerText:  { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  splitBannerCta:   { fontSize: FontSize.sm, fontWeight: FontWeight.semiBold },
  divider:       { height: StyleSheet.hairlineWidth, marginLeft: 72 },
});
