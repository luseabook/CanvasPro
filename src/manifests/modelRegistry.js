import {
  qwenImageEditExecutionManifest,
  qwenImageEditModelManifest,
} from './image/runninghub/qwenImageEditManifest.js';
import { animeRealExecutionManifest, animeRealModelManifest } from './image/runninghub/animeRealManifest.js';
import {
  personReplaceV21ExecutionManifest,
  personReplaceV21ModelManifest,
} from './image/runninghub/personReplaceV21Manifest.js';
import {
  personReplaceV3ExecutionManifest,
  personReplaceV3ModelManifest,
} from './image/runninghub/personReplaceV3Manifest.js';
import {
  controlCameraExecutionManifest,
  controlCameraModelManifest,
} from './image/runninghub/controlCameraManifest.js';
import {
  rhVideoBasicExecutionManifest,
  rhVideoBasicModelManifest,
} from './video/runninghub/runningHubVideoBasicManifest.js';
import {
  rhVideoLtx23ExecutionManifest,
  rhVideoLtx23ModelManifest,
} from './video/runninghub/runningHubVideoLtx23Manifest.js';
import {
  rhVideoCommercialDigitalHumanExecutionManifest,
  rhVideoCommercialDigitalHumanModelManifest,
} from './video/runninghub/runningHubVideoCommercialDigitalHumanManifest.js';
import {
  rhVideoLipSyncExecutionManifest,
  rhVideoLipSyncModelManifest,
} from './video/runninghub/runningHubVideoLipSyncManifest.js';
import {
  rhVideoV54ExecutionManifest,
  rhVideoV54ModelManifest,
} from './video/runninghub/runningHubVideoV54Manifest.js';
import {
  rhVideoBerniniV1ExecutionManifest,
  rhVideoBerniniV1ModelManifest,
} from './video/runninghub/runningHubVideoBerniniV1Manifest.js';
import {
  rhVideoScailV2ExecutionManifest,
  rhVideoScailV2ModelManifest,
  rhVideoScail2V1ExecutionManifest,
  rhVideoScail2V1ModelManifest,
} from './video/runninghub/runningHubVideoScail2V1Manifest.js';
import {
  rhVideoWatermarkRemovalV2ExecutionManifest,
  rhVideoWatermarkRemovalV2ModelManifest,
} from './video/runninghub/runningHubVideoWatermarkRemovalV2Manifest.js';
import {
  rhVideoMattingExecutionManifest,
  rhVideoMattingModelManifest,
} from './video/runninghub/runningHubVideoMattingManifest.js';
import {
  rhVideoHdVipExecutionManifest,
  rhVideoHdVipModelManifest,
} from './video/runninghub/runningHubVideoHdVipManifest.js';
import {
  rhVideoFrameInterpolationExecutionManifest,
  rhVideoFrameInterpolationModelManifest,
} from './video/runninghub/runningHubVideoFrameInterpolationManifest.js';
import {
  rhAudioIndexTts2CloneExecutionManifest,
  rhAudioIndexTts2CloneModelManifest,
} from './audio/runninghub/runningHubAudioIndexTts2CloneManifest.js';
import {
  rhAudioVoiceConvertExecutionManifest,
  rhAudioVoiceConvertModelManifest,
} from './audio/runninghub/runningHubAudioVoiceConvertManifest.js';
import {
  rhAudioAdvancedVoiceCloneExecutionManifest,
  rhAudioAdvancedVoiceCloneModelManifest,
} from './audio/runninghub/runningHubAudioAdvancedVoiceCloneManifest.js';
import {
  rhAudioSeparationExecutionManifest,
  rhAudioSeparationModelManifest,
} from './audio/runninghub/runningHubAudioSeparationManifest.js';
import {
  vendorImageModelApiExecutionManifests,
  vendorImageModelApiModelManifests,
} from './image/modelApi/index.js';
import {
  dreaminaImageExecutionManifests,
  dreaminaImageModelManifests,
} from './image/dreamina/dreaminaImageManifest.js';
import {
  vendorVideoModelApiExecutionManifests,
  vendorVideoModelApiModelManifests,
} from './video/modelApi/vendorVideoModelApiManifests.js';
import {
  dreaminaVideoExecutionManifests,
  dreaminaVideoModelManifests,
} from './video/dreamina/dreaminaVideoManifest.js';
import {
  vendorTextModelApiExecutionManifests,
  vendorTextModelApiModelManifests,
} from './text/modelApi/vendorTextModelApiManifests.js';
const ALLOWED_ADAPTER_TYPES = new Set(['workflow', 'modelApi', 'localRuntime']),
  SUPPORTED_UI_CONTROL_TYPES = new Set([
    'segmented',
    'select',
    'slider',
    'stepper',
    'toggle',
    'text',
    'textarea',
    'image input',
    'video input',
    'audio input',
  ]),
  REQUIRED_MODEL_FIELDS = Object.freeze([
    'schemaVersion',
    'modelId',
    'provider',
    'kind',
    'adapterType',
    'executionId',
    'displayName',
    'uiSchema',
    'inputSlots',
    'outputType',
  ]),
  REQUIRED_EXECUTION_FIELDS = Object.freeze([
    'schemaVersion',
    'id',
    'provider',
    'kind',
    'adapterType',
    'result',
  ]),
  REQUIRED_WORKFLOW_EXECUTION_FIELDS = Object.freeze(['submitMode', 'queryMode', 'mapping']),
  REQUIRED_MODEL_API_EXECUTION_FIELDS = Object.freeze([
    'endpoint',
    'method',
    'model',
    'bodyMapping',
    'responseMapping',
  ]),
  REQUIRED_LOCAL_RUNTIME_EXECUTION_FIELDS = Object.freeze(['runtime']),
  _models = new Map(),
  _executions = new Map();
