document.addEventListener('DOMContentLoaded',()=>{
  const hero=document.querySelector('.rc-hero');
  if(!hero)return;
  const images=[...hero.querySelectorAll('.cinema-image')];
  if(!images.length)return;
  const button=hero.querySelector('.cinema-toggle');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let paused=false,visible=true;
  function syncMotion(){
    hero.classList.toggle('cinema-paused',paused||reduced.matches);
    hero.classList.toggle('cinema-idle',!visible||document.hidden);
    button.setAttribute('aria-pressed',String(paused||reduced.matches));
    button.setAttribute('aria-label',paused?'Resume moving background':'Pause moving background');
    button.innerHTML=paused?'<span aria-hidden="true">▶</span> Play background':'<span aria-hidden="true">Ⅱ</span> Pause background';
    button.hidden=reduced.matches;
  }
  function syncScene(){
    const current=hero.querySelector('.rc-slide.is-active');
    images.forEach(image=>image.classList.toggle('is-current',image.dataset.scene===current?.id));
  }
  new MutationObserver(syncScene).observe(hero.querySelector('.rc-stage'),{subtree:true,attributes:true,attributeFilter:['class']});
  button.addEventListener('click',()=>{paused=!paused;syncMotion();});
  document.addEventListener('visibilitychange',syncMotion);
  reduced.addEventListener('change',syncMotion);
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncMotion();},{threshold:.01}).observe(hero);
  syncScene();syncMotion();
});
