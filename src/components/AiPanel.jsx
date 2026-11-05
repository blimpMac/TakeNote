
import React, {useEffect, useState} from 'react';
import {X, Sparkles, Check, Copy, AlertCircle, ShieldCheck, Settings2, WandSparkles, LoaderCircle, ArrowRight} from 'lucide-react';
import {runWritingAssistant, browserModelStatus} from '../lib/ai.js';
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
 const [provider,setProvider]=useState(config.provider||'auto');
 const [model,setModel]=useState(config.model||'openrouter/free');
 const [endpoint,setEndpoint]=useState(config.endpoint||'http://localhost:11434');
 const [key,setKey]=useState(apiKey||'');
 const [availability,setAvailability]=useState('checking...');
 useEffect(()=>{browserModelStatus().then(setAvailability)},[]);
 useEffect(()=>{const fn=e=>{if(e.key==='Escape')onClose()};window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)},[onClose]);
 const opts=[
  ['auto','Auto: browser AI → free API → offline'],
  ['browser','Browser AI (on-device, if supported)'],
  ['openrouter','OpenRouter free models (your key)'],
  ['ollama','Ollama local model (your device)'],
  ['offline','Offline writing helper (no setup)'],
 ];
 return <div className="overlay overlay-ai" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <section className="pixel-dialog settings-dialog animate-pop" role="dialog" aria-modal="true" aria-labelledby="ai-settings-title">
   <div className="dialog-header flex justify-between items-center gap-4"><div><p className="pixel-kicker">PIXEL POWERED</p><h2 id="ai-settings-title" className="text-xl font-extrabold">AI settings</h2></div><button className="close-btn" aria-label="Close settings" onClick={onClose}><X size={19}/></button></div>
   <div className="ai-info mt-4 text-xs"><Sparkles className="shrink-0" size={17}/><p>Browser AI status: <strong>{availability}</strong>. On supported Chrome devices, the built-in model can write privately without a key. Otherwise, connect a free OpenRouter key or local Ollama.</p></div>
   <label className="field-label mt-4" htmlFor="provider-select">Choose provider</label>
   <select id="provider-select" className="field-input" value={provider} onChange={e=>setProvider(e.target.value)}>{opts.map(([id,title])=><option key={id} value={id}>{title}</option>)}</select>
   <label htmlFor="openrouter-key" className="field-label mt-4">OpenRouter API key (optional)</label>
   <input id="openrouter-key" type="password" className="field-input" value={key} onChange={e=>setKey(e.target.value)} autoComplete="off" placeholder="Paste your free key for hosted AI"/>
   <p className="text-xs text-[#8b89a4] mt-1">Stored only in this open tab's memory, not in GitHub, localStorage, or a server.</p>
   <label htmlFor="ai-model" className="field-label mt-4">Model name</label>
   <input id="ai-model" className="field-input" value={model} onChange={e=>setModel(e.target.value)} placeholder="openrouter/free or gemma3:1b"/>
   <label htmlFor="ollama-url" className="field-label mt-4">Local Ollama address</label>
   <input id="ollama-url" className="field-input" value={endpoint} onChange={e=>setEndpoint(e.target.value)} placeholder="http://localhost:11434"/>
   <div className="help-box mt-4 text-xs leading-6">
    <strong>Free AI setup:</strong> Get a key at <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="underline font-bold">OpenRouter</a>, select OpenRouter and use <code>openrouter/free</code>. Free models have usage limits. Or install <a href="https://ollama.com" target="_blank" rel="noreferrer" className="underline font-bold">Ollama</a> locally, pull <code>gemma3:1b</code>, and allow your website's origin via <code>OLLAMA_ORIGINS</code>. The offline helper works instantly without either.
   </div>
   <div className="flex justify-end gap-2 mt-5"><button className="ui-btn ui-btn-soft" onClick={onClose}>Cancel</button><button className="ui-btn ui-btn-primary" onClick={()=>onSave({provider,model:model.trim(),endpoint:endpoint.trim()},key)}><Check size={15}/> Save AI settings</button></div>
  </section>
 </div>
}
