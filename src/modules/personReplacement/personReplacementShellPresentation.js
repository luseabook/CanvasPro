import { localPathToUrl } from '../../utils/localMediaPath.js';
import {
  getWorkspaceProjectHomeEntries,
  renderWorkspaceProjectCard,
  renderWorkspaceProjectSortControl,
} from '../workspaceProjectHome.js';
import { SMART_CLIP_FPS_OPTIONS } from '../../services/smartClipJobService.js';
import { t } from '../../i18n/index.js';
import { getPersonReplacementCharacterBaseImageRef } from './personReplacementProject.js';
import {
  getPersonReplacementProjectTaskSummary,
  isPersonReplacementSourceProcessing,
} from './personReplacementProjectSession.js';
import {
  PERSON_REPLACEMENT_STEPS,
  getPersonReplacementStepCompletion,
  getPersonReplacementStepGate,
} from './personReplacementWorkflow.js';
import { REPLACEMENT_STUDIO_NAME } from './replacementStudioTerminology.js';
import { reconcileElementTree } from './personReplacementShotSelectionRendering.js';
function escapeHtml(_0x36216c) {
  return String(_0x36216c ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
}
function normalizeText(_0x4bdae3, _0x49cd3c = '') {
  const _0x46de86 = String(_0x4bdae3 ?? '')['trim']();
  return _0x46de86 || _0x49cd3c;
}
function normalizeMediaUrl(_0x10e2c2) {
  const _0x5a80ce = normalizeText(_0x10e2c2);
  return _0x5a80ce ? localPathToUrl(_0x5a80ce) || _0x5a80ce : '';
}
function clamp(_0x2f79a2, _0x5b5d87, _0x3d8dc3, _0x4442ad = _0x5b5d87) {
  const _0x4adb73 = Number(_0x2f79a2);
  if (!Number['isFinite'](_0x4adb73)) return _0x4442ad;
  return Math['max'](_0x5b5d87, Math['min'](_0x3d8dc3, _0x4adb73));
}
function renderVideoIcon() {
  return '<svg class="person-replacement-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="14" height="14" rx="3"/><path d="m17 10 4-2v8l-4-2"/></svg>';
}
function smartClipPanelText(_0x22158b, _0x21d98e = {}) {
  return t('videoClip.smartPanel.' + _0x22158b, _0x21d98e);
}
function renderSmartClipSettingLabel(_0x3c1a1a, _0x3e1ed4) {
  return (
    '<span class="person-replacement-smart-clip-setting-label">' +
    escapeHtml(_0x3c1a1a) +
    '<span class="rh-tip" data-tooltip="' +
    escapeHtml(_0x3e1ed4) +
    '\x22\x20aria-label=\x22' +
    escapeHtml(_0x3e1ed4) +
    '">!</span></span>'
  );
}
function renderSmartClipModeOptions(_0xc03ba7) {
  const _0x251215 = [
    ['stable', smartClipPanelText('modeStable')],
    ['balanced', smartClipPanelText('modeBalanced')],
    ['sensitive', smartClipPanelText('modeSensitive')],
  ];
  return _0x251215['map'](
    ([_0x42b502, _0x2e93bb]) =>
      '<button type="button" class="person-replacement-smart-clip-option ' +
      (_0xc03ba7 === _0x42b502 ? 'is-active' : '') +
      '" data-person-replacement-action="set-smart-clip-mode" data-smart-clip-mode="' +
      _0x42b502 +
      '" aria-pressed="' +
      (_0xc03ba7 === _0x42b502) +
      '\x22>' +
      escapeHtml(_0x2e93bb) +
      '</button>',
  )['join']('');
}
function renderSmartClipSettingsPanel(_0x5e5ce1) {
  const _0x436b67 = _0x5e5ce1['settings']['smartClipMode'],
    _0x963a71 = _0x5e5ce1['settings']['smartClipFps'];
  return (
    '<div class="person-replacement-smart-clip-settings-panel" role="dialog" aria-label="' +
    escapeHtml(smartClipPanelText('title')) +
    '">\n    <strong class="person-replacement-smart-clip-settings-title">' +
    escapeHtml(smartClipPanelText('title')) +
    '</strong>\n    <div class="person-replacement-smart-clip-setting-row">\n      ' +
    renderSmartClipSettingLabel(smartClipPanelText('mode'), smartClipPanelText('modeTip')) +
    '\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22person-replacement-smart-clip-option-group\x22\x20role=\x22group\x22\x20aria-label=\x22' +
    escapeHtml(smartClipPanelText('mode')) +
    '">\n        ' +
    renderSmartClipModeOptions(_0x436b67) +
    '\n      </div>\n    </div>\n    <div class="person-replacement-smart-clip-setting-row">\n      ' +
    renderSmartClipSettingLabel(smartClipPanelText('fps'), smartClipPanelText('fpsTip')) +
    '\n      <div class="person-replacement-smart-clip-option-group" role="group" aria-label="' +
    escapeHtml(smartClipPanelText('fps')) +
    '">\n        ' +
    SMART_CLIP_FPS_OPTIONS['map'](
      (_0x4b1901) =>
        '<button\x20type=\x22button\x22\x20class=\x22person-replacement-smart-clip-option\x20person-replacement-smart-clip-fps-option\x20' +
        (_0x963a71 === _0x4b1901 ? 'is-active' : '') +
        '\x22\x20data-person-replacement-action=\x22set-smart-clip-fps\x22\x20data-smart-clip-fps=\x22' +
        _0x4b1901 +
        '\x22\x20aria-pressed=\x22' +
        (_0x963a71 === _0x4b1901) +
        '\x22>' +
        escapeHtml(smartClipPanelText('fpsValue', { fps: _0x4b1901 })) +
        '</button>',
    )['join']('') +
    '\n      </div>\n    </div>\n    <p class="person-replacement-smart-clip-settings-hint">' +
    escapeHtml(smartClipPanelText('hintDefault')) +
    '</p>\x0a\x20\x20</div>'
  );
}
function renderSmartClipSettings(_0x27a159) {
  const _0x514e75 = _0x27a159['workspace']['smartClipSettingsOpen'] === !![];
  return (
    '<div class="person-replacement-smart-clip-settings" data-person-replacement-smart-clip-settings>\n    <button type="button" class="story-secondary-button person-replacement-settings-trigger ' +
    (_0x514e75 ? 'is-active' : '') +
    '" data-person-replacement-action="toggle-smart-clip-settings" aria-haspopup="dialog" aria-expanded="' +
    _0x514e75 +
    '">设置</button>\n    ' +
    (_0x514e75 ? renderSmartClipSettingsPanel(_0x27a159) : '') +
    '\n  </div>'
  );
}
function renderStepNavigation(_0x279127) {
  const _0x2065c3 = getPersonReplacementStepCompletion(_0x279127);
  return (
    '<nav class="story-step-navigation person-replacement-story-steps" data-active-step="' +
    _0x279127['workspace']['step'] +
    '" aria-label="人物替换流程">\n    ' +
    PERSON_REPLACEMENT_STEPS['map']((_0x3bdcf9) => {
      const _0x4f8557 = getPersonReplacementStepGate(_0x279127, _0x3bdcf9['id'], _0x2065c3),
        _0x56059d = [
          'story-step',
          _0x279127['workspace']['step'] === _0x3bdcf9['id'] ? 'is-active' : '',
          _0x4f8557['allowed'] ? '' : 'is-locked',
        ]
          ['filter'](Boolean)
          ['join']('\x20');
      return (
        '<button type="button" class="' +
        _0x56059d +
        '" data-person-replacement-action="select-step" data-person-replacement-step="' +
        _0x3bdcf9['id'] +
        '\x22\x20aria-current=\x22' +
        (_0x279127['workspace']['step'] === _0x3bdcf9['id'] ? 'step' : 'false') +
        '" aria-keyshortcuts="' +
        _0x3bdcf9['id'] +
        '" aria-disabled="' +
        !_0x4f8557['allowed'] +
        '\x22' +
        (_0x4f8557['allowed'] ? '' : '\x20title=\x22' + escapeHtml(_0x4f8557['message']) + '\x22') +
        '><span>' +
        _0x3bdcf9['id'] +
        '</span>' +
        escapeHtml(_0x3bdcf9['label']) +
        '</button>'
      );
    })['join']('') +
    '\x0a\x20\x20</nav>'
  );
}
function getStepGuidance(_0x45599f, _0x1f9e9a) {
  const _0x269c47 = Math['trunc'](clamp(_0x45599f['workspace']?.['step'], 0x1, 0x5, 0x1)),
    _0x2837b6 = getPersonReplacementStepCompletion(_0x45599f),
    _0x500253 = (Array['isArray'](_0x45599f['characters']) ? _0x45599f['characters'] : [])['filter'](
      (_0x40ed65) => getPersonReplacementCharacterBaseImageRef(_0x40ed65),
    )['length'],
    _0x1953f6 = (Array['isArray'](_0x45599f['scenes']) ? _0x45599f['scenes'] : [])['filter']((_0x4bea74) =>
      getPersonReplacementCharacterBaseImageRef(_0x4bea74),
    )['length'],
    _0xbdb680 = _0x500253 + _0x1953f6,
    _0x56e9de = Array['isArray'](_0x45599f['shots']) ? _0x45599f['shots'] : [],
    _0x3556e5 = _0x56e9de['filter']((_0xfd3675) => normalizeText(_0xfd3675?.['resultVideoRef']))['length'],
    _0x416e97 = Math['max'](0x0, Math['trunc'](Number(_0x1f9e9a(_0x45599f)) || 0x0)),
    _0x450c92 = Boolean(normalizeText(_0x45599f['audio']?.['replacementAudioRef'])),
    _0x52f658 = Boolean(
      _0x45599f['output']?.['originalMasterRef'] &&
      (_0x45599f['output']?.['finalVideoRef'] || _0x45599f['output']?.['visualMasterRef']),
    ),
    _0x33c3b5 = _0x45599f['output']?.['composeStatus'] === 'succeeded' && _0x52f658,
    _0x12e573 = _0x52f658 && !_0x33c3b5;
  if (_0x269c47 === 0x1)
    return _0x2837b6['assetSettingsComplete']
      ? { title: '替换素材已应用', detail: '已应用 ' + _0xbdb680 + '\x20个替换素材，可以继续进入图像替换' }
      : { title: '请添加人物或场景素材', detail: '至少添加 1 个人物或场景素材，才能进入图像替换' };
  if (_0x269c47 === 0x2)
    return _0x2837b6['imageReplacementComplete']
      ? { title: '图像替换输入已应用', detail: '可以继续生成替换图，或进入视频替换' }
      : { title: '请绑定替换人物或场景', detail: '可先进入视频替换；添加人物或场景绑定后才能继续声音克隆' };
  if (_0x269c47 === 0x3) {
    if (!_0x2837b6['imageReplacementComplete'])
      return { title: '请绑定替换人物或场景', detail: '至少绑定 1 个人物或场景，才能进入声音克隆' };
    if (_0x3556e5 > 0x0)
      return {
        title: '替换视频已生成',
        detail: '已生成 ' + _0x3556e5 + '/' + _0x56e9de['length'] + ' 个片段，可以继续进入声音克隆',
      };
    return { title: '视频替换已就绪', detail: '可以生成替换视频，也可以继续进入声音克隆' };
  }
  if (_0x269c47 === 0x4) {
    if (_0x450c92) return { title: '替换音轨已应用', detail: '可以继续进入合成视频，检查并生成最终视频' };
    if (_0x416e97 > 0x0)
      return {
        title: '声音参考已应用',
        detail: '已应用 ' + _0x416e97 + ' 个声音参考，可以继续克隆声音或进入合成视频',
      };
    return { title: '可添加声音参考', detail: '上传人物声音参考后可克隆音轨，也可以直接进入合成视频' };
  }
  if (_0x12e573)
    return { title: '旧合成视频仍可查看', detail: '图像或片段已更新，重新生成对应替换视频后再合成' };
  if (_0x33c3b5) return { title: '完整画面已就绪', detail: '可以切换原声或替换声预览，导出时再封装当前音轨' };
  if (_0x3556e5 > 0x0)
    return {
      title: '替换片段可以合成',
      detail: '已有 ' + _0x3556e5 + '/' + _0x56e9de['length'] + ' 个片段可用于合成',
    };
  return { title: '请先生成替换视频', detail: '返回视频替换生成至少一个片段后，即可创建合成预览' };
}
function getCurrentCanvasSyncMenuCopy(_0xa8a380) {
  const _0x27783f = Math['trunc'](Number(_0xa8a380) || 0x1),
    _0x52eeb2 = {
      0x1: ['同步素材设定到画布', '同步当前人物素材与分组'],
      0x2: ['同步图像替换到画布', '同步当前关键帧、素材、提示词与替换结果图'],
      0x3: ['同步视频替换到画布', '同步当前原视频、替换图与替换视频'],
      0x4: ['同步声音克隆到画布', '同步当前原音频、参考音频与替换音频'],
      0x5: ['同步所有片段到画布', '按镜头顺序同步已有的替换视频片段'],
    },
    [_0x843620, _0x18751e] = _0x52eeb2[_0x27783f] || _0x52eeb2[0x5];
  return { label: _0x843620, detail: _0x18751e };
}
function renderProjectToolbarActions(_0xa71934, _0x4f85c9 = {}) {
  const _0x24879b = _0xa71934['workspace']['step'] === 0x5,
    _0x50389b = getCurrentCanvasSyncMenuCopy(_0xa71934['workspace']['step']),
    _0x3036c1 = _0x4f85c9['canvasSyncPending'] === !![],
    _0x22c6f0 = _0x4f85c9['exportOutputPending'] === !![],
    _0x5ef839 =
      '<div class="story-canvas-sync-menu-wrap' +
      (_0x3036c1 ? '\x20is-loading' : '') +
      '" data-person-replacement-output-menu="canvas" data-person-replacement-canvas-sync-pending="' +
      _0x3036c1 +
      '">\n    <button type="button" class="story-workbench-action-button story-canvas-sync-trigger story-menu-trigger' +
      (_0x3036c1 ? ' is-loading' : '') +
      '\x22\x20data-person-replacement-action=\x22toggle-output-menu\x22\x20data-person-replacement-output-menu-trigger=\x22canvas\x22\x20aria-haspopup=\x22menu\x22\x20aria-expanded=\x22false\x22\x20aria-busy=\x22' +
      _0x3036c1 +
      '\x22' +
      (_0x3036c1 ? ' disabled' : '') +
      '>\n      ' +
      (_0x3036c1
        ? '<span class="storyboard-script-loading-spinner person-replacement-canvas-sync-spinner" aria-hidden="true"></span>'
        : '') +
      '<span>' +
      (_0x3036c1 ? '加入中…' : '加入画布') +
      '</span>' +
      (_0x3036c1 ? '' : '<span class="story-canvas-sync-chevron" aria-hidden="true"></span>') +
      '\n    </button>\n    <div class="story-canvas-sync-menu" role="menu" aria-label="同步人物替换项目到画布" aria-hidden="true">\n      <button type="button" class="story-canvas-sync-option" data-person-replacement-output-menu-item data-person-replacement-action="sync-all-clips-to-canvas" role="menuitem"' +
      (_0x3036c1 ? '\x20aria-disabled=\x22true\x22\x20disabled' : '') +
      '>\n        <strong>' +
      _0x50389b['label'] +
      '</strong><small>' +
      _0x50389b['detail'] +
      '</small>\n      </button>\n      <button type="button" class="story-canvas-sync-option" data-person-replacement-output-menu-item data-person-replacement-action="sync-project-to-canvas" role="menuitem"' +
      (_0x3036c1 ? '\x20aria-disabled=\x22true\x22\x20disabled' : '') +
      '>\n        <strong>同步整个项目到画布</strong><small>按当前进度同步素材、图像、视频、音频与合成节点</small>\n      </button>\n    </div>\n  </div>',
    _0x5adf95 = _0x24879b
      ? '<div class="story-canvas-sync-menu-wrap story-clip-export-menu-wrap' +
        (_0x22c6f0 ? ' is-loading' : '') +
        '" data-person-replacement-output-menu="export" data-person-replacement-export-pending="' +
        _0x22c6f0 +
        '">\n      <button type="button" class="story-workbench-action-button story-canvas-sync-trigger story-menu-trigger' +
        (_0x22c6f0 ? ' is-loading' : '') +
        '" data-person-replacement-action="toggle-output-menu" data-person-replacement-output-menu-trigger="export" aria-haspopup="menu" aria-expanded="false" aria-busy="' +
        _0x22c6f0 +
        '\x22' +
        (_0x22c6f0 ? ' disabled' : '') +
        '>\n        ' +
        (_0x22c6f0
          ? '<span\x20class=\x22storyboard-script-loading-spinner\x20person-replacement-export-spinner\x22\x20aria-hidden=\x22true\x22></span>'
          : '') +
        '<span>' +
        (_0x22c6f0 ? '导出中…' : '导出') +
        '</span>' +
        (_0x22c6f0 ? '' : '<span class="story-canvas-sync-chevron" aria-hidden="true"></span>') +
        '\n      </button>\n      <div class="story-canvas-sync-menu story-clip-export-menu" role="menu" aria-label="导出人物替换结果" aria-hidden="true">\n        <div class="person-replacement-export-menu-group" data-person-replacement-export-group>\n          <button type="button" class="story-canvas-sync-option person-replacement-export-menu-group-trigger" data-person-replacement-output-menu-item data-person-replacement-export-submenu-trigger="video" role="menuitem" aria-haspopup="menu" aria-expanded="false"' +
        (_0x22c6f0 ? '\x20aria-disabled=\x22true\x22\x20disabled' : '') +
        '>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span><strong>导出视频</strong><small>导出成片或全部替换素材</small></span><i\x20aria-hidden=\x22true\x22></i>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22person-replacement-export-submenu\x22\x20data-person-replacement-export-submenu=\x22video\x22\x20role=\x22menu\x22\x20aria-label=\x22导出视频\x22\x20aria-hidden=\x22true\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-canvas-sync-option\x22\x20data-person-replacement-action=\x22export-final-video\x22\x20role=\x22menuitem\x22' +
        (_0x22c6f0 ? ' aria-disabled="true" disabled' : '') +
        '>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<strong>完整视频（当前音轨）</strong><small>将完整替换画面与下方选择的音轨封装后导出</small>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-canvas-sync-option\x22\x20data-person-replacement-action=\x22export-all-clips-and-images\x22\x20role=\x22menuitem\x22' +
        (_0x22c6f0 ? ' aria-disabled="true" disabled' : '') +
        '>\n              <strong>所有替换结果</strong><small>导出替换视频、替换音频及对应替换图</small>\n            </button>\n          </div>\n        </div>\n        <div class="person-replacement-export-menu-group" data-person-replacement-export-group>\n          <button type="button" class="story-canvas-sync-option person-replacement-export-menu-group-trigger" data-person-replacement-output-menu-item data-person-replacement-export-submenu-trigger="project" role="menuitem" aria-haspopup="menu" aria-expanded="false"' +
        (_0x22c6f0 ? ' aria-disabled="true" disabled' : '') +
        '>\n            <span><strong>导出项目</strong><small>导出到剪辑软件继续处理</small></span><i aria-hidden="true"></i>\n          </button>\n          <div class="person-replacement-export-submenu" data-person-replacement-export-submenu="project" role="menu" aria-label="导出项目" aria-hidden="true">\n            <button type="button" class="story-canvas-sync-option" data-person-replacement-action="export-premiere-xml" role="menuitem"' +
        (_0x22c6f0 ? ' aria-disabled="true" disabled' : '') +
        '>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<strong>Premiere\x20XML</strong><small>原片与替换片段、对应音频分四轨，包含素材</small>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-canvas-sync-option\x22\x20data-person-replacement-action=\x22export-jianying-draft\x22\x20role=\x22menuitem\x22' +
        (_0x22c6f0 ? '\x20aria-disabled=\x22true\x22\x20disabled' : '') +
        '>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<strong>剪映草稿</strong><small>保留完整替换片段和轨道空位，包含素材</small>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20</div>'
      : '';
  return (
    '<div class="person-replacement-toolbar-actions' +
    (_0x24879b
      ? '\x20person-replacement-preview-actions\x20person-replacement-preview-actions--toolbar'
      : '') +
    '\x22>' +
    _0x5ef839 +
    _0x5adf95 +
    '</div>'
  );
}
function renderHeader(_0x55aaa2, _0x2ac243 = {}) {
  return (
    '<header class="story-workspace-toolbar"' +
    (_0x2ac243['canvasSyncPending'] === !![] ? ' aria-hidden="true" inert' : '') +
    '>\n    <div class="story-project-toolbar person-replacement-story-toolbar">\n      <button type="button" class="story-toolbar-back" data-person-replacement-action="back-home" aria-label="返回人物替换项目"><span class="story-toolbar-back-icon" aria-hidden="true"></span><span>人物替换项目</span></button>\n      ' +
    renderStepNavigation(_0x55aaa2) +
    '\n      <div class="person-replacement-toolbar-side">' +
    renderProjectToolbarActions(_0x55aaa2, _0x2ac243) +
    '</div>\n    </div>\n  </header>'
  );
}
function renderSourceQueue(_0x4bd0e7) {
  if (!_0x4bd0e7['sources']['length']) return '';
  return (
    '<div class="person-replacement-import-queue workspace-video-import-grid">\n    ' +
    _0x4bd0e7['sources']
      ['map']((_0x2c0d8c, _0x3c43b3) => {
        const _0x62099c =
            _0x2c0d8c['processingStatus'] === 'uploading'
              ? '正在上传'
              : _0x2c0d8c['processingStatus'] === 'failed'
                ? '上传失败'
                : '已加入',
          _0x4055e1 = normalizeMediaUrl(_0x2c0d8c['thumbnailRef']),
          _0x3042ff = normalizeText(_0x4bd0e7['sourcePreviewRefs']?.[_0x2c0d8c['id']]),
          _0x1e3800 = normalizeMediaUrl(_0x3042ff || _0x2c0d8c['videoRef']),
          _0xa3a656 = _0x2c0d8c['fileName'] || '视频 ' + (_0x3c43b3 + 0x1);
        return (
          '<article\x20class=\x22person-replacement-import-item\x20workspace-video-import-item\x22\x20data-person-replacement-import-source=\x22' +
          escapeHtml(_0x2c0d8c['id']) +
          '">\n        <div class="person-replacement-import-thumbnail workspace-video-import-thumbnail">\n          ' +
          (_0x4055e1
            ? '<img src="' +
              escapeHtml(_0x4055e1) +
              '" alt="' +
              escapeHtml(_0xa3a656) +
              ' 视频封面" draggable="false">'
            : _0x1e3800
              ? '<video src="' +
                escapeHtml(_0x1e3800) +
                '" preload="' +
                (_0x3042ff ? 'auto' : 'metadata') +
                '" muted playsinline aria-label="' +
                escapeHtml(_0xa3a656) +
                ' 视频缩略图" draggable="false"></video>'
              : '<span class="workspace-video-import-placeholder">' + renderVideoIcon() + '</span>') +
          '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22person-replacement-import-status\x20workspace-video-import-status\x22>' +
          escapeHtml(_0x62099c) +
          '</span>\n          <button type="button" class="person-replacement-import-remove workspace-video-import-remove" data-person-replacement-action="remove-source" data-source-id="' +
          escapeHtml(_0x2c0d8c['id']) +
          '" aria-label="删除 ' +
          escapeHtml(_0xa3a656) +
          '">×</button>\n        </div>\n        <div class="person-replacement-import-copy workspace-video-import-copy"><strong>' +
          escapeHtml(_0xa3a656) +
          '</strong></div>\n      </article>'
        );
      })
      ['join']('') +
    '\x0a\x20\x20</div>'
  );
}
function normalizeProjectTimestamp(_0x1e0f42) {
  const _0x1a6472 = Number(_0x1e0f42);
  if (Number['isFinite'](_0x1a6472) && _0x1a6472 > 0x0) return _0x1a6472;
  const _0x1e71c9 = Date['parse'](_0x1e0f42 || '');
  return Number['isFinite'](_0x1e71c9) ? _0x1e71c9 : 0x0;
}
function buildPersonProjectHomeEntry(_0x3b634c = {}) {
  const _0x1f62c5 = normalizeText(_0x3b634c['id']),
    _0x203dd9 = Array['isArray'](_0x3b634c['shots']) ? _0x3b634c['shots'] : [];
  return {
    id: _0x1f62c5,
    title: normalizeText(_0x3b634c['title'], '未命名人物替换项目'),
    createdAt: normalizeProjectTimestamp(_0x3b634c['createdAt']),
    updatedAt: normalizeProjectTimestamp(_0x3b634c['updatedAt']),
    archivedAt: normalizeProjectTimestamp(_0x3b634c['archivedAt']),
    data: {
      project: { id: _0x1f62c5, title: normalizeText(_0x3b634c['title'], '未命名人物替换项目') },
      episodes: _0x203dd9,
    },
    personReplacementProject: _0x3b634c,
  };
}
function getPersonProjectCoverImageUrls(_0x41a324 = {}) {
  return (Array['isArray'](_0x41a324['shots']) ? _0x41a324['shots'] : [])
    ['flatMap']((_0x703110) => [_0x703110?.['replacementImageRef'], _0x703110?.['keyframeRef']])
    ['map'](normalizeMediaUrl)
    ['filter'](
      (_0x153c5b, _0x585598, _0x43c212) => _0x153c5b && _0x43c212['indexOf'](_0x153c5b) === _0x585598,
    )
    ['slice'](0x0, 0x3);
}
function getHomeProjectPresentation(_0x5e6ac8) {
  const _0x3b29db = Array['isArray'](_0x5e6ac8['libraryProjects']) ? _0x5e6ac8['libraryProjects'] : [],
    _0x2cb05c = _0x3b29db['map'](buildPersonProjectHomeEntry)['filter']((_0x34cd58) => _0x34cd58['id']),
    _0xb8ee32 = _0x5e6ac8['workspace']['showArchivedProjects'] === !![],
    _0x8e76fc = _0x2cb05c['filter']((_0x3a1a75) => _0x3a1a75['archivedAt'] > 0x0)['length'],
    _0x56fa71 = getWorkspaceProjectHomeEntries(_0x2cb05c, {
      query: _0x5e6ac8['workspace']['projectSearchQuery'],
      sortOrder: _0x5e6ac8['workspace']['projectSortOrder'],
      showArchived: _0xb8ee32,
    });
  return {
    archivedProjectCount: _0x8e76fc,
    projectEntries: _0x2cb05c,
    showArchivedProjects: _0xb8ee32,
    visibleProjects: _0x56fa71,
  };
}
function renderHomeProjectResults(_0x5082e1, _0x465ed3 = getHomeProjectPresentation(_0x5082e1)) {
  const {
    projectEntries: _0x2a15b2,
    showArchivedProjects: _0x5d8027,
    visibleProjects: _0x327b0e,
  } = _0x465ed3;
  return _0x2a15b2['length']
    ? '<div class="story-project-grid">\n      ' +
        _0x327b0e['map']((_0x30c819) =>
          renderWorkspaceProjectCard(_0x30c819, {
            isDeleteConfirming: _0x5082e1['workspace']['pendingDeleteProjectId'] === _0x30c819['id'],
            isMenuOpen: _0x5082e1['workspace']['openProjectMenuId'] === _0x30c819['id'],
            fallbackTitle: '未命名人物替换项目',
            itemCount: _0x30c819['personReplacementProject']?.['shots']?.['length'] || 0x0,
            itemLabel: '个片段',
            coverImageUrls: getPersonProjectCoverImageUrls(_0x30c819['personReplacementProject']),
            emptyCoverLabel: '人物替换项目',
            coverAltPrefix: '人物替换项目封面',
            taskSummary: getPersonReplacementProjectTaskSummary(_0x30c819['personReplacementProject']),
          }),
        )['join']('') +
        '\n      ' +
        (_0x327b0e['length']
          ? ''
          : '<div class="story-project-filter-empty"><strong>' +
            (_0x5d8027 ? '没有匹配的归档项目' : '没有匹配的人物替换项目') +
            '</strong><span>可以尝试其他搜索词，或清空搜索条件。</span></div>') +
        '\n      ' +
        (_0x5d8027
          ? ''
          : '<button type="button" class="story-project-create-tile" data-person-replacement-action="choose-source-videos" aria-label="新建人物替换项目"><span aria-hidden="true">+</span><strong>新建人物替换项目</strong></button>') +
        '\n    </div>'
    : '<div\x20class=\x22story-project-empty\x22>\x0a\x20\x20\x20\x20\x20\x20<strong>还没有人物替换项目</strong>\x0a\x20\x20\x20\x20\x20\x20<span>加入视频并开始处理后，项目会保存在当前用户项目数据中。</span>\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-primary-button\x20story-project-empty-action\x22\x20data-person-replacement-action=\x22choose-source-videos\x22>创建第一个项目</button>\x0a\x20\x20\x20\x20</div>';
}
function renderHome(_0x496f23) {
  const _0x52c81d = getHomeProjectPresentation(_0x496f23),
    { archivedProjectCount: _0x31274f, showArchivedProjects: _0x1c9c96 } = _0x52c81d,
    _0x122f74 = isPersonReplacementSourceProcessing(_0x496f23),
    _0x1159d4 =
      !_0x122f74 && _0x496f23['sources']['some']((_0x32748b) => normalizeText(_0x32748b['videoRef'])),
    _0x1f8925 = _0x122f74 ? '' : renderSourceQueue(_0x496f23),
    _0x31a90c = _0x122f74 ? ' disabled' : '';
  return (
    '<main class="story-home-page" data-person-replacement-home-project="' +
    escapeHtml(_0x496f23['id']) +
    '">\n    <section class="story-home-hero">\n      <span class="story-eyebrow">SHUO Canvas · ' +
    REPLACEMENT_STUDIO_NAME +
    '</span>\n      <h1>完整替换视频中的人物与声音</h1>\n      <div class="story-home-composer">\n        <div class="story-home-composer-body">\n          <div class="story-home-composer-panel story-upload-drop workspace-video-import-panel person-replacement-video-drop ' +
    (_0x1f8925 ? 'has-sources' : '') +
    '" data-person-replacement-video-drop>\n            ' +
    (_0x1f8925 ||
      '<strong>导入原始视频</strong>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<p>可一次选择或拖入一个或多个视频，单个视频最大支持\x20300\x20MB。</p>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-upload-actions\x22><button\x20type=\x22button\x22\x20class=\x22story-secondary-button\x22\x20data-person-replacement-action=\x22choose-source-videos\x22' +
        _0x31a90c +
        '>选择视频</button></div>') +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-home-model-bar\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-home-model-controls\x20person-replacement-home-source-controls\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-secondary-button\x22\x20data-person-replacement-action=\x22choose-source-videos\x22' +
    _0x31a90c +
    '>加入视频</button>\n            <span class="person-replacement-home-flow-hint">处理时切分镜头并抽帧检测；跳过时保留整段视频并抽帧检测。</span>\n          </div>\n          <div class="person-replacement-home-process-actions">\n            <button type="button" class="story-secondary-button" data-person-replacement-action="process-sources" data-processing-mode="skip" ' +
    (_0x1159d4 ? '' : 'disabled') +
    '>跳过处理</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
    renderSmartClipSettings(_0x496f23) +
    '\n            <button type="button" class="story-primary-button story-home-generate" data-person-replacement-action="process-sources" data-processing-mode="cut" ' +
    (_0x1159d4 ? '' : 'disabled') +
    '><span>开始处理</span><span class="story-generate-arrow" aria-hidden="true">→</span></button>\n          </div>\n        </div>\n      </div>\n    </section>\n    <section class="story-projects-section">\n      <div class="story-section-heading">\n        <div><h2>' +
    (_0x1c9c96 ? '已归档项目' : '我的人物替换项目') +
    '</h2></div>\n        <div class="story-project-list-controls">\n          <button type="button" class="story-project-import-button" data-story-action="import-project" data-person-replacement-action="import-project">导入项目</button>\n          <label class="story-project-search"><span aria-hidden="true">⌕</span><input type="search" data-story-project-search value="' +
    escapeHtml(_0x496f23['workspace']['projectSearchQuery'] || '') +
    '" placeholder="搜索项目名称" autocomplete="off" aria-label="搜索人物替换项目"></label>\n          ' +
    renderWorkspaceProjectSortControl(_0x496f23['workspace']['projectSortOrder']) +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-project-archive-toggle\x20' +
    (_0x1c9c96 ? 'is-active' : '') +
    '" data-story-action="toggle-archived-projects" aria-pressed="' +
    _0x1c9c96 +
    '\x22>' +
    (_0x1c9c96 ? '返回项目' : '已归档 ' + _0x31274f) +
    '</button>\n        </div>\n      </div>\n      ' +
    renderHomeProjectResults(_0x496f23, _0x52c81d) +
    '\x0a\x20\x20\x20\x20</section>\x0a\x20\x20</main>'
  );
}
function syncHome(_0x224d2b, _0x1c6aaf) {
  const _0x55abc7 = _0x224d2b?.['querySelector']?.('[data-person-replacement-home-project]');
  if (
    _0x1c6aaf['workspace']['view'] !== 'home' ||
    !_0x55abc7 ||
    _0x55abc7['dataset']['personReplacementHomeProject'] !== String(_0x1c6aaf['id'])
  )
    return ![];
  const _0x501089 = _0x55abc7['ownerDocument']['createElement']('template');
  return (
    (_0x501089['innerHTML'] = renderHome(_0x1c6aaf)),
    reconcileElementTree(_0x55abc7, _0x501089['content']['firstElementChild'], { preserveChildNodes: !![] })
  );
}
function renderStepFooter(
  _0x263608,
  _0x3f7f7d,
  { nextLabel: nextLabel = '下一步', hidePrevious: hidePrevious = ![] } = {},
) {
  const _0x115e15 = getPersonReplacementStepGate(_0x263608, _0x263608['workspace']['step'] + 0x1),
    _0x30e2c3 = _0x263608['workspace']['step'] < PERSON_REPLACEMENT_STEPS['length'] && !_0x115e15['allowed'],
    _0x24f806 = isPersonReplacementSourceProcessing(_0x263608),
    _0x30cb66 = _0x30e2c3 || _0x24f806,
    _0x6785e3 = getStepGuidance(_0x263608, _0x3f7f7d);
  return (
    '<footer class="story-page-footer person-replacement-step-footer">\n    <div><strong data-person-replacement-guidance-role="footer-title">' +
    escapeHtml(_0x6785e3['title']) +
    '</strong><small\x20data-person-replacement-guidance-role=\x22footer-detail\x22>' +
    escapeHtml(_0x6785e3['detail']) +
    '</small></div>\n    <div class="story-page-footer-actions">\n      ' +
    (hidePrevious
      ? ''
      : '<button\x20type=\x22button\x22\x20class=\x22story-secondary-button\x20button-press-feedback\x22\x20data-person-replacement-action=\x22previous-step\x22><span>上一步</span></button>') +
    '\n      <button type="button" class="story-next-button' +
    (_0x24f806 ? '\x20is-processing' : _0x30e2c3 ? ' is-locked' : '') +
    '" data-person-replacement-action="next-step" aria-disabled="' +
    _0x30cb66 +
    '\x22\x20aria-busy=\x22' +
    _0x24f806 +
    '\x22' +
    (_0x30cb66
      ? ' title="' + escapeHtml(_0x24f806 ? '视频处理中，请稍候' : _0x115e15['message']) + '\x22'
      : '') +
    '><span>' +
    escapeHtml(nextLabel) +
    '</span><span class="story-next-arrow" data-person-replacement-next-indicator="arrow" aria-hidden="true"' +
    (_0x24f806 ? ' hidden' : '') +
    '>→</span><span class="storyboard-script-loading-spinner person-replacement-step-next-spinner" data-person-replacement-next-indicator="spinner" aria-hidden="true"' +
    (_0x24f806 ? '' : ' hidden') +
    '></span></button>\n    </div>\n  </footer>'
  );
}
function renderCanvasSyncLoadingOverlay(_0x43fa3a = {}) {
  if (_0x43fa3a['canvasSyncPending'] !== !![]) return '';
  return '<div class="person-replacement-canvas-sync-loading storyboard-script-loading-overlay" data-person-replacement-canvas-sync-loading role="status" aria-live="polite" aria-label="正在加入画布" tabindex="-1">\n    <span class="storyboard-script-loading-spinner person-replacement-canvas-sync-spinner person-replacement-canvas-sync-overlay-spinner" aria-hidden="true"></span>\n    <strong class="storyboard-script-loading-label">正在加入画布</strong>\n    <small>同步完成后将自动跳转到画布</small>\n  </div>';
}
function createProjectTaskStatusElement(
  _0x5673fb,
  _0x43ab8e,
  { className: _0x9dc02e, dataAttribute: _0x2374f8 } = {},
) {
  const _0x36baca = _0x5673fb?.['ownerDocument'];
  if (!_0x36baca?.['createElement'] || !_0x43ab8e?.['appendChild']) return null;
  const _0x515757 = _0x36baca['createElement']('span');
  return (
    (_0x515757['className'] = _0x9dc02e),
    _0x515757['setAttribute'](_0x2374f8, ''),
    _0x43ab8e['appendChild'](_0x515757),
    _0x515757
  );
}
function syncStatus(_0x2030f6, _0x4efa5f, _0xb1ec1d) {
  if (!_0x2030f6) return;
  const _0x350b62 = isPersonReplacementSourceProcessing(_0x4efa5f),
    _0x4757e2 = getStepGuidance(_0x4efa5f, _0xb1ec1d),
    _0x1345a = _0x2030f6['querySelector']?.('[data-person-replacement-guidance-role="footer-title"]'),
    _0x39359e = _0x2030f6['querySelector']?.('[data-person-replacement-guidance-role="footer-detail"]');
  if (_0x1345a) _0x1345a['textContent'] = _0x4757e2['title'];
  if (_0x39359e) _0x39359e['textContent'] = _0x4757e2['detail'];
  const _0x58f7b3 = _0x2030f6['querySelector']?.('[data-person-replacement-action="next-step"]');
  if (_0x58f7b3) {
    const _0x3ac66b = getPersonReplacementStepGate(_0x4efa5f, _0x4efa5f['workspace']['step'] + 0x1),
      _0x59b8e4 =
        _0x4efa5f['workspace']['step'] < PERSON_REPLACEMENT_STEPS['length'] && !_0x3ac66b['allowed'],
      _0x3b2b69 = _0x59b8e4 || _0x350b62;
    (_0x58f7b3['classList']?.['toggle']?.('is-locked', _0x59b8e4 && !_0x350b62),
      _0x58f7b3['classList']?.['toggle']?.('is-processing', _0x350b62),
      _0x58f7b3['setAttribute']?.('aria-disabled', String(_0x3b2b69)),
      _0x58f7b3['setAttribute']?.('aria-busy', String(_0x350b62)),
      _0x3b2b69
        ? _0x58f7b3['setAttribute']?.('title', _0x350b62 ? '视频处理中，请稍候' : _0x3ac66b['message'])
        : _0x58f7b3['removeAttribute']?.('title'));
  }
  const _0x52ef09 = _0x2030f6['querySelector']?.('[data-person-replacement-next-indicator=\x22arrow\x22]'),
    _0x1e8b81 = _0x2030f6['querySelector']?.('[data-person-replacement-next-indicator="spinner"]');
  if (_0x52ef09) _0x52ef09['hidden'] = _0x350b62;
  if (_0x1e8b81) _0x1e8b81['hidden'] = !_0x350b62;
  if (_0x4efa5f['workspace']['view'] !== 'home') return;
  const _0x361540 = Array['from'](_0x2030f6['querySelectorAll']?.('[data-workspace-open-project]') || [])[
    'find'
  ](
    (_0x2d3b2a) =>
      normalizeText(_0x2d3b2a?.['dataset']?.['workspaceOpenProject']) === normalizeText(_0x4efa5f['id']),
  );
  if (!_0x361540) return;
  let _0x42f1d3 = _0x361540['querySelector']?.('[data-workspace-project-status]'),
    _0x3d50f4 = _0x361540['querySelector']?.('[data-workspace-project-inline-status].has-task-error');
  const _0x5d1fd8 = getPersonReplacementProjectTaskSummary(_0x4efa5f),
    _0x5cb997 = _0x5d1fd8['activeCount'] > 0x0,
    _0xe4d75f = !_0x5cb997 && _0x5d1fd8['failedCount'] > 0x0;
  (_0x361540['classList']?.['toggle']?.('is-generating', _0x5cb997),
    _0x361540['classList']?.['toggle']?.('has-task-error', _0xe4d75f));
  if (_0x5cb997) {
    (_0x3d50f4?.['remove']?.(),
      (_0x42f1d3 ||= createProjectTaskStatusElement(_0x361540, _0x361540, {
        className: 'story-project-status is-generating',
        dataAttribute: 'data-workspace-project-status',
      })));
    if (!_0x42f1d3) return;
    (_0x42f1d3['classList']?.['add']?.('is-generating'),
      (_0x42f1d3['textContent'] = _0x5d1fd8['label']),
      _0x42f1d3['setAttribute']?.('role', 'status'),
      _0x42f1d3['setAttribute']?.('aria-live', 'polite'));
    return;
  }
  _0x42f1d3?.['remove']?.();
  if (!_0xe4d75f) {
    _0x3d50f4?.['remove']?.();
    return;
  }
  const _0x1d13a3 = _0x361540['querySelector']?.('.story-project-card-meta');
  _0x3d50f4 ||= createProjectTaskStatusElement(_0x361540, _0x1d13a3, {
    className: 'story-project-inline-status has-task-error',
    dataAttribute: 'data-workspace-project-inline-status',
  });
  if (!_0x3d50f4) return;
  ((_0x3d50f4['textContent'] = _0x5d1fd8['label']),
    _0x3d50f4['setAttribute']?.('role', 'status'),
    _0x3d50f4['setAttribute']?.('aria-live', 'polite'));
}
export function createPersonReplacementShellPresentation({
  resolveVoiceReferenceCount: resolveVoiceReferenceCount = () => 0x0,
} = {}) {
  return Object['freeze']({
    renderCanvasSyncLoadingOverlay: renderCanvasSyncLoadingOverlay,
    renderHeader: renderHeader,
    renderHome: renderHome,
    syncHome: syncHome,
    renderHomeProjectResults: renderHomeProjectResults,
    renderSmartClipSettingsPanel: renderSmartClipSettingsPanel,
    renderStepFooter: (_0x27ad77, _0x5bb7bd) =>
      renderStepFooter(_0x27ad77, resolveVoiceReferenceCount, _0x5bb7bd),
    renderToolbarActions: renderProjectToolbarActions,
    syncStatus: (_0x2d7a2b, _0x52df97) => syncStatus(_0x2d7a2b, _0x52df97, resolveVoiceReferenceCount),
  });
}
