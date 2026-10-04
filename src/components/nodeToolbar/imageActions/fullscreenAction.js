export function bindImageFullscreenAction(value) {
  const {
      toolbarEl: toolbarEl,
      getNodeData: getNodeData,
      openNodeImagePreview: openNodeImagePreview,
    } = value,
    el = toolbarEl.querySelector('.act-fullscreen');
  el &&
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      const item = getNodeData();
      if (item) openNodeImagePreview(item);
    });
}
