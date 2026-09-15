import type { D1DatabaseLike } from '../types';
import { createId, sameTokenHash } from '../services/tokens';

export const DIAGNOSIS_RETENTION_DAYS = 90;
export const RIOT_RETENTION_HOURS = 1;

export interface RiotAccountRecord {
  puuid: string;
  game_name: string;
  tag_line: string;
  platform_region: string;
}

export interface RiotProfileCacheRecord {
  payload: string;
  fetched_at: string;
  expires_at: string;
}

function addMilliseconds(iso: string, milliseconds: number): string {
  const timestamp = Date.parse(iso);
  return new Date((Number.isNaN(timestamp) ? Date.now() : timestamp) + milliseconds).toISOString();
}

export async function saveDiagnosis(db: D1DatabaseLike, payload: Record<string, unknown>, deleteTokenHash: string): Promise<string> {
  const resultId = createId('result');
  const createdAt = typeof payload.createdAt === 'string' ? payload.createdAt : new Date().toISOString();
  const expiresAt = addMilliseconds(createdAt, DIAGNOSIS_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  await db.prepare(
    'INSERT INTO diagnosis_results (result_id, payload, delete_token_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)',
  ).bind(resultId, JSON.stringify(payload), deleteTokenHash, createdAt, expiresAt).run();
  return resultId;
}

export async function deleteDiagnosis(db: D1DatabaseLike, resultId: string, deleteTokenHash: string): Promise<boolean> {
  const row = await db.prepare(
    'SELECT delete_token_hash FROM diagnosis_results WHERE result_id = ?',
  ).bind(resultId).first<{ delete_token_hash: string }>();
  if (!row || !sameTokenHash(row.delete_token_hash, deleteTokenHash)) return false;
  const result = await db.prepare('DELETE FROM diagnosis_results WHERE result_id = ?').bind(resultId).run<{ meta?: { changes?: number } }>();
  return (result.meta?.changes ?? 0) > 0;
}

export async function saveFeedback(db: D1DatabaseLike, payload: Record<string, unknown>): Promise<string> {
  const feedbackId = createId('feedback');
  await db.prepare(
    'INSERT INTO feedback (feedback_id, diagnosis_result_id, payload, created_at) VALUES (?, ?, ?, ?)',
  ).bind(feedbackId, payload.diagnosisResultId ?? null, JSON.stringify(payload), new Date().toISOString()).run();
  return feedbackId;
}

export async function upsertRiotAccount(db: D1DatabaseLike, account: { puuid: string; gameName: string; tagLine: string; platformRegion: string; verifiedAt: string; expiresAt: string }): Promise<void> {
  await db.prepare(
    'INSERT INTO riot_accounts (puuid, game_name, tag_line, platform_region, last_verified_at, expires_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(puuid) DO UPDATE SET game_name = excluded.game_name, tag_line = excluded.tag_line, platform_region = excluded.platform_region, last_verified_at = excluded.last_verified_at, expires_at = excluded.expires_at',
  ).bind(account.puuid, account.gameName, account.tagLine, account.platformRegion, account.verifiedAt, account.expiresAt).run();
}

export async function findRiotAccount(db: D1DatabaseLike, account: { gameName: string; tagLine: string; platformRegion: string }): Promise<RiotAccountRecord | null> {
  return db.prepare(
    'SELECT puuid, game_name, tag_line, platform_region FROM riot_accounts WHERE game_name = ? AND tag_line = ? AND platform_region = ? AND julianday(expires_at) > julianday(?)',
  ).bind(account.gameName, account.tagLine, account.platformRegion, new Date().toISOString()).first<RiotAccountRecord>();
}

export async function getRiotProfileCache(db: D1DatabaseLike, puuid: string, cacheKey: string): Promise<RiotProfileCacheRecord | null> {
  const record = await db.prepare(
    'SELECT payload, fetched_at, expires_at FROM riot_profile_cache WHERE puuid = ? AND cache_key = ? AND julianday(expires_at) > julianday(?)',
  ).bind(puuid, cacheKey, new Date().toISOString()).first<RiotProfileCacheRecord>();
  if (!record || Number.isNaN(Date.parse(record.expires_at)) || Date.parse(record.expires_at) <= Date.now()) return null;
  return record;
}

export async function upsertRiotProfileCache(db: D1DatabaseLike, input: { puuid: string; cacheKey: string; payload: string; fetchedAt: string; expiresAt: string }): Promise<void> {
  await db.prepare(
    'INSERT INTO riot_profile_cache (puuid, cache_key, payload, fetched_at, expires_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(puuid, cache_key) DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at, expires_at = excluded.expires_at',
  ).bind(input.puuid, input.cacheKey, input.payload, input.fetchedAt, input.expiresAt).run();
}

export async function deleteExpiredDiagnosisResults(db: D1DatabaseLike, now = new Date()): Promise<void> {
  await db.prepare('DELETE FROM diagnosis_results WHERE julianday(expires_at) <= julianday(?)').bind(now.toISOString()).run();
}

export async function deleteExpiredRiotData(db: D1DatabaseLike, now = new Date()): Promise<void> {
  const timestamp = now.toISOString();
  await db.prepare('DELETE FROM riot_profile_cache WHERE julianday(expires_at) <= julianday(?)').bind(timestamp).run();
  await db.prepare('DELETE FROM riot_accounts WHERE julianday(expires_at) <= julianday(?)').bind(timestamp).run();
}
