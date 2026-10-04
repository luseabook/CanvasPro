import nodeRuntimeRegistry from '../../core/nodeRuntimeRegistry.js';
import { shouldUsePromptPreviewForPreset } from '../../modules/nodePromptShared.js';
import { isPreviewModeEnabled } from '../../modules/previewMode.js';
export function createImageGenerationPresentationModule(
  { store: store, startLoading: startLoading, stopLoading: stopLoading },
  _handleGenerateOrCancel,
) {
  return {
    _getImageExecution() {
      if (this['_imagePresentationUnmounted']) return null;
      const enabled = nodeRuntimeRegistry['resolve'](this['nodeId'], { store: store });
      if (!enabled?.['attachPresentation']) return null;
      return (
        this['_imageExecution'] !== enabled &&
          (this['_detachImagePresentation']?.(),
          (this['_imageExecution'] = enabled),
          (this['_detachImagePresentation'] = enabled['attachPresentation']({
            flushPrompt: () => this['_flushPromptHtmlCommit']?.(),
            onStateChange: (value) => {
              ((this['_generationSubmitInFlight'] = value['submitting'] === !![]),
                (this['_isGenerating'] = value['isGenerating']));
              if (this['previewEl']) {
                if (value['isGenerating']) startLoading(this['previewEl']);
                else stopLoading(this['previewEl']);
              }
              this['_updateSubmitButtonState']?.();
            },
          }))),
        enabled
      );
    },
    runGeneration(options = {}) {
      return this['_onGenerate'](null, options);
    },
    _onGenerate(value2 = null, item = {}) {
      if (item['insertPrompt'] || shouldUsePromptPreviewForPreset(value2) || isPreviewModeEnabled())
        return _handleGenerateOrCancel['_executeGeneration']['call'](this, value2, item);
      return this['_getImageExecution']()?.['runPreset'](value2, item);
    },
    _buildPayload(key) {
      return this['_getImageExecution']()?.['buildPayload'](key);
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
    _handleGenerateOrCancel: _handleGenerateOrCancel['_handleGenerateOrCancel'],
    _getPreviewGenerateButtonLoadingOptions:
      _handleGenerateOrCancel['_getPreviewGenerateButtonLoadingOptions'],
    unmount() {
      (this['_flushPromptHtmlCommit']?.(),
        (this['_imagePresentationUnmounted'] = !![]),
        this['_detachImagePresentation']?.(),
        (this['_detachImagePresentation'] = null),
        (this['_imageExecution'] = null),
        _handleGenerateOrCancel['unmount']['call'](this));
    },
  };
}
