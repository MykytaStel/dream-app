import { shouldShowArchiveKeyStrandedDisclosure } from '../src/features/settings/model/archiveKeyStrandedDisclosure';
import {
  hasSeenArchiveKeyStrandedDisclosure,
  markArchiveKeyStrandedDisclosureSeen,
  resetArchiveKeyStrandedDisclosureSeen,
} from '../src/features/settings/services/archiveKeyStrandedDisclosureService';

describe('archive key stranded disclosure', () => {
  beforeEach(() => {
    resetArchiveKeyStrandedDisclosureSeen();
  });

  it('shows when the key is stranded and unseen', () => {
    expect(
      shouldShowArchiveKeyStrandedDisclosure({
        tone: 'attention',
        hasSeen: false,
      }),
    ).toBe(true);
  });

  it('stays hidden once seen', () => {
    expect(
      shouldShowArchiveKeyStrandedDisclosure({
        tone: 'attention',
        hasSeen: true,
      }),
    ).toBe(false);
  });

  it('stays hidden for every other tone, seen or not', () => {
    expect(
      shouldShowArchiveKeyStrandedDisclosure({ tone: 'quiet', hasSeen: false }),
    ).toBe(false);
    expect(
      shouldShowArchiveKeyStrandedDisclosure({
        tone: 'blocking',
        hasSeen: false,
      }),
    ).toBe(false);
  });

  it('persists the seen flag', () => {
    expect(hasSeenArchiveKeyStrandedDisclosure()).toBe(false);

    markArchiveKeyStrandedDisclosureSeen();

    expect(hasSeenArchiveKeyStrandedDisclosure()).toBe(true);

    resetArchiveKeyStrandedDisclosureSeen();

    expect(hasSeenArchiveKeyStrandedDisclosure()).toBe(false);
  });
});
