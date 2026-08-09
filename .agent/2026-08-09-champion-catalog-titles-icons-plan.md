# チャンピオンカタログ・プレイ称号拡張 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** LoLスキルラボに代表的なチャンピオン、Wiki根拠付きアイコン、1件のプレイ称号を追加し、診断候補の少なさを解消する。

**Architecture:** 既存の設定JSONは互換性のため保持し、新しい `champion_catalog.json` をバックエンドの設定ローダーで検証・結合する。フロントはAPIの候補を優先し、APIが利用できない場合も同じ候補群をフォールバックデータから返す。称号は `resultEngine.ts` から呼ぶ純粋なドメイン関数で算出し、`DiagnosticResult` に主称号1件を追加する。

**Tech Stack:** FastAPI設定ローダー、JSON Schema Draft 2020-12、React + TypeScript + Vite、Vitest、既存の `html-to-image` 共有カード。

## Global Constraints

- リポジトリルートは `C:\Users\Hodaka\Downloads\div\recommend_champ_with_skill` とする。
- 既存の診断計算、入力テスト、保存APIの契約を壊さない。
- 難易度の0〜1値はWikiの定性的な考察をアプリの軸へ移した推定値であり、公式の数値評価として表示しない。
- アイコン取得に失敗しても候補名と頭文字を表示して診断を止めない。
- JSONとTypeScriptの候補IDは一意にし、既存候補を重複登録しない。
- 完了前に `backend` のpytest、`frontend` のVitest・lint・build、ブラウザ確認を実行する。
- 作業の最後に変更を意図的にコミットし、`main` へプッシュしてリモートSHAと作業ツリーを確認する。

---

## Progress

- [x] (2026-08-09) 既存の候補データ、設定スキーマ、結果画面、テスト構成を調査した。
- [x] (2026-08-09) LoLJPWikiとLeague of Legends Wikiの指定URLを確認し、Wikiの定性的な考察を数値モデルへ写像する方針を決めた。
- [x] (2026-08-09) 追加候補・アイコン・プレイ称号の設計メモを `docs/superpowers/specs/2026-08-09-champion-catalog-titles-icons-design.md` に保存した。
- [x] (2026-08-09) このExecPlanを作成した。
- [x] (2026-08-09) 設定・称号テストを先に追加し、カタログ未実装時にバックエンド2件失敗、フロントの称号モジュール未実装エラーを確認した。
- [x] (2026-08-09) カタログ、設定ローダー、型、1件の主称号計算を実装した。
- [x] (2026-08-09) フォールバック候補、Wikiアイコン表示、結果画面、共有カードを実装した。
- [x] (2026-08-09) 全テスト、lint、ビルド、ブラウザ診断を検証した。
- [x] (2026-08-09) `c388db4` をコミットして `main` へプッシュした。リモート反映確認の後、計画書の完了記録を追加して最終照合する。

## Surprises & Discoveries

- 指定された英語版League of Legends Wikiページは、この実行環境のWeb取得ではrobots.txtにより本文取得が拒否された。参照URLはカタログに残し、難易度判断は閲覧可能なLoLJPWikiの指定ページ、既存ドメイン知識、チャンピオンの一般的な操作特性を併用する。
- 既存の基礎プロフィールは12件、レーンプロフィールは14件だった。`nautilus` と `azir` はレーン設定にはあるが基礎設定にはないため、カタログ結合後の基礎候補は新規12件を加えて24件以上になるようにする。
- 既存の推薦カードは頭文字だけを表示しており、アイコンの読み込み失敗時のUIも存在しない。画像・Data Dragon・頭文字の三段階フォールバックを追加する。
- ブラウザで診断を完走した結果、APIから26レーン候補が読み込まれ、表示された5候補のWiki画像はすべて `naturalWidth=128` だった。カテゴリごとの推薦上限は既存仕様のまま維持した。

## Decision Log

- Decision: 既存JSONを大規模に書き換えず、追加候補とメタデータを `champion_catalog.json` に分離する。
  Rationale: 既存の設定を壊さずに候補数を増やせ、Wiki URL・アイコン・判断メモを一か所で管理できるため。
  Date/Author: 2026-08-09 / Codex
- Decision: 新規候補はTOP 3、MID 2、JUNGLE 2、BOT 3、SUPPORT 2の12件とする。
  Rationale: 代表的な近接・遠隔・タンク・ファイター・アサシン・メイジ・ADC・エンゲージ・エンチャンターを最初の拡張で横断できるため。
  Date/Author: 2026-08-09 / Codex
- Decision: プレイ称号は最も適合する1件だけを表示し、称号の内部スコアは表示しない。
  Rationale: 表示する称号を増やさず、今回の主目的である推薦候補数の拡充へ焦点を合わせるため。既存要件の「総合スコア・順位を表示しない」とも整合する。
  Date/Author: 2026-08-09 / Codex
- Decision: Wiki画像URLを第一候補にし、Data Dragonと頭文字へフォールバックする。
  Rationale: ユーザーの指定に従ってWiki画像を優先しつつ、外部画像の一時障害やファイル名差異でカード表示が壊れないようにするため。
  Date/Author: 2026-08-09 / Codex

