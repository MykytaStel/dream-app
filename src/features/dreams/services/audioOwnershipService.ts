type AudioOwner = {
  audioUri?: string | null;
};

export type AudioOwnershipSnapshot = {
  dreams: readonly AudioOwner[];
  createDraft?: AudioOwner | null;
  editDrafts?: readonly (AudioOwner | null | undefined)[];
  activeAudioUri?: string | null;
  pendingAudioUri?: string | null;
};

function addProtectedUri(
  protectedUris: Set<string>,
  uri: string | null | undefined,
) {
  if (typeof uri !== 'string' || uri.trim().length === 0) {
    return;
  }

  protectedUris.add(uri);
}

/**
 * Builds the conservative allow-list that filesystem cleanup must never delete.
 *
 * URI values are preserved exactly as stored. Path normalization belongs at the
 * native bridge boundary, where platform-specific file URI rules are known.
 */
export function collectProtectedAudioUris({
  dreams,
  createDraft,
  editDrafts = [],
  activeAudioUri,
  pendingAudioUri,
}: AudioOwnershipSnapshot): string[] {
  const protectedUris = new Set<string>();

  dreams.forEach(dream => addProtectedUri(protectedUris, dream.audioUri));
  addProtectedUri(protectedUris, createDraft?.audioUri);
  editDrafts.forEach(draft => addProtectedUri(protectedUris, draft?.audioUri));
  addProtectedUri(protectedUris, activeAudioUri);
  addProtectedUri(protectedUris, pendingAudioUri);

  return Array.from(protectedUris);
}
