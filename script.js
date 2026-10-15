// Куда уходит заявка: пока backend нет — копируем текст и открываем Telegram
const CONTACT_TG = "https://t.me/lfbutov";

const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("solid", scrollY > 40);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

const burger = nav.querySelector(".burger");
burger.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  burger.setAttribute("aria-expanded", open);
});
nav.querySelectorAll(".menu a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));

// появление при скролле: проверяем позицию, без зависимости от IntersectionObserver
const pending = new Set(document.querySelectorAll(".label, .h, .lead, .verdict, .y-head, .glass-row, .discs, .person, .fmt, .faq details, .quiz, .video, .foot-print, .calm"));
pending.forEach(el => el.classList.add("rv"));
function sweep() {
  for (const el of pending) {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight * .92 && r.bottom > 0) { el.classList.add("in"); pending.delete(el); }
  }
}
addEventListener("scroll", sweep, { passive: true });
addEventListener("resize", sweep);
addEventListener("load", sweep);
setTimeout(sweep, 60);

// анкета
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
  const text = ["Заявка с сайта Агентства Нас✠лия", "",
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

// кнопки «Обсудить» в дверях предзаполняют первый шаг
document.querySelectorAll("[data-pick]").forEach(a => a.addEventListener("click", () => {
  step = 0; answers[STEPS[0].k] = a.dataset.pick; step = 1; render();
}));

render();

// ---------- ангельская анимация ----------
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// перо: стержень + два опахала, в координатах длины 1
const FEATHER = (() => {
  const p = new Path2D();
  p.moveTo(0, -.5);
  p.bezierCurveTo(-.3, -.32, -.3, .18, -.03, .4);
  p.lineTo(0, .5);
  p.lineTo(.02, .4);
  p.bezierCurveTo(.25, .2, .27, -.3, 0, -.5);
  return p;
})();

function feathers(canvas) {
  const ctx = canvas.getContext("2d");
  const n = +canvas.dataset.n || 12;
  let w, h, dpr, list = [], running = false, last = 0;
  const spawn = (top) => {
    const z = .35 + Math.random() * .65;
    return { x: Math.random() * w, y: top ? -80 : Math.random() * h, z,
      size: (40 + Math.random() * 60) * z * (w < 640 ? .75 : 1),
      speed: (14 + Math.random() * 16) * z, amp: 30 + Math.random() * 60,
      f: .25 + Math.random() * .35, ph: Math.random() * 6.28, tilt: Math.random() - .5 };
  };
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    if (!list.length) list = Array.from({ length: n }, () => spawn(false));
  };
  const draw = (t) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (const f of list) {
      const s = t * f.f + f.ph;
      const x = f.x + Math.sin(s) * f.amp;
      const rot = Math.sin(s + 1.57) * .55 + f.tilt;
      const flip = .55 + .45 * Math.abs(Math.cos(s * .7));
      ctx.save();
      ctx.translate(x, f.y);
      ctx.rotate(rot);
      ctx.scale(f.size * flip, f.size);
      ctx.globalAlpha = .45 + f.z * .5;
      ctx.shadowColor = "rgba(58,58,58,.12)";
      ctx.shadowBlur = 10 * f.z;
      ctx.fillStyle = "#fff";
      ctx.fill(FEATHER);
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1.2 / f.size;
      ctx.strokeStyle = "rgba(138,138,138,.35)";
      ctx.beginPath(); ctx.moveTo(0, -.48); ctx.quadraticCurveTo(.02, 0, 0, .5); ctx.stroke();
      ctx.strokeStyle = "rgba(138,138,138,.12)";
      for (let i = -.36; i < .34; i += .07) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(-.24, i - .09); ctx.moveTo(0, i); ctx.lineTo(.2, i - .09); ctx.stroke();
      }
      ctx.restore();
    }
  };
  const loop = (now) => {
    if (!running) return;
    const dt = Math.min(.05, (now - last) / 1000 || 0); last = now;
    for (const f of list) {
      f.y += f.speed * dt;
      if (f.y > h + 80) Object.assign(f, spawn(true));
    }
    draw(now / 1000);
    requestAnimationFrame(loop);
  };
  resize();
  new ResizeObserver(resize).observe(canvas);
  if (calm) { draw(0); return; }
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running) { running = true; last = performance.now(); requestAnimationFrame(loop); }
    else if (!e.isIntersecting) running = false;
  }).observe(canvas);
}
document.querySelectorAll("canvas.feathers").forEach(feathers);

