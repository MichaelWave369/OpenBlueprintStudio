import { describe, expect, it } from 'vitest';
import { analyzeConnectedRooms } from './connectedRooms.js';
import { createEmptyProject, createSampleProject, convertProjectUnits } from './model.js';
const wall=(id,x1,y1,x2,y2)=>({id,x1,y1,x2,y2,thickness:0.5,height:9});
const plan=(walls)=>({...createEmptyProject(),walls});
const rect=(name,x,y,w,h)=>[
  wall(name+'top',x,y,x+w,y),
  wall(name+'right',x+w,y,x+w,y+h),
  wall(name+'bottom',x+w,y+h,x,y+h),
  wall(name+'left',x,y+h,x,y),
];
describe('R6 connected wall centerline topology',()=>{
  it('finds two adjacent zones sharing a partition through T-junctions',()=>{
    const project=plan([...rect('outer',0,0,20,10),wall('partition',10,0,10,10)]);
    const before=JSON.stringify(project);
    const out=analyzeConnectedRooms(project);
    expect(out.status).toBe('ready');
    expect(out.rooms.map(r=>r.area).sort((a,b)=>a-b)).toEqual([100,100]);
    expect(out.sharedSegments).toBe(1);
    expect(out.sharedWallIds).toContain('partition');
    expect(out.normalizedSegments).toBe(7);
    expect(JSON.stringify(project)).toBe(before);
  });
  it('recognizes native sample T-junctions without rewriting saved geometry',()=>{
    const project=createSampleProject(),before=JSON.stringify(project);
    const out=analyzeConnectedRooms(project);
    expect(out.status).toBe('ready');
    expect(out.rooms.length).toBeGreaterThanOrEqual(3);
    expect(out.rooms.reduce((n,r)=>n+r.area,0)).toBeCloseTo(560);
    expect(JSON.stringify(project)).toBe(before);
  });
  it('works for disjoint closed polygons and a single rectangle',()=>{
    expect(analyzeConnectedRooms(plan(rect('a',0,0,10,8))).rooms[0].area).toBe(80);
    const out=analyzeConnectedRooms(plan([...rect('a',0,0,10,10),...rect('b',20,0,5,5)]));
    expect(out.status).toBe('ready');
    expect(out.rooms.map(r=>r.area).sort((a,b)=>a-b)).toEqual([25,100]);
    expect(out.sharedSegments).toBe(0);
  });
  it('rejects X-crossings, overlapping walls, and nested rings',()=>{
    const square=rect('a',0,0,10,10);
    const crossing=wall('cross',-1,5,11,5);
    expect(analyzeConnectedRooms(plan([...square,crossing])).status).toBe('ambiguous');
    expect(analyzeConnectedRooms(plan([...square,{...square[0],id:'duplicate'}])).rooms).toHaveLength(0);
    expect(analyzeConnectedRooms(plan([...rect('outer',0,0,20,20),...rect('inner',5,5,5,5)])).status).toBe('ambiguous');
  });
  it('never reports site total for partial/open geometry',()=>{
    const extra=wall('loose',30,0,33,0);
    const part=analyzeConnectedRooms(plan([...rect('a',0,0,10,10),extra]));
    expect(part.status).toBe('partial');
    expect(part.rooms).toHaveLength(1);
    expect(analyzeConnectedRooms(plan(rect('a',0,0,10,10).slice(0,3))).status).toBe('open');
  });
  it('rejects ambiguous spurs inside a bounded face and contains large input',()=>{
    const spur=wall('spur',5,0,5,5);
    const out=analyzeConnectedRooms(plan([...rect('a',0,0,10,10),spur]));
    expect(out.status).toBe('ambiguous');
    expect(out.rooms).toHaveLength(0);
    const many=Array.from({length:301},(_,i)=>wall('w'+i,i*2,0,i*2+1,0));
    expect(analyzeConnectedRooms(plan(many)).status).toBe('limit');
  });
  it('scales area correctly after ft-to-meter conversion',()=>{
    const project=plan([...rect('a',0,0,20,10),wall('partition',10,0,10,10)]);
    const metric=convertProjectUnits(project,'m');
    const out=analyzeConnectedRooms(metric);
    expect(out.status).toBe('ready');
    expect(out.rooms[0].area).toBeCloseTo(100*0.3048*0.3048,8);
  });
  it('tracks adjacency by exact shared subsegments, not by wall name',()=>{
    const boundary=[
      {id:'n',x1:0,y1:0,x2:20,y2:0,thickness:0.5,height:9},
      {id:'e',x1:20,y1:0,x2:20,y2:10,thickness:0.5,height:9},
      {id:'s',x1:20,y1:10,x2:0,y2:10,thickness:0.5,height:9},
      {id:'w',x1:0,y1:10,x2:0,y2:0,thickness:0.5,height:9},
      {id:'partition',x1:10,y1:0,x2:10,y2:10,thickness:0.5,height:9},
    ];
    const r=analyzeConnectedRooms(plan(boundary));
    expect(r.status).toBe('ready');
    expect(r.sharedBoundaries).toHaveLength(1);
    const shared=r.sharedBoundaries[0];
    expect(shared.wallId).toBe('partition');
    expect(shared.length).toBeCloseTo(10);
    expect(new Set([shared.zoneA,shared.zoneB]).size).toBe(2);
    const disjoint=analyzeConnectedRooms(plan([...rect('a',0,0,4,4),...rect('b',10,0,4,4)]));
    expect(disjoint.sharedBoundaries).toEqual([]);
  });

  it('leaves legacy project identifiers and dimensions unchanged',()=>{
    const p=createSampleProject(),schema=p.schemaVersion,grid=p.metadata.grid;
    analyzeConnectedRooms(p);
    expect(p.schemaVersion).toBe(schema);
    expect(p.metadata.grid).toBe(grid);
  });
});
