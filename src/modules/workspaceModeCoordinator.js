import { REPLACEMENT_STUDIO_MODE_ID, REPLACEMENT_STUDIO_NAME } from './workspaceStudioModes.js';
import { runCircularRevealTransition } from '../utils/circularRevealTransition.js';
import { resolveRendererVirtualizationTier } from '../core/rendererVirtualization.js';
export const WORKSPACE_MODE_CHANGED_EVENT = 'workspaceMode:changed';
const CANVAS_MODE_ID = 'canvas',
  STORY_MODE_ID = 'story',
  REPLICATION_MODE_ID = 'replication',
  STORYBOARD_3D_MODE_ID = 'storyboard3d',
  CANVAS_MODE_VIEW_TRANSITION_BYPASS_MAX_ZOOM = 0.32,
  WORKSPACE_MODE_IDS = new Set([
    CANVAS_MODE_ID,
    STORY_MODE_ID,
    REPLICATION_MODE_ID,
    STORYBOARD_3D_MODE_ID,
    REPLACEMENT_STUDIO_MODE_ID,
  ]),
  MODE_BODY_CLASSES = Object['freeze']({
    [STORY_MODE_ID]: ['story-workspace-active'],
    [REPLICATION_MODE_ID]: ['story-workspace-active', 'replication-workspace-active'],
    [STORYBOARD_3D_MODE_ID]: ['storyboard-3d-workspace-active'],
    [REPLACEMENT_STUDIO_MODE_ID]: [
      'person-replacement-workspace-active',
      'replacement-studio-workspace-active',
    ],
  });
