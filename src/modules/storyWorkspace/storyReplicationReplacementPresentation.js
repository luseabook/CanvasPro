import { getStoryReplicationSubjects } from './storyReplicationReplacement.js';
import { getStoryAssetAppearances } from './storyAssetAppearances.js';
import { getSelectedAppearanceIndex } from './storyAssetSettingsProjection.js';
const escape = (value) =>
  String(value ?? '')['replace'](
    /[&<>"']/gu,
    (item) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' })[item],
  );
export function renderStoryReplicationAssetComparison(key, name2) {
  if (
    key['data']['project']?.['sourceMode'] !== 'video-replication' ||
    !['character', 'scene', 'prop']['includes'](name2['kind'])
  )
    return '';
  const error = name2['replicationSource'] || { name: name2['name'] },
    list = getStoryReplicationSubjects(key['data'])['filter'](
      ({ key: key2 }) => key['data']['project']['replication']['characterBindings']?.[key2] === name2['id'],
    ),
    index = list['find'](
      ({ character: character }) => character['portrait']?.['url'] || character['frame']?.['url'],
    )?.['character'],
    response =
      name2['kind'] === 'character'
        ? index?.['portrait']?.['url']
          ? index['portrait']
          : index?.['frame']
        : error['frame'],
    result = { character: '新形象', scene: '新场景', prop: '新道具' }[name2['kind']],
    escape2 = escape(error['frameError'] || '原片暂无截图'),
    storyAssetAppearances = getStoryAssetAppearances(name2)[getSelectedAppearanceIndex(key, name2)],
    data = storyAssetAppearances ? storyAssetAppearances['imageUrl'] : name2['imageUrl'],
    options = list['map'](({ character: character2 }) => character2['name'])['join']('、') || error['name'],
    target = data || response?.['url'],
    source = { character: '原片形象', scene: '原片场景', prop: '原片道具' }[name2['kind']],
    next = response?.['url'] ? ' data-tooltip="' + escape(source + '：' + options) + '"' : '';
  return (
    '<span class="story-replacement-comparison story-replacement-gallery">\n    <span class="story-replacement-source"' +
    next +
    '>' +
    (response?.['url']
      ? '<img src="' +
        escape(response['url']) +
        '" alt="原片' +
        escape(error['name']) +
        '" loading="lazy" decoding="async">'
      : '<span class="story-replacement-missing">' + escape2 + '</span>') +
    '<span class="story-replacement-gallery-empty"><span class="story-replacement-upload-plus" aria-hidden="true">+</span>待设定<br>' +
    result +
    '</span></span>\n    <span class="story-replacement-portrait">' +
    (target
      ? '<img class="' +
        (data ? 'story-replacement-target-image' : 'story-replacement-reference-image') +
        '" src="' +
        escape(target) +
        '" alt="' +
        escape((data ? result : '原片参考') + '：' + name2['name']) +
        '" loading="lazy" decoding="async">'
      : '<span class="story-replacement-missing">' + escape2 + '</span>') +
    '<small class="story-replacement-portrait-label' +
    (data ? ' is-new-appearance' : '') +
    '">' +
    (data ? result : '原片参考') +
    '</small></span>\n  </span>'
  );
}
