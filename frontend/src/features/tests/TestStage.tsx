import { useEffect, useMemo, useRef, useState } from 'react';
import { definitionFor, type TestId, type TestMode, type TestResult } from '../../domain/testTypes';
import { buildCompoundSequences, DECISION_SCENARIOS, nextReactionDelay, ruleForTaskSwitch, type Action } from '../../domain/testLogic';

interface TestStageProps {
  testId: TestId;
  mode: TestMode;
  onComplete: (result: TestResult) => void;
  onAbort: () => void;
}

interface RoundProps {
  round: 'practice' | 'main';
  detailed: boolean;
  onDone: (score: number, quality: number, validTrials: number, totalTrials: number, rawTrialCount?: number) => void;
}

const clamp = (value: number): number => Math.min(1, Math.max(0, value));

function TestHeader({ testId, round, onAbort }: { testId: TestId; round: string; onAbort: () => void }) {
  const definition = definitionFor(testId);
  return (
    <div className="test-stage__header">
      <div>
        <p className="eyebrow">{definition.group} / {round}</p>
        <h2>{definition.name}</h2>
      </div>
      <button className="button button--ghost" type="button" onClick={onAbort}>中断する</button>
    </div>
  );
}

function ReactionRound({ round, detailed, onDone }: RoundProps) {
  const total = round === 'practice' ? 3 : detailed ? 12 : 8;
  const [trial, setTrial] = useState(0);
  const [state, setState] = useState<'waiting' | 'ready' | 'finished'>('waiting');
  const [startedAt, setStartedAt] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const timeoutRef = useRef<number | undefined>(undefined);
  const previousDelayRef = useRef<number | null>(null);

  useEffect(() => {
    if (trial >= total) return;
    setState('waiting');
    const delay = nextReactionDelay(Math.random(), previousDelayRef.current);
    previousDelayRef.current = delay;
    timeoutRef.current = window.setTimeout(() => {
      setStartedAt(performance.now());
      setState('ready');
    }, delay);
    return () => { if (timeoutRef.current !== undefined) window.clearTimeout(timeoutRef.current); };
  }, [trial, total]);

  useEffect(() => () => { if (timeoutRef.current !== undefined) window.clearTimeout(timeoutRef.current); }, []);

  const finishTrial = (score: number) => {
    const next = [...scores, clamp(score)];
    setScores(next);
    if (trial + 1 >= total) {
      onDone(next.reduce((sum, value) => sum + value, 0) / next.length, next.length / total, next.length, total, next.length);
    } else {
      setTrial((value) => value + 1);
    }
  };

  const handlePointer = () => {
    if (state === 'waiting') {
      finishTrial(0.1);
      return;
    }
    if (state !== 'ready') return;
    const reactionTime = performance.now() - startedAt;
    finishTrial(1 - Math.max(0, reactionTime - 140) / 900);
  };

  return (
    <div className={`measurement-zone measurement-zone--reaction ${state === 'ready' ? 'is-ready' : ''}`} onPointerDown={handlePointer} role="button" tabIndex={0} aria-label="反応測定領域">
      <div className="measurement-zone__core"><span>{state === 'ready' ? 'CLICK' : '待機中'}</span></div>
      <p>{trial + 1} / {total}　表示が変わったらクリック</p>
    </div>
  );
}

function ClickAccuracyRound({ round, detailed, onDone }: RoundProps) {
  const total = round === 'practice' ? 3 : detailed ? 18 : 12;
  const [trial, setTrial] = useState(0);
  const [target, setTarget] = useState({ x: 50, y: 50, radius: round === 'practice' ? 34 : 24 });
  const [scores, setScores] = useState<number[]>([]);
  const zoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTarget({ x: 16 + Math.random() * 68, y: 16 + Math.random() * 68, radius: round === 'practice' ? 34 : [36, 28, 20][trial % 3] });
  }, [trial, round]);

  const handlePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = zoneRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const targetX = (target.x / 100) * rect.width;
    const targetY = (target.y / 100) * rect.height;
    const distance = Math.sqrt((x - targetX) ** 2 + (y - targetY) ** 2);
    const score = clamp(1 - distance / (target.radius * 2.3));
    const next = [...scores, score];
    setScores(next);
    if (trial + 1 >= total) onDone(next.reduce((sum, value) => sum + value, 0) / next.length, next.filter((value) => value >= 0.35).length / total, next.length, total, next.length);
    else setTrial((value) => value + 1);
  };

  return (
    <div ref={zoneRef} className="measurement-zone measurement-zone--click" onPointerDown={handlePointer} role="application" aria-label="クリック精度測定領域">
      <div className="target" style={{ left: `${target.x}%`, top: `${target.y}%`, width: target.radius * 2, height: target.radius * 2 }}>
        <span className="target__ring target__ring--outer" /><span className="target__ring target__ring--middle" /><span className="target__ring target__ring--inner" />
      </div>
      <p>{trial + 1} / {total}　中心を狙ってクリック</p>
    </div>
  );
}

