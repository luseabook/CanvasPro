// Portable identity validation is separate from live manifest availability.
// Old results must remain exportable even if a model disappears from the catalog.
export const STORY_AI_PROVIDERS = Object.freeze({
  volcengine: '火山引擎', agnes: 'Agnes AI', apimart: 'APIMart', grsai: 'GRSAI',
  ppio: 'PPIO', runninghub: 'RunningHub', openai: 'OpenAI 兼容', custom: '自定义兼容（OpenAI 配置）',
});
export function normalizeStoryAiModel(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.provider !== 'string' ||
      !Object.prototype.hasOwnProperty.call(STORY_AI_PROVIDERS, value.provider)) {
    throw new Error('不支持的剧本 AI 厂商');
  }
  const model = value.model;
  if (typeof model !== 'string' || !model || model.length > 300 || /[\s\u0000-\u001f\u007f]/u.test(model) || model.includes('://')) {
    throw new Error('模型 ID 无效：请使用不含空白或服务地址的模型标识，最多300字符');
  }
  if (value.provider === 'volcengine' && !model.startsWith('volcengine/')) {
    throw new Error('火山引擎模型须使用 volcengine/ 模型标识');
  }
  return { provider: value.provider, model };
}
export function assertStoryAiModelAvailable(value, resolveExecution) {
  const identity = normalizeStoryAiModel(value);
  // The existing text API maps custom to the OpenAI-compatible configuration.
  if (identity.provider === 'openai' || identity.provider === 'custom') return identity;
  const resolved = resolveExecution(identity.model, { providerHint: identity.provider });
  const model = resolved?.modelManifest, execution = resolved?.executionManifest;
  if (!model || !execution || model.provider !== identity.provider || execution.provider !== identity.provider ||
      model.kind !== 'text' || execution.kind !== 'text' || model.adapterType !== 'modelApi' ||
      execution.adapterType !== 'modelApi' || model.outputType !== 'text' ||
      !['chat-completion', 'responses'].includes(execution.endpointMode)) {
    throw new Error('所选模型没有可用的纯文本调用清单；请重新选择，不会自动切换厂商或模型');
  }
  const slots = model.inputSlots;
  if (!Array.isArray(slots?.allowedKinds) || !slots.allowedKinds.includes('text') ||
      Object.entries(slots.minByKind || {}).some(([kind, count]) => !Number.isFinite(count) || count < 0 || (kind !== 'text' && count > 0))) {
    throw new Error('所选模型必须提供媒体输入，不能用于只发送文字的剧本任务');
  }
  return identity;
}
export function collectStoryAiModels({ defaultModel, manifests = [], nodes = {}, resolveExecution }) {
  const models = [], seen = new Set();
  function add(candidate, label) {
    let identity;
    try { identity = assertStoryAiModelAvailable(candidate, resolveExecution); } catch { return; }
    const key = JSON.stringify([identity.provider, identity.model]);
    if (seen.has(key)) return;
    seen.add(key);
    models.push({ ...identity, label: `${STORY_AI_PROVIDERS[identity.provider]} · ${String(label || identity.model).slice(0, 300)} · ${identity.model}` });
  }
  add(defaultModel, '默认分镜文本模型');
  for (const node of Object.values(nodes || {})) {
    if (!node || !['ai-text', 'storyboard-script'].includes(node.type)) continue;
    add({ model: node.storyboardScript?.model || node.model, provider: node.storyboardScript?.provider || node.provider }, node.name || '当前画布模型');
  }
  for (const manifest of manifests) {
    // Arbitrary custom IDs are discovered only from existing text nodes, not invented here.
    if (manifest?.provider === 'openai' || manifest?.provider === 'custom') continue;
    add({ provider: manifest?.provider, model: manifest?.modelId }, manifest?.displayName);
  }
  return models;
}
