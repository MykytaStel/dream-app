import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

/**
 * The sign of a swipe threshold.
 *
 * gesture-handler 2 took `dragOffsetFromRightEdge` as a magnitude. Version 3
 * renamed it to `dragOffsetFromRight` and made the sign directional — a right
 * offset is negative, and the library now rejects a positive one. The rename
 * was handled during the React Native 0.86 upgrade; the sign was not.
 *
 * What made it survive: in development the library throws and the row fails to
 * render, which is loud. In a release build that check is compiled out, so the
 * swipe simply triggers at the wrong threshold and nothing reports it. No test
 * could see it either, because it is a number passed to a third-party
 * component.
 *
 * Found by running the app. Pinned here so the next upgrade that flips a
 * convention has to argue with something.
 */

const SRC = join(__dirname, '..', 'src');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return walk(full);
    }
    return /[.]tsx?$/.test(entry) ? [full] : [];
  });
}

function usages(prop: string): Array<{ file: string; value: string }> {
  const pattern = new RegExp(`${prop}=\\{([^}]+)\\}`, 'g');

  return walk(SRC).flatMap(file => {
    const contents = readFileSync(file, 'utf8');
    return [...contents.matchAll(pattern)].map(match => ({
      file: relative(SRC, file),
      value: match[1].trim(),
    }));
  });
}

describe('swipe gesture thresholds', () => {
  test('a right offset is negative', () => {
    const found = usages('dragOffsetFromRight');

    expect(found.length).toBeGreaterThan(0);
    for (const { file, value } of found) {
      expect(`${file}: ${value}`).toMatch(/: -/);
    }
  });

  test('a left offset is positive', () => {
    const found = usages('dragOffsetFromLeft');

    expect(found.length).toBeGreaterThan(0);
    for (const { file, value } of found) {
      expect(`${file}: ${value}`).not.toMatch(/: -/);
    }
  });

  test('the old version-2 prop names are gone', () => {
    // `dragOffsetFromLeftEdge` and `dragOffsetFromRightEdge` are silently
    // ignored by version 3 rather than rejected, so a missed rename removes the
    // threshold entirely and the row starts swiping on the slightest touch.
    for (const file of walk(SRC)) {
      const contents = readFileSync(file, 'utf8');
      expect(contents).not.toContain('dragOffsetFromLeftEdge');
      expect(contents).not.toContain('dragOffsetFromRightEdge');
    }
  });
});
