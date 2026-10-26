"use client";

import { useEffect, useRef, type ReactNode } from "react";

export default function HomeSettingsDialog({locale,onClose,children}:{locale:"de"|"en";onClose:()=>void;children:ReactNode}) {
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    const element=dialog.current;
    const trigger=document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element?.showModal();
    element?.querySelector<HTMLInputElement>('input:not([type="file"])')?.focus({preventScroll:true});
    return ()=>{element?.close();if(trigger?.isConnected)trigger.focus({preventScroll:true});};
  },[]);
  return <dialog ref={dialog} className="home-settings-dialog" aria-labelledby="home-settings-title" onCancel={event=>{event.preventDefault();onClose();}}>
    <div className="home-settings-dialog-heading"><h2 id="home-settings-title">{locale === "de" ? "Einstellungen" : "Settings"}</h2><button type="button" onClick={onClose} className="eavesence-pill-button home-dashboard-action">{locale === "de" ? "Schließen" : "Close"}</button></div>
    {children}
  </dialog>;
}
