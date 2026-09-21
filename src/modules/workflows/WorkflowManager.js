import appStore, {
  graphStore as graphStore_2,
  uiStore as uiStore_2,
  workspaceStore as workspaceStore_2,
} from '../../core/stores/appStore.js';
import { screenToWorld } from '../../core/math.js';
import { getLocale, t } from '../../i18n/index.js';
import { commit } from '../history.js';
import {
  applyWorkflowToCanvas,
  sliceCanvasStateForWorkflow,
  normalizeWorkflowTags,
  WORKFLOW_LIMITS,
} from './workflowCanvas.js';
import {
  DEFAULT_WORKFLOW_COVER_ID,
  createWorkflowSnapshotCoverCandidate,
  extractWorkflowCoverCandidates,
  getDefaultWorkflowCoverCandidate,
} from './workflowCovers.js';
import { buildWorkflowContentPreviewItems, buildWorkflowSourceSummary } from './workflowPreview.js';
import { filterWorkflows, findWorkflowById } from './workflowSelectors.js';
import {
  deleteWorkflow,
  loadWorkflowsFromServer,
  renameWorkflow,
  saveNewWorkflowFromCanvas,
  saveWorkflowMeta,
  saveUpdatedWorkflowFromCanvas,
  saveWorkflowUsage,
} from './workflowService.js';
import { playWorkflowSaveFly } from './workflowSaveAnimation.js';
import { registerSidebarSubmenu } from '../sidebarSubmenuController.js';
const graphStore = appStore?.graphStore || graphStore_2 || appStore,
  uiStore = appStore?.uiStore || uiStore_2 || appStore,
  workspaceStore = appStore?.workspaceStore || workspaceStore_2 || appStore;
