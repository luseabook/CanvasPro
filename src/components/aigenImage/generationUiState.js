import { resetGenerateButtonIdleUi as resetGenerateButtonIdleUi_2 } from '../../modules/previewGenerateButtonUi.js';
import {
  isDreaminaTaskTerminal,
  isTaskCancelled,
  isTaskFailed,
  isTaskRunning,
  isTaskTerminal,
} from '../../core/generationTaskUiState.js';
export function isTerminalGenerationUiState(_0x2047f9) {
  return isTaskTerminal(_0x2047f9) && !isTaskRunning(_0x2047f9);
}
export function isFailureGenerationUiState(_0x30085f) {
  return isTaskFailed(_0x30085f) || isTaskCancelled(_0x30085f);
}
export function isDreaminaTerminalGenerationState(_0xd61ff7) {
  return isDreaminaTaskTerminal(_0xd61ff7);
}
export function resetGenerateButtonIdleUi(_0x327a32) {
  resetGenerateButtonIdleUi_2(_0x327a32);
}
