// Куда уходит заявка: пока backend нет — копируем текст и открываем Telegram
const CONTACT_TG = "https://t.me/lfbutov";
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = matchMedia("(pointer: fine)").matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const rnd = (a, b) => a + Math.random() * (b - a);

// буквы заголовков — в отдельные span, чтобы размывать края слов
function split(el, blur = () => 0) {
  const chars = [...el.textContent];
  el.textContent = "";
  chars.forEach((ch, i) => { const s = document.createElement("i"); s.textContent = ch; s.style.setProperty("--b", blur(i, chars.length)); el.appendChild(s); });
}
const w1 = document.querySelector(".w1"), w2 = document.querySelector(".w2");
if (w1) split(w1, (i) => [7, 3.5, 1.2, 0, 0][i] ?? 0);
if (w2) split(w2, (i, n) => [0, 0, 0, 1, 3.5, 7][i - (n - 6)] ?? 0);
const shot = location.search.includes("shot");
if (shot) document.documentElement.classList.add("noanim");
requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.add("ready")));

// ---------- меню ----------
const overlay = document.getElementById("overlay"), menuBtn = document.getElementById("menuBtn");
function setMenu(open) {
  overlay.classList.toggle("open", open); overlay.setAttribute("aria-hidden", !open);
  menuBtn.setAttribute("aria-expanded", open); menuBtn.textContent = open ? "Закрыть" : "Меню";
}
menuBtn.addEventListener("click", () => setMenu(!overlay.classList.contains("open")));
overlay.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setMenu(false)));

// ---------- курсор и «скорость» для размытия букв ----------
let px = innerWidth / 2, py = innerHeight / 2, vel = 0;
(function pointer() {
  const dot = document.querySelector(".cursor"), big = document.querySelector(".big");
  let lx = px, ly = py, cx = px, cy = py, lastY = scrollY;
  addEventListener("pointermove", e => { px = e.clientX; py = e.clientY; dot?.classList.add("on"); });
  document.addEventListener("pointerover", e => dot?.classList.toggle("big", !!e.target.closest("a, button, summary, label, .obj")));
  (function loop() {
    const sv = Math.abs(scrollY - lastY); lastY = scrollY;
    vel += (Math.min(1, (Math.hypot(px - lx, py - ly) + sv * 1.5) / 90) - vel) * .12;
    lx = px; ly = py;
    if (big && !calm) big.style.setProperty("--v", vel.toFixed(3));
    if (!calm) document.documentElement.style.setProperty("--sr", `${(performance.now() / 1000 * 14 + scrollY * .18) % 360}deg`);
    if (dot && fine) { cx += (px - cx) * .25; cy += (py - cy) * .25; dot.style.transform = `translate(${cx}px,${cy}px)`; }
    requestAnimationFrame(loop);
  })();
})();

