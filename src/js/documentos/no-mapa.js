"use strict";
/* Documentos postos no mapa. */
/* =====================================================================
   DOCUMENTOS NO MAPA: o mestre prende um documento na cena; quem vê a
   cena toca nele e lê (só a versão com tarjas, nunca o original).
   Fica em estado/<id> com tipo "mapdoc" (todos da mesa leem, só o mestre escreve).
   ===================================================================== */
S.mapDocs = [];
function subscribeMapDocs() {
  if (S.mapDocsUnsub) return;
  S.mapDocsUnsub = S.db.listenCol(
    P() + "/estado",
    { where: ["tipo", "mapdoc"] },
    l => {
      const antes = S.mapDocRev || {};
      l.forEach(m => {
        if (antes[m.id] !== undefined && antes[m.id] !== (m.rev || 0) && S.docAberto === m.id) abrirMapDoc(m);
      });
      S.mapDocRev = Object.fromEntries(l.map(m => [m.id, m.rev || 0]));
      S.mapDocs = l;
      renderNomes();
      if (S.tool === "documentos" && S.isM && !isEditing()) renderPanel();
    },
    () => {}
  );
}
function pararMapDocs() {
  if (S.mapDocsUnsub) {
    try {
      S.mapDocsUnsub();
    } catch (e) {}
    S.mapDocsUnsub = null;
  }
  S.mapDocs = [];
}
function abrirMapDoc(m) {
  abrirDoc({ id: m.id, titulo: m.nome, doc: m.doc, quem: "Mestre", para: "todos" });
  if (S.isM) {
    const top = $(".docview .row.between");
    if (top && !$("#mdTirar"))
      top.insertAdjacentHTML("beforeend", `<button class="btn sm ghost" id="mdTirar">Tirar do mapa</button>`);
    const b = $("#mdTirar");
    if (b)
      b.onclick = () => {
        $("#modalHost").innerHTML = "";
        S.docAberto = null;
        tirarMapDoc(m);
      };
  }
}
async function tirarMapDoc(m) {
  try {
    await S.db.del(P() + "/estado/" + m.id);
    toast(`"${m.nome}" saiu do mapa.`);
  } catch (e) {
    fail(e);
  }
}
async function porNoMapa(d) {
  if (toqueDuplo("porNoMapa")) return; // evita rodar duas vezes num toque duplo
  if (!d) return;
  const sc = curScene();
  if (!sc || !S.viewSid) {
    toast("Abra uma cena no mapa primeiro: o documento vai para a cena que está na tela.");
    return;
  }
  // centro da tela, em coordenadas do mapa (se o mapa ainda não terminou de abrir, o centro da cena)
  const r = board.getBoundingClientRect();
  let x = Math.round((r.width / 2 - V.x) / V.z),
    y = Math.round((r.height / 2 - V.y) / V.z);
  if (!isFinite(x) || !isFinite(y)) {
    x = Math.round((sc.w || 1000) / 2);
    y = Math.round((sc.h || 700) / 2);
  }
  const doc = docSnapshot(d);
  try {
    await S.db.set(P() + "/estado/md" + rid(8), {
      tipo: "mapdoc",
      cena: S.viewSid,
      x,
      y,
      nome: docNome(d),
      docId: d.id || null,
      doc,
      rev: 0,
      rot: Math.round(Math.random() * 14 - 7), // papel jogado na mesa: meio torto
      esc: 1,
      z: Date.now(),
      ts: Date.now()
    });
    toast(`"${docNome(d)}" está no mapa, no centro da tela. Arraste para mudar de lugar.`);
  } catch (e) {
    fail(e);
  }
}

/* ---------- o papel em cima do mapa ----------
   Cada documento aparece como o próprio papel em miniatura, meio girado e com sombra, como papéis jogados
   numa mesa. O último que o mestre mexeu fica por cima. Campos no estado: x, y (centro), rot (graus),
   esc (tamanho, 1 = normal) e z (ordem: maior fica por cima). */
// largura natural de cada modelo de papel (a mesma do leitor), em px
const PAPEL_NAT = { cartaz: 480, email: 620, audio: 460, foto: 460, bilhete: 400, celular: 380 };
const papelNat = m => PAPEL_NAT[(m.doc || {}).modelo] || 640;
/* Largura no mapa: um papel de 640px ocupa 3,5 quadrados da grade, vezes a escala escolhida. */
const papelLargura = m => Math.round(tokenBase() * 3.5 * (papelNat(m) / 640) * (m.esc || 1));
/* Giro: o que o mestre escolheu ou, em documento antigo, um giro fixo tirado do id (−6° a 6°). */
function papelGiro(m) {
  if (m.rot != null) return m.rot;
  let h = 0;
  for (const ch of m.id || "") h = (h * 31 + ch.charCodeAt(0)) % 997;
  return (h % 13) - 6;
}
function papelHTML(m, z) {
  const w = papelLargura(m),
    nat = papelNat(m);
  const dim = S.isM && hiddenAt(m.x, m.y) ? "dim" : "";
  const ctl = S.isM
    ? `<div class="mdoc-ctl" aria-label="Ajustar o papel"><button type="button" data-mdg="-1" title="Girar para a esquerda">↺</button><button type="button" data-mdg="1" title="Girar para a direita">↻</button><button type="button" data-mde="-1" title="Diminuir">−</button><button type="button" data-mde="1" title="Aumentar">+</button></div>`
    : "";
  return `<div class="mdoc ${dim}" data-mdoc="${esc(m.id)}" role="button" tabindex="0" aria-label="Ler documento: ${esc(m.nome)}" title="${esc(m.nome)}" style="left:${m.x}px;top:${m.y}px;width:${w}px;z-index:${z};--giro:${papelGiro(m)}deg"><div class="mdoc-papel" style="--nat:${nat}px;--zoom:${(w / nat).toFixed(4)}">${docHtml(m.doc || {})}</div>${ctl}</div>`;
}
/* O papel é desenhado no tamanho de leitura e encolhido (scale). A altura do quadro vem da altura real
   do papel; papel comprido é cortado como uma folha A4. Mede de novo quando uma imagem termina de carregar. */
