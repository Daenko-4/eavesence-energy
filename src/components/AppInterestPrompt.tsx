"use client";

import { track } from "@vercel/analytics";
import { useState, useSyncExternalStore } from "react";

import type { Locale } from "@/i18n/config";

const STORAGE_KEY = "eavesence-app-interest";

const copy = {
  de: {
    eyebrow: "EAVESENCE als App",
    question: "Würdest du EAVESENCE auch als App nutzen?",
    detail: "Deine Antwort hilft uns zu entscheiden, was wir als Nächstes entwickeln.",
    yes: "Ja, würde ich",
    notYet: "Noch nicht",
    thanks: "Danke – das hilft uns bei der nächsten Entscheidung.",
  },
  en: {
    eyebrow: "EAVESENCE as an app",
    question: "Would you also use EAVESENCE as an app?",
    detail: "Your answer helps us decide what to build next.",
    yes: "Yes, I would",
    notYet: "Not yet",
    thanks: "Thank you – this helps us make the next decision.",
  },
} as const;

type AppInterestPromptProps = {
  locale: Locale;
};

const subscribeToHydration = () => () => {};

export default function AppInterestPrompt({ locale }: AppInterestPromptProps) {
  const [answer, setAnswer] = useState<"yes" | "not_yet" | null>(null);
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const text = copy[locale];

  const storedAnswer = hydrated
    ? window.localStorage.getItem(STORAGE_KEY)
    : null;
  const effectiveAnswer =
    answer ??
    (storedAnswer === "yes" || storedAnswer === "not_yet"
      ? storedAnswer
      : null);

  function submitAnswer(nextAnswer: "yes" | "not_yet") {
    window.localStorage.setItem(STORAGE_KEY, nextAnswer);
    setAnswer(nextAnswer);
    track("App Interest Answered", {
      answer: nextAnswer,
      locale,
    });
  }

  if (!hydrated) return null;
  if (!answer && effectiveAnswer) return null;

  return (
    <section className="px-5 py-8 sm:px-6 sm:py-10" aria-label={text.eyebrow}>
      <div className="mx-auto flex max-w-7xl flex-col gap-5 border-y border-slate-200/80 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--brand-green)]">
            {text.eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-extrabold tracking-[-0.03em] text-[#07111f] sm:text-2xl">
            {text.question}
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-600">{text.detail}</p>
        </div>

        {effectiveAnswer ? (
          <p className="max-w-sm text-sm font-semibold leading-6 text-[var(--brand-green)]" role="status">
            {text.thanks}
          </p>
        ) : (
          <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2">
            <button
              type="button"
              onClick={() => submitAnswer("yes")}
              className="min-h-11 rounded-full bg-[var(--brand-green)] px-5 text-sm font-bold text-white transition hover:bg-[var(--brand-green-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-green)] focus-visible:ring-offset-2"
            >
              {text.yes}
            </button>
            <button
              type="button"
              onClick={() => submitAnswer("not_yet")}
              className="min-h-11 text-sm font-bold text-slate-500 transition hover:text-[var(--brand-green)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-green)] focus-visible:ring-offset-2"
            >
              {text.notYet}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
