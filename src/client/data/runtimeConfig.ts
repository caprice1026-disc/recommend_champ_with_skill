import manifestJson from '../../../data/config/v1/manifest.json';
import testConfigurationJson from '../../../data/config/v1/test_definitions.json';

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

export const DEFAULT_TEST_CONFIGURATION: TestConfiguration = testConfigurationJson as TestConfiguration;
export const STATIC_MANIFEST: Record<string, unknown> = manifestJson;

export interface RuntimeConfigSnapshot {
  manifest: Record<string, unknown>;
  tests: TestConfiguration;
  source: 'static';
}
