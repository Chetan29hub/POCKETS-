import React, { useEffect, useState, useMemo } from 'react';
import {
  View, StyleSheet, ScrollView, Dimensions, RefreshControl,
} from 'react-native';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import { useTheme } from '@/hooks/useTheme';
import { useCurrency } from '@/hooks/useCurrency';
import { useTransactionStore } from '@/store/useTransactionStore';
import {
  ScreenHeader, Text, Card, SegmentedControl,
} from '@/components';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { FontSize, FontWeight } from '@/theme/typography';
import { getCategoryIcon } from '@/utils/categoryIcons';
import {
  monthStartStr, monthEndStr, weekStartStr, weekEndStr,
  lastMonthStartStr, lastMonthEndStr,
} from '@/utils/dateHelpers';
import { fetchPeriodSummary } from '@/database/queries/transactions';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_W = SCREEN_W - Spacing.base * 2 - Spacing.base * 2; // card padding

type Period = 'week' | 'month' | 'last_month';

const PERIOD_OPTS = [
  { label: 'Week',       value: 'week'       },
  { label: 'Month',      value: 'month'      },
  { label: 'Last Month', value: 'last_month' },
];

export const AnalyticsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { format }         = useCurrency();
  const {
    categoryBreakdown, dailySpend, topExpenses,
    avgDailySpend, monthlyTotals, loadAnalyticsData, isLoading,
  } = useTransactionStore();

  const [period,     setPeriod]     = useState<Period>('month');
  const [refreshing, setRefreshing] = useState(false);

  const dateRange = useMemo(() => {
    switch (period) {
      case 'week':       return { from: weekStartStr(),      to: weekEndStr() };
      case 'last_month': return { from: lastMonthStartStr(), to: lastMonthEndStr() };
      default:           return { from: monthStartStr(),     to: monthEndStr() };
    }
  }, [period]);

  const loadData = () => {
    loadAnalyticsData(dateRange.from, dateRange.to);
  };

  useEffect(() => { loadData(); }, [period]);

  const onRefresh = async () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  };

  // Comparison vs previous period
  const thisTotal = useMemo(() => {
    const s = fetchPeriodSummary(dateRange.from, dateRange.to);
    return s.total_expense;
  }, [dateRange]);

  const prevTotal = useMemo(() => {
    const s = fetchPeriodSummary(lastMonthStartStr(), lastMonthEndStr());
    return s.total_expense;
  }, [period]);

  const delta = prevTotal > 0
    ? ((thisTotal - prevTotal) / prevTotal) * 100
    : 0;

  // ── Chart configs ──────────────────────────────────────────────────────────
  const chartConfig = {
    backgroundGradientFrom: colors.surfaceElevated,
    backgroundGradientTo:   colors.surfaceElevated,
    decimalPlaces:          0,
    color:    (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
    labelColor:(opacity = 1) => `rgba(${isDark ? '144,144,168' : '90,90,120'}, ${opacity})`,
    propsForDots: { r: '4', strokeWidth: '2', stroke: colors.accent },
    propsForBackgroundLines: { stroke: colors.borderLight, strokeDasharray: '' },
  };

  // Pie chart data
  const pieData = useMemo(() =>
    categoryBreakdown.slice(0, 7).map(c => ({
      name:  c.category_name,
      value: c.total,
      color: c.category_color,
      legendFontColor: colors.textSecondary,
      legendFontSize:  12,
    })), [categoryBreakdown, colors]);

  // Bar chart data — monthly totals (last 6)
  const barData = useMemo(() => {
    const months = monthlyTotals.slice(-6);
    return {
      labels: months.map(m => m.month.slice(5)), // MM
      datasets: [{ data: months.map(m => m.total_expense || 0) }],
    };
  }, [monthlyTotals]);

  // Line chart — daily spend this period
  const lineData = useMemo(() => {
    const days = dailySpend.slice(-14);
    return {
      labels:   days.map(d => d.date.slice(8)), // DD
      datasets: [{ data: days.map(d => d.total_expense || 0) }],
    };
  }, [dailySpend]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Analytics" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {/* Period selector */}
        <SegmentedControl options={PERIOD_OPTS as any} value={period} onChange={v => setPeriod(v as Period)} />

        {/* ── Summary row ───────────────────────────────────────────────── */}
        <View style={styles.summaryRow}>
          <Card elevated style={styles.summaryCard}>
            <Text style={[styles.summaryVal, { color: colors.expense }]}>{format(thisTotal)}</Text>
            <Text style={[styles.summaryLbl, { color: colors.textMuted }]}>Total Spent</Text>
          </Card>
          <Card elevated style={styles.summaryCard}>
            <Text style={[styles.summaryVal, { color: colors.textPrimary }]}>{format(avgDailySpend)}</Text>
            <Text style={[styles.summaryLbl, { color: colors.textMuted }]}>Avg / Day</Text>
          </Card>
          <Card elevated style={styles.summaryCard}>
            <Text style={[
              styles.summaryVal,
              { color: delta > 0 ? colors.expense : colors.income },
            ]}>
              {delta > 0 ? '+' : ''}{delta.toFixed(0)}%
            </Text>
            <Text style={[styles.summaryLbl, { color: colors.textMuted }]}>vs Last Month</Text>
          </Card>
        </View>

        {/* ── Pie chart ─────────────────────────────────────────────────── */}
        {pieData.length > 0 && (
          <Card elevated noPadding style={styles.chartCard}>
            <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Spending by Category</Text>
            <PieChart
              data={pieData}
              width={CHART_W + Spacing.base * 2}
              height={200}
              chartConfig={chartConfig}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="8"
              hasLegend
              absolute={false}
            />
          </Card>
        )}

        {/* ── Category breakdown list ────────────────────────────────────── */}
        {categoryBreakdown.length > 0 && (
          <Card elevated>
            <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Category Breakdown</Text>
            <View style={styles.catList}>
              {categoryBreakdown.map(cat => {
                const Icon = getCategoryIcon(cat.category_icon);
                return (
                  <View key={cat.category_id} style={styles.catRow}>
                    <View style={[styles.catIcon, { backgroundColor: cat.category_color + '22' }]}>
                      <Icon size={16} color={cat.category_color} />
                    </View>
                    <Text style={[styles.catName, { color: colors.textPrimary }]}>{cat.category_name}</Text>
                    <View style={styles.catBar}>
                      <View
                        style={[
                          styles.catBarFill,
                          { width: `${cat.percentage}%`, backgroundColor: cat.category_color },
                        ]}
                      />
                    </View>
                    <Text style={[styles.catAmt, { color: colors.textSecondary }]}>
                      {format(cat.total)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {/* ── Monthly bar chart ──────────────────────────────────────────── */}
        {barData.labels.length > 0 && (
          <Card elevated noPadding style={styles.chartCard}>
            <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Monthly Trend</Text>
            <BarChart
              data={barData}
              width={CHART_W + Spacing.base * 2}
              height={200}
              chartConfig={chartConfig}
              fromZero
              showBarTops={false}
              style={{ borderRadius: BorderRadius.lg }}
              yAxisLabel="₹"
              yAxisSuffix=""
            />
          </Card>
        )}

        {/* ── Daily line chart ───────────────────────────────────────────── */}
        {lineData.labels.length > 1 && (
          <Card elevated noPadding style={styles.chartCard}>
            <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Daily Spending (last 14d)</Text>
            <LineChart
              data={lineData}
              width={CHART_W + Spacing.base * 2}
              height={200}
              chartConfig={chartConfig}
              bezier
              fromZero
              style={{ borderRadius: BorderRadius.lg }}
              yAxisLabel="₹"
              yAxisSuffix=""
            />
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root:        { flex: 1 },
  content:     { padding: Spacing.base, gap: Spacing.base, paddingBottom: 100 },
  summaryRow:  { flexDirection: 'row', gap: Spacing.sm },
  summaryCard: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md },
  summaryVal:  { fontSize: FontSize.md, fontWeight: FontWeight.bold, letterSpacing: -0.5 },
  summaryLbl:  { fontSize: FontSize.xs, marginTop: 2 },
  chartCard:   { paddingVertical: Spacing.base },
  chartTitle:  { fontSize: FontSize.md, fontWeight: FontWeight.semiBold, paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm },
  catList:     { gap: Spacing.sm, marginTop: Spacing.sm },
  catRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  catIcon:     { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  catName:     { width: 80, fontSize: FontSize.sm },
  catBar:      { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(128,128,128,0.15)', overflow: 'hidden' },
  catBarFill:  { height: '100%', borderRadius: 3 },
  catAmt:      { width: 70, fontSize: FontSize.sm, textAlign: 'right' },
});
