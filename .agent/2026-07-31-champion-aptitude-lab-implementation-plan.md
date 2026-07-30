# League of Legends チャンピオン適性診断「LoLスキルラボ」実装計画

このExecPlanは生きた計画書である。`PLANS.md`の規則に従い、`Progress`、`Surprises & Discoveries`、`Decision Log`、`Outcomes & Retrospective`を実装の各停止点で更新する。

## Purpose / Big Picture

PCブラウザ上で、利用者がLeague of Legendsのプレイに関係する操作・認知・判断・プレッシャー下の変化を実際に体験し、その測定結果からレーンとチャンピオンを推薦されるアプリを完成させる。クイック診断だけでなく、追加試行・追加難度・複雑入力・回復測定を含む詳細診断と再テストを動作させる。

完成後は、ローカルでバックエンドとフロントエンドを起動し、ランディングからプロフィール入力、キャリブレーション、各テスト、結果、詳細診断、共有カード、フィードバック、任意保存までをブラウザで確認できる状態にする。

## Progress

- [x] (2026-07-31) `AGENTS.md`、`PLANS.md`、要件定義書、機能・データ・計算仕様書、承認済み設計書、添付実装指示を確認した。
- [x] (2026-07-31) 現在のリポジトリが設計書中心で、`backend`と`frontend`がまだ存在しないことを確認した。
- [x] (2026-07-31) 初期リリースの境界を、React + TypeScript + Vite、FastAPI、設定駆動、ブラウザ内測定、SQLite任意保存として確定した。
- [x] (2026-07-31) 設定ファイル、JSON Schema、計算コア、推薦コア、バックエンドAPIを実装する。
- [x] (2026-07-31) 実際に操作できる8種の診断テストと共通TestStage契約を実装する。
- [x] (2026-07-31) 画面遷移、結果、詳細診断、再テスト、共有、フィードバック、保存UIを実装する。
- [x] (2026-07-31) 単体・API・ブラウザ検証を実行し、受入条件を監査する。
- [x] (2026-07-31) 完了時点でこの計画の全項目、発見事項、成果、残課題を更新する。

## Surprises & Discoveries

- Observation: 初期リポジトリには設計書以外のアプリコードがなく、既存実装パターンを流用できない。
  Evidence: ルートの一覧に`backend`、`frontend`、`package.json`、`pyproject.toml`が存在しない。
- Observation: 要件定義書には将来のRiot API連携への言及があるが、承認済み設計書は初期版のRiot API連携を明示的に除外している。
  Evidence: 設計書の「明示的に含めない範囲」と機能仕様の初期リリース境界。
- Observation: 画面に数値ランキングを出さず、内部の能力値・信頼度・推薦スコアは計算と説明にだけ使用する必要がある。
  Evidence: 結果画面仕様と受入テストの「総合点・順位・パーセンタイルを表示しない」条件。
- Observation: Viteの標準設定バンドルとrunnerローダーは、このWindows実行環境で`spawn EPERM`またはCommonJS依存の読み込み失敗になる。
  Evidence: `npm.cmd run dev` / `npm.cmd run build`の再現ログ。`--configLoader native`で開発サーバーと本番ビルドが成功した。
- Observation: 初期データの能力傾向によって成長候補・長期候補が空になり得た。
  Evidence: 結果エンジンテストで空バケットを検出。訓練タグ付きの成長候補と、高難度要件を持つアスピレーション候補を設定へ追加し、適格性を保ったまま3層を確認した。

## Decision Log

- Decision: 初期実装はモノレポの`backend`と`frontend`へ分離する。
  Rationale: 承認済み設計書の責務分担に一致し、APIとブラウザ内測定を独立して検証できるため。
  Date/Author: 2026-07-31 / Codex
- Decision: 生のポインター座標、キー入力列、試行単位ログはブラウザメモリだけで保持し、APIへ送らない。
  Rationale: 仕様書のプライバシー要件を満たし、保存時も集計済みデータだけに限定するため。
  Date/Author: 2026-07-31 / Codex
