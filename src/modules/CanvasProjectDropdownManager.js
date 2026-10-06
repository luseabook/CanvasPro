import { createCanvasProjectSaveController } from './canvasProjectSaveController.js';
import { buildCanvasProjectContext, createCanvasProjectOperations } from './canvasProjectOperations.js';
import { clearElement, setStaticInnerHTML, setText } from '../utils/dom.js';
import { stripCanvasProjectFileExtension } from '../utils/canvasProjectFileNames.js';
import {
  canUseDesktopProjectApi,
  exportDesktopProjectPackage,
  importDesktopProjectPackage,
  openDesktopProject,
} from '../services/desktopProjectService.js';
import { deleteV2ProjectFromServer, fetchV2ProjectsFromServer } from '../../api/projectsV2Api.js';
import { showContextMenu } from './interaction/contextMenuPresenter.js';
import { closeSidebarSubmenu, registerSidebarSubmenu } from './sidebarSubmenuController.js';
import { t } from '../i18n/index.js';
import { desktopBridge } from '../services/desktopBridge.js';
import { assertCanvasProjectSaveAllowed } from '../services/canvasProjectAccess.js';
import { createCanvasProjectBadge } from '../components/sharedProjectIcon.js';
import { CANVAS_TOOLBAR_PLACEMENT_EVENT, normalizeCanvasToolbarPlacement } from './canvasToolbarPlacement.js';
function projectDropdownText(value, item = {}) {
  return t('projectDropdown.' + value, item);
}
function stripProjectFileExtensionFromName(key) {
  return stripCanvasProjectFileExtension(key);
}
const CanvasProjectDropdownManager = {
  init(onProjectHydrated = {}) {
    const index = 12,
      result = 12,
      button = document.getElementById('btnCanvasLogo'),
      panel = document.getElementById('canvasProjDropdown'),
      el = panel?.querySelector('.cpd-header'),
      el2 = document.getElementById('canvasProjList'),
      el3 = document.getElementById('btnCloseProjDropdown'),
      el4 = document.getElementById('btnNewCanvas'),
      el5 = document.getElementById('saveDialogOverlay'),
      el6 = document.getElementById('saveDialogInput'),
      el7 = document.getElementById('saveDialogCancel'),
      el8 = document.getElementById('saveDialogConfirm'),
      handler =
        typeof onProjectHydrated.getCanvasToolbarPlacement === 'function'
          ? onProjectHydrated.getCanvasToolbarPlacement
          : () => 'left',
      handler2 =
        typeof onProjectHydrated.onWorkspaceProjectPackageImported === 'function'
          ? onProjectHydrated.onWorkspaceProjectPackageImported
          : null;
    let showContextMenu2 = null;
    const projectWorkspaceSessions = onProjectHydrated.projectWorkspaceSessions || {
      async save() {},
      async load() {
        return null;
      },
      async clear() {},
      async move() {},
    };
    let data = 0,
      enabled = false;
    if (!button || !panel || !el5) return;
    const options =
      onProjectHydrated.projectOperations ||
      createCanvasProjectOperations({
        getCanvasManager: () => window.CanvasTabManager,
        getActiveProjectContext: getActiveProjectContext,
        onProjectHydrated: onProjectHydrated.onProjectHydrated,
        renameTemporaryProject: onProjectHydrated.renameTemporaryProject,
        projectWorkspaceSessions: projectWorkspaceSessions,
        applySourceNames: (target) => window._v2ApplySourceNamesFromFileNameToCanvas?.(target),
        requestCacheSave: () => window._triggerLocalCacheSave?.(),
      });
    document.body.appendChild(panel);
    function run() {
      if (!button || !panel) return;
      const box = button.getBoundingClientRect(),
        enabled2 = panel.classList.contains('open');
      if (!enabled2) panel.classList.add('open');
      const source = panel.getBoundingClientRect().height || panel.offsetHeight || 0,
        next = panel.getBoundingClientRect().width || panel.offsetWidth || 0,
        canvasToolbarPlacement = normalizeCanvasToolbarPlacement(handler());
      panel.dataset.placement = canvasToolbarPlacement;
      if (canvasToolbarPlacement === 'bottom') {
        const current = window.innerWidth - next - result,
          entry = box.left + (box.width - next) / 2,
          record =
            current <= result ? result : Math.min(Math.max(entry, result), current),
          payload = Math.max(result, box.top - index - source);
        ((panel.style.left = record + 'px'), (panel.style.top = payload + 'px'));
        if (!enabled2) panel.classList.remove('open');
        return;
      }
      const handle = box.top + (box.height - source) / 2,
        state = window.innerHeight - source - result,
        config =
          state <= result ? result : Math.min(Math.max(handle, result), state),
        scope = Math.max(result, window.innerWidth - next - result),
        input =
          canvasToolbarPlacement === 'right' ? box.left - index - next : box.right + index,
        output = Math.min(Math.max(input, result), scope);
      ((panel.style.left = output + 'px'), (panel.style.top = config + 'px'));
      if (!enabled2) panel.classList.remove('open');
    }
    function run2(value2) {
      const value3 = new Date(value2 * 1000);
      return (
        value3.getFullYear() +
        '-' +
        String(value3.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(value3.getDate()).padStart(2, '0') +
        ' ' +
        String(value3.getHours()).padStart(2, '0') +
        ':' +
        String(value3.getMinutes()).padStart(2, '0')
      );
    }
    function projectName2() {
      const el9 = document.getElementById('projectNameText');
      return String(el9?.textContent || '').trim() || projectDropdownText('unnamedCanvas');
    }
    function run3() {
      const value4 = window.CanvasTabManager,
        value5 = String(value4?.getActiveCanvasId?.() || value4?._activeId || '').trim(),
        list = Array.isArray(value4?._canvases) ? value4._canvases : [],
        error =
          list.find((value6) => String(value6?.id || '') === value5) || list[0];
      return String(error?.name || '').trim();
    }
    function isAutoGeneratedProjectName(value7) {
      const enabled3 = String(value7 || '').trim();
      if (!enabled3) return true;
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
          .map((value8) => String(value8 || '').trim())
          .filter(Boolean),
      );
      if (map.has(enabled3)) return true;
      return /^(?:画布|Canvas)\s+\d+$/i.test(enabled3);
    }
    function run4(value9) {
      return stripProjectFileExtensionFromName(value9)
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
    }
    function run5(error2, value10) {
      const enabled4 = run4(value10);
      if (!enabled4) return false;
      return [error2?.name, error2?.filename].some(
        (value11) => run4(value11) === enabled4,
      );
    }
    async function projectNameExistsInProjectList(value12) {
      const list2 = await fetchV2ProjectsFromServer();
      return list2.some((value13) => run5(value13, value12));
    }
    function getShortcutSaveProjectName() {
      const value14 = run3();
      if (value14) return value14;
      return projectName2();
    }
    function run6() {
      return (
        window.CanvasTabManager?.getMultiDataSnapshot?.({ sanitizeForPersistence: true }) || {
          canvases: [],
          activeCanvasId: null,
        }
      );
    }
    function run7() {
      return stripProjectFileExtensionFromName(window.currentProjectId || window._v2CurrentFile || '');
    }
    function getActiveProjectContext() {
      return (
        window.CanvasTabManager?.getCanvasProjectContext?.() || {
          projectId: window.currentProjectId || '',
          filename: window._v2CurrentFile || '',
          projectName: projectName2(),
          recentId: window._v2CurrentRecentProjectId || '',
          displayPath: window._v2CurrentProjectDisplayPath || '',
          lastModified: Number(window._v2CurrentProjectLastModified || 0) || 0,
          isTemporary: false,
          workspaceProjectScoped: window._v2WorkspaceProjectScoped !== false,
        }
      );
    }
    function multiData() {
      const args = run6();
      if (window._v2WorkspaceProjectScoped === true) return args;
      const list3 = Array.isArray(args?.canvases) ? args.canvases : [],
        canvases2 =
          list3.find((value15) => value15?.id === args.activeCanvasId) ||
          list3[0] ||
          null;
      return {
        ...args,
        canvases: canvases2 ? [canvases2] : [],
        activeCanvasId: canvases2?.id || null,
      };
    }
    async function reconcileProjectSessionAfterSave(value16 = '') {
      const projectId2 = run7(),
        map2 = new Set(
          [value16, projectId2].map(stripProjectFileExtensionFromName).filter(Boolean),
        );
      (window.CanvasTabManager?.hasDirtyCanvases?.() === true &&
        (await projectWorkspaceSessions.save({
          projectId: projectId2,
          projectName: projectName2(),
          multiData: multiData(),
          hasUnsavedChanges: true,
        }),
        map2.delete(projectId2)),
        await Promise.all(Array.from(map2, (value17) => projectWorkspaceSessions.clear(value17))));
    }
    function getProjectPackageExportSource(options2 = {}) {
      const multiData2 = run6(),
        list4 = Array.isArray(multiData2?.canvases) ? multiData2.canvases : [];
      if (!list4.length)
        return {
          projectName: String(options2.projectName || projectName2()).trim(),
          multiData: multiData2,
        };
      const value18 = String(
          options2.canvasId ||
            window.CanvasTabManager?.getActiveCanvasId?.() ||
            multiData2.activeCanvasId ||
            '',
        ).trim(),
        error3 =
          list4.find((value19) => String(value19?.id || '') === value18) ||
          list4.find(
            (value20) => String(value20?.id || '') === String(multiData2.activeCanvasId || ''),
          ) ||
          list4[0],
        name = String(options2.projectName || error3?.name || projectName2()).trim(),
        canvases3 =
          error3 && options2.renameActiveCanvas ? { ...error3, name: name } : error3;
      return {
        projectName: name,
        multiData: {
          ...multiData2,
          canvases: canvases3 ? [canvases3] : [],
          activeCanvasId: canvases3?.id || value18 || null,
        },
      };
    }
    function run8(list5 = [], value21 = 3) {
      const count = Array.isArray(list5)
        ? list5.map((response) =>
            String(response?.localPath || response?.url || response || '').trim(),
          ).filter(Boolean)
        : [];
      if (!count.length) return '';
      const items = count.slice(0, value21).join(projectDropdownText('listSeparator'));
      return count.length > value21
        ? projectDropdownText('listMore', { items: items, count: count.length })
        : items;
    }
    function run9(error4 = {}) {
      if (error4.code === 'MISSING_LOCAL_ASSETS') {
        const summary = run8(error4.missing);
        return summary
          ? projectDropdownText('packageExport.missingLocalWithSummary', { summary: summary })
          : projectDropdownText('packageExport.missingLocal');
      }
      if (error4.code === 'REMOTE_MEDIA_NOT_LOCALIZED') {
        const summary2 = run8(error4.remoteMedia);
        return summary2
          ? projectDropdownText('packageExport.remoteNotLocalizedWithSummary', { summary: summary2 })
          : projectDropdownText('packageExport.remoteNotLocalized');
      }
      return error4.message || projectDropdownText('packageExport.failed');
    }
    function run10(list6 = []) {
      const list7 = Array.isArray(list6) ? list6 : [],
        count2 = list7.filter(
          (value22) => value22?.type === 'missing-original-video-fallback',
        ).length;
      if (count2 <= 0) return '';
      return projectDropdownText('packageExport.missingOriginalVideos', { count: count2 });
    }
    function run11(value23 = 'pkg') {
      return value23 + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    }
    let enabled5 = null;
    function run12(value24) {
      const seconds = Math.max(0, Math.floor((Date.now() - value24) / 1000));
      if (seconds < 60) return projectDropdownText('elapsedSeconds', { seconds: seconds });
      const minutes = Math.floor(seconds / 60),
        seconds2 = String(seconds % 60).padStart(2, '0');
      return projectDropdownText('elapsedMinutesSeconds', { minutes: minutes, seconds: seconds2 });
    }
    function run13(error5 = {}) {
      const value25 = String(error5?.message || projectDropdownText('packageProcessing')).trim(),
        count3 = Number(error5?.progress);
      if (!Number.isFinite(count3) || count3 < 0) return value25;
      return (
        value25 + ' · ' + Math.round(Math.max(0, Math.min(1, count3)) * 100) + '%'
      );
    }
    function run14(options3 = {}) {
      if (!enabled5) return;
      const {
          root: root,
          titleEl: titleEl,
          messageEl: messageEl,
          elapsedEl: elapsedEl,
          progressEl: progressEl,
          startedAt: startedAt,
        } = enabled5,
        value26 = String(options3?.title || projectDropdownText('collectingCurrentProject')).trim(),
        value27 = run13(options3),
        value28 = run12(startedAt),
        count4 = Number(options3?.progress),
        enabled6 = Number.isFinite(count4) && count4 >= 0;
      (setText(titleEl, value26),
        setText(messageEl, value27),
        setText(elapsedEl, value28),
        root.setAttribute('aria-label', value26 + '，' + value27 + '，' + value28));
      enabled6
        ? root.classList.add('has-progress')
        : root.classList.remove('has-progress');
      progressEl.hidden = !enabled6;
      if (enabled6) progressEl.value = Math.max(0, Math.min(1, count4));
      enabled5.lastPayload = options3;
    }
    function run15(lastPayload = {}) {
      if (typeof document === 'undefined' || !document.body) return;
      if (enabled5?.root) {
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
      ((el11.className = 'project-package-loading-spinner'),
        el11.setAttribute('aria-hidden', 'true'));
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
      ((enabled5 = {
        root: root2,
        titleEl: titleEl2,
        messageEl: messageEl2,
        elapsedEl: elapsedEl2,
        progressEl: progressEl2,
        startedAt: Date.now(),
        lastPayload: lastPayload,
        timerId: timerId(() => {
          run14(enabled5?.lastPayload || {});
        }, 1000),
      }),
        run14(lastPayload));
    }
    function run16(options4 = {}) {
      if (!enabled5) run15(options4);
      run14(options4);
    }
    async function run17() {
      if (typeof window.requestAnimationFrame === 'function') {
        await new Promise((value29) => {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(value29);
          });
        });
        return;
      }
      const run18 =
        typeof window.setTimeout === 'function' ? window.setTimeout.bind(window) : setTimeout;
      await new Promise((value30) => run18(value30, 0));
    }
    async function run19(message = projectDropdownText('loadingProjectDefault')) {
      (run15({ title: projectDropdownText('loadingProjectTitle'), message: message }),
        await run17());
    }
    function run20() {
      if (!enabled5) return;
      const value31 = enabled5;
      enabled5 = null;
      const run21 =
          typeof window.clearInterval === 'function'
            ? window.clearInterval.bind(window)
            : clearInterval,
        handler3 =
          typeof window.setTimeout === 'function' ? window.setTimeout.bind(window) : setTimeout;
      (run21(value31.timerId),
        value31.root.classList.remove('is-visible'),
        value31.root.classList.add('is-hiding'),
        handler3(() => value31.root.remove?.(), 180));
    }
    function run22(value32, { title: title = projectDropdownText('collectingCurrentProject') } = {}) {
      if (!desktopBridge.project.isAvailable()) return () => {};
      const value33 = desktopBridge.project.onPackageProgress((args2 = {}) => {
        if (String(args2?.operationId || '') !== value32) return;
        run16({ title: title, ...args2 });
      });
      return typeof value33 === 'function' ? value33 : () => {};
    }
    function run23(el14) {
      if (!el14) return;
      (el14.classList.remove('is-shaking'),
        void el14.offsetWidth,
        el14.classList.add('is-shaking'),
        window.setTimeout(() => {
          el14.classList.remove('is-shaking');
        }, 240));
    }
    function run24(value34, el15, el16) {
      (run23(value34),
        window.setTimeout(() => {
          ((el15.hidden = true), (el16.hidden = false));
        }, 180));
    }
    function run25() {
      (showContextMenu2?.close?.(), (showContextMenu2 = null));
    }
    function run26(el17) {
      return !!el17?.closest?.('[data-sidebar-submenu-owner="canvas-project"]');
    }
    async function run27(error6, value35, value36 = {}) {
      const filename2 = await options.renameProject(error6, value35),
        name2 = filename2.name;
      error6.name = name2;
      if (filename2.filename) error6.filename = filename2.filename;
      value36.showSuccessToast !== false && showToast(projectDropdownText('renamed', { name: name2 }));
      if (value36.refreshList !== false) await fetchProjects();
      return { ...filename2, name: name2, filename: filename2.filename || error6.filename };
    }
    function run28(error7, el18) {
      run25();
      if (!el18 || el18.parentElement?.querySelector?.('.cpd-item-rename-input')) return;
      const name3 = String(
          error7?.name || stripProjectFileExtensionFromName(error7?.filename) || '',
        ).trim(),
        el19 = document.createElement('input');
      ((el19.type = 'text'),
        (el19.className = 'cpd-item-rename-input'),
        (el19.value = name3),
        el19.setAttribute('aria-label', projectDropdownText('renameAria', { name: name3 })));
      let enabled7 = false,
        value37 = false;
      const run29 = () => {
          (el19.remove?.(), (el18.hidden = false));
        },
        handler4 = () => {
          if (value37) return;
          ((value37 = true), run29());
        },
        handler5 = async () => {
          if (value37 || enabled7) return;
          const enabled8 = String(el19.value || '')
            .replace(/\s+/g, ' ')
            .trim();
          if (!enabled8 || enabled8 === name3) {
            handler4();
            return;
          }
          ((enabled7 = true), (el19.disabled = true));
          try {
            (await run27(error7, enabled8, { refreshList: false }),
              setText(el18, enabled8),
              (value37 = true),
              run29(),
              await fetchProjects());
          } catch (error8) {
            ((enabled7 = false),
              (el19.disabled = false),
              showToast(error8?.message || projectDropdownText('renameFailed'), 'error'),
              el19.focus?.(),
              el19.select?.());
          }
        };
      (el19.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          (event.preventDefault(), void handler5());
          return;
        }
        event.key === 'Escape' && (event.preventDefault(), handler4());
      }),
        el19.addEventListener('blur', () => {
          void handler5();
        }),
        (el18.hidden = true),
        el18.parentElement?.appendChild(el19),
        el19.focus?.(),
        el19.select?.());
    }
    function run30() {
      return el2?.querySelector?.('.cpd-item-rename-input') || null;
    }
    function run31(enabled9, value38) {
      return !!enabled9 && (value38 === enabled9 || enabled9.contains?.(value38));
    }
    function run32(event2) {
      (event2.preventDefault?.(),
        event2.stopPropagation?.(),
        event2.stopImmediatePropagation?.());
    }
    (el2?.addEventListener(
      'pointerdown',
      (event3) => {
        const enabled10 = run30();
        if (!enabled10 || run31(enabled10, event3.target)) return;
        ((enabled = true),
          setTimeout(() => {
            enabled = false;
          }, 0),
          run32(event3),
          enabled10.blur?.());
      },
      true,
    ),
      el2?.addEventListener(
        'click',
        (event4) => {
          const enabled11 = run30();
          if (enabled11 && run31(enabled11, event4.target)) return;
          if (!enabled11 && !enabled) return;
          ((enabled = false), run32(event4), enabled11?.blur?.());
        },
        true,
      ));
    function run33(event5, value39, ownerElement) {
      (event5.preventDefault(),
        event5.stopPropagation(),
        run25(),
        (showContextMenu2 = showContextMenu(
          Number(event5.clientX || event5.pageX || 0),
          Number(event5.clientY || event5.pageY || 0),
          [
            {
              label: projectDropdownText('contextMenu.rename'),
              icon: 'edit',
              shortcutActionId: 'context-project-rename',
              action: () => run28(value39, ownerElement.nameEl),
            },
            {
              label: projectDropdownText('contextMenu.delete'),
              icon: 'delete',
              danger: true,
              shortcutActionId: 'context-project-delete',
              action: () =>
                run24(ownerElement.item, ownerElement.deleteButton, ownerElement.confirmPanel),
            },
          ],
          {
            ensureItemIcons: true,
            ownerElement: ownerElement.item,
            ownerRoot: ownerElement.item?.parentElement || ownerElement.item,
            sidebarSubmenuOwner: 'canvas-project',
          },
        )));
    }
    function run34(el20) {
      const box2 = el20?.getBoundingClientRect?.();
      if (!box2) return null;
      const left = Number(box2.left ?? 0),
        top = Number(box2.top ?? 0),
        count5 = Number(box2.width),
        count6 = Number(box2.height),
        value40 = Number(box2.right),
        value41 = Number(box2.bottom),
        width =
          Number.isFinite(count5) && count5 > 0
            ? count5
            : Number.isFinite(value40)
              ? value40 - left
              : 0,
        height =
          Number.isFinite(count6) && count6 > 0
            ? count6
            : Number.isFinite(value41)
              ? value41 - top
              : 0;
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
    function run35(box3) {
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
    function playProjectSaveAbsorb() {
      const value42 = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      if (value42) return;
      const value43 =
          run34(document.getElementById('v2-canvas')) ||
          run34(document.getElementById('v2-wrap')),
        box4 = run35(value43),
        box5 = run34(button || document.getElementById('btnCanvasLogo'));
      if (!box4 || !box5) return;
      const value44 = box4.width / box4.height || 4 / 3;
      let value45 = Math.min(
          box4.width,
          Math.max(140, Math.min(360, box4.width * 0.42)),
        ),
        value46 = value45 / value44;
      const value47 = Math.min(
        box4.height,
        Math.max(96, Math.min(240, box4.height * 0.42)),
      );
      value46 > value47 && ((value46 = value47), (value45 = value46 * value44));
      ((value45 = Math.max(1, Math.round(value45))),
        (value46 = Math.max(1, Math.round(value46))));
      const value48 = box4.left + box4.width / 2,
        value49 = box4.top + box4.height / 2,
        value50 = box5.left + box5.width / 2,
        value51 = box5.top + box5.height / 2,
        value52 = Math.round(value48 - value45 / 2),
        value53 = Math.round(value49 - value46 / 2),
        value54 = value50 - value48,
        value55 = value51 - value49,
        el21 = document.createElement('div');
      ((el21.className = 'v2-project-save-fly'),
        (el21.style.left = value52 + 'px'),
        (el21.style.top = value53 + 'px'),
        (el21.style.width = value45 + 'px'),
        (el21.style.height = value46 + 'px'),
        document.body.appendChild(el21));
      const value56 = (() => {
        let value57 = false;
        return () => {
          if (value57) return;
          ((value57 = true),
            el21.remove?.(),
            button?.animate &&
              button.animate(
                [
                  { transform: 'scale(1)', filter: 'brightness(1)' },
                  { transform: 'scale(1.08)', filter: 'brightness(1.2)' },
                  { transform: 'scale(1)', filter: 'brightness(1)' },
                ],
                { duration: 260, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
              ));
        };
      })();
      if (typeof el21.animate === 'function') {
        const value58 = el21.animate(
          [
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: 'translate(' + value54 + 'px,' + value55 + 'px) scale(0.12)', opacity: 0.18 },
          ],
          { duration: 560, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
        );
        ((value58.onfinish = value56), (value58.oncancel = value56));
        return;
      }
      window.setTimeout(value56, 560);
    }
    async function run36(value59) {
      return !!(await options.appendProject(value59, { applySourceNames: true }));
    }
    async function run37(value60) {
      return !!(await options.appendProject(value60));
    }
    async function run38(recentId2 = '') {
      let enabled12 = false;
      try {
        recentId2 && (await run19(projectDropdownText('readingLocalProject')), (enabled12 = true));
        const name4 = await openDesktopProject({ recentId: recentId2 });
        if (!name4 || name4.canceled) return;
        (!enabled12
          ? (await run19(projectDropdownText('renderingCanvas')), (enabled12 = true))
          : (run16({
              title: projectDropdownText('loadingProjectTitle'),
              message: projectDropdownText('renderingCanvas'),
            }),
            await run17()),
          (await run36(name4)) &&
            (closeSidebarSubmenu('canvas-project'),
            showToast(
              projectDropdownText('opened', { name: name4.projectName || name4.filename }),
            )));
      } catch (error9) {
        (console.error('[desktopProject] open failed:', error9),
          showToast(error9?.message || projectDropdownText('openLocalFailed'), 'error'));
      } finally {
        run20();
      }
    }
    const {
      saveProject: saveProject,
      saveProjectAsLocal: saveProjectAsLocal,
      saveCurrentProjectFromShortcut: saveCurrentProjectFromShortcut,
    } = createCanvasProjectSaveController({
      windowObject: window,
      getRoot: () => document.getElementById('v2-wrap'),
      getProjectPackageExportSource: getProjectPackageExportSource,
      getActiveCanvasProjectContext: getActiveProjectContext,
      getCurrentProjectName: projectName2,
      buildProjectContextFromLoadResult: buildCanvasProjectContext,
      reconcileProjectSessionAfterSave: reconcileProjectSessionAfterSave,
      playProjectSaveAbsorb: playProjectSaveAbsorb,
      fetchProjects: fetchProjects,
      openSaveDialog: openSaveDialog,
      getShortcutSaveProjectName: getShortcutSaveProjectName,
      isAutoGeneratedProjectName: isAutoGeneratedProjectName,
      projectNameExistsInProjectList: projectNameExistsInProjectList,
      showToast: showToast,
    });
    async function run39(options5 = {}) {
      const operationId = run11('export-package'),
        handler6 = run22(operationId, { title: projectDropdownText('collectingCurrentProject') });
      try {
        const value61 = getProjectPackageExportSource(options5),
          projectId3 = getActiveProjectContext(),
          filename3 = await exportDesktopProjectPackage(
            value61.projectName || projectName2(),
            value61.multiData,
            {
              projectId: projectId3.projectId,
              recentId: projectId3.recentId,
              displayPath: projectId3.displayPath,
              operationId: operationId,
            },
          );
        if (!filename3 || filename3.canceled) return;
        if (filename3.blocked) {
          (console.warn('[desktopProject] export package blocked:', filename3),
            showToast(run9(filename3), 'error'));
          return;
        }
        if (!filename3.success) {
          showToast(filename3.message || projectDropdownText('packageExport.failed'), 'error');
          return;
        }
        const warning = run10(filename3.warnings);
        if (warning) {
          (console.warn('[desktopProject] export package warnings:', filename3.warnings),
            showToast(
              projectDropdownText('packageExport.collectedWithWarning', {
                filename: filename3.filename || projectDropdownText('packageFallback'),
                warning: warning,
              }),
              'warn',
            ));
          return;
        }
        showToast(
          projectDropdownText('packageExport.collected', {
            filename: filename3.filename || projectDropdownText('packageFallback'),
          }),
        );
      } catch (error10) {
        (console.error('[desktopProject] export package failed:', error10),
          showToast(error10?.message || projectDropdownText('packageExport.failed'), 'error'));
      } finally {
        (handler6(), run20());
      }
    }
    async function run40({ path: path = '', file: file = null } = {}) {
      const operationId2 = run11('import-package'),
        handler7 = run22(operationId2, { title: projectDropdownText('loadingProjectTitle') });
      try {
        (path || file) && (await run19(projectDropdownText('readingProjectPackage')));
        const name5 = await importDesktopProjectPackage({
          path: path,
          file: file,
          operationId: operationId2,
        });
        if (!name5 || name5.canceled) return name5;
        if (name5.projectType && name5.projectType !== 'canvas') {
          if (!handler2) throw new Error('当前版本无法打开此类型的项目包。');
          return (
            await handler2(name5),
            closeSidebarSubmenu('canvas-project'),
            showToast('“' + (name5.projectName || '项目') + '”已导入。'),
            name5
          );
        }
        return (
          !enabled5
            ? await run19(projectDropdownText('renderingProjectPackage'))
            : (run16({
                title: projectDropdownText('loadingProjectTitle'),
                message: projectDropdownText('renderingProjectPackage'),
              }),
              await run17()),
          (await run37(name5)) &&
            (closeSidebarSubmenu('canvas-project'),
            showToast(
              projectDropdownText('packageImport.loaded', {
                name: name5.projectName || name5.filename,
              }),
            )),
          name5
        );
      } catch (error11) {
        return (
          console.error('[desktopProject] import package failed:', error11),
          showToast(error11?.message || projectDropdownText('packageImport.failed'), 'error'),
          null
        );
      } finally {
        (handler7(), run20());
      }
    }
    function run41(path2 = '') {
      return run40({ path: path2 });
    }
    function run42(file2) {
      return run40({ file: file2 });
    }
    async function run43(name6) {
      if (!name6 || typeof name6 !== 'object') return;
      if (name6.success === false) {
        showToast(name6.error || projectDropdownText('externalOpenFailed'), 'error');
        return;
      }
      if (name6.kind === 'projectPackage') {
        await run41(name6.path || name6.filePath || '');
        return;
      }
      try {
        (await run19(projectDropdownText('renderingCanvas')),
          (await run36(name6)) &&
            (closeSidebarSubmenu('canvas-project'),
            showToast(
              projectDropdownText('opened', { name: name6.projectName || name6.filename }),
            )));
      } catch (error12) {
        (console.error('[desktopProject] external open failed:', error12),
          showToast(error12?.message || projectDropdownText('externalOpenFailed'), 'error'));
      } finally {
        run20();
      }
    }
    async function run44(value62) {
      const value63 = Array.isArray(value62) ? value62 : [];
      for (const value64 of value63) {
        await run43(value64);
      }
    }
    async function run45() {
      if (!desktopBridge.project.isAvailable()) return;
      try {
        await run44(await desktopBridge.project.consumeExternalOpenRequests());
      } catch (error13) {
        (console.error('[desktopProject] consume external open failed:', error13),
          showToast(error13?.message || projectDropdownText('externalOpenFailed'), 'error'));
      }
    }
    function run46() {
      if (!desktopBridge.project.isAvailable()) return;
      if (window.__aiCanvasExternalProjectOpenInstalled) return;
      ((window.__aiCanvasExternalProjectOpenInstalled = true),
        desktopBridge.project.onExternalOpen((value65) => {
          void run44(value65);
        }),
        void run45());
    }
    function run47({ iconId: iconId, title: title2, onClick: onClick }) {
      const el22 = document.createElement('button');
      return (
        (el22.type = 'button'),
        (el22.className = 'cpd-local-action-btn'),
        (el22.dataset.tooltip = title2),
        el22.setAttribute('aria-label', title2),
        setStaticInnerHTML(el22, iconId),
        el22.addEventListener('click', (event6) => {
          (event6.preventDefault(), event6.stopPropagation(), onClick?.());
        }),
        el22
      );
    }
    function run48() {
      if (!canUseDesktopProjectApi() || !el) return;
      let el23 = el.querySelector('.cpd-local-actions');
      if (el23) return;
      ((el23 = document.createElement('div')),
        (el23.className = 'cpd-local-actions'),
        el23.appendChild(
          run47({
            iconId: 'iconFolderOpen18',
            title: projectDropdownText('actions.openLocal'),
            onClick: () => run38(),
          }),
        ),
        el23.appendChild(
          run47({
            iconId: 'iconSaveAs18',
            title: projectDropdownText('actions.saveAsLocal'),
            onClick: () => saveProjectAsLocal(),
          }),
        ),
        el23.appendChild(
          run47({
            iconId: 'iconPackageExport18',
            title: projectDropdownText('actions.collectCurrent'),
            onClick: () => run39(),
          }),
        ),
        el23.appendChild(
          run47({
            iconId: 'iconPackageImport18',
            title: projectDropdownText('actions.loadPackage'),
            onClick: () => run41(),
          }),
        ));
      const value66 = el.querySelector('.cpd-close');
      el.insertBefore(el23, value66 || null);
    }
    async function fetchProjects() {
      const value67 = ++data;
      (run48(), clearElement(el2));
      const el24 = document.createElement('div');
      ((el24.className = 'cpd-loading'),
        el24.setAttribute('role', 'status'),
        el24.setAttribute('aria-live', 'polite'),
        el24.setAttribute('aria-busy', 'true'));
      const el25 = document.createElement('span');
      ((el25.className = 'project-package-loading-spinner'),
        el25.setAttribute('aria-hidden', 'true'));
      const value68 = document.createElement('span');
      (setText(value68, projectDropdownText('loading')),
        el24.appendChild(el25),
        el24.appendChild(value68),
        el2.appendChild(el24),
        requestAnimationFrame(run));
      try {
        const list8 = await fetchV2ProjectsFromServer();
        if (value67 !== data) return;
        if (!list8.length) {
          clearElement(el2);
          const value69 = document.createElement('div');
          ((value69.className = 'cpd-empty'),
            setText(value69, projectDropdownText('emptyProjects')),
            el2.appendChild(value69),
            requestAnimationFrame(run));
          return;
        }
        (clearElement(el2),
          list8.forEach((filename4) => {
            const item2 = document.createElement('div');
            ((item2.className = 'cpd-item'),
              (item2.dataset.filename = filename4.filename),
              (item2.dataset.name = filename4.name));
            const el26 = document.createElement('div');
            el26.className = 'cpd-item-left';
            const value70 = document.createElement('div');
            ((value70.className = 'cpd-item-icon'),
              setStaticInnerHTML(value70, 'cpdProjectItemIcon16'));
            const value71 = window.CanvasTabManager?.findCanvasIdByProjectIdentity?.({
                filename: filename4.filename,
                projectName: filename4.name,
              }),
              value72 =
                value71 &&
                createCanvasProjectBadge(window.CanvasTabManager?.getCanvasProjectAccess?.(value71));
            if (value72) value70.replaceChildren(value72);
            const el27 = document.createElement('div');
            el27.className = 'cpd-item-info';
            const nameEl = document.createElement('div');
            ((nameEl.className = 'cpd-item-name'),
              setText(nameEl, filename4.name),
              el27.appendChild(nameEl),
              el26.appendChild(value70),
              el26.appendChild(el27));
            const el28 = document.createElement('div');
            ((el28.className = 'cpd-item-actions'),
              item2.appendChild(el26),
              item2.appendChild(el28));
            const deleteButton = document.createElement('div');
            ((deleteButton.className = 'cpd-item-delete'), setStaticInnerHTML(deleteButton, 'iconTrash18'));
            const confirmPanel = document.createElement('div');
            ((confirmPanel.className = 'cpd-confirm-panel'), (confirmPanel.hidden = true));
            const el29 = document.createElement('button');
            ((el29.type = 'button'),
              (el29.className = 'cpd-confirm-btn cpd-confirm-btn--danger'),
              (el29.textContent = '✔'),
              el29.setAttribute('aria-label', projectDropdownText('confirm')));
            const el30 = document.createElement('button');
            ((el30.type = 'button'),
              (el30.className = 'cpd-confirm-btn cpd-confirm-btn--neutral'),
              (el30.textContent = '×'),
              el30.setAttribute('aria-label', projectDropdownText('cancel')),
              confirmPanel.appendChild(el29),
              confirmPanel.appendChild(el30),
              el28.appendChild(deleteButton),
              el28.appendChild(confirmPanel),
              el26.addEventListener('click', (event7) => {
                event7.stopPropagation();
                const value73 = run30();
                if (value73) {
                  !run31(value73, event7.target) && value73.blur?.();
                  return;
                }
                if (enabled) {
                  enabled = false;
                  return;
                }
                run49(filename4.filename, filename4.name);
              }),
              deleteButton.addEventListener('click', (event8) => {
                (event8.stopPropagation(), run24(item2, deleteButton, confirmPanel));
              }),
              el30.addEventListener('click', (event9) => {
                (event9.stopPropagation(), (confirmPanel.hidden = true), (deleteButton.hidden = false));
              }),
              el29.addEventListener('click', async (event10) => {
                (event10.stopPropagation(), (el29.textContent = '...'));
                const deleteV2ProjectFromServer2 = await deleteV2ProjectFromServer(filename4.filename);
                deleteV2ProjectFromServer2
                  ? (await projectWorkspaceSessions.clear(filename4.filename),
                    showToast(projectDropdownText('deleted')),
                    fetchProjects())
                  : (showToast(projectDropdownText('deleteFailed')), (el29.textContent = '✔'));
              }),
              item2.addEventListener('contextmenu', (value74) => {
                run33(value74, filename4, {
                  item: item2,
                  nameEl: nameEl,
                  deleteButton: deleteButton,
                  confirmPanel: confirmPanel,
                });
              }),
              el2.appendChild(item2));
          }),
          requestAnimationFrame(run));
      } catch (value75) {
        if (value67 !== data) return;
        clearElement(el2);
        const value76 = document.createElement('div');
        ((value76.className = 'cpd-empty'),
          setText(value76, projectDropdownText('listLoadFailed')),
          el2.appendChild(value76),
          requestAnimationFrame(run));
      }
    }
    async function run49(value77, value78) {
      try {
        const name7 = await options.openProject(value77, value78, {
          onProgress: async (value79) => {
            value79 === 'reading'
              ? await run19(projectDropdownText('readingProjectData'))
              : (run16({
                  title: projectDropdownText('loadingProjectTitle'),
                  message: projectDropdownText('renderingCanvas'),
                }),
                await run17());
          },
        });
        if (!name7) return false;
        return (
          closeSidebarSubmenu('canvas-project'),
          showToast(projectDropdownText('loaded', { name: name7.canvasName })),
          name7
        );
      } catch (error14) {
        (console.error('load project error:', error14),
          showToast(error14?.message || projectDropdownText('loadFailed'), 'error'));
      } finally {
        run20();
      }
    }
    ((window._v2SaveProject = saveProject),
      (window._v2OpenProjectInCanvasTab = run49),
      (window._v2SaveProjectAsLocal = saveProjectAsLocal),
      (window._v2ExportCurrentProjectPackage = run39),
      (window._v2ImportProjectPackageByPath = run41),
      (window._v2ImportProjectPackageFile = run42),
      (window._v2LoadImportedCanvasProjectPackage = run37));
    function showToast(value80, value81 = 'ok') {
      window.showToast(value80, value81);
    }
    function open() {
      if (!button || !panel) return;
      (run(), panel.classList.add('open'), requestAnimationFrame(run), fetchProjects());
    }
    function close() {
      ((data += 1), run25(), panel.classList.remove('open'));
    }
    (registerSidebarSubmenu({
      key: 'canvas-project',
      button: button,
      panel: panel,
      open: open,
      close: close,
      isOpen: () => panel.classList.contains('open'),
      ignorePointerDown: (event11) => run26(event11?.target),
      openClass: 'open',
    }),
      el3?.addEventListener('click', (event12) => {
        (event12.preventDefault(),
          event12.stopPropagation(),
          closeSidebarSubmenu('canvas-project'));
      }),
      el4?.addEventListener('click', () => {
        (closeSidebarSubmenu('canvas-project'),
          window.CanvasTabManager?.addCanvas?.(),
          showToast(projectDropdownText('newCanvasCreated')));
      }));
    let value82 = null,
      value83 = '';
    function openSaveDialog(options6 = {}) {
      (value82?.(false), (value82 = null));
      try {
        assertCanvasProjectSaveAllowed(getProjectPackageExportSource(options6).multiData, window.CanvasTabManager);
      } catch (error15) {
        showToast(error15.message, 'warn');
        return;
      }
      const error16 = window.CanvasTabManager._canvases.find(
        (value84) => value84.id === window.CanvasTabManager._activeId,
      );
      return (
        (value83 = window.CanvasTabManager.getActiveCanvasId()),
        (el6.value = String(
          options6.defaultName || error16?.name || projectDropdownText('unnamedCanvas'),
        ).trim()),
        el5.classList.add('open'),
        setTimeout(() => {
          (el6.focus(), el6.select());
        }, 80),
        new Promise((value85) => {
          value82 = value85;
        })
      );
    }
    ((window._openSaveDialog = openSaveDialog),
      (window._v2SaveProjectFromShortcut = saveCurrentProjectFromShortcut),
      (CanvasProjectDropdownManager.renameCurrentProject = async (value86) => {
        const value87 = getActiveProjectContext(),
          value88 =
            value87?.isTemporary !== true && !!(value87?.filename || value87?.projectId),
          name8 = await options.renameCurrentProject(value86);
        return (
          name8 &&
            value88 &&
            (showToast(projectDropdownText('renamed', { name: name8 })), await fetchProjects()),
          name8
        );
      }));
    function run50() {
      (el5.classList.remove('open'), value82?.(false), (value82 = null));
    }
    (el7?.addEventListener('click', run50),
      el8?.addEventListener('click', () => {
        if (window.CanvasTabManager.getActiveCanvasId() !== value83) {
          run50();
          return;
        }
        const value89 = el6.value.trim() || projectDropdownText('unnamedCanvas'),
          value90 = value82;
        ((value82 = null),
          run50(),
          void saveProject(value89, { renameActiveCanvas: true, saveAs: true }).then(
            (value91) => value90?.(value91 === true),
            () => value90?.(false),
          ));
      }),
      el6?.addEventListener('keydown', (event13) => {
        (event13.key === 'Enter' && (event13.preventDefault(), el8.click()),
          event13.key === 'Escape' && (event13.preventDefault(), run50()));
      }),
      run46(),
      window.addEventListener('resize', () => {
        panel.classList.contains('open') && run();
      }),
      window.addEventListener(CANVAS_TOOLBAR_PLACEMENT_EVENT, () => {
        panel.classList.contains('open') && run();
      }));
  },
};
export default CanvasProjectDropdownManager;
export { CanvasProjectDropdownManager };
