import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadRuntimeConfig } from '../defaultData';

describe('bundled runtime configuration', () => {
  afterEach(() => vi.restoreAllMocks());

  it('loads the shared static configuration without requesting a config API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('config API must not be called'));

    const result = await loadRuntimeConfig();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.snapshot.source).toBe('static');
    expect(result.snapshot.manifest.diagnosisVersion).toBe('1.0.0');
    expect(result.candidates.length).toBeGreaterThanOrEqual(9);
  });
});