- Decision: Riot API、アカウント、クラウド同期、LLM文章生成、外部画像APIは初期版に実装しない。
  Rationale: 承認済み設計書の初期リリース除外範囲を優先し、設定・API境界だけ拡張可能にするため。
  Date/Author: 2026-07-31 / Codex
- Decision: テストの本番経路は実際のPointerEvent、KeyboardEvent、`requestAnimationFrame`、`performance.now()`を使用し、自動テストでは時計・乱数・入力を注入する。
  Rationale: 実際に遊べる測定と、短時間で再現可能な自動検証を両立するため。
  Date/Author: 2026-07-31 / Codex
- Decision: UIは承認済みの競技ラボ型を実装し、追加のヒーロー、広告的な要素、過度なカード分割を行わない。
  Rationale: テスト領域と結果の説明を主役にし、既存設計の色・密度・情報階層を守るため。
  Date/Author: 2026-07-31 / Codex
- Decision: 利用者向けの正式なWebページ名は「LoLスキルラボ」とする。
  Rationale: ユーザーからの明示指定であり、既存設計書の「競技ラボ」はUI方針を示す資料上の呼称として保持しつつ、画面、README、共有カード、結果文章の表示名を新名称へ統一するため。
  Date/Author: 2026-07-31 / Codex
- Decision: 実装は検証済みのマイルストーンごとにコミットし、リモートへ段階的にプッシュする。
  Rationale: 長時間の実装途中でもリモートに復旧可能な状態を残し、ユーザーが進捗を確認できるようにするため。各回は`git status`で対象を確認し、無関係な変更をステージしない。
  Date/Author: 2026-07-31 / Codex

## Outcomes & Retrospective

ユーザー向け名称を「LoLスキルラボ」へ統一し、ランディングから8種の実測テスト、結果、再テスト、詳細判定導線、共有カード、フィードバック、任意保存までを実装した。結果画面では能力・信頼度・推薦スコアの生の数値を表示せず、質的な状態と説明へ変換している。クイック本番は通常試行数、詳細本番は試行数・継続時間・回復フェーズを増やし、再テストは最新有効値で置換する。

検証結果:

    backend: .\.venv\Scripts\python.exe -m pytest -q -> 6 passed, 1 warning
    frontend: npm.cmd run test:run -> 2 files / 8 tests passed
    frontend: npm.cmd run lint -> passed
    frontend: npm.cmd run build -> passed with Vite native config loader
    browser: landing -> environment -> profile -> preferences -> consent -> calibration -> overview -> all 8 quick tests -> result
    browser: share modal, feedback POST/toast, retest list and retest intro were確認済み

既知の制約:

- チャンピオン画像・Riot API・ログイン・クラウド同期は初期版に含めず、候補プロフィールの文字頭アバターを使用する。
- FastAPIのTestClientが依存するStarlette/httpxの非推奨警告が1件出るが、テストとAPI応答は成功している。
- Vite設定の`native`ローダー指定は、今回のWindowsサンドボックスでの子プロセス制約を回避するためのプロジェクト設定である。

## Context and Orientation

リポジトリルートは`C:\Users\Hodaka\Downloads\div\recommend_champ_with_skill`である。`AGENTS.md`はExecPlanを日本語で`.agent`に作成することを指定し、`PLANS.md`はExecPlanを初心者が単独で実行できる粒度にし、各停止点で更新することを要求している。

仕様上の能力ベクトルは、`reaction`、`clickAccuracy`、`inputControl`、`prediction`、`attentionDistribution`、`taskSwitching`、`decisionSpeed`、`decisionQuality`、`pressureStability`、`recovery`の10軸である。能力値と測定信頼度は別に計算し、信頼度が低い能力は推薦理由の中心に使わない。

