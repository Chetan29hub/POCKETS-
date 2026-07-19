import { getDB } from '../db';
import type {
  Transaction, NewTransaction, BalanceSummary,
  PeriodSummary, CategoryBreakdown, DailySpend
} from '../types';

const JOIN_CATEGORIES = `
  LEFT JOIN categories c ON t.category_id = c.id
`;

const TRANSACTION_SELECT = `
  SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
  FROM transactions t
  ${JOIN_CATEGORIES}
`;

// ── INSERT ─────────────────────────────────────────────────────────────────
export function insertTransaction(tx: NewTransaction): number {
  const db = getDB();
  const result = db.runSync(
    `INSERT INTO transactions (type, amount, category_id, description, date, time, payment_method)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [tx.type, tx.amount, tx.category_id ?? null, tx.description ?? null,
     tx.date, tx.time, tx.payment_method]
  );
  return result.lastInsertRowId;
}

// ── UPDATE ─────────────────────────────────────────────────────────────────
export function updateTransaction(id: number, tx: Partial<NewTransaction>): void {
  const db = getDB();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (tx.type !== undefined)           { fields.push('type = ?');           values.push(tx.type); }
  if (tx.amount !== undefined)         { fields.push('amount = ?');         values.push(tx.amount); }
  if (tx.category_id !== undefined)    { fields.push('category_id = ?');    values.push(tx.category_id); }
  if (tx.description !== undefined)    { fields.push('description = ?');    values.push(tx.description ?? null); }
  if (tx.date !== undefined)           { fields.push('date = ?');           values.push(tx.date); }
  if (tx.time !== undefined)           { fields.push('time = ?');           values.push(tx.time); }
  if (tx.payment_method !== undefined) { fields.push('payment_method = ?'); values.push(tx.payment_method); }

  if (fields.length === 0) return;
  values.push(id);
  db.runSync(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?;`, values);
}

// ── DELETE ─────────────────────────────────────────────────────────────────
export function deleteTransaction(id: number): void {
  getDB().runSync('DELETE FROM transactions WHERE id = ?;', [id]);
}

// ── FETCH ALL (paginated) ──────────────────────────────────────────────────
export function fetchTransactions(limit = 50, offset = 0): Transaction[] {
  return getDB().getAllSync<Transaction>(
    `${TRANSACTION_SELECT} ORDER BY t.date DESC, t.time DESC LIMIT ? OFFSET ?;`,
    [limit, offset]
  );
}

// ── FETCH BY ID ────────────────────────────────────────────────────────────
export function fetchTransactionById(id: number): Transaction | null {
  return getDB().getFirstSync<Transaction>(
    `${TRANSACTION_SELECT} WHERE t.id = ?;`, [id]
  ) ?? null;
}

// ── FETCH RECENT ───────────────────────────────────────────────────────────
export function fetchRecentTransactions(limit = 8): Transaction[] {
  return getDB().getAllSync<Transaction>(
    `${TRANSACTION_SELECT} ORDER BY t.date DESC, t.time DESC LIMIT ?;`, [limit]
  );
}

// ── FETCH BY DATE RANGE ────────────────────────────────────────────────────
export function fetchTransactionsByDateRange(
  from: string, to: string, categoryId?: number
): Transaction[] {
  const db = getDB();
  if (categoryId !== undefined) {
    return db.getAllSync<Transaction>(
      `${TRANSACTION_SELECT}
       WHERE t.date >= ? AND t.date <= ? AND t.category_id = ?
       ORDER BY t.date DESC, t.time DESC;`,
      [from, to, categoryId]
    );
  }
  return db.getAllSync<Transaction>(
    `${TRANSACTION_SELECT}
     WHERE t.date >= ? AND t.date <= ?
     ORDER BY t.date DESC, t.time DESC;`,
    [from, to]
  );
}

// ── SEARCH ─────────────────────────────────────────────────────────────────
export function searchTransactions(query: string): Transaction[] {
  const q = `%${query}%`;
  return getDB().getAllSync<Transaction>(
    `${TRANSACTION_SELECT}
     WHERE t.description LIKE ? OR c.name LIKE ? OR t.amount LIKE ? OR t.date LIKE ?
     ORDER BY t.date DESC, t.time DESC LIMIT 100;`,
    [q, q, q, q]
  );
}

