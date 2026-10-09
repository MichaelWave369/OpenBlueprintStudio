import { describe, expect, it } from 'vitest';
import { STORAGE_KEY, createSampleProject } from './model.js';
import { loadStoredProject, saveStoredProject } from './storage.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe('local persistence adapter', () => {
  it('saves and restores a valid project', () => {
    const storage = memoryStorage();
    const sample = createSampleProject();
    saveStoredProject(sample, storage);
    expect(loadStoredProject(storage)).toEqual({ project: sample, error: null });
  });

  it('contains corrupt saved content and does not return a project', () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, '{not-json');
    const result = loadStoredProject(storage);
    expect(result.project).toBeNull();
    expect(result.error).toMatch(/not valid JSON/);
  });
});
