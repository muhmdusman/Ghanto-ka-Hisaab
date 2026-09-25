# PWA Icon & Install Dialog Update

## Changes Made

### 1. Icon Generation
- Created a script (`scripts/generate-icons.mjs`) to automatically generate all PWA icons from `public/pwa-logo.png`
- Generated the following icon sizes:
  - `android-chrome-192x192.png` (192x192)
  - `android-chrome-512x512.png` (512x512)
  - `apple-touch-icon.png` (180x180)
  - `favicon-32x32.png` (32x32)
  - `favicon-16x16.png` (16x16)
  - `favicon.ico` (32x32)

All icons are now using your pwa-logo.png as the source, so the branding will be consistent across all platforms.

### 2. PWA Install Dialog Redesign
Completely redesigned `components/PWAInstallPrompt.tsx` to match a modern, sleek dialog design:

**Design Features:**
- ✨ Centered modal dialog with backdrop overlay
- 🎨 Clean, minimalist design with proper spacing
- 🖼️ Displays the pwa-logo.png (80x80) in a rounded card
- 📱 Shows app name "The Timely" and domain
- 📝 Descriptive text: "This site has app functionality. Install it on your device for extensive experience and easy access."
- 🎯 Two-button layout: "MORE" and "INSTALL"
- ❌ Close button in top-right corner
- 🌗 Full dark mode support
- ✨ Smooth animations (fade-in backdrop, scale-in dialog)

### 3. Animations Added
Added new animations to `app/globals.css`:
- `animate-fade-in` - For backdrop overlay
- `animate-scale-in` - For dialog appearance with smooth scaling

### 4. Manifest Verification
The `public/manifest.json` already correctly points to:
- `/favicon_io/android-chrome-192x192.png` (192x192) 
- `/favicon_io/android-chrome-512x512.png` (512x512)
- Both icons marked with `"purpose": "any maskable"` for proper display

## Testing Checklist

✅ Build completes successfully
✅ Icons generated from pwa-logo.png
✅ Install dialog shows pwa-logo.png
✅ Dialog design matches reference (sleek, centered, modern)
✅ Dark mode support working

## Next Steps

1. **Test on device**: Install the PWA on your mobile device or desktop to verify the icon appears correctly
2. **Verify install prompt**: Trigger the install prompt (may require clearing browser data if previously dismissed)
3. **Check installed app icon**: After installing, verify the app icon on your home screen/app drawer shows the pwa-logo correctly

## Regenerating Icons

If you need to update the pwa-logo.png in the future, simply run:

```bash
node scripts/generate-icons.mjs
```

This will regenerate all icon sizes from the current pwa-logo.png file.
