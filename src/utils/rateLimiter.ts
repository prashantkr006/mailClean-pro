const MAX_CONCURRENT = 10;
const TOKENS_PER_SECOND = 250;
const BUCKET_CAPACITY = 250;

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private queue: Array<() => void>;
  private activeRequests: number;

  constructor(
    private readonly tokensPerSecond = TOKENS_PER_SECOND,
    private readonly capacity = BUCKET_CAPACITY,
    private readonly maxConcurrent = MAX_CONCURRENT,
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
    this.queue = [];
    this.activeRequests = 0;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(
      this.capacity,
      this.tokens + elapsed * this.tokensPerSecond,
    );
    this.lastRefill = now;
  }

  private tryAcquire(): boolean {
    this.refill();
    if (this.tokens >= 1 && this.activeRequests < this.maxConcurrent) {
      this.tokens -= 1;
      this.activeRequests += 1;
      return true;
    }
    return false;
  }

  private drain(): void {
    while (this.queue.length > 0 && this.tryAcquire()) {
      const resolve = this.queue.shift();
      if (resolve) {
        this.activeRequests -= 1;
        resolve();
        this.activeRequests += 1;
      }
    }
  }

  async acquire(): Promise<() => void> {
    const release = (): void => {
      this.activeRequests -= 1;
      this.drain();
    };

    if (this.tryAcquire()) {
      return release;
    }

    return new Promise<() => void>((resolve) => {
      this.queue.push(() => {
        resolve(release);
      });

      const waitForToken = (): void => {
        this.refill();
        if (this.tokens >= 1 && this.activeRequests < this.maxConcurrent) {
          this.drain();
        } else {
          const delay = Math.max(10, (1 / this.tokensPerSecond) * 1000);
          setTimeout(waitForToken, delay);
        }
      };

      if (this.queue.length === 1) {
        waitForToken();
      }
    });
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    const release = await this.acquire();
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

export const globalRateLimiter = new RateLimiter();
