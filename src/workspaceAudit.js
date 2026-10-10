/**
 * R18: pure preflight of an OpenBlue R17 complete workspace.
 * Findings are reference-consistency observations, NOT physical-site tests.
 * This module does not mutate, repair, open, save or authorize anything.
 */
import {validateWorkspace,DOCUMENT_KEYS} from './projectVault.js';
import {analyzeRooms} from './roomAnalysis.js';
import {analyzeConnectedRooms} from './connectedRooms.js';
import {roomAnnotationKey} from './roomAnnotations.js';
import {analyzeNetworkPlan} from './networkPlanning.js';
import {evaluatePathwayDocument} from './pathwayProposals.js';
import {reviewRackPlan} from './rackPlanning.js';
import {reviewTopology} from './logicalTopology.js';
import {buildTopologyDiagram} from './topologyDiagram.js';
import {reviewEvidenceLedger} from './fieldEvidence.js';
import {assessFieldReadiness} from './fieldReadiness.js';

export const AUDIT_SCHEMA='openblue.workspace-audit/1';
const SEVERITIES=['review','info'];
const diagnostic=(code,severity,message,subject='')=>({code,severity,message,subject});
export function auditWorkspace(input,{source='active',name='Current project'}={}){
 const auditName=String(name).slice(0,120);
 const findings=[];
 let data;
 try{data=validateWorkspace(input);}
 catch(error){
  findings.push(diagnostic('DOCUMENT_VALIDATION_FAILED','review',
   'Complete workspace schema validation failed: '+error.message));
  return {
   schemaVersion:AUDIT_SCHEMA,source,name:auditName,
   status:'RESTORE_BLOCKED',canRestore:false,
   documents:DOCUMENT_KEYS.map(key=>({key,status:'UNVERIFIED'})),
   counts:null,findings,
   nextActions:['Keep the active project unchanged.',
    'Export the original saved file outside OpenBlue before attempting any repair.',
    'Use an intact R17 workspace backup to recover; do not trust this document.'],
   caveats:limitations,
  };
 }
 try{
  const {project,roomAnnotations,pathways,rackPlan,logicalTopology,fieldEvidence,preferences}=data;
  const networkIds=new Set(project.symbols.filter(s=>s.type==='network').map(s=>s.id));
  if(input?.preferences?.networkHubId && !networkIds.has(input.preferences.networkHubId)){
    findings.push(diagnostic('HUB_REFERENCE_CLEARED','review',
      'Saved network-hub selection does not refer to a current network symbol; restore validation would clear it.',
      input.preferences.networkHubId));
  }
  const analysis=preferences.analysisMode==='connected'?analyzeConnectedRooms(project):analyzeRooms(project);
  const labeled={...analysis,rooms:(analysis.rooms||[]).map(room=>({
    ...room,annotationKey:roomAnnotationKey(room,project.metadata.units,preferences.analysisMode),
  }))};
  const keys=new Set(labeled.rooms.map(r=>r.annotationKey).filter(Boolean));
  for(const key of Object.keys(roomAnnotations.entries)){
    if(!keys.has(key))findings.push(diagnostic('ROOM_ANNOTATION_UNMATCHED','review',
      'Saved room annotation no longer matches the current room geometry/analysis mode.',key.slice(0,180)));
  }
  const network=analyzeNetworkPlan(project,labeled,roomAnnotations.entries,preferences.networkHubId);
  const routeStates=evaluatePathwayDocument(project,pathways);
  for(const route of routeStates)if(route.status!=='clear'){
    findings.push(diagnostic('PATHWAY_'+route.status.toUpperCase(),
      route.status==='stale'?'review':'info',
      route.warning||'Operator-drawn pathway requires reinspection.',
      JSON.stringify([route.hubId,route.dropId])));
  }
  const racks=reviewRackPlan(project,rackPlan,routeStates,network);
  const logical=reviewTopology(logicalTopology,rackPlan,racks);
  const graph=buildTopologyDiagram(rackPlan,racks,logical,network);
  for(const item of graph.issues){
    findings.push(diagnostic(item.code,item.severity==='review'?'review':'info',
      item.message,item.subject));
  }
  const evidence=reviewEvidenceLedger(fieldEvidence,graph);
  for(const report of evidence.entries)if(report.freshness!=='current'){
    findings.push(diagnostic('EVIDENCE_'+report.freshness.toUpperCase(),'review',
      'A human field-report receipt refers to a '+report.freshness+' graph target; do not transfer or treat this report as verified.',
      report.id));
  }
  const readiness=assessFieldReadiness(graph,evidence);
  if(readiness.status!=='DOCUMENTATION_REVIEW_CANDIDATE'){
    findings.push(diagnostic('DOCUMENTATION_HOLD','info',
      'R14 checklist is not a documentation review candidate. This does not prevent opening an intact project; it prevents any claim of field readiness.'));
  }
  const reviews=findings.filter(f=>f.severity==='review').length;
  return {
   schemaVersion:AUDIT_SCHEMA,source,name:auditName,
   status:reviews?'RESTORABLE_WITH_FINDINGS':'STRUCTURALLY_CONSISTENT',
   canRestore:true,
   documents:DOCUMENT_KEYS.map(key=>({key,status:'SCHEMA_VALID'})),
   counts:{
    walls:project.walls.length,networkSymbols:networkIds.size,
    rooms:labeled.rooms.length,roomAnnotations:Object.keys(roomAnnotations.entries).length,
    pathways:pathways.routes.length,racks:rackPlan.racks.length,
    panels:rackPlan.racks.reduce((sum,r)=>sum+r.panels.length,0),
    switches:logicalTopology.switches.length,links:logicalTopology.links.length,
    evidenceReports:evidence.stats.reports,evidenceReviews:evidence.stats.reviews,
    staleEvidence:evidence.stats.stale,reviewFindings:reviews,
    informationalFindings:findings.length-reviews,
    documentationStatus:readiness.status,
   },
   findings,
   nextActions:reviews?[
     'Export an off-browser backup of this project before opening it.',
     'Review each stale/unknown anchor, room annotation, topology reference and field receipt in the appropriate workspace.',
     'Nothing will be silently rebound, repaired or promoted to VERIFIED.',
   ]:[
     'Six source documents are schema-valid and no review-severity reference inconsistency was detected.',
     'Keep an off-browser backup and review all informational planning limitations.',
   ],
   caveats:limitations,
  };
 }catch(error){
  return {
   schemaVersion:AUDIT_SCHEMA,source,name:auditName,
   status:'RESTORE_BLOCKED',canRestore:false,
   documents:DOCUMENT_KEYS.map(key=>({key,status:'SCHEMA_VALID'})),
   counts:null,
   findings:[...findings,diagnostic('RECONCILIATION_FAILED','review',
    'Cross-document analysis failed and the workspace was not cleared for opening: '+error.message)],
   nextActions:['Keep the active project unchanged.','Export the original workspace backup and manually examine its references.'],
   caveats:limitations,
  };
 }
}
const limitations=[
 'This audit checks schema and internal relationships of SAVED planning data; it does not run a field test, open a network connection or certify installed equipment.',
 'A STRUCTURALLY_CONSISTENT status means no recognized reference inconsistency was found. It is not field readiness or construction approval.',
 'Field reports are human claims; R13 ledger checksums are noncryptographic and are not proof of authorship, origin or tamper resistance.',
 'R17 project vault browser storage is not a reliable external backup. Audit output is a derived review receipt, not a digital signature or automatic repair.',
];
export const exportWorkspaceAudit=audit=>JSON.stringify(audit,null,2);
