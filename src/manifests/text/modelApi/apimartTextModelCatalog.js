export const apimartAdditionalTextModels = Object['freeze'](
  [
    { model: 'gpt-6-astra', displayName: 'GPT-6\x20Astra', icon: 'oa', reasoningEffortMode: 'openai' },
    { model: 'claude-fable-5.1', displayName: 'Claude Fable 5.1' },
    { model: 'claude-opus-5', displayName: 'Claude\x20Opus\x205' },
    { model: 'gemini-3.8-flash', displayName: 'Gemini\x203.8\x20Flash', icon: 'gemini', videoInput: !![] },
    { model: 'gemini-3.7-flash', displayName: 'Gemini 3.7 Flash', icon: 'gemini', videoInput: !![] },
    {
      model: 'glm-5.3',
      displayName: 'GLM-5.3',
      mediaPolicy: 'text-only',
      structuredOutputMode: 'json_object',
    },
    {
      model: 'glm-5.3-flash',
      displayName: 'GLM-5.3 Flash',
      mediaPolicy: 'image-video',
      structuredOutputMode: 'json_object',
    },
    {
      model: 'kimi-k3',
      displayName: 'Kimi\x20K3',
      icon: 'moonshot',
      mediaPolicy: 'image-video',
      mediaInputEncoding: 'base64',
      structuredOutputMode: 'json_object',
    },
    { model: 'grok-4.6', displayName: 'Grok 4.6' },
    { model: 'minimax-m2.7', displayName: 'MiniMax M2.7', mediaPolicy: 'text-only' },
    { model: 'mimo-v2.5-pro', displayName: 'MiMo V2.5 Pro', mediaPolicy: 'text-only' },
    {
      model: 'step-3.7-flash',
      displayName: 'Step 3.7 Flash',
      mediaPolicy: 'image-video',
      structuredOutputMode: 'json_object',
    },
    {
      model: 'deepseek-v4.1-flash',
      displayName: 'DeepSeek V4.1 Flash',
      icon: 'deepseek',
      mediaPolicy: 'text-only',
    },
  ]['map']((args, value) =>
    Object['freeze']({
      ...args,
      modelId: 'apimart/' + args['model'],
      executionId: 'apimart.model-api.text.' + args['model']['replaceAll']('.', '-') + '.v1',
      subtitle: 'APIMart\x20chat\x20completion\x20model\x20API',
      order: 0x5a + value,
    }),
  ),
);
