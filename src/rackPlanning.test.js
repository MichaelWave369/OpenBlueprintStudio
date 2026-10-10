import {describe,it,expect} from 'vitest';
import {createEmptyProject,convertProjectUnits} from './model.js';
import {createPathwayProposal,evaluatePathway} from './pathwayProposals.js';
import {emptyRackPlan,addRack,addPatchPanel,assignPort,releasePort,removePanel,removeRack,
 parseRackPlan,serializeRackPlan,loadRackPlan,saveRackPlan,reviewRackPlan,RACK_PLAN_STORAGE_KEY} from './rackPlanning.js';
const project=()=>{
 const p=createEmptyProject();
 p.symbols=[
  {id:'hub',type:'network',x:2,y:3,rotation:0},
  {id:'drop-a',type:'network',x:6,y:3,rotation:0},
  {id:'drop-b',type:'network',x:6,y:6,rotation:0},
  {id:'outlet',type:'outlet',x:5,y:3,rotation:0},
 ];
 return p;
};
const setup=p=>addPatchPanel(addRack(emptyRackPlan(),p,'hub','Rack A',6,'r1'),'r1','Panel',24,'p1');
const storage=()=>{const m=new Map();return{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)}};
describe('R10 rack planning sidecar',()=>{
 it('creates a 6U rack with 24 planned panel ports, leaves geometry untouched',()=>{
   const p=project(),before=JSON.stringify(p),d=setup(p);
   expect(d.racks[0].panels[0].unit).toBe(1);
   const info=reviewRackPlan(p,d);
   expect(info.totalPorts).toBe(24);
   expect(info.allocatedPorts).toBe(0);
   expect(info.racks[0].status).toBe('anchored');
   expect(JSON.stringify(p)).toBe(before);
 });
 it('enforces single drop per port, single port per drop and rejects invalid IDs',()=>{
   const p=project(),d=setup(p),assigned=assignPort(d,p,'r1','p1',1,'drop-a');
   expect(assigned.assignments).toHaveLength(1);
   expect(()=>assignPort(assigned,p,'r1','p1',1,'drop-b')).toThrow('Duplicate port');
   expect(()=>assignPort(assigned,p,'r1','p1',2,'drop-a')).toThrow('Duplicate drop');
   expect(()=>assignPort(d,p,'r1','p1',25,'drop-b')).toThrow('out of range');
   expect(()=>assignPort(d,p,'r1','p1',1,'hub')).toThrow('own panel');
   expect(()=>assignPort(d,p,'r1','p1',1,'outlet')).toThrow('current network');
   expect(()=>addRack(d,p,'hub','Another',12,'r2')).toThrow('already belongs');
   expect(releasePort(assigned,'r1','p1',1).assignments).toHaveLength(0);
 });
 it('enforces 1U slots, cascading deletion, and panel count constraints',()=>{
   const p=project();let d=setup(p);
   for(let i=2;i<=6;i++)d=addPatchPanel(d,'r1','Panel '+i,12,'p'+i);
   expect(d.racks[0].panels.map(p=>p.unit)).toEqual([1,2,3,4,5,6]);
   expect(()=>addPatchPanel(d,'r1','Full',12,'p7')).toThrow('no free 1U');
   d=assignPort(d,p,'r1','p1',1,'drop-a');
   expect(removePanel(d,'r1','p1').assignments).toHaveLength(0);
   expect(removeRack(d,'r1').assignments).toHaveLength(0);
 });
 it('marks a moved rack hub, deleted drop, and correlates R9 proposal without claiming installation',()=>{
   const p=project(),d=assignPort(setup(p),p,'r1','p1',1,'drop-a');
   expect(reviewRackPlan(p,d).allocations[0].state).toBe('untraced');
   const path=createPathwayProposal(p,'hub','drop-a',[]);
   const result=evaluatePathway(p,path);
   expect(result.status).toBe('clear');
   expect(reviewRackPlan(p,d,[{...path,...result}]).allocations[0].state).toBe('proposal-clear');
   const metric=convertProjectUnits(p,'m');
   expect(reviewRackPlan(metric,d).racks[0].status).toBe('anchored');
   const moved=structuredClone(p);moved.symbols[0].x++;
   expect(reviewRackPlan(moved,d).allocations[0].state).toBe('stale-rack');
   const missing=structuredClone(p);missing.symbols=missing.symbols.filter(s=>s.id!=='drop-a');
   expect(reviewRackPlan(missing,d).allocations[0].state).toBe('missing-drop');
 });
 it('safely roundtrips sidecar and rejects corrupt or duplicate data',()=>{
   const p=project(),d=assignPort(setup(p),p,'r1','p1',1,'drop-a'),s=storage();
   saveRackPlan(d,s);
   expect(s.getItem(RACK_PLAN_STORAGE_KEY)).toBe(serializeRackPlan(d));
   expect(loadRackPlan(s).doc).toEqual(d);
   expect(parseRackPlan(serializeRackPlan(d))).toEqual(d);
   expect(()=>parseRackPlan('{bad')).toThrow('not valid JSON');
   expect(()=>parseRackPlan(JSON.stringify({...d,schemaVersion:'future'}))).toThrow('Unsupported');
   expect(()=>parseRackPlan(JSON.stringify({...d,assignments:[...d.assignments,...d.assignments]}))).toThrow('Duplicate port');
   expect(()=>parseRackPlan(JSON.stringify({...d,racks:[...d.racks,...d.racks]}))).toThrow('Duplicate rack');
   expect(()=>parseRackPlan('x'.repeat(500001))).toThrow('500 KB');
   s.setItem(RACK_PLAN_STORAGE_KEY,'{bad');
   expect(loadRackPlan(s).error).toMatch(/not loaded/);
 });
});
