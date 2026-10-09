/**
 * R5 conservative topology gate. This is NOT a BIM face-finder.
 * Only isolated, simple, non-nested centerline loops can produce area estimates.
 * A crossing, T-junction, overlapping segment, or nested loop refuses area.
 */
const EPS = 1e-6;
const MAX_WALLS = 300;
const point = (x, y) => ({ x, y });
const keyOf = (p) => `${Math.round(p.x / EPS)},${Math.round(p.y / EPS)}`;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const cross = (a, b, p) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
const near = (a, b) => distance(a, b) <= EPS;

function onSegment(p, a, b) {
  const len = distance(a, b);
  if (!len || Math.abs(cross(a, b, p)) > EPS * len) return false;
  return p.x >= Math.min(a.x, b.x) - EPS && p.x <= Math.max(a.x, b.x) + EPS
    && p.y >= Math.min(a.y, b.y) - EPS && p.y <= Math.max(a.y, b.y) + EPS;
}
function endpointOf(p, seg) { return near(p, seg.a) || near(p, seg.b); }

/** Any contact must be a shared endpoint of both walls; collinear overlap is always ambiguous. */
function conflictingContact(a, b) {
  const collinear = Math.abs(cross(a.a, a.b, b.a)) <= EPS * distance(a.a, a.b)
    && Math.abs(cross(a.a, a.b, b.b)) <= EPS * distance(a.a, a.b);
  if (collinear) {
    const axis = Math.abs(a.a.x - a.b.x) >= Math.abs(a.a.y - a.b.y) ? 'x' : 'y';
    const overlap = Math.min(Math.max(a.a[axis], a.b[axis]), Math.max(b.a[axis], b.b[axis]))
      - Math.max(Math.min(a.a[axis], a.b[axis]), Math.min(b.a[axis], b.b[axis]));
    if (overlap > EPS) return true;
  }
  for (const p of [a.a, a.b]) {
    if (onSegment(p, b.a, b.b) && !endpointOf(p, b)) return true;
  }
  for (const p of [b.a, b.b]) {
    if (onSegment(p, a.a, a.b) && !endpointOf(p, a)) return true;
  }
  // Proper crossing with neither segment endpoint on the other.
  const orient = (p, s) => cross(s.a, s.b, p) / distance(s.a, s.b);
  const s1 = orient(a.a, b), s2 = orient(a.b, b);
  const t1 = orient(b.a, a), t2 = orient(b.b, a);
  return s1 * s2 < -(EPS * EPS) && t1 * t2 < -(EPS * EPS);
}
function polygonMetrics(vertices) {
  let twiceArea = 0, centroidX = 0, centroidY = 0, perimeter = 0;
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i], b = vertices[(i + 1) % vertices.length];
    const v = a.x * b.y - b.x * a.y;
    twiceArea += v;
    centroidX += (a.x + b.x) * v;
    centroidY += (a.y + b.y) * v;
    perimeter += distance(a, b);
  }
  if (Math.abs(twiceArea) < EPS) return null;
  return {
    area: Math.abs(twiceArea / 2), perimeter,
    centroid: point(centroidX / (3 * twiceArea), centroidY / (3 * twiceArea)),
  };
}
function insidePolygon(p, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if (onSegment(p, a, b)) return true; // touching loops are ambiguous
    if ((a.y > p.y) !== (b.y > p.y) &&
      p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
const result = (status, rooms, warnings, analyzedWalls) => ({ status, rooms, warnings, analyzedWalls });

export function analyzeRooms(project) {
  const walls = project?.walls || [];
  if (!walls.length) return result('empty', [], ['Draw an isolated closed loop of walls to inspect its centerline area.'], 0);
  if (walls.length > MAX_WALLS) return result('limit', [], [`Area analysis limited to ${MAX_WALLS} walls per plan; nothing inferred.`], walls.length);
  const segments = walls.map((wall) => ({
    id: wall.id, a: point(wall.x1, wall.y1), b: point(wall.x2, wall.y2),
  }));
  // The geometry is validated by the core model on imports, but remain defensive in analysis.
  if (segments.some(s => ![s.a.x, s.a.y, s.b.x, s.b.y].every(Number.isFinite) || distance(s.a, s.b) < EPS)) {
    return result('ambiguous', [], ['Invalid or degenerate segment: centerline area withheld.'], walls.length);
  }
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      if (conflictingContact(segments[i], segments[j])) {
        return result('ambiguous', [], ['Walls intersect, overlap, or form a T-junction without shared endpoints. Split/join these walls explicitly before area analysis.'], walls.length);
      }
    }
  }
  const adjacency = new Map(), coordinates = new Map();
  for (let i = 0; i < segments.length; i++) {
    for (const p of [segments[i].a, segments[i].b]) {
      const key = keyOf(p);
      if (!adjacency.has(key)) { adjacency.set(key, []); coordinates.set(key, p); }
      adjacency.get(key).push(i);
    }
  }
  const visited = new Set(), rooms = [];
  let unresolved = 0;
  for (let i = 0; i < segments.length; i++) {
    if (visited.has(i)) continue;
    const stack = [i], component = [], vertices = new Set();
    while (stack.length) {
      const current = stack.pop();
      if (visited.has(current)) continue;
      visited.add(current); component.push(current);
      for (const v of [keyOf(segments[current].a), keyOf(segments[current].b)]) {
        vertices.add(v);
        for (const neighboring of adjacency.get(v)) if (!visited.has(neighboring)) stack.push(neighboring);
      }
    }
    if (component.length < 3 || [...vertices].some(v => adjacency.get(v).length !== 2)) {
      unresolved += component.length;
      continue;
    }
    const start = keyOf(segments[component[0]].a);
    let vertex = start, previousEdge = -1;
    const loop = [], ids = [], used = new Set();
    do {
      if (loop.length > component.length) break;
      loop.push(coordinates.get(vertex));
      const nextEdge = adjacency.get(vertex).find(e => e !== previousEdge);
      if (nextEdge === undefined || used.has(nextEdge)) break;
      used.add(nextEdge); ids.push(segments[nextEdge].id);
      const seg = segments[nextEdge];
      vertex = keyOf(seg.a) === vertex ? keyOf(seg.b) : keyOf(seg.a);
      previousEdge = nextEdge;
    } while (vertex !== start);
    if (vertex !== start || used.size !== component.length || loop.length < 3) {
      return result('ambiguous', [], ['Closed-loop traversal was inconsistent. Area withheld.'], walls.length);
    }
    const metrics = polygonMetrics(loop);
    if (!metrics) return result('ambiguous', [], ['A candidate loop has near-zero enclosed area. Area withheld.'], walls.length);
    rooms.push({ id: `loop-${rooms.length + 1}`, wallIds: ids, vertices: loop, ...metrics });
  }
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      if (insidePolygon(rooms[i].vertices[0], rooms[j].vertices)
        || insidePolygon(rooms[j].vertices[0], rooms[i].vertices)) {
        return result('ambiguous', [], ['Nested or touching closed loops could represent holes, partitions, or duplicate boundaries. Area withheld.'], walls.length);
      }
    }
  }
  if (!rooms.length) return result('open', [], ['No isolated, fully closed wall loops. Open ends or shared junctions prevent an area claim.'], walls.length);
  if (unresolved) return result('partial', rooms, [`${unresolved} wall segment(s) are outside recognized closed loops; listed areas are partial, not a site total.`], walls.length);
  return result('ready', rooms, ['Concept-only centerline area, not net usable floor area, wall-thickness-adjusted area, or certified measurements.'], walls.length);
}
