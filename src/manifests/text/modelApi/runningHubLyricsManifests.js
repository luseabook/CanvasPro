import { getRunningHubModelApiProfileIds } from '../../../modules/runningHubProviderProfiles.js';
const definitions = [
  {
    id: 'suno-lyrics',
    name: 'Suno\x20歌词生成',
    endpoint: '/openapi/v2/rhart-audio/suno/lyrics',
    docId: 0x1ac2ba4c,
    maxLength: 0x1f4,
  },
  {
    id: 'mureka-lyrics',
    name: 'Mureka 歌词生成',
    endpoint: '/openapi/v2/mureka-ai/generate-lyrics',
    docId: 0x1d7ef04a,
    maxLength: 0x400,
  },
];
export const runningHubLyricsModels = Object['freeze'](
  definitions['map']((_0x1e7a02) =>
    Object['freeze']({
      schemaVersion: '1.0',
      modelId: 'runninghub/' + _0x1e7a02['id'],
      provider: 'runninghub',
      kind: 'text',
      adapterType: 'modelApi',
      executionId: 'runninghub.model-api.text.' + _0x1e7a02['id'] + '.v1',
      displayName: _0x1e7a02['name'],
      icon: 'images/RH.png',
      description: '描述主题、情绪和曲风，生成可连接到音乐节点的歌词。',
      inputSlots: {
        allowedKinds: ['text'],
        minByKind: { text: 0x1 },
        maxByKind: { image: 0x0, video: 0x0, audio: 0x0 },
        fixedSlots: [],
      },
      uiSchema: { fields: [] },
      uiPlacement: ['modelMenu'],
      prompt: {
        emptyPolicy: 'block',
        maxLength: _0x1e7a02['maxLength'],
        placeholder: '描述歌词主题，最多\x20' + _0x1e7a02['maxLength'] + ' 字符',
      },
      extensions: {
        textMenu: {
          group: 'runninghub',
          title: _0x1e7a02['name'],
          icon: 'runninghub',
          subtitle: '音乐创作\x20·\x20歌词生成',
        },
        providerProfiles: getRunningHubModelApiProfileIds('runninghub/' + _0x1e7a02['id']),
      },
      async: !![],
      cancellable: ![],
      outputType: 'text',
    }),
  ),
);
export const runningHubLyricsExecutions = Object['freeze'](
  definitions['map']((_0x2c9d68) =>
    Object['freeze']({
      schemaVersion: '1.0',
      id: 'runninghub.model-api.text.' + _0x2c9d68['id'] + '.v1',
      provider: 'runninghub',
      kind: 'text',
      adapterType: 'modelApi',
      model: _0x2c9d68['endpoint']['replace']('/openapi/v2/', ''),
      endpoint: _0x2c9d68['endpoint'],
      method: 'POST',
      endpointMode: 'task',
      headers: { 'Content-Type': 'application/json' },
      bodyMapping: [{ path: 'prompt', from: 'prompt' }],
      responseMapping: { taskIdPath: 'taskId', statusPath: 'status', resultPaths: ['results[].text'] },
      result: { taskIdPath: 'taskId', textFields: ['results[].text'] },
      extensions: {
        audioModelApi: { promptRequired: !![], promptMaxLength: _0x2c9d68['maxLength'] },
        sourceUrl: 'https://www.runninghub.cn/runninghub-api-doc-cn/api-' + _0x2c9d68['docId'],
      },
    }),
  ),
);