// свет под курсором
document.querySelectorAll(".hero, .fmt").forEach(el => el.addEventListener("pointermove", e => {
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
}));

// слова проступают из света
const words = document.querySelector(".words");
words.innerHTML = words.textContent.split(" ").map(w => `<span class="w">${w}</span>`).join(" ");
const wordEls = [...words.querySelectorAll(".w")];
const ascend = document.querySelector(".ascend");
const ring = ascend.querySelector(".ring");

// фраза растворяется вверх, как перо
const hushTitle = document.querySelector(".dissolve");
hushTitle.innerHTML = hushTitle.textContent.split(" ").map(w =>
  `<span style="display:inline-block;white-space:nowrap">${[...w].map(c => `<span class="c" data-r="${Math.random().toFixed(3)}">${c}</span>`).join("")}</span>`
).join(" ");
const chars = [...hushTitle.querySelectorAll(".c")].map(el => ({ el, r: +el.dataset.r }));
const hush = document.querySelector(".hush");

const progress = (sec) => {
  const r = sec.getBoundingClientRect();
  return clamp(-r.top / (r.height - innerHeight));
};
function onScrollFx() {
  const p = progress(ascend);
  wordEls.forEach((w, i) => w.classList.toggle("on", calm || i / wordEls.length < p * 1.25));
  ring.style.setProperty("--rs", .55 + p * .7);
  ring.style.setProperty("--ro", .25 + p * .75);

  const q = calm ? 0 : progress(hush);
  for (const { el, r } of chars) {
    const k = clamp((q - .2 - r * .45) / .3);
    el.style.transform = k ? `translateY(${-k * 140}px) rotate(${(r - .5) * 40 * k}deg)` : "";
    el.style.opacity = 1 - k;
    el.style.filter = k ? `blur(${k * 10}px)` : "";
  }
}
addEventListener("scroll", onScrollFx, { passive: true });

// стеклянные карточки наклоняются за курсором
document.querySelectorAll(".glass").forEach(g => {
  g.addEventListener("pointermove", e => {
    if (calm || e.pointerType !== "mouse") return;
    const r = g.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    g.style.setProperty("--ty", `${x * 14}deg`);
    g.style.setProperty("--tx", `${-y * 14}deg`);
    g.style.setProperty("--sx", `${(1 - (x + .5)) * 100}%`);
  });
  g.addEventListener("pointerleave", () => { g.style.setProperty("--tx", "0deg"); g.style.setProperty("--ty", "0deg"); });
});

// окна кейсов можно перетаскивать (на широких экранах)
let zTop = 5;
document.querySelectorAll(".win").forEach(win => {
  const bar = win.querySelector(".win-bar");
  win.addEventListener("pointerdown", () => { win.style.zIndex = ++zTop; });
  bar.addEventListener("pointerdown", e => {
    if (innerWidth <= 900) return;
    e.preventDefault();
    bar.setPointerCapture(e.pointerId);
    const sx = e.clientX, sy = e.clientY, ox = win.offsetLeft, oy = win.offsetTop;
    const desk = win.parentElement;
    win.classList.add("drag");
    const move = ev => {
      const x = clamp(ox + ev.clientX - sx, -40, desk.clientWidth - win.offsetWidth + 40);
      const y = clamp(oy + ev.clientY - sy, -40, desk.clientHeight - 60);
      win.style.left = `${x}px`; win.style.top = `${y}px`;
    };
    const up = () => { win.classList.remove("drag"); bar.removeEventListener("pointermove", move); bar.removeEventListener("pointerup", up); };
    bar.addEventListener("pointermove", move);
    bar.addEventListener("pointerup", up);
  });
});
onScrollFx();

// счётчики
const fmt = n => n.toLocaleString("ru-RU");
const counter = new IntersectionObserver(entries => entries.forEach(e => {
  if (!e.isIntersecting) return;
  counter.unobserve(e.target);
  const el = e.target, to = +el.dataset.count, t0 = performance.now(), dur = 2200;
  if (calm) { el.textContent = fmt(to); return; }
  const tick = now => {
    const k = clamp((now - t0) / dur), ease = 1 - Math.pow(1 - k, 4);
    el.textContent = fmt(Math.round(to * ease));
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}), { threshold: .5 });
document.querySelectorAll("[data-count]").forEach(el => counter.observe(el));
