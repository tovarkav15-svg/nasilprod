// Куда уходит заявка: пока backend нет — копируем текст и открываем Telegram
const CONTACT_TG = "https://t.me/lfbutov";
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
requestAnimationFrame(() => document.documentElement.classList.add("ready"));

// ---------- меню ----------
const overlay = document.getElementById("overlay"), menuBtn = document.getElementById("menuBtn");
function setMenu(open) {
  overlay.classList.toggle("open", open); overlay.setAttribute("aria-hidden", !open);
  menuBtn.setAttribute("aria-expanded", open); menuBtn.textContent = open ? "Закрыть" : "Меню";
}
menuBtn.addEventListener("click", () => setMenu(!overlay.classList.contains("open")));
overlay.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setMenu(false)));
addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

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
  // три группы частиц: светлые, серые и немного акцентных
  const COL = ["#efefeb", "#8a8a90", "#7584cf"];
  const sets = SHAPES.map(([, g]) => Array.from({ length: N }, g));
  const P = Array.from({ length: N }, () => ({ x: rnd(-2, 2), y: rnd(-2, 2), z: rnd(-2, 2), vx: 0, vy: 0, vz: 0, ox: 0, oy: 0,
    k: rnd(.02, .045), b: Math.random() < .08 ? 1 : 0, w: rnd(0, 6.28), g: (r => r < .4 ? 0 : r < .84 ? 1 : 2)(Math.random()) }));
  let shape = 0, w, h, dpr, rotY = 0, mx = -9999, my = -9999, tx = 0, ty = 0;
    const tags = [...hero.querySelectorAll(".tag")];
  const tagIdx = [7, 1500 % N, 911];

  const resize = () => { dpr = Math.min(devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; };
  resize(); new ResizeObserver(resize).observe(canvas);
  hero.addEventListener("pointermove", e => { const r = hero.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; tx = (mx / w - .5); ty = (my / h - .5); });
  hero.addEventListener("pointerleave", () => { mx = my = -9999; tx = ty = 0; });
  const next = () => { shape = (shape + 1) % SHAPES.length; };
  if (!calm) setInterval(next, 5600);

  let rx = 0;
  function frame(t) {
    const r = hero.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) {
      const T = sets[shape], time = t / 1000;
      rotY += .0035 + tx * .02; rx += ((ty * .5) - rx) * .05;
      const cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rx), sx = Math.sin(rx);
      const scale = Math.min(w, h) * (w < 700 ? .34 : .33), ox = w / 2, oy = h * .5;
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
        p.a = Math.max(.25, Math.min(1, (1.5 - z2) * .7)) * (p.b ? 1 : .8);
        p.s = (p.b ? 2.8 : 1.6) * per;
      }
      for (let g = 0; g < 3; g++) {
        ctx.fillStyle = COL[g];
        for (let i = 0; i < N; i++) { const p = P[i]; if (p.g !== g) continue; ctx.globalAlpha = p.a; ctx.fillRect(p.sx - p.s / 2, p.sy - p.s / 2, p.s, p.s); }
      }
      ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
      tags.forEach((el, k) => {
        const p = P[tagIdx[k]];
        const X = Math.min(w - 190, Math.max(12, p.sx + 10)), Y = Math.min(h - 30, Math.max(70, p.sy - 9));
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
  const el = document.getElementById("nextPost");
  if (!el) return;
  const slots = [10, 13, 16, 19, 21];
  const tick = () => {
    const now = new Date();
    let t = slots.map(hh => { const d = new Date(now); d.setHours(hh, 0, 0, 0); return d; }).find(d => d > now);
    if (!t) { t = new Date(now); t.setDate(t.getDate() + 1); t.setHours(slots[0], 0, 0, 0); }
    const s = Math.floor((t - now) / 1000), p = n => String(n).padStart(2, "0");
    el.textContent = `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`;
  };
  tick(); setInterval(tick, 1000);
})();

