"use client";

import { useEffect, useRef, useState } from "react";

import type { Locale } from "@/i18n/config";

const copy = {
  de: {
    offline: "Offline · Deine lokalen Daten bleiben verfügbar",
    online: "Wieder online",
  },
  en: {
    offline: "Offline · Your local data remains available",
    online: "Back online",
  },
} as const;

type ConnectivityState = "unknown" | "online" | "offline" | "restored";

export default function ConnectivityStatus({ locale }: { locale: Locale }) {
  const [state, setState] = useState<ConnectivityState>("unknown");
  const restoredTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const text = copy[locale];

  useEffect(() => {
    const initialFrame = window.requestAnimationFrame(() => {
      setState(navigator.onLine ? "online" : "offline");
    });

    const clearRestoredTimer = () => {
      if (!restoredTimerRef.current) return;
      clearTimeout(restoredTimerRef.current);
      restoredTimerRef.current = null;
    };
    const handleOffline = () => {
      clearRestoredTimer();
      setState("offline");
    };
    const handleOnline = () => {
      setState((current) => (current === "offline" ? "restored" : "online"));
      clearRestoredTimer();
      restoredTimerRef.current = setTimeout(() => {
        setState("online");
        restoredTimerRef.current = null;
      }, 3_000);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.cancelAnimationFrame(initialFrame);
      clearRestoredTimer();
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (state !== "offline" && state !== "restored") return null;

  return (
    <div
      role="status"
      data-connectivity-status={state}
      className={`connectivity-status fixed left-1/2 z-[95] -translate-x-1/2 rounded-full px-3 py-1.5 text-[11px] font-bold shadow-sm ${state === "offline" ? "bg-[#17211f] text-white" : "border border-[#b8efcc] bg-[#eefbf3] text-[var(--brand-green)]"}`}
    >
      {state === "offline" ? text.offline : text.online}
    </div>
  );
}
