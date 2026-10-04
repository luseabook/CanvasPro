import {
  renderStoryboardGrid,
  renderStoryboardSequence,
  resolveStoryboardExportDimensions,
  STORYBOARD_EXPORT_ASPECT_RATIOS,
} from './storyboardExport.js';
import { buildCollageItemSwapPatch } from '../collage/collageFactory.js';
import { saveMediaFilesDownload } from '../../services/downloadSaveService.js';
import { focusFirstElement, restoreFocus, trapTabKey } from '../../utils/focusTrap.js';
function escapeHtml(value) {
  return String(value ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
}
function safeFileName(item) {
  const key = String(item || 'storyboard-3d')
    ['trim']()
    ['replace'](/[\\/:*?"<>|]+/g, '-')
    ['replace'](/\s+/g, '\x20')
    ['slice'](0x0, 0x50);
  return key || 'storyboard-3d';
}
export function collectStoryboard3DProjectShots(index) {
  const list = Array['isArray'](index?.['scenes']) ? index['scenes'] : [],
    sceneId = list['find']((result) => result['id'] === index?.['activeSceneId']) || list[0x0];
  if (!sceneId) return [];
  return (Array['isArray'](sceneId['shots']) ? sceneId['shots'] : [])['map']((args, sceneShotIndex) => ({
    ...args,
    sceneId: sceneId['id'],
    sceneName: sceneId['name'],
    sceneShotIndex: sceneShotIndex,
  }));
}
export function getActiveStoryboard3DProjectShot(data) {
  const list2 = Array['isArray'](data?.['scenes']) ? data['scenes'] : [],
    sceneId2 = list2['find']((options) => options['id'] === data?.['activeSceneId']) || list2[0x0];
  if (!sceneId2) return null;
  const list3 = Array['isArray'](sceneId2['shots']) ? sceneId2['shots'] : [],
    args2 = list3['find']((target) => target['id'] === sceneId2['activeShotId']) || list3[0x0];
  return args2 ? { ...args2, sceneId: sceneId2['id'], sceneName: sceneId2['name'] } : null;
}
export function normalizeStoryboard3DExportOptions(includeMetadata = {}) {
  const mode = ['current-png', 'current-jpeg', 'sequence-png', 'grid-png', 'current-video', 'sequence-video'][
      'includes'
    ](includeMetadata['mode'])
      ? includeMetadata['mode']
      : 'current-png',
    aspectRatio = Object['hasOwn'](STORYBOARD_EXPORT_ASPECT_RATIOS, includeMetadata['aspectRatio'])
      ? includeMetadata['aspectRatio']
      : '16:9',
    resolution = ['720p', '1080p', '2K', '4K']['includes'](includeMetadata['resolution'])
      ? includeMetadata['resolution']
      : '1080p',
    source =
      Number(includeMetadata['gridSize']) || Math['pow'](Number(includeMetadata['columns']) || 0x3, 0x2),
    gridSize = [0x4, 0x9, 0x10]['includes'](source) ? source : 0x9;
  return {
    mode: mode,
    ...(mode['endsWith']('video')
      ? {
          videoStart: Math['max'](0x0, Math['min'](0xe10, Number(includeMetadata['videoStart']) || 0x0)),
          videoEnd: Math['max'](0x0, Math['min'](0xe10, Number(includeMetadata['videoEnd']) || 0x0)),
          videoTrack: String(includeMetadata['videoTrack'] || 'all'),
        }
      : {}),
    aspectRatio: aspectRatio,
    resolution: resolution,
    gridSize: gridSize,
    columns: Math['sqrt'](gridSize),
    includeMetadata: includeMetadata['includeMetadata'] !== ![],
    includeThirds: Boolean(includeMetadata['includeThirds']),
    returnToCanvas: includeMetadata['returnToCanvas'] !== ![],
  };
}
function uniqueShotIds(list4 = []) {
  return [
    ...new Set(
      (Array['isArray'](list4) ? list4 : [])
        ['map']((next) => String(next || '')['trim']())
        ['filter'](Boolean),
    ),
  ];
}
export function reconcileStoryboard3DExportSelection(current, entry = [], record = []) {
  const list5 = uniqueShotIds(entry),
    map = new Set(list5),
    list6 = uniqueShotIds(record)['filter']((payload) => map['has'](payload));
  if (current === 'grid-png') return [];
  if (current === 'sequence-png' || current === 'sequence-video')
    return list6['length'] > 0x0 ? list6 : list5['slice'](0x0, 0x1);
  return list6[0x0] ? [list6[0x0]] : list5['slice'](0x0, 0x1);
}
export function createStoryboard3DExportGridSlots(list7 = [], gridSize2 = 0x9, handle = []) {
  const length = normalizeStoryboard3DExportOptions({ gridSize: gridSize2 })['gridSize'],
    list8 = uniqueShotIds(list7),
    map2 = new Set(list8),
    list9 = uniqueShotIds(handle)['filter']((state) => map2['has'](state)),
    config = [...list9, ...list8['filter']((scope) => !list9['includes'](scope))];
  return Array['from']({ length: length }, (input, output) => config[output] || '');
}
function createCollageSlotAdapter(id, slotIndex, value2) {
  const x = slotIndex % value2,
    y = Math['floor'](slotIndex / value2);
  return {
    id: id ? 'storyboard-export-' + id : 'collage-slot-' + slotIndex,
    shotId: id,
    url: id ? 'storyboard-shot://' + encodeURIComponent(id) : '',
    slotIndex: slotIndex,
    isEmpty: !id,
    x: x,
    y: y,
    width: 0x1,
    height: 0x1,
  };
}
export function placeStoryboard3DShotInGrid(
  list10 = [],
  { shotId: shotId, sourceIndex: sourceIndex = -0x1, targetIndex: targetIndex = -0x1 } = {},
) {
  const list11 = (Array['isArray'](list10) ? list10 : [])['map']((value3) => String(value3 || '')),
    enabled = String(shotId || '')['trim']();
  if (!enabled || targetIndex < 0x0 || targetIndex >= list11['length']) return list11;
  const value4 = list11['indexOf'](enabled),
    count = sourceIndex >= 0x0 ? sourceIndex : value4;
  if (count >= 0x0 && count !== targetIndex) {
    const value5 = Math['max'](0x1, Math['round'](Math['sqrt'](list11['length']))),
      items = list11['map']((value6, value7) => createCollageSlotAdapter(value6, value7, value5)),
      collageItemSwapPatch = buildCollageItemSwapPatch({ items: items }, count, targetIndex);
    if (collageItemSwapPatch)
      return collageItemSwapPatch['items']['map']((value8) => String(value8?.['shotId'] || ''));
  }
  const list12 = [...list11];
  return (
    list12['forEach']((value9, value10) => {
      if (value9 === enabled) list12[value10] = '';
    }),
    (list12[targetIndex] = enabled),
    list12
  );
}
function renderChoiceButtons(value11, list13, value12) {
  return list13['map'](
    ({ value: value13, label: label, note: note = '' }) =>
      '<button\x20type=\x22button\x22\x20class=\x22storyboard-3d-export-choice' +
      (value13 === value12 ? ' is-active' : '') +
      '" data-storyboard-3d-export-action="set-option" data-storyboard-3d-export-option="' +
      escapeHtml(value11) +
      '" data-storyboard-3d-export-value="' +
      escapeHtml(value13) +
      '\x22\x20data-export-focus-key=\x22' +
      escapeHtml(value11 + ':' + value13) +
      '" aria-pressed="' +
      (value13 === value12) +
      '"><strong>' +
      escapeHtml(label) +
      '</strong>' +
      (note ? '<small>' + escapeHtml(note) + '</small>' : '') +
      '</button>',
  )['join']('');
}
function renderShotVisual(error) {
  const value14 = String(error?.['thumbnailUrl'] || '')['trim']();
  if (value14)
    return (
      '<img\x20src=\x22' +
      escapeHtml(value14) +
      '" alt="' +
      escapeHtml(error?.['name'] || '分镜预览') +
      '\x22>'
    );
  return '<span\x20class=\x22storyboard-3d-export-shot-placeholder\x22\x20aria-hidden=\x22true\x22><i></i></span>';
}
function renderShotRail(list14, value15, value16, list15) {
  const map3 = new Set(value15),
    enabled2 = value16 === 'grid-png',
    value17 = value16 === 'sequence-png' || value16 === 'sequence-video',
    value18 = enabled2
      ? list15['filter'](Boolean)['length'] + ' 格已编排'
      : map3['size'] + ' / ' + list14['length'];
  return (
    '<aside class="storyboard-3d-export-shot-rail" aria-label="分镜选择">\n    <div class="storyboard-3d-export-rail-heading"><div><small>EXPORT SET</small><strong>' +
    (enabled2 ? '分镜素材' : '分镜选择') +
    '</strong></div><span>' +
    value18 +
    '</span></div>\x0a\x20\x20\x20\x20' +
    (value17
      ? '<button\x20type=\x22button\x22\x20class=\x22storyboard-3d-export-select-all\x22\x20data-storyboard-3d-export-action=\x22toggle-all-shots\x22\x20data-export-focus-key=\x22toggle-all\x22>' +
        (map3['size'] === list14['length'] ? '取消全选' : '全选分镜') +
        '</button>'
      : '') +
    '\n    <div class="storyboard-3d-export-shot-list">\n      ' +
    list14['map']((error2, value19) => {
      const value20 = !enabled2 && map3['has'](error2['id']);
      return (
        '<article class="storyboard-3d-export-shot-item' +
        (value20 ? ' is-selected' : '') +
        '" draggable="true" data-storyboard-3d-export-drag-shot-id="' +
        escapeHtml(error2['id']) +
        '\x22\x20' +
        (enabled2
          ? ''
          : 'data-storyboard-3d-export-action=\x22toggle-shot\x22\x20data-storyboard-3d-export-shot-id=\x22' +
            escapeHtml(error2['id']) +
            '\x22') +
        '>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22storyboard-3d-export-shot-thumb\x22>' +
        renderShotVisual(error2) +
        '<b>' +
        String(value19 + 0x1)['padStart'](0x2, '0') +
        '</b></span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
        (enabled2
          ? '<div\x20class=\x22storyboard-3d-export-shot-copy\x22><strong>' +
            escapeHtml(error2['name'] || '镜头 ' + (value19 + 0x1)) +
            '</strong><small>' +
            escapeHtml(error2['sceneName'] || '未命名场景') +
            '</small></div>'
          : '<button type="button" data-storyboard-3d-export-action="toggle-shot" data-storyboard-3d-export-shot-id="' +
            escapeHtml(error2['id']) +
            '" data-export-focus-key="shot:' +
            escapeHtml(error2['id']) +
            '" aria-pressed="' +
            value20 +
            '"><span><strong>' +
            escapeHtml(error2['name'] || '镜头 ' + (value19 + 0x1)) +
            '</strong><small>' +
            escapeHtml(error2['sceneName'] || '未命名场景') +
            '</small></span></button>') +
        '\n        </article>'
      );
    })['join']('') +
    '\n    </div>\n    <p>' +
    (enabled2
      ? '拖动缩略图到宫格，宫格内可互换位置。'
      : value17
        ? '点击卡片可多选要导出的分镜。'
        : '点击卡片选择一个要导出的分镜。') +
    '</p>\x0a\x20\x20</aside>'
  );
}
function renderGridComposer(list16, map4, value21) {
  return (
    '<div\x20class=\x22storyboard-3d-export-grid-composer\x22\x20data-storyboard-3d-export-grid-size=\x22' +
    value21 +
    '">\n    ' +
    list16['map']((value22, value23) => {
      const error3 = map4['get'](value22);
      return (
        '<div\x20class=\x22storyboard-3d-export-grid-slot' +
        (error3 ? ' is-filled' : '') +
        '" data-storyboard-3d-export-grid-slot="' +
        value23 +
        '" draggable="' +
        Boolean(error3) +
        '">\n        ' +
        (error3
          ? renderShotVisual(error3) +
            '<span><b>' +
            String(value23 + 0x1)['padStart'](0x2, '0') +
            '</b><small>' +
            escapeHtml(error3['name'] || '未命名镜头') +
            '</small></span>'
          : '<span class="storyboard-3d-export-grid-empty"><b>' +
            String(value23 + 0x1)['padStart'](0x2, '0') +
            '</b><small>拖入分镜</small></span>') +
        '\n      </div>'
      );
    })['join']('') +
    '\n  </div>'
  );
}
function renderOptions({
  options: options2,
  shots: shots,
  selectedShotIds: selectedShotIds,
  gridSlots: gridSlots,
  objects: objects = [],
}) {
  const box = resolveStoryboardExportDimensions(options2),
    map5 = new Map(shots['map']((value24) => [value24['id'], value24])),
    value25 = selectedShotIds['length'],
    value26 = gridSlots['filter'](Boolean)['length'],
    value27 = options2['mode'] === 'grid-png';
  return (
    '<form class="storyboard-3d-export-form" data-storyboard-3d-export-form>\n    <header>\n      <div><small>STORYBOARD OUTPUT</small><strong>导出分镜</strong><span>选择镜头，输出图片或录制镜头动画。</span></div>\n      <button type="button" data-storyboard-3d-export-action="close" aria-label="关闭">×</button>\n    </header>\n    <div class="storyboard-3d-export-layout">\n      ' +
    renderShotRail(shots, selectedShotIds, options2['mode'], gridSlots) +
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
      options2['mode'],
    ) +
    '\n          </div><em>' +
    (value27 ? '导出 1 张宫格图' : value25 + ' 个镜头已选') +
    '</em>\n        </section>\n        <section class="storyboard-3d-export-settings">\n          <div><span>画幅比例</span><div class="storyboard-3d-export-compact-options">' +
    renderChoiceButtons(
      'aspectRatio',
      Object['keys'](STORYBOARD_EXPORT_ASPECT_RATIOS)['map']((value28) => ({
        value: value28,
        label: value28,
      })),
      options2['aspectRatio'],
    ) +
    '</div></div>\n          <div><span>单格分辨率</span><div class="storyboard-3d-export-compact-options">' +
    renderChoiceButtons(
      'resolution',
      ['720p', '1080p', '2K', '4K']['map']((value29) => ({ value: value29, label: value29 })),
      options2['resolution'],
    ) +
    '</div></div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
    (value27
      ? '<div data-storyboard-3d-grid-size><span>宫格布局</span><div class="storyboard-3d-export-grid-size-options">' +
        renderChoiceButtons(
          'gridSize',
          [0x4, 0x9, 0x10]['map']((label2) => ({ value: String(label2), label: label2 + ' 宫格' })),
          String(options2['gridSize']),
        ) +
        '</div></div>'
      : '') +
    '\n        </section>\n        <section class="storyboard-3d-export-stage' +
    (value27 ? ' is-grid' : '') +
    '\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22storyboard-3d-export-stage-heading\x22><span><small>02</small><strong>' +
    (value27 ? '宫格编排' : '输出预览') +
    '</strong></span><em>' +
    box['width'] +
    '\x20×\x20' +
    box['height'] +
    (value27 ? ' / 格' : '') +
    '</em></div>\n          ' +
    (value27
      ? renderGridComposer(gridSlots, map5, options2['gridSize'])
      : '<div class="storyboard-3d-export-single-preview">' +
        renderShotVisual(map5['get'](selectedShotIds[0x0])) +
        '<div><strong>' +
        box['width'] +
        ' × ' +
        box['height'] +
        '</strong><small>' +
        (options2['mode'] === 'sequence-png' ? value25 + '\x20个独立文件' : '导出首个所选镜头') +
        '</small></div></div>') +
    '\n          ' +
    (value27
      ? '<p class="storyboard-3d-export-grid-help">已载入 ' +
        value26 +
        '\x20个镜头。拖动左侧分镜到任意格，或在格子之间拖动互换。</p>'
      : '') +
    '\n        </section>\n        ' +
    (options2['mode']['endsWith']('video')
      ? '<div class="storyboard-3d-director-fields"><label>各镜头开始 / 秒<input type="number" name="videoStart" min="0" max="3600" step="0.1" value="' +
        options2['videoStart'] +
        '"></label><label>结束 / 秒（0 为镜头末尾）<input type="number" name="videoEnd" min="0" max="3600" step="0.1" value="' +
        options2['videoEnd'] +
        '\x22></label><label>录制轨道<select\x20name=\x22videoTrack\x22><option\x20value=\x22all\x22\x20' +
        (options2['videoTrack'] === 'all' ? 'selected' : '') +
        '>完整镜头</option><option value="camera" ' +
        (options2['videoTrack'] === 'camera' ? 'selected' : '') +
        '>仅摄像机运动</option>' +
        objects['filter']((value30) => ['character', 'prop']['includes'](value30['type']))
          ['map'](
            (error4) =>
              '<option value="' +
              escapeHtml(error4['id']) +
              '\x22\x20' +
              (options2['videoTrack'] === error4['id'] ? 'selected' : '') +
              '>' +
              escapeHtml(error4['name']) +
              '</option>',
          )
          ['join']('') +
        '</select></label></div>'
      : '') +
    '\n        <div class="storyboard-3d-export-toggles" ' +
    (options2['mode']['endsWith']('video') ? 'hidden' : '') +
    '>\n          <label><input type="checkbox" name="includeMetadata" ' +
    (options2['includeMetadata'] ? 'checked' : '') +
    '><span>镜头信息与描述</span></label>\n          <label><input type="checkbox" name="includeThirds" ' +
    (options2['includeThirds'] ? 'checked' : '') +
    '><span>三分线</span></label>\n        </div>\n        <div class="storyboard-3d-export-progress" data-storyboard-3d-export-progress role="status" aria-live="polite"></div>\n        <progress data-storyboard-3d-export-meter hidden aria-label="导出进度"></progress><button type="button" data-storyboard-3d-export-action="cancel" hidden>取消录制</button>\n      </main>\n    </div>\n    <footer>\n      <button type="button" data-storyboard-3d-export-action="close">取消</button>\n      <div class="storyboard-3d-export-destination-actions">\n        <button type="button" class="is-primary" data-storyboard-3d-export-action="toggle-destinations" data-storyboard-3d-export-start aria-expanded="false">开始导出</button>\n        <div data-storyboard-3d-export-destinations hidden>\n          <button type="submit" data-storyboard-3d-export-submit data-storyboard-3d-export-destination="local" data-export-focus-key="destination:local">导出到本地</button>\n          <button type="submit" class="is-primary" data-storyboard-3d-export-submit data-storyboard-3d-export-destination="canvas" data-export-focus-key="destination:canvas">导出到画布</button>\n        </div>\n      </div>\n    </footer>\n  </form>'
  );
}
async function defaultDownloadResults(files) {
  return await saveMediaFilesDownload({ title: '选择分镜导出目录', files: files });
}
export class Storyboard3DExportController {
  constructor({
    getProject: getProject,
    renderFrame: renderFrame,
    renderVideo: renderVideo,
    onComplete: onComplete,
    downloadResults: downloadResults,
    downloadResult: downloadResult,
    documentObject: documentObject = globalThis['document'],
    windowObject: windowObject = globalThis['window'],
  } = {}) {
    ((this['getProject'] = getProject),
      (this['renderFrame'] = renderFrame),
      (this['renderVideo'] = renderVideo),
      (this['onComplete'] = onComplete),
      (this['downloadResults'] =
        typeof downloadResults === 'function'
          ? downloadResults
          : typeof downloadResult === 'function'
            ? async (count2, value31) => {
                for (const blob of count2) {
                  await downloadResult({ blob: blob['blob'] }, blob['filename'], value31);
                }
                return { success: !![], canceled: ![], count: count2['length'] };
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
  ['open'](args3 = {}) {
    if (!this['document']?.['body']) return null;
    this['options'] = normalizeStoryboard3DExportOptions({ ...this['options'], ...args3 });
    const value32 = !this['root'];
    if (value32) {
      this['returnFocusElement'] = this['document']['activeElement'] || null;
      const el = this['document']['createElement']('section');
      ((el['className'] = 'storyboard-3d-export-dialog'),
        el['setAttribute']('role', 'dialog'),
        el['setAttribute']('aria-modal', 'true'),
        el['setAttribute']('aria-label', '导出 3D 分镜'),
        (el['tabIndex'] = -0x1),
        (el['dataset']['uiStop'] = '1'),
        el['addEventListener']('click', this['_handleClick']),
        el['addEventListener']('change', this['_handleChange']),
        el['addEventListener']('submit', this['_handleSubmit']),
        el['addEventListener']('keydown', this['_handleKeyDown']),
        el['addEventListener']('dragstart', this['_handleDragStart']),
        el['addEventListener']('dragover', this['_handleDragOver']),
        el['addEventListener']('dragleave', this['_handleDragLeave']),
        el['addEventListener']('drop', this['_handleDrop']),
        el['addEventListener']('dragend', this['_handleDragEnd']),
        this['document']['body']['appendChild'](el),
        (this['root'] = el));
    }
    const list17 = collectStoryboard3DProjectShots(this['getProject']?.()),
      value33 = list17['map']((value34) => value34['id']);
    return (
      (this['selectedShotIds'] = reconcileStoryboard3DExportSelection(
        this['options']['mode'],
        value33,
        value32 ? [] : this['selectedShotIds'],
      )),
      (this['gridSlots'] = createStoryboard3DExportGridSlots(
        value33,
        this['options']['gridSize'],
        value32 ? [] : this['gridSlots'],
      )),
      (this['exportDestinationOpen'] = ![]),
      this['_render'](),
      value32 &&
        focusFirstElement(this['root'], {
          preferredSelector: '[data-export-focus-key=\x22mode:current-png\x22]',
        }),
      this
    );
  }
  ['_readOptions']() {
    const includeMetadata2 = this['root']?.['querySelector']('[data-storyboard-3d-export-form]');
    if (!includeMetadata2) return this['options'];
    return normalizeStoryboard3DExportOptions({
      ...this['options'],
      includeMetadata: includeMetadata2['elements']['includeMetadata']?.['checked'],
      includeThirds: includeMetadata2['elements']['includeThirds']?.['checked'],
      videoStart: includeMetadata2['elements']['videoStart']?.['value'],
      videoEnd: includeMetadata2['elements']['videoEnd']?.['value'],
      videoTrack: includeMetadata2['elements']['videoTrack']?.['value'],
    });
  }
  ['_render']() {
    if (!this['root']) return;
    const value35 = this['document']?.['activeElement']?.['getAttribute']?.('data-export-focus-key') || '',
      shots2 = collectStoryboard3DProjectShots(this['getProject']?.());
    ((this['root']['innerHTML'] = renderOptions({
      options: this['options'],
      shots: shots2,
      objects:
        this['getProject']?.()?.['scenes']?.['find'](
          (value36) => value36['id'] === this['getProject']?.()?.['activeSceneId'],
        )?.['objects'] || [],
      selectedShotIds: this['selectedShotIds'],
      gridSlots: this['gridSlots'],
    })),
      value35 &&
        [...this['root']['querySelectorAll']('[data-export-focus-key]')]
          ['find']((value37) => value37['getAttribute']('data-export-focus-key') === value35)
          ?.['focus']?.({ preventScroll: !![] }));
  }
  ['_setProgress'](value38) {
    const el2 = this['root']?.['querySelector']('[data-storyboard-3d-export-progress]');
    if (el2) el2['textContent'] = value38;
  }
  ['_setBusy'](enabled3) {
    ((this['busy'] = enabled3), this['root']?.['setAttribute']('aria-busy', String(enabled3)));
    const el3 = this['root']?.['querySelector']('[data-storyboard-3d-export-meter]');
    el3 && ((el3['hidden'] = !enabled3), el3['removeAttribute']('value'));
    const el4 = this['root']?.['querySelector']('[data-storyboard-3d-export-action="cancel"]');
    if (el4) el4['hidden'] = !(enabled3 && this['options']['mode']['endsWith']('video'));
    this['root']
      ?.['querySelectorAll']('[data-storyboard-3d-export-submit], [data-storyboard-3d-export-start]')
      ['forEach']((el5) => {
        el5['disabled'] = enabled3;
      });
  }
  ['_setExportDestinationOpen'](value39) {
    this['exportDestinationOpen'] = Boolean(value39);
    const el6 = this['root']?.['querySelector']('[data-storyboard-3d-export-start]'),
      el7 = this['root']?.['querySelector']('[data-storyboard-3d-export-destinations]');
    el6 &&
      ((el6['hidden'] = this['exportDestinationOpen']),
      el6['setAttribute']('aria-expanded', String(this['exportDestinationOpen'])));
    if (el7) el7['hidden'] = !this['exportDestinationOpen'];
  }
  ['_handleClick'](event) {
    const enabled4 = event['target']['closest']('[data-storyboard-3d-export-action]');
    if (!enabled4 || !this['root']?.['contains'](enabled4)) return;
    const value40 = enabled4['getAttribute']('data-storyboard-3d-export-action');
    if (value40 === 'cancel') {
      this['exportAbort']?.['abort']();
      return;
    }
    if (this['busy']) return;
    if (value40 === 'close') {
      this['close']();
      return;
    }
    if (value40 === 'toggle-destinations') {
      this['_setExportDestinationOpen'](!this['exportDestinationOpen']);
      this['exportDestinationOpen'] &&
        this['root']?.['querySelector']('[data-export-focus-key="destination:local"]')?.['focus']?.();
      return;
    }
    if (value40 === 'set-option') {
      const value41 = enabled4['getAttribute']('data-storyboard-3d-export-option'),
        value42 = enabled4['getAttribute']('data-storyboard-3d-export-value'),
        value43 = value41 === 'gridSize' ? Number(value42) : value42;
      this['options'] = normalizeStoryboard3DExportOptions({
        ...this['_readOptions'](),
        [value41]: value43,
      });
      const list18 = collectStoryboard3DProjectShots(this['getProject']?.()),
        value44 = list18['map']((value45) => value45['id']);
      value41 === 'mode' &&
        (this['selectedShotIds'] = reconcileStoryboard3DExportSelection(
          this['options']['mode'],
          value44,
          this['selectedShotIds'],
        ));
      ((this['gridSlots'] = createStoryboard3DExportGridSlots(
        value44,
        this['options']['gridSize'],
        value41 === 'gridSize' ? [] : this['gridSlots'],
      )),
        (this['exportDestinationOpen'] = ![]),
        this['_render']());
      return;
    }
    if (value40 === 'toggle-shot') {
      const value46 = String(enabled4['getAttribute']('data-storyboard-3d-export-shot-id') || ''),
        list19 = collectStoryboard3DProjectShots(this['getProject']?.());
      if (this['options']['mode'] === 'sequence-png' || this['options']['mode'] === 'sequence-video') {
        const map6 = new Set(this['selectedShotIds']);
        if (map6['has'](value46)) map6['delete'](value46);
        else map6['add'](value46);
        this['selectedShotIds'] = list19['map']((value47) => value47['id'])['filter']((value48) =>
          map6['has'](value48),
        );
      } else this['options']['mode'] !== 'grid-png' && (this['selectedShotIds'] = [value46]);
      ((this['exportDestinationOpen'] = ![]), this['_render']());
      return;
    }
    if (value40 === 'toggle-all-shots') {
      if (!['sequence-png', 'sequence-video']['includes'](this['options']['mode'])) return;
      const list20 = collectStoryboard3DProjectShots(this['getProject']?.());
      ((this['selectedShotIds'] =
        this['selectedShotIds']['length'] === list20['length']
          ? []
          : list20['map']((value49) => value49['id'])),
        (this['exportDestinationOpen'] = ![]),
        this['_render']());
    }
  }
  ['_handleChange']() {
    if (this['busy']) return;
    this['options'] = this['_readOptions']();
  }
  ['_readDragPayload'](value50) {
    if (this['dragState']?.['shotId']) return this['dragState'];
    try {
      const value51 = value50?.['dataTransfer']?.['getData']?.('application/x-storyboard3d-export-shot');
      return value51 ? JSON['parse'](value51) : null;
    } catch {
      return null;
    }
  }
  ['_handleDragStart'](event2) {
    const value52 = event2['target']['closest']('[data-storyboard-3d-export-grid-slot]'),
      value53 = event2['target']['closest']('[data-storyboard-3d-export-drag-shot-id]'),
      sourceIndex2 = value52 ? Number(value52['getAttribute']('data-storyboard-3d-export-grid-slot')) : -0x1,
      shotId2 = value52
        ? this['gridSlots'][sourceIndex2]
        : value53?.['getAttribute']('data-storyboard-3d-export-drag-shot-id') || '';
    if (!shotId2) {
      event2['preventDefault']();
      return;
    }
    ((this['dragState'] = { shotId: shotId2, sourceIndex: sourceIndex2 }),
      event2['dataTransfer']?.['setData']?.(
        'application/x-storyboard3d-export-shot',
        JSON['stringify'](this['dragState']),
      ));
    if (event2['dataTransfer'])
      event2['dataTransfer']['effectAllowed'] = sourceIndex2 >= 0x0 ? 'move' : 'copy';
  }
  ['_handleDragOver'](event3) {
    const el8 = event3['target']['closest']('[data-storyboard-3d-export-grid-slot]');
    if (!el8 || !this['root']?.['contains'](el8)) return;
    (event3['preventDefault'](),
      this['root']
        ['querySelectorAll']('.storyboard-3d-export-grid-slot.is-drop-target')
        ['forEach']((el9) => el9['classList']['remove']('is-drop-target')),
      el8['classList']['add']('is-drop-target'));
    if (event3['dataTransfer'])
      event3['dataTransfer']['dropEffect'] = this['dragState']?.['sourceIndex'] >= 0x0 ? 'move' : 'copy';
  }
  ['_handleDragLeave'](event4) {
    const el10 = event4['target']['closest']('[data-storyboard-3d-export-grid-slot]');
    if (!el10 || el10['contains'](event4['relatedTarget'])) return;
    el10['classList']['remove']('is-drop-target');
  }
  ['_handleDrop'](event5) {
    const enabled5 = event5['target']['closest']('[data-storyboard-3d-export-grid-slot]');
    if (!enabled5 || !this['root']?.['contains'](enabled5)) return;
    event5['preventDefault']();
    const shotId3 = this['_readDragPayload'](event5),
      targetIndex2 = Number(enabled5['getAttribute']('data-storyboard-3d-export-grid-slot'));
    if (!shotId3?.['shotId'] || !Number['isInteger'](targetIndex2)) return;
    ((this['gridSlots'] = placeStoryboard3DShotInGrid(this['gridSlots'], {
      shotId: shotId3['shotId'],
      sourceIndex: Number(shotId3['sourceIndex']),
      targetIndex: targetIndex2,
    })),
      (this['dragState'] = null),
      (this['exportDestinationOpen'] = ![]),
      this['_render']());
  }
  ['_handleDragEnd']() {
    ((this['dragState'] = null),
      this['root']
        ?.['querySelectorAll']('.storyboard-3d-export-grid-slot.is-drop-target')
        ['forEach']((el11) => el11['classList']['remove']('is-drop-target')));
  }
  ['_handleKeyDown'](event6) {
    if (event6['key'] === 'Escape') {
      (event6['preventDefault'](), event6['stopPropagation'](), this['close']());
      return;
    }
    trapTabKey(event6, this['root'], this['document']);
  }
  async ['_handleSubmit'](event7) {
    event7['preventDefault']();
    if (this['busy']) return;
    const returnToCanvas =
      event7['submitter']?.['getAttribute']?.('data-storyboard-3d-export-destination') === 'canvas'
        ? 'canvas'
        : 'local';
    (this['_setExportDestinationOpen'](![]), (this['options'] = this['_readOptions']()));
    const project = this['getProject']?.(),
      list21 = collectStoryboard3DProjectShots(project),
      map7 = new Map(list21['map']((value54) => [value54['id'], value54])),
      value55 = this['selectedShotIds']['map']((value56) => map7['get'](value56))['filter'](Boolean),
      enabled6 = this['options']['mode']['startsWith']('current-'),
      shots3 =
        this['options']['mode'] === 'grid-png'
          ? this['gridSlots']['map']((value57) => map7['get'](value57) || null)
          : enabled6
            ? [value55[0x0]]['filter'](Boolean)
            : value55;
    if (!shots3['some'](Boolean)) {
      this['_setProgress']('请先选择至少一个要导出的镜头。');
      return;
    }
    if (typeof this['renderFrame'] !== 'function') {
      this['_setProgress']('3D 离屏渲染器尚未就绪。');
      return;
    }
    const args4 = { ...this['options'] },
      kind = args4['mode']['endsWith']('video');
    if (kind && typeof this['renderVideo'] !== 'function') {
      this['_setProgress']('视频渲染器尚未就绪。');
      return;
    }
    const signal = new AbortController();
    ((this['exportAbort'] = signal), this['_setBusy'](!![]), this['_setProgress']('正在准备离屏渲染…'));
    try {
      const args5 = {
        renderFrame: this['renderFrame'],
        aspectRatio: this['options']['aspectRatio'],
        resolution: this['options']['resolution'],
        includeThirds: this['options']['includeThirds'],
        includeDescription: this['options']['includeMetadata'],
        includeShotNumber: this['options']['includeMetadata'],
        includeShotAngle: this['options']['includeMetadata'],
        includeFocalLength: this['options']['includeMetadata'],
        metadataHeight: this['options']['includeMetadata'] && !enabled6 ? undefined : 0x0,
        onProgress: ({ stage: stage, current: current2, total: total }) => {
          if (stage === 'encoding') this['_setProgress']('正在编码图片…');
          else {
            if (stage === 'rendering') this['_setProgress']('正在渲染 ' + current2 + ' / ' + total);
          }
        },
      };
      let mimeType = this['options']['mode'] === 'current-jpeg' ? 'image/jpeg' : 'image/png';
      const results = kind
        ? [
            await this['renderVideo'](shots3[0x0], {
              ...args4,
              shots: shots3,
              signal: signal['signal'],
              onProgress: ({ current: current3, total: total2 }) => {
                if (this['exportAbort'] !== signal) return;
                this['_setProgress'](
                  '正在录制 ' + current3['toFixed'](0x1) + ' / ' + total2['toFixed'](0x1) + '\x20秒',
                );
                const el12 = this['root']?.['querySelector']('[data-storyboard-3d-export-meter]');
                el12 && ((el12['max'] = total2), (el12['value'] = current3));
              },
            }),
          ]
        : this['options']['mode'] === 'sequence-png'
          ? await renderStoryboardSequence({ shots: shots3, ...args5, mimeType: mimeType })
          : [
              await renderStoryboardGrid({
                shots: shots3,
                ...args5,
                mimeType: mimeType,
                columns:
                  this['options']['mode'] === 'grid-png' ? Math['sqrt'](this['options']['gridSize']) : 0x1,
              }),
            ];
      if (signal['signal']['aborted']) throw new DOMException('已取消导出', 'AbortError');
      const el13 = this['root']?.['querySelector']('[data-storyboard-3d-export-action=\x22cancel\x22]');
      if (el13) el13['hidden'] = !![];
      if (kind) mimeType = results[0x0]['blob']['type'];
      const value58 = kind
        ? mimeType === 'video/mp4'
          ? 'mp4'
          : 'webm'
        : mimeType === 'image/jpeg'
          ? 'jpg'
          : 'png';
      if (returnToCanvas === 'local') {
        const value59 = results['map']((blob2, value60) => {
            const value61 = results['length'] > 0x1 ? '-' + String(value60 + 0x1)['padStart'](0x2, '0') : '';
            return {
              kind: kind ? 'video' : 'image',
              blob: blob2['blob'],
              filename: '' + safeFileName(project?.['name']) + value61 + '.' + value58,
            };
          }),
          value62 = await this['downloadResults'](value59, {
            documentObject: this['document'],
            windowObject: this['window'],
          });
        if (value62?.['canceled']) {
          this['_setProgress']('已取消保存。');
          return;
        }
      }
      if (signal['signal']['aborted']) throw new DOMException('已取消导出', 'AbortError');
      (await this['onComplete']?.({
        project: project,
        options: {
          ...args4,
          returnToCanvas: returnToCanvas === 'canvas',
          destination: returnToCanvas,
          selectedShotIds: [...this['selectedShotIds']],
          gridSlots: [...this['gridSlots']],
        },
        results: results,
      }),
        this['_setProgress'](
          returnToCanvas === 'canvas'
            ? '已将导出结果发送到画布。'
            : '已导出到本地，共 ' + results['length'] + '\x20个文件。',
        ));
    } catch (error5) {
      if (this['exportAbort'] !== signal) return;
      this['_setProgress'](
        error5?.['name'] === 'AbortError'
          ? '已取消导出。'
          : '导出失败：' + (error5?.['message'] || String(error5)),
      );
    } finally {
      this['exportAbort'] === signal && (this['_setBusy'](![]), (this['exportAbort'] = null));
    }
  }
  ['close']() {
    if (this['busy'] || !this['root']) return ![];
    const value63 = this['returnFocusElement'];
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
      restoreFocus(value63, this['document']),
      !![]
    );
  }
  ['destroy']() {
    return (this['exportAbort']?.['abort'](), (this['busy'] = ![]), this['close']());
  }
}
export function createStoryboard3DExportController(options3 = {}) {
  return new Storyboard3DExportController(options3);
}
