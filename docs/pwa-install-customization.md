# PWA Install Component - Customization Guide

## Quick Reference

### Current Configuration

Location: `components/PWAInstallPrompt.tsx`

```tsx
<PWAInstallComponent
  manifestUrl="/manifest.json"
  icon="/pwa-logo.png"
  name="The Timely"
  description="Track your time with intention"
  installDescription="Install this app on your device for extensive experience and easy access."
/>
```

## Available Props

### Basic Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `manifestUrl` | string | `/manifest.json` | Path to your web manifest |
| `icon` | string | - | App icon URL (recommended 512x512) |
| `name` | string | - | App name to display |
| `description` | string | - | Short app description |
| `installDescription` | string | - | Text shown during install |

### Advanced Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `disableScreenshots` | boolean | false | Hide screenshot gallery |
| `disableChrome` | boolean | false | Disable Chrome install detection |
| `manualApple` | boolean | false | Manual iOS install instructions |
| `manualChrome` | boolean | false | Manual Chrome instructions |
| `disableInstallDescription` | boolean | false | Hide install description text |

## Styling Customization

### Color Scheme
Edit `app/globals.css` to change colors:

```css
pwa-install {
  /* Dialog styling */
  --pwa-install-dialog-background: white;
  --pwa-install-dialog-color: #18181b;
  --pwa-install-dialog-border-radius: 16px;
  
  /* Overlay */
  --pwa-install-overlay-background: rgba(0, 0, 0, 0.7);
  
  /* Button styling */
  --pwa-install-button-background: #2563eb;
  --pwa-install-button-color: white;
  --pwa-install-button-hover-background: #1d4ed8;
  --pwa-install-button-border-radius: 8px;
}
```

### Dark Mode
Automatic dark mode support:

```css
.dark pwa-install {
  --pwa-install-dialog-background: #18181b;
  --pwa-install-dialog-color: #fafafa;
  --pwa-install-button-background: #3b82f6;
}
```

### Shadow Parts
Use CSS shadow parts for granular styling:

```css
/* Style the dialog container */
pwa-install::part(dialog) {
  max-width: 380px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

/* Style the app icon */
pwa-install::part(icon) {
  width: 80px;
  height: 80px;
  border-radius: 16px;
}

/* Style the install button */
pwa-install::part(install-button) {
  font-weight: 600;
  text-transform: uppercase;
  padding: 12px 24px;
}

/* Style the close button */
pwa-install::part(close-button) {
  opacity: 0.5;
}
```

## Event Handling

### Listen to Install Events

```tsx
import { useEffect, useRef } from 'react';

export default function PWAInstallPrompt() {
  const pwaRef = useRef<any>(null);

  useEffect(() => {
    const handleSuccess = (e: CustomEvent) => {
      console.log('PWA installed successfully!', e.detail);
      // Track analytics, show success message, etc.
    };

    const handleFail = (e: CustomEvent) => {
      console.log('PWA install failed', e.detail);
      // Handle error, show message, etc.
    };

    const handleAvailable = (e: CustomEvent) => {
      console.log('PWA install available', e.detail);
      // Track that prompt was shown
    };

    const element = pwaRef.current;
    if (element) {
      element.addEventListener('pwa-install-success-event', handleSuccess);
      element.addEventListener('pwa-install-fail-event', handleFail);
      element.addEventListener('pwa-install-available-event', handleAvailable);
    }

    return () => {
      if (element) {
        element.removeEventListener('pwa-install-success-event', handleSuccess);
        element.removeEventListener('pwa-install-fail-event', handleFail);
        element.removeEventListener('pwa-install-available-event', handleAvailable);
      }
    };
  }, []);

  return <PWAInstallComponent ref={pwaRef} {...props} />;
}
```

## Manual Control

### Show/Hide Programmatically

```tsx
import { useRef } from 'react';

export default function PWAInstallPrompt() {
  const pwaRef = useRef<any>(null);

  const showInstallPrompt = () => {
    pwaRef.current?.showDialog();
  };

  const hideInstallPrompt = () => {
    pwaRef.current?.hideDialog();
  };

  return (
    <>
      <button onClick={showInstallPrompt}>Install App</button>
      <PWAInstallComponent ref={pwaRef} manualChrome={true} />
    </>
  );
}
```

## Screenshots Gallery

### Add App Screenshots

1. Create screenshots of your app (recommended: 540x720 or 720x1280)
2. Add them to `public/screenshots/` folder
3. Update manifest.json:

```json
{
  "screenshots": [
    {
      "src": "/screenshots/dashboard.png",
      "sizes": "540x720",
      "type": "image/png",
      "label": "Dashboard view"
    },
    {
      "src": "/screenshots/tracker.png",
      "sizes": "540x720",
      "type": "image/png",
      "label": "Time tracker"
    }
  ]
}
```

The component will automatically display the gallery!

## Platform-Specific Behavior

### iOS Safari
Shows manual installation instructions:
1. Tap Share button
2. Tap "Add to Home Screen"
3. Tap "Add"

### Chrome/Edge
Triggers native browser install prompt

### Firefox
Shows manual instructions with browser-specific steps

### Samsung Internet
Triggers native install prompt

## Common Customizations

### Change Button Text

The button text is controlled by browser language. To customize, you'd need to:
1. Set `manualChrome={true}` to use custom UI
2. Create your own button with `showDialog()` method

### Change Icon Size

```css
pwa-install::part(icon) {
  width: 100px;
  height: 100px;
}
```

### Change Dialog Width

```css
pwa-install::part(dialog) {
  max-width: 500px;
  width: 95%;
}
```

### Add Animation

```css
pwa-install::part(dialog) {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

## Troubleshooting

### Prompt Not Showing
- Ensure you're on HTTPS (or localhost)
- Check that manifest.json is valid
- Verify service worker is registered
- Clear browser cache and try again
- Check browser console for errors

### Icon Not Displaying
- Verify `/pwa-logo.png` exists and is accessible
- Check icon size (recommended 512x512 minimum)
- Ensure icon has correct MIME type (image/png)

### Styling Not Applying
- Check CSS specificity
- Use `!important` if needed (last resort)
- Verify CSS variables are set correctly
- Use browser DevTools to inspect shadow DOM

## Resources

- [Package Documentation](https://www.npmjs.com/package/@khmyznikov/pwa-install)
- [Live Demo](https://khmyznikov.com/pwa-install/)
- [GitHub Issues](https://github.com/khmyznikov/pwa-install/issues)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)

## Support

For issues specific to this package:
- [GitHub Issues](https://github.com/khmyznikov/pwa-install/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/pwa-install)
