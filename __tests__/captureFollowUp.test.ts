import {
  getCaptureFlowCopy,
  getCaptureFollowUpDestination,
} from '../src/features/dreams/model/captureFollowUp';

describe('capture follow-up routing', () => {
  test('opens sparse capture refinement in the editor', () => {
    expect(getCaptureFollowUpDestination({ key: 'refine' })).toBe('editor');
  });

  test('keeps transcript and reflection follow-ups in dream detail', () => {
    expect(getCaptureFollowUpDestination({ key: 'transcript' })).toBe('detail');
    expect(getCaptureFollowUpDestination({ key: 'reflection' })).toBe('detail');
  });

  test('provides an explicit deferred-reflection action in both locales', () => {
    expect(getCaptureFlowCopy('uk').reflectLaterAction).toBe(
      'Осмислити пізніше',
    );
    expect(getCaptureFlowCopy('en').reflectLaterAction).toBe('Reflect later');
  });
});
