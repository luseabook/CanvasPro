import { getModelManifest, resolveModelExecution } from '../../manifests/index.js';
import { buildModelUiSchemaDefaultParams } from '../aigenImage/uiSchemaRenderer.js';
const VIDEO_WORKFLOW_DISPLAY_FIELDS = Object.freeze([
    'rhVideoResolution',
    'rhVideoFps',
    'rhVideoFrames',
    'rhVideoSeconds',
  ]),
  RUNNINGHUB_VIDEO_V54_PAYLOAD_RESOLVER = 'runninghubVideoV54';
export function getPlainGenerationParams(args) {
  return args && typeof args === 'object' && !Array.isArray(args) ? { ...args } : {};
}
function normalizeUiPlacement(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}
function getRunningHubVideoWorkflowManifest(item) {
  const modelManifest = getModelManifest(item);
  return modelManifest?.provider === 'runninghubwf' &&
    modelManifest?.adapterType === 'workflow' &&
    modelManifest?.kind === 'video'
    ? modelManifest
    : null;
}
function isToolbarOnlyWorkflowManifest(key) {
  const list = Array.isArray(key?.uiPlacement) ? key.uiPlacement : [];
  return list.includes('toolbar') && !list.includes('modelMenu');
}
function getRunningHubVideoWorkflowFields(index, { includeToolbarOnly: includeToolbarOnly = false } = {}) {
  const runningHubVideoWorkflowManifest = getRunningHubVideoWorkflowManifest(index);
  if (!runningHubVideoWorkflowManifest) return [];
  if (!includeToolbarOnly && isToolbarOnlyWorkflowManifest(runningHubVideoWorkflowManifest)) return [];
  const result = runningHubVideoWorkflowManifest?.uiSchema?.fields;
  return Array.isArray(result) ? result : [];
}
export function hasRunningHubVideoWorkflowUiPlacement(data, options, target = {}) {
  const uiPlacement = normalizeUiPlacement(options);
  if (!uiPlacement) return false;
  return getRunningHubVideoWorkflowFields(data, target).some(
    (item2) => normalizeUiPlacement(item2?.placement) === uiPlacement,
  );
}
export function hasRunningHubVideoWorkflowUiField(source, next, current = {}) {
  const enabled = String(next || '').trim();
  if (!enabled) return false;
  return getRunningHubVideoWorkflowFields(source, current).some(
    (item3) => String(item3?.id || '').trim() === enabled,
  );
}
export function getRunningHubVideoWorkflowFpsOptions(
  entry,
  { v54FpsOptions: v54FpsOptions = [16, 24, 30] } = {},
) {
  const list2 = getRunningHubVideoWorkflowFields(entry),
    record = list2.some((item4) => String(item4?.id || '').trim() === 'rhVideoSeconds');
  return record ? [16, 24] : v54FpsOptions;
}
function getManifestDisplayFieldIds(payload) {
  const modelManifest2 = getModelManifest(payload)?.uiSchema?.fields,
    map = new Set(
      (Array.isArray(modelManifest2) ? modelManifest2 : []).map((item5) => String(item5?.id || '').trim()),
    ),
    list3 = VIDEO_WORKFLOW_DISPLAY_FIELDS.filter((item6) => map.has(item6));
  return list3.length ? list3 : VIDEO_WORKFLOW_DISPLAY_FIELDS;
}
function getDeclaredManifestDisplayFields(handle) {
  const modelManifest3 = getModelManifest(handle)?.uiSchema?.fields,
    map2 = new Set(VIDEO_WORKFLOW_DISPLAY_FIELDS);
  return (Array.isArray(modelManifest3) ? modelManifest3 : []).filter((item7) =>
    map2.has(String(item7?.id || '').trim()),
  );
}
function getDeclaredManifestField(state, config) {
  const enabled2 = String(config || '').trim();
  if (!enabled2) return null;
  const modelManifest4 = getModelManifest(state)?.uiSchema?.fields;
  return (
    (Array.isArray(modelManifest4) ? modelManifest4 : []).find(
      (item8) => String(item8?.id || '').trim() === enabled2,
    ) || null
  );
}
function getRunningHubVideoExecution(scope) {
  try {
    const modelExecution = resolveModelExecution(scope);
    return modelExecution?.executionManifest || null;
  } catch {
    return null;
  }
}
export function getRunningHubVideoParameterPanelPolicy(input) {
  const modelManifest5 = getModelManifest(input)?.extensions?.videoParameterPanel;
  return modelManifest5 && typeof modelManifest5 === 'object' && !Array.isArray(modelManifest5)
    ? modelManifest5
    : {};
}
function getTopLevelDisplayParams(output, value2) {
  const value3 = {};
  return (
    getManifestDisplayFieldIds(value2).forEach((item9) => {
      Object.prototype.hasOwnProperty.call(output || {}, item9) && (value3[item9] = output[item9]);
    }),
    value3
  );
}
function normalizeRhV54SinglePreset(value4) {
  const value5 = String(value4 ?? '').trim();
  return value5 === 'efficiency' || value5 === 'stable' || value5 === 'quality' ? value5 : 'efficiency';
}
function normalizeRhV54SpecialMode(value6) {
  const value7 = String(value6 ?? '').trim();
  return value7 === 'longVideoOverlay' || value7 === 'cameraMove' ? value7 : null;
}
function normalizeRhV54MaskExpand(value8) {
  const value9 = Number(value8);
  return Number.isFinite(value9) ? Math.max(-0x270f, Math.min(0x270f, Math.trunc(value9))) : 25;
}
function normalizeRhV54BreastJiggle(value10) {
  const value11 = Number(value10);
  if (!Number.isFinite(value11)) return 0;
  return Math.max(0, Math.min(1, Math.round(value11 * 20) / 20));
}
function normalizeBooleanParam(value12, value13 = false) {
  if (value12 === true || String(value12).trim() === 'true') return true;
  if (value12 === false || String(value12).trim() === 'false') return false;
  return value13;
}
function buildRhV54AdvancedDisplayPatch(rhBlendIntoScene) {
  const rhControlMode = String(rhBlendIntoScene.rhControlMode || 'single') === 'multi' ? 'multi' : 'single',
    value14 = {
      rhBlendIntoScene: rhBlendIntoScene.rhBlendIntoScene === true,
      rhControlMode: rhControlMode,
      rhSingleControlPreset:
        rhControlMode === 'multi' ? null : normalizeRhV54SinglePreset(rhBlendIntoScene.rhSingleControlPreset),
      rhSubtractSubject: rhBlendIntoScene.rhSubtractSubject !== false,
      rhMaskExpand: normalizeRhV54MaskExpand(rhBlendIntoScene.rhMaskExpand),
      rhMaskRect: rhBlendIntoScene.rhMaskRect === true,
      rhSpecialMode: normalizeRhV54SpecialMode(rhBlendIntoScene.rhSpecialMode),
      rhBreastJiggle: normalizeRhV54BreastJiggle(rhBlendIntoScene.rhBreastJiggle),
    };
  return value14;
}
function getFieldDefaultNumber(value15, value16) {
  const value17 = Number(value15?.defaultValue);
  return Number.isFinite(value17) ? value17 : value16;
}
function getFieldMinNumber(value18, value19) {
  const value20 = Number(value18?.min);
  return Number.isFinite(value20) ? value20 : value19;
}
function getFieldMinOptionNumber(value21, value22) {
  const list4 = (Array.isArray(value21?.options) ? value21.options : [])
    .map((el) => Number(el?.value ?? el))
    .filter(Number.isFinite);
  if (list4.length) return Math.min(...list4);
  return getFieldMinNumber(value21, value22);
}
function getNormalizedDisplayFieldValue(value23, value24, value25, value26 = {}) {
  const value27 = String(value24?.id || '').trim(),
    value28 = value25[value27],
    value29 = Number(value28);
  if (value27 === 'rhVideoResolution') {
    const fieldMinOptionNumber = getFieldMinOptionNumber(value24, 0x340),
      fieldDefaultNumber = getFieldDefaultNumber(value24, fieldMinOptionNumber);
    return Number.isFinite(value29)
      ? Math.max(fieldMinOptionNumber, Math.trunc(value29))
      : fieldDefaultNumber;
  }
  if (value27 === 'rhVideoFps') {
    const fieldDefaultNumber2 = getFieldDefaultNumber(value24, 24),
      runningHubVideoExecution = getRunningHubVideoExecution(value23),
      value30 =
        runningHubVideoExecution?.extensions?.payloadResolver === RUNNINGHUB_VIDEO_V54_PAYLOAD_RESOLVER
          ? value26.v54FpsOptions
          : value24?.options,
      list5 = (Array.isArray(value30) ? value30 : [])
        .map((el2) => Number(el2?.value ?? el2))
        .filter(Number.isFinite),
      list6 = list5.length ? list5 : [16, 24];
    return list6.includes(value29) ? value29 : fieldDefaultNumber2;
  }
  if (value27 === 'rhVideoFrames') {
    const fieldDefaultNumber3 = getFieldDefaultNumber(value24, 77),
      fieldMinNumber = getFieldMinNumber(value24, 0);
    return Number.isFinite(value29) ? Math.max(fieldMinNumber, Math.trunc(value29)) : fieldDefaultNumber3;
  }
  if (value27 === 'rhVideoSeconds') {
    const fieldDefaultNumber4 = getFieldDefaultNumber(value24, 5),
      fieldMinNumber2 = getFieldMinNumber(value24, 1);
    return Number.isFinite(value29) ? Math.max(fieldMinNumber2, Math.trunc(value29)) : fieldDefaultNumber4;
  }
  return undefined;
}
export function isRunningHubVideoWorkflowManifest(value31) {
  return !!getRunningHubVideoWorkflowManifest(value31);
}
export function buildVideoWorkflowGenerationParamsPatch(value32, value33, value34 = {}) {
  const enabled3 = String(value32?.model || '').trim(),
    value35 = String(value33 || '').trim();
  if (!isRunningHubVideoWorkflowManifest(value35)) return {};
  const generationParamsByModel = getPlainGenerationParams(value32?.generationParamsByModel);
  enabled3 &&
    (generationParamsByModel[enabled3] = {
      ...getPlainGenerationParams(value32?.generationParams),
      ...getTopLevelDisplayParams(value32, enabled3),
    });
  const args2 = buildModelUiSchemaDefaultParams(value35),
    args3 = getPlainGenerationParams(generationParamsByModel[value35]),
    args4 = !enabled3 || enabled3 === value35 ? getTopLevelDisplayParams(value32, value35) : {},
    generationParams = { ...args2, ...args3, ...args4, ...getPlainGenerationParams(value34) };
  return (
    (generationParamsByModel[value35] = generationParams),
    { generationParams: generationParams, generationParamsByModel: generationParamsByModel }
  );
}
export function buildVideoWorkflowDisplayParamsPatch(value36, value37, value38 = {}) {
  const value39 = String(value36 || '').trim(),
    plainGenerationParams = getPlainGenerationParams(value37),
    v54FpsOptions2 = Array.isArray(value38?.v54FpsOptions)
      ? value38.v54FpsOptions.map((item10) => Number(item10)).filter(Number.isFinite)
      : [16, 24, 30],
    value40 = {};
  getDeclaredManifestDisplayFields(value39).forEach((item11) => {
    const value41 = String(item11?.id || '').trim(),
      normalizedDisplayFieldValue = getNormalizedDisplayFieldValue(value39, item11, plainGenerationParams, {
        v54FpsOptions: v54FpsOptions2,
      });
    if (normalizedDisplayFieldValue !== undefined) value40[value41] = normalizedDisplayFieldValue;
  });
  const runningHubVideoParameterPanelPolicy = getRunningHubVideoParameterPanelPolicy(value39);
  runningHubVideoParameterPanelPolicy.advancedDisplayPatch === 'runningHubVideoV54' &&
    Object.assign(value40, buildRhV54AdvancedDisplayPatch(plainGenerationParams));
  getDeclaredManifestField(value39, 'rhEnableMask') &&
    (value40.rhEnableMask = normalizeBooleanParam(plainGenerationParams.rhEnableMask, false));
  const value42 = Number(runningHubVideoParameterPanelPolicy.forceDisplayFps);
  return (Number.isFinite(value42) && (value40.rhVideoFps = value42), value40);
}
function buildVideoWorkflowSelectionStatePatch(value43, value44, value45 = {}) {
  const value46 = {},
    runningHubVideoParameterPanelPolicy2 = getRunningHubVideoParameterPanelPolicy(value44),
    value47 = runningHubVideoParameterPanelPolicy2.frameStateDefaults;
  if (value47 && typeof value47 === 'object') {
    const value48 = Number(value47.frameRate),
      value49 = Number(value47.frameCount);
    ((value46.frameRate = Number.isFinite(value43?.frameRate)
      ? value43.frameRate
      : Number.isFinite(value48)
        ? value48
        : 24),
      (value46.frameCount = Number.isFinite(value43?.frameCount)
        ? value43.frameCount
        : Number.isFinite(value49)
          ? value49
          : 77),
      (value45.preserveMaskTouchedState || runningHubVideoParameterPanelPolicy2.preserveMaskTouchedState) &&
        (value46.rhMaskExpandTouched = value43?.rhMaskExpandTouched === true));
  }
  const value50 =
    runningHubVideoParameterPanelPolicy2.defaultSelectionState &&
    typeof runningHubVideoParameterPanelPolicy2.defaultSelectionState === 'object'
      ? runningHubVideoParameterPanelPolicy2.defaultSelectionState
      : null;
  return (
    value50 &&
      Object.entries(value50).forEach(([value51, value52]) => {
        value46[value51] = value43?.[value51] || value52;
      }),
    value46
  );
}
export function buildVideoWorkflowModelSelectionPatch(value53, value54, value55 = {}) {
  if (!isRunningHubVideoWorkflowManifest(value54)) return {};
  const args5 = buildVideoWorkflowGenerationParamsPatch(value53, value54),
    args6 = buildVideoWorkflowSelectionStatePatch(value53 || {}, value54, value55),
    args7 = buildVideoWorkflowDisplayParamsPatch(value54, args5.generationParams, value55);
  return { ...args5, ...args6, ...args7 };
}
export function resolveVideoWorkflowSchemaParam(value56, value57, value58) {
  const modelManifest6 = getModelManifest(value57),
    value59 = String(value58 || '').trim(),
    list7 = modelManifest6?.uiSchema?.fields,
    enabled4 = Array.isArray(list7)
      ? list7.find((item12) => String(item12?.id || '').trim() === value59)
      : null;
  if (!enabled4) throw new Error('RunningHub video manifest ' + value57 + ' missing ' + value59);
  if (enabled4.defaultValue === undefined)
    throw new Error('RunningHub video manifest ' + value57 + ' missing ' + value59 + ' defaultValue');
  const plainGenerationParams2 = getPlainGenerationParams(value56?.generationParams);
  if (!Object.prototype.hasOwnProperty.call(plainGenerationParams2, value59))
    throw new Error('RunningHub video node ' + value57 + ' missing generationParams.' + value59);
  const value60 = plainGenerationParams2[value59];
  if (value60 === undefined || value60 === null || String(value60).trim() === '')
    throw new Error('RunningHub video node ' + value57 + ' missing generationParams.' + value59);
  return value60;
}

