import { getStoryReplicationSubjects } from './storyReplicationReplacement.js';
import { getStoryAssetAppearances } from './storyAssetAppearances.js';
import { getSelectedAppearanceIndex } from './storyAssetSettingsProjection.js';
const escape = (_0xec8bb9) =>
  String(_0xec8bb9 ?? '')['replace'](
    /[&<>"']/gu,
    (_0x5837b0) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\x22': '&quot;', '\x27': '&#39;' })[_0x5837b0],
  );
export function renderStoryReplicationAssetComparison(_0x34e5b6, _0x6d7bb5) {
  if (
    _0x34e5b6['data']['project']?.['sourceMode'] !== 'video-replication' ||
    !['character', 'scene', 'prop']['includes'](_0x6d7bb5['kind'])
  )
    return '';
  const _0x555444 = _0x6d7bb5['replicationSource'] || { name: _0x6d7bb5['name'] },
    _0x61904b = getStoryReplicationSubjects(_0x34e5b6['data'])['filter'](
      ({ key: _0x4b2e5a }) =>
        _0x34e5b6['data']['project']['replication']['characterBindings']?.[_0x4b2e5a] === _0x6d7bb5['id'],
    ),
    _0x3d8f01 = _0x61904b['find'](
      ({ character: _0xb35897 }) => _0xb35897['portrait']?.['url'] || _0xb35897['frame']?.['url'],
    )?.['character'],
    _0x3f78c7 =
      _0x6d7bb5['kind'] === 'character'
        ? _0x3d8f01?.['portrait']?.['url']
          ? _0x3d8f01['portrait']
          : _0x3d8f01?.['frame']
        : _0x555444['frame'],
    _0x2c7559 = { character: '新形象', scene: '新场景', prop: '新道具' }[_0x6d7bb5['kind']],
    _0x4ed303 = escape(_0x555444['frameError'] || '原片暂无截图'),
    _0x4bcb0d = getStoryAssetAppearances(_0x6d7bb5)[getSelectedAppearanceIndex(_0x34e5b6, _0x6d7bb5)],
    _0x5f56dd = _0x4bcb0d ? _0x4bcb0d['imageUrl'] : _0x6d7bb5['imageUrl'],
    _0xde8d54 =
      _0x61904b['map'](({ character: _0x4548d1 }) => _0x4548d1['name'])['join']('、') || _0x555444['name'],
    _0x5e9ead = _0x5f56dd || _0x3f78c7?.['url'],
    _0x1276f3 = { character: '原片形象', scene: '原片场景', prop: '原片道具' }[_0x6d7bb5['kind']],
    _0x16d49d = _0x3f78c7?.['url'] ? ' data-tooltip="' + escape(_0x1276f3 + '：' + _0xde8d54) + '\x22' : '';
  return (
    '<span class="story-replacement-comparison story-replacement-gallery">\n    <span class="story-replacement-source"' +
    _0x16d49d +
    '>' +
    (_0x3f78c7?.['url']
      ? '<img src="' +
        escape(_0x3f78c7['url']) +
        '" alt="原片' +
        escape(_0x555444['name']) +
        '" loading="lazy" decoding="async">'
      : '<span class="story-replacement-missing">' + _0x4ed303 + '</span>') +
    '<span\x20class=\x22story-replacement-gallery-empty\x22><span\x20class=\x22story-replacement-upload-plus\x22\x20aria-hidden=\x22true\x22>+</span>待设定<br>' +
    _0x2c7559 +
    '</span></span>\n    <span class="story-replacement-portrait">' +
    (_0x5e9ead
      ? '<img class="' +
        (_0x5f56dd ? 'story-replacement-target-image' : 'story-replacement-reference-image') +
        '\x22\x20src=\x22' +
        escape(_0x5e9ead) +
        '\x22\x20alt=\x22' +
        escape((_0x5f56dd ? _0x2c7559 : '原片参考') + '：' + _0x6d7bb5['name']) +
        '" loading="lazy" decoding="async">'
      : '<span class="story-replacement-missing">' + _0x4ed303 + '</span>') +
    '<small\x20class=\x22story-replacement-portrait-label' +
    (_0x5f56dd ? ' is-new-appearance' : '') +
    '\x22>' +
    (_0x5f56dd ? _0x2c7559 : '原片参考') +
    '</small></span>\n  </span>'
  );
}
