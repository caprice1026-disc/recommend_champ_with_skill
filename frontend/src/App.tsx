import { useEffect, useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { loadChampionLanes, PREFERENCE_QUESTIONS, DEFAULT_PREFERENCES } from './data/defaultData';
import { calculateDiagnosticResult } from './domain/resultEngine';
import type { TestId, TestMode, TestResult } from './domain/testTypes';
import { TEST_DEFINITIONS } from './domain/testTypes';
import type { ChampionLaneProfile, DiagnosticResult, Lane, RecommendationCandidate, ScoreMap } from './domain/types';
import { TestStage } from './features/tests/TestStage';

type Screen = 'landing' | 'environment' | 'profile' | 'preferences' | 'consent' | 'calibration' | 'overview' | 'testing' | 'result';
type JourneyMode = 'quick' | 'detailed' | 'retest';
type Experience = 'beginner' | 'returning' | 'experienced';

interface UserProfile {
  displayName: string;
  experience: Experience;
  preferredLane: Lane | 'ALL';
}

const TEST_QUEUE: TestId[] = [
  'reaction',
  'clickAccuracy',
  'inputControl',
  'prediction',
  'attentionDistribution',
  'taskSwitching',
  'decision',
  'mentalStability',
];

const ABILITY_LABELS: Record<string, string> = {
  reaction: '反応速度',
  clickAccuracy: 'クリック精度',
  inputControl: '入力制御',
  prediction: '軌道予測',
  attentionDistribution: '注意分配',
  taskSwitching: '切り替え',
  decisionSpeed: '判断速度',
  decisionQuality: '判断品質',
  pressureStability: 'プレッシャー安定性',
  recovery: 'リカバリー',
};

const LANE_LABELS: Record<string, string> = {
  ALL: 'まだ決めていない',
  TOP: 'TOP',
  JUNGLE: 'JUNGLE',
  MID: 'MID',
  BOT: 'BOT',
  SUPPORT: 'SUPPORT',
};

const clamp = (value: number): number => Math.min(1, Math.max(0, value));
const percent = (value: number | undefined): string => `${Math.round(clamp(value ?? 0) * 100)}%`;
const signalLabel = (value: number | undefined): string => (value !== undefined && value >= 0.72 ? '強み' : value !== undefined && value >= 0.5 ? '安定' : '伸びしろ');
const confidenceLabel = (value: number | undefined): string => (value !== undefined && value >= 0.8 ? '安定した判定' : value !== undefined && value >= 0.65 ? 'おおむね安定' : '再テスト推奨');

function Shell({ children, screen, onHome }: { children: React.ReactNode; screen: Screen; onHome: () => void }) {
  const isHome = screen === 'landing';
  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" type="button" onClick={onHome} aria-label="LoLスキルラボ ホーム">
          <span className="brand__mark"><span /></span>
          <span><strong>LoLスキルラボ</strong><small>CHAMPION APTITUDE LAB</small></span>
        </button>
        <div className="topbar__meta">
          <span className="live-dot" /> <span>匿名・ブラウザ内で測定</span>
          {!isHome && <button className="text-button" type="button" onClick={onHome}>ホームへ戻る</button>}
        </div>
      </header>
      <main>{children}</main>
      <footer className="footer"><span>LoLスキルラボ v1.0</span><span>診断はプレイ傾向の参考情報です。勝敗や実力を保証するものではありません。</span></footer>
    </div>
  );
}

function Stepper({ current, labels }: { current: number; labels: string[] }) {
  return <div className="stepper" aria-label="診断ステップ">{labels.map((label, index) => <div key={label} className={`stepper__item ${index <= current ? 'is-active' : ''} ${index === current ? 'is-current' : ''}`}><span>{String(index + 1).padStart(2, '0')}</span><small>{label}</small></div>)}</div>;
}