function CompoundInputRound({ round, detailed, onDone }: RoundProps) {
  const total = round === 'practice' ? 2 : detailed ? 9 : 6;
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [actionIndex, setActionIndex] = useState(0);
  const [errors, setErrors] = useState(0);
  const [completed, setCompleted] = useState(0);
  const sequences = useMemo<Action[][]>(() => buildCompoundSequences(total), [total]);
  const current = sequences[sequenceIndex] ?? sequences[0];

  const accept = (action: Action) => {
    if (action === current[actionIndex]) {
      if (actionIndex + 1 >= current.length) {
        const next = completed + 1;
        setCompleted(next);
        if (sequenceIndex + 1 >= total) onDone(clamp((next * 1.1 - errors * 0.08) / total), clamp(next / total), next, total, next + errors);
        else { setSequenceIndex((value) => value + 1); setActionIndex(0); }
      } else setActionIndex((value) => value + 1);
    } else setErrors((value) => value + 1);
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'q' || event.key.toLowerCase() === 'e') accept(event.key.toLowerCase() as Action);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return (
    <div className="measurement-zone measurement-zone--input" onPointerDown={(event) => { if (event.button === 0) accept('click'); }} onContextMenu={(event) => { event.preventDefault(); accept('rightClick'); }}>
      <div className="sequence-view">{current.map((action, index) => <span key={`${sequenceIndex}-${index}`} className={index < actionIndex ? 'is-done' : index === actionIndex ? 'is-current' : ''}>{action === 'rightClick' ? '右クリック' : action.toUpperCase()}</span>)}</div>
      <div className="input-target">{current[actionIndex] === 'click' || current[actionIndex] === 'rightClick' ? 'TARGET' : current[actionIndex].toUpperCase()}</div>
      <p>シーケンス {sequenceIndex + 1} / {total}　誤入力 {errors}</p>
    </div>
  );
}

function PredictionRound({ round, detailed, onDone }: RoundProps) {
  const total = round === 'practice' ? 2 : detailed ? 12 : 8;
  const [trial, setTrial] = useState(0);
  const [visible, setVisible] = useState(true);
  const [position, setPosition] = useState({ x: 22, y: 38 });
  const [expected, setExpected] = useState({ x: 75, y: 58 });
  const [scores, setScores] = useState<number[]>([]);
  const zoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const start = { x: 18 + Math.random() * 20, y: 25 + Math.random() * 45 };
    const direction = { x: 35 + Math.random() * 25, y: -10 + Math.random() * 30 };
    setPosition(start);
    setExpected({ x: start.x + direction.x, y: start.y + direction.y });
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 850);
    return () => window.clearTimeout(timer);
  }, [trial]);

  const handlePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (visible) return;
    const rect = zoneRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const distance = Math.sqrt((x - expected.x) ** 2 + (y - expected.y) ** 2);
    const score = clamp(1 - distance / 48);
    const next = [...scores, score];
    setScores(next);
    if (trial + 1 >= total) onDone(next.reduce((sum, value) => sum + value, 0) / next.length, next.filter((value) => value > 0.2).length / total, next.length, total, next.length);
    else setTrial((value) => value + 1);
  };

  return (
    <div ref={zoneRef} className="measurement-zone measurement-zone--prediction" onPointerDown={handlePointer} role="application" aria-label="軌道予測測定領域">
      {visible ? <div className="moving-orb" style={{ left: `${position.x}%`, top: `${position.y}%` }} /> : <div className="prediction-reticle" style={{ left: `${expected.x}%`, top: `${expected.y}%` }}>?</div>}
      <p>{trial + 1} / {total}　{visible ? '軌道を見てください' : '到達位置をクリック'}</p>
    </div>
  );
}

