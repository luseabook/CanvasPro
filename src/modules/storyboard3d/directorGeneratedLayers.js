export function normalizeDirectorGeneratedLayers(_0xbf225a, _0x5d3a43) {
  return (Array['isArray'](_0xbf225a) ? _0xbf225a : [])
    ['slice'](-0x1e)
    ['filter']((_0x51bf18) => typeof _0x51bf18?.['id'] === 'string')
    ['map']((_0x1de524) => ({
      id: _0x1de524['id'],
      name: String(_0x1de524['name'] || '生成层')['slice'](0x0, 0x78),
      objectIds: (Array['isArray'](_0x1de524['objectIds']) ? _0x1de524['objectIds'] : [])['filter'](
        (_0x355df6) => typeof _0x355df6 === 'string',
      ),
      versions: (Array['isArray'](_0x1de524['versions']) ? _0x1de524['versions'] : [])
        ['slice'](-0xa)
        ['map']((_0xdda639) => ({
          id: String(_0xdda639['id']),
          name: String(_0xdda639['name'] || '历史版本')['slice'](0x0, 0x78),
          objects: (Array['isArray'](_0xdda639['objects']) ? _0xdda639['objects'] : [])
            ['map'](_0x5d3a43)
            ['filter'](Boolean),
        })),
    }));
}
export function normalizeDirectorGenerationJobs(_0x929e8) {
  return (Array['isArray'](_0x929e8) ? _0x929e8 : [])
    ['slice'](-0x1e)
    ['filter']((_0x377a44) => typeof _0x377a44?.['id'] === 'string')
    ['map']((_0x5720b4) => ({
      id: _0x5720b4['id'],
      projectId: String(_0x5720b4['projectId'] || ''),
      sceneId: String(_0x5720b4['sceneId'] || ''),
      kind: _0x5720b4['kind'] === 'panorama' ? 'panorama' : 'layer',
      status: ['running', 'completed', 'failed']['includes'](_0x5720b4['status'])
        ? _0x5720b4['status']
        : 'failed',
      message: String(_0x5720b4['message'] || '')['slice'](0x0, 0x1f4),
      prompt: String(_0x5720b4['prompt'] || '')['slice'](0x0, 0x1388),
      model: String(_0x5720b4['model'] || ''),
      provider: String(_0x5720b4['provider'] || ''),
      taskId: String(_0x5720b4['taskId'] || ''),
      createdAt: Math['max'](0x0, Number(_0x5720b4['createdAt']) || 0x0),
    }));
}
export function applyDirectorGeneratedLayer(
  _0x104446,
  _0x4eb0da,
  { layerId: layerId = '', name: name = 'AI 生成层' } = {},
) {
  _0x104446['generatedLayers'] ||= [];
  let _0x335755 = _0x104446['generatedLayers']['find']((_0x319673) => _0x319673['id'] === layerId);
  if (layerId && !_0x335755) throw new Error('要替换的生成层已不存在。');
  !_0x335755 &&
    ((_0x335755 = {
      id: 'layer-' + globalThis['crypto']['randomUUID'](),
      name: name,
      objectIds: [],
      versions: [],
    }),
    _0x104446['generatedLayers']['push'](_0x335755));
  if (
    _0x335755['objectIds']['some'](
      (_0xe0451b) => _0x104446['objects']['find']((_0x32d724) => _0x32d724['id'] === _0xe0451b)?.['locked'],
    )
  )
    throw new Error('生成层中有锁定对象，无法替换。');
  const _0x11fd6 = new Set(_0x335755['objectIds']),
    _0x295bef = _0x4eb0da['objects']
      ['filter']((_0x2b4ff0) => ['prop', 'character', 'light']['includes'](_0x2b4ff0['type']))
      ['map']((_0x230d58) => ({
        ...structuredClone(_0x230d58),
        id: 'generated-' + globalThis['crypto']['randomUUID'](),
        parentId: undefined,
      }));
  if (!_0x295bef['length']) throw new Error('生成结果没有可插入的场景对象。');
  if (_0x11fd6['size'])
    _0x335755['versions']['push']({
      id: 'version-' + globalThis['crypto']['randomUUID'](),
      name: _0x335755['name'] + ' · ' + new Date()['toLocaleString'](),
      objects: structuredClone(
        _0x104446['objects']['filter']((_0x27a502) => _0x11fd6['has'](_0x27a502['id'])),
      ),
    });
  return (
    (_0x335755['versions'] = _0x335755['versions']['slice'](-0xa)),
    (_0x104446['objects'] = [
      ..._0x104446['objects']['filter']((_0x3df223) => !_0x11fd6['has'](_0x3df223['id'])),
      ..._0x295bef,
    ]),
    (_0x335755['objectIds'] = _0x295bef['map']((_0x36b77d) => _0x36b77d['id'])),
    _0x104446
  );
}
export function restoreDirectorLayerVersion(_0x13bf22, _0x36de0e, _0x4fd03b) {
  const _0x4d2ea4 = _0x13bf22['generatedLayers']?.['find']((_0x1c235c) => _0x1c235c['id'] === _0x36de0e),
    _0x519c33 = _0x4d2ea4?.['versions']['find']((_0x52bb68) => _0x52bb68['id'] === _0x4fd03b);
  if (!_0x519c33) throw new Error('生成层历史版本不存在。');
  return applyDirectorGeneratedLayer(_0x13bf22, { objects: _0x519c33['objects'] }, { layerId: _0x36de0e });
}
