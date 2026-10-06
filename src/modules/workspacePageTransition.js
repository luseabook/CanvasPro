const DEFAULT_DIRECTION_CLASSES = Object.freeze({
  forward: Object.freeze({ entering: 'is-entering-forward', leaving: 'is-leaving-forward' }),
  backward: Object.freeze({ entering: 'is-entering-backward', leaving: 'is-leaving-backward' }),
});
function toClassNames(list) {
  if (Array.isArray(list)) return list.flatMap((value) => toClassNames(value));
  return String(list || '')
    .split(/\s+/)
    .filter(Boolean);
}
function addClasses(el, ...list2) {
  const list3 = list2.flatMap((item) => toClassNames(item));
  if (list3.length) el?.classList?.add?.(...list3);
}
function removeClasses(el2, ...list4) {
  const list5 = list4.flatMap((key) => toClassNames(key));
  if (list5.length) el2?.classList?.remove?.(...list5);
}
function setPageInteractive(el3, enabled) {
  if (!el3) return;
  enabled ? el3.removeAttribute?.('aria-hidden') : el3.setAttribute?.('aria-hidden', 'true');
  try {
    el3.inert = !enabled;
  } catch {}
}
function resolveDirectionClasses(index, entering = {}) {
  const enabled2 = DEFAULT_DIRECTION_CLASSES[index];
  if (!enabled2) return null;
  return {
    entering: entering?.directions?.[index]?.entering || enabled2.entering,
    leaving: entering?.directions?.[index]?.leaving || enabled2.leaving,
  };
}
export function createWorkspacePageTransitionController({
  windowObject: windowObject = globalThis,
  fallbackMs: fallbackMs = 520,
  transitionProperty: transitionProperty = 'transform',
  disposePage: disposePage = (el4) => el4?.remove?.(),
  captureFocus: captureFocus = null,
  restoreFocus: restoreFocus = null,
} = {}) {
  let commit2 = null,
    result = false;
  const run = (
      transition,
      {
        commit: commit = transition?.committed === true,
        notify: notify = false,
        reason: reason = 'settled',
      } = {},
    ) => {
      if (!transition || transition.settled) return false;
      commit && !transition.committed && handler(transition);
      ((transition.settled = true),
        transition.transitionElement?.removeEventListener?.(
          'transitionend',
          transition.onTransitionEnd,
        ));
      transition.fallbackTimer && windowObject?.clearTimeout?.(transition.fallbackTimer);
      transition.rafId &&
        typeof windowObject?.cancelAnimationFrame === 'function' &&
        windowObject.cancelAnimationFrame(transition.rafId);
      const {
        current: current,
        next: next,
        parent: parent2,
        directionClasses: directionClasses,
        classNames: classNames2,
      } = transition;
      commit
        ? ((transition.committed = true),
          removeClasses(
            current,
            classNames2.current,
            directionClasses.leaving,
            classNames2.page,
            classNames2.scopeCurrent,
          ),
          removeClasses(
            next,
            directionClasses.entering,
            classNames2.page,
            classNames2.scopeNext,
            classNames2.scopeTarget,
          ),
          classNames2.retainCurrentOnCommit
            ? addClasses(next, classNames2.current)
            : removeClasses(next, classNames2.current),
          setPageInteractive(next, true),
          disposePage(current),
          transition.onCommit?.(transition))
        : (removeClasses(
            current,
            directionClasses.leaving,
            classNames2.page,
            classNames2.scopeCurrent,
          ),
          addClasses(current, classNames2.current),
          setPageInteractive(current, true),
          disposePage(next),
          transition.onRollback?.(transition));
      removeClasses(parent2, classNames2.parent);
      if (commit2 === transition) commit2 = null;
      commit &&
        transition.focusKey != null &&
        restoreFocus?.(transition.focusKey, transition.focusContext, transition);
      transition.onSettled?.({
        committed: Boolean(commit),
        notify: notify,
        reason: reason,
        transition: transition,
      });
      if (notify) transition.onTransitionComplete?.(transition);
      return (transition.resolve?.(Boolean(commit)), true);
    },
    handler = (enabled3) => {
      if (result || !enabled3 || enabled3.settled || commit2 !== enabled3) return false;
      return (
        enabled3.onBeforeCommit?.(enabled3),
        (enabled3.committed = true),
        addClasses(enabled3.current, enabled3.directionClasses.leaving),
        removeClasses(enabled3.current, enabled3.classNames.current),
        addClasses(enabled3.next, enabled3.classNames.current),
        removeClasses(enabled3.next, enabled3.directionClasses.entering),
        enabled3.onAfterCommit?.(enabled3),
        true
      );
    },
    start = ({
      current: current2,
      next: next2,
      parent: parent = next2?.parentElement || current2?.parentElement || null,
      direction: direction = 'forward',
      transitionElement: transitionElement = next2,
      classNames: classNames = {},
      focusKey: focusKey,
      focusContext: focusContext = null,
      mount: mount = null,
      forceLayout: forceLayout = null,
      onBeforeCommit: onBeforeCommit = null,
      onAfterCommit: onAfterCommit = null,
      onCommit: onCommit = null,
      onRollback: onRollback = null,
      onSettled: onSettled = null,
      onTransitionComplete: onTransitionComplete = null,
    } = {}) => {
      if (result) return null;
      const directionClasses2 = resolveDirectionClasses(direction, classNames);
      if (!current2 || !next2 || !parent || !transitionElement || !directionClasses2) return null;
      commit2 && run(commit2, { commit: commit2.committed === true, notify: false, reason: 'replaced' });
      const classNames3 = {
          current: classNames.current || 'is-current',
          page: classNames.page || '',
          parent: classNames.parent || '',
          scopeCurrent: classNames.scopeCurrent || '',
          scopeNext: classNames.scopeNext || '',
          scopeTarget: classNames.scopeTarget || '',
          retainCurrentOnCommit: classNames.retainCurrentOnCommit !== false,
        },
        focusKey2 =
          focusKey === undefined
            ? (captureFocus?.({ current: current2, next: next2, parent: parent }) ?? null)
            : focusKey,
        transition2 = {
          current: current2,
          next: next2,
          parent: parent,
          transitionElement: transitionElement,
          directionClasses: directionClasses2,
          classNames: classNames3,
          focusKey: focusKey2,
          focusContext: focusContext,
          committed: false,
          settled: false,
          fallbackTimer: 0,
          rafId: 0,
          onTransitionEnd: null,
          onBeforeCommit: onBeforeCommit,
          onAfterCommit: onAfterCommit,
          onCommit: onCommit,
          onRollback: onRollback,
          onSettled: onSettled,
          onTransitionComplete: onTransitionComplete,
          resolve: null,
        };
      return (
        (transition2.committedPromise = new Promise((data) => {
          transition2.resolve = data;
        })),
        addClasses(parent, classNames3.parent),
        addClasses(current2, classNames3.page, classNames3.current, classNames3.scopeCurrent),
        setPageInteractive(current2, false),
        addClasses(
          next2,
          classNames3.page,
          directionClasses2.entering,
          classNames3.scopeNext,
          classNames3.scopeTarget,
        ),
        setPageInteractive(next2, true),
        mount?.({ current: current2, next: next2, parent: parent, transition: transition2 }),
        (commit2 = transition2),
        (transition2.onTransitionEnd = (event) => {
          if (
            event?.target !== transitionElement ||
            (transitionProperty && event?.propertyName !== transitionProperty)
          )
            return;
          run(transition2, { commit: true, notify: true, reason: 'transitionend' });
        }),
        transitionElement.addEventListener?.('transitionend', transition2.onTransitionEnd),
        forceLayout?.({ current: current2, next: next2, parent: parent, transition: transition2 }),
        typeof windowObject?.requestAnimationFrame === 'function'
          ? (transition2.rafId = windowObject.requestAnimationFrame(() => {
              handler(transition2);
            }))
          : handler(transition2),
        (transition2.fallbackTimer =
          windowObject?.setTimeout?.(
            () => {
              (handler(transition2), run(transition2, { commit: true, notify: true, reason: 'fallback' }));
            },
            Math.max(0, Number(fallbackMs) || 0),
          ) || 0),
        {
          transition: transition2,
          committed: transition2.committedPromise,
          commit: () => handler(transition2),
          settle: (options) => run(transition2, options),
          rollback: () => run(transition2, { commit: false, notify: false, reason: 'rollback' }),
          cancel: ({ commit: commit = transition2.committed === true } = {}) =>
            run(transition2, { commit: commit, notify: false, reason: 'cancelled' }),
        }
      );
    },
    cancel = ({ commit: commit = commit2?.committed === true } = {}) =>
      commit2 ? run(commit2, { commit: commit, notify: false, reason: 'cancelled' }) : false;
  return {
    start: start,
    cancel: cancel,
    settle: (options2 = {}) => (commit2 ? run(commit2, options2) : false),
    destroy({ commit: commit = false } = {}) {
      if (result) return;
      (cancel({ commit: commit }), (result = true));
    },
    getActiveTransition() {
      return commit2;
    },
  };
}
