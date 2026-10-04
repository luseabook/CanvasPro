export function bindImageAnnotateAction(value) {
  const { toolbarEl: toolbarEl, nodeId: nodeId, ImageAnnotateController: ImageAnnotateController } = value,
    el = toolbarEl.querySelector('.act-annotate');
  el &&
    el.addEventListener('click', (event) => {
      (event.stopPropagation(),
        window.v2FocusOnNode && window.v2FocusOnNode(nodeId),
        ImageAnnotateController.init(nodeId));
    });
}
