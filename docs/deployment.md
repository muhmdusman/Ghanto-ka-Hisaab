# Cloudflare Deployment Guide

The Timely is a Next.js application, so deployment needs an OpenNext conversion step before Wrangler uploads the Worker. Use the npm scripts in this repository instead of calling `wrangler deploy` directly.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run build` | Runs a regular Next.js production build. Useful as a standalone check. |
| `npm run preview` | Builds the OpenNext Worker output and starts a Cloudflare preview flow. |
| `npm run deploy` | Builds the OpenNext Worker output and deploys it to Cloudflare Workers. |
| `npm run cf-typegen` | Generates Cloudflare Worker environment types from Wrangler config. |

## Recommended Cloudflare Workers Builds Settings

| Setting | Value |
| --- | --- |
| Root directory | Repository root, unless the project is nested in a monorepo checkout |
| Build command | Leave empty, or use `npm run build` only when you want a separate Next build check |
| Deploy command | `npm run deploy` |
| Preview command | `npm run preview` |

`npm run deploy` already runs the OpenNext build, so setting Cloudflare's Build command to `npm run build` makes CI build the app twice. That is valid, but slower.

## Why Not Raw Wrangler Deploy?

This command is not enough for this project:

```bash
npx wrangler deploy
```

Raw Wrangler deploy is appropriate for plain Worker projects. This app needs OpenNext to transform the Next.js output into `.open-next/worker.js` first. The configured deploy script handles that step:

```bash
WRANGLER_BUILD_CONDITIONS= WRANGLER_BUILD_PLATFORM=node opennextjs-cloudflare build && opennextjs-cloudflare deploy
```

The `WRANGLER_BUILD_PLATFORM=node` setting helps Wrangler resolve Node-oriented package exports during the bundle step.

## Required Config Files

- [wrangler.jsonc](../wrangler.jsonc): Worker name, entrypoint, assets binding, compatibility date, and `nodejs_compat`
- [open-next.config.ts](../open-next.config.ts): OpenNext Cloudflare adapter config
- [public/_headers](../public/_headers): Static asset caching headers
- [.dev.vars](../.dev.vars): Local Worker development variables

## Environment Variables

Set these in Cloudflare for production/preview environments:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Do not rely on `.env.local` in Cloudflare CI. Add required values in the Cloudflare dashboard as build variables or Worker variables/secrets.

## Troubleshooting

### OpenNext bundle cannot resolve a package

Check that:

- `@opennextjs/cloudflare` is installed
- `wrangler` is installed
- `next` satisfies the adapter peer range
- Cloudflare uses `npm run deploy`, not `npx wrangler deploy`

### Wrangler says malformed API response or returns 522

If the log shows something like this:

```text
Received a malformed response from the API
GET /accounts/.../workers/services/... -> 522
```

then the app build succeeded and Cloudflare's API returned an HTML timeout page instead of JSON. Retry the deployment. If it persists, report the Cloudflare Ray ID from the build log to Cloudflare support or the Wrangler issue tracker.

### Build succeeds but deploy cannot find worker output

Make sure the deploy command runs OpenNext before Wrangler upload:

```bash
npm run deploy
```

The deploy output should include:

```text
Worker saved in `.open-next/worker.js`
OpenNext build complete.
```
