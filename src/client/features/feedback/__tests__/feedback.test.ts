import { describe, expect, it, vi } from 'vitest';
import { FeedbackSubmissionError, submitFeedback } from '../feedback';

describe('feedback submission', () => {
  it('throws a user-facing error when the API returns a non-2xx response', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ error: { code: 'DATABASE_UNAVAILABLE', message: '保存機能は現在利用できません' } }), { status: 503 }));

    await expect(submitFeedback({ diagnosisVersion: '1.0.0', satisfaction: 'partial', comment: '' }, fetcher)).rejects.toMatchObject({
      code: 'DATABASE_UNAVAILABLE',
      status: 503,
      message: '保存機能は現在利用できません',
    });
  });

  it('resolves only after the feedback API confirms success', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ received: true }), { status: 201 }));

    await expect(submitFeedback({ diagnosisVersion: '1.0.0', satisfaction: 'satisfied', comment: 'よかった' }, fetcher)).resolves.toBeUndefined();
    expect(fetcher).toHaveBeenCalledWith('/api/feedback', expect.objectContaining({ method: 'POST' }));
  });
});
