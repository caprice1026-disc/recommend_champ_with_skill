# LoLスキルラボ 診断プレイ体験修正 Implementation Plan

このExecPlanは生きた計画書であり、リポジトリの`PLANS.md`に従って更新する。目的は、GitHub Issue #1〜#10を実装・検証し、ブラウザで正しく遊べる診断へ戻すことである。

## Purpose / Big Picture

利用者が練習と本番の境界を認識し、QWER校正を正しく完了し、全質問への回答方法を選べるようにする。予測・注意分配・タスク切替の課題では、開始前の説明だけで入力方法を理解できるようにする。試行刺激は固定パターンを避け、判断テストは異なる状況を出題する。完了後は`http://localhost:5173/`で全診断を操作し、回帰テスト、lint、buildを通してからブランチをGitHubへPushする。

## Progress

- [x] (2026-08-01) Issue #1〜#10と実機での再現結果を整理した。
- [x] (2026-08-01) `TestStage.tsx`、`App.tsx`の根本原因を確認した。
- [x] (2026-08-01) 作業ブランチ`codex/diagnosis-playability-fixes`を作成した。
- [x] (2026-08-01) 設計書とExecPlanを作成した。
- [x] (2026-08-01) 共通テストロジックの失敗テストを追加し、6テストを最小実装で通した。
- [x] (2026-08-01) 質問・校正・ラウンド遷移を修正した。
- [x] (2026-08-01) 各テストの説明、ランダム性、ルール表示、判断シナリオを修正した。
- [x] (2026-08-01) 全検証を実行し、ブラウザで受入条件を確認した。
- [ ] 意図したファイルだけをコミットし、GitHubへPushする。

## Surprises & Discoveries

- Observation: 校正画面の`latencies`配列はポインター3件を含んだままキーボード入力数の判定に使われていた。
  Evidence: `frontend/src/App.tsx`のキーボード処理が`next.length >= 4`で完了し、ポインター3回後のQで完了する。
- Observation: 練習の進捗表示は入力前の`trial + 1`を表示するため、8/8と表示されても最後の入力が残っている。
  Evidence: `TaskSwitchRound`の`trial`と表示文の実装。最後の入力で`onDone`が呼ばれる。
- Observation: 注意分配の`requestAnimationFrame`とイベントタイマーが`seconds`変更ごとに再作成される。
  Evidence: `AttentionRound`のエフェクト依存配列が`[seconds]`になっている。
- Observation: タスク切替後の実際のアクションはQ・クリック・Eなのに、画面文は変更前のクリック・Q・右クリックを表示している。
  Evidence: `TaskSwitchRound`の`ruleChanged`分岐と固定表示文。
- Observation: 実ブラウザでは、練習完了画面を保持して本番開始ボタンを明示操作でき、QWERはQだけでは完了しなかった。
  Evidence: `http://localhost:5173/`での通し操作。QWER表示は1/4→2/4→4/4となり、練習完了後は本番開始ボタンが表示された。
- Observation: 全8テストを実操作で完了し、結果画面まで到達した。
  Evidence: フロントエンドのブラウザログはwarn/error 0件だった。

## Decision Log

- Decision: 練習完了後の本番開始を利用者の明示操作に統一する。
  Rationale: 100msの自動遷移は視認できず、入力中に次ラウンドへ進むため。
  Date/Author: 2026-08-01 / Codex
- Decision: ランダム生成を純粋関数へ分離する。
  Rationale: 刺激の重複回避とルール整合性を単体テストで確認できるため。
  Date/Author: 2026-08-01 / Codex
- Decision: 詳細な画像教材ではなく、各テストに3段階のテキスト・視覚ガイドを表示する。
  Rationale: 既存のダークテーマと測定領域を崩さず、初見の操作順を明確にできるため。
  Date/Author: 2026-08-01 / Codex

## Outcomes & Retrospective

10 Issueを修正した。質問完了集合、QWER独立カウンタ、明示的な練習・本番境界、広い反応待機分布、予測・注意分配・タスク切替ガイド、動的な入力列、変更後ルール表示、6種類の判断シナリオを実装した。フロントエンドはVitest 14件、lint、buildが成功し、バックエンドは6件成功した。ブラウザでは全8テストを結果画面まで完了し、console warn/errorは0件だった。残る制約は、ランダム性の統計的品質を単体テストで保証するのではなく、範囲・重複回避・規則整合性として保証している点である。

## Context and Orientation

