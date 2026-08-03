import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { getDreamCopy } from '../src/constants/copy/dreams';
import { useHomeTimelineState } from '../src/features/dreams/hooks/useHomeTimelineState';
import { type Dream } from '../src/features/dreams/model/dream';

const copy = getDreamCopy('en');

function makeDream(day: number, archived = false): Dream {
  return {
    id: archived ? 'archived-latest' : `dream-${day}`,
    createdAt: Date.UTC(2026, 7, day, 8),
    archivedAt: archived ? Date.UTC(2026, 7, day, 9) : undefined,
    sleepDate: `2026-08-${String(day).padStart(2, '0')}`,
    title: `Dream ${day}`,
    text: `Dream notes ${day}`,
    tags: [],
  };
}

type TimelineState = ReturnType<typeof useHomeTimelineState>;

let latestState: TimelineState | null = null;
let renderer: ReactTestRenderer.ReactTestRenderer | null = null;

function Harness({ dreams }: { dreams: Dream[] }) {
  latestState = useHomeTimelineState({
    dreams,
    copy,
    locale: 'en',
    lastViewedDream: null,
  });
  return null;
}

function state() {
  if (!latestState) {
    throw new Error('Home timeline hook has not rendered.');
  }

  return latestState;
}

describe('simplified Home timeline state', () => {
  afterEach(() => {
    ReactTestRenderer.act(() => {
      renderer?.unmount();
    });
    renderer = null;
    latestState = null;
  });

  test('shows the 12 newest active dreams only', () => {
    const activeDreams = Array.from({ length: 14 }, (_, index) =>
      makeDream(index + 1),
    );
    const dreams = [makeDream(15, true), ...activeDreams.reverse()];

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<Harness dreams={dreams} />);
    });

    expect(state().activeDreamCount).toBe(14);
    expect(state().displayedDreams).toHaveLength(12);
    expect(state().displayedDreams.map(dream => dream.id)).toEqual([
      'dream-14',
      'dream-13',
      'dream-12',
      'dream-11',
      'dream-10',
      'dream-9',
      'dream-8',
      'dream-7',
      'dream-6',
      'dream-5',
      'dream-4',
      'dream-3',
    ]);
    expect(
      state().displayedDreams.some(dream => dream.id === 'archived-latest'),
    ).toBe(false);
  });
});
