import { tileSymbols, type TileSymbol as SymbolKey } from '@eavesence/core/tileSymbols';
export default function TileSymbol({icon,className='h-4 w-4 shrink-0'}:{icon:SymbolKey|null;className?:string}) {
  const symbol=tileSymbols.find(s=>s.key===icon);
  if(!symbol)return null;
  return <svg data-tile-icon={symbol.key} viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{symbol.paths.map(d=><path key={d} d={d}/>)}</svg>;
}
