import commandRegistry, {
  CanvasCommandError,
  CanvasCommandRegistry,
  createCanvasCommandError,
  createCanvasCommandRegistry,
} from './commandRegistry.js';
import {
  executeCanvasCommand,
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
export function registerDefaultCanvasCommands(_0x2d1c8a = commandRegistry) {
  return (
    registerGraphCommands(_0x2d1c8a),
    registerSelectionCommands(_0x2d1c8a),
    registerViewportCommands(_0x2d1c8a),
    registerPromptCommands(_0x2d1c8a),
    registerModelParamCommands(_0x2d1c8a),
    registerLayoutCommands(_0x2d1c8a),
    registerGenerationCommands(_0x2d1c8a),
    _0x2d1c8a
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
  executeCanvasCommandPlan,
  hasCanvasCommandPlanVariableReference,
};
