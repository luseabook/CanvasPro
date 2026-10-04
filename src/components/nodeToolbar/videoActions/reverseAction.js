import { t } from '../../../i18n/index.js';
function videoReverseText(value, item = {}) {
  return t('nodeToolbar.video.' + value, item);
}
export function bindVideoReverseAction(key) {
  const {
      toolbarEl: toolbarEl,
      nodeData: nodeData,
      getStateSnapshot: getStateSnapshot,
      VideoClipController: VideoClipController,
      VideoKeyingController: VideoKeyingController,
      runVideoReverseFromNode: runVideoReverseFromNode,
    } = key,
    el = toolbarEl.querySelector('.act-reverse');
  if (el) {
    const tooltip = el.dataset?.tooltip || el.getAttribute?.('data-tooltip') || '',
      index = !!el.disabled,
      result = el.getAttribute?.('aria-busy'),
      el2 = el.querySelector?.('svg'),
      handler = (data) => {
        const options = String(data || '').trim();
        if (options) el.setAttribute?.('data-tooltip', options);
        else {
          el.removeAttribute?.('data-tooltip');
          if (el.dataset) delete el.dataset.tooltip;
        }
      },
      handler2 = () => {
        result == null ? el.removeAttribute?.('aria-busy') : el.setAttribute?.('aria-busy', result);
      },
      handler3 = (enabled) => {
        ((el.dataset.loading = enabled ? 'true' : 'false'),
          (el.disabled = enabled ? true : index),
          enabled
            ? (el.setAttribute?.('aria-busy', 'true'),
              handler(tooltip ? videoReverseText('reverseBusyTooltip', { tooltip: tooltip }) : tooltip))
            : (handler2(), handler(tooltip)),
          el2?.classList?.toggle?.('v2-spinning', !!enabled));
      };
    el.addEventListener('click', async (event) => {
      event.stopPropagation();
      if (el.dataset.loading === 'true') return;
      const target = getStateSnapshot();
      if (target.videoKeying?.active) {
        window.showToast?.(videoReverseText('exitCurrentEditMode'), 'info');
        return;
      }
      if (target.videoClip?.active) {
        window.showToast?.(videoReverseText('exitClipMode'), 'info');
        return;
      }
      if (typeof runVideoReverseFromNode !== 'function') {
        window.showToast?.(videoReverseText('reverseUnavailable'), 'error');
        return;
      }
      (VideoClipController.exit({ silent: true }),
        VideoKeyingController.exit({ silent: true }),
        handler3(true));
      try {
        await runVideoReverseFromNode(nodeData.id);
      } catch (error) {
        const error2 =
          error instanceof Error ? error.message : String(error || videoReverseText('reverseFailed'));
        window.showToast?.(videoReverseText('reverseFailedWithError', { error: error2 }), 'error');
      } finally {
        handler3(false);
      }
    });
  }
}
