import {
  STORY_PROMPT_LANGUAGES,
  normalizeStoryPromptLanguage,
} from '../../domain/storyGeneration/promptLanguage.js';
import { getStoryPromptModeLabel, normalizeStoryPromptMode } from './storyPromptModes.js';
export function canGenerateStoryClipAdjustment(enabled, value, item) {
  if (
    String(enabled['clipAdjustmentInstruction'] || '')['trim']() ||
    normalizeStoryPromptLanguage(enabled['clipAdjustmentLanguage'])
  )
    return true;
  if (!enabled['clipAdjustmentPromptMode']) return false;
  const key = enabled['clipSelectionMode']
    ? (value?.['clips'] || [])['filter']((index) =>
        enabled['selectedClipGenerationIds']?.['includes'](index['id']),
      )
    : [item];
  return key['some'](
    (result) =>
      normalizeStoryPromptMode(
        result?.['promptMode'] ||
          value?.['promptMode'] ||
          enabled['data']?.['project']?.['planning']?.['promptMode'],
        { allowDeveloperModes: true },
      ) !== enabled['clipAdjustmentPromptMode'],
  );
}
export function syncStoryClipAdjustmentMenu({
  state: state,
  root: root,
  episode: episode,
  clip: clip,
  kind: kind = 'mode',
  focus: focus = '',
  updateSelection: updateSelection = false,
}) {
  const el = root?.['querySelector']('[data-story-clip-adjustment-bar]'),
    data = el?.['querySelector']('[data-story-adjustment-kind="' + kind + '"]'),
    el2 = data?.['querySelector']('[data-story-action="toggle-clip-adjustment-mode"]'),
    enabled2 = data?.['querySelector']('[role="listbox"]');
  if (!el || !el2 || !enabled2) return false;
  const options = kind === 'language',
    enabled3 = options ? state['clipAdjustmentLanguageOpen'] : state['clipAdjustmentPromptModeOpen'];
  (el2['setAttribute']('aria-expanded', String(Boolean(enabled3))), (enabled2['hidden'] = !enabled3));
  if (updateSelection) {
    const target = options
        ? normalizeStoryPromptLanguage(state['clipAdjustmentLanguage'])
        : normalizeStoryPromptMode(
            state['clipAdjustmentPromptMode'] ||
              clip?.['promptMode'] ||
              episode?.['promptMode'] ||
              state['data']?.['project']?.['planning']?.['promptMode'],
            { allowDeveloperModes: true },
          ),
      source = data['querySelector']('[data-story-clip-adjustment-mode-label]');
    if (source)
      source['textContent'] = options
        ? STORY_PROMPT_LANGUAGES['find']((el3) => el3['value'] === target)?.['label'] || '语言转换'
        : getStoryPromptModeLabel(target);
    enabled2['querySelectorAll']('[data-story-clip-adjustment-mode-option]')['forEach']((next) => {
      const current = next['dataset']['storyClipAdjustmentModeOption'] === target;
      (next['classList']['toggle']('is-selected', current),
        next['setAttribute']('aria-selected', String(current)));
    });
  }
  const el4 = el['querySelector']('[data-story-action="generate-clip-adjustment"]');
  if (el4) el4['disabled'] = !canGenerateStoryClipAdjustment(state, episode, clip);
  if (focus === 'trigger') el2['focus']({ preventScroll: true });
  if (focus === 'selected')
    (enabled2['querySelector']('[aria-selected="true"]') || enabled2['querySelector']('button'))?.['focus']({
      preventScroll: true,
    });
  if (focus === 'instruction')
    el['querySelector']('[data-story-clip-adjustment-instruction]')?.['focus']({ preventScroll: true });
  return true;
}
