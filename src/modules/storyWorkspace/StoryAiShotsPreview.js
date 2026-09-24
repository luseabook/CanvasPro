function element(tag, className = '', text) {
  const node = document.createElement(tag); node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}
export function createStoryAiShotsPreview({ proposal, task, existingCount }) {
  const abort = new AbortController(), inputs = [];
  const root = element('section', 'sw-ai-shots-preview');
  const summary = element('p', 'sw-ai-shot-selection'); summary.setAttribute('role', 'status');
  function selected() { return inputs.flatMap((input, index) => input.checked ? [index] : []); }
  function update() {
    const indices = selected(), duration = indices.reduce((sum, index) => sum + proposal.shots[index].duration, 0);
    summary.textContent = `已选 ${indices.length} / ${proposal.shots.length} 镜，建议累计 ${Number(duration.toFixed(2))} 秒；追加至已有 ${existingCount} 镜之后，不替换原镜头。`;
  }
  const tools = element('div', 'sw-tools');
  for (const [label, checked] of [['全选分镜', true], ['取消全选', false]]) {
    const button = element('button', 'sw-button', label); button.type = 'button';
    button.addEventListener('click', () => { inputs.forEach(input => { input.checked = checked; }); update(); }, { signal: abort.signal }); tools.append(button);
  }
  const tableWrap = element('div', 'sw-ai-shot-table-wrap'), table = element('table', 'sw-ai-shot-table');
  const head = element('thead'), header = element('tr');
  for (const title of ['追加', '候选镜', '时长 / 景别', '人物 / 场景', '画面与详细内容']) { const th = element('th', '', title); th.scope = 'col'; header.append(th); }
  head.append(header); const body = element('tbody'); table.append(head, body); tableWrap.append(table);
  const names = {};
  for (const kind of ['characters', 'scenes']) names[kind] = new Map(task.context[kind].map(asset => [asset.id, `${asset.key} · ${asset.name}`]));
  proposal.shots.forEach((shot, index) => {
    const row = element('tr'), checkCell = element('td'), input = element('input'); input.type = 'checkbox'; input.checked = true;
    input.setAttribute('aria-label', `追加候选镜 ${index + 1}`);
    input.addEventListener('change', update, { signal: abort.signal }); inputs.push(input); checkCell.append(input);
    const people = shot.characterIds.map(id => names.characters.get(id)).join('、') || '人物未关联';
    const place = shot.sceneId ? names.scenes.get(shot.sceneId) : '场景未关联';
    const content = element('td'), detail = element('details');
    content.append(element('p', 'sw-ai-shot-summary', shot.description));
    detail.append(element('summary', '', `查看字段与原文 · 段落 ${shot.start}–${shot.end}`));
    let expanded = false;
    detail.addEventListener('toggle', () => {
      if (!detail.open || expanded) return;
      expanded = true;
      for (const [key, title] of Object.entries({ description: '画面描述', dialogue: '对白', action: '动作', mood: '情绪', characterNotes: '本镜人物补充', imagePrompt: '图像提示词', videoPrompt: '视频提示词', sound: '音效' })) {
        detail.append(element('strong', '', title), element('pre', 'sw-ai-excerpt', shot[key] || '（未填写）'));
      }
      detail.append(element('strong', '', '模型引用原文（请核对，不代表事实已确认）'));
      for (let number = shot.start; number <= shot.end; number++) detail.append(element('pre', 'sw-ai-excerpt', `段落 ${number}\n${task.source.paragraphs[number - 1].text}`));
    }, { signal: abort.signal });
    content.append(detail);
    row.append(checkCell, element('td', '', index + 1), element('td', '', `${shot.duration} 秒 / ${shot.size}`), element('td', 'sw-ai-excerpt', `${people}\n${place}`), content); body.append(row);
  });
  const context = element('details'); context.append(element('summary', '', '本次资料编号对照（修正 JSON 时使用）'));
  for (const kind of ['characters', 'scenes']) {
    for (const asset of task.context[kind]) context.append(element('p', '', `${asset.key} = ${asset.name}`));
  }
  root.append(element('p', 'sw-help', '时长、调度、提示词是 AI 创作建议，不是生成好的媒体。请核对对白与人物设定；段落范围校验不保证内容准确。取消勾选会跳过对应镜头，不再保证覆盖全部原文。'), tools, summary, context, tableWrap);
  update();
  return { root, getSelection: selected, destroy() { abort.abort(); root.remove(); } };
}