## Outcomes & Retrospective

実装済みの候補は既存14レーンへ新規12レーンを加えた26レーン、基礎候補は24件である。結果画面には主称号を1件だけ表示し、候補カードはWiki画像を優先して表示する。バックエンド7件、フロント23件、lint、production build、ブラウザでの診断完走と画像読込を確認した。機能実装コミット `c388db4` は `main` へプッシュ済みで、最後にこの完了記録を追加コミットしてリモートSHAを照合する。

## Context and Orientation

このリポジトリは `backend/` のFastAPIと `frontend/` のReact + TypeScript + Viteで構成される。バックエンドの `backend/data/config/v1/champion_lane_profiles.json` はチャンピオンをレーン別に推薦するための既存設定で、`backend/app/config_loader.py` がJSON Schema検証後にAPIへ渡す。フロントエンドの `frontend/src/data/defaultData.ts` はバックエンドが起動していない場合の候補フォールバック、`frontend/src/domain/resultEngine.ts` は診断結果と推薦を計算し、`frontend/src/App.tsx` は結果画面と共有カードを描画する。

この作業でいう「プレイ称号」は順位ではなく、能力軸とユーザーの嗜好を組み合わせた説明的な短いラベルである。候補プロフィールの「難易度」は公式難易度ではなく、操作量、照準、判断の複雑さ、マクロ、必要知識、状況依存性を0〜1で表したアプリ内モデルである。

## Plan of Work

まず `frontend/src/domain/__tests__` と `backend/tests/test_config.py` に、候補数・全候補のアイコン・称号1件・能力と嗜好による主称号変化を検証するテストを追加し、実装前に正しく失敗することを確認する。次に `champion_catalog.json` とスキーマを追加し、設定ローダーで既存候補と新規12候補を結合してメタデータを注入する。次に `ChampionLaneProfile` と `DiagnosticResult` を拡張し、称号定義と純粋な `deriveAptitudeTitle` を実装する。

その後、フロントのフォールバック候補へ新規12候補とWikiメタデータを追加し、推薦カードの画像フォールバックを実装する。結果画面に主称号を1件表示し、共有カードにも主称号を表示する。最後に設定検証、Vitest、lint、buildを実行し、開発サーバーを使って診断を完走して画面上の候補アイコンと称号を確認する。全ての確認後にコミットし、`main` へプッシュする。

## Concrete Steps

### 1. 失敗するテストを先に追加する

`backend/tests/test_config.py` では、ロード後の候補数が基礎24件以上・レーン25件以上であること、全レーン候補に `iconUrl` と `wikiUrl` があることを検証する。`frontend/src/domain/__tests__/aptitudeTitles.test.ts` では `deriveAptitudeTitle` が1件を返すこと、高精度入力では「精密プレイメーカー」、高い注意・判断・チーム支援嗜好では「チームの安定装置」が主称号になることを検証する。既存の `resultEngine.test.ts` には結果へ1件の称号が入る期待値を追加する。

作業ディレクトリ `C:\Users\Hodaka\Downloads\div\recommend_champ_with_skill` で次を実行し、実装前は新しいテストが未実装関数や不足候補数で失敗することを確認する。

    .\.venv\Scripts\python.exe -m pytest backend/tests/test_config.py -q
    cd frontend
    npm.cmd run test:run -- src/domain/__tests__/aptitudeTitles.test.ts src/domain/__tests__/resultEngine.test.ts

### 2. 追加カタログとバックエンド結合を実装する

`backend/data/config/v1/schemas/champion_catalog.schema.json` を作り、`metadata` と新規12件の `profiles` を検証できるようにする。`backend/data/config/v1/champion_catalog.json` には既存14件と新規12件のメタデータを登録し、新規プロフィールとして次を登録する。

    TOP: Aatrox, Garen, Darius
    MID: Zed, Syndra
    JUNGLE: Vi, Warwick
    BOT: Jinx, Ezreal, Kai'Sa
    SUPPORT: Leona, Lulu

各プロフィールの `difficultyProfile` は、低難度0.2〜0.4、中難度0.45〜0.65、高難度0.7〜0.9を目安に、操作量・照準・判断量・マクロ・知識・状況依存性へ割り当てる。`difficultyNote` には判断理由を日本語で書き、`wikiUrl` と `iconUrl` には各チャンピオンのLeague of Legends Wiki URLを記録する。

`backend/app/config_loader.py` の `load_champions()` と `load_champion_lanes()` はカタログをロードし、旧ファイルの候補を残したまま新規候補を追加する。既存候補にはカタログのメタデータを `setdefault` で付与し、新規プロフィールから基礎プロフィールを派生する。`manifest.json` の `championProfileVersion` を1.1.0へ上げ、カタログファイルを一覧へ追加する。

### 3. プレイ称号のドメイン計算を実装する

`frontend/src/domain/types.ts` に次の型を追加する。

    export interface AptitudeTitle {
      id: string;
      name: string;
      description: string;
      signals: string[];
    }

