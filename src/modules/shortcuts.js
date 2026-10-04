import { syncNotificationShortcut } from './settings/notificationShortcutSettings.js';
import { desktopBridge } from '../services/desktopBridge.js';
import { fetchUserShortcutsFromServer, saveUserShortcutsToServer } from '../../api/shortcutsApi.js';
import { onLocaleChange, t } from '../i18n/index.js';
const DEFAULT_PRESET_NAME = '默认预设',
  ASHUO_PRESET_NAME = '阿硕预设',
  CUSTOM_PRESET_NAME = '用户自定义',
  SHORTCUT_GROUP_I18N_KEYS = Object.freeze({
    通用: 'general',
    编辑与选择: 'editSelection',
    设置开关: 'settingToggles',
    创建节点: 'createNodes',
    侧边栏: 'sidebar',
    画笔功能: 'brushTools',
    图像功能: 'imageTools',
    视频功能: 'videoTools',
    音频功能: 'audioTools',
    剪辑功能: 'clipTools',
    文本功能: 'textTools',
    '3D导演台': 'panoramaStage',
  });
function _formatI18nMessage(value, item = {}) {
  let key = String(value || '');
  return (
    Object.entries(item || {}).forEach(([index, result]) => {
      key = key.split('{' + index + '}').join(String(result ?? ''));
    }),
    key
  );
}
function _tShortcut(data, options, target = {}) {
  const source = 'settings.shortcuts.' + data,
    t2 = t(source);
  return _formatI18nMessage(t2 === source ? options : t2, target);
}
function _translateShortcutGroup(next) {
  const current = SHORTCUT_GROUP_I18N_KEYS[next];
  return current ? _tShortcut('groups.' + current, next) : next;
}
function _translateShortcutAction(entry, record) {
  return _tShortcut('actions.' + entry, record || entry);
}
export const DEFAULT_SHORTCUTS = {
  'zoom-in': { label: '放大', keys: ['Ctrl', '+'], group: '通用' },
  'zoom-out': { label: '缩小', keys: ['Ctrl', '-'], group: '通用' },
  'fit-all': { label: '聚焦节点/适应画布', keys: ['Ctrl', '0'], group: '通用' },
  minimap: { label: '小地图', keys: ['M'], group: '通用' },
  'pan-canvas': { label: '拖动画布（按住）', keys: ['Space'], group: '通用' },
  copy: { label: '复制节点', keys: ['Ctrl', 'C'], group: '编辑与选择' },
  'copy-media': { label: '复制图像', keys: ['Ctrl', 'Shift', 'C'], group: '编辑与选择' },
  cut: { label: '剪切节点', keys: ['Ctrl', 'X'], group: '编辑与选择' },
  'canvas-screenshot': { label: '画布截图', keys: ['Alt', 'Q'], group: '编辑与选择' },
  'duplicate-with-edges': { label: '拖拽创建连线副本', keys: ['Alt'], group: '编辑与选择' },
  paste: { label: '粘贴节点', keys: ['Ctrl', 'V'], group: '编辑与选择' },
  undo: { label: '撤销', keys: ['Ctrl', 'Z'], group: '编辑与选择' },
  redo: { label: '重做', keys: ['Ctrl', 'Y'], group: '编辑与选择' },
  delete: {
    label: '删除节点',
    keys: ['Delete'],
    alternateKeys: [['Delete'], ['Backspace']],
    group: '编辑与选择',
  },
  'select-all': { label: '全选', keys: ['Ctrl', 'A'], group: '编辑与选择' },
  'multi-select': { label: '多选节点（配合点击）', keys: ['Shift'], group: '编辑与选择' },
  group: { label: '编组', keys: ['Ctrl', 'G'], group: '编辑与选择' },
  'align-feature': { label: '多选对齐功能', keys: ['Tab'], group: '通用' },
  'grid-dots': { label: '显示网格点', keys: ['G'], group: '设置开关' },
  'toggle-connection-lines': { label: '显示/隐藏连接线', keys: ['B'], group: '设置开关' },
  'toggle-selection-related-highlight': { label: '点击节点时高亮关联节点', keys: [], group: '设置开关' },
  'snap-guides': { label: '辅助线吸附', keys: ['Shift', ';'], group: '设置开关' },
  'snap-grid': { label: '网格吸附开关', keys: ['Shift', 'G'], group: '设置开关' },
  'toggle-video-meta': { label: '视频节点信息', keys: [], group: '设置开关' },
  'toggle-title-follows-zoom': { label: '标题跟随画布缩放', keys: [], group: '设置开关' },
  'toggle-media-node-resize': { label: '图像视频节点缩放', keys: [], group: '设置开关' },
  'toggle-prompt-box-resize': { label: '允许提示词栏下拉', keys: [], group: '设置开关' },
  'toggle-node-avoid-overlap': { label: '新节点自动避让', keys: [], group: '设置开关' },
  'reset-media-size': { label: '恢复节点默认大小', keys: ['Shift', 'R'], group: '编辑与选择' },
  'add-reference': { label: '添加参考', keys: ['X'], group: '编辑与选择' },
  'toggle-agent': { label: '打开/关闭 AiCanvas Agent', keys: ['T'], group: '侧边栏' },
  'create-text': { label: '创建源文本节点', keys: [], group: '创建节点' },
  'create-comment-note': { label: '创建注释节点', keys: ['N'], group: '创建节点' },
  'create-ai-text': { label: '创建生成文本节点', keys: ['Q'], group: '创建节点' },
  'create-ai-image': { label: '创建生成图像节点', keys: ['W'], group: '创建节点' },
  'create-ai-video': { label: '创建生成视频节点', keys: ['E'], group: '创建节点' },
  'create-ai-audio': { label: '创建生成音频节点', keys: ['R'], group: '创建节点' },
  'cut-edge': { label: '剪刀（切断连线）', keys: ['Ctrl'], group: '编辑与选择' },
  save: { label: '保存画布', keys: ['Ctrl', 'S'], group: '通用' },
  'open-settings': { label: '打开设置', keys: ['Ctrl', ','], group: '通用' },
  'open-canvas-projects': { label: '打开画布项目', keys: [], group: '侧边栏' },
  'open-assets': { label: '打开资产', keys: [], group: '侧边栏' },
  'open-workflows': { label: '打开工作流', keys: [], group: '侧边栏' },
  'open-files': { label: '打开文件管理', keys: [], group: '侧边栏' },
  'open-task-center': { label: '打开任务进程', keys: [], group: '侧边栏' },
  'escape-all': { label: '取消/关闭所有菜单弹窗', keys: ['Escape'], group: '通用', hidden: true },
  'editor-tool-brush': { label: '画笔（切换模式）', keys: ['B'], group: '画笔功能' },
  'editor-tool-rect': { label: '矩形', keys: [], group: '画笔功能' },
  'editor-tool-eraser': { label: '橡皮擦', keys: ['E'], group: '画笔功能' },
  'editor-tool-bucket': { label: '油漆桶', keys: ['G'], group: '画笔功能' },
  'editor-clear': { label: '清空', keys: ['R'], group: '画笔功能' },
  'image-tool-matting': { label: '遮罩编辑器', keys: ['1'], group: '图像功能' },
  'image-tool-repaint': { label: '重绘', keys: ['2'], group: '图像功能' },
  'image-tool-erase': { label: '擦除', keys: ['3'], group: '图像功能' },
  'image-tool-hd': { label: '高清', keys: ['4'], group: '图像功能' },
  'image-tool-expand': { label: '扩图', keys: ['5'], group: '图像功能' },
  'image-tool-auto-subject': { label: '自动识别主体', keys: ['6'], group: '图像功能' },
  'image-tool-multigrid': { label: '宫格裁剪', keys: ['7'], group: '图像功能' },
  'image-tool-multiangle': { label: '控制角度', keys: ['8'], group: '图像功能' },
  'image-tool-annotate': { label: '标注', keys: ['9'], group: '图像功能' },
  'image-tool-crop': { label: '裁剪', keys: ['0'], group: '图像功能' },
  'image-tool-fullscreen': { label: '全屏显示', keys: ['-'], group: '图像功能' },
  'image-tool-download': { label: '下载', keys: ['='], group: '图像功能' },
  'video-tool-clip': { label: '裁剪视频', keys: ['1'], group: '视频功能' },
  'video-tool-separate-av': { label: '音画分离', keys: ['6'], group: '视频功能' },
  'video-tool-capture-frame': { label: '截取当前帧', keys: ['C'], group: '视频功能' },
  'video-tool-keying': { label: '抠像', keys: ['2'], group: '视频功能' },
  'video-tool-hd': { label: '高清', keys: ['3'], group: '视频功能' },
  'video-tool-fullscreen': { label: '全屏显示', keys: ['4'], group: '视频功能' },
  'video-tool-download': { label: '下载', keys: ['5'], group: '视频功能' },
  'ms-sync-video-play': { label: '同步播放视频', keys: [], group: '视频功能' },
  'audio-tool-clip': { label: '裁剪音频', keys: ['1'], group: '音频功能' },
  'audio-tool-speed': { label: '倍速', keys: ['2'], group: '音频功能' },
  'audio-tool-download': { label: '下载', keys: ['3'], group: '音频功能' },
  'clip-tool-crop': { label: '剪辑裁剪', keys: ['C'], group: '剪辑功能' },
  'text-tool-copy': { label: '复制', keys: ['1'], group: '文本功能' },
  'text-tool-fullscreen': { label: '全屏显示', keys: ['2'], group: '文本功能' },
  'panorama-scene-tool-toggle-mouse': { label: '鼠标', keys: ['V'], group: '3D导演台' },
  'panorama-scene-tool-move': { label: '移动', keys: ['W'], group: '3D导演台' },
  'panorama-scene-tool-scale': { label: '缩放', keys: ['E'], group: '3D导演台' },
  'panorama-scene-tool-rotate': { label: '旋转', keys: ['R'], group: '3D导演台' },
  'panorama-scene-reset-view': { label: '重置视角', keys: [], group: '3D导演台' },
  'panorama-scene-capture': { label: '截图', keys: ['C'], group: '3D导演台' },
  'panorama-scene-camera-create': { label: '创建机位书签', keys: ['`'], group: '3D导演台' },
  'panorama-scene-camera-1': { label: '跳转机位书签 1', keys: ['1'], group: '3D导演台' },
  'panorama-scene-camera-2': { label: '跳转机位书签 2', keys: ['2'], group: '3D导演台' },
  'panorama-scene-camera-3': { label: '跳转机位书签 3', keys: ['3'], group: '3D导演台' },
  'panorama-scene-camera-4': { label: '跳转机位书签 4', keys: ['4'], group: '3D导演台' },
  'panorama-scene-camera-5': { label: '跳转机位书签 5', keys: ['5'], group: '3D导演台' },
  'panorama-scene-camera-6': { label: '跳转机位书签 6', keys: ['6'], group: '3D导演台' },
  'panorama-scene-camera-7': { label: '跳转机位书签 7', keys: ['7'], group: '3D导演台' },
  'panorama-scene-camera-8': { label: '跳转机位书签 8', keys: ['8'], group: '3D导演台' },
  'panorama-scene-camera-9': { label: '跳转机位书签 9', keys: ['9'], group: '3D导演台' },
  'panorama-scene-camera-0': { label: '跳转机位书签 10', keys: [], group: '3D导演台' },
  'panorama-scene-camera-save-1': {
    label: '保存当前视图到机位书签 1',
    keys: ['Ctrl', '1'],
    group: '3D导演台',
  },
  'panorama-scene-camera-save-2': {
    label: '保存当前视图到机位书签 2',
    keys: ['Ctrl', '2'],
    group: '3D导演台',
  },
  'panorama-scene-camera-save-3': {
    label: '保存当前视图到机位书签 3',
    keys: ['Ctrl', '3'],
    group: '3D导演台',
  },
  'panorama-scene-camera-save-4': {
    label: '保存当前视图到机位书签 4',
    keys: ['Ctrl', '4'],
    group: '3D导演台',
  },
  'panorama-scene-camera-save-5': {
    label: '保存当前视图到机位书签 5',
    keys: ['Ctrl', '5'],
    group: '3D导演台',
  },
  'panorama-scene-camera-save-6': {
    label: '保存当前视图到机位书签 6',
    keys: ['Ctrl', '6'],
    group: '3D导演台',
  },
  'panorama-scene-camera-save-7': {
    label: '保存当前视图到机位书签 7',
    keys: ['Ctrl', '7'],
    group: '3D导演台',
  },
  'panorama-scene-camera-save-8': {
    label: '保存当前视图到机位书签 8',
    keys: ['Ctrl', '8'],
    group: '3D导演台',
  },
  'panorama-scene-camera-save-9': {
    label: '保存当前视图到机位书签 9',
    keys: ['Ctrl', '9'],
    group: '3D导演台',
  },
  'panorama-scene-camera-save-0': { label: '保存当前视图到机位书签 10', keys: [], group: '3D导演台' },
};
export const PRESETS = {
  [DEFAULT_PRESET_NAME]: {},
  [ASHUO_PRESET_NAME]: {
    'fit-all': ['F'],
    redo: ['Ctrl', 'Shift', 'Z'],
    delete: ['D'],
    'snap-guides': [';'],
    'snap-grid': ['L'],
    'grid-dots': ['.'],
    'ms-sync-video-play': ['G'],
    'create-text': [],
    'open-settings': ['K'],
    'open-assets': ['A'],
    'open-files': ['Z'],
  },
};
const BUILTIN_PRESET_NAMES = new Set(Object.keys(PRESETS));
let _shortcuts = {},
  _currentPreset = ASHUO_PRESET_NAME,
  _recordingAction = null;
