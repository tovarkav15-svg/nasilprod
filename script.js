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

// ---------- появление и счётчики ----------
const pending = new Set(document.querySelectorAll(".head, .grid3, .test-grid, .band, .stair-wrap, .chat-wrap, .brief-wrap, .angel-text, .foot-cta"));
pending.forEach(el => el.classList.add("rv"));
const counters = new Set(document.querySelectorAll("[data-count]"));
const fmt = n => n.toLocaleString("ru-RU");
function runCounter(el) {
  const to = +el.dataset.count, t0 = performance.now(), dur = 2000;
  const tick = now => {
    const k = clamp((now - t0) / dur);
    el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - k, 4))));
    if (k < 1) requestAnimationFrame(tick);
  };
  el.textContent = "0";
  requestAnimationFrame(tick);
}
function sweep() {
  const h = innerHeight;
  for (const el of pending) {
    const r = el.getBoundingClientRect();
    if (r.top < h * .92 && r.bottom > 0) { el.classList.add("in"); pending.delete(el); }
  }
  for (const el of counters) {
    const r = el.getBoundingClientRect();
    if (r.top < h * .85 && r.bottom > 0) { counters.delete(el); if (!calm) runCounter(el); }
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

// ---------- сцены, привязанные к прокрутке ----------
const progress = sec => { const r = sec.getBoundingClientRect(); return clamp(-r.top / (r.height - innerHeight)); };
const strip = document.querySelector(".strip");
const lines = [...strip.querySelectorAll(".strip-line")];
const portal = document.querySelector(".portal");
const frame = portal.querySelector(".portal-frame");

function scrollFx() {
  // манифест: строки едут навстречу
  const p = calm ? .5 : progress(strip);
  lines.forEach((l, i) => {
    const extra = Math.max(0, l.scrollWidth - innerWidth);
    const x = i === 0 ? -p * extra : -(1 - p) * extra;
    l.style.transform = `translateX(${x}px)`;
  });
  // видео: портал раскрывается
  const v = calm ? 1 : clamp(progress(portal) / .7);
  frame.style.setProperty("--p", v);
  portal.style.setProperty("--to", clamp(1 - v * 2.2));
  sweep();
}
addEventListener("scroll", scrollFx, { passive: true });
addEventListener("resize", scrollFx);
addEventListener("load", scrollFx);
scrollFx();

// ---------- видео ----------
const video = frame.querySelector("video");
frame.querySelector(".play").addEventListener("click", () => {
  video.controls = true;
  video.play();
  frame.classList.add("playing");
});
video.addEventListener("pause", () => { if (video.ended) frame.classList.remove("playing"); });

// ---------- тест с циферблатом ----------
const boxes = [...document.querySelectorAll(".tq input")];
const verdicts = ["Отметьте, что совпадает", "Один звоночек. Система уже нужна.", "Канал зависит от вас. Проблема не в дисциплине — нужна система и команда.", "Всё держится на вас. Пора передать операционку."];
function gauge() {
  const n = boxes.filter(b => b.checked).length;
  document.getElementById("gCount").textContent = n;
  document.getElementById("gText").textContent = verdicts[n];
  document.getElementById("dialFg").style.strokeDashoffset = 100 - n * 33.34;
  document.getElementById("needle").style.transform = `rotate(${-90 + n * 60}deg)`;
}
boxes.forEach(b => b.addEventListener("change", gauge));

// ---------- вопросы в чате ----------
const chat = document.getElementById("chat");
const say = (cls, html) => { const m = document.createElement("div"); m.className = `msg ${cls}`; m.innerHTML = html; chat.appendChild(m); chat.scrollTop = chat.scrollHeight; return m; };
let busy = false;
document.querySelectorAll(".qc").forEach(q => q.addEventListener("click", () => {
  if (busy) return;
  busy = true;
  q.classList.add("used");
  say("out", q.textContent);
  const t = say("in typing", "<i></i><i></i><i></i>");
  setTimeout(() => { t.remove(); say("in", q.dataset.a); busy = false; }, calm ? 0 : 1000);
}));

// ---------- стекло наклоняется за курсором ----------
document.querySelectorAll(".tilt").forEach(g => {
  g.addEventListener("pointermove", e => {
    if (calm || e.pointerType !== "mouse") return;
    const r = g.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    g.style.setProperty("--ty", `${x * 12}deg`); g.style.setProperty("--tx", `${-y * 12}deg`);
  });
  g.addEventListener("pointerleave", () => { g.style.setProperty("--tx", "0deg"); g.style.setProperty("--ty", "0deg"); });
});

// ---------- анкета ----------
const STEPS = [
  { k: "Задача", t: "Что хотите получить от Telegram?", h: "Выберите сценарий, который ближе всего к вашей ситуации.",
    o: ["Запустить продукт в Telegram", "Передать канал под ключ", "Вырастить аудиторию и продажи", "Начать с бесплатной консультации"] },
  { k: "Стадия", t: "Сколько людей уже читают канал?", h: "Если каналов несколько — укажите основной.",
    o: ["Канала ещё нет", "До 1 000 подписчиков", "1–5 тысяч", "5–20 тысяч", "Больше 20 тысяч"] },
  { k: "Ниша", t: "В какой нише работаете?", h: "Нам важно понять продукт и будущую аудиторию.",
    o: ["Образование / экспертность", "Бизнес / консалтинг", "Блог / медиа", "Агентство / услуги", "Другое"] },
  { k: "Продукт", t: "На какой стадии продукт?", h: "Не страшно, если пока есть только идея — это тоже точка входа.",
    o: ["Уже продаём", "Продукт есть, запусков не было", "Сейчас собираем продукт", "Пока только идея"] },
  { k: "Результат", t: "Какой результат сейчас главный?", h: "Выберите один приоритет — остальное обсудим на созвоне.",
    o: ["Запуск от 500 000 ₽", "Системные продажи из канала", "Рост сильной аудитории", "Полностью снять операционку", "Другое"] },
  { k: "Масштаб", t: "Какой бюджет готовы вложить?", h: "Это помогает сразу предложить реалистичный формат работы.",
    o: ["До 100 000 ₽", "100–300 тысяч ₽", "300–500 тысяч ₽", "От 500 000 ₽", "Сначала нужна оценка"] },
  { k: "Контакт", t: "Куда прислать разбор?", h: "Только имя и Telegram — без телефона и длинных комментариев.", contact: true },
];
const answers = {};
let step = 0;
const qBody = document.getElementById("qBody");
const qStep = document.getElementById("qStep");
const qBar = document.getElementById("qBar");
const qBack = document.getElementById("qBack");
const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function render() {
  const s = STEPS[step];
  qStep.textContent = `${step + 1} / ${STEPS.length}`;
  qBar.style.width = `${((step + 1) / STEPS.length) * 100}%`;
  qBack.hidden = step === 0;
  let html = `<h3 class="q-title">${s.t}</h3><p class="q-hint">${s.h}</p>`;
  if (s.contact) {
    const c = answers.contact || {};
    html += `<form class="fields" id="qForm">
      <label>Как вас зовут<input class="field" name="name" required value="${esc(c.name || "")}"></label>
      <label>Telegram<input class="field" name="tg" required placeholder="@username" value="${esc(c.tg || "")}"></label>
      <label>Ваш сайт или канал (необязательно)<input class="field" name="site" value="${esc(c.site || "")}"></label>
      <button class="btn" type="submit">Отправить заявку →</button></form>`;
  } else {
    html += `<div class="opts">${s.o.map((o, i) =>
      `<button class="opt${answers[s.k] === o ? " on" : ""}" data-v="${esc(o)}"><span>${String(i + 1).padStart(2, "0")}</span>${o}</button>`).join("")}</div>
      <form class="own" id="qOwn"><input class="field" placeholder="Напишите свой вариант"><button type="submit">→</button></form>`;
  }
  qBody.innerHTML = html;
  qBody.querySelectorAll(".opt").forEach(b => b.addEventListener("click", () => pick(b.dataset.v)));
  const own = document.getElementById("qOwn");
  if (own) own.addEventListener("submit", e => { e.preventDefault(); const v = own.querySelector("input").value.trim(); if (v) pick(v); });
  const form = document.getElementById("qForm");
  if (form) form.addEventListener("submit", e => { e.preventDefault(); submit(Object.fromEntries(new FormData(form))); });
}
function pick(v) { answers[STEPS[step].k] = v; step++; render(); }
qBack.addEventListener("click", () => { if (step > 0) { step--; render(); } });

function submit(c) {
  answers.contact = c;
  const text = ["Заявка с сайта Агентства Нас#лия", "",
    ...STEPS.filter(s => !s.contact).map(s => `${s.k}: ${answers[s.k] || "—"}`),
    "", `Имя: ${c.name}`, `Telegram: ${c.tg}`, c.site ? `Сайт: ${c.site}` : ""].filter(Boolean).join("\n");
  navigator.clipboard?.writeText(text).catch(() => {});
  qStep.textContent = "Готово";
  qBack.hidden = true;
  qBody.innerHTML = `<div class="done"><h3 class="q-title">Ответы собраны.</h3>
    <p class="q-hint">Мы скопировали анкету — отправьте её нам в Telegram, и мы вернёмся с разбором.</p>
    <pre>${esc(text)}</pre>
    <a class="btn" href="${CONTACT_TG}" target="_blank" rel="noopener">Отправить в Telegram</a></div>`;
}

// кнопки «Обсудить» в форматах предзаполняют первый шаг
document.querySelectorAll("[data-pick]").forEach(a => a.addEventListener("click", () => {
  step = 0; answers[STEPS[0].k] = a.dataset.pick; step = 1; render();
}));

render();
