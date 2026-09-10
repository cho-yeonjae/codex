document.documentElement.style.overflow = "hidden";

const stage = document.querySelector(".afterimage");
const canvas = document.querySelector(".motion-canvas");
const cursorLight = document.querySelector(".cursor-light");
const ring = document.querySelector(".ring");
const context = canvas.getContext("2d");
const TRAIL_FADE_MS = 4600;
const RING_ECHO_FADE_MS = 4200;
const PARTICLE_RETURN_MS = 5600;

let width = 0;
let height = 0;
let pixelRatio = 1;
let particles = [];
let trails = [];
let ringEchoes = [];
let pointer = { x: innerWidth / 2, y: innerHeight / 2 };
let light = { ...pointer };
let previous = { ...pointer };
let lastLight = { ...pointer };
let lastTime = performance.now();
let lastEcho = 0;
let touchFadeTimer;

function makeParticles() {
  const count = Math.max(24, Math.min(54, Math.round((width * height) / 30000)));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    homeX: 0,
    homeY: 0,
    driftX: (Math.random() - 0.5) * 0.004,
    driftY: (Math.random() - 0.5) * 0.004,
    pushX: 0,
    pushY: 0,
    size: 0.55 + Math.random() * 0.9,
    color: Math.random() > 0.5 ? "101, 244, 225" : "255, 93, 54",
  })).map((particle) => ({ ...particle, homeX: particle.x, homeY: particle.y }));
}

function resize() {
  const bounds = stage.getBoundingClientRect();
  width = bounds.width;
  height = bounds.height;
  pixelRatio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  makeParticles();
}

function addTrail(x, y, time) {
  const distance = Math.hypot(x - previous.x, y - previous.y);
  const steps = Math.max(1, Math.ceil(distance / 7));
  for (let step = 1; step <= steps; step += 1) {
    const amount = step / steps;
    trails.push({
      x: previous.x + (x - previous.x) * amount,
      y: previous.y + (y - previous.y) * amount,
      time,
    });
  }
  previous = { x, y };
}

function moveLight(event) {
  pointer = { x: event.clientX, y: event.clientY };
  addTrail(pointer.x, pointer.y, performance.now());
  cursorLight.style.opacity = "1";
  clearTimeout(touchFadeTimer);
}

stage.addEventListener("pointermove", moveLight);
stage.addEventListener("pointerdown", moveLight);
stage.addEventListener("pointerup", (event) => {
  if (event.pointerType !== "touch") return;
  touchFadeTimer = setTimeout(() => {
    cursorLight.style.opacity = "0";
  }, 700);
});
stage.addEventListener("pointercancel", (event) => {
  if (event.pointerType === "touch") cursorLight.style.opacity = "0";
});

function drawParticles(delta, now) {
  for (const particle of particles) {
    const dx = particle.x - light.x;
    const dy = particle.y - light.y;
    const distance = Math.hypot(dx, dy) || 1;
    const influence = Math.max(0, 1 - distance / 150);
    particle.pushX += (dx / distance) * influence * 0.035;
    particle.pushY += (dy / distance) * influence * 0.035;
    particle.pushX *= Math.exp(-delta / PARTICLE_RETURN_MS);
    particle.pushY *= Math.exp(-delta / PARTICLE_RETURN_MS);
    particle.homeX += particle.driftX * delta;
    particle.homeY += particle.driftY * delta;
    if (particle.homeX < -12 || particle.homeX > width + 12) particle.driftX *= -1;
    if (particle.homeY < -12 || particle.homeY > height + 12) particle.driftY *= -1;
    const returnAmount = 1 - Math.exp(-delta / PARTICLE_RETURN_MS);
    particle.x += (particle.homeX - particle.x) * returnAmount + particle.pushX * delta;
    particle.y += (particle.homeY - particle.y) * returnAmount + particle.pushY * delta;
    const glow = 0.17 + influence * 0.56;
    context.beginPath();
    context.fillStyle = `rgba(${particle.color}, ${glow})`;
    context.arc(particle.x, particle.y, particle.size + influence * 0.75, 0, Math.PI * 2);
    context.fill();
  }
}

