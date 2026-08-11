import { describe, expect, it } from 'vitest';
import { assertConfigInvariants, assertManifestConsistency } from '../../../scripts/config-invariants';

function validBundle() {
  return {
    championCatalog: {
      metadata: [{ championId: 'ahri', iconUrl: 'https://example.test/ahri.png', wikiUrl: 'https://example.test/ahri', difficultyNote: '中難度' }],
      profiles: [{ championId: 'ahri', lane: 'MID', iconUrl: 'https://example.test/ahri.png', wikiUrl: 'https://example.test/ahri' }],
    },
  };
}

describe('static configuration invariants', () => {
  it('rejects duplicate champion and lane entries', () => {
    const bundle = validBundle();
    bundle.championCatalog.profiles.push({ ...bundle.championCatalog.profiles[0] });

    expect(assertConfigInvariants(bundle)).toContain('duplicate champion-lane: ahri/MID');
  });

  it('rejects catalog entries without icon and wiki metadata', () => {
    const bundle = validBundle();
    bundle.championCatalog.profiles[0].iconUrl = '';

    expect(assertConfigInvariants(bundle)).toContain('missing metadata: ahri');
  });

  it('accepts unique catalog entries with complete metadata', () => {
    expect(assertConfigInvariants(validBundle())).toEqual([]);
  });

  it('rejects a configuration version that disagrees with the manifest', () => {
    const errors = assertManifestConsistency(
      {
        testDefinitionVersion: '1.0.0',
        championProfileVersion: '1.1.0',
        recommendationConfigVersion: '1.0.0',
        files: ['test_definitions.json', 'champion_catalog.json', 'recommendation_categories.json'],
      },
      {
        'test_definitions.json': { schemaVersion: '0.9.0' },
        'champion_catalog.json': { schemaVersion: '1.1.0' },
        'recommendation_categories.json': { schemaVersion: '1.0.0' },
      },
    );

    expect(errors).toContain('version mismatch: test_definitions.json expected 1.0.0 but found 0.9.0');
  });

  it('rejects a config file missing from the manifest file list', () => {
    expect(assertManifestConsistency(
      { testDefinitionVersion: '1.0.0', files: [] },
      { 'test_definitions.json': { schemaVersion: '1.0.0' } },
    )).toContain('manifest missing file: test_definitions.json');
  });
});
