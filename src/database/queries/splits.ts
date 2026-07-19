import { getDB } from '../db';
import type { SplitExpense, Settlement, NewSplitExpense, SettlementStatus } from '../types';

// ── INSERT SPLIT (atomic: split_expense + member rows + transaction for payer share) ──
export function insertSplitExpense(data: NewSplitExpense): number {
  const db = getDB();

  // 1. Insert the split expense record
  const splitResult = db.runSync(
    `INSERT INTO split_expenses
       (total_amount, payer_share, category_id, description, date, num_members, split_mode)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [data.total_amount, data.payer_share, data.category_id ?? null,
     data.description ?? null, data.date, data.num_members, data.split_mode]
  );
  const splitId = splitResult.lastInsertRowId;

  // 2. Insert/reuse members + settlements
  for (const m of data.members) {
    // Upsert member by name
    let member = db.getFirstSync<{ id: number }>(
      'SELECT id FROM members WHERE name = ?;', [m.name]
    );
    let memberId: number;
    if (!member) {
      const mr = db.runSync(
        'INSERT INTO members (name) VALUES (?);', [m.name]
      );
      memberId = mr.lastInsertRowId;
    } else {
      memberId = member.id;
    }

    db.runSync(
      `INSERT INTO settlements (split_id, member_id, amount_owed, status)
       VALUES (?, ?, ?, 'pending');`,
      [splitId, memberId, m.amount_owed]
    );
  }

  // 3. Record payer's own share as a personal expense transaction
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  db.runSync(
    `INSERT INTO transactions (type, amount, category_id, description, date, time, payment_method)
     VALUES ('expense', ?, ?, ?, ?, ?, 'cash');`,
    [data.payer_share, data.category_id ?? null,
     data.description ? `[Split] ${data.description}` : '[Split expense - my share]',
     data.date, time]
  );

  return splitId;
}

// ── FETCH ALL SPLITS ────────────────────────────────────────────────────────
export function fetchAllSplits(): SplitExpense[] {
  return getDB().getAllSync<SplitExpense>(
    `SELECT se.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM split_expenses se
     LEFT JOIN categories c ON se.category_id = c.id
     ORDER BY se.date DESC;`
  );
}

// ── FETCH SETTLEMENTS WITH MEMBER NAMES ────────────────────────────────────
export function fetchSettlementsForSplit(splitId: number): Settlement[] {
  return getDB().getAllSync<Settlement>(
    `SELECT s.*, m.name as member_name,
            se.description as split_description,
            se.date as split_date,
            se.total_amount as split_total
     FROM settlements s
     JOIN members m ON s.member_id = m.id
     JOIN split_expenses se ON s.split_id = se.id
     WHERE s.split_id = ?
     ORDER BY s.status, m.name;`,
    [splitId]
  );
}

// ── ALL PENDING SETTLEMENTS (for Settlements screen) ──────────────────────
export function fetchAllSettlements(): Settlement[] {
  return getDB().getAllSync<Settlement>(
    `SELECT s.*, m.name as member_name,
            se.description as split_description,
            se.date as split_date,
            se.total_amount as split_total
     FROM settlements s
     JOIN members m  ON s.member_id  = m.id
     JOIN split_expenses se ON s.split_id = se.id
     ORDER BY s.status ASC, se.date DESC;`
  );
}

// ── TOTAL PENDING AMOUNT ───────────────────────────────────────────────────
export function fetchTotalPending(): number {
  const row = getDB().getFirstSync<{ total: number }>(
    `SELECT COALESCE(SUM(amount_owed), 0) as total FROM settlements WHERE status='pending';`
  );
  return row?.total ?? 0;
}

// ── MARK AS PAID ────────────────────────────────────────────────────────────
export function markSettlementPaid(settlementId: number): void {
  getDB().runSync(
    `UPDATE settlements SET status='paid', settled_at=datetime('now') WHERE id=?;`,
    [settlementId]
  );
}

// ── MARK ALL PAID FOR A SPLIT ───────────────────────────────────────────────
export function markAllPaidForSplit(splitId: number): void {
  getDB().runSync(
    `UPDATE settlements SET status='paid', settled_at=datetime('now')
     WHERE split_id=? AND status='pending';`,
    [splitId]
  );
}

// ── DELETE SPLIT ────────────────────────────────────────────────────────────
export function deleteSplitExpense(splitId: number): void {
  getDB().runSync('DELETE FROM split_expenses WHERE id=?;', [splitId]);
}
