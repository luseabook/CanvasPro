import appStore from '../core/stores/appStore.js';
import { captureExternalProjectTarget, createSerialExternalProjectOpener, runGuardedExternalProjectOpen } from './externalProjectOpen.js';
import { runFullProjectPackage, showRetainedProjectPackage } from './projectPackage/fullProjectPackageSession.js';
import * as project from './project.js';
import { commit } from './history.js';
import { clearRendererCache } from '../core/renderer.js';
import { clearElement, setStaticInnerHTML, setText } from '../utils/dom.js';
import { sanitizeMultiCanvasDataForPersistence } from '../utils/thumbnailPersistence.js';
import { requireOpenedProjectDocument } from '../services/projectDocumentGuard.js';
import {
  canUseDesktopProjectApi,
  exportDesktopProjectPackage,
  importDesktopProjectPackage,
  openDesktopProject,
  saveDesktopProject,
} from '../services/desktopProjectService.js';
import { deleteV2ProjectFromServer, fetchV2ProjectsFromServer } from '../../api/projectsV2Api.js';
import { closeSidebarSubmenu, registerSidebarSubmenu } from './sidebarSubmenuController.js';
import { t } from '../i18n/index.js';
const PROJECT_FILE_EXTENSION_RE = /\.(?:aicanvas|aicproj|json)$/i;
function projectDropdownText(_0x3c6048, _0x1e7154 = {}) {
  return t('projectDropdown.' + _0x3c6048, _0x1e7154);
}
function stripProjectFileExtensionFromName(_0x58a00b) {
  return String(_0x58a00b || '').replace(PROJECT_FILE_EXTENSION_RE, '');
}
const CanvasProjectDropdownManager = {
  init() {
    const _0x395cea = 12,
      _0x488602 = 12,
      _0x4a31ca = document.getElementById('btnCanvasLogo'),
      _0x17787e = document.getElementById('canvasProjDropdown'),
      _0x5447f2 = _0x17787e?.querySelector('.cpd-header'),
      _0x546e10 = document.getElementById('canvasProjList'),
      _0x2d158e = document.getElementById('btnCloseProjDropdown'),
      _0x514753 = document.getElementById('btnNewCanvas'),
      _0x1a9acb = document.getElementById('saveDialogOverlay'),
      _0x213c8b = document.getElementById('saveDialogInput'),
      _0x491f0e = document.getElementById('saveDialogCancel'),
      _0x28e91c = document.getElementById('saveDialogConfirm');
    if (!_0x4a31ca || !_0x17787e || !_0x1a9acb) return;
    document.body.appendChild(_0x17787e);
    function _0x37e63d() {
      if (!_0x4a31ca || !_0x17787e) return;
      const _0x199d60 = _0x4a31ca.getBoundingClientRect(),
        _0x194168 = _0x17787e.classList.contains('open');
      if (!_0x194168) _0x17787e.classList.add('open');
      const _0x4b0f59 = _0x17787e.getBoundingClientRect().height || _0x17787e.offsetHeight || 0,
        _0x262137 = _0x199d60.top + (_0x199d60.height - _0x4b0f59) / 2,
        _0x29c0c9 = window.innerHeight - _0x4b0f59 - _0x488602,
        _0x3b8d9e = _0x29c0c9 <= _0x488602 ? _0x488602 : Math.min(Math.max(_0x262137, _0x488602), _0x29c0c9);
      ((_0x17787e.style.left = _0x199d60.right + _0x395cea + 'px'), (_0x17787e.style.top = _0x3b8d9e + 'px'));
      if (!_0x194168) _0x17787e.classList.remove('open');
    }
    function _0x40d4b1(_0x49bfda) {
      const _0x9ae133 = new Date(_0x49bfda * 0x3e8);
      return (
        _0x9ae133.getFullYear() +
        '-' +
        String(_0x9ae133.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(_0x9ae133.getDate()).padStart(2, '0') +
        ' ' +
        String(_0x9ae133.getHours()).padStart(2, '0') +
        ':' +
        String(_0x9ae133.getMinutes()).padStart(2, '0')
      );
    }
    function _0x230ab7() {
      const _0x115fb3 = document.getElementById('projectNameText');
      return String(_0x115fb3?.textContent || '').trim() || projectDropdownText('unnamedCanvas');
    }
    function _0x5cf67d(_0x8c9da8) {
      const _0x2c7f27 = String(_0x8c9da8 || '').trim();
      if (!_0x2c7f27) return true;
      const _0x26c2b9 = new Set(
        [
          '新项目',
          'New project',
          projectDropdownText('unnamedCanvas'),
          t('project.newProject'),
          t('projectManager.newProjectFallback'),
          t('projectLifecycle.untitledProject'),
          t('projectLifecycle.untitledCanvas'),
          t('projectLifecycle.defaultCanvas'),
          t('canvasTabs.defaultCanvasName'),
          t('canvasTabs.untitledCanvas'),
        ]
          .map((_0xe7a02e) => String(_0xe7a02e || '').trim())
          .filter(Boolean),
      );
      if (_0x26c2b9.has(_0x2c7f27)) return true;
      return /^(?:画布|Canvas)\s+\d+$/i.test(_0x2c7f27);
    }
    function _0x284e54() {
      return Boolean(
        String(window._v2CurrentFile || '').trim() ||
        String(window._v2CurrentRecentProjectId || '').trim() ||
        String(window._v2CurrentProjectDisplayPath || '').trim(),
      );
    }
    function _0x2bf5ec() {
      const _0x5c9803 = _0x230ab7();
      if (_0x284e54()) return _0x5c9803;
      return _0x5cf67d(_0x5c9803) ? '' : _0x5c9803;
    }
    function _0x1ad5d4() {
      return (
        window.CanvasTabManager?.getMultiDataSnapshot?.({ sanitizeForPersistence: true }) || {
          canvases: [],
          activeCanvasId: null,
        }
      );
    }
    function _0x1f9266(_0x16c43d = {}) {
      const _0x5c876b = _0x1ad5d4(),
        _0x4018b4 = Array.isArray(_0x5c876b?.canvases) ? _0x5c876b.canvases : [];
      if (!_0x4018b4.length)
        return { projectName: String(_0x16c43d.projectName || _0x230ab7()).trim(), multiData: _0x5c876b };
      const _0x42cecf = String(
          _0x16c43d.canvasId ||
            window.CanvasTabManager?.getActiveCanvasId?.() ||
            _0x5c876b.activeCanvasId ||
            '',
        ).trim(),
        _0x5af8de =
          _0x4018b4.find((_0x356057) => String(_0x356057?.id || '') === _0x42cecf) ||
          _0x4018b4.find(
            (_0x5c8feb) => String(_0x5c8feb?.id || '') === String(_0x5c876b.activeCanvasId || ''),
          ) ||
          _0x4018b4[0],
        _0x555a91 = String(_0x16c43d.projectName || _0x5af8de?.name || _0x230ab7()).trim();
      return {
        projectName: _0x555a91,
        multiData: {
          ..._0x5c876b,
          canvases: _0x5af8de ? [_0x5af8de] : [],
          activeCanvasId: _0x5af8de?.id || _0x42cecf || null,
        },
      };
    }
    function _0x57245b(_0x3d393f = [], _0x1d70a7 = 3) {
      const _0x185f2e = Array.isArray(_0x3d393f)
        ? _0x3d393f
            .map((_0x5b1040) => String(_0x5b1040?.localPath || _0x5b1040?.url || _0x5b1040 || '').trim())
            .filter(Boolean)
        : [];
      if (!_0x185f2e.length) return '';
      const _0x187003 = _0x185f2e.slice(0, _0x1d70a7).join(projectDropdownText('listSeparator'));
      return _0x185f2e.length > _0x1d70a7
        ? projectDropdownText('listMore', { items: _0x187003, count: _0x185f2e.length })
        : _0x187003;
    }
    function _0x2b1bd9(_0xa2aa0e = {}) {
      if (_0xa2aa0e.code === 'MISSING_LOCAL_ASSETS') {
        const _0x13cdf5 = _0x57245b(_0xa2aa0e.missing);
        return _0x13cdf5
          ? projectDropdownText('packageExport.missingLocalWithSummary', { summary: _0x13cdf5 })
          : projectDropdownText('packageExport.missingLocal');
      }
      if (_0xa2aa0e.code === 'REMOTE_MEDIA_NOT_LOCALIZED') {
        const _0x59a6a7 = _0x57245b(_0xa2aa0e.remoteMedia);
        return _0x59a6a7
          ? projectDropdownText('packageExport.remoteNotLocalizedWithSummary', { summary: _0x59a6a7 })
          : projectDropdownText('packageExport.remoteNotLocalized');
      }
      return _0xa2aa0e.message || projectDropdownText('packageExport.failed');
    }
    function _0x4d2466(_0x2405c7 = []) {
      const _0x31b414 = Array.isArray(_0x2405c7) ? _0x2405c7 : [],
        _0x57f168 = _0x31b414.filter(
          (_0x1ae3d1) => _0x1ae3d1?.type === 'missing-original-video-fallback',
        ).length;
      if (_0x57f168 <= 0) return '';
      return projectDropdownText('packageExport.missingOriginalVideos', { count: _0x57f168 });
    }
    function _0x22de91(_0xfbda54 = 'pkg') {
      return _0xfbda54 + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    }
    let _0x5c9dd9 = null;
    function _0x3b77d5(_0x14ab04) {
      const _0x918e45 = Math.max(0, Math.floor((Date.now() - _0x14ab04) / 0x3e8));
      if (_0x918e45 < 60) return projectDropdownText('elapsedSeconds', { seconds: _0x918e45 });
      const _0x4bac23 = Math.floor(_0x918e45 / 60),
        _0x4af2f1 = String(_0x918e45 % 60).padStart(2, '0');
      return projectDropdownText('elapsedMinutesSeconds', { minutes: _0x4bac23, seconds: _0x4af2f1 });
    }
    function _0x53f5fb(_0x11f21f = {}) {
      const _0x52e9e7 = String(_0x11f21f?.message || projectDropdownText('packageProcessing')).trim(),
        _0x51cb8e = Number(_0x11f21f?.progress);
      if (!Number.isFinite(_0x51cb8e) || _0x51cb8e < 0) return _0x52e9e7;
      return _0x52e9e7 + ' · ' + Math.round(Math.max(0, Math.min(1, _0x51cb8e)) * 100) + '%';
    }
    function _0x32b650(_0x1068a3 = {}) {
      if (!_0x5c9dd9) return;
      const {
          root: _0x22a1c1,
          titleEl: _0x12ace6,
          messageEl: _0x5ca895,
          elapsedEl: _0x5a2b29,
          progressEl: _0x3f58e5,
          startedAt: _0x3f5369,
        } = _0x5c9dd9,
        _0x224feb = String(_0x1068a3?.title || projectDropdownText('collectingCurrentProject')).trim(),
        _0x68bc5d = _0x53f5fb(_0x1068a3),
        _0x43f325 = _0x3b77d5(_0x3f5369),
        _0x14ca88 = Number(_0x1068a3?.progress),
        _0xb66bf7 = Number.isFinite(_0x14ca88) && _0x14ca88 >= 0;
      (setText(_0x12ace6, _0x224feb),
        setText(_0x5ca895, _0x68bc5d),
        setText(_0x5a2b29, _0x43f325),
        _0x22a1c1.setAttribute('aria-label', _0x224feb + '，' + _0x68bc5d + '，' + _0x43f325));
      _0xb66bf7 ? _0x22a1c1.classList.add('has-progress') : _0x22a1c1.classList.remove('has-progress');
      _0x3f58e5.hidden = !_0xb66bf7;
      if (_0xb66bf7) _0x3f58e5.value = Math.max(0, Math.min(1, _0x14ca88));
      _0x5c9dd9.lastPayload = _0x1068a3;
    }
    function _0x303d08(_0x5795f2 = {}) {
      if (typeof document === 'undefined' || !document.body) return;
      if (_0x5c9dd9?.root) {
        _0x32b650(_0x5795f2);
        return;
      }
      document.getElementById?.('project-package-loading')?.remove?.();
      const _0x19ff8e = document.createElement('div');
      ((_0x19ff8e.id = 'project-package-loading'),
        (_0x19ff8e.className = 'project-package-loading is-visible'),
        _0x19ff8e.setAttribute('role', 'status'),
        _0x19ff8e.setAttribute('aria-live', 'polite'));
      const _0x19da3b = document.createElement('div');
      _0x19da3b.className = 'project-package-loading-panel';
      const _0x109af0 = document.createElement('div');
      ((_0x109af0.className = 'project-package-loading-spinner'),
        _0x109af0.setAttribute('aria-hidden', 'true'));
      const _0x3ebeee = document.createElement('div');
      _0x3ebeee.className = 'project-package-loading-body';
      const _0x14244a = document.createElement('div');
      _0x14244a.className = 'project-package-loading-title';
      const _0x857754 = document.createElement('div');
      _0x857754.className = 'project-package-loading-message';
      const _0x58c588 = document.createElement('div');
      _0x58c588.className = 'project-package-loading-meta';
      const _0x11df54 = document.createElement('span');
      ((_0x11df54.className = 'project-package-loading-elapsed'), _0x58c588.appendChild(_0x11df54));
      const _0x1bfff9 = document.createElement('progress');
      ((_0x1bfff9.className = 'project-package-loading-progress'),
        (_0x1bfff9.max = 1),
        (_0x1bfff9.value = 0),
        (_0x1bfff9.hidden = true),
        _0x3ebeee.appendChild(_0x14244a),
        _0x3ebeee.appendChild(_0x857754),
        _0x3ebeee.appendChild(_0x58c588),
        _0x3ebeee.appendChild(_0x1bfff9),
        _0x19da3b.appendChild(_0x109af0),
        _0x19da3b.appendChild(_0x3ebeee),
        _0x19ff8e.appendChild(_0x19da3b),
        document.body.appendChild(_0x19ff8e));
      const _0x23b2b1 =
        typeof window.setInterval === 'function' ? window.setInterval.bind(window) : setInterval;
      ((_0x5c9dd9 = {
        root: _0x19ff8e,
        titleEl: _0x14244a,
        messageEl: _0x857754,
        elapsedEl: _0x11df54,
        progressEl: _0x1bfff9,
        startedAt: Date.now(),
        lastPayload: _0x5795f2,
        timerId: _0x23b2b1(() => {
          _0x32b650(_0x5c9dd9?.lastPayload || {});
        }, 0x3e8),
      }),
        _0x32b650(_0x5795f2));
    }
    function _0x3434ec(_0x322c2b = {}) {
      if (!_0x5c9dd9) _0x303d08(_0x322c2b);
      _0x32b650(_0x322c2b);
    }
    async function _0x566243() {
      if (typeof window.requestAnimationFrame === 'function') {
        await new Promise((_0x4ff793) => {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(_0x4ff793);
          });
        });
        return;
      }
      const _0x38f6e7 = typeof window.setTimeout === 'function' ? window.setTimeout.bind(window) : setTimeout;
      await new Promise((_0x289398) => _0x38f6e7(_0x289398, 0));
    }
    async function _0x176981(_0x3bb5dc = projectDropdownText('loadingProjectDefault')) {
      (_0x303d08({ title: projectDropdownText('loadingProjectTitle'), message: _0x3bb5dc }),
        await _0x566243());
    }
    function _0x59aff4() {
      if (!_0x5c9dd9) return;
      const _0x2e1747 = _0x5c9dd9;
      _0x5c9dd9 = null;
      const _0x26cff9 =
          typeof window.clearInterval === 'function' ? window.clearInterval.bind(window) : clearInterval,
        _0x50cfbe = typeof window.setTimeout === 'function' ? window.setTimeout.bind(window) : setTimeout;
      (_0x26cff9(_0x2e1747.timerId),
        _0x2e1747.root.classList.remove('is-visible'),
        _0x2e1747.root.classList.add('is-hiding'),
        _0x50cfbe(() => _0x2e1747.root.remove?.(), 180));
    }
    function _0x1220c2(_0x33eef9, { title: title = projectDropdownText('collectingCurrentProject') } = {}) {
      const _0x511ec6 = window.electronAPI?.project?.onPackageProgress;
      if (typeof _0x511ec6 !== 'function') return () => {};
      const _0x1461b7 = _0x511ec6((_0xa241b2 = {}) => {
        if (String(_0xa241b2?.operationId || '') !== _0x33eef9) return;
        _0x3434ec({ title: title, ..._0xa241b2 });
      });
      return typeof _0x1461b7 === 'function' ? _0x1461b7 : () => {};
    }
    function _0x11dcbb(_0x48c712) {
      if (!_0x48c712) return;
      (_0x48c712.classList.remove('is-shaking'),
        void _0x48c712.offsetWidth,
        _0x48c712.classList.add('is-shaking'),
        window.setTimeout(() => {
          _0x48c712.classList.remove('is-shaking');
        }, 240));
    }
    function _0x1104a3(_0x3b5613, _0xc2025d, _0x53e61e) {
      (_0x11dcbb(_0x3b5613),
        window.setTimeout(() => {
          ((_0xc2025d.hidden = true), (_0x53e61e.hidden = false));
        }, 180));
    }
    function _0x5113f4(_0x20aa5c) {
      const _0x3a5c75 = _0x20aa5c?.getBoundingClientRect?.();
      if (!_0x3a5c75) return null;
      const _0x54ecf4 = Number(_0x3a5c75.left ?? 0),
        _0x353093 = Number(_0x3a5c75.top ?? 0),
        _0x29003a = Number(_0x3a5c75.width),
        _0x3dd4a9 = Number(_0x3a5c75.height),
        _0x41af84 = Number(_0x3a5c75.right),
        _0x25443b = Number(_0x3a5c75.bottom),
        _0xa8a728 =
          Number.isFinite(_0x29003a) && _0x29003a > 0
            ? _0x29003a
            : Number.isFinite(_0x41af84)
              ? _0x41af84 - _0x54ecf4
              : 0,
        _0x5b0962 =
          Number.isFinite(_0x3dd4a9) && _0x3dd4a9 > 0
            ? _0x3dd4a9
            : Number.isFinite(_0x25443b)
              ? _0x25443b - _0x353093
              : 0;
      if (
        !Number.isFinite(_0x54ecf4) ||
        !Number.isFinite(_0x353093) ||
        !Number.isFinite(_0xa8a728) ||
        !Number.isFinite(_0x5b0962) ||
        _0xa8a728 <= 0 ||
        _0x5b0962 <= 0
      )
        return null;
      return {
        left: _0x54ecf4,
        top: _0x353093,
        width: _0xa8a728,
        height: _0x5b0962,
        right: _0x54ecf4 + _0xa8a728,
        bottom: _0x353093 + _0x5b0962,
      };
    }
    function _0x55b343(_0x3656a4) {
      if (!_0x3656a4) return null;
      const _0x5c0cad = Number(window.innerWidth || 0),
        _0x22c06a = Number(window.innerHeight || 0);
      if (_0x5c0cad <= 0 || _0x22c06a <= 0) return _0x3656a4;
      const _0x8f57f = Math.max(0, _0x3656a4.left),
        _0x3b0f01 = Math.max(0, _0x3656a4.top),
        _0x371089 = Math.min(_0x5c0cad, _0x3656a4.right),
        _0x4dab9a = Math.min(_0x22c06a, _0x3656a4.bottom),
        _0x1645e8 = _0x371089 - _0x8f57f,
        _0x41567a = _0x4dab9a - _0x3b0f01;
      if (_0x1645e8 <= 0 || _0x41567a <= 0) return _0x3656a4;
      return {
        left: _0x8f57f,
        top: _0x3b0f01,
        width: _0x1645e8,
        height: _0x41567a,
        right: _0x371089,
        bottom: _0x4dab9a,
      };
    }
    function _0x5adaf9() {
      const _0x16ca7f = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      if (_0x16ca7f) return;
      const _0x5c633a =
          _0x5113f4(document.getElementById('v2-canvas')) || _0x5113f4(document.getElementById('v2-wrap')),
        _0x4e79e9 = _0x55b343(_0x5c633a),
        _0x228180 = _0x5113f4(_0x4a31ca || document.getElementById('btnCanvasLogo'));
      if (!_0x4e79e9 || !_0x228180) return;
      const _0x1eecf8 = _0x4e79e9.width / _0x4e79e9.height || 4 / 3;
      let _0x19b5ac = Math.min(_0x4e79e9.width, Math.max(140, Math.min(0x168, _0x4e79e9.width * 0.42))),
        _0x4bbab4 = _0x19b5ac / _0x1eecf8;
      const _0x166536 = Math.min(_0x4e79e9.height, Math.max(96, Math.min(240, _0x4e79e9.height * 0.42)));
      _0x4bbab4 > _0x166536 && ((_0x4bbab4 = _0x166536), (_0x19b5ac = _0x4bbab4 * _0x1eecf8));
      ((_0x19b5ac = Math.max(1, Math.round(_0x19b5ac))), (_0x4bbab4 = Math.max(1, Math.round(_0x4bbab4))));
      const _0x243b1f = _0x4e79e9.left + _0x4e79e9.width / 2,
        _0x1692fc = _0x4e79e9.top + _0x4e79e9.height / 2,
        _0x391d91 = _0x228180.left + _0x228180.width / 2,
        _0x1d69a5 = _0x228180.top + _0x228180.height / 2,
        _0x20e4df = Math.round(_0x243b1f - _0x19b5ac / 2),
        _0x47ec00 = Math.round(_0x1692fc - _0x4bbab4 / 2),
        _0x274425 = _0x391d91 - _0x243b1f,
        _0x34dd66 = _0x1d69a5 - _0x1692fc,
        _0x56ba0c = document.createElement('div');
      ((_0x56ba0c.className = 'v2-project-save-fly'),
        (_0x56ba0c.style.left = _0x20e4df + 'px'),
        (_0x56ba0c.style.top = _0x47ec00 + 'px'),
        (_0x56ba0c.style.width = _0x19b5ac + 'px'),
        (_0x56ba0c.style.height = _0x4bbab4 + 'px'),
        document.body.appendChild(_0x56ba0c));
      const _0x252eca = (() => {
        let _0x54cc6d = false;
        return () => {
          if (_0x54cc6d) return;
          ((_0x54cc6d = true),
            _0x56ba0c.remove?.(),
            _0x4a31ca?.animate &&
              _0x4a31ca.animate(
                [
                  { transform: 'scale(1)', filter: 'brightness(1)' },
                  { transform: 'scale(1.08)', filter: 'brightness(1.2)' },
                  { transform: 'scale(1)', filter: 'brightness(1)' },
                ],
                { duration: 0x104, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
              ));
        };
      })();
      if (typeof _0x56ba0c.animate === 'function') {
        const _0x23f416 = _0x56ba0c.animate(
          [
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: 'translate(' + _0x274425 + 'px,' + _0x34dd66 + 'px) scale(0.12)', opacity: 0.18 },
          ],
          { duration: 0x230, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
        );
        ((_0x23f416.onfinish = _0x252eca), (_0x23f416.oncancel = _0x252eca));
        return;
      }
      window.setTimeout(_0x252eca, 0x230);
    }
    function _0x478d29(_0xdb0f05) {
      if (!_0xdb0f05 || _0xdb0f05.canceled) return false;
      const validData = requireOpenedProjectDocument(_0xdb0f05);
      const _0x140f80 = sanitizeMultiCanvasDataForPersistence(
        _0xdb0f05.multiData || project.resolveCanvasData(validData),
      );
      (clearRendererCache(),
        window.CanvasTabManager?.init?.(_0x140f80),
        window.CanvasTabManager?.markAllCanvasesClean?.(),
        commit());
      const _0x5def63 =
        _0xdb0f05.projectName ||
        stripProjectFileExtensionFromName(_0xdb0f05.filename) ||
        projectDropdownText('unnamedCanvas');
      ((window._v2CurrentFile = _0xdb0f05.filename || _0x5def63 + '.aicanvas'),
        (window._v2CurrentRecentProjectId = _0xdb0f05.recentId || ''),
        (window._v2CurrentProjectDisplayPath = _0xdb0f05.displayPath || ''),
        (window._v2CurrentProjectLastModified = Number(_0xdb0f05.lastModified || 0) || 0),
        (window.currentProjectId = _0xdb0f05.projectId || stripProjectFileExtensionFromName(_0x5def63)));
      const _0x33fd22 = document.getElementById('projectNameText');
      if (_0x33fd22) _0x33fd22.textContent = _0x5def63;
      return (
        window.CanvasTabManager?.renderTabs?.(),
        window._queueLegacyThumbnailMigration?.({
          projectId: window.currentProjectId,
          projectName: _0x5def63,
          multiData: _0x140f80,
        }),
        window._triggerLocalCacheSave?.(),
        true
      );
    }
    function _0x473ee4(_0x4c0def) {
      const _0x30e65f = String(_0x4c0def || '').trim() || projectDropdownText('loadedPackageBase'),
        _0x510f9b = new Set(
          (window.CanvasTabManager?._canvases || []).map((_0x5a2d54) => String(_0x5a2d54?.name || '').trim()),
        );
      if (!_0x510f9b.has(_0x30e65f)) return _0x30e65f;
      for (let _0x1aacaf = 2; _0x1aacaf < 0x3e8; _0x1aacaf += 1) {
        const _0xa507b0 = _0x30e65f + ' (' + _0x1aacaf + ')';
        if (!_0x510f9b.has(_0xa507b0)) return _0xa507b0;
      }
      return _0x30e65f + ' ' + Date.now();
    }
    function _0x30ef2b(_0x10d34d) {
      if (!_0x10d34d || _0x10d34d.canceled) return false;
      const _0x24b99f = sanitizeMultiCanvasDataForPersistence(
          _0x10d34d.multiData || project.resolveCanvasData(_0x10d34d.data || {}),
        ),
        _0x35b2c4 =
          _0x24b99f.canvases.find((_0x3f63b2) => _0x3f63b2.id === _0x24b99f.activeCanvasId) ||
          _0x24b99f.canvases[0];
      if (!_0x35b2c4) return false;
      const _0x385d1d = _0x473ee4(
        _0x35b2c4.name ||
          _0x10d34d.projectName ||
          stripProjectFileExtensionFromName(_0x10d34d.filename) ||
          projectDropdownText('loadedPackageBase'),
      );
      window.CanvasTabManager?.addCanvas?.();
      const _0x233241 = window.CanvasTabManager?._activeId;
      if (!_0x233241) return false;
      return (
        window.CanvasTabManager?.renameCanvas?.(_0x233241, _0x385d1d),
        window.CanvasTabManager?.hydrateActiveCanvasSnapshot?.(_0x35b2c4),
        window.CanvasTabManager?.renderTabs?.(),
        commit(),
        window._triggerLocalCacheSave?.(),
        true
      );
    }
    async function _0x18d570(_0x2fa07b = '') {
      let _0x35b01c = false;
      try {
        _0x2fa07b && (await _0x176981(projectDropdownText('readingLocalProject')), (_0x35b01c = true));
        const _0x3f9dcb = await openDesktopProject({ recentId: _0x2fa07b });
        if (!_0x3f9dcb || _0x3f9dcb.canceled) return;
        (!_0x35b01c
          ? (await _0x176981(projectDropdownText('renderingCanvas')), (_0x35b01c = true))
          : (_0x3434ec({
              title: projectDropdownText('loadingProjectTitle'),
              message: projectDropdownText('renderingCanvas'),
            }),
            await _0x566243()),
          _0x478d29(_0x3f9dcb) &&
            (closeSidebarSubmenu('canvas-project'),
            _0x3d7fc6(projectDropdownText('opened', { name: _0x3f9dcb.projectName || _0x3f9dcb.filename }))));
      } catch (_0x426a82) {
        (console.error('[desktopProject] open failed:', _0x426a82),
          _0x3d7fc6(_0x426a82?.message || projectDropdownText('openLocalFailed'), 'error'));
      } finally {
        _0x59aff4();
      }
    }
    async function _0x510a1d() {
      window.showGlobalLoading && window.showGlobalLoading(projectDropdownText('savingLocal'));
      try {
        const _0x216036 = await saveDesktopProject(_0x230ab7(), _0x1ad5d4(), { mode: 'saveAs' });
        if (!_0x216036 || _0x216036.canceled) return;
        ((window._v2CurrentFile = _0x216036.filename),
          (window._v2CurrentRecentProjectId = _0x216036.recentId || ''),
          (window._v2CurrentProjectDisplayPath = _0x216036.displayPath || ''),
          (window._v2CurrentProjectLastModified = Number(_0x216036.lastModified || 0) || 0),
          (window.currentProjectId =
            _0x216036.projectId || stripProjectFileExtensionFromName(_0x216036.filename)),
          window.CanvasTabManager?.markAllCanvasesClean?.(),
          _0x3d7fc6(projectDropdownText('saveAsSucceeded', { filename: _0x216036.filename })),
          _0x5d000d());
      } catch (_0x81adb8) {
        (console.error('[desktopProject] saveAs failed:', _0x81adb8),
          _0x3d7fc6(_0x81adb8?.message || projectDropdownText('saveAsFailed'), 'error'));
      } finally {
        if (window.hideGlobalLoading) window.hideGlobalLoading();
      }
    }
    async function _0x363565(_0x4f6cde = {}) {
      const _0x3ccabe = _0x22de91('export-package'),
        _0x3fbab4 = _0x1220c2(_0x3ccabe, { title: projectDropdownText('collectingCurrentProject') });
      try {
        const _0x32deea = _0x1f9266(_0x4f6cde),
          _0x38feca = await exportDesktopProjectPackage(
            _0x32deea.projectName || _0x230ab7(),
            _0x32deea.multiData,
            {
              projectId: window.currentProjectId || '',
              recentId: window._v2CurrentRecentProjectId || '',
              displayPath: window._v2CurrentProjectDisplayPath || '',
              operationId: _0x3ccabe,
            },
          );
        if (!_0x38feca || _0x38feca.canceled) return;
        if (_0x38feca.blocked) {
          (console.warn('[desktopProject] export package blocked:', _0x38feca),
            _0x3d7fc6(_0x2b1bd9(_0x38feca), 'error'));
          return;
        }
        if (!_0x38feca.success) {
          _0x3d7fc6(_0x38feca.message || projectDropdownText('packageExport.failed'), 'error');
          return;
        }
        const _0x398bf3 = _0x4d2466(_0x38feca.warnings);
        if (_0x398bf3) {
          (console.warn('[desktopProject] export package warnings:', _0x38feca.warnings),
            _0x3d7fc6(
              projectDropdownText('packageExport.collectedWithWarning', {
                filename: _0x38feca.filename || projectDropdownText('packageFallback'),
                warning: _0x398bf3,
              }),
              'warn',
            ));
          return;
        }
        _0x3d7fc6(
          projectDropdownText('packageExport.collected', {
            filename: _0x38feca.filename || projectDropdownText('packageFallback'),
          }),
        );
      } catch (_0x1b4965) {
        (console.error('[desktopProject] export package failed:', _0x1b4965),
          _0x3d7fc6(_0x1b4965?.message || projectDropdownText('packageExport.failed'), 'error'));
      } finally {
        (_0x3fbab4(), _0x59aff4());
      }
    }
    let fullPackageUiBusy = false;
    async function runFullPackage(mode, externalPackageTicket) {
      if (fullPackageUiBusy) { _0x3d7fc6('已有完整工程包操作正在执行', 'error'); return; }
      fullPackageUiBusy = true;
      const operationId = _0x22de91('full-package-' + mode);
      const release = _0x1220c2(operationId, { title: mode === 'export' ? '收集全部画布' : '恢复独立工程' });
      try {
        const result = await runFullProjectPackage({ mode, api: window.electronAPI?.project,
          projectName: _0x230ab7(), projectId: window.currentProjectId || '', operationId, externalPackageTicket,
          readContext: () => ({ nodes: appStore.getStateRaw().nodes, canvases: window.CanvasTabManager?._canvases,
            identity: JSON.stringify([window.currentProjectId, window._v2CurrentRecentProjectId, window._v2CurrentProjectDisplayPath]),
            data: window.CanvasTabManager?.getMultiDataSnapshot?.({ sanitizeForPersistence: true, captureVisualSnapshot: false }) }),
          confirmSwitch: result => window.confirm(`已恢复 ${result.canvasCount} 张画布到独立工程文件。现在切换打开？\n${result.projectPath}\n\n未应用工作室草稿和当前工程的未保存修改不会写入该文件；请先导出草稿/保存当前工程，必要时取消切换。取消切换也保留恢复文件。不是任务恢复，不自动重发生成。`),
          openProject: result => _0x478d29({ ...result, multiData: result.data }),
          onRetained: showRetainedProjectPackage,
        });
        if (result?.cleanupWarnings?.length) _0x3d7fc6(result.cleanupWarnings.join('\n'), 'error');
        if (result?.success && mode === 'export') _0x3d7fc6(`完整工程包已写入：${result.filename}（${result.canvasCount} 张画布）。原工程未另行保存。`);
      } catch (error) { _0x3d7fc6(error?.message || '完整工程包操作失败', 'error'); }
      finally { release(); _0x59aff4(); fullPackageUiBusy = false; }
    }
    async function _0x188164(_0x316ed3 = '') {
      const _0x10b348 = _0x22de91('import-package'),
        _0x5f2050 = _0x1220c2(_0x10b348, { title: projectDropdownText('loadingProjectTitle') });
      try {
        const assertCurrent = captureExternalProjectTarget(readExternalProjectTarget);
        _0x316ed3 && (await _0x176981(projectDropdownText('readingProjectPackage')));
        assertCurrent();
        const _0x4922cb = await importDesktopProjectPackage({ path: _0x316ed3, operationId: _0x10b348 });
        if (!_0x4922cb || _0x4922cb.canceled) return _0x4922cb;
        return (
          !_0x5c9dd9
            ? await _0x176981(projectDropdownText('renderingProjectPackage'))
            : (_0x3434ec({
                title: projectDropdownText('loadingProjectTitle'),
                message: projectDropdownText('renderingProjectPackage'),
              }),
              await _0x566243()),
          assertCurrent(),
          _0x30ef2b(_0x4922cb) &&
            (closeSidebarSubmenu('canvas-project'),
            _0x3d7fc6(
              projectDropdownText('packageImport.loaded', {
                name: _0x4922cb.projectName || _0x4922cb.filename,
              }),
            )),
          _0x4922cb
        );
      } catch (_0x131cf1) {
        return (
          console.error('[desktopProject] import package failed:', _0x131cf1),
          _0x3d7fc6(_0x131cf1?.message || projectDropdownText('packageImport.failed'), 'error'),
          null
        );
      } finally {
        (_0x5f2050(), _0x59aff4());
      }
    }
    function _0x6635d4() {
      return window.CanvasTabManager?.hasDirtyCanvases?.() === true;
    }
    function readExternalProjectTarget() {
      const manager = window.CanvasTabManager;
      return { manager, nodes: appStore.getStateRaw()?.nodes, canvases: manager?._canvases,
        key: JSON.stringify([window.currentProjectId, window._v2CurrentFile, window._v2CurrentRecentProjectId,
          window._v2CurrentProjectDisplayPath, manager?.getActiveCanvasId?.()]) };
    }
    function _0x1bf52a(_0x89c72c) {
      if (!_0x6635d4()) return true;
      const _0x75a42e = _0x89c72c?.filename || projectDropdownText('externalProject');
      return window.confirm?.(projectDropdownText('confirmExternalDirty', { filename: _0x75a42e })) === true;
    }
    async function _0x1f3bd4(_0x41291a) {
      if (!_0x41291a || typeof _0x41291a !== 'object') return;
      if (_0x41291a.success === false) {
        _0x3d7fc6(_0x41291a.error || projectDropdownText('externalOpenFailed'), 'error');
        return;
      }
      if (_0x41291a.kind === 'fullProjectPackage') {
        if (typeof _0x41291a.externalPackageTicket !== 'string') {
          _0x3d7fc6('系统工程包请求缺少可信凭据，请重新从系统打开文件', 'error');
          return;
        }
        await runFullPackage('restore', _0x41291a.externalPackageTicket);
        return;
      }
      if (_0x41291a.kind === 'projectPackage') {
        _0x3d7fc6('旧桌面端的系统打开只会导入活动画布。为保留全部画布，请从“恢复完整工程包（独立工程）”菜单重新选包；系统直达需更新并重启桌面端', 'error');
        return;
      }
      try {
        requireOpenedProjectDocument(_0x41291a); // Reject old-host malformed files before the dirty-canvas confirmation.
        const opened = await runGuardedExternalProjectOpen({ response: _0x41291a,
          readTarget: readExternalProjectTarget,
          prepare: () => _0x176981(projectDropdownText('renderingCanvas')),
          confirmReplace: _0x1bf52a, apply: _0x478d29 });
        if (opened) {
          closeSidebarSubmenu('canvas-project');
          _0x3d7fc6(projectDropdownText('opened', { name: _0x41291a.projectName || _0x41291a.filename }));
        }
      } catch (_0x2f5938) {
        (console.error('[desktopProject] external open failed:', _0x2f5938),
          _0x3d7fc6(_0x2f5938?.message || projectDropdownText('externalOpenFailed'), 'error'));
      } finally {
        _0x59aff4();
      }
    }
    const _0x1aee75 = createSerialExternalProjectOpener(_0x1f3bd4, error => {
      console.error('[desktopProject] external open request failed:', error);
      _0x3d7fc6(error?.message || projectDropdownText('externalOpenFailed'), 'error');
    });
    async function _0x3411b9() {
      const _0x1ba815 = window.electronAPI?.project?.consumeExternalOpenRequests;
      if (typeof _0x1ba815 !== 'function') return;
      try {
        await _0x1aee75(await _0x1ba815());
      } catch (_0x5736ec) {
        (console.error('[desktopProject] consume external open failed:', _0x5736ec),
          _0x3d7fc6(_0x5736ec?.message || projectDropdownText('externalOpenFailed'), 'error'));
      }
    }
    function _0x2adac3() {
      const _0x3ae995 = window.electronAPI?.project?.onExternalOpen;
      if (typeof _0x3ae995 !== 'function') return;
      if (window.__aiCanvasExternalProjectOpenInstalled) return;
      ((window.__aiCanvasExternalProjectOpenInstalled = true),
        _0x3ae995((_0x48905e) => {
          void _0x1aee75(_0x48905e).catch(error => {
            console.error('[desktopProject] external open batch failed:', error);
            _0x3d7fc6(error?.message || projectDropdownText('externalOpenFailed'), 'error');
          });
        }),
        void _0x3411b9());
    }
    function _0x303d87({ iconId: _0x16b7ce, title: _0x4ae739, onClick: _0x5e242c }) {
      const _0xcca1f8 = document.createElement('button');
      return (
        (_0xcca1f8.type = 'button'),
        (_0xcca1f8.className = 'cpd-local-action-btn'),
        (_0xcca1f8.dataset.tooltip = _0x4ae739),
        _0xcca1f8.setAttribute('aria-label', _0x4ae739),
        setStaticInnerHTML(_0xcca1f8, _0x16b7ce),
        _0xcca1f8.addEventListener('click', (_0xa16750) => {
          (_0xa16750.preventDefault(), _0xa16750.stopPropagation(), _0x5e242c?.());
        }),
        _0xcca1f8
      );
    }
    function _0x55f152() {
      if (!canUseDesktopProjectApi() || !_0x5447f2) return;
      let _0xfdc064 = _0x5447f2.querySelector('.cpd-local-actions');
      if (_0xfdc064) return;
      ((_0xfdc064 = document.createElement('div')),
        (_0xfdc064.className = 'cpd-local-actions'),
        _0xfdc064.appendChild(
          _0x303d87({
            iconId: 'iconFolderOpen18',
            title: projectDropdownText('actions.openLocal'),
            onClick: () => _0x18d570(),
          }),
        ),
        _0xfdc064.appendChild(
          _0x303d87({
            iconId: 'iconSaveAs18',
            title: projectDropdownText('actions.saveAsLocal'),
            onClick: () => _0x510a1d(),
          }),
        ),
        _0xfdc064.appendChild(
          _0x303d87({
            iconId: 'iconPackageExport18',
            title: projectDropdownText('actions.collectCurrent'),
            onClick: () => _0x363565(),
          }),
        ),
        _0xfdc064.appendChild(
          _0x303d87({
            iconId: 'iconPackageImport18',
            title: projectDropdownText('actions.loadPackage'),
            onClick: () => _0x188164(),
          }),
        ));
      _0xfdc064.appendChild(_0x303d87({ iconId: 'iconPackageExport18', title: '收集完整工程（全部画布）', onClick: () => runFullPackage('export') }));
      _0xfdc064.appendChild(_0x303d87({ iconId: 'iconPackageImport18', title: '恢复完整工程包（独立工程）', onClick: () => runFullPackage('restore') }));
      const _0x4ee9fc = _0x5447f2.querySelector('.cpd-close');
      _0x5447f2.insertBefore(_0xfdc064, _0x4ee9fc || null);
    }
    async function _0x5d000d() {
      (_0x55f152(), clearElement(_0x546e10));
      const _0x150f1c = document.createElement('div');
      ((_0x150f1c.className = 'cpd-loading'),
        setText(_0x150f1c, projectDropdownText('loading')),
        _0x546e10.appendChild(_0x150f1c),
        requestAnimationFrame(_0x37e63d));
      try {
        const _0x4104a2 = await fetchV2ProjectsFromServer();
        if (!_0x4104a2.length) {
          clearElement(_0x546e10);
          const _0x54ba02 = document.createElement('div');
          ((_0x54ba02.className = 'cpd-empty'),
            setText(_0x54ba02, projectDropdownText('emptyProjects')),
            _0x546e10.appendChild(_0x54ba02),
            requestAnimationFrame(_0x37e63d));
          return;
        }
        (clearElement(_0x546e10),
          _0x4104a2.forEach((_0x5c893f) => {
            const _0x46225a = document.createElement('div');
            ((_0x46225a.className = 'cpd-item'),
              (_0x46225a.dataset.filename = _0x5c893f.filename),
              (_0x46225a.dataset.name = _0x5c893f.name));
            const _0x4d44c0 = document.createElement('div');
            _0x4d44c0.className = 'cpd-item-left';
            const _0x4a30ea = document.createElement('div');
            ((_0x4a30ea.className = 'cpd-item-icon'), setStaticInnerHTML(_0x4a30ea, 'cpdProjectItemIcon16'));
            const _0x4b301d = document.createElement('div');
            _0x4b301d.className = 'cpd-item-info';
            const _0x4bdc45 = document.createElement('div');
            ((_0x4bdc45.className = 'cpd-item-name'),
              setText(_0x4bdc45, _0x5c893f.name),
              _0x4b301d.appendChild(_0x4bdc45),
              _0x4d44c0.appendChild(_0x4a30ea),
              _0x4d44c0.appendChild(_0x4b301d));
            const _0x2e4146 = document.createElement('div');
            ((_0x2e4146.className = 'cpd-item-actions'),
              _0x46225a.appendChild(_0x4d44c0),
              _0x46225a.appendChild(_0x2e4146));
            const _0x1269a7 = document.createElement('div');
            ((_0x1269a7.className = 'cpd-item-delete'), setStaticInnerHTML(_0x1269a7, 'iconTrash18'));
            const _0x4b07df = document.createElement('div');
            ((_0x4b07df.className = 'cpd-confirm-panel'), (_0x4b07df.hidden = true));
            const _0x497cd8 = document.createElement('button');
            ((_0x497cd8.type = 'button'),
              (_0x497cd8.className = 'cpd-confirm-btn cpd-confirm-btn--danger'),
              (_0x497cd8.textContent = '✔'),
              _0x497cd8.setAttribute('aria-label', projectDropdownText('confirm')));
            const _0xf0a567 = document.createElement('button');
            ((_0xf0a567.type = 'button'),
              (_0xf0a567.className = 'cpd-confirm-btn cpd-confirm-btn--neutral'),
              (_0xf0a567.textContent = '×'),
              _0xf0a567.setAttribute('aria-label', projectDropdownText('cancel')),
              _0x4b07df.appendChild(_0x497cd8),
              _0x4b07df.appendChild(_0xf0a567),
              _0x2e4146.appendChild(_0x1269a7),
              _0x2e4146.appendChild(_0x4b07df),
              _0x4d44c0.addEventListener('click', (_0x2bb5a9) => {
                (_0x2bb5a9.stopPropagation(), _0x43a0f0(_0x5c893f.filename, _0x5c893f.name));
              }),
              _0x1269a7.addEventListener('click', (_0x5756f1) => {
                (_0x5756f1.stopPropagation(), _0x1104a3(_0x46225a, _0x1269a7, _0x4b07df));
              }),
              _0xf0a567.addEventListener('click', (_0x3fc2cf) => {
                (_0x3fc2cf.stopPropagation(), (_0x4b07df.hidden = true), (_0x1269a7.hidden = false));
              }),
              _0x497cd8.addEventListener('click', async (_0x7510db) => {
                (_0x7510db.stopPropagation(), (_0x497cd8.textContent = '...'));
                const _0x291aff = await deleteV2ProjectFromServer(_0x5c893f.filename);
                _0x291aff
                  ? (_0x3d7fc6(projectDropdownText('deleted')), _0x5d000d())
                  : (_0x3d7fc6(projectDropdownText('deleteFailed')), (_0x497cd8.textContent = '✔'));
              }),
              _0x46225a.addEventListener('contextmenu', (_0x3a3f65) => {
                (_0x3a3f65.preventDefault(), _0x3a3f65.stopPropagation());
              }),
              _0x546e10.appendChild(_0x46225a));
          }),
          requestAnimationFrame(_0x37e63d));
      } catch (_0x28e696) {
        clearElement(_0x546e10);
        const _0x1f0aa5 = document.createElement('div');
        ((_0x1f0aa5.className = 'cpd-empty'),
          setText(_0x1f0aa5, projectDropdownText('listLoadFailed')),
          _0x546e10.appendChild(_0x1f0aa5),
          requestAnimationFrame(_0x37e63d));
      }
    }
    async function _0x43a0f0(_0x5e1d26, _0x52a553) {
      try {
        await _0x176981(projectDropdownText('readingProjectData'));
        const _0x3b0e69 = String(_0x5e1d26 || '').replace(/\.json$/i, ''),
          _0x54e023 = await project.loadProject(_0x3b0e69);
        (_0x3434ec({
          title: projectDropdownText('loadingProjectTitle'),
          message: projectDropdownText('renderingCanvas'),
        }),
          await _0x566243());
        const _0x51ed44 = sanitizeMultiCanvasDataForPersistence(_0x54e023),
          _0xd1ea1f =
            _0x51ed44.canvases.find((_0x49a4f5) => _0x49a4f5.id === _0x51ed44.activeCanvasId) ||
            _0x51ed44.canvases[0],
          _0x4d3bf6 = window.CanvasTabManager._canvases.find((_0x39cf8a) => _0x39cf8a.name === _0x52a553);
        _0x4d3bf6
          ? window.CanvasTabManager.switchTo(_0x4d3bf6.id)
          : (window.CanvasTabManager.addCanvas(),
            window.CanvasTabManager.renameCanvas(window.CanvasTabManager._activeId, _0x52a553));
        window._v2ApplySourceNamesFromFileNameToCanvas &&
          window._v2ApplySourceNamesFromFileNameToCanvas(_0xd1ea1f);
        (window.CanvasTabManager.hydrateActiveCanvasSnapshot(_0xd1ea1f),
          window.CanvasTabManager.markCanvasClean(window.CanvasTabManager._activeId),
          commit(),
          (window._v2CurrentFile = _0x5e1d26),
          (window._v2CurrentRecentProjectId = ''),
          (window._v2CurrentProjectDisplayPath = ''),
          (window._v2CurrentProjectLastModified = 0),
          (window.currentProjectId = _0x3b0e69),
          window._queueLegacyThumbnailMigration?.({
            projectId: _0x3b0e69,
            projectName: _0x52a553,
            multiData: _0x54e023,
          }));
        const _0x5f306d = document.getElementById('projectNameText');
        if (_0x5f306d) _0x5f306d.textContent = _0x52a553;
        (window.CanvasTabManager.renderTabs(),
          closeSidebarSubmenu('canvas-project'),
          _0x3d7fc6(projectDropdownText('loaded', { name: _0x52a553 })));
      } catch (_0x435c0b) {
        (console.error('load project error:', _0x435c0b),
          _0x3d7fc6(projectDropdownText('loadFailed'), 'error'));
      } finally {
        _0x59aff4();
      }
    }
    async function _0x9496c(_0x46c2bb) {
      try {
        const _0x2b93fe = window.CanvasTabManager?.getMultiDataSnapshot?.({
            sanitizeForPersistence: true,
          }) || { canvases: [], activeCanvasId: null },
          _0x2d7669 = await project.saveProject(_0x46c2bb, _0x2b93fe);
        if (_0x2d7669?.canceled) return;
        if (_0x2d7669.success) {
          ((window._v2CurrentFile = _0x2d7669.filename),
            (window._v2CurrentRecentProjectId = ''),
            (window._v2CurrentProjectDisplayPath = ''),
            (window._v2CurrentProjectLastModified = 0),
            (window.currentProjectId =
              _0x2d7669.projectId || stripProjectFileExtensionFromName(_0x2d7669.filename)),
            window.CanvasTabManager.renameCanvas(window.CanvasTabManager._activeId, _0x46c2bb));
          const _0x185c8e = document.getElementById('projectNameText');
          if (_0x185c8e) _0x185c8e.textContent = _0x46c2bb;
          (window.CanvasTabManager.renderTabs(),
            window.CanvasTabManager.markAllCanvasesClean(),
            _0x5adaf9(),
            _0x3d7fc6(projectDropdownText('saveSucceeded', { name: _0x46c2bb })),
            await _0x5d000d());
        }
      } catch (_0x2a7ed3) {
        (console.error('[saveProject] JSON 保存失败:', _0x2a7ed3),
          _0x3d7fc6(projectDropdownText('saveFailed'), 'error'));
      }
    }
    ((window._v2SaveProject = _0x9496c),
      (window._v2SaveProjectAsLocal = _0x510a1d),
      (window._v2ExportCurrentProjectPackage = _0x363565),
      (window._v2ImportProjectPackageByPath = _0x188164));
    function _0x3d7fc6(_0x463037, _0x7891a9 = 'ok') {
      window.showToast(_0x463037, _0x7891a9);
    }
    function _0x38e255() {
      if (!_0x4a31ca || !_0x17787e) return;
      (_0x37e63d(), _0x17787e.classList.add('open'), requestAnimationFrame(_0x37e63d), _0x5d000d());
    }
    function _0x357a3d() {
      _0x17787e.classList.remove('open');
    }
    (registerSidebarSubmenu({
      key: 'canvas-project',
      button: _0x4a31ca,
      panel: _0x17787e,
      open: _0x38e255,
      close: _0x357a3d,
      isOpen: () => _0x17787e.classList.contains('open'),
      openClass: 'open',
    }),
      _0x2d158e?.addEventListener('click', (_0x271b97) => {
        (_0x271b97.preventDefault(), _0x271b97.stopPropagation(), closeSidebarSubmenu('canvas-project'));
      }),
      _0x514753?.addEventListener('click', () => {
        (closeSidebarSubmenu('canvas-project'),
          window.CanvasTabManager?.addCanvas?.(),
          _0x3d7fc6(projectDropdownText('newCanvasCreated')));
      }));
    function _0x4ed132() {
      const _0x53cb44 = window.CanvasTabManager._canvases.find(
        (_0x2cfecc) => _0x2cfecc.id === window.CanvasTabManager._activeId,
      );
      ((_0x213c8b.value = _0x53cb44 ? _0x53cb44.name : projectDropdownText('unnamedCanvas')),
        _0x1a9acb.classList.add('open'),
        setTimeout(() => {
          (_0x213c8b.focus(), _0x213c8b.select());
        }, 80));
    }
    window._openSaveDialog = _0x4ed132;
    function _0x5a501b() {
      const _0x54afe6 = _0x2bf5ec();
      if (!_0x54afe6) return (_0x4ed132(), false);
      return _0x9496c(_0x54afe6);
    }
    window._v2SaveProjectFromShortcut = _0x5a501b;
    function _0x299368() {
      _0x1a9acb.classList.remove('open');
    }
    (_0x491f0e?.addEventListener('click', _0x299368),
      _0x28e91c?.addEventListener('click', () => {
        const _0x30640a = _0x213c8b.value.trim() || projectDropdownText('unnamedCanvas');
        (_0x299368(), _0x9496c(_0x30640a));
      }),
      _0x213c8b?.addEventListener('keydown', (_0x2b3949) => {
        (_0x2b3949.key === 'Enter' && (_0x2b3949.preventDefault(), _0x28e91c.click()),
          _0x2b3949.key === 'Escape' && (_0x2b3949.preventDefault(), _0x299368()));
      }),
      _0x2adac3(),
      window.addEventListener('resize', () => {
        _0x17787e.classList.contains('open') && _0x37e63d();
      }));
  },
};
export default CanvasProjectDropdownManager;
export { CanvasProjectDropdownManager };
