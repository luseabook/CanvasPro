import { getModelManifest, resolveModelExecution } from '../../manifests/index.js';
import { buildModelUiSchemaDefaultParams } from '../aigenImage/uiSchemaRenderer.js';
const VIDEO_WORKFLOW_DISPLAY_FIELDS = Object.freeze([
    'rhVideoResolution',
    'rhVideoFps',
    'rhVideoFrames',
    'rhVideoSeconds',
  ]),
  RUNNINGHUB_VIDEO_V54_PAYLOAD_RESOLVER = 'runninghubVideoV54';
export function getPlainGenerationParams(_0x1f20df) {
  return _0x1f20df && typeof _0x1f20df === 'object' && !Array.isArray(_0x1f20df) ? { ..._0x1f20df } : {};
}
function normalizeUiPlacement(_0x4b09d1) {
  return String(_0x4b09d1 || '')
    .trim()
    .toLowerCase();
}
function getRunningHubVideoWorkflowManifest(_0x5b6e3b) {
  const _0x14ec2c = getModelManifest(_0x5b6e3b);
  return _0x14ec2c?.provider === 'runninghubwf' &&
    _0x14ec2c?.adapterType === 'workflow' &&
    _0x14ec2c?.kind === 'video'
    ? _0x14ec2c
    : null;
}
function isToolbarOnlyWorkflowManifest(_0xf8a56f) {
  const _0x46704c = Array.isArray(_0xf8a56f?.uiPlacement) ? _0xf8a56f.uiPlacement : [];
  return _0x46704c.includes('toolbar') && !_0x46704c.includes('modelMenu');
}
function getRunningHubVideoWorkflowFields(
  _0x454cf3,
  { includeToolbarOnly: includeToolbarOnly = false } = {},
) {
  const _0x5a68b1 = getRunningHubVideoWorkflowManifest(_0x454cf3);
  if (!_0x5a68b1) return [];
  if (!includeToolbarOnly && isToolbarOnlyWorkflowManifest(_0x5a68b1)) return [];
  const _0x297c66 = _0x5a68b1?.uiSchema?.fields;
  return Array.isArray(_0x297c66) ? _0x297c66 : [];
}
export function hasRunningHubVideoWorkflowUiPlacement(_0x5de1b4, _0x5cc199, _0x2e922d = {}) {
  const _0x51def8 = normalizeUiPlacement(_0x5cc199);
  if (!_0x51def8) return false;
  return getRunningHubVideoWorkflowFields(_0x5de1b4, _0x2e922d).some(
    (_0x4df7fc) => normalizeUiPlacement(_0x4df7fc?.placement) === _0x51def8,
  );
}
export function hasRunningHubVideoWorkflowUiField(_0x369145, _0x366a76, _0x54ac1d = {}) {
  const _0x4b8124 = String(_0x366a76 || '').trim();
  if (!_0x4b8124) return false;
  return getRunningHubVideoWorkflowFields(_0x369145, _0x54ac1d).some(
    (_0x932e47) => String(_0x932e47?.id || '').trim() === _0x4b8124,
  );
}
export function getRunningHubVideoWorkflowFpsOptions(
  _0x5878cf,
  { v54FpsOptions: v54FpsOptions = [16, 24, 30] } = {},
) {
  const _0x3467db = getRunningHubVideoWorkflowFields(_0x5878cf),
    _0x46fd9c = _0x3467db.some((_0x210835) => String(_0x210835?.id || '').trim() === 'rhVideoSeconds');
  return _0x46fd9c ? [16, 24] : v54FpsOptions;
}
function getManifestDisplayFieldIds(_0x43780f) {
  const _0x5bc114 = getModelManifest(_0x43780f)?.uiSchema?.fields,
    _0x439463 = new Set(
      (Array.isArray(_0x5bc114) ? _0x5bc114 : []).map((_0x25a16d) => String(_0x25a16d?.id || '').trim()),
    ),
    _0x570c9c = VIDEO_WORKFLOW_DISPLAY_FIELDS.filter((_0x3f1490) => _0x439463.has(_0x3f1490));
  return _0x570c9c.length ? _0x570c9c : VIDEO_WORKFLOW_DISPLAY_FIELDS;
}
function getDeclaredManifestDisplayFields(_0x391547) {
  const _0x34c302 = getModelManifest(_0x391547)?.uiSchema?.fields,
    _0x32ef6b = new Set(VIDEO_WORKFLOW_DISPLAY_FIELDS);
  return (Array.isArray(_0x34c302) ? _0x34c302 : []).filter((_0x1aa6a5) =>
    _0x32ef6b.has(String(_0x1aa6a5?.id || '').trim()),
  );
}
function getDeclaredManifestField(_0x3e9a39, _0x9aece5) {
  const _0xa05995 = String(_0x9aece5 || '').trim();
  if (!_0xa05995) return null;
  const _0x433bb6 = getModelManifest(_0x3e9a39)?.uiSchema?.fields;
  return (
    (Array.isArray(_0x433bb6) ? _0x433bb6 : []).find(
      (_0x4007e7) => String(_0x4007e7?.id || '').trim() === _0xa05995,
    ) || null
  );
}
function getRunningHubVideoExecution(_0x9c5486) {
  try {
    const _0x7f16e7 = resolveModelExecution(_0x9c5486);
    return _0x7f16e7?.executionManifest || null;
  } catch {
    return null;
  }
}
export function getRunningHubVideoParameterPanelPolicy(_0x1f5626) {
  const _0xd89cec = getModelManifest(_0x1f5626)?.extensions?.videoParameterPanel;
  return _0xd89cec && typeof _0xd89cec === 'object' && !Array.isArray(_0xd89cec) ? _0xd89cec : {};
}
function getTopLevelDisplayParams(_0x2956fc, _0x335b6b) {
  const _0x358d98 = {};
  return (
    getManifestDisplayFieldIds(_0x335b6b).forEach((_0xa9338) => {
      Object.prototype.hasOwnProperty.call(_0x2956fc || {}, _0xa9338) &&
        (_0x358d98[_0xa9338] = _0x2956fc[_0xa9338]);
    }),
    _0x358d98
  );
}
function normalizeRhV54SinglePreset(_0x5919ce) {
  const _0x53c258 = String(_0x5919ce ?? '').trim();
  return _0x53c258 === 'efficiency' || _0x53c258 === 'stable' || _0x53c258 === 'quality'
    ? _0x53c258
    : 'efficiency';
}
function normalizeRhV54SpecialMode(_0xee8d12) {
  const _0x4ec874 = String(_0xee8d12 ?? '').trim();
  return _0x4ec874 === 'longVideoOverlay' || _0x4ec874 === 'cameraMove' ? _0x4ec874 : null;
}
function normalizeRhV54MaskExpand(_0x214996) {
  const _0x13bb5f = Number(_0x214996);
  return Number.isFinite(_0x13bb5f) ? Math.max(-0x270f, Math.min(0x270f, Math.trunc(_0x13bb5f))) : 25;
}
function normalizeRhV54BreastJiggle(_0x32b5b3) {
  const _0x26e2da = Number(_0x32b5b3);
  if (!Number.isFinite(_0x26e2da)) return 0;
  return Math.max(0, Math.min(1, Math.round(_0x26e2da * 20) / 20));
}
function normalizeBooleanParam(_0x5c1562, _0x10fde5 = false) {
  if (_0x5c1562 === true || String(_0x5c1562).trim() === 'true') return true;
  if (_0x5c1562 === false || String(_0x5c1562).trim() === 'false') return false;
  return _0x10fde5;
}
function buildRhV54AdvancedDisplayPatch(_0x1772fe) {
  const _0x54ca53 = String(_0x1772fe.rhControlMode || 'single') === 'multi' ? 'multi' : 'single',
    _0xf938c6 = {
      rhBlendIntoScene: _0x1772fe.rhBlendIntoScene === true,
      rhControlMode: _0x54ca53,
      rhSingleControlPreset:
        _0x54ca53 === 'multi' ? null : normalizeRhV54SinglePreset(_0x1772fe.rhSingleControlPreset),
      rhSubtractSubject: _0x1772fe.rhSubtractSubject !== false,
      rhMaskExpand: normalizeRhV54MaskExpand(_0x1772fe.rhMaskExpand),
      rhMaskRect: _0x1772fe.rhMaskRect === true,
      rhSpecialMode: normalizeRhV54SpecialMode(_0x1772fe.rhSpecialMode),
      rhBreastJiggle: normalizeRhV54BreastJiggle(_0x1772fe.rhBreastJiggle),
    };
  return _0xf938c6;
}
function getFieldDefaultNumber(_0x11be50, _0x50d8a8) {
  const _0x256b25 = Number(_0x11be50?.defaultValue);
  return Number.isFinite(_0x256b25) ? _0x256b25 : _0x50d8a8;
}
function getFieldMinNumber(_0x57f64e, _0x1c14fe) {
  const _0x145ea3 = Number(_0x57f64e?.min);
  return Number.isFinite(_0x145ea3) ? _0x145ea3 : _0x1c14fe;
}
function getFieldMinOptionNumber(_0x36a5b8, _0x3dc9eb) {
  const _0x1f1774 = (Array.isArray(_0x36a5b8?.options) ? _0x36a5b8.options : [])
    .map((_0x376835) => Number(_0x376835?.value ?? _0x376835))
    .filter(Number.isFinite);
  if (_0x1f1774.length) return Math.min(..._0x1f1774);
  return getFieldMinNumber(_0x36a5b8, _0x3dc9eb);
}
function getNormalizedDisplayFieldValue(_0x2bf7e2, _0x187174, _0xe12c07, _0x10c34f = {}) {
  const _0x365bf1 = String(_0x187174?.id || '').trim(),
    _0x21adea = _0xe12c07[_0x365bf1],
    _0x494bd9 = Number(_0x21adea);
  if (_0x365bf1 === 'rhVideoResolution') {
    const _0x4c0b4e = getFieldMinOptionNumber(_0x187174, 0x340),
      _0x222066 = getFieldDefaultNumber(_0x187174, _0x4c0b4e);
    return Number.isFinite(_0x494bd9) ? Math.max(_0x4c0b4e, Math.trunc(_0x494bd9)) : _0x222066;
  }
  if (_0x365bf1 === 'rhVideoFps') {
    const _0x47672d = getFieldDefaultNumber(_0x187174, 24),
      _0x1d9c07 = getRunningHubVideoExecution(_0x2bf7e2),
      _0x21a152 =
        _0x1d9c07?.extensions?.payloadResolver === RUNNINGHUB_VIDEO_V54_PAYLOAD_RESOLVER
          ? _0x10c34f.v54FpsOptions
          : _0x187174?.options,
      _0x1406e9 = (Array.isArray(_0x21a152) ? _0x21a152 : [])
        .map((_0x18f306) => Number(_0x18f306?.value ?? _0x18f306))
        .filter(Number.isFinite),
      _0x4951c7 = _0x1406e9.length ? _0x1406e9 : [16, 24];
    return _0x4951c7.includes(_0x494bd9) ? _0x494bd9 : _0x47672d;
  }
  if (_0x365bf1 === 'rhVideoFrames') {
    const _0x466c58 = getFieldDefaultNumber(_0x187174, 77),
      _0x57b9a6 = getFieldMinNumber(_0x187174, 0);
    return Number.isFinite(_0x494bd9) ? Math.max(_0x57b9a6, Math.trunc(_0x494bd9)) : _0x466c58;
  }
  if (_0x365bf1 === 'rhVideoSeconds') {
    const _0x11cb28 = getFieldDefaultNumber(_0x187174, 5),
      _0x5c91fa = getFieldMinNumber(_0x187174, 1);
    return Number.isFinite(_0x494bd9) ? Math.max(_0x5c91fa, Math.trunc(_0x494bd9)) : _0x11cb28;
  }
  return undefined;
}
export function isRunningHubVideoWorkflowManifest(_0x5df0bf) {
  return !!getRunningHubVideoWorkflowManifest(_0x5df0bf);
}
export function buildVideoWorkflowGenerationParamsPatch(_0x1ef48a, _0x1bc2b5, _0x4fc50c = {}) {
  const _0x4ed64c = String(_0x1ef48a?.model || '').trim(),
    _0x15dc93 = String(_0x1bc2b5 || '').trim();
  if (!isRunningHubVideoWorkflowManifest(_0x15dc93)) return {};
  const _0x15bcb6 = getPlainGenerationParams(_0x1ef48a?.generationParamsByModel);
  _0x4ed64c &&
    (_0x15bcb6[_0x4ed64c] = {
      ...getPlainGenerationParams(_0x1ef48a?.generationParams),
      ...getTopLevelDisplayParams(_0x1ef48a, _0x4ed64c),
    });
  const _0x2c9008 = buildModelUiSchemaDefaultParams(_0x15dc93),
    _0x1dc421 = getPlainGenerationParams(_0x15bcb6[_0x15dc93]),
    _0x46bb6d = !_0x4ed64c || _0x4ed64c === _0x15dc93 ? getTopLevelDisplayParams(_0x1ef48a, _0x15dc93) : {},
    _0x2c7b69 = { ..._0x2c9008, ..._0x1dc421, ..._0x46bb6d, ...getPlainGenerationParams(_0x4fc50c) };
  return (
    (_0x15bcb6[_0x15dc93] = _0x2c7b69),
    { generationParams: _0x2c7b69, generationParamsByModel: _0x15bcb6 }
  );
}
export function buildVideoWorkflowDisplayParamsPatch(_0x2ed77d, _0x11fcce, _0x3865f3 = {}) {
  const _0x37c566 = String(_0x2ed77d || '').trim(),
    _0x5b31d3 = getPlainGenerationParams(_0x11fcce),
    _0x36c05f = Array.isArray(_0x3865f3?.v54FpsOptions)
      ? _0x3865f3.v54FpsOptions.map((_0x2add00) => Number(_0x2add00)).filter(Number.isFinite)
      : [16, 24, 30],
    _0x1e02c4 = {};
  getDeclaredManifestDisplayFields(_0x37c566).forEach((_0x4e0178) => {
    const _0x16875a = String(_0x4e0178?.id || '').trim(),
      _0x2759fd = getNormalizedDisplayFieldValue(_0x37c566, _0x4e0178, _0x5b31d3, {
        v54FpsOptions: _0x36c05f,
      });
    if (_0x2759fd !== undefined) _0x1e02c4[_0x16875a] = _0x2759fd;
  });
  const _0x27dda6 = getRunningHubVideoParameterPanelPolicy(_0x37c566);
  _0x27dda6.advancedDisplayPatch === 'runningHubVideoV54' &&
    Object.assign(_0x1e02c4, buildRhV54AdvancedDisplayPatch(_0x5b31d3));
  getDeclaredManifestField(_0x37c566, 'rhEnableMask') &&
    (_0x1e02c4.rhEnableMask = normalizeBooleanParam(_0x5b31d3.rhEnableMask, false));
  const _0x268bbc = Number(_0x27dda6.forceDisplayFps);
  return (Number.isFinite(_0x268bbc) && (_0x1e02c4.rhVideoFps = _0x268bbc), _0x1e02c4);
}
function buildVideoWorkflowSelectionStatePatch(_0x5d4db0, _0x1247bd, _0x533868 = {}) {
  const _0x56ac22 = {},
    _0x323489 = getRunningHubVideoParameterPanelPolicy(_0x1247bd),
    _0xbf6576 = _0x323489.frameStateDefaults;
  if (_0xbf6576 && typeof _0xbf6576 === 'object') {
    const _0x580b42 = Number(_0xbf6576.frameRate),
      _0x22c27d = Number(_0xbf6576.frameCount);
    ((_0x56ac22.frameRate = Number.isFinite(_0x5d4db0?.frameRate)
      ? _0x5d4db0.frameRate
      : Number.isFinite(_0x580b42)
        ? _0x580b42
        : 24),
      (_0x56ac22.frameCount = Number.isFinite(_0x5d4db0?.frameCount)
        ? _0x5d4db0.frameCount
        : Number.isFinite(_0x22c27d)
          ? _0x22c27d
          : 77),
      (_0x533868.preserveMaskTouchedState || _0x323489.preserveMaskTouchedState) &&
        (_0x56ac22.rhMaskExpandTouched = _0x5d4db0?.rhMaskExpandTouched === true));
  }
  const _0x534291 =
    _0x323489.defaultSelectionState && typeof _0x323489.defaultSelectionState === 'object'
      ? _0x323489.defaultSelectionState
      : null;
  return (
    _0x534291 &&
      Object.entries(_0x534291).forEach(([_0x3911e2, _0x408366]) => {
        _0x56ac22[_0x3911e2] = _0x5d4db0?.[_0x3911e2] || _0x408366;
      }),
    _0x56ac22
  );
}
export function buildVideoWorkflowModelSelectionPatch(_0x2aa055, _0x102335, _0xc51f91 = {}) {
  if (!isRunningHubVideoWorkflowManifest(_0x102335)) return {};
  const _0x18d451 = buildVideoWorkflowGenerationParamsPatch(_0x2aa055, _0x102335),
    _0x3daf7c = buildVideoWorkflowSelectionStatePatch(_0x2aa055 || {}, _0x102335, _0xc51f91),
    _0x2e8bf2 = buildVideoWorkflowDisplayParamsPatch(_0x102335, _0x18d451.generationParams, _0xc51f91);
  return { ..._0x18d451, ..._0x3daf7c, ..._0x2e8bf2 };
}
export function resolveVideoWorkflowSchemaParam(_0x225d75, _0x3ae853, _0x3f4f97) {
  const _0x41288e = getModelManifest(_0x3ae853),
    _0x35c80a = String(_0x3f4f97 || '').trim(),
    _0x3c119a = _0x41288e?.uiSchema?.fields,
    _0x1dadfb = Array.isArray(_0x3c119a)
      ? _0x3c119a.find((_0x3b04a8) => String(_0x3b04a8?.id || '').trim() === _0x35c80a)
      : null;
  if (!_0x1dadfb) throw new Error('RunningHub video manifest ' + _0x3ae853 + ' missing ' + _0x35c80a);
  if (_0x1dadfb.defaultValue === undefined)
    throw new Error('RunningHub video manifest ' + _0x3ae853 + ' missing ' + _0x35c80a + ' defaultValue');
  const _0x1f1879 = getPlainGenerationParams(_0x225d75?.generationParams);
  if (!Object.prototype.hasOwnProperty.call(_0x1f1879, _0x35c80a))
    throw new Error('RunningHub video node ' + _0x3ae853 + ' missing generationParams.' + _0x35c80a);
  const _0x5989e4 = _0x1f1879[_0x35c80a];
  if (_0x5989e4 === undefined || _0x5989e4 === null || String(_0x5989e4).trim() === '')
    throw new Error('RunningHub video node ' + _0x3ae853 + ' missing generationParams.' + _0x35c80a);
  return _0x5989e4;
}

