import { mergeStoryPlanningAssets } from './storyPlanningData.js';
import { getStoryReplicationSubjects } from './storyReplicationReplacement.js';
import { reconcileStoryReplicationAssetIdentity } from './storyReplicationAssetIdentity.js';
export function mergeStoryReplicationAssets(_0x40403d, _0x24ae2c = [], _0x1c8426 = {}) {
  const _0x5ca1cc = _0x1c8426['preserveMedia'] !== ![],
    _0x3a6a01 = getStoryReplicationSubjects(_0x40403d),
    _0x3bddb5 = _0x5ca1cc ? reconcileStoryReplicationAssetIdentity(_0x40403d, _0x3a6a01) : [],
    _0x93f146 = _0x3bddb5['filter']((_0xfdf5b3) => _0xfdf5b3['kind'] === 'character'),
    _0x4427d4 = _0x40403d['project']['replication']?.['characterBindings'] || {},
    _0x468de9 = new Map();
  for (const { key: _0x45e72e, episodeId: _0x514dca, character: _0x4d6375 } of _0x3a6a01) {
    const _0x404dfe =
        _0x93f146['find']((_0x20f7b2) => _0x20f7b2['id'] === _0x4427d4[_0x45e72e]) ||
        _0x93f146['find']((_0x52a03f) =>
          _0x52a03f['replicationSource']?.['subjectKeys']?.['includes'](_0x45e72e),
        ),
      _0x5a7710 = _0x404dfe ? 'asset:' + _0x404dfe['id'] : 'source:' + _0x45e72e;
    if (_0x468de9['has'](_0x5a7710)) {
      const _0x2452e0 = _0x468de9['get'](_0x5a7710);
      (_0x2452e0['replicationSource']['subjectKeys']['push'](_0x45e72e),
        (_0x2452e0['sourceChapterIds'] = [...new Set([..._0x2452e0['sourceChapterIds'], _0x514dca])]));
      continue;
    }
    const _0x55c8f6 = 'source:' + _0x45e72e,
      _0x865ca9 = {
        name: _0x4d6375['name'],
        description: _0x4d6375['description'],
        ref: _0x4d6375['id'],
        subjectKeys: [_0x45e72e],
      },
      _0x22950e = _0x404dfe
        ? { ..._0x404dfe, replicationSource: { ..._0x404dfe['replicationSource'], subjectKeys: [_0x45e72e] } }
        : {
            kind: 'character',
            ref: _0x55c8f6,
            name: _0x4d6375['name'],
            description: _0x4d6375['description'],
            role:
              { main: '主角', supporting: '配角', background: '路人', uncertain: '待确认' }[
                _0x4d6375['role']
              ] || '待确认',
            sourceChapterIds: [_0x514dca],
            occurrences: _0x514dca,
            prompt: _0x4d6375['visualPrompt'] || '',
            replicationSource: _0x865ca9,
          };
    ((_0x22950e['replicationSource'] = { ..._0x865ca9, ..._0x22950e['replicationSource'] }),
      (_0x22950e['sourceChapterIds'] = [...new Set([...(_0x22950e['sourceChapterIds'] || []), _0x514dca])]));
    const [_0x5c00cf] = mergeStoryPlanningAssets(_0x404dfe ? [_0x404dfe] : [], [_0x22950e], _0x1c8426);
    (_0x404dfe &&
      ((_0x5c00cf['appearances'] = _0x404dfe['appearances'] || _0x5c00cf['appearances']),
      (_0x5c00cf['prompt'] = _0x404dfe['prompt'] || _0x5c00cf['prompt'])),
      _0x468de9['set'](_0x5a7710, _0x5c00cf));
  }
  const _0x15d220 = [..._0x468de9['values']()],
    _0x3962ea = new Set(_0x15d220['map']((_0x551b36) => _0x551b36['id']));
  return [
    ..._0x15d220,
    ..._0x93f146['filter']((_0x595ed7) => !_0x3962ea['has'](_0x595ed7['id'])),
    ...mergeStoryPlanningAssets(
      _0x3bddb5['filter']((_0x29db5e) => _0x29db5e['kind'] !== 'character'),
      _0x24ae2c['filter']((_0x8c9143) => _0x8c9143['kind'] !== 'character'),
      _0x1c8426,
    ),
  ];
}
