/**
 * OpenBlue R11: logical, operator-proposed equipment and interconnects ONLY.
 * Separate from CAD geometry, R10 patch inventory and network execution.
 * Never implies installed/active links, VLAN, PoE or switch capabilities.
 */
export const TOPOLOGY_SCHEMA='openblue.logical-topology/1';
export const TOPOLOGY_STORAGE_KEY='openblue/logical-topology-v1';
export const SWITCH_PORT_COUNTS=[8,16,24,48];
export const SWITCH_PORT_TYPES=[
  {value:'rj45-1g',label:'RJ45 · assumed 1G'},
  {value:'rj45-2.5g',label:'RJ45 · assumed 2.5G'},
  {value:'sfp-10g',label:'SFP+ · assumed 10G'},
];
const PORT_TYPES=new Set(SWITCH_PORT_TYPES.map(p=>p.value));
const MAX_BYTES=500000;
const MAX_SWITCHES=16,MAX_LINKS=200;
const validText=(x,label,max=120)=>{
  if(typeof x!=='string'||!x.length||x.length>max||/[\u0000-\u001f\u007f]/.test(x))
    throw Error(label+' must be plain text of 1–'+max+' characters.');
  return x;
};
const int=(n,min,max,label)=>{
  if(!Number.isInteger(n)||n<min||n>max)throw Error(label+' out of range.');
  return n;
};
const portType=t=>{
  if(!PORT_TYPES.has(t))throw Error('Unsupported planned port interface.');
  return t;
};
export const emptyTopology=()=>({schemaVersion:TOPOLOGY_SCHEMA,switches:[],links:[]});
const swKey=(id,n)=>JSON.stringify(['switch',id,n]);
const panelKey=(rackId,panelId,port)=>JSON.stringify(['panel',rackId,panelId,port]);
const assertUnique=(seen,id,label)=>{
  if(seen.has(id))throw Error('Duplicate '+label+'.');
  seen.add(id);
};
function cleanPort(p,index) {
  if(!p||typeof p!=='object'||Array.isArray(p))throw Error('Invalid switch port.');
  const number=int(p.number,1,48,'Switch port number');
  if(number!==index+1)throw Error('Switch ports must be sequential from one.');
  return {number,kind:portType(p.kind)};
}
export function parseTopology(text){
  if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_BYTES)
    throw Error('Topology JSON exceeds 500 KB.');
  let doc;
  try{doc=JSON.parse(text)}catch{throw Error('Topology file is not valid JSON.')}
  if(!doc||doc.schemaVersion!==TOPOLOGY_SCHEMA||!Array.isArray(doc.switches)
    ||!Array.isArray(doc.links)||doc.switches.length>MAX_SWITCHES||doc.links.length>MAX_LINKS)
    throw Error('Unsupported topology schema or inventory limit.');
  const seenSwitches=new Set(),seenLinks=new Set();
  const switches=doc.switches.map(s=>{
    if(!s||typeof s!=='object'||Array.isArray(s))throw Error('Invalid switch entry.');
    const id=validText(s.id,'Switch ID',80);
    assertUnique(seenSwitches,id,'switch ID');
    const name=validText(s.name,'Switch label',80);
    const rackId=validText(s.rackId,'Rack ID',80);
    const unit=int(s.unit,1,48,'Rack U slot');
    if(!Array.isArray(s.ports)||!SWITCH_PORT_COUNTS.includes(s.ports.length))
      throw Error('Switch must have 8, 16, 24 or 48 logical ports.');
    return {id,name,rackId,unit,ports:s.ports.map(cleanPort)};
  });
  // Switch RUs cannot overlap within a rack; R10 patch-panel RU conflicts are
  // independently rechecked on each render as its sidecar can change.
  const slots=new Set();
  for(const sw of switches)assertUnique(slots,JSON.stringify([sw.rackId,sw.unit]),'switch rack U slot');
  const usedEndpoints=new Set();
  const links=doc.links.map(link=>{
    if(!link||typeof link!=='object'||Array.isArray(link))throw Error('Invalid logical link.');
    const id=validText(link.id,'Link ID',80);
    assertUnique(seenLinks,id,'link ID');
    const a=link.a,b=link.b;
    if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)||Array.isArray(b))
      throw Error('Link endpoints are required.');
    const switchId=validText(a.switchId,'Source switch ID',80);
    const from=switches.find(s=>s.id===switchId);
    if(!from)throw Error('Link source switch does not exist.');
    const port=int(a.port,1,from.ports.length,'Source switch port');
    const sourceKey=swKey(switchId,port);
    let target,targetKey,kind;
    if(b.kind==='panel'){
      const rackId=validText(b.rackId,'Target rack ID',80);
      const panelId=validText(b.panelId,'Target panel ID',80);
      const targetPort=int(b.port,1,48,'Patch panel port');
      if(from.ports[port-1].kind==='sfp-10g')
        throw Error('SFP+ switch port cannot be proposed directly to a nominal RJ45 patch panel.');
      target={kind:'panel',rackId,panelId,port:targetPort};
      targetKey=panelKey(rackId,panelId,targetPort);
      kind='panel';
    }else if(b.kind==='switch'){
      const targetId=validText(b.switchId,'Target switch ID',80);
      const other=switches.find(s=>s.id===targetId);
      if(!other)throw Error('Target switch does not exist.');
      const targetPort=int(b.port,1,other.ports.length,'Target switch port');
      if(switchId===targetId&&port===targetPort)throw Error('Switch port cannot link to itself.');
      if(from.ports[port-1].kind!==other.ports[targetPort-1].kind)
        throw Error('Proposed switch uplink interfaces have incompatible types.');
      target={kind:'switch',switchId:targetId,port:targetPort};
      targetKey=swKey(targetId,targetPort);
      kind='switch';
    }else throw Error('Unknown logical target type.');
    if(usedEndpoints.has(sourceKey)||usedEndpoints.has(targetKey))
      throw Error('Logical port already participates in a proposed link.');
    usedEndpoints.add(sourceKey);usedEndpoints.add(targetKey);
    return {id,a:{switchId,port},b:target};
  });
  return {schemaVersion:TOPOLOGY_SCHEMA,switches,links};
}
export const serializeTopology=doc=>JSON.stringify(parseTopology(JSON.stringify(doc)),null,2);
const validated=doc=>parseTopology(JSON.stringify(doc));
export function addSwitch(doc,rackPlan,rackId,name,count,kind,unit,id){
  const rack=rackPlan?.racks?.find(r=>r.id===rackId);
  if(!rack)throw Error('Select a known R10 rack.');
  if(!SWITCH_PORT_COUNTS.includes(count))throw Error('Switch port count must be 8/16/24/48.');
  portType(kind);
  const u=int(unit,1,rack.capacityU,'Rack U slot');
  if(rack.panels.some(p=>p.unit===u)||doc.switches.some(s=>s.rackId===rackId&&s.unit===u))
    throw Error('Rack U slot already reserved by a patch panel or switch.');
  return validated({...doc,switches:[...doc.switches,{
    id,name,rackId,unit:u,
    ports:Array.from({length:count},(_,i)=>({number:i+1,kind})),
  }]});
}
export function deleteSwitch(doc,id){
  return validated({...doc,switches:doc.switches.filter(s=>s.id!==id),
    links:doc.links.filter(l=>l.a.switchId!==id&&!(l.b.kind==='switch'&&l.b.switchId===id))});
}
export function setSwitchPortType(doc,switchId,port,kind){
  portType(kind);
  const sw=doc.switches.find(s=>s.id===switchId);
  if(!sw)throw Error('Switch does not exist.');
  int(port,1,sw.ports.length,'Switch port');
  return validated({...doc,switches:doc.switches.map(s=>s.id===switchId?{
    ...s,ports:s.ports.map(p=>p.number===port?{...p,kind}:p),
  }:s)});
}
export function proposeLink(doc,rackPlan,switchId,port,target,id){
  if(!target||typeof target!=='object')throw Error('Select a link target.');
  if(target.kind==='panel'){
    const rack=rackPlan?.racks?.find(r=>r.id===target.rackId);
    const panel=rack?.panels?.find(p=>p.id===target.panelId);
    if(!panel||!Number.isInteger(target.port)||target.port<1||target.port>panel.ports)
      throw Error('Target patch-panel port does not exist in R10.');
  }
  return validated({...doc,links:[...doc.links,{id,a:{switchId,port},b:target}]});
}
export function deleteLink(doc,id){
  return validated({...doc,links:doc.links.filter(l=>l.id!==id)});
}
export function loadTopology(storage=globalThis.localStorage){
  try{
    const raw=storage?.getItem(TOPOLOGY_STORAGE_KEY);
    return raw?{doc:parseTopology(raw),error:null}:{doc:emptyTopology(),error:null};
  }catch(error){return {doc:emptyTopology(),error:'Stored logical topology was not loaded: '+error.message};}
}
export function saveTopology(doc,storage=globalThis.localStorage){
  if(!storage)throw Error('Browser storage unavailable.');
  storage.setItem(TOPOLOGY_STORAGE_KEY,serializeTopology(doc));
}
export function reviewTopology(doc,rackPlan,rackReview){
  const rackStates=new Map((rackReview?.racks||[]).map(r=>[r.id,r.status]));
  const switches=doc.switches.map(s=>{
    const rack=rackPlan?.racks?.find(r=>r.id===s.rackId);
    const state=!rack?'missing-rack':rackStates.get(rack.id)!=='anchored'?'stale-rack-anchor':
      s.unit>rack.capacityU||rack.panels.some(p=>p.unit===s.unit)?'u-slot-conflict':'concept-only';
    return {...s,state,linkedPorts:doc.links.filter(l=>l.a.switchId===s.id
      ||(l.b.kind==='switch'&&l.b.switchId===s.id)).length};
  });
  const links=doc.links.map(l=>{
    const source=switches.find(s=>s.id===l.a.switchId);
    const target=l.b.kind==='switch'?switches.find(s=>s.id===l.b.switchId):null;
    const rack=rackPlan?.racks?.find(r=>r.id===l.b.rackId);
    const panel=rack?.panels?.find(p=>p.id===l.b.panelId);
    const panelValid=l.b.kind!=='panel'||Boolean(panel&&l.b.port<=panel.ports);
    const allocation=l.b.kind==='panel'?
      (rackReview?.allocations||[]).find(a=>a.rackId===l.b.rackId&&a.panelId===l.b.panelId&&a.port===l.b.port):null;
    let state=source?.state!=='concept-only'?'stale-source':
      l.b.kind==='switch'?
        target?.state!=='concept-only'?'stale-target':'proposed-uplink':
        !panelValid?'missing-panel-port':
        rackStates.get(l.b.rackId)!=='anchored'?'stale-panel-rack':
        !allocation?'panel-port-unallocated':
        !['proposal-clear','untraced'].includes(allocation.state)?'pathway-review':'proposed-patch';
    return {...l,state,dropId:allocation?.dropId||null,routeState:allocation?.state||'unknown'};
  });
  const freeSwitchPorts=switches.reduce((n,s)=>n+s.ports.length-s.linkedPorts,0);
  return {
    switches,links,totalSwitchPorts:switches.reduce((n,s)=>n+s.ports.length,0),
    linkedSwitchPorts:switches.reduce((n,s)=>n+s.linkedPorts,0),
    freeSwitchPorts,
    warnings:[
      'Topology is an operator-proposed drawing only. No real device discovery, negotiated speed, VLAN, PoE, network link or patch-cord continuity has been verified.',
      ...(switches.some(s=>s.state!=='concept-only')?['Rack anchor or U-slot conflict detected. Switch placement requires review.']:[]),
      ...(links.some(l=>!['proposed-uplink','proposed-patch'].includes(l.state))?['One or more proposed connections reference missing or unreviewed infrastructure.']:[]),
    ],
  };
}
