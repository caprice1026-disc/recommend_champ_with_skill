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

export interface WorkerEnv {
  DB?: D1DatabaseLike;
  ASSETS?: AssetsFetcherLike;
  RIOT_API_KEY?: string;
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
  riotContext?: Record<string, unknown>;
}

export interface FeedbackPayload {
  diagnosisVersion: string;
  satisfaction: 'satisfied' | 'partial' | 'disagree';
  selfReportedStrongChampions: string[];
  frequentlyPlayedChampions: string[];
  wouldTryRecommendation?: boolean;
  comment: string;
}
