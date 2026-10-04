import {useEffect,useRef,useState} from 'react';
import {localToday} from './homeValue.ts';
import {readPlanningData,type PlanningData} from './planning.ts';
import {createMemoId,memoGroups,validMemoDate,type HomeMemo} from './memos.ts';
export type MemoSync = (memos:HomeMemo[],requestPermission:boolean)=>Promise<string|void>;
export function useMemos(data:PlanningData|undefined,onSave:(data:PlanningData)=>void|Promise<void>,de:boolean,onSync?:MemoSync) {
  const [today,setToday]=useState(localToday),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const lock=useRef(false);
  useEffect(()=>{const timer=setInterval(()=>setToday(localToday()),30_000);return()=>clearInterval(timer);},[]);
  const planning=readPlanningData(data),memos=planning.memos??[];
  async function persist(next:HomeMemo[],request=false) {
    if(lock.current)return false;
    lock.current=true;setBusy(true);setError('');setNotice('');
    try {
      await onSave({...planning,memos:next});
      setNotice(de?'Notizen gespeichert.':'Notes saved.');
      if(onSync)try {const status=await onSync(next,request);if(status)setNotice(status);}catch {setNotice(de?'Notiz gespeichert. Die Geräte-Erinnerung konnte nicht aktualisiert werden. Bitte erneut speichern oder Benachrichtigungen in den Einstellungen prüfen.':'Note saved. The device reminder could not be updated. Save again or check notifications in Settings.');}
      return true;
    }catch {setError(de?'Die Notiz konnte nicht gespeichert werden. Bitte erneut versuchen.':'Could not save the note. Please try again.');return false;}
    finally {lock.current=false;setBusy(false);}
  }
  async function save(text:string,date:string,id?:string) {
    const clean=text.trim();
    if(!clean || clean.length>300){setError(de?'Schreibe eine kurze Notiz (maximal 300 Zeichen).':'Enter a short note (up to 300 characters).');return false;}
    if(date && !validMemoDate(date)){setError(de?'Bitte ein gültiges Datum wählen.':'Please choose a valid date.');return false;}
    if(!id && memos.length>=50){setError(de?'Maximal 50 Notizen. Entferne zuerst eine alte Notiz.':'Up to 50 notes. Remove an old note first.');return false;}
    const memo:HomeMemo={id:id??createMemoId(),text:clean,date,done:memos.find(m=>m.id===id)?.done??false,updatedAt:new Date().toISOString()};
    return persist(id?memos.map(m=>m.id===id?memo:m):[...memos,memo],!!date && date>=today && !memo.done);
  }
  return {...memoGroups(memos,today),memos,today,busy,error,notice,clear:()=>{setError('');setNotice('');},save,toggle:(id:string)=>persist(memos.map(m=>m.id===id?{...m,done:!m.done,updatedAt:new Date().toISOString()}:m)),remove:(id:string)=>persist(memos.filter(m=>m.id!==id))};
}
