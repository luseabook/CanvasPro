function nodeKey(el) {
  if (el.nodeType === 3 && !el.nodeValue.trim()) {
    let enabled = el.nextSibling;
    while (enabled?.nodeType === 3 && !enabled.nodeValue.trim()) enabled = enabled.nextSibling;
    return 'space:' + (enabled ? nodeKey(enabled) : 'end');
  }
  if (el.nodeType !== 1) return String(el.nodeType);
  if (el.matches('.story-asset-card-shell')) {
    const el2 = el.querySelector(':scope > [data-story-asset-id]');
    if (el2) return el.tagName + ':shell:' + el2.dataset.storyAssetId;
  }
  const value = el.dataset || {},
    item =
      value.personReplacementShotCard === 'true'
        ? value.shotId
        : value.personReplacementImportSource ||
          value.storyAssetId ||
          value.personReplacementVideoReferenceKey ||
          value.slot,
    key = value.personReplacementAction || value.storyAction,
    index = item
      ? 'item:' + item
      : key
        ? 'action:' + key + ':' + (value.characterId || value.sourceId || value.shotId || '')
        : el.id ||
          String(el.getAttribute('class') || '')
            .split(/\s+/)
            .find((enabled2) => enabled2 && !enabled2.startsWith('is-')) ||
          '';
  return el.tagName + ':' + index;
}
export function reconcilePersonReplacementStableDom(
  result,
  data,
  { preserveSelector: preserveSelector = '', syncAttributes: syncAttributes, syncImage: syncImage } = {},
) {
  const run = (el3, args) => {
    if (preserveSelector && el3.matches?.(preserveSelector) && args.matches?.(preserveSelector)) return;
    if (el3.nodeType !== 1) {
      if (el3.nodeValue !== args.nodeValue) el3.nodeValue = args.nodeValue;
      return;
    }
    if (el3.tagName === 'IMG') {
      syncImage(el3, args);
      return;
    }
    syncAttributes(el3, args);
    const map = new Set(el3.childNodes),
      options = [...args.childNodes].map((child) => {
        const nodeKey2 = nodeKey(child),
          match = [...map].find((target) => nodeKey(target) === nodeKey2);
        if (match) map.delete(match);
        return { child: child, match: match };
      });
    for (const el4 of map) el4.remove();
    let source = el3.firstChild;
    for (const { child: child2, match: match2 } of options) {
      if (match2) {
        run(match2, child2);
        if (match2 !== source) el3.insertBefore(match2, source);
        source = match2.nextSibling;
      } else el3.insertBefore(child2, source);
    }
  };
  return (run(result, data), true);
}
