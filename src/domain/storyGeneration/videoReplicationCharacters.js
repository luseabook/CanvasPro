export const REPLICATION_CHARACTER_ROLES = Object.freeze({
  main: "主角",
  supporting: "配角",
  background: "背景人物",
  uncertain: "待确认",
});

export const REPLICATION_SUBJECT_TYPES = Object.freeze({
  person: "人物",
  animal: "动物",
  uncertain: "待确认",
});

export function getVideoReplicationCharacterRoster({
  characters = [],
  events = [],
} = {}) {
  return characters
    .map((character) => {
      const characterEvents = events.filter((event) =>
        event.characterIds.includes(character.id),
      );

      return {
        ...character,
        role: character.role || "uncertain",
        subjectType: character.subjectType || "uncertain",
        eventCount: characterEvents.length,
        firstSeenSec: characterEvents[0]?.startSec ?? null,
        dialogueCount: events.reduce(
          (count, event) =>
            count +
            event.dialogue.filter((line) => line.speakerId === character.id)
              .length,
          0,
        ),
      };
    })
    .sort((left, right) => {
      const roleOrder = { main: 0, supporting: 1, uncertain: 2, background: 3 };
      return (
        roleOrder[left.role] - roleOrder[right.role] ||
        (left.firstSeenSec ?? Infinity) - (right.firstSeenSec ?? Infinity)
      );
    });
}

export function getVideoReplicationCharacterSummary(source = {}) {
  const roster = getVideoReplicationCharacterRoster(source);

  return {
    total: roster.length,
    people: roster.filter((character) => character.subjectType === "person")
      .length,
    animals: roster.filter((character) => character.subjectType === "animal")
      .length,
    main: roster.filter((character) => character.role === "main").length,
    uncertain: roster.filter(
      (character) => character.role === "uncertain" || character.identityNotes,
    ).length,
  };
}
