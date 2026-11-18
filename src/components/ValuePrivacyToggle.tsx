"use client";

import { useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";
import { VALUE_PRIVACY_EVENT, VALUE_PRIVACY_KEY } from "@/lib/valuePrivacy";

function subscribe(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key !== VALUE_PRIVACY_KEY && event.key !== null) return;
    try {
      document.documentElement.dataset.privateValues =
        window.localStorage.getItem(VALUE_PRIVACY_KEY) === "true" ? "true" : "false";
    } catch { /* Keep the current view when browser storage is unavailable. */ }
    onChange();
  }
  window.addEventListener(VALUE_PRIVACY_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(VALUE_PRIVACY_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  return document.documentElement.dataset.privateValues === "true";
}

export default function ValuePrivacyToggle({ locale }: { locale: Locale }) {
  const hidden = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const label = locale === "de"
    ? hidden ? "Werte anzeigen" : "Werte verbergen"
    : hidden ? "Show values" : "Hide values";

  function toggle() {
    const next = !getSnapshot();
    document.documentElement.dataset.privateValues = String(next);
    try { window.localStorage.setItem(VALUE_PRIVACY_KEY, String(next)); }
    catch { /* The toggle also works without persistent storage. */ }
    window.dispatchEvent(new Event(VALUE_PRIVACY_EVENT));
  }

  return <button
    type="button"
    data-header-privacy
    className="header-settings-action header-privacy-action"
    aria-label={label}
    title={label}
    aria-pressed={hidden}
    onClick={toggle}
  >
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {hidden && <path d="m3 3 18 18" />}
    </svg>
  </button>;
}
