import { getRunningHubModelApiProfileIds } from '../../../modules/runningHubProviderProfiles.js';
const definitions = [
  {
    id: 'suno-lyrics',
    name: 'Suno 歌词生成',
    endpoint: '/openapi/v2/rhart-audio/suno/lyrics',
    docId: 0x1ac2ba4c,
    maxLength: 500,
  },
  {
    id: 'mureka-lyrics',
    name: 'Mureka 歌词生成',
    endpoint: '/openapi/v2/mureka-ai/generate-lyrics',
    docId: 0x1d7ef04a,
    maxLength: 1024,
  },
];
export const runningHubLyricsModels = Object['freeze'](
  definitions['map']((displayName) =>
    Object['freeze']({
      schemaVersion: '1.0',
      modelId: 'runninghub/' + displayName['id'],
      provider: 'runninghub',
      kind: 'text',
      adapterType: 'modelApi',
      executionId: 'runninghub.model-api.text.' + displayName['id'] + '.v1',
      displayName: displayName['name'],
      icon: 'images/RH.png',
      description: '描述主题、情绪和曲风，生成可连接到音乐节点的歌词。',
      inputSlots: {
        allowedKinds: ['text'],
        minByKind: { text: 1 },
        maxByKind: { image: 0, video: 0, audio: 0 },
        fixedSlots: [],
      },
      uiSchema: { fields: [] },
      uiPlacement: ['modelMenu'],
      prompt: {
        emptyPolicy: 'block',
        maxLength: displayName['maxLength'],
        placeholder: '描述歌词主题，最多 ' + displayName['maxLength'] + ' 字符',
      },
      extensions: {
        textMenu: {
          group: 'runninghub',
          title: displayName['name'],
          icon: 'runninghub',
          subtitle: '音乐创作 · 歌词生成',
        },
        providerProfiles: getRunningHubModelApiProfileIds('runninghub/' + displayName['id']),
      },
      async: !![],
      cancellable: ![],
      outputType: 'text',
    }),
  ),
);
export const runningHubLyricsExecutions = Object['freeze'](
  definitions['map']((model) =>
    Object['freeze']({
      schemaVersion: '1.0',
      id: 'runninghub.model-api.text.' + model['id'] + '.v1',
      provider: 'runninghub',
      kind: 'text',
      adapterType: 'modelApi',
      model: model['endpoint']['replace']('/openapi/v2/', ''),
      endpoint: model['endpoint'],
      method: 'POST',
      endpointMode: 'task',
      headers: { 'Content-Type': 'application/json' },
      bodyMapping: [{ path: 'prompt', from: 'prompt' }],
      responseMapping: { taskIdPath: 'taskId', statusPath: 'status', resultPaths: ['results[].text'] },
      result: { taskIdPath: 'taskId', textFields: ['results[].text'] },
      extensions: {
        audioModelApi: { promptRequired: !![], promptMaxLength: model['maxLength'] },
        sourceUrl: 'https://www.runninghub.cn/runninghub-api-doc-cn/api-' + model['docId'],
      },
    }),
  ),
);
