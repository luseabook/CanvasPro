import { sanitizePromptHtml } from '../utils/dom.js';
import { insertPlainTextAtSelection } from '../utils/editableText.js';
import { insertVirtualizedPromptTextAtSelection } from './promptPasteVirtualization.js';
import { matchPromptMentions } from './promptMentionMatcher.js';
import { t } from '../i18n/index.js';
function insertHtml(_0x24c97e) {
  try {
    return globalThis['document']?.['execCommand']?.('insertHTML', ![], _0x24c97e) === !![];
  } catch {
    return ![];
  }
}
function escapeText(_0x349a12) {
  return _0x349a12['replace'](/&/g, '&amp;')
    ['replace'](/</g, '&lt;')
    ['replace'](/>/g, '&gt;')
    ['replace'](/\r\n?/g, '\x0a');
}
function prepareMentions(_0x4366d1, _0xbe0345, _0x467a98) {
  if (!/[@＠]/['test'](_0xbe0345)) return null;
  const _0x467bb2 = matchPromptMentions(_0xbe0345, _0x467a98['candidates'](_0x4366d1));
  if (!_0x467bb2['length']) return null;
  const _0x14d6df = globalThis['window']?.['getSelection']?.()?.['rangeCount']
      ? window['getSelection']()['getRangeAt'](0x0)
      : null,
    _0x2e6fa6 = _0x4366d1['promptEl']['cloneNode'](!![]),
    _0x34502c = [..._0x4366d1['promptEl']['querySelectorAll']('.ref-pill')],
    _0x670309 = [..._0x2e6fa6['querySelectorAll']('.ref-pill')];
  _0x34502c['forEach']((_0x1228f6, _0x2b2c0d) => {
    if (_0x14d6df && !_0x14d6df['collapsed'] && _0x14d6df['intersectsNode'](_0x1228f6))
      _0x670309[_0x2b2c0d]['remove']();
  });
  const _0x725cf7 = Object['assign'](Object['create'](_0x4366d1), { promptEl: _0x2e6fa6 }),
    _0x48a2e3 = [],
    _0x32ca7c = new Map(),
    _0x2ddc11 = new Map(),
    _0x16e918 = [];
  let _0x47b219 = 0x0;
  for (const _0x11f06e of _0x467bb2) {
    _0x16e918['push'](escapeText(_0xbe0345['slice'](_0x47b219, _0x11f06e['start'])));
    const _0x15e298 = _0x11f06e['candidates']['length'] === 0x1 ? _0x11f06e['candidates'][0x0] : null;
    if (_0x15e298 && !_0x32ca7c['has'](_0x15e298)) {
      const _0x38cbb5 = _0x467a98['limit'](_0x725cf7, [..._0x48a2e3, _0x15e298]);
      _0x32ca7c['set'](_0x15e298, {
        reason: _0x38cbb5,
        html: _0x38cbb5 ? '' : _0x467a98['createPill'](_0x15e298, _0x4366d1)['outerHTML'],
      });
      if (!_0x38cbb5) _0x48a2e3['push'](_0x15e298);
    }
    const _0x451f28 = !_0x15e298
      ? t(
          'nodePromptShared.' +
            (_0x11f06e['candidates']['length'] ? 'autoMentionAmbiguous' : 'autoMentionMissing'),
        )
      : _0x32ca7c['get'](_0x15e298)['reason'];
    (_0x451f28
      ? (_0x16e918['push'](escapeText(_0xbe0345['slice'](_0x11f06e['start'], _0x11f06e['end']))),
        _0x2ddc11['set'](_0x11f06e['name'], _0x451f28))
      : _0x16e918['push'](_0x32ca7c['get'](_0x15e298)['html']),
      (_0x47b219 = _0x11f06e['end']));
  }
  return (
    _0x16e918['push'](escapeText(_0xbe0345['slice'](_0x47b219))),
    {
      html: _0x48a2e3['length']
        ? _0x16e918['join']('')['replace'](/\n$/, '<br class="Apple-interchange-newline">')
        : '',
      issues: _0x2ddc11,
    }
  );
}
export function pasteNodePrompt(_0xab3fa8, _0x2abbc5, _0x326170) {
  if (!_0xab3fa8?.['promptEl']) return ![];
  _0x2abbc5?.['preventDefault']?.();
  const _0x5c8e69 = _0x2abbc5?.['clipboardData'] || globalThis['window']?.['clipboardData'],
    _0x41bcf2 = String(_0x5c8e69?.['getData']?.('text/html') || ''),
    _0x1a2b79 = String(_0x5c8e69?.['getData']?.('text/plain') || ''),
    _0x14d267 = /ref-pill/i['test'](_0x41bcf2) ? sanitizePromptHtml(_0x41bcf2) : '',
    _0x5d7125 = !!_0x14d267 && /class="ref-pill"/i['test'](_0x14d267),
    _0x462e75 = _0x5d7125 ? null : prepareMentions(_0xab3fa8, _0x1a2b79, _0x326170),
    _0x7a80fe = _0x5d7125 ? _0x14d267 : _0x462e75?.['html'];
  if (_0x7a80fe && insertHtml(_0x7a80fe)) {
    const _0x432195 = _0x5d7125 ? _0x326170['resolve'](_0xab3fa8) : { unresolved: 0x0 };
    (_0x326170['hydrate'](_0xab3fa8),
      _0x326170['commit'](_0xab3fa8),
      _0x432195['unresolved'] &&
        globalThis['window']?.['showToast']?.('Some @ input refs are not bound in this node.', 'warn'));
  } else {
    const _0x3b82cc =
      insertVirtualizedPromptTextAtSelection(_0xab3fa8['promptEl'], _0x1a2b79) ||
      insertPlainTextAtSelection(_0x1a2b79);
    if (!_0x3b82cc) return ![];
    if (!_0x326170['schedule'](_0xab3fa8)) _0x326170['commit'](_0xab3fa8);
  }
  if (_0x462e75?.['issues']['size']) {
    const _0x1bb3c6 = [..._0x462e75['issues']]
      ['slice'](0x0, 0x3)
      ['map'](([_0x59c3cd, _0x30cc34]) => '@' + _0x59c3cd + '：' + _0x30cc34)
      ['join']('；');
    globalThis['window']?.['showToast']?.(
      t('nodePromptShared.autoMentionIssues', { details: _0x1bb3c6 }),
      'warn',
    );
  }
  return !![];
}