const DEFAULT_SHORTCUT_MIGRATIONS = {
    'panorama-scene-tool-move': { from: ['Q'], to: ['W'] },
    'panorama-scene-tool-scale': { from: ['W'], to: ['E'] },
    'panorama-scene-tool-rotate': { from: ['E'], to: ['R'] },
    'panorama-scene-reset-view': { from: ['R'], to: [] },
  },
  ASHUO_PRESET_SHORTCUT_MIGRATIONS = {
    'open-assets': { from: [], to: ['A'] },
    'open-files': { from: [], to: ['Z'] },
  },
  BUILTIN_PRESET_SHORTCUT_MIGRATIONS = {
    'add-reference': { from: [], to: ['X'] },
    'create-text': { from: ['T'], to: [] },
  };
function _emitShortcutsUpdated() {
  window.dispatchEvent(new CustomEvent('shortcuts-updated'));
}
const _TOOLBAR_SHORTCUT_PREFIX_BY_NODE_TYPE = {
    'source-image': 'image-tool-',
    'ai-image': 'image-tool-',
    image: 'image-tool-',
    'source-video': 'video-tool-',
    'ai-video': 'video-tool-',
    video: 'video-tool-',
    'source-audio': 'audio-tool-',
    'ai-audio': 'audio-tool-',
    audio: 'audio-tool-',
    'media-clip': 'clip-tool-',
    'source-text': 'text-tool-',
    'ai-text': 'text-tool-',
    text: 'text-tool-',
  },
  _PANORAMA_SCENE_NODE_TYPES = new Set(['panorama-scene', 'panorama-360']);
