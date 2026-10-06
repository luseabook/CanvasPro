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
function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#39;');
}
function normalizeText(item) {
  return String(item ?? '').trim();
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
  renderPromptMentions: renderPromptMentions = (key) => escapeHtml(key),
  renderSelectionActions: renderSelectionActions = ({ primaryActionHtml: primaryActionHtml = '' } = {}) =>
    primaryActionHtml,
  renderTabIcon: renderTabIcon = emptyRenderer,
  renderUploadIcon: renderUploadIcon = emptyRenderer,
  renderVoiceFooter: renderVoiceFooter = emptyRenderer,
} = {}) {
  function run(error = {}, { canRename: canRename = false } = {}) {
    const text = normalizeText(error.name) || '未命名素材',
      index = canRename
        ? ' data-story-asset-name-id="' +
          escapeHtml(error.id) +
          '" aria-label="重命名' +
          escapeHtml(text) +
          '"'
        : '';
    return '<strong' + index + '>' + escapeHtml(text) + '</strong>';
  }
  function run2(imageUrl = {}) {
    const result =
        '<button type="button" class="story-asset-card ' +
        (imageUrl.isCurrent && !imageUrl.isSelectionMode ? 'is-selected' : '') +
        ' ' +
        (imageUrl.isSelectionMode ? 'is-selection-mode' : '') +
        ' ' +
        (imageUrl.isChecked ? 'is-checked' : '') +
        (imageUrl.cardClassName ? ' ' + escapeHtml(imageUrl.cardClassName) : '') +
        '" data-story-asset-id="' +
        escapeHtml(imageUrl.id) +
        '" data-story-marquee-item data-story-marquee-id="' +
        escapeHtml(imageUrl.id) +
        '" data-story-appearance-count="' +
        Math.max(0, Number(imageUrl.appearanceCount) || 0) +
        '" aria-pressed="' +
        (imageUrl.isSelectionMode ? String(Boolean(imageUrl.isChecked)) : 'false') +
        '"' +
        (imageUrl.draggable ? ' draggable="true"' : '') +
        (imageUrl.cardAttributes ? ' ' + imageUrl.cardAttributes : '') +
        '>\n    <span class="story-asset-card-media ' +
        (imageUrl.isLoading ? 'img-preview-loading' : '') +
        '" ' +
        (imageUrl.canNavigateAppearances
          ? 'data-story-card-appearance-wheel="' + escapeHtml(imageUrl.id) + '"'
          : '') +
        ' aria-busy="' +
        Boolean(imageUrl.isLoading) +
        '">\n      ' +
        (imageUrl.cardMediaHtml ||
          renderImage({
            imageUrl: imageUrl.preview?.imageUrl,
            fallbackImageUrl: imageUrl.fallbackImageUrl,
            workspaceAssetLibraryImage: imageUrl.workspaceAssetLibraryImage,
            alt:
              '' +
              imageUrl.name +
              (imageUrl.preview?.name ? ' · ' + imageUrl.preview.name : ''),
            className: 'story-asset-card-image',
          })) +
        '\n      ' +
        (imageUrl.isLoading ? renderLoadingOverlay({ compact: true }) : '') +
        '\n      ' +
        (!imageUrl.isLoading &&
        !normalizeText(imageUrl.preview?.imageUrl) &&
        normalizeText(imageUrl.preview?.error)
          ? '<span class="story-asset-card-failure" role="status">生成失败</span>'
          : '') +
        '\n    </span>\n    <span class="story-asset-card-copy"' +
        (imageUrl.canNavigateAppearances
          ? ' data-story-card-appearance-wheel="' + escapeHtml(imageUrl.id) + '"'
          : '') +
        '>\n      <span class="story-asset-card-heading">' +
        run(imageUrl, { canRename: imageUrl.canRename }) +
        (imageUrl.showRoleTag ? '<small>' + escapeHtml(imageUrl.role || '素材') + '</small>' : '') +
        (imageUrl.showCardVoiceStatus
          ? renderWorkspaceCardVoiceStatus(imageUrl.hasCardVoiceReference)
          : '') +
        '</span>\n      <span class="story-asset-card-status">' +
        (imageUrl.cardStatusHtml ||
          (imageUrl.statusText
            ? '<span>' + escapeHtml(imageUrl.statusText) + '</span>'
            : imageUrl.stats?.total > 1
              ? '<span>形象 ' + imageUrl.stats.generated + '/' + imageUrl.stats.total + '</span>'
              : '')) +
        '</span>\n      ' +
        (imageUrl.cardMetaHtml || '') +
        '\n      <p>' +
        escapeHtml(imageUrl.promptPreview || '') +
        '</p>\n    </span>\n  </button>',
      enabled = imageUrl.showAppearanceDelete
        ? renderWorkspaceCardDeleteControl({
            className: 'story-asset-card-delete-trigger',
            ariaLabel: '删除当前形象',
            actionAttributes: {
              'data-story-action': 'request-delete-asset-appearance',
              'data-story-card-appearance-id': imageUrl.id,
            },
            disabled: imageUrl.isLoading || !imageUrl.canDeleteAppearance,
          })
        : imageUrl.canDelete
          ? renderWorkspaceCardDeleteControl({
              className: 'story-asset-card-delete-trigger',
              ariaLabel:
                '删除' +
                (normalizeText(imageUrl.kind).toLowerCase() === 'scene' ? '场景' : '人物') +
                ' ' +
                imageUrl.name,
              actionAttributes: {
                'data-story-action': 'delete-asset-card',
                'data-story-asset-delete-id': imageUrl.id,
              },
              disabled: imageUrl.isLoading,
            })
          : '',
      enabled2 = imageUrl.canNavigateAppearances
        ? renderWorkspaceCardAppearanceNavigation({
            attributes: { 'data-story-card-appearance-wheel': imageUrl.id },
            previousAttributes: {
              'data-story-action': 'previous-appearance',
              'data-story-card-appearance-id': imageUrl.id,
            },
            nextAttributes: {
              'data-story-action': 'next-appearance',
              'data-story-card-appearance-id': imageUrl.id,
            },
          })
        : '',
      enabled3 = imageUrl.showCardUpload
        ? '<span class="story-replication-character-actions"><button type="button" class="story-replication-card-upload story-secondary-button" data-story-action="upload-asset" data-story-card-appearance-id="' +
          escapeHtml(imageUrl.id) +
          '" aria-label="上传' +
          escapeHtml(imageUrl.name) +
          '的新形象"' +
          (imageUrl.isLoading ? ' disabled' : '') +
          '>' +
          renderUploadIcon() +
          '<span>上传形象</span></button><button type="button" class="story-replication-card-generate story-secondary-button" data-story-action="generate-asset" data-story-card-appearance-id="' +
          escapeHtml(imageUrl.id) +
          '"' +
          (imageUrl.isLoading ? ' disabled' : '') +
          '>' +
          renderWorkspaceActionIcon('generate') +
          '<span>生成形象</span></button></span><button type="button" class="story-replication-empty-upload" data-story-action="upload-asset" data-story-card-appearance-id="' +
          escapeHtml(imageUrl.id) +
          '" aria-label="上传' +
          escapeHtml(imageUrl.name) +
          '的新形象（待设定）"' +
          (imageUrl.isLoading ? ' disabled' : '') +
          '></button>'
        : '';
    if (
      !enabled &&
      !imageUrl.accessoryHtml &&
      !enabled2 &&
      !enabled3 &&
      !imageUrl.cardClassName?.includes('workspace-portrait-card')
    )
      return result;
    return (
      '<span class="story-asset-card-shell' +
      (imageUrl.cardClassName?.includes('workspace-portrait-card') &&
      !imageUrl.cardClassName.includes('story-replication-character-card') &&
      imageUrl.kind === 'character'
        ? ' workspace-card-with-image-actions'
        : '') +
      (imageUrl.shellClassName ? ' ' + escapeHtml(imageUrl.shellClassName) : '') +
      '">\n    ' +
      result +
      '\n    ' +
      enabled2 +
      enabled +
      enabled3 +
      (imageUrl.showCardImageActions
        ? renderWorkspaceCardImageActions({
            uploadAttributes: {
              'data-story-action': 'upload-asset',
              'data-story-card-appearance-id': imageUrl.id,
            },
            generateAttributes: {
              'data-story-action': 'generate-asset',
              'data-story-card-appearance-id': imageUrl.id,
            },
            disabled: imageUrl.isLoading,
          })
        : '') +
      (imageUrl.accessoryHtml || '') +
      '\n  </span>'
    );
  }
  function run3(data, options = '') {
    const target = options ? ' data-story-card-appearance-id="' + escapeHtml(options) + '"' : '';
    if (data === 'previous')
      return (
        '<button type="button" class="story-appearance-arrow story-appearance-arrow--previous" data-story-action="previous-appearance"' +
        target +
        ' aria-label="上一个形象"><svg class="story-appearance-arrow-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m14.5 6.5-5.5 5.5 5.5 5.5"/></svg></button>'
      );
    return (
      '<button type="button" class="story-appearance-arrow story-appearance-arrow--next" data-story-action="next-appearance"' +
      target +
      ' aria-label="下一个形象"><svg class="story-appearance-arrow-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9.5 6.5 5.5 5.5-5.5 5.5"/></svg></button>'
    );
  }
  function run4() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.5"/><path d="m6.5 16 3.5-3.5 2.6 2.6 1.8-1.8 3.1 2.7"/></svg>';
  }
  function run5(el = {}) {
    const text2 = normalizeText(el.referenceImageUrl);
    return (
      '<span class="story-asset-style-reference-control ' +
      (text2 ? 'has-reference' : '') +
      '">\n    <button type="button" class="story-character-voice-capsule story-asset-style-reference-capsule ' +
      (text2 ? 'has-reference' : '') +
      '" data-story-action="upload-asset-reference" aria-label="' +
      (text2 ? '替换风格参考' : '上传风格参考') +
      '" ' +
      (el.disabled ? 'disabled' : '') +
      '>\n      <span class="story-character-voice-icon">' +
      (text2 ? '<img src="' + escapeHtml(text2) + '" alt="">' : run4()) +
      '</span>\n      <span>风格参考</span>\n    </button>\n    ' +
      (text2
        ? '<span class="story-asset-style-reference-preview" aria-hidden="true"><img src="' +
          escapeHtml(text2) +
          '" alt=""></span>'
        : '') +
      '\n    ' +
      (text2
        ? '<button type="button" class="story-asset-style-reference-remove" data-story-action="remove-asset-reference" aria-label="删除风格参考" ' +
          (el.disabled ? 'disabled' : '') +
          '>&times;</button>'
        : '') +
      '\n  </span>'
    );
  }
  function run6(el2 = {}) {
    if (!el2.visible) return '';
    return (
      '<div class="story-home-param-picker story-asset-preset-picker">\n    <button type="button" class="story-home-param-trigger story-menu-trigger story-asset-preset-trigger" data-story-home-param-trigger="asset-preset" aria-haspopup="listbox" aria-expanded="false" ' +
      (el2.disabled ? 'disabled' : '') +
      '>\n      <span>预设：' +
      escapeHtml(el2.selectedLabel) +
      '</span>\n      ' +
      renderHomeParamChevron() +
      '\n    </button>\n    <div class="story-home-param-popover story-asset-preset-popover" role="listbox" aria-label="' +
      escapeHtml(el2.label) +
      '">\n      <strong>' +
      escapeHtml(el2.label) +
      '</strong>\n      <div class="story-asset-preset-options">\n        ' +
      (Array.isArray(el2.options) ? el2.options : [])
        .map(
          (source) =>
            '<button type="button" class="story-asset-preset-option floating-menu-item has-subtitle ' +
            (source.id === el2.selectedId ? 'active is-selected' : '') +
            '" data-story-asset-preset-option="' +
            escapeHtml(source.id) +
            '" data-story-asset-preset-kind="' +
            escapeHtml(el2.assetKind) +
            '" role="option" aria-selected="' +
            (source.id === el2.selectedId) +
            '"><span class="fmi-content"><span class="fmi-title">' +
            escapeHtml(source.label) +
            '</span><small class="fmi-sub">' +
            escapeHtml(source.description) +
            '</small></span></button>',
        )
        .join('') +
      '\n      </div>\n    </div>\n  </div>'
    );
  }
  function run7(enabled4 = false) {
    if (enabled4)
      return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 6.5v11l9-5.5-9-5.5Z"/></svg>';
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4v16M8.5 7.5v9M15.5 8.5v7M5 10v4M19 10v4"/></svg>';
  }
  function run8() {
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7V3m0 4h4"/><path d="M5.4 6.2A8 8 0 1 1 4 12"/><path d="M12 8v4l2.8 1.8"/></svg>';
  }
  function run9(enabled5 = {}) {
    if (!enabled5.visible) return '';
    if (enabled5.useSourceMenu && !enabled5.isOpen)
      return (
        '<span class="story-voice-source-menu-wrap">\n        <button type="button" class="story-character-voice-capsule ' +
        (enabled5.hasReference ? 'has-reference' : 'is-missing') +
        '" data-story-character-voice-capsule data-story-audio-action="toggle-voice-menu" aria-haspopup="menu" aria-expanded="false">\n          <span class="story-character-voice-icon">' +
        run7(false) +
        '</span><span>声音参考</span>\n        </button>\n        <span class="story-voice-source-menu" role="menu" aria-label="添加人物声音" hidden>\n          <button type="button" role="menuitem" data-story-action="upload-character-voice">上传声音</button>\n          <button type="button" role="menuitem" data-story-audio-action="choose-project-voice">从项目音频添加</button>\n          <button type="button" role="menuitem" data-story-action="open-character-voice">生成与管理声音</button>\n          ' +
        (enabled5.hasReference
          ? '<button type="button" role="menuitem" data-story-action="remove-character-voice">删除音频参考</button>'
          : '') +
        '\n        </span>\n      </span>'
      );
    if (enabled5.uploadLabel)
      return (
        '<button type="button" class="story-character-voice-capsule ' +
        (enabled5.hasReference ? 'has-reference' : 'is-missing') +
        '" data-story-character-voice-capsule data-story-action="upload-character-voice" aria-label="' +
        escapeHtml(enabled5.uploadLabel) +
        '">\n      <span class="story-character-voice-icon">' +
        run7(false) +
        '</span>\n      <span>' +
        escapeHtml(enabled5.uploadLabel) +
        '</span>\n    </button>'
      );
    const next = enabled5.isOpen ? 'close-character-voice' : 'open-character-voice',
      current = enabled5.isOpen ? '图片参考' : '声音参考';
    return (
      '<button type="button" class="story-character-voice-capsule ' +
      (enabled5.hasReference ? 'has-reference' : 'is-missing') +
      ' ' +
      (enabled5.isOpen ? 'is-active' : '') +
      '" data-story-character-voice-capsule data-story-action="' +
      next +
      '" aria-label="打开角色' +
      current +
      '" aria-pressed="' +
      Boolean(enabled5.isOpen) +
      '">\n    <span class="story-character-voice-icon">' +
      (enabled5.isOpen ? run4() : run7(false)) +
      '</span>\n    <span>' +
      current +
      '</span>\n  </button>'
    );
  }
  function run10(error2 = {}) {
    if (!error2.visible) return '';
    return (
      '<span class="story-character-voice-name-player" data-story-character-voice-player="' +
      escapeHtml(error2.id) +
      '">\n    <button type="button" class="story-character-voice-name-play" data-story-action="play-character-voice" data-story-voice-asset-id="' +
      escapeHtml(error2.id) +
      '" aria-label="播放 ' +
      escapeHtml(error2.name) +
      ' 的声音参考">\n      <svg class="story-character-voice-name-play-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M7 5.4v9.2l7.2-4.6L7 5.4Z"/></svg>\n      <svg class="story-character-voice-name-pause-icon" viewBox="0 0 20 20" aria-hidden="true"><path d="M6.5 5.5h2.3v9H6.5zM11.2 5.5h2.3v9h-2.3z"/></svg>\n    </button>\n    <span class="story-character-voice-waveform" data-story-character-voice-waveform hidden aria-hidden="true">' +
      Array.from({ length: 12 }, () => '<i></i>').join('') +
      '</span>\n  </span>'
    );
  }
  function run11(entry) {
    if (entry === 'image')
      return '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="2.5" y="3" width="15" height="14" rx="2.2"/><circle cx="7" cy="7.5" r="1.3"/><path d="m4.5 14 3.4-3.4 2.7 2.7 1.8-1.8 3.1 2.5"/></svg>';
    if (entry === 'voice')
      return '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M3 10h1.5m2-3.5v7m3-10v13m3-9v5m3-7v9M18 10h-1.5"/></svg>';
    return '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="2.5" y="3" width="6" height="6" rx="1.2"/><rect x="11.5" y="3" width="6" height="6" rx="1.2"/><rect x="2.5" y="12" width="6" height="5" rx="1.2"/><rect x="11.5" y="12" width="6" height="5" rx="1.2"/></svg>';
  }
  function run12(el3 = {}) {
    const text3 = normalizeText(el3.directMode),
      text4 = normalizeText(el3.action) || 'batch-generate-assets',
      record = el3.isCancellation
        ? 'aria-label="取消尚未开始的素材生成任务"'
        : text3
          ? 'data-story-asset-batch-direct-mode="' + escapeHtml(text3) + '"'
          : 'aria-haspopup="menu" aria-expanded="false"',
      payload =
        '<button type="button" class="story-primary-button story-asset-batch-trigger" data-story-action="' +
        escapeHtml(text4) +
        '" data-story-asset-batch-control ' +
        record +
        ' ' +
        (el3.disabled ? 'disabled' : '') +
        ' aria-busy="' +
        Boolean(el3.busy) +
        '">' +
        (el3.busy ? renderStoryGenerationSpinner({ button: true }) : '') +
        '<span class="story-asset-batch-trigger-label">' +
        escapeHtml(el3.label) +
        '</span></button>';
    if (el3.isCancellation) return payload;
    if (text3) return payload;
    return (
      '<div class="story-asset-batch-menu-wrap">\n    ' +
      payload +
      '\n    <div class="story-asset-batch-menu" role="menu" aria-label="选择批量生成内容">\n      <button type="button" role="menuitem" data-story-asset-batch-mode="image"><span class="story-asset-batch-mode-icon">' +
      run11('image') +
      '</span><span>仅图片</span></button>\n      <button type="button" role="menuitem" data-story-asset-batch-mode="voice"><span class="story-asset-batch-mode-icon">' +
      run11('voice') +
      '</span><span>仅音频</span></button>\n      <button type="button" role="menuitem" data-story-asset-batch-mode="all"><span class="story-asset-batch-mode-icon">' +
      run11('all') +
      '</span><span>全部</span></button>\n    </div>\n  </div>'
    );
  }
  function run13(el4 = {}) {
    if (!el4.isMultiSelection)
      return (
        renderRequestDebugButton('data-story-action="debug-asset-image"') +
        '<button type="button" class="story-asset-generate-button story-main-action-button" data-story-action="generate-asset" ' +
        (el4.disabled ? 'disabled' : '') +
        ' aria-busy="' +
        Boolean(el4.busy) +
        '">' +
        (el4.busy ? renderStoryGenerationSpinner({ button: true }) : '') +
        '<span data-story-asset-generate-label>' +
        escapeHtml(el4.label || '生成素材图') +
        '</span></button>'
      );
    const text5 = normalizeText(el4.action) || 'batch-generate-assets';
    return (
      '<button type="button" class="story-asset-generate-button story-main-action-button story-asset-batch-trigger" data-story-action="' +
      escapeHtml(text5) +
      '" data-story-asset-batch-control ' +
      (el4.isCancellation
        ? 'aria-label="取消尚未开始的素材生成任务"'
        : 'data-story-asset-batch-direct-mode="image"') +
      ' ' +
      (el4.disabled ? 'disabled' : '') +
      ' aria-busy="' +
      Boolean(el4.busy) +
      '">' +
      (el4.busy ? renderStoryGenerationSpinner({ button: true }) : '') +
      '<span class="story-asset-batch-trigger-label">' +
      escapeHtml(el4.label) +
      '</span></button>'
    );
  }
  function run14(imageUrl2 = {}) {
    return (
      '<button type="button" class="story-library-target-option" role="option" data-story-library-appearance-target="' +
      escapeHtml(imageUrl2.id) +
      '" data-story-library-target-asset-kind="' +
      escapeHtml(imageUrl2.kind) +
      '" aria-haspopup="menu" aria-expanded="false">\n    <span class="story-library-target-thumb">' +
      renderImage({
        imageUrl: imageUrl2.preview?.imageUrl,
        alt: imageUrl2.name,
        className: 'story-library-target-image',
      }) +
      '</span>\n    <span class="story-library-target-copy"><strong>' +
      escapeHtml(imageUrl2.name) +
      '</strong><small>' +
      (imageUrl2.appearanceCount ? imageUrl2.appearanceCount + ' 个形象' : '暂无形象') +
      '</small></span>\n  </button>'
    );
  }
  function run15(alt = {}, imageUrl3 = {}, handle = false) {
    const text6 = normalizeText(imageUrl3.name) || '未命名形象';
    return (
      '<button type="button" class="story-library-appearance-option" role="menuitem" data-story-library-target-asset-id="' +
      escapeHtml(alt.id) +
      '" data-story-library-target-appearance-id="' +
      escapeHtml(imageUrl3.id) +
      '" ' +
      (handle ? 'disabled title="替换已有形象时只能选择一张图片"' : '') +
      '>\n      <span class="story-library-appearance-thumb">' +
      renderImage({
        imageUrl: imageUrl3.imageUrl,
        alt: alt.name + ' · ' + text6,
        className: 'story-library-appearance-image',
      }) +
      '</span>\n      <span class="story-library-appearance-copy"><strong>' +
      escapeHtml(text6) +
      '</strong><small>替换此形象图片</small></span>\n    </button>'
    );
  }
  function run16(error3 = {}, count = 0) {
    const list = Array.isArray(error3.appearances) ? error3.appearances : [],
      state = count !== 1;
    return (
      '<div class="story-library-appearance-popover" data-story-library-appearance-menu="' +
      escapeHtml(error3.id) +
      '" role="menu" aria-label="选择' +
      escapeHtml(error3.name) +
      '的形象" aria-hidden="true">\n      <div class="story-library-target-heading"><strong>' +
      escapeHtml(error3.name) +
      '的形象</strong><small>' +
      (state ? '选择一张图片后可替换已有形象' : '选择要替换的形象') +
      '</small></div>\n      <div class="story-library-appearance-list">\n        ' +
      list.map((config) => run15(error3, config, state)).join('') +
      '\n      </div>\n      <button type="button" class="story-library-appearance-add" role="menuitem" data-story-library-target-asset-id="' +
      escapeHtml(error3.id) +
      '" data-story-library-target-create-appearance="true"><span aria-hidden="true">＋</span><strong>新增形象</strong></button>\n    </div>'
    );
  }
  function primaryActionHtml2(options2 = {}) {
    const list2 = Array.isArray(options2.targetGroups) ? options2.targetGroups : [],
      scope = Math.max(0, Math.trunc(Number(options2.selectedCount) || 0));
    return (
      '<div class="story-asset-batch-menu-wrap story-library-add-menu-wrap">\n    <button type="button" class="story-primary-button story-asset-batch-trigger" data-story-action="add-library-assets-to-project" aria-haspopup="menu" aria-expanded="false" ' +
      (scope ? '' : 'disabled') +
      '><span class="story-asset-batch-trigger-label">加入到项目' +
      (options2.showCount && scope ? ' (' + scope + ')' : '') +
      '</span></button>\n    <div class="story-asset-batch-menu story-library-add-menu" role="menu" aria-label="选择加入项目的素材分类">\n      ' +
      list2.map(
        (input) =>
          '<button type="button" role="menuitem" data-story-library-target-kind="' +
          escapeHtml(input.kind) +
          '" aria-haspopup="listbox" aria-expanded="false"><span class="story-asset-batch-mode-icon">' +
          renderTabIcon(input.kind) +
          '</span><span>' +
          escapeHtml(input.label) +
          '</span></button>',
      ).join('') +
      '\n    </div>\n    ' +
      list2.map(
        (output) =>
          '<div class="story-library-target-popover" data-story-library-target-menu="' +
          escapeHtml(output.kind) +
          '" role="listbox" aria-label="选择本剧' +
          escapeHtml(output.label) +
          '" aria-hidden="true">\n      <div class="story-library-target-heading"><strong>选择本剧' +
          escapeHtml(output.label) +
          '</strong><small>悬停后选择已有形象或新增</small></div>\n      <div class="story-library-target-list">\n        ' +
          (output.targets?.length
            ? output.targets.map(run14).join('')
            : '<div class="story-library-target-empty">本剧暂无可绑定的' +
              escapeHtml(output.label) +
              '</div>') +
          '\n      </div>\n      ' +
          (output.targets?.map((value2) => run16(value2, scope)).join('') || '') +
          '\n    </div>',
      ).join('') +
      '\n  </div>'
    );
  }
  function run17(selectionMode = {}) {
    return renderSelectionActions({
      selectionMode: selectionMode.selectionMode,
      selectedCount: selectionMode.selectedCount,
      allSelected: selectionMode.allSelected,
      primaryActionHtml: primaryActionHtml2({ ...selectionMode, showCount: selectionMode.selectionMode }),
      selectAllLabel: '全选图片',
      clearSelectionLabel: '取消全选',
    });
  }
  function run18(enabled6 = {}) {
    const renderDownloadButton2 = renderDownloadButton({
      action: 'download-asset-image',
      enabled: Boolean(enabled6.canDownload),
    });
    if (!enabled6.showProjectActions)
      return renderDownloadButton2
        ? '<div class="story-asset-preview-actions">' + renderDownloadButton2 + '</div>'
        : '';
    return (
      '<div class="story-asset-preview-actions">\n    ' +
      renderDownloadButton2 +
      '\n    <button type="button" class="story-character-voice-upload-button story-add-to-library-button ' +
      (enabled6.librarySynced ? 'is-synced' : '') +
      '" data-story-action="add-asset-appearance-to-library" aria-label="' +
      escapeHtml(enabled6.saveToLibraryLabel) +
      '" title="' +
      escapeHtml(enabled6.saveToLibraryLabel) +
      '" ' +
      (enabled6.canSaveToLibrary ? '' : 'disabled') +
      ' aria-busy="' +
      Boolean(enabled6.isSavingToLibrary) +
      '">' +
      (enabled6.isSavingToLibrary
        ? renderStoryGenerationSpinner({ button: true })
        : renderAddToLibraryIcon()) +
      '</button>\n    <button type="button" class="story-upload-replace story-character-voice-upload-button" data-story-action="upload-asset" aria-label="上传替换图片" title="上传替换图片" ' +
      (enabled6.canUpload ? '' : 'disabled') +
      '>' +
      renderUploadIcon() +
      '</button>\n    ' +
      (enabled6.showDeleteAppearance
        ? '<button type="button" class="story-character-voice-remove story-delete-current-appearance-button" data-story-action="request-delete-asset-appearance" aria-label="' +
          escapeHtml(enabled6.deleteAppearanceLabel || '删除当前形象') +
          '" title="' +
          escapeHtml(enabled6.deleteAppearanceLabel || '删除当前形象') +
          '" ' +
          (enabled6.canDeleteAppearance ? '' : 'disabled') +
          '>' +
          renderDeleteIcon() +
          '</button>'
        : '') +
      '\n    ' +
      (enabled6.isDeleteAppearanceConfirming
        ? '<div class="story-project-delete-confirm story-asset-appearance-delete-confirm" role="alertdialog" aria-label="' +
          escapeHtml(enabled6.deleteAppearanceLabel || '删除当前形象') +
          '">\n      <span>' +
          escapeHtml(enabled6.deleteAppearanceLabel || '删除当前形象') +
          '？</span>\n      <button type="button" class="confirm-btn confirm-cancel" data-story-action="cancel-delete-asset-appearance">取消</button>\n      <button type="button" class="confirm-btn confirm-ok" data-story-action="confirm-delete-asset-appearance" aria-label="确认' +
          escapeHtml(enabled6.deleteAppearanceLabel || '删除当前形象') +
          '">删除</button>\n    </div>'
        : '') +
      '\n  </div>'
    );
  }
  function run19(workflow = {}) {
    if (!workflow.visible) return '';
    const audioUrl = workflow.reference,
      list3 = Array.isArray(workflow.history) ? workflow.history : [],
      renderVoiceFooter2 = renderVoiceFooter({
        workflow: workflow.footer?.workflow,
        nodeData: workflow.footer?.nodeData,
        workflowItems: workflow.footer?.workflowItems,
        labels: { advanced: '高级设置', generateTitle: '生成声音参考' },
      }),
      value3 = audioUrl
        ? ''
        : '<button type="button" class="story-character-voice-upload-zone is-empty ' +
          (workflow.isGenerating ? 'img-preview-loading' : '') +
          '" data-story-character-voice-drop data-story-action="upload-character-voice" aria-busy="' +
          Boolean(workflow.isGenerating) +
          '" ' +
          (workflow.isGenerating ? 'disabled' : '') +
          '>\n      <span class="story-character-voice-upload-icon">' +
          renderUploadIcon() +
          '</span>\n        <span class="story-character-voice-upload-copy">\n          <strong>上传或拖入声音参考</strong>\n          <small>支持 MP3 / WAV / M4A，建议 5–15 秒</small>\n        </span>\n        ' +
          (workflow.isGenerating ? renderLoadingOverlay({ compact: true }) : '') +
          '\n      </button>',
      value4 = list3.length
        ? '<div class="story-character-voice-history-wrap">\n        <button type="button" class="story-character-voice-history-button" data-story-action="toggle-character-voice-history" aria-label="历史音频" aria-haspopup="true" aria-expanded="false" ' +
          (workflow.isGenerating ? 'disabled' : '') +
          '>' +
          run8() +
          '</button>\n        <div class="story-character-voice-history-panel" aria-hidden="true">\n          <strong>历史音频</strong>\n          <div class="story-character-voice-history-list">\n            ' +
          list3.map(
            (value5, value6) =>
              '<div class="story-character-voice-history-item">\n              <button type="button" class="story-character-voice-history-play" data-story-character-voice-history-play="' +
              value6 +
              '" aria-label="试听历史音频 ' +
              (value6 + 1) +
              '">' +
              run7(true) +
              '</button>\n              <span><strong>' +
              escapeHtml(value5.label) +
              '</strong><small>' +
              escapeHtml(value5.timeLabel) +
              '</small></span>\n              <button type="button" class="story-character-voice-history-restore" data-story-character-voice-history-restore="' +
              value6 +
              '">设为当前</button>\n            </div>',
          ).join('') +
          '\n          </div>\n        </div>\n      </div>'
        : '';
    return (
      '<div class="story-asset-detail-copy story-asset-detail-panel-face story-asset-detail-panel-face--voice story-character-voice-panel" data-story-character-voice-panel aria-hidden="' +
      !workflow.isActive +
      '" ' +
      (workflow.isActive ? '' : 'inert') +
      '>\n      <div class="story-character-voice-navigation">\n        <button type="button" class="story-character-voice-capsule story-character-voice-return-control is-active" data-story-action="close-character-voice" aria-label="返回图片参考">\n          <span class="story-character-voice-icon">' +
      run4() +
      '</span>\n          <span>图片参考</span>\n        </button>\n      </div>\n      <div class="story-character-voice-current ' +
      (audioUrl ? 'has-reference' : 'is-empty') +
      '">\n        ' +
      (audioUrl
        ? renderAudioPlaybackSurface({
            audioUrl: audioUrl.audioUrl || audioUrl.localPath,
            waveformUrl: audioUrl.waveformLocalPath || audioUrl.waveformUrl,
            className:
              'story-character-voice-audio-card has-reference ' +
              (workflow.isGenerating ? 'img-preview-loading' : ''),
            playLabel: '播放声音参考',
            pauseLabel: '暂停声音参考',
            disabled: workflow.isGenerating,
            ariaBusy: workflow.isGenerating,
            dataAttributes: {
              'data-story-character-voice-audio-surface': '',
              'data-story-character-voice-drop': '',
            },
            trailingHtml: workflow.isGenerating ? renderLoadingOverlay({ compact: true }) : '',
          })
        : '') +
      '\n        ' +
      value3 +
      '\n        ' +
      (audioUrl || list3.length
        ? '<div class="story-character-voice-current-actions ' +
          (workflow.isGenerating ? 'is-generating' : '') +
          '">\n          ' +
          (audioUrl
            ? '<button type="button" class="story-character-voice-upload-button" data-story-action="upload-character-voice" aria-label="上传替换声音参考" ' +
              (workflow.isGenerating ? 'disabled' : '') +
              '>' +
              renderUploadIcon() +
              '</button>\n          <button type="button" class="story-character-voice-remove" data-story-action="remove-character-voice" aria-label="移除声音参考" ' +
              (workflow.isGenerating ? 'disabled' : '') +
              '>' +
              renderDeleteIcon() +
              '</button>'
            : '') +
          '\n          ' +
          value4 +
          '\n        </div>'
        : '') +
      '\n      </div>\n      <div class="story-character-voice-fields">\n        <label>\n          <span>试听台词 <small>优先合并角色对白，生成结果最多 5 秒</small></span>\n          <textarea data-story-character-voice-sample maxlength="' +
      Math.max(1, Number(workflow.sampleMaxCharacters) || 1) +
      '">' +
      escapeHtml(workflow.sampleText || '') +
      '</textarea>\n        </label>\n        <label>\n          <span>声音设定 <small>用于描述音色、年龄、情绪和说话方式</small></span>\n          <textarea data-story-character-voice-description maxlength="600">' +
      escapeHtml(workflow.voiceDescription || '') +
      '</textarea>\n        </label>\n      </div>\n      ' +
      (workflow.error
        ? '<p class="story-character-voice-error" role="alert">' + escapeHtml(workflow.error) + '</p>'
        : '') +
      '\n      <div class="story-character-voice-generation-bar story-asset-generation-bar prompt-panel-footer">\n        <footer class="story-character-voice-model-footer ' +
      (workflow.isGenerating ? 'is-generating' : '') +
      '" data-story-character-voice-model-footer>\n          ' +
      renderVoiceFooter2 +
      '\n        </footer>\n        ' +
      renderRequestDebugButton('data-story-action="debug-character-voice"') +
      '<button type="button" class="story-asset-generate-button story-main-action-button" data-story-action="generate-character-voice" ' +
      (workflow.isGenerating ? 'disabled' : '') +
      ' aria-busy="' +
      Boolean(workflow.isGenerating) +
      '">' +
      (workflow.isGenerating ? renderStoryGenerationSpinner({ button: true }) : '') +
      '<span>' +
      (workflow.isGenerating ? '生成中' : audioUrl ? '重新生成声音' : '生成声音') +
      '</span></button>\n      </div>\n  </div>'
    );
  }
  function run20(canRename2 = {}) {
    if (canRename2.empty)
      return (
        '<aside class="story-asset-detail story-empty-panel">\n      <strong>暂无可用素材</strong>\n      ' +
        (canRename2.showEmptyDescription
          ? '<p>' + escapeHtml(canRename2.emptyDescription) + '</p>'
          : '') +
        '\n    </aside>'
      );
    const id = canRename2.asset || {},
      imageUrl4 = canRename2.appearance || {},
      value7 = Math.max(32, Math.min(0x44, Number(canRename2.detailSplitRatio) || 50)),
      value8 =
        '<div class="story-asset-preview-caption">\n      <div class="story-asset-caption-heading">\n        <span class="story-asset-caption-title">' +
        run(id, { canRename: canRename2.canRename }) +
        run10({ ...canRename2.voicePlayer, id: id.id, name: id.name }) +
        '</span>\n        <span class="story-asset-caption-tags">\n          ' +
        (canRename2.showBaseAppearanceControl
          ? '<button type="button" class="story-base-appearance-button ' +
            (canRename2.isBaseAppearance ? 'is-active' : '') +
            ' ' +
            (canRename2.isBaseAppearanceSelectionDisabled ? 'is-disabled' : '') +
            '" ' +
            (canRename2.hasMultipleAppearances ? 'data-story-action="set-base-appearance"' : 'disabled') +
            ' aria-pressed="' +
            Boolean(canRename2.isBaseAppearance) +
            '" aria-disabled="' +
            !canRename2.canSetBaseAppearance +
            '" title="会以基础形象作为参考，生成角色的其他形象">' +
            (canRename2.isBaseAppearance ? '基础形象' : '设为基础形象') +
            '</button>'
          : '') +
        '\n          ' +
        (canRename2.showStyleReference ? run5(canRename2.styleReference) : '') +
        '\n          ' +
        run9(canRename2.voiceCapsule) +
        '\n        </span>\n      </div>\n      <span data-story-asset-caption-meta>' +
        escapeHtml(canRename2.captionMeta) +
        '</span>\n    </div>';
    return (
      '<aside class="story-asset-detail story-workspace-asset-detail-layout ' +
      escapeHtml(canRename2.motionClass || '') +
      '" data-story-asset-detail-layout style="--story-asset-detail-top:' +
      value7 +
      '%;">\n    <div class="story-asset-preview-wrap' +
      (canRename2.previewActions?.isDeleteAppearanceConfirming ? ' is-delete-confirming' : '') +
      '" data-story-appearance-wheel="' +
      Boolean(canRename2.hasMultipleAppearances) +
      '" ' +
      (canRename2.hasMultipleAppearances
        ? 'tabindex="0" aria-label="滚动鼠标滚轮或按左右方向键切换形象"'
        : '') +
      '>\n      <div class="story-asset-preview-slide ' +
      (canRename2.isGeneratingAppearance ? 'img-preview-loading' : '') +
      '" aria-busy="' +
      Boolean(canRename2.isGeneratingAppearance) +
      '">\n        ' +
      renderImage({
        imageUrl: imageUrl4.imageUrl,
        alt: id.name + ' · ' + (imageUrl4.name || '形象'),
        className: 'story-asset-preview',
      }) +
      '\n        ' +
      (canRename2.isGeneratingAppearance ? renderLoadingOverlay() : '') +
      '\n      </div>\n      ' +
      run18(canRename2.previewActions) +
      '\n      ' +
      (canRename2.hasMultipleAppearances ? '' + run3('previous') + run3('next') : '') +
      '\n    </div>\n    <div class="story-asset-detail-splitter panel-resize-handle panel-resize-handle--horizontal panel-resize-handle--transient" data-story-asset-detail-splitter role="separator" aria-orientation="horizontal" aria-label="调整形象预览与提示词区域高度" aria-valuemin="32" aria-valuemax="68" aria-valuenow="' +
      Math.round(value7) +
      '" tabindex="0"></div>\n    <div class="story-asset-detail-panel-stage ' +
      (canRename2.panel?.isVoice ? 'is-voice' : 'is-image') +
      ' ' +
      (canRename2.panel?.isAnimating ? 'is-animating' : 'is-settled') +
      '" data-story-asset-detail-panel-stage>\n      <div class="story-asset-detail-panel-cube ' +
      escapeHtml(canRename2.panel?.motionClass || '') +
      '">\n        <div class="story-asset-detail-copy story-asset-detail-panel-face story-asset-detail-panel-face--image" aria-hidden="' +
      Boolean(canRename2.panel?.isVoice) +
      '" ' +
      (canRename2.panel?.isVoice ? 'inert' : '') +
      '>\n          ' +
      value8 +
      '\n          <div class="story-asset-prompt-field">\n            <div class="story-asset-prompt-editor" data-story-asset-prompt data-story-asset-prompt-asset-id="' +
      escapeHtml(id.id) +
      '" data-story-asset-prompt-appearance-id="' +
      escapeHtml(imageUrl4.id) +
      '" contenteditable="' +
      (id.isLibraryAsset || canRename2.readOnly ? 'false' : 'true') +
      '" role="textbox" aria-multiline="true" aria-label="形象提示词" spellcheck="false">' +
      renderPromptMentions(
        id.isLibraryAsset || canRename2.readOnly
          ? id.description || imageUrl4.prompt || ''
          : imageUrl4.prompt || '',
        imageUrl4,
      ) +
      '</div>\n          </div>\n          ' +
      (id.isLibraryAsset || canRename2.readOnly
        ? ''
        : '<div class="story-asset-generation-bar prompt-panel-footer">\n            ' +
          renderImageModelSelector({
            ...canRename2.imageModel,
            showSchemaControls: true,
            className: 'story-asset-image-model-selector',
          }) +
          '\n            <div class="story-asset-generation-actions">\n              ' +
          run6(canRename2.preset) +
          '\n              ' +
          run13(canRename2.promptControl) +
          '\n            </div>\n          </div>') +
      '\n        </div>\n        ' +
      run19(canRename2.voicePanel) +
      '\n      </div>\n    </div>\n  </aside>'
    );
  }
  function renderAssetControls(options3 = {}) {
    if (options3.kind === 'batch-generation') return run12(options3.control);
    if (options3.kind === 'prompt-generation') return run13(options3.control);
    if (options3.kind === 'preset') return run6(options3.control);
    if (options3.kind === 'library-add') return primaryActionHtml2(options3.control);
    if (options3.kind === 'library-selection') return run17(options3.control);
    return '';
  }
  function renderAssetSurface(options4 = {}) {
    if (options4.kind === 'card') return run2(options4.card);
    if (options4.kind === 'detail') return run20(options4.detail);
    if (options4.kind === 'appearance-arrow') return run3(options4.direction);
    if (options4.kind === 'preview-actions') return run18(options4.actions);
    if (options4.kind === 'reference-input') return run5(options4.reference);
    if (options4.kind === 'voice-capsule') return run9(options4.voiceCapsule);
    if (options4.kind === 'voice-panel') return run19(options4.voicePanel);
    if (options4.kind === 'voice-player') return run10(options4.voicePlayer);
    if (options4.kind === 'voice-icon') return run7(options4.hasVoice === true);
    return '';
  }
  return Object.freeze({
    renderAssetControls: renderAssetControls,
    renderAssetSurface: renderAssetSurface,
  });
}
