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
nav.querySelectorAll(".nav-links a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));

// появление при скролле
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.1 });
document.querySelectorAll(".label, .h, .lead, .row, .verdict, .case, .steps li, .person, .fmt, .faq details, .quiz, .video, .foot-print").forEach(el => {
  el.classList.add("rv");
  if (el.getBoundingClientRect().top < innerHeight) requestAnimationFrame(() => el.classList.add("in"));
  else io.observe(el);
});

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
