import { useEffect, useMemo, useRef, useState } from 'react';
import { definitionFor, type TestId, type TestMode, type TestResult, type TestMetrics } from '../../../domain/testTypes';
import { buildCompoundSequences, buildDecisionScenarioOrder, countValidTrials, DECISION_SCENARIOS, interpolatePredictionPosition, nextReactionDelay, predictionTrailPoints, ruleForTaskSwitch, scoreDecisionAnswers, trackingRetention, upsertDecisionResponseTime, type Action, type PredictionPoint, type TrackingSample } from '../../../domain/testLogic';
import type { TestConfiguration } from '../../data/runtimeConfig';

interface TestStageProps {
  testId: TestId;
  mode: TestMode;
  configuration: TestConfiguration;
  onComplete: (result: TestResult) => void;
  onAbort: () => void;
}

interface RoundProps {
  round: 'practice' | 'main';
  detailed: boolean;
  configuration: TestConfiguration;
  onDone: (score: number, quality: number, validTrials: number, totalTrials: number, rawTrialCount?: number, metrics?: TestMetrics) => void;
}

const clamp = (value: number): number => Math.min(1, Math.max(0, value));
const mean = (values: number[]): number => values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
const standardDeviation = (values: number[]): number => {
  if (values.length < 2) return 0;
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
};

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

function ReactionRound({ round, detailed, configuration, onDone }: RoundProps) {
  const total = round === 'practice' ? configuration.quick.reaction.practiceTrials : detailed ? configuration.detailedAdditions.reaction : configuration.quick.reaction.mainTrials;
  const [trial, setTrial] = useState(0);
  const [state, setState] = useState<'waiting' | 'ready' | 'finished'>('waiting');
  const [startedAt, setStartedAt] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const timeoutRef = useRef<number | undefined>(undefined);
  const previousDelayRef = useRef<number | null>(null);
  const responseTimesRef = useRef<number[]>([]);
  const falseStartsRef = useRef(0);

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

  const finishTrial = (score: number, responseTime?: number) => {
    if (responseTime !== undefined) responseTimesRef.current = [...responseTimesRef.current, responseTime];
    const next = [...scores, clamp(score)];
    setScores(next);
    if (trial + 1 >= total) {
      setState('finished');
      const validTrials = countValidTrials(next, 0.35);
      const responseTimesMs = responseTimesRef.current;
      onDone(
        mean(next),
        validTrials / total,
        validTrials,
        total,
        next.length,
        {
          reaction: { responseTimesMs, falseStarts: falseStartsRef.current },
          dispersionScore: clamp(1 - standardDeviation(responseTimesMs) / 600),
          inputStabilityScore: clamp(1 - falseStartsRef.current / Math.max(1, total)),
        },
      );
    } else {
      setTrial((value) => value + 1);
    }
  };

  const handlePointer = () => {
    if (state === 'waiting') {
      falseStartsRef.current += 1;
      finishTrial(0.1);
      return;
    }
    if (state !== 'ready') return;
    const reactionTime = performance.now() - startedAt;
    finishTrial(1 - Math.max(0, reactionTime - 140) / 900, reactionTime);
  };

  return (
    <div className={`measurement-zone measurement-zone--reaction ${state === 'ready' ? 'is-ready' : ''}`} onPointerDown={handlePointer} role="button" tabIndex={0} aria-label="反応測定領域">
      <div className="measurement-zone__core"><span>{state === 'ready' ? 'CLICK' : '待機中'}</span></div>
      <p>{Math.min(trial + 1, total)} / {total}　表示が変わったらクリック</p>
    </div>
  );
}

