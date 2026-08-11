# LoLスキルラボ

League of Legendsのプレイ適性を、ブラウザ上の実測テストとプレイ傾向から読み解くWebアプリです。反応速度、クリック精度、複合入力、軌道予測、注意分配、タスク切り替え、判断、メンタル安定性を測定し、「今すぐ活かせる」「成長しながら合う」「長期で挑戦したい」の3層でレーン＋チャンピオンを推薦します。

## 構成

- React + TypeScript + Vite：診断の進行、入力イベント、特徴量、能力値、信頼度、推薦、称号をブラウザ内で処理します。
- Cloudflare Workers：同意済み結果の保存・削除、フィードバック、Riot APIの安全な中継を担当します。
- Cloudflare D1：診断結果、フィードバック、Riotの最小キャッシュを保存します。
- Workers Static Assets：Viteで生成したSPAをWorkerと同一オリジンで配信します。
- `data/config/v1`：チャンピオン、レーン、テスト、推薦、manifestの唯一の設定正本です。D1へは移しません。

生のクリック座標、キー入力列、フレーム軌道、個別試行ログはWorkerやD1へ送信しません。保存に同意した場合も、能力ベクトル、サブスコア、信頼度、推薦、称号、設定バージョンなどの集約値だけを保存します。

## 必要環境

- Node.js 22以上
- npm
- Cloudflareへdeployする場合はWranglerのログイン済みアカウント、D1 database ID、必要に応じてRiot API key

## ローカル起動

依存関係をインストールします。

    npm.cmd install

ローカルD1へ初期マイグレーションを適用します。

    npm.cmd run db:migrate:local

Cloudflare Vite開発サーバーを起動します。

    npm.cmd run dev

ブラウザで`http://localhost:5173/`を開いてください。`/api/*`はWorker、SPAの画面はStatic Assetsとして扱われます。設定はAPIから取得せず、`data/config/v1`からbuildへ取り込まれます。

## Riot API（任意）

`.dev.vars.example`を`.dev.vars`へコピーし、Riot APIキーを設定してください。.dev.varsはgitignore対象で、APIキーをGit、クライアントbundle、source map、D1、ログへ置かないでください。

    Copy-Item .dev.vars.example .dev.vars

Riot ID確認は診断結果保存とは別の同意を要求します。初期実装はACCOUNT-V1によるRiot ID確認と最小限の補助情報に限定し、Riot情報でabilityVectorを補正しません。

## 設定検証とカタログ

設定JSONとSchemaを検証します。

    npm.cmd run config:validate

チャンピオンカタログを生成・同期確認します。

    npm.cmd run catalog:generate
    npm.cmd run catalog:check

未知の能力軸、設定キー、重複したchampion/lane、iconUrl・wikiUrl・difficultyNoteの欠落、生成カタログとの不整合はCIでも拒否します。

## 検証

    npm.cmd run lint
    npm.cmd run test:run
    npm.cmd run build

ブラウザでは、環境確認、プロフィール、好みの回答または全スキップ、同意、校正、全テスト、結果、詳細診断・再テスト、任意保存、deleteTokenを使った削除、フィードバックを確認します。

保存APIは`consentToSave: true`を必須とし、保存成功時に`resultId`と一度だけ使う`deleteToken`を返します。deleteTokenはハッシュだけがD1に保存されます。

## Cloudflare deploy

`wrangler.jsonc`のD1 `database_id`を、作成済みのD1 database IDへ置き換えてください。ゼロUUIDのplaceholderのままでは本番D1へ接続できません。

    npx wrangler login
    npx wrangler d1 create lol-skill-lab
    npx wrangler d1 migrations apply DB --remote
    npm.cmd run deploy

Cloudflareの料金、無料枠、D1容量、WorkerとRiot APIのレート制限は現在の公式資料を確認してから運用してください。Previewでhealth、SPA直接URL、診断、保存・削除、フィードバック、Riot確認を検証してから本番へ反映します。

## 実装上の注意

- Riot ID確認の成功結果は、PUUIDをクライアントへ返さず、Worker内で1時間だけD1へキャッシュします。期限切れ・破損キャッシュは再確認へフォールバックします。
- メンタル安定性テストの各フェーズは、画面再レンダーでタイマーがリセットされないように固定した時間計測で進行します。
- 保存APIは本文のContent-Lengthがない場合も実バイト数を確認し、256 KiBを超える入力を拒否します。
- 2026-08-12時点のローカル確認では、全49テスト、型チェック、設定検証、カタログ同期確認、Vite/Workerビルド、ローカルD1マイグレーション、ブラウザでのクイック診断完走と保存・削除・フィードバックを確認済みです。Cloudflare PreviewはWrangler認証が必要です。

## 旧構成について

Cloudflare移行が完了した後は、FastAPI、Python設定ローダー、SQLite保存、旧Docker構成は使用しません。診断・推薦ロジックは移行前後で同一入力の結果が変わらないことを回帰テストで確認します。

本アプリは非公式の参考診断であり、勝敗・実力・心理状態・医学的状態を保証または診断するものではありません。プレッシャー演出を含むテストはいつでも中断できます。
