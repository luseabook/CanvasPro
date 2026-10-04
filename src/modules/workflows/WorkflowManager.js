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
function el(value, item = '', key = '') {
  const el2 = document.createElement(value);
  if (item) el2.className = item;
  if (key) el2.textContent = key;
  return el2;
}
function cleanText(index) {
  return String(index ?? '').trim();
}
function workflowText(result, data = {}) {
  return t('workflows.manager.' + result, data);
}
function formatDateTime(options) {
  const count = Number(options);
  if (!Number.isFinite(count) || count <= 0) return workflowText('unknown');
  return new Date(count).toLocaleString(getLocale(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
function formatShortDate(target) {
  const count2 = Number(target);
  if (!Number.isFinite(count2) || count2 <= 0) return workflowText('unknown');
  return new Date(count2).toLocaleDateString(getLocale(), { month: '2-digit', day: '2-digit' });
}
function formatWorkflowMetaLine(source) {
  const nodeCount = Number(source?.nodeCount || source?.workflowData?.nodes?.length || 0) || 0,
    edgeCount = Number(source?.edgeCount || source?.workflowData?.edges?.length || 0) || 0,
    count3 = Number(source?.lastUsedAt || 0) || 0,
    next = Number(source?.updatedAt || 0) || 0,
    time =
      count3 > 0
        ? workflowText('meta.used', { date: formatShortDate(count3) })
        : workflowText('meta.updated', { date: formatShortDate(next) });
  return workflowText('meta.line', { nodeCount: nodeCount, edgeCount: edgeCount, time: time });
}
function showToast(current, entry = 'info') {
  window.showToast?.(current, entry);
}
function appendCoverPlaceholder(enabled, record = 'updream canvas') {
  if (!enabled) return;
  enabled.replaceChildren(el('div', 'v2-workflow-cover-placeholder', record));
}
const WORKFLOW_UPDATE_ENTRY_ENABLED = false,
  WORKFLOW_MODAL_TABS_ENABLED = WORKFLOW_UPDATE_ENTRY_ENABLED;
function buildWorkflowListRenderKey(list = []) {
  if (!Array.isArray(list)) return '';
  return list
    .map((error) => {
      const payload = Array.isArray(error?.tags) ? error.tags.map(cleanText).filter(Boolean).join(',') : '';
      return [
        cleanText(error?.id),
        cleanText(error?.name),
        cleanText(error?.cover || error?.coverUrl),
        cleanText(error?.note),
        payload,
        Number(error?.updatedAt || 0) || 0,
        Number(error?.nodeCount || 0) || 0,
        Number(error?.edgeCount || 0) || 0,
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
        (workflowsLoading) => ({
          workflowsKey: buildWorkflowListRenderKey(workflowsLoading.workflows?.items),
          workflowsLoading: workflowsLoading.workflows?.loading === true,
          workflowsError: workflowsLoading.workflows?.error || null,
          panelOpen: workflowsLoading.workflowUi?.panelOpen,
          panelPinned: workflowsLoading.workflowUi?.panelPinned,
          searchKeyword: workflowsLoading.workflowUi?.searchKeyword,
          detailWorkflowId: workflowsLoading.workflowUi?.detailWorkflowId,
        }),
        () => this.renderSidebar(),
      ));
  }
  ['bindGlobalEvents']() {
    const handle = (event) => {
      (event?.preventDefault?.(), this.openCreateModal(event?.detail?.groupId || null));
    };
    (document.addEventListener('workflow:create-request', handle),
      window.addEventListener('workflow:create-request', handle));
  }
  ['initSidebarPanel']() {
    const el3 = document.querySelector('.sidebar-floating') || document.body,
      button = document.getElementById('btnWorkflows');
    ((this.sidebarPanel = el('div', 'v2-workflow-sidebar-panel')),
      this.sidebarPanel.setAttribute('aria-label', workflowText('sidebarAria')));
    const el4 = el('div', 'v2-workflow-sidebar-header'),
      el5 = el('button', 'v2-workflow-back', '‹');
    ((el5.type = 'button'), (el5.dataset.action = 'workflow-back'));
    const el6 = el('div', 'v2-workflow-sidebar-title');
    ((this.sidebarTitleTextEl = el('span', 'v2-workflow-title-text', workflowText('title'))),
      el6.appendChild(this.sidebarTitleTextEl),
      el4.append(el5, el6));
    const el7 = el('div', 'v2-workflow-search'),
      el8 = el('input', 'v2-workflow-search-input');
    ((el8.type = 'search'),
      (el8.placeholder = workflowText('searchPlaceholder')),
      (el8.dataset.role = 'workflow-search'),
      el7.appendChild(el8),
      (this.sidebarContent = el('div', 'v2-workflow-list')),
      this.sidebarPanel.append(el4, el7, this.sidebarContent),
      el3.appendChild(this.sidebarPanel),
      button &&
        registerSidebarSubmenu({
          key: 'workflows',
          button: button,
          panel: this.sidebarPanel,
          open: () => this.openSidebar(false),
          close: () => {
            (this.hideSidebar(),
              workspaceStore.setWorkflowUi({ panelOpen: false, panelPinned: false, detailWorkflowId: null }));
          },
          isOpen: () => getState().workflowUi?.panelOpen === true,
        }),
      this.sidebarPanel.addEventListener('click', (state) => this.handleSidebarClick(state)),
      this.sidebarPanel.addEventListener('keydown', (event2) => {
        if (event2.target?.dataset?.role !== 'workflow-rename-input') return;
        this.handleSidebarRenameKeydown(event2);
      }),
      this.sidebarPanel.addEventListener('focusout', (event3) => {
        const el9 = event3.target;
        if (el9?.dataset?.role !== 'workflow-rename-input') return;
        if (el9.dataset.submitted === '1') return;
        this.commitWorkflowRename(el9.dataset.workflowId, el9.value);
      }),
      this.sidebarPanel.addEventListener('input', (event4) => {
        const searchKeyword = event4.target;
        if (searchKeyword?.dataset?.role !== 'workflow-search') return;
        workspaceStore.setWorkflowUi({ searchKeyword: searchKeyword.value || '' });
      }));
  }
  ['initModal']() {
    ((this.modal = el('div', 'v2-workflow-modal-backdrop')),
      this.modal.setAttribute('aria-hidden', 'true'),
      (this.modalDialog = el('div', 'v2-workflow-modal')),
      this.modalDialog.setAttribute('role', 'dialog'),
      this.modalDialog.setAttribute('aria-label', workflowText('title')));
    const el10 = el('div', 'v2-workflow-modal-header'),
      el11 = el('div', 'v2-workflow-modal-title');
    ((this.modalTitleTextEl = el('span', 'v2-workflow-title-text', workflowText('title'))),
      el11.appendChild(this.modalTitleTextEl));
    const el12 = el('button', 'v2-workflow-icon-btn', '×');
    ((el12.type = 'button'),
      (el12.dataset.action = 'workflow-modal-close'),
      el10.append(el11, el12),
      (this.modalBody = el('div', 'v2-workflow-modal-body')));
    if (WORKFLOW_MODAL_TABS_ENABLED) {
      const el13 = el('div', 'v2-workflow-modal-tabs'),
        list2 = [['create', workflowText('tabs.create')]];
      WORKFLOW_UPDATE_ENTRY_ENABLED && list2.push(['update', workflowText('tabs.update')]);
      for (const [config, scope] of list2) {
        const el14 = el('button', 'v2-workflow-modal-tab', scope);
        ((el14.type = 'button'), (el14.dataset.modalTab = config), el13.appendChild(el14));
      }
      this.modalDialog.append(el10, el13, this.modalBody);
    } else this.modalDialog.append(el10, this.modalBody);
    (this.modal.appendChild(this.modalDialog),
      document.body.appendChild(this.modal),
      this.modal.addEventListener('click', (event5) => {
        const el15 = event5.target.closest('[data-action]');
        if (el15?.dataset?.action === 'workflow-modal-close') {
          this.closeModal();
          return;
        }
        event5.target === this.modal && this.closeModal();
      }),
      this.modal.addEventListener('click', (input) => this.handleModalClick(input)),
      this.modal.addEventListener('input', (output) => this.handleModalInput(output)),
      this.modal.addEventListener('keydown', (value2) => this.handleModalKeydown(value2)));
  }
  async ['loadWorkflows']() {
    if (this._loadingPromise) return this._loadingPromise;
    return (
      workspaceStore.setWorkflowsLoading(true),
      (this._loadingPromise = loadWorkflowsFromServer()
        .then((value3) => {
          const map = new Map();
          for (const value4 of getState().workflows?.items || []) {
            if (value4?.id) map.set(value4.id, value4);
          }
          for (const value5 of value3 || []) {
            if (value5?.id) map.set(value5.id, value5);
          }
          const value6 = Array.from(map.values());
          return (workspaceStore.setWorkflows(value6), value6);
        })
        .catch((error2) => {
          return (
            workspaceStore.setWorkflowsLoading(false, error2?.message || workflowText('loadFailed')),
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
  ['openSidebar'](panelPinned = false) {
    (clearTimeout(this._hideTimer),
      workspaceStore.setWorkflowUi({ panelOpen: true, panelPinned: panelPinned === true }));
    const state2 = getState().workflows || {};
    !state2.loadedAt && !state2.loading && this.loadWorkflows();
  }
  ['scheduleCloseSidebar']() {
    (clearTimeout(this._hideTimer),
      (this._hideTimer = window.setTimeout(() => {
        const state3 = getState().workflowUi || {};
        !state3.panelPinned && (this.hideSidebar(), workspaceStore.setWorkflowUi({ panelOpen: false }));
      }, 180)));
  }
  ['hideSidebar']() {
    (clearTimeout(this._hideTimer),
      (this._pendingDeleteWorkflowId = ''),
      (this._renamingWorkflowId = ''),
      this.sidebarPanel?.classList.remove('show'));
    const el16 = document.getElementById('btnWorkflows');
    el16?.classList.remove('active');
  }
  ['renderSidebar']() {
    if (!this.sidebarPanel || !this.sidebarContent) return;
    const state4 = getState(),
      value7 = state4.workflows?.items || [],
      value8 = state4.workflows || {},
      enabled2 = state4.workflowUi || {},
      el17 = document.getElementById('btnWorkflows');
    (this.sidebarPanel.classList.toggle('show', enabled2.panelOpen === true),
      el17?.classList.toggle('active', enabled2.panelOpen === true || enabled2.panelPinned === true));
    const el18 = this.sidebarPanel.querySelector('.v2-workflow-back');
    el18?.classList.toggle('show', !!enabled2.detailWorkflowId);
    this.sidebarTitleTextEl &&
      (this.sidebarTitleTextEl.textContent = enabled2.detailWorkflowId
        ? workflowText('detailTitle')
        : workflowText('title'));
    const el19 = this.sidebarPanel.querySelector("[data-role='workflow-search']");
    el19 && el19.value !== (enabled2.searchKeyword || '') && (el19.value = enabled2.searchKeyword || '');
    this.sidebarContent.replaceChildren();
    if (enabled2.detailWorkflowId) {
      ((this._pendingDeleteWorkflowId = ''),
        (this._renamingWorkflowId = ''),
        this.renderWorkflowDetail(value7, enabled2.detailWorkflowId));
      return;
    }
    if (value8.loading) {
      this.renderLoadingList();
      return;
    }
    const list3 = filterWorkflows(value7, enabled2.searchKeyword);
    if (list3.length === 0) {
      const cleanText2 = cleanText(enabled2.searchKeyword)
        ? workflowText('empty.noMatches')
        : workflowText('empty.noWorkflows');
      this.sidebarContent.appendChild(this.renderEmpty(cleanText2));
      return;
    }
    for (const value9 of list3) {
      this.sidebarContent.appendChild(this.renderWorkflowCard(value9));
    }
  }
  ['renderLoadingList']() {
    for (let count4 = 0; count4 < 4; count4++) {
      this.sidebarContent.appendChild(el('div', 'v2-workflow-skeleton'));
    }
  }
  ['renderEmpty'](value10) {
    const el20 = el('div', 'v2-workflow-empty'),
      el21 = el('div', 'v2-workflow-empty-text', value10);
    return (el20.appendChild(el21), el20);
  }
  ['renderCover'](value11, value12 = 'v2-workflow-cover', value13 = 'updream canvas') {
    const el22 = el('div', value12),
      cleanText3 = cleanText(value11);
    appendCoverPlaceholder(el22, value13);
    if (cleanText3) {
      const el23 = el('img');
      ((el23.src = cleanText3),
        (el23.alt = workflowText('coverAlt')),
        (el23.draggable = false),
        (el23.decoding = 'async'),
        el23.addEventListener(
          'load',
          () => {
            if (el22.isConnected) el22.replaceChildren(el23);
          },
          { once: true },
        ));
    }
    return el22;
  }
  ['renderWorkflowCard'](error3) {
    const el24 = el('article', 'v2-workflow-card'),
      value14 = String(error3?.id || '');
    ((el24.dataset.workflowId = value14),
      (el24.dataset.action = 'workflow-view'),
      el24.appendChild(this.renderCover(error3.cover)));
    const state5 = getState().workflowUi?.applyingWorkflowId,
      el25 = el('button', 'v2-workflow-card-load');
    ((el25.type = 'button'),
      (el25.dataset.action = 'workflow-apply'),
      (el25.dataset.workflowId = value14),
      (el25.disabled = state5 === error3.id),
      (el25.title = workflowText('loadToCanvas')),
      el25.setAttribute('aria-label', workflowText('loadToCanvas')),
      (el25.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 5.5a7.5 7.5 0 1 0-1 13.5"/><path d="M12 14h6v6"/><path d="m18 14-6 6"/></svg>'));
    const el26 = el('button', 'v2-workflow-card-delete');
    ((el26.type = 'button'),
      (el26.dataset.action = 'workflow-delete-open'),
      (el26.dataset.workflowId = value14),
      el26.setAttribute('aria-label', workflowText('deleteWorkflow')),
      (el26.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 3h6l1 2h5v2H3V5h5l1-2zm1 6h2v10h-2V9zm4 0h2v10h-2V9zM7 9h2v10H7V9z"/></svg>'));
    const el27 = el('div', 'v2-workflow-card-delete-confirm');
    el27.hidden = this._pendingDeleteWorkflowId !== value14;
    const el28 = el(
      'button',
      'v2-workflow-card-delete-confirm-btn v2-workflow-card-delete-confirm-btn--danger',
      '✔',
    );
    ((el28.type = 'button'),
      (el28.dataset.action = 'workflow-delete-confirm'),
      (el28.dataset.workflowId = value14),
      el28.setAttribute('aria-label', workflowText('confirm')));
    const el29 = el(
      'button',
      'v2-workflow-card-delete-confirm-btn v2-workflow-card-delete-confirm-btn--neutral',
      '×',
    );
    ((el29.type = 'button'),
      (el29.dataset.action = 'workflow-delete-cancel'),
      (el29.dataset.workflowId = value14),
      el29.setAttribute('aria-label', workflowText('cancel')),
      el27.append(el28, el29),
      (el26.hidden = this._pendingDeleteWorkflowId === value14),
      el24.append(el25, el26, el27));
    const el30 = el('div', 'v2-workflow-card-info'),
      el31 = el('div', 'v2-workflow-card-title');
    ((el31.dataset.action = 'workflow-rename-open'), (el31.dataset.workflowId = value14));
    if (this._renamingWorkflowId === value14) {
      (el31.classList.add('is-editing'),
        el31.removeAttribute('data-action'),
        el31.removeAttribute('data-workflow-id'));
      const el32 = el('input', 'v2-workflow-card-title-input');
      ((el32.type = 'text'),
        (el32.value = error3.name || ''),
        (el32.maxLength = WORKFLOW_LIMITS.nameMax),
        (el32.dataset.role = 'workflow-rename-input'),
        (el32.dataset.workflowId = value14),
        el32.setAttribute('aria-label', workflowText('name')),
        el31.appendChild(el32),
        window.requestAnimationFrame(() => {
          if (!el32.isConnected) return;
          (el32.focus(), el32.select?.());
        }));
    } else el31.textContent = error3.name || workflowText('unnamedWorkflow');
    el30.appendChild(el31);
    const note = cleanText(error3.note),
      el33 = el('button', 'v2-workflow-note-hint', '!');
    return (
      (el33.type = 'button'),
      (el33.dataset.note = note || workflowText('empty.noNote')),
      (el33.title = note || workflowText('empty.noNote')),
      el33.setAttribute(
        'aria-label',
        note ? workflowText('noteAria', { note: note }) : workflowText('empty.noNote'),
      ),
      el30.appendChild(el33),
      state5 === error3.id && el24.classList.add('is-applying'),
      el24.appendChild(el30),
      el24
    );
  }
  ['renderWorkflowDetail'](value15, value16) {
    const error4 = findWorkflowById(value15, value16);
    if (!error4) {
      this.sidebarContent.appendChild(this.renderEmpty(workflowText('workflowMissing')));
      return;
    }
    const el34 = el('div', 'v2-workflow-detail');
    (el34.appendChild(this.renderCover(error4.cover, 'v2-workflow-detail-cover')),
      el34.appendChild(el('div', 'v2-workflow-detail-title', error4.name)),
      el34.appendChild(el('div', 'v2-workflow-detail-meta', formatWorkflowMetaLine(error4))));
    const list4 = (error4.tags || []).map((item2) => cleanText(item2)).filter(Boolean);
    if (list4.length > 0) {
      const el35 = el('div', 'v2-workflow-tags');
      for (const value17 of list4) {
        el35.appendChild(el('span', 'v2-workflow-tag', value17));
      }
      el34.appendChild(el35);
    }
    const el36 = el('section', 'v2-workflow-detail-section');
    el36.appendChild(el('div', 'v2-workflow-detail-section-title', workflowText('content')));
    const list5 = buildWorkflowContentPreviewItems(error4);
    if (list5.length === 0) el36.appendChild(this.renderEmpty(workflowText('empty.noPreviewContent')));
    else {
      const el37 = el('div', 'v2-workflow-content-list');
      for (const value18 of list5) {
        el37.appendChild(this.renderWorkflowContentItem(value18));
      }
      el36.appendChild(el37);
    }
    el34.appendChild(el36);
    const cleanText4 = cleanText(error4.note);
    if (cleanText4) {
      const el38 = el('div', 'v2-workflow-detail-note');
      ((el38.textContent = cleanText4), el34.appendChild(el38));
    }
    const el39 = el('div', 'v2-workflow-detail-actions');
    if (WORKFLOW_UPDATE_ENTRY_ENABLED) {
      const el40 = el('button', 'v2-workflow-secondary-btn', workflowText('editMeta'));
      ((el40.type = 'button'),
        (el40.dataset.action = 'workflow-edit-meta'),
        (el40.dataset.workflowId = error4.id));
      const el41 = el('button', 'v2-workflow-secondary-btn', workflowText('updateContent'));
      ((el41.type = 'button'),
        (el41.dataset.action = 'workflow-open-update'),
        (el41.dataset.workflowId = error4.id),
        el39.append(el40, el41));
    }
    const el42 = el('button', 'v2-workflow-primary-btn', workflowText('applyToCanvas'));
    ((el42.type = 'button'),
      (el42.dataset.action = 'workflow-apply'),
      (el42.dataset.workflowId = error4.id),
      getState().workflowUi?.applyingWorkflowId === error4.id &&
        ((el42.disabled = true), (el42.textContent = workflowText('applying'))),
      el39.append(el42),
      el34.appendChild(el39),
      this.sidebarContent.appendChild(el34));
  }
  ['renderWorkflowContentItem'](value19) {
    const el43 = el('article', 'v2-workflow-content-item');
    el43.appendChild(
      this.renderCover(
        value19.thumbSrc,
        'v2-workflow-content-thumb',
        value19.placeholderLabel || workflowText('nodeFallback'),
      ),
    );
    const el44 = el('div', 'v2-workflow-content-info');
    (el44.appendChild(
      el('span', 'v2-workflow-content-type', value19.typeLabel || workflowText('nodeFallback')),
    ),
      el44.appendChild(
        el(
          'div',
          'v2-workflow-content-title',
          value19.title || value19.typeLabel || workflowText('nodeFallback'),
        ),
      ));
    const el45 = el('div', 'v2-workflow-content-summary');
    return (
      (el45.textContent = value19.summary || workflowText('empty.noNodePreviewContent')),
      el44.appendChild(el45),
      el43.appendChild(el44),
      el43
    );
  }
  ['playDeleteShake'](el46) {
    if (!el46) return;
    (el46.classList.remove('is-delete-shaking'),
      void el46.offsetWidth,
      el46.classList.add('is-delete-shaking'),
      window.setTimeout(() => {
        if (el46.isConnected) el46.classList.remove('is-delete-shaking');
      }, 240));
  }
  ['findWorkflowCard'](value20) {
    const enabled3 = String(value20 || '').trim();
    if (!enabled3 || !this.sidebarContent) return null;
    for (const el47 of this.sidebarContent.querySelectorAll('.v2-workflow-card')) {
      if (el47?.dataset?.workflowId === enabled3) return el47;
    }
    return null;
  }
  ['setWorkflowDeleteConfirm'](value21, enabled4) {
    const enabled5 = String(value21 || '').trim();
    if (!enabled5) return false;
    enabled4 &&
      this._pendingDeleteWorkflowId &&
      this._pendingDeleteWorkflowId !== enabled5 &&
      this.setWorkflowDeleteConfirm(this._pendingDeleteWorkflowId, false);
    const el48 = this.findWorkflowCard(enabled5);
    if (!el48) return false;
    const el49 = el48.querySelector('.v2-workflow-card-delete'),
      el50 = el48.querySelector('.v2-workflow-card-delete-confirm');
    if (!el49 || !el50) return false;
    return (
      (el49.hidden = enabled4),
      (el50.hidden = !enabled4),
      el48.classList.toggle('is-delete-confirming', enabled4),
      (this._pendingDeleteWorkflowId = enabled4
        ? enabled5
        : this._pendingDeleteWorkflowId === enabled5
          ? ''
          : this._pendingDeleteWorkflowId),
      true
    );
  }
  ['finishWorkflowRename'](value22, value23 = '') {
    const enabled6 = String(value22 || '').trim();
    if (!enabled6) return false;
    const el51 = this.findWorkflowCard(enabled6),
      el52 = el51?.querySelector('.v2-workflow-card-title');
    if (!el52) return false;
    const error5 = findWorkflowById(getState().workflows?.items || [], enabled6);
    (el52.classList.remove('is-editing'),
      (el52.dataset.action = 'workflow-rename-open'),
      (el52.dataset.workflowId = enabled6),
      el52.replaceChildren(),
      (el52.textContent = cleanText(value23 || error5?.name) || workflowText('unnamedWorkflow')));
    if (this._renamingWorkflowId === enabled6) this._renamingWorkflowId = '';
    return true;
  }
  ['startWorkflowRename'](value24) {
    const enabled7 = String(value24 || '').trim();
    if (!enabled7) return false;
    this._renamingWorkflowId &&
      this._renamingWorkflowId !== enabled7 &&
      this.finishWorkflowRename(this._renamingWorkflowId);
    this._pendingDeleteWorkflowId && this.setWorkflowDeleteConfirm(this._pendingDeleteWorkflowId, false);
    const error6 = findWorkflowById(getState().workflows?.items || [], enabled7),
      el53 = this.findWorkflowCard(enabled7),
      el54 = el53?.querySelector('.v2-workflow-card-title');
    if (!error6 || !el54) return false;
    ((this._renamingWorkflowId = enabled7),
      el54.classList.add('is-editing'),
      el54.removeAttribute('data-action'),
      el54.removeAttribute('data-workflow-id'));
    const el55 = el('input', 'v2-workflow-card-title-input');
    return (
      (el55.type = 'text'),
      (el55.value = error6.name || ''),
      (el55.maxLength = WORKFLOW_LIMITS.nameMax),
      (el55.dataset.role = 'workflow-rename-input'),
      (el55.dataset.workflowId = enabled7),
      el55.setAttribute('aria-label', workflowText('name')),
      el54.replaceChildren(el55),
      window.requestAnimationFrame(() => {
        if (!el55.isConnected) return;
        (el55.focus(), el55.select?.());
      }),
      true
    );
  }
  ['handleSidebarClick'](event6) {
    const el56 = event6.target.closest('[data-action]'),
      value25 = el56?.dataset?.action;
    if (value25 === 'workflow-back') {
      ((this._pendingDeleteWorkflowId = ''),
        (this._renamingWorkflowId = ''),
        workspaceStore.setWorkflowUi({ detailWorkflowId: null }));
      return;
    }
    if (value25 === 'workflow-open-create') {
      (event6.preventDefault(),
        event6.stopPropagation(),
        (this._pendingDeleteWorkflowId = ''),
        (this._renamingWorkflowId = ''),
        this.openCreateModal(null));
      return;
    }
    const detailWorkflowId = el56?.dataset?.workflowId;
    if (value25 === 'workflow-delete-open' && detailWorkflowId) {
      (event6.preventDefault(), event6.stopPropagation());
      this._renamingWorkflowId && this.finishWorkflowRename(this._renamingWorkflowId);
      !this.setWorkflowDeleteConfirm(detailWorkflowId, true) && this.renderSidebar();
      return;
    }
    if (value25 === 'workflow-delete-cancel') {
      (event6.preventDefault(), event6.stopPropagation());
      !this.setWorkflowDeleteConfirm(detailWorkflowId, false) &&
        ((this._pendingDeleteWorkflowId = ''), this.renderSidebar());
      return;
    }
    if (value25 === 'workflow-delete-confirm' && detailWorkflowId) {
      (event6.preventDefault(), event6.stopPropagation(), this.deleteWorkflowById(detailWorkflowId));
      return;
    }
    if (value25 === 'workflow-rename-open' && detailWorkflowId) {
      (event6.preventDefault(), event6.stopPropagation());
      !this.startWorkflowRename(detailWorkflowId) &&
        ((this._renamingWorkflowId = String(detailWorkflowId)), this.renderSidebar());
      return;
    }
    if (value25 === 'workflow-card-apply' && detailWorkflowId) {
      if (
        event6.target.closest('button, input, textarea, select') ||
        event6.target.closest('.v2-workflow-card-title')
      )
        return;
      (event6.preventDefault(),
        event6.stopPropagation(),
        (this._pendingDeleteWorkflowId = ''),
        (this._renamingWorkflowId = ''),
        this.applyWorkflow(detailWorkflowId));
      return;
    }
    if (value25 === 'workflow-view' && detailWorkflowId) {
      if (
        event6.target.closest('button, input, textarea, select') ||
        event6.target.closest('.v2-workflow-card-title')
      )
        return;
      (event6.preventDefault(),
        event6.stopPropagation(),
        (this._pendingDeleteWorkflowId = ''),
        (this._renamingWorkflowId = ''),
        workspaceStore.setWorkflowUi({ detailWorkflowId: detailWorkflowId }));
      return;
    }
    if (value25 === 'workflow-edit-meta' && detailWorkflowId) {
      ((this._pendingDeleteWorkflowId = ''),
        (this._renamingWorkflowId = ''),
        this.openUpdateModal(detailWorkflowId, { metaOnly: true }));
      return;
    }
    if (value25 === 'workflow-open-update' && detailWorkflowId) {
      ((this._pendingDeleteWorkflowId = ''),
        (this._renamingWorkflowId = ''),
        this.openUpdateModal(detailWorkflowId, { metaOnly: false }));
      return;
    }
    if (value25 === 'workflow-apply' && detailWorkflowId) {
      (event6.preventDefault(),
        event6.stopPropagation(),
        (this._pendingDeleteWorkflowId = ''),
        (this._renamingWorkflowId = ''),
        this.applyWorkflow(detailWorkflowId));
      return;
    }
  }
  ['handleSidebarRenameKeydown'](event7) {
    const el57 = event7.target,
      enabled8 = el57?.dataset?.workflowId;
    if (!enabled8) return;
    if (event7.key === 'Enter') {
      (event7.preventDefault(),
        event7.stopPropagation(),
        (el57.dataset.submitted = '1'),
        this.commitWorkflowRename(enabled8, el57.value));
      return;
    }
    event7.key === 'Escape' &&
      (event7.preventDefault(),
      event7.stopPropagation(),
      !this.finishWorkflowRename(enabled8) && ((this._renamingWorkflowId = ''), this.renderSidebar()));
  }
  async ['commitWorkflowRename'](value26, value27) {
    const enabled9 = String(value26 || '').trim(),
      cleanText5 = cleanText(value27);
    if (!enabled9) return;
    if (!cleanText5) {
      showToast(workflowText('errors.nameRequired'), 'error');
      return;
    }
    const error7 = findWorkflowById(getState().workflows?.items || [], enabled9);
    if (!error7) return;
    if (cleanText(error7.name) === cleanText5) {
      !this.finishWorkflowRename(enabled9, error7.name) &&
        ((this._renamingWorkflowId = ''), this.renderSidebar());
      return;
    }
    let error8 = null;
    try {
      ((error8 = await renameWorkflow(error7, cleanText5)),
        this.finishWorkflowRename(enabled9, error8?.name || cleanText5),
        workspaceStore.upsertWorkflow(error8),
        showToast(workflowText('renamed'), 'success'));
    } catch (error9) {
      (this.finishWorkflowRename(enabled9, error7.name),
        showToast(error9?.message || workflowText('renameFailed'), 'error'));
    } finally {
      this._renamingWorkflowId = '';
    }
  }
  async ['deleteWorkflowById'](value28) {
    const enabled10 = String(value28 || '').trim();
    if (!enabled10) return;
    (this.setWorkflowDeleteConfirm(enabled10, false),
      (this._pendingDeleteWorkflowId = ''),
      (this._renamingWorkflowId = ''));
    try {
      await deleteWorkflow(enabled10);
      const state6 = getState(),
        value29 = (state6.workflows?.items || []).filter((item3) => String(item3?.id || '') !== enabled10);
      (workspaceStore.setWorkflows(value29),
        state6.workflowUi?.detailWorkflowId === enabled10 &&
          workspaceStore.setWorkflowUi({ detailWorkflowId: null }),
        showToast(workflowText('deleted'), 'success'));
    } catch (error10) {
      showToast(error10?.message || workflowText('deleteFailed'), 'error');
    }
  }
  ['openCreateModal'](sourceGroupId = null) {
    (workspaceStore.openWorkflowModal({ tab: 'create', sourceGroupId: sourceGroupId }),
      this.resetCreateDraftFromCurrentSource(),
      this.renderModal());
  }
  ['openUpdateModal'](value30, { metaOnly: metaOnly = false } = {}) {
    (workspaceStore.openWorkflowModal({ tab: 'update', sourceGroupId: null }),
      workspaceStore.setWorkflowUi({ updateMetaOnly: metaOnly === true }),
      this.selectUpdateTarget(value30, { render: false }),
      this.renderModal());
  }
  ['resetCreateDraftFromCurrentSource']() {
    const value31 = this.getWorkflowSourceCanvasState(),
      value32 = this.getWorkflowSourceContext(),
      name = buildWorkflowSourceSummary(value31, value32),
      cover = this.getCoverCandidates(null, value31)[0] || getDefaultWorkflowCoverCandidate();
    workspaceStore.resetWorkflowDraft({
      name: name.isEmpty ? '' : name.suggestedName,
      tags: name.isEmpty ? [] : name.suggestedTags,
      cover: cover.src || '',
      selectedCoverId: cover.id,
    });
  }
  ['closeModal']() {
    (workspaceStore.closeWorkflowModal(), this.renderModal());
  }
  ['getWorkflowSourceCanvasState']() {
    const state7 = getState(),
      stateRaw = getStateRaw();
    return sliceCanvasStateForWorkflow(
      graphStore.serialize(),
      stateRaw?.nodes || {},
      state7.workflowUi?.sourceGroupId,
    );
  }
  ['getWorkflowSourceContext']() {
    const state8 = getState(),
      stateRaw2 = getStateRaw(),
      sourceGroupId2 = cleanText(state8.workflowUi?.sourceGroupId),
      error11 = sourceGroupId2 ? stateRaw2?.nodes?.[sourceGroupId2] : null;
    return {
      sourceGroupId: sourceGroupId2 || '',
      sourceLabel: sourceGroupId2 ? workflowText('source.currentGroup') : workflowText('source.wholeCanvas'),
      sourceName: cleanText(error11?.name || error11?.title || error11?.label),
    };
  }
  ['getWorkflowSourceSummary'](value33 = this.getWorkflowSourceCanvasState(), args = {}) {
    return buildWorkflowSourceSummary(value33, { ...this.getWorkflowSourceContext(), ...args });
  }
  ['getCoverCandidates'](value34 = null, value35 = this.getWorkflowSourceCanvasState()) {
    const workflowSnapshotCoverCandidate = createWorkflowSnapshotCoverCandidate(value35),
      args2 = extractWorkflowCoverCandidates(value35?.nodes),
      list6 = [];
    if (value34?.src) list6.push(value34);
    if (workflowSnapshotCoverCandidate?.src) list6.push(workflowSnapshotCoverCandidate);
    list6.push(...args2);
    if (list6.length === 0) list6.push(getDefaultWorkflowCoverCandidate());
    const map2 = new Set();
    return list6.filter((item4) => {
      const value36 = item4.src || item4.id;
      if (map2.has(value36)) return false;
      return (map2.add(value36), true);
    });
  }
  ['getUpdateCoverCandidates'](value37, value38 = null) {
    const state9 = getState().workflowUi || {};
    if (state9.updateMetaOnly && value37?.workflowData)
      return this.getCoverCandidates(value38, value37.workflowData);
    return this.getCoverCandidates(value38);
  }
  ['renderModal']() {
    if (!this.modal || !this.modalBody) return;
    const state10 = getState(),
      enabled11 = state10.workflowUi || {};
    (this.modal.classList.toggle('show', enabled11.modalOpen === true),
      this.modal.setAttribute('aria-hidden', enabled11.modalOpen === true ? 'false' : 'true'));
    if (!enabled11.modalOpen) {
      this.modalBody.replaceChildren();
      return;
    }
    for (const el58 of this.modal.querySelectorAll('.v2-workflow-modal-tab')) {
      el58.classList.toggle('active', el58.dataset.modalTab === (enabled11.modalTab || 'create'));
    }
    const value39 =
      enabled11.modalTab === 'update' && !WORKFLOW_UPDATE_ENTRY_ENABLED ? 'create' : enabled11.modalTab;
    (this.modalTitleTextEl &&
      (this.modalTitleTextEl.textContent =
        value39 === 'update'
          ? enabled11.updateMetaOnly
            ? workflowText('modal.editMetaTitle')
            : workflowText('modal.updateTitle')
          : workflowText('modal.createTitle')),
      this.modalBody.replaceChildren(),
      value39 === 'update' ? this.renderUpdateForm() : this.renderCreateForm());
  }
  ['renderCreateForm']() {
    const state11 = getState(),
      submitText = state11.workflowUi || {},
      value40 = this.getWorkflowSourceCanvasState(),
      sourceSummary2 = this.getWorkflowSourceSummary(value40),
      el59 = el('div', 'v2-workflow-create-layout');
    el59.appendChild(this.renderWorkflowSourcePanel(sourceSummary2));
    const value41 = this.renderWorkflowMetaForm({
      mode: 'create',
      candidates: this.getCoverCandidates(null, value40),
      sourceSummary: sourceSummary2,
      submitText: submitText.saving ? workflowText('saving') : workflowText('createConfirm'),
    });
    (el59.appendChild(value41), this.modalBody.appendChild(el59));
  }
  ['renderUpdateForm']() {
    const state12 = getState(),
      sourceSummary3 = state12.workflowUi || {},
      count5 = filterWorkflows(state12.workflows?.items || [], sourceSummary3.updateSearchKeyword || ''),
      el60 = el('div', 'v2-workflow-create-layout v2-workflow-update-layout'),
      el61 = el('section', 'v2-workflow-update-picker v2-workflow-source-panel'),
      el62 = el('div', 'v2-workflow-source-header');
    (el62.appendChild(el('div', 'v2-workflow-source-title', workflowText('updatePicker.title'))),
      el62.appendChild(
        el(
          'div',
          'v2-workflow-source-scope',
          workflowText('updatePicker.resultCount', { count: count5.length }),
        ),
      ),
      el61.appendChild(el62));
    const el63 = el('input', 'v2-workflow-search-input');
    ((el63.type = 'search'),
      (el63.placeholder = workflowText('updatePicker.searchPlaceholder')),
      (el63.value = sourceSummary3.updateSearchKeyword || ''),
      (el63.dataset.role = 'workflow-update-search'),
      el61.appendChild(el63));
    const el64 = el('div', 'v2-workflow-update-list');
    if (count5.length === 0) {
      const el65 = el('div', 'v2-workflow-source-empty');
      ((el65.textContent = cleanText(sourceSummary3.updateSearchKeyword)
        ? workflowText('empty.noMatches')
        : workflowText('empty.noWorkflows')),
        el64.appendChild(el65));
    } else
      for (const error12 of count5) {
        const el66 = el('button', 'v2-workflow-update-item');
        ((el66.type = 'button'),
          (el66.dataset.action = 'workflow-update-select'),
          (el66.dataset.workflowId = error12.id),
          el66.classList.toggle('active', sourceSummary3.updateTargetId === error12.id),
          el66.append(this.renderCover(error12.cover, 'v2-workflow-update-thumb')));
        const el67 = el('div', 'v2-workflow-update-info');
        (el67.append(el('span', '', error12.name), el('small', '', formatDateTime(error12.updatedAt))),
          el66.appendChild(el67),
          el64.appendChild(el66));
      }
    (el61.appendChild(el64), el60.appendChild(el61));
    const sourceName = findWorkflowById(state12.workflows?.items || [], sourceSummary3.updateTargetId),
      el68 = el('div', 'v2-workflow-update-editor');
    if (sourceName) {
      const value42 = this.getWorkflowSourceCanvasState(),
        value43 = this.getWorkflowSourceSummary(value42),
        workflowSourceSummary = buildWorkflowSourceSummary(sourceName.workflowData, {
          sourceLabel: workflowText('source.historyWorkflow'),
          sourceName: sourceName.name,
        }),
        value44 =
          sourceName.cover && sourceSummary3.draft?.cover === sourceName.cover
            ? {
                id: 'existing-' + sourceName.id,
                src: sourceName.cover,
                nodeId: '',
                label: workflowText('currentCover'),
              }
            : null;
      el68.appendChild(
        this.renderWorkflowMetaForm({
          mode: 'update',
          target: sourceName,
          candidates: this.getUpdateCoverCandidates(sourceName, value44),
          sourceSummary: sourceSummary3.updateMetaOnly ? null : value43,
          submitText: sourceSummary3.saving
            ? workflowText('updating')
            : sourceSummary3.updateMetaOnly
              ? workflowText('saveMeta')
              : sourceSummary3.updateConfirmOpen
                ? workflowText('confirmOverwrite')
                : workflowText('updateConfirm'),
        }),
      );
    } else
      el68.appendChild(
        this.renderWorkflowMetaForm({
          mode: 'update',
          candidates: [getDefaultWorkflowCoverCandidate()],
          submitText: workflowText('updateConfirm'),
          disabled: true,
        }),
      );
    (el60.appendChild(el68), this.modalBody.appendChild(el60));
  }
  ['renderWorkflowSourcePanel'](count6, { title: title = workflowText('source.savingContent') } = {}) {
    const el69 = el('section', 'v2-workflow-source-panel'),
      el70 = el('div', 'v2-workflow-source-header');
    el70.appendChild(el('div', 'v2-workflow-source-title', title));
    const el71 = el(
      'div',
      'v2-workflow-source-scope',
      count6.sourceLabel || workflowText('source.wholeCanvas'),
    );
    if (count6.sourceName) el71.appendChild(el('span', '', ' · ' + count6.sourceName));
    (el70.appendChild(el71), el69.appendChild(el70));
    if (count6.isEmpty) {
      const el72 = el('div', 'v2-workflow-source-empty');
      return (
        (el72.textContent =
          count6.sourceGroupId || count6.sourceLabel === workflowText('source.currentGroup')
            ? workflowText('empty.noGroupNodes')
            : workflowText('empty.noCanvasNodes')),
        el69.appendChild(el72),
        el69
      );
    }
    if (count6.typeCounts.length > 0) {
      const el73 = el('div', 'v2-workflow-source-types');
      for (const value45 of count6.typeCounts.slice(0, 6)) {
        el73.appendChild(el('span', 'v2-workflow-source-type', value45.label + ' ' + value45.count));
      }
      el69.appendChild(el73);
    }
    const list7 = count6.previewItems.slice(0, 4);
    if (list7.length > 0) {
      const el74 = el('div', 'v2-workflow-source-preview');
      for (const value46 of list7) {
        el74.appendChild(this.renderWorkflowContentItem(value46));
      }
      (count6.previewItems.length > list7.length &&
        el74.appendChild(
          el(
            'div',
            'v2-workflow-source-more',
            workflowText('source.moreNodes', { count: count6.previewItems.length - list7.length }),
          ),
        ),
        el69.appendChild(el74));
    }
    return el69;
  }
  ['renderWorkflowMetaForm']({
    mode: mode,
    candidates: candidates,
    submitText: submitText2,
    sourceSummary: sourceSummary = null,
    disabled: disabled = false,
  }) {
    const state13 = getState().workflowUi || {},
      error13 = state13.draft || {},
      value47 = mode === 'create' || (mode === 'update' && !state13.updateMetaOnly),
      value48 = value47 && sourceSummary?.isEmpty,
      el75 = el('div', 'v2-workflow-form');
    ((el75.dataset.workflowForm = mode), el75.classList.toggle('is-disabled', disabled === true));
    const el76 = el('div', 'v2-workflow-cover-row');
    el76.appendChild(this.renderCover(error13.cover, 'v2-workflow-form-cover'));
    const el77 = el('div', 'v2-workflow-cover-choices');
    for (const value49 of candidates) {
      const el78 = el('button', 'v2-workflow-cover-choice');
      ((el78.type = 'button'),
        (el78.dataset.action = 'workflow-cover-select'),
        (el78.dataset.coverId = value49.id),
        (el78.dataset.coverSrc = value49.src || ''),
        el78.classList.toggle('active', value49.id === error13.selectedCoverId),
        (el78.title = value49.label),
        el78.appendChild(this.renderCover(value49.src, 'v2-workflow-cover-choice-img')),
        el77.appendChild(el78));
    }
    (el76.appendChild(el77),
      el75.appendChild(el76),
      el75.appendChild(
        this.renderTextField(
          workflowText('name'),
          'workflow-draft-name',
          error13.name || '',
          WORKFLOW_LIMITS.nameMax,
        ),
      ),
      el75.appendChild(this.renderTagsField(error13.tags || [])),
      el75.appendChild(this.renderNoteField(error13.note || '')));
    const el79 = el('div', 'v2-workflow-form-error');
    el79.dataset.role = 'workflow-form-error';
    if (state13.error) el79.textContent = state13.error;
    el75.appendChild(el79);
    const el80 = el('div', 'v2-workflow-form-footer'),
      el81 = el('button', 'v2-workflow-secondary-btn', workflowText('cancel'));
    ((el81.type = 'button'), (el81.dataset.action = 'workflow-modal-close'));
    const el82 = el('button', 'v2-workflow-primary-btn', submitText2);
    return (
      (el82.type = 'button'),
      (el82.dataset.action = mode === 'update' ? 'workflow-update-submit' : 'workflow-create-submit'),
      (el82.disabled = disabled === true || state13.saving === true || !cleanText(error13.name) || value48),
      el80.append(el81, el82),
      el75.appendChild(el80),
      el75
    );
  }
  ['renderTextField'](value50, value51, value52, value53) {
    const el83 = el('label', 'v2-workflow-field');
    el83.appendChild(el('span', '', value50));
    const el84 = el('input', 'v2-workflow-input');
    return (
      (el84.type = 'text'),
      (el84.value = value52 || ''),
      (el84.maxLength = value53),
      (el84.dataset.role = value51),
      el83.appendChild(el84),
      el83
    );
  }
  ['renderNoteField'](value54) {
    const el85 = el('label', 'v2-workflow-field v2-workflow-note-field');
    el85.appendChild(el('span', '', workflowText('note')));
    const el86 = el('textarea', 'v2-workflow-textarea');
    return (
      (el86.maxLength = WORKFLOW_LIMITS.noteMax),
      (el86.value = value54 || ''),
      (el86.dataset.role = 'workflow-draft-note'),
      (el86.placeholder = workflowText('notePlaceholder')),
      el85.appendChild(el86),
      el85
    );
  }
  ['renderTagsField'](list8) {
    const el87 = el('div', 'v2-workflow-field');
    el87.appendChild(el('span', '', workflowText('tags')));
    const el88 = el('div', 'v2-workflow-tag-editor');
    for (const value55 of list8) {
      const el89 = el('span', 'v2-workflow-tag-chip');
      el89.appendChild(document.createTextNode(value55));
      const el90 = el('button', '', '×');
      ((el90.type = 'button'),
        (el90.dataset.action = 'workflow-tag-remove'),
        (el90.dataset.tag = value55),
        el89.appendChild(el90),
        el88.appendChild(el89));
    }
    const el91 = el('div', 'v2-workflow-tag-input-row'),
      el92 = el('input', 'v2-workflow-input v2-workflow-tag-input');
    ((el92.type = 'text'),
      (el92.maxLength = WORKFLOW_LIMITS.tagLengthMax),
      (el92.placeholder =
        list8.length >= WORKFLOW_LIMITS.tagMax
          ? workflowText('tagLimitReached')
          : workflowText('addTagPlaceholder')),
      (el92.disabled = list8.length >= WORKFLOW_LIMITS.tagMax),
      (el92.value = getState().workflowUi?.tagDraft || ''),
      (el92.dataset.role = 'workflow-tag-draft'));
    const el93 = el('button', 'v2-workflow-secondary-btn v2-workflow-tag-add-btn', workflowText('addTag'));
    return (
      (el93.type = 'button'),
      (el93.dataset.action = 'workflow-tag-add'),
      (el93.disabled = list8.length >= WORKFLOW_LIMITS.tagMax),
      el91.append(el92, el93),
      el87.append(el88, el91),
      el87
    );
  }
  ['handleModalKeydown'](event8) {
    if (event8.key === 'Escape') {
      this.closeModal();
      return;
    }
    if (event8.key !== 'Enter') return;
    const value56 = event8.target?.dataset?.role;
    if (value56 !== 'workflow-tag-draft') return;
    (event8.preventDefault(), this.addDraftTag());
  }
  ['handleModalInput'](event9) {
    const name2 = event9.target,
      enabled12 = name2?.dataset?.role;
    if (!enabled12) return;
    if (enabled12 === 'workflow-draft-name')
      (workspaceStore.setWorkflowDraft({ name: name2.value || '' }), this.updateSubmitDisabled());
    else {
      if (enabled12 === 'workflow-draft-note') workspaceStore.setWorkflowDraft({ note: name2.value || '' });
      else {
        if (enabled12 === 'workflow-tag-draft') workspaceStore.setWorkflowUi({ tagDraft: name2.value || '' });
        else
          enabled12 === 'workflow-update-search' &&
            (workspaceStore.setWorkflowUi({
              updateSearchKeyword: name2.value || '',
              updateConfirmOpen: false,
            }),
            this.renderModal());
      }
    }
  }
  ['handleModalClick'](event10) {
    const modalTab = event10.target.closest('.v2-workflow-modal-tab');
    if (modalTab?.dataset?.modalTab) {
      workspaceStore.setWorkflowUi({
        modalTab: modalTab.dataset.modalTab,
        updateConfirmOpen: false,
        updateMetaOnly: false,
        error: null,
      });
      modalTab.dataset.modalTab === 'create' && this.resetCreateDraftFromCurrentSource();
      this.renderModal();
      return;
    }
    const el94 = event10.target.closest('[data-action]'),
      enabled13 = el94?.dataset?.action;
    if (!enabled13) return;
    if (enabled13 === 'workflow-cover-select') {
      const selectedCoverId = el94.dataset.coverId,
        cover2 = selectedCoverId === DEFAULT_WORKFLOW_COVER_ID ? '' : el94.dataset.coverSrc || '';
      (workspaceStore.setWorkflowDraft({ selectedCoverId: selectedCoverId, cover: cover2 }),
        workspaceStore.setWorkflowUi({ updateConfirmOpen: false }),
        this.updateCoverSelectionUi(selectedCoverId, cover2));
      return;
    }
    if (enabled13 === 'workflow-tag-add') {
      this.addDraftTag();
      return;
    }
    if (enabled13 === 'workflow-tag-remove') {
      this.removeDraftTag(el94.dataset.tag);
      return;
    }
    if (enabled13 === 'workflow-create-submit') {
      this.submitCreate();
      return;
    }
    if (enabled13 === 'workflow-update-select') {
      this.selectUpdateTarget(el94.dataset.workflowId);
      return;
    }
    enabled13 === 'workflow-update-submit' && this.submitUpdate();
  }
  ['updateSubmitDisabled']() {
    const el95 = this.modalBody?.querySelector(
      "[data-action='workflow-create-submit'], [data-action='workflow-update-submit']",
    );
    if (el95) {
      const state14 = getState().workflowUi || {},
        value57 = state14.modalTab === 'create' || (state14.modalTab === 'update' && !state14.updateMetaOnly),
        value58 = value57 && this.getWorkflowSourceSummary(this.getWorkflowSourceCanvasState()).isEmpty;
      el95.disabled = state14.saving === true || !cleanText(state14.draft?.name) || value58;
    }
  }
  ['updateCoverSelectionUi'](value59, value60) {
    if (!this.modalBody) return;
    const cleanText6 = cleanText(value59);
    for (const el96 of this.modalBody.querySelectorAll('.v2-workflow-cover-choice')) {
      el96.classList.toggle('active', el96.dataset.coverId === cleanText6);
    }
    const el97 = this.modalBody.querySelector('.v2-workflow-form-cover');
    if (!el97?.parentNode) return;
    el97.replaceWith(this.renderCover(value60, 'v2-workflow-form-cover'));
  }
  ['setFormError'](error14) {
    workspaceStore.setWorkflowUi({ error: error14 || null });
    const el98 = this.modalBody?.querySelector("[data-role='workflow-form-error']");
    if (el98) el98.textContent = error14 || '';
  }
  ['addDraftTag']() {
    const state15 = getState().workflowUi || {},
      cleanText7 = cleanText(state15.tagDraft).slice(0, WORKFLOW_LIMITS.tagLengthMax);
    if (!cleanText7) return;
    const tags = normalizeWorkflowTags([...(state15.draft?.tags || []), cleanText7]);
    if ((state15.draft?.tags || []).length >= WORKFLOW_LIMITS.tagMax) {
      this.setFormError(workflowText('errors.tagLimit', { limit: WORKFLOW_LIMITS.tagMax }));
      return;
    }
    if (tags.length === (state15.draft?.tags || []).length) {
      this.setFormError(workflowText('errors.tagExists'));
      return;
    }
    (workspaceStore.setWorkflowDraft({ tags: tags }),
      workspaceStore.setWorkflowUi({ tagDraft: '', updateConfirmOpen: false, error: null }),
      this.renderModal());
  }
  ['removeDraftTag'](value61) {
    const state16 = getState().workflowUi || {},
      cleanText8 = cleanText(value61).toLowerCase(),
      tags2 = (state16.draft?.tags || []).filter((item5) => cleanText(item5).toLowerCase() !== cleanText8);
    (workspaceStore.setWorkflowDraft({ tags: tags2 }),
      workspaceStore.setWorkflowUi({ updateConfirmOpen: false, error: null }),
      this.renderModal());
  }
  ['selectUpdateTarget'](value62, { render: render = true } = {}) {
    const src = findWorkflowById(getState().workflows?.items || [], value62);
    if (!src) return;
    const state17 = getState().workflowUi || {},
      value63 = src.cover
        ? {
            id: 'existing-' + src.id,
            src: src.cover,
            nodeId: '',
            label: workflowText('currentCover'),
          }
        : null,
      value64 =
        this.getUpdateCoverCandidates(src, state17.updateMetaOnly ? value63 : null)[0] ||
        getDefaultWorkflowCoverCandidate(),
      selectedCoverId2 = src.cover ? 'existing-' + src.id : value64.id;
    (workspaceStore.setWorkflowUi({
      updateTargetId: src.id,
      updateConfirmOpen: false,
      tagDraft: '',
      error: null,
    }),
      workspaceStore.setWorkflowDraft({
        name: src.name,
        cover: src.cover || value64.src || '',
        tags: src.tags || [],
        note: src.note || '',
        selectedCoverId: selectedCoverId2,
      }));
    if (render) this.renderModal();
  }
  async ['submitCreate']() {
    const state18 = getState().workflowUi || {};
    if (state18.saving) return;
    const error15 = state18.draft || {};
    if (!cleanText(error15.name)) {
      this.setFormError(workflowText('errors.nameRequired'));
      return;
    }
    const value65 = this.getWorkflowSourceCanvasState();
    if (!Array.isArray(value65.nodes) || value65.nodes.length === 0) {
      this.setFormError(
        state18.sourceGroupId ? workflowText('empty.noGroupNodes') : workflowText('empty.noCanvasNodes'),
      );
      return;
    }
    (workspaceStore.setWorkflowSaving(true), this.renderModal());
    try {
      const saveNewWorkflowFromCanvas2 = await saveNewWorkflowFromCanvas(value65, error15),
        sourceEl = this.modalBody?.querySelector('.v2-workflow-form-cover');
      (workspaceStore.upsertWorkflow(saveNewWorkflowFromCanvas2),
        playWorkflowSaveFly({ sourceEl: sourceEl }),
        workspaceStore.closeWorkflowModal(),
        this.renderModal(),
        showToast(workflowText('created'), 'success'));
    } catch (error16) {
      (workspaceStore.setWorkflowSaving(false),
        this.setFormError(error16?.message || workflowText('saveFailed')),
        this.renderModal(),
        showToast(workflowText('saveFailed'), 'error'));
    }
  }
  async ['submitUpdate']() {
    const state19 = getState(),
      enabled14 = state19.workflowUi || {};
    if (enabled14.saving) return;
    const existingWorkflow = findWorkflowById(state19.workflows?.items || [], enabled14.updateTargetId);
    if (!existingWorkflow) {
      this.setFormError(workflowText('errors.selectWorkflowToUpdate'));
      return;
    }
    if (!cleanText(enabled14.draft?.name)) {
      this.setFormError(workflowText('errors.nameRequired'));
      return;
    }
    if (enabled14.updateMetaOnly) {
      (workspaceStore.setWorkflowSaving(true), this.renderModal());
      try {
        const saveWorkflowMeta2 = await saveWorkflowMeta(existingWorkflow, enabled14.draft || {}),
          sourceEl2 = this.modalBody?.querySelector('.v2-workflow-form-cover');
        (workspaceStore.upsertWorkflow(saveWorkflowMeta2),
          playWorkflowSaveFly({ sourceEl: sourceEl2 }),
          workspaceStore.closeWorkflowModal(),
          this.renderModal(),
          showToast(workflowText('metaSaved'), 'success'));
      } catch (error17) {
        (workspaceStore.setWorkflowSaving(false),
          this.setFormError(error17?.message || workflowText('metaSaveFailed')),
          this.renderModal(),
          showToast(workflowText('metaSaveFailed'), 'error'));
      }
      return;
    }
    const value66 = this.getWorkflowSourceCanvasState();
    if (!Array.isArray(value66.nodes) || value66.nodes.length === 0) {
      this.setFormError(
        enabled14.sourceGroupId ? workflowText('empty.noGroupNodes') : workflowText('empty.noCanvasNodes'),
      );
      return;
    }
    if (!enabled14.updateConfirmOpen) {
      (workspaceStore.setWorkflowUi({ updateConfirmOpen: true, error: null }), this.renderModal());
      return;
    }
    (workspaceStore.setWorkflowSaving(true), this.renderModal());
    try {
      const saveUpdatedWorkflowFromCanvas2 = await saveUpdatedWorkflowFromCanvas(
          existingWorkflow.id,
          value66,
          {
            ...(enabled14.draft || {}),
            existingWorkflow: existingWorkflow,
          },
        ),
        sourceEl3 = this.modalBody?.querySelector('.v2-workflow-form-cover');
      (workspaceStore.upsertWorkflow(saveUpdatedWorkflowFromCanvas2),
        playWorkflowSaveFly({ sourceEl: sourceEl3 }),
        workspaceStore.closeWorkflowModal(),
        this.renderModal(),
        showToast(workflowText('updated'), 'success'));
    } catch (error18) {
      (workspaceStore.setWorkflowSaving(false),
        this.setFormError(error18?.message || workflowText('updateFailed')),
        this.renderModal(),
        showToast(workflowText('updateFailed'), 'error'));
    }
  }
  ['getCanvasCenterWorld']() {
    const { viewport: viewport } = getState(),
      value67 = window.innerWidth / 2,
      value68 = window.innerHeight / 2,
      enabled15 = document.documentElement?.clientWidth || window.innerWidth || 0,
      enabled16 = document.documentElement?.clientHeight || window.innerHeight || 0;
    if (!enabled15 || !enabled16) return screenToWorld(value67, value68, viewport);
    let value69 = 0,
      value70 = 0,
      value71 = enabled15,
      value72 = enabled16;
    const list9 = [],
      value73 = document.querySelector('header');
    if (value73) list9.push(value73);
    const value74 = document.querySelector('.sidebar-floating');
    if (value74) list9.push(value74);
    this.sidebarPanel?.classList?.contains('show') && list9.push(this.sidebarPanel);
    const value75 = 8;
    for (const el99 of list9) {
      if (!el99?.isConnected) continue;
      const box = el99.getBoundingClientRect(),
        value76 = Math.max(value69, box.left),
        value77 = Math.max(value70, box.top),
        value78 = Math.min(value71, box.right),
        value79 = Math.min(value72, box.bottom);
      if (value78 <= value76 || value79 <= value77) continue;
      if (box.left <= value69 + value75 && box.right > value69 + value75) {
        value69 = Math.max(value69, box.right);
        continue;
      }
      if (box.right >= value71 - value75 && box.left < value71 - value75) {
        value71 = Math.min(value71, box.left);
        continue;
      }
      if (box.top <= value70 + value75 && box.bottom > value70 + value75) {
        value70 = Math.max(value70, box.bottom);
        continue;
      }
      box.bottom >= value72 - value75 &&
        box.top < value72 - value75 &&
        (value72 = Math.min(value72, box.top));
    }
    const count7 = value71 - value69,
      count8 = value72 - value70,
      value80 = count7 > 40 ? value69 + count7 / 2 : value67,
      value81 = count8 > 40 ? value70 + count8 / 2 : value68;
    return screenToWorld(value80, value81, viewport);
  }
  async ['applyWorkflow'](value82) {
    const state20 = getState(),
      value83 = state20.workflowUi || {};
    if (value83.applyingWorkflowId) return;
    const args3 = findWorkflowById(state20.workflows?.items || [], value82);
    if (!args3) {
      showToast(workflowText('workflowMissing'), 'error');
      return;
    }
    workspaceStore.setWorkflowApplying(args3.id);
    try {
      const canvas = applyWorkflowToCanvas(args3, this.getCanvasCenterWorld());
      if (canvas.nodes.length === 0) {
        showToast(workflowText('empty.noApplicableNodes'), 'warn');
        return;
      }
      (graphStore.batch(() => {
        for (const value84 of canvas.nodes) {
          graphStore.addNode(value84);
        }
        for (const value85 of canvas.edges) {
          graphStore.addEdge(value85);
        }
        graphStore.setSelectedNodes(canvas.nodes.map((item6) => item6.id));
      }),
        commit());
      const lastUsedAt = Date.now();
      (workspaceStore.markWorkflowUsed(args3.id, lastUsedAt),
        saveWorkflowUsage({ ...args3, lastUsedAt: lastUsedAt }, lastUsedAt).catch(() => {}),
        showToast(workflowText('applied'), 'success'));
    } catch (error19) {
      showToast(error19?.message || workflowText('applyFailed'), 'error');
    } finally {
      workspaceStore.setWorkflowApplying(null);
    }
  }
}
export const workflowManager = new WorkflowManager();
