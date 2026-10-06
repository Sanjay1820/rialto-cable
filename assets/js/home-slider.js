document.addEventListener('DOMContentLoaded', function () {
  const hero = document.querySelector('.rc-hero');
  if (!hero) return;
  const slides = Array.from(hero.querySelectorAll('.rc-slide'));
  const tabs = Array.from(hero.querySelectorAll('.rc-tab'));
  const backdrops = Array.from(hero.querySelectorAll('.rc-backdrop'));
  const pause = hero.querySelector('.rc-pause');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const interval = 6500;
  // Load every product before navigation, including slides hidden at startup.
  // Firefox can defer lazy images inside invisible slides indefinitely.
  slides.forEach(slide => {
    const image = slide.querySelector('.rc-visual img');
    if (image) image.loading = 'eager';
  });
  let index = 0;
  let timer = null;
  let remaining = interval;
  let startedAt = 0;
  let userPaused = false;
  let hovered = false;
  let focused = false;
  let visible = true;
  const shouldPause = () => userPaused || hovered || focused || document.hidden || !visible || reducedMotion.matches;

  function schedule() {
    if (timer !== null) {
      clearTimeout(timer);
      remaining = Math.max(0, remaining - (performance.now() - startedAt));
      timer = null;
    }
    hero.classList.toggle('is-paused', shouldPause());
    if (!shouldPause()) {
      startedAt = performance.now();
      timer = setTimeout(() => { timer = null; show(index + 1); }, remaining);
    }
  }

  function show(next) {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    index = (next + slides.length) % slides.length;
    backdrops.forEach(backdrop => {
      backdrop.classList.toggle('is-active', backdrop.dataset.slide === slides[index].id);
    });
    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
      slide.inert = !active;
      tabs[i].setAttribute('aria-current', String(active));
    });
    // Restart the progress indicator when selecting the same category again.
    const progress = tabs[index];
    progress.style.animation = 'none';
    progress.removeAttribute('aria-current');
    void progress.offsetWidth;
    progress.style.animation = '';
    progress.setAttribute('aria-current', 'true');
    remaining = interval;
    schedule();
  }

  tabs.forEach((tab, i) => tab.addEventListener('click', () => show(i)));
  hero.querySelector('.rc-prev').addEventListener('click', () => show(index - 1));
  hero.querySelector('.rc-next').addEventListener('click', () => show(index + 1));
  pause.addEventListener('click', () => {
    userPaused = !userPaused;
    pause.textContent = userPaused ? '\u25b6' : '\u2161';
    pause.setAttribute('aria-label', userPaused ? 'Play slideshow' : 'Pause slideshow');
    pause.setAttribute('aria-pressed', String(userPaused));
    schedule();
  });
  hero.addEventListener('mouseenter', () => { hovered = true; schedule(); });
  hero.addEventListener('mouseleave', () => { hovered = false; schedule(); });
  hero.addEventListener('focusin', () => { focused = true; schedule(); });
  hero.addEventListener('focusout', event => {
    focused = hero.contains(event.relatedTarget);
    schedule();
  });
  hero.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      show(index + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  let touch = null;
  hero.addEventListener('touchstart', event => {
    touch = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
  }, { passive: true });
  hero.addEventListener('touchend', event => {
    if (!touch) return;
    const dx = event.changedTouches[0].clientX - touch.x;
    const dy = event.changedTouches[0].clientY - touch.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
    touch = null;
  }, { passive: true });
  hero.addEventListener('touchcancel', () => { touch = null; }, { passive: true });
  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener('change', schedule);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      schedule();
    }, { threshold: .15 }).observe(hero);
  }
  show(0);
});
