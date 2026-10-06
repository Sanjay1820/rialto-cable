document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.openInquiryModal !== 'function') window.openInquiryModal = product => {
    const modal = document.getElementById('quickInquiryModal');
    const input = document.getElementById('inquiryProductInput');
    if (input) input.value = product || 'General Cable Inquiry';
    if (modal && window.bootstrap) window.bootstrap.Modal.getOrCreateInstance(modal).show();
    else window.location.href = 'inquiry.html';
  };
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('main > section, main > .container > .row').forEach(element => element.classList.add('at-reveal'));
  const elements = document.querySelectorAll('.at-reveal');
  if ('IntersectionObserver' in window && !motion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    elements.forEach(element => observer.observe(element));
  }
  const form = document.querySelector('.at-quote-form');
  if (form) form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const subject = `Cable inquiry — ${data.get('category') || 'Custom requirement'}`;
    const body = `Hello Rialto Cables,\n\nCompany / name: ${data.get('company')}\nEmail: ${data.get('email')}\nPhone: ${data.get('phone')}\nCable category: ${data.get('category') || 'Please advise'}\n\nRequirements:\n${data.get('specs')}\n\nPlease share your technical recommendation and quotation.`;
    window.location.href = `mailto:exports@rialtocables.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
  const topButton = document.getElementById('scrollTopBtn');
  if (topButton) {
    const updateTop = () => topButton.classList.toggle('at-visible', window.scrollY > 450);
    window.addEventListener('scroll', updateTop, { passive: true });
    topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: motion.matches ? 'instant' : 'smooth' }));
    updateTop();
  }
});
