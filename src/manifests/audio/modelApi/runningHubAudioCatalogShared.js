import {
  createAudioModelApiManifest,
  createAudioModelApiExecutionManifest,
} from './sharedAudioModelApiFields.js';
import { getRunningHubModelApiProfileIds } from '../../../modules/runningHubProviderProfiles.js';
export const audioText = (id, label, description2 = '', args = {}) => ({
  id: id,
  label: label,
  type: 'text',
  placement: 'advanced',
  defaultValue: '',
  allowEmpty: true,
  description: description2,
  showInfoTip: Boolean(description2),
  ...args,
});
export const audioTextarea = (value, item, key = '', args2 = {}) =>
  audioText(value, item, key, { type: 'textarea', ...args2 });
export const audioSelect = (id2, label2, options, defaultValue, args3 = {}) => ({
  id: id2,
  label: label2,
  type: 'segmented',
  variant: 'pillMenu',
  placement: 'advanced',
  defaultValue: defaultValue,
  options: options['map']((value2) =>
    typeof value2 === 'object'
      ? value2
      : { value: value2, label: String(value2), selectedLabel: String(value2) },
  ),
  ...args3,
});
export const audioSlider = (id3, label3, min, max, defaultValue2, step = 1, args4 = {}) => ({
  id: id3,
  label: label3,
  type: 'slider',
  placement: 'advanced',
  min: min,
  max: max,
  step: step,
  defaultValue: defaultValue2,
  ...args4,
});
export const audioToggle = (id4, label4, defaultValue3 = false, args5 = {}) => ({
  id: id4,
  label: label4,
  type: 'toggle',
  placement: 'advanced',
  defaultValue: defaultValue3,
  ...args5,
});
export const audioSlot = (id5, label5, required = false, args6 = {}) => ({
  id: id5,
  label: label5,
  kind: 'audio',
  required: required,
  ...args6,
});
export const promptMapping = (path) => ({ path: path, from: 'prompt' });
export const paramMapping = (path2, index = path2, args7 = {}) => ({
  path: path2,
  from: 'param',
  field: 'generationParams.' + index,
  omitWhenEmpty: true,
  ...args7,
});
export const constantMapping = (path3, value3) => ({
  path: path3,
  from: 'constant',
  value: value3,
});
export const slotMapping = (path4, slot) => ({
  path: path4,
  from: 'inputAudios',
  transform: { name: 'audioSlot', slot: slot },
  omitWhenEmpty: true,
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
  id: id6,
  name: name,
  endpoint: endpoint,
  docId: docId,
  fields: fields = [],
  slots: slots = [],
  promptField: promptField = 'text',
  promptRequired: promptRequired = true,
  promptMaxLength: promptMaxLength,
  promptPlaceholder: promptPlaceholder = '输入要合成的文本',
  mapping: mapping = [],
  rules: rules = {},
  preparations: preparations = [],
  order: order = 200,
  description: description = '',
}) {
  const modelId = 'runninghub/' + id6,
    executionId = 'runninghub.model-api.audio.' + id6['replaceAll']('/', '.') + '.v1',
    sourceUrl = 'https://www.runninghub.cn/runninghub-api-doc-cn/api-' + docId,
    model = createAudioModelApiManifest({
      modelId: modelId,
      executionId: executionId,
      provider: 'runninghub',
      icon: 'images/RH.png',
      displayName: name,
      description: description || name,
      fields: fields,
      async: true,
      cancellable: false,
      prompt: {
        emptyPolicy: promptRequired ? 'block' : 'allow',
        ...(promptMaxLength ? { maxLength: promptMaxLength } : {}),
        placeholder: promptPlaceholder,
      },
      inputSlots: {
        allowedKinds: ['text', ...new Set(slots['map']((result) => result['kind']))],
        minByKind: {
          text: promptRequired ? 1 : 0,
          audio: slots['filter']((data) => data['kind'] === 'audio' && data['required'])['length'],
        },
        maxByKind: {
          image: slots['filter']((target) => target['kind'] === 'image')['length'],
          video: 0,
          audio: slots['filter']((source) => source['kind'] === 'audio')['length'],
        },
        fixedSlots: slots,
      },
      help: {
        tooltip: [
          name,
          description,
          promptPlaceholder,
          ...slots['map']((next) => next['label'] + '：' + (next['required'] ? '必填' : '可选')),
        ]
          ['filter'](Boolean)
          ['join']('\n'),
      },
      extensions: {
        audioMenu: { group: 'runninghubModel', order: order },
        providerProfiles: getRunningHubModelApiProfileIds(modelId),
        sourceUrl: sourceUrl,
      },
    }),
    execution = createAudioModelApiExecutionManifest({
      id: executionId,
      provider: 'runninghub',
      model: endpoint['replace']('/openapi/v2/', ''),
      endpoint: endpoint,
      bodyMapping: [...(promptField ? [promptMapping(promptField)] : []), ...mapping],
      responseMapping: RH_AUDIO_RESPONSE_MAPPING,
      extensions: {
        audioModelApi: {
          promptRequired: promptRequired,
          promptMaxLength: promptMaxLength,
          rules: rules,
          preparations: preparations,
        },
        sourceUrl: sourceUrl,
      },
    });
  return Object['freeze']({ model: model, execution: execution });
}
export const runningHubAudioHelperExecutionManifests = Object['freeze'](
  [
    ['murekaUpload', '/openapi/v2/mureka-ai/files-upload', 0x1d7ef04b],
    ['murekaClone', '/openapi/v2/mureka-ai/vocal-clone', 0x1d7ef04e],
    ['coverPreprocess', '/openapi/v2/minimax/music-cover-preprocess', 0x1d7ef03f],
  ]['map'](([audioPreparation, endpoint2, current]) =>
    Object['freeze']({
      schemaVersion: '1.0',
      id: RH_AUDIO_HELPER_IDS[audioPreparation],
      provider: 'runninghub',
      kind: 'text',
      adapterType: 'modelApi',
      endpoint: endpoint2,
      model: endpoint2['replace']('/openapi/v2/', ''),
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      bodyMapping: [],
      responseMapping: { ...RH_AUDIO_RESPONSE_MAPPING, resultPaths: ['results[].text'] },
      result: { taskIdPath: 'taskId', textFields: ['results[].text'] },
      extensions: {
        audioPreparation: audioPreparation,
        sourceUrl: 'https://www.runninghub.cn/runninghub-api-doc-cn/api-' + current,
      },
    }),
  ),
);
