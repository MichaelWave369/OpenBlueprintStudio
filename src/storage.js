import { STORAGE_KEY, parseProjectJson, serializeProject } from './model.js';

export function loadStoredProject(storage = globalThis.localStorage) {
  if (!storage) return { project: null, error: null };
  const text = storage.getItem(STORAGE_KEY);
  if (!text) return { project: null, error: null };
  try {
    return { project: parseProjectJson(text), error: null };
  } catch (error) {
    return { project: null, error: error instanceof Error ? error.message : 'Stored project could not be read.' };
  }
}

export function saveStoredProject(project, storage = globalThis.localStorage) {
  if (!storage) throw new Error('Browser storage is unavailable.');
  storage.setItem(STORAGE_KEY, serializeProject(project));
}
