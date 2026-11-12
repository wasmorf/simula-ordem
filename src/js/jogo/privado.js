"use strict";
/* Privado: sussurros, rolagens só para o mestre e entrega de documentos. */
/* ===================== PRIVADO: sussurros, rolagens para o mestre, documentos ===================== */
function subscribePrivado() {
  if (S.privUnsub) return;
  const p = P();
  const merge = () => {
    const m = new Map();
    [...(S.privA || []), ...(S.privB || [])].forEach(x => m.set(x.id, x));
    const list = [...m.values()].sort((a, b) => (b.ts || 0) - (a.ts || 0));
    if (S.privPrimed)
      list
        .filter(x => !S.privSeen.has(x.id) && x.autor !== S.uid)
        .reverse()
        .forEach(x => {
          x.tipo === "doc" ? abrirDoc(x) : dicePop({ ...x, titulo: "(privado) " + x.titulo });
        });
    S.privRev = S.privRev || {};
    list.forEach(x => {
      const r = x.rev || 0;
      if (S.privPrimed && S.privRev[x.id] !== undefined && S.privRev[x.id] !== r && x.autor !== S.uid) {
        toast(`O mestre revelou um trecho de "${x.titulo}".`);
        if (S.docAberto === x.id) abrirDoc(x);
      }
      S.privRev[x.id] = r;
    });
    if (S.tool === "documentos") renderPanel();
    list.forEach(x => S.privSeen.add(x.id));
    S.privPrimed = true;
    S.priv = list;
    if (S.tool === "rolagens") renderLog();
  };
  S.privSeen = new Set();
  S.privPrimed = false;
  const a = S.db.listenCol(
    p + "/privado",
    { where: ["para", S.uid] },
    l => {
      S.privA = l;
      merge();
    },
    () => {}
  );
  const b = S.db.listenCol(
    p + "/privado",
    { where: ["autor", S.uid] },
    l => {
      S.privB = l;
      merge();
    },
    () => {}
  );
  const c = S.db.listenCol(
    p + "/privado",
    { where: ["para", "todos"] },
    l => {
      S.privC = l;
      S.privB = [...(S.privB || []).filter(x => x.para !== "todos"), ...l.filter(x => x.autor === S.uid)];
      const novos = l.filter(x => !S.privSeen.has(x.id) && x.autor !== S.uid);
      S.privA = [...(S.privA || []).filter(x => x.para !== "todos"), ...l];
      merge();
    },
    () => {}
  );
  S.privUnsub = () => {
    a();
    b();
    c();
  };
}
async function enviarPrivado(e) {
  // e: {para, tipo, titulo, det, total, flag, img, quem}
  const body = {
    autor: S.uid,
    quem: String(e.quem || "").slice(0, 60),
    para: e.para,
    paraNome: e.para === "todos" ? "todos" : nomeMembro(e.para),
    tipo: e.tipo || "chat",
    titulo: String(e.titulo || "").slice(0, 300),
    det: String(e.det || "").slice(0, 1500),
    total: e.total ?? null,
    flag: e.flag || "",
    ts: Date.now(),
    ...(e.img ? { img: e.img } : {})
  };
  try {
    await S.db.add(P() + "/privado", body);
  } catch (err) {
    fail(err);
  }
}
function destinos() {
  const ms = S.mesa && S.mesa.mestre;
  const out = [["", "Todos"]];
  if (S.isM) out.push(["__eu", "Só eu (secreta)"]);
  else if (ms) out.push([ms, "Só o mestre"]);
  (S.membros || [])
    .filter(m => m.id !== S.uid && m.id !== ms)
    .forEach(m => out.push([m.id, "Sussurro: " + m.nome]));
  return out;
}
function privRow(e) {
  const t = new Date(e.ts || 0).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const meu = e.autor === S.uid;
  const tag = `<span class="tag on" style="font-size:9px">${meu ? "privado para " + esc(e.paraNome || "") : "privado de " + esc(e.quem || "")}</span>`;
  if (e.tipo === "doc")
    return `<div class="entry chat priv"><span class="wh"><b>${esc(e.quem)}</b> · ${t} ${tag}</span><button class="btn sm" data-doc="${esc(e.id)}">Ver documento: ${esc(e.titulo)}</button></div>`;
  if (e.tipo === "chat")
    return `<div class="entry chat priv"><span class="wh"><b>${esc(e.quem || "Jogador")}</b> · ${t} ${tag}</span><span class="wt">${esc(e.titulo)}</span></div>`;
  return `<div class="entry priv ${esc(e.flag)}"><span class="wh"><b>${esc(e.quem || "")}</b> · ${t} ${tag}</span><span class="wt">${esc(e.titulo)}</span><span class="det">${esc(e.det)}</span><span class="tot">${e.total ?? "✦"}</span></div>`;
}
function novoDocumento() {
  docEditor();
}