function assertPlainObject(_0x3e3389, _0x35e355) {
  if (!_0x3e3389 || typeof _0x3e3389 !== 'object' || Array.isArray(_0x3e3389))
    throw new TypeError('[manifest] ' + _0x35e355 + ' must be an object');
}
function isPlainObject(_0x51c609) {
  if (!_0x51c609 || typeof _0x51c609 !== 'object' || Array.isArray(_0x51c609)) return false;
  const _0x3223a7 = Object.getPrototypeOf(_0x51c609);
  return _0x3223a7 === Object.prototype || _0x3223a7 === null;
}
function assertPlainData(_0x3bb1d7, _0x3c9e5d, _0x5cb274 = new WeakSet()) {
  if (_0x3bb1d7 === null) return;
  const _0x32e9aa = typeof _0x3bb1d7;
  if (_0x32e9aa === 'string' || _0x32e9aa === 'number' || _0x32e9aa === 'boolean') return;
  if (
    _0x32e9aa === 'function' ||
    _0x32e9aa === 'symbol' ||
    _0x32e9aa === 'undefined' ||
    _0x32e9aa === 'bigint'
  )
    throw new TypeError('[manifest] ' + _0x3c9e5d + ' must be plain data');
  if (_0x5cb274.has(_0x3bb1d7))
    throw new TypeError('[manifest] ' + _0x3c9e5d + ' cannot contain circular references');
  _0x5cb274.add(_0x3bb1d7);
  if (Array.isArray(_0x3bb1d7)) {
    _0x3bb1d7.forEach((_0x24dd67, _0x5aface) => {
      assertPlainData(_0x24dd67, _0x3c9e5d + '[' + _0x5aface + ']', _0x5cb274);
    });
    return;
  }
  if (!isPlainObject(_0x3bb1d7)) throw new TypeError('[manifest] ' + _0x3c9e5d + ' must be plain data');
  Object.entries(_0x3bb1d7).forEach(([_0x3f4fbc, _0x5dcca3]) => {
    assertPlainData(_0x5dcca3, _0x3c9e5d + '.' + _0x3f4fbc, _0x5cb274);
  });
}
function assertRequiredFields(_0xa32247, _0x464188, _0x57efa8) {
  const _0x30ae44 = _0x464188.filter(
    (_0x1afeeb) =>
      _0xa32247[_0x1afeeb] === undefined || _0xa32247[_0x1afeeb] === null || _0xa32247[_0x1afeeb] === '',
  );
  if (_0x30ae44.length > 0)
    throw new Error('[manifest] ' + _0x57efa8 + ' missing required fields: ' + _0x30ae44.join(', '));
}
function normalizeRegistryKey(_0x4f7ecc) {
  return String(_0x4f7ecc || '').trim();
}
function getUiSchemaOptionValue(_0x139098) {
  return String(_0x139098?.value ?? _0x139098);
}
function normalizeUiSchemaCompareValue(_0x1b545b) {
  return String(_0x1b545b ?? '')
    .trim()
    .toLowerCase();
}
function isAdaptiveUiSchemaValue(_0x504df7) {
  const _0x4a4155 = String(_0x504df7 || '').trim(),
    _0x3f2d4f = _0x4a4155.toLowerCase();
  return (
    _0x3f2d4f === 'auto' ||
    _0x3f2d4f === 'adaptive' ||
    _0x3f2d4f === 'default' ||
    _0x4a4155 === '自适应' ||
    _0x4a4155 === '默认'
  );
}
function getUiSchemaDisableWhen(_0x4fa92a) {
  if (!_0x4fa92a || typeof _0x4fa92a !== 'object' || Array.isArray(_0x4fa92a)) return null;
  const _0x22635a = _0x4fa92a.disableWhen || _0x4fa92a.disabledWhen;
  return _0x22635a &&
    (Array.isArray(_0x22635a) || (typeof _0x22635a === 'object' && !Array.isArray(_0x22635a)))
    ? _0x22635a
    : null;
}
function uiSchemaDisableWhenMatches(_0x1745fa, _0x23d495 = {}) {
  if (Array.isArray(_0x1745fa))
    return _0x1745fa.some((_0x371b1c) => uiSchemaDisableWhenMatches(_0x371b1c, _0x23d495));
  if (!_0x1745fa || typeof _0x1745fa !== 'object') return false;
  if (Array.isArray(_0x1745fa.any))
    return _0x1745fa.any.some((_0x146cf2) => uiSchemaDisableWhenMatches(_0x146cf2, _0x23d495));
  if (Array.isArray(_0x1745fa.all))
    return _0x1745fa.all.every((_0x1821bb) => uiSchemaDisableWhenMatches(_0x1821bb, _0x23d495));
  const _0x135764 = normalizeRegistryKey(_0x1745fa?.field || _0x1745fa?.param);
  if (!_0x135764) return false;
  const _0x8aa6b4 = _0x1745fa.values !== undefined ? _0x1745fa.values : _0x1745fa.value,
    _0x132088 = Array.isArray(_0x8aa6b4) ? _0x8aa6b4 : [_0x8aa6b4],
    _0x10e709 = _0x132088.map(normalizeUiSchemaCompareValue),
    _0xaa66f = normalizeUiSchemaCompareValue(_0x23d495?.[_0x135764]);
  return _0x10e709.includes(_0xaa66f);
}
function isUiSchemaOptionDisabled(_0x5bd8ba, _0x2e59e0, _0xe23783 = {}) {
  if (_0x5bd8ba?.disabled === true || _0x5bd8ba?.readOnly === true) return true;
  if (!_0x2e59e0 || typeof _0x2e59e0 !== 'object' || Array.isArray(_0x2e59e0)) return false;
  if (_0x2e59e0.disabled === true) return true;
  const _0x24cea2 = getUiSchemaDisableWhen(_0x2e59e0);
  return _0x24cea2 ? uiSchemaDisableWhenMatches(_0x24cea2, _0xe23783) : false;
}
function findUiSchemaOptionByValue(_0x1f4a2b, _0xb83333) {
  const _0x153647 = Array.isArray(_0x1f4a2b?.options) ? _0x1f4a2b.options : [],
    _0x51f84b = String(_0xb83333 ?? '').trim(),
    _0x4c291e = _0x51f84b.toLowerCase();
  return (
    _0x153647.find((_0x109877) => getUiSchemaOptionValue(_0x109877) === _0x51f84b) ||
    _0x153647.find((_0x4095bc) => getUiSchemaOptionValue(_0x4095bc).trim().toLowerCase() === _0x4c291e) ||
    null
  );
}
function findAdaptiveUiSchemaOption(_0x484a50) {
  const _0x29f676 = Array.isArray(_0x484a50?.options) ? _0x484a50.options : [];
  return (
    _0x29f676.find((_0x2fc5b7) => {
      const _0x1da818 = getUiSchemaOptionValue(_0x2fc5b7),
        _0x2c17c1 = String(_0x2fc5b7?.label ?? _0x1da818).trim();
      return isAdaptiveUiSchemaValue(_0x1da818) || isAdaptiveUiSchemaValue(_0x2c17c1);
    }) || null
  );
}
function findEnabledUiSchemaOption(_0x3cf288, _0x1b06a9, _0x7cc5a = {}) {
  const _0x245cca = findUiSchemaOptionByValue(_0x3cf288, _0x1b06a9);
  return _0x245cca && !isUiSchemaOptionDisabled(_0x3cf288, _0x245cca, _0x7cc5a) ? _0x245cca : null;
}
function findFirstEnabledUiSchemaOption(_0x394027, _0x19bf55 = {}) {
  const _0x154892 = Array.isArray(_0x394027?.options) ? _0x394027.options : [];
  return (
    _0x154892.find(
      (_0x12d032) => _0x12d032?.hidden !== true && !isUiSchemaOptionDisabled(_0x394027, _0x12d032, _0x19bf55),
    ) || null
  );
}
function getUiSchemaDefaultValueAliases(_0x39a25e) {
  return (Array.isArray(_0x39a25e?.defaultValueAliases) ? _0x39a25e.defaultValueAliases : [])
    .map((_0x29865f) =>
      String(_0x29865f ?? '')
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean);
}
export function normalizeUiSchemaFieldValue(_0x17d820, _0x30dbad, { params: params = {} } = {}) {
  const _0x1e01ce = String(_0x17d820?.type || '')
    .trim()
    .toLowerCase();
  if (_0x30dbad === undefined || _0x30dbad === null) return _0x17d820?.defaultValue ?? '';
  if (String(_0x30dbad).trim() === '')
    return _0x17d820?.allowEmpty === true && (_0x1e01ce === 'text' || _0x1e01ce === 'textarea')
      ? ''
      : (_0x17d820?.defaultValue ?? '');
  const _0x357ac7 = String(_0x30dbad).trim().toLowerCase();
  if (getUiSchemaDefaultValueAliases(_0x17d820).includes(_0x357ac7)) return _0x17d820?.defaultValue ?? '';
  if (_0x1e01ce === 'toggle') {
    if (_0x30dbad === true || _0x30dbad === false) return _0x30dbad;
    if (['true', '1', 'yes', 'on'].includes(_0x357ac7)) return true;
    if (['false', '0', 'no', 'off'].includes(_0x357ac7)) return false;
    return _0x17d820?.defaultValue === true;
  }
  if (_0x1e01ce === 'slider' && Array.isArray(_0x17d820?.options) && _0x17d820.options.length) {
    const _0x10370e = findEnabledUiSchemaOption(_0x17d820, _0x30dbad, params);
    if (_0x10370e) return _0x10370e.value ?? _0x10370e;
    const _0x535b2f = findEnabledUiSchemaOption(_0x17d820, _0x17d820?.defaultValue, params);
    if (_0x535b2f) return _0x535b2f.value ?? _0x535b2f;
    const _0x1792e5 = findFirstEnabledUiSchemaOption(_0x17d820, params);
    if (_0x1792e5) return _0x1792e5.value ?? _0x1792e5;
    return _0x17d820?.defaultValue ?? '';
  }
  if (_0x1e01ce !== 'segmented' && _0x1e01ce !== 'select') return _0x30dbad;
  const _0x24ae96 = findEnabledUiSchemaOption(_0x17d820, _0x30dbad, params);
  if (_0x24ae96) return _0x24ae96.value ?? _0x24ae96;
  if (isAdaptiveUiSchemaValue(_0x30dbad)) {
    const _0x18ec81 = findAdaptiveUiSchemaOption(_0x17d820);
    if (_0x18ec81 && !isUiSchemaOptionDisabled(_0x17d820, _0x18ec81, params))
      return _0x18ec81.value ?? _0x18ec81;
  }
  const _0x29eac0 = findEnabledUiSchemaOption(_0x17d820, _0x17d820?.defaultValue, params);
  if (_0x29eac0) return _0x29eac0.value ?? _0x29eac0;
  const _0x10b0ed = findFirstEnabledUiSchemaOption(_0x17d820, params);
  if (_0x10b0ed) return _0x10b0ed.value ?? _0x10b0ed;
  return _0x17d820?.defaultValue ?? '';
}
export function sanitizeModelUiSchemaParams(
  _0x4270b4,
  _0x31fd2c = {},
  { includeDefaults: includeDefaults = true } = {},
) {
  const _0x4dafa7 = getModelManifest(_0x4270b4),
    _0x479881 = Array.isArray(_0x4dafa7?.uiSchema?.fields) ? _0x4dafa7.uiSchema.fields : [],
    _0x45aab3 = _0x31fd2c && typeof _0x31fd2c === 'object' && !Array.isArray(_0x31fd2c) ? _0x31fd2c : {},
    _0x2cbbed = {};
  return _0x479881.reduce((_0x44b45a, _0x1092e9) => {
    const _0x5f3a79 = normalizeRegistryKey(_0x1092e9?.id);
    if (!_0x5f3a79) return _0x44b45a;
    const _0xaa8fc = { ..._0x45aab3, ..._0x2cbbed, ..._0x44b45a };
    if (Object.prototype.hasOwnProperty.call(_0x45aab3, _0x5f3a79))
      ((_0x44b45a[_0x5f3a79] = normalizeUiSchemaFieldValue(_0x1092e9, _0x45aab3[_0x5f3a79], {
        params: _0xaa8fc,
      })),
        (_0x2cbbed[_0x5f3a79] = _0x44b45a[_0x5f3a79]));
    else
      includeDefaults
        ? ((_0x44b45a[_0x5f3a79] = normalizeUiSchemaFieldValue(_0x1092e9, _0x1092e9?.defaultValue, {
            params: _0xaa8fc,
          })),
          (_0x2cbbed[_0x5f3a79] = _0x44b45a[_0x5f3a79]))
        : (_0x2cbbed[_0x5f3a79] = normalizeUiSchemaFieldValue(_0x1092e9, _0x1092e9?.defaultValue, {
            params: _0xaa8fc,
          }));
    return _0x44b45a;
  }, {});
}
function getManifestRegistryKeys(_0x472f36, _0x3ce509, _0x22ca82) {
  const _0x5dea6a = normalizeRegistryKey(_0x472f36[_0x3ce509]);
  if (!_0x5dea6a) throw new Error('[manifest] ' + _0x22ca82 + ' has empty ' + _0x3ce509);
  const _0x371ae1 = [_0x5dea6a];
  if (_0x472f36.aliases !== undefined) {
    if (!Array.isArray(_0x472f36.aliases))
      throw new Error('[manifest] ' + _0x22ca82 + ' aliases must be an array');
    _0x472f36.aliases.forEach((_0x291344) => {
      const _0x5f57f5 = normalizeRegistryKey(_0x291344);
      if (_0x5f57f5) _0x371ae1.push(_0x5f57f5);
    });
  }
  return _0x371ae1;
}
function assertRegistryKeysAvailable(_0x5dde5e, _0x47c954, _0x1c418e, _0x411ee5) {
  const _0x3b7848 = new Set();
  return (
    _0x5dde5e.forEach((_0x2011df, _0x2f9fb9) => {
      const _0xce1665 = getManifestRegistryKeys(_0x2011df, _0x1c418e, _0x411ee5 + '[' + _0x2f9fb9 + ']');
      _0xce1665.forEach((_0x2f3152) => {
        if (_0x47c954.has(_0x2f3152))
          throw new Error('[manifest] ' + _0x411ee5 + ' duplicate key: ' + _0x2f3152);
        if (_0x3b7848.has(_0x2f3152))
          throw new Error('[manifest] ' + _0x411ee5 + ' duplicate key in bundle: ' + _0x2f3152);
        _0x3b7848.add(_0x2f3152);
      });
    }),
    _0x3b7848
  );
}
function buildManifestKeyMap(_0x123db6, _0x4c6ade, _0x1da748) {
  const _0x4011f4 = new Map();
  return (
    _0x123db6.forEach((_0x27288c, _0x563bd3) => {
      getManifestRegistryKeys(_0x27288c, _0x4c6ade, _0x1da748 + '[' + _0x563bd3 + ']').forEach(
        (_0x1afee6) => {
          _0x4011f4.set(_0x1afee6, _0x27288c);
        },
      );
    }),
    _0x4011f4
  );
}
function assertModelExecutionContract(_0x13a921, _0x1747aa) {
  ['adapterType', 'kind', 'provider'].forEach((_0x5ea845) => {
    const _0x1fb052 = normalizeRegistryKey(_0x13a921[_0x5ea845]),
      _0x177666 = normalizeRegistryKey(_0x1747aa[_0x5ea845]);
    if (_0x1fb052 !== _0x177666)
      throw new Error(
        '[manifest] model manifest ' +
          _0x13a921.modelId +
          ' ' +
          _0x5ea845 +
          ' (' +
          _0x13a921[_0x5ea845] +
          ') does not match execution manifest ' +
          _0x1747aa.id +
          ' ' +
          _0x5ea845 +
          ' (' +
          _0x1747aa[_0x5ea845] +
          ')',
      );
  });
}
function assertBundleModelExecutionLinks(_0x5a121f, _0x315daa) {
  _0x5a121f.forEach((_0x5a27b6) => {
    const _0x3caa0a = normalizeRegistryKey(_0x5a27b6.executionId),
      _0x3901dd = _executions.get(_0x3caa0a) || _0x315daa.get(_0x3caa0a);
    if (!_0x3901dd)
      throw new Error(
        '[manifest] model manifest ' +
          _0x5a27b6.modelId +
          ' references unknown executionId: ' +
          _0x5a27b6.executionId,
      );
    assertModelExecutionContract(_0x5a27b6, _0x3901dd);
  });
}
function assertAdapterType(_0x1860a5, _0x1db33d) {
  if (!ALLOWED_ADAPTER_TYPES.has(String(_0x1860a5 || '')))
    throw new Error('[manifest] ' + _0x1db33d + ' has unsupported adapterType: ' + _0x1860a5);
}
function assertExecutionTarget(_0x4d7eb5) {
  if (_0x4d7eb5.adapterType !== 'workflow') return;
  if (!_0x4d7eb5.workflowId && !_0x4d7eb5.appId)
    throw new Error('[manifest] workflow execution missing workflowId/appId');
}
function assertUiSchema(_0x167a8b) {
  const _0x4f8c29 = _0x167a8b.uiSchema;
  assertPlainObject(_0x4f8c29, 'model manifest uiSchema');
  if (!Array.isArray(_0x4f8c29.fields))
    throw new Error('[manifest] model manifest uiSchema.fields must be an array');
  _0x4f8c29.fields.forEach((_0x404613, _0x454252) => {
    (assertPlainObject(_0x404613, 'model manifest uiSchema.fields[' + _0x454252 + ']'),
      assertRequiredFields(
        _0x404613,
        ['id', 'type', 'defaultValue'],
        'model manifest uiSchema.fields[' + _0x454252 + ']',
      ));
    const _0x1f02d0 = String(_0x404613.type || '')
      .trim()
      .toLowerCase();
    if (!SUPPORTED_UI_CONTROL_TYPES.has(_0x1f02d0))
      throw new Error('[manifest] unsupported uiSchema control type: ' + _0x404613.type);
    if (
      (_0x1f02d0 === 'segmented' || _0x1f02d0 === 'select') &&
      (!Array.isArray(_0x404613.options) || _0x404613.options.length === 0)
    )
      throw new Error('[manifest] uiSchema field ' + _0x404613.id + ' requires non-empty options');
  });
}
function assertInputSlots(_0x49ec0c) {
  const _0x5cc922 = _0x49ec0c.inputSlots;
  assertPlainObject(_0x5cc922, 'model manifest inputSlots');
  const _0x3c62d9 =
    _0x5cc922.fixedSlots === undefined || _0x5cc922.fixedSlots === null ? [] : _0x5cc922.fixedSlots;
  if (!Array.isArray(_0x3c62d9))
    throw new Error('[manifest] model manifest inputSlots.fixedSlots must be an array');
  const _0x1f9803 = new Map(),
    _0x2c5fc3 = new Map(),
    _0x4953e0 = new Set();
  _0x3c62d9.forEach((_0x51f1dc, _0x4da777) => {
    (assertPlainObject(_0x51f1dc, 'model manifest inputSlots.fixedSlots[' + _0x4da777 + ']'),
      assertRequiredFields(
        _0x51f1dc,
        ['id', 'kind'],
        'model manifest inputSlots.fixedSlots[' + _0x4da777 + ']',
      ));
    const _0xc8fb21 = normalizeRegistryKey(_0x51f1dc.kind),
      _0x27b70a = String(_0x51f1dc.id || '').trim();
    if (_0x27b70a) _0x4953e0.add(_0x27b70a);
    _0x1f9803.set(_0xc8fb21, (_0x1f9803.get(_0xc8fb21) || 0) + 1);
    if (
      _0x51f1dc.required !== undefined &&
      _0x51f1dc.required !== null &&
      typeof _0x51f1dc.required !== 'boolean'
    )
      throw new Error('[manifest] fixed slot ' + _0x51f1dc.id + ' required must be a boolean');
    _0x51f1dc.required === true && _0x2c5fc3.set(_0xc8fb21, (_0x2c5fc3.get(_0xc8fb21) || 0) + 1);
  });
  const _0x3700ef = _0x5cc922.minByKind || {};
  if (_0x3700ef && !isPlainObject(_0x3700ef))
    throw new Error('[manifest] model manifest inputSlots.minByKind must be an object');
  Object.entries(_0x3700ef || {}).forEach(([_0x42d823, _0x4a7ecf]) => {
    const _0x4acbbe = Number(_0x4a7ecf);
    if (!Number.isFinite(_0x4acbbe) || _0x4acbbe < 0)
      throw new Error(
        '[manifest] model manifest inputSlots.minByKind.' + _0x42d823 + ' must be a non-negative number',
      );
    const _0x5b3ff3 = normalizeRegistryKey(_0x42d823),
      _0x1bac41 = _0x1f9803.get(_0x5b3ff3) || 0;
    if (_0x1bac41 === 0 || _0x4acbbe <= 0) return;
    const _0x265ad9 = _0x2c5fc3.get(_0x5b3ff3) || 0;
    if (_0x265ad9 < _0x4acbbe)
      throw new Error(
        '[manifest] model manifest ' +
          _0x49ec0c.modelId +
          ' inputSlots.' +
          _0x5b3ff3 +
          ' requires ' +
          _0x4acbbe +
          ' input(s), but only ' +
          _0x265ad9 +
          ' fixed slot(s) are marked required',
      );
  });
  const _0x36389f = _0x5cc922.exclusiveGroups || [];
  if (_0x36389f && !Array.isArray(_0x36389f))
    throw new Error('[manifest] model manifest inputSlots.exclusiveGroups must be an array');
  (_0x36389f || []).forEach((_0x418e51, _0x24cd63) => {
    assertPlainObject(_0x418e51, 'model manifest inputSlots.exclusiveGroups[' + _0x24cd63 + ']');
    if (!Array.isArray(_0x418e51.slots) || _0x418e51.slots.length < 2)
      throw new Error(
        '[manifest] model manifest inputSlots.exclusiveGroups[' +
          _0x24cd63 +
          '].slots must contain at least two slots',
      );
    (_0x418e51.slots.forEach((_0x1c11c1) => {
      const _0x40147f = String(_0x1c11c1 || '').trim();
      if (!_0x4953e0.has(_0x40147f))
        throw new Error(
          '[manifest] model manifest inputSlots.exclusiveGroups[' +
            _0x24cd63 +
            '] references unknown fixed slot: ' +
            _0x40147f,
        );
    }),
      ['min', 'max'].forEach((_0x3d4e6b) => {
        if (_0x418e51[_0x3d4e6b] === undefined || _0x418e51[_0x3d4e6b] === null) return;
        const _0xe32f5d = Number(_0x418e51[_0x3d4e6b]);
        if (!Number.isFinite(_0xe32f5d) || _0xe32f5d < 0)
          throw new Error(
            '[manifest] model manifest inputSlots.exclusiveGroups[' +
              _0x24cd63 +
              '].' +
              _0x3d4e6b +
              ' must be a non-negative number',
          );
      }));
  });
}
export function validateModelManifest(_0x110abe) {
  return (
    assertPlainObject(_0x110abe, 'model manifest'),
    assertRequiredFields(_0x110abe, REQUIRED_MODEL_FIELDS, 'model manifest'),
    assertAdapterType(_0x110abe.adapterType, 'model manifest'),
    assertUiSchema(_0x110abe),
    assertInputSlots(_0x110abe),
    true
  );
}
export function validateExecutionManifest(_0x4ddaa5) {
  return (
    assertPlainObject(_0x4ddaa5, 'execution manifest'),
    assertRequiredFields(_0x4ddaa5, REQUIRED_EXECUTION_FIELDS, 'execution manifest'),
    assertAdapterType(_0x4ddaa5.adapterType, 'execution manifest'),
    _0x4ddaa5.adapterType === 'workflow' &&
      assertRequiredFields(_0x4ddaa5, REQUIRED_WORKFLOW_EXECUTION_FIELDS, 'workflow execution manifest'),
    _0x4ddaa5.adapterType === 'modelApi' &&
      assertRequiredFields(_0x4ddaa5, REQUIRED_MODEL_API_EXECUTION_FIELDS, 'modelApi execution manifest'),
    _0x4ddaa5.adapterType === 'localRuntime' &&
      assertRequiredFields(
        _0x4ddaa5,
        REQUIRED_LOCAL_RUNTIME_EXECUTION_FIELDS,
        'localRuntime execution manifest',
      ),
    assertExecutionTarget(_0x4ddaa5),
    true
  );
}
function addModelManifestToRegistry(_0x5829f1) {
  const _0x19e176 = String(_0x5829f1.modelId || '').trim();
  (_models.set(_0x19e176, _0x5829f1),
    Array.isArray(_0x5829f1.aliases) &&
      _0x5829f1.aliases.forEach((_0x45f510) => {
        const _0x52944e = String(_0x45f510 || '').trim();
        if (_0x52944e) _models.set(_0x52944e, _0x5829f1);
      }));
}
function addExecutionManifestToRegistry(_0x198407) {
  (_executions.set(String(_0x198407.id), _0x198407),
    Array.isArray(_0x198407.aliases) &&
      _0x198407.aliases.forEach((_0x183555) => {
        const _0x260b18 = String(_0x183555 || '').trim();
        if (_0x260b18) _executions.set(_0x260b18, _0x198407);
      }));
}
function registerModelManifest(_0x365307) {
  validateModelManifest(_0x365307);
  const _0x417399 = getExecutionManifest(_0x365307.executionId);
  if (_0x417399) assertModelExecutionContract(_0x365307, _0x417399);
  addModelManifestToRegistry(_0x365307);
}
function registerExecutionManifest(_0x509e63) {
  (validateExecutionManifest(_0x509e63), addExecutionManifestToRegistry(_0x509e63));
}
export function registerManifestBundle(_0xfe73cc) {
  (assertPlainObject(_0xfe73cc, 'manifest bundle'),
    assertPlainData(_0xfe73cc, 'manifest bundle'),
    assertRequiredFields(_0xfe73cc, ['sourceId'], 'manifest bundle'));
  if (!normalizeRegistryKey(_0xfe73cc.sourceId))
    throw new Error('[manifest] manifest bundle sourceId must be non-empty');
  if (!Array.isArray(_0xfe73cc.models))
    throw new TypeError('[manifest] manifest bundle.models must be an array');
  if (!Array.isArray(_0xfe73cc.executions))
    throw new TypeError('[manifest] manifest bundle.executions must be an array');
  const _0x5787a7 = _0xfe73cc.executions,
    _0x41369a = _0xfe73cc.models;
  (_0x5787a7.forEach(validateExecutionManifest),
    _0x41369a.forEach(validateModelManifest),
    assertRegistryKeysAvailable(_0x5787a7, _executions, 'id', 'execution manifest'));
  const _0x188d84 = buildManifestKeyMap(_0x5787a7, 'id', 'execution manifest');
  return (
    assertRegistryKeysAvailable(_0x41369a, _models, 'modelId', 'model manifest'),
    assertBundleModelExecutionLinks(_0x41369a, _0x188d84),
    _0x5787a7.forEach(addExecutionManifestToRegistry),
    _0x41369a.forEach(addModelManifestToRegistry),
    true
  );
}
(registerExecutionManifest(qwenImageEditExecutionManifest),
  registerModelManifest(qwenImageEditModelManifest),
  registerExecutionManifest(animeRealExecutionManifest),
  registerModelManifest(animeRealModelManifest),
  registerExecutionManifest(personReplaceV21ExecutionManifest),
  registerModelManifest(personReplaceV21ModelManifest),
  registerExecutionManifest(personReplaceV3ExecutionManifest),
  registerModelManifest(personReplaceV3ModelManifest),
  registerExecutionManifest(controlCameraExecutionManifest),
  registerModelManifest(controlCameraModelManifest),
  registerExecutionManifest(rhVideoBasicExecutionManifest),
  registerModelManifest(rhVideoBasicModelManifest),
  registerExecutionManifest(rhVideoLtx23ExecutionManifest),
  registerModelManifest(rhVideoLtx23ModelManifest),
  registerExecutionManifest(rhVideoCommercialDigitalHumanExecutionManifest),
  registerModelManifest(rhVideoCommercialDigitalHumanModelManifest),
  registerExecutionManifest(rhVideoLipSyncExecutionManifest),
  registerModelManifest(rhVideoLipSyncModelManifest),
  registerExecutionManifest(rhVideoV54ExecutionManifest),
  registerModelManifest(rhVideoV54ModelManifest),
  registerExecutionManifest(rhVideoBerniniV1ExecutionManifest),
  registerModelManifest(rhVideoBerniniV1ModelManifest),
  registerExecutionManifest(rhVideoScail2V1ExecutionManifest),
  registerModelManifest(rhVideoScail2V1ModelManifest),
  registerExecutionManifest(rhVideoScailV2ExecutionManifest),
  registerModelManifest(rhVideoScailV2ModelManifest),
  registerExecutionManifest(rhVideoWatermarkRemovalV2ExecutionManifest),
  registerModelManifest(rhVideoWatermarkRemovalV2ModelManifest),
  registerExecutionManifest(rhVideoMattingExecutionManifest),
  registerModelManifest(rhVideoMattingModelManifest),
  registerExecutionManifest(rhVideoHdVipExecutionManifest),
  registerModelManifest(rhVideoHdVipModelManifest),
  registerExecutionManifest(rhVideoFrameInterpolationExecutionManifest),
  registerModelManifest(rhVideoFrameInterpolationModelManifest),
  registerExecutionManifest(rhAudioIndexTts2CloneExecutionManifest),
  registerModelManifest(rhAudioIndexTts2CloneModelManifest),
  registerExecutionManifest(rhAudioVoiceConvertExecutionManifest),
  registerModelManifest(rhAudioVoiceConvertModelManifest),
  registerExecutionManifest(rhAudioAdvancedVoiceCloneExecutionManifest),
  registerModelManifest(rhAudioAdvancedVoiceCloneModelManifest),
  registerExecutionManifest(rhAudioSeparationExecutionManifest),
  registerModelManifest(rhAudioSeparationModelManifest),
  vendorImageModelApiExecutionManifests.forEach(registerExecutionManifest),
  vendorImageModelApiModelManifests.forEach(registerModelManifest),
  dreaminaImageExecutionManifests.forEach(registerExecutionManifest),
  dreaminaImageModelManifests.forEach(registerModelManifest),
  vendorVideoModelApiExecutionManifests.forEach(registerExecutionManifest),
  vendorVideoModelApiModelManifests.forEach(registerModelManifest),
  dreaminaVideoExecutionManifests.forEach(registerExecutionManifest),
  dreaminaVideoModelManifests.forEach(registerModelManifest),
  vendorTextModelApiExecutionManifests.forEach(registerExecutionManifest),
  vendorTextModelApiModelManifests.forEach(registerModelManifest));
