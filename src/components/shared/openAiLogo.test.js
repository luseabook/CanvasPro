import test from 'node:test';
import assert from 'node:assert/strict';

import { renderOpenAiLogoHtml } from './openAiLogo.js';

test('openAiLogo: renders the fixed OpenAI SVG with accepted classes', () => {
  const html = renderOpenAiLogoHtml('provider-logo openai_logo');

  assert.match(html, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(html, /class="provider-logo openai_logo"/);
  assert.match(html, /viewBox="0 0 24 24"/);
  assert.match(html, /<path d="M9\.205 8\.658/);
});

test('openAiLogo: filters unsafe or malformed class tokens', () => {
  const html = renderOpenAiLogoHtml('safe onload=alert(1) "<script>"  spaced');
  assert.match(html, /class="safe spaced"/);
  assert.equal(html.includes('onload'), false);
  assert.equal(html.includes('<script>'), false);
});