function ClickAccuracyRound({ round, detailed, configuration, onDone }: RoundProps) {
  const total = round === 'practice' ? configuration.quick.clickAccuracy.practiceTrials : detailed ? configuration.detailedAdditions.clickAccuracy : configuration.quick.clickAccuracy.mainTrials;
  const [trial, setTrial] = useState(0);
  const [target, setTarget] = useState({ x: 50, y: 50, radius: round === 'practice' ? 34 : 24 });
  const [scores, setScores] = useState<number[]>([]);
  const zoneRef = useRef<HTMLDivElement>(null);
  const samplesRef = useRef<Array<{ distance: number; radius: number; score: number; targetDistance: number }>>([]);

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
    samplesRef.current = [...samplesRef.current, { distance, radius: target.radius, score, targetDistance: Math.sqrt((target.x - 50) ** 2 + (target.y - 50) ** 2) }];
    const next = [...scores, score];
    setScores(next);
    if (trial + 1 >= total) {
      const validTrials = countValidTrials(next, 0.35);
      const samples = samplesRef.current;
      const hitRate = mean(samples.map((sample) => sample.distance <= sample.radius ? 1 : 0));
      const centerAccuracy = mean(samples.map((sample) => clamp(1 - sample.distance / Math.max(1, sample.radius))));
      const smallSamples = samples.filter((sample) => sample.radius <= 20);
      const longSamples = samples.filter((sample) => sample.targetDistance >= 28);
      const continuousAccuracy = samples.length < 2 ? hitRate : mean(samples.slice(1).map((sample, index) => sample.score >= samples[index].score * 0.5 ? 1 : 0));
      onDone(mean(next), validTrials / total, validTrials, total, next.length, {
        click: {
          hitRate,
          centerAccuracy,
          smallTargetAccuracy: smallSamples.length === 0 ? centerAccuracy : mean(smallSamples.map((sample) => sample.distance <= sample.radius ? 1 : 0)),
          longDistanceAccuracy: longSamples.length === 0 ? hitRate : mean(longSamples.map((sample) => sample.distance <= sample.radius ? 1 : 0)),
          movingTargetAccuracy: hitRate,
          continuousAccuracy,
        },
        dispersionScore: clamp(1 - standardDeviation(next)),
        inputStabilityScore: hitRate,
      });
    } else setTrial((value) => value + 1);
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

function CompoundInputRound({ round, detailed, configuration, onDone }: RoundProps) {
  const total = round === 'practice' ? configuration.quick.inputControl.practiceSequences : detailed ? configuration.detailedAdditions.inputControl : configuration.quick.inputControl.mainSequences;
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [actionIndex, setActionIndex] = useState(0);
  const [errors, setErrors] = useState(0);
  const [completed, setCompleted] = useState(0);
  const sequences = useMemo<Action[][]>(() => buildCompoundSequences(total), [total]);
  const current = sequences[sequenceIndex] ?? sequences[0];
  const errorsRef = useRef(0);
  const completedRef = useRef(0);
  const mouseExpectedRef = useRef(0);
  const mouseCorrectRef = useRef(0);
  const keyboardExpectedRef = useRef(0);
  const keyboardCorrectRef = useRef(0);
  const sequenceDurationsRef = useRef<number[]>([]);
  const sequenceStartedAtRef = useRef(performance.now());

  useEffect(() => { sequenceStartedAtRef.current = performance.now(); }, [sequenceIndex]);

  const finish = (nextCompleted: number) => {
    const rawTrialCount = nextCompleted + errorsRef.current;
    const mouseControl = mouseExpectedRef.current === 0 ? 0 : mouseCorrectRef.current / mouseExpectedRef.current;
    const keyboardControl = keyboardExpectedRef.current === 0 ? 0 : keyboardCorrectRef.current / keyboardExpectedRef.current;
    const durations = sequenceDurationsRef.current;
    const rhythmStability = durations.length < 2 ? 1 : clamp(1 - standardDeviation(durations) / Math.max(1, mean(durations)));
    onDone(
      clamp((nextCompleted / total) * 0.75 + mouseControl * 0.1 + keyboardControl * 0.1 + rhythmStability * 0.05 - errorsRef.current / Math.max(1, rawTrialCount) * 0.2),
      clamp(nextCompleted / total),
      nextCompleted,
      total,
      rawTrialCount,
      {
        input: {
          mouseSequenceControl: mouseControl,
          keyboardSequenceControl: keyboardControl,
          mouseKeyboardCoordination: nextCompleted / total,
          rhythmStability,
          misinputSuppression: clamp(1 - errorsRef.current / Math.max(1, rawTrialCount)),
        },
        dispersionScore: rhythmStability,
        inputStabilityScore: clamp(1 - errorsRef.current / Math.max(1, rawTrialCount)),
      },
    );
  };

  const accept = (action: Action) => {
    const expected = current[actionIndex];
    if (action === 'q' || action === 'e') {
      keyboardExpectedRef.current += 1;
      if (action === expected) keyboardCorrectRef.current += 1;
    } else {
      mouseExpectedRef.current += 1;
      if (action === expected) mouseCorrectRef.current += 1;
    }
    if (action === expected) {
      if (actionIndex + 1 >= current.length) {
        const next = completedRef.current + 1;
        completedRef.current = next;
        setCompleted(next);
        sequenceDurationsRef.current = [...sequenceDurationsRef.current, performance.now() - sequenceStartedAtRef.current];
        if (sequenceIndex + 1 >= total) finish(next);
        else { setSequenceIndex((value) => value + 1); setActionIndex(0); }
      } else setActionIndex((value) => value + 1);
    } else {
      errorsRef.current += 1;
      setErrors(errorsRef.current);
    }
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
      <p>シーケンス {sequenceIndex + 1} / {total}　完了 {completed}　誤入力 {errors}</p>
    </div>
  );
}

function PredictionRound({ round, detailed, configuration, onDone }: RoundProps) {
  const moveDuration = 1400;
  const total = round === 'practice' ? configuration.quick.prediction.practiceTrials : detailed ? configuration.detailedAdditions.prediction : configuration.quick.prediction.mainTrials;
  const [trial, setTrial] = useState(0);
  const [visible, setVisible] = useState(true);
  const [start, setStart] = useState<PredictionPoint>({ x: 22, y: 38 });
  const [position, setPosition] = useState({ x: 22, y: 38 });
  const [expected, setExpected] = useState({ x: 75, y: 58 });
  const [progress, setProgress] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const zoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const startPoint = { x: 18 + Math.random() * 20, y: 25 + Math.random() * 45 };
    const direction = { x: 35 + Math.random() * 25, y: -10 + Math.random() * 30 };
    const expectedPoint = { x: startPoint.x + direction.x, y: startPoint.y + direction.y };
    setStart(startPoint);
    setPosition(startPoint);
    setExpected(expectedPoint);
    setProgress(0);
    setVisible(true);
    let frameId: number | undefined;
    const startedAt = performance.now();
    const animate = (now: number) => {
      const nextProgress = Math.min(1, (now - startedAt) / moveDuration);
      setPosition(interpolatePredictionPosition(startPoint, expectedPoint, nextProgress));
      setProgress(nextProgress);
      if (nextProgress >= 1) { setVisible(false); return; }
      frameId = window.requestAnimationFrame(animate);
    };
    frameId = window.requestAnimationFrame(animate);
    return () => { if (frameId !== undefined) window.cancelAnimationFrame(frameId); };
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
    if (trial + 1 >= total) {
      const validTrials = countValidTrials(next, 0.2);
      onDone(mean(next), validTrials / total, validTrials, total, next.length);
    } else setTrial((value) => value + 1);
  };

  return (
    <div ref={zoneRef} className="measurement-zone measurement-zone--prediction" onPointerDown={handlePointer} role="application" aria-label="軌道予測測定領域">
      {visible && <><svg className="prediction-trail" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polyline points={predictionTrailPoints(start, position, 8).map((point) => `${point.x},${point.y}`).join(' ')} />
        {predictionTrailPoints(start, position, 6).map((point, index) => <circle key={`${trial}-${index}`} cx={point.x} cy={point.y} r={index === 5 ? 1.6 : 1.1} opacity={(index + 1) / 6} />)}
      </svg><div className="moving-orb" style={{ left: `${position.x}%`, top: `${position.y}%` }} /></>}
      <p>{trial + 1} / {total}　{visible ? `軌道を観察中 ${Math.round(progress * 100)}%` : '消失しました。到達位置をクリック'}</p>
    </div>
  );
}

