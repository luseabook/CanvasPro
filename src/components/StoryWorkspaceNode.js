import { ensureStoryWorkspaceStyles, openStoryWorkspace, storyElement } from '../modules/storyWorkspace/StoryWorkspaceEditor.js';
import { normalizeStoryWorkspace } from '../modules/storyWorkspace/storyWorkspaceModel.js';

export class StoryWorkspaceNode {
  constructor(data) { this.data = data; this.id = data.id; this.abort = new AbortController(); this.editor = null; }
  mount() {
    ensureStoryWorkspaceStyles(); this.el = storyElement('div', 'v2-node-component sw-node');
    const eyebrow = storyElement('div', 'sw-eyebrow', 'STORY WORKSPACE');
    this.title = storyElement('h3'); this.summary = storyElement('p');
    const button = storyElement('button', 'sw-button sw-open', '打开剧本工作室'); button.type = 'button';
    button.addEventListener('click', () => {
      try { this.editor = openStoryWorkspace(this.id); }
      catch (error) { this.summary.textContent = error.message; }
    }, { signal: this.abort.signal });
    this.el.append(eyebrow, this.title, this.summary, button, storyElement('small', '', '剧本 · 人物 · 场景 · 分镜｜先应用到项目，再保存工程'));
    for (const type of ['pointerdown', 'dblclick']) this.el.addEventListener(type, event => {
      if (event.button === 0 && !window._spaceHeld) event.stopPropagation();
    }, { signal: this.abort.signal });
    this.update(this.data); return this.el;
  }
  update(data) {
    this.data = data;
    if (!this.el) return;
    if (this.summaryRendered && this.summaryWorkspace === data.storyWorkspace) return;
    this.summaryRendered = true; this.summaryWorkspace = data.storyWorkspace;
    try {
      const workspace = normalizeStoryWorkspace(data.storyWorkspace);
      this.title.textContent = workspace.title || '剧本工作室';
      const shots = workspace.episodes.reduce((sum, episode) => sum + episode.shots.length, 0);
      this.summary.textContent = `${workspace.episodes.length} 集 · ${shots} 个分镜 · ${workspace.characters.length} 位人物 · ${workspace.scenes.length} 个场景`;
    } catch (error) { this.title.textContent = data.name || '剧本工作室'; this.summary.textContent = error.message; }
  }
  unmount() { this.abort.abort(); this.editor?.ownerUnmounted(); }
}
