import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@shopify/restyle';
import { SectionHeader } from '../src/components/ui/SectionHeader';
import { FormField } from '../src/components/ui/FormField';
import { CalmModeProvider } from '../src/app/CalmModeProvider';
import { kv } from '../src/services/storage/mmkv';
import { APP_CALM_MODE_KEY } from '../src/services/storage/keys';
import { themes } from '../src/theme/theme';

/**
 * Calm mode is a claim about the whole app made in four small places.
 *
 * It works by being read inside the shared primitives rather than at each of
 * the hundred call sites, which is what makes one switch enough — and also
 * what makes it easy to break silently later, by giving some new card its own
 * subtitle Text instead of a SectionHeader. These tests pin the two halves of
 * the promise: the explanations go, and the things that carry information
 * stay.
 */
function renderIn(node: React.ReactNode, calm: boolean) {
  kv.set(APP_CALM_MODE_KEY, calm);

  return render(
    <ThemeProvider theme={themes.kaleidoscope}>
      <CalmModeProvider>{node}</CalmModeProvider>
    </ThemeProvider>,
  );
}

describe('calm mode', () => {
  beforeEach(() => {
    kv.clearAll();
  });

  test('a heading keeps its title and loses its explanation', async () => {
    const { getByText, queryByText } = await renderIn(
      <SectionHeader title="Weekly patterns" subtitle="A calm slice of it" />,
      true,
    );

    expect(getByText('Weekly patterns')).toBeTruthy();
    expect(queryByText('A calm slice of it')).toBeNull();
  });

  test('the same heading keeps both when calm mode is off', async () => {
    const { getByText } = await renderIn(
      <SectionHeader title="Weekly patterns" subtitle="A calm slice of it" />,
      false,
    );

    expect(getByText('A calm slice of it')).toBeTruthy();
  });

  test('a field loses its hint', async () => {
    const { queryByText } = await renderIn(
      <FormField label="Dream signs" helperText="Things that repeat" />,
      true,
    );

    expect(queryByText('Things that repeat')).toBeNull();
  });

  test('a field keeps its error', async () => {
    const { getByText } = await renderIn(
      <FormField
        label="Sleep date"
        helperText="That date is not valid"
        helperTone="error"
      />,
      true,
    );

    // An error is not an explanation of the field — it is the reason the field
    // is refusing what was typed, and calm mode has no business hiding it.
    expect(getByText('That date is not valid')).toBeTruthy();
  });

  test('the preference survives a remount', async () => {
    kv.set(APP_CALM_MODE_KEY, true);

    const { queryByText } = await render(
      <ThemeProvider theme={themes.kaleidoscope}>
        <CalmModeProvider>
          <SectionHeader title="Memory" subtitle="Signals and threads" />
        </CalmModeProvider>
      </ThemeProvider>,
    );

    expect(queryByText('Signals and threads')).toBeNull();
  });

  test('a component outside the provider keeps its prose', async () => {
    // Screens rendered in previews and tests must not lose text just because
    // nobody wrapped them.
    const { getByText } = await render(
      <ThemeProvider theme={themes.kaleidoscope}>
        <SectionHeader title="Archive" subtitle="Past dreams by month" />
      </ThemeProvider>,
    );

    expect(getByText('Past dreams by month')).toBeTruthy();
  });
});
