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
    localStorage.clear();
    sessionStorage.clear();
    vi.unstubAllGlobals();
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

  it('describes the raw-input boundary and restores a saved-result deletion path after reload', async () => {
    localStorage.setItem('lol-skill-lab:delete-record', JSON.stringify({ resultId: 'result_saved', deleteToken: 'token_saved_123456789012345' }));
    const fetcher = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetcher);
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => { root.render(<App />); });

    expect(container.textContent).toContain('生ログ送信');
    expect(container.textContent).not.toContain('外部送信');
    expect(container.textContent).toContain('保存済みの診断結果があります');
    act(() => { buttonByText(container, '保存結果を削除').click(); });
    await act(async () => undefined);
    expect(fetcher).toHaveBeenCalledWith('/api/diagnosis-results/result_saved', expect.objectContaining({ method: 'DELETE' }));
    expect(localStorage.getItem('lol-skill-lab:delete-record')).toBeNull();

    act(() => { root.unmount(); });
  });

  it('does not offer a saved-result action after the local retention marker expires', () => {
    localStorage.setItem('lol-skill-lab:delete-record', JSON.stringify({ resultId: 'expired_result', deleteToken: 'expired_token_123456789012345', expiresAt: '2020-01-01T00:00:00.000Z' }));
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => { root.render(<App />); });

    expect(container.textContent).not.toContain('保存済みの診断結果があります');
    expect(localStorage.getItem('lol-skill-lab:delete-record')).toBeNull();

    act(() => { root.unmount(); });
  });
});
