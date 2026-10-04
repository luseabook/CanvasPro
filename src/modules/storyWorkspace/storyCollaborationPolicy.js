export function isStoryCollaborationProject(value) {
  const item = value?.['project']?.['collaboration']?.['stage'];
  return item === 'writing' || item === 'confirmed';
}
