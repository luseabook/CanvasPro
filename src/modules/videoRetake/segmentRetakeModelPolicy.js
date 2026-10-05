import { getModelManifest, getModelsByKind } from '../../manifests/index.js';
export const SEGMENT_RETAKE_PHASE_EDITING = 'editing';
export const SEGMENT_RETAKE_PHASE_SUBMITTED = 'submitted';
function getSegmentRetakeCapability(value) {
  const item = value?.['extensions']?.['segmentRetake'];
  return item && typeof item === 'object' ? item : null;
}
function getPlainObject(key) {
  return key && typeof key === 'object' && !Array['isArray'](key) ? key : {};
}
export function getSegmentRetakeParameterPolicy(enabled = {}) {
  if (!enabled?.['segmentRetake']) return null;
  const modelManifest = getModelManifest(String(enabled?.['model'] || '')['trim']()),
    segmentRetakeCapability = getSegmentRetakeCapability(modelManifest),
    index = segmentRetakeCapability?.['parameterPolicy'];
  return segmentRetakeCapability?.['supported'] === !![] && index && typeof index === 'object' ? index : null;
}
function buildForcedParameterPatch(result) {
  const data = {};
  for (const el of Object['values'](getPlainObject(result))) {
    const enabled2 = String(el?.['fieldId'] || '')['trim']();
    if (!enabled2 || !Object['prototype']['hasOwnProperty']['call'](el || {}, 'value')) continue;
    data[enabled2] = el['value'];
  }
  return data;
}
function releaseSegmentRetakeParameterLocks(args, options) {
  const args2 = getPlainObject(args?.['uiSchemaFieldState']),
    uiSchemaFieldState = { ...args2 };
  let target = ![];
  for (const [source, next] of Object['entries'](options)) {
    const el2 = getPlainObject(args2[source]),
      enabled3 =
        el2['segmentRetakeLocked'] === !![] ||
        (el2['disabled'] === !![] &&
          Object['prototype']['hasOwnProperty']['call'](el2, 'lockedValue') &&
          String(el2['lockedValue']) === String(next));
    if (!enabled3) continue;
    const el3 = { ...el2 };
    (delete el3['disabled'], delete el3['lockedValue'], delete el3['segmentRetakeLocked']);
    if (Object['keys'](el3)['length'] > 0) uiSchemaFieldState[source] = el3;
    else delete uiSchemaFieldState[source];
    target = !![];
  }
  return target ? { ...args, uiSchemaFieldState: uiSchemaFieldState } : args;
}
export function decorateSegmentRetakeParameterNodeData(args3 = {}) {
  const segmentRetakeParameterPolicy = getSegmentRetakeParameterPolicy(args3);
  if (!segmentRetakeParameterPolicy) return args3;
  const lockedValue = buildForcedParameterPatch(segmentRetakeParameterPolicy);
  if (!isSegmentRetakeEditing(args3)) return releaseSegmentRetakeParameterLocks(args3, lockedValue);
  const args4 = getPlainObject(args3?.['uiSchemaFieldState']),
    uiSchemaFieldState2 = { ...args4 };
  for (const current of Object['keys'](lockedValue)) {
    uiSchemaFieldState2[current] = {
      ...getPlainObject(args4[current]),
      disabled: !![],
      lockedValue: lockedValue[current],
      segmentRetakeLocked: !![],
    };
  }
  return {
    ...args3,
    ...lockedValue,
    generationParams: { ...getPlainObject(args3?.['generationParams']), ...lockedValue },
    uiSchemaFieldState: uiSchemaFieldState2,
  };
}
export function decorateSegmentRetakeParameterSchemaFields(options2 = {}, entry = {}) {
  const segmentRetakeParameterPolicy2 = getSegmentRetakeParameterPolicy(options2);
  if (!segmentRetakeParameterPolicy2 || !isSegmentRetakeEditing(options2)) return entry;
  const map = new Map(
    Object['values'](segmentRetakeParameterPolicy2)['map']((record) => [record['fieldId'], record]),
  );
  return Object['fromEntries'](
    Object['entries'](entry)['map'](([payload, args5]) => {
      const defaultValue = map['get'](args5?.['id']);
      if (!defaultValue) return [payload, args5];
      const handle = defaultValue['value'] === -1 || defaultValue['value'] === 'auto';
      return [
        payload,
        {
          ...args5,
          disabled: !![],
          defaultValue: defaultValue['value'],
          ...(handle
            ? {
                options: [
                  {
                    value: defaultValue['value'],
                    label: 'Auto',
                    selectedLabel: 'Auto',
                    displayLabel: 'Auto',
                  },
                ],
              }
            : {}),
        },
      ];
    }),
  );
}
export function applySegmentRetakeSubmitParameterPolicy(options3 = {}, state = {}) {
  const segmentRetakeParameterPolicy3 = getSegmentRetakeParameterPolicy(options3);
  if (!segmentRetakeParameterPolicy3) return state;
  const args6 = buildForcedParameterPatch(segmentRetakeParameterPolicy3);
  return (
    Object['assign'](state, args6, {
      generationParams: { ...getPlainObject(state?.['generationParams']), ...args6 },
    }),
    Object['prototype']['hasOwnProperty']['call'](args6, 'resolution') &&
      ((state['videoResolution'] = args6['resolution']), (state['videoSize'] = args6['resolution'])),
    state
  );
}
export function isSegmentRetakeModelSupported(config) {
  const modelManifest2 = getModelManifest(String(config || '')['trim']());
  return getSegmentRetakeCapability(modelManifest2)?.['supported'] === !![];
}
export function getSegmentRetakeAllowedModelIds() {
  return getModelsByKind('video')
    ['filter']((scope) => getSegmentRetakeCapability(scope)?.['supported'] === !![])
    ['map']((input) => input['modelId']);
}
export function getSegmentRetakeAllowedModelIdsForNode(options4 = {}) {
  return options4?.['segmentRetake'] ? getSegmentRetakeAllowedModelIds() : [];
}
export function isSegmentRetakeEditing(options5 = {}) {
  return options5?.['segmentRetake']?.['phase'] === SEGMENT_RETAKE_PHASE_EDITING;
}
export function buildSegmentRetakePhasePatch(args7 = {}, phase) {
  const args8 = args7?.['segmentRetake'];
  if (!args8) return null;
  const segmentRetake = { ...args8, phase: phase },
    uiSchemaFieldState3 = decorateSegmentRetakeParameterNodeData({ ...args7, segmentRetake: segmentRetake }),
    output = {
      uiSchemaFieldState: uiSchemaFieldState3['uiSchemaFieldState'],
      segmentRetake: { ...segmentRetake },
    };
  if (phase === SEGMENT_RETAKE_PHASE_EDITING) {
    const segmentRetakeParameterPolicy4 = getSegmentRetakeParameterPolicy(uiSchemaFieldState3),
      forcedParameterPatch = buildForcedParameterPatch(segmentRetakeParameterPolicy4);
    Object['assign'](output, forcedParameterPatch, {
      generationParams: uiSchemaFieldState3['generationParams'],
    });
  }
  return output;
}
export function buildSegmentRetakeSessionClearPatch(enabled4 = {}) {
  if (!enabled4?.['segmentRetake']) return { segmentRetake: null };
  const segmentRetakePhasePatch = buildSegmentRetakePhasePatch(enabled4, SEGMENT_RETAKE_PHASE_SUBMITTED);
  return { ...(segmentRetakePhasePatch || {}), segmentRetake: null };
}
