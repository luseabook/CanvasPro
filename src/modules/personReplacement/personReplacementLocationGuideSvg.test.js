import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildPersonReplacementLocationGuideSvg,
  resolvePersonReplacementLocationGuidePreview,
} from './personReplacementLocationGuideSvg.js';
import { PERSON_REPLACEMENT_MARKER_COLORS } from './personReplacementPromptMode.js';

test('personReplacementLocationGuideSvg: 基础尺寸按画幅比例推算，人物框落位正确', () => {
  const result = buildPersonReplacementLocationGuideSvg({
    frame: { width: 1200, height: 600 },
    people: [
      { label: '主角', bbox: { x: 0.25, y: 0.5, width: 0.2, height: 0.2 }, markerIndex: 1 },
    ],
  });

  assert.equal(result.width, 1200);
  assert.equal(result.height, 600);
  assert.equal(result.personCount, 1);
  const svg = decodeURIComponent(result.dataUrl.slice(result.dataUrl.indexOf(',') + 1));
  assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600"'));
  assert.ok(svg.includes('d="M300 0V600 M0 150H1200"'), '25% 参考线');
  assert.ok(svg.includes('d="M600 0V600 M0 300H1200"'), '50% 参考线');
  assert.ok(svg.includes('<rect x="300" y="300" width="240" height="120" rx="10"'), '人物框按比例定位');
  const color = 'var(' + PERSON_REPLACEMENT_MARKER_COLORS[1 % PERSON_REPLACEMENT_MARKER_COLORS.length] + ')';
  assert.ok(svg.includes('fill="' + color + '"'));
  assert.ok(svg.includes('data-person-label="主角"'));
});

test('personReplacementLocationGuideSvg: 缺省画幅按 16:9，人物序号按出现顺序取色', () => {
  const result = buildPersonReplacementLocationGuideSvg({
    people: [
      { label: '甲', bbox: { x: 0, y: 0, width: 0.1, height: 0.1 } },
      { label: '乙', bbox: { x: 0.5, y: 0.5, width: 0.1, height: 0.1 } },
    ],
  });
  assert.equal(result.width, 1200);
  assert.equal(result.height, 675);
  const svg = decodeURIComponent(result.dataUrl.slice(result.dataUrl.indexOf(',') + 1));
  assert.ok(svg.includes('data-person-label="甲"'));
  assert.ok(svg.includes('data-person-label="乙"'));
  assert.ok(svg.includes('x="0" y="0" width="120" height="68"'));
  assert.ok(svg.includes('x="600" y="338" width="120" height="68"'), '四舍五入后的第二个人物框');
});

test('personReplacementLocationGuideSvg: 标签做 XML 转义，防止注入标记结构', () => {
  const result = buildPersonReplacementLocationGuideSvg({
    people: [{ label: 'A<b>&"c"', bbox: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 } }],
  });
  const svg = decodeURIComponent(result.dataUrl.slice(result.dataUrl.indexOf(',') + 1));
  assert.ok(svg.includes('data-person-label="A&lt;b&gt;&amp;&quot;c&quot;"'));
  assert.ok(svg.includes('>A&lt;b&gt;&amp;&quot;c&quot;</text>'));
  assert.equal(svg.includes('<b>'), false);
});

test('personReplacementLocationGuideSvg: 没有人物时只画参考网格', () => {
  const result = buildPersonReplacementLocationGuideSvg({ people: [] });
  const svg = decodeURIComponent(result.dataUrl.slice(result.dataUrl.indexOf(',') + 1));
  assert.equal(result.personCount, 0);
  assert.equal(svg.includes('data-person-label'), false);
  assert.ok(svg.includes('<rect width="100%" height="100%" fill="var(--canvas-black)"/>'));
});

test('personReplacementLocationGuideSvg: 无 DOM 环境下预览地址原样返回', () => {
  const url = 'data:image/svg+xml;charset=utf-8,x';
  assert.equal(resolvePersonReplacementLocationGuidePreview(url), url);
  assert.equal(resolvePersonReplacementLocationGuidePreview(''), '');
});
