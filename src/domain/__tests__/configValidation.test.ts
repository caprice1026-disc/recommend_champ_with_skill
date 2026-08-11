import { describe, expect, it } from 'vitest';
import { assertConfigInvariants } from '../../../scripts/config-invariants';

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
});
