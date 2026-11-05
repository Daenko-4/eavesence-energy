"use client";

import { useSyncExternalStore } from "react";
import { HOUSEHOLD_PROFILE_STORAGE_KEY, HOUSEHOLD_CHANGED_EVENT, readHouseholdProfile } from "@/lib/household";

function subscribe(update:()=>void) {
  window.addEventListener("storage",update);
  window.addEventListener(HOUSEHOLD_CHANGED_EVENT,update);
  return ()=>{window.removeEventListener("storage",update);window.removeEventListener(HOUSEHOLD_CHANGED_EVENT,update);};
}
function snapshot(){try{return localStorage.getItem(HOUSEHOLD_PROFILE_STORAGE_KEY);}catch{return null;}}
export function useElectricityTariff(){
  const raw=useSyncExternalStore(subscribe,snapshot,()=>null);
  const profile=readHouseholdProfile(raw);
  return {price:profile?.electricityPrice??0.35,currency:profile?.currency??"EUR",saved:!!profile};
}
