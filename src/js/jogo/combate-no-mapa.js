"use strict";
/* Combate no mapa: de quem é a vez, centrar no token, pôr tokens no combate. */
/* ===================== COMBATE NO MAPA ===================== */
function vezAtual() {
  const c = S.combate;
  if (!c || !(c.lista || []).length) return null;
  return c.lista[c.turno || 0] || null;
}
function tokenDaVez(t) {
  const x = vezAtual();
  if (!x) return false;
  return (x.fichaId && t.fichaId === x.fichaId) || (x.id && t.combId === x.id);
}
function centrarNo(tid) {
  const p = S.pos[tid];
  if (!p) return;
  const r = board.getBoundingClientRect();
  V.x = r.width / 2 - p.x * V.z;
  V.y = r.height / 2 - p.y * V.z;
  S.userMoved = true;
  applyView();
  S.sel = tid;
  renderBoard();
}
function tokenDeEntrada(x) {
  for (const tid of Object.keys(S.pos)) {
    const t = S.tokens.find(y => y.id === tid);
    if (t && ((x.fichaId && t.fichaId === x.fichaId) || (t.combId && t.combId === x.id))) return tid;
  }
  return null;
}
function addTokensAoCombate() {
  const c = combBase();
  let n = 0;
  for (const tid of Object.keys(S.pos)) {
    const t = S.tokens.find(y => y.id === tid);
    if (!t) continue;
    if (t.fichaId && S.fichas[t.fichaId]) {
      if (!c.lista.some(x => x.fichaId === t.fichaId)) {
        c.lista.push({
          id: rid(5),
          tipo: S.fichas[t.fichaId].npc ? "npcf" : "pc",
          fichaId: t.fichaId,
          nome: S.fichas[t.fichaId].nome,
          ini: null
        });
        n++;
      }
    } else if (t.combId && c.lista.some(x => x.id === t.combId)) {
    } else if (t.ameaca) {
      const b = allBest().find(y => y.n === t.ameaca);
      if (!b) continue;
      const cid = rid(5);
      c.lista.push({
        id: cid,
        tipo: "npc",
        base: b.n,
        nome: t.nome,
        pv: b.pv,
        pvMax: b.pv,
        def: b.def,
        atk: b.atk,
        el: b.el,
        vd: b.vd,
        agi: b.at[0],
        ini: null
      });
      t.combId = cid;
      S.db.merge(P() + "/tokens/" + t.id, { combId: cid }).catch(() => {});
      n++;
    }
  }
  if (!n) {
    toast("Todos os tokens da cena já estão no combate (ou não têm ficha nem ameaça ligada).");
    return;
  }
  saveCombate(c);
  toast(`${n} entraram no combate. Agora role a iniciativa.`);
}
