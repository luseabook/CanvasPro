import { reconcileElementTree } from './personReplacementShotSelectionRendering.js';

export function syncPersonReplacementAssetSelection(root, html, { targetRail = false } = {}) {
  const ownerDocument = root?.ownerDocument;
  if (!ownerDocument?.createElement) return false;

  const template = ownerDocument.createElement('template');
  template.innerHTML = html;
  const selectors = targetRail
    ? ['.person-replacement-target-assets']
    : ['.story-assets-callout', '.story-asset-grid'];
  const pairs = selectors.map((selector) => [
    root.querySelector(selector),
    template.content.querySelector(selector),
  ]);

  if (pairs.some(([currentNode, nextNode]) => !currentNode || !nextNode)) return false;

  for (const [currentNode, nextNode] of pairs) {
    reconcileElementTree(currentNode, nextNode, { preserveChildNodes: true });
  }
  return true;
}
