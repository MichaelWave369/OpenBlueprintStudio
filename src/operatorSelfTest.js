/**
 * R22 operator-initiated release-readiness self-test.
 *
 * Read-only browser storage checks. No network calls, writes, restore, project
 * switching, document upload or automatic repair. Reports contain only codes
 * and counts, never user project data, reporter names or raw JSON.
 */
import {STORAGE_KEY,parseProjectJson} from './model.js';
import {ROOM_ANNOTATIONS_STORAGE_KEY,parseRoomAnnotations} from './roomAnnotations.js';
import {PATHWAYS_STORAGE_KEY,parsePathways} from './pathwayProposals.js';
import {RACK_PLAN_STORAGE_KEY,parseRackPlan} from './rackPlanning.js';
import {TOPOLOGY_STORAGE_KEY,parseTopology} from './logicalTopology.js';
import {EVIDENCE_STORAGE_KEY,parseEvidenceLedger} from './fieldEvidence.js';
import {PREFS_KEY,VAULT_KEY,loadActivePreferences,parseProjectVault,validateWorkspace} from './projectVault.js';
import {TIMELINE_STORAGE_KEY,parseProjectTimeline} from './projectTimeline.js';
import {auditWorkspace} from './workspaceAudit.js';
import {drillWorkspaceRecovery} from './recoveryDrill.js';

export const SELF_TEST_SCHEMA='openblue.operator-self-test/1';
const activeSources=[
 ['project',STORAGE_KEY,parseProjectJson],
 ['roomAnnotations',ROOM_ANNOTATIONS_STORAGE_KEY,parseRoomAnnotations],
 ['pathways',PATHWAYS_STORAGE_KEY,parsePathways],
 ['rackPlan',RACK_PLAN_STORAGE_KEY,parseRackPlan],
 ['logicalTopology',TOPOLOGY_STORAGE_KEY,parseTopology],
 ['fieldEvidence',EVIDENCE_STORAGE_KEY,parseEvidenceLedger],
];
const safeCounts=(vault,timeline)=>({
 vaultSlots:vault?.slots?.length||0,timelineCheckpoints:timeline?.checkpoints?.length||0,
});
const check=(code,status,message)=>({code,status,message});
function readPersistedSources(storage){
 if(!storage)return {status:'FAIL',message:'Browser storage is unavailable.',value:null};
 const present={},missing=[];
 try{
  for(const [name,key,parse] of activeSources){
   const raw=storage.getItem(key);
   if(raw===null){missing.push(name);continue;}
   try{present[name]=parse(raw);}
   catch{return {status:'FAIL',message:'A stored active document failed schema validation. Preserve the original and export a separate backup.',value:null};}
  }
  const rawPrefs=storage.getItem(PREFS_KEY);
  if(rawPrefs===null)missing.push('preferences');
  if(missing.length)return {
   status:'WARN',message:missing.length+' of 7 active source/pref keys have no saved value yet. Save and reload before relying on browser recovery.',value:null,
  };
  // Existing preference reader silently defaults on corruption. Explicitly
  // reject malformed preferences here instead of treating a default as proof.
  try{
   const p=JSON.parse(rawPrefs);
   if(!p||typeof p!=='object'||Array.isArray(p)||
      Object.keys(p).sort().join(',')!=='analysisMode,networkHubId')
     throw Error('Unknown preferences');
   const preferences=loadActivePreferences(storage);
   if(JSON.stringify(preferences)!==JSON.stringify(p))throw Error('Noncanonical preferences');
   const persisted=validateWorkspace({...present,preferences});
   return {status:'PASS',message:'All seven active browser-persisted documents/preferences validated.',value:persisted};
  }catch{return {status:'FAIL',message:'Saved active workspace preferences or cross-document snapshot failed validation.',value:null};}
 }catch{return {status:'FAIL',message:'Browser storage could not be read safely.',value:null};}
}
function readLibrary(storage,key,parse,label){
 if(!storage)return {status:'FAIL',message:'Browser storage is unavailable.',doc:null};
 try{
  const raw=storage.getItem(key);
  if(raw===null)return {status:'WARN',message:label+' has no locally persisted snapshots. Export backups before important edits.',doc:null};
  try{
   const doc=parse(raw);
   return {status:'PASS',message:label+' parsed and all saved snapshots validated.',doc};
  }catch{return {status:'FAIL',message:label+' is unreadable or invalid. Do NOT reset it before downloading the original bytes.',doc:null};}
 }catch{return {status:'FAIL',message:label+' storage access failed.',doc:null};}
}
function browserCheck(capabilities){
 if(!capabilities||typeof capabilities!=='object')return check('BROWSER_FEATURES','WARN','Browser capability detection was unavailable.');
 const missing=[];
 if(capabilities.fileApi!==true)missing.push('local file import/export');
 if(capabilities.webCrypto!==true)missing.push('secure-context SHA-256 package inspection');
 if(capabilities.webgl2!==true)missing.push('WebGL2 optional 3D preview');
 return check('BROWSER_FEATURES',missing.length?'WARN':'PASS',missing.length?
  'Some browser capabilities need review: '+missing.join(', ')+'.':'File support, secure hashing and WebGL2 are reported available.');
}
function quotaCheck(capabilities){
 const q=capabilities?.storageEstimate;
 if(!q||!Number.isFinite(q.usage)||!Number.isFinite(q.quota)||q.quota<=0)
  return check('STORAGE_HEADROOM','WARN','Browser storage quota estimate unavailable; actual write capacity has not been tested.');
 const ratio=q.usage/q.quota;
 if(ratio>=0.9)return check('STORAGE_HEADROOM','WARN',
   'Browser reports high approximate storage usage (90% or more). Export project backups.');
 return check('STORAGE_HEADROOM','PASS','Browser reports estimated quota headroom; this does not prove future saves will succeed.');
}
/**
 * Inputs are read at the moment the user explicitly runs the test.
 * The function NEVER reads directly from window.localStorage and NEVER calls
 * storage.setItem/removeItem. R20's drill runs on its own Map-backed clone.
 */
