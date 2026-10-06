export function bindVideoToGifAction(value) {
  const {
      toolbarEl: toolbarEl,
      nodeData: nodeData,
      VideoClipController: VideoClipController,
      VideoKeyingController: VideoKeyingController,
      VideoGifController: VideoGifController,
      _getCurrentVideoUrl: _getCurrentVideoUrl,
      _getCurrentVideoLocalPath: _getCurrentVideoLocalPath,
      _saveRemoteVideoResult: _saveRemoteVideoResult,
      closeToolbarMoreMenu: closeToolbarMoreMenu,
    } = value,
    el = toolbarEl.querySelector('.act-to-gif');
  if (!el) return () => {};
  const item = (event) => {
    (event.preventDefault(),
      event.stopPropagation(),
      closeToolbarMoreMenu?.(),
      VideoClipController.exit({ silent: true }),
      VideoKeyingController.exit({ silent: true }),
      VideoGifController.exit({ silent: true }),
      VideoGifController.init({
        nodeId: nodeData.id,
        sourceUrl: _getCurrentVideoUrl(),
        sourceLocalPath: _getCurrentVideoLocalPath(),
        ensureLocalSource: (key) => _saveRemoteVideoResult(key),
      }));
  };
  return (el.addEventListener('click', item), () => el.removeEventListener('click', item));
}
