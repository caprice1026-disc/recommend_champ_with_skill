# 軌道予測・判断ナビゲーション・Docker起動対応 ExecPlan

このExecPlanは、リポジトリの `PLANS.md` に従う実装記録である。軌道予測の実移動、判断ラウンドの回答変更、Dockerによる8080番ポート起動を一つの検証可能な変更として扱う。

## 目的

軌道予測で対象が開始位置から到達位置へ連続移動し、移動済みの軌道が画面上で追えるようにする。判断ラウンドでは選択を保存したまま前後の状況へ移動でき、最後に確定した回答だけを採点する。Dockerではフロントエンドをビルドし、FastAPIが同一オリジンで静的ファイルとAPIを8080番ポートから提供する。

## 進捗

- [x] (2026-08-02) 軌道予測と判断ラウンドの原因をコードとブラウザで確認
- [x] (2026-08-02) 軌道補間、軌道線、回答採点のドメインテストを追加
- [x] (2026-08-02) 軌道予測のrequestAnimationFrame移動と判断の前後ナビゲーションを実装
- [x] (2026-08-02) Dockerfile、.dockerignore、docker-compose.yml、8080設定、README手順を追加
- [x] (2026-08-02) フロントのテスト、型チェック、ビルド、ブラウザ検証を完了
- [ ] (2026-08-02) Docker DesktopのLinuxエンジン起動後にイメージ実ビルドを再確認

## 発見事項

- 軌道予測は開始座標を一度設定し、850ms後に対象を消していたため、移動アニメーションが存在しなかった。
- 判断は選択クリックの中で即時に `question` を進めており、過去の回答を保持する状態や戻る操作がなかった。
- Docker Composeの構文は正常だが、この実行環境では `dockerDesktopLinuxEngine` の名前付きパイプが存在せず、Dockerデーモン接続でビルドが停止した。

## 方針決定

- 軌道は `requestAnimationFrame` と純粋な線形補間で描画し、現在位置までのSVG軌道線と通過点を表示する。移動完了後だけ到達位置入力を受け付ける。
- 判断は選択クリックで次へ進まず、回答配列に選択肢インデックスを保存する。「次の状況へ」と「前の状況」で移動し、確定時に配列全体を再採点する。
- Dockerはマルチステージビルドを採用し、Nodeでフロントを生成した後、Pythonイメージ上のFastAPIから `frontend/dist` を配信する。SQLiteは設定データを覆わない別ボリュームへ保存する。

## 実装対象

- `frontend/src/domain/testLogic.ts`: 軌道補間・軌道点生成・判断回答採点の純粋関数。
- `frontend/src/domain/__tests__/testLogic.test.ts`: 軌道の始点・中間点・終点、軌道点、回答採点の回帰テスト。
- `frontend/src/features/tests/TestStage.tsx`: 軌道の連続描画と判断の回答履歴・前後操作。
- `frontend/src/styles.css`: 軌道線、通過点、選択状態、ナビゲーションの視認性。
- `Dockerfile` / `.dockerignore` / `docker-compose.yml`: 8080番ポートでの本番相当起動。
- `backend/app/main.py` / `README.md`: 8080を既定の起動例と許可オリジンに反映。

## 検証と受け入れ条件

`frontend` で `npm.cmd run test:run`、`npm.cmd run lint`、`npm.cmd run build` を実行する。ブラウザでは `http://localhost:5173/` から診断を開始し、軌道の開始時点と途中時点で対象のstyle座標とSVG軌道点が変化すること、判断で選択後に次へ進み前へ戻ると選択状態が復元されることを確認する。`docker compose config` が成功し、Docker Desktop起動後は `docker build -t lol-skill-lab:local .` と `/api/health` の8080応答を確認する。

## 結果

フロントの16テスト、型チェック、ビルド、ブラウザ操作、警告・エラーログ確認は完了した。Docker Compose設定は検証済みで、実イメージのビルドだけはDockerデーモン停止により保留している。

## 変更記録

2026-08-02: ユーザー報告の軌道予測・判断ナビゲーション修正に、Dockerでの8080番ポート起動要件を追加して実装計画を分離記録した。
