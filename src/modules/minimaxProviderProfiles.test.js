import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MINIMAX_DOMESTIC_PROFILE_ID,
  MINIMAX_INTERNATIONAL_PROFILE_ID,
  MINIMAX_MODEL_API_PROFILE_IDS,
  MINIMAX_MODEL_API_PROFILES,
  getMinimaxModelApiProfile,
} from './minimaxProviderProfiles.js';

test('exposes the two MiniMAX profile ids in order', () => {
  assert.equal(MINIMAX_DOMESTIC_PROFILE_ID, 'minimax');
  assert.equal(MINIMAX_INTERNATIONAL_PROFILE_ID, 'minimax-international');
  assert.deepEqual([...MINIMAX_MODEL_API_PROFILE_IDS], ['minimax', 'minimax-international']);
});

test('freezes the id list and the profile map', () => {
  assert.equal(Object.isFrozen(MINIMAX_MODEL_API_PROFILE_IDS), true);
  assert.equal(Object.isFrozen(MINIMAX_MODEL_API_PROFILES), true);
  assert.equal(Object.isFrozen(MINIMAX_MODEL_API_PROFILES[MINIMAX_DOMESTIC_PROFILE_ID]), true);
  assert.equal(Object.isFrozen(MINIMAX_MODEL_API_PROFILES[MINIMAX_INTERNATIONAL_PROFILE_ID]), true);
});

test('describes the domestic variant', () => {
  assert.deepEqual(
    { ...MINIMAX_MODEL_API_PROFILES[MINIMAX_DOMESTIC_PROFILE_ID] },
    {
      id: 'minimax',
      label: 'MiniMAX官方（国内版）',
      shortLabel: '国内',
      switchLabel: 'MiniMAX 官方国内版',
      credentialLabel: 'API Key',
      region: 'domestic',
      apiUrl: 'https://api.minimaxi.com',
    },
  );
});

test('describes the international variant', () => {
  assert.deepEqual(
    { ...MINIMAX_MODEL_API_PROFILES[MINIMAX_INTERNATIONAL_PROFILE_ID] },
    {
      id: 'minimax-international',
      label: 'MiniMAX官方（国际版）',
      shortLabel: '国际',
      switchLabel: 'MiniMAX 官方国际版',
      credentialLabel: 'API Key',
      region: 'international',
      apiUrl: 'https://api.minimax.io',
    },
  );
});

test('every profile id has a matching record whose id equals its key', () => {
  for (const id of MINIMAX_MODEL_API_PROFILE_IDS) {
    assert.equal(MINIMAX_MODEL_API_PROFILES[id].id, id);
  }
});

test('resolves a profile by exact id', () => {
  assert.equal(getMinimaxModelApiProfile('minimax').id, 'minimax');
  assert.equal(getMinimaxModelApiProfile('minimax-international').id, 'minimax-international');
});

test('trims surrounding whitespace before lookup', () => {
  assert.equal(getMinimaxModelApiProfile('  minimax-international ').id, 'minimax-international');
});

test('falls back to the domestic profile for unknown ids', () => {
  assert.equal(getMinimaxModelApiProfile('minimax-cn').id, 'minimax');
  assert.equal(getMinimaxModelApiProfile('MiniMax').id, 'minimax');
});

test('falls back to the domestic profile for empty and nullish input', () => {
  for (const value of [undefined, null, '', '   ', 0]) {
    assert.equal(getMinimaxModelApiProfile(value).id, 'minimax');
  }
});
