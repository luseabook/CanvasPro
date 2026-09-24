import assert from 'node:assert/strict';
import test from 'node:test';

import { formatAgentAssistantMarkdown } from './agentAssistantMarkdown.js';

test('助手 Markdown：空串与纯空白归一为空', () => {
  assert.equal(formatAgentAssistantMarkdown(''), '');
  assert.equal(formatAgentAssistantMarkdown('   \n  '), '');
  assert.equal(formatAgentAssistantMarkdown(null), '');
});

test('助手 Markdown：统一换行并首尾收口', () => {
  assert.equal(formatAgentAssistantMarkdown('a\r\n\r\nb'), 'a\n\nb');
  assert.equal(formatAgentAssistantMarkdown('  a\rb  '), 'a\nb');
});

test('助手 Markdown：含代码围栏的整段原样透传', () => {
  const fenced = '说明\n```js\nconst a = 1;\n```\n结束';
  assert.equal(formatAgentAssistantMarkdown(fenced), fenced);
  assert.equal(formatAgentAssistantMarkdown('x ```code``` y'), 'x ```code``` y');
});

test('助手 Markdown：分隔线后紧跟正文时补出块边界', () => {
  assert.equal(formatAgentAssistantMarkdown('标题\n\n--- 正文'), '标题\n\n---\n\n正文');
  assert.equal(formatAgentAssistantMarkdown('标题\n\n*** 正文'), '标题\n\n***\n\n正文');
  assert.equal(formatAgentAssistantMarkdown('标题\n\n___ 正文'), '标题\n\n___\n\n正文');
});

test('助手 Markdown：句号后的小标题另起一段', () => {
  assert.equal(formatAgentAssistantMarkdown('第一段。**标题**：内容'), '第一段。\n\n**标题**：内容');
  assert.equal(formatAgentAssistantMarkdown('核心概念：**主题**：内容'), '核心概念：\n\n**主题**：内容');
});

test('助手 Markdown：标题行被同行加粗尾巴挤占时断开', () => {
  assert.equal(formatAgentAssistantMarkdown('# 标题  **子标题**：值'), '# 标题\n\n**子标题**：值');
});

test('助手 Markdown：冒号后的有序列表逐项换行', () => {
  assert.equal(formatAgentAssistantMarkdown('正文：1. 甲 2. 乙'), '正文：1. 甲\n2. 乙');
});

test('助手 Markdown：成对加粗保留，孤立起始加粗被剥离', () => {
  assert.equal(formatAgentAssistantMarkdown('甲**乙**丙'), '甲**乙**丙');
  assert.equal(formatAgentAssistantMarkdown('说了**重要**的'), '说了**重要**的');
  assert.equal(formatAgentAssistantMarkdown('甲**乙'), '甲乙');
  assert.equal(formatAgentAssistantMarkdown('**未闭合 加粗'), '未闭合 加粗');
});

test('助手 Markdown：连续空行压缩为一个段落分隔', () => {
  assert.equal(formatAgentAssistantMarkdown('a\n\n\n\n\nb'), 'a\n\nb');
  assert.ok(!/\n{3,}/.test(formatAgentAssistantMarkdown('第一段。\n\n\n\n第二段。')));
});
