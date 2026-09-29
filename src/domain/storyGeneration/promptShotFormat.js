import {
  isStoryContinuousTimelinePromptMode,
  isStoryWan30PromptMode,
} from "./promptModes.js";

export function formatStoryPromptShotHeading({
  promptMode,
  index,
  durationSec,
  timeRange,
}) {
  if (isStoryContinuousTimelinePromptMode(promptMode)) {
    return isStoryWan30PromptMode(promptMode)
      ? `镜头${index + 1} [${timeRange}]`
      : timeRange;
  }

  return `分镜${index + 1} ⏱ ${Number(durationSec).toFixed(1)}s`;
}
