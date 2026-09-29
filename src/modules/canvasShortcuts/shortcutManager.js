import { beginModalInteraction } from '../../services/modalInteractionScope.js';
import { generateId } from '../../core/math.js';
import { canManageCanvasShortcuts, createDefaultShortcutCatalog } from './shortcutCatalog.js';
import { captureShortcutGraph } from './shortcutGraph.js';
import { createShortcutCard, element } from './shortcutPresentation.js';
function createDraftItem(_0x559e17 = null) {
  return {
    id: generateId('shortcut'),
    name: _0x559e17 ? '新模板' : '新快捷方式',
    icon: 'template',
    subtitle: '',
    badge: '',
    cover: '',
    enabled: !![],
    action: _0x559e17
      ? { kind: 'graph', graph: structuredClone(_0x559e17) }
      : { kind: 'node', nodeType: 'ai-image' },
  };
}
export function openShortcutManager({
  catalogStore: _0x3104fa,
  canvasStore: _0x35ae40,
  returnFocus: _0x579662,
  initialGraph: initialGraph = null,
}) {
  if (!canManageCanvasShortcuts()) return null;
  const _0x4b417e = _0x3104fa['getState'](),
    _0x4fc7c3 = structuredClone(_0x4b417e['catalog']);
  let _0x4015f1 = _0x4fc7c3['items'][0x0]?.['id'] || '';
  if (initialGraph) {
    if (_0x4fc7c3['items']['length'] >= 0x40) throw new Error('快捷方式最多 64 项');
    const _0x4d9358 = createDraftItem(initialGraph);
    (_0x4fc7c3['items']['push'](_0x4d9358), (_0x4015f1 = _0x4d9358['id']));
  }
  let _0x116218 = ![],
    _0x989d27 = ![],
    _0x9202f1 = () => {};
  const _0x402da7 = element('div', 'canvas-shortcuts-overlay');
  ((_0x402da7['id'] = 'canvasShortcutsManager'),
    (_0x402da7['innerHTML'] =
      '<section class="canvas-shortcuts-dialog" role="dialog" aria-modal="true" aria-labelledby="canvasShortcutsTitle">\n    <header><h2 id="canvasShortcutsTitle">空白画布快捷方式</h2><button type="button" data-action="close" aria-label="关闭管理界面">关闭</button></header>\n    <div class="canvas-shortcuts-manager-body">\n      <aside class="canvas-shortcuts-sidebar"><div class="canvas-shortcuts-tools"><button type="button" data-action="add">新增</button><button type="button" data-action="defaults">恢复默认</button></div><div class="canvas-shortcuts-list" role="list" aria-label="快捷方式列表"></div></aside>\n      <div class="canvas-shortcuts-editor">\n        <p class="canvas-shortcuts-no-selection">点击“新增”创建快捷方式</p>\n        <form class="canvas-shortcuts-form" hidden>\n          <label>名称<input name="name" maxlength="50" required autocomplete="off"></label>\n          <label>副标题（可选）<input name="subtitle" maxlength="80" autocomplete="off" placeholder="鼠标悬停时显示的说明"></label>\n          <label>模板分类<select name="category"><option value="">自动按节点类型</option><option value="text">文本生成</option><option value="image">图片生成</option><option value="video">视频生成</option><option value="audio">音频生成</option></select></label>\n          <div class="canvas-shortcuts-fields"><label>图标<select name="icon"><option value="text">文本</option><option value="image">图片</option><option value="video">视频</option><option value="audio">音频</option><option value="template">模板</option></select></label><label>角标（可选）<input name="badge" maxlength="24" autocomplete="off" placeholder="例如 SD 2.5"></label></div>\n          <label>封面图片（可选）<input name="coverFile" type="file" accept="image/png,image/jpeg,image/webp"></label>\n          <button type="button" data-action="clear-cover">移除封面</button>\n          <label>点击后添加<select name="action"><option value="ai-text">文本生成节点</option><option value="ai-image">图片生成节点</option><option value="ai-video">视频生成节点</option><option value="ai-audio">音频生成节点</option><option value="graph">选中节点模板</option></select></label>\n          <div class="canvas-shortcuts-graph" hidden><button type="button" data-action="capture">使用画布选中节点</button><p class="canvas-shortcuts-graph-info"></p><p>保存素材、参数和内部连线；插入后由用户点击生成。</p></div>\n          <label class="canvas-shortcuts-checkbox"><input name="enabled" type="checkbox">在空白画布显示</label>\n          <div class="canvas-shortcuts-tools"><button type="button" data-action="up">上移</button><button type="button" data-action="down">下移</button><button type="button" data-action="remove">删除此项</button></div>\n          <p>卡片预览</p><div class="canvas-shortcuts-preview v2-node-menu-compact"></div>\n        </form>\n      </div>\n    </div>\n    <footer><span class="canvas-shortcuts-status" role="status" aria-live="polite"></span><button type="button" data-action="close">取消</button><button type="button" data-action="save">保存并应用</button></footer>\n  </section>'),
    document['body']['append'](_0x402da7));
  const _0x24809a = _0x402da7['querySelector']('form'),
    _0x1c58ff = _0x402da7['querySelector']('.canvas-shortcuts-list'),
    _0x5e993c = _0x402da7['querySelector']('.canvas-shortcuts-editor'),
    _0x17503d = _0x402da7['querySelector']('.canvas-shortcuts-status');
  _0x17503d['tabIndex'] = -0x1;
  const _0x19152c = () => _0x4fc7c3['items']['find']((_0x214fda) => _0x214fda['id'] === _0x4015f1),
    _0x3645e1 = (_0x7ff85b) => {
      _0x17503d['textContent'] = _0x7ff85b;
    },
    _0x3db215 = () => {
      if (_0x989d27) return;
      ((_0x116218 = !![]),
        window['removeEventListener']('dev-mode-changed', _0x23d151),
        window['removeEventListener']('aicanvas:runtime-info', _0x23d151),
        _0x9202f1(),
        _0x402da7['remove']());
    },
    _0x23d151 = () => {
      !canManageCanvasShortcuts() && ((_0x989d27 = ![]), _0x3db215());
    },
    _0x149bf3 = () => {
      const _0x5bcc9f = _0x19152c();
      if (!_0x5bcc9f) return;
      _0x402da7['querySelector']('.canvas-shortcuts-preview')['replaceChildren'](
        createShortcutCard(_0x5bcc9f, { preview: !![] }),
      );
      const _0x121bb0 = _0x5bcc9f['action']['kind'] === 'graph';
      ((_0x402da7['querySelector']('.canvas-shortcuts-graph')['hidden'] = !_0x121bb0),
        (_0x402da7['querySelector']('.canvas-shortcuts-graph-info')['textContent'] =
          _0x121bb0 && _0x5bcc9f['action']['graph']
            ? _0x5bcc9f['action']['graph']['nodes']['length'] +
              ' 个节点 · ' +
              _0x5bcc9f['action']['graph']['edges']['length'] +
              ' 条连线'
            : '尚未保存节点，请先在画布中选中内容。'));
    },
    _0x1d6df5 = () => {
      const _0x4b5a78 = _0x1c58ff['scrollTop'];
      (_0x1c58ff['replaceChildren'](
        ..._0x4fc7c3['items']['map']((_0x5f0188) => {
          const _0x9c8e03 = element('div', 'canvas-shortcuts-list-row');
          _0x9c8e03['setAttribute']('role', 'listitem');
          const _0x592af3 = element(
            'button',
            _0x5f0188['id'] === _0x4015f1 ? 'is-selected' : '',
            '' + (_0x5f0188['name'] || '未命名') + (_0x5f0188['enabled'] ? '' : ' · 已隐藏'),
          );
          return (
            (_0x592af3['type'] = 'button'),
            (_0x592af3['dataset']['editShortcutId'] = _0x5f0188['id']),
            _0x592af3['setAttribute']('aria-pressed', String(_0x5f0188['id'] === _0x4015f1)),
            _0x9c8e03['append'](_0x592af3),
            _0x9c8e03
          );
        }),
      ),
        (_0x1c58ff['scrollTop'] = _0x4b5a78));
    },
    _0xee9d73 = () => {
      const _0x245ca8 = _0x19152c();
      ((_0x24809a['hidden'] = !_0x245ca8),
        (_0x402da7['querySelector']('.canvas-shortcuts-no-selection')['hidden'] = !!_0x245ca8));
      if (!_0x245ca8) return;
      ((_0x24809a['elements']['name']['value'] = _0x245ca8['name']),
        (_0x24809a['elements']['subtitle']['value'] = _0x245ca8['subtitle'] || ''),
        (_0x24809a['elements']['category']['value'] = _0x245ca8['category'] || ''),
        (_0x24809a['elements']['icon']['value'] = _0x245ca8['icon']),
        (_0x24809a['elements']['badge']['value'] = _0x245ca8['badge']),
        (_0x24809a['elements']['enabled']['checked'] = _0x245ca8['enabled']),
        (_0x24809a['elements']['action']['value'] =
          _0x245ca8['action']['kind'] === 'graph' ? 'graph' : _0x245ca8['action']['nodeType']),
        (_0x24809a['elements']['coverFile']['value'] = ''));
      const _0x3ad161 = _0x4fc7c3['items']['indexOf'](_0x245ca8);
      ((_0x402da7['querySelector']('[data-action="up"]')['disabled'] = _0x3ad161 === 0x0),
        (_0x402da7['querySelector']('[data-action="down"]')['disabled'] =
          _0x3ad161 === _0x4fc7c3['items']['length'] - 0x1),
        (_0x5e993c['scrollTop'] = 0x0),
        _0x149bf3());
    },
    _0x9e96f6 = () => {
      (_0x1d6df5(), _0xee9d73());
    };
  return (
    _0x24809a['addEventListener']('submit', (_0x539c0c) => _0x539c0c['preventDefault']()),
    _0x24809a['addEventListener']('input', (_0x1e50a9) => {
      const _0x483e17 = _0x19152c();
      if (!_0x483e17 || _0x989d27) return;
      const { name: _0x40b964, value: _0x12dc60, checked: _0x4bc93f } = _0x1e50a9['target'];
      if (['name', 'subtitle', 'badge', 'icon']['includes'](_0x40b964)) _0x483e17[_0x40b964] = _0x12dc60;
      if (_0x40b964 === 'category') {
        if (_0x12dc60) _0x483e17['category'] = _0x12dc60;
        else delete _0x483e17['category'];
      }
      if (_0x40b964 === 'enabled') _0x483e17['enabled'] = _0x4bc93f;
      if (_0x40b964 === 'action')
        _0x483e17['action'] =
          _0x12dc60 === 'graph' ? { kind: 'graph', graph: null } : { kind: 'node', nodeType: _0x12dc60 };
      _0x149bf3();
    }),
    _0x24809a['addEventListener']('change', async (_0x1ca067) => {
      _0x1d6df5();
      if (_0x1ca067['target']['name'] !== 'coverFile' || _0x989d27) return;
      const _0x4ebedf = _0x19152c(),
        _0x5d35c4 = _0x1ca067['target']['files']?.[0x0];
      if (!_0x5d35c4 || !_0x4ebedf) return;
      try {
        if (!/^image\/(png|jpeg|webp)$/['test'](_0x5d35c4['type']) || _0x5d35c4['size'] > 0x400 * 0x400)
          throw new Error('请选择不超过\x201\x20MB\x20的\x20PNG、JPEG\x20或\x20WebP\x20图片');
        const _0x14d982 = await new Promise((_0x55f768, _0x55b4cc) => {
          const _0x414dd3 = new FileReader();
          ((_0x414dd3['onload'] = () => _0x55f768(_0x414dd3['result'])),
            (_0x414dd3['onerror'] = () => _0x55b4cc(new Error('封面读取失败'))),
            _0x414dd3['readAsDataURL'](_0x5d35c4));
        });
        if (_0x116218 || _0x989d27 || _0x19152c() !== _0x4ebedf) return;
        ((_0x4ebedf['cover'] = _0x14d982), _0x149bf3(), _0x3645e1(''));
      } catch (_0x22c93b) {
        _0x3645e1(_0x22c93b['message']);
      }
    }),
    _0x402da7['addEventListener']('click', async (_0x4f01de) => {
      _0x4f01de['stopPropagation']();
      if (_0x989d27) return;
      const _0x3dae4c = _0x4f01de['target']['closest']('[data-edit-shortcut-id]');
      if (_0x3dae4c) {
        ((_0x4015f1 = _0x3dae4c['dataset']['editShortcutId']),
          _0x9e96f6(),
          _0x24809a['elements']['name']['focus']());
        return;
      }
      const _0x20c93d = _0x4f01de['target']['closest']('[data-action]')?.['dataset']['action'];
      if (!_0x20c93d) return;
      if (!canManageCanvasShortcuts()) {
        _0x3db215();
        return;
      }
      try {
        _0x3645e1('');
        if (_0x20c93d === 'close') {
          _0x3db215();
          return;
        }
        if (_0x20c93d === 'add') {
          if (_0x4fc7c3['items']['length'] >= 0x40) throw new Error('快捷方式最多\x2064\x20项');
          const _0x334a17 = createDraftItem();
          (_0x4fc7c3['items']['push'](_0x334a17), (_0x4015f1 = _0x334a17['id']));
        } else {
          if (_0x20c93d === 'defaults')
            ((_0x4fc7c3['items'] = createDefaultShortcutCatalog()['items']),
              (_0x4015f1 = _0x4fc7c3['items'][0x0]['id']));
          else {
            if (_0x20c93d === 'capture' && _0x19152c())
              _0x19152c()['action'] = { kind: 'graph', graph: captureShortcutGraph(_0x35ae40) };
            else {
              if (_0x20c93d === 'clear-cover' && _0x19152c()) _0x19152c()['cover'] = '';
              else {
                if (_0x20c93d === 'remove') {
                  const _0x3cfa26 = _0x4fc7c3['items']['findIndex'](
                    (_0x5559f1) => _0x5559f1['id'] === _0x4015f1,
                  );
                  if (_0x3cfa26 >= 0x0) _0x4fc7c3['items']['splice'](_0x3cfa26, 0x1);
                  _0x4015f1 =
                    _0x4fc7c3['items'][Math['min'](_0x3cfa26, _0x4fc7c3['items']['length'] - 0x1)]?.['id'] ||
                    '';
                } else {
                  if (['up', 'down']['includes'](_0x20c93d)) {
                    const _0x3fa154 = _0x4fc7c3['items']['findIndex'](
                        (_0x354aa5) => _0x354aa5['id'] === _0x4015f1,
                      ),
                      _0x4da099 = _0x3fa154 + (_0x20c93d === 'up' ? -0x1 : 0x1);
                    if (_0x3fa154 >= 0x0 && _0x4da099 >= 0x0 && _0x4da099 < _0x4fc7c3['items']['length'])
                      [_0x4fc7c3['items'][_0x3fa154], _0x4fc7c3['items'][_0x4da099]] = [
                        _0x4fc7c3['items'][_0x4da099],
                        _0x4fc7c3['items'][_0x3fa154],
                      ];
                  } else {
                    if (_0x20c93d === 'save') {
                      if (!_0x24809a['hidden'] && !_0x24809a['reportValidity']()) return;
                      ((_0x989d27 = !![]),
                        _0x402da7['setAttribute']('aria-busy', 'true'),
                        _0x17503d['focus'](),
                        _0x402da7['querySelectorAll']('button, input, select')['forEach']((_0x2f356d) => {
                          _0x2f356d['disabled'] = !![];
                        }),
                        _0x3645e1('正在保存…'));
                      try {
                        (await _0x3104fa['save'](_0x4fc7c3, _0x4b417e['revision']),
                          (_0x989d27 = ![]),
                          _0x3db215());
                      } finally {
                        ((_0x989d27 = ![]),
                          _0x402da7['removeAttribute']('aria-busy'),
                          _0x402da7['querySelectorAll']('button, input, select')['forEach']((_0x56b286) => {
                            _0x56b286['disabled'] = ![];
                          }));
                        if (!_0x116218) _0x402da7['querySelector']('[data-action="save"]')['focus']();
                      }
                      return;
                    }
                  }
                }
              }
            }
          }
        }
        _0x9e96f6();
        if (_0x24809a['hidden']) _0x402da7['querySelector']('[data-action="add"]')['focus']();
      } catch (_0x3ffb1b) {
        if (!_0x116218) _0x3645e1(_0x3ffb1b['message'] || '保存失败，请重试');
      }
    }),
    _0x402da7['addEventListener']('dblclick', (_0x20891d) => _0x20891d['stopPropagation']()),
    window['addEventListener']('dev-mode-changed', _0x23d151),
    window['addEventListener']('aicanvas:runtime-info', _0x23d151),
    _0x9e96f6(),
    (_0x9202f1 = beginModalInteraction({
      root: _0x402da7,
      onClose: _0x3db215,
      returnFocus: _0x579662,
      preferredSelector: 'input[name="name"]',
    })),
    _0x402da7
  );
}
