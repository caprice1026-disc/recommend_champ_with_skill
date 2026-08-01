# League of Legends チャンピオン適性診断 Webアプリ

## 機能・データ・計算仕様書

**文書バージョン:** 1.0.0
**作成日:** 2026年7月26日
**対応要件定義書:** バージョン1.0.0
**対象プラットフォーム:** PC向けWebブラウザ
**文書目的:** 要件定義書で定めた内容を、画面、処理、データ構造、テスト条件、計算方式および例外処理へ具体化する。

---

# 1. 仕様書の位置付け

本仕様書は、要件定義書に記載された内容を変更せず、以下を実装可能な粒度へ具体化する。

* 画面構成
* 画面遷移
* 診断セッションの進行
* 各テストの実施条件
* 生データの取得
* 特徴量の抽出
* 能力スコアの計算
* 測定信頼度の計算
* 初心者補正
* チャンピオン・レーンプロファイル
* 推薦スコア
* 推薦カテゴリ
* 多様性リランキング
* 適性タイプ
* 結果文章
* 再テスト
* SNS共有
* フィードバック
* データ保持
* 設定ファイル
* エラー処理

本仕様書内の数値は、特に明記がない限り**初期設定値**とする。

初期設定値は設定ファイルから変更可能とし、診断データや利用者フィードバックをもとに調整できる構造とする。

---

# 2. システム構成

## 2.1 論理構成

本サービスは、以下の論理コンポーネントで構成する。

1. 診断画面
2. テスト実行エンジン
3. ブラウザ環境キャリブレーション
4. 生入力イベント収集
5. 特徴量抽出
6. 能力スコア計算
7. 測定信頼度計算
8. 推薦エンジン
9. 多様性リランキング
10. 適性タイプ判定
11. 結果文章生成
12. 共有カード生成
13. フィードバック送信
14. 任意保存
15. 設定・プロファイル管理

## 2.2 基本処理方針

診断に必要な生入力ログは、原則としてブラウザ内で処理する。

デフォルト状態では以下とする。

* 生のポインター座標をサーバーへ送信しない
* 生のキー入力ログをサーバーへ送信しない
* ブラウザ内で特徴量へ変換する
* 推薦計算もブラウザ内で実行可能にする
* サーバーには必要な設定ファイルのみ取得する
* ユーザーが保存を選択した場合のみ集計済みデータを送信する
* フィードバックは診断データ保存とは別に送信する

## 2.3 推奨処理分担

### ブラウザ側

* テスト描画
* タイマー管理
* 入力イベント取得
* 生データ保持
* 特徴量計算
* 能力スコア計算
* 測定信頼度計算
* 推薦計算
* 結果文章生成
* 共有カード生成
* セッション内再テスト

### サーバー側

* 設定ファイル配信
* チャンピオンプロファイル配信
* バージョン管理
* 任意保存
* フィードバック受付
* Riot API連携
* 管理用データ更新

---

# 3. 診断セッション

## 3.1 セッションID

診断開始時に一時的なセッションIDを生成する。

形式例：

```text
diag_01JXXXXXXXXXXXXXXX
```

要件：

* 個人情報を含めない
* 推測困難な値とする
* 診断結果保存を選択しない場合、恒久保存しない
* ブラウザ内ではセッション状態の識別に使用する

## 3.2 セッション状態

診断セッションは以下の状態を持つ。

```text
created
environment_check
profile_input
consent
calibration
quick_diagnosis
quick_result
detailed_diagnosis
detailed_result
retest
completed
aborted
invalid
```

## 3.3 セッション再開

同一タブ内での誤操作や画面遷移に備え、診断中の状態を一時保存する。

保存先候補：

* メモリ
* sessionStorage

以下は保存しない。

* 永続的なlocalStorageへの生入力ログ保存
* ユーザー同意のないサーバー保存

ページ再読み込み時は、実行中だったテストを無効として扱い、当該テストの説明画面から再開する。

---

# 4. 画面一覧

| 画面ID    | 画面名        | 主な役割                 |
| ------- | ---------- | -------------------- |
| SCR-001 | ランディング     | サービス説明と診断開始          |
| SCR-002 | PC環境確認     | PC、マウス、キーボード確認       |
| SCR-003 | 基本プロフィール入力 | LoL経験、入力経験を取得        |
| SCR-004 | プレイ嗜好入力    | プレイスタイルの好みを取得        |
| SCR-005 | 注意事項・同意    | 非公式診断、ストレス演出、データ利用説明 |
| SCR-006 | キャリブレーション  | 描画・入力環境確認            |
| SCR-007 | 診断概要       | 所要時間、テストブロック説明       |
| SCR-008 | ブロック説明     | 各テスト群の説明             |
| SCR-009 | テスト説明      | 個別テストの操作説明           |
| SCR-010 | 練習ラウンド     | 個別テストの練習             |
| SCR-011 | 本番ラウンド     | 個別テストの実施             |
| SCR-012 | ブロック間休憩    | 短い休憩と進捗表示            |
| SCR-013 | 結果計算       | 特徴量、推薦の計算            |
| SCR-014 | クイック診断結果   | クイック診断結果表示           |
| SCR-015 | 詳細診断案内     | 詳細診断への導線             |
| SCR-016 | 詳細診断結果     | 詳細結果表示               |
| SCR-017 | 再テスト選択     | 再測定する能力・テストを選択       |
| SCR-018 | 共有カード確認    | 共有画像のプレビュー           |
| SCR-019 | 保存設定       | 任意保存と同意管理            |
| SCR-020 | エラー・測定不能   | 環境異常や診断中断の案内         |

---

# 5. 画面遷移

## 5.1 基本遷移

```text
ランディング
  ↓
PC環境確認
  ↓
基本プロフィール入力
  ↓
プレイ嗜好入力
  ↓
注意事項・同意
  ↓
キャリブレーション
  ↓
診断概要
  ↓
クイック診断
  ↓
クイック診断結果
  ├─ 詳細診断
  ├─ 再テスト
  ├─ SNS共有
  ├─ 任意保存
  └─ 終了
```

## 5.2 詳細診断

```text
クイック診断結果
  ↓
詳細診断案内
  ↓
追加キャリブレーション確認
  ↓
詳細診断
  ↓
詳細診断結果
```

## 5.3 再テスト

```text
結果画面
  ↓
再テスト選択
  ↓
対象テストの説明
  ↓
練習ラウンド
  ↓
本番ラウンド
  ↓
結果再計算
  ↓
結果画面
```

---

# 6. ランディング画面

## 6.1 表示内容

* サービス名
* 診断概要
* PC専用であること
* 所要時間
* クイック診断と詳細診断の違い
* 医学的・心理学的診断ではないこと
* Riot Games公式サービスではないこと
* 診断開始ボタン

## 6.2 表示文例

```text
反応速度、クリック精度、複合入力、予測、判断傾向などを測定し、
あなたの能力を発揮しやすいLeague of Legendsのチャンピオンを提案します。

クイック診断：約5～6分
詳細診断：約10～15分

この診断はPC専用です。
マウスとキーボードを使用します。
```

---

# 7. PC環境確認

## 7.1 自動確認

以下を自動判定する。

* 画面横幅
* 画面縦幅
* タッチ端末判定
* キーボードイベント利用可否
* Pointer Events利用可否
* ブラウザ種別
* ブラウザバージョン
* devicePixelRatio
* requestAnimationFrame利用可否
* performance.now利用可否

## 7.2 最低表示領域

初期設定値：

```json
{
  "minimumViewportWidth": 1024,
  "minimumViewportHeight": 640
}
```

最低領域を満たさない場合は、ウィンドウ最大化を案内する。

## 7.3 入力機器の選択

ユーザーに以下を選択させる。

* マウス
* トラックパッド
* ペンタブレット
* その他

トラックパッド選択時は警告を表示する。

```text
トラックパッドでも診断できますが、
クリック精度と複合入力の測定結果に影響する可能性があります。
```

---

# 8. 基本プロフィール入力

## 8.1 必須項目

