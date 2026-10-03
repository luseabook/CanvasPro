import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const stylesheet = readFileSync(new URL('../../../styles/story-workspace-modern.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../../../index.html', import.meta.url), 'utf8');
test('modern stylesheet is linked, scoped, and supports real menu state contracts', () => {
  assert.match(html, /href="styles\/story-workspace-modern\.css"/);
  for (const selector of ['.story-workspace-root[hidden]', '.story-hidden-input', '.story-page.is-current', '.story-home-param-picker.is-open > .story-home-param-popover', '.story-project-sort.is-open > .story-project-sort-menu']) assert.ok(stylesheet.includes(selector), selector);
  assert.ok(stylesheet.includes('@media (max-width: 760px)'));
  assert.ok(stylesheet.includes('prefers-reduced-motion'));
});
