"use client";
import { useEffect, useState } from "react";
import CostImportPanel from "./CostImportPanel";
import {
  readHouseholdCosts,
  type HouseholdCost,
} from "@eavesence/core/householdCosts";
export default function ImportPage() {
  const [context, setContext] = useState<{
      costs: HouseholdCost[];
      currency: string;
      locale: "de" | "en";
    }>({ costs: [], currency: "EUR", locale: "en" }),
    [ready, setReady] = useState(false);
  useEffect(() => {
    const receive = (e: Event) => {
      const c = (e as CustomEvent).detail;
      if (
        c &&
        Array.isArray(c.costs) &&
        ["EUR", "CHF"].includes(c.currency) &&
        ["de", "en"].includes(c.locale)
      ) {
        setContext({
          ...c,
          costs: readHouseholdCosts(JSON.stringify(c.costs)),
        });
        setReady(true);
      }
    };
    window.addEventListener("eavesence-import-context", receive);
    const bridge = (
      window as Window & {
        ReactNativeWebView?: { postMessage: (s: string) => void };
      }
    ).ReactNativeWebView;
    bridge?.postMessage(JSON.stringify({ type: "ready" }));
    return () =>
      window.removeEventListener("eavesence-import-context", receive);
  }, []);
  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="site-section-title">
        EAVESENCE ·{" "}
        {context.locale === "de" ? "Kosten übernehmen" : "Import costs"}
      </h1>
      {ready ? (
        <CostImportPanel
          {...context}
          onSave={(costs) => {
            const bridge = (
              window as Window & {
                ReactNativeWebView?: { postMessage: (s: string) => void };
              }
            ).ReactNativeWebView;
            if (!bridge) throw new Error("NO_APP");
            bridge.postMessage(JSON.stringify({ type: "costs", costs }));
          }}
        />
      ) : (
        <p role="status" className="mt-3 text-[13px]">
          {"Open from the EAVESENCE app. / Bitte aus der EAVESENCE-App öffnen."}
        </p>
      )}
    </main>
  );
}
