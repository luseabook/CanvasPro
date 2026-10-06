const SOURCE_NODE_LEGACY_DEFAULT_NAMES = Object.freeze({
  image: Object.freeze(['图片']),
  video: Object.freeze(['视频']),
  audio: Object.freeze(['音频']),
  text: Object.freeze(['文本']),
  node: Object.freeze(['节点']),
});
function getDefaultNodeKind(value) {
  const list = String(value || '');
  if (list.includes('image')) return 'image';
  if (list.includes('video')) return 'video';
  if (list.includes('audio')) return 'audio';
  if (list.includes('text')) return 'text';
  return 'node';
}
function isSourceNode(enabled) {
  return !!enabled?.type && String(enabled.type).startsWith('source-');
}
export function createSourceNodeNameBackfill({
  graphStore: graphStore,
  getBaseName: getBaseName,
  translate: translate,
} = {}) {
  const run =
    typeof translate === 'function'
      ? translate
      : (item) => {
          const key = String(item || '')
            .split('.')
            .pop();
          return key || '';
        };
  function run2(index) {
    return run('sourceDefaults.' + getDefaultNodeKind(index));
  }
  function run3(result, data) {
    const enabled2 = String(result || '');
    if (!enabled2) return true;
    const defaultNodeKind = getDefaultNodeKind(data);
    return (
      enabled2 === run2(data) || SOURCE_NODE_LEGACY_DEFAULT_NAMES[defaultNodeKind]?.includes(enabled2)
    );
  }
  function run4(error) {
    if (!isSourceNode(error)) return error;
    const enabled3 = getBaseName?.(error.fileName);
    if (!enabled3) return error;
    if (run3(error.name, error.type)) error.name = enabled3;
    return error;
  }
  function applySourceNamesFromFileNameToCanvas(enabled4) {
    if (!enabled4 || !enabled4.nodes) return enabled4;
    if (Array.isArray(enabled4.nodes)) return (enabled4.nodes.forEach(run4), enabled4);
    return (
      typeof enabled4.nodes === 'object' && Object.values(enabled4.nodes).forEach(run4),
      enabled4
    );
  }
  function patchStoreSourceNodeNamesFromFileName() {
    const state = graphStore?.getState?.() || graphStore?.getStateRaw?.() || {},
      options = state.nodes || {};
    Object.keys(options).forEach((target) => {
      const error2 = options[target];
      if (!isSourceNode(error2)) return;
      const enabled5 = getBaseName?.(error2.fileName);
      if (!enabled5) return;
      run3(error2.name, error2.type) && graphStore?.renameNode?.(target, enabled5);
    });
  }
  return {
    applySourceNamesFromFileNameToCanvas: applySourceNamesFromFileNameToCanvas,
    patchStoreSourceNodeNamesFromFileName: patchStoreSourceNodeNamesFromFileName,
  };
}
