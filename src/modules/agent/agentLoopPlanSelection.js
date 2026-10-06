export function selectAgentLoopPlanAction({
  rawPlan: rawPlan,
  actions: actions,
  validate: validate,
  completedFingerprints: completedFingerprints = [],
  fingerprint: fingerprint,
  onCompletedPrefix: onCompletedPrefix = null,
} = {}) {
  const list = Array.isArray(actions) ? actions : [],
    value = list.length > 0 ? { ...rawPlan, actions: [list[0]] } : rawPlan;
  let plan = value,
    validation = validate(value);
  if (list.length <= 1 || !validation.ok) return { plan: plan, validation: validation };
  for (let count = 0; count < list.length; count += 1) {
    const plan2 = { ...rawPlan, actions: [list[count]] },
      validation2 = count === 0 ? validation : validate(plan2);
    if (!validation2.ok) return { plan: plan2, validation: validation2 };
    const item = validation2.plan.actions[0];
    if (completedFingerprints.includes(fingerprint(item))) {
      onCompletedPrefix?.(item, count);
      continue;
    }
    ((plan = plan2), (validation = validation2));
    break;
  }
  return { plan: plan, validation: validation };
}
