
import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {
  Menu, X, Plus, BookOpen, BookMarked, LayoutDashboard, Heart, Settings2, Sparkles,
  Search, Download, Upload, ChevronLeft, ChevronRight, CalendarDays, FileText,
  Star, PenLine, ArrowRight, ShieldCheck, Check, Clock3, Layers3, WandSparkles,
  Pin, Trash2, Smile, ListTodo, Cloud, Send, Copy, ArrowLeft
} from 'lucide-react';
import NotePad from './components/NotePad.jsx';
import AiPanel, {AiSettings} from './components/AiPanel.jsx';
import {
 STORAGE_KEY, PREF_KEY, COLORS, QUOTES, id, newNote, normalizeNotes, loadNotes,
 persistNotes, monthKey, monthLabel, dateLabel, wordCount, taskLines, digest,
 downloadFile, exportMarkdown, monthMarkdown, todayQuote
} from './lib/notes.js';

function CatMascot() {
 return <svg className="pixel-cat" width="78" height="76" viewBox="0 0 64 60" role="img" aria-label="Friendly original pixel kitty" shapeRendering="crispEdges">
  <path d="M8 20V5h9v7h30V5h9v15h5v24h-6v8H9v-8H3V20z" fill="#fff" stroke="#77728e" strokeWidth="3"/>
  <path d="M40 13V5h16v16H40z" fill="#f6b2d6"/><path d="M46 9h5v10h-5zM42 12h13v5H42z" fill="#ec82bd"/>
  <path d="M17 29h5v6h-5zm27 0h5v6h-5z" fill="#66617c"/><path d="M29 35h7v4h-7z" fill="#eaa0be"/>
  <path d="M6 34h7v2H6zm0 5h7v2H6zm45-5h7v2h-7zm0 5h7v2h-7z" fill="#8a879e"/>
 </svg>;
}
function PixelMark({size=23}) {
 return <span aria-hidden="true" className="pixel-mark" style={{fontSize:size}}>✿</span>;
}
const DEFAULT_AI={provider:'auto',model:'openrouter/free',endpoint:'http://localhost:11434'};
function loadPrefs() {
 try {const o=JSON.parse(localStorage.getItem(PREF_KEY)||'{}');return [1,2,4].includes(o.grid)?o.grid:2;}
 catch{return 2;}
}
function loadAiPrefs(){
 try {const a=JSON.parse(localStorage.getItem('takenote.ai.prefs.v2')||'{}');return {provider:['auto','browser','openrouter','ollama','offline'].includes(a.provider)?a.provider:'auto',model:String(a.model||'openrouter/free'),endpoint:String(a.endpoint||'http://localhost:11434')};}
 catch{return DEFAULT_AI}
}
function chipText(n){return n===1?'1 × 1':n===2?'2 × 2':'4 × 4'}
function EmptySlot({onClick,index}) {
 return <button type="button" onClick={onClick} className="empty-slot note-pad" aria-label={'Start writing in empty note slot '+index}>
  <div className="pixel-kicker">✿ NOTE {String(index).padStart(2,'0')}</div>
  <div className="ruled-empty" aria-hidden="true"/>
  <div className="empty-cta flex items-center gap-2"><Plus size={16}/> Start a new note</div>
 </button>;
}
function SavedCard({note,onClick}) {
 return <button type="button" className={'archive-card note-'+note.color+' animate-rise'} onClick={onClick} aria-label={'Open saved note '+(note.title||'Untitled note')}>
  <div className="flex justify-between items-center gap-2 text-[10px] font-bold text-[#8a83a5]">
   <span>✿ {dateLabel(note.created,true)}</span>{note.pinned?<span className="flex items-center gap-1"><Star size={12} fill="currentColor"/> PINNED</span>:<span>♡ NOTE</span>}
  </div>
  <strong className="archive-title">{note.title||'Untitled thought'}</strong>
  <p className="archive-preview">{note.body.trim()||'A fresh page, waiting to be filled with your ideas...'}</p>
  <div className="archive-footer flex justify-between gap-2 items-center mt-auto"><span>{wordCount(note.body)} words</span><span className="flex items-center gap-1">Open window <ArrowRight size={13}/></span></div>
 </button>;
}
function Stat({icon:Icon,value,label,color}) {
 return <div className={'stat-card '+color+' animate-rise'}><Icon size={22}/><strong className="block text-2xl mt-3">{value}</strong><span className="uppercase text-[10px] font-extrabold tracking-wide">{label}</span></div>;
}
function GroupTitle({kicker,title,subtitle,actions}) {
 return <div className="section-heading flex flex-wrap items-center justify-between gap-4">
  <div><p className="pixel-kicker">{kicker}</p><h2 className="section-title">{title}</h2>{subtitle&&<p className="text-[#9593aa] font-bold text-xs mt-1">{subtitle}</p>}</div>
  {actions&&<div className="flex items-center gap-2 flex-wrap">{actions}</div>}
 </div>;
}
export default function App() {
 const [notes,setNotes]=useState(loadNotes);
 const [view,setView]=useState('notes');
 const [layout,setLayout]=useState(loadPrefs);
 const [page,setPage]=useState(0);
 const [archivePage,setArchivePage]=useState(0);
 const [month,setMonth]=useState('all');
 const [query,setQuery]=useState('');
 const [sort,setSort]=useState('updated');
 const [colorFilter,setColorFilter]=useState('all');
 const [recapMonth,setRecapMonth]=useState(monthKey(new Date()));
 const [activeId,setActiveId]=useState(null);
 const [savedWindowId,setSavedWindowId]=useState(null);
 const [aiNoteId,setAiNoteId]=useState(null);
 const [settingsOpen,setSettingsOpen]=useState(false);
 const [aiConfig,setAiConfig]=useState(loadAiPrefs);
 const [apiKey,setApiKey]=useState('');
 const [sidebarOpen,setSidebarOpen]=useState(false);
 const [sidebarCollapsed,setSidebarCollapsed]=useState(false);
 const [date,setDate]=useState(new Date());
 const [toast,setToast]=useState('');
 const [storageOk,setStorageOk]=useState(true);
 const importRef=useRef(null);
 const focusRef=useRef(false);

 useEffect(()=>{setStorageOk(persistNotes(notes))},[notes]);
 useEffect(()=>{try{localStorage.setItem(PREF_KEY,JSON.stringify({grid:layout}))}catch{}},[layout]);
 useEffect(()=>{try{localStorage.setItem('takenote.ai.prefs.v2',JSON.stringify(aiConfig))}catch{}},[aiConfig]);
 useEffect(()=>{const check=()=>setDate(new Date());const timer=setInterval(check,60000);document.addEventListener('visibilitychange',check);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',check)}},[]);
 useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),3800);return()=>clearTimeout(timer)},[toast]);
 useEffect(()=>{document.body.classList.toggle('modal-visible',Boolean(savedWindowId||aiNoteId||settingsOpen));return()=>document.body.classList.remove('modal-visible')},[savedWindowId,aiNoteId,settingsOpen]);
 useEffect(()=>{const handler=e=>{if(e.key==='Escape'){if(aiNoteId)setAiNoteId(null);else if(settingsOpen)setSettingsOpen(false);else if(savedWindowId)setSavedWindowId(null);else setSidebarOpen(false)}};document.addEventListener('keydown',handler);return()=>document.removeEventListener('keydown',handler)},[aiNoteId,settingsOpen,savedWindowId]);
 useEffect(()=>{if(view==='write'&&activeId&&focusRef.current){focusRef.current=false;requestAnimationFrame(()=>document.querySelector('[data-note-id="'+activeId+'"] .note-writing')?.focus())}},[view,activeId,notes.length]);
 function notify(message){setToast(message)}
 function navigate(to){setView(to);setSidebarOpen(false);setArchivePage(0);}
 function createNote(){const item=newNote(notes.length);setNotes(prev=>[item,...prev]);setActiveId(item.id);setPage(0);setSavedWindowId(null);setAiNoteId(null);focusRef.current=true;navigate('write');notify('Your new note is ready to write ♡');return item.id}
 const changeNote=useCallback((noteId,field,value)=>{
  setNotes(prev=>prev.map(n=>n.id===noteId?{...n,[field]:value,updated:new Date().toISOString()}:n));
 },[]);
 const pinNote=useCallback(noteId=>{setNotes(prev=>prev.map(n=>n.id===noteId?{...n,pinned:!n.pinned,updated:new Date().toISOString()}:n))},[]);
 function deleteNote(noteId) {
  if(!window.confirm('Delete this note permanently? Export a backup first if needed.'))return;
  setNotes(prev=>prev.filter(n=>n.id!==noteId));
  if(activeId===noteId)setActiveId(null);
  if(savedWindowId===noteId)setSavedWindowId(null);
  if(aiNoteId===noteId)setAiNoteId(null);
  notify('Note deleted');
 }
 function changeColor(noteId,color){if(COLORS.includes(color))changeNote(noteId,'color',color)}
 function saveAISettings(nextConfig,key){setAiConfig(nextConfig);setApiKey(key);setSettingsOpen(false);notify('AI settings saved in this tab ♡')}
 function saveNotesBackup(){downloadFile('takenote-backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify({app:'TakeNote',version:2,exported:new Date().toISOString(),notes},null,2),'application/json')}
 async function restoreBackup(event){
  const file=event.target.files?.[0];event.target.value='';
  if(!file)return;
  try {
   if(file.size>8*1024*1024)throw Error('Choose a JSON file under 8 MB');
   const data=JSON.parse(await file.text());
   const incoming=Array.isArray(data)?data:data.notes;
   if(!Array.isArray(incoming)||incoming.length>3000)throw Error('This is not a supported TakeNote backup');
   const safe=normalizeNotes(incoming);
   if(!window.confirm('Replace your '+notes.length+' browser notes with '+safe.length+' imported notes? Save a backup first if needed.'))return;
   setNotes(safe);setSavedWindowId(null);setActiveId(null);navigate('notes');notify('Your notes are restored ♡');
  }catch(err){notify('Import failed: '+err.message)}
 }
 const months=useMemo(()=>[...new Set(notes.map(n=>monthKey(n.created)).filter(Boolean))].sort().reverse(),[notes]);
 const archiveNotes=useMemo(()=>{
  const all=notes.filter(n=>(view!=='pinned'||n.pinned)&&(month==='all'||monthKey(n.created)===month)&&(colorFilter==='all'||n.color===colorFilter)&&(!query.trim()||(n.title+' '+n.body).toLowerCase().includes(query.toLowerCase().trim())));
  return all.sort((a,b)=>(Number(b.pinned)-Number(a.pinned))||(sort==='title'?a.title.localeCompare(b.title):new Date(sort==='created'?b.created:b.updated)-new Date(sort==='created'?a.created:a.updated)));
 },[notes,view,month,query,sort,colorFilter]);
 const archivePerPage=18;
 const archiveMaxPage=Math.max(0,Math.ceil(archiveNotes.length/archivePerPage)-1);
 const visibleArchive=archiveNotes.slice(Math.min(archivePage,archiveMaxPage)*archivePerPage,(Math.min(archivePage,archiveMaxPage)+1)*archivePerPage);
 const writerNotes=useMemo(()=>{
  const arr=[...notes].sort((a,b)=>new Date(b.updated)-new Date(a.updated));
  const i=arr.findIndex(n=>n.id===activeId);
  if(i>0)arr.unshift(arr.splice(i,1)[0]);
  return arr;
 },[notes,activeId]);
 const capacity=layout*layout,writerMaxPage=Math.max(0,Math.ceil(writerNotes.length/capacity)-1);
 const safePage=Math.min(page,writerMaxPage);
 const visibleWriter=writerNotes.slice(safePage*capacity,(safePage+1)*capacity);
 const recapNotes=useMemo(()=>notes.filter(n=>monthKey(n.created)===recapMonth).sort((a,b)=>new Date(b.created)-new Date(a.created)),[notes,recapMonth]);
 const recapStats=useMemo(()=>{
  const count=recapNotes.length;
  const words=recapNotes.reduce((sum,n)=>sum+wordCount(n.title+' '+n.body),0);
  const days=new Set(recapNotes.map(n=>new Date(n.created).toDateString())).size;
  const tasks=recapNotes.reduce((sum,n)=>sum+taskLines(n.body).length,0);
  return {count,words,days,tasks};
 },[recapNotes]);
 const noteWindow=notes.find(n=>n.id===savedWindowId);
 const syntheticMonth=aiNoteId==='__recap__'?{id:'__recap__',title:'Monthly recap',body:recapNotes.map(n=>'## '+(n.title||'Untitled')+'\n'+n.body).join('\n\n---\n').slice(0,14000)}:null;
 const aiNote=syntheticMonth||notes.find(n=>n.id===aiNoteId);
 function applyAI(noteId,body){
  if(noteId==='__recap__'){const item=newNote(notes.length);item.title='Monthly recap — '+monthLabel(recapMonth);item.body=body;setNotes(prev=>[item,...prev]);notify('Saved your AI recap as a new note ♡');return}
  changeNote(noteId,'body',body);notify('Approved AI suggestion saved ♡');
 }
 function exportNote(note){downloadFile((note.title||'untitled-note').replace(/[^\w-]+/g,'-').slice(0,45)+'.md',exportMarkdown(note),'text/markdown')}
 function exportRecap(){downloadFile('takenote-'+recapMonth+'-recap.md',monthMarkdown(recapNotes,recapMonth),'text/markdown')}
 function openSavedNote(noteId){setSavedWindowId(noteId);setSidebarOpen(false);}
 const year=Number(recapMonth.split('-')[0]),monthNum=Number(recapMonth.split('-')[1]);
 const dayCount=new Date(year,monthNum,0).getDate();
 const perDay=Array.from({length:dayCount},(_,i)=>recapNotes.filter(n=>new Date(n.created).getDate()===i+1).length);
 const maxDay=Math.max(1,...perDay);
 function NavButton({label,icon:Icon,active,action,primary=false}) {return <button className={'nav-button '+(active?'nav-active ':'')+(primary?'nav-primary':'')} onClick={action}><Icon size={18}/><span>{label}</span>{active&&<span className="nav-dot" aria-hidden="true"/>}</button>}
 return (
 <div className={'app-shell flex min-h-screen '+(sidebarCollapsed?'desktop-sidebar-hidden':'')}>
  <aside className={'sidebar '+(sidebarOpen?'sidebar-open':'')} aria-label="Main navigation">
   <div className="logo flex gap-3 items-center"><div className="logo-icon"><PixelMark/></div><div><div className="brand-text">TakeNote</div><div className="brand-subtitle">PIXEL EDITION ♡</div></div></div>
   <p className="side-label pixel-kicker mt-12 mb-4">✦ YOUR HAPPY PLACE</p>
   <nav className="flex flex-col gap-2">
    <NavButton label="New note" icon={Plus} primary active={view==='write'} action={createNote}/>
    <NavButton label="My notes" icon={BookOpen} active={view==='notes'} action={()=>navigate('notes')}/>
    <NavButton label="Monthly recap" icon={LayoutDashboard} active={view==='dashboard'} action={()=>navigate('dashboard')}/>
    <NavButton label="Pinned notes" icon={Heart} active={view==='pinned'} action={()=>navigate('pinned')}/>
   </nav>
   <div className="mt-auto side-bottom">
    <div className="kitty-card"><CatMascot/><div className="pixel-kicker mt-3">YOU GOT THIS!</div><p className="text-xs font-semibold mt-2">Every little thought matters ♡</p></div>
    <p className="sidebar-foot text-center text-[10px] font-bold mt-5">✿ A space for the little things</p>
   </div>
  </aside>
  {sidebarOpen&&<button className="sidebar-shade" aria-label="Close navigation" onClick={()=>setSidebarOpen(false)}/>}
  <div className="main-surface min-w-0 flex-1">
   <div className="site-container mx-auto">
    <header className="topbar flex items-center justify-between gap-3">
     <div className="flex items-center gap-3">
      <button className="hamburger" aria-label="Toggle navigation" aria-expanded={sidebarOpen} onClick={()=>{if(window.matchMedia('(max-width:760px)').matches)setSidebarOpen(x=>!x);else setSidebarCollapsed(x=>!x)}}><Menu size={20}/></button>
      <div className="breadcrumb text-xs font-extrabold">my little corner <span className="mx-2">/</span> <span className="breadcrumb-current">{view==='write'?'writing desk':view==='dashboard'?'monthly recap':view==='pinned'?'pinned notes':'my notes'}</span></div>
     </div>
     <div className="flex gap-2 items-center justify-end">
       <span className="saved-indicator hidden sm:inline-flex items-center gap-2"><span className="saved-dot"/>{storageOk?'saved locally':'backup recommended'}</span>
       <button className="ui-btn ui-btn-soft ai-setting-button" onClick={()=>setSettingsOpen(true)}><Settings2 size={15}/><span className="hidden xs:inline">AI settings</span><span className="xs:hidden">AI</span></button>
       <div className="head-cat" aria-hidden="true">🐱</div>
     </div>
    </header>
    <main>
     <section className="hero-banner animate-rise">
      <div className="hero-copy">
       <p className="pixel-kicker hero-kicker">✧ WELCOME TO YOUR HAPPY PLACE ✧</p>
       <h1 className="hero-title">little notes, <span>big ideas!</span> <b aria-hidden="true">✦</b></h1>
       <p className="hero-subtitle">Catch your thoughts, collect the magic, make every idea count. ♡</p>
       <div className="quote-line flex flex-wrap gap-2 items-center"><span className="pixel-kicker">✧ QUOTE OF THE DAY</span><span>“{todayQuote(date)}”</span><span className="quote-date">{dateLabel(date)}</span></div>
      </div>
      <div className="hero-sticker" aria-hidden="true"><span className="hero-cloud">☁️</span><span className="hero-letter">💌</span></div>
      <span className="hero-spark hero-spark-a" aria-hidden="true">✧</span><span className="hero-spark hero-spark-b" aria-hidden="true">✦</span>
     </section>

     {view==='write'&&<>
      <GroupTitle kicker="✎ CREATIVE CORNER" title="Your writing desk" subtitle="One space, many ideas. Everything autosaves as you type." actions={<><div className="segmented" role="group" aria-label="Notepad layout">{[1,2,4].map(n=><button key={n} className={layout===n?'selected':''} onClick={()=>{setLayout(n);setPage(0)}} aria-pressed={layout===n}>{chipText(n)}</button>)}</div><button className="ui-btn ui-btn-primary" onClick={createNote}><Plus size={16}/> New note</button></>}/>
      <div className={'writing-grid grid-layout-'+layout}>
       {visibleWriter.map(note=><NotePad key={note.id} note={note} onChange={changeNote} onPin={pinNote} onAI={setAiNoteId} onDelete={deleteNote} onExport={exportNote} focused={note.id===activeId} small={layout===4}/>)}
       {Array.from({length:Math.max(0,capacity-visibleWriter.length)},(_,i)=><EmptySlot key={'empty-'+i} index={safePage*capacity+visibleWriter.length+i+1} onClick={createNote}/>)}
      </div>
      {writerMaxPage>0&&<div className="page-controls"><button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={safePage===0}><ChevronLeft size={17}/> Previous</button><span>Page {safePage+1} of {writerMaxPage+1}</span><button onClick={()=>setPage(p=>Math.min(writerMaxPage,p+1))} disabled={safePage===writerMaxPage}>Next <ChevronRight size={17}/></button></div>}
      <div className="bottom-panels grid grid-cols-1 lg:grid-cols-2 gap-5">
       <section className="content-panel"><div className="panel-title"><Sparkles size={18}/> Quick note highlights</div><p className="panel-sub">Important details, automatically extracted while you write.</p><ul className="digest-list">{digest([...notes].sort((a,b)=>new Date(b.updated)-new Date(a.updated)).slice(0,12),5).map((x,i)=><li key={i}>{x}</li>)}</ul></section>
       <section className="content-panel"><div className="panel-title"><Heart size={18}/> Little productivity corner</div><p className="text-sm leading-7 text-[#777b99]">You have <strong>{notes.length}</strong> saved notes, <strong>{notes.filter(n=>n.pinned).length}</strong> pinned favorites, and <strong>{notes.reduce((s,n)=>s+taskLines(n.body).length,0)}</strong> marked tasks.</p><div className="mini-tip">✿ Tip: Press Enter after a bullet, number, or checkbox to continue your list. Press Enter on a blank bullet to stop.</div></section>
      </div>
     </>}

     {(view==='notes'||view==='pinned')&&<>
      <GroupTitle kicker="✿ YOUR LITTLE LIBRARY" title={view==='pinned'?'Pinned notes':'My notes'} subtitle={view==='pinned'?'The thoughts you want to keep close.':'All your saved thoughts, organized and easy to revisit.'} actions={<><button className="ui-btn ui-btn-soft" onClick={saveNotesBackup}><Download size={15}/> Backup</button><button className="ui-btn ui-btn-primary" onClick={createNote}><Plus size={16}/> New note</button></>}/>
      <div className="filter-bar flex flex-wrap items-center gap-2">
       <label className="search-field flex items-center gap-2"><Search size={16}/><input aria-label="Search saved notes" placeholder="Search your little notes..." value={query} onChange={e=>{setQuery(e.target.value);setArchivePage(0)}}/></label>
       <label className="field-select-wrap"><CalendarDays size={15}/><select aria-label="Filter by month" value={month} onChange={e=>{setMonth(e.target.value);setArchivePage(0)}}><option value="all">All months</option>{months.map(m=><option key={m} value={m}>{monthLabel(m)}</option>)}</select></label>
       <label className="field-select-wrap"><span className="sr-only">Filter note color</span><select aria-label="Filter color" value={colorFilter} onChange={e=>{setColorFilter(e.target.value);setArchivePage(0)}}><option value="all">All colors</option>{COLORS.map(c=><option key={c} value={c}>{c[0].toUpperCase()+c.slice(1)}</option>)}</select></label>
       <label className="field-select-wrap"><span className="sr-only">Sort saved notes</span><select aria-label="Sort notes" value={sort} onChange={e=>{setSort(e.target.value);setArchivePage(0)}}><option value="updated">Recently edited</option><option value="created">Newest created</option><option value="title">Title A–Z</option></select></label>
      </div>
      <div className="flex items-center justify-between text-xs text-[#9c96ae] font-bold mb-4"><span>{archiveNotes.length} note{archiveNotes.length===1?'':'s'} · {monthLabel(month)}</span><span>Click a note to open its window ♡</span></div>
      {visibleArchive.length?<div className="archive-grid">{visibleArchive.map(note=><SavedCard key={note.id} note={note} onClick={()=>openSavedNote(note.id)}/>)}</div>:<div className="empty-archive"><BookOpen size={42}/><h3>No notes here yet</h3><p>Try another month or start capturing your next idea.</p><button className="ui-btn ui-btn-pink" onClick={createNote}><Plus size={16}/> Write a note</button></div>}
      {archiveMaxPage>0&&<div className="page-controls"><button disabled={archivePage===0} onClick={()=>setArchivePage(p=>Math.max(0,p-1))}><ChevronLeft size={16}/> Previous</button><span>{Math.min(archivePage,archiveMaxPage)+1} / {archiveMaxPage+1}</span><button disabled={archivePage>=archiveMaxPage} onClick={()=>setArchivePage(p=>p+1)}>Next <ChevronRight size={16}/></button></div>}
      <div className="archive-help flex items-center gap-3 mt-6"><ShieldCheck size={20}/><p>Notes stay in this browser. You can edit saved notes inside TakeNote without opening another tab. Use Backup to keep a separate copy.</p></div>
     </>}

     {view==='dashboard'&&<>
      <GroupTitle kicker="✦ YOUR MONTH IN WORDS" title="Monthly scrapbook" subtitle="A cozy compilation of all the little things you thought about." actions={<><input type="month" className="month-picker" value={recapMonth} onChange={e=>setRecapMonth(e.target.value)} aria-label="Recap month"/><button className="ui-btn ui-btn-pink" onClick={()=>setAiNoteId('__recap__')} disabled={!recapNotes.length}><WandSparkles size={16}/> AI recap</button><button className="ui-btn ui-btn-soft" onClick={exportRecap}><Download size={16}/> Export</button></>}/>
      <div className="stats-grid">
       <Stat icon={FileText} value={recapStats.count} label="NOTES WRITTEN" color="stat-blue"/>
       <Stat icon={PenLine} value={recapStats.words.toLocaleString()} label="WORDS CAPTURED" color="stat-pink"/>
       <Stat icon={CalendarDays} value={recapStats.days} label="ACTIVE DAYS" color="stat-purple"/>
       <Stat icon={ListTodo} value={recapStats.tasks} label="MARKED TASKS" color="stat-green"/>
      </div>
      <div className="bottom-panels grid grid-cols-1 lg:grid-cols-2 gap-5">
       <section className="content-panel"><div className="panel-title"><Sparkles size={18}/> The month in little words</div><p className="panel-sub">A summary from notes written in {monthLabel(recapMonth)}.</p><ul className="digest-list">{digest(recapNotes,9).map((x,i)=><li key={i}>{x}</li>)}</ul></section>
       <section className="content-panel"><div className="panel-title"><CalendarDays size={18}/> Your writing days</div><p className="panel-sub">Notes created on each day of the selected month.</p><div className="activity-bars">{perDay.map((count,i)=><div key={i} className="activity-bar" style={{height:Math.max(4,(count/maxDay)*100)+'%'}} title={'Day '+(i+1)+': '+count+' note(s)'} aria-label={'Day '+(i+1)+': '+count+' notes'} role="img"/>)}</div></section>
      </div>
      <GroupTitle kicker="♡ MONTHLY COLLECTION" title="Notes written this month" actions={<><button className="ui-btn ui-btn-soft" onClick={saveNotesBackup}><Download size={16}/> Backup JSON</button><button className="ui-btn ui-btn-soft" onClick={()=>importRef.current?.click()}><Upload size={16}/> Restore</button></>}/>
      {recapNotes.length?<div className="archive-grid">{recapNotes.map(note=><SavedCard key={note.id} note={note} onClick={()=>openSavedNote(note.id)}/>)}</div>:<div className="empty-archive"><CalendarDays size={42}/><h3>Nothing written this month</h3><p>Select another month or create a new note.</p><button className="ui-btn ui-btn-pink" onClick={createNote}>＋ New note</button></div>}
     </>}
     <footer className="app-footer">made with <span>♥</span> and tiny pixel dreams · your notes are saved in this browser ✧</footer>
    </main>
   </div>
  </div>
  <input ref={importRef} className="hidden" type="file" accept=".json,application/json" onChange={restoreBackup}/>
  {noteWindow&&<div className="overlay overlay-note" onMouseDown={e=>{if(e.target===e.currentTarget)setSavedWindowId(null)}}>
   <section className="pixel-dialog note-dialog animate-pop" role="dialog" aria-modal="true" aria-labelledby="saved-note-window-title">
    <div className="window-chrome flex justify-between gap-3 items-center">
     <div className="flex items-center gap-3 min-w-0"><span className="window-dots" aria-hidden="true"><i/><i/><i/></span><div className="min-w-0"><p className="pixel-kicker">✿ OPENED FROM MY NOTES</p><h2 id="saved-note-window-title" className="font-extrabold truncate">{noteWindow.title||'Untitled thought'}</h2></div></div>
     <div className="flex items-center gap-2"><span className="text-xs font-bold text-[#9186a5] hidden sm:inline">autosaved locally</span><button className="close-btn" onClick={()=>setSavedWindowId(null)} aria-label="Close note window"><X size={18}/></button></div>
    </div>
    <div className="note-window-body">
     <NotePad note={noteWindow} onChange={changeNote} onPin={pinNote} onAI={setAiNoteId} onDelete={deleteNote} onExport={exportNote} focused/>
     <div className="flex justify-between items-center gap-3 flex-wrap mt-4">
      <div className="flex items-center gap-2 text-xs font-bold text-[#767496]">Note color: {COLORS.map(c=><button key={c} aria-label={'Change note to '+c} title={c} onClick={()=>changeColor(noteWindow.id,c)} className={'color-dot color-'+c+(noteWindow.color===c?' color-selected':'')}/>)}</div>
      <button className="ui-btn ui-btn-primary" onClick={()=>setSavedWindowId(null)}><Check size={15}/> Done editing</button>
     </div>
    </div>
   </section>
  </div>}
  {aiNote&&<AiPanel key={aiNote.id} note={aiNote} config={aiConfig} apiKey={apiKey} onClose={()=>setAiNoteId(null)} onApply={applyAI} onSettings={()=>setSettingsOpen(true)}/>}
  {settingsOpen&&<AiSettings config={aiConfig} apiKey={apiKey} onSave={saveAISettings} onClose={()=>setSettingsOpen(false)}/>}
  {toast&&<div className="toast-message" role="status"><Sparkles size={15}/> {toast}</div>}
 </div>
 );
}
