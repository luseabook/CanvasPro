import test from 'node:test';
import assert from 'node:assert/strict';

import { showMediaSaveSuccessToast } from './mediaDownloadFeedback.js';
import { t } from '../../i18n/index.js';

test('mediaDownloadFeedback: shows the localized filename for a successful image save', () => {
  const calls = [];
  const shown = showMediaSaveSuccessToast({
    result: { success: true, path: 'C:\\exports\\fallback.png', filename: '  shot.png ' },
    kind: 'IMAGE',
    showToast: (...args) => calls.push(args),
  });

  assert.equal(shown, true);
  assert.deepEqual(calls, [[t('nodeToolbar.common.imageSaved', { filename: 'shot.png' }), 'success']]);
});

test('mediaDownloadFeedback: falls back to the basename from the saved path', () => {
  const calls = [];
  const shown = showMediaSaveSuccessToast({
    result: { success: true, path: '/tmp/exports/voice.wav' },
    kind: 'audio',
    showToast: (...args) => calls.push(args),
  });

  assert.equal(shown, true);
  assert.deepEqual(calls, [[t('nodeToolbar.common.audioSaved', { filename: 'voice.wav' }), 'success']]);
});

test('mediaDownloadFeedback: ignores failed, unknown, or unusable results', () => {
  const calls = [];
  const showToast = (...args) => calls.push(args);

  assert.equal(
    showMediaSaveSuccessToast({
      result: { success: false, path: '/tmp/a.png' },
      kind: 'image',
      showToast,
    }),
    false,
  );
  assert.equal(
    showMediaSaveSuccessToast({
      result: { success: true, path: '/tmp/a.bin' },
      kind: 'archive',
      showToast,
    }),
    false,
  );
  assert.equal(
    showMediaSaveSuccessToast({
      result: { success: true, path: '   ' },
      kind: 'image',
      showToast,
    }),
    false,
  );
  assert.deepEqual(calls, []);
});