function AttentionRound({ round, detailed, configuration, onDone }: RoundProps) {
  const duration = round === 'practice' ? configuration.quick.attentionDistribution.practiceSeconds : detailed ? configuration.detailedAdditions.attentionDistribution : configuration.quick.attentionDistribution.mainSeconds;
  const [seconds, setSeconds] = useState(duration);
  const [eventVisible, setEventVisible] = useState(false);
  const [eventHits, setEventHits] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const zoneRef = useRef<HTMLDivElement>(null);
  const [center, setCenter] = useState({ x: 50, y: 50 });
  const centerRef = useRef(center);
  const pointerRef = useRef({ x: 50, y: 50 });
  const samplesRef = useRef<TrackingSample[]>([]);
  const eventHitsRef = useRef(0);
  const eventCountRef = useRef(0);
  const eventPendingRef = useRef(false);
  const completedRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    let eventTimer: number | undefined;
    let frameId = 0;
    let lastSampleAt = 0;
    const scheduleEvent = () => {
      eventTimer = window.setTimeout(() => {
        eventPendingRef.current = true;
        setEventVisible(true);
        eventCountRef.current += 1;
        setEventCount(eventCountRef.current);
        window.setTimeout(() => { if (eventPendingRef.current) { eventPendingRef.current = false; setEventVisible(false); } }, 500 + Math.random() * 550);
        scheduleEvent();
      }, 800 + Math.random() * 1800);
    };
    scheduleEvent();
    const frame = (time: number) => {
      const nextCenter = { x: 50 + Math.sin(time / 700) * 18, y: 50 + Math.cos(time / 900) * 16 };
      centerRef.current = nextCenter;
      setCenter(nextCenter);
      if (time - lastSampleAt >= 100) {
        const pointer = pointerRef.current;
        samplesRef.current = [...samplesRef.current, { atMs: time, distance: Math.sqrt((pointer.x - nextCenter.x) ** 2 + (pointer.y - nextCenter.y) ** 2) }];
        lastSampleAt = time;
      }
      frameId = requestAnimationFrame(frame);
    };
    frameId = requestAnimationFrame(frame);
    return () => { window.clearInterval(timer); if (eventTimer !== undefined) window.clearTimeout(eventTimer); window.cancelAnimationFrame(frameId); };
  }, [duration]);

  useEffect(() => {
    if (seconds > 0 || completedRef.current) return;
    completedRef.current = true;
    const retention = trackingRetention(samplesRef.current, 16);
    const peripheralRatio = eventCountRef.current === 0 ? 0 : eventHitsRef.current / eventCountRef.current;
    const distanceValues = samplesRef.current.map((sample) => sample.distance);
    onDoneRef.current(
      clamp(0.55 * retention + 0.45 * peripheralRatio),
      clamp(Math.min(1, samplesRef.current.length / Math.max(1, duration * 8)) * 0.6 + (eventCountRef.current > 0 ? 0.4 : 0)),
      eventHitsRef.current,
      Math.max(1, eventCountRef.current),
      eventCountRef.current + samplesRef.current.length,
      {
        attention: { peripheralEvents: eventCountRef.current, peripheralHits: eventHitsRef.current, trackingRetention: retention, trackingMeanDistance: mean(distanceValues) },
        dispersionScore: retention,
        frameStabilityScore: clamp(samplesRef.current.length / Math.max(1, duration * 8)),
        inputStabilityScore: peripheralRatio,
      },
    );
  }, [seconds, duration]);

  const pointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = zoneRef.current?.getBoundingClientRect();
    if (!rect) return;
    pointerRef.current = { x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 };
  };
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.code === 'Space' && eventPendingRef.current) {
        event.preventDefault();
        eventPendingRef.current = false;
        eventHitsRef.current += 1;
        setEventHits(eventHitsRef.current);
        setEventVisible(false);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  return (
    <div ref={zoneRef} className="measurement-zone measurement-zone--attention" onPointerMove={pointerMove} role="application" aria-label="注意分配測定領域">
      <div className="tracking-orb" style={{ left: `${center.x}%`, top: `${center.y}%` }} />
      {eventVisible && <div className="peripheral-event">✦<span>SPACE</span></div>}
      <p>残り {Math.max(0, seconds)} 秒　中央を追いながら周辺イベントへSpace　検出 {eventHits}/{eventCount}</p>
    </div>
  );
}

