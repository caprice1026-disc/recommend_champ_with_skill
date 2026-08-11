# Issue #16〜#28 診断測定・推薦データ整合性改善 ExecPlan

このExecPlanは、`PLANS.md`に従う実装中の生きた計画書である。診断結果が実測値と設定値に基づき、経験値・品質・設定世代を含めて再現可能になることを目的とする。

## Purpose / Big Picture

利用者が同じ操作を行ったとき、APIが利用できるかどうか、入力端末、プロフィール経験、診断順序によって推薦結果が不意に変わらない状態を作る。判断速度、メンタルの安定性と回復、注意分配、クリック精度、複合入力などは、総合点から作った見かけの値ではなく、各テストで収集した測定値から算出する。結果画面は能力別の測定品質を表示し、保存結果には実際に使用した設定バージョンを記録する。

## Progress

- [x] (2026-08-11) Objective、リポジトリ指示、ExecPlan、Git状態を確認した。
- [x] (2026-08-11) GitHubの#15〜#28を取得し、#15はcompleted、#16〜#28はOpenであることを確認した。
- [x] (2026-08-11) #16〜#28の主張を現行コードへ照合した。
- [x] (2026-08-11) 設定スキーマを厳格化し、テスト設定APIと生成チャンピオンフォールバックを追加した。
- [x] (2026-08-11) 実測メトリクス、経験値、設定スナップショット、能力別confidenceを実装した。
- [x] (2026-08-11) 設定駆動のテスト条件とseed付きテスト順序を実装した。
- [ ] 自動テスト、ブラウザ、Dockerで検証する。
- [ ] 各Issueへ根拠付きコメントを行い、不要・重複・完了Issueを整理する。
- [ ] mainへ段階的にコミット・Pushし、origin/mainのSHAを確認する。

## Surprises & Discoveries

- #15はGitHub上でcompleted状態だった。現在のコードでは低品質試行を有効試行数とqualityへ反映する既存修正があるため、再オープンせず、最終検証で再現しないことを確認する。
- #16〜#28はすべてコメントなしでOpenだった。Issue本文だけでなく、修正ごとに原因・テスト・コミットをコメントする必要がある。
- `test_definitions.json`はバックエンドにあるが、`TestStage.tsx`は直接参照していない。設定APIとフォールバック設定を定義し、Roundへ明示的に渡す必要がある。
- `champion_lane_profiles.json`、`champion_catalog.json`、`defaultData.ts`、`championCatalog.ts`にチャンピオン評価値が分散している。バックエンドJSONを生成元にし、フロントのフォールバックは生成物にする。
- (2026-08-11) 詳細設定の一部が説明文字列だったため、入力シーケンス数と回復延長時間を数値設定へ変更し、実装のハードコードを除いた。

## Decision Log

- Decision: 表示称号は主称号1件を維持し、#20はサブ称号複数表示ではなく候補判定パターンの拡充または仕様整合性のIssueへ整理する。
  Rationale: ユーザーが確定したUI仕様とIssue #20の要求が異なるため。
  Date/Author: 2026-08-11 / Codex
- Decision: チャンピオン評価データはバックエンドのバージョン付きJSONを正とし、フロントフォールバックTypeScriptは生成する。
  Rationale: API利用時とフォールバック時の結果を同一にし、手書き二重管理を無くすため。
  Date/Author: 2026-08-11 / Codex
- Decision: テスト順序はブロック順を固定し、ブロック内部だけseed付きFisher-Yatesで並べ替える。
  Rationale: メンタルを最後に固定する既存要件を維持しながら、順序効果を減らし、テストで再現できるため。
  Date/Author: 2026-08-11 / Codex

## Context and Orientation

