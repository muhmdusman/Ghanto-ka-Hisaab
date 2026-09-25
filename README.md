# Ghanto ka Hisaab

<p align="center">
  <img src="public/logo.png" alt="Ghanto ka Hisaab logo" width="96" height="96" />
</p>

<p align="center">
  <strong>Know where your hours actually go.</strong>
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16.3.6-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=06131f" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres-3ECF8E?style=for-the-badge&logo=supabase&logoColor=073b2f" />
  <img alt="Cloudflare Workers" src="https://img.shields.io/badge/Cloudflare_Workers-OpenNext-F38020?style=for-the-badge&logo=cloudflareworkers&logoColor=white" />
  <img alt="PWA" src="https://img.shields.io/badge/PWA-offline_ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-111827?style=for-the-badge" />
</p>

## Why this exists

It is easy to lose time without noticing it. Sometimes an hour disappears while sitting idle, scrolling, or hanging out with friends longer than planned. By the end of the day, it can be hard to remember where the time went.

Ghanto ka Hisaab solves that by making each hour visible. You log the day hour by hour, attach predefined or custom tags, add notes when needed, and then review the statistics to see where your time is productive, necessary, idle, or wasted.

The goal is not guilt. The goal is awareness: track your hours, understand your patterns, and get more out of your time.

## How it works

1. Open the dashboard and pick the day/hour you want to log.
2. Choose from predefined tags or add new tags for your own routines.
3. Add optional details for context.
4. Review statistics to see where your hours are going.
5. Use the pattern to reduce time waste and protect better parts of your day.

## Current features

- Hour-wise tracking for every day
- Predefined task/tag support
- Custom tag creation
- Optional notes/details on hour entries
- Calendar-based daily review
- Statistics for logged hours, active days, averages, and tag distribution
- Supabase authentication and user-scoped records
- Offline-first support with IndexedDB-backed local data handling
- Installable PWA experience with custom install prompt
- Admin attendance helper at `/attendance`
- Cloudflare Workers deployment through OpenNext

## Future roadmap

- AI review model for weekly hour records
- Recommendations for where time is being wasted
- Suggestions for opportunities to avoid idle time
- Smarter summaries of recurring patterns
- More actionable weekly productivity insights

Example future flow: the AI model reads the last week's hour logs, detects repeated idle blocks or low-value patterns, and recommends practical ways to avoid the same time waste next week.

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19, TypeScript, Tailwind CSS 4 |
| Auth and database | Supabase Auth + Postgres |
| Offline support | IndexedDB, `next-pwa`, Workbox runtime caching |
| Deployment | OpenNext for Cloudflare Workers, Wrangler |
| Tooling | ESLint, npm, Graphify reports |

## App routes

| Route | Purpose |
| --- | --- |
| `/` | Main hour-tracking dashboard with calendar, tags, notes, and sync support |
| `/stats` | Analytics for tracked hours and tag distribution |
| `/settings` | Sign-out, sync visibility, and local pending-data cleanup |
| `/attendance` | Admin-only attendance helper |
| `/login`, `/signup` | Auth entry points |
| `/auth/callback` | Supabase OAuth callback route |
| `/_offline` | Offline fallback page served by the PWA setup |

## Local development

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

### Run locally

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

## Cloudflare deployment

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

See [docs/deployment.md](docs/deployment.md) for details.

## Offline and PWA behavior

PWA behavior is configured in [next.config.ts](next.config.ts). The unified guide is now in [docs/pwa.md](docs/pwa.md).

Important pieces:

- [components/PWALifecycleManager.tsx](components/PWALifecycleManager.tsx)
- [components/PWAInstallPrompt.tsx](components/PWAInstallPrompt.tsx)
- [components/PWADebugger.tsx](components/PWADebugger.tsx)
- [utils/offlineSync.ts](utils/offlineSync.ts)
- [app/_offline/page.tsx](app/_offline/page.tsx)

## Database

Supabase is used for browser auth/session handling and user-scoped records.

Database schema is managed in Supabase using the project SQL scripts used during setup. Keep those scripts aligned with the active tables before deploying a fresh database.

## Project structure

```text
app/                 App Router pages and routes
components/          Shared UI and PWA components
utils/               Offline sync and Supabase utilities
lib/                 Shared helpers
public/              Logo, favicons, manifest, service-worker artifacts
docs/                Deployment and PWA documentation
graphify-out/        Generated codebase graph and report
```

## Graphify notes

This repo includes a Graphify knowledge graph at `graphify-out/`:

- [graphify-out/GRAPH_REPORT.md](graphify-out/GRAPH_REPORT.md)
- [graphify-out/graph.html](graphify-out/graph.html)
- [graphify-out/graph.json](graphify-out/graph.json)

If `graphify` is installed, refresh the graph after code changes with:

```bash
graphify update .
```

## Docs

- [docs/deployment.md](docs/deployment.md)
- [docs/pwa.md](docs/pwa.md)

## License

This project is licensed under the [MIT License](LICENSE).