| 項目              | 形式 | 選択肢・範囲                           |
| --------------- | -- | -------------------------------- |
| LoL経験           | 選択 | 未経験、1か月未満、1～6か月、6～12か月、1～3年、3年以上 |
| 現在・直近ランク        | 選択 | 未経験、アンランク、Iron～Challenger        |
| 直近のプレイ頻度        | 選択 | ほぼなし、月数回、週1～2回、週3～5回、ほぼ毎日        |
| マウスゲーム経験        | 選択 | ほぼなし、少ない、普通、多い、非常に多い             |
| キーボードゲーム経験      | 選択 | ほぼなし、少ない、普通、多い、非常に多い             |
| マウス・キーボード同時操作経験 | 選択 | ほぼなし、少ない、普通、多い、非常に多い             |
| 入力機器            | 選択 | マウス、トラックパッド、ペンタブレット、その他          |
| キーボード配列         | 選択 | 日本語配列、US配列、その他                   |

## 8.2 任意項目

* 主に遊ぶレーン
* よく使用するチャンピオン
* 得意だと思うチャンピオン
* 利き手

## 8.3 入力形式

チャンピオン選択は検索可能なコンボボックスとする。

複数選択上限の初期値：

```json
{
  "frequentChampionsMax": 5,
  "selfReportedStrongChampionsMax": 5
}
```

---

# 9. プレイ嗜好入力

## 9.1 回答形式

5段階選択とする。

```text
まったく当てはまらない
あまり当てはまらない
どちらともいえない
やや当てはまる
非常に当てはまる
```

内部値：

```text
0.00
0.25
0.50
0.75
1.00
```

## 9.2 質問項目

最低限以下を取得する。

1. 自分から戦闘を仕掛けたい
2. 味方を守ったり支援したりするのが好き
3. 単独で行動できる方が好き
4. 味方と連携して戦う方が好き
5. 序盤から試合へ影響を出したい
6. 終盤に強くなる方が好き
7. 瞬間的な大ダメージが好き
8. 長く戦い続ける方が好き
9. 相手の動きを待って対応するのが好き
10. 自分からリスクを取って試合を動かしたい
11. 複雑な操作を覚えることが苦にならない
12. 安定した再現性を重視する
13. 高い爆発力を重視する
14. 遠距離から攻撃する方が好き
15. 接近して戦う方が好き
16. 視界やマップ情報を使ったプレイが好き

## 9.3 嗜好ベクトル

```json
{
  "aggression": 0.0,
  "teamSupport": 0.0,
  "independence": 0.0,
  "teamCoordination": 0.0,
  "earlyGameFocus": 0.0,
  "lateGameFocus": 0.0,
  "burstPreference": 0.0,
  "sustainedCombat": 0.0,
  "reactivePlay": 0.0,
  "riskTaking": 0.0,
  "complexityEnjoyment": 0.0,
  "stabilityPreference": 0.0,
  "highVariancePreference": 0.0,
  "rangePreference": 0.0,
  "meleePreference": 0.0,
  "mapInfluencePreference": 0.0
}
```

相反する質問は単純な反転値とせず、個別回答として保持する。

---

# 10. 注意事項・同意

## 10.1 必須表示

* 本診断が非公式であること
* 医学的・心理学的診断ではないこと
* 総合能力の優劣を判定しないこと
* PC環境差が結果へ影響する可能性
* 軽いストレス演出が含まれること
* いつでも中断できること
* デフォルトでは結果を恒久保存しないこと

## 10.2 ストレス演出に関する表示

```text
診断の一部には、ゲーム中のプレッシャーを再現するため、
軽いストレスを感じる演出が含まれます。

演出には、制限時間の変化、難度上昇、条件変更などが含まれます。
テストはいつでも中断できます。
```

## 10.3 同意項目

診断実施に必要な同意と、任意同意を分ける。

### 必須

* 診断内容を理解した
* PC操作テストを実施することに同意する
* 軽いストレス演出が含まれることを理解した

### 任意

* 診断結果保存
* サービス改善用データ提供
* Riot API連携
* 継続トレーニング履歴保存

---

# 11. キャリブレーション

## 11.1 実施内容

キャリブレーションは以下の3段階で行う。

1. 描画安定性確認
2. ポインター入力確認
3. キーボード入力確認

## 11.2 描画安定性確認

`requestAnimationFrame`を使用し、3秒間のフレーム間隔を取得する。

取得値：

* フレーム数
* 平均フレーム間隔
* フレーム間隔中央値
* 標準偏差
* 50ms超過フレーム数
* 100ms超過フレーム数

初期判定基準：

```json
{
  "durationMs": 3000,
  "maxFrameGapMs": 100,
  "warningFrameGapMs": 50,
  "maximumWarningFrameRatio": 0.05
}
```

## 11.3 ポインター確認

画面上の3点を順番にクリックさせる。

確認項目：

* PointerEvent取得
* 左クリック
* 座標取得
* 極端なイベント遅延
* 入力の重複

## 11.4 キーボード確認

以下のキーを順番に押させる。

```text
Q → W → E → R
```

確認項目：

* keydown取得
* keyup取得
* キー配列
* キーリピート
* 入力抜け

## 11.5 判定

キャリブレーション結果：

```text
valid
warning
invalid
```

### valid

診断続行可能。

### warning

続行可能だが、測定信頼度へ環境警告を付与する。

### invalid

本番診断を開始しない。

---

# 12. 共通テスト仕様

## 12.1 テスト画面

テスト実行中は以下を固定表示する。

* 進捗
* 中断ボタン
* 現在のテスト名
* 必要な場合のみ残り時間
* テスト領域

テスト中に不要なナビゲーションは表示しない。

## 12.2 時刻取得

測定時刻には`performance.now()`を使用する。

`Date.now()`は測定スコアへ使用しない。

## 12.3 フォーカス喪失

以下を検出する。

* visibilitychange
* blur
* fullscreenchange
* ウィンドウサイズ変更

本番中にフォーカスを失った場合、該当試行を無効とする。

複数回発生した場合、当該テスト全体を再実施対象にする。

初期基準：

```json
{
  "maxFocusLossPerTest": 1,
  "maxResizePerTest": 0
}
```

## 12.4 右クリック

複合入力テスト中のみ、テスト領域内のコンテキストメニューを無効化する。

ページ全体では無効化しない。

## 12.5 練習ラウンド

* スコア計算へ含めない
* 操作ミス時に説明を表示できる
* 何度でも繰り返せる
* 最低試行数を完了後、本番へ進める
* 練習結果は操作理解度の参考情報として一時保持可能

---

# 13. クイック診断の時間配分

目標所要時間：

```text
5分00秒～6分30秒
```

初期想定：

| 項目          |      目安 |
| ----------- | ------: |
| 事前説明・プロフィール |  45～75秒 |
| キャリブレーション   |  20～30秒 |
| 基礎操作ブロック    | 90～120秒 |
| 認知・予測ブロック   | 90～120秒 |
| 判断ブロック      |  30～45秒 |
| メンタル安定性ブロック |  45～60秒 |
| 結果計算        |    1秒以内 |

プロフィール入力時間はユーザー差が大きいため、診断時間表示では別扱いにしてもよい。

---

# 14. 詳細診断の時間配分

目標所要時間：

```text
10分00秒～15分00秒
```

詳細診断では、クイック診断の結果を再利用し、追加試行を実施する。

| 項目          | 追加時間目安 |
| ----------- | -----: |
| 基礎操作追加試行    |   2～3分 |
| 認知・予測追加試行   |   3～4分 |
| 判断追加試行      |   1～2分 |
| メンタル安定性追加試行 |   1～2分 |
| 休憩・説明       |   1～2分 |

---

# 15. 反応速度テスト

## 15.1 テスト概要

待機領域の表示状態が変化した時点で、指定入力を行う。

クイック診断では左クリックを使用する。

詳細診断では選択反応を追加する。

## 15.2 クイック診断

### 練習

* 3試行
* 待機時間：800～1800ms
* フライング時は説明を表示

### 本番

* 8試行
* 待機時間：1000～2800ms
* 試行順はランダム
* 入力：左クリック

## 15.3 詳細診断

追加12試行。

内訳：

* 単純反応：4試行
* 色による選択反応：4試行
* キー入力による選択反応：4試行

選択反応例：

```text
青：Q
赤：E
```

## 15.4 無効判定

以下を無効試行とする。

* 刺激表示前の入力
* 刺激表示後80ms未満の入力
* フォーカス喪失
* 100msを超える描画停止が刺激前後に発生
* 複数入力

## 15.5 生データ

```json
{
  "trialId": "reaction_001",
  "stimulusScheduledAt": 0,
  "stimulusRenderedAt": 0,
  "inputAt": 0,
  "reactionTimeMs": 0,
  "inputType": "mouse_left",
  "expectedInput": "mouse_left",
  "isCorrect": true,
  "isFalseStart": false,
  "frameQuality": "valid"
}
```

