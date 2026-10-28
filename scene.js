// Фарфоровые крылья, нимб и крест парят над белой страницей и перемещаются по разделам при прокрутке
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.getElementById("gl");
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
} catch (e) {
  document.documentElement.classList.add("no-gl");
  document.dispatchEvent(new Event("gl-ready"));
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0xffffff, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, 11);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

// фарфор: белый, мягкий блик, лёгкий лак
const porcelain = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.32, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.25, sheen: 0.4, sheenRoughness: 0.6, envMapIntensity: 0.75 });
const porcelainDS = porcelain.clone(); porcelainDS.side = THREE.DoubleSide;

scene.add(new THREE.HemisphereLight(0xffffff, 0xcfcfd4, 1.3));
const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-3, 6, 7); scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff, 0.6); fill.position.set(5, -2, 3); scene.add(fill);

// --- крылья: перья-лопасти из нескольких слоёв ---
function wingShape() {
  const P = (x, y) => [(x - 4) / 40, -(y - 50) / 40];
  const sh = new THREE.Shape();
  sh.moveTo(...P(4, 50));
  const C = (a, b, c, d, e, f) => sh.bezierCurveTo(...P(a, b), ...P(c, d), ...P(e, f));
  C(30, 18, 62, 6, 96, 4); C(90, 20, 82, 28, 72, 32); C(82, 34, 86, 38, 86, 42); C(76, 48, 66, 48, 58, 48);
  C(66, 52, 68, 56, 66, 60); C(54, 64, 40, 62, 30, 58); C(34, 64, 32, 68, 28, 72); C(18, 72, 10, 64, 4, 56);
  sh.closePath();
  return sh;
}
const wingGeo = new THREE.ExtrudeGeometry(wingShape(), { depth: 0.07, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.045, bevelSegments: 8, curveSegments: 32 });
function makeWing(side) {
  const g = new THREE.Group();
  // три слоя перьев, каждый чуть меньше и сдвинут — даёт объём
  [[1, 0, 0], [0.82, -0.06, -0.09], [0.62, -0.12, -0.18]].forEach(([s, y, z], i) => {
    const m = new THREE.Mesh(wingGeo, porcelainDS);
    m.scale.set(s * side, s, 1); m.position.set(0.1 * side, y, z); m.rotation.z = -i * 0.07 * side;
    g.add(m);
  });
  return g;
}
const wings = new THREE.Group();
const wR = makeWing(1), wL = makeWing(-1);
wR.rotation.y = -0.4; wL.rotation.y = 0.4;
wings.add(wR, wL);

// --- нимб ---
const halo = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.07, 48, 240), porcelain);

// --- крест ---
const cs = new THREE.Shape();
const w = 0.22, h = 1.25, aw = 0.82, ay = 0.45, ah = 0.22;
cs.moveTo(-w, -h); cs.lineTo(w, -h); cs.lineTo(w, ay - ah); cs.lineTo(aw, ay - ah); cs.lineTo(aw, ay + ah); cs.lineTo(w, ay + ah);
cs.lineTo(w, h); cs.lineTo(-w, h); cs.lineTo(-w, ay + ah); cs.lineTo(-aw, ay + ah); cs.lineTo(-aw, ay - ah); cs.lineTo(-w, ay - ah); cs.closePath();
const crossGeo = new THREE.ExtrudeGeometry(cs, { depth: 0.26, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.08, bevelSegments: 10 });
crossGeo.center();
const cross = new THREE.Mesh(crossGeo, porcelain);

// мягкая «контактная» тень под объектом
function softShadow() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d"), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(0,0,0,.22)"); g.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

// пыль в воздухе — серые точки, на белом видны как свет в соборе
const dustGeo = new THREE.BufferGeometry(), N = innerWidth < 700 ? 300 : 700, dp = new Float32Array(N * 3);
for (let i = 0; i < N; i++) { dp[i * 3] = (Math.random() - .5) * 22; dp[i * 3 + 1] = (Math.random() - .5) * 14; dp[i * 3 + 2] = (Math.random() - .5) * 8 - 2; }
dustGeo.setAttribute("position", new THREE.BufferAttribute(dp, 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x9a9aa2, size: 0.035, transparent: true, opacity: 0.45, depthWrite: false }));
scene.add(dust);

const rigs = { wings: new THREE.Group(), halo: new THREE.Group(), cross: new THREE.Group() };
rigs.wings.add(wings); rigs.halo.add(halo); rigs.cross.add(cross);
const shadows = {};
for (const k in rigs) { const s = softShadow(); s.scale.setScalar(k === "wings" ? 4 : 2.2); s.position.y = k === "wings" ? -1.6 : -1.5; rigs[k].add(s); shadows[k] = s; scene.add(rigs[k]); }

