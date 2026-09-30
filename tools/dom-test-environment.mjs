import { JSDOM } from 'jsdom';
/** Real standards-based DOM for offline component tests; no absent fixture or browser is impersonated. */
export function installDomEnvironment() {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://127.0.0.1/', pretendToBeVisual: true });
  const names = ['window','document','navigator','Element','HTMLElement','Node','DocumentFragment','MutationObserver','CustomEvent','Event','MouseEvent','KeyboardEvent','HTMLInputElement','HTMLTextAreaElement','HTMLSelectElement','HTMLImageElement','HTMLVideoElement','HTMLAudioElement','HTMLMediaElement','HTMLCanvasElement','Image','DOMParser','getComputedStyle','localStorage','sessionStorage','requestAnimationFrame','cancelAnimationFrame'];
  const saved = new Map();
  for (const name of names) {
    saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));
    const value = name === 'window' ? dom.window : typeof dom.window[name] === 'function' && ['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'].includes(name) ? dom.window[name].bind(dom.window) : dom.window[name];
    if(value!==undefined)Object.defineProperty(globalThis,name,{value,configurable:true,writable:true});
  }
  // Scripts and external resources are deliberately not enabled. Tests mock media/IPC boundaries explicitly.
  return () => {
    dom.window.close();
    for (const [name,descriptor] of saved) { if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name]; }
  };
}
export function createPreviewContainer() {
  if (!globalThis.document?.createElement) throw new Error('Install the DOM environment before creating a preview');
  const element = document.createElement('div');
  element.className = 'node-preview';
  document.body.appendChild(element);
  return element;
}
