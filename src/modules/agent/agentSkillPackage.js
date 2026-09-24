const AGENT_SKILL_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
const AGENT_SKILL_MARKDOWN_MAX_CHARS = 128 * 1024;
const AGENT_SKILL_INSTRUCTIONS_MAX_CHARS = 24 * 1024;

const MAX_PACKAGE_ID_CHARS = 100;
const MAX_TITLE_CHARS = 120;
const MAX_DESCRIPTION_CHARS = 600;
const MAX_CATEGORY_CHARS = 80;
const MAX_VERSION_CHARS = 40;
const MAX_RISK_LEVEL_CHARS = 20;
const MAX_LIST_ITEM_CHARS = 160;
const MAX_RESOURCE_CONTENT_CHARS = 16 * 1024;
const MAX_RESOURCE_NAMES = 24;

export const MANAGED_AGENT_SKILL_OWNER = 'shuo-canvas';

function normalizeText(value, maxChars = 0) {
  const text = String(value == null ? '' : value).trim();
  return maxChars > 0 ? text.slice(0, maxChars) : text;
}

function parseScalar(raw = '') {
  const text = String(raw || '').trim();
  if (!text) return '';
  if (text === 'true') return true;
  if (text === 'false') return false;
  if (text === 'null') return null;
  if (/^-?\d+(?:\.\d+)?$/.test(text)) return Number(text);
  if (text.startsWith('[') && text.endsWith(']')) {
    try {
      return JSON.parse(text);
    } catch {}
  }
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.slice(1, -1);
  }
  return text;
}

function parseFrontmatter(source = '') {
  const result = {};
  let lastObject = null;
  let lastArray = null;
  let lastArrayIndent = -1;
  const lines = String(source || '').split(/\r?\n/);
  const readBlockContainer = (index, indent) => {
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const line = lines[cursor];
      if (!line.trim() || line.trimStart().startsWith('#')) continue;
      const lineIndent = line.length - line.trimStart().length;
      if (lineIndent <= indent) return {};
      return line.trim().startsWith('- ') ? [] : {};
    }
    return {};
  };
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const indent = line.length - line.trimStart().length;
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') && lastArray && indent > lastArrayIndent) {
      lastArray.push(parseScalar(trimmed.slice(2)));
      continue;
    }
    const separator = trimmed.indexOf(':');
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    if (indent === 0) {
      lastArray = null;
      lastArrayIndent = -1;
      if (!rawValue) {
        result[key] = readBlockContainer(index, indent);
        lastObject = result[key];
        if (Array.isArray(lastObject)) {
          lastArray = lastObject;
          lastArrayIndent = indent;
        }
      } else {
        result[key] = parseScalar(rawValue);
        lastObject = null;
      }
      continue;
    }
    if (!lastObject || Array.isArray(lastObject) || typeof lastObject !== 'object') continue;
    if (!rawValue) {
      lastObject[key] = readBlockContainer(index, indent);
      lastArray = Array.isArray(lastObject[key]) ? lastObject[key] : null;
      lastArrayIndent = lastArray ? indent : -1;
    } else {
      lastObject[key] = parseScalar(rawValue);
      lastArray = null;
      lastArrayIndent = -1;
    }
  }
  return result;
}

function stringArray(value) {
  const list = Array.isArray(value)
    ? value
    : typeof value === 'string' && value.trim()
      ? value.split(',')
      : [];
  return [
    ...new Set(list.map((entry) => normalizeText(entry, MAX_LIST_ITEM_CHARS)).filter(Boolean)),
  ];
}

function normalizeResources(resources = []) {
  return (Array.isArray(resources) ? resources : [])
    .map((resource = {}) => ({
      name: normalizeText(resource.name, MAX_LIST_ITEM_CHARS),
      content: normalizeText(resource.content, MAX_RESOURCE_CONTENT_CHARS),
    }))
    .filter((resource) => resource.name && resource.content)
    .slice(0, MAX_RESOURCE_NAMES);
}

function getField(frontmatter, metadata, ...names) {
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(metadata, name)) return metadata[name];
    if (Object.prototype.hasOwnProperty.call(frontmatter, name)) return frontmatter[name];
  }
  return undefined;
}

function failure(errorCode, message, packageId = '') {
  return {
    ok: false,
    errorCode,
    message,
    packageId: normalizeText(packageId, MAX_PACKAGE_ID_CHARS),
  };
}

