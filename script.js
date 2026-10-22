// Куда уходит заявка: пока backend нет — копируем текст и открываем Telegram
const CONTACT_TG = "https://t.me/lfbutov";
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// ---------- меню ----------
const overlay = document.getElementById("overlay");
const menuBtn = document.getElementById("menuBtn");
function setMenu(open) {
  overlay.classList.toggle("open", open);
  overlay.setAttribute("aria-hidden", !open);
  menuBtn.setAttribute("aria-expanded", open);
  menuBtn.textContent = open ? "Закрыть" : "Меню";
}
menuBtn.addEventListener("click", () => setMenu(!overlay.classList.contains("open")));
overlay.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setMenu(false)));
addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

// ---------- плавное появление карточек ----------
const pending = new Set(document.querySelectorAll(".mani-frame, .radar-grid, .orbit-grid, .board, .tl, .dossier, .grid3, .qa-grid, .cform"));
pending.forEach(el => el.classList.add("rv"));
function sweep() {
  const h = innerHeight;
  for (const el of pending) {
    const r = el.getBoundingClientRect();
    if (r.top < h * .92 && r.bottom > 0) { el.classList.add("in"); pending.delete(el); }
  }
}

// ---------- перья ----------
const FEATHER = (() => {
  const p = new Path2D();
  p.moveTo(0, -.5);
  p.bezierCurveTo(-.3, -.32, -.3, .18, -.03, .4);
  p.lineTo(0, .5); p.lineTo(.03, .4);
  p.bezierCurveTo(.25, .2, .27, -.3, 0, -.5);
  return p;
})();
function feathers(canvas) {
  const ctx = canvas.getContext("2d"), n = +canvas.dataset.n || 12, dark = canvas.hasAttribute("data-dark") || !!canvas.closest(".angel");
  let w, h, dpr, list = [], last = 0;
  const spawn = top => {
    const z = .35 + Math.random() * .65;
    return { x: Math.random() * w, y: top ? -80 : Math.random() * h, z,
      size: (40 + Math.random() * 60) * z * (w < 640 ? .75 : 1), speed: (14 + Math.random() * 16) * z,
      amp: 30 + Math.random() * 60, f: .25 + Math.random() * .35, ph: Math.random() * 6.28, tilt: Math.random() - .5 };
  };
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    if (!list.length) list = Array.from({ length: n }, () => spawn(false));
  };
  const draw = t => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    for (const f of list) {
      const s = t * f.f + f.ph;
      ctx.save();
      ctx.translate(f.x + Math.sin(s) * f.amp, f.y);
      ctx.rotate(Math.sin(s + 1.57) * .55 + f.tilt);
      ctx.scale(f.size * (.55 + .45 * Math.abs(Math.cos(s * .7))), f.size);
      ctx.globalAlpha = .45 + f.z * .5;
      ctx.shadowColor = dark ? "rgba(255,255,255,.5)" : "rgba(0,0,0,.14)";
      ctx.shadowBlur = 10 * f.z;
      ctx.fillStyle = "#fff"; ctx.fill(FEATHER); ctx.shadowBlur = 0;
      ctx.lineWidth = 1.2 / f.size; ctx.strokeStyle = "rgba(130,130,130,.4)";
      ctx.beginPath(); ctx.moveTo(0, -.48); ctx.quadraticCurveTo(.02, 0, 0, .5); ctx.stroke();
      ctx.strokeStyle = "rgba(130,130,130,.13)";
      for (let i = -.36; i < .34; i += .07) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(-.24, i - .09); ctx.moveTo(0, i); ctx.lineTo(.2, i - .09); ctx.stroke(); }
      ctx.restore();
    }
  };
  const loop = now => {
    const r = canvas.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) {
      const dt = Math.min(.05, (now - last) / 1000 || 0);
      for (const f of list) { f.y += f.speed * dt; if (f.y > h + 80) Object.assign(f, spawn(true)); }
      draw(now / 1000);
    }
    last = now;
    requestAnimationFrame(loop);
  };
  resize();
  new ResizeObserver(resize).observe(canvas);
  calm ? draw(0) : requestAnimationFrame(loop);
}
document.querySelectorAll("canvas.feathers").forEach(feathers);

addEventListener("scroll", sweep, { passive: true });
addEventListener("resize", sweep);
addEventListener("load", sweep);
sweep();

// ---------- стекло наклоняется за курсором ----------
document.querySelectorAll(".tilt").forEach(g => {
  g.addEventListener("pointermove", e => {
    if (calm || e.pointerType !== "mouse") return;
    const r = g.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    g.style.setProperty("--ty", `${x * 12}deg`); g.style.setProperty("--tx", `${-y * 12}deg`);
  });
  g.addEventListener("pointerleave", () => { g.style.setProperty("--tx", "0deg"); g.style.setProperty("--ty", "0deg"); });
});

