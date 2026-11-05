
export const STORAGE_KEY = 'takenote.pixel.v1';
export const PREF_KEY = 'takenote.preferences.v1';
export const COLORS = ['pink', 'blue', 'yellow', 'mint', 'lavender'];
export const QUOTES = [
  'A little progress every day becomes something wonderful.',
  'Ideas grow when you give them a place to land.',
  'Begin with one thought. The rest can follow.',
  'Your next great idea might start as a tiny note.',
  'Make room for curiosity, even on the busiest days.',
  'You do not need a perfect plan to make a fresh start.',
  'Small steps have a way of becoming big stories.',
  'Write it down today. Thank yourself tomorrow.',
  'A calm mind makes space for brighter ideas.',
  'Every page is another chance to begin again.',
  'Your pace is enough. Keep your ideas moving.',
  'Collect little moments. They add up beautifully.',
  'A simple idea deserves a chance to shine.',
  'Progress can be quiet and still matter.',
  'The best place to start is right where you are.',
  'Let your thoughts be messy before they become clear.',
  'One kind reminder can change an entire day.',
  'Build your dreams one thoughtful line at a time.',
  'The little things you notice are worth remembering.',
  'A new day is a blank page, not a deadline.',
  'Give yourself credit for showing up today.',
  'Take the next step, even if it is a small one.',
  'Good ideas often begin with an ordinary moment.',
  'You can slow down without giving up.',
  'Make something simple, then make it yours.',
  'Your notes are proof that you keep learning.',
  'There is room for both ambition and rest.',
  'Let today be about trying, not perfection.',
  'A fresh perspective begins with a single question.',
  'Find a little wonder in what you are working on.',
  'What you write today can help you grow tomorrow.'
];
export function id() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return 'note-' + Date.now() + '-' + Math.random().toString(36).slice(2);
}
export function newNote(index = 0) {
  const stamp = new Date().toISOString();
  return { id: id(), title: '', body: '', color: COLORS[index % COLORS.length], pinned: false, created: stamp, updated: stamp };
}
export function normalizeNotes(arr) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  return arr.slice(0,3000).filter(n => n && typeof n.id === 'string' && !seen.has(n.id) && (seen.add(n.id), true)).map(n => ({
    id: n.id,
    title: String(n.title ?? '').slice(0, 160),
    body: String(n.body ?? '').slice(0, 100000),
    color: COLORS.includes(n.color) ? n.color : 'pink',
    pinned: Boolean(n.pinned),
    created: Number.isNaN(Date.parse(n.created)) ? new Date().toISOString() : n.created,
    updated: Number.isNaN(Date.parse(n.updated)) ? (n.created || new Date().toISOString()) : n.updated,
  }));
}
export function loadNotes() {
  try { return normalizeNotes(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
  catch { return []; }
}
export function persistNotes(notes) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); return true; }
  catch { return false; }
}
export function monthKey(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}
export function monthLabel(key) {
  if (!key || key === 'all') return 'All months';
  return new Date(key + '-01T12:00:00').toLocaleDateString(undefined,{month:'long',year:'numeric'});
}
export function dateLabel(date, withYear = false) {
  return new Date(date).toLocaleDateString(undefined,{month:'short', day:'numeric', ...(withYear ? {year:'numeric'} : {})});
}
export function wordCount(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}
export function taskLines(body) {
  return String(body || '').split('\n').filter(line => /^\s*(?:[-*]\s*)?(?:\[ \]\s*|todo:|task:|important:|deadline:)/i.test(line)).map(line => line.trim());
}
export function digest(notes, limit = 7) {
  if (!notes.length) return ['Write your first thought and your highlights will appear here ♡'];
  const output = [], seen = new Set();
  const add = text => { const clean = text.trim().slice(0,200); if (clean && !seen.has(clean.toLowerCase())) { seen.add(clean.toLowerCase()); output.push(clean); } };
  notes.forEach(note => taskLines(note.body).forEach(task => add('☐ ' + task)));
  notes.forEach(note => {
    const title = note.title.trim() || 'Untitled note';
    const first = note.body.replace(/\s+/g,' ').trim().split(/(?<=[.!?])\s+/)[0] || '';
    add(title + (first ? ' — ' + first.slice(0,115) : ''));
  });
  return output.slice(0,limit);
}
export function downloadFile(name, content, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([content],{type:type+';charset=utf-8'}));
  const link = document.createElement('a');
  link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
export function exportMarkdown(note) {
  return '# ' + (note.title || 'Untitled note') + '\n\n' + note.body + '\n';
}
export function monthMarkdown(notes, month) {
  return '# TakeNote monthly recap — ' + monthLabel(month) + '\n\n## Highlights\n' +
    digest(notes, 25).map(x => '- ' + x).join('\n') + '\n\n## Notes\n' +
    notes.map(n => '### ' + (n.title || 'Untitled') + ' — ' + dateLabel(n.created,true) + '\n\n' + n.body).join('\n\n');
}
export function todayQuote(date = new Date()) {
  const utcDay = Math.floor(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()) / 86400000);
  return QUOTES[((utcDay % QUOTES.length) + QUOTES.length) % QUOTES.length];
}
export function insertListAtCursor(value, start, end, kind) {
  const lineStart = value.lastIndexOf('\n',Math.max(0,start-1)) + 1;
  const next = value.indexOf('\n',lineStart);
  const line = value.slice(lineStart, next === -1 ? value.length : next);
  const match = line.match(/^(\s*)(- \[ \] |[-*•] |\d+[.)] )/);
  const indent = match?.[1] || (line.match(/^\s*/) || [''])[0];
  const marker = kind === 'numbers' ? '1. ' : kind === 'tasks' ? '- [ ] ' : '• ';
  const from = lineStart + indent.length;
  const to = match ? lineStart + match[0].length : from;
  const updated = value.slice(0,from) + marker + value.slice(to);
  const cursor = Math.max(from+marker.length,start + marker.length - (to-from));
  return {value:updated,cursor};
}
export function continueListOnEnter(value, caret, selectionEnd) {
  if (caret !== selectionEnd) return null;
  const lineStart = value.lastIndexOf('\n',Math.max(0,caret-1)) + 1;
  const line = value.slice(lineStart,caret);
  const match = line.match(/^(\s*)(- \[ \] |[-*•] |\d+[.)] )/);
  if (!match) return null;
  if (!line.slice(match[0].length).trim()) {
    const updated = value.slice(0,lineStart) + value.slice(lineStart+match[0].length);
    return {value:updated,cursor:lineStart};
  }
  const next = /^(\d+)([.)] )$/.test(match[2]) ?
    String(Number(match[2].match(/^\d+/)[0]) + 1) + match[2].replace(/^\d+/,'') : match[2];
  const insertion = '\n' + match[1] + next;
  return {value:value.slice(0,caret)+insertion+value.slice(caret),cursor:caret+insertion.length};
}