function AttentionRound({ round, detailed, onDone }: RoundProps) {
  const duration = round === 'practice' ? 6 : detailed ? 18 : 12;
  const [seconds, setSeconds] = useState(duration);
  const [eventVisible, setEventVisible] = useState(false);
  const [eventHits, setEventHits] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [tracking, setTracking] = useState(0);
  const zoneRef = useRef<HTMLDivElement>(null);
  const [center, setCenter] = useState({ x: 50, y: 50 });
  const completedRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => value - 1), 1000);
    const eventTimer = window.setInterval(() => { setEventVisible(true); setEventCount((value) => value + 1); window.setTimeout(() => setEventVisible(false), 650); }, 1400);
    let frameId = 0;
    const frame = (time: number) => { setCenter({ x: 50 + Math.sin(time / 700) * 18, y: 50 + Math.cos(time / 900) * 16 }); frameId = requestAnimationFrame(frame); };
    frameId = requestAnimationFrame(frame);
    return () => { window.clearInterval(timer); window.clearInterval(eventTimer); window.cancelAnimationFrame(frameId); };
  }, [duration]);

  useEffect(() => {
    if (seconds <= 0 && !completedRef.current) {
      completedRef.current = true;
      onDone(clamp(0.35 + 0.45 * (eventCount === 0 ? 0 : eventHits / eventCount) + 0.2 * tracking / Math.max(1, duration)), clamp((eventHits + 1) / Math.max(2, eventCount + 1)), eventCount, Math.max(1, eventCount), eventCount + 1);
    }
  }, [seconds, eventCount, eventHits, tracking, duration, onDone]);

  const pointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = zoneRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const distance = Math.sqrt((x - center.x) ** 2 + (y - center.y) ** 2);
    if (distance < 16) setTracking((value) => Math.min(duration * 12, value + 1));
  };
  useEffect(() => { const key = (event: KeyboardEvent) => { if (event.code === 'Space' && eventVisible) { event.preventDefault(); setEventHits((value) => value + 1); setEventVisible(false); } }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, [eventVisible]);

  return (
    <div ref={zoneRef} className="measurement-zone measurement-zone--attention" onPointerMove={pointerMove} role="application" aria-label="注意分配測定領域">
      <div className="tracking-orb" style={{ left: `${center.x}%`, top: `${center.y}%` }} />
      {eventVisible && <div className="peripheral-event">✦<span>SPACE</span></div>}
      <p>残り {Math.max(0, seconds)} 秒　中央を追いながら周辺イベントへSpace</p>
    </div>
  );
}

function TaskSwitchRound({ round, detailed, onDone }: RoundProps) {
  const total = round === 'practice' ? 8 : detailed ? 24 : 16;
  const [trial, setTrial] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [target, setTarget] = useState({ color: 'teal' as 'teal' | 'amber' | 'violet', action: 'click' as Action });
  const lastColorRef = useRef<'teal' | 'amber' | 'violet' | null>(null);
  const ruleChanged = trial >= Math.floor(total / 2);
  const rule = ruleForTaskSwitch(trial, total);
  useEffect(() => { const colors = ['teal', 'amber', 'violet'] as const; let index = Math.floor(Math.random() * colors.length); if (lastColorRef.current === colors[index]) index = (index + 1) % colors.length; const color = colors[index]; lastColorRef.current = color; setTarget({ color, action: ruleForTaskSwitch(trial, total).actions[color] }); }, [trial, ruleChanged, total]);
  const respond = (action: Action) => { const nextCorrect = correct + (action === target.action ? 1 : 0); if (trial + 1 >= total) onDone(nextCorrect / total, nextCorrect / total, nextCorrect, total, total); else { setCorrect(nextCorrect); setTrial((value) => value + 1); } };
  useEffect(() => { const handler = (event: KeyboardEvent) => { if (event.key.toLowerCase() === 'q' || event.key.toLowerCase() === 'e') respond(event.key.toLowerCase() as Action); }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); });
  const ruleText = `青緑=${rule.labels.teal} / 黄=${rule.labels.amber} / 紫=${rule.labels.violet}`;
  return <div className="measurement-zone measurement-zone--switch" onPointerDown={(event) => event.button === 0 && respond('click')} onContextMenu={(event) => { event.preventDefault(); respond('rightClick'); }} role="application" aria-label={`タスク切替ターゲット ${rule.labels[target.color]}`}><div className={`switch-target switch-target--${target.color}`} />{ruleChanged && trial === Math.floor(total / 2) && <strong className="switch-rule-change" aria-live="polite">ルール変更！</strong>}<p>{trial + 1} / {total}　{ruleChanged ? 'ルール変更後' : '基本ルール'}　{ruleText}　{trial + 1 === total ? '最後の入力で完了' : ''}</p></div>;
}