function normalizeWorkspaceMode(value) {
  return WORKSPACE_MODE_IDS['has'](value) ? value : CANVAS_MODE_ID;
}
export function shouldBypassCanvasModeViewTransition({
  currentMode: currentMode,
  nextMode: nextMode,
  canvasPresentationContext: canvasPresentationContext = null,
} = {}) {
  if (currentMode !== CANVAS_MODE_ID && nextMode !== CANVAS_MODE_ID) return ![];
  const item = Number(canvasPresentationContext?.['viewport']?.['zoom']);
  if (!Number['isFinite'](item) || item > CANVAS_MODE_VIEW_TRANSITION_BYPASS_MAX_ZOOM) return ![];
  return (
    resolveRendererVirtualizationTier({
      viewport: canvasPresentationContext?.['viewport'],
      nodeCount: canvasPresentationContext?.['nodeCount'],
    }) === 'very-dense-low-zoom'
  );
}
export function isStoryboard3DWorkspaceAvailable(key = globalThis['window']) {
  return key?.['AI_CANVAS_IS_DEV_BUILD'] === !![] && key?.['DEV_MODE'] === !![];
}
function renderWorkspaceModeIcon(index) {
  if (index === REPLICATION_MODE_ID)
    return '<span\x20class=\x22workspace-mode-icon\x20workspace-mode-icon--replication\x22\x20aria-hidden=\x22true\x22><svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22><rect\x20x=\x223\x22\x20y=\x225\x22\x20width=\x2213\x22\x20height=\x2214\x22\x20rx=\x222\x22/><path\x20d=\x22m16\x209\x205-3v12l-5-3M7\x209l5\x203-5\x203z\x22/></svg></span>';
  if (index === REPLACEMENT_STUDIO_MODE_ID)
    return '<span class="workspace-mode-icon workspace-mode-icon--person-replacement" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M7.5 10.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z"/><path d="M2.75 18.75v-1.5a4.75 4.75 0 0 1 4.75-4.75h1.25"/><path d="M16.5 13.75a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M12.25 20.25v-1.5A3.75 3.75 0 0 1 16 15h1a4.25 4.25 0 0 1 4.25 4.25v1"/><path d="m10.5 8.25 2-2 2 2M12.5 6.25v5"/></svg></span>';
  if (index === STORYBOARD_3D_MODE_ID)
    return '<span\x20class=\x22workspace-mode-icon\x20workspace-mode-icon--storyboard3d\x22\x20aria-hidden=\x22true\x22><svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22><path\x20d=\x22m12\x203\x208\x204.5v9L12\x2021l-8-4.5v-9z\x22/><path\x20d=\x22m4\x207.5\x208\x204.5\x208-4.5M12\x2012v9\x22/><circle\x20cx=\x2212\x22\x20cy=\x228\x22\x20r=\x221.5\x22/></svg></span>';
  if (index === STORY_MODE_ID)
    return '<span class="workspace-mode-icon workspace-mode-icon--story" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M7 3.75h8.5L19 7.25v13H7z"/><path d="M15.5 3.75v3.5H19M10 11h6M10 14.5h6M10 18h4"/></svg></span>';
  return '<span class="workspace-mode-icon workspace-mode-icon--canvas" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><rect x="3.75" y="3.75" width="6.5" height="6.5" rx="1.25"/><rect x="13.75" y="3.75" width="6.5" height="6.5" rx="1.25"/><rect x="3.75" y="13.75" width="6.5" height="6.5" rx="1.25"/><path d="M14 17h6M17 14v6"/></svg></span>';
}
export function renderWorkspaceModeSwitcher(
  result,
  {
    storyboard3DAvailable: storyboard3DAvailable = ![],
    replicationAvailable: replicationAvailable = ![],
    menuOpen: menuOpen = ![],
  } = {},
) {
  const workspaceMode = normalizeWorkspaceMode(result),
    data =
      workspaceMode === REPLICATION_MODE_ID
        ? '复刻工作室'
        : workspaceMode === STORY_MODE_ID
          ? '剧本工作室模式'
          : workspaceMode === REPLACEMENT_STUDIO_MODE_ID
            ? REPLACEMENT_STUDIO_NAME
            : workspaceMode === STORYBOARD_3D_MODE_ID
              ? '3D场景预演模式'
              : '画布模式',
    options = storyboard3DAvailable ? '' : 'disabled aria-disabled="true"',
    target = replicationAvailable ? '' : 'disabled aria-disabled="true"',
    source = ['workspace-mode-switcher', menuOpen ? 'is-open' : '']['filter'](Boolean)['join']('\x20');
  return (
    '<div class="' +
    source +
    '\x22\x20data-story-mode-switcher>\x0a\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22workspace-mode-current\x22\x20aria-haspopup=\x22menu\x22\x20aria-controls=\x22workspaceModeMenu\x22\x20aria-expanded=\x22' +
    menuOpen +
    '">\n      ' +
    renderWorkspaceModeIcon(workspaceMode) +
    '\n      <span data-story-mode-current>' +
    data +
    '</span>\n      <span class="workspace-mode-chevron" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6"/></svg></span>\n    </button>\n    <div class="workspace-mode-menu" id="workspaceModeMenu" role="menu" aria-label="工作区模式" aria-hidden="' +
    !menuOpen +
    '">\n      <button type="button" class="workspace-mode-option workspace-mode-option--canvas ' +
    (workspaceMode === CANVAS_MODE_ID ? 'is-active' : '') +
    '" data-story-workspace-mode="' +
    CANVAS_MODE_ID +
    '" role="menuitem">\n        ' +
    renderWorkspaceModeIcon(CANVAS_MODE_ID) +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22workspace-mode-option-copy\x22><span\x20class=\x22workspace-mode-option-title\x22><strong>画布模式</strong></span><small>节点创作与生成</small></span>\x0a\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22workspace-mode-option\x20workspace-mode-option--story\x20' +
    (workspaceMode === STORY_MODE_ID ? 'is-active' : '') +
    '\x22\x20data-story-workspace-mode=\x22' +
    STORY_MODE_ID +
    '" role="menuitem">\n        ' +
    renderWorkspaceModeIcon(STORY_MODE_ID) +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22workspace-mode-option-copy\x22><span\x20class=\x22workspace-mode-option-title\x22><strong>剧本工作室</strong><span\x20class=\x22workspace-mode-beta-badge\x22>beta\x20限免</span></span><small>剧本、素材与分集</small></span>\x0a\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22workspace-mode-option\x20workspace-mode-option--person-replacement\x20' +
    (workspaceMode === REPLACEMENT_STUDIO_MODE_ID ? 'is-active' : '') +
    '" data-story-workspace-mode="' +
    REPLACEMENT_STUDIO_MODE_ID +
    '" role="menuitem">\n        ' +
    renderWorkspaceModeIcon(REPLACEMENT_STUDIO_MODE_ID) +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22workspace-mode-option-copy\x22><span\x20class=\x22workspace-mode-option-title\x22><strong>' +
    REPLACEMENT_STUDIO_NAME +
    '</strong><span class="workspace-mode-beta-badge">beta</span><span class="workspace-mode-vip-badge">VIP</span></span><small>角色、镜头与声音替换</small></span>\n      </button>\n      <button type="button" class="workspace-mode-option workspace-mode-option--storyboard3d ' +
    (workspaceMode === STORYBOARD_3D_MODE_ID ? 'is-active' : '') +
    '" data-story-workspace-mode="' +
    STORYBOARD_3D_MODE_ID +
    '" role="menuitem" ' +
    options +
    '>\n        ' +
    renderWorkspaceModeIcon(STORYBOARD_3D_MODE_ID) +
    '\n        <span class="workspace-mode-option-copy"><span class="workspace-mode-option-title"><strong>3D场景预演</strong></span><small>场景、机位与镜头预演</small></span>\n      </button>\n      <button type="button" class="workspace-mode-option workspace-mode-option--replication ' +
    (workspaceMode === REPLICATION_MODE_ID ? 'is-active' : '') +
    '" data-story-workspace-mode="' +
    REPLICATION_MODE_ID +
    '" role="menuitem" ' +
    target +
    '>\n        ' +
    renderWorkspaceModeIcon(REPLICATION_MODE_ID) +
    '\n        <span class="workspace-mode-option-copy"><span class="workspace-mode-option-title"><strong>复刻工作室</strong><span class="workspace-mode-beta-badge">beta 限免</span></span></span>\n      </button>\n    </div>\n  </div>'
  );
}
function resolveMountTarget(el, next) {
  if (typeof next === 'string') return el?.['querySelector']?.(next) || null;
  return next || null;
}
export function createWorkspaceModeCoordinator({
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
  mountTarget: mountTarget = '.header',
  initialMode: initialMode = CANVAS_MODE_ID,
  canvasWorkspace: canvasWorkspace = null,
  storyWorkspace: storyWorkspace = null,
  replicationWorkspace: replicationWorkspace = null,
  storyboard3DWorkspace: storyboard3DWorkspace = null,
  replacementStudio: replacementStudio = null,
  getCanvasPresentationContext: getCanvasPresentationContext = null,
} = {}) {
  if (!documentObject?.['body']) return null;
  const el2 = resolveMountTarget(documentObject, mountTarget);
  if (!el2) return null;
  const current = el2['querySelector']?.('.workspace-mode-switcher-wrap');
  if (current?.['_workspaceModeCoordinator']) return current['_workspaceModeCoordinator'];
  const entry = Object['freeze']({
      [CANVAS_MODE_ID]: canvasWorkspace,
      [STORY_MODE_ID]: storyWorkspace,
      [REPLICATION_MODE_ID]: replicationWorkspace,
      [STORYBOARD_3D_MODE_ID]: storyboard3DWorkspace,
      [REPLACEMENT_STUDIO_MODE_ID]: replacementStudio,
    }),
    mode = (record) => {
      if (
        record === REPLICATION_MODE_ID &&
        (windowObject?.['AI_CANVAS_IS_DEV_BUILD'] !== !![] || windowObject?.['DEV_MODE'] !== !![])
      )
        return ![];
      const payload = entry[record];
      if (typeof payload?.['isAvailable'] === 'function')
        try {
          return payload['isAvailable']() !== ![];
        } catch {
          return ![];
        }
      if (record === STORYBOARD_3D_MODE_ID) return isStoryboard3DWorkspaceAvailable(windowObject);
      return !![];
    },
    workspaceMode2 = normalizeWorkspaceMode(initialMode),
    storyboard3DAvailable2 = {
      mode: mode(workspaceMode2) ? workspaceMode2 : CANVAS_MODE_ID,
      storyboard3DAvailable: mode(STORYBOARD_3D_MODE_ID),
      replicationAvailable: mode(REPLICATION_MODE_ID),
    };
  let handle = ![],
    state = 0x0,
    config = storyboard3DAvailable2['mode'],
    enabled = ![],
    enabled2 = ![],
    menuOpen2 = ![];
  const el3 = documentObject['createElement']('div');
  ((el3['className'] = 'workspace-mode-switcher-wrap'), el2['appendChild'](el3));
  const run = () => {
      ((menuOpen2 = enabled || enabled2),
        (el3['innerHTML'] = renderWorkspaceModeSwitcher(storyboard3DAvailable2['mode'], {
          storyboard3DAvailable: storyboard3DAvailable2['storyboard3DAvailable'],
          replicationAvailable: storyboard3DAvailable2['replicationAvailable'],
          menuOpen: menuOpen2,
        })));
    },
    handler = () => {
      canvasWorkspace?.['setPresentationActive']?.(storyboard3DAvailable2['mode'] === CANVAS_MODE_ID);
      const map = new Set(MODE_BODY_CLASSES[storyboard3DAvailable2['mode']] || []);
      const hiddenCanvas = storyboard3DAvailable2['mode'] !== CANVAS_MODE_ID;
      new Set(Object['values'](MODE_BODY_CLASSES)['flat']())['forEach']((scope) => {
        documentObject['body']['classList']['toggle'](scope, map['has'](scope));
      });
      for (const element of [
        documentObject['getElementById']('v2-canvas'),
        documentObject['querySelector']?.('.sidebar-floating'),
      ]) {
        if (!element) continue;
        element['setAttribute']('aria-hidden', String(hiddenCanvas));
        if (hiddenCanvas) element['setAttribute']('inert', '');
        else element['removeAttribute']?.('inert');
      }
      run();
    },
    handler2 = ({ focus: focus = '' } = {}) => {
      const enabled3 = enabled || enabled2;
      menuOpen2 = enabled3;
      const el4 = el3['querySelector']('[data-story-mode-switcher]'),
        el5 = el4?.['querySelector']('.workspace-mode-current'),
        el6 = el4?.['querySelector']('.workspace-mode-menu');
      (el4?.['classList']['toggle']('is-open', enabled3),
        el5?.['setAttribute']('aria-expanded', String(enabled3)),
        el6?.['setAttribute']('aria-hidden', String(!enabled3)));
      if (!enabled3 || !focus) return;
      const input = Array['from'](el6?.['querySelectorAll']('.workspace-mode-option:not(:disabled)') || [])[
          'filter'
        ]((output) => output['getAttribute']('aria-disabled') !== 'true'),
        el7 = focus === 'last' ? input['at'](-0x1) : input[0x0],
        handler3 = () => {
          if (!menuOpen2 || !el3['contains'](el7)) return;
          el7?.['focus']?.();
        };
      typeof windowObject?.['requestAnimationFrame'] === 'function'
        ? windowObject['requestAnimationFrame'](handler3)
        : handler3();
    },
    handler4 = (mode2, previousMode) => {
      const run2 = windowObject?.['CustomEvent'] || globalThis['CustomEvent'];
      if (typeof run2 !== 'function') return;
      windowObject?.['dispatchEvent']?.(
        new run2(WORKSPACE_MODE_CHANGED_EVENT, { detail: { mode: mode2, previousMode: previousMode } }),
      );
    },
    handler5 = (value2, { activate: activate = !![] } = {}, value3) => {
      if (handle) return ![];
      const nextMode2 = normalizeWorkspaceMode(value2);
      if (!mode(nextMode2)) return ![];
      const value4 = entry[nextMode2];
      let enabled4 = !![];
      try {
        enabled4 = value4?.['canActivate']?.() !== ![];
      } catch {
        enabled4 = ![];
      }
      if (!enabled4)
        return (
          value4?.['requestActivation']?.({
            retry: () => {
              if (handle || value3 !== state || config !== nextMode2) return ![];
              return handler5(nextMode2, { activate: activate }, value3);
            },
          }),
          ![]
        );
      const previousMode2 = storyboard3DAvailable2['mode'],
        value5 = entry[previousMode2];
      if (previousMode2 !== nextMode2) {
        let enabled5 = !![];
        try {
          enabled5 = value5?.['canDeactivate']?.({ nextMode: nextMode2 }) !== ![];
        } catch {
          enabled5 = !![];
        }
        if (!enabled5) return (value5?.['onNavigationBlocked']?.({ nextMode: nextMode2 }), ![]);
      }
      if (previousMode2 === nextMode2) {
        if (activate && [STORYBOARD_3D_MODE_ID, REPLACEMENT_STUDIO_MODE_ID]['includes'](nextMode2)) {
          const enabled6 = value4?.['activate']?.({ previousMode: previousMode2, reactivating: !![] });
          if (!enabled6) return ![];
          value4?.['onActivated']?.({ previousMode: previousMode2, reactivating: !![] });
        }
        return !![];
      }
      let enabled7 = !![];
      if (activate && nextMode2 !== CANVAS_MODE_ID) {
        enabled7 = value4?.['activate']?.({ previousMode: previousMode2 });
        if (!enabled7) return ![];
      }
      ((storyboard3DAvailable2['mode'] = nextMode2), handler());
      const value6 = value5?.['deactivate']?.({ nextMode: nextMode2 });
      if (value6 === ![])
        return (
          (storyboard3DAvailable2['mode'] = previousMode2),
          handler(),
          value4?.['deactivate']?.({ nextMode: previousMode2, rollback: !![] }),
          value5?.['onNavigationBlocked']?.({ nextMode: nextMode2 }),
          ![]
        );
      handler4(nextMode2, previousMode2);
      if (activate && enabled7) value4?.['onActivated']?.({ previousMode: previousMode2 });
      return !![];
    },
    setMode = (value7, value8 = {}) => {
      const workspaceMode3 = normalizeWorkspaceMode(value7);
      return ((config = workspaceMode3), (state += 0x1), handler5(workspaceMode3, value8, state));
    },
    resumePendingMode = (value9) => {
      const workspaceMode4 = normalizeWorkspaceMode(value9);
      if (handle || config !== workspaceMode4) return ![];
      return handler5(workspaceMode4, {}, state);
    },
    refreshAvailability = () => {
      if (handle) return ![];
      const value10 = mode(STORYBOARD_3D_MODE_ID),
        value11 = mode(REPLICATION_MODE_ID),
        enabled8 =
          storyboard3DAvailable2['storyboard3DAvailable'] !== value10 ||
          storyboard3DAvailable2['replicationAvailable'] !== value11;
      if (!enabled8) return ![];
      return (
        (storyboard3DAvailable2['storyboard3DAvailable'] = value10),
        (storyboard3DAvailable2['replicationAvailable'] = value11),
        !mode(storyboard3DAvailable2['mode']) ? setMode(CANVAS_MODE_ID) : run(),
        !![]
      );
    },
    value12 = () => {
      ((enabled = !![]), handler2());
    },
    value13 = () => {
      ((enabled = ![]), handler2());
    },
    value14 = (event) => {
      if (el3['contains'](event['target'])) {
        event['target']['matches']?.(':focus-visible') && ((enabled2 = !![]), handler2());
        return;
      }
      if (!enabled2) return;
      ((enabled2 = ![]), handler2());
    },
    value15 = (focus2) => {
      const value16 = focus2['target']['closest']?.('.workspace-mode-current'),
        enabled9 = focus2['target']['closest']?.('.workspace-mode-option');
      if (focus2['key'] === 'Escape' && menuOpen2) {
        (focus2['preventDefault'](),
          el3['querySelector']('.workspace-mode-current')?.['focus']?.(),
          (enabled2 = ![]),
          (enabled = ![]),
          handler2());
        return;
      }
      if (value16 && (focus2['key'] === 'ArrowDown' || focus2['key'] === 'ArrowUp')) {
        (focus2['preventDefault'](),
          (enabled2 = !![]),
          handler2({ focus: focus2['key'] === 'ArrowUp' ? 'last' : 'first' }));
        return;
      }
      if (!enabled9 || !menuOpen2) return;
      const list = Array['from'](el3['querySelectorAll']('.workspace-mode-option:not(:disabled)'))['filter'](
          (value17) => value17['getAttribute']('aria-disabled') !== 'true',
        ),
        value18 = list['indexOf'](enabled9);
      let value19 = value18;
      if (focus2['key'] === 'ArrowDown') value19 = (value18 + 0x1) % list['length'];
      else {
        if (focus2['key'] === 'ArrowUp') value19 = (value18 - 0x1 + list['length']) % list['length'];
        else {
          if (focus2['key'] === 'Home') value19 = 0x0;
          else {
            if (focus2['key'] === 'End') value19 = list['length'] - 0x1;
            else return;
          }
        }
      }
      (focus2['preventDefault'](), list[value19]?.['focus']?.());
    },
    value20 = (event2) => {
      const value21 = event2['target']['closest']?.('.workspace-mode-current');
      if (value21 && el3['contains'](value21)) return;
      const el8 = event2['target']['closest']?.('[data-story-workspace-mode]');
      if (!el8 || !el3['contains'](el8)) return;
      if (el8['disabled'] || el8['getAttribute']('aria-disabled') === 'true') {
        event2['preventDefault']();
        return;
      }
      const nextMode3 = el8['dataset']['storyWorkspaceMode'];
      if (nextMode3 === storyboard3DAvailable2['mode'] && nextMode3 !== STORYBOARD_3D_MODE_ID) {
        ((enabled = ![]), (enabled2 = ![]), handler2(), setMode(nextMode3));
        el3.querySelector('.workspace-mode-current')?.focus?.({ preventScroll: !![] });
        return;
      }
      const sourceElement = el3['querySelector']('.workspace-mode-current'),
        apply = () => {
          ((enabled = ![]), (enabled2 = ![]), handler2(), setMode(nextMode3));
          el3.querySelector('.workspace-mode-current')?.focus?.({ preventScroll: !![] });
        };
      let canvasPresentationContext2 = null;
      try {
        canvasPresentationContext2 = getCanvasPresentationContext?.() || null;
      } catch {
        canvasPresentationContext2 = null;
      }
      if (
        shouldBypassCanvasModeViewTransition({
          currentMode: storyboard3DAvailable2['mode'],
          nextMode: nextMode3,
          canvasPresentationContext: canvasPresentationContext2,
        })
      ) {
        apply();
        return;
      }
      runCircularRevealTransition({
        sourceElement: sourceElement,
        apply: apply,
        documentObject: documentObject,
        windowObject: windowObject,
        rootClassName: 'workspace-mode-reveal-transitioning',
        duration: 0x2f8,
      });
    },
    value22 = Object['freeze']({
      setMode: setMode,
      getMode: () => storyboard3DAvailable2['mode'],
      resumePendingMode: resumePendingMode,
      refreshAvailability: refreshAvailability,
      destroy() {
        if (handle) return;
        ((handle = !![]),
          el3['removeEventListener']('click', value20),
          el3['removeEventListener']('pointerenter', value12),
          el3['removeEventListener']('pointerleave', value13),
          el3['removeEventListener']('keydown', value15),
          documentObject['removeEventListener']('focusin', value14),
          windowObject?.['removeEventListener']?.('aicanvas:runtime-info', refreshAvailability),
          windowObject?.['removeEventListener']?.('dev-mode-changed', refreshAvailability),
          Object['values'](MODE_BODY_CLASSES)
            ['flat']()
            ['forEach']((value23) => {
              documentObject['body']['classList']['remove'](value23);
            }),
          documentObject['getElementById']('v2-canvas')?.['setAttribute']('aria-hidden', 'false'),
          el3['remove']());
      },
    });
  return (
    (el3['_workspaceModeCoordinator'] = value22),
    el3['addEventListener']('click', value20),
    el3['addEventListener']('pointerenter', value12),
    el3['addEventListener']('pointerleave', value13),
    el3['addEventListener']('keydown', value15),
    documentObject['addEventListener']('focusin', value14),
    windowObject?.['addEventListener']?.('aicanvas:runtime-info', refreshAvailability),
    windowObject?.['addEventListener']?.('dev-mode-changed', refreshAvailability),
    handler(),
    value22
  );
}
