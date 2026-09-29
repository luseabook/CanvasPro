import test from 'node:test';
import assert from 'node:assert/strict';

import {
  renderComfyUiCloudWorkflowLogoHtml,
  renderComfyUiGenericWorkflowLogoHtml,
  renderComfyUiLocalWorkflowLogoHtml,
  renderComfyUiWorkflowLogoHtmlFromIconKind,
  renderRunningHubAiAppLogoHtml,
} from './customAiAppLogo.js';

test('customAiAppLogo: renders the RunningHub badge', () => {
  const html = renderRunningHubAiAppLogoHtml();
  assert.match(html, /custom-ai-app-logo--runninghub/);
  assert.match(html, /aria-hidden="true">RH<\/span>/);
});

test('customAiAppLogo: keeps only safe class tokens', () => {
  const html = renderRunningHubAiAppLogoHtml({
    className: 'safe-name bad"quote onclick=alert(1) 9ok',
  });

  assert.match(html, /custom-ai-app-logo--runninghub safe-name 9ok/);
  assert.doesNotMatch(html, /bad"quote|onclick/);
});

test('customAiAppLogo: dispatches local, cloud, and generic ComfyUI icons', () => {
  const local = renderComfyUiLocalWorkflowLogoHtml();
  const cloud = renderComfyUiCloudWorkflowLogoHtml();
  const generic = renderComfyUiGenericWorkflowLogoHtml();

  assert.match(local, /custom-ai-app-logo--comfyui-local/);
  assert.match(local, /<rect/);
  assert.match(cloud, /custom-ai-app-logo--comfyui-cloud/);
  assert.match(cloud, /<path/);
  assert.match(generic, /custom-ai-app-logo--comfyui-generic/);
  assert.match(generic, />C<\/span>/);

  assert.equal(renderComfyUiWorkflowLogoHtmlFromIconKind('comfyUiCloudWorkflowBadge'), cloud);
  assert.equal(renderComfyUiWorkflowLogoHtmlFromIconKind('comfyUiLocalWorkflowBadge'), local);
  assert.equal(renderComfyUiWorkflowLogoHtmlFromIconKind('unknown'), generic);
});
