export const SHORTCUT_ICONS = Object['freeze'](['text', 'image', 'video', 'audio', 'template']);
export const SHORTCUT_NODE_TYPES = Object['freeze'](['ai-text', 'ai-image', 'ai-video', 'ai-audio']);
export const SHORTCUT_CATEGORIES = Object['freeze'](['text', 'image', 'video', 'audio']);
export function resolveShortcutCategory(_0x1b18eb) {
  if (SHORTCUT_CATEGORIES['includes'](_0x1b18eb['category'])) return _0x1b18eb['category'];
  if (_0x1b18eb['action']?.['kind'] === 'node') return _0x1b18eb['action']['nodeType']['slice'](0x3);
  const _0x3a3db0 = [...(_0x1b18eb['action']?.['graph']?.['nodes'] || [])]
    ['reverse']()
    ['find']((_0x2ce02e) => SHORTCUT_NODE_TYPES['includes'](_0x2ce02e['type']));
  if (_0x3a3db0) return _0x3a3db0['type']['slice'](0x3);
  return SHORTCUT_CATEGORIES['includes'](_0x1b18eb['icon']) ? _0x1b18eb['icon'] : 'text';
}
export function getAvailableShortcutTemplates(_0x585617) {
  return _0x585617['items']['filter'](
    (_0x430327) => _0x430327['enabled'] && _0x430327['action']['kind'] === 'graph',
  );
}
export function canManageCanvasShortcuts(_0x558782 = globalThis['window']) {
  return _0x558782?.['AI_CANVAS_IS_DEV_BUILD'] === !![] && _0x558782?.['DEV_MODE'] === !![];
}
export function createDefaultShortcutCatalog() {
  return {
    schemaVersion: 0x1,
    items: ['text', 'image', 'video', 'audio']['map']((_0x2c7105, _0x1be77b) => ({
      id: 'default-' + _0x2c7105,
      name: ['文本生成', '图片生成', '视频生成', '音频生成'][_0x1be77b],
      icon: _0x2c7105,
      badge: '',
      cover: '',
      enabled: !![],
      action: { kind: 'node', nodeType: 'ai-' + _0x2c7105 },
    })),
  };
}
export function validateShortcutCatalog(_0x1c72af) {
  if (_0x1c72af?.['schemaVersion'] !== 0x1) throw new Error('不支持的快捷方式配置版本');
  if (!Array['isArray'](_0x1c72af['items']) || _0x1c72af['items']['length'] > 0x40)
    throw new Error('快捷方式最多 64 项');
  const _0xb88f24 = new Set();
  for (const _0x322d94 of _0x1c72af['items']) {
    if (
      !_0x322d94 ||
      typeof _0x322d94['id'] !== 'string' ||
      !_0x322d94['id']['trim']() ||
      _0x322d94['id']['length'] > 0x64 ||
      _0xb88f24['has'](_0x322d94['id'])
    )
      throw new Error('快捷方式标识无效或重复');
    _0xb88f24['add'](_0x322d94['id']);
    if (_0x322d94['category'] !== undefined && !SHORTCUT_CATEGORIES['includes'](_0x322d94['category']))
      throw new Error('请选择文本、图片、视频或音频分类');
    if (
      typeof _0x322d94['name'] !== 'string' ||
      !_0x322d94['name']['trim']() ||
      _0x322d94['name']['length'] > 0x32
    )
      throw new Error('请填写名称（最多 50 字）');
    if (typeof _0x322d94['badge'] !== 'string' || _0x322d94['badge']['length'] > 0x18)
      throw new Error('角标最多 24 字');
    if (
      _0x322d94['subtitle'] !== undefined &&
      (typeof _0x322d94['subtitle'] !== 'string' || _0x322d94['subtitle']['length'] > 0x50)
    )
      throw new Error('副标题最多 80 字');
    if (!SHORTCUT_ICONS['includes'](_0x322d94['icon']) || typeof _0x322d94['enabled'] !== 'boolean')
      throw new Error('快捷方式外观配置无效');
    if (
      typeof _0x322d94['cover'] !== 'string' ||
      (_0x322d94['cover'] &&
        !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/['test'](_0x322d94['cover']))
    )
      throw new Error('封面须为 PNG、JPEG 或 WebP 图片');
    if (_0x322d94['action']?.['kind'] === 'node') {
      if (!SHORTCUT_NODE_TYPES['includes'](_0x322d94['action']['nodeType']))
        throw new Error('不支持的快捷节点类型');
    } else {
      if (_0x322d94['action']?.['kind'] === 'graph') validateShortcutGraph(_0x322d94['action']['graph']);
      else throw new Error('请选择快捷方式内容');
    }
  }
  return _0x1c72af;
}
export function validateShortcutGraph(_0x2fcd3b) {
  if (
    !Array['isArray'](_0x2fcd3b?.['nodes']) ||
    !_0x2fcd3b['nodes']['length'] ||
    _0x2fcd3b['nodes']['length'] > 0x100
  )
    throw new Error('模板需要 1～256 个节点');
  if (!Array['isArray'](_0x2fcd3b['edges']) || _0x2fcd3b['edges']['length'] > 0x800)
    throw new Error('模板连线无效');
  const _0xac188c = new Set();
  for (const _0x23f047 of _0x2fcd3b['nodes']) {
    if (
      !_0x23f047 ||
      typeof _0x23f047['id'] !== 'string' ||
      !_0x23f047['id'] ||
      typeof _0x23f047['type'] !== 'string' ||
      !_0x23f047['type'] ||
      _0xac188c['has'](_0x23f047['id'])
    )
      throw new Error('模板节点无效或重复');
    _0xac188c['add'](_0x23f047['id']);
    for (const _0x58db99 of ['x', 'y', 'width', 'height']) {
      if (
        !Number['isFinite'](_0x23f047[_0x58db99]) ||
        (['width', 'height']['includes'](_0x58db99) && _0x23f047[_0x58db99] <= 0x0)
      )
        throw new Error('模板节点尺寸或位置无效');
    }
  }
  for (const _0x44970c of _0x2fcd3b['edges']) {
    if (!_0x44970c || !_0xac188c['has'](_0x44970c['sourceId']) || !_0xac188c['has'](_0x44970c['targetId']))
      throw new Error('模板连线引用了未包含的节点');
  }
  for (const _0x1ed162 of _0x2fcd3b['nodes']) {
    if (_0x1ed162['parentId'] && !_0xac188c['has'](_0x1ed162['parentId']))
      throw new Error('模板分组引用了未包含的节点');
    const _0x269fd1 = new Set([_0x1ed162['id']]);
    let _0x14531f = _0x1ed162['parentId'];
    while (_0x14531f) {
      if (_0x269fd1['has'](_0x14531f)) throw new Error('模板分组存在循环');
      (_0x269fd1['add'](_0x14531f),
        (_0x14531f = _0x2fcd3b['nodes']['find']((_0x379c24) => _0x379c24['id'] === _0x14531f)?.['parentId']));
    }
  }
  return _0x2fcd3b;
}
export function createShortcutCatalogStore({ load: _0x2692cb, save: _0x1fa20c, canManage: _0x35f365 }) {
  let _0x340194 = { catalog: createDefaultShortcutCatalog(), revision: '', loaded: ![] },
    _0xf72d4e = null,
    _0x410322 = ![];
  const _0x2b8c87 = new Set(),
    _0x17d228 = (_0x309d48) => {
      const _0x2cb1b4 =
        _0x309d48?.['catalog'] == null
          ? createDefaultShortcutCatalog()
          : validateShortcutCatalog(_0x309d48['catalog']);
      return (
        (_0x340194 = {
          catalog: structuredClone(_0x2cb1b4),
          revision: _0x309d48?.['revision'] || '',
          loaded: !![],
        }),
        _0x2b8c87['forEach']((_0x404cec) => _0x404cec(_0x340194)),
        _0x340194
      );
    };
  return {
    getState: () => structuredClone(_0x340194),
    subscribe(_0xca8974) {
      return (_0x2b8c87['add'](_0xca8974), () => _0x2b8c87['delete'](_0xca8974));
    },
    load() {
      if (!_0xf72d4e)
        _0xf72d4e = Promise['resolve']()
          ['then'](_0x2692cb)
          ['then'](_0x17d228)
          ['finally'](() => {
            _0xf72d4e = null;
          });
      return _0xf72d4e;
    },
    async save(_0x14ff52, _0x231f97) {
      if (!_0x35f365()) throw new Error('请开启开发者模式，并确认本地\x20.dev\x20文件存在');
      if (!_0x340194['loaded'] || _0x410322 || _0xf72d4e) throw new Error('配置正在读写，请稍后再试');
      (validateShortcutCatalog(_0x14ff52), (_0x410322 = !![]));
      try {
        return _0x17d228(await _0x1fa20c(structuredClone(_0x14ff52), _0x231f97));
      } finally {
        _0x410322 = ![];
      }
    },
  };
}
