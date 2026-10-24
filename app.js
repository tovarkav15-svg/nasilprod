// Куда уходит заявка: пока backend нет — копируем текст и открываем Telegram
const CONTACT_TG = "https://t.me/lfbutov";
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// ---------- прелоадер: считает до 100 и ждёт 3D-сцену ----------
(function loader() {
  const el = document.getElementById("loader"), num = document.getElementById("ldNum"), bar = document.getElementById("ldBar");
  if (!el) return;
  let glReady = false, done = false;
  const t0 = performance.now(), min = calm ? 0 : 1600;
  document.addEventListener("gl-ready", () => { glReady = true; });
  setTimeout(() => { glReady = true; }, 5000); // если WebGL не поднялся — не держим человека
  const tick = now => {
    const k = clamp((now - t0) / min);
    const v = Math.floor((glReady ? k : Math.min(k, .9)) * 100);
    num.textContent = String(v).padStart(3, "0");
    bar.style.width = v + "%";
    if (v >= 100 && !done) { done = true; el.classList.add("out"); document.documentElement.classList.add("loaded"); setTimeout(() => el.remove(), 1200); return; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();

// ---------- меню ----------
const overlay = document.getElementById("overlay"), menuBtn = document.getElementById("menuBtn");
function setMenu(open) {
  overlay.classList.toggle("open", open);
  overlay.setAttribute("aria-hidden", !open);
  menuBtn.setAttribute("aria-expanded", open);
  menuBtn.textContent = open ? "Закрыть" : "Меню";
}
menuBtn.addEventListener("click", () => setMenu(!overlay.classList.contains("open")));
overlay.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setMenu(false)));
addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

// ---------- курсор и «липкие» кнопки ----------
if (fine && !calm) {
  const cur = document.getElementById("cursor");
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  addEventListener("pointermove", e => { x = e.clientX; y = e.clientY; cur.classList.add("on"); });
  document.addEventListener("pointerleave", () => cur.classList.remove("on"));
  const follow = () => { cx += (x - cx) * .2; cy += (y - cy) * .2; cur.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(follow); };
  follow();
  document.querySelectorAll("a, button, summary, .drum-stage").forEach(el => {
    el.addEventListener("pointerenter", () => cur.classList.add("big"));
    el.addEventListener("pointerleave", () => cur.classList.remove("big"));
  });
  document.querySelectorAll(".magnet").forEach(el => {
    el.addEventListener("pointermove", e => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .3}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  });
  // наклон карточек
  document.querySelectorAll(".tilt").forEach(g => {
    g.addEventListener("pointermove", e => {
      const r = g.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      g.style.setProperty("--ty", `${px * 14}deg`); g.style.setProperty("--tx", `${-py * 14}deg`);
      g.style.setProperty("--gx", `${(px + .5) * 100}%`); g.style.setProperty("--gy", `${(py + .5) * 100}%`);
    });
    g.addEventListener("pointerleave", () => { g.style.setProperty("--tx", "0deg"); g.style.setProperty("--ty", "0deg"); });
  });
  // голографические карты команды
  document.querySelectorAll(".holo").forEach(h => {
    h.addEventListener("pointermove", e => {
      const r = h.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      h.style.setProperty("--ry", `${(px - .5) * 22}deg`); h.style.setProperty("--rx", `${(.5 - py) * 22}deg`);
      h.style.setProperty("--px", `${px * 100}%`); h.style.setProperty("--py", `${py * 100}%`);
    });
    h.addEventListener("pointerleave", () => { h.style.setProperty("--ry", "0deg"); h.style.setProperty("--rx", "0deg"); });
  });
}

// ---------- сцены, привязанные к прокрутке ----------
const vidCard = document.getElementById("vidCard");
const symStack = document.querySelector(".sym-stack");
const hz = document.getElementById("work"), hzTrack = document.getElementById("hzTrack"), hzBar = document.getElementById("hzBar"), hzNow = document.getElementById("hzNow");
const reveal = new Set(document.querySelectorAll(".mf-text, .sym-head, .crew-head, .cases-head, .team-head, .formats-head, .faq-head, .tiers, .faq-list, .contact-in, .holos"));
reveal.forEach(el => el.classList.add("rv"));

function onScroll() {
  const H = innerHeight;
  // видео встаёт из наклона
  if (vidCard) {
    const r = vidCard.getBoundingClientRect(), p = calm ? 1 : clamp((H - r.top) / (H * .9));
    vidCard.style.setProperty("--p", p);
  }
  // симптомы раскладываются в глубину
  if (symStack) {
    const r = symStack.getBoundingClientRect(), p = calm ? 1 : clamp((H * .95 - r.top) / (H * .7));
    symStack.style.setProperty("--p", p);
  }
  // горизонтальный процесс
  if (hz && hzTrack) {
    const r = hz.getBoundingClientRect();
    const pinned = getComputedStyle(hz.firstElementChild).position === "sticky";
    const p = pinned ? clamp(-r.top / (r.height - H)) : 0;
    const max = Math.max(0, hzTrack.scrollWidth - hzTrack.parentElement.clientWidth);
    hzTrack.style.transform = pinned ? `translate3d(${-p * max}px,0,0)` : "";
    hzBar.style.width = (pinned ? p * 100 : 100) + "%";
    hzNow.textContent = "0" + Math.min(4, 1 + Math.floor(p * 3.999));
  }
  for (const el of reveal) {
    const r = el.getBoundingClientRect();
    if (r.top < H * .9 && r.bottom > 0) { el.classList.add("in"); reveal.delete(el); }
  }
}
addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", onScroll);
addEventListener("load", onScroll);
onScroll();

// ---------- видео ----------
if (vidCard) {
  const v = vidCard.querySelector("video");
  vidCard.querySelector(".vid-play").addEventListener("click", () => { v.controls = true; v.play(); vidCard.classList.add("playing"); });
  v.addEventListener("ended", () => vidCard.classList.remove("playing"));
}

// ---------- барабан ролей: крутится сам, можно тянуть ----------
(function drum() {
  const stage = document.getElementById("drumStage"), d = document.getElementById("drum");
  if (!stage || !d) return;
  let ang = 0, vel = calm ? 0 : .12, drag = false, lx = 0;
  stage.addEventListener("pointerdown", e => { drag = true; lx = e.clientX; stage.setPointerCapture(e.pointerId); stage.classList.add("drag"); });
  stage.addEventListener("pointermove", e => { if (!drag) return; const dx = e.clientX - lx; lx = e.clientX; ang += dx * .35; vel = dx * .35; });
  const up = () => { drag = false; stage.classList.remove("drag"); };
  stage.addEventListener("pointerup", up); stage.addEventListener("pointercancel", up);
  const loop = () => {
    if (!drag) { vel += ((calm ? 0 : .12) - vel) * .02; ang += vel; }
    d.style.transform = `translateZ(calc(var(--r) * -1)) rotateY(${ang}deg)`;
    // ближняя грань светлее
    const front = ((Math.round(-ang / 60) % 6) + 6) % 6;
    d.querySelectorAll(".face").forEach((f, i) => f.classList.toggle("front", i === front));
    requestAnimationFrame(loop);
  };
  loop();
})();

// ---------- кейсы: coverflow ----------
(function flow() {
  const cards = [...document.querySelectorAll(".fcard")], idx = document.getElementById("flowIdx");
  if (!cards.length) return;
  let cur = 0;
  const show = i => {
    cur = (i + cards.length) % cards.length;
    cards.forEach((c, k) => {
      let o = k - cur; if (o > 1) o -= cards.length; if (o < -1) o += cards.length;
      c.style.setProperty("--o", o);
      c.classList.toggle("on", o === 0);
    });
    idx.textContent = `0${cur + 1} / 0${cards.length}`;
  };
  document.getElementById("flowPrev").addEventListener("click", () => show(cur - 1));
  document.getElementById("flowNext").addEventListener("click", () => show(cur + 1));
  cards.forEach((c, k) => c.addEventListener("click", () => { if (k !== cur) show(k); }));
  let sx = null;
  const flowEl = document.getElementById("flow");
  flowEl.addEventListener("pointerdown", e => { sx = e.clientX; });
  flowEl.addEventListener("pointerup", e => { if (sx !== null && Math.abs(e.clientX - sx) > 50) show(cur + (e.clientX < sx ? 1 : -1)); sx = null; });
  show(0);
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
    form.innerHTML = `<div class="cform-done"><b>Заявка готова.</b><p class="cform-note">Мы скопировали текст — откройте чат и вставьте его.</p><pre>${esc(text)}</pre><a class="btn" href="${CONTACT_TG}" target="_blank" rel="noopener">Открыть Telegram ↗</a></div>`;
  });
})();
