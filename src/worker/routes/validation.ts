import type { DiagnosisSavePayload, FeedbackPayload, PublicRiotContext } from '../types';

const DIAGNOSIS_KEYS = new Set(['diagnosisVersion', 'consentToSave', 'abilityVector', 'subscores', 'confidence', 'recommendations', 'aptitudeTypes', 'configVersions', 'createdAt', 'riotContext']);
const FEEDBACK_KEYS = new Set(['diagnosisVersion', 'satisfaction', 'selfReportedStrongChampions', 'frequentlyPlayedChampions', 'wouldTryRecommendation', 'comment', 'diagnosisResultId']);
const RIOT_CONTEXT_KEYS = new Set(['verified', 'platformRegion', 'fetchedAt']);
const RIOT_REGIONS = new Set(['americas', 'asia', 'europe', 'sea']);
const ABILITY_KEYS = new Set(['reaction', 'clickAccuracy', 'inputControl', 'prediction', 'attentionDistribution', 'taskSwitching', 'decisionSpeed', 'decisionQuality', 'pressureStability', 'recovery']);
const SUBSCORE_KEYS: Record<string, Set<string>> = {
  inputControl: new Set(['mouseSequenceControl', 'keyboardSequenceControl', 'mouseKeyboardCoordination', 'rhythmStability', 'misinputSuppression']),
  clickAccuracy: new Set(['hitRate', 'centerAccuracy', 'smallTargetAccuracy', 'longDistanceAccuracy', 'movingTargetAccuracy', 'continuousAccuracy']),
};
const RECOMMENDATION_BUCKET_KEYS = new Set(['readyNow', 'growthCandidate', 'aspirational']);
const RECOMMENDATION_BUCKET_FIELDS = new Set(['primary', 'alternatives', 'explanation']);
const RECOMMENDATION_CANDIDATE_FIELDS = new Set([
  'championId', 'championName', 'lane', 'profileMode', 'styleProfile', 'minimumRequirements', 'requirementWeights',
  'preferenceProfile', 'difficultyProfile', 'strengthTags', 'riskTags', 'trainingTags', 'reasonTags', 'iconUrl', 'wikiUrl',
  'difficultyNote', 'category', 'score', 'label', 'reason', 'shortfall', 'readiness', 'styleMatch', 'preferenceMatch',
  'difficultyFit', 'confidenceNote', 'growthReachability', 'longTermPotential', 'challengeAppeal', 'deficitCount', 'eligibility',
]);
const RAW_INPUT_KEY_PATTERN = /raw|coordinate|trajectory|trial|pointer|keypress|keysequence|eventlog|mousepath|cursorpath/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: Set<string>): boolean {
  return Object.keys(value).every((key) => allowed.has(key));
}

function isNormalizedNumberRecord(value: unknown, allowedKeys?: ReadonlySet<string>): value is Record<string, number> {
  return isRecord(value) && Object.keys(value).length > 0 && Object.keys(value).every((key) => !allowedKeys || allowedKeys.has(key)) && Object.values(value).every((item) => typeof item === 'number' && Number.isFinite(item) && item >= 0 && item <= 1);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === 'string' && item.length <= 100);
}