function medirPapel(caixa) {
  const p = caixa.querySelector(".docp");
  if (!p) return;
  const z = parseFloat(caixa.style.getPropertyValue("--zoom")) || 1;
  const nat = parseFloat(caixa.style.getPropertyValue("--nat")) || 640;
  caixa.style.height = Math.round(Math.min(p.offsetHeight, nat * 1.45) * z) + "px";
}
function renderMapDocs(el) {
  const L = (S.mapDocs || [])
    .filter(m => m.cena === S.viewSid && (S.isM || !hiddenAt(m.x, m.y)))
    .sort((a, b) => (a.z || a.ts || 0) - (b.z || b.ts || 0));
  el.insertAdjacentHTML("beforeend", L.map((m, i) => papelHTML(m, i + 1)).join(""));
  $$(".mdoc-papel", el).forEach(c => {
    medirPapel(c);
    $$("img", c).forEach(im => {
      if (!im.complete) im.onload = () => medirPapel(c);
    });
  });
  $$("[data-mdoc]", el).forEach(b => {
    const m = (S.mapDocs || []).find(x => x.id === b.dataset.mdoc);
    if (!m) return;
    const salvar = dados => S.db.merge(P() + "/estado/" + m.id, dados).catch(fail);
    // mestre: girar e mudar o tamanho
    $$("[data-mdg]", b).forEach(
      c =>
        (c.onclick = e => {
          e.stopPropagation();
          salvar({ rot: papelGiro(m) + 7 * c.dataset.mdg, z: Date.now() });
        })
    );
    $$("[data-mde]", b).forEach(
      c =>
        (c.onclick = e => {
          e.stopPropagation();
          const esc2 = Math.max(0.5, Math.min(3, (m.esc || 1) * (c.dataset.mde > 0 ? 1.25 : 0.8)));
          salvar({ esc: Math.round(esc2 * 100) / 100, z: Date.now() });
        })
    );
    $$(".mdoc-ctl button", b).forEach(c => (c.onpointerdown = e => e.stopPropagation()));
    // tocar abre para ler; o mestre também arrasta
    b.onpointerdown = e => {
      e.stopPropagation();
      if (!S.isM) return;
      e.preventDefault();
      const st = { x: e.clientX, y: e.clientY, mx: m.x, my: m.y };
      let moved = false;
      try {
        b.setPointerCapture(e.pointerId);
      } catch (_) {}
      b.onpointermove = ev => {
        const dx = (ev.clientX - st.x) / V.z,
          dy = (ev.clientY - st.y) / V.z;
        if (!moved && Math.hypot(dx, dy) * V.z < 5) return;
        if (!moved) b.style.zIndex = 9999; // por cima enquanto arrasta
        moved = true;
        m.x = Math.round(st.mx + dx);
        m.y = Math.round(st.my + dy);
        b.style.left = m.x + "px";
        b.style.top = m.y + "px";
      };
      b.onpointerup = () => {
        b.onpointermove = null;
        b.onpointerup = null;
        if (moved) salvar({ x: m.x, y: m.y, z: Date.now() });
        else abrirMapDoc(m);
      };
    };
    b.onclick = e => {
      e.stopPropagation();
      if (!S.isM) abrirMapDoc(m);
    };
    b.onkeydown = e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        abrirMapDoc(m);
      }
    };
  });
}

/* Texto do botão "Pôr no mapa" de um documento da biblioteca. */
function docNoMapaRotulo(docId) {
  const n = (S.mapDocs || []).filter(x => x.docId === docId).length;
  return n ? `No mapa (${n}) · pôr outro` : "Pôr no mapa";
}
/* Mestre: lista dos documentos que estão no mapa, para tirar. */
function docsNoMapaHTML() {
  const L = S.mapDocs || [];
  if (!L.length) return "";
  const nomeCena = c => {
    const s = (S.cenas || []).find(x => x.id === c);
    return s ? s.nome : "cena apagada";
  };
  return `<div class="sub" style="margin-top:14px">Documentos no mapa (${L.length})</div><p class="muted small" style="margin:0">Quem vê a cena toca no papel e lê. No mapa, arraste para mudar de lugar e use ↺ ↻ − + para girar e mudar o tamanho; o último que você mexer fica por cima.</p>
 <div class="stack" style="gap:6px">${L.map(m => `<div class="row" style="gap:6px;flex-wrap:wrap;border:1px solid var(--line);border-radius:8px;padding:8px 10px"><div style="flex:1;min-width:160px"><b>${esc(m.nome)}</b><div class="muted small">Na cena: ${esc(nomeCena(m.cena))}</div></div><button class="btn sm ghost" data-mdtir="${esc(m.id)}">Tirar do mapa</button></div>`).join("")}</div>`;
}
function bindDocsMapa() {
  $$("[data-dmapa]").forEach(
    b => (b.onclick = () => porNoMapa((S.docs || []).find(d => d.id === b.dataset.dmapa)))
  );
  $$("[data-mdtir]").forEach(
    b =>
      (b.onclick = () => {
        const m = (S.mapDocs || []).find(x => x.id === b.dataset.mdtir);
        if (m) tirarMapDoc(m);
      })
  );
}
