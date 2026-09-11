# VY Service

```
VY-Service/
├── backend/   # Express API + Supabase migration tools
└── mobile/    # Expo React Native app
```

## Mobile app

```bash
cd mobile
npm install
npm start
```

## Backend (optional local API)

```bash
cd backend
npm install
npm run dev
```

The mobile app talks to **Supabase** directly (not Railway).

## Mobile UI design system

All visual styling lives in `mobile/ui/Theme.js` (colors, spacing, radii, typography, shadows, tones).
Screens are composed from the shared components in `mobile/components/`:

- Layout: `Screen`, `AppHeader`, `AppFooter`, `AppCard`, `FormSection`, `SectionHeader`
- Inputs: `AppInput`, `SearchBar`, `ChoiceChips`, `ToggleRow`, `PhoneNumbersField`
- Actions: `AppButton`, `IconButton`, `ActionCardButton`
- Feedback: `Banner`, `StatusBadge`, `EmptyState`, `LoadingState`, `AppModal`
- Data: `StatCard`, `InfoRow`, `Avatar`, `SegmentedTabs`, `AttendanceCalendar`, `ContactPickerModal`, `BrandMark`

`mobile/utils/theme.js` re-exports the same tokens for older imports.
