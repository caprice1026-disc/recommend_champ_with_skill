export interface TestConfiguration {
  schemaVersion: string;
  quick: {
    reaction: { practiceTrials: number; mainTrials: number };
    clickAccuracy: { practiceTrials: number; mainTrials: number };
    inputControl: { practiceSequences: number; mainSequences: number };
    prediction: { practiceTrials: number; mainTrials: number };
    attentionDistribution: { practiceSeconds: number; mainSeconds: number };
    taskSwitching: { practiceTrials: number; mainTrials: number };
    decision: { mainQuestions: number; maxSecondsPerQuestion: number };
    mentalStability: { practiceSeconds: number; normalSeconds: number; stressSeconds: number; recoverySeconds: number };
  };
  detailedAdditions: {
    reaction: number;
    clickAccuracy: number;
    inputControl: number;
    prediction: number;
    attentionDistribution: number;
    taskSwitching: number;
    decision: number;
    mentalStability: { recoverySeconds: number };
  };
}

export const DEFAULT_TEST_CONFIGURATION: TestConfiguration = {
  schemaVersion: '1.0.0',
  quick: {
    reaction: { practiceTrials: 3, mainTrials: 8 },
    clickAccuracy: { practiceTrials: 3, mainTrials: 12 },
    inputControl: { practiceSequences: 2, mainSequences: 6 },
    prediction: { practiceTrials: 2, mainTrials: 8 },
    attentionDistribution: { practiceSeconds: 10, mainSeconds: 35 },
    taskSwitching: { practiceTrials: 8, mainTrials: 16 },
    decision: { mainQuestions: 8, maxSecondsPerQuestion: 4 },
    mentalStability: { practiceSeconds: 3, normalSeconds: 15, stressSeconds: 20, recoverySeconds: 15 },
  },
  detailedAdditions: {
    reaction: 12,
    clickAccuracy: 18,
    inputControl: 9,
    prediction: 12,
    attentionDistribution: 60,
    taskSwitching: 36,
    decision: 12,
    mentalStability: { recoverySeconds: 10 },
  },
};

export interface RuntimeConfigSnapshot {
  manifest: Record<string, string>;
  tests: TestConfiguration;
  source: 'api' | 'fallback';
}