function _isPanoramaSceneShortcut(payload) {
  const handle = String(payload || '').trim();
  return (
    handle.startsWith('panorama-scene-tool-') ||
    handle.startsWith('panorama-scene-camera-') ||
    handle.startsWith('panorama-scene-camera-save-') ||
    handle === 'panorama-scene-camera-create' ||
    handle === 'panorama-scene-reset-view' ||
    handle === 'panorama-scene-capture'
  );
}
function _isNodeToolbarAction(state) {
  return /^(image|video|audio|clip|text)-tool-/.test(String(state || ''));
}
function _isEditorShortcut(config) {
  return String(config || '')
    .trim()
    .startsWith('editor-');
}
function _isCreateNodeShortcut(scope) {
  return String(scope || '')
    .trim()
    .startsWith('create-');
}
function _isGlobalShortcut(input) {
  const enabled = String(input || '').trim();
  if (!enabled) return false;
  return (
    !_isEditorShortcut(enabled) &&
    !_isNodeToolbarAction(enabled) &&
    !_isPanoramaSceneShortcut(enabled) &&
    !_isCreateNodeShortcut(enabled)
  );
}
function _isPanoramaSceneNodeType(output) {
  return _PANORAMA_SCENE_NODE_TYPES.has(String(output || '').trim());
}
function _isPanoramaSceneEditingContext(value2) {
  return _isPanoramaSceneNodeType(value2?.selectedNodeType) && value2?.panoramaSceneEditing === true;
}
function _filterShortcutMatchesByContext(args, value3 = {}) {
  let list = Array.isArray(args) ? [...args] : [];
  return (
    !(Number(value3.selectedSyncPlayableVideoCount) >= 2) &&
      (list = list.filter((item2) => item2 !== 'ms-sync-video-play')),
    value3.featureModeActive && (list = list.filter((item3) => !_isNodeToolbarAction(item3))),
    value3.alignFeatureEnabled === false && (list = list.filter((item4) => item4 !== 'align-feature')),
    value3.mediaClipExpandedEditing === true && (list = list.filter((item5) => item5 !== 'pan-canvas')),
    _isPanoramaSceneEditingContext(value3) &&
      (list = list.filter((item6) => !_isNodeToolbarAction(item6) && !_isCreateNodeShortcut(item6))),
    list
  );
}
function _resolveToolbarShortcutMatch(list2, value4) {
  const enabled2 = _TOOLBAR_SHORTCUT_PREFIX_BY_NODE_TYPE[String(value4 || '').trim()];
  if (!enabled2) return null;
  return list2.find((item7) => item7.startsWith(enabled2)) || null;
}
function _resolveShortcutMatch(list3, value5 = {}) {
  if (!Array.isArray(list3) || list3.length === 0) return null;
  if (value5.mattingActive || value5.annotateActive || value5.videoKeyingActive) {
    const value6 = list3.find((item8) => _isEditorShortcut(item8));
    if (value6) return value6;
  }
  if (_isPanoramaSceneEditingContext(value5)) {
    const value7 = list3.find((item9) => _isPanoramaSceneShortcut(item9));
    if (value7) return value7;
  }
  const _resolveToolbarShortcutMatch2 = _resolveToolbarShortcutMatch(list3, value5.selectedNodeType);
  if (_resolveToolbarShortcutMatch2) return _resolveToolbarShortcutMatch2;
  const value8 = list3.find((item10) => _isGlobalShortcut(item10));
  if (value8) return value8;
  const value9 = list3.find((item11) => _isCreateNodeShortcut(item11));
  if (value9) return value9;
  return null;
}
function _getShortcutBindingStrings(map) {
  const list4 = [];
  return (
    Array.isArray(map?.keys) && map.keys.length > 0 && list4.push(map.keys),
    Array.isArray(map?.alternateKeys) &&
      map.alternateKeys.forEach((list5) => {
        Array.isArray(list5) && list5.length > 0 && list4.push(list5);
      }),
    list4.map((item12) => _toShortcutBindingString(item12))
  );
}
function _normalizeShortcutToken(value10) {
  const list6 = String(value10 || '').trim();
  if (!list6) return '';
  const value11 = list6.toLowerCase();
  if (value11 === 'ctrl' || value11 === 'control' || value11 === 'meta') return 'Ctrl';
  if (value11 === 'shift') return 'Shift';
  if (value11 === 'alt') return 'Alt';
  if (value11 === 'space') return 'Space';
  if (value11 === 'backquote' || list6 === '`' || list6 === '~') return '`';
  if (list6.length === 1) return list6.toUpperCase();
  return list6;
}
function _normalizeShortcutMainKey(event) {
  const value12 = String(event?.code || '').trim(),
    value13 = String(event?.key || '').trim();
  if (value12 === 'Backquote') return '`';
  if (value12 === 'Space') return 'Space';
  if (value12 === 'Delete' || value13 === 'Del') return 'Delete';
  if (value12 === 'Backspace') return 'Backspace';
  return _normalizeShortcutToken(event?.key === ' ' ? 'Space' : event?.key);
}
function _normalizeShortcutKeys(list7) {
  if (!Array.isArray(list7)) return [];
  const list8 = list7.map((item13) => _normalizeShortcutToken(item13)).filter(Boolean),
    list9 = [];
  if (list8.includes('Ctrl')) list9.push('Ctrl');
  if (list8.includes('Shift')) list9.push('Shift');
  if (list8.includes('Alt')) list9.push('Alt');
  const args2 = list8.filter((item14) => item14 !== 'Ctrl' && item14 !== 'Shift' && item14 !== 'Alt');
  return [...list9, ...args2];
}
function _buildShortcutKeysFromEvent(value14) {
  const list10 = [];
  if (value14.ctrlKey || value14.metaKey) list10.push('Ctrl');
  if (value14.shiftKey) list10.push('Shift');
  if (value14.altKey) list10.push('Alt');
  const _normalizeShortcutMainKey2 = _normalizeShortcutMainKey(value14);
  return (
    !['Ctrl', 'Shift', 'Alt', ''].includes(_normalizeShortcutMainKey2) &&
      list10.push(_normalizeShortcutMainKey2),
    list10
  );
}
function _toShortcutBindingString(value15) {
  return _normalizeShortcutKeys(value15).join('+').toUpperCase();
}
function _isContextualShortcutConflictExempt(value16, value17, value18) {
  const map2 = new Set([value16, value17]);
  if (value18 === 'B') return map2.has('toggle-connection-lines') && map2.has('editor-tool-brush');
  if (value18 === 'G') return map2.has('ms-sync-video-play') && map2.has('editor-tool-bucket');
  return false;
}
function _resolveSavedShortcutKeys(value19, value20, value21, value22 = {}) {
  const value23 = Array.isArray(value20),
    value24 = value23 ? _normalizeShortcutKeys(value20) : [],
    value25 =
      value22.savedPresetName === ASHUO_PRESET_NAME ? ASHUO_PRESET_SHORTCUT_MIGRATIONS[value19] : null,
    value26 = BUILTIN_PRESET_NAMES.has(value22.savedPresetName)
      ? BUILTIN_PRESET_SHORTCUT_MIGRATIONS[value19]
      : null;
  if (value23 && value25 && _toShortcutBindingString(value24) === _toShortcutBindingString(value25.from))
    return _normalizeShortcutKeys(value25.to);
  if (value23 && value26 && _toShortcutBindingString(value24) === _toShortcutBindingString(value26.from))
    return _normalizeShortcutKeys(value26.to);
  const value27 = DEFAULT_SHORTCUT_MIGRATIONS[value19];
  if (value23 && value27 && _toShortcutBindingString(value24) === _toShortcutBindingString(value27.from))
    return _normalizeShortcutKeys(value27.to);
  return value23 ? value24 : _normalizeShortcutKeys(value21);
}
function _normalizePresetName(value28) {
  const value29 = String(value28 || '').trim();
  if (value29 === '自定义') return CUSTOM_PRESET_NAME;
  if (BUILTIN_PRESET_NAMES.has(value29)) return value29;
  if (value29 === CUSTOM_PRESET_NAME) return CUSTOM_PRESET_NAME;
  return ASHUO_PRESET_NAME;
}
function _buildPresetShortcuts(value30) {
  const _normalizePresetName2 = _normalizePresetName(value30),
    value31 = PRESETS[_normalizePresetName2] || {};
  return Object.fromEntries(
    Object.entries(DEFAULT_SHORTCUTS).map(([value32, map3]) => [
      value32,
      { ...map3, keys: _normalizeShortcutKeys(value31[value32] ?? [...map3.keys]) },
    ]),
  );
}
function _shortcutsMatchPreset(value33, value34) {
  const _buildPresetShortcuts2 = _buildPresetShortcuts(value34);
  return Object.entries(_buildPresetShortcuts2).every(([value35, map4]) => {
    const value36 = value33?.[value35]?.keys || [];
    return _toShortcutBindingString(value36) === _toShortcutBindingString(map4.keys);
  });
}
function _inferPresetName(value37, value38) {
  if (_normalizePresetName(value38) === CUSTOM_PRESET_NAME) return CUSTOM_PRESET_NAME;
  if (_shortcutsMatchPreset(value37, DEFAULT_PRESET_NAME)) return DEFAULT_PRESET_NAME;
  if (_shortcutsMatchPreset(value37, ASHUO_PRESET_NAME)) return ASHUO_PRESET_NAME;
  return CUSTOM_PRESET_NAME;
}
async function _loadFromServer() {
  try {
    const fetchUserShortcutsFromServer2 = await fetchUserShortcutsFromServer();
    if (
      fetchUserShortcutsFromServer2 &&
      fetchUserShortcutsFromServer2.shortcuts &&
      Object.keys(fetchUserShortcutsFromServer2.shortcuts).length > 0
    ) {
      const savedPresetName = _normalizePresetName(fetchUserShortcutsFromServer2.preset),
        value39 = BUILTIN_PRESET_NAMES.has(savedPresetName) ? savedPresetName : ASHUO_PRESET_NAME,
        _buildPresetShortcuts3 = _buildPresetShortcuts(value39);
      ((_shortcuts = Object.fromEntries(
        Object.entries(_buildPresetShortcuts3).map(([value40, map5]) => [
          value40,
          fetchUserShortcutsFromServer2.shortcuts[value40]
            ? {
                ...map5,
                keys: _resolveSavedShortcutKeys(
                  value40,
                  fetchUserShortcutsFromServer2.shortcuts[value40].keys,
                  map5.keys,
                  { savedPresetName: savedPresetName },
                ),
              }
            : { ...map5, keys: _normalizeShortcutKeys(map5.keys) },
        ]),
      )),
        (_currentPreset = _inferPresetName(_shortcuts, savedPresetName)));
      if (_shortcuts['matting-auto']) _shortcuts['matting-auto'].keys = [];
      (_updatePresetSelect(), _render(), _syncShortcutsToGlobal());
    } else (_applyPreset(ASHUO_PRESET_NAME, false), _syncShortcutsToGlobal());
  } catch {
    (_applyPreset(ASHUO_PRESET_NAME, false), _syncShortcutsToGlobal());
  }
}
async function _saveToServer() {
  const value41 = {
    preset: _currentPreset,
    shortcuts: Object.fromEntries(
      Object.entries(_shortcuts).map(([value42, keys]) => [value42, { keys: keys.keys }]),
    ),
  };
  try {
    (await saveUserShortcutsToServer(value41), _syncShortcutsToGlobal());
  } catch (value43) {
    console.warn('[shortcuts] save failed:', value43);
  }
}
function _syncCanvasScreenshotShortcutToElectron() {
  if (typeof window === 'undefined') return;
  const value44 = globalThis.window?.electronAPI?.screenshot;
  if (typeof value44?.updateGlobalShortcut !== 'function') return;
  const keys2 = Array.isArray(_shortcuts?.['canvas-screenshot']?.keys)
    ? _shortcuts['canvas-screenshot'].keys
    : DEFAULT_SHORTCUTS['canvas-screenshot'].keys;
  try {
    const promise = value44.updateGlobalShortcut({ keys: keys2 });
    if (promise && typeof promise.catch === 'function')
      promise.catch((value45) => {
        console.warn('[shortcuts] failed to sync global screenshot shortcut:', value45);
      });
  } catch (value46) {
    console.warn('[shortcuts] failed to sync global screenshot shortcut:', value46);
  }
}
function _syncShortcutsToGlobal() {
  const value47 = {},
    list11 = ['editor-tool-brush', 'editor-tool-eraser', 'editor-tool-bucket', 'editor-clear'];
  (list11.forEach((item15) => {
    if (_shortcuts[item15]?.keys?.length > 0) {
      const value48 = _shortcuts[item15].keys[_shortcuts[item15].keys.length - 1];
      value47[item15] = value48.toUpperCase();
    }
  }),
    (window._mattingShortcuts = value47),
    _syncCanvasScreenshotShortcutToElectron());
}
function _applyPreset(value49, value50 = true) {
  const _normalizePresetName3 = _normalizePresetName(value49);
  if (!BUILTIN_PRESET_NAMES.has(_normalizePresetName3)) return;
  ((_currentPreset = _normalizePresetName3),
    (_shortcuts = _buildPresetShortcuts(_normalizePresetName3)),
    _render(),
    _syncShortcutsToGlobal(),
    _emitShortcutsUpdated());
  if (value50) _saveToServer();
}
function _getPresetControls() {
  if (typeof document === 'undefined') return {};
  const select = document.getElementById('shortcutsPresetSelect'),
    control = document.getElementById('shortcutsPresetControl'),
    trigger = document.getElementById('shortcutsPresetTrigger'),
    triggerText = document.getElementById('shortcutsPresetTriggerText'),
    menu = document.getElementById('shortcutsPresetMenu'),
    options2 = menu?.querySelectorAll ? Array.from(menu.querySelectorAll('.settings-preset-option')) : [];
  return {
    select: select,
    control: control,
    trigger: trigger,
    triggerText: triggerText,
    menu: menu,
    options: options2,
  };
}
function _getPresetLabel(value51) {
  const { select: select2, options: options3 } = _getPresetControls(),
    el = select2?.options ? Array.from(select2.options).find((el2) => el2.value === value51) : null,
    el3 = options3.find((el4) => el4.dataset?.value === value51);
  return el?.textContent || el3?.textContent || value51;
}
function _setPresetMenuOpen(
  enabled3,
  { focusOption: focusOption = false, focusTrigger: focusTrigger = false } = {},
) {
  const { control: control2, trigger: trigger2, menu: menu2, options: options4 } = _getPresetControls();
  if (!control2 || !trigger2 || !menu2) return;
  (control2.classList.toggle('is-open', enabled3),
    trigger2.setAttribute('aria-expanded', enabled3 ? 'true' : 'false'),
    (menu2.hidden = !enabled3));
  if (enabled3 && focusOption) {
    const value52 = options4.find((el5) => el5.dataset?.value === _currentPreset && !el5.disabled),
      value53 = options4.find((el6) => !el6.disabled);
    (value52 || value53)?.focus?.();
  } else !enabled3 && focusTrigger && trigger2.focus?.();
}
function _isPresetMenuOpen() {
  const { control: control3 } = _getPresetControls();
  return !!control3?.classList?.contains('is-open');
}
function _selectPresetFromUi(value54) {
  if (_normalizePresetName(value54) === CUSTOM_PRESET_NAME) {
    (_updatePresetSelect(), _setPresetMenuOpen(false, { focusTrigger: true }));
    return;
  }
  const _normalizePresetName4 = _normalizePresetName(value54);
  (_applyPreset(_normalizePresetName4, true),
    _updatePresetSelect(),
    _setPresetMenuOpen(false, { focusTrigger: true }),
    window.showToast?.(
      _tShortcut('presetSwitched', '已切换预设：' + _normalizePresetName4, {
        preset: _getPresetLabel(_normalizePresetName4),
      }),
    ));
}
function _movePresetOptionFocus(value55) {
  const { options: options5 } = _getPresetControls(),
    list12 = options5.filter((el7) => !el7.disabled);
  if (list12.length === 0) return;
  const value56 = document.activeElement;
  let count = list12.indexOf(value56);
  count < 0 && (count = list12.findIndex((el8) => el8.dataset?.value === _currentPreset));
  const value57 = (Math.max(count, 0) + value55 + list12.length) % list12.length;
  list12[value57]?.focus?.();
}
function _updatePresetSelect() {
  const { select: select3, triggerText: triggerText2, options: options6 } = _getPresetControls();
  if (select3) select3.value = _currentPreset;
  if (triggerText2) triggerText2.textContent = _getPresetLabel(_currentPreset);
  options6.forEach((el9) => {
    const value58 = el9.dataset?.value === _currentPreset;
    (el9.classList.toggle('is-active', value58),
      el9.setAttribute('aria-selected', value58 ? 'true' : 'false'));
  });
}
function _initPresetSelect() {
  const { select: select4, control: control4, trigger: trigger3, menu: menu3 } = _getPresetControls();
  select4 &&
    !select4.dataset.presetSelectBound &&
    ((select4.dataset.presetSelectBound = 'true'),
    select4.addEventListener('change', () => {
      _selectPresetFromUi(select4.value);
    }));
  if (!control4 || !trigger3 || !menu3 || trigger3.dataset.presetSelectBound) {
    _updatePresetSelect();
    return;
  }
  ((trigger3.dataset.presetSelectBound = 'true'),
    trigger3.addEventListener('click', () => {
      _setPresetMenuOpen(!_isPresetMenuOpen(), { focusOption: true });
    }),
    trigger3.addEventListener('keydown', (event2) => {
      (event2.key === 'ArrowDown' || event2.key === 'Enter' || event2.key === ' ') &&
        (event2.preventDefault(), _setPresetMenuOpen(true, { focusOption: true }));
    }),
    menu3.addEventListener('click', (event3) => {
      const el10 = event3.target?.closest?.('.settings-preset-option');
      if (!el10 || el10.disabled) return;
      _selectPresetFromUi(el10.dataset.value);
    }),
    menu3.addEventListener('keydown', (event4) => {
      if (event4.key === 'Escape')
        (event4.preventDefault(), _setPresetMenuOpen(false, { focusTrigger: true }));
      else {
        if (event4.key === 'ArrowDown') (event4.preventDefault(), _movePresetOptionFocus(1));
        else {
          if (event4.key === 'ArrowUp') (event4.preventDefault(), _movePresetOptionFocus(-1));
          else {
            if (event4.key === 'Enter' || event4.key === ' ') {
              event4.preventDefault();
              const el11 = document.activeElement?.closest?.('.settings-preset-option');
              if (el11 && !el11.disabled) _selectPresetFromUi(el11.dataset.value);
            }
          }
        }
      }
    }),
    document.addEventListener('pointerdown', (event5) => {
      if (!_isPresetMenuOpen()) return;
      if (typeof control4.contains === 'function' && control4.contains(event5.target)) return;
      _setPresetMenuOpen(false);
    }),
    _updatePresetSelect());
}
function _render() {
  const el12 = document.getElementById('shortcutsContent');
  if (!el12) return;
  el12.replaceChildren();
  const enabled4 = {};
  (Object.entries(_shortcuts).forEach(([id, el13]) => {
    if (el13.hidden) return;
    if (!enabled4[el13.group]) enabled4[el13.group] = [];
    enabled4[el13.group].push({ id: id, ...el13 });
  }),
    Object.entries(enabled4).forEach(([value59, list13]) => {
      const el14 = document.createElement('div');
      el14.className = 'sc-section';
      const el15 = document.createElement('div');
      ((el15.className = 'sc-section-title'),
        (el15.textContent = _translateShortcutGroup(value59)),
        el14.appendChild(el15),
        list13.forEach((map6) => {
          const el16 = document.createElement('div');
          el16.className = 'sc-item';
          const el17 = document.createElement('span');
          ((el17.className = 'sc-label'), (el17.textContent = _translateShortcutAction(map6.id, map6.label)));
          const el18 = document.createElement('div');
          ((el18.className = 'sc-keys'), (el18.dataset.action = map6.id), el18.replaceChildren());
          if (_recordingAction === map6.id) {
            const el19 = document.createElement('kbd');
            ((el19.className = 'kbd-v2 recording'),
              (el19.textContent = _tShortcut('recording', '录制中...')),
              el18.appendChild(el19));
          } else {
            if (map6.keys.length > 0)
              map6.keys.forEach((item16) => {
                const el20 = document.createElement('kbd');
                ((el20.className = 'kbd-v2'), (el20.textContent = item16), el18.appendChild(el20));
              });
            else {
              const el21 = document.createElement('kbd');
              ((el21.className = 'kbd-v2'),
                (el21.textContent = _tShortcut('unset', '未设置')),
                el18.appendChild(el21));
            }
          }
          (el18.addEventListener('click', () => _startRecording(map6.id)),
            el16.appendChild(el17),
            el16.appendChild(el18),
            el14.appendChild(el16));
        }),
        el12.appendChild(el14));
    }));
}
function _startRecording(value60) {
  if (_recordingAction) return;
  ((_recordingAction = value60), _render());
}
export function detectShortcutConflict(enabled5, value61, value62) {
  if (!enabled5 || typeof enabled5 !== 'object') return null;
  const _toShortcutBindingString2 = _toShortcutBindingString(value62);
  if (!_toShortcutBindingString2) return null;
  for (const [id2, label] of Object.entries(enabled5)) {
    if (id2 === value61) continue;
    if (_getShortcutBindingStrings(label).includes(_toShortcutBindingString2)) {
      if (_isContextualShortcutConflictExempt(value61, id2, _toShortcutBindingString2)) continue;
      return { id: id2, label: label.label || id2 };
    }
  }
  return null;
}
function _stopRecording(list14) {
  if (!_recordingAction) return;
  if (list14 && list14.length > 0) {
    const detectShortcutConflict2 = detectShortcutConflict(_shortcuts, _recordingAction, list14);
    if (detectShortcutConflict2) {
      (window.showToast?.(
        _tShortcut('conflict', '快捷键冲突：已被「' + detectShortcutConflict2.label + '」占用', {
          label: _translateShortcutAction(detectShortcutConflict2.id, detectShortcutConflict2.label),
        }),
        'warn',
      ),
        (_recordingAction = null),
        _render());
      return;
    }
    ((_shortcuts[_recordingAction].keys = _normalizeShortcutKeys(list14)),
      (_currentPreset = CUSTOM_PRESET_NAME),
      _updatePresetSelect(),
      _syncShortcutsToGlobal(),
      _emitShortcutsUpdated(),
      _saveToServer(),
      window.showToast?.(_tShortcut('updated', '快捷键已更新'), 'success'));
  }
  ((_recordingAction = null), _render());
}
function _reset() {
  (_applyPreset(DEFAULT_PRESET_NAME, true),
    _updatePresetSelect(),
    window.showToast?.(_tShortcut('restored', '已恢复默认快捷键')));
}
function _dispatchWebPreviewSettingsSync(reason) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  const detail = { reason: reason },
    value63 =
      typeof CustomEvent === 'function'
        ? new CustomEvent('web-preview:force-sync', { detail: detail })
        : { type: 'web-preview:force-sync', detail: detail };
  window.dispatchEvent(value63);
}
export function openShortcuts() {
  const el22 = document.getElementById('settingsOverlay');
  if (!el22) return;
  ((el22.style.display = 'block'), _dispatchWebPreviewSettingsSync('shortcuts-open'));
  const list15 = document.querySelectorAll('.settings-nav-item'),
    list16 = document.querySelectorAll('.settings-pane');
  (list15.forEach((el23) => {
    el23.classList.toggle('active', el23.dataset.pane === 'shortcuts');
  }),
    list16.forEach((el24) => {
      el24.classList.toggle('active', el24.id === 'pane-shortcuts');
    }),
    _render(),
    _updatePresetSelect());
}
export function closeShortcuts() {
  const el25 = document.getElementById('settingsOverlay');
  (el25 && ((el25.style.display = 'none'), _dispatchWebPreviewSettingsSync('shortcuts-close')),
    _recordingAction && ((_recordingAction = null), _render()));
}
export function getShortcuts() {
  return _shortcuts;
}
export function getShortcutLabel(value64, value65 = '') {
  const enabled6 = String(value64 || '').trim();
  if (!enabled6) return value65;
  const list17 = getShortcutKeys(enabled6);
  return list17.length > 0 ? list17.join(' ') : '';
}
export function getShortcutKeys(value64) {
  const enabled6 = String(value64 || '').trim();
  if (!enabled6) return [];
  const map7 = _shortcuts[enabled6] || DEFAULT_SHORTCUTS[enabled6];
  return Array.isArray(map7?.keys) ? map7.keys.filter(Boolean) : [];
}
export function getCurrentPreset() {
  return _currentPreset;
}
export function isRecording() {
  return !!_recordingAction;
}
export function handleShortcutKeydown(value66, value67 = {}) {
  if (_recordingAction) return null;
  const _toShortcutBindingString3 = _toShortcutBindingString(_buildShortcutKeysFromEvent(value66));
  let list18 = [];
  for (const [value68, value69] of Object.entries(_shortcuts)) {
    _getShortcutBindingStrings(value69).includes(_toShortcutBindingString3) && list18.push(value68);
  }
  list18 = _filterShortcutMatchesByContext(list18, value67);
  if (list18.length === 0) return null;
  return _resolveShortcutMatch(list18, value67);
}
typeof document !== 'undefined' &&
  document?.addEventListener &&
  (onLocaleChange(() => {
    (_render(), _updatePresetSelect());
  }),
  document.addEventListener(
    'keydown',
    (event6) => {
      if (!_recordingAction) return;
      (event6.preventDefault(), event6.stopImmediatePropagation());
      if (event6.key === 'Escape') {
        _stopRecording(null);
        return;
      }
      const list19 = _buildShortcutKeysFromEvent(event6),
        _normalizeShortcutMainKey3 = _normalizeShortcutMainKey(event6);
      list19.length > 0 &&
        !['Ctrl', 'Shift', 'Alt', ''].includes(_normalizeShortcutMainKey3) &&
        _stopRecording(list19);
    },
    true,
  ),
  document.addEventListener('DOMContentLoaded', () => {
    (_loadFromServer(),
      document.getElementById('btnShortcutsClose')?.addEventListener('click', closeShortcuts),
      document.getElementById('btnResetShortcuts')?.addEventListener('click', (event7) => {
        (event7.stopPropagation(), _reset());
      }),
      document.getElementById('btnShortcutsClose')?.addEventListener('click', closeShortcuts),
      document.getElementById('btnShortcuts')?.addEventListener('click', (event8) => {
        (event8.stopPropagation(),
          document.getElementById('avatarMenu')?.classList.remove('open'),
          openShortcuts());
      }),
      _initPresetSelect());
  }));

