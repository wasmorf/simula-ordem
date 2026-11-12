<script>
"use strict";
/* =====================================================================
   ANOTAÇÕES E MURAL DE PISTAS
   Anotações: cada jogador grifa trechos e escreve observações nos documentos
   que recebeu. Ficam só para ele, em usuarios/<uid>/notasDoc/<mesa>__<id>.
   Mural: quadro da mesa onde todos pregam documentos e bilhetes e ligam uns
   aos outros com barbante. Fica em mesas/<código>/mural/<id>, com tipo
   "doc", "nota" ou "fio" (o barbante, de a até b).
   ===================================================================== */
const MU_W = 2400,
  MU_H = 1500;
const MU_LARG = { doc: 170, nota: 150 };

/* ---------- anotações do jogador ---------- */
function notaPath(privId) {
  return "usuarios/" + S.uid + "/notasDoc/" + S.mesaId + "__" + privId;
}
function subscribeNotas() {
  if (S.isM || S.notasUnsub || !S.uid || !S.mesaId) return;
  S.notasUnsub = S.db.listenCol(
    "usuarios/" + S.uid + "/notasDoc",
    { where: ["mesa", S.mesaId] },
    l => {
      S.notas = Object.fromEntries(l.map(n => [n.privId, n]));
      if (S.tool === "documentos" && !isEditing()) renderPanel();
    },
    () => {}
  );
}
function temNota(privId) {
  const n = (S.notas || {})[privId];
  return !!(n && ((n.texto || "").trim() || (n.grifos || []).length));
}
async function salvarNota(privId, n) {
  S.notas = { ...(S.notas || {}), [privId]: n };
  try {
    await S.db.set(notaPath(privId), { ...n, mesa: S.mesaId, privId, ts: Date.now() });
  } catch (e) {
    fail(e);
  }
}
// Pinta os grifos no documento aberto. Devolve quantos achou.
function aplicarGrifos(root, grifos) {
  let achou = 0;
  (grifos || []).forEach((g, gi) => {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: n =>
        n.parentElement.closest(".redact,.tj,mark.grifo,audio")
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT
    });
    let n;
    while ((n = w.nextNode())) {
      const i = n.data.indexOf(g);
      if (i < 0) continue;
      const fim = n.splitText(i);
      fim.splitText(g.length);
      const m = document.createElement("mark");
      m.className = "grifo";
      m.dataset.g = gi;
      m.textContent = g;
      fim.replaceWith(m);
      achou++;
      break;
    }
  });
  return achou;
}
// Guarda o último trecho escolhido dentro do documento aberto (no celular o toque no botão apaga a seleção).
document.addEventListener("selectionchange", () => {
  const sel = window.getSelection();
  const box = $(".docview .docp");
  if (!sel || sel.isCollapsed || !box) return;
  if (box.contains(sel.anchorNode) && box.contains(sel.focusNode))
    S.selDoc = sel.toString().replace(/\s+/g, " ").trim();
});

/* Ações embaixo do documento aberto: anotações (quem recebeu) e mural. Chamado no fim de abrirDoc. */
function docLeituraExtras(e) {
  const view = $(".docview");
  if (!view) return;
  const recebido = !S.isM && e.tipo === "doc" && e.autor !== S.uid;
  if (e.mural) {
    if (e.mural.autor === S.uid || S.isM)
      view.insertAdjacentHTML(
        "beforeend",
        `<div class="row" style="margin-top:12px"><button class="btn sm ghost" id="muTirarDoc">Tirar do mural</button></div>`
      );
    const t = $("#muTirarDoc");
    if (t)
      t.onclick = async () => {
        $("#modalHost").innerHTML = "";
        S.docAberto = null;
        await tirarDoMural(e.mural);
      };
    return;
  }
  if (!recebido) return;
  const n = (S.notas || {})[e.id] || { grifos: [], texto: "" };
  view.insertAdjacentHTML(
    "beforeend",
    `<div class="doc-notas stack">
      <div class="row"><button class="btn sm" id="dnGrifar">Grifar trecho</button><button class="btn sm" id="dnMural">Pôr no mural</button>${(n.grifos || []).length ? `<span class="muted small">Toque num grifo para tirar.</span>` : ""}</div>
      <label class="label" for="dnTx">Minhas anotações (só você vê)</label>
      <textarea id="dnTx" rows="3" maxlength="2000" placeholder="O que você percebeu neste documento?">${esc(n.texto || "")}</textarea>
    </div>`
  );
  const box = $(".docview .docp");
  const pintar = () => {
    aplicarGrifos(box, n.grifos);
    $$("mark.grifo", box).forEach(
      m =>
        (m.onclick = async () => {
          if (!(await confirmBox("Tirar este grifo?", m.textContent, "Tirar"))) return;
          n.grifos = n.grifos.filter((g, i) => i !== +m.dataset.g);
          await salvarNota(e.id, n);
          abrirDoc(e);
        })
    );
  };
  pintar();
  S.selDoc = "";
  $("#dnGrifar").onclick = async () => {
    const g = (S.selDoc || "").slice(0, 300);
    if (!g) {
      toast("Selecione um trecho do documento (arraste o dedo ou o mouse por cima) e toque em Grifar.");
      return;
    }
    if ((n.grifos || []).includes(g)) return;
    const teste = box.cloneNode(true);
    if (!aplicarGrifos(teste, [g])) {
      toast("Grife um trecho de uma linha só, sem passar por cima de tarjas.");
      return;
    }
    n.grifos = [...(n.grifos || []), g];
    await salvarNota(e.id, n);
    abrirDoc(e);
  };
  let tm = 0;
  $("#dnTx").oninput = ev => {
    n.texto = ev.target.value;
    clearTimeout(tm);
    tm = setTimeout(() => salvarNota(e.id, n), 700);
  };
  $("#dnMural").onclick = async () => {
    if (
      e.para !== "todos" &&
      !(await confirmBox(
        "Pôr no mural?",
        "Todos da mesa vão poder ler este documento no mural, com as mesmas tarjas que você vê.",
        "Pôr no mural"
      ))
    )
      return;
    await porNoMural({ titulo: e.titulo, doc: e.doc, docId: e.docId || null, privId: e.id });
  };
}

