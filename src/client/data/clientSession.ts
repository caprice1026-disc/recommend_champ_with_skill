const SESSION_STORAGE_KEY = 'lol-skill-lab:client-session';
let memorySession: string | null = null;

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `session-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

export function getClientSessionId(): string {
  if (memorySession) return memorySession;
  try {
    const existing = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing && /^[A-Za-z0-9._~-]{16,128}$/.test(existing)) {
      memorySession = existing;
      return existing;
    }
    const created = createSessionId();
    sessionStorage.setItem(SESSION_STORAGE_KEY, created);
    memorySession = created;
    return created;
  } catch {
    memorySession = createSessionId();
    return memorySession;
  }
}

export function apiHeaders(contentType = 'application/json'): Record<string, string> {
  return { 'Content-Type': contentType, 'X-Client-Session': getClientSessionId() };
}