// ---------- прокрутка: лента кейсов, появление ----------
const work = document.getElementById("cases"), track = document.getElementById("workTrack");
const road = document.getElementById("road"), steps = road ? [...road.children] : [];
const pending = new Set(document.querySelectorAll(".formula, .video, .tabs, .crew-box, .road, .people, .counter, .cards, .qa"));
pending.forEach(el => el.classList.add("rv"));
function onScroll() {
  const H = innerHeight;
  if (work && track) {
    const r = work.getBoundingClientRect(), pinned = getComputedStyle(work.firstElementChild).position === "sticky";
    const p = pinned ? clamp(-r.top / (r.height - H)) : 0;
    const max = Math.max(0, track.scrollWidth - track.parentElement.clientWidth);
    track.style.transform = pinned ? `translate3d(${-p * max}px,0,0)` : "";
  }
  if (road) {
    const r = road.getBoundingClientRect(), p = clamp((H * .8 - r.top) / (r.height + H * .3));
    road.style.setProperty("--p", p);
    steps.forEach((li, i) => li.classList.toggle("on", p >= i / (steps.length - 1) - .02));
  }
  for (const el of pending) { const r = el.getBoundingClientRect(); if (r.top < H * .9 && r.bottom > 0) { el.classList.add("in"); pending.delete(el); } }
}
addEventListener("scroll", onScroll, { passive: true }); addEventListener("resize", onScroll); addEventListener("load", onScroll); onScroll();

// ---------- услуги: вкладки ----------
(function tabs() {
  const btns = [...document.querySelectorAll(".tab-list button")], panes = [...document.querySelectorAll(".tp")];
  btns.forEach((b, i) => b.addEventListener("click", () => {
    btns.forEach((x, j) => { x.classList.toggle("on", i === j); x.setAttribute("aria-selected", i === j); });
    panes.forEach((p, j) => p.classList.toggle("on", i === j));
  }));
})();

// ---------- цифры: счёт от нуля при появлении ----------
(function counter() {
  const nums = [...document.querySelectorAll(".counter b[data-n]")];
  if (!nums.length || calm) return;
  const fmt = (el, v) => { el.textContent = el.dataset.f.replace("{n}", Math.round(v).toLocaleString("ru-RU")); };
  nums.forEach(el => fmt(el, 0));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    const el = e.target, to = +el.dataset.n, t0 = performance.now();
    const step = t => { const q = clamp((t - t0) / 1400); fmt(el, to * (1 - Math.pow(1 - q, 3))); if (q < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
    setTimeout(() => fmt(el, to), 1600); // если вкладка в фоне и кадры не идут
  }), { threshold: .6 });
  nums.forEach(el => io.observe(el));
})();

// ---------- видео ----------
(function video() {
  const box = document.getElementById("video");
  if (!box) return;
  const v = box.querySelector("video");
  box.querySelector(".vplay").addEventListener("click", () => { v.controls = true; v.play(); box.classList.add("playing"); });
  v.addEventListener("ended", () => box.classList.remove("playing"));
})();

