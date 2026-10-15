/* ============================================================
   GLOBO ADS — THE STORY (portfolio edition)
   Standalone scrollytelling page. No password gate and no links
   back to the internal Radar. Content comes from
   dados/historia-en.json. Shares the historia.css styling.
   ============================================================ */

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}
function fmt(s) { return esc(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>"); }

/* readable labels for the business tracks */
const TRACK = { GAA: "Enterprise", PME: "SMB" };

async function loadStory() {
  const res = await fetch("dados/historia-en.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load dados/historia-en.json");
  return res.json();
}

/* ---------- media blocks ---------- */
function mediaHTML(m, alt) {
  if (!m) return "";
  if (m.tipo === "video") {
    return `<div class="hx-media-frame">
      <video controls preload="none" playsinline${m.poster ? ` poster="${esc(m.poster)}"` : ""}>
        <source src="${esc(m.src)}" type="video/mp4">
      </video></div>`;
  }
  const isGif = /\.gif(\?|$)/i.test(m.src || "");
  return `<div class="hx-media-frame${isGif ? " is-gif" : ""}">
    <img src="${esc(m.src)}" alt="${esc(alt || "")}" loading="lazy"></div>`;
}

/* ---------- sections ---------- */
/* Opening: 3D logo animation (iframe) scrubbed by scroll. */
const MOTION_END = 11.0; // animation timeline length (seconds)
function renderOpening() {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const t = reduce ? MOTION_END : 0;
  return `
    <section class="hx-opening${reduce ? " is-static" : ""}" id="hx-opening">
      <div class="hx-opening-pin">
        <iframe class="hx-motion" id="hx-motion" title="Globo Ads" tabindex="-1"
          src="assets/globo-ads-logo-motion.html?t=${t}&amp;look=marinho"></iframe>
        <div class="hx-opening-veil" aria-hidden="true"></div>
        <div class="hx-opening-hint" aria-hidden="true">
          <span>Scroll to play</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
        </div>
      </div>
    </section>`;
}

/* Ties scroll progress to the animation's __seek + transition veil. */
function setupOpening() {
  const sec = document.getElementById("hx-opening");
  const frame = document.getElementById("hx-motion");
  if (!sec || !frame) return;
  const veil = sec.querySelector(".hx-opening-veil");
  const hint = sec.querySelector(".hx-opening-hint");
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    if (veil) veil.style.opacity = 0;
    const navTheme = () => document.body.classList.toggle("hx-nav-light", window.scrollY < sec.offsetHeight - window.innerHeight * 0.5);
    window.addEventListener("scroll", navTheme, { passive: true });
    navTheme();
    return;
  }

  const SCRUB_END = 0.9;
  let seek = null, pending = false, lastT = -1;
  function grabSeek() {
    if (seek) return true;
    try { if (frame.contentWindow && frame.contentWindow.__seek) { seek = frame.contentWindow.__seek; lastT = -1; return true; } } catch (e) {}
    return false;
  }
  frame.addEventListener("load", () => { grabSeek(); update(); });
  (function waitSeek() { if (grabSeek()) { update(); return; } requestAnimationFrame(waitSeek); })();

  function progress() {
    const total = sec.offsetHeight - window.innerHeight;
    return total > 0 ? Math.min(Math.max(window.scrollY - sec.offsetTop, 0) / total, 1) : 0;
  }
  function update() {
    pending = false;
    const p = progress();
    if (seek || grabSeek()) {
      const tt = Math.min(p / SCRUB_END, 1) * MOTION_END;
      if (Math.abs(tt - lastT) > 0.004) { try { seek(tt); } catch (e) {} lastT = tt; }
    }
    if (veil) veil.style.opacity = Math.max(0, (p - SCRUB_END) / (1 - SCRUB_END)).toFixed(3);
    if (hint) hint.style.opacity = Math.max(0, 1 - p * 8).toFixed(3);
    document.body.classList.toggle("hx-nav-light", p > 0.74 && p < 0.94);
  }
  function onScroll() { if (!pending) { pending = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
}

/* Header: official logo, no links (portfolio edition). */
function renderNav() {
  return `
    <header class="hx-nav">
      <div class="hx-nav-inner">
        <span class="hx-nav-logo" aria-label="Globo Ads">
          <img class="hx-nav-logo-img" src="assets/globoads.png" alt="Globo Ads">
        </span>
      </div>
    </header>`;
}

function renderHero(h) {
  return `
    <section class="hx-hero">
      <div class="hx-hero-glow" aria-hidden="true"></div>
      <div class="hx-hero-inner">
        <div class="hx-kicker" data-reveal>${esc(h.kicker)}</div>
        <h1 class="hx-hero-title" data-reveal>${esc(h.titulo)}</h1>
        <p class="hx-hero-sub" data-reveal>${esc(h.subtitulo)}</p>
      </div>
      <div class="hx-scroll-hint" data-reveal aria-hidden="true">
        <span>${esc(h.scrollHint || "Scroll")}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
      </div>
    </section>`;
}

function renderManifesto(txt) {
  if (!txt) return "";
  return `<section class="hx-manifesto"><p class="hx-manifesto-text" data-reveal>${fmt(txt)}</p></section>`;
}

function renderCapitulo(c, idx) {
  const tops = (c.topicos || []).map((t, i) =>
    `<li data-reveal style="--i:${i}"><span class="hx-dot"></span>${esc(t)}</li>`
  ).join("");
  return `
    <section class="hx-chapter${idx % 2 ? " alt" : ""}" id="cap-${esc(c.id)}">
      <div class="hx-chapter-grid">
        <div class="hx-chapter-copy">
          <div class="hx-chapter-date" data-reveal>${esc(c.data)}</div>
          ${c.eyebrow ? `<div class="hx-eyebrow" data-reveal>${esc(c.eyebrow)}</div>` : ""}
          <h2 class="hx-chapter-title" data-reveal>${esc(c.titulo)}</h2>
          <p class="hx-chapter-resumo" data-reveal>${fmt(c.resumo)}</p>
          ${tops ? `<ul class="hx-chapter-list" data-reveal-group>${tops}</ul>` : ""}
        </div>
        <div class="hx-chapter-media" data-reveal>${mediaHTML(c.media, c.titulo)}</div>
      </div>
    </section>`;
}

function renderEra(era) {
  const itens = (era.itens || []).map((it) => {
    const img = it.imagem ? `<div class="hx-item-thumb" data-reveal><img src="${esc(it.imagem)}" alt="${esc(it.titulo)}" loading="lazy"></div>` : "";
    const trilha = it.trilha && it.trilha !== "Marco"
      ? `<span class="hx-chip ${it.trilha === "PME" ? "pme" : "gaa"}">${esc(TRACK[it.trilha] || it.trilha)}</span>` : "";
    return `
      <div class="hx-item${it.destaque ? " destaque" : ""}" data-reveal>
        <div class="hx-item-node"><span class="hx-node-dot"></span></div>
        <div class="hx-item-body">
          <div class="hx-item-head">
            <span class="hx-item-period">${esc(it.periodo)}</span>${trilha}
            ${it.destaque ? `<span class="hx-chip marco">Milestone</span>` : ""}
          </div>
          <h4 class="hx-item-title">${esc(it.titulo)}</h4>
          <p class="hx-item-desc">${fmt(it.desc || "")}</p>
          ${img}
        </div>
      </div>`;
  }).join("");
  return `
    <div class="hx-era">
      <div class="hx-era-label">
        <div class="hx-era-sticky">
          <div class="hx-era-year" data-reveal>${esc(era.ano)}</div>
          <h3 class="hx-era-title" data-reveal>${esc(era.titulo)}</h3>
          ${era.resumo ? `<p class="hx-era-resumo" data-reveal>${esc(era.resumo)}</p>` : ""}
        </div>
      </div>
      <div class="hx-era-items">${itens}</div>
    </div>`;
}

function renderTimeline(eras) {
  const eHTML = (eras || []).map(renderEra).join("");
  return `
    <section class="hx-timeline">
      <div class="hx-tl-head">
        <div class="hx-eyebrow" data-reveal>The timeline</div>
        <h2 class="hx-tl-title" data-reveal>How we got here</h2>
      </div>
      <div class="hx-tl-body">
        <div class="hx-spine" aria-hidden="true"><div class="hx-spine-fill"></div></div>
        ${eHTML}
      </div>
    </section>`;
}

function renderFechamento(f) {
  if (!f) return "";
  return `
    <section class="hx-close">
      <div class="hx-close-glow" aria-hidden="true"></div>
      <div class="hx-close-inner">
        ${f.kicker ? `<div class="hx-kicker" data-reveal>${esc(f.kicker)}</div>` : ""}
        <h2 class="hx-close-title" data-reveal>${esc(f.titulo)}</h2>
      </div>
      <div class="hx-spectrum" aria-hidden="true"></div>
    </section>`;
}

/* ---------- scroll animations ---------- */
function setupReveal() {
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const targets = [...document.querySelectorAll("[data-reveal], [data-reveal-group] > *")];
  if (reduce || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  targets.forEach((el) => io.observe(el));
}

function setupSpine() {
  const section = document.querySelector(".hx-timeline");
  const fill = document.querySelector(".hx-spine-fill");
  if (!section || !fill) return;
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) { fill.style.transform = "scaleY(1)"; return; }
  function onScroll() {
    const body = section.querySelector(".hx-tl-body");
    const r = body.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = r.height - vh * 0.5;
    const p = total > 0 ? Math.min(Math.max((vh * 0.5 - r.top) / total, 0), 1) : 0;
    fill.style.transform = `scaleY(${p.toFixed(3)})`;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
}

function setupHeroParallax() {
  const glow = document.querySelector(".hx-hero-glow");
  if (!glow) return;
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    glow.style.transform = `translate3d(-50%, ${(y * 0.15).toFixed(1)}px, 0)`;
  }, { passive: true });
}

function renderAll(d) {
  const app = document.getElementById("hx-app");
  app.innerHTML = [
    renderNav(),
    renderOpening(),
    renderHero(d.hero || {}),
    renderManifesto(d.manifesto),
    ...(d.capitulos || []).map(renderCapitulo),
    renderTimeline(d.eras),
    renderFechamento(d.fechamento),
  ].join("");

  setupOpening();
  setupReveal();
  setupSpine();
  setupHeroParallax();
}

(async function init() {
  let data;
  try {
    data = await loadStory();
  } catch (err) {
    document.getElementById("hx-app").innerHTML =
      `<div style="padding:80px 24px;color:#fff"><h2>Couldn't load the page</h2><p>${esc(err.message)}</p></div>`;
    return;
  }
  renderAll(data); // no gate on the portfolio edition
})();
