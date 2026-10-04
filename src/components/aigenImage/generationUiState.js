import { resetGenerateButtonIdleUi as resetGenerateButtonIdleUi_2 } from '../../modules/previewGenerateButtonUi.js';
import {
  isDreaminaTaskTerminal,
  isTaskCancelled,
  isTaskFailed,
  isTaskRunning,
  isTaskTerminal,
} from '../../core/generationTaskUiState.js';
export function isTerminalGenerationUiState(value) {
  return isTaskTerminal(value) && !isTaskRunning(value);
}
export function isFailureGenerationUiState(item) {
  return isTaskFailed(item) || isTaskCancelled(item);
}
export function isDreaminaTerminalGenerationState(key) {
  return isDreaminaTaskTerminal(key);
}
export function resetGenerateButtonIdleUi(index) {
  resetGenerateButtonIdleUi_2(index);
}
