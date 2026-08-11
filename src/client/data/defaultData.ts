import type { ChampionLaneProfile, Lane, ScoreMap } from '../../domain/types';
import { GENERATED_CHAMPION_LANES } from './generatedChampionCatalog';
import { DEFAULT_TEST_CONFIGURATION, STATIC_MANIFEST, type RuntimeConfigSnapshot } from './runtimeConfig';

export const PREFERENCE_QUESTIONS = [
  ['aggression', '自分から戦闘を始めたい'], ['teamSupport', '味方を守ったり援護したりしたい'],
  ['independence', '一人で動ける方が好き'], ['teamCoordination', '味方と連携して戦いたい'],
  ['earlyGameFocus', '序盤から試合へ影響を出したい'], ['lateGameFocus', '終盤に強くなる方が好き'],
  ['burstPreference', '瞬間的な大ダメージが好き'], ['sustainedCombat', '長い戦闘を続ける方が好き'],
  ['reactivePlay', '相手の動きを待って対応したい'], ['riskTaking', '自分からリスクを取って試合を動かしたい'],
  ['complexityEnjoyment', '複雑な操作を覚えることが苦にならない'], ['stabilityPreference', '安定した再現性を重視する'],
  ['highVariancePreference', '高いリスク・高いリターンを好む'], ['rangePreference', '遠距離から攻撃する方が好き'],
  ['meleePreference', '接近して戦う方が好き'], ['mapInfluencePreference', 'マップ全体へ影響を出したい'],
] as const;

export const DEFAULT_CHAMPION_LANES: ChampionLaneProfile[] = GENERATED_CHAMPION_LANES;
export const DEFAULT_PREFERENCES: ScoreMap = Object.fromEntries(PREFERENCE_QUESTIONS.map(([key]) => [key, 0.5]));

export async function loadRuntimeConfig(): Promise<{ candidates: ChampionLaneProfile[]; snapshot: RuntimeConfigSnapshot }> {
  return { candidates: DEFAULT_CHAMPION_LANES, snapshot: { manifest: STATIC_MANIFEST, tests: DEFAULT_TEST_CONFIGURATION, source: 'static' } };
}

export async function loadChampionLanes(): Promise<ChampionLaneProfile[]> {
  return (await loadRuntimeConfig()).candidates;
}

export type { Lane };
