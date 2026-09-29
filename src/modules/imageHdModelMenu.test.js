import test from 'node:test';
import assert from 'node:assert/strict';
import { listModelManifests } from '../manifests/index.js';
import { getImageHdModelIds } from './imageHdModelMenu.js';

const expectedIds = () =>
  listModelManifests()
    .filter(
      (manifest) =>
        manifest.kind === 'image' &&
        manifest.adapterType === 'workflow' &&
        manifest.extensions?.imageHdMenu?.enabled === true,
    )
    .map((manifest) => manifest.modelId);

test('imageHdModelMenu: 只挑图像 + workflow + 显式开启 imageHdMenu 的模型', () => {
  assert.deepEqual(getImageHdModelIds(), expectedIds());
});

test('imageHdModelMenu: 每次调用都返回新数组，调用方改写不会污染下一次结果', () => {
  const first = getImageHdModelIds();
  const second = getImageHdModelIds();
  assert.notEqual(first, second);
  assert.deepEqual(first, second);
  first.push('sentinel');
  assert.deepEqual(getImageHdModelIds(), second);
});

test('imageHdModelMenu: 结果里不会出现非 workflow 的图像模型', () => {
  const ids = new Set(getImageHdModelIds());
  const nonWorkflowImages = listModelManifests().filter(
    (manifest) => manifest.kind === 'image' && manifest.adapterType !== 'workflow',
  );
  assert.ok(nonWorkflowImages.length > 0, '本仓确实有非 workflow 的图像模型，这条排除才有意义');
  for (const manifest of nonWorkflowImages) {
    assert.equal(ids.has(manifest.modelId), false, manifest.modelId + ' 不该出现在高清菜单里');
  }
});

test('imageHdModelMenu: 结果里每个 id 都对应一个 kind=image 的清单，不会漏出别的模态', () => {
  const byId = new Map(listModelManifests().map((manifest) => [manifest.modelId, manifest]));
  const ids = getImageHdModelIds();
  assert.equal(ids.length, expectedIds().length);
  for (const id of ids) {
    assert.equal(byId.get(id)?.kind, 'image', id + ' 必须是图像模型');
  }
});
