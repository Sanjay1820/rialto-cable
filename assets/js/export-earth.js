/* Local texture, orthographic sphere and pointer controls; works with file:// too. */
document.addEventListener('DOMContentLoaded', () => {
  const host = document.querySelector('.export-earth');
  if (!host) return;
  const canvas = host.querySelector('.earth-canvas');
  const ctx = canvas.getContext('2d');
  const toggle = host.querySelector('.earth-toggle');
  if (!ctx) return;
  const size = 420, radius = 181, center = size / 2;
  canvas.width = canvas.height = size;
  const frame = ctx.createImageData(size, size);
  const pixels = [];
  // Calculate surface normals and fixed sunlight once, rather than every frame.
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const nx = (x - center) / radius, ny = (center - y) / radius;
    const distance = nx * nx + ny * ny;
    if (distance >= 1) continue;
    const nz = Math.sqrt(1 - distance);
    const light = .32 + .68 * Math.max(0, -.4 * nx + .35 * ny + .82 * nz);
    pixels.push({i:(y * size + x) * 4, x:nx, y:ny, z:nz, light,
      rim:Math.pow(1 - nz, 4) * .48, alpha:Math.min(1, (1 - Math.sqrt(distance)) * radius) * 255});
  }
  let texture, width, height, longitude = 1.1, latitude = -.12;
  let pointer = null, lastX = 0, lastY = 0, velocity = 0;
  let visible = false, previous = 0, raf = 0, lastPaint = 0;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches;
  const tau = Math.PI * 2;
  function draw() {
    if (!texture) return;
    const cos = Math.cos(latitude), sin = Math.sin(latitude);
    const data = frame.data;
    for (const p of pixels) {
      const py = p.y * cos - p.z * sin, pz = p.y * sin + p.z * cos;
      const lon = Math.atan2(p.x, pz) + longitude;
      const u = ((lon / tau + .5) % 1 + 1) % 1;
      const v = .5 - Math.asin(Math.max(-1, Math.min(1, py))) / Math.PI;
      const index = (Math.min(height - 1, Math.floor(v * height)) * width + Math.floor(u * width)) * 4;
      data[p.i] = texture[index] * p.light * (1 - p.rim) + 65 * p.rim;
      data[p.i + 1] = texture[index + 1] * p.light * (1 - p.rim) + 169 * p.rim;
      data[p.i + 2] = texture[index + 2] * p.light * (1 - p.rim) + 224 * p.rim;
      data[p.i + 3] = p.alpha;
    }
    ctx.putImageData(frame, 0, 0);
    canvas.dataset.rotation = longitude.toFixed(4);
    canvas.dataset.latitude = latitude.toFixed(4);
  }
  function canAnimate() { return texture && visible && !document.hidden && !paused && pointer === null; }
  function animate(now) {
    raf = 0;
    if (!canAnimate()) { previous = 0; return; }
    if (now - lastPaint >= 40) {
      const delta = previous ? Math.min((now - previous) / 1000, .08) : 0;
      longitude = (longitude + delta * (.13 + velocity)) % tau;
      velocity *= Math.exp(-delta * 3.5);
      previous = lastPaint = now;
      draw();
    }
    raf = requestAnimationFrame(animate);
  }
  function resume() {
    if (canAnimate() && !raf) { previous = 0; raf = requestAnimationFrame(animate); }
    if (!canAnimate() && raf) { cancelAnimationFrame(raf); raf = 0; previous = 0; }
  }
  function updateToggle() {
    toggle.textContent = paused ? '▶' : 'Ⅱ';
    toggle.setAttribute('aria-label', paused ? 'Start Earth rotation' : 'Pause Earth rotation');
    toggle.setAttribute('aria-pressed', String(paused));
  }
  toggle.addEventListener('click', () => { paused = !paused; updateToggle(); resume(); });
  canvas.addEventListener('pointerdown', event => {
    if (pointer !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
    pointer = event.pointerId; lastX = event.clientX; lastY = event.clientY; velocity = 0;
    canvas.setPointerCapture(pointer); canvas.classList.add('is-dragging'); resume();
  });
  canvas.addEventListener('pointermove', event => {
    if (event.pointerId !== pointer) return;
    const scale = Math.PI / canvas.getBoundingClientRect().width;
    const dx = event.clientX - lastX, dy = event.clientY - lastY;
    longitude -= dx * scale;
    latitude = Math.max(-1.1, Math.min(1.1, latitude + dy * scale));
    velocity = Math.max(-2, Math.min(2, -dx * scale * 12));
    lastX = event.clientX; lastY = event.clientY; draw();
  });
  function release(event) {
    if (event.pointerId !== pointer) return;
    pointer = null; canvas.classList.remove('is-dragging'); resume();
  }
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('lostpointercapture', release);
  canvas.addEventListener('keydown', event => {
    const keys = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') longitude -= .15;
    if (event.key === 'ArrowRight') longitude += .15;
    if (event.key === 'ArrowUp') latitude = Math.max(-1.1, latitude - .12);
    if (event.key === 'ArrowDown') latitude = Math.min(1.1, latitude + .12);
    draw();
  });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; resume(); }, {threshold:.05}).observe(host);
  document.addEventListener('visibilitychange', resume);
  reduced.addEventListener('change', event => { paused = event.matches; velocity = 0; updateToggle(); resume(); });
  const image = new Image();
  image.onload = () => {
    const map = document.createElement('canvas');
    width = map.width = image.naturalWidth; height = map.height = image.naturalHeight;
    const mapContext = map.getContext('2d', {willReadFrequently:true});
    mapContext.drawImage(image, 0, 0);
    texture = mapContext.getImageData(0, 0, width, height).data;
    // Display the satellite map with a brighter daylight exposure.
    const exposure = Array.from({length:256}, (_, value) => 255 * Math.pow(value / 255, .65));
    for (let i = 0; i < texture.length; i += 4) {
      texture[i] = exposure[texture[i]];
      texture[i + 1] = exposure[texture[i + 1]];
      texture[i + 2] = exposure[texture[i + 2]];
    }
    canvas.dataset.ready = 'true'; draw(); resume();
    delete window.RIALTO_EARTH_TEXTURE;
  };
  image.onerror = () => { host.querySelector('.earth-hint').textContent = 'Earth preview unavailable'; toggle.hidden = true; };
  image.src = window.RIALTO_EARTH_TEXTURE;
  updateToggle();
});