export function getModelManifest(_0x8005e4) {
  const _0x23d403 = String(_0x8005e4 || '').trim();
  return _models.get(_0x23d403) || null;
}
export function resolveModelManifest(_0x51dcaa, _0x1e9081 = '') {
  const _0x46e312 = getModelManifest(_0x51dcaa);
  if (!_0x46e312) return null;
  const _0x7db348 = String(_0x1e9081 || '').trim();
  if (_0x7db348 && _0x46e312.provider !== _0x7db348) return null;
  return _0x46e312;
}
export function getExecutionManifest(_0x4ad588) {
  return _executions.get(String(_0x4ad588 || '').trim()) || null;
}
export function resolveExecutionManifest(_0x4fe20f) {
  return getExecutionManifest(_0x4fe20f);
}
const PROVIDER_PREFIXES = Object.freeze({
  'runninghub-model': 'runninghub',
  runninghub: 'runninghubwf',
  dreamina: 'dreamina',
  apimart: 'apimart',
  agnes: 'agnes',
  ppio: 'ppio',
  grsai: 'grsai',
  volcengine: 'volcengine',
});
export function normalizeProviderId(_0x38bd91) {
  const _0x3eb09e = String(_0x38bd91 || '')
    .trim()
    .toLowerCase();
  if (_0x3eb09e === 'runninghub-workflow' || _0x3eb09e === 'runninghubwf') return 'runninghubwf';
  if (_0x3eb09e === 'runninghub-model') return 'runninghub';
  return _0x3eb09e;
}
function inferProviderFromModelPrefix(_0x51c51e) {
  const _0x24c5ef = String(_0x51c51e || '')
      .trim()
      .toLowerCase(),
    _0x2438f0 = _0x24c5ef.includes('/') ? _0x24c5ef.split('/')[0] : '';
  return PROVIDER_PREFIXES[_0x2438f0] || '';
}
function resolveModelManifestCandidate(_0x4673d9, _0x5641d1 = '') {
  const _0x1e35a8 = normalizeRegistryKey(_0x4673d9),
    _0x925778 = normalizeProviderId(_0x5641d1);
  if (!_0x1e35a8) return null;
  const _0x23e852 = getModelManifest(_0x1e35a8);
  if (_0x23e852 && (!_0x925778 || normalizeProviderId(_0x23e852.provider) === _0x925778))
    return {
      modelManifest: _0x23e852,
      inputModelId: _0x1e35a8,
      canonicalModelId: _0x23e852.modelId,
      source: 'exact',
    };
  if (_0x925778 && _0x1e35a8.includes('/')) {
    const [_0x5f423f, ..._0x1208e2] = _0x1e35a8.split('/'),
      _0x48df76 = inferProviderFromModelPrefix(_0x1e35a8),
      _0x390bf9 = _0x1208e2.join('/');
    if (_0x390bf9 && (!_0x48df76 || _0x48df76 === _0x925778)) {
      const _0x4e3e2c = getModelManifest(_0x390bf9);
      if (_0x4e3e2c && normalizeProviderId(_0x4e3e2c.provider) === _0x925778)
        return {
          modelManifest: _0x4e3e2c,
          inputModelId: _0x1e35a8,
          canonicalModelId: _0x4e3e2c.modelId,
          source: 'stripped:' + _0x5f423f,
        };
    }
  }
  if (_0x925778 && !_0x1e35a8.includes('/')) {
    const _0xa25465 = getModelManifest(_0x925778 + '/' + _0x1e35a8);
    if (_0xa25465 && normalizeProviderId(_0xa25465.provider) === _0x925778)
      return {
        modelManifest: _0xa25465,
        inputModelId: _0x1e35a8,
        canonicalModelId: _0xa25465.modelId,
        source: 'prefixed',
      };
  }
  return null;
}
export function resolveModelProvider(
  _0x1881a5,
  _0x2eb30e = '',
  { allowProviderHint: allowProviderHint = true, allowPrefixInference: allowPrefixInference = true } = {},
) {
  const _0x4ff174 = normalizeProviderId(_0x2eb30e);
  if (_0x4ff174 && allowProviderHint) return _0x4ff174;
  const _0x422c31 = resolveModelManifestCandidate(_0x1881a5, _0x4ff174);
  if (_0x422c31?.modelManifest?.provider) return normalizeProviderId(_0x422c31.modelManifest.provider);
  return allowPrefixInference ? inferProviderFromModelPrefix(_0x1881a5) : '';
}
export function resolveModelExecution(_0x4fe385, _0x1d27af = {}) {
  const _0x3b90c1 =
      typeof _0x1d27af === 'string' ? _0x1d27af : _0x1d27af?.providerHint || _0x1d27af?.provider || '',
    _0x306132 = resolveModelManifestCandidate(_0x4fe385, _0x3b90c1),
    _0xba9c00 = _0x306132?.modelManifest || null;
  if (!_0xba9c00) return null;
  const _0x36e8dc = getExecutionManifest(_0xba9c00.executionId);
  if (!_0x36e8dc) return null;
  return {
    modelManifest: _0xba9c00,
    executionManifest: _0x36e8dc,
    inputModelId: _0x306132.inputModelId,
    canonicalModelId: _0x306132.canonicalModelId,
    source: _0x306132.source,
  };
}
export function isModelApiModel(_0x4a73b2, _0x598fa5 = '') {
  const _0x53cd03 = resolveModelExecution(_0x4a73b2, { providerHint: _0x598fa5 });
  return (
    _0x53cd03?.modelManifest?.adapterType === 'modelApi' &&
    _0x53cd03?.executionManifest?.adapterType === 'modelApi'
  );
}
export function isWorkflowModel(_0xcfb220, _0x2dc892 = '') {
  const _0xaf3611 = resolveModelExecution(_0xcfb220, { providerHint: _0x2dc892 });
  return (
    _0xaf3611?.modelManifest?.adapterType === 'workflow' &&
    _0xaf3611?.executionManifest?.adapterType === 'workflow'
  );
}
export function isLocalRuntimeModel(_0x22a3dd, _0x5d10be = '') {
  const _0x5552b6 = resolveModelExecution(_0x22a3dd, { providerHint: _0x5d10be });
  return (
    _0x5552b6?.modelManifest?.adapterType === 'localRuntime' &&
    _0x5552b6?.executionManifest?.adapterType === 'localRuntime'
  );
}
export function getModelsByKind(_0x34ada7) {
  const _0x2797ca = String(_0x34ada7 || '').trim();
  return Array.from(new Set(_models.values())).filter(
    (_0x2f887c) => !_0x2797ca || _0x2f887c.kind === _0x2797ca,
  );
}
export function listModelManifests() {
  return Array.from(new Set(_models.values()));
}

