export interface FeedbackSubmissionInput {
  diagnosisVersion: string;
  satisfaction: 'satisfied' | 'partial' | 'disagree';
  comment: string;
}

export class FeedbackSubmissionError extends Error {
  constructor(public readonly code: string, message: string, public readonly status: number) {
    super(message);
    this.name = 'FeedbackSubmissionError';
  }
}

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export async function submitFeedback(input: FeedbackSubmissionInput, fetcher: FetchLike = fetch): Promise<void> {
  const response = await fetcher('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      diagnosisVersion: input.diagnosisVersion,
      satisfaction: input.satisfaction,
      selfReportedStrongChampions: [],
      frequentlyPlayedChampions: [],
      comment: input.comment,
    }),
  });
  if (response.ok) return;
  let body: unknown;
  try { body = await response.json(); } catch { body = undefined; }
  const error = body && typeof body === 'object' && !Array.isArray(body) && 'error' in body ? body.error : undefined;
  const record = error && typeof error === 'object' && !Array.isArray(error) ? error as Record<string, unknown> : {};
  throw new FeedbackSubmissionError(
    typeof record.code === 'string' ? record.code : 'FEEDBACK_SUBMIT_FAILED',
    typeof record.message === 'string' ? record.message : 'フィードバックを送信できませんでした',
    response.status,
  );
}
