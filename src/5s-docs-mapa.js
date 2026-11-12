<script>
"use strict";
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
porNoMapa = umaVez(porNoMapa);

/* desenha os documentos da cena por cima do mapa */
{
  const _rn = renderNomes;
  renderNomes = function () {
    _rn();
    const el = $("#nomesL");
    if (!el) return;
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
  };
}

/* botões na biblioteca do mestre */
function docsMapaHTML(h) {
  if (!S.isM) return h;
  h = h.replace(/(<button class="btn sm ghost" data-dren="([^"]+)">Renomear<\/button>)/g, (m0, b, id) => {
    const n = (S.mapDocs || []).filter(x => x.docId === id).length;
    return (
      b +
      `<button class="btn sm ghost" data-dmapa="${id}">${n ? `No mapa (${n}) · pôr outro` : "Pôr no mapa"}</button>`
    );
  });
  const L = S.mapDocs || [];
  if (!L.length) return h;
  const nomeCena = c => {
    const s = (S.cenas || []).find(x => x.id === c);
    return s ? s.nome : "cena apagada";
  };
  return (
    h +
    `<div class="sub" style="margin-top:14px">Documentos no mapa (${L.length})</div><p class="muted small" style="margin:0">Quem vê a cena toca no documento e lê. Arraste no mapa para mudar de lugar.</p>
 <div class="stack" style="gap:6px">${L.map(m => `<div class="row" style="gap:6px;flex-wrap:wrap;border:1px solid var(--line);border-radius:8px;padding:8px 10px"><div style="flex:1;min-width:160px"><b>${esc(m.nome)}</b><div class="muted small">Na cena: ${esc(nomeCena(m.cena))}</div></div><button class="btn sm ghost" data-mdtir="${esc(m.id)}">Tirar do mapa</button></div>`).join("")}</div>`
  );
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

/* Enquanto alguém arrasta um token, nada redesenha o mapa por baixo do dedo (isso fazia o arrastar
   "falhar" no celular quando chegava alguma atualização da mesa); redesenha logo que solta. */
window.addEventListener(
  "pointerup",
  () => {
    if (S.dragging) {
      S.dragging = false;
      setTimeout(() => {
        if (S.boardPend) renderBoard();
      }, 0);
    }
  },
  true
);
window.addEventListener(
  "pointercancel",
  () => {
    if (S.dragging) {
      S.dragging = false;
      setTimeout(() => renderBoard(), 0);
    }
  },
  true
);
/* Foto de NPC no token: os jogadores não leem a ficha de um NPC escondido, então o token guarda
   uma cópia da foto (fotoNpc). Só o mestre grava; todos usam quando não conseguem ler a ficha. */
const tokUrlMestre = tokUrl; // foto/arte que o mestre enxerga (ficha, arte do bestiário ou a do token)
tokUrl = function (t) {
  const f = t && t.fichaId && S.fichas[t.fichaId];
  if (t && t.fotoNpc && !f) return t.fotoNpc;
  return tokUrlMestre(t);
};
function syncFotoNpc() {
  if (!S.isM || !S.mesaId) return;
  for (const t of S.tokens || []) {
    if (!t.fichaId) continue;
    const f = S.fichas[t.fichaId];
    if (!f || !f.npc) continue;
    if (t.dono !== S.uid) {
      t.dono = S.uid;
      S.db.merge(P() + "/tokens/" + t.id, { dono: S.uid }).catch(() => {});
    }
    let foto = tokUrlMestre(t) || null;
    if (foto === (t.url || null)) foto = null; // se é a imagem do próprio token, todos já veem
    if ((t.fotoNpc || null) === foto) continue;
    if (foto && foto.length > 900000) continue; // grande demais para caber no token
    t.fotoNpc = foto;
    S.db.merge(P() + "/tokens/" + t.id, { fotoNpc: foto }).catch(() => {});
  }
}
let syncFotoNpcTm = null;
function agendarSyncFotoNpc() {
  clearTimeout(syncFotoNpcTm);
  syncFotoNpcTm = setTimeout(syncFotoNpc, 900);
}
/* ---------- Copiar cena ou mapa para outra mesa (do mesmo mestre) ---------- */
function mesasOndeSouMestre() {
  return (S.minhas || []).filter(m => m.papel === "mestre" && m.id !== S.mesaId);
}
async function escolherMesaDestino(oque) {
  const L = mesasOndeSouMestre();
  if (!L.length) {
    toast("Você não é mestre de outra mesa. Crie a outra mesa primeiro.");
    return null;
  }
  const r = await formBox(
    `Copiar ${oque} para outra mesa`,
    `<p class="muted small" style="margin:0">Vai uma cópia. O original continua aqui e as mudanças numa não mexem na outra.</p>
   <div class="field"><label class="label" for="cpM">Mesa</label><select id="cpM" name="mesa">${L.map(m => `<option value="${esc(m.id)}">${esc(m.nome || m.id)} (${esc(m.id)})</option>`).join("")}</select></div>`,
    "Copiar"
  );
  return r && r.mesa ? r.mesa : null;
}
const _sem = o => {
  const { id, ...r } = o || {};
  return JSON.parse(JSON.stringify(r));
};
async function copiarCena(sid) {
  const c = S.cenas.find(x => x.id === sid);
  if (!c) return;
  const dest = await escolherMesaDestino(`a cena "${c.nome}"`);
  if (!dest) return;
  toast("Copiando a cena…");
  const D = "mesas/" + dest;
  try {
    const img = await S.db.get(P() + "/cenaImg/" + sid);
    if (!img) {
      toast("Não achei a imagem dessa cena.");
      return;
    }
    const nid = "c" + rid(8);
    const cena = { ..._sem(c), criada: Date.now(), ver: Date.now() };
    if (c.mapaId) {
      const m = await S.db.get(P() + "/mapas/" + c.mapaId);
      if (m) {
        const mid = "m" + rid(8);
        await S.db.set(D + "/mapas/" + mid, { ..._sem(m), cenaId: nid, atualizado: Date.now() });
        cena.mapaId = mid;
      } else delete cena.mapaId;
    }
    await S.db.set(D + "/cenaImg/" + nid, _sem(img));
    const nev = await S.db.get(P() + "/nevoa/" + sid);
    if (nev) await S.db.set(D + "/nevoa/" + nid, _sem(nev));
    await S.db.set(D + "/cenas/" + nid, cena);
    toast(`Cena copiada para a mesa ${dest}. Tokens e documentos no mapa não vão junto.`);
  } catch (e) {
    fail(e);
  }
}
async function copiarMapa(id) {
  const m = (S.mapas || []).find(x => x.id === id);
  if (!m) return;
  const dest = await escolherMesaDestino(`o mapa "${m.nome || "Mapa"}"`);
  if (!dest) return;
  try {
    const { cenaId, ...M } = _sem(m);
    await S.db.set("mesas/" + dest + "/mapas/m" + rid(8), { ...M, atualizado: Date.now() });
    toast(`Mapa copiado para a mesa ${dest}. Lá ele fica em Meus mapas.`);
  } catch (e) {
    fail(e);
  }
}
copiarCena = umaVez(copiarCena);
copiarMapa = umaVez(copiarMapa);
</script>
