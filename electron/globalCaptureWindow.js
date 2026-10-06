import { createContextMenuIcon } from '../src/modules/interaction/contextMenuIcons.js';
import { scrollElementHorizontallyWithWheel } from '../src/modules/workspaceHorizontalWheel.js';
const api = globalThis.globalCaptureWindow,
  panel = document.getElementById('capturePanel'),
  toolbar = document.getElementById('actionList'),
  details = document.getElementById('captureDetails'),
  preview = document.getElementById('textPreview'),
  more = document.getElementById('moreToggle'),
  toggle = document.getElementById('runImmediatelyToggle'),
  feedback = document.getElementById('captureFeedback'),
  status = document.getElementById('captureStatus'),
  hint = document.getElementById('captureHint'),
  retry = document.getElementById('retryAction'),
  actions = Array.from(panel.querySelectorAll('[data-action-id]')),
  toolbarButtons = Array.from(toolbar.querySelectorAll('button')),
  actionIds = actions.map((actionElement) => actionElement.dataset.actionId),
  state = {
    captureId: '',
    activeIndex: 0,
    runImmediately: false,
    busy: false,
    phase: 'ready',
    expanded: false,
    layoutVersion: 0,
    revision: 0,
    failedAction: null,
  },
  aiLabels = [
    ['AI 文本', '建文本', 'AI 文本节点'],
    ['AI 生图', '建图像', 'AI 图像节点'],
    ['AI 视频', '建视频', 'AI 视频节点'],
  ];
