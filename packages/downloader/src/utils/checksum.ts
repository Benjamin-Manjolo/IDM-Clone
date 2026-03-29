import * as crypto from 'crypto';
import * as fs from 'fs';

export type ChecksumAlgorithm = 'md5' | 'sha1' | 'sha256';

export async function computeChecksum(filePath: string, algorithm: ChecksumAlgorithm): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algorithm);
    const stream = fs.createReadStream(filePath);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

export async function verifyChecksum(
  filePath: string,
  algorithm: ChecksumAlgorithm,
  expected: string
): Promise<boolean> {
  const actual = await computeChecksum(filePath, algorithm);
  return actual.toLowerCase() === expected.toLowerCase();
}