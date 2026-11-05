
const PERIODS=new Set(['day','week','month','year']);
const STOPWORDS=new Set(('the and for with from this that have has had were was are but not you your our their they them there here then than into onto over under when where what while about after before among within also only just very more some such each every other these those will would could should must been being can may all now yet did does doing get got make made note notes today tomorrow yesterday meeting update updated please reminder need needs task tasks follow project important deadline decided decision next steps items action todo work working team time date year month week daily weekly monthly yearly list first second minutes followup follow done plan planning recap summary untitled').split(' '));
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function realDate(value){
 if(value instanceof Date)return new Date(value.getTime());
 if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)){
  const [y,m,d]=value.split('-').map(Number);
  const dt=new Date(y,m-1,d);
  return dt.getFullYear()===y&&dt.getMonth()===m-1&&dt.getDate()===d?dt:new Date(NaN);
 }
 return new Date(value);
}
export function localDateKey(value=new Date()){
 const d=realDate(value);
 if(Number.isNaN(d.getTime()))return '';
 return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
export function periodRange(period='month',anchor=localDateKey()){
 const mode=PERIODS.has(period)?period:'month';
 const base=realDate(anchor);
 const d=Number.isNaN(base.getTime())?new Date():base;
 let start,end,label;
 const y=d.getFullYear(),m=d.getMonth(),day=d.getDate();
 if(mode==='day'){
  start=new Date(y,m,day);end=new Date(y,m,day+1);
  label=start.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'});
 }else if(mode==='week'){
  const delta=(d.getDay()+6)%7;
  start=new Date(y,m,day-delta);end=new Date(start.getFullYear(),start.getMonth(),start.getDate()+7);
  label='Week of '+start.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
 }else if(mode==='year'){
  start=new Date(y,0,1);end=new Date(y+1,0,1);label=String(y);
 }else{
  start=new Date(y,m,1);end=new Date(y,m+1,1);
  label=start.toLocaleDateString(undefined,{month:'long',year:'numeric'});
 }
 return{mode,start,end,label};
}
export function shiftPeriodAnchor(period,anchor,delta){
 const d=realDate(anchor);
 if(Number.isNaN(d.getTime())||!Number.isFinite(delta))return localDateKey();
 const v=Math.trunc(delta);
 if(period==='year')return localDateKey(new Date(d.getFullYear()+v,0,1));
 if(period==='month')return localDateKey(new Date(d.getFullYear(),d.getMonth()+v,1));
 if(period==='week')return localDateKey(new Date(d.getFullYear(),d.getMonth(),d.getDate()+7*v));
 return localDateKey(new Date(d.getFullYear(),d.getMonth(),d.getDate()+v));
}
export function notesForPeriod(notes,period,anchor,basis='created'){
 const{start,end}=periodRange(period,anchor),field=basis==='updated'?'updated':'created';
 return(Array.isArray(notes)?notes:[]).filter(n=>{
  const t=realDate(n?.[field]).getTime();
  return Number.isFinite(t)&&t>=start.getTime()&&t<end.getTime();
 }).sort((a,b)=>new Date(b[field])-new Date(a[field]));
}
const marker=/^\s*(?:[-*•]\s*)?(?:\[[ xX]\]\s*|(?:todo|task|action|follow[\s-]?up|next step|to do)\s*[:\-]\s*)/i;
const decisionLine=/\b(?:decision|decided|agreed|approved|resolved|concluded|confirmed)\b/i;
const importantLine=/\b(?:important|priority|key point|key detail|remember|highlight|deadline)\b/i;
const dateTokens=/\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}[/.]\d{1,2}[/.]\d{2,4}\b|\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?\b/gi;
function cleanContent(s){return String(s||'').trim().replace(/^\s*(?:[-*•]\s*)?(?:\[[ xX]\]\s*)?/,'').trim().slice(0,180)}
function unique(items,limit){
 const used=new Set(),out=[];
 for(const x of items){const key=x.text.toLocaleLowerCase().replace(/\s+/g,' ').trim();if(!key||used.has(key))continue;used.add(key);out.push(x);if(out.length>=limit)break;}
 return out;
}
export function interpretPeriodNotes(notes,basis='created'){
 const list=Array.isArray(notes)?notes:[];
 const field=basis==='updated'?'updated':'created';
 const tasks=[],decisions=[],priorities=[],firstLines=[],dateRefs=[];
 const topicCounts=new Map();
 let words=0;
 const days=new Set();
 for(const n of list){
  const title=String(n.title||'').trim(),body=String(n.body||'');
  const noteName=title||'Untitled note';
  words+=(title+' '+body).trim().split(/\s+/).filter(Boolean).length;
  const day=localDateKey(n[field]);if(day)days.add(day);
  const add=(where,text)=>where.push({text:cleanContent(text),noteId:n.id,noteName});
  const lines=body.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  for(const line of lines.slice(0,250)){
   const cleaned=cleanContent(line);
   if(cleaned.length<3)continue;
   if(marker.test(line))tasks.push({text:cleaned,noteId:n.id,noteName,done:/^\s*(?:[-*•]\s*)?\[[xX]\]/.test(line)});
   if(decisionLine.test(line))add(decisions,line);
   if(importantLine.test(line))add(priorities,line);
   const dates=line.match(dateTokens)||[];
   for(const match of dates.slice(0,5))add(dateRefs,match+' — '+cleaned.slice(0,110));
  }
  const primary=lines.find(l=>cleanContent(l).length>=8);
  if(primary)add(firstLines,(title?title+': ':'')+primary);
  else if(title)add(firstLines,title);
  const text=(title+' '+title+' '+body.slice(0,6500)).toLocaleLowerCase();
  const terms=text.match(/[\p{L}][\p{L}\p{N}'-]{2,}/gu)||[];
  const present=new Set(terms.filter(t=>t.length>3&&!STOPWORDS.has(t)&&!/\d/.test(t)));
  for(const term of present)topicCounts.set(term,(topicCounts.get(term)||0)+1);
 }
 const topThemes=[...topicCounts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,6).map(([name,count])=>({name,count}));
 const uniqueTasks=unique(tasks,20).map(t=>{
  const original=tasks.find(x=>x.text.toLocaleLowerCase()===t.text.toLocaleLowerCase());
  return {...t,done:!!original?.done};
 });
 const result={
  count:list.length,words,activeDays:days.size,
  tasks:uniqueTasks,decisions:unique(decisions,10),priorities:unique(priorities,10),
  dates:unique(dateRefs,10),highlights:unique([...priorities,...firstLines],10),
  themes:topThemes
 };
 if(!list.length){result.overview='No notes match this period yet. Choose another date, or write a new note to start your collection.';return result;}
 const openTasks=uniqueTasks.filter(t=>!t.done).length;
 const pieces=[list.length+' '+(list.length===1?'note':'notes')+' across '+days.size+' writing '+(days.size===1?'day':'days')];
 if(topThemes.length)pieces.push('Frequent topics include '+topThemes.slice(0,3).map(x=>x.name).join(', '));
 if(openTasks)pieces.push(openTasks+' marked '+(openTasks===1?'task':'tasks')+' to follow up on');
 if(result.decisions.length)pieces.push(result.decisions.length+' recorded '+(result.decisions.length===1?'decision':'decisions'));
 if(result.dates.length)pieces.push(result.dates.length+' date '+(result.dates.length===1?'reference':'references'));
 result.overview=pieces.join('. ').replace(/\.$/,'')+'.';
 return result;
}
export function activityForPeriod(notes,period,anchor,basis='created'){
 const range=periodRange(period,anchor),{start}=range;
 const mode=range.mode;
 let labels=[],counts=[];
 if(mode==='day')labels=['12 AM–4 AM','4 AM–8 AM','8 AM–12 PM','12 PM–4 PM','4 PM–8 PM','8 PM–12 AM'];
 if(mode==='week')labels=Array.from({length:7},(_,i)=>{
  const d=new Date(start.getFullYear(),start.getMonth(),start.getDate()+i);
  return d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
 });
 if(mode==='month')labels=Array.from({length:new Date(start.getFullYear(),start.getMonth()+1,0).getDate()},(_,i)=>String(i+1));
 if(mode==='year')labels=MONTHS;
 counts=labels.map(()=>0);
 const field=basis==='updated'?'updated':'created';
 for(const n of notes){
  const d=realDate(n[field]);if(Number.isNaN(d.getTime()))continue;
  const idx=mode==='day'?Math.floor(d.getHours()/4):mode==='week'?Math.round((new Date(d.getFullYear(),d.getMonth(),d.getDate())-start)/86400000):mode==='month'?d.getDate()-1:d.getMonth();
  if(idx>=0&&idx<counts.length)counts[idx]+=1;
 }
 return labels.map((label,i)=>({label,count:counts[i]}));
}
export function periodMarkdown({period,anchor,basis,notes,insights}){
 const label=periodRange(period,anchor).label;
 const bullets=xs=>xs.length?xs.map(x=>'- '+x.text).join('\n'):'- None identified';
 return '# TakeNote insights — '+label+'\n\n'+'**Filtered by:** '+(basis==='updated'?'Last edited':'Date created')+
 '\n\n## Overview\n'+insights.overview+
 '\n\n## Frequent topics\n'+(insights.themes.map(t=>'- '+t.name).join('\n')||'- None identified')+
 '\n\n## Highlights\n'+bullets(insights.highlights)+
 '\n\n## Tasks\n'+bullets(insights.tasks)+
 '\n\n## Decisions\n'+bullets(insights.decisions)+
 '\n\n## Date references\n'+bullets(insights.dates)+
 '\n\n## Source notes\n'+notes.map(n=>'### '+(n.title||'Untitled note')+'\n\n'+(n.body||'')+'\n').join('\n');
}
