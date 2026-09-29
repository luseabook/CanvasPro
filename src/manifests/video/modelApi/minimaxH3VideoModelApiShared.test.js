import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MINIMAX_H3_DURATION_FIELD,
  MINIMAX_H3_FRAMES_PROMPT_PLACEHOLDER,
  MINIMAX_H3_HELP_TOOLTIP,
  MINIMAX_H3_MEDIA_CONSTRAINTS,
  MINIMAX_H3_RATIO_FIELD,
  MINIMAX_H3_REFERENCE_PROMPT_PLACEHOLDER,
  MINIMAX_H3_RESOLUTION_FIELD,
  MINIMAX_H3_WATERMARK_FIELD,
  createMinimaxH3Fields,
  createMinimaxH3InputSlots,
  createMinimaxH3ModeField,
  createMinimaxH3Prompt,
  createMinimaxH3VideoInputSurface,
} from './minimaxH3VideoModelApiShared.js';

test('minimaxH3: shared fields expose the documented modes and limits', () => {
  assert.deepEqual(
    MINIMAX_H3_RESOLUTION_FIELD.options.map((option) => option.value),
    ['768P', '2K'],
  );
  assert.deepEqual(
    MINIMAX_H3_RATIO_FIELD.options.map((option) => option.value),
    ['自适应', '21:9', '16:9', '4:3', '1:1', '3:4', '9:16'],
  );
  assert.equal(MINIMAX_H3_DURATION_FIELD.defaultValue, 5);
  assert.deepEqual(
    MINIMAX_H3_DURATION_FIELD.options.map((option) => option.value),
    [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  );
  assert.equal(MINIMAX_H3_WATERMARK_FIELD.label, '添加水印');
});

test('minimaxH3: mode and input surface switch between frames and reference modes', () => {
  const modeField = createMinimaxH3ModeField('h3_mode');

  assert.deepEqual(modeField.options, [
    { value: 'frames', label: '首尾帧' },
    { value: 'reference', label: '多参考' },
  ]);
  assert.deepEqual(createMinimaxH3VideoInputSurface('h3_mode'), {
    hideFixedInputSlotsWhen: {
      field: 'h3_mode',
      value: 'reference',
    },
  });
});

test('minimaxH3: input slots separate fixed frame and reference slots', () => {
  const slots = createMinimaxH3InputSlots('h3_mode');

  assert.deepEqual(slots.allowedKinds, ['text', 'image', 'video', 'audio']);
  assert.deepEqual(slots.maxByKind, { image: 9, video: 3, audio: 3 });
  assert.deepEqual(
    slots.fixedSlots.map((slot) => [slot.id, slot.kind, slot.showWhen.value]),
    [
      ['firstFrame', 'image', 'frames'],
      ['lastFrame', 'image', 'frames'],
      ['referenceImage', 'image', 'reference'],
      ['referenceVideo', 'video', 'reference'],
      ['referenceAudio', 'audio', 'reference'],
    ],
  );
  assert.deepEqual(slots.policyVariants[0], {
    when: { field: 'h3_mode', value: 'frames' },
    allowedKinds: ['text', 'image'],
    maxByKind: { image: 2, video: 0, audio: 0 },
  });
  assert.deepEqual(slots.maxTotalDurationSecondsByKind, { video: 15, audio: 15 });
});

test('minimaxH3: fields and prompts keep mode-specific guidance together', () => {
  assert.deepEqual(
    createMinimaxH3Fields('h3_mode').map((field) => field.id),
    ['h3_mode', 'resolution', 'aspectRatio', 'duration', 'watermark'],
  );
  const prompt = createMinimaxH3Prompt('h3_mode');

  assert.equal(prompt.placeholder, MINIMAX_H3_FRAMES_PROMPT_PLACEHOLDER);
  assert.deepEqual(prompt.variants, [
    {
      when: { field: 'h3_mode', value: 'frames' },
      placeholder: MINIMAX_H3_FRAMES_PROMPT_PLACEHOLDER,
    },
    {
      when: { field: 'h3_mode', value: 'reference' },
      placeholder: MINIMAX_H3_REFERENCE_PROMPT_PLACEHOLDER,
    },
  ]);
  assert.equal(MINIMAX_H3_HELP_TOOLTIP.length, 3);
});

test('minimaxH3: media constraints match upload limits', () => {
  assert.deepEqual(MINIMAX_H3_MEDIA_CONSTRAINTS.image, {
    maxBytes: 30 * 1024 * 1024,
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'],
  });
  assert.deepEqual(MINIMAX_H3_MEDIA_CONSTRAINTS.video, {
    minDurationSeconds: 2,
    maxDurationSeconds: 15,
    maxBytes: 50 * 1024 * 1024,
    allowedExtensions: ['mp4', 'mov'],
  });
  assert.deepEqual(MINIMAX_H3_MEDIA_CONSTRAINTS.audio, {
    minDurationSeconds: 2,
    maxDurationSeconds: 15,
    maxBytes: 15 * 1024 * 1024,
    allowedExtensions: ['mp3', 'wav'],
  });
});
