import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MEDIA_CLIP_REVERSE_ICON_PATHS,
  mirrorMediaClipRange,
  renderMediaClipReverseIcon,
  resolveMediaClipReverseControlState,
} from './mediaClipReverseControl.js';

test('mediaClipReverseControl: derives labels and ARIA state from reversal and pending state', () => {
  assert.deepEqual(resolveMediaClipReverseControlState(), {
    isReversed: false,
    pending: false,
    label: '视频倒放',
    ariaPressed: 'false',
    ariaBusy: 'false',
  });
  assert.deepEqual(resolveMediaClipReverseControlState({ isReversed: true }), {
    isReversed: true,
    pending: false,
    label: '取消视频倒放',
    ariaPressed: 'true',
    ariaBusy: 'false',
  });
  assert.deepEqual(resolveMediaClipReverseControlState({ isReversed: true, pending: true }), {
    isReversed: true,
    pending: true,
    label: '视频倒放中',
    ariaPressed: 'true',
    ariaBusy: 'true',
  });
});

test('mediaClipReverseControl: mirrors and clamps a clip range within the media duration', () => {
  assert.deepEqual(mirrorMediaClipRange({ startSec: 2, endSec: 6, durationSec: 10 }), {
    startSec: 4,
    endSec: 8,
  });
  assert.deepEqual(mirrorMediaClipRange({ startSec: -2, endSec: 12, durationSec: 10 }), {
    startSec: 0,
    endSec: 10,
  });
  assert.deepEqual(mirrorMediaClipRange({ startSec: 2, endSec: 6, durationSec: 0 }), {
    startSec: 0,
    endSec: 0,
  });
});

test('mediaClipReverseControl: renders the reverse icon with a trimmed class and fallback stroke width', () => {
  const html = renderMediaClipReverseIcon({ className: '  toolbar-icon reverse  ', strokeWidth: 0 });

  assert.match(html, /^<svg class="toolbar-icon reverse"/);
  assert.match(html, /stroke-width="1\.7"/);
  assert.equal(html.includes(MEDIA_CLIP_REVERSE_ICON_PATHS), true);
  assert.equal(renderMediaClipReverseIcon().startsWith('<svg viewBox="0 0 24 24"'), true);
});