## 15.6 特徴量

* 反応時間中央値
* 反応時間MAD
* 正答反応時間中央値
* フライング率
* 無反応率
* 前半・後半差
* 選択反応コスト

MAD：

```text
median_absolute_deviation
```

---

# 16. クリック精度テスト

## 16.1 ターゲット表示

ターゲットは同心円構造とする。

初期構成：

| 領域     |       半径比 | 表示点 |
| ------ | --------: | --: |
| 中心     | 0.00～0.20 | 100 |
| 第2領域   | 0.20～0.45 |  75 |
| 第3領域   | 0.45～0.70 |  50 |
| 外周     | 0.70～1.00 |  25 |
| ターゲット外 |     1.00超 |   0 |

半径比は以下で求める。

```text
中心からの距離 ÷ ターゲット半径
```

## 16.2 視覚表現

* 中心：赤系
* 第2領域：黄系
* 第3領域：明度差のある領域
* 外周：枠線付き領域

色に加えて以下を使用する。

* 境界線
* 模様
* リング番号
* 明度差

## 16.3 内部連続スコア

```text
centerScore = 1 - min(normalizedDistance, 1)
```

ターゲット外の場合：

```text
centerScore = 0
```

## 16.4 ターゲットサイズ

画面短辺を基準とする。

```text
targetRadius = clamp(shortViewportSide × ratio, minPx, maxPx)
```

初期値：

```json
{
  "large": {
    "ratio": 0.035,
    "minPx": 24,
    "maxPx": 36
  },
  "medium": {
    "ratio": 0.026,
    "minPx": 18,
    "maxPx": 28
  },
  "small": {
    "ratio": 0.018,
    "minPx": 12,
    "maxPx": 20
  }
}
```

## 16.5 クイック診断

### 練習

* 3試行
* 大サイズ2回
* 中サイズ1回

### 本番

* 12試行
* 大サイズ：3
* 中サイズ：5
* 小サイズ：4
* 最大表示時間：1600ms
* ターゲット間待機：250ms
* 静止ターゲットのみ

ターゲット位置は画面端から一定距離を確保する。

## 16.6 詳細診断

追加18試行。

内訳：

* 静止ターゲット：8
* 一定速度移動：6
* 速度変化あり：4

追加条件：

* 遠距離移動
* 小ターゲット
* 連続出現
* 表示時間短縮

## 16.7 カーソル開始位置

各試行開始時点のカーソル位置を記録する。

カーソルを強制移動しない。

ターゲットまでの距離を記録し、到達時間の補正へ使用する。

## 16.8 生データ

```json
{
  "trialId": "click_001",
  "targetCenter": {
    "x": 0,
    "y": 0
  },
  "targetRadius": 20,
  "targetSizeClass": "medium",
  "cursorStart": {
    "x": 0,
    "y": 0
  },
  "clickPosition": {
    "x": 0,
    "y": 0
  },
  "movementDistance": 0,
  "movementTimeMs": 0,
  "normalizedDistance": 0,
  "ringScore": 100,
  "isHit": true
}
```

## 16.9 特徴量

* 命中率
* 中心命中率
* 正規化距離中央値
* 小ターゲット命中率
* 遠距離移動命中率
* 距離補正済み移動時間
* ミスクリック率
* 前半・後半精度差
* 速度と精度のトレードオフ

---

# 17. 複合入力制御テスト

## 17.1 基本方針

クイック診断では、マウスとキーボードを組み合わせたシーケンステストを使用する。

シーケンスは実行中も表示し、作業記憶能力の影響を抑える。

現在実行すべき操作を強調表示する。

## 17.2 使用可能入力

### キーボード

* Q
* W
* E
* R
* A
* S
* D
* F
* 1
* 2
* 3
* 4
* Space

### マウス

* 左クリック
* 右クリック
* 指定ターゲットクリック
* 指定地点クリック

## 17.3 クイック診断

### 練習

2シーケンス。

* 長さ3
* 長さ4

### 本番

6シーケンス。

| シーケンス数 |  長さ |
| ------ | --: |
| 2      | 4操作 |
| 2      | 5操作 |
| 2      | 6操作 |

例：

```text
対象Aを左クリック
→ Q
→ 対象Bを右クリック
→ E
→ 指定地点を左クリック
```

## 17.4 入力表示

シーケンスは画面上部に横並びで表示する。

状態：

* 未実行
* 現在の入力
* 正解済み
* 誤入力

誤入力時もシーケンスを直ちに終了させず、次の正しい入力へ戻れるようにする。

誤入力回数を記録する。

## 17.5 詳細診断

以下を追加する。

### 対象連動入力

対象の色・形に応じてキーを変える。

例：

```text
円形：Q
三角形：E
四角形：R
```

### ホールド・リリース

* 指定キーを押し続ける
* 指定対象が現れた時点でキーを離す
* 別対象をクリックする

### 条件変化

シーケンス途中で入力規則が変更される。

### 長いシーケンス

7～9操作。

## 17.6 生データ

```json
{
  "sequenceId": "input_001",
  "expectedActions": [
    {
      "type": "mouse_left",
      "targetId": "target_a"
    },
    {
      "type": "key_down",
      "key": "q"
    }
  ],
  "actualActions": [],
  "startedAt": 0,
  "completedAt": 0,
  "errorCount": 0,
  "omissionCount": 0,
  "mouseKeyboardSwitchTimesMs": [],
  "interInputIntervalsMs": []
}
```

## 17.7 サブスコア

```json
{
  "mouseSequenceControl": 0.0,
  "keyboardSequenceControl": 0.0,
  "mouseKeyboardCoordination": 0.0,
  "rhythmStability": 0.0,
  "misinputSuppression": 0.0
}
```

## 17.8 特徴量

* シーケンス完了率
* 正しい入力率
* 誤キー率
* 誤クリック率
* 入力抜け率
* マウス・キーボード切り替え時間
* 入力間隔のばらつき
* シーケンス長による精度低下
* 後半の精度低下

---

# 18. 軌道予測テスト

## 18.1 テスト概要

画面上の対象が一定時間移動したあと非表示になる。

ユーザーは、指定時間後に対象が存在すると予測する位置をクリックする。

## 18.2 クイック診断

### 練習

2試行。

### 本番

8試行。

条件：

* 等速直線運動：4
* 速度変化：2
* 軽い方向変化：2

表示時間：

```text
700～1200ms
```

非表示時間：

```text
350～700ms
```

## 18.3 詳細診断

追加12試行。

追加条件：

* 加速度
* 減速度
* 複数候補方向
* パターン繰り返し
* 学習可能な移動規則
* 不規則に見えるが規則性を持つ軌道

## 18.4 生データ

```json
{
  "trialId": "prediction_001",
  "trajectoryType": "constant_velocity",
  "initialPosition": {},
  "velocity": {},
  "acceleration": {},
  "visibleDurationMs": 0,
  "hiddenDurationMs": 0,
  "expectedPosition": {},
  "predictedPosition": {},
  "predictionError": 0,
  "decisionTimeMs": 0
}
```

## 18.5 誤差

画面短辺を基準として正規化する。

```text
normalizedPredictionError =
  predictedPositionとexpectedPositionの距離
  ÷ 画面短辺
```

## 18.6 特徴量

* 予測誤差中央値
* 速度別予測誤差
* 加速度条件での誤差増加
* 方向変化条件での誤差増加
* 試行による改善率
* 予測方向の偏り
* 判断時間

---

# 19. 注意分配テスト

## 19.1 テスト概要

中央の主タスクを継続しながら、画面周辺に出現するイベントへ対応する。

## 19.2 中央タスク

中央の円をカーソルで追従する。

円は狭い範囲で緩やかに移動する。

測定：

* カーソルと中央対象の距離
* 追従維持率
* 周辺イベント発生前後の精度変化

## 19.3 周辺タスク

画面周辺8領域のいずれかへ記号を表示する。

ユーザーは指定キーを押す。

例：

```text
星印が出たらSpace
```

## 19.4 クイック診断

### 練習

10秒。

### 本番

35秒。

周辺イベント：

* 8～10回
* 同時表示は最大1
* 表示時間：700ms

## 19.5 詳細診断

60秒。

追加条件：

