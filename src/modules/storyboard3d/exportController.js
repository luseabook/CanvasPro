import {
  renderStoryboardGrid,
  renderStoryboardSequence,
  resolveStoryboardExportDimensions,
  STORYBOARD_EXPORT_ASPECT_RATIOS,
} from './storyboardExport.js';
import { buildCollageItemSwapPatch } from '../collage/collageFactory.js';
import { saveMediaFilesDownload } from '../../services/downloadSaveService.js';
import { focusFirstElement, restoreFocus, trapTabKey } from '../../utils/focusTrap.js';
function escapeHtml(_0x3c77f8) {
  return String(_0x3c77f8 ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
}
function safeFileName(_0x138c50) {
  const _0x31dabf = String(_0x138c50 || 'storyboard-3d')
    ['trim']()
    ['replace'](/[\\/:*?"<>|]+/g, '-')
    ['replace'](/\s+/g, '\x20')
    ['slice'](0x0, 0x50);
  return _0x31dabf || 'storyboard-3d';
}
export function collectStoryboard3DProjectShots(_0x3c04c2) {
  const _0x4a7f86 = Array['isArray'](_0x3c04c2?.['scenes']) ? _0x3c04c2['scenes'] : [],
    _0x547531 =
      _0x4a7f86['find']((_0x3a99c2) => _0x3a99c2['id'] === _0x3c04c2?.['activeSceneId']) || _0x4a7f86[0x0];
  if (!_0x547531) return [];
  return (Array['isArray'](_0x547531['shots']) ? _0x547531['shots'] : [])['map']((_0x1b4170, _0x59ac50) => ({
    ..._0x1b4170,
    sceneId: _0x547531['id'],
    sceneName: _0x547531['name'],
    sceneShotIndex: _0x59ac50,
  }));
}
export function getActiveStoryboard3DProjectShot(_0x5be9e7) {
  const _0x95c42d = Array['isArray'](_0x5be9e7?.['scenes']) ? _0x5be9e7['scenes'] : [],
    _0x2a29af =
      _0x95c42d['find']((_0x34bbe0) => _0x34bbe0['id'] === _0x5be9e7?.['activeSceneId']) || _0x95c42d[0x0];
  if (!_0x2a29af) return null;
  const _0x571dce = Array['isArray'](_0x2a29af['shots']) ? _0x2a29af['shots'] : [],
    _0x36c9dc =
      _0x571dce['find']((_0x3206f5) => _0x3206f5['id'] === _0x2a29af['activeShotId']) || _0x571dce[0x0];
  return _0x36c9dc ? { ..._0x36c9dc, sceneId: _0x2a29af['id'], sceneName: _0x2a29af['name'] } : null;
}
export function normalizeStoryboard3DExportOptions(_0xdfe905 = {}) {
  const _0x1a7eb1 = [
      'current-png',
      'current-jpeg',
      'sequence-png',
      'grid-png',
      'current-video',
      'sequence-video',
    ]['includes'](_0xdfe905['mode'])
      ? _0xdfe905['mode']
      : 'current-png',
    _0x54d240 = Object['hasOwn'](STORYBOARD_EXPORT_ASPECT_RATIOS, _0xdfe905['aspectRatio'])
      ? _0xdfe905['aspectRatio']
      : '16:9',
    _0xf6028f = ['720p', '1080p', '2K', '4K']['includes'](_0xdfe905['resolution'])
      ? _0xdfe905['resolution']
      : '1080p',
    _0x4bd11e = Number(_0xdfe905['gridSize']) || Math['pow'](Number(_0xdfe905['columns']) || 0x3, 0x2),
    _0xd3191d = [0x4, 0x9, 0x10]['includes'](_0x4bd11e) ? _0x4bd11e : 0x9;
  return {
    mode: _0x1a7eb1,
    ...(_0x1a7eb1['endsWith']('video')
      ? {
          videoStart: Math['max'](0x0, Math['min'](0xe10, Number(_0xdfe905['videoStart']) || 0x0)),
          videoEnd: Math['max'](0x0, Math['min'](0xe10, Number(_0xdfe905['videoEnd']) || 0x0)),
          videoTrack: String(_0xdfe905['videoTrack'] || 'all'),
        }
      : {}),
    aspectRatio: _0x54d240,
    resolution: _0xf6028f,
    gridSize: _0xd3191d,
    columns: Math['sqrt'](_0xd3191d),
    includeMetadata: _0xdfe905['includeMetadata'] !== ![],
    includeThirds: Boolean(_0xdfe905['includeThirds']),
    returnToCanvas: _0xdfe905['returnToCanvas'] !== ![],
  };
}
function uniqueShotIds(_0xd9170 = []) {
  return [
    ...new Set(
      (Array['isArray'](_0xd9170) ? _0xd9170 : [])
        ['map']((_0x3bcff3) => String(_0x3bcff3 || '')['trim']())
        ['filter'](Boolean),
    ),
  ];
}
export function reconcileStoryboard3DExportSelection(_0x106724, _0x1058d9 = [], _0x26bbc1 = []) {
  const _0x273e41 = uniqueShotIds(_0x1058d9),
    _0x4c564e = new Set(_0x273e41),
    _0x334f8f = uniqueShotIds(_0x26bbc1)['filter']((_0x179ed5) => _0x4c564e['has'](_0x179ed5));
  if (_0x106724 === 'grid-png') return [];
  if (_0x106724 === 'sequence-png' || _0x106724 === 'sequence-video')
    return _0x334f8f['length'] > 0x0 ? _0x334f8f : _0x273e41['slice'](0x0, 0x1);
  return _0x334f8f[0x0] ? [_0x334f8f[0x0]] : _0x273e41['slice'](0x0, 0x1);
}
export function createStoryboard3DExportGridSlots(_0x192eae = [], _0x28c7ba = 0x9, _0x1ba876 = []) {
  const _0x52b1eb = normalizeStoryboard3DExportOptions({ gridSize: _0x28c7ba })['gridSize'],
    _0x36d9df = uniqueShotIds(_0x192eae),
    _0x5716d8 = new Set(_0x36d9df),
    _0x293e79 = uniqueShotIds(_0x1ba876)['filter']((_0x2c1ff1) => _0x5716d8['has'](_0x2c1ff1)),
    _0x467bfb = [..._0x293e79, ..._0x36d9df['filter']((_0x317fd0) => !_0x293e79['includes'](_0x317fd0))];
  return Array['from']({ length: _0x52b1eb }, (_0x5580a0, _0x1be217) => _0x467bfb[_0x1be217] || '');
}
function createCollageSlotAdapter(_0x2f83de, _0x3d1729, _0x25099b) {
  const _0x5be4d8 = _0x3d1729 % _0x25099b,
    _0xf6771c = Math['floor'](_0x3d1729 / _0x25099b);
  return {
    id: _0x2f83de ? 'storyboard-export-' + _0x2f83de : 'collage-slot-' + _0x3d1729,
    shotId: _0x2f83de,
    url: _0x2f83de ? 'storyboard-shot://' + encodeURIComponent(_0x2f83de) : '',
    slotIndex: _0x3d1729,
    isEmpty: !_0x2f83de,
    x: _0x5be4d8,
    y: _0xf6771c,
    width: 0x1,
    height: 0x1,
  };
}
export function placeStoryboard3DShotInGrid(
  _0x13a622 = [],
  { shotId: _0x3d0ee2, sourceIndex: sourceIndex = -0x1, targetIndex: targetIndex = -0x1 } = {},
) {
  const _0x37dc90 = (Array['isArray'](_0x13a622) ? _0x13a622 : [])['map']((_0x26f5f4) =>
      String(_0x26f5f4 || ''),
    ),
    _0x1c1ce8 = String(_0x3d0ee2 || '')['trim']();
  if (!_0x1c1ce8 || targetIndex < 0x0 || targetIndex >= _0x37dc90['length']) return _0x37dc90;
  const _0x5595b2 = _0x37dc90['indexOf'](_0x1c1ce8),
    _0x30b2b8 = sourceIndex >= 0x0 ? sourceIndex : _0x5595b2;
  if (_0x30b2b8 >= 0x0 && _0x30b2b8 !== targetIndex) {
    const _0x2e702c = Math['max'](0x1, Math['round'](Math['sqrt'](_0x37dc90['length']))),
      _0x2c357a = _0x37dc90['map']((_0x5bb178, _0x4003e2) =>
        createCollageSlotAdapter(_0x5bb178, _0x4003e2, _0x2e702c),
      ),
      _0x10672b = buildCollageItemSwapPatch({ items: _0x2c357a }, _0x30b2b8, targetIndex);
    if (_0x10672b) return _0x10672b['items']['map']((_0x497397) => String(_0x497397?.['shotId'] || ''));
  }
  const _0x2d6d28 = [..._0x37dc90];
  return (
    _0x2d6d28['forEach']((_0x287631, _0x5c119f) => {
      if (_0x287631 === _0x1c1ce8) _0x2d6d28[_0x5c119f] = '';
    }),
    (_0x2d6d28[targetIndex] = _0x1c1ce8),
    _0x2d6d28
  );
}
function renderChoiceButtons(_0x48b91c, _0x4bee30, _0x3c7b19) {
  return _0x4bee30['map'](
    ({ value: _0x4295f6, label: _0x23ce96, note: note = '' }) =>
      '<button\x20type=\x22button\x22\x20class=\x22storyboard-3d-export-choice' +
      (_0x4295f6 === _0x3c7b19 ? ' is-active' : '') +
      '" data-storyboard-3d-export-action="set-option" data-storyboard-3d-export-option="' +
      escapeHtml(_0x48b91c) +
      '" data-storyboard-3d-export-value="' +
      escapeHtml(_0x4295f6) +
      '\x22\x20data-export-focus-key=\x22' +
      escapeHtml(_0x48b91c + ':' + _0x4295f6) +
      '" aria-pressed="' +
      (_0x4295f6 === _0x3c7b19) +
      '"><strong>' +
      escapeHtml(_0x23ce96) +
      '</strong>' +
      (note ? '<small>' + escapeHtml(note) + '</small>' : '') +
      '</button>',
  )['join']('');
}
function renderShotVisual(_0x1c4d4f) {
  const _0x415bbb = String(_0x1c4d4f?.['thumbnailUrl'] || '')['trim']();
  if (_0x415bbb)
    return (
      '<img\x20src=\x22' +
      escapeHtml(_0x415bbb) +
      '" alt="' +
      escapeHtml(_0x1c4d4f?.['name'] || '分镜预览') +
      '\x22>'
    );
  return '<span\x20class=\x22storyboard-3d-export-shot-placeholder\x22\x20aria-hidden=\x22true\x22><i></i></span>';
}
function renderShotRail(_0x51739a, _0x2bcaa1, _0x1b94e8, _0x3ee63b) {
  const _0xd64ac4 = new Set(_0x2bcaa1),
    _0x386287 = _0x1b94e8 === 'grid-png',
    _0x8ee4e2 = _0x1b94e8 === 'sequence-png' || _0x1b94e8 === 'sequence-video',
    _0x30a259 = _0x386287
      ? _0x3ee63b['filter'](Boolean)['length'] + ' 格已编排'
      : _0xd64ac4['size'] + ' / ' + _0x51739a['length'];
  return (
    '<aside class="storyboard-3d-export-shot-rail" aria-label="分镜选择">\n    <div class="storyboard-3d-export-rail-heading"><div><small>EXPORT SET</small><strong>' +
    (_0x386287 ? '分镜素材' : '分镜选择') +
    '</strong></div><span>' +
    _0x30a259 +
    '</span></div>\x0a\x20\x20\x20\x20' +
    (_0x8ee4e2
      ? '<button\x20type=\x22button\x22\x20class=\x22storyboard-3d-export-select-all\x22\x20data-storyboard-3d-export-action=\x22toggle-all-shots\x22\x20data-export-focus-key=\x22toggle-all\x22>' +
        (_0xd64ac4['size'] === _0x51739a['length'] ? '取消全选' : '全选分镜') +
        '</button>'
      : '') +
    '\n    <div class="storyboard-3d-export-shot-list">\n      ' +
    _0x51739a['map']((_0x10227a, _0x3e8cda) => {
      const _0x387b37 = !_0x386287 && _0xd64ac4['has'](_0x10227a['id']);
      return (
        '<article class="storyboard-3d-export-shot-item' +
        (_0x387b37 ? ' is-selected' : '') +
        '" draggable="true" data-storyboard-3d-export-drag-shot-id="' +
        escapeHtml(_0x10227a['id']) +
        '\x22\x20' +
        (_0x386287
          ? ''
          : 'data-storyboard-3d-export-action=\x22toggle-shot\x22\x20data-storyboard-3d-export-shot-id=\x22' +
            escapeHtml(_0x10227a['id']) +
            '\x22') +
        '>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22storyboard-3d-export-shot-thumb\x22>' +
        renderShotVisual(_0x10227a) +
        '<b>' +
        String(_0x3e8cda + 0x1)['padStart'](0x2, '0') +
        '</b></span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
        (_0x386287
          ? '<div\x20class=\x22storyboard-3d-export-shot-copy\x22><strong>' +
            escapeHtml(_0x10227a['name'] || '镜头 ' + (_0x3e8cda + 0x1)) +
            '</strong><small>' +
            escapeHtml(_0x10227a['sceneName'] || '未命名场景') +
            '</small></div>'
          : '<button type="button" data-storyboard-3d-export-action="toggle-shot" data-storyboard-3d-export-shot-id="' +
            escapeHtml(_0x10227a['id']) +
            '" data-export-focus-key="shot:' +
            escapeHtml(_0x10227a['id']) +
            '" aria-pressed="' +
            _0x387b37 +
            '"><span><strong>' +
            escapeHtml(_0x10227a['name'] || '镜头 ' + (_0x3e8cda + 0x1)) +
            '</strong><small>' +
            escapeHtml(_0x10227a['sceneName'] || '未命名场景') +
            '</small></span></button>') +
        '\n        </article>'
      );
    })['join']('') +
    '\n    </div>\n    <p>' +
    (_0x386287
      ? '拖动缩略图到宫格，宫格内可互换位置。'
      : _0x8ee4e2
        ? '点击卡片可多选要导出的分镜。'
        : '点击卡片选择一个要导出的分镜。') +
    '</p>\x0a\x20\x20</aside>'
  );
}
function renderGridComposer(_0x4767f4, _0x543b01, _0x37073d) {
  return (
    '<div\x20class=\x22storyboard-3d-export-grid-composer\x22\x20data-storyboard-3d-export-grid-size=\x22' +
    _0x37073d +
    '">\n    ' +
    _0x4767f4['map']((_0x2d783f, _0x296d58) => {
      const _0x2cd508 = _0x543b01['get'](_0x2d783f);
      return (
        '<div\x20class=\x22storyboard-3d-export-grid-slot' +
        (_0x2cd508 ? ' is-filled' : '') +
        '" data-storyboard-3d-export-grid-slot="' +
        _0x296d58 +
        '" draggable="' +
        Boolean(_0x2cd508) +
        '">\n        ' +
        (_0x2cd508
          ? renderShotVisual(_0x2cd508) +
            '<span><b>' +
            String(_0x296d58 + 0x1)['padStart'](0x2, '0') +
            '</b><small>' +
            escapeHtml(_0x2cd508['name'] || '未命名镜头') +
            '</small></span>'
          : '<span class="storyboard-3d-export-grid-empty"><b>' +
            String(_0x296d58 + 0x1)['padStart'](0x2, '0') +
            '</b><small>拖入分镜</small></span>') +
        '\n      </div>'
      );
    })['join']('') +
    '\n  </div>'
  );
}
function renderOptions({
  options: _0x4ffb18,
  shots: _0x1c6b11,
  selectedShotIds: _0x5b77d6,
  gridSlots: _0x4beceb,
  objects: objects = [],
}) {
  const _0x45f750 = resolveStoryboardExportDimensions(_0x4ffb18),
    _0x417640 = new Map(_0x1c6b11['map']((_0x5ef0a1) => [_0x5ef0a1['id'], _0x5ef0a1])),
    _0x13d6ba = _0x5b77d6['length'],
    _0x18fdcf = _0x4beceb['filter'](Boolean)['length'],
    _0x58dcd7 = _0x4ffb18['mode'] === 'grid-png';
  return (
    '<form class="storyboard-3d-export-form" data-storyboard-3d-export-form>\n    <header>\n      <div><small>STORYBOARD OUTPUT</small><strong>导出分镜</strong><span>选择镜头，输出图片或录制镜头动画。</span></div>\n      <button type="button" data-storyboard-3d-export-action="close" aria-label="关闭">×</button>\n    </header>\n    <div class="storyboard-3d-export-layout">\n      ' +
    renderShotRail(_0x1c6b11, _0x5b77d6, _0x4ffb18['mode'], _0x4beceb) +
    '\n      <main class="storyboard-3d-export-main">\n        <section class="storyboard-3d-export-mode-row">\n          <div class="storyboard-3d-export-inline-label"><small>01</small><strong>输出方式</strong></div>\n          <div class="storyboard-3d-export-mode-options">\n            ' +
    renderChoiceButtons(
      'mode',
      [
        { value: 'current-png', label: '单张 PNG', note: '当前所选镜头' },
        { value: 'current-jpeg', label: '单张 JPEG', note: '更小的文件' },
        { value: 'sequence-png', label: 'PNG 序列', note: '逐张独立导出' },
        { value: 'grid-png', label: '宫格图', note: '自由组合画面' },
        { value: 'current-video', label: '录制视频', note: '当前镜头 · 实时录制' },
        { value: 'sequence-video', label: '多镜头视频', note: '按镜头顺序连续录制' },
      ],
      _0x4ffb18['mode'],
    ) +
    '\n          </div><em>' +
    (_0x58dcd7 ? '导出 1 张宫格图' : _0x13d6ba + ' 个镜头已选') +
    '</em>\n        </section>\n        <section class="storyboard-3d-export-settings">\n          <div><span>画幅比例</span><div class="storyboard-3d-export-compact-options">' +
    renderChoiceButtons(
      'aspectRatio',
      Object['keys'](STORYBOARD_EXPORT_ASPECT_RATIOS)['map']((_0x1cec1d) => ({
        value: _0x1cec1d,
        label: _0x1cec1d,
      })),
      _0x4ffb18['aspectRatio'],
    ) +
    '</div></div>\n          <div><span>单格分辨率</span><div class="storyboard-3d-export-compact-options">' +
    renderChoiceButtons(
      'resolution',
      ['720p', '1080p', '2K', '4K']['map']((_0x107e02) => ({ value: _0x107e02, label: _0x107e02 })),
      _0x4ffb18['resolution'],
    ) +
    '</div></div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
    (_0x58dcd7
      ? '<div data-storyboard-3d-grid-size><span>宫格布局</span><div class="storyboard-3d-export-grid-size-options">' +
        renderChoiceButtons(
          'gridSize',
          [0x4, 0x9, 0x10]['map']((_0x4afd7e) => ({ value: String(_0x4afd7e), label: _0x4afd7e + ' 宫格' })),
          String(_0x4ffb18['gridSize']),
        ) +
        '</div></div>'
      : '') +
    '\n        </section>\n        <section class="storyboard-3d-export-stage' +
    (_0x58dcd7 ? ' is-grid' : '') +
    '\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22storyboard-3d-export-stage-heading\x22><span><small>02</small><strong>' +
    (_0x58dcd7 ? '宫格编排' : '输出预览') +
    '</strong></span><em>' +
    _0x45f750['width'] +
    '\x20×\x20' +
    _0x45f750['height'] +
    (_0x58dcd7 ? ' / 格' : '') +
    '</em></div>\n          ' +
    (_0x58dcd7
      ? renderGridComposer(_0x4beceb, _0x417640, _0x4ffb18['gridSize'])
      : '<div class="storyboard-3d-export-single-preview">' +
        renderShotVisual(_0x417640['get'](_0x5b77d6[0x0])) +
        '<div><strong>' +
        _0x45f750['width'] +
        ' × ' +
        _0x45f750['height'] +
        '</strong><small>' +
        (_0x4ffb18['mode'] === 'sequence-png' ? _0x13d6ba + '\x20个独立文件' : '导出首个所选镜头') +
        '</small></div></div>') +
    '\n          ' +
    (_0x58dcd7
      ? '<p class="storyboard-3d-export-grid-help">已载入 ' +
        _0x18fdcf +
        '\x20个镜头。拖动左侧分镜到任意格，或在格子之间拖动互换。</p>'
      : '') +
    '\n        </section>\n        ' +
    (_0x4ffb18['mode']['endsWith']('video')
      ? '<div class="storyboard-3d-director-fields"><label>各镜头开始 / 秒<input type="number" name="videoStart" min="0" max="3600" step="0.1" value="' +
        _0x4ffb18['videoStart'] +
        '"></label><label>结束 / 秒（0 为镜头末尾）<input type="number" name="videoEnd" min="0" max="3600" step="0.1" value="' +
        _0x4ffb18['videoEnd'] +
        '\x22></label><label>录制轨道<select\x20name=\x22videoTrack\x22><option\x20value=\x22all\x22\x20' +
        (_0x4ffb18['videoTrack'] === 'all' ? 'selected' : '') +
        '>完整镜头</option><option value="camera" ' +
        (_0x4ffb18['videoTrack'] === 'camera' ? 'selected' : '') +
        '>仅摄像机运动</option>' +
        objects['filter']((_0x3c8a96) => ['character', 'prop']['includes'](_0x3c8a96['type']))
          ['map'](
            (_0x4e80f6) =>
              '<option value="' +
              escapeHtml(_0x4e80f6['id']) +
              '\x22\x20' +
              (_0x4ffb18['videoTrack'] === _0x4e80f6['id'] ? 'selected' : '') +
              '>' +
              escapeHtml(_0x4e80f6['name']) +
              '</option>',
          )
          ['join']('') +
        '</select></label></div>'
      : '') +
    '\n        <div class="storyboard-3d-export-toggles" ' +
    (_0x4ffb18['mode']['endsWith']('video') ? 'hidden' : '') +
    '>\n          <label><input type="checkbox" name="includeMetadata" ' +
    (_0x4ffb18['includeMetadata'] ? 'checked' : '') +
    '><span>镜头信息与描述</span></label>\n          <label><input type="checkbox" name="includeThirds" ' +
    (_0x4ffb18['includeThirds'] ? 'checked' : '') +
    '><span>三分线</span></label>\n        </div>\n        <div class="storyboard-3d-export-progress" data-storyboard-3d-export-progress role="status" aria-live="polite"></div>\n        <progress data-storyboard-3d-export-meter hidden aria-label="导出进度"></progress><button type="button" data-storyboard-3d-export-action="cancel" hidden>取消录制</button>\n      </main>\n    </div>\n    <footer>\n      <button type="button" data-storyboard-3d-export-action="close">取消</button>\n      <div class="storyboard-3d-export-destination-actions">\n        <button type="button" class="is-primary" data-storyboard-3d-export-action="toggle-destinations" data-storyboard-3d-export-start aria-expanded="false">开始导出</button>\n        <div data-storyboard-3d-export-destinations hidden>\n          <button type="submit" data-storyboard-3d-export-submit data-storyboard-3d-export-destination="local" data-export-focus-key="destination:local">导出到本地</button>\n          <button type="submit" class="is-primary" data-storyboard-3d-export-submit data-storyboard-3d-export-destination="canvas" data-export-focus-key="destination:canvas">导出到画布</button>\n        </div>\n      </div>\n    </footer>\n  </form>'
  );
}
async function defaultDownloadResults(_0x2190d4) {
  return await saveMediaFilesDownload({ title: '选择分镜导出目录', files: _0x2190d4 });
}
export class Storyboard3DExportController {
  constructor({
    getProject: _0x4e8147,
    renderFrame: _0x4f8952,
    renderVideo: _0x5dfe72,
    onComplete: _0x3c9483,
    downloadResults: _0x5d305a,
    downloadResult: _0x21f2a4,
    documentObject: documentObject = globalThis['document'],
    windowObject: windowObject = globalThis['window'],
  } = {}) {
    ((this['getProject'] = _0x4e8147),
      (this['renderFrame'] = _0x4f8952),
      (this['renderVideo'] = _0x5dfe72),
      (this['onComplete'] = _0x3c9483),
      (this['downloadResults'] =
        typeof _0x5d305a === 'function'
          ? _0x5d305a
          : typeof _0x21f2a4 === 'function'
            ? async (_0x46fa62, _0x53d34f) => {
                for (const _0x152cfc of _0x46fa62) {
                  await _0x21f2a4({ blob: _0x152cfc['blob'] }, _0x152cfc['filename'], _0x53d34f);
                }
                return { success: !![], canceled: ![], count: _0x46fa62['length'] };
              }
            : defaultDownloadResults),
      (this['document'] = documentObject),
      (this['window'] = windowObject),
      (this['root'] = null),
      (this['returnFocusElement'] = null),
      (this['options'] = normalizeStoryboard3DExportOptions()),
      (this['selectedShotIds'] = []),
      (this['gridSlots'] = []),
      (this['dragState'] = null),
      (this['exportDestinationOpen'] = ![]),
      (this['busy'] = ![]),
      (this['_handleClick'] = this['_handleClick']['bind'](this)),
      (this['_handleChange'] = this['_handleChange']['bind'](this)),
      (this['_handleSubmit'] = this['_handleSubmit']['bind'](this)),
      (this['_handleKeyDown'] = this['_handleKeyDown']['bind'](this)),
      (this['_handleDragStart'] = this['_handleDragStart']['bind'](this)),
      (this['_handleDragOver'] = this['_handleDragOver']['bind'](this)),
      (this['_handleDragLeave'] = this['_handleDragLeave']['bind'](this)),
      (this['_handleDrop'] = this['_handleDrop']['bind'](this)),
      (this['_handleDragEnd'] = this['_handleDragEnd']['bind'](this)));
  }
  ['open'](_0x1c1422 = {}) {
    if (!this['document']?.['body']) return null;
    this['options'] = normalizeStoryboard3DExportOptions({ ...this['options'], ..._0x1c1422 });
    const _0x1ad788 = !this['root'];
    if (_0x1ad788) {
      this['returnFocusElement'] = this['document']['activeElement'] || null;
      const _0x4b28b1 = this['document']['createElement']('section');
      ((_0x4b28b1['className'] = 'storyboard-3d-export-dialog'),
        _0x4b28b1['setAttribute']('role', 'dialog'),
        _0x4b28b1['setAttribute']('aria-modal', 'true'),
        _0x4b28b1['setAttribute']('aria-label', '导出 3D 分镜'),
        (_0x4b28b1['tabIndex'] = -0x1),
        (_0x4b28b1['dataset']['uiStop'] = '1'),
        _0x4b28b1['addEventListener']('click', this['_handleClick']),
        _0x4b28b1['addEventListener']('change', this['_handleChange']),
        _0x4b28b1['addEventListener']('submit', this['_handleSubmit']),
        _0x4b28b1['addEventListener']('keydown', this['_handleKeyDown']),
        _0x4b28b1['addEventListener']('dragstart', this['_handleDragStart']),
        _0x4b28b1['addEventListener']('dragover', this['_handleDragOver']),
        _0x4b28b1['addEventListener']('dragleave', this['_handleDragLeave']),
        _0x4b28b1['addEventListener']('drop', this['_handleDrop']),
        _0x4b28b1['addEventListener']('dragend', this['_handleDragEnd']),
        this['document']['body']['appendChild'](_0x4b28b1),
        (this['root'] = _0x4b28b1));
    }
    const _0x2a5549 = collectStoryboard3DProjectShots(this['getProject']?.()),
      _0x5e4926 = _0x2a5549['map']((_0x4de87a) => _0x4de87a['id']);
    return (
      (this['selectedShotIds'] = reconcileStoryboard3DExportSelection(
        this['options']['mode'],
        _0x5e4926,
        _0x1ad788 ? [] : this['selectedShotIds'],
      )),
      (this['gridSlots'] = createStoryboard3DExportGridSlots(
        _0x5e4926,
        this['options']['gridSize'],
        _0x1ad788 ? [] : this['gridSlots'],
      )),
      (this['exportDestinationOpen'] = ![]),
      this['_render'](),
      _0x1ad788 &&
        focusFirstElement(this['root'], {
          preferredSelector: '[data-export-focus-key=\x22mode:current-png\x22]',
        }),
      this
    );
  }
  ['_readOptions']() {
    const _0x5bb0a9 = this['root']?.['querySelector']('[data-storyboard-3d-export-form]');
    if (!_0x5bb0a9) return this['options'];
    return normalizeStoryboard3DExportOptions({
      ...this['options'],
      includeMetadata: _0x5bb0a9['elements']['includeMetadata']?.['checked'],
      includeThirds: _0x5bb0a9['elements']['includeThirds']?.['checked'],
      videoStart: _0x5bb0a9['elements']['videoStart']?.['value'],
      videoEnd: _0x5bb0a9['elements']['videoEnd']?.['value'],
      videoTrack: _0x5bb0a9['elements']['videoTrack']?.['value'],
    });
  }
  ['_render']() {
    if (!this['root']) return;
    const _0x1ee2b5 = this['document']?.['activeElement']?.['getAttribute']?.('data-export-focus-key') || '',
      _0x399e1e = collectStoryboard3DProjectShots(this['getProject']?.());
    ((this['root']['innerHTML'] = renderOptions({
      options: this['options'],
      shots: _0x399e1e,
      objects:
        this['getProject']?.()?.['scenes']?.['find'](
          (_0x367f8f) => _0x367f8f['id'] === this['getProject']?.()?.['activeSceneId'],
        )?.['objects'] || [],
      selectedShotIds: this['selectedShotIds'],
      gridSlots: this['gridSlots'],
    })),
      _0x1ee2b5 &&
        [...this['root']['querySelectorAll']('[data-export-focus-key]')]
          ['find']((_0x403927) => _0x403927['getAttribute']('data-export-focus-key') === _0x1ee2b5)
          ?.['focus']?.({ preventScroll: !![] }));
  }
  ['_setProgress'](_0x13e623) {
    const _0x5b3bca = this['root']?.['querySelector']('[data-storyboard-3d-export-progress]');
    if (_0x5b3bca) _0x5b3bca['textContent'] = _0x13e623;
  }
  ['_setBusy'](_0x1ffb9e) {
    ((this['busy'] = _0x1ffb9e), this['root']?.['setAttribute']('aria-busy', String(_0x1ffb9e)));
    const _0x385b04 = this['root']?.['querySelector']('[data-storyboard-3d-export-meter]');
    _0x385b04 && ((_0x385b04['hidden'] = !_0x1ffb9e), _0x385b04['removeAttribute']('value'));
    const _0xb45a50 = this['root']?.['querySelector']('[data-storyboard-3d-export-action="cancel"]');
    if (_0xb45a50) _0xb45a50['hidden'] = !(_0x1ffb9e && this['options']['mode']['endsWith']('video'));
    this['root']
      ?.['querySelectorAll']('[data-storyboard-3d-export-submit], [data-storyboard-3d-export-start]')
      ['forEach']((_0x451b88) => {
        _0x451b88['disabled'] = _0x1ffb9e;
      });
  }
  ['_setExportDestinationOpen'](_0x41fcb4) {
    this['exportDestinationOpen'] = Boolean(_0x41fcb4);
    const _0x297bd9 = this['root']?.['querySelector']('[data-storyboard-3d-export-start]'),
      _0x4aac65 = this['root']?.['querySelector']('[data-storyboard-3d-export-destinations]');
    _0x297bd9 &&
      ((_0x297bd9['hidden'] = this['exportDestinationOpen']),
      _0x297bd9['setAttribute']('aria-expanded', String(this['exportDestinationOpen'])));
    if (_0x4aac65) _0x4aac65['hidden'] = !this['exportDestinationOpen'];
  }
  ['_handleClick'](_0x3bd666) {
    const _0x4ecb31 = _0x3bd666['target']['closest']('[data-storyboard-3d-export-action]');
    if (!_0x4ecb31 || !this['root']?.['contains'](_0x4ecb31)) return;
    const _0x165334 = _0x4ecb31['getAttribute']('data-storyboard-3d-export-action');
    if (_0x165334 === 'cancel') {
      this['exportAbort']?.['abort']();
      return;
    }
    if (this['busy']) return;
    if (_0x165334 === 'close') {
      this['close']();
      return;
    }
    if (_0x165334 === 'toggle-destinations') {
      this['_setExportDestinationOpen'](!this['exportDestinationOpen']);
      this['exportDestinationOpen'] &&
        this['root']?.['querySelector']('[data-export-focus-key="destination:local"]')?.['focus']?.();
      return;
    }
    if (_0x165334 === 'set-option') {
      const _0x1dbaf0 = _0x4ecb31['getAttribute']('data-storyboard-3d-export-option'),
        _0x3f6801 = _0x4ecb31['getAttribute']('data-storyboard-3d-export-value'),
        _0x45628c = _0x1dbaf0 === 'gridSize' ? Number(_0x3f6801) : _0x3f6801;
      this['options'] = normalizeStoryboard3DExportOptions({
        ...this['_readOptions'](),
        [_0x1dbaf0]: _0x45628c,
      });
      const _0x38f20b = collectStoryboard3DProjectShots(this['getProject']?.()),
        _0x2cf75e = _0x38f20b['map']((_0x1def36) => _0x1def36['id']);
      _0x1dbaf0 === 'mode' &&
        (this['selectedShotIds'] = reconcileStoryboard3DExportSelection(
          this['options']['mode'],
          _0x2cf75e,
          this['selectedShotIds'],
        ));
      ((this['gridSlots'] = createStoryboard3DExportGridSlots(
        _0x2cf75e,
        this['options']['gridSize'],
        _0x1dbaf0 === 'gridSize' ? [] : this['gridSlots'],
      )),
        (this['exportDestinationOpen'] = ![]),
        this['_render']());
      return;
    }
    if (_0x165334 === 'toggle-shot') {
      const _0x5cb8d8 = String(_0x4ecb31['getAttribute']('data-storyboard-3d-export-shot-id') || ''),
        _0x4be952 = collectStoryboard3DProjectShots(this['getProject']?.());
      if (this['options']['mode'] === 'sequence-png' || this['options']['mode'] === 'sequence-video') {
        const _0x4fdc15 = new Set(this['selectedShotIds']);
        if (_0x4fdc15['has'](_0x5cb8d8)) _0x4fdc15['delete'](_0x5cb8d8);
        else _0x4fdc15['add'](_0x5cb8d8);
        this['selectedShotIds'] = _0x4be952['map']((_0x48fdac) => _0x48fdac['id'])['filter']((_0x22157f) =>
          _0x4fdc15['has'](_0x22157f),
        );
      } else this['options']['mode'] !== 'grid-png' && (this['selectedShotIds'] = [_0x5cb8d8]);
      ((this['exportDestinationOpen'] = ![]), this['_render']());
      return;
    }
    if (_0x165334 === 'toggle-all-shots') {
      if (!['sequence-png', 'sequence-video']['includes'](this['options']['mode'])) return;
      const _0x2c1a1a = collectStoryboard3DProjectShots(this['getProject']?.());
      ((this['selectedShotIds'] =
        this['selectedShotIds']['length'] === _0x2c1a1a['length']
          ? []
          : _0x2c1a1a['map']((_0x303baf) => _0x303baf['id'])),
        (this['exportDestinationOpen'] = ![]),
        this['_render']());
    }
  }
  ['_handleChange']() {
    if (this['busy']) return;
    this['options'] = this['_readOptions']();
  }
  ['_readDragPayload'](_0x2e94de) {
    if (this['dragState']?.['shotId']) return this['dragState'];
    try {
      const _0x57646b = _0x2e94de?.['dataTransfer']?.['getData']?.('application/x-storyboard3d-export-shot');
      return _0x57646b ? JSON['parse'](_0x57646b) : null;
    } catch {
      return null;
    }
  }
  ['_handleDragStart'](_0x39579d) {
    const _0x40a4ba = _0x39579d['target']['closest']('[data-storyboard-3d-export-grid-slot]'),
      _0x7b9104 = _0x39579d['target']['closest']('[data-storyboard-3d-export-drag-shot-id]'),
      _0x53f68c = _0x40a4ba ? Number(_0x40a4ba['getAttribute']('data-storyboard-3d-export-grid-slot')) : -0x1,
      _0x34d876 = _0x40a4ba
        ? this['gridSlots'][_0x53f68c]
        : _0x7b9104?.['getAttribute']('data-storyboard-3d-export-drag-shot-id') || '';
    if (!_0x34d876) {
      _0x39579d['preventDefault']();
      return;
    }
    ((this['dragState'] = { shotId: _0x34d876, sourceIndex: _0x53f68c }),
      _0x39579d['dataTransfer']?.['setData']?.(
        'application/x-storyboard3d-export-shot',
        JSON['stringify'](this['dragState']),
      ));
    if (_0x39579d['dataTransfer'])
      _0x39579d['dataTransfer']['effectAllowed'] = _0x53f68c >= 0x0 ? 'move' : 'copy';
  }
  ['_handleDragOver'](_0x14724e) {
    const _0x55dbca = _0x14724e['target']['closest']('[data-storyboard-3d-export-grid-slot]');
    if (!_0x55dbca || !this['root']?.['contains'](_0x55dbca)) return;
    (_0x14724e['preventDefault'](),
      this['root']
        ['querySelectorAll']('.storyboard-3d-export-grid-slot.is-drop-target')
        ['forEach']((_0x17e9d6) => _0x17e9d6['classList']['remove']('is-drop-target')),
      _0x55dbca['classList']['add']('is-drop-target'));
    if (_0x14724e['dataTransfer'])
      _0x14724e['dataTransfer']['dropEffect'] = this['dragState']?.['sourceIndex'] >= 0x0 ? 'move' : 'copy';
  }
  ['_handleDragLeave'](_0x462cf0) {
    const _0x4c59e0 = _0x462cf0['target']['closest']('[data-storyboard-3d-export-grid-slot]');
    if (!_0x4c59e0 || _0x4c59e0['contains'](_0x462cf0['relatedTarget'])) return;
    _0x4c59e0['classList']['remove']('is-drop-target');
  }
  ['_handleDrop'](_0xd35cb2) {
    const _0x496bd9 = _0xd35cb2['target']['closest']('[data-storyboard-3d-export-grid-slot]');
    if (!_0x496bd9 || !this['root']?.['contains'](_0x496bd9)) return;
    _0xd35cb2['preventDefault']();
    const _0x3c7d82 = this['_readDragPayload'](_0xd35cb2),
      _0x5c7a95 = Number(_0x496bd9['getAttribute']('data-storyboard-3d-export-grid-slot'));
    if (!_0x3c7d82?.['shotId'] || !Number['isInteger'](_0x5c7a95)) return;
    ((this['gridSlots'] = placeStoryboard3DShotInGrid(this['gridSlots'], {
      shotId: _0x3c7d82['shotId'],
      sourceIndex: Number(_0x3c7d82['sourceIndex']),
      targetIndex: _0x5c7a95,
    })),
      (this['dragState'] = null),
      (this['exportDestinationOpen'] = ![]),
      this['_render']());
  }
  ['_handleDragEnd']() {
    ((this['dragState'] = null),
      this['root']
        ?.['querySelectorAll']('.storyboard-3d-export-grid-slot.is-drop-target')
        ['forEach']((_0x3f9025) => _0x3f9025['classList']['remove']('is-drop-target')));
  }
  ['_handleKeyDown'](_0x1b85c4) {
    if (_0x1b85c4['key'] === 'Escape') {
      (_0x1b85c4['preventDefault'](), _0x1b85c4['stopPropagation'](), this['close']());
      return;
    }
    trapTabKey(_0x1b85c4, this['root'], this['document']);
  }
  async ['_handleSubmit'](_0x4b1979) {
    _0x4b1979['preventDefault']();
    if (this['busy']) return;
    const _0x48b415 =
      _0x4b1979['submitter']?.['getAttribute']?.('data-storyboard-3d-export-destination') === 'canvas'
        ? 'canvas'
        : 'local';
    (this['_setExportDestinationOpen'](![]), (this['options'] = this['_readOptions']()));
    const _0x4a9433 = this['getProject']?.(),
      _0x433c71 = collectStoryboard3DProjectShots(_0x4a9433),
      _0x205660 = new Map(_0x433c71['map']((_0x1433af) => [_0x1433af['id'], _0x1433af])),
      _0x3b3138 = this['selectedShotIds']
        ['map']((_0x3dfa7f) => _0x205660['get'](_0x3dfa7f))
        ['filter'](Boolean),
      _0x455173 = this['options']['mode']['startsWith']('current-'),
      _0x3ea6e2 =
        this['options']['mode'] === 'grid-png'
          ? this['gridSlots']['map']((_0x49a72a) => _0x205660['get'](_0x49a72a) || null)
          : _0x455173
            ? [_0x3b3138[0x0]]['filter'](Boolean)
            : _0x3b3138;
    if (!_0x3ea6e2['some'](Boolean)) {
      this['_setProgress']('请先选择至少一个要导出的镜头。');
      return;
    }
    if (typeof this['renderFrame'] !== 'function') {
      this['_setProgress']('3D 离屏渲染器尚未就绪。');
      return;
    }
    const _0x1a73df = { ...this['options'] },
      _0x45dcf7 = _0x1a73df['mode']['endsWith']('video');
    if (_0x45dcf7 && typeof this['renderVideo'] !== 'function') {
      this['_setProgress']('视频渲染器尚未就绪。');
      return;
    }
    const _0x63181e = new AbortController();
    ((this['exportAbort'] = _0x63181e), this['_setBusy'](!![]), this['_setProgress']('正在准备离屏渲染…'));
    try {
      const _0x4cd4a6 = {
        renderFrame: this['renderFrame'],
        aspectRatio: this['options']['aspectRatio'],
        resolution: this['options']['resolution'],
        includeThirds: this['options']['includeThirds'],
        includeDescription: this['options']['includeMetadata'],
        includeShotNumber: this['options']['includeMetadata'],
        includeShotAngle: this['options']['includeMetadata'],
        includeFocalLength: this['options']['includeMetadata'],
        metadataHeight: this['options']['includeMetadata'] && !_0x455173 ? undefined : 0x0,
        onProgress: ({ stage: _0x4dad50, current: _0xc9d31f, total: _0x5438e5 }) => {
          if (_0x4dad50 === 'encoding') this['_setProgress']('正在编码图片…');
          else {
            if (_0x4dad50 === 'rendering') this['_setProgress']('正在渲染 ' + _0xc9d31f + ' / ' + _0x5438e5);
          }
        },
      };
      let _0x62334b = this['options']['mode'] === 'current-jpeg' ? 'image/jpeg' : 'image/png';
      const _0xcd9890 = _0x45dcf7
        ? [
            await this['renderVideo'](_0x3ea6e2[0x0], {
              ..._0x1a73df,
              shots: _0x3ea6e2,
              signal: _0x63181e['signal'],
              onProgress: ({ current: _0xaaf582, total: _0x6dbb35 }) => {
                if (this['exportAbort'] !== _0x63181e) return;
                this['_setProgress'](
                  '正在录制 ' + _0xaaf582['toFixed'](0x1) + ' / ' + _0x6dbb35['toFixed'](0x1) + '\x20秒',
                );
                const _0x275312 = this['root']?.['querySelector']('[data-storyboard-3d-export-meter]');
                _0x275312 && ((_0x275312['max'] = _0x6dbb35), (_0x275312['value'] = _0xaaf582));
              },
            }),
          ]
        : this['options']['mode'] === 'sequence-png'
          ? await renderStoryboardSequence({ shots: _0x3ea6e2, ..._0x4cd4a6, mimeType: _0x62334b })
          : [
              await renderStoryboardGrid({
                shots: _0x3ea6e2,
                ..._0x4cd4a6,
                mimeType: _0x62334b,
                columns:
                  this['options']['mode'] === 'grid-png' ? Math['sqrt'](this['options']['gridSize']) : 0x1,
              }),
            ];
      if (_0x63181e['signal']['aborted']) throw new DOMException('已取消导出', 'AbortError');
      const _0x281d44 = this['root']?.['querySelector']('[data-storyboard-3d-export-action=\x22cancel\x22]');
      if (_0x281d44) _0x281d44['hidden'] = !![];
      if (_0x45dcf7) _0x62334b = _0xcd9890[0x0]['blob']['type'];
      const _0x353ff5 = _0x45dcf7
        ? _0x62334b === 'video/mp4'
          ? 'mp4'
          : 'webm'
        : _0x62334b === 'image/jpeg'
          ? 'jpg'
          : 'png';
      if (_0x48b415 === 'local') {
        const _0x1101df = _0xcd9890['map']((_0x63555a, _0x149720) => {
            const _0x2546fd =
              _0xcd9890['length'] > 0x1 ? '-' + String(_0x149720 + 0x1)['padStart'](0x2, '0') : '';
            return {
              kind: _0x45dcf7 ? 'video' : 'image',
              blob: _0x63555a['blob'],
              filename: '' + safeFileName(_0x4a9433?.['name']) + _0x2546fd + '.' + _0x353ff5,
            };
          }),
          _0x47c115 = await this['downloadResults'](_0x1101df, {
            documentObject: this['document'],
            windowObject: this['window'],
          });
        if (_0x47c115?.['canceled']) {
          this['_setProgress']('已取消保存。');
          return;
        }
      }
      if (_0x63181e['signal']['aborted']) throw new DOMException('已取消导出', 'AbortError');
      (await this['onComplete']?.({
        project: _0x4a9433,
        options: {
          ..._0x1a73df,
          returnToCanvas: _0x48b415 === 'canvas',
          destination: _0x48b415,
          selectedShotIds: [...this['selectedShotIds']],
          gridSlots: [...this['gridSlots']],
        },
        results: _0xcd9890,
      }),
        this['_setProgress'](
          _0x48b415 === 'canvas'
            ? '已将导出结果发送到画布。'
            : '已导出到本地，共 ' + _0xcd9890['length'] + '\x20个文件。',
        ));
    } catch (_0x5f1bfe) {
      if (this['exportAbort'] !== _0x63181e) return;
      this['_setProgress'](
        _0x5f1bfe?.['name'] === 'AbortError'
          ? '已取消导出。'
          : '导出失败：' + (_0x5f1bfe?.['message'] || String(_0x5f1bfe)),
      );
    } finally {
      this['exportAbort'] === _0x63181e && (this['_setBusy'](![]), (this['exportAbort'] = null));
    }
  }
  ['close']() {
    if (this['busy'] || !this['root']) return ![];
    const _0x140007 = this['returnFocusElement'];
    return (
      this['root']['removeEventListener']('click', this['_handleClick']),
      this['root']['removeEventListener']('change', this['_handleChange']),
      this['root']['removeEventListener']('submit', this['_handleSubmit']),
      this['root']['removeEventListener']('keydown', this['_handleKeyDown']),
      this['root']['removeEventListener']('dragstart', this['_handleDragStart']),
      this['root']['removeEventListener']('dragover', this['_handleDragOver']),
      this['root']['removeEventListener']('dragleave', this['_handleDragLeave']),
      this['root']['removeEventListener']('drop', this['_handleDrop']),
      this['root']['removeEventListener']('dragend', this['_handleDragEnd']),
      this['root']['remove'](),
      (this['root'] = null),
      (this['dragState'] = null),
      (this['returnFocusElement'] = null),
      restoreFocus(_0x140007, this['document']),
      !![]
    );
  }
  ['destroy']() {
    return (this['exportAbort']?.['abort'](), (this['busy'] = ![]), this['close']());
  }
}
export function createStoryboard3DExportController(_0x3bc1e9 = {}) {
  return new Storyboard3DExportController(_0x3bc1e9);
}