panel.querySelectorAll('[data-icon]').forEach((iconNode) => {
  const iconElement = createContextMenuIcon(iconNode.dataset.icon, { size: 16 });
  if (iconElement) iconNode.prepend(iconElement);
});
function updateRunImmediately(nextRunImmediately) {
  ((state.runImmediately = nextRunImmediately === true),
    toggle.setAttribute('aria-checked', String(state.runImmediately)),
    actions.slice(1, 4).forEach((actionButton, aiIndex) => {
      const [generatedLabel, createdLabel, nodeLabel] = aiLabels[aiIndex];
      ((actionButton.querySelector('[data-action-label]').textContent = state.runImmediately
        ? generatedLabel
        : createdLabel),
        actionButton.setAttribute(
          'aria-label',
          (state.runImmediately ? '创建并生成' : '仅创建') + nodeLabel,
        ));
    }));
}
function syncControls() {
  const blocked = state.busy || state.phase !== 'ready';
  (panel.classList.toggle('is-capturing', state.phase === 'capturing'),
    more.setAttribute('aria-label', state.phase === 'capturing' ? '正在读取选中文字…' : '更多操作'),
    (document.getElementById('closeCapture').hidden = state.phase === 'capturing'),
    actions.forEach((actionButtonElement) => {
      actionButtonElement.disabled = blocked;
    }),
    (toggle.disabled = blocked),
    (more.disabled = blocked),
    panel.setAttribute('aria-busy', String(state.busy || state.phase === 'capturing')));
}
function showFeedback(statusText = '', hintText = '') {
  ((status.textContent = statusText),
    (hint.textContent = hintText),
    (feedback.hidden = !statusText),
    (toolbar.hidden = Boolean(statusText) && state.phase !== 'capturing'),
    (details.hidden = Boolean(statusText) || !state.expanded),
    (retry.hidden = !state.failedAction || state.busy));
}
async function setExpanded(nextExpanded, { restoreFocus: restoreFocus = false } = {}) {
  ((state.expanded = nextExpanded === true),
    (details.hidden = !state.expanded),
    more.setAttribute('aria-expanded', String(state.expanded)));
  const requestCaptureId = state.captureId,
    requestLayoutVersion = ++state.layoutVersion;
  if (restoreFocus) more.focus({ preventScroll: true });
  try {
    const expandResult = await api?.setExpanded?.({
      captureId: requestCaptureId,
      expanded: state.expanded,
    });
    if (requestCaptureId !== state.captureId || requestLayoutVersion !== state.layoutVersion) return;
    (expandResult?.ok === false &&
      ((state.expanded = false), (details.hidden = true), more.setAttribute('aria-expanded', 'false')),
      panel.classList.toggle(
        'is-above',
        expandResult?.ok === true && expandResult.opensUp === true,
      ));
  } catch {
    if (requestCaptureId !== state.captureId || requestLayoutVersion !== state.layoutVersion) return;
    ((state.expanded = false), (details.hidden = true), more.setAttribute('aria-expanded', 'false'));
  }
}
function setActiveIndex(nextIndex, { focus: focus = true } = {}) {
  ((state.activeIndex = Math.max(0, Math.min(toolbarButtons.length - 1, nextIndex))),
    toolbarButtons.forEach((toolbarButton, toolbarButtonIndex) => {
      toolbarButton.tabIndex = toolbarButtonIndex === state.activeIndex ? 0 : -1;
    }));
  const activeButton = toolbarButtons[state.activeIndex];
  activeButton.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  if (focus) activeButton.focus({ preventScroll: true });
}
async function choose(actionId, runImmediately = state.runImmediately, rememberRunImmediately = true) {
  if (state.busy || state.phase !== 'ready' || !state.captureId || !actionIds.includes(actionId))
    return;
  const requestCaptureId = state.captureId,
    requestRevision = state.revision,
    dispatchPayload = {
      actionId: actionId,
      runImmediately: runImmediately,
      ...(rememberRunImmediately ? {} : { rememberRunImmediately: false }),
    };
  ((state.busy = true),
    (state.failedAction = null),
    void setExpanded(false),
    syncControls(),
    showFeedback('正在发送到画布…'));
  try {
    const dispatchResult = await api.chooseAction({ captureId: requestCaptureId, ...dispatchPayload });
    if (state.captureId !== requestCaptureId || state.revision !== requestRevision) return;
    if (dispatchResult?.ok !== true)
      throw Object.assign(new Error('dispatch-failed'), { retryable: dispatchResult?.retryable });
    ((state.busy = false), (state.captureId = ''), showFeedback('已发送到画布'), syncControls());
  } catch (dispatchError) {
    if (state.captureId !== requestCaptureId || state.revision !== requestRevision) return;
    ((state.busy = false),
      (state.failedAction = dispatchError?.retryable === true ? dispatchPayload : null),
      syncControls(),
      showFeedback('发送失败', '选中文字已保留'),
      (state.failedAction ? retry : document.getElementById('closeCapture')).focus({
        preventScroll: true,
      }));
  }
}
async function cancel() {
  if (!state.captureId) return;
  const cancelCaptureId = state.captureId;
  ((state.captureId = ''), (state.revision += 1), (state.busy = false), syncControls());
  try {
    await api?.cancel?.({ captureId: cancelCaptureId });
  } catch {}
}
function captureError(errorReason, shortcutLabel) {
  if (errorReason === 'shortcut-keys-still-held') return ['请先松开快捷键', '松开后再按 ' + shortcutLabel];
  if (errorReason === 'copy-command-timeout' || errorReason === 'copy-worker-startup-timeout')
    return ['读取选区超时', '保持文字选中，再按 ' + shortcutLabel];
  return ['未能读取选中文字', '重新选中文字，再按 ' + shortcutLabel];
}
function present(presentation = {}) {
  ((state.revision += 1),
    (state.layoutVersion += 1),
    (state.captureId = String(presentation.captureId || '')),
    (state.phase =
      presentation.phase === 'capturing' || presentation.phase === 'error'
        ? presentation.phase
        : 'ready'),
    (state.busy = false),
    (state.failedAction = null),
    (state.expanded = false),
    more.setAttribute('aria-expanded', 'false'),
    panel.classList.remove('is-above'),
    (preview.textContent = String(presentation.text || '')),
    (preview.scrollTop = 0),
    (details.scrollTop = 0),
    (document.getElementById('textCount').textContent =
      Array.from(preview.textContent).length + ' 字'),
    (document.documentElement.dataset.theme = presentation.theme === 'light' ? 'light' : 'dark'),
    updateRunImmediately(presentation.runImmediately === true),
    syncControls());
  const shortcutLabel = String(presentation.shortcutLabel || 'Control+Alt+Shift+C');
  if (state.phase === 'capturing') showFeedback('正在读取选中文字…');
  else
    state.phase === 'error'
      ? showFeedback(...captureError(presentation.errorReason, shortcutLabel))
      : showFeedback();
  setActiveIndex(Math.max(0, actionIds.indexOf(presentation.activeActionId)), { focus: false });
  const presentRevision = state.revision;
  (requestAnimationFrame(() => {
    if (!state.captureId || state.revision !== presentRevision || state.busy) return;
    if (state.phase === 'ready') toolbarButtons[state.activeIndex].focus({ preventScroll: true });
    else {
      if (state.phase === 'error')
        document.getElementById('closeCapture').focus({ preventScroll: true });
    }
  }),
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (!state.captureId || state.revision !== presentRevision) return;
        void api?.didPresent?.({
          captureId: state.captureId,
          presentationId: presentation.presentationId,
        })?.catch?.(() => {});
      }),
    ));
}
(actions.forEach((boundActionElement) => {
  boundActionElement.addEventListener('click', () => {
    void choose(boundActionElement.dataset.actionId);
  });
}),
  toolbarButtons.forEach((boundToolbarButton, boundToolbarButtonIndex) => {
    boundToolbarButton.addEventListener('focus', () => {
      setActiveIndex(boundToolbarButtonIndex, { focus: false });
    });
  }),
  toolbar.addEventListener(
    'wheel',
    (wheelEvent) => {
      if (!wheelEvent.ctrlKey && !wheelEvent.metaKey)
        scrollElementHorizontallyWithWheel(wheelEvent, toolbar);
    },
    { passive: false },
  ),
  more.addEventListener('click', () => {
    void setExpanded(!state.expanded);
  }),
  toggle.addEventListener('click', () => {
    updateRunImmediately(!state.runImmediately);
  }),
  retry.addEventListener('click', () => {
    if (state.failedAction)
      void choose(
        state.failedAction.actionId,
        state.failedAction.runImmediately,
        state.failedAction.rememberRunImmediately !== false,
      );
  }),
  document.getElementById('closeCapture').addEventListener('click', () => {
    void cancel();
  }),
  window.addEventListener('keydown', (keyboardEvent) => {
    if (keyboardEvent.key === 'Escape') {
      keyboardEvent.preventDefault();
      if (state.expanded) void setExpanded(false, { restoreFocus: true });
      else void cancel();
      return;
    }
    if (
      state.busy ||
      state.phase !== 'ready' ||
      state.failedAction ||
      keyboardEvent.altKey ||
      keyboardEvent.ctrlKey ||
      keyboardEvent.metaKey
    )
      return;
    const eventTarget = keyboardEvent.target;
    if (eventTarget === preview || eventTarget === toggle || eventTarget?.closest?.('#captureFeedback'))
      return;
    if (/^[1-5]$/.test(keyboardEvent.key)) {
      (keyboardEvent.preventDefault(), void choose(actionIds[Number(keyboardEvent.key) - 1]));
      return;
    }
    if (eventTarget?.closest?.('#captureDetails')) return;
    if (keyboardEvent.key === 'ArrowDown' && eventTarget === more) {
      (keyboardEvent.preventDefault(),
        void setExpanded(true).then(() => {
          if (state.expanded && !state.busy) actions[4].focus({ preventScroll: true });
        }));
      return;
    }
    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp'].includes(keyboardEvent.key)) {
      keyboardEvent.preventDefault();
      const indexStep =
        keyboardEvent.key === 'ArrowLeft' || keyboardEvent.key === 'ArrowUp' ? -1 : 1;
      setActiveIndex(
        (state.activeIndex + indexStep + toolbarButtons.length) % toolbarButtons.length,
      );
      return;
    }
    if (keyboardEvent.key === 'Enter' && eventTarget !== more) {
      keyboardEvent.preventDefault();
      const targetActionId =
        eventTarget?.closest?.('[data-action-id]')?.dataset.actionId ||
        actionIds[state.activeIndex];
      if (state.activeIndex === 4 && !eventTarget?.closest?.('[data-action-id]')) {
        void setExpanded(!state.expanded);
        return;
      }
      void choose(
        targetActionId,
        keyboardEvent.shiftKey && targetActionId?.startsWith('ai-')
          ? !state.runImmediately
          : state.runImmediately,
        !keyboardEvent.shiftKey,
      );
    }
  }),
  api?.onPresent?.(present),
  (globalThis.__presentGlobalCapture = present));
