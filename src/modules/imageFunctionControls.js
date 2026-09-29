import {
  bindAIGenImageModelSelector,
  renderAIGenImageModelSelectorMarkup,
} from '../components/aigenImage/modelSelector.js';
import {
  buildModelProviderProfileBadgesHtml,
  createModelProviderProfileControl,
} from '../components/shared/modelProviderProfileControl.js';
import { getModelManifest, sanitizeModelUiSchemaParams } from '../manifests/index.js';
import { buildImageFunctionModelCatalog } from './imageFunctionModelMenu.js';
const EXCLUDED_FIELDS = ['aspectRatio', 'batchSize'];
export function buildImageFunctionMenuGroups(_0x2ac48c = buildImageFunctionModelCatalog()) {
  return Object['entries'](_0x2ac48c)['map'](([_0x3eb1bc, _0x264526]) => ({
    id: 'image-function-' + _0x3eb1bc,
    label: _0x264526['name'],
    subtitle: _0x264526['description'],
    icon: _0x264526['isTextIcon'] ? '' : _0x264526['icon'],
    iconHtml: _0x264526['iconHtml'],
    items: _0x264526['models']['map']((_0x4c9148) => {
      const _0x4308f7 = getModelManifest(_0x4c9148['id']),
        _0x1553b7 = _0x4308f7['extensions']?.['imageMenu'] || {};
      return {
        modelId: _0x4c9148['id'],
        provider: _0x4308f7['provider'],
        label: _0x1553b7['title'] || _0x4308f7['displayName'],
        priceText: _0x1553b7['priceText'],
        description: _0x1553b7['subtitle'] || _0x4308f7['description'],
        icon: _0x4c9148['isTextIcon'] ? '' : _0x4c9148['icon'],
        iconHtml:
          _0x264526['modelIconStrategy'] === 'provider' ? _0x264526['iconHtml'] : _0x4c9148['iconHtml'],
        badgeHtml: buildModelProviderProfileBadgesHtml(_0x4308f7, { vip: _0x4308f7['vip'] === !![] }),
      };
    }),
  }));
}
export function getImageFunctionSelection(_0x121389, _0x102174 = {}, _0x4aaa5d = '1K') {
  const _0xb25b4d = getModelManifest(_0x121389);
  return {
    modelId: _0x121389,
    provider: _0xb25b4d['provider'],
    generationParams: sanitizeModelUiSchemaParams(_0x121389, {
      imageSize: _0x4aaa5d,
      ...(_0x102174['model'] === _0x121389 ? _0x102174['generationParams'] : {}),
    }),
    generationParamsByModel: _0x102174['generationParamsByModel'] || {},
    providerProfileId: _0x102174['model'] === _0x121389 ? _0x102174['providerProfileId'] || '' : '',
    providerProfileIdByModel: _0x102174['providerProfileIdByModel'] || {},
  };
}
export function getImageFunctionRequestSettings(_0x458a12) {
  const _0x25de99 = { ..._0x458a12['generationParams'] };
  return (
    delete _0x25de99['aspectRatio'],
    delete _0x25de99['batchSize'],
    {
      generationParams: _0x25de99,
      providerProfileId: _0x458a12['providerProfileId'] || '',
      ...(_0x25de99['imageSize'] ? { imageSize: _0x25de99['imageSize'] } : {}),
    }
  );
}
export function renderImageFunctionControls(_0x1d19b7, _0x18d4aa) {
  return renderAIGenImageModelSelectorMarkup({
    ..._0x1d19b7,
    showSchemaControls: !![],
    showCaret: !![],
    excludeFieldIds: EXCLUDED_FIELDS,
    modelMenuGroups: buildImageFunctionMenuGroups(_0x18d4aa),
    className: 'image-function-controls canvas-function-controls',
  });
}
export function bindImageFunctionControls(
  _0x4e0d8b,
  { selection: _0x185fec, onChange: _0x27f00f, onBeforeOpen: _0x18d86d, onResize: _0x1842a3 } = {},
) {
  const _0x2362b3 = document['createElement']('div');
  ((_0x2362b3['className'] = 'image-function-menu-host'), document['body']['append'](_0x2362b3));
  let _0x7cc4d8 = _0x185fec,
    _0x3ae2ab;
  const _0x814184 = bindAIGenImageModelSelector(_0x4e0d8b, {
      ..._0x185fec,
      showSchemaControls: !![],
      excludeFieldIds: EXCLUDED_FIELDS,
      floatingMenuHost: _0x2362b3,
      modelSubmenuPlacement: 'viewport-auto-up',
      schemaPopupPlacement: 'portal-auto-up',
      onChange(_0x31ca61) {
        ((_0x7cc4d8 = _0x31ca61), _0x3ae2ab?.['sync'](), _0x27f00f?.(_0x31ca61), _0x1842a3?.());
      },
    }),
    _0x486d2a = _0x4e0d8b['querySelector']('.image-function-controls');
  _0x3ae2ab = createModelProviderProfileControl({
    panel: _0x486d2a['querySelector']('.img-model-wrap'),
    getNodeData: () => ({ ..._0x7cc4d8, model: _0x7cc4d8['modelId'] }),
    onChange: (_0x567cf8) => _0x814184['applyProviderProfilePatch'](_0x567cf8),
  });
  const _0x25c1ed = () => _0x18d86d?.();
  (_0x486d2a['addEventListener']('ui-schema-menu-before-open', _0x25c1ed),
    _0x486d2a['querySelector']('.img-model-btn-trigger')['addEventListener']('click', _0x25c1ed));
  const _0x11e473 = new ResizeObserver(() => _0x1842a3?.());
  _0x11e473['observe'](_0x486d2a);
  const _0x2ef205 = () => _0x1842a3?.();
  return (
    window['addEventListener']('resize', _0x2ef205),
    {
      containsMenuTarget(_0x358425) {
        return _0x2362b3['contains'](_0x358425);
      },
      closeMenus() {
        _0x814184['closeMenus']();
      },
      destroy() {
        (_0x11e473['disconnect'](),
          window['removeEventListener']('resize', _0x2ef205),
          _0x3ae2ab?.['remove'](),
          _0x814184['destroy'](),
          _0x486d2a['removeEventListener']('ui-schema-menu-before-open', _0x25c1ed),
          _0x486d2a['querySelector']('.img-model-btn-trigger')['removeEventListener']('click', _0x25c1ed),
          _0x2362b3['remove']());
      },
    }
  );
}
