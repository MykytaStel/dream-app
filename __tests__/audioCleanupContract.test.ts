import { readFileSync } from 'fs';
import { join } from 'path';

const readProjectFile = (...parts: string[]) =>
  readFileSync(join(__dirname, '..', ...parts), 'utf8');

const spec = readProjectFile('src', 'specs', 'NativeAudioRecorder.ts');
const service = readProjectFile(
  'src',
  'features',
  'dreams',
  'services',
  'audioService.ts',
);
const android = readProjectFile(
  'android',
  'app',
  'src',
  'main',
  'java',
  'com',
  'dreamapp',
  'AudioRecorderModule.kt',
);
const ios = readProjectFile('ios', 'DreamApp', 'AudioRecorderModule.swift');
const iosBridge = readProjectFile('ios', 'DreamApp', 'AudioRecorderModule.mm');

function expectBefore(source: string, first: string, second: string) {
  const firstIndex = source.indexOf(first);
  const secondIndex = source.indexOf(second);

  expect(firstIndex).toBeGreaterThanOrEqual(0);
  expect(secondIndex).toBeGreaterThan(firstIndex);
}

describe('protected audio cleanup contract', () => {
  test('codegen and the JavaScript boundary require the ownership snapshot', () => {
    expect(spec).toContain('protectedUris: ReadonlyArray<string>');
    expect(service).toContain('protectedUris: readonly string[]');
    expect(service).toContain(
      'NativeAudioRecorder.cleanupOrphanedAudioFiles(\n    maxAgeDays,\n    protectedUris,',
    );
  });

  test('Android canonicalizes app-owned paths before applying ownership', () => {
    expect(android).toContain('protectedUris: ReadableArray');
    expect(android).toContain('File(rawPath).canonicalFile');
    expect(android).toContain('candidate.parentFile?.canonicalFile');
    expect(android).toContain('parent == audioDirectory');
    expect(android).toContain('protectedPaths.contains(file.path)');
    expect(android).toContain('file.path == currentPath');
    expect(android).toContain('cleanup_invalid_age');

    expectBefore(
      android,
      'if (protectedPaths.contains(file.path)) continue',
      'if (file.delete())',
    );
    expectBefore(
      android,
      'if (modified <= 0 || modified >= cutoff) continue',
      'if (file.delete())',
    );
  });

  test('iOS resolves file paths and checks ownership before removal', () => {
    expect(ios).toContain('protectedUris: [String]');
    expect(ios).toContain('resolvingSymlinksInPath()');
    expect(ios).toContain(
      'normalized.deletingLastPathComponent() == directory',
    );
    expect(ios).toContain('protectedPaths.contains(url.path)');
    expect(ios).toContain('url.path != currentPath');
    expect(ios).toContain('cleanup_invalid_age');

    expectBefore(
      ios,
      'guard !protectedPaths.contains(url.path) else { continue }',
      'FileManager.default.removeItem(at: url)',
    );
    expectBefore(
      ios,
      'guard let modified = values?.contentModificationDate, modified < cutoff',
      'FileManager.default.removeItem(at: url)',
    );
  });

  test('the Objective-C++ bridge forwards the protected URI array', () => {
    expect(iosBridge).toContain(
      'protectedUris:(NSArray<NSString *> *)protectedUris',
    );
    expect(iosBridge).toContain('protectedUris:protectedUris');
  });

  test('age alone is no longer a complete cleanup call', () => {
    expect(spec).not.toContain(
      'cleanupOrphanedAudioFiles(maxAgeDays: number): Promise<number>',
    );
    expect(android).not.toContain(
      'cleanupOrphanedAudioFiles(maxAgeDays: Double, promise: Promise)',
    );
    expect(iosBridge).not.toContain(
      'cleanupOrphanedAudioFiles:maxAgeDays resolver:resolve',
    );
  });
});
