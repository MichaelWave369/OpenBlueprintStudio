/** R10 local-only, unverified rack and patch-panel planning. */
export const RACK_PLAN_SCHEMA='openblue.rack-plan/1';
export const RACK_PLAN_STORAGE_KEY='openblue/rack-plan-v1';
export const RACK_CAPACITIES=[6,12,24,42,48];
export const PANEL_PORT_COUNTS=[12,24,48];
export const emptyRackPlan=()=>({schemaVersion:RACK_PLAN_SCHEMA,racks:[],assignments:[]});
const safe=(x,label,n=120)=>{
 if(typeof x!=='string'||!x.length||x.length>n||/[\u0000-\u001f\u007f]/.test(x))throw Error(label+' must be plain text up to '+n+' characters.');
 return x;
};
const coord=(p)=>p&&typeof p.x==='number'&&typeof p.y==='number'&&Number.isFinite(p.x)&&Number.isFinite(p.y)
  &&Math.abs(p.x)<100000&&Math.abs(p.y)<100000;
const meters=(p,units)=>{
 if(!coord(p)||!['ft','m'].includes(units))throw Error('Invalid rack coordinate/units.');
 const f=units==='ft'?0.3048:1;
 return {x:Math.round(p.x*f*100000)/100000,y:Math.round(p.y*f*100000)/100000};
};
const close=(a,b)=>Math.abs(a.x-b.x)<=0.000011&&Math.abs(a.y-b.y)<=0.000011;
const int=(x,min,max,label)=>{
 if(!Number.isInteger(x)||x<min||x>max)throw Error(label+' out of range.');
 return x;
};
export function parseRackPlan(raw){
 if(typeof raw!=='string'||new TextEncoder().encode(raw).length>500000)throw Error('Rack plan exceeds 500 KB.');
 let doc;
 try{doc=JSON.parse(raw);}catch{throw Error('Rack plan is not valid JSON.');}
 if(!doc||doc.schemaVersion!==RACK_PLAN_SCHEMA||!Array.isArray(doc.racks)||!Array.isArray(doc.assignments)
   ||doc.racks.length>8||doc.assignments.length>300)throw Error('Unsupported rack plan schema or count.');
 const racks=doc.racks.map(r=>{
   if(!r||typeof r!=='object'||Array.isArray(r))throw Error('Invalid rack record.');
   const id=safe(r.id,'Rack ID',80),name=safe(r.name,'Rack name',80),anchorId=safe(r.anchorId,'Network anchor');
   const capacityU=int(r.capacityU,6,48,'Rack U');
   if(!RACK_CAPACITIES.includes(capacityU)||!coord(r.anchorM)||!Array.isArray(r.panels)||r.panels.length>12)
     throw Error('Invalid rack capacity, position or panel count.');
   const ids=new Set(),slots=new Set();
   const panels=r.panels.map(p=>{
     if(!p||typeof p!=='object'||Array.isArray(p))throw Error('Invalid panel.');
     const id=safe(p.id,'Panel ID',80),name=safe(p.name,'Panel name',80);
     if(ids.has(id))throw Error('Duplicate panel ID.');
     ids.add(id);
     if(!PANEL_PORT_COUNTS.includes(p.ports))throw Error('Unsupported panel port count.');
     const unit=int(p.unit,1,capacityU,'Panel U slot');
     if(slots.has(unit))throw Error('Two panels cannot occupy one U slot.');
     slots.add(unit);
     return {id,name,ports:p.ports,unit};
   });
   return {id,name,anchorId,anchorM:{x:r.anchorM.x,y:r.anchorM.y},capacityU,panels};
 });
 const rackIds=new Set(),anchorIds=new Set();
 for(const r of racks){
   if(rackIds.has(r.id))throw Error('Duplicate rack ID.');
   if(anchorIds.has(r.anchorId))throw Error('Network anchor already belongs to a rack.');
   rackIds.add(r.id);anchorIds.add(r.anchorId);
 }
 const portKeys=new Set(),dropIds=new Set();
 const assignments=doc.assignments.map(a=>{
   if(!a||typeof a!=='object'||Array.isArray(a))throw Error('Invalid port allocation.');
   const rackId=safe(a.rackId,'Rack ID',80),panelId=safe(a.panelId,'Panel ID',80),dropId=safe(a.dropId,'Drop ID');
   const rack=racks.find(r=>r.id===rackId),panel=rack?.panels.find(p=>p.id===panelId);
   if(!panel)throw Error('Unknown rack or panel in port allocation.');
   const port=int(a.port,1,panel.ports,'Port');
   if(dropId===rack.anchorId)throw Error('Rack hub cannot be assigned to its own panel port.');
   const k=JSON.stringify([rackId,panelId,port]);
   if(portKeys.has(k))throw Error('Duplicate port allocation.');
   if(dropIds.has(dropId))throw Error('Duplicate drop allocation.');
   portKeys.add(k);dropIds.add(dropId);
   return {rackId,panelId,port,dropId};
 });
 return {schemaVersion:RACK_PLAN_SCHEMA,racks,assignments};
}
export const serializeRackPlan=doc=>JSON.stringify(parseRackPlan(JSON.stringify(doc)),null,2);
const validate=doc=>parseRackPlan(JSON.stringify(doc));
export function addRack(doc,project,anchorId,name,capacityU,id){
 const symbol=project?.symbols?.find(s=>s.id===anchorId&&s.type==='network');
 if(!symbol)throw Error('A rack requires an existing schematic network hub.');
 return validate({...doc,racks:[...doc.racks,{
   id,name,capacityU,anchorId,anchorM:meters(symbol,project.metadata.units),panels:[],
 }]});
}
export function addPatchPanel(doc,rackId,name,ports,id){
 const rack=doc.racks.find(r=>r.id===rackId);
 if(!rack)throw Error('Rack not found.');
 const used=new Set(rack.panels.map(p=>p.unit));
 const unit=Array.from({length:rack.capacityU},(_,i)=>i+1).find(n=>!used.has(n));
 if(!unit)throw Error('Rack has no free 1U slot.');
 return validate({...doc,racks:doc.racks.map(r=>r.id===rackId?
   {...r,panels:[...r.panels,{id,name,ports,unit}]}:r)});
}
export function assignPort(doc,project,rackId,panelId,port,dropId){
 if(!project?.symbols?.some(s=>s.id===dropId&&s.type==='network'))throw Error('Drop is not a current network symbol.');
 return validate({...doc,assignments:[...doc.assignments,{rackId,panelId,port,dropId}]});
}
export function releasePort(doc,rackId,panelId,port){
 return validate({...doc,assignments:doc.assignments.filter(a=>!(a.rackId===rackId&&a.panelId===panelId&&a.port===port))});
}
export function removePanel(doc,rackId,panelId){
 return validate({...doc,
   racks:doc.racks.map(r=>r.id===rackId?{...r,panels:r.panels.filter(p=>p.id!==panelId)}:r),
   assignments:doc.assignments.filter(a=>!(a.rackId===rackId&&a.panelId===panelId))});
}
export function removeRack(doc,rackId){
 return validate({...doc,racks:doc.racks.filter(r=>r.id!==rackId),
   assignments:doc.assignments.filter(a=>a.rackId!==rackId)});
}
export function loadRackPlan(storage=globalThis.localStorage){
 try{
   const s=storage?.getItem(RACK_PLAN_STORAGE_KEY);
   return s?{doc:parseRackPlan(s),error:null}:{doc:emptyRackPlan(),error:null};
 }catch(error){return {doc:emptyRackPlan(),error:'Rack plan was not loaded: '+error.message};}
}
export function saveRackPlan(doc,storage=globalThis.localStorage){
 if(!storage)throw Error('Browser storage unavailable.');
 storage.setItem(RACK_PLAN_STORAGE_KEY,serializeRackPlan(doc));
}
export function reviewRackPlan(project,doc,paths=[],networkReview={}){
 const network=project?.symbols?.filter(s=>s.type==='network')||[];
 const racks=doc.racks.map(r=>{
   const hub=network.find(s=>s.id===r.anchorId);
   const status=!hub?'missing-anchor':close(meters(hub,project.metadata.units),r.anchorM)?'anchored':'moved-anchor';
   const totalPorts=r.panels.reduce((n,p)=>n+p.ports,0);
   const allocated=doc.assignments.filter(a=>a.rackId===r.id).length;
   return {...r,status,totalPorts,allocated,freePorts:totalPorts-allocated};
 });
 const allocations=doc.assignments.map(a=>{
   const rack=racks.find(r=>r.id===a.rackId),dest=network.find(s=>s.id===a.dropId);
   const route=paths.find(p=>p.hubId===rack.anchorId&&p.dropId===a.dropId);
   const state=!dest?'missing-drop':rack.status!=='anchored'?'stale-rack':
     !route?'untraced':route.status==='stale'?'stale-pathway':
     route.status==='review'?'wall-review':'proposal-clear';
   const drop=networkReview?.drops?.find(d=>d.id===a.dropId);
   return {...a,state,roomName:drop?.roomName||null,routeStatus:route?.status||'none'};
 });
 const totalPorts=racks.reduce((n,r)=>n+r.totalPorts,0);
 return {racks,allocations,totalPorts,allocatedPorts:allocations.length,
   freePorts:totalPorts-allocations.length,
   warnings:[
     'PROPOSED logical inventory only. No port, patch cord, switch, network link or physical installation has been verified.',
     ...(racks.some(r=>r.status!=='anchored')?['Some rack anchors moved or disappeared; associated assignments need manual review.']:[]),
     ...(allocations.some(a=>!['untraced','proposal-clear'].includes(a.state))?['Some allocated drops or pathways require manual review.']:[]),
   ]};
}
