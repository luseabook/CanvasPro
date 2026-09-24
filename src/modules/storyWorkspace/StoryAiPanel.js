import { createStoryAiModelPicker } from './StoryAiModelPicker.js';
import { assertStoryAiModelReady, getStoryAiModels, isStoryAiPending, requestStoryAi } from '../../../api/storyAiApi.js';
import { createStoryAiShotsTask, parseStoryAiShotsProposal, STORY_AI_SHOT_LIMITS } from './storyAiShotsModel.js';
import { createStoryAiShotsPreview } from './StoryAiShotsPreview.js';
import { createStoryAiTask, parseStoryAiProposal, prepareStoryAiSource, storyAssetNameKey, STORY_AI_LIMITS } from './storyAiModel.js';
function element(tag, className = '', text) {
  const node = document.createElement(tag); node.className = className;
  if (text !== undefined) node.textContent = String(text); return node;
}
export function createStoryAiPanel({ episode, workspace, nodes, isCurrent, onApply, onClose }) {
  const source = prepareStoryAiSource(episode?.script), models = getStoryAiModels(nodes);
  const abort = new AbortController();
  let disposed = false, pending = false, ignored = false, task = null, proposal = null, shotsPreview = null;
  const checks = { characters: [], scenes: [] };
  const root = element('section', 'sw-ai-panel'); root.setAttribute('aria-label', '剧本 AI 助手');
  const status = element('p', 'sw-ai-status', '未发送请求。选择任务并确认后，才会把正文及本次明确选择的文字资料发给所选模型。'); status.setAttribute('role', 'status');
  function message(text) { if (!disposed) status.textContent = String(text); }
  function listen(node, type, handler) { node.addEventListener(type, handler, { signal: abort.signal }); }
  function button(label, handler) {
    const button = element('button', 'sw-button', label); button.type = 'button';
    listen(button, 'click', () => { try { handler(); } catch (error) { message(error.message); } }); return button;
  }
  function label(text, control) { const wrapper = element('label', 'sw-field'); wrapper.append(element('span', '', text), control); return wrapper; }
  const settings = element('fieldset', 'sw-ai-settings');
  const mode = element('select');
  for (const [value, text] of [['split', 'AI 拆集方案（不改写正文）'], ['assets', '提取人物与场景资料'], ['shots', 'AI 生成分镜（追加，不覆盖）']]) { const option = element('option', '', text); option.value = value; mode.append(option); }
  const modelPicker = createStoryAiModelPicker(models);
  const count = element('input'); count.type = 'number'; count.min = '1'; count.max = String(Math.min(12, source.paragraphs.length)); count.value = String(Math.min(3, source.paragraphs.length)); count.step = '1';
  const countField = label('目标集数', count);
  settings.append(label('操作', mode), modelPicker.root, countField);
  const shotSettings = element('div', 'sw-ai-shot-settings'); shotSettings.hidden = true;
  const shotCount = element('input'); shotCount.type = 'number'; shotCount.min = '1'; shotCount.max = String(STORY_AI_SHOT_LIMITS.shots); shotCount.step = '1'; shotCount.value = '8';
  const direction = element('textarea'); direction.rows = 2; direction.placeholder = '例如：节奏舒缓，突出人物反应；不得添加原文没有的对白。最多1000字符。';
  const contextSelects = {};
  for (const kind of ['characters', 'scenes']) {
    const select = element('select'); select.multiple = true; select.size = 5;
    for (const asset of workspace[kind]) { const option = element('option', '', asset.name || '未命名资料'); option.value = asset.id; select.append(option); }
    contextSelects[kind] = select;
  }
  const contextGrid = element('div', 'sw-grid');
  contextGrid.append(label('人物设定（可不选；Ctrl/Cmd 多选，最多20项）', contextSelects.characters), label('场景设定（可不选；Ctrl/Cmd 多选，最多20项）', contextSelects.scenes));
  shotSettings.append(label('目标镜数（1–32）', shotCount), label('分镜创作要求（可选，会发送给模型）', direction), contextGrid,
    element('p', 'sw-help', `当前单集已有 ${episode.shots.length} 镜。仅发送所选资料的名称和描述，不读取图片绑定或素材地址字段；默认不选择资料。正文、资料和要求合计受提示词长度限制。`));
  settings.append(shotSettings);
  const inputPreview = element('details', 'sw-ai-input-preview'); inputPreview.hidden = true;
  const inputText = element('pre', 'sw-ai-excerpt'); inputPreview.append(element('summary', '', '待发送文字（不含密钥、图片绑定）'), inputText);
  function clearInputPreview() { inputPreview.hidden = true; inputText.textContent = ''; }
  function syncMode() {
    count.disabled = mode.value !== 'split'; countField.hidden = mode.value !== 'split'; shotSettings.hidden = mode.value !== 'shots'; clearInputPreview();
  }
  listen(mode, 'change', syncMode);
  listen(settings, 'input', clearInputPreview); listen(settings, 'change', clearInputPreview);
  function buildTask() {
    if (mode.value !== 'shots') return createStoryAiTask(source.text, mode.value, Number(count.value));
    return createStoryAiShotsTask(workspace, episode.id, { count: Number(shotCount.value), direction: direction.value,
      characterIds: [...contextSelects.characters.selectedOptions].map(option => option.value), sceneIds: [...contextSelects.scenes.selectedOptions].map(option => option.value) });
  }
  const inspect = button('预览待发送文字（不请求模型）', () => {
    const preview = task || buildTask(); inputText.textContent = preview.systemPrompt + '\n\n' + preview.prompt; inputPreview.hidden = false; inputPreview.open = true;
  });
  const raw = element('textarea', 'sw-ai-json'); raw.setAttribute('aria-label', 'AI 原始 JSON（可修正后校验）'); raw.rows = 8; raw.spellcheck = false;
  const output = element('div', 'sw-ai-output'); output.hidden = true;
  const results = element('div', 'sw-ai-results');
  const apply = button('确认追加到草稿', () => {
    if (!proposal || pending) throw new Error('请先校验有效结果');
    if (!isCurrent()) throw new Error('来源画布或草稿已改变，不能合并；可复制 JSON 后返回工作室');
    const selection = {};
    for (const kind of ['characters', 'scenes']) selection[kind] = checks[kind].filter(item => item.input.checked && !item.input.disabled).map(item => item.index);
    if (shotsPreview) selection.shots = shotsPreview.getSelection();
    onApply(proposal, selection);
  });
  apply.disabled = true;
  function invalidate() { shotsPreview?.destroy(); shotsPreview = null; proposal = null; apply.disabled = true; results.replaceChildren(); checks.characters = []; checks.scenes = []; }
  listen(raw, 'input', () => { invalidate(); message('JSON 已修改，请重新校验；不会因此再次调用模型。'); });
  function validate() {
    if (!task || pending) throw new Error('请先完成请求或等待当前请求结束');
    invalidate();
    const next = task.mode === 'shots' ? parseStoryAiShotsProposal(raw.value, task) : parseStoryAiProposal(raw.value, task);
    if (next.mode === 'split') {
      results.append(element('p', 'sw-help', `将新建 ${next.episodes.length} 集。原单集保留，正文全部来自原文；模型摘要只作预览，不写回正文。`));
      for (const episode of next.episodes) {
        const detail = element('details', 'sw-card');
        detail.append(element('summary', '', `${episode.title} · 段落 ${episode.start}–${episode.end} · ${episode.script.length} 字符`),
          element('p', '', episode.summary), element('pre', 'sw-ai-excerpt', episode.script)); results.append(detail);
      }
    } else if (next.mode === 'shots') {
      shotsPreview = createStoryAiShotsPreview({ proposal: next, task, existingCount: episode.shots.length }); results.append(shotsPreview.root);
    } else {
      results.append(element('p', 'sw-help', '核对模型引用的原文。编号有效不代表事实已核实；未提及的外观、身份等不要当成既定设定。同名资料将跳过。'));
      for (const kind of ['characters', 'scenes']) {
        results.append(element('h3', '', `${kind === 'characters' ? '人物' : '场景'} · ${next[kind].length}`));
        const existing = new Set(workspace[kind].map(asset => storyAssetNameKey(asset.name)));
        next[kind].forEach((asset, index) => {
          const card = element('section', 'sw-card'), input = element('input'); input.type = 'checkbox';
          input.disabled = existing.has(storyAssetNameKey(asset.name)); input.checked = !input.disabled;
          const title = element('label', 'sw-ai-check'); title.append(input, element('span', '', asset.name + (input.disabled ? '（同名已存在，不覆盖）' : '')));
          card.append(title, element('p', 'sw-ai-excerpt', asset.description));
          const evidence = element('details'); evidence.append(element('summary', '', '模型引用段落（请人工核对）'));
          for (const number of asset.evidence) evidence.append(element('pre', 'sw-ai-excerpt', `段落 ${number}\n${task.source.paragraphs[number - 1].text}`));
          card.append(evidence); results.append(card); checks[kind].push({ input, index });
        });
      }
    }
    proposal = next; apply.disabled = false; message('格式校验通过。请审阅后确认追加；校验不保证模型事实准确。');
  }
  const validateButton = button('校验当前 JSON（不收费）', validate);
  output.append(element('p', 'sw-help', '返回格式有误时，可修正下方 JSON 再校验；不会自动请求修复或重试。'), raw, validateButton, results, apply);
  const submit = button('发送一次 AI 请求…', () => { void generate(); });
  const reset = button('重新配置', () => {
    if (pending || isStoryAiPending()) throw new Error('前一请求仍在等待，不能重复发送；放弃结果不等于取消远端计费');
    if (raw.value && !window.confirm('放弃当前预览并重新配置？重新发送会再次调用模型，可能计费。')) return;
    invalidate(); raw.value = ''; output.hidden = true; task = null; ignored = false; settings.disabled = false; submit.disabled = false;
    syncMode(); message('已回到配置阶段，尚未发送新请求。');
  });
  const discard = button('放弃本次结果', () => {
    if (!pending && !raw.value) return;
    if (!window.confirm('放弃本次结果？已发出的模型请求可能继续执行和计费，不会保证远端取消。')) return;
    ignored = true; invalidate(); raw.value = ''; output.hidden = true;
    message('已放弃结果。请求若仍在运行，需等它结束才能重新配置；不会自动重试。');
  });
  const leave = button('返回工作室', () => {
    if ((pending || raw.value) && !window.confirm('离开将放弃未合并结果；已发送的模型请求可能继续计费。继续？')) return;
    onClose();
  });
  async function generate() {
    if (disposed || pending) return;
    try {
      if (!isCurrent()) throw new Error('来源画布或草稿已改变，请返回后重新打开');
      if (isStoryAiPending()) throw new Error('前一个工作室 AI 请求尚未结束，请稍后再试；没有发送新请求');
      const nextTask = buildTask(), selected = modelPicker.getSelected();
      assertStoryAiModelReady(selected);
      if (!selected) throw new Error('请选择有效模型');
      const extra = nextTask.mode === 'shots' ? `，另含所选 ${nextTask.context.characters.length} 项人物、${nextTask.context.scenes.length} 项场景的名称/描述和分镜创作要求` : '';
      if (!window.confirm(`将当前单集正文（${source.text.length} 字符）${extra}发送到 ${selected.provider} / ${selected.model}。结构化提示词共 ${nextTask.prompt.length} 字符。沿用项目的 API 地址和账号配置，可能产生费用，不会自动重试。是否发送一次？`)) return;
      task = nextTask; pending = true; ignored = false; settings.disabled = true; submit.disabled = true; reset.disabled = true; validateButton.disabled = true;
      invalidate(); raw.value = ''; output.hidden = true;
      message('模型请求进行中；不显示虚构进度。可以放弃结果，但不保证远端取消。');
      const response = await requestStoryAi(task, selected);
      if (disposed || ignored) return;
      if (!isCurrent()) { ignored = true; message('来源上下文已改变，结果未合并，请返回工作室。'); return; }
      if (typeof response?.text !== 'string' || response.text.length > STORY_AI_LIMITS.response) throw new Error('模型返回内容为空或过大；未自动重试');
      raw.value = response.text; output.hidden = false; pending = false;
      validate();
    } catch (error) {
      if (!disposed && !ignored) message(String(error.message || '模型请求失败').slice(0, 1600) + '；不会自动重发。若超时或断网，请先核对厂商记录，重发可能重复计费。');
    } finally {
      pending = false;
      if (!disposed) { reset.disabled = false; validateButton.disabled = false; }
    }
  }
  const controls = element('div', 'sw-tools'); controls.append(inspect, submit, reset, discard, leave);
  root.append(element('h3', '', '剧本 AI 助手'),
    element('p', 'sw-help', `输入正文来自“${episode.title || '当前单集'}”：${source.text.length} 字符，${source.paragraphs.length} 段。分镜模式可额外选择文字资料和创作要求；不发送其他单集，不读取图片绑定。密钥不写入项目节点。`),
    element('p', 'sw-help', '支持当前清单中可纯文本调用的厂商模型，以及画布文本节点的 OpenAI/custom 兼容模型。custom 沿用 OpenAI 配置；不复制节点密钥或地址。列表不是账号可用性保证，发送前请检查项目对应厂商设置。'),
    settings, controls, inputPreview, status, output);
  return { root, focus() { mode.focus(); }, destroy() { disposed = true; ignored = true; shotsPreview?.destroy(); modelPicker.destroy(); abort.abort(); root.remove(); } };
}
