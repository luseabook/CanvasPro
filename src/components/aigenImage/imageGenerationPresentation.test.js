import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';

import nodeRuntimeRegistry from '../../core/nodeRuntimeRegistry.js';
import { createImageGenerationPresentationModule } from './imageGenerationPresentation.js';

afterEach(() => {
  nodeRuntimeRegistry.clear();
});

function createPresentation(overrides = {}) {
  let starts = 0;
  let stops = 0;
  let flushes = 0;
  let baseUnmounts = 0;
  const implementation = {
    _executeGeneration: function _executeGeneration(preset, options) {
      this.baseGeneration = { preset, options };
      return 'base-generation';
    },
    _handleGenerateOrCancel() {},
    _getPreviewGenerateButtonLoadingOptions() {
      return {};
    },
    unmount() {
      baseUnmounts += 1;
    },
  };
  const module = createImageGenerationPresentationModule(
    {
      store: {},
      startLoading() {
        starts += 1;
      },
      stopLoading() {
        stops += 1;
      },
    },
    implementation,
  );
  const context = Object.assign(module, {
    nodeId: 'node-presentation',
    previewEl: {},
    _flushPromptHtmlCommit() {
      flushes += 1;
    },
    _updateSubmitButtonState() {},
  });
  return {
    context,
    counters: {
      get starts() {
        return starts;
      },
      get stops() {
        return stops;
      },
      get flushes() {
        return flushes;
      },
      get baseUnmounts() {
        return baseUnmounts;
      },
    },
    overrides,
  };
}

test('imageGenerationPresentation: prompt insertion delegates to the legacy generation path', () => {
  const { context } = createPresentation();
  const result = context._onGenerate('preset-a', { insertPrompt: true, source: 'editor' });

  assert.equal(result, 'base-generation');
  assert.deepEqual(context.baseGeneration, {
    preset: 'preset-a',
    options: { insertPrompt: true, source: 'editor' },
  });
});

test('imageGenerationPresentation: attaches one execution owner and mirrors loading state', () => {
  let presentation = null;
  let detaches = 0;
  const runtime = {
    runGeneration() {},
    attachPresentation(nextPresentation) {
      presentation = nextPresentation;
      return () => {
        detaches += 1;
      };
    },
    getGenerationStatus() {
      return { nodeId: 'node-presentation', isGenerating: false, submitting: false };
    },
  };
  nodeRuntimeRegistry.register('node-presentation', runtime);
  const { context, counters } = createPresentation();

  assert.equal(context._getImageExecution(), runtime);
  assert.equal(context._getImageExecution(), runtime);
  assert.ok(presentation);

  presentation.onStateChange({ submitting: true, isGenerating: true });
  assert.equal(context._generationSubmitInFlight, true);
  assert.equal(context._isGenerating, true);
  assert.equal(counters.starts, 1);

  presentation.onStateChange({ submitting: false, isGenerating: false });
  assert.equal(context._generationSubmitInFlight, false);
  assert.equal(context._isGenerating, false);
  assert.equal(counters.stops, 1);
  assert.equal(detaches, 0);
});

test('imageGenerationPresentation: unmount detaches and calls the base lifecycle', () => {
  let detaches = 0;
  nodeRuntimeRegistry.register('node-presentation', {
    runGeneration() {},
    attachPresentation() {
      return () => {
        detaches += 1;
      };
    },
    getGenerationStatus() {
      return { nodeId: 'node-presentation', isGenerating: false, submitting: false };
    },
  });
  const { context, counters } = createPresentation();
  context._getImageExecution();
  context.unmount();

  assert.equal(counters.flushes, 1);
  assert.equal(detaches, 1);
  assert.equal(counters.baseUnmounts, 1);
  assert.equal(context._imagePresentationUnmounted, true);
});
