# Code standards

Every rule here comes with a reason. A rule without a reason gets ignored the first
time it is inconvenient, and it deserves to be.

## Size and boundaries

**1. A file over 400 lines is a signal. Over 600 it gets split.**
Large files hide their own structure. Nobody reads 900 lines before editing line 700,
so edits get made without understanding what else is in there.

**2. A component renders one thing.**
If a file is named `…Sections` and runs 900 lines, it is not a component, it is a
folder that forgot to become one.

**3. `model/` holds pure functions only.**
No React, no native modules, no I/O. This is what makes the product's real logic
testable without mounting anything or mocking a platform.

**4. Dependencies flow one way:** `screens → hooks → services → repository → storage`.
Imports go rightward only. A backward import means persistence can break a screen, and
that the two can no longer be reasoned about separately.

**5. Copy is split by feature.**
`constants/copy/dreams.ts` is 1546 lines. It should be `copy/dreams/capture.ts`,
`copy/dreams/detail.ts`, and so on. A single file that every feature edits is a merge
conflict generator.

## Types

**6. No `any`.**
Where a type is genuinely unknown, use `unknown` and narrow it with Zod. `any` does not
describe uncertainty — it switches the type checker off and hides the uncertainty.

**7. Exported functions declare their return type.**
Inference is fine inside a module. At a module boundary an explicit type is the contract,
and it stops an accidental change from silently rippling outward.

**8. No `@ts-ignore`. `@ts-expect-error` only with a comment explaining why.**
`@ts-ignore` stays silent forever, including after the underlying problem is fixed.
`@ts-expect-error` fails once the error goes away, which is the behaviour you want.

## Naming and readability

**9. Helpers are named for intent, not mechanism.**
`src/services/haptics/hapticService.ts` is the model: call sites say `hapticSave()`,
not `trigger('notificationSuccess', options)`. The intent survives a library swap; the
mechanism does not.

**10. Comments explain why, not what.**
A comment restating the code goes stale and adds nothing. A comment explaining a
non-obvious constraint saves the next reader an hour.

**11. No `console.*` outside `src/services/observability/`.**
Use the observability layer. Console calls do not reach a crash reporter, cannot be
filtered by level, and ship to production unnoticed. The console provider itself is the
one place allowed to call it, because printing is what it is for.

## Tests

**12. Every function in `model/` has a test.**
It is pure logic with no setup cost. There is no excuse available.

**13. Every service has tests for success, failure, and one edge case.**
Services touch I/O, which is where the failures actually live. A service tested only on
its happy path is untested.

**14. A bug fix starts with a failing test.**
Write the test that reproduces the bug, watch it fail, then fix it. Without that step
there is no evidence the fix addresses the reported problem rather than something
nearby.

**15. Hooks and screens get behavioural tests.**
Currently only `react-test-renderer` is available, which limits what can be asserted.
`@testing-library/react-native` is scheduled to be added.

**16. Coverage is measured before it is targeted.**
Run it, record the number, make it a floor in CI, raise it deliberately. A number chosen
before measuring — "let's say 80%" — teaches people to write tests that raise coverage
rather than tests that catch bugs.

**17. Tests assert behaviour, not implementation.**
A test that breaks during a refactor which changed no behaviour was testing the wrong
thing, and it will be deleted rather than fixed.

## CI gates

**18. `typecheck`, `test` and `lint` block a merge.**
A check that does not block is a suggestion.

**19. `--max-warnings=0` switches on only after the existing warnings are cleared.**
There are 23 today, all inline styles. Turning the gate on first would make CI red from
day one, and a permanently red gate trains everyone to ignore it.

**20. Formatting is checked, never mixed with logic.**
A formatting change shares a commit with nothing else, so review and `git bisect` stay
usable.

**21. Coverage may not drop.**
A ratchet, not a target.

## Current baseline

Measured 2026-07-28. These numbers move in one direction.

| Metric | Value | Goal |
|---|---|---|
| Modules in `src/` | 244 | — |
| Test files | 47 | rises with rule 12 |
| Tests | 200 | — |
| Coverage — statements | 35.49% | ratchets up |
| Coverage — branches | 33.01% | ratchets up |
| Coverage — functions | 30.49% | ratchets up |
| Coverage — lines | 35.95% | ratchets up |
| `any` | 12 | 0 |
| `@ts-ignore` / `@ts-expect-error` | 0 | stays 0 |
| `TODO` / `FIXME` | 0 | stays 0 |
| `console.*` outside observability | 0 | stays 0 |
| Lint errors | 0 | stays 0 |
| Lint warnings | 23 | 0, then gate on |
| Files over 400 lines | 45 | falls |
| Files over 600 lines | 21 | 0 |

Coverage is measured across all of `src/`, not only the files the suites happen to
import. The distinction matters: reported against imported files alone the number reads
around 67%, and against the whole codebase it is 35%. The lower number is the one worth
moving, because untested files are exactly what a coverage figure should reveal.

The largest gaps in pure logic, where rule 12 applies most directly:
`features/dreams/model/archiveBrowser.ts` (17%),
`features/stats/model/statsScreenModel.ts` (34%),
`features/dreams/model/dreamAnalytics.ts` (42%).

Oversized files are not being split in one pass — a diff that large would hide
regressions from concurrent upgrade work. Rule 1 applies to new code and to any file
opened for another reason.

The largest offenders today:

| File | Lines |
|---|---|
| `constants/copy/dreams.ts` | 1546 |
| `features/dreams/screens/HomeScreen.styles.ts` | 1192 |
| `features/stats/screens/StatsScreen.styles.ts` | 1099 |
| `constants/copy/settings.ts` | 1055 |
| `constants/copy/stats.ts` | 938 |
| `services/cloud/sync.ts` | 930 |
