// 3D-сцена на весь сайт: хромированные крест, нимб и крылья путешествуют по разделам при прокрутке
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.getElementById("gl");

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
} catch (e) {
  document.documentElement.classList.add("no-gl");
  document.dispatchEvent(new Event("gl-ready"));
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x060607);
scene.fog = new THREE.FogExp2(0x060607, 0.05);
const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, 10);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const chrome = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 0.13, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.5 });
const chromeDS = chrome.clone(); chromeDS.side = THREE.DoubleSide;

// --- крест ---
const cs = new THREE.Shape();
const w = 0.28, h = 1.5, aw = 1.0, ay = 0.55, ah = 0.27;
cs.moveTo(-w, -h); cs.lineTo(w, -h); cs.lineTo(w, ay - ah); cs.lineTo(aw, ay - ah); cs.lineTo(aw, ay + ah); cs.lineTo(w, ay + ah);
cs.lineTo(w, h); cs.lineTo(-w, h); cs.lineTo(-w, ay + ah); cs.lineTo(-aw, ay + ah); cs.lineTo(-aw, ay - ah); cs.lineTo(-w, ay - ah); cs.closePath();
const crossGeo = new THREE.ExtrudeGeometry(cs, { depth: 0.34, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 10, curveSegments: 4 });
crossGeo.center();
const cross = new THREE.Mesh(crossGeo, chrome);

// --- нимб ---
const halo = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.075, 40, 240), chrome);

// --- крылья (контур как у иконки крыла) ---
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
const wingGeo = new THREE.ExtrudeGeometry(wingShape(), { depth: 0.06, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.035, bevelSegments: 6, curveSegments: 24 });
const wings = new THREE.Group();
const wr = new THREE.Mesh(wingGeo, chromeDS); wr.position.x = 0.12; wr.rotation.y = -0.35;
const wl = new THREE.Mesh(wingGeo, chromeDS); wl.scale.x = -1; wl.position.x = -0.12; wl.rotation.y = 0.35;
wings.add(wr, wl);

// --- облако частиц ---
function points(n, r0, r1, size, op) {
  const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1, t = Math.random() * Math.PI * 2, r = r0 + Math.random() * (r1 - r0), s = Math.sqrt(1 - u * u);
    p[i * 3] = r * s * Math.cos(t); p[i * 3 + 1] = r * u; p[i * 3 + 2] = r * s * Math.sin(t);
  }
  g.setAttribute("position", new THREE.BufferAttribute(p, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size, sizeAttenuation: true, transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending }));
}
const cloud = points(innerWidth < 700 ? 1800 : 4200, 2.6, 4.6, 0.028, 0.9);
const dust = points(innerWidth < 700 ? 500 : 1200, 6, 16, 0.05, 0.5);

const rigs = { cross: new THREE.Group(), halo: new THREE.Group(), wings: new THREE.Group(), cloud: new THREE.Group() };
rigs.cross.add(cross); rigs.halo.add(halo); rigs.wings.add(wings); rigs.cloud.add(cloud);
const world = new THREE.Group();
Object.values(rigs).forEach(g => world.add(g));
scene.add(world, dust);

const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-4, 5, 6); scene.add(key);
const rim = new THREE.DirectionalLight(0xffffff, 1.4); rim.position.set(5, -2, -4); scene.add(rim);