function LandingScreen({ onStart }: { onStart: () => void }) {
  return (
    <section className="screen screen--landing page-grid">
      <div className="hero-copy">
        <p className="eyebrow"><span className="eyebrow__line" /> YOUR PLAY, DECODED</p>
        <h1>あなたの強みを、<br /><em>チャンピオン</em>に変える。</h1>
        <p className="hero-copy__lead">反応・精度・予測・判断・メンタル。8つの実測テストとプレイの好みから、今のあなたに合うLoLチャンピオンを読み解きます。</p>
        <div className="hero-copy__actions"><button className="button button--primary button--large" type="button" onClick={onStart}>診断をはじめる <span>→</span></button><span className="action-note">クイック診断 約8分<br />詳細判定はあとから追加できます</span></div>
        <div className="hero-trust"><span><b>8</b>測定カテゴリ</span><span><b>16</b>プレイ傾向質問</span><span><b>0</b>外部送信</span></div>
      </div>
      <div className="hero-visual" aria-label="診断レーダーのプレビュー">
        <div className="hero-visual__grid" />
        <div className="hero-visual__orb hero-visual__orb--one" /><div className="hero-visual__orb hero-visual__orb--two" />
        <div className="radar-card"><div className="radar-card__top"><span>APTITUDE SNAPSHOT</span><span className="status-chip">LIVE MODEL</span></div><div className="radar"><div className="radar__rings" /><div className="radar__shape" /><div className="radar__labels"><span>反応</span><span>予測</span><span>判断</span><span>精度</span><span>回復</span><span>注意</span></div></div><div className="radar-card__bottom"><span>あなたの現在地</span><strong>未測定 <i>›</i></strong></div></div>
        <div className="floating-note floating-note--top"><span className="mini-icon">↗</span><span>PLAY STYLE<br /><b>まだ知らない強み</b></span></div>
        <div className="floating-note floating-note--bottom"><span className="status-dot status-dot--good" /><span>SESSION READY<br /><b>匿名でスタート</b></span></div>
      </div>
      <div className="landing-strip"><span>測定するもの</span><div><b>01</b> 基礎操作 <i>—</i> <b>02</b> 認知・予測 <i>—</i> <b>03</b> 判断 <i>—</i> <b>04</b> メンタル</div><span className="landing-strip__right">SCROLL TO EXPLORE ↓</span></div>
    </section>
  );
}

function EnvironmentScreen({ onContinue }: { onContinue: () => void }) {
  const [checks, setChecks] = useState({ browser: true, viewport: false, pointer: false, keyboard: false });
  useEffect(() => {
    const update = () => setChecks((value) => ({ ...value, viewport: window.innerWidth >= 1024 && window.innerHeight >= 640 }));
    update();
    window.addEventListener('resize', update);
    const pointerTimer = window.setTimeout(() => setChecks((value) => ({ ...value, pointer: true })), 250);
    const keyboardTimer = window.setTimeout(() => setChecks((value) => ({ ...value, keyboard: true })), 500);
    return () => { window.removeEventListener('resize', update); window.clearTimeout(pointerTimer); window.clearTimeout(keyboardTimer); };
  }, []);
  const ready = checks.browser && checks.pointer && checks.keyboard;
  return <section className="screen screen--narrow"><Stepper current={0} labels={['環境', 'プロフィール', '好み', '同意', '校正']} /><div className="section-heading"><p className="eyebrow">01 / ENVIRONMENT CHECK</p><h1>測定できる状態を<br /><em>つくっています。</em></h1><p>LoLスキルラボは、ブラウザ上の実際の入力・時間・ポインター動作を使って測定します。テスト前に環境を確認します。</p></div><div className="check-list">{[['browser', '対応ブラウザ', 'Chrome / Edge / Firefox'], ['viewport', '画面サイズ', '1024 × 640 以上を推奨'], ['pointer', 'ポインター入力', 'PointerEvent を検出'], ['keyboard', 'キーボード入力', 'Q / W / E / R を検出']].map(([key, title, detail]) => <div className={`check-row ${checks[key as keyof typeof checks] ? 'is-ready' : ''}`} key={key}><span className="check-row__icon">{checks[key as keyof typeof checks] ? '✓' : '…'}</span><span><strong>{title}</strong><small>{detail}</small></span><span className="check-row__status">{checks[key as keyof typeof checks] ? 'READY' : 'CHECKING'}</span></div>)}</div><div className="notice notice--teal"><span>ⓘ</span><span>画面が小さい場合も診断は進められますが、クリック精度の測定は広い画面ほど安定します。</span></div><button className="button button--primary" type="button" onClick={onContinue} disabled={!ready}>プロフィールを設定する <span>→</span></button></section>;
}

