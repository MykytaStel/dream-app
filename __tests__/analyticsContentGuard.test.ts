import { sanitizeProps } from '../src/services/analytics/analyticsEvent';

/**
 * The test that protects the product's central promise.
 *
 * It asserts on the serialized payload rather than an intermediate object,
 * because what matters is what would be written to a database row — not what
 * an object looked like on the way there.
 */
describe('analytics content guard', () => {
  it('drops every kind of property the plan forbids collecting', () => {
    const dirty = {
      // §9: "Не збирати: текст снів, transcript, назви, теги, символи,
      // пошукові запити, mood values."
      text: 'I was flying over the sea',
      raw_text: 'I was flying over the sea',
      transcript: 'I was flying over the sea',
      title: 'The sea dream',
      tags: ['ocean', 'flying'],
      symbol: 'ocean',
      symbols: ['ocean'],
      query: 'ocean',
      searchQuery: 'ocean',
      mood: 'positive',
      note: 'private',
      // Health data, which the encryption migration singled out as the worst
      // of what used to travel in the clear.
      medications: 'sertraline',
      healthNotes: 'poor sleep',
      importantEvents: 'the funeral',
      // Allowed, for contrast — so the test proves filtering, not emptiness.
      entry_mode: 'voice',
      dream_index: 3,
    };

    const serialized = JSON.stringify(
      sanitizeProps('product.dream_saved', dirty),
    );

    expect(serialized).not.toMatch(/flying over the sea/);
    expect(serialized).not.toMatch(/ocean/);
    expect(serialized).not.toMatch(/sertraline/);
    expect(serialized).not.toMatch(/poor sleep/);
    expect(serialized).not.toMatch(/the funeral/);
    expect(serialized).not.toMatch(/positive/);
    expect(serialized).not.toMatch(/The sea dream/);
    expect(serialized).not.toMatch(/private/);

    // And the allowed ones did survive, so this is a filter and not a wipe.
    expect(serialized).toMatch(/voice/);
  });

  it('keeps only the keys the event declares', () => {
    const clean = sanitizeProps('product.dream_saved', {
      entry_mode: 'voice',
      dream_index: 3,
      has_audio: true,
      smuggled: 'nope',
    });

    expect(clean).toEqual({
      entry_mode: 'voice',
      dream_index: 3,
      has_audio: true,
    });
  });

  it('drops non-primitive values even when the key is allowed', () => {
    expect(
      sanitizeProps('product.dream_saved', {
        dream_index: { nested: 'object' },
      }),
    ).toEqual({});
  });

  it('returns nothing for an event that declares no props', () => {
    expect(sanitizeProps('product.app_opened', { anything: 'at all' })).toEqual(
      {},
    );
  });

  it('drops everything for an event name it does not know', () => {
    expect(sanitizeProps('product.not_a_real_event', { a: 1 })).toEqual({});
  });

  it('records a search without the search terms', () => {
    // The shape §9 asks for: how long the query was and how many results it
    // found, never what was typed.
    const clean = sanitizeProps('product.search_used', {
      surface: 'archive',
      query: 'ocean',
      query_length: 5,
      result_count: 2,
    });

    expect(clean).toEqual({
      surface: 'archive',
      query_length: 5,
      result_count: 2,
    });
  });
});
