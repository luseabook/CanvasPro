import { maskDebugPayloadSecrets } from "./debugRequestMasking.js";
import { buildDebugJsonPreview } from "./debugImagePreview.js";

export function buildGenerationDebugPreview({
  payload,
  promptPackage,
  notes = "",
} = {}) {
  if (!payload) {
    throw new Error("当前输入尚未构造出生成请求，请检查模型、提示词和素材。");
  }

  const maskedPayload = maskDebugPayloadSecrets(payload);
  return {
    tabs: [
      { label: "提示词", content: String(maskedPayload.prompt || "") },
      { label: "生成输入", ...buildDebugJsonPreview(maskedPayload) },
      {
        label: "参考图顺序",
        ...buildDebugReferenceImages(
          promptPackage?.referenceImages ||
            (payload.inputUrls || []).map((ref, index) => ({
              slot: index + 1,
              ref,
            })),
        ),
      },
      {
        label: "预览说明",
        content:
          "以上为真实生成链路组装的输入，尚未上传媒体或提交生成。厂商请求中的上传 URL、文件 ID 和任务 ID 在执行时确定。" +
          (notes ? "\n\n" + notes : ""),
      },
    ],
  };
}

function buildDebugReferenceImages(referenceImages) {
  return buildDebugJsonPreview(maskDebugPayloadSecrets(referenceImages), {
    imageContext: true,
  });
}
