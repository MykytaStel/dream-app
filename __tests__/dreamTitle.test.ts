import { getDreamDisplayTitle } from '../src/features/dreams/model/dreamTitle';

const FALLBACK = 'Untitled dream';

describe('getDreamDisplayTitle', () => {
  it("uses the dream's own title when it has one", () => {
    expect(
      getDreamDisplayTitle(
        { title: '  The lantern room  ', text: 'x' },
        FALLBACK,
      ),
    ).toBe('The lantern room');
  });

  it('derives from the first sentence of the body', () => {
    expect(
      getDreamDisplayTitle(
        {
          text: 'I was flying over a calm sea. Then everything turned white.',
        },
        FALLBACK,
      ),
    ).toBe('I was flying over a calm sea');
  });

  it('derives from the first line when there is no sentence break', () => {
    expect(
      getDreamDisplayTitle(
        { text: 'a corridor that kept getting longer\nand a door' },
        FALLBACK,
      ),
    ).toBe('a corridor that kept getting longer');
  });

  it('truncates a long opening without cutting an emoji', () => {
    const title = getDreamDisplayTitle(
      { text: `${'la '.repeat(40)}end` },
      FALLBACK,
    );
    expect(Array.from(title).length).toBeLessThanOrEqual(48);
  });

  it('falls back to the transcript, then to the fallback', () => {
    expect(
      getDreamDisplayTitle(
        { transcript: 'spoken dream about water' },
        FALLBACK,
      ),
    ).toBe('spoken dream about water');
    expect(getDreamDisplayTitle({}, FALLBACK)).toBe(FALLBACK);
    expect(getDreamDisplayTitle({ text: '   ' }, FALLBACK)).toBe(FALLBACK);
  });
});