function DecisionRound({ round, detailed, onDone }: RoundProps) {
  const total = round === 'practice' ? 3 : detailed ? 12 : 8;
  const [question, setQuestion] = useState(0);
  const [correct, setCorrect] = useState(0);
  const scenario = DECISION_SCENARIOS[question % DECISION_SCENARIOS.length];
  const options = useMemo(() => scenario.options, [scenario]);
  const choose = (isCorrect: boolean) => { const next = correct + (isCorrect ? 1 : 0); if (question + 1 >= total) onDone(next / total, next / total, next, total, total); else { setCorrect(next); setQuestion((value) => value + 1); } };
  return <div className="decision-panel"><p className="decision-panel__timer">状況 {question + 1} / {total}</p><h3>{scenario.prompt}</h3><div className="decision-options">{options.map((option) => <button className="decision-option" type="button" key={option.title} onClick={() => choose(option.correct)}><strong>{option.title}</strong><span>{option.detail}</span></button>)}</div></div>;
}

function MentalRound({ round, detailed, onDone }: RoundProps) {
  const phases = ['通常', 'プレッシャー', '回復'] as const;
  const [phase, setPhase] = useState(0);
  const [trial, setTrial] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const totalPerPhase = round === 'practice' ? 2 : detailed ? 5 : 4;
  const [target, setTarget] = useState({ x: 50, y: 50 });
  useEffect(() => setTarget({ x: 20 + Math.random() * 60, y: 20 + Math.random() * 60 }), [phase, trial]);
  const pointer = (event: React.PointerEvent<HTMLDivElement>) => { const rect = event.currentTarget.getBoundingClientRect(); const x = ((event.clientX - rect.left) / rect.width) * 100; const y = ((event.clientY - rect.top) / rect.height) * 100; const score = clamp(1 - Math.sqrt((x - target.x) ** 2 + (y - target.y) ** 2) / 44); const nextScores = [...scores, score]; if (trial + 1 >= totalPerPhase) { if (phase + 1 >= phases.length) onDone(nextScores.reduce((sum, value) => sum + value, 0) / nextScores.length, nextScores.filter((value) => value > 0.3).length / nextScores.length, nextScores.length, totalPerPhase * phases.length, nextScores.length); else { setScores(nextScores); setPhase((value) => value + 1); setTrial(0); } } else { setScores(nextScores); setTrial((value) => value + 1); } };
  return <div className={`measurement-zone measurement-zone--mental measurement-zone--${phase}`} onPointerDown={pointer}><div className="target target--mental" style={{ left: `${target.x}%`, top: `${target.y}%` }}><span /></div><p>{phases[phase]}フェーズ　{trial + 1} / {totalPerPhase}</p></div>;
}

