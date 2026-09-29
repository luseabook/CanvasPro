import test from 'node:test';
import assert from 'node:assert/strict';
import { createPersonReplacementSmartDetectPresentation } from './personReplacementSmartDetectPresentation.js';

test('smartDetectPresentation: 工厂返回冻结的 renderPanel/renderTrigger', () => {
  const presentation = createPersonReplacementSmartDetectPresentation();
  assert.equal(Object.isFrozen(presentation), true);
  assert.deepEqual(Object.keys(presentation).sort(), ['renderPanel', 'renderTrigger']);
  assert.equal(typeof presentation.renderPanel, 'function');
  assert.equal(typeof presentation.renderTrigger, 'function');
});

test('smartDetectPresentation: renderTrigger 默认态与布尔开关', () => {
  const presentation = createPersonReplacementSmartDetectPresentation();
  const plain = presentation.renderTrigger();
  assert.equal(typeof plain, 'string');
  assert.equal(plain.includes('person-replacement-shot-cut-smart-detect '), true, '默认 class 带尾随空格');
  assert.equal(plain.includes('is-open'), false);
  assert.equal(plain.includes('aria-expanded="false"'), true);
  assert.equal(plain.includes('aria-haspopup="dialog"'), true);
  assert.equal(plain.includes('aria-controls="person-replacement-shot-cut-smart-detect-panel"'), true);
  assert.equal(plain.includes('aria-label="智能检测"'), true);
  assert.equal(plain.includes('<span>智能检测</span>'), true);
  assert.equal(plain.includes('is-loading'), false);
  assert.equal(plain.includes(' disabled'), false);
  assert.equal(plain.includes('检测中…'), false);

  const open = presentation.renderTrigger({ smartDetectOpen: true });
  assert.equal(open.includes('person-replacement-shot-cut-smart-detect is-open'), true);
  assert.equal(open.includes('aria-expanded="true"'), true);
  assert.equal(open.includes('aria-expanded="false"'), false);

  const loading = presentation.renderTrigger({ smartDetecting: true });
  assert.equal(loading.includes('person-replacement-keyframe-smart-detect is-loading'), true);
  assert.equal(loading.includes('aria-label="智能检测中"'), true);
  assert.equal(loading.includes('检测中…'), true);
  assert.equal(loading.includes('aria-expanded="false"'), true);

  const disabled = presentation.renderTrigger({ disabled: true });
  assert.equal(disabled.includes('aria-expanded="false" disabled>'), true);
});

test('smartDetectPresentation: renderTrigger 按真值内插（不要求严格 true）', () => {
  const presentation = createPersonReplacementSmartDetectPresentation();
  const truthy = presentation.renderTrigger({ smartDetectOpen: 1, smartDetecting: 'yes', disabled: 1 });
  assert.equal(truthy.includes('aria-expanded="1"'), true, '属性原样输出真值');
  assert.equal(truthy.includes('aria-label="智能检测中"'), true);
  assert.equal(truthy.includes('is-loading'), true);
  assert.equal(truthy.includes(' disabled>'), true);
  const falsy = presentation.renderTrigger({ smartDetectOpen: 0, smartDetecting: 0, disabled: 0 });
  assert.equal(falsy.includes('aria-expanded="0"'), true, '0 被当作假值但原样内插');
  assert.equal(falsy.includes('is-loading'), false);
  assert.equal(falsy.includes(' disabled'), false);
  assert.equal(falsy.includes('<span>智能检测</span>'), true);
});

test('smartDetectPresentation: renderIcon 只以 smartDetect 调用并原样嵌入', () => {
  const seen = [];
  const presentation = createPersonReplacementSmartDetectPresentation({
    renderIcon: (name) => {
      seen.push(name);
      return '<svg data-icon="' + name + '"></svg>';
    },
  });
  const trigger = presentation.renderTrigger();
  assert.deepEqual(seen, ['smartDetect'], '仅触发按钮取图标');
  assert.equal(trigger.includes('<svg data-icon="smartDetect"></svg>'), true);
  presentation.renderPanel({ settings: { smartClipMode: 'stable' } });
  assert.deepEqual(seen, ['smartDetect'], '面板不取图标');
  const defaultIcon = createPersonReplacementSmartDetectPresentation().renderTrigger();
  assert.equal(defaultIcon.includes('<svg'), false, '默认图标为空串');
});

