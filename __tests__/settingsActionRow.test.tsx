import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Text } from 'react-native';
import { SettingsActionRow } from '../src/features/settings/components/SettingsActionRow';

jest.mock('../src/app/CalmModeProvider', () => ({
  useCalmMode: () => ({ calmMode: false }),
}));

function metaText(node: ReactTestRenderer.ReactTestRenderer, value: string) {
  return node.root
    .findAllByType(Text)
    .find(
      t =>
        (Array.isArray(t.props.children)
          ? t.props.children.join('')
          : t.props.children) === value,
    );
}

describe('SettingsActionRow meta line', () => {
  it('wraps a long description and clips at the end, never mid-word', () => {
    const meta =
      'Find broken references, stale operations, draft conflicts, and restore risks.';

    let node!: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      node = ReactTestRenderer.create(
        <SettingsActionRow
          title="Archive health"
          meta={meta}
          onPress={() => {}}
        />,
      );
    });

    const line = metaText(node, meta);
    expect(line).toBeDefined();
    expect(line?.props.numberOfLines).toBe(2);
    expect(line?.props.ellipsizeMode).toBe('tail');
  });
});
