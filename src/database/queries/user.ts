import { getDB } from '../db';
import type { User } from '../types';

export function fetchUser(): User | null {
  return getDB().getFirstSync<User>('SELECT * FROM users LIMIT 1;') ?? null;
}

export function updateUser(fields: Partial<Omit<User, 'id' | 'created_at'>>): void {
  const db = getDB();
  const keys = Object.keys(fields) as Array<keyof typeof fields>;
  if (keys.length === 0) return;
  const setClauses = keys.map(k => `${k} = ?`).join(', ');
  const values = [...keys.map(k => fields[k]), 1];
  db.runSync(`UPDATE users SET ${setClauses} WHERE id = ?;`, values as (string | number | null)[]);
}

export function fetchMonthlyBudget(): number {
  const row = getDB().getFirstSync<{ monthly_budget: number }>(
    'SELECT monthly_budget FROM users LIMIT 1;'
  );
  return row?.monthly_budget ?? 0;
}
