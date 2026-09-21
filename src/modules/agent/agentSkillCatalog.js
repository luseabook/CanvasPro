const textToImageSkill = {
    schemaVersion: 1,
    id: 'text-to-image',
    title: 'Text to image',
    riskLevel: 'confirm',
    appliesWhen: ['user wants to create images from text'],
    requiredInputs: ['prompt'],
    missingInputQuestions: [
      'What image prompt should be used?',
      'Do you prefer speed, quality, or low cost?',
    ],
    recommendedModelKind: 'image',
    defaultParams: {},
    commands: ['node.create', 'node.setPrompt', 'node.setParams', 'generation.run'],
  },
  textToVideoSkill = {
    schemaVersion: 1,
    id: 'text-to-video',
    title: 'Text to video',
    riskLevel: 'confirm',
    appliesWhen: ['user wants to create video from text'],
    requiredInputs: ['prompt'],
    missingInputQuestions: [
      'What should happen in the video?',
      'What duration and aspect ratio do you want?',
    ],
    recommendedModelKind: 'video',
    defaultParams: { duration: 5 },
    commands: ['node.create', 'node.setPrompt', 'node.setParams', 'generation.run'],
  },
  imageToVideoSkill = {
    schemaVersion: 1,
    id: 'image-to-video',
    title: 'Image to video',
    riskLevel: 'confirm',
    appliesWhen: ['user wants to animate an image or generate video from selected images'],
    requiredInputs: ['source image', 'prompt or motion intent'],
    missingInputQuestions: [
      'Which image should be used as the video reference?',
      'How long should the video be?',
      'Do you prefer speed, quality, or low cost?',
    ],
    recommendedModelKind: 'video',
    defaultParams: { duration: 5, aspectRatio: '16:9' },
    commands: ['node.create', 'graph.connect', 'node.setPrompt', 'node.setParams', 'generation.run'],
  },
  batchLayoutSkill = {
    schemaVersion: 1,
    id: 'batch-layout',
    title: 'Batch layout',
    riskLevel: 'safe',
    appliesWhen: ['user wants to align, distribute, or arrange many canvas nodes'],
    requiredInputs: ['target nodes', 'layout intent'],
    missingInputQuestions: [
      'Which nodes should be arranged?',
      'Should they be arranged as a row, column, or grid?',
    ],
    recommendedModelKind: '',
    defaultParams: { gap: 40 },
    commands: [
      'node.select',
      'layout.align',
      'layout.distribute',
      'layout.arrangeRow',
      'layout.arrangeColumn',
      'layout.arrangeGrid',
      'viewport.focusNodes',
    ],
  },
  AGENT_SKILL_ALLOWLIST = Object.freeze([
    textToImageSkill,
    textToVideoSkill,
    imageToVideoSkill,
    batchLayoutSkill,
  ]);
function normalizeSkill(_0x180da7 = {}) {
  return {
    id: String(_0x180da7.id || '').trim(),
    title: String(_0x180da7.title || '').trim(),
    riskLevel: String(_0x180da7.riskLevel || 'safe').trim(),
    appliesWhen: Array.isArray(_0x180da7.appliesWhen)
      ? _0x180da7.appliesWhen.map((_0x125ba3) => String(_0x125ba3 || '')).filter(Boolean)
      : [],
    requiredInputs: Array.isArray(_0x180da7.requiredInputs)
      ? _0x180da7.requiredInputs.map((_0xb82613) => String(_0xb82613 || '')).filter(Boolean)
      : [],
    missingInputQuestions: Array.isArray(_0x180da7.missingInputQuestions)
      ? _0x180da7.missingInputQuestions.map((_0x5d3dd0) => String(_0x5d3dd0 || '')).filter(Boolean)
      : [],
    recommendedModelKind: String(_0x180da7.recommendedModelKind || '').trim(),
    defaultParams:
      _0x180da7.defaultParams && typeof _0x180da7.defaultParams === 'object'
        ? { ..._0x180da7.defaultParams }
        : {},
    commands: Array.isArray(_0x180da7.commands)
      ? _0x180da7.commands.map((_0x255335) => String(_0x255335 || '')).filter(Boolean)
      : [],
  };
}
export function listAgentSkills() {
  return AGENT_SKILL_ALLOWLIST.map(normalizeSkill).filter((_0x23e37a) => _0x23e37a.id);
}