export function resolveBerniniVideoReplaceInputMode({hasSourceVideo:hasSourceVideo=![],hasRefImage:hasRefImage=![],hasReferenceVideo:hasReferenceVideo=![]}={}){if(hasSourceVideo&&hasReferenceVideo)return'videoVideo';if(hasSourceVideo&&hasRefImage)return "videoImage";if(hasSourceVideo)return'video';if(hasRefImage)return "image";return "none";}

export function resolveBerniniFunctionForInputMode(_0x109010,_0x470616=''){const _0x35ddaf={'image':["i2v","r2v"],'video':["v2v","mv2v"],'videoImage':["vi2v","rv2v","vrc2v"],'videoVideo':["ads2v"]},_0x368f26=_0x35ddaf[_0x109010]||[],_0x4943c1=String(_0x470616||'')["trim"]();return _0x368f26["includes"](_0x4943c1)?_0x4943c1:_0x368f26[0x0]||'';}

export function buildVideoWorkflowReferenceSummaryParamsPatch(_0x1bab3d={},_0x197284='',_0x24ade3={}){const _0x303190=getRunningHubVideoParameterPanelPolicy(_0x197284),_0x58071a=_0x303190?.["fixedSlotSummary"],_0x3ad13f=String(_0x58071a?.["field"]||'')['trim']();if(!_0x3ad13f||_0x58071a?.["resolver"]!=='berniniVideoReplaceInputMode')return{};const _0xae313f=Math["max"](0x0,Number(_0x24ade3?.["imageCount"])||0x0),_0xab4abd=Math["max"](0x0,Number(_0x24ade3?.["videoCount"])||0x0),_0x5a9de8=resolveBerniniVideoReplaceInputMode({'hasSourceVideo':_0xab4abd>0x0,'hasRefImage':_0xae313f>0x0,'hasReferenceVideo':_0xab4abd>0x1}),_0x3fb10d={[_0x3ad13f]:_0x5a9de8},_0x3b3fe2=resolveBerniniFunctionForInputMode(_0x5a9de8,_0x1bab3d?.["generationParams"]?.["rhBerniniFunction"]??_0x1bab3d?.["rhBerniniFunction"]);if(_0x3b3fe2)_0x3fb10d['rhBerniniFunction']=_0x3b3fe2;return _0x3fb10d;}
