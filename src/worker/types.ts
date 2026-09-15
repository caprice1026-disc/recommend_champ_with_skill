export interface PreparedStatementLike {
  bind(...values: unknown[]): PreparedStatementLike;
  run<T = unknown>(): Promise<T>;
  first<T = unknown>(): Promise<T | null>;
}

export interface D1DatabaseLike {
  prepare(sql: string): PreparedStatementLike;
}

export interface AssetsFetcherLike {
  fetch(request: Request, init?: RequestInit): Promise<Response>;
}

export interface RateLimiterLike {
  limit(input: { key: string }): Promise<{ success: boolean }>;
}

export interface WorkerEnv {
  DB?: D1DatabaseLike;
  ASSETS?: AssetsFetcherLike;
  RIOT_API_KEY?: string;
  WRITE_RATE_LIMITER?: RateLimiterLike;
  RIOT_RATE_LIMITER?: RateLimiterLike;
}

export interface PublicRiotContext {
  verified: true;
  platformRegion: 'americas' | 'asia' | 'europe' | 'sea';
  fetchedAt: string;
}

export interface DiagnosisSavePayload {
  diagnosisVersion: string;
  abilityVector: Record<string, number>;
  subscores: Record<string, unknown>;
  confidence: Record<string, number>;
  recommendations: Record<string, unknown>;
  aptitudeTypes: Record<string, unknown>;
  configVersions: Record<string, string>;
  createdAt: string;
  riotContext?: PublicRiotContext;
}

export interface FeedbackPayload {
  diagnosisVersion: string;
  satisfaction: 'satisfied' | 'partial' | 'disagree';
  selfReportedStrongChampions: string[];
  frequentlyPlayedChampions: string[];
  wouldTryRecommendation?: boolean;
  comment: string;
}
