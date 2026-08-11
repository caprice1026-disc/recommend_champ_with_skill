# LoLスキルラボ Riot ID確認UI設計

## 目的

設計書の受入条件「Riot IDをAPIキーを漏らさず確認できる」を、利用者が実際に操作できる形で満たす。Riot確認は診断保存とは別の任意機能とし、診断の測定値・能力値・推薦計算には影響させない。

## 採用する構成

同意画面に任意のRiot確認パネルを追加する。パネルではRiot ID、タグライン、リージョン、Riot情報取得同意を入力し、同意済みの場合だけ`POST /api/riot/verify`を呼び出す。確認に失敗しても診断フローは継続できる。

成功時にClientが保持するのは`verified`、`platformRegion`、`fetchedAt`だけとする。PUUID、APIレスポンス本文、APIキーはClient state、診断保存payload、UIには出さない。保存時に送信する`riotContext`も同じ3項目へWorkerで再検証し、余分なキーやPUUIDを拒否する。

## 代替案と不採用理由

- プロフィール画面に置く案: 入力場所としては自然だが、Riot情報取得同意と診断結果保存同意の関係が離れ、プライバシー説明が分かりにくい。
- 結果画面だけに置く案: 診断後の補助情報にはなるが、診断開始前の任意確認という設計書の導線と一致しない。
- Worker APIだけを提供する案: APIテストは満たせるが、利用者がRiot確認を実行できず、ブラウザ受入テストを満たせない。

## エラーと互換性

`RIOT_CONSENT_REQUIRED`、`RIOT_ACCOUNT_NOT_FOUND`、`RIOT_RATE_LIMITED`、`RIOT_NOT_CONFIGURED`などの標準エラーをパネル内へ表示する。API未設定でも、入力済み診断の開始・完走・保存なしの結果表示を妨げない。既存の診断計算関数へRiot情報を渡さず、移行前後の能力値・推薦回帰を維持する。

## 検証

- ClientのRiot API helperが公開コンテキストだけを返し、上流のPUUIDを捨てること。
- Workerが保存payload内の`riotContext`を3項目へ制限し、余分なキーを拒否すること。
- 成功・未設定・入力エラーをUIで表示し、同意なしではAPIを呼ばないこと。
- ローカルWorker smoke、ブラウザの同意画面操作、Riot未設定時のエラー表示を確認すること。

