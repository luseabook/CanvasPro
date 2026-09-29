import {
  STORYBOARD_3D_OBJECT_ANIMATION_PROPERTIES,
  getStoryboard3DObjectAnimationTrack,
  normalizeStoryboard3DShotAnimation,
  removeStoryboard3DAnimationKeyframe,
  sampleStoryboard3DShotAnimation,
  updateStoryboard3DShotAnimationSettings,
  upsertStoryboard3DCameraKeyframe,
  upsertStoryboard3DObjectKeyframe,
} from './shotAnimation.js';
import { syncStoryboard3DCameraObjectFromShot } from './projectModel.js';
import { DirectorTimelinePanel } from './directorTimelinePanel.js';
import { TimelineKeyframeDrag } from './timelineKeyframeDrag.js';
import { DirectorCameraPathController } from './directorCameraPathController.js';
import { DirectorTimelineEditing } from './directorTimelineEditing.js';
import { renderDirectorCameraKeyEditor } from './directorCameraKeyEditor.js';
import { DirectorClipTimeline } from './directorClipTimeline.js';
import { DirectorMultiView } from './directorMultiView.js';
const PROPERTY_LABELS = Object['freeze']({ position: '位置', rotation: '旋转', scale: '缩放' }),
  TOOL_PROPERTIES = Object['freeze']({ move: 'position', rotate: 'rotation', scale: 'scale' });
