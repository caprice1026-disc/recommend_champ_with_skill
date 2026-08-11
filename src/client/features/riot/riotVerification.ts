export const RIOT_REGIONS = ['americas', 'asia', 'europe', 'sea'] as const;

export type RiotRegion = typeof RIOT_REGIONS[number];

export interface PublicRiotContext {
  verified: true;
  platformRegion: RiotRegion;
  fetchedAt: string;
}

export interface RiotVerificationInput {
  gameName: string;
  tagLine: string;
  platformRegion: RiotRegion;
}

export class RiotVerificationError extends Error {
  constructor(public readonly code: string, message: string, public readonly status: number) {
    super(message);
    this.name = 'RiotVerificationError';
  }
}

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function isRegion(value: unknown): value is RiotRegion {
  return typeof value === 'string' && (RIOT_REGIONS as readonly string[]).includes(value);
}

export async function verifyRiotId(input: RiotVerificationInput, fetcher: FetchLike = fetch): Promise<PublicRiotContext> {
  const response = await fetcher('/api/riot/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...input, consentToRiot: true }),
  });
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new RiotVerificationError('RIOT_INVALID_RESPONSE', 'Riot確認の応答を読み取れませんでした', response.status);
  }
  if (!response.ok) {
    const error = body && typeof body === 'object' && !Array.isArray(body) && 'error' in body ? body.error : undefined;
    const errorRecord = error && typeof error === 'object' && !Array.isArray(error) ? error as Record<string, unknown> : {};
    throw new RiotVerificationError(
      typeof errorRecord.code === 'string' ? errorRecord.code : 'RIOT_VERIFY_FAILED',
      typeof errorRecord.message === 'string' ? errorRecord.message : 'Riot IDを確認できませんでした',
      response.status,
    );
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new RiotVerificationError('RIOT_INVALID_RESPONSE', 'Riot確認の応答が不正です', response.status);
  const record = body as Record<string, unknown>;
  if (record.verified !== true || !isRegion(record.platformRegion) || typeof record.fetchedAt !== 'string' || Number.isNaN(Date.parse(record.fetchedAt))) {
    throw new RiotVerificationError('RIOT_INVALID_RESPONSE', 'Riot確認の応答が不正です', response.status);
  }
  return { verified: true, platformRegion: record.platformRegion, fetchedAt: record.fetchedAt };
}
