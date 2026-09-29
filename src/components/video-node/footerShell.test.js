import test from 'node:test';
import assert from 'node:assert/strict';

import { renderVideoFooterShell } from './footerShell.js';

function createFooter() {
  const button = { className: 'img-gen-btn' };
  return {
    button,
    dataset: {},
    innerHTML: '',
    querySelector: (selector) => (selector === '.img-gen-btn' ? button : null),
  };
}

test('footerShell: resets prior controllers and renders the video model/generate shell', () => {
  const footer = createFooter();
  const calls = [];
  const node = {
    _data: { model: '  runninghub/model-1  ', provider: 'runninghub' },
    rhVramAdvPanelEl: { stale: true },
    _uiSchemaCleanup() {
      calls.push('ui-cleanup');
    },
    _footerControllerCleanup() {
      calls.push('footer-cleanup');
    },
    _isRunninghubWorkflowModel(model, provider) {
      calls.push(['workflow-model', model, provider]);
      return true;
    },
    _getModelIconHTML(model, provider) {
      calls.push(['icon', model, provider]);
      return '<i class="model-icon"></i>';
    },
  };
  let triggerOptions = null;
  const panelText = [];

  renderVideoFooterShell(node, footer, {
    DEBUG_WRENCH_ICON_HTML: '<svg class="debug"></svg>',
    getDefaultVideoModelId: () => 'runninghub/default',
    getDisplayModelName: (model) => `Name:${model}`,
    getVideoCancelTooltip: () => 'Cancel task',
    getVideoGenerateTitle: () => 'Generate video',
    renderNodeModelTrigger: (options) => {
      triggerOptions = options;
      return '<button class="model-trigger">trigger</button>';
    },
    videoPanelText: (key) => {
      panelText.push(key);
      return `text:${key}`;
    },
  });

  assert.deepEqual(calls, [
    ['workflow-model', 'runninghub/model-1', 'runninghub'],
    'ui-cleanup',
    'footer-cleanup',
    ['icon', 'runninghub/model-1', 'runninghub'],
  ]);
  assert.equal(node._uiSchemaCleanup, null);
  assert.equal(node._footerControllerCleanup, null);
  assert.equal(node.rhVramAdvPanelEl, null);
  assert.equal(footer.dataset.deferredDetailsShell, '1');
  assert.equal(footer.dataset.rhVramAdvPanel, undefined);
  assert.equal(triggerOptions.label, 'Name:runninghub/model-1');
  assert.equal(triggerOptions.iconHtml, '<i class="model-icon"></i>');
  assert.equal(footer.innerHTML.includes('data-node-menu-kind="video"'), true);
  assert.equal(footer.innerHTML.includes('data-lazy-model-menu="video"'), true);
  assert.equal(footer.innerHTML.includes('<svg class="debug"></svg>'), true);
  assert.equal(footer.innerHTML.includes('data-tooltip="Cancel task"'), true);
  assert.deepEqual(panelText, ['debugApiParams']);
  assert.equal(node.btnEl, footer.button);
});

test('footerShell: uses the default model and generate title for non-workflow models', () => {
  const footer = createFooter();
  const node = {
    _data: {},
    _isRunninghubWorkflowModel: () => false,
    _getModelIconHTML: () => '<i></i>',
  };

  renderVideoFooterShell(node, footer, {
    DEBUG_WRENCH_ICON_HTML: '<svg></svg>',
    getDefaultVideoModelId: () => 'default-video',
    getDisplayModelName: (model) => model,
    getVideoCancelTooltip: () => 'Cancel',
    getVideoGenerateTitle: () => 'Generate',
    renderNodeModelTrigger: () => '<button></button>',
    videoPanelText: () => '',
  });

  assert.equal(footer.innerHTML.includes('title="Generate"'), true);
  assert.equal(footer.innerHTML.includes('data-tooltip="Cancel"'), false);
});

test('footerShell: ignores incomplete render inputs', () => {
  assert.equal(renderVideoFooterShell(null, createFooter(), {}), undefined);
  assert.equal(renderVideoFooterShell({}, null, {}), undefined);
});
