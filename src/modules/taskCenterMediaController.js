import { bindRefThumbHoverPreview, hideRefThumbHoverPreview } from './refThumbHoverPreview.js';
export function createTaskCenterMediaController(root) {
  const map = new Map();
  let enabled = false,
    bindRefThumbHoverPreview2 = null;
  const run = (value) => {
      (hideRefThumbHoverPreview(value.wrap),
        value.image.removeAttribute('src'),
        (value.image.hidden = true),
        (value.wrap.dataset.thumbSrc = ''),
        (value.wrap.tabIndex = -1));
    },
    handler = (enabled2) => {
      if (!enabled || !enabled2.inView || !enabled2.src || enabled2.failed) return run(enabled2);
      ((enabled2.wrap.dataset.thumbSrc = enabled2.src), (enabled2.wrap.tabIndex = 0));
      if (enabled2.image.getAttribute('src') !== enabled2.src)
        enabled2.image.setAttribute('src', enabled2.src);
      enabled2.image.hidden = false;
    },
    item =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(
            (key) => {
              for (const event of key) {
                const enabled3 = map.get(event.target);
                if (!enabled3) continue;
                ((enabled3.inView = event.isIntersecting), handler(enabled3));
              }
            },
            { root: root, threshold: 0 },
          )
        : null;
  return {
    sync(index) {
      const map2 = new Set();
      for (const result of index) {
        const { wrap: wrap, image: image, src: src } = result.thumbnail;
        map2.add(wrap);
        let enabled4 = map.get(wrap);
        !enabled4 &&
          ((enabled4 = { wrap: wrap, image: image, src: '', inView: false, failed: false }),
          map.set(wrap, enabled4),
          (image.onerror = () => {
            ((enabled4.failed = true), run(enabled4));
          }));
        if (enabled4.src !== src) {
          (run(enabled4),
            (enabled4.src = src),
            (enabled4.failed = false),
            (enabled4.inView = false),
            item?.unobserve(wrap));
          if (enabled && src) item?.observe(wrap);
        }
        handler(enabled4);
      }
      for (const [data, options] of map) {
        if (map2.has(data)) continue;
        (run(options), item?.unobserve(data), (options.image.onerror = null), map.delete(data));
      }
    },
    setVisible(target) {
      if (enabled === target) return;
      ((enabled = target),
        bindRefThumbHoverPreview2?.(),
        (bindRefThumbHoverPreview2 = null),
        item?.disconnect());
      for (const source of map.values()) {
        ((source.inView = false), run(source));
        if (enabled && source.src) item?.observe(source.wrap);
      }
      if (enabled)
        bindRefThumbHoverPreview2 = bindRefThumbHoverPreview(root, {
          selector: '.v2-task-thumbnail',
          preload: false,
          releaseOnHide: true,
          viewportBounded: true,
          pauseOnScroll: true,
        });
    },
  };
}
