"use strict";
/* Resultado de dado que aparece na tela de todos e registro da mesa. */
/* ===================== POPUP DE DADOS ===================== */
function dicePop(e) {
  if (e.tipo === "chat") {
    if (e.autor !== S.uid) toast(`${e.quem || "Alguém"}: ${e.titulo}`);
    return;
  }
  const h = $("#dicePops");
  const el = document.createElement("div");
  el.className = "dpop " + (e.flag || "");
  el.innerHTML = `<span style="color:var(--purple-hi)">${I.dado}</span><div style="min-width:0"><div class="t">${esc(e.quem || "Mestre")} · ${esc(e.titulo)}</div><div class="s">${esc(e.det)}</div></div><div class="n">${e.total ?? "✦"}</div>`;
  h.prepend(el);
  while (h.children.length > 3) h.lastChild.remove();
  el.onclick = () => el.remove();
  setTimeout(() => el.remove(), 6500);
}
async function logEntry(e) {
  if (S.solo) {
    // personagem fora de mesa (mesa/personagens): sem registro, só mostra o dado na tela
    if (e.tipo !== "chat")
      dicePop({
        ts: Date.now(),
        quem: e.quem,
        titulo: e.titulo,
        total: e.total ?? null,
        det: e.det || "",
        flag: e.flag || "",
        tipo: e.tipo || "roll"
      });
    return;
  }
  if (!S.mesaId) return;
  const body = {
    ts: Date.now(),
    autor: S.uid,
    quem: String(e.quem || "").slice(0, 60),
    titulo: String(e.titulo || "").slice(0, 300),
    total: e.total ?? null,
    det: String(e.det || "").slice(0, 600),
    tipo: e.tipo || "roll",
    flag: e.flag || ""
  };
  if (e.para && e.para !== "__eu") {
    return enviarPrivado({ ...e, tipo: e.tipo || "roll" });
  }
  if (e.para === "__eu") e.secreto = true;
  if (e.secreto) {
    S.secret.unshift({ ...body, id: "s" + rid(6) });
    S.secret = S.secret.slice(0, 40);
    dicePop(body);
    if (S.tool === "escudo") renderPanel();
    return;
  }
  try {
    await S.db.add(P() + "/log", body);
  } catch (err) {
    fail(err);
  }
}
