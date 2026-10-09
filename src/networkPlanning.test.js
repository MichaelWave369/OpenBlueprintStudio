import {describe,it,expect} from 'vitest';
import {analyzeNetworkPlan,pointInConceptPolygon,networkReviewSnapshot} from './networkPlanning.js';
import {analyzeConnectedRooms} from './connectedRooms.js';
import {roomAnnotationKey} from './roomAnnotations.js';
import {createSampleProject,convertProjectUnits} from './model.js';
const create=()=>{
  const p=createSampleProject();
  p.symbols=[
    {id:'hub',type:'network',x:5,y:5,rotation:0},
    {id:'far',type:'network',x:20,y:20,rotation:0},
    {id:'edge',type:'network',x:17,y:10,rotation:0},
    {id:'out',type:'network',x:40,y:40,rotation:0},
    {id:'power',type:'outlet',x:5,y:5,rotation:0},
  ];
  return p;
};
const roomed=(p)=>{
  const result=analyzeConnectedRooms(p);
  return {...result,rooms:result.rooms.map(room=>({
    ...room,annotationKey:roomAnnotationKey(room,p.metadata.units,'connected'),
  }))};
};
describe('OpenBlue R8: conservative network inventory',()=>{
  it('uses strict inside/boundary/outside classification',()=>{
    const poly=[{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}];
    expect(pointInConceptPolygon({x:4,y:5},poly)).toBe('inside');
    expect(pointInConceptPolygon({x:0,y:5},poly)).toBe('boundary');
    expect(pointInConceptPolygon({x:12,y:5},poly)).toBe('outside');
    expect(pointInConceptPolygon({x:NaN,y:2},poly)).toBe('invalid');
  });
  it('groups drops by real faces and never counts outlets as network drops',()=>{
    const p=create(),face=roomed(p);
    expect(face.status).toBe('ready');
    const notes=Object.fromEntries(face.rooms.map((r,i)=>[r.annotationKey,{name:'Room '+(i+1)}]));
    const before=JSON.stringify(p), result=analyzeNetworkPlan(p,face,notes,'hub');
    expect(result.drops).toHaveLength(4);
    expect(result.drops.find(d=>d.id==='hub').location).toBe('assigned');
    expect(result.drops.find(d=>d.id==='far').location).toBe('assigned');
    expect(result.drops.find(d=>d.id==='edge').location).toBe('boundary');
    expect(result.drops.find(d=>d.id==='out').location).toBe('outside');
    expect(result.drops.find(d=>d.id==='hub').straightDistance).toBe(0);
    expect(result.drops.find(d=>d.id==='far').straightDistance).toBeCloseTo(Math.hypot(15,15));
    expect(result.unassignedCount).toBe(2);
    expect(result.sharedSegments).toBeGreaterThan(0);
    expect(JSON.stringify(p)).toBe(before);
  });
  it('withholds assignment entirely on ambiguous topology',()=>{
    const p=create(),analysis={status:'ambiguous',rooms:[],sharedBoundaries:[]};
    const result=analyzeNetworkPlan(p,analysis,{},'hub');
    expect(result.drops.every(d=>d.location==='unknown')).toBe(true);
    expect(result.warnings.join(' ')).toMatch(/withheld/);
  });
  it('does not claim a route or convert straight-line separation to cable length',()=>{
    const p=create(),analysis=roomed(p),result=analyzeNetworkPlan(p,analysis,{},'hub');
    const report=networkReviewSnapshot(p,result);
    expect(report.status).toBe('CONCEPT_REVIEW_ONLY');
    expect(report.sourceProjectSchema).toBe(p.schemaVersion);
    expect(report.warnings.join(' ')).toMatch(/NOT cable routes/);
    expect(JSON.stringify(report)).not.toMatch(/cableLength|routeLength|portCapacity/);
    const metric=convertProjectUnits(p,'m'),metricResult=analyzeNetworkPlan(metric,roomed(metric),{},'hub');
    expect(metricResult.drops.find(d=>d.id==='far').straightDistance)
      .toBeCloseTo(result.drops.find(d=>d.id==='far').straightDistance*0.3048,8);
  });
  it('requires explicit hub choice and never invents adjacency for strict mode',()=>{
    const p=create();
    const result=analyzeNetworkPlan(p,roomed(p),{},'missing-hub');
    expect(result.hubId).toBe(null);
    expect(result.drops.every(d=>d.straightDistance===null)).toBe(true);
    const strict=analyzeNetworkPlan(p,{status:'open',rooms:[]},{},'hub');
    expect(strict.rooms).toHaveLength(0);
    expect(strict.adjacency).toHaveLength(0);
  });
});
