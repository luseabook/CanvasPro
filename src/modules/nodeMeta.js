const _NODE_META = {
    group: { aliases: [], wrapperClasses: ['node-group'], refKind: '' },
    'source-text': {
      aliases: ['text', 'source_text'],
      wrapperClasses: ['source-text-node', 'type-source'],
      refKind: 'text',
    },
    'comment-note': {
      aliases: ['comment_note', 'comment'],
      wrapperClasses: ['comment-note-node'],
      refKind: '',
    },
    'source-image': {
      aliases: ['image', 'source_image'],
      wrapperClasses: ['image-node', 'type-source'],
      refKind: 'image',
    },
    'source-video': {
      aliases: ['video', 'source_video'],
      wrapperClasses: ['video-node', 'type-source'],
      refKind: 'video',
    },
    'source-audio': {
      aliases: ['audio', 'source_audio'],
      wrapperClasses: ['audio-node', 'type-source'],
      refKind: 'audio',
    },
    'web-preview': {
      aliases: ['web_preview'],
      wrapperClasses: ['web-preview-node'],
      refKind: '',
      beta: true,
    },
    'web-reference-card': {
      aliases: ['web_reference_card', 'web-reference'],
      wrapperClasses: ['web-reference-card-node'],
      refKind: '',
    },
    'media-clip': {
      aliases: ['clip', 'media_clip'],
      wrapperClasses: ['media-clip-node'],
      refKind: '',
      beta: true,
    },
    'ai-text': { aliases: [], wrapperClasses: ['text-node'], refKind: 'text' },
    'ai-image': { aliases: [], wrapperClasses: ['image-node'], refKind: 'image' },
    'ai-video': { aliases: [], wrapperClasses: ['video-node'], refKind: 'video' },
    'ai-audio': { aliases: [], wrapperClasses: ['audio-node'], refKind: 'audio' },
    debug: { aliases: [], wrapperClasses: [], refKind: '' },
    collage: { aliases: [], wrapperClasses: ['collage-node-wrapper'], refKind: '' },
    whiteboard: { aliases: [], wrapperClasses: ['whiteboard-node-wrapper'], refKind: '' },
    'comfyui-workflow': { aliases: [], wrapperClasses: ['comfy-workflow-node-wrapper'], refKind: '' },
    'story-workspace': { aliases: [], wrapperClasses: ['story-workspace-node-wrapper'], refKind: '' },
    storyboard: { aliases: [], wrapperClasses: [], refKind: '' },
    'storyboard-script': {
      aliases: ['storyboard_script'],
      wrapperClasses: ['storyboard-script-wrapper'],
      refKind: '',
    },
    'panorama-scene': { aliases: ['panorama_scene'], wrapperClasses: ['panorama-scene-node'], refKind: '' },
    'panorama-360': {
      aliases: ['panorama_360', 'panorama360'],
      wrapperClasses: ['panorama-scene-node'],
      refKind: '',
    },
    'test-video': { aliases: [], wrapperClasses: ['video-node'], refKind: 'video' },
  },
  _ALIAS_TO_CANONICAL = (() => {
    const map = new Map();
    for (const [value, item] of Object.entries(_NODE_META)) {
      map.set(value, value);
      for (const key of item.aliases || []) {
        map.set(key, value);
      }
    }
    return map;
  })();
export function getAllNodeTypeMeta() {
  return _NODE_META;
}
export function normalizeNodeType(index) {
  if (typeof index !== 'string') return '';
  const enabled = index.trim();
  if (!enabled) return '';
  return _ALIAS_TO_CANONICAL.get(enabled) || enabled;
}
export function getNodeTypeAliases(result) {
  const nodeType = normalizeNodeType(result),
    args = _NODE_META[nodeType];
  return args?.aliases ? [...args.aliases] : [];
}
export function getNodeWrapperExtraClasses(data) {
  const nodeType2 = normalizeNodeType(data),
    options = _NODE_META[nodeType2],
    list = options?.wrapperClasses || [];
  return list.length ? list.join(' ') : '';
}
export function getRefKindByNodeType(target) {
  const nodeType3 = normalizeNodeType(target);
  return _NODE_META[nodeType3]?.refKind || '';
}
export function hasNodeTypeBetaBadge(source) {
  const nodeType4 = normalizeNodeType(source);
  return _NODE_META[nodeType4]?.beta === true;
}
