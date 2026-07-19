import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, Switch, Pressable, Alert,
  TextInput,
} from 'react-native';
import {
  User, Moon, Sun, DollarSign, Download, Upload,
  Trash2, ChevronRight, Info, Users,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { useCurrency } from '@/hooks/useCurrency';
import { useUserStore } from '@/store/useUserStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useSplitStore } from '@/store/useSplitStore';
import { ScreenHeader, Text, Card, Button } from '@/components';
import { AddIncomeSheet } from '@/features/profile/AddIncomeSheet';
import { Spacing, BorderRadius } from '@/theme/spacing';
import { FontSize, FontWeight } from '@/theme/typography';
import {
  exportToJSON, exportToCSV, importFromJSON,
} from '@/services/exportImport';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen: React.FC = () => {
  const { colors, isDark, toggleTheme } = useTheme();
  const navigation = useNavigation<Nav>();
  const { user, loadUser, updateProfile } = useUserStore();
  const { format } = useCurrency();
  const { loadDashboardData, balanceSummary, todaySpend, weekSpend, monthSpend } = useTransactionStore();
  const { loadSettlements, totalPending } = useSplitStore();

  const [name,            setName]            = useState('');
  const [editingName,     setEditingName]     = useState(false);
  const [exportLoading,   setExportLoading]   = useState(false);
  const [importLoading,   setImportLoading]   = useState(false);
  const [addIncomeVisible, setAddIncomeVisible] = useState(false);

  useEffect(() => {
    loadUser();
    loadDashboardData();
    loadSettlements();
  }, []);

  const handleAddMoney = () => setAddIncomeVisible(true);

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  const saveField = (fields: Parameters<typeof updateProfile>[0]) => {
    updateProfile(fields);
    loadDashboardData();
  };

  const handleExportJSON = async () => {
    setExportLoading(true);
    try { await exportToJSON(); }
    catch (e: any) { Alert.alert('Export failed', e.message); }
    finally { setExportLoading(false); }
  };

  const handleExportCSV = async () => {
    setExportLoading(true);
    try { await exportToCSV(); }
    catch (e: any) { Alert.alert('Export failed', e.message); }
    finally { setExportLoading(false); }
  };

  const handleImport = async () => {
    Alert.alert(
      'Import Backup',
      'This will merge the backup with your current data. Transactions with conflicting IDs will be skipped. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import', onPress: async () => {
            setImportLoading(true);
            const result = await importFromJSON();
            setImportLoading(false);
            Alert.alert(result.success ? 'Success' : 'Error', result.message);
            if (result.success) loadDashboardData();
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete ALL transactions, splits, and settlements. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything', style: 'destructive',
          onPress: () => {
            const db = require('@/database/db').getDB();
            db.execSync('DELETE FROM settlements;');
            db.execSync('DELETE FROM split_expenses;');
            db.execSync('DELETE FROM transactions;');
            db.execSync('DELETE FROM members;');
            loadDashboardData();
            Alert.alert('Done', 'All data has been cleared.');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <AddIncomeSheet visible={addIncomeVisible} onClose={() => setAddIncomeVisible(false)} />
      <ScreenHeader title="Profile & Settings" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Profile card ─────────────────────────────────────────── */}
        <Card elevated style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: colors.accentDim }]}>
            <User size={32} color={colors.accent} />
          </View>
          <View style={styles.profileInfo}>
            {editingName ? (
              <View style={styles.editNameRow}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  style={[styles.nameInput, { color: colors.textPrimary, borderColor: colors.accent }]}
                  autoFocus
                  onBlur={() => { setEditingName(false); saveField({ name }); }}
                  returnKeyType="done"
                  onSubmitEditing={() => { setEditingName(false); saveField({ name }); }}
                />
              </View>
            ) : (
              <Pressable onPress={() => setEditingName(true)}>
                <Text variant="h3">{name || 'You'}</Text>
                <Text style={[styles.editHint, { color: colors.accent }]}>Tap to edit</Text>
              </Pressable>
            )}
          </View>
        </Card>

        <View style={styles.profileActionRow}>
          <Button
            label="Add Money"
            onPress={handleAddMoney}
            variant="income"
            fullWidth
            size="lg"
            icon={<DollarSign size={18} color="#fff" />}
          />
        </View>

        <View style={styles.summaryRow}>
          <StatsBox label="Income" value={`₹${balanceSummary.total_income.toFixed(0)}`} color={colors.income} />
          <StatsBox label="Expense" value={`₹${balanceSummary.total_expense.toFixed(0)}`} color={colors.expense} />
          <StatsBox label="Balance" value={`₹${balanceSummary.balance.toFixed(0)}`} color={balanceSummary.balance >= 0 ? colors.income : colors.expense} />
        </View>

        {/* ── Stats row ─────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatsBox label="Pending"   value={totalPending > 0 ? `₹${totalPending.toFixed(0)}` : '₹0'} color={colors.savings} />
          <StatsBox label="Theme"     value={isDark ? 'Dark' : 'Light'} color={colors.info} />
        </View>

        {/* ── Spending Overview ────────────────────────────────────── */}
        <SectionTitle title="Spending Overview" />
        <View style={styles.statsRow}>
          <StatsBox label="Today" value={format(todaySpend)} color={colors.expense} />
          <StatsBox label="This Week" value={format(weekSpend)} color={colors.expense} />
          <StatsBox label="This Month" value={format(monthSpend)} color={colors.expense} />
        </View>

        {/* ── Appearance ───────────────────────────────────────────── */}
        <SectionTitle title="Appearance" />
        <Card elevated>
          <SettingsRow
            icon={isDark ? Moon : Sun}
            iconColor={colors.accent}
            label="Dark Mode"
            right={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.accent + '66' }}
                thumbColor={isDark ? colors.accent : colors.textMuted}
              />
            }
          />
        </Card>

        {/* ── Data management ───────────────────────────────────────── */}
        <SectionTitle title="Data" />
        <Card elevated style={styles.sectionCard}>
          <SettingsRow
            icon={Download}
            iconColor={colors.income}
            label="Export JSON backup"
            onPress={handleExportJSON}
            loading={exportLoading}
          />
          <Divider />
          <SettingsRow
            icon={Download}
            iconColor={colors.income}
            label="Export CSV (transactions)"
            onPress={handleExportCSV}
            loading={exportLoading}
          />
          <Divider />
          <SettingsRow
            icon={Upload}
            iconColor={colors.info}
            label="Import / Restore backup"
            onPress={handleImport}
            loading={importLoading}
          />
          <Divider />
          <SettingsRow
            icon={DollarSign}
            iconColor={colors.income}
            label="Add Money"
            onPress={() => setAddIncomeVisible(true)}
          />
          <Divider />
          <SettingsRow
            icon={Users}
            iconColor={colors.accent}
            label="View Settlements"
            onPress={() => navigation.navigate('SplitExpense')}
          />
        </Card>

        {/* ── Danger zone ───────────────────────────────────────────── */}
        <SectionTitle title="Danger Zone" />
        <Card elevated style={[styles.sectionCard, { borderColor: colors.expenseDim, borderWidth: 1 }]}>
          <SettingsRow
            icon={Trash2}
            iconColor={colors.expense}
            label="Clear all data"
            labelColor={colors.expense}
            onPress={handleClearAll}
          />
        </Card>

        {/* ── About ─────────────────────────────────────────────────── */}
        <SectionTitle title="About" />
        <Card elevated>
          <SettingsRow icon={Info} iconColor={colors.textMuted} label="Pocket v1.0.0"
            right={<Text style={{ color: colors.textMuted, fontSize: FontSize.sm }}>Know Every Rupee.</Text>}
          />
        </Card>

        <View style={{ height: Spacing['5xl'] }} />
      </ScrollView>
    </View>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────
