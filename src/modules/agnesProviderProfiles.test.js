import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AGNES_DOMESTIC_PROFILE_ID,
  AGNES_INTERNATIONAL_PROFILE_ID,
  AGNES_MODEL_API_PROFILE_IDS,
  AGNES_MODEL_API_PROFILES,
  getAgnesModelApiProfile,
} from './agnesProviderProfiles.js';

test('exposes the two Agnes profile ids in order', () => {
  assert.equal(AGNES_DOMESTIC_PROFILE_ID, 'agnes-domestic');
  assert.equal(AGNES_INTERNATIONAL_PROFILE_ID, 'agnes');
  assert.deepEqual([...AGNES_MODEL_API_PROFILE_IDS], ['agnes-domestic', 'agnes']);
});

test('freezes the id list and the profile map', () => {
  assert.equal(Object.isFrozen(AGNES_MODEL_API_PROFILE_IDS), true);
  assert.equal(Object.isFrozen(AGNES_MODEL_API_PROFILES), true);
  assert.equal(Object.isFrozen(AGNES_MODEL_API_PROFILES[AGNES_DOMESTIC_PROFILE_ID]), true);
  assert.equal(Object.isFrozen(AGNES_MODEL_API_PROFILES[AGNES_INTERNATIONAL_PROFILE_ID]), true);
});

test('describes the domestic variant with its endpoint and region', () => {
  const domestic = AGNES_MODEL_API_PROFILES[AGNES_DOMESTIC_PROFILE_ID];
  assert.deepEqual(
    { ...domestic },
    {
      id: 'agnes-domestic',
      label: 'Agnes AI（国内）',
      shortLabel: '国内',
      switchLabel: 'Agnes AI 国内版',
      credentialLabel: 'API Key',
      region: 'domestic',
      apiUrl: 'https://api.agnes-ai.cn',
    },
  );
});

test('describes the international variant with its endpoint and region', () => {
  const international = AGNES_MODEL_API_PROFILES[AGNES_INTERNATIONAL_PROFILE_ID];
  assert.deepEqual(
    { ...international },
    {
      id: 'agnes',
      label: 'Agnes AI（国际）',
      shortLabel: '国际',
      switchLabel: 'Agnes AI 国际版',
      credentialLabel: 'API Key',
      region: 'international',
      apiUrl: 'https://apihub.agnes-ai.com',
    },
  );
});

test('every profile id has a matching record whose id equals its key', () => {
  for (const id of AGNES_MODEL_API_PROFILE_IDS) {
    assert.equal(AGNES_MODEL_API_PROFILES[id].id, id);
  }
});

test('resolves a profile by exact id', () => {
  assert.equal(getAgnesModelApiProfile('agnes').id, 'agnes');
  assert.equal(getAgnesModelApiProfile('agnes-domestic').id, 'agnes-domestic');
});

test('trims surrounding whitespace before lookup', () => {
  assert.equal(getAgnesModelApiProfile('  agnes  ').id, 'agnes');
  assert.equal(getAgnesModelApiProfile('\tagnes-domestic\n').id, 'agnes-domestic');
});

test('falls back to the domestic profile for unknown ids', () => {
  assert.equal(getAgnesModelApiProfile('agnes-unknown').id, 'agnes-domestic');
  assert.equal(getAgnesModelApiProfile('AGNES').id, 'agnes-domestic');
});

test('falls back to the domestic profile for empty and nullish input', () => {
  for (const value of [undefined, null, '', '   ', 0]) {
    assert.equal(getAgnesModelApiProfile(value).id, 'agnes-domestic');
  }
});
