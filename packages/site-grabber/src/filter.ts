export interface GrabFilter {
  includeExtensions?: string[];   // e.g. ['jpg','png'] — empty = all
  excludeExtensions?: string[];
  includePatterns?: RegExp[];
  excludePatterns?: RegExp[];
  minSizeBytes?: number;
  maxSizeBytes?: number;
  includeExternalLinks?: boolean;
}

export function passesFilter(url: string, filter: GrabFilter, sizeBytes?: number): boolean {
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0] ?? '';

  if (filter.includeExtensions?.length && !filter.includeExtensions.includes(ext)) return false;
  if (filter.excludeExtensions?.includes(ext)) return false;

  if (filter.includePatterns?.length && !filter.includePatterns.some(p => p.test(url))) return false;
  if (filter.excludePatterns?.some(p => p.test(url))) return false;

  if (sizeBytes !== undefined) {
    if (filter.minSizeBytes !== undefined && sizeBytes < filter.minSizeBytes) return false;
    if (filter.maxSizeBytes !== undefined && sizeBytes > filter.maxSizeBytes) return false;
  }

  return true;
}

export function buildFilterFromStrings(
  include: string,
  exclude: string
): Pick<GrabFilter, 'includeExtensions' | 'excludeExtensions'> {
  const parse = (s: string) =>
    s.split(/[,;\s]+/).map(e => e.trim().replace(/^\./, '').toLowerCase()).filter(Boolean);

  return {
    includeExtensions: parse(include),
    excludeExtensions: parse(exclude),
  };
}
