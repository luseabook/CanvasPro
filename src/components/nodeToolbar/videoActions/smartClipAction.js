import { t } from '../../../i18n/index.js';
function videoToolbarText(value, item = {}) {
  return t('nodeToolbar.video.' + value, item);
}
export function bindVideoSmartClipAction(key) {
  const {
      toolbarEl: toolbarEl,
      nodeData: nodeData,
      store: store,
      findAvailablePosition: findAvailablePosition,
      detectScenes: detectScenes,
      getNodeSpawnPrefs: getNodeSpawnPrefs,
      buildSourceMediaNodePayload: buildSourceMediaNodePayload,
      getAutoMediaSizeByShortSide: getAutoMediaSizeByShortSide,
      _getLatestNodeData: _getLatestNodeData,
    } = key,
    el = toolbarEl.querySelector('.act-smart-clip');
  el &&
    el.addEventListener('click', async (event) => {
      event.stopPropagation();
      const src = _getLatestNodeData(),
        videoUrl = src.src || src.videoUrl;
      if (!videoUrl) {
        window.showToast?.(videoToolbarText('invalidVideoSource'), 'error');
        return;
      }
      const el2 = el.querySelector('svg');
      if (el2) el2.classList.add('v2-spinning');
      try {
        window.showToast?.(videoToolbarText('analyzingScenes'), 'info');
        const index = await detectScenes({ videoUrl: videoUrl, provider: 'grsai', sensitivity: 0.5 });
        if (index.sceneCount <= 1) {
          window.showToast?.(videoToolbarText('extractNoSegments'), 'info');
          return;
        }
        const { direction: direction, spacing: spacing, avoidOverlap: avoidOverlap } = getNodeSpawnPrefs(),
          box = store.getState().nodes[nodeData.id];
        if (!box) {
          window.showToast?.(videoToolbarText('sourceNodeMissing'), 'error');
          return;
        }
        const count = [];
        let clipStart = 0;
        for (let index2 = 0; index2 < index.sceneCount; index2++) {
          const clipEnd = index2 < index.sceneChanges.length ? index.sceneChanges[index2] : 100,
            result = direction === 'down' ? 'down' : 'right',
            data = Number(box.x) || 0,
            options = Number(box.y) || 0,
            target = Number(box.width) || 0x200,
            source = Number(box.height) || 0x120,
            width = getAutoMediaSizeByShortSide(target, source),
            x = data + target + spacing,
            y =
              result === 'down'
                ? options + source + spacing * (index2 + 1)
                : options + Math.round((source - width.height) / 2),
            x2 = avoidOverlap
              ? findAvailablePosition(
                  store.getState().nodes || {},
                  x,
                  y,
                  width.width,
                  width.height,
                  spacing,
                  result,
                )
              : { x: x, y: y },
            id =
              'source-video-scene-' +
              Date.now() +
              '-' +
              index2 +
              '-' +
              Math.random().toString(36).slice(2, 6);
          (store.addNode(
            buildSourceMediaNodePayload({
              id: id,
              type: 'source-video',
              name: videoToolbarText('sceneNodeName', { index: index2 + 1 }),
              src: src.src,
              localPath: src.localPath,
              clipStart: clipStart,
              clipEnd: clipEnd,
              x: x2.x,
              y: x2.y,
              width: width.width,
              height: width.height,
              needsAutoResize: false,
            }),
          ),
            count.push(id),
            (clipStart = clipEnd));
        }
        count.length > 0 &&
          (store.setSelectedNodes(count),
          window.v2FocusOnNodes && window.v2FocusOnNodes([box.id, ...count]),
          window.showToast?.(videoToolbarText('sceneNodesCreated', { count: count.length }), 'success'));
      } catch (next) {
        (console.error('智能剪辑失败:', next),
          window.showToast?.(videoToolbarText('smartClipFailedRetry'), 'error'));
      } finally {
        if (el2) el2.classList.remove('v2-spinning');
      }
    });
}
