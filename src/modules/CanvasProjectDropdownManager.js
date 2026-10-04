import appStore from '../core/stores/appStore.js';
import {
  captureExternalProjectTarget,
  createSerialExternalProjectOpener,
  runGuardedExternalProjectOpen,
} from './externalProjectOpen.js';
import {
  runFullProjectPackage,
  showRetainedProjectPackage,
} from './projectPackage/fullProjectPackageSession.js';
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
function projectDropdownText(value, item = {}) {
  return t('projectDropdown.' + value, item);
}
function stripProjectFileExtensionFromName(key) {
  return String(key || '').replace(PROJECT_FILE_EXTENSION_RE, '');
}
const CanvasProjectDropdownManager = {
  init() {
    const index = 12,
      data = 12,
      button = document.getElementById('btnCanvasLogo'),
      panel = document.getElementById('canvasProjDropdown'),
      el = panel?.querySelector('.cpd-header'),
      el2 = document.getElementById('canvasProjList'),
      el3 = document.getElementById('btnCloseProjDropdown'),
      el4 = document.getElementById('btnNewCanvas'),
      el5 = document.getElementById('saveDialogOverlay'),
      el6 = document.getElementById('saveDialogInput'),
      el7 = document.getElementById('saveDialogCancel'),
      el8 = document.getElementById('saveDialogConfirm');
    if (!button || !panel || !el5) return;
    document.body.appendChild(panel);
    function run() {
      if (!button || !panel) return;
      const box = button.getBoundingClientRect(),
        enabled = panel.classList.contains('open');
      if (!enabled) panel.classList.add('open');
      const options = panel.getBoundingClientRect().height || panel.offsetHeight || 0,
        target = box.top + (box.height - options) / 2,
        source = window.innerHeight - options - data,
        next = source <= data ? data : Math.min(Math.max(target, data), source);
      ((panel.style.left = box.right + index + 'px'), (panel.style.top = next + 'px'));
      if (!enabled) panel.classList.remove('open');
    }
    function run2(current) {
      const entry = new Date(current * 0x3e8);
      return (
        entry.getFullYear() +
        '-' +
        String(entry.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(entry.getDate()).padStart(2, '0') +
        ' ' +
        String(entry.getHours()).padStart(2, '0') +
        ':' +
        String(entry.getMinutes()).padStart(2, '0')
      );
    }
    function projectName() {
      const el9 = document.getElementById('projectNameText');
      return String(el9?.textContent || '').trim() || projectDropdownText('unnamedCanvas');
    }
    function run3(record) {
      const enabled2 = String(record || '').trim();
      if (!enabled2) return true;
      const map = new Set(
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
          .map((item2) => String(item2 || '').trim())
          .filter(Boolean),
      );
      if (map.has(enabled2)) return true;
      return /^(?:画布|Canvas)\s+\d+$/i.test(enabled2);
    }
    function run4() {
      return Boolean(
        String(window._v2CurrentFile || '').trim() ||
        String(window._v2CurrentRecentProjectId || '').trim() ||
        String(window._v2CurrentProjectDisplayPath || '').trim(),
      );
    }
    function run5() {
      const payload = projectName();
      if (run4()) return payload;
      return run3(payload) ? '' : payload;
    }
    function run6() {
      return (
        window.CanvasTabManager?.getMultiDataSnapshot?.({ sanitizeForPersistence: true }) || {
          canvases: [],
          activeCanvasId: null,
        }
      );
    }
    function run7(options2 = {}) {
      const multiData = run6(),
        list = Array.isArray(multiData?.canvases) ? multiData.canvases : [];
      if (!list.length)
        return { projectName: String(options2.projectName || projectName()).trim(), multiData: multiData };
      const handle = String(
          options2.canvasId ||
            window.CanvasTabManager?.getActiveCanvasId?.() ||
            multiData.activeCanvasId ||
            '',
        ).trim(),
        canvases2 =
          list.find((item3) => String(item3?.id || '') === handle) ||
          list.find((item4) => String(item4?.id || '') === String(multiData.activeCanvasId || '')) ||
          list[0],
        projectName2 = String(options2.projectName || canvases2?.name || projectName()).trim();
      return {
        projectName: projectName2,
        multiData: {
          ...multiData,
          canvases: canvases2 ? [canvases2] : [],
          activeCanvasId: canvases2?.id || handle || null,
        },
      };
    }
    function run8(list2 = [], state = 3) {
      const count = Array.isArray(list2)
        ? list2
            .map((response) => String(response?.localPath || response?.url || response || '').trim())
            .filter(Boolean)
        : [];
      if (!count.length) return '';
      const items = count.slice(0, state).join(projectDropdownText('listSeparator'));
      return count.length > state
        ? projectDropdownText('listMore', { items: items, count: count.length })
        : items;
    }
    function run9(error2 = {}) {
      if (error2.code === 'MISSING_LOCAL_ASSETS') {
        const summary = run8(error2.missing);
        return summary
          ? projectDropdownText('packageExport.missingLocalWithSummary', { summary: summary })
          : projectDropdownText('packageExport.missingLocal');
      }
      if (error2.code === 'REMOTE_MEDIA_NOT_LOCALIZED') {
        const summary2 = run8(error2.remoteMedia);
        return summary2
          ? projectDropdownText('packageExport.remoteNotLocalizedWithSummary', { summary: summary2 })
          : projectDropdownText('packageExport.remoteNotLocalized');
      }
      return error2.message || projectDropdownText('packageExport.failed');
    }
    function run10(list3 = []) {
      const list4 = Array.isArray(list3) ? list3 : [],
        count2 = list4.filter((item5) => item5?.type === 'missing-original-video-fallback').length;
      if (count2 <= 0) return '';
      return projectDropdownText('packageExport.missingOriginalVideos', { count: count2 });
    }
    function run11(config = 'pkg') {
      return config + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    }
    let enabled3 = null;
    function run12(scope) {
      const seconds = Math.max(0, Math.floor((Date.now() - scope) / 0x3e8));
      if (seconds < 60) return projectDropdownText('elapsedSeconds', { seconds: seconds });
      const minutes = Math.floor(seconds / 60),
        seconds2 = String(seconds % 60).padStart(2, '0');
      return projectDropdownText('elapsedMinutesSeconds', { minutes: minutes, seconds: seconds2 });
    }
    function run13(error3 = {}) {
      const input = String(error3?.message || projectDropdownText('packageProcessing')).trim(),
        count3 = Number(error3?.progress);
      if (!Number.isFinite(count3) || count3 < 0) return input;
      return input + ' · ' + Math.round(Math.max(0, Math.min(1, count3)) * 100) + '%';
    }
    function run14(options3 = {}) {
      if (!enabled3) return;
      const {
          root: root,
          titleEl: titleEl,
          messageEl: messageEl,
          elapsedEl: elapsedEl,
          progressEl: progressEl,
          startedAt: startedAt,
        } = enabled3,
        output = String(options3?.title || projectDropdownText('collectingCurrentProject')).trim(),
        value2 = run13(options3),
        value3 = run12(startedAt),
        count4 = Number(options3?.progress),
        enabled4 = Number.isFinite(count4) && count4 >= 0;
      (setText(titleEl, output),
        setText(messageEl, value2),
        setText(elapsedEl, value3),
        root.setAttribute('aria-label', output + '，' + value2 + '，' + value3));
      enabled4 ? root.classList.add('has-progress') : root.classList.remove('has-progress');
      progressEl.hidden = !enabled4;
      if (enabled4) progressEl.value = Math.max(0, Math.min(1, count4));
      enabled3.lastPayload = options3;
    }
    function run15(lastPayload = {}) {
      if (typeof document === 'undefined' || !document.body) return;
      if (enabled3?.root) {
        run14(lastPayload);
        return;
      }
      document.getElementById?.('project-package-loading')?.remove?.();
      const root2 = document.createElement('div');
      ((root2.id = 'project-package-loading'),
        (root2.className = 'project-package-loading is-visible'),
        root2.setAttribute('role', 'status'),
        root2.setAttribute('aria-live', 'polite'));
      const el10 = document.createElement('div');
      el10.className = 'project-package-loading-panel';
      const el11 = document.createElement('div');
      ((el11.className = 'project-package-loading-spinner'), el11.setAttribute('aria-hidden', 'true'));
      const el12 = document.createElement('div');
      el12.className = 'project-package-loading-body';
      const titleEl2 = document.createElement('div');
      titleEl2.className = 'project-package-loading-title';
      const messageEl2 = document.createElement('div');
      messageEl2.className = 'project-package-loading-message';
      const el13 = document.createElement('div');
      el13.className = 'project-package-loading-meta';
      const elapsedEl2 = document.createElement('span');
      ((elapsedEl2.className = 'project-package-loading-elapsed'), el13.appendChild(elapsedEl2));
      const progressEl2 = document.createElement('progress');
      ((progressEl2.className = 'project-package-loading-progress'),
        (progressEl2.max = 1),
        (progressEl2.value = 0),
        (progressEl2.hidden = true),
        el12.appendChild(titleEl2),
        el12.appendChild(messageEl2),
        el12.appendChild(el13),
        el12.appendChild(progressEl2),
        el10.appendChild(el11),
        el10.appendChild(el12),
        root2.appendChild(el10),
        document.body.appendChild(root2));
      const timerId =
        typeof window.setInterval === 'function' ? window.setInterval.bind(window) : setInterval;
      ((enabled3 = {
        root: root2,
        titleEl: titleEl2,
        messageEl: messageEl2,
        elapsedEl: elapsedEl2,
        progressEl: progressEl2,
        startedAt: Date.now(),
        lastPayload: lastPayload,
        timerId: timerId(() => {
          run14(enabled3?.lastPayload || {});
        }, 0x3e8),
      }),
        run14(lastPayload));
    }
    function run16(options4 = {}) {
      if (!enabled3) run15(options4);
      run14(options4);
    }
    async function run17() {
      if (typeof window.requestAnimationFrame === 'function') {
        await new Promise((value4) => {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(value4);
          });
        });
        return;
      }
      const run18 = typeof window.setTimeout === 'function' ? window.setTimeout.bind(window) : setTimeout;
      await new Promise((value5) => run18(value5, 0));
    }
    async function run19(message = projectDropdownText('loadingProjectDefault')) {
      (run15({ title: projectDropdownText('loadingProjectTitle'), message: message }), await run17());
    }
    function run20() {
      if (!enabled3) return;
      const value6 = enabled3;
      enabled3 = null;
      const run21 =
          typeof window.clearInterval === 'function' ? window.clearInterval.bind(window) : clearInterval,
        handler = typeof window.setTimeout === 'function' ? window.setTimeout.bind(window) : setTimeout;
      (run21(value6.timerId),
        value6.root.classList.remove('is-visible'),
        value6.root.classList.add('is-hiding'),
        handler(() => value6.root.remove?.(), 180));
    }
    function run22(value7, { title: title = projectDropdownText('collectingCurrentProject') } = {}) {
      const run23 = window.electronAPI?.project?.onPackageProgress;
      if (typeof run23 !== 'function') return () => {};
      const value8 = run23((args = {}) => {
        if (String(args?.operationId || '') !== value7) return;
        run16({ title: title, ...args });
      });
      return typeof value8 === 'function' ? value8 : () => {};
    }
    function run24(el14) {
      if (!el14) return;
      (el14.classList.remove('is-shaking'),
        void el14.offsetWidth,
        el14.classList.add('is-shaking'),
        window.setTimeout(() => {
          el14.classList.remove('is-shaking');
        }, 240));
    }
    function run25(value9, el15, el16) {
      (run24(value9),
        window.setTimeout(() => {
          ((el15.hidden = true), (el16.hidden = false));
        }, 180));
    }
    function run26(el17) {
      const box2 = el17?.getBoundingClientRect?.();
      if (!box2) return null;
      const left = Number(box2.left ?? 0),
        top = Number(box2.top ?? 0),
        count5 = Number(box2.width),
        count6 = Number(box2.height),
        value10 = Number(box2.right),
        value11 = Number(box2.bottom),
        width =
          Number.isFinite(count5) && count5 > 0 ? count5 : Number.isFinite(value10) ? value10 - left : 0,
        height =
          Number.isFinite(count6) && count6 > 0 ? count6 : Number.isFinite(value11) ? value11 - top : 0;
      if (
        !Number.isFinite(left) ||
        !Number.isFinite(top) ||
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width <= 0 ||
        height <= 0
      )
        return null;
      return {
        left: left,
        top: top,
        width: width,
        height: height,
        right: left + width,
        bottom: top + height,
      };
    }
    function run27(box3) {
      if (!box3) return null;
      const count7 = Number(window.innerWidth || 0),
        count8 = Number(window.innerHeight || 0);
      if (count7 <= 0 || count8 <= 0) return box3;
      const left2 = Math.max(0, box3.left),
        top2 = Math.max(0, box3.top),
        right = Math.min(count7, box3.right),
        bottom = Math.min(count8, box3.bottom),
        width2 = right - left2,
        height2 = bottom - top2;
      if (width2 <= 0 || height2 <= 0) return box3;
      return {
        left: left2,
        top: top2,
        width: width2,
        height: height2,
        right: right,
        bottom: bottom,
      };
    }
    function run28() {
      const value12 = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      if (value12) return;
      const value13 =
          run26(document.getElementById('v2-canvas')) || run26(document.getElementById('v2-wrap')),
        box4 = run27(value13),
        box5 = run26(button || document.getElementById('btnCanvasLogo'));
      if (!box4 || !box5) return;
      const value14 = box4.width / box4.height || 4 / 3;
      let value15 = Math.min(box4.width, Math.max(140, Math.min(0x168, box4.width * 0.42))),
        value16 = value15 / value14;
      const value17 = Math.min(box4.height, Math.max(96, Math.min(240, box4.height * 0.42)));
      value16 > value17 && ((value16 = value17), (value15 = value16 * value14));
      ((value15 = Math.max(1, Math.round(value15))), (value16 = Math.max(1, Math.round(value16))));
      const value18 = box4.left + box4.width / 2,
        value19 = box4.top + box4.height / 2,
        value20 = box5.left + box5.width / 2,
        value21 = box5.top + box5.height / 2,
        value22 = Math.round(value18 - value15 / 2),
        value23 = Math.round(value19 - value16 / 2),
        value24 = value20 - value18,
        value25 = value21 - value19,
        el18 = document.createElement('div');
      ((el18.className = 'v2-project-save-fly'),
        (el18.style.left = value22 + 'px'),
        (el18.style.top = value23 + 'px'),
        (el18.style.width = value15 + 'px'),
        (el18.style.height = value16 + 'px'),
        document.body.appendChild(el18));
      const value26 = (() => {
        let value27 = false;
        return () => {
          if (value27) return;
          ((value27 = true),
            el18.remove?.(),
            button?.animate &&
              button.animate(
                [
                  { transform: 'scale(1)', filter: 'brightness(1)' },
                  { transform: 'scale(1.08)', filter: 'brightness(1.2)' },
                  { transform: 'scale(1)', filter: 'brightness(1)' },
                ],
                { duration: 0x104, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
              ));
        };
      })();
      if (typeof el18.animate === 'function') {
        const value28 = el18.animate(
          [
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: 'translate(' + value24 + 'px,' + value25 + 'px) scale(0.12)', opacity: 0.18 },
          ],
          { duration: 0x230, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
        );
        ((value28.onfinish = value26), (value28.oncancel = value26));
        return;
      }
      window.setTimeout(value26, 0x230);
    }
    function apply(enabled5) {
      if (!enabled5 || enabled5.canceled) return false;
      const validData = requireOpenedProjectDocument(enabled5);
      const multiData2 = sanitizeMultiCanvasDataForPersistence(
        enabled5.multiData || project.resolveCanvasData(validData),
      );
      (clearRendererCache(),
        window.CanvasTabManager?.init?.(multiData2),
        window.CanvasTabManager?.markAllCanvasesClean?.(),
        commit());
      const projectName3 =
        enabled5.projectName ||
        stripProjectFileExtensionFromName(enabled5.filename) ||
        projectDropdownText('unnamedCanvas');
      ((window._v2CurrentFile = enabled5.filename || projectName3 + '.aicanvas'),
        (window._v2CurrentRecentProjectId = enabled5.recentId || ''),
        (window._v2CurrentProjectDisplayPath = enabled5.displayPath || ''),
        (window._v2CurrentProjectLastModified = Number(enabled5.lastModified || 0) || 0),
        (window.currentProjectId = enabled5.projectId || stripProjectFileExtensionFromName(projectName3)));
      const el19 = document.getElementById('projectNameText');
      if (el19) el19.textContent = projectName3;
      return (
        window.CanvasTabManager?.renderTabs?.(),
        window._queueLegacyThumbnailMigration?.({
          projectId: window.currentProjectId,
          projectName: projectName3,
          multiData: multiData2,
        }),
        window._triggerLocalCacheSave?.(),
        true
      );
    }
    function run29(value29) {
      const value30 = String(value29 || '').trim() || projectDropdownText('loadedPackageBase'),
        map2 = new Set(
          (window.CanvasTabManager?._canvases || []).map((error4) => String(error4?.name || '').trim()),
        );
      if (!map2.has(value30)) return value30;
      for (let count9 = 2; count9 < 0x3e8; count9 += 1) {
        const value31 = value30 + ' (' + count9 + ')';
        if (!map2.has(value31)) return value31;
      }
      return value30 + ' ' + Date.now();
    }
    function run30(enabled6) {
      if (!enabled6 || enabled6.canceled) return false;
      const sanitizeMultiCanvasDataForPersistence2 = sanitizeMultiCanvasDataForPersistence(
          enabled6.multiData || project.resolveCanvasData(enabled6.data || {}),
        ),
        error5 =
          sanitizeMultiCanvasDataForPersistence2.canvases.find(
            (item6) => item6.id === sanitizeMultiCanvasDataForPersistence2.activeCanvasId,
          ) || sanitizeMultiCanvasDataForPersistence2.canvases[0];
      if (!error5) return false;
      const value32 = run29(
        error5.name ||
          enabled6.projectName ||
          stripProjectFileExtensionFromName(enabled6.filename) ||
          projectDropdownText('loadedPackageBase'),
      );
      window.CanvasTabManager?.addCanvas?.();
      const enabled7 = window.CanvasTabManager?._activeId;
      if (!enabled7) return false;
      return (
        window.CanvasTabManager?.renameCanvas?.(enabled7, value32),
        window.CanvasTabManager?.hydrateActiveCanvasSnapshot?.(error5),
        window.CanvasTabManager?.renderTabs?.(),
        commit(),
        window._triggerLocalCacheSave?.(),
        true
      );
    }
    async function run31(recentId = '') {
      let enabled8 = false;
      try {
        recentId && (await run19(projectDropdownText('readingLocalProject')), (enabled8 = true));
        const name = await openDesktopProject({ recentId: recentId });
        if (!name || name.canceled) return;
        (!enabled8
          ? (await run19(projectDropdownText('renderingCanvas')), (enabled8 = true))
          : (run16({
              title: projectDropdownText('loadingProjectTitle'),
              message: projectDropdownText('renderingCanvas'),
            }),
            await run17()),
          apply(name) &&
            (closeSidebarSubmenu('canvas-project'),
            run32(projectDropdownText('opened', { name: name.projectName || name.filename }))));
      } catch (error6) {
        (console.error('[desktopProject] open failed:', error6),
          run32(error6?.message || projectDropdownText('openLocalFailed'), 'error'));
      } finally {
        run20();
      }
    }
    async function run33() {
      window.showGlobalLoading && window.showGlobalLoading(projectDropdownText('savingLocal'));
      try {
        const filename = await saveDesktopProject(projectName(), run6(), { mode: 'saveAs' });
        if (!filename || filename.canceled) return;
        ((window._v2CurrentFile = filename.filename),
          (window._v2CurrentRecentProjectId = filename.recentId || ''),
          (window._v2CurrentProjectDisplayPath = filename.displayPath || ''),
          (window._v2CurrentProjectLastModified = Number(filename.lastModified || 0) || 0),
          (window.currentProjectId =
            filename.projectId || stripProjectFileExtensionFromName(filename.filename)),
          window.CanvasTabManager?.markAllCanvasesClean?.(),
          run32(projectDropdownText('saveAsSucceeded', { filename: filename.filename })),
          run34());
      } catch (error7) {
        (console.error('[desktopProject] saveAs failed:', error7),
          run32(error7?.message || projectDropdownText('saveAsFailed'), 'error'));
      } finally {
        if (window.hideGlobalLoading) window.hideGlobalLoading();
      }
    }
    async function run35(options5 = {}) {
      const operationId2 = run11('export-package'),
        handler2 = run22(operationId2, { title: projectDropdownText('collectingCurrentProject') });
      try {
        const value33 = run7(options5),
          filename2 = await exportDesktopProjectPackage(
            value33.projectName || projectName(),
            value33.multiData,
            {
              projectId: window.currentProjectId || '',
              recentId: window._v2CurrentRecentProjectId || '',
              displayPath: window._v2CurrentProjectDisplayPath || '',
              operationId: operationId2,
            },
          );
        if (!filename2 || filename2.canceled) return;
        if (filename2.blocked) {
          (console.warn('[desktopProject] export package blocked:', filename2),
            run32(run9(filename2), 'error'));
          return;
        }
        if (!filename2.success) {
          run32(filename2.message || projectDropdownText('packageExport.failed'), 'error');
          return;
        }
        const warning = run10(filename2.warnings);
        if (warning) {
          (console.warn('[desktopProject] export package warnings:', filename2.warnings),
            run32(
              projectDropdownText('packageExport.collectedWithWarning', {
                filename: filename2.filename || projectDropdownText('packageFallback'),
                warning: warning,
              }),
              'warn',
            ));
          return;
        }
        run32(
          projectDropdownText('packageExport.collected', {
            filename: filename2.filename || projectDropdownText('packageFallback'),
          }),
        );
      } catch (error8) {
        (console.error('[desktopProject] export package failed:', error8),
          run32(error8?.message || projectDropdownText('packageExport.failed'), 'error'));
      } finally {
        (handler2(), run20());
      }
    }
    let fullPackageUiBusy = false;
    async function runFullPackage(mode, externalPackageTicket) {
      if (fullPackageUiBusy) {
        run32('已有完整工程包操作正在执行', 'error');
        return;
      }
      fullPackageUiBusy = true;
      const operationId = run11('full-package-' + mode);
      const release = run22(operationId, { title: mode === 'export' ? '收集全部画布' : '恢复独立工程' });
      try {
        const result = await runFullProjectPackage({
          mode,
          api: window.electronAPI?.project,
          projectName: projectName(),
          projectId: window.currentProjectId || '',
          operationId,
          externalPackageTicket,
          readContext: () => ({
            nodes: appStore.getStateRaw().nodes,
            canvases: window.CanvasTabManager?._canvases,
            identity: JSON.stringify([
              window.currentProjectId,
              window._v2CurrentRecentProjectId,
              window._v2CurrentProjectDisplayPath,
            ]),
            data: window.CanvasTabManager?.getMultiDataSnapshot?.({
              sanitizeForPersistence: true,
              captureVisualSnapshot: false,
            }),
          }),
          confirmSwitch: (result) =>
            window.confirm(
              `已恢复 ${result.canvasCount} 张画布到独立工程文件。现在切换打开？\n${result.projectPath}\n\n未应用工作室草稿和当前工程的未保存修改不会写入该文件；请先导出草稿/保存当前工程，必要时取消切换。取消切换也保留恢复文件。不是任务恢复，不自动重发生成。`,
            ),
          openProject: (result) => apply({ ...result, multiData: result.data }),
          onRetained: showRetainedProjectPackage,
        });
        if (result?.cleanupWarnings?.length) run32(result.cleanupWarnings.join('\n'), 'error');
        if (result?.success && mode === 'export')
          run32(`完整工程包已写入：${result.filename}（${result.canvasCount} 张画布）。原工程未另行保存。`);
      } catch (error) {
        run32(error?.message || '完整工程包操作失败', 'error');
      } finally {
        release();
        run20();
        fullPackageUiBusy = false;
      }
    }
    async function run36(path = '') {
      const operationId3 = run11('import-package'),
        handler3 = run22(operationId3, { title: projectDropdownText('loadingProjectTitle') });
      try {
        const assertCurrent = captureExternalProjectTarget(readExternalProjectTarget);
        path && (await run19(projectDropdownText('readingProjectPackage')));
        assertCurrent();
        const name2 = await importDesktopProjectPackage({ path: path, operationId: operationId3 });
        if (!name2 || name2.canceled) return name2;
        return (
          !enabled3
            ? await run19(projectDropdownText('renderingProjectPackage'))
            : (run16({
                title: projectDropdownText('loadingProjectTitle'),
                message: projectDropdownText('renderingProjectPackage'),
              }),
              await run17()),
          assertCurrent(),
          run30(name2) &&
            (closeSidebarSubmenu('canvas-project'),
            run32(
              projectDropdownText('packageImport.loaded', {
                name: name2.projectName || name2.filename,
              }),
            )),
          name2
        );
      } catch (error9) {
        return (
          console.error('[desktopProject] import package failed:', error9),
          run32(error9?.message || projectDropdownText('packageImport.failed'), 'error'),
          null
        );
      } finally {
        (handler3(), run20());
      }
    }
    function run37() {
      return window.CanvasTabManager?.hasDirtyCanvases?.() === true;
    }
    function readExternalProjectTarget() {
      const manager = window.CanvasTabManager;
      return {
        manager,
        nodes: appStore.getStateRaw()?.nodes,
        canvases: manager?._canvases,
        key: JSON.stringify([
          window.currentProjectId,
          window._v2CurrentFile,
          window._v2CurrentRecentProjectId,
          window._v2CurrentProjectDisplayPath,
          manager?.getActiveCanvasId?.(),
        ]),
      };
    }
    function confirmReplace(value34) {
      if (!run37()) return true;
      const filename3 = value34?.filename || projectDropdownText('externalProject');
      return window.confirm?.(projectDropdownText('confirmExternalDirty', { filename: filename3 })) === true;
    }
    async function run38(response2) {
      if (!response2 || typeof response2 !== 'object') return;
      if (response2.success === false) {
        run32(response2.error || projectDropdownText('externalOpenFailed'), 'error');
        return;
      }
      if (response2.kind === 'fullProjectPackage') {
        if (typeof response2.externalPackageTicket !== 'string') {
          run32('系统工程包请求缺少可信凭据，请重新从系统打开文件', 'error');
          return;
        }
        await runFullPackage('restore', response2.externalPackageTicket);
        return;
      }
      if (response2.kind === 'projectPackage') {
        run32(
          '旧桌面端的系统打开只会导入活动画布。为保留全部画布，请从“恢复完整工程包（独立工程）”菜单重新选包；系统直达需更新并重启桌面端',
          'error',
        );
        return;
      }
      try {
        requireOpenedProjectDocument(response2); // Reject old-host malformed files before the dirty-canvas confirmation.
        const opened = await runGuardedExternalProjectOpen({
          response: response2,
          readTarget: readExternalProjectTarget,
          prepare: () => run19(projectDropdownText('renderingCanvas')),
          confirmReplace: confirmReplace,
          apply: apply,
        });
        if (opened) {
          closeSidebarSubmenu('canvas-project');
          run32(projectDropdownText('opened', { name: response2.projectName || response2.filename }));
        }
      } catch (error10) {
        (console.error('[desktopProject] external open failed:', error10),
          run32(error10?.message || projectDropdownText('externalOpenFailed'), 'error'));
      } finally {
        run20();
      }
    }
    const run39 = createSerialExternalProjectOpener(run38, (error) => {
      console.error('[desktopProject] external open request failed:', error);
      run32(error?.message || projectDropdownText('externalOpenFailed'), 'error');
    });
    async function run40() {
      const run41 = window.electronAPI?.project?.consumeExternalOpenRequests;
      if (typeof run41 !== 'function') return;
      try {
        await run39(await run41());
      } catch (error11) {
        (console.error('[desktopProject] consume external open failed:', error11),
          run32(error11?.message || projectDropdownText('externalOpenFailed'), 'error'));
      }
    }
    function run42() {
      const run43 = window.electronAPI?.project?.onExternalOpen;
      if (typeof run43 !== 'function') return;
      if (window.__aiCanvasExternalProjectOpenInstalled) return;
      ((window.__aiCanvasExternalProjectOpenInstalled = true),
        run43((value35) => {
          void run39(value35).catch((error) => {
            console.error('[desktopProject] external open batch failed:', error);
            run32(error?.message || projectDropdownText('externalOpenFailed'), 'error');
          });
        }),
        void run40());
    }
    function run44({ iconId: iconId, title: title2, onClick: onClick }) {
      const el20 = document.createElement('button');
      return (
        (el20.type = 'button'),
        (el20.className = 'cpd-local-action-btn'),
        (el20.dataset.tooltip = title2),
        el20.setAttribute('aria-label', title2),
        setStaticInnerHTML(el20, iconId),
        el20.addEventListener('click', (event) => {
          (event.preventDefault(), event.stopPropagation(), onClick?.());
        }),
        el20
      );
    }
    function run45() {
      if (!canUseDesktopProjectApi() || !el) return;
      let el21 = el.querySelector('.cpd-local-actions');
      if (el21) return;
      ((el21 = document.createElement('div')),
        (el21.className = 'cpd-local-actions'),
        el21.appendChild(
          run44({
            iconId: 'iconFolderOpen18',
            title: projectDropdownText('actions.openLocal'),
            onClick: () => run31(),
          }),
        ),
        el21.appendChild(
          run44({
            iconId: 'iconSaveAs18',
            title: projectDropdownText('actions.saveAsLocal'),
            onClick: () => run33(),
          }),
        ),
        el21.appendChild(
          run44({
            iconId: 'iconPackageExport18',
            title: projectDropdownText('actions.collectCurrent'),
            onClick: () => run35(),
          }),
        ),
        el21.appendChild(
          run44({
            iconId: 'iconPackageImport18',
            title: projectDropdownText('actions.loadPackage'),
            onClick: () => run36(),
          }),
        ));
      el21.appendChild(
        run44({
          iconId: 'iconPackageExport18',
          title: '收集完整工程（全部画布）',
          onClick: () => runFullPackage('export'),
        }),
      );
      el21.appendChild(
        run44({
          iconId: 'iconPackageImport18',
          title: '恢复完整工程包（独立工程）',
          onClick: () => runFullPackage('restore'),
        }),
      );
      const value36 = el.querySelector('.cpd-close');
      el.insertBefore(el21, value36 || null);
    }
    async function run34() {
      (run45(), clearElement(el2));
      const value37 = document.createElement('div');
      ((value37.className = 'cpd-loading'),
        setText(value37, projectDropdownText('loading')),
        el2.appendChild(value37),
        requestAnimationFrame(run));
      try {
        const list5 = await fetchV2ProjectsFromServer();
        if (!list5.length) {
          clearElement(el2);
          const value38 = document.createElement('div');
          ((value38.className = 'cpd-empty'),
            setText(value38, projectDropdownText('emptyProjects')),
            el2.appendChild(value38),
            requestAnimationFrame(run));
          return;
        }
        (clearElement(el2),
          list5.forEach((error12) => {
            const el22 = document.createElement('div');
            ((el22.className = 'cpd-item'),
              (el22.dataset.filename = error12.filename),
              (el22.dataset.name = error12.name));
            const el23 = document.createElement('div');
            el23.className = 'cpd-item-left';
            const value39 = document.createElement('div');
            ((value39.className = 'cpd-item-icon'), setStaticInnerHTML(value39, 'cpdProjectItemIcon16'));
            const el24 = document.createElement('div');
            el24.className = 'cpd-item-info';
            const value40 = document.createElement('div');
            ((value40.className = 'cpd-item-name'),
              setText(value40, error12.name),
              el24.appendChild(value40),
              el23.appendChild(value39),
              el23.appendChild(el24));
            const el25 = document.createElement('div');
            ((el25.className = 'cpd-item-actions'), el22.appendChild(el23), el22.appendChild(el25));
            const el26 = document.createElement('div');
            ((el26.className = 'cpd-item-delete'), setStaticInnerHTML(el26, 'iconTrash18'));
            const el27 = document.createElement('div');
            ((el27.className = 'cpd-confirm-panel'), (el27.hidden = true));
            const el28 = document.createElement('button');
            ((el28.type = 'button'),
              (el28.className = 'cpd-confirm-btn cpd-confirm-btn--danger'),
              (el28.textContent = '✔'),
              el28.setAttribute('aria-label', projectDropdownText('confirm')));
            const el29 = document.createElement('button');
            ((el29.type = 'button'),
              (el29.className = 'cpd-confirm-btn cpd-confirm-btn--neutral'),
              (el29.textContent = '×'),
              el29.setAttribute('aria-label', projectDropdownText('cancel')),
              el27.appendChild(el28),
              el27.appendChild(el29),
              el25.appendChild(el26),
              el25.appendChild(el27),
              el23.addEventListener('click', (event2) => {
                (event2.stopPropagation(), run46(error12.filename, error12.name));
              }),
              el26.addEventListener('click', (event3) => {
                (event3.stopPropagation(), run25(el22, el26, el27));
              }),
              el29.addEventListener('click', (event4) => {
                (event4.stopPropagation(), (el27.hidden = true), (el26.hidden = false));
              }),
              el28.addEventListener('click', async (event5) => {
                (event5.stopPropagation(), (el28.textContent = '...'));
                const deleteV2ProjectFromServer2 = await deleteV2ProjectFromServer(error12.filename);
                deleteV2ProjectFromServer2
                  ? (run32(projectDropdownText('deleted')), run34())
                  : (run32(projectDropdownText('deleteFailed')), (el28.textContent = '✔'));
              }),
              el22.addEventListener('contextmenu', (event6) => {
                (event6.preventDefault(), event6.stopPropagation());
              }),
              el2.appendChild(el22));
          }),
          requestAnimationFrame(run));
      } catch (value41) {
        clearElement(el2);
        const value42 = document.createElement('div');
        ((value42.className = 'cpd-empty'),
          setText(value42, projectDropdownText('listLoadFailed')),
          el2.appendChild(value42),
          requestAnimationFrame(run));
      }
    }
    async function run46(value43, projectName4) {
      try {
        await run19(projectDropdownText('readingProjectData'));
        const projectId = String(value43 || '').replace(/\.json$/i, ''),
          multiData3 = await project.loadProject(projectId);
        (run16({
          title: projectDropdownText('loadingProjectTitle'),
          message: projectDropdownText('renderingCanvas'),
        }),
          await run17());
        const sanitizeMultiCanvasDataForPersistence3 = sanitizeMultiCanvasDataForPersistence(multiData3),
          value44 =
            sanitizeMultiCanvasDataForPersistence3.canvases.find(
              (item7) => item7.id === sanitizeMultiCanvasDataForPersistence3.activeCanvasId,
            ) || sanitizeMultiCanvasDataForPersistence3.canvases[0],
          value45 = window.CanvasTabManager._canvases.find((error13) => error13.name === projectName4);
        value45
          ? window.CanvasTabManager.switchTo(value45.id)
          : (window.CanvasTabManager.addCanvas(),
            window.CanvasTabManager.renameCanvas(window.CanvasTabManager._activeId, projectName4));
        window._v2ApplySourceNamesFromFileNameToCanvas &&
          window._v2ApplySourceNamesFromFileNameToCanvas(value44);
        (window.CanvasTabManager.hydrateActiveCanvasSnapshot(value44),
          window.CanvasTabManager.markCanvasClean(window.CanvasTabManager._activeId),
          commit(),
          (window._v2CurrentFile = value43),
          (window._v2CurrentRecentProjectId = ''),
          (window._v2CurrentProjectDisplayPath = ''),
          (window._v2CurrentProjectLastModified = 0),
          (window.currentProjectId = projectId),
          window._queueLegacyThumbnailMigration?.({
            projectId: projectId,
            projectName: projectName4,
            multiData: multiData3,
          }));
        const el30 = document.getElementById('projectNameText');
        if (el30) el30.textContent = projectName4;
        (window.CanvasTabManager.renderTabs(),
          closeSidebarSubmenu('canvas-project'),
          run32(projectDropdownText('loaded', { name: projectName4 })));
      } catch (value46) {
        (console.error('load project error:', value46), run32(projectDropdownText('loadFailed'), 'error'));
      } finally {
        run20();
      }
    }
    async function run47(name3) {
      try {
        const value47 = window.CanvasTabManager?.getMultiDataSnapshot?.({
            sanitizeForPersistence: true,
          }) || { canvases: [], activeCanvasId: null },
          response3 = await project.saveProject(name3, value47);
        if (response3?.canceled) return;
        if (response3.success) {
          ((window._v2CurrentFile = response3.filename),
            (window._v2CurrentRecentProjectId = ''),
            (window._v2CurrentProjectDisplayPath = ''),
            (window._v2CurrentProjectLastModified = 0),
            (window.currentProjectId =
              response3.projectId || stripProjectFileExtensionFromName(response3.filename)),
            window.CanvasTabManager.renameCanvas(window.CanvasTabManager._activeId, name3));
          const el31 = document.getElementById('projectNameText');
          if (el31) el31.textContent = name3;
          (window.CanvasTabManager.renderTabs(),
            window.CanvasTabManager.markAllCanvasesClean(),
            run28(),
            run32(projectDropdownText('saveSucceeded', { name: name3 })),
            await run34());
        }
      } catch (value48) {
        (console.error('[saveProject] JSON 保存失败:', value48),
          run32(projectDropdownText('saveFailed'), 'error'));
      }
    }
    ((window._v2SaveProject = run47),
      (window._v2SaveProjectAsLocal = run33),
      (window._v2ExportCurrentProjectPackage = run35),
      (window._v2ImportProjectPackageByPath = run36));
    function run32(value49, value50 = 'ok') {
      window.showToast(value49, value50);
    }
    function open() {
      if (!button || !panel) return;
      (run(), panel.classList.add('open'), requestAnimationFrame(run), run34());
    }
    function close() {
      panel.classList.remove('open');
    }
    (registerSidebarSubmenu({
      key: 'canvas-project',
      button: button,
      panel: panel,
      open: open,
      close: close,
      isOpen: () => panel.classList.contains('open'),
      openClass: 'open',
    }),
      el3?.addEventListener('click', (event7) => {
        (event7.preventDefault(), event7.stopPropagation(), closeSidebarSubmenu('canvas-project'));
      }),
      el4?.addEventListener('click', () => {
        (closeSidebarSubmenu('canvas-project'),
          window.CanvasTabManager?.addCanvas?.(),
          run32(projectDropdownText('newCanvasCreated')));
      }));
    function run48() {
      const error14 = window.CanvasTabManager._canvases.find(
        (item8) => item8.id === window.CanvasTabManager._activeId,
      );
      ((el6.value = error14 ? error14.name : projectDropdownText('unnamedCanvas')),
        el5.classList.add('open'),
        setTimeout(() => {
          (el6.focus(), el6.select());
        }, 80));
    }
    window._openSaveDialog = run48;
    function run49() {
      const enabled9 = run5();
      if (!enabled9) return (run48(), false);
      return run47(enabled9);
    }
    window._v2SaveProjectFromShortcut = run49;
    function run50() {
      el5.classList.remove('open');
    }
    (el7?.addEventListener('click', run50),
      el8?.addEventListener('click', () => {
        const value51 = el6.value.trim() || projectDropdownText('unnamedCanvas');
        (run50(), run47(value51));
      }),
      el6?.addEventListener('keydown', (event8) => {
        (event8.key === 'Enter' && (event8.preventDefault(), el8.click()),
          event8.key === 'Escape' && (event8.preventDefault(), run50()));
      }),
      run42(),
      window.addEventListener('resize', () => {
        panel.classList.contains('open') && run();
      }));
  },
};
export default CanvasProjectDropdownManager;
export { CanvasProjectDropdownManager };
