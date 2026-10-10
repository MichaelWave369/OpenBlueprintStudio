import {describe,it,expect} from 'vitest';
import {createEmptyProject} from './model.js';
import {emptyAnnotations} from './roomAnnotations.js';
import {emptyPathways} from './pathwayProposals.js';
import {emptyRackPlan} from './rackPlanning.js';
import {emptyTopology} from './logicalTopology.js';
import {emptyEvidenceLedger,appendEvidenceReport} from './fieldEvidence.js';
import {createWorkspaceSnapshot} from './projectVault.js';
import {auditWorkspace,exportWorkspaceAudit} from './workspaceAudit.js';
function source(){
 const project=createEmptyProject();
 project.symbols=[{id:'drop-A',type:'network',x:3,y:5,rotation:0}];
 return createWorkspaceSnapshot({
   project,roomAnnotations:emptyAnnotations(),pathways:emptyPathways(),
   rackPlan:emptyRackPlan(),logicalTopology:emptyTopology(),
   fieldEvidence:emptyEvidenceLedger(),
   preferences:{analysisMode:'connected',networkHubId:'drop-A'},
 });
}
describe('R18 read-only workspace recovery audit',()=>{
 it('accepts six valid documents without inventing a field-ready or construction-approved status',()=>{
  const data=source(),before=JSON.stringify(data);
  const audit=auditWorkspace(data,{source:'slot',name:'Site A'});
  expect(audit.status).toBe('STRUCTURALLY_CONSISTENT');
  expect(audit.canRestore).toBe(true);
  expect(audit.documents).toHaveLength(6);
  expect(audit.documents.every(d=>d.status==='SCHEMA_VALID')).toBe(true);
  expect(audit.counts.documentationStatus).toBe('HOLD_FOR_DOCUMENTATION');
  expect(audit.caveats.join(' ')).toMatch(/not field readiness/);
  expect(JSON.stringify(data)).toBe(before);
 });
 it('detects saved hub crossovers rather than silently claiming the reference is okay',()=>{
  const data=source();data.preferences.networkHubId='drop-other';
  const audit=auditWorkspace(data);
  expect(audit.status).toBe('RESTORABLE_WITH_FINDINGS');
  expect(audit.findings.map(x=>x.code)).toContain('HUB_REFERENCE_CLEARED');
 });
 it('detects missing rack anchor and field evidence that no longer matches current graph',()=>{
  const data=source();
  data.rackPlan.racks.push({id:'R1',name:'Server closet',capacityU:12,
    anchorId:'missing-network-id',anchorM:{x:0,y:0},panels:[]});
  const audit=auditWorkspace(data);
  expect(audit.status).toBe('RESTORABLE_WITH_FINDINGS');
  expect(audit.findings.map(x=>x.code)).toContain('RACK_ANCHOR');
 });
 it('rejects corrupted R13 receipt history before offering restore',()=>{
  const data=source();
  data.fieldEvidence.headChecksum='f'.repeat(8);
  const audit=auditWorkspace(data);
  expect(audit.status).toBe('RESTORE_BLOCKED');
  expect(audit.canRestore).toBe(false);
  expect(audit.findings.map(x=>x.code)).toContain('DOCUMENT_VALIDATION_FAILED');
 });
 it('flags unmatched saved room semantic labels without rewriting them',()=>{
  const data=source();
  data.roomAnnotations.entries['orphan-room']={name:'Office',usage:'work',notes:''};
  const before=JSON.stringify(data);
  const audit=auditWorkspace(data);
  expect(audit.findings.map(x=>x.code)).toContain('ROOM_ANNOTATION_UNMATCHED');
  expect(JSON.stringify(data)).toBe(before);
 });
 it('exports deterministic audit receipts with no mutating restore instruction',()=>{
  const data=source(),audit=auditWorkspace(data);
  expect(JSON.parse(exportWorkspaceAudit(audit)).schemaVersion).toBe('openblue.workspace-audit/1');
  expect(exportWorkspaceAudit(audit)).toBe(exportWorkspaceAudit(auditWorkspace(data)));
  expect(audit).not.toHaveProperty('restored');
 });
});
