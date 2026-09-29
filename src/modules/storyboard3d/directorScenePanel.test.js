import test from 'node:test';
import assert from 'node:assert/strict';

import { DirectorScenePanel } from './directorScenePanel.js';
import {
  createDefaultStoryboard3DTransform,
  createStoryboard3DProject,
} from './projectModel.js';

function createTarget(matchesSelector, dataset = {}, values = {}) {
  return {
    target: {
      matches: (selector) => selector === matchesSelector,
      dataset,
      value: '',
      checked: false,
      type: 'text',
      ...values,
    },
  };
}

function createFixture() {
  const idFactory = (() => {
    const counts = new Map();
    return (kind) => {
      const count = (counts.get(kind) || 0) + 1;
      counts.set(kind, count);
      return `${kind}-${count}`;
    };
  })();
  const project = createStoryboard3DProject({ id: 'project-a', idFactory });
  const runtime = {
    projection: null,
    committedView: null,
    getSceneView: () => ({ orbitYaw: 0, orbitPitch: 0, distance: 8 }),
    setViewProjection(mode) {
      this.projection = mode;
    },
    commitSceneView(view) {
      this.committedView = view;
    },
    directorScene: {
      surfaceHeight: () => 0,
      obstacles: () => [],
    },
    resolveObjectGroundPosition: () => 0,
  };
  let currentProject = project;
  const messages = [];
  let renders = 0;
  const binaryWrites = [];
  const timeline = {
    getRuntime: () => runtime,
    multiView: { toggle() {} },
    cameraPath: { points: () => [], objectId: '' },
    commitMutation({ mutate }) {
      currentProject = mutate(currentProject);
    },
    setMessage(message) {
      messages.push(message);
    },
    requestRender() {
      renders += 1;
    },
    getBinaryAssetRepository() {
      return {
        async put(record) {
          binaryWrites.push(record);
          return record;
        },
      };
    },
  };
  const controller = new DirectorScenePanel({
    context: () => ({
      project: currentProject,
      scene: currentProject.scenes[0],
      object: currentProject.scenes[0].objects[0],
    }),
    timeline,
  });
  return {
    binaryWrites,
    controller,
    getProject: () => currentProject,
    getRenders: () => renders,
    messages,
    runtime,
  };
}

test('directorScenePanel: renders scene, transform, and panorama controls', () => {
  const fixture = createFixture();
  const scene = fixture.getProject().scenes[0];
  scene.directorSettings = {
    displayMode: 'clay',
    labels: true,
    groundVisible: false,
    groundHeight: 1.5,
    panorama: {
      enabled: true,
      assetId: 'panorama-a',
      radius: 80,
      rotation: [0.1, 0.2, 0.3],
      history: [{ assetId: 'panorama-a', name: 'Sky & Clouds' }],
    },
  };

  const html = fixture.controller.render();
  assert.match(html, /data-director-scene/);
  assert.match(html, /aria-busy="false"/);
  assert.match(html, /<option value="clay" selected>/);
  assert.match(html, /data-director-scene="labels" checked/);
  assert.match(html, /data-director-scene="groundHeight" value="1.5"/);
  assert.match(html, /data-director-panorama="enabled" checked/);
  assert.match(html, /<option value="panorama-a" selected>Sky &amp; Clouds<\/option>/);
  assert.match(html, /data-director-scene-transform="scale" value="1"/);
});

test('directorScenePanel: writes scene settings and panorama values through mutations', () => {
  const fixture = createFixture();
  assert.equal(
    fixture.controller.change(
      createTarget('[data-director-scene]', { directorScene: 'labels' }, {
        type: 'checkbox',
        checked: true,
      }),
    ),
    true,
  );
  assert.equal(
    fixture.controller.change(
      createTarget('[data-director-panorama]', { directorPanorama: 'radius' }, {
        type: 'number',
        value: '120',
      }),
    ),
    true,
  );
  assert.equal(
    fixture.controller.change(
      createTarget('[data-director-panorama]', { directorPanorama: 'rotation-1' }, {
        type: 'number',
        value: '90',
      }),
    ),
    true,
  );
  assert.equal(
    fixture.controller.change(
      createTarget('[data-director-scene-transform]', { directorSceneTransform: 'x' }, {
        type: 'number',
        value: '2.5',
      }),
    ),
    true,
  );

  const settings = fixture.getProject().scenes[0].directorSettings;
  assert.equal(settings.labels, true);
  assert.equal(settings.panorama.radius, 120);
  assert.ok(Math.abs(settings.panorama.rotation[1] - Math.PI / 2) < 1e-9);
  assert.equal(fixture.controller.transform.x, 2.5);
});

test('directorScenePanel: applies axis views and whole-scene transforms', () => {
  const fixture = createFixture();
  const scene = fixture.getProject().scenes[0];
  const prop = {
    id: 'prop-a',
    type: 'prop',
    name: 'Prop',
    visible: true,
    locked: false,
    transform: createDefaultStoryboard3DTransform(),
  };
  scene.objects.push(prop);

  assert.equal(
    fixture.controller.click('timeline-scene-view', { dataset: { view: 'front' } }),
    true,
  );
  assert.equal(fixture.runtime.projection, 'orthographic');
  assert.equal(fixture.runtime.committedView.orbitYaw, 0);
  assert.equal(fixture.runtime.committedView.orbitPitch, 0);

  fixture.controller.transform = { x: 1, y: 2, z: 3, yaw: 0, scale: 2 };
  assert.equal(fixture.controller.click('timeline-scene-transform'), true);
  const transformed = fixture.getProject().scenes[0].objects.find((object) => object.id === 'prop-a');
  assert.deepEqual(transformed.transform.position, [1, 2, 3]);
  assert.deepEqual(transformed.transform.scale, [2, 2, 2]);
});

test('directorScenePanel: stores a validated panorama image and updates history', async () => {
  const fixture = createFixture();
  await fixture.controller.importPanorama({
    name: 'sky.jpg',
    type: 'image/jpeg',
    size: 128,
  });

  assert.equal(fixture.binaryWrites.length, 1);
  assert.equal(fixture.binaryWrites[0].kind, 'background');
  assert.equal(fixture.binaryWrites[0].primaryFile.name, 'sky.jpg');
  const settings = fixture.getProject().scenes[0].directorSettings;
  assert.equal(settings.panorama.enabled, true);
  assert.ok(settings.panorama.assetId.startsWith('panorama-'));
  assert.deepEqual(settings.panorama.history.at(-1), {
    assetId: settings.panorama.assetId,
    name: 'sky.jpg',
  });
  assert.equal(fixture.controller.loading, false);
  assert.equal(fixture.getRenders(), 2);
  assert.deepEqual(fixture.messages, []);
});
