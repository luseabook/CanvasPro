import { showError, showWarning } from '../../services/index.js';
import { markSystemClipboardWrite } from '../../modules/clipboard.js';
import appStore from '../../core/stores/appStore.js';
import { registerStaticInnerHTML, sanitizeRichTextHtml } from '../../utils/dom.js';
import { TEXT_TOOLBAR_HTML } from './textToolbarHtml.js';
import { bindStoryboardScriptToolbarAction } from './storyboardScriptAction.js';
import { t } from '../../i18n/index.js';
export { TEXT_TOOLBAR_HTML };
registerStaticInnerHTML('toolbar:text', TEXT_TOOLBAR_HTML);
function textToolbarText(value) {
  return t('nodeToolbar.text.' + value);
}
export function bindTextToolbarEvents(toolbarEl, nodeData, handler) {
  if (!toolbarEl) return;
  (toolbarEl.addEventListener('pointerdown', (event) => event.stopPropagation()),
    toolbarEl.addEventListener('dblclick', (event2) => {
      (event2.preventDefault(), event2.stopPropagation());
    }));
  const run = (...args) => {
      for (const item of args) {
        if (typeof item === 'string') return item;
      }
      return '';
    },
    handler2 = () => {
      const enabled = typeof nodeData?.id === 'string' ? nodeData.id : '';
      if (!enabled) return nodeData || {};
      const key = typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
      return key?.nodes?.[enabled] || nodeData || {};
    },
    handler3 = (index) => String(index ?? '').replace(/\r\n?/g, '\n'),
    handler4 = (result) => handler3(result).replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, ''),
    handler5 = (data) => {
      const options = handler4(data);
      return options
        .split('\n')
        .filter((item2) => item2.trim() !== '')
        .join('\n');
    },
    handler6 = (target) => {
      const sanitizeRichTextHtml2 = sanitizeRichTextHtml(typeof target === 'string' ? target : '');
      if (!sanitizeRichTextHtml2.trim()) return '';
      const el = document.createElement('div');
      el.innerHTML = sanitizeRichTextHtml2;
      const run2 = (source) =>
          source?.nodeType === Node.ELEMENT_NODE && String(source.tagName || '').toLowerCase() === 'br',
        handler7 = (el2) => {
          const next = String(el2?.tagName || '').toLowerCase(),
            current = next === 'hr' || !!el2.querySelector?.('img, video, audio, canvas, svg, iframe, hr'),
            enabled2 = handler4(el2.innerText || el2.textContent || '').trim();
          return !!enabled2 || current;
        },
        list = [];
      let entry = false,
        record = false;
      return (
        Array.from(el.childNodes).forEach((el3) => {
          if (el3.nodeType === Node.TEXT_NODE) {
            if (!handler4(el3.textContent || '').trim()) return;
            record && (list.push(document.createElement('br')), (record = false));
            (list.push(el3), (entry = true));
            return;
          }
          if (el3.nodeType !== Node.ELEMENT_NODE) return;
          if (run2(el3)) {
            if (entry) record = true;
            return;
          }
          const payload = el3;
          if (!handler7(payload)) return;
          (record && (list.push(document.createElement('br')), (record = false)),
            list.push(payload),
            (entry = true));
        }),
        el.replaceChildren(...list),
        el.innerHTML || ''
      );
    },
    handler8 = (handle) => {
      const el4 = document.createElement('div');
      return handler3(handle)
        .split('\n')
        .map((item3) => {
          return ((el4.textContent = item3), el4.innerHTML);
        })
        .join('<br>');
    },
    handler9 = ({ rawText: rawText, richHtml: richHtml } = {}) => {
      const state = typeof rawText === 'string' ? rawText : '',
        sanitizeRichTextHtml3 = sanitizeRichTextHtml(typeof richHtml === 'string' ? richHtml : ''),
        enabled3 = typeof nodeData?.id === 'string' ? nodeData.id : '';
      if (!enabled3) {
        window._triggerLocalCacheSave?.();
        return;
      }
      const config = handler2(),
        scope = String(config?.type || nodeData?.type || ''),
        input = {};
      (scope === 'ai-text' ||
        Object.prototype.hasOwnProperty.call(config || {}, 'outputText') ||
        Object.prototype.hasOwnProperty.call(nodeData || {}, 'outputText')) &&
        (input.outputText = state);
      (scope === 'source-text' ||
        scope === 'text' ||
        Object.prototype.hasOwnProperty.call(config || {}, 'content') ||
        Object.prototype.hasOwnProperty.call(nodeData || {}, 'content')) &&
        ((input.content = state), (input.contentHtml = sanitizeRichTextHtml3));
      if (!Object.keys(input).length) input.content = state;
      try {
        (appStore.updateNodeData(enabled3, input), Object.assign(nodeData, input));
      } catch (output) {
        console.warn('[TextToolbar] Persist fullscreen text failed:', output);
      }
      window._triggerLocalCacheSave?.();
    },
    el5 = toolbarEl.querySelector('.act-copy');
  if (el5) {
    const list2 = Array.from(el5.childNodes).map((item4) => item4.cloneNode(true)),
      value2 = el5.getAttribute('data-tooltip') || textToolbarText('copy'),
      value3 = el5.getAttribute('aria-label') || '';
    let setTimeout2 = null;
    el5.addEventListener('click', (event3) => {
      event3.stopPropagation();
      const text = handler ? handler() : nodeData.content || nodeData.resultText || '';
      if (!text) {
        showWarning(textToolbarText('noTextToCopy'));
        return;
      }
      navigator.clipboard
        .writeText(text)
        .then(() => {
          markSystemClipboardWrite({ text: text });
          setTimeout2 && (clearTimeout(setTimeout2), (setTimeout2 = null));
          el5.replaceChildren();
          const value4 = 'http://www.w3.org/2000/svg',
            el6 = document.createElementNS(value4, 'svg');
          (el6.setAttribute('viewBox', '0 0 24 24'),
            el6.setAttribute('fill', 'none'),
            el6.setAttribute('stroke', 'currentColor'),
            el6.setAttribute('stroke-width', '2'),
            el6.setAttribute('width', '16'),
            el6.setAttribute('height', '16'));
          const el7 = document.createElementNS(value4, 'polyline');
          (el7.setAttribute('points', '20 6 9 17 4 12'),
            el6.appendChild(el7),
            el5.appendChild(el6),
            el5.classList.add('is-copied'),
            el5.setAttribute('data-tooltip', textToolbarText('copied')),
            el5.setAttribute('aria-label', textToolbarText('copied')),
            (setTimeout2 = setTimeout(() => {
              (el5.replaceChildren(...list2.map((item5) => item5.cloneNode(true))),
                el5.setAttribute('data-tooltip', value2));
              if (value3) el5.setAttribute('aria-label', value3);
              else el5.removeAttribute('aria-label');
              (el5.classList.remove('is-copied'), (setTimeout2 = null));
            }, 0x7d0)));
        })
        .catch((value5) => {
          (console.error('复制失败:', value5), showError(textToolbarText('copyFailed')));
        });
    });
  }
  const el8 = toolbarEl.querySelector('.act-clear-empty-lines');
  el8 &&
    el8.addEventListener('click', (event4) => {
      event4.stopPropagation();
      const value6 = handler2(),
        value7 = run(
          handler ? handler() : undefined,
          value6?.content,
          value6?.outputText,
          nodeData?.content,
          nodeData?.outputText,
          nodeData?.resultText,
        ),
        enabled4 = handler3(value7);
      if (!enabled4.trim()) {
        showWarning(textToolbarText('noTextToClean'));
        return;
      }
      const rawText2 = handler5(enabled4);
      if (handler4(rawText2) === handler4(enabled4)) {
        window.showToast?.(textToolbarText('noBlankLines'), 'info');
        return;
      }
      const value8 = run(value6?.contentHtml, nodeData?.contentHtml);
      let richHtml2 = handler6(value8);
      if (value8.trim()) {
        const value9 = handler3(value8).trim(),
          value10 = handler3(richHtml2).trim();
        value9 === value10 && (richHtml2 = handler8(rawText2));
      }
      (handler9({ rawText: rawText2, richHtml: richHtml2 }),
        window.showToast?.(textToolbarText('clearedBlankLines'), 'success'));
    });
  bindStoryboardScriptToolbarAction({
    toolbarEl: toolbarEl,
    nodeData: nodeData,
    store: appStore,
    getStateSnapshot: () =>
      typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState(),
  });
  const el9 = toolbarEl.querySelector('.act-fullscreen');
  el9 &&
    el9.addEventListener('click', (event5) => {
      event5.stopPropagation();
      const value11 = handler2(),
        value12 = run(
          value11?.content,
          value11?.outputText,
          handler ? handler() : undefined,
          nodeData?.content,
          nodeData?.resultText,
        ),
        value13 = run(value11?.contentHtml, nodeData?.contentHtml),
        sanitizeRichTextHtml4 = sanitizeRichTextHtml(value13),
        el10 = document.createElement('div');
      Object.assign(el10.style, {
        position: 'fixed',
        inset: '0',
        background: 'var(--overlay-dim)',
        zIndex: '99999',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      });
      const el11 = document.createElement('div');
      Object.assign(el11.style, {
        background: 'var(--bg-2)',
        border: '1px solid var(--stroke-08)',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '1000px',
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-dialog)',
      });
      const el12 = document.createElement('div');
      Object.assign(el12.style, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: '1px solid var(--stroke-05)',
      });
      const el13 = document.createElement('div'),
        el14 = document.createElement('button');
      (el14.setAttribute('data-tooltip', textToolbarText('copy')),
        el14.setAttribute('aria-label', textToolbarText('copy')),
        Object.assign(el14.style, {
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '6px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          transition: 'background 0.2s',
        }));
      const value14 = 'http://www.w3.org/2000/svg',
        el15 = document.createElementNS(value14, 'svg');
      (el15.setAttribute('viewBox', '0 0 24 24'),
        el15.setAttribute('fill', 'none'),
        el15.setAttribute('stroke', 'currentColor'),
        el15.setAttribute('stroke-width', '2'),
        el15.setAttribute('width', '16'),
        el15.setAttribute('height', '16'));
      const el16 = document.createElementNS(value14, 'rect');
      (el16.setAttribute('x', '9'),
        el16.setAttribute('y', '9'),
        el16.setAttribute('width', '13'),
        el16.setAttribute('height', '13'),
        el16.setAttribute('rx', '2'),
        el16.setAttribute('ry', '2'));
      const el17 = document.createElementNS(value14, 'path');
      (el17.setAttribute('d', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'),
        el15.appendChild(el16),
        el15.appendChild(el17),
        el14.appendChild(el15),
        el13.appendChild(el14),
        (el14.onmouseenter = () => (el14.style.background = 'var(--white-10)')),
        (el14.onmouseleave = () => (el14.style.background = 'transparent')));
      const el18 = document.createElement('div');
      Object.assign(el18.style, { display: 'flex', alignItems: 'center', gap: '4px' });
      const run3 = (error, value15, value16 = null, value17 = '') => {
          if (error === '|') {
            const el19 = document.createElement('div');
            return (
              Object.assign(el19.style, {
                width: '1px',
                height: '14px',
                background: 'var(--stroke-10)',
                margin: '0 4px',
              }),
              el19
            );
          }
          const el20 = document.createElement('button');
          value17 && (el20.setAttribute('data-tooltip', value17), el20.setAttribute('aria-label', value17));
          el20.replaceChildren();
          if (error && typeof error === 'object' && error.kind === 'svg') {
            const el21 = document.createElementNS(value14, 'svg');
            (el21.setAttribute('viewBox', '0 0 24 24'),
              el21.setAttribute('fill', 'none'),
              el21.setAttribute('stroke', 'currentColor'),
              el21.setAttribute('stroke-width', '2'),
              el21.setAttribute('width', '14'),
              el21.setAttribute('height', '14'));
            if (error.name === 'ul') {
              const el22 = document.createElementNS(value14, 'line');
              (el22.setAttribute('x1', '8'),
                el22.setAttribute('y1', '6'),
                el22.setAttribute('x2', '21'),
                el22.setAttribute('y2', '6'));
              const el23 = document.createElementNS(value14, 'line');
              (el23.setAttribute('x1', '8'),
                el23.setAttribute('y1', '12'),
                el23.setAttribute('x2', '21'),
                el23.setAttribute('y2', '12'));
              const el24 = document.createElementNS(value14, 'line');
              (el24.setAttribute('x1', '8'),
                el24.setAttribute('y1', '18'),
                el24.setAttribute('x2', '21'),
                el24.setAttribute('y2', '18'));
              const el25 = document.createElementNS(value14, 'line');
              (el25.setAttribute('x1', '3'),
                el25.setAttribute('y1', '6'),
                el25.setAttribute('x2', '3.01'),
                el25.setAttribute('y2', '6'));
              const el26 = document.createElementNS(value14, 'line');
              (el26.setAttribute('x1', '3'),
                el26.setAttribute('y1', '12'),
                el26.setAttribute('x2', '3.01'),
                el26.setAttribute('y2', '12'));
              const el27 = document.createElementNS(value14, 'line');
              (el27.setAttribute('x1', '3'),
                el27.setAttribute('y1', '18'),
                el27.setAttribute('x2', '3.01'),
                el27.setAttribute('y2', '18'),
                el21.appendChild(el22),
                el21.appendChild(el23),
                el21.appendChild(el24),
                el21.appendChild(el25),
                el21.appendChild(el26),
                el21.appendChild(el27));
            } else {
              if (error.name === 'ol') {
                const el28 = document.createElementNS(value14, 'line');
                (el28.setAttribute('x1', '10'),
                  el28.setAttribute('y1', '6'),
                  el28.setAttribute('x2', '21'),
                  el28.setAttribute('y2', '6'));
                const el29 = document.createElementNS(value14, 'line');
                (el29.setAttribute('x1', '10'),
                  el29.setAttribute('y1', '12'),
                  el29.setAttribute('x2', '21'),
                  el29.setAttribute('y2', '12'));
                const el30 = document.createElementNS(value14, 'line');
                (el30.setAttribute('x1', '10'),
                  el30.setAttribute('y1', '18'),
                  el30.setAttribute('x2', '21'),
                  el30.setAttribute('y2', '18'));
                const el31 = document.createElementNS(value14, 'path');
                el31.setAttribute('d', 'M4 6h1v4');
                const el32 = document.createElementNS(value14, 'path');
                el32.setAttribute('d', 'M4 10h2');
                const el33 = document.createElementNS(value14, 'path');
                (el33.setAttribute('d', 'M6 18H4c0-1 2-2 2-3s-1-1.5-2-1'),
                  el21.appendChild(el28),
                  el21.appendChild(el29),
                  el21.appendChild(el30),
                  el21.appendChild(el31),
                  el21.appendChild(el32),
                  el21.appendChild(el33));
              }
            }
            el20.appendChild(el21);
          } else {
            el20.textContent = String(error ?? '');
            if (error === 'B') el20.style.fontWeight = '700';
            if (error === 'I') el20.style.fontStyle = 'italic';
            ((error === 'H₁' || error === 'H₂' || error === 'H₃') &&
              ((el20.style.fontSize = '12px'), (el20.style.fontWeight = '700')),
              error === '¶' && ((el20.style.fontSize = '14px'), (el20.style.fontWeight = '700')));
          }
          return (
            Object.assign(el20.style, {
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontFamily: 'serif',
              transition: 'all 0.2s',
            }),
            (el20.onmouseenter = () => (el20.style.background = 'var(--white-10)')),
            (el20.onmouseleave = () => (el20.style.background = 'transparent')),
            (el20.onclick = (event6) => {
              (event6.preventDefault(), document.execCommand(value15, false, value16));
            }),
            el20
          );
        },
        list3 = [
          { l: 'H₁', c: 'formatBlock', v: 'H1', tooltip: textToolbarText('heading1') },
          { l: 'H₂', c: 'formatBlock', v: 'H2', tooltip: textToolbarText('heading2') },
          { l: 'H₃', c: 'formatBlock', v: 'H3', tooltip: textToolbarText('heading3') },
          { l: '¶', c: 'formatBlock', v: 'P', tooltip: textToolbarText('paragraph') },
          { l: '|' },
          { l: 'B', c: 'bold', tooltip: textToolbarText('bold') },
          { l: 'I', c: 'italic', tooltip: textToolbarText('italic') },
          { l: '|' },
          {
            l: { kind: 'svg', name: 'ul' },
            c: 'insertUnorderedList',
            tooltip: textToolbarText('unorderedList'),
          },
          { l: { kind: 'svg', name: 'ol' }, c: 'insertOrderedList', tooltip: textToolbarText('orderedList') },
          { l: '|' },
          { l: '—', c: 'insertHorizontalRule', tooltip: textToolbarText('divider') },
        ];
      list3.forEach((item6) => el18.appendChild(run3(item6.l, item6.c, item6.v, item6.tooltip)));
      const el34 = document.createElement('div'),
        el35 = document.createElement('button');
      (el35.setAttribute('data-tooltip', textToolbarText('close')),
        el35.setAttribute('aria-label', textToolbarText('close')),
        Object.assign(el35.style, {
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: '6px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          transition: 'background 0.2s',
        }));
      const el36 = document.createElementNS(value14, 'svg');
      (el36.setAttribute('viewBox', '0 0 24 24'),
        el36.setAttribute('fill', 'none'),
        el36.setAttribute('stroke', 'currentColor'),
        el36.setAttribute('stroke-width', '2'),
        el36.setAttribute('width', '16'),
        el36.setAttribute('height', '16'));
      const el37 = document.createElementNS(value14, 'path');
      el37.setAttribute('d', 'M18 6L6 18');
      const el38 = document.createElementNS(value14, 'path');
      (el38.setAttribute('d', 'M6 6l12 12'),
        el36.appendChild(el37),
        el36.appendChild(el38),
        el35.appendChild(el36),
        el34.appendChild(el35),
        (el35.onmouseenter = () => (el35.style.background = 'var(--white-10)')),
        (el35.onmouseleave = () => (el35.style.background = 'transparent')),
        el12.appendChild(el13),
        el12.appendChild(el18),
        el12.appendChild(el34));
      const rawText3 = document.createElement('div');
      (Object.assign(rawText3.style, {
        flex: '1',
        padding: '40px 60px',
        overflowY: 'auto',
        color: 'var(--text-secondary)',
        fontSize: '16px',
        lineHeight: '1.8',
        outline: 'none',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
      }),
        (rawText3.contentEditable = 'true'),
        (rawText3.spellcheck = false));
      sanitizeRichTextHtml4 ? (rawText3.innerHTML = sanitizeRichTextHtml4) : (rawText3.textContent = value12);
      ((rawText3.className = 'v2-rt-editor'),
        el11.appendChild(el12),
        el11.appendChild(rawText3),
        (el14.onclick = () => {
          const text2 = rawText3.innerText || '';
          navigator.clipboard.writeText(text2).then(() => {
            markSystemClipboardWrite({ text: text2 });
            const list4 = Array.from(el14.childNodes).map((item7) => item7.cloneNode(true));
            el14.replaceChildren();
            const el39 = document.createElementNS(value14, 'svg');
            (el39.setAttribute('viewBox', '0 0 24 24'),
              el39.setAttribute('fill', 'none'),
              el39.setAttribute('stroke', 'currentColor'),
              el39.setAttribute('stroke-width', '2'),
              el39.setAttribute('width', '16'),
              el39.setAttribute('height', '16'));
            const el40 = document.createElementNS(value14, 'polyline');
            (el40.setAttribute('points', '20 6 9 17 4 12'),
              el39.appendChild(el40),
              el14.appendChild(el39),
              setTimeout(() => {
                el14.replaceChildren(...list4.map((item8) => item8.cloneNode(true)));
              }, 0x7d0));
          });
        }),
        el11.addEventListener('click', (event7) => event7.stopPropagation()));
      const run4 = () => {
        (handler9({
          rawText: rawText3.innerText || '',
          richHtml: sanitizeRichTextHtml(rawText3.innerHTML || ''),
        }),
          el10.remove());
      };
      ((el35.onclick = run4),
        el10.addEventListener('click', (event8) => {
          if (event8.target === el10) run4();
        }),
        el10.appendChild(el11),
        document.body.appendChild(el10),
        window._triggerLocalCacheSave?.(),
        setTimeout(() => rawText3.focus(), 50));
    });
}
