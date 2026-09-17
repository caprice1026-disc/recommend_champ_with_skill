import { useEffect, useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { loadRuntimeConfig, PREFERENCE_QUESTIONS, DEFAULT_PREFERENCES } from './data/defaultData';
import { DEFAULT_TEST_CONFIGURATION, type RuntimeConfigSnapshot } from './data/runtimeConfig';
import { calculateDiagnosticResult } from '../domain/resultEngine';
import type { TestId, TestMode, TestResult } from '../domain/testTypes';
import { TEST_DEFINITIONS } from '../domain/testTypes';
import { createDiagnosticTestQueue, isPreferenceSetComplete, KEY_SEQUENCE, viewportStatus } from '../domain/testLogic';
import type { ChampionLaneProfile, DiagnosticResult, Lane, RecommendationCandidate, ScoreMap } from '../domain/types';
import { TestStage } from './features/tests/TestStage';
import { RiotVerificationPanel } from './features/riot/RiotVerificationPanel';
import type { PublicRiotContext } from './features/riot/riotVerification';
import { submitFeedback as submitFeedbackRequest } from './features/feedback/feedback';
import { apiHeaders } from './data/clientSession';

type Screen = 'landing' | 'environment' | 'profile' | 'preferences' | 'consent' | 'calibration' | 'overview' | 'testing' | 'result';
type JourneyMode = 'quick' | 'detailed' | 'retest';
type Experience = 'beginner' | 'returning' | 'experienced';
type NoticeKind = 'success' | 'error' | 'info';

interface UserProfile {
  displayName: string;
  experience: Experience;
  preferredLane: Lane | 'ALL';
}

const DEFAULT_TEST_QUEUE: TestId[] = [
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

function useDialogLifecycle(onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const firstControl = dialogRef.current?.querySelector<HTMLElement>('button, textarea, input, [tabindex="0"]');
    firstControl?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);
  return dialogRef;
}

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

function LandingScreen({ onStart, hasSavedResult, onDeleteSaved }: { onStart: () => void; hasSavedResult: boolean; onDeleteSaved: () => void }) {
  return (
    <section className="screen screen--landing page-grid">
      <div className="hero-copy">
        <p className="eyebrow"><span className="eyebrow__line" /> YOUR PLAY, DECODED</p>
        <h1>あなたの強みを、<br /><em>チャンピオン</em>に変える。</h1>
        <p className="hero-copy__lead">反応・精度・予測・判断・メンタル。8つの実測テストとプレイの好みから、今のあなたに合うLoLチャンピオンを読み解きます。</p>
        <div className="hero-copy__actions"><button className="button button--primary button--large" type="button" onClick={onStart}>診断をはじめる <span>→</span></button><span className="action-note">クイック診断 約8分<br />詳細判定はあとから追加できます</span></div>
        {hasSavedResult && <div className="saved-result-card"><div><strong>保存済みの診断結果があります</strong><small>削除tokenはこの端末に保管しています。保存期間は90日です。</small></div><button className="text-button" type="button" onClick={onDeleteSaved}>保存結果を削除</button></div>}
        <div className="hero-trust"><span><b>8</b>測定カテゴリ</span><span><b>16</b>プレイ傾向質問</span><span><b>0</b>生ログ送信</span></div>
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

function EnvironmentScreen({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  const [checks, setChecks] = useState({ browser: typeof PointerEvent !== 'undefined', viewport: typeof window === 'undefined' ? 'ready' as const : viewportStatus(window.innerWidth, window.innerHeight), pointer: false, keyboard: false });
  const [keyboardSequence, setKeyboardSequence] = useState<string[]>([]);
  useEffect(() => {
    const update = () => setChecks((value) => ({ ...value, viewport: viewportStatus(window.innerWidth, window.innerHeight) }));
    update();
    window.addEventListener('resize', update);
    const handler = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!KEY_SEQUENCE.includes(key as typeof KEY_SEQUENCE[number])) return;
      event.preventDefault();
      setKeyboardSequence((current) => {
        const nextKey = KEY_SEQUENCE[current.length];
        if (key !== nextKey) return key === KEY_SEQUENCE[0] ? [key] : [];
        const next = [...current, key];
        if (next.length === KEY_SEQUENCE.length) setChecks((value) => ({ ...value, keyboard: true }));
        return next;
      });
    };
    window.addEventListener('keydown', handler);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('keydown', handler); };
  }, []);
  const ready = checks.browser && checks.pointer && checks.keyboard;
  const rows: Array<[keyof typeof checks, string, string]> = [['browser', '対応ブラウザ', 'Chrome / Edge / Firefox'], ['viewport', '画面サイズ', '1024 × 640 以上を推奨（警告のみ）'], ['pointer', 'ポインター入力', '下の確認ボタンをクリック'], ['keyboard', 'キーボード入力', 'Q → W → E → R の順に押す']];
  return <section className="screen screen--narrow"><Stepper current={0} labels={['環境', 'プロフィール', '好み', '同意', '校正']} /><div className="section-heading"><p className="eyebrow">01 / ENVIRONMENT CHECK</p><h1>測定できる状態を<br /><em>つくっています。</em></h1><p>この診断はマウス／ポインターとキーボードを使います。未操作の環境をREADYにはせず、ここで実際に入力できるか確認します。</p></div><div className="check-list">{rows.map(([key, title, detail]) => { const value = checks[key]; const isReady = key === 'viewport' ? value === 'ready' : value === true; const isWarning = key === 'viewport' && !isReady; return <div className={`check-row ${isReady ? 'is-ready' : ''} ${isWarning ? 'is-warning' : ''}`} key={key}><span className="check-row__icon">{isReady ? '✓' : isWarning ? '△' : '…'}</span><span><strong>{title}</strong><small>{detail}</small></span><span className="check-row__status">{isReady ? 'READY' : isWarning ? 'WARNING' : 'CHECKING'}</span></div>; })}</div><div className="environment-actions"><button className="button button--secondary" type="button" onPointerDown={() => setChecks((value) => ({ ...value, pointer: true }))} disabled={!checks.browser}>{checks.pointer ? 'ポインター入力を確認済み' : 'ここをクリックして確認'}</button><span className="environment-key-hint">入力済み: {keyboardSequence.length ? keyboardSequence.map((key) => key.toUpperCase()).join(' → ') : 'まだありません'}</span></div><div className="notice notice--teal"><span>ⓘ</span><span>画面サイズは推奨値未満でも進められます。タッチ端末やキーボードが使えない環境では診断を開始できません。</span></div><div className="screen-actions"><button className="text-button" type="button" onClick={onBack}>← ホームへ戻る</button><button className="button button--primary" type="button" onClick={onContinue} disabled={!ready}>プロフィールを設定する <span>→</span></button></div></section>;
}

function ProfileScreen({ profile, setProfile, onContinue, onBack }: { profile: UserProfile; setProfile: (value: UserProfile) => void; onContinue: () => void; onBack: () => void }) {
  return <section className="screen screen--narrow"><Stepper current={1} labels={['環境', 'プロフィール', '好み', '同意', '校正']} /><div className="section-heading"><p className="eyebrow">02 / PROFILE</p><h1>あなたのプレイを、<br /><em>少しだけ教えてください。</em></h1><p>結果の解釈に使う最低限の情報です。入力しなくても診断できます。</p></div><div className="form-card"><label className="field-label" htmlFor="displayName">表示名 <span>任意</span></label><input id="displayName" className="text-input" value={profile.displayName} maxLength={24} onChange={(event) => setProfile({ ...profile, displayName: event.target.value })} placeholder="例：Hodaka" /><div className="field-label">LoL経験</div><div className="choice-grid choice-grid--three">{[['beginner', 'これから始める', '初めて〜数十時間'], ['returning', '久しぶりに遊ぶ', '感覚を取り戻したい'], ['experienced', '継続して遊んでいる', '自分の強みを知りたい']].map(([value, title, detail]) => <button key={value} type="button" aria-pressed={profile.experience === value} className={`choice-card ${profile.experience === value ? 'is-selected' : ''}`} onClick={() => setProfile({ ...profile, experience: value as Experience })}><strong>{title}</strong><small>{detail}</small></button>)}</div><div className="field-label">興味のあるレーン <span>選んだレーンの候補に絞ります</span></div><div className="lane-picker">{(['ALL', 'TOP', 'JUNGLE', 'MID', 'BOT', 'SUPPORT'] as const).map((lane) => <button key={lane} type="button" aria-pressed={profile.preferredLane === lane} className={profile.preferredLane === lane ? 'is-selected' : ''} onClick={() => setProfile({ ...profile, preferredLane: lane })}>{LANE_LABELS[lane]}</button>)}</div></div><div className="screen-actions"><button className="text-button" type="button" onClick={onBack}>← 環境へ戻る</button><button className="button button--primary" type="button" onClick={onContinue}>プレイの好みへ進む <span>→</span></button></div></section>;
}

function PreferencesScreen({ preferences, setPreferences, index, setIndex, completedKeys, setCompletedKeys, skippedKeys, setSkippedKeys, onContinue, onBack }: { preferences: ScoreMap; setPreferences: (value: ScoreMap) => void; index: number; setIndex: (value: number | ((current: number) => number)) => void; completedKeys: Set<string>; setCompletedKeys: (value: Set<string> | ((current: Set<string>) => Set<string>)) => void; skippedKeys: Set<string>; setSkippedKeys: (value: Set<string> | ((current: Set<string>) => Set<string>)) => void; onContinue: () => void; onBack: () => void }) {
  const current = PREFERENCE_QUESTIONS[index];
  const questionKeys = PREFERENCE_QUESTIONS.map(([key]) => key);
  const choose = (value: number) => { setPreferences({ ...preferences, [current[0]]: value }); setSkippedKeys((keys) => { const next = new Set(keys); next.delete(current[0]); return next; }); setCompletedKeys((keys) => new Set(keys).add(current[0])); if (index < PREFERENCE_QUESTIONS.length - 1) setIndex((value) => value + 1); };
  const skipCurrent = () => {
    if (skippedKeys.has(current[0])) {
      setSkippedKeys((keys) => { const next = new Set(keys); next.delete(current[0]); return next; });
      setCompletedKeys((keys) => { const next = new Set(keys); next.delete(current[0]); return next; });
      return;
    }
    const nextPreferences = { ...preferences };
    delete nextPreferences[current[0]];
    setPreferences(nextPreferences);
    setSkippedKeys((keys) => new Set(keys).add(current[0]));
    setCompletedKeys((keys) => new Set(keys).add(current[0]));
    if (index < PREFERENCE_QUESTIONS.length - 1) setIndex((value) => value + 1);
  };
  const allCompleted = isPreferenceSetComplete(questionKeys, completedKeys);
  const isSkipped = skippedKeys.has(current[0]);
  const value = preferences[current[0]] ?? 0.5;
  return <section className="screen screen--narrow"><Stepper current={2} labels={['環境', 'プロフィール', '好み', '同意', '校正']} /><div className="section-heading"><p className="eyebrow">03 / PLAY STYLE</p><h1>勝ち方ではなく、<br /><em>好きな動き方。</em></h1><p>正解はありません。直感で答えるほど、チャンピオンとの相性が自然に出ます。回答はあとで戻って変更できます。</p></div><div className="question-card"><div className="question-card__top"><span>QUESTION {String(index + 1).padStart(2, '0')} / {PREFERENCE_QUESTIONS.length}</span><span>{Math.round((completedKeys.size / PREFERENCE_QUESTIONS.length) * 100)}% COMPLETE</span></div><div className="progress-line"><span style={{ width: `${(completedKeys.size / PREFERENCE_QUESTIONS.length) * 100}%` }} /></div><h2>{current[1]}</h2><div className="likert">{isSkipped && <span className="question-skipped">この質問はスキップ中</span>}<span>まったく違う</span><div>{[0, 0.25, 0.5, 0.75, 1].map((option) => <button key={option} type="button" className={!isSkipped && completedKeys.has(current[0]) && Math.abs(value - option) < 0.01 ? 'is-selected' : ''} onClick={() => choose(option)} aria-label={`${option * 100}%`} aria-pressed={!isSkipped && completedKeys.has(current[0]) && Math.abs(value - option) < 0.01}><i /></button>)}</div><span>とても当てはまる</span></div><div className="question-card__footer"><button className="text-button" type="button" onClick={() => setIndex((currentIndex) => Math.max(0, currentIndex - 1))} disabled={index === 0}>← 前の質問</button><span>{isSkipped ? 'スキップ済み。選択すると回答に戻せます' : completedKeys.has(current[0]) ? '回答済み。変更もできます' : '回答またはスキップしてください'}</span><button className="text-button" type="button" onClick={skipCurrent}>{isSkipped ? 'スキップを取り消す' : index === PREFERENCE_QUESTIONS.length - 1 ? 'スキップして確認' : 'この質問をスキップ →'}</button></div></div><div className="screen-actions"><button className="text-button" type="button" onClick={onBack}>← プロフィールへ戻る</button><button className="button button--secondary" type="button" onClick={() => { setPreferences(DEFAULT_PREFERENCES); setCompletedKeys(new Set(questionKeys)); setSkippedKeys(new Set(questionKeys)); onContinue(); }}>すべてスキップして進む</button><button className="button button--primary" type="button" onClick={onContinue} disabled={!allCompleted}>同意設定へ進む <span>→</span></button></div></section>;
}

function ConsentScreen({ consent, setConsent, riotContext, onRiotVerified, onContinue, onBack }: { consent: boolean; setConsent: (value: boolean) => void; riotContext: PublicRiotContext | null; onRiotVerified: (context: PublicRiotContext) => void; onContinue: () => void; onBack: () => void }) {
  return <section className="screen screen--narrow"><Stepper current={3} labels={['環境', 'プロフィール', '好み', '同意', '校正']} /><div className="section-heading"><p className="eyebrow">04 / DATA CHOICE</p><h1>結果の扱いを、<br /><em>あなたが選ぶ。</em></h1><p>測定中の生ログは画面内だけで使い、APIへ送信しません。保存・フィードバック・Riot ID確認を選んだ場合だけ、目的に必要な情報を送信します。</p></div><div className="consent-card"><div className="consent-card__icon">◎</div><div><h2>診断結果を匿名保存する</h2><p>同意した場合のみ、能力ベクトル・サブスコア・信頼度・おすすめ結果を保存します。保存後は結果画面またはこの端末のホーム画面から削除できます。保存期間は90日です。</p><label className="toggle-row"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span className="toggle" /><strong>{consent ? '保存を許可する' : '今回は保存しない'}</strong></label></div></div><RiotVerificationPanel context={riotContext} onVerified={onRiotVerified} /><div className="privacy-grid"><div><strong>外部へ送らないもの</strong><span>生クリック座標・キー入力列・フレーム軌道・個別試行ログ</span></div><div><strong>選択時に送られるもの</strong><span>保存：集約値／Riot確認：公開コンテキストのみ</span></div></div><div className="screen-actions"><button className="text-button" type="button" onClick={onBack}>← 好みへ戻る</button><button className="button button--primary" type="button" onClick={onContinue}>校正へ進む <span>→</span></button></div></section>;
}

function CalibrationStage({ onComplete, onAbort, mode }: { onComplete: () => void; onAbort: () => void; mode: JourneyMode }) {
  const [stage, setStage] = useState<'pointer' | 'keyboard' | 'complete'>('pointer');
  const [point, setPoint] = useState(0);
  const [pointerLatencies, setPointerLatencies] = useState<number[]>([]);
  const [keyboardLatencies, setKeyboardLatencies] = useState<number[]>([]);
  const [keyboardStep, setKeyboardStep] = useState(0);
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
      if (event.key.toLowerCase() !== KEY_SEQUENCE[keyboardStep]) return;
      event.preventDefault();
      const next = [...keyboardLatencies, performance.now() - keyStartedAt.current];
      setKeyboardLatencies(next);
      if (keyboardStep + 1 >= KEY_SEQUENCE.length) setStage('complete');
      else { setKeyboardStep((value) => value + 1); keyStartedAt.current = performance.now(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [stage, keyboardLatencies, keyboardStep]);
  const hitPointer = () => {
    if (stage !== 'pointer') return;
    const next = [...pointerLatencies, performance.now() - pointerStartedAt.current];
    if (point >= targets.length - 1) { setPointerLatencies(next); setKeyboardStep(0); setKeyboardLatencies([]); setStage('keyboard'); }
    else { setPointerLatencies(next); setPoint((value) => value + 1); pointerStartedAt.current = performance.now(); }
  };
  useEffect(() => { if (stage === 'pointer') pointerStartedAt.current = performance.now(); }, [stage, point]);
  return <section className="screen screen--calibration"><div className="calibration-head"><div><p className="eyebrow">05 / CALIBRATION</p><h1>入力の基準を<br /><em>セットします。</em></h1></div><div className="calibration-meta"><span className="status-dot status-dot--good" /> 実測イベント / {mode === 'detailed' ? '詳細判定' : mode === 'retest' ? '再テスト' : 'クイック診断'} <button className="text-button" type="button" onClick={onAbort}>中断して戻る</button></div></div>{!viewportReady && <div className="notice notice--amber">画面サイズが推奨値未満です。クリック判定を見やすくするため、可能ならウィンドウを広げてください。</div>}<div className="calibration-stage">{stage === 'pointer' && <><div className="calibration-instruction"><span>POINTER CHECK {point + 1} / {targets.length}</span><strong>光るターゲットをクリック</strong><small>実際にターゲットをクリックして、入力の基準を確認します。</small></div><button className="calibration-target" style={{ left: targets[point].left, top: targets[point].top, transform: `translate(-50%, -50%) scale(${1 + Math.sin(pulse * 3) * 0.06})` }} type="button" onPointerDown={hitPointer} aria-label={`校正ターゲット ${point + 1}`}><span /></button></>}{stage === 'keyboard' && <div className="keyboard-check"><span>KEYBOARD CHECK {keyboardStep + 1} / {KEY_SEQUENCE.length}</span><strong>Q W E R を順番に押してください</strong><small>次のキー：{KEY_SEQUENCE[keyboardStep].toUpperCase()}。4キーすべての押下を確認します。</small><div className="key-row">{KEY_SEQUENCE.map((key, index) => <kbd key={key} className={index < keyboardStep ? 'is-done' : index === keyboardStep ? 'is-current' : ''}>{key.toUpperCase()}</kbd>)}</div></div>}{stage === 'complete' && <div className="calibration-complete"><span className="complete-mark">✓</span><span>CALIBRATION COMPLETE</span><h2>測定の準備ができました。</h2><p>ここからのテストは、あなたの入力状態に合わせて判定します。</p><button className="button button--primary" type="button" onClick={onComplete}>診断の概要を見る <span>→</span></button></div>}</div></section>;
}

function OverviewScreen({ onStart, mode, testQueue }: { onStart: () => void; mode: JourneyMode; testQueue: TestId[] }) {
  const detailed = mode === 'detailed';
  return <section className="screen screen--narrow"><div className="overview-kicker"><span className="status-dot status-dot--good" /> SESSION {detailed ? 'DETAILED' : 'QUICK'} / READY</div><div className="section-heading"><p className="eyebrow">WHAT WE MEASURE</p><h1>{detailed ? <>詳細判定で、<br /><em>もう一段深く。</em></> : <>8つのテストで、<br /><em>プレイの輪郭を測る。</em></>}</h1><p>{detailed ? 'クイック診断より試行数を増やし、安定度・失敗抑制・切り替えコストまで含めて判定します。' : '速さだけではありません。狙う、予測する、切り替える、立て直す。実際のゲームで感じる複数の強みを分けて見ます。'}</p></div><div className="measure-grid">{testQueue.map((testId, index) => { const definition = TEST_DEFINITIONS.find((item) => item.id === testId)!; return <div className="measure-tile" key={testId}><span>{String(index + 1).padStart(2, '0')}</span><strong>{definition.name}</strong><small>{definition.group}</small></div>; })}</div><div className="notice notice--teal"><span>◎</span><span>練習ラウンドで操作を確認してから本番へ進みます。途中でやめても、完了済みの結果は破棄されません。</span></div><button className="button button--primary button--large" type="button" onClick={onStart}>{detailed ? '詳細判定を開始する' : 'クイック診断を開始する'} <span>→</span></button></section>;
}

function AbilityBars({ result }: { result: DiagnosticResult }) {
  return <div className="ability-panel"><div className="panel-heading"><div><p className="eyebrow">ABILITY VECTOR</p><h2>あなたの操作プロファイル</h2></div><span className="status-chip">{result.mode === 'detailed' ? 'DETAILED' : 'QUICK READ'}</span></div><div className="ability-list">{Object.entries(result.abilities).map(([key, value]) => <div className="ability-row" key={key}><div className="ability-row__label"><span>{ABILITY_LABELS[key] ?? key}</span><b>{signalLabel(value)}</b></div><div className="ability-signal" aria-label={`${ABILITY_LABELS[key] ?? key} ${signalLabel(value)}`}><span className={value !== undefined && value >= 0.34 ? 'is-on' : ''} /><span className={value !== undefined && value >= 0.5 ? 'is-on' : ''} /><span className={value !== undefined && value >= 0.72 ? 'is-on' : ''} /></div><small>{value !== undefined && value >= 0.72 ? '強みとして出ています' : value !== undefined && value >= 0.5 ? '伸びしろを含む安定域' : '練習で変化しやすい領域'}</small></div>)}</div><div className="aptitude-title-card"><p className="eyebrow">PLAY TITLE</p><h3>{result.aptitudeTitle.name}</h3><p>{result.aptitudeTitle.description}</p><div className="tag-list">{result.aptitudeTitle.signals.map((signal) => <span key={signal}>{ABILITY_LABELS[signal] ?? signal}</span>)}</div></div></div>;
}

const DELETE_RECORD_STORAGE_KEY = 'lol-skill-lab:delete-record';
interface StoredDeleteRecord {
  resultId: string;
  deleteToken: string;
  expiresAt?: string;
}

function readStoredDeleteRecord(): StoredDeleteRecord | null {
  try {
    const raw = localStorage.getItem(DELETE_RECORD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredDeleteRecord>;
    if (typeof parsed.resultId !== 'string' || parsed.resultId.length === 0 || parsed.resultId.length > 128 || typeof parsed.deleteToken !== 'string' || parsed.deleteToken.length === 0 || parsed.deleteToken.length > 256) return null;
    if (typeof parsed.expiresAt === 'string') {
      const expiresAt = Date.parse(parsed.expiresAt);
      if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
        localStorage.removeItem(DELETE_RECORD_STORAGE_KEY);
        return null;
      }
    }
    return { resultId: parsed.resultId, deleteToken: parsed.deleteToken, ...(typeof parsed.expiresAt === 'string' ? { expiresAt: parsed.expiresAt } : {}) };
  } catch {
    return null;
  }
}

function writeStoredDeleteRecord(record: StoredDeleteRecord): boolean {
  try {
    localStorage.setItem(DELETE_RECORD_STORAGE_KEY, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

function clearStoredDeleteRecord(): void {
  try { localStorage.removeItem(DELETE_RECORD_STORAGE_KEY); } catch { /* Storage may be disabled. */ }
}

const DATA_DRAGON_KEYS: Record<string, string> = { 'lee-sin': 'LeeSin', 'kai-sa': 'Kaisa' };

function ChampionAvatar({ candidate }: { candidate: RecommendationCandidate }) {
  const dataDragonKey = DATA_DRAGON_KEYS[candidate.championId] ?? candidate.championId.split('-').map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`).join('');
  const dataDragonUrl = `https://ddragon.leagueoflegends.com/cdn/15.15.1/img/champion/${dataDragonKey}.png`;
  const [source, setSource] = useState(candidate.iconUrl ?? dataDragonUrl);
  const [usingFallback, setUsingFallback] = useState(!candidate.iconUrl);
  const [failed, setFailed] = useState(false);
  const handleError = () => {
    if (!usingFallback) {
      setUsingFallback(true);
      setSource(dataDragonUrl);
      return;
    }
    setFailed(true);
  };
  return <div className="champion-card__avatar">{failed ? candidate.championName.slice(0, 1) : <img src={source} alt={`${candidate.championName} icon`} onError={handleError} />}</div>;
}

function RecommendationBucketView({ title, bucket, accent }: { title: string; bucket: NonNullable<DiagnosticResult['recommendations']>['readyNow']; accent: string }) {
  const items: RecommendationCandidate[] = [bucket.primary, ...bucket.alternatives].filter((item): item is RecommendationCandidate => Boolean(item));
  return <section className={`recommendation-bucket recommendation-bucket--${accent}`}><div className="recommendation-bucket__head"><div><span className="bucket-index">{accent === 'ready' ? '01' : accent === 'growth' ? '02' : '03'}</span><h3>{title}</h3></div><small>{bucket.explanation}</small></div>{items.length === 0 ? <div className="empty-bucket">今回の測定では、条件に合う候補を確定できませんでした。再テストで精度を上げられます。</div> : <div className="champion-grid">{items.map((candidate) => <article className="champion-card" key={`${candidate.championId}-${candidate.lane}`}><ChampionAvatar candidate={candidate} /><div className="champion-card__main"><div className="champion-card__name"><div><strong>{candidate.championName}</strong><small>{candidate.lane} / {candidate.label}</small></div><b>{signalLabel(candidate.score)}</b></div><p>{candidate.reason}</p><div className="tag-list">{candidate.strengthTags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}{candidate.trainingTags.slice(0, 2).map((tag) => <span key={`training-${tag}`}>練習: {tag}</span>)}</div><div className="champion-card__links">{candidate.wikiUrl && <a href={candidate.wikiUrl} target="_blank" rel="noreferrer">チャンピオンの考察を見る ↗</a>}<span>次に試す: {candidate.trainingTags[0] ?? '通常プレイで強みを確認する'}</span></div></div></article>)}</div>}</section>;
}

function ShareCard({ result, profile, cardRef }: { result: DiagnosticResult; profile: UserProfile; cardRef: React.RefObject<HTMLDivElement | null> }) {
  const primary = result.recommendations?.readyNow.primary ?? result.recommendations?.growthCandidate.primary;
  return <div className="share-card" ref={cardRef}><div className="share-card__top"><span>LoLスキルラボ</span><span>APTITUDE REPORT / {result.mode?.toUpperCase()}</span></div><div className="share-card__hero"><p>{profile.displayName || 'GUEST'} のプレイ適性</p><h2>{result.aptitudeTitle.name}</h2><small>{primary ? `${primary.championName} が今のあなたに近い` : 'あなたのプレイ傾向が見えました'} / {result.aptitudeTitle.description}</small><div className="share-card__score"><strong>PLAY PROFILE</strong><span>反応・精度・判断を組み合わせた<br />あなたのプレイ傾向スナップショット</span></div></div><div className="share-card__bars">{Object.entries(result.abilities).slice(0, 6).map(([key, value]) => <div key={key}><span>{ABILITY_LABELS[key]}</span><i className={`share-signal share-signal--${signalLabel(value)}`}>{signalLabel(value)}</i></div>)}</div><div className="share-card__foot"><span>lol-skill-lab / 1.0.0</span><span>診断は参考情報です</span></div></div>;
}

const ABILITY_TEST_MAP: Partial<Record<string, TestId>> = { reaction: 'reaction', clickAccuracy: 'clickAccuracy', inputControl: 'inputControl', prediction: 'prediction', attentionDistribution: 'attentionDistribution', taskSwitching: 'taskSwitching', decisionSpeed: 'decision', decisionQuality: 'decision', pressureStability: 'mentalStability', recovery: 'mentalStability' };

function ResultScreen({ result, profile, consent, savedResultId, saving, deleting, onDetailed, onRetest, onShare, onSave, onSaveWithConsent, onFeedback, onDelete }: { result: DiagnosticResult; profile: UserProfile; consent: boolean; savedResultId: string | null; saving: boolean; deleting: boolean; onDetailed: () => void; onRetest: (testId: TestId) => void; onShare: () => void; onSave: () => void; onSaveWithConsent: () => Promise<void>; onFeedback: () => void; onDelete: () => void }) {
  const [retestOpen, setRetestOpen] = useState(false);
  const topAbility = Object.entries(result.abilities).sort(([, left], [, right]) => (right ?? 0) - (left ?? 0))[0];
  const confidenceValues = Object.values(result.confidence).filter((value): value is number => value !== undefined);
  const confidence = confidenceValues.length === 0 ? undefined : confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length;
  const lowConfidence = Object.entries(result.confidence).find(([, value]) => (value ?? 0) < 0.65);
  const lowConfidenceTest = lowConfidence ? ABILITY_TEST_MAP[lowConfidence[0]] : undefined;
  const primaryRecommendation = result.recommendations?.readyNow.primary ?? result.recommendations?.growthCandidate.primary ?? result.recommendations?.aspirational.primary;
  return <section className="screen screen--result"><div className="result-hero"><div><p className="eyebrow">RESULT / {result.mode === 'detailed' ? 'DETAILED DIAGNOSIS' : 'QUICK DIAGNOSIS'}</p><h1>{profile.displayName || 'ゲスト'}さんの<br /><em>プレイ適性が見えました。</em></h1><p>最も強く出た領域は <strong>{ABILITY_LABELS[topAbility?.[0] ?? 'reaction']}</strong>。チャンピオンは、能力だけでなく好みと成長余地も合わせて選んでいます。</p>{primaryRecommendation && <div className="result-hero__recommendation"><span>まず試す候補</span><strong>{primaryRecommendation.championName} / {primaryRecommendation.lane}</strong><small>{primaryRecommendation.reason}</small></div>}</div><div className="result-hero__signal"><span className="signal-ring" /><strong>PEAK</strong><small>{ABILITY_LABELS[topAbility?.[0] ?? 'reaction']} / SIGNAL</small></div></div><div className="result-layout"><div><AbilityBars result={result} /><div className="result-actions"><button className="button button--primary" type="button" onClick={onDetailed} disabled={result.mode === 'detailed'}>{result.mode === 'detailed' ? '詳細判定済み' : '詳細判定を追加する'} <span>→</span></button><button className="button button--secondary" type="button" onClick={onShare}>結果カードを作る</button><button className="button button--ghost" type="button" onClick={onFeedback}>フィードバック</button></div><div className="privacy-note"><span>◌</span><span>{savedResultId ? 'この結果を匿名保存しています。保存期間は90日です。' : consent ? '保存に同意済みですが、この結果はまだ保存していません。' : 'この結果は保存されていません。保存するかどうかはここで選べます。'}</span>{savedResultId ? <button className="text-button" type="button" onClick={onDelete} disabled={deleting}>{deleting ? '削除中…' : '削除'}</button> : consent ? <button className="text-button" type="button" onClick={onSave} disabled={saving}>{saving ? '保存中…' : '保存する'}</button> : <button className="text-button" type="button" onClick={onSaveWithConsent} disabled={saving}>{saving ? '保存中…' : '同意して保存'}</button>}</div></div><aside className="result-side"><div className="confidence-card"><div className="panel-heading"><div><p className="eyebrow">MEASUREMENT CONFIDENCE</p><h3>判定の信頼度</h3></div><span className="confidence-value">{confidenceLabel(confidence)}</span></div><div className="confidence-signal"><span className={confidence !== undefined && confidence >= 0.34 ? 'is-on' : ''} /><span className={confidence !== undefined && confidence >= 0.65 ? 'is-on' : ''} /><span className={confidence !== undefined && confidence >= 0.8 ? 'is-on' : ''} /></div><p>能力ごとの測定の完了度・入力の安定性・ばらつきを平均した目安です。強さと測定の確かさは別に確認できます。</p><strong>{confidence !== undefined && confidence >= 0.8 ? '測定は安定しています' : '再テストでさらに安定します'}</strong>{lowConfidenceTest && <button className="text-button confidence-retest" type="button" onClick={() => onRetest(lowConfidenceTest)}>低信頼の「{ABILITY_LABELS[lowConfidence?.[0] ?? 'reaction']}」を再測定 →</button>}</div><div className="retest-card"><div><p className="eyebrow">RETEST</p><h3>気になる項目だけ再測定</h3><p>結果を捨てずに、1カテゴリだけ更新できます。</p></div><button className="icon-button" type="button" aria-label={retestOpen ? '再テスト一覧を閉じる' : '再テスト一覧を開く'} onClick={() => setRetestOpen((value) => !value)}>{retestOpen ? '×' : '+'}</button>{retestOpen && <div className="retest-list">{DEFAULT_TEST_QUEUE.map((testId) => <button key={testId} type="button" onClick={() => onRetest(testId)}>{TEST_DEFINITIONS.find((item) => item.id === testId)?.name}<span>→</span></button>)}</div>}</div></aside></div><div className="recommendations"><div className="section-heading section-heading--compact"><p className="eyebrow">CHAMPION MATCH / 3 LAYERS</p><h2>今のあなたに合う、3つの距離感。</h2><p>「すぐ活かせる」「伸ばしながら合う」「長期で挑戦したい」を分けて表示しています。ひとつの正解に閉じません。各カードから考察と次の練習を確認できます。</p></div>{result.recommendations && <><RecommendationBucketView title="今すぐ活かせる" bucket={result.recommendations.readyNow} accent="ready" /><RecommendationBucketView title="成長しながら合う" bucket={result.recommendations.growthCandidate} accent="growth" /><RecommendationBucketView title="長期で挑戦したい" bucket={result.recommendations.aspirational} accent="aspirational" /></>}</div></section>;
}

function FeedbackPanel({ onClose, onSubmit }: { onClose: () => void; onSubmit: (satisfaction: 'satisfied' | 'partial' | 'disagree', comment: string) => Promise<boolean> }) {
  const [satisfaction, setSatisfaction] = useState<'satisfied' | 'partial' | 'disagree'>('satisfied');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useDialogLifecycle(onClose);
  const submit = async () => { if (submitting) return; setSubmitting(true); const succeeded = await onSubmit(satisfaction, comment); setSubmitting(false); if (succeeded) onClose(); };
  return <div className="modal-backdrop" role="presentation"><div ref={dialogRef} className="modal-card" role="dialog" aria-modal="true" aria-labelledby="feedback-title" tabIndex={-1}><button className="modal-close" type="button" aria-label="フィードバックを閉じる" onClick={onClose}>×</button><p className="eyebrow">FEEDBACK LOOP</p><h2 id="feedback-title">この診断、どう感じましたか？</h2><p>正解を合わせるためではなく、測定の体験とおすすめの納得感を改善するために使います。</p><div className="feedback-choices">{[['satisfied', '納得できた', '結果を試してみたい'], ['partial', '少し違う', '一部だけ当てはまる'], ['disagree', '違和感がある', '自分の感覚と離れている']].map(([value, title, detail]) => <button key={value} type="button" aria-pressed={satisfaction === value} className={satisfaction === value ? 'is-selected' : ''} onClick={() => setSatisfaction(value as typeof satisfaction)}><strong>{title}</strong><small>{detail}</small></button>)}</div><textarea className="text-area" aria-label="フィードバックコメント" value={comment} maxLength={2000} onChange={(event) => setComment(event.target.value)} placeholder="任意：気づいたこと、普段よく使うチャンピオンなど" /><button className="button button--primary" type="button" onClick={submit} disabled={submitting}>{submitting ? '送信中…' : '送信する'} <span>→</span></button></div></div>;
}

function ShareModal({ result, profile, cardRef, onClose, onDownload }: { result: DiagnosticResult; profile: UserProfile; cardRef: React.RefObject<HTMLDivElement | null>; onClose: () => void; onDownload: () => void }) {
  const dialogRef = useDialogLifecycle(onClose);
  return <div className="modal-backdrop" role="presentation"><div ref={dialogRef} className="share-modal" role="dialog" aria-modal="true" aria-labelledby="share-title" tabIndex={-1}><button className="modal-close" type="button" aria-label="結果カードを閉じる" onClick={onClose}>×</button><p className="eyebrow">SHARE CARD</p><h2 id="share-title">あなたの現在地を、1枚に。</h2><ShareCard result={result} profile={profile} cardRef={cardRef} /><div className="share-modal__actions"><button className="button button--primary" type="button" onClick={onDownload}>PNGをダウンロード <span>↓</span></button><button className="button button--secondary" type="button" onClick={onClose}>閉じる</button></div></div></div>;
}

function LeaveDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const dialogRef = useDialogLifecycle(onCancel);
  return <div className="modal-backdrop" role="presentation"><div ref={dialogRef} className="modal-card leave-dialog" role="dialog" aria-modal="true" aria-labelledby="leave-title" tabIndex={-1}><p className="eyebrow">LEAVE SESSION</p><h2 id="leave-title">この画面を離れますか？</h2><p>未完了の診断は保存されません。完了済みの結果は、匿名保存している場合のみ後から削除できます。</p><div className="share-modal__actions"><button className="button button--secondary" type="button" onClick={onCancel}>続ける</button><button className="button button--primary" type="button" onClick={onConfirm}>ホームへ戻る</button></div></div></div>;
}

function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [journey, setJourney] = useState<JourneyMode>('quick');
  const [profile, setProfile] = useState<UserProfile>({ displayName: '', experience: 'beginner', preferredLane: 'ALL' });
  const [preferences, setPreferences] = useState<ScoreMap>(DEFAULT_PREFERENCES);
  const [preferenceIndex, setPreferenceIndex] = useState(0);
  const [completedPreferenceKeys, setCompletedPreferenceKeys] = useState<Set<string>>(new Set());
  const [skippedPreferenceKeys, setSkippedPreferenceKeys] = useState<Set<string>>(new Set());
  const [consent, setConsent] = useState(false);
  const [riotContext, setRiotContext] = useState<PublicRiotContext | null>(null);
  const [candidates, setCandidates] = useState<ChampionLaneProfile[]>([]);
  const [testQueue, setTestQueue] = useState<TestId[]>(DEFAULT_TEST_QUEUE);
  const [runtimeConfig, setRuntimeConfig] = useState<RuntimeConfigSnapshot>({ manifest: {}, tests: DEFAULT_TEST_CONFIGURATION, source: 'static' });
  const [queueIndex, setQueueIndex] = useState(0);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [savedResultId, setSavedResultId] = useState<string | null>(() => readStoredDeleteRecord()?.resultId ?? null);
  const [savedDeleteToken, setSavedDeleteToken] = useState<string | null>(() => readStoredDeleteRecord()?.deleteToken ?? null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeKind, setNoticeKind] = useState<NoticeKind>('success');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [leavePrompt, setLeavePrompt] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadRuntimeConfig().then((config) => { setCandidates(config.candidates); setRuntimeConfig(config.snapshot); }); }, []);
  useEffect(() => {
    if (screen === 'landing') return;
    const warnBeforeLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '未完了の診断は保存されません。';
    };
    window.addEventListener('beforeunload', warnBeforeLeave);
    return () => window.removeEventListener('beforeunload', warnBeforeLeave);
  }, [screen]);

  const currentTest = testQueue[queueIndex];
  const currentDefinition = useMemo(() => TEST_DEFINITIONS.find((item) => item.id === currentTest), [currentTest]);
  const stepIndex = screen === 'environment' ? 0 : screen === 'profile' ? 1 : screen === 'preferences' ? 2 : screen === 'consent' ? 3 : screen === 'calibration' ? 4 : 0;

  const showNotice = (message: string, kind: NoticeKind = 'success') => { setNotice(message); setNoticeKind(kind); };
  const reset = () => { setScreen('landing'); setResult(null); setTestResults([]); const stored = readStoredDeleteRecord(); setSavedResultId(stored?.resultId ?? null); setSavedDeleteToken(stored?.deleteToken ?? null); setRiotContext(null); setConsent(false); setProfile({ displayName: '', experience: 'beginner', preferredLane: 'ALL' }); setPreferences(DEFAULT_PREFERENCES); setPreferenceIndex(0); setCompletedPreferenceKeys(new Set()); setSkippedPreferenceKeys(new Set()); setTestQueue(DEFAULT_TEST_QUEUE); setQueueIndex(0); setFeedbackOpen(false); setShareOpen(false); setNotice(null); setJourney('quick'); };
  const beginTests = (mode: JourneyMode, ids = DEFAULT_TEST_QUEUE, previous: TestResult[] = []) => { setJourney(mode); setTestQueue(mode === 'quick' || mode === 'detailed' ? createDiagnosticTestQueue(Date.now()) : ids); setQueueIndex(0); setTestResults(previous); setScreen('testing'); setNotice(null); };
  const finishTest = (testResult: TestResult) => {
    const nextResults = [...testResults.filter((item) => item.testId !== testResult.testId), testResult];
    setTestResults(nextResults);
    if (queueIndex + 1 < testQueue.length) { setQueueIndex((value) => value + 1); return; }
    const resultMode: TestMode = journey === 'detailed' ? 'detailed' : journey === 'retest' ? 'retest' : 'quick';
    const laneCandidates = profile.preferredLane === 'ALL' ? candidates : candidates.filter((candidate) => candidate.lane === profile.preferredLane);
    const calculated = calculateDiagnosticResult(nextResults, preferences, laneCandidates.length > 0 ? laneCandidates : candidates, resultMode, { beginner: profile.experience === 'beginner' });
    setResult(calculated);
    // A newly calculated result must not inherit the delete token for an older result.
    setSavedResultId(null);
    setSavedDeleteToken(null);
    setScreen('result');
  };
  const saveResult = async (consentNow = false) => {
    if ((!consent && !consentNow) || !result || saving) return;
    setSaving(true);
    try {
      const configVersions = Object.fromEntries(Object.entries(runtimeConfig.manifest).filter(([, value]) => typeof value === 'string'));
      const response = await fetch('/api/diagnosis-results', { method: 'POST', headers: apiHeaders(), body: JSON.stringify({ diagnosisVersion: '1.0.0', consentToSave: true, abilityVector: result.abilities, subscores: result.subscores, confidence: result.confidence, recommendations: result.recommendations, aptitudeTypes: { primary: result.aptitudeTitle.id, ruleVersion: typeof runtimeConfig.manifest.aptitudeRuleVersion === 'string' ? runtimeConfig.manifest.aptitudeRuleVersion : '1.0.0' }, configVersions: { ...configVersions, source: runtimeConfig.source }, ...(riotContext ? { riotContext } : {}), createdAt: result.createdAt ?? new Date().toISOString() }) });
      if (!response.ok) throw new Error('save failed');
      const body = await response.json() as { resultId: string; deleteToken: string };
      const createdAt = Date.parse(result.createdAt ?? '');
      const expiresAt = new Date((Number.isNaN(createdAt) ? Date.now() : createdAt) + 90 * 24 * 60 * 60 * 1000).toISOString();
      const persisted = writeStoredDeleteRecord({ resultId: body.resultId, deleteToken: body.deleteToken, expiresAt });
      setSavedResultId(body.resultId); setSavedDeleteToken(body.deleteToken); setNotice(persisted ? '診断結果を匿名保存しました。削除tokenはこの端末に保管しています。保存期間は90日です。' : '診断結果を匿名保存しました。このタブを閉じる前に削除できます。保存期間は90日です。');
      setNoticeKind('success');
    } catch { showNotice('保存に失敗しました。通信状態を確認して、もう一度お試しください。結果はこの画面に残っています。', 'error'); }
    finally { setSaving(false); }
  };
  const deleteResult = async () => { if (!savedResultId || !savedDeleteToken || deleting) { if (!deleting) showNotice('この画面には削除対象の保存結果がありません。', 'info'); return; } setDeleting(true); try { const response = await fetch(`/api/diagnosis-results/${savedResultId}`, { method: 'DELETE', headers: apiHeaders(), body: JSON.stringify({ deleteToken: savedDeleteToken }) }); if (!response.ok) throw new Error('delete failed'); clearStoredDeleteRecord(); setSavedResultId(null); setSavedDeleteToken(null); showNotice('保存した診断結果を削除しました。'); } catch { showNotice('削除に失敗しました。通信状態を確認して、もう一度お試しください。', 'error'); } finally { setDeleting(false); } };
  const submitFeedback = async (satisfaction: 'satisfied' | 'partial' | 'disagree', comment: string): Promise<boolean> => { try { await submitFeedbackRequest({ diagnosisVersion: '1.0.0', satisfaction, comment }); showNotice('フィードバックを受け取りました。ありがとうございます。'); return true; } catch { showNotice('フィードバックを送信できませんでした。入力内容を保持しています。再試行できます。', 'error'); return false; } };
  const downloadShare = async () => { if (!shareRef.current) return; try { const dataUrl = await toPng(shareRef.current, { pixelRatio: 2, cacheBust: true }); const link = document.createElement('a'); link.download = 'lol-skill-lab-result.png'; link.href = dataUrl; link.click(); showNotice('結果カードを画像として保存しました。'); } catch { showNotice('結果カードの生成に失敗しました。', 'error'); } };
  const abortDiagnostic = () => {
    if (result && journey !== 'quick') {
      setScreen('result');
      showNotice('診断を中断しました。直前の確定結果に戻りました。', 'info');
      return;
    }
    reset();
    showNotice('診断を中断しました。未完了の測定は結果に反映されません。', 'info');
  };
  const handleHome = () => { if (screen === 'landing') return; setLeavePrompt(true); };

  let content: React.ReactNode;
  if (screen === 'landing') content = <LandingScreen onStart={() => setScreen('environment')} hasSavedResult={Boolean(savedResultId && savedDeleteToken)} onDeleteSaved={deleteResult} />;
  if (screen === 'environment') content = <EnvironmentScreen onBack={handleHome} onContinue={() => setScreen('profile')} />;
  if (screen === 'profile') content = <ProfileScreen profile={profile} setProfile={setProfile} onBack={() => setScreen('environment')} onContinue={() => setScreen('preferences')} />;
  if (screen === 'preferences') content = <PreferencesScreen preferences={preferences} setPreferences={setPreferences} index={preferenceIndex} setIndex={setPreferenceIndex} completedKeys={completedPreferenceKeys} setCompletedKeys={setCompletedPreferenceKeys} skippedKeys={skippedPreferenceKeys} setSkippedKeys={setSkippedPreferenceKeys} onBack={() => setScreen('profile')} onContinue={() => setScreen('consent')} />;
  if (screen === 'consent') content = <ConsentScreen consent={consent} setConsent={setConsent} riotContext={riotContext} onRiotVerified={setRiotContext} onBack={() => setScreen('preferences')} onContinue={() => { setJourney('quick'); setScreen('calibration'); }} />;
  if (screen === 'calibration') content = <CalibrationStage mode={journey} onAbort={abortDiagnostic} onComplete={() => setScreen(journey === 'retest' ? 'testing' : 'overview')} />;
  if (screen === 'overview') content = <OverviewScreen mode={journey} testQueue={testQueue} onStart={() => beginTests(journey)} />;
  if (screen === 'testing' && currentTest) content = <div className="testing-shell"><div className="test-progress"><div><span className="eyebrow">{journey === 'detailed' ? 'DETAILED DIAGNOSIS' : journey === 'retest' ? 'RETEST' : 'QUICK DIAGNOSIS'}</span><strong>{String(queueIndex + 1).padStart(2, '0')} / {String(testQueue.length).padStart(2, '0')}</strong><span>{currentDefinition?.name}</span></div><div className="test-progress__bar"><span style={{ width: `${(queueIndex / testQueue.length) * 100}%` }} /></div><small className="test-progress__hint">現在地 {queueIndex + 1} / {testQueue.length}　各テストに練習があります</small></div><TestStage key={`${journey}-${currentTest}`} testId={currentTest} mode={journey} configuration={runtimeConfig.tests} onComplete={finishTest} onAbort={abortDiagnostic} /></div>;
  if (screen === 'result' && result) content = <ResultScreen result={result} profile={profile} consent={consent} savedResultId={savedResultId} saving={saving} deleting={deleting} onDetailed={() => { setJourney('detailed'); setScreen('calibration'); }} onRetest={(testId) => beginTests('retest', [testId], testResults)} onShare={() => setShareOpen(true)} onSave={() => saveResult(false)} onSaveWithConsent={() => { setConsent(true); return saveResult(true); }} onFeedback={() => setFeedbackOpen(true)} onDelete={deleteResult} />;

  return <Shell screen={screen} onHome={handleHome}>{content}{notice && <div className={`toast toast--${noticeKind}`} role="status"><span>{noticeKind === 'success' ? '✓' : noticeKind === 'error' ? '!' : 'i'}</span>{notice}<button type="button" aria-label="通知を閉じる" onClick={() => setNotice(null)}>×</button></div>}{feedbackOpen && <FeedbackPanel onClose={() => setFeedbackOpen(false)} onSubmit={submitFeedback} />}{shareOpen && result && <ShareModal result={result} profile={profile} cardRef={shareRef} onClose={() => setShareOpen(false)} onDownload={downloadShare} />}{leavePrompt && <LeaveDialog onCancel={() => setLeavePrompt(false)} onConfirm={() => { setLeavePrompt(false); reset(); }} />}</Shell>;
}

export default App;