function isSafeAggregateValue(value: unknown, depth = 0): boolean {
  if (depth > 8) return false;
  if (value === null || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string') return value.length <= 5000;
  if (Array.isArray(value)) return value.length <= 100 && value.every((item) => isSafeAggregateValue(item, depth + 1));
  if (!isRecord(value) || Object.keys(value).length > 100) return false;
  return Object.entries(value).every(([key, item]) => !RAW_INPUT_KEY_PATTERN.test(key) && isSafeAggregateValue(item, depth + 1));
}

function isSubscores(value: unknown): value is Record<string, Record<string, number>> {
  return isRecord(value) && hasOnlyKeys(value, new Set(Object.keys(SUBSCORE_KEYS))) && Object.entries(value).every(([key, item]) => isNormalizedNumberRecord(item, SUBSCORE_KEYS[key]));
}

function isRecommendationCandidate(value: unknown): boolean {
  return isRecord(value) && hasOnlyKeys(value, RECOMMENDATION_CANDIDATE_FIELDS) && isSafeAggregateValue(value);
}

function isRecommendationBucket(value: unknown): boolean {
  if (!isRecord(value) || !hasOnlyKeys(value, RECOMMENDATION_BUCKET_FIELDS) || !isSafeAggregateValue(value)) return false;
  if (value.primary !== undefined && value.primary !== null && !isRecommendationCandidate(value.primary)) return false;
  if (value.alternatives !== undefined && (!Array.isArray(value.alternatives) || value.alternatives.length > 3 || !value.alternatives.every(isRecommendationCandidate))) return false;
  return value.explanation === undefined || (typeof value.explanation === 'string' && value.explanation.length <= 500);
}

function isRecommendations(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && hasOnlyKeys(value, RECOMMENDATION_BUCKET_KEYS) && Object.values(value).every(isRecommendationBucket);
}

function isAptitudeTypes(value: unknown): value is Record<string, string> {
  return isRecord(value) && hasOnlyKeys(value, new Set(['primary', 'ruleVersion'])) && isStringRecord(value);
}

export function parseDiagnosisPayload(value: unknown): { ok: true; payload: DiagnosisSavePayload } | { ok: false; message: string; consentRequired?: boolean } {
  if (!isRecord(value) || !hasOnlyKeys(value, DIAGNOSIS_KEYS)) return { ok: false, message: '保存できない入力項目が含まれています' };
  if (value.consentToSave !== true) return { ok: false, message: '保存への明示同意が必要です', consentRequired: true } as { ok: false; message: string; consentRequired: true };
  if (typeof value.diagnosisVersion !== 'string' || value.diagnosisVersion.length === 0 || value.diagnosisVersion.length > 50) return { ok: false, message: 'diagnosisVersionが不正です' };
  if (!isNormalizedNumberRecord(value.abilityVector, ABILITY_KEYS) || !isSubscores(value.subscores) || !isRecommendations(value.recommendations) || !isAptitudeTypes(value.aptitudeTypes) || !isNormalizedNumberRecord(value.confidence, ABILITY_KEYS) || !isStringRecord(value.configVersions)) return { ok: false, message: '集約済み診断データが不正です' };
  if (typeof value.createdAt !== 'string' || Number.isNaN(Date.parse(value.createdAt))) return { ok: false, message: 'createdAtが不正です' };
  let riotContext: PublicRiotContext | undefined;
  if (value.riotContext !== undefined && value.riotContext !== null) {
    if (!isRecord(value.riotContext) || !hasOnlyKeys(value.riotContext, RIOT_CONTEXT_KEYS) || value.riotContext.verified !== true || typeof value.riotContext.platformRegion !== 'string' || !RIOT_REGIONS.has(value.riotContext.platformRegion) || typeof value.riotContext.fetchedAt !== 'string' || Number.isNaN(Date.parse(value.riotContext.fetchedAt))) return { ok: false, message: 'riotContextが不正です' };
    riotContext = { verified: true, platformRegion: value.riotContext.platformRegion as PublicRiotContext['platformRegion'], fetchedAt: value.riotContext.fetchedAt };
  }
  const { consentToSave: _consentToSave, riotContext: _rawRiotContext, ...payload } = value;
  return { ok: true, payload: { ...payload, ...(riotContext ? { riotContext } : {}) } as unknown as DiagnosisSavePayload };
}

export function parseFeedbackPayload(value: unknown): { ok: true; payload: FeedbackPayload & { diagnosisResultId?: string } } | { ok: false; message: string } {
  if (!isRecord(value) || !hasOnlyKeys(value, FEEDBACK_KEYS)) return { ok: false, message: 'フィードバック入力が不正です' };
  if (typeof value.diagnosisVersion !== 'string' || value.diagnosisVersion.length === 0 || value.diagnosisVersion.length > 50) return { ok: false, message: 'diagnosisVersionが不正です' };
  if (value.satisfaction !== 'satisfied' && value.satisfaction !== 'partial' && value.satisfaction !== 'disagree') return { ok: false, message: 'satisfactionが不正です' };
  const arrays = [value.selfReportedStrongChampions, value.frequentlyPlayedChampions];
  if (arrays.some((items) => items !== undefined && (!Array.isArray(items) || items.length > 5 || items.some((item) => typeof item !== 'string' || item.length > 100)))) return { ok: false, message: 'チャンピオン一覧が不正です' };
  if (value.wouldTryRecommendation !== undefined && typeof value.wouldTryRecommendation !== 'boolean') return { ok: false, message: 'wouldTryRecommendationが不正です' };
  if (value.comment !== undefined && (typeof value.comment !== 'string' || value.comment.length > 2000)) return { ok: false, message: 'commentが不正です' };
  if (value.diagnosisResultId !== undefined && (typeof value.diagnosisResultId !== 'string' || value.diagnosisResultId.length > 100)) return { ok: false, message: 'diagnosisResultIdが不正です' };
  return {
    ok: true,
    payload: {
      diagnosisVersion: value.diagnosisVersion,
      satisfaction: value.satisfaction,
      selfReportedStrongChampions: (value.selfReportedStrongChampions as string[] | undefined) ?? [],
      frequentlyPlayedChampions: (value.frequentlyPlayedChampions as string[] | undefined) ?? [],
      wouldTryRecommendation: value.wouldTryRecommendation as boolean | undefined,
      comment: (value.comment as string | undefined) ?? '',
      ...(value.diagnosisResultId ? { diagnosisResultId: value.diagnosisResultId } : {}),
    },
  };
}

export function parseDeleteToken(value: unknown): string | null {
  if (!isRecord(value) || typeof value.deleteToken !== 'string' || value.deleteToken.length < 20 || value.deleteToken.length > 200) return null;
  return value.deleteToken;
}

export function parseRiotVerificationPayload(value: unknown): { ok: true; gameName: string; tagLine: string; platformRegion: 'americas' | 'asia' | 'europe' | 'sea' } | { ok: false; message: string; consentRequired?: boolean } {
  if (!isRecord(value)) return { ok: false, message: 'Riot ID入力が不正です' };
  if (value.consentToRiot !== true) return { ok: false, message: 'Riot情報の取得には別途同意が必要です', consentRequired: true };
  const gameName = typeof value.gameName === 'string' ? value.gameName.trim() : '';
  const tagLine = typeof value.tagLine === 'string' ? value.tagLine.trim() : '';
  const platformRegion = value.platformRegion ?? 'americas';
  if (!/^[\p{L}\p{N} ._-]{1,16}$/u.test(gameName) || !/^[\p{L}\p{N} ._-]{1,10}$/u.test(tagLine)) return { ok: false, message: 'Riot IDの文字数または文字種が不正です' };
  if (platformRegion !== 'americas' && platformRegion !== 'asia' && platformRegion !== 'europe' && platformRegion !== 'sea') return { ok: false, message: 'platformRegionが不正です' };
  return { ok: true, gameName, tagLine, platformRegion };
}