const ALLOWED_PROMPT_EMPTY_POLICIES = new Set(['block', 'allowWithInput', 'allow']);

function isAspectRatioUiSchemaField(_0x253d88) {
  const _0x355260 = normalizeRegistryKey(_0x253d88?.['id'])['toLowerCase'](),
    _0x29b1bc = normalizeRegistryKey(_0x253d88?.['displayRole'])['toLowerCase'](),
    _0x28cc1e = normalizeRegistryKey(_0x253d88?.['variant'])['toLowerCase']();
  return _0x355260 === 'aspectratio' || _0x29b1bc === 'aspectratio' || _0x28cc1e === 'ratiopill';
}

function getUiSchemaFieldOptions(_0x5ea862) {
  const _0x10830b = Array['isArray'](_0x5ea862?.['options']) ? _0x5ea862['options'] : [],
    _0x1bc95b = Array['isArray'](_0x5ea862?.['developerOptions']) ? _0x5ea862['developerOptions'] : [];
  return [..._0x10830b, ..._0x1bc95b];
}

function assertPromptConfig(_0x757c93) {
  if (_0x757c93['prompt'] === undefined || _0x757c93['prompt'] === null) return;
  assertPlainObject(_0x757c93['prompt'], 'model manifest prompt');
  if (
    _0x757c93['prompt']['emptyPolicy'] !== undefined &&
    _0x757c93['prompt']['emptyPolicy'] !== null &&
    !ALLOWED_PROMPT_EMPTY_POLICIES['has'](String(_0x757c93['prompt']['emptyPolicy'] || ''))
  )
    throw new Error(
      '[manifest]\x20model\x20manifest\x20' +
        _0x757c93['modelId'] +
        ' prompt.emptyPolicy must be one of: ' +
        Array['from'](ALLOWED_PROMPT_EMPTY_POLICIES)['join'](',\x20'),
    );
  if (_0x757c93['prompt']['minLength'] !== undefined && _0x757c93['prompt']['minLength'] !== null) {
    const _0x3ee75e = Number(_0x757c93['prompt']['minLength']);
    if (!Number['isInteger'](_0x3ee75e) || _0x3ee75e < 0x0)
      throw new Error(
        '[manifest]\x20model\x20manifest\x20' +
          _0x757c93['modelId'] +
          ' prompt.minLength must be a non-negative integer',
      );
  }
}

