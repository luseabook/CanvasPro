export function bindImageResetSizeAction(value) {
  const {
      toolbarEl: toolbarEl,
      nodeId: nodeId,
      getStateSnapshot: getStateSnapshot,
      executeCommand: executeCommand,
    } = value,
    el = toolbarEl.querySelector('.act-reset-size');
  el &&
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      if (getStateSnapshot().ui?.imageVideoNodeResizeEnabled !== true) return;
      executeCommand('reset_source_media_size', { ids: [nodeId] });
    });
}
