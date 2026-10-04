import commandRegistry, {
  CanvasCommandError,
  CanvasCommandRegistry,
  createCanvasCommandError,
  createCanvasCommandRegistry,
} from './commandRegistry.js';
import {
  executeCanvasCommand,
  executeCanvasCommandSync,
  executeCanvasCommandPlan,
  hasCanvasCommandPlanVariableReference,
} from './commandExecutor.js';
import { createCanvasCommandContext } from './commandContext.js';
import { registerGenerationCommands } from './generationCommands.js';
import { registerEditingCommands } from './editingCommands.js';
import { registerGraphCommands } from './graphCommands.js';
import { registerLayoutCommands } from './layoutCommands.js';
import { registerMediaToolCommands } from './mediaToolCommands.js';
import { registerModelParamCommands } from './modelParamCommands.js';
import { registerNodeExportCommands } from './nodeExportCommands.js';
import { registerPanoramaSceneCommands } from './panoramaSceneCommands.js';
import { registerPromptCommands } from './promptCommands.js';
import { registerSelectionCommands } from './selectionCommands.js';
import { registerStoryboardCommands } from './storyboardCommands.js';
import { registerTaskCommands } from './taskCommands.js';
import { registerViewportCommands } from './viewportCommands.js';
export function registerDefaultCanvasCommands(registry = commandRegistry) {
  return (
    registerGraphCommands(registry),
    registerEditingCommands(registry),
    registerSelectionCommands(registry),
    registerViewportCommands(registry),
    registerPromptCommands(registry),
    registerModelParamCommands(registry),
    registerLayoutCommands(registry),
    registerMediaToolCommands(registry),
    registerStoryboardCommands(registry),
    registerTaskCommands(registry),
    registerGenerationCommands(registry),
    registerNodeExportCommands(registry),
    registerPanoramaSceneCommands(registry),
    registry
  );
}
registerDefaultCanvasCommands(commandRegistry);
export {
  CanvasCommandError,
  CanvasCommandRegistry,
  createCanvasCommandContext,
  createCanvasCommandError,
  createCanvasCommandRegistry,
  commandRegistry as canvasCommandRegistry,
  executeCanvasCommand,
  executeCanvasCommandSync,
  executeCanvasCommandPlan,
  hasCanvasCommandPlanVariableReference,
};
