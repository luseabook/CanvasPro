import { renderWorkspaceAudioAssetDetail } from '../workspaceAudioAssetDetail.js';
import { renderWorkspaceAssetTabIcon } from '../workspaceAssetPresentation.js';
import { renderStoryGenerationSpinner } from './storyAsyncButtonPresentation.js';
import { getStoryAudioUrl, getStoryAudioBoundCharacters } from './storyAudioAssets.js';
const escape = (_0x339053) =>
  String(_0x339053 ?? '')['replace'](
    /[&<>"']/gu,
    (_0x31bc8e) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\x22': '&quot;', '\x27': '&#39;' })[_0x31bc8e],
  );
export const renderStoryAudioArtwork = () =>
  '<span class="story-audio-artwork">' + renderWorkspaceAssetTabIcon('audio') + '<span>音频</span></span>';
export function renderStoryAudioActions(_0x365c72, _0x3d5602, _0x40d4f8 = ![]) {
  if (_0x365c72['assetFilter'] === 'audio')
    return (
      '<button class="story-secondary-button" type="button" data-story-audio-action="upload" ' +
      (_0x40d4f8 ? 'disabled aria-busy="true"' : '') +
      '>' +
      (_0x40d4f8 ? renderStoryGenerationSpinner({ button: !![] }) + '上传中' : '上传音频') +
      '</button><input type="file" class="story-hidden-input" data-story-audio-files multiple accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac">'
    );
  const _0x37a6f9 = _0x3d5602['filter'](
    (_0x1b0319) =>
      _0x1b0319['mediaKind'] === 'audio' && _0x365c72['selectedAssetIds']['includes'](_0x1b0319['id']),
  );
  return _0x37a6f9['length']
    ? '<button class="story-primary-button" type="button" data-story-audio-action="add">加入到音频项目 (' +
        _0x37a6f9['length'] +
        ')</button>'
    : '';
}
export function renderStoryAudioDetail(_0x5c888f, _0x4b455c) {
  if (!_0x4b455c)
    return '<aside\x20class=\x22story-asset-detail\x20story-empty-panel\x22><strong>暂无音频素材</strong><p>请从总素材加入或上传音频。</p></aside>';
  return renderWorkspaceAudioAssetDetail({
    name: _0x4b455c['name'],
    audioUrl: getStoryAudioUrl(_0x4b455c),
    waveformUrl: _0x4b455c['waveformUrl'],
    characters: _0x5c888f['data']['assets']['filter']((_0x18d1e9) => _0x18d1e9['kind'] === 'character'),
    selectedCharacterId: _0x5c888f['audioTargetCharacterId'] || '',
    boundNames: getStoryAudioBoundCharacters(_0x5c888f['data'], _0x4b455c)['map'](
      (_0x33a492) => _0x33a492['name'],
    ),
    isLibrary: _0x4b455c['isLibraryAsset'],
    detailAttributes: 'data-story-audio-detail=\x22' + escape(_0x4b455c['id']) + '\x22',
    playerAttributes: { 'data-story-audio-player': '' },
    selectAttributes: 'data-story-audio-character',
    bindAttributes: 'data-story-audio-action=\x22bind\x22',
    membershipAttributes:
      'data-story-audio-action="' + (_0x4b455c['isLibraryAsset'] ? 'add' : 'remove') + '\x22',
  });
}
