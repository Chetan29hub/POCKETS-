export const CREATE_TABLES_SQL = [
  // ── Users (single local profile) ──────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL DEFAULT 'You',
    currency    TEXT    NOT NULL DEFAULT '₹',
    theme       TEXT    NOT NULL DEFAULT 'dark',
    reminder_enabled INTEGER NOT NULL DEFAULT 1,
    reminder_time    TEXT    NOT NULL DEFAULT '21:00',
    monthly_budget   REAL    NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );`,

  // ── Categories ─────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS categories (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT    NOT NULL UNIQUE,
    icon  TEXT    NOT NULL,
    color TEXT    NOT NULL,
    type  TEXT    NOT NULL DEFAULT 'expense'
  );`,

  // ── Transactions ───────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS transactions (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    type           TEXT    NOT NULL CHECK(type IN ('income','expense')),
    amount         REAL    NOT NULL CHECK(amount > 0),
    category_id    INTEGER REFERENCES categories(id),
    description    TEXT,
    date           TEXT    NOT NULL,
    time           TEXT    NOT NULL,
    payment_method TEXT    NOT NULL DEFAULT 'cash',
    created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
  );`,

  // ── Members ────────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS members (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    group_name TEXT,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );`,

  // ── Split Expenses ─────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS split_expenses (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    total_amount REAL    NOT NULL,
    payer_share  REAL    NOT NULL,
    category_id  INTEGER REFERENCES categories(id),
    description  TEXT,
    date         TEXT    NOT NULL,
    num_members  INTEGER NOT NULL,
    split_mode   TEXT    NOT NULL DEFAULT 'equal',
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );`,

  // ── Settlements ────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS settlements (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    split_id     INTEGER NOT NULL REFERENCES split_expenses(id) ON DELETE CASCADE,
    member_id    INTEGER NOT NULL REFERENCES members(id),
    amount_owed  REAL    NOT NULL,
    status       TEXT    NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid')),
    settled_at   TEXT,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );`,

  // ── Budgets ────────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS budgets (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id   INTEGER REFERENCES categories(id),
    monthly_limit REAL    NOT NULL,
    month         TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );`,

  // ── Savings Goals ──────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS savings_goals (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    name           TEXT    NOT NULL,
    target_amount  REAL    NOT NULL,
    current_amount REAL    NOT NULL DEFAULT 0,
    deadline       TEXT,
    created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
  );`,
];

// ── Default categories seed ────────────────────────────────────────────────
export const SEED_CATEGORIES = [
  { name: 'Food',          icon: 'UtensilsCrossed', color: '#F97316', type: 'expense' },
  { name: 'Travel',        icon: 'Plane',           color: '#06B6D4', type: 'expense' },
  { name: 'Fuel',          icon: 'Fuel',            color: '#EF4444', type: 'expense' },
  { name: 'Rent',          icon: 'Home',            color: '#8B5CF6', type: 'expense' },
  { name: 'Education',     icon: 'GraduationCap',   color: '#3B82F6', type: 'expense' },
  { name: 'Shopping',      icon: 'ShoppingBag',     color: '#EC4899', type: 'expense' },
  { name: 'Medical',       icon: 'HeartPulse',      color: '#EF4444', type: 'expense' },
  { name: 'Recharge',      icon: 'Smartphone',      color: '#10B981', type: 'expense' },
  { name: 'Bills',         icon: 'Receipt',         color: '#F59E0B', type: 'expense' },
  { name: 'Entertainment', icon: 'Clapperboard',    color: '#A855F7', type: 'expense' },
  { name: 'Investment',    icon: 'TrendingUp',      color: '#22C55E', type: 'expense' },
  { name: 'Snacks',        icon: 'Cookie',          color: '#FB923C', type: 'expense' },
  { name: 'Others',        icon: 'MoreHorizontal',  color: '#6B7280', type: 'expense' },
  { name: 'Salary',        icon: 'Banknote',        color: '#22C55E', type: 'income'  },
  { name: 'Freelance',     icon: 'Briefcase',       color: '#06B6D4', type: 'income'  },
  { name: 'Gift',          icon: 'Gift',            color: '#EC4899', type: 'income'  },
  { name: 'Business',      icon: 'Building2',       color: '#8B5CF6', type: 'income'  },
  { name: 'Other Income',  icon: 'CirclePlus',      color: '#6B7280', type: 'income'  },
];
