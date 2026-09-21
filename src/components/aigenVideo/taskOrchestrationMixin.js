export const videoTaskOrchestrationMixin = {
  async runGeneration(_0x22fa91 = {}) {
    return this._onGenerate(null, _0x22fa91);
  },
  async cancelGeneration() {
    return this._cancelRunningHubWorkflowTask();
  },
  getGenerationStatus() {
    const _0xe871fd = this._data || {},
      _0x1d3042 = String(
        _0xe871fd.jobStatus || _0xe871fd.videoJobStatus || (this._isGenerating ? 'running' : 'idle'),
      );
    return {
      nodeId: this.nodeId,
      jobStatus: _0x1d3042,
      isGenerating: this._isGenerating === true || _0x1d3042 === 'running' || _0x1d3042 === 'pending',
      taskId: String(this._rhTaskId || _0xe871fd.rhTaskId || _0xe871fd.asyncTaskId || _0xe871fd.taskId || ''),
      cancellable: true,
      resumable: false,
    };
  },
  async _handleGenerateOrCancel(_0x7c01c0 = null) {
    return this._handleGenerateOrCancelImpl(_0x7c01c0);
  },
  async _cancelRunningHubWorkflowTask() {
    return this._cancelRunningHubWorkflowTaskImpl();
  },
  async _onGenerate(_0x245ba1 = null, _0x4dc47d = {}) {
    return this._onGenerateImpl(_0x245ba1, _0x4dc47d);
  },
  async _buildPayload(_0x5b3376 = null, _0x474ea8 = {}) {
    return this._buildPayloadImpl(_0x5b3376, _0x474ea8);
  },
};