バックエンドは`backend/`のFastAPIで、`backend/data/config/v1/`のJSONとJSON Schemaを読み込む。フロントエンドは`frontend/`のReact/Viteで、`frontend/src/features/tests/TestStage.tsx`が入力を収集し、`frontend/src/domain/resultEngine.ts`と`scoring.ts`が特徴量・能力・推薦を計算する。`frontend/src/App.tsx`はプロフィール、診断セッション、結果保存、テストキューを管理する。

`TestResult`は1つのテストの集計値であり、`metrics`にテスト固有の実測メトリクスを保持する。メトリクスはUI表示だけでなく、`featuresFromTestResults`とconfidence計算の入力にする。生の座標・キー入力履歴は保存APIへ送らない。

## Plan of Work

まず失敗テストを追加して、経験値の伝播、未指定weightの扱い、厳格Schema、APIとフォールバックの一致、実測サブスコア、判断時間、メンタルフェーズ、注意分配の時間サンプリング、seed付きキュー、能力別confidence、manifest由来の保存バージョンを固定する。

次に、バックエンドへテスト設定APIと設定スナップショットを追加し、フロントのロード結果へmanifest・tests・sourceを保持する。チャンピオンJSONからフロントフォールバックを生成し、同期検証を追加する。最後に`TestStage.tsx`の各Roundが設定値と実測メトリクスを使うよう変更し、結果エンジンとUIを接続する。

2026-08-11時点で、ここまでの実装確認はフロント型検査、対象ドメインテスト28件、バックエンドテスト8件、生成カタログ同期チェックを通過している。残りは全体テスト・ビルド、実ブラウザ、Docker、GitHub Issue整理である。

## Concrete Steps

作業ディレクトリは`C:\Users\Hodaka\Downloads\div\recommend_champ_with_skill`とする。各論理単位で対象テストを先に実行し、失敗を確認してから実装する。

設定・推薦・測定の変更後は、次を実行する。

    cd C:\Users\Hodaka\Downloads\div\recommend_champ_with_skill
    .\.venv\Scripts\python.exe -m pytest -q
    cd frontend
    npm.cmd run test:run
    npm.cmd run lint
    npm.cmd run build

ブラウザではローカル診断を最初から結果まで実行し、経験値、実測サブスコア、判断時間、メンタル3フェーズ、seed順序、能力別confidence、主称号1件、アイコンを確認する。Docker Engineが動作する場合は`docker compose up --build`後に`http://localhost:8080/api/health`を確認する。Engineが停止している場合は未検証として記録する。

## Validation and Acceptance

未知の能力・嗜好・難易度キー、styleProfileの欠落が設定ロードでファイル名とJSONパス付きで失敗する。API経由とフォールバック経由の候補データと推薦結果が同一になる。beginnerだけが要求緩和を受け、ability値そのものは変わらない。未指定requirement軸は不足量の分母に加わらない。

クリック、複合入力、判断、メンタル、注意分配のメトリクスを一部だけ悪化させると、対応する特徴量・能力・confidenceだけが主に変わる。判断速度は正答試行の回答時間に依存し、速い誤答だけでは高くならない。メンタルは通常・プレッシャー・回復の推移を区別する。注意分配はpointermove回数ではなく時間サンプルで評価する。同一seedは同じ順序、異なるseedは少なくとも一方のブロック順が変わる。

保存リクエストの`configVersions`は固定`profile/formula`ではなくmanifestの実値とsourceを含む。結果画面の代表confidenceは最初の能力軸ではなく、能力別値を集約した明示的な代表値を使う。表示称号は必ず1件である。

## Idempotence and Recovery

生成スクリプトは同じ入力から同じ出力を作る。既存の未コミット変更は上書きせず、stage対象を明示する。Issueの更新は現在内容を取得してから行い、重複・仕様矛盾・修正済みの判断をコメントに残す。force push、reset --hard、履歴改変は行わない。

## Outcomes & Retrospective

未完了。各マイルストーン完了時に、変更ファイル、テスト出力、ブラウザ・Dockerの検証結果、Issueの状態、mainとorigin/mainのSHAをこの節へ追記する。
