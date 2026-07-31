import {
  createKeyCheck,
  decryptRecord,
  encryptRecord,
  isKeyCheckValid,
  CIPHER_VERSION,
  type AeadPrimitive,
} from './archiveCipher';
import {
  generateArchiveKey,
  initArchiveCrypto,
  libsodiumAead,
} from './libsodiumAead';
import { decodeRecoveryCode, encodeRecoveryCode } from './recoveryCode';
import {
  deleteArchiveKey,
  loadArchiveKey,
  saveArchiveKey,
} from '../security/archiveKeyStorage';
import type {
  OpenContent,
  SealContent,
} from '../api/contracts/dreamSyncCipher';

/**
 * The one place that knows which key this device is using.
 *
 * Reading the key means touching the Keychain or the filesystem, which is
 * asynchronous and slow enough that doing it per record would show. It is
 * cached for the process lifetime and dropped on sign-out.
 */

export const ARCHIVE_KEY_REQUIRED = 'archive-key-required';

/** Thrown when the archive cannot be read with the key this device holds. */
export class ArchiveKeyRequiredError extends Error {
  constructor(readonly reason: 'missing' | 'mismatch') {
    super(ARCHIVE_KEY_REQUIRED);
    this.name = 'ArchiveKeyRequiredError';
  }
}

let cachedKey: Uint8Array | null = null;
let aead: AeadPrimitive = libsodiumAead;

/** Test seam. Production never calls this. */
export function setArchiveAeadForTesting(primitive: AeadPrimitive) {
  aead = primitive;
  cachedKey = null;
}

export function forgetArchiveKey() {
  cachedKey = null;
}

export async function getArchiveKey(): Promise<Uint8Array | null> {
  if (cachedKey) {
    return cachedKey;
  }

  await initArchiveCrypto();
  cachedKey = await loadArchiveKey();
  return cachedKey;
}

/**
 * Returns this device's key, creating one the first time.
 *
 * Creation is silent by design: the spec's first layer is that turning on sync
 * asks the user for nothing. The key only becomes visible — as a recovery code
 * — when it cannot travel on its own.
 */
export async function getOrCreateArchiveKey(): Promise<Uint8Array> {
  const existing = await getArchiveKey();
  if (existing) {
    return existing;
  }

  await initArchiveCrypto();
  const key = generateArchiveKey();
  await saveArchiveKey(key);
  cachedKey = key;
  return key;
}

export async function importArchiveKeyFromRecoveryCode(
  code: string,
): Promise<Uint8Array> {
  const key = decodeRecoveryCode(code);
  await initArchiveCrypto();
  await saveArchiveKey(key);
  cachedKey = key;
  return key;
}

/** The words to write down. Reads the key; never generates one. */
export async function getArchiveRecoveryCode(): Promise<string | null> {
  const key = await getArchiveKey();
  return key ? encodeRecoveryCode(key) : null;
}

export async function resetArchiveKey(): Promise<void> {
  await deleteArchiveKey();
  cachedKey = null;
}

export function createArchiveKeyCheck(key: Uint8Array): string {
  return createKeyCheck(key, aead);
}

export function archiveKeyMatchesCheck(
  key: Uint8Array,
  check: string,
): boolean {
  return isKeyCheckValid(check, key, aead);
}

/**
 * Binds the current key to the seal/open pair `sync.ts` hands to the contract
 * layer, so no caller has to pass a key around and none can forget to.
 */
export function createArchiveSealer(key: Uint8Array): {
  seal: SealContent;
  open: OpenContent;
  cipherVersion: number;
} {
  return {
    seal: content => encryptRecord(content, key, aead),
    open: ciphertext => decryptRecord(ciphertext, key, aead),
    cipherVersion: CIPHER_VERSION,
  };
}
