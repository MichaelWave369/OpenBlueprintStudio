/**
 * R19: operator-created, bounded local recovery checkpoints.
 * Global to this browser's OpenBlue workspace vault. No inferred project identity.
 * Recovery is separate from R15 handoff inspection and uses R17 guarded restore.
 */
import {validateWorkspace} from './projectVault.js';

export const TIMELINE_SCHEMA='openblue.project-timeline/1';
export const CHECKPOINT_BACKUP_SCHEMA='openblue.project-checkpoint/1';
export const TIMELINE_STORAGE_KEY='openblue/project-timeline-v1';
export const MAX_CHECKPOINTS=4;
export const MAX_TIMELINE_BYTES=3_500_000;
export const MAX_CHECKPOINT_BYTES=1_500_000;
const encoder=new TextEncoder();
const bytes=text=>encoder.encode(text).length;
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const keys=(value,expected,label)=>{
 if(!object(value)||Object.keys(value).sort().join('|')!==[...expected].sort().join('|'))
  throw Error('Unexpected '+label+' fields.');
};
const safeText=(v,label,n)=>{
 if(typeof v!=='string'||!v.trim()||v.length>n||/[\u0000-\u001f\u007f]/.test(v))
  throw Error(label+' must be plain text, 1–'+n+' characters.');
 return v.trim();
};
const stamp=at=>{
 if(typeof at!=='string'||Number.isNaN(Date.parse(at))||
  new Date(at).toISOString()!==at)throw Error('Invalid UTC checkpoint timestamp.');
 return at;
};
const cleanItem=item=>{
 keys(item,['id','label','createdAt','workspace'],'checkpoint');
 const workspace=validateWorkspace(item.workspace);
 if(bytes(JSON.stringify(workspace))>MAX_CHECKPOINT_BYTES)
  throw Error('Complete checkpoint exceeds 1.5 MB.');
 return {
  id:safeText(item.id,'Checkpoint ID',100),
  label:safeText(item.label,'Checkpoint label',100),
  createdAt:stamp(item.createdAt),
  workspace,
 };
};
export const emptyTimeline=()=>({schemaVersion:TIMELINE_SCHEMA,checkpoints:[]});
export function parseProjectTimeline(raw){
 if(typeof raw!=='string'||bytes(raw)>MAX_TIMELINE_BYTES)
  throw Error('Timeline exceeds the 3.5 MB storage bound.');
 let doc;
 try{doc=JSON.parse(raw);}catch{throw Error('Timeline is not valid JSON.');}
 keys(doc,['schemaVersion','checkpoints'],'timeline');
 if(doc.schemaVersion!==TIMELINE_SCHEMA||!Array.isArray(doc.checkpoints)||
  doc.checkpoints.length>MAX_CHECKPOINTS)
  throw Error('Unsupported timeline schema or checkpoint count.');
 const checkpoints=doc.checkpoints.map(cleanItem);
 if(new Set(checkpoints.map(c=>c.id)).size!==checkpoints.length)
  throw Error('Duplicate checkpoint IDs.');
 return {schemaVersion:TIMELINE_SCHEMA,checkpoints};
}
export const serializeProjectTimeline=doc=>JSON.stringify(parseProjectTimeline(JSON.stringify(doc)));
export function putCheckpoint(timeline,{id,label,createdAt=new Date().toISOString(),workspace}){
 const entry=cleanItem({id,label,createdAt,workspace});
 const base=parseProjectTimeline(JSON.stringify(timeline));
 const index=base.checkpoints.findIndex(c=>c.id===entry.id);
 const checkpoints=index<0?[entry,...base.checkpoints]:
  base.checkpoints.map(c=>c.id===entry.id?entry:c);
 if(checkpoints.length>MAX_CHECKPOINTS)
  throw Error('Timeline is full. Export/delete a checkpoint before capturing another or recovering.');
 return parseProjectTimeline(JSON.stringify({schemaVersion:TIMELINE_SCHEMA,checkpoints}));
}
export function dropCheckpoint(timeline,id){
 const base=parseProjectTimeline(JSON.stringify(timeline));
 return parseProjectTimeline(JSON.stringify({...base,checkpoints:base.checkpoints.filter(c=>c.id!==id)}));
}
export const exportCheckpoint=item=>JSON.stringify({
 schemaVersion:CHECKPOINT_BACKUP_SCHEMA,checkpoint:cleanItem(item),
});
export function parseCheckpointBackup(raw){
 if(typeof raw!=='string'||bytes(raw)>MAX_CHECKPOINT_BYTES+5000)
  throw Error('Checkpoint backup exceeds its 1.5 MB bound.');
 let doc;
 try{doc=JSON.parse(raw);}catch{throw Error('Checkpoint backup is not valid JSON.');}
 keys(doc,['schemaVersion','checkpoint'],'checkpoint backup');
 if(doc.schemaVersion!==CHECKPOINT_BACKUP_SCHEMA)throw Error('Unsupported checkpoint backup schema.');
 return cleanItem(doc.checkpoint);
}
export function loadTimeline(storage=globalThis.localStorage){
 try{
  const raw=storage?.getItem(TIMELINE_STORAGE_KEY);
  return {doc:raw?parseProjectTimeline(raw):emptyTimeline(),error:null};
 }catch(error){
  return {doc:emptyTimeline(),error:'Saved checkpoints could not be read: '+error.message};
 }
}
export function saveTimeline(timeline,storage=globalThis.localStorage){
 if(!storage)throw Error('Local browser storage is unavailable.');
 storage.setItem(TIMELINE_STORAGE_KEY,serializeProjectTimeline(timeline));
}
/**
 * Reports deterministic, capped per-section ID changes without carrying full
 * sensitive record contents. The report compares sources, not device reality.
 */