// --- кадры по разделам: p — позиция, r — поворот, s — масштаб ---
const S = (p, r, s) => ({ p, r, s });
const H = S([0, -7, -3], [0, 0, 0], 0);
const STATES = [
  { wings: S([0, 0.75, 0], [0.1, 0, 0], 1.55), halo: S([0, 2.15, 0.2], [1.3, 0, 0], 0.62), cross: S([0, 0.4, 0.5], [0, 0, 0], 0.55) },           // первый экран
  { wings: S([4.9, -1.5, -1.5], [0.1, -0.5, 0], 0.8), halo: S([4.9, -0.45, -1.5], [1.2, 0, 0], 0.4), cross: H },                           // манифест
  { wings: H, halo: S([4.6, 2.4, -2], [0.9, 0.4, 0], 0.6), cross: S([-4.6, -2.2, -2], [0.3, 0.6, 0.4], 0.5) },                                // видео
  { wings: H, halo: S([4.2, 2.3, -1.5], [1.0, 0.3, 0.2], 0.65), cross: H },                                                                    // симптомы
  { wings: S([-3.5, -1.6, -1], [0.1, 0.5, 0], 0.9), halo: S([-3.5, -0.5, -1], [1.3, 0, 0], 0.45), cross: H },                              // команда канала
  { wings: H, halo: H, cross: H },                                                                                                            // фото
  { wings: H, halo: S([4.4, 2.7, -2], [1.25, 0, 0], 0.45), cross: H },                                                                         // кейсы
  { wings: S([-3.4, -1.8, -1], [0.1, 0.5, 0], 0.85), halo: S([-3.4, -0.7, -1], [1.3, 0, 0], 0.42), cross: H },                            // процесс
  { wings: H, halo: S([0, 2.6, -2.5], [1.3, 0, 0], 0.7), cross: H },                                                                        // люди
  { wings: S([0, 2.5, -3], [0.1, 0, 0], 1.1), halo: H, cross: H },                                                                          // форматы
  { wings: H, halo: S([-3.8, -0.9, -1.5], [1.1, 0.3, 0], 0.55), cross: S([-3.8, -2.1, -1.5], [0.2, 0.5, 0.2], 0.5) },                      // вопросы
  { wings: H, halo: S([-3.6, -1.6, -1.5], [1.2, 0.3, 0], 0.55), cross: S([-3.6, -2.6, -1.5], [0.2, 0.5, 0.2], 0.45) },                    // заявка
  { wings: S([0, 0.9, 0], [0.1, 0, 0], 1.7), halo: S([0, 2.35, 0.2], [1.3, 0, 0], 0.66), cross: S([0, 0.55, 0.5], [0, 0, 0], 0.6) },       // футер
];

const sections = [...document.querySelectorAll("[data-scene]")].sort((a, b) => a.dataset.scene - b.dataset.scene);
let tops = [];
const measure = () => { tops = sections.map(el => el.getBoundingClientRect().top + scrollY); };
measure(); addEventListener("load", measure); new ResizeObserver(measure).observe(document.body);
const lerp = (a, b, t) => a + (b - a) * t, smooth = t => t * t * (3 - 2 * t);
function target() {
  const y = scrollY + innerHeight * 0.5;
  let i = 0;
  while (i < tops.length - 1 && y >= tops[i + 1]) i++;
  const a = STATES[i], b = STATES[Math.min(i + 1, STATES.length - 1)];
  // объект стоит на месте большую часть раздела и перелетает только на стыке с соседним
  const span = (tops[i + 1] ?? tops[i] + 1) - tops[i], edge = Math.min(span * 0.4, innerHeight * 0.6);
  const t = smooth(Math.min(1, Math.max(0, (y - (tops[i] + span - edge)) / edge)));
  const o = {};
  for (const k in rigs) o[k] = { p: a[k].p.map((v, j) => lerp(v, b[k].p[j], t)), r: a[k].r.map((v, j) => lerp(v, b[k].r[j], t)), s: lerp(a[k].s, b[k].s, t) };
  return o;
}

let mx = 0, my = 0;
addEventListener("pointermove", e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });
addEventListener("resize", () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });

let ready = false;
const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime, narrow = camera.aspect < 1;
  const T = target(), k = calm ? 1 : 1 - Math.pow(0.002, dt);
  for (const name in rigs) {
    const g = rigs[name], s = T[name];
    g.position.x = lerp(g.position.x, narrow ? s.p[0] * 0.3 : s.p[0], k);
    g.position.y = lerp(g.position.y, s.p[1] + (narrow && name !== "halo" ? 0.6 : 0) + (calm ? 0 : Math.sin(t * 0.9 + name.length) * 0.08), k);
    g.position.z = lerp(g.position.z, narrow ? s.p[2] - 1.5 : s.p[2], k);
    g.rotation.x = lerp(g.rotation.x, s.r[0], k); g.rotation.y = lerp(g.rotation.y, s.r[1], k); g.rotation.z = lerp(g.rotation.z, s.r[2], k);
    const sc = Math.max(0.0001, lerp(g.scale.x, s.s, k));
    g.scale.setScalar(sc); g.visible = sc > 0.01;
  }
  if (!calm) {
    wR.rotation.z = Math.sin(t * 1.2) * 0.07; wL.rotation.z = -Math.sin(t * 1.2) * 0.07;
    wings.rotation.y = Math.sin(t * 0.4) * 0.25;
    halo.rotation.z = t * 0.35;
    cross.rotation.y = Math.sin(t * 0.5) * 0.6;
    dust.rotation.y = t * 0.012; dust.position.y = Math.sin(t * 0.2) * 0.2;
  }
  scene.rotation.y = lerp(scene.rotation.y, mx * 0.25, 0.05);
  scene.rotation.x = lerp(scene.rotation.x, my * 0.12, 0.05);
  renderer.render(scene, camera);
  if (!ready) { ready = true; document.documentElement.classList.add("gl-on"); document.dispatchEvent(new Event("gl-ready")); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
