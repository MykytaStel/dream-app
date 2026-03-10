# Code Style

## Goal

Keep code readable, predictable, and easy to refactor without adding style churn.

## React components and hooks

- Prefer top-level named function declarations for screens, hooks, and pure helpers.
- Use arrow functions mostly for inline callbacks and memoized handlers.
- Keep one exported component or hook per file unless two exports clearly belong together.
- A screen should read like composition, not like a 900-line control tower.

## React hook usage

- Keep hook style consistent inside a file.
- In this repo, `React.useState`, `React.useMemo`, and similar namespace calls are acceptable.
- If we later migrate to named hook imports, do it file-by-file or feature-by-feature, not partially in one file.
- Do not add `useMemo` or `useCallback` by default. Use them only when they help:
  expensive derived data, stable child props, list rendering pressure, or theme style factories.

## Styles

- Put larger or theme-aware styles in `*.styles.ts`.
- Keep inline styles only for very small one-off layout tweaks.
- Reuse shared surface helpers instead of inventing one-off pills and cards in every feature.
- Memoize theme style factories with `useMemo`.

## File structure

- `screens/`: orchestration and layout
- `components/`: presentational UI
- `hooks/`: use-case state and UI-facing actions
- `model/`: pure derived logic, selectors, formatters
- `services/`: device APIs, storage, share, notifications
- `repository/`: local data access

## Effects and side effects

- Keep alerts, storage writes, repository mutations, and device APIs out of presentational components.
- Put side effects in hooks or services.
- Keep model helpers pure and deterministic.

## Lists and performance

- Prefer `FlatList` or `SectionList` for long content.
- Avoid `ScrollView + map` for large arrays.
- Move heavy derived calculations out of JSX and into model helpers.
- Use `useDeferredValue`, `startTransition`, and list virtualization where they clearly help.

## Naming

- Prefer explicit names over clever ones.
- Use feature context in names:
  `useArchiveBrowseState`, `homeOverview`, `monthlyReportPresentation`.
- Avoid generic dumping grounds like `utils.ts` when logic clearly belongs to a feature.
