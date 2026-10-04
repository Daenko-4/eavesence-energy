/** One small, fixed icon set shared by web SVGs and offline native images. */
export const tileSymbols = [
  { key:'housing', de:'Wohnen', en:'Housing', paths:['m3 10 9-7 9 7','M5 9v12h14V9','M9 21v-8h6v8'] },
  { key:'energy', de:'Strom', en:'Electricity', paths:['m13 2-9 12h7l-1 8 10-12h-7Z'] },
  { key:'internet', de:'Internet', en:'Internet', paths:['M3 8a15 15 0 0 1 18 0','M6 12a10 10 0 0 1 12 0','M9 16a5 5 0 0 1 6 0','M12 20h.01'] },
  { key:'subscriptions', de:'Abos', en:'Subscriptions', paths:['M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z','m10 9 6 3-6 3Z'] },
  { key:'mobility', de:'Mobilität', en:'Transport', paths:['m5 9 2-5h10l2 5','M4 9h16v8H4Z','M7 17v3M17 17v3','M7 13h1M16 13h1'] },
  { key:'insurance', de:'Versicherungen', en:'Insurance', paths:['M12 3 3 6v6c0 5 9 9 9 9s9-4 9-9V6Z','m8 12 3 3 5-6'] },
  { key:'shopping', de:'Einkauf', en:'Shopping', paths:['M5 8h14l1 13H4Z','M8 8V6a4 4 0 0 1 8 0v2'] },
  { key:'health', de:'Gesundheit', en:'Health', paths:['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z','M12 8v8M8 12h8'] },
  { key:'leisure', de:'Freizeit', en:'Leisure', paths:['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z','M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5'] },
  { key:'savings', de:'Sparen', en:'Savings', paths:['M12 4c-4.4 0-8 1.6-8 4s3.6 4 8 4 8-1.6 8-4-3.6-4-8-4Z','M4 8v4c0 2.2 3.6 4 8 4s8-1.8 8-4V8','M4 12v4c0 2.2 3.6 4 8 4s8-1.8 8-4v-4'] },
] as const;
export type TileSymbol = typeof tileSymbols[number]['key'];
export function tileIconMetadata(value:unknown): {icon?:TileSymbol|null} {
  if (value === null) return {icon:null};
  return typeof value === 'string' && tileSymbols.some(s=>s.key===value) ? {icon:value as TileSymbol} : {};
}
export function iconForTile(tile:{id:string;kind:string;icon?:TileSymbol|null}): TileSymbol|null {
  if (tile.icon === null) return null;
  return tileIconMetadata(tile.icon).icon ?? (tile.kind === 'energy' ? 'energy' : tile.id === 'default-costs' ? 'housing' : null);
}
export function tileSymbolLabel(icon:TileSymbol|null,locale:'de'|'en') {
  return tileSymbols.find(s=>s.key===icon)?.[locale] ?? (locale==='de'?'Ohne Symbol':'No icon');
}
