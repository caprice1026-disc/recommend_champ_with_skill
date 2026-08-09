export type Action = 'click' | 'rightClick' | 'q' | 'e';

export const KEY_SEQUENCE = ['q', 'w', 'e', 'r'] as const;

export interface PredictionPoint {
  x: number;
  y: number;
}

export function interpolatePredictionPosition(start: PredictionPoint, end: PredictionPoint, progress: number): PredictionPoint {
  const normalized = Math.min(1, Math.max(0, progress));
  return {
    x: start.x + (end.x - start.x) * normalized,
    y: start.y + (end.y - start.y) * normalized,
  };
}

export function predictionTrailPoints(start: PredictionPoint, end: PredictionPoint, count: number): PredictionPoint[] {
  const pointCount = Math.max(2, Math.floor(count));
  return Array.from({ length: pointCount }, (_, index) => interpolatePredictionPosition(start, end, index / (pointCount - 1)));
}

const REACTION_DELAY_MIN = 650;
const REACTION_DELAY_MAX = 2200;
const REACTION_DELAY_GAP = 250;

export function isPreferenceSetComplete(questionKeys: readonly string[], completedKeys: ReadonlySet<string>): boolean {
  return questionKeys.length > 0 && questionKeys.every((key) => completedKeys.has(key));
}

export type ViewportStatus = 'ready' | 'warning';

export function viewportStatus(width: number, height: number): ViewportStatus {
  return width >= 1024 && height >= 640 ? 'ready' : 'warning';
}

export function countValidTrials(scores: readonly number[], threshold: number): number {
  return scores.filter((score) => score >= threshold).length;
}

export function nextReactionDelay(randomValue: number, previous: number | null): number {
  const normalized = Math.min(1, Math.max(0, randomValue));
  const candidate = Math.round(REACTION_DELAY_MIN + normalized * (REACTION_DELAY_MAX - REACTION_DELAY_MIN));
  if (previous === null || Math.abs(candidate - previous) >= REACTION_DELAY_GAP) return candidate;

  const alternatives = [candidate + REACTION_DELAY_GAP, candidate - REACTION_DELAY_GAP, REACTION_DELAY_MIN, REACTION_DELAY_MAX];
  return alternatives.find((value) => value >= REACTION_DELAY_MIN && value <= REACTION_DELAY_MAX && Math.abs(value - previous) >= REACTION_DELAY_GAP) ?? REACTION_DELAY_MAX;
}

const COMPOUND_SEQUENCE_TEMPLATES: Action[][] = [
  ['click', 'q', 'rightClick'],
  ['rightClick', 'e', 'click', 'q'],
  ['q', 'click', 'e', 'rightClick'],
  ['click', 'e', 'rightClick', 'q'],
  ['q', 'rightClick', 'click', 'e'],
  ['rightClick', 'q', 'click', 'e', 'click'],
  ['e', 'click', 'rightClick', 'q'],
  ['click', 'rightClick', 'e', 'q'],
  ['e', 'rightClick', 'q', 'click'],
];

export function buildCompoundSequences(total: number, random: () => number = Math.random): Action[][] {
  const shuffled = COMPOUND_SEQUENCE_TEMPLATES.map((sequence) => [...sequence]);
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.min(0.999999, Math.max(0, random())) * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return Array.from({ length: total }, (_, index) => [...shuffled[index % shuffled.length]]);
}

export interface TaskSwitchRule {
  phase: 'basic' | 'changed';
  actions: Record<'teal' | 'amber' | 'violet', Action>;
  labels: Record<'teal' | 'amber' | 'violet', string>;
}

export function ruleForTaskSwitch(trial: number, total: number): TaskSwitchRule {
  if (trial >= Math.floor(total / 2)) {
    return {
      phase: 'changed',
      actions: { teal: 'q', amber: 'click', violet: 'e' },
      labels: { teal: 'Q', amber: 'クリック', violet: 'E' },
    };
  }
  return {
    phase: 'basic',
    actions: { teal: 'click', amber: 'q', violet: 'rightClick' },
    labels: { teal: 'クリック', amber: 'Q', violet: '右クリック' },
  };
}

