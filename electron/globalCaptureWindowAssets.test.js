import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

import { GLOBAL_CAPTURE_ACTION_IDS } from './globalCaptureWindowController.js';
import { resolveContextMenuIconDefinition } from '../src/utils/contextMenuIconCatalog.js';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const htmlPath = join(here, 'globalCaptureWindow.html');
const rendererPath = join(here, 'globalCaptureWindow.js');
const cssPath = join(repoRoot, 'styles', 'global-capture-window.css');
const variablesPath = join(repoRoot, 'styles', 'variables.css');
const themeDir = join(repoRoot, 'styles', 'themes');

const html = readFileSync(htmlPath, 'utf8');
const renderer = readFileSync(rendererPath, 'utf8');
const css = readFileSync(cssPath, 'utf8');

function uniqueMatches(text, pattern) {
  return [...new Set([...text.matchAll(pattern)].map((match) => match[1]))];
}

test('the panel document declares the module entry, the theme hooks and the stylesheets', () => {
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html lang="zh-CN" data-theme="dark">/);
  assert.match(html, /<meta charset="utf-8"\s*\/?>/);
  assert.match(html, /http-equiv="Content-Security-Policy"/);
  assert.match(html, /content="default-src 'self'; style-src 'self'; script-src 'self'"/);
  assert.match(html, /<script type="module" src="\.\/globalCaptureWindow\.js"><\/script>/);

  const links = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"\s*\/?>/g)].map((match) => match[1]);
  assert.deepEqual(links, [
    '../styles/variables.css',
    '../styles/themes/light.css',
    '../styles/global-capture-window.css',
  ]);
});

test('the panel document is rebranded and carries no legacy brand string', () => {
  assert.match(html, /<title>发送到 Canvas 无限画布<\/title>/);
  for (const [label, text] of [
    ['html', html],
    ['renderer', renderer],
    ['stylesheet', css],
  ]) {
    assert.doesNotMatch(text, /\bShuo\b|SHUO/, `${label} keeps no legacy brand string`);
  }
});

test('the panel offers exactly the action ids the controller accepts', () => {
  const actionIds = uniqueMatches(html, /data-action-id="([^"]+)"/g);
  assert.deepEqual(actionIds, [...GLOBAL_CAPTURE_ACTION_IDS]);
  assert.deepEqual(actionIds, ['source-text', 'ai-text', 'ai-image', 'ai-video', 'preset-draft']);

  const keyboardShortcuts = uniqueMatches(html, /aria-keyshortcuts="([^"]+)"/g);
  assert.deepEqual(keyboardShortcuts, ['1', '2', '3', '4', '5']);
});

test('the toolbar button order matches the renderer action order', () => {
  const toolbar = html.slice(html.indexOf('id="actionList"'), html.indexOf('id="captureDetails"'));
  const toolbarButtons = [...toolbar.matchAll(/<button\b[^>]*>/g)].map((match) => match[0]);
  assert.equal(toolbarButtons.length, 5);

  const toolbarActionIds = toolbarButtons.map((tag) => /data-action-id="([^"]+)"/.exec(tag)?.[1] ?? null);
  assert.deepEqual(toolbarActionIds, ['source-text', 'ai-text', 'ai-image', 'ai-video', null]);
  assert.match(toolbarButtons[4], /id="moreToggle"/);
  assert.deepEqual(
    toolbarButtons.slice(1, 4).map((tag) => /data-icon="([^"]+)"/.exec(tag)?.[1]),
    ['text', 'image', 'video'],
  );
});

test('every icon the panel requests resolves in the repository catalogue', () => {
  const iconIds = uniqueMatches(html, /data-icon="([^"]+)"/g);
  assert.deepEqual(iconIds, ['add-to-canvas', 'text', 'image', 'video', 'save', 'cancel']);
  for (const iconId of iconIds) {
    const definition = resolveContextMenuIconDefinition(iconId);
    assert.ok(definition, `${iconId} resolves`);
    assert.equal(definition.id, iconId);
  }
});

test('every element id the renderer looks up exists in the panel document', () => {
  const lookedUp = uniqueMatches(renderer, /getElementById\('([^']+)'\)/g).sort();
  assert.ok(lookedUp.length >= 12, 'the renderer reads the panel through getElementById');

  const declared = uniqueMatches(html, /id="([^"]+)"/g);
  for (const id of lookedUp) assert.ok(declared.includes(id), `${id} is declared in the panel document`);

  for (const id of ['capturePanel', 'actionList', 'captureDetails', 'textPreview', 'moreToggle']) {
    assert.ok(lookedUp.includes(id), `${id} is part of the renderer contract`);
  }
});

test('every custom property the panel stylesheet reads is defined for the app', () => {
  const used = uniqueMatches(css, /var\((--[a-z0-9-]+)/g);
  const defined = new Set(
    [variablesPath, ...readdirSync(themeDir).map((name) => join(themeDir, name))]
      .map((path) => readFileSync(path, 'utf8'))
      .flatMap((text) => uniqueMatches(text, /(--[a-z0-9-]+)\s*:/g)),
  );

  const missing = used.filter((token) => !defined.has(token));
  assert.deepEqual(missing, [], `undefined custom properties: ${missing.join(', ')}`);
  assert.ok(used.includes('--font-ui'), 'the panel typography depends on --font-ui');
});

test('the host-side panel files the window controller loads sit side by side', () => {
  const hostFiles = [
    'globalCaptureWindow.html',
    'globalCaptureWindow.js',
    'globalCaptureWindowPreload.cjs',
    'globalCaptureWindowController.js',
    'globalCaptureControllers.js',
  ];
  for (const name of hostFiles) {
    assert.ok(existsSync(join(here, name)), `${name} ships next to the loader`);
  }
  assert.ok(existsSync(join(repoRoot, 'styles', 'global-capture-window.css')));
  assert.match(
    renderer,
    /^import \{ createContextMenuIcon \} from '\.\.\/src\/modules\/interaction\/contextMenuIcons\.js';$/m,
  );
  assert.match(
    renderer,
    /^import \{ scrollElementHorizontallyWithWheel \} from '\.\.\/src\/modules\/workspaceHorizontalWheel\.js';$/m,
  );
});

test('the panel stylesheet keeps the layout contract the renderer toggles', () => {
  assert.match(css, /\.global-capture \[hidden\]\s*\{\s*display: none;/);
  assert.match(css, /\.global-capture\.is-above\s*\{\s*flex-direction: column-reverse;/);
  assert.match(css, /\.global-capture\.is-capturing \.global-capture__more svg\s*\{\s*visibility: hidden;/);
  assert.match(css, /\.global-capture\[aria-busy='true'\] \.global-capture__spinner\s*\{/);
  assert.match(css, /\.global-capture__toggle\[aria-checked='true'\]/);
  assert.match(css, /@keyframes global-capture-spin/);

  for (const className of [
    'global-capture__toolbar',
    'global-capture__action',
    'global-capture__divider',
    'global-capture__details',
    'global-capture__preview',
    'global-capture__option',
    'global-capture__toggle',
    'global-capture__feedback',
    'global-capture__retry',
    'global-capture__close',
    'global-capture__spinner',
  ]) {
    assert.ok(css.includes(`.${className}`), `${className} is styled`);
    assert.ok(html.includes(className), `${className} is used by the panel document`);
  }
});
