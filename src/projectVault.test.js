import {describe,it,expect} from 'vitest';
import {createEmptyProject} from './model.js';
import {emptyAnnotations} from './roomAnnotations.js';
import {emptyPathways} from './pathwayProposals.js';
import {emptyRackPlan} from './rackPlanning.js';
import {emptyTopology} from './logicalTopology.js';
import {emptyEvidenceLedger,appendEvidenceReport} from './fieldEvidence.js';
import {emptyProjectVault,createWorkspaceSnapshot,putProjectSlot,deleteProjectSlot,
 parseProjectVault,serializeProjectVault,parseWorkspaceBackup,exportWorkspaceSlot,
 restoreWorkspaceInStorage,loadProjectVault,saveProjectVault,loadActivePreferences,defaultPreferences,
 MAX_SLOTS,PREFS_KEY,DOCUMENT_KEYS} from './projectVault.js';
const snapshot=(tag='A')=>{
 const project=createEmptyProject();
 project.metadata.title='Site '+tag;
 project.symbols=[{id:'drop-'+tag,type:'network',x:1,y:2,rotation:0}];
 return createWorkspaceSnapshot({project,roomAnnotations:emptyAnnotations(),
  pathways:emptyPathways(),rackPlan:emptyRackPlan(),logicalTopology:emptyTopology(),
  fieldEvidence:emptyEvidenceLedger(),
  preferences:{analysisMode:'connected',networkHubId:'drop-'+tag}});
};
const storage=()=>{const x=new Map();return {
 getItem:key=>x.has(key)?x.get(key):null,setItem:(key,val)=>{x.set(key,val)},
 removeItem:key=>x.delete(key),dump:()=>new Map(x),
}};
describe('R17 isolated local project vault',()=>{
 it('saves six complete documents and per-project hub/mode preferences without reference crossover',()=>{
  const a=snapshot('A'),b=snapshot('B');
  let vault=putProjectSlot(emptyProjectVault(),{id:'slot-a',name:'A',workspace:a,
   savedAt:'2026-10-10T04:00:00.000Z'});
  vault=putProjectSlot(vault,{id:'slot-b',name:'B',workspace:b,
   savedAt:'2026-10-10T04:01:00.000Z'});
  const parsed=parseProjectVault(serializeProjectVault(vault));
  expect(parsed.slots).toHaveLength(2);
  expect(parsed.slots[0].workspace.preferences.networkHubId).toBe('drop-B');
  expect(parsed.slots[1].workspace.project.metadata.title).toBe('Site A');
  expect(parsed.slots[1].workspace.preferences.networkHubId).toBe('drop-A');
  expect(parsed.slots[0].workspace.fieldEvidence.events).toEqual([]);
 });
 it('updates a single slot by ID and allows removal without mutating others',()=>{
  const a=snapshot('A'),b=snapshot('B');
  let v=putProjectSlot(emptyProjectVault(),{id:'one',name:'Old',workspace:a});
  v=putProjectSlot(v,{id:'two',name:'Two',workspace:b});
  v=putProjectSlot(v,{id:'one',name:'Updated',workspace:b});
  expect(v.slots).toHaveLength(2);
  expect(v.slots.find(s=>s.id==='one').name).toBe('Updated');
  expect(v.slots.find(s=>s.id==='two').workspace.project.metadata.title).toBe('Site B');
  expect(deleteProjectSlot(v,'one').slots.map(s=>s.id)).toEqual(['two']);
 });
 it('limits snapshots and imports from validated portable backups only',()=>{
  let v=emptyProjectVault();
  for(let n=0;n<MAX_SLOTS;n++)v=putProjectSlot(v,{id:'s'+n,name:'Slot '+n,workspace:snapshot('A')});
  expect(()=>putProjectSlot(v,{id:'extra',name:'Extra',workspace:snapshot('A')})).toThrow(/six snapshots/);
  const exportText=exportWorkspaceSlot(v.slots[0]);
  const imported=parseWorkspaceBackup(exportText);
  expect(imported.workspace.project.metadata.title).toBe('Site A');
  const damaged=JSON.parse(exportText);damaged.slot.workspace.fieldEvidence.headChecksum='BAD';
  expect(()=>parseWorkspaceBackup(JSON.stringify(damaged))).toThrow(/head checksum/);
  expect(()=>parseWorkspaceBackup('no')).toThrow(/not valid JSON/);
 });
 it('clears stale hub preference but retains unrelated project symbol identity',()=>{
  const data=snapshot('A');data.preferences.networkHubId='drop-B';
  const checked=createWorkspaceSnapshot(data);
  expect(checked.preferences.networkHubId).toBe('');
  expect(checked.project.symbols[0].id).toBe('drop-A');
 });
 it('restores every existing active document in storage and reads the correct project after reload',()=>{
  const s=storage(),a=snapshot('A'),b=snapshot('B');
  const docsA=restoreWorkspaceInStorage(a,s);
  const aStored=s.dump();
  expect(docsA.preferences.networkHubId).toBe('drop-A');
  restoreWorkspaceInStorage(b,s);
  expect(s.getItem(PREFS_KEY)).toContain('drop-B');
  expect(s.getItem('openblue/field-evidence-v1')).toContain('GENESIS');
  expect(s.getItem('openblueprint-studio/project-v1')).toContain('Site B');
  expect(s.dump()).not.toEqual(aStored);
  expect(DOCUMENT_KEYS).toHaveLength(6);
  const vault=putProjectSlot(emptyProjectVault(),{id:'slot1',name:'Backup A',workspace:a});
  saveProjectVault(vault,s);
  expect(loadProjectVault(s).doc).toEqual(vault);
  expect(loadActivePreferences(s).networkHubId).toBe('drop-B');
 });
 it('rolls back active values when a write fails halfway through, with no mixed-source documents',()=>{
  const m=storage(),a=snapshot('A'),b=snapshot('B');
  restoreWorkspaceInStorage(a,m);
  const before=m.dump();
  let failed=false;
  const broken={getItem:key=>m.getItem(key),removeItem:key=>m.removeItem(key),
    setItem:(key,val)=>{
      if(key==='openblue/rack-plan-v1'&&!failed){failed=true;throw Error('simulated quota');}
      m.setItem(key,val);
    }};
  expect(()=>restoreWorkspaceInStorage(b,broken)).toThrow(/Original active storage keys restored/);
  expect(m.dump()).toEqual(before);
 });
 it('refuses malformed persisted vault without silently destroying stored data',()=>{
  const m=storage();m.setItem('openblue/project-vault-v1','{not json');
  expect(loadProjectVault(m).error).toMatch(/could not be read/);
  expect(m.getItem('openblue/project-vault-v1')).toBe('{not json');
  expect(loadActivePreferences(m)).toEqual(defaultPreferences());
 });
});
