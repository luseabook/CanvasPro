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
    const _0x5a7a0e = new Map();
    for (const [_0x42c762, _0x302302] of Object.entries(_NODE_META)) {
      _0x5a7a0e.set(_0x42c762, _0x42c762);
      for (const _0x5ede47 of _0x302302.aliases || []) {
        _0x5a7a0e.set(_0x5ede47, _0x42c762);
      }
    }
    return _0x5a7a0e;
  })();
export function getAllNodeTypeMeta() {
  return _NODE_META;
}
export function normalizeNodeType(_0x2468d7) {
  if (typeof _0x2468d7 !== 'string') return '';
  const _0x4a997e = _0x2468d7.trim();
  if (!_0x4a997e) return '';
  return _ALIAS_TO_CANONICAL.get(_0x4a997e) || _0x4a997e;
}
export function getNodeTypeAliases(_0x4e7129) {
  const _0x4c6095 = normalizeNodeType(_0x4e7129),
    _0x2cc4e4 = _NODE_META[_0x4c6095];
  return _0x2cc4e4?.aliases ? [..._0x2cc4e4.aliases] : [];
}
export function getNodeWrapperExtraClasses(_0x4fdc4c) {
  const _0x3a630d = normalizeNodeType(_0x4fdc4c),
    _0x4877f8 = _NODE_META[_0x3a630d],
    _0x380d38 = _0x4877f8?.wrapperClasses || [];
  return _0x380d38.length ? _0x380d38.join(' ') : '';
}
export function getRefKindByNodeType(_0x4beaa9) {
  const _0x3feb85 = normalizeNodeType(_0x4beaa9);
  return _NODE_META[_0x3feb85]?.refKind || '';
}
export function hasNodeTypeBetaBadge(_0x384ee2) {
  const _0x241f16 = normalizeNodeType(_0x384ee2);
  return _NODE_META[_0x241f16]?.beta === true;
}
