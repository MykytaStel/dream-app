/* eslint-disable no-bitwise -- SHA-256 is defined in terms of bit operations;
   writing it any other way would obscure what it does. */
export const DREAM_BACKUP_INTEGRITY_ALGORITHM = 'sha256' as const;

export type DreamBackupIntegrityManifest = {
  algorithm: typeof DREAM_BACKUP_INTEGRITY_ALGORITHM;
  digest: string;
};

export type DreamBackupIntegrityStatus = 'verified' | 'legacy-unverified';

export type DreamBackupIntegrityErrorCode =
  | 'integrity-missing'
  | 'integrity-invalid'
  | 'integrity-algorithm-unsupported'
  | 'integrity-mismatch'
  | 'integrity-preview-changed';

export class DreamBackupIntegrityError extends Error {
  readonly code: DreamBackupIntegrityErrorCode;

  constructor(code: DreamBackupIntegrityErrorCode) {
    super(code);
    this.name = 'DreamBackupIntegrityError';
    this.code = code;
  }
}

const INITIAL_HASH = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
  0x1f83d9ab, 0x5be0cd19,
] as const;

const ROUND_CONSTANTS = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
] as const;

function rotateRight(value: number, bits: number) {
  return (value >>> bits) | (value << (32 - bits));
}

function toUtf8Bytes(value: string) {
  const bytes: number[] = [];

  for (let index = 0; index < value.length; index += 1) {
    let codePoint = value.charCodeAt(index);

    if (
      codePoint >= 0xd800 &&
      codePoint <= 0xdbff &&
      index + 1 < value.length
    ) {
      const low = value.charCodeAt(index + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        codePoint = 0x10000 + ((codePoint - 0xd800) << 10) + (low - 0xdc00);
        index += 1;
      }
    }

    if (codePoint <= 0x7f) {
      bytes.push(codePoint);
    } else if (codePoint <= 0x7ff) {
      bytes.push(0xc0 | (codePoint >>> 6));
      bytes.push(0x80 | (codePoint & 0x3f));
    } else if (codePoint <= 0xffff) {
      bytes.push(0xe0 | (codePoint >>> 12));
      bytes.push(0x80 | ((codePoint >>> 6) & 0x3f));
      bytes.push(0x80 | (codePoint & 0x3f));
    } else {
      bytes.push(0xf0 | (codePoint >>> 18));
      bytes.push(0x80 | ((codePoint >>> 12) & 0x3f));
      bytes.push(0x80 | ((codePoint >>> 6) & 0x3f));
      bytes.push(0x80 | (codePoint & 0x3f));
    }
  }

  return Uint8Array.from(bytes);
}

/**
 * Small dependency-free SHA-256 implementation for deterministic backup
 * verification. It is deliberately synchronous because local JSON snapshots
 * are already assembled in memory before the file write.
 */
