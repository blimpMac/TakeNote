
import React, {useEffect, useState} from 'react';
import {X, Sparkles, Check, Copy, AlertCircle, ShieldCheck, Settings2, WandSparkles, LoaderCircle, ArrowRight} from 'lucide-react';
import {runWritingAssistant} from '../lib/ai.js';
const MODES=[
  {id:'proofread',label:'Spelling & grammar',hint:'Correct typos and punctuation while preserving your meaning.'},
  {id:'rewrite',label:'Improve wording',hint:'Make your ideas flow more naturally.'},
  {id:'organize',label:'Reconstruct notes',hint:'Organize sentences, headings and action points.'},
  {id:'summarize',label:'Key details',hint:'Compile decisions, dates, to-dos and highlights.'},
];
export default function AiPanel({note, config, apiKey, onClose, onApply, onSettings}) {
 const [mode,setMode]=useState('proofread');
 const [result,setResult]=useState(null);
 const [proposal,setProposal]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [original,setOriginal]=useState(note?.body||'');
 const [sourceNoteId,setSourceNoteId]=useState(note?.id);
 useEffect(()=>{setOriginal(note?.body||'');setSourceNoteId(note?.id);setResult(null);setProposal('');setError('')},[note?.id]);
 useEffect(()=>{const fn=e=>{if(e.key==='Escape'&&!busy)onClose()};window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)},[busy,onClose]);
 if(!note)return null;
 async function generate() {
  setBusy(true);setError('');setResult(null);
  const before=note.body;setOriginal(before);setSourceNoteId(note.id);
  try {
   const item=await runWritingAssistant({text:before,mode,provider:config.provider,key:apiKey,model:config.model,endpoint:config.endpoint});
   setResult(item);setProposal(item.text);
  } catch(e){setError(String(e.message||e));}
  finally{setBusy(false)}
 }
 function apply() {
  if(!result||sourceNoteId!==note.id)return;
  if(note.body!==original && !window.confirm('This note has changed since the suggestion was generated. Replace its current content?'))return;
  onApply(note.id,proposal);onClose();
 }
 function copy(){navigator.clipboard?.writeText(proposal).catch(()=>{})}
 return (
  <div className="overlay overlay-ai" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)onClose()}}>
   <section className="pixel-dialog ai-dialog animate-pop" role="dialog" aria-modal="true" aria-labelledby="ai-dialog-title">
    <div className="dialog-header flex items-center justify-between gap-3">
     <div className="flex items-center gap-3"><div className="dialog-icon"><WandSparkles size={22}/></div><div><p className="pixel-kicker">A LITTLE WRITING MAGIC</p><h2 id="ai-dialog-title" className="text-xl font-extrabold">AI writing studio</h2></div></div>
     <button className="close-btn" onClick={onClose} disabled={busy} title="Close" aria-label="Close AI assistant"><X size={19}/></button>
    </div>
    <div className="ai-info flex items-start gap-2"><ShieldCheck size={17} className="shrink-0 mt-0.5"/><span>You stay in control. Suggestions appear beside your original text and are <strong>never applied automatically.</strong></span></div>
    <div className="flex flex-wrap gap-2 mt-4 mb-4" role="group" aria-label="Writing action">
     {MODES.map(m=><button key={m.id} className={'mode-chip '+(mode===m.id?'selected':'')} onClick={()=>{setMode(m.id);setResult(null);setProposal('');setError('')}}>{m.label}</button>)}
    </div>
    <p className="text-xs font-semibold text-[#8582a6] mb-4">{MODES.find(m=>m.id===mode).hint}</p>
    <div className="ai-compare grid grid-cols-1 md:grid-cols-2 gap-3">
     <div className="min-w-0"><label className="field-label">Original note</label><div className="ai-text-box ai-original whitespace-pre-wrap">{note.body||'Empty note'}</div></div>
     <div className="min-w-0"><label htmlFor="ai-proposal" className="field-label">Suggested revision</label><textarea id="ai-proposal" value={proposal} onChange={e=>setProposal(e.target.value)} disabled={!result} placeholder="Click Generate suggestions to see a revision here..." className="ai-text-box ai-proposal" spellCheck/></div>
    </div>
    {result&&<p className="mt-3 text-xs font-semibold text-[#668a9a]">✦ {result.source}{result.details?.length?' · '+result.details.slice(0,4).join(' · '):''}</p>}
    {error&&<div role="alert" className="error-line flex items-start gap-2 mt-3"><AlertCircle size={16} className="shrink-0 mt-0.5"/><span>{error}</span></div>}
    <div className="flex justify-between flex-wrap gap-2 items-center mt-5">
      <button className="text-link text-xs flex items-center gap-1" onClick={()=>{onClose();onSettings()}}><Settings2 size={14}/> AI settings & free models</button>
      <div className="flex flex-wrap gap-2">
       {result&&<button className="ui-btn ui-btn-soft" onClick={copy}><Copy size={15}/> Copy</button>}
       {result&&<button className="ui-btn ui-btn-primary" onClick={apply} disabled={!proposal.trim()}><Check size={16}/> Apply revision</button>}
       <button className="ui-btn ui-btn-pink" disabled={busy||!note.body.trim()} onClick={generate}>{busy?<LoaderCircle className="animate-spin" size={15}/>:<Sparkles size={15}/>} {busy?'Thinking...':'Generate suggestions'}</button>
      </div>
    </div>
   </section>
  </div>
 );
}

