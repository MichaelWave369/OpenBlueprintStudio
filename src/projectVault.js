/**
 * R17 operator-managed LOCAL project snapshot vault.
 * Every saved slot contains six complete, schema-validated active documents.
 * This does NOT authenticate field reports or prove physical installation.
 *
 * Restores are explicitly confirmed at the UI and written to existing storage
 * keys in one guarded operation with best-effort rollback on storage failure.
 */
import {parseProjectJson,serializeProject,STORAGE_KEY} from './model.js';
import {parseRoomAnnotations,serializeRoomAnnotations,ROOM_ANNOTATIONS_STORAGE_KEY} from './roomAnnotations.js';
import {parsePathways,serializePathways,PATHWAYS_STORAGE_KEY} from './pathwayProposals.js';
import {parseRackPlan,serializeRackPlan,RACK_PLAN_STORAGE_KEY} from './rackPlanning.js';
import {parseTopology,serializeTopology,TOPOLOGY_STORAGE_KEY} from './logicalTopology.js';
import {parseEvidenceLedger,serializeEvidenceLedger,EVIDENCE_STORAGE_KEY} from './fieldEvidence.js';

export const VAULT_SCHEMA='openblue.project-vault/1';
export const BACKUP_SCHEMA='openblue.workspace-backup/1';
export const VAULT_KEY='openblue/project-vault-v1';
export const PREFS_KEY='openblue/active-workspace-preferences-v1';
export const MAX_VAULT_BYTES=3_500_000;
export const MAX_SNAPSHOT_BYTES=1_500_000;
export const MAX_SLOTS=6;
const encoder=new TextEncoder();
const sizeOf=s=>encoder.encode(s).length;
const parsers={
 project:[parseProjectJson,serializeProject,STORAGE_KEY],
 roomAnnotations:[parseRoomAnnotations,serializeRoomAnnotations,ROOM_ANNOTATIONS_STORAGE_KEY],
 pathways:[parsePathways,serializePathways,PATHWAYS_STORAGE_KEY],
 rackPlan:[parseRackPlan,serializeRackPlan,RACK_PLAN_STORAGE_KEY],
 logicalTopology:[parseTopology,serializeTopology,TOPOLOGY_STORAGE_KEY],
 fieldEvidence:[parseEvidenceLedger,serializeEvidenceLedger,EVIDENCE_STORAGE_KEY],
};
export const DOCUMENT_KEYS=Object.freeze(Object.keys(parsers));
const plain=(text,label,max)=>{
 if(typeof text!=='string'||!text.trim()||text.length>max||/[\u0000-\u001f\u007f]/.test(text))
  throw Error(label+' must be plain text of at most '+max+' characters.');
 return text.trim();
};
const timestamp=value=>{
 if(typeof value!=='string'||Number.isNaN(Date.parse(value))||
  new Date(value).toISOString()!==value)throw Error('Invalid UTC saved-at timestamp.');
 return value;
};
const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
const exact=(item,keys,label)=>{
 if(!object(item)||Object.keys(item).sort().join('|')!==[...keys].sort().join('|'))
  throw Error('Unexpected '+label+' fields.');
};
const cleanPrefs=prefs=>{
 exact(prefs,['analysisMode','networkHubId'],'workspace preferences');
 if(!['connected','strict'].includes(prefs.analysisMode))
  throw Error('Unknown room analysis mode.');
 if(typeof prefs.networkHubId!=='string'||prefs.networkHubId.length>120||
  /[\u0000-\u001f\u007f]/.test(prefs.networkHubId))
  throw Error('Invalid saved network hub preference.');
 return {analysisMode:prefs.analysisMode,networkHubId:prefs.networkHubId};
};
export const defaultPreferences=()=>({analysisMode:'connected',networkHubId:''});
export function validateWorkspace(data){
 exact(data,[...DOCUMENT_KEYS,'preferences'],'workspace');
 const result={};
 for(const key of DOCUMENT_KEYS){
  const [parse]=parsers[key];
  const raw=JSON.stringify(data[key]);
  if(!raw||sizeOf(raw)>MAX_SNAPSHOT_BYTES)throw Error(key+' data exceeds workspace limit.');
  result[key]=parse(raw);
 }
 result.preferences=cleanPrefs(data.preferences);
 // A stale hub selector is not a verified drop; clear it rather than attach to new geometry.
 const network=new Set(result.project.symbols.filter(s=>s.type==='network').map(s=>s.id));
 if(result.preferences.networkHubId&&!network.has(result.preferences.networkHubId))
  result.preferences.networkHubId='';
 if(sizeOf(JSON.stringify(result))>MAX_SNAPSHOT_BYTES)
  throw Error('Workspace snapshot exceeds 1.5 MB.');
 return result;
}
export function createWorkspaceSnapshot(data){
 return validateWorkspace(data);
}
export const emptyProjectVault=()=>({schemaVersion:VAULT_SCHEMA,slots:[]});
const cleanSlot=slot=>{
 exact(slot,['id','name','savedAt','workspace'],'vault slot');
 const id=plain(slot.id,'Snapshot ID',100);
 const name=plain(slot.name,'Snapshot name',100);
 return {id,name,savedAt:timestamp(slot.savedAt),workspace:validateWorkspace(slot.workspace)};
};
export function parseProjectVault(raw){
 if(typeof raw!=='string'||sizeOf(raw)>MAX_VAULT_BYTES)
  throw Error('Local project vault exceeds 3.5 MB.');
 let vault;
 try{vault=JSON.parse(raw)}catch{throw Error('Project vault is not valid JSON.');}
 if(!object(vault)||vault.schemaVersion!==VAULT_SCHEMA||!Array.isArray(vault.slots)||
  vault.slots.length>MAX_SLOTS)throw Error('Unsupported project vault schema or slot count.');
 const slots=vault.slots.map(cleanSlot);
 if(new Set(slots.map(x=>x.id)).size!==slots.length)throw Error('Duplicate project slot IDs.');
 return {schemaVersion:VAULT_SCHEMA,slots};
}
export function serializeProjectVault(vault){
 const raw=JSON.stringify(vault);
 return JSON.stringify(parseProjectVault(raw));
}
export function putProjectSlot(vault,{id,name,workspace,savedAt=new Date().toISOString()}){
 const clean=cleanSlot({id,name,savedAt,workspace});
 const base= parseProjectVault(JSON.stringify(vault));
 const i=base.slots.findIndex(x=>x.id===clean.id);
 const slots=i<0?[clean,...base.slots]:base.slots.map(x=>x.id===clean.id?clean:x);
 if(slots.length>MAX_SLOTS)throw Error('Project vault allows at most six snapshots.');
 return parseProjectVault(JSON.stringify({schemaVersion:VAULT_SCHEMA,slots}));
}
export function deleteProjectSlot(vault,id){
 return parseProjectVault(JSON.stringify({...vault,slots:vault.slots.filter(s=>s.id!==id)}));
}
export function exportWorkspaceSlot(slot){
 // Compact output avoids making an otherwise valid near-limit snapshot
 // too large to re-import solely because of pretty-print whitespace.
 return JSON.stringify({schemaVersion:BACKUP_SCHEMA,slot:cleanSlot(slot)});
}
export function parseWorkspaceBackup(raw){
 if(typeof raw!=='string'||sizeOf(raw)>MAX_SNAPSHOT_BYTES+5000)
  throw Error('Workspace backup exceeds size limit.');
 let data;
 try{data=JSON.parse(raw)}catch{throw Error('Workspace backup is not valid JSON.');}
 exact(data,['schemaVersion','slot'],'workspace backup');
 if(data.schemaVersion!==BACKUP_SCHEMA)throw Error('Unsupported workspace backup version.');
 return cleanSlot(data.slot);
}
export function loadProjectVault(storage=globalThis.localStorage){
 try{
  const raw=storage?.getItem(VAULT_KEY);
  return {doc:raw?parseProjectVault(raw):emptyProjectVault(),error:null};
 }catch(error){
  return {doc:emptyProjectVault(),error:'Project library could not be read: '+error.message};
 }
}
export function saveProjectVault(doc,storage=globalThis.localStorage){
 if(!storage)throw Error('Browser storage is unavailable.');
 const raw=serializeProjectVault(doc);
 storage.setItem(VAULT_KEY,raw);
}
export function loadActivePreferences(storage=globalThis.localStorage){
 try{
  const raw=storage?.getItem(PREFS_KEY);
  return raw?cleanPrefs(JSON.parse(raw)):defaultPreferences();
 }catch{return defaultPreferences();}
}
export function saveActivePreferences(prefs,storage=globalThis.localStorage){
 storage.setItem(PREFS_KEY,JSON.stringify(cleanPrefs(prefs)));
}
export function restoreWorkspaceInStorage(workspace,storage=globalThis.localStorage){
 if(!storage)throw Error('Browser storage is unavailable.');
 const clean=validateWorkspace(workspace);
 const updates=DOCUMENT_KEYS.map(key=>[parsers[key][2],parsers[key][1](clean[key])]);
 updates.push([PREFS_KEY,JSON.stringify(clean.preferences)]);
 // Capture every previous value before writing anything. A quota error triggers
 // rollback of every key already written, never intentional partial import.
 const before=updates.map(([key])=>[key,storage.getItem(key)]);
 const applied=[];
 try{
  for(const [key,serialized] of updates){
   storage.setItem(key,serialized);
   applied.push(key);
  }
  for(const [key,serialized] of updates){
   if(storage.getItem(key)!==serialized)throw Error('Readback mismatch for '+key);
  }
 }catch(error){
  let rollbackFailed=false;
  for(const key of [...applied].reverse()){
   const original=before.find(([k])=>k===key)[1];
   try{
    if(original===null)storage.removeItem(key);
    else storage.setItem(key,original);
   }catch{rollbackFailed=true;}
  }
  throw Error('Project restore failed: '+error.message+
   (rollbackFailed?' WARNING: storage rollback also failed. Preserve your backups and reload only after inspection.':
    ' Original active storage keys restored.'));
 }
 return clean;
}