* 周辺イベント2種類
* 異なるキー入力
* 同時イベント最大2
* 中央対象の速度変化

## 19.6 特徴量

* 周辺イベント発見率
* 周辺イベント反応時間
* 中央追従精度
* 周辺イベント発生時の中央精度低下
* 位置別見落とし率
* 対応後の中央タスク復帰時間

---

# 20. タスク切り替えテスト

## 20.1 テスト概要

表示される対象の特徴に応じて、クリック、キー入力、無視を切り替える。

## 20.2 クイック診断

### 練習

8試行。

### 本番

24試行。

基本規則例：

```text
青い円：左クリック
赤い円：無視
黄色い円：Q
```

12試行後に規則を変更する。

変更例：

```text
青い円：無視
赤い円：左クリック
黄色い円：E
```

## 20.3 詳細診断

追加36試行。

追加条件：

* 規則変更2回
* 元の規則へ戻る
* 形と色の複合条件
* マウスとキーの切り替え

## 20.4 特徴量

* 非切り替え試行正解率
* 切り替え直後正解率
* 切り替えコスト
* 誤クリック率
* 誤キー率
* 無視すべき対象への反応率
* 元の規則へ戻った際の混同率
* 規則保持率

---

# 21. 判断テスト

## 21.1 基本方針

一般的な判断特性と、League of Legends知識を分離する。

能力ベクトルの判断速度・判断精度には、主として抽象判断テストを使用する。

LoL文脈テストは、補助情報として扱う。

## 21.2 抽象判断テスト

複数の情報を表示し、制限時間内に選択させる。

例：

```text
選択肢A：
成功率が高いが報酬は小さい

選択肢B：
成功率は低いが報酬は大きい

現在は失敗できる回数が少ない
```

## 21.3 クイック診断

* 8問
* 1問あたり最大4秒
* 選択肢2～4個
* 条件変更問題を2問含む

## 21.4 詳細診断

追加12問。

条件：

* 情報不足
* 途中で追加情報が出る
* 時間制限が短い
* 一貫性確認用の類似問題
* リスク選択の変化確認

## 21.5 LoL文脈問題

任意または詳細診断で実施する。

能力値とは分離し、以下を算出する。

```json
{
  "lolKnowledge": 0.0,
  "macroUnderstanding": 0.0,
  "laneSituationUnderstanding": 0.0
}
```

## 21.6 特徴量

* 正解率
* 判断時間中央値
* 情報活用率
* 条件変更後正解率
* 類似問題への一貫性
* リスク選択傾向
* 時間圧迫による正解率低下

---

# 22. メンタル安定性テスト

## 22.1 基本方針

メンタル安定性は自己申告ではなく、通常条件と軽いストレス条件の差から測定する。

人格、精神状態、疾病を評価しない。

## 22.2 使用する基礎タスク

クリック精度、複合入力、判断テストを簡略化した混合タスクを使用する。

## 22.3 クイック診断

構成：

1. 通常条件：15秒
2. ストレス条件：20秒
3. 回復条件：15秒

合計約50秒。

## 22.4 ストレス演出

以下から2～3種類を組み合わせる。

* 残り時間表示を強調する
* ターゲット表示時間を短くする
* 一部ターゲットの挙動を変える
* 入力規則を一度変更する
* スコア表示を一時的に不利に見せる
* 連続ミスが起こりやすい難度へ上げる

## 22.5 制限

以下は禁止する。

* 大音量
* 強いフラッシュ
* 侮辱的な文言
* ユーザーを責める表示
* 実際には存在しないペナルティの脅迫
* 終了できない演出
* 医学的な不安を煽る表現

## 22.6 デブリーフィング

終了後に以下を表示する。

```text
このテストでは、プレッシャー下での操作変化を確認するため、
一時的に制限時間や難度を変化させました。

表示された一部のスコア演出は、測定用の演出です。
```

## 22.7 特徴量

### プレッシャー下安定性

* 通常条件からの命中率低下
* 通常条件からの反応時間変化
* 誤入力増加
* 判断精度低下
* リスク選択変化

### 回復力

* 回復条件1試行目の状態
* 通常範囲へ戻るまでの試行数
* 回復傾向
* 失敗連鎖の長さ

---

# 23. テスト順序

## 23.1 ブロック順序

固定順：

1. キャリブレーション
2. 基礎操作ブロック
3. 認知・予測ブロック
4. 判断ブロック
5. メンタル安定性ブロック

## 23.2 ブロック内ランダム化

### 基礎操作ブロック

以下をランダム順で実施する。

* 反応速度
* クリック精度
* 複合入力制御

### 認知・予測ブロック

以下をランダム順で実施する。

* 軌道予測
* 注意分配
* タスク切り替え

メンタル安定性テストは最後に固定する。

## 23.3 再現性

ランダム順にはセッションごとのシードを使用する。

同一セッション内で再読み込みした場合、テスト順を再現可能にする。

---

# 24. 生データ共通形式

```json
{
  "schemaVersion": "1.0.0",
  "sessionId": "diag_xxx",
  "testId": "click_accuracy",
  "testVersion": "1.0.0",
  "mode": "quick",
  "startedAtMonotonic": 0,
  "completedAtMonotonic": 0,
  "environment": {
    "viewportWidth": 0,
    "viewportHeight": 0,
    "devicePixelRatio": 1,
    "inputDevice": "mouse",
    "browser": "chrome"
  },
  "qualityFlags": [],
  "trials": []
}
```

生データは診断中のみ保持し、特徴量計算後に破棄可能とする。

---

# 25. 特徴量共通形式

```json
{
  "schemaVersion": "1.0.0",
  "sessionId": "diag_xxx",
  "featureVersion": "1.0.0",
  "features": {
    "reactionMedianMs": 0,
    "reactionMadMs": 0,
    "clickHitRate": 0,
    "clickMedianNormalizedDistance": 0
  },
  "quality": {
    "validTrialRatio": 0,
    "frameStability": 0,
    "inputStability": 0
  }
}
```

---

# 26. 特徴量の外れ値処理

## 26.1 基本方針

単純平均ではなく、中央値とMADを中心に使用する。

## 26.2 反応時間

以下を除外候補とする。

* 80ms未満
* 2000ms超過
* 中央値から4MADを超える値

外れ値を除外した場合も、外れ値数を品質情報として保持する。

## 26.3 クリック・入力時間

操作時間が極端に長い場合は除外せず、タイムアウトとして分類する。

## 26.4 最低有効試行数

初期値：

```json
{
  "reaction": 6,
  "clickAccuracy": 9,
  "inputControl": 4,
  "prediction": 6,
  "attentionDistribution": 1,
  "taskSwitching": 18,
  "decision": 6,
  "mentalStability": 1
}
```

最低数を満たさない場合、対応能力の信頼度を「再テスト推奨」とする。

---

# 27. スコア正規化

## 27.1 基本方針

各特徴量を0.0から1.0へ正規化する。

ユーザーには数値を表示しない。

## 27.2 正規化設定

正規化基準は別ファイルで管理する。

```text
normalization_profiles.json
```

## 27.3 高いほど良い特徴量

```text
normalized =
  clamp((value - lowReference) / (highReference - lowReference), 0, 1)
```

## 27.4 低いほど良い特徴量

```text
normalized =
  clamp((highReference - value) / (highReference - lowReference), 0, 1)
```

## 27.5 初期基準

公開前の初期基準は開発者テストおよび少人数テストから作成する。

利用データが蓄積した後は、以下を検討する。

* デバイス別基準
* 経験別基準
* ブラウザ別補正
* 分位点ベースの正規化

経験別基準を使用する場合でも、経験の違いを能力値へ直接加点してはならない。

---

# 28. 能力スコア計算

## 28.1 反応速度

```text
reaction =
  0.70 × normalizedReactionMedian
+ 0.20 × normalizedReactionStability
+ 0.10 × falseStartSuppression
```

## 28.2 クリック精度

```text
clickAccuracy =
  0.45 × hitRateScore
+ 0.35 × centerAccuracyScore
+ 0.20 × smallTargetScore
```

速度はクリック精度へ直接混ぜず、補助特徴量として保持する。

## 28.3 複合入力制御

```text
inputControl =
  0.25 × mouseSequenceControl
+ 0.25 × keyboardSequenceControl
+ 0.20 × mouseKeyboardCoordination
+ 0.20 × rhythmStability
+ 0.10 × misinputSuppression
```

