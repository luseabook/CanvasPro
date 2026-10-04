import { renderAudioPlaybackSurface } from '../components/audio-node/audioPlaybackSurface.js';
import { getWorkspaceAssetAppearances } from './workspaceAssetAppearance.js';
const escape = (value) =>
  String(value ?? '')['replace'](
    /[&<>"']/gu,
    (item) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\x22': '&quot;', '\x27': '&#39;' })[item],
  );
export function renderWorkspaceAudioAssetDetail({
  name: name,
  audioUrl: audioUrl,
  waveformUrl: waveformUrl,
  characters: characters = [],
  selectedCharacterId: selectedCharacterId = '',
  boundNames: boundNames = [],
  isLibrary: isLibrary = ![],
  className: className = '',
  detailAttributes: detailAttributes = '',
  playerClassName: playerClassName = '',
  playerAttributes: playerAttributes = {},
  selectAttributes: selectAttributes = '',
  bindAttributes: bindAttributes = '',
  membershipAttributes: membershipAttributes = '',
}) {
  const key = Boolean(audioUrl && characters['some']((index) => index['id'] === selectedCharacterId));
  return (
    '<aside class="story-asset-detail story-audio-detail ' +
    escape(className) +
    '\x22\x20' +
    detailAttributes +
    '>\x0a\x20\x20\x20\x20<div\x20class=\x22story-asset-preview-wrap\x20workspace-audio-preview\x22>\x0a\x20\x20\x20\x20\x20\x20' +
    renderAudioPlaybackSurface({
      audioUrl: audioUrl,
      waveformUrl: waveformUrl,
      className: 'story-audio-player ' + playerClassName,
      dataAttributes: playerAttributes,
    }) +
    '\n    </div>\n    <div class="story-asset-detail-copy">\n      <strong>' +
    escape(name) +
    '</strong><p>' +
    (boundNames['length'] ? '已绑定：' + boundNames['map'](escape)['join']('、') : '未绑定人物') +
    '</p>\n      <label>绑定人物<select ' +
    selectAttributes +
    ' aria-label="绑定人物"><option value="">请选择人物</option>' +
    characters['map'](
      (error) =>
        '<option value="' +
        escape(error['id']) +
        '" data-thumbnail-url="' +
        escape(
          getWorkspaceAssetAppearances(error)['find']((result) => result['imageUrl'])?.['imageUrl'] || '',
        ) +
        '\x22\x20' +
        (error['id'] === selectedCharacterId ? 'selected' : '') +
        '>' +
        escape(error['name']) +
        '</option>',
    )['join']('') +
    '</select></label>\n      <button type="button" class="story-secondary-button" ' +
    bindAttributes +
    '\x20' +
    (key ? '' : 'disabled') +
    '>设为角色声音参考</button>\n      <button type="button" class="' +
    (isLibrary ? 'story-primary-button' : 'story-secondary-button') +
    '\x22\x20' +
    membershipAttributes +
    '>' +
    (isLibrary ? '加入到音频项目' : '移除项目') +
    '</button>\x0a\x20\x20\x20\x20</div>\x0a\x20\x20</aside>'
  );
}
