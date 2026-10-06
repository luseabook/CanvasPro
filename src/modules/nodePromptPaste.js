import { sanitizePromptHtml } from '../utils/dom.js';
import { insertPlainTextAtSelection } from '../utils/editableText.js';
import { insertVirtualizedPromptTextAtSelection } from './promptPasteVirtualization.js';
import { matchPromptMentions } from './promptMentionMatcher.js';
import { t } from '../i18n/index.js';
function insertHtml(value) {
  try {
    return globalThis.document?.execCommand?.('insertHTML', false, value) === true;
  } catch {
    return false;
  }
}
function escapeText(item) {
  return item.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r\n?/g, '\n');
}
function prepareMentions(args, list, key) {
  if (!/[@＠]/.test(list)) return null;
  const list2 = matchPromptMentions(list, key.candidates(args));
  if (!list2.length) return null;
  const enabled = globalThis.window?.getSelection?.()?.rangeCount
      ? window.getSelection().getRangeAt(0)
      : null,
    promptEl = args.promptEl.cloneNode(true),
    list3 = [...args.promptEl.querySelectorAll('.ref-pill')],
    index = [...promptEl.querySelectorAll('.ref-pill')];
  list3.forEach((result, data) => {
    if (enabled && !enabled.collapsed && enabled.intersectsNode(result)) index[data].remove();
  });
  const options = Object.assign(Object.create(args), { promptEl: promptEl }),
    html = [],
    map = new Map(),
    issues = new Map(),
    list4 = [];
  let target = 0;
  for (const error of list2) {
    list4.push(escapeText(list.slice(target, error.start)));
    const enabled2 = error.candidates.length === 1 ? error.candidates[0] : null;
    if (enabled2 && !map.has(enabled2)) {
      const reason = key.limit(options, [...html, enabled2]);
      map.set(enabled2, {
        reason: reason,
        html: reason ? '' : key.createPill(enabled2, args).outerHTML,
      });
      if (!reason) html.push(enabled2);
    }
    const source = !enabled2
      ? t(
          'nodePromptShared.' +
            (error.candidates.length ? 'autoMentionAmbiguous' : 'autoMentionMissing'),
        )
      : map.get(enabled2).reason;
    (source
      ? (list4.push(escapeText(list.slice(error.start, error.end))),
        issues.set(error.name, source))
      : list4.push(map.get(enabled2).html),
      (target = error.end));
  }
  return (
    list4.push(escapeText(list.slice(target))),
    {
      html: html.length
        ? list4.join('').replace(/\n$/, '<br class="Apple-interchange-newline">')
        : '',
      issues: issues,
    }
  );
}
export function pasteNodePrompt(enabled3, event, store) {
  if (!enabled3?.promptEl) return false;
  event?.preventDefault?.();
  const next = event?.clipboardData || globalThis.window?.clipboardData,
    current = String(next?.getData?.('text/html') || ''),
    entry = String(next?.getData?.('text/plain') || ''),
    enabled4 = /ref-pill/i.test(current) ? sanitizePromptHtml(current) : '',
    record = !!enabled4 && /class="ref-pill"/i.test(enabled4),
    args2 = record ? null : prepareMentions(enabled3, entry, store),
    payload = record ? enabled4 : args2?.html;
  if (payload && insertHtml(payload)) {
    const handle = record ? store.resolve(enabled3) : { unresolved: 0 };
    (store.hydrate(enabled3),
      store.commit(enabled3),
      handle.unresolved &&
        globalThis.window?.showToast?.('Some @ input refs are not bound in this node.', 'warn'));
  } else {
    const insertVirtualizedPromptTextAtSelection2 =
      insertVirtualizedPromptTextAtSelection(enabled3.promptEl, entry) ||
      insertPlainTextAtSelection(entry);
    if (!insertVirtualizedPromptTextAtSelection2) return false;
    if (!store.schedule(enabled3)) store.commit(enabled3);
  }
  if (args2?.issues.size) {
    const details = [...args2.issues]
      .slice(0, 3)
      .map(([state, config]) => '@' + state + '：' + config)
      .join('；');
    globalThis.window?.showToast?.(
      t('nodePromptShared.autoMentionIssues', { details: details }),
      'warn',
    );
  }
  return true;
}
