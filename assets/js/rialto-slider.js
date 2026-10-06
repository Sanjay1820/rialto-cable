/**
 * Rialto Cables - Full Image Banner Slider Logic
 * Guaranteed 1920x890 uncropped aspect ratio with smooth transitions,
 * autoplay, pause-on-hover, dot navigation, and touch swipe.
 */
document.addEventListener('DOMContentLoaded', function () {
  const track = document.getElementById('rialtoSliderTrack');
  if (!track) return;

  const slides = track.querySelectorAll('.rialto-slide');
  const prevBtn = document.getElementById('sliderPrevBtn');
  const nextBtn = document.getElementById('sliderNextBtn');
  const currentNumEl = document.getElementById('sliderCurrentNum');
  const totalNumEl = document.getElementById('sliderTotalNum');
  const dotsContainer = document.getElementById('sliderDots');

  if (!slides.length) return;

  let currentIndex = 0;
  const totalSlides = slides.length;
  let autoplayTimer = null;
  const AUTOPLAY_INTERVAL = 5500;

  // Format number as 2 digits: "01", "02"
  const pad = (n) => (n < 10 ? '0' + n : '' + n);

  if (totalNumEl) {
    totalNumEl.textContent = pad(totalSlides);
  }

  // Generate dots
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalSlides; i++) {
      const dot = document.createElement('button');
      dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(dot);
    }
  }

  function updateSlider() {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    if (currentNumEl) {
      currentNumEl.textContent = pad(currentIndex + 1);
    }

    if (dotsContainer) {
      const dots = dotsContainer.querySelectorAll('.slider-dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentIndex);
      });
    }

    // Trigger smooth water ripple wave across new slide
    if (typeof window.triggerSliderRipple === 'function') {
      window.triggerSliderRipple();
    }
  }

  function goToSlide(index) {
    currentIndex = (index + totalSlides) % totalSlides;
    updateSlider();
    resetAutoplay();
  }

  function nextSlide() {
    goToSlide(currentIndex + 1);
  }

  function prevSlide() {
    goToSlide(currentIndex - 1);
  }

  if (nextBtn) nextBtn.addEventListener('click', nextSlide);
  if (prevBtn) prevBtn.addEventListener('click', prevSlide);

  // Autoplay
  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(nextSlide, AUTOPLAY_INTERVAL);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function resetAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  const sliderViewport = track.closest('.rialto-slider-viewport') || track.parentElement;
  if (sliderViewport) {
    sliderViewport.addEventListener('mouseenter', stopAutoplay);
    sliderViewport.addEventListener('mouseleave', startAutoplay);

    // Touch swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    sliderViewport.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    sliderViewport.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 40) {
        if (diff < 0) nextSlide();
        else prevSlide();
      }
    }
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') nextSlide();
    if (e.key === 'ArrowLeft') prevSlide();
  });

  // Initialize
  updateSlider();
  startAutoplay();
});