`frontend/src/App.tsx`は画面遷移、好み質問、環境確認、校正、結果画面を担当する。`frontend/src/features/tests/TestStage.tsx`は8種類のテストの練習・本番状態を担当する。`frontend/src/domain/testTypes.ts`にはテスト名と開始説明があり、`frontend/src/domain/__tests__`にはVitestの既存テストがある。Reactコンポーネントはまだ大きな単一ファイルだが、今回の修正では既存構造を保ち、ランダム生成とシナリオデータだけを純粋ロジックへ分離する。

## Plan of Work

まず`testLogic.ts`に反応待機時間、複合入力列、タスク切替規則・刺激、判断シナリオを定義し、期待する制約を失敗テストで固定する。次に`App.tsx`で質問の完了集合とキーボード校正の独立カウンタを導入する。`TestStage.tsx`では、開始説明、明示的ラウンド遷移、各テストのロジック利用、表示文を修正する。注意分配はアニメーション位置をstateで再描画し、タイマーを一度だけ作成する。最後にCSSを追加してガイドとルール変更表示を読みやすくし、全検証とブラウザ操作を実行する。

## Concrete Steps

1. `frontend/src/domain/testLogic.ts`と`frontend/src/domain/__tests__/testLogic.test.ts`を作成する。反応遅延の範囲・近接値回避、複合入力列の重複回避、変更前後のタスク規則、判断シナリオの非反復をテストする。
2. `frontend/src/App.tsx`の好み質問を、回答または個別スキップ済みキー集合で管理する。全問完了前は通常の同意設定ボタンを無効化し、`すべてスキップして進む`で既定値を確定する。校正のキーボード進捗をポインターlatencyから分離する。
3. `frontend/src/features/tests/TestStage.tsx`の`handleDone`から自動タイマーを削除する。開始説明では練習・本番のラベルを正しく出し、予測と注意分配に3段階ガイドを追加する。
4. 反応、複合入力、タスク切替、判断を`testLogic.ts`の生成結果から動かす。タスク切替後の対応表を実ロジックに合わせ、変更バナーと最終入力表示を追加する。
5. `AttentionRound`の位置state、単一タイマー、イベント表示を修正し、`testTypes.ts`の説明文をUIの実操作と一致させる。必要なスタイルを`frontend/src/styles.css`へ追加する。
6. `frontend`で回帰テスト、lint、buildを実行する。失敗があれば原因を特定して修正し、再実行する。
7. 開発サーバー上で校正、好み質問、各テストの説明・練習・本番・結果をブラウザ操作し、Issue #1〜#10の受入条件を確認する。
8. `git status -sb`と`git diff --stat`で対象ファイルを確認し、設計書・実装・テストだけをコミットして`git push -u origin codex/diagnosis-playability-fixes`する。

## Validation and Acceptance

`frontend`で`npm.cmd run test:run`は既存テストと新規テストがすべて成功すること、`npm.cmd run lint`と`npm.cmd run build`が終了コード0になることを確認する。ブラウザでQだけでは校正が完了せず、未回答の好み質問から通常進行できず、練習完了画面が保持されることを確認する。予測・注意分配のガイド、変更後タスク規則、複数の判断シナリオが表示されることも確認する。

## Idempotence and Recovery

テストとbuildは読み取り中心で再実行できる。開発サーバーが残っている場合は既存プロセスを再利用し、UI変更後にブラウザをreloadする。コミット前に未関係の変更を確認し、設計書以外の既存未追跡ファイルはステージしない。Pushが拒否された場合はremoteの進行を確認し、force pushは行わない。

## Interfaces and Dependencies

`testLogic.ts`はReactに依存しない。`nextReactionDelay(randomValue: number, previous: number | null): number`は650〜2200msの待機を返す。`buildCompoundSequences(total: number, random: () => number): Action[][]`は同一配列を連続生成しない。`ruleForTaskSwitch(trial: number, total: number)`は変更前後の色とActionの対応を返す。`DECISION_SCENARIOS`は各シナリオに見出しと選択肢配列を持ち、各選択肢に正誤を持つ。UIはこれらを読み取り、測定結果のプライバシー境界や既存の`TestResult`契約を変更しない。

## Revision Note

2026-08-01: GitHub Issue #1〜#10の実機再現結果をもとに初版を作成した。
2026-08-01: 実装、14フロントテスト、6バックエンドテスト、lint、build、全8テストのブラウザ確認を反映した。Push後にブランチとコミットを追記する。
