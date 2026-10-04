import {
  formatPersonReplacementPersonLabel,
  isGeneratedPersonReplacementLabel,
  PERSON_REPLACEMENT_ORIENTATIONS,
} from './personReplacementProject.js';
import { assignPersonReplacementPromptIndexes } from './personReplacementPromptIdentity.js';
export const PERSON_REPLACEMENT_CUSTOM_LABEL_VALUE = '__person_replacement_custom_label__';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function getPersonReplacementBoundingBox(options = {}) {
  return options['locator']?.['bbox'] || options['bbox'] || null;
}
function comparePersonReplacementPeopleByPosition(item, key) {
  const box = getPersonReplacementBoundingBox(item),
    box2 = getPersonReplacementBoundingBox(key),
    index = box ? Number(box['x']) + Number(box['width']) / 0x2 : Infinity,
    result = box2 ? Number(box2['x']) + Number(box2['width']) / 0x2 : Infinity,
    data = box ? Number(box['y']) + Number(box['height']) / 0x2 : Infinity,
    target = box2 ? Number(box2['y']) + Number(box2['height']) / 0x2 : Infinity;
  return (
    index - result ||
    data - target ||
    normalizeText(item['id'])['localeCompare'](normalizeText(key['id']), 'zh-CN')
  );
}
export function getPersonReplacementIdentityCorrectionDraftKey(source, next) {
  const text = normalizeText(source),
    text2 = normalizeText(next);
  return text && text2 ? text + ':' + text2 : '';
}
export function normalizePersonReplacementIdentityCorrectionDrafts(options2 = {}, current = [], entry = []) {
  const record = options2 && typeof options2 === 'object' && !Array['isArray'](options2) ? options2 : {},
    map = new Set(
      (Array['isArray'](current) ? current : [])
        ['flatMap']((payload) =>
          (Array['isArray'](payload?.['people']) ? payload['people'] : [])['map']((handle) =>
            getPersonReplacementIdentityCorrectionDraftKey(payload['id'], handle['id']),
          ),
        )
        ['filter'](Boolean),
    ),
    map2 = new Set(
      [
        ...(Array['isArray'](entry) ? entry : [])['map']((state) => normalizeText(state?.['id'])),
        ...(Array['isArray'](current) ? current : [])['flatMap']((config) =>
          (Array['isArray'](config?.['people']) ? config['people'] : [])['map']((scope) =>
            normalizeText(scope?.['sourceCharacterId']),
          ),
        ),
      ]['filter'](Boolean),
    );
  return Object['fromEntries'](
    Object['entries'](record)['flatMap'](([input, enabled]) => {
      if (!map['has'](input) || !enabled || typeof enabled !== 'object') return [];
      const label = normalizeText(enabled['label']),
        sourceCharacterId = normalizeText(enabled['sourceCharacterId']),
        orientation =
          PERSON_REPLACEMENT_ORIENTATIONS['includes'](normalizeText(enabled['orientation'])) &&
          normalizeText(enabled['orientation']) !== 'unknown'
            ? normalizeText(enabled['orientation'])
            : '';
      if (!label && !orientation && !map2['has'](sourceCharacterId)) return [];
      return [
        [
          input,
          {
            ...(label ? { label: label } : {}),
            ...(map2['has'](sourceCharacterId) ? { sourceCharacterId: sourceCharacterId } : {}),
            ...(orientation ? { orientation: orientation } : {}),
          },
        ],
      ];
    }),
  );
}
export function getPersonReplacementReusableLabels(options3 = {}) {
  const list = [],
    map3 = new Set(),
    map4 = new Set(
      Array['isArray'](options3['workspace']?.['removedCustomPersonLabels'])
        ? options3['workspace']['removedCustomPersonLabels']['map'](normalizeText)['filter'](Boolean)
        : [],
    );
  return (
    (Array['isArray'](options3['shots']) ? options3['shots'] : [])['forEach']((output) => {
      (Array['isArray'](output?.['people']) ? output['people'] : [])['forEach']((value2) => {
        const text3 = normalizeText(value2?.['label']);
        if (!text3 || map4['has'](text3) || map3['has'](text3)) return;
        (map3['add'](text3), list['push'](text3));
      });
    }),
    list
  );
}
export function resolvePersonReplacementLabelSourceCharacterId(options4 = {}, value3 = '') {
  const text4 = normalizeText(value3);
  if (!text4) return '';
  for (const value4 of Array['isArray'](options4['shots']) ? options4['shots'] : []) {
    for (const value5 of Array['isArray'](value4?.['people']) ? value4['people'] : []) {
      if (normalizeText(value5?.['label']) !== text4) continue;
      const text5 = normalizeText(value5?.['sourceCharacterId']);
      if (text5) return text5;
    }
  }
  return normalizeText(
    (Array['isArray'](options4['sourceCharacters']) ? options4['sourceCharacters'] : [])['find'](
      (error) => normalizeText(error?.['name']) === text4,
    )?.['id'],
  );
}
export function getPersonReplacementLabelOptions({
  labels: labels = [],
  selectedLabel: selectedLabel = '',
  removedLabels: removedLabels = [],
  project: project = {},
} = {}) {
  const text6 = normalizeText(selectedLabel),
    map5 = new Set(
      (Array['isArray'](removedLabels) ? removedLabels : [])['map'](normalizeText)['filter'](Boolean),
    ),
    list2 = [...new Set((Array['isArray'](labels) ? labels : [])['map'](normalizeText)['filter'](Boolean))][
      'filter'
    ]((value6) => !map5['has'](value6));
  return (
    text6 && !map5['has'](text6) && !list2['includes'](text6) && list2['push'](text6),
    [
      ...list2['map']((value7) => ({
        value: value7,
        label: value7,
        sourceCharacterId: resolvePersonReplacementLabelSourceCharacterId(project, value7),
        deletable: !isGeneratedPersonReplacementLabel(value7),
      })),
      { value: PERSON_REPLACEMENT_CUSTOM_LABEL_VALUE, label: '自定义' },
    ]
  );
}
export function getPersonReplacementBoxedPeople(options5 = {}) {
  return (Array['isArray'](options5?.['people']) ? options5['people'] : [])
    ['filter']((value8) => getPersonReplacementBoundingBox(value8))
    ['sort'](comparePersonReplacementPeopleByPosition);
}
export function resolvePersonReplacementDetectionLabel(value9, value10, value11, value12) {
  const personReplacementIdentityCorrectionDraftKey = getPersonReplacementIdentityCorrectionDraftKey(
      value12,
      value9?.['id'],
    ),
    value13 =
      value11?.['workspace']?.['identityCorrectionDrafts']?.[personReplacementIdentityCorrectionDraftKey] ||
      {};
  return (
    normalizeText(value13['label']) ||
    normalizeText(value9?.['label']) ||
    formatPersonReplacementPersonLabel(value10)
  );
}
export function getPersonReplacementDuplicateRoleLabels(options6 = {}, value14 = {}) {
  const text7 = normalizeText(options6?.['id']) || normalizeText(value14?.['workspace']?.['selectedShotId']),
    map6 = new Map();
  return (
    getPersonReplacementBoxedPeople(options6)['forEach']((value15, value16) => {
      const personReplacementDetectionLabel = resolvePersonReplacementDetectionLabel(
        value15,
        value16,
        value14,
        text7,
      );
      map6['set'](
        personReplacementDetectionLabel,
        (map6['get'](personReplacementDetectionLabel) || 0x0) + 0x1,
      );
    }),
    [...map6['entries']()]['filter'](([, count]) => count > 0x1)['map'](([value17]) => value17)
  );
}
export function buildPersonReplacementSourceCharacters(value18, value19 = []) {
  const map7 = new Map(
      (Array['isArray'](value19) ? value19 : [])
        ['map']((value20) => [normalizeText(value20?.['id']), value20])
        ['filter'](([value21]) => value21),
    ),
    map8 = new Map();
  return (
    (Array['isArray'](value18) ? value18 : [])['forEach']((value22) => {
      (Array['isArray'](value22?.['people']) ? value22['people'] : [])['forEach']((value23) => {
        const id2 = normalizeText(value23?.['sourceCharacterId']);
        if (!id2) return;
        const error2 = map7['get'](id2) || {},
          enabled2 = map8['get'](id2) || {
            id: id2,
            name:
              normalizeText(error2['name']) ||
              normalizeText(value23['label']) ||
              '原人物' + (map8['size'] + 0x1),
            imageRefs: [],
            confidenceValues: [],
            reviewRequired: ![],
            identityReviewStatus: 'auto',
            memberCount: 0x0,
            exemplarShotId: normalizeText(error2['exemplarShotId']) || value22['id'],
            exemplarPersonId: normalizeText(error2['exemplarPersonId']) || value23['id'],
            ambiguousIdentityIds: new Set(error2['ambiguousIdentityIds'] || []),
            notes: normalizeText(error2['notes']),
          };
        value22['keyframeRef'] &&
          !enabled2['imageRefs']['includes'](value22['keyframeRef']) &&
          enabled2['imageRefs']['push'](value22['keyframeRef']);
        ((enabled2['memberCount'] += 0x1),
          enabled2['confidenceValues']['push'](Number(value23['identityConfidence']) || 0x0),
          (value23['ambiguousIdentityIds'] || [])['forEach']((value24) => {
            if (value24) enabled2['ambiguousIdentityIds']['add'](value24);
          }));
        if (value23['identityReviewStatus'] === 'needs_review' || value23['identityReviewRequired'] === !![])
          ((enabled2['reviewRequired'] = !![]), (enabled2['identityReviewStatus'] = 'needs_review'));
        else
          enabled2['identityReviewStatus'] !== 'needs_review' &&
            (value23['identityReviewStatus'] === 'confirmed' ||
              error2['identityReviewStatus'] === 'confirmed') &&
            (enabled2['identityReviewStatus'] = 'confirmed');
        (!enabled2['notes'] &&
          (enabled2['notes'] =
            value23['identityMethod'] === 'osnet'
              ? 'OSNet 跨镜头人物身份聚类'
              : value23['identityMethod'] === 'manual'
                ? '人工调整人物身份'
                : '自动检测人物身份'),
          map8['set'](id2, enabled2));
      });
    }),
    [...map8['values']()]['map']((id3) => ({
      id: id3['id'],
      name: id3['name'],
      imageRefs: id3['imageRefs'],
      confidence: id3['confidenceValues']['length'] ? Math['min'](...id3['confidenceValues']) : 0x0,
      reviewRequired: id3['reviewRequired'],
      identityReviewStatus: id3['identityReviewStatus'],
      memberCount: id3['memberCount'],
      exemplarShotId: id3['exemplarShotId'],
      exemplarPersonId: id3['exemplarPersonId'],
      ambiguousIdentityIds: [...id3['ambiguousIdentityIds']],
      notes: id3['notes'],
    }))
  );
}
export function normalizePersonReplacementBoundingBox(box3 = {}) {
  const x = Math['max'](0x0, Math['min'](0x1, Number(box3['x']) || 0x0)),
    y = Math['max'](0x0, Math['min'](0x1, Number(box3['y']) || 0x0));
  return {
    x: x,
    y: y,
    width: Math['max'](0x0, Math['min'](0x1 - x, Number(box3['width']) || 0x0)),
    height: Math['max'](0x0, Math['min'](0x1 - y, Number(box3['height']) || 0x0)),
  };
}
export function orderAndRelabelPersonReplacementPeople(list3 = []) {
  return assignPersonReplacementPromptIndexes(list3)
    ['sort']((value25, value26) => value25['promptMarkerIndex'] - value26['promptMarkerIndex'])
    ['map']((label2) => ({
      ...label2,
      label:
        label2['identityMethod'] === 'manual' && normalizeText(label2['label'])
          ? normalizeText(label2['label'])
          : formatPersonReplacementPersonLabel(label2['promptMarkerIndex']),
    }));
}
