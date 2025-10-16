## Frontend Refactor Plan: Adopt Material UI (MUI) Across the App

### Goals
- Replace ad-hoc HTML/Tailwind UI with consistent MUI components and theming.
- Centralize design decisions in a single MUI theme (colors, typography, spacing).
- Reduce custom UI surface area and duplicated styles; improve accessibility and DX.

### Current State (observed)
- MUI packages installed: `@mui/material@^7`, `@mui/icons-material@^7`, `@emotion/react`, `@emotion/styled`.
- No MUI imports in the codebase; UI built with Tailwind utility classes and custom components.

### Target Architecture
- App-wide `ThemeProvider` and `CssBaseline` in `src/main.tsx`.
- Design tokens live in `src/theme/index.ts` (palette, typography, shape, spacing, components overrides).
- Prefer `sx` prop for one-off styles; use `styled` for reusable styled components.
- Replace custom primitives with MUI counterparts; keep business components thin.

### Dependencies
Already present. If needed:
```bash
npm i @mui/material @mui/icons-material @emotion/react @emotion/styled
```

### Theme Setup
Create `src/theme/index.ts`:
```ts
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0ea5e9' }, // match current brand if applicable
    secondary: { main: '#7c3aed' },
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    success: { main: '#22c55e' },
    info: { main: '#3b82f6' },
    background: { default: '#f8fafc' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif',
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
  },
});
```

Wrap app in `ThemeProvider` (`src/main.tsx`):
```tsx
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';

<ThemeProvider theme={theme}>
  <CssBaseline />
  <App />
</ThemeProvider>
```

### Component Mapping (Tailwind/custom ➜ MUI)
- Layout/navigation
  - Sidebar/Header/Footer: `AppBar`, `Toolbar`, `Drawer`, `List`, `ListItem`, `Divider`, `Box`, `Container`.
  - Grid/stacking: `Grid`, `Stack`, `Box`, `Container`.
- Typography
  - `h1`-`h6`, paragraphs, labels: `Typography`.
- Buttons & actions
  - Buttons/links/icons: `Button`, `IconButton`, `LoadingButton` (from `@mui/lab` if desired), `Link`.
- Form controls
  - Inputs: `TextField`, `Select`, `MenuItem`, `Autocomplete`, `Checkbox`, `Radio`, `Switch`, `Slider`, `DatePicker` (lab/x-date-pickers), `FormControl`, `FormLabel`, `FormHelperText`.
  - Custom `MultiSelect.tsx`: replace with `Autocomplete multiple` or `Select multiple` + `Checkbox`.
  - `FistContentSelector.tsx`: use `Autocomplete`, `Chip`, `FormControl`.
- Status/feedback
  - `StatusBadge.tsx`: `Chip` or `Badge` with color props mapped from status.
  - Loading: `CircularProgress`, `LinearProgress`; replace `LoadingSpinner.tsx`.
  - Errors/alerts: `Alert`, `Snackbar`.
- Data display
  - Note: `CommonTable.tsx` will remain as-is (no migration planned).
  - Cards/containers: `Card`, `CardHeader`, `CardContent`, `Paper`.
  - Avatars/icons: `Avatar`, `SvgIcon`, `@mui/icons-material` icons.
- Overlays
  - Modals: `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions` for `*Modal.tsx` files.
  - Menus: `Menu`, `MenuItem`, `Popover`.

### Styling Strategy
- Prefer `sx` for component-scoped styles, e.g. `<Box sx={{ p: 2, display: 'flex' }} />`.
- Use theme tokens instead of raw hex/px when possible.
- Create small wrappers where Tailwind utility classes encoded semantics (e.g., `PageContainer`, `Section` using `Container`/`Paper`).
- Remove Tailwind from components as they are migrated. Consider keeping Tailwind during transition to avoid blocking changes; remove from `devDependencies` at the end.

### Accessibility
- Benefit from MUI’s ARIA-compliant components.
- Ensure labels and `aria-*` props are preserved when migrating custom controls.

