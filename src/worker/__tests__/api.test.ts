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

function environment(db = new FakeDb()): WorkerEnv & { db: FakeDb } {
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
  subscores: { reaction: { medianMs: 240 } },
  confidence: { reaction: 0.8 },
  recommendations: { readyNow: { primary: { championId: 'ahri', lane: 'MID' } } },
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
});
