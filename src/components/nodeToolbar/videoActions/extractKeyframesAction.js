import { t } from '../../../i18n/index.js';
function videoToolbarText(value, item = {}) {
  return t('nodeToolbar.video.' + value, item);
}
export function bindVideoExtractKeyframesAction(key) {
  const {
      toolbarEl: toolbarEl,
      nodeData: nodeData,
      getStateSnapshot: getStateSnapshot,
      VideoClipController: VideoClipController,
      VideoKeyingController: VideoKeyingController,
      runSmartClipKeyframeExtractionFromVideoNode: runSmartClipKeyframeExtractionFromVideoNode,
    } = key,
    el = toolbarEl?.querySelector?.('.act-extract-keyframes');
  if (!el) return;
  const videoToolbarText2 = videoToolbarText('extractKeyframes'),
    el2 = el.querySelector?.('svg'),
    handler = (enabled, index = videoToolbarText2) => {
      ((el.dataset.loading = enabled ? 'true' : 'false'),
        (el.disabled = !!enabled),
        el.setAttribute?.('aria-busy', enabled ? 'true' : 'false'),
        el.setAttribute?.('data-tooltip', index),
        el2?.classList?.toggle?.('v2-spinning', !!enabled));
    };
  el.addEventListener('click', async (event) => {
    event.stopPropagation();
    if (el.dataset.loading === 'true') return;
    const result = getStateSnapshot();
    if (result.videoKeying?.active) {
      window.showToast?.(videoToolbarText('exitCurrentEditMode'), 'info');
      return;
    }
    if (result.videoClip?.active) {
      window.showToast?.(videoToolbarText('exitClipMode'), 'info');
      return;
    }
    if (typeof runSmartClipKeyframeExtractionFromVideoNode !== 'function') {
      window.showToast?.(videoToolbarText('extractUnavailable'), 'error');
      return;
    }
    (VideoClipController?.exit?.({ silent: true }),
      VideoKeyingController?.exit?.({ silent: true }),
      handler(true, videoToolbarText('extractPreparing')),
      window.showToast?.(videoToolbarText('extractStarted'), 'info'));
    try {
      const count = await runSmartClipKeyframeExtractionFromVideoNode({
        nodeId: nodeData?.id,
        onProgress: (progress) => {
          if (!progress?.text) return;
          handler(true, videoToolbarText('extractProgress', { progress: progress.text }));
        },
      });
      if (!count?.ok) {
        window.showToast?.(
          count?.reason === 'no-segments'
            ? videoToolbarText('extractNoSegments')
            : videoToolbarText('extractNoKeyframes'),
          count?.reason === 'no-segments' ? 'info' : 'error',
        );
        return;
      }
      window.showToast?.(videoToolbarText('extractComplete', { count: count.nodeIds.length }), 'success');
    } catch (error) {
      const error2 =
        error instanceof Error ? error.message : String(error || videoToolbarText('smartClipFailed'));
      window.showToast?.(videoToolbarText('extractFailed', { error: error2 }), 'error');
    } finally {
      handler(false);
    }
  });
}
