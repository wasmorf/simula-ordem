"use strict";
/* Backup: baixar e restaurar fichas e mesas inteiras (.json). */
/* ===================== BACKUP ===================== */
function baixar(nome, obj) {
  const blob = new Blob([JSON.stringify(obj)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 2000);
}
function slug(s) {
  return (
    String(s || "x")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase()
      .slice(0, 40) || "x"
  );
}
function pickFile(accept) {
  return new Promise(res => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = accept;
    inp.onchange = () => res(inp.files[0] || null);
    inp.click();
  });
}
async function lerJSON(accept = ".json,application/json") {
  const f = await pickFile(accept);
  if (!f) return null;
  try {
    return JSON.parse(await f.text());
  } catch (e) {
    toast("Esse arquivo não é um backup do Simula Ordem.");
    return null;
  }
}
function exportarFicha(id) {
  const f = S.fichas[id];
  if (!f) return;
  const rest = limparPersonagem(f);
  baixar(`ficha-${slug(f.nome)}.json`, {
    tipo: "simula-ordem-ficha",
    v: 1,
    exportada: Date.now(),
    ficha: rest
  });
  toast("Ficha baixada.");
}
async function importarFicha() {
  const d = await lerJSON();
  if (!d) return;
  if (d.tipo !== "simula-ordem-ficha" || !d.ficha) {
    toast("Esse arquivo não é uma ficha do Simula Ordem.");
    return;
  }
  const id = "f" + rid(8);
  const f = { ...limparPersonagem(d.ficha), dono: S.uid, criada: Date.now() };
  S.fichas[id] = migrar(f);
  S.openFicha = id;
  S.sheetTab = "principal";
  renderPanel();
  saveFicha(id, true);
  toast(`${f.nome} importado.`);
}
async function exportarMesa() {
  if (!S.isM) return;
  toast("Juntando tudo da mesa…");
  const p = P();
  const g = async c => (await S.db.getCol(p + "/" + c)).map(x => ({ ...x }));
  try {
    const mesa = await S.db.get(p);
    const cenas = await g("cenas");
    const imgs = {},
      pos = {},
      nev = {};
    for (const c of cenas) {
      imgs[c.id] = await S.db.get(p + "/cenaImg/" + c.id);
      pos[c.id] = await S.db.get(p + "/pos/" + c.id);
      nev[c.id] = await S.db.get(p + "/nevoa/" + c.id);
    }
    const dump = {
      tipo: "simula-ordem-mesa",
      v: 1,
      exportada: Date.now(),
      id: S.mesaId,
      mesa,
      cenas,
      cenaImg: imgs,
      pos,
      nevoa: nev,
      fichas: await g("fichas"),
      npcs: await g("npcs"),
      tokens: await g("tokens"),
      homebrew: await g("homebrew"),
      desenhos: await g("desenhos"),
      mapas: await g("mapas"),
      docs: await g("docs"),
      notas: await S.db.get(p + "/mestre/notas"),
      combate: await S.db.get(p + "/estado/combate"),
      musica: await S.db.get(p + "/estado/trilhas")
    };
    baixar(`mesa-${slug(mesa && mesa.nome)}-${new Date().toISOString().slice(0, 10)}.json`, dump);
    toast("Backup da mesa baixado.");
  } catch (e) {
    fail(e);
  }
}
async function importarMesa() {
  const d = await lerJSON();
  if (!d) return;
  if (d.tipo !== "simula-ordem-mesa" || !d.mesa) {
    toast("Esse arquivo não é um backup de mesa do Simula Ordem.");
    return;
  }
  if (
    !(await confirmBox(
      `Restaurar "${d.mesa.nome}"?`,
      "Cria uma mesa nova, com você como mestre, com tudo do backup. Os jogadores entram pelo novo link e continuam donos das fichas deles.",
      "Restaurar"
    ))
  )
    return;
  toast("Restaurando a mesa…");
  try {
    const id = await criarMesa({ nome: d.mesa.nome, desc: d.mesa.desc, acesso: "livre", listada: false });
    const p = "mesas/" + id;
    const put = async (col, list) => {
      for (const x of list || []) {
        const { id: i, ...r } = x;
        await S.db.set(p + "/" + col + "/" + i, r);
      }
    };
    await put("cenas", d.cenas);
    for (const c of d.cenas || []) {
      if (d.cenaImg && d.cenaImg[c.id]) await S.db.set(p + "/cenaImg/" + c.id, d.cenaImg[c.id]);
      if (d.pos && d.pos[c.id]) await S.db.set(p + "/pos/" + c.id, d.pos[c.id]);
      if (d.nevoa && d.nevoa[c.id]) await S.db.set(p + "/nevoa/" + c.id, d.nevoa[c.id]);
    }
    await put("fichas", d.fichas);
    await put("npcs", d.npcs);
    await put("tokens", d.tokens);
    await put("homebrew", d.homebrew);
    await put("desenhos", d.desenhos);
    await put("mapas", d.mapas);
    await put("docs", d.docs);
    if (d.notas) await S.db.set(p + "/mestre/notas", d.notas);
    if (d.combate) await S.db.set(p + "/estado/combate", d.combate);
    if (d.musica) await S.db.set(p + "/estado/trilhas", d.musica);
    if (d.mesa.cenaAtiva) await S.db.merge(p, { cenaAtiva: d.mesa.cenaAtiva });
    location.hash = "mesa-" + id;
    toast("Mesa restaurada. Mande o novo link para os jogadores.");
  } catch (e) {
    fail(e);
  }
}
