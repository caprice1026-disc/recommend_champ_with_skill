# LoLスキルラボ Cloudflare Workers / D1 移行実装計画

このExecPlanは生きた計画書である。リポジトリの`PLANS.md`に従い、作業の停止点ごとに`Progress`、`Surprises & Discoveries`、`Decision Log`、`Outcomes & Retrospective`を更新する。

## Purpose / Big Picture

この作業が完了すると、LoLスキルラボはFastAPIとローカルSQLiteプロセスに依存せず、Reactの診断体験をブラウザで実行しながら、必要な保存・フィードバック・Riot APIの安全な中継だけをCloudflare Workersで扱える。静的なSPAとAPIは同一オリジンで動き、診断結果の保存にはCloudflare D1を使う。

利用者から見た完成確認は、ローカルのCloudflare Vite開発サーバーまたはPreviewを起動し、トップページから診断を完走し、結果保存、削除、フィードバック、APIヘルスチェックを確認することで行う。Riot APIキーやD1の本番IDがない環境では、ローカル検証を完成させ、外部デプロイだけを明確なブロッカーとして報告する。

## Progress

- [x] (2026-08-12) Goal本文、Cloudflare設計書、現行リポジトリ、既存ExecPlanを確認した。
- [x] (2026-08-12) GitHubの対象リポジトリと未解決Issueを確認した。現時点で未解決Issueは0件だった。
- [x] (2026-08-12) Cloudflare Vite Plugin、Workers Static Assets、D1 migrations、D1 Worker API、Riot ACCOUNT-V1の公式資料を確認した。
- [x] (2026-08-12) 既存診断コードを壊さず、ルートのTypeScript/Viteプロジェクトへ統合する。
- [x] (2026-08-12) 静的設定の正本を`data/config/v1`へ移し、TypeScriptの検証・カタログ生成を用意する。
- [x] (2026-08-12) Worker API、D1マイグレーション、保存同意、deleteToken、フィードバックを実装する。
- [x] (2026-08-12) Riot ID確認とキャッシュ境界を実装する。ただし秘密情報がない環境でもテストできる設計にする。
- [x] (2026-08-12) ローカルCloudflare Vite開発、build、設定検証、Vitest、ブラウザの診断導線を検証する。
- [ ] Cloudflare移行後の同等性を確認してから旧FastAPI/Docker/Pythonを削除する。
- [x] (2026-08-12) README、CI、ExecPlanを更新した。GitHubの未解決Issueは0件で、追加登録が必要な重複Issueはなかった。
- [x] (2026-08-12) ローカル移行コミット`7cd0414`を`main`へpushした。
- [ ] Cloudflare本番Previewを認証済みアカウントと実在D1 IDで検証し、検証後に旧構成を削除する。

## Surprises & Discoveries

- Observation: 現行コードは`frontend`と`backend`に分かれ、フロントエンドの`loadRuntimeConfig`が設定APIを取得している。
  Evidence: `frontend/src/data/defaultData.ts`が`/api/profiles/champion-lanes`、`/api/config/manifest`、`/api/config/tests`を呼び出している。
- Observation: 現行の削除APIは保存時に返したtokenを使わず、結果IDだけで削除できる。
  Evidence: `frontend/src/App.tsx`の`deleteResult`と`backend/app/main.py`のDELETEルート。
- Observation: Cloudflareの現在の公式資料では、Vite Pluginがbuild時に静的アセット設定を生成でき、SPA fallbackと`run_worker_first: ["/api/*"]`をWrangler設定へ置ける。
  Evidence: Cloudflare Workers Vite Plugin Static Assets、SPA、Configurationの公式資料を2026-08-12に確認した。
- Observation: D1のマイグレーションは番号付きSQLを`migrations`ディレクトリで管理し、Wranglerの`d1 migrations apply --local`でローカルへ適用する。
  Evidence: Cloudflare D1 migrationsおよびWrangler commandsの公式資料を2026-08-12に確認した。
- Observation: 設計書の日付`2026-08-12`は、この環境にインストールされたMiniflareでは未来日として扱われ、Vite開発サーバーを起動できなかった。
  Evidence: `ERR_FUTURE_COMPATIBILITY_DATE`。互換性を保つため、Wrangler設定を実行環境でサポートされる直近日`2026-08-11`へ設定した。

## Decision Log

- Decision: 既存の診断・推薦ロジックを最初の移行で変更せず、ファイル配置とAPI境界を先に変える。
  Rationale: アーキテクチャ変更による推薦結果の変化と、別の診断ロジック変更を混同しないため。
  Date/Author: 2026-08-12 / Codex
