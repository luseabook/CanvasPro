import { t } from '../i18n/index.js';
import { showGenerationCompleteNotification } from '../services/completionNotificationService.js';
import { playCompletionSound } from '../services/completionSoundService.js';
function panelText(value, item = {}) {
  return t('audioVoicePanel.' + value, item);
}
export function summarizeAudioVoiceGenerationResults(list = [], key = 0) {
  const list2 = Array['isArray'](list) ? list : [],
    total = Math['max'](list2['length'], Math['max'](0, Math['trunc'](Number(key) || 0))),
    succeeded = list2['filter']((el) => {
      if (el?.['status'] !== 'fulfilled') return ![];
      const enabled = String(el?.['value']?.['status'] || '')
        ['trim']()
        ['toLowerCase']();
      return !enabled || enabled === 'success';
    })['length'];
  return { total: total, succeeded: succeeded, incomplete: Math['max'](0, total - succeeded) };
}
export function buildAudioVoiceGenerationCompletionMessage(options = {}) {
  const count = Math['max'](1, Math['trunc'](Number(options?.['total']) || 0)),
    succeeded2 = Math['max'](0, Math['min'](count, Math['trunc'](Number(options?.['succeeded']) || 0))),
    incomplete = Math['max'](
      0,
      Math['min'](
        count,
        Number['isFinite'](Number(options?.['incomplete']))
          ? Math['trunc'](Number(options['incomplete']))
          : count - succeeded2,
      ),
    );
  if (incomplete > 0)
    return panelText('toasts.generationBatchSettled', { succeeded: succeeded2, incomplete: incomplete });
  return count === 1
    ? panelText('toasts.generationCompleteSingle')
    : panelText('toasts.generationCompleteBatch', { count: count });
}
export function notifyAudioVoiceGenerationComplete(
  options2 = {},
  {
    playSound: playSound = playCompletionSound,
    showNotification: showNotification = showGenerationCompleteNotification,
  } = {},
) {
  const body = buildAudioVoiceGenerationCompletionMessage(options2),
    list3 = [];
  return (
    Math['max'](0, Number(options2?.['succeeded']) || 0) > 0 &&
      list3['push'](Promise['resolve']()['then'](() => playSound?.('generation-success'))),
    list3['push'](Promise['resolve']()['then'](() => showNotification?.({ body: body }))),
    Promise['allSettled'](list3)
  );
}
