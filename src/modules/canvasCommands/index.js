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
import { registerGraphCommands } from './graphCommands.js';
import { registerLayoutCommands } from './layoutCommands.js';
import { registerModelParamCommands } from './modelParamCommands.js';
import { registerPromptCommands } from './promptCommands.js';
import { registerSelectionCommands } from './selectionCommands.js';
import { registerViewportCommands } from './viewportCommands.js';
export function registerDefaultCanvasCommands(value = commandRegistry) {
  return (
    registerGraphCommands(value),
    registerSelectionCommands(value),
    registerViewportCommands(value),
    registerPromptCommands(value),
    registerModelParamCommands(value),
    registerLayoutCommands(value),
    registerGenerationCommands(value),
    value
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