function ProfileScreen({ profile, setProfile, onContinue }: { profile: UserProfile; setProfile: (value: UserProfile) => void; onContinue: () => void }) {
  return <section className="screen screen--narrow"><Stepper current={1} labels={['環境', 'プロフィール', '好み', '同意', '校正']} /><div className="section-heading"><p className="eyebrow">02 / PROFILE</p><h1>あなたのプレイを、<br /><em>少しだけ教えてください。</em></h1><p>結果の解釈に使う最低限の情報です。入力しなくても診断できます。</p></div><div className="form-card"><label className="field-label" htmlFor="displayName">表示名 <span>任意</span></label><input id="displayName" className="text-input" value={profile.displayName} maxLength={24} onChange={(event) => setProfile({ ...profile, displayName: event.target.value })} placeholder="例：Hodaka" /><div className="field-label">LoL経験</div><div className="choice-grid choice-grid--three">{[['beginner', 'これから始める', '初めて〜数十時間'], ['returning', '久しぶりに遊ぶ', '感覚を取り戻したい'], ['experienced', '継続して遊んでいる', '自分の強みを知りたい']].map(([value, title, detail]) => <button key={value} type="button" className={`choice-card ${profile.experience === value ? 'is-selected' : ''}`} onClick={() => setProfile({ ...profile, experience: value as Experience })}><strong>{title}</strong><small>{detail}</small></button>)}</div><div className="field-label">興味のあるレーン <span>あとで変更できます</span></div><div className="lane-picker">{(['ALL', 'TOP', 'JUNGLE', 'MID', 'BOT', 'SUPPORT'] as const).map((lane) => <button key={lane} type="button" className={profile.preferredLane === lane ? 'is-selected' : ''} onClick={() => setProfile({ ...profile, preferredLane: lane })}>{LANE_LABELS[lane]}</button>)}</div></div><button className="button button--primary" type="button" onClick={onContinue}>プレイの好みへ進む <span>→</span></button></section>;
}

function PreferencesScreen({ preferences, setPreferences, onContinue }: { preferences: ScoreMap; setPreferences: (value: ScoreMap) => void; onContinue: () => void }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(0);
  const current = PREFERENCE_QUESTIONS[index];
  const choose = (value: number) => { setPreferences({ ...preferences, [current[0]]: value }); setAnswers((count) => Math.max(count, index + 1)); if (index < PREFERENCE_QUESTIONS.length - 1) setIndex((value) => value + 1); };
  const value = preferences[current[0]] ?? 0.5;
  return <section className="screen screen--narrow"><Stepper current={2} labels={['環境', 'プロフィール', '好み', '同意', '校正']} /><div className="section-heading"><p className="eyebrow">03 / PLAY STYLE</p><h1>勝ち方ではなく、<br /><em>好きな動き方。</em></h1><p>正解はありません。直感で答えるほど、チャンピオンとの相性が自然に出ます。</p></div><div className="question-card"><div className="question-card__top"><span>QUESTION {String(index + 1).padStart(2, '0')} / {PREFERENCE_QUESTIONS.length}</span><span>{Math.round((answers / PREFERENCE_QUESTIONS.length) * 100)}% COMPLETE</span></div><div className="progress-line"><span style={{ width: `${((index + 1) / PREFERENCE_QUESTIONS.length) * 100}%` }} /></div><h2>{current[1]}</h2><div className="likert"><span>まったく違う</span><div>{[0, 0.25, 0.5, 0.75, 1].map((option) => <button key={option} type="button" className={Math.abs(value - option) < 0.01 ? 'is-selected' : ''} onClick={() => choose(option)}><i /></button>)}</div><span>とても当てはまる</span></div><div className="question-card__footer"><button className="text-button" type="button" onClick={() => setIndex((currentIndex) => Math.max(0, currentIndex - 1))} disabled={index === 0}>← 前の質問</button><span>選択すると次へ進みます</span><button className="text-button" type="button" onClick={() => setIndex((currentIndex) => Math.min(PREFERENCE_QUESTIONS.length - 1, currentIndex + 1))}>{index === PREFERENCE_QUESTIONS.length - 1 ? '確認する →' : 'スキップ →'}</button></div></div><div className="screen-actions"><button className="button button--secondary" type="button" onClick={() => { setPreferences(DEFAULT_PREFERENCES); onContinue(); }}>平均値で進む</button><button className="button button--primary" type="button" onClick={onContinue}>同意設定へ進む <span>→</span></button></div></section>;
}

function ConsentScreen({ consent, setConsent, onContinue }: { consent: boolean; setConsent: (value: boolean) => void; onContinue: () => void }) {
  return <section className="screen screen--narrow"><Stepper current={3} labels={['環境', 'プロフィール', '好み', '同意', '校正']} /><div className="section-heading"><p className="eyebrow">04 / DATA CHOICE</p><h1>結果の扱いを、<br /><em>あなたが選ぶ。</em></h1><p>測定中の生ログは画面内だけで使い、APIへ送信しません。保存する場合も、診断結果の集計値だけを対象にします。</p></div><div className="consent-card"><div className="consent-card__icon">◎</div><div><h2>診断結果を匿名保存する</h2><p>同意した場合のみ、能力ベクトル・サブスコア・信頼度・おすすめ結果を保存します。保存後は結果画面から削除できます。</p><label className="toggle-row"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span className="toggle" /><strong>{consent ? '保存を許可する' : '今回は保存しない'}</strong></label></div></div><div className="privacy-grid"><div><strong>保存しないもの</strong><span>クリック座標・キー入力・生タイムスタンプ</span></div><div><strong>保存されるもの</strong><span>集計済みスコア・診断バージョン</span></div></div><button className="button button--primary" type="button" onClick={onContinue}>校正へ進む <span>→</span></button></section>;
}

