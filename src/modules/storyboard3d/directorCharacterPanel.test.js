import test from 'node:test';
import assert from 'node:assert/strict';

import { DirectorCharacterPanel } from './directorCharacterPanel.js';
import {
  createDefaultStoryboard3DTransform,
  createStoryboard3DProject,
} from './projectModel.js';

function createTarget(matchesSelector, dataset = {}, values = {}) {
  const target = {
    matches: (selector) => selector === matchesSelector,
    dataset,
    value: '',
    checked: false,
    type: 'text',
    ...values,
  };
  return { target };
}

function createHarness(project) {
  const messages = [];
  let currentProject = project;
  let renders = 0;
  const timeline = {
    stopPlayback() {},
    commitMutation({ mutate }) {
      currentProject = mutate(currentProject);
      return currentProject;
    },
    setMessage(message) {
      messages.push(message);
    },
    requestRender() {
      renders += 1;
    },
  };
  return {
    controller: new DirectorCharacterPanel({
      context: () => ({
        project: currentProject,
        scene: currentProject.scenes[0],
        object: currentProject.scenes[0].objects.find((object) => object.type === 'character'),
      }),
      timeline,
    }),
    messages,
    getProject: () => currentProject,
    getRenders: () => renders,
  };
}

function createCharacter(overrides = {}) {
  const project = createStoryboard3DProject({
    id: 'project-a',
    name: 'Project A',
    idFactory: (() => {
      const counts = new Map();
      return (kind) => {
        const count = (counts.get(kind) || 0) + 1;
        counts.set(kind, count);
        return `${kind}-${count}`;
      };
    })(),
  });
  const scene = project.scenes[0];
  const character = {
    id: 'hero',
    type: 'character',
    name: 'Hero',
    locked: false,
    heightCm: 180,
    colorKey: 'red',
    bodyPresetId: 'default',
    actionPlaying: true,
    boneOverrides: {},
    transform: createDefaultStoryboard3DTransform(),
    ...overrides,
  };
  scene.objects.push(character);
  project.poseLibrary = [
    { id: 'pose-a', name: 'Pose A', boneOverrides: {} },
  ];
  return { project, scene, character };
}

test('directorCharacterPanel: renders character controls and escapes pose names', () => {
  const { project, character } = createCharacter();
  const harness = createHarness(project);
  harness.controller.poseName = 'Hero "<&';
  harness.controller.poseId = 'pose-a';

  const html = harness.controller.render();
  assert.match(html, /data-director-character/);
  assert.match(html, /data-director-character="heightCm"/);
  assert.match(html, /value="180"/);
  assert.match(html, /data-director-character="colorKey"/);
  assert.match(html, /<option value="red" selected>/);
  assert.match(html, /data-director-pose-name/);
  assert.match(html, /Hero &quot;&lt;&amp;/);
  assert.match(html, /<option value="pose-a" selected>Pose A<\/option>/);
  assert.match(html, /data-director-crowd="rows"/);
  assert.equal(character.locked, false);
});

test('directorCharacterPanel: updates appearance, crowd defaults, and pose channels', () => {
  const { project, character } = createCharacter();
  const harness = createHarness(project);

  assert.equal(
    harness.controller.change(
      createTarget('[data-director-character]', { directorCharacter: 'heightCm' }, {
        type: 'number',
        value: '195',
      }),
    ),
    true,
  );
  assert.equal(harness.getProject().scenes[0].objects.at(-1).heightCm, 195);

  assert.equal(
    harness.controller.change(
      createTarget('[data-director-crowd]', { directorCrowd: 'cols' }, { value: '4' }),
    ),
    true,
  );
  assert.equal(harness.controller.crowd.cols, 4);

  assert.equal(
    harness.controller.change(
      createTarget('[data-director-pose-channel]', { directorPoseChannel: '0' }, {
        type: 'number',
        value: '45',
      }),
    ),
    true,
  );
  const updated = harness.getProject().scenes[0].objects.at(-1);
  assert.equal(updated.actionPlaying, false);
  assert.ok(updated.boneOverrides.Head);

  const lockedProject = createCharacter({ locked: true }).project;
  const lockedHarness = createHarness(lockedProject);
  lockedHarness.controller.change(
    createTarget('[data-director-character]', { directorCharacter: 'heightCm' }, {
      type: 'number',
      value: '200',
    }),
  );
  assert.equal(lockedHarness.messages.length, 1);
  assert.equal(lockedHarness.getProject().scenes[0].objects.at(-1).heightCm, 180);
});

test('directorCharacterPanel: saves poses and creates a crowd through timeline mutations', () => {
  const { project } = createCharacter();
  const harness = createHarness(project);
  harness.controller.poseName = 'Saved pose';
  harness.controller.crowd = { rows: 1, cols: 2, spacing: 2, yaw: 0 };

  assert.equal(harness.controller.click('timeline-character-save-pose'), true);
  const savedProject = harness.getProject();
  assert.equal(savedProject.poseLibrary.length, 2);
  assert.equal(harness.controller.poseId, savedProject.poseLibrary[1].id);
  assert.equal(savedProject.poseLibrary[1].name, 'Saved pose');

  assert.equal(harness.controller.click('timeline-character-crowd'), true);
  assert.equal(harness.getProject().scenes[0].objects.length, 4);
  assert.equal(harness.getRenders(), 2);
});