- Decision: 静的設定をWorker APIから配信せず、ブラウザと設定検証スクリプトが同じ`data/config/v1`を参照する。
  Rationale: 設定をGitでレビュー可能な唯一の正本とし、設定APIとfallbackの二重管理を解消するため。
  Date/Author: 2026-08-12 / Codex
- Decision: Worker APIはHono等の追加フレームワークを使わず、標準のFetch handler、URL判定、D1 prepared statementで実装する。
  Rationale: 初期移行の依存を増やさず、Workerの責務とテスト対象を明確にするため。
  Date/Author: 2026-08-12 / Codex
- Decision: Riot APIは初期実装ではRiot IDからPUUIDを確認する補助機能に限定し、abilityVectorを変更しない。
  Rationale: Riot情報は経験・知識の解釈補助であり、診断で実測した能力値とは別の情報だからである。
  Date/Author: 2026-08-12 / Codex
- Decision: Cloudflareの本番D1 IDやRiot APIキーを捏造しない。設定ファイルには明確なplaceholderと手順を置く。
  Rationale: 外部状態を誤って変更せず、ローカル検証の再現性と秘密情報の安全性を保つため。
  Date/Author: 2026-08-12 / Codex

## Outcomes & Retrospective

ローカル移行は完了した。`npm run lint`、`npm run config:validate`、`npm run catalog:check`、43件のVitest、`npm run build`、D1 local migration、Cloudflare Viteランタイムのhealth／SPA／保存／削除smoke testを通過した。ブラウザでは環境確認、全スキップ、同意、ポインター校正、QWER校正、概要、診断ステージ開始を確認し、診断コアの移行前後同等性は固定入力の回帰テストで保持した。

`wrangler whoami`は未認証だったため、本番Cloudflare Preview、実在D1へのremote migration、Riot API上流接続は未検証である。D1 IDやRiot APIキーを捏造せず、旧FastAPI/Docker/Pythonはこの状態では削除しない。認証済み環境でPreviewを検証した後に旧構成を削除し、mainへpushすることが残作業である。

ローカル移行コミット`7cd0414`は2026-08-12に`origin/main`へpush済みである。

## Context and Orientation

現行フロントエンドは`frontend/src/App.tsx`が画面遷移、保存、削除、フィードバックを担当し、`frontend/src/features/tests/TestStage.tsx`が実際のブラウザ入力テストを担当する。`frontend/src/domain`には診断・推薦の計算コアがある。`frontend/src/data`にはfallback設定と生成済みチャンピオンカタログがある。

現行バックエンドは`backend/app/main.py`のFastAPIルート、`backend/app/storage.py`のSQLite保存、`backend/app/config_loader.py`のJSON Schema検証からなる。JSON設定は`backend/data/config/v1`にあり、champion、lane、test、recommendation、manifestと各schemaを含む。

移行後のWorkerは`src/worker/index.ts`を入口とし、HTTPルートの判定を`src/worker/routes`、保存・Riot処理を`src/worker/services`、D1 prepared statementを`src/worker/repositories`、環境・入力型を`src/worker/types.ts`へ分ける。UIは`src/client`、診断・推薦コアは`src/domain`へ整理する。静的設定はリポジトリルートの`data/config/v1`が正本となる。

## Plan of Work

まず、ルートにNodeプロジェクトを置き、既存のReactソース、テスト、設定を`src/client`と`src/domain`へ移す。既存の診断式、推薦式、テスト定義、チャンピオン値は変更しない。`@cloudflare/vite-plugin`、React、Vite、TypeScript、Vitest、Wrangler、Ajv、Workers Typesをルートの依存関係へ整理する。

次に、`backend/data/config/v1`を`data/config/v1`へ複製または移動し、設定検証、champion catalog生成、catalog同期確認をTypeScriptスクリプトへ置き換える。ブラウザのruntime configは設定APIへfallbackするのではなく、同じ静的設定をimportする。移行期間のみ互換の設定APIが必要な場合は、結果の挙動を変えず明示的に保守する。

その後、`wrangler.jsonc`、`vite.config.ts`、`src/worker/index.ts`を作る。Workerは同一オリジンの`/api/*`だけを処理し、それ以外はAssets bindingへ委譲する。`assets.not_found_handling`は`single-page-application`、`assets.run_worker_first`は`["/api/*"]`とする。Compatibility dateは現在の公式資料に照らして設定する。

