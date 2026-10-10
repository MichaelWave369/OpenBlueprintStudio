import {describe,it,expect} from 'vitest';
import {createEmptyProject} from './model.js';
import {emptyAnnotations} from './roomAnnotations.js';
import {emptyPathways} from './pathwayProposals.js';
import {emptyRackPlan} from './rackPlanning.js';
import {emptyTopology} from './logicalTopology.js';
import {emptyEvidenceLedger} from './fieldEvidence.js';
import {
 defaultPreferences,createWorkspaceSnapshot,restoreWorkspaceInStorage,
 emptyProjectVault,putProjectSlot,saveProjectVault,VAULT_KEY,
} from './projectVault.js';
import {emptyTimeline,putCheckpoint,saveTimeline,TIMELINE_STORAGE_KEY} from './projectTimeline.js';
import {runOperatorSelfTest,serializeOperatorSelfTest} from './operatorSelfTest.js';
function workspace(label='A'){
 const project=createEmptyProject();project.metadata.title='Site '+label;
 project.symbols=[{id:'drop-'+label,type:'network',x:1,y:2,rotation:0}];
 return createWorkspaceSnapshot({project,roomAnnotations:emptyAnnotations(),
  pathways:emptyPathways(),rackPlan:emptyRackPlan(),logicalTopology:emptyTopology(),
  fieldEvidence:emptyEvidenceLedger(),preferences:{...defaultPreferences(),networkHubId:'drop-'+label}});
}
function memory(){
 const map=new Map();let writes=0;
 return {getItem:key=>map.has(key)?map.get(key):null,
 setItem:(key,value)=>{writes++;map.set(key,String(value));},
 removeItem:key=>{writes++;map.delete(key);},
 getWrites:()=>writes,peek:key=>map.get(key)};
}
const capabilities={fileApi:true,webCrypto:true,webgl2:true,
 storageEstimate:{usage:1000,quota:100000}};
const code=(report,key)=>report.checks.find(c=>c.code===key).status;
describe('R22 on-demand operator self-test',()=>{
 it('passes validated active project, R17/R19 snapshots, real loaders and R20 sandbox without any live writes',()=>{
  const s=memory(),w=workspace();
  restoreWorkspaceInStorage(w,s);
  saveProjectVault(putProjectSlot(emptyProjectVault(),{
   id:'site-a',name:'Site A',workspace:w,
  }),s);
  saveTimeline(putCheckpoint(emptyTimeline(),{
   id:'checkpoint-a',label:'Checkpoint A',workspace:w,
  }),s);
  const before=s.getWrites(),rawVault=s.peek(VAULT_KEY),rawTimeline=s.peek(TIMELINE_STORAGE_KEY);
  const result=runOperatorSelfTest({workspace:w,storage:s,capabilities});
  expect(result.status).toBe('LOCAL_CHECKS_PASSED');
  expect(result.checks.every(x=>x.status==='PASS')).toBe(true);
  expect(result.counts).toEqual({vaultSlots:1,timelineCheckpoints:1});
  expect(s.getWrites()).toBe(before);
  expect(s.peek(VAULT_KEY)).toBe(rawVault);
  expect(s.peek(TIMELINE_STORAGE_KEY)).toBe(rawTimeline);
 });
 it('distinguishes missing browser storage records and unsupported features from corruption',()=>{
  const s=memory(),w=workspace('B');
  const r=runOperatorSelfTest({workspace:w,storage:s,
   capabilities:{fileApi:false,webCrypto:false,webgl2:false}});
  expect(r.status).toBe('OPERATOR_ATTENTION');
  expect(code(r,'ACTIVE_STORAGE')).toBe('WARN');
  expect(code(r,'VAULT_STORAGE')).toBe('WARN');
  expect(code(r,'RECOVERY_SIMULATION')).toBe('PASS');
  expect(code(r,'BROWSER_FEATURES')).toBe('WARN');
  expect(code(r,'STORAGE_HEADROOM')).toBe('WARN');
  expect(s.getWrites()).toBe(0);
 });
 it('blocks corrupted active sidecar or malformed vault, preserving raw data',()=>{
  const s=memory(),w=workspace('C');restoreWorkspaceInStorage(w,s);
  s.setItem(VAULT_KEY,'{original damaged bytes');
  s.setItem('openblue/field-evidence-v1','not json');
  const before=s.getWrites(),raw=s.peek(VAULT_KEY);
  const r=runOperatorSelfTest({workspace:w,storage:s,capabilities});
  expect(r.status).toBe('OPERATOR_REVIEW_REQUIRED');
  expect(code(r,'ACTIVE_STORAGE')).toBe('FAIL');
  expect(code(r,'VAULT_STORAGE')).toBe('FAIL');
  expect(r.checks.find(x=>x.code==='VAULT_STORAGE').message).toMatch(/original bytes/);
  expect(s.peek(VAULT_KEY)).toBe(raw);
  expect(s.getWrites()).toBe(before);
 });
 it('reports pending autosave as warning rather than damaging the saved project',()=>{
  const s=memory(),w=workspace('D');restoreWorkspaceInStorage(w,s);
  const changed=workspace('E');
  const r=runOperatorSelfTest({workspace:changed,storage:s,capabilities});
  expect(r.status).toBe('OPERATOR_ATTENTION');
  expect(code(r,'ACTIVE_STORAGE')).toBe('PASS');
  expect(code(r,'ACTIVE_SYNC')).toBe('WARN');
 });
 it('flags missing real storage, high quota estimate, and corrupt in-memory source without exposure',()=>{
  const data=workspace('Private Address 123');
  const r=runOperatorSelfTest({workspace:data,storage:null,capabilities:{
   ...capabilities,storageEstimate:{usage:94,quota:100},
  }});
  expect(r.status).toBe('OPERATOR_REVIEW_REQUIRED');
  expect(code(r,'ACTIVE_STORAGE')).toBe('FAIL');
  expect(code(r,'STORAGE_HEADROOM')).toBe('WARN');
  const text=serializeOperatorSelfTest(r);
  expect(text).not.toContain('Private Address 123');
  expect(text).not.toContain('drop-Private');
  const invalid=structuredClone(data);invalid.fieldEvidence.headChecksum='invalid';
  const blocked=runOperatorSelfTest({workspace:invalid,storage:memory(),capabilities});
  expect(code(blocked,'ACTIVE_SCHEMA')).toBe('FAIL');
  expect(code(blocked,'RECOVERY_SIMULATION')).toBe('SKIP');
 });
});
