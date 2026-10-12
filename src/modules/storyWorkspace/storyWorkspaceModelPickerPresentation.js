// Loading-overlay + model picker helpers extracted from storyWorkspace.js.

import {
  escapeHtml,
  isUsableImageUrl,
  toModelSearchText,
} from './storyWorkspaceSharedHelpers.js';
import { renderWorkspaceAssetLoadingOverlay } from '../workspaceAssetPresentation.js';
import {
  getStoryWorkspaceModelChoice,
  getStoryWorkspaceModelOptions,
} from './storyWorkspaceModelCatalog.js';

export function renderStoryAssetLoadingOverlay({
  compact: compact = false,
  title: title = '图片生成中',
  description: description,
} = {}) {
  return renderWorkspaceAssetLoadingOverlay({ compact: compact, title: title, description: description });
}
export function renderModelIcon(enabled, value9 = 'story-model-icon') {
  if (!enabled?.icon || !isUsableImageUrl(enabled.icon)) return '';
  return (
    '<img class="' +
    escapeHtml(value9) +
    '" src="' +
    escapeHtml(enabled.icon) +
    '" alt="" loading="eager" decoding="async">'
  );
}
export function renderModelPicker(value10, value11, value12) {
  const value13 = value10.models[value11],
    storyWorkspaceModelChoice = getStoryWorkspaceModelChoice(value11, value13),
    list5 = getStoryWorkspaceModelOptions(value11),
    map = new Map();
  list5.forEach((value14) => {
    if (!map.has(value14.providerLabel)) map.set(value14.providerLabel, []);
    map.get(value14.providerLabel).push(value14);
  });
  const value15 = [...map.entries()]
    .map(
      ([value16, list6]) =>
        '<section class="story-model-group">\n        <h4>' +
        escapeHtml(value16) +
        '</h4>\n        ' +
        list6.map(
          (value17) =>
            '<button type="button" class="story-model-option ' +
            (value17.modelId === storyWorkspaceModelChoice?.modelId ? 'is-selected' : '') +
            '" data-story-model-option="' +
            escapeHtml(value17.modelId) +
            '" data-story-model-kind="' +
            escapeHtml(value11) +
            '" data-story-model-search="' +
            escapeHtml(toModelSearchText(value17)) +
            '" role="option" aria-selected="' +
            (value17.modelId === storyWorkspaceModelChoice?.modelId) +
            '">\n              ' +
            renderModelIcon(value17) +
            '\n              <span class="story-model-option-copy">\n                <strong>' +
            escapeHtml(value17.label) +
            '</strong>\n                <small>' +
            escapeHtml(value17.description || value17.providerLabel) +
            '</small>\n              </span>\n              ' +
            (value17.vip ? '<span class="story-model-vip">VIP</span>' : '') +
            '\n            </button>',
        ).join('') +
        '\n      </section>',
    )
    .join('');
  return (
    '<div class="story-model-picker" data-story-model-picker="' +
    escapeHtml(value12) +
    '">\n    <button type="button" class="story-model-trigger" data-story-model-trigger aria-haspopup="listbox" aria-expanded="false">\n      ' +
    renderModelIcon(storyWorkspaceModelChoice) +
    '\n      <span class="story-model-trigger-copy">\n        <small>' +
    (value11 === 'text' ? '文本模型' : value11 === 'image' ? '图像模型' : '视频模型') +
    '</small>\n        <strong>' +
    escapeHtml(storyWorkspaceModelChoice?.label || '选择模型') +
    '</strong>\n      </span>\n    </button>\n    <div class="story-model-popover" data-story-model-popover role="listbox">\n      <label class="story-model-search-wrap">\n        <span>搜索模型</span>\n        <input type="search" class="story-model-search" data-story-model-search-input placeholder="输入模型或厂商名称" autocomplete="off">\n      </label>\n      <div class="story-model-options">' +
    value15 +
    '</div>\n    </div>\n  </div>'
  );
}
