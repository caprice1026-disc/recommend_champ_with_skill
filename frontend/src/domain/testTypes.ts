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

export interface TestResult {
  testId: TestId;
  score: number;
  quality: number;
  abilityKeys: AbilityKey[];
  validTrials: number;
  totalTrials: number;
  completed: boolean;
  rawTrialCount: number;
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
  { id: 'prediction', name: '軌道予測', group: '認知・予測', description: '移動する対象が消えた後の位置を先読みします。', operation: '対象が消えたあと、到達すると予測した場所をクリックしてください。', },
  { id: 'attentionDistribution', name: '注意分配', group: '認知・予測', description: '中央の操作を続けながら、周辺の変化にも気づきます。', operation: '中央の円を追いながら、周辺の記号が出たらSpaceを押してください。', },
  { id: 'taskSwitching', name: 'タスク切り替え', group: '認知・予測', description: '途中で変わるルールを保持し、素早く切り替えます。', operation: '色と記号に応じて、クリック・Q・無視を切り替えてください。', },
  { id: 'decision', name: '判断', group: '判断', description: '限られた情報と時間から、状況に合う選択を行います。', operation: '状況を読み、もっとも妥当だと思う選択肢を選んでください。', },
  { id: 'mentalStability', name: 'メンタル安定性', group: 'メンタル', description: '通常・プレッシャー・回復の変化を、軽い演出の中で測定します。', operation: '演出の目的を理解した上で、いつでも中断できます。', },
];

export function definitionFor(testId: TestId): TestDefinition {
  return TEST_DEFINITIONS.find((definition) => definition.id === testId) ?? TEST_DEFINITIONS[0];
}
