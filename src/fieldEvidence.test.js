import {describe,it,expect} from 'vitest';
import {emptyEvidenceLedger,appendEvidenceReport,appendEvidenceReview,parseEvidenceLedger,
 serializeEvidenceLedger,reviewEvidenceLedger,loadEvidenceLedger,saveEvidenceLedger,
 EVIDENCE_STORAGE_KEY,targetFingerprint} from './fieldEvidence.js';
const graph=()=>({nodes:[
 {id:'switch:["sw1"]',type:'switch',title:'Access A',description:'sw1 · 8 ports',state:'concept-only'},
 {id:'drop:["dropA"]',type:'drop',title:'dropA',description:'Office',state:'assigned'},
],edges:[
 {id:'link:["l1"]',from:'switch:["sw1"]',to:'drop:["dropA"]',kind:'logical',title:'P1 → dropA',state:'proposed'},
]});
const submit=(doc,g=graph(),result='reported-pass')=>appendEvidenceReport(doc,g,{
 targetId:'link:["l1"]',reporter:'Tech A',method:'cable-test',result,
 evidenceRef:'FIELD-REPORT-001',notes:'Measured with a field instrument. Refer to separate report.',
},'2026-10-09T20:21:00.000Z');
const review=(doc,g=graph(),reviewer='Lead B',decision='accepted-report')=>appendEvidenceReview(doc,g,{
 reportId:'receipt-000001',reviewer,decision,notes:'Reviewed the submitted report reference.',
},'2026-10-09T20:22:00.000Z');
const storage=()=>{const map=new Map();return{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)}};
describe('R13 immutable evidence receipts and human review',()=>{
 it('records a human-reported test without upgrading the topology or claiming certification',()=>{
   const g=graph(),before=JSON.stringify(g),doc=submit(emptyEvidenceLedger(),g);
   expect(doc.events).toHaveLength(1);
   expect(doc.events[0]).toMatchObject({kind:'report',result:'reported-pass',previous:'GENESIS'});
   expect(reviewEvidenceLedger(doc,g).entries[0].state).toBe('awaiting-review');
   expect(JSON.stringify(g)).toBe(before);
 });
 it('requires separate reviewer and valid current target, appends review without overwriting original',()=>{
   const g=graph(),doc=submit(emptyEvidenceLedger(),g);
   expect(()=>review(doc,g,'Tech A')).toThrow('different');
   const accepted=review(doc,g);
   expect(accepted.events).toHaveLength(2);
   expect(accepted.events[0]).toEqual(doc.events[0]);
   expect(accepted.events[1].previous).toBe(doc.events[0].checksum);
   expect(reviewEvidenceLedger(accepted,g).entries[0].state).toBe('reviewed-claim');
   expect(reviewEvidenceLedger(accepted,g).caveats.join(' ')).toMatch(/not certification/);
   const rejection=appendEvidenceReview(accepted,g,{reportId:'receipt-000001',reviewer:'Lead C',
     decision:'rejected-report',notes:'Retest required.'},'2026-10-09T20:23:00.000Z');
   expect(reviewEvidenceLedger(rejection,g).entries[0].state).toBe('rejected-claim');
 });
 it('marks stale and orphaned design targets; never reuses old acceptance',()=>{
   const g=graph(),accepted=review(submit(emptyEvidenceLedger(),g),g);
   const changed=structuredClone(g);changed.edges[0].state='review';
   expect(targetFingerprint(changed,'link:["l1"]')).not.toBe(targetFingerprint(g,'link:["l1"]'));
   expect(reviewEvidenceLedger(accepted,changed).entries[0].state).toBe('stale');
   expect(()=>review(submit(emptyEvidenceLedger(),g),changed)).toThrow(/stale or missing/);
   changed.edges=[];
   expect(reviewEvidenceLedger(accepted,changed).entries[0].state).toBe('orphaned');
   expect(()=>submit(emptyEvidenceLedger(),changed)).toThrow(/Select a current/);
 });
 it('roundtrips valid chain and rejects reorders, deletions, tampering, duplicate receipts',()=>{
   const g=graph(),doc=review(submit(emptyEvidenceLedger(),g),g),str=serializeEvidenceLedger(doc);
   expect(parseEvidenceLedger(str)).toEqual(doc);
   const modified=JSON.parse(str);modified.events[0].result='reported-fail';
   expect(()=>parseEvidenceLedger(JSON.stringify(modified))).toThrow('checksum mismatch');
   modified.events[0].result='reported-pass';modified.events.reverse();
   expect(()=>parseEvidenceLedger(JSON.stringify(modified))).toThrow(/gap or reorder/);
   const missing=JSON.parse(str);missing.events.shift();
   expect(()=>parseEvidenceLedger(JSON.stringify(missing))).toThrow(/gap or reorder/);
   const duplicated=JSON.parse(str);duplicated.events.push(duplicated.events[0]);
   expect(()=>parseEvidenceLedger(JSON.stringify(duplicated))).toThrow(/gap or reorder/);
 });
 it('bounds inputs, requires evidence pointer, refuses missing target and bad reviews',()=>{
   const g=graph(),d=emptyEvidenceLedger();
   expect(()=>appendEvidenceReport(d,g,{targetId:'drop:["dropA"]',reporter:'Tech',
     method:'visual-inspection',result:'reported-pass',evidenceRef:'',notes:''})).toThrow(/reference/);
   expect(()=>appendEvidenceReport(d,g,{targetId:'drop:["dropA"]',reporter:'Tech',
     method:'remote-probe',result:'reported-pass',evidenceRef:'R1',notes:''})).toThrow('Unsupported');
   expect(()=>parseEvidenceLedger('{broken')).toThrow('not valid JSON');
   expect(()=>parseEvidenceLedger(JSON.stringify({schemaVersion:'future',events:[]}))).toThrow('Unsupported');
   expect(()=>parseEvidenceLedger('x'.repeat(500001))).toThrow('500 KB');
 });
 it('stores sidecar locally and refuses corrupted stored prefix',()=>{
   const s=storage(),doc=submit(emptyEvidenceLedger());
   saveEvidenceLedger(doc,s);
   expect(s.getItem(EVIDENCE_STORAGE_KEY)).toContain('receipt-000001');
   expect(loadEvidenceLedger(s).doc).toEqual(doc);
   s.setItem(EVIDENCE_STORAGE_KEY,'{bad');
   expect(loadEvidenceLedger(s).error).toMatch(/not loaded/);
 });
});
