# Ghanto ka Hisaab

<p align="center">
  <img src="public/android-chrome-192x192.png" alt="Ghanto ka Hisaab app icon" width="96" height="96" />
</p>

<p align="center">
  <strong>A Next.js + Supabase PWA for tracking hours, habits, attendance, and offline daily progress.</strong>
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16.3.6-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=06131f" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres-3ECF8E?style=for-the-badge&logo=supabase&logoColor=073b2f" />
  <img alt="Cloudflare Workers" src="https://img.shields.io/badge/Cloudflare_Workers-OpenNext-F38020?style=for-the-badge&logo=cloudflareworkers&logoColor=white" />
  <img alt="PWA" src="https://img.shields.io/badge/PWA-offline_ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" />
</p>

## Overview

Ghanto ka Hisaab helps track how time is spent across the day, with offline-first behavior for unreliable networks and multiple views for daily review. It combines an hour-by-hour dashboard, habit tracking, stats, and an admin attendance helper in one App Router project.

## Features

- Hour-by-hour tracking with notes, tags, and calendar navigation
- Daily tracker at `/tracker-new` for user-defined habits and tasks
- Statistics dashboard at `/stats` for hours and tracker progress
- Admin attendance helper at `/attendance`
- Supabase authentication and user-scoped data
- Offline queueing and IndexedDB-backed cached entries
- PWA install prompt, service worker lifecycle handling, and offline fallback route
- Cloudflare Workers deployment through OpenNext
- Graphify output for codebase exploration in `graphify-out/`

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19, TypeScript, Tailwind CSS 4 |
| Auth and database | Supabase Auth + Postgres |
| Offline support | IndexedDB, `next-pwa`, Workbox runtime caching |
| Deployment | OpenNext for Cloudflare Workers, Wrangler |
| Tooling | ESLint, npm, Graphify reports |

## App Routes

| Route | Purpose |
| --- | --- |
| `/` | Main hour-tracking dashboard with calendar, tags, notes, and sync support |
| `/tracker-new` | Daily tracker for user-defined items and completion status |
| `/stats` | Analytics for tracked hours and tracker entries |
| `/settings` | Sign-out, sync visibility, and local pending-data cleanup |
| `/attendance` | Admin-only attendance helper |
| `/login`, `/signup` | Auth entry points |
| `/auth/callback` | Supabase OAuth callback route |
| `/_offline` | Offline fallback page served by the PWA setup |

## Local Development

### Prerequisites

- Node.js 20 or newer recommended
- npm
- Supabase project URL and anon key

### Install

```bash
npm install
```

### Environment

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

For Cloudflare/OpenNext local preview, `.dev.vars` is used for Worker-specific development variables.

### Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

### Build

```bash
npm run build
npm start
```

PWA behavior is only fully active in production builds.

## Cloudflare Deployment

The app deploys to Cloudflare Workers through OpenNext. Use the project scripts rather than raw `wrangler deploy` for this Next.js app:

```bash
npm run deploy
```

Recommended Cloudflare Workers Builds settings:

| Setting | Value |
| --- | --- |
| Build command | Leave empty, or use `npm run build` only if you intentionally want a separate Next build check |
| Deploy command | `npm run deploy` |
| Preview command | `npm run preview` |

See [docs/deployment.md](docs/deployment.md) for more details.

## Offline and PWA Behavior

PWA behavior is configured in [next.config.ts](next.config.ts):

- Production builds generate `public/sw.js`
- Document requests use `NetworkFirst`
- `/_next/static/*` assets use `CacheFirst`
- Styles, scripts, fonts, images, and workers use `StaleWhileRevalidate`
- Failed document navigations fall back to `/_offline`

Offline data is handled separately from the service worker. Pending and cached user data is stored through [utils/offlineSync.ts](utils/offlineSync.ts), which lets tracking continue while the network is unavailable.

PWA helper components:

- [components/PWALifecycleManager.tsx](components/PWALifecycleManager.tsx)
- [components/PWAInstallPrompt.tsx](components/PWAInstallPrompt.tsx)
- [components/PWADebugger.tsx](components/PWADebugger.tsx)

## Database

Supabase is used for browser auth/session handling and user-scoped records.

Schema files:

- [supabase-schema.sql](supabase-schema.sql)
- [supabase-tracker-schema.sql](supabase-tracker-schema.sql)

Note: the app has used both `tracker_entries` and `tracker_logs` naming in tracker-related code/schema over time. Review the active tracker schema before setting up a fresh database.

## Project Structure

```text
app/                 App Router pages and routes
components/          Shared UI and PWA components
utils/               Offline sync and Supabase utilities
lib/                 Shared helpers
public/              Icons, manifest, service worker artifacts
graphify-out/        Generated codebase graph and report
docs/                Deployment and maintenance notes
```

## Graphify Notes

This repo includes a Graphify knowledge graph at `graphify-out/`:

- [graphify-out/GRAPH_REPORT.md](graphify-out/GRAPH_REPORT.md)
- [graphify-out/graph.html](graphify-out/graph.html)
- [graphify-out/graph.json](graphify-out/graph.json)

If `graphify` is installed, refresh the graph after code changes with:

```bash
graphify update .
```

## Related Docs

- [PWA_DOCUMENTATION.md](PWA_DOCUMENTATION.md)
- [PWA_SIMPLE_GUIDE.md](PWA_SIMPLE_GUIDE.md)
- [TRACKER_FEATURE_SUMMARY.md](TRACKER_FEATURE_SUMMARY.md)
- [docs/deployment.md](docs/deployment.md)

## License

See [LICENSE](LICENSE).
