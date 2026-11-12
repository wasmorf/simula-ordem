"use strict";
/* NPCs do mestre: receber do banco e onde cada ficha é salva. */
/* ===================== NPCs DO MESTRE ===================== */
function syncNpcs() {
  const modo = S.isM ? "all" : "vis";
  if (S.npcMode === modo) return;
  if (S.npcUnsub) S.npcUnsub();
  S.npcMode = modo;
  const on = list => {
    const next = {};
    Object.entries(S.fichas).forEach(([k, f]) => {
      if (!f.npc) next[k] = f;
    });
    list.forEach(x => {
      const { id, ...r } = x;
      const old = S.fichas[id];
      if (old && S.dirty[id]) next[id] = old;
      else if (old && old.npc) {
        for (const k of Object.keys(old)) if (!(k in r) && k !== "npc") delete old[k];
        Object.assign(old, r, { npc: true });
        next[id] = old;
      } else next[id] = { ...r, npc: true };
    });
    S.fichas = next;
    renderBoard();
    if (["agentes", "escudo", "combate", "tokens", "rolagens"].includes(S.tool) && !isEditing())
      renderPanel();
  };
  S.npcUnsub = S.db.listenCol(P() + "/npcs", S.isM ? null : { where: ["visivel", true] }, on, () => {});
}
function fichaPath(id) {
  const f = S.fichas[id];
  if (f && f.solo) return "usuarios/" + S.uid + "/personagens/" + id; // personagem fora de mesa (mesa/personagens)
  return P() + (f && f.npc ? "/npcs/" : "/fichas/") + id;
}
