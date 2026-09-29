import test from 'node:test';
import assert from 'node:assert/strict';

import {
  APIMART_VIDEO_ADAPTIVE_RATIO_VALUE,
  APIMART_VIDEO_BASE_BODY_MAPPING,
  createApimartVideoBodyMapping,
  createAspectRatioField,
  createDurationField,
  createDurationSliderOptionsField,
  createResolutionField,
  createSegmentedField,
  createVideoExecutionManifest,
  createVideoInputSlots,
  createVideoMenuExtension,
  createVideoModelApiManifest,
  freezeBodyMapping,
  isAdaptiveRatioOptionValue,
  VIDEO_DURATION_FIELD,
} from './vendorVideoModelApiShared.js';

test('vendorVideoModelApiShared: builds frozen UI field contracts', () => {
  assert.equal(VIDEO_DURATION_FIELD.type, 'slider');
  assert.equal(isAdaptiveRatioOptionValue('AUTO'), true);
  assert.equal(isAdaptiveRatioOptionValue('16:9'), false);

  const segmented = createSegmentedField({
    id: 'quality',
    label: 'Quality',
    defaultValue: 'high',
    options: ['high', 'low'],
  });
  assert.equal(Object.isFrozen(segmented), true);
  assert.deepEqual(segmented.options, [
    { value: 'high', label: 'high' },
    { value: 'low', label: 'low' },
  ]);

  const duration = createDurationField({ defaultValue: 8, min: 2, max: 12 });
  assert.equal(duration.defaultValue, 8);
  assert.equal(duration.min, 2);
  assert.equal(duration.max, 12);

  const durationOptions = createDurationSliderOptionsField({ values: [4, 6, 8] });
  assert.deepEqual(
    durationOptions.options.map((option) => option.value),
    [4, 6, 8],
  );
  assert.equal(durationOptions.max, 8);

  const resolution = createResolutionField({ defaultValue: '1080P', options: ['720P', '1080P'] });
  assert.equal(resolution.defaultValue, '1080P');
  assert.deepEqual(
    resolution.options.map((option) => option.value),
    ['720P', '1080P'],
  );

  const ratio = createAspectRatioField({ options: ['16:9'] });
  assert.equal(ratio.options[0].value, APIMART_VIDEO_ADAPTIVE_RATIO_VALUE);
  assert.deepEqual(createVideoMenuExtension(12, 'subtitle'), {
    videoMenu: { role: 'apimartModel', order: 12, subtitle: 'subtitle' },
  });
});

test('vendorVideoModelApiShared: normalizes media input slots', () => {
  const slots = createVideoInputSlots({
    image: 2,
    video: 0,
    audio: 1,
    minImage: 1,
    fixedSlots: [{ id: 'referenceImage', kind: 'image' }],
    exclusiveGroups: [{ id: 'videoGroup', slots: ['first', null, ' reference ', 'last'] }],
    cycleFixedInputWhenFull: true,
    preserveHiddenInputsByKind: true,
    preserveHiddenInputsByKindFields: ['image', ' image ', 'video'],
    maxTotalDurationSecondsByKind: { video: 30 },
  });

  assert.equal(Object.isFrozen(slots), true);
  assert.deepEqual(slots.allowedKinds, ['text', 'image', 'audio']);
  assert.deepEqual(slots.minByKind, { text: 0, image: 1 });
  assert.deepEqual(slots.maxByKind, { image: 2, audio: 1 });
  assert.equal(slots.fixedSlots[0].id, 'referenceImage');
  assert.deepEqual(slots.exclusiveGroups[0].slots, ['first', 'reference', 'last']);
  assert.equal(slots.cycleFixedInputWhenFull, true);
  assert.deepEqual(slots.preserveHiddenInputsByKindFields, ['image', 'video']);
  assert.deepEqual(slots.maxTotalDurationSecondsByKind, { video: 30 });
});

test('vendorVideoModelApiShared: composes frozen body mappings', () => {
  const mapping = createApimartVideoBodyMapping([
    { path: 'duration', from: 'param', field: ['generationParams.duration', 'duration'] },
  ]);

  assert.equal(mapping.length, APIMART_VIDEO_BASE_BODY_MAPPING.length + 1);
  assert.equal(Object.isFrozen(mapping), true);
  assert.equal(Object.isFrozen(mapping[2]), true);
  assert.equal(Object.isFrozen(mapping[2].field), true);
  assert.equal(Object.isFrozen(freezeBodyMapping([{ path: 'x' }])), true);
});

test('vendorVideoModelApiShared: creates model API and execution manifests', () => {
  const model = createVideoModelApiManifest({
    modelId: 'vendor/video-1',
    executionId: 'vendor.model-api.video.video-1.v1',
    displayName: 'Video 1',
    provider: 'vendor',
    vip: true,
    aliases: ['video-one'],
    icon: 'V1',
    extensions: { bodyResolver: 'vendorVideo' },
  });

  assert.equal(model.adapterType, 'modelApi');
  assert.equal(model.vip, true);
  assert.equal(model.extensions.ratioPolicy.capability, 'size');
  assert.equal(model.extensions.bodyResolver, 'vendorVideo');
  assert.deepEqual(model.aliases, ['video-one']);
  assert.equal(model.uiSchema.footerPlacementOrder[0], 'mode');

  const execution = createVideoExecutionManifest({
    id: model.executionId,
    model: 'video-1',
    provider: 'vendor',
    endpoint: '/v1/video',
    extensions: { bodyResolver: 'vendorVideo' },
  });

  assert.equal(execution.id, model.executionId);
  assert.equal(execution.endpoint, '/v1/video');
  assert.equal(execution.method, 'POST');
  assert.equal(execution.extensions.bodyResolver, 'vendorVideo');
  assert.equal(execution.extensions.taskPolling.mode, 'task-proxy');
  assert.equal(execution.extensions.taskPolling.method, 'GET');
  assert.equal(execution.result.taskIdPath, 'task_id');
});
