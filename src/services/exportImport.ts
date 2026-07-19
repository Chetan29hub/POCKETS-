import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDB } from '@/database/db';
import { initDatabase } from '@/database/db';

export interface ExportData {
  version: number;
  exported_at: string;
  transactions: any[];
  categories: any[];
  split_expenses: any[];
  settlements: any[];
  members: any[];
  budgets: any[];
  savings_goals: any[];
  user: any;
}

// ── EXPORT ─────────────────────────────────────────────────────────────────
export async function exportToJSON(): Promise<void> {
  const db = getDB();

  const data: ExportData = {
    version:       1,
    exported_at:   new Date().toISOString(),
    transactions:  db.getAllSync('SELECT * FROM transactions ORDER BY date DESC;'),
    categories:    db.getAllSync('SELECT * FROM categories;'),
    split_expenses:db.getAllSync('SELECT * FROM split_expenses;'),
    settlements:   db.getAllSync('SELECT * FROM settlements;'),
    members:       db.getAllSync('SELECT * FROM members;'),
    budgets:       db.getAllSync('SELECT * FROM budgets;'),
    savings_goals: db.getAllSync('SELECT * FROM savings_goals;'),
    user:          db.getFirstSync('SELECT * FROM users LIMIT 1;'),
  };

  const json     = JSON.stringify(data, null, 2);
  const fileName = `pocket_backup_${new Date().toISOString().slice(0, 10)}.json`;
  const filePath = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: 'Export Pocket Data',
    });
  }
}

// ── EXPORT CSV ─────────────────────────────────────────────────────────────
export async function exportToCSV(): Promise<void> {
  const db   = getDB();
  const rows = db.getAllSync<any>(
    `SELECT t.id, t.type, t.amount, c.name as category, t.description,
            t.date, t.time, t.payment_method, t.created_at
     FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
     ORDER BY t.date DESC;`
  );

  const header = 'ID,Type,Amount,Category,Description,Date,Time,Payment Method,Created\n';
  const body   = rows.map(r =>
    [r.id, r.type, r.amount, `"${r.category ?? ''}"`,
     `"${(r.description ?? '').replace(/"/g, '""')}"`,
     r.date, r.time, r.payment_method, r.created_at
    ].join(',')
  ).join('\n');

  const csv      = header + body;
  const fileName = `pocket_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
  const filePath = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Transactions CSV',
    });
  }
}

// ── IMPORT ─────────────────────────────────────────────────────────────────
export async function importFromJSON(): Promise<{ success: boolean; message: string }> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return { success: false, message: 'Import cancelled.' };
    }

    const uri     = result.assets[0].uri;
    const content = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const data: ExportData = JSON.parse(content);
    if (!data.version || !data.transactions) {
      return { success: false, message: 'Invalid backup file.' };
    }

    const db = getDB();

    // Wipe & re-init
    db.execSync('DELETE FROM settlements;');
    db.execSync('DELETE FROM split_expenses;');
    db.execSync('DELETE FROM transactions;');
    db.execSync('DELETE FROM members;');
    db.execSync('DELETE FROM budgets;');
    db.execSync('DELETE FROM savings_goals;');

    // Restore categories (merge — don't delete custom user categories)
    for (const c of data.categories ?? []) {
      const existing = db.getFirstSync<{ id: number }>(
        'SELECT id FROM categories WHERE name = ?;', [c.name]
      );
      if (!existing) {
        db.runSync(
          'INSERT INTO categories (id, name, icon, color, type) VALUES (?, ?, ?, ?, ?);',
          [c.id, c.name, c.icon, c.color, c.type]
        );
      }
    }

    // Restore transactions
    for (const t of data.transactions ?? []) {
      db.runSync(
        `INSERT OR IGNORE INTO transactions
           (id, type, amount, category_id, description, date, time, payment_method, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [t.id, t.type, t.amount, t.category_id, t.description,
         t.date, t.time, t.payment_method, t.created_at]
      );
    }

    // Restore members
    for (const m of data.members ?? []) {
      db.runSync(
        'INSERT OR IGNORE INTO members (id, name, group_name, created_at) VALUES (?, ?, ?, ?);',
        [m.id, m.name, m.group_name, m.created_at]
      );
    }

    // Restore splits
    for (const s of data.split_expenses ?? []) {
      db.runSync(
        `INSERT OR IGNORE INTO split_expenses
           (id, total_amount, payer_share, category_id, description, date, num_members, split_mode, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [s.id, s.total_amount, s.payer_share, s.category_id, s.description,
         s.date, s.num_members, s.split_mode, s.created_at]
      );
    }

    // Restore settlements
    for (const s of data.settlements ?? []) {
      db.runSync(
        `INSERT OR IGNORE INTO settlements
           (id, split_id, member_id, amount_owed, status, settled_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [s.id, s.split_id, s.member_id, s.amount_owed, s.status, s.settled_at, s.created_at]
      );
    }

    // Restore budgets & savings goals
    for (const b of data.budgets ?? []) {
      db.runSync(
        'INSERT OR IGNORE INTO budgets (id, category_id, monthly_limit, month, created_at) VALUES (?, ?, ?, ?, ?);',
        [b.id, b.category_id, b.monthly_limit, b.month, b.created_at]
      );
    }

    for (const g of data.savings_goals ?? []) {
      db.runSync(
        'INSERT OR IGNORE INTO savings_goals (id, name, target_amount, current_amount, deadline, created_at) VALUES (?, ?, ?, ?, ?, ?);',
        [g.id, g.name, g.target_amount, g.current_amount, g.deadline, g.created_at]
      );
    }

    // Restore user preferences (don't overwrite name if set)
    if (data.user) {
      db.runSync(
        'UPDATE users SET currency=?, theme=?, reminder_enabled=?, reminder_time=?, monthly_budget=? WHERE id=1;',
        [data.user.currency ?? '₹', data.user.theme ?? 'dark',
         data.user.reminder_enabled ?? 1, data.user.reminder_time ?? '21:00',
         data.user.monthly_budget ?? 0]
      );
    }

    const txCount = (data.transactions ?? []).length;
    return { success: true, message: `Imported ${txCount} transactions successfully.` };
  } catch (err: any) {
    return { success: false, message: `Import failed: ${err.message}` };
  }
}
