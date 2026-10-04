export function bindVideoResetSizeAction(value) {
  const {
      toolbarEl: toolbarEl,
      nodeData: nodeData,
      getStateSnapshot: getStateSnapshot,
      executeCommand: executeCommand,
    } = value,
    el = toolbarEl.querySelector('.act-reset-size');
  el &&
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      if (getStateSnapshot().ui?.imageVideoNodeResizeEnabled !== true) return;
      if (!nodeData?.id) return;
      executeCommand('reset_source_media_size', { ids: [nodeData.id] });
    });
}
