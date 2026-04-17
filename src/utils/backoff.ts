export interface BackoffOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitterFactor?: number;
}

const DEFAULT_OPTIONS: Required<BackoffOptions> = {
  maxAttempts: 5,
  baseDelayMs: 1000,
  maxDelayMs: 30_000,
  jitterFactor: 0.3,
};

export function calcBackoffDelay(
  attempt: number,
  options: BackoffOptions = {},
): number {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const exponential = opts.baseDelayMs * Math.pow(2, attempt);
  const capped = Math.min(exponential, opts.maxDelayMs);
  const jitter = capped * opts.jitterFactor * Math.random();
  return Math.floor(capped + jitter);
}

export async function withBackoff<T>(
  fn: () => Promise<T>,
  options: BackoffOptions = {},
  isRetryable?: (error: unknown) => { retry: boolean; retryAfterMs?: number },
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  let lastError: unknown;

  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt >= opts.maxAttempts - 1) break;

      const check = isRetryable?.(error);
      if (check && !check.retry) break;

      const delayMs =
        check?.retryAfterMs ?? calcBackoffDelay(attempt, options);

      await sleep(delayMs);
    }
  }

  throw lastError;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseRetryAfter(headerValue: string | null): number | undefined {
  if (!headerValue) return undefined;
  const seconds = parseInt(headerValue, 10);
  if (!isNaN(seconds)) return seconds * 1000;
  const date = new Date(headerValue);
  if (!isNaN(date.getTime())) {
    return Math.max(0, date.getTime() - Date.now());
  }
  return undefined;
}
