import { bindRefThumbOrderDrag } from '../../modules/refThumbDragController.js';
export function bindRefBarDragSort(owner, container, store) {
  bindRefThumbOrderDrag({
    owner: owner,
    container: container,
    store: store,
    nodeId: owner?.nodeId,
  });
}
