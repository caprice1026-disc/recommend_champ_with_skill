import { describe, expect, it, vi } from 'vitest';
import { verifyRiotId } from '../riotVerification';

describe('Riot verification client', () => {
  it('returns only the public Riot context from a successful response', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      verified: true,
      platformRegion: 'asia',
      fetchedAt: '2026-08-12T00:00:00.000Z',
      puuid: 'private-puuid',
    }), { status: 200, headers: { 'content-type': 'application/json' } }));

    const result = await verifyRiotId({ gameName: 'Hodaka', tagLine: 'JP1', platformRegion: 'asia' }, fetcher);

    expect(result).toEqual({ verified: true, platformRegion: 'asia', fetchedAt: '2026-08-12T00:00:00.000Z' });
    expect(result).not.toHaveProperty('puuid');
    expect(fetcher).toHaveBeenCalledWith('/api/riot/verify', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ gameName: 'Hodaka', tagLine: 'JP1', platformRegion: 'asia', consentToRiot: true }),
    }));
  });

  it('surfaces the Worker error code and message when verification fails', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ error: { code: 'RIOT_NOT_CONFIGURED', message: 'Riot API確認は現在利用できません' } }), { status: 503 }));

    await expect(verifyRiotId({ gameName: 'Hodaka', tagLine: 'JP1', platformRegion: 'asia' }, fetcher)).rejects.toMatchObject({
      code: 'RIOT_NOT_CONFIGURED',
      message: 'Riot API確認は現在利用できません',
    });
  });
});
