import test from 'node:test';
import assert from 'node:assert/strict';
import zhCN from './zh-CN.js';
import enUS from './en-US.js';

const LOCALES = [
  ['zh-CN', zhCN],
  ['en-US', enUS],
];

const TEXT_PRESET_KEYS = ['noSelectedText', 'defaultMissing', 'shortcutRegistrationFailed'];
const CAPTURE_KEYS = [
  'unsupportedAction',
  'preparingGeneration',
  'nodeAdded',
  'actionFailed',
  'generationFailed',
  'generationStarted',
];
const CAPTURE_NODE_NAME_KEYS = ['sourceText', 'aiText', 'aiImage', 'aiVideo'];

test('global capture groups are nested under app so translateAppText can resolve them', () => {
  for (const [name, locale] of LOCALES) {
    assert.equal(typeof locale.app?.['globalTextPreset'], 'object', name + ' app.globalTextPreset');
    assert.equal(typeof locale.app?.['globalCapture'], 'object', name + ' app.globalCapture');
    assert.equal(locale['globalTextPreset'], undefined, name + ' root globalTextPreset');
    assert.equal(locale['globalCapture'], undefined, name + ' root globalCapture');
  }
});

test('globalTextPreset keeps the keys the renderer bridge resolves', () => {
  for (const [name, locale] of LOCALES) {
    for (const key of TEXT_PRESET_KEYS) {
      assert.equal(typeof locale.app['globalTextPreset'][key], 'string', name + ' globalTextPreset.' + key);
      assert.notEqual(locale.app['globalTextPreset'][key], '', name + ' globalTextPreset.' + key);
    }
  }
});

test('globalCapture keeps the keys the renderer bridge resolves', () => {
  for (const [name, locale] of LOCALES) {
    for (const key of CAPTURE_KEYS) {
      assert.equal(typeof locale.app['globalCapture'][key], 'string', name + ' globalCapture.' + key);
      assert.notEqual(locale.app['globalCapture'][key], '', name + ' globalCapture.' + key);
    }
    for (const key of CAPTURE_NODE_NAME_KEYS) {
      assert.equal(
        typeof locale.app['globalCapture']['nodeNames']?.[key],
        'string',
        name + ' globalCapture.nodeNames.' + key,
      );
    }
  }
});

test('both locales keep the same capture key set', () => {
  const shape = (locale) => ({
    textPreset: Object.keys(locale.app['globalTextPreset']).sort(),
    capture: Object.keys(locale.app['globalCapture']).sort(),
    nodeNames: Object.keys(locale.app['globalCapture']['nodeNames']).sort(),
  });
  assert.deepEqual(shape(zhCN), shape(enUS));
});

test('placeholder tokens used by the bridge survive in both locales', () => {
  for (const [name, locale] of LOCALES) {
    assert.match(locale.app['globalTextPreset']['shortcutRegistrationFailed'], /\{accelerator\}/, name);
    assert.match(locale.app['globalCapture']['actionFailed'], /\{reason\}/, name);
    assert.match(locale.app['globalCapture']['generationFailed'], /\{reason\}/, name);
  }
});

test('the four captured node name keys map to distinct labels', () => {
  for (const [name, locale] of LOCALES) {
    const labels = CAPTURE_NODE_NAME_KEYS.map((key) => locale.app['globalCapture']['nodeNames'][key]);
    assert.equal(new Set(labels).size, labels.length, name + ' duplicate capture node name');
  }
});
