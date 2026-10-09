import { describe, expect, it } from 'vitest';
import { analyzeRooms } from './roomAnalysis.js';
import { createEmptyProject, createSampleProject, convertProjectUnits } from './model.js';
const rect = (prefix, x, y, w, h) => [
  [x,y,x+w,y],[x+w,y,x+w,y+h],[x+w,y+h,x,y+h],[x,y+h,x,y]
].map(([x1,y1,x2,y2], i) => ({ id: prefix + i, x1,y1,x2,y2,thickness:0.5,height:9 }));
const plan = (walls) => ({ ...createEmptyProject(), walls });
describe('bounded concept area analysis', () => {
  it('detects a closed rectangular centerline loop', () => {
    const original = plan(rect('a',0,0,10,8));
    const result = analyzeRooms(original);
    expect(result.status).toBe('ready');
    expect(result.rooms).toHaveLength(1);
    expect(result.rooms[0].area).toBeCloseTo(80);
    expect(result.rooms[0].perimeter).toBeCloseTo(36);
    expect(result.rooms[0].centroid).toEqual({x:5,y:4});
    expect(original.walls).toHaveLength(4);
  });
  it('reports independent disjoint rooms and partial geometry honestly', () => {
    const two = rect('a',0,0,10,10).concat(rect('b',15,0,5,5));
    expect(analyzeRooms(plan(two)).rooms.map(r => r.area)).toEqual([100,25]);
    const extra = {id:'dangling',x1:25,y1:0,x2:29,y2:0,thickness:0.5,height:9};
    const partial = analyzeRooms(plan([...two,extra]));
    expect(partial.status).toBe('partial');
    expect(partial.rooms).toHaveLength(2);
  });
  it('never invents area for open, crossed, T-junction, overlapped or nested loops', () => {
    expect(analyzeRooms(plan(rect('a',0,0,10,10).slice(0,3))).status).toBe('open');
    const diagonal = {id:'d',x1:-1,y1:5,x2:11,y2:5,thickness:0.5,height:9};
    expect(analyzeRooms(plan([...rect('a',0,0,10,10),diagonal])).status).toBe('ambiguous');
    const tee = {id:'t',x1:5,y1:0,x2:5,y2:4,thickness:0.5,height:9};
    expect(analyzeRooms(plan([...rect('a',0,0,10,10),tee])).status).toBe('ambiguous');
    expect(analyzeRooms(plan([...rect('a',0,0,10,10),{...rect('a',0,0,10,10)[0],id:'duplicate'}])).status).toBe('ambiguous');
    expect(analyzeRooms(plan([...rect('outer',0,0,12,12),...rect('inner',3,3,3,3)])).status).toBe('ambiguous');
    expect(analyzeRooms(createSampleProject()).status).toBe('ambiguous');
  });
  it('rejects wall-count overflow and handles empty plans', () => {
    expect(analyzeRooms(createEmptyProject()).status).toBe('empty');
    const base = rect('a',0,0,2,2)[0];
    const tooMany = Array.from({length:301},(_,i)=>({...base,id:'w'+i,x1:i*3,x2:i*3+2}));
    expect(analyzeRooms(plan(tooMany)).status).toBe('limit');
  });
  it('scales area by the square of unit conversion when within v1 geometry limits', () => {
    const original = plan(rect('a',0,0,10,8));
    const converted = convertProjectUnits(original,'m');
    const area = analyzeRooms(converted);
    expect(area.status).toBe('ready');
    expect(area.rooms[0].area).toBeCloseTo(80*0.3048**2,8);
  });
});
