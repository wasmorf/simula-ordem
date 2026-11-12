"use strict";
/* Galeria de artes do bestiário (imagens que o mestre sobe). */
/* ---------- galeria de artes do bestiário (imagens que o mestre sobe na própria mesa) ---------- */
function arteKey(n) {
  return (
    String(n || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "x"
  );
}
function subscribeArteBest() {
  if (S.arteUnsub) return;
  S.arteBest = {};
  S.arteUnsub = S.db.listenCol(
    P() + "/arteBest",
    {},
    l => {
      const m = {};
      l.forEach(x => {
        if (x.n && x.url) m[x.n] = x.url;
      });
      S.arteBest = m;
      renderBoard();
      if (["agentes", "tokens"].includes(S.tool) && !isEditing()) renderPanel();
      const g = $("#galBest");
      if (g) galeriaRender();
    },
    () => {}
  );
}
function arteDaBase(n) {
  return (n && S.arteBest && S.arteBest[n]) || "";
}
async function galeriaArtes() {
  const h = $("#modalHost");
  h.innerHTML = `<div class="modal-back"><div class="modal wide" id="galBest" role="dialog" aria-label="Artes do bestiário"><div class="row between"><h3 style="margin:0">Artes do bestiário</h3><button class="btn sm" id="gbX">Fechar</button></div>
   <p class="muted small" style="margin:0">Suba uma imagem por criatura. Ela fica guardada só nesta mesa e vira o token sempre que a criatura entrar em cena, inclusive nas que já estão no mapa. PNG sem fundo fica recortado no mapa.</p>
   <input type="search" id="gbQ" placeholder="Buscar criatura"><div class="gb-grid" id="gbGrid"></div></div></div>`;
  $("#gbX").onclick = () => (h.innerHTML = "");
  $("#gbQ").oninput = galeriaRender;
  galeriaRender();
}
function galeriaRender() {
  const el = $("#gbGrid");
  if (!el) return;
  const q = ($("#gbQ").value || "").toLowerCase();
  const B = allBest().filter(b => !q || b.n.toLowerCase().includes(q));
  el.innerHTML =
    B.map(b => {
      const a = arteDaBase(b.n);
      return `<div class="gb-it ${a ? "on" : ""}"><img src="${a || arteCriatura(b.el, maH(b.n.length, b.n.charCodeAt(0), 11))}" alt=""><b>${esc(b.n)}</b><span class="muted small">${esc(b.el || "—")} · VD ${b.vd}</span>
    <div class="row" style="gap:4px;justify-content:center"><button class="btn sm ${a ? "" : "primary"}" data-gbup="${esc(b.n)}">${a ? "Trocar" : "Escolher arte"}</button>${a ? `<button class="btn sm ghost" data-gbdel="${esc(b.n)}" aria-label="Tirar arte">✕</button>` : ""}</div></div>`;
    }).join("") || `<p class="muted">Nada encontrado.</p>`;
  $$("[data-gbup]").forEach(b => (b.onclick = () => arteBestEscolher(b.dataset.gbup)));
  $$("[data-gbdel]").forEach(
    b =>
      (b.onclick = async () => {
        try {
          await S.db.del(P() + "/arteBest/" + arteKey(b.dataset.gbdel));
        } catch (e) {
          fail(e);
        }
      })
  );
}
async function arteBestEscolher(n) {
  const host = $("#modalHost");
  const keep = host.innerHTML;
  const q = ($("#gbQ") || {}).value || "";
  const file = await pickImage();
  if (!file) return;
  const r = await formBox(
    `Arte de ${n}`,
    `<label class="check"><input type="radio" name="modo" value="inteira" checked> <span><b>Usar a imagem inteira</b> (melhor para PNG sem fundo)</span></label><label class="check"><input type="radio" name="modo" value="recorte"> <span><b>Recortar um quadrado</b> (para imagem com fundo)</span></label>`,
    "Continuar"
  );
  let url = null;
  if (r) {
    try {
      if (r.modo === "recorte")
        url = await cropImage(file, {
          size: 320,
          round: false,
          radius: 0.04,
          type: "image/webp",
          title: `Recortar ${n}`
        });
      else {
        const im = await loadImg(file);
        const k = Math.min(1, 360 / Math.max(im.naturalWidth, im.naturalHeight));
        const c = drawTo(im, im.naturalWidth * k, im.naturalHeight * k);
        url = maToURL(c);
      }
    } catch (e) {
      toast("Não consegui usar essa imagem.");
    }
  }
  host.innerHTML = keep;
  $("#gbX").onclick = () => (host.innerHTML = "");
  $("#gbQ").value = q;
  $("#gbQ").oninput = galeriaRender;
  galeriaRender();
  if (!url) return;
  try {
    await S.db.set(P() + "/arteBest/" + arteKey(n), { n, url, ts: Date.now() });
    toast(`Arte de ${n} salva.`);
  } catch (e) {
    fail(e);
  }
}