export function parseAgentSkillMarkdown(
  markdown = '',
  {
    packageId = '',
    source = 'installed',
    resourceNames = [],
    resources = [],
    hasScripts = false,
  } = {},
) {
  const text = String(markdown || '').replace(/^\uFEFF/, '');
  if (text.length > AGENT_SKILL_MARKDOWN_MAX_CHARS) {
    return failure('SKILL_MD_TOO_LARGE', 'SKILL.md exceeds the supported size limit.', packageId);
  }
  const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)([\s\S]*)$/);
  if (!match) {
    return failure(
      'MISSING_SKILL_FRONTMATTER',
      'SKILL.md must start with YAML frontmatter.',
      packageId,
    );
  }
  const frontmatter = parseFrontmatter(match[1]);
  const metadata =
    frontmatter.metadata && typeof frontmatter.metadata === 'object' ? frontmatter.metadata : {};
  const id = normalizeText(frontmatter.name || frontmatter.id).toLowerCase();
  if (!AGENT_SKILL_ID_PATTERN.test(id)) {
    return failure(
      'INVALID_SKILL_ID',
      'Skill name must use lowercase letters, numbers, and hyphens.',
      packageId,
    );
  }
  const description = normalizeText(frontmatter.description, MAX_DESCRIPTION_CHARS);
  if (!description) return failure('MISSING_SKILL_DESCRIPTION', 'Skill description is required.', packageId);
  const scriptsEnabled =
    getField(frontmatter, metadata, 'scriptsEnabled', 'scripts-enabled') === true;
  if (scriptsEnabled) {
    return failure(
      'SKILL_SCRIPTS_NOT_SUPPORTED',
      'Skill script execution is not enabled in this runtime.',
      packageId,
    );
  }
  const triggers = stringArray(getField(frontmatter, metadata, 'triggers'));
  const appliesWhen = stringArray(getField(frontmatter, metadata, 'appliesWhen', 'applies-when'));
  const commands = stringArray(getField(frontmatter, metadata, 'commands', 'canvas-commands'));
  const requiredInputs = stringArray(
    getField(frontmatter, metadata, 'requiredInputs', 'required-inputs'),
  );
  const missingInputQuestions = stringArray(
    getField(frontmatter, metadata, 'missingInputQuestions', 'missing-input-questions'),
  );
  const manualOnly = getField(frontmatter, metadata, 'manualOnly', 'manual-only');
  const instructions = normalizeText(match[2], AGENT_SKILL_INSTRUCTIONS_MAX_CHARS);
  return {
    ok: true,
    skill: {
      schemaVersion: 1,
      id,
      title: normalizeText(getField(frontmatter, metadata, 'title'), MAX_TITLE_CHARS) || id,
      description,
      category:
        normalizeText(getField(frontmatter, metadata, 'category'), MAX_CATEGORY_CHARS) || 'general',
      version:
        normalizeText(getField(frontmatter, metadata, 'version'), MAX_VERSION_CHARS) || 'local',
      riskLevel:
        normalizeText(getField(frontmatter, metadata, 'riskLevel', 'risk-level'), MAX_RISK_LEVEL_CHARS) ||
        'safe',
      recommendedModelKind: normalizeText(
        getField(frontmatter, metadata, 'recommendedModelKind', 'recommended-model-kind'),
        MAX_VERSION_CHARS,
      ),
      triggers,
      appliesWhen,
      requiredInputs,
      missingInputQuestions,
      commands,
      defaultParams: {},
      manualOnly: manualOnly === true,
      managedBy: normalizeText(
        getField(frontmatter, metadata, 'managedBy', 'managed-by'),
        MAX_CATEGORY_CHARS,
      ),
      instructions,
      source: normalizeText(source, MAX_VERSION_CHARS) || 'installed',
      packageId: normalizeText(packageId, MAX_PACKAGE_ID_CHARS) || id,
      resourceNames: stringArray(resourceNames).slice(0, MAX_RESOURCE_NAMES),
      resources: normalizeResources(resources),
      execution: { scriptsAvailable: hasScripts === true, scriptsEnabled: false },
    },
  };
}

function yamlQuoted(value) {
  return JSON.stringify(String(value == null ? '' : value));
}

export function serializeManagedAgentSkillDefinition({
  id = '',
  title = '',
  description = '',
  triggers = [],
  instructions = '',
} = {}) {
  const skillId = normalizeText(id, 64).toLowerCase();
  if (!AGENT_SKILL_ID_PATTERN.test(skillId)) {
    return failure(
      'INVALID_SKILL_ID',
      'Skill name must use lowercase letters, numbers, and hyphens.',
      skillId,
    );
  }
  const skillDescription = normalizeText(description, MAX_DESCRIPTION_CHARS);
  if (!skillDescription) {
    return failure('MISSING_SKILL_DESCRIPTION', 'Skill description is required.', skillId);
  }
  const skillInstructions = normalizeText(instructions, AGENT_SKILL_INSTRUCTIONS_MAX_CHARS);
  if (!skillInstructions) {
    return failure('MISSING_SKILL_INSTRUCTIONS', 'Skill instructions are required.', skillId);
  }
  const skillTitle = normalizeText(title, MAX_TITLE_CHARS) || skillId;
  const skillTriggers = stringArray(triggers).slice(0, MAX_RESOURCE_NAMES);
  const triggerLines = skillTriggers.map((trigger) => '    - ' + yamlQuoted(trigger));
  const markdown = [
    '---',
    'name: ' + skillId,
    'description: ' + yamlQuoted(skillDescription),
    'metadata:',
    '  title: ' + yamlQuoted(skillTitle),
    '  managed-by: ' + MANAGED_AGENT_SKILL_OWNER,
    ...(triggerLines.length > 0 ? ['  triggers:', ...triggerLines] : []),
    '---',
    '',
    skillInstructions,
    '',
  ].join('\n');
  return {
    ok: true,
    markdown,
    definition: {
      id: skillId,
      title: skillTitle,
      description: skillDescription,
      triggers: skillTriggers,
      instructions: skillInstructions,
      managedBy: MANAGED_AGENT_SKILL_OWNER,
    },
  };
}

export const agentSkillPackageInternals = Object.freeze({
  parseFrontmatter,
  parseScalar,
  yamlQuoted,
});
