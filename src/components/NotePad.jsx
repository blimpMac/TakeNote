
import React, {useRef} from 'react';
import { Pin, MoreHorizontal, List, ListOrdered, ListTodo, WandSparkles, Trash2, Download, Sparkles } from 'lucide-react';
import {dateLabel, wordCount, continueListOnEnter, insertListAtCursor} from '../lib/notes.js';

export default function NotePad({ note, onChange, onPin, onColor, onAI, onDelete, onExport, focused = false, small = false }) {
  const bodyRef=useRef(null);
  function formatList(kind) {
    const el=bodyRef.current;
    if(!el) return;
    const edit=insertListAtCursor(el.value,el.selectionStart,el.selectionEnd,kind);
    onChange(note.id,'body',edit.value);
    requestAnimationFrame(()=>{el.focus();el.setSelectionRange(edit.cursor,edit.cursor)});
  }
  function onBodyKeyDown(e) {
    if (e.key!=='Enter' || e.isComposing) return;
    const edit=continueListOnEnter(e.currentTarget.value,e.currentTarget.selectionStart,e.currentTarget.selectionEnd);
    if(!edit) return;
    e.preventDefault();
    onChange(note.id,'body',edit.value);
    requestAnimationFrame(()=>{bodyRef.current?.focus();bodyRef.current?.setSelectionRange(edit.cursor,edit.cursor)});
  }
  return (
    <article className={'note-pad note-'+note.color+(focused?' note-focused':'')+(small?' note-compact':'')} data-note-id={note.id}>
      <div className="note-pad-top flex items-center justify-between gap-2">
        <span className="pixel-label text-[8px] tracking-wide">{note.pinned?'★ PINNED':'✿ '+note.color.toUpperCase()}</span>
        <div className="flex items-center gap-1">
          <button className={'icon-mini '+(note.pinned?'is-pinned':'')} title={note.pinned?'Unpin note':'Pin note'} aria-label={note.pinned?'Unpin note':'Pin note'} onClick={()=>onPin(note.id)}><Pin size={15} /></button>
          {onDelete && <button className="icon-mini" title="Delete note" aria-label="Delete note" onClick={()=>onDelete(note.id)}><Trash2 size={15}/></button>}
        </div>
      </div>
      <input className="note-title-input w-full" value={note.title} onChange={e=>onChange(note.id,'title',e.target.value)} placeholder="Give your note a title..." maxLength={160} aria-label="Note title" spellCheck autoCorrect="off"/>
      <textarea ref={bodyRef} className="note-writing w-full" value={note.body} onChange={e=>onChange(note.id,'body',e.target.value)} onKeyDown={onBodyKeyDown} placeholder="Dear diary, today I..." aria-label="Note content" spellCheck autoCorrect="off" autoCapitalize="sentences"/>
      <div className="editor-toolbar flex flex-wrap gap-1.5 items-center" role="toolbar" aria-label="Writing tools">
        <button className="tool-pill" type="button" title="Bullet list — Enter adds another bullet" onClick={()=>formatList('bullets')}><List size={14}/> <span>Bullets</span></button>
        <button className="tool-pill" type="button" title="Numbered list" onClick={()=>formatList('numbers')}><ListOrdered size={14}/><span>Numbers</span></button>
        <button className="tool-pill" type="button" title="Checklist" onClick={()=>formatList('tasks')}><ListTodo size={14}/><span>Tasks</span></button>
        <button className="tool-pill ai-tool" type="button" onClick={()=>onAI(note.id)} title="Review spelling and AI wording suggestions"><WandSparkles size={14}/><span>AI edit</span></button>
        {onExport && <button className="tool-pill ml-auto" type="button" onClick={()=>onExport(note)} title="Export this note"><Download size={14}/></button>}
      </div>
      <div className="note-pad-footer flex justify-between gap-2 text-[11px] font-bold">
        <span>{dateLabel(note.updated)} · {wordCount(note.body)} words</span>
        <span className="inline-flex items-center gap-1"><Sparkles size={12}/> autosaved</span>
      </div>
    </article>
  );
}
