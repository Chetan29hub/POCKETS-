import { getDB } from '../db';
import type { Budget } from '../types';

export function fetchBudgets(month: string): Budget[] {
  return getDB().getAllSync<Budget>(
    `SELECT b.*, c.name as category_name,
            COALESCE((
              SELECT SUM(t.amount) FROM transactions t
              WHERE t.category_id = b.category_id
                AND strftime('%Y-%m', t.date) = b.month
                AND t.type = 'expense'
            ), 0) as spent
     FROM budgets b
     LEFT JOIN categories c ON b.category_id = c.id
     WHERE b.month = ?
     ORDER BY b.monthly_limit DESC;`,
    [month]
  );
}

export function upsertBudget(categoryId: number | null, limit: number, month: string): void {
  const db = getDB();
  const existing = db.getFirstSync<{ id: number }>(
    'SELECT id FROM budgets WHERE category_id IS ? AND month = ?;',
    [categoryId ?? null, month]
  );
  if (existing) {
    db.runSync('UPDATE budgets SET monthly_limit = ? WHERE id = ?;', [limit, existing.id]);
  } else {
    db.runSync(
      'INSERT INTO budgets (category_id, monthly_limit, month) VALUES (?, ?, ?);',
      [categoryId ?? null, limit, month]
    );
  }
}

export function deleteBudget(id: number): void {
  getDB().runSync('DELETE FROM budgets WHERE id = ?;', [id]);
}
