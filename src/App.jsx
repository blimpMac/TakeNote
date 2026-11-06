
import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {
  Menu, X, Plus, BookOpen, BookMarked, LayoutDashboard, Heart, Settings2, Sparkles,
  Search, Download, Upload, ChevronLeft, ChevronRight, CalendarDays, FileText,
  Star, PenLine, ArrowRight, ShieldCheck, Check, Clock3, Layers3, WandSparkles,
  Pin, Trash2, Smile, ListTodo, Cloud, Send, Copy, ArrowLeft
} from 'lucide-react';
import NotePad from './components/NotePad.jsx';
import {localDateKey,periodRange,shiftPeriodAnchor,notesForPeriod,interpretPeriodNotes,activityForPeriod,periodMarkdown} from './lib/insights.js';
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
function PixelMark({size=27}) {
 return <svg className="pixel-t-mark" width={size} height={size} viewBox="0 0 24 24" shapeRendering="crispEdges" role="img" aria-label="TakeNote pixel T logo" focusable="false">
  <path d="M3 4H23V10H16V22H10V10H3Z" fill="#B54D88"/>
  <path d="M1 2H21V8H14V20H8V8H1Z" fill="#FF69B4"/>
  <path d="M3 3H19V5H3Z" fill="#FFC2E1"/>
  <path d="M9 8H11V18H9Z" fill="#FF9CCD"/>
 </svg>;
}
const DEFAULT_AI={provider:'openrouter',model:'openrouter/free'};
function loadPrefs() {
 try {const o=JSON.parse(localStorage.getItem(PREF_KEY)||'{}');return [1,2,4].includes(o.grid)?o.grid:2;}
 catch{return 2;}
}
function loadAiPrefs(){
 try {const a=JSON.parse(localStorage.getItem('takenote.ai.prefs.v2')||'{}');const provider=['openrouter','groq','offline'].includes(a.provider)?a.provider:'openrouter';const freeModel=typeof a.model==='string'&&(a.model==='openrouter/free'||/^[a-z0-9_.-]+\/[a-z0-9_.:-]+:free$/i.test(a.model));return {provider,model:provider==='groq'?'openai/gpt-oss-20b':freeModel?a.model:'openrouter/free'};}
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
 const [insightPeriod,setInsightPeriod]=useState('month');
 const [insightAnchor,setInsightAnchor]=useState(()=>localDateKey());
 const [insightBasis,setInsightBasis]=useState('created');
 const [insightQuery,setInsightQuery]=useState('');
 const [insightVisibleLimit,setInsightVisibleLimit]=useState(12);
 const [activeId,setActiveId]=useState(null);
 const [savedWindowId,setSavedWindowId]=useState(null);
 const [aiNoteId,setAiNoteId]=useState(null);
 const [settingsOpen,setSettingsOpen]=useState(false);
 const [aiConfig,setAiConfig]=useState(loadAiPrefs);
 const [apiKey,setApiKey]=useState('');
 const [sidebarOpen,setSidebarOpen]=useState(false);
 const [sidebarCollapsed,setSidebarCollapsed]=useState(false);
 const [mobileNav,setMobileNav]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(max-width:760px)').matches);
 const [date,setDate]=useState(new Date());
 const [toast,setToast]=useState('');
 const [storageOk,setStorageOk]=useState(true);
 const importRef=useRef(null);
 const focusRef=useRef(false);

 useEffect(()=>{
  const media=window.matchMedia('(max-width:760px)');
  const sync=()=>setMobileNav(media.matches);
  sync();
  media.addEventListener('change',sync);
  return()=>media.removeEventListener('change',sync);
 },[]);
 const panelExpanded=mobileNav?sidebarOpen:!sidebarCollapsed;
 function toggleSidebar(){if(mobileNav)setSidebarOpen(open=>!open);else setSidebarCollapsed(closed=>!closed)}
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
 const periodInfo=useMemo(()=>periodRange(insightPeriod,insightAnchor),[insightPeriod,insightAnchor]);
 const periodNotes=useMemo(()=>{
  const base=notesForPeriod(notes,insightPeriod,insightAnchor,insightBasis);
  const q=insightQuery.toLocaleLowerCase().trim();
  return q?base.filter(n=>(n.title+' '+n.body).toLocaleLowerCase().includes(q)):base;
 },[notes,insightPeriod,insightAnchor,insightBasis,insightQuery]);
 const insights=useMemo(()=>interpretPeriodNotes(periodNotes,insightBasis),[periodNotes,insightBasis]);
 const periodActivity=useMemo(()=>activityForPeriod(periodNotes,insightPeriod,insightAnchor,insightBasis),[periodNotes,insightPeriod,insightAnchor,insightBasis]);
 const maxActivity=Math.max(1,...periodActivity.map(x=>x.count));
 const openTaskCount=insights.tasks.filter(t=>!t.done).length;
 useEffect(()=>setInsightVisibleLimit(12),[insightPeriod,insightAnchor,insightBasis,insightQuery]);
 const noteWindow=notes.find(n=>n.id===savedWindowId);
 const syntheticPeriod=aiNoteId==='__insights__'?{id:'__insights__',title:'Insights — '+periodInfo.label,body:periodNotes.map(n=>'## '+(n.title||'Untitled')+'\n'+n.body).join('\n\n---\n').slice(0,14000)}:null;
 const aiNote=syntheticPeriod||notes.find(n=>n.id===aiNoteId);
 function applyAI(noteId,body){
  if(noteId==='__insights__'){const item=newNote(notes.length);item.title='AI insights — '+periodInfo.label;item.body=body;setNotes(prev=>[item,...prev]);notify('Saved your AI insights as a new note ♡');return}
  changeNote(noteId,'body',body);notify('Approved AI suggestion saved ♡');
 }
 function exportNote(note){downloadFile((note.title||'untitled-note').replace(/[^\w-]+/g,'-').slice(0,45)+'.md',exportMarkdown(note),'text/markdown')}
 function exportRecap(){downloadFile('takenote-'+insightPeriod+'-'+insightAnchor+'-insights.md',periodMarkdown({period:insightPeriod,anchor:insightAnchor,basis:insightBasis,notes:periodNotes,insights}),'text/markdown')}
 function openSavedNote(noteId){setSavedWindowId(noteId);setSidebarOpen(false);}
 function NavButton({label,icon:Icon,active,action,primary=false}) {return <button className={'nav-button '+(active?'nav-active ':'')+(primary?'nav-primary':'')} onClick={action}><Icon size={18}/><span>{label}</span>{active&&<span className="nav-dot" aria-hidden="true"/>}</button>}
 return (
 <div className={'app-shell flex min-h-screen '+(sidebarCollapsed?'desktop-sidebar-hidden':'')}>
  <aside className={'sidebar '+(sidebarOpen?'sidebar-open':'')} aria-label="Main navigation" id="takenote-sidebar">
   <div className="sidebar-header">
    <button type="button" className="hamburger sidebar-toggle" aria-controls="takenote-sidebar" aria-label={panelExpanded?'Collapse side panel':'Expand side panel'} title={panelExpanded?'Collapse menu':'Expand menu'} aria-expanded={panelExpanded} onClick={toggleSidebar}><Menu size={20}/></button>
    {panelExpanded&&<div className="logo flex gap-2 items-center"><div className="logo-icon"><PixelMark size={22}/></div><div className="brand-text">TakeNote</div></div>}
   </div>
   {panelExpanded&&<>
   <p className="side-label pixel-kicker mt-3 mb-4">YOUR PIXEL NOTEBOOK ♡</p>
   <p className="side-label pixel-kicker mt-7 mb-4">✦ YOUR HAPPY PLACE</p>
   <nav className="flex flex-col gap-2">
    <NavButton label="New note" icon={Plus} primary active={view==='write'} action={createNote}/>
    <NavButton label="My notes" icon={BookOpen} active={view==='notes'} action={()=>navigate('notes')}/>
    <NavButton label="Notes insights" icon={LayoutDashboard} active={view==='dashboard'} action={()=>navigate('dashboard')}/>
    <NavButton label="Pinned notes" icon={Heart} active={view==='pinned'} action={()=>navigate('pinned')}/>
   </nav>
   <div className="mt-auto side-bottom">
    <div className="kitty-card"><CatMascot/><div className="pixel-kicker mt-3">YOU GOT THIS!</div><p className="text-xs font-semibold mt-2">Every little thought matters ♡</p></div>
    <p className="sidebar-foot text-center text-[10px] font-bold mt-5">✿ A space for the little things</p>
   </div>
   </>}
  </aside>
  {sidebarOpen&&<button className="sidebar-shade" aria-label="Close navigation" onClick={()=>setSidebarOpen(false)}/>}
  <div className="main-surface min-w-0 flex-1">
   <div className="site-container mx-auto">
    <header className="topbar flex items-center justify-between gap-3">
     <div className="flex items-center gap-3">
      <div className="mobile-brand" aria-label="TakeNote"><span className="mobile-logo-icon"><PixelMark size={21}/></span><span>TakeNote</span></div>
      <div className="breadcrumb text-xs font-extrabold">my little corner <span className="mx-2">/</span> <span className="breadcrumb-current">{view==='write'?'writing desk':view==='dashboard'?'notes insights':view==='pinned'?'pinned notes':'my notes'}</span></div>
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
      <GroupTitle kicker="✦ AUTO-COMPILED NOTES" title="Notes insights" subtitle="Discover important details from a day, week, month or year — automatically and without an AI key." actions={<>
       <button className="ui-btn ui-btn-pink" onClick={()=>setAiNoteId('__insights__')} disabled={!periodNotes.length}><WandSparkles size={16}/> Deeper AI recap</button>
       <button className="ui-btn ui-btn-soft" onClick={exportRecap} disabled={!periodNotes.length}><Download size={16}/> Export insights</button>
      </>}/>
      <div className="insight-filter-bar" aria-label="Notes insights filters">
       <div className="insight-period-switch" role="group" aria-label="Group notes by period">
        {['day','week','month','year'].map(p=><button key={p} type="button" className={insightPeriod===p?'selected':''} aria-pressed={insightPeriod===p} onClick={()=>setInsightPeriod(p)}>{p[0].toUpperCase()+p.slice(1)}</button>)}
       </div>
       <div className="insight-date-nav">
        <button type="button" className="insight-arrow" aria-label="Previous period" title="Previous period" onClick={()=>setInsightAnchor(p=>shiftPeriodAnchor(insightPeriod,p,-1))}><ChevronLeft size={17}/></button>
        {insightPeriod==='year'
         ?<input className="insight-date-input insight-year" aria-label="Choose year" type="number" min="2000" max="2100" value={Number(insightAnchor.slice(0,4))} onChange={e=>{const y=Number(e.target.value);if(Number.isInteger(y)&&y>=2000&&y<=2100)setInsightAnchor(y+'-01-01')}}/>
         :<input className="insight-date-input" aria-label={insightPeriod==='month'?'Choose month':'Choose date in selected '+insightPeriod} type={insightPeriod==='month'?'month':'date'} value={insightPeriod==='month'?insightAnchor.slice(0,7):insightAnchor} onChange={e=>{if(e.target.value)setInsightAnchor(insightPeriod==='month'?e.target.value+'-01':e.target.value)}}/>}
        <button type="button" className="insight-arrow" aria-label="Next period" title="Next period" onClick={()=>setInsightAnchor(p=>shiftPeriodAnchor(insightPeriod,p,1))}><ChevronRight size={17}/></button>
        <button type="button" className="insight-today" onClick={()=>setInsightAnchor(localDateKey())}>Current</button>
       </div>
       <label className="insight-field"><span>Date</span><select aria-label="Filter by date created or last edited" value={insightBasis} onChange={e=>setInsightBasis(e.target.value)}><option value="created">Created</option><option value="updated">Last edited</option></select></label>
       <label className="insight-search"><Search size={15}/><input type="search" aria-label="Search within selected period" placeholder="Search in this period..." value={insightQuery} onChange={e=>setInsightQuery(e.target.value)}/></label>
      </div>
      <div className="insight-period-caption"><CalendarDays size={15}/><strong>{periodInfo.label}</strong><span>· {insightBasis==='created'?'By creation date':'By last-edited date'} · {insightQuery?'Search applied':'All matching notes'}</span></div>
      <div className="stats-grid">
       <Stat icon={FileText} value={insights.count} label="NOTES" color="stat-blue"/>
       <Stat icon={PenLine} value={insights.words.toLocaleString()} label="WORDS" color="stat-pink"/>
       <Stat icon={CalendarDays} value={insights.activeDays} label="WRITING DAYS" color="stat-purple"/>
       <Stat icon={ListTodo} value={openTaskCount} label="OPEN TASKS" color="stat-green"/>
      </div>
      <section className="insight-overview animate-rise" aria-labelledby="insight-overview-heading">
       <div className="insight-overview-head"><h3 id="insight-overview-heading"><Sparkles size={18}/> Automatic interpretation</h3><span className="insight-offline-mark">✧ Auto-updated · no API key</span></div>
       <p>{insights.overview}</p>
       {insights.themes.length>0&&<div className="insight-theme-line"><span>Frequent terms</span>{insights.themes.map(topic=><button type="button" key={topic.name} className="insight-theme" title="Filter period notes by this term" onClick={()=>setInsightQuery(topic.name)}>{topic.name}</button>)}</div>}
      </section>
      <div className="insight-detail-grid">
       <section className="content-panel insight-detail-panel">
        <div className="panel-title"><Sparkles size={18}/> Key highlights</div>
        <p className="panel-sub">Important lines and main ideas found in your notes.</p>
        {insights.highlights.length?<div className="insight-excerpt-list">{insights.highlights.map((item,i)=><button key={item.noteId+'-'+i} type="button" className="insight-excerpt" title={'Open '+item.noteName} onClick={()=>openSavedNote(item.noteId)}><span className="insight-excerpt-icon">✧</span><span>{item.text}<small>{item.noteName}</small></span></button>)}</div>:<p className="insight-empty">No highlights identified for this period.</p>}
        {insights.dates.length>0&&<><div className="insight-subheading"><CalendarDays size={15}/> Dates mentioned</div><div className="insight-excerpt-list">{insights.dates.map((item,i)=><button key={item.noteId+'-'+i} className="insight-excerpt" type="button" onClick={()=>openSavedNote(item.noteId)}>{item.text}</button>)}</div></>}
       </section>
       <section className="content-panel insight-detail-panel">
        <div className="panel-title"><ListTodo size={18}/> Tasks & decisions</div>
        <p className="panel-sub">Items explicitly written in the selected notes.</p>
        {insights.tasks.length?<div className="insight-excerpt-list">{insights.tasks.map((item,i)=><button key={item.noteId+'-'+i} type="button" className="insight-excerpt" onClick={()=>openSavedNote(item.noteId)}><span className={item.done?'insight-task-done':'insight-task-open'}>{item.done?'☑':'☐'}</span><span>{item.text}<small>{item.noteName}{item.done?' · completed':''}</small></span></button>)}</div>:<p className="insight-empty">No explicit to-dos found. Try writing “TODO:” or “- [ ]” in a note.</p>}
        <div className="insight-subheading"><Check size={15}/> Decisions</div>
        {insights.decisions.length?<div className="insight-excerpt-list">{insights.decisions.map((item,i)=><button key={item.noteId+'-'+i} type="button" className="insight-excerpt" onClick={()=>openSavedNote(item.noteId)}><span>◆</span><span>{item.text}<small>{item.noteName}</small></span></button>)}</div>:<p className="insight-empty">No decisions recorded with words like “decided” or “approved.”</p>}
       </section>
      </div>
      <section className="content-panel insight-activity-panel">
       <div className="panel-title"><CalendarDays size={18}/> Writing activity · {periodInfo.label}</div>
       <p className="panel-sub">Count of notes {insightBasis==='created'?'created':'last edited'} in each {insightPeriod==='day'?'4-hour block':insightPeriod==='week'?'day':insightPeriod==='month'?'day':'month'}.</p>
       <div className="activity-bars" role="group" aria-label="Writing activity chart">{periodActivity.map((point,i)=><div key={i} className="activity-bar" style={{height:Math.max(4,(point.count/maxActivity)*100)+'%'}} title={point.label+': '+point.count+' note(s)'} aria-label={point.label+': '+point.count+' notes'} role="img"/>)}</div>
      </section>
      <GroupTitle kicker="♡ NOTES IN THIS PERIOD" title={'Saved notes · '+periodInfo.label} subtitle={'Showing '+Math.min(periodNotes.length,insightVisibleLimit)+' of '+periodNotes.length+' notes'} actions={<><button className="ui-btn ui-btn-soft" onClick={saveNotesBackup}><Download size={15}/> Backup JSON</button><button className="ui-btn ui-btn-soft" onClick={()=>importRef.current?.click()}><Upload size={15}/> Restore</button></>}/>
      {periodNotes.length?<div className="archive-grid">{periodNotes.slice(0,insightVisibleLimit).map(note=><SavedCard key={note.id} note={note} onClick={()=>openSavedNote(note.id)}/>)}</div>:<div className="empty-archive"><CalendarDays size={42}/><h3>No matching notes</h3><p>Try a different date, switch between Created and Last edited, or clear your search filter.</p><button className="ui-btn ui-btn-pink" onClick={createNote}><Plus size={15}/> Write a note</button></div>}
      {insightVisibleLimit<periodNotes.length&&<div className="page-controls"><button type="button" onClick={()=>setInsightVisibleLimit(n=>n+12)}>Show 12 more notes <ChevronRight size={16}/></button></div>}
      <p className="insight-method-note">Insights are extracted from your notes on this device, not generated or inferred by AI. They refresh as you write. For a more natural-language interpretation, choose “Deeper AI recap” (hosted AI setup required).</p>
     </>}

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
  {aiNote&&<AiPanel key={aiNote.id} note={aiNote} initialMode={aiNote.id==='__insights__'?'summarize':'proofread'} config={aiConfig} apiKey={apiKey} onClose={()=>setAiNoteId(null)} onApply={applyAI} onSettings={()=>setSettingsOpen(true)}/>}
  {settingsOpen&&<AiSettings config={aiConfig} apiKey={apiKey} onSave={saveAISettings} onClose={()=>setSettingsOpen(false)}/>}
  {toast&&<div className="toast-message" role="status"><Sparkles size={15}/> {toast}</div>}
 </div>
 );
}
