(() => {
  const duration = 10000;
  const timelines = new WeakMap();
  const frames = {
    'work-card': [
      { transform: 'translateX(0)', offset: 0 },
      { transform: 'translateX(0)', offset: .12 },
      { transform: 'translateX(345px)', offset: .34 },
      { transform: 'translateX(345px)', offset: .6 },
      { transform: 'translateX(690px)', offset: .82 },
      { transform: 'translateX(690px)', offset: 1 }
    ],
    'work-progress': [
      { transform: 'scaleX(.2)', offset: 0 },
      { transform: 'scaleX(.2)', offset: .12 },
      { transform: 'scaleX(.6)', offset: .34 },
      { transform: 'scaleX(.6)', offset: .6 },
      { transform: 'scaleX(1)', offset: .82 },
      { transform: 'scaleX(1)', offset: 1 }
    ],
    'work-done': [{ opacity: 0, offset: 0 }, { opacity: 0, offset: .8 }, { opacity: 1, offset: .86 }, { opacity: 1, offset: 1 }],
    'hr-request': [{ opacity: 0, transform: 'translateY(14px)', offset: 0 }, { opacity: 1, transform: 'translateY(0)', offset: .18 }, { opacity: 1, offset: .46 }, { opacity: 0, offset: .52 }, { opacity: 0, offset: 1 }],
    'hr-check': [{ opacity: 0, offset: 0 }, { opacity: 0, offset: .46 }, { opacity: 1, offset: .54 }, { opacity: 1, offset: 1 }],
    'hr-approved': [{ opacity: 0, offset: 0 }, { opacity: 0, offset: .62 }, { opacity: 1, offset: .72 }, { opacity: 1, offset: 1 }],
    'hr-transfer': [{ opacity: .25, transform: 'translateX(-5px)', offset: 0 }, { opacity: 1, transform: 'translateX(0)', offset: .3 }, { opacity: .25, offset: .8 }, { opacity: .25, offset: 1 }],
    'outline-selection': [{ transform: 'scaleX(0)', offset: 0 }, { transform: 'scaleX(0)', offset: .1 }, { transform: 'scaleX(1)', offset: .3 }, { transform: 'scaleX(1)', offset: 1 }],
    'outline-comment': [{ opacity: 0, transform: 'translateX(12px)', offset: 0 }, { opacity: 0, transform: 'translateX(12px)', offset: .32 }, { opacity: 1, transform: 'translateX(0)', offset: .46 }, { opacity: 1, transform: 'translateX(0)', offset: 1 }],
    'outline-link': [{ opacity: 0, transform: 'translateY(10px)', offset: 0 }, { opacity: 0, transform: 'translateY(10px)', offset: .6 }, { opacity: 1, transform: 'translateY(0)', offset: .74 }, { opacity: 1, transform: 'translateY(0)', offset: 1 }]
  };
  const render = (scene, time) => {
    if (!scene || !Element.prototype.animate) return;
    if (!timelines.has(scene)) {
      const animations = [...scene.querySelectorAll('[data-motion]')].map(element => {
        const animation = element.animate(frames[element.dataset.motion], { duration, fill: 'both', easing: 'ease-in-out' });
        animation.pause();
        return animation;
      });
      timelines.set(scene, animations);
    }
    timelines.get(scene).forEach(animation => { animation.currentTime = Math.max(0, Math.min(duration, time)); });
  };
  window.NexptMotion = { render, duration };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-product-motion]').forEach(root => {
    const scene = root.querySelector('[data-motion-scene]');
    const button = root.querySelector('[data-motion-play]');
    if (!scene || !button) return;
    let playing = !reduced.matches, visible = !('IntersectionObserver' in window), elapsed = 0, last = 0, frame = 0;
    const tick = now => {
      if (last) elapsed = (elapsed + Math.min(now - last, 120)) % duration;
      last = now;
      render(scene, elapsed);
      root.style.setProperty('--motion-progress', String(elapsed / duration));
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      last = 0;
      const label = playing ? 'Animation pausieren' : 'Animation abspielen';
      button.setAttribute('aria-label', label);
      button.title = label;
      button.setAttribute('aria-pressed', String(playing));
      button.disabled = reduced.matches;
      if (playing && visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(tick);
    };
    button.addEventListener('click', () => { if (!reduced.matches) { playing = !playing; sync(); } });
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', () => { if (reduced.matches) playing = false; sync(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: .2 }).observe(scene);
    root.classList.add('is-motion-enhanced');
    render(scene, playing ? 0 : 8000);
    sync();
  });
})();
