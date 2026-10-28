// Куда уходит заявка: пока backend нет — копируем текст и открываем Telegram
const CONTACT_TG = "https://t.me/lfbutov";
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- белая вуаль на входе: ждёт 3D-сцену, но не дольше 3 секунд ----------
(function veil() {
  const v = document.getElementById("veil");
  if (!v) return;
  let gone = false;
  const lift = () => {
    if (gone) return; gone = true;
    v.classList.add("out"); document.documentElement.classList.add("loaded");
    setTimeout(() => v.remove(), 1400);
  };
  const t0 = performance.now();
  document.addEventListener("gl-ready", () => setTimeout(lift, Math.max(0, (calm ? 0 : 900) - (performance.now() - t0))));
  setTimeout(lift, 3000);
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

// ---------- мягкое появление ----------
const pending = new Set(document.querySelectorAll(".ch-head, .statement, .cols, .film-frame, .title, .triad, .aside, .role-list, .plate-img, .ledger .entry, .steps, .portrait, .tiers, .faq-list, .cform"));
pending.forEach(el => el.classList.add("rv"));
function sweep() {
  const h = innerHeight;
  for (const el of pending) {
    const r = el.getBoundingClientRect();
    if (r.top < h * .9 && r.bottom > 0) { el.classList.add("in"); pending.delete(el); }
  }
  // фото-пластина чуть «дышит» при прокрутке
  const plate = document.querySelector(".plate-img img");
  if (plate && !calm) {
    const r = plate.parentElement.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (h - r.top) / (h + r.height)));
    plate.style.transform = `scale(${1.12 - p * .12}) translateY(${(p - .5) * -30}px)`;
  }
}
addEventListener("scroll", sweep, { passive: true });
addEventListener("resize", sweep);
addEventListener("load", sweep);
sweep();

// ---------- видео ----------
(function film() {
  const box = document.getElementById("film");
  if (!box) return;
  const v = box.querySelector("video");
  box.querySelector(".film-play").addEventListener("click", () => { v.controls = true; v.play(); box.classList.add("playing"); });
  v.addEventListener("ended", () => box.classList.remove("playing"));
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
    form.innerHTML = `<div class="done"><h3>Заявка готова.</h3><p class="note">Мы скопировали текст — откройте чат и вставьте его.</p><pre>${esc(text)}</pre><a class="btn" href="${CONTACT_TG}" target="_blank" rel="noopener">Открыть Telegram</a></div>`;
  });
})();
