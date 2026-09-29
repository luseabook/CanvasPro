const STORY_ASSET_CANDIDATE_KINDS = Object['freeze'](['character', 'scene', 'prop']),
  STORY_ASSET_CANDIDATE_KIND_SET = new Set(STORY_ASSET_CANDIDATE_KINDS);
function normalizeText(_0x2e1b38) {
  return typeof _0x2e1b38 === 'string' ? _0x2e1b38['trim']() : '';
}
function normalizeName(_0x2710bf) {
  return normalizeText(_0x2710bf)
    ['normalize']('NFKC')
    ['replace'](/^[\s，。！？；：、,.!?;:'"“”‘’（）()\[\]【】《》]+/u, '')
    ['replace'](/[\s，。！？；：、,.!?;:'"“”‘’（）()\[\]【】《》]+$/u, '')
    ['replace'](/\s+/gu, '\x20');
}
function normalizeNameKey(_0xa9a00e) {
  return normalizeName(_0xa9a00e)['toLocaleLowerCase']();
}
function normalizeStringArray(_0x1ad4c1) {
  return [
    ...new Set((Array['isArray'](_0x1ad4c1) ? _0x1ad4c1 : [])['map'](normalizeText)['filter'](Boolean)),
  ];
}
function normalizeSourceSceneRefs(_0x2e15f4) {
  return normalizeStringArray(_0x2e15f4);
}
function sourceSceneRefsOverlap(_0x2d4ede = [], _0x26cb33 = []) {
  const _0x171f3a = normalizeSourceSceneRefs(_0x2d4ede),
    _0x1c4af6 = normalizeSourceSceneRefs(_0x26cb33);
  if (!_0x171f3a['length'] || !_0x1c4af6['length']) return !![];
  const _0x44f92d = new Set(_0x1c4af6);
  return _0x171f3a['some']((_0xc0a94c) => _0x44f92d['has'](_0xc0a94c));
}
function normalizeProbability(_0x428713) {
  const _0x586b49 = Number(_0x428713);
  if (!Number['isFinite'](_0x586b49)) return null;
  return Math['max'](0x0, Math['min'](0x1, _0x586b49));
}
function normalizeEvidence(_0x1aa455 = {}) {
  const _0x203f34 = normalizeText(_0x1aa455?.['kind']),
    _0x2effdf = normalizeName(_0x1aa455?.['name']),
    _0x481338 = normalizeText(_0x1aa455?.['origin']);
  if (!STORY_ASSET_CANDIDATE_KIND_SET['has'](_0x203f34) || !_0x2effdf || !_0x481338) return null;
  return {
    kind: _0x203f34,
    name: _0x2effdf,
    nameKey: normalizeNameKey(_0x2effdf),
    origin: _0x481338,
    sourceSceneRefs: normalizeSourceSceneRefs(_0x1aa455?.['sourceSceneRefs']),
    probability: normalizeProbability(_0x1aa455?.['probability']),
    authoritative: Boolean(_0x1aa455?.['authoritative']),
    explicitAsset: Boolean(_0x1aa455?.['explicitAsset']),
    assetRef: normalizeText(_0x1aa455?.['assetRef']),
  };
}
function createEvidenceCollector() {
  const _0x446623 = [],
    _0x55a993 = new Set();
  return {
    add(_0xe42ec4) {
      const _0x53860e = normalizeEvidence(_0xe42ec4);
      if (!_0x53860e) return;
      const _0x4d336a = JSON['stringify']([
        _0x53860e['kind'],
        _0x53860e['nameKey'],
        _0x53860e['origin'],
        _0x53860e['sourceSceneRefs'],
        _0x53860e['probability'],
        _0x53860e['authoritative'],
        _0x53860e['explicitAsset'],
        _0x53860e['assetRef'],
      ]);
      if (_0x55a993['has'](_0x4d336a)) return;
      (_0x55a993['add'](_0x4d336a), _0x446623['push'](_0x53860e));
    },
    values() {
      return _0x446623;
    },
  };
}
function createLocalEvidence(_0x3a3c67, _0x296a3b) {
  _0x3a3c67['forEach']((_0x593001) => {
    const _0x47c046 = normalizeText(_0x593001?.['ref']),
      _0x51d46c = Array['isArray'](_0x593001?.['localEntityEvidence'])
        ? _0x593001['localEntityEvidence']
        : [];
    if (_0x51d46c['length']) {
      _0x51d46c['forEach']((_0x52a626) => {
        _0x296a3b['add']({
          kind: _0x52a626?.['kind'],
          name: _0x52a626?.['text'] || _0x52a626?.['name'],
          origin: 'local-extractor',
          sourceSceneRefs: [_0x47c046],
          probability: _0x52a626?.['probability'],
        });
      });
      return;
    }
    STORY_ASSET_CANDIDATE_KINDS['forEach']((_0x977e7c) => {
      normalizeStringArray(_0x593001?.['localEntityCandidates']?.[_0x977e7c])['forEach']((_0x2b4ebd) => {
        _0x296a3b['add']({
          kind: _0x977e7c,
          name: _0x2b4ebd,
          origin: 'local-extractor',
          sourceSceneRefs: [_0x47c046],
        });
      });
    });
  });
}
function createAuditEvidence(_0xf1cecc, _0x3f3529) {
  (Array['isArray'](_0xf1cecc) ? _0xf1cecc : [])['forEach']((_0x2bdd62) => {
    const _0x5ba10a = [normalizeText(_0x2bdd62?.['sourceSceneRef'])];
    (normalizeStringArray(_0x2bdd62?.['characterNames'])['forEach']((_0x2541ad) => {
      _0x3f3529['add']({
        kind: 'character',
        name: _0x2541ad,
        origin: 'inventory-audit',
        sourceSceneRefs: _0x5ba10a,
      });
    }),
      normalizeStringArray(_0x2bdd62?.['keyPropNames'])['forEach']((_0xa6a740) => {
        _0x3f3529['add']({
          kind: 'prop',
          name: _0xa6a740,
          origin: 'inventory-audit',
          sourceSceneRefs: _0x5ba10a,
        });
      }));
  });
}
function normalizeSceneSearchText(_0x2eb4bb) {
  return normalizeName(_0x2eb4bb)
    ['toLocaleLowerCase']()
    ['replace'](/[\s_\-—·•:：/\\|（）()\[\]【】]+/gu, '');
}
function sceneHeadingSupportsCandidate(_0x44388c, _0x5ee5d5) {
  if (normalizeText(_0x44388c?.['source']) === 'upload-fallback') return ![];
  const _0x5a119f = normalizeSceneSearchText(_0x44388c?.['assetHeading'] || _0x44388c?.['heading']),
    _0x1a7684 = normalizeSceneSearchText(_0x5ee5d5);
  if (!_0x5a119f || !_0x1a7684) return ![];
  if (_0x5a119f['includes'](_0x1a7684) || _0x1a7684['includes'](_0x5a119f)) return !![];
  return normalizeName(_0x5ee5d5)
    ['split'](/[\s_\-—·•:：/\\|（）()\[\]【】]+/u)
    ['map'](normalizeSceneSearchText)
    ['some']((_0x418b85) => [..._0x418b85]['length'] >= 0x2 && _0x5a119f['includes'](_0x418b85));
}
function sceneBodySupportsCandidate(_0x227cb3, _0x46b055) {
  const _0x59532c = normalizeText(_0x227cb3?.['body'])['normalize']('NFKC')['toLocaleLowerCase'](),
    _0x188fe6 = normalizeName(_0x46b055)['toLocaleLowerCase']();
  return Boolean(_0x59532c && _0x188fe6 && _0x59532c['includes'](_0x188fe6));
}
function collectMatchingEvidence(_0x43af9c, { name: _0x4a9148, sourceSceneRefs: _0x2a2117 } = {}) {
  const _0x29a7cc = normalizeNameKey(_0x4a9148);
  return _0x43af9c['filter'](
    (_0x1b84a0) =>
      _0x1b84a0['nameKey'] === _0x29a7cc && sourceSceneRefsOverlap(_0x1b84a0['sourceSceneRefs'], _0x2a2117),
  );
}
function getSupportedInventoryKinds({
  evidence: _0x4888e9,
  sourceSceneByRef: _0x4314b1,
  name: _0x300134,
  sourceSceneRefs: _0x37f4a7,
}) {
  const _0x23775e = collectMatchingEvidence(_0x4888e9, { name: _0x300134, sourceSceneRefs: _0x37f4a7 }),
    _0x5be8c0 = new Set(
      _0x23775e['filter'](
        (_0x554088) => _0x554088['origin'] === 'inventory-asset' && _0x554088['explicitAsset'],
      )['map']((_0x350269) => _0x350269['kind']),
    );
  return new Set(
    [..._0x5be8c0]['filter']((_0x1a544d) => {
      if (
        _0x23775e['some'](
          (_0x14f31c) =>
            _0x14f31c['kind'] === _0x1a544d &&
            (_0x14f31c['authoritative'] || _0x14f31c['origin'] === 'local-extractor'),
        )
      )
        return !![];
      if (_0x1a544d === 'prop') return !![];
      const _0x4aa048 = normalizeSourceSceneRefs(_0x37f4a7)
        ['map']((_0x1e9fe8) => _0x4314b1['get'](_0x1e9fe8))
        ['filter'](Boolean);
      if (_0x1a544d === 'scene')
        return (
          _0x4aa048['some']((_0x2f15c0) => sceneHeadingSupportsCandidate(_0x2f15c0, _0x300134)) ||
          _0x4aa048['some']((_0x26b0cd) => sceneBodySupportsCandidate(_0x26b0cd, _0x300134))
        );
      return ![];
    }),
  );
}
function createDecision({
  kind: _0x1011d5,
  name: _0x37cab6,
  sourceSceneRefs: _0x40b35f,
  origin: _0x5a4a2a,
  status: _0x235383,
  reasonCode: _0x5ed432,
  conflictingKinds: conflictingKinds = [],
  evidence: evidence = [],
}) {
  return {
    kind: _0x1011d5,
    name: normalizeName(_0x37cab6),
    sourceSceneRefs: normalizeSourceSceneRefs(_0x40b35f),
    origin: _0x5a4a2a,
    status: _0x235383,
    reasonCode: _0x5ed432,
    conflictingKinds: normalizeStringArray(conflictingKinds),
    evidenceOrigins: normalizeStringArray(evidence['map']((_0x4f2e62) => _0x4f2e62['origin'])),
  };
}
function summarizeDecisions(_0x18b002 = []) {
  const _0x42f235 = new Map();
  _0x18b002['forEach']((_0x5b1ec8) => {
    const _0x2c4525 = JSON['stringify']([
      _0x5b1ec8['kind'],
      normalizeNameKey(_0x5b1ec8['name']),
      _0x5b1ec8['sourceSceneRefs'],
      _0x5b1ec8['origin'],
    ]);
    if (!_0x42f235['has'](_0x2c4525)) _0x42f235['set'](_0x2c4525, _0x5b1ec8);
  });
  const _0x30d54 = [..._0x42f235['values']()],
    _0x262ca9 = new Map();
  _0x30d54['forEach']((_0x553141) => {
    const _0x30cd09 = JSON['stringify']([_0x553141['kind'], normalizeNameKey(_0x553141['name'])]),
      _0xfb872f = _0x262ca9['get'](_0x30cd09) || [];
    (_0xfb872f['push'](_0x553141), _0x262ca9['set'](_0x30cd09, _0xfb872f));
  });
  const _0x3f2840 = [..._0x262ca9['values']()]['map'](
      (_0x4d3012) =>
        _0x4d3012['find']((_0x2ad5ac) => _0x2ad5ac['status'] === 'promoted') ||
        _0x4d3012['find']((_0x3dc820) => _0x3dc820['status'] === 'absorbed') ||
        _0x4d3012[0x0],
    ),
    _0x2c105c = {};
  return (
    _0x3f2840['forEach']((_0x46b255) => {
      _0x2c105c[_0x46b255['reasonCode']] = (_0x2c105c[_0x46b255['reasonCode']] || 0x0) + 0x1;
    }),
    {
      schemaVersion: 0x1,
      summary: {
        candidateCount: _0x3f2840['length'],
        promotedCount: _0x3f2840['filter']((_0x3c531a) => _0x3c531a['status'] === 'promoted')['length'],
        absorbedCount: _0x3f2840['filter']((_0xa132cf) => _0xa132cf['status'] === 'absorbed')['length'],
        quarantinedCount: _0x3f2840['filter']((_0x46d5dc) => _0x46d5dc['status'] === 'quarantined')['length'],
        byReason: _0x2c105c,
      },
      decisions: _0x30d54,
    }
  );
}
export function createStoryAssetCandidateLedger({
  sourceScenes: sourceScenes = [],
  authoritativeAssets: authoritativeAssets = [],
  inventoryAssets: inventoryAssets = [],
  sceneAudits: sceneAudits = [],
} = {}) {
  const _0x11c081 = Array['isArray'](sourceScenes) ? sourceScenes : [],
    _0x1895eb = new Map(_0x11c081['map']((_0x1f6b5a) => [normalizeText(_0x1f6b5a?.['ref']), _0x1f6b5a])),
    _0x60264a = createEvidenceCollector();
  ((Array['isArray'](authoritativeAssets) ? authoritativeAssets : [])['forEach']((_0x174773) => {
    _0x60264a['add']({
      kind: _0x174773?.['kind'],
      name: _0x174773?.['name'],
      origin: 'structured-source',
      sourceSceneRefs: _0x174773?.['sourceSceneRefs'],
      authoritative: !![],
      explicitAsset: !![],
      assetRef: _0x174773?.['ref'],
    });
  }),
    createLocalEvidence(_0x11c081, _0x60264a),
    (Array['isArray'](inventoryAssets) ? inventoryAssets : [])['forEach']((_0x34f521) => {
      _0x60264a['add']({
        kind: _0x34f521?.['kind'],
        name: _0x34f521?.['name'],
        origin: 'inventory-asset',
        sourceSceneRefs: _0x34f521?.['sourceSceneRefs'],
        explicitAsset: !![],
        assetRef: _0x34f521?.['ref'],
      });
    }),
    createAuditEvidence(sceneAudits, _0x60264a));
  const _0x18c5e2 = _0x60264a['values'](),
    _0x51abef = [],
    _0x393a60 = (_0x56f52d, { origin: origin = 'inventory-asset' } = {}) => {
      const _0x5057d8 = normalizeText(_0x56f52d?.['kind']),
        _0x584c5c = normalizeName(_0x56f52d?.['name']),
        _0x23eef2 = normalizeSourceSceneRefs(_0x56f52d?.['sourceSceneRefs']),
        _0x3bbc1e = collectMatchingEvidence(_0x18c5e2, {
          name: _0x584c5c,
          sourceSceneRefs: origin === 'inventory-audit' ? [] : _0x23eef2,
        }),
        _0x527e12 = new Set(
          _0x3bbc1e['filter']((_0x2e75a1) => _0x2e75a1['authoritative'])['map'](
            (_0x5a9a06) => _0x5a9a06['kind'],
          ),
        );
      let _0x51ad6d;
      if (!STORY_ASSET_CANDIDATE_KIND_SET['has'](_0x5057d8) || !_0x584c5c)
        _0x51ad6d = createDecision({
          kind: _0x5057d8,
          name: _0x584c5c,
          sourceSceneRefs: _0x23eef2,
          origin: origin,
          status: 'quarantined',
          reasonCode: 'invalid-candidate',
          evidence: _0x3bbc1e,
        });
      else {
        if (_0x527e12['size'] > 0x1)
          _0x51ad6d = createDecision({
            kind: _0x5057d8,
            name: _0x584c5c,
            sourceSceneRefs: _0x23eef2,
            origin: origin,
            status: 'quarantined',
            reasonCode: 'authoritative-kind-conflict',
            conflictingKinds: [..._0x527e12],
            evidence: _0x3bbc1e,
          });
        else {
          if (_0x527e12['size'] === 0x1) {
            const _0x529b5a = [..._0x527e12][0x0],
              _0x3c9335 = origin === 'structured-source' || origin === 'inventory-asset';
            _0x51ad6d = createDecision({
              kind: _0x5057d8,
              name: _0x584c5c,
              sourceSceneRefs: _0x23eef2,
              origin: origin,
              status: _0x529b5a === _0x5057d8 ? (_0x3c9335 ? 'promoted' : 'absorbed') : 'quarantined',
              reasonCode:
                _0x529b5a === _0x5057d8
                  ? _0x3c9335
                    ? 'authoritative-source'
                    : origin + '-matches-authoritative'
                  : 'authoritative-kind-mismatch',
              conflictingKinds: _0x529b5a === _0x5057d8 ? [] : [_0x529b5a],
              evidence: _0x3bbc1e,
            });
          } else {
            if (origin === 'structured-source')
              _0x51ad6d = createDecision({
                kind: _0x5057d8,
                name: _0x584c5c,
                sourceSceneRefs: _0x23eef2,
                origin: origin,
                status: 'promoted',
                reasonCode: 'authoritative-source',
                evidence: _0x3bbc1e,
              });
            else {
              const _0x4e52d4 = getSupportedInventoryKinds({
                evidence: _0x18c5e2,
                sourceSceneByRef: _0x1895eb,
                name: _0x584c5c,
                sourceSceneRefs: origin === 'inventory-audit' ? [] : _0x23eef2,
              });
              if (_0x4e52d4['size'] > 0x1)
                _0x51ad6d = createDecision({
                  kind: _0x5057d8,
                  name: _0x584c5c,
                  sourceSceneRefs: _0x23eef2,
                  origin: origin,
                  status: 'quarantined',
                  reasonCode: 'inventory-kind-conflict',
                  conflictingKinds: [..._0x4e52d4],
                  evidence: _0x3bbc1e,
                });
              else {
                if (
                  origin === 'inventory-asset' &&
                  _0x4e52d4['size'] === 0x1 &&
                  _0x4e52d4['has'](_0x5057d8)
                ) {
                  const _0x3dd478 = _0x3bbc1e['some'](
                    (_0x353060) =>
                      _0x353060['kind'] === _0x5057d8 && _0x353060['origin'] === 'local-extractor',
                  );
                  _0x51ad6d = createDecision({
                    kind: _0x5057d8,
                    name: _0x584c5c,
                    sourceSceneRefs: _0x23eef2,
                    origin: origin,
                    status: 'promoted',
                    reasonCode: _0x3dd478
                      ? 'inventory-confirmed-local-proposal'
                      : 'inventory-confirmed-source-evidence',
                    evidence: _0x3bbc1e,
                  });
                } else {
                  if (
                    origin !== 'inventory-asset' &&
                    _0x4e52d4['size'] === 0x1 &&
                    _0x4e52d4['has'](_0x5057d8)
                  )
                    _0x51ad6d = createDecision({
                      kind: _0x5057d8,
                      name: _0x584c5c,
                      sourceSceneRefs: _0x23eef2,
                      origin: origin,
                      status: 'absorbed',
                      reasonCode:
                        origin === 'inventory-audit'
                          ? 'audit-matches-promoted-asset'
                          : 'proposal-matches-promoted-asset',
                      evidence: _0x3bbc1e,
                    });
                  else {
                    if (origin === 'inventory-audit' && _0x4e52d4['size'] === 0x0) {
                      const _0x14079f = collectMatchingEvidence(_0x18c5e2, {
                          name: _0x584c5c,
                          sourceSceneRefs: _0x23eef2,
                        }),
                        _0x5c9b7d = _0x14079f['some'](
                          (_0x3fe017) =>
                            _0x3fe017['kind'] === _0x5057d8 && _0x3fe017['origin'] === 'local-extractor',
                        ),
                        _0x24eb0a = new Set(
                          _0x14079f['filter'](
                            (_0x2de424) =>
                              _0x2de424['origin'] === 'inventory-asset' &&
                              _0x2de424['explicitAsset'] &&
                              _0x2de424['kind'] !== _0x5057d8,
                          )['map']((_0x28b6bb) => _0x28b6bb['kind']),
                        ),
                        _0x296ee5 = new Set(
                          _0x14079f['filter'](
                            (_0x298887) =>
                              _0x298887['origin'] === 'inventory-audit' &&
                              _0x298887['kind'] !== _0x5057d8 &&
                              _0x14079f['some'](
                                (_0x5bb436) =>
                                  _0x5bb436['origin'] === 'local-extractor' &&
                                  _0x5bb436['kind'] === _0x298887['kind'],
                              ),
                          )['map']((_0x54cae9) => _0x54cae9['kind']),
                        ),
                        _0x50f0f2 = _0x14079f['filter'](
                          (_0x2302a9) =>
                            _0x2302a9['origin'] === 'local-extractor' &&
                            _0x2302a9['kind'] === _0x5057d8 &&
                            _0x2302a9['probability'] != null,
                        )['map']((_0x1594ea) => _0x1594ea['probability']),
                        _0x4b4ffe = _0x50f0f2['length'] ? Math['max'](..._0x50f0f2) : null,
                        _0xef29db = new Set(
                          _0x14079f['filter'](
                            (_0x4ef130) =>
                              _0x4ef130['origin'] === 'local-extractor' && _0x4ef130['kind'] !== _0x5057d8,
                          )
                            ['map']((_0xda1115) => _0xda1115['kind'])
                            ['filter']((_0x2352c5) => {
                              const _0x16484f = _0x14079f['filter'](
                                  (_0x366652) =>
                                    _0x366652['origin'] === 'local-extractor' &&
                                    _0x366652['kind'] === _0x2352c5 &&
                                    _0x366652['probability'] != null,
                                )['map']((_0x262fd7) => _0x262fd7['probability']),
                                _0xe144a6 = _0x16484f['length'] ? Math['max'](..._0x16484f) : null;
                              return _0x4b4ffe == null || _0xe144a6 == null || _0x4b4ffe - _0xe144a6 < 0.15;
                            }),
                        ),
                        _0x2fe066 = new Set([..._0x24eb0a, ..._0x296ee5, ..._0xef29db]);
                      _0x51ad6d = createDecision({
                        kind: _0x5057d8,
                        name: _0x584c5c,
                        sourceSceneRefs: _0x23eef2,
                        origin: origin,
                        status: _0x5c9b7d && !_0x2fe066['size'] ? 'promoted' : 'quarantined',
                        reasonCode:
                          _0x5c9b7d && !_0x2fe066['size']
                            ? 'audit-confirmed-local-proposal'
                            : 'audit-cannot-promote',
                        conflictingKinds: [..._0x2fe066],
                        evidence: _0x14079f,
                      });
                    } else
                      _0x51ad6d = createDecision({
                        kind: _0x5057d8,
                        name: _0x584c5c,
                        sourceSceneRefs: _0x23eef2,
                        origin: origin,
                        status: 'quarantined',
                        reasonCode:
                          origin === 'inventory-asset'
                            ? 'unsupported-inventory-candidate'
                            : origin === 'inventory-audit'
                              ? 'audit-cannot-promote'
                              : 'proposal-cannot-promote',
                        conflictingKinds: [..._0x4e52d4],
                        evidence: _0x3bbc1e,
                      });
                  }
                }
              }
            }
          }
        }
      }
      return (_0x51abef['push'](_0x51ad6d), _0x51ad6d);
    };
  return (
    (Array['isArray'](authoritativeAssets) ? authoritativeAssets : [])['forEach']((_0x1e4aca) =>
      _0x393a60(_0x1e4aca, { origin: 'structured-source' }),
    ),
    (Array['isArray'](inventoryAssets) ? inventoryAssets : [])['forEach']((_0x3143de) =>
      _0x393a60(_0x3143de, { origin: 'inventory-asset' }),
    ),
    _0x18c5e2['filter'](
      (_0xa2f88) => _0xa2f88['origin'] === 'local-extractor' || _0xa2f88['origin'] === 'inventory-audit',
    )['forEach']((_0x3d05f2) => {
      _0x393a60(
        { kind: _0x3d05f2['kind'], name: _0x3d05f2['name'], sourceSceneRefs: _0x3d05f2['sourceSceneRefs'] },
        { origin: _0x3d05f2['origin'] },
      );
    }),
    {
      reviewAsset: _0x393a60,
      snapshot() {
        return summarizeDecisions(_0x51abef);
      },
    }
  );
}
