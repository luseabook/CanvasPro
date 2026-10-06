import { fetchUserShortcutsFromServer, saveUserShortcutsToServer } from '../../api/shortcutsApi.js';
import { onLocaleChange, t } from '../i18n/index.js';
import { desktopBridge } from '../services/desktopBridge.js';
import { syncNotificationShortcut } from './settings/notificationShortcutSettings.js';
import {
  trackPhysicalShortcutKey,
  releasePhysicalShortcutKey,
  clearPhysicalShortcutKeys,
  physicalShortcutTokens,
} from '../services/physicalShortcutState.js';
import { openSettingsPanel, closeSettingsPanel, activateSettingsPane } from './settings/panelSettings.js';
import { SAVED_WORKFLOW_LIBRARY_ENTRY_ENABLED } from '../config/productFeatures.js';
import { CONTEXT_MENU_SHORTCUTS, isContextMenuShortcut } from '../utils/contextMenuShortcutCatalog.js';
const DEFAULT_PRESET_NAME = '默认预设',
  ASHUO_PRESET_NAME = '阿硕预设',
  CUSTOM_PRESET_NAME = '用户自定义',
  SHORTCUT_GROUP_I18N_KEYS = Object.freeze({
    通用: 'general',
    全局快捷键: 'globalShortcuts',
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
    '右键菜单·画布': 'contextCanvas',
    '右键菜单·素材与文件': 'contextMaterials',
    '右键菜单·项目与工作区': 'contextProjects',
    '右键菜单·功能面板': 'contextFeatures',
    '右键菜单·网页预览': 'contextWebPreview',
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
  'collaboration-chat-add-selection': {
    label: '所选节点加入协作聊天',
    keys: ['AltLeft', 'AltRight'],
    group: '编辑与选择',
  },
  'collaboration-chat-pick-node': {
    label: '点击节点加入聊天（聊天展开时）',
    keys: ['Shift', 'MouseLeft'],
    group: '编辑与选择',
    inputType: 'pointer',
  },
  'zoom-in': { label: '放大', keys: ['Ctrl', '+'], group: '通用' },
  'zoom-out': { label: '缩小', keys: ['Ctrl', '-'], group: '通用' },
  'fit-all': { label: '聚焦节点/适应画布', keys: [], group: '通用' },
  minimap: { label: '小地图', keys: ['M'], group: '通用' },
  'pan-canvas': { label: '拖动画布（按住）', keys: ['Space'], group: '通用' },
  copy: { label: '复制', keys: ['Ctrl', 'C'], group: '编辑与选择' },
  'copy-media': { label: '复制图像', keys: ['Ctrl', 'Shift', 'C'], group: '编辑与选择' },
  cut: { label: '剪切', keys: ['Ctrl', 'X'], group: '编辑与选择' },
  'canvas-screenshot': { label: '画布截图', keys: ['Alt', 'Q'], group: '全局快捷键' },
  'global-capture-launcher': { label: '选中文本：打开加入画布浮窗', keys: ['Alt', 'C'], group: '全局快捷键' },
  'jump-latest-notification': { label: '跳转到最新通知', keys: ['Alt', 'E'], group: '全局快捷键' },
  'global-text-preset': { label: '选中文本：新建提示词预设草稿', keys: [], group: '全局快捷键' },
  'duplicate-with-edges': { label: '拖拽创建连线副本', keys: ['Alt'], group: '编辑与选择' },
  paste: { label: '粘贴', keys: ['Ctrl', 'V'], group: '编辑与选择' },
  undo: { label: '撤销', keys: ['Ctrl', 'Z'], group: '编辑与选择' },
  redo: { label: '重做', keys: ['Ctrl', 'Y'], group: '编辑与选择' },
  delete: {
    label: '删除',
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
  'toggle-title-follows-zoom': { label: '标题跟随画布缩放', keys: [], group: '设置开关' },
  'toggle-media-node-resize': { label: '图像视频节点缩放', keys: [], group: '设置开关' },
  'toggle-prompt-box-resize': { label: '允许提示词栏下拉', keys: [], group: '设置开关' },
  'toggle-node-avoid-overlap': { label: '新节点自动避让', keys: [], group: '设置开关' },
  'reset-media-size': { label: '恢复节点默认大小', keys: ['Shift', 'R'], group: '编辑与选择' },
  'add-reference': { label: '添加参考', keys: ['X'], group: '编辑与选择' },
  'toggle-agent': { label: '打开/关闭 SHUO Agent', keys: ['T'], group: '侧边栏' },
  'create-text': { label: '创建源文本节点', keys: [], group: '创建节点' },
  'create-comment-note': { label: '创建注释节点', keys: ['N'], group: '创建节点' },
  'create-ai-text': { label: '创建生成文本节点', keys: ['Q'], group: '创建节点' },
  'create-ai-image': { label: '创建生成图像节点', keys: ['W'], group: '创建节点' },
  'create-ai-video': { label: '创建生成视频节点', keys: ['E'], group: '创建节点' },
  'create-ai-audio': { label: '创建生成音频节点', keys: ['R'], group: '创建节点' },
  'upload-file': { label: '上传文件', keys: [], group: '创建节点' },
  'cut-edge': { label: '剪刀（切断连线）', keys: ['Ctrl'], group: '编辑与选择' },
  save: { label: '保存画布', keys: ['Ctrl', 'S'], group: '通用' },
  'open-settings': { label: '打开设置', keys: ['Ctrl', ','], group: '通用' },
  'open-canvas-projects': { label: '打开画布项目', keys: [], group: '侧边栏' },
  'open-assets': { label: '打开素材', keys: [], group: '侧边栏' },
  'open-workflows': {
    label: '打开工作流',
    keys: [],
    group: '侧边栏',
    hidden: !SAVED_WORKFLOW_LIBRARY_ENTRY_ENABLED,
    disabled: !SAVED_WORKFLOW_LIBRARY_ENTRY_ENABLED,
  },
  'open-node-manager': { label: '打开/关闭节点管理', keys: [], group: '侧边栏' },
  'open-files': { label: '打开文件管理', keys: [], group: '侧边栏' },
  'open-task-center': { label: '打开任务进程', keys: [], group: '侧边栏' },
  'open-custom-ai-app': { label: '打开自定义AI应用', keys: [], group: '侧边栏' },
  'escape-all': { label: '取消/关闭所有菜单弹窗', keys: ['Escape'], group: '通用', hidden: true },
  'editor-tool-brush': { label: '画笔（切换模式）', keys: ['B'], group: '画笔功能' },
  'editor-tool-rect': { label: '矩形', keys: [], group: '画笔功能' },
  'editor-tool-eraser': { label: '橡皮擦', keys: ['E'], group: '画笔功能' },
  'editor-tool-bucket': { label: '油漆桶', keys: ['G'], group: '画笔功能' },
  'editor-clear': { label: '清空', keys: ['R'], group: '画笔功能' },
  'image-tool-matting': { label: '遮罩编辑器', keys: ['1'], group: '图像功能' },
  'image-tool-repaint': { label: '重绘', keys: ['2'], group: '图像功能' },
  'image-tool-erase': { label: '消除', keys: ['3'], group: '图像功能' },
  'image-tool-hd': { label: '高清', keys: ['4'], group: '图像功能' },
  'image-tool-expand': { label: '扩图', keys: ['5'], group: '图像功能' },
  'image-tool-auto-subject': { label: '自动识别主体', keys: ['6'], group: '图像功能' },
  'image-tool-multigrid': { label: '宫格裁剪', keys: ['7'], group: '图像功能' },
  'image-tool-multiangle': { label: '控制角度', keys: ['8'], group: '图像功能' },
  'image-tool-annotate': { label: '图像编辑', keys: ['9'], group: '图像功能' },
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
  ...CONTEXT_MENU_SHORTCUTS,
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
const BUILTIN_PRESET_NAMES = new Set(Object.keys(PRESETS)),
  MODIFIER_ONLY_SHORTCUT_ACTIONS = new Set(['cut-edge', 'duplicate-with-edges', 'multi-select']),
  FIXED_GLOBAL_SHORTCUT_BINDINGS = Object.freeze({
    delete: Object.freeze([Object.freeze(['Delete'])]),
  });
let _shortcuts = {},
  _currentPreset = ASHUO_PRESET_NAME,
  _recordingAction = null,
  _shortcutSearchQuery = '',
  _saveRevision = 0,
  _saveLoopPromise = null;
function _setRecordingAction(payload) {
  ((_recordingAction = payload || null),
    typeof window !== 'undefined' &&
      ((window.__aicShortcutRecording = !!_recordingAction),
      void syncNotificationShortcut(_recordingAction ? [] : _shortcuts['jump-latest-notification'].keys)));
}
const DEFAULT_SHORTCUT_MIGRATIONS = {
    'panorama-scene-tool-move': { from: ['Q'], to: ['W'] },
    'panorama-scene-tool-scale': { from: ['W'], to: ['E'] },
    'panorama-scene-tool-rotate': { from: ['E'], to: ['R'] },
    'panorama-scene-reset-view': { from: ['R'], to: [] },
  },
  DEFAULT_PRESET_SHORTCUT_MIGRATIONS = { 'fit-all': { from: ['Ctrl', '0'], to: [] } },
  ASHUO_PRESET_SHORTCUT_MIGRATIONS = {
    redo: { from: ['Ctrl', 'Y'], to: ['Ctrl', 'Shift', 'Z'] },
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
function _isPanoramaSceneShortcut(handle) {
  const state = String(handle || '').trim();
  return (
    state.startsWith('panorama-scene-tool-') ||
    state.startsWith('panorama-scene-camera-') ||
    state.startsWith('panorama-scene-camera-save-') ||
    state === 'panorama-scene-camera-create' ||
    state === 'panorama-scene-reset-view' ||
    state === 'panorama-scene-capture'
  );
}
function _isNodeToolbarAction(config) {
  return /^(image|video|audio|clip|text)-tool-/.test(String(config || ''));
}
function _isEditorShortcut(scope) {
  return String(scope || '')
    .trim()
    .startsWith('editor-');
}
function _isCreateNodeShortcut(input) {
  return String(input || '')
    .trim()
    .startsWith('create-');
}
function _isGlobalShortcut(output) {
  const enabled = String(output || '').trim();
  if (!enabled) return false;
  return (
    !isContextMenuShortcut(enabled) &&
    !_isEditorShortcut(enabled) &&
    !_isNodeToolbarAction(enabled) &&
    !_isPanoramaSceneShortcut(enabled) &&
    !_isCreateNodeShortcut(enabled)
  );
}
function _isPanoramaSceneNodeType(value2) {
  return _PANORAMA_SCENE_NODE_TYPES.has(String(value2 || '').trim());
}
function _isPanoramaSceneEditingContext(value3) {
  return (
    _isPanoramaSceneNodeType(value3?.selectedNodeType) && value3?.panoramaSceneEditing === true
  );
}
function _filterShortcutMatchesByContext(args, value4 = {}) {
  let list = Array.isArray(args) ? [...args] : [];
  return (
    !(Number(value4.selectedSyncPlayableVideoCount) >= 2) &&
      (list = list.filter((value5) => value5 !== 'ms-sync-video-play')),
    value4.featureModeActive &&
      (list = list.filter((value6) => !_isNodeToolbarAction(value6))),
    value4.alignFeatureEnabled === false &&
      (list = list.filter((value7) => value7 !== 'align-feature')),
    value4.mediaClipExpandedEditing === true &&
      (list = list.filter((value8) => value8 !== 'pan-canvas')),
    _isPanoramaSceneEditingContext(value4) &&
      (list = list.filter(
        (value9) => !_isNodeToolbarAction(value9) && !_isCreateNodeShortcut(value9),
      )),
    list
  );
}
function _resolveToolbarShortcutMatch(list2, value10) {
  const enabled2 = _TOOLBAR_SHORTCUT_PREFIX_BY_NODE_TYPE[String(value10 || '').trim()];
  if (!enabled2) return null;
  return list2.find((value11) => value11.startsWith(enabled2)) || null;
}
function _resolveShortcutMatch(list3, value12 = {}) {
  if (!Array.isArray(list3) || list3.length === 0) return null;
  if (value12.mattingActive || value12.annotateActive || value12.videoKeyingActive) {
    const value13 = list3.find((value14) => _isEditorShortcut(value14));
    if (value13) return value13;
  }
  if (_isPanoramaSceneEditingContext(value12)) {
    const value15 = list3.find((value16) => _isPanoramaSceneShortcut(value16));
    if (value15) return value15;
  }
  const _resolveToolbarShortcutMatch2 = _resolveToolbarShortcutMatch(list3, value12.selectedNodeType);
  if (_resolveToolbarShortcutMatch2) return _resolveToolbarShortcutMatch2;
  const value17 = list3.find((value18) => _isGlobalShortcut(value18));
  if (value17) return value17;
  const value19 = list3.find((value20) => _isCreateNodeShortcut(value20));
  if (value19) return value19;
  return null;
}
function _getShortcutBindingStrings(value21, el) {
  if (el?.disabled === true) return [];
  const list4 = [];
  Array.isArray(el?.keys) &&
    el.keys.length > 0 &&
    list4.push(el.keys);
  Array.isArray(el?.alternateKeys) &&
    el.alternateKeys.forEach((list5) => {
      Array.isArray(list5) && list5.length > 0 && list4.push(list5);
    });
  const list6 = FIXED_GLOBAL_SHORTCUT_BINDINGS[value21] || [];
  return (
    list6.forEach((value22) => list4.push(value22)),
    list4.map((value23) => _toShortcutBindingString(value23))
  );
}
function _normalizeShortcutToken(value24) {
  const list7 = String(value24 || '').trim();
  if (!list7) return '';
  const value25 = list7.toLowerCase();
  if (value25 === 'ctrl' || value25 === 'control' || value25 === 'meta') return 'Ctrl';
  if (value25 === 'shift') return 'Shift';
  if (value25 === 'alt') return 'Alt';
  if (value25 === 'space') return 'Space';
  if (value25 === 'backquote' || list7 === '`' || list7 === '~') return '`';
  if (list7.length === 1) return list7.toUpperCase();
  return list7;
}
function _normalizeShortcutMainKey(event) {
  const value26 = String(event?.code || '').trim(),
    value27 = String(event?.key || '').trim();
  if (value26 === 'Backquote') return '`';
  if (value26 === 'Space') return 'Space';
  if (value26 === 'Delete' || value27 === 'Del') return 'Delete';
  if (value26 === 'Backspace') return 'Backspace';
  return _normalizeShortcutToken(event?.key === ' ' ? 'Space' : event?.key);
}
function _normalizeShortcutKeys(list8) {
  if (!Array.isArray(list8)) return [];
  const list9 = list8.map((value28) => _normalizeShortcutToken(value28)).filter(Boolean),
    list10 = [];
  if (list9.includes('Ctrl')) list10.push('Ctrl');
  if (list9.includes('Shift')) list10.push('Shift');
  if (list9.includes('Alt')) list10.push('Alt');
  const args2 = list9.filter(
    (value29) => value29 !== 'Ctrl' && value29 !== 'Shift' && value29 !== 'Alt',
  );
  return [...list10, ...args2];
}
function _buildShortcutKeysFromEvent(event2) {
  const list11 = [];
  if (event2.ctrlKey || event2.metaKey) list11.push('Ctrl');
  if (event2.shiftKey) list11.push('Shift');
  list11.push(...physicalShortcutTokens(event2));
  if (event2.type === 'pointerdown') {
    if (event2.button === 0) list11.push('MouseLeft');
    return list11;
  }
  const _normalizeShortcutMainKey2 = _normalizeShortcutMainKey(event2);
  return (!['Ctrl', 'Shift', 'Alt', ''].includes(_normalizeShortcutMainKey2) && list11.push(_normalizeShortcutMainKey2), list11);
}
function _toShortcutBindingString(value30) {
  return _normalizeShortcutKeys(value30).join('+').toUpperCase();
}
function _isContextualShortcutConflictExempt(value31, value32, value33) {
  const map = new Set([value31, value32]);
  if (value33 === 'B')
    return map.has('toggle-connection-lines') && map.has('editor-tool-brush');
  if (value33 === 'G')
    return map.has('ms-sync-video-play') && map.has('editor-tool-bucket');
  return false;
}
function _resolveSavedShortcutKeys(value34, value35, value36, value37 = {}) {
  const value38 = Array.isArray(value35),
    value39 = value38 ? _normalizeShortcutKeys(value35) : [];
  if (value34 === 'global-text-preset' && value38 && _toShortcutBindingString(value39) === 'ALT+C')
    return [];
  if (value37.rawSavedPresetName === CUSTOM_PRESET_NAME)
    return value38 ? value39 : _normalizeShortcutKeys(value36);
  const value40 =
      value37.savedPresetName === DEFAULT_PRESET_NAME
        ? DEFAULT_PRESET_SHORTCUT_MIGRATIONS[value34]
        : value37.savedPresetName === ASHUO_PRESET_NAME
          ? ASHUO_PRESET_SHORTCUT_MIGRATIONS[value34]
          : null,
    value41 = BUILTIN_PRESET_NAMES.has(value37.savedPresetName)
      ? BUILTIN_PRESET_SHORTCUT_MIGRATIONS[value34]
      : null;
  if (
    value38 &&
    value40 &&
    _toShortcutBindingString(value39) === _toShortcutBindingString(value40.from)
  )
    return _normalizeShortcutKeys(value40.to);
  if (
    value38 &&
    value41 &&
    _toShortcutBindingString(value39) === _toShortcutBindingString(value41.from)
  )
    return _normalizeShortcutKeys(value41.to);
  const value42 = DEFAULT_SHORTCUT_MIGRATIONS[value34];
  if (
    value38 &&
    value42 &&
    _toShortcutBindingString(value39) === _toShortcutBindingString(value42.from)
  )
    return _normalizeShortcutKeys(value42.to);
  return value38 ? value39 : _normalizeShortcutKeys(value36);
}
function _resolveSavedAlternateKeys(value43, value44, value45) {
  const list12 = Array.isArray(value43?.alternateKeys)
    ? value43.alternateKeys
    : value45 === CUSTOM_PRESET_NAME
      ? []
      : value44;
  if (!Array.isArray(list12)) return [];
  return list12.map((value46) => _normalizeShortcutKeys(value46)).filter(
    (list13) => list13.length > 0,
  );
}
function _normalizePresetName(value47) {
  const value48 = String(value47 || '').trim();
  if (value48 === '自定义') return CUSTOM_PRESET_NAME;
  if (BUILTIN_PRESET_NAMES.has(value48)) return value48;
  if (value48 === CUSTOM_PRESET_NAME) return CUSTOM_PRESET_NAME;
  return ASHUO_PRESET_NAME;
}
function _buildPresetShortcuts(value49) {
  const _normalizePresetName2 = _normalizePresetName(value49),
    value50 = PRESETS[_normalizePresetName2] || {};
  return Object.fromEntries(
    Object.entries(DEFAULT_SHORTCUTS).map(([value51, map2]) => [
      value51,
      { ...map2, keys: _normalizeShortcutKeys(value50[value51] ?? [...map2.keys]) },
    ]),
  );
}
function _shortcutsMatchPreset(value52, value53) {
  const _buildPresetShortcuts2 = _buildPresetShortcuts(value53);
  return Object.entries(_buildPresetShortcuts2).every(([value54, map3]) => {
    const value55 = value52?.[value54]?.keys || [];
    return _toShortcutBindingString(value55) === _toShortcutBindingString(map3.keys);
  });
}
function _inferPresetName(value56, value57) {
  if (_normalizePresetName(value57) === CUSTOM_PRESET_NAME) return CUSTOM_PRESET_NAME;
  if (_shortcutsMatchPreset(value56, DEFAULT_PRESET_NAME)) return DEFAULT_PRESET_NAME;
  if (_shortcutsMatchPreset(value56, ASHUO_PRESET_NAME)) return ASHUO_PRESET_NAME;
  return CUSTOM_PRESET_NAME;
}
async function _loadFromServer() {
  const value58 = _saveRevision;
  try {
    const fetchUserShortcutsFromServer2 = await fetchUserShortcutsFromServer();
    if (value58 !== _saveRevision) return;
    if (fetchUserShortcutsFromServer2 && fetchUserShortcutsFromServer2.shortcuts && Object.keys(fetchUserShortcutsFromServer2.shortcuts).length > 0) {
      const rawSavedPresetName = String(fetchUserShortcutsFromServer2.preset || '').trim(),
        savedPresetName = _normalizePresetName(rawSavedPresetName),
        value59 = BUILTIN_PRESET_NAMES.has(savedPresetName) ? savedPresetName : ASHUO_PRESET_NAME,
        _buildPresetShortcuts3 = _buildPresetShortcuts(value59);
      ((_shortcuts = Object.fromEntries(
        Object.entries(_buildPresetShortcuts3).map(([value60, map4]) => [
          value60,
          fetchUserShortcutsFromServer2.shortcuts[value60]
            ? {
                ...map4,
                keys: _resolveSavedShortcutKeys(
                  value60,
                  fetchUserShortcutsFromServer2.shortcuts[value60].keys,
                  map4.keys,
                  { savedPresetName: savedPresetName, rawSavedPresetName: rawSavedPresetName },
                ),
                alternateKeys: _resolveSavedAlternateKeys(
                  fetchUserShortcutsFromServer2.shortcuts[value60],
                  map4.alternateKeys,
                  rawSavedPresetName,
                ),
              }
            : { ...map4, keys: _normalizeShortcutKeys(map4.keys) },
        ]),
      )),
        (_currentPreset = _inferPresetName(_shortcuts, savedPresetName)));
      if (_shortcuts['matting-auto']) _shortcuts['matting-auto'].keys = [];
      (_updatePresetSelect(), _render(), _syncShortcutsToGlobal(), _emitShortcutsUpdated());
    } else (_applyPreset(ASHUO_PRESET_NAME, false), _syncShortcutsToGlobal());
  } catch {
    if (value58 !== _saveRevision) return;
    (_applyPreset(ASHUO_PRESET_NAME, false), _syncShortcutsToGlobal());
  }
}
function _createShortcutSavePayload() {
  return {
    preset: _currentPreset,
    shortcuts: Object.fromEntries(
      Object.entries(_shortcuts).map(([value61, keys]) => [
        value61,
        {
          keys: keys.keys,
          ...(Array.isArray(keys.alternateKeys)
            ? { alternateKeys: keys.alternateKeys }
            : {}),
        },
      ]),
    ),
  };
}
function _saveToServer() {
  _saveRevision += 1;
  if (_saveLoopPromise) return _saveLoopPromise;
  return (
    (_saveLoopPromise = (async () => {
      while (true) {
        const value62 = _saveRevision,
          _createShortcutSavePayload2 = _createShortcutSavePayload();
        try {
          (await saveUserShortcutsToServer(_createShortcutSavePayload2), _syncShortcutsToGlobal());
        } catch (value63) {
          console.warn('[shortcuts] save failed:', value63);
        }
        if (value62 === _saveRevision) break;
      }
    })().finally(() => {
      _saveLoopPromise = null;
    })),
    _saveLoopPromise
  );
}
function _syncShortcutsToGlobal() {
  if (typeof window === 'undefined') return;
  window.__aicConfiguredShortcutBindings = Array.from(
    new Set(
      Object.entries(_shortcuts).flatMap(([value64, value65]) =>
        _getShortcutBindingStrings(value64, value65),
      ),
    ),
  );
  const value66 = {},
    list14 = ['editor-tool-brush', 'editor-tool-eraser', 'editor-tool-bucket', 'editor-clear'];
  (list14.forEach((value67) => {
    if (_shortcuts[value67]?.keys?.length > 0) {
      const value68 = _shortcuts[value67].keys[_shortcuts[value67].keys.length - 1];
      value66[value67] = value68.toUpperCase();
    }
  }),
    (window._mattingShortcuts = value66),
    _syncCanvasScreenshotShortcutToElectron(),
    _syncGlobalTextCaptureShortcutsToElectron(),
    void syncNotificationShortcut(_recordingAction ? [] : _shortcuts['jump-latest-notification'].keys));
}
function _syncCanvasScreenshotShortcutToElectron() {
  if (typeof window === 'undefined') return;
  if (!desktopBridge.screenshot.isAvailable()) return;
  const keys2 = Array.isArray(_shortcuts?.['canvas-screenshot']?.keys)
    ? _shortcuts['canvas-screenshot'].keys
    : DEFAULT_SHORTCUTS['canvas-screenshot'].keys;
  try {
    const promise = desktopBridge.screenshot.updateGlobalShortcut({ keys: keys2 });
    promise &&
      typeof promise.catch === 'function' &&
      promise.catch((value69) => {
        console.warn('[shortcuts] failed to sync global screenshot shortcut:', value69);
      });
  } catch (value70) {
    console.warn('[shortcuts] failed to sync global screenshot shortcut:', value70);
  }
}
function _syncGlobalTextCaptureShortcutsToElectron() {
  if (typeof window === 'undefined') return;
  if (!desktopBridge.textPreset.isAvailable()) return;
  ['global-capture-launcher', 'global-text-preset'].forEach((actionId) => {
    const keys3 = Array.isArray(_shortcuts?.[actionId]?.keys)
      ? _shortcuts[actionId].keys
      : DEFAULT_SHORTCUTS[actionId].keys;
    try {
      const promise2 = desktopBridge.textPreset.updateGlobalShortcut({
        actionId: actionId,
        keys: keys3,
      });
      promise2 &&
        typeof promise2.catch === 'function' &&
        promise2.catch((value71) => {
          console.warn('[shortcuts] failed to sync ' + actionId + ' global shortcut:', value71);
        });
    } catch (value72) {
      console.warn('[shortcuts] failed to sync ' + actionId + ' global shortcut:', value72);
    }
  });
}
function _applyPreset(value73, value74 = true) {
  const _normalizePresetName3 = _normalizePresetName(value73);
  if (!BUILTIN_PRESET_NAMES.has(_normalizePresetName3)) return;
  ((_currentPreset = _normalizePresetName3),
    (_shortcuts = _buildPresetShortcuts(_normalizePresetName3)),
    _render(),
    _syncShortcutsToGlobal(),
    _emitShortcutsUpdated());
  if (value74) _saveToServer();
}
function _getPresetControls() {
  if (typeof document === 'undefined') return {};
  const select = document.getElementById('shortcutsPresetSelect'),
    control = document.getElementById('shortcutsPresetControl'),
    trigger = document.getElementById('shortcutsPresetTrigger'),
    triggerText = document.getElementById('shortcutsPresetTriggerText'),
    menu = document.getElementById('shortcutsPresetMenu'),
    options2 = menu?.querySelectorAll
      ? Array.from(menu.querySelectorAll('.settings-preset-option'))
      : [];
  return {
    select: select,
    control: control,
    trigger: trigger,
    triggerText: triggerText,
    menu: menu,
    options: options2,
  };
}
function _getPresetLabel(value75) {
  const { select: select2, options: options3 } = _getPresetControls(),
    el2 = select2?.options
      ? Array.from(select2.options).find((el3) => el3.value === value75)
      : null,
    el4 = options3.find((el5) => el5.dataset?.value === value75);
  return el2?.textContent || el4?.textContent || value75;
}
function _setPresetMenuOpen(
  enabled3,
  { focusOption: focusOption = false, focusTrigger: focusTrigger = false } = {},
) {
  const {
    control: control2,
    trigger: trigger2,
    menu: menu2,
    options: options4,
  } = _getPresetControls();
  if (!control2 || !trigger2 || !menu2) return;
  (control2.classList.toggle('is-open', enabled3),
    trigger2.setAttribute('aria-expanded', enabled3 ? 'true' : 'false'),
    (menu2.hidden = !enabled3));
  if (enabled3 && focusOption) {
    const value76 = options4.find(
        (el6) => el6.dataset?.value === _currentPreset && !el6.disabled,
      ),
      value77 = options4.find((el7) => !el7.disabled);
    (value76 || value77)?.focus?.();
  } else !enabled3 && focusTrigger && trigger2.focus?.();
}
function _isPresetMenuOpen() {
  const { control: control3 } = _getPresetControls();
  return !!control3?.classList?.contains('is-open');
}
function _selectPresetFromUi(value78) {
  if (_normalizePresetName(value78) === CUSTOM_PRESET_NAME) {
    (_updatePresetSelect(), _setPresetMenuOpen(false, { focusTrigger: true }));
    return;
  }
  const _normalizePresetName4 = _normalizePresetName(value78);
  (_applyPreset(_normalizePresetName4, true),
    _updatePresetSelect(),
    _setPresetMenuOpen(false, { focusTrigger: true }),
    window.showToast?.(
      _tShortcut('presetSwitched', '已切换预设：' + _normalizePresetName4, { preset: _getPresetLabel(_normalizePresetName4) }),
    ));
}
function _movePresetOptionFocus(value79) {
  const { options: options5 } = _getPresetControls(),
    list15 = options5.filter((el8) => !el8.disabled);
  if (list15.length === 0) return;
  const value80 = document.activeElement;
  let count = list15.indexOf(value80);
  count < 0 &&
    (count = list15.findIndex((el9) => el9.dataset?.value === _currentPreset));
  const value81 = (Math.max(count, 0) + value79 + list15.length) % list15.length;
  list15[value81]?.focus?.();
}
function _updatePresetSelect() {
  const { select: select3, triggerText: triggerText2, options: options6 } = _getPresetControls();
  if (select3) select3.value = _currentPreset;
  if (triggerText2) triggerText2.textContent = _getPresetLabel(_currentPreset);
  options6.forEach((el10) => {
    const value82 = el10.dataset?.value === _currentPreset;
    (el10.classList.toggle('is-active', value82),
      el10.setAttribute('aria-selected', value82 ? 'true' : 'false'));
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
    trigger3.addEventListener('keydown', (event3) => {
      (event3.key === 'ArrowDown' || event3.key === 'Enter' || event3.key === ' ') &&
        (event3.preventDefault(), _setPresetMenuOpen(true, { focusOption: true }));
    }),
    menu3.addEventListener('click', (event4) => {
      const el11 = event4.target?.closest?.('.settings-preset-option');
      if (!el11 || el11.disabled) return;
      _selectPresetFromUi(el11.dataset.value);
    }),
    menu3.addEventListener('keydown', (event5) => {
      if (event5.key === 'Escape')
        (event5.preventDefault(), _setPresetMenuOpen(false, { focusTrigger: true }));
      else {
        if (event5.key === 'ArrowDown') (event5.preventDefault(), _movePresetOptionFocus(1));
        else {
          if (event5.key === 'ArrowUp') (event5.preventDefault(), _movePresetOptionFocus(-1));
          else {
            if (event5.key === 'Enter' || event5.key === ' ') {
              event5.preventDefault();
              const el12 = document.activeElement?.closest?.('.settings-preset-option');
              if (el12 && !el12.disabled) _selectPresetFromUi(el12.dataset.value);
            }
          }
        }
      }
    }),
    document.addEventListener('pointerdown', (event6) => {
      if (!_isPresetMenuOpen()) return;
      if (typeof control4.contains === 'function' && control4.contains(event6.target)) return;
      _setPresetMenuOpen(false);
    }),
    _updatePresetSelect());
}
function _normalizeShortcutSearchText(value83) {
  return String(value83 || '')
    .trim()
    .toLocaleLowerCase();
}
function _matchesShortcutSearch(value84, value85, value86, value87) {
  const _normalizeShortcutSearchText2 = _normalizeShortcutSearchText(value87);
  if (!_normalizeShortcutSearchText2) return true;
  const list16 = _getShortcutBindingStrings(value84, value85),
    args3 =
      list16.length > 0
        ? list16.flatMap((value88) => [value88, value88.replaceAll('+', ' ')])
        : [_tShortcut('unset', '未设置')],
    list17 = _normalizeShortcutSearchText(
      [
        value84,
        value85.label,
        _translateShortcutAction(value84, value85.label),
        value86,
        _translateShortcutGroup(value86),
        ...args3,
      ].join(' '),
    );
  return _normalizeShortcutSearchText2.split(/\s+/)
    .filter(Boolean)
    .every((value89) => list17.includes(value89));
}
function _render() {
  const el13 = document.getElementById('shortcutsContent');
  if (!el13) return;
  el13.replaceChildren();
  const enabled4 = {};
  Object.entries(_shortcuts).forEach(([id, el14]) => {
    if (el14.hidden) return;
    if (!_matchesShortcutSearch(id, el14, el14.group, _shortcutSearchQuery)) return;
    if (!enabled4[el14.group]) enabled4[el14.group] = [];
    enabled4[el14.group].push({ id: id, ...el14 });
  });
  if (Object.keys(enabled4).length === 0 && _normalizeShortcutSearchText(_shortcutSearchQuery)) {
    const el15 = document.createElement('div');
    ((el15.className = 'sc-empty'),
      el15.setAttribute('role', 'status'),
      el15.setAttribute('aria-live', 'polite'),
      (el15.textContent = _tShortcut('noResults', '没有找到匹配的快捷键')),
      el13.appendChild(el15));
    return;
  }
  Object.entries(enabled4).forEach(([value90, list18]) => {
    const el16 = document.createElement('div');
    el16.className = 'sc-section';
    const el17 = document.createElement('div');
    ((el17.className = 'sc-section-title'),
      (el17.textContent = _translateShortcutGroup(value90)),
      el16.appendChild(el17),
      list18.forEach((map5) => {
        const el18 = document.createElement('div');
        el18.className = 'sc-item';
        const el19 = document.createElement('span');
        ((el19.className = 'sc-label'),
          (el19.textContent = _translateShortcutAction(map5.id, map5.label)));
        map5.id === 'jump-latest-notification' &&
          (el19.title = _tShortcut(
            'notificationShortcutHint',
            '全局生效：唤起应用并跳转到最新一条未处理通知对应的位置。',
          ));
        const el20 = document.createElement('div');
        ((el20.className = 'sc-keys'),
          (el20.dataset.action = map5.id),
          el20.replaceChildren());
        if (_recordingAction === map5.id) {
          const el21 = document.createElement('kbd');
          ((el21.className = 'kbd-v2 recording'),
            (el21.textContent =
              _shortcuts[map5.id]?.inputType === 'pointer'
                ? '按住修饰键并点击左键…'
                : _tShortcut('recording', '录制中...')),
            el20.appendChild(el21));
        } else {
          if (map5.keys.length > 0)
            map5.keys.forEach((value91) => {
              const el22 = document.createElement('kbd');
              ((el22.className = 'kbd-v2'),
                (el22.textContent =
                  { AltLeft: '左 Alt', AltRight: '右 Alt', MouseLeft: '左键' }[value91] || value91),
                el20.appendChild(el22));
            });
          else {
            const el23 = document.createElement('kbd');
            ((el23.className = 'kbd-v2'),
              (el23.textContent = _tShortcut('unset', '未设置')),
              el20.appendChild(el23));
          }
        }
        (el20.addEventListener('click', () => _startRecording(map5.id)),
          el18.appendChild(el19),
          el18.appendChild(el20),
          el16.appendChild(el18));
      }),
      el13.appendChild(el16));
  });
}
function _initShortcutSearch() {
  const el24 = document.getElementById('shortcutsSearchInput');
  if (!el24) return;
  _shortcutSearchQuery = el24.value || '';
  if (el24.dataset.shortcutSearchBound) {
    _render();
    return;
  }
  ((el24.dataset.shortcutSearchBound = 'true'),
    el24.addEventListener('input', (event7) => {
      ((_shortcutSearchQuery = event7.target?.value || ''), _render());
    }),
    el24.addEventListener('keydown', (event8) => {
      if (event8.key !== 'Escape' || !el24.value) return;
      (event8.preventDefault(),
        event8.stopPropagation(),
        (el24.value = ''),
        (_shortcutSearchQuery = ''),
        _render());
    }));
}
function _startRecording(value92) {
  if (_recordingAction) return;
  (_setRecordingAction(value92), _render());
}
export function detectShortcutConflict(enabled5, value93, value94) {
  if (!enabled5 || typeof enabled5 !== 'object') return null;
  const _toShortcutBindingString2 = _toShortcutBindingString(value94);
  if (!_toShortcutBindingString2) return null;
  for (const [id2, label] of Object.entries(enabled5)) {
    if (id2 === value93) continue;
    if (_getShortcutBindingStrings(id2, label).includes(_toShortcutBindingString2)) {
      if (_isContextualShortcutConflictExempt(value93, id2, _toShortcutBindingString2)) continue;
      return { id: id2, label: label.label || id2 };
    }
  }
  return null;
}
function _stopRecording(list19) {
  if (!_recordingAction) return;
  if (list19 && list19.length > 0) {
    const detectShortcutConflict2 = detectShortcutConflict(_shortcuts, _recordingAction, list19);
    if (detectShortcutConflict2) {
      (window.showToast?.(
        _tShortcut('conflict', '快捷键冲突：已被「' + detectShortcutConflict2.label + '」占用', {
          label: _translateShortcutAction(detectShortcutConflict2.id, detectShortcutConflict2.label),
        }),
        'warn',
      ),
        _setRecordingAction(null),
        _render());
      return;
    }
    ((_shortcuts[_recordingAction].keys = _normalizeShortcutKeys(list19)),
      (_shortcuts[_recordingAction].alternateKeys = []),
      (_currentPreset = CUSTOM_PRESET_NAME),
      _updatePresetSelect(),
      _syncShortcutsToGlobal(),
      _emitShortcutsUpdated(),
      _saveToServer(),
      window.showToast?.(_tShortcut('updated', '快捷键已更新'), 'success'));
  }
  (_setRecordingAction(null), _render());
}
function _reset() {
  (_applyPreset(DEFAULT_PRESET_NAME, true),
    _updatePresetSelect(),
    window.showToast?.(_tShortcut('restored', '已恢复默认快捷键')));
}
export function openShortcuts() {
  if (!openSettingsPanel()) return;
  (activateSettingsPane('shortcuts'), _render(), _updatePresetSelect());
}
export function closeShortcuts() {
  (closeSettingsPanel(), _recordingAction && (_setRecordingAction(null), _render()));
}
export function getShortcuts() {
  return _shortcuts;
}
export function getShortcutLabel(value95, value96 = '') {
  const enabled6 = String(value95 || '').trim();
  if (!enabled6) return value96;
  const list20 = getShortcutKeys(enabled6);
  return list20.length > 0 ? list20.join(' ') : '';
}
export function getShortcutKeys(value97) {
  const enabled7 = String(value97 || '').trim();
  if (!enabled7) return [];
  const map6 = _shortcuts[enabled7] || DEFAULT_SHORTCUTS[enabled7];
  return Array.isArray(map6?.keys) ? map6.keys.filter(Boolean) : [];
}
export function resolveShortcutActionForEvent(value98, value99 = []) {
  const _toShortcutBindingString3 = _toShortcutBindingString(_buildShortcutKeysFromEvent(value98));
  if (!_toShortcutBindingString3) return null;
  for (const value100 of value99) {
    const enabled8 = String(value100 || '').trim();
    if (!enabled8) continue;
    const value101 = _shortcuts[enabled8] || DEFAULT_SHORTCUTS[enabled8];
    if (_getShortcutBindingStrings(enabled8, value101).includes(_toShortcutBindingString3)) return enabled8;
  }
  return null;
}
export function getInitialShortcuts() {
  return _buildPresetShortcuts(ASHUO_PRESET_NAME);
}
export function getCurrentPreset() {
  return _currentPreset;
}
export function isRecording() {
  return !!_recordingAction;
}
export function handleShortcutKeydown(ctrlKey, value102 = {}) {
  if (_recordingAction) return null;
  const _toShortcutBindingString4 = _toShortcutBindingString(_buildShortcutKeysFromEvent(ctrlKey));
  let list21 = [];
  for (const [value103, value104] of Object.entries(_shortcuts)) {
    _getShortcutBindingStrings(value103, value104).includes(_toShortcutBindingString4) && list21.push(value103);
  }
  list21 = _filterShortcutMatchesByContext(list21, value102);
  if (list21.length === 0) {
    if (ctrlKey?.shiftKey === true && value102?.featureModeActive !== true) {
      const value105 = _shortcuts['ms-sync-video-play'],
        _toShortcutBindingString5 = _toShortcutBindingString(
          _buildShortcutKeysFromEvent({
            ctrlKey: ctrlKey?.ctrlKey,
            metaKey: ctrlKey?.metaKey,
            shiftKey: false,
            altKey: ctrlKey?.altKey,
            key: ctrlKey?.key,
            code: ctrlKey?.code,
          }),
        ),
        _getShortcutBindingStrings2 = _getShortcutBindingStrings('ms-sync-video-play', value105).includes(_toShortcutBindingString5);
      if (_getShortcutBindingStrings2 && Number(value102?.selectedSyncPlayableVideoCount) >= 2)
        return 'ms-sync-video-loop-play';
    }
    return null;
  }
  return _resolveShortcutMatch(list21, value102);
}
function _handleRecordingKeydown(event9) {
  if (!_recordingAction) return;
  (event9.preventDefault(), event9.stopImmediatePropagation());
  if (event9.key === 'Escape') {
    _stopRecording(null);
    return;
  }
  const list22 = _buildShortcutKeysFromEvent(event9),
    _normalizeShortcutMainKey3 = _normalizeShortcutMainKey(event9),
    value106 = MODIFIER_ONLY_SHORTCUT_ACTIONS.has(_recordingAction);
  if (
    list22.length > 0 &&
    (value106 || list22.includes('AltRight') || !['Ctrl', 'Shift', 'Alt', ''].includes(_normalizeShortcutMainKey3))
  ) {
    if (_shortcuts[_recordingAction]?.inputType === 'pointer') return;
    _stopRecording(list22);
  }
}
if (typeof document !== 'undefined' && document?.addEventListener) {
  onLocaleChange(() => {
    (_render(), _updatePresetSelect());
  });
  const recordingEventTarget =
    typeof window !== 'undefined' && window?.addEventListener ? window : document;
  let suppressRecordedPointerClick = false;
  (recordingEventTarget.addEventListener('keydown', trackPhysicalShortcutKey, true),
    recordingEventTarget.addEventListener('keyup', releasePhysicalShortcutKey, true),
    recordingEventTarget.addEventListener('blur', clearPhysicalShortcutKeys),
    recordingEventTarget.addEventListener('keydown', _handleRecordingKeydown, true),
    recordingEventTarget.addEventListener(
      'pointerdown',
      (event10) => {
        if (
          !_recordingAction ||
          _shortcuts[_recordingAction]?.inputType !== 'pointer' ||
          event10.button !== 0
        )
          return;
        (event10.preventDefault(),
          event10.stopImmediatePropagation(),
          (suppressRecordedPointerClick = true),
          _stopRecording(_buildShortcutKeysFromEvent(event10)));
      },
      true,
    ),
    recordingEventTarget.addEventListener(
      'click',
      (event11) => {
        if (!suppressRecordedPointerClick) return;
        ((suppressRecordedPointerClick = false),
          event11.preventDefault(),
          event11.stopImmediatePropagation());
      },
      true,
    ),
    typeof window !== 'undefined' &&
      window?.addEventListener &&
      window.addEventListener('settings-panel-closed', () => {
        if (!_recordingAction) return;
        _stopRecording(null);
      }),
    document.addEventListener('DOMContentLoaded', () => {
      (_loadFromServer(),
        document.getElementById('btnShortcutsClose')?.addEventListener('click', closeShortcuts),
        document.getElementById('btnResetShortcuts')?.addEventListener('click', (event12) => {
          (event12.stopPropagation(), _reset());
        }),
        document.getElementById('btnShortcutsClose')?.addEventListener('click', closeShortcuts),
        document.getElementById('btnShortcuts')?.addEventListener('click', (event13) => {
          (event13.stopPropagation(),
            document.getElementById('avatarMenu')?.classList.remove('open'),
            openShortcuts());
        }),
        _initPresetSelect(),
        _initShortcutSearch());
    }));
}
