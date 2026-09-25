# PWA Guide

The Timely is built as a Progressive Web App so the tracker stays quick to open, installable, and usable even when the network is unreliable.

## What the PWA adds

- Installable app experience on supported desktop and mobile browsers
- Branded icon and standalone window through `public/manifest.json`
- Offline fallback route at `/_offline`
- Service worker generation through `next-pwa` and Workbox
- Runtime caching for pages, static assets, fonts, images, scripts, workers, and styles
- Local pending-data support through IndexedDB utilities in `utils/offlineSync.ts`

## How it works

A PWA has three main pieces:

| Piece | Role in this app |
| --- | --- |
| Web app manifest | Defines app name, icons, theme color, display mode, and install behavior |
| Service worker | Intercepts requests and serves cached assets when network access is poor |
| Cache storage | Stores pages and static assets so repeat visits load faster |

The service worker handles shell-level reliability. The app's own offline sync layer handles user data that still needs to be saved or merged later.

## Current configuration

PWA behavior is configured in [next.config.ts](../next.config.ts):

- `dest: 'public'` writes generated service-worker files into `public/`
- Development disables PWA behavior to avoid cache confusion while coding
- Document requests use `NetworkFirst`
- `/_next/static/*` assets use `CacheFirst`
- Styles, scripts, fonts, images, and workers use `StaleWhileRevalidate`
- Failed document requests fall back to `/_offline`

The app manifest is [public/manifest.json](../public/manifest.json). The app icons live at the public root, including [public/android-chrome-192x192.png](../public/android-chrome-192x192.png), [public/android-chrome-512x512.png](../public/android-chrome-512x512.png), and the favicon files.

## Main PWA components

| Component | Purpose |
| --- | --- |
| [components/PWALifecycleManager.tsx](../components/PWALifecycleManager.tsx) | Registers the service worker and handles update lifecycle behavior |
| [components/PWAInstallPrompt.tsx](../components/PWAInstallPrompt.tsx) | Shows the custom install prompt when the browser exposes `beforeinstallprompt` |
| [components/PWADebugger.tsx](../components/PWADebugger.tsx) | Development-only status panel for service worker and cache debugging |
| [app/_offline/page.tsx](../app/_offline/page.tsx) | Offline fallback page shown when navigation cannot be served from network/cache |

## Offline data behavior

The service worker can keep the app shell available, but user-entered tracking data needs a separate strategy. That is handled by [utils/offlineSync.ts](../utils/offlineSync.ts), which manages IndexedDB-backed cached entries and pending sync actions.

This means the app can still be useful when connectivity drops:

1. The installed app opens from the device launcher.
2. Previously cached UI/assets load from the service worker.
3. Cached hour data can be shown from IndexedDB.
4. New or edited entries can be queued locally.
5. When the network returns, pending changes can sync back to Supabase.

## Install prompt behavior

The install prompt appears only when the browser decides the app is installable. Common requirements include:

- HTTPS or localhost
- Valid manifest
- Registered service worker
- User has not already installed the app
- Browser-specific engagement criteria have been met

The custom prompt does not install the app by itself. It stores the browser's `beforeinstallprompt` event and calls `prompt()` when the user chooses `Install app`.

## Testing checklist

Before deploying PWA changes, verify:

- `npm run build` completes successfully
- `public/manifest.json` is valid and points to existing icons
- app icons and favicon files exist in `public/`
- `/_offline` renders
- Chrome DevTools Application tab shows a registered service worker
- The app loads after toggling DevTools Network to Offline
- The custom install prompt still appears on supported browsers after engagement criteria are met

## Troubleshooting

### Install prompt does not show

Check that the app is not already installed, the browser supports `beforeinstallprompt`, the site is served over HTTPS, and the manifest/service worker are valid.

### Offline navigation fails

Check that `sw.js` exists after a production build, the service worker is active, and `/_offline` is available.

### Old UI keeps appearing after deployment

A stale service worker cache may be active. In development, use the PWA debugger or Chrome DevTools Application tab to unregister the worker and clear storage.

### Build creates changed service-worker files

Production builds may regenerate `public/sw.js` and fallback files. Only commit those generated artifacts when you intentionally want to update the checked-in service-worker output.