## 28.4 軌道予測

```text
prediction =
  0.60 × positionPredictionAccuracy
+ 0.25 × velocityChangeAdaptation
+ 0.15 × patternLearning
```

## 28.5 注意分配

```text
attentionDistribution =
  0.50 × peripheralDetection
+ 0.30 × centralTaskRetention
+ 0.20 × peripheralReaction
```

## 28.6 タスク切り替え

```text
taskSwitching =
  0.50 × postSwitchAccuracy
+ 0.30 × switchCostScore
+ 0.20 × ruleRetention
```

## 28.7 判断精度

```text
decisionQuality =
  0.60 × decisionCorrectness
+ 0.20 × informationUtilization
+ 0.20 × consistency
```

## 28.8 判断速度

まず、正答試行のみから速度スコアを計算する。

```text
baseDecisionSpeed = normalizedCorrectResponseTime
```

判断精度による補正：

```text
decisionSpeed =
  baseDecisionSpeed
  × (0.50 + 0.50 × decisionQuality)
```

これにより、速く誤答するだけでは高得点にならない。

## 28.9 プレッシャー下安定性

```text
pressureDegradation =
  0.30 × accuracyDrop
+ 0.20 × reactionDelayIncrease
+ 0.20 × misinputIncrease
+ 0.20 × decisionQualityDrop
+ 0.10 × riskBehaviorShift

pressureStability =
  clamp(1 - pressureDegradation, 0, 1)
```

## 28.10 回復力

```text
recovery =
  0.45 × recoveryTrialCountScore
+ 0.30 × recoverySlopeScore
+ 0.25 × failureChainSuppression
```

---

# 29. 能力ベクトル形式

```json
{
  "schemaVersion": "1.0.0",
  "abilityVersion": "1.0.0",
  "abilities": {
    "reaction": 0.0,
    "clickAccuracy": 0.0,
    "inputControl": 0.0,
    "prediction": 0.0,
    "attentionDistribution": 0.0,
    "taskSwitching": 0.0,
    "decisionSpeed": 0.0,
    "decisionQuality": 0.0,
    "pressureStability": 0.0,
    "recovery": 0.0
  },
  "subscores": {
    "inputControl": {
      "mouseSequenceControl": 0.0,
      "keyboardSequenceControl": 0.0,
      "mouseKeyboardCoordination": 0.0,
      "rhythmStability": 0.0,
      "misinputSuppression": 0.0
    }
  }
}
```

---

# 30. 測定信頼度

## 30.1 計算要素

能力ごとに以下を評価する。

```text
confidence =
  0.30 × validSampleScore
+ 0.25 × dispersionScore
+ 0.20 × frameStabilityScore
+ 0.15 × inputStabilityScore
+ 0.10 × completionScore
```

## 30.2 信頼度表示

|    内部値 | 表示             |
| -----: | -------------- |
| 0.80以上 | 測定は安定しています     |
| 0.65以上 | おおむね安定しています    |
| 0.45以上 | 結果にややばらつきがあります |
| 0.45未満 | 再テストを推奨します     |

初期閾値は設定ファイルで変更可能とする。

## 30.3 信頼度の利用

信頼度は能力値へ乗算しない。

低信頼度時は以下を行う。

* 当該能力の推薦内ウェイトを弱める
* 候補差が小さい場合は順位を断定しない
* 推薦理由の主根拠として使用しない
* 結果文へ注意書きを表示する
* 再テスト対象に追加する

## 30.4 信頼度ウェイト

類似度計算時は以下を使用する。

```text
effectiveDimensionWeight =
  baseWeight × (0.40 + 0.60 × confidence)
```

能力値自体は変更しない。

---

# 31. 初心者補正

## 31.1 基本原則

以下は変更しない。

* 能力スコア
* 生特徴量
* 測定信頼度

初心者補正は以下へ使用する。

* 難易度適合
* 要求能力の解釈
* 成長候補
* 結果文章
* 練習内容

## 31.2 経験レベル

内部的に以下を算出する。

```json
{
  "lolExperienceLevel": 0.0,
  "mouseExperienceLevel": 0.0,
  "keyboardExperienceLevel": 0.0,
  "combinedInputExperienceLevel": 0.0
}
```

## 31.3 要求値の緩和

初心者に対しては、練習可能と定義された非致命的能力のみ、最大0.05まで要求値判定を緩和できる。

```text
adjustedRequirement =
  baseRequirement - beginnerTolerance
```

制約：

* 重要度0.8以上の致命的能力には適用しない
* 能力スコア自体は変更しない
* 「今すぐ向いている」へ過剰に押し上げない
* 主に「練習すれば伸びそう」の判定へ使用する

## 31.4 入力経験が少ない場合

結果文へ以下の趣旨を表示できる。

```text
マウスとキーボードの同時操作への習熟が、
今回の複合入力結果に影響している可能性があります。
```

---

# 32. チャンピオン基本プロファイル

ファイル：

```text
champion_base_profiles.json
```

## 32.1 形式

```json
{
  "schemaVersion": "1.0.0",
  "championId": "gragas",
  "championName": {
    "ja-JP": "グラガス",
    "en-US": "Gragas"
  },
  "profileVersion": "1.0.0",
  "gamePatch": "configurable",
  "status": "active",
  "styleProfile": {},
  "minimumRequirements": {},
  "requirementWeights": {},
  "difficultyProfile": {},
  "preferenceProfile": {},
  "strengthTags": [],
  "riskTags": [],
  "trainingTags": []
}
```

---

# 33. チャンピオン・レーンプロファイル

ファイル：

```text
champion_lane_profiles.json
```

## 33.1 派生型

基本ベクトルとレーン補正を使用する。

```json
{
  "championId": "gragas",
  "lane": "jungle",
  "profileMode": "derived",
  "baseProfileId": "gragas-base",
  "laneModifierId": "jungle-standard",
  "profileVersion": "1.0.0",
  "adjustments": {
    "prediction": 0.10,
    "attentionDistribution": 0.15,
    "decisionQuality": 0.10,
    "reaction": -0.05
  }
}
```

## 33.2 明示型

レーンによってプレイスタイルが大きく変化する場合に使用する。

```json
{
  "championId": "example",
  "lane": "support",
  "profileMode": "explicit",
  "profileVersion": "1.0.0",
  "styleProfile": {},
  "minimumRequirements": {},
  "requirementWeights": {},
  "difficultyProfile": {},
  "preferenceProfile": {}
}
```

## 33.3 明示型を使用する条件

以下のいずれかに該当する場合、明示型を使用する。

* 主な役割が変化する
* 戦闘距離が変化する
* 主力スキルの利用方法が変化する
* アイテム構成により立ち位置が変化する
* マクロ要求が大きく変化する
* 集団戦時の責任が変化する
* 主要能力の重要度が0.20以上変化する
* 最低要求能力が0.15以上変化する

数値基準は初期値とする。

---

# 34. レーン補正

ファイル：

```text
lane_modifiers.json
```

レーン補正はチャンピオン個別の適性を決定するものではなく、一般的な文脈補正として扱う。

例：

```json
{
  "laneId": "jungle",
  "modifierVersion": "1.0.0",
  "styleAdjustments": {
    "attentionDistribution": 0.10,
    "taskSwitching": 0.08,
    "decisionQuality": 0.10
  },
  "difficultyAdjustments": {
    "macroRequirement": 0.15,
    "decisionComplexity": 0.10
  }
}
```

補正適用後は0.0から1.0へクランプする。

---

# 35. 難易度ベクトル

```json
{
  "inputComplexity": 0.0,
  "aimDifficulty": 0.0,
  "decisionComplexity": 0.0,
  "macroRequirement": 0.0,
  "knowledgeRequirement": 0.0,
  "punishmentOnFailure": 0.0,
  "situationalDependence": 0.0,
  "masteryTime": 0.0
}
```

難易度総合値は原則として生成しない。

結果文では必要な難しさのみ説明する。

---

# 36. プレイ嗜好プロファイル

チャンピオン・レーン構成は、ユーザー嗜好と同じ軸を持つ。

```json
{
  "aggression": 0.0,
  "teamSupport": 0.0,
  "independence": 0.0,
  "teamCoordination": 0.0,
  "earlyGameFocus": 0.0,
  "lateGameFocus": 0.0,
  "burstPreference": 0.0,
  "sustainedCombat": 0.0,
  "reactivePlay": 0.0,
  "riskTaking": 0.0,
  "complexityEnjoyment": 0.0,
  "stabilityPreference": 0.0,
  "highVariancePreference": 0.0,
  "rangePreference": 0.0,
  "meleePreference": 0.0,
  "mapInfluencePreference": 0.0
}
```

