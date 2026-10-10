import {describe,it,expect} from 'vitest';
import {assessFieldReadiness,fieldReadinessSnapshot} from './fieldReadiness.js';
import {emptyEvidenceLedger,appendEvidenceReport,appendEvidenceReview,reviewEvidenceLedger} from './fieldEvidence.js';
const graph=()=>({
  nodes:[
    {id:'rack:R',type:'rack',title:'MDF rack',description:'R · 12U',state:'anchored'},
    {id:'switch:S',type:'switch',title:'SW1',description:'S · U2',state:'concept-only'},
    {id:'panel:P',type:'panel',title:'Patch A',description:'U1 · 24 ports',state:'concept-only'},
    {id:'drop:D',type:'drop',title:'Room D',description:'Office',state:'assigned'},
  ],
  edges:[
    {id:'place:a',kind:'placement',title:'rack membership',from:'rack:R',to:'switch:S',state:'proposed'},
    {id:'logical:L',kind:'logical',title:'SW P1 → PP P1',from:'switch:S',to:'panel:P',state:'proposed'},
    {id:'allocation:A',kind:'allocation',title:'PP P1 → Room D',from:'panel:P',to:'drop:D',state:'proposed'},
  ],
  issues:[],
});
const method={rack:'visual-inspection',switch:'visual-inspection',panel:'visual-inspection',
  drop:'cable-test',logical:'link-test',allocation:'cable-test'};
