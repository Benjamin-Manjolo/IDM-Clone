/**
 * Token bucket rate limiter.
 * Call `consume(bytes)` before writing each chunk.
 * It returns a delay in ms — await sleep(delay) to respect the limit.
 */
export class SpeedLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(private bytesPerSecond: number) {
    this.tokens = bytesPerSecond;
    this.lastRefill = Date.now();
  }

  setLimit(bytesPerSecond: number): void {
    this.bytesPerSecond = bytesPerSecond;
    this.tokens = bytesPerSecond;
  }

  isUnlimited(): boolean {
    return this.bytesPerSecond <= 0;
  }

  /**
   * Returns how many ms to wait before sending `bytes` bytes.
   */
  consume(bytes: number): number {
    if (this.isUnlimited()) return 0;

    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.bytesPerSecond, this.tokens + elapsed * this.bytesPerSecond);
    this.lastRefill = now;

    if (this.tokens >= bytes) {
      this.tokens -= bytes;
      return 0;
    }

    const deficit = bytes - this.tokens;
    this.tokens = 0;
    return (deficit / this.bytesPerSecond) * 1000; // ms to wait
  }
}