const indexRecords=(list,key)=>new Map(list.map((item,i)=>[key(item,i),item]));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function section(name,left,right,key){
 const a=indexRecords(left,key),b=indexRecords(right,key);
 let added=0,removed=0,changed=0;
 const examples=[];
 const label=k=>String(k).slice(0,110);
 for(const [id,record] of b){
  if(!a.has(id)){added++;if(examples.length<8)examples.push({change:'added',id:label(id)});}
  else if(!same(a.get(id),record)){changed++;if(examples.length<8)examples.push({change:'changed',id:label(id)});}
 }
 for(const id of a.keys())if(!b.has(id)){
  removed++;if(examples.length<8)examples.push({change:'removed',id:label(id)});
 }
 return {name,added,removed,changed,examples,total:added+removed+changed};
}
export function compareWorkspaceVersions(from,to,{fromLabel='Current active',toLabel='Selected checkpoint'}={}){
 const a=validateWorkspace(from),b=validateWorkspace(to);
 const sections=[
  section('Walls',a.project.walls,b.project.walls,x=>x.id),
  section('Symbols',a.project.symbols,b.project.symbols,x=>x.id),
  section('Room labels',Object.entries(a.roomAnnotations.entries).map(([id,value])=>({id,value})),
   Object.entries(b.roomAnnotations.entries).map(([id,value])=>({id,value})),x=>x.id),
  section('Pathways',a.pathways.routes,b.pathways.routes,
   x=>JSON.stringify([x.hubId,x.dropId])),
  section('Racks',a.rackPlan.racks,b.rackPlan.racks,x=>x.id),
  section('Patch allocations',a.rackPlan.assignments,b.rackPlan.assignments,
   x=>JSON.stringify([x.rackId,x.panelId,x.port])),
  section('Switches',a.logicalTopology.switches,b.logicalTopology.switches,x=>x.id),
  section('Proposed links',a.logicalTopology.links,b.logicalTopology.links,x=>x.id),
  section('Evidence receipts',a.fieldEvidence.events,b.fieldEvidence.events,x=>x.id),
 ];
 const prefs=section('Project settings',[
  {id:'title',value:a.project.metadata.title},{id:'units',value:a.project.metadata.units},
  {id:'grid',value:a.project.metadata.grid},
  {id:'analysisMode',value:a.preferences.analysisMode},
  {id:'networkHubId',value:a.preferences.networkHubId},
 ],[
  {id:'title',value:b.project.metadata.title},{id:'units',value:b.project.metadata.units},
  {id:'grid',value:b.project.metadata.grid},
  {id:'analysisMode',value:b.preferences.analysisMode},
  {id:'networkHubId',value:b.preferences.networkHubId},
 ],x=>x.id);
 sections.push(prefs);
 const removedEvidence=sections.find(s=>s.name==='Evidence receipts')?.removed||0;
 const fromSymbolIds=new Set(a.project.symbols.map(s=>s.id));
 const overlap=b.project.symbols.filter(s=>fromSymbolIds.has(s.id)).length;
 const warnings=[
  'Checkpoint comparison only matches logical record IDs and metadata. No author signature, physical change detection, or field instrument testing is performed.',
  'Opening a checkpoint replaces ALL six active documents and project preferences. It never merges or repairs specific records.',
  ...(a.project.metadata.title!==b.project.metadata.title?[
   'The project titles differ. These could be different projects; verify target identity before recovery.']:[]),
  ...(removedEvidence?[
   removedEvidence+' human evidence receipt(s) present in the source are absent from the target. A separate pre-recovery checkpoint is mandatory.']:[]),
  ...(fromSymbolIds.size&&b.project.symbols.length&&!overlap?[
   'No CAD symbol IDs overlap. Check whether these are different designs; no references will be carried across.']:[]),
 ];
 const totalChanges=sections.reduce((n,s)=>n+s.total,0);
 return {
  schemaVersion:'openblue.project-diff/1',
  fromLabel,toLabel,
  fromProject:a.project.metadata.title,toProject:b.project.metadata.title,
  totalChanges,sections,warnings,
  noChanges:totalChanges===0,
 };
}
export const exportCheckpointComparison=report=>JSON.stringify(report,null,2);