function RoundView({ testId, round, detailed, onDone }: { testId: TestId; round: 'practice' | 'main'; detailed: boolean; onDone: RoundProps['onDone'] }) {
  if (testId === 'reaction') return <ReactionRound round={round} detailed={detailed} onDone={onDone} />;
  if (testId === 'clickAccuracy') return <ClickAccuracyRound round={round} detailed={detailed} onDone={onDone} />;
  if (testId === 'inputControl') return <CompoundInputRound round={round} detailed={detailed} onDone={onDone} />;
  if (testId === 'prediction') return <PredictionRound round={round} detailed={detailed} onDone={onDone} />;
  if (testId === 'attentionDistribution') return <AttentionRound round={round} detailed={detailed} onDone={onDone} />;
  if (testId === 'taskSwitching') return <TaskSwitchRound round={round} detailed={detailed} onDone={onDone} />;
  if (testId === 'decision') return <DecisionRound round={round} detailed={detailed} onDone={onDone} />;
  return <MentalRound round={round} detailed={detailed} onDone={onDone} />;
}

export function TestStage({ testId, mode, onComplete, onAbort }: TestStageProps) {
  const definition = definitionFor(testId);
  const [intro, setIntro] = useState(true);
  const [round, setRound] = useState<'practice' | 'main'>(mode === 'retest' ? 'main' : 'practice');
  const [roundReady, setRoundReady] = useState(true);
  const detailed = mode === 'detailed';
  const handleDone = (score: number, quality: number, validTrials: number, totalTrials: number, rawTrialCount = totalTrials) => {
    if (round === 'practice' && mode !== 'retest') {
      setRound('main');
      setRoundReady(false);
      return;
    }
    onComplete({ testId, score, quality, abilityKeys: testId === 'reaction' ? ['reaction'] : testId === 'clickAccuracy' ? ['clickAccuracy'] : testId === 'inputControl' ? ['inputControl'] : testId === 'prediction' ? ['prediction'] : testId === 'attentionDistribution' ? ['attentionDistribution'] : testId === 'taskSwitching' ? ['taskSwitching'] : testId === 'decision' ? ['decisionSpeed', 'decisionQuality'] : ['pressureStability', 'recovery'], validTrials, totalTrials, completed: true, rawTrialCount });
  };
  if (intro) return <section className="screen screen--test-intro"><TestHeader testId={testId} round="説明" onAbort={onAbort} /><div className="test-explainer"><div className="test-explainer__number">{definition.group}</div><h3>{definition.description}</h3><p>{definition.operation}</p>{testId === 'prediction' && <ol className="test-guide"><li><strong>観察</strong><span>動く対象を目で追います。</span></li><li><strong>消失</strong><span>対象が消え、?が表示されます。</span></li><li><strong>予測</strong><span>到着すると考えた位置をクリックします。</span></li></ol>}{testId === 'attentionDistribution' && <ol className="test-guide"><li><strong>中央</strong><span>動く円の位置へポインターを合わせ続けます。</span></li><li><strong>周辺</strong><span>周辺にSPACEが出たら見逃さないようにします。</span></li><li><strong>反応</strong><span>SPACEキーを押して周辺イベントに反応します。</span></li></ol>}{testId === 'taskSwitching' && <ol className="test-guide"><li><strong>色を見る</strong><span>ターゲットの色を確認します。</span></li><li><strong>対応を選ぶ</strong><span>画面下の最新ルールを読みます。</span></li><li><strong>切替</strong><span>ルール変更後は対応表が変わります。</span></li></ol>}{testId === 'mentalStability' && <div className="notice notice--amber">このテストでは軽いプレッシャー演出が入ります。いつでも中断できます。終了後に演出の目的を説明します。</div>}<button className="button button--primary" type="button" onClick={() => setIntro(false)}>{mode === 'retest' ? '再テストを始める' : '練習を始める'} <span>→</span></button></div></section>;
  return <section className="screen screen--test"><TestHeader testId={testId} round={round === 'practice' ? '練習' : detailed ? '詳細本番' : mode === 'retest' ? '再テスト' : '本番'} onAbort={onAbort} /><div className="test-stage__body">{!roundReady ? <div className="round-transition"><span className="status-dot status-dot--good" /><h3>練習が終わりました</h3><p>ここからの本番ラウンドが、適性計算へ反映されます。</p><button className="button button--primary" type="button" onClick={() => setRoundReady(true)}>本番を開始する →</button></div> : <RoundView key={`${testId}-${mode}-${round}`} testId={testId} round={round} detailed={detailed} onDone={handleDone} />}</div></section>;
}
