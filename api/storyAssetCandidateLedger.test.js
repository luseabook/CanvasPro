import test from 'node:test';
import assert from 'node:assert/strict';

import { createStoryAssetCandidateLedger } from './storyAssetCandidateLedger.js';

test('storyAssetCandidateLedger: promotes authoritative and confirmed inventory assets', () => {
  const ledger = createStoryAssetCandidateLedger({
    sourceScenes: [
      {
        ref: 'scene-1',
        heading: 'Hero',
        body: 'Hero holds a key.',
        localEntityCandidates: {
          character: ['Hero'],
          prop: ['Key'],
        },
      },
    ],
    authoritativeAssets: [
      { ref: 'asset-hero', kind: 'character', name: 'Hero', sourceSceneRefs: ['scene-1'] },
    ],
    inventoryAssets: [{ ref: 'asset-key', kind: 'prop', name: 'Key', sourceSceneRefs: ['scene-1'] }],
    sceneAudits: [{ sourceSceneRef: 'scene-1', characterNames: ['Hero'], keyPropNames: ['Key'] }],
  });

  const snapshot = ledger.snapshot();
  assert.deepEqual(snapshot.summary, {
    candidateCount: 2,
    promotedCount: 2,
    absorbedCount: 0,
    quarantinedCount: 0,
    byReason: {
      'authoritative-source': 1,
      'inventory-confirmed-local-proposal': 1,
    },
  });
  assert.equal(snapshot.decisions.length, 6);
  assert.equal(
    snapshot.decisions.find((item) => item.origin === 'local-extractor' && item.kind === 'character').status,
    'absorbed',
  );
});

test('storyAssetCandidateLedger: quarantines authoritative kind conflicts', () => {
  const ledger = createStoryAssetCandidateLedger({
    authoritativeAssets: [
      { ref: 'asset-character', kind: 'character', name: 'Door' },
      { ref: 'asset-prop', kind: 'prop', name: 'Door' },
    ],
  });

  const decision = ledger.reviewAsset({ kind: 'character', name: 'Door' }, { origin: 'inventory-asset' });
  assert.equal(decision.status, 'quarantined');
  assert.equal(decision.reasonCode, 'authoritative-kind-conflict');
  assert.deepEqual(decision.conflictingKinds.sort(), ['character', 'prop']);
});
