import { renderStoryHomeComposerBody } from './storyHomePresentation.js';
import { syncStoryReplicationSelection } from './storyVideoReplicationPresentation.js';
import { resolveWorkspaceCardMultiSelection } from '../workspaceAssetSelection.js';
import { createStoryMarqueeSelectionController } from './storyMarqueeSelection.js';
export function syncStoryReplicationHomeSources(el, value) {
  const el2 = el['querySelector']('[data-story-replication-upload-list]');
  if (!el2) return;
  const el3 = el['ownerDocument']['createElement']('template');
  el3['innerHTML'] = renderStoryHomeComposerBody(value);
  const el4 = el3['content'],
    el5 = el4['querySelector']('[data-story-replication-upload-list]'),
    map = new Map([...el2['children']]['map']((el6) => [el6['dataset']['replicationSourceKey'], el6])),
    list = [...el5['children']],
    map2 = new Set(list['map']((el7) => el7['dataset']['replicationSourceKey'])),
    item = el2['scrollTop'];
  for (const [key, el8] of map) if (!map2['has'](key)) el8['remove']();
  (list['forEach']((el9, index) => {
    const result = map['get'](el9['dataset']['replicationSourceKey']),
      el10 = result || el9;
    el10['querySelector']('[data-story-replication-file-index]')['dataset']['storyReplicationFileIndex'] =
      String(index);
    if (el2['children'][index] !== el10) el2['insertBefore'](el10, el2['children'][index] || null);
  }),
    (el2['hidden'] = el5['hidden']),
    (el2['scrollTop'] = item),
    el['querySelector']('.story-replication-upload')['classList']['toggle']('has-sources', !el5['hidden']),
    (el['querySelector']('.story-replication-upload-empty')['hidden'] = !el5['hidden']));
}
export function bindStoryReplicationIntake(
  documentObject,
  { root: root, state: state, analyze: analyze, sync: sync, persist: persist } = {},
) {
  const data = documentObject['querySelector']('[data-story-replication-grid]'),
    selectedIds = () =>
      state['data']['episodes']['filter']((options) =>
        ['pending', 'failed']['includes'](options['replication']?.['status']),
      ),
    handler = () =>
      state['data']['episodes']['some']((target) =>
        ['queued', 'uploading', 'analyzing']['includes'](target['replication']?.['status']),
      ),
    handler2 = () => syncStoryReplicationSelection(documentObject, state),
    handler3 = () => documentObject['closest']('.story-page.is-current') || documentObject;
  let activeItemId = '';
  const commit = (list2) => {
      state['replicationSelectionMode'] = list2['length'] > 0;
      for (const source of selectedIds())
        source['replication']['selectedForAnalysis'] = list2['includes'](source['id']);
      (handler2(), sync(), persist());
    },
    handler4 = () => {
      state['replicationSelectionMode'] = ![];
      for (const next of state['data']['episodes']) next['replication']['selectedForAnalysis'] = ![];
      (handler2(), sync(), persist());
    },
    current = data
      ? createStoryMarqueeSelectionController({
          root: root,
          documentObject: documentObject['ownerDocument'],
          windowObject: documentObject['ownerDocument']['defaultView'],
          surfaceSelector: '[data-story-replication-grid]',
          itemSelector: '.story-replication-card:is(.is-pending, .is-failed)',
          resolveSurface: (event) => (handler3()['contains'](event['target']) ? handler3() : null),
          blockedControlSelector:
            "button, input, textarea, select, a, [contenteditable='true'], [draggable='true']",
          getItemId: (el11) => el11['dataset']['storyReplicationEpisodeId'],
          getConfig: () => ({
            enabled: !handler(),
            selectedIds: selectedIds()
              ['filter']((entry) => entry['replication']['selectedForAnalysis'])
              ['map']((record) => record['id']),
            commit: commit,
          }),
        })
      : null,
    payload = (handle) => current?.['begin'](handle),
    config = (event2) => {
      if (event2['key'] === 'Escape' && state['replicationSelectionMode']) handler4();
    },
    scope = (toggleKey) => {
      if (current?.['consumeClick'](toggleKey)) return;
      if (
        handler3()['contains'](toggleKey['target']) &&
        !toggleKey['target']['closest'](
          'button, input, textarea, select, a, [contenteditable="true"], .story-replication-card',
        ) &&
        state['replicationSelectionMode']
      ) {
        handler4();
        return;
      }
      const el12 = toggleKey['target']['closest']('[data-replication-selection]');
      if (el12 && !el12['disabled']) {
        const input = el12['dataset']['replicationSelection'];
        if (input === 'all')
          commit(
            selectedIds()['every']((output) => output['replication']['selectedForAnalysis'])
              ? []
              : selectedIds()['map']((value2) => value2['id']),
          );
        return;
      }
      const el13 = toggleKey['target']['closest']('[data-replication-card-action]');
      if (el13 && !el13['disabled']) {
        const itemId = el13['dataset']['replicationCardAction'];
        if (
          !el13['hasAttribute']('data-replication-open') ||
          toggleKey['shiftKey'] ||
          toggleKey['ctrlKey'] ||
          toggleKey['metaKey']
        ) {
          if (!selectedIds()['some']((value3) => value3['id'] === itemId) || handler()) return;
          toggleKey['stopImmediatePropagation']();
          const workspaceCardMultiSelection = resolveWorkspaceCardMultiSelection({
            selectedIds: selectedIds()
              ['filter']((value4) => value4['replication']['selectedForAnalysis'])
              ['map']((value5) => value5['id']),
            itemId: itemId,
            activeItemId: activeItemId,
            orderedIds: selectedIds()['map']((value6) => value6['id']),
            toggleKey: toggleKey['ctrlKey'] || toggleKey['metaKey'],
            shiftKey: toggleKey['shiftKey'],
          });
          if (!toggleKey['shiftKey']) activeItemId = itemId;
          commit(workspaceCardMultiSelection['selectedIds']);
        }
        return;
      }
      const all = toggleKey['target']['closest'](
        '[data-replication-analyze], [data-story-action=\'analyze-all-replication\']',
      );
      if (!all || all['disabled']) return;
      void analyze({
        all:
          all['dataset']['replicationAnalyze'] === 'all' ||
          all['dataset']['storyAction'] === 'analyze-all-replication',
      });
    };
  return (
    documentObject['addEventListener']('click', scope),
    root['addEventListener']('pointerdown', payload),
    documentObject['addEventListener']('keydown', config),
    documentObject['addEventListener']('story-replication-updated', handler2),
    handler2(),
    {
      destroy() {
        (current?.['destroy'](),
          root['removeEventListener']('pointerdown', payload),
          documentObject['removeEventListener']('keydown', config),
          documentObject['removeEventListener']('story-replication-updated', handler2),
          documentObject['removeEventListener']('click', scope));
      },
    }
  );
}
