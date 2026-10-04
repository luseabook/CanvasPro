export function normalizeDirectorGeneratedLayers(value, item) {
  return (Array['isArray'](value) ? value : [])
    ['slice'](-0x1e)
    ['filter']((key) => typeof key?.['id'] === 'string')
    ['map']((id) => ({
      id: id['id'],
      name: String(id['name'] || '生成层')['slice'](0x0, 0x78),
      objectIds: (Array['isArray'](id['objectIds']) ? id['objectIds'] : [])['filter'](
        (index) => typeof index === 'string',
      ),
      versions: (Array['isArray'](id['versions']) ? id['versions'] : [])['slice'](-0xa)['map']((error) => ({
        id: String(error['id']),
        name: String(error['name'] || '历史版本')['slice'](0x0, 0x78),
        objects: (Array['isArray'](error['objects']) ? error['objects'] : [])['map'](item)['filter'](Boolean),
      })),
    }));
}
export function normalizeDirectorGenerationJobs(result) {
  return (Array['isArray'](result) ? result : [])
    ['slice'](-0x1e)
    ['filter']((data) => typeof data?.['id'] === 'string')
    ['map']((id2) => ({
      id: id2['id'],
      projectId: String(id2['projectId'] || ''),
      sceneId: String(id2['sceneId'] || ''),
      kind: id2['kind'] === 'panorama' ? 'panorama' : 'layer',
      status: ['running', 'completed', 'failed']['includes'](id2['status']) ? id2['status'] : 'failed',
      message: String(id2['message'] || '')['slice'](0x0, 0x1f4),
      prompt: String(id2['prompt'] || '')['slice'](0x0, 0x1388),
      model: String(id2['model'] || ''),
      provider: String(id2['provider'] || ''),
      taskId: String(id2['taskId'] || ''),
      createdAt: Math['max'](0x0, Number(id2['createdAt']) || 0x0),
    }));
}
export function applyDirectorGeneratedLayer(
  args,
  options,
  { layerId: layerId = '', name: name = 'AI 生成层' } = {},
) {
  args['generatedLayers'] ||= [];
  let name2 = args['generatedLayers']['find']((target) => target['id'] === layerId);
  if (layerId && !name2) throw new Error('要替换的生成层已不存在。');
  !name2 &&
    ((name2 = {
      id: 'layer-' + globalThis['crypto']['randomUUID'](),
      name: name,
      objectIds: [],
      versions: [],
    }),
    args['generatedLayers']['push'](name2));
  if (
    name2['objectIds']['some'](
      (source) => args['objects']['find']((next) => next['id'] === source)?.['locked'],
    )
  )
    throw new Error('生成层中有锁定对象，无法替换。');
  const map = new Set(name2['objectIds']),
    list = options['objects']
      ['filter']((current) => ['prop', 'character', 'light']['includes'](current['type']))
      ['map']((entry) => ({
        ...structuredClone(entry),
        id: 'generated-' + globalThis['crypto']['randomUUID'](),
        parentId: undefined,
      }));
  if (!list['length']) throw new Error('生成结果没有可插入的场景对象。');
  if (map['size'])
    name2['versions']['push']({
      id: 'version-' + globalThis['crypto']['randomUUID'](),
      name: name2['name'] + ' · ' + new Date()['toLocaleString'](),
      objects: structuredClone(args['objects']['filter']((record) => map['has'](record['id']))),
    });
  return (
    (name2['versions'] = name2['versions']['slice'](-0xa)),
    (args['objects'] = [...args['objects']['filter']((payload) => !map['has'](payload['id'])), ...list]),
    (name2['objectIds'] = list['map']((handle) => handle['id'])),
    args
  );
}
export function restoreDirectorLayerVersion(state, layerId2, config) {
  const scope = state['generatedLayers']?.['find']((input) => input['id'] === layerId2),
    objects = scope?.['versions']['find']((output) => output['id'] === config);
  if (!objects) throw new Error('生成层历史版本不存在。');
  return applyDirectorGeneratedLayer(state, { objects: objects['objects'] }, { layerId: layerId2 });
}
