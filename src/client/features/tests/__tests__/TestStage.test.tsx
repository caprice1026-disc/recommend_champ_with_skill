import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_TEST_CONFIGURATION } from '../../../data/runtimeConfig';
import { TestStage } from '../TestStage';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('TestStage', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('lets the three mental practice phases advance to completion', async () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const onComplete = vi.fn();

    act(() => {
      root.render(
        <TestStage
          testId="mentalStability"
          mode="quick"
          configuration={DEFAULT_TEST_CONFIGURATION}
          onComplete={onComplete}
          onAbort={() => undefined}
        />,
      );
    });

    const practiceButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('練習を始める'));
    expect(practiceButton).toBeDefined();
    act(() => { practiceButton?.click(); });
    for (let phase = 0; phase < 3; phase += 1) {
      await act(async () => { vi.advanceTimersByTime(3_500); });
    }

    const mainButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('本番を開始する'));
    expect(mainButton).toBeDefined();
    act(() => { mainButton?.click(); });
    for (const duration of [15_500, 20_500, 15_500]) {
      await act(async () => { vi.advanceTimersByTime(duration); });
    }

    expect(onComplete).toHaveBeenCalledTimes(1);
    act(() => { root.unmount(); });
  });
});
