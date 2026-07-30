import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Android backs up all app data by default. Here that would upload the MMKV
 * store — the dream text — to Google Drive in the clear, which is the leak the
 * encryption work exists to close.
 *
 * Backup is enabled anyway, because it is what carries the archive key to the
 * user's next device and spares them writing down a recovery code. That trade
 * is only safe while the rules stay narrow, so these tests read the XML and
 * fail if anything but the key is ever included.
 */

const ANDROID_RES = join(
  __dirname,
  '..',
  'android',
  'app',
  'src',
  'main',
  'res',
  'xml',
);

const MANIFEST = join(
  __dirname,
  '..',
  'android',
  'app',
  'src',
  'main',
  'AndroidManifest.xml',
);

const KEY_PATH = 'archive-key/';

function read(file: string): string {
  return readFileSync(join(ANDROID_RES, file), 'utf8');
}

function includedPaths(xml: string): string[] {
  return [...xml.matchAll(/<include\b[^>]*\/>/g)].map(match => match[0]);
}

function excludedDomains(xml: string): string[] {
  return [...xml.matchAll(/<exclude\b[^>]*domain="([^"]+)"/g)].map(m => m[1]);
}

describe.each(['data_extraction_rules.xml', 'backup_rules.xml'])(
  '%s',
  fileName => {
    const xml = read(fileName);

    test('includes the archive key and nothing else', () => {
      const includes = includedPaths(xml);

      expect(includes.length).toBeGreaterThan(0);
      for (const include of includes) {
        expect(include).toContain(`path="${KEY_PATH}"`);
        expect(include).toContain('domain="file"');
      }
    });

    test('excludes every domain that could hold dream data', () => {
      const excluded = new Set(excludedDomains(xml));

      // sharedpref and file are where MMKV and the recordings live; root,
      // database and external are excluded so a future storage choice does not
      // quietly start being backed up.
      for (const domain of [
        'root',
        'file',
        'database',
        'sharedpref',
        'external',
      ]) {
        expect(excluded).toContain(domain);
      }
    });

    test('never names the dream storage', () => {
      // A guard against someone adding an include for convenience later.
      expect(xml).not.toMatch(/include[^>]*mmkv/i);
      expect(xml).not.toMatch(/include[^>]*kaleidoscope/i);
      expect(xml).not.toMatch(/include[^>]*dream/i);
    });
  },
);

describe('AndroidManifest', () => {
  const manifest = readFileSync(MANIFEST, 'utf8');

  test('backup is enabled, since the key depends on it', () => {
    expect(manifest).toContain('android:allowBackup="true"');
  });

  test('both rule files are wired up', () => {
    // Without these attributes, allowBackup="true" means "back up everything".
    expect(manifest).toContain(
      'android:dataExtractionRules="@xml/data_extraction_rules"',
    );
    expect(manifest).toContain('android:fullBackupContent="@xml/backup_rules"');
  });
});
