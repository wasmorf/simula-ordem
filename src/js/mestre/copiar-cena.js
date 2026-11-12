"use strict";
/* Copiar cena ou mapa para outra mesa do mesmo mestre. */
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
  if (toqueDuplo("copiarCena")) return; // evita rodar duas vezes num toque duplo
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
  if (toqueDuplo("copiarMapa")) return; // evita rodar duas vezes num toque duplo
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
