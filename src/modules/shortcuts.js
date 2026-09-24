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
function _formatI18nMessage(_0xdde15, _0x386c07 = {}) {
  let _0x3ee2ae = String(_0xdde15 || '');
  return (
    Object.entries(_0x386c07 || {}).forEach(([_0x7f27a5, _0x5246cd]) => {
      _0x3ee2ae = _0x3ee2ae.split('{' + _0x7f27a5 + '}').join(String(_0x5246cd ?? ''));
    }),
    _0x3ee2ae
  );
}
function _tShortcut(_0x25eafa, _0x2382ef, _0x5ea6ab = {}) {
  const _0x40d1e0 = 'settings.shortcuts.' + _0x25eafa,
    _0x40fd72 = t(_0x40d1e0);
  return _formatI18nMessage(_0x40fd72 === _0x40d1e0 ? _0x2382ef : _0x40fd72, _0x5ea6ab);
}
function _translateShortcutGroup(_0x18b0fc) {
  const _0x52104d = SHORTCUT_GROUP_I18N_KEYS[_0x18b0fc];
  return _0x52104d ? _tShortcut('groups.' + _0x52104d, _0x18b0fc) : _0x18b0fc;
}
function _translateShortcutAction(_0x555f54, _0x40a092) {
  return _tShortcut('actions.' + _0x555f54, _0x40a092 || _0x555f54);
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
function _isPanoramaSceneShortcut(_0x284c3a) {
  const _0x29e776 = String(_0x284c3a || '').trim();
  return (
    _0x29e776.startsWith('panorama-scene-tool-') ||
    _0x29e776.startsWith('panorama-scene-camera-') ||
    _0x29e776.startsWith('panorama-scene-camera-save-') ||
    _0x29e776 === 'panorama-scene-camera-create' ||
    _0x29e776 === 'panorama-scene-reset-view' ||
    _0x29e776 === 'panorama-scene-capture'
  );
}
function _isNodeToolbarAction(_0x6402b3) {
  return /^(image|video|audio|clip|text)-tool-/.test(String(_0x6402b3 || ''));
}
function _isEditorShortcut(_0x544ec8) {
  return String(_0x544ec8 || '')
    .trim()
    .startsWith('editor-');
}
function _isCreateNodeShortcut(_0x2e4ea9) {
  return String(_0x2e4ea9 || '')
    .trim()
    .startsWith('create-');
}
function _isGlobalShortcut(_0x5d438a) {
  const _0x16a912 = String(_0x5d438a || '').trim();
  if (!_0x16a912) return false;
  return (
    !_isEditorShortcut(_0x16a912) &&
    !_isNodeToolbarAction(_0x16a912) &&
    !_isPanoramaSceneShortcut(_0x16a912) &&
    !_isCreateNodeShortcut(_0x16a912)
  );
}
function _isPanoramaSceneNodeType(_0x195e0f) {
  return _PANORAMA_SCENE_NODE_TYPES.has(String(_0x195e0f || '').trim());
}
function _isPanoramaSceneEditingContext(_0x323331) {
  return _isPanoramaSceneNodeType(_0x323331?.selectedNodeType) && _0x323331?.panoramaSceneEditing === true;
}
function _filterShortcutMatchesByContext(_0x1dd153, _0x437072 = {}) {
  let _0x1addee = Array.isArray(_0x1dd153) ? [..._0x1dd153] : [];
  return (
    !(Number(_0x437072.selectedSyncPlayableVideoCount) >= 2) &&
      (_0x1addee = _0x1addee.filter((_0x467828) => _0x467828 !== 'ms-sync-video-play')),
    _0x437072.featureModeActive &&
      (_0x1addee = _0x1addee.filter((_0xdfcd15) => !_isNodeToolbarAction(_0xdfcd15))),
    _0x437072.alignFeatureEnabled === false &&
      (_0x1addee = _0x1addee.filter((_0x50d805) => _0x50d805 !== 'align-feature')),
    _0x437072.mediaClipExpandedEditing === true &&
      (_0x1addee = _0x1addee.filter((_0x24b9bd) => _0x24b9bd !== 'pan-canvas')),
    _isPanoramaSceneEditingContext(_0x437072) &&
      (_0x1addee = _0x1addee.filter(
        (_0x317a0f) => !_isNodeToolbarAction(_0x317a0f) && !_isCreateNodeShortcut(_0x317a0f),
      )),
    _0x1addee
  );
}
function _resolveToolbarShortcutMatch(_0x4f8db3, _0x34781a) {
  const _0x29ef4c = _TOOLBAR_SHORTCUT_PREFIX_BY_NODE_TYPE[String(_0x34781a || '').trim()];
  if (!_0x29ef4c) return null;
  return _0x4f8db3.find((_0xd5d599) => _0xd5d599.startsWith(_0x29ef4c)) || null;
}
function _resolveShortcutMatch(_0x561e1f, _0x51e70d = {}) {
  if (!Array.isArray(_0x561e1f) || _0x561e1f.length === 0) return null;
  if (_0x51e70d.mattingActive || _0x51e70d.annotateActive || _0x51e70d.videoKeyingActive) {
    const _0xc4699f = _0x561e1f.find((_0x50e8a1) => _isEditorShortcut(_0x50e8a1));
    if (_0xc4699f) return _0xc4699f;
  }
  if (_isPanoramaSceneEditingContext(_0x51e70d)) {
    const _0x255ddb = _0x561e1f.find((_0x4cbb76) => _isPanoramaSceneShortcut(_0x4cbb76));
    if (_0x255ddb) return _0x255ddb;
  }
  const _0x432680 = _resolveToolbarShortcutMatch(_0x561e1f, _0x51e70d.selectedNodeType);
  if (_0x432680) return _0x432680;
  const _0x233a43 = _0x561e1f.find((_0x32be0e) => _isGlobalShortcut(_0x32be0e));
  if (_0x233a43) return _0x233a43;
  const _0x453b9e = _0x561e1f.find((_0x17c873) => _isCreateNodeShortcut(_0x17c873));
  if (_0x453b9e) return _0x453b9e;
  return null;
}
function _getShortcutBindingStrings(_0x4d9925) {
  const _0x24496e = [];
  return (
    Array.isArray(_0x4d9925?.keys) && _0x4d9925.keys.length > 0 && _0x24496e.push(_0x4d9925.keys),
    Array.isArray(_0x4d9925?.alternateKeys) &&
      _0x4d9925.alternateKeys.forEach((_0x71abb5) => {
        Array.isArray(_0x71abb5) && _0x71abb5.length > 0 && _0x24496e.push(_0x71abb5);
      }),
    _0x24496e.map((_0x5aa9a9) => _toShortcutBindingString(_0x5aa9a9))
  );
}
function _normalizeShortcutToken(_0x1954d7) {
  const _0x54e44c = String(_0x1954d7 || '').trim();
  if (!_0x54e44c) return '';
  const _0x3ca5f0 = _0x54e44c.toLowerCase();
  if (_0x3ca5f0 === 'ctrl' || _0x3ca5f0 === 'control' || _0x3ca5f0 === 'meta') return 'Ctrl';
  if (_0x3ca5f0 === 'shift') return 'Shift';
  if (_0x3ca5f0 === 'alt') return 'Alt';
  if (_0x3ca5f0 === 'space') return 'Space';
  if (_0x3ca5f0 === 'backquote' || _0x54e44c === '`' || _0x54e44c === '~') return '`';
  if (_0x54e44c.length === 1) return _0x54e44c.toUpperCase();
  return _0x54e44c;
}
function _normalizeShortcutMainKey(_0x5bacfd) {
  const _0x2f3173 = String(_0x5bacfd?.code || '').trim(),
    _0x279d8e = String(_0x5bacfd?.key || '').trim();
  if (_0x2f3173 === 'Backquote') return '`';
  if (_0x2f3173 === 'Space') return 'Space';
  if (_0x2f3173 === 'Delete' || _0x279d8e === 'Del') return 'Delete';
  if (_0x2f3173 === 'Backspace') return 'Backspace';
  return _normalizeShortcutToken(_0x5bacfd?.key === ' ' ? 'Space' : _0x5bacfd?.key);
}
function _normalizeShortcutKeys(_0x5a7feb) {
  if (!Array.isArray(_0x5a7feb)) return [];
  const _0x447902 = _0x5a7feb.map((_0x5ab5c9) => _normalizeShortcutToken(_0x5ab5c9)).filter(Boolean),
    _0x236cc0 = [];
  if (_0x447902.includes('Ctrl')) _0x236cc0.push('Ctrl');
  if (_0x447902.includes('Shift')) _0x236cc0.push('Shift');
  if (_0x447902.includes('Alt')) _0x236cc0.push('Alt');
  const _0x2c8474 = _0x447902.filter(
    (_0x2c8974) => _0x2c8974 !== 'Ctrl' && _0x2c8974 !== 'Shift' && _0x2c8974 !== 'Alt',
  );
  return [..._0x236cc0, ..._0x2c8474];
}
function _buildShortcutKeysFromEvent(_0x4e08bd) {
  const _0xada670 = [];
  if (_0x4e08bd.ctrlKey || _0x4e08bd.metaKey) _0xada670.push('Ctrl');
  if (_0x4e08bd.shiftKey) _0xada670.push('Shift');
  if (_0x4e08bd.altKey) _0xada670.push('Alt');
  const _0x6a5fa2 = _normalizeShortcutMainKey(_0x4e08bd);
  return (!['Ctrl', 'Shift', 'Alt', ''].includes(_0x6a5fa2) && _0xada670.push(_0x6a5fa2), _0xada670);
}
function _toShortcutBindingString(_0x1426a0) {
  return _normalizeShortcutKeys(_0x1426a0).join('+').toUpperCase();
}
function _isContextualShortcutConflictExempt(_0x2e4d00, _0x435edd, _0x2cb9b9) {
  const _0x498c04 = new Set([_0x2e4d00, _0x435edd]);
  if (_0x2cb9b9 === 'B')
    return _0x498c04.has('toggle-connection-lines') && _0x498c04.has('editor-tool-brush');
  if (_0x2cb9b9 === 'G') return _0x498c04.has('ms-sync-video-play') && _0x498c04.has('editor-tool-bucket');
  return false;
}
function _resolveSavedShortcutKeys(_0x5a6ffb, _0x36b2bf, _0x261812, _0x1fdaae = {}) {
  const _0x31ac57 = Array.isArray(_0x36b2bf),
    _0x43d991 = _0x31ac57 ? _normalizeShortcutKeys(_0x36b2bf) : [],
    _0x3742dd =
      _0x1fdaae.savedPresetName === ASHUO_PRESET_NAME ? ASHUO_PRESET_SHORTCUT_MIGRATIONS[_0x5a6ffb] : null,
    _0x3c5add = BUILTIN_PRESET_NAMES.has(_0x1fdaae.savedPresetName)
      ? BUILTIN_PRESET_SHORTCUT_MIGRATIONS[_0x5a6ffb]
      : null;
  if (
    _0x31ac57 &&
    _0x3742dd &&
    _toShortcutBindingString(_0x43d991) === _toShortcutBindingString(_0x3742dd.from)
  )
    return _normalizeShortcutKeys(_0x3742dd.to);
  if (
    _0x31ac57 &&
    _0x3c5add &&
    _toShortcutBindingString(_0x43d991) === _toShortcutBindingString(_0x3c5add.from)
  )
    return _normalizeShortcutKeys(_0x3c5add.to);
  const _0x2f9073 = DEFAULT_SHORTCUT_MIGRATIONS[_0x5a6ffb];
  if (
    _0x31ac57 &&
    _0x2f9073 &&
    _toShortcutBindingString(_0x43d991) === _toShortcutBindingString(_0x2f9073.from)
  )
    return _normalizeShortcutKeys(_0x2f9073.to);
  return _0x31ac57 ? _0x43d991 : _normalizeShortcutKeys(_0x261812);
}
function _normalizePresetName(_0x2dfb86) {
  const _0x5f171a = String(_0x2dfb86 || '').trim();
  if (_0x5f171a === '自定义') return CUSTOM_PRESET_NAME;
  if (BUILTIN_PRESET_NAMES.has(_0x5f171a)) return _0x5f171a;
  if (_0x5f171a === CUSTOM_PRESET_NAME) return CUSTOM_PRESET_NAME;
  return ASHUO_PRESET_NAME;
}
function _buildPresetShortcuts(_0x2a0c7e) {
  const _0x373a07 = _normalizePresetName(_0x2a0c7e),
    _0x1d89aa = PRESETS[_0x373a07] || {};
  return Object.fromEntries(
    Object.entries(DEFAULT_SHORTCUTS).map(([_0x264e1e, _0x7b257c]) => [
      _0x264e1e,
      { ..._0x7b257c, keys: _normalizeShortcutKeys(_0x1d89aa[_0x264e1e] ?? [..._0x7b257c.keys]) },
    ]),
  );
}
function _shortcutsMatchPreset(_0x353871, _0xc90a96) {
  const _0x281e18 = _buildPresetShortcuts(_0xc90a96);
  return Object.entries(_0x281e18).every(([_0x525e41, _0x316ad3]) => {
    const _0x49f2d3 = _0x353871?.[_0x525e41]?.keys || [];
    return _toShortcutBindingString(_0x49f2d3) === _toShortcutBindingString(_0x316ad3.keys);
  });
}
function _inferPresetName(_0x4c1092, _0x7ad071) {
  if (_normalizePresetName(_0x7ad071) === CUSTOM_PRESET_NAME) return CUSTOM_PRESET_NAME;
  if (_shortcutsMatchPreset(_0x4c1092, DEFAULT_PRESET_NAME)) return DEFAULT_PRESET_NAME;
  if (_shortcutsMatchPreset(_0x4c1092, ASHUO_PRESET_NAME)) return ASHUO_PRESET_NAME;
  return CUSTOM_PRESET_NAME;
}
async function _loadFromServer() {
  try {
    const _0x208020 = await fetchUserShortcutsFromServer();
    if (_0x208020 && _0x208020.shortcuts && Object.keys(_0x208020.shortcuts).length > 0) {
      const _0x4cf0d2 = _normalizePresetName(_0x208020.preset),
        _0x11fb0c = BUILTIN_PRESET_NAMES.has(_0x4cf0d2) ? _0x4cf0d2 : ASHUO_PRESET_NAME,
        _0xae384c = _buildPresetShortcuts(_0x11fb0c);
      ((_shortcuts = Object.fromEntries(
        Object.entries(_0xae384c).map(([_0xea321f, _0x32f4ca]) => [
          _0xea321f,
          _0x208020.shortcuts[_0xea321f]
            ? {
                ..._0x32f4ca,
                keys: _resolveSavedShortcutKeys(
                  _0xea321f,
                  _0x208020.shortcuts[_0xea321f].keys,
                  _0x32f4ca.keys,
                  { savedPresetName: _0x4cf0d2 },
                ),
              }
            : { ..._0x32f4ca, keys: _normalizeShortcutKeys(_0x32f4ca.keys) },
        ]),
      )),
        (_currentPreset = _inferPresetName(_shortcuts, _0x4cf0d2)));
      if (_shortcuts['matting-auto']) _shortcuts['matting-auto'].keys = [];
      (_updatePresetSelect(), _render(), _syncShortcutsToGlobal());
    } else (_applyPreset(ASHUO_PRESET_NAME, false), _syncShortcutsToGlobal());
  } catch {
    (_applyPreset(ASHUO_PRESET_NAME, false), _syncShortcutsToGlobal());
  }
}
async function _saveToServer() {
  const _0x5b7acc = {
    preset: _currentPreset,
    shortcuts: Object.fromEntries(
      Object.entries(_shortcuts).map(([_0xe96316, _0x2f2b23]) => [_0xe96316, { keys: _0x2f2b23.keys }]),
    ),
  };
  try {
    (await saveUserShortcutsToServer(_0x5b7acc), _syncShortcutsToGlobal());
  } catch (_0x23a4f5) {
    console.warn('[shortcuts] save failed:', _0x23a4f5);
  }
}
function _syncCanvasScreenshotShortcutToElectron() {
  if (typeof window === 'undefined') return;
  const _0x216a4c = globalThis.window?.electronAPI?.screenshot;
  if (typeof _0x216a4c?.updateGlobalShortcut !== 'function') return;
  const _0x363bbb = Array.isArray(_shortcuts?.['canvas-screenshot']?.keys)
    ? _shortcuts['canvas-screenshot'].keys
    : DEFAULT_SHORTCUTS['canvas-screenshot'].keys;
  try {
    const _0x2424ad = _0x216a4c.updateGlobalShortcut({ keys: _0x363bbb });
    if (_0x2424ad && typeof _0x2424ad.catch === 'function')
      _0x2424ad.catch((_0x570fb2) => {
        console.warn('[shortcuts] failed to sync global screenshot shortcut:', _0x570fb2);
      });
  } catch (_0x18ad86) {
    console.warn('[shortcuts] failed to sync global screenshot shortcut:', _0x18ad86);
  }
}
function _syncShortcutsToGlobal() {
  const _0x512415 = {},
    _0x528ab9 = ['editor-tool-brush', 'editor-tool-eraser', 'editor-tool-bucket', 'editor-clear'];
  (_0x528ab9.forEach((_0x4868bc) => {
    if (_shortcuts[_0x4868bc]?.keys?.length > 0) {
      const _0x5e8e0f = _shortcuts[_0x4868bc].keys[_shortcuts[_0x4868bc].keys.length - 1];
      _0x512415[_0x4868bc] = _0x5e8e0f.toUpperCase();
    }
  }),
    (window._mattingShortcuts = _0x512415),
    _syncCanvasScreenshotShortcutToElectron());
}
function _applyPreset(_0xec91c, _0x2f9af8 = true) {
  const _0x992453 = _normalizePresetName(_0xec91c);
  if (!BUILTIN_PRESET_NAMES.has(_0x992453)) return;
  ((_currentPreset = _0x992453),
    (_shortcuts = _buildPresetShortcuts(_0x992453)),
    _render(),
    _syncShortcutsToGlobal(),
    _emitShortcutsUpdated());
  if (_0x2f9af8) _saveToServer();
}
function _getPresetControls() {
  if (typeof document === 'undefined') return {};
  const _0x3b105f = document.getElementById('shortcutsPresetSelect'),
    _0x3e0b4f = document.getElementById('shortcutsPresetControl'),
    _0x3bea91 = document.getElementById('shortcutsPresetTrigger'),
    _0x2c3026 = document.getElementById('shortcutsPresetTriggerText'),
    _0x257bc2 = document.getElementById('shortcutsPresetMenu'),
    _0x1c737c = _0x257bc2?.querySelectorAll
      ? Array.from(_0x257bc2.querySelectorAll('.settings-preset-option'))
      : [];
  return {
    select: _0x3b105f,
    control: _0x3e0b4f,
    trigger: _0x3bea91,
    triggerText: _0x2c3026,
    menu: _0x257bc2,
    options: _0x1c737c,
  };
}
function _getPresetLabel(_0x1aa827) {
  const { select: _0x503f01, options: _0x196ffd } = _getPresetControls(),
    _0x5a19d5 = _0x503f01?.options
      ? Array.from(_0x503f01.options).find((_0xb393bc) => _0xb393bc.value === _0x1aa827)
      : null,
    _0x23ca1f = _0x196ffd.find((_0x255229) => _0x255229.dataset?.value === _0x1aa827);
  return _0x5a19d5?.textContent || _0x23ca1f?.textContent || _0x1aa827;
}
function _setPresetMenuOpen(
  _0x107ebb,
  { focusOption: focusOption = false, focusTrigger: focusTrigger = false } = {},
) {
  const {
    control: _0x52360f,
    trigger: _0x1dd6de,
    menu: _0xabafa1,
    options: _0x11cf2e,
  } = _getPresetControls();
  if (!_0x52360f || !_0x1dd6de || !_0xabafa1) return;
  (_0x52360f.classList.toggle('is-open', _0x107ebb),
    _0x1dd6de.setAttribute('aria-expanded', _0x107ebb ? 'true' : 'false'),
    (_0xabafa1.hidden = !_0x107ebb));
  if (_0x107ebb && focusOption) {
    const _0x4c18bd = _0x11cf2e.find(
        (_0x33992b) => _0x33992b.dataset?.value === _currentPreset && !_0x33992b.disabled,
      ),
      _0x381473 = _0x11cf2e.find((_0x58eeb6) => !_0x58eeb6.disabled);
    (_0x4c18bd || _0x381473)?.focus?.();
  } else !_0x107ebb && focusTrigger && _0x1dd6de.focus?.();
}
function _isPresetMenuOpen() {
  const { control: _0x33a99e } = _getPresetControls();
  return !!_0x33a99e?.classList?.contains('is-open');
}
function _selectPresetFromUi(_0x3d5e31) {
  if (_normalizePresetName(_0x3d5e31) === CUSTOM_PRESET_NAME) {
    (_updatePresetSelect(), _setPresetMenuOpen(false, { focusTrigger: true }));
    return;
  }
  const _0x3031d5 = _normalizePresetName(_0x3d5e31);
  (_applyPreset(_0x3031d5, true),
    _updatePresetSelect(),
    _setPresetMenuOpen(false, { focusTrigger: true }),
    window.showToast?.(
      _tShortcut('presetSwitched', '已切换预设：' + _0x3031d5, { preset: _getPresetLabel(_0x3031d5) }),
    ));
}
function _movePresetOptionFocus(_0x5c0c2f) {
  const { options: _0x3d8ba0 } = _getPresetControls(),
    _0x56f785 = _0x3d8ba0.filter((_0x15274b) => !_0x15274b.disabled);
  if (_0x56f785.length === 0) return;
  const _0xa5571b = document.activeElement;
  let _0x2cd8dd = _0x56f785.indexOf(_0xa5571b);
  _0x2cd8dd < 0 &&
    (_0x2cd8dd = _0x56f785.findIndex((_0x4b3ac6) => _0x4b3ac6.dataset?.value === _currentPreset));
  const _0x4d6c95 = (Math.max(_0x2cd8dd, 0) + _0x5c0c2f + _0x56f785.length) % _0x56f785.length;
  _0x56f785[_0x4d6c95]?.focus?.();
}
function _updatePresetSelect() {
  const { select: _0x36dec2, triggerText: _0x26249b, options: _0x4f6701 } = _getPresetControls();
  if (_0x36dec2) _0x36dec2.value = _currentPreset;
  if (_0x26249b) _0x26249b.textContent = _getPresetLabel(_currentPreset);
  _0x4f6701.forEach((_0x57f546) => {
    const _0x492121 = _0x57f546.dataset?.value === _currentPreset;
    (_0x57f546.classList.toggle('is-active', _0x492121),
      _0x57f546.setAttribute('aria-selected', _0x492121 ? 'true' : 'false'));
  });
}
function _initPresetSelect() {
  const { select: _0x5a3160, control: _0xf67532, trigger: _0x5bfe64, menu: _0x12f3da } = _getPresetControls();
  _0x5a3160 &&
    !_0x5a3160.dataset.presetSelectBound &&
    ((_0x5a3160.dataset.presetSelectBound = 'true'),
    _0x5a3160.addEventListener('change', () => {
      _selectPresetFromUi(_0x5a3160.value);
    }));
  if (!_0xf67532 || !_0x5bfe64 || !_0x12f3da || _0x5bfe64.dataset.presetSelectBound) {
    _updatePresetSelect();
    return;
  }
  ((_0x5bfe64.dataset.presetSelectBound = 'true'),
    _0x5bfe64.addEventListener('click', () => {
      _setPresetMenuOpen(!_isPresetMenuOpen(), { focusOption: true });
    }),
    _0x5bfe64.addEventListener('keydown', (_0x28706b) => {
      (_0x28706b.key === 'ArrowDown' || _0x28706b.key === 'Enter' || _0x28706b.key === ' ') &&
        (_0x28706b.preventDefault(), _setPresetMenuOpen(true, { focusOption: true }));
    }),
    _0x12f3da.addEventListener('click', (_0x3dea86) => {
      const _0x569990 = _0x3dea86.target?.closest?.('.settings-preset-option');
      if (!_0x569990 || _0x569990.disabled) return;
      _selectPresetFromUi(_0x569990.dataset.value);
    }),
    _0x12f3da.addEventListener('keydown', (_0x20ed0e) => {
      if (_0x20ed0e.key === 'Escape')
        (_0x20ed0e.preventDefault(), _setPresetMenuOpen(false, { focusTrigger: true }));
      else {
        if (_0x20ed0e.key === 'ArrowDown') (_0x20ed0e.preventDefault(), _movePresetOptionFocus(1));
        else {
          if (_0x20ed0e.key === 'ArrowUp') (_0x20ed0e.preventDefault(), _movePresetOptionFocus(-1));
          else {
            if (_0x20ed0e.key === 'Enter' || _0x20ed0e.key === ' ') {
              _0x20ed0e.preventDefault();
              const _0x3a555c = document.activeElement?.closest?.('.settings-preset-option');
              if (_0x3a555c && !_0x3a555c.disabled) _selectPresetFromUi(_0x3a555c.dataset.value);
            }
          }
        }
      }
    }),
    document.addEventListener('pointerdown', (_0x12b551) => {
      if (!_isPresetMenuOpen()) return;
      if (typeof _0xf67532.contains === 'function' && _0xf67532.contains(_0x12b551.target)) return;
      _setPresetMenuOpen(false);
    }),
    _updatePresetSelect());
}
function _render() {
  const _0x23ad20 = document.getElementById('shortcutsContent');
  if (!_0x23ad20) return;
  _0x23ad20.replaceChildren();
  const _0x3d4eb9 = {};
  (Object.entries(_shortcuts).forEach(([_0x2b37a7, _0x17647b]) => {
    if (_0x17647b.hidden) return;
    if (!_0x3d4eb9[_0x17647b.group]) _0x3d4eb9[_0x17647b.group] = [];
    _0x3d4eb9[_0x17647b.group].push({ id: _0x2b37a7, ..._0x17647b });
  }),
    Object.entries(_0x3d4eb9).forEach(([_0x881a9e, _0x2ac5f6]) => {
      const _0x5473ff = document.createElement('div');
      _0x5473ff.className = 'sc-section';
      const _0x5a50a2 = document.createElement('div');
      ((_0x5a50a2.className = 'sc-section-title'),
        (_0x5a50a2.textContent = _translateShortcutGroup(_0x881a9e)),
        _0x5473ff.appendChild(_0x5a50a2),
        _0x2ac5f6.forEach((_0x293beb) => {
          const _0x4e751a = document.createElement('div');
          _0x4e751a.className = 'sc-item';
          const _0x3cb717 = document.createElement('span');
          ((_0x3cb717.className = 'sc-label'),
            (_0x3cb717.textContent = _translateShortcutAction(_0x293beb.id, _0x293beb.label)));
          const _0x4c7c55 = document.createElement('div');
          ((_0x4c7c55.className = 'sc-keys'),
            (_0x4c7c55.dataset.action = _0x293beb.id),
            _0x4c7c55.replaceChildren());
          if (_recordingAction === _0x293beb.id) {
            const _0x1a3c9d = document.createElement('kbd');
            ((_0x1a3c9d.className = 'kbd-v2 recording'),
              (_0x1a3c9d.textContent = _tShortcut('recording', '录制中...')),
              _0x4c7c55.appendChild(_0x1a3c9d));
          } else {
            if (_0x293beb.keys.length > 0)
              _0x293beb.keys.forEach((_0x4570da) => {
                const _0x50dc4a = document.createElement('kbd');
                ((_0x50dc4a.className = 'kbd-v2'),
                  (_0x50dc4a.textContent = _0x4570da),
                  _0x4c7c55.appendChild(_0x50dc4a));
              });
            else {
              const _0x5d3520 = document.createElement('kbd');
              ((_0x5d3520.className = 'kbd-v2'),
                (_0x5d3520.textContent = _tShortcut('unset', '未设置')),
                _0x4c7c55.appendChild(_0x5d3520));
            }
          }
          (_0x4c7c55.addEventListener('click', () => _startRecording(_0x293beb.id)),
            _0x4e751a.appendChild(_0x3cb717),
            _0x4e751a.appendChild(_0x4c7c55),
            _0x5473ff.appendChild(_0x4e751a));
        }),
        _0x23ad20.appendChild(_0x5473ff));
    }));
}
function _startRecording(_0x2c2110) {
  if (_recordingAction) return;
  ((_recordingAction = _0x2c2110), _render());
}
export function detectShortcutConflict(_0x506d53, _0x11bd96, _0x5178f9) {
  if (!_0x506d53 || typeof _0x506d53 !== 'object') return null;
  const _0x4a3d3d = _toShortcutBindingString(_0x5178f9);
  if (!_0x4a3d3d) return null;
  for (const [_0x38364c, _0x2733cf] of Object.entries(_0x506d53)) {
    if (_0x38364c === _0x11bd96) continue;
    if (_getShortcutBindingStrings(_0x2733cf).includes(_0x4a3d3d)) {
      if (_isContextualShortcutConflictExempt(_0x11bd96, _0x38364c, _0x4a3d3d)) continue;
      return { id: _0x38364c, label: _0x2733cf.label || _0x38364c };
    }
  }
  return null;
}
function _stopRecording(_0x903d87) {
  if (!_recordingAction) return;
  if (_0x903d87 && _0x903d87.length > 0) {
    const _0x1a2103 = detectShortcutConflict(_shortcuts, _recordingAction, _0x903d87);
    if (_0x1a2103) {
      (window.showToast?.(
        _tShortcut('conflict', '快捷键冲突：已被「' + _0x1a2103.label + '」占用', {
          label: _translateShortcutAction(_0x1a2103.id, _0x1a2103.label),
        }),
        'warn',
      ),
        (_recordingAction = null),
        _render());
      return;
    }
    ((_shortcuts[_recordingAction].keys = _normalizeShortcutKeys(_0x903d87)),
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
function _dispatchWebPreviewSettingsSync(_0x1d5c75) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  const _0x1df902 = { reason: _0x1d5c75 },
    _0x8af6f6 =
      typeof CustomEvent === 'function'
        ? new CustomEvent('web-preview:force-sync', { detail: _0x1df902 })
        : { type: 'web-preview:force-sync', detail: _0x1df902 };
  window.dispatchEvent(_0x8af6f6);
}
export function openShortcuts() {
  const _0xfcb6ae = document.getElementById('settingsOverlay');
  if (!_0xfcb6ae) return;
  ((_0xfcb6ae.style.display = 'block'), _dispatchWebPreviewSettingsSync('shortcuts-open'));
  const _0x5dc952 = document.querySelectorAll('.settings-nav-item'),
    _0x4b8e76 = document.querySelectorAll('.settings-pane');
  (_0x5dc952.forEach((_0x113b73) => {
    _0x113b73.classList.toggle('active', _0x113b73.dataset.pane === 'shortcuts');
  }),
    _0x4b8e76.forEach((_0x5f2977) => {
      _0x5f2977.classList.toggle('active', _0x5f2977.id === 'pane-shortcuts');
    }),
    _render(),
    _updatePresetSelect());
}
export function closeShortcuts() {
  const _0x25ffee = document.getElementById('settingsOverlay');
  (_0x25ffee && ((_0x25ffee.style.display = 'none'), _dispatchWebPreviewSettingsSync('shortcuts-close')),
    _recordingAction && ((_recordingAction = null), _render()));
}
export function getShortcuts() {
  return _shortcuts;
}
export function getCurrentPreset() {
  return _currentPreset;
}
export function isRecording() {
  return !!_recordingAction;
}
export function handleShortcutKeydown(_0x1af211, _0x35036d = {}) {
  if (_recordingAction) return null;
  const _0x9c1ff2 = _toShortcutBindingString(_buildShortcutKeysFromEvent(_0x1af211));
  let _0xde9bb7 = [];
  for (const [_0x28dcd7, _0x40d891] of Object.entries(_shortcuts)) {
    _getShortcutBindingStrings(_0x40d891).includes(_0x9c1ff2) && _0xde9bb7.push(_0x28dcd7);
  }
  _0xde9bb7 = _filterShortcutMatchesByContext(_0xde9bb7, _0x35036d);
  if (_0xde9bb7.length === 0) return null;
  return _resolveShortcutMatch(_0xde9bb7, _0x35036d);
}
typeof document !== 'undefined' &&
  document?.addEventListener &&
  (onLocaleChange(() => {
    (_render(), _updatePresetSelect());
  }),
  document.addEventListener(
    'keydown',
    (_0xa2541a) => {
      if (!_recordingAction) return;
      (_0xa2541a.preventDefault(), _0xa2541a.stopImmediatePropagation());
      if (_0xa2541a.key === 'Escape') {
        _stopRecording(null);
        return;
      }
      const _0x39dc26 = _buildShortcutKeysFromEvent(_0xa2541a),
        _0x1f837d = _normalizeShortcutMainKey(_0xa2541a);
      _0x39dc26.length > 0 && !['Ctrl', 'Shift', 'Alt', ''].includes(_0x1f837d) && _stopRecording(_0x39dc26);
    },
    true,
  ),
  document.addEventListener('DOMContentLoaded', () => {
    (_loadFromServer(),
      document.getElementById('btnShortcutsClose')?.addEventListener('click', closeShortcuts),
      document.getElementById('btnResetShortcuts')?.addEventListener('click', (_0x3a7372) => {
        (_0x3a7372.stopPropagation(), _reset());
      }),
      document.getElementById('btnShortcutsClose')?.addEventListener('click', closeShortcuts),
      document.getElementById('btnShortcuts')?.addEventListener('click', (_0x257bb9) => {
        (_0x257bb9.stopPropagation(),
          document.getElementById('avatarMenu')?.classList.remove('open'),
          openShortcuts());
      }),
      _initPresetSelect());
  }));
