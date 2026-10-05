import {
  getPersonReplacementCharacterBaseImageRef,
  normalizePersonReplacementScope,
  normalizePersonReplacementProject,
  normalizePersonReplacementShot,
  resolvePersonReplacementImageSourceRef,
} from './personReplacementProject.js';
import { PERSON_REPLACEMENT_ORIENTATION_ENABLED } from './personReplacementCapabilities.js';
import { buildPersonReplacementLocationGuideSvg } from './personReplacementLocationGuideSvg.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { resolvePersonReplacementPromptLabel } from './personReplacementPromptIdentity.js';
import {
  buildPersonReplacementPositioningPrompt,
  describePersonReplacementBoxPosition,
  getPersonReplacementPromptMarker,
  PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING,
  PERSON_REPLACEMENT_PROMPT_MODE_MANUAL,
  PERSON_REPLACEMENT_PROMPT_MODE_TEST,
} from './personReplacementPromptMode.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function comparePeopleByPosition(item, key) {
  const index = { left: 0, center: 1, right: 2, unknown: 3 },
    box = item['locator']?.['bbox'],
    box2 = key['locator']?.['bbox'],
    result = box ? box['x'] + box['width'] / 2 : Number['POSITIVE_INFINITY'],
    data = box2 ? box2['x'] + box2['width'] / 2 : Number['POSITIVE_INFINITY'];
  if (result !== data) return result - data;
  const options =
    (index[item['locator']?.['horizontal']] ?? 3) - (index[key['locator']?.['horizontal']] ?? 3);
  if (options) return options;
  return item['id']['localeCompare'](key['id'], 'zh-CN');
}
function normalizeCompilerInput(characters2 = {}) {
  const project = normalizePersonReplacementProject(
      characters2['project'] || {
        characters: characters2['characters'] || characters2['targetCharacters'],
        mappings: characters2['mappings'],
      },
    ),
    shot = normalizePersonReplacementShot(characters2['shot'] || {}, 0);
  return { project: project, shot: shot };
}
function getTargetCharacterId(target, map) {
  const text = normalizeText(target['targetCharacterId']);
  if (text) return text;
  if (target['projectMappingDisabled'] === !![]) return '';
  return map['get'](normalizeText(target['sourceCharacterId'])) || '';
}
function getTargetAppearanceImageRef(source, next = '') {
  const list = Array['isArray'](source?.['appearances']) ? source['appearances'] : [],
    current = list['find']((entry) => normalizeText(entry?.['id']) === normalizeText(next));
  return normalizeText(current?.['imageUrl']) || getPersonReplacementCharacterBaseImageRef(source);
}
function resolveSceneReference(record, payload) {
  const sceneId = normalizeText(payload['sceneReference']?.['sceneId']);
  if (!sceneId) return null;
  const scene = record['scenes']['find']((handle) => handle['id'] === sceneId);
  if (!scene) return { sceneId: sceneId, scene: null, imageRef: '' };
  return {
    sceneId: sceneId,
    scene: scene,
    appearanceId: normalizeText(payload['sceneReference']?.['appearanceId']),
    imageRef: getTargetAppearanceImageRef(scene, payload['sceneReference']?.['appearanceId']),
  };
}
function getPersonBoundingBox(options2 = {}) {
  return options2['locator']?.['bbox'] || options2['bbox'] || null;
}
export function isPersonReplacementSceneOnlyPromptPackage(enabled = {}) {
  return Number(enabled['sceneReferenceSlot']) > 0 && !enabled['mappedPersonIds']?.['length'];
}
export function buildPersonReplacementPromptPackage(options3 = {}) {
  const { project: project2, shot: shot2 } = normalizeCompilerInput(options3),
    activePersonIds = shot2['replacementPromptMode'] === PERSON_REPLACEMENT_PROMPT_MODE_MANUAL,
    enabled2 = shot2['replacementPromptMode'] === PERSON_REPLACEMENT_PROMPT_MODE_TEST,
    preservedPersonIds =
      enabled2 || shot2['replacementPromptMode'] === PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING,
    state = new Map(
      project2['mappings']['map']((config) => [config['sourceCharacterId'], config['targetCharacterId']]),
    ),
    map2 = new Map(project2['characters']['map']((scope) => [scope['id'], scope])),
    list2 = [...shot2['people']]['sort'](
      (input, output) => input['promptMarkerIndex'] - output['promptMarkerIndex'],
    ),
    list3 = preservedPersonIds ? list2['filter']((value2) => getTargetCharacterId(value2, state)) : list2,
    missingLocatorPersonIds = activePersonIds
      ? []
      : list3['filter']((value3) => !getPersonBoundingBox(value3))['map']((value4) => value4['id']),
    unresolvedOrientationPersonIds =
      !activePersonIds && PERSON_REPLACEMENT_ORIENTATION_ENABLED
        ? list3['filter']((value5) => normalizeText(value5['orientation']) === 'unknown')['map'](
            (value6) => value6['id'],
          )
        : [],
    referenceImages = [],
    map3 = new Map(),
    handler = (label) => {
      const value7 =
          (enabled2 && label['role'] === 'source-keyframe' ? 'annotated:' : '') +
          (localPathToUrl(label['ref']) || label['ref']),
        ref = map3['get'](value7);
      if (ref)
        return {
          ...label,
          ref: ref['ref'],
          slot: ref['slot'],
          label: '图' + ref['slot'],
        };
      const slot = referenceImages['length'] + 1,
        value8 = { ...label, slot: slot, label: label['label'] || '图' + slot };
      return (map3['set'](value7, value8), referenceImages['push'](value8), value8);
    },
    ref2 = resolvePersonReplacementImageSourceRef(shot2);
  if (ref2) handler({ slot: 1, label: '图像1', ref: ref2, role: 'source-keyframe' });
  const reference = new Map(),
    people = [],
    unmappedPersonIds = [],
    overflowPersonIds = [],
    warnings = [];
  list2['forEach']((person) => {
    if (!activePersonIds && !getPersonBoundingBox(person)) return;
    const targetCharacterId = getTargetCharacterId(person, state);
    if (!targetCharacterId) {
      if (!activePersonIds && !preservedPersonIds) unmappedPersonIds['push'](person['id']);
      return;
    }
    const error = map2['get'](targetCharacterId),
      ref3 = getTargetAppearanceImageRef(error, person['targetAppearanceId']);
    if (!error || !ref3) {
      !activePersonIds &&
        (unmappedPersonIds['push'](person['id']),
        warnings['push'](
          !error
            ? '未找到目标角色：' + targetCharacterId
            : '目标角色缺少参考图：' + (error['name'] || targetCharacterId),
        ));
      return;
    }
    const value9 = targetCharacterId + ':' + normalizeText(person['targetAppearanceId']);
    if (!reference['has'](value9)) {
      if (!activePersonIds && reference['size'] >= 8) {
        overflowPersonIds['push'](person['id']);
        return;
      }
      const value10 = handler({
        ref: ref3,
        role: 'target-character',
        targetCharacterId: targetCharacterId,
        targetAppearanceId: normalizeText(person['targetAppearanceId']),
      });
      reference['set'](value9, value10);
    }
    people['push']({
      person: person,
      sourceLabel: resolvePersonReplacementPromptLabel(person),
      reference: reference['get'](value9),
      scopeRequirement: { scope: normalizePersonReplacementScope(person['replacementScope']) },
    });
  });
  if (overflowPersonIds['length']) warnings['push']('单次最多替换 8 个目标人物');
  const annotatedSource =
      enabled2 && people['length'] && ref2
        ? {
            sourceRef: ref2,
            people: people['map'](({ person: person2, sourceLabel: sourceLabel, reference: reference2 }) => ({
              label: sourceLabel['replace']('人物', ''),
              referenceSlot: reference2['slot'],
              markerIndex: person2['promptMarkerIndex'],
              bbox: getPersonBoundingBox(person2),
            })),
          }
        : null,
    locationGuide =
      preservedPersonIds && !enabled2 && people['length'] && ref2
        ? {
            frame: shot2['frame'],
            people: people['map'](({ person: person3, sourceLabel: sourceLabel2 }) => ({
              label: sourceLabel2['replace']('人物', ''),
              markerIndex: person3['promptMarkerIndex'],
              bbox: getPersonBoundingBox(person3),
            })),
          }
        : null,
    slot2 = locationGuide ? referenceImages['length'] + 1 : 0;
  if (locationGuide)
    handler({
      slot: slot2,
      label: '图' + slot2,
      role: 'person-location-guide',
      ref: buildPersonReplacementLocationGuideSvg(locationGuide)['dataUrl'],
    });
  const ref4 = resolveSceneReference(project2, shot2);
  let sceneReferenceSlot = 0;
  if (ref4?.['scene'] && ref4['imageRef'])
    sceneReferenceSlot = handler({
      ref: ref4['imageRef'],
      role: 'target-scene',
      targetSceneId: ref4['sceneId'],
      targetSceneAppearanceId: ref4['appearanceId'],
    })['slot'];
  else
    ref4?.['sceneId'] &&
      !activePersonIds &&
      warnings['push'](
        ref4['scene'] ? '场景缺少参考图：' + ref4['scene']['name'] : '未找到场景：' + ref4['sceneId'],
      );
  const list4 = list2['filter'](getPersonBoundingBox)['sort'](comparePeopleByPosition),
    map4 = new Map(people['map']((value11) => [value11['person']['id'], value11])),
    personMarkers = activePersonIds
      ? []
      : list4['map']((personId, value12) => {
          const value13 = map4['get'](personId['id']),
            args = getPersonReplacementPromptMarker(
              shot2['replacementPromptMode'],
              preservedPersonIds ? personId['promptMarkerIndex'] : value12,
              list4['length'],
              value13?.['reference']['slot'],
            );
          preservedPersonIds &&
            ((args['label'] = resolvePersonReplacementPromptLabel(personId)['replace']('人物', '')),
            (args['position'] = describePersonReplacementBoxPosition(personId, list4)));
          if (value13) value13['marker'] = args;
          return { ...args, personId: personId['id'], bbox: getPersonBoundingBox(personId) };
        }),
    prompt = activePersonIds
      ? ''
      : people['length']
        ? buildPersonReplacementPositioningPrompt(
            people,
            sceneReferenceSlot,
            shot2['replacementPromptMode'],
            slot2,
          )
        : [
            '图1是待修改的原图，保持人物和构图。',
            sceneReferenceSlot ? '仅将背景替换为图' + sceneReferenceSlot + '中的场景，不引用其中人物。' : '',
          ]
            ['filter'](Boolean)
            ['join']('\n');
  return {
    promptMode: shot2['replacementPromptMode'],
    locationGuide: locationGuide,
    annotatedSource: annotatedSource,
    personMarkers: personMarkers,
    prompt: prompt,
    bindingPrompt: prompt,
    guidedBindingPrompt: prompt,
    bindings: people['map'](
      ({
        person: person4,
        sourceLabel: sourceLabel3,
        reference: reference3,
        scopeRequirement: scopeRequirement,
        marker: marker,
      }) => ({
        bbox: getPersonBoundingBox(person4),
        label: sourceLabel3,
        personId: person4['id'],
        markerLabel: marker?.['label'] || '',
        referenceLabel: reference3['label'],
        referenceSlot: reference3['slot'],
        replacementScope: scopeRequirement['scope'],
        sourceCharacterId: person4['sourceCharacterId'],
        targetAppearanceId: reference3['targetAppearanceId'],
        targetCharacterId: reference3['targetCharacterId'],
      }),
    ),
    referenceImages: referenceImages,
    mappedPersonIds: people['map'](({ person: person5 }) => person5['id']),
    activePersonIds: activePersonIds ? [] : list3['map']((value14) => value14['id']),
    preservedPersonIds: preservedPersonIds
      ? list2['filter']((value15) => !getTargetCharacterId(value15, state))['map']((value16) => value16['id'])
      : [],
    unmappedPersonIds: unmappedPersonIds,
    missingLocatorPersonIds: missingLocatorPersonIds,
    unresolvedOrientationPersonIds: unresolvedOrientationPersonIds,
    overflowPersonIds: overflowPersonIds,
    locationGuideSlot: slot2,
    sceneReferenceSlot: sceneReferenceSlot,
    warnings: warnings,
  };
}
export function compilePersonReplacementPrompt(options4 = {}) {
  return buildPersonReplacementPromptPackage(options4)['prompt'];
}