D1用に`migrations/0001_initial.sql`を追加する。`diagnosis_results`、`feedback`、`riot_accounts`、`riot_profile_cache`を作り、必要なcreated_atとexpires_atのindexを追加する。Workerのrepositoryは値をprepared statementへbindし、delete tokenはWeb Cryptoでハッシュ化して保存する。

API入力はWorker内で実行時検証する。保存は`consentToSave === true`の場合だけ受け付け、許可するフィールドを明示することでraw logsが混入しないようにする。削除は`resultId`とセッションで一度だけ返したdeleteTokenを要求する。APIエラーは`error.code`、`message`、`requestId`の形式へ統一し、ログはroute、status、duration、requestIdなどのメタ情報に限定する。

Riot確認は`POST /api/riot/verify`で受け付け、Riot IDの文字数・文字種を検証し、`RIOT_API_KEY`をWorker secretからだけ読む。ACCOUNT-V1でPUUIDを取得し、必要に応じて補助情報を期限付きD1キャッシュへ保存する。Riot上流の404、429、5xxは内部本文やキーを漏らさない標準エラーへ変換する。Riot同意を診断保存同意から分離する。

最後に、Worker/D1のローカルテストとブラウザの完全フローを通し、同一入力の診断結果比較を確認する。Cloudflare Previewまで検証できた場合のみ旧FastAPI、Dockerfile、docker-compose、Python requirements、Python設定ローダーと旧テストを削除する。削除後もTypeScriptテスト、設定検証、build、Preview smoke testが通ることを確認する。

## Concrete Steps

すべてのコマンドはリポジトリルート`C:\Users\Hodaka\Downloads\div\recommend_champ_with_skill`で実行する。最初に`git status -sb`と`git diff`で既存変更を確認し、ユーザーの変更を上書きしない。

ルートの依存関係をインストールした後、`npm run config:validate`、`npm run catalog:check`、`npm run test:run`、`npm run lint`、`npm run build`を順に実行する。依存取得がsandboxで拒否された場合は、同じコマンドを承認付きで再実行し、失敗を隠さない。

D1は、実在する本番IDが設定されていない限りローカルへだけ適用する。

    npm run db:migrate:local

Worker開発サーバーを起動し、別のPowerShellで次を確認する。

    Invoke-WebRequest http://localhost:5173/api/health | Select-Object StatusCode, Content

期待する結果はHTTP 200と`service`が`lol-skill-lab`であるJSONである。SPAの直接URLでも`index.html`が返り、`/api/*`がHTMLへフォールバックしないことを確認する。

ブラウザではトップ画面から、環境確認、プロフィール、好み、同意、校正、全テスト、結果、詳細診断または再テスト、保存、削除、フィードバックの順に操作する。保存時のNetworkリクエストにraw coordinates、key sequence、frame trajectory、individual trialが含まれていないことを確認する。

Cloudflare credentials、D1 database ID、Riot API keyが存在する場合だけ、先にPreviewへdeployし、health、diagnosis、save/delete、feedback、Riot verifyのsmoke testを行う。本番D1のmigration applyや本番deployは、対象環境と変更内容を確認してから行う。

各論理的なマイルストーンで、変更ファイルを明示してcommitし、検証結果をExecPlanへ記録してからリモートへpushする。push前に`git status -sb`と直近コミットを確認する。

## Validation and Acceptance

`npm run test:run`は既存のdomainテストに加え、Worker route、入力検証、D1 repository、delete token、Riotエラー変換、raw input除外のテストを含める。`npm run config:validate`は未知軸、必須キー欠落、重複champion/lane、manifest不一致を検出する。

同じ固定入力を移行前のdomain計算と移行後のdomain計算へ渡し、ability vector、confidence、推薦の3バケット、各primaryのchampionId/laneが一致することをテストで証明する。計算式やchampionデータを変更してテストを合わせることは禁止する。

保存APIは同意なしを403、raw fieldを400系、同意ありを201とし、レスポンスに`resultId`と一度だけ使うdeleteTokenを返す。D1行にはdeleteToken本文が存在せず、正しいtokenだけが削除を成功させる。フィードバック保存は診断結果保存と別テーブルで行う。

Riot APIキーをクライアントのbuild成果物、source map、レスポンス、ログへ出さない。Riot情報を与えた場合と与えない場合でabilityVectorが変わらないことをテストする。

