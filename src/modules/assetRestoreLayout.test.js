import test from 'node:test';
import assert from 'node:assert/strict';
import { createTopAlignedAssetNodes, shouldTopAlignRestoredAsset } from './assetRestoreLayout.js';
(test('assetRestoreLayout: top-aligns flat media asset nodes', () => {
  const _0x1f4d85 = [
    { id: 'b', type: 'source-image', x: 0x12c, y: 80, width: 160, height: 240 },
    { id: 'a', type: 'source-video', x: 10, y: 20, width: 120, height: 200 },
    { id: 'c', type: 'ai-image', x: 0x1f4, y: 140, width: 180, height: 220 },
  ];
  assert.equal(shouldTopAlignRestoredAsset(_0x1f4d85, []), true);
  const _0x299315 = createTopAlignedAssetNodes(_0x1f4d85, 24);
  assert.deepEqual(
    _0x299315.map((_0x1e5ab6) => [_0x1e5ab6.id, _0x1e5ab6.x, _0x1e5ab6.y, _0x1e5ab6.width, _0x1e5ab6.height]),
    [
      ['a', 0, 0, 120, 200],
      ['b', 144, 0, 160, 240],
      ['c', 0x148, 0, 180, 220],
    ],
  );
}),
  test('assetRestoreLayout: preserves graph assets and non-media layouts', () => {
    (assert.equal(
      shouldTopAlignRestoredAsset(
        [
          { id: 'a', type: 'source-image' },
          { id: 'b', type: 'ai-image' },
        ],
        [{ id: 'e1', sourceId: 'a', targetId: 'b' }],
      ),
      false,
    ),
      assert.equal(
        shouldTopAlignRestoredAsset([
          { id: 'a', type: 'source-image' },
          { id: 't', type: 'source-text' },
        ]),
        false,
      ));
  }));
