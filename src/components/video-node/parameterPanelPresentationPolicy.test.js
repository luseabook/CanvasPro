import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatVideoRatioResolutionLabel,
  getVideoCancelTooltip,
  getVideoGenerateTitle,
  getVideoModeLabel,
  manifestFixedSlotVisibilityReferencesField,
  manifestHelpVariantsReferenceField,
  manifestPromptVariantsReferenceField,
  resolveVideoAdaptiveRatioSource,
  resolveVideoModelApiFooterPlacementOrder,
  resolveVideoPromptPlaceholder,
  shouldShowVideoPromptInput,
  wrapUiSchemaPlacementControls,
} from './parameterPanelPresentationPolicy.js';

test('parameterPanelPresentationPolicy: localizes titles and ratio/resolution labels', () => {
  assert.equal(getVideoGenerateTitle().length > 0, true);
  assert.equal(getVideoCancelTooltip().length > 0, true);
  assert.match(formatVideoRatioResolutionLabel('16:9', '1080p'), /16:9/);
  assert.match(formatVideoRatioResolutionLabel('16:9', '1080p'), /1080p/);
  assert.equal(getVideoModeLabel('').length > 0, true);
});

test('parameterPanelPresentationPolicy: adaptive ratio honors preferred slots and video fallback', () => {
  const preferred = resolveVideoAdaptiveRatioSource({
    inEdges: [
      { id: 'edge-1', sourceId: 'video-1', refSlot: 'sourceVideo' },
      { id: 'edge-2', sourceId: 'image-1', refSlot: 'refImage' },
    ],
    nodes: {
      'video-1': { id: 'video-1', type: 'source-video' },
      'image-1': { id: 'image-1', type: 'source-image' },
    },
    nodeData: {},
    adaptivePolicy: { preferSlot: 'refImage' },
  });
  assert.equal(preferred.edge.id, 'edge-2');
  assert.equal(preferred.fallbackSquare, false);

  const fallback = resolveVideoAdaptiveRatioSource({
    inEdges: [{ id: 'edge-audio', sourceId: 'audio-1', refSlot: 'audio' }],
    nodes: { 'audio-1': { id: 'audio-1', type: 'source-audio' } },
    adaptivePolicy: { preferSlot: 'refImage', preferVideoKind: true, fallbackSquareWhenNoVideo: true },
  });
  assert.deepEqual(fallback, { edge: null, fallbackSquare: true });
});

test('parameterPanelPresentationPolicy: resolves conditional prompt placeholders and visibility', () => {
  const manifest = {
    prompt: {
      placeholder: 'fallback',
      variants: [
        {
          when: { field: 'mode', value: 'reference' },
          placeholder: 'reference placeholder',
        },
      ],
    },
  };
  assert.equal(
    resolveVideoPromptPlaceholder(manifest, { generationParams: { mode: 'reference' } }),
    'reference placeholder',
  );
  assert.equal(resolveVideoPromptPlaceholder(manifest, {}), 'fallback');
  assert.equal(shouldShowVideoPromptInput({ prompt: { visible: false } }), false);
  assert.equal(shouldShowVideoPromptInput({ prompt: { hidden: true } }), false);
  assert.equal(shouldShowVideoPromptInput({ prompt: {} }), true);
});

test('parameterPanelPresentationPolicy: detects nested variant references', () => {
  assert.equal(
    manifestHelpVariantsReferenceField(
      {
        help: {
          variants: [
            {
              when: { all: [{ field: 'mode', value: 'x' }, { any: [{ field: 'size' }] }] },
            },
          ],
        },
      },
      'size',
    ),
    true,
  );
  assert.equal(
    manifestPromptVariantsReferenceField(
      { prompt: { variants: [{ when: { field: 'mode', value: 'x' } }] } },
      'other',
    ),
    false,
  );
  assert.equal(
    manifestFixedSlotVisibilityReferencesField(
      {
        inputSlots: {
          fixedSlots: [{ hideWhen: { field: 'mode', value: 'video' } }],
        },
      },
      'mode',
    ),
    true,
  );
});

test('parameterPanelPresentationPolicy: orders footer controls and wraps only non-empty html', () => {
  assert.deepEqual(resolveVideoModelApiFooterPlacementOrder({}), ['resolution', 'mode']);
  assert.deepEqual(
    resolveVideoModelApiFooterPlacementOrder({
      uiSchema: { footerPlacementOrder: ['MODE', 'unknown', 'mode', 'resolution'] },
    }),
    ['mode', 'resolution'],
  );
  assert.equal(
    wrapUiSchemaPlacementControls('<span>controls</span>'),
    '<div class="ui-schema-placement"><span>controls</span></div>',
  );
  assert.equal(wrapUiSchemaPlacementControls(''), '');
});