function getState() {
  return { ...graphStore.getState(), ...uiStore.getState(), ...workspaceStore.getState() };
}
function getStateRaw() {
  return { ...graphStore.getStateRaw(), ...uiStore.getStateRaw(), ...workspaceStore.getStateRaw() };
}
function el(_0x156c6b, _0x271a80 = '', _0x3cff4a = '') {
  const _0x28cd40 = document.createElement(_0x156c6b);
  if (_0x271a80) _0x28cd40.className = _0x271a80;
  if (_0x3cff4a) _0x28cd40.textContent = _0x3cff4a;
  return _0x28cd40;
}
function cleanText(_0x2f506b) {
  return String(_0x2f506b ?? '').trim();
}
function workflowText(_0x29a36d, _0x1ec686 = {}) {
  return t('workflows.manager.' + _0x29a36d, _0x1ec686);
}
function formatDateTime(_0xdd7bbe) {
  const _0x2c5a70 = Number(_0xdd7bbe);
  if (!Number.isFinite(_0x2c5a70) || _0x2c5a70 <= 0) return workflowText('unknown');
  return new Date(_0x2c5a70).toLocaleString(getLocale(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
function formatShortDate(_0x71b38f) {
  const _0x56c013 = Number(_0x71b38f);
  if (!Number.isFinite(_0x56c013) || _0x56c013 <= 0) return workflowText('unknown');
  return new Date(_0x56c013).toLocaleDateString(getLocale(), { month: '2-digit', day: '2-digit' });
}
function formatWorkflowMetaLine(_0xd3eb62) {
  const _0x242fa0 = Number(_0xd3eb62?.nodeCount || _0xd3eb62?.workflowData?.nodes?.length || 0) || 0,
    _0x377146 = Number(_0xd3eb62?.edgeCount || _0xd3eb62?.workflowData?.edges?.length || 0) || 0,
    _0x9906e6 = Number(_0xd3eb62?.lastUsedAt || 0) || 0,
    _0x55b4fb = Number(_0xd3eb62?.updatedAt || 0) || 0,
    _0x54d5f5 =
      _0x9906e6 > 0
        ? workflowText('meta.used', { date: formatShortDate(_0x9906e6) })
        : workflowText('meta.updated', { date: formatShortDate(_0x55b4fb) });
  return workflowText('meta.line', { nodeCount: _0x242fa0, edgeCount: _0x377146, time: _0x54d5f5 });
}
function showToast(_0xf641dd, _0x2fbebf = 'info') {
  window.showToast?.(_0xf641dd, _0x2fbebf);
}
function appendCoverPlaceholder(_0x488cdc, _0x28434a = 'AI Canvas') {
  if (!_0x488cdc) return;
  _0x488cdc.replaceChildren(el('div', 'v2-workflow-cover-placeholder', _0x28434a));
}
const WORKFLOW_UPDATE_ENTRY_ENABLED = false,
  WORKFLOW_MODAL_TABS_ENABLED = WORKFLOW_UPDATE_ENTRY_ENABLED;
function buildWorkflowListRenderKey(_0xe26366 = []) {
  if (!Array.isArray(_0xe26366)) return '';
  return _0xe26366
    .map((_0x1240bb) => {
      const _0x220497 = Array.isArray(_0x1240bb?.tags)
        ? _0x1240bb.tags.map(cleanText).filter(Boolean).join(',')
        : '';
      return [
        cleanText(_0x1240bb?.id),
        cleanText(_0x1240bb?.name),
        cleanText(_0x1240bb?.cover || _0x1240bb?.coverUrl),
        cleanText(_0x1240bb?.note),
        _0x220497,
        Number(_0x1240bb?.updatedAt || 0) || 0,
        Number(_0x1240bb?.nodeCount || 0) || 0,
        Number(_0x1240bb?.edgeCount || 0) || 0,
      ].join('|');
    })
    .join(';');
}
export class WorkflowManager {
  constructor() {
    ((this.sidebarPanel = null),
      (this.sidebarContent = null),
      (this.modal = null),
      (this.modalDialog = null),
      (this.modalBody = null),
      (this._hideTimer = 0),
      (this._loadingPromise = null),
      (this._pendingDeleteWorkflowId = ''),
      (this._renamingWorkflowId = ''),
      this.initSidebarPanel(),
      this.initModal(),
      this.bindGlobalEvents(),
      this.loadWorkflows(),
      workspaceStore.subscribeSelector(
        (_0x5104ee) => ({
          workflowsKey: buildWorkflowListRenderKey(_0x5104ee.workflows?.items),
          workflowsLoading: _0x5104ee.workflows?.loading === true,
          workflowsError: _0x5104ee.workflows?.error || null,
          panelOpen: _0x5104ee.workflowUi?.panelOpen,
          panelPinned: _0x5104ee.workflowUi?.panelPinned,
          searchKeyword: _0x5104ee.workflowUi?.searchKeyword,
          detailWorkflowId: _0x5104ee.workflowUi?.detailWorkflowId,
        }),
        () => this.renderSidebar(),
      ));
  }
  ['bindGlobalEvents']() {
    const _0x55ac24 = (_0x1a1697) => {
      (_0x1a1697?.preventDefault?.(), this.openCreateModal(_0x1a1697?.detail?.groupId || null));
    };
    (document.addEventListener('workflow:create-request', _0x55ac24),
      window.addEventListener('workflow:create-request', _0x55ac24));
  }
  ['initSidebarPanel']() {
    const _0x42a8e8 = document.querySelector('.sidebar-floating') || document.body,
      _0x443747 = document.getElementById('btnWorkflows');
    ((this.sidebarPanel = el('div', 'v2-workflow-sidebar-panel')),
      this.sidebarPanel.setAttribute('aria-label', workflowText('sidebarAria')));
    const _0x307e18 = el('div', 'v2-workflow-sidebar-header'),
      _0x1d8e10 = el('button', 'v2-workflow-back', '‹');
    ((_0x1d8e10.type = 'button'), (_0x1d8e10.dataset.action = 'workflow-back'));
    const _0x4a1b3c = el('div', 'v2-workflow-sidebar-title');
    ((this.sidebarTitleTextEl = el('span', 'v2-workflow-title-text', workflowText('title'))),
      _0x4a1b3c.appendChild(this.sidebarTitleTextEl),
      _0x307e18.append(_0x1d8e10, _0x4a1b3c));
    const _0x26805d = el('div', 'v2-workflow-search'),
      _0x5a5a51 = el('input', 'v2-workflow-search-input');
    ((_0x5a5a51.type = 'search'),
      (_0x5a5a51.placeholder = workflowText('searchPlaceholder')),
      (_0x5a5a51.dataset.role = 'workflow-search'),
      _0x26805d.appendChild(_0x5a5a51),
      (this.sidebarContent = el('div', 'v2-workflow-list')),
      this.sidebarPanel.append(_0x307e18, _0x26805d, this.sidebarContent),
      _0x42a8e8.appendChild(this.sidebarPanel),
      _0x443747 &&
        registerSidebarSubmenu({
          key: 'workflows',
          button: _0x443747,
          panel: this.sidebarPanel,
          open: () => this.openSidebar(false),
          close: () => {
            (this.hideSidebar(),
              workspaceStore.setWorkflowUi({ panelOpen: false, panelPinned: false, detailWorkflowId: null }));
          },
          isOpen: () => getState().workflowUi?.panelOpen === true,
        }),
      this.sidebarPanel.addEventListener('click', (_0x1e00fa) => this.handleSidebarClick(_0x1e00fa)),
      this.sidebarPanel.addEventListener('keydown', (_0x32b4c8) => {
        if (_0x32b4c8.target?.dataset?.role !== 'workflow-rename-input') return;
        this.handleSidebarRenameKeydown(_0x32b4c8);
      }),
      this.sidebarPanel.addEventListener('focusout', (_0xe6b92b) => {
        const _0x4ee0d4 = _0xe6b92b.target;
        if (_0x4ee0d4?.dataset?.role !== 'workflow-rename-input') return;
        if (_0x4ee0d4.dataset.submitted === '1') return;
        this.commitWorkflowRename(_0x4ee0d4.dataset.workflowId, _0x4ee0d4.value);
      }),
      this.sidebarPanel.addEventListener('input', (_0x11f210) => {
        const _0x21dc31 = _0x11f210.target;
        if (_0x21dc31?.dataset?.role !== 'workflow-search') return;
        workspaceStore.setWorkflowUi({ searchKeyword: _0x21dc31.value || '' });
      }));
  }
  ['initModal']() {
    ((this.modal = el('div', 'v2-workflow-modal-backdrop')),
      this.modal.setAttribute('aria-hidden', 'true'),
      (this.modalDialog = el('div', 'v2-workflow-modal')),
      this.modalDialog.setAttribute('role', 'dialog'),
      this.modalDialog.setAttribute('aria-label', workflowText('title')));
    const _0x5ac0c5 = el('div', 'v2-workflow-modal-header'),
      _0x18389b = el('div', 'v2-workflow-modal-title');
    ((this.modalTitleTextEl = el('span', 'v2-workflow-title-text', workflowText('title'))),
      _0x18389b.appendChild(this.modalTitleTextEl));
    const _0x315928 = el('button', 'v2-workflow-icon-btn', '×');
    ((_0x315928.type = 'button'),
      (_0x315928.dataset.action = 'workflow-modal-close'),
      _0x5ac0c5.append(_0x18389b, _0x315928),
      (this.modalBody = el('div', 'v2-workflow-modal-body')));
    if (WORKFLOW_MODAL_TABS_ENABLED) {
      const _0x2979e7 = el('div', 'v2-workflow-modal-tabs'),
        _0x2c64bc = [['create', workflowText('tabs.create')]];
      WORKFLOW_UPDATE_ENTRY_ENABLED && _0x2c64bc.push(['update', workflowText('tabs.update')]);
      for (const [_0x439784, _0x555ddb] of _0x2c64bc) {
        const _0x59362e = el('button', 'v2-workflow-modal-tab', _0x555ddb);
        ((_0x59362e.type = 'button'),
          (_0x59362e.dataset.modalTab = _0x439784),
          _0x2979e7.appendChild(_0x59362e));
      }
      this.modalDialog.append(_0x5ac0c5, _0x2979e7, this.modalBody);
    } else this.modalDialog.append(_0x5ac0c5, this.modalBody);
    (this.modal.appendChild(this.modalDialog),
      document.body.appendChild(this.modal),
      this.modal.addEventListener('click', (_0x29a6be) => {
        const _0x2df983 = _0x29a6be.target.closest('[data-action]');
        if (_0x2df983?.dataset?.action === 'workflow-modal-close') {
          this.closeModal();
          return;
        }
        _0x29a6be.target === this.modal && this.closeModal();
      }),
      this.modal.addEventListener('click', (_0x36da91) => this.handleModalClick(_0x36da91)),
      this.modal.addEventListener('input', (_0x5ee61a) => this.handleModalInput(_0x5ee61a)),
      this.modal.addEventListener('keydown', (_0x2bce83) => this.handleModalKeydown(_0x2bce83)));
  }
  async ['loadWorkflows']() {
    if (this._loadingPromise) return this._loadingPromise;
    return (
      workspaceStore.setWorkflowsLoading(true),
      (this._loadingPromise = loadWorkflowsFromServer()
        .then((_0x47cba3) => {
          const _0x5938df = new Map();
          for (const _0x4f4788 of getState().workflows?.items || []) {
            if (_0x4f4788?.id) _0x5938df.set(_0x4f4788.id, _0x4f4788);
          }
          for (const _0x1995bb of _0x47cba3 || []) {
            if (_0x1995bb?.id) _0x5938df.set(_0x1995bb.id, _0x1995bb);
          }
          const _0x4e8162 = Array.from(_0x5938df.values());
          return (workspaceStore.setWorkflows(_0x4e8162), _0x4e8162);
        })
        .catch((_0x5ac802) => {
          return (
            workspaceStore.setWorkflowsLoading(false, _0x5ac802?.message || workflowText('loadFailed')),
            showToast(workflowText('loadFailed'), 'error'),
            []
          );
        })
        .finally(() => {
          this._loadingPromise = null;
        })),
      this._loadingPromise
    );
  }
  ['openSidebar'](_0x4ffcf4 = false) {
    (clearTimeout(this._hideTimer),
      workspaceStore.setWorkflowUi({ panelOpen: true, panelPinned: _0x4ffcf4 === true }));
    const _0x523573 = getState().workflows || {};
    !_0x523573.loadedAt && !_0x523573.loading && this.loadWorkflows();
  }
  ['scheduleCloseSidebar']() {
    (clearTimeout(this._hideTimer),
      (this._hideTimer = window.setTimeout(() => {
        const _0x22a13c = getState().workflowUi || {};
        !_0x22a13c.panelPinned && (this.hideSidebar(), workspaceStore.setWorkflowUi({ panelOpen: false }));
      }, 180)));
  }
  ['hideSidebar']() {
    (clearTimeout(this._hideTimer),
      (this._pendingDeleteWorkflowId = ''),
      (this._renamingWorkflowId = ''),
      this.sidebarPanel?.classList.remove('show'));
    const _0xdea56a = document.getElementById('btnWorkflows');
    _0xdea56a?.classList.remove('active');
  }
  ['renderSidebar']() {
    if (!this.sidebarPanel || !this.sidebarContent) return;
    const _0x45467e = getState(),
      _0x4d7ed8 = _0x45467e.workflows?.items || [],
      _0x1dca5e = _0x45467e.workflows || {},
      _0x5e1ba4 = _0x45467e.workflowUi || {},
      _0xeae1e2 = document.getElementById('btnWorkflows');
    (this.sidebarPanel.classList.toggle('show', _0x5e1ba4.panelOpen === true),
      _0xeae1e2?.classList.toggle('active', _0x5e1ba4.panelOpen === true || _0x5e1ba4.panelPinned === true));
    const _0x672001 = this.sidebarPanel.querySelector('.v2-workflow-back');
    _0x672001?.classList.toggle('show', !!_0x5e1ba4.detailWorkflowId);
    this.sidebarTitleTextEl &&
      (this.sidebarTitleTextEl.textContent = _0x5e1ba4.detailWorkflowId
        ? workflowText('detailTitle')
        : workflowText('title'));
    const _0x5b512a = this.sidebarPanel.querySelector("[data-role='workflow-search']");
    _0x5b512a &&
      _0x5b512a.value !== (_0x5e1ba4.searchKeyword || '') &&
      (_0x5b512a.value = _0x5e1ba4.searchKeyword || '');
    this.sidebarContent.replaceChildren();
    if (_0x5e1ba4.detailWorkflowId) {
      ((this._pendingDeleteWorkflowId = ''),
        (this._renamingWorkflowId = ''),
        this.renderWorkflowDetail(_0x4d7ed8, _0x5e1ba4.detailWorkflowId));
      return;
    }
    if (_0x1dca5e.loading) {
      this.renderLoadingList();
      return;
    }
    const _0x2c9838 = filterWorkflows(_0x4d7ed8, _0x5e1ba4.searchKeyword);
    if (_0x2c9838.length === 0) {
      const _0x32174d = cleanText(_0x5e1ba4.searchKeyword)
        ? workflowText('empty.noMatches')
        : workflowText('empty.noWorkflows');
      this.sidebarContent.appendChild(this.renderEmpty(_0x32174d));
      return;
    }
    for (const _0x278f05 of _0x2c9838) {
      this.sidebarContent.appendChild(this.renderWorkflowCard(_0x278f05));
    }
  }
  ['renderLoadingList']() {
    for (let _0xea0cc7 = 0; _0xea0cc7 < 4; _0xea0cc7++) {
      this.sidebarContent.appendChild(el('div', 'v2-workflow-skeleton'));
    }
  }
  ['renderEmpty'](_0x3886fb) {
    const _0x5ccd5a = el('div', 'v2-workflow-empty'),
      _0x40b607 = el('div', 'v2-workflow-empty-text', _0x3886fb);
    return (_0x5ccd5a.appendChild(_0x40b607), _0x5ccd5a);
  }
  ['renderCover'](_0x4a1c0c, _0x4c42b9 = 'v2-workflow-cover', _0x4d9686 = 'AI Canvas') {
    const _0x40f737 = el('div', _0x4c42b9),
      _0x188ffd = cleanText(_0x4a1c0c);
    appendCoverPlaceholder(_0x40f737, _0x4d9686);
    if (_0x188ffd) {
      const _0x278d3e = el('img');
      ((_0x278d3e.src = _0x188ffd),
        (_0x278d3e.alt = workflowText('coverAlt')),
        (_0x278d3e.draggable = false),
        (_0x278d3e.decoding = 'async'),
        _0x278d3e.addEventListener(
          'load',
          () => {
            if (_0x40f737.isConnected) _0x40f737.replaceChildren(_0x278d3e);
          },
          { once: true },
        ));
    }
    return _0x40f737;
  }
  ['renderWorkflowCard'](_0x1ecaaa) {
    const _0x4e7c7b = el('article', 'v2-workflow-card'),
      _0x725b08 = String(_0x1ecaaa?.id || '');
    ((_0x4e7c7b.dataset.workflowId = _0x725b08),
      (_0x4e7c7b.dataset.action = 'workflow-view'),
      _0x4e7c7b.appendChild(this.renderCover(_0x1ecaaa.cover)));
    const _0x5e4f93 = getState().workflowUi?.applyingWorkflowId,
      _0x291da5 = el('button', 'v2-workflow-card-load');
    ((_0x291da5.type = 'button'),
      (_0x291da5.dataset.action = 'workflow-apply'),
      (_0x291da5.dataset.workflowId = _0x725b08),
      (_0x291da5.disabled = _0x5e4f93 === _0x1ecaaa.id),
      (_0x291da5.title = workflowText('loadToCanvas')),
      _0x291da5.setAttribute('aria-label', workflowText('loadToCanvas')),
      (_0x291da5.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 5.5a7.5 7.5 0 1 0-1 13.5"/><path d="M12 14h6v6"/><path d="m18 14-6 6"/></svg>'));
    const _0x398cc0 = el('button', 'v2-workflow-card-delete');
    ((_0x398cc0.type = 'button'),
      (_0x398cc0.dataset.action = 'workflow-delete-open'),
      (_0x398cc0.dataset.workflowId = _0x725b08),
      _0x398cc0.setAttribute('aria-label', workflowText('deleteWorkflow')),
      (_0x398cc0.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 3h6l1 2h5v2H3V5h5l1-2zm1 6h2v10h-2V9zm4 0h2v10h-2V9zM7 9h2v10H7V9z"/></svg>'));
    const _0x44846e = el('div', 'v2-workflow-card-delete-confirm');
    _0x44846e.hidden = this._pendingDeleteWorkflowId !== _0x725b08;
    const _0x27d448 = el(
      'button',
      'v2-workflow-card-delete-confirm-btn v2-workflow-card-delete-confirm-btn--danger',
      '✔',
    );
    ((_0x27d448.type = 'button'),
      (_0x27d448.dataset.action = 'workflow-delete-confirm'),
      (_0x27d448.dataset.workflowId = _0x725b08),
      _0x27d448.setAttribute('aria-label', workflowText('confirm')));
    const _0x351ff3 = el(
      'button',
      'v2-workflow-card-delete-confirm-btn v2-workflow-card-delete-confirm-btn--neutral',
      '×',
    );
    ((_0x351ff3.type = 'button'),
      (_0x351ff3.dataset.action = 'workflow-delete-cancel'),
      (_0x351ff3.dataset.workflowId = _0x725b08),
      _0x351ff3.setAttribute('aria-label', workflowText('cancel')),
      _0x44846e.append(_0x27d448, _0x351ff3),
      (_0x398cc0.hidden = this._pendingDeleteWorkflowId === _0x725b08),
      _0x4e7c7b.append(_0x291da5, _0x398cc0, _0x44846e));
    const _0x3e5d24 = el('div', 'v2-workflow-card-info'),
      _0x23bfb5 = el('div', 'v2-workflow-card-title');
    ((_0x23bfb5.dataset.action = 'workflow-rename-open'), (_0x23bfb5.dataset.workflowId = _0x725b08));
    if (this._renamingWorkflowId === _0x725b08) {
      (_0x23bfb5.classList.add('is-editing'),
        _0x23bfb5.removeAttribute('data-action'),
        _0x23bfb5.removeAttribute('data-workflow-id'));
      const _0x3606bd = el('input', 'v2-workflow-card-title-input');
      ((_0x3606bd.type = 'text'),
        (_0x3606bd.value = _0x1ecaaa.name || ''),
        (_0x3606bd.maxLength = WORKFLOW_LIMITS.nameMax),
        (_0x3606bd.dataset.role = 'workflow-rename-input'),
        (_0x3606bd.dataset.workflowId = _0x725b08),
        _0x3606bd.setAttribute('aria-label', workflowText('name')),
        _0x23bfb5.appendChild(_0x3606bd),
        window.requestAnimationFrame(() => {
          if (!_0x3606bd.isConnected) return;
          (_0x3606bd.focus(), _0x3606bd.select?.());
        }));
    } else _0x23bfb5.textContent = _0x1ecaaa.name || workflowText('unnamedWorkflow');
    _0x3e5d24.appendChild(_0x23bfb5);
    const _0xf48182 = cleanText(_0x1ecaaa.note),
      _0x20fa9e = el('button', 'v2-workflow-note-hint', '!');
    return (
      (_0x20fa9e.type = 'button'),
      (_0x20fa9e.dataset.note = _0xf48182 || workflowText('empty.noNote')),
      (_0x20fa9e.title = _0xf48182 || workflowText('empty.noNote')),
      _0x20fa9e.setAttribute(
        'aria-label',
        _0xf48182 ? workflowText('noteAria', { note: _0xf48182 }) : workflowText('empty.noNote'),
      ),
      _0x3e5d24.appendChild(_0x20fa9e),
      _0x5e4f93 === _0x1ecaaa.id && _0x4e7c7b.classList.add('is-applying'),
      _0x4e7c7b.appendChild(_0x3e5d24),
      _0x4e7c7b
    );
  }
  ['renderWorkflowDetail'](_0xa448be, _0x5e8dad) {
    const _0x280b56 = findWorkflowById(_0xa448be, _0x5e8dad);
    if (!_0x280b56) {
      this.sidebarContent.appendChild(this.renderEmpty(workflowText('workflowMissing')));
      return;
    }
    const _0x19e15c = el('div', 'v2-workflow-detail');
    (_0x19e15c.appendChild(this.renderCover(_0x280b56.cover, 'v2-workflow-detail-cover')),
      _0x19e15c.appendChild(el('div', 'v2-workflow-detail-title', _0x280b56.name)),
      _0x19e15c.appendChild(el('div', 'v2-workflow-detail-meta', formatWorkflowMetaLine(_0x280b56))));
    const _0x1b376b = (_0x280b56.tags || []).map((_0x12d939) => cleanText(_0x12d939)).filter(Boolean);
    if (_0x1b376b.length > 0) {
      const _0x11c7c5 = el('div', 'v2-workflow-tags');
      for (const _0x5ab14d of _0x1b376b) {
        _0x11c7c5.appendChild(el('span', 'v2-workflow-tag', _0x5ab14d));
      }
      _0x19e15c.appendChild(_0x11c7c5);
    }
    const _0x1462a2 = el('section', 'v2-workflow-detail-section');
    _0x1462a2.appendChild(el('div', 'v2-workflow-detail-section-title', workflowText('content')));
    const _0x951237 = buildWorkflowContentPreviewItems(_0x280b56);
    if (_0x951237.length === 0)
      _0x1462a2.appendChild(this.renderEmpty(workflowText('empty.noPreviewContent')));
    else {
      const _0x2dd829 = el('div', 'v2-workflow-content-list');
      for (const _0x393dcd of _0x951237) {
        _0x2dd829.appendChild(this.renderWorkflowContentItem(_0x393dcd));
      }
      _0x1462a2.appendChild(_0x2dd829);
    }
    _0x19e15c.appendChild(_0x1462a2);
    const _0x109914 = cleanText(_0x280b56.note);
    if (_0x109914) {
      const _0x3e5df3 = el('div', 'v2-workflow-detail-note');
      ((_0x3e5df3.textContent = _0x109914), _0x19e15c.appendChild(_0x3e5df3));
    }
    const _0x43bd6c = el('div', 'v2-workflow-detail-actions');
    if (WORKFLOW_UPDATE_ENTRY_ENABLED) {
      const _0x3310e8 = el('button', 'v2-workflow-secondary-btn', workflowText('editMeta'));
      ((_0x3310e8.type = 'button'),
        (_0x3310e8.dataset.action = 'workflow-edit-meta'),
        (_0x3310e8.dataset.workflowId = _0x280b56.id));
      const _0x2cb259 = el('button', 'v2-workflow-secondary-btn', workflowText('updateContent'));
      ((_0x2cb259.type = 'button'),
        (_0x2cb259.dataset.action = 'workflow-open-update'),
        (_0x2cb259.dataset.workflowId = _0x280b56.id),
        _0x43bd6c.append(_0x3310e8, _0x2cb259));
    }
    const _0x50066f = el('button', 'v2-workflow-primary-btn', workflowText('applyToCanvas'));
    ((_0x50066f.type = 'button'),
      (_0x50066f.dataset.action = 'workflow-apply'),
      (_0x50066f.dataset.workflowId = _0x280b56.id),
      getState().workflowUi?.applyingWorkflowId === _0x280b56.id &&
        ((_0x50066f.disabled = true), (_0x50066f.textContent = workflowText('applying'))),
      _0x43bd6c.append(_0x50066f),
      _0x19e15c.appendChild(_0x43bd6c),
      this.sidebarContent.appendChild(_0x19e15c));
  }
  ['renderWorkflowContentItem'](_0x49b4d2) {
    const _0x598859 = el('article', 'v2-workflow-content-item');
    _0x598859.appendChild(
      this.renderCover(
        _0x49b4d2.thumbSrc,
        'v2-workflow-content-thumb',
        _0x49b4d2.placeholderLabel || workflowText('nodeFallback'),
      ),
    );
    const _0x5bed80 = el('div', 'v2-workflow-content-info');
    (_0x5bed80.appendChild(
      el('span', 'v2-workflow-content-type', _0x49b4d2.typeLabel || workflowText('nodeFallback')),
    ),
      _0x5bed80.appendChild(
        el(
          'div',
          'v2-workflow-content-title',
          _0x49b4d2.title || _0x49b4d2.typeLabel || workflowText('nodeFallback'),
        ),
      ));
    const _0x3aaded = el('div', 'v2-workflow-content-summary');
    return (
      (_0x3aaded.textContent = _0x49b4d2.summary || workflowText('empty.noNodePreviewContent')),
      _0x5bed80.appendChild(_0x3aaded),
      _0x598859.appendChild(_0x5bed80),
      _0x598859
    );
  }
  ['playDeleteShake'](_0x5f5e31) {
    if (!_0x5f5e31) return;
    (_0x5f5e31.classList.remove('is-delete-shaking'),
      void _0x5f5e31.offsetWidth,
      _0x5f5e31.classList.add('is-delete-shaking'),
      window.setTimeout(() => {
        if (_0x5f5e31.isConnected) _0x5f5e31.classList.remove('is-delete-shaking');
      }, 240));
  }
  ['findWorkflowCard'](_0x574b2b) {
    const _0x2aa360 = String(_0x574b2b || '').trim();
    if (!_0x2aa360 || !this.sidebarContent) return null;
    for (const _0x331a81 of this.sidebarContent.querySelectorAll('.v2-workflow-card')) {
      if (_0x331a81?.dataset?.workflowId === _0x2aa360) return _0x331a81;
    }
    return null;
  }
  ['setWorkflowDeleteConfirm'](_0x4703e6, _0x4e4027) {
    const _0x5b6b05 = String(_0x4703e6 || '').trim();
    if (!_0x5b6b05) return false;
    _0x4e4027 &&
      this._pendingDeleteWorkflowId &&
      this._pendingDeleteWorkflowId !== _0x5b6b05 &&
      this.setWorkflowDeleteConfirm(this._pendingDeleteWorkflowId, false);
    const _0x36e1b0 = this.findWorkflowCard(_0x5b6b05);
    if (!_0x36e1b0) return false;
    const _0x64461c = _0x36e1b0.querySelector('.v2-workflow-card-delete'),
      _0x22da39 = _0x36e1b0.querySelector('.v2-workflow-card-delete-confirm');
    if (!_0x64461c || !_0x22da39) return false;
    return (
      (_0x64461c.hidden = _0x4e4027),
      (_0x22da39.hidden = !_0x4e4027),
      _0x36e1b0.classList.toggle('is-delete-confirming', _0x4e4027),
      (this._pendingDeleteWorkflowId = _0x4e4027
        ? _0x5b6b05
        : this._pendingDeleteWorkflowId === _0x5b6b05
          ? ''
          : this._pendingDeleteWorkflowId),
      true
    );
  }
  ['finishWorkflowRename'](_0x1a9f4c, _0x415708 = '') {
    const _0x1e9b1f = String(_0x1a9f4c || '').trim();
    if (!_0x1e9b1f) return false;
    const _0x5a55f4 = this.findWorkflowCard(_0x1e9b1f),
      _0x5a0a38 = _0x5a55f4?.querySelector('.v2-workflow-card-title');
    if (!_0x5a0a38) return false;
    const _0x150d7c = findWorkflowById(getState().workflows?.items || [], _0x1e9b1f);
    (_0x5a0a38.classList.remove('is-editing'),
      (_0x5a0a38.dataset.action = 'workflow-rename-open'),
      (_0x5a0a38.dataset.workflowId = _0x1e9b1f),
      _0x5a0a38.replaceChildren(),
      (_0x5a0a38.textContent = cleanText(_0x415708 || _0x150d7c?.name) || workflowText('unnamedWorkflow')));
    if (this._renamingWorkflowId === _0x1e9b1f) this._renamingWorkflowId = '';
    return true;
  }
  ['startWorkflowRename'](_0x1c9969) {
    const _0x36d81d = String(_0x1c9969 || '').trim();
    if (!_0x36d81d) return false;
    this._renamingWorkflowId &&
      this._renamingWorkflowId !== _0x36d81d &&
      this.finishWorkflowRename(this._renamingWorkflowId);
    this._pendingDeleteWorkflowId && this.setWorkflowDeleteConfirm(this._pendingDeleteWorkflowId, false);
    const _0x3779ab = findWorkflowById(getState().workflows?.items || [], _0x36d81d),
      _0x14db25 = this.findWorkflowCard(_0x36d81d),
      _0x21ac9d = _0x14db25?.querySelector('.v2-workflow-card-title');
    if (!_0x3779ab || !_0x21ac9d) return false;
    ((this._renamingWorkflowId = _0x36d81d),
      _0x21ac9d.classList.add('is-editing'),
      _0x21ac9d.removeAttribute('data-action'),
      _0x21ac9d.removeAttribute('data-workflow-id'));
    const _0x507f46 = el('input', 'v2-workflow-card-title-input');
    return (
      (_0x507f46.type = 'text'),
      (_0x507f46.value = _0x3779ab.name || ''),
      (_0x507f46.maxLength = WORKFLOW_LIMITS.nameMax),
      (_0x507f46.dataset.role = 'workflow-rename-input'),
      (_0x507f46.dataset.workflowId = _0x36d81d),
      _0x507f46.setAttribute('aria-label', workflowText('name')),
      _0x21ac9d.replaceChildren(_0x507f46),
      window.requestAnimationFrame(() => {
        if (!_0x507f46.isConnected) return;
        (_0x507f46.focus(), _0x507f46.select?.());
      }),
      true
    );
  }
  ['handleSidebarClick'](_0x342ae5) {
    const _0xdb4f91 = _0x342ae5.target.closest('[data-action]'),
      _0x147af5 = _0xdb4f91?.dataset?.action;
    if (_0x147af5 === 'workflow-back') {
      ((this._pendingDeleteWorkflowId = ''),
        (this._renamingWorkflowId = ''),
        workspaceStore.setWorkflowUi({ detailWorkflowId: null }));
      return;
    }
    if (_0x147af5 === 'workflow-open-create') {
      (_0x342ae5.preventDefault(),
        _0x342ae5.stopPropagation(),
        (this._pendingDeleteWorkflowId = ''),
        (this._renamingWorkflowId = ''),
        this.openCreateModal(null));
      return;
    }
    const _0x5cece6 = _0xdb4f91?.dataset?.workflowId;
    if (_0x147af5 === 'workflow-delete-open' && _0x5cece6) {
      (_0x342ae5.preventDefault(), _0x342ae5.stopPropagation());
      this._renamingWorkflowId && this.finishWorkflowRename(this._renamingWorkflowId);
      !this.setWorkflowDeleteConfirm(_0x5cece6, true) && this.renderSidebar();
      return;
    }
    if (_0x147af5 === 'workflow-delete-cancel') {
      (_0x342ae5.preventDefault(), _0x342ae5.stopPropagation());
      !this.setWorkflowDeleteConfirm(_0x5cece6, false) &&
        ((this._pendingDeleteWorkflowId = ''), this.renderSidebar());
      return;
    }
    if (_0x147af5 === 'workflow-delete-confirm' && _0x5cece6) {
      (_0x342ae5.preventDefault(), _0x342ae5.stopPropagation(), this.deleteWorkflowById(_0x5cece6));
      return;
    }
    if (_0x147af5 === 'workflow-rename-open' && _0x5cece6) {
      (_0x342ae5.preventDefault(), _0x342ae5.stopPropagation());
      !this.startWorkflowRename(_0x5cece6) &&
        ((this._renamingWorkflowId = String(_0x5cece6)), this.renderSidebar());
      return;
    }
    if (_0x147af5 === 'workflow-card-apply' && _0x5cece6) {
      if (
        _0x342ae5.target.closest('button, input, textarea, select') ||
        _0x342ae5.target.closest('.v2-workflow-card-title')
      )
        return;
      (_0x342ae5.preventDefault(),
        _0x342ae5.stopPropagation(),
        (this._pendingDeleteWorkflowId = ''),
        (this._renamingWorkflowId = ''),
        this.applyWorkflow(_0x5cece6));
      return;
    }
    if (_0x147af5 === 'workflow-view' && _0x5cece6) {
      if (
        _0x342ae5.target.closest('button, input, textarea, select') ||
        _0x342ae5.target.closest('.v2-workflow-card-title')
      )
        return;
      (_0x342ae5.preventDefault(),
        _0x342ae5.stopPropagation(),
        (this._pendingDeleteWorkflowId = ''),
        (this._renamingWorkflowId = ''),
        workspaceStore.setWorkflowUi({ detailWorkflowId: _0x5cece6 }));
      return;
    }
    if (_0x147af5 === 'workflow-edit-meta' && _0x5cece6) {
      ((this._pendingDeleteWorkflowId = ''),
        (this._renamingWorkflowId = ''),
        this.openUpdateModal(_0x5cece6, { metaOnly: true }));
      return;
    }
    if (_0x147af5 === 'workflow-open-update' && _0x5cece6) {
      ((this._pendingDeleteWorkflowId = ''),
        (this._renamingWorkflowId = ''),
        this.openUpdateModal(_0x5cece6, { metaOnly: false }));
      return;
    }
    if (_0x147af5 === 'workflow-apply' && _0x5cece6) {
      (_0x342ae5.preventDefault(),
        _0x342ae5.stopPropagation(),
        (this._pendingDeleteWorkflowId = ''),
        (this._renamingWorkflowId = ''),
        this.applyWorkflow(_0x5cece6));
      return;
    }
  }
  ['handleSidebarRenameKeydown'](_0x411ae5) {
    const _0xaa3681 = _0x411ae5.target,
      _0x2f6364 = _0xaa3681?.dataset?.workflowId;
    if (!_0x2f6364) return;
    if (_0x411ae5.key === 'Enter') {
      (_0x411ae5.preventDefault(),
        _0x411ae5.stopPropagation(),
        (_0xaa3681.dataset.submitted = '1'),
        this.commitWorkflowRename(_0x2f6364, _0xaa3681.value));
      return;
    }
    _0x411ae5.key === 'Escape' &&
      (_0x411ae5.preventDefault(),
      _0x411ae5.stopPropagation(),
      !this.finishWorkflowRename(_0x2f6364) && ((this._renamingWorkflowId = ''), this.renderSidebar()));
  }
  async ['commitWorkflowRename'](_0x575654, _0x44527b) {
    const _0x168914 = String(_0x575654 || '').trim(),
      _0x2c1138 = cleanText(_0x44527b);
    if (!_0x168914) return;
    if (!_0x2c1138) {
      showToast(workflowText('errors.nameRequired'), 'error');
      return;
    }
    const _0x33b546 = findWorkflowById(getState().workflows?.items || [], _0x168914);
    if (!_0x33b546) return;
    if (cleanText(_0x33b546.name) === _0x2c1138) {
      !this.finishWorkflowRename(_0x168914, _0x33b546.name) &&
        ((this._renamingWorkflowId = ''), this.renderSidebar());
      return;
    }
    let _0x57ddbb = null;
    try {
      ((_0x57ddbb = await renameWorkflow(_0x33b546, _0x2c1138)),
        this.finishWorkflowRename(_0x168914, _0x57ddbb?.name || _0x2c1138),
        workspaceStore.upsertWorkflow(_0x57ddbb),
        showToast(workflowText('renamed'), 'success'));
    } catch (_0x3602bc) {
      (this.finishWorkflowRename(_0x168914, _0x33b546.name),
        showToast(_0x3602bc?.message || workflowText('renameFailed'), 'error'));
    } finally {
      this._renamingWorkflowId = '';
    }
  }
  async ['deleteWorkflowById'](_0x111482) {
    const _0x12e7fe = String(_0x111482 || '').trim();
    if (!_0x12e7fe) return;
    (this.setWorkflowDeleteConfirm(_0x12e7fe, false),
      (this._pendingDeleteWorkflowId = ''),
      (this._renamingWorkflowId = ''));
    try {
      await deleteWorkflow(_0x12e7fe);
      const _0x1e6c0e = getState(),
        _0x5a8776 = (_0x1e6c0e.workflows?.items || []).filter(
          (_0x59a0bb) => String(_0x59a0bb?.id || '') !== _0x12e7fe,
        );
      (workspaceStore.setWorkflows(_0x5a8776),
        _0x1e6c0e.workflowUi?.detailWorkflowId === _0x12e7fe &&
          workspaceStore.setWorkflowUi({ detailWorkflowId: null }),
        showToast(workflowText('deleted'), 'success'));
    } catch (_0xbbe092) {
      showToast(_0xbbe092?.message || workflowText('deleteFailed'), 'error');
    }
  }
  ['openCreateModal'](_0x26ba33 = null) {
    (workspaceStore.openWorkflowModal({ tab: 'create', sourceGroupId: _0x26ba33 }),
      this.resetCreateDraftFromCurrentSource(),
      this.renderModal());
  }
  ['openUpdateModal'](_0x292517, { metaOnly: metaOnly = false } = {}) {
    (workspaceStore.openWorkflowModal({ tab: 'update', sourceGroupId: null }),
      workspaceStore.setWorkflowUi({ updateMetaOnly: metaOnly === true }),
      this.selectUpdateTarget(_0x292517, { render: false }),
      this.renderModal());
  }
  ['resetCreateDraftFromCurrentSource']() {
    const _0x537ad8 = this.getWorkflowSourceCanvasState(),
      _0x2b6478 = this.getWorkflowSourceContext(),
      _0x513871 = buildWorkflowSourceSummary(_0x537ad8, _0x2b6478),
      _0x49e91d = this.getCoverCandidates(null, _0x537ad8)[0] || getDefaultWorkflowCoverCandidate();
    workspaceStore.resetWorkflowDraft({
      name: _0x513871.isEmpty ? '' : _0x513871.suggestedName,
      tags: _0x513871.isEmpty ? [] : _0x513871.suggestedTags,
      cover: _0x49e91d.src || '',
      selectedCoverId: _0x49e91d.id,
    });
  }
  ['closeModal']() {
    (workspaceStore.closeWorkflowModal(), this.renderModal());
  }
  ['getWorkflowSourceCanvasState']() {
    const _0x1987f5 = getState(),
      _0x14a468 = getStateRaw();
    return sliceCanvasStateForWorkflow(
      graphStore.serialize(),
      _0x14a468?.nodes || {},
      _0x1987f5.workflowUi?.sourceGroupId,
    );
  }
  ['getWorkflowSourceContext']() {
    const _0xdc5fa7 = getState(),
      _0x2f124a = getStateRaw(),
      _0x2cafed = cleanText(_0xdc5fa7.workflowUi?.sourceGroupId),
      _0x331c9c = _0x2cafed ? _0x2f124a?.nodes?.[_0x2cafed] : null;
    return {
      sourceGroupId: _0x2cafed || '',
      sourceLabel: _0x2cafed ? workflowText('source.currentGroup') : workflowText('source.wholeCanvas'),
      sourceName: cleanText(_0x331c9c?.name || _0x331c9c?.title || _0x331c9c?.label),
    };
  }
  ['getWorkflowSourceSummary'](_0x1ec41b = this.getWorkflowSourceCanvasState(), _0x4b1d02 = {}) {
    return buildWorkflowSourceSummary(_0x1ec41b, { ...this.getWorkflowSourceContext(), ..._0x4b1d02 });
  }
  ['getCoverCandidates'](_0x153268 = null, _0xf182bc = this.getWorkflowSourceCanvasState()) {
    const _0x465409 = createWorkflowSnapshotCoverCandidate(_0xf182bc),
      _0x401aa8 = extractWorkflowCoverCandidates(_0xf182bc?.nodes),
      _0x3c7327 = [];
    if (_0x153268?.src) _0x3c7327.push(_0x153268);
    if (_0x465409?.src) _0x3c7327.push(_0x465409);
    _0x3c7327.push(..._0x401aa8);
    if (_0x3c7327.length === 0) _0x3c7327.push(getDefaultWorkflowCoverCandidate());
    const _0x5a1ae1 = new Set();
    return _0x3c7327.filter((_0x41ef90) => {
      const _0x3631c2 = _0x41ef90.src || _0x41ef90.id;
      if (_0x5a1ae1.has(_0x3631c2)) return false;
      return (_0x5a1ae1.add(_0x3631c2), true);
    });
  }
  ['getUpdateCoverCandidates'](_0x5c57b3, _0x1d8691 = null) {
    const _0x35d4e2 = getState().workflowUi || {};
    if (_0x35d4e2.updateMetaOnly && _0x5c57b3?.workflowData)
      return this.getCoverCandidates(_0x1d8691, _0x5c57b3.workflowData);
    return this.getCoverCandidates(_0x1d8691);
  }
  ['renderModal']() {
    if (!this.modal || !this.modalBody) return;
    const _0x46734a = getState(),
      _0x3d86db = _0x46734a.workflowUi || {};
    (this.modal.classList.toggle('show', _0x3d86db.modalOpen === true),
      this.modal.setAttribute('aria-hidden', _0x3d86db.modalOpen === true ? 'false' : 'true'));
    if (!_0x3d86db.modalOpen) {
      this.modalBody.replaceChildren();
      return;
    }
    for (const _0x50ff9c of this.modal.querySelectorAll('.v2-workflow-modal-tab')) {
      _0x50ff9c.classList.toggle('active', _0x50ff9c.dataset.modalTab === (_0x3d86db.modalTab || 'create'));
    }
    const _0x5e0081 =
      _0x3d86db.modalTab === 'update' && !WORKFLOW_UPDATE_ENTRY_ENABLED ? 'create' : _0x3d86db.modalTab;
    (this.modalTitleTextEl &&
      (this.modalTitleTextEl.textContent =
        _0x5e0081 === 'update'
          ? _0x3d86db.updateMetaOnly
            ? workflowText('modal.editMetaTitle')
            : workflowText('modal.updateTitle')
          : workflowText('modal.createTitle')),
      this.modalBody.replaceChildren(),
      _0x5e0081 === 'update' ? this.renderUpdateForm() : this.renderCreateForm());
  }
  ['renderCreateForm']() {
    const _0x33a554 = getState(),
      _0x5eb2cb = _0x33a554.workflowUi || {},
      _0x460a0c = this.getWorkflowSourceCanvasState(),
      _0x5bef62 = this.getWorkflowSourceSummary(_0x460a0c),
      _0x5ef41a = el('div', 'v2-workflow-create-layout');
    _0x5ef41a.appendChild(this.renderWorkflowSourcePanel(_0x5bef62));
    const _0x2ad205 = this.renderWorkflowMetaForm({
      mode: 'create',
      candidates: this.getCoverCandidates(null, _0x460a0c),
      sourceSummary: _0x5bef62,
      submitText: _0x5eb2cb.saving ? workflowText('saving') : workflowText('createConfirm'),
    });
    (_0x5ef41a.appendChild(_0x2ad205), this.modalBody.appendChild(_0x5ef41a));
  }
  ['renderUpdateForm']() {
    const _0x27d934 = getState(),
      _0x4c4bb0 = _0x27d934.workflowUi || {},
      _0x5c6156 = filterWorkflows(_0x27d934.workflows?.items || [], _0x4c4bb0.updateSearchKeyword || ''),
      _0xf69a74 = el('div', 'v2-workflow-create-layout v2-workflow-update-layout'),
      _0x3f4c2a = el('section', 'v2-workflow-update-picker v2-workflow-source-panel'),
      _0x55846 = el('div', 'v2-workflow-source-header');
    (_0x55846.appendChild(el('div', 'v2-workflow-source-title', workflowText('updatePicker.title'))),
      _0x55846.appendChild(
        el(
          'div',
          'v2-workflow-source-scope',
          workflowText('updatePicker.resultCount', { count: _0x5c6156.length }),
        ),
      ),
      _0x3f4c2a.appendChild(_0x55846));
    const _0x535cd5 = el('input', 'v2-workflow-search-input');
    ((_0x535cd5.type = 'search'),
      (_0x535cd5.placeholder = workflowText('updatePicker.searchPlaceholder')),
      (_0x535cd5.value = _0x4c4bb0.updateSearchKeyword || ''),
      (_0x535cd5.dataset.role = 'workflow-update-search'),
      _0x3f4c2a.appendChild(_0x535cd5));
    const _0xe82147 = el('div', 'v2-workflow-update-list');
    if (_0x5c6156.length === 0) {
      const _0x4c445a = el('div', 'v2-workflow-source-empty');
      ((_0x4c445a.textContent = cleanText(_0x4c4bb0.updateSearchKeyword)
        ? workflowText('empty.noMatches')
        : workflowText('empty.noWorkflows')),
        _0xe82147.appendChild(_0x4c445a));
    } else
      for (const _0x480e46 of _0x5c6156) {
        const _0x40c592 = el('button', 'v2-workflow-update-item');
        ((_0x40c592.type = 'button'),
          (_0x40c592.dataset.action = 'workflow-update-select'),
          (_0x40c592.dataset.workflowId = _0x480e46.id),
          _0x40c592.classList.toggle('active', _0x4c4bb0.updateTargetId === _0x480e46.id),
          _0x40c592.append(this.renderCover(_0x480e46.cover, 'v2-workflow-update-thumb')));
        const _0x60b3ce = el('div', 'v2-workflow-update-info');
        (_0x60b3ce.append(
          el('span', '', _0x480e46.name),
          el('small', '', formatDateTime(_0x480e46.updatedAt)),
        ),
          _0x40c592.appendChild(_0x60b3ce),
          _0xe82147.appendChild(_0x40c592));
      }
    (_0x3f4c2a.appendChild(_0xe82147), _0xf69a74.appendChild(_0x3f4c2a));
    const _0x3182c6 = findWorkflowById(_0x27d934.workflows?.items || [], _0x4c4bb0.updateTargetId),
      _0x1bc170 = el('div', 'v2-workflow-update-editor');
    if (_0x3182c6) {
      const _0x3e9d52 = this.getWorkflowSourceCanvasState(),
        _0x180d0c = this.getWorkflowSourceSummary(_0x3e9d52),
        _0x2b2739 = buildWorkflowSourceSummary(_0x3182c6.workflowData, {
          sourceLabel: workflowText('source.historyWorkflow'),
          sourceName: _0x3182c6.name,
        }),
        _0x998051 =
          _0x3182c6.cover && _0x4c4bb0.draft?.cover === _0x3182c6.cover
            ? {
                id: 'existing-' + _0x3182c6.id,
                src: _0x3182c6.cover,
                nodeId: '',
                label: workflowText('currentCover'),
              }
            : null;
      _0x1bc170.appendChild(
        this.renderWorkflowMetaForm({
          mode: 'update',
          target: _0x3182c6,
          candidates: this.getUpdateCoverCandidates(_0x3182c6, _0x998051),
          sourceSummary: _0x4c4bb0.updateMetaOnly ? null : _0x180d0c,
          submitText: _0x4c4bb0.saving
            ? workflowText('updating')
            : _0x4c4bb0.updateMetaOnly
              ? workflowText('saveMeta')
              : _0x4c4bb0.updateConfirmOpen
                ? workflowText('confirmOverwrite')
                : workflowText('updateConfirm'),
        }),
      );
    } else
      _0x1bc170.appendChild(
        this.renderWorkflowMetaForm({
          mode: 'update',
          candidates: [getDefaultWorkflowCoverCandidate()],
          submitText: workflowText('updateConfirm'),
          disabled: true,
        }),
      );
    (_0xf69a74.appendChild(_0x1bc170), this.modalBody.appendChild(_0xf69a74));
  }
  ['renderWorkflowSourcePanel'](_0x3e0e87, { title: title = workflowText('source.savingContent') } = {}) {
    const _0x9c0b1e = el('section', 'v2-workflow-source-panel'),
      _0x5e61a7 = el('div', 'v2-workflow-source-header');
    _0x5e61a7.appendChild(el('div', 'v2-workflow-source-title', title));
    const _0x3cb13d = el(
      'div',
      'v2-workflow-source-scope',
      _0x3e0e87.sourceLabel || workflowText('source.wholeCanvas'),
    );
    if (_0x3e0e87.sourceName) _0x3cb13d.appendChild(el('span', '', ' · ' + _0x3e0e87.sourceName));
    (_0x5e61a7.appendChild(_0x3cb13d), _0x9c0b1e.appendChild(_0x5e61a7));
    if (_0x3e0e87.isEmpty) {
      const _0x834385 = el('div', 'v2-workflow-source-empty');
      return (
        (_0x834385.textContent =
          _0x3e0e87.sourceGroupId || _0x3e0e87.sourceLabel === workflowText('source.currentGroup')
            ? workflowText('empty.noGroupNodes')
            : workflowText('empty.noCanvasNodes')),
        _0x9c0b1e.appendChild(_0x834385),
        _0x9c0b1e
      );
    }
    if (_0x3e0e87.typeCounts.length > 0) {
      const _0x5246ed = el('div', 'v2-workflow-source-types');
      for (const _0x14fe7c of _0x3e0e87.typeCounts.slice(0, 6)) {
        _0x5246ed.appendChild(el('span', 'v2-workflow-source-type', _0x14fe7c.label + ' ' + _0x14fe7c.count));
      }
      _0x9c0b1e.appendChild(_0x5246ed);
    }
    const _0x38e543 = _0x3e0e87.previewItems.slice(0, 4);
    if (_0x38e543.length > 0) {
      const _0x440105 = el('div', 'v2-workflow-source-preview');
      for (const _0x4645bc of _0x38e543) {
        _0x440105.appendChild(this.renderWorkflowContentItem(_0x4645bc));
      }
      (_0x3e0e87.previewItems.length > _0x38e543.length &&
        _0x440105.appendChild(
          el(
            'div',
            'v2-workflow-source-more',
            workflowText('source.moreNodes', { count: _0x3e0e87.previewItems.length - _0x38e543.length }),
          ),
        ),
        _0x9c0b1e.appendChild(_0x440105));
    }
    return _0x9c0b1e;
  }
  ['renderWorkflowMetaForm']({
    mode: _0x2a188c,
    candidates: _0x5d1725,
    submitText: _0x2525a6,
    sourceSummary: sourceSummary = null,
    disabled: disabled = false,
  }) {
    const _0x52e140 = getState().workflowUi || {},
      _0x10db62 = _0x52e140.draft || {},
      _0x4c5b84 = _0x2a188c === 'create' || (_0x2a188c === 'update' && !_0x52e140.updateMetaOnly),
      _0x4613f6 = _0x4c5b84 && sourceSummary?.isEmpty,
      _0x3d76a5 = el('div', 'v2-workflow-form');
    ((_0x3d76a5.dataset.workflowForm = _0x2a188c),
      _0x3d76a5.classList.toggle('is-disabled', disabled === true));
    const _0x1bd46a = el('div', 'v2-workflow-cover-row');
    _0x1bd46a.appendChild(this.renderCover(_0x10db62.cover, 'v2-workflow-form-cover'));
    const _0xb9b463 = el('div', 'v2-workflow-cover-choices');
    for (const _0x26edf9 of _0x5d1725) {
      const _0x4c1f67 = el('button', 'v2-workflow-cover-choice');
      ((_0x4c1f67.type = 'button'),
        (_0x4c1f67.dataset.action = 'workflow-cover-select'),
        (_0x4c1f67.dataset.coverId = _0x26edf9.id),
        (_0x4c1f67.dataset.coverSrc = _0x26edf9.src || ''),
        _0x4c1f67.classList.toggle('active', _0x26edf9.id === _0x10db62.selectedCoverId),
        (_0x4c1f67.title = _0x26edf9.label),
        _0x4c1f67.appendChild(this.renderCover(_0x26edf9.src, 'v2-workflow-cover-choice-img')),
        _0xb9b463.appendChild(_0x4c1f67));
    }
    (_0x1bd46a.appendChild(_0xb9b463),
      _0x3d76a5.appendChild(_0x1bd46a),
      _0x3d76a5.appendChild(
        this.renderTextField(
          workflowText('name'),
          'workflow-draft-name',
          _0x10db62.name || '',
          WORKFLOW_LIMITS.nameMax,
        ),
      ),
      _0x3d76a5.appendChild(this.renderTagsField(_0x10db62.tags || [])),
      _0x3d76a5.appendChild(this.renderNoteField(_0x10db62.note || '')));
    const _0x2b3d14 = el('div', 'v2-workflow-form-error');
    _0x2b3d14.dataset.role = 'workflow-form-error';
    if (_0x52e140.error) _0x2b3d14.textContent = _0x52e140.error;
    _0x3d76a5.appendChild(_0x2b3d14);
    const _0x306c1a = el('div', 'v2-workflow-form-footer'),
      _0xb4edb4 = el('button', 'v2-workflow-secondary-btn', workflowText('cancel'));
    ((_0xb4edb4.type = 'button'), (_0xb4edb4.dataset.action = 'workflow-modal-close'));
    const _0x522f95 = el('button', 'v2-workflow-primary-btn', _0x2525a6);
    return (
      (_0x522f95.type = 'button'),
      (_0x522f95.dataset.action =
        _0x2a188c === 'update' ? 'workflow-update-submit' : 'workflow-create-submit'),
      (_0x522f95.disabled =
        disabled === true || _0x52e140.saving === true || !cleanText(_0x10db62.name) || _0x4613f6),
      _0x306c1a.append(_0xb4edb4, _0x522f95),
      _0x3d76a5.appendChild(_0x306c1a),
      _0x3d76a5
    );
  }
  ['renderTextField'](_0x2df733, _0x2264e8, _0x64250b, _0x208dae) {
    const _0x5e03b2 = el('label', 'v2-workflow-field');
    _0x5e03b2.appendChild(el('span', '', _0x2df733));
    const _0x4f1ff3 = el('input', 'v2-workflow-input');
    return (
      (_0x4f1ff3.type = 'text'),
      (_0x4f1ff3.value = _0x64250b || ''),
      (_0x4f1ff3.maxLength = _0x208dae),
      (_0x4f1ff3.dataset.role = _0x2264e8),
      _0x5e03b2.appendChild(_0x4f1ff3),
      _0x5e03b2
    );
  }
  ['renderNoteField'](_0x14014a) {
    const _0x56354f = el('label', 'v2-workflow-field v2-workflow-note-field');
    _0x56354f.appendChild(el('span', '', workflowText('note')));
    const _0x458cfe = el('textarea', 'v2-workflow-textarea');
    return (
      (_0x458cfe.maxLength = WORKFLOW_LIMITS.noteMax),
      (_0x458cfe.value = _0x14014a || ''),
      (_0x458cfe.dataset.role = 'workflow-draft-note'),
      (_0x458cfe.placeholder = workflowText('notePlaceholder')),
      _0x56354f.appendChild(_0x458cfe),
      _0x56354f
    );
  }
  ['renderTagsField'](_0x32a1d9) {
    const _0x4a7ad6 = el('div', 'v2-workflow-field');
    _0x4a7ad6.appendChild(el('span', '', workflowText('tags')));
    const _0x4c4769 = el('div', 'v2-workflow-tag-editor');
    for (const _0x5bcd6d of _0x32a1d9) {
      const _0x320b06 = el('span', 'v2-workflow-tag-chip');
      _0x320b06.appendChild(document.createTextNode(_0x5bcd6d));
      const _0xcd43cf = el('button', '', '×');
      ((_0xcd43cf.type = 'button'),
        (_0xcd43cf.dataset.action = 'workflow-tag-remove'),
        (_0xcd43cf.dataset.tag = _0x5bcd6d),
        _0x320b06.appendChild(_0xcd43cf),
        _0x4c4769.appendChild(_0x320b06));
    }
    const _0xc41af7 = el('div', 'v2-workflow-tag-input-row'),
      _0x9361ff = el('input', 'v2-workflow-input v2-workflow-tag-input');
    ((_0x9361ff.type = 'text'),
      (_0x9361ff.maxLength = WORKFLOW_LIMITS.tagLengthMax),
      (_0x9361ff.placeholder =
        _0x32a1d9.length >= WORKFLOW_LIMITS.tagMax
          ? workflowText('tagLimitReached')
          : workflowText('addTagPlaceholder')),
      (_0x9361ff.disabled = _0x32a1d9.length >= WORKFLOW_LIMITS.tagMax),
      (_0x9361ff.value = getState().workflowUi?.tagDraft || ''),
      (_0x9361ff.dataset.role = 'workflow-tag-draft'));
    const _0x3512ce = el(
      'button',
      'v2-workflow-secondary-btn v2-workflow-tag-add-btn',
      workflowText('addTag'),
    );
    return (
      (_0x3512ce.type = 'button'),
      (_0x3512ce.dataset.action = 'workflow-tag-add'),
      (_0x3512ce.disabled = _0x32a1d9.length >= WORKFLOW_LIMITS.tagMax),
      _0xc41af7.append(_0x9361ff, _0x3512ce),
      _0x4a7ad6.append(_0x4c4769, _0xc41af7),
      _0x4a7ad6
    );
  }
  ['handleModalKeydown'](_0x297f2a) {
    if (_0x297f2a.key === 'Escape') {
      this.closeModal();
      return;
    }
    if (_0x297f2a.key !== 'Enter') return;
    const _0x345286 = _0x297f2a.target?.dataset?.role;
    if (_0x345286 !== 'workflow-tag-draft') return;
    (_0x297f2a.preventDefault(), this.addDraftTag());
  }
  ['handleModalInput'](_0xc4d938) {
    const _0x57a900 = _0xc4d938.target,
      _0x12abf5 = _0x57a900?.dataset?.role;
    if (!_0x12abf5) return;
    if (_0x12abf5 === 'workflow-draft-name')
      (workspaceStore.setWorkflowDraft({ name: _0x57a900.value || '' }), this.updateSubmitDisabled());
    else {
      if (_0x12abf5 === 'workflow-draft-note')
        workspaceStore.setWorkflowDraft({ note: _0x57a900.value || '' });
      else {
        if (_0x12abf5 === 'workflow-tag-draft')
          workspaceStore.setWorkflowUi({ tagDraft: _0x57a900.value || '' });
        else
          _0x12abf5 === 'workflow-update-search' &&
            (workspaceStore.setWorkflowUi({
              updateSearchKeyword: _0x57a900.value || '',
              updateConfirmOpen: false,
            }),
            this.renderModal());
      }
    }
  }
  ['handleModalClick'](_0xd9d83c) {
    const _0x48ad84 = _0xd9d83c.target.closest('.v2-workflow-modal-tab');
    if (_0x48ad84?.dataset?.modalTab) {
      workspaceStore.setWorkflowUi({
        modalTab: _0x48ad84.dataset.modalTab,
        updateConfirmOpen: false,
        updateMetaOnly: false,
        error: null,
      });
      _0x48ad84.dataset.modalTab === 'create' && this.resetCreateDraftFromCurrentSource();
      this.renderModal();
      return;
    }
    const _0x477cd6 = _0xd9d83c.target.closest('[data-action]'),
      _0x2414ce = _0x477cd6?.dataset?.action;
    if (!_0x2414ce) return;
    if (_0x2414ce === 'workflow-cover-select') {
      const _0x5d35c0 = _0x477cd6.dataset.coverId,
        _0x145d46 = _0x5d35c0 === DEFAULT_WORKFLOW_COVER_ID ? '' : _0x477cd6.dataset.coverSrc || '';
      (workspaceStore.setWorkflowDraft({ selectedCoverId: _0x5d35c0, cover: _0x145d46 }),
        workspaceStore.setWorkflowUi({ updateConfirmOpen: false }),
        this.updateCoverSelectionUi(_0x5d35c0, _0x145d46));
      return;
    }
    if (_0x2414ce === 'workflow-tag-add') {
      this.addDraftTag();
      return;
    }
    if (_0x2414ce === 'workflow-tag-remove') {
      this.removeDraftTag(_0x477cd6.dataset.tag);
      return;
    }
    if (_0x2414ce === 'workflow-create-submit') {
      this.submitCreate();
      return;
    }
    if (_0x2414ce === 'workflow-update-select') {
      this.selectUpdateTarget(_0x477cd6.dataset.workflowId);
      return;
    }
    _0x2414ce === 'workflow-update-submit' && this.submitUpdate();
  }
  ['updateSubmitDisabled']() {
    const _0x2b99be = this.modalBody?.querySelector(
      "[data-action='workflow-create-submit'], [data-action='workflow-update-submit']",
    );
    if (_0x2b99be) {
      const _0x140cd0 = getState().workflowUi || {},
        _0xfd85c6 =
          _0x140cd0.modalTab === 'create' || (_0x140cd0.modalTab === 'update' && !_0x140cd0.updateMetaOnly),
        _0x30dbae = _0xfd85c6 && this.getWorkflowSourceSummary(this.getWorkflowSourceCanvasState()).isEmpty;
      _0x2b99be.disabled = _0x140cd0.saving === true || !cleanText(_0x140cd0.draft?.name) || _0x30dbae;
    }
  }
  ['updateCoverSelectionUi'](_0x278b34, _0x20c6df) {
    if (!this.modalBody) return;
    const _0x51d036 = cleanText(_0x278b34);
    for (const _0x37b333 of this.modalBody.querySelectorAll('.v2-workflow-cover-choice')) {
      _0x37b333.classList.toggle('active', _0x37b333.dataset.coverId === _0x51d036);
    }
    const _0xad4f4 = this.modalBody.querySelector('.v2-workflow-form-cover');
    if (!_0xad4f4?.parentNode) return;
    _0xad4f4.replaceWith(this.renderCover(_0x20c6df, 'v2-workflow-form-cover'));
  }
  ['setFormError'](_0x5c6c5d) {
    workspaceStore.setWorkflowUi({ error: _0x5c6c5d || null });
    const _0x20d90d = this.modalBody?.querySelector("[data-role='workflow-form-error']");
    if (_0x20d90d) _0x20d90d.textContent = _0x5c6c5d || '';
  }
  ['addDraftTag']() {
    const _0x216fc9 = getState().workflowUi || {},
      _0x355837 = cleanText(_0x216fc9.tagDraft).slice(0, WORKFLOW_LIMITS.tagLengthMax);
    if (!_0x355837) return;
    const _0x4ee6eb = normalizeWorkflowTags([...(_0x216fc9.draft?.tags || []), _0x355837]);
    if ((_0x216fc9.draft?.tags || []).length >= WORKFLOW_LIMITS.tagMax) {
      this.setFormError(workflowText('errors.tagLimit', { limit: WORKFLOW_LIMITS.tagMax }));
      return;
    }
    if (_0x4ee6eb.length === (_0x216fc9.draft?.tags || []).length) {
      this.setFormError(workflowText('errors.tagExists'));
      return;
    }
    (workspaceStore.setWorkflowDraft({ tags: _0x4ee6eb }),
      workspaceStore.setWorkflowUi({ tagDraft: '', updateConfirmOpen: false, error: null }),
      this.renderModal());
  }
  ['removeDraftTag'](_0x53b662) {
    const _0x2bc3c7 = getState().workflowUi || {},
      _0x436840 = cleanText(_0x53b662).toLowerCase(),
      _0x5a2806 = (_0x2bc3c7.draft?.tags || []).filter(
        (_0x2885cc) => cleanText(_0x2885cc).toLowerCase() !== _0x436840,
      );
    (workspaceStore.setWorkflowDraft({ tags: _0x5a2806 }),
      workspaceStore.setWorkflowUi({ updateConfirmOpen: false, error: null }),
      this.renderModal());
  }
  ['selectUpdateTarget'](_0x5e8665, { render: render = true } = {}) {
    const _0x3da574 = findWorkflowById(getState().workflows?.items || [], _0x5e8665);
    if (!_0x3da574) return;
    const _0x4e00c4 = getState().workflowUi || {},
      _0x521e0c = _0x3da574.cover
        ? {
            id: 'existing-' + _0x3da574.id,
            src: _0x3da574.cover,
            nodeId: '',
            label: workflowText('currentCover'),
          }
        : null,
      _0x5871d2 =
        this.getUpdateCoverCandidates(_0x3da574, _0x4e00c4.updateMetaOnly ? _0x521e0c : null)[0] ||
        getDefaultWorkflowCoverCandidate(),
      _0x2e6eef = _0x3da574.cover ? 'existing-' + _0x3da574.id : _0x5871d2.id;
    (workspaceStore.setWorkflowUi({
      updateTargetId: _0x3da574.id,
      updateConfirmOpen: false,
      tagDraft: '',
      error: null,
    }),
      workspaceStore.setWorkflowDraft({
        name: _0x3da574.name,
        cover: _0x3da574.cover || _0x5871d2.src || '',
        tags: _0x3da574.tags || [],
        note: _0x3da574.note || '',
        selectedCoverId: _0x2e6eef,
      }));
    if (render) this.renderModal();
  }
  async ['submitCreate']() {
    const _0x5a3be8 = getState().workflowUi || {};
    if (_0x5a3be8.saving) return;
    const _0x5a84e4 = _0x5a3be8.draft || {};
    if (!cleanText(_0x5a84e4.name)) {
      this.setFormError(workflowText('errors.nameRequired'));
      return;
    }
    const _0x55412b = this.getWorkflowSourceCanvasState();
    if (!Array.isArray(_0x55412b.nodes) || _0x55412b.nodes.length === 0) {
      this.setFormError(
        _0x5a3be8.sourceGroupId ? workflowText('empty.noGroupNodes') : workflowText('empty.noCanvasNodes'),
      );
      return;
    }
    (workspaceStore.setWorkflowSaving(true), this.renderModal());
    try {
      const _0xe49321 = await saveNewWorkflowFromCanvas(_0x55412b, _0x5a84e4),
        _0x1fa68a = this.modalBody?.querySelector('.v2-workflow-form-cover');
      (workspaceStore.upsertWorkflow(_0xe49321),
        playWorkflowSaveFly({ sourceEl: _0x1fa68a }),
        workspaceStore.closeWorkflowModal(),
        this.renderModal(),
        showToast(workflowText('created'), 'success'));
    } catch (_0x5ad18d) {
      (workspaceStore.setWorkflowSaving(false),
        this.setFormError(_0x5ad18d?.message || workflowText('saveFailed')),
        this.renderModal(),
        showToast(workflowText('saveFailed'), 'error'));
    }
  }
  async ['submitUpdate']() {
    const _0x555a4c = getState(),
      _0x1ccaf5 = _0x555a4c.workflowUi || {};
    if (_0x1ccaf5.saving) return;
    const _0x4ba744 = findWorkflowById(_0x555a4c.workflows?.items || [], _0x1ccaf5.updateTargetId);
    if (!_0x4ba744) {
      this.setFormError(workflowText('errors.selectWorkflowToUpdate'));
      return;
    }
    if (!cleanText(_0x1ccaf5.draft?.name)) {
      this.setFormError(workflowText('errors.nameRequired'));
      return;
    }
    if (_0x1ccaf5.updateMetaOnly) {
      (workspaceStore.setWorkflowSaving(true), this.renderModal());
      try {
        const _0x49e561 = await saveWorkflowMeta(_0x4ba744, _0x1ccaf5.draft || {}),
          _0x4bd4f6 = this.modalBody?.querySelector('.v2-workflow-form-cover');
        (workspaceStore.upsertWorkflow(_0x49e561),
          playWorkflowSaveFly({ sourceEl: _0x4bd4f6 }),
          workspaceStore.closeWorkflowModal(),
          this.renderModal(),
          showToast(workflowText('metaSaved'), 'success'));
      } catch (_0x1469c6) {
        (workspaceStore.setWorkflowSaving(false),
          this.setFormError(_0x1469c6?.message || workflowText('metaSaveFailed')),
          this.renderModal(),
          showToast(workflowText('metaSaveFailed'), 'error'));
      }
      return;
    }
    const _0x24035d = this.getWorkflowSourceCanvasState();
    if (!Array.isArray(_0x24035d.nodes) || _0x24035d.nodes.length === 0) {
      this.setFormError(
        _0x1ccaf5.sourceGroupId ? workflowText('empty.noGroupNodes') : workflowText('empty.noCanvasNodes'),
      );
      return;
    }
    if (!_0x1ccaf5.updateConfirmOpen) {
      (workspaceStore.setWorkflowUi({ updateConfirmOpen: true, error: null }), this.renderModal());
      return;
    }
    (workspaceStore.setWorkflowSaving(true), this.renderModal());
    try {
      const _0x154404 = await saveUpdatedWorkflowFromCanvas(_0x4ba744.id, _0x24035d, {
          ...(_0x1ccaf5.draft || {}),
          existingWorkflow: _0x4ba744,
        }),
        _0x214ea5 = this.modalBody?.querySelector('.v2-workflow-form-cover');
      (workspaceStore.upsertWorkflow(_0x154404),
        playWorkflowSaveFly({ sourceEl: _0x214ea5 }),
        workspaceStore.closeWorkflowModal(),
        this.renderModal(),
        showToast(workflowText('updated'), 'success'));
    } catch (_0xf8ccd5) {
      (workspaceStore.setWorkflowSaving(false),
        this.setFormError(_0xf8ccd5?.message || workflowText('updateFailed')),
        this.renderModal(),
        showToast(workflowText('updateFailed'), 'error'));
    }
  }
  ['getCanvasCenterWorld']() {
    const { viewport: _0x1785b6 } = getState(),
      _0x24e5bf = window.innerWidth / 2,
      _0x29ced8 = window.innerHeight / 2,
      _0x3c6c3c = document.documentElement?.clientWidth || window.innerWidth || 0,
      _0x3afb23 = document.documentElement?.clientHeight || window.innerHeight || 0;
    if (!_0x3c6c3c || !_0x3afb23) return screenToWorld(_0x24e5bf, _0x29ced8, _0x1785b6);
    let _0x3f4952 = 0,
      _0x2b02f0 = 0,
      _0x2b62c6 = _0x3c6c3c,
      _0x4af100 = _0x3afb23;
    const _0x5c9226 = [],
      _0x146592 = document.querySelector('header');
    if (_0x146592) _0x5c9226.push(_0x146592);
    const _0x356a88 = document.querySelector('.sidebar-floating');
    if (_0x356a88) _0x5c9226.push(_0x356a88);
    this.sidebarPanel?.classList?.contains('show') && _0x5c9226.push(this.sidebarPanel);
    const _0x53b462 = 8;
    for (const _0x5c9d72 of _0x5c9226) {
      if (!_0x5c9d72?.isConnected) continue;
      const _0x32d372 = _0x5c9d72.getBoundingClientRect(),
        _0xd6c015 = Math.max(_0x3f4952, _0x32d372.left),
        _0x25715c = Math.max(_0x2b02f0, _0x32d372.top),
        _0x156abe = Math.min(_0x2b62c6, _0x32d372.right),
        _0x5a1842 = Math.min(_0x4af100, _0x32d372.bottom);
      if (_0x156abe <= _0xd6c015 || _0x5a1842 <= _0x25715c) continue;
      if (_0x32d372.left <= _0x3f4952 + _0x53b462 && _0x32d372.right > _0x3f4952 + _0x53b462) {
        _0x3f4952 = Math.max(_0x3f4952, _0x32d372.right);
        continue;
      }
      if (_0x32d372.right >= _0x2b62c6 - _0x53b462 && _0x32d372.left < _0x2b62c6 - _0x53b462) {
        _0x2b62c6 = Math.min(_0x2b62c6, _0x32d372.left);
        continue;
      }
      if (_0x32d372.top <= _0x2b02f0 + _0x53b462 && _0x32d372.bottom > _0x2b02f0 + _0x53b462) {
        _0x2b02f0 = Math.max(_0x2b02f0, _0x32d372.bottom);
        continue;
      }
      _0x32d372.bottom >= _0x4af100 - _0x53b462 &&
        _0x32d372.top < _0x4af100 - _0x53b462 &&
        (_0x4af100 = Math.min(_0x4af100, _0x32d372.top));
    }
    const _0x4a6cc1 = _0x2b62c6 - _0x3f4952,
      _0x393e8e = _0x4af100 - _0x2b02f0,
      _0x2ccff1 = _0x4a6cc1 > 40 ? _0x3f4952 + _0x4a6cc1 / 2 : _0x24e5bf,
      _0x4bc4b8 = _0x393e8e > 40 ? _0x2b02f0 + _0x393e8e / 2 : _0x29ced8;
    return screenToWorld(_0x2ccff1, _0x4bc4b8, _0x1785b6);
  }
  async ['applyWorkflow'](_0x165f9f) {
    const _0x35e004 = getState(),
      _0xa49cd1 = _0x35e004.workflowUi || {};
    if (_0xa49cd1.applyingWorkflowId) return;
    const _0x412989 = findWorkflowById(_0x35e004.workflows?.items || [], _0x165f9f);
    if (!_0x412989) {
      showToast(workflowText('workflowMissing'), 'error');
      return;
    }
    workspaceStore.setWorkflowApplying(_0x412989.id);
    try {
      const _0x500a93 = applyWorkflowToCanvas(_0x412989, this.getCanvasCenterWorld());
      if (_0x500a93.nodes.length === 0) {
        showToast(workflowText('empty.noApplicableNodes'), 'warn');
        return;
      }
      (graphStore.batch(() => {
        for (const _0x445bcc of _0x500a93.nodes) {
          graphStore.addNode(_0x445bcc);
        }
        for (const _0x16b177 of _0x500a93.edges) {
          graphStore.addEdge(_0x16b177);
        }
        graphStore.setSelectedNodes(_0x500a93.nodes.map((_0x9da46f) => _0x9da46f.id));
      }),
        commit());
      const _0x57a260 = Date.now();
      (workspaceStore.markWorkflowUsed(_0x412989.id, _0x57a260),
        saveWorkflowUsage({ ..._0x412989, lastUsedAt: _0x57a260 }, _0x57a260).catch(() => {}),
        showToast(workflowText('applied'), 'success'));
    } catch (_0x3fcb99) {
      showToast(_0x3fcb99?.message || workflowText('applyFailed'), 'error');
    } finally {
      workspaceStore.setWorkflowApplying(null);
    }
  }
}
export const workflowManager = new WorkflowManager();
