import { beginModalInteraction } from '../../services/modalInteractionScope.js';
import { generateId } from '../../core/math.js';
import { canManageCanvasShortcuts, createDefaultShortcutCatalog } from './shortcutCatalog.js';
import { captureShortcutGraph } from './shortcutGraph.js';
import { createShortcutCard, element } from './shortcutPresentation.js';
function createDraftItem(name = null) {
  return {
    id: generateId('shortcut'),
    name: name ? '新模板' : '新快捷方式',
    icon: 'template',
    subtitle: '',
    badge: '',
    cover: '',
    enabled: true,
    action: name ? { kind: 'graph', graph: structuredClone(name) } : { kind: 'node', nodeType: 'ai-image' },
  };
}
export function openShortcutManager({
  catalogStore: catalogStore,
  canvasStore: canvasStore,
  returnFocus: returnFocus,
  initialGraph: initialGraph = null,
}) {
  if (!canManageCanvasShortcuts()) return null;
  const value = catalogStore['getState'](),
    args = structuredClone(value['catalog']);
  let item = args['items'][0]?.['id'] || '';
  if (initialGraph) {
    if (args['items']['length'] >= 64) throw new Error('快捷方式最多 64 项');
    const draftItem = createDraftItem(initialGraph);
    (args['items']['push'](draftItem), (item = draftItem['id']));
  }
  let enabled = false,
    enabled2 = false,
    handler = () => {};
  const root = element('div', 'canvas-shortcuts-overlay');
  ((root['id'] = 'canvasShortcutsManager'),
    (root['innerHTML'] =
      '<section class="canvas-shortcuts-dialog" role="dialog" aria-modal="true" aria-labelledby="canvasShortcutsTitle">\n    <header><h2 id="canvasShortcutsTitle">空白画布快捷方式</h2><button type="button" data-action="close" aria-label="关闭管理界面">关闭</button></header>\n    <div class="canvas-shortcuts-manager-body">\n      <aside class="canvas-shortcuts-sidebar"><div class="canvas-shortcuts-tools"><button type="button" data-action="add">新增</button><button type="button" data-action="defaults">恢复默认</button></div><div class="canvas-shortcuts-list" role="list" aria-label="快捷方式列表"></div></aside>\n      <div class="canvas-shortcuts-editor">\n        <p class="canvas-shortcuts-no-selection">点击“新增”创建快捷方式</p>\n        <form class="canvas-shortcuts-form" hidden>\n          <label>名称<input name="name" maxlength="50" required autocomplete="off"></label>\n          <label>副标题（可选）<input name="subtitle" maxlength="80" autocomplete="off" placeholder="鼠标悬停时显示的说明"></label>\n          <label>模板分类<select name="category"><option value="">自动按节点类型</option><option value="text">文本生成</option><option value="image">图片生成</option><option value="video">视频生成</option><option value="audio">音频生成</option></select></label>\n          <div class="canvas-shortcuts-fields"><label>图标<select name="icon"><option value="text">文本</option><option value="image">图片</option><option value="video">视频</option><option value="audio">音频</option><option value="template">模板</option></select></label><label>角标（可选）<input name="badge" maxlength="24" autocomplete="off" placeholder="例如 SD 2.5"></label></div>\n          <label>封面图片（可选）<input name="coverFile" type="file" accept="image/png,image/jpeg,image/webp"></label>\n          <button type="button" data-action="clear-cover">移除封面</button>\n          <label>点击后添加<select name="action"><option value="ai-text">文本生成节点</option><option value="ai-image">图片生成节点</option><option value="ai-video">视频生成节点</option><option value="ai-audio">音频生成节点</option><option value="graph">选中节点模板</option></select></label>\n          <div class="canvas-shortcuts-graph" hidden><button type="button" data-action="capture">使用画布选中节点</button><p class="canvas-shortcuts-graph-info"></p><p>保存素材、参数和内部连线；插入后由用户点击生成。</p></div>\n          <label class="canvas-shortcuts-checkbox"><input name="enabled" type="checkbox">在空白画布显示</label>\n          <div class="canvas-shortcuts-tools"><button type="button" data-action="up">上移</button><button type="button" data-action="down">下移</button><button type="button" data-action="remove">删除此项</button></div>\n          <p>卡片预览</p><div class="canvas-shortcuts-preview v2-node-menu-compact"></div>\n        </form>\n      </div>\n    </div>\n    <footer><span class="canvas-shortcuts-status" role="status" aria-live="polite"></span><button type="button" data-action="close">取消</button><button type="button" data-action="save">保存并应用</button></footer>\n  </section>'),
    document['body']['append'](root));
  const el = root['querySelector']('form'),
    key = root['querySelector']('.canvas-shortcuts-list'),
    index = root['querySelector']('.canvas-shortcuts-editor'),
    el2 = root['querySelector']('.canvas-shortcuts-status');
  el2['tabIndex'] = -1;
  const run = () => args['items']['find']((result) => result['id'] === item),
    handler2 = (data) => {
      el2['textContent'] = data;
    },
    onClose = () => {
      if (enabled2) return;
      ((enabled = true),
        window['removeEventListener']('dev-mode-changed', options),
        window['removeEventListener']('aicanvas:runtime-info', options),
        handler(),
        root['remove']());
    },
    options = () => {
      !canManageCanvasShortcuts() && ((enabled2 = false), onClose());
    },
    handler3 = () => {
      const enabled3 = run();
      if (!enabled3) return;
      root['querySelector']('.canvas-shortcuts-preview')['replaceChildren'](
        createShortcutCard(enabled3, { preview: true }),
      );
      const enabled4 = enabled3['action']['kind'] === 'graph';
      ((root['querySelector']('.canvas-shortcuts-graph')['hidden'] = !enabled4),
        (root['querySelector']('.canvas-shortcuts-graph-info')['textContent'] =
          enabled4 && enabled3['action']['graph']
            ? enabled3['action']['graph']['nodes']['length'] +
              ' 个节点 · ' +
              enabled3['action']['graph']['edges']['length'] +
              ' 条连线'
            : '尚未保存节点，请先在画布中选中内容。'));
    },
    handler4 = () => {
      const target = key['scrollTop'];
      (key['replaceChildren'](
        ...args['items']['map']((error) => {
          const el3 = element('div', 'canvas-shortcuts-list-row');
          el3['setAttribute']('role', 'listitem');
          const el4 = element(
            'button',
            error['id'] === item ? 'is-selected' : '',
            '' + (error['name'] || '未命名') + (error['enabled'] ? '' : ' · 已隐藏'),
          );
          return (
            (el4['type'] = 'button'),
            (el4['dataset']['editShortcutId'] = error['id']),
            el4['setAttribute']('aria-pressed', String(error['id'] === item)),
            el3['append'](el4),
            el3
          );
        }),
      ),
        (key['scrollTop'] = target));
    },
    handler5 = () => {
      const error2 = run();
      ((el['hidden'] = !error2),
        (root['querySelector']('.canvas-shortcuts-no-selection')['hidden'] = !!error2));
      if (!error2) return;
      ((el['elements']['name']['value'] = error2['name']),
        (el['elements']['subtitle']['value'] = error2['subtitle'] || ''),
        (el['elements']['category']['value'] = error2['category'] || ''),
        (el['elements']['icon']['value'] = error2['icon']),
        (el['elements']['badge']['value'] = error2['badge']),
        (el['elements']['enabled']['checked'] = error2['enabled']),
        (el['elements']['action']['value'] =
          error2['action']['kind'] === 'graph' ? 'graph' : error2['action']['nodeType']),
        (el['elements']['coverFile']['value'] = ''));
      const count = args['items']['indexOf'](error2);
      ((root['querySelector']('[data-action="up"]')['disabled'] = count === 0),
        (root['querySelector']('[data-action="down"]')['disabled'] = count === args['items']['length'] - 1),
        (index['scrollTop'] = 0),
        handler3());
    },
    handler6 = () => {
      (handler4(), handler5());
    };
  return (
    el['addEventListener']('submit', (event) => event['preventDefault']()),
    el['addEventListener']('input', (event2) => {
      const enabled5 = run();
      if (!enabled5 || enabled2) return;
      const { name: name2, value: value2, checked: checked } = event2['target'];
      if (['name', 'subtitle', 'badge', 'icon']['includes'](name2)) enabled5[name2] = value2;
      if (name2 === 'category') {
        if (value2) enabled5['category'] = value2;
        else delete enabled5['category'];
      }
      if (name2 === 'enabled') enabled5['enabled'] = checked;
      if (name2 === 'action')
        enabled5['action'] =
          value2 === 'graph' ? { kind: 'graph', graph: null } : { kind: 'node', nodeType: value2 };
      handler3();
    }),
    el['addEventListener']('change', async (event3) => {
      handler4();
      if (event3['target']['name'] !== 'coverFile' || enabled2) return;
      const enabled6 = run(),
        enabled7 = event3['target']['files']?.[0];
      if (!enabled7 || !enabled6) return;
      try {
        if (!/^image\/(png|jpeg|webp)$/['test'](enabled7['type']) || enabled7['size'] > 1024 * 1024)
          throw new Error('请选择不超过 1 MB 的 PNG、JPEG 或 WebP 图片');
        const source = await new Promise((handler7, handler8) => {
          const fileReader = new FileReader();
          ((fileReader['onload'] = () => handler7(fileReader['result'])),
            (fileReader['onerror'] = () => handler8(new Error('封面读取失败'))),
            fileReader['readAsDataURL'](enabled7));
        });
        if (enabled || enabled2 || run() !== enabled6) return;
        ((enabled6['cover'] = source), handler3(), handler2(''));
      } catch (error3) {
        handler2(error3['message']);
      }
    }),
    root['addEventListener']('click', async (event4) => {
      event4['stopPropagation']();
      if (enabled2) return;
      const el5 = event4['target']['closest']('[data-edit-shortcut-id]');
      if (el5) {
        ((item = el5['dataset']['editShortcutId']), handler6(), el['elements']['name']['focus']());
        return;
      }
      const enabled8 = event4['target']['closest']('[data-action]')?.['dataset']['action'];
      if (!enabled8) return;
      if (!canManageCanvasShortcuts()) {
        onClose();
        return;
      }
      try {
        handler2('');
        if (enabled8 === 'close') {
          onClose();
          return;
        }
        if (enabled8 === 'add') {
          if (args['items']['length'] >= 64) throw new Error('快捷方式最多 64 项');
          const draftItem2 = createDraftItem();
          (args['items']['push'](draftItem2), (item = draftItem2['id']));
        } else {
          if (enabled8 === 'defaults')
            ((args['items'] = createDefaultShortcutCatalog()['items']), (item = args['items'][0]['id']));
          else {
            if (enabled8 === 'capture' && run())
              run()['action'] = { kind: 'graph', graph: captureShortcutGraph(canvasStore) };
            else {
              if (enabled8 === 'clear-cover' && run()) run()['cover'] = '';
              else {
                if (enabled8 === 'remove') {
                  const count2 = args['items']['findIndex']((next) => next['id'] === item);
                  if (count2 >= 0) args['items']['splice'](count2, 1);
                  item = args['items'][Math['min'](count2, args['items']['length'] - 1)]?.['id'] || '';
                } else {
                  if (['up', 'down']['includes'](enabled8)) {
                    const count3 = args['items']['findIndex']((current) => current['id'] === item),
                      count4 = count3 + (enabled8 === 'up' ? -1 : 1);
                    if (count3 >= 0 && count4 >= 0 && count4 < args['items']['length'])
                      [args['items'][count3], args['items'][count4]] = [
                        args['items'][count4],
                        args['items'][count3],
                      ];
                  } else {
                    if (enabled8 === 'save') {
                      if (!el['hidden'] && !el['reportValidity']()) return;
                      ((enabled2 = true),
                        root['setAttribute']('aria-busy', 'true'),
                        el2['focus'](),
                        root['querySelectorAll']('button, input, select')['forEach']((el6) => {
                          el6['disabled'] = true;
                        }),
                        handler2('正在保存…'));
                      try {
                        (await catalogStore['save'](args, value['revision']), (enabled2 = false), onClose());
                      } finally {
                        ((enabled2 = false),
                          root['removeAttribute']('aria-busy'),
                          root['querySelectorAll']('button, input, select')['forEach']((el7) => {
                            el7['disabled'] = false;
                          }));
                        if (!enabled) root['querySelector']('[data-action="save"]')['focus']();
                      }
                      return;
                    }
                  }
                }
              }
            }
          }
        }
        handler6();
        if (el['hidden']) root['querySelector']('[data-action="add"]')['focus']();
      } catch (error4) {
        if (!enabled) handler2(error4['message'] || '保存失败，请重试');
      }
    }),
    root['addEventListener']('dblclick', (event5) => event5['stopPropagation']()),
    window['addEventListener']('dev-mode-changed', options),
    window['addEventListener']('aicanvas:runtime-info', options),
    handler6(),
    (handler = beginModalInteraction({
      root: root,
      onClose: onClose,
      returnFocus: returnFocus,
      preferredSelector: 'input[name="name"]',
    })),
    root
  );
}
