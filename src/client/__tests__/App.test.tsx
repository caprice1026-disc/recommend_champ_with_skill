import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function buttonByText(container: HTMLElement, text: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll('button')).find((item) => item.textContent?.includes(text));
  if (!(button instanceof HTMLButtonElement)) throw new Error(`button not found: ${text}`);
  return button;
}

async function navigateToConsent(container: HTMLElement) {
  act(() => { buttonByText(container, '診断をはじめる').click(); });
  await act(async () => { vi.advanceTimersByTime(700); });
  act(() => { buttonByText(container, 'プロフィールを設定する').click(); });
  act(() => { buttonByText(container, 'プレイの好みへ進む').click(); });
  act(() => { buttonByText(container, 'すべてスキップして進む').click(); });
}

describe('App diagnostic session boundary', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('requires fresh save consent after returning home and starting again', async () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => { root.render(<App />); });

    await navigateToConsent(container);
    const saveConsent = container.querySelector<HTMLInputElement>('.consent-card input');
    expect(saveConsent).not.toBeNull();
    act(() => { saveConsent?.click(); });
    expect(saveConsent?.checked).toBe(true);

    act(() => { container.querySelector<HTMLButtonElement>('button[aria-label="LoLスキルラボ ホーム"]')?.click(); });
    await navigateToConsent(container);
    const newSaveConsent = container.querySelector<HTMLInputElement>('.consent-card input');
    expect(newSaveConsent?.checked).toBe(false);

    act(() => { root.unmount(); });
  });
});
