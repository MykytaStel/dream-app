# Architecture Patterns

## Goal

Keep screens thin, derived logic pure, and side effects isolated so new product work does not keep inflating single files.

## Feature-first structure

Within a feature, prefer this split:

- `screens/`
  Screen-level orchestration and layout only.
- `components/`
  Presentational sections and reusable feature UI blocks.
- `hooks/`
  Screen or use-case state, orchestration, and UI-facing actions.
- `model/`
  Pure selectors, formatters, derived data, and domain calculations.
- `services/`
  Device APIs, storage, sharing, notifications, imports, exports.
- `repository/`
  CRUD access to local domain data.

## Rules

- A screen should not talk directly to storage or repositories unless there is a strong reason.
- A component should not own product flow orchestration or persistence logic.
- A model file must stay pure and deterministic.
- A service should not know about UI components.
- A hook can coordinate services, repositories, and model helpers, then expose UI-ready state.

## Code conventions

- Prefer top-level named function declarations for screens, hooks, and pure helpers.
- Use arrow functions mostly for inline callbacks and memoized handlers.
- Keep styles in `*.styles.ts` when they are shared, theme-aware, or larger than a few local rules.
- Small one-off layout tweaks can stay inline only if they are truly local and do not repeat.
- Theme-based style factories should be memoized with `useMemo`.
- Keep hook imports consistent within the repo. If we migrate from `React.use...` to named imports, do it feature-by-feature, not half-and-half in one file.
- Default to no memoization unless there is clear value:
  expensive derived data, stable callback identity for child props, or list rendering pressure.
- Put formatting, labels, and derived summaries in `model/`, not inside JSX-heavy screen files.
- Prefer `FlatList` or `SectionList` over `ScrollView + map` for long content.

## Current examples

- `Home`
  - `screens/HomeScreen.tsx`
  - `hooks/useHomeScreenData.ts`
  - `hooks/useHomeTimelineState.ts`
  - `hooks/useHomeSwipeActions.ts`
  - `model/homeOverview.ts`
- `Archive`
  - `screens/ArchiveScreen.tsx`
  - `hooks/useArchiveScreenData.ts`
  - `hooks/useArchiveBrowseState.ts`
  - `model/archiveBrowser.ts`
- `Settings`
  - `screens/SettingsScreen.tsx`
  - `hooks/useSettingsScreenController.ts`
  - `model/settingsPresentation.ts`
- `Insights`
  - `screens/StatsScreen.tsx`
  - `hooks/useStatsScreenController.ts`
  - `model/statsScreenModel.ts`

## Refactor target shape

For large screens, the preferred end state is:

1. `screen`
   Binds navigation, theme, layout, and section composition.
2. `controller hook`
   Owns local state, async actions, and UI-facing callbacks.
3. `model helpers`
   Build labels, summaries, filters, and derived metrics.
4. `section components`
   Render the screen in chunks without side effects.

## Anti-patterns to avoid

- 800-1000 line screen files
- inline formatting helpers duplicated across screens
- `Alert`, storage, repository calls, and rendering all mixed in one file
- components that fetch or mutate data directly
- generic `utils/` dumping grounds with no feature ownership

## Next refactor targets

- `MonthlyReportScreen`
- remaining large stats/support screens
