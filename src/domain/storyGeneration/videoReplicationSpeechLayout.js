export function findReplicationSpeechBlock(
  blocks,
  startSec,
  round,
  offsetSec = 0,
  endSec,
) {
  const roundBoundary =
    endSec > startSec &&
    round(startSec - offsetSec) === round(endSec - offsetSec)
      ? (value) => value
      : round;
  const targetSec = roundBoundary(startSec - offsetSec);
  const index = blocks.findIndex(
    (block) =>
      targetSec >= roundBoundary(block.startSec - offsetSec) &&
      targetSec < roundBoundary(block.endSec - offsetSec),
  );
  return index >= 0 ? index : blocks.length - 1;
}

export function groupContinuousReplicationVoiceover(
  blocks,
  orderedBlocks,
  round,
  getSignature,
) {
  const grouped = [];
  let previousBlock;

  for (const block of blocks) {
    const previousGroup = grouped.at(-1);
    const part = block.parts.length === 1 ? block.parts[0] : null;
    const previousPart =
      previousGroup?.parts.length === 1 ? previousGroup.parts[0] : null;

    if (
      part?.kind === "voiceover" &&
      previousPart?.kind === "voiceover" &&
      getSignature(part) &&
      part.speakerId === previousPart.speakerId &&
      getSignature(part) === getSignature(previousPart) &&
      orderedBlocks.indexOf(block) ===
        orderedBlocks.indexOf(previousBlock) + 1 &&
      block.startSec >= previousGroup.endSec &&
      round(block.startSec) === round(previousGroup.endSec)
    ) {
      grouped[grouped.length - 1] = {
        ...previousGroup,
        endSec: block.endSec,
        parts: [{ ...previousPart, text: previousPart.text + part.text }],
      };
    } else {
      grouped.push(block);
    }

    previousBlock = block;
  }

  return grouped;
}
