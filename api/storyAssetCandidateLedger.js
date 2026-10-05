const STORY_ASSET_CANDIDATE_KINDS = Object['freeze'](['character', 'scene', 'prop']),
  STORY_ASSET_CANDIDATE_KIND_SET = new Set(STORY_ASSET_CANDIDATE_KINDS);
function normalizeText(value) {
  return typeof value === 'string' ? value['trim']() : '';
}
function normalizeName(item) {
  return normalizeText(item)
    ['normalize']('NFKC')
    ['replace'](/^[\s，。！？；：、,.!?;:'"“”‘’（）()\[\]【】《》]+/u, '')
    ['replace'](/[\s，。！？；：、,.!?;:'"“”‘’（）()\[\]【】《》]+$/u, '')
    ['replace'](/\s+/gu, ' ');
}
function normalizeNameKey(key) {
  return normalizeName(key)['toLocaleLowerCase']();
}
function normalizeStringArray(index) {
  return [...new Set((Array['isArray'](index) ? index : [])['map'](normalizeText)['filter'](Boolean))];
}
function normalizeSourceSceneRefs(result) {
  return normalizeStringArray(result);
}
function sourceSceneRefsOverlap(list = [], data = []) {
  const list2 = normalizeSourceSceneRefs(list),
    list3 = normalizeSourceSceneRefs(data);
  if (!list2['length'] || !list3['length']) return true;
  const map = new Set(list3);
  return list2['some']((options) => map['has'](options));
}
function normalizeProbability(target) {
  const source = Number(target);
  if (!Number['isFinite'](source)) return null;
  return Math['max'](0, Math['min'](1, source));
}
function normalizeEvidence(error = {}) {
  const kind = normalizeText(error?.['kind']),
    name = normalizeName(error?.['name']),
    origin2 = normalizeText(error?.['origin']);
  if (!STORY_ASSET_CANDIDATE_KIND_SET['has'](kind) || !name || !origin2) return null;
  return {
    kind: kind,
    name: name,
    nameKey: normalizeNameKey(name),
    origin: origin2,
    sourceSceneRefs: normalizeSourceSceneRefs(error?.['sourceSceneRefs']),
    probability: normalizeProbability(error?.['probability']),
    authoritative: Boolean(error?.['authoritative']),
    explicitAsset: Boolean(error?.['explicitAsset']),
    assetRef: normalizeText(error?.['assetRef']),
  };
}
function createEvidenceCollector() {
  const list4 = [],
    map2 = new Set();
  return {
    add(next) {
      const evidence2 = normalizeEvidence(next);
      if (!evidence2) return;
      const current = JSON['stringify']([
        evidence2['kind'],
        evidence2['nameKey'],
        evidence2['origin'],
        evidence2['sourceSceneRefs'],
        evidence2['probability'],
        evidence2['authoritative'],
        evidence2['explicitAsset'],
        evidence2['assetRef'],
      ]);
      if (map2['has'](current)) return;
      (map2['add'](current), list4['push'](evidence2));
    },
    values() {
      return list4;
    },
  };
}
function createLocalEvidence(list5, entry) {
  list5['forEach']((record) => {
    const text = normalizeText(record?.['ref']),
      list6 = Array['isArray'](record?.['localEntityEvidence']) ? record['localEntityEvidence'] : [];
    if (list6['length']) {
      list6['forEach']((kind2) => {
        entry['add']({
          kind: kind2?.['kind'],
          name: kind2?.['text'] || kind2?.['name'],
          origin: 'local-extractor',
          sourceSceneRefs: [text],
          probability: kind2?.['probability'],
        });
      });
      return;
    }
    STORY_ASSET_CANDIDATE_KINDS['forEach']((kind3) => {
      normalizeStringArray(record?.['localEntityCandidates']?.[kind3])['forEach']((name2) => {
        entry['add']({
          kind: kind3,
          name: name2,
          origin: 'local-extractor',
          sourceSceneRefs: [text],
        });
      });
    });
  });
}
function createAuditEvidence(payload, handle) {
  (Array['isArray'](payload) ? payload : [])['forEach']((state) => {
    const sourceSceneRefs = [normalizeText(state?.['sourceSceneRef'])];
    (normalizeStringArray(state?.['characterNames'])['forEach']((name3) => {
      handle['add']({
        kind: 'character',
        name: name3,
        origin: 'inventory-audit',
        sourceSceneRefs: sourceSceneRefs,
      });
    }),
      normalizeStringArray(state?.['keyPropNames'])['forEach']((name4) => {
        handle['add']({
          kind: 'prop',
          name: name4,
          origin: 'inventory-audit',
          sourceSceneRefs: sourceSceneRefs,
        });
      }));
  });
}
function normalizeSceneSearchText(config) {
  return normalizeName(config)
    ['toLocaleLowerCase']()
    ['replace'](/[\s_\-—·•:：/\\|（）()\[\]【】]+/gu, '');
}
function sceneHeadingSupportsCandidate(scope, input) {
  if (normalizeText(scope?.['source']) === 'upload-fallback') return false;
  const list7 = normalizeSceneSearchText(scope?.['assetHeading'] || scope?.['heading']),
    list8 = normalizeSceneSearchText(input);
  if (!list7 || !list8) return false;
  if (list7['includes'](list8) || list8['includes'](list7)) return true;
  return normalizeName(input)
    ['split'](/[\s_\-—·•:：/\\|（）()\[\]【】]+/u)
    ['map'](normalizeSceneSearchText)
    ['some']((args) => [...args]['length'] >= 2 && list7['includes'](args));
}
function sceneBodySupportsCandidate(dom, output) {
  const list9 = normalizeText(dom?.['body'])['normalize']('NFKC')['toLocaleLowerCase'](),
    name5 = normalizeName(output)['toLocaleLowerCase']();
  return Boolean(list9 && name5 && list9['includes'](name5));
}
function collectMatchingEvidence(list10, { name: name6, sourceSceneRefs: sourceSceneRefs2 } = {}) {
  const nameKey = normalizeNameKey(name6);
  return list10['filter'](
    (value2) =>
      value2['nameKey'] === nameKey && sourceSceneRefsOverlap(value2['sourceSceneRefs'], sourceSceneRefs2),
  );
}
function getSupportedInventoryKinds({
  evidence: evidence3,
  sourceSceneByRef: sourceSceneByRef,
  name: name7,
  sourceSceneRefs: sourceSceneRefs3,
}) {
  const list11 = collectMatchingEvidence(evidence3, { name: name7, sourceSceneRefs: sourceSceneRefs3 }),
    args2 = new Set(
      list11['filter']((value3) => value3['origin'] === 'inventory-asset' && value3['explicitAsset'])['map'](
        (value4) => value4['kind'],
      ),
    );
  return new Set(
    [...args2]['filter']((value5) => {
      if (
        list11['some'](
          (value6) =>
            value6['kind'] === value5 && (value6['authoritative'] || value6['origin'] === 'local-extractor'),
        )
      )
        return true;
      if (value5 === 'prop') return true;
      const list12 = normalizeSourceSceneRefs(sourceSceneRefs3)
        ['map']((value7) => sourceSceneByRef['get'](value7))
        ['filter'](Boolean);
      if (value5 === 'scene')
        return (
          list12['some']((value8) => sceneHeadingSupportsCandidate(value8, name7)) ||
          list12['some']((value9) => sceneBodySupportsCandidate(value9, name7))
        );
      return false;
    }),
  );
}
function createDecision({
  kind: kind4,
  name: name8,
  sourceSceneRefs: sourceSceneRefs4,
  origin: origin3,
  status: status,
  reasonCode: reasonCode,
  conflictingKinds: conflictingKinds = [],
  evidence: evidence = [],
}) {
  return {
    kind: kind4,
    name: normalizeName(name8),
    sourceSceneRefs: normalizeSourceSceneRefs(sourceSceneRefs4),
    origin: origin3,
    status: status,
    reasonCode: reasonCode,
    conflictingKinds: normalizeStringArray(conflictingKinds),
    evidenceOrigins: normalizeStringArray(evidence['map']((value10) => value10['origin'])),
  };
}
function summarizeDecisions(list13 = []) {
  const map3 = new Map();
  list13['forEach']((error2) => {
    const value11 = JSON['stringify']([
      error2['kind'],
      normalizeNameKey(error2['name']),
      error2['sourceSceneRefs'],
      error2['origin'],
    ]);
    if (!map3['has'](value11)) map3['set'](value11, error2);
  });
  const decisions = [...map3['values']()],
    map4 = new Map();
  decisions['forEach']((error3) => {
    const value12 = JSON['stringify']([error3['kind'], normalizeNameKey(error3['name'])]),
      list14 = map4['get'](value12) || [];
    (list14['push'](error3), map4['set'](value12, list14));
  });
  const candidateCount = [...map4['values']()]['map'](
      (list15) =>
        list15['find']((response) => response['status'] === 'promoted') ||
        list15['find']((response2) => response2['status'] === 'absorbed') ||
        list15[0],
    ),
    byReason = {};
  return (
    candidateCount['forEach']((value13) => {
      byReason[value13['reasonCode']] = (byReason[value13['reasonCode']] || 0) + 1;
    }),
    {
      schemaVersion: 1,
      summary: {
        candidateCount: candidateCount['length'],
        promotedCount: candidateCount['filter']((response3) => response3['status'] === 'promoted')['length'],
        absorbedCount: candidateCount['filter']((response4) => response4['status'] === 'absorbed')['length'],
        quarantinedCount: candidateCount['filter']((response5) => response5['status'] === 'quarantined')[
          'length'
        ],
        byReason: byReason,
      },
      decisions: decisions,
    }
  );
}
export function createStoryAssetCandidateLedger({
  sourceScenes: sourceScenes = [],
  authoritativeAssets: authoritativeAssets = [],
  inventoryAssets: inventoryAssets = [],
  sceneAudits: sceneAudits = [],
} = {}) {
  const list16 = Array['isArray'](sourceScenes) ? sourceScenes : [],
    sourceSceneByRef2 = new Map(list16['map']((value14) => [normalizeText(value14?.['ref']), value14])),
    map5 = createEvidenceCollector();
  ((Array['isArray'](authoritativeAssets) ? authoritativeAssets : [])['forEach']((kind5) => {
    map5['add']({
      kind: kind5?.['kind'],
      name: kind5?.['name'],
      origin: 'structured-source',
      sourceSceneRefs: kind5?.['sourceSceneRefs'],
      authoritative: true,
      explicitAsset: true,
      assetRef: kind5?.['ref'],
    });
  }),
    createLocalEvidence(list16, map5),
    (Array['isArray'](inventoryAssets) ? inventoryAssets : [])['forEach']((kind6) => {
      map5['add']({
        kind: kind6?.['kind'],
        name: kind6?.['name'],
        origin: 'inventory-asset',
        sourceSceneRefs: kind6?.['sourceSceneRefs'],
        explicitAsset: true,
        assetRef: kind6?.['ref'],
      });
    }),
    createAuditEvidence(sceneAudits, map5));
  const evidence4 = map5['values'](),
    list17 = [],
    reviewAsset = (error4, { origin: origin = 'inventory-asset' } = {}) => {
      const kind7 = normalizeText(error4?.['kind']),
        name9 = normalizeName(error4?.['name']),
        sourceSceneRefs5 = normalizeSourceSceneRefs(error4?.['sourceSceneRefs']),
        evidence5 = collectMatchingEvidence(evidence4, {
          name: name9,
          sourceSceneRefs: origin === 'inventory-audit' ? [] : sourceSceneRefs5,
        }),
        args3 = new Set(
          evidence5['filter']((value15) => value15['authoritative'])['map']((value16) => value16['kind']),
        );
      let decision;
      if (!STORY_ASSET_CANDIDATE_KIND_SET['has'](kind7) || !name9)
        decision = createDecision({
          kind: kind7,
          name: name9,
          sourceSceneRefs: sourceSceneRefs5,
          origin: origin,
          status: 'quarantined',
          reasonCode: 'invalid-candidate',
          evidence: evidence5,
        });
      else {
        if (args3['size'] > 1)
          decision = createDecision({
            kind: kind7,
            name: name9,
            sourceSceneRefs: sourceSceneRefs5,
            origin: origin,
            status: 'quarantined',
            reasonCode: 'authoritative-kind-conflict',
            conflictingKinds: [...args3],
            evidence: evidence5,
          });
        else {
          if (args3['size'] === 1) {
            const status2 = [...args3][0],
              value17 = origin === 'structured-source' || origin === 'inventory-asset';
            decision = createDecision({
              kind: kind7,
              name: name9,
              sourceSceneRefs: sourceSceneRefs5,
              origin: origin,
              status: status2 === kind7 ? (value17 ? 'promoted' : 'absorbed') : 'quarantined',
              reasonCode:
                status2 === kind7
                  ? value17
                    ? 'authoritative-source'
                    : origin + '-matches-authoritative'
                  : 'authoritative-kind-mismatch',
              conflictingKinds: status2 === kind7 ? [] : [status2],
              evidence: evidence5,
            });
          } else {
            if (origin === 'structured-source')
              decision = createDecision({
                kind: kind7,
                name: name9,
                sourceSceneRefs: sourceSceneRefs5,
                origin: origin,
                status: 'promoted',
                reasonCode: 'authoritative-source',
                evidence: evidence5,
              });
            else {
              const map6 = getSupportedInventoryKinds({
                evidence: evidence4,
                sourceSceneByRef: sourceSceneByRef2,
                name: name9,
                sourceSceneRefs: origin === 'inventory-audit' ? [] : sourceSceneRefs5,
              });
              if (map6['size'] > 1)
                decision = createDecision({
                  kind: kind7,
                  name: name9,
                  sourceSceneRefs: sourceSceneRefs5,
                  origin: origin,
                  status: 'quarantined',
                  reasonCode: 'inventory-kind-conflict',
                  conflictingKinds: [...map6],
                  evidence: evidence5,
                });
              else {
                if (origin === 'inventory-asset' && map6['size'] === 1 && map6['has'](kind7)) {
                  const reasonCode2 = evidence5['some'](
                    (value18) => value18['kind'] === kind7 && value18['origin'] === 'local-extractor',
                  );
                  decision = createDecision({
                    kind: kind7,
                    name: name9,
                    sourceSceneRefs: sourceSceneRefs5,
                    origin: origin,
                    status: 'promoted',
                    reasonCode: reasonCode2
                      ? 'inventory-confirmed-local-proposal'
                      : 'inventory-confirmed-source-evidence',
                    evidence: evidence5,
                  });
                } else {
                  if (origin !== 'inventory-asset' && map6['size'] === 1 && map6['has'](kind7))
                    decision = createDecision({
                      kind: kind7,
                      name: name9,
                      sourceSceneRefs: sourceSceneRefs5,
                      origin: origin,
                      status: 'absorbed',
                      reasonCode:
                        origin === 'inventory-audit'
                          ? 'audit-matches-promoted-asset'
                          : 'proposal-matches-promoted-asset',
                      evidence: evidence5,
                    });
                  else {
                    if (origin === 'inventory-audit' && map6['size'] === 0) {
                      const evidence6 = collectMatchingEvidence(evidence4, {
                          name: name9,
                          sourceSceneRefs: sourceSceneRefs5,
                        }),
                        status3 = evidence6['some'](
                          (value19) => value19['kind'] === kind7 && value19['origin'] === 'local-extractor',
                        ),
                        args4 = new Set(
                          evidence6['filter'](
                            (value20) =>
                              value20['origin'] === 'inventory-asset' &&
                              value20['explicitAsset'] &&
                              value20['kind'] !== kind7,
                          )['map']((value21) => value21['kind']),
                        ),
                        args5 = new Set(
                          evidence6['filter'](
                            (value22) =>
                              value22['origin'] === 'inventory-audit' &&
                              value22['kind'] !== kind7 &&
                              evidence6['some'](
                                (value23) =>
                                  value23['origin'] === 'local-extractor' &&
                                  value23['kind'] === value22['kind'],
                              ),
                          )['map']((value24) => value24['kind']),
                        ),
                        list18 = evidence6['filter'](
                          (value25) =>
                            value25['origin'] === 'local-extractor' &&
                            value25['kind'] === kind7 &&
                            value25['probability'] != null,
                        )['map']((value26) => value26['probability']),
                        value27 = list18['length'] ? Math['max'](...list18) : null,
                        args6 = new Set(
                          evidence6['filter'](
                            (value28) => value28['origin'] === 'local-extractor' && value28['kind'] !== kind7,
                          )
                            ['map']((value29) => value29['kind'])
                            ['filter']((value30) => {
                              const list19 = evidence6['filter'](
                                  (value31) =>
                                    value31['origin'] === 'local-extractor' &&
                                    value31['kind'] === value30 &&
                                    value31['probability'] != null,
                                )['map']((value32) => value32['probability']),
                                count = list19['length'] ? Math['max'](...list19) : null;
                              return value27 == null || count == null || value27 - count < 0.15;
                            }),
                        ),
                        args7 = new Set([...args4, ...args5, ...args6]);
                      decision = createDecision({
                        kind: kind7,
                        name: name9,
                        sourceSceneRefs: sourceSceneRefs5,
                        origin: origin,
                        status: status3 && !args7['size'] ? 'promoted' : 'quarantined',
                        reasonCode:
                          status3 && !args7['size']
                            ? 'audit-confirmed-local-proposal'
                            : 'audit-cannot-promote',
                        conflictingKinds: [...args7],
                        evidence: evidence6,
                      });
                    } else
                      decision = createDecision({
                        kind: kind7,
                        name: name9,
                        sourceSceneRefs: sourceSceneRefs5,
                        origin: origin,
                        status: 'quarantined',
                        reasonCode:
                          origin === 'inventory-asset'
                            ? 'unsupported-inventory-candidate'
                            : origin === 'inventory-audit'
                              ? 'audit-cannot-promote'
                              : 'proposal-cannot-promote',
                        conflictingKinds: [...map6],
                        evidence: evidence5,
                      });
                  }
                }
              }
            }
          }
        }
      }
      return (list17['push'](decision), decision);
    };
  return (
    (Array['isArray'](authoritativeAssets) ? authoritativeAssets : [])['forEach']((value33) =>
      reviewAsset(value33, { origin: 'structured-source' }),
    ),
    (Array['isArray'](inventoryAssets) ? inventoryAssets : [])['forEach']((value34) =>
      reviewAsset(value34, { origin: 'inventory-asset' }),
    ),
    evidence4['filter'](
      (value35) => value35['origin'] === 'local-extractor' || value35['origin'] === 'inventory-audit',
    )['forEach']((kind8) => {
      reviewAsset(
        { kind: kind8['kind'], name: kind8['name'], sourceSceneRefs: kind8['sourceSceneRefs'] },
        { origin: kind8['origin'] },
      );
    }),
    {
      reviewAsset: reviewAsset,
      snapshot() {
        return summarizeDecisions(list17);
      },
    }
  );
}