### Forms and Validation
- Keep existing validation strategy. If using custom, continue; optionally adopt `react-hook-form` with MUI bindings later.
- Leverage `helperText`, `error` props for validation states.

### Tables
- No change: keep existing `CommonTable.tsx` implementation.

### Notifications
- Replace custom toasts with MUI `Snackbar` + `Alert`.

### Icons
- Replace `heroicons`/`lucide-react` usages gradually with `@mui/icons-material` for consistency.

### Migration Plan (Phased)
1) Foundation
   - Add `src/theme/index.ts` and wrap app in `ThemeProvider` + `CssBaseline`.
   - Introduce `PageContainer` and `SectionCard` wrappers (based on `Container`/`Card`).
2) Shared primitives
   - Replace `LoadingSpinner.tsx` ➜ `CircularProgress`.
   - Replace `ErrorMessage.tsx` ➜ `Alert`.
   - Replace `StatusBadge.tsx` ➜ `Chip` mapping.
   - Replace `MultiSelect.tsx` ➜ `Autocomplete multiple`.
3) Layout
   - `MainLayout.tsx`, `Sidebar.tsx`, `Footer.tsx` ➜ `AppBar`/`Drawer`/`List`.
4) Modals
   - `FistContentModal.tsx`, `MusicContentModal.tsx`, `WeightClassModal.tsx`, `CompetitionModal.tsx` ➜ `Dialog`.
5) Tables
   - No changes to `CommonTable.tsx`.
6) Feature pages
   - Pages under `pages/*` ➜ wrap content with MUI layout components and replace form controls.
7) Cleanup
   - Remove remaining Tailwind classes; delete Tailwind config and deps.

### File-by-File Checklist (initial high-value targets)
- `src/components/common/LoadingSpinner.tsx` ➜ use `CircularProgress`.
- `src/components/common/ErrorMessage.tsx` ➜ use `Alert`.
- `src/components/common/StatusBadge.tsx` ➜ `Chip` mapping by status.
- `src/components/common/MultiSelect.tsx` ➜ `Autocomplete multiple`.
// `src/components/common/CommonTable.tsx` ➜ unchanged.
- `src/components/common/FistContentSelector.tsx` ➜ `Autocomplete`, `Chip`, `FormControl`.
- `src/components/layout/MainLayout.tsx` ➜ `AppBar` + `Drawer`.
- `src/components/layout/Sidebar.tsx` ➜ `Drawer`, `List`, `ListItemButton`.
- `src/components/layout/Footer.tsx` ➜ `Box`, `Container`, `Typography`.
- Pages in `src/pages/*` ➜ replace forms with `TextField`, `Select`, `Button`, `Stack`.

### Coding Conventions
- Use named imports from `@mui/material` and `@mui/icons-material`.
- Prefer composition over overriding component classes; reach for `components` overrides in theme for global tweaks.
- Limit custom CSS; if needed, colocate with component using `styled`.

### Risks & Mitigations
- Visual regressions: validate with visual QA per page; use side-by-side screenshots if possible.
- Behavior differences (focus, keyboard nav): test forms/tables thoroughly.
- Bundle size: tree-shake imports; avoid unnecessary icon imports.

### Rollout Strategy
- Branch per feature migration; open small PRs for quick review.
- Keep Tailwind until majority is migrated; then remove from `devDependencies`, `postcss.config.js`, and purge utility classes.
- Document any shared wrapper components created during migration.

### Tailwind Removal (final sweep)
- Remove Tailwind classes from components.
- Delete `tailwind.config.js`, Tailwind-related PostCSS plugins, and `@tailwind` directives in `index.css`/`App.css`.
- Uninstall `tailwindcss`, `@tailwindcss/postcss`.

### Success Criteria
- 0 usages of Tailwind utility classes in `src/`.
- App runs with a single `ThemeProvider` and `CssBaseline`.
- All shared components leverage MUI equivalents.


