import nodeRuntimeRegistry from '../../core/nodeRuntimeRegistry.js';
import { shouldUsePromptPreviewForPreset } from '../../modules/nodePromptShared.js';
import { isPreviewModeEnabled } from '../../modules/previewMode.js';
export function createImageGenerationPresentationModule(
  { store: _0x1340fd, startLoading: _0x566c92, stopLoading: _0x566699 },
  _0x4d4934,
) {
  return {
    _getImageExecution() {
      if (this['_imagePresentationUnmounted']) return null;
      const _0xb44391 = nodeRuntimeRegistry['resolve'](this['nodeId'], { store: _0x1340fd });
      if (!_0xb44391?.['attachPresentation']) return null;
      return (
        this['_imageExecution'] !== _0xb44391 &&
          (this['_detachImagePresentation']?.(),
          (this['_imageExecution'] = _0xb44391),
          (this['_detachImagePresentation'] = _0xb44391['attachPresentation']({
            flushPrompt: () => this['_flushPromptHtmlCommit']?.(),
            onStateChange: (_0x328dd9) => {
              ((this['_generationSubmitInFlight'] = _0x328dd9['submitting'] === !![]),
                (this['_isGenerating'] = _0x328dd9['isGenerating']));
              if (this['previewEl']) {
                if (_0x328dd9['isGenerating']) _0x566c92(this['previewEl']);
                else _0x566699(this['previewEl']);
              }
              this['_updateSubmitButtonState']?.();
            },
          }))),
        _0xb44391
      );
    },
    runGeneration(_0x3e815a = {}) {
      return this['_onGenerate'](null, _0x3e815a);
    },
    _onGenerate(_0x27d91f = null, _0x4349e9 = {}) {
      if (_0x4349e9['insertPrompt'] || shouldUsePromptPreviewForPreset(_0x27d91f) || isPreviewModeEnabled())
        return _0x4d4934['_executeGeneration']['call'](this, _0x27d91f, _0x4349e9);
      return this['_getImageExecution']()?.['runPreset'](_0x27d91f, _0x4349e9);
    },
    _buildPayload(_0x367e8b) {
      return this['_getImageExecution']()?.['buildPayload'](_0x367e8b);
    },
    getGenerationStatus() {
      return this['_getImageExecution']()?.['getGenerationStatus']();
    },
    cancelGeneration() {
      return this['_getImageExecution']()?.['cancelGeneration']();
    },
    _cancelRunningHubWorkflowTask() {
      return this['cancelGeneration']();
    },
    resumeGeneration() {
      return this['_getImageExecution']()?.['resumeGeneration']();
    },
    _handleGenerateOrCancel: _0x4d4934['_handleGenerateOrCancel'],
    _getPreviewGenerateButtonLoadingOptions: _0x4d4934['_getPreviewGenerateButtonLoadingOptions'],
    unmount() {
      (this['_flushPromptHtmlCommit']?.(),
        (this['_imagePresentationUnmounted'] = !![]),
        this['_detachImagePresentation']?.(),
        (this['_detachImagePresentation'] = null),
        (this['_imageExecution'] = null),
        _0x4d4934['unmount']['call'](this));
    },
  };
}
