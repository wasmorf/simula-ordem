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
   <div class="row" style="flex-wrap:nowrap"><input type="search" id="gbQ" placeholder="Buscar criatura"><button class="btn sm" id="gbVarias" style="white-space:nowrap">Subir várias</button></div>
   <p class="muted small" style="margin:0"><b>Subir várias:</b> escolha várias imagens de uma vez; cada uma vai para a criatura com o mesmo nome do arquivo (ex.: <code>zumbi-de-sangue.webp</code> ou <code>Zumbi de Sangue.png</code>).</p><div class="gb-grid" id="gbGrid"></div></div></div>`;
  $("#gbX").onclick = () => (h.innerHTML = "");
  $("#gbQ").oninput = galeriaRender;
  $("#gbVarias").onclick = arteBestVarias;
  galeriaRender();
}
/* Imagem inteira, no máximo 360 px (a mesma da escolha "Usar a imagem inteira"). */
async function arteInteira(file) {
  const im = await loadImg(file);
  const k = Math.min(1, 360 / Math.max(im.naturalWidth, im.naturalHeight));
  return maToURL(drawTo(im, im.naturalWidth * k, im.naturalHeight * k));
}
/* Várias artes de uma vez: o nome do arquivo diz a criatura ("-profile"/"-perfil" no fim é ignorado). */
async function arteBestVarias() {
  const files = await pickImage(true);
  if (!files || !files.length) return;
  const porChave = new Map(allBest().map(b => [arteKey(b.n), b.n]));
  const salvas = [],
    sobra = [];
  toast(`Subindo ${files.length} imagem(ns)…`);
  for (const file of files) {
    const chave = arteKey(file.name.replace(/\.[a-z0-9]+$/i, "")).replace(/-(profile|perfil)$/, "");
    const n = porChave.get(chave);
    if (!n) {
      sobra.push(file.name);
      continue;
    }
    try {
      const url = await arteInteira(file);
      await S.db.set(P() + "/arteBest/" + arteKey(n), { n, url, ts: Date.now() });
      salvas.push(n);
    } catch (e) {
      sobra.push(file.name);
    }
  }
  toast(`${salvas.length} arte(s) salva(s).`);
  if (sobra.length)
    await formBox(
      "Algumas imagens ficaram de fora",
      `<p style="margin:0">Estes arquivos não têm o nome de uma criatura do bestiário (ou não abriram). Renomeie o arquivo com o nome da criatura, ou crie a criatura em <b>Homebrew</b> e suba de novo:</p><p class="muted small" style="margin:0">${sobra.map(esc).join(", ")}</p>`,
      "Ok"
    );
  if (sobra.length)
    galeriaArtes(); // o aviso usa a mesma janela: abre a galeria de novo
  else galeriaRender();
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
      else url = await arteInteira(file);
    } catch (e) {
      toast("Não consegui usar essa imagem.");
    }
  }
  host.innerHTML = keep;
  $("#gbX").onclick = () => (host.innerHTML = "");
  $("#gbQ").value = q;
  $("#gbQ").oninput = galeriaRender;
  $("#gbVarias").onclick = arteBestVarias;
  galeriaRender();
  if (!url) return;
  try {
    await S.db.set(P() + "/arteBest/" + arteKey(n), { n, url, ts: Date.now() });
    toast(`Arte de ${n} salva.`);
  } catch (e) {
    fail(e);
  }
}
