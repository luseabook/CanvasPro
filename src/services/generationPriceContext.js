import { resolveModelPricingContext } from '../../api/modelPricingApi.js';
import { getAssetInputRefsFromNodeData } from '../modules/promptAssetInputRefs.js';
import { resolveModelPricingInputs } from './modelPricingInputs.js';
export function resolveGenerationPriceContext(_0x216566, { edges: edges = [], nodes: nodes = {} } = {}) {
  const _0x1d39e4 = resolveModelPricingContext(_0x216566);
  if (!_0x1d39e4) return null;
  return (
    (_0x1d39e4['hasReferences'] =
      _0x216566['hasReferences'] === !![] ||
      edges['length'] > 0x0 ||
      _0x216566['hasInputImages'] === !![] ||
      getAssetInputRefsFromNodeData(_0x216566)['length'] > 0x0 ||
      [
        _0x216566['inputUrls'],
        _0x216566['image_urls'],
        _0x216566['inputImageUrls'],
        _0x216566['referenceImageUrls'],
        _0x216566['videoUrls'],
        _0x216566['audioUrls'],
        _0x216566['imageRefs'],
        _0x216566['videoRefs'],
        _0x216566['audioRefs'],
      ]['some']((_0x1eda01) => _0x1eda01?.['length'] > 0x0)),
    _0x1d39e4['persist'] === ![] &&
      ((_0x1d39e4['references'] = resolveModelPricingInputs(_0x216566, edges, nodes)),
      (_0x1d39e4['key'] +=
        '|references:' +
        JSON['stringify'](_0x1d39e4['references']) +
        '|hasReferences:' +
        _0x1d39e4['hasReferences'])),
    _0x1d39e4
  );
}