/* ---------- mural de pistas ---------- */
function subscribeMural() {
  if (S.muralUnsub || !S.mesaId) return;
  S.muralUnsub = S.db.listenCol(
    P() + "/mural",
    {},
    l => {
      S.mural = l;
      if ($("#muralEd")) {
        if (S.muDrag) S.muPend = true;
        else renderMural();
      }
      if (S.tool === "documentos" && !isEditing()) renderPanel();
    },
    () => {}
  );
}
function muralBotaoHTML() {
  subscribeMural();
  const n = (S.mural || []).filter(x => x.tipo !== "fio").length;
  return `<button class="btn block" id="muralAbrir">📌 Mural de pistas${n ? ` (${n})` : ""}</button>`;
}
function bindMural() {
  const b = $("#muralAbrir");
  if (b) b.onclick = abrirMural;
  $$("[data-dmural]").forEach(
    x =>
      (x.onclick = () => {
        const d = (S.docs || []).find(y => y.id === x.dataset.dmural);
        if (d) porNoMural({ titulo: docNome(d), doc: docSnapshot(d), docId: d.id });
      })
  );
}
async function porNoMural(it) {
  const L = S.mural || (await S.db.getCol(P() + "/mural"));
  if (
    L.some(
      x =>
        x.tipo === "doc" &&
        ((it.privId && x.privId === it.privId) || (S.isM && it.docId && x.docId === it.docId && !x.privId))
    )
  ) {
    toast("Esse documento já está no mural.");
    return;
  }
  const R = maRng(Date.now() % 9973);
  try {
    await S.db.add(P() + "/mural", {
      tipo: "doc",
      titulo: String(it.titulo || "Documento").slice(0, 120),
      doc: it.doc,
      docId: it.docId || null,
      privId: it.privId || null,
      autor: S.uid,
      autorNome: S.isM ? "Mestre" : nomeMembro(S.uid),
      x: Math.round(700 + R() * 900),
      y: Math.round(380 + R() * 600),
      ts: Date.now()
    });
    toast("Está no mural de pistas.");
  } catch (e) {
    fail(e);
  }
}
porNoMural = umaVez(porNoMural);
async function tirarDoMural(it) {
  try {
    const fios = (S.mural || []).filter(f => f.tipo === "fio" && (f.a === it.id || f.b === it.id));
    for (const f of fios) await S.db.del(P() + "/mural/" + f.id);
    await S.db.del(P() + "/mural/" + it.id);
    toast("Saiu do mural.");
  } catch (e) {
    fail(e);
  }
}
async function notaMural(it) {
  const meu = !it || it.autor === S.uid || S.isM;
  if (!meu) return;
  const cores = ["Amarelo", "Rosa", "Azul", "Verde"];
  const r = await formBox(
    it ? "Bilhete" : "Novo bilhete",
    `<div class="field"><label class="label" for="muTx">O que vai escrito</label><textarea id="muTx" name="texto" rows="4" maxlength="200" required placeholder="Ex.: A Bia sabia do sangue?">${esc((it && it.texto) || "")}</textarea></div>
     <div class="field"><label class="label" for="muCor">Cor</label><select id="muCor" name="cor">${cores.map((c, i) => `<option value="${i}" ${((it && it.cor) || 0) === i ? "selected" : ""}>${c}</option>`).join("")}</select></div>
     ${it ? `<label class="check"><input type="checkbox" name="tirar"> Tirar do mural</label>` : ""}`,
    it ? "Salvar" : "Pregar no mural"
  );
  if (!r) return;
  try {
    if (it && r.tirar) return tirarDoMural(it);
    const texto = (r.texto || "").trim();
    if (!texto) return;
    if (it) await S.db.merge(P() + "/mural/" + it.id, { texto, cor: +r.cor || 0 });
    else {
      const vp = $("#muVp");
      const z = S.muZ || 0.5;
      await S.db.add(P() + "/mural", {
        tipo: "nota",
        texto,
        cor: +r.cor || 0,
        autor: S.uid,
        autorNome: S.isM ? "Mestre" : nomeMembro(S.uid),
        x: Math.round(Math.min(MU_W - 160, (vp ? vp.scrollLeft + vp.clientWidth / 2 : 1200 * z) / z - 75)),
        y: Math.round(Math.min(MU_H - 140, (vp ? vp.scrollTop + vp.clientHeight / 2 : 750 * z) / z - 60)),
        ts: Date.now()
      });
    }
  } catch (e) {
    fail(e);
  }
}
function abrirMural() {
  if ($("#muralEd")) return;
  subscribeMural();
  S.muLigar = false;
  S.muSel = null;
  S.muZ = S.muZ || (innerWidth < 700 ? 0.38 : 0.55);
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div class="docEd muralEd" id="muralEd"><div class="me-top"><button class="btn sm ghost" id="muX">✕ Fechar</button><b style="font-family:var(--f-display);font-size:18px">Mural de pistas</b><span class="me-gap"></span>
      <button class="btn sm" id="muLig">🧵 Ligar com barbante</button><button class="btn sm" id="muNota">+ Bilhete</button>
      <span class="row" style="gap:2px;flex-wrap:nowrap"><button class="btn sm" id="muMenos" aria-label="Diminuir">−</button><button class="btn sm" id="muMais" aria-label="Aumentar">+</button></span></div>
      <div class="mu-dica muted small" id="muDica"></div>
      <div class="mu-vp" id="muVp"><div class="mu-scale" id="muScale"><div class="mu-board" id="muBoard"></div></div></div></div>`
  );
  document.body.classList.add("me-open");
  $("#muX").onclick = () => {
    $("#muralEd").remove();
    document.body.classList.remove("me-open");
  };
  $("#muLig").onclick = () => {
    S.muLigar = !S.muLigar;
    S.muSel = null;
    renderMural();
  };
  $("#muNota").onclick = () => notaMural(null);
  const zoom = f => {
    const vp = $("#muVp");
    const cx = (vp.scrollLeft + vp.clientWidth / 2) / S.muZ,
      cy = (vp.scrollTop + vp.clientHeight / 2) / S.muZ;
    S.muZ = Math.max(0.25, Math.min(1.2, +(S.muZ * f).toFixed(3)));
    renderMural();
    vp.scrollLeft = cx * S.muZ - vp.clientWidth / 2;
    vp.scrollTop = cy * S.muZ - vp.clientHeight / 2;
  };
  $("#muMenos").onclick = () => zoom(1 / 1.25);
  $("#muMais").onclick = () => zoom(1.25);
  renderMural();
  const vp = $("#muVp");
  vp.scrollLeft = (MU_W * S.muZ - vp.clientWidth) / 2;
  vp.scrollTop = (MU_H * S.muZ - vp.clientHeight) / 2;
}
function muCentro(it) {
  return { x: it.x + (MU_LARG[it.tipo] || 160) / 2, y: it.y + 8 };
}
function fiosSVG() {
  const L = S.mural || [];
  const por = Object.fromEntries(L.map(x => [x.id, x]));
  const fios = L.filter(f => f.tipo === "fio" && por[f.a] && por[f.b]);
  return `<svg class="mu-fios" width="${MU_W}" height="${MU_H}" viewBox="0 0 ${MU_W} ${MU_H}">${fios
    .map(f => {
      const a = muCentro(por[f.a]),
        b = muCentro(por[f.b]);
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      const path = `M${a.x} ${a.y} Q${(a.x + b.x) / 2} ${Math.max(a.y, b.y) + Math.min(140, d * 0.18)} ${b.x} ${b.y}`;
      return `<path d="${path}" class="mu-f"/><path d="${path}" class="mu-fh" data-fio="${esc(f.id)}"><title>Cortar o barbante</title></path>`;
    })
    .join("")}</svg>`;
}
function renderMural() {
  const bd = $("#muBoard");
  if (!bd) return;
  const z = S.muZ;
  $("#muScale").style.cssText = `width:${MU_W * z}px;height:${MU_H * z}px`;
  bd.style.transform = `scale(${z})`;
  $("#muLig").classList.toggle("primary", !!S.muLigar);
  $("#muDica").textContent = S.muLigar
    ? S.muSel
      ? "Agora toque na pista que você quer ligar a essa."
      : "Toque em duas pistas para ligar uma à outra. Toque num barbante para cortar."
    : "Arraste as pistas para organizar. Toque numa pista para ler.";
  const L = (S.mural || []).filter(x => x.tipo !== "fio");
  bd.innerHTML =
    fiosSVG() +
    L.map(it => {
      const R = maRng(maH((it.id || "x").length, (it.id || "x").charCodeAt(1) || 7, 5));
      const rot = ((R() - 0.5) * 6).toFixed(1);
      const cls = `mu-it mu-${it.tipo} ${S.muSel === it.id ? "sel" : ""} ${it.tipo === "nota" ? "c" + (it.cor || 0) : ""}`;
      const corpo =
        it.tipo === "doc"
          ? `<div class="mu-th">${docHtml(it.doc || {})}</div><div class="mu-nm">${esc(it.titulo)}</div>`
          : `<div class="mu-tx">${esc(it.texto)}</div>`;
      return `<div class="${cls}" data-mu="${esc(it.id)}" style="left:${it.x}px;top:${it.y}px;--r:${rot}deg"><i class="mu-pin"></i>${corpo}<div class="mu-por">${esc(it.autorNome || "")}</div></div>`;
    }).join("");
  bindMuralBoard();
}
function bindMuralBoard() {
  const L = S.mural || [];
  $$("#muBoard [data-mu]").forEach(el => {
    const it = L.find(x => x.id === el.dataset.mu);
    if (!it) return;
    el.onpointerdown = e => {
      e.preventDefault();
      const st = { x: e.clientX, y: e.clientY, ix: it.x, iy: it.y };
      let moved = false;
      try {
        el.setPointerCapture(e.pointerId);
      } catch (_) {}
      el.onpointermove = ev => {
        const dx = (ev.clientX - st.x) / S.muZ,
          dy = (ev.clientY - st.y) / S.muZ;
        if (!moved && Math.hypot(dx, dy) * S.muZ < 5) return;
        moved = true;
        S.muDrag = true;
        it.x = Math.round(Math.max(0, Math.min(MU_W - 170, st.ix + dx)));
        it.y = Math.round(Math.max(0, Math.min(MU_H - 200, st.iy + dy)));
        el.style.left = it.x + "px";
        el.style.top = it.y + "px";
        const svg = $("#muBoard .mu-fios");
        if (svg) svg.outerHTML = fiosSVG();
      };
      el.onpointerup = el.onpointercancel = async () => {
        el.onpointermove = el.onpointerup = el.onpointercancel = null;
        S.muDrag = false;
        if (moved) {
          try {
            await S.db.merge(P() + "/mural/" + it.id, { x: it.x, y: it.y });
          } catch (er) {
            fail(er);
          }
          if (S.muPend) {
            S.muPend = false;
            renderMural();
          } else bindMuralBoard();
          return;
        }
        clicarNoMural(it);
      };
    };
  });
  $$("#muBoard [data-fio]").forEach(
    p =>
      (p.onclick = async () => {
        if (!(await confirmBox("Cortar este barbante?", "As duas pistas continuam no mural.", "Cortar")))
          return;
        try {
          await S.db.del(P() + "/mural/" + p.dataset.fio);
        } catch (e) {
          fail(e);
        }
      })
  );
}
async function clicarNoMural(it) {
  if (S.muLigar) {
    if (!S.muSel || S.muSel === it.id) {
      S.muSel = S.muSel === it.id ? null : it.id;
      renderMural();
      return;
    }
    const a = S.muSel,
      b = it.id;
    S.muSel = null;
    renderMural();
    if (
      (S.mural || []).some(f => f.tipo === "fio" && ((f.a === a && f.b === b) || (f.a === b && f.b === a)))
    ) {
      toast("Essas duas já estão ligadas.");
      return;
    }
    try {
      await S.db.add(P() + "/mural", { tipo: "fio", a, b, autor: S.uid, ts: Date.now() });
    } catch (e) {
      fail(e);
    }
    return;
  }
  if (it.tipo === "doc")
    abrirDoc({ id: it.id, titulo: it.titulo, doc: it.doc, quem: it.autorNome, para: "todos", mural: it });
  else if (it.autor === S.uid || S.isM) notaMural(it);
}
</script>
