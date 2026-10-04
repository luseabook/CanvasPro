import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdownToHtml } from './markdownRenderer.js';
(test('aigenText markdown renderer: renders common chat markdown safely', () => {
  const html = renderMarkdownToHtml(
    ['### Title', '', '**Lead** text', '', '- one', '- `two`', '', '<script>alert(1)</script>'].join('\n'),
  );
  assert.equal(
    html,
    '<h3>Title</h3><p><strong>Lead</strong> text</p><ul><li>one</li><li><code>two</code></li></ul><p>&lt;script&gt;alert(1)&lt;/script&gt;</p>',
  );
}),
  test('aigenText markdown renderer: keeps fenced code as code text', () => {
    const html2 = renderMarkdownToHtml(['```js', 'const a = **1**;', '```'].join('\n'));
    assert.equal(html2, '<pre><code>const a = **1**;</code></pre>');
  }),
  test('aigenText markdown renderer: keeps underscores inside words literal', () => {
    const html3 = renderMarkdownToHtml('E2E_TEXT_OK and _emphasis_');
    assert.equal(html3, '<p>E2E_TEXT_OK and <em>emphasis</em></p>');
  }),
  test('aigenText markdown renderer: renders GitHub style markdown tables', () => {
    const html4 = renderMarkdownToHtml(
      [
        '| 编号 | 任务类型 | 使用方法 |',
        '|---|---|---|',
        '| 0 | `t2v文本到视频` | 无入参，适用于纯文本生成视频。 |',
        '| 1 | **i2v图片到视频** | 图像，适用于图片动态化。 |',
      ].join('\n'),
    );
    assert.equal(
      html4,
      '<table><thead><tr><th>编号</th><th>任务类型</th><th>使用方法</th></tr></thead><tbody><tr><td>0</td><td><code>t2v文本到视频</code></td><td>无入参，适用于纯文本生成视频。</td></tr><tr><td>1</td><td><strong>i2v图片到视频</strong></td><td>图像，适用于图片动态化。</td></tr></tbody></table>',
    );
  }),
  test('aigenText markdown renderer: keeps escaped pipes inside table cells', () => {
    const html5 = renderMarkdownToHtml(
      ['| 路径 | 说明 |', '|---|---|', '| H:\\\\AI\\|Canvas | 保留内容 |'].join('\n'),
    );
    assert.equal(
      html5,
      '<table><thead><tr><th>路径</th><th>说明</th></tr></thead><tbody><tr><td>H:\\\\AI|Canvas</td><td>保留内容</td></tr></tbody></table>',
    );
  }));
