import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyAudioWorkflowFooterSchemaControls,
  buildAudioWorkflowFooterHtml,
  isRhAiAppAudioWorkflow,
  isRunningHubAudioWorkflowItem,
  renderAudioWorkflowFooterSchemaControls,
  updateAudioModelTriggerIcon,
} from './audioFooterSchemaSlots.js';

function classList(initial = []) {
  const values = new Set(initial);
  return {
    values,
    add(...names) {
      names.forEach((name) => values.add(name));
    },
    remove(...names) {
      names.forEach((name) => values.delete(name));
    },
    contains(name) {
      return values.has(name);
    },
  };
}

test('audioFooterSchemaSlots identifies RunningHub workflow items exactly', () => {
  assert.equal(
    isRunningHubAudioWorkflowItem({ provider: ' RunningHubWF ', adapterType: ' Workflow ' }),
    true,
  );
  assert.equal(isRunningHubAudioWorkflowItem({ provider: 'runninghubwf' }), false);
  assert.equal(isRunningHubAudioWorkflowItem({ provider: 'runninghubwf', adapterType: 'model' }), false);
  assert.equal(isRunningHubAudioWorkflowItem(), false);
});

test('audioFooterSchemaSlots returns empty slots for unknown manifests', () => {
  const workflow = { key: 'missing/audio-workflow', provider: 'runninghubwf' };
  assert.deepEqual(renderAudioWorkflowFooterSchemaControls(workflow, {}), {
    batch: '',
    mode: '',
    advanced: '',
    instance: '',
  });
  assert.equal(isRhAiAppAudioWorkflow(workflow, {}), false);
});

test('buildAudioWorkflowFooterHtml renders model chrome, slots, and escaped labels', () => {
  const html = buildAudioWorkflowFooterHtml({
    workflow: {
      key: 'missing/audio-workflow',
      label: 'Voice <model>',
      provider: 'runninghubwf',
      icon: 'images/voice.png',
      iconAlt: 'voice',
    },
    nodeData: {},
    workflowItems: [],
    labels: {
      advanced: '<Advanced>',
      debugTitle: 'Debug',
      generateTitle: 'Generate',
    },
    debugIconHtml: '<debug-icon>',
  });

  assert.match(html, /class="img-model-pills"/);
  assert.match(html, /ui-schema-mode-slot/);
  assert.match(html, /ui-schema-batch-slot/);
  assert.match(html, /ui-schema-instance-slot/);
  assert.match(html, /data-tooltip="&lt;Advanced&gt;"/);
  assert.match(html, /<debug-icon>/);
  assert.match(html, /title="Generate"/);
});

test('applyAudioWorkflowFooterSchemaControls clears stale advanced state', () => {
  const modeSlot = { innerHTML: 'old-mode', style: {} };
  const instanceSlot = { innerHTML: 'old-instance', style: {} };
  const batchSlot = { innerHTML: 'old-batch', style: {} };
  const advancedPanel = { innerHTML: 'old-advanced', classList: classList(['show']) };
  const advancedWrap = { style: {} };
  const advancedButton = {
    attrs: {},
    classList: classList(['active']),
    setAttribute(name, value) {
      this.attrs[name] = String(value);
    },
  };

  const result = applyAudioWorkflowFooterSchemaControls({
    workflow: { key: 'missing/audio-workflow', provider: 'runninghubwf' },
    nodeData: {},
    modeSlot,
    advancedPanel,
    advancedWrap,
    advancedButton,
    instanceSlot,
    batchSlot,
  });

  assert.deepEqual(result, { batch: '', mode: '', advanced: '', instance: '' });
  assert.equal(modeSlot.innerHTML, '');
  assert.equal(modeSlot.style.display, 'none');
  assert.equal(instanceSlot.style.display, 'none');
  assert.equal(batchSlot.style.display, 'none');
  assert.equal(advancedPanel.innerHTML, '');
  assert.equal(advancedWrap.style.display, 'none');
  assert.equal(advancedPanel.classList.contains('show'), false);
  assert.equal(advancedButton.classList.contains('active'), false);
  assert.equal(advancedButton.attrs['aria-expanded'], 'false');
});

test('updateAudioModelTriggerIcon updates a plain image trigger', () => {
  const image = {
    attrs: {},
    setAttribute(name, value) {
      this.attrs[name] = value;
    },
  };
  const trigger = {
    querySelector(selector) {
      return selector === 'img' ? image : null;
    },
  };

  updateAudioModelTriggerIcon(trigger, { provider: 'volcengine-speech' });
  assert.equal(image.src, 'images/volcengine.svg');
  assert.equal(image.alt, 'volcengine-speech');
  assert.equal(image.attrs.src, 'images/volcengine.svg');
  assert.equal(image.attrs.alt, 'volcengine-speech');

  updateAudioModelTriggerIcon(trigger, { provider: 'runninghubwf' });
  assert.equal(image.src, 'images/RH.png');
  assert.equal(image.alt, 'runninghub');
});
