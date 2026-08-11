import { upsertRiotAccount } from '../repositories/d1';
import type { D1DatabaseLike, WorkerEnv } from '../types';

const ACCOUNT_HOSTS = {
  americas: 'americas.api.riotgames.com',
  asia: 'asia.api.riotgames.com',
  europe: 'europe.api.riotgames.com',
  sea: 'sea.api.riotgames.com',
} as const;

export class RiotUpstreamError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'RiotUpstreamError';
  }
}

export async function verifyRiotId(input: { gameName: string; tagLine: string; platformRegion: keyof typeof ACCOUNT_HOSTS }, env: WorkerEnv, db: D1DatabaseLike): Promise<{ verified: true; platformRegion: string; fetchedAt: string }> {
  if (!env.RIOT_API_KEY) throw new RiotUpstreamError(503, 'Riot API verification is not configured');
  const host = ACCOUNT_HOSTS[input.platformRegion];
  const endpoint = `https://${host}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(input.gameName)}/${encodeURIComponent(input.tagLine)}`;
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${env.RIOT_API_KEY}` } });
  if (!response.ok) {
    const status = response.status === 429 ? 429 : response.status === 404 ? 404 : 502;
    throw new RiotUpstreamError(status, status === 404 ? 'Riot IDが見つかりません' : 'Riot API verification failed');
  }
  const account = await response.json() as { puuid?: unknown; gameName?: unknown; tagLine?: unknown };
  if (typeof account.puuid !== 'string' || account.puuid.length < 10) throw new RiotUpstreamError(502, 'Riot API response was invalid');
  const fetchedAt = new Date().toISOString();
  await upsertRiotAccount(db, { puuid: account.puuid, gameName: typeof account.gameName === 'string' ? account.gameName : input.gameName, tagLine: typeof account.tagLine === 'string' ? account.tagLine : input.tagLine, platformRegion: input.platformRegion, verifiedAt: fetchedAt });
  return { verified: true, platformRegion: input.platformRegion, fetchedAt };
}
