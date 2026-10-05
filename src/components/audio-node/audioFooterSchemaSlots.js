import { renderModelUiSchemaControls } from '../aigenImage/uiSchemaRenderer.js';
import { getModelManifest } from '../../manifests/index.js';
import { isRunningHubAiAppManifest, resolveCustomAiAppNodeManifest } from '../shared/rhAiAppNodeBehavior.js';
import { buildAudioModelMenuHtml, buildAudioModelTriggerHtml } from './audioModelMenuHelpers.js';
import { ADVANCED_SETTINGS_TUNE_ICON_MARKUP } from '../sharedIconMarkup.js';
export function isRunningHubAudioWorkflowItem(options = {}) {
  const value = String(options?.['provider'] || '')
      ['trim']()
      ['toLowerCase'](),
    item = String(options?.['adapterType'] || '')
      ['trim']()
      ['toLowerCase']();
  return value === 'runninghubwf' && item === 'workflow';
}
function getAudioWorkflowManifest(event = {}, args = {}) {
  const key = String(event?.['key'] || event?.['modelId'] || '')['trim']();
  return (
    resolveCustomAiAppNodeManifest({
      ...args,
      model: key,
      provider: event?.['provider'] || args?.['provider'],
    }) || getModelManifest(key)
  );
}
function renderAudioWorkflowSchemaControl(index, result, data = {}) {
  const enabled = String(index?.['key'] || index?.['modelId'] || '')['trim']();
  if (!enabled) return '';
  return renderModelUiSchemaControls(enabled, result, data);
}
export function isRhAiAppAudioWorkflow(options2 = {}, target = {}) {
  return isRunningHubAiAppManifest(getAudioWorkflowManifest(options2, target));
}
export function renderAudioWorkflowFooterSchemaControls(source, next = {}) {
  return {
    batch: renderAudioWorkflowSchemaControl(source, next, { placement: 'batch' }),
    mode: renderAudioWorkflowSchemaControl(source, next, { placement: 'mode' }),
    advanced: renderAudioWorkflowSchemaControl(source, next, { placement: 'advanced' }),
    instance: isRunningHubAudioWorkflowItem(source)
      ? renderAudioWorkflowSchemaControl(source, next, { placement: 'instance', variant: 'instanceToggle' })
      : '',
  };
}
export function buildAudioWorkflowFooterHtml({
  workflow: workflow,
  nodeData: nodeData = {},
  workflowItems: workflowItems = [],
  labels: labels = {},
  debugIconHtml: debugIconHtml = '',
} = {}) {
  const {
      mode: mode,
      advanced: advanced,
      instance: instance,
      batch: batch,
    } = renderAudioWorkflowFooterSchemaControls(workflow, nodeData),
    current = String(labels['advanced'] || '高级设置')
      ['replace'](/&/g, '&amp;')
      ['replace'](/"/g, '&quot;')
      ['replace'](/</g, '&lt;')
      ['replace'](/>/g, '&gt;'),
    audioModelMenuHtml = buildAudioModelMenuHtml({
      activeModel: workflow?.['key'],
      workflowItems: workflowItems,
    });
  return (
    '\n          <div class="img-model-pills">\n            <div class="img-model-wrap" style="position:relative;">\n              ' +
    buildAudioModelTriggerHtml({
      label: workflow?.['label'],
      activeProvider: workflow?.['provider'] || '',
      icon: workflow?.['icon'] || '',
      iconAlt: workflow?.['iconAlt'] || '',
      iconHtml: workflow?.['iconHtml'] || '',
    }) +
    '\n              ' +
    audioModelMenuHtml +
    '\n            </div>\n            <div class="ui-schema-placement ui-schema-mode-slot" style="' +
    (mode ? '' : 'display:none;') +
    '">\n              ' +
    mode +
    '\n            </div>\n          </div>\n          <div class="prompt-actions">\n            <div class="ui-schema-placement ui-schema-batch-slot" style="' +
    (batch ? '' : 'display:none;') +
    '">' +
    batch +
    '</div>\n            <div class="rh-adv-wrap" style="position:relative;' +
    (advanced ? '' : 'display:none;') +
    '">\n              <button type="button" class="img-pill-btn rh-adv-btn advanced-settings-icon-button" data-tooltip="' +
    current +
    '" aria-label="' +
    current +
    '" aria-expanded="false">' +
    ADVANCED_SETTINGS_TUNE_ICON_MARKUP +
    '</button>\n            </div>\n            <button type="button" class="prompt-submit debug-wrench-btn" title="' +
    (labels['debugTitle'] || '') +
    '">\n              ' +
    debugIconHtml +
    '\n            </button>\n            <div class="ui-schema-placement ui-schema-instance-slot" style="' +
    (instance ? '' : 'display:none;') +
    '">\n              ' +
    instance +
    '\n            </div>\n            <button type="button" class="prompt-submit img-gen-btn" title="' +
    (labels['generateTitle'] || '') +
    '">\n              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>\n            </button>\n          </div>\n          <div class="rh-adv-panel">\n            ' +
    advanced +
    '\n          </div>'
  );
}
function updateHtmlSlot(enabled2, entry) {
  if (!enabled2) return;
  ((enabled2['innerHTML'] = entry || ''), (enabled2['style']['display'] = entry ? '' : 'none'));
}
export function applyAudioWorkflowFooterSchemaControls({
  workflow: workflow2,
  nodeData: nodeData = {},
  modeSlot: modeSlot,
  advancedPanel: advancedPanel,
  advancedWrap: advancedWrap,
  advancedButton: advancedButton,
  instanceSlot: instanceSlot,
  batchSlot: batchSlot,
} = {}) {
  const renderAudioWorkflowFooterSchemaControls2 = renderAudioWorkflowFooterSchemaControls(
    workflow2,
    nodeData,
  );
  (updateHtmlSlot(modeSlot, renderAudioWorkflowFooterSchemaControls2['mode']),
    updateHtmlSlot(instanceSlot, renderAudioWorkflowFooterSchemaControls2['instance']),
    updateHtmlSlot(batchSlot, renderAudioWorkflowFooterSchemaControls2['batch']));
  if (advancedPanel) advancedPanel['innerHTML'] = renderAudioWorkflowFooterSchemaControls2['advanced'] || '';
  if (advancedWrap)
    advancedWrap['style']['display'] = renderAudioWorkflowFooterSchemaControls2['advanced'] ? '' : 'none';
  return (
    !renderAudioWorkflowFooterSchemaControls2['advanced'] &&
      (advancedPanel?.['classList']?.['remove']?.('show'),
      advancedButton?.['classList']?.['remove']?.('active')),
    advancedButton?.['setAttribute']?.(
      'aria-expanded',
      String(advancedPanel?.['classList']?.['contains']?.('show') === !![]),
    ),
    renderAudioWorkflowFooterSchemaControls2
  );
}
export function updateAudioModelTriggerIcon(el, record = {}) {
  const payload = String(record?.['iconHtml'] || '')['trim']();
  if (payload && el && typeof document !== 'undefined') {
    const handle = el?.['querySelector']?.('.img-model-label') || null,
      state = el?.['querySelector']?.('.node-menu-icon, .node-menu-icon-small, img'),
      config = document['createElement']('template');
    config['innerHTML'] = payload;
    const scope = config['content']['firstElementChild'];
    scope && handle && (state?.['remove']?.(), el['insertBefore'](scope, handle));
    return;
  }
  const enabled3 = el?.['querySelector']?.('img');
  if (!enabled3) return;
  const input = String(record?.['provider'] || '')['trim'](),
    output =
      String(record?.['icon'] || '')['trim']() ||
      (input === 'volcengine-speech' ? 'images/volcengine.svg' : 'images/RH.png'),
    value2 =
      String(record?.['iconAlt'] || '')['trim']() ||
      (input === 'volcengine-speech' ? 'volcengine-speech' : 'runninghub');
  (enabled3['setAttribute']?.('src', output),
    enabled3['setAttribute']?.('alt', value2),
    (enabled3['src'] = output),
    (enabled3['alt'] = value2));
}
