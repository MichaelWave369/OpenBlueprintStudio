import {describe,expect,it} from 'vitest';
import {roomAnnotationKey,updateRoomAnnotation,emptyAnnotations,serializeRoomAnnotations,parseRoomAnnotations,loadRoomAnnotations,saveRoomAnnotations,matchingAnnotations,ROOM_ANNOTATIONS_STORAGE_KEY} from './roomAnnotations.js';
import {createSampleProject,convertProjectUnits} from './model.js';
import {analyzeConnectedRooms} from './connectedRooms.js';
const first=p=>analyzeConnectedRooms(p).rooms[0];
const memory=()=>{const map=new Map();return{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)}};
describe('R7 room sidecar and stable anchors',()=>{
  it('keeps identity across vertex rotation, reversed winding, and unit conversion',()=>{
    const p=createSampleProject();
    const room=first(p), key=roomAnnotationKey(room,'ft','connected');
    expect(key).toMatch(/^connected\|/);
    expect(roomAnnotationKey({...room,vertices:[...room.vertices].reverse()},'ft','connected')).toBe(key);
    expect(roomAnnotationKey({...room,vertices:[...room.vertices.slice(1),room.vertices[0]]},'ft','connected')).toBe(key);
    const converted=convertProjectUnits(p,'m');
    const other=analyzeConnectedRooms(converted).rooms.find(r=>r.wallIds.slice().sort().join(',')===room.wallIds.slice().sort().join(','));
    expect(other).toBeTruthy();
    expect(roomAnnotationKey(other,'m','connected')).toBe(key);
    expect(roomAnnotationKey(room,'ft','strict')).not.toBe(key);
  });
  it('refuses silent label transfer after geometry changes',()=>{
    const p=createSampleProject(), original=first(p);
    const key=roomAnnotationKey(original,'ft','connected');
    const modified={...original,vertices:original.vertices.map((v,i)=>i===0?{x:v.x+0.2,y:v.y}:v)};
    expect(roomAnnotationKey(modified,'ft','connected')).not.toBe(key);
  });
  it('round-trips bounded name, use, notes and local storage without changing project JSON',()=>{
    const p=createSampleProject(), before=JSON.stringify(p);
    const key=roomAnnotationKey(first(p),'ft','connected');
    let d=updateRoomAnnotation(emptyAnnotations(),key,{name:'Office',usage:'work',notes:'Design intent only'});
    const storage=memory();
    saveRoomAnnotations(d,storage);
    expect(storage.getItem(ROOM_ANNOTATIONS_STORAGE_KEY)).toContain('Office');
    expect(loadRoomAnnotations(storage).doc).toEqual(d);
    expect(parseRoomAnnotations(serializeRoomAnnotations(d))).toEqual(d);
    expect(JSON.stringify(p)).toBe(before);
    d=updateRoomAnnotation(d,key,{name:'',usage:'unspecified',notes:''});
    expect(Object.keys(d.entries)).toHaveLength(0);
  });
  it('rejects malicious/oversized inputs and mismatched project labels',()=>{
    const key=roomAnnotationKey(first(createSampleProject()),'ft','connected');
    expect(()=>parseRoomAnnotations('{bad')).toThrow('not valid JSON');
    expect(()=>parseRoomAnnotations(JSON.stringify({schemaVersion:'future',entries:{}}))).toThrow('Unsupported');
    expect(()=>updateRoomAnnotation(emptyAnnotations(),key,{name:'x'.repeat(81)})).toThrow('80 characters');
    expect(()=>updateRoomAnnotation(emptyAnnotations(),key,{usage:'certified-bedroom'})).toThrow('category');
    expect(()=>updateRoomAnnotation(emptyAnnotations(),key,{notes:'A'.repeat(501)})).toThrow('500 characters');
    expect(()=>updateRoomAnnotation(emptyAnnotations(),'__proto__',{name:'evil'})).toThrow('anchor');
    const d=updateRoomAnnotation(emptyAnnotations(),key,{name:'Bedroom'});
    expect(Object.keys(matchingAnnotations(d,['not-a-face']).entries)).toHaveLength(0);
    const storage=memory();
    storage.setItem(ROOM_ANNOTATIONS_STORAGE_KEY,'{broken');
    expect(loadRoomAnnotations(storage).error).toMatch(/not loaded/);
  });
});