// ---------- первый экран: крылья и нимб из частиц вокруг фото ----------
(function wings() {
  const canvas = document.querySelector(".wings");
  if (!canvas) return;
  const hero = canvas.closest(".hero"), photo = hero.querySelector(".angel"), ctx = canvas.getContext("2d");
  const N = innerWidth < 700 ? 1700 : 3600;
  const P = [];
  const wing = s => {
    const u = Math.random() < .7 ? Math.round(rnd(0, 17)) / 17 + rnd(-.006, .006) : Math.random();
    const ex = s * (.3 + u * 1.55), ey = -.2 - Math.sin(u * Math.PI * .85) * .55 + u * .05;
    let dx = s * (.15 + .55 * u), dy = 1; const L = Math.hypot(dx, dy); dx /= L; dy /= L;
    const l = .45 + .95 * Math.pow(u, .8), t = Math.pow(Math.random(), 1.2);
    return { x: ex + dx * l * t + rnd(-.012, .012), y: ey + dy * l * t + rnd(-.012, .012), s, u };
  };
  for (let i = 0; i < N; i++) {
    const r = Math.random(); let p;
    if (r < .82) p = wing(i % 2 ? 1 : -1);
    else if (r < .92) { const a = rnd(0, 6.28); p = { x: Math.cos(a) * .3 + rnd(-.012, .012), y: -.7 + Math.sin(a) * .07 + rnd(-.008, .008), s: 0, halo: 1 }; }
    else p = { x: rnd(-2.4, 2.4), y: rnd(-1.4, 1.4), s: 0, dust: 1, ph: rnd(0, 6.28) };
    Object.assign(p, { px: rnd(0, innerWidth), py: rnd(0, innerHeight), vx: 0, vy: 0, ox: 0, oy: 0, k: rnd(.018, .05), g: p.halo ? 0 : (Math.random() < .35 ? 0 : Math.random() < .6 ? 1 : 2), sa: rnd(0, 6.28) });
    P.push(p);
  }
  // HUD-метки на кончиках крыльев
  const tip = s => P.reduce((b, p, i) => (p.s === s && p.y < -.3 && (b < 0 || p.x * s > P[b].x * s) ? i : b), -1);
  const tags = [...hero.querySelectorAll(".tag")], tagIdx = [tip(-1), tip(1)];
  const COL = ["rgba(11,11,12,.85)", "rgba(11,11,12,.5)", "rgba(11,11,12,.22)"], SZ = [1.9, 1.5, 1.2];
  let w, h, dpr, mx = -9999, my = -9999;
  const resize = () => { dpr = Math.min(devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; };
  resize(); new ResizeObserver(resize).observe(canvas);
  hero.addEventListener("pointermove", e => { const r = hero.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
  hero.addEventListener("pointerleave", () => { mx = my = -9999; });
  function frame(t) {
    const hr = hero.getBoundingClientRect();
    if (hr.bottom > 0) {
      const time = t / 1000, pr = photo.getBoundingClientRect();
      const ox = pr.left + pr.width / 2 - hr.left, oy = pr.top + pr.height / 2 - hr.top + Math.sin(time * .8) * 4;
      const U = Math.min(pr.height || 280, w / (w < 700 ? 3.4 : 4.3)), sp = clamp(-hr.top / (hr.height * .75));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      for (const p of P) {
        let x = p.x, y = p.y;
        if (p.s) { // взмах: поворот крыла вокруг основания
          const a = p.s * Math.sin(time * 1.3) * .07, rx = x - p.s * .3, ry = y + .2;
          x = p.s * .3 + rx * Math.cos(a) - ry * Math.sin(a); y = -.2 + rx * Math.sin(a) + ry * Math.cos(a);
        }
        if (p.dust) { x += Math.sin(time * .3 + p.ph) * .05; y += Math.cos(time * .25 + p.ph) * .05; }
        let tx = ox + x * U, ty = oy + y * U;
        if (sp > 0) { const f = sp * sp * 900; tx += Math.cos(p.sa) * f; ty += Math.sin(p.sa) * f - sp * 200; }
        p.vx = (p.vx + (tx - p.px) * p.k) * .86; p.vy = (p.vy + (ty - p.py) * p.k) * .86;
        p.px += p.vx; p.py += p.vy;
        const dx = p.px - mx, dy = p.py - my, d2 = dx * dx + dy * dy;
        if (d2 < 13000) { const d = Math.sqrt(d2) || 1, f = (114 - d) * .08; p.ox += dx / d * f; p.oy += dy / d * f; }
        p.ox *= .9; p.oy *= .9;
      }
      ctx.globalAlpha = 1 - sp * .7;
      for (let g = 0; g < 3; g++) {
        ctx.fillStyle = COL[g]; const s = SZ[g];
        for (const p of P) if (p.g === g) ctx.fillRect(p.px + p.ox - s / 2, p.py + p.oy - s / 2, s, s);
      }
      tags.forEach((el, k) => {
        const p = P[tagIdx[k]]; if (!p) return;
        const X = clamp(p.px + p.ox + (k ? 10 : -10), 8, w - 150), Y = clamp(p.py + p.oy - 8, 70, h - 90);
        el.style.transform = `translate(${k ? X : X - el.offsetWidth}px, ${Y}px)`; el.classList.add("on");
      });
    }
    requestAnimationFrame(frame);
  }
  if (calm || shot) P.forEach(p => { p.k = .5; });
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

// ---------- появление при прокрутке ----------
const ctTitle = document.getElementById("ctTitle");
if (ctTitle) {
  const lines = ctTitle.innerHTML.split("<br>");
  ctTitle.innerHTML = lines.map(l => `<span class="ln">${[...l].map(ch => `<i>${ch}</i>`).join("")}</span>`).join("");
  [...ctTitle.querySelectorAll("i")].forEach((s, i) => { s.style.transitionDelay = `${i * .05}s`; });
}
const pending = new Set(document.querySelectorAll(".ba, .sheet, .crew-top, .receipt, .desk, .people, .cards, .qa, .cform, .ct-title"));
pending.forEach(el => { if (!el.matches(".ba, .ct-title, .receipt")) el.classList.add("rv"); });
function onScroll() {
  const H = innerHeight;
  for (const el of pending) { const r = el.getBoundingClientRect(); if (r.top < H * .85 && r.bottom > 0) { el.classList.add("in"); pending.delete(el); } }
}
addEventListener("scroll", onScroll, { passive: true }); addEventListener("resize", onScroll); addEventListener("load", onScroll); onScroll();

// ---------- услуги: кадры плёнки + шкала ----------
(function film() {
  const sec = document.getElementById("services");
  if (!sec) return;
  const row = sec.querySelector(".film-row"), frs = [...sec.querySelectorAll(".fr")], items = [...sec.querySelectorAll(".si")];
  const ticks = [...sec.querySelectorAll(".spec-ticks button")], num = document.getElementById("svcN");
  let cur = 0, touched = false;
  const go = i => {
    cur = (i + items.length) % items.length;
    [frs, items, ticks].forEach(list => list.forEach((el, j) => el.classList.toggle("on", j === cur)));
    sec.style.setProperty("--k", cur);
    num.textContent = String(cur + 1).padStart(2, "0");
    if (row.scrollWidth > row.clientWidth) row.scrollTo({ left: frs[cur].offsetLeft - row.offsetLeft - 20, behavior: "smooth" });
  };
  [frs, ticks].forEach(list => list.forEach((b, i) => b.addEventListener("click", () => { touched = true; go(i); })));
  go(0);
  setInterval(() => { const r = sec.getBoundingClientRect(); if (!touched && !calm && r.top < innerHeight * .5 && r.bottom > innerHeight * .5) go(cur + 1); }, 5000);
})();

// ---------- видео ----------
(function video() {
  const m = document.getElementById("vmodal"), v = m?.querySelector("video");
  if (!m) return;
  const set = open => { m.classList.toggle("open", open); m.setAttribute("aria-hidden", !open); if (open) v.play(); else v.pause(); };
  document.getElementById("playVideo")?.addEventListener("click", () => set(true));
  document.getElementById("vclose").addEventListener("click", () => set(false));
  addEventListener("keydown", e => { if (e.key === "Escape") { set(false); setMenu(false); } });
})();

// ---------- до / после: шторка ----------
(function beforeAfter() {
  const box = document.getElementById("ba"), h = box?.querySelector(".ba-handle");
  if (!box) return;
  let x = 50, on = false, touched = false;
  const set = v => { x = clamp(v, 4, 96); box.style.setProperty("--x", x + "%"); h.setAttribute("aria-valuenow", Math.round(x)); };
  const at = e => { const r = box.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); };
  box.addEventListener("pointerdown", e => { on = touched = true; box.setPointerCapture(e.pointerId); box.classList.add("drag"); at(e); });
  box.addEventListener("pointermove", e => { if (on) at(e); });
  const end = () => { on = false; box.classList.remove("drag"); };
  box.addEventListener("pointerup", end); box.addEventListener("pointercancel", end);
  h.addEventListener("keydown", e => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { touched = true; set(x + (e.key === "ArrowLeft" ? -5 : 5)); e.preventDefault(); } });
  if (calm || shot) return;
  // подсказка: шторка сама качается при первом показе
  new IntersectionObserver((es, io) => {
    if (!es[0].isIntersecting) return; io.disconnect();
    const t0 = performance.now() + 900;
    const tick = t => {
      if (touched) return;
      const k = (t - t0) / 2600;
      if (k < 0) return requestAnimationFrame(tick);
      if (k > 1) return set(50);
      set(50 + Math.sin(k * Math.PI * 2) * 30 * (1 - k)); requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, { threshold: .5 }).observe(box);
})();

// ---------- кейсы: папки открывают окно ----------
(function folders() {
  const fs = [...document.querySelectorAll(".folder")], cs = [...document.querySelectorAll(".case")], title = document.getElementById("winTitle");
  const names = ["WAKE_UP — 7 дней", "EMPIRE — 5 дней", "С_НУЛЯ — 3 дня"];
  fs.forEach((f, i) => f.addEventListener("click", () => {
    fs.forEach((x, j) => x.classList.toggle("on", i === j)); cs.forEach((x, j) => x.classList.toggle("on", i === j));
    title.textContent = names[i];
  }));
})();

// ---------- объекты можно таскать ----------
(function drag() {
  if (!fine) return;
  document.querySelectorAll("[data-drag]").forEach(el => {
    let sx = 0, sy = 0, dx = 0, dy = 0, lx = 0, on = false;
    el.addEventListener("pointerdown", e => { on = true; el.setPointerCapture(e.pointerId); sx = e.clientX - dx; sy = e.clientY - dy; lx = e.clientX; el.classList.add("grab"); e.preventDefault(); });
    el.addEventListener("pointermove", e => {
      if (!on) return;
      dx = e.clientX - sx; dy = e.clientY - sy;
      el.style.setProperty("--dx", dx + "px"); el.style.setProperty("--dy", dy + "px");
      el.style.setProperty("--tilt", clamp((e.clientX - lx) * .8, -18, 18) + "deg"); lx = e.clientX;
    });
    const end = () => { on = false; el.classList.remove("grab"); el.style.setProperty("--tilt", "0deg"); };
    el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
  });
})();

// ---------- тестовый лист канала ----------
(function sheet() {
  const f = document.getElementById("sheet");
  if (!f) return;
  const boxes = [...f.querySelectorAll(".rows-chk input")], face = document.getElementById("face");
  const hints = ["Light — пока справляетесь сами, нужен план", "Medium — отдаём часть работы команде", "Dark — забираем канал целиком"];
  const faces = ["× ×<br>ᵕ", "• •<br>—", "^ ^<br>◡", "★ ★<br>◡"];
  const verdicts = ["Канал пока живёт на силе воли. Начнём с разбора.", "Фундамент есть. Не хватает системы — её и соберём.", "Почти готовы к запуску. Нужен прогрев и команда.", "Сильная база. Пора масштабировать и запускать."];
  const update = () => {
    const n = boxes.filter(b => b.checked).length, lvl = n <= 1 ? 0 : n === 2 ? 1 : n === 3 ? 2 : 3;
    document.getElementById("scoreDots").textContent = "●".repeat(n) + "○".repeat(4 - n);
    document.getElementById("scoreN").textContent = `${n} / 4`;
    document.getElementById("verdict").textContent = verdicts[lvl];
    face.innerHTML = faces[lvl]; face.classList.remove("pop"); void face.offsetWidth; face.classList.add("pop");
    const r = +f.querySelector("[name=roast]:checked").value;
    document.getElementById("roastHint").textContent = hints[r];
    document.getElementById("sheetBtn").dataset.pick = r === 2 ? "Передать канал под ключ" : n >= 3 ? "Запустить продукт в Telegram" : "Начать с бесплатной консультации";
  };
  f.addEventListener("change", update);
  setTimeout(() => face.classList.remove("pop"), 10);
})();

// ---------- даты и штрихкоды ----------
(function details() {
  const d = new Date().toLocaleDateString("ru-RU");
  ["sheetDate", "rcDate"].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = d; });
  let seed = 7;
  const r = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  document.querySelectorAll(".barcode").forEach(svg => {
    let x = 0, bars = "";
    while (x < 200) { const w = 1 + Math.floor(r() * 4); if (r() > .4) bars += `<rect x="${x}" width="${w}" height="100"/>`; x += w + 1; }
    svg.setAttribute("viewBox", `0 0 ${x} 100`); svg.setAttribute("preserveAspectRatio", "none");
    svg.innerHTML = `<g fill="currentColor">${bars}</g>`;
  });
})();

// ---------- команда канала: было → стало ----------
(function crew() {
  const c = document.querySelector(".crew-canvas");
  if (!c) return;
  const ctx = c.getContext("2d");
  const ROLES = ["Стратегия", "Редактура", "Тексты", "Дизайн", "Продвижение", "Запуски"];
  const tasks = Array.from({ length: 36 }, (_, i) => ({ role: i % 6, x: 0, y: 0, a: Math.random() * 6.28, r: Math.random(), init: false }));
  const stats = [["36", "1", "всё"], ["2", "7", "голос"]];
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
      if (mode) { ctx.setLineDash([2, 6]); ctx.strokeStyle = "rgba(11,11,12,.25)"; N.forEach(n => { ctx.beginPath(); ctx.moveTo(C.x, C.y); ctx.lineTo(n.x, n.y); ctx.stroke(); }); ctx.setLineDash([]); }
      tasks.forEach(k => {
        const o = mode ? N[k.role] : C, sp = mode ? 30 : 74 + Math.sin(time * 3 + k.a) * 10;
        const ang = k.a + time * (mode ? .35 : 1.5) * (k.r > .5 ? 1 : -1);
        const gx = o.x + Math.cos(ang) * sp * (.4 + k.r * .6), gy = o.y + Math.sin(ang) * sp * (.4 + k.r * .6);
        if (!k.init) { k.x = gx; k.y = gy; k.init = true; }
        k.x += (gx - k.x) * (calm ? 1 : .06); k.y += (gy - k.y) * (calm ? 1 : .06);
        ctx.strokeStyle = "rgba(11,11,12,.08)"; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(k.x, k.y); ctx.stroke();
        ctx.fillStyle = "#0b0b0c"; ctx.fillRect(k.x - 2, k.y - 2, 4, 4);
      });
      ctx.font = "600 12px 'Inter Tight', sans-serif"; ctx.textAlign = "center";
      N.forEach((n, i) => {
        ctx.globalAlpha = mode ? 1 : .3;
        ctx.fillStyle = "#fff"; ctx.strokeStyle = "#0b0b0c"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(n.x, n.y, 10, 0, 6.28); ctx.fill(); ctx.stroke(); ctx.lineWidth = 1;
        const label = ROLES[i].toUpperCase(), hw = ctx.measureText(label).width / 2 + 4;
        ctx.fillStyle = "#0b0b0c"; ctx.fillText(label, clamp(n.x, hw, w - hw), n.y + (n.y < h / 2 ? -22 : 30));
      });
      ctx.globalAlpha = 1;
      const R = 24 * you + (mode ? 0 : Math.sin(time * 6) * 2);
      if (!mode) { ctx.strokeStyle = "rgba(11,11,12,.3)"; ctx.beginPath(); ctx.arc(C.x, C.y, R + 12 + Math.sin(time * 6) * 3, 0, 6.28); ctx.stroke(); }
      ctx.fillStyle = "#0b0b0c"; ctx.beginPath(); ctx.arc(C.x, C.y, R, 0, 6.28); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = "700 12px 'Inter Tight', sans-serif"; ctx.fillText("ВЫ", C.x, C.y + 4);
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
      const p = calm ? 1 : clamp(-r.top / (r.height - innerHeight) * 1.1);
      pct.textContent = Math.round(p * 100) + "%";
      const time = t / 1000, gw = Math.min(w * .62, 900), cs = gw / W, gx = w - gw - Math.max(16, w * .04), gy = h * .5 - cs * D / 2 + 10;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      ctx.font = "600 10px 'Inter Tight', sans-serif"; ctx.fillStyle = `rgba(11,11,12,${.5 * p})`;
      ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"].forEach((n, i) => ctx.fillText(n, gx - 26, gy + i * cs + cs / 2 + 4));
      for (const k of cells) {
        const q = clamp((p - k.t) / .3), e = q * q * (3 - 2 * q);
        const cx = k.rx * w + Math.sin(time * .6 + k.ph) * 30, cy = k.ry * h + Math.cos(time * .5 + k.ph) * 30;
        const tx = gx + k.wk * cs + cs / 2, ty = gy + k.d * cs + cs / 2;
        const x = cx + (tx - cx) * e, y = cy + (ty - cy) * e;
        const lvl = e > .9 ? k.lvl : (k.lvl ? 1 : 0);
        const size = 4 + e * (cs * .64 - 4);
        ctx.globalAlpha = lvl ? .4 + e * .6 : .2;
        ctx.fillStyle = lvl === 3 ? "#0b0b0c" : lvl === 2 ? "#7c7c80" : "#d6d6d9";
        if (e > .9 && lvl === 0) { ctx.strokeStyle = "rgba(11,11,12,.14)"; ctx.strokeRect(x - size / 2, y - size / 2, size, size); }
        else ctx.fillRect(x - size / 2, y - size / 2, size, size);
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
    form.innerHTML = `<div class="done"><b>Заявка готова</b><span>Мы скопировали текст — откройте чат и вставьте его.</span><pre>${esc(text)}</pre><a class="pill" href="${CONTACT_TG}" target="_blank" rel="noopener">Открыть Telegram ↗</a></div>`;
  });
})();
