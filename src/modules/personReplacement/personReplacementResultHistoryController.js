import { scrollClosestElementHorizontallyWithWheel } from '../workspaceHorizontalWheel.js';
import { reconcileElementTree } from './personReplacementShotSelectionRendering.js';
import { createPersonReplacementResultHistoryLayout } from './personReplacementResultHistoryLayout.js';
const PANEL = '[data-person-replacement-result-history-menu]',
  TOGGLE = '[data-person-replacement-result-history-toggle]',
  CLOSE = '[data-person-replacement-result-history-close]';
export function createPersonReplacementResultHistoryController({
  getRoot: getRoot,
  getProject: getProject,
  renderHistoryMenu: renderHistoryMenu,
  selectShot: selectShot,
  isCutEditorOpen: isCutEditorOpen = () => false,
} = {}) {
  let kind = null,
    focus = null,
    value = '',
    item = 0;
  const personReplacementResultHistoryLayout = createPersonReplacementResultHistoryLayout(),
    handler = (key) =>
      Array.from(getRoot()?.querySelectorAll?.(TOGGLE) || []).find(
        (el) => el.dataset.shotId === key,
      ),
    capture = () => {
      if (!kind) return null;
      const scrollLeft = focus?.querySelector?.('.story-media-history-list'),
        el2 = focus?.ownerDocument?.activeElement;
      return {
        ...kind,
        scrollLeft: scrollLeft?.scrollLeft || 0,
        focus:
          focus?.contains?.(el2) && el2?.matches?.('button')
            ? Object.fromEntries(
                [
                  'storyAction',
                  'shotId',
                  'replacementImageResultIndex',
                  'replacementVideoResultIndex',
                  'personReplacementResultHistoryClose',
                ]
                  .filter((index) => index in el2.dataset)
                  .map((result) => [result, el2.dataset[result]]),
              )
            : null,
      };
    },
    data = (options) =>
      scrollClosestElementHorizontallyWithWheel(options, '.story-media-history-list', {
        boundaryRoot: focus,
        stopPropagation: true,
        preserveNestedScrollable: true,
      }),
    handler2 = () => {
      for (const el3 of getRoot()?.querySelectorAll?.(TOGGLE) || []) {
        const target = kind?.shotId === el3.dataset.shotId;
        (el3.setAttribute('aria-expanded', String(target)),
          el3.setAttribute(
            'aria-label',
            '' + (target ? '收起' : '展开') + el3.dataset.resultCount + ' 个结果',
          ));
      }
    },
    hide = ({ animate: animate = false } = {}) => {
      const source = ++item,
        next = focus;
      kind = null;
      focus &&
        (focus.classList.remove('is-visible'),
        focus.setAttribute('aria-hidden', 'true'),
        (focus.inert = true));
      handler2();
      const run = () => {
          if (source !== item || next !== focus) return;
          (focus && ((focus.hidden = true), (focus.innerHTML = '')), (value = ''));
        },
        list = personReplacementResultHistoryLayout.hide({ animate: animate });
      if (list.length) {
        Promise.allSettled(list.map((current) => current.finished)).then(run);
        return;
      }
      run();
    },
    refresh = (el4 = capture()) => {
      const entry = getRoot()?.querySelector?.(PANEL) || null;
      entry !== focus &&
        (focus?.removeEventListener?.('wheel', data),
        (focus = entry),
        (value = ''),
        focus?.addEventListener?.('wheel', data, { passive: false }));
      const shot = getProject(),
        record = shot.workspace;
      if (
        !kind ||
        !focus ||
        record.view !== 'project' ||
        kind.projectId !== shot.id ||
        kind.step !== record.step ||
        record.selectedShotId !== kind.shotId ||
        record.shotSelectionMode ||
        isCutEditorOpen()
      )
        return (hide(), false);
      const count = shot.shots.findIndex((payload) => payload.id === kind.shotId);
      if (count < 0) return (hide(), false);
      const enabled = renderHistoryMenu({
        kind: kind.step === 3 ? 'video' : 'image',
        shot: shot.shots[count],
        title: '片段' + String(count + 1).padStart(2, '0'),
        allowSingleResult: true,
      });
      if (!enabled) return (hide(), false);
      const handle =
        '<div class="person-replacement-result-history-content"><button type="button" class="person-replacement-result-history-close" data-person-replacement-result-history-close aria-label="收起结果">收起</button>' +
        enabled +
        '</div>';
      if (value !== handle) {
        const el5 = focus.cloneNode?.(false);
        (el5 && value
          ? ((el5.innerHTML = handle), reconcileElementTree(focus, el5, { preserveImageNodes: true }))
          : (focus.innerHTML = handle),
          (value = handle));
      }
      (++item,
        (focus.inert = false),
        (focus.hidden = false),
        focus.classList.add('is-visible'),
        focus.setAttribute('aria-hidden', 'false'),
        (focus.dataset.shotId = kind.shotId),
        (focus.dataset.historyKind = kind.step === 3 ? 'video' : 'image'),
        personReplacementResultHistoryLayout.show(focus),
        handler2());
      if (el4?.shotId === kind.shotId) {
        const state = focus.querySelector('.story-media-history-list');
        if (state) state.scrollLeft = el4.scrollLeft || 0;
        if (el4.focus) {
          const el6 = Array.from(focus.querySelectorAll('button')).find((el7) =>
            Object.entries(el4.focus).every(([config, scope]) => el7.dataset[config] === scope),
          );
          el6?.focus?.({ preventScroll: true });
        }
      }
      return true;
    },
    handleClick = (event) => {
      const enabled2 = event.target?.closest?.(CLOSE),
        el8 = event.target?.closest?.(TOGGLE);
      if ((!el8 && !enabled2) || !getRoot()?.contains?.(el8 || enabled2)) return false;
      (event.preventDefault?.(), event.stopPropagation?.());
      if (enabled2 || kind?.shotId === el8.dataset.shotId) {
        const el9 = handler(kind?.shotId);
        return (hide({ animate: true }), el9?.focus?.({ preventScroll: true }), true);
      }
      if (el8.disabled) return true;
      const shotId = el8.dataset.shotId;
      selectShot(shotId, { ensureVisible: false });
      const projectId = getProject();
      return (
        (kind = { projectId: projectId.id, step: projectId.workspace.step, shotId: shotId }),
        refresh(null),
        handler(shotId)?.focus?.({ preventScroll: true }),
        true
      );
    };
  return Object.freeze({
    capture: capture,
    refresh: refresh,
    hide: hide,
    handleClick: handleClick,
    restore(projectId2) {
      if (!projectId2) return false;
      return (
        (kind = {
          projectId: projectId2.projectId,
          step: projectId2.step,
          shotId: projectId2.shotId,
        }),
        refresh(projectId2)
      );
    },
    handleKeyDown(event2) {
      if (event2.key !== 'Escape' || !kind) return false;
      const el10 = handler(kind.shotId);
      return (
        hide({ animate: true }),
        el10?.focus?.({ preventScroll: true }),
        event2.preventDefault?.(),
        event2.stopPropagation?.(),
        true
      );
    },
    destroy() {
      (hide(),
        focus?.removeEventListener?.('wheel', data),
        personReplacementResultHistoryLayout.destroy(),
        (focus = null));
    },
  });
}
