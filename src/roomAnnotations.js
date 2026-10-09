/**
 * Separate local-only R7 room semantics. Nothing is written into blueprint or EVIE JSON.
 * Face keys include the original wall IDs and the cyclic geometry converted to SI units.
 * A topology edit changes the key rather than attaching a label to a different zone.
 */
export const ROOM_ANNOTATIONS_SCHEMA = 'openblue.room-annotations/1';
export const ROOM_ANNOTATIONS_STORAGE_KEY = 'openblue/room-annotations-v1';
export const ROOM_USES = Object.freeze(['unspecified','living','sleeping','kitchen','bath','work','utility','storage','circulation','other']);
const MAX_TEXT_BYTES = 350000;
const MAX_ENTRIES = 300;
const MAX_KEY = 12000;

export const emptyAnnotations = () => ({ schemaVersion:ROOM_ANNOTATIONS_SCHEMA, entries:{} });
const segment = (value, units) => {
  if (!Number.isFinite(value)) throw new Error('Room boundary is not finite.');
  const meters = units === 'ft' ? value * 0.3048 : value;
  return String(Math.round(meters * 100000));
};
const canonicalCycle = tokens => {
  const variants = [];
  for(const seq of [tokens, [...tokens].reverse()]) {
    for(let i=0;i<seq.length;i++) variants.push([...seq.slice(i),...seq.slice(0,i)].join(';'));
  }
  variants.sort();
  return variants[0];
};
export function roomAnnotationKey(room, units, mode) {
  if(!room || !Array.isArray(room.vertices) || room.vertices.length<3) return null;
  if(!['ft','m'].includes(units) || !['connected','strict'].includes(mode)) return null;
  try {
    const vertices = room.vertices.map(v=>segment(v.x,units)+','+segment(v.y,units));
    const ids = [...new Set(room.wallIds || [])].sort().map(id=>JSON.stringify(id)).join(',');
    const key = mode+'|'+ids+'|'+canonicalCycle(vertices);
    return key.length<=MAX_KEY ? key : null;
  } catch { return null; }
}
function validatedEntry(entry) {
  if(!entry || typeof entry!=='object' || Array.isArray(entry)) throw new Error('Room annotation must be an object.');
  const { name, usage, notes } = entry;
  if(typeof name!=='string' || name.length>80 || /[\u0000-\u001f\u007f]/.test(name)) throw new Error('Room name must be plain text up to 80 characters.');
  if(!ROOM_USES.includes(usage)) throw new Error('Unknown room planned-use category.');
  if(typeof notes!=='string' || notes.length>500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(notes)) throw new Error('Room notes must be text up to 500 characters.');
  return {name,usage,notes};
}
const isBlank=entry=>!entry.name.trim() && entry.usage==='unspecified' && !entry.notes.trim();
export function parseRoomAnnotations(text) {
  if(typeof text!=='string' || new TextEncoder().encode(text).length>MAX_TEXT_BYTES) throw new Error('Annotations JSON must be under 350 KB.');
  let parsed;
  try { parsed=JSON.parse(text); } catch { throw new Error('Annotations file is not valid JSON.'); }
  if(!parsed || typeof parsed!=='object' || Array.isArray(parsed) || parsed.schemaVersion!==ROOM_ANNOTATIONS_SCHEMA) throw new Error('Unsupported room annotation schema.');
  if(!parsed.entries || typeof parsed.entries!=='object' || Array.isArray(parsed.entries)) throw new Error('Annotations entries must be a keyed object.');
  const entries = Object.entries(parsed.entries);
  if(entries.length>MAX_ENTRIES) throw new Error('Too many room annotations.');
  const clean={};
  for(const [key,entry] of entries) {
    if(!/^(connected|strict)\|/.test(key) || key.length>MAX_KEY) throw new Error('Unrecognized or oversized room anchor.');
    const item=validatedEntry(entry);
    if(!isBlank(item)) clean[key]=item;
  }
  return {schemaVersion:ROOM_ANNOTATIONS_SCHEMA,entries:clean};
}
export const serializeRoomAnnotations = doc => JSON.stringify(parseRoomAnnotations(JSON.stringify(doc)),null,2);
export function updateRoomAnnotation(doc, key, patch) {
  if(typeof key!=='string' || !/^(connected|strict)\|/.test(key) || key.length>MAX_KEY) throw new Error('Invalid room anchor.');
  const current=doc.entries[key] || {name:'',usage:'unspecified',notes:''};
  const next=validatedEntry({...current,...patch});
  const entries={...doc.entries};
  if(isBlank(next)) delete entries[key]; else entries[key]=next;
  return parseRoomAnnotations(JSON.stringify({schemaVersion:ROOM_ANNOTATIONS_SCHEMA, entries}));
}
export function matchingAnnotations(doc, keys) {
  const allowed=new Set(keys.filter(Boolean));
  return {schemaVersion:ROOM_ANNOTATIONS_SCHEMA,
    entries:Object.fromEntries(Object.entries(doc.entries).filter(([k])=>allowed.has(k)))};
}
export function loadRoomAnnotations(storage=globalThis.localStorage) {
  if(!storage) return {doc:emptyAnnotations(),error:'Browser storage unavailable.'};
  let text;
  try { text=storage.getItem(ROOM_ANNOTATIONS_STORAGE_KEY); } catch { return {doc:emptyAnnotations(),error:'Could not read room annotations from browser storage.'}; }
  if(!text) return {doc:emptyAnnotations(),error:null};
  try { return {doc:parseRoomAnnotations(text),error:null}; }
  catch(error){ return {doc:emptyAnnotations(),error:'Stored room annotations were not loaded: '+error.message}; }
}
export function saveRoomAnnotations(doc,storage=globalThis.localStorage) {
  if(!storage) throw new Error('Browser storage unavailable for room notes.');
  storage.setItem(ROOM_ANNOTATIONS_STORAGE_KEY,serializeRoomAnnotations(doc));
}
