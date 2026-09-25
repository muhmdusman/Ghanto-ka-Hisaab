'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) return null;

  return (
    <aside
      role="dialog"
      aria-label="Install Ghanto ka Hisaab"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-[1.25rem] border border-zinc-200 bg-white/95 p-4 shadow-[0_20px_70px_rgba(24,24,27,0.18)] backdrop-blur md:bottom-6 md:right-6 md:left-auto md:mx-0"
    >
      <div className="flex items-start gap-4">
        <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-zinc-950 shadow-[0_10px_24px_rgba(24,24,27,0.16)]">
          <Image src="/logo.png" alt="" width={38} height={38} className="size-9 object-contain" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black tracking-tight text-zinc-950">Install Ghanto ka Hisaab</p>
              <p className="mt-1 text-sm leading-5 text-zinc-600">
                Add the app for faster access and a cleaner full-screen workspace.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="-mr-1 grid size-8 shrink-0 place-items-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
              aria-label="Dismiss install prompt"
            >
              <span aria-hidden="true" className="text-lg leading-none">×</span>
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleInstallClick}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-bold text-white shadow-[0_10px_24px_rgba(24,24,27,0.18)] transition hover:-translate-y-0.5 hover:bg-zinc-800 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-zinc-900/15"
            >
              Install app
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex h-10 items-center justify-center rounded-xl px-3 text-sm font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
