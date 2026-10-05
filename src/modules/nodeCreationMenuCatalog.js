import { t } from '../i18n/index.js';
const NODE_CREATION_ITEMS = Object.freeze({
    'ai-text': Object.freeze({
      type: 'ai-text',
      label: '文本',
      defaultName: '文本',
      subtitle: '文案、脚本、提示词',
    }),
    'ai-image': Object.freeze({
      type: 'ai-image',
      label: '图像',
      defaultName: '图像',
      subtitle: '图片、海报、角色素材',
    }),
    'ai-video': Object.freeze({
      type: 'ai-video',
      label: '视频',
      defaultName: '视频',
      subtitle: '短片、转场、动态镜头',
    }),
    'ai-audio': Object.freeze({
      type: 'ai-audio',
      label: '音频',
      defaultName: '音频',
      subtitle: '配音、音效、音乐',
    }),
    'source-text': Object.freeze({
      type: 'source-text',
      label: '源文本',
      defaultName: '源文本',
      subtitle: '文案、脚本、提示词输入',
    }),
    'source-image': Object.freeze({
      type: 'source-image',
      label: '源图像',
      defaultName: '源图像',
      subtitle: '参考图、首帧、素材',
    }),
    'source-video': Object.freeze({
      type: 'source-video',
      label: '源视频',
      defaultName: '源视频',
      subtitle: '参考、剪辑、视频输入',
    }),
    'source-audio': Object.freeze({
      type: 'source-audio',
      label: '源音频',
      defaultName: '源音频',
      subtitle: '配音、音乐、声音参考',
    }),
    'web-preview': Object.freeze({
      type: 'web-preview',
      label: '浏览器',
      defaultName: '浏览器',
      badge: 'BETA',
      devOnly: true,
      subtitle: '输入网址并在画布内浏览',
    }),
    'panorama-scene': Object.freeze({
      type: 'panorama-scene',
      label: '3D导演台',
      defaultName: '3D导演台',
      subtitle: '3D 场景、人物、机位',
    }),
    'panorama-360': Object.freeze({
      type: 'panorama-360',
      label: '360全景图',
      defaultName: '360全景图',
      subtitle: '全景画面与空间关系',
    }),
    'storyboard-script': Object.freeze({
      type: 'storyboard-script',
      label: '分镜脚本',
      defaultName: '分镜脚本',
      badge: 'BETA',
      subtitle: '镜头表、提示词、节奏',
    }),
    'story-workspace': Object.freeze({
      type: 'story-workspace',
      label: '剧本工作室',
      defaultName: '剧本工作室',
      subtitle: '多集剧本、人物场景与分镜编辑',
    }),
    'comfyui-workflow': Object.freeze({
      type: 'comfyui-workflow',
      label: 'ComfyUI 工作流',
      defaultName: 'ComfyUI 工作流',
      subtitle: '本地/云端 API 工作流与生成结果',
    }),
    whiteboard: Object.freeze({
      type: 'whiteboard',
      label: '白板',
      defaultName: '白板',
      subtitle: '自由绘制、图文排版与导出',
    }),
    collage: Object.freeze({
      type: 'collage',
      label: '拼图',
      defaultName: '拼图',
      subtitle: '图片排版与导出',
    }),
    'media-clip': Object.freeze({
      type: 'media-clip',
      label: '剪辑',
      defaultName: '剪辑',
      badge: 'BETA',
      devOnly: true,
      subtitle: '音视频剪切整理',
    }),
    debug: Object.freeze({
      type: 'debug',
      label: '调试节点',
      defaultName: '调试节点',
      devOnly: true,
      subtitle: '查看 Payload 与任务状态',
    }),
  }),
  NODE_CREATION_ITEM_I18N_KEYS = Object.freeze({
    'ai-text': 'aiText',
    'ai-image': 'aiImage',
    'ai-video': 'aiVideo',
    'ai-audio': 'aiAudio',
    'source-text': 'sourceText',
    'source-image': 'sourceImage',
    'source-video': 'sourceVideo',
    'source-audio': 'sourceAudio',
    'web-preview': 'webPreview',
    'panorama-scene': 'panoramaScene',
    'panorama-360': 'panorama360',
    'storyboard-script': 'storyboardScript',
    collage: 'collage',
    whiteboard: 'whiteboard',
    'comfyui-workflow': 'comfyWorkflow',
    'story-workspace': 'storyWorkspace',
    'media-clip': 'mediaClip',
    debug: 'debug',
  }),
  NODE_CREATION_SECTIONS = Object.freeze({
    generation: Object.freeze({
      id: 'generation',
      label: '生成节点',
      itemTypes: Object.freeze(['ai-text', 'ai-image', 'ai-video', 'ai-audio']),
    }),
    source: Object.freeze({
      id: 'source',
      label: '源节点',
      itemTypes: Object.freeze(['source-text', 'source-image', 'source-video', 'source-audio']),
    }),
    function: Object.freeze({
      id: 'function',
      label: '功能节点',
      itemTypes: Object.freeze([
        'panorama-scene',
        'panorama-360',
        'storyboard-script',
        'collage',
        'whiteboard',
        'comfyui-workflow',
        'story-workspace',
        'web-preview',
        'media-clip',
        'debug',
      ]),
    }),
  }),
  NODE_CREATION_SECTION_I18N_KEYS = Object.freeze({
    generation: 'nodeCreation.sections.generation',
    source: 'nodeCreation.sections.source',
    function: 'nodeCreation.sections.function',
  });
export const PICKER_NODE_CREATION_SECTION_IDS = Object.freeze(['generation', 'function']);
export const CONTEXT_NODE_CREATION_SECTION_IDS = Object.freeze(['generation', 'source', 'function']);
export const NODE_CREATION_UPLOAD_ITEM = Object.freeze({
  get label() {
    return t('nodeCreation.upload.label');
  },
  get subtitle() {
    return t('nodeCreation.upload.subtitle');
  },
});
export function getNodeCreationMenuItem(value) {
  const args = NODE_CREATION_ITEMS[String(value || '')] || null;
  if (!args) return null;
  const enabled = NODE_CREATION_ITEM_I18N_KEYS[args.type];
  if (!enabled) return args;
  return {
    ...args,
    label: t('nodeCreation.items.' + enabled + '.label'),
    defaultName: t('nodeCreation.items.' + enabled + '.defaultName'),
    subtitle: t('nodeCreation.items.' + enabled + '.subtitle'),
  };
}
export function getNodeCreationMenuSections(item, { includeDevOnly: includeDevOnly = false } = {}) {
  return (Array.isArray(item) ? item : [])
    .map((item2) => {
      const id = NODE_CREATION_SECTIONS[item2];
      if (!id) return null;
      const items = id.itemTypes
        .map((item3) => getNodeCreationMenuItem(item3))
        .filter((item4) => item4 && (includeDevOnly || item4.devOnly !== true));
      if (items.length === 0) return null;
      const label2 = NODE_CREATION_SECTION_I18N_KEYS[id.id];
      return { id: id.id, label: label2 ? t(label2) : id.label, items: items };
    })
    .filter(Boolean);
}

export function isNodeCreationTypeEnabled(key) {
  const index = NODE_CREATION_ITEMS[String(key || '')];
  return index?.['creationDisabled'] !== true;
}