export function AiSettings({config,apiKey,onSave,onClose}) {
 const initial=['openrouter','groq','offline'].includes(config.provider)?config.provider:'openrouter';
 const [provider,setProvider]=useState(initial);
 const [model,setModel]=useState(initial==='groq'?'openai/gpt-oss-20b':config.model||'openrouter/free');
 const [key,setKey]=useState(apiKey||'');
 const [remote,setRemote]=useState(null);
 useEffect(()=>{
  let mounted=true;
  fetch('/api/ai').then(r=>r.json()).then(data=>{if(mounted)setRemote(data)}).catch(()=>{if(mounted)setRemote({providers:{}})});
  return()=>{mounted=false};
 },[]);
 useEffect(()=>{
  const keyHandler=e=>{if(e.key==='Escape')onClose()};
  window.addEventListener('keydown',keyHandler);
  return()=>window.removeEventListener('keydown',keyHandler);
 },[onClose]);
 const hosted=provider==='openrouter'||provider==='groq';
 const hasServerKey=Boolean(remote?.providers?.[provider]);
 const onProviderChange=p=>{
  setProvider(p);
  setModel(p==='groq'?'openai/gpt-oss-20b':'openrouter/free');
  setKey('');
 };
 return <div className="overlay overlay-ai" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <section className="pixel-dialog settings-dialog animate-pop" role="dialog" aria-modal="true" aria-labelledby="ai-settings-title">
   <div className="dialog-header flex justify-between items-center gap-4">
    <div><p className="pixel-kicker">CLOUD-POWERED WRITING</p><h2 id="ai-settings-title" className="text-xl font-extrabold">AI settings</h2></div>
    <button className="close-btn" aria-label="Close settings" onClick={onClose}><X size={19}/></button>
   </div>
   <div className="ai-info mt-4 text-xs"><Sparkles className="shrink-0" size={18}/><p>All hosted AI runs through the TakeNote website, deployed automatically from GitHub to Vercel. <strong>No local model is required.</strong> Your note is sent to the provider only after you request a suggestion.</p></div>
   <label className="field-label mt-4" htmlFor="provider-select">AI service</label>
   <select id="provider-select" className="field-input" value={provider} onChange={e=>onProviderChange(e.target.value)}>
    <option value="openrouter">OpenRouter · free model router</option>
    <option value="groq">Groq Cloud · free-tier model</option>
    <option value="offline">Basic offline spelling helper (not generative AI)</option>
   </select>
   {hosted&&<>
    <div className="help-box mt-3 text-xs leading-6">
     {remote===null?'Checking hosted AI configuration…':hasServerKey?'✓ A shared API key is configured on Vercel. You can use hosted AI without supplying your own key.':'A shared API key is not configured for this provider yet. Enter a personal API key below, or set one in Vercel environment variables.'}
    </div>
    <label htmlFor="hosted-ai-key" className="field-label mt-4">{provider==='groq'?'Groq Cloud API key':'OpenRouter API key'} {hasServerKey?'(optional)':'(required unless server key is configured)'}</label>
    <input id="hosted-ai-key" type="password" className="field-input" value={key} onChange={e=>setKey(e.target.value)} autoComplete="off" placeholder={provider==='groq'?'gsk_...':'sk-or-v1-...'}/>
    <p className="text-xs text-[#8b89a4] mt-1">Your personal key is kept only in this open browser tab's memory and forwarded through the Vercel API for each request. It is not saved in localStorage or GitHub.</p>
    {provider==='openrouter'&&<>
     <label htmlFor="ai-model" className="field-label mt-4">Free model selection</label>
     <input id="ai-model" className="field-input" value={model} onChange={e=>setModel(e.target.value)} placeholder="openrouter/free"/>
     <p className="text-xs text-[#8b89a4] mt-1">Use <code>openrouter/free</code> or an explicit <code>:free</code> model. Paid models are blocked by the API.</p>
    </>}
    {provider==='groq'&&<p className="text-xs text-[#8b89a4] mt-3">Model: <code>openai/gpt-oss-20b</code> (cloud inference, subject to Groq's free-tier limits).</p>}
    <div className="help-box mt-4 text-xs leading-6">
     Get a free API key at {provider==='groq'
      ?<a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="underline font-bold">Groq Cloud</a>
      :<a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="underline font-bold">OpenRouter</a>}.
     You can alternatively set {provider==='groq'?<code>GROQ_API_KEY</code>:<code>OPENROUTER_API_KEY</code>} in Vercel project settings and redeploy.
     This website is public: protect shared keys with rate limits and quota monitoring.
    </div>
   </>}
   {!hosted&&<div className="help-box mt-4 text-xs leading-6">Basic offline suggestions work instantly without a key, but they do not use a language model. Select OpenRouter or Groq for AI rewriting, grammar checks and summaries.</div>}
   <div className="flex justify-end gap-2 mt-5">
    <button className="ui-btn ui-btn-soft" onClick={onClose}>Cancel</button>
    <button className="ui-btn ui-btn-primary" onClick={()=>onSave({provider,model:provider==='groq'?'openai/gpt-oss-20b':model.trim()||'openrouter/free'},key)}><Check size={15}/> Save AI settings</button>
   </div>
  </section>
 </div>;
}
