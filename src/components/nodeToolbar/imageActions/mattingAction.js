export function bindImageMattingAction(value) {
  const { toolbarEl: toolbarEl, nodeId: nodeId, ImageMattingController: ImageMattingController } = value,
    el = toolbarEl.querySelector('.act-matting');
  el &&
    el.addEventListener('click', (event) => {
      (event.stopPropagation(),
        window.v2FocusOnNode && window.v2FocusOnNode(nodeId),
        ImageMattingController.init(nodeId));
    });
}
