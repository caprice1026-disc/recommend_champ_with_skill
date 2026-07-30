import type { ChampionLaneProfile, Lane, ScoreMap } from '../domain/types';

export const PREFERENCE_QUESTIONS = [
  ['aggression', '自分から戦闘を仕掛けたい'],
  ['teamSupport', '味方を守ったり支援したりするのが好き'],
  ['independence', '単独で行動できる方が好き'],
  ['teamCoordination', '味方と連携して戦う方が好き'],
  ['earlyGameFocus', '序盤から試合へ影響を出したい'],
  ['lateGameFocus', '終盤に強くなる方が好き'],
  ['burstPreference', '瞬間的な大ダメージが好き'],
  ['sustainedCombat', '長く戦い続ける方が好き'],
  ['reactivePlay', '相手の動きを待って対応するのが好き'],
  ['riskTaking', '自分からリスクを取って試合を動かしたい'],
  ['complexityEnjoyment', '複雑な操作を覚えることが苦にならない'],
  ['stabilityPreference', '安定した再現性を重視する'],
  ['highVariancePreference', '高い爆発力を重視する'],
  ['rangePreference', '遠距離から攻撃する方が好き'],
  ['meleePreference', '接近して戦う方が好き'],
  ['mapInfluencePreference', '視界やマップ情報を使ったプレイが好き'],
] as const;

const abilities = ['reaction', 'clickAccuracy', 'inputControl', 'prediction', 'attentionDistribution', 'taskSwitching', 'decisionSpeed', 'decisionQuality', 'pressureStability', 'recovery'];

function scoreMap(values: Partial<Record<string, number>>, fallback = 0.5): ScoreMap {
  return Object.fromEntries(abilities.map((key) => [key, values[key] ?? fallback]));
}

function profile(
  championId: string,
  championName: string,
  lane: Lane,
  style: Partial<Record<string, number>>,
  requirements: Partial<Record<string, number>>,
  preferences: Partial<Record<string, number>>,
  trainingTags: string[],
  strengthTags: string[],
  riskTags: string[],
): ChampionLaneProfile {
  return {
    championId,
    championName,
    lane,
    profileMode: 'explicit',
    styleProfile: scoreMap(style),
    minimumRequirements: scoreMap(requirements, 0),
    requirementWeights: scoreMap(Object.fromEntries(Object.keys(requirements).map((key) => [key, 0.8])), 0.35),
    preferenceProfile: { aggression: 0.5, teamSupport: 0.5, independence: 0.5, teamCoordination: 0.5, earlyGameFocus: 0.5, lateGameFocus: 0.5, burstPreference: 0.5, sustainedCombat: 0.5, reactivePlay: 0.5, riskTaking: 0.5, complexityEnjoyment: 0.5, stabilityPreference: 0.5, highVariancePreference: 0.5, rangePreference: 0.5, meleePreference: 0.5, mapInfluencePreference: 0.5, ...preferences },
    difficultyProfile: { inputComplexity: style.inputControl ?? 0.5, aimDifficulty: style.clickAccuracy ?? 0.5, decisionComplexity: style.decisionQuality ?? 0.5, macroRequirement: style.attentionDistribution ?? 0.5, knowledgeRequirement: 0.5, situationalDependence: style.prediction ?? 0.5 },
    strengthTags,
    riskTags,
    trainingTags,
  };
}

