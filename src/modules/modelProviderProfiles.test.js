import test from 'node:test';
import assert from 'node:assert/strict';

import { MODEL_PROVIDER_PROFILES, getModelProviderProfile } from './modelProviderProfiles.js';
import { AGNES_MODEL_API_PROFILES } from './agnesProviderProfiles.js';
import { MINIMAX_MODEL_API_PROFILES } from './minimaxProviderProfiles.js';
import { RUNNINGHUB_MODEL_API_PROFILES } from './runningHubProviderProfiles.js';

test('modelProviderProfiles: 档案表是冻结的，且合并了三个厂商来源', () => {
  assert.equal(Object.isFrozen(MODEL_PROVIDER_PROFILES), true);
  for (const source of [RUNNINGHUB_MODEL_API_PROFILES, AGNES_MODEL_API_PROFILES, MINIMAX_MODEL_API_PROFILES]) {
    for (const key of Object.keys(source)) {
      assert.equal(MODEL_PROVIDER_PROFILES[key], source[key], key + ' 应来自其源档案');
    }
  }
});

test('modelProviderProfiles: 三个来源的键都被并进了同一张表', () => {
  const expected = new Set([
    ...Object.keys(RUNNINGHUB_MODEL_API_PROFILES),
    ...Object.keys(AGNES_MODEL_API_PROFILES),
    ...Object.keys(MINIMAX_MODEL_API_PROFILES),
  ]);
  assert.deepEqual(Object.keys(MODEL_PROVIDER_PROFILES).sort(), [...expected].sort());
});

test('modelProviderProfiles: 取档案时会去掉首尾空白', () => {
  assert.equal(getModelProviderProfile('  runninghub  '), MODEL_PROVIDER_PROFILES.runninghub);
  assert.equal(getModelProviderProfile('runninghub'), MODEL_PROVIDER_PROFILES.runninghub);
});

test('modelProviderProfiles: 空值与未知 id 一律返回 null', () => {
  assert.equal(getModelProviderProfile(''), null);
  assert.equal(getModelProviderProfile('   '), null);
  assert.equal(getModelProviderProfile('zzz'), null);
  assert.equal(getModelProviderProfile(undefined), null);
  assert.equal(getModelProviderProfile(null), null);
});

test('modelProviderProfiles: 非字符串入参按字符串处理后仍然安全', () => {
  assert.equal(getModelProviderProfile(0), null);
  assert.equal(getModelProviderProfile({ toString: () => 'runninghub' }), MODEL_PROVIDER_PROFILES.runninghub);
});
