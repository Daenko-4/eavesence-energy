export type HomeMemo = {id:string;text:string;date:string;done:boolean;updatedAt:string};
export function validMemoDate(value:string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(value)) return false;
  const date=new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10)===value;
}
export function readMemos(value:unknown): HomeMemo[] {
  if (!Array.isArray(value)) return [];
  return value.filter((m):m is HomeMemo=>!!m && typeof m==='object' && typeof m.id==='string' && !!m.id && typeof m.text==='string' && !!m.text.trim() && m.text.length<=300 && typeof m.date==='string' && (!m.date || validMemoDate(m.date)) && typeof m.done==='boolean' && typeof m.updatedAt==='string' && Number.isFinite(Date.parse(m.updatedAt)))
    .filter((m,i,rows)=>rows.findIndex(other=>other.id===m.id)===i).slice(0,50)
    .map(m=>({id:m.id,text:m.text.trim(),date:m.date,done:m.done,updatedAt:m.updatedAt}));
}
export function memoGroups(memos:HomeMemo[],today:string) {
  const pending=memos.filter(m=>!m.done).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999') || a.updatedAt.localeCompare(b.updatedAt));
  return {current:pending.filter(m=>!m.date || m.date.slice(0,7)<=today.slice(0,7)),later:pending.filter(m=>m.date && m.date.slice(0,7)>today.slice(0,7)),done:memos.filter(m=>m.done),due:pending.filter(m=>m.date && m.date<=today)};
}

export function createMemoId(){return `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;}
