import { t } from '../../i18n/index.js';
import { createGenerationErrorCard } from '../generationErrorCard.js';

export function createVideoGenerationErrorCard(errorMessage) {
  return createGenerationErrorCard({
    errorMessage,
    title: t('videoResultRender.generationFailed'),
  });
}
