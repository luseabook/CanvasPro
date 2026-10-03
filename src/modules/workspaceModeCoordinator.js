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
function normalizeWorkspaceMode(_0x18335a) {
  return WORKSPACE_MODE_IDS['has'](_0x18335a) ? _0x18335a : CANVAS_MODE_ID;
}
export function shouldBypassCanvasModeViewTransition({
  currentMode: _0x5cbb01,
  nextMode: _0x568767,
  canvasPresentationContext: canvasPresentationContext = null,
} = {}) {
  if (_0x5cbb01 !== CANVAS_MODE_ID && _0x568767 !== CANVAS_MODE_ID) return ![];
  const _0x46c244 = Number(canvasPresentationContext?.['viewport']?.['zoom']);
  if (!Number['isFinite'](_0x46c244) || _0x46c244 > CANVAS_MODE_VIEW_TRANSITION_BYPASS_MAX_ZOOM) return ![];
  return (
    resolveRendererVirtualizationTier({
      viewport: canvasPresentationContext?.['viewport'],
      nodeCount: canvasPresentationContext?.['nodeCount'],
    }) === 'very-dense-low-zoom'
  );
}
export function isStoryboard3DWorkspaceAvailable(_0x34995a = globalThis['window']) {
  return _0x34995a?.['AI_CANVAS_IS_DEV_BUILD'] === !![] && _0x34995a?.['DEV_MODE'] === !![];
}
function renderWorkspaceModeIcon(_0x1885b0) {
  if (_0x1885b0 === REPLICATION_MODE_ID)
    return '<span\x20class=\x22workspace-mode-icon\x20workspace-mode-icon--replication\x22\x20aria-hidden=\x22true\x22><svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22><rect\x20x=\x223\x22\x20y=\x225\x22\x20width=\x2213\x22\x20height=\x2214\x22\x20rx=\x222\x22/><path\x20d=\x22m16\x209\x205-3v12l-5-3M7\x209l5\x203-5\x203z\x22/></svg></span>';
  if (_0x1885b0 === REPLACEMENT_STUDIO_MODE_ID)
    return '<span class="workspace-mode-icon workspace-mode-icon--person-replacement" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M7.5 10.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z"/><path d="M2.75 18.75v-1.5a4.75 4.75 0 0 1 4.75-4.75h1.25"/><path d="M16.5 13.75a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M12.25 20.25v-1.5A3.75 3.75 0 0 1 16 15h1a4.25 4.25 0 0 1 4.25 4.25v1"/><path d="m10.5 8.25 2-2 2 2M12.5 6.25v5"/></svg></span>';
  if (_0x1885b0 === STORYBOARD_3D_MODE_ID)
    return '<span\x20class=\x22workspace-mode-icon\x20workspace-mode-icon--storyboard3d\x22\x20aria-hidden=\x22true\x22><svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22><path\x20d=\x22m12\x203\x208\x204.5v9L12\x2021l-8-4.5v-9z\x22/><path\x20d=\x22m4\x207.5\x208\x204.5\x208-4.5M12\x2012v9\x22/><circle\x20cx=\x2212\x22\x20cy=\x228\x22\x20r=\x221.5\x22/></svg></span>';
  if (_0x1885b0 === STORY_MODE_ID)
    return '<span class="workspace-mode-icon workspace-mode-icon--story" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M7 3.75h8.5L19 7.25v13H7z"/><path d="M15.5 3.75v3.5H19M10 11h6M10 14.5h6M10 18h4"/></svg></span>';
  return '<span class="workspace-mode-icon workspace-mode-icon--canvas" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><rect x="3.75" y="3.75" width="6.5" height="6.5" rx="1.25"/><rect x="13.75" y="3.75" width="6.5" height="6.5" rx="1.25"/><rect x="3.75" y="13.75" width="6.5" height="6.5" rx="1.25"/><path d="M14 17h6M17 14v6"/></svg></span>';
}
export function renderWorkspaceModeSwitcher(
  _0xc3c861,
  {
    storyboard3DAvailable: storyboard3DAvailable = ![],
    replicationAvailable: replicationAvailable = ![],
    menuOpen: menuOpen = ![],
  } = {},
) {
  const _0x3479ee = normalizeWorkspaceMode(_0xc3c861),
    _0x23918a =
      _0x3479ee === REPLICATION_MODE_ID
        ? '复刻工作室'
        : _0x3479ee === STORY_MODE_ID
          ? '剧本工作室模式'
          : _0x3479ee === REPLACEMENT_STUDIO_MODE_ID
            ? REPLACEMENT_STUDIO_NAME
            : _0x3479ee === STORYBOARD_3D_MODE_ID
              ? '3D场景预演模式'
              : '画布模式',
    _0x280c42 = storyboard3DAvailable ? '' : 'disabled aria-disabled="true"',
    _0x31eb10 = replicationAvailable ? '' : 'disabled aria-disabled="true"',
    _0x2ecbbc = ['workspace-mode-switcher', menuOpen ? 'is-open' : '']['filter'](Boolean)['join']('\x20');
  return (
    '<div class="' +
    _0x2ecbbc +
    '\x22\x20data-story-mode-switcher>\x0a\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22workspace-mode-current\x22\x20aria-haspopup=\x22menu\x22\x20aria-controls=\x22workspaceModeMenu\x22\x20aria-expanded=\x22' +
    menuOpen +
    '">\n      ' +
    renderWorkspaceModeIcon(_0x3479ee) +
    '\n      <span data-story-mode-current>' +
    _0x23918a +
    '</span>\n      <span class="workspace-mode-chevron" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6"/></svg></span>\n    </button>\n    <div class="workspace-mode-menu" id="workspaceModeMenu" role="menu" aria-label="工作区模式" aria-hidden="' +
    !menuOpen +
    '">\n      <button type="button" class="workspace-mode-option workspace-mode-option--canvas ' +
    (_0x3479ee === CANVAS_MODE_ID ? 'is-active' : '') +
    '" data-story-workspace-mode="' +
    CANVAS_MODE_ID +
    '" role="menuitem">\n        ' +
    renderWorkspaceModeIcon(CANVAS_MODE_ID) +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22workspace-mode-option-copy\x22><span\x20class=\x22workspace-mode-option-title\x22><strong>画布模式</strong></span><small>节点创作与生成</small></span>\x0a\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22workspace-mode-option\x20workspace-mode-option--story\x20' +
    (_0x3479ee === STORY_MODE_ID ? 'is-active' : '') +
    '\x22\x20data-story-workspace-mode=\x22' +
    STORY_MODE_ID +
    '" role="menuitem">\n        ' +
    renderWorkspaceModeIcon(STORY_MODE_ID) +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22workspace-mode-option-copy\x22><span\x20class=\x22workspace-mode-option-title\x22><strong>剧本工作室</strong><span\x20class=\x22workspace-mode-beta-badge\x22>beta\x20限免</span></span><small>剧本、素材与分集</small></span>\x0a\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22workspace-mode-option\x20workspace-mode-option--person-replacement\x20' +
    (_0x3479ee === REPLACEMENT_STUDIO_MODE_ID ? 'is-active' : '') +
    '" data-story-workspace-mode="' +
    REPLACEMENT_STUDIO_MODE_ID +
    '" role="menuitem">\n        ' +
    renderWorkspaceModeIcon(REPLACEMENT_STUDIO_MODE_ID) +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22workspace-mode-option-copy\x22><span\x20class=\x22workspace-mode-option-title\x22><strong>' +
    REPLACEMENT_STUDIO_NAME +
    '</strong><span class="workspace-mode-beta-badge">beta</span><span class="workspace-mode-vip-badge">VIP</span></span><small>角色、镜头与声音替换</small></span>\n      </button>\n      <button type="button" class="workspace-mode-option workspace-mode-option--storyboard3d ' +
    (_0x3479ee === STORYBOARD_3D_MODE_ID ? 'is-active' : '') +
    '" data-story-workspace-mode="' +
    STORYBOARD_3D_MODE_ID +
    '" role="menuitem" ' +
    _0x280c42 +
    '>\n        ' +
    renderWorkspaceModeIcon(STORYBOARD_3D_MODE_ID) +
    '\n        <span class="workspace-mode-option-copy"><span class="workspace-mode-option-title"><strong>3D场景预演</strong></span><small>场景、机位与镜头预演</small></span>\n      </button>\n      <button type="button" class="workspace-mode-option workspace-mode-option--replication ' +
    (_0x3479ee === REPLICATION_MODE_ID ? 'is-active' : '') +
    '" data-story-workspace-mode="' +
    REPLICATION_MODE_ID +
    '" role="menuitem" ' +
    _0x31eb10 +
    '>\n        ' +
    renderWorkspaceModeIcon(REPLICATION_MODE_ID) +
    '\n        <span class="workspace-mode-option-copy"><span class="workspace-mode-option-title"><strong>复刻工作室</strong><span class="workspace-mode-beta-badge">beta 限免</span></span></span>\n      </button>\n    </div>\n  </div>'
  );
}
function resolveMountTarget(_0x5bf220, _0x53d24f) {
  if (typeof _0x53d24f === 'string') return _0x5bf220?.['querySelector']?.(_0x53d24f) || null;
  return _0x53d24f || null;
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
  const _0x13ff23 = resolveMountTarget(documentObject, mountTarget);
  if (!_0x13ff23) return null;
  const _0x4c66c6 = _0x13ff23['querySelector']?.('.workspace-mode-switcher-wrap');
  if (_0x4c66c6?.['_workspaceModeCoordinator']) return _0x4c66c6['_workspaceModeCoordinator'];
  const _0x25a00a = Object['freeze']({
      [CANVAS_MODE_ID]: canvasWorkspace,
      [STORY_MODE_ID]: storyWorkspace,
      [REPLICATION_MODE_ID]: replicationWorkspace,
      [STORYBOARD_3D_MODE_ID]: storyboard3DWorkspace,
      [REPLACEMENT_STUDIO_MODE_ID]: replacementStudio,
    }),
    _0x1c4bb4 = (_0x3d2a31) => {
      if (
        _0x3d2a31 === REPLICATION_MODE_ID &&
        (windowObject?.['AI_CANVAS_IS_DEV_BUILD'] !== !![] || windowObject?.['DEV_MODE'] !== !![])
      )
        return ![];
      const _0x59f1c7 = _0x25a00a[_0x3d2a31];
      if (typeof _0x59f1c7?.['isAvailable'] === 'function')
        try {
          return _0x59f1c7['isAvailable']() !== ![];
        } catch {
          return ![];
        }
      if (_0x3d2a31 === STORYBOARD_3D_MODE_ID) return isStoryboard3DWorkspaceAvailable(windowObject);
      return !![];
    },
    _0x1b0e65 = normalizeWorkspaceMode(initialMode),
    _0x10437f = {
      mode: _0x1c4bb4(_0x1b0e65) ? _0x1b0e65 : CANVAS_MODE_ID,
      storyboard3DAvailable: _0x1c4bb4(STORYBOARD_3D_MODE_ID),
      replicationAvailable: _0x1c4bb4(REPLICATION_MODE_ID),
    };
  let _0xd1aeb0 = ![],
    _0x294919 = 0x0,
    _0x46fc8c = _0x10437f['mode'],
    _0x2e0402 = ![],
    _0x34892a = ![],
    _0x52dbad = ![];
  const _0xff80ed = documentObject['createElement']('div');
  ((_0xff80ed['className'] = 'workspace-mode-switcher-wrap'), _0x13ff23['appendChild'](_0xff80ed));
  const _0x3ec2b6 = () => {
      ((_0x52dbad = _0x2e0402 || _0x34892a),
        (_0xff80ed['innerHTML'] = renderWorkspaceModeSwitcher(_0x10437f['mode'], {
          storyboard3DAvailable: _0x10437f['storyboard3DAvailable'],
          replicationAvailable: _0x10437f['replicationAvailable'],
          menuOpen: _0x52dbad,
        })));
    },
    _0x510317 = () => {
      canvasWorkspace?.['setPresentationActive']?.(_0x10437f['mode'] === CANVAS_MODE_ID);
      const _0x54349b = new Set(MODE_BODY_CLASSES[_0x10437f['mode']] || []);
      const hiddenCanvas = _0x10437f['mode'] !== CANVAS_MODE_ID;
      (new Set(Object['values'](MODE_BODY_CLASSES)['flat']())['forEach']((_0x15ea37) => {
        documentObject['body']['classList']['toggle'](_0x15ea37, _0x54349b['has'](_0x15ea37));
      }));
      for (const element of [documentObject['getElementById']('v2-canvas'), documentObject['querySelector']?.('.sidebar-floating')]) {
        if (!element) continue;
        element['setAttribute']('aria-hidden', String(hiddenCanvas));
        if (hiddenCanvas) element['setAttribute']('inert', '');
        else element['removeAttribute']?.('inert');
      }
      _0x3ec2b6();
    },
    _0x2f912c = ({ focus: focus = '' } = {}) => {
      const _0x3a753c = _0x2e0402 || _0x34892a;
      _0x52dbad = _0x3a753c;
      const _0x49e6d5 = _0xff80ed['querySelector']('[data-story-mode-switcher]'),
        _0x50444a = _0x49e6d5?.['querySelector']('.workspace-mode-current'),
        _0x1f3c47 = _0x49e6d5?.['querySelector']('.workspace-mode-menu');
      (_0x49e6d5?.['classList']['toggle']('is-open', _0x3a753c),
        _0x50444a?.['setAttribute']('aria-expanded', String(_0x3a753c)),
        _0x1f3c47?.['setAttribute']('aria-hidden', String(!_0x3a753c)));
      if (!_0x3a753c || !focus) return;
      const _0xdb7957 = Array['from'](
          _0x1f3c47?.['querySelectorAll']('.workspace-mode-option:not(:disabled)') || [],
        )['filter']((_0x245e6b) => _0x245e6b['getAttribute']('aria-disabled') !== 'true'),
        _0x15915a = focus === 'last' ? _0xdb7957['at'](-0x1) : _0xdb7957[0x0],
        _0x1ac9e6 = () => {
          if (!_0x52dbad || !_0xff80ed['contains'](_0x15915a)) return;
          _0x15915a?.['focus']?.();
        };
      typeof windowObject?.['requestAnimationFrame'] === 'function'
        ? windowObject['requestAnimationFrame'](_0x1ac9e6)
        : _0x1ac9e6();
    },
    _0x3bf98b = (_0x38a980, _0xf52232) => {
      const _0xf3619f = windowObject?.['CustomEvent'] || globalThis['CustomEvent'];
      if (typeof _0xf3619f !== 'function') return;
      windowObject?.['dispatchEvent']?.(
        new _0xf3619f(WORKSPACE_MODE_CHANGED_EVENT, { detail: { mode: _0x38a980, previousMode: _0xf52232 } }),
      );
    },
    _0x253245 = (_0x267446, { activate: activate = !![] } = {}, _0x34a2a6) => {
      if (_0xd1aeb0) return ![];
      const _0x1a94dc = normalizeWorkspaceMode(_0x267446);
      if (!_0x1c4bb4(_0x1a94dc)) return ![];
      const _0x49b3e1 = _0x25a00a[_0x1a94dc];
      let _0x40e0d5 = !![];
      try {
        _0x40e0d5 = _0x49b3e1?.['canActivate']?.() !== ![];
      } catch {
        _0x40e0d5 = ![];
      }
      if (!_0x40e0d5)
        return (
          _0x49b3e1?.['requestActivation']?.({
            retry: () => {
              if (_0xd1aeb0 || _0x34a2a6 !== _0x294919 || _0x46fc8c !== _0x1a94dc) return ![];
              return _0x253245(_0x1a94dc, { activate: activate }, _0x34a2a6);
            },
          }),
          ![]
        );
      const _0x266424 = _0x10437f['mode'],
        _0x558210 = _0x25a00a[_0x266424];
      if (_0x266424 !== _0x1a94dc) {
        let _0xef3b48 = !![];
        try {
          _0xef3b48 = _0x558210?.['canDeactivate']?.({ nextMode: _0x1a94dc }) !== ![];
        } catch {
          _0xef3b48 = !![];
        }
        if (!_0xef3b48) return (_0x558210?.['onNavigationBlocked']?.({ nextMode: _0x1a94dc }), ![]);
      }
      if (_0x266424 === _0x1a94dc) {
        if (activate && [STORYBOARD_3D_MODE_ID, REPLACEMENT_STUDIO_MODE_ID]['includes'](_0x1a94dc)) {
          const _0x4c37b2 = _0x49b3e1?.['activate']?.({ previousMode: _0x266424, reactivating: !![] });
          if (!_0x4c37b2) return ![];
          _0x49b3e1?.['onActivated']?.({ previousMode: _0x266424, reactivating: !![] });
        }
        return !![];
      }
      let _0x42632d = !![];
      if (activate && _0x1a94dc !== CANVAS_MODE_ID) {
        _0x42632d = _0x49b3e1?.['activate']?.({ previousMode: _0x266424 });
        if (!_0x42632d) return ![];
      }
      ((_0x10437f['mode'] = _0x1a94dc), _0x510317());
      const _0x2e4991 = _0x558210?.['deactivate']?.({ nextMode: _0x1a94dc });
      if (_0x2e4991 === ![])
        return (
          (_0x10437f['mode'] = _0x266424),
          _0x510317(),
          _0x49b3e1?.['deactivate']?.({ nextMode: _0x266424, rollback: !![] }),
          _0x558210?.['onNavigationBlocked']?.({ nextMode: _0x1a94dc }),
          ![]
        );
      _0x3bf98b(_0x1a94dc, _0x266424);
      if (activate && _0x42632d) _0x49b3e1?.['onActivated']?.({ previousMode: _0x266424 });
      return !![];
    },
    _0x428779 = (_0x1c2887, _0x23bc2a = {}) => {
      const _0x12fb31 = normalizeWorkspaceMode(_0x1c2887);
      return ((_0x46fc8c = _0x12fb31), (_0x294919 += 0x1), _0x253245(_0x12fb31, _0x23bc2a, _0x294919));
    },
    _0x2c0833 = (_0x43d43f) => {
      const _0x3625b7 = normalizeWorkspaceMode(_0x43d43f);
      if (_0xd1aeb0 || _0x46fc8c !== _0x3625b7) return ![];
      return _0x253245(_0x3625b7, {}, _0x294919);
    },
    _0x535f49 = () => {
      if (_0xd1aeb0) return ![];
      const _0x3588e4 = _0x1c4bb4(STORYBOARD_3D_MODE_ID),
        _0x3e05f8 = _0x1c4bb4(REPLICATION_MODE_ID),
        _0x54b167 =
          _0x10437f['storyboard3DAvailable'] !== _0x3588e4 || _0x10437f['replicationAvailable'] !== _0x3e05f8;
      if (!_0x54b167) return ![];
      return (
        (_0x10437f['storyboard3DAvailable'] = _0x3588e4),
        (_0x10437f['replicationAvailable'] = _0x3e05f8),
        !_0x1c4bb4(_0x10437f['mode']) ? _0x428779(CANVAS_MODE_ID) : _0x3ec2b6(),
        !![]
      );
    },
    _0x12f54e = () => {
      ((_0x2e0402 = !![]), _0x2f912c());
    },
    _0x48970d = () => {
      ((_0x2e0402 = ![]), _0x2f912c());
    },
    _0xed25cd = (_0x43549d) => {
      if (_0xff80ed['contains'](_0x43549d['target'])) {
        _0x43549d['target']['matches']?.(':focus-visible') && ((_0x34892a = !![]), _0x2f912c());
        return;
      }
      if (!_0x34892a) return;
      ((_0x34892a = ![]), _0x2f912c());
    },
    _0x1b9ccf = (_0x1658ad) => {
      const _0x288e2a = _0x1658ad['target']['closest']?.('.workspace-mode-current'),
        _0x4b251b = _0x1658ad['target']['closest']?.('.workspace-mode-option');
      if (_0x1658ad['key'] === 'Escape' && _0x52dbad) {
        (_0x1658ad['preventDefault'](),
          _0xff80ed['querySelector']('.workspace-mode-current')?.['focus']?.(),
          (_0x34892a = ![]),
          (_0x2e0402 = ![]),
          _0x2f912c());
        return;
      }
      if (_0x288e2a && (_0x1658ad['key'] === 'ArrowDown' || _0x1658ad['key'] === 'ArrowUp')) {
        (_0x1658ad['preventDefault'](),
          (_0x34892a = !![]),
          _0x2f912c({ focus: _0x1658ad['key'] === 'ArrowUp' ? 'last' : 'first' }));
        return;
      }
      if (!_0x4b251b || !_0x52dbad) return;
      const _0x11fcda = Array['from'](_0xff80ed['querySelectorAll']('.workspace-mode-option:not(:disabled)'))[
          'filter'
        ]((_0x3f623a) => _0x3f623a['getAttribute']('aria-disabled') !== 'true'),
        _0x570c85 = _0x11fcda['indexOf'](_0x4b251b);
      let _0x482d13 = _0x570c85;
      if (_0x1658ad['key'] === 'ArrowDown') _0x482d13 = (_0x570c85 + 0x1) % _0x11fcda['length'];
      else {
        if (_0x1658ad['key'] === 'ArrowUp')
          _0x482d13 = (_0x570c85 - 0x1 + _0x11fcda['length']) % _0x11fcda['length'];
        else {
          if (_0x1658ad['key'] === 'Home') _0x482d13 = 0x0;
          else {
            if (_0x1658ad['key'] === 'End') _0x482d13 = _0x11fcda['length'] - 0x1;
            else return;
          }
        }
      }
      (_0x1658ad['preventDefault'](), _0x11fcda[_0x482d13]?.['focus']?.());
    },
    _0x31bb2d = (_0x57d12f) => {
      const _0x4a0dbe = _0x57d12f['target']['closest']?.('.workspace-mode-current');
      if (_0x4a0dbe && _0xff80ed['contains'](_0x4a0dbe)) return;
      const _0x572647 = _0x57d12f['target']['closest']?.('[data-story-workspace-mode]');
      if (!_0x572647 || !_0xff80ed['contains'](_0x572647)) return;
      if (_0x572647['disabled'] || _0x572647['getAttribute']('aria-disabled') === 'true') {
        _0x57d12f['preventDefault']();
        return;
      }
      const _0x17bc21 = _0x572647['dataset']['storyWorkspaceMode'];
      if (_0x17bc21 === _0x10437f['mode'] && _0x17bc21 !== STORYBOARD_3D_MODE_ID) {
        ((_0x2e0402 = ![]), (_0x34892a = ![]), _0x2f912c(), _0x428779(_0x17bc21));
        _0xff80ed.querySelector('.workspace-mode-current')?.focus?.({ preventScroll: !![] });
        return;
      }
      const _0x4ce0b2 = _0xff80ed['querySelector']('.workspace-mode-current'),
        _0x161370 = () => {
          ((_0x2e0402 = ![]), (_0x34892a = ![]), _0x2f912c(), _0x428779(_0x17bc21));
          _0xff80ed.querySelector('.workspace-mode-current')?.focus?.({ preventScroll: !![] });
        };
      let _0x5a5030 = null;
      try {
        _0x5a5030 = getCanvasPresentationContext?.() || null;
      } catch {
        _0x5a5030 = null;
      }
      if (
        shouldBypassCanvasModeViewTransition({
          currentMode: _0x10437f['mode'],
          nextMode: _0x17bc21,
          canvasPresentationContext: _0x5a5030,
        })
      ) {
        _0x161370();
        return;
      }
      runCircularRevealTransition({
        sourceElement: _0x4ce0b2,
        apply: _0x161370,
        documentObject: documentObject,
        windowObject: windowObject,
        rootClassName: 'workspace-mode-reveal-transitioning',
        duration: 0x2f8,
      });
    },
    _0x4a2f98 = Object['freeze']({
      setMode: _0x428779,
      getMode: () => _0x10437f['mode'],
      resumePendingMode: _0x2c0833,
      refreshAvailability: _0x535f49,
      destroy() {
        if (_0xd1aeb0) return;
        ((_0xd1aeb0 = !![]),
          _0xff80ed['removeEventListener']('click', _0x31bb2d),
          _0xff80ed['removeEventListener']('pointerenter', _0x12f54e),
          _0xff80ed['removeEventListener']('pointerleave', _0x48970d),
          _0xff80ed['removeEventListener']('keydown', _0x1b9ccf),
          documentObject['removeEventListener']('focusin', _0xed25cd),
          windowObject?.['removeEventListener']?.('aicanvas:runtime-info', _0x535f49),
          windowObject?.['removeEventListener']?.('dev-mode-changed', _0x535f49),
          Object['values'](MODE_BODY_CLASSES)
            ['flat']()
            ['forEach']((_0x507ad2) => {
              documentObject['body']['classList']['remove'](_0x507ad2);
            }),
          documentObject['getElementById']('v2-canvas')?.['setAttribute']('aria-hidden', 'false'),
          _0xff80ed['remove']());
      },
    });
  return (
    (_0xff80ed['_workspaceModeCoordinator'] = _0x4a2f98),
    _0xff80ed['addEventListener']('click', _0x31bb2d),
    _0xff80ed['addEventListener']('pointerenter', _0x12f54e),
    _0xff80ed['addEventListener']('pointerleave', _0x48970d),
    _0xff80ed['addEventListener']('keydown', _0x1b9ccf),
    documentObject['addEventListener']('focusin', _0xed25cd),
    windowObject?.['addEventListener']?.('aicanvas:runtime-info', _0x535f49),
    windowObject?.['addEventListener']?.('dev-mode-changed', _0x535f49),
    _0x510317(),
    _0x4a2f98
  );
}
