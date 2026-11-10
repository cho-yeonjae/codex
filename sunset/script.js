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
  const waterStrokes = Array.from({ length: 38 }, (_, index) => ({
    y: .42 + ((index * 13.7) % 53) / 100,
    width: .10 + (index % 8) * .029,
    speed: .000055 + (index % 7) * .000017,
    offset: index * .137,
    phase: index * .83,
    tone: index % 5
  }));

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
        ? `rgba(255, 236, 205, ${(.18 + (index % 2) * .06) * alpha})`
        : `rgba(240, 255, 249, ${(.20 + (index % 2) * .07) * alpha})`;
      context.lineWidth = 2.25 + (index % 3) * .85;
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
      context.lineWidth = 3.25 + (index % 3) * 1.05;
      context.strokeStyle = `rgba(244, 255, 251, ${(.20 + (index % 2) * .09) * alpha})`;
      context.stroke();
    });
    context.setLineDash([]);
  }

  // Short painted strokes carry the image's own horizontal sea texture across the frame.
  function drawWaterStrokes(time, alpha = 1) {
    const colours = [
      [244, 255, 250], [188, 243, 249], [255, 230, 193], [135, 218, 236], [255, 246, 225]
    ];
    context.save();
    context.globalCompositeOperation = 'screen';
    waterStrokes.forEach((stroke) => {
      const length = width * stroke.width;
      const x = ((time * stroke.speed + stroke.offset) % 1) * (width + length * 1.4) - length * 1.2;
      const y = height * stroke.y + Math.sin(time * .00155 + stroke.phase) * (5 + stroke.tone * 1.2);
      const colour = colours[stroke.tone];
      const gradient = context.createLinearGradient(x, y, x + length, y);
      gradient.addColorStop(0, `rgba(${colour[0]}, ${colour[1]}, ${colour[2]}, 0)`);
      gradient.addColorStop(.18, `rgba(${colour[0]}, ${colour[1]}, ${colour[2]}, ${.38 * alpha})`);
      gradient.addColorStop(.72, `rgba(${colour[0]}, ${colour[1]}, ${colour[2]}, ${.48 * alpha})`);
      gradient.addColorStop(1, `rgba(${colour[0]}, ${colour[1]}, ${colour[2]}, 0)`);
      context.beginPath();
      context.moveTo(x, y);
      context.quadraticCurveTo(x + length * .42, y - 10 - stroke.tone * 2, x + length, y + 3 + stroke.tone);
      context.strokeStyle = gradient;
      context.lineWidth = 2.7 + (stroke.tone % 3) * 1.05;
      context.lineCap = 'round';
      context.stroke();
    });
    context.restore();
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
    drawSparkles(now); drawWaves(now); drawSurges(now); drawWaterStrokes(now);
    if (lensOn) {
      const x = center.x * width, y = center.y * height, radius = lensRadius();
      context.save();
      context.beginPath(); context.arc(x, y, radius - 3, 0, Math.PI * 2); context.clip();
      // Only this clipped area uses a deliberately slower clock.
      drawSparkles(now * .19, .9); drawWaves(now * .19, .9); drawSurges(now * .19, .9); drawWaterStrokes(now * .19, .9);
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
