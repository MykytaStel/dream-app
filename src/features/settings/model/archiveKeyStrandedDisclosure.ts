import type { ArchiveKeyTone } from './archiveKeyPresentation';

type ShouldShowArchiveKeyStrandedDisclosureArgs = {
  tone: ArchiveKeyTone;
  hasSeen: boolean;
};

export function shouldShowArchiveKeyStrandedDisclosure({
  tone,
  hasSeen,
}: ShouldShowArchiveKeyStrandedDisclosureArgs) {
  return tone === 'attention' && !hasSeen;
}