export function resolveBerniniVideoReplaceInputMode({
  hasSourceVideo: hasSourceVideo = ![],
  hasRefImage: hasRefImage = ![],
  hasReferenceVideo: hasReferenceVideo = ![],
} = {}) {
  if (hasSourceVideo && hasReferenceVideo) return 'videoVideo';
  if (hasSourceVideo && hasRefImage) return 'videoImage';
  if (hasSourceVideo) return 'video';
  if (hasRefImage) return 'image';
  return 'none';
}

export function resolveBerniniFunctionForInputMode(value61, value62 = '') {
  const value63 = {
      image: ['i2v', 'r2v'],
      video: ['v2v', 'mv2v'],
      videoImage: ['vi2v', 'rv2v', 'vrc2v'],
      videoVideo: ['ads2v'],
    },
    value64 = value63[value61] || [],
    value65 = String(value62 || '')['trim']();
  return value64['includes'](value65) ? value65 : value64[0x0] || '';
}

export function buildVideoWorkflowReferenceSummaryParamsPatch(options2 = {}, value66 = '', value67 = {}) {
  const runningHubVideoParameterPanelPolicy3 = getRunningHubVideoParameterPanelPolicy(value66),
    value68 = runningHubVideoParameterPanelPolicy3?.['fixedSlotSummary'],
    enabled5 = String(value68?.['field'] || '')['trim']();
  if (!enabled5 || value68?.['resolver'] !== 'berniniVideoReplaceInputMode') return {};
  const count = Math['max'](0x0, Number(value67?.['imageCount']) || 0x0),
    count2 = Math['max'](0x0, Number(value67?.['videoCount']) || 0x0),
    berniniVideoReplaceInputMode = resolveBerniniVideoReplaceInputMode({
      hasSourceVideo: count2 > 0x0,
      hasRefImage: count > 0x0,
      hasReferenceVideo: count2 > 0x1,
    }),
    value69 = { [enabled5]: berniniVideoReplaceInputMode },
    berniniFunctionForInputMode = resolveBerniniFunctionForInputMode(
      berniniVideoReplaceInputMode,
      options2?.['generationParams']?.['rhBerniniFunction'] ?? options2?.['rhBerniniFunction'],
    );
  if (berniniFunctionForInputMode) value69['rhBerniniFunction'] = berniniFunctionForInputMode;
  return value69;
}
