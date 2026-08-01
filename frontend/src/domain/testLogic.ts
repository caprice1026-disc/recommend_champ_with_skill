export type Action = 'click' | 'rightClick' | 'q' | 'e';

export const KEY_SEQUENCE = ['q', 'w', 'e', 'r'] as const;

const REACTION_DELAY_MIN = 650;
const REACTION_DELAY_MAX = 2200;
const REACTION_DELAY_GAP = 250;

export function isPreferenceSetComplete(questionKeys: readonly string[], completedKeys: ReadonlySet<string>): boolean {
  return questionKeys.length > 0 && questionKeys.every((key) => completedKeys.has(key));
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

export const DECISION_SCENARIOS: DecisionScenario[] = [
  {
    prompt: '味方の人数が揃わず、相手の位置も見えていない状態でオブジェクト前の判断をします。',
    options: [
      { title: '視界を確保して待つ', detail: '情報を増やし、味方が揃うまで安全に時間を使う', correct: true },
      { title: '先に一人で仕掛ける', detail: '成功すれば主導権を取れるが、孤立しやすい', correct: false },
      { title: '目的を放棄して別レーンへ急ぐ', detail: '接敵を避けるが、相手に主導権を渡す', correct: false },
    ],
  },
  {
    prompt: '相手の主力がマップ反対側に見え、短い時間だけ安全に人数差を作れます。',
    options: [
      { title: '何もしないで戻る', detail: '安全だが、確認できた有利な時間を失う', correct: false },
      { title: '小さな目標を素早く取る', detail: '安全な範囲で確実な利益を得て撤退する', correct: true },
      { title: '深追いして全目標を狙う', detail: '利益は大きいが、帰り道の危険が増える', correct: false },
    ],
  },
  {
    prompt: '自分は有利ですが、次の戦闘に負けると逆転される状況です。',
    options: [
      { title: '安全な位置で波を整える', detail: '有利を維持し、相手に無理な選択を迫る', correct: true },
      { title: '視界のない場所へ単独で入る', detail: '一気に差を広げられるが、失敗時の損失が大きい', correct: false },
      { title: '味方の合図を待たずに開始する', detail: '相手の準備前を狙うが、連携が崩れやすい', correct: false },
    ],
  },
  {
    prompt: '残り時間が少なく、成功すれば勝ち、失敗しても次の手が残る場面です。',
    options: [
      { title: '最も成功率の高い手を選ぶ', detail: '勝ち筋を確実に残し、不要な賭けを避ける', correct: true },
      { title: '最大のリターンだけを狙う', detail: '一度の成功に依存し、失敗時の余地を減らす', correct: false },
      { title: '判断を先延ばしにする', detail: '情報は増えるが、残り時間を失う', correct: false },
    ],
  },
  {
    prompt: '味方が先に倒れ、相手の追撃ルートが複数ある状態で撤退を選びます。',
    options: [
      { title: '最短距離で一人だけ逃げる', detail: '自分は逃げやすいが、味方を分断する', correct: false },
      { title: '相手の進路を一度止めて退く', detail: '味方の退路を作り、損失を限定する', correct: true },
      { title: '全員で相手の中心へ戻る', detail: '逆転の可能性はあるが、連続撃破されやすい', correct: false },
    ],
  },
  {
    prompt: '相手の重要なスキルが使用済みで、味方の主力がすぐに合流できます。',
    options: [
      { title: '合流を待ってから圧力をかける', detail: '有利な条件を揃えてから、成功率を高める', correct: true },
      { title: '条件を無視して単独で攻める', detail: '先手は取れるが、味方の強みを使えない', correct: false },
      { title: '相手に自由な時間を渡す', detail: '安全だが、使用済みスキルの有利が消える', correct: false },
    ],
  },
];
