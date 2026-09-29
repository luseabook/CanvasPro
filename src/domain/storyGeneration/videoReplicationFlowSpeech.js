export function sliceFlowSpeech(block, startSec, endSec) {
  if (
    block.parts.length &&
    block.parts.every(
      (part) =>
        part.timingSource === "asr" &&
        part.words?.length &&
        part.words.map((word) => word.text).join("") === part.text,
    )
  ) {
    const parts = block.parts.flatMap((part) => {
      const words = part.words.filter(
        (word) => word.startSec >= startSec && word.startSec < endSec,
      );
      return words.length
        ? [
            {
              ...part,
              words,
              text: words.map((word) => word.text).join(""),
              startSec: words[0].startSec,
              endSec: words.at(-1).endSec,
            },
          ]
        : [];
    });
    return { sourceId: block.id, startSec, endSec, estimated: false, parts };
  }

  const characterGroups = block.parts.map((part) => [...part.text]);
  const characters = characterGroups.flat();
  const boundaryIndexes = characters.flatMap((character, index) =>
    /[，。！？；、,.!?;:\s]/u.test(character) ? [index + 1] : [],
  );
  const timeToIndex = (timeSec) => {
    if (timeSec <= block.startSec) return 0;
    if (timeSec >= block.endSec) return characters.length;

    const estimatedIndex = Math.floor(
      (characters.length * (timeSec - block.startSec)) /
        (block.endSec - block.startSec),
    );
    const nearestBoundary = boundaryIndexes.reduce(
      (best, boundary) =>
        Math.abs(boundary - estimatedIndex) < Math.abs(best - estimatedIndex)
          ? boundary
          : best,
      Infinity,
    );
    return Math.abs(nearestBoundary - estimatedIndex) <=
      Math.min(10, characters.length * 0.1)
      ? nearestBoundary
      : estimatedIndex;
  };

  const startIndex = timeToIndex(startSec);
  const endIndex = timeToIndex(endSec);
  let consumedCharacters = 0;
  const parts = block.parts.flatMap((part, index) => {
    const text = characterGroups[index]
      .slice(
        Math.max(0, startIndex - consumedCharacters),
        Math.max(0, endIndex - consumedCharacters),
      )
      .join("");
    consumedCharacters += characterGroups[index].length;
    return text ? [{ ...part, text }] : [];
  });

  return {
    sourceId: block.id,
    startSec: Math.max(startSec, block.startSec),
    endSec: Math.min(endSec, block.endSec),
    estimated: startSec > block.startSec || endSec < block.endSec,
    parts,
  };
}
