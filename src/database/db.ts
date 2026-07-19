import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, SEED_CATEGORIES } from './schema';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDB(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('pocket.db');
  }
  return _db;
}

export async function initDatabase(): Promise<void> {
  const db = getDB();

  // Enable WAL mode for performance
  db.execSync('PRAGMA journal_mode = WAL;');
  db.execSync('PRAGMA foreign_keys = ON;');

  // Create all tables
  for (const sql of CREATE_TABLES_SQL) {
    db.execSync(sql);
  }

  // Seed default user if not exists
  const userCount = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM users;'
  );
  if (!userCount || userCount.count === 0) {
    db.runSync('INSERT INTO users (name, currency, theme) VALUES (?, ?, ?);',
      ['You', '₹', 'dark']
    );
  }

  // Seed default categories if not exists
  const catCount = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories;'
  );
  if (!catCount || catCount.count === 0) {
    for (const cat of SEED_CATEGORIES) {
      db.runSync(
        'INSERT INTO categories (name, icon, color, type) VALUES (?, ?, ?, ?);',
        [cat.name, cat.icon, cat.color, cat.type]
      );
    }
  }
}
