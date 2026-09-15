import type { RateLimiterLike } from '../types';

export type RateLimitDecision = 'allowed' | 'limited' | 'unavailable';

export async function checkRateLimit(limiter: RateLimiterLike | undefined, key: string): Promise<RateLimitDecision> {
  if (!limiter) return 'allowed';
  try {
    const result = await limiter.limit({ key });
    return result.success ? 'allowed' : 'limited';
  } catch {
    return 'unavailable';
  }
}

export function clientRateLimitKey(request: Request, route: string): string {
  const session = request.headers.get('x-client-session')?.trim() ?? '';
  const safeSession = /^[A-Za-z0-9._~-]{16,128}$/.test(session) ? session : 'anonymous';
  return `${route}:${safeSession}`;
}