export function sha256Hex(value: string) {
  const input = toUtf8Bytes(value);
  const bitLength = input.length * 8;
  const paddedLength = Math.ceil((input.length + 9) / 64) * 64;
  const buffer = new Uint8Array(paddedLength);
  buffer.set(input);
  buffer[input.length] = 0x80;

  const view = new DataView(buffer.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000));
  view.setUint32(paddedLength - 4, bitLength >>> 0);

  const hash: number[] = [...INITIAL_HASH];
  const words = new Uint32Array(64);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      words[index] = view.getUint32(offset + index * 4);
    }

    for (let index = 16; index < 64; index += 1) {
      const word15 = words[index - 15];
      const word2 = words[index - 2];
      const sigma0 =
        rotateRight(word15, 7) ^ rotateRight(word15, 18) ^ (word15 >>> 3);
      const sigma1 =
        rotateRight(word2, 17) ^ rotateRight(word2, 19) ^ (word2 >>> 10);
      words[index] =
        (words[index - 16] + sigma0 + words[index - 7] + sigma1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;

    for (let index = 0; index < 64; index += 1) {
      const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choose = (e & f) ^ (~e & g);
      const temp1 =
        (h + sum1 + choose + ROUND_CONSTANTS[index] + words[index]) >>> 0;
      const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (sum0 + majority) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    hash[0] = (hash[0] + a) >>> 0;
    hash[1] = (hash[1] + b) >>> 0;
    hash[2] = (hash[2] + c) >>> 0;
    hash[3] = (hash[3] + d) >>> 0;
    hash[4] = (hash[4] + e) >>> 0;
    hash[5] = (hash[5] + f) >>> 0;
    hash[6] = (hash[6] + g) >>> 0;
    hash[7] = (hash[7] + h) >>> 0;
  }

  return hash.map(word => word.toString(16).padStart(8, '0')).join('');
}

function canonicalize(value: unknown, inArray: boolean): string | undefined {
  if (value === null) {
    return 'null';
  }

  switch (typeof value) {
    case 'string':
      return JSON.stringify(value);
    case 'boolean':
      return value ? 'true' : 'false';
    case 'number':
      if (!Number.isFinite(value)) {
        throw new Error('Backup integrity cannot encode non-finite numbers.');
      }
      return JSON.stringify(value);
    case 'undefined':
    case 'function':
    case 'symbol':
      return inArray ? 'null' : undefined;
    case 'object': {
      if (Array.isArray(value)) {
        return `[${value
          .map(item => canonicalize(item, true) ?? 'null')
          .join(',')}]`;
      }

      const record = value as Record<string, unknown>;
      const entries: string[] = [];
      for (const key of Object.keys(record).sort()) {
        const encoded = canonicalize(record[key], false);
        if (encoded !== undefined) {
          entries.push(`${JSON.stringify(key)}:${encoded}`);
        }
      }
      return `{${entries.join(',')}}`;
    }
    default:
      throw new Error('Backup integrity encountered an unsupported value.');
  }
}

export function canonicalizeDreamBackup(value: unknown) {
  const canonical = canonicalize(value, false);
  if (canonical === undefined) {
    throw new Error('Backup integrity requires a JSON-compatible root value.');
  }
  return canonical;
}

function asRecord(value: object) {
  return value as Record<string, unknown>;
}

function withoutIntegrity(value: object) {
  const { integrity: _integrity, ...payload } = asRecord(value);
  return payload;
}

export function computeDreamBackupDigest(value: object) {
  return sha256Hex(canonicalizeDreamBackup(withoutIntegrity(value)));
}

export function attachDreamBackupIntegrity<T extends object>(
  payload: T,
): T & { integrity: DreamBackupIntegrityManifest } {
  return {
    ...payload,
    integrity: {
      algorithm: DREAM_BACKUP_INTEGRITY_ALGORITHM,
      digest: computeDreamBackupDigest(payload),
    },
  };
}

function isDigest(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

function equalDigest(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export function verifyDreamBackupIntegrity(
  value: object,
  options: { required: boolean },
): DreamBackupIntegrityStatus {
  const record = asRecord(value);
  if (record.integrity === undefined) {
    if (options.required) {
      throw new DreamBackupIntegrityError('integrity-missing');
    }
    return 'legacy-unverified';
  }

  if (
    !record.integrity ||
    typeof record.integrity !== 'object' ||
    Array.isArray(record.integrity)
  ) {
    throw new DreamBackupIntegrityError('integrity-invalid');
  }

  const manifest = record.integrity as Record<string, unknown>;
  if (manifest.algorithm !== DREAM_BACKUP_INTEGRITY_ALGORITHM) {
    throw new DreamBackupIntegrityError('integrity-algorithm-unsupported');
  }
  if (!isDigest(manifest.digest)) {
    throw new DreamBackupIntegrityError('integrity-invalid');
  }

  const expected = computeDreamBackupDigest(record);
  if (!equalDigest(manifest.digest, expected)) {
    throw new DreamBackupIntegrityError('integrity-mismatch');
  }

  return 'verified';
}