function drawTrail(now) {
  trails = trails.filter((point) => now - point.time < TRAIL_FADE_MS);
  if (trails.length < 2) return;
  context.lineCap = "round";
  for (let index = 1; index < trails.length; index += 1) {
    const point = trails[index];
    const before = trails[index - 1];
    const life = 1 - (now - point.time) / TRAIL_FADE_MS;
    const alpha = Math.pow(life, 1.7) * 0.42;
    context.beginPath();
    context.strokeStyle = `rgba(${index % 3 ? "101, 244, 225" : "255, 93, 54"}, ${alpha})`;
    context.lineWidth = 1 + life * 4;
    context.shadowBlur = 0;
    context.moveTo(before.x, before.y);
    context.lineTo(point.x, point.y);
    context.stroke();
  }
  context.shadowBlur = 0;
}

function drawRingEchoes(now) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(Math.max(112, width * 0.15), 216) / 2;
  ringEchoes = ringEchoes.filter((echo) => now - echo.time < RING_ECHO_FADE_MS);
  for (const echo of ringEchoes) {
    const life = 1 - (now - echo.time) / RING_ECHO_FADE_MS;
    context.beginPath();
    context.strokeStyle = `rgba(255, 93, 54, ${Math.pow(life, 1.65) * 0.68})`;
    context.lineWidth = 1.2 + life * 2;
    context.shadowBlur = 13;
    context.shadowColor = "rgba(255, 93, 54, .7)";
    context.arc(centerX, centerY, radius, echo.angle - 0.22, echo.angle + 0.22);
    context.stroke();
  }
  context.shadowBlur = 0;
}

function animate(now) {
  const delta = Math.min(42, now - lastTime);
  lastTime = now;
  const following = 1 - Math.exp(-delta / 260);
  light.x += (pointer.x - light.x) * following;
  light.y += (pointer.y - light.y) * following;
  cursorLight.style.transform = `translate(${light.x}px, ${light.y}px) translate(-50%, -50%)`;

  const centerX = width / 2;
  const centerY = height / 2;
  const fromCenterX = light.x - centerX;
  const fromCenterY = light.y - centerY;
  const distance = Math.hypot(fromCenterX, fromCenterY);
  const proximity = Math.max(0, 1 - distance / Math.min(width, height) * 2.3);
  ring.style.setProperty("--near", proximity.toFixed(3));
  const breath = (Math.sin(now / 3900) + 1) / 2;
  ring.style.setProperty("--scale", (1 + proximity * 0.022 + breath * 0.005).toFixed(3));
  ring.style.setProperty("--border-alpha", `${62 - proximity * 16}%`);
  ring.style.setProperty("--glow", `${9 + proximity * 8}px`);
  ring.style.setProperty("--inner-glow", `${12 + proximity * 17}px`);
  ring.style.setProperty("--ring-opacity", (0.5 + proximity * 0.38 + breath * 0.035).toFixed(3));
  ring.style.setProperty("--core-opacity", (0.3 + proximity * 0.28 + breath * 0.025).toFixed(3));

  const lightMovement = Math.hypot(light.x - lastLight.x, light.y - lastLight.y);
  if (distance < Math.min(width, height) * 0.25 && lightMovement > 0.7 && now - lastEcho > 90) {
    ringEchoes.push({ angle: Math.atan2(fromCenterY, fromCenterX), time: now });
    lastEcho = now;
  }
  lastLight = { ...light };

  context.clearRect(0, 0, width, height);
  drawParticles(delta, now);
  drawTrail(now);
  drawRingEchoes(now);
  requestAnimationFrame(animate);
}

new ResizeObserver(resize).observe(stage);
resize();
requestAnimationFrame(animate);