const evidenceFor=(g,overrides={})=>{
  let doc=emptyEvidenceLedger(),i=0;
  for(const item of [...g.nodes,...g.edges.filter(e=>e.kind!=='placement')]){
    const type=item.type||item.kind;
    const result=overrides[item.id]||'reported-pass';
    doc=appendEvidenceReport(doc,g,{targetId:item.id,reporter:'Technician',method:method[type],
      result,evidenceRef:'Field-'+String(i+1).padStart(2,'0'),notes:'Operator supplied report.'},
      new Date(Date.UTC(2026,9,9,20,i,0)).toISOString());
    doc=appendEvidenceReview(doc,g,{reportId:doc.events.at(-1).id,reviewer:'Independent reviewer',
      decision:'accepted-report',notes:'Accepted record only.'},
      new Date(Date.UTC(2026,9,9,21,i,0)).toISOString());
    i++;
  }
  return doc;
};
const evaluate=(g,doc)=>assessFieldReadiness(g,reviewEvidenceLedger(doc,g));
describe('R14 documentation readiness gate',()=>{
  it('fails closed for blank plan and incomplete scope, never emits approved-to-install',()=>{
    const blank=assessFieldReadiness({nodes:[],edges:[],issues:[]},{entries:[]});
    expect(blank.status).toBe('HOLD_FOR_DOCUMENTATION');
    expect(blank.summary.required).toBe(0);
    expect(blank.summary.scopeGaps).toBe(6);
    expect(blank.summary.coveragePercent).toBe(0);
    const g=graph();g.edges=g.edges.filter(e=>e.kind!=='logical');
    expect(evaluate(g,emptyEvidenceLedger()).scopeGaps.some(g=>g.code==='SCOPE_MISSING_LOGICAL')).toBe(true);
  });
  it('gates on both reviewed claim evidence and no current design blockers',()=>{
    const g=graph(),before=JSON.stringify(g);
    const all=evaluate(g,evidenceFor(g));
    expect(all.status).toBe('DOCUMENTATION_REVIEW_CANDIDATE');
    expect(all.summary).toMatchObject({required:6,reviewedPassClaims:6,coveragePercent:100,outstanding:0});
    expect(all.rows.some(r=>r.type==='placement')).toBe(false);
    expect(all.caveats.join(' ')).toMatch(/not authorize installation/);
    expect(JSON.stringify(g)).toBe(before);
  });
  it('does not count latest reported-fail even when an independent reviewer accepted the report',()=>{
    const g=graph(),r=evaluate(g,evidenceFor(g,{'allocation:A':'reported-fail'}));
    expect(r.status).toBe('HOLD_FOR_DOCUMENTATION');
    expect(r.rows.find(x=>x.id==='allocation:A').status).toBe('reported-fail');
    expect(r.summary.reviewedPassClaims).toBe(5);
  });
  it('fails closed for new unreviewed report after earlier reviewed pass',()=>{
    const g=graph();let doc=evidenceFor(g);
    doc=appendEvidenceReport(doc,g,{targetId:'logical:L',reporter:'Technician 2',
      method:'link-test',result:'reported-pass',evidenceRef:'Retest 1',notes:''},
      '2026-10-09T23:00:00.000Z');
    const r=evaluate(g,doc);
    expect(r.rows.find(x=>x.id==='logical:L').status).toBe('awaiting-review');
    expect(r.status).toBe('HOLD_FOR_DOCUMENTATION');
  });
  it('requires evidence method appropriate to target even with accepted pass',()=>{
    const g=graph();let doc=emptyEvidenceLedger();
    doc=appendEvidenceReport(doc,g,{targetId:'logical:L',reporter:'One',
      method:'visual-inspection',result:'reported-pass',evidenceRef:'Visual 1',notes:''},
      '2026-10-09T20:00:00.000Z');
    doc=appendEvidenceReview(doc,g,{reportId:'receipt-000001',reviewer:'Two',
      decision:'accepted-report',notes:''},'2026-10-09T21:00:00.000Z');
    expect(evaluate(g,doc).rows.find(r=>r.id==='logical:L').status).toBe('method-mismatch');
  });
  it('fails for rejected, inconclusive and stale reports, or design review findings',()=>{
    const g=graph();let doc=evidenceFor(g,{'drop:D':'inconclusive'});
    expect(evaluate(g,doc).rows.find(r=>r.id==='drop:D').status).toBe('inconclusive');
    const changed=structuredClone(g);changed.nodes[0].description='R · 24U';
    expect(evaluate(changed,doc).rows.find(r=>r.id==='rack:R').status).toBe('stale-report');
    const blocked=structuredClone(g);blocked.issues=[{code:'PORT_ALLOCATION',subject:'allocation:A',
      message:'Wall-crossing review needed',severity:'review'}];
    const r=evaluate(blocked,evidenceFor(blocked));
    expect(r.status).toBe('HOLD_FOR_DOCUMENTATION');
    expect(r.rows.find(x=>x.id==='allocation:A').status).toBe('design-blocked');
    const gap=structuredClone(g);gap.issues=[{code:'PATH_NOT_DRAWN',subject:'allocation:A',
      message:'Path not drawn',severity:'info'}];
    expect(evaluate(gap,evidenceFor(gap)).summary.designFindings).toBe(1);
    const rejected=appendEvidenceReview(evidenceFor(g),g,{reportId:'receipt-000001',
      reviewer:'Third',decision:'rejected-report',notes:'Disputed.'},'2026-10-09T23:00:00.000Z');
    expect(evaluate(g,rejected).rows.find(x=>x.id==='rack:R').status).toBe('review-rejected');
  });
  it('exports only a read-only summary with receipt links and explicit provenance caveats',()=>{
    const g=graph(),report=evaluate(g,evidenceFor(g));
    const json=JSON.parse(fieldReadinessSnapshot(report));
    expect(json.schemaVersion).toBe('openblue.field-readiness-review/1');
    expect(json.status).toBe('DOCUMENTATION_REVIEW_CANDIDATE');
    expect(json.rows[0].reportId).toBe('receipt-000001');
    expect(json).not.toHaveProperty('approvalToken');
    expect(fieldReadinessSnapshot(report)).toBe(fieldReadinessSnapshot(evaluate(g,evidenceFor(g))));
  });
});
