export class DepthController {
  private visited = new Map<string, number>(); // url -> depth reached

  constructor(private readonly maxDepth: number) {}

  canVisit(url: string, currentDepth: number): boolean {
    if (currentDepth > this.maxDepth) return false;
    const prev = this.visited.get(url);
    if (prev !== undefined && prev <= currentDepth) return false;
    return true;
  }

  markVisited(url: string, depth: number): void {
    this.visited.set(url, depth);
  }

  isVisited(url: string): boolean {
    return this.visited.has(url);
  }

  getVisitedCount(): number {
    return this.visited.size;
  }

  reset(): void {
    this.visited.clear();
  }

  shouldFollowLink(linkUrl: string, baseUrl: string, stayOnDomain: boolean): boolean {
    if (!stayOnDomain) return true;
    try {
      return new URL(linkUrl).hostname === new URL(baseUrl).hostname;
    } catch {
      return false;
    }
  }
}
