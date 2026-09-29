import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeRandomSeedMode,
  resolveRandomSeedModeFromNodeData,
  resolveRandomSeedModeFromParams,
} from './randomSeedPolicy.js';

test('randomSeedPolicy: normalizes only random to the random mode', () => {
  assert.equal(normalizeRandomSeedMode(' RANDOM '), 'random');
  assert.equal(normalizeRandomSeedMode('fixed'), 'fixed');
  assert.equal(normalizeRandomSeedMode(null, 'random'), 'random');
  assert.equal(normalizeRandomSeedMode('unsupported'), 'fixed');
});

test('randomSeedPolicy: treats legacy numeric params as fixed seeds', () => {
  assert.deepEqual(resolveRandomSeedModeFromParams({ seed: 42 }, { modeField: 'seedMode' }), {
    mode: 'fixed',
    hasLegacyNumericSeed: true,
  });
  assert.deepEqual(
    resolveRandomSeedModeFromParams({ seed: '42', seedMode: 'random' }, { modeField: 'seedMode' }),
    { mode: 'random', hasLegacyNumericSeed: false },
  );
});

test('randomSeedPolicy: honors the configured mode field and default mode', () => {
  assert.deepEqual(
    resolveRandomSeedModeFromParams({ seed: 'abc' }, { modeField: 'seedMode', defaultMode: 'random' }),
    { mode: 'random', hasLegacyNumericSeed: false },
  );
  assert.deepEqual(resolveRandomSeedModeFromParams({ seed: 42 }, { modeField: '' }), {
    mode: 'fixed',
    hasLegacyNumericSeed: false,
  });
});

test('randomSeedPolicy: reads generationParams before node-level fields', () => {
  const result = resolveRandomSeedModeFromNodeData(
    {
      generationParams: { seed: '7', seedMode: 'random' },
      seed: '99',
      seedMode: 'fixed',
    },
    { modeField: 'seedMode' },
  );

  assert.deepEqual(result, { mode: 'random', hasLegacyNumericSeed: false });
});

test('randomSeedPolicy: falls back to node-level seed fields', () => {
  const result = resolveRandomSeedModeFromNodeData({ seed: 123 }, { modeField: 'seedMode' });

  assert.deepEqual(result, { mode: 'fixed', hasLegacyNumericSeed: true });
});
