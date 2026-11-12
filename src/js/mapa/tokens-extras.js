"use strict";
/* Tokens: não redesenhar durante o arrasto e foto de NPC no token. */
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