export interface DecisionOption {
  title: string;
  detail: string;
  correct: boolean;
}

export interface DecisionScenario {
  prompt: string;
  options: DecisionOption[];
}

export function scoreDecisionAnswers(scenarios: readonly DecisionScenario[], answers: readonly (number | null)[]): { answered: number; correct: number } {
  return answers.reduce(
    (result, selectedIndex, questionIndex) => {
      if (selectedIndex === null) return result;
      const scenario = scenarios[questionIndex % scenarios.length];
      const option = scenario?.options[selectedIndex];
      return {
        answered: result.answered + 1,
        correct: result.correct + (option?.correct ? 1 : 0),
      };
    },
    { answered: 0, correct: 0 },
  );
}

export const DECISION_SCENARIOS: DecisionScenario[] = [
  {
    prompt: '味方の人数が揃わず、相手の位置も見えていない状態でオブジェクト前の判断をします。',
    options: [
      { title: '視界を確保して待つ', detail: '情報を増やし、味方が揃うまで待機する', correct: true },
      { title: '先に一人で仕掛ける', detail: '現在の人数差のまま接触を始める', correct: false },
      { title: '目的を放棄して別レーンへ急ぐ', detail: 'この場所を離れ、別レーンへ向かう', correct: false },
    ],
  },
  {
    prompt: '相手の主力がマップ反対側に見え、短い時間だけ安全に人数差を作れます。',
    options: [
      { title: '何もしないで戻る', detail: 'マップ反対側へ戻り、確認できた人数差を使わない', correct: false },
      { title: '小さな目標を素早く取る', detail: '短い時間で一つの目標を取り、撤退する', correct: true },
      { title: '深追いして全目標を狙う', detail: '複数の目標へ続けて向かう', correct: false },
    ],
  },
  {
    prompt: '自分は有利ですが、次の戦闘に負けると逆転される状況です。',
    options: [
      { title: '安全な位置で波を整える', detail: '次の戦闘まで、位置を保って波を整える', correct: true },
      { title: '視界のない場所へ単独で入る', detail: '視界のない場所へ単独で入る', correct: false },
      { title: '味方の合図を待たずに開始する', detail: '味方の合図を待たずに開始する', correct: false },
    ],
  },
  {
    prompt: '残り時間が少なく、成功すれば勝ち、失敗しても次の手が残る場面です。',
    options: [
      { title: '最も実行しやすい手を選ぶ', detail: '次の選択肢を残したまま手を進める', correct: true },
      { title: '最大のリターンだけを狙う', detail: '一度の結果が大きい手だけを狙う', correct: false },
      { title: '判断を先延ばしにする', detail: '追加の情報を待ちながら残り時間を使う', correct: false },
    ],
  },
  {
    prompt: '味方が先に倒れ、相手の追撃ルートが複数ある状態で撤退を選びます。',
    options: [
      { title: '最短距離で一人だけ逃げる', detail: '最短距離で一人だけ移動する', correct: false },
      { title: '相手の進路を一度止めて退く', detail: '相手の進路を一度止めて退く', correct: true },
      { title: '全員で相手の中心へ戻る', detail: '全員で相手の中心へ戻る', correct: false },
    ],
  },
  {
    prompt: '相手の重要なスキルが使用済みで、味方の主力がすぐに合流できます。',
    options: [
      { title: '合流を待ってから圧力をかける', detail: '味方の合流後に圧力をかける', correct: true },
      { title: '条件を無視して単独で攻める', detail: '条件を待たず単独で攻める', correct: false },
      { title: '相手に自由な時間を渡す', detail: '相手が行動できる時間を残す', correct: false },
    ],
  },
];
