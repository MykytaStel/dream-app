import fs from 'node:fs';
import path from 'node:path';

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('Home and Archive have different jobs', () => {
  const homeHeader = read(
    'src/features/dreams/components/home/HomeListHeader.tsx',
  );
  const archive = read('src/features/dreams/screens/ArchiveScreen.tsx');

  test('Home does not render a second set of archive controls', () => {
    expect(homeHeader).not.toContain('HomeSearchCard');
    expect(homeHeader).not.toContain('HomeControlCard');
    expect(homeHeader).not.toContain('HomeWeeklyPatternsSection');
    expect(homeHeader).not.toContain('homeCustomizeAction');
    expect(homeHeader).not.toContain('savedSearchPresets');
  });

  test('Home offers at most one data-led reason to return', () => {
    expect(homeHeader).toContain('HomeSpotlightSection');
    expect(homeHeader).toContain('showLastViewedShortcut');
    expect(homeHeader).toContain('!showSpotlightCard');
  });

  test('Archive remains the owner of search, filters and calendar browsing', () => {
    expect(archive).toContain('ArchiveMonthPanel');
    expect(archive).toContain('ArchiveControlsPanel');
    expect(archive).toContain('calendarRows={browse.calendarRows}');
    expect(archive).toContain('searchQuery={browse.searchQuery}');
    expect(archive).toContain('archiveFilters={browse.archiveFilters}');
  });
});