function TaskSwitchRound({ round, detailed, configuration, onDone }: RoundProps) {
  const total = round === 'practice' ? configuration.quick.taskSwitching.practiceTrials : detailed ? configuration.detailedAdditions.taskSwitching : configuration.quick.taskSwitching.mainTrials;
  const [trial, setTrial] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [target, setTarget] = useState({ color: 'teal' as 'teal' | 'amber' | 'violet', action: 'click' as Action });
  const lastColorRef = useRef<'teal' | 'amber' | 'violet' | null>(null);
  const correctRef = useRef(0);
  const ruleChanged = trial >= Math.floor(total / 2);
  const rule = ruleForTaskSwitch(trial, total);
  useEffect(() => { const colors = ['teal', 'amber', 'violet'] as const; let index = Math.floor(Math.random() * colors.length); if (lastColorRef.current === colors[index]) index = (index + 1) % colors.length; const color = colors[index]; lastColorRef.current = color; setTarget({ color, action: ruleForTaskSwitch(trial, total).actions[color] }); }, [trial, total]);
  const respond = (action: Action) => { const nextCorrect = correctRef.current + (action === target.action ? 1 : 0); correctRef.current = nextCorrect; setCorrect(nextCorrect); if (trial + 1 >= total) onDone(nextCorrect / total, nextCorrect / total, nextCorrect, total, total); else setTrial((value) => value + 1); };
  useEffect(() => { const handler = (event: KeyboardEvent) => { if (event.key.toLowerCase() === 'q' || event.key.toLowerCase() === 'e') respond(event.key.toLowerCase() as Action); }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); });
  const ruleText = `青緑=${rule.labels.teal} / 黄=${rule.labels.amber} / 紫=${rule.labels.violet}`;
  return <div className="measurement-zone measurement-zone--switch" onPointerDown={(event) => event.button === 0 && respond('click')} onContextMenu={(event) => { event.preventDefault(); respond('rightClick'); }} role="application" aria-label={`タスク切替ターゲット ${rule.labels[target.color]}`}><div className={`switch-target switch-target--${target.color}`} />{ruleChanged && trial === Math.floor(total / 2) && <strong className="switch-rule-change" aria-live="polite">ルール変更！</strong>}<p>{trial + 1} / {total}　{ruleChanged ? 'ルール変更後' : '基本ルール'}　{ruleText}　正解 {correct}</p></div>;
}