---

# 37. スタイル一致度

## 37.1 計算

ユーザー能力ベクトルとチャンピオン・レーンのスタイルベクトルに対し、重み付きコサイン類似度を使用する。

```text
styleMatch =
  weightedCosineSimilarity(
    userAbility,
    championStyle,
    effectiveDimensionWeights
  )
```

## 37.2 有効ウェイト

```text
effectiveDimensionWeight =
  championRequirementWeight
  × confidenceAdjustment
```

## 37.3 注意

スタイル一致度は能力の絶対的な充足を表さない。

スタイル一致度が高くても最低要求に不足がある場合、「今すぐ能力を発揮しやすい」には入らない可能性がある。

---

# 38. 不足量と準備度

## 38.1 片側不足距離

```text
shortfall =
  Σ weight[i] × max(0, requirement[i] - userAbility[i])²
  ÷ Σ weight[i]
```

要求値を超えている能力は差として扱わない。

## 38.2 準備度

```text
readiness = exp(-alpha × shortfall)
```

初期値：

```json
{
  "alpha": 6.0
}
```

## 38.3 致命的不足

以下を満たす能力を致命的不足候補とする。

```text
requirementWeight >= 0.80
かつ
requirement - userAbility >= 0.18
```

初期閾値は設定ファイル化する。

---

# 39. 好み一致度

ユーザー嗜好と候補嗜好プロファイルの重み付き距離を使用する。

```text
preferenceDistance =
  weightedMean(abs(userPreference - championPreference))

preferenceMatch =
  1 - preferenceDistance
```

回答が中立または未回答の軸はウェイトを下げる。

---

# 40. 難易度適合

能力と難易度の対応はマッピング定義を使用する。

ファイル：

```text
difficulty_ability_mapping.json
```

例：

```json
{
  "inputComplexity": {
    "inputControl": 0.70,
    "taskSwitching": 0.30
  },
  "aimDifficulty": {
    "clickAccuracy": 0.60,
    "prediction": 0.40
  },
  "decisionComplexity": {
    "decisionQuality": 0.50,
    "decisionSpeed": 0.20,
    "taskSwitching": 0.30
  }
}
```

難易度要求と能力の片側距離から`difficultyFit`を算出する。

LoL経験や入力経験は、知識要求、習熟時間、入力複雑性の解釈へ使用する。

---

# 41. 成長到達可能性

```text
growthReachability =
  0.35 × shortfallConcentration
+ 0.30 × trainability
+ 0.20 × foundationStrength
+ 0.15 × confidenceSupport
```

## 41.1 不足能力数

不足能力は以下で判定する。

```text
requirement - userAbility >= 0.08
```

「練習すれば伸びそう」の基本条件：

* 不足能力数1～3
* 致命的不足が最大1
* 不足能力にtrainingTagがある
* 他の重要能力の多くを満たしている

## 41.2 不足集中度

不足量が少数の能力へ集中しているほど高くする。

多数の能力へ均等に不足が分散している場合は低くする。

---

# 42. 推薦カテゴリ定義

ファイル：

```text
recommendation_categories.json
```

```json
{
  "schemaVersion": "1.0.0",
  "categories": [
    {
      "id": "ready_now",
      "name": "今すぐ能力を発揮しやすい",
      "displayOrder": 1,
      "primaryCount": 1,
      "alternativeCount": 2
    },
    {
      "id": "growth_candidate",
      "name": "練習すれば伸びそう",
      "displayOrder": 2,
      "primaryCount": 1,
      "alternativeCount": 2
    },
    {
      "id": "aspirational",
      "name": "好みは合うが難易度が高い",
      "displayOrder": 3,
      "primaryCount": 1,
      "alternativeCount": 2
    }
  ]
}
```

---

# 43. 推薦計算設定

ファイル：

```text
recommendation_scoring_config.json
```

## 43.1 今すぐ能力を発揮しやすい

```text
nowScore =
  0.40 × styleMatch
+ 0.30 × readiness
+ 0.20 × preferenceMatch
+ 0.10 × difficultyFit
```

基本条件：

* 致命的不足0
* 測定信頼度が最低基準以上
* 好みと極端に反していない
* 現在有効なレーン構成
* 最重要能力が大幅不足していない

## 43.2 練習すれば伸びそう

```text
growthScore =
  0.40 × styleMatch
+ 0.30 × growthReachability
+ 0.15 × preferenceMatch
+ 0.15 × futureDifficultyFit
```

基本条件：

* 不足能力1～3
* trainingTagが存在
* 他の主要能力が一定以上
* 不足が改善可能と定義されている
* 完全に遠い候補ではない

## 43.3 好みは合うが難易度が高い

```text
aspirationScore =
  0.40 × preferenceMatch
+ 0.30 × styleMatch
+ 0.20 × longTermPotential
+ 0.10 × challengeAppeal
```

基本条件：

* 好み一致度が高い
* 少なくとも1つ以上の主要能力が一致
* 難易度の説明が存在
* 長期練習メニューが存在
* すべての主要能力で大幅不足していない

---

# 44. 推薦ラベル

ユーザーへ数値を表示しない。

内部スコアから以下へ変換する。

## 44.1 今すぐ能力を発揮しやすい

* 非常に高い
* 高い
* 比較的高い

## 44.2 練習すれば伸びそう

* 成長相性が非常に高い
* 成長相性が高い
* 挑戦する価値がある

## 44.3 好みは合うが難易度が高い

* 長期的な相性が非常に高い
* 長期的な相性が高い
* 新しい可能性

ラベル閾値は設定ファイルに持つ。

初期例：

```json
{
  "veryHigh": 0.78,
  "high": 0.65,
  "moderate": 0.52
}
```

基準未満の候補は表示しない。

---

# 45. 多様性リランキング

ファイル：

```text
recommendation_diversity_rules.json
```

## 45.1 グローバル制約

```json
{
  "maxSameChampionAcrossDiagnosis": 1,
  "maxSameLaneAcrossDiagnosis": 4,
  "maxSameReasonTagPerCategory": 2,
  "avoidDuplicatePlayPattern": true,
  "minimumEligibleScoreRequired": true
}
```

## 45.2 選出順序

1. 全候補をカテゴリごとに採点する
2. 条件を満たさない候補を除外する
3. `ready_now`の候補を選ぶ
4. 選出済みチャンピオンを除外する
5. `growth_candidate`を選ぶ
6. 選出済みチャンピオンを除外する
7. `aspirational`を選ぶ
8. 各カテゴリ内で多様性調整する
9. 空いた枠を次点候補で補充する

## 45.3 同一チャンピオン

同一チャンピオンが複数レーンで候補になった場合、最も高いカテゴリ優先度とスコアを持つ構成だけを残す。

優先順位：

```text
ready_now
growth_candidate
aspirational
```

## 45.4 多様性ペナルティ

以下が重複する場合、順位を下げる。

* 同じ主要推薦理由
* 同じ戦闘距離
* 同じ役割特性
* 同じレーン
* 同じ操作タイプ要求

適性基準を下回る候補は、多様性目的でも追加しない。

---

# 46. 適性タイプ

ファイル：

```text
aptitude_types.json
```

## 46.1 タイプ定義

```json
{
  "typeId": "predictive_hunter",
  "name": "先読みの狩人",
  "descriptionTemplateId": "aptitude.predictive_hunter",
  "ruleVersion": "draft",
  "status": "rule_pending",
  "positiveTraits": [
    "prediction",
    "decisionQuality",
    "clickAccuracy"
  ],
  "supportingTraits": [
    "attentionDistribution",
    "pressureStability"
  ],
  "conflictingTraits": []
}
```

## 46.2 初期タイプ候補

* 先読みの狩人
* 瞬発の決闘者
* 盤面の管制官
* 不動の守護者
* 機会を待つ執行者
* 混沌の演算者
* 着実な征服者

## 46.3 判定エンジン

各タイプに対し、将来的に以下を設定可能にする。

```text
typeScore =
  positiveTraitScore
+ supportingTraitScore
+ preferenceScore
- conflictPenalty
```

現段階ではエンジン構造のみ固定し、最終的な数値ウェイトと閾値は評価データをもとに設定する。

