import { deleteDiagnosis, saveDiagnosis, saveFeedback } from './repositories/d1';
import { parseDeleteToken, parseDiagnosisPayload, parseFeedbackPayload, parseRiotVerificationPayload } from './routes/validation';
import { createDeleteToken, hashDeleteToken } from './services/tokens';
import { RiotUpstreamError, verifyRiotId } from './services/riot';
import type { WorkerEnv } from './types';
export type { WorkerEnv } from './types';

function json(data: unknown, status = 200, requestId?: string): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...(requestId ? { 'x-request-id': requestId } : {}) },
  });
}

function error(code: string, message: string, status: number, requestId: string): Response {
  return json({ error: { code, message, requestId } }, status, requestId);
}

function bodyError(cause: unknown, requestId: string, invalidMessage: string): Response {
  return error(cause instanceof Error && cause.message === 'PAYLOAD_TOO_LARGE' ? 'PAYLOAD_TOO_LARGE' : 'INVALID_JSON', cause instanceof Error && cause.message === 'PAYLOAD_TOO_LARGE' ? 'リクエストが大きすぎます' : invalidMessage, 400, requestId);
}

function requestIdFor(request: Request): string {
  return request.headers.get('x-request-id')?.slice(0, 100) || crypto.randomUUID();
}

async function body(request: Request): Promise<unknown> {
  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > 256_000) throw new Error('PAYLOAD_TOO_LARGE');
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > 256_000) throw new Error('PAYLOAD_TOO_LARGE');
  return JSON.parse(raw) as unknown;
}

function database(env: WorkerEnv, requestId: string): NonNullable<WorkerEnv['DB']> | Response {
  return env.DB ?? error('DATABASE_UNAVAILABLE', '保存機能は現在利用できません', 503, requestId);
}

async function api(request: Request, env: WorkerEnv, requestId: string): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === 'GET' && url.pathname === '/api/health') return json({ status: 'ok', service: 'lol-skill-lab' }, 200, requestId);

  if (request.method === 'POST' && url.pathname === '/api/diagnosis-results') {
    let parsed: unknown;
    try { parsed = await body(request); } catch (cause) { return error(cause instanceof Error && cause.message === 'PAYLOAD_TOO_LARGE' ? 'PAYLOAD_TOO_LARGE' : 'INVALID_JSON', 'リクエスト形式が不正です', 400, requestId); }
    const result = parseDiagnosisPayload(parsed);
    if (!result.ok) return error('consentRequired' in result && result.consentRequired ? 'CONSENT_REQUIRED' : 'INVALID_PAYLOAD', result.message, result.consentRequired ? 403 : 400, requestId);
    const db = database(env, requestId);
    if (db instanceof Response) return db;
    const deleteToken = createDeleteToken();
    const resultId = await saveDiagnosis(db, result.payload as unknown as Record<string, unknown>, await hashDeleteToken(deleteToken));
    return json({ resultId, deleteToken, saved: true }, 201, requestId);
  }

  const deleteMatch = url.pathname.match(/^\/api\/diagnosis-results\/([^/]+)$/);
  if (request.method === 'DELETE' && deleteMatch) {
    let parsed: unknown;
    try { parsed = await body(request); } catch (cause) { return bodyError(cause, requestId, '削除tokenが必要です'); }
    const token = parseDeleteToken(parsed);
    if (!token) return error('DELETE_TOKEN_REQUIRED', '削除tokenが必要です', 400, requestId);
    const db = database(env, requestId);
    if (db instanceof Response) return db;
    const deleted = await deleteDiagnosis(db, decodeURIComponent(deleteMatch[1]), await hashDeleteToken(token));
    return deleted ? new Response(null, { status: 204, headers: { 'x-request-id': requestId } }) : error('RESULT_NOT_FOUND', '保存結果が見つかりません', 404, requestId);
  }

  if (request.method === 'POST' && url.pathname === '/api/feedback') {
    let parsed: unknown;
    try { parsed = await body(request); } catch (cause) { return bodyError(cause, requestId, 'リクエスト形式が不正です'); }
    const result = parseFeedbackPayload(parsed);
    if (!result.ok) return error('INVALID_PAYLOAD', result.message, 400, requestId);
    const db = database(env, requestId);
    if (db instanceof Response) return db;
    const feedbackId = await saveFeedback(db, result.payload as unknown as Record<string, unknown>);
    return json({ received: true, feedbackId }, 201, requestId);
  }

  if (request.method === 'POST' && url.pathname === '/api/riot/verify') {
    let parsed: unknown;
    try { parsed = await body(request); } catch (cause) { return bodyError(cause, requestId, 'リクエスト形式が不正です'); }
    const input = parseRiotVerificationPayload(parsed);
    if (!input.ok) return error(input.consentRequired ? 'RIOT_CONSENT_REQUIRED' : 'INVALID_PAYLOAD', input.message, input.consentRequired ? 403 : 400, requestId);
    const db = database(env, requestId);
    if (db instanceof Response) return db;
    try {
      return json(await verifyRiotId(input, env, db), 200, requestId);
    } catch (cause) {
      if (cause instanceof RiotUpstreamError) return error(cause.status === 404 ? 'RIOT_ACCOUNT_NOT_FOUND' : cause.status === 429 ? 'RIOT_RATE_LIMITED' : cause.status === 503 ? 'RIOT_NOT_CONFIGURED' : 'RIOT_UPSTREAM_ERROR', cause.message, cause.status, requestId);
      throw cause;
    }
  }

  return error('NOT_FOUND', 'API endpoint not found', 404, requestId);
}

const worker = {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const requestId = requestIdFor(request);
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS ? env.ASSETS.fetch(request) : new Response('Not Found', { status: 404 });
    try {
      return await api(request, env, requestId);
    } catch {
      return error('INTERNAL_ERROR', 'サーバーで処理に失敗しました', 500, requestId);
    }
  },
};

export default worker;
