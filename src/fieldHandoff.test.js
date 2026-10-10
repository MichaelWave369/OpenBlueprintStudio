import {describe,it,expect} from 'vitest';
import {createEmptyProject} from './model.js';
import {emptyAnnotations} from './roomAnnotations.js';
import {emptyPathways} from './pathwayProposals.js';
import {emptyRackPlan} from './rackPlanning.js';
import {emptyTopology} from './logicalTopology.js';
import {emptyEvidenceLedger} from './fieldEvidence.js';
import {networkReviewSnapshot} from './networkPlanning.js';
import {buildTopologyDiagram} from './topologyDiagram.js';
import {assessFieldReadiness} from './fieldReadiness.js';
import {createFieldHandoff,inspectFieldHandoff,serializeFieldHandoff,HANDOFF_PARTS} from './fieldHandoff.js';
const makeSource=()=>{
 const project=createEmptyProject(),rackPlan=emptyRackPlan();
 const roomAnnotations=emptyAnnotations(),pathways=emptyPathways();
 const logicalTopology=emptyTopology(),fieldEvidence=emptyEvidenceLedger();
 const network={topologyStatus:'unavailable',hubId:null,rooms:[],adjacency:[],sharedSegments:0,drops:[],warnings:[]};
 const networkReview=networkReviewSnapshot(project,network);
 const topologyReview=buildTopologyDiagram(rackPlan,{racks:[],allocations:[]},{switches:[],links:[]},network);
 const readinessReview=assessFieldReadiness(topologyReview,{entries:[]});
 return {project,roomAnnotations,pathways,rackPlan,logicalTopology,fieldEvidence,
   networkReview,topologyReview,readinessReview};
};
const at='2026-10-10T03:41:00.000Z';
describe('R15 inspect-only field handoff packages',()=>{
 it('includes exactly nine complete and independently validated parts, without mutating the source',async()=>{
   const source=makeSource(),before=JSON.stringify(source);
   const pkg=await createFieldHandoff(source,at);
   expect(pkg.manifest).toHaveLength(HANDOFF_PARTS.length);
   expect(pkg.manifest.map(p=>p.key)).toEqual(HANDOFF_PARTS.map(p=>p.key));
   expect(pkg.manifest.every(m=>m.sha256.length===64)).toBe(true);
   const inspected=await inspectFieldHandoff(serializeFieldHandoff(pkg));
   expect(inspected.metrics).toMatchObject({readinessStatus:'HOLD_FOR_DOCUMENTATION',
     racks:0,switches:0,evidenceReports:0});
   expect(inspected.parts.every(p=>p.status==='HASH_MATCH')).toBe(true);
   expect(JSON.stringify(source)).toBe(before);
 });
 it('rejects tampered blueprint payload and untrusted manifest alteration',async()=>{
   const pkg=await createFieldHandoff(makeSource(),at);
   const changed=structuredClone(pkg);
   changed.sections.project.metadata.title='This was modified';
   await expect(inspectFieldHandoff(JSON.stringify(changed))).rejects.toThrow('mismatch');
   const changedManifest=structuredClone(pkg);
   changedManifest.manifest[0].label='Unverified spoof';
   await expect(inspectFieldHandoff(JSON.stringify(changedManifest))).rejects.toThrow('Unexpected manifest');
   const missing=structuredClone(pkg);
   delete missing.sections.fieldEvidence;
   await expect(inspectFieldHandoff(JSON.stringify(missing))).rejects.toThrow('Unexpected handoff section');
 });
 it('rejects re-ordered, missing or duplicated sections and a modified header hash',async()=>{
   const pkg=await createFieldHandoff(makeSource(),at);
   const reordered=structuredClone(pkg);
   reordered.manifest.reverse();
   await expect(inspectFieldHandoff(JSON.stringify(reordered))).rejects.toThrow(/manifest section/);
   const head=structuredClone(pkg);head.manifestSha256='f'.repeat(64);
   await expect(inspectFieldHandoff(JSON.stringify(head))).rejects.toThrow('Manifest header');
   const extra=structuredClone(pkg);extra.sections.malicious={};
   await expect(inspectFieldHandoff(JSON.stringify(extra))).rejects.toThrow('Unexpected handoff section');
 });
 it('rejects malformed or oversize package and invalid nested R13 ledger',async()=>{
   await expect(inspectFieldHandoff('{bad')).rejects.toThrow('not valid JSON');
   await expect(inspectFieldHandoff('x'.repeat(7_000_001))).rejects.toThrow('7 MB');
   const invalid=makeSource();
   invalid.fieldEvidence.headChecksum='fake';
   await expect(createFieldHandoff(invalid,at)).rejects.toThrow('head checksum');
 });
 it('treats claimed documentation readiness and referenced photos as untrusted',async()=>{
   const source=makeSource();
   source.readinessReview.status='DOCUMENTATION_REVIEW_CANDIDATE';
   const pkg=await createFieldHandoff(source,at);
   const review=await inspectFieldHandoff(serializeFieldHandoff(pkg));
   expect(review.metrics.readinessStatus).toBe('DOCUMENTATION_REVIEW_CANDIDATE');
   expect(review.warnings.join(' ')).toMatch(/NOT authentication/);
   expect(review.warnings.join(' ')).toMatch(/NOT independently recomputed/);
   expect(pkg.notice).toMatch(/not embedded/);
 });
});
