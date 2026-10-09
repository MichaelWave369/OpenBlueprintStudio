import { validateProject } from './model.js';

export const EVIE_PROPOSAL_SCHEMA = 'openblueprint.evie-proposal/1';
export const MAX_EVIE_PROPOSAL_BYTES = 5_000_000;
const MAX_REVIEW_ELEMENTS = 400;

function label(value, field) {
  if (typeof value !== 'string' || !value.trim() || value.length > 120 || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new Error(field + ' must be nonempty text of at most 120 characters.');
  }
  return value.trim();
}

/** Parse an untrusted, transport-only proposal. No code execution or project mutation. */
export function parseEvieProposal(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_EVIE_PROPOSAL_BYTES) {
    throw new Error('EVIE proposal must be JSON no larger than 5 MB.');
  }
  let envelope;
  try { envelope = JSON.parse(text); }
  catch { throw new Error('EVIE proposal contains invalid JSON.'); }
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
    throw new Error('EVIE proposal must be a JSON object.');
  }
  if (envelope.schemaVersion !== EVIE_PROPOSAL_SCHEMA) throw new Error('Unsupported EVIE proposal schema.');
  if (!envelope.source || typeof envelope.source !== 'object' || Array.isArray(envelope.source) || envelope.source.system !== 'EVIE') {
    throw new Error('EVIE proposal must declare an EVIE source.');
  }
  const source = {
    system: 'EVIE',
    cardId: label(envelope.source.cardId, 'Source card ID'),
    runId: label(envelope.source.runId, 'Source run ID'),
    mode: envelope.source.mode,
  };
  if (!['fixture', 'generated'].includes(source.mode)) throw new Error('Source mode must be fixture or generated.');
  const project = validateProject(envelope.project);
  if (project.walls.length + project.symbols.length > MAX_REVIEW_ELEMENTS) {
    throw new Error('Proposal exceeds the 400-element preview limit.');
  }
  return { schemaVersion: EVIE_PROPOSAL_SCHEMA, source, project };
}
