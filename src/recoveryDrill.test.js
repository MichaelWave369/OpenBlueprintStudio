import {describe,it,expect} from 'vitest';
import {createEmptyProject} from './model.js';
import {emptyAnnotations} from './roomAnnotations.js';
import {emptyPathways} from './pathwayProposals.js';
import {emptyRackPlan} from './rackPlanning.js';
import {emptyTopology} from './logicalTopology.js';
import {emptyEvidenceLedger,appendEvidenceReport} from './fieldEvidence.js';
import {createWorkspaceSnapshot} from './projectVault.js';
import {drillWorkspaceRecovery,serializeRecoveryDrill} from './recoveryDrill.js';

function workspace(tag='A'){
 const p=createEmptyProject();
 p.metadata.title='Building '+tag;
 p.symbols=[{id:'drop-'+tag,type:'network',x:3,y:5,rotation:0}];
 return createWorkspaceSnapshot({
  project:p,roomAnnotations:emptyAnnotations(),pathways:emptyPathways(),
  rackPlan:emptyRackPlan(),logicalTopology:emptyTopology(),
  fieldEvidence:emptyEvidenceLedger(),
  preferences:{analysisMode:'connected',networkHubId:'drop-'+tag},
 });
}
describe('R20 isolated seven-key recovery and failure rehearsal',()=>{
 it('restores a complete site and rolls back injected partial write without active storage access',()=>{
  const a=workspace('A'),before=JSON.stringify(a);
  const result=drillWorkspaceRecovery(a,{label:'Site A'});
  expect(result.status).toBe('SANDBOX_PASS');
  expect(result.localStorageTouched).toBe(false);
  expect(result.simulatedKeys).toBe(7);
  expect(result.checks.map(x=>x.status)).toEqual(Array(5).fill('PASS'));
  expect(result.summary).toMatchObject({project:'Building A',symbols:1,evidenceEvents:0});
  expect(JSON.stringify(a)).toBe(before);
 });
 it('rehearses a nonempty human field ledger without promoting reported evidence',()=>{
  const site=workspace('B');
  const graph={nodes:[{id:'drop:["drop-B"]',title:'Drop B',type:'drop',
   description:'not installed',state:'unknown'}],edges:[]};
  site.fieldEvidence=appendEvidenceReport(site.fieldEvidence,graph,{
   targetId:'drop:["drop-B"]',reporter:'Field technician',
   method:'visual-inspection',result:'reported-pass',
   evidenceRef:'Site B notebook #8',notes:'',
  },'2026-10-10T05:00:00.000Z');
  const before=JSON.stringify(site);
  const audit=drillWorkspaceRecovery(site);
  expect(audit.status).toBe('SANDBOX_PASS');
  expect(audit.summary.evidenceEvents).toBe(1);
  expect(audit.warnings.join(' ')).toMatch(/human-entered evidence/);
  expect(JSON.stringify(site)).toBe(before);
 });
 it('fails without editing source if the receipt chain has been damaged',()=>{
  const site=workspace();
  site.fieldEvidence.headChecksum='WRONG';
  const result=drillWorkspaceRecovery(site);
  expect(result.status).toBe('SANDBOX_FAIL');
  expect(result.checks[0].status).toBe('FAIL');
  expect(result.localStorageTouched).toBe(false);
 });
 it('has repeatable read-only receipts with no browser state or trusted signature',()=>{
  const site=workspace();
  const a=drillWorkspaceRecovery(site),b=drillWorkspaceRecovery(site);
  expect(serializeRecoveryDrill(a)).toBe(serializeRecoveryDrill(b));
  const report=JSON.parse(serializeRecoveryDrill(a));
  expect(report.schemaVersion).toBe('openblue.recovery-drill/1');
  expect(report).not.toHaveProperty('approvedForInstallation');
  expect(report.referenceAudit).toBe('STRUCTURALLY_CONSISTENT');
 });
});