function assertInputPolicyCondition(_0x5c1a5e, _0x590bc9) {
  if (Array['isArray'](_0x5c1a5e)) {
    if (_0x5c1a5e['length'] === 0x0)
      throw new Error('[manifest] ' + _0x590bc9 + '\x20must\x20not\x20be\x20empty');
    _0x5c1a5e['forEach']((_0x56ccbc, _0x473f40) =>
      assertInputPolicyCondition(_0x56ccbc, _0x590bc9 + '[' + _0x473f40 + ']'),
    );
    return;
  }
  assertPlainObject(_0x5c1a5e, _0x590bc9);
  if (Array['isArray'](_0x5c1a5e['any']) || Array['isArray'](_0x5c1a5e['all'])) {
    const _0x447dbb = Array['isArray'](_0x5c1a5e['any']) ? 'any' : 'all';
    assertInputPolicyCondition(_0x5c1a5e[_0x447dbb], _0x590bc9 + '.' + _0x447dbb);
    return;
  }
  if (!normalizeRegistryKey(_0x5c1a5e['field'] ?? _0x5c1a5e['param']))
    throw new Error('[manifest] ' + _0x590bc9 + '\x20must\x20declare\x20field\x20or\x20param');
  if (_0x5c1a5e['value'] === undefined && _0x5c1a5e['values'] === undefined)
    throw new Error('[manifest]\x20' + _0x590bc9 + ' must declare value or values');
}

