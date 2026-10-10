/**
 * R9: OPERATOR-DRAWN, NOT AUTO-ROUTED.
 * Paths are separate local-only proposals with SI waypoints and endpoint anchors.
 * Horizontal polygonal line length is NOT cable length or install approval.
 */
export const PATHWAYS_SCHEMA='openblue.pathway-proposals/1';
export const PATHWAYS_STORAGE_KEY='openblue/pathway-proposals-v1';
const MAX_BYTES=500000, MAX_ROUTES=100, MAX_WAYPOINTS=60, EPS=1e-7;
const finite=p=>p && typeof p.x==='number' && typeof p.y==='number'
  && Number.isFinite(p.x) && Number.isFinite(p.y);
const factor=units=>units==='ft'?0.3048:units==='m'?1:NaN;
const round=n=>Number(n.toFixed(7));
const key=(hubId,dropId)=>JSON.stringify([hubId,dropId]);
const defaultDoc=()=>({schemaVersion:PATHWAYS_SCHEMA,routes:[]});
export const emptyPathways=defaultDoc;

export function toMeters(p,units) {
  if(!finite(p)||!Number.isFinite(factor(units)))throw Error('Invalid pathway point or units.');
  return {x:round(p.x*factor(units)),y:round(p.y*factor(units))};
}
export function fromMeters(p,units) {
  if(!finite(p)||!Number.isFinite(factor(units)))throw Error('Invalid saved pathway point or units.');
  return {x:p.x/factor(units),y:p.y/factor(units)};
}
const stamp=(p,units)=>{
  const v=toMeters(p,units);
  return {x:Number(v.x.toFixed(5)),y:Number(v.y.toFixed(5))};
};
const sameStamp=(a,b)=>Math.abs(a.x-b.x)<0.000011 && Math.abs(a.y-b.y)<0.000011;
function normalizedText(value,field,max) {
  if(typeof value!=='string'||value.length>max||/[\u0000-\u001f\u007f]/.test(value))throw Error(field+' must be plain text up to '+max+' characters.');
  return value;
}
function parseRoute(v) {
  if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Invalid route entry.');
  const hubId=normalizedText(v.hubId,'Hub ID',120),dropId=normalizedText(v.dropId,'Drop ID',120);
  if(!hubId||!dropId||hubId===dropId)throw Error('Route requires different hub and drop IDs.');
  if(!finite(v.hubAnchorM)||!finite(v.dropAnchorM))throw Error('Missing endpoint position anchors.');
  if(!Array.isArray(v.waypointsM)||v.waypointsM.length>MAX_WAYPOINTS)throw Error('Too many route waypoints.');
  for(const p of [v.hubAnchorM,v.dropAnchorM,...v.waypointsM]) {
    if(!finite(p)||Math.abs(p.x)>100000||Math.abs(p.y)>100000)throw Error('Waypoints must be finite and within review bounds.');
  }
  const label=normalizedText(v.label??'','Route label',80);
  return {
    hubId,dropId,hubAnchorM:{x:v.hubAnchorM.x,y:v.hubAnchorM.y},
    dropAnchorM:{x:v.dropAnchorM.x,y:v.dropAnchorM.y},
    waypointsM:v.waypointsM.map(p=>({x:p.x,y:p.y})),label,
  };
}
export function parsePathways(text) {
  if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_BYTES)throw Error('Pathways document exceeds 500 KB.');
  let data;
  try {data=JSON.parse(text)} catch {throw Error('Invalid pathway JSON.')}
  if(!data||data.schemaVersion!==PATHWAYS_SCHEMA||!Array.isArray(data.routes)
    ||data.routes.length>MAX_ROUTES)throw Error('Unsupported pathway schema or route count.');
  const routes=data.routes.map(parseRoute),used=new Set();
  for(const r of routes) {
    const k=key(r.hubId,r.dropId);
    if(used.has(k))throw Error('Duplicate hub/drop proposal.');
    used.add(k);
  }
  return {schemaVersion:PATHWAYS_SCHEMA,routes};
}
export const serializePathways=doc=>JSON.stringify(parsePathways(JSON.stringify(doc)),null,2);
export function createPathwayProposal(project,hubId,dropId,waypoints=[],label='') {
  const symbols=project?.symbols?.filter(s=>s.type==='network')||[];
  const hub=symbols.find(s=>s.id===hubId),drop=symbols.find(s=>s.id===dropId);
  if(!hub||!drop||hubId===dropId)throw Error('Select two different existing network symbols.');
  if(!Array.isArray(waypoints)||waypoints.length>MAX_WAYPOINTS)throw Error('Maximum 60 proposed waypoints.');
  return parseRoute({
    hubId,dropId,hubAnchorM:stamp(hub,project.metadata.units),
    dropAnchorM:stamp(drop,project.metadata.units),
    waypointsM:waypoints.map(p=>toMeters(p,project.metadata.units)),label,
  });
}
export function upsertPathway(doc,route) {
  const clean=parseRoute(route);
  const routes=doc.routes.filter(r=>key(r.hubId,r.dropId)!==key(clean.hubId,clean.dropId));
  return parsePathways(JSON.stringify({schemaVersion:PATHWAYS_SCHEMA,routes:[...routes,clean]}));
}
export function removePathway(doc,hubId,dropId) {
  return parsePathways(JSON.stringify({schemaVersion:PATHWAYS_SCHEMA,
    routes:doc.routes.filter(r=>key(r.hubId,r.dropId)!==key(hubId,dropId))}));
}
export function loadPathways(storage=globalThis.localStorage) {
  try {
    const raw=storage?.getItem(PATHWAYS_STORAGE_KEY);
    return raw?{doc:parsePathways(raw),error:null}:{doc:defaultDoc(),error:null};
  }catch(error){return {doc:defaultDoc(),error:'Stored pathways were not loaded: '+error.message};}
}
export function savePathways(doc,storage=globalThis.localStorage) {
  if(!storage)throw Error('Browser storage unavailable.');
  storage.setItem(PATHWAYS_STORAGE_KEY,serializePathways(doc));
}
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const close=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<=EPS;
function onSegment(p,a,b) {
  return Math.abs(cross(a,b,p))<=EPS*Math.max(1,Math.hypot(b.x-a.x,b.y-a.y))
    && p.x>=Math.min(a.x,b.x)-EPS&&p.x<=Math.max(a.x,b.x)+EPS
    && p.y>=Math.min(a.y,b.y)-EPS&&p.y<=Math.max(a.y,b.y)+EPS;
}
function segmentContact(a,b,c,d) {
  const x=cross(a,b,c),y=cross(a,b,d),u=cross(c,d,a),v=cross(c,d,b);
  if(((x>EPS&&y < -EPS)||(x < -EPS&&y>EPS))
    && ((u>EPS&&v < -EPS)||(u < -EPS&&v>EPS)))return 'cross';
  if(onSegment(c,a,b)||onSegment(d,a,b)||onSegment(a,c,d)||onSegment(b,c,d))return 'touch';
  return null;
}
export function evaluatePathway(project,route) {
  const units=project.metadata.units;
  const hub=project.symbols.find(s=>s.id===route.hubId&&s.type==='network');
  const drop=project.symbols.find(s=>s.id===route.dropId&&s.type==='network');
  if(!hub||!drop) return {status:'stale',points:[],length:null,crossings:[],
    warning:'Endpoint symbol was removed or retyped. Proposal is no longer anchored.'};
  const anchored=sameStamp(stamp(hub,units),route.hubAnchorM)
    && sameStamp(stamp(drop,units),route.dropAnchorM);
  const points=[{x:hub.x,y:hub.y},...route.waypointsM.map(p=>fromMeters(p,units)),{x:drop.x,y:drop.y}];
  let length=0;
  for(let i=1;i<points.length;i++) length+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);
  const crossings=new Set();
  for(const wall of project.walls)for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i];
    const t=segmentContact(a,b,{x:wall.x1,y:wall.y1},{x:wall.x2,y:wall.y2});
    if(t)crossings.add(wall.id);
  }
  const warning=!anchored?'Endpoint coordinates changed; re-trace from the current network points.':
    crossings.size?'Proposed segments touch or cross wall centerlines. Openings and penetrations are NOT verified.':
    'No wall-centerline intersections detected; physical pathway still requires field verification.';
  const status=!anchored?'stale':crossings.size?'review':'clear';
  return {status,points,length,crossings:[...crossings],warning};
}
export function evaluatePathwayDocument(project,doc) {
  return doc.routes.map(route=>({...route,...evaluatePathway(project,route)}));
}
