"use client";

import { useEffect, useState } from "react";

import { BrandMark } from "@/components/BrandLogo";
import type { Locale } from "@/i18n/config";

const DISMISSED_STORAGE_KEY = "eavesence-pwa-install-dismissed-v1";
const DISMISS_FOR_MS = 30 * 24 * 60 * 60 * 1_000;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const copy = {
  de: {
    ariaLabel: "EAVESENCE als App installieren",
    title: "Mein Zuhause direkt vom Startbildschirm öffnen",
    text: "Installiere EAVESENCE wie eine App. Deine Daten bleiben weiterhin lokal auf diesem Gerät.",
    ios: "Tippe in Safari auf Teilen und anschließend auf „Zum Home-Bildschirm“.",
    browser: "Öffne das Browsermenü und wähle „App installieren“ oder „Zum Startbildschirm hinzufügen“.",
    install: "App installieren",
    dismiss: "Später",
  },
  en: {
    ariaLabel: "Install EAVESENCE as an app",
    title: "Open My home directly from your home screen",
    text: "Install EAVESENCE like an app. Your data still stays locally on this device.",
    ios: "In Safari, tap Share and then “Add to Home Screen”.",
    browser: "Open your browser menu and choose “Install app” or “Add to Home screen”.",
    install: "Install app",
    dismiss: "Maybe later",
  },
} as const;

function isStandaloneMode() {
  const iosNavigator = navigator as Navigator & { standalone?: boolean };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    iosNavigator.standalone === true
  );
}

export default function PwaInstallCard({ locale }: { locale: Locale }) {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const text = copy[locale];
  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  useEffect(() => {
    const dismissedAt = Number.parseInt(
      window.localStorage.getItem(DISMISSED_STORAGE_KEY) ?? "0",
      10,
    );
    const recentlyDismissed =
      Number.isFinite(dismissedAt) && Date.now() - dismissedAt < DISMISS_FOR_MS;

    if (isStandaloneMode() || recentlyDismissed) return;

    const visibilityFrame = window.requestAnimationFrame(() => setVisible(true));

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => setVisible(false);

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.cancelAnimationFrame(visibilityFrame);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (!visible) return null;

  async function install() {
    if (!installEvent) return;

    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);

    if (choice.outcome === "accepted") setVisible(false);
  }

  function dismiss() {
    window.localStorage.setItem(DISMISSED_STORAGE_KEY, String(Date.now()));
    setVisible(false);
  }

  return (
    <section
      aria-label={text.ariaLabel}
      data-pwa-install-card
      className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#cfe7d7] bg-[#f8fcf8] p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
          <BrandMark className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-[14px] font-bold tracking-[-0.02em] text-[#17211f]">
            {text.title}
          </h2>
          <p className="mt-1 max-w-3xl text-[13px] leading-5 text-[#65716d]">
            {text.text}
          </p>
          {!installEvent && (
            <p className="mt-1 text-[11px] leading-4 text-[#74807b]">
              {isIOS ? text.ios : text.browser}
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
        {installEvent && (
          <button
            type="button"
            onClick={install}
            className="eavesence-pill-button home-dashboard-action active:scale-[0.98]"
          >
            {text.install}
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="eavesence-pill-button home-compact-action bg-[#eef0ec] text-[#65716d] hover:bg-white hover:text-[#17211f]"
        >
          {text.dismiss}
        </button>
      </div>
    </section>
  );
}
