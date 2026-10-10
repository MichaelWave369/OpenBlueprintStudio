import {describe,it,expect} from 'vitest';
import {
  createPathwayProposal,evaluatePathway,upsertPathway,removePathway,emptyPathways,
  parsePathways,serializePathways,loadPathways,savePathways,toMeters,fromMeters,
  evaluatePathwayDocument,PATHWAYS_STORAGE_KEY,
} from './pathwayProposals.js';
import {createSampleProject,convertProjectUnits} from './model.js';
const setup=()=>{
 const p=createSampleProject();
 p.symbols=[
 {id:'hub',type:'network',x:5,y:5,rotation:0},
 {id:'drop',type:'network',x:8,y:9,rotation:0},
 {id:'remote',type:'network',x:20,y:19,rotation:0},
 ];
 return p;
};
const storage=()=>{const map=new Map();return{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)}};
describe('R9 operator pathways',()=>{
 it('creates a clear proposed polyline with correct segmented length',()=>{
   const p=setup(),before=JSON.stringify(p);
   const route=createPathwayProposal(p,'hub','drop',[{x:5,y:9}],'North bend');
   const result=evaluatePathway(p,route);
   expect(result.length).toBeCloseTo(7);
   expect(result.crossings).toEqual([]);
   expect(result.status).toBe('clear');
   expect(JSON.stringify(p)).toEqual(before);
 });
 it('flags crossings and wall touching, never asserts physical clearance',()=>{
   const p=setup(),route=createPathwayProposal(p,'hub','remote',[]);
   const result=evaluatePathway(p,route);
   expect(result.status).toBe('review');
   expect(result.crossings.length).toBeGreaterThan(0);
   expect(result.warning).toMatch(/NOT verified/);
 });
 it('treats moved network endpoints as stale rather than rerouting',()=>{
   const p=setup(),route=createPathwayProposal(p,'hub','drop',[{x:7,y:6}]);
   p.symbols[1].x+=1;
   const result=evaluatePathway(p,route);
   expect(result.status).toBe('stale');
   expect(result.warning).toMatch(/re-trace/);
   expect(evaluatePathwayDocument(p,{routes:[route]})).toHaveLength(1);
 });
 it('preserves SI proposal geometry through ft to m switch',()=>{
   const p=setup(),route=createPathwayProposal(p,'hub','drop',[{x:5,y:9}]);
   const m=convertProjectUnits(p,'m'),result=evaluatePathway(m,route);
   expect(result.status).toBe('clear');
   expect(result.length).toBeCloseTo(7*0.3048,6);
   expect(toMeters({x:10,y:10},'ft').x).toBeCloseTo(3.048);
   expect(fromMeters({x:3.048,y:3.048},'ft').x).toBeCloseTo(10);
 });
 it('serializes separate schema, saves/loads, updates routes by pair',()=>{
   const p=setup(),route=createPathwayProposal(p,'hub','drop',[]);
   let doc=upsertPathway(emptyPathways(),route);
   doc=upsertPathway(doc,{...route,label:'Next'});
   expect(doc.routes).toHaveLength(1);
   expect(doc.routes[0].label).toBe('Next');
   const st=storage();savePathways(doc,st);
   expect(st.getItem(PATHWAYS_STORAGE_KEY)).toContain('Next');
   expect(loadPathways(st).doc).toEqual(doc);
   expect(parsePathways(serializePathways(doc))).toEqual(doc);
   expect(removePathway(doc,'hub','drop').routes).toHaveLength(0);
 });
 it('rejects hostile, duplicate and oversized proposals',()=>{
   const p=setup(),route=createPathwayProposal(p,'hub','drop',[]);
   expect(()=>parsePathways('{bad')).toThrow('Invalid pathway JSON');
   expect(()=>parsePathways(JSON.stringify({schemaVersion:'future',routes:[]}))).toThrow('Unsupported');
   expect(()=>upsertPathway(emptyPathways(),{...route,waypointsM:Array.from({length:61},()=>({x:1,y:1}))})).toThrow('Too many');
   expect(()=>createPathwayProposal(p,'hub','hub',[])).toThrow('different');
   expect(()=>parsePathways(JSON.stringify({schemaVersion:'openblue.pathway-proposals/1',routes:[route,route]}))).toThrow('Duplicate');
   expect(()=>upsertPathway(emptyPathways(),{...route,label:'x'.repeat(81)})).toThrow('80');
   const bad=storage();bad.setItem(PATHWAYS_STORAGE_KEY,'{bad');
   expect(loadPathways(bad).error).toMatch(/not loaded/);
 });
});
