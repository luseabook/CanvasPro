import { getModelManifest, resolveModelExecution } from '../../manifests/index.js';
import {
  getTargetInputPolicy,
  manifestInputPolicyReferencesField,
  resolveEffectiveInputKind,
} from '../../modules/modelInputPolicy.js';
import {
  isHappyHorseModelApiVideo,
  isWan27ModelApiVideo,
} from '../../modules/modelApiVideoResolverPolicy.js';
import { buildModelProviderProfileSelectionPatch } from '../../modules/modelProviderProfileSelection.js';
import {
  buildModelUiSchemaDefaultParams,
  sanitizeModelUiSchemaParams,
} from '../aigenImage/uiSchemaRenderer.js';
import { buildGenerationModelSelectionDisplayPatch } from '../shared/generationDisplayPolicy.js';
import { isRunningHubAiAppManifest, resolveCustomAiAppNodeManifest } from '../shared/rhAiAppNodeBehavior.js';
import { getPlainGenerationParams } from './runningHubVideoUiSchema.js';
const APIMART_KLING_V3_OMNI_MODEL_ID = 'apimart/kling-v3-omni',
  RH_WORKFLOW_DISPLAY_FIELD_IDS = new Set([
    'rhVideoResolution',
    'rhVideoFps',
    'rhVideoFrames',
    'rhVideoSeconds',
  ]),
  RH_WORKFLOW_BOOLEAN_FIELD_IDS = new Set([
    'rhBlendIntoScene',
    'rhSubtractSubject',
    'rhMaskRect',
    'rhEnableMask',
  ]),
  LEGACY_INPUT_POLICY_FIELD_IDS = new Set(['happyhorse_mode', 'wan27_mode', 'kling_v3_omni_mode']);
