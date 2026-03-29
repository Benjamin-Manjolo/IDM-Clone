export function speedToColor(bps: number): string {
  if (bps <= 0) return 'text-gray-400';
  if (bps < 100 * 1024)        return 'text-red-400';     // < 100 KB/s
  if (bps < 1024 * 1024)       return 'text-yellow-400';  // < 1 MB/s
  if (bps < 10 * 1024 * 1024)  return 'text-green-400';   // < 10 MB/s
  return 'text-blue-400';                                   // 10+ MB/s
}

export function speedToBarWidth(bps: number, maxBps: number): number {
  if (maxBps <= 0 || bps <= 0) return 0;
  return Math.min(100, (bps / maxBps) * 100);
}

/** Rolling average over a sliding window of samples */
export class RollingAverage {
  private samples: number[] = [];
  constructor(private windowSize: number) {}

  push(value: number): void {
    this.samples.push(value);
    if (this.samples.length > this.windowSize) this.samples.shift();
  }

  get(): number {
    if (!this.samples.length) return 0;
    return this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
  }

  reset(): void { this.samples = []; }
}