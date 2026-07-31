/* eslint-disable no-bitwise -- byte arithmetic for the stand-in recording. */
import RNFS from 'react-native-fs';
import { fromBase64, toBase64 } from '../../src/services/crypto/archiveCipher';

/**
 * A real filesystem, in memory.
 *
 * Chunked encryption is defined by what lands on disk at which offset, so
 * mocking `read` to return a fixed string would test nothing: the round trip
 * only means something if the bytes written by one pass are the bytes read by
 * the next.
 */

export type VirtualFileSystem = {
  files: Map<string, Uint8Array>;
  put(path: string, bytes: Uint8Array): void;
  get(path: string): Uint8Array | undefined;
  install(): void;
};

export function createVirtualFileSystem(): VirtualFileSystem {
  const files = new Map<string, Uint8Array>();
  // Capacity is tracked separately so appends do not reallocate every time.
  const capacity = new Map<string, { buffer: Uint8Array; length: number }>();

  const materialise = (path: string) => {
    const grown = capacity.get(path);
    if (grown) {
      files.set(path, grown.buffer.subarray(0, grown.length).slice());
      capacity.delete(path);
    }
    return files.get(path);
  };

  const append = (path: string, addition: Uint8Array) => {
    let grown = capacity.get(path);
    if (!grown) {
      const existing = files.get(path) ?? new Uint8Array(0);
      const buffer = new Uint8Array(
        Math.max(1024, (existing.length + addition.length) * 2),
      );
      buffer.set(existing, 0);
      grown = { buffer, length: existing.length };
      capacity.set(path, grown);
    }

    if (grown.length + addition.length > grown.buffer.length) {
      const bigger = new Uint8Array(
        Math.max(grown.buffer.length * 2, grown.length + addition.length),
      );
      bigger.set(grown.buffer.subarray(0, grown.length), 0);
      grown.buffer = bigger;
    }

    grown.buffer.set(addition, grown.length);
    grown.length += addition.length;
    files.set(path, grown.buffer.subarray(0, grown.length));
  };

  const vfs: VirtualFileSystem = {
    files,
    put(path, bytes) {
      capacity.delete(path);
      files.set(path, bytes.slice());
    },
    get(path) {
      return materialise(path);
    },
    install() {
      (RNFS.stat as jest.Mock).mockImplementation(async (path: string) => {
        const file = files.get(path);
        if (!file) {
          throw new Error(`ENOENT: ${path}`);
        }
        return { size: String(file.length) };
      });

      (RNFS.exists as jest.Mock).mockImplementation(async (path: string) =>
        files.has(path),
      );

      (RNFS.read as jest.Mock).mockImplementation(
        async (path: string, length: number, position: number) => {
          const file = files.get(path);
          if (!file) {
            throw new Error(`ENOENT: ${path}`);
          }
          return toBase64(file.slice(position, position + length));
        },
      );

      (RNFS.readFile as jest.Mock).mockImplementation(async (path: string) => {
        const file = files.get(path);
        if (!file) {
          throw new Error(`ENOENT: ${path}`);
        }
        return toBase64(file);
      });

      (RNFS.writeFile as jest.Mock).mockImplementation(
        async (path: string, contents: string) => {
          files.set(path, fromBase64(contents));
        },
      );

      (RNFS.appendFile as jest.Mock).mockImplementation(
        async (path: string, contents: string) => {
          // Appended into a growable buffer rather than by rebuilding the file
          // each time. The naive version is O(n²) in total bytes, which turned
          // a 20 MB round trip into minutes and hid what the test was measuring.
          append(path, fromBase64(contents));
        },
      );

      (RNFS.unlink as jest.Mock).mockImplementation(async (path: string) => {
        // Both maps, or a deleted file reappears the next time it is read: the
        // growable buffer would still hold it. That mistake made a test about
        // cleanup fail against correct production code.
        capacity.delete(path);
        files.delete(path);
      });
    },
  };

  return vfs;
}

/** Bytes that are recognisable when they survive somewhere they should not. */
export function recognisableAudio(byteLength: number): Uint8Array {
  return Uint8Array.from(
    { length: byteLength },
    (_, index) => (index * 31 + (index % 7)) & 0xff,
  );
}

/**
 * Byte-for-byte comparison that survives large files.
 *
 * `expect(a).toEqual(b)` on multi-megabyte typed arrays walks every element to
 * build a diff and ran the test process out of memory at 20 MB. This scans once
 * and only builds a message when there is something to report.
 */
export function expectSameBytes(
  actual: Uint8Array | undefined,
  expected: Uint8Array,
): void {
  if (!actual) {
    throw new Error('expected bytes, received nothing');
  }

  if (actual.length !== expected.length) {
    throw new Error(
      `length differs: received ${actual.length}, expected ${expected.length}`,
    );
  }

  for (let index = 0; index < expected.length; index += 1) {
    if (actual[index] !== expected[index]) {
      throw new Error(
        `bytes differ at ${index}: received ${actual[index]}, expected ${expected[index]}`,
      );
    }
  }
}
