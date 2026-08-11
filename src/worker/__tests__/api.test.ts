import { afterEach, describe, expect, it, vi } from 'vitest';
import worker, { type WorkerEnv } from '../index';
import { hashDeleteToken } from '../services/tokens';

type RecordedQuery = { sql: string; values: unknown[] };

class FakeStatement {
  constructor(private readonly sql: string, private readonly queries: RecordedQuery[], private readonly firstValue?: unknown) {}

  bind(...values: unknown[]) {
    this.queries.push({ sql: this.sql, values });
    return this;
  }

  async run<T = unknown>() {
    return { success: true, meta: { changes: 1 } } as T;
  }

  async first<T>() {
    return this.firstValue as T | null;
  }
}

class FakeDb {
  readonly queries: RecordedQuery[] = [];
  constructor(private readonly storedHash?: string) {}
  prepare(sql: string) {
    const firstValue = sql.includes('delete_token_hash') && this.storedHash ? { delete_token_hash: this.storedHash } : undefined;
    return new FakeStatement(sql, this.queries, firstValue);
  }
}

class RiotCacheDb {
  account: { puuid: string; game_name: string; tag_line: string; platform_region: string } | null = null;
  cache: { payload: string; fetched_at: string; expires_at: string } | null = null;
  readonly queries: RecordedQuery[] = [];

  prepare(sql: string) {
    let values: unknown[] = [];
    const statement = {
      bind: (...bound: unknown[]) => {
        values = bound;
        this.queries.push({ sql, values: bound });
        return statement;
      },
      first: async <T>() => {
        if (sql.includes('FROM riot_accounts')) return this.account as T | null;
        if (sql.includes('FROM riot_profile_cache')) return this.cache as T | null;
        return null;
      },
      run: async <T>() => {
        if (sql.includes('INSERT INTO riot_accounts')) {
          this.account = {
            puuid: String(values[0]),
            game_name: String(values[1]),
            tag_line: String(values[2]),
            platform_region: String(values[3]),
          };
        }
        if (sql.includes('INSERT INTO riot_profile_cache')) {
          this.cache = { payload: String(values[2]), fetched_at: String(values[3]), expires_at: String(values[4]) };
        }
        return { success: true, meta: { changes: 1 } } as T;
      },
    };
    return statement;
  }
}

function environment<T extends NonNullable<WorkerEnv['DB']>>(db: T = new FakeDb() as unknown as T): WorkerEnv & { db: T } {
  return {
    db,
    DB: db,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) },
  };
}

const validPayload = {
  diagnosisVersion: '1.0.0',
  consentToSave: true,
  abilityVector: { reaction: 0.7 },
  subscores: { inputControl: { mouseSequenceControl: 0.7 }, clickAccuracy: { hitRate: 0.7 } },
  confidence: { reaction: 0.8 },
  recommendations: {
    readyNow: { primary: { championId: 'ahri', lane: 'MID' }, alternatives: [], explanation: 'ready' },
    growthCandidate: { alternatives: [], explanation: 'growth' },
    aspirational: { alternatives: [], explanation: 'aspirational' },
  },
  aptitudeTypes: { primary: 'steady_controller', ruleVersion: '1.0.0' },
  configVersions: { diagnosisVersion: '1.0.0' },
  createdAt: '2026-08-12T00:00:00.000Z',
};