// ---------- первый экран: рой частиц собирается в крест, нимб и крылья ----------
(function swarm() {
  const canvas = document.querySelector(".swarm");
  if (!canvas) return;
  const hero = canvas.closest(".hero"), ctx = canvas.getContext("2d");
  const N = innerWidth < 700 ? 1500 : 3400;
  const rnd = (a, b) => a + Math.random() * (b - a);

  // формы в единичных координатах
  const cross = () => {
    const vert = Math.random() < .6;
    const p = vert ? [rnd(-.15, .15), rnd(-1, 1), rnd(-.15, .15)] : [rnd(-.66, .66), rnd(-.52, -.2), rnd(-.15, .15)];
    if (Math.random() < .7) { // точки на гранях — форма читается чётче
      const ax = Math.floor(Math.random() * 3), lim = vert ? [.15, 1, .15] : [.66, .16, .15];
      if (ax === 1 && !vert) p[1] = Math.random() < .5 ? -.52 : -.2;
      else p[ax] = (Math.random() < .5 ? -1 : 1) * lim[ax];
    }
    return p;
  };
  const halo = () => {
    const t = rnd(0, Math.PI * 2), f = rnd(0, Math.PI * 2), R = .95, r = .085;
    const x = (R + r * Math.cos(f)) * Math.cos(t), z = (R + r * Math.cos(f)) * Math.sin(t), y = r * Math.sin(f);
    const a = .42; return [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
  };
  const wings = () => {
    const s = Math.random() < .5 ? -1 : 1, f = Math.floor(rnd(0, 11)) / 10, t = Math.sqrt(Math.random());
    const th = 1.15 - f * 1.5, L = .55 + .6 * (1 - f) * (1 - f * .3);
    return [s * (.06 + Math.cos(th) * L * t) + rnd(-.02, .02), -Math.sin(th) * L * t * .95 + rnd(-.02, .02) - .05, Math.sin(t * Math.PI) * .18 * s * .6 + rnd(-.03, .03)];
  };
  const SHAPES = [["крест", cross], ["нимб", halo], ["крылья", wings]];
  const sets = SHAPES.map(([, g]) => Array.from({ length: N }, g));
  const P = Array.from({ length: N }, () => ({ x: rnd(-2, 2), y: rnd(-2, 2), z: rnd(-2, 2), vx: 0, vy: 0, vz: 0, ox: 0, oy: 0,
    k: rnd(.02, .045), b: Math.random() < .08 ? 1 : 0, w: rnd(0, 6.28) }));
  let shape = 0, w, h, dpr, rotY = 0, mx = -9999, my = -9999, tx = 0, ty = 0;
  const nameEl = document.getElementById("shapeName");
  const tags = [...hero.querySelectorAll(".tag")];
  const tagIdx = [7, 1500 % N, 911];

  const resize = () => { dpr = Math.min(devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; };
  resize(); new ResizeObserver(resize).observe(canvas);
  hero.addEventListener("pointermove", e => { const r = hero.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; tx = (mx / w - .5); ty = (my / h - .5); });
  hero.addEventListener("pointerleave", () => { mx = my = -9999; tx = ty = 0; });
  const next = () => { shape = (shape + 1) % SHAPES.length; if (nameEl) nameEl.textContent = SHAPES[shape][0]; };
  if (!calm) setInterval(next, 5600);

  let rx = 0;
  function frame(t) {
    const r = hero.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) {
      const T = sets[shape], time = t / 1000;
      rotY += .0035 + tx * .02; rx += ((ty * .5) - rx) * .05;
      const cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rx), sx = Math.sin(rx);
      const scale = Math.min(w, h) * (w < 700 ? .38 : .3), ox = w / 2, oy = h * .42;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < N; i++) {
        const p = P[i], g = T[i], wob = Math.sin(time * 1.3 + p.w) * .012;
        p.vx = (p.vx + (g[0] + wob - p.x) * p.k) * .86; p.vy = (p.vy + (g[1] + wob - p.y) * p.k) * .86; p.vz = (p.vz + (g[2] - p.z) * p.k) * .86;
        p.x += p.vx; p.y += p.vy; p.z += p.vz;
        const x1 = p.x * cy - p.z * sy, z1 = p.x * sy + p.z * cy, y1 = p.y * cx - z1 * sx, z2 = p.y * sx + z1 * cx;
        const per = 2.8 / (2.8 + z2);
        let X = ox + x1 * scale * per, Y = oy + y1 * scale * per;
        const dx = X - mx, dy = Y - my, d2 = dx * dx + dy * dy;
        if (d2 < 14000) { const d = Math.sqrt(d2) || 1, f = (118 - d) * .09; p.ox += dx / d * f; p.oy += dy / d * f; }
        p.ox *= .9; p.oy *= .9; X += p.ox; Y += p.oy;
        p.sx = X; p.sy = Y;
        const a = Math.max(.25, Math.min(1, (1.5 - z2) * .7));
        const s = (p.b ? 2.8 : 1.6) * per;
        ctx.globalAlpha = a * (p.b ? 1 : .8);
        ctx.fillStyle = p.b ? "#ffffff" : "#d8d8d8";
        ctx.fillRect(X - s / 2, Y - s / 2, s, s);
      }
      ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
      tags.forEach((el, k) => {
        const p = P[tagIdx[k]];
        const X = Math.min(w - 170, Math.max(12, p.sx + 10)), Y = Math.min(h - 30, Math.max(70, p.sy - 9));
        el.style.transform = `translate(${X}px, ${Y}px)`; el.classList.add("on");
      });
    }
    if (!calm) requestAnimationFrame(frame);
  }
  if (calm) { P.forEach((p, i) => Object.assign(p, { x: sets[0][i][0], y: sets[0][i][1], z: sets[0][i][2] })); }
  requestAnimationFrame(frame);
})();

