/**
 * R15: portable field-handoff evidence package.
 * SHA-256 protects byte-level consistency ONLY. An unsigned package is neither
 * authentic nor independently verified, and cannot authorize field work.
 *
 * Import is PREVIEW ONLY: no writes to CAD, room, pathway, rack, topology or
 * evidence stores. External photos/test files are NOT embedded.
 */
import {parseProjectJson,SCHEMA_VERSION} from './model.js';
import {parseRoomAnnotations,ROOM_ANNOTATIONS_SCHEMA} from './roomAnnotations.js';
import {parsePathways,PATHWAYS_SCHEMA} from './pathwayProposals.js';
import {parseRackPlan,RACK_PLAN_SCHEMA} from './rackPlanning.js';
import {parseTopology,TOPOLOGY_SCHEMA} from './logicalTopology.js';
import {parseEvidenceLedger,EVIDENCE_SCHEMA} from './fieldEvidence.js';
import {DIAGRAM_SCHEMA} from './topologyDiagram.js';
import {READINESS_SCHEMA} from './fieldReadiness.js';

export const HANDOFF_SCHEMA='openblue.field-handoff/1';
export const MAX_HANDOFF_BYTES=7_000_000;
const MAX_PART_BYTES=2_500_000;
export const HANDOFF_PARTS=Object.freeze([
  {key:'project',label:'Blueprint v1',schema:SCHEMA_VERSION},
  {key:'roomAnnotations',label:'Room annotations',schema:ROOM_ANNOTATIONS_SCHEMA},
  {key:'pathways',label:'Proposed pathways',schema:PATHWAYS_SCHEMA},
  {key:'rackPlan',label:'Conceptual rack & port inventory',schema:RACK_PLAN_SCHEMA},
  {key:'logicalTopology',label:'Proposed logical topology',schema:TOPOLOGY_SCHEMA},
  {key:'fieldEvidence',label:'Human field evidence receipts',schema:EVIDENCE_SCHEMA},
  {key:'networkReview',label:'R8 network review snapshot',schema:'openblue.network-review/1'},
  {key:'topologyReview',label:'R12 topology review snapshot',schema:DIAGRAM_SCHEMA},
  {key:'readinessReview',label:'R14 documentation review snapshot',schema:READINESS_SCHEMA},
]);
const encoder=new TextEncoder();
const sizeOf=text=>encoder.encode(text).length;
const sha256=async text=>{
  const subtle=globalThis.crypto?.subtle;
  if(!subtle)throw Error('SHA-256 is unavailable. Use a secure browser context to create or check a handoff.');
  const digest=await subtle.digest('SHA-256',encoder.encode(text));
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
};
const stamp=at=>{
  if(typeof at!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T/.test(at)
    ||Number.isNaN(Date.parse(at))||new Date(at).toISOString()!==at)
    throw Error('Invalid UTC package creation timestamp.');
  return at;
};
function validateSection(key,data){
  if(!data||typeof data!=='object'||Array.isArray(data))throw Error(key+' is not a JSON object.');
  const schema=HANDOFF_PARTS.find(p=>p.key===key)?.schema;
  if(data.schemaVersion!==schema)throw Error(key+' has an unsupported schema.');
  const raw=JSON.stringify(data);
  if(sizeOf(raw)>MAX_PART_BYTES)throw Error(key+' exceeds individual part size limit.');
  switch(key){
    case 'project':return parseProjectJson(raw);
    case 'roomAnnotations':return parseRoomAnnotations(raw);
    case 'pathways':return parsePathways(raw);
    case 'rackPlan':return parseRackPlan(raw);
    case 'logicalTopology':return parseTopology(raw);
    case 'fieldEvidence':return parseEvidenceLedger(raw);
    case 'networkReview':
      if(data.status!=='CONCEPT_REVIEW_ONLY'||!Array.isArray(data.drops)||!Array.isArray(data.warnings))
        throw Error('R8 review snapshot is malformed.');
      break;
    case 'topologyReview':
      if(data.status!=='PROPOSAL_RECONCILIATION_ONLY'||!Array.isArray(data.nodes)
        ||!Array.isArray(data.edges)||!Array.isArray(data.issues))
        throw Error('R12 review snapshot is malformed.');
      break;
    case 'readinessReview':
      if(!['HOLD_FOR_DOCUMENTATION','DOCUMENTATION_REVIEW_CANDIDATE'].includes(data.status)
        ||!Array.isArray(data.rows)||!Array.isArray(data.nextActions))
        throw Error('R14 review snapshot is malformed.');
      break;
    default:throw Error('Unknown package section.');
  }
  return JSON.parse(raw);
}
const requireExactKeys=(record,keys,label)=>{
  if(!record||typeof record!=='object'||Array.isArray(record)
    ||Object.keys(record).sort().join('|')!==[...keys].sort().join('|'))
    throw Error('Unexpected '+label+' fields.');
};
const envelopeMeta=(bundle)=>({
  schemaVersion:bundle.schemaVersion,createdAt:bundle.createdAt,
  manifest:bundle.manifest,
  notice:bundle.notice,
});
const note=[
  'OFFLINE PORTABLE HANDOFF ONLY. This package includes operator-entered proposals and human-reported field observations.',
  'SHA-256 detects mismatches between bundle contents and the included manifest; a person who can edit the bundle can also recompute hashes. No trusted signature or identity is supplied.',
  'Reported PASS and DOCUMENTATION_REVIEW_CANDIDATE are not proof of cable testing, device reachability, approval, installation, or compliance.',
  'External files cited by evidence pointers, such as photos and instrument reports, are not embedded or authenticated.',
  'Opening an imported package performs a local preview only and does not replace or mutate current OpenBlue project/sidecar data.',
].join(' ');
export async function createFieldHandoff(source,createdAt=new Date().toISOString()){
  stamp(createdAt);
  if(!source||typeof source!=='object')throw Error('Missing handoff source.');
  const sections={},manifest=[];
  for(const part of HANDOFF_PARTS){
    const normalized=validateSection(part.key,source[part.key]);
    const raw=JSON.stringify(normalized);
    sections[part.key]=normalized;
    manifest.push({key:part.key,label:part.label,schema:part.schema,
      bytes:sizeOf(raw),sha256:await sha256(raw)});
  }
  // Preserve incomplete, contradictory or stale plans rather than repairing them.
  const bundle={
    schemaVersion:HANDOFF_SCHEMA,createdAt,manifest,notice:note,sections,
  };
  bundle.manifestSha256=await sha256(JSON.stringify(envelopeMeta(bundle)));
  if(sizeOf(JSON.stringify(bundle))>MAX_HANDOFF_BYTES)throw Error('Full handoff exceeds 7 MB.');
  return bundle;
}
export async function inspectFieldHandoff(raw){
  if(typeof raw!=='string'||sizeOf(raw)>MAX_HANDOFF_BYTES)
    throw Error('Handoff is larger than the 7 MB limit.');
  let bundle;
  try{bundle=JSON.parse(raw)}catch{throw Error('Handoff is not valid JSON.')}
  requireExactKeys(bundle,['schemaVersion','createdAt','manifest','notice','sections','manifestSha256'],'handoff');
  if(bundle.schemaVersion!==HANDOFF_SCHEMA)throw Error('Unsupported field handoff schema.');
  stamp(bundle.createdAt);
  if(bundle.notice!==note)throw Error('Handoff warning and provenance notice was changed.');
  if(!Array.isArray(bundle.manifest)||bundle.manifest.length!==HANDOFF_PARTS.length)
    throw Error('Incomplete package manifest.');
  requireExactKeys(bundle.sections,HANDOFF_PARTS.map(p=>p.key),'handoff section');
  const sections={},partChecks=[];
  for(let i=0;i<HANDOFF_PARTS.length;i++){
    const expected=HANDOFF_PARTS[i],manifest=bundle.manifest[i];
    requireExactKeys(manifest,['key','label','schema','bytes','sha256'],'manifest item');
    if(manifest.key!==expected.key||manifest.label!==expected.label||manifest.schema!==expected.schema)
      throw Error('Unexpected manifest section, order or schema.');
    const data=validateSection(expected.key,bundle.sections[expected.key]);
    const rawPart=JSON.stringify(bundle.sections[expected.key]);
    if(sizeOf(rawPart)!==manifest.bytes || await sha256(rawPart)!==manifest.sha256)
      throw Error('Hash or size mismatch for '+expected.label+'.');
    sections[expected.key]=data;
    partChecks.push({key:manifest.key,label:manifest.label,bytes:manifest.bytes,status:'HASH_MATCH'});
  }
  if(!/^[a-f0-9]{64}$/.test(bundle.manifestSha256)||
    await sha256(JSON.stringify(envelopeMeta(bundle)))!==bundle.manifestSha256)
    throw Error('Manifest header SHA-256 mismatch.');
  // These warnings describe what HAS NOT been independently established.
  const project=sections.project;
  const networkIds=new Set((project.symbols||[]).filter(s=>s.type==='network').map(s=>s.id));
  const rackAnchors=sections.rackPlan.racks.filter(r=>!networkIds.has(r.anchorId));
  const drops=sections.rackPlan.assignments.filter(a=>!networkIds.has(a.dropId));
  const evidenceRefs=sections.fieldEvidence.events.filter(e=>e.kind==='report');
  return {
    schemaVersion:HANDOFF_SCHEMA,createdAt:bundle.createdAt,projectTitle:project.metadata.title,
    parts:partChecks,
    metrics:{
      walls:project.walls.length,symbols:project.symbols.length,
      routes:sections.pathways.routes.length,racks:sections.rackPlan.racks.length,
      switches:sections.logicalTopology.switches.length,
      evidenceReports:evidenceRefs.length,
      evidenceReviews:sections.fieldEvidence.events.filter(e=>e.kind==='review').length,
      readinessStatus:sections.readinessReview.status,
      missingRackAnchors:rackAnchors.length,missingDropReferences:drops.length,
    },
    warnings:[
      'All nine sections and the unsigned manifest match their included SHA-256 hashes. This is INTEGRITY checking, NOT authentication.',
      'Imported contents were only inspected: your current drawing, sidecars and evidence ledger remain untouched.',
      ...(rackAnchors.length||drops.length?['Some stored network IDs no longer exist in the included blueprint; no references were repaired.']:[]),
      'The included R8/R12/R14 derived snapshots are preserved as authored. They are NOT independently recomputed, certified, or trusted as operational diagnostics.',
      'Evidence references are text only; external photos and test instruments are not included or verified.',
    ],
  };
}
export const serializeFieldHandoff=bundle=>JSON.stringify(bundle,null,2);
