import { generateId } from '../core/math.js';
import * as project from './project.js';
import { getProjects, createProject, deleteProject } from '../../api/legacyProjectsApi.js';
import { clearRendererCache } from '../core/renderer.js';
import { commit } from './history.js';
import { getLocale, t } from '../i18n/index.js';
function projectManagerText(value, item = {}) {
  return t('projectManager.' + value, item);
}
const projectGallery = document.getElementById('projectGallery'),
  projectGrid = document.getElementById('projectGrid'),
  ProjectManager = {
    async getProjects() {
      return await getProjects();
    },
    async createProject(projectManagerText2) {
      if (!projectManagerText2) {
        const date = new Date();
        projectManagerText2 = projectManagerText('defaultProjectName', {
          date: date.toLocaleString(getLocale()),
        });
      }
      const generateId2 = generateId('proj');
      return await createProject(generateId2, projectManagerText2);
    },
    async loadProject(key, { allowMissing: allowMissing = false } = {}) {
      try {
        const index = await project.loadProject(key, { allowMissing });
        clearRendererCache();
        ((window.currentProjectId = key),
          (window._v2CurrentRecentProjectId = ''),
          (window._v2CurrentProjectDisplayPath = ''),
          (window._v2CurrentProjectLastModified = 0));
        if (projectGallery) projectGallery.classList.add('hidden');
        (document.body.classList.remove('in-gallery'), localStorage.setItem('tapnow_last_project_v2', key));
        window.CanvasTabManager && window.CanvasTabManager.init(index);
        const el = document.getElementById('projectNameText');
        if (el) {
          let projectManagerText3 = projectManagerText('newProjectFallback');
          const list = await this.getProjects(),
            error = list.find((item2) => item2.id === key);
          if (error) projectManagerText3 = error.name;
          el.textContent = projectManagerText3;
        }
        return true;
      } catch (result) {
        (console.error('Failed to load project:', result), alert(projectManagerText('loadFailed')));
        return false;
      }
    },
    async saveCurrentProject() {
      if (!window.currentProjectId) return;
      if (window.CanvasTabManager) {
        const data = window.CanvasTabManager.getMultiDataSnapshot({ sanitizeForPersistence: true }),
          response = await project.saveProject(window.currentProjectId, data);
        response?.success && window.CanvasTabManager.markAllCanvasesClean?.();
      }
    },
    showConfirm(options, target, handler) {
      const el2 = document.createElement('div');
      el2.className = 'custom-confirm-overlay';
      const el3 = document.createElement('div');
      el3.className = 'custom-confirm-box';
      const el4 = document.createElement('div');
      ((el4.className = 'confirm-title'), (el4.textContent = options));
      const el5 = document.createElement('div');
      ((el5.className = 'confirm-msg'), (el5.textContent = target));
      const el6 = document.createElement('div');
      el6.className = 'confirm-btns';
      const el7 = document.createElement('button');
      ((el7.type = 'button'),
        (el7.className = 'confirm-btn confirm-cancel'),
        (el7.textContent = projectManagerText('confirm.cancel')));
      const el8 = document.createElement('button');
      ((el8.type = 'button'),
        (el8.className = 'confirm-btn confirm-ok'),
        (el8.textContent = projectManagerText('confirm.deleteConfirm')),
        el6.appendChild(el7),
        el6.appendChild(el8),
        el3.appendChild(el4),
        el3.appendChild(el5),
        el3.appendChild(el6),
        el2.appendChild(el3),
        document.body.appendChild(el2));
      const run = () => el2.remove();
      ((el7.onclick = run),
        (el8.onclick = () => {
          (handler(), run());
        }),
        (el2.onclick = (event) => {
          if (event.target === el2) run();
        }));
    },
    async deleteProject(source) {
      this.showConfirm(
        projectManagerText('deleteConfirm.title'),
        projectManagerText('deleteConfirm.message'),
        async () => {
          try {
            (await deleteProject(source),
              window.currentProjectId === source ? this.showGallery() : this.renderGallery());
          } catch (next) {
            console.error('Failed to delete project:', next);
          }
        },
      );
    },
    showGallery() {
      window.currentProjectId = null;
      if (projectGallery) projectGallery.classList.remove('hidden');
      (document.body.classList.add('in-gallery'), this.renderGallery());
    },
    async renderGallery() {
      if (!projectGrid) return;
      const list2 = await this.getProjects();
      projectGrid.replaceChildren();
      const el9 = document.createElement('div');
      el9.className = 'project-card new-project-card';
      const current = 'http://www.w3.org/2000/svg',
        el10 = document.createElement('div');
      ((el10.className = 'pc-preview new-project-preview'),
        Object.assign(el10.style, {
          background: 'var(--white-02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }));
      const el11 = document.createElementNS(current, 'svg');
      (el11.setAttribute('width', '32'),
        el11.setAttribute('height', '32'),
        el11.setAttribute('viewBox', '0 0 24 24'),
        el11.setAttribute('fill', 'none'),
        el11.setAttribute('stroke', 'currentColor'),
        el11.setAttribute('stroke-width', '1.5'),
        (el11.style.opacity = '0.4'));
      const el12 = document.createElementNS(current, 'line');
      (el12.setAttribute('x1', '12'),
        el12.setAttribute('y1', '5'),
        el12.setAttribute('x2', '12'),
        el12.setAttribute('y2', '19'));
      const el13 = document.createElementNS(current, 'line');
      (el13.setAttribute('x1', '5'),
        el13.setAttribute('y1', '12'),
        el13.setAttribute('x2', '19'),
        el13.setAttribute('y2', '12'),
        el11.appendChild(el12),
        el11.appendChild(el13),
        el10.appendChild(el11));
      const el14 = document.createElement('div');
      ((el14.className = 'pc-info'),
        Object.assign(el14.style, {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          padding: '16px 0',
        }));
      const el15 = document.createElement('div');
      ((el15.className = 'pc-title'),
        Object.assign(el15.style, {
          color: 'var(--text-primary)',
          fontSize: '16px',
          fontWeight: '600',
          textAlign: 'center',
          margin: '0',
        }),
        (el15.textContent = projectManagerText('newProject')),
        el14.appendChild(el15),
        el9.appendChild(el10),
        el9.appendChild(el14));
      const el16 = document.createElement('style');
      ((el16.textContent =
        '@keyframes spin { 100% { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }'),
        document.head.appendChild(el16),
        (window.showGlobalLoading = function (
          projectManagerText4 = projectManagerText('loading'),
          entry = {},
        ) {
          let el17 = document.getElementById('v2-global-loading');
          if (!el17) {
            ((el17 = document.createElement('div')),
              (el17.id = 'v2-global-loading'),
              Object.assign(el17.style, {
                position: 'fixed',
                bottom: '80px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--surface-quote)',
                color: 'var(--white)',
                padding: '10px 24px',
                borderRadius: '30px',
                fontSize: '14px',
                zIndex: '99999',
                border: '1px solid var(--white-10)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 8px 32px var(--black-50)',
                opacity: '0',
                transition: 'opacity 0.2s',
                pointerEvents: 'none',
              }));
            const el18 = document.createElementNS(current, 'svg');
            (el18.setAttribute('width', '18'),
              el18.setAttribute('height', '18'),
              el18.setAttribute('viewBox', '0 0 24 24'),
              el18.setAttribute('fill', 'none'),
              el18.setAttribute('stroke', 'currentColor'),
              el18.setAttribute('stroke-width', '2'),
              el18.classList.add('spin'));
            const el19 = document.createElementNS(current, 'path');
            (el19.setAttribute('d', 'M21 12a9 9 0 1 1-6.219-8.56'), el18.appendChild(el19));
            const el20 = document.createElement('div');
            el20.className = 'v2-global-loading-body';
            const record = document.createElement('span');
            record.className = 'v2-global-loading-label';
            const el21 = document.createElement('progress');
            ((el21.className = 'v2-global-loading-progress'),
              (el21.max = 1),
              (el21.value = 0),
              (el21.hidden = true),
              el17.appendChild(el18),
              el20.appendChild(record),
              el20.appendChild(el21),
              el17.appendChild(el20),
              document.body.appendChild(el17));
          }
          const el22 = el17.querySelector('.v2-global-loading-label'),
            el23 = el17.querySelector('.v2-global-loading-progress');
          if (el22) el22.textContent = projectManagerText4;
          const count = Number(entry?.progress),
            enabled = Number.isFinite(count) && count >= 0;
          if (el23) {
            el23.hidden = !enabled;
            if (enabled) el23.value = Math.max(0, Math.min(1, count));
          }
          (void el17.offsetWidth, (el17.style.opacity = '1'));
        }),
        (window.updateGlobalLoading = function (text = {}) {
          const el24 = document.getElementById('v2-global-loading');
          if (!el24) return;
          const error2 = typeof text === 'string' ? { text: text } : text || {},
            el25 = el24.querySelector('.v2-global-loading-label'),
            el26 = el24.querySelector('.v2-global-loading-progress'),
            payload = String(error2.text || error2.message || '').trim();
          if (payload && el25) el25.textContent = payload;
          const count2 = Number(error2.progress),
            enabled2 = Number.isFinite(count2) && count2 >= 0;
          if (el26) {
            el26.hidden = !enabled2;
            if (enabled2) el26.value = Math.max(0, Math.min(1, count2));
          }
        }),
        (window.hideGlobalLoading = function () {
          const el27 = document.getElementById('v2-global-loading');
          el27 && ((el27.style.opacity = '0'), setTimeout(() => el27.remove(), 250));
        }),
        (el9.onclick = async () => {
          const handle = await this.createProject();
          // init() hydrates on success; never clear the current canvas before the read.
          if (handle && (await this.loadProject(handle, { allowMissing: true }))) commit();
        }),
        projectGrid.appendChild(el9),
        list2
          .sort((item3, state) => state.lastModified - item3.lastModified)
          .forEach((error3) => {
            const el28 = document.createElement('div');
            el28.className = 'project-card';
            const config = new Date(error3.lastModified).toLocaleString(getLocale(), {
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              el29 = document.createElement('div');
            el29.className = 'pc-preview';
            if (error3.thumbnail && error3.thumbnail.type === 'image' && error3.thumbnail.data) {
              const scope = document.createElement('img');
              ((scope.src = error3.thumbnail.data), el29.appendChild(scope));
            } else {
              if (error3.thumbnail && error3.thumbnail.type === 'text' && error3.thumbnail.data) {
                const el30 = document.createElement('div');
                ((el30.className = 'pc-text-snippet'),
                  (el30.textContent = error3.thumbnail.data),
                  el29.appendChild(el30));
              } else {
                const el31 = document.createElement('div');
                ((el31.className = 'pc-logo'),
                  Object.assign(el31.style, {
                    fontWeight: 'bold',
                    color: 'var(--white-10)',
                    fontSize: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                  }),
                  (el31.textContent = 'AICanvas'),
                  el29.appendChild(el31));
              }
            }
            const el32 = document.createElement('div');
            el32.className = 'pc-info';
            const el33 = document.createElement('div');
            ((el33.className = 'pc-title'), (el33.textContent = error3.name));
            const el34 = document.createElement('div');
            el34.className = 'pc-meta';
            const el35 = document.createElement('span');
            ((el35.className = 'pc-time'), (el35.textContent = config));
            const el36 = document.createElement('span');
            ((el36.className = 'pc-delete'),
              (el36.dataset.id = error3.id),
              Object.assign(el36.style, {
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }),
              (el36.textContent = projectManagerText('delete')),
              el36.addEventListener('mouseenter', () => (el36.style.color = 'var(--red)')),
              el36.addEventListener('mouseleave', () => (el36.style.color = 'var(--text-muted)')),
              el34.appendChild(el35),
              el34.appendChild(el36),
              el32.appendChild(el33),
              el32.appendChild(el34),
              el28.appendChild(el29),
              el28.appendChild(el32),
              (el28.onclick = async (event2) => {
                const input = event2.target.closest('.pc-delete');
                if (input) {
                  (event2.stopPropagation(), await this.deleteProject(error3.id));
                  return;
                }
                await this.loadProject(error3.id);
              }),
              projectGrid.appendChild(el28));
          }));
    },
  };
export default ProjectManager;
export { ProjectManager };
