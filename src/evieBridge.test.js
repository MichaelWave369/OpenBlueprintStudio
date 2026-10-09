import { describe, expect, it } from 'vitest';
import { parseEvieProposal, EVIE_PROPOSAL_SCHEMA, MAX_EVIE_PROPOSAL_BYTES } from './evieBridge.js';
import { createSampleProject } from './model.js';

const make = (patch = {}) => ({
  schemaVersion: EVIE_PROPOSAL_SCHEMA,
  source: { system: 'EVIE', cardId: 'test.floor_plan', runId: 'run-1', mode: 'fixture' },
  project: createSampleProject(),
  ...patch,
});
const parse = (data) => parseEvieProposal(JSON.stringify(data));

describe('EVIE CAD proposal parser', () => {
  it('normalizes a proposal without mutating the input', () => {
    const incoming = make();
    const result = parse(incoming);
    expect(result.project.walls).toHaveLength(8);
    expect(result.project).not.toBe(incoming.project);
    expect(incoming.project.walls).toHaveLength(8);
  });
  it('rejects malformed and unsafe envelopes', () => {
    expect(() => parseEvieProposal('bad')).toThrow('invalid JSON');
    expect(() => parseEvieProposal(' '.repeat(MAX_EVIE_PROPOSAL_BYTES + 1))).toThrow('5 MB');
    expect(() => parse(make({ schemaVersion: 'other/1' }))).toThrow('Unsupported');
    expect(() => parse(make({ source: { system: 'other', cardId: 'x', runId: 'y', mode: 'fixture' } }))).toThrow('EVIE source');
    expect(() => parse(make({ source: { system: 'EVIE', cardId: '', runId: 'y', mode: 'fixture' } }))).toThrow('card ID');
    expect(() => parse(make({ source: { system: 'EVIE', cardId: 'x', runId: 'y', mode: 'unknown' } }))).toThrow('Source mode');
  });
  it('rejects invalid geometry, duplicate IDs, and excessive complexity', () => {
    const p = createSampleProject();
    expect(() => parse(make({ project: { ...p, metadata: { ...p.metadata, units: 'in' } } }))).toThrow('ft or m');
    expect(() => parse(make({ project: { ...p, symbols: [{ ...p.symbols[0], id: p.walls[0].id }] } }))).toThrow('unique');
    expect(() => parse(make({ project: { ...p, walls: Array.from({ length: 401 }, (_, i) => ({ ...p.walls[0], id: 'w' + i })) } }))).toThrow('400-element');
  });
  it('strips unknown project properties instead of accepting arbitrary state', () => {
    const p = createSampleProject();
    const result = parse(make({ project: { ...p, admin: true, walls: [{ ...p.walls[0], arbitrary: 'no' }] } }));
    expect(result.project.admin).toBeUndefined();
    expect(result.project.walls[0].arbitrary).toBeUndefined();
  });
});
