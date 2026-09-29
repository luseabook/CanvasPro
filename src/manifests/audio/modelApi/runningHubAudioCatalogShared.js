import {
  createAudioModelApiManifest,
  createAudioModelApiExecutionManifest,
} from './sharedAudioModelApiFields.js';
import { getRunningHubModelApiProfileIds } from '../../../modules/runningHubProviderProfiles.js';
export const audioText = (_0x3b0794, _0x5d12c0, _0x4354c7 = '', _0x477520 = {}) => ({
  id: _0x3b0794,
  label: _0x5d12c0,
  type: 'text',
  placement: 'advanced',
  defaultValue: '',
  allowEmpty: !![],
  description: _0x4354c7,
  showInfoTip: Boolean(_0x4354c7),
  ..._0x477520,
});
export const audioTextarea = (_0x53589c, _0x4227ef, _0x2f3a46 = '', _0x1ed29a = {}) =>
  audioText(_0x53589c, _0x4227ef, _0x2f3a46, { type: 'textarea', ..._0x1ed29a });
export const audioSelect = (_0x166e63, _0x407281, _0x2abb9f, _0xe18ff4, _0x3fdd18 = {}) => ({
  id: _0x166e63,
  label: _0x407281,
  type: 'segmented',
  variant: 'pillMenu',
  placement: 'advanced',
  defaultValue: _0xe18ff4,
  options: _0x2abb9f['map']((_0x4e1965) =>
    typeof _0x4e1965 === 'object'
      ? _0x4e1965
      : { value: _0x4e1965, label: String(_0x4e1965), selectedLabel: String(_0x4e1965) },
  ),
  ..._0x3fdd18,
});
export const audioSlider = (
  _0x36d511,
  _0x16ba79,
  _0x3d018e,
  _0x490f84,
  _0x1f9846,
  _0x58438f = 0x1,
  _0x74953a = {},
) => ({
  id: _0x36d511,
  label: _0x16ba79,
  type: 'slider',
  placement: 'advanced',
  min: _0x3d018e,
  max: _0x490f84,
  step: _0x58438f,
  defaultValue: _0x1f9846,
  ..._0x74953a,
});
export const audioToggle = (_0xc1b12f, _0x4bc413, _0x95cf79 = ![], _0x66aeb3 = {}) => ({
  id: _0xc1b12f,
  label: _0x4bc413,
  type: 'toggle',
  placement: 'advanced',
  defaultValue: _0x95cf79,
  ..._0x66aeb3,
});
export const audioSlot = (_0x10bcf1, _0x263829, _0xc84bf3 = ![], _0x2aad02 = {}) => ({
  id: _0x10bcf1,
  label: _0x263829,
  kind: 'audio',
  required: _0xc84bf3,
  ..._0x2aad02,
});
export const promptMapping = (_0x4a6d9e) => ({ path: _0x4a6d9e, from: 'prompt' });
export const paramMapping = (_0x33aa86, _0x216a86 = _0x33aa86, _0x44b404 = {}) => ({
  path: _0x33aa86,
  from: 'param',
  field: 'generationParams.' + _0x216a86,
  omitWhenEmpty: !![],
  ..._0x44b404,
});
export const constantMapping = (_0x158881, _0x46ef4c) => ({
  path: _0x158881,
  from: 'constant',
  value: _0x46ef4c,
});
export const slotMapping = (_0x2a2fb7, _0x2dd5a0) => ({
  path: _0x2a2fb7,
  from: 'inputAudios',
  transform: { name: 'audioSlot', slot: _0x2dd5a0 },
  omitWhenEmpty: !![],
});
export const RH_AUDIO_RESPONSE_MAPPING = Object['freeze']({
  taskIdPath: 'taskId',
  statusPath: 'status',
  errorPath: ['errorMessage'],
  resultPaths: ['results[].url'],
});
export const RH_AUDIO_HELPER_IDS = Object['freeze']({
  murekaUpload: 'runninghub.model-api.audio.mureka-upload.v1',
  murekaClone: 'runninghub.model-api.audio.mureka-clone.v1',
  coverPreprocess: 'runninghub.model-api.audio.minimax-cover-preprocess.v1',
});
export function createRunningHubAudioCatalogEntry({
  id: _0x2c89fb,
  name: _0x20f744,
  endpoint: _0x203d61,
  docId: _0x4e2893,
  fields: fields = [],
  slots: slots = [],
  promptField: promptField = 'text',
  promptRequired: promptRequired = !![],
  promptMaxLength: _0x1248c2,
  promptPlaceholder: promptPlaceholder = '输入要合成的文本',
  mapping: mapping = [],
  rules: rules = {},
  preparations: preparations = [],
  order: order = 0xc8,
  description: description = '',
}) {
  const _0x14f8fa = 'runninghub/' + _0x2c89fb,
    _0x11c504 = 'runninghub.model-api.audio.' + _0x2c89fb['replaceAll']('/', '.') + '.v1',
    _0x29ccb4 = 'https://www.runninghub.cn/runninghub-api-doc-cn/api-' + _0x4e2893,
    _0x467d3a = createAudioModelApiManifest({
      modelId: _0x14f8fa,
      executionId: _0x11c504,
      provider: 'runninghub',
      icon: 'images/RH.png',
      displayName: _0x20f744,
      description: description || _0x20f744,
      fields: fields,
      async: !![],
      cancellable: ![],
      prompt: {
        emptyPolicy: promptRequired ? 'block' : 'allow',
        ...(_0x1248c2 ? { maxLength: _0x1248c2 } : {}),
        placeholder: promptPlaceholder,
      },
      inputSlots: {
        allowedKinds: ['text', ...new Set(slots['map']((_0x38ee9b) => _0x38ee9b['kind']))],
        minByKind: {
          text: promptRequired ? 0x1 : 0x0,
          audio: slots['filter']((_0x3b3d46) => _0x3b3d46['kind'] === 'audio' && _0x3b3d46['required'])[
            'length'
          ],
        },
        maxByKind: {
          image: slots['filter']((_0x2eb1d4) => _0x2eb1d4['kind'] === 'image')['length'],
          video: 0x0,
          audio: slots['filter']((_0x4f3384) => _0x4f3384['kind'] === 'audio')['length'],
        },
        fixedSlots: slots,
      },
      help: {
        tooltip: [
          _0x20f744,
          description,
          promptPlaceholder,
          ...slots['map'](
            (_0x22c229) => _0x22c229['label'] + '：' + (_0x22c229['required'] ? '必填' : '可选'),
          ),
        ]
          ['filter'](Boolean)
          ['join']('\x0a'),
      },
      extensions: {
        audioMenu: { group: 'runninghubModel', order: order },
        providerProfiles: getRunningHubModelApiProfileIds(_0x14f8fa),
        sourceUrl: _0x29ccb4,
      },
    }),
    _0x5200bf = createAudioModelApiExecutionManifest({
      id: _0x11c504,
      provider: 'runninghub',
      model: _0x203d61['replace']('/openapi/v2/', ''),
      endpoint: _0x203d61,
      bodyMapping: [...(promptField ? [promptMapping(promptField)] : []), ...mapping],
      responseMapping: RH_AUDIO_RESPONSE_MAPPING,
      extensions: {
        audioModelApi: {
          promptRequired: promptRequired,
          promptMaxLength: _0x1248c2,
          rules: rules,
          preparations: preparations,
        },
        sourceUrl: _0x29ccb4,
      },
    });
  return Object['freeze']({ model: _0x467d3a, execution: _0x5200bf });
}
export const runningHubAudioHelperExecutionManifests = Object['freeze'](
  [
    ['murekaUpload', '/openapi/v2/mureka-ai/files-upload', 0x1d7ef04b],
    ['murekaClone', '/openapi/v2/mureka-ai/vocal-clone', 0x1d7ef04e],
    ['coverPreprocess', '/openapi/v2/minimax/music-cover-preprocess', 0x1d7ef03f],
  ]['map'](([_0x1b004d, _0x277e8f, _0x8d5317]) =>
    Object['freeze']({
      schemaVersion: '1.0',
      id: RH_AUDIO_HELPER_IDS[_0x1b004d],
      provider: 'runninghub',
      kind: 'text',
      adapterType: 'modelApi',
      endpoint: _0x277e8f,
      model: _0x277e8f['replace']('/openapi/v2/', ''),
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      bodyMapping: [],
      responseMapping: { ...RH_AUDIO_RESPONSE_MAPPING, resultPaths: ['results[].text'] },
      result: { taskIdPath: 'taskId', textFields: ['results[].text'] },
      extensions: {
        audioPreparation: _0x1b004d,
        sourceUrl: 'https://www.runninghub.cn/runninghub-api-doc-cn/api-' + _0x8d5317,
      },
    }),
  ),
);
