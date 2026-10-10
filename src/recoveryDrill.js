/**
 * R20: offline recovery rehearsal against an isolated in-memory Storage clone.
 * Never touches window.localStorage, active React state, network devices, or
 * approvals. A PASS means ONLY the current R17 codecs reproduced this snapshot
 * and rolled back a simulated write fault.
 */
import {createEmptyProject} from './model.js';
import {emptyAnnotations,loadRoomAnnotations} from './roomAnnotations.js';
import {emptyPathways,loadPathways} from './pathwayProposals.js';
import {emptyRackPlan,loadRackPlan} from './rackPlanning.js';
import {emptyTopology,loadTopology} from './logicalTopology.js';
import {emptyEvidenceLedger,loadEvidenceLedger} from './fieldEvidence.js';
import {loadStoredProject} from './storage.js';
import {
 validateWorkspace,restoreWorkspaceInStorage,loadActivePreferences,
 defaultPreferences,DOCUMENT_KEYS,
} from './projectVault.js';
import {auditWorkspace} from './workspaceAudit.js';

export const RECOVERY_DRILL_SCHEMA='openblue.recovery-drill/1';
const KEYS_COUNT=DOCUMENT_KEYS.length+1;
function memoryStorage(){
 const map=new Map();
 return {
  getItem:key=>map.has(key)?map.get(key):null,
  setItem:(key,value)=>map.set(key,String(value)),
  removeItem:key=>map.delete(key),
  snapshot:()=>Array.from(map.entries()).sort(([a],[b])=>a.localeCompare(b)),
 };
}
function baselineWorkspace(){
 return validateWorkspace({
  project:createEmptyProject(),roomAnnotations:emptyAnnotations(),
  pathways:emptyPathways(),rackPlan:emptyRackPlan(),
  logicalTopology:emptyTopology(),fieldEvidence:emptyEvidenceLedger(),
  preferences:defaultPreferences(),
 });
}
function loadCompleteWorkspace(storage){
 const p=loadStoredProject(storage),room=loadRoomAnnotations(storage),
  routes=loadPathways(storage),racks=loadRackPlan(storage),
  topology=loadTopology(storage),evidence=loadEvidenceLedger(storage);
 const errors=[
  ['project',p.error],['roomAnnotations',room.error],['pathways',routes.error],
  ['rackPlan',racks.error],['logicalTopology',topology.error],['fieldEvidence',evidence.error],
 ].filter(([,error])=>error).map(([key,error])=>key+': '+error);
 if(errors.length||!p.project)throw Error('Loader failures: '+errors.join(' | '));
 return validateWorkspace({
  project:p.project,roomAnnotations:room.doc,pathways:routes.doc,
  rackPlan:racks.doc,logicalTopology:topology.doc,fieldEvidence:evidence.doc,
  preferences:loadActivePreferences(storage),
 });
}
const summaryOf=workspace=>({
 project:workspace.project.metadata.title,
 walls:workspace.project.walls.length,
 symbols:workspace.project.symbols.length,
 roomsAnnotated:Object.keys(workspace.roomAnnotations.entries).length,
 routes:workspace.pathways.routes.length,
 racks:workspace.rackPlan.racks.length,
 switchConcepts:workspace.logicalTopology.switches.length,
 evidenceEvents:workspace.fieldEvidence.events.length,
});
const warnings=[
 'SANDBOX rehearsal only: no actual browser localStorage key was written, no browser reload was exercised, and no real disk/device backup was tested.',
 'PASS means this software version round-tripped the six source documents plus preferences and correctly rolled back one simulated storage fault.',
 'The independent R18 reference audit is advisory for consistency; human-entered evidence and unsigned backups remain unverified.',
 'A sandbox pass does NOT guarantee browser quota, hardware failure, corrupted external files, malicious edits, actual network connectivity, or permission to install equipment.',
];
export function drillWorkspaceRecovery(input,{label='Selected checkpoint',source='saved-checkpoint'}={}){
 const checks=[
  {id:'snapshot-validation',status:'NOT_RUN',detail:'Six input source documents must validate.'},
  {id:'recovered-readback',status:'NOT_RUN',detail:'Seven active keys restored and reloaded through existing loaders.'},
  {id:'exact-recovery',status:'NOT_RUN',detail:'Recovered complete project equals normalized target.'},
  {id:'rollback-fault',status:'NOT_RUN',detail:'Simulated partial write restores all previous storage values.'},
  {id:'baseline-preservation',status:'NOT_RUN',detail:'Existing unrelated starting workspace remains unchanged.'},
 ];
 let sourceAudit=null;
 try{
  const expected=validateWorkspace(input);
  checks[0].status='PASS';
  sourceAudit=auditWorkspace(input,{source:'recovery-drill',name:label});
  if(!sourceAudit.canRestore)throw Error('R18 reference reconciliation blocks recovery rehearsal.');
  const baseline=baselineWorkspace();
  const disk=memoryStorage();
  restoreWorkspaceInStorage(baseline,disk);
  const before=disk.snapshot();
  // Full successful restore and reload through the app's actual source loaders.
  restoreWorkspaceInStorage(expected,disk);
  const loaded=loadCompleteWorkspace(disk);
  checks[1].status='PASS';
  if(JSON.stringify(loaded)!==JSON.stringify(expected))
   throw Error('Recovered workspace differs from validated source.');
  checks[2].status='PASS';
  // Fault injection uses the *same R17 restore function*, not a mock rewrite.
  restoreWorkspaceInStorage(baseline,disk);
  const rollbackBaseline=disk.snapshot();
  let writes=0,once=false;
  const faulty={
   getItem:key=>disk.getItem(key),removeItem:key=>disk.removeItem(key),
   setItem:(key,value)=>{
    writes++;
    if(!once&&writes===4){once=true;throw Error('R20 simulated storage quota failure');}
    disk.setItem(key,value);
   },
  };
  let rejected=false;
  try{restoreWorkspaceInStorage(expected,faulty);}
  catch(error){rejected=/Project restore failed/.test(error.message);}
  if(!rejected||!once||JSON.stringify(disk.snapshot())!==JSON.stringify(rollbackBaseline))
   throw Error('Rollback regression: simulated failed restore altered storage.');
  checks[3].status='PASS';
  if(JSON.stringify(before)!==JSON.stringify(rollbackBaseline))
   throw Error('Baseline document changed after a successful round-trip.');
  checks[4].status='PASS';
  return {
   schemaVersion:RECOVERY_DRILL_SCHEMA,source,label,
   status:'SANDBOX_PASS',localStorageTouched:false,
   simulatedKeys:KEYS_COUNT,
   summary:summaryOf(expected),
   referenceAudit:sourceAudit.status,
   referenceFindings:sourceAudit.counts?.reviewFindings||0,
   checks,warnings,
  };
 }catch(error){
  const index=checks.findIndex(c=>c.status==='NOT_RUN');
  if(index>=0){checks[index].status='FAIL';checks[index].detail=error.message;}
  return {
   schemaVersion:RECOVERY_DRILL_SCHEMA,source,label,status:'SANDBOX_FAIL',
   localStorageTouched:false,simulatedKeys:KEYS_COUNT,
   summary:null,referenceAudit:sourceAudit?.status||'NOT_RUN',
   referenceFindings:sourceAudit?.counts?.reviewFindings||0,
   checks,warnings,
  };
 }
}
export const serializeRecoveryDrill=result=>JSON.stringify(result,null,2);