function DecisionRound({ round, detailed, configuration, onDone }: RoundProps) {
  const total = round === 'practice' ? 3 : detailed ? configuration.detailedAdditions.decision : configuration.quick.decision.mainQuestions;
  const maxSeconds = configuration.quick.decision.maxSecondsPerQuestion;
  const scenarioOrder = useMemo(() => buildDecisionScenarioOrder(total), [total]);
  const orderedScenarios = useMemo(() => scenarioOrder.map((index) => DECISION_SCENARIOS[index]), [scenarioOrder]);
  const [question, setQuestion] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>(() => Array(total).fill(null));
  const answersRef = useRef<Array<number | null>>(Array(total).fill(null));
  const responseTimesRef = useRef<Array<number | null>>(Array(total).fill(null));
  const answerChangesRef = useRef(0);
  const timeoutsRef = useRef(0);
  const questionStartedAtRef = useRef(performance.now());
  const scenario = orderedScenarios[question] ?? DECISION_SCENARIOS[0];
  const selectedIndex = answers[question] ?? null;

  useEffect(() => { questionStartedAtRef.current = performance.now(); }, [question]);

  const finishDecision = (finalAnswers: Array<number | null>) => {
    const result = scoreDecisionAnswers(orderedScenarios, finalAnswers);
    const responseTimesMs = responseTimesRef.current.filter((value): value is number => value !== null);
    const speedScore = mean(responseTimesMs.map((time) => clamp(1 - time / (maxSeconds * 1000))));
    onDone(result.correct / total, result.answered / total, result.correct, total, total, {
      decision: {
        responseTimesMs,
        correctAnswers: finalAnswers.map((answer, index) => answer !== null && orderedScenarios[index]?.options[answer]?.correct === true),
        answerChanges: answerChangesRef.current,
        timeouts: timeoutsRef.current,
        speedScore,
      },
      dispersionScore: clamp(1 - standardDeviation(responseTimesMs) / Math.max(1, maxSeconds * 1000)),
      inputStabilityScore: clamp(1 - answerChangesRef.current / Math.max(1, total)),
    });
  };

  const advance = (timedOut: boolean) => {
    const elapsed = timedOut ? maxSeconds * 1000 : performance.now() - questionStartedAtRef.current;
    responseTimesRef.current = upsertDecisionResponseTime(responseTimesRef.current, question, elapsed);
    if (timedOut) timeoutsRef.current += 1;
    if (question + 1 >= total) finishDecision([...answersRef.current]);
    else setQuestion((value) => value + 1);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (answersRef.current[question] === null) advance(true);
      else advance(false);
    }, maxSeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [question, maxSeconds]);

  const choose = (optionIndex: number) => {
    if (answersRef.current[question] !== null && answersRef.current[question] !== optionIndex) answerChangesRef.current += 1;
    answersRef.current[question] = optionIndex;
    setAnswers((current) => current.map((answer, index) => index === question ? optionIndex : answer));
  };
  const goNext = () => { if (selectedIndex === null) return; advance(false); };
  return (
    <div className="decision-panel">
      <p className="decision-panel__timer">状況 {question + 1} / {total}　制限 {maxSeconds} 秒　回答済み {answers.filter((answer) => answer !== null).length}</p>
      <h3>{scenario.prompt}</h3>
      <div className="decision-options">
        {scenario.options.map((option, optionIndex) => <button className={`decision-option ${selectedIndex === optionIndex ? 'is-selected' : ''}`} type="button" key={option.title} aria-pressed={selectedIndex === optionIndex} onClick={() => choose(optionIndex)}><strong>{option.title}</strong><span>{option.detail}</span></button>)}
      </div>
      <div className="decision-navigation">
        <button className="button button--ghost" type="button" onClick={() => setQuestion((value) => Math.max(0, value - 1))} disabled={question === 0}>← 前の状況</button>
        <span>{selectedIndex === null ? '選択してください' : '選択済み。前の状況に戻って変更できます'}</span>
        <button className="button button--primary" type="button" onClick={goNext} disabled={selectedIndex === null}>{question + 1 >= total ? '判定を確定' : '次の状況へ →'}</button>
      </div>
    </div>
  );
}

