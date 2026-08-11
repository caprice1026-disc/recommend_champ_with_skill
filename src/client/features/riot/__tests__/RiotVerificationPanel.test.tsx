import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RiotVerificationPanel } from '../RiotVerificationPanel';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('RiotVerificationPanel', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  it('does not call Riot until the separate consent is checked', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);

    act(() => { root.render(<RiotVerificationPanel context={null} onVerified={() => undefined} />); });
    const button = Array.from(container.querySelectorAll('button')).find((item) => item.textContent?.includes('Riot IDを確認する'));
    expect(button?.hasAttribute('disabled')).toBe(true);
    act(() => { button?.click(); });
    expect(fetcher).not.toHaveBeenCalled();
    act(() => { root.unmount(); });
  });

  it('shows a verified public context after consented verification', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ verified: true, platformRegion: 'asia', fetchedAt: '2026-08-12T00:00:00.000Z', puuid: 'private-puuid' }), { status: 200 }));
    vi.stubGlobal('fetch', fetcher);
    const onVerified = vi.fn();

    act(() => { root.render(<RiotVerificationPanel context={null} onVerified={onVerified} />); });
    const gameName = container.querySelector<HTMLInputElement>('#riot-game-name');
    const tagLine = container.querySelector<HTMLInputElement>('#riot-tag-line');
    const consent = container.querySelector<HTMLInputElement>('#riot-consent');
    expect(gameName).not.toBeNull();
    expect(consent?.classList.contains('visually-hidden-control')).toBe(true);
    act(() => {
      if (gameName && tagLine) {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
        setter?.call(gameName, 'Hodaka');
        gameName.dispatchEvent(new Event('input', { bubbles: true }));
        setter?.call(tagLine, 'JP1');
        tagLine.dispatchEvent(new Event('input', { bubbles: true }));
      }
      consent?.click();
    });
    const button = Array.from(container.querySelectorAll('button')).find((item) => item.textContent?.includes('Riot IDを確認する'));
    expect(button?.hasAttribute('disabled')).toBe(false);
    await act(async () => { button?.click(); });
    expect(onVerified).toHaveBeenCalledWith({ verified: true, platformRegion: 'asia', fetchedAt: '2026-08-12T00:00:00.000Z' });
    expect(container.textContent).toContain('Riot IDを確認しました');
    act(() => { root.unmount(); });
  });
});