const SectionTitle: React.FC<{ title: string }> = ({ title }) => {
  const { colors } = useTheme();
  return (
    <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title.toUpperCase()}</Text>
  );
};

interface StatsBoxProps { label: string; value: string; color: string }
const StatsBox: React.FC<StatsBoxProps> = ({ label, value, color }) => {
  const { colors } = useTheme();
  return (
    <Card elevated style={styles.statsBox}>
      <Text style={[styles.statsVal, { color }]}>{value}</Text>
      <Text style={[styles.statsLbl, { color: colors.textMuted }]}>{label}</Text>
    </Card>
  );
};

interface SettingsRowProps {
  icon: any;
  iconColor: string;
  label: string;
  labelColor?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  loading?: boolean;
}
const SettingsRow: React.FC<SettingsRowProps> = ({
  icon: Icon, iconColor, label, labelColor, right, onPress, loading,
}) => {
  const { colors } = useTheme();
  const content = (
    <View style={styles.settingsRow}>
      <View style={[styles.settingsIcon, { backgroundColor: iconColor + '20' }]}>
        <Icon size={18} color={iconColor} />
      </View>
      <Text style={[styles.settingsLabel, { color: labelColor ?? colors.textPrimary }]}>{label}</Text>
      {loading
        ? <Text style={{ color: colors.textMuted, fontSize: FontSize.sm }}>…</Text>
        : right
          ? right
          : onPress ? <ChevronRight size={16} color={colors.textMuted} /> : null
      }
    </View>
  );
  if (onPress) return <Pressable onPress={onPress}>{content}</Pressable>;
  return content;
};

const Divider: React.FC = () => {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />;
};

const styles = StyleSheet.create({
  root:          { flex: 1 },
  content:       { padding: Spacing.base, gap: Spacing.sm, paddingBottom: 40 },
  profileCard:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
  avatar:        { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  profileInfo:   { flex: 1 },
  editNameRow:   { flexDirection: 'row', alignItems: 'center' },
  nameInput:     { flex: 1, fontSize: FontSize.xl, fontWeight: FontWeight.bold, borderBottomWidth: 2, paddingBottom: 4 },
  editHint:      { fontSize: FontSize.xs, marginTop: 2 },
  statsRow:      { flexDirection: 'row', gap: Spacing.sm },
  statsBox:      { flex: 1, alignItems: 'center', paddingVertical: Spacing.md },
  statsVal:      { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  statsLbl:      { fontSize: FontSize.xs, marginTop: 2 },
  sectionTitle:  { fontSize: FontSize.xs, fontWeight: FontWeight.semiBold, letterSpacing: 1, marginTop: Spacing.sm, marginLeft: Spacing.xs },
  sectionCard:   { gap: 0 },
  settingsRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  settingsIcon:  { width: 36, height: 36, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  settingsLabel: { flex: 1, fontSize: FontSize.base },
  divider:       { height: StyleSheet.hairlineWidth, marginLeft: 52 },
  profileActionRow: { marginTop: Spacing.sm },
  summaryRow:      { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'space-between' },
});