function MentalRound({ round, detailed, configuration, onDone }: RoundProps) {
  const phases = ['通常', 'プレッシャー', '回復'] as const;
  const phaseDurations = useMemo(() => round === 'practice'
    ? [configuration.quick.mentalStability.practiceSeconds, configuration.quick.mentalStability.practiceSeconds, configuration.quick.mentalStability.practiceSeconds]
    : detailed
      ? [configuration.quick.mentalStability.normalSeconds, configuration.quick.mentalStability.stressSeconds, configuration.quick.mentalStability.recoverySeconds + configuration.detailedAdditions.mentalStability.recoverySeconds]
      : [configuration.quick.mentalStability.normalSeconds, configuration.quick.mentalStability.stressSeconds, configuration.quick.mentalStability.recoverySeconds], [
        round,
        detailed,
        configuration.quick.mentalStability.practiceSeconds,
        configuration.quick.mentalStability.normalSeconds,
        configuration.quick.mentalStability.stressSeconds,
        configuration.quick.mentalStability.recoverySeconds,
        configuration.detailedAdditions.mentalStability.recoverySeconds,
      ]);
  const [phase, setPhase] = useState(0);
  const [seconds, setSeconds] = useState(phaseDurations[0]);
  const [phaseScores, setPhaseScores] = useState<number[][]>(() => [[], [], []]);
  const [target, setTarget] = useState({ x: 50, y: 50 });
  const phaseScoresRef = useRef<number[][]>([[], [], []]);
  const completedRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => { setSeconds(phaseDurations[phase]); }, [phase, phaseDurations]);
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);
  useEffect(() => {
    if (seconds > 0 || completedRef.current) return;
    if (phase < phases.length - 1) { setPhase((value) => value + 1); return; }
    completedRef.current = true;
    const [normalScores, pressureScores, recoveryScores] = phaseScoresRef.current;
    const allScores = [...normalScores, ...pressureScores, ...recoveryScores];
    const normalMean = mean(normalScores);
    const pressureMean = mean(pressureScores);
    const recoveryMean = mean(recoveryScores);
    const lowChain = (scores: number[]) => { let current = 0; let longest = 0; for (const score of scores) { current = score < 0.3 ? current + 1 : 0; longest = Math.max(longest, current); } return longest; };
    const recoverySlope = recoveryScores.length < 2 ? recoveryMean : clamp(0.5 + (recoveryScores[recoveryScores.length - 1] - recoveryScores[0]) * 2);
    const validTrials = countValidTrials(allScores, 0.3);
    onDoneRef.current(
      mean(allScores),
      allScores.length === 0 ? 0 : validTrials / allScores.length,
      validTrials,
      Math.max(1, allScores.length),
      allScores.length,
      {
        mental: {
          normalScores,
          pressureScores,
          recoveryScores,
          pressureDegradation: clamp(normalMean - pressureMean),
          recoveryTrialCountScore: normalMean === 0 ? recoveryMean : clamp(recoveryMean / Math.max(0.5, normalMean)),
          recoverySlopeScore: recoverySlope,
          failureChainSuppression: clamp(1 - lowChain(pressureScores) / Math.max(1, pressureScores.length)),
        },
        dispersionScore: clamp(1 - standardDeviation(allScores)),
        inputStabilityScore: allScores.length === 0 ? 0 : validTrials / allScores.length,
      },
    );
  }, [seconds, phase, phases.length]);

  useEffect(() => setTarget({ x: 20 + Math.random() * 60, y: 20 + Math.random() * 60 }), [phase, seconds]);
  const pointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const score = clamp(1 - Math.sqrt((x - target.x) ** 2 + (y - target.y) ** 2) / 44);
    const nextPhaseScores = [...phaseScoresRef.current[phase], score];
    phaseScoresRef.current = phaseScoresRef.current.map((scores, index) => index === phase ? nextPhaseScores : scores);
    setPhaseScores(phaseScoresRef.current);
    setTarget({ x: 20 + Math.random() * 60, y: 20 + Math.random() * 60 });
  };
  return <div className={`measurement-zone measurement-zone--mental measurement-zone--${phase}`} onPointerDown={pointer}><div className="target target--mental" style={{ left: `${target.x}%`, top: `${target.y}%` }}><span /></div><p>{phases[phase]}フェーズ　残り {seconds} 秒　クリック数 {phaseScores[phase].length}</p></div>;
}

