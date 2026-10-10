import {describe,it,expect} from 'vitest';
import {createEmptyProject} from './model.js';
import {emptyAnnotations} from './roomAnnotations.js';
import {emptyPathways} from './pathwayProposals.js';
import {emptyRackPlan} from './rackPlanning.js';
import {emptyTopology} from './logicalTopology.js';
import {emptyEvidenceLedger,appendEvidenceReport} from './fieldEvidence.js';
import {createWorkspaceSnapshot} from './projectVault.js';
import {emptyTimeline,putCheckpoint,dropCheckpoint,loadTimeline,saveTimeline,
 compareWorkspaceVersions,exportCheckpointComparison,parseProjectTimeline,
 serializeProjectTimeline,parseCheckpointBackup,exportCheckpoint,MAX_CHECKPOINTS,
 TIMELINE_STORAGE_KEY} from './projectTimeline.js';
const at='2026-10-10T05:00:00.000Z';
function project(tag='A'){
 const blueprint=createEmptyProject();
 blueprint.metadata.title='Site '+tag;
 blueprint.walls=[{id:'wall-'+tag,x1:0,y1:0,x2:5,y2:0,thickness:.5,height:9}];
 blueprint.symbols=[{id:'drop-'+tag,type:'network',x:2,y:1,rotation:0}];
 return createWorkspaceSnapshot({
  project:blueprint,roomAnnotations:emptyAnnotations(),pathways:emptyPathways(),
  rackPlan:emptyRackPlan(),logicalTopology:emptyTopology(),
  fieldEvidence:emptyEvidenceLedger(),
  preferences:{analysisMode:'connected',networkHubId:'drop-'+tag},
 });
}
const slot=(id,workspace=project('A'))=>({id,label:'Checkpoint '+id,createdAt:at,workspace});
const mem=()=>{const map=new Map();return {
 getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,v),
 removeItem:k=>map.delete(k),values:()=>new Map(map),
}};
describe('R19 bounded, explicit source-complete recovery checkpoints',()=>{
 it('stores and reloads entire six-document checkpoint snapshots without altering the source',()=>{
  const a=project('A'),before=JSON.stringify(a),store=mem();
  const timeline=putCheckpoint(emptyTimeline(),slot('first',a));
  saveTimeline(timeline,store);
  expect(loadTimeline(store).doc).toEqual(timeline);
  expect(store.getItem(TIMELINE_STORAGE_KEY)).toContain('Site A');
  expect(JSON.stringify(a)).toBe(before);
  expect(timeline.checkpoints[0].workspace.fieldEvidence.events).toEqual([]);
 });
 it('is bounded and refuses duplicate IDs, unknown schemas or corrupted receipt chains',()=>{
  let timeline=emptyTimeline();
  for(let i=0;i<MAX_CHECKPOINTS;i++)timeline=putCheckpoint(timeline,slot('cp-'+i));
  expect(()=>putCheckpoint(timeline,slot('over-cap'))).toThrow(/full/);
  const malformed=structuredClone(timeline);malformed.checkpoints[1].id='cp-0';
  expect(()=>parseProjectTimeline(JSON.stringify(malformed))).toThrow(/Duplicate/);
  const damaged=structuredClone(timeline);damaged.checkpoints[0].workspace.fieldEvidence.headChecksum='bad';
  expect(()=>parseProjectTimeline(JSON.stringify(damaged))).toThrow(/head checksum/);
  expect(dropCheckpoint(timeline,'cp-2').checkpoints).toHaveLength(3);
 });
 it('exports and imports one fully-validated checkpoint without activating it',()=>{
  const cp=slot('first',project('A')),raw=exportCheckpoint(cp);
  const result=parseCheckpointBackup(raw);
  expect(result).toEqual(cp);
  const modified=JSON.parse(raw);modified.schemaVersion='unknown';
  expect(()=>parseCheckpointBackup(JSON.stringify(modified))).toThrow(/Unsupported/);
  expect(()=>parseCheckpointBackup('{bad')).toThrow(/not valid JSON/);
 });
 it('reports count and capped identifiers for additions/removals without source mutation',()=>{
  const a=project('A'),b=project('A');
  b.project.walls=[{...a.project.walls[0],x2:9},
   {id:'second',x1:0,y1:0,x2:0,y2:1,thickness:.5,height:9}];
  b.project.symbols=[];
  const before=JSON.stringify(b);
  const diff=compareWorkspaceVersions(a,b);
  expect(diff.sections.find(s=>s.name==='Walls')).toMatchObject({added:1,removed:0,changed:1});
  expect(diff.sections.find(s=>s.name==='Symbols')).toMatchObject({removed:1});
  // Removing the selected network symbol also invalidates the saved hub
  // preference; R17 clears that stale reference during workspace validation.
  expect(diff.sections.find(s=>s.name==='Project settings').changed).toBe(1);
  expect(diff.totalChanges).toBe(4);
  expect(JSON.stringify(b)).toBe(before);
  expect(JSON.parse(exportCheckpointComparison(diff)).schemaVersion).toBe('openblue.project-diff/1');
 });
 it('warns about cross-project identity and evidence loss, never hides receipt removal',()=>{
  const a=project('A'),b=project('B');
  const g={nodes:[{id:'drop:["drop-A"]',type:'drop',title:'A',description:'',state:''}],edges:[]};
  a.fieldEvidence=appendEvidenceReport(a.fieldEvidence,g,{
   targetId:'drop:["drop-A"]',reporter:'Site A tech',method:'visual-inspection',
   result:'reported-pass',evidenceRef:'Sheet A',notes:'',
  },at);
  const diff=compareWorkspaceVersions(a,b);
  expect(diff.sections.find(s=>s.name==='Evidence receipts').removed).toBe(1);
  expect(diff.warnings.join(' ')).toMatch(/project titles differ/);
  expect(diff.warnings.join(' ')).toMatch(/pre-recovery checkpoint/);
  expect(diff.noChanges).toBe(false);
 });
 it('diffs identical snapshots deterministically and ignores only project update timestamp',()=>{
  const a=project('A'),b=structuredClone(a);
  b.project.metadata.updatedAt='2026-10-10T08:00:00.000Z';
  const d=compareWorkspaceVersions(a,b);
  expect(d.totalChanges).toBe(0);
  expect(d.noChanges).toBe(true);
  expect(serializeProjectTimeline(putCheckpoint(emptyTimeline(),slot('first'))))
   .toContain('openblue.project-timeline/1');
 });
 it('does not destroy an unreadable timeline on load failure',()=>{
  const s=mem();s.setItem(TIMELINE_STORAGE_KEY,'{broken');
  expect(loadTimeline(s).error).toMatch(/could not be read/);
  expect(s.getItem(TIMELINE_STORAGE_KEY)).toBe('{broken');
 });
});
