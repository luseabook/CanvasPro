const TIME_SLACK = 1;

export function normalizeFlowSource(source, durationSec) {
  const normalized = structuredClone(source);
  const adjustments = [];

  const setField = (target, field, nextValue, kind) => {
    if (target[field] === nextValue) return;
    adjustments.push({
      id: target.id,
      field,
      from: target[field] ?? null,
      to: nextValue,
      kind,
    });
    target[field] = nextValue;
  };

  const fillOptionalFields = (target, fields) => {
    if (!target || typeof target !== "object") return;
    for (const field of fields) {
      if (target[field] == null) setField(target, field, "", "optional-field");
    }
  };

  for (const character of normalized?.characters || []) {
    fillOptionalFields(character, ["appearance"]);
  }

  if (Array.isArray(normalized?.shots)) {
    for (const [index, shot] of normalized.shots.entries()) {
      fillOptionalFields(shot, ["camera", "sound", "uncertainty"]);
      if (
        !Number.isFinite(shot?.startSec) ||
        !Number.isFinite(shot?.endSec) ||
        shot.endSec <= shot.startSec
      ) {
        continue;
      }

      if (
        index === 0 &&
        Math.abs(shot.startSec) <= TIME_SLACK &&
        shot.endSec > 0
      ) {
        setField(shot, "startSec", 0, "time-boundary");
      }

      const previousShot = normalized.shots[index - 1];
      if (
        previousShot &&
        Number.isFinite(previousShot.endSec) &&
        Math.abs(shot.startSec - previousShot.endSec) <= TIME_SLACK &&
        shot.startSec > previousShot.startSec
      ) {
        setField(previousShot, "endSec", shot.startSec, "time-boundary");
      }
    }

    const lastShot = normalized.shots.at(-1);
    if (
      lastShot &&
      Number.isFinite(lastShot.endSec) &&
      Math.abs(lastShot.endSec - durationSec) <= TIME_SLACK &&
      durationSec > lastShot.startSec
    ) {
      setField(lastShot, "endSec", durationSec, "time-boundary");
    }
  }

  if (Array.isArray(normalized?.speech)) {
    for (const speech of normalized.speech) {
      if (!speech || typeof speech !== "object") continue;

      for (const part of Array.isArray(speech.parts) ? speech.parts : []) {
        fillOptionalFields(part, ["uncertainty", "speakerId"]);
      }

      if (
        speech.startSec < 0 &&
        speech.startSec >= -TIME_SLACK &&
        speech.endSec > 0
      ) {
        setField(speech, "startSec", 0, "time-boundary");
      }
      if (
        speech.endSec > durationSec &&
        speech.endSec <= durationSec + TIME_SLACK &&
        speech.startSec < durationSec
      ) {
        setField(speech, "endSec", durationSec, "time-boundary");
      }
    }
  }

  const notes = ["time-boundary", "optional-field"].flatMap((kind) => {
    const matching = adjustments.filter(
      (adjustment) => adjustment.kind === kind,
    );
    return matching.length
      ? [
          {
            code: "source-normalized",
            blocking: false,
            kind,
            adjustments: matching,
            detail:
              kind === "time-boundary"
                ? `已自动对齐 ${matching.length} 处不超过 1 秒的时间偏差`
                : `已补齐 ${matching.length} 个可选空字段`,
          },
        ]
      : [];
  });

  return { source: normalized, notes };
}
