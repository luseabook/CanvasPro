const mounted = new WeakSet(),
  gapPattern = /\[听不清\]|【听不清】|\[无法听清\]/gu;
function decorateGaps(value) {
  const el = value.ownerDocument,
    item = el.createTreeWalker(value, 4),
    list = [];
  while (item.nextNode()) list.push(item.currentNode);
  for (const key of list) {
    if (key.parentElement?.closest('.ref-pill, .story-speech-gap, input, textarea')) continue;
    const list2 = key.nodeValue || '',
      list3 = [...list2.matchAll(gapPattern)];
    if (!list3.length) continue;
    const index = el.createDocumentFragment();
    let result = 0;
    for (const data of list3) {
      index.append(el.createTextNode(list2.slice(result, data.index)));
      const el2 = el.createElement('span');
      ((el2.className = 'story-speech-gap'),
        (el2.contentEditable = 'false'),
        (el2.tabIndex = 0),
        el2.setAttribute('role', 'button'),
        el2.setAttribute('aria-label', '听不清，点击后输入台词'),
        el2.setAttribute('data-tooltip', '点击后直接输入台词，替换听不清的部分'),
        (el2.textContent = data[0]),
        index.append(el2),
        (result = data.index + data[0].length));
    }
    (index.append(el.createTextNode(list2.slice(result))), key.replaceWith(index));
  }
}
export function mountStorySpeechGapEditor(el3) {
  if (!el3) return;
  queueMicrotask(() => {
    if (el3.isConnected) decorateGaps(el3);
  });
  if (mounted.has(el3)) return;
  mounted.add(el3);
  const options = (event) => {
    if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
    const enabled = event.target?.closest?.('.story-speech-gap');
    if (!enabled || !el3.contains(enabled) || el3.getAttribute('contenteditable') !== 'true') return;
    (event.preventDefault(), event.stopPropagation(), el3.focus());
    const target = el3.ownerDocument.createRange();
    target.selectNode(enabled);
    const source = el3.ownerDocument.getSelection();
    (source.removeAllRanges(), source.addRange(target));
  };
  (el3.addEventListener('click', options, true), el3.addEventListener('keydown', options, true));
}
