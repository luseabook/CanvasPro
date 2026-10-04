import appStore from '../../core/stores/appStore.js';
import * as generationTaskRuntime from '../../core/generationTaskRuntime.js';
import nodeRuntimeRegistry_2 from '../../core/nodeRuntimeRegistry.js';
function resolveWindowObject(value) {
  if (value) return value;
  if (typeof window !== 'undefined') return window;
  return null;
}
export function createCanvasCommandContext({
  store: store = appStore,
  graphStore: graphStore = store,
  canvasNodeFlows: canvasNodeFlows = null,
  createNodeAtCursor: createNodeAtCursor = canvasNodeFlows?.createNodeAtCursor,
  executeCommand: executeCommand = null,
  focusNodes: focusNodes = null,
  commit: commit = null,
  getNodeDefaultSize: getNodeDefaultSize = null,
  getAIGenerationDefaultSizeByType: getAIGenerationDefaultSizeByType = null,
  generationRuntime: generationRuntime = generationTaskRuntime,
  nodeRuntimeRegistry: nodeRuntimeRegistry = nodeRuntimeRegistry_2,
  windowObject: windowObject = undefined,
  commandRegistry: commandRegistry = null,
  recordCommand: recordCommand = null,
} = {}) {
  return {
    store: store,
    graphStore: graphStore,
    canvasNodeFlows: canvasNodeFlows,
    createNodeAtCursor: createNodeAtCursor,
    executeCommand: executeCommand,
    focusNodes: focusNodes,
    commit: commit,
    getNodeDefaultSize: getNodeDefaultSize,
    getAIGenerationDefaultSizeByType: getAIGenerationDefaultSizeByType,
    generationRuntime: generationRuntime,
    nodeRuntimeRegistry: nodeRuntimeRegistry,
    windowObject: resolveWindowObject(windowObject),
    commandRegistry: commandRegistry,
    recordCommand: recordCommand,
  };
}
