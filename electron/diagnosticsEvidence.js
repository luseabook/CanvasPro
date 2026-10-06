export function summarizeBackendLog(value = '') {
  const excerpt = String(value).split(/\r?\n/),
    recentFindings = [];
  let matchedLineCount = 0;
  const enabled =
    /(?:\[(?:ERROR|CRITICAL|WARN(?:ING)?)\]|\b(?:ERROR|CRITICAL|WARNING):|^Traceback \(most recent call last\):|^\s*[\w.]+(?:Error|Exception):|spawn error:|exited code=(?!0(?:\s|$))\S+)/i;
  for (let line = 0; line < excerpt.length; line += 1) {
    if (!enabled.test(excerpt[line])) continue;
    ((matchedLineCount += 1),
      recentFindings.push({
        line: line + 1,
        excerpt: excerpt.slice(Math.max(0, line - 2), line + 4)
          .join('\n')
          .slice(0, 1800),
      }));
    if (recentFindings.length > 30) recentFindings.shift();
  }
  return {
    detection: 'text-patterns',
    matchedLineCount: matchedLineCount,
    recentFindings: recentFindings,
    notes: [
      'Matches are possible backend problems, not deduplicated failures or root causes.',
      'Line numbers refer to the included server.log; unmarked errors may not match.',
    ],
  };
}
export function mergeDiagnosticEvidence(args, list) {
  const map = new Map();
  for (const enabled2 of [
    ...args,
    ...list.flatMap((item) => [
      ...(Array.isArray(item.precedingEvents) ? item.precedingEvents : []),
      item.event,
    ]),
  ]) {
    if (!enabled2 || typeof enabled2 !== 'object' || !enabled2.ts || !enabled2.type) continue;
    const key =
      enabled2.launchSessionId && enabled2.eventSeq
        ? enabled2.launchSessionId + ':' + enabled2.eventSeq
        : JSON.stringify(enabled2);
    if (!map.has(key)) map.set(key, enabled2);
  }
  return [...map.values()].sort(
    (index, result) =>
      String(index.ts).localeCompare(String(result.ts)) ||
      Number(index.eventSeq || 0) - Number(result.eventSeq || 0),
  );
}
