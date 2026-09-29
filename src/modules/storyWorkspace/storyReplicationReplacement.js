import { markStoryReplicationPromptsStale } from './storyReplicationPromptFreshness.js';
const text = (_0x475761) => String(_0x475761 ?? '')['trim']();
export function getStoryReplicationSubjects(_0x1b7d28) {
  return (_0x1b7d28['episodes'] || [])['flatMap']((_0xa65bc9) =>
    (_0xa65bc9['replication']?.['sourceAnalysis']?.['characters'] || [])['map']((_0x17d671) => ({
      episodeId: _0xa65bc9['id'],
      character: _0x17d671,
      key: _0xa65bc9['id'] + ':' + _0x17d671['id'],
      episodeTitle: _0xa65bc9['title'],
    })),
  );
}
export function captureStoryReplicationAssetSources(_0x770bab) {
  if (_0x770bab['project']?.['sourceMode'] !== 'video-replication') return;
  const _0xd31046 = getStoryReplicationSubjects(_0x770bab),
    _0x4f3ab9 = (_0x770bab['project']['replication']['characterBindings'] ||= {});
  for (const _0x5d3da2 of _0x770bab['assets'] || []) {
    if (!_0x5d3da2['replicationSource'])
      _0x5d3da2['replicationSource'] = {
        name: _0x5d3da2['name'],
        description: _0x5d3da2['description'],
        ref: _0x5d3da2['ref'],
      };
  }
  for (const _0x3a854f of _0xd31046) {
    if (
      _0x770bab['assets']['some'](
        (_0x16d948) => _0x16d948['kind'] === 'character' && _0x16d948['id'] === _0x4f3ab9[_0x3a854f['key']],
      )
    )
      continue;
    const _0x32d9ed = _0x770bab['assets']['filter'](
      (_0x2152fb) =>
        _0x2152fb['kind'] === 'character' &&
        _0x2152fb['replicationSource']?.['subjectKeys']?.['includes'](_0x3a854f['key']),
    );
    if (_0x32d9ed['length'] === 0x1) {
      _0x4f3ab9[_0x3a854f['key']] = _0x32d9ed[0x0]['id'];
      continue;
    }
    const _0x5a4fcb = _0x770bab['assets']['filter'](
      (_0xbf390c) =>
        _0xbf390c['kind'] === 'character' &&
        !_0xbf390c['replicationSource']?.['subjectKeys']?.['length'] &&
        (text(_0xbf390c['replicationSource']?.['name']) === _0x3a854f['character']['name'] ||
          text(_0xbf390c['replicationSource']?.['ref']) === _0x3a854f['character']['id']) &&
        (!_0xbf390c['sourceChapterIds']?.['length'] ||
          _0xbf390c['sourceChapterIds']['includes'](_0x3a854f['episodeId'])),
    );
    if (_0x5a4fcb['length'] === 0x1) _0x4f3ab9[_0x3a854f['key']] = _0x5a4fcb[0x0]['id'];
  }
}
export function getStoryReplicationBindingError(_0x32cfd8) {
  if (_0x32cfd8['project']?.['sourceMode'] !== 'video-replication') return '';
  const _0x2938fc = _0x32cfd8['project']['replication']?.['characterBindings'] || {},
    _0x40758d = getStoryReplicationSubjects(_0x32cfd8)['filter'](
      (_0x2b8b2d) =>
        !_0x32cfd8['assets']['some'](
          (_0x526f73) => _0x526f73['kind'] === 'character' && _0x526f73['id'] === _0x2938fc[_0x2b8b2d['key']],
        ),
    );
  return _0x40758d['length']
    ? '请先为 ' + _0x40758d['length'] + ' 个原片角色选择对应的新角色；保留原形象时也请选择对应素材。'
    : '';
}
export function updateStoryReplicationReplacement(
  _0x1d319b,
  { field: _0x13ff5f, key: _0x2f9b2a, value: _0x2201b1 } = {},
) {
  if (_0x1d319b['project']?.['sourceMode'] !== 'video-replication') return ![];
  const _0x20905b = _0x1d319b['project']['replication'];
  if (_0x13ff5f === 'characterBinding') {
    if (
      !getStoryReplicationSubjects(_0x1d319b)['some']((_0x479ef6) => _0x479ef6['key'] === _0x2f9b2a) ||
      (_0x2201b1 &&
        !_0x1d319b['assets']['some'](
          (_0xe019f8) => _0xe019f8['id'] === _0x2201b1 && _0xe019f8['kind'] === 'character',
        ))
    )
      return ![];
    if (_0x20905b['characterBindings']?.[_0x2f9b2a] === text(_0x2201b1)) return ![];
    (((_0x20905b['characterBindings'] ||= {})[_0x2f9b2a] = text(_0x2201b1)),
      markStoryReplicationPromptsStale(
        _0x1d319b,
        getStoryReplicationSubjects(_0x1d319b)['find']((_0x110f25) => _0x110f25['key'] === _0x2f9b2a)[
          'episodeId'
        ],
      ));
  } else {
    if (
      _0x13ff5f === 'targetLocale' &&
      ['source', 'zh-CN', 'ja-JP', 'ko-KR', 'en-US']['includes'](_0x2201b1)
    ) {
      const _0x10036e = (_0x1d319b['episodes'] || [])['filter'](
          (_0x3a441b) => !_0x3a441b['replication']?.['targetLocale'],
        ),
        _0x5ccc21 = _0x10036e['some']((_0xa5dbea) =>
          (_0xa5dbea['clips'] || [])['some'](
            (_0x217a06) => _0x217a06['promptLanguage'] && _0x217a06['promptLanguage'] !== _0x2201b1,
          ),
        );
      if (_0x20905b['targetLocale'] === _0x2201b1 && !_0x5ccc21) return ![];
      _0x20905b['targetLocale'] = _0x2201b1;
      for (const _0xbfbf9b of _0x10036e) {
        markStoryReplicationPromptsStale(_0x1d319b, _0xbfbf9b['id']);
        for (const _0x34c166 of _0xbfbf9b['clips'] || []) {
          if (_0x34c166['promptLanguage'] === _0x2201b1) delete _0x34c166['requiredDialogueLanguage'];
          else _0x34c166['requiredDialogueLanguage'] = _0x2201b1;
        }
      }
    } else return ![];
  }
  return !![];
}
