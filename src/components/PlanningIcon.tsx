export default function PlanningIcon({ kind }: { kind: "payday" | "savings" | "progress" }) {
  return <svg className="planning-job-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === "payday" ? <><rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 9h18m-5 5h2M7 5V3m10 2V3"/></> : kind === "savings" ? <><path d="m4 7 5 5 4-4 7 7m-5 0h5v-5"/><path d="M4 20h16"/></> : <><path d="M5 20v-6m7 6V9m7 11V4"/><path d="m4 7 3 3 5-6"/></>}
  </svg>;
}
