document.addEventListener('DOMContentLoaded', function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      const duration = Number(element.dataset.revealDuration) || 700;
      element.style.setProperty('--reveal-duration', Math.min(duration, 900) + 'ms');
      element.classList.add('is-revealed');
      observer.unobserve(element);
    });
  }, { threshold: .05, rootMargin: '0px 0px -24px 0px' });
  document.querySelectorAll('[data-reveal]').forEach(function (element) {
    // Animate the containing column once; nested text stays readable throughout.
    if (!element.parentElement.closest('[data-reveal]')) observer.observe(element);
  });
});
