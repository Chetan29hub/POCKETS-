# Pocket — Setup & Run Guide

## Prerequisites

- Node.js 18+ (you have 24.14.1 ✓)
- npm 9+ (you have 11.6.0 ✓)
- Android Studio + Android SDK (for device/emulator)
- Android device with USB debugging ON, or Android emulator running

---

## Step 1 — Install dependencies

Open a terminal in `D:\WEBDEV_projects\POCKET` and run:

```bash
npm install
```

If npm install stalls, try:
```bash
npm install --prefer-offline
# or with legacy peer deps if there are conflicts:
npm install --legacy-peer-deps
```

---

## Step 2 — Install Expo CLI globally

```bash
npm install -g expo-cli eas-cli
```

---

## Step 3 — Add placeholder assets

Expo requires icon/splash images. Create simple placeholder PNGs (or copy any 1024x1024 PNG) at:

```
assets/icon.png              (1024x1024)
assets/splash.png            (1284x2778)
assets/adaptive-icon.png     (1024x1024)
assets/notification-icon.png (96x96, white on transparent)
```

Quick way using ImageMagick (if installed):
```bash
magick convert -size 1024x1024 xc:#8B5CF6 assets/icon.png
magick convert -size 1024x1024 xc:#8B5CF6 assets/adaptive-icon.png
magick convert -size 1284x2778 xc:#0A0A0F assets/splash.png
magick convert -size 96x96     xc:#FFFFFF assets/notification-icon.png
```

Or just copy any PNG file and rename it to match the above names.

---

## Step 4 — Start development server

```bash
npx expo start
```

Then press `a` to open on Android emulator, or scan the QR with Expo Go on your device.

---

## Step 5 — Run on physical Android device

1. Enable Developer Options on your Android phone
2. Enable USB Debugging
3. Connect via USB
4. Run:

```bash
npx expo run:android
```

---

## Step 6 — Build APK for distribution

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo (free account)
eas login

# Configure build
eas build:configure

# Build APK (local, no Expo cloud needed)
npx expo run:android --variant release

# Or build via EAS cloud
eas build --platform android --profile preview
```

---

## Project Structure

```
POCKET/
├── App.tsx                          ← Entry point
├── app.json                         ← Expo config
├── babel.config.js                  ← Path aliases (@/)
├── tsconfig.json
├── assets/
└── src/
    ├── features/
    │   ├── dashboard/               DashboardScreen
    │   ├── expense/                 AddExpenseSheet, EditTransactionScreen
    │   ├── history/                 HistoryScreen, SearchScreen
    │   ├── analytics/               AnalyticsScreen
    │   ├── split/                   SplitExpenseScreen, SplitDetailScreen
    │   ├── settlements/             SettlementsScreen
    │   └── profile/                 ProfileScreen
    ├── components/                  Shared UI: Text, Card, Button, BottomSheet…
    ├── navigation/                  AppNavigator, TabBar
    ├── database/                    SQLite schema, db.ts, queries/
    ├── store/                       Zustand slices
    ├── services/                    insightsEngine, exportImport, notifications
    ├── hooks/                       useTheme, useCurrency
    ├── utils/                       dateHelpers, categoryIcons
    └── theme/                       colors, typography, spacing
```

---

## Key Design Decisions

### Split Expense Math
When you pay ₹500 for 5 people (equal split = ₹100/person):
- **Your transaction** recorded: ₹100 (your share only)
- **Settlements table**: 4 rows, ₹100 each — never touches your balance until marked paid
- Balance formula: `SUM(income) - SUM(expense)` from transactions table only

### All Balances are Live SQL Aggregates
Balance, income totals, expense totals — all computed via `SUM()` queries. Never stored as a running counter.

### Offline-First
No network calls anywhere. All data lives in `pocket.db` (expo-sqlite, WAL mode). Export/Import uses device file system only.

---

## Common Issues

**`@/` path alias not resolving**
→ Make sure `babel.config.js` has `babel-plugin-module-resolver`. Run `npm install babel-plugin-module-resolver --save-dev`

**`expo-sqlite` sync API errors**
→ Requires Expo SDK 50+. Confirm with `npx expo --version`. If below 50, use `expo upgrade`.

**Gesture Handler not working**
→ Ensure `import 'react-native-gesture-handler'` is the FIRST import in `App.tsx` ✓ (already done)

**Charts not rendering**
→ `react-native-svg` must be installed. Run `npx expo install react-native-svg`

**Notification permissions on Android 13+**
→ The app requests POST_NOTIFICATIONS at runtime via `expo-notifications`. Accept when prompted.

---

## Dependencies Reference

| Package | Purpose |
|---|---|
| expo-sqlite | Local SQLite database |
| expo-notifications | Daily reminders |
| expo-file-system | Export/Import file I/O |
| expo-sharing | Share exported files |
| expo-document-picker | Pick import file |
| expo-linear-gradient | Hero gradient on Dashboard |
| @react-navigation/* | Navigation stack + bottom tabs |
| react-native-reanimated | Smooth animations |
| react-native-gesture-handler | Swipe gestures |
| react-native-chart-kit | Pie/Bar/Line charts |
| react-native-svg | Required by chart-kit |
| zustand | State management |
| @react-native-async-storage/async-storage | Theme preference |
| lucide-react-native | Icons |
| date-fns | Date formatting/math |
| babel-plugin-module-resolver | `@/` path aliases |
