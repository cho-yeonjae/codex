(() => {
  const canvas = document.querySelector('#motion');
  const context = canvas.getContext('2d');
  const lens = document.querySelector('.lens');
  const artwork = document.querySelector('.artwork');
  const current = document.querySelector('#water-current');
  const displacement = document.querySelector('#water-displacement');
  const marker = document.querySelector('#marker');
  const scene = document.querySelector('a-scene');
  const particles = Array.from({ length: 70 }, (_, index) => ({
    x: ((index * 37.7) % 100) / 100,
    y: .04 + (((index * 21.1) % 47) / 100),
    size: 0.5 + (index % 4) * .48,
    pace: .00042 + (index % 6) * .000075,
    phase: index * .71
  }));
  // A warmer, denser cluster gathers around the sunset itself.
  const sunsetGlints = Array.from({ length: 34 }, (_, index) => ({
    x: .32 + ((index * 17.3) % 36) / 100,
    y: .14 + ((index * 11.7) % 32) / 100,
    size: .65 + (index % 5) * .42,
    pace: .00065 + (index % 7) * .00011,
    phase: index * 1.17
  }));
  const allSparkles = [...particles, ...sunsetGlints];

  let width = 0, height = 0, dpr = 1;
  let lensOn = false, mouseMode = false, lastSeen = 0;
  const center = { x: .5, y: .46 };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth; height = window.innerHeight;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const setLens = (active) => {
    lensOn = active;
    lens.classList.toggle('is-active', active);
  };
  const placeLens = (x, y) => {
    center.x = Math.max(.12, Math.min(.88, x));
    center.y = Math.max(.16, Math.min(.79, y));
    lens.style.left = `${center.x * 100}%`;
    lens.style.top = `${center.y * 100}%`;
  };
  const lensRadius = () => lens.getBoundingClientRect().width * .5;

  function drawSparkles(time, alpha = 1) {
    allSparkles.forEach((dot, index) => {
      const warmth = index >= particles.length ? 1.55 : 1;
      const pulse = .25 + .75 * Math.pow(Math.sin(time * dot.pace + dot.phase) * .5 + .5, 3);
      const x = dot.x * width, y = dot.y * height;
      const radius = dot.size * (1 + pulse);
      context.fillStyle = `rgba(255, 244, 196, ${(.10 + pulse * .34) * alpha * warmth})`;
      context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill();
      if (pulse > .8) {
        context.strokeStyle = `rgba(255, 238, 185, ${(pulse - .8) * .85 * alpha * warmth})`;
        context.lineWidth = .65;
        context.beginPath(); context.moveTo(x - radius * 3, y); context.lineTo(x + radius * 3, y);
        context.moveTo(x, y - radius * 3); context.lineTo(x, y + radius * 3); context.stroke();
      }
    });
  }

  function drawWaves(time, alpha = 1) {
    const bands = [ .39, .45, .51, .58, .65, .72, .80, .88 ];
    bands.forEach((level, index) => {
      const amplitude = 4.2 + (index % 3) * 2.25;
      const yBase = height * level;
      context.beginPath();
      for (let x = -20; x <= width + 25; x += 12) {
        const y = yBase + Math.sin(x * .012 + time * (.0011 + index * .000075) + index) * amplitude
          + Math.sin(x * .027 - time * .00068 + index * 2) * amplitude * .58;
        x === -20 ? context.moveTo(x, y) : context.lineTo(x, y);
      }
      context.strokeStyle = index < 3
        ? `rgba(255, 236, 205, ${(.12 + (index % 2) * .04) * alpha})`
        : `rgba(240, 255, 249, ${(.13 + (index % 2) * .05) * alpha})`;
      context.lineWidth = 1.1 + (index % 3) * .4;
      context.stroke();
    });
  }

  // Broad, broken foam bands move independently from the finer water lines.
  function drawSurges(time, alpha = 1) {
    const lanes = [.56, .65, .74, .83, .91];
    lanes.forEach((level, index) => {
      const amplitude = 9 + (index % 3) * 3.5;
      context.beginPath();
      for (let x = -28; x <= width + 30; x += 15) {
        const y = height * level
          + Math.sin(x * .009 - time * (.00165 + index * .00012) + index * 1.8) * amplitude
          + Math.sin(x * .022 + time * .00097 + index) * amplitude * .66;
        x === -28 ? context.moveTo(x, y) : context.lineTo(x, y);
      }
      context.lineCap = 'round';
      context.setLineDash([16 + index * 2, 15 - Math.min(index, 4)]);
      context.lineDashOffset = -time * (.018 + index * .003);
      context.lineWidth = 1.7 + (index % 3) * .8;
      context.strokeStyle = `rgba(244, 255, 251, ${(.13 + (index % 2) * .07) * alpha})`;
      context.stroke();
    });
    context.setLineDash([]);
  }

  function render(now) {
    // The whole illustration has a near-imperceptible current even without a lens.
    // Updating less often keeps the painted texture soft rather than mechanically wavy.
    if (!render.lastCurrentUpdate || now - render.lastCurrentUpdate > 110) {
      current.setAttribute('baseFrequency', `${(.0011 + Math.sin(now * .0002) * .00028).toFixed(5)} ${(0.012 + Math.cos(now * .00027) * .0022).toFixed(5)}`);
      displacement.setAttribute('scale', (4.5 + Math.sin(now * .00042) * 1.65).toFixed(2));
      render.lastCurrentUpdate = now;
    }
    context.clearRect(0, 0, width, height);
    drawSparkles(now); drawWaves(now); drawSurges(now);
    if (lensOn) {
      const x = center.x * width, y = center.y * height, radius = lensRadius();
      context.save();
      context.beginPath(); context.arc(x, y, radius - 3, 0, Math.PI * 2); context.clip();
      // Only this clipped area uses a deliberately slower clock.
      drawSparkles(now * .19, .9); drawWaves(now * .19, .9); drawSurges(now * .19, .9);
      context.restore();
    }
    requestAnimationFrame(render);
  }

  function found() { lastSeen = performance.now(); mouseMode = false; setLens(true); }
  marker.addEventListener('markerFound', found);
  scene.addEventListener('markerFound', found);
  function watchMarker() {
    if (!mouseMode) {
      const visible = Boolean(marker.object3D && marker.object3D.visible);
      if (visible) found();
      else if (lensOn && performance.now() - lastSeen > 2200) setLens(false);
    }
    requestAnimationFrame(watchMarker);
  }

  artwork.addEventListener('pointermove', (event) => {
    if (!mouseMode) return;
    placeLens(event.clientX / width, event.clientY / height);
  });
  window.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() !== 'a') return;
    mouseMode = !mouseMode;
    if (mouseMode) { placeLens(.5, .46); setLens(true); }
    else setLens(false);
  });
  window.addEventListener('resize', resize);
  resize(); placeLens(.5, .46); watchMarker(); requestAnimationFrame(render);
})();