const MODIFIER_ONLY_SHORTCUT_ACTIONS = new Set(['cut-edge', 'duplicate-with-edges', 'multi-select']);
const FIXED_GLOBAL_SHORTCUT_BINDINGS = Object['freeze']({
  delete: Object['freeze']([Object['freeze'](['Delete'])]),
});

let _shortcutSearchQuery = '';
let _saveRevision = 0x0;
let _saveLoopPromise = null;

function _setRecordingAction(value70) {
  ((_recordingAction = value70 || null),
    typeof window !== 'undefined' &&
      ((window['__aicShortcutRecording'] = !!_recordingAction),
      void syncNotificationShortcut(_recordingAction ? [] : _shortcuts['jump-latest-notification']['keys'])));
}

const DEFAULT_PRESET_SHORTCUT_MIGRATIONS = { 'fit-all': { from: ['Ctrl', '0'], to: [] } };

function _resolveSavedAlternateKeys(value71, value72, value73) {
  const list20 = Array['isArray'](value71?.['alternateKeys'])
    ? value71['alternateKeys']
    : value73 === CUSTOM_PRESET_NAME
      ? []
      : value72;
  if (!Array['isArray'](list20)) return [];
  return list20['map']((value74) => _normalizeShortcutKeys(value74))['filter'](
    (value75) => value75['length'] > 0x0,
  );
}

