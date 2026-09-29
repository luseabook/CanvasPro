import {
  formatPersonReplacementPersonLabel,
  isGeneratedPersonReplacementLabel,
  PERSON_REPLACEMENT_ORIENTATIONS,
} from './personReplacementProject.js';
import { assignPersonReplacementPromptIndexes } from './personReplacementPromptIdentity.js';
export const PERSON_REPLACEMENT_CUSTOM_LABEL_VALUE = '__person_replacement_custom_label__';
function normalizeText(_0x84ec08) {
  return String(_0x84ec08 ?? '')['trim']();
}
function getPersonReplacementBoundingBox(_0x5bcd3d = {}) {
  return _0x5bcd3d['locator']?.['bbox'] || _0x5bcd3d['bbox'] || null;
}
function comparePersonReplacementPeopleByPosition(_0x5713f4, _0x4c0fbb) {
  const _0x25f323 = getPersonReplacementBoundingBox(_0x5713f4),
    _0x48c163 = getPersonReplacementBoundingBox(_0x4c0fbb),
    _0x5be378 = _0x25f323 ? Number(_0x25f323['x']) + Number(_0x25f323['width']) / 0x2 : Infinity,
    _0x46c7e0 = _0x48c163 ? Number(_0x48c163['x']) + Number(_0x48c163['width']) / 0x2 : Infinity,
    _0x3003c8 = _0x25f323 ? Number(_0x25f323['y']) + Number(_0x25f323['height']) / 0x2 : Infinity,
    _0x35b841 = _0x48c163 ? Number(_0x48c163['y']) + Number(_0x48c163['height']) / 0x2 : Infinity;
  return (
    _0x5be378 - _0x46c7e0 ||
    _0x3003c8 - _0x35b841 ||
    normalizeText(_0x5713f4['id'])['localeCompare'](normalizeText(_0x4c0fbb['id']), 'zh-CN')
  );
}
export function getPersonReplacementIdentityCorrectionDraftKey(_0x3cf7e1, _0x414ef6) {
  const _0x1535e8 = normalizeText(_0x3cf7e1),
    _0x3b094b = normalizeText(_0x414ef6);
  return _0x1535e8 && _0x3b094b ? _0x1535e8 + ':' + _0x3b094b : '';
}
export function normalizePersonReplacementIdentityCorrectionDrafts(
  _0x7c8b26 = {},
  _0x5a7661 = [],
  _0x5ec5da = [],
) {
  const _0xb66b70 =
      _0x7c8b26 && typeof _0x7c8b26 === 'object' && !Array['isArray'](_0x7c8b26) ? _0x7c8b26 : {},
    _0x15510b = new Set(
      (Array['isArray'](_0x5a7661) ? _0x5a7661 : [])
        ['flatMap']((_0x3dd037) =>
          (Array['isArray'](_0x3dd037?.['people']) ? _0x3dd037['people'] : [])['map']((_0x12cae9) =>
            getPersonReplacementIdentityCorrectionDraftKey(_0x3dd037['id'], _0x12cae9['id']),
          ),
        )
        ['filter'](Boolean),
    ),
    _0x298ff0 = new Set(
      [
        ...(Array['isArray'](_0x5ec5da) ? _0x5ec5da : [])['map']((_0x30eb11) =>
          normalizeText(_0x30eb11?.['id']),
        ),
        ...(Array['isArray'](_0x5a7661) ? _0x5a7661 : [])['flatMap']((_0x293c2b) =>
          (Array['isArray'](_0x293c2b?.['people']) ? _0x293c2b['people'] : [])['map']((_0xa6112) =>
            normalizeText(_0xa6112?.['sourceCharacterId']),
          ),
        ),
      ]['filter'](Boolean),
    );
  return Object['fromEntries'](
    Object['entries'](_0xb66b70)['flatMap'](([_0x4dd07d, _0x154fb9]) => {
      if (!_0x15510b['has'](_0x4dd07d) || !_0x154fb9 || typeof _0x154fb9 !== 'object') return [];
      const _0x596f01 = normalizeText(_0x154fb9['label']),
        _0x17d7f1 = normalizeText(_0x154fb9['sourceCharacterId']),
        _0x533648 =
          PERSON_REPLACEMENT_ORIENTATIONS['includes'](normalizeText(_0x154fb9['orientation'])) &&
          normalizeText(_0x154fb9['orientation']) !== 'unknown'
            ? normalizeText(_0x154fb9['orientation'])
            : '';
      if (!_0x596f01 && !_0x533648 && !_0x298ff0['has'](_0x17d7f1)) return [];
      return [
        [
          _0x4dd07d,
          {
            ...(_0x596f01 ? { label: _0x596f01 } : {}),
            ...(_0x298ff0['has'](_0x17d7f1) ? { sourceCharacterId: _0x17d7f1 } : {}),
            ...(_0x533648 ? { orientation: _0x533648 } : {}),
          },
        ],
      ];
    }),
  );
}
export function getPersonReplacementReusableLabels(_0x488a64 = {}) {
  const _0x231564 = [],
    _0x1e56b5 = new Set(),
    _0x55ad07 = new Set(
      Array['isArray'](_0x488a64['workspace']?.['removedCustomPersonLabels'])
        ? _0x488a64['workspace']['removedCustomPersonLabels']['map'](normalizeText)['filter'](Boolean)
        : [],
    );
  return (
    (Array['isArray'](_0x488a64['shots']) ? _0x488a64['shots'] : [])['forEach']((_0x12c201) => {
      (Array['isArray'](_0x12c201?.['people']) ? _0x12c201['people'] : [])['forEach']((_0x2d5d76) => {
        const _0x126d48 = normalizeText(_0x2d5d76?.['label']);
        if (!_0x126d48 || _0x55ad07['has'](_0x126d48) || _0x1e56b5['has'](_0x126d48)) return;
        (_0x1e56b5['add'](_0x126d48), _0x231564['push'](_0x126d48));
      });
    }),
    _0x231564
  );
}
export function resolvePersonReplacementLabelSourceCharacterId(_0x3d18f4 = {}, _0x816f91 = '') {
  const _0xbafa0c = normalizeText(_0x816f91);
  if (!_0xbafa0c) return '';
  for (const _0xb3abe8 of Array['isArray'](_0x3d18f4['shots']) ? _0x3d18f4['shots'] : []) {
    for (const _0xf5e790 of Array['isArray'](_0xb3abe8?.['people']) ? _0xb3abe8['people'] : []) {
      if (normalizeText(_0xf5e790?.['label']) !== _0xbafa0c) continue;
      const _0x4fc1d2 = normalizeText(_0xf5e790?.['sourceCharacterId']);
      if (_0x4fc1d2) return _0x4fc1d2;
    }
  }
  return normalizeText(
    (Array['isArray'](_0x3d18f4['sourceCharacters']) ? _0x3d18f4['sourceCharacters'] : [])['find'](
      (_0x4de23a) => normalizeText(_0x4de23a?.['name']) === _0xbafa0c,
    )?.['id'],
  );
}
export function getPersonReplacementLabelOptions({
  labels: labels = [],
  selectedLabel: selectedLabel = '',
  removedLabels: removedLabels = [],
  project: project = {},
} = {}) {
  const _0x14ec33 = normalizeText(selectedLabel),
    _0x2e0583 = new Set(
      (Array['isArray'](removedLabels) ? removedLabels : [])['map'](normalizeText)['filter'](Boolean),
    ),
    _0xb25598 = [
      ...new Set((Array['isArray'](labels) ? labels : [])['map'](normalizeText)['filter'](Boolean)),
    ]['filter']((_0x3cd647) => !_0x2e0583['has'](_0x3cd647));
  return (
    _0x14ec33 &&
      !_0x2e0583['has'](_0x14ec33) &&
      !_0xb25598['includes'](_0x14ec33) &&
      _0xb25598['push'](_0x14ec33),
    [
      ..._0xb25598['map']((_0x2102db) => ({
        value: _0x2102db,
        label: _0x2102db,
        sourceCharacterId: resolvePersonReplacementLabelSourceCharacterId(project, _0x2102db),
        deletable: !isGeneratedPersonReplacementLabel(_0x2102db),
      })),
      { value: PERSON_REPLACEMENT_CUSTOM_LABEL_VALUE, label: '自定义' },
    ]
  );
}
export function getPersonReplacementBoxedPeople(_0x3befad = {}) {
  return (Array['isArray'](_0x3befad?.['people']) ? _0x3befad['people'] : [])
    ['filter']((_0x4487d4) => getPersonReplacementBoundingBox(_0x4487d4))
    ['sort'](comparePersonReplacementPeopleByPosition);
}
export function resolvePersonReplacementDetectionLabel(_0x553201, _0x48d1ef, _0x4738e9, _0x42930e) {
  const _0x2fec56 = getPersonReplacementIdentityCorrectionDraftKey(_0x42930e, _0x553201?.['id']),
    _0x3ba967 = _0x4738e9?.['workspace']?.['identityCorrectionDrafts']?.[_0x2fec56] || {};
  return (
    normalizeText(_0x3ba967['label']) ||
    normalizeText(_0x553201?.['label']) ||
    formatPersonReplacementPersonLabel(_0x48d1ef)
  );
}
export function getPersonReplacementDuplicateRoleLabels(_0x17d846 = {}, _0x585797 = {}) {
  const _0x198f83 =
      normalizeText(_0x17d846?.['id']) || normalizeText(_0x585797?.['workspace']?.['selectedShotId']),
    _0x490d04 = new Map();
  return (
    getPersonReplacementBoxedPeople(_0x17d846)['forEach']((_0x45ad23, _0x2928d4) => {
      const _0x5250e7 = resolvePersonReplacementDetectionLabel(_0x45ad23, _0x2928d4, _0x585797, _0x198f83);
      _0x490d04['set'](_0x5250e7, (_0x490d04['get'](_0x5250e7) || 0x0) + 0x1);
    }),
    [..._0x490d04['entries']()]
      ['filter'](([, _0x586fd3]) => _0x586fd3 > 0x1)
      ['map'](([_0x186888]) => _0x186888)
  );
}
export function buildPersonReplacementSourceCharacters(_0x5667a5, _0x5dfbe0 = []) {
  const _0x57ab15 = new Map(
      (Array['isArray'](_0x5dfbe0) ? _0x5dfbe0 : [])
        ['map']((_0xe18c40) => [normalizeText(_0xe18c40?.['id']), _0xe18c40])
        ['filter'](([_0x299875]) => _0x299875),
    ),
    _0x387aec = new Map();
  return (
    (Array['isArray'](_0x5667a5) ? _0x5667a5 : [])['forEach']((_0x38a353) => {
      (Array['isArray'](_0x38a353?.['people']) ? _0x38a353['people'] : [])['forEach']((_0x2d0f6d) => {
        const _0x493704 = normalizeText(_0x2d0f6d?.['sourceCharacterId']);
        if (!_0x493704) return;
        const _0x906246 = _0x57ab15['get'](_0x493704) || {},
          _0x2e1440 = _0x387aec['get'](_0x493704) || {
            id: _0x493704,
            name:
              normalizeText(_0x906246['name']) ||
              normalizeText(_0x2d0f6d['label']) ||
              '原人物' + (_0x387aec['size'] + 0x1),
            imageRefs: [],
            confidenceValues: [],
            reviewRequired: ![],
            identityReviewStatus: 'auto',
            memberCount: 0x0,
            exemplarShotId: normalizeText(_0x906246['exemplarShotId']) || _0x38a353['id'],
            exemplarPersonId: normalizeText(_0x906246['exemplarPersonId']) || _0x2d0f6d['id'],
            ambiguousIdentityIds: new Set(_0x906246['ambiguousIdentityIds'] || []),
            notes: normalizeText(_0x906246['notes']),
          };
        _0x38a353['keyframeRef'] &&
          !_0x2e1440['imageRefs']['includes'](_0x38a353['keyframeRef']) &&
          _0x2e1440['imageRefs']['push'](_0x38a353['keyframeRef']);
        ((_0x2e1440['memberCount'] += 0x1),
          _0x2e1440['confidenceValues']['push'](Number(_0x2d0f6d['identityConfidence']) || 0x0),
          (_0x2d0f6d['ambiguousIdentityIds'] || [])['forEach']((_0x3b976d) => {
            if (_0x3b976d) _0x2e1440['ambiguousIdentityIds']['add'](_0x3b976d);
          }));
        if (
          _0x2d0f6d['identityReviewStatus'] === 'needs_review' ||
          _0x2d0f6d['identityReviewRequired'] === !![]
        )
          ((_0x2e1440['reviewRequired'] = !![]), (_0x2e1440['identityReviewStatus'] = 'needs_review'));
        else
          _0x2e1440['identityReviewStatus'] !== 'needs_review' &&
            (_0x2d0f6d['identityReviewStatus'] === 'confirmed' ||
              _0x906246['identityReviewStatus'] === 'confirmed') &&
            (_0x2e1440['identityReviewStatus'] = 'confirmed');
        (!_0x2e1440['notes'] &&
          (_0x2e1440['notes'] =
            _0x2d0f6d['identityMethod'] === 'osnet'
              ? 'OSNet 跨镜头人物身份聚类'
              : _0x2d0f6d['identityMethod'] === 'manual'
                ? '人工调整人物身份'
                : '自动检测人物身份'),
          _0x387aec['set'](_0x493704, _0x2e1440));
      });
    }),
    [..._0x387aec['values']()]['map']((_0x1b0cd3) => ({
      id: _0x1b0cd3['id'],
      name: _0x1b0cd3['name'],
      imageRefs: _0x1b0cd3['imageRefs'],
      confidence: _0x1b0cd3['confidenceValues']['length']
        ? Math['min'](..._0x1b0cd3['confidenceValues'])
        : 0x0,
      reviewRequired: _0x1b0cd3['reviewRequired'],
      identityReviewStatus: _0x1b0cd3['identityReviewStatus'],
      memberCount: _0x1b0cd3['memberCount'],
      exemplarShotId: _0x1b0cd3['exemplarShotId'],
      exemplarPersonId: _0x1b0cd3['exemplarPersonId'],
      ambiguousIdentityIds: [..._0x1b0cd3['ambiguousIdentityIds']],
      notes: _0x1b0cd3['notes'],
    }))
  );
}
export function normalizePersonReplacementBoundingBox(_0x372ea4 = {}) {
  const _0x568c50 = Math['max'](0x0, Math['min'](0x1, Number(_0x372ea4['x']) || 0x0)),
    _0x446d10 = Math['max'](0x0, Math['min'](0x1, Number(_0x372ea4['y']) || 0x0));
  return {
    x: _0x568c50,
    y: _0x446d10,
    width: Math['max'](0x0, Math['min'](0x1 - _0x568c50, Number(_0x372ea4['width']) || 0x0)),
    height: Math['max'](0x0, Math['min'](0x1 - _0x446d10, Number(_0x372ea4['height']) || 0x0)),
  };
}
export function orderAndRelabelPersonReplacementPeople(_0x52d4c0 = []) {
  return assignPersonReplacementPromptIndexes(_0x52d4c0)
    ['sort']((_0x66fba2, _0x4170ee) => _0x66fba2['promptMarkerIndex'] - _0x4170ee['promptMarkerIndex'])
    ['map']((_0x5e5eb2) => ({
      ..._0x5e5eb2,
      label:
        _0x5e5eb2['identityMethod'] === 'manual' && normalizeText(_0x5e5eb2['label'])
          ? normalizeText(_0x5e5eb2['label'])
          : formatPersonReplacementPersonLabel(_0x5e5eb2['promptMarkerIndex']),
    }));
}
