import {describe,it,expect} from 'vitest';
import {createEmptyProject,convertProjectUnits} from './model.js';
import {emptyRackPlan,addRack,addPatchPanel,assignPort,reviewRackPlan} from './rackPlanning.js';
import {
 emptyTopology,addSwitch,deleteSwitch,setSwitchPortType,proposeLink,deleteLink,
 parseTopology,serializeTopology,loadTopology,saveTopology,reviewTopology,TOPOLOGY_STORAGE_KEY,
} from './logicalTopology.js';
const fixture=()=>{
  const p=createEmptyProject();
  p.symbols=[{id:'hub',type:'network',x:3,y:4,rotation:0},
    {id:'dropA',type:'network',x:8,y:4,rotation:0}];
  let racks=addRack(emptyRackPlan(),p,'hub','Main rack',12,'rackA');
  racks=addPatchPanel(racks,'rackA','Copper patch 1',24,'panel1');
  racks=assignPort(racks,p,'rackA','panel1',1,'dropA');
  return {p,racks};
};
const seeded=()=>{
 const {p,racks}=fixture();
 const topo=addSwitch(emptyTopology(),racks,'rackA','Switch A',24,'rj45-1g',2,'swA');
 return {p,racks,topo};
};
const store=()=>{const items=new Map();return{getItem:k=>items.get(k)||null,setItem:(k,v)=>items.set(k,v)}};
describe('R11 governed logical switch planning',()=>{
  it('adds a switch to unoccupied 1U and preserves unchanged v1 project JSON',()=>{
    const {p,racks,topo}=seeded(),before=JSON.stringify(p);
    expect(topo.switches[0].ports).toHaveLength(24);
    expect(topo.switches[0].unit).toBe(2);
    const report=reviewTopology(topo,racks,reviewRackPlan(p,racks));
    expect(report.totalSwitchPorts).toBe(24);
    expect(report.freeSwitchPorts).toBe(24);
    expect(report.switches[0].state).toBe('concept-only');
    expect(()=>addSwitch(topo,racks,'rackA','Bad',8,'rj45-1g',1,'swX')).toThrow('already reserved');
    expect(()=>addSwitch(topo,racks,'rackA','Bad',8,'rj45-1g',2,'swX')).toThrow('already reserved');
    expect(JSON.stringify(p)).toBe(before);
  });
  it('proposes patch-panel mapping with single-endpoint occupancy and dependent review',()=>{
    const {p,racks,topo}=seeded();
    const t=proposeLink(topo,racks,'swA',1,{kind:'panel',rackId:'rackA',panelId:'panel1',port:1},'linkA');
    const report=reviewTopology(t,racks,reviewRackPlan(p,racks));
    expect(report.links[0].state).toBe('proposed-patch');
    expect(report.links[0].dropId).toBe('dropA');
    expect(report.freeSwitchPorts).toBe(23);
    expect(()=>proposeLink(t,racks,'swA',1,{kind:'panel',rackId:'rackA',panelId:'panel1',port:2},'linkB')).toThrow('already participates');
    expect(()=>proposeLink(t,racks,'swA',2,{kind:'panel',rackId:'rackA',panelId:'panel1',port:1},'linkB')).toThrow('already participates');
    expect(deleteLink(t,'linkA').links).toHaveLength(0);
    expect(()=>proposeLink(topo,racks,'swA',1,{kind:'panel',rackId:'rackA',panelId:'panel1',port:25},'bad')).toThrow('does not exist');
  });
  it('rejects incompatible interface types and duplicated switch endpoints',()=>{
    const {p,racks,topo}=seeded();
    const two=addSwitch(topo,racks,'rackA','Switch B',8,'sfp-10g',3,'swB');
    expect(()=>proposeLink(two,racks,'swA',1,{kind:'switch',switchId:'swB',port:1},'bad')).toThrow('incompatible');
    expect(()=>proposeLink(two,racks,'swB',1,{kind:'panel',rackId:'rackA',panelId:'panel1',port:2},'bad')).toThrow('SFP+');
    const aligned=setSwitchPortType(two,'swA',23,'sfp-10g');
    const linked=proposeLink(aligned,racks,'swA',23,{kind:'switch',switchId:'swB',port:1},'uplink');
    expect(reviewTopology(linked,racks,reviewRackPlan(p,racks)).links[0].state).toBe('proposed-uplink');
    expect(()=>setSwitchPortType(linked,'swB',1,'rj45-1g')).toThrow('incompatible');
    expect(deleteSwitch(linked,'swA').links).toHaveLength(0);
  });
  it('flags deleted panels, missing rack, and changed 1U occupancy without modifying plans',()=>{
    const {p,racks,topo}=seeded(),linked=proposeLink(topo,racks,'swA',1,{kind:'panel',rackId:'rackA',panelId:'panel1',port:1},'linkA');
    const removed={...racks,racks:racks.racks.map(r=>({...r,panels:[]})),assignments:[]};
    expect(reviewTopology(linked,removed,reviewRackPlan(p,removed)).links[0].state).toBe('missing-panel-port');
    const clashed={...racks,racks:racks.racks.map(r=>({...r,panels:[...r.panels,{id:'extra',name:'Extra',ports:12,unit:2}]}))};
    expect(reviewTopology(linked,clashed,reviewRackPlan(p,clashed)).switches[0].state).toBe('u-slot-conflict');
    expect(reviewTopology(linked,emptyRackPlan()).switches[0].state).toBe('missing-rack');
    const metric=convertProjectUnits(p,'m');
    expect(reviewTopology(linked,racks,reviewRackPlan(metric,racks)).switches[0].state).toBe('concept-only');
  });
  it('serializes bounded sidecars, rejects malformed and duplicate data, saves locally',()=>{
    const {racks,topo}=seeded(),t=proposeLink(topo,racks,'swA',1,{kind:'panel',rackId:'rackA',panelId:'panel1',port:1},'a');
    const storage=store();
    saveTopology(t,storage);
    expect(storage.getItem(TOPOLOGY_STORAGE_KEY)).toContain('link');
    expect(loadTopology(storage).doc).toEqual(t);
    expect(parseTopology(serializeTopology(t))).toEqual(t);
    expect(()=>parseTopology('{broken')).toThrow('not valid JSON');
    expect(()=>parseTopology(JSON.stringify({...t,schemaVersion:'future'}))).toThrow('Unsupported');
    expect(()=>parseTopology(JSON.stringify({...t,links:[...t.links,t.links[0]]}))).toThrow('Duplicate link');
    expect(()=>parseTopology('x'.repeat(500001))).toThrow('500 KB');
    storage.setItem(TOPOLOGY_STORAGE_KEY,'{broken');
    expect(loadTopology(storage).error).toMatch(/not loaded/);
  });
});
