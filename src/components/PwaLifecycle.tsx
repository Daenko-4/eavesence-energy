"use client";

import { useEffect, useRef, useState } from "react";

type Copy = {
  message: string;
  refresh: string;
};

const copy: Record<"de" | "en", Copy> = {
  de: {
    message: "Eine neue Version von EAVESENCE ist verfügbar.",
    refresh: "Jetzt aktualisieren",
  },
  en: {
    message: "A new version of EAVESENCE is available.",
    refresh: "Update now",
  },
};

export default function PwaLifecycle() {
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const refreshingRef = useRef(false);

  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    let disposed = false;

    const handleControllerChange = () => {
      if (refreshingRef.current) return;
      refreshingRef.current = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange,
    );

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((nextRegistration) => {
        if (disposed) return;

        setRegistration(nextRegistration);
        setUpdateAvailable(Boolean(nextRegistration.waiting));

        nextRegistration.addEventListener("updatefound", () => {
          const installingWorker = nextRegistration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener("statechange", () => {
            if (
              installingWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setUpdateAvailable(true);
            }
          });
        });
      })
      .catch(() => {
        // The website remains fully usable when service workers are unavailable.
      });

    return () => {
      disposed = true;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange,
      );
    };
  }, []);

  if (!updateAvailable) return null;

  const locale =
    typeof window !== "undefined" && window.location.pathname.startsWith("/de")
      ? "de"
      : "en";
  const text = copy[locale];

  function applyUpdate() {
    const waitingWorker = registration?.waiting;
    if (!waitingWorker) {
      window.location.reload();
      return;
    }

    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-[80] mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border border-[#b8efcc] bg-[#f7fff9] p-4 shadow-[0_18px_55px_-28px_rgba(8,67,43,0.55)] sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-[13px] font-semibold leading-5 text-[#17211f]">
        {text.message}
      </p>
      <button
        type="button"
        onClick={applyUpdate}
        className="home-primary-action inline-flex min-h-9 shrink-0 items-center justify-center rounded-full border border-[#b8efcc] bg-[#dcfce8] px-3 text-[var(--brand-green)] transition hover:border-[#98e9b7] hover:bg-[#c9f7d9]"
      >
        {text.refresh}
      </button>
    </aside>
  );
}
