export const SCHEMA_VERSION = 'openblueprint.project/1';
export const STORAGE_KEY = 'openblueprint-studio/project-v1';
export const SYMBOL_TYPES = ['door', 'window', 'outlet', 'network'];
export const UNIT_OPTIONS = ['ft', 'm'];

const MAX_ELEMENTS = 2000;
const MAX_COORDINATE = 10000;

export function makeId(prefix = 'item') {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function snap(value, step = 1) {
  if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) return 0;
  return Math.round(value / step) * step;
}

export function wallGeometry(wall) {
  const dx = wall.x2 - wall.x1;
  const dy = wall.y2 - wall.y1;
  return {
    dx,
    dy,
    length: Math.hypot(dx, dy),
    angle: Math.atan2(dy, dx),
    midX: (wall.x1 + wall.x2) / 2,
    midY: (wall.y1 + wall.y2) / 2,
  };
}

export function createWall(start, end, overrides = {}) {
  return {
    id: makeId('wall'),
    x1: start.x,
    y1: start.y,
    x2: end.x,
    y2: end.y,
    thickness: 0.5,
    height: 9,
    ...overrides,
  };
}

export function createSymbol(type, point, overrides = {}) {
  return {
    id: makeId(type),
    type,
    x: point.x,
    y: point.y,
    rotation: 0,
    ...overrides,
  };
}

export function createEmptyProject() {
  return {
    schemaVersion: SCHEMA_VERSION,
    metadata: {
      title: 'Untitled plan',
      units: 'ft',
      grid: 1,
      updatedAt: new Date().toISOString(),
    },
    walls: [],
    symbols: [],
  };
}

export function createSampleProject() {
  const wall = (id, x1, y1, x2, y2, thickness = 0.5, height = 9) => ({
    id,
    x1,
    y1,
    x2,
    y2,
    thickness,
    height,
  });
  return {
    schemaVersion: SCHEMA_VERSION,
    metadata: {
      title: 'Field House — concept plan',
      units: 'ft',
      grid: 1,
      updatedAt: new Date().toISOString(),
    },
    walls: [
      wall('wall-north', 3, 3, 31, 3),
      wall('wall-east', 31, 3, 31, 23),
      wall('wall-south', 31, 23, 3, 23),
      wall('wall-west', 3, 23, 3, 3),
      wall('wall-hall', 17, 3, 17, 16),
      wall('wall-room', 17, 16, 31, 16),
      wall('wall-utility', 3, 16, 11, 16),
      wall('wall-utility-side', 11, 16, 11, 23),
    ],
    symbols: [
      { id: 'door-entry', type: 'door', x: 10, y: 23, rotation: 0 },
      { id: 'window-west', type: 'window', x: 3, y: 9, rotation: 90 },
      { id: 'window-east', type: 'window', x: 31, y: 9, rotation: 90 },
      { id: 'outlet-main', type: 'outlet', x: 8, y: 13, rotation: 0 },
      { id: 'network-main', type: 'network', x: 20, y: 20, rotation: 0 },
    ],
  };
}