`frontend/src/domain/aptitudeTitles.ts` に10種類の称号定義と `deriveAptitudeTitle(abilities: AbilityVector, preferences: ScoreMap): AptitudeTitle` を追加する。称号内部の重み付けは能力・嗜好を0〜1で読み、値が欠けた軸は0.5として扱う。定義は精密プレイメーカー、先読みの司令塔、チームの安定装置、瞬間突破のアタッカー、柔軟なスイッチャー、不屈のリカバリー型、前線を作るイニシエーター、盤面を読むコントローラー、レンジのスペシャリスト、創造的なリスクテイカーとする。

`frontend/src/domain/resultEngine.ts` で能力計算後に `deriveAptitudeTitle` を呼び、`DiagnosticResult.aptitudeTitle` へ1件を格納する。称号の内部スコアは `DiagnosticResult` の公開データには含めない。

### 4. フォールバック候補とアイコン表示を実装する

`frontend/src/data/championCatalog.ts` に、新規12件のフォールバックプロフィールと、既存14件を含むメタデータ辞書を追加する。`frontend/src/data/defaultData.ts` の既存プロフィール生成関数にメタデータを付け、`DEFAULT_CHAMPION_LANES` を既存候補と新規12候補の結合にする。

`frontend/src/domain/types.ts` の `ChampionLaneProfile` に `iconUrl?: string`、`wikiUrl?: string`、`difficultyNote?: string` を追加する。`frontend/src/App.tsx` では推薦カードの頭文字を `img` に置き換え、Wiki画像の `onError` でData Dragon画像へ差し替え、二度目の失敗で画像を隠して頭文字を表示する。`frontend/src/styles.css` に画像の円形表示とフォールバック表示のスタイルを追加する。

### 5. 結果画面と共有カードを実装する

`frontend/src/App.tsx` の `ResultScreen` に「あなたのプレイ称号」セクションを追加し、`result.aptitudeTitle` の称号名・説明・関連能力タグを表示する。既存の推薦3層は維持し、候補数が増えても一つのチャンピオンを同一候補群へ重複表示しない既存計算を利用する。`ShareCard` には主称号を含め、結果画像を作る場合も称号が欠落しないようにする。

### 6. 検証してプッシュする

リポジトリルートで次を順に実行する。

    .\.venv\Scripts\python.exe -m pytest -q
    cd frontend
    npm.cmd run test:run
    npm.cmd run lint
    npm.cmd run build

開発サーバーが起動している場合はブラウザで `http://localhost:5173/` を開き、診断を完走して結果画面に3件のプレイ称号、推薦カードのチャンピオン画像、候補名・レーン・タグが表示されることを確認する。画像URLを無効化したカードでは頭文字が表示され、レイアウトが崩れないことを確認する。

検証結果と差分を確認した後、変更ファイルを明示してコミットし、`git push origin main` を実行する。最後に `git status -sb` と `git ls-remote --heads origin main` を実行し、作業ツリーがcleanで、ローカルコミットSHAとリモートmain SHAが一致することを確認する。

## Validation and Acceptance

受け入れ条件は、バックエンド設定ロード時に基礎候補24件以上・レーン候補25件以上となり、既存候補を含む全候補からWikiアイコンURLが返ることである。診断結果の `aptitudeTitle` は常に1件を持ち、能力・嗜好を変えると主称号が変化する。画面では主称号1件が読め、推薦カードには画像または頭文字が出る。全テストとlint、buildが終了コード0で完了し、ブラウザで診断を結果画面まで完走できることを確認する。

## Idempotence and Recovery

カタログは追加専用で、同じ候補IDが既存データにある場合はローダーが重複追加しない。画像は外部URLのため、ネットワーク障害時もData Dragonと頭文字へフォールバックする。設定JSONの検証に失敗した場合はエラーメッセージのパスを確認してカタログだけを修正し、既存設定を戻す操作は行わない。プッシュ前に差分とテスト結果を確認し、問題があればコミットせず修正する。

## Artifacts and Notes

参照URLは `champion_catalog.json` の `wikiUrl` に保持し、各チャンピオンの難易度判断は `difficultyNote` で監査できる。LoLJPWikiの指定ページとLeague of Legends Wikiのチャンピオンページを根拠にしつつ、Wikiの定性的記述をアプリ内の能力軸へ写像した推定値であることをドキュメントにも記録する。

## Interfaces and Dependencies

バックエンドでは `load_champions() -> list[dict[str, Any]]` と `load_champion_lanes() -> list[dict[str, Any]]` の戻り値に `iconUrl`、`wikiUrl`、`difficultyNote` を含める。フロントでは `deriveAptitudeTitle(abilities, preferences) -> AptitudeTitle` を `calculateDiagnosticResult` から呼び、`DiagnosticResult.aptitudeTitle` は常に1件を持つ。新しい外部依存は追加せず、アイコンは通常のHTML画像読み込みと既存のData Dragon CDN URLだけを使う。

## 変更履歴

- 2026-08-09: 初版。候補カタログ、Wikiメタデータ、アイコンフォールバック、1件の称号、TDDとブラウザ検証の手順を定義した。
- 2026-08-09: 表示する称号を複数件から主称号1件へ変更し、候補数拡充を主目的として明確化した。