test('smartDetectPresentation: renderPanel 只高亮当前 smartClipMode', () => {
  const presentation = createPersonReplacementSmartDetectPresentation();
  for (const mode of ['stable', 'balanced', 'sensitive']) {
    const html = presentation.renderPanel({ settings: { smartClipMode: mode } });
    assert.equal(html.includes('data-smart-clip-mode="' + mode + '"'), true, mode);
    assert.equal(html.split('is-active').length - 1, 1, '仅一个激活 ' + mode);
    assert.equal(html.split('aria-pressed="true"').length - 1, 1, mode);
    assert.equal(html.split('aria-pressed="false"').length - 1, 2, mode);
    const activeIndex = html.indexOf('is-active');
    const activeTag = html.slice(activeIndex, html.indexOf('>', activeIndex));
    assert.equal(activeTag.includes('data-smart-clip-mode="' + mode + '"'), true, mode);
    assert.equal(activeTag.includes('aria-pressed="true"'), true, mode);
  }
  const unknown = presentation.renderPanel({ settings: { smartClipMode: 'turbo' } });
  assert.equal(unknown.includes('is-active'), false);
  assert.equal(unknown.split('aria-pressed="true"').length - 1, 0);
  assert.equal(unknown.split('aria-pressed="false"').length - 1, 3);
  const empty = presentation.renderPanel({ settings: {} });
  assert.equal(empty.includes('is-active'), false);
});

test('smartDetectPresentation: renderPanel 的检测中态禁用确认并改写文案', () => {
  const presentation = createPersonReplacementSmartDetectPresentation();
  const idle = presentation.renderPanel({ settings: { smartClipMode: 'stable' } });
  assert.equal(idle.includes('aria-busy="false"'), true);
  assert.equal(idle.includes('aria-busy="true"'), false);
  assert.equal(idle.includes('>确定</button>'), true);
  assert.equal(idle.includes('检测中…'), false);
  assert.equal(idle.includes('is-loading'), false);
  assert.equal(idle.includes('disabled'), false);

  const busy = presentation.renderPanel({ settings: { smartClipMode: 'stable' } }, { smartDetecting: true });
  assert.equal(busy.includes('aria-busy="true"'), true);
  assert.equal(busy.includes('is-loading'), true);
  assert.equal(busy.includes(' disabled'), true);
  assert.equal(busy.includes('检测中…'), true);
  assert.equal(busy.includes('>确定</button>'), false);

  const truthy = presentation.renderPanel({ settings: { smartClipMode: 'stable' } }, { smartDetecting: 1 });
  assert.equal(truthy.includes('aria-busy="1"'), true, '非严格 true 原样内插');
  assert.equal(truthy.includes(' disabled'), true, '同一真值在布尔模板位按真处理');
  assert.equal(truthy.includes('检测中…'), true);
});

test('smartDetectPresentation: renderPanel 结构与入参稳定性', () => {
  const presentation = createPersonReplacementSmartDetectPresentation();
  const shot = { id: 's1', settings: { smartClipMode: 'balanced', extra: 1 } };
  const snapshot = JSON.stringify(shot);
  const first = presentation.renderPanel(shot);
  const second = presentation.renderPanel(shot);
  assert.equal(first, second, '同输入同输出');
  assert.equal(JSON.stringify(shot), snapshot, '入参未被改动');
  assert.equal(typeof first, 'string');
  assert.equal(first.includes('id="person-replacement-shot-cut-smart-detect-panel"'), true);
  assert.equal(first.includes('role="dialog"'), true);
  assert.equal(first.includes('aria-label="智能检测切口"'), true);
  assert.equal(first.includes('data-person-replacement-action="confirm-shot-cut-smart-detect"'), true);
  assert.equal(first.includes('data-person-replacement-action="set-shot-cut-smart-detect-mode"'), true);
  assert.equal(first.includes('set-smart-clip-mode'), false, '模式 action 名被覆盖');
  assert.equal(
    first.includes('<strong class="person-replacement-smart-clip-settings-title">智能检测</strong>'),
    true,
  );
  assert.equal(first.includes('person-replacement-shot-cut-smart-detect-footer'), true);
  assert.throws(() => presentation.renderPanel(), TypeError, '缺 shot 直接抛错');
});
