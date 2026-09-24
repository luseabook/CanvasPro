import { STORY_AI_PROVIDERS } from './storyAiProviderModel.js';

export function createStoryAiModelPicker(models) {
  const abort = new AbortController();
  const root = document.createElement('div'); root.className = 'sw-grid';
  const provider = document.createElement('select'), model = document.createElement('select');
  function field(title, input) {
    const label = document.createElement('label'); label.className = 'sw-field';
    const text = document.createElement('span'); text.textContent = title; label.append(text, input); return label;
  }
  function option(select, value, text) {
    const item = document.createElement('option'); item.value = value; item.textContent = text; select.append(item);
  }
  for (const id of new Set(models.map(item => item.provider))) option(provider, id, STORY_AI_PROVIDERS[id]);
  function refresh() {
    model.replaceChildren();
    models.forEach((item, index) => { if (item.provider === provider.value) option(model, String(index), item.label); });
    model.disabled = !model.options.length;
    if (!model.options.length) option(model, '', '没有可用纯文本模型，请检查画布节点和模型清单');
  }
  provider.disabled = !provider.options.length;
  provider.addEventListener('change', refresh, { signal: abort.signal }); refresh();
  root.append(field('厂商（沿用项目对应配置）', provider), field('文本模型', model));
  return {
    root,
    getSelected() {
      const selected = model.value === '' ? null : models[Number(model.value)];
      if (!selected || selected.provider !== provider.value) throw new Error('请选择可用的纯文本模型');
      return { provider: selected.provider, model: selected.model };
    },
    destroy() { abort.abort(); root.remove(); },
  };
}