export const DEFAULT_CHAMPION_LANES: ChampionLaneProfile[] = [
  profile('gragas', 'グラガス', 'TOP', { prediction: 0.7, decisionQuality: 0.75, pressureStability: 0.7, recovery: 0.75 }, { prediction: 0.4, decisionQuality: 0.5 }, { aggression: 0.55, teamCoordination: 0.7, stabilityPreference: 0.7 }, ['prediction', 'decisionQuality'], ['判断の切り替え', '安定した対応'], ['距離管理']),
  profile('ahri', 'アーリ', 'MID', { reaction: 0.7, clickAccuracy: 0.7, prediction: 0.75, taskSwitching: 0.7, decisionSpeed: 0.75 }, { clickAccuracy: 0.45, prediction: 0.45 }, { aggression: 0.7, burstPreference: 0.75, riskTaking: 0.65, rangePreference: 0.65 }, ['clickAccuracy', 'prediction'], ['移動予測', '瞬間判断'], ['スキル精度']),
  profile('orianna', 'オリアナ', 'MID', { attentionDistribution: 0.8, decisionQuality: 0.85, pressureStability: 0.75 }, { attentionDistribution: 0.5, decisionQuality: 0.55 }, { teamSupport: 0.7, teamCoordination: 0.85, lateGameFocus: 0.75, stabilityPreference: 0.75 }, ['attentionDistribution', 'decisionQuality'], ['盤面把握', '計画的な判断'], ['位置取り']),
  profile('lee-sin', 'リー・シン', 'JUNGLE', { reaction: 0.8, clickAccuracy: 0.8, inputControl: 0.9, taskSwitching: 0.85, decisionSpeed: 0.85 }, { inputControl: 0.6, taskSwitching: 0.55 }, { aggression: 0.85, riskTaking: 0.85, complexityEnjoyment: 0.9, mapInfluencePreference: 0.85 }, ['inputControl', 'taskSwitching'], ['高速連携', '対象切り替え'], ['入力負荷']),
  profile('sejuani', 'セジュアニ', 'JUNGLE', { attentionDistribution: 0.8, decisionQuality: 0.8, pressureStability: 0.85, recovery: 0.8 }, { attentionDistribution: 0.45, decisionQuality: 0.5 }, { teamSupport: 0.85, teamCoordination: 0.9, stabilityPreference: 0.85, mapInfluencePreference: 0.8 }, ['attentionDistribution', 'recovery'], ['味方との連携', '安定維持'], ['先読み']),
  profile('caitlyn', 'ケイトリン', 'BOT', { clickAccuracy: 0.85, prediction: 0.8, attentionDistribution: 0.7 }, { clickAccuracy: 0.6, prediction: 0.5 }, { aggression: 0.65, rangePreference: 0.95, teamCoordination: 0.75, earlyGameFocus: 0.7 }, ['clickAccuracy', 'prediction'], ['精密エイム', '射程管理'], ['接近戦']),
  profile('thresh', 'スレッシュ', 'SUPPORT', { inputControl: 0.7, prediction: 0.7, attentionDistribution: 0.8, taskSwitching: 0.75, decisionQuality: 0.8 }, { attentionDistribution: 0.55, decisionQuality: 0.55 }, { teamSupport: 0.9, teamCoordination: 0.95, mapInfluencePreference: 0.9, complexityEnjoyment: 0.65 }, ['inputControl', 'attentionDistribution'], ['広域監視', '味方支援'], ['複合入力']),
  profile('malphite', 'マルファイト', 'TOP', { decisionQuality: 0.7, pressureStability: 0.8, recovery: 0.75 }, { decisionQuality: 0.45, pressureStability: 0.5 }, { stabilityPreference: 0.9, teamCoordination: 0.65, complexityEnjoyment: 0.2 }, ['decisionQuality', 'recovery'], ['確定判断', '安定維持'], ['柔軟な切り替え']),
  profile('yasuo', 'ヤスオ', 'MID', { reaction: 0.85, clickAccuracy: 0.75, inputControl: 0.85, taskSwitching: 0.8, decisionSpeed: 0.8 }, { inputControl: 0.65, clickAccuracy: 0.5 }, { aggression: 0.9, independence: 0.8, riskTaking: 0.9, complexityEnjoyment: 0.9, highVariancePreference: 0.9 }, ['inputControl', 'pressureStability'], ['高速操作', 'リスク選択'], ['失敗時の罰']),
  profile('kindred', 'キンドレッド', 'JUNGLE', { prediction: 0.8, attentionDistribution: 0.85, decisionQuality: 0.75, taskSwitching: 0.7 }, { prediction: 0.6, attentionDistribution: 0.5 }, { independence: 0.7, mapInfluencePreference: 0.95, lateGameFocus: 0.65, rangePreference: 0.65 }, ['prediction', 'attentionDistribution'], ['先読み', 'マップ影響'], ['判断の複雑さ']),
  profile('milio', 'ミリオ', 'SUPPORT', { attentionDistribution: 0.85, decisionQuality: 0.85, pressureStability: 0.8, recovery: 0.8 }, { attentionDistribution: 0.55, decisionQuality: 0.6 }, { teamSupport: 0.95, teamCoordination: 0.95, reactivePlay: 0.85, stabilityPreference: 0.9 }, ['attentionDistribution', 'decisionQuality'], ['味方支援', '判断の安定'], ['単独の火力']),
  profile('nautilus', 'ノーチラス', 'SUPPORT', { reaction: 0.55, clickAccuracy: 0.35, inputControl: 0.65, prediction: 0.55, attentionDistribution: 0.65, taskSwitching: 0.65, decisionSpeed: 0.55, decisionQuality: 0.75, pressureStability: 0.7, recovery: 0.7 }, { reaction: 0.6, clickAccuracy: 0.5, inputControl: 0.72, prediction: 0.65, attentionDistribution: 0.75, taskSwitching: 0.78, decisionQuality: 0.82 }, { teamSupport: 0.85, teamCoordination: 0.9, complexityEnjoyment: 0.55, mapInfluencePreference: 0.75, stabilityPreference: 0.65 }, ['inputControl', 'attentionDistribution', 'decisionQuality'], ['エンゲージ判断', '味方支援'], ['距離管理']),
  profile('azir', 'アジール', 'MID', { reaction: 0.85, clickAccuracy: 0.85, inputControl: 0.85, prediction: 0.85, attentionDistribution: 0.85, taskSwitching: 0.85, decisionSpeed: 0.85, decisionQuality: 0.85, pressureStability: 0.85, recovery: 0.85 }, { reaction: 0.88, clickAccuracy: 0.88, inputControl: 0.88, prediction: 0.88, attentionDistribution: 0.88, taskSwitching: 0.88, decisionSpeed: 0.88, decisionQuality: 0.88, pressureStability: 0.88, recovery: 0.88 }, { aggression: 0.5, teamSupport: 0.5, independence: 0.5, teamCoordination: 0.5, earlyGameFocus: 0.5, lateGameFocus: 0.5, burstPreference: 0.5, sustainedCombat: 0.5, reactivePlay: 0.5, riskTaking: 0.5, complexityEnjoyment: 0.5, stabilityPreference: 0.5, highVariancePreference: 0.5, rangePreference: 0.5, meleePreference: 0.5, mapInfluencePreference: 0.5 }, ['complexityEnjoyment', 'taskSwitching', 'decisionQuality'], ['高度な操作', '長期の伸びしろ'], ['入力負荷', '判断密度']),
  profile('vayne', 'ヴェイン', 'BOT', { reaction: 0.8, clickAccuracy: 0.85, inputControl: 0.8, prediction: 0.75, taskSwitching: 0.75, decisionSpeed: 0.8 }, { clickAccuracy: 0.65, inputControl: 0.55 }, { aggression: 0.75, lateGameFocus: 0.9, sustainedCombat: 0.9, complexityEnjoyment: 0.85, highVariancePreference: 0.8, rangePreference: 0.75 }, ['clickAccuracy', 'inputControl'], ['精密操作', '継続戦闘'], ['入力と判断の負荷']),
];

export const DEFAULT_PREFERENCES: ScoreMap = Object.fromEntries(PREFERENCE_QUESTIONS.map(([key]) => [key, 0.5]));

export async function loadChampionLanes(): Promise<ChampionLaneProfile[]> {
  try {
    const response = await fetch('/api/profiles/champion-lanes');
    if (!response.ok) throw new Error('profile request failed');
    const body = await response.json() as { profiles: ChampionLaneProfile[] };
    return body.profiles.length >= 9 ? body.profiles : DEFAULT_CHAMPION_LANES;
  } catch {
    return DEFAULT_CHAMPION_LANES;
  }
}
