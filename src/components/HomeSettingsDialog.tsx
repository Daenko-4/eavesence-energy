"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

export default function HomeSettingsDialog({locale,onClose,children,title}:{title?:string;locale:"de"|"en";onClose:()=>void;children:ReactNode}) {
  const titleId=useId();
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    const element=dialog.current;
    const trigger=document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element?.showModal();
    element?.querySelector<HTMLInputElement>('input:not([type="file"])')?.focus({preventScroll:true});
    return ()=>{element?.close();if(trigger?.isConnected)trigger.focus({preventScroll:true});};
  },[]);
  return <dialog ref={dialog} className="home-settings-dialog" aria-labelledby={titleId} onCancel={event=>{event.preventDefault();onClose();}}>
    <div className="home-settings-dialog-heading"><h2 id={titleId}>{title ?? (locale === "de" ? "Einstellungen" : "Settings")}</h2><button type="button" onClick={onClose} className="eavesence-pill-button home-dashboard-action">{locale === "de" ? "Schließen" : "Close"}</button></div>
    {children}
  </dialog>;
}
