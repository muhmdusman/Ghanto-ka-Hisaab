'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the PWA Install component to avoid SSR issues
const PWAInstallComponent = dynamic(
  () => import('@khmyznikov/pwa-install/dist/react-legacy/pwa-install.react-legacy.js'),
  { ssr: false }
);

export default function PWAInstallPrompt() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <PWAInstallComponent
      manifestUrl="/manifest.json"
      icon="/pwa-logo.png"
      name="The Timely"
      description="Track your time with intention"
      installDescription="Install this app on your device for extensive experience and easy access."
    />
  );
}
