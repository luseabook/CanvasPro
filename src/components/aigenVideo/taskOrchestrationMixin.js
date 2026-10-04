export const videoTaskOrchestrationMixin = {
  async runGeneration(options = {}) {
    return this._onGenerate(null, options);
  },
  async cancelGeneration() {
    return this._cancelRunningHubWorkflowTask();
  },
  getGenerationStatus() {
    const value = this._data || {},
      jobStatus = String(
        value.jobStatus || value.videoJobStatus || (this._isGenerating ? 'running' : 'idle'),
      );
    return {
      nodeId: this.nodeId,
      jobStatus: jobStatus,
      isGenerating: this._isGenerating === true || jobStatus === 'running' || jobStatus === 'pending',
      taskId: String(this._rhTaskId || value.rhTaskId || value.asyncTaskId || value.taskId || ''),
      cancellable: true,
      resumable: false,
    };
  },
  async _handleGenerateOrCancel(value2 = null) {
    return this._handleGenerateOrCancelImpl(value2);
  },
  async _cancelRunningHubWorkflowTask() {
    return this._cancelRunningHubWorkflowTaskImpl();
  },
  async _onGenerate(value3 = null, item = {}) {
    return this._onGenerateImpl(value3, item);
  },
  async _buildPayload(value4 = null, key = {}) {
    return this._buildPayloadImpl(value4, key);
  },
};
