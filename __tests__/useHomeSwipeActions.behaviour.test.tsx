import { renderHook } from '@testing-library/react-native';
import { useHomeSwipeActions } from '../src/features/dreams/hooks/useHomeSwipeActions';
import { getDreamCopy } from '../src/constants/copy/dreams';

// react-native-testing-library 14 renders asynchronously: renderHook, rerender and
// unmount all return promises.

function createSwipeable() {
  return {
    close: jest.fn(),
    openLeft: jest.fn(),
    openRight: jest.fn(),
    reset: jest.fn(),
  };
}

function renderSwipeActions(dreamIds: string[]) {
  const navigation = { navigate: jest.fn() };

  return renderHook(
    ({ ids }: { ids: string[] }) =>
      useHomeSwipeActions({
        copy: getDreamCopy('en'),
        navigation: navigation as never,
        refreshDreams: jest.fn(),
        dreamIds: ids,
      }),
    { initialProps: { ids: dreamIds } },
  );
}

describe('useHomeSwipeActions', () => {
  test('opening a row closes the one that was open before it', async () => {
    const first = createSwipeable();
    const second = createSwipeable();
    const { result } = await renderSwipeActions(['dream-1', 'dream-2']);

    result.current.bindSwipeMethods('dream-1', first as never);
    result.current.bindSwipeMethods('dream-2', second as never);
    result.current.onSwipeOpened('dream-1');

    result.current.closePreviousSwipe('dream-2');

    expect(first.close).toHaveBeenCalledTimes(1);
    expect(second.close).not.toHaveBeenCalled();
  });

  test('reopening the same row does not close it', async () => {
    const only = createSwipeable();
    const { result } = await renderSwipeActions(['dream-1']);

    result.current.bindSwipeMethods('dream-1', only as never);
    result.current.onSwipeOpened('dream-1');

    result.current.closePreviousSwipe('dream-1');

    expect(only.close).not.toHaveBeenCalled();
  });

  test('closeActiveSwipe closes the open row and nothing else', async () => {
    const first = createSwipeable();
    const second = createSwipeable();
    const { result } = await renderSwipeActions(['dream-1', 'dream-2']);

    result.current.bindSwipeMethods('dream-1', first as never);
    result.current.bindSwipeMethods('dream-2', second as never);
    result.current.onSwipeOpened('dream-2');

    result.current.closeActiveSwipe();

    expect(second.close).toHaveBeenCalledTimes(1);
    expect(first.close).not.toHaveBeenCalled();
  });

  test('a row reported closed is no longer the active one', async () => {
    const first = createSwipeable();
    const { result } = await renderSwipeActions(['dream-1']);

    result.current.bindSwipeMethods('dream-1', first as never);
    result.current.onSwipeOpened('dream-1');
    result.current.onSwipeClosed('dream-1');

    result.current.closeActiveSwipe();

    expect(first.close).not.toHaveBeenCalled();
  });

  test('a dream that leaves the list stops being tracked', async () => {
    const removed = createSwipeable();
    const { result, rerender } = await renderSwipeActions([
      'dream-1',
      'dream-2',
    ]);

    result.current.bindSwipeMethods('dream-1', removed as never);
    result.current.onSwipeOpened('dream-1');

    // dream-1 is deleted elsewhere and disappears from the list
    await rerender({ ids: ['dream-2'] });

    result.current.closeActiveSwipe();

    expect(removed.close).not.toHaveBeenCalled();
  });
});
