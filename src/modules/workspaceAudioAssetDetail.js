import { renderAudioPlaybackSurface } from '../components/audio-node/audioPlaybackSurface.js';
import { getWorkspaceAssetAppearances } from './workspaceAssetAppearance.js';
const escape = (value) =>
  String(value ?? '')['replace'](
    /[&<>"']/gu,
    (item) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' })[item],
  );
export function renderWorkspaceAudioAssetDetail({
  name: name,
  audioUrl: audioUrl,
  waveformUrl: waveformUrl,
  characters: characters = [],
  selectedCharacterId: selectedCharacterId = '',
  boundNames: boundNames = [],
  isLibrary: isLibrary = false,
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
    '" ' +
    detailAttributes +
    '>\n    <div class="story-asset-preview-wrap workspace-audio-preview">\n      ' +
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
        '" ' +
        (error['id'] === selectedCharacterId ? 'selected' : '') +
        '>' +
        escape(error['name']) +
        '</option>',
    )['join']('') +
    '</select></label>\n      <button type="button" class="story-secondary-button" ' +
    bindAttributes +
    ' ' +
    (key ? '' : 'disabled') +
    '>设为角色声音参考</button>\n      <button type="button" class="' +
    (isLibrary ? 'story-primary-button' : 'story-secondary-button') +
    '" ' +
    membershipAttributes +
    '>' +
    (isLibrary ? '加入到音频项目' : '移除项目') +
    '</button>\n    </div>\n  </aside>'
  );
}
