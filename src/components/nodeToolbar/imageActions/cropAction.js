export function bindImageCropAction(value) {
  const { toolbarEl: toolbarEl, nodeId: nodeId, ImageCropController: ImageCropController } = value,
    el = toolbarEl.querySelector('.act-crop');
  el &&
    el.addEventListener('click', (event) => {
      (event.stopPropagation(),
        window.v2FocusOnNode
          ? (window.v2FocusOnNode(nodeId, 120, 0x320),
            setTimeout(() => {
              ImageCropController.init(nodeId);
            }, 0x258))
          : ImageCropController.init(nodeId));
    });
}