最終的に、FastAPIを起動しなくてもCloudflare Vite開発サーバーでSPAとAPIが動き、build成果物がWorkers Static Assetsとして配信され、D1マイグレーションと全TypeScript検証が再現できることを受入条件とする。

## Idempotence and Recovery

設定の移動・生成は、同じ入力を何度実行しても同じ出力になるようにする。カタログ生成前に手編集された生成ファイルを上書きする場合は、差分を確認してから実行する。D1 migrationは番号を再利用せず、適用済みmigrationを書き換えない。

旧FastAPIとDockerを削除する前に、旧コードがcleanなコミットまたはGit履歴に残り、Cloudflare側の代替テストが通っていることを確認する。Cloudflare認証や本番IDがない場合は削除を行わず、ローカル移行を完成させて外部作業を保留する。

## Artifacts and Notes

最終的な重要成果物は、ルートの`package.json`、`vite.config.ts`、`wrangler.jsonc`、`src/worker`、`src/client`、`src/domain`、`data/config/v1`、`migrations/0001_initial.sql`、TypeScript検証スクリプト、更新済みREADME、CI設定、そしてこのExecPlanである。

本番のD1 IDやRiot APIキーは成果物へ書き込まない。placeholderを使った設定では、READMEに置換方法と、置換しない場合に可能なローカル検証範囲を書く。

## Interfaces and Dependencies

Workerの環境型は、少なくとも次の形を持つ。

    interface Env {
      ASSETS: Fetcher;
      DB: D1Database;
      RIOT_API_KEY?: string;
    }

Workerの入口は`fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response>`とし、`/api/health`、`/api/diagnosis-results`、`/api/feedback`、`/api/riot/verify`を処理する。未知のAPIパスは404、API以外はAssetsへ委譲する。

保存repositoryは`saveDiagnosis(db, payload, deleteTokenHash)`、`deleteDiagnosis(db, resultId, deleteTokenHash)`、`saveFeedback(db, payload)`を提供し、SQLへ値を連結しない。Riot serviceは`verifyRiotId(input, env)`を提供し、戻り値にPUUIDや生の上流本文を不要に含めない。

依存は、React、React DOM、Vite、`@vitejs/plugin-react`、`@cloudflare/vite-plugin`、TypeScript、Vitest、jsdom、Wrangler、`@cloudflare/workers-types`、Ajvを使用する。ORMやLLMは初期移行に導入しない。

---

更新記録: 2026-08-12、Goal本文と現行リポジトリの実態を反映して初版を作成した。Cloudflare公式資料の確認結果と、既存削除APIにtokenがないという実装差分を記録した。

更新記録: 2026-08-12、Vite開発時に未来互換日が拒否されたため、`wrangler.jsonc`のcompatibility dateを`2026-08-11`へ調整した。

更新記録: 2026-08-12、追加監査で見つかったRiotキャッシュ未実装を修正した。`riot_accounts`と`riot_profile_cache`を参照し、1時間の有効期限、期限切れ時の再取得、破損キャッシュ時の再取得を実装し、PUUIDをクライアントへ返さないことをテストした。併せてmanifestの3設定バージョン整合性、Content-Lengthがない場合を含む256 KiB入力制限、Riot設定・上流エラーの標準化を追加した。

更新記録: 2026-08-12、ブラウザでクイック診断を全8テスト完走した際、メンタルテストのフェーズ表示が再レンダーごとにタイマーをリセットして停止する不具合を確認した。`MentalRound`のフェーズ時間配列を`useMemo`で安定化し、練習3フェーズと本番3フェーズが完了するテストを追加した。修正後は結果画面、保存、削除、フィードバック、SPAの直接URLリロードまで確認した。

更新記録: 2026-08-12、最終ローカル検証は`npm.cmd run test:run`（9 files / 49 tests）、`npm.cmd run lint`、`npm.cmd run config:validate`、`npm.cmd run catalog:check`、`npm.cmd run build`、`npm.cmd run db:migrate:local`、`git diff --check`がすべて成功した。Worker smokeはhealth/root/SPAが200、保存201、削除204、feedback201、Riot未設定503、サイズ超過400（`PAYLOAD_TOO_LARGE`）を確認した。

更新記録: 2026-08-12、READMEへRiotキャッシュ、タイマー・サイズ制限、ローカル検証結果を追記した。WranglerログインはCloudflareの認証コード待ちでタイムアウトしたため、実アカウントでのPreview、remote D1 migration、実Riot API upstreamは未確認のまま保留する。実在するD1 ID/API keyを得るまで、FastAPI、Docker、Python旧構成は削除しない。
