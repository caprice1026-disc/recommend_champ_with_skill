import type { AbilityKey, AbilityVector, AptitudeTitle, ScoreMap } from './types';

type TitleDefinition = AptitudeTitle & {
  abilityWeights: Partial<Record<AbilityKey, number>>;
  preferenceWeights: Record<string, number>;
};

const TITLE_DEFINITIONS: TitleDefinition[] = [
  {
    id: 'precision-playmaker', name: '精密プレイメーカー',
    description: '狙いと入力の精度を、攻めの選択肢へ変えられるプレイ傾向です。',
    signals: ['clickAccuracy', 'inputControl', 'reaction'],
    abilityWeights: { clickAccuracy: 0.35, inputControl: 0.3, reaction: 0.2, prediction: 0.15 },
    preferenceWeights: { rangePreference: 0.6, complexityEnjoyment: 0.4 },
  },
  {
    id: 'lookahead-commander', name: '先読みの司令塔',
    description: '相手の次の動きと盤面の情報を、先回りした判断につなげる傾向です。',
    signals: ['prediction', 'attentionDistribution', 'decisionQuality'],
    abilityWeights: { prediction: 0.35, attentionDistribution: 0.25, decisionQuality: 0.25, decisionSpeed: 0.15 },
    preferenceWeights: { mapInfluencePreference: 0.55, teamCoordination: 0.45 },
  },
  {
    id: 'team-anchor', name: 'チームの安定装置',
    description: '味方の状態を見ながら、崩れにくい判断と立て直しを積み重ねる傾向です。',
    signals: ['attentionDistribution', 'decisionQuality', 'pressureStability', 'recovery'],
    abilityWeights: { attentionDistribution: 0.25, decisionQuality: 0.25, pressureStability: 0.2, recovery: 0.2, taskSwitching: 0.1 },
    preferenceWeights: { teamSupport: 0.45, teamCoordination: 0.35, stabilityPreference: 0.2 },
  },
  {
    id: 'burst-attacker', name: '瞬間突破のアタッカー',
    description: '一瞬の反応と決断で、短いチャンスを攻撃へ変える傾向です。',
    signals: ['reaction', 'decisionSpeed', 'inputControl'],
    abilityWeights: { reaction: 0.3, decisionSpeed: 0.3, inputControl: 0.2, clickAccuracy: 0.2 },
    preferenceWeights: { aggression: 0.45, burstPreference: 0.35, riskTaking: 0.2 },
  },
  {
    id: 'flexible-switcher', name: '柔軟なスイッチャー',
    description: '状況や役割が変わっても、操作と判断のモードを切り替えられる傾向です。',
    signals: ['taskSwitching', 'attentionDistribution', 'inputControl'],
    abilityWeights: { taskSwitching: 0.4, attentionDistribution: 0.25, inputControl: 0.2, reaction: 0.15 },
    preferenceWeights: { complexityEnjoyment: 0.55, reactivePlay: 0.45 },
  },
  {
    id: 'recovery-specialist', name: '不屈のリカバリー型',
    description: 'ミスや不利のあとに、次の一手へ落ち着いて戻れる傾向です。',
    signals: ['recovery', 'pressureStability', 'decisionQuality'],
    abilityWeights: { recovery: 0.4, pressureStability: 0.35, decisionQuality: 0.15, attentionDistribution: 0.1 },
    preferenceWeights: { stabilityPreference: 0.65, reactivePlay: 0.35 },
  },
  {
    id: 'frontline-initiator', name: '前線を作るイニシエーター',
    description: '味方が動ける入口を見つけ、戦闘の始点を作る傾向です。',
    signals: ['decisionSpeed', 'decisionQuality', 'pressureStability'],
    abilityWeights: { decisionSpeed: 0.25, decisionQuality: 0.25, reaction: 0.2, pressureStability: 0.15, attentionDistribution: 0.15 },
    preferenceWeights: { aggression: 0.35, teamCoordination: 0.4, meleePreference: 0.25 },
  },
  {
    id: 'board-controller', name: '盤面を読むコントローラー',
    description: '相手の選択肢を狭めながら、戦う場所とタイミングを整える傾向です。',
    signals: ['attentionDistribution', 'prediction', 'decisionQuality'],
    abilityWeights: { attentionDistribution: 0.3, prediction: 0.25, decisionQuality: 0.3, taskSwitching: 0.15 },
    preferenceWeights: { teamCoordination: 0.45, mapInfluencePreference: 0.35, stabilityPreference: 0.2 },
  },
  {
    id: 'ranged-specialist', name: 'レンジのスペシャリスト',
    description: '距離を保ちながら、命中と位置取りを同時に積み上げる傾向です。',
    signals: ['clickAccuracy', 'prediction', 'attentionDistribution'],
    abilityWeights: { clickAccuracy: 0.3, prediction: 0.25, attentionDistribution: 0.2, reaction: 0.15, inputControl: 0.1 },
    preferenceWeights: { rangePreference: 0.75, lateGameFocus: 0.25 },
  },
  {
    id: 'creative-risk-taker', name: '創造的なリスクテイカー',
    description: '高い変化量を恐れず、操作と判断で予想外の勝ち筋を作る傾向です。',
    signals: ['inputControl', 'reaction', 'decisionSpeed'],
    abilityWeights: { inputControl: 0.25, reaction: 0.2, decisionSpeed: 0.2, prediction: 0.2, taskSwitching: 0.15 },
    preferenceWeights: { riskTaking: 0.45, highVariancePreference: 0.35, complexityEnjoyment: 0.2 },
  },
];

function valueFor(values: AbilityVector | ScoreMap, key: string): number {
  const value = (values as Record<string, number | undefined>)[key];
  return typeof value === 'number' ? Math.min(1, Math.max(0, value)) : 0.5;
}

function scoreTitle(definition: TitleDefinition, abilities: AbilityVector, preferences: ScoreMap): number {
  const abilityEntries = Object.entries(definition.abilityWeights);
  const preferenceEntries = Object.entries(definition.preferenceWeights);
  const abilityWeight = abilityEntries.reduce((sum, [, weight]) => sum + (weight ?? 0), 0);
  const preferenceWeight = preferenceEntries.reduce((sum, [, weight]) => sum + weight, 0);
  const abilityScore = abilityEntries.reduce((sum, [key, weight]) => sum + valueFor(abilities, key) * (weight ?? 0), 0) / abilityWeight;
  const preferenceScore = preferenceEntries.reduce((sum, [key, weight]) => sum + valueFor(preferences, key) * weight, 0) / preferenceWeight;
  return abilityScore * 0.75 + preferenceScore * 0.25;
}

export function deriveAptitudeTitle(abilities: AbilityVector, preferences: ScoreMap): AptitudeTitle {
  return TITLE_DEFINITIONS.reduce((best, candidate) => (
    scoreTitle(candidate, abilities, preferences) > scoreTitle(best, abilities, preferences) ? candidate : best
  ));
}
