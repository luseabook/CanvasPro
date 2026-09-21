import test from 'node:test';
import assert from 'node:assert/strict';
import { hasAIGenMaskPreviewBaseImage } from './maskPreviewPolicy.js';
(test('aigen mask preview policy hides masks on empty generation nodes', () => {
  assert.equal(
    hasAIGenMaskPreviewBaseImage({
      type: 'ai-image',
      mask: 'output/mask/mask.png',
      maskPreview: 'output/mask_preview/mask-preview.png',
    }),
    false,
  );
}),
  test('aigen mask preview policy allows masks when a result image exists', () => {
    (assert.equal(
      hasAIGenMaskPreviewBaseImage({
        type: 'ai-image',
        imageUrl: '/output/result.png',
        maskPreview: 'output/mask_preview/mask-preview.png',
      }),
      true,
    ),
      assert.equal(
        hasAIGenMaskPreviewBaseImage({
          type: 'ai-image',
          images: [{ sourceUrl: '/output/result.png' }],
          maskPreview: 'output/mask_preview/mask-preview.png',
        }),
        true,
      ));
  }),
  test('aigen mask preview policy ignores error-only result records', () => {
    assert.equal(
      hasAIGenMaskPreviewBaseImage({
        type: 'ai-image',
        images: [{ error: 'failed', imageUrl: '/output/result.png' }],
        maskPreview: 'output/mask_preview/mask-preview.png',
      }),
      false,
    );
  }));