// ---------- команда канала: было → стало ----------
(function crew() {
  const c = document.querySelector(".crew-canvas");
  if (!c) return;
  const ctx = c.getContext("2d");
  const ROLES = ["Стратегия", "Редактура", "Тексты", "Дизайн", "Продвижение", "Запуски"];
  const tasks = Array.from({ length: 36 }, (_, i) => ({ role: i % 6, x: 0, y: 0, a: Math.random() * 6.28, r: Math.random(), init: false }));
  const stats = [["36", "1", "всё"], ["2", "7", "экспертиза"]];
  let mode = 0, w, h, dpr, touched = false, seen = false, you = 1;
  const resize = () => { dpr = Math.min(devicePixelRatio || 1, 2); w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; };
  resize(); new ResizeObserver(resize).observe(c);
  const btns = [...document.querySelectorAll(".seg button")];
  const set = m => { mode = m; btns.forEach(b => b.classList.toggle("on", +b.dataset.m === m)); ["cs1", "cs2", "cs3"].forEach((id, i) => { document.getElementById(id).textContent = stats[m][i]; }); };
  btns.forEach(b => b.addEventListener("click", () => { touched = true; set(+b.dataset.m); }));
  const nodes = () => ROLES.map((_, i) => { const a = -Math.PI / 2 + i * Math.PI / 3, R = Math.min(w * .36, h * .38); return { x: w / 2 + Math.cos(a) * R * 1.2, y: h / 2 + Math.sin(a) * R }; });
  function frame(t) {
    const r = c.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) {
      if (!seen && r.top < innerHeight * .55) { seen = true; setTimeout(() => { if (!touched) set(1); }, 1800); }
      const time = t / 1000, N = nodes(), C = { x: w / 2, y: h / 2 };
      you += ((mode ? .6 : 1) - you) * .08;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      if (mode) { ctx.setLineDash([2, 6]); ctx.strokeStyle = "rgba(239,239,235,.22)"; N.forEach(n => { ctx.beginPath(); ctx.moveTo(C.x, C.y); ctx.lineTo(n.x, n.y); ctx.stroke(); }); ctx.setLineDash([]); }
      tasks.forEach(k => {
        const o = mode ? N[k.role] : C, sp = mode ? 30 : 74 + Math.sin(time * 3 + k.a) * 10;
        const ang = k.a + time * (mode ? .35 : 1.5) * (k.r > .5 ? 1 : -1);
        const gx = o.x + Math.cos(ang) * sp * (.4 + k.r * .6), gy = o.y + Math.sin(ang) * sp * (.4 + k.r * .6);
        if (!k.init) { k.x = gx; k.y = gy; k.init = true; }
        k.x += (gx - k.x) * (calm ? 1 : .06); k.y += (gy - k.y) * (calm ? 1 : .06);
        ctx.strokeStyle = "rgba(239,239,235,.08)"; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(k.x, k.y); ctx.stroke();
        ctx.fillStyle = mode ? "#8a8a90" : "#efefeb"; ctx.beginPath(); ctx.arc(k.x, k.y, 3, 0, 6.28); ctx.fill();
      });
      ctx.font = "500 13px Inter, sans-serif"; ctx.textAlign = "center";
      N.forEach((n, i) => {
        ctx.globalAlpha = mode ? 1 : .3;
        ctx.fillStyle = "#1c1c21"; ctx.strokeStyle = "#efefeb"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(n.x, n.y, 10, 0, 6.28); ctx.fill(); ctx.stroke(); ctx.lineWidth = 1;
        const hw = ctx.measureText(ROLES[i]).width / 2 + 4;
        ctx.fillStyle = "#efefeb"; ctx.fillText(ROLES[i], clamp(n.x, hw, w - hw), n.y + (n.y < h / 2 ? -22 : 30));
      });
      ctx.globalAlpha = 1;
      const R = 22 * you + (mode ? 0 : Math.sin(time * 6) * 2);
      if (!mode) { ctx.strokeStyle = "rgba(117,132,207,.45)"; ctx.beginPath(); ctx.arc(C.x, C.y, R + 12 + Math.sin(time * 6) * 3, 0, 6.28); ctx.stroke(); }
      ctx.fillStyle = "#7584cf"; ctx.beginPath(); ctx.arc(C.x, C.y, R, 0, 6.28); ctx.fill();
      ctx.fillStyle = "#0b0b0d"; ctx.font = "600 13px Inter, sans-serif"; ctx.fillText("Вы", C.x, C.y + 4);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

// ---------- хаос → система: точки собираются в календарь публикаций ----------
(function chaos() {
  const sec = document.getElementById("chaos"), c = document.querySelector(".chaos-canvas"), pct = document.getElementById("chaosPct");
  if (!sec || !c) return;
  const ctx = c.getContext("2d"), W = 12, D = 7, cells = [];
  for (let wk = 0; wk < W; wk++) for (let d = 0; d < D; d++) {
    let lvl = d < 5 ? 1 : (d === 6 && wk % 2 ? 1 : 0);
    if (wk >= 8 && wk <= 9) lvl = d < 6 ? 2 : 1;
    if (wk >= 10) lvl = d < 3 ? 3 : d < 6 ? 2 : 1;
    cells.push({ wk, d, lvl, rx: Math.random(), ry: Math.random(), ph: Math.random() * 6.28, t: Math.random() * .4 + wk / W * .45 });
  }
  let w, h, dpr;
  const resize = () => { dpr = Math.min(devicePixelRatio || 1, 2); w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; };
  resize(); new ResizeObserver(resize).observe(c);
  function frame(t) {
    const r = sec.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) {
      const pinned = getComputedStyle(sec.firstElementChild).position === "sticky";
      const p = calm ? 1 : clamp(pinned ? -r.top / (r.height - innerHeight) * 1.1 : (innerHeight - r.top) / (r.height + innerHeight));
      pct.textContent = Math.round(p * 100) + "%";
      const time = t / 1000, gw = Math.min(w * .62, 900), cs = gw / W, gx = w - gw - Math.max(16, w * .04), gy = h * .5 - cs * D / 2 + 30;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      ctx.font = "400 11px Inter, sans-serif"; ctx.fillStyle = `rgba(239,239,235,${.5 * p})`;
      ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].forEach((n, i) => ctx.fillText(n, gx - 26, gy + i * cs + cs / 2 + 4));
      for (const k of cells) {
        const q = clamp((p - k.t) / .3), e = q * q * (3 - 2 * q);
        const cx = k.rx * w + Math.sin(time * .6 + k.ph) * 30, cy = k.ry * h + Math.cos(time * .5 + k.ph) * 30;
        const tx = gx + k.wk * cs + cs / 2, ty = gy + k.d * cs + cs / 2;
        const x = cx + (tx - cx) * e, y = cy + (ty - cy) * e;
        const lvl = e > .9 ? k.lvl : (k.lvl ? 1 : 0);
        const size = 4 + e * (cs * .62 - 4);
        ctx.globalAlpha = lvl ? .35 + e * .65 : .18 + e * .1;
        ctx.fillStyle = lvl === 3 ? "#7584cf" : lvl === 2 ? "#efefeb" : lvl === 1 ? "#5c5c63" : "#efefeb";
        if (e > .9 && lvl === 0) { ctx.strokeStyle = "rgba(239,239,235,.16)"; ctx.strokeRect(x - size / 2, y - size / 2, size, size); }
        else { const s = size, rr = Math.min(s / 2, 2 + e * 4); ctx.beginPath(); ctx.roundRect(x - s / 2, y - s / 2, s, s, rr); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

// ---------- заявка ----------
(function contact() {
  const form = document.getElementById("cform");
  if (!form) return;
  const chips = [...form.querySelectorAll(".chip")];
  const pick = text => chips.forEach(c => { const on = c.textContent === text; c.classList.toggle("on", on); c.setAttribute("aria-pressed", on); });
  chips.forEach(c => c.addEventListener("click", () => pick(c.textContent)));
  document.querySelectorAll("[data-pick]").forEach(a => a.addEventListener("click", () => pick(a.dataset.pick)));
  const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  form.addEventListener("submit", e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const task = chips.find(c => c.classList.contains("on"))?.textContent || "—";
    const text = ["Заявка с сайта Агентства Нас#лия", "", `Задача: ${task}`, `Имя: ${d.name}`, `Telegram: ${d.tg}`].join("\n");
    navigator.clipboard?.writeText(text).catch(() => {});
    form.innerHTML = `<div class="done"><b>Заявка готова.</b><span>Мы скопировали текст — откройте чат и вставьте его.</span><pre>${esc(text)}</pre><a class="pill" href="${CONTACT_TG}" target="_blank" rel="noopener">Открыть Telegram ↗</a></div>`;
  });
})();