function _createShortcutSavePayload() {
  return {
    preset: _currentPreset,
    shortcuts: Object['fromEntries'](
      Object['entries'](_shortcuts)['map'](([value76, value77]) => [
        value76,
        {
          keys: value77['keys'],
          ...(Array['isArray'](value77['alternateKeys']) ? { alternateKeys: value77['alternateKeys'] } : {}),
        },
      ]),
    ),
  };
}

function _syncGlobalTextCaptureShortcutsToElectron() {
  if (typeof window === 'undefined') return;
  if (!desktopBridge['textPreset']['isAvailable']()) return;
  ['global-capture-launcher', 'global-text-preset']['forEach']((value78) => {
    const value79 = Array['isArray'](_shortcuts?.[value78]?.['keys'])
      ? _shortcuts[value78]['keys']
      : DEFAULT_SHORTCUTS[value78]['keys'];
    try {
      const value80 = desktopBridge['textPreset']['updateGlobalShortcut']({
        actionId: value78,
        keys: value79,
      });
      value80 &&
        typeof value80['catch'] === 'function' &&
        value80['catch']((value81) => {
          console['warn']('[shortcuts] failed to sync ' + value78 + ' global shortcut:', value81);
        });
    } catch (value82) {
      console['warn']('[shortcuts] failed to sync ' + value78 + ' global shortcut:', value82);
    }
  });
}