function finiteNumber(value, field, min = -MAX_COORDINATE, max = MAX_COORDINATE) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${field} must be a finite number between ${min} and ${max}.`);
  }
  return value;
}

function cleanText(value, field, maxLength = 160) {
  if (typeof value !== 'string') throw new Error(`${field} must be text.`);
  return value.slice(0, maxLength);
}

function validateWall(raw, index) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error(`Wall ${index} must be an object.`);
  const wall = {
    id: cleanText(raw.id, `Wall ${index} id`, 120),
    x1: finiteNumber(raw.x1, `Wall ${index} x1`),
    y1: finiteNumber(raw.y1, `Wall ${index} y1`),
    x2: finiteNumber(raw.x2, `Wall ${index} x2`),
    y2: finiteNumber(raw.y2, `Wall ${index} y2`),
    thickness: finiteNumber(raw.thickness, `Wall ${index} thickness`, 0.1, 10),
    height: finiteNumber(raw.height, `Wall ${index} height`, 0.5, 100),
  };
  if (wallGeometry(wall).length < 0.1) throw new Error(`Wall ${index} is too short.`);
  return wall;
}

function validateSymbol(raw, index) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error(`Symbol ${index} must be an object.`);
  if (!SYMBOL_TYPES.includes(raw.type)) throw new Error(`Symbol ${index} has an unsupported type.`);
  return {
    id: cleanText(raw.id, `Symbol ${index} id`, 120),
    type: raw.type,
    x: finiteNumber(raw.x, `Symbol ${index} x`),
    y: finiteNumber(raw.y, `Symbol ${index} y`),
    rotation: finiteNumber(raw.rotation ?? 0, `Symbol ${index} rotation`, -36000, 36000),
  };
}

export function validateProject(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Project must be an object.');
  if (raw.schemaVersion !== SCHEMA_VERSION) throw new Error(`Unsupported project schema: ${String(raw.schemaVersion)}.`);
  if (!raw.metadata || typeof raw.metadata !== 'object') throw new Error('Project metadata is required.');
  if (!Array.isArray(raw.walls) || !Array.isArray(raw.symbols)) throw new Error('Walls and symbols must be arrays.');
  if (raw.walls.length > MAX_ELEMENTS || raw.symbols.length > MAX_ELEMENTS) throw new Error('Project exceeds the v0.1 element limit.');

  const units = raw.metadata.units;
  if (!UNIT_OPTIONS.includes(units)) throw new Error('Project units must be ft or m.');

  const project = {
    schemaVersion: SCHEMA_VERSION,
    metadata: {
      title: cleanText(raw.metadata.title, 'Project title'),
      units,
      grid: finiteNumber(raw.metadata.grid, 'Grid size', 0.01, 100),
      updatedAt: typeof raw.metadata.updatedAt === 'string' ? raw.metadata.updatedAt.slice(0, 60) : new Date().toISOString(),
    },
    walls: raw.walls.map(validateWall),
    symbols: raw.symbols.map(validateSymbol),
  };

  const ids = [...project.walls, ...project.symbols].map((item) => item.id);
  if (new Set(ids).size !== ids.length) throw new Error('Element IDs must be unique.');
  return project;
}

export function parseProjectJson(text) {
  if (typeof text !== 'string' || text.length > 5_000_000) throw new Error('Project file is missing or too large.');
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('Project file is not valid JSON.');
  }
  return validateProject(raw);
}

export function serializeProject(project) {
  return JSON.stringify(validateProject(project), null, 2);
}

export function touchProject(project, changes = {}) {
  return {
    ...project,
    ...changes,
    metadata: {
      ...project.metadata,
      ...(changes.metadata || {}),
      updatedAt: new Date().toISOString(),
    },
  };
}

export function addWall(project, wall) {
  return touchProject(project, { walls: [...project.walls, validateWall(wall, project.walls.length)] });
}

export function addSymbol(project, symbol) {
  return touchProject(project, { symbols: [...project.symbols, validateSymbol(symbol, project.symbols.length)] });
}

export function updateElement(project, id, patch) {
  const wallIndex = project.walls.findIndex((item) => item.id === id);
  if (wallIndex >= 0) {
    const walls = project.walls.slice();
    walls[wallIndex] = validateWall({ ...walls[wallIndex], ...patch }, wallIndex);
    return touchProject(project, { walls });
  }
  const symbolIndex = project.symbols.findIndex((item) => item.id === id);
  if (symbolIndex >= 0) {
    const symbols = project.symbols.slice();
    symbols[symbolIndex] = validateSymbol({ ...symbols[symbolIndex], ...patch }, symbolIndex);
    return touchProject(project, { symbols });
  }
  return project;
}

export function deleteElement(project, id) {
  const walls = project.walls.filter((item) => item.id !== id);
  const symbols = project.symbols.filter((item) => item.id !== id);
  if (walls.length === project.walls.length && symbols.length === project.symbols.length) return project;
  return touchProject(project, { walls, symbols });
}

export function findElement(project, id) {
  return project.walls.find((item) => item.id === id) || project.symbols.find((item) => item.id === id) || null;
}