function RoundView({ testId, round, detailed, configuration, onDone }: { testId: TestId; round: 'practice' | 'main'; detailed: boolean; configuration: TestConfiguration; onDone: RoundProps['onDone'] }) {
  if (testId === 'reaction') return <ReactionRound round={round} detailed={detailed} configuration={configuration} onDone={onDone} />;
  if (testId === 'clickAccuracy') return <ClickAccuracyRound round={round} detailed={detailed} configuration={configuration} onDone={onDone} />;
  if (testId === 'inputControl') return <CompoundInputRound round={round} detailed={detailed} configuration={configuration} onDone={onDone} />;
  if (testId === 'prediction') return <PredictionRound round={round} detailed={detailed} configuration={configuration} onDone={onDone} />;
  if (testId === 'attentionDistribution') return <AttentionRound round={round} detailed={detailed} configuration={configuration} onDone={onDone} />;
  if (testId === 'taskSwitching') return <TaskSwitchRound round={round} detailed={detailed} configuration={configuration} onDone={onDone} />;
  if (testId === 'decision') return <DecisionRound round={round} detailed={detailed} configuration={configuration} onDone={onDone} />;
  return <MentalRound round={round} detailed={detailed} configuration={configuration} onDone={onDone} />;
}

export function TestStage({ testId, mode, configuration, onComplete, onAbort }: TestStageProps) {
  const definition = definitionFor(testId);
  const [intro, setIntro] = useState(true);
  const [round, setRound] = useState<'practice' | 'main'>(mode === 'retest' ? 'main' : 'practice');
  const [roundReady, setRoundReady] = useState(true);
  const detailed = mode === 'detailed';
  const handleDone = (score: number, quality: number, validTrials: number, totalTrials: number, rawTrialCount = totalTrials, metrics?: TestMetrics) => {
    if (round === 'practice' && mode !== 'retest') {
      setRound('main');
      setRoundReady(false);
      return;
    }
    onComplete({ testId, score, quality, abilityKeys: testId === 'reaction' ? ['reaction'] : testId === 'clickAccuracy' ? ['clickAccuracy'] : testId === 'inputControl' ? ['inputControl'] : testId === 'prediction' ? ['prediction'] : testId === 'attentionDistribution' ? ['attentionDistribution'] : testId === 'taskSwitching' ? ['taskSwitching'] : testId === 'decision' ? ['decisionSpeed', 'decisionQuality'] : ['pressureStability', 'recovery'], validTrials, totalTrials, completed: true, rawTrialCount, metrics });
  };
  if (intro) return <section className="screen screen--test-intro"><TestHeader testId={testId} round="説明" onAbort={onAbort} /><div className="test-explainer"><div className="test-explainer__number">{definition.group}</div><h3>{definition.description}</h3><p>{definition.operation}</p>{testId === 'prediction' && <ol className="test-guide"><li><strong>観察</strong><span>動く対象を目で追います。</span></li><li><strong>消失</strong><span>対象が消え、軌道も消えます。</span></li><li><strong>予測</strong><span>到着すると考えた位置をクリックします。正解位置は画面に表示されません。</span></li></ol>}{testId === 'attentionDistribution' && <ol className="test-guide"><li><strong>中央</strong><span>動く円の位置へポインターを合わせ続けます。</span></li><li><strong>周辺</strong><span>周辺にSPACEが出たら見逃さないようにします。</span></li><li><strong>反応</strong><span>SPACEキーを押して周辺イベントに反応します。</span></li></ol>}{testId === 'taskSwitching' && <ol className="test-guide"><li><strong>色を見る</strong><span>ターゲットの色を確認します。</span></li><li><strong>対応を選ぶ</strong><span>画面下の最新ルールを読みます。</span></li><li><strong>切替</strong><span>途中で「ルール変更！」と表示され、対応表が変わります。</span></li></ol>}{testId === 'mentalStability' && <div className="notice notice--amber">このテストでは通常・プレッシャー・回復の3フェーズを順に測定します。軽い演出が入りますが、いつでも中断できます。</div>}<button className="button button--primary" type="button" onClick={() => setIntro(false)}>{mode === 'retest' ? '再テストを始める' : '練習を始める'} <span>→</span></button></div></section>;
  return <section className="screen screen--test"><TestHeader testId={testId} round={round === 'practice' ? '練習' : detailed ? '詳細本番' : mode === 'retest' ? '再テスト' : '本番'} onAbort={onAbort} /><div className="test-stage__body">{!roundReady ? <div className="round-transition"><span className="status-dot status-dot--good" /><h3>練習が終わりました</h3><p>ここからの本番ラウンドが、適性計算へ反映されます。</p><button className="button button--primary" type="button" onClick={() => setRoundReady(true)}>本番を開始する →</button></div> : <RoundView key={`${testId}-${mode}-${round}`} testId={testId} round={round} detailed={detailed} configuration={configuration} onDone={handleDone} />}</div></section>;
}
