# TECH-STACK.md

## Recommended Stack

This stack is designed to balance:
- speed of delivery
- maintainability
- performance
- future scalability
- ability to add native enhancements where needed

---

## Frontend

- React Native
- TypeScript
- React Navigation
- Zustand or Redux Toolkit
- TanStack Query
- React Hook Form
- Zod
- Reanimated
- Gesture Handler
- FlashList

---

## Local Persistence

### MVP
- MMKV for settings, flags, lightweight persistence
- AsyncStorage only if simplicity matters more than speed

### Growth Path
- SQLite / WatermelonDB / Realm if structured local dream data becomes more complex and heavy

---

## Backend Options

### Fast MVP Recommendation
- Supabase
- PostgreSQL
- Auth
- Storage
- Edge Functions

### More Custom Control
- Node.js
- NestJS
- PostgreSQL
- Prisma
- Redis

### Ecosystem Speed Option
- Firebase Auth
- Firestore
- Cloud Functions
- Cloud Storage

---

## Supporting Tools

- Sentry for crash and error tracking
- CI via GitHub Actions
- EAS or native build pipeline depending on setup
- Figma for design handoff
- RevenueCat later for subscriptions if needed

---

## Recommendation

For a solo or small-team build, a strong default path is:
- React Native + TypeScript
- Zustand
- React Hook Form + Zod
- MMKV
- Supabase later when cloud is needed
- Sentry
- GitHub Actions

This gives speed without locking the project into a weak architecture.
