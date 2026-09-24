import { generateId } from '../core/math.js';
import * as project from './project.js';
import { getProjects, createProject, deleteProject } from '../../api/legacyProjectsApi.js';
import { clearRendererCache } from '../core/renderer.js';
import { commit } from './history.js';
import { getLocale, t } from '../i18n/index.js';
function projectManagerText(_0x965afc, _0x3dc3ce = {}) {
  return t('projectManager.' + _0x965afc, _0x3dc3ce);
}
const projectGallery = document.getElementById('projectGallery'),
  projectGrid = document.getElementById('projectGrid'),
  ProjectManager = {
    async getProjects() {
      return await getProjects();
    },
    async createProject(_0x393e15) {
      if (!_0x393e15) {
        const _0x58ec50 = new Date();
        _0x393e15 = projectManagerText('defaultProjectName', { date: _0x58ec50.toLocaleString(getLocale()) });
      }
      const _0x559689 = generateId('proj');
      return await createProject(_0x559689, _0x393e15);
    },
    async loadProject(_0x437d73, { allowMissing: allowMissing = false } = {}) {
      try {
        const _0x10491e = await project.loadProject(_0x437d73, { allowMissing });
        clearRendererCache();
        ((window.currentProjectId = _0x437d73),
          (window._v2CurrentRecentProjectId = ''),
          (window._v2CurrentProjectDisplayPath = ''),
          (window._v2CurrentProjectLastModified = 0));
        if (projectGallery) projectGallery.classList.add('hidden');
        (document.body.classList.remove('in-gallery'),
          localStorage.setItem('tapnow_last_project_v2', _0x437d73));
        window.CanvasTabManager && window.CanvasTabManager.init(_0x10491e);
        const _0xdcd9f6 = document.getElementById('projectNameText');
        if (_0xdcd9f6) {
          let _0x1f06d5 = projectManagerText('newProjectFallback');
          const _0x2f7dee = await this.getProjects(),
            _0x1b37a6 = _0x2f7dee.find((_0x293580) => _0x293580.id === _0x437d73);
          if (_0x1b37a6) _0x1f06d5 = _0x1b37a6.name;
          _0xdcd9f6.textContent = _0x1f06d5;
        }
        return true;
      } catch (_0x386ad2) {
        (console.error('Failed to load project:', _0x386ad2), alert(projectManagerText('loadFailed')));
        return false;
      }
    },
    async saveCurrentProject() {
      if (!window.currentProjectId) return;
      if (window.CanvasTabManager) {
        const _0x21be2f = window.CanvasTabManager.getMultiDataSnapshot({ sanitizeForPersistence: true }),
          _0x131d99 = await project.saveProject(window.currentProjectId, _0x21be2f);
        _0x131d99?.success && window.CanvasTabManager.markAllCanvasesClean?.();
      }
    },
    showConfirm(_0x4edca7, _0xe4fb9d, _0x6c2830) {
      const _0x48cf19 = document.createElement('div');
      _0x48cf19.className = 'custom-confirm-overlay';
      const _0x367964 = document.createElement('div');
      _0x367964.className = 'custom-confirm-box';
      const _0x5e715d = document.createElement('div');
      ((_0x5e715d.className = 'confirm-title'), (_0x5e715d.textContent = _0x4edca7));
      const _0x3ac50c = document.createElement('div');
      ((_0x3ac50c.className = 'confirm-msg'), (_0x3ac50c.textContent = _0xe4fb9d));
      const _0xa222ea = document.createElement('div');
      _0xa222ea.className = 'confirm-btns';
      const _0x208512 = document.createElement('button');
      ((_0x208512.type = 'button'),
        (_0x208512.className = 'confirm-btn confirm-cancel'),
        (_0x208512.textContent = projectManagerText('confirm.cancel')));
      const _0x22fad7 = document.createElement('button');
      ((_0x22fad7.type = 'button'),
        (_0x22fad7.className = 'confirm-btn confirm-ok'),
        (_0x22fad7.textContent = projectManagerText('confirm.deleteConfirm')),
        _0xa222ea.appendChild(_0x208512),
        _0xa222ea.appendChild(_0x22fad7),
        _0x367964.appendChild(_0x5e715d),
        _0x367964.appendChild(_0x3ac50c),
        _0x367964.appendChild(_0xa222ea),
        _0x48cf19.appendChild(_0x367964),
        document.body.appendChild(_0x48cf19));
      const _0x3af733 = () => _0x48cf19.remove();
      ((_0x208512.onclick = _0x3af733),
        (_0x22fad7.onclick = () => {
          (_0x6c2830(), _0x3af733());
        }),
        (_0x48cf19.onclick = (_0x487e62) => {
          if (_0x487e62.target === _0x48cf19) _0x3af733();
        }));
    },
    async deleteProject(_0x4dfa7e) {
      this.showConfirm(
        projectManagerText('deleteConfirm.title'),
        projectManagerText('deleteConfirm.message'),
        async () => {
          try {
            (await deleteProject(_0x4dfa7e),
              window.currentProjectId === _0x4dfa7e ? this.showGallery() : this.renderGallery());
          } catch (_0x5981ea) {
            console.error('Failed to delete project:', _0x5981ea);
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
      const _0x38d66e = await this.getProjects();
      projectGrid.replaceChildren();
      const _0x5f0d10 = document.createElement('div');
      _0x5f0d10.className = 'project-card new-project-card';
      const _0x27403a = 'http://www.w3.org/2000/svg',
        _0x3d83bd = document.createElement('div');
      ((_0x3d83bd.className = 'pc-preview new-project-preview'),
        Object.assign(_0x3d83bd.style, {
          background: 'var(--white-02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }));
      const _0x1365a5 = document.createElementNS(_0x27403a, 'svg');
      (_0x1365a5.setAttribute('width', '32'),
        _0x1365a5.setAttribute('height', '32'),
        _0x1365a5.setAttribute('viewBox', '0 0 24 24'),
        _0x1365a5.setAttribute('fill', 'none'),
        _0x1365a5.setAttribute('stroke', 'currentColor'),
        _0x1365a5.setAttribute('stroke-width', '1.5'),
        (_0x1365a5.style.opacity = '0.4'));
      const _0x24f4a2 = document.createElementNS(_0x27403a, 'line');
      (_0x24f4a2.setAttribute('x1', '12'),
        _0x24f4a2.setAttribute('y1', '5'),
        _0x24f4a2.setAttribute('x2', '12'),
        _0x24f4a2.setAttribute('y2', '19'));
      const _0x59135a = document.createElementNS(_0x27403a, 'line');
      (_0x59135a.setAttribute('x1', '5'),
        _0x59135a.setAttribute('y1', '12'),
        _0x59135a.setAttribute('x2', '19'),
        _0x59135a.setAttribute('y2', '12'),
        _0x1365a5.appendChild(_0x24f4a2),
        _0x1365a5.appendChild(_0x59135a),
        _0x3d83bd.appendChild(_0x1365a5));
      const _0x127ba6 = document.createElement('div');
      ((_0x127ba6.className = 'pc-info'),
        Object.assign(_0x127ba6.style, {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          padding: '16px 0',
        }));
      const _0x48982f = document.createElement('div');
      ((_0x48982f.className = 'pc-title'),
        Object.assign(_0x48982f.style, {
          color: 'var(--text-primary)',
          fontSize: '16px',
          fontWeight: '600',
          textAlign: 'center',
          margin: '0',
        }),
        (_0x48982f.textContent = projectManagerText('newProject')),
        _0x127ba6.appendChild(_0x48982f),
        _0x5f0d10.appendChild(_0x3d83bd),
        _0x5f0d10.appendChild(_0x127ba6));
      const _0x21e870 = document.createElement('style');
      ((_0x21e870.textContent =
        '@keyframes spin { 100% { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }'),
        document.head.appendChild(_0x21e870),
        (window.showGlobalLoading = function (_0x458211 = projectManagerText('loading'), _0x4b37bb = {}) {
          let _0x4d95f0 = document.getElementById('v2-global-loading');
          if (!_0x4d95f0) {
            ((_0x4d95f0 = document.createElement('div')),
              (_0x4d95f0.id = 'v2-global-loading'),
              Object.assign(_0x4d95f0.style, {
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
            const _0x152881 = document.createElementNS(_0x27403a, 'svg');
            (_0x152881.setAttribute('width', '18'),
              _0x152881.setAttribute('height', '18'),
              _0x152881.setAttribute('viewBox', '0 0 24 24'),
              _0x152881.setAttribute('fill', 'none'),
              _0x152881.setAttribute('stroke', 'currentColor'),
              _0x152881.setAttribute('stroke-width', '2'),
              _0x152881.classList.add('spin'));
            const _0x5a4f3a = document.createElementNS(_0x27403a, 'path');
            (_0x5a4f3a.setAttribute('d', 'M21 12a9 9 0 1 1-6.219-8.56'), _0x152881.appendChild(_0x5a4f3a));
            const _0x1e167a = document.createElement('div');
            _0x1e167a.className = 'v2-global-loading-body';
            const _0x523132 = document.createElement('span');
            _0x523132.className = 'v2-global-loading-label';
            const _0x151a44 = document.createElement('progress');
            ((_0x151a44.className = 'v2-global-loading-progress'),
              (_0x151a44.max = 1),
              (_0x151a44.value = 0),
              (_0x151a44.hidden = true),
              _0x4d95f0.appendChild(_0x152881),
              _0x1e167a.appendChild(_0x523132),
              _0x1e167a.appendChild(_0x151a44),
              _0x4d95f0.appendChild(_0x1e167a),
              document.body.appendChild(_0x4d95f0));
          }
          const _0x13c5be = _0x4d95f0.querySelector('.v2-global-loading-label'),
            _0x3b8cfd = _0x4d95f0.querySelector('.v2-global-loading-progress');
          if (_0x13c5be) _0x13c5be.textContent = _0x458211;
          const _0x1b60ed = Number(_0x4b37bb?.progress),
            _0x5793ac = Number.isFinite(_0x1b60ed) && _0x1b60ed >= 0;
          if (_0x3b8cfd) {
            _0x3b8cfd.hidden = !_0x5793ac;
            if (_0x5793ac) _0x3b8cfd.value = Math.max(0, Math.min(1, _0x1b60ed));
          }
          (void _0x4d95f0.offsetWidth, (_0x4d95f0.style.opacity = '1'));
        }),
        (window.updateGlobalLoading = function (_0x535ebe = {}) {
          const _0x55e3a1 = document.getElementById('v2-global-loading');
          if (!_0x55e3a1) return;
          const _0x109989 = typeof _0x535ebe === 'string' ? { text: _0x535ebe } : _0x535ebe || {},
            _0x1425f1 = _0x55e3a1.querySelector('.v2-global-loading-label'),
            _0x2fed6f = _0x55e3a1.querySelector('.v2-global-loading-progress'),
            _0x5ce975 = String(_0x109989.text || _0x109989.message || '').trim();
          if (_0x5ce975 && _0x1425f1) _0x1425f1.textContent = _0x5ce975;
          const _0x7b4ee6 = Number(_0x109989.progress),
            _0x360c8d = Number.isFinite(_0x7b4ee6) && _0x7b4ee6 >= 0;
          if (_0x2fed6f) {
            _0x2fed6f.hidden = !_0x360c8d;
            if (_0x360c8d) _0x2fed6f.value = Math.max(0, Math.min(1, _0x7b4ee6));
          }
        }),
        (window.hideGlobalLoading = function () {
          const _0x5a23e3 = document.getElementById('v2-global-loading');
          _0x5a23e3 && ((_0x5a23e3.style.opacity = '0'), setTimeout(() => _0x5a23e3.remove(), 250));
        }),
        (_0x5f0d10.onclick = async () => {
          const _0x2ba172 = await this.createProject();
          // init() hydrates on success; never clear the current canvas before the read.
          if (_0x2ba172 && (await this.loadProject(_0x2ba172, { allowMissing: true }))) commit();
        }),
        projectGrid.appendChild(_0x5f0d10),
        _0x38d66e
          .sort((_0x25acab, _0x4ddddb) => _0x4ddddb.lastModified - _0x25acab.lastModified)
          .forEach((_0x8ddd0d) => {
            const _0x434baf = document.createElement('div');
            _0x434baf.className = 'project-card';
            const _0x4af3f1 = new Date(_0x8ddd0d.lastModified).toLocaleString(getLocale(), {
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              _0x5d7ce9 = document.createElement('div');
            _0x5d7ce9.className = 'pc-preview';
            if (_0x8ddd0d.thumbnail && _0x8ddd0d.thumbnail.type === 'image' && _0x8ddd0d.thumbnail.data) {
              const _0x255056 = document.createElement('img');
              ((_0x255056.src = _0x8ddd0d.thumbnail.data), _0x5d7ce9.appendChild(_0x255056));
            } else {
              if (_0x8ddd0d.thumbnail && _0x8ddd0d.thumbnail.type === 'text' && _0x8ddd0d.thumbnail.data) {
                const _0x456eea = document.createElement('div');
                ((_0x456eea.className = 'pc-text-snippet'),
                  (_0x456eea.textContent = _0x8ddd0d.thumbnail.data),
                  _0x5d7ce9.appendChild(_0x456eea));
              } else {
                const _0x4c2030 = document.createElement('div');
                ((_0x4c2030.className = 'pc-logo'),
                  Object.assign(_0x4c2030.style, {
                    fontWeight: 'bold',
                    color: 'var(--white-10)',
                    fontSize: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                  }),
                  (_0x4c2030.textContent = 'AICanvas'),
                  _0x5d7ce9.appendChild(_0x4c2030));
              }
            }
            const _0x51e422 = document.createElement('div');
            _0x51e422.className = 'pc-info';
            const _0x268963 = document.createElement('div');
            ((_0x268963.className = 'pc-title'), (_0x268963.textContent = _0x8ddd0d.name));
            const _0x522028 = document.createElement('div');
            _0x522028.className = 'pc-meta';
            const _0x8edacb = document.createElement('span');
            ((_0x8edacb.className = 'pc-time'), (_0x8edacb.textContent = _0x4af3f1));
            const _0x188379 = document.createElement('span');
            ((_0x188379.className = 'pc-delete'),
              (_0x188379.dataset.id = _0x8ddd0d.id),
              Object.assign(_0x188379.style, {
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }),
              (_0x188379.textContent = projectManagerText('delete')),
              _0x188379.addEventListener('mouseenter', () => (_0x188379.style.color = 'var(--red)')),
              _0x188379.addEventListener('mouseleave', () => (_0x188379.style.color = 'var(--text-muted)')),
              _0x522028.appendChild(_0x8edacb),
              _0x522028.appendChild(_0x188379),
              _0x51e422.appendChild(_0x268963),
              _0x51e422.appendChild(_0x522028),
              _0x434baf.appendChild(_0x5d7ce9),
              _0x434baf.appendChild(_0x51e422),
              (_0x434baf.onclick = async (_0x228a6d) => {
                const _0x452b7d = _0x228a6d.target.closest('.pc-delete');
                if (_0x452b7d) {
                  (_0x228a6d.stopPropagation(), await this.deleteProject(_0x8ddd0d.id));
                  return;
                }
                await this.loadProject(_0x8ddd0d.id);
              }),
              projectGrid.appendChild(_0x434baf));
          }));
    },
  };
export default ProjectManager;
export { ProjectManager };
