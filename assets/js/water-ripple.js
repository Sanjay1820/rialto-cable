/**
 * ============================================================================
 * RIALTO CABLES - HIGH-PERFORMANCE 60FPS FLUID WATER RIPPLE ENGINE
 * Silky-smooth, GPU-accelerated, zero-garbage-collection fluid simulation.
 * 
 * Performance Optimizations:
 * 1. Zero Allocation Loop: Pre-allocated Uint32Array persistent buffers.
 * 2. GPU Hardware Upscaling: Renders offscreen at native grid resolution and
 *    smooths with GPU bilinear interpolation (imageSmoothingEnabled = true).
 * 3. Continuous Wave Wake: Path interpolation for rapid mouse gestures.
 * 4. Sleep Mode: Automatically sleeps when water is calm (0% CPU idle).
 * 5. 100% Transparent: Preserves all authentic colors of the slider images.
 * ============================================================================
 */

(function () {
  'use strict';

  // Global transition trigger
  window.triggerSliderRipple = null;

  /* ==========================================================================
     1. HERO SLIDER WATER RIPPLE ENGINE (Silky Smooth 60FPS)
     ========================================================================== */
  function initHeroSliderWater() {
    const canvas = document.getElementById('sliderRippleCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Enable high-quality GPU bilinear smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const container = canvas.parentElement;
    let width = 0;
    let height = 0;

    // Grid downsampling factor (4 = ultra-smooth 60fps on any GPU/CPU)
    const scale = 4;
    let cols = 0;
    let rows = 0;
    let size = 0;

    // Persistent simulation buffers (Zero GC)
    let buffer1 = null;
    let buffer2 = null;

    // Offscreen canvas for hardware-accelerated bilinear upscaling
    let offscreenCanvas = null;
    let offscreenCtx = null;
    let offscreenImgData = null;
    let offscreenBuf32 = null;

    const damping = 0.978; // Natural fluid viscosity
    let animId = null;
    let isSleeping = false;
    let activeWaveEnergy = 0;

    function resize() {
      width = container.clientWidth || 1200;
      height = container.clientHeight || 550;
      if (width === 0 || height === 0) return;

      canvas.width = width;
      canvas.height = height;

      cols = Math.floor(width / scale);
      rows = Math.floor(height / scale);
      size = cols * rows;

      buffer1 = new Float32Array(size);
      buffer2 = new Float32Array(size);

      // Create or resize persistent offscreen canvas
      if (!offscreenCanvas) {
        offscreenCanvas = document.createElement('canvas');
      }
      offscreenCanvas.width = cols;
      offscreenCanvas.height = rows;
      offscreenCtx = offscreenCanvas.getContext('2d');
      offscreenImgData = offscreenCtx.createImageData(cols, rows);
      offscreenBuf32 = new Uint32Array(offscreenImgData.data.buffer);

      wakeUp();
    }

    function dropAt(x, y, radius, strength) {
      if (!buffer1 || cols === 0 || rows === 0) return;

      const gx = Math.floor(x / scale);
      const gy = Math.floor(y / scale);
      const r = Math.max(1, Math.floor(radius / scale));
      const r2 = r * r;

      const minX = Math.max(1, gx - r);
      const maxX = Math.min(cols - 2, gx + r);
      const minY = Math.max(1, gy - r);
      const maxY = Math.min(rows - 2, gy + r);

      for (let j = minY; j <= maxY; j++) {
        const dy2 = (j - gy) * (j - gy);
        const yOffset = j * cols;
        for (let i = minX; i <= maxX; i++) {
          const dx2 = (i - gx) * (i - gx);
          const dist2 = dx2 + dy2;
          if (dist2 <= r2) {
            const dist = Math.sqrt(dist2);
            // Smooth cosine falloff
            const falloff = 0.5 * (1 + Math.cos((dist / r) * Math.PI));
            buffer1[yOffset + i] += strength * falloff;
          }
        }
      }

      wakeUp();
    }

    // Expose global trigger for slide transitions
    window.triggerSliderRipple = function (x, y, radius, strength) {
      const dropX = x !== undefined ? x : width / 2;
      const dropY = y !== undefined ? y : height / 2;
      dropAt(dropX, dropY, radius || 36, strength || 75);
    };

    function wakeUp() {
      if (isSleeping) {
        isSleeping = false;
        if (!animId) {
          animId = requestAnimationFrame(loop);
        }
      }
    }

    function updatePhysics() {
      if (!buffer1 || !buffer2) return;

      let energy = 0;

      for (let y = 1; y < rows - 1; y++) {
        const yCols = y * cols;
        for (let x = 1; x < cols - 1; x++) {
          const idx = yCols + x;
          const val =
            (buffer1[idx - 1] +
              buffer1[idx + 1] +
              buffer1[idx - cols] +
              buffer1[idx + cols]) *
              0.5 -
            buffer2[idx];

          const damped = val * damping;
          buffer2[idx] = damped;
          energy += Math.abs(damped);
        }
      }

      // Swap buffers
      const temp = buffer1;
      buffer1 = buffer2;
      buffer2 = temp;

      activeWaveEnergy = energy;
    }

    function render() {
      if (!buffer1 || !offscreenBuf32) return;

      // Clear offscreen 32-bit buffer to 0 (100% transparent)
      offscreenBuf32.fill(0);

      // Light normal vector (top-left angled sunlight sheen)
      const lx = -0.6;
      const ly = -0.8;

      let hasWave = false;

      for (let y = 1; y < rows - 1; y++) {
        const yCols = y * cols;
        for (let x = 1; x < cols - 1; x++) {
          const idx = yCols + x;
          const val = buffer1[idx];

          if (val > 0.04 || val < -0.04) {
            hasWave = true;

            const dx = buffer1[idx + 1] - buffer1[idx - 1];
            const dy = buffer1[idx + cols] - buffer1[idx - cols];
            const light = -(lx * dx + ly * dy);

            let a = 0;
            let r = 255, g = 255, b = 255;

            if (light > 0) {
              // Wave crest: Crystalline sunlight glint
              const spec = Math.min(1, light * 0.08);
              a = Math.min(220, Math.floor(spec * 240 + light * 4));
            } else {
              // Wave trough: Subtle fluid depth
              const shadow = Math.min(1, -light * 0.05);
              a = Math.min(65, Math.floor(shadow * 70));
              r = 15;
              g = 45;
              b = 85;
            }

            if (a > 3) {
              // Pack as 32-bit Little-Endian ABGR integer
              offscreenBuf32[idx] = (a << 24) | (b << 16) | (g << 8) | r;
            }
          }
        }
      }

      if (hasWave) {
        offscreenCtx.putImageData(offscreenImgData, 0, 0);
        ctx.clearRect(0, 0, width, height);
        // GPU hardware-accelerated bilinear upscaling stretching 480x222 to full size smoothly!
        ctx.drawImage(offscreenCanvas, 0, 0, width, height);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    }

    let lastAmbient = 0;
    function loop(timestamp) {
      updatePhysics();
      render();

      // Ambient organic droplet every 3.5 seconds
      if (timestamp - lastAmbient > 3500) {
        lastAmbient = timestamp;
        const rx = Math.random() * (width - 120) + 60;
        const ry = Math.random() * (height - 100) + 50;
        dropAt(rx, ry, 22, 50);
      }

      // Enter sleep when water completely settles to preserve CPU & battery
      if (activeWaveEnergy < 0.2 && timestamp - lastAmbient < 3000) {
        isSleeping = true;
        animId = null;
        ctx.clearRect(0, 0, width, height);
        return;
      }

      animId = requestAnimationFrame(loop);
    }

    // Smooth continuous wake interpolation between mouse points
    let prevX = null;
    let prevY = null;
    let lastTime = 0;

    container.addEventListener('mousemove', function (e) {
      const rect = canvas.getBoundingClientRect();
      const currX = e.clientX - rect.left;
      const currY = e.clientY - rect.top;

      if (prevX !== null && prevY !== null) {
        const dist = Math.hypot(currX - prevX, currY - prevY);
        const steps = Math.min(8, Math.max(1, Math.floor(dist / 14)));

        // Interpolate points for unbroken, silky liquid wake
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const ix = prevX + (currX - prevX) * t;
          const iy = prevY + (currY - prevY) * t;
          dropAt(ix, iy, 14, 22);
        }
      } else {
        dropAt(currX, currY, 14, 22);
      }

      prevX = currX;
      prevY = currY;
    });

    container.addEventListener('mouseleave', function () {
      prevX = null;
      prevY = null;
    });

    container.addEventListener('click', function (e) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      dropAt(x, y, 32, 85);
    });

    // Touch gesture support with wake interpolation
    let touchPrevX = null;
    let touchPrevY = null;

    container.addEventListener('touchmove', function (e) {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      if (!touch) return;

      const currX = touch.clientX - rect.left;
      const currY = touch.clientY - rect.top;

      if (touchPrevX !== null && touchPrevY !== null) {
        const dist = Math.hypot(currX - touchPrevX, currY - touchPrevY);
        const steps = Math.min(6, Math.max(1, Math.floor(dist / 16)));
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          dropAt(touchPrevX + (currX - touchPrevX) * t, touchPrevY + (currY - touchPrevY) * t, 16, 26);
        }
      } else {
        dropAt(currX, currY, 16, 26);
      }

      touchPrevX = currX;
      touchPrevY = currY;
    }, { passive: true });

    container.addEventListener('touchend', function () {
      touchPrevX = null;
      touchPrevY = null;
    }, { passive: true });

    window.addEventListener('resize', resize);

    // Initial setup
    resize();
    // Welcome splash drop in center
    setTimeout(() => {
      dropAt(width / 2, height / 2, 28, 70);
    }, 500);
  }

  /* ==========================================================================
     2. SUBSEA CABLE SECTION WATER RIPPLE ENGINE (Optimized 60FPS)
     ========================================================================== */
  function initSubseaWater() {
    const canvas = document.getElementById('subseaRippleCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;

    const container = canvas.parentElement;
    let width = 0;
    let height = 0;
    const scale = 4;
    let cols = 0;
    let rows = 0;
    let size = 0;

    let buffer1 = null;
    let buffer2 = null;
    let offscreenCanvas = null;
    let offscreenCtx = null;
    let offscreenImgData = null;
    let offscreenBuf32 = null;

    const damping = 0.985;
    let animId = null;

    function resize() {
      width = container.clientWidth || 400;
      height = container.clientHeight || 380;
      if (width === 0 || height === 0) return;

      canvas.width = width;
      canvas.height = height;

      cols = Math.floor(width / scale);
      rows = Math.floor(height / scale);
      size = cols * rows;

      buffer1 = new Float32Array(size);
      buffer2 = new Float32Array(size);

      if (!offscreenCanvas) {
        offscreenCanvas = document.createElement('canvas');
      }
      offscreenCanvas.width = cols;
      offscreenCanvas.height = rows;
      offscreenCtx = offscreenCanvas.getContext('2d');
      offscreenImgData = offscreenCtx.createImageData(cols, rows);
      offscreenBuf32 = new Uint32Array(offscreenImgData.data.buffer);
    }

    function dropAt(x, y, radius, strength) {
      if (!buffer1 || cols === 0 || rows === 0) return;
      const gx = Math.floor(x / scale);
      const gy = Math.floor(y / scale);
      const r = Math.max(1, Math.floor(radius / scale));
      const r2 = r * r;

      const minX = Math.max(1, gx - r);
      const maxX = Math.min(cols - 2, gx + r);
      const minY = Math.max(1, gy - r);
      const maxY = Math.min(rows - 2, gy + r);

      for (let j = minY; j <= maxY; j++) {
        const dy2 = (j - gy) * (j - gy);
        const yOffset = j * cols;
        for (let i = minX; i <= maxX; i++) {
          const dx2 = (i - gx) * (i - gx);
          const dist2 = dx2 + dy2;
          if (dist2 <= r2) {
            const dist = Math.sqrt(dist2);
            const falloff = 0.5 * (1 + Math.cos((dist / r) * Math.PI));
            buffer1[yOffset + i] += strength * falloff;
          }
        }
      }
    }

    function updateRipples() {
      if (!buffer1 || !buffer2) return;
      for (let y = 1; y < rows - 1; y++) {
        const yCols = y * cols;
        for (let x = 1; x < cols - 1; x++) {
          const idx = yCols + x;
          const val =
            (buffer1[idx - 1] +
              buffer1[idx + 1] +
              buffer1[idx - cols] +
              buffer1[idx + cols]) *
              0.5 -
            buffer2[idx];
          buffer2[idx] = val * damping;
        }
      }
      const temp = buffer1;
      buffer1 = buffer2;
      buffer2 = temp;
    }

    function render() {
      if (!buffer1 || !offscreenBuf32) return;

      // Deep aquatic gradient base in offscreen
      for (let y = 0; y < rows; y++) {
        const yRatio = y / rows;
        // Interpolate deep aquatic tones: #0a2540 to #0369a1
        const rBase = Math.floor(10 + yRatio * 3);
        const gBase = Math.floor(37 + yRatio * 68);
        const bBase = Math.floor(64 + yRatio * 97);
        const yOffset = y * cols;

        for (let x = 0; x < cols; x++) {
          const idx = yOffset + x;
          const val = buffer1[idx];

          if (val > 0.05 || val < -0.05) {
            const dx = buffer1[idx + 1] - buffer1[idx - 1];
            const dy = buffer1[idx + cols] - buffer1[idx - cols];
            const light = (dx + dy) * 22;

            const r = Math.min(255, Math.max(0, Math.floor(rBase + light * 0.8 + 20)));
            const g = Math.min(255, Math.max(0, Math.floor(gBase + light * 1.4 + 40)));
            const b = Math.min(255, Math.max(0, Math.floor(bBase + light * 1.8 + 60)));

            offscreenBuf32[idx] = (255 << 24) | (b << 16) | (g << 8) | r;
          } else {
            offscreenBuf32[idx] = (255 << 24) | (bBase << 16) | (gBase << 8) | rBase;
          }
        }
      }

      offscreenCtx.putImageData(offscreenImgData, 0, 0);
      ctx.drawImage(offscreenCanvas, 0, 0, width, height);

      // Subtle radial ambient underwater glow
      ctx.save();
      const radial = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width / 1.4);
      radial.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
      radial.addColorStop(1, 'rgba(3, 105, 161, 0)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    let lastAmbient = 0;
    function loop(timestamp) {
      updateRipples();
      render();

      if (timestamp - lastAmbient > 2600) {
        lastAmbient = timestamp;
        const rx = Math.random() * (width - 40) + 20;
        const ry = Math.random() * (height - 40) + 20;
        dropAt(rx, ry, 18, 45);
      }

      animId = requestAnimationFrame(loop);
    }

    container.addEventListener('mousemove', function (e) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      dropAt(x, y, 14, 25);
    });

    container.addEventListener('touchmove', function (e) {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      if (touch) {
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        dropAt(x, y, 16, 30);
      }
    }, { passive: true });

    container.addEventListener('click', function (e) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      dropAt(x, y, 28, 70);
    });

    window.addEventListener('resize', resize);
    resize();
    dropAt(width / 2, height / 2, 24, 60);
    animId = requestAnimationFrame(loop);
  }

  // Initialize both engines
  function initAll() {
    initHeroSliderWater();
    initSubseaWater();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