function assertInputPolicyExtensions(_0x184ec4) {
  const _0x3a47f7 = _0x184ec4['inputSlots'];
  if (
    _0x3a47f7['preserveHiddenInputsByKind'] !== undefined &&
    typeof _0x3a47f7['preserveHiddenInputsByKind'] !== 'boolean'
  )
    throw new Error('[manifest] model manifest inputSlots.preserveHiddenInputsByKind must be a boolean');
  const _0x3e1317 = _0x3a47f7['preserveHiddenInputsByKindFields'];
  if (
    _0x3e1317 !== undefined &&
    (!Array['isArray'](_0x3e1317) ||
      _0x3e1317['length'] === 0x0 ||
      _0x3e1317['some']((_0x26e8d9) => !String(_0x26e8d9 || '')['trim']()))
  )
    throw new Error(
      '[manifest]\x20model\x20manifest\x20inputSlots.preserveHiddenInputsByKindFields\x20must\x20be\x20a\x20non-empty\x20string\x20array',
    );
  if (Array['isArray'](_0x3e1317) && _0x3a47f7['preserveHiddenInputsByKind'] !== !![])
    throw new Error(
      '[manifest] model manifest inputSlots.preserveHiddenInputsByKindFields requires preserveHiddenInputsByKind',
    );
  const _0x59a309 = _0x3a47f7['policyVariants'] || [];
  if (_0x59a309 && !Array['isArray'](_0x59a309))
    throw new Error('[manifest] model manifest inputSlots.policyVariants must be an array');
  (_0x59a309 || [])['forEach']((_0x5966f6, _0xc28623) => {
    const _0x91cb01 = 'model manifest inputSlots.policyVariants[' + _0xc28623 + ']';
    (assertPlainObject(_0x5966f6, _0x91cb01),
      assertInputPolicyCondition(_0x5966f6['when'], _0x91cb01 + '.when'));
    if (_0x5966f6['allowedKinds'] !== undefined && !Array['isArray'](_0x5966f6['allowedKinds']))
      throw new Error('[manifest] ' + _0x91cb01 + '.allowedKinds must be an array');
    if (_0x5966f6['maxByKind'] !== undefined && !isPlainObject(_0x5966f6['maxByKind']))
      throw new Error('[manifest] ' + _0x91cb01 + '.maxByKind must be an object');
    Object['entries'](_0x5966f6['maxByKind'] || {})['forEach'](([_0x1a287d, _0x17c907]) => {
      const _0x1b6e19 = Number(_0x17c907);
      if (!Number['isFinite'](_0x1b6e19) || _0x1b6e19 < 0x0)
        throw new Error(
          '[manifest]\x20' + _0x91cb01 + '.maxByKind.' + _0x1a287d + ' must be a non-negative number',
        );
    });
  });
  const _0x229592 = _0x3a47f7['mediaConstraintsByKind'] || {};
  if (_0x229592 && !isPlainObject(_0x229592))
    throw new Error('[manifest] model manifest inputSlots.mediaConstraintsByKind must be an object');
  Object['entries'](_0x229592 || {})['forEach'](([_0x584ebc, _0x17f505]) => {
    const _0x543c18 = 'model manifest inputSlots.mediaConstraintsByKind.' + _0x584ebc;
    (assertPlainObject(_0x17f505, _0x543c18),
      ['minDurationSeconds', 'maxDurationSeconds', 'maxBytes']['forEach']((_0x3fccc1) => {
        if (_0x17f505[_0x3fccc1] === undefined) return;
        const _0x175c6f = Number(_0x17f505[_0x3fccc1]);
        if (!Number['isFinite'](_0x175c6f) || _0x175c6f <= 0x0)
          throw new Error('[manifest] ' + _0x543c18 + '.' + _0x3fccc1 + ' must be positive');
      }));
    if (
      _0x17f505['minDurationSeconds'] !== undefined &&
      _0x17f505['maxDurationSeconds'] !== undefined &&
      Number(_0x17f505['minDurationSeconds']) > Number(_0x17f505['maxDurationSeconds'])
    )
      throw new Error(
        '[manifest] ' + _0x543c18 + '.minDurationSeconds\x20cannot\x20exceed\x20maxDurationSeconds',
      );
    if (
      _0x17f505['allowedExtensions'] !== undefined &&
      (!Array['isArray'](_0x17f505['allowedExtensions']) ||
        _0x17f505['allowedExtensions']['some']((_0x4f6303) => !String(_0x4f6303 || '')['trim']()))
    )
      throw new Error('[manifest] ' + _0x543c18 + '.allowedExtensions must be an array of non-empty strings');
  });
}

