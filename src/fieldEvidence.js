/**
 * R13: local-only field evidence ledger with immutable append-only receipts.
 * "Reported pass" is a HUMAN CLAIM, not an independently verified link.
 * FNV-1a checksums detect ordinary corruption. They are NOT signatures,
 * tamper resistance, trusted timestamps, or cryptographic proof.
 */
export const EVIDENCE_SCHEMA='openblue.field-evidence/1';
export const EVIDENCE_STORAGE_KEY='openblue/field-evidence-v1';
const MAX_BYTES=500000,MAX_EVENTS=400;
const METHODS=['visual-inspection','cable-test','link-test','other'];
const RESULTS=['reported-pass','reported-fail','inconclusive'];
const DECISIONS=['accepted-report','rejected-report'];
export const emptyEvidenceLedger=()=>({schemaVersion:EVIDENCE_SCHEMA,events:[]});
const plain=(s,label,max,required=true)=>{
 if(typeof s!=='string'||s.length>max||(required&&!s.trim())||/[\u0000-\u001f\u007f]/.test(s))
   throw Error(label+' must be plain text, maximum '+max+' characters.');
 return s.trim();
};
const choose=(value,options,label)=>{
 if(!options.includes(value))throw Error('Unsupported '+label+'.');
 return value;
};
const fnv32=(str)=>{
 let hash=2166136261;
 for(let i=0;i<str.length;i++){
   hash^=str.charCodeAt(i);
   hash=Math.imul(hash,16777619);
 }
 return (hash>>>0).toString(16).padStart(8,'0');
};
const nowIso=(value)=>{
 if(typeof value!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)
   ||Number.isNaN(Date.parse(value))||new Date(value).toISOString()!==value)
   throw Error('Receipt time must be a valid UTC ISO timestamp.');
 return value;
};
const identity=(index)=>'receipt-'+String(index).padStart(6,'0');
const anchorPayload=(item)=>{
 if(item?.id && typeof item.id==='string')return {
   id:item.id,type:item.type||item.kind||'unknown',
   title:item.title||'',description:item.description||'',state:item.state||'',
   from:item.from||'',to:item.to||'',kind:item.kind||'',
 };
 return null;
};
export function findEvidenceTarget(graph,id){
 const record=[...(graph?.nodes||[]),...(graph?.edges||[])].find(n=>n.id===id);
 if(!record)return null;
 const payload=anchorPayload(record);
 return {...payload,fingerprint:fnv32(JSON.stringify(payload))};
}
export function targetFingerprint(graph,id){
 return findEvidenceTarget(graph,id)?.fingerprint||null;
}
function bodyOf(event){
 const base={sequence:event.sequence,id:event.id,kind:event.kind,at:event.at};
 if(event.kind==='report')return {...base,targetId:event.targetId,targetFingerprint:event.targetFingerprint,
   reporter:event.reporter,method:event.method,result:event.result,
   evidenceRef:event.evidenceRef,notes:event.notes};
 if(event.kind==='review')return {...base,reportId:event.reportId,reviewer:event.reviewer,
   decision:event.decision,notes:event.notes};
 throw Error('Unknown event kind.');
}
const eventChecksum=(prev,body)=>fnv32(JSON.stringify({schema:EVIDENCE_SCHEMA,previous:prev,body}));
function normalizedBody(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid receipt.');
 const sequence=raw.sequence;
 if(!Number.isInteger(sequence)||sequence<1||sequence>MAX_EVENTS)throw Error('Invalid receipt sequence.');
 const id=plain(raw.id,'Receipt ID',24);
 if(id!==identity(sequence))throw Error('Receipt ID must match its sequence.');
 const at=nowIso(raw.at);
 const kind=choose(raw.kind,['report','review'],'receipt kind');
 if(kind==='report'){
   const targetId=plain(raw.targetId,'Target ID',400);
   const targetFingerprint=plain(raw.targetFingerprint,'Target fingerprint',8);
   if(!/^[0-9a-f]{8}$/.test(targetFingerprint))throw Error('Invalid target fingerprint.');
   return {sequence,id,kind,at,targetId,targetFingerprint,
     reporter:plain(raw.reporter,'Reporter',80),
     method:choose(raw.method,METHODS,'observation method'),
     result:choose(raw.result,RESULTS,'reported outcome'),
     evidenceRef:plain(raw.evidenceRef,'External evidence reference',200),
     notes:plain(raw.notes,'Notes',500,false)};
 }
 return {sequence,id,kind,at,
   reportId:plain(raw.reportId,'Reviewed receipt ID',24),
   reviewer:plain(raw.reviewer,'Reviewer',80),
   decision:choose(raw.decision,DECISIONS,'review decision'),
   notes:plain(raw.notes,'Review notes',500,false)};
}
export function parseEvidenceLedger(raw){
 if(typeof raw!=='string'||new TextEncoder().encode(raw).length>MAX_BYTES)
   throw Error('Evidence document exceeds 500 KB.');
 let data;
 try{data=JSON.parse(raw)}catch{throw Error('Evidence ledger is not valid JSON.');}
 if(!data||data.schemaVersion!==EVIDENCE_SCHEMA||!Array.isArray(data.events)
   ||data.events.length>MAX_EVENTS)throw Error('Unsupported evidence schema or receipt count.');
 const events=[],reports=new Map();
 for(const original of data.events){
   const body=normalizedBody(original),seq=events.length+1;
   if(body.sequence!==seq)throw Error('Evidence event sequence has a gap or reorder.');
   if(body.kind==='review'){
     const report=reports.get(body.reportId);
     if(!report)throw Error('Review must reference an earlier report receipt.');
     if(body.reviewer.toLowerCase()===report.reporter.toLowerCase())
       throw Error('Reviewer must be different from the original reporter.');
   }
   const previous=events.length?events[events.length-1].checksum:'GENESIS';
   if(original.previous!==previous)throw Error('Ledger prefix checksum mismatch.');
   const checksum=eventChecksum(previous,body);
   if(original.checksum!==checksum)throw Error('Receipt checksum mismatch.');
   const clean={...body,previous,checksum};
   events.push(clean);
   if(clean.kind==='report')reports.set(clean.id,clean);
 }
 return {schemaVersion:EVIDENCE_SCHEMA,events};
}
export const serializeEvidenceLedger=doc=>JSON.stringify(parseEvidenceLedger(JSON.stringify(doc)),null,2);
function append(doc,input){
 const base=normalizedBody({...input,sequence:doc.events.length+1,id:identity(doc.events.length+1)});
 const previous=doc.events.length?doc.events[doc.events.length-1].checksum:'GENESIS';
 const next={...base,previous,checksum:eventChecksum(previous,base)};
 return parseEvidenceLedger(JSON.stringify({schemaVersion:EVIDENCE_SCHEMA,events:[...doc.events,next]}));
}
export function appendEvidenceReport(doc,graph,{targetId,reporter,method,result,evidenceRef,notes='' },at=new Date().toISOString()){
 const target=findEvidenceTarget(graph,targetId);
 if(!target)throw Error('Select a current R12 node or edge before recording evidence.');
 return append(doc,{kind:'report',at,targetId,targetFingerprint:target.fingerprint,
   reporter,method,result,evidenceRef,notes});
}
export function appendEvidenceReview(doc,graph,{reportId,reviewer,decision,notes='' },at=new Date().toISOString()){
 const report=doc.events.find(e=>e.id===reportId&&e.kind==='report');
 if(!report)throw Error('Select an existing report receipt.');
 const fp=targetFingerprint(graph,report.targetId);
 if(!fp||fp!==report.targetFingerprint)
   throw Error('This evidence targets stale or missing geometry. Add a fresh report to review the current plan.');
 return append(doc,{kind:'review',at,reportId,reviewer,decision,notes});
}
export function removeNothingFromLedger(){
 throw Error('The ledger is append-only. Export or replace the whole project instead of erasing receipts.');
}
export function reviewEvidenceLedger(doc,graph){
 const reports=doc.events.filter(e=>e.kind==='report');
 const reviews=doc.events.filter(e=>e.kind==='review');
 const entries=reports.map(report=>{
   const present=targetFingerprint(graph,report.targetId);
   const lastReview=[...reviews].reverse().find(r=>r.reportId===report.id)||null;
   const freshness=!present?'orphaned':present!==report.targetFingerprint?'stale':'current';
   const state=freshness!=='current'?freshness:
     !lastReview?'awaiting-review':lastReview.decision==='accepted-report'?'reviewed-claim':'rejected-claim';
   return {...report,freshness,state,review:lastReview};
 });
 const stats={
   reports:reports.length,reviews:reviews.length,
   awaiting:entries.filter(e=>e.state==='awaiting-review').length,
   reviewed:entries.filter(e=>e.state==='reviewed-claim').length,
   rejected:entries.filter(e=>e.state==='rejected-claim').length,
   stale:entries.filter(e=>e.state==='stale'||e.state==='orphaned').length,
 };
 return {entries,stats,allEvents:doc.events,
   caveats:[
     'Reported PASS is a human-entered claim, not a live cable or link test performed by OpenBlue.',
     'A reviewer ACCEPTS THE REPORT RECORD, not certification of installed hardware or operating connectivity.',
     'The receipt chain uses an unkeyed, noncryptographic checksum to detect accidental corruption only. Imported JSON may be deliberately rewritten; no cryptographic authenticity, external timestamp or tamper resistance is asserted.',
   ]};
}
export function loadEvidenceLedger(storage=globalThis.localStorage){
 try{
   const raw=storage?.getItem(EVIDENCE_STORAGE_KEY);
   return raw?{doc:parseEvidenceLedger(raw),error:null}:{doc:emptyEvidenceLedger(),error:null};
 }catch(error){return {doc:emptyEvidenceLedger(),error:'Evidence ledger not loaded: '+error.message};}
}
export function saveEvidenceLedger(doc,storage=globalThis.localStorage){
 if(!storage)throw Error('Browser storage unavailable.');
 storage.setItem(EVIDENCE_STORAGE_KEY,serializeEvidenceLedger(doc));
}