## 46.4 メイン・サブタイプ

* 最高スコアをメインタイプ
* 2位をサブタイプ候補
* 2位が1位の85%以上の場合に表示
* 特徴重複率が80%以上の場合は3位を検討
* 適合基準未満ならサブタイプを表示しない

---

# 47. 操作タイプ

ファイル：

```text
operation_types.json
```

候補：

* 精密予測型
* 高速連携型
* 安定反復型
* 広域監視型
* 瞬間判断型
* 慎重確定型
* 柔軟切替型

複数能力の組み合わせルールで決定する。

例：

```text
精密予測型 =
  clickAccuracy高
  prediction高
  inputControl中以上
```

具体的閾値は設定ファイル化する。

---

# 48. メンタルタイプ

ファイル：

```text
mental_types.json
```

候補：

* 安定維持型
* 素早い回復型
* 慎重適応型
* プレッシャー集中型
* 序盤変動型
* リズム依存型

判定は以下を中心に行う。

* pressureStability
* recovery
* ストレス直後の変化
* 回復曲線
* 判断方針の変化
* 入力リズムの変化

人格的な名称は禁止する。

---

# 49. 長所選択ルール

ファイル：

```text
strength_rules.json
```

## 49.1 選択優先順位

1. 信頼度が高い
2. 複数テストで確認できる
3. 推薦候補と結び付く
4. 他能力を補完している
5. 単純な高スコア

## 49.2 長所分類

```text
absolute_strength
stability_strength
recovery_strength
decision_strength
compensating_strength
```

## 49.3 最低選出数

* 主要な強み：1
* 補助的な強み：1
* 改善可能な課題：1

## 49.4 補完関係

例：

```json
{
  "ruleId": "prediction_compensates_reaction",
  "conditions": {
    "prediction": "high",
    "reaction": "not_high"
  },
  "templateId": "strength.prediction_compensates_reaction"
}
```

---

# 50. 苦手状況変換

ファイル：

```text
weakness_situation_rules.json
```

例：

```json
{
  "lowTaskSwitching": [
    "複数の対象を短時間で切り替える集団戦",
    "攻撃対象と使用スキルを頻繁に変更する場面"
  ],
  "lowPressureStability": [
    "連続してスキルを外した直後",
    "制限時間や敵の接近で判断を急かされる場面"
  ],
  "lowAttentionDistribution": [
    "レーン操作とマップ確認を同時に行う場面",
    "複数方向から敵が接近する状況"
  ]
}
```

表示時は「苦手」と断定せず、「精度が下がりやすい傾向」と表現する。

---

# 51. 練習メニュー

ファイル：

```text
training_menu_rules.json
```

## 51.1 構造

```json
{
  "trait": "clickAccuracy",
  "appTraining": {
    "title": "中心精度トレーニング",
    "description": "速度より命中精度を優先して小さいターゲットをクリックする",
    "durationMinutes": 3
  },
  "lolTraining": {
    "description": "練習ツールで移動しながら対象を切り替える"
  },
  "goal": "命中率90%以上を維持したまま速度を上げる"
}
```

## 51.2 表示数

* 主要課題：1
* 補助課題：1

## 51.3 選択基準

* 不足量
* 改善可能性
* 推薦候補との関連
* 測定信頼度
* 初心者経験
* 所要時間

信頼度が低い能力は、練習課題ではなく再テスト候補を優先する。

---

# 52. 結果文章生成

## 52.1 方針

LLMを使用しない。

構造化データとテンプレートから生成する。

## 52.2 処理順

1. メイン・サブ適性タイプを選択
2. 操作タイプを選択
3. メンタルタイプを選択
4. 主要な強みを選択
5. 補助的な強みを選択
6. 改善課題を選択
7. 推薦理由タグを選択
8. 苦手状況へ変換
9. 練習メニューを選択
10. テンプレートへ挿入
11. 重複表現を除去
12. 信頼度に応じて断定度を調整

## 52.3 テンプレートファイル

```text
result_text_templates.json
```

## 52.4 変数例

```text
{{mainAptitudeType}}
{{subAptitudeType}}
{{operationType}}
{{mentalType}}
{{primaryStrength}}
{{secondaryStrength}}
{{championName}}
{{laneName}}
{{recommendationReason}}
{{riskSituation}}
{{trainingMenu}}
```

## 52.5 断定度

### 高信頼度

```text
～に強みがあります。
～を発揮しやすい傾向があります。
```

### 中信頼度

```text
～に強みがある可能性があります。
～を発揮しやすい傾向が見られました。
```

### 低信頼度

```text
今回の測定では～の傾向が見られましたが、
結果にばらつきがあるため再テストを推奨します。
```

---

# 53. 結果画面仕様

## 53.1 上部サマリー

表示：

* メイン適性タイプ
* サブ適性タイプ
* 操作タイプ
* メンタルタイプ
* 主要な強み
* 補助的な強み
* 測定品質

## 53.2 推薦カテゴリ

表示順：

1. 今すぐ能力を発揮しやすい
2. 練習すれば伸びそう
3. 好みは合うが難易度が高い

各カテゴリ：

* メイン推薦カード
* 代替候補2件
* カテゴリ説明

## 53.3 メイン推薦カード

表示：

* レーン名
* チャンピオン名
* チャンピオン画像
* 定性ラベル
* 推薦理由
* 活かせる強み
* 注意点
* 関連する練習課題

## 53.4 代替候補

初期状態では以下のみ表示する。

* レーン名
* チャンピオン名
* 定性ラベル
* 短い推薦理由

展開時に詳細表示する。

## 53.5 能力値

数値グラフを表示する場合も、以下は禁止する。

* 総合点
* 順位
* パーセンタイル
* 下位・上位表示

能力レーダーチャートを使用する場合は、数値目盛りを省略し、傾向表示として扱う。

---

# 54. 再テスト

## 54.1 再テスト候補

* 信頼度が低い能力
* ユーザーが再測定を希望する能力
* 推薦理由へ大きく影響した能力
* 環境異常が発生したテスト

## 54.2 再テスト後の反映

保存なしの場合：

* 今回のセッション内で最新有効結果を使用

保存ありの場合：

* 今回結果
* 過去結果
* 過去数回の中央値
* 継続プロフィール

を分ける。

## 54.3 最高値採用禁止

複数回の最高値だけを採用しない。

継続プロフィールでは、直近3回の中央値または信頼度加重平均を使用する。

---

# 55. SNS共有カード

## 55.1 サイズ

初期対応：

* 1200×630
* 1080×1080

## 55.2 表示項目

* サービス名
* メイン適性タイプ
* サブ適性タイプ
* 操作タイプ
* 各カテゴリのメイン推薦
* 主要な強み

## 55.3 非表示

* 生能力値
* メンタル数値
* ランク
* 経験年数
* 苦手項目
* 入力機器
* セッションID

## 55.4 プレビュー

共有前にプレビュー画面を表示する。

ユーザーが表示項目を確認できること。

---

# 56. フィードバックUI

## 56.1 表示方式

結果画面下部の折りたたみ式カードとする。

モーダルを使用しない。

## 56.2 表示条件

以下のいずれかを満たした場合に表示する。

* 推薦カードを1件以上開いた
* 結果画面を50%以上スクロールした
* 30秒以上滞在した
* 共有カードを開いた

## 56.3 初期質問

```text
この診断結果は納得できましたか？
```

回答：

* 納得できた
* 一部納得できた
* 違うと思う

## 56.4 展開質問

* 実際に得意なチャンピオン
* よく使用するチャンピオン
* 推薦チャンピオンを使ってみたいか
* 納得できた理由
* 納得できなかった理由
* 自由記述

## 56.5 再表示

閉じた場合、そのセッション中は自動再表示しない。

---

# 57. データ保存

## 57.1 デフォルト

恒久保存しない。

診断終了後またはタブ終了後に以下を破棄する。

* 生入力イベント
* 詳細なポインター軌跡
* キー入力時刻列
* 試行単位ログ

## 57.2 任意保存対象

```json
{
  "abilityVector": {},
  "subscores": {},
  "confidence": {},
  "recommendations": {},
  "aptitudeTypes": {},
  "configVersions": {},
  "createdAt": ""
}
```

## 57.3 サービス改善データ

ユーザーが別途同意した場合のみ送信する。

可能な限り匿名化し、以下を基本とする。