describe('Cloudflare Worker API', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns a health response without requiring D1', async () => {
    const response = await worker.fetch(new Request('https://example.test/api/health'), environment());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ok', service: 'lol-skill-lab' });
  });

  it('rejects diagnosis results without explicit consent using the standard error shape', async () => {
    const response = await worker.fetch(
      new Request('https://example.test/api/diagnosis-results', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...validPayload, consentToSave: false }),
      }),
      environment(),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'CONSENT_REQUIRED' } });
  });

  it('rejects raw input fields before writing a diagnosis result', async () => {
    const db = new FakeDb();
    const response = await worker.fetch(
      new Request('https://example.test/api/diagnosis-results', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...validPayload, rawLogs: [{ x: 1 }] }),
      }),
      environment(db),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'INVALID_PAYLOAD' } });
    expect(db.queries).toHaveLength(0);
  });

  it('rejects raw input fields nested inside aggregate objects', async () => {
    const db = new FakeDb();
    const response = await worker.fetch(
      new Request('https://example.test/api/diagnosis-results', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...validPayload,
          subscores: {
            inputControl: { mouseSequenceControl: 0.8 },
            rawCoordinates: [{ x: 10, y: 20 }],
          },
        }),
      }),
      environment(db),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'INVALID_PAYLOAD' } });
    expect(db.queries).toHaveLength(0);
  });

  it('rejects oversized bodies even when content-length is omitted', async () => {
    const response = await worker.fetch(
      new Request('https://example.test/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify('x'.repeat(260_001)),
      }),
      environment(),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'PAYLOAD_TOO_LARGE' } });
  });

  it('stores only an aggregate result and returns a one-time delete token', async () => {
    const db = new FakeDb();
    const response = await worker.fetch(
      new Request('https://example.test/api/diagnosis-results', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validPayload),
      }),
      environment(db),
    );

    expect(response.status).toBe(201);
    const body = await response.json() as { resultId: string; deleteToken: string; saved: boolean };
    expect(body).toMatchObject({ saved: true });
    expect(body.resultId).toMatch(/^result_/);
    expect(body.deleteToken.length).toBeGreaterThan(20);
    expect(db.queries.some(({ sql }) => sql.includes('INSERT INTO diagnosis_results'))).toBe(true);
    expect(db.queries.flatMap(({ values }) => values)).not.toContain(body.deleteToken);
  });

  it('rejects private Riot identifiers in a diagnosis context', async () => {
    const response = await worker.fetch(
      new Request('https://example.test/api/diagnosis-results', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...validPayload, riotContext: { verified: true, platformRegion: 'asia', puuid: 'private-puuid' } }),
      }),
      environment(),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'INVALID_PAYLOAD' } });
  });

  it('rejects diagnosis ability and confidence values outside the normalized range', async () => {
    const db = new FakeDb();
    const response = await worker.fetch(
      new Request('https://example.test/api/diagnosis-results', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...validPayload, abilityVector: { reaction: 1.1 }, confidence: { reaction: -0.1 } }),
      }),
      environment(db),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'INVALID_PAYLOAD' } });
    expect(db.queries).toHaveLength(0);
  });

  it('stores only the public Riot context fields in a diagnosis payload', async () => {
    const db = new FakeDb();
    const response = await worker.fetch(
      new Request('https://example.test/api/diagnosis-results', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...validPayload, riotContext: { verified: true, platformRegion: 'asia', fetchedAt: '2026-08-12T00:00:00.000Z' } }),
      }),
      environment(db),
    );

    expect(response.status).toBe(201);
    const insert = db.queries.find(({ sql }) => sql.includes('INSERT INTO diagnosis_results'));
    expect(insert).toBeDefined();
    const stored = JSON.parse(String(insert?.values[1])) as Record<string, unknown>;
    expect(stored.riotContext).toEqual({ verified: true, platformRegion: 'asia', fetchedAt: '2026-08-12T00:00:00.000Z' });
    expect(JSON.stringify(stored)).not.toContain('puuid');
  });

  it('requires the delete token and deletes a matching result', async () => {
    const deleteToken = 'token-from-session-12345';
    const db = new FakeDb(await hashDeleteToken(deleteToken));
    const response = await worker.fetch(
      new Request('https://example.test/api/diagnosis-results/result_123', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ deleteToken }),
      }),
      environment(db),
    );

    expect(response.status).toBe(204);
    expect(db.queries.some(({ sql }) => sql.includes('DELETE FROM diagnosis_results'))).toBe(true);
  });

  it('stores feedback separately from diagnosis results', async () => {
    const db = new FakeDb();
    const response = await worker.fetch(
      new Request('https://example.test/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ diagnosisVersion: '1.0.0', satisfaction: 'partial', comment: '了解しやすい' }),
      }),
      environment(db),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({ received: true });
    expect(db.queries.some(({ sql }) => sql.includes('INSERT INTO feedback'))).toBe(true);
  });

  it('verifies a Riot ID through the Worker secret without exposing the API key', async () => {
    const db = new FakeDb();
    const upstream = vi.fn(async () => new Response(JSON.stringify({ puuid: 'private-puuid', gameName: 'Hodaka', tagLine: 'JP1' }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', upstream);

    const response = await worker.fetch(
      new Request('https://example.test/api/riot/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ consentToRiot: true, gameName: 'Hodaka', tagLine: 'JP1', platformRegion: 'americas' }),
      }),
      { ...environment(db), RIOT_API_KEY: 'secret-riot-key' },
    );

    expect(response.status).toBe(200);
    const body = await response.json() as Record<string, unknown>;
    expect(body).toMatchObject({ verified: true, platformRegion: 'americas' });
    expect(body).not.toHaveProperty('puuid');
    expect(JSON.stringify(body)).not.toContain('secret-riot-key');
    expect(upstream).toHaveBeenCalledTimes(1);
    const upstreamCall = (upstream.mock.calls as unknown as Array<[string, RequestInit]>)[0];
    expect(String(upstreamCall[0])).toContain('/riot/account/v1/accounts/by-riot-id/Hodaka/JP1');
    expect(upstreamCall[1].headers).toMatchObject({ Authorization: 'Bearer secret-riot-key' });
  });

  it('uses a fresh Riot profile cache and refreshes it after expiry', async () => {
    const db = new RiotCacheDb();
    const upstream = vi.fn(async () => new Response(JSON.stringify({ puuid: 'private-puuid', gameName: 'Hodaka', tagLine: 'JP1' }), { status: 200 }));
    vi.stubGlobal('fetch', upstream);
    const request = () => new Request('https://example.test/api/riot/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ consentToRiot: true, gameName: 'Hodaka', tagLine: 'JP1', platformRegion: 'americas' }),
    });

    await worker.fetch(request(), { ...environment(db), RIOT_API_KEY: 'secret-riot-key' });
    await worker.fetch(request(), { ...environment(db), RIOT_API_KEY: 'secret-riot-key' });
    expect(upstream).toHaveBeenCalledTimes(1);
    expect(db.cache?.expires_at).toBeTruthy();

    db.cache = { ...db.cache!, expires_at: '2020-01-01T00:00:00.000Z' };
    await worker.fetch(request(), { ...environment(db), RIOT_API_KEY: 'secret-riot-key' });
    expect(upstream).toHaveBeenCalledTimes(2);
  });

  it('normalizes Riot configuration and upstream failures without exposing internals', async () => {
    const missingKeyResponse = await worker.fetch(
      new Request('https://example.test/api/riot/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ consentToRiot: true, gameName: 'Hodaka', tagLine: 'JP1', platformRegion: 'americas' }),
      }),
      environment(),
    );
    expect(missingKeyResponse.status).toBe(503);
    await expect(missingKeyResponse.json()).resolves.toMatchObject({ error: { code: 'RIOT_NOT_CONFIGURED' } });

    const upstream = vi.fn(async () => new Response('private upstream body', { status: 429 }));
    vi.stubGlobal('fetch', upstream);
    const rateLimitedResponse = await worker.fetch(
      new Request('https://example.test/api/riot/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ consentToRiot: true, gameName: 'Hodaka', tagLine: 'JP1', platformRegion: 'americas' }),
      }),
      { ...environment(), RIOT_API_KEY: 'secret-riot-key' },
    );
    expect(rateLimitedResponse.status).toBe(429);
    const errorBody = await rateLimitedResponse.text();
    expect(errorBody).not.toContain('private upstream body');
    expect(errorBody).not.toContain('secret-riot-key');
  });

  it('normalizes Riot network failures without exposing the upstream error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('private network detail'); }));
    const response = await worker.fetch(
      new Request('https://example.test/api/riot/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ consentToRiot: true, gameName: 'Hodaka', tagLine: 'JP1', platformRegion: 'americas' }),
      }),
      { ...environment(), RIOT_API_KEY: 'secret-riot-key' },
    );

    expect(response.status).toBe(502);
    const errorBody = await response.text();
    expect(errorBody).toContain('RIOT_UPSTREAM_ERROR');
    expect(errorBody).not.toContain('private network detail');
  });
});
