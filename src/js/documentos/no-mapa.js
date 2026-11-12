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
  const r = board.getBoundingClientRect();
  const x = Math.round((r.width / 2 - V.x) / V.z),
    y = Math.round((r.height / 2 - V.y) / V.z);
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
      ts: Date.now()
    });
    toast(`"${docNome(d)}" está no mapa, no centro da tela. Arraste para mudar de lugar.`);
  } catch (e) {
    fail(e);
  }
}

/* Documentos postos no mapa: ícone clicável (o mestre arrasta para mudar de lugar). */
function renderMapDocs(el) {
  const L = (S.mapDocs || []).filter(m => m.cena === S.viewSid && (S.isM || !hiddenAt(m.x, m.y)));
  el.insertAdjacentHTML(
    "beforeend",
    L.map(
      m =>
        `<button class="mdoc ${S.isM && hiddenAt(m.x, m.y) ? "dim" : ""}" data-mdoc="${esc(m.id)}" style="left:${m.x}px;top:${m.y}px" aria-label="Ler documento: ${esc(m.nome)}" title="${esc(m.nome)}"><span class="mdi"></span><span class="mdn">${esc(m.nome)}</span></button>`
    ).join("")
  );
  $$("[data-mdoc]", el).forEach(b => {
    const m = (S.mapDocs || []).find(x => x.id === b.dataset.mdoc);
    if (!m) return;
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
        moved = true;
        m.x = Math.round(st.mx + dx);
        m.y = Math.round(st.my + dy);
        b.style.left = m.x + "px";
        b.style.top = m.y + "px";
      };
      b.onpointerup = async () => {
        b.onpointermove = null;
        b.onpointerup = null;
        if (moved) {
          try {
            await S.db.merge(P() + "/estado/" + m.id, { x: m.x, y: m.y });
          } catch (err) {
            fail(err);
          }
        } else abrirMapDoc(m);
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
  return `<div class="sub" style="margin-top:14px">Documentos no mapa (${L.length})</div><p class="muted small" style="margin:0">Quem vê a cena toca no documento e lê. Arraste no mapa para mudar de lugar.</p>
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
