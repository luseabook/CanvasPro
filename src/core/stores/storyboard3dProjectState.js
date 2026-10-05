export function cloneStoryboard3DProjects(value, handler) {
  return Array['isArray'](value) ? handler(value) : [];
}
export function createStoryboard3DProjectActions({
  readProjects: readProjects,
  writeProjects: writeProjects,
  clone: clone,
} = {}) {
  function upsertStoryboard3DProject(item) {
    const enabled = String(item?.['id'] || '')['trim']();
    if (!enabled) throw new Error('[store] upsertStoryboard3DProject() 需要项目 id');
    const key = clone(item),
      list = Array['isArray'](readProjects()) ? [...readProjects()] : [],
      count = list['findIndex']((index) => String(index?.['id'] || '') === enabled);
    if (count >= 0) list[count] = key;
    else list['unshift'](key);
    return (writeProjects(list), clone(key));
  }
  function deleteStoryboard3DProject(result) {
    const enabled2 = String(result || '')['trim'](),
      list2 = readProjects();
    if (!enabled2 || !Array['isArray'](list2)) return false;
    const list3 = list2['filter']((data) => String(data?.['id'] || '') !== enabled2);
    if (list3['length'] === list2['length']) return false;
    return (writeProjects(list3), true);
  }
  return {
    upsertStoryboard3DProject: upsertStoryboard3DProject,
    deleteStoryboard3DProject: deleteStoryboard3DProject,
  };
}