// ── BALANCE SUMMARY ────────────────────────────────────────────────────────
export function fetchBalanceSummary(): BalanceSummary {
  const db = getDB();
  const row = db.getFirstSync<{
    total_income: number; total_expense: number;
  }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) as total_income,
       COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as total_expense
     FROM transactions;`
  );
  const total_income = row?.total_income ?? 0;
  const total_expense = row?.total_expense ?? 0;
  const balance = total_income - total_expense;
  return {
    total_income,
    total_expense,
    balance,
    savings: balance > 0 ? balance : 0,
  };
}

// ── PERIOD SUMMARY ─────────────────────────────────────────────────────────
export function fetchPeriodSummary(from: string, to: string): PeriodSummary {
  const db = getDB();
  const row = db.getFirstSync<{
    total_income: number; total_expense: number; transaction_count: number;
  }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) as total_income,
       COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as total_expense,
       COUNT(*) as transaction_count
     FROM transactions WHERE date >= ? AND date <= ?;`,
    [from, to]
  );
  return {
    period: `${from}/${to}`,
    total_income: row?.total_income ?? 0,
    total_expense: row?.total_expense ?? 0,
    transaction_count: row?.transaction_count ?? 0,
  };
}

// ── TODAY SPEND ────────────────────────────────────────────────────────────
export function fetchTodaySpend(today: string): number {
  const row = getDB().getFirstSync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type='expense' AND date=?;`,
    [today]
  );
  return row?.total ?? 0;
}

// ── CATEGORY BREAKDOWN ─────────────────────────────────────────────────────
export function fetchCategoryBreakdown(from: string, to: string): CategoryBreakdown[] {
  const rows = getDB().getAllSync<{
    category_id: number; category_name: string;
    category_icon: string; category_color: string;
    total: number; count: number;
  }>(
    `SELECT
       t.category_id,
       c.name  as category_name,
       c.icon  as category_icon,
       c.color as category_color,
       SUM(t.amount) as total,
       COUNT(*)      as count
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.type = 'expense' AND t.date >= ? AND t.date <= ?
     GROUP BY t.category_id
     ORDER BY total DESC;`,
    [from, to]
  );

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  return rows.map(r => ({
    ...r,
    percentage: grandTotal > 0 ? (r.total / grandTotal) * 100 : 0,
  }));
}

// ── DAILY SPEND (last N days) ──────────────────────────────────────────────
export function fetchDailySpend(from: string, to: string): DailySpend[] {
  return getDB().getAllSync<DailySpend>(
    `SELECT
       date,
       COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as total_expense,
       COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) as total_income
     FROM transactions
     WHERE date >= ? AND date <= ?
     GROUP BY date
     ORDER BY date ASC;`,
    [from, to]
  );
}

// ── TOP EXPENSES ───────────────────────────────────────────────────────────
export function fetchTopExpenses(from: string, to: string, limit = 5): Transaction[] {
  return getDB().getAllSync<Transaction>(
    `${TRANSACTION_SELECT}
     WHERE t.type = 'expense' AND t.date >= ? AND t.date <= ?
     ORDER BY t.amount DESC LIMIT ?;`,
    [from, to, limit]
  );
}

// ── AVERAGE DAILY SPEND ────────────────────────────────────────────────────
export function fetchAverageDailySpend(from: string, to: string): number {
  const row = getDB().getFirstSync<{ avg: number }>(
    `SELECT COALESCE(AVG(daily_total), 0) as avg FROM (
       SELECT date, SUM(amount) as daily_total
       FROM transactions
       WHERE type='expense' AND date >= ? AND date <= ?
       GROUP BY date
     );`,
    [from, to]
  );
  return row?.avg ?? 0;
}

// ── MONTHLY TOTALS (last 6 months) ─────────────────────────────────────────
export function fetchMonthlyTotals(monthsBack = 6): Array<{
  month: string; total_expense: number; total_income: number;
}> {
  return getDB().getAllSync(
    `SELECT
       strftime('%Y-%m', date) as month,
       COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as total_expense,
       COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) as total_income
     FROM transactions
     WHERE date >= date('now', '-${monthsBack} months')
     GROUP BY month
     ORDER BY month ASC;`
  ) as Array<{ month: string; total_expense: number; total_income: number }>;
}
