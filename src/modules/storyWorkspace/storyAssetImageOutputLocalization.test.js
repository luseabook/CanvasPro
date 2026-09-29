import test from 'node:test';
import assert from 'node:assert/strict';

import { createStoryAssetImageLocalization } from './storyAssetImageOutputLocalization.js';

function createFixture() {
  const asset = {
    id: 'asset-a',
    appearances: [
      { id: 'appearance-a', imageUrl: 'https://example.com/original.png' },
    ],
  };
  const projectToken = { data: { assets: [asset] } };
  const applied = [];
  const localized = [];
  const localization = createStoryAssetImageLocalization({
    asset,
    appearance: asset.appearances[0],
    projectToken,
    isLive: (token) => token === projectToken,
    applyResult: (...args) => applied.push(args),
    onLocalized: async (...args) => localized.push(args),
  });
  return { applied, asset, localization, localized };
}

test('storyAssetImageOutputLocalization waits for remote commit before applying output', async () => {
  const fixture = createFixture();
  const payload = { imageUrl: 'blob:local-image' };

  assert.equal(
    await fixture.localization.options.onOutputLocalized(payload),
    false,
  );
  assert.equal(fixture.applied.length, 0);

  fixture.localization.commitRemote();
  await Promise.resolve();

  assert.equal(fixture.applied.length, 1);
  assert.equal(fixture.applied[0][0], fixture.asset);
  assert.equal(fixture.applied[0][1].id, 'appearance-a');
  assert.equal(fixture.applied[0][2], payload);
  assert.equal(fixture.localized.length, 1);
});

test('storyAssetImageOutputLocalization ignores failed or stale localization', async () => {
  const fixture = createFixture();
  const payload = { imageUrl: 'blob:local-image' };

  fixture.localization.options.onOutputLocalized(payload);
  fixture.localization.options.onOutputLocalizationFailed();
  fixture.localization.commitRemote();
  await Promise.resolve();
  assert.equal(fixture.applied.length, 0);

  const stale = createStoryAssetImageLocalization({
    asset: fixture.asset,
    appearance: fixture.asset.appearances[0],
    projectToken: { data: { assets: [fixture.asset] } },
    isLive: () => false,
    applyResult: () => {
      throw new Error('must not apply');
    },
  });
  stale.commitRemote();
  assert.equal(await stale.options.onOutputLocalized(payload), false);
});
