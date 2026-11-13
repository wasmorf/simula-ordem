"use strict";
/* Resultado de dado que aparece na tela de todos e registro da mesa. */
/* ===================== POPUP DE DADOS ===================== */
/* Visual do dado: cada um escolhe (painel Rolagens) e todos veem a cor de quem rolou. */
const SKINS_DADO = [
  ["", "Padrão (roxo)"],
  ["sangue", "Sangue"],
  ["morte", "Morte"],
  ["conhecimento", "Conhecimento"],
  ["energia", "Energia"],
  ["medo", "Medo"],
  ["ametista", "Ametista"],
  ["rubi", "Rubi"],
  ["esmeralda", "Esmeralda"],
  ["obsidiana", "Obsidiana"]
];
const skinDado = () => lsGet("ms_skin", "");
const skinClasse = s => (SKINS_DADO.some(([k]) => k && k === s) ? " skin-" + s : "");
/* Som de dado: feito na hora (sem arquivo), com botão de mudo no painel Rolagens. */
const somMudo = () => !!lsGet("ms_mudo", false);
function somDado() {
  if (somMudo()) return;
  try {
    const A = (somDado.ctx = somDado.ctx || new (window.AudioContext || window.webkitAudioContext)());
    if (A.state === "suspended") A.resume();
    // três batidinhas curtas de "dado na mesa", cada uma um pouco mais fraca
    [0, 0.07, 0.15].forEach((t, i) => {
      const n = A.createBufferSource();
      const len = Math.floor(A.sampleRate * 0.05);
      const buf = A.createBuffer(1, len, A.sampleRate);
      const d = buf.getChannelData(0);
      for (let k = 0; k < len; k++) d[k] = (Math.random() * 2 - 1) * Math.pow(1 - k / len, 4);
      n.buffer = buf;
      const flt = A.createBiquadFilter();
      flt.type = "bandpass";
      flt.frequency.value = 1800 + i * 400;
      const g = A.createGain();
      g.gain.value = 0.35 / (i + 1);
      n.connect(flt).connect(g).connect(A.destination);
      n.start(A.currentTime + t);
    });
  } catch (e) {}
}
function dicePop(e) {
  if (e.tipo === "chat") {
    if (e.autor !== S.uid) toast(`${e.quem || "Alguém"}: ${e.titulo}`);
    return;
  }
  const h = $("#dicePops");
  const el = document.createElement("div");
  el.className = "dpop " + (e.flag || "") + skinClasse(e.skin);
  el.title = e.det || ""; // passar o mouse mostra o detalhe inteiro
  el.innerHTML = `<span style="color:var(--purple-hi)">${I.dado}</span><div style="min-width:0"><div class="t">${esc(e.quem || "Mestre")} · ${esc(e.titulo)}</div><div class="s">${esc(e.det)}</div></div><div class="n">${e.total ?? "✦"}</div>`;
  h.prepend(el);
  while (h.children.length > 3) h.lastChild.remove();
  el.onclick = () => el.remove();
  setTimeout(() => el.remove(), 6500);
  if (e.tipo !== "chat") somDado();
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
        tipo: e.tipo || "roll",
        skin: skinDado()
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
    flag: e.flag || "",
    ...(skinDado() ? { skin: skinDado() } : {})
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
