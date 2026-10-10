type Input = {focus:()=>void;isFocused:()=>boolean};
/** The registry belongs to one form; hidden and disabled fields unregister. */
export function createInputNavigation() {
  const inputs = new Map<string, () => Input | null>();
  return {
    register(id:string,getInput:()=>Input|null) {inputs.set(id,getInput);return ()=>{inputs.delete(id);};},
    next(id:string) {
      const ids=[...inputs.keys()],index=ids.indexOf(id);
      if(index<0)return false;
      for(const key of ids.slice(index+1)){const input=inputs.get(key)?.();if(input){input.focus();return true;}}
      return false;
    },
    current(){return [...inputs].find(([,get])=>get()?.isFocused())?.[0];},
  };
}
