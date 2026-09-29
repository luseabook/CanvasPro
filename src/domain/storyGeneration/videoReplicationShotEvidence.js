import { replicationVisualFields } from "./videoReplicationVisualState.js";

const fail = (message) => {
  throw Object.assign(new Error(message), {
    code: "SOURCE_ANALYSIS_REPAIRABLE",
  });
};

export function hasReplicationInternalCut({ visual = "", camera = "" } = {}) {
  const normalizedVisual = String(visual || "")
    .trim()
    .replace(/^(?:场景|画面)(?:切换至|切至|切到)/u, "");

  return /切至|切到|切换至|再切|正反打|连续调整构图/u.test(
    `${normalizedVisual} ${camera || ""}`,
  );
}

export const REPLICATION_SHOT_GUIDANCE =
  "片段是一次生成的总区间，shot 是其中一个可见镜头，不是剧情摘要。以原片 events[].shots 的切镜、场景边界与 speechRefs 为依据，按 speechOrder 将人声放回对应画面。每个 shot 对应实际观察的镜头，不将不同切镜串成一个镜头或改写为连续运镜。真实连续长镜头及同机位自然推进可保留，不按景别词数量机械拆镜。人物说话须有对应的景别、动作和表演阶段；画外音可跨镜，但不是合并镜头的理由。画外音→人物对白→画外音分别关联对应镜头，不用‘旁白覆盖整段’抹掉中间对白。保留整数秒的连续区间、片段总时长和原有人声顺序，不机械均分秒数，不新增原片没有的镜头。";

export function normalizeReplicationObservedShots(observedShots, event) {
  if (observedShots == null) return undefined;
  if (!Array.isArray(observedShots) || !observedShots.length) {
    fail("原片事件缺少可核对的镜头边界。");
  }

  const seenIds = new Set();
  const expectedSpeechRefs = new Set(
    ["dialogue", "voiceover"].flatMap((kind) =>
      (event[kind] || []).map((_, index) => `${kind}:${index}`),
    ),
  );
  const assignedSpeechRefs = new Set();
  let previousEndSec = event.startSec;

  const normalized = observedShots.map((shot) => {
    const id = String(shot.id || "").trim();
    const startSec = Number(shot.startSec);
    const endSec = Number(shot.endSec);

    if (
      !id ||
      seenIds.has(id) ||
      !Number.isFinite(startSec) ||
      !Number.isFinite(endSec) ||
      startSec < event.startSec ||
      endSec > event.endSec ||
      startSec < previousEndSec ||
      endSec <= startSec
    ) {
      fail("原片镜头编号或时间边界无效，镜头须按顺序处于所属事件内。");
    }

    const speechRefs = shot.speechRefs;
    if (
      !Array.isArray(speechRefs) ||
      speechRefs.some((ref) => !expectedSpeechRefs.has(ref)) ||
      new Set(speechRefs).size !== speechRefs.length
    ) {
      fail("原片镜头的人声引用无效。");
    }

    speechRefs.forEach((ref) => assignedSpeechRefs.add(ref));
    seenIds.add(id);
    previousEndSec = endSec;

    return {
      id,
      startSec,
      endSec,
      ...replicationVisualFields(shot),
      visual: String(shot.visual || "").trim(),
      camera: String(shot.camera || "").trim(),
      speechRefs: [...speechRefs],
    };
  });

  if ([...expectedSpeechRefs].some((ref) => !assignedSpeechRefs.has(ref))) {
    fail("原片有逐句人声未关联到对应镜头。");
  }

  return normalized;
}

export function inspectReplicationSourceShotCoverage(
  { clips = [] } = {},
  context = {},
) {
  return clips.flatMap((clip) => {
    const segmentPlanEntry = context.replication?.segmentPlan?.find(
      (entry) => entry.ref === clip.ref,
    );
    const sourceStartSec =
      segmentPlanEntry?.sourceStartSec ?? clip.sourceStartSec;
    const sourceEndSec = segmentPlanEntry?.sourceEndSec ?? clip.sourceEndSec;
    if (!Number.isFinite(sourceStartSec) || !Number.isFinite(sourceEndSec))
      return [];

    const events =
      segmentPlanEntry?.events ||
      clip.replicationSpeechEvents ||
      context.replication?.sourceAnalysis?.events ||
      [];
    const visibleShots = events
      .flatMap((event) => event.shots || [])
      .filter(
        (shot) =>
          Math.round(Math.min(sourceEndSec, shot.endSec) - sourceStartSec) >
          Math.round(Math.max(sourceStartSec, shot.startSec) - sourceStartSec),
      );

    if (visibleShots.length <= (clip.shots || []).length) {
      let elapsedSec = 0;
      const generatedBoundaries = (clip.shots || []).map((shot) => {
        const boundarySec = elapsedSec;
        elapsedSec += Number(shot.durationSec || 0);
        return boundarySec;
      });
      const missingBoundaries = visibleShots
        .map((shot) => Math.round(shot.startSec - sourceStartSec))
        .filter(
          (boundarySec) =>
            boundarySec > 0 &&
            boundarySec < elapsedSec &&
            !generatedBoundaries.some(
              (generated) => Math.abs(generated - boundarySec) <= 1,
            ),
        );

      return missingBoundaries.length
        ? [
            {
              clipRef: clip.ref,
              code: "replication_shot_boundary_missing",
              message: `原片在本段约 ${missingBoundaries.join("、")} 秒的切镜缺少对应生成区间；镜头数足够不代表切点正确，不能机械均分或提前挤压画面。`,
            },
          ]
        : [];
    }

    return [
      {
        clipRef: clip.ref,
        code: "replication_shot_coverage_missing",
        message: `本片段原片有 ${visibleShots.length} 个可见镜头区间，生成结果仅 ${
          clip.shots?.length || 0
        } 个 shot；需按切镜和人声对应关系补全镜头时间轴，不能把多个镜头写成一段摘要。`,
      },
    ];
  });
}
