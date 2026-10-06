document.addEventListener('DOMContentLoaded', () => {
  if (!document.body.classList.contains('homepage1-body')) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const main = document.querySelector('#main-content');
  const cards = [...document.querySelectorAll('.at-card')];
  const progress = document.createElement('div');
  progress.className = 'home-scroll-line';progress.setAttribute('aria-hidden','true');
  document.body.appendChild(progress);
  // Replay a staggered spring entrance when content returns to the viewport.
  // Individual translate/scale leaves the existing pointer tilt untouched.
  if (main && 'IntersectionObserver' in window && Element.prototype.animate) {
    main.classList.add('motion-ready');
    const selector = '.at-kicker,.at-title,.at-copy,.at-link,.at-button,.at-checks > span,' +
      '.at-card,.at-industry,.at-catalog,.at-story-image,.at-process > a,' +
      '.earth-stage,.earth-caption,.earth-controls,#quotation [data-reveal]';
    const items = [...main.querySelectorAll(selector),
      ...document.querySelectorAll('#quotation [data-reveal],.znergy-footer .row > [class*="col-"]')];
    const states = new Map();
    const running = new Map();
    let lastScroll = scrollY, direction = 1;
    window.addEventListener('scroll', () => {
      if (scrollY !== lastScroll) direction = scrollY > lastScroll ? 1 : -1;
      lastScroll = scrollY;
    }, {passive:true});
    items.forEach(item => {
      item.classList.add('scroll-bounce-item');
      const siblings = [...item.parentElement.children].filter(child => child.matches(selector));
      const delay = Math.min(siblings.indexOf(item), 3) * 75;
      states.set(item, {inside:false, lastStart:-Infinity, delay});
    });
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const item = entry.target, state = states.get(item);
        const entered = entry.isIntersecting && !state.inside;
        state.inside = entry.isIntersecting;
        if (!entered || reduced.matches || document.hidden || performance.now() - state.lastStart < 1100) return;
        // Do not disturb a focused control while someone is using it.
        if (item.contains(document.activeElement)) return;
        running.get(item)?.cancel();
        state.lastStart = performance.now();
        const visual = item.matches('.at-card,.at-industry,.at-catalog,.at-story-image,.earth-stage');
        const distance = (visual ? 48 : 34) * direction;
        const animation = item.animate([
          {translate:`0 ${distance}px`, scale:visual ? '.96' : '1', opacity:visual ? .55 : .25, offset:0},
          {translate:`0 ${-10 * direction}px`, scale:visual ? '1.018' : '1', opacity:1, offset:.52},
          {translate:`0 ${5 * direction}px`, scale:visual ? '.995' : '1', opacity:1, offset:.73},
          {translate:`0 ${-2 * direction}px`, scale:'1', opacity:1, offset:.88},
          {translate:'0 0', scale:'1', opacity:1, offset:1}
        ], {duration:visual ? 950 : 820, delay:state.delay, easing:'cubic-bezier(.22,.7,.35,1)', fill:'none'});
        animation.id = 'home-scroll-bounce';
        running.set(item, animation);
        const clear = () => { if (running.get(item) === animation) running.delete(item); };
        animation.addEventListener('finish', clear, {once:true});
        animation.addEventListener('cancel', clear, {once:true});
      });
    }, {threshold:.06, rootMargin:'0px 0px -20px 0px'});
    items.forEach(item => observer.observe(item));
    reduced.addEventListener('change', () => {
      if (reduced.matches) { running.forEach(animation => animation.cancel()); running.clear(); }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { running.forEach(animation => animation.cancel()); running.clear(); }
    });
  }
  cards.forEach(card => {
    let frame=0;
    card.addEventListener('pointermove',event=>{
      if(reduced.matches||!finePointer.matches)return;
      cancelAnimationFrame(frame);
      frame=requestAnimationFrame(()=>{
        const rect=card.getBoundingClientRect();
        const x=(event.clientX-rect.left)/rect.width,y=(event.clientY-rect.top)/rect.height;
        card.style.setProperty('--light-x',`${x*100}%`);card.style.setProperty('--light-y',`${y*100}%`);
        card.style.setProperty('--tilt-x',`${(0.5-y)*7}deg`);card.style.setProperty('--tilt-y',`${(x-0.5)*7}deg`);
      });
    });
    card.addEventListener('pointerleave',()=>{
      cancelAnimationFrame(frame);card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg');
    });
  });
  let scheduled=false;
  const story=document.querySelector('.at-story-image');
  if(story){
    const light=document.createElement('span');
    light.className='story-spotlight';light.setAttribute('aria-hidden','true');
    const cursor=document.createElement('span');
    cursor.className='story-pointer';cursor.setAttribute('aria-hidden','true');
    story.append(light,cursor);
    let storyFrame=0;
    const resetStory=()=>{
      cancelAnimationFrame(storyFrame);
      story.classList.remove('story-hover');
      ['--story-x','--story-y'].forEach(name=>story.style.setProperty(name,'0px'));
      ['--story-rx','--story-ry'].forEach(name=>story.style.setProperty(name,'0deg'));
    };
    story.addEventListener('pointermove',event=>{
      if(reduced.matches||!finePointer.matches)return;
      cancelAnimationFrame(storyFrame);
      storyFrame=requestAnimationFrame(()=>{
        const rect=story.getBoundingClientRect();
        const x=event.clientX-rect.left,y=event.clientY-rect.top;
        story.classList.add('story-hover');
        story.style.setProperty('--pointer-x',`${x}px`);story.style.setProperty('--pointer-y',`${y}px`);
        story.style.setProperty('--story-x',`${(x/rect.width-.5)*24}px`);
        story.style.setProperty('--story-y',`${(y/rect.height-.5)*18}px`);
        story.style.setProperty('--story-rx',`${(.5-y/rect.height)*12}deg`);
        story.style.setProperty('--story-ry',`${(x/rect.width-.5)*14}deg`);
      });
    });
    story.addEventListener('pointerleave',resetStory);
    story.addEventListener('pointerdown',event=>{
      if(reduced.matches||!finePointer.matches||event.button!==0)return;
      const rect=story.getBoundingClientRect();
      const ripple=document.createElement('span');
      ripple.className='story-ripple';ripple.setAttribute('aria-hidden','true');
      ripple.style.left=`${event.clientX-rect.left}px`;ripple.style.top=`${event.clientY-rect.top}px`;
      story.appendChild(ripple);
      const existing=story.querySelectorAll('.story-ripple');
      if(existing.length>3)existing[0].remove();
      ripple.addEventListener('animationend',()=>ripple.remove(),{once:true});
      setTimeout(()=>ripple.remove(),1200);
    });
    reduced.addEventListener('change',()=>{if(reduced.matches)resetStory();});
    finePointer.addEventListener('change',()=>{if(!finePointer.matches)resetStory();});
  }
  const update=()=>{
    scheduled=false;
    const available=document.documentElement.scrollHeight-innerHeight;
    progress.style.transform=`scaleX(${available>0?Math.min(1,Math.max(0,scrollY/available)):0})`;
    if(story&&!reduced.matches){
      const rect=story.getBoundingClientRect();
      if(rect.bottom>0&&rect.top<innerHeight)story.style.setProperty('--story-shift',`${Math.max(-16,Math.min(16,(innerHeight/2-rect.top-rect.height/2)*.045))}px`);
    }
  };
  window.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update);}},{passive:true});
  window.addEventListener('resize',update);update();
});
