import { resolveModelPricingContext } from '../../api/modelPricingApi.js';
import { getAssetInputRefsFromNodeData } from '../modules/promptAssetInputRefs.js';
import { resolveModelPricingInputs } from './modelPricingInputs.js';
export function resolveGenerationPriceContext(value, { edges: edges = [], nodes: nodes = {} } = {}) {
  const event = resolveModelPricingContext(value);
  if (!event) return null;
  return (
    (event.hasReferences =
      value.hasReferences === true ||
      edges.length > 0 ||
      value.hasInputImages === true ||
      getAssetInputRefsFromNodeData(value).length > 0 ||
      [
        value.inputUrls,
        value.image_urls,
        value.inputImageUrls,
        value.referenceImageUrls,
        value.videoUrls,
        value.audioUrls,
        value.imageRefs,
        value.videoRefs,
        value.audioRefs,
      ].some((list) => list?.length > 0)),
    event.persist === false &&
      ((event.references = resolveModelPricingInputs(value, edges, nodes)),
      (event.key +=
        '|references:' +
        JSON.stringify(event.references) +
        '|hasReferences:' +
        event.hasReferences)),
    event
  );
}
