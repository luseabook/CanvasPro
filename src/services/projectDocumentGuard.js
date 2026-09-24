// A missing or unsupported saved project must not be silently turned into an empty canvas.
const isCollection = value => Array.isArray(value) || !!value && typeof value === 'object';

export function unwrapProjectReadResponse(response) {
  // A 200/204 response with an empty body is not proof that the file is absent.
  if (response?.status === 404) return null;
  if (response?.data == null) throw new Error('工程读取响应为空但并非404；未以空画布替代');
  return response.data;
}

export function requireProjectDocument(data, { allowMissing = false } = {}) {
  if (data == null) {
    if (allowMissing) return null; // Only a deliberately new/default project may start blank.
    throw new Error('项目文件不存在或不可访问；未以空画布替代，请核对原保存位置');
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('项目文件格式不受支持；未以空画布替代');
  }
  if (data.canvases != null && !Array.isArray(data.canvases) ||
      ['nodes', 'v2_nodes', 'edges', 'v2_edges'].some(key => data[key] != null && !isCollection(data[key]))) {
    throw new Error('项目节点或画布集合结构无效；未以空画布替代');
  }
  if (Array.isArray(data.canvases)) {
    if (data.canvases.some(canvas => !canvas || typeof canvas !== 'object' || Array.isArray(canvas) ||
        typeof canvas.id !== 'string' || !canvas.id.trim() ||
        canvas.nodes != null && !isCollection(canvas.nodes) ||
        canvas.edges != null && !isCollection(canvas.edges))) {
      throw new Error('项目画布结构无效；未以空画布替代');
    }
    return data;
  }
  if (!isCollection(data.nodes) && !isCollection(data.v2_nodes)) {
    throw new Error('项目文件不含可识别的画布节点；未以空画布替代');
  }
  return data;
}

export function requireOpenedProjectDocument(response) {
  if (response?.success !== true) {
    throw new Error(response?.error || '桌面工程打开失败；未以空画布替代');
  }
  return requireProjectDocument(response.data);
}

export async function readProjectDocument(read, projectId, options) {
  return requireProjectDocument(await read(projectId), options);
}
