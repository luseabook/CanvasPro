import { renderWorkspaceAudioAssetDetail } from '../workspaceAudioAssetDetail.js';
import { renderWorkspaceAssetTabIcon } from '../workspaceAssetPresentation.js';
import { renderStoryGenerationSpinner } from './storyAsyncButtonPresentation.js';
import { getStoryAudioUrl, getStoryAudioBoundCharacters } from './storyAudioAssets.js';
const escape = (value) =>
  String(value ?? '')['replace'](
    /[&<>"']/gu,
    (item) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' })[item],
  );
export const renderStoryAudioArtwork = () =>
  '<span class="story-audio-artwork">' + renderWorkspaceAssetTabIcon('audio') + '<span>音频</span></span>';
export function renderStoryAudioActions(key, list, index = false) {
  if (key['assetFilter'] === 'audio')
    return (
      '<button class="story-secondary-button" type="button" data-story-audio-action="upload" ' +
      (index ? 'disabled aria-busy="true"' : '') +
      '>' +
      (index ? renderStoryGenerationSpinner({ button: true }) + '上传中' : '上传音频') +
      '</button><input type="file" class="story-hidden-input" data-story-audio-files multiple accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac">'
    );
  const list2 = list['filter'](
    (result) => result['mediaKind'] === 'audio' && key['selectedAssetIds']['includes'](result['id']),
  );
  return list2['length']
    ? '<button class="story-primary-button" type="button" data-story-audio-action="add">加入到音频项目 (' +
        list2['length'] +
        ')</button>'
    : '';
}
export function renderStoryAudioDetail(characters, name) {
  if (!name)
    return '<aside class="story-asset-detail story-empty-panel"><strong>暂无音频素材</strong><p>请从总素材加入或上传音频。</p></aside>';
  return renderWorkspaceAudioAssetDetail({
    name: name['name'],
    audioUrl: getStoryAudioUrl(name),
    waveformUrl: name['waveformUrl'],
    characters: characters['data']['assets']['filter']((data) => data['kind'] === 'character'),
    selectedCharacterId: characters['audioTargetCharacterId'] || '',
    boundNames: getStoryAudioBoundCharacters(characters['data'], name)['map']((error) => error['name']),
    isLibrary: name['isLibraryAsset'],
    detailAttributes: 'data-story-audio-detail="' + escape(name['id']) + '"',
    playerAttributes: { 'data-story-audio-player': '' },
    selectAttributes: 'data-story-audio-character',
    bindAttributes: 'data-story-audio-action="bind"',
    membershipAttributes: 'data-story-audio-action="' + (name['isLibraryAsset'] ? 'add' : 'remove') + '"',
  });
}
