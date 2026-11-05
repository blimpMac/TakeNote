import test from 'node:test';
import assert from 'node:assert/strict';
import {
 localDateKey,periodRange,shiftPeriodAnchor,notesForPeriod,
 interpretPeriodNotes,activityForPeriod,periodMarkdown
} from '../src/lib/insights.js';

const timestamp=(y,m,d,h=12)=>new Date(y,m-1,d,h,0,0).toISOString();
const records=[
 {id:'a',title:'Budget',body:'TODO: review invoices\nDecision: approved the budget\nDeadline: November 8, 2026',created:timestamp(2026,11,5),updated:timestamp(2026,11,5,14)},
 {id:'b',title:'Roadmap',body:'- [ ] Prepare launch\nImportant: next week',created:timestamp(2026,11,2),updated:timestamp(2026,11,4)},
 {id:'c',title:'Old note',body:'Decided to reschedule\n- [x] Completed task',created:timestamp(2026,10,25),updated:timestamp(2026,11,5)},
 {id:'d',title:'Previous year',body:'History',created:timestamp(2025,11,5),updated:timestamp(2025,11,5)}
];
test('period boundaries use local calendar days and Monday week starts',()=>{
 assert.equal(localDateKey(periodRange('week','2026-11-05').start),'2026-11-02');
 assert.equal(localDateKey(periodRange('week','2026-11-05').end),'2026-11-09');
 assert.equal(localDateKey(periodRange('week','2026-01-01').start),'2025-12-29');
 assert.equal(localDateKey(periodRange('month','2024-02-15').end),'2024-03-01');
 assert.equal(localDateKey(periodRange('year','2026-11-05').end),'2027-01-01');
});
test('previous and next controls keep calendar periods consistent',()=>{
 assert.equal(shiftPeriodAnchor('day','2026-11-05',1),'2026-11-06');
 assert.equal(shiftPeriodAnchor('week','2026-11-05',-1),'2026-10-29');
 assert.equal(shiftPeriodAnchor('month','2026-01-31',1),'2026-02-01');
 assert.equal(shiftPeriodAnchor('year','2026-11-05',1),'2027-01-01');
});
test('day, week, month, year filters include only relevant created dates',()=>{
 assert.equal(notesForPeriod(records,'day','2026-11-05').length,1);
 assert.equal(notesForPeriod(records,'week','2026-11-05').length,2);
 assert.equal(notesForPeriod(records,'month','2026-11-05').length,2);
 assert.equal(notesForPeriod(records,'year','2026-11-05').length,3);
});
test('last edited basis differs from original creation date',()=>{
 assert.deepEqual(notesForPeriod(records,'day','2026-11-05','updated').map(n=>n.id).sort(),['a','c']);
});
test('extracts explicitly written tasks, decisions, date references and active days',()=>{
 const period=notesForPeriod(records,'week','2026-11-05');
 const x=interpretPeriodNotes(period);
 assert.equal(x.count,2);
 assert.equal(x.tasks.length,2);
 assert.equal(x.tasks.filter(t=>!t.done).length,2);
 assert.equal(x.decisions.length,1);
 assert.equal(x.dates.length,1);
 assert.equal(x.activeDays,2);
 assert.match(x.overview,/notes across 2 writing days/);
});
test('does not invent tasks or decisions and ignores blank checkboxes',()=>{
 const x=interpretPeriodNotes([{id:'x',title:'Thought',body:'- [ ] \nJust an idea',created:timestamp(2026,11,5)}]);
 assert.equal(x.tasks.length,0);
 assert.equal(x.decisions.length,0);
 assert.ok(x.highlights.length>0);
});
test('activity bars sum to the period note count',()=>{
 for(const period of ['day','week','month','year']){
  const selected=notesForPeriod(records,period,'2026-11-05');
  const bars=activityForPeriod(selected,period,'2026-11-05');
  assert.equal(bars.reduce((sum,x)=>sum+x.count,0),selected.length);
  assert.equal(bars.length,period==='day'?6:period==='week'?7:period==='year'?12:30);
 }
});
test('export includes filtered highlights and the original source notes',()=>{
 const selected=notesForPeriod(records,'week','2026-11-05');
 const markdown=periodMarkdown({period:'week',anchor:'2026-11-05',basis:'created',notes:selected,insights:interpretPeriodNotes(selected)});
 assert.match(markdown,/TakeNote insights/);
 assert.match(markdown,/TODO: review invoices/);
 assert.match(markdown,/Roadmap/);
 assert.doesNotMatch(markdown,/Previous year/);
});