function assertManifestBundle(_0x3bd194) {
  (assertPlainObject(_0x3bd194, 'manifest bundle'),
    assertPlainData(_0x3bd194, 'manifest bundle'),
    assertRequiredFields(_0x3bd194, ['sourceId'], 'manifest bundle'));
  if (!normalizeRegistryKey(_0x3bd194['sourceId']))
    throw new Error('[manifest] manifest bundle sourceId must be non-empty');
  if (!Array['isArray'](_0x3bd194['models']))
    throw new TypeError('[manifest] manifest bundle.models must be an array');
  if (!Array['isArray'](_0x3bd194['executions']))
    throw new TypeError('[manifest] manifest bundle.executions must be an array');
  const _0x1d7c59 = _0x3bd194['executions'],
    _0x47741a = _0x3bd194['models'];
  (_0x1d7c59['forEach'](validateExecutionManifest),
    _0x47741a['forEach'](validateModelManifest),
    assertRegistryKeysAvailable(_0x1d7c59, _executions, 'id', 'execution\x20manifest'));
  const _0x557610 = buildManifestKeyMap(_0x1d7c59, 'id', 'execution manifest');
  return (
    assertRegistryKeysAvailable(_0x47741a, _models, 'modelId', 'model manifest'),
    assertBundleModelExecutionLinks(_0x47741a, _0x557610),
    { executions: _0x1d7c59, models: _0x47741a }
  );
}

