const marker = document.querySelector("#sky-marker");
const world = document.querySelector("#sky-world");
const meteor = document.querySelector("#meteor");
const starField = document.querySelector("#twinkling-stars");
const stars = [[-.98,.55],[-.77,.38],[-.59,.58],[-.41,.22],[-.17,.47],[.08,.61],[.26,.3],[.48,.53],[.69,.35],[.97,.57],[-.84,.09],[-.64,-.12],[-.38,.06],[-.04,-.06],[.2,.1],[.42,-.08],[.65,.04],[.88,-.11],[-.96,-.31],[-.52,-.4],[-.21,-.25],[.09,-.39],[.35,-.29],[.58,-.46],[.94,-.33]];
stars.forEach(([x,y], i) => { const s = document.createElement("a-sphere"); const d = 1900 + (i % 7) * 520; s.setAttribute("position", `${x} ${y} .055`); s.setAttribute("radius", .006 + (i % 4) * .002); s.setAttribute("segments-height", "6"); s.setAttribute("segments-width", "6"); s.setAttribute("material", "color: #ffe59a; shader: flat; transparent: true; opacity: .3"); s.setAttribute("animation__glimmer", `property: material.opacity; from: .22; to: 1; dir: alternate; loop: true; dur: ${d}; easing: easeInOutSine; delay: ${i * 97}`); s.setAttribute("animation__breath", `property: scale; from: .75 .75 .75; to: 1.45 1.45 1.45; dir: alternate; loop: true; dur: ${d}; easing: easeInOutSine; delay: ${i * 97}`); starField.append(s); });
let found = false;
marker.addEventListener("markerFound", () => { found = true; world.setAttribute("visible", "true"); });
marker.addEventListener("markerLost", () => { found = false; world.setAttribute("visible", "false"); });
function animate(t) { const p = (t % 17500) / 17500; const m = Math.min(1, p / .82); const o = p < .08 ? p / .08 : p > .86 ? (1-p) / .14 : 1; meteor.setAttribute("position", `${1.08 - m * 1.43} ${.48 - m * .66} .08`); meteor.setAttribute("material", "opacity", Math.max(0,o)); if (meteor.object3D) meteor.object3D.visible = found; requestAnimationFrame(animate); }
requestAnimationFrame(animate);
