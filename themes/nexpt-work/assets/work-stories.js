(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motion = window.NexptMotion;
  document.querySelectorAll('[data-nexpt-showcase]').forEach(root => {
    const panels = [...root.querySelectorAll('[data-story-panel]')];
    const tabs = [...root.querySelectorAll('[data-story-tab]')];
    const dots = [...root.querySelectorAll('[data-story-dot]')];
    const scenes = panels.map(panel => panel.querySelector('[data-motion-scene]'));
    const playButton = root.querySelector('[data-story-play]');
    const controls = root.querySelector('[data-story-controls]');
    const status = root.querySelector('[data-story-status]');
    const motionNote = root.querySelector('[data-story-motion-note]');
    if (!motion || !panels.length || tabs.length !== panels.length || !playButton) return;
    let active = 0, playing = !reducedMotion.matches, inView = !('IntersectionObserver' in window), frame = 0, elapsed = 0, last = 0;
    const canPlay = () => playing && inView && !document.hidden && !reducedMotion.matches;
    const updateControls = () => {
      root.classList.toggle('is-playing', playing);
      playButton.setAttribute('aria-pressed', String(playing));
      const label = playing ? 'Produktanimationen pausieren' : 'Produktanimationen abspielen';
      playButton.setAttribute('aria-label', label);
      playButton.title = label;
      playButton.disabled = reducedMotion.matches;
      if (motionNote) motionNote.hidden = !reducedMotion.matches;
      if (status) status.setAttribute('aria-live', playing ? 'off' : 'polite');
    };
    const tick = now => {
      if (last) elapsed += Math.min(now - last, 120);
      last = now;
      if (elapsed >= motion.duration) { select(active + 1); return; }
      motion.render(scenes[active], elapsed);
      dots[active]?.style.setProperty('--story-progress', String(elapsed / motion.duration));
      frame = requestAnimationFrame(tick);
    };
    const syncPlayback = () => {
      cancelAnimationFrame(frame);
      last = 0;
      if (canPlay()) frame = requestAnimationFrame(tick);
      updateControls();
    };
    const select = (index, focusTab = false) => {
      const focusedControl = controls?.contains(document.activeElement) ? document.activeElement : null;
      const next = (index + panels.length) % panels.length;
      if (next !== active) {
        active = next;
        elapsed = 0;
        panels.forEach((panel, position) => { panel.hidden = position !== active; });
        tabs.forEach((tab, position) => {
          tab.setAttribute('aria-selected', String(position === active));
          tab.tabIndex = position === active ? 0 : -1;
        });
        dots.forEach((dot, position) => {
          if (position === active) dot.setAttribute('aria-current', 'true'); else dot.removeAttribute('aria-current');
          dot.style.setProperty('--story-progress', '0');
        });
        motion.render(scenes[active], playing ? 0 : 8000);
        if (!reducedMotion.matches) panels[active].querySelector('.nexpt-story-visual').animate(
          [{ opacity: .5, transform: 'translateX(12px)' }, { opacity: 1, transform: 'translateX(0)' }],
          { duration: 320, easing: 'ease-out' }
        );
      }
      if (controls) panels[active].querySelector('.nexpt-story-visual')?.after(controls);
      if (focusTab) tabs[active].focus({ preventScroll: true });
      else focusedControl?.focus({ preventScroll: true });
      if (status) status.textContent = `${panels[active].dataset.storyName} · ${active + 1} von ${panels.length}`;
      syncPlayback();
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(index));
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = active + 1;
        if (event.key === 'ArrowLeft') next = active - 1;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = panels.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        select(next, true);
      });
    });
    dots.forEach((dot, index) => dot.addEventListener('click', () => select(index)));
    root.querySelector('[data-story-previous]')?.addEventListener('click', () => select(active - 1));
    root.querySelector('[data-story-next]')?.addEventListener('click', () => select(active + 1));
    playButton.addEventListener('click', () => {
      if (reducedMotion.matches) return;
      playing = !playing;
      syncPlayback();
    });
    root.addEventListener('focusin', event => {
      if (playing && event.target.closest('[data-story-panel]') && !controls?.contains(event.target)) { playing = false; syncPlayback(); }
    });
    document.addEventListener('nexpt:modalopen', () => { playing = false; syncPlayback(); });
    document.addEventListener('visibilitychange', syncPlayback);
    reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) playing = false; syncPlayback(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      syncPlayback();
    }, { threshold: .2 }).observe(root.querySelector('[data-story-stage]') || root);
    root.classList.add('is-enhanced');
    if (controls) panels[active].querySelector('.nexpt-story-visual')?.after(controls);
    motion.render(scenes[active], playing ? 0 : 8000);
    syncPlayback();
  });

  document.querySelectorAll('[data-benefit-open]').forEach(button => {
    const dialog = document.getElementById(button.dataset.benefitOpen);
    if (!dialog) return;
    button.addEventListener('click', () => {
      if (dialog.open) return;
      dialog.showModal();
      document.dispatchEvent(new Event('nexpt:modalopen'));
    });
    dialog.addEventListener('close', () => button.focus({ preventScroll: true }));
    let backdropDown = false;
    const outside = event => {
      const box = dialog.getBoundingClientRect();
      return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
    };
    dialog.addEventListener('pointerdown', event => { backdropDown = event.target === dialog && outside(event); });
    dialog.addEventListener('click', event => {
      if (backdropDown && event.target === dialog && outside(event)) dialog.close();
      backdropDown = false;
    });
  });

  document.querySelectorAll('[data-nexpt-benefits]').forEach(root => {
    const track = root.querySelector('[data-benefit-track]');
    const previous = root.querySelector('[data-benefit-previous]');
    const next = root.querySelector('[data-benefit-next]');
    const cards = [...root.querySelectorAll('[data-benefit-card]')];
    if (!track || !previous || !next || !cards.length) return;
    const update = () => {
      const atStart = track.scrollLeft <= 2;
      const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
      previous.disabled = atStart;
      next.disabled = atEnd;
    };
    const move = direction => {
      const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 24;
      track.scrollBy({ left: direction * (cards[0].getBoundingClientRect().width + gap), behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    };
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    track.addEventListener('scroll', update, { passive: true });
    track.addEventListener('keydown', event => {
      if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    });
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(track);
    else window.addEventListener('resize', update);
    root.classList.add('is-enhanced');
    update();
  });
})();