export function validateManifestBundle(_0x4842b2) {
  return (assertManifestBundle(_0x4842b2), !![]);
}

function removeManifestFromRegistry(_0x489574, _0x4b614c, _0x331eaf, _0x341783) {
  const _0x392bfa = String(_0x489574?.[_0x331eaf] || '')['trim']();
  if (!_0x392bfa) return;
  getManifestRegistryKeys(_0x489574, _0x331eaf, _0x341783)['forEach']((_0x134a7f) => {
    const _0xbea582 = _0x4b614c['get'](_0x134a7f);
    String(_0xbea582?.[_0x331eaf] || '')['trim']() === _0x392bfa && _0x4b614c['delete'](_0x134a7f);
  });
}

export function unregisterManifestBundle(_0x218062) {
  const _0x5be94d = Array['isArray'](_0x218062?.['executions']) ? _0x218062['executions'] : [],
    _0x171d6c = Array['isArray'](_0x218062?.['models']) ? _0x218062['models'] : [];
  return (
    _0x5be94d['forEach']((_0x24d39b) =>
      removeManifestFromRegistry(_0x24d39b, _executions, 'id', 'execution\x20manifest'),
    ),
    _0x171d6c['forEach']((_0x558e34) =>
      removeManifestFromRegistry(_0x558e34, _models, 'modelId', 'model manifest'),
    ),
    !![]
  );
}

function resolveUniqueModelDisplayName(_0x1f7c87, _0x3d2c10 = '') {
  const _0x2fadaf = normalizeRegistryKey(_0x1f7c87)['toLowerCase'](),
    _0x88270e = normalizeProviderId(_0x3d2c10);
  if (!_0x2fadaf) return null;
  const _0x1805b4 = Array['from'](new Set(_models['values']()))['filter']((_0x351cf6) => {
    if (normalizeRegistryKey(_0x351cf6?.['displayName'])['toLowerCase']() !== _0x2fadaf) return ![];
    return !_0x88270e || normalizeProviderId(_0x351cf6?.['provider']) === _0x88270e;
  });
  return _0x1805b4['length'] === 0x1 ? _0x1805b4[0x0] : null;
}