function _normalizeShortcutSearchText(value83) {
  return String(value83 || '')
    ['trim']()
    ['toLocaleLowerCase']();
}

function _matchesShortcutSearch(value84, value85, value86, value87) {
  const _normalizeShortcutSearchText2 = _normalizeShortcutSearchText(value87);
  if (!_normalizeShortcutSearchText2) return !![];
  const _getShortcutBindingStrings2 = _getShortcutBindingStrings(value84, value85),
    args3 =
      _getShortcutBindingStrings2['length'] > 0x0
        ? _getShortcutBindingStrings2['flatMap']((value88) => [value88, value88['replaceAll']('+', '\x20')])
        : [_tShortcut('unset', '未设置')],
    _normalizeShortcutSearchText3 = _normalizeShortcutSearchText(
      [
        value84,
        value85['label'],
        _translateShortcutAction(value84, value85['label']),
        value86,
        _translateShortcutGroup(value86),
        ...args3,
      ]['join']('\x20'),
    );
  return _normalizeShortcutSearchText2['split'](/\s+/)
    ['filter'](Boolean)
    ['every']((value89) => _normalizeShortcutSearchText3['includes'](value89));
}

function _initShortcutSearch() {
  const enabled7 = document['getElementById']('shortcutsSearchInput');
  if (!enabled7) return;
  _shortcutSearchQuery = enabled7['value'] || '';
  if (enabled7['dataset']['shortcutSearchBound']) {
    _render();
    return;
  }
  ((enabled7['dataset']['shortcutSearchBound'] = 'true'),
    enabled7['addEventListener']('input', (event9) => {
      ((_shortcutSearchQuery = event9['target']?.['value'] || ''), _render());
    }),
    enabled7['addEventListener']('keydown', (value90) => {
      if (value90['key'] !== 'Escape' || !enabled7['value']) return;
      (value90['preventDefault'](),
        value90['stopPropagation'](),
        (enabled7['value'] = ''),
        (_shortcutSearchQuery = ''),
        _render());
    }));
}

