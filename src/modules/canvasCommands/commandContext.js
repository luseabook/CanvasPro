import appStore from '../../core/stores/appStore.js';
import * as generationTaskRuntime from '../../core/generationTaskRuntime.js';
import nodeRuntimeRegistry_2 from '../../core/nodeRuntimeRegistry.js';
function resolveWindowObject(_0xb95136) {
  if (_0xb95136) return _0xb95136;
  if (typeof window !== 'undefined') return window;
  return null;
}
export function createCanvasCommandContext({
  store: _0x313339 = appStore,
  graphStore: graphStore = _0x313339,
  canvasNodeFlows: canvasNodeFlows = null,
  createNodeAtCursor: createNodeAtCursor = canvasNodeFlows?.createNodeAtCursor,
  executeCommand: executeCommand = null,
  focusNodes: focusNodes = null,
  commit: commit = null,
  getNodeDefaultSize: getNodeDefaultSize = null,
  getAIGenerationDefaultSizeByType: getAIGenerationDefaultSizeByType = null,
  generationRuntime: generationRuntime = generationTaskRuntime,
  nodeRuntimeRegistry: _0x9a24a = nodeRuntimeRegistry_2,
  windowObject: windowObject = undefined,
  commandRegistry: commandRegistry = null,
  recordCommand: recordCommand = null,
} = {}) {
  return {
    store: _0x313339,
    graphStore: graphStore,
    canvasNodeFlows: canvasNodeFlows,
    createNodeAtCursor: createNodeAtCursor,
    executeCommand: executeCommand,
    focusNodes: focusNodes,
    commit: commit,
    getNodeDefaultSize: getNodeDefaultSize,
    getAIGenerationDefaultSizeByType: getAIGenerationDefaultSizeByType,
    generationRuntime: generationRuntime,
    nodeRuntimeRegistry: _0x9a24a,
    windowObject: resolveWindowObject(windowObject),
    commandRegistry: commandRegistry,
    recordCommand: recordCommand,
  };
}
