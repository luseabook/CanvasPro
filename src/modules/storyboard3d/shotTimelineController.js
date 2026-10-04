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
function escapeHtml(value) {
  return String(value ?? '')
    ['replace'](/&/g, '&amp;')
    ['replace'](/</g, '&lt;')
    ['replace'](/>/g, '&gt;')
    ['replace'](/"/g, '&quot;')
    ['replace'](/'/g, '&#39;');
}
function clamp(item, key, index) {
  return Math['min'](index, Math['max'](key, Number(item) || 0x0));
}
function getSceneContext(result) {
  const list = Array['isArray'](result?.['scenes']) ? result['scenes'] : [],
    scene = list['find']((data) => data['id'] === result?.['activeSceneId']) || list[0x0] || null,
    list2 = Array['isArray'](scene?.['shots']) ? scene['shots'] : [],
    shot = list2['find']((options) => options['id'] === scene?.['activeShotId']) || list2[0x0] || null;
  return { scene: scene, shot: shot };
}
function createObjectTransforms(target) {
  return Object['fromEntries'](
    (target?.['objects'] || [])['map']((source) => [source['id'], source['transform']]),
  );
}
function cloneCameraState(event) {
  return { ...event, position: [...event['position']], target: [...event['target']] };
}
function normalizeAnimation(next, camera) {
  return normalizeStoryboard3DShotAnimation(camera?.['animation'], {
    camera: camera?.['camera'],
    objectIds: new Set((next?.['objects'] || [])['map']((current) => current['id'])),
    objectTransforms: createObjectTransforms(next),
  });
}
function getKeyframeCount(entry) {
  return (
    entry['cameraKeyframes']['length'] +
    entry['objectTracks']['reduce'](
      (record, payload) =>
        record +
        STORYBOARD_3D_OBJECT_ANIMATION_PROPERTIES['reduce'](
          (handle, state) => handle + payload[state + 'Keyframes']['length'],
          0x0,
        ),
      0x0,
    )
  );
}
function formatFrameTime(config, scope) {
  return Math['round'](config * scope) + 'f';
}
function renderKeyframes(list3, input, output = {}) {
  return list3['map']((value2) => {
    const value3 = input['duration'] > 0x0 ? (value2['time'] / input['duration']) * 0x64 : 0x0,
      value4 = output['keyframeId'] === value2['id'];
    return (
      '<button type="button" class="storyboard-3d-timeline-keyframe ' +
      (value4 ? 'is-selected' : '') +
      '" style="--storyboard-3d-keyframe-position:' +
      value3 +
      '%\x22\x20data-storyboard-3d-action=\x22timeline-select-keyframe\x22\x20data-keyframe-id=\x22' +
      escapeHtml(value2['id']) +
      '" data-keyframe-type="' +
      escapeHtml(output['type'] || '') +
      '" data-object-id="' +
      escapeHtml(output['objectId'] || '') +
      '" data-property="' +
      escapeHtml(output['property'] || '') +
      '" data-keyframe-time="' +
      value2['time'] +
      '" aria-label="关键帧 ' +
      value2['time']['toFixed'](0x2) +
      '\x20秒，第\x20' +
      formatFrameTime(value2['time'], input['fps']) +
      '" title="' +
      value2['time']['toFixed'](0x2) +
      's · ' +
      formatFrameTime(value2['time'], input['fps']) +
      '"></button>'
    );
  })['join']('');
}
function renderPropertyLinks(value5, value6) {
  return STORYBOARD_3D_OBJECT_ANIMATION_PROPERTIES['map'](
    (value7) =>
      '<button type="button" class="storyboard-3d-timeline-property-link ' +
      (value6 === value7 ? 'is-active' : '') +
      '" data-storyboard-3d-action="timeline-set-object-property" data-object-id="' +
      escapeHtml(value5) +
      '\x22\x20data-property=\x22' +
      value7 +
      '\x22>' +
      PROPERTY_LABELS[value7] +
      '</button>',
  )['join']('<span aria-hidden="true">/</span>');
}
function renderAddKeyframeButton({
  action: action,
  label: label,
  objectId: objectId = '',
  property: property = '',
}) {
  return (
    '<button type="button" class="storyboard-3d-timeline-row-add" data-storyboard-3d-action="' +
    action +
    '\x22\x20data-object-id=\x22' +
    escapeHtml(objectId) +
    '" data-property="' +
    escapeHtml(property) +
    '\x22\x20aria-label=\x22为' +
    escapeHtml(label) +
    '添加关键帧" title="为' +
    escapeHtml(label) +
    '添加关键帧">+</button>'
  );
}
function renderTimelineLane({
  animation: animation,
  keyframes: keyframes,
  selection: selection,
  className: className = '',
  label: label2,
}) {
  return (
    '<div\x20class=\x22storyboard-3d-timeline-lane\x20' +
    className +
    '" data-timeline-lane-label="' +
    escapeHtml(label2 || '') +
    '\x22>\x0a\x20\x20\x20\x20<span\x20class=\x22storyboard-3d-timeline-lane-line\x22\x20aria-hidden=\x22true\x22></span>\x0a\x20\x20\x20\x20' +
    renderKeyframes(keyframes, animation, selection) +
    '\n  </div>'
  );
}
function renderCameraTrack(animation2, args) {
  return (
    '<div class="storyboard-3d-timeline-row is-camera">\n    <div class="storyboard-3d-timeline-track-label">\n      <div><strong>摄像机</strong><small>位置 / 目标 / 焦距</small></div>\n      ' +
    renderAddKeyframeButton({ action: 'timeline-add-camera-keyframe', label: '摄像机' }) +
    '\n    </div>\n    ' +
    renderTimelineLane({
      animation: animation2,
      keyframes: animation2['cameraKeyframes'],
      selection: { ...args, type: 'camera' },
      className: 'is-camera',
      label: '摄像机',
    }) +
    '\n  </div>'
  );
}
function renderObjectTrack({
  object: object,
  animation: animation3,
  activeProperty: activeProperty,
  expanded: expanded,
  selected: selected,
  selectedKeyframe: selectedKeyframe2,
}) {
  const keyframes2 = getStoryboard3DObjectAnimationTrack(animation3, object['id']) || {
      positionKeyframes: [],
      rotationKeyframes: [],
      scaleKeyframes: [],
    },
    label3 = object['name'] + '\x20·\x20' + PROPERTY_LABELS[activeProperty],
    value8 =
      '<div class="storyboard-3d-timeline-object-summary ' +
      (selected ? 'is-selected' : '') +
      '">\n    <button type="button" class="storyboard-3d-timeline-disclosure ' +
      (expanded ? 'is-expanded' : '') +
      '" data-storyboard-3d-action="timeline-toggle-object" data-object-id="' +
      escapeHtml(object['id']) +
      '" aria-label="' +
      (expanded ? '折叠' : '展开') +
      escapeHtml(object['name']) +
      '轨道" aria-expanded="' +
      expanded +
      '\x22>' +
      (expanded ? '折叠' : '展开') +
      '</button>\n    <div><strong>' +
      escapeHtml(object['name']) +
      '</strong><span>' +
      renderPropertyLinks(object['id'], activeProperty) +
      '</span></div>\n    ' +
      (expanded
        ? ''
        : renderAddKeyframeButton({
            action: 'timeline-add-object-keyframe',
            label: label3,
            objectId: object['id'],
            property: activeProperty,
          })) +
      '\n  </div>';
  if (!expanded)
    return (
      '<div class="storyboard-3d-timeline-row is-object is-' +
      activeProperty +
      '\x20' +
      (selected ? 'is-selected' : '') +
      '">\n      ' +
      value8 +
      '\n      ' +
      renderTimelineLane({
        animation: animation3,
        keyframes: keyframes2[activeProperty + 'Keyframes'],
        selection: { ...selectedKeyframe2, type: 'object', objectId: object['id'], property: activeProperty },
        className: 'is-' + activeProperty,
        label: label3,
      }) +
      '\n    </div>'
    );
  const value9 = STORYBOARD_3D_OBJECT_ANIMATION_PROPERTIES['map'](
    (property2) =>
      '<div class="storyboard-3d-timeline-row is-object-property is-' +
      property2 +
      '">\n      <div class="storyboard-3d-timeline-property-label"><span aria-hidden="true"></span>' +
      PROPERTY_LABELS[property2] +
      renderAddKeyframeButton({
        action: 'timeline-add-object-keyframe',
        label: object['name'] + '\x20·\x20' + PROPERTY_LABELS[property2],
        objectId: object['id'],
        property: property2,
      }) +
      '</div>\n      ' +
      renderTimelineLane({
        animation: animation3,
        keyframes: keyframes2[property2 + 'Keyframes'],
        selection: { ...selectedKeyframe2, type: 'object', objectId: object['id'], property: property2 },
        className: 'is-' + property2,
        label: object['name'] + ' · ' + PROPERTY_LABELS[property2],
      }) +
      '\n    </div>',
  )['join']('');
  return (
    '<div\x20class=\x22storyboard-3d-timeline-object-group\x20' +
    (selected ? 'is-selected' : '') +
    '">\n    <div class="storyboard-3d-timeline-row is-object-summary">' +
    value8 +
    '<div class="storyboard-3d-timeline-lane is-summary"></div></div>\n    ' +
    value9 +
    '\n  </div>'
  );
}
function renderRuler(value10, value11) {
  const length = 0x6,
    value12 = Array['from']({ length: length + 0x1 }, (value13, value14) => {
      const value15 = (value10['duration'] * value14) / length;
      return (
        '<span style="--storyboard-3d-tick-position:' +
        (value14 / length) * 0x64 +
        '%\x22><strong>' +
        value15['toFixed'](value15 % 0x1 === 0x0 ? 0x0 : 0x1) +
        's</strong><small>' +
        formatFrameTime(value15, value10['fps']) +
        '</small></span>'
      );
    })['join']('');
  return (
    '<div class="storyboard-3d-timeline-row is-ruler">\n    <div class="storyboard-3d-timeline-ruler-label">轨道</div>\n    <div class="storyboard-3d-timeline-ruler">\n      ' +
    value12 +
    '\x0a\x20\x20\x20\x20\x20\x20<input\x20type=\x22range\x22\x20min=\x220\x22\x20max=\x22' +
    value10['duration'] +
    '\x22\x20step=\x22' +
    0x1 / value10['fps'] +
    '" value="' +
    value11 +
    '" data-storyboard-3d-timeline-scrubber aria-label="镜头动画播放头">\n    </div>\n  </div>'
  );
}
function findSelectedKeyframe(value16, args2) {
  if (!args2?.['keyframeId']) return null;
  if (args2['type'] === 'camera') {
    const keyframe = value16['cameraKeyframes']['find']((value17) => value17['id'] === args2['keyframeId']);
    return keyframe ? { ...args2, keyframe: keyframe } : null;
  }
  const value18 = value16['objectTracks']['find']((value19) => value19['objectId'] === args2['objectId']),
    keyframe2 = value18?.[args2['property'] + 'Keyframes']?.['find'](
      (value20) => value20['id'] === args2['keyframeId'],
    );
  return keyframe2 ? { ...args2, keyframe: keyframe2 } : null;
}
function renderSelectedKeyframeEditor(value21, value22, value23) {
  const selectedKeyframe3 = findSelectedKeyframe(value21, value22);
  if (!selectedKeyframe3)
    return '<footer class="storyboard-3d-timeline-key-editor is-empty"><span>选择关键帧后可编辑数值与缓动</span></footer>';
  const { keyframe: keyframe3 } = selectedKeyframe3,
    value24 =
      '<label class="storyboard-3d-timeline-easing">时间 / 秒<input type="number" min="0" max="3600" step="' +
      0x1 / value21['fps'] +
      '" value="' +
      keyframe3['time'] +
      '" data-storyboard-3d-timeline-key-time></label><button type="button" data-storyboard-3d-action="timeline-copy-keyframe">复制到播放头</button>',
    error = value23?.['objects']?.['find']((value25) => value25['id'] === selectedKeyframe3['objectId']);
  if (selectedKeyframe3['type'] === 'camera')
    return (
      '<footer class="storyboard-3d-timeline-key-editor">\n      <strong>摄像机关键帧</strong><span>' +
      keyframe3['time']['toFixed'](0x2) +
      's · ' +
      formatFrameTime(keyframe3['time'], value21['fps']) +
      '</span>\x0a\x20\x20\x20\x20\x20\x20<span>焦距\x20' +
      Number(keyframe3['camera']['focalLength'])['toFixed'](0x1) +
      'mm</span>\n      ' +
      renderDirectorCameraKeyEditor(keyframe3) +
      '\x0a\x20\x20\x20\x20\x20\x20' +
      value24 +
      '\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20data-storyboard-3d-action=\x22timeline-delete-keyframe\x22>删除关键帧</button>\x0a\x20\x20\x20\x20</footer>'
    );
  const value26 = selectedKeyframe3['property'] === 'rotation';
  return (
    '<footer\x20class=\x22storyboard-3d-timeline-key-editor\x22\x20data-selected-object-id=\x22' +
    escapeHtml(selectedKeyframe3['objectId']) +
    '" data-selected-property="' +
    selectedKeyframe3['property'] +
    '">\n    <strong>' +
    escapeHtml(error?.['name'] || selectedKeyframe3['objectId']) +
    ' · ' +
    PROPERTY_LABELS[selectedKeyframe3['property']] +
    '</strong>\n    <span>' +
    keyframe3['time']['toFixed'](0x2) +
    's · ' +
    formatFrameTime(keyframe3['time'], value21['fps']) +
    '</span>\n    ' +
    value24 +
    '\n    <div class="storyboard-3d-timeline-key-values">' +
    ['X', 'Y', 'Z']
      ['map'](
        (value27, value28) =>
          '<label><span>' +
          value27 +
          (value26 ? '°' : '') +
          '</span><input type="number" step="' +
          (value26 ? '1' : '0.01') +
          '\x22\x20value=\x22' +
          (value26
            ? (Number(keyframe3['value'][value28]) * 0xb4) / Math['PI']
            : Number(keyframe3['value'][value28]))['toFixed'](value26 ? 0x1 : 0x2) +
          '\x22\x20data-storyboard-3d-timeline-key-value=\x22' +
          value28 +
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
        ([value29, value30]) =>
          '<option\x20value=\x22' +
          value29 +
          '\x22\x20' +
          (keyframe3['easing'] === value29 ? 'selected' : '') +
          '>' +
          value30 +
          '</option>',
      )
      ['join']('') +
    '</select></label>\n    <button type="button" data-storyboard-3d-action="timeline-delete-keyframe">删除关键帧</button>\n  </footer>'
  );
}
export function renderStoryboard3DShotTimeline({
  scene: scene2,
  shot: shot2,
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
  if (!scene2 || !shot2) return '';
  const animation4 = normalizeAnimation(scene2, shot2),
    clamp2 = clamp(currentTime, 0x0, animation4['duration']),
    value31 = selectedObjectIds['at'](-0x1) || '',
    list4 = (scene2['objects'] || [])['filter'](
      (value32) => value32['visible'] !== ![] && value32['type'] !== 'group' && value32['type'] !== 'camera',
    ),
    value33 = list4['map']((object2) =>
      renderObjectTrack({
        object: object2,
        animation: animation4,
        activeProperty: activeProperties['get'](object2['id']) || TOOL_PROPERTIES[activeTool] || 'position',
        expanded: expandedObjectIds['has'](object2['id']),
        selected: object2['id'] === value31,
        selectedKeyframe: selectedKeyframe,
      }),
    )['join'](''),
    value34 = animation4['duration'] > 0x0 ? (clamp2 / animation4['duration']) * 0x64 : 0x0,
    value35 = Math['round'](animation4['duration'] * animation4['fps']);
  return (
    '<section\x20class=\x22storyboard-3d-shot-timeline\x20' +
    (playing ? 'is-playing' : '') +
    '" data-storyboard-3d-shot-timeline data-shot-id="' +
    escapeHtml(shot2['id']) +
    '\x22\x20style=\x22--storyboard-3d-playhead-position:' +
    value34 +
    '%">\n    <header class="storyboard-3d-timeline-toolbar">\n      <div class="storyboard-3d-timeline-playback">\n        <button type="button" data-storyboard-3d-action="timeline-go-start">首帧</button>\n        <button type="button" class="storyboard-3d-timeline-play" data-storyboard-3d-action="timeline-toggle-play">' +
    (playing ? '暂停' : '播放') +
    '</button>\n        <button type="button" data-storyboard-3d-action="timeline-go-end">末帧</button>\n      </div>\n      <output data-storyboard-3d-timeline-frame>' +
    Math['round'](clamp2 * animation4['fps']) +
    'f</output><span>/ ' +
    value35 +
    'f</span>\n      <label><span>时长</span><input type="number" min="0.1" max="3600" step="0.5" value="' +
    animation4['duration'] +
    '\x22\x20data-storyboard-3d-timeline-setting=\x22duration\x22></label>\x0a\x20\x20\x20\x20\x20\x20<label><span>FPS</span><select\x20data-storyboard-3d-timeline-setting=\x22fps\x22>' +
    [0xc, 0x18, 0x19, 0x1e, 0x32, 0x3c]
      ['map'](
        (value36) =>
          '<option\x20value=\x22' +
          value36 +
          '\x22\x20' +
          (animation4['fps'] === value36 ? 'selected' : '') +
          '>' +
          value36 +
          '</option>',
      )
      ['join']('') +
    '</select></label>\x0a\x20\x20\x20\x20\x20\x20<label\x20class=\x22storyboard-3d-timeline-auto-key\x22><input\x20type=\x22checkbox\x22\x20data-storyboard-3d-timeline-auto-key\x20' +
    (autoKey ? 'checked' : '') +
    '><span>自动 K 帧</span></label>\n      <label><input type="checkbox" data-storyboard-3d-timeline-setting="loop" ' +
    (animation4['loop'] ? 'checked' : '') +
    '>循环</label>\n      <button type="button" data-storyboard-3d-action="timeline-director-toggle" aria-expanded="' +
    Boolean(directorPanel) +
    '">导演编排</button>\n      <strong>当前镜头独立时间轴 · ' +
    escapeHtml(shot2['name']) +
    '</strong>\n      <small>' +
    getKeyframeCount(animation4) +
    ' 个关键帧</small>\n    </header>\n    <div class="storyboard-3d-timeline-grid">' +
    editingToolbar +
    '\n      ' +
    directorPanel +
    '\n      <div class="storyboard-3d-timeline-tracks">\n      ' +
    renderRuler(animation4, clamp2) +
    '\n      ' +
    renderCameraTrack(animation4, selectedKeyframe) +
    '\n      ' +
    clipTracks +
    '\n      ' +
    (value33 ||
      '<div\x20class=\x22storyboard-3d-timeline-empty\x22>选择或添加模型后即可创建变换关键帧</div>') +
    '\n      <div class="storyboard-3d-timeline-playhead" aria-hidden="true"><span></span></div>\n      </div>\n    </div>\n    ' +
    renderSelectedKeyframeEditor(animation4, selectedKeyframe, scene2) +
    '\n  </section>'
  );
}
export class Storyboard3DShotTimelineController {
  constructor({
    windowObject: windowObject = globalThis['window'],
    getProject: getProject,
    getEditorState: getEditorState,
    getRoot: getRoot,
    getRuntime: getRuntime,
    getBinaryAssetRepository: getBinaryAssetRepository,
    getImportedModel: getImportedModel,
    importProject: importProject,
    sendResults: sendResults,
    getGenerationContext: getGenerationContext,
    requestGeneration: requestGeneration,
    readCurrentCamera: readCurrentCamera,
    previewSample: previewSample,
    clearPreview: clearPreview,
    commitMutation: commitMutation,
    requestRender: requestRender,
    expandDirectorPanel: expandDirectorPanel,
    setMessage: setMessage,
  } = {}) {
    ((this['window'] = windowObject),
      (this['getProject'] = getProject),
      (this['getEditorState'] = getEditorState),
      (this['getRoot'] = getRoot),
      (this['getRuntime'] = getRuntime),
      (this['getBinaryAssetRepository'] = getBinaryAssetRepository),
      (this['getImportedModel'] = getImportedModel),
      (this['importProject'] = importProject),
      (this['sendResults'] = sendResults),
      (this['getGenerationContext'] = getGenerationContext),
      (this['requestGeneration'] = requestGeneration),
      (this['readCurrentCamera'] = readCurrentCamera),
      (this['previewSample'] = previewSample),
      (this['clearPreview'] = clearPreview),
      (this['commitMutation'] = commitMutation),
      (this['requestRender'] = requestRender),
      (this['expandDirectorPanel'] = expandDirectorPanel),
      (this['setMessage'] = setMessage),
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
    const project = this['getProject']?.(),
      { scene: scene3, shot: shot3 } = getSceneContext(project),
      editorState = this['getEditorState']?.() || {};
    return { project: project, scene: scene3, shot: shot3, editorState: editorState };
  }
  ['_timeForShot'](camera2) {
    const storyboard3DShotAnimation = normalizeStoryboard3DShotAnimation(camera2?.['animation'], {
      camera: camera2?.['camera'],
    });
    return clamp(
      this['currentTimes']['get'](camera2?.['id']) || 0x0,
      0x0,
      storyboard3DShotAnimation['duration'],
    );
  }
  ['_setTime'](camera3, value37) {
    if (!camera3?.['id']) return 0x0;
    const storyboard3DShotAnimation2 = normalizeStoryboard3DShotAnimation(camera3['animation'], {
        camera: camera3['camera'],
      }),
      clamp3 = clamp(value37, 0x0, storyboard3DShotAnimation2['duration']);
    return (this['currentTimes']['set'](camera3['id'], clamp3), clamp3);
  }
  ['_syncShot'](value38) {
    const value39 = value38?.['id'] || '';
    if (value39 === this['activeShotId']) return;
    if (this['cameraPath']['active']) this['cameraPath']['stop']();
    (this['stopPlayback']({ render: ![], clear: !![] }),
      (this['activeShotId'] = value39),
      (this['selectedKeyframe'] = null),
      (this['hasPreview'] = ![]));
  }
  ['render']() {
    this['keyframeDrag']['bind']();
    const { scene: scene4, shot: shot4, editorState: editorState2 } = this['_context']();
    if (!scene4 || !shot4) return '';
    return (
      this['_syncShot'](shot4),
      renderStoryboard3DShotTimeline({
        scene: scene4,
        shot: shot4,
        selectedObjectIds: editorState2['selectedObjectIds'] || [],
        activeTool: editorState2['activeTool'],
        currentTime: this['_timeForShot'](shot4),
        playing: this['playing'],
        autoKey: this['autoKey'],
        expandedObjectIds: this['expandedObjectIds'],
        activeProperties: this['activeProperties'],
        selectedKeyframe: this['selectedKeyframe'],
        directorPanel: this['directorPanel']['render'](),
        editingToolbar: this['editing']['render'](),
        clipTracks: this['clips']['render'](normalizeAnimation(scene4, shot4)),
      })
    );
  }
  ['_mutateAnimation'](type, label4, handler) {
    this['commitMutation']?.({
      type: type,
      label: label4,
      mutate: (value40) => {
        const { scene: scene5, shot: shot5 } = getSceneContext(value40);
        if (!scene5 || !shot5) return value40;
        shot5['animation'] = handler(normalizeAnimation(scene5, shot5), {
          scene: scene5,
          shot: shot5,
        });
        const value41 = shot5['animation']['cameraKeyframes'][0x0];
        return (
          value41?.['camera'] &&
            ((shot5['camera'] = cloneCameraState(value41['camera'])),
            syncStoryboard3DCameraObjectFromShot(scene5, shot5)),
          (shot5['updatedAt'] = Date['now']()),
          value40
        );
      },
    });
  }
  ['_sampleAt'](value42) {
    const { scene: scene6, shot: shot6 } = this['_context']();
    if (!scene6 || !shot6) return null;
    const value43 = this['_setTime'](shot6, value42),
      sampleStoryboard3DShotAnimation2 = sampleStoryboard3DShotAnimation(shot6['animation'], value43, {
        camera: shot6['camera'],
        objectTransforms: createObjectTransforms(scene6),
        objects: scene6['objects'],
      });
    this['hasPreview'] = !![];
    if (!this['cameraPath']['preview'](sampleStoryboard3DShotAnimation2))
      this['previewSample']?.(sampleStoryboard3DShotAnimation2);
    return (this['_syncDisplay'](value43, shot6), sampleStoryboard3DShotAnimation2);
  }
  ['_syncDisplay'](value44, camera4) {
    const el = this['getRoot']?.(),
      el2 = el?.['querySelector']?.('[data-storyboard-3d-shot-timeline]');
    if (!el2 || el2['dataset']['shotId'] !== camera4?.['id']) return;
    const storyboard3DShotAnimation3 = normalizeStoryboard3DShotAnimation(camera4['animation'], {
        camera: camera4['camera'],
      }),
      value45 =
        storyboard3DShotAnimation3['duration'] > 0x0
          ? (value44 / storyboard3DShotAnimation3['duration']) * 0x64
          : 0x0;
    el2['style']['setProperty']('--storyboard-3d-playhead-position', value45 + '%');
    const el3 = el2['querySelector']?.('[data-storyboard-3d-timeline-frame]');
    if (el3) el3['textContent'] = Math['round'](value44 * storyboard3DShotAnimation3['fps']) + 'f';
    const el4 = el2['querySelector']?.('[data-storyboard-3d-timeline-scrubber]');
    if (el4) el4['value'] = String(value44);
  }
  ['_schedulePlayback']() {
    const run =
      this['window']?.['requestAnimationFrame']?.['bind'](this['window']) ||
      globalThis['requestAnimationFrame']?.['bind'](globalThis);
    if (!run || !this['playing']) return;
    this['playbackFrame'] = run((value46) => {
      if (!this['playing']) return;
      const { shot: shot7 } = this['_context']();
      if (!shot7) return this['stopPlayback']();
      const storyboard3DShotAnimation4 = normalizeStoryboard3DShotAnimation(shot7['animation'], {
          camera: shot7['camera'],
        }),
        value47 = Math['max'](0x0, (value46 - this['playbackStartedAt']) / 0x3e8);
      let value48 = this['playbackStartTime'] + value47 * (this['playbackRate'] || 0x1);
      if (storyboard3DShotAnimation4['loop'] && storyboard3DShotAnimation4['duration'] > 0x0)
        value48 %= storyboard3DShotAnimation4['duration'];
      if (!storyboard3DShotAnimation4['loop'] && value48 >= storyboard3DShotAnimation4['duration']) {
        (this['_sampleAt'](storyboard3DShotAnimation4['duration']), this['stopPlayback']({ clear: ![] }));
        return;
      }
      (this['_sampleAt'](value48), this['_schedulePlayback']());
    });
  }
  ['startPlayback']() {
    const { shot: shot8 } = this['_context']();
    if (!shot8) return ![];
    const storyboard3DShotAnimation5 = normalizeStoryboard3DShotAnimation(shot8['animation'], {
        camera: shot8['camera'],
      }),
      value49 = this['_timeForShot'](shot8);
    return (
      (this['playing'] = !![]),
      (this['playbackStartTime'] = value49 >= storyboard3DShotAnimation5['duration'] ? 0x0 : value49),
      this['currentTimes']['set'](shot8['id'], this['playbackStartTime']),
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
    const value50 =
      this['window']?.['cancelAnimationFrame']?.['bind'](this['window']) ||
      globalThis['cancelAnimationFrame']?.['bind'](globalThis);
    if (this['playbackFrame'] != null) value50?.(this['playbackFrame']);
    const value51 = this['playing'];
    ((this['playbackFrame'] = null), (this['playing'] = ![]));
    clear && ((this['hasPreview'] = ![]), this['clearPreview']?.());
    if (render && value51) this['requestRender']?.();
  }
  ['togglePlayback']() {
    if (this['playing']) return (this['stopPlayback']({ clear: ![] }), !![]);
    return this['startPlayback']();
  }
  ['_activeProperty'](value52, value53) {
    return this['activeProperties']['get'](value52) || TOOL_PROPERTIES[value53] || 'position';
  }
  ['isDrawerOpen']() {
    return this['drawerOpen'];
  }
  ['_syncDrawerPresentation']() {
    const el5 = this['getRoot']?.(),
      el6 = el5?.['querySelector']?.('.storyboard-3d-viewport-column'),
      el7 = el5?.['querySelector']?.('.storyboard-3d-shot-dock'),
      el8 = el5?.['querySelector']?.('.storyboard-3d-shot-keyframe-trigger'),
      el9 = el5?.['querySelector']?.('.storyboard-3d-timeline-drawer-handle'),
      el10 = el5?.['querySelector']?.('.storyboard-3d-timeline-drawer-content');
    if (!el6 || !el7 || !el8 || !el9 || !el10) return ![];
    const enabled = this['drawerOpen'];
    (el6['classList']['toggle']('is-timeline-open', enabled),
      el6['classList']['toggle']('is-timeline-collapsed', !enabled),
      el7['classList']['toggle']('is-timeline-open', enabled),
      el7['classList']['toggle']('is-timeline-collapsed', !enabled),
      el8['classList']['toggle']('is-active', enabled),
      el8['setAttribute']('aria-expanded', String(enabled)),
      el9['classList']['toggle']('is-open', enabled),
      el9['setAttribute']('aria-expanded', String(enabled)));
    const value54 = enabled ? '下拉收起关键帧时间轴' : '上拉展开关键帧时间轴';
    (el9['setAttribute']('aria-label', value54),
      el10['setAttribute']('aria-hidden', String(!enabled)),
      (el10['inert'] = !enabled));
    if (enabled) el10['removeAttribute']('inert');
    else el10['setAttribute']('inert', '');
    return !![];
  }
  ['setDrawerOpen'](value55) {
    const enabled2 = value55 === !![];
    if (enabled2 === this['drawerOpen']) return ![];
    this['drawerOpen'] = enabled2;
    !enabled2 &&
      (this['directorPanel']['mobile']['disconnect']({ render: ![] }),
      this['multiView']['destroy'](),
      this['cameraPath']['stop'](),
      this['stopPlayback']({ render: ![], clear: !![] }));
    if (!this['_syncDrawerPresentation']()) this['requestRender']?.();
    return !![];
  }
  ['handleClick'](value56, type2, value57) {
    if (!String(value56 || '')['startsWith']('timeline-')) return ![];
    if (value56 === 'timeline-select-keyframe' && this['keyframeDrag']['consumeClick'](value57)) return !![];
    if (this['editing']['handleClick'](value56, type2, value57)) return !![];
    if (this['clips']['handleClick'](value56, type2, value57)) return !![];
    if (this['directorPanel']['handleClick'](value56, type2, value57)) return !![];
    if (value56 === 'timeline-toggle-drawer') return (this['setDrawerOpen'](!this['drawerOpen']), !![]);
    const { scene: scene7, shot: shot9, editorState: editorState3 } = this['_context']();
    if (!scene7 || !shot9) return !![];
    if (value56 === 'timeline-toggle-play') return (this['togglePlayback'](), !![]);
    if (value56 === 'timeline-go-start' || value56 === 'timeline-go-end') {
      this['stopPlayback']({ render: ![], clear: ![] });
      const animation5 = normalizeAnimation(scene7, shot9);
      return (
        this['_sampleAt'](value56 === 'timeline-go-start' ? 0x0 : animation5['duration']),
        this['requestRender']?.(),
        !![]
      );
    }
    if (value56 === 'timeline-toggle-object') {
      const value58 = type2['dataset']['objectId'];
      if (this['expandedObjectIds']['has'](value58)) this['expandedObjectIds']['delete'](value58);
      else this['expandedObjectIds']['add'](value58);
      return (this['requestRender']?.(), !![]);
    }
    if (value56 === 'timeline-set-object-property') {
      const value59 = type2['dataset']['objectId'],
        value60 = type2['dataset']['property'];
      return (
        STORYBOARD_3D_OBJECT_ANIMATION_PROPERTIES['includes'](value60) &&
          (this['activeProperties']['set'](value59, value60), this['requestRender']?.()),
        !![]
      );
    }
    if (value56 === 'timeline-add-camera-keyframe') {
      const camera5 = this['readCurrentCamera']?.();
      if (!camera5) return (this['setMessage']?.('当前摄像机状态不可用。'), !![]);
      const time = this['_timeForShot'](shot9);
      return (
        this['_mutateAnimation']('add-camera-keyframe', 'Add camera keyframe', (value61) =>
          upsertStoryboard3DCameraKeyframe(value61, { time: time, camera: camera5 }),
        ),
        this['setMessage']?.(
          '已在\x20' +
            formatFrameTime(time, normalizeAnimation(scene7, shot9)['fps']) +
            ' 添加摄像机关键帧。',
        ),
        !![]
      );
    }
    if (value56 === 'timeline-add-object-keyframe') {
      const objectId2 = type2['dataset']['objectId'] || editorState3['selectedObjectIds']?.['at'](-0x1),
        property3 =
          type2['dataset']['property'] || this['_activeProperty'](objectId2, editorState3['activeTool']),
        transform = scene7['objects']['find']((value62) => value62['id'] === objectId2);
      if (!transform || !STORYBOARD_3D_OBJECT_ANIMATION_PROPERTIES['includes'](property3)) return !![];
      const time2 = this['_timeForShot'](shot9);
      return (
        this['_mutateAnimation']('add-object-keyframe', 'Add object keyframe', (value63) =>
          upsertStoryboard3DObjectKeyframe(value63, {
            objectId: objectId2,
            property: property3,
            time: time2,
            transform: transform['transform'],
          }),
        ),
        this['setMessage']?.(
          '已为“' + transform['name'] + '”的' + PROPERTY_LABELS[property3] + '添加关键帧。',
        ),
        !![]
      );
    }
    if (value56 === 'timeline-select-keyframe')
      return (
        this['stopPlayback']({ render: ![], clear: ![] }),
        (this['selectedKeyframe'] = {
          shotId: shot9['id'],
          type: type2['dataset']['keyframeType'],
          objectId: type2['dataset']['objectId'] || '',
          property: type2['dataset']['property'] || '',
          keyframeId: type2['dataset']['keyframeId'],
        }),
        this['_sampleAt'](Number(type2['dataset']['keyframeTime']) || 0x0),
        this['requestRender']?.(),
        !![]
      );
    if (value56 === 'timeline-copy-keyframe') {
      const args3 = this['selectedKeyframe'],
        time3 = this['_timeForShot'](shot9);
      return (
        this['_mutateAnimation']('copy-animation-keyframe', '复制关键帧', (value64) => {
          const args4 = findSelectedKeyframe(value64, args3);
          if (!args4) return value64;
          return args3['type'] === 'camera'
            ? upsertStoryboard3DCameraKeyframe(value64, { ...args4['keyframe'], time: time3 })
            : upsertStoryboard3DObjectKeyframe(value64, {
                ...args3,
                ...args4['keyframe'],
                time: time3,
              });
        }),
        !![]
      );
    }
    if (value56 === 'timeline-delete-keyframe') {
      if (!this['selectedKeyframe']) return !![];
      const value65 = { ...this['selectedKeyframe'] };
      return (
        this['_mutateAnimation']('delete-animation-keyframe', 'Delete\x20animation\x20keyframe', (value66) =>
          removeStoryboard3DAnimationKeyframe(value66, value65),
        ),
        (this['selectedKeyframe'] = null),
        !![]
      );
    }
    return !![];
  }
  ['handleInput'](event2) {
    if (event2['target']?.['matches']?.('[data-storyboard-3d-timeline-scrubber]'))
      return (
        this['stopPlayback']({ render: ![], clear: ![] }),
        this['_sampleAt'](Number(event2['target']['value']) || 0x0),
        !![]
      );
    return ![];
  }
  ['handleChange'](event3) {
    if (this['editing']['handleChange'](event3)) return !![];
    if (this['directorPanel']['handleChange'](event3)) return !![];
    const { scene: scene8, shot: shot10 } = this['_context']();
    if (!scene8 || !shot10) return ![];
    if (event3['target']?.['matches']?.('[data-storyboard-3d-timeline-auto-key]'))
      return ((this['autoKey'] = event3['target']['checked'] === !![]), this['requestRender']?.(), !![]);
    if (event3['target']?.['matches']?.('[data-storyboard-3d-timeline-setting]')) {
      const value67 = event3['target']['dataset']['storyboard3dTimelineSetting'],
        value68 = value67 === 'loop' ? event3['target']['checked'] : Number(event3['target']['value']);
      return (
        this['_mutateAnimation']('update-animation-settings', 'Update animation settings', (value69) =>
          updateStoryboard3DShotAnimationSettings(value69, { [value67]: value68 }),
        ),
        !![]
      );
    }
    if (event3['target']?.['matches']?.('[data-storyboard-3d-timeline-key-time]')) {
      const value70 = Number(event3['target']['value']);
      if (!Number['isFinite'](value70)) return !![];
      return (
        this['_mutateAnimation']('move-animation-keyframe', '移动关键帧', (value71) => {
          const selectedKeyframe4 = findSelectedKeyframe(value71, this['selectedKeyframe']);
          if (!selectedKeyframe4) return value71;
          const value72 = Math['max'](
              0x0,
              Math['min'](0xe10, Math['round'](value70 * value71['fps']) / value71['fps']),
            ),
            list5 =
              selectedKeyframe4['type'] === 'camera'
                ? value71['cameraKeyframes']
                : value71['objectTracks']['find'](
                    (value73) => value73['objectId'] === selectedKeyframe4['objectId'],
                  )?.[selectedKeyframe4['property'] + 'Keyframes'];
          if (
            list5['some'](
              (value74) =>
                value74['id'] !== selectedKeyframe4['keyframe']['id'] &&
                Math['abs'](value74['time'] - value72) < 0.5 / value71['fps'],
            )
          )
            return (this['setMessage']?.('该帧已有关键帧，请选择其他时间。'), value71);
          return (
            (selectedKeyframe4['keyframe']['time'] = value72),
            normalizeStoryboard3DShotAnimation(value71)
          );
        }),
        !![]
      );
    }
    if (event3['target']?.['matches']?.('[data-storyboard-3d-timeline-key-value]')) {
      const enabled3 = this['selectedKeyframe'];
      if (!enabled3 || enabled3['type'] !== 'object') return !![];
      const count = Number(event3['target']['dataset']['storyboard3dTimelineKeyValue']),
        value75 = Number(event3['target']['value']),
        value76 = enabled3['property'] === 'rotation' ? (value75 * Math['PI']) / 0xb4 : value75;
      return (
        this['_mutateAnimation']('update-animation-keyframe', 'Update animation keyframe', (value77) => {
          const value78 = value77['objectTracks']['find'](
              (value79) => value79['objectId'] === enabled3['objectId'],
            ),
            el11 = value78?.[enabled3['property'] + 'Keyframes']?.['find'](
              (value80) => value80['id'] === enabled3['keyframeId'],
            );
          return (
            el11 &&
              count >= 0x0 &&
              count < 0x3 &&
              Number['isFinite'](value76) &&
              (el11['value'][count] = value76),
            normalizeStoryboard3DShotAnimation(value77)
          );
        }),
        !![]
      );
    }
    if (event3['target']?.['matches']?.('[data-storyboard-3d-timeline-key-easing]')) {
      const enabled4 = this['selectedKeyframe'];
      if (!enabled4 || enabled4['type'] !== 'object') return !![];
      const value81 = String(event3['target']['value'] || 'ease-in-out');
      return (
        this['_mutateAnimation']('update-animation-easing', 'Update\x20animation\x20easing', (value82) => {
          const value83 = value82['objectTracks']['find'](
              (value84) => value84['objectId'] === enabled4['objectId'],
            ),
            value85 = value83?.[enabled4['property'] + 'Keyframes']?.['find'](
              (value86) => value86['id'] === enabled4['keyframeId'],
            );
          if (value85) value85['easing'] = value81;
          return normalizeStoryboard3DShotAnimation(value82);
        }),
        !![]
      );
    }
    return ![];
  }
  ['isAutoKeyEnabled']() {
    return this['autoKey'];
  }
  ['recordCameraKeyframe'](camera6) {
    if (!this['autoKey'] || !camera6) return ![];
    const { shot: shot11 } = this['_context']();
    if (!shot11) return ![];
    const time4 = this['_timeForShot'](shot11);
    return (
      this['_mutateAnimation']('auto-key-camera', 'Auto key camera', (value87) =>
        upsertStoryboard3DCameraKeyframe(value87, { time: time4, camera: camera6 }),
      ),
      !![]
    );
  }
  ['recordObjectTransforms'](value88, value89) {
    if (!this['autoKey']) return ![];
    const { scene: scene9, shot: shot12 } = this['_context']();
    if (!scene9 || !shot12) return ![];
    const property4 = TOOL_PROPERTIES[value89] || 'position',
      time5 = this['_timeForShot'](shot12);
    return (
      this['_mutateAnimation']('auto-key-objects', 'Auto key objects', (value90) => {
        let upsertStoryboard3DObjectKeyframe2 = value90;
        return (
          Object['entries'](value88 || {})['forEach'](([objectId3, transform2]) => {
            upsertStoryboard3DObjectKeyframe2 = upsertStoryboard3DObjectKeyframe(
              upsertStoryboard3DObjectKeyframe2,
              {
                objectId: objectId3,
                property: property4,
                time: time5,
                transform: transform2,
              },
            );
          }),
          upsertStoryboard3DObjectKeyframe2
        );
      }),
      !![]
    );
  }
  ['getPreviewTransform'](value91) {
    if (!this['hasPreview']) return null;
    const { scene: scene10, shot: shot13 } = this['_context']();
    if (!scene10 || !shot13) return null;
    return (
      sampleStoryboard3DShotAnimation(shot13['animation'], this['_timeForShot'](shot13), {
        camera: shot13['camera'],
        objectTransforms: createObjectTransforms(scene10),
      })['objectTransforms'][value91] || null
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
    const { shot: shot14 } = this['_context']();
    if (shot14) this['_sampleAt'](this['_timeForShot'](shot14));
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
export function createStoryboard3DShotTimelineController(value92) {
  return new Storyboard3DShotTimelineController(value92);
}
