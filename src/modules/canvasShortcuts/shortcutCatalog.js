export const SHORTCUT_ICONS = Object['freeze'](['text', 'image', 'video', 'audio', 'template']);
export const SHORTCUT_NODE_TYPES = Object['freeze'](['ai-text', 'ai-image', 'ai-video', 'ai-audio']);
export const SHORTCUT_CATEGORIES = Object['freeze'](['text', 'image', 'video', 'audio']);
export function resolveShortcutCategory(value) {
  if (SHORTCUT_CATEGORIES['includes'](value['category'])) return value['category'];
  if (value['action']?.['kind'] === 'node') return value['action']['nodeType']['slice'](3);
  const item = [...(value['action']?.['graph']?.['nodes'] || [])]
    ['reverse']()
    ['find']((key) => SHORTCUT_NODE_TYPES['includes'](key['type']));
  if (item) return item['type']['slice'](3);
  return SHORTCUT_CATEGORIES['includes'](value['icon']) ? value['icon'] : 'text';
}
export function getAvailableShortcutTemplates(index) {
  return index['items']['filter']((result) => result['enabled'] && result['action']['kind'] === 'graph');
}
export function canManageCanvasShortcuts(data = globalThis['window']) {
  return data?.['AI_CANVAS_IS_DEV_BUILD'] === !![] && data?.['DEV_MODE'] === !![];
}
export function createDefaultShortcutCatalog() {
  return {
    schemaVersion: 1,
    items: ['text', 'image', 'video', 'audio']['map']((icon, options) => ({
      id: 'default-' + icon,
      name: ['文本生成', '图片生成', '视频生成', '音频生成'][options],
      icon: icon,
      badge: '',
      cover: '',
      enabled: !![],
      action: { kind: 'node', nodeType: 'ai-' + icon },
    })),
  };
}
export function validateShortcutCatalog(target) {
  if (target?.['schemaVersion'] !== 1) throw new Error('不支持的快捷方式配置版本');
  if (!Array['isArray'](target['items']) || target['items']['length'] > 64)
    throw new Error('快捷方式最多 64 项');
  const map = new Set();
  for (const error of target['items']) {
    if (
      !error ||
      typeof error['id'] !== 'string' ||
      !error['id']['trim']() ||
      error['id']['length'] > 100 ||
      map['has'](error['id'])
    )
      throw new Error('快捷方式标识无效或重复');
    map['add'](error['id']);
    if (error['category'] !== undefined && !SHORTCUT_CATEGORIES['includes'](error['category']))
      throw new Error('请选择文本、图片、视频或音频分类');
    if (typeof error['name'] !== 'string' || !error['name']['trim']() || error['name']['length'] > 50)
      throw new Error('请填写名称（最多 50 字）');
    if (typeof error['badge'] !== 'string' || error['badge']['length'] > 24)
      throw new Error('角标最多 24 字');
    if (
      error['subtitle'] !== undefined &&
      (typeof error['subtitle'] !== 'string' || error['subtitle']['length'] > 80)
    )
      throw new Error('副标题最多 80 字');
    if (!SHORTCUT_ICONS['includes'](error['icon']) || typeof error['enabled'] !== 'boolean')
      throw new Error('快捷方式外观配置无效');
    if (
      typeof error['cover'] !== 'string' ||
      (error['cover'] && !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/['test'](error['cover']))
    )
      throw new Error('封面须为 PNG、JPEG 或 WebP 图片');
    if (error['action']?.['kind'] === 'node') {
      if (!SHORTCUT_NODE_TYPES['includes'](error['action']['nodeType']))
        throw new Error('不支持的快捷节点类型');
    } else {
      if (error['action']?.['kind'] === 'graph') validateShortcutGraph(error['action']['graph']);
      else throw new Error('请选择快捷方式内容');
    }
  }
  return target;
}
export function validateShortcutGraph(enabled) {
  if (
    !Array['isArray'](enabled?.['nodes']) ||
    !enabled['nodes']['length'] ||
    enabled['nodes']['length'] > 256
  )
    throw new Error('模板需要 1～256 个节点');
  if (!Array['isArray'](enabled['edges']) || enabled['edges']['length'] > 2048)
    throw new Error('模板连线无效');
  const map2 = new Set();
  for (const enabled2 of enabled['nodes']) {
    if (
      !enabled2 ||
      typeof enabled2['id'] !== 'string' ||
      !enabled2['id'] ||
      typeof enabled2['type'] !== 'string' ||
      !enabled2['type'] ||
      map2['has'](enabled2['id'])
    )
      throw new Error('模板节点无效或重复');
    map2['add'](enabled2['id']);
    for (const source of ['x', 'y', 'width', 'height']) {
      if (
        !Number['isFinite'](enabled2[source]) ||
        (['width', 'height']['includes'](source) && enabled2[source] <= 0)
      )
        throw new Error('模板节点尺寸或位置无效');
    }
  }
  for (const enabled3 of enabled['edges']) {
    if (!enabled3 || !map2['has'](enabled3['sourceId']) || !map2['has'](enabled3['targetId']))
      throw new Error('模板连线引用了未包含的节点');
  }
  for (const next of enabled['nodes']) {
    if (next['parentId'] && !map2['has'](next['parentId'])) throw new Error('模板分组引用了未包含的节点');
    const map3 = new Set([next['id']]);
    let current = next['parentId'];
    while (current) {
      if (map3['has'](current)) throw new Error('模板分组存在循环');
      (map3['add'](current),
        (current = enabled['nodes']['find']((entry) => entry['id'] === current)?.['parentId']));
    }
  }
  return enabled;
}
export function createShortcutCatalogStore({ load: load2, save: save2, canManage: canManage }) {
  let enabled4 = { catalog: createDefaultShortcutCatalog(), revision: '', loaded: ![] },
    enabled5 = null,
    record = ![];
  const list = new Set(),
    handler = (revision) => {
      const payload =
        revision?.['catalog'] == null
          ? createDefaultShortcutCatalog()
          : validateShortcutCatalog(revision['catalog']);
      return (
        (enabled4 = {
          catalog: structuredClone(payload),
          revision: revision?.['revision'] || '',
          loaded: !![],
        }),
        list['forEach']((handler2) => handler2(enabled4)),
        enabled4
      );
    };
  return {
    getState: () => structuredClone(enabled4),
    subscribe(handle) {
      return (list['add'](handle), () => list['delete'](handle));
    },
    load() {
      if (!enabled5)
        enabled5 = Promise['resolve']()
          ['then'](load2)
          ['then'](handler)
          ['finally'](() => {
            enabled5 = null;
          });
      return enabled5;
    },
    async save(state, config) {
      if (!canManage()) throw new Error('请开启开发者模式，并确认本地 .dev 文件存在');
      if (!enabled4['loaded'] || record || enabled5) throw new Error('配置正在读写，请稍后再试');
      (validateShortcutCatalog(state), (record = !![]));
      try {
        return handler(await save2(structuredClone(state), config));
      } finally {
        record = ![];
      }
    },
  };
}
