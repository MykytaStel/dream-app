import { type AppLocale } from '../../../i18n/types';
import { type PostSaveFollowUp } from './postSaveFollowUp';

export type CaptureFollowUpDestination = 'detail' | 'editor';

export type CaptureFlowCopy = {
  reflectLaterAction: string;
};

export function getCaptureFlowCopy(locale: AppLocale): CaptureFlowCopy {
  if (locale === 'uk') {
    return {
      reflectLaterAction: 'Осмислити пізніше',
    };
  }

  return {
    reflectLaterAction: 'Reflect later',
  };
}

export function getCaptureFollowUpDestination(
  followUp: Pick<PostSaveFollowUp, 'key'>,
): CaptureFollowUpDestination {
  return followUp.key === 'refine' ? 'editor' : 'detail';
}
