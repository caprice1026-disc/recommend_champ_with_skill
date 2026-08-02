# LoLスキルラボ

League of Legendsのプレイ適性を、ブラウザ上の実測テストとプレイ傾向から読み解くWebアプリです。反応速度、クリック精度、複合入力、軌道予測、注意分配、タスク切り替え、判断、メンタル安定性を測定し、「今すぐ活かせる」「成長しながら合う」「長期で挑戦したい」の3層でレーン＋チャンピオンを推薦します。

## 構成

- `frontend`: React + TypeScript + Vite。測定中のPointerEvent、KeyboardEvent、`performance.now()`、`requestAnimationFrame`はブラウザ内で処理します。
- `backend`: FastAPI。設定配信、匿名の集計結果保存、フィードバック受信を担当します。
- `backend/data/config/v1`: バージョン付きJSON設定とJSON Schema。

クイック診断と詳細判定は別モードで動き、詳細判定では本番試行数・継続時間・回復計測を増やします。再テストは指定した1カテゴリだけを最新有効値で置き換えます。

## Windows / PowerShellで起動

バックエンドをターミナル1で起動します。

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --port 8080
```

フロントエンドをターミナル2で起動します。

```powershell
Set-Location frontend
npm.cmd install
npm.cmd run dev
```

ブラウザで `http://localhost:5173` を開いてください。開発サーバー未起動時も、フロントエンドは内蔵の候補データへフォールバックします。

## Dockerで起動

Dockerではフロントエンドをビルドした静的ファイルをFastAPIが配信します。バックエンドの既定ポートは8080です。

```powershell
docker compose up --build
```

ブラウザで `http://localhost:8080` を開いてください。匿名の診断結果とフィードバックは `skill-lab-data` ボリュームへ保存されます。停止する場合は `docker compose down` を実行します。

## 検証

```powershell
.\.venv\Scripts\python.exe -m pytest -q
Set-Location frontend
npm.cmd run test:run
npm.cmd run lint
npm.cmd run build
Set-Location ..
```

この環境ではViteのビルド設定ローダーを `native` にしています。Windowsサンドボックスで設定バンドル時に発生する子プロセス起動制限を避けるためです。

## データとプライバシー

生のクリック座標、キー入力列、試行単位ログはAPIへ送信しません。保存に同意した場合のみ、能力ベクトル、サブスコア、信頼度、推薦結果などの集計値をローカルSQLiteへ保存します。Riot API、アカウント、クラウド同期、LLMによる文章生成は初期版の対象外です。

本アプリは非公式の参考診断であり、勝敗・実力・心理状態・医学的状態を保証または診断するものではありません。プレッシャー演出を含むテストはいつでも中断できます。
