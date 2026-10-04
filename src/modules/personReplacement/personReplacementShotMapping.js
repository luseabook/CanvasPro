import {
  getPersonReplacementBindingOccurrences,
  getPersonReplacementCrossRoleSourceCharacterIds,
} from './personReplacementProject.js';
import {
  resolvePersonReplacementImageGenerationState,
  updatePersonReplacementImageGenerationState,
} from './personReplacementImageGeneration.js';
import {
  resolvePersonReplacementVideoGenerationState,
  updatePersonReplacementVideoGenerationState,
} from './personReplacementVideoGeneration.js';
import { getWorkspaceAssetAppearances } from '../workspaceAssetAppearance.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export function reconcilePersonReplacementShotGenerationState(args, list) {
  if (!list['size']) return args;
  let updatePersonReplacementImageGenerationState2 = { ...args['workspace'] };
  return (
    list['forEach']((item) => {
      const personReplacementImageGenerationState = resolvePersonReplacementImageGenerationState(
        updatePersonReplacementImageGenerationState2,
        item,
      );
      updatePersonReplacementImageGenerationState2 = updatePersonReplacementImageGenerationState(
        updatePersonReplacementImageGenerationState2,
        personReplacementImageGenerationState['status'] === 'running'
          ? personReplacementImageGenerationState
          : { status: 'idle', shotId: item, error: '' },
      );
      const response = resolvePersonReplacementVideoGenerationState(
        updatePersonReplacementImageGenerationState2,
        item,
      );
      updatePersonReplacementImageGenerationState2 = updatePersonReplacementVideoGenerationState(
        updatePersonReplacementImageGenerationState2,
        response['status'] === 'running' ? response : { status: 'idle', shotId: item, error: '' },
      );
    }),
    { ...args, workspace: updatePersonReplacementImageGenerationState2 }
  );
}
export function applyPersonReplacementShotSceneReference(
  args2,
  { shotId: shotId = '', sceneId: sceneId = '', appearanceId: appearanceId = '' } = {},
  { reason: reason = 'scene-reference-change' } = {},
) {
  const text = normalizeText(shotId),
    text2 = normalizeText(sceneId),
    text3 = normalizeText(appearanceId),
    enabled = args2?.['shots']?.['find']((key) => key['id'] === text);
  if (!enabled) return null;
  if (text2) {
    const enabled2 = args2['scenes']['find']((index) => index['id'] === text2),
      workspaceAssetAppearances = getWorkspaceAssetAppearances(enabled2)['find'](
        (result) => result['id'] === text3,
      );
    if (!enabled2 || !workspaceAssetAppearances?.['imageUrl']) return null;
  }
  if (
    normalizeText(enabled['sceneReference']?.['sceneId']) === text2 &&
    normalizeText(enabled['sceneReference']?.['appearanceId']) === text3
  )
    return null;
  const data = new Set([text]),
    reconcilePersonReplacementShotGenerationState2 = reconcilePersonReplacementShotGenerationState(
      {
        ...args2,
        shots: args2['shots']['map']((args3) =>
          args3['id'] === text
            ? { ...args3, sceneReference: { sceneId: text2, appearanceId: text3 } }
            : args3,
        ),
      },
      data,
    );
  return { project: reconcilePersonReplacementShotGenerationState2, reason: reason, changedShotIds: data };
}
export function clearPersonReplacementShotPersonMappings(
  args4,
  {
    shotId: shotId = '',
    personId: personId = '',
    targetCharacterId: targetCharacterId = '',
    targetAppearanceId: targetAppearanceId = '',
  } = {},
  { reason: reason = 'person-mapping-clear' } = {},
) {
  const text4 = normalizeText(shotId),
    text5 = normalizeText(personId),
    text6 = normalizeText(targetCharacterId),
    text7 = normalizeText(targetAppearanceId);
  if (!text4 || (!text5 && !text6)) return null;
  const enabled3 = args4?.['shots']?.['find']((options) => options['id'] === text4);
  if (!enabled3) return null;
  const enabled4 = new Map(
      args4['mappings']['map']((target) => [
        normalizeText(target['sourceCharacterId']),
        normalizeText(target['targetCharacterId']),
      ]),
    ),
    list2 = enabled3['people']['filter']((source) => {
      if (text5) return source['id'] === text5;
      const text8 = normalizeText(source['sourceCharacterId']),
        text9 = normalizeText(source['targetCharacterId']) || enabled4['get'](text8) || '';
      return text9 === text6 && normalizeText(source['targetAppearanceId']) === text7;
    });
  if (!list2['length']) return null;
  const list3 = list2['flatMap']((next) =>
      getPersonReplacementBindingOccurrences(args4, { shotId: text4, personId: next['id'] }),
    ),
    current = new Set(list3['map']((entry) => entry['shotId'] + ':' + entry['personId'])),
    enabled5 = new Set(
      list3['map']((record) => normalizeText(record['sourceCharacterId']))['filter'](Boolean),
    ),
    enabled6 = new Set(),
    payload = args4['shots']['map']((args5) => {
      let enabled7 = ![];
      const handle = args5['people']['map']((args6) => {
        const text10 = normalizeText(args6['sourceCharacterId']),
          enabled8 = current['has'](args5['id'] + ':' + args6['id']);
        if (
          !enabled8 ||
          (!normalizeText(args6['targetCharacterId']) &&
            !normalizeText(args6['targetAppearanceId']) &&
            !enabled4['get'](text10))
        )
          return args6;
        return ((enabled7 = !![]), { ...args6, targetCharacterId: '', targetAppearanceId: '' });
      });
      if (!enabled7) return args5;
      return (enabled6['add'](args5['id']), { ...args5, people: handle });
    }),
    state = args4['mappings']['filter'](
      (config) => !enabled5['has'](normalizeText(config['sourceCharacterId'])),
    );
  if (!enabled6['size'] && state['length'] === args4['mappings']['length']) return null;
  const reconcilePersonReplacementShotGenerationState3 = reconcilePersonReplacementShotGenerationState(
    { ...args4, shots: payload, mappings: state },
    enabled6,
  );
  return {
    project: reconcilePersonReplacementShotGenerationState3,
    reason: reason,
    changedShotIds: enabled6,
  };
}
export function assignPersonReplacementShotPersonMapping(
  args7,
  {
    shotId: shotId = '',
    personId: personId = '',
    targetCharacterId: targetCharacterId = '',
    targetAppearanceId: targetAppearanceId = '',
    scope: scope = 'current',
  } = {},
) {
  const text11 = normalizeText(shotId),
    text12 = normalizeText(personId),
    text13 = normalizeText(targetCharacterId),
    text14 = normalizeText(targetAppearanceId);
  if (!text11 || !text12 || !text13 || !text14) return null;
  const input = args7?.['shots']?.['find']((output) => output['id'] === text11),
    enabled9 = input?.['people']['find']((value2) => value2['id'] === text12);
  if (!enabled9) return null;
  const text15 = normalizeText(scope)['toLowerCase']() !== 'current',
    list4 = text15
      ? getPersonReplacementBindingOccurrences(args7, { shotId: text11, personId: text12 })
      : [
          {
            shotId: text11,
            personId: text12,
            sourceCharacterId: normalizeText(enabled9['sourceCharacterId']),
          },
        ],
    value3 = new Set(list4['map']((value4) => value4['shotId'] + ':' + value4['personId'])),
    args8 = new Set(list4['map']((value5) => normalizeText(value5['sourceCharacterId']))['filter'](Boolean)),
    map = getPersonReplacementCrossRoleSourceCharacterIds(args7),
    args9 = new Set([...args8]['filter']((value6) => !map['has'](value6))),
    value7 = new Map(
      args7['mappings']['map']((value8) => [
        normalizeText(value8['sourceCharacterId']),
        normalizeText(value8['targetCharacterId']),
      ]),
    ),
    enabled10 = new Set(),
    value9 = args7['shots']['map']((args10) => {
      let enabled11 = ![];
      const value10 = args10['people']['map']((args11) => {
        const value11 = value3['has'](args10['id'] + ':' + args11['id']);
        if (value11) {
          if (
            normalizeText(args11['targetCharacterId']) === text13 &&
            normalizeText(args11['targetAppearanceId']) === text14
          )
            return args11;
          return ((enabled11 = !![]), { ...args11, targetCharacterId: text13, targetAppearanceId: text14 });
        }
        const text16 = normalizeText(args11['sourceCharacterId']),
          value12 = value7['get'](text16) || '',
          enabled12 = Boolean(
            text15 &&
            args8['has'](text16) &&
            map['has'](text16) &&
            value12 &&
            normalizeText(args11['targetCharacterId']) === value12,
          );
        if (!enabled12) return args11;
        return ((enabled11 = !![]), { ...args11, targetCharacterId: '', targetAppearanceId: '' });
      });
      if (!enabled11) return args10;
      return (enabled10['add'](args10['id']), { ...args10, people: value10 });
    }),
    value13 =
      text15 && args8['size']
        ? [
            ...args7['mappings']['filter'](
              (value14) => !args8['has'](normalizeText(value14['sourceCharacterId'])),
            ),
            ...[...args9]['map']((value15) => ({ sourceCharacterId: value15, targetCharacterId: text13 })),
          ]
        : args7['mappings'],
    enabled13 =
      text15 &&
      ([...args8]['some']((value16) => value7['has'](value16) && !args9['has'](value16)) ||
        [...args9]['some']((value17) => value7['get'](value17) !== text13));
  if (!enabled10['size'] && !enabled13) return null;
  const reconcilePersonReplacementShotGenerationState4 = reconcilePersonReplacementShotGenerationState(
    { ...args7, shots: value9, mappings: value13 },
    enabled10,
  );
  return {
    project: reconcilePersonReplacementShotGenerationState4,
    reason: text15 ? 'person-mapping' : 'person-mapping-current-shot',
    changedShotIds: enabled10,
  };
}
