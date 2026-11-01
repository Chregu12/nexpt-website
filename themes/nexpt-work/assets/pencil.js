(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches || !('IntersectionObserver' in window)) return;
  const accents = [...document.querySelectorAll('[data-pencil]')];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-pencil-drawn');
      observer.unobserve(entry.target);
    });
  }, { threshold: .2 });
  accents.forEach(accent => {
    accent.querySelectorAll('.pencil-stroke').forEach((stroke, index) => stroke.style.setProperty('--pencil-delay', `${180 + index * 180}ms`));
    accent.classList.add('pencil-armed');
    observer.observe(accent);
  });
  reduced.addEventListener('change', () => {
    if (!reduced.matches) return;
    observer.disconnect();
    accents.forEach(accent => accent.classList.remove('pencil-armed'));
  });
})();
