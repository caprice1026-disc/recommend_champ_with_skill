import type { D1DatabaseLike } from '../types';
import { createId, sameTokenHash } from '../services/tokens';

export async function saveDiagnosis(db: D1DatabaseLike, payload: Record<string, unknown>, deleteTokenHash: string): Promise<string> {
  const resultId = createId('result');
  await db.prepare(
    'INSERT INTO diagnosis_results (result_id, payload, delete_token_hash, created_at) VALUES (?, ?, ?, ?)',
  ).bind(resultId, JSON.stringify(payload), deleteTokenHash, payload.createdAt).run();
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

export async function upsertRiotAccount(db: D1DatabaseLike, account: { puuid: string; gameName: string; tagLine: string; platformRegion: string; verifiedAt: string }): Promise<void> {
  await db.prepare(
    'INSERT INTO riot_accounts (puuid, game_name, tag_line, platform_region, last_verified_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(puuid) DO UPDATE SET game_name = excluded.game_name, tag_line = excluded.tag_line, platform_region = excluded.platform_region, last_verified_at = excluded.last_verified_at',
  ).bind(account.puuid, account.gameName, account.tagLine, account.platformRegion, account.verifiedAt).run();
}