export function resolveShortcutActionForEvent(value91, value92 = []) {
  const _toShortcutBindingString4 = _toShortcutBindingString(_buildShortcutKeysFromEvent(value91));
  if (!_toShortcutBindingString4) return null;
  for (const value93 of value92) {
    const enabled8 = String(value93 || '')['trim']();
    if (!enabled8) continue;
    const value94 = _shortcuts[enabled8] || DEFAULT_SHORTCUTS[enabled8];
    if (_getShortcutBindingStrings(enabled8, value94)['includes'](_toShortcutBindingString4)) return enabled8;
  }
  return null;
}

export function getInitialShortcuts() {
  return _buildPresetShortcuts(ASHUO_PRESET_NAME);
}

function _handleRecordingKeydown(event10) {
  if (!_recordingAction) return;
  (event10['preventDefault'](), event10['stopImmediatePropagation']());
  if (event10['key'] === 'Escape') {
    _stopRecording(null);
    return;
  }
  const list21 = _buildShortcutKeysFromEvent(event10),
    _normalizeShortcutMainKey4 = _normalizeShortcutMainKey(event10),
    value95 = MODIFIER_ONLY_SHORTCUT_ACTIONS['has'](_recordingAction);
  if (
    list21['length'] > 0x0 &&
    (value95 ||
      list21['includes']('AltRight') ||
      !['Ctrl', 'Shift', 'Alt', '']['includes'](_normalizeShortcutMainKey4))
  ) {
    if (_shortcuts[_recordingAction]?.['inputType'] === 'pointer') return;
    _stopRecording(list21);
  }
}
