
const COMMON_FIXES = new Map([
  ['teh','the'],['recieve','receive'],['recieved','received'],['seperate','separate'],
  ['definately','definitely'],['occured','occurred'],['adress','address'],
  ['becuase','because'],['wierd','weird'],['thier','their'],
  ['untill','until'],['alot','a lot'],['tomorow','tomorrow'],
  ['enviroment','environment'],['recomend','recommend'],
  ['grammer','grammar'],['im','I’m'],['dont','don’t'],['cant','can’t'],
  ['wont','won’t'],['didnt','didn’t'],['doesnt','doesn’t'],
  ['isnt','isn’t'],['ive','I’ve'],['youre','you’re'],['itsnt','isn’t'],
]);
const WORDING_FIXES = [
  [/\bdue to the fact that\b/gi,'because'],
  [/\bat this point in time\b/gi,'now'],
  [/\bin order to\b/gi,'to'],
  [/\bmake sure to\b/gi,'ensure you'],
  [/\bhas the ability to\b/gi,'can'],
  [/\bin the event that\b/gi,'if'],
  [/\bfor the purpose of\b/gi,'for'],
];
function preserveCase(original, replacement) {
  if (original === original.toUpperCase() && original.length > 1) return replacement.toUpperCase();
  if (original[0] === original[0].toUpperCase()) return replacement[0].toUpperCase()+replacement.slice(1);
  return replacement;
}
export function offlineSuggestion(text, mode = 'proofread') {
  let value=String(text || ''),changed=[];
  const before=value;
  value=value.replace(/\b[a-zA-Z]+\b/g, word => {
    const fix=COMMON_FIXES.get(word.toLowerCase());
    if (!fix) return word;
    const replacement=preserveCase(word,fix);
    if(word!==replacement)changed.push(word+' → '+replacement);
    return replacement;
  });
  value=value.replace(/[ \t]{2,}/g,()=>{changed.push('Extra spaces');return ' '});
  value=value.replace(/ +([,.!?;:])/g, '$1');
  if (['rewrite','organize'].includes(mode)) {
    WORDING_FIXES.forEach(([pattern,replacement])=>{value=value.replace(pattern,()=>{changed.push('Simplified word choice');return replacement})});
    value=value.split('\n').map(line=>line.replace(/\s+$/,'')).join('\n');
  }
  if (mode==='summarize') {
    const lines=value.split('\n').map(s=>s.trim()).filter(Boolean);
    const priorities=lines.filter(s=>/^(?:[-*•]\s*)?(?:\[[ x]\]\s*|todo:|important:|deadline:)/i.test(s));
    const first=lines.filter(s=>!priorities.includes(s)).slice(0,4);
    value=[...priorities,...first].slice(0,8).map(s=>s.startsWith('•')?s:'• '+s.replace(/^[-*]\s*/, '')).join('\n') || value;
    changed.push('Extracted a concise digest');
  }
  if (!changed.length) changed.push('No common issues found. Use AI for a deeper edit.');
  return {text:value, source:'Offline helper', details:[...new Set(changed)].slice(0,15), changed:value!==before};
}

async function useHostedModel(text,mode,provider,key,model){
 const headers={'Content-Type':'application/json'};
 if(key?.trim())headers['x-ai-user-key']=key.trim();
 const response=await fetch('/api/ai',{
  method:'POST',headers,body:JSON.stringify({text,mode,provider,model})
 });
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(data.error||'Hosted AI unavailable ('+response.status+').');
 if(typeof data.result!=='string'||!data.result.trim())throw Error('Provider returned an empty suggestion.');
 return {text:data.result.trim(),source:provider==='groq'?'Groq hosted AI':'OpenRouter free AI',details:[],changed:data.result.trim()!==text};
}
export async function runWritingAssistant({text,mode,provider='openrouter',key='',model}){
 if(!String(text||'').trim())throw Error('Write something first to get suggestions.');
 if(provider==='offline')return offlineSuggestion(text,mode);
 if(provider==='groq')return useHostedModel(text,mode,'groq',key,'openai/gpt-oss-20b');
 return useHostedModel(text,mode,'openrouter',key,model||'openrouter/free');
}
