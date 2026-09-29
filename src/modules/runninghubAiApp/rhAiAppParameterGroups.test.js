import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createParameterGroupInteraction,
  renderGroupedPreviewParams,
} from './rhAiAppParameterGroups.js';

function makeParam(index, homeParamOrder, over = {}) {
  return {
    index,
    id: over.id ?? `p${index}`,
    componentKind: 'param',
    previewPlacement: 'home',
    homeParamOrder,
    ...over,
  };
}

function makeField(index, over = {}) {
  return {
    id: `p${index}`,
    type: 'text',
    defaultValue: `value-${index}`,
    customAiAppComponentIndex: index,
    ...over,
  };
}

test('renderGroupedPreviewParams renders grouped members and delegates ungrouped params', () => {
  const first = makeParam(1, 0, {
    footerGroupId: 'group-a',
    footerGroupLabel: 'A <group>',
    footerGroupDescription: 'Description',
  });
  const second = makeParam(2, 1, {
    footerGroupId: 'group-a',
    footerGroupLabel: 'A <group>',
    footerGroupDescription: 'Description',
  });
  const third = makeParam(3, 2);
  const delegated = [];
  const html = renderGroupedPreviewParams(
    [second, third, first],
    {
      models: [
        {
          uiSchema: {
            fields: [
              makeField(1),
              makeField(2),
              makeField(3, { id: 'p3' }),
            ],
          },
        },
      ],
    },
    (component, index) => {
      delegated.push([component, index]);
      return `<single-${component.index}>`;
    },
  );

  assert.match(html, /data-param-group="group-a"/);
  assert.match(html, /data-group-member="1"/);
  assert.match(html, /data-group-member="2"/);
  assert.match(html, /编辑参数组/);
  assert.match(html, /A &lt;group&gt;/);
  assert.equal(html.includes('<single-3>'), true);
  assert.deepEqual(delegated, [[third, 1]]);
});

test('renderGroupedPreviewParams tolerates an empty bundle when no groups are rendered', () => {
  const param = makeParam(1, 0);
  const delegated = [];
  const html = renderGroupedPreviewParams(
    [param],
    null,
    (component, index) => {
      delegated.push([component, index]);
      return '<single>';
    },
  );
  assert.equal(html, '<single>');
  assert.deepEqual(delegated, [[param, 0]]);
});

test('createParameterGroupInteraction ignores unrelated drags and binds cleanup', () => {
  const listeners = [];
  const documentListeners = [];
  const windowListeners = [];
  const documentObject = {
    activeElement: null,
    addEventListener(type, handler, options) {
      documentListeners.push([type, handler, options]);
    },
    removeEventListener(type, handler, options) {
      documentListeners.push(['remove', type, handler, options]);
    },
    defaultView: {
      addEventListener(type, handler) {
        windowListeners.push([type, handler]);
      },
      removeEventListener(type, handler) {
        windowListeners.push(['remove', type, handler]);
      },
    },
  };
  const panel = {
    ownerDocument: documentObject,
    querySelectorAll() {
      return [];
    },
    querySelector() {
      return null;
    },
    addEventListener(type, handler, options) {
      listeners.push([type, handler, options]);
    },
    removeEventListener(type, handler, options) {
      listeners.push(['remove', type, handler, options]);
    },
  };
  const interaction = createParameterGroupInteraction({
    componentDrafts: [],
    panel,
  });

  assert.equal(interaction.move({ dragKind: 'prompt', index: 1 }, 'params'), false);
  assert.equal(interaction.move({ dragKind: 'param', index: 99 }, 'params'), false);
  assert.equal(interaction.end({}, { type: 'pointerup' }, 'params'), false);

  const dispose = interaction.bind(panel);
  assert.equal(typeof dispose, 'function');
  assert.deepEqual(
    listeners.filter((entry) => entry[0] !== 'remove').map((entry) => entry[0]),
    ['keydown', 'click', 'change', 'scroll'],
  );
  assert.deepEqual(
    documentListeners.filter((entry) => entry[0] !== 'remove').map((entry) => entry[0]),
    ['pointerdown', 'keydown'],
  );
  assert.equal(windowListeners[0][0], 'resize');

  dispose();
  assert.equal(listeners.some((entry) => entry[0] === 'remove'), true);
  assert.equal(documentListeners.some((entry) => entry[0] === 'remove'), true);
  assert.equal(windowListeners.some((entry) => entry[0] === 'remove'), true);
});