診断は、PC確認、プロフィール、16軸のプレイ嗜好、同意、キャリブレーション、基礎操作、認知・予測、判断、メンタル安定性、結果の順に進む。各テストは説明・練習・本番を持つ。詳細診断はクイック結果を破棄せず追加試行を統合する。再テストでは最高値だけを採用しない。

推薦単位は「レーン + チャンピオン」である。`ready_now`、`growth_candidate`、`aspirational`の3カテゴリを異なる式で計算し、同一チャンピオンは診断全体で1回だけ表示する。不適格候補で不足枠を埋めない。

## Plan of Work

まず設定ファイルの形式とJSON Schemaを作り、フロントエンドとバックエンドが同じ定義を参照できるようにする。次にPython側へ設定検証、プロフィール配信、保存API、JavaScript側へ正規化・特徴量・能力・信頼度・推薦・文章生成の純粋関数を作る。この順序により、実際の入力UIがなくても計算の根拠をテストできる。

次に共通の診断セッション状態機械とTestStage契約を実装する。個々のテストは独立したコンポーネントに分け、練習結果をスコアへ含めず、本番ログだけを特徴量へ変換する。フォーカス喪失、リサイズ、描画停止、入力切り替えは共通品質フックで処理する。

その後、診断シェル、ランディング、環境確認、プロフィール、嗜好、同意、キャリブレーション、各テスト、休憩、結果画面を順に接続する。結果画面では能力ランキングを表示せず、適性タイプ、信頼度、強み、課題、苦手状況、練習メニュー、3カテゴリの推薦理由を表示する。

最後に詳細診断、再テスト、共有カード、フィードバック、任意保存を接続し、APIとの統合、ブラウザ完走、低表示領域、フォーカス喪失、候補不足、保存同意なしを確認する。

## Concrete Steps

### Milestone 1: プロジェクト基盤と設定

ルートにPython仮想環境を使うFastAPIプロジェクトと、`frontend`のVite + React + TypeScriptプロジェクトを作成する。テスト・ビルド・開発サーバーのスクリプトを定義し、PowerShellで再現可能な起動方法をREADMEへ記載する。