function escapeHtml(_0x31288e) {
  return String(_0x31288e ?? '')
    ['replace'](/&/g, '&amp;')
    ['replace'](/</g, '&lt;')
    ['replace'](/>/g, '&gt;')
    ['replace'](/"/g, '&quot;')
    ['replace'](/'/g, '&#39;');
}
function clamp(_0x2773f5, _0xc67e36, _0x15dd9d) {
  return Math['min'](_0x15dd9d, Math['max'](_0xc67e36, Number(_0x2773f5) || 0x0));
}
function getSceneContext(_0x3efd66) {
  const _0x4651ce = Array['isArray'](_0x3efd66?.['scenes']) ? _0x3efd66['scenes'] : [],
    _0x5cf3c0 =
      _0x4651ce['find']((_0x435803) => _0x435803['id'] === _0x3efd66?.['activeSceneId']) ||
      _0x4651ce[0x0] ||
      null,
    _0x47a400 = Array['isArray'](_0x5cf3c0?.['shots']) ? _0x5cf3c0['shots'] : [],
    _0x1d2ab0 =
      _0x47a400['find']((_0x48b211) => _0x48b211['id'] === _0x5cf3c0?.['activeShotId']) ||
      _0x47a400[0x0] ||
      null;
  return { scene: _0x5cf3c0, shot: _0x1d2ab0 };
}
function createObjectTransforms(_0xa5e4d8) {
  return Object['fromEntries'](
    (_0xa5e4d8?.['objects'] || [])['map']((_0x3d0508) => [_0x3d0508['id'], _0x3d0508['transform']]),
  );
}
function cloneCameraState(_0x53053d) {
  return { ..._0x53053d, position: [..._0x53053d['position']], target: [..._0x53053d['target']] };
}
function normalizeAnimation(_0x60bf4d, _0x208e3a) {
  return normalizeStoryboard3DShotAnimation(_0x208e3a?.['animation'], {
    camera: _0x208e3a?.['camera'],
    objectIds: new Set((_0x60bf4d?.['objects'] || [])['map']((_0x45d0f6) => _0x45d0f6['id'])),
    objectTransforms: createObjectTransforms(_0x60bf4d),
  });
}
function getKeyframeCount(_0x216d82) {
  return (
    _0x216d82['cameraKeyframes']['length'] +
    _0x216d82['objectTracks']['reduce'](
      (_0x24c96d, _0x3f7b43) =>
        _0x24c96d +
        STORYBOARD_3D_OBJECT_ANIMATION_PROPERTIES['reduce'](
          (_0x2a9eb4, _0x1a18c4) => _0x2a9eb4 + _0x3f7b43[_0x1a18c4 + 'Keyframes']['length'],
          0x0,
        ),
      0x0,
    )
  );
}
function formatFrameTime(_0x3179b0, _0x59f0d6) {
  return Math['round'](_0x3179b0 * _0x59f0d6) + 'f';
}
function renderKeyframes(_0x2015fe, _0x3c119d, _0x19af2a = {}) {
  return _0x2015fe['map']((_0xd64bbb) => {
    const _0x21beac = _0x3c119d['duration'] > 0x0 ? (_0xd64bbb['time'] / _0x3c119d['duration']) * 0x64 : 0x0,
      _0x4a06a0 = _0x19af2a['keyframeId'] === _0xd64bbb['id'];
    return (
      '<button type="button" class="storyboard-3d-timeline-keyframe ' +
      (_0x4a06a0 ? 'is-selected' : '') +
      '" style="--storyboard-3d-keyframe-position:' +
      _0x21beac +
      '%\x22\x20data-storyboard-3d-action=\x22timeline-select-keyframe\x22\x20data-keyframe-id=\x22' +
      escapeHtml(_0xd64bbb['id']) +
      '" data-keyframe-type="' +
      escapeHtml(_0x19af2a['type'] || '') +
      '" data-object-id="' +
      escapeHtml(_0x19af2a['objectId'] || '') +
      '" data-property="' +
      escapeHtml(_0x19af2a['property'] || '') +
      '" data-keyframe-time="' +
      _0xd64bbb['time'] +
      '" aria-label="关键帧 ' +
      _0xd64bbb['time']['toFixed'](0x2) +
      '\x20秒，第\x20' +
      formatFrameTime(_0xd64bbb['time'], _0x3c119d['fps']) +
      '" title="' +
      _0xd64bbb['time']['toFixed'](0x2) +
      's · ' +
      formatFrameTime(_0xd64bbb['time'], _0x3c119d['fps']) +
      '"></button>'
    );
  })['join']('');
}
function renderPropertyLinks(_0x898164, _0x14b9f1) {
  return STORYBOARD_3D_OBJECT_ANIMATION_PROPERTIES['map'](
    (_0x11c9b9) =>
      '<button type="button" class="storyboard-3d-timeline-property-link ' +
      (_0x14b9f1 === _0x11c9b9 ? 'is-active' : '') +
      '" data-storyboard-3d-action="timeline-set-object-property" data-object-id="' +
      escapeHtml(_0x898164) +
      '\x22\x20data-property=\x22' +
      _0x11c9b9 +
      '\x22>' +
      PROPERTY_LABELS[_0x11c9b9] +
      '</button>',
  )['join']('<span aria-hidden="true">/</span>');
}
function renderAddKeyframeButton({
  action: _0x4d7630,
  label: _0x390688,
  objectId: objectId = '',
  property: property = '',
}) {
  return (
    '<button type="button" class="storyboard-3d-timeline-row-add" data-storyboard-3d-action="' +
    _0x4d7630 +
    '\x22\x20data-object-id=\x22' +
    escapeHtml(objectId) +
    '" data-property="' +
    escapeHtml(property) +
    '\x22\x20aria-label=\x22为' +
    escapeHtml(_0x390688) +
    '添加关键帧" title="为' +
    escapeHtml(_0x390688) +
    '添加关键帧">+</button>'
  );
}
function renderTimelineLane({
  animation: _0x27ac1b,
  keyframes: _0x5911ed,
  selection: _0x35f36a,
  className: className = '',
  label: _0x537fdb,
}) {
  return (
    '<div\x20class=\x22storyboard-3d-timeline-lane\x20' +
    className +
    '" data-timeline-lane-label="' +
    escapeHtml(_0x537fdb || '') +
    '\x22>\x0a\x20\x20\x20\x20<span\x20class=\x22storyboard-3d-timeline-lane-line\x22\x20aria-hidden=\x22true\x22></span>\x0a\x20\x20\x20\x20' +
    renderKeyframes(_0x5911ed, _0x27ac1b, _0x35f36a) +
    '\n  </div>'
  );
}
function renderCameraTrack(_0x27a6dd, _0x5d089d) {
  return (
    '<div class="storyboard-3d-timeline-row is-camera">\n    <div class="storyboard-3d-timeline-track-label">\n      <div><strong>摄像机</strong><small>位置 / 目标 / 焦距</small></div>\n      ' +
    renderAddKeyframeButton({ action: 'timeline-add-camera-keyframe', label: '摄像机' }) +
    '\n    </div>\n    ' +
    renderTimelineLane({
      animation: _0x27a6dd,
      keyframes: _0x27a6dd['cameraKeyframes'],
      selection: { ..._0x5d089d, type: 'camera' },
      className: 'is-camera',
      label: '摄像机',
    }) +
    '\n  </div>'
  );
}
function renderObjectTrack({
  object: _0x2e31d9,
  animation: _0x39447c,
  activeProperty: _0x209931,
  expanded: _0x848f09,
  selected: _0xf941c9,
  selectedKeyframe: _0x345382,
}) {
  const _0x3ec927 = getStoryboard3DObjectAnimationTrack(_0x39447c, _0x2e31d9['id']) || {
      positionKeyframes: [],
      rotationKeyframes: [],
      scaleKeyframes: [],
    },
    _0xee3e87 = _0x2e31d9['name'] + '\x20·\x20' + PROPERTY_LABELS[_0x209931],
    _0x527bf2 =
      '<div class="storyboard-3d-timeline-object-summary ' +
      (_0xf941c9 ? 'is-selected' : '') +
      '">\n    <button type="button" class="storyboard-3d-timeline-disclosure ' +
      (_0x848f09 ? 'is-expanded' : '') +
      '" data-storyboard-3d-action="timeline-toggle-object" data-object-id="' +
      escapeHtml(_0x2e31d9['id']) +
      '" aria-label="' +
      (_0x848f09 ? '折叠' : '展开') +
      escapeHtml(_0x2e31d9['name']) +
      '轨道" aria-expanded="' +
      _0x848f09 +
      '\x22>' +
      (_0x848f09 ? '折叠' : '展开') +
      '</button>\n    <div><strong>' +
      escapeHtml(_0x2e31d9['name']) +
      '</strong><span>' +
      renderPropertyLinks(_0x2e31d9['id'], _0x209931) +
      '</span></div>\n    ' +
      (_0x848f09
        ? ''
        : renderAddKeyframeButton({
            action: 'timeline-add-object-keyframe',
            label: _0xee3e87,
            objectId: _0x2e31d9['id'],
            property: _0x209931,
          })) +
      '\n  </div>';
  if (!_0x848f09)
    return (
      '<div class="storyboard-3d-timeline-row is-object is-' +
      _0x209931 +
      '\x20' +
      (_0xf941c9 ? 'is-selected' : '') +
      '">\n      ' +
      _0x527bf2 +
      '\n      ' +
      renderTimelineLane({
        animation: _0x39447c,
        keyframes: _0x3ec927[_0x209931 + 'Keyframes'],
        selection: { ..._0x345382, type: 'object', objectId: _0x2e31d9['id'], property: _0x209931 },
        className: 'is-' + _0x209931,
        label: _0xee3e87,
      }) +
      '\n    </div>'
    );
  const _0x4fc92f = STORYBOARD_3D_OBJECT_ANIMATION_PROPERTIES['map'](
    (_0x4d067e) =>
      '<div class="storyboard-3d-timeline-row is-object-property is-' +
      _0x4d067e +
      '">\n      <div class="storyboard-3d-timeline-property-label"><span aria-hidden="true"></span>' +
      PROPERTY_LABELS[_0x4d067e] +
      renderAddKeyframeButton({
        action: 'timeline-add-object-keyframe',
        label: _0x2e31d9['name'] + '\x20·\x20' + PROPERTY_LABELS[_0x4d067e],
        objectId: _0x2e31d9['id'],
        property: _0x4d067e,
      }) +
      '</div>\n      ' +
      renderTimelineLane({
        animation: _0x39447c,
        keyframes: _0x3ec927[_0x4d067e + 'Keyframes'],
        selection: { ..._0x345382, type: 'object', objectId: _0x2e31d9['id'], property: _0x4d067e },
        className: 'is-' + _0x4d067e,
        label: _0x2e31d9['name'] + ' · ' + PROPERTY_LABELS[_0x4d067e],
      }) +
      '\n    </div>',
  )['join']('');
  return (
    '<div\x20class=\x22storyboard-3d-timeline-object-group\x20' +
    (_0xf941c9 ? 'is-selected' : '') +
    '">\n    <div class="storyboard-3d-timeline-row is-object-summary">' +
    _0x527bf2 +
    '<div class="storyboard-3d-timeline-lane is-summary"></div></div>\n    ' +
    _0x4fc92f +
    '\n  </div>'
  );
}
function renderRuler(_0x587d4b, _0x150e58) {
  const _0x527620 = 0x6,
    _0x231a84 = Array['from']({ length: _0x527620 + 0x1 }, (_0x5d0002, _0x2895c8) => {
      const _0x3c1d53 = (_0x587d4b['duration'] * _0x2895c8) / _0x527620;
      return (
        '<span style="--storyboard-3d-tick-position:' +
        (_0x2895c8 / _0x527620) * 0x64 +
        '%\x22><strong>' +
        _0x3c1d53['toFixed'](_0x3c1d53 % 0x1 === 0x0 ? 0x0 : 0x1) +
        's</strong><small>' +
        formatFrameTime(_0x3c1d53, _0x587d4b['fps']) +
        '</small></span>'
      );
    })['join']('');
  return (
    '<div class="storyboard-3d-timeline-row is-ruler">\n    <div class="storyboard-3d-timeline-ruler-label">轨道</div>\n    <div class="storyboard-3d-timeline-ruler">\n      ' +
    _0x231a84 +
    '\x0a\x20\x20\x20\x20\x20\x20<input\x20type=\x22range\x22\x20min=\x220\x22\x20max=\x22' +
    _0x587d4b['duration'] +
    '\x22\x20step=\x22' +
    0x1 / _0x587d4b['fps'] +
    '" value="' +
    _0x150e58 +
    '" data-storyboard-3d-timeline-scrubber aria-label="镜头动画播放头">\n    </div>\n  </div>'
  );
}
function findSelectedKeyframe(_0x450898, _0x45b3c5) {
  if (!_0x45b3c5?.['keyframeId']) return null;
  if (_0x45b3c5['type'] === 'camera') {
    const _0x752724 = _0x450898['cameraKeyframes']['find'](
      (_0x1eb9c3) => _0x1eb9c3['id'] === _0x45b3c5['keyframeId'],
    );
    return _0x752724 ? { ..._0x45b3c5, keyframe: _0x752724 } : null;
  }
  const _0x3c8eac = _0x450898['objectTracks']['find'](
      (_0xe66ea3) => _0xe66ea3['objectId'] === _0x45b3c5['objectId'],
    ),
    _0x520dfd = _0x3c8eac?.[_0x45b3c5['property'] + 'Keyframes']?.['find'](
      (_0x2c6079) => _0x2c6079['id'] === _0x45b3c5['keyframeId'],
    );
  return _0x520dfd ? { ..._0x45b3c5, keyframe: _0x520dfd } : null;
}
function renderSelectedKeyframeEditor(_0x21952f, _0x4f381f, _0x1fa498) {
  const _0x21a4e2 = findSelectedKeyframe(_0x21952f, _0x4f381f);
  if (!_0x21a4e2)
    return '<footer class="storyboard-3d-timeline-key-editor is-empty"><span>选择关键帧后可编辑数值与缓动</span></footer>';
  const { keyframe: _0x5a45fe } = _0x21a4e2,
    _0x21ebd5 =
      '<label class="storyboard-3d-timeline-easing">时间 / 秒<input type="number" min="0" max="3600" step="' +
      0x1 / _0x21952f['fps'] +
      '" value="' +
      _0x5a45fe['time'] +
      '" data-storyboard-3d-timeline-key-time></label><button type="button" data-storyboard-3d-action="timeline-copy-keyframe">复制到播放头</button>',
    _0x7aabd6 = _0x1fa498?.['objects']?.['find']((_0x8298f2) => _0x8298f2['id'] === _0x21a4e2['objectId']);
  if (_0x21a4e2['type'] === 'camera')
    return (
      '<footer class="storyboard-3d-timeline-key-editor">\n      <strong>摄像机关键帧</strong><span>' +
      _0x5a45fe['time']['toFixed'](0x2) +
      's · ' +
      formatFrameTime(_0x5a45fe['time'], _0x21952f['fps']) +
      '</span>\x0a\x20\x20\x20\x20\x20\x20<span>焦距\x20' +
      Number(_0x5a45fe['camera']['focalLength'])['toFixed'](0x1) +
      'mm</span>\n      ' +
      renderDirectorCameraKeyEditor(_0x5a45fe) +
      '\x0a\x20\x20\x20\x20\x20\x20' +
      _0x21ebd5 +
      '\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20data-storyboard-3d-action=\x22timeline-delete-keyframe\x22>删除关键帧</button>\x0a\x20\x20\x20\x20</footer>'
    );
  const _0x19319d = _0x21a4e2['property'] === 'rotation';
  return (
    '<footer\x20class=\x22storyboard-3d-timeline-key-editor\x22\x20data-selected-object-id=\x22' +
    escapeHtml(_0x21a4e2['objectId']) +
    '" data-selected-property="' +
    _0x21a4e2['property'] +
    '">\n    <strong>' +
    escapeHtml(_0x7aabd6?.['name'] || _0x21a4e2['objectId']) +
    ' · ' +
    PROPERTY_LABELS[_0x21a4e2['property']] +
    '</strong>\n    <span>' +
    _0x5a45fe['time']['toFixed'](0x2) +
    's · ' +
    formatFrameTime(_0x5a45fe['time'], _0x21952f['fps']) +
    '</span>\n    ' +
    _0x21ebd5 +
    '\n    <div class="storyboard-3d-timeline-key-values">' +
    ['X', 'Y', 'Z']
      ['map'](
        (_0x585521, _0x19de32) =>
          '<label><span>' +
          _0x585521 +
          (_0x19319d ? '°' : '') +
          '</span><input type="number" step="' +
          (_0x19319d ? '1' : '0.01') +
          '\x22\x20value=\x22' +
          (_0x19319d
            ? (Number(_0x5a45fe['value'][_0x19de32]) * 0xb4) / Math['PI']
            : Number(_0x5a45fe['value'][_0x19de32]))['toFixed'](_0x19319d ? 0x1 : 0x2) +
          '\x22\x20data-storyboard-3d-timeline-key-value=\x22' +
          _0x19de32 +
          '"></label>',
      )
      ['join']('') +
    '</div>\n    <label class="storyboard-3d-timeline-easing"><span>缓动</span><select data-storyboard-3d-timeline-key-easing>' +
    [
      ['linear', '线性'],
      ['ease-in', '渐入'],
      ['ease-out', '渐出'],
      ['ease-in-out', '渐入渐出'],
    ]
      ['map'](
        ([_0x2c4473, _0x19d1d4]) =>
          '<option\x20value=\x22' +
          _0x2c4473 +
          '\x22\x20' +
          (_0x5a45fe['easing'] === _0x2c4473 ? 'selected' : '') +
          '>' +
          _0x19d1d4 +
          '</option>',
      )
      ['join']('') +
    '</select></label>\n    <button type="button" data-storyboard-3d-action="timeline-delete-keyframe">删除关键帧</button>\n  </footer>'
  );
}
export function renderStoryboard3DShotTimeline({
  scene: _0x22ab9,
  shot: _0x24d7d9,
  selectedObjectIds: selectedObjectIds = [],
  activeTool: activeTool = 'select',
  currentTime: currentTime = 0x0,
  playing: playing = ![],
  autoKey: autoKey = ![],
  expandedObjectIds: expandedObjectIds = new Set(),
  activeProperties: activeProperties = new Map(),
  selectedKeyframe: selectedKeyframe = null,
  directorPanel: directorPanel = '',
  editingToolbar: editingToolbar = '',
  clipTracks: clipTracks = '',
} = {}) {
  if (!_0x22ab9 || !_0x24d7d9) return '';
  const _0x245a0e = normalizeAnimation(_0x22ab9, _0x24d7d9),
    _0x36f9be = clamp(currentTime, 0x0, _0x245a0e['duration']),
    _0x478142 = selectedObjectIds['at'](-0x1) || '',
    _0xee9b7 = (_0x22ab9['objects'] || [])['filter'](
      (_0x2924b8) =>
        _0x2924b8['visible'] !== ![] && _0x2924b8['type'] !== 'group' && _0x2924b8['type'] !== 'camera',
    ),
    _0x5bf20c = _0xee9b7['map']((_0x19f357) =>
      renderObjectTrack({
        object: _0x19f357,
        animation: _0x245a0e,
        activeProperty: activeProperties['get'](_0x19f357['id']) || TOOL_PROPERTIES[activeTool] || 'position',
        expanded: expandedObjectIds['has'](_0x19f357['id']),
        selected: _0x19f357['id'] === _0x478142,
        selectedKeyframe: selectedKeyframe,
      }),
    )['join'](''),
    _0x4bdfa5 = _0x245a0e['duration'] > 0x0 ? (_0x36f9be / _0x245a0e['duration']) * 0x64 : 0x0,
    _0x131df7 = Math['round'](_0x245a0e['duration'] * _0x245a0e['fps']);
  return (
    '<section\x20class=\x22storyboard-3d-shot-timeline\x20' +
    (playing ? 'is-playing' : '') +
    '" data-storyboard-3d-shot-timeline data-shot-id="' +
    escapeHtml(_0x24d7d9['id']) +
    '\x22\x20style=\x22--storyboard-3d-playhead-position:' +
    _0x4bdfa5 +
    '%">\n    <header class="storyboard-3d-timeline-toolbar">\n      <div class="storyboard-3d-timeline-playback">\n        <button type="button" data-storyboard-3d-action="timeline-go-start">首帧</button>\n        <button type="button" class="storyboard-3d-timeline-play" data-storyboard-3d-action="timeline-toggle-play">' +
    (playing ? '暂停' : '播放') +
    '</button>\n        <button type="button" data-storyboard-3d-action="timeline-go-end">末帧</button>\n      </div>\n      <output data-storyboard-3d-timeline-frame>' +
    Math['round'](_0x36f9be * _0x245a0e['fps']) +
    'f</output><span>/ ' +
    _0x131df7 +
    'f</span>\n      <label><span>时长</span><input type="number" min="0.1" max="3600" step="0.5" value="' +
    _0x245a0e['duration'] +
    '\x22\x20data-storyboard-3d-timeline-setting=\x22duration\x22></label>\x0a\x20\x20\x20\x20\x20\x20<label><span>FPS</span><select\x20data-storyboard-3d-timeline-setting=\x22fps\x22>' +
    [0xc, 0x18, 0x19, 0x1e, 0x32, 0x3c]
      ['map'](
        (_0x8c3a5a) =>
          '<option\x20value=\x22' +
          _0x8c3a5a +
          '\x22\x20' +
          (_0x245a0e['fps'] === _0x8c3a5a ? 'selected' : '') +
          '>' +
          _0x8c3a5a +
          '</option>',
      )
      ['join']('') +
    '</select></label>\x0a\x20\x20\x20\x20\x20\x20<label\x20class=\x22storyboard-3d-timeline-auto-key\x22><input\x20type=\x22checkbox\x22\x20data-storyboard-3d-timeline-auto-key\x20' +
    (autoKey ? 'checked' : '') +
    '><span>自动 K 帧</span></label>\n      <label><input type="checkbox" data-storyboard-3d-timeline-setting="loop" ' +
    (_0x245a0e['loop'] ? 'checked' : '') +
    '>循环</label>\n      <button type="button" data-storyboard-3d-action="timeline-director-toggle" aria-expanded="' +
    Boolean(directorPanel) +
    '">导演编排</button>\n      <strong>当前镜头独立时间轴 · ' +
    escapeHtml(_0x24d7d9['name']) +
    '</strong>\n      <small>' +
    getKeyframeCount(_0x245a0e) +
    ' 个关键帧</small>\n    </header>\n    <div class="storyboard-3d-timeline-grid">' +
    editingToolbar +
    '\n      ' +
    directorPanel +
    '\n      <div class="storyboard-3d-timeline-tracks">\n      ' +
    renderRuler(_0x245a0e, _0x36f9be) +
    '\n      ' +
    renderCameraTrack(_0x245a0e, selectedKeyframe) +
    '\n      ' +
    clipTracks +
    '\n      ' +
    (_0x5bf20c ||
      '<div\x20class=\x22storyboard-3d-timeline-empty\x22>选择或添加模型后即可创建变换关键帧</div>') +
    '\n      <div class="storyboard-3d-timeline-playhead" aria-hidden="true"><span></span></div>\n      </div>\n    </div>\n    ' +
    renderSelectedKeyframeEditor(_0x245a0e, selectedKeyframe, _0x22ab9) +
    '\n  </section>'
  );
}
export class Storyboard3DShotTimelineController {
  constructor({
    windowObject: windowObject = globalThis['window'],
    getProject: _0x9e7b9e,
    getEditorState: _0x2d4cc3,
    getRoot: _0x2e02f3,
    getRuntime: _0x2b1d6c,
    getBinaryAssetRepository: _0x1bd5cc,
    getImportedModel: _0x4f84c9,
    importProject: _0xbef435,
    sendResults: _0x194c67,
    getGenerationContext: _0x48b444,
    requestGeneration: _0x1275af,
    readCurrentCamera: _0x19bfa0,
    previewSample: _0x5f1dde,
    clearPreview: _0x5ab31f,
    commitMutation: _0x4ae574,
    requestRender: _0x25b5d4,
    expandDirectorPanel: _0x40dedf,
    setMessage: _0x4ae241,
  } = {}) {
    ((this['window'] = windowObject),
      (this['getProject'] = _0x9e7b9e),
      (this['getEditorState'] = _0x2d4cc3),
      (this['getRoot'] = _0x2e02f3),
      (this['getRuntime'] = _0x2b1d6c),
      (this['getBinaryAssetRepository'] = _0x1bd5cc),
      (this['getImportedModel'] = _0x4f84c9),
      (this['importProject'] = _0xbef435),
      (this['sendResults'] = _0x194c67),
      (this['getGenerationContext'] = _0x48b444),
      (this['requestGeneration'] = _0x1275af),
      (this['readCurrentCamera'] = _0x19bfa0),
      (this['previewSample'] = _0x5f1dde),
      (this['clearPreview'] = _0x5ab31f),
      (this['commitMutation'] = _0x4ae574),
      (this['requestRender'] = _0x25b5d4),
      (this['expandDirectorPanel'] = _0x40dedf),
      (this['setMessage'] = _0x4ae241),
      (this['currentTimes'] = new Map()),
      (this['activeProperties'] = new Map()),
      (this['expandedObjectIds'] = new Set()),
      (this['selectedKeyframe'] = null),
      (this['drawerOpen'] = ![]),
      (this['autoKey'] = ![]),
      (this['playing'] = ![]),
      (this['playbackFrame'] = null),
      (this['playbackStartedAt'] = 0x0),
      (this['playbackStartTime'] = 0x0),
      (this['activeShotId'] = ''),
      (this['hasPreview'] = ![]),
      (this['directorPanel'] = new DirectorTimelinePanel(this)),
      (this['cameraPath'] = new DirectorCameraPathController(this)),
      (this['editing'] = new DirectorTimelineEditing(this)),
      (this['clips'] = new DirectorClipTimeline(this)),
      (this['multiView'] = new DirectorMultiView(this)),
      (this['keyframeDrag'] = new TimelineKeyframeDrag(this)));
  }
  ['_context']() {
    const _0x5a1fcc = this['getProject']?.(),
      { scene: _0x5a3660, shot: _0x1ed3c9 } = getSceneContext(_0x5a1fcc),
      _0xbc49fe = this['getEditorState']?.() || {};
    return { project: _0x5a1fcc, scene: _0x5a3660, shot: _0x1ed3c9, editorState: _0xbc49fe };
  }
  ['_timeForShot'](_0x411677) {
    const _0x5d6b86 = normalizeStoryboard3DShotAnimation(_0x411677?.['animation'], {
      camera: _0x411677?.['camera'],
    });
    return clamp(this['currentTimes']['get'](_0x411677?.['id']) || 0x0, 0x0, _0x5d6b86['duration']);
  }
  ['_setTime'](_0x4e5811, _0x5bbaf1) {
    if (!_0x4e5811?.['id']) return 0x0;
    const _0x3f796d = normalizeStoryboard3DShotAnimation(_0x4e5811['animation'], {
        camera: _0x4e5811['camera'],
      }),
      _0x2663ee = clamp(_0x5bbaf1, 0x0, _0x3f796d['duration']);
    return (this['currentTimes']['set'](_0x4e5811['id'], _0x2663ee), _0x2663ee);
  }
  ['_syncShot'](_0x1cb6bc) {
    const _0x8dcbb = _0x1cb6bc?.['id'] || '';
    if (_0x8dcbb === this['activeShotId']) return;
    if (this['cameraPath']['active']) this['cameraPath']['stop']();
    (this['stopPlayback']({ render: ![], clear: !![] }),
      (this['activeShotId'] = _0x8dcbb),
      (this['selectedKeyframe'] = null),
      (this['hasPreview'] = ![]));
  }
  ['render']() {
    this['keyframeDrag']['bind']();
    const { scene: _0x5e20bc, shot: _0x1eeb14, editorState: _0x5dcf15 } = this['_context']();
    if (!_0x5e20bc || !_0x1eeb14) return '';
    return (
      this['_syncShot'](_0x1eeb14),
      renderStoryboard3DShotTimeline({
        scene: _0x5e20bc,
        shot: _0x1eeb14,
        selectedObjectIds: _0x5dcf15['selectedObjectIds'] || [],
        activeTool: _0x5dcf15['activeTool'],
        currentTime: this['_timeForShot'](_0x1eeb14),
        playing: this['playing'],
        autoKey: this['autoKey'],
        expandedObjectIds: this['expandedObjectIds'],
        activeProperties: this['activeProperties'],
        selectedKeyframe: this['selectedKeyframe'],
        directorPanel: this['directorPanel']['render'](),
        editingToolbar: this['editing']['render'](),
        clipTracks: this['clips']['render'](normalizeAnimation(_0x5e20bc, _0x1eeb14)),
      })
    );
  }
  ['_mutateAnimation'](_0x3c24d5, _0x42c807, _0x51330f) {
    this['commitMutation']?.({
      type: _0x3c24d5,
      label: _0x42c807,
      mutate: (_0x31bf50) => {
        const { scene: _0x33298e, shot: _0x202214 } = getSceneContext(_0x31bf50);
        if (!_0x33298e || !_0x202214) return _0x31bf50;
        _0x202214['animation'] = _0x51330f(normalizeAnimation(_0x33298e, _0x202214), {
          scene: _0x33298e,
          shot: _0x202214,
        });
        const _0x362a61 = _0x202214['animation']['cameraKeyframes'][0x0];
        return (
          _0x362a61?.['camera'] &&
            ((_0x202214['camera'] = cloneCameraState(_0x362a61['camera'])),
            syncStoryboard3DCameraObjectFromShot(_0x33298e, _0x202214)),
          (_0x202214['updatedAt'] = Date['now']()),
          _0x31bf50
        );
      },
    });
  }
  ['_sampleAt'](_0x3e63f5) {
    const { scene: _0x4d32cb, shot: _0x1396c6 } = this['_context']();
    if (!_0x4d32cb || !_0x1396c6) return null;
    const _0x5aa673 = this['_setTime'](_0x1396c6, _0x3e63f5),
      _0x2d9a0c = sampleStoryboard3DShotAnimation(_0x1396c6['animation'], _0x5aa673, {
        camera: _0x1396c6['camera'],
        objectTransforms: createObjectTransforms(_0x4d32cb),
        objects: _0x4d32cb['objects'],
      });
    this['hasPreview'] = !![];
    if (!this['cameraPath']['preview'](_0x2d9a0c)) this['previewSample']?.(_0x2d9a0c);
    return (this['_syncDisplay'](_0x5aa673, _0x1396c6), _0x2d9a0c);
  }
  ['_syncDisplay'](_0x1df779, _0x139648) {
    const _0x598cfe = this['getRoot']?.(),
      _0x4e0efc = _0x598cfe?.['querySelector']?.('[data-storyboard-3d-shot-timeline]');
    if (!_0x4e0efc || _0x4e0efc['dataset']['shotId'] !== _0x139648?.['id']) return;
    const _0x51c13a = normalizeStoryboard3DShotAnimation(_0x139648['animation'], {
        camera: _0x139648['camera'],
      }),
      _0x15f167 = _0x51c13a['duration'] > 0x0 ? (_0x1df779 / _0x51c13a['duration']) * 0x64 : 0x0;
    _0x4e0efc['style']['setProperty']('--storyboard-3d-playhead-position', _0x15f167 + '%');
    const _0xba01ff = _0x4e0efc['querySelector']?.('[data-storyboard-3d-timeline-frame]');
    if (_0xba01ff) _0xba01ff['textContent'] = Math['round'](_0x1df779 * _0x51c13a['fps']) + 'f';
    const _0x17c4bd = _0x4e0efc['querySelector']?.('[data-storyboard-3d-timeline-scrubber]');
    if (_0x17c4bd) _0x17c4bd['value'] = String(_0x1df779);
  }
  ['_schedulePlayback']() {
    const _0x49b152 =
      this['window']?.['requestAnimationFrame']?.['bind'](this['window']) ||
      globalThis['requestAnimationFrame']?.['bind'](globalThis);
    if (!_0x49b152 || !this['playing']) return;
    this['playbackFrame'] = _0x49b152((_0x44a397) => {
      if (!this['playing']) return;
      const { shot: _0x9818c0 } = this['_context']();
      if (!_0x9818c0) return this['stopPlayback']();
      const _0x1cc42c = normalizeStoryboard3DShotAnimation(_0x9818c0['animation'], {
          camera: _0x9818c0['camera'],
        }),
        _0x5ae075 = Math['max'](0x0, (_0x44a397 - this['playbackStartedAt']) / 0x3e8);
      let _0x13694e = this['playbackStartTime'] + _0x5ae075 * (this['playbackRate'] || 0x1);
      if (_0x1cc42c['loop'] && _0x1cc42c['duration'] > 0x0) _0x13694e %= _0x1cc42c['duration'];
      if (!_0x1cc42c['loop'] && _0x13694e >= _0x1cc42c['duration']) {
        (this['_sampleAt'](_0x1cc42c['duration']), this['stopPlayback']({ clear: ![] }));
        return;
      }
      (this['_sampleAt'](_0x13694e), this['_schedulePlayback']());
    });
  }
  ['startPlayback']() {
    const { shot: _0x4fb498 } = this['_context']();
    if (!_0x4fb498) return ![];
    const _0x4f7daa = normalizeStoryboard3DShotAnimation(_0x4fb498['animation'], {
        camera: _0x4fb498['camera'],
      }),
      _0x5651df = this['_timeForShot'](_0x4fb498);
    return (
      (this['playing'] = !![]),
      (this['playbackStartTime'] = _0x5651df >= _0x4f7daa['duration'] ? 0x0 : _0x5651df),
      this['currentTimes']['set'](_0x4fb498['id'], this['playbackStartTime']),
      (this['playbackStartedAt'] =
        this['window']?.['performance']?.['now']?.() ||
        globalThis['performance']?.['now']?.() ||
        Date['now']()),
      this['requestRender']?.(),
      this['_sampleAt'](this['playbackStartTime']),
      this['_schedulePlayback'](),
      !![]
    );
  }
  ['stopPlayback']({ render: render = !![], clear: clear = ![] } = {}) {
    const _0x46e087 =
      this['window']?.['cancelAnimationFrame']?.['bind'](this['window']) ||
      globalThis['cancelAnimationFrame']?.['bind'](globalThis);
    if (this['playbackFrame'] != null) _0x46e087?.(this['playbackFrame']);
    const _0x2a90ff = this['playing'];
    ((this['playbackFrame'] = null), (this['playing'] = ![]));
    clear && ((this['hasPreview'] = ![]), this['clearPreview']?.());
    if (render && _0x2a90ff) this['requestRender']?.();
  }
  ['togglePlayback']() {
    if (this['playing']) return (this['stopPlayback']({ clear: ![] }), !![]);
    return this['startPlayback']();
  }
  ['_activeProperty'](_0x532516, _0x363ad1) {
    return this['activeProperties']['get'](_0x532516) || TOOL_PROPERTIES[_0x363ad1] || 'position';
  }
  ['isDrawerOpen']() {
    return this['drawerOpen'];
  }
  ['_syncDrawerPresentation']() {
    const _0x21bc60 = this['getRoot']?.(),
      _0x3ccb03 = _0x21bc60?.['querySelector']?.('.storyboard-3d-viewport-column'),
      _0x321396 = _0x21bc60?.['querySelector']?.('.storyboard-3d-shot-dock'),
      _0x5f2f2e = _0x21bc60?.['querySelector']?.('.storyboard-3d-shot-keyframe-trigger'),
      _0x3bc4ed = _0x21bc60?.['querySelector']?.('.storyboard-3d-timeline-drawer-handle'),
      _0x2baa78 = _0x21bc60?.['querySelector']?.('.storyboard-3d-timeline-drawer-content');
    if (!_0x3ccb03 || !_0x321396 || !_0x5f2f2e || !_0x3bc4ed || !_0x2baa78) return ![];
    const _0x16af7a = this['drawerOpen'];
    (_0x3ccb03['classList']['toggle']('is-timeline-open', _0x16af7a),
      _0x3ccb03['classList']['toggle']('is-timeline-collapsed', !_0x16af7a),
      _0x321396['classList']['toggle']('is-timeline-open', _0x16af7a),
      _0x321396['classList']['toggle']('is-timeline-collapsed', !_0x16af7a),
      _0x5f2f2e['classList']['toggle']('is-active', _0x16af7a),
      _0x5f2f2e['setAttribute']('aria-expanded', String(_0x16af7a)),
      _0x3bc4ed['classList']['toggle']('is-open', _0x16af7a),
      _0x3bc4ed['setAttribute']('aria-expanded', String(_0x16af7a)));
    const _0x59599e = _0x16af7a ? '下拉收起关键帧时间轴' : '上拉展开关键帧时间轴';
    (_0x3bc4ed['setAttribute']('aria-label', _0x59599e),
      _0x2baa78['setAttribute']('aria-hidden', String(!_0x16af7a)),
      (_0x2baa78['inert'] = !_0x16af7a));
    if (_0x16af7a) _0x2baa78['removeAttribute']('inert');
    else _0x2baa78['setAttribute']('inert', '');
    return !![];
  }
  ['setDrawerOpen'](_0x14853f) {
    const _0x18b10e = _0x14853f === !![];
    if (_0x18b10e === this['drawerOpen']) return ![];
    this['drawerOpen'] = _0x18b10e;
    !_0x18b10e &&
      (this['directorPanel']['mobile']['disconnect']({ render: ![] }),
      this['multiView']['destroy'](),
      this['cameraPath']['stop'](),
      this['stopPlayback']({ render: ![], clear: !![] }));
    if (!this['_syncDrawerPresentation']()) this['requestRender']?.();
    return !![];
  }
  ['handleClick'](_0x2b1a1, _0x550219, _0x59cafd) {
    if (!String(_0x2b1a1 || '')['startsWith']('timeline-')) return ![];
    if (_0x2b1a1 === 'timeline-select-keyframe' && this['keyframeDrag']['consumeClick'](_0x59cafd))
      return !![];
    if (this['editing']['handleClick'](_0x2b1a1, _0x550219, _0x59cafd)) return !![];
    if (this['clips']['handleClick'](_0x2b1a1, _0x550219, _0x59cafd)) return !![];
    if (this['directorPanel']['handleClick'](_0x2b1a1, _0x550219, _0x59cafd)) return !![];
    if (_0x2b1a1 === 'timeline-toggle-drawer') return (this['setDrawerOpen'](!this['drawerOpen']), !![]);
    const { scene: _0xcee25e, shot: _0x109f6c, editorState: _0x5f07c4 } = this['_context']();
    if (!_0xcee25e || !_0x109f6c) return !![];
    if (_0x2b1a1 === 'timeline-toggle-play') return (this['togglePlayback'](), !![]);
    if (_0x2b1a1 === 'timeline-go-start' || _0x2b1a1 === 'timeline-go-end') {
      this['stopPlayback']({ render: ![], clear: ![] });
      const _0x3ae563 = normalizeAnimation(_0xcee25e, _0x109f6c);
      return (
        this['_sampleAt'](_0x2b1a1 === 'timeline-go-start' ? 0x0 : _0x3ae563['duration']),
        this['requestRender']?.(),
        !![]
      );
    }
    if (_0x2b1a1 === 'timeline-toggle-object') {
      const _0xb79982 = _0x550219['dataset']['objectId'];
      if (this['expandedObjectIds']['has'](_0xb79982)) this['expandedObjectIds']['delete'](_0xb79982);
      else this['expandedObjectIds']['add'](_0xb79982);
      return (this['requestRender']?.(), !![]);
    }
    if (_0x2b1a1 === 'timeline-set-object-property') {
      const _0x18e503 = _0x550219['dataset']['objectId'],
        _0x30df50 = _0x550219['dataset']['property'];
      return (
        STORYBOARD_3D_OBJECT_ANIMATION_PROPERTIES['includes'](_0x30df50) &&
          (this['activeProperties']['set'](_0x18e503, _0x30df50), this['requestRender']?.()),
        !![]
      );
    }
    if (_0x2b1a1 === 'timeline-add-camera-keyframe') {
      const _0x45cbd0 = this['readCurrentCamera']?.();
      if (!_0x45cbd0) return (this['setMessage']?.('当前摄像机状态不可用。'), !![]);
      const _0x35764f = this['_timeForShot'](_0x109f6c);
      return (
        this['_mutateAnimation']('add-camera-keyframe', 'Add camera keyframe', (_0x2109c4) =>
          upsertStoryboard3DCameraKeyframe(_0x2109c4, { time: _0x35764f, camera: _0x45cbd0 }),
        ),
        this['setMessage']?.(
          '已在\x20' +
            formatFrameTime(_0x35764f, normalizeAnimation(_0xcee25e, _0x109f6c)['fps']) +
            ' 添加摄像机关键帧。',
        ),
        !![]
      );
    }
    if (_0x2b1a1 === 'timeline-add-object-keyframe') {
      const _0x22d704 = _0x550219['dataset']['objectId'] || _0x5f07c4['selectedObjectIds']?.['at'](-0x1),
        _0x45c2dd =
          _0x550219['dataset']['property'] || this['_activeProperty'](_0x22d704, _0x5f07c4['activeTool']),
        _0xbb2d89 = _0xcee25e['objects']['find']((_0x562548) => _0x562548['id'] === _0x22d704);
      if (!_0xbb2d89 || !STORYBOARD_3D_OBJECT_ANIMATION_PROPERTIES['includes'](_0x45c2dd)) return !![];
      const _0x5ed102 = this['_timeForShot'](_0x109f6c);
      return (
        this['_mutateAnimation']('add-object-keyframe', 'Add object keyframe', (_0x34491f) =>
          upsertStoryboard3DObjectKeyframe(_0x34491f, {
            objectId: _0x22d704,
            property: _0x45c2dd,
            time: _0x5ed102,
            transform: _0xbb2d89['transform'],
          }),
        ),
        this['setMessage']?.(
          '已为“' + _0xbb2d89['name'] + '”的' + PROPERTY_LABELS[_0x45c2dd] + '添加关键帧。',
        ),
        !![]
      );
    }
    if (_0x2b1a1 === 'timeline-select-keyframe')
      return (
        this['stopPlayback']({ render: ![], clear: ![] }),
        (this['selectedKeyframe'] = {
          shotId: _0x109f6c['id'],
          type: _0x550219['dataset']['keyframeType'],
          objectId: _0x550219['dataset']['objectId'] || '',
          property: _0x550219['dataset']['property'] || '',
          keyframeId: _0x550219['dataset']['keyframeId'],
        }),
        this['_sampleAt'](Number(_0x550219['dataset']['keyframeTime']) || 0x0),
        this['requestRender']?.(),
        !![]
      );
    if (_0x2b1a1 === 'timeline-copy-keyframe') {
      const _0x1dc6d1 = this['selectedKeyframe'],
        _0x58e334 = this['_timeForShot'](_0x109f6c);
      return (
        this['_mutateAnimation']('copy-animation-keyframe', '复制关键帧', (_0x500f03) => {
          const _0x2182e2 = findSelectedKeyframe(_0x500f03, _0x1dc6d1);
          if (!_0x2182e2) return _0x500f03;
          return _0x1dc6d1['type'] === 'camera'
            ? upsertStoryboard3DCameraKeyframe(_0x500f03, { ..._0x2182e2['keyframe'], time: _0x58e334 })
            : upsertStoryboard3DObjectKeyframe(_0x500f03, {
                ..._0x1dc6d1,
                ..._0x2182e2['keyframe'],
                time: _0x58e334,
              });
        }),
        !![]
      );
    }
    if (_0x2b1a1 === 'timeline-delete-keyframe') {
      if (!this['selectedKeyframe']) return !![];
      const _0x4d5187 = { ...this['selectedKeyframe'] };
      return (
        this['_mutateAnimation'](
          'delete-animation-keyframe',
          'Delete\x20animation\x20keyframe',
          (_0x49b1e5) => removeStoryboard3DAnimationKeyframe(_0x49b1e5, _0x4d5187),
        ),
        (this['selectedKeyframe'] = null),
        !![]
      );
    }
    return !![];
  }
  ['handleInput'](_0x350016) {
    if (_0x350016['target']?.['matches']?.('[data-storyboard-3d-timeline-scrubber]'))
      return (
        this['stopPlayback']({ render: ![], clear: ![] }),
        this['_sampleAt'](Number(_0x350016['target']['value']) || 0x0),
        !![]
      );
    return ![];
  }
  ['handleChange'](_0x79ee95) {
    if (this['editing']['handleChange'](_0x79ee95)) return !![];
    if (this['directorPanel']['handleChange'](_0x79ee95)) return !![];
    const { scene: _0x534a21, shot: _0x280953 } = this['_context']();
    if (!_0x534a21 || !_0x280953) return ![];
    if (_0x79ee95['target']?.['matches']?.('[data-storyboard-3d-timeline-auto-key]'))
      return ((this['autoKey'] = _0x79ee95['target']['checked'] === !![]), this['requestRender']?.(), !![]);
    if (_0x79ee95['target']?.['matches']?.('[data-storyboard-3d-timeline-setting]')) {
      const _0x5a9867 = _0x79ee95['target']['dataset']['storyboard3dTimelineSetting'],
        _0x52f408 =
          _0x5a9867 === 'loop' ? _0x79ee95['target']['checked'] : Number(_0x79ee95['target']['value']);
      return (
        this['_mutateAnimation']('update-animation-settings', 'Update animation settings', (_0x125a02) =>
          updateStoryboard3DShotAnimationSettings(_0x125a02, { [_0x5a9867]: _0x52f408 }),
        ),
        !![]
      );
    }
    if (_0x79ee95['target']?.['matches']?.('[data-storyboard-3d-timeline-key-time]')) {
      const _0x17735e = Number(_0x79ee95['target']['value']);
      if (!Number['isFinite'](_0x17735e)) return !![];
      return (
        this['_mutateAnimation']('move-animation-keyframe', '移动关键帧', (_0x44b1ea) => {
          const _0x4b8c3e = findSelectedKeyframe(_0x44b1ea, this['selectedKeyframe']);
          if (!_0x4b8c3e) return _0x44b1ea;
          const _0x2562ce = Math['max'](
              0x0,
              Math['min'](0xe10, Math['round'](_0x17735e * _0x44b1ea['fps']) / _0x44b1ea['fps']),
            ),
            _0x39d75d =
              _0x4b8c3e['type'] === 'camera'
                ? _0x44b1ea['cameraKeyframes']
                : _0x44b1ea['objectTracks']['find'](
                    (_0x33e268) => _0x33e268['objectId'] === _0x4b8c3e['objectId'],
                  )?.[_0x4b8c3e['property'] + 'Keyframes'];
          if (
            _0x39d75d['some'](
              (_0x730269) =>
                _0x730269['id'] !== _0x4b8c3e['keyframe']['id'] &&
                Math['abs'](_0x730269['time'] - _0x2562ce) < 0.5 / _0x44b1ea['fps'],
            )
          )
            return (this['setMessage']?.('该帧已有关键帧，请选择其他时间。'), _0x44b1ea);
          return ((_0x4b8c3e['keyframe']['time'] = _0x2562ce), normalizeStoryboard3DShotAnimation(_0x44b1ea));
        }),
        !![]
      );
    }
    if (_0x79ee95['target']?.['matches']?.('[data-storyboard-3d-timeline-key-value]')) {
      const _0x2fd6df = this['selectedKeyframe'];
      if (!_0x2fd6df || _0x2fd6df['type'] !== 'object') return !![];
      const _0x2f111b = Number(_0x79ee95['target']['dataset']['storyboard3dTimelineKeyValue']),
        _0x69348a = Number(_0x79ee95['target']['value']),
        _0x5537b3 = _0x2fd6df['property'] === 'rotation' ? (_0x69348a * Math['PI']) / 0xb4 : _0x69348a;
      return (
        this['_mutateAnimation']('update-animation-keyframe', 'Update animation keyframe', (_0x3db03e) => {
          const _0x18f909 = _0x3db03e['objectTracks']['find'](
              (_0x5b5add) => _0x5b5add['objectId'] === _0x2fd6df['objectId'],
            ),
            _0x17ee91 = _0x18f909?.[_0x2fd6df['property'] + 'Keyframes']?.['find'](
              (_0x508d95) => _0x508d95['id'] === _0x2fd6df['keyframeId'],
            );
          return (
            _0x17ee91 &&
              _0x2f111b >= 0x0 &&
              _0x2f111b < 0x3 &&
              Number['isFinite'](_0x5537b3) &&
              (_0x17ee91['value'][_0x2f111b] = _0x5537b3),
            normalizeStoryboard3DShotAnimation(_0x3db03e)
          );
        }),
        !![]
      );
    }
    if (_0x79ee95['target']?.['matches']?.('[data-storyboard-3d-timeline-key-easing]')) {
      const _0x12f9c5 = this['selectedKeyframe'];
      if (!_0x12f9c5 || _0x12f9c5['type'] !== 'object') return !![];
      const _0x401f35 = String(_0x79ee95['target']['value'] || 'ease-in-out');
      return (
        this['_mutateAnimation']('update-animation-easing', 'Update\x20animation\x20easing', (_0x3638e2) => {
          const _0x1a5245 = _0x3638e2['objectTracks']['find'](
              (_0x1811ce) => _0x1811ce['objectId'] === _0x12f9c5['objectId'],
            ),
            _0xeab035 = _0x1a5245?.[_0x12f9c5['property'] + 'Keyframes']?.['find'](
              (_0x241bf4) => _0x241bf4['id'] === _0x12f9c5['keyframeId'],
            );
          if (_0xeab035) _0xeab035['easing'] = _0x401f35;
          return normalizeStoryboard3DShotAnimation(_0x3638e2);
        }),
        !![]
      );
    }
    return ![];
  }
  ['isAutoKeyEnabled']() {
    return this['autoKey'];
  }
  ['recordCameraKeyframe'](_0x235eab) {
    if (!this['autoKey'] || !_0x235eab) return ![];
    const { shot: _0x10a15a } = this['_context']();
    if (!_0x10a15a) return ![];
    const _0x4e000a = this['_timeForShot'](_0x10a15a);
    return (
      this['_mutateAnimation']('auto-key-camera', 'Auto key camera', (_0x37e6dd) =>
        upsertStoryboard3DCameraKeyframe(_0x37e6dd, { time: _0x4e000a, camera: _0x235eab }),
      ),
      !![]
    );
  }
  ['recordObjectTransforms'](_0x2e9188, _0x106a41) {
    if (!this['autoKey']) return ![];
    const { scene: _0x16cc3d, shot: _0xb98118 } = this['_context']();
    if (!_0x16cc3d || !_0xb98118) return ![];
    const _0x4337f8 = TOOL_PROPERTIES[_0x106a41] || 'position',
      _0x2193d5 = this['_timeForShot'](_0xb98118);
    return (
      this['_mutateAnimation']('auto-key-objects', 'Auto key objects', (_0x118a91) => {
        let _0x39c57c = _0x118a91;
        return (
          Object['entries'](_0x2e9188 || {})['forEach'](([_0x712815, _0x1eca5d]) => {
            _0x39c57c = upsertStoryboard3DObjectKeyframe(_0x39c57c, {
              objectId: _0x712815,
              property: _0x4337f8,
              time: _0x2193d5,
              transform: _0x1eca5d,
            });
          }),
          _0x39c57c
        );
      }),
      !![]
    );
  }
  ['getPreviewTransform'](_0x5d2909) {
    if (!this['hasPreview']) return null;
    const { scene: _0x3bddf4, shot: _0x2a1eac } = this['_context']();
    if (!_0x3bddf4 || !_0x2a1eac) return null;
    return (
      sampleStoryboard3DShotAnimation(_0x2a1eac['animation'], this['_timeForShot'](_0x2a1eac), {
        camera: _0x2a1eac['camera'],
        objectTransforms: createObjectTransforms(_0x3bddf4),
      })['objectTransforms'][_0x5d2909] || null
    );
  }
  ['syncPreview']() {
    (this['directorPanel']['generation']['syncPrices'](),
      this['editing']['sync'](),
      this['clips']['bind'](),
      this['cameraPath']['sync']());
    if (this['directorPanel']['mobile']['pairing']) {
      this['directorPanel']['mobile']['sync']();
      return;
    }
    if (!this['hasPreview'] || this['playing']) return;
    const { shot: _0x16c34c } = this['_context']();
    if (_0x16c34c) this['_sampleAt'](this['_timeForShot'](_0x16c34c));
  }
  ['destroy']() {
    (this['multiView']['destroy'](),
      this['editing']['destroy'](),
      this['clips']['destroy'](),
      this['cameraPath']['destroy'](),
      this['keyframeDrag']['destroy'](),
      this['directorPanel']['destroy'](),
      this['stopPlayback']({ render: ![], clear: !![] }),
      this['currentTimes']['clear'](),
      this['activeProperties']['clear'](),
      this['expandedObjectIds']['clear'](),
      (this['selectedKeyframe'] = null),
      (this['drawerOpen'] = ![]));
  }
}
export function createStoryboard3DShotTimelineController(_0xad3e39) {
  return new Storyboard3DShotTimelineController(_0xad3e39);
}