export function runOperatorSelfTest({
 workspace,storage=null,capabilities=null,
}={}){
 const checks=[];
 let normalized=null;
 try{normalized=validateWorkspace(workspace);
   checks.push(check('ACTIVE_SCHEMA','PASS','All six active source documents and preferences passed schema validation.'));
 }catch{checks.push(check('ACTIVE_SCHEMA','FAIL','Active workspace has invalid or unreviewable source records. Export original files before repairing.'));}
 if(normalized){
  const audit=auditWorkspace(workspace,{source:'operator-self-test',name:'Active'});
  const auditStatus=audit.status==='RESTORE_BLOCKED'?'FAIL':
   audit.status==='RESTORABLE_WITH_FINDINGS'?'WARN':'PASS';
  checks.push(check('REFERENCE_REVIEW',auditStatus,auditStatus==='PASS'?
   'No recognized review-severity internal-reference inconsistencies. This is not field approval.':
   auditStatus==='WARN'?'Saved site references need manual review; no physical evidence was certified.':
   'Cross-document consistency review blocked.'));
  const drill=drillWorkspaceRecovery(normalized,{source:'operator-self-test',label:'Active'});
  checks.push(check('RECOVERY_SIMULATION',drill.status==='SANDBOX_PASS'?'PASS':'FAIL',
   drill.status==='SANDBOX_PASS'?'Seven-key isolated recovery and injected rollback checks passed, without writing live storage.':
    'The isolated recovery/readback/rollback rehearsal did not pass.'));
 }else{
  checks.push(check('REFERENCE_REVIEW','SKIP','Not run because active source validation failed.'));
  checks.push(check('RECOVERY_SIMULATION','SKIP','Not run because active source validation failed.'));
 }
 const persisted=readPersistedSources(storage);
 checks.push(check('ACTIVE_STORAGE',persisted.status,persisted.message));
 if(normalized&&persisted.value){
  // Autosave is asynchronous; a snapshot mismatch is a warning, not proof of corruption.
  const same=JSON.stringify(normalized)===JSON.stringify(persisted.value);
  checks.push(check('ACTIVE_SYNC',same?'PASS':'WARN',same?
   'Persisted active documents match the currently visible normalized editor state.':
   'Active editor state differs from saved browser documents. Autosave may be pending; export a backup before switching.'));
 }else checks.push(check('ACTIVE_SYNC','SKIP','Synchronization comparison unavailable until both active and saved source sets validate.'));
 const vault=readLibrary(storage,VAULT_KEY,parseProjectVault,'R17 project library');
 const timeline=readLibrary(storage,TIMELINE_STORAGE_KEY,parseProjectTimeline,'R19 checkpoint timeline');
 checks.push(check('VAULT_STORAGE',vault.status,vault.message));
 checks.push(check('TIMELINE_STORAGE',timeline.status,timeline.message));
 checks.push(browserCheck(capabilities),quotaCheck(capabilities));
 const fail=checks.some(c=>c.status==='FAIL');
 const warn=checks.some(c=>c.status==='WARN'||c.status==='SKIP');
 return {
  schemaVersion:SELF_TEST_SCHEMA,
  status:fail?'OPERATOR_REVIEW_REQUIRED':warn?'OPERATOR_ATTENTION':'LOCAL_CHECKS_PASSED',
  checks,counts:safeCounts(vault.doc,timeline.doc),
  evaluatedKeys:7,
  caveats:[
   'This on-demand self-test reads browser records but never writes or repairs them. An R20 simulation uses isolated memory only.',
   'A passing report is not a browser durability guarantee, live network test, signed identity receipt, construction authorization or field equipment certification.',
   'The downloaded report includes only generic check codes, statuses and counts; it does not include project data or authenticated timestamps.',
  ],
 };
}
export const serializeOperatorSelfTest=report=>JSON.stringify(report,null,2);
