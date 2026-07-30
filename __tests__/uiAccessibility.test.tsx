import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@shopify/restyle';
import { Button } from '../src/components/ui/Button';
import { TagChip } from '../src/components/ui/TagChip';
import { SegmentedControl } from '../src/components/ui/SegmentedControl';
import { themes } from '../src/theme/theme';

/**
 * These three primitives back most of the interactive surface: Button alone has
 * 79 call sites. Giving them a role and a label here is what makes the app
 * usable with a screen reader, so it is worth asserting rather than assuming —
 * accessibility regresses silently, since nothing visible changes.
 */

function renderWithTheme(element: React.ReactElement) {
  return render(
    <ThemeProvider theme={themes.kaleidoscope}>{element}</ThemeProvider>,
  );
}

describe('Button', () => {
  test('is announced as a button, named by its title', async () => {
    const { getByRole } = await renderWithTheme(
      <Button title="Save dream" onPress={() => {}} />,
    );

    expect(getByRole('button', { name: 'Save dream' })).toBeTruthy();
  });

  test('an explicit label wins over the visible title', async () => {
    const { getByRole } = await renderWithTheme(
      <Button title="⋯" accessibilityLabel="More actions" onPress={() => {}} />,
    );

    expect(getByRole('button', { name: 'More actions' })).toBeTruthy();
  });

  test('a disabled button says so', async () => {
    const { getByRole } = await renderWithTheme(
      <Button title="Save dream" disabled onPress={() => {}} />,
    );

    expect(getByRole('button', { name: 'Save dream' })).toBeDisabled();
  });
});

describe('TagChip', () => {
  test('a pressable chip is a button named by its label', async () => {
    const { getByRole } = await renderWithTheme(
      <TagChip label="water" onPress={() => {}} />,
    );

    expect(getByRole('button', { name: 'water' })).toBeTruthy();
  });

  test('a selected chip announces that it is selected', async () => {
    const { getByRole } = await renderWithTheme(
      <TagChip label="water" selected onPress={() => {}} />,
    );

    expect(getByRole('button', { name: 'water' })).toBeSelected();
  });
});

describe('SegmentedControl', () => {
  const options = [
    { value: 'all', label: 'All' },
    { value: '7d', label: 'Week' },
  ] as const;

  test('each option is a radio named by its label', async () => {
    const { getByRole } = await renderWithTheme(
      <SegmentedControl
        options={options}
        selectedValue="all"
        onChange={() => {}}
      />,
    );

    expect(getByRole('radio', { name: 'All' })).toBeTruthy();
    expect(getByRole('radio', { name: 'Week' })).toBeTruthy();
  });

  test('only the active option is checked', async () => {
    const { getByRole } = await renderWithTheme(
      <SegmentedControl
        options={options}
        selectedValue="7d"
        onChange={() => {}}
      />,
    );

    expect(getByRole('radio', { name: 'Week' })).toBeSelected();
    expect(getByRole('radio', { name: 'All' })).not.toBeSelected();
  });
});