// ---------- отсчёт до следующего поста ----------
(function nextPost() {
  const els = ["nextPost", "nextPost2"].map(id => document.getElementById(id)).filter(Boolean);
  if (!els.length) return;
  const slots = [10, 13, 16, 19, 21];
  const tick = () => {
    const now = new Date();
    let t = slots.map(hh => { const d = new Date(now); d.setHours(hh, 0, 0, 0); return d; }).find(d => d > now);
    if (!t) { t = new Date(now); t.setDate(t.getDate() + 1); t.setHours(slots[0], 0, 0, 0); }
    const s = Math.floor((t - now) / 1000), p = n => String(n).padStart(2, "0");
    const txt = `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`;
    els.forEach(el => { el.textContent = txt; });
  };
  tick(); setInterval(tick, 1000);
})();

// ---------- видео с интерфейсом камеры ----------
(function cam() {
  const box = document.getElementById("cam");
  if (!box) return;
  const v = box.querySelector("video"), tc = document.getElementById("camTc");
  const f = s => { s = Math.floor(s); return `00:${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };
  box.querySelector(".cam-play").addEventListener("click", () => { v.controls = true; v.play(); box.classList.add("playing"); });
  v.addEventListener("timeupdate", () => { tc.textContent = `${f(v.currentTime)} / 01:03`; });
  v.addEventListener("ended", () => box.classList.remove("playing"));
})();

// ---------- 01: радар находит симптомы ----------
(function radar() {
  const c = document.querySelector("canvas.radar");
  if (!c) return;
  const ctx = c.getContext("2d"), items = [...document.querySelectorAll(".finds li")];
  const blips = [{ a: -0.9, r: .62 }, { a: 1.1, r: .42 }, { a: 2.7, r: .74 }].map(b => ({ ...b, glow: 0 }));
  let w, dpr, ang = 0, last = 0;
  const resize = () => { dpr = Math.min(devicePixelRatio || 1, 2); w = c.clientWidth; c.width = c.height = w * dpr; };
  resize(); new ResizeObserver(resize).observe(c);
  function frame(t) {
    const r = c.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) {
      const dt = Math.min(.05, (t - last) / 1000 || 0);
      ang = (ang + dt * (calm ? 0 : 1.2)) % (Math.PI * 2);
      const R = w / 2 - 6, cx = w / 2, cy = w / 2;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, w);
      ctx.strokeStyle = "rgba(255,255,255,.14)"; ctx.lineWidth = 1;
      [1, .75, .5, .25].forEach(k => { ctx.beginPath(); ctx.arc(cx, cy, R * k, 0, 6.283); ctx.stroke(); });
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
      for (let k = 0; k < 36; k++) { const a = k / 36 * 6.283, l = k % 3 ? 5 : 11; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.lineTo(cx + Math.cos(a) * (R - l), cy + Math.sin(a) * (R - l)); ctx.stroke(); }
      // луч со шлейфом
      const g = ctx.createConicGradient ? ctx.createConicGradient(ang - 1.2, cx, cy) : null;
      if (g) { g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(1.2 / 6.283, "rgba(255,255,255,.22)"); g.addColorStop(1.2 / 6.283 + .001, "rgba(255,255,255,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.fill(); }
      ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R); ctx.stroke();
      blips.forEach((b, i) => {
        const a = ((b.a % 6.283) + 6.283) % 6.283, d = ((ang - a) % 6.283 + 6.283) % 6.283;
        if (d < .08) { b.glow = 1; items[i]?.classList.add("hit"); }
        b.glow = Math.max(calm ? 1 : .18, b.glow - dt * .35);
        const x = cx + Math.cos(a) * R * b.r, y = cy + Math.sin(a) * R * b.r;
        ctx.fillStyle = `rgba(255,255,255,${b.glow})`; ctx.shadowColor = "#fff"; ctx.shadowBlur = 18 * b.glow;
        ctx.beginPath(); ctx.arc(x, y, 5, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(255,255,255,${b.glow * .6})`; ctx.beginPath(); ctx.arc(x, y, 12 + (1 - b.glow) * 16, 0, 6.283); ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${.35 + b.glow * .6})`; ctx.font = "700 11px Inter Tight, sans-serif"; ctx.fillText(`СИГНАЛ 0${i + 1}`, x + 16, y - 10);
      });
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 6.283); ctx.fill();
    }
    last = t;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

// ---------- 02: роли на орбитах ----------
(function orbit() {
  const roles = [...document.querySelectorAll(".orb-role")], text = document.querySelector(".orbit-text");
  if (!roles.length || !text) return;
  const tip = document.createElement("div");
  tip.className = "orb-tip"; tip.innerHTML = "<b>Наведите на роль</b><span>Шесть ролей ведут канал вокруг вас.</span>";
  text.appendChild(tip);
  const show = li => {
    roles.forEach(r => r.querySelector("button").classList.toggle("on", r === li));
    tip.innerHTML = `<b>${li.querySelector("b").textContent}</b><span>${li.querySelector("p").textContent}</span>`;
  };
  roles.forEach(li => { const b = li.querySelector("button"); b.addEventListener("mouseenter", () => show(li)); b.addEventListener("click", () => show(li)); b.addEventListener("focus", () => show(li)); });
})();

// ---------- короткая заявка ----------
(function contact() {
  const form = document.getElementById("cform");
  if (!form) return;
  const chips = [...form.querySelectorAll(".chip")];
  const pick = text => chips.forEach(c => { const on = c.textContent === text; c.classList.toggle("on", on); c.setAttribute("aria-pressed", on); });
  chips.forEach(c => c.addEventListener("click", () => pick(c.textContent)));
  // кнопки в форматах сразу выбирают задачу
  document.querySelectorAll("[data-pick]").forEach(a => a.addEventListener("click", () => pick(a.dataset.pick)));
  const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  form.addEventListener("submit", e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const task = chips.find(c => c.classList.contains("on"))?.textContent || "—";
    const text = ["Заявка с сайта Агентства Нас#лия", "", `Задача: ${task}`, `Имя: ${d.name}`, `Telegram: ${d.tg}`].join("\n");
    navigator.clipboard?.writeText(text).catch(() => {});
    form.innerHTML = `<div class="cform-done"><b>Заявка готова.</b><p class="cform-note">Мы скопировали текст — откройте чат и вставьте его.</p><pre>${esc(text)}</pre><a class="btn light" href="${CONTACT_TG}" target="_blank" rel="noopener">Открыть Telegram ↗</a></div>`;
  });
})();

// ---------- фон: звёздная пыль на весь сайт ----------
(function stars() {
  const c = document.querySelector("canvas.stars");
  if (!c) return;
  const ctx = c.getContext("2d"), n = innerWidth < 700 ? 70 : 150;
  let w, h, dpr;
  const pts = Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), z: .2 + Math.random() * .8, t: Math.random() * 6.28, v: .00004 + Math.random() * .00008 }));
  const resize = () => { dpr = Math.min(devicePixelRatio || 1, 2); w = innerWidth; h = innerHeight; c.width = w * dpr; c.height = h * dpr; };
  resize(); addEventListener("resize", resize);
  function frame(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const sy = scrollY;
    for (const p of pts) {
      if (!calm) p.y -= p.v * p.z;
      if (p.y < 0) p.y += 1;
      const y = ((p.y * h - sy * .08 * p.z) % h + h) % h, x = p.x * w;
      const a = (.25 + .55 * (Math.sin(t / 900 + p.t) * .5 + .5)) * p.z, s = p.z * 1.8;
      ctx.globalAlpha = a; ctx.fillStyle = "#fff"; ctx.fillRect(x, y, s, s);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

// ---------- нимб над курсором ----------
const halo = document.querySelector(".halo-cursor");
if (halo && matchMedia("(hover: hover)").matches && !calm) {
  let tx = 0, ty = 0, x = 0, y = 0;
  addEventListener("pointermove", e => { tx = e.clientX; ty = e.clientY - 26; halo.classList.add("on"); });
  document.addEventListener("pointerleave", () => halo.classList.remove("on"));
  const follow = () => {
    x += (tx - x) * .18; y += (ty - y) * .18;
    halo.style.transform = `translate(${x}px, ${y}px)`;
    requestAnimationFrame(follow);
  };
  follow();
}
