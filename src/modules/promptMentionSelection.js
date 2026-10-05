import { matchPromptMentions } from './promptMentionMatcher.js';
export function deletePromptMention(controller, pill, selection, key, onDeleted) {
  const doc = controller['promptEl']['ownerDocument'];
  if (!doc?.['execCommand']) {
    if (selection['collapsed'] && selection['startContainer']['nodeType'] === 3) {
      const textNode = selection['startContainer'];
      textNode['textContent'] =
        key === 'Backspace'
          ? textNode['textContent']['slice'](selection['startOffset'])
          : textNode['textContent']['slice'](0, selection['startOffset']);
    }
    (pill['remove'](), onDeleted(controller));
    return;
  }
  const windowSelection = doc['defaultView']['getSelection'](),
    originalRange = selection['cloneRange'](),
    range = doc['createRange']();
  range['selectNode'](pill);
  if (selection['collapsed']) {
    if (key === 'Backspace') range['setEnd'](selection['startContainer'], selection['startOffset']);
    else range['setStart'](selection['startContainer'], selection['startOffset']);
  }
  (windowSelection['removeAllRanges'](), windowSelection['addRange'](range));
  let removed = false;
  try {
    removed = doc['execCommand']('delete', false);
  } catch {}
  if (removed) onDeleted(controller);
  else (windowSelection['removeAllRanges'](), windowSelection['addRange'](originalRange));
}
function cloneTarget(container, cloneRoot, startElement) {
  const path = [];
  for (let element = startElement; element && element !== container; element = element['parentNode']) {
    if (!element['parentNode']) return null;
    path['unshift'](Array['prototype']['indexOf']['call'](element['parentNode']['childNodes'], element));
  }
  return path['reduce']((node, index) => node?.['childNodes'][index], cloneRoot);
}
export function insertSelectedPromptMention(controller, mention, options, pillApi) {
  const promptEl = controller?.['promptEl'],
    doc = promptEl?.['ownerDocument'];
  if (!doc?.['execCommand'] || !doc['createTreeWalker'] || mention['pillKind']) return null;
  const windowSelection = doc['defaultView']['getSelection'](),
    triggerRange =
      options['triggerRange'] || (windowSelection['rangeCount'] ? windowSelection['getRangeAt'](0) : null),
    pillToEdit = options['pillToEdit'];
  if (!pillToEdit && (!triggerRange || !promptEl['contains'](triggerRange['startContainer']))) return false;
  const clone = promptEl['cloneNode'](true),
    pill = pillApi['createPill'](mention, controller);
  if (pillToEdit) {
    if (!promptEl['contains'](pillToEdit)) return false;
    cloneTarget(promptEl, clone, pillToEdit)['replaceWith'](pill);
  } else {
    if (triggerRange['startContainer']['nodeType'] !== 3) return false;
    const textNode = cloneTarget(promptEl, clone, triggerRange['startContainer']),
      caretOffset = triggerRange['startOffset'],
      atIndex =
        options['atIndex'] >= 0
          ? options['atIndex']
          : Math['max'](
              textNode['textContent']['lastIndexOf']('@', caretOffset - 1),
              textNode['textContent']['lastIndexOf']('＠', caretOffset - 1),
            );
    if (atIndex < 0) return false;
    const range = doc['createRange']();
    (range['setStart'](textNode, atIndex),
      range['setEnd'](textNode, caretOffset),
      range['deleteContents'](),
      range['insertNode'](pill));
  }
  const mentionWithoutLabel = { ...mention, refLabel: '', assetName: '' },
    walker = doc['createTreeWalker'](clone, 4),
    targets = [];
  let textNode;
  while ((textNode = walker['nextNode']())) {
    if (textNode['parentElement']?.['closest']('.ref-pill, [contenteditable="false"]')) continue;
    const matches = matchPromptMentions(textNode['textContent'], [mentionWithoutLabel])['filter'](
      (match) => match['candidates']['length'] === 1,
    );
    if (matches['length']) targets['push']({ node: textNode, matches: matches });
  }
  if (options['requireOtherMatches'] && !targets['length']) return null;
  for (const { node: node, matches: nodeMatches } of targets) {
    for (const match of nodeMatches['reverse']()) {
      const range = doc['createRange']();
      (range['setStart'](node, match['start']),
        range['setEnd'](node, match['end']),
        range['deleteContents'](),
        range['insertNode'](pill['cloneNode'](true)));
    }
  }
  const pillIndex = [...clone['querySelectorAll']('.ref-pill')]['indexOf'](pill),
    scrollTop = promptEl['scrollTop'],
    scrollLeft = promptEl['scrollLeft'],
    savedRange = windowSelection['rangeCount'] ? windowSelection['getRangeAt'](0)['cloneRange']() : null;
  promptEl['focus']({ preventScroll: true });
  const range = doc['createRange']();
  (range['selectNodeContents'](promptEl),
    windowSelection['removeAllRanges'](),
    windowSelection['addRange'](range));
  let inserted = false;
  try {
    inserted = doc['execCommand']('insertHTML', false, clone['innerHTML']);
  } catch {}
  if (!inserted) {
    windowSelection['removeAllRanges']();
    if (savedRange) windowSelection['addRange'](savedRange);
    return false;
  }
  pillApi['hydrate'](controller);
  const insertedPill = promptEl['querySelectorAll']('.ref-pill')[pillIndex];
  if (insertedPill) {
    const range = doc['createRange']();
    (range['setStartAfter'](insertedPill),
      range['collapse'](true),
      windowSelection['removeAllRanges'](),
      windowSelection['addRange'](range));
  }
  return (
    pillApi['commit'](controller),
    (promptEl['scrollTop'] = scrollTop),
    (promptEl['scrollLeft'] = scrollLeft),
    true
  );
}
