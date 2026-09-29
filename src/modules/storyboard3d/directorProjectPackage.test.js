import test from 'node:test';
import assert from 'node:assert/strict';

import {
  exportDirectorProjectPackage,
  importDirectorProjectPackage,
} from './directorProjectPackage.js';
import { createStoryboard3DProject } from './projectModel.js';

function createProject() {
  const project = createStoryboard3DProject({
    id: 'project-a',
    name: 'Project A',
    idFactory: () => 'id',
    now: 10,
  });
  project.scenes[0].objects.push({
    id: 'prop-1',
    type: 'prop',
    name: 'Prop',
    visible: true,
    locked: false,
    assetId: 'asset-a',
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  });
  return project;
}

test('directorProjectPackage: exports and imports project assets', async () => {
  const project = createProject();
  const repository = {
    async getMany(ids) {
      assert.deepEqual(ids, ['asset-a']);
      return [
        {
          assetId: 'asset-a',
          kind: 'model',
          descriptor: { name: 'Prop' },
          primaryFile: {
            blob: new Blob(['model-data'], { type: 'model/gltf-binary' }),
            name: 'prop.glb',
            type: 'model/gltf-binary',
          },
          relatedFiles: [],
        },
      ];
    },
  };

  const bundle = await exportDirectorProjectPackage(project, repository);
  assert.equal(bundle.type, 'application/octet-stream');
  assert.ok(bundle.size > 12);
  const header = new Uint8Array(await bundle.slice(0, 12).arrayBuffer());
  assert.equal(new TextDecoder().decode(header.slice(0, 8)), 'AIC3DP01');
  assert.ok(new DataView(header.buffer).getUint32(8, true) > 0);

  const stored = [];
  const imported = await importDirectorProjectPackage(bundle, {
    async put(record) {
      stored.push(record);
    },
    async remove() {},
  });
  assert.equal(stored.length, 1);
  assert.match(stored[0].assetId, /^package-/u);
  assert.equal(
    imported.scenes[0].objects.find((object) => object.type === 'prop').assetId,
    stored[0].assetId,
  );
  assert.equal(imported.name.startsWith(project.name), true);
  assert.notEqual(imported.name, project.name);
});

test('directorProjectPackage: rejects missing assets and malformed bundles', async () => {
  const project = createProject();
  project.scenes[0].background = {
    imageUrl: 'https://example.test/background.png',
    binaryAssetId: 'missing-asset',
  };
  await assert.rejects(
    exportDirectorProjectPackage(project, {
      async getMany() {
        return [];
      },
    }),
    Error,
  );

  await assert.rejects(importDirectorProjectPackage(new Blob(['short']), {}), Error);
  await assert.rejects(
    importDirectorProjectPackage(
      new Blob([new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 0, 0, 0, 0])]),
      {},
    ),
    Error,
  );
});
