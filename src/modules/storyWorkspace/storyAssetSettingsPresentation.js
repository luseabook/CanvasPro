import { renderRequestDebugButton } from '../debugRequestWindow.js';
import { renderAudioPlaybackSurface } from '../../components/audio-node/audioPlaybackSurface.js';
import {
  renderWorkspaceCardDeleteControl,
  renderWorkspaceCardAppearanceNavigation,
  renderWorkspaceCardImageActions,
  renderWorkspaceCardVoiceStatus,
} from '../workspaceAssetPresentation.js';
import { renderStoryGenerationSpinner } from './storyAsyncButtonPresentation.js';
import { renderWorkspaceActionIcon } from '../workspaceActionIcons.js';
function escapeHtml(_0x7e0000) {
  return String(_0x7e0000 ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
}
function normalizeText(_0x2b13b2) {
  return String(_0x2b13b2 ?? '')['trim']();
}
function emptyRenderer() {
  return '';
}
export function createStoryAssetSettingsPresentation({
  renderAddToLibraryIcon: renderAddToLibraryIcon = emptyRenderer,
  renderDeleteIcon: renderDeleteIcon = emptyRenderer,
  renderDownloadButton: renderDownloadButton = emptyRenderer,
  renderHomeParamChevron: renderHomeParamChevron = emptyRenderer,
  renderImage: renderImage = emptyRenderer,
  renderImageModelSelector: renderImageModelSelector = emptyRenderer,
  renderLoadingOverlay: renderLoadingOverlay = emptyRenderer,
  renderPromptMentions: renderPromptMentions = (_0x5f094b) => escapeHtml(_0x5f094b),
  renderSelectionActions: renderSelectionActions = ({ primaryActionHtml: primaryActionHtml = '' } = {}) =>
    primaryActionHtml,
  renderTabIcon: renderTabIcon = emptyRenderer,
  renderUploadIcon: renderUploadIcon = emptyRenderer,
  renderVoiceFooter: renderVoiceFooter = emptyRenderer,
} = {}) {
  function _0x2ea5c3(_0x1a741a = {}, { canRename: canRename = ![] } = {}) {
    const _0x37dc98 = normalizeText(_0x1a741a['name']) || '未命名素材',
      _0x46b1a9 = canRename
        ? ' data-story-asset-name-id="' +
          escapeHtml(_0x1a741a['id']) +
          '" aria-label="重命名' +
          escapeHtml(_0x37dc98) +
          '\x22'
        : '';
    return '<strong' + _0x46b1a9 + '>' + escapeHtml(_0x37dc98) + '</strong>';
  }
  function _0x556b9c(_0x56eaf2 = {}) {
    const _0x1265da =
        '<button type="button" class="story-asset-card ' +
        (_0x56eaf2['isCurrent'] && !_0x56eaf2['isSelectionMode'] ? 'is-selected' : '') +
        '\x20' +
        (_0x56eaf2['isSelectionMode'] ? 'is-selection-mode' : '') +
        '\x20' +
        (_0x56eaf2['isChecked'] ? 'is-checked' : '') +
        (_0x56eaf2['cardClassName'] ? '\x20' + escapeHtml(_0x56eaf2['cardClassName']) : '') +
        '\x22\x20data-story-asset-id=\x22' +
        escapeHtml(_0x56eaf2['id']) +
        '" data-story-marquee-item data-story-marquee-id="' +
        escapeHtml(_0x56eaf2['id']) +
        '\x22\x20data-story-appearance-count=\x22' +
        Math['max'](0x0, Number(_0x56eaf2['appearanceCount']) || 0x0) +
        '" aria-pressed="' +
        (_0x56eaf2['isSelectionMode'] ? String(Boolean(_0x56eaf2['isChecked'])) : 'false') +
        '\x22' +
        (_0x56eaf2['draggable'] ? '\x20draggable=\x22true\x22' : '') +
        (_0x56eaf2['cardAttributes'] ? '\x20' + _0x56eaf2['cardAttributes'] : '') +
        '>\n    <span class="story-asset-card-media ' +
        (_0x56eaf2['isLoading'] ? 'img-preview-loading' : '') +
        '\x22\x20' +
        (_0x56eaf2['canNavigateAppearances']
          ? 'data-story-card-appearance-wheel=\x22' + escapeHtml(_0x56eaf2['id']) + '\x22'
          : '') +
        ' aria-busy="' +
        Boolean(_0x56eaf2['isLoading']) +
        '\x22>\x0a\x20\x20\x20\x20\x20\x20' +
        (_0x56eaf2['cardMediaHtml'] ||
          renderImage({
            imageUrl: _0x56eaf2['preview']?.['imageUrl'],
            fallbackImageUrl: _0x56eaf2['fallbackImageUrl'],
            workspaceAssetLibraryImage: _0x56eaf2['workspaceAssetLibraryImage'],
            alt:
              '' +
              _0x56eaf2['name'] +
              (_0x56eaf2['preview']?.['name'] ? '\x20·\x20' + _0x56eaf2['preview']['name'] : ''),
            className: 'story-asset-card-image',
          })) +
        '\n      ' +
        (_0x56eaf2['isLoading'] ? renderLoadingOverlay({ compact: !![] }) : '') +
        '\n      ' +
        (!_0x56eaf2['isLoading'] &&
        !normalizeText(_0x56eaf2['preview']?.['imageUrl']) &&
        normalizeText(_0x56eaf2['preview']?.['error'])
          ? '<span class="story-asset-card-failure" role="status">生成失败</span>'
          : '') +
        '\n    </span>\n    <span class="story-asset-card-copy"' +
        (_0x56eaf2['canNavigateAppearances']
          ? ' data-story-card-appearance-wheel="' + escapeHtml(_0x56eaf2['id']) + '\x22'
          : '') +
        '>\x0a\x20\x20\x20\x20\x20\x20<span\x20class=\x22story-asset-card-heading\x22>' +
        _0x2ea5c3(_0x56eaf2, { canRename: _0x56eaf2['canRename'] }) +
        (_0x56eaf2['showRoleTag'] ? '<small>' + escapeHtml(_0x56eaf2['role'] || '素材') + '</small>' : '') +
        (_0x56eaf2['showCardVoiceStatus']
          ? renderWorkspaceCardVoiceStatus(_0x56eaf2['hasCardVoiceReference'])
          : '') +
        '</span>\n      <span class="story-asset-card-status">' +
        (_0x56eaf2['cardStatusHtml'] ||
          (_0x56eaf2['statusText']
            ? '<span>' + escapeHtml(_0x56eaf2['statusText']) + '</span>'
            : _0x56eaf2['stats']?.['total'] > 0x1
              ? '<span>形象 ' +
                _0x56eaf2['stats']['generated'] +
                '/' +
                _0x56eaf2['stats']['total'] +
                '</span>'
              : '')) +
        '</span>\x0a\x20\x20\x20\x20\x20\x20' +
        (_0x56eaf2['cardMetaHtml'] || '') +
        '\n      <p>' +
        escapeHtml(_0x56eaf2['promptPreview'] || '') +
        '</p>\n    </span>\n  </button>',
      _0x3b93c9 = _0x56eaf2['showAppearanceDelete']
        ? renderWorkspaceCardDeleteControl({
            className: 'story-asset-card-delete-trigger',
            ariaLabel: '删除当前形象',
            actionAttributes: {
              'data-story-action': 'request-delete-asset-appearance',
              'data-story-card-appearance-id': _0x56eaf2['id'],
            },
            disabled: _0x56eaf2['isLoading'] || !_0x56eaf2['canDeleteAppearance'],
          })
        : _0x56eaf2['canDelete']
          ? renderWorkspaceCardDeleteControl({
              className: 'story-asset-card-delete-trigger',
              ariaLabel:
                '删除' +
                (normalizeText(_0x56eaf2['kind'])['toLowerCase']() === 'scene' ? '场景' : '人物') +
                '\x20' +
                _0x56eaf2['name'],
              actionAttributes: {
                'data-story-action': 'delete-asset-card',
                'data-story-asset-delete-id': _0x56eaf2['id'],
              },
              disabled: _0x56eaf2['isLoading'],
            })
          : '',
      _0x5ca9b0 = _0x56eaf2['canNavigateAppearances']
        ? renderWorkspaceCardAppearanceNavigation({
            attributes: { 'data-story-card-appearance-wheel': _0x56eaf2['id'] },
            previousAttributes: {
              'data-story-action': 'previous-appearance',
              'data-story-card-appearance-id': _0x56eaf2['id'],
            },
            nextAttributes: {
              'data-story-action': 'next-appearance',
              'data-story-card-appearance-id': _0x56eaf2['id'],
            },
          })
        : '',
      _0x480196 = _0x56eaf2['showCardUpload']
        ? '<span\x20class=\x22story-replication-character-actions\x22><button\x20type=\x22button\x22\x20class=\x22story-replication-card-upload\x20story-secondary-button\x22\x20data-story-action=\x22upload-asset\x22\x20data-story-card-appearance-id=\x22' +
          escapeHtml(_0x56eaf2['id']) +
          '" aria-label="上传' +
          escapeHtml(_0x56eaf2['name']) +
          '的新形象\x22' +
          (_0x56eaf2['isLoading'] ? '\x20disabled' : '') +
          '>' +
          renderUploadIcon() +
          '<span>上传形象</span></button><button\x20type=\x22button\x22\x20class=\x22story-replication-card-generate\x20story-secondary-button\x22\x20data-story-action=\x22generate-asset\x22\x20data-story-card-appearance-id=\x22' +
          escapeHtml(_0x56eaf2['id']) +
          '\x22' +
          (_0x56eaf2['isLoading'] ? ' disabled' : '') +
          '>' +
          renderWorkspaceActionIcon('generate') +
          '<span>生成形象</span></button></span><button type="button" class="story-replication-empty-upload" data-story-action="upload-asset" data-story-card-appearance-id="' +
          escapeHtml(_0x56eaf2['id']) +
          '\x22\x20aria-label=\x22上传' +
          escapeHtml(_0x56eaf2['name']) +
          '的新形象（待设定）"' +
          (_0x56eaf2['isLoading'] ? ' disabled' : '') +
          '></button>'
        : '';
    if (
      !_0x3b93c9 &&
      !_0x56eaf2['accessoryHtml'] &&
      !_0x5ca9b0 &&
      !_0x480196 &&
      !_0x56eaf2['cardClassName']?.['includes']('workspace-portrait-card')
    )
      return _0x1265da;
    return (
      '<span\x20class=\x22story-asset-card-shell' +
      (_0x56eaf2['cardClassName']?.['includes']('workspace-portrait-card') &&
      !_0x56eaf2['cardClassName']['includes']('story-replication-character-card') &&
      _0x56eaf2['kind'] === 'character'
        ? ' workspace-card-with-image-actions'
        : '') +
      (_0x56eaf2['shellClassName'] ? '\x20' + escapeHtml(_0x56eaf2['shellClassName']) : '') +
      '">\n    ' +
      _0x1265da +
      '\n    ' +
      _0x5ca9b0 +
      _0x3b93c9 +
      _0x480196 +
      (_0x56eaf2['showCardImageActions']
        ? renderWorkspaceCardImageActions({
            uploadAttributes: {
              'data-story-action': 'upload-asset',
              'data-story-card-appearance-id': _0x56eaf2['id'],
            },
            generateAttributes: {
              'data-story-action': 'generate-asset',
              'data-story-card-appearance-id': _0x56eaf2['id'],
            },
            disabled: _0x56eaf2['isLoading'],
          })
        : '') +
      (_0x56eaf2['accessoryHtml'] || '') +
      '\n  </span>'
    );
  }
  function _0x28a17b(_0x1dee36, _0x34bbae = '') {
    const _0x14be11 = _0x34bbae ? ' data-story-card-appearance-id="' + escapeHtml(_0x34bbae) + '\x22' : '';
    if (_0x1dee36 === 'previous')
      return (
        '<button type="button" class="story-appearance-arrow story-appearance-arrow--previous" data-story-action="previous-appearance"' +
        _0x14be11 +
        '\x20aria-label=\x22上一个形象\x22><svg\x20class=\x22story-appearance-arrow-icon\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20aria-hidden=\x22true\x22><path\x20d=\x22m14.5\x206.5-5.5\x205.5\x205.5\x205.5\x22/></svg></button>'
      );
    return (
      '<button type="button" class="story-appearance-arrow story-appearance-arrow--next" data-story-action="next-appearance"' +
      _0x14be11 +
      ' aria-label="下一个形象"><svg class="story-appearance-arrow-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9.5 6.5 5.5 5.5-5.5 5.5"/></svg></button>'
    );
  }
  function _0x411f5c() {
    return '<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20aria-hidden=\x22true\x22><rect\x20x=\x224\x22\x20y=\x225\x22\x20width=\x2216\x22\x20height=\x2214\x22\x20rx=\x222.5\x22/><circle\x20cx=\x229\x22\x20cy=\x2210\x22\x20r=\x221.5\x22/><path\x20d=\x22m6.5\x2016\x203.5-3.5\x202.6\x202.6\x201.8-1.8\x203.1\x202.7\x22/></svg>';
  }
  function _0x1b30a3(_0x413622 = {}) {
    const _0x5503d1 = normalizeText(_0x413622['referenceImageUrl']);
    return (
      '<span class="story-asset-style-reference-control ' +
      (_0x5503d1 ? 'has-reference' : '') +
      '">\n    <button type="button" class="story-character-voice-capsule story-asset-style-reference-capsule ' +
      (_0x5503d1 ? 'has-reference' : '') +
      '" data-story-action="upload-asset-reference" aria-label="' +
      (_0x5503d1 ? '替换风格参考' : '上传风格参考') +
      '\x22\x20' +
      (_0x413622['disabled'] ? 'disabled' : '') +
      '>\n      <span class="story-character-voice-icon">' +
      (_0x5503d1 ? '<img src="' + escapeHtml(_0x5503d1) + '\x22\x20alt=\x22\x22>' : _0x411f5c()) +
      '</span>\x0a\x20\x20\x20\x20\x20\x20<span>风格参考</span>\x0a\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20' +
      (_0x5503d1
        ? '<span class="story-asset-style-reference-preview" aria-hidden="true"><img src="' +
          escapeHtml(_0x5503d1) +
          '" alt=""></span>'
        : '') +
      '\n    ' +
      (_0x5503d1
        ? '<button\x20type=\x22button\x22\x20class=\x22story-asset-style-reference-remove\x22\x20data-story-action=\x22remove-asset-reference\x22\x20aria-label=\x22删除风格参考\x22\x20' +
          (_0x413622['disabled'] ? 'disabled' : '') +
          '>&times;</button>'
        : '') +
      '\n  </span>'
    );
  }
  function _0x2456d8(_0x11d335 = {}) {
    if (!_0x11d335['visible']) return '';
    return (
      '<div\x20class=\x22story-home-param-picker\x20story-asset-preset-picker\x22>\x0a\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-home-param-trigger\x20story-menu-trigger\x20story-asset-preset-trigger\x22\x20data-story-home-param-trigger=\x22asset-preset\x22\x20aria-haspopup=\x22listbox\x22\x20aria-expanded=\x22false\x22\x20' +
      (_0x11d335['disabled'] ? 'disabled' : '') +
      '>\x0a\x20\x20\x20\x20\x20\x20<span>预设：' +
      escapeHtml(_0x11d335['selectedLabel']) +
      '</span>\x0a\x20\x20\x20\x20\x20\x20' +
      renderHomeParamChevron() +
      '\x0a\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20<div\x20class=\x22story-home-param-popover\x20story-asset-preset-popover\x22\x20role=\x22listbox\x22\x20aria-label=\x22' +
      escapeHtml(_0x11d335['label']) +
      '">\n      <strong>' +
      escapeHtml(_0x11d335['label']) +
      '</strong>\n      <div class="story-asset-preset-options">\n        ' +
      (Array['isArray'](_0x11d335['options']) ? _0x11d335['options'] : [])
        ['map'](
          (_0x52a7bd) =>
            '<button type="button" class="story-asset-preset-option floating-menu-item has-subtitle ' +
            (_0x52a7bd['id'] === _0x11d335['selectedId'] ? 'active\x20is-selected' : '') +
            '\x22\x20data-story-asset-preset-option=\x22' +
            escapeHtml(_0x52a7bd['id']) +
            '" data-story-asset-preset-kind="' +
            escapeHtml(_0x11d335['assetKind']) +
            '\x22\x20role=\x22option\x22\x20aria-selected=\x22' +
            (_0x52a7bd['id'] === _0x11d335['selectedId']) +
            '"><span class="fmi-content"><span class="fmi-title">' +
            escapeHtml(_0x52a7bd['label']) +
            '</span><small class="fmi-sub">' +
            escapeHtml(_0x52a7bd['description']) +
            '</small></span></button>',
        )
        ['join']('') +
      '\n      </div>\n    </div>\n  </div>'
    );
  }
  function _0x475ad3(_0x34a484 = ![]) {
    if (_0x34a484)
      return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 6.5v11l9-5.5-9-5.5Z"/></svg>';
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4v16M8.5 7.5v9M15.5 8.5v7M5 10v4M19 10v4"/></svg>';
  }
  function _0xa86cd3() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7V3m0 4h4"/><path d="M5.4 6.2A8 8 0 1 1 4 12"/><path d="M12 8v4l2.8 1.8"/></svg>';
  }
  function _0x4a972f(_0x1e1b28 = {}) {
    if (!_0x1e1b28['visible']) return '';
    if (_0x1e1b28['useSourceMenu'] && !_0x1e1b28['isOpen'])
      return (
        '<span class="story-voice-source-menu-wrap">\n        <button type="button" class="story-character-voice-capsule ' +
        (_0x1e1b28['hasReference'] ? 'has-reference' : 'is-missing') +
        '" data-story-character-voice-capsule data-story-audio-action="toggle-voice-menu" aria-haspopup="menu" aria-expanded="false">\n          <span class="story-character-voice-icon">' +
        _0x475ad3(![]) +
        '</span><span>声音参考</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22story-voice-source-menu\x22\x20role=\x22menu\x22\x20aria-label=\x22添加人物声音\x22\x20hidden>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20role=\x22menuitem\x22\x20data-story-action=\x22upload-character-voice\x22>上传声音</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20role=\x22menuitem\x22\x20data-story-audio-action=\x22choose-project-voice\x22>从项目音频添加</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20role=\x22menuitem\x22\x20data-story-action=\x22open-character-voice\x22>生成与管理声音</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
        (_0x1e1b28['hasReference']
          ? '<button type="button" role="menuitem" data-story-action="remove-character-voice">删除音频参考</button>'
          : '') +
        '\n        </span>\n      </span>'
      );
    if (_0x1e1b28['uploadLabel'])
      return (
        '<button\x20type=\x22button\x22\x20class=\x22story-character-voice-capsule\x20' +
        (_0x1e1b28['hasReference'] ? 'has-reference' : 'is-missing') +
        '" data-story-character-voice-capsule data-story-action="upload-character-voice" aria-label="' +
        escapeHtml(_0x1e1b28['uploadLabel']) +
        '">\n      <span class="story-character-voice-icon">' +
        _0x475ad3(![]) +
        '</span>\n      <span>' +
        escapeHtml(_0x1e1b28['uploadLabel']) +
        '</span>\x0a\x20\x20\x20\x20</button>'
      );
    const _0x1c5594 = _0x1e1b28['isOpen'] ? 'close-character-voice' : 'open-character-voice',
      _0x5f4509 = _0x1e1b28['isOpen'] ? '图片参考' : '声音参考';
    return (
      '<button type="button" class="story-character-voice-capsule ' +
      (_0x1e1b28['hasReference'] ? 'has-reference' : 'is-missing') +
      '\x20' +
      (_0x1e1b28['isOpen'] ? 'is-active' : '') +
      '" data-story-character-voice-capsule data-story-action="' +
      _0x1c5594 +
      '" aria-label="打开角色' +
      _0x5f4509 +
      '" aria-pressed="' +
      Boolean(_0x1e1b28['isOpen']) +
      '">\n    <span class="story-character-voice-icon">' +
      (_0x1e1b28['isOpen'] ? _0x411f5c() : _0x475ad3(![])) +
      '</span>\n    <span>' +
      _0x5f4509 +
      '</span>\n  </button>'
    );
  }
  function _0x49c7d9(_0x21f06f = {}) {
    if (!_0x21f06f['visible']) return '';
    return (
      '<span class="story-character-voice-name-player" data-story-character-voice-player="' +
      escapeHtml(_0x21f06f['id']) +
      '">\n    <button type="button" class="story-character-voice-name-play" data-story-action="play-character-voice" data-story-voice-asset-id="' +
      escapeHtml(_0x21f06f['id']) +
      '" aria-label="播放 ' +
      escapeHtml(_0x21f06f['name']) +
      ' 的声音参考">\n      <svg class="story-character-voice-name-play-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M7 5.4v9.2l7.2-4.6L7 5.4Z"/></svg>\n      <svg class="story-character-voice-name-pause-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M6.5 5.5h2.3v9H6.5zM11.2 5.5h2.3v9h-2.3z"/></svg>\n    </button>\n    <span class="story-character-voice-waveform" data-story-character-voice-waveform hidden aria-hidden="true">' +
      Array['from']({ length: 0xc }, () => '<i></i>')['join']('') +
      '</span>\n  </span>'
    );
  }
  function _0x1e572d(_0x2ae3f2) {
    if (_0x2ae3f2 === 'image')
      return '<svg\x20viewBox=\x220\x200\x2020\x2020\x22\x20fill=\x22none\x22\x20aria-hidden=\x22true\x22><rect\x20x=\x222.5\x22\x20y=\x223\x22\x20width=\x2215\x22\x20height=\x2214\x22\x20rx=\x222.2\x22/><circle\x20cx=\x227\x22\x20cy=\x227.5\x22\x20r=\x221.3\x22/><path\x20d=\x22m4.5\x2014\x203.4-3.4\x202.7\x202.7\x201.8-1.8\x203.1\x202.5\x22/></svg>';
    if (_0x2ae3f2 === 'voice')
      return '<svg\x20viewBox=\x220\x200\x2020\x2020\x22\x20fill=\x22none\x22\x20aria-hidden=\x22true\x22><path\x20d=\x22M3\x2010h1.5m2-3.5v7m3-10v13m3-9v5m3-7v9M18\x2010h-1.5\x22/></svg>';
    return '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="2.5" y="3" width="6" height="6" rx="1.2"/><rect x="11.5" y="3" width="6" height="6" rx="1.2"/><rect x="2.5" y="12" width="6" height="5" rx="1.2"/><rect x="11.5" y="12" width="6" height="5" rx="1.2"/></svg>';
  }
  function _0x44f298(_0x35b9ef = {}) {
    const _0x4069a2 = normalizeText(_0x35b9ef['directMode']),
      _0x37d5e7 = normalizeText(_0x35b9ef['action']) || 'batch-generate-assets',
      _0x2d7fcd = _0x35b9ef['isCancellation']
        ? 'aria-label="取消尚未开始的素材生成任务"'
        : _0x4069a2
          ? 'data-story-asset-batch-direct-mode=\x22' + escapeHtml(_0x4069a2) + '\x22'
          : 'aria-haspopup="menu" aria-expanded="false"',
      _0x4ced60 =
        '<button type="button" class="story-primary-button story-asset-batch-trigger" data-story-action="' +
        escapeHtml(_0x37d5e7) +
        '" data-story-asset-batch-control ' +
        _0x2d7fcd +
        '\x20' +
        (_0x35b9ef['disabled'] ? 'disabled' : '') +
        '\x20aria-busy=\x22' +
        Boolean(_0x35b9ef['busy']) +
        '\x22>' +
        (_0x35b9ef['busy'] ? renderStoryGenerationSpinner({ button: !![] }) : '') +
        '<span class="story-asset-batch-trigger-label">' +
        escapeHtml(_0x35b9ef['label']) +
        '</span></button>';
    if (_0x35b9ef['isCancellation']) return _0x4ced60;
    if (_0x4069a2) return _0x4ced60;
    return (
      '<div\x20class=\x22story-asset-batch-menu-wrap\x22>\x0a\x20\x20\x20\x20' +
      _0x4ced60 +
      '\x0a\x20\x20\x20\x20<div\x20class=\x22story-asset-batch-menu\x22\x20role=\x22menu\x22\x20aria-label=\x22选择批量生成内容\x22>\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20role=\x22menuitem\x22\x20data-story-asset-batch-mode=\x22image\x22><span\x20class=\x22story-asset-batch-mode-icon\x22>' +
      _0x1e572d('image') +
      '</span><span>仅图片</span></button>\n      <button type="button" role="menuitem" data-story-asset-batch-mode="voice"><span class="story-asset-batch-mode-icon">' +
      _0x1e572d('voice') +
      '</span><span>仅音频</span></button>\n      <button type="button" role="menuitem" data-story-asset-batch-mode="all"><span class="story-asset-batch-mode-icon">' +
      _0x1e572d('all') +
      '</span><span>全部</span></button>\n    </div>\n  </div>'
    );
  }
  function _0x5e906c(_0x567880 = {}) {
    if (!_0x567880['isMultiSelection'])
      return (
        renderRequestDebugButton('data-story-action=\x22debug-asset-image\x22') +
        '<button type="button" class="story-asset-generate-button story-main-action-button" data-story-action="generate-asset" ' +
        (_0x567880['disabled'] ? 'disabled' : '') +
        ' aria-busy="' +
        Boolean(_0x567880['busy']) +
        '\x22>' +
        (_0x567880['busy'] ? renderStoryGenerationSpinner({ button: !![] }) : '') +
        '<span\x20data-story-asset-generate-label>' +
        escapeHtml(_0x567880['label'] || '生成素材图') +
        '</span></button>'
      );
    const _0x15c542 = normalizeText(_0x567880['action']) || 'batch-generate-assets';
    return (
      '<button\x20type=\x22button\x22\x20class=\x22story-asset-generate-button\x20story-main-action-button\x20story-asset-batch-trigger\x22\x20data-story-action=\x22' +
      escapeHtml(_0x15c542) +
      '" data-story-asset-batch-control ' +
      (_0x567880['isCancellation']
        ? 'aria-label="取消尚未开始的素材生成任务"'
        : 'data-story-asset-batch-direct-mode="image"') +
      '\x20' +
      (_0x567880['disabled'] ? 'disabled' : '') +
      ' aria-busy="' +
      Boolean(_0x567880['busy']) +
      '\x22>' +
      (_0x567880['busy'] ? renderStoryGenerationSpinner({ button: !![] }) : '') +
      '<span class="story-asset-batch-trigger-label">' +
      escapeHtml(_0x567880['label']) +
      '</span></button>'
    );
  }
  function _0x4bd4e2(_0x57aeb5 = {}) {
    return (
      '<button type="button" class="story-library-target-option" role="option" data-story-library-appearance-target="' +
      escapeHtml(_0x57aeb5['id']) +
      '" data-story-library-target-asset-kind="' +
      escapeHtml(_0x57aeb5['kind']) +
      '\x22\x20aria-haspopup=\x22menu\x22\x20aria-expanded=\x22false\x22>\x0a\x20\x20\x20\x20<span\x20class=\x22story-library-target-thumb\x22>' +
      renderImage({
        imageUrl: _0x57aeb5['preview']?.['imageUrl'],
        alt: _0x57aeb5['name'],
        className: 'story-library-target-image',
      }) +
      '</span>\n    <span class="story-library-target-copy"><strong>' +
      escapeHtml(_0x57aeb5['name']) +
      '</strong><small>' +
      (_0x57aeb5['appearanceCount'] ? _0x57aeb5['appearanceCount'] + ' 个形象' : '暂无形象') +
      '</small></span>\n  </button>'
    );
  }
  function _0x5c3f75(_0x213f5d = {}, _0x667019 = {}, _0x5ab591 = ![]) {
    const _0x42c3c0 = normalizeText(_0x667019['name']) || '未命名形象';
    return (
      '<button type="button" class="story-library-appearance-option" role="menuitem" data-story-library-target-asset-id="' +
      escapeHtml(_0x213f5d['id']) +
      '" data-story-library-target-appearance-id="' +
      escapeHtml(_0x667019['id']) +
      '\x22\x20' +
      (_0x5ab591 ? 'disabled title="替换已有形象时只能选择一张图片"' : '') +
      '>\n      <span class="story-library-appearance-thumb">' +
      renderImage({
        imageUrl: _0x667019['imageUrl'],
        alt: _0x213f5d['name'] + ' · ' + _0x42c3c0,
        className: 'story-library-appearance-image',
      }) +
      '</span>\n      <span class="story-library-appearance-copy"><strong>' +
      escapeHtml(_0x42c3c0) +
      '</strong><small>替换此形象图片</small></span>\n    </button>'
    );
  }
  function _0x3aeb2d(_0xa337f9 = {}, _0x1f477c = 0x0) {
    const _0xbf9d8e = Array['isArray'](_0xa337f9['appearances']) ? _0xa337f9['appearances'] : [],
      _0x385521 = _0x1f477c !== 0x1;
    return (
      '<div\x20class=\x22story-library-appearance-popover\x22\x20data-story-library-appearance-menu=\x22' +
      escapeHtml(_0xa337f9['id']) +
      '" role="menu" aria-label="选择' +
      escapeHtml(_0xa337f9['name']) +
      '的形象" aria-hidden="true">\n      <div class="story-library-target-heading"><strong>' +
      escapeHtml(_0xa337f9['name']) +
      '的形象</strong><small>' +
      (_0x385521 ? '选择一张图片后可替换已有形象' : '选择要替换的形象') +
      '</small></div>\n      <div class="story-library-appearance-list">\n        ' +
      _0xbf9d8e['map']((_0x1aa469) => _0x5c3f75(_0xa337f9, _0x1aa469, _0x385521))['join']('') +
      '\n      </div>\n      <button type="button" class="story-library-appearance-add" role="menuitem" data-story-library-target-asset-id="' +
      escapeHtml(_0xa337f9['id']) +
      '" data-story-library-target-create-appearance="true"><span aria-hidden="true">＋</span><strong>新增形象</strong></button>\n    </div>'
    );
  }
  function _0x3bfc7a(_0x9e7ae7 = {}) {
    const _0x2aa175 = Array['isArray'](_0x9e7ae7['targetGroups']) ? _0x9e7ae7['targetGroups'] : [],
      _0x34b45c = Math['max'](0x0, Math['trunc'](Number(_0x9e7ae7['selectedCount']) || 0x0));
    return (
      '<div\x20class=\x22story-asset-batch-menu-wrap\x20story-library-add-menu-wrap\x22>\x0a\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-primary-button\x20story-asset-batch-trigger\x22\x20data-story-action=\x22add-library-assets-to-project\x22\x20aria-haspopup=\x22menu\x22\x20aria-expanded=\x22false\x22\x20' +
      (_0x34b45c ? '' : 'disabled') +
      '><span\x20class=\x22story-asset-batch-trigger-label\x22>加入到项目' +
      (_0x9e7ae7['showCount'] && _0x34b45c ? '\x20(' + _0x34b45c + ')' : '') +
      '</span></button>\n    <div class="story-asset-batch-menu story-library-add-menu" role="menu" aria-label="选择加入项目的素材分类">\n      ' +
      _0x2aa175['map'](
        (_0x4ca931) =>
          '<button type="button" role="menuitem" data-story-library-target-kind="' +
          escapeHtml(_0x4ca931['kind']) +
          '" aria-haspopup="listbox" aria-expanded="false"><span class="story-asset-batch-mode-icon">' +
          renderTabIcon(_0x4ca931['kind']) +
          '</span><span>' +
          escapeHtml(_0x4ca931['label']) +
          '</span></button>',
      )['join']('') +
      '\x0a\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20' +
      _0x2aa175['map'](
        (_0x22de75) =>
          '<div class="story-library-target-popover" data-story-library-target-menu="' +
          escapeHtml(_0x22de75['kind']) +
          '" role="listbox" aria-label="选择本剧' +
          escapeHtml(_0x22de75['label']) +
          '\x22\x20aria-hidden=\x22true\x22>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-library-target-heading\x22><strong>选择本剧' +
          escapeHtml(_0x22de75['label']) +
          '</strong><small>悬停后选择已有形象或新增</small></div>\n      <div class="story-library-target-list">\n        ' +
          (_0x22de75['targets']?.['length']
            ? _0x22de75['targets']['map'](_0x4bd4e2)['join']('')
            : '<div class="story-library-target-empty">本剧暂无可绑定的' +
              escapeHtml(_0x22de75['label']) +
              '</div>') +
          '\n      </div>\n      ' +
          (_0x22de75['targets']?.['map']((_0x46617c) => _0x3aeb2d(_0x46617c, _0x34b45c))['join']('') || '') +
          '\n    </div>',
      )['join']('') +
      '\n  </div>'
    );
  }
  function _0x486043(_0x1e2d7d = {}) {
    return renderSelectionActions({
      selectionMode: _0x1e2d7d['selectionMode'],
      selectedCount: _0x1e2d7d['selectedCount'],
      allSelected: _0x1e2d7d['allSelected'],
      primaryActionHtml: _0x3bfc7a({ ..._0x1e2d7d, showCount: _0x1e2d7d['selectionMode'] }),
      selectAllLabel: '全选图片',
      clearSelectionLabel: '取消全选',
    });
  }
  function _0x5d2cbe(_0x53c456 = {}) {
    const _0x1c1ac7 = renderDownloadButton({
      action: 'download-asset-image',
      enabled: Boolean(_0x53c456['canDownload']),
    });
    if (!_0x53c456['showProjectActions'])
      return _0x1c1ac7 ? '<div class="story-asset-preview-actions">' + _0x1c1ac7 + '</div>' : '';
    return (
      '<div class="story-asset-preview-actions">\n    ' +
      _0x1c1ac7 +
      '\x0a\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-character-voice-upload-button\x20story-add-to-library-button\x20' +
      (_0x53c456['librarySynced'] ? 'is-synced' : '') +
      '" data-story-action="add-asset-appearance-to-library" aria-label="' +
      escapeHtml(_0x53c456['saveToLibraryLabel']) +
      '\x22\x20title=\x22' +
      escapeHtml(_0x53c456['saveToLibraryLabel']) +
      '\x22\x20' +
      (_0x53c456['canSaveToLibrary'] ? '' : 'disabled') +
      ' aria-busy="' +
      Boolean(_0x53c456['isSavingToLibrary']) +
      '\x22>' +
      (_0x53c456['isSavingToLibrary']
        ? renderStoryGenerationSpinner({ button: !![] })
        : renderAddToLibraryIcon()) +
      '</button>\n    <button type="button" class="story-upload-replace story-character-voice-upload-button" data-story-action="upload-asset" aria-label="上传替换图片" title="上传替换图片" ' +
      (_0x53c456['canUpload'] ? '' : 'disabled') +
      '>' +
      renderUploadIcon() +
      '</button>\n    ' +
      (_0x53c456['showDeleteAppearance']
        ? '<button type="button" class="story-character-voice-remove story-delete-current-appearance-button" data-story-action="request-delete-asset-appearance" aria-label="' +
          escapeHtml(_0x53c456['deleteAppearanceLabel'] || '删除当前形象') +
          '" title="' +
          escapeHtml(_0x53c456['deleteAppearanceLabel'] || '删除当前形象') +
          '\x22\x20' +
          (_0x53c456['canDeleteAppearance'] ? '' : 'disabled') +
          '>' +
          renderDeleteIcon() +
          '</button>'
        : '') +
      '\n    ' +
      (_0x53c456['isDeleteAppearanceConfirming']
        ? '<div class="story-project-delete-confirm story-asset-appearance-delete-confirm" role="alertdialog" aria-label="' +
          escapeHtml(_0x53c456['deleteAppearanceLabel'] || '删除当前形象') +
          '">\n      <span>' +
          escapeHtml(_0x53c456['deleteAppearanceLabel'] || '删除当前形象') +
          '？</span>\n      <button type="button" class="confirm-btn confirm-cancel" data-story-action="cancel-delete-asset-appearance">取消</button>\n      <button type="button" class="confirm-btn confirm-ok" data-story-action="confirm-delete-asset-appearance" aria-label="确认' +
          escapeHtml(_0x53c456['deleteAppearanceLabel'] || '删除当前形象') +
          '\x22>删除</button>\x0a\x20\x20\x20\x20</div>'
        : '') +
      '\n  </div>'
    );
  }
  function _0x28cc2c(_0x4ad77d = {}) {
    if (!_0x4ad77d['visible']) return '';
    const _0x5e3b0a = _0x4ad77d['reference'],
      _0x59cce1 = Array['isArray'](_0x4ad77d['history']) ? _0x4ad77d['history'] : [],
      _0x5ef971 = renderVoiceFooter({
        workflow: _0x4ad77d['footer']?.['workflow'],
        nodeData: _0x4ad77d['footer']?.['nodeData'],
        workflowItems: _0x4ad77d['footer']?.['workflowItems'],
        labels: { advanced: '高级设置', generateTitle: '生成声音参考' },
      }),
      _0x5049a1 = _0x5e3b0a
        ? ''
        : '<button type="button" class="story-character-voice-upload-zone is-empty ' +
          (_0x4ad77d['isGenerating'] ? 'img-preview-loading' : '') +
          '\x22\x20data-story-character-voice-drop\x20data-story-action=\x22upload-character-voice\x22\x20aria-busy=\x22' +
          Boolean(_0x4ad77d['isGenerating']) +
          '\x22\x20' +
          (_0x4ad77d['isGenerating'] ? 'disabled' : '') +
          '>\n      <span class="story-character-voice-upload-icon">' +
          renderUploadIcon() +
          '</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22story-character-voice-upload-copy\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<strong>上传或拖入声音参考</strong>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<small>支持\x20MP3\x20/\x20WAV\x20/\x20M4A，建议\x205–15\x20秒</small>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
          (_0x4ad77d['isGenerating'] ? renderLoadingOverlay({ compact: !![] }) : '') +
          '\n      </button>',
      _0x37deb9 = _0x59cce1['length']
        ? '<div class="story-character-voice-history-wrap">\n        <button type="button" class="story-character-voice-history-button" data-story-action="toggle-character-voice-history" aria-label="历史音频" aria-haspopup="true" aria-expanded="false" ' +
          (_0x4ad77d['isGenerating'] ? 'disabled' : '') +
          '>' +
          _0xa86cd3() +
          '</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-character-voice-history-panel\x22\x20aria-hidden=\x22true\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<strong>历史音频</strong>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-character-voice-history-list\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
          _0x59cce1['map'](
            (_0x36fb72, _0x4892da) =>
              '<div class="story-character-voice-history-item">\n              <button type="button" class="story-character-voice-history-play" data-story-character-voice-history-play="' +
              _0x4892da +
              '\x22\x20aria-label=\x22试听历史音频\x20' +
              (_0x4892da + 0x1) +
              '\x22>' +
              _0x475ad3(!![]) +
              '</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span><strong>' +
              escapeHtml(_0x36fb72['label']) +
              '</strong><small>' +
              escapeHtml(_0x36fb72['timeLabel']) +
              '</small></span>\n              <button type="button" class="story-character-voice-history-restore" data-story-character-voice-history-restore="' +
              _0x4892da +
              '">设为当前</button>\n            </div>',
          )['join']('') +
          '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20</div>'
        : '';
    return (
      '<div class="story-asset-detail-copy story-asset-detail-panel-face story-asset-detail-panel-face--voice story-character-voice-panel" data-story-character-voice-panel aria-hidden="' +
      !_0x4ad77d['isActive'] +
      '\x22\x20' +
      (_0x4ad77d['isActive'] ? '' : 'inert') +
      '>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-character-voice-navigation\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-character-voice-capsule\x20story-character-voice-return-control\x20is-active\x22\x20data-story-action=\x22close-character-voice\x22\x20aria-label=\x22返回图片参考\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22story-character-voice-icon\x22>' +
      _0x411f5c() +
      '</span>\n          <span>图片参考</span>\n        </button>\n      </div>\n      <div class="story-character-voice-current ' +
      (_0x5e3b0a ? 'has-reference' : 'is-empty') +
      '">\n        ' +
      (_0x5e3b0a
        ? renderAudioPlaybackSurface({
            audioUrl: _0x5e3b0a['audioUrl'] || _0x5e3b0a['localPath'],
            waveformUrl: _0x5e3b0a['waveformLocalPath'] || _0x5e3b0a['waveformUrl'],
            className:
              'story-character-voice-audio-card has-reference ' +
              (_0x4ad77d['isGenerating'] ? 'img-preview-loading' : ''),
            playLabel: '播放声音参考',
            pauseLabel: '暂停声音参考',
            disabled: _0x4ad77d['isGenerating'],
            ariaBusy: _0x4ad77d['isGenerating'],
            dataAttributes: {
              'data-story-character-voice-audio-surface': '',
              'data-story-character-voice-drop': '',
            },
            trailingHtml: _0x4ad77d['isGenerating'] ? renderLoadingOverlay({ compact: !![] }) : '',
          })
        : '') +
      '\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
      _0x5049a1 +
      '\n        ' +
      (_0x5e3b0a || _0x59cce1['length']
        ? '<div\x20class=\x22story-character-voice-current-actions\x20' +
          (_0x4ad77d['isGenerating'] ? 'is-generating' : '') +
          '">\n          ' +
          (_0x5e3b0a
            ? '<button type="button" class="story-character-voice-upload-button" data-story-action="upload-character-voice" aria-label="上传替换声音参考" ' +
              (_0x4ad77d['isGenerating'] ? 'disabled' : '') +
              '>' +
              renderUploadIcon() +
              '</button>\n          <button type="button" class="story-character-voice-remove" data-story-action="remove-character-voice" aria-label="移除声音参考" ' +
              (_0x4ad77d['isGenerating'] ? 'disabled' : '') +
              '>' +
              renderDeleteIcon() +
              '</button>'
            : '') +
          '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
          _0x37deb9 +
          '\n        </div>'
        : '') +
      '\n      </div>\n      <div class="story-character-voice-fields">\n        <label>\n          <span>试听台词 <small>优先合并角色对白，生成结果最多 5 秒</small></span>\n          <textarea data-story-character-voice-sample maxlength="' +
      Math['max'](0x1, Number(_0x4ad77d['sampleMaxCharacters']) || 0x1) +
      '\x22>' +
      escapeHtml(_0x4ad77d['sampleText'] || '') +
      '</textarea>\n        </label>\n        <label>\n          <span>声音设定 <small>用于描述音色、年龄、情绪和说话方式</small></span>\n          <textarea data-story-character-voice-description maxlength="600">' +
      escapeHtml(_0x4ad77d['voiceDescription'] || '') +
      '</textarea>\n        </label>\n      </div>\n      ' +
      (_0x4ad77d['error']
        ? '<p class="story-character-voice-error" role="alert">' + escapeHtml(_0x4ad77d['error']) + '</p>'
        : '') +
      '\n      <div class="story-character-voice-generation-bar story-asset-generation-bar prompt-panel-footer">\n        <footer class="story-character-voice-model-footer ' +
      (_0x4ad77d['isGenerating'] ? 'is-generating' : '') +
      '" data-story-character-voice-model-footer>\n          ' +
      _0x5ef971 +
      '\n        </footer>\n        ' +
      renderRequestDebugButton('data-story-action="debug-character-voice"') +
      '<button type="button" class="story-asset-generate-button story-main-action-button" data-story-action="generate-character-voice" ' +
      (_0x4ad77d['isGenerating'] ? 'disabled' : '') +
      ' aria-busy="' +
      Boolean(_0x4ad77d['isGenerating']) +
      '\x22>' +
      (_0x4ad77d['isGenerating'] ? renderStoryGenerationSpinner({ button: !![] }) : '') +
      '<span>' +
      (_0x4ad77d['isGenerating'] ? '生成中' : _0x5e3b0a ? '重新生成声音' : '生成声音') +
      '</span></button>\n      </div>\n  </div>'
    );
  }
  function _0x116898(_0xe59266 = {}) {
    if (_0xe59266['empty'])
      return (
        '<aside class="story-asset-detail story-empty-panel">\n      <strong>暂无可用素材</strong>\n      ' +
        (_0xe59266['showEmptyDescription']
          ? '<p>' + escapeHtml(_0xe59266['emptyDescription']) + '</p>'
          : '') +
        '\n    </aside>'
      );
    const _0x387970 = _0xe59266['asset'] || {},
      _0x5b2706 = _0xe59266['appearance'] || {},
      _0x11100e = Math['max'](0x20, Math['min'](0x44, Number(_0xe59266['detailSplitRatio']) || 0x32)),
      _0x460191 =
        '<div class="story-asset-preview-caption">\n      <div class="story-asset-caption-heading">\n        <span class="story-asset-caption-title">' +
        _0x2ea5c3(_0x387970, { canRename: _0xe59266['canRename'] }) +
        _0x49c7d9({ ..._0xe59266['voicePlayer'], id: _0x387970['id'], name: _0x387970['name'] }) +
        '</span>\n        <span class="story-asset-caption-tags">\n          ' +
        (_0xe59266['showBaseAppearanceControl']
          ? '<button type="button" class="story-base-appearance-button ' +
            (_0xe59266['isBaseAppearance'] ? 'is-active' : '') +
            '\x20' +
            (_0xe59266['isBaseAppearanceSelectionDisabled'] ? 'is-disabled' : '') +
            '\x22\x20' +
            (_0xe59266['hasMultipleAppearances'] ? 'data-story-action="set-base-appearance"' : 'disabled') +
            ' aria-pressed="' +
            Boolean(_0xe59266['isBaseAppearance']) +
            '" aria-disabled="' +
            !_0xe59266['canSetBaseAppearance'] +
            '\x22\x20title=\x22会以基础形象作为参考，生成角色的其他形象\x22>' +
            (_0xe59266['isBaseAppearance'] ? '基础形象' : '设为基础形象') +
            '</button>'
          : '') +
        '\n          ' +
        (_0xe59266['showStyleReference'] ? _0x1b30a3(_0xe59266['styleReference']) : '') +
        '\n          ' +
        _0x4a972f(_0xe59266['voiceCapsule']) +
        '\n        </span>\n      </div>\n      <span data-story-asset-caption-meta>' +
        escapeHtml(_0xe59266['captionMeta']) +
        '</span>\n    </div>';
    return (
      '<aside class="story-asset-detail story-workspace-asset-detail-layout ' +
      escapeHtml(_0xe59266['motionClass'] || '') +
      '" data-story-asset-detail-layout style="--story-asset-detail-top:' +
      _0x11100e +
      '%;">\n    <div class="story-asset-preview-wrap' +
      (_0xe59266['previewActions']?.['isDeleteAppearanceConfirming'] ? ' is-delete-confirming' : '') +
      '\x22\x20data-story-appearance-wheel=\x22' +
      Boolean(_0xe59266['hasMultipleAppearances']) +
      '\x22\x20' +
      (_0xe59266['hasMultipleAppearances']
        ? 'tabindex="0" aria-label="滚动鼠标滚轮或按左右方向键切换形象"'
        : '') +
      '>\n      <div class="story-asset-preview-slide ' +
      (_0xe59266['isGeneratingAppearance'] ? 'img-preview-loading' : '') +
      '" aria-busy="' +
      Boolean(_0xe59266['isGeneratingAppearance']) +
      '\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
      renderImage({
        imageUrl: _0x5b2706['imageUrl'],
        alt: _0x387970['name'] + ' · ' + (_0x5b2706['name'] || '形象'),
        className: 'story-asset-preview',
      }) +
      '\n        ' +
      (_0xe59266['isGeneratingAppearance'] ? renderLoadingOverlay() : '') +
      '\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20' +
      _0x5d2cbe(_0xe59266['previewActions']) +
      '\n      ' +
      (_0xe59266['hasMultipleAppearances'] ? '' + _0x28a17b('previous') + _0x28a17b('next') : '') +
      '\n    </div>\n    <div class="story-asset-detail-splitter panel-resize-handle panel-resize-handle--horizontal panel-resize-handle--transient" data-story-asset-detail-splitter role="separator" aria-orientation="horizontal" aria-label="调整形象预览与提示词区域高度" aria-valuemin="32" aria-valuemax="68" aria-valuenow="' +
      Math['round'](_0x11100e) +
      '" tabindex="0"></div>\n    <div class="story-asset-detail-panel-stage ' +
      (_0xe59266['panel']?.['isVoice'] ? 'is-voice' : 'is-image') +
      '\x20' +
      (_0xe59266['panel']?.['isAnimating'] ? 'is-animating' : 'is-settled') +
      '" data-story-asset-detail-panel-stage>\n      <div class="story-asset-detail-panel-cube ' +
      escapeHtml(_0xe59266['panel']?.['motionClass'] || '') +
      '">\n        <div class="story-asset-detail-copy story-asset-detail-panel-face story-asset-detail-panel-face--image" aria-hidden="' +
      Boolean(_0xe59266['panel']?.['isVoice']) +
      '\x22\x20' +
      (_0xe59266['panel']?.['isVoice'] ? 'inert' : '') +
      '>\n          ' +
      _0x460191 +
      '\n          <div class="story-asset-prompt-field">\n            <div class="story-asset-prompt-editor" data-story-asset-prompt data-story-asset-prompt-asset-id="' +
      escapeHtml(_0x387970['id']) +
      '" data-story-asset-prompt-appearance-id="' +
      escapeHtml(_0x5b2706['id']) +
      '" contenteditable="' +
      (_0x387970['isLibraryAsset'] || _0xe59266['readOnly'] ? 'false' : 'true') +
      '" role="textbox" aria-multiline="true" aria-label="形象提示词" spellcheck="false">' +
      renderPromptMentions(
        _0x387970['isLibraryAsset'] || _0xe59266['readOnly']
          ? _0x387970['description'] || _0x5b2706['prompt'] || ''
          : _0x5b2706['prompt'] || '',
        _0x5b2706,
      ) +
      '</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
      (_0x387970['isLibraryAsset'] || _0xe59266['readOnly']
        ? ''
        : '<div class="story-asset-generation-bar prompt-panel-footer">\n            ' +
          renderImageModelSelector({
            ..._0xe59266['imageModel'],
            showSchemaControls: !![],
            className: 'story-asset-image-model-selector',
          }) +
          '\n            <div class="story-asset-generation-actions">\n              ' +
          _0x2456d8(_0xe59266['preset']) +
          '\n              ' +
          _0x5e906c(_0xe59266['promptControl']) +
          '\n            </div>\n          </div>') +
      '\n        </div>\n        ' +
      _0x28cc2c(_0xe59266['voicePanel']) +
      '\n      </div>\n    </div>\n  </aside>'
    );
  }
  function _0x403cc2(_0x963ed7 = {}) {
    if (_0x963ed7['kind'] === 'batch-generation') return _0x44f298(_0x963ed7['control']);
    if (_0x963ed7['kind'] === 'prompt-generation') return _0x5e906c(_0x963ed7['control']);
    if (_0x963ed7['kind'] === 'preset') return _0x2456d8(_0x963ed7['control']);
    if (_0x963ed7['kind'] === 'library-add') return _0x3bfc7a(_0x963ed7['control']);
    if (_0x963ed7['kind'] === 'library-selection') return _0x486043(_0x963ed7['control']);
    return '';
  }
  function _0x1e8574(_0x1bf361 = {}) {
    if (_0x1bf361['kind'] === 'card') return _0x556b9c(_0x1bf361['card']);
    if (_0x1bf361['kind'] === 'detail') return _0x116898(_0x1bf361['detail']);
    if (_0x1bf361['kind'] === 'appearance-arrow') return _0x28a17b(_0x1bf361['direction']);
    if (_0x1bf361['kind'] === 'preview-actions') return _0x5d2cbe(_0x1bf361['actions']);
    if (_0x1bf361['kind'] === 'reference-input') return _0x1b30a3(_0x1bf361['reference']);
    if (_0x1bf361['kind'] === 'voice-capsule') return _0x4a972f(_0x1bf361['voiceCapsule']);
    if (_0x1bf361['kind'] === 'voice-panel') return _0x28cc2c(_0x1bf361['voicePanel']);
    if (_0x1bf361['kind'] === 'voice-player') return _0x49c7d9(_0x1bf361['voicePlayer']);
    if (_0x1bf361['kind'] === 'voice-icon') return _0x475ad3(_0x1bf361['hasVoice'] === !![]);
    return '';
  }
  return Object['freeze']({ renderAssetControls: _0x403cc2, renderAssetSurface: _0x1e8574 });
}