function CalibrationStage({ onComplete, mode }: { onComplete: () => void; mode: JourneyMode }) {
  const [stage, setStage] = useState<'pointer' | 'keyboard' | 'complete'>('pointer');
  const [point, setPoint] = useState(0);
  const [latencies, setLatencies] = useState<number[]>([]);
  const [pulse, setPulse] = useState(0);
  const pointerStartedAt = useRef(0);
  const keyStartedAt = useRef(0);
  const targets = [{ left: '16%', top: '28%' }, { left: '82%', top: '28%' }, { left: '50%', top: '76%' }];
  const viewportReady = typeof window === 'undefined' || (window.innerWidth >= 1024 && window.innerHeight >= 640);

  useEffect(() => {
    let frame = 0;
    const tick = (time: number) => { setPulse(time / 1000); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (stage !== 'keyboard') return;
    keyStartedAt.current = performance.now();
    const handler = (event: KeyboardEvent) => {
      if (!['q', 'w', 'e', 'r'].includes(event.key.toLowerCase())) return;
      event.preventDefault();
      const next = [...latencies, performance.now() - keyStartedAt.current];
      setLatencies(next);
      if (next.length >= 4) setStage('complete');
      else keyStartedAt.current = performance.now();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [stage, latencies]);
  const hitPointer = () => {
    if (stage !== 'pointer') return;
    const next = [...latencies, performance.now() - pointerStartedAt.current];
    if (point >= targets.length - 1) { setLatencies(next); setStage('keyboard'); }
    else { setLatencies(next); setPoint((value) => value + 1); pointerStartedAt.current = performance.now(); }
  };
  useEffect(() => { if (stage === 'pointer') pointerStartedAt.current = performance.now(); }, [stage, point]);
  return <section className="screen screen--calibration"><div className="calibration-head"><div><p className="eyebrow">05 / CALIBRATION</p><h1>入力の基準を<br /><em>セットします。</em></h1></div><div className="calibration-meta"><span className="status-dot status-dot--good" /> 実測イベント / {mode === 'detailed' ? '詳細判定' : mode === 'retest' ? '再テスト' : 'クイック診断'}</div></div>{!viewportReady && <div className="notice notice--amber">画面サイズが推奨値未満です。クリック判定を見やすくするため、可能ならウィンドウを広げてください。</div>}<div className="calibration-stage">{stage === 'pointer' && <><div className="calibration-instruction"><span>POINTER CHECK {point + 1} / {targets.length}</span><strong>光るターゲットをクリック</strong><small>実際の PointerEvent と performance.now() を使います</small></div><button className="calibration-target" style={{ left: targets[point].left, top: targets[point].top, transform: `translate(-50%, -50%) scale(${1 + Math.sin(pulse * 3) * 0.06})` }} type="button" onPointerDown={hitPointer} aria-label={`校正ターゲット ${point + 1}`}><span /></button></>}{stage === 'keyboard' && <div className="keyboard-check"><span>KEYBOARD CHECK 04 / 04</span><strong>Q W E R を順番に押してください</strong><small>キーの押下イベントのみ記録し、入力内容は保存しません。</small><div className="key-row">{['Q', 'W', 'E', 'R'].map((key) => <kbd key={key}>{key}</kbd>)}</div></div>}{stage === 'complete' && <div className="calibration-complete"><span className="complete-mark">✓</span><span>CALIBRATION COMPLETE</span><h2>測定の準備ができました。</h2><p>ここからのテストは、あなたの入力状態に合わせて判定します。</p><button className="button button--primary" type="button" onClick={onComplete}>診断の概要を見る <span>→</span></button></div>}</div></section>;
}

function OverviewScreen({ onStart, mode }: { onStart: () => void; mode: JourneyMode }) {
  const detailed = mode === 'detailed';
  return <section className="screen screen--narrow"><div className="overview-kicker"><span className="status-dot status-dot--good" /> SESSION {detailed ? 'DETAILED' : 'QUICK'} / READY</div><div className="section-heading"><p className="eyebrow">WHAT WE MEASURE</p><h1>{detailed ? <>詳細判定で、<br /><em>もう一段深く。</em></> : <>8つのテストで、<br /><em>プレイの輪郭を測る。</em></>}</h1><p>{detailed ? 'クイック診断より試行数を増やし、安定度・失敗抑制・切り替えコストまで含めて判定します。' : '速さだけではありません。狙う、予測する、切り替える、立て直す。実際のゲームで感じる複数の強みを分けて見ます。'}</p></div><div className="measure-grid">{TEST_QUEUE.map((testId, index) => { const definition = TEST_DEFINITIONS.find((item) => item.id === testId)!; return <div className="measure-tile" key={testId}><span>{String(index + 1).padStart(2, '0')}</span><strong>{definition.name}</strong><small>{definition.group}</small></div>; })}</div><div className="notice notice--teal"><span>◎</span><span>練習ラウンドで操作を確認してから本番へ進みます。途中でやめても、完了済みの結果は破棄されません。</span></div><button className="button button--primary button--large" type="button" onClick={onStart}>{detailed ? '詳細判定を開始する' : 'クイック診断を開始する'} <span>→</span></button></section>;
}

function AbilityBars({ result }: { result: DiagnosticResult }) {
  return <div className="ability-panel"><div className="panel-heading"><div><p className="eyebrow">ABILITY VECTOR</p><h2>あなたの操作プロファイル</h2></div><span className="status-chip">{result.mode === 'detailed' ? 'DETAILED' : 'QUICK READ'}</span></div><div className="ability-list">{Object.entries(result.abilities).map(([key, value]) => <div className="ability-row" key={key}><div className="ability-row__label"><span>{ABILITY_LABELS[key] ?? key}</span><b>{signalLabel(value)}</b></div><div className="ability-signal" aria-label={`${ABILITY_LABELS[key] ?? key} ${signalLabel(value)}`}><span className={value !== undefined && value >= 0.34 ? 'is-on' : ''} /><span className={value !== undefined && value >= 0.5 ? 'is-on' : ''} /><span className={value !== undefined && value >= 0.72 ? 'is-on' : ''} /></div><small>{value !== undefined && value >= 0.72 ? '強みとして出ています' : value !== undefined && value >= 0.5 ? '伸びしろを含む安定域' : '練習で変化しやすい領域'}</small></div>)}</div></div>;
}

function RecommendationBucketView({ title, bucket, accent }: { title: string; bucket: NonNullable<DiagnosticResult['recommendations']>['readyNow']; accent: string }) {
  const items: RecommendationCandidate[] = [bucket.primary, ...bucket.alternatives].filter((item): item is RecommendationCandidate => Boolean(item));
  return <section className={`recommendation-bucket recommendation-bucket--${accent}`}><div className="recommendation-bucket__head"><div><span className="bucket-index">{accent === 'ready' ? '01' : accent === 'growth' ? '02' : '03'}</span><h3>{title}</h3></div><small>{bucket.explanation}</small></div>{items.length === 0 ? <div className="empty-bucket">今回の測定では、条件に合う候補を確定できませんでした。再テストで精度を上げられます。</div> : <div className="champion-grid">{items.map((candidate) => <article className="champion-card" key={`${candidate.championId}-${candidate.lane}`}><div className="champion-card__avatar">{candidate.championName.slice(0, 1)}</div><div className="champion-card__main"><div className="champion-card__name"><div><strong>{candidate.championName}</strong><small>{candidate.lane} / {candidate.label}</small></div><b>{signalLabel(candidate.score)}</b></div><p>{candidate.reason}</p><div className="tag-list">{candidate.strengthTags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}</div></div></article>)}</div>}</section>;
}

function ShareCard({ result, profile, cardRef }: { result: DiagnosticResult; profile: UserProfile; cardRef: React.RefObject<HTMLDivElement | null> }) {
  const primary = result.recommendations?.readyNow.primary ?? result.recommendations?.growthCandidate.primary;
  return <div className="share-card" ref={cardRef}><div className="share-card__top"><span>LoLスキルラボ</span><span>APTITUDE REPORT / {result.mode?.toUpperCase()}</span></div><div className="share-card__hero"><p>{profile.displayName || 'GUEST'} のプレイ適性</p><h2>{primary ? `${primary.championName} が今のあなたに近い` : 'あなたのプレイ傾向が見えました'}</h2><div className="share-card__score"><strong>PLAY PROFILE</strong><span>反応・精度・判断を組み合わせた<br />あなたのプレイ傾向スナップショット</span></div></div><div className="share-card__bars">{Object.entries(result.abilities).slice(0, 6).map(([key, value]) => <div key={key}><span>{ABILITY_LABELS[key]}</span><i className={`share-signal share-signal--${signalLabel(value)}`}>{signalLabel(value)}</i></div>)}</div><div className="share-card__foot"><span>lol-skill-lab / 1.0.0</span><span>診断は参考情報です</span></div></div>;
}

function ResultScreen({ result, profile, consent, savedResultId, onDetailed, onRetest, onShare, onSave, onFeedback, onDelete }: { result: DiagnosticResult; profile: UserProfile; consent: boolean; savedResultId: string | null; onDetailed: () => void; onRetest: (testId: TestId) => void; onShare: () => void; onSave: () => void; onFeedback: () => void; onDelete: () => void }) {
  const [retestOpen, setRetestOpen] = useState(false);
  const topAbility = Object.entries(result.abilities).sort(([, left], [, right]) => (right ?? 0) - (left ?? 0))[0];
  const confidence = Object.values(result.confidence)[0];
  return <section className="screen screen--result"><div className="result-hero"><div><p className="eyebrow">RESULT / {result.mode === 'detailed' ? 'DETAILED DIAGNOSIS' : 'QUICK DIAGNOSIS'}</p><h1>{profile.displayName || 'ゲスト'}さんの<br /><em>プレイ適性が見えました。</em></h1><p>最も強く出た領域は <strong>{ABILITY_LABELS[topAbility?.[0] ?? 'reaction']}</strong>。チャンピオンは、能力だけでなく好みと成長余地も合わせて選んでいます。</p></div><div className="result-hero__signal"><span className="signal-ring" /><strong>PEAK</strong><small>{ABILITY_LABELS[topAbility?.[0] ?? 'reaction']} / SIGNAL</small></div></div><div className="result-layout"><div><AbilityBars result={result} /><div className="result-actions"><button className="button button--primary" type="button" onClick={onDetailed} disabled={result.mode === 'detailed'}>{result.mode === 'detailed' ? '詳細判定済み' : '詳細判定を追加する'} <span>→</span></button><button className="button button--secondary" type="button" onClick={onShare}>結果カードを作る</button><button className="button button--ghost" type="button" onClick={onFeedback}>フィードバック</button></div><div className="privacy-note"><span>◌</span><span>{savedResultId ? '診断結果を匿名保存しています。' : consent ? '同意済みですが、まだ保存していません。' : 'この結果は保存されていません。'}</span>{savedResultId ? <button className="text-button" type="button" onClick={onDelete}>削除</button> : consent ? <button className="text-button" type="button" onClick={onSave}>保存する</button> : null}</div></div><aside className="result-side"><div className="confidence-card"><div className="panel-heading"><div><p className="eyebrow">MEASUREMENT CONFIDENCE</p><h3>判定の信頼度</h3></div><span className="confidence-value">{confidenceLabel(confidence)}</span></div><div className="confidence-signal"><span className={confidence !== undefined && confidence >= 0.34 ? 'is-on' : ''} /><span className={confidence !== undefined && confidence >= 0.65 ? 'is-on' : ''} /><span className={confidence !== undefined && confidence >= 0.8 ? 'is-on' : ''} /></div><p>測定の完了度・入力の安定性・スコアのばらつきを合わせた目安です。</p><strong>{confidence !== undefined && confidence >= 0.8 ? '測定は安定しています' : '再テストでさらに安定します'}</strong></div><div className="retest-card"><div><p className="eyebrow">RETEST</p><h3>気になる項目だけ再測定</h3><p>結果を捨てずに、1カテゴリだけ更新できます。</p></div><button className="icon-button" type="button" onClick={() => setRetestOpen((value) => !value)}>{retestOpen ? '×' : '+'}</button>{retestOpen && <div className="retest-list">{TEST_QUEUE.map((testId) => <button key={testId} type="button" onClick={() => onRetest(testId)}>{TEST_DEFINITIONS.find((item) => item.id === testId)?.name}<span>→</span></button>)}</div>}</div></aside></div><div className="recommendations"><div className="section-heading section-heading--compact"><p className="eyebrow">CHAMPION MATCH / 3 LAYERS</p><h2>今のあなたに合う、3つの距離感。</h2><p>「すぐ活かせる」「伸ばしながら合う」「長期で挑戦したい」を分けて表示しています。ひとつの正解に閉じません。</p></div>{result.recommendations && <><RecommendationBucketView title="今すぐ活かせる" bucket={result.recommendations.readyNow} accent="ready" /><RecommendationBucketView title="成長しながら合う" bucket={result.recommendations.growthCandidate} accent="growth" /><RecommendationBucketView title="長期で挑戦したい" bucket={result.recommendations.aspirational} accent="aspirational" /></>}</div></section>;
}

function FeedbackPanel({ onClose, onSubmit }: { onClose: () => void; onSubmit: (satisfaction: 'satisfied' | 'partial' | 'disagree', comment: string) => void }) {
  const [satisfaction, setSatisfaction] = useState<'satisfied' | 'partial' | 'disagree'>('satisfied');
  const [comment, setComment] = useState('');
  return <div className="modal-backdrop" role="presentation"><div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="feedback-title"><button className="modal-close" type="button" onClick={onClose}>×</button><p className="eyebrow">FEEDBACK LOOP</p><h2 id="feedback-title">この診断、どう感じましたか？</h2><p>正解を合わせるためではなく、測定の体験とおすすめの納得感を改善するために使います。</p><div className="feedback-choices">{[['satisfied', '納得できた', '結果を試してみたい'], ['partial', '少し違う', '一部だけ当てはまる'], ['disagree', '違和感がある', '自分の感覚と離れている']].map(([value, title, detail]) => <button key={value} type="button" className={satisfaction === value ? 'is-selected' : ''} onClick={() => setSatisfaction(value as typeof satisfaction)}><strong>{title}</strong><small>{detail}</small></button>)}</div><textarea className="text-area" value={comment} maxLength={2000} onChange={(event) => setComment(event.target.value)} placeholder="任意：気づいたこと、普段よく使うチャンピオンなど" /><button className="button button--primary" type="button" onClick={() => onSubmit(satisfaction, comment)}>送信する <span>→</span></button></div></div>;
}

function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [journey, setJourney] = useState<JourneyMode>('quick');
  const [profile, setProfile] = useState<UserProfile>({ displayName: '', experience: 'beginner', preferredLane: 'ALL' });
  const [preferences, setPreferences] = useState<ScoreMap>(DEFAULT_PREFERENCES);
  const [consent, setConsent] = useState(false);
  const [candidates, setCandidates] = useState<ChampionLaneProfile[]>([]);
  const [testQueue, setTestQueue] = useState<TestId[]>(TEST_QUEUE);
  const [queueIndex, setQueueIndex] = useState(0);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [savedResultId, setSavedResultId] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadChampionLanes().then(setCandidates); }, []);

  const currentTest = testQueue[queueIndex];
  const currentDefinition = useMemo(() => TEST_DEFINITIONS.find((item) => item.id === currentTest), [currentTest]);
  const stepIndex = screen === 'environment' ? 0 : screen === 'profile' ? 1 : screen === 'preferences' ? 2 : screen === 'consent' ? 3 : screen === 'calibration' ? 4 : 0;

  const reset = () => { setScreen('landing'); setResult(null); setTestResults([]); setSavedResultId(null); setNotice(null); setJourney('quick'); };
  const beginTests = (mode: JourneyMode, ids = TEST_QUEUE, previous: TestResult[] = []) => { setJourney(mode); setTestQueue(ids); setQueueIndex(0); setTestResults(previous); setScreen('testing'); setNotice(null); };
  const finishTest = (testResult: TestResult) => {
    const nextResults = [...testResults.filter((item) => item.testId !== testResult.testId), testResult];
    setTestResults(nextResults);
    if (queueIndex + 1 < testQueue.length) { setQueueIndex((value) => value + 1); return; }
    const resultMode: TestMode = journey === 'detailed' ? 'detailed' : journey === 'retest' ? 'retest' : 'quick';
    const calculated = calculateDiagnosticResult(nextResults, preferences, candidates, resultMode);
    setResult(calculated);
    setScreen('result');
  };
  const saveResult = async () => {
    if (!consent || !result) return;
    try {
      const response = await fetch('/api/diagnosis-results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ diagnosisVersion: '1.0.0', consentToSave: true, abilityVector: result.abilities, subscores: result.subscores, confidence: result.confidence, recommendations: result.recommendations, aptitudeTypes: { primary: Object.entries(result.abilities).sort(([, left], [, right]) => (right ?? 0) - (left ?? 0)).slice(0, 3).map(([key]) => key) }, configVersions: { profile: 'v1', formula: 'v1' }, createdAt: result.createdAt ?? new Date().toISOString() }) });
      if (!response.ok) throw new Error('save failed');
      const body = await response.json() as { resultId: string };
      setSavedResultId(body.resultId); setNotice('診断結果を匿名保存しました。');
    } catch { setNotice('保存サーバーに接続できませんでした。結果はこの画面で確認できます。'); }
  };
  const deleteResult = async () => { if (!savedResultId) return; try { const response = await fetch(`/api/diagnosis-results/${savedResultId}`, { method: 'DELETE' }); if (!response.ok) throw new Error('delete failed'); setSavedResultId(null); setNotice('保存した診断結果を削除しました。'); } catch { setNotice('削除に失敗しました。少し時間をおいて再試行してください。'); } };
  const submitFeedback = async (satisfaction: 'satisfied' | 'partial' | 'disagree', comment: string) => { try { await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ diagnosisVersion: '1.0.0', satisfaction, selfReportedStrongChampions: [], frequentlyPlayedChampions: [], comment }) }); setNotice('フィードバックを受け取りました。ありがとうございます。'); } catch { setNotice('フィードバックをこの環境から送信できませんでした。'); } setFeedbackOpen(false); };
  const downloadShare = async () => { if (!shareRef.current) return; try { const dataUrl = await toPng(shareRef.current, { pixelRatio: 2, cacheBust: true }); const link = document.createElement('a'); link.download = 'lol-skill-lab-result.png'; link.href = dataUrl; link.click(); setNotice('結果カードを画像として保存しました。'); } catch { setNotice('結果カードの生成に失敗しました。'); } };

  let content: React.ReactNode;
  if (screen === 'landing') content = <LandingScreen onStart={() => setScreen('environment')} />;
  if (screen === 'environment') content = <EnvironmentScreen onContinue={() => setScreen('profile')} />;
  if (screen === 'profile') content = <ProfileScreen profile={profile} setProfile={setProfile} onContinue={() => setScreen('preferences')} />;
  if (screen === 'preferences') content = <PreferencesScreen preferences={preferences} setPreferences={setPreferences} onContinue={() => setScreen('consent')} />;
  if (screen === 'consent') content = <ConsentScreen consent={consent} setConsent={setConsent} onContinue={() => { setJourney('quick'); setScreen('calibration'); }} />;
  if (screen === 'calibration') content = <CalibrationStage mode={journey} onComplete={() => setScreen(journey === 'retest' ? 'testing' : journey === 'quick' ? 'overview' : 'overview')} />;
  if (screen === 'overview') content = <OverviewScreen mode={journey} onStart={() => beginTests(journey)} />;
  if (screen === 'testing' && currentTest) content = <div className="testing-shell"><div className="test-progress"><div><span className="eyebrow">{journey === 'detailed' ? 'DETAILED DIAGNOSIS' : journey === 'retest' ? 'RETEST' : 'QUICK DIAGNOSIS'}</span><strong>{String(queueIndex + 1).padStart(2, '0')} / {String(testQueue.length).padStart(2, '0')}</strong><span>{currentDefinition?.name}</span></div><div className="test-progress__bar"><span style={{ width: `${(queueIndex / testQueue.length) * 100}%` }} /></div></div><TestStage key={`${journey}-${currentTest}`} testId={currentTest} mode={journey} onComplete={finishTest} onAbort={() => { setNotice('診断を中断しました。完了済みのテストは結果に反映されません。'); setScreen('landing'); }} /></div>;
  if (screen === 'result' && result) content = <ResultScreen result={result} profile={profile} consent={consent} savedResultId={savedResultId} onDetailed={() => { setJourney('detailed'); setScreen('calibration'); }} onRetest={(testId) => beginTests('retest', [testId], testResults)} onShare={() => setShareOpen(true)} onSave={saveResult} onFeedback={() => setFeedbackOpen(true)} onDelete={deleteResult} />;

  return <Shell screen={screen} onHome={reset}>{content}{notice && <div className="toast" role="status"><span>✓</span>{notice}<button type="button" onClick={() => setNotice(null)}>×</button></div>}{feedbackOpen && <FeedbackPanel onClose={() => setFeedbackOpen(false)} onSubmit={submitFeedback} />}{shareOpen && result && <div className="modal-backdrop" role="presentation"><div className="share-modal" role="dialog" aria-modal="true"><button className="modal-close" type="button" onClick={() => setShareOpen(false)}>×</button><p className="eyebrow">SHARE CARD</p><h2>あなたの現在地を、1枚に。</h2><ShareCard result={result} profile={profile} cardRef={shareRef} /><div className="share-modal__actions"><button className="button button--primary" type="button" onClick={downloadShare}>PNGをダウンロード <span>↓</span></button><button className="button button--secondary" type="button" onClick={() => setShareOpen(false)}>閉じる</button></div></div></div>}</Shell>;
}

export default App;