* 集計済み能力値
* 信頼度
* 推薦候補
* 納得度
* 自己申告チャンピオン
* バージョン情報

---

# 58. API仕様

## 58.1 設定取得

```text
GET /api/config/manifest
```

返却：

* 各設定ファイルのバージョン
* 対応ゲームパッチ
* 更新日時

## 58.2 チャンピオンプロファイル取得

```text
GET /api/profiles/champions
GET /api/profiles/champion-lanes
```

## 58.3 フィードバック送信

```text
POST /api/feedback
```

送信例：

```json
{
  "diagnosisVersion": "1.0.0",
  "satisfaction": "partial",
  "selfReportedStrongChampions": [],
  "comment": ""
}
```

## 58.4 任意保存

```text
POST /api/diagnosis-results
```

明示同意がある場合のみ使用する。

## 58.5 削除

```text
DELETE /api/diagnosis-results/{resultId}
```

---

# 59. 設定ファイル一覧

```text
ability_dimensions.json
ability_subscores.json
test_definitions.json
normalization_profiles.json
feature_definitions.json
champion_base_profiles.json
champion_lane_profiles.json
lane_modifiers.json
difficulty_dimensions.json
difficulty_ability_mapping.json
preference_dimensions.json
aptitude_types.json
operation_types.json
mental_types.json
strength_rules.json
weakness_situation_rules.json
training_menu_rules.json
recommendation_categories.json
recommendation_scoring_config.json
recommendation_diversity_rules.json
result_text_templates.json
confidence_config.json
beginner_adjustment_config.json
patch_manifest.json
```

---

# 60. バージョン情報

診断結果には以下を記録する。

```json
{
  "diagnosisVersion": "1.0.0",
  "testDefinitionVersion": "1.0.0",
  "abilityVersion": "1.0.0",
  "normalizationVersion": "1.0.0",
  "championProfileVersion": "1.0.0",
  "recommendationConfigVersion": "1.0.0",
  "diversityRuleVersion": "1.0.0",
  "aptitudeRuleVersion": "1.0.0",
  "templateVersion": "1.0.0",
  "gamePatch": "configurable"
}
```

---

# 61. エラー処理

## 61.1 描画不安定

表示：

```text
現在の環境では、正確な測定が難しい状態です。
他のタブや負荷の高いアプリを閉じてから再試行してください。
```

## 61.2 フォーカス喪失

該当試行を無効化し、再試行する。

複数回発生した場合はテストを中断し、説明画面へ戻す。

## 61.3 ウィンドウサイズ変更

本番試行を無効化し、再キャリブレーションする。

## 61.4 入力機器の切り替え

診断中に入力機器の種類が変わったと判断された場合、警告を表示する。

## 61.5 設定ファイル不整合

以下を確認する。

* schemaVersion
* configVersion
* gamePatch
* 必須フィールド
* 能力軸の一致
* 重み合計

不整合時は診断開始を停止する。

## 61.6 推薦候補不足

カテゴリ条件を満たす候補が3件未満の場合、適性の低い候補で埋めない。

表示例：

```text
このカテゴリでは、現在の測定結果から十分な根拠を持つ候補を
3件まで絞り込めませんでした。
```

---

# 62. パフォーマンス要件

* テスト中の描画は可能な限り60fpsを維持する
* 50ms超過フレームを検出する
* 入力イベント処理内で重い計算を行わない
* 特徴量計算はテスト終了後に行う
* 結果計算は原則1秒以内
* 共有画像生成は3秒以内を目標とする
* 設定ファイルは診断開始前に取得・検証する

---

# 63. アクセシビリティ要件

* 色だけで状態を区別しない
* 十分なコントラストを確保する
* 説明文を再表示可能にする
* キーボード操作対象を明確にする
* 点滅や強いフラッシュを使用しない
* 音を必須にしない
* 中断ボタンを常に利用可能にする
* ストレス演出を事前告知する
* 共有カードに過度な個人情報を含めない

---

# 64. テスト・検証

## 64.1 単体テスト

対象：

* 正規化
* 能力スコア
* 信頼度
* コサイン類似度
* 片側不足距離
* 推薦カテゴリ計算
* 同一チャンピオン除外
* 多様性リランキング
* テンプレート生成
* JSON Schema検証

## 64.2 ブラウザテスト

対象候補：

* Chrome
* Edge
* Firefox

確認：

* PointerEvent
* KeyboardEvent
* requestAnimationFrame
* CanvasまたはDOM描画
* 右クリック抑止
* フォーカス喪失
* 共有画像生成

## 64.3 診断妥当性確認

初期段階では以下を行う。

* 同一人物による複数回診断
* マウスとトラックパッドの比較
* 負荷あり・なし環境の比較
* 初心者と経験者の比較
* 自己申告得意チャンピオンとの比較
* 推薦理由の人手レビュー
* チャンピオンプロファイルの専門レビュー

---

# 65. 受入テスト

## 65.1 テスト進行

* 全テストに説明・練習・本番が存在する
* ブロック順が要件通りである
* ブロック内順序がランダム化される
* メンタル安定性テストが最後に実施される
* 診断を中断できる

## 65.2 能力計算

* 10能力軸が算出される
* 複合入力サブスコアが算出される
* クリック中心距離が記録される
* 信頼度が能力値と別に算出される
* 総合能力スコアが生成・表示されない

## 65.3 推薦

* 方向と不足量を使用する
* チャンピオン・レーン単位で採点される
* 同一チャンピオンが1回のみ表示される
* 3カテゴリが異なる計算式を使用する
* 各カテゴリにメイン1件と代替2件を表示できる
* 不適格候補で件数を埋めない
* 推薦理由を表示できる
* パーセントを表示しない

## 65.4 結果

* メイン・サブ適性タイプが表示される
* 操作タイプが表示される
* メンタルタイプが表示される
* 強みが最低1件表示される
* 補助的な強みが表示される
* 改善課題が表示される
* 練習メニューが表示される
* 測定不確実性が説明される
* 侮辱的な表現が出ない

## 65.5 プライバシー

* デフォルトで生ログを送信しない
* 任意保存に明示同意が必要
* 改善データ提供を別同意にできる
* 保存結果を削除できる
* 共有内容を事前確認できる

---

# 66. 実装優先順

製品版を前提としつつ、依存関係に基づいて以下の順番で実装する。

1. 設定ファイルとJSON Schema
2. セッション管理
3. キャリブレーション
4. 共通テストエンジン
5. 反応速度
6. クリック精度
7. 複合入力制御
8. 軌道予測
9. 注意分配
10. タスク切り替え
11. 判断テスト
12. メンタル安定性
13. 特徴量・能力計算
14. 信頼度計算
15. チャンピオン・レーンプロファイル
16. 推薦エンジン
17. 多様性リランキング
18. 結果文章
19. 結果画面
20. 再テスト
21. 詳細診断
22. SNS共有
23. フィードバック
24. 任意保存
25. Riot API連携基盤

---

# 67. 本仕様書で固定しない調整項目

以下は実装可能な構造まで定義するが、最終数値はテスト結果をもとに調整する。

* 正規化基準
* 適性タイプの能力ウェイト
* 操作タイプの閾値
* メンタルタイプの閾値
* 推薦カテゴリの最低スコア
* 致命的不足の最終閾値
* 初心者補正量
* 多様性ペナルティ
* チャンピオンプロファイル数値
* 各レーン補正値
* 結果文章の表現バリエーション
* 詳細診断の追加難度

これらは要件変更ではなく、診断精度改善のための設定値調整として扱う。

---

# 68. 完成条件

本システムは、以下が連続して動作した時点で基本機能完成とする。

1. PC環境を確認できる
2. 経験と嗜好を入力できる
3. キャリブレーションを通過できる
4. クイック診断を完了できる
5. 10能力軸とサブスコアを算出できる
6. 各能力の信頼度を算出できる
7. チャンピオン・レーン候補を採点できる
8. 3カテゴリへ候補を分類できる
9. 同一チャンピオンを除外できる
10. 多様性を考慮して各カテゴリ最大3件を選べる
11. 適性タイプ、操作タイプ、メンタルタイプを選べる
12. LLMなしで結果文章を生成できる
13. 苦手状況と練習メニューを生成できる
14. 再テストで結果を更新できる
15. 詳細診断へ移行できる
16. 共有カードを生成できる
17. 任意フィードバックを送信できる
18. デフォルトでは診断データを恒久保存しない
