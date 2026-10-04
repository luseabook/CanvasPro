import test from 'node:test';
import assert from 'node:assert/strict';
import { createTopAlignedAssetNodes, shouldTopAlignRestoredAsset } from './assetRestoreLayout.js';
(test('assetRestoreLayout: top-aligns flat media asset nodes', () => {
  const value = [
    { id: 'b', type: 'source-image', x: 0x12c, y: 80, width: 160, height: 240 },
    { id: 'a', type: 'source-video', x: 10, y: 20, width: 120, height: 200 },
    { id: 'c', type: 'ai-image', x: 0x1f4, y: 140, width: 180, height: 220 },
  ];
  assert.equal(shouldTopAlignRestoredAsset(value, []), true);
  const list = createTopAlignedAssetNodes(value, 24);
  assert.deepEqual(
    list.map((box) => [box.id, box.x, box.y, box.width, box.height]),
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