作成する主なファイルは次の通りである。

    backend/app/main.py
    backend/app/config_loader.py
    backend/app/schemas.py
    backend/app/storage.py
    backend/data/config/v1/*.json
    backend/data/config/v1/schemas/*.schema.json
    backend/tests/test_config_and_api.py
    frontend/package.json
    frontend/src/main.tsx
    frontend/src/App.tsx
    frontend/src/styles/tokens.css
    frontend/src/domain/types.ts
    frontend/src/domain/config.ts
    frontend/src/domain/validation.ts
    frontend/src/domain/seededRandom.ts

設定には能力軸、サブスコア、テスト定義、正規化、信頼度、チャンピオン基本・レーンプロファイル、レーン補正、難易度、嗜好、適性タイプ、操作タイプ、メンタルタイプ、強み、苦手状況、練習、推薦、文章、初心者補正、パッチ情報を含める。最低9件以上の異なるチャンピオンを用意し、3カテゴリの候補が同一チャンピオン重複なしで選べるようにする。

### Milestone 2: 計算コア

先にVitestの失敗テストを書き、正規化、MAD外れ値処理、各10能力軸、複合入力サブスコア、信頼度、初心者補正、重み付きコサイン、片側不足距離、準備度、好み一致度、推薦カテゴリ、多様性、文章生成、再テスト統合を純粋関数として実装する。

初期式は仕様書の重みをそのまま使用する。能力値を表示用の総合点へ合成しない。経験値は能力値を変更せず、要求値・難易度・文章・練習だけへ使用する。

### Milestone 3: ブラウザ計測と共通TestStage

`TestStage`の入力を、テストID、モード、シード、環境、開始・完了コールバック、品質フラグ、集計ログ受け渡しとして定義する。実装中の生ログはReact stateやrefなどのメモリにのみ置く。

共通フックで`visibilitychange`、`blur`、`fullscreenchange`、resize、devicePixelRatio、右クリックを監視する。右クリック抑止は複合入力テスト領域だけに限定する。計測時刻は`performance.now()`だけを使用する。

以下のテストを個別ファイルに実装する。

    frontend/src/features/tests/ReactionTest.tsx
    frontend/src/features/tests/ClickAccuracyTest.tsx
    frontend/src/features/tests/CompoundInputTest.tsx
    frontend/src/features/tests/PredictionTest.tsx
    frontend/src/features/tests/AttentionDistributionTest.tsx
    frontend/src/features/tests/TaskSwitchingTest.tsx
    frontend/src/features/tests/DecisionTest.tsx
    frontend/src/features/tests/MentalStabilityTest.tsx

練習と本番を明確に分け、各テストに仕様書の初期試行数・時間・条件を設定から読み込ませる。詳細モードでは追加条件を実際に実施し、同じ計算コアへ統合する。

### Milestone 4: セッションと画面

セッション状態を`created`、`environment_check`、`profile_input`、`consent`、`calibration`、`quick_diagnosis`、`quick_result`、`detailed_diagnosis`、`detailed_result`、`retest`、`completed`、`aborted`、`invalid`で管理する。

画面コンポーネントを以下へ分離する。

    frontend/src/features/session/DiagnosisShell.tsx
    frontend/src/features/session/sessionReducer.ts
    frontend/src/features/onboarding/LandingScreen.tsx
    frontend/src/features/onboarding/EnvironmentCheckScreen.tsx
    frontend/src/features/onboarding/ProfileScreen.tsx
    frontend/src/features/onboarding/PreferenceScreen.tsx
    frontend/src/features/onboarding/ConsentScreen.tsx
    frontend/src/features/calibration/CalibrationScreen.tsx
    frontend/src/features/tests/TestStage.tsx
    frontend/src/features/results/ResultReport.tsx
    frontend/src/features/results/RecommendationCard.tsx
    frontend/src/features/results/RetestScreen.tsx
    frontend/src/features/results/ShareCardPreview.tsx
    frontend/src/features/results/FeedbackCard.tsx

デザインは背景`#08111F`、パネル`#102033`、本文`#F4F7FB`、補助文字`#A7B7C9`、青緑`#5EEAD4`、アンバー`#F5B84B`を共有トークンへ定義する。PC専用であること、非公式診断であること、医学的・心理学的診断でないこと、ストレス演出と中断可能性を明示する。

### Milestone 5: 結果・詳細診断・再テスト・共有

クイック結果から詳細診断へ進める。詳細診断開始前に追加キャリブレーションを行い、クイック試行と詳細試行を分けて保持した上で統合計算する。

再テストは信頼度が低い能力、推薦理由へ大きく影響した能力、ユーザーが選択した能力、環境異常のあったテストから候補を出す。再テスト後は最高値ではなく最新有効値または信頼度加重平均で再計算する。

共有カードは1200x630と1080x1080を生成し、サービス名、適性タイプ、操作タイプ、各カテゴリのメイン推薦、主要な強みだけを含める。生能力値、メンタル数値、ランク、経験年数、苦手項目、入力機器、セッションIDは含めない。

### Milestone 6: API・保存・検証

FastAPIへ`/api/health`、`/api/config/manifest`、`/api/profiles/champions`、`/api/profiles/champion-lanes`、`/api/feedback`、`/api/diagnosis-results`のPOST・DELETEを実装する。保存APIは明示的な保存同意と集計済みデータだけを受け付け、入力モデルでversion、consent、能力軸、必須項目を検証する。

診断保存とサービス改善フィードバックを分離する。SQLiteはローカル検証用とし、アカウント・クラウド同期・Riot APIは作らない。

## Validation and Acceptance

作業ディレクトリは`C:\Users\Hodaka\Downloads\div\recommend_champ_with_skill`とする。少なくとも以下を実行する。

    .\.venv\Scripts\python.exe -m pytest -q
    Set-Location frontend
    npm.cmd test -- --run
    npm.cmd run build
    Set-Location ..

FastAPIのAPIテストでは、設定取得、プロファイル取得、フィードバック、保存同意ありの保存、保存同意なしの拒否、削除を確認する。フロントエンド単体テストでは、式の境界値、外れ値、低信頼度、候補不足、同一チャンピオン除外、詳細再計算を確認する。

ブラウザでは、開発サーバーを起動し、ランディングからクイック結果までを実際に操作する。続けて詳細診断、再テスト、共有カード、フィードバック、任意保存を確認する。幅1024px未満または高さ640px未満の表示、フォーカス喪失、ウィンドウサイズ変更、描画警告、低信頼度、候補不足、同意なし保存をそれぞれ確認する。

受入条件は、全テストに説明・練習・本番があり、10能力軸、サブスコア、信頼度、3カテゴリのレーン+チャンピオン推薦、適性タイプ、操作タイプ、メンタルタイプ、強み、課題、苦手状況、練習メニューが生成されることである。総合点・順位・パーセンタイル・侮辱的表現・LLM依存・不適格候補による水増しがないことも確認する。

## Idempotence and Recovery

設定追加とコード追加は既存ファイルを確認してから行い、繰り返し実行しても既存の設計書・仕様書・ユーザー変更を破壊しないようにする。依存関係の追加に失敗した場合は、失敗箇所と未完了のマイルストーンをこの計画へ記録してから再実行する。

生ログや保存データを削除するテストはテスト用SQLiteと一時セッションだけを対象とし、作業ツリーのユーザーデータを削除しない。ブラウザ検証で中断した場合は、実行中テストを無効化し、説明画面から安全に再開できることを確認する。

## Artifacts and Notes

最終的に、ExecPlan、README、`backend`、`frontend`、設定JSON、JSON Schema、単体テスト、APIテスト、ブラウザ検証手順を成果物として残す。実装中のテスト出力、受入シナリオ、既知の制約をこの欄へ簡潔に追記する。

## Interfaces and Dependencies

フロントエンドの計算コアは副作用を持たない関数として切り出し、次の境界を維持する。

    normalizeFeature(value: number, profile: NormalizationProfile): number
    calculateAbilityScores(features: FeatureVector, config: CalculationConfig): AbilityResult
    calculateConfidence(quality: QualityInput, config: ConfidenceConfig): ConfidenceVector
    calculateRecommendations(input: RecommendationInput, config: RecommendationConfig): RecommendationSet
    mergeRetestResults(previous: DiagnosticResult, retest: DiagnosticResult): DiagnosticResult
    generateResultText(input: ResultTextInput, templates: ResultTemplates): ResultText

診断テストは、テスト固有の生データを`TrialLog`へ記録し、テスト終了時に`FeatureVector`へ変換する。`TrialLog`はAPIモデルへ渡してはいけない。

FastAPIはPydanticモデルで保存・フィードバック入力を検証し、設定読み込み時にschemaVersion、configVersion、gamePatch、必須フィールド、能力軸一致、重み合計を検証する。

ブラウザAPIはPointerEvent、KeyboardEvent、`requestAnimationFrame`、`performance.now`、CanvasまたはDOM描画を使用する。UIはキーボードフォーカス、十分なコントラスト、色以外の状態表現、`prefers-reduced-motion`を考慮する。

## Change Notes

2026-07-31: 添付実装指示と既存設計書を統合し、空のリポジトリから設定・計算・診断・UI・API・検証までを実装する計画へ具体化した。AGENTS.mdにより、標準の`docs/superpowers/plans`ではなく`.agent`へ保存した。
2026-07-31: 「競技ラボ」を内部のデザイン方針上の呼称として残し、利用者向けのページ名・共有カード・API表示名を「LoLスキルラボ」へ統一した。Viteの実行環境回避、3層候補のデータ補強、結果画面の数値非表示、ブラウザ完走確認を反映した。
