import type { AbilityKey } from './types';

export type TestId =
  | 'reaction'
  | 'clickAccuracy'
  | 'inputControl'
  | 'prediction'
  | 'attentionDistribution'
  | 'taskSwitching'
  | 'decision'
  | 'mentalStability';

export type TestMode = 'quick' | 'detailed' | 'retest';

export interface ReactionMetrics {
  responseTimesMs: number[];
  falseStarts: number;
}

export interface ClickMetrics {
  hitRate: number;
  centerAccuracy: number;
  smallTargetAccuracy: number;
  longDistanceAccuracy: number;
  movingTargetAccuracy: number;
  continuousAccuracy: number;
}

export interface InputMetrics {
  mouseSequenceControl: number;
  keyboardSequenceControl: number;
  mouseKeyboardCoordination: number;
  rhythmStability: number;
  misinputSuppression: number;
}

export interface AttentionMetrics {
  peripheralEvents: number;
  peripheralHits: number;
  trackingRetention: number;
  trackingMeanDistance: number;
}

export interface DecisionMetrics {
  responseTimesMs: number[];
  correctAnswers: boolean[];
  answerChanges: number;
  timeouts: number;
  speedScore: number;
}

export interface MentalMetrics {
  normalScores: number[];
  pressureScores: number[];
  recoveryScores: number[];
  pressureDegradation: number;
  recoveryTrialCountScore: number;
  recoverySlopeScore: number;
  failureChainSuppression: number;
}

export interface TestMetrics {
  reaction?: ReactionMetrics;
  click?: ClickMetrics;
  input?: InputMetrics;
  attention?: AttentionMetrics;
  decision?: DecisionMetrics;
  mental?: MentalMetrics;
  dispersionScore?: number;
  frameStabilityScore?: number;
  inputStabilityScore?: number;
}

export interface TestResult {
  testId: TestId;
  score: number;
  quality: number;
  abilityKeys: AbilityKey[];
  validTrials: number;
  totalTrials: number;
  completed: boolean;
  rawTrialCount: number;
  metrics?: TestMetrics;
}

export interface TestDefinition {
  id: TestId;
  name: string;
  group: string;
  description: string;
  operation: string;
}

export const TEST_DEFINITIONS: TestDefinition[] = [
  { id: 'reaction', name: '反応速度', group: '基礎操作', description: '表示状態が変わった瞬間に、正確に反応します。', operation: '青緑の測定領域が変わったらクリックしてください。', },
  { id: 'clickAccuracy', name: 'クリック精度', group: '基礎操作', description: 'ターゲットの中心を狙い、速度と正確さのバランスを測定します。', operation: '同心円ターゲットの中心をクリックしてください。', },
  { id: 'inputControl', name: '複合入力制御', group: '基礎操作', description: 'マウスとキーボードを順番に組み合わせます。', operation: '画面上の手順を確認し、ターゲットとキーを順番に操作してください。', },
  { id: 'prediction', name: '軌道予測', group: '認知・予測', description: '移動する対象が消えた後の位置を先読みします。', operation: '対象を観察し、消えた後に到着すると予測した場所をクリックしてください。', },
  { id: 'attentionDistribution', name: '注意分配', group: '認知・予測', description: '中央の円を追いながら、周辺の変化にも気づきます。', operation: 'ポインターで中央の円を追い、周辺にSPACEが出たらSpaceキーを押してください。', },
  { id: 'taskSwitching', name: 'タスク切り替え', group: '認知・予測', description: '途中で変わるルールを保持し、素早く切り替えます。', operation: 'ターゲットの色を確認し、画面下の最新ルールに対応するクリック・Q・Eを入力してください。', },
  { id: 'decision', name: '判断', group: '判断', description: '限られた情報と時間から、状況に合う選択を行います。', operation: '状況を読み、もっとも妥当だと思う選択肢を選んでください。', },
  { id: 'mentalStability', name: 'メンタル安定性', group: 'メンタル', description: '通常・プレッシャー・回復の変化を、軽い演出の中で測定します。', operation: '演出の目的を理解した上で、いつでも中断できます。', },
];

export function definitionFor(testId: TestId): TestDefinition {
  return TEST_DEFINITIONS.find((definition) => definition.id === testId) ?? TEST_DEFINITIONS[0];
}
