import { findRiotAccount, getRiotProfileCache, upsertRiotAccount, upsertRiotProfileCache } from '../repositories/d1';
import type { D1DatabaseLike, WorkerEnv } from '../types';

const ACCOUNT_HOSTS = {
  americas: 'americas.api.riotgames.com',
  asia: 'asia.api.riotgames.com',
  europe: 'europe.api.riotgames.com',
  sea: 'sea.api.riotgames.com',
} as const;

const ACCOUNT_CACHE_KEY = 'riot-account-verification';
const ACCOUNT_CACHE_TTL_MS = 60 * 60 * 1000;

export class RiotUpstreamError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'RiotUpstreamError';
  }
}

export async function verifyRiotId(input: { gameName: string; tagLine: string; platformRegion: keyof typeof ACCOUNT_HOSTS }, env: WorkerEnv, db: D1DatabaseLike): Promise<{ verified: true; platformRegion: string; fetchedAt: string }> {
  const existing = await findRiotAccount(db, input);
  if (existing) {
    const cached = await getRiotProfileCache(db, existing.puuid, ACCOUNT_CACHE_KEY);
    if (cached) {
      try {
        const payload = JSON.parse(cached.payload) as { platformRegion?: unknown };
        if (payload.platformRegion === input.platformRegion) return { verified: true, platformRegion: input.platformRegion, fetchedAt: cached.fetched_at };
      } catch {
        // Treat malformed cache data as a miss and refresh it from Riot.
      }
    }
  }
  if (!env.RIOT_API_KEY) throw new RiotUpstreamError(503, 'Riot API確認は現在利用できません');
  const host = ACCOUNT_HOSTS[input.platformRegion];
  const endpoint = `https://${host}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(input.gameName)}/${encodeURIComponent(input.tagLine)}`;
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${env.RIOT_API_KEY}` } });
  if (!response.ok) {
    const status = response.status === 429 ? 429 : response.status === 404 ? 404 : 502;
    throw new RiotUpstreamError(status, status === 404 ? 'Riot IDが見つかりません' : status === 429 ? 'Riot APIの利用制限に達しました' : 'Riot APIに接続できません');
  }
  const account = await response.json() as { puuid?: unknown; gameName?: unknown; tagLine?: unknown };
  if (typeof account.puuid !== 'string' || account.puuid.length < 10) throw new RiotUpstreamError(502, 'Riot APIの応答を確認できませんでした');
  const fetchedAt = new Date().toISOString();
  await upsertRiotAccount(db, { puuid: account.puuid, gameName: typeof account.gameName === 'string' ? account.gameName : input.gameName, tagLine: typeof account.tagLine === 'string' ? account.tagLine : input.tagLine, platformRegion: input.platformRegion, verifiedAt: fetchedAt });
  await upsertRiotProfileCache(db, {
    puuid: account.puuid,
    cacheKey: ACCOUNT_CACHE_KEY,
    payload: JSON.stringify({ platformRegion: input.platformRegion }),
    fetchedAt,
    expiresAt: new Date(Date.now() + ACCOUNT_CACHE_TTL_MS).toISOString(),
  });
  return { verified: true, platformRegion: input.platformRegion, fetchedAt };
}