function normalizeRhV54SingleControlPreset(value) {
  const item = String(value ?? '')['trim']();
  return item === 'efficiency' || item === 'stable' || item === 'quality' ? item : 'efficiency';
}
function normalizeRhV54SpecialModeValue(key) {
  const index = String(key ?? '')['trim']();
  return index === 'longVideoOverlay' || index === 'cameraMove' ? index : null;
}
function normalizeRhV54MaskExpandValue(result) {
  const data = Number(result);
  return Number['isFinite'](data) ? Math['max'](-0x270f, Math['min'](0x270f, Math['trunc'](data))) : 0x19;
}
function normalizeRhV54BreastJiggleValue(options) {
  const target = Number(options);
  if (!Number['isFinite'](target)) return 0x0;
  return Math['max'](0x0, Math['min'](0x1, Math['round'](target * 0x14) / 0x14));
}
function isApimartPanelModel(options2 = {}, source = '') {
  const providerHint = String(options2?.['provider'] || '')
      ['trim']()
      ['toLowerCase'](),
    next = String(options2?.['model'] || '')['trim'](),
    modelExecution =
      resolveModelExecution(next, { providerHint: providerHint }) || resolveModelExecution(next),
    current = String(
      modelExecution?.['canonicalModelId'] || modelExecution?.['modelManifest']?.['modelId'] || next,
    )['trim'](),
    enabled = String(modelExecution?.['modelManifest']?.['provider'] || providerHint)
      ['trim']()
      ['toLowerCase']();
  return current === source && (!enabled || enabled === 'apimart');
}
export function isHappyHorsePanelModel(options3 = {}) {
  return isHappyHorseModelApiVideo(options3?.['model'], options3?.['provider']);
}
export function isWan27PanelModel(options4 = {}) {
  return isWan27ModelApiVideo(options4?.['model'], options4?.['provider']);
}
export function isKlingV3OmniPanelModel(options5 = {}) {
  return isApimartPanelModel(options5, APIMART_KLING_V3_OMNI_MODEL_ID);
}
export function getPanelModelManifest(providerHint2 = {}) {
  const customAiAppNodeManifest = resolveCustomAiAppNodeManifest(providerHint2),
    enabled2 = String(providerHint2?.['model'] || '')['trim']();
  if (customAiAppNodeManifest || !enabled2) return customAiAppNodeManifest;
  const modelExecution2 =
    resolveModelExecution(enabled2, { providerHint: providerHint2?.['provider'] }) ||
    resolveModelExecution(enabled2);
  return modelExecution2?.['modelManifest'] || getModelManifest(enabled2) || null;
}
export function isRhAiAppPanelModel(options6 = {}) {
  return isRunningHubAiAppManifest(getPanelModelManifest(options6));
}
function normalizeHappyHorsePanelMode(entry) {
  const record = String(entry || '')
    ['trim']()
    ['toLowerCase']();
  return record === 'image' || record === 'reference' || record === 'edit' ? record : 'auto';
}
function normalizeWan27PanelMode(payload) {
  const handle = String(payload || '')
    ['trim']()
    ['toLowerCase']();
  return handle === 'video' || handle === 'reference' || handle === 'edit' ? handle : 'image';
}
function normalizeKlingV3OmniPanelMode(state) {
  const config = String(state || '')
    ['trim']()
    ['toLowerCase']();
  return config === 'reference' || config === 'edit' ? config : 'image';
}
function getPanelInputKind(scope, input) {
  const effectiveInputKind = resolveEffectiveInputKind(scope, input);
  if (effectiveInputKind) return effectiveInputKind;
  const list = String(scope?.['type'] || '')['toLowerCase']();
  if (list['includes']('video')) return 'video';
  if (list['includes']('image')) return 'image';
  if (list['includes']('audio')) return 'audio';
  if (list['includes']('text')) return 'text';
  return '';
}
export function getManifestInputPolicyEdgeIdsToRemove({
  latest: latest = {},
  fieldId: fieldId = '',
  value: value2,
  inEdges: inEdges = [],
  nodes: nodes = {},
} = {}) {
  const panelModelManifest = getPanelModelManifest(latest);
  if (
    !LEGACY_INPUT_POLICY_FIELD_IDS['has'](String(fieldId || '')['trim']()) &&
    !manifestInputPolicyReferencesField(panelModelManifest?.['inputSlots'], fieldId)
  )
    return null;
  const output = {
      ...latest,
      generationParams: { ...getPlainGenerationParams(latest?.['generationParams']), [fieldId]: value2 },
    },
    targetInputPolicy = getTargetInputPolicy(output),
    map = new Set(
      Array['isArray'](targetInputPolicy?.['allowedKinds']) ? targetInputPolicy['allowedKinds'] : [],
    ),
    value3 = {},
    list2 = [];
  for (const value4 of Array['isArray'](inEdges) ? inEdges : []) {
    const panelInputKind = getPanelInputKind(nodes?.[value4?.['sourceId']], value4);
    if (!panelInputKind) continue;
    const count = Number(targetInputPolicy?.['maxByKind']?.[panelInputKind]),
      value5 = Number['isFinite'](count) && count >= 0x0 ? count : Infinity,
      value6 = value3[panelInputKind] || 0x0;
    if (!map['has'](panelInputKind) || value6 >= value5) {
      if (value4?.['id']) list2['push'](value4['id']);
      continue;
    }
    value3[panelInputKind] = value6 + 0x1;
  }
  return list2;
}
export function getHappyHorseModeEdgeIdsToRemove({
  nextMode: nextMode,
  inEdges: inEdges = [],
  nodes: nodes = {},
} = {}) {
  const happyHorsePanelMode = normalizeHappyHorsePanelMode(nextMode),
    list3 = [];
  let count2 = 0x0,
    count3 = 0x0;
  for (const value7 of Array['isArray'](inEdges) ? inEdges : []) {
    const value8 = nodes?.[value7?.['sourceId']],
      panelInputKind2 = getPanelInputKind(value8, value7);
    if (panelInputKind2 === 'video') {
      if (happyHorsePanelMode === 'edit' && count3 < 0x1) count3 += 0x1;
      else value7?.['id'] && list3['push'](value7['id']);
      continue;
    }
    if (panelInputKind2 === 'image') {
      if (happyHorsePanelMode === 'image') {
        if (count2 < 0x1) count2 += 0x1;
        else {
          if (value7?.['id']) list3['push'](value7['id']);
        }
      } else {
        if (happyHorsePanelMode === 'edit') {
          if (count2 < 0x5) count2 += 0x1;
          else {
            if (value7?.['id']) list3['push'](value7['id']);
          }
        } else {
          if (happyHorsePanelMode === 'reference') {
            if (count2 < 0x9) count2 += 0x1;
            else {
              if (value7?.['id']) list3['push'](value7['id']);
            }
          }
        }
      }
      continue;
    }
    panelInputKind2 === 'audio' && value7?.['id'] && list3['push'](value7['id']);
  }
  return list3;
}
export function getWan27ModeEdgeIdsToRemove({
  nextMode: nextMode2,
  inEdges: inEdges = [],
  nodes: nodes = {},
} = {}) {
  const wan27PanelMode = normalizeWan27PanelMode(nextMode2),
    list4 = [];
  let count4 = 0x0,
    count5 = 0x0,
    count6 = 0x0;
  for (const value9 of Array['isArray'](inEdges) ? inEdges : []) {
    const value10 = nodes?.[value9?.['sourceId']],
      panelInputKind3 = getPanelInputKind(value10, value9);
    if (panelInputKind3 === 'image') {
      if (wan27PanelMode === 'image' && count4 < 0x2) count4 += 0x1;
      else {
        if (wan27PanelMode === 'reference' && count4 < 0x1) count4 += 0x1;
        else value9?.['id'] && list4['push'](value9['id']);
      }
      continue;
    }
    if (panelInputKind3 === 'video') {
      if (wan27PanelMode === 'video' && count5 < 0x1) count5 += 0x1;
      else {
        if (wan27PanelMode === 'reference' && count5 < 0x1) count5 += 0x1;
        else {
          if (wan27PanelMode === 'edit' && count5 < 0x2) count5 += 0x1;
          else value9?.['id'] && list4['push'](value9['id']);
        }
      }
      continue;
    }
    if (panelInputKind3 === 'audio') {
      if ((wan27PanelMode === 'image' || wan27PanelMode === 'reference') && count6 < 0x1) count6 += 0x1;
      else value9?.['id'] && list4['push'](value9['id']);
    }
  }
  return list4;
}
export function getKlingV3OmniModeEdgeIdsToRemove({
  nextMode: nextMode3,
  inEdges: inEdges = [],
  nodes: nodes = {},
} = {}) {
  const klingV3OmniPanelMode = normalizeKlingV3OmniPanelMode(nextMode3),
    list5 = [];
  let count7 = 0x0,
    count8 = 0x0;
  for (const value11 of Array['isArray'](inEdges) ? inEdges : []) {
    const value12 = nodes?.[value11?.['sourceId']],
      panelInputKind4 = getPanelInputKind(value12, value11);
    if (panelInputKind4 === 'image') {
      if (klingV3OmniPanelMode === 'image' && count7 < 0x2) count7 += 0x1;
      else {
        if (klingV3OmniPanelMode === 'reference' && count7 < 0x1) count7 += 0x1;
        else value11?.['id'] && list5['push'](value11['id']);
      }
      continue;
    }
    if (panelInputKind4 === 'video') {
      if ((klingV3OmniPanelMode === 'reference' || klingV3OmniPanelMode === 'edit') && count8 < 0x1)
        count8 += 0x1;
      else value11?.['id'] && list5['push'](value11['id']);
      continue;
    }
    panelInputKind4 === 'audio' && value11?.['id'] && list5['push'](value11['id']);
  }
  return list5;
}
function buildSchemaParamsPatch(value13, value14, value15 = {}) {
  const generationParams = {
      ...getPlainGenerationParams(value13?.['generationParams']),
      ...getPlainGenerationParams(value15?.['generationParams']),
      ...(value14 && typeof value14 === 'object' ? value14 : {}),
    },
    value16 = { generationParams: generationParams },
    value17 = String(value13?.['model'] || '')['trim']();
  return (
    value17 &&
      (value16['generationParamsByModel'] = {
        ...getPlainGenerationParams(value13?.['generationParamsByModel']),
        [value17]: generationParams,
      }),
    value16
  );
}
function getUiSchemaFieldIds(value18) {
  const modelManifest = getModelManifest(value18);
  return new Set(
    (Array['isArray'](modelManifest?.['uiSchema']?.['fields']) ? modelManifest['uiSchema']['fields'] : [])
      ['map']((value19) => String(value19?.['id'] || '')['trim']())
      ['filter'](Boolean),
  );
}
function sanitizeVideoModelApiParams(value20, value21 = {}, value22 = {}) {
  const plainGenerationParams = getPlainGenerationParams(value21);
  try {
    return sanitizeModelUiSchemaParams(value20, plainGenerationParams, value22);
  } catch {
    return plainGenerationParams;
  }
}
export function buildVideoModelApiModelSelectionPatch(
  nodeData = {},
  value23 = '',
  provider = null,
  value24 = {},
) {
  const modelId = String(value23 || '')['trim']();
  if (!modelId) return {};
  const value25 = String(nodeData?.['model'] || '')['trim'](),
    generationParamsByModel = getPlainGenerationParams(nodeData?.['generationParamsByModel']);
  value25 &&
    (generationParamsByModel[value25] = sanitizeVideoModelApiParams(value25, nodeData?.['generationParams'], {
      includeDefaults: ![],
    }));
  const list6 = getUiSchemaFieldIds(modelId),
    args = buildModelUiSchemaDefaultParams(modelId),
    args2 = getPlainGenerationParams(generationParamsByModel[modelId]),
    value26 = Object['prototype']['hasOwnProperty']['call'](value24, 'generationParams'),
    args3 = value26 ? getPlainGenerationParams(value24['generationParams']) : {},
    args4 = {};
  Object['entries'](value24 || {})['forEach'](([value27, value28]) => {
    if (list6['has'](value27)) args4[value27] = value28;
  });
  const value29 = { ...args, ...args2, ...args3, ...args4 },
    value30 = Object['fromEntries'](
      Object['entries'](value29)['filter'](([value31]) => list6['has'](value31)),
    ),
    generationParams2 = sanitizeVideoModelApiParams(modelId, value30, { includeDefaults: !![] }),
    args5 = buildGenerationModelSelectionDisplayPatch({
      nodeData: nodeData,
      fallbackNodeData: nodeData,
      modelId: modelId,
      generationParams: generationParams2,
    }),
    { generationParams: generationParams3, ...args6 } = value24 || {},
    args7 = { ...args6 };
  list6['forEach']((value32) => {
    delete args7[value32];
  });
  const args8 = buildModelProviderProfileSelectionPatch(nodeData, modelId, value24?.['providerProfileId']);
  return {
    ...args7,
    ...args8,
    model: modelId,
    provider: provider,
    generationParams: generationParams2,
    generationParamsByModel: generationParamsByModel,
    ...args5,
  };
}
export function buildRhWorkflowFieldPatch(value33, value34, value35, value36 = {}) {
  const value37 = String(value34 || '')['trim']();
  if (RH_WORKFLOW_DISPLAY_FIELD_IDS['has'](value37)) return { [value37]: value35 };
  if (value37 === 'rhSingleControlPreset' || value37 === 'rhControlMode') {
    const value38 = String(value35 || '')['trim'](),
      args9 =
        value38 === 'multi'
          ? { rhControlMode: 'multi', rhSingleControlPreset: null }
          : { rhControlMode: 'single', rhSingleControlPreset: normalizeRhV54SingleControlPreset(value38) };
    return { ...buildSchemaParamsPatch(value33, args9, value36), ...args9 };
  }
  if (RH_WORKFLOW_BOOLEAN_FIELD_IDS['has'](value37)) {
    const value39 = value35 === !![] || String(value35) === 'true',
      args10 = { [value37]: value39 };
    return { ...buildSchemaParamsPatch(value33, args10, value36), ...args10 };
  }
  if (value37 === 'rhSpecialMode') {
    const plainGenerationParams2 = getPlainGenerationParams(value33?.['generationParams']),
      rhV54SpecialModeValue = normalizeRhV54SpecialModeValue(
        plainGenerationParams2['rhSpecialMode'] !== undefined
          ? plainGenerationParams2['rhSpecialMode']
          : value33?.['rhSpecialMode'],
      ),
      rhV54SpecialModeValue2 = normalizeRhV54SpecialModeValue(value35),
      rhSpecialMode = rhV54SpecialModeValue === rhV54SpecialModeValue2 ? null : rhV54SpecialModeValue2,
      args11 = { rhSpecialMode: rhSpecialMode };
    return { ...buildSchemaParamsPatch(value33, args11, value36), ...args11 };
  }
  if (value37 === 'rhMaskExpand') {
    const rhMaskExpand = normalizeRhV54MaskExpandValue(value35),
      value40 = { rhMaskExpand: rhMaskExpand };
    return {
      ...buildSchemaParamsPatch(value33, value40, value36),
      rhMaskExpand: rhMaskExpand,
      rhMaskExpandTouched: !![],
    };
  }
  if (value37 === 'rhBreastJiggle') {
    const rhBreastJiggle = normalizeRhV54BreastJiggleValue(value35),
      value41 = { rhBreastJiggle: rhBreastJiggle };
    return { ...buildSchemaParamsPatch(value33, value41, value36), rhBreastJiggle: rhBreastJiggle };
  }
  return {};
}