// --- постобработка: свечение бликов ---
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.55, 0.55, 0.8);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// --- хореография: состояние объектов для каждого раздела ---
// p — позиция, r — поворот, s — масштаб
const S = (p, r, s) => ({ p, r, s });
const HIDE = S([0, -6, -4], [0, 0, 0], 0);
const STATES = [
  { cross: S([1.7, 0.05, 0], [0, 0, 0], 1.15), halo: S([1.7, 1.95, 0], [1.25, 0, 0], 0.8), wings: S([1.7, 0.45, -0.7], [0, 0, 0], 1.35), cloud: S([1.7, 0, -1], [0, 0, 0], 1) },   // первый экран
  { cross: S([2.7, -0.2, 0], [0.2, 0.7, 0], 1.0), halo: S([2.7, -0.2, 0], [1.1, 0.3, 0], 1.6), wings: HIDE, cloud: S([2.7, 0, -1.5], [0, 0, 0], 0.8) },            // манифест
  { cross: S([-4.4, 2.2, -3], [0.4, 0, 0.6], 0.6), halo: S([4.6, -2.1, -2], [0.6, 0.5, 0], 0.8), wings: HIDE, cloud: S([0, 0, -4], [0, 0, 0], 1.6) },              // видео
  { cross: S([3.6, -1.1, -1], [0.3, 0.4, 0.9], 0.9), halo: S([3.2, 1.8, -2.5], [1.6, 0, 0.4], 0.7), wings: HIDE, cloud: S([3.4, 0, -2], [0, 0, 0], 0.7) },          // симптомы
  { cross: HIDE, halo: S([0, -0.2, -2], [1.48, 0, 0], 2.5), wings: HIDE, cloud: S([0, 0, -3], [0, 0, 0], 1.3) },                                                   // команда канала
  { cross: HIDE, halo: S([0, 2.5, -3], [1.3, 0, 0], 1.0), wings: S([0, 0.4, -3.2], [0.1, 0, 0], 2.3), cloud: S([0, 0, -4], [0, 0, 0], 1.4) },                       // кейсы
  { cross: S([-4.2, 0, -1.6], [0, 0, 0.3], 0.85), halo: S([-4.2, 1.7, -1.6], [1.3, 0, 0], 0.55), wings: HIDE, cloud: S([-4, 0, -2.5], [0, 0, 0], 0.7) },           // процесс
  { cross: HIDE, halo: S([0, 2.5, -2.2], [1.35, 0, 0], 1.3), wings: HIDE, cloud: S([0, 0, -3.5], [0, 0, 0], 1.5) },                                               // команда
  { cross: S([0, -2.9, -3], [0.2, 0, 0], 0.7), halo: HIDE, wings: S([0, 2.4, -4], [0, 0, 0], 1.3), cloud: S([0, 0, -4], [0, 0, 0], 1.2) },                          // форматы
  { cross: S([4.6, 0, -2], [0.2, 0.6, 0.3], 0.7), halo: S([4.6, 1.6, -2], [1.3, 0, 0], 0.5), wings: HIDE, cloud: S([4.4, 0, -3], [0, 0, 0], 0.6) },                 // вопросы
  { cross: S([2.9, 0, 0], [0, 0, 0], 1.15), halo: S([2.9, 1.9, 0], [1.25, 0, 0], 0.8), wings: S([2.9, 0.45, -0.7], [0, 0, 0], 1.35), cloud: S([2.9, 0, -1], [0, 0, 0], 1) }, // заявка
  { cross: S([0, 0.6, 0], [0, 0, 0], 1.3), halo: S([0, 2.6, 0], [1.25, 0, 0], 0.9), wings: S([0, 1, -0.8], [0, 0, 0], 1.6), cloud: S([0, 0.5, -1], [0, 0, 0], 1.2) }, // футер
];

const sections = [...document.querySelectorAll("[data-scene]")].sort((a, b) => a.dataset.scene - b.dataset.scene);
let tops = [];
const measure = () => { tops = sections.map(el => el.getBoundingClientRect().top + scrollY); };
measure();
addEventListener("load", measure);
new ResizeObserver(measure).observe(document.body);

const smooth = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
function targetState() {
  const y = scrollY + innerHeight * 0.5;
  let i = 0;
  while (i < tops.length - 1 && y >= tops[i + 1]) i++;
  const a = STATES[i], b = STATES[Math.min(i + 1, STATES.length - 1)];
  const span = (tops[i + 1] ?? tops[i] + 1) - tops[i];
  const t = smooth(Math.min(1, Math.max(0, (y - tops[i]) / span)));
  const out = {};
  for (const k in rigs) out[k] = {
    p: a[k].p.map((v, j) => lerp(v, b[k].p[j], t)),
    r: a[k].r.map((v, j) => lerp(v, b[k].r[j], t)),
    s: lerp(a[k].s, b[k].s, t),
  };
  return out;
}

// мышь наклоняет весь мир
let mx = 0, my = 0;
addEventListener("pointermove", e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });

function resize() {
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener("resize", resize);

let ready = false;
const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  const narrow = camera.aspect < 1, T = targetState(), k = calm ? 1 : 1 - Math.pow(0.0015, dt);
  for (const name in rigs) {
    const g = rigs[name], s = T[name];
    const px = narrow ? s.p[0] * 0.28 : s.p[0];
    g.position.x = lerp(g.position.x, px, k);
    g.position.y = lerp(g.position.y, s.p[1] + (narrow && name !== "cloud" ? -0.6 : 0), k);
    g.position.z = lerp(g.position.z, s.p[2], k);
    g.rotation.x = lerp(g.rotation.x, s.r[0], k);
    g.rotation.y = lerp(g.rotation.y, s.r[1], k);
    g.rotation.z = lerp(g.rotation.z, s.r[2], k);
    const sc = lerp(g.scale.x, s.s * (narrow ? 0.7 : 1), k);
    g.scale.setScalar(Math.max(sc, 0.0001));
    g.visible = sc > 0.01;
  }
  if (!calm) {
    cross.rotation.y = t * 0.45;
    halo.rotation.z = t * 0.6;
    wings.rotation.y = Math.sin(t * 0.6) * 0.35;
    wr.rotation.z = Math.sin(t * 1.4) * 0.08; wl.rotation.z = -Math.sin(t * 1.4) * 0.08;
    cloud.rotation.y = t * 0.04; cloud.rotation.x = Math.sin(t * 0.1) * 0.2;
    dust.rotation.y = t * 0.01;
    rigs.cross.position.y += Math.sin(t * 1.1) * 0.0025;
  }
  world.rotation.y = lerp(world.rotation.y, mx * 0.35, 0.05);
  world.rotation.x = lerp(world.rotation.x, my * 0.2, 0.05);
  camera.position.y = lerp(camera.position.y, -my * 0.3, 0.05);
  composer.render();
  if (!ready) { ready = true; document.documentElement.classList.add("gl-on"); document.dispatchEvent(new Event("gl-ready")); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
