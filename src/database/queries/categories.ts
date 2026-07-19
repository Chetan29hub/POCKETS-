import { getDB } from '../db';
import type { Category } from '../types';

export function fetchAllCategories(): Category[] {
  return getDB().getAllSync<Category>(
    'SELECT * FROM categories ORDER BY type, name;'
  );
}

export function fetchCategoriesByType(type: 'income' | 'expense'): Category[] {
  return getDB().getAllSync<Category>(
    'SELECT * FROM categories WHERE type = ? OR type = ? ORDER BY name;',
    [type, 'both']
  );
}

export function fetchCategoryById(id: number): Category | null {
  return getDB().getFirstSync<Category>(
    'SELECT * FROM categories WHERE id = ?;', [id]
  ) ?? null;
}

export function insertCategory(name: string, icon: string, color: string, type: string): number {
  const result = getDB().runSync(
    'INSERT INTO categories (name, icon, color, type) VALUES (?, ?, ?, ?);',
    [name, icon, color, type]
  );
  return result.lastInsertRowId;
}
