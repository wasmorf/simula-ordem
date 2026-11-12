<script>
function myName() {
  const f = Object.values(S.fichas).find(x => x.dono === S.uid && !x.npc);
  return S.isM ? "Mestre" : f ? f.nome : (S.authUser && S.authUser.displayName) || "Agente";
}
("use strict");
/* ===================== CONDIÇÕES NAS ROLAGENS =====================
   Regra do livro: condições com o mesmo efeito não se acumulam; vale a mais severa. */
const PEN_COND = {
  // [d20 a tirar, alcance] alcance: tudo | pericia | ataque | ataque-cac | AGI/FOR/VIG… | nome da perícia
  Abalado: [1, "tudo"],
  Apavorado: [2, "pericia"],
  Agarrado: [1, "ataque"],
  Cego: [2, "AGI FOR"],
  Debilitado: [2, "AGI FOR VIG"],
  Fraco: [1, "AGI FOR VIG"],
  Esmorecido: [2, "INT PRE"],
  Frustrado: [1, "INT PRE"],
  Enredado: [1, "ataque"],
  Ofuscado: [1, "ataque Percepção"],
  Fascinado: [2, "Percepção"],
  Surdo: [2, "Iniciativa"],
  Caído: [2, "ataque-cac"],
  Desprevenido: [1, "Reflexos"]
};
const DEF_COND = {
  Desprevenido: 5,
  Vulnerável: 5,
  Indefeso: 10,
  Agarrado: 5,
  Atordoado: 5,
  Cego: 5,
  Surpreendido: 5,
  Exausto: 5,
  Fatigado: 5,
  Enredado: 5,
  Paralisado: 10,
  Inconsciente: 10
};
function condsAtivas(f) {
  return [...new Set([...condAuto(f), ...(f.cond || [])])];
}
// tipo: "pericia" ou "ataque"; attr: atributo usado; nome: perícia; cac: ataque corpo a corpo
function penalidade(f, { tipo, attr, nome, cac }) {
  let max = 0;
  const quem = [];
  for (const c of condsAtivas(f)) {
    const p = PEN_COND[c];
    if (!p) continue;
    const [d, al] = p;
    const alc = al.split(" ");
    const vale =
      alc.includes("tudo") ||
      (tipo === "pericia" && alc.includes("pericia")) ||
      (tipo === "ataque" && alc.includes("ataque")) ||
      (tipo === "ataque" && cac && alc.includes("ataque-cac")) ||
      alc.includes(attr) ||
      alc.includes(nome);
    if (vale) {
      quem.push(c);
      max = Math.max(max, d);
    }
  }
  // proteção sem proficiência: −2d20 em testes de FOR e AGI
  const c0 = CLASSES[f.classe] || {};
  const semProf = (f.protecoes || []).some(
    p =>
      p.usando !== false &&
      (/pesada|Escudo/i.test(p.nome)
        ? !(f.poderes || []).includes("Proteção Pesada")
        : !(c0.prof || []).includes("leves"))
  );
  if (semProf && (attr === "FOR" || attr === "AGI")) {
    max = Math.max(max, 2);
    quem.push("proteção sem proficiência");
  }
  let mod = 0;
  const D = derivados(f);
  if (
    D.usados > D.carga &&
    tipo === "pericia" &&
    /carga/.test((PERICIAS.find(x => x[0] === nome) || [])[2] || "")
  ) {
    mod -= 5;
    quem.push("sobrecarregado −5");
  }
  return { dados: max, mod, quem };
}
function defCond(f) {
  let m = 0;
  for (const c of condsAtivas(f)) m = Math.max(m, DEF_COND[c] || 0);
  return m;
}

/* ===================== MORRENDO ===================== */
function morrendoHTML(f) {
  const pv = cur(f, "pv");
  if (pv > 0) return "";
  const n = +f.morrendo || 0;
  return `<div class="banner" style="border-color:var(--red);color:var(--fg);background:var(--red-soft)"><b>Morrendo.</b> Rodadas morrendo nesta cena: <b style="font-family:var(--f-mono)">${n}/3</b>${n > 3 ? " · <b>o agente morreu</b>" : ""}
   <div class="row" style="margin-top:6px"><button type="button" class="btn sm" id="mrMais">+1 rodada</button><button type="button" class="btn sm ghost" id="mrZera">Zerar</button></div>
   <div class="muted small" style="margin-top:4px">Mais de 3 rodadas morrendo na mesma cena, sem voltar a ter 1 PV, e o agente morre.</div></div>`;
}

/* ===================== ACESSO À MESA (mestre) ===================== */
function subscribeAcesso() {
  if (S.acUnsub || !S.isM) return;
  const p = P();
  const a = S.db.listenCol(
    p + "/entrada",
    null,
    l => {
      const novos = l.filter(x => !(S.entrada || []).some(y => y.id === x.id));
      S.entrada = l;
      if (novos.length && S.loaded.entrada) toast(`${novos[0].nome} quer entrar na mesa. Aprove no Escudo.`);
      S.loaded.entrada = true;
      renderRail();
      if (S.tool === "escudo") renderPanel();
    },
    () => {}
  );
  const b = S.db.listenCol(
    p + "/bloqueados",
    null,
    l => {
      S.bloqueados = l;
      if (S.tool === "escudo") renderPanel();
    },
    () => {}
  );
  S.acUnsub = () => {
    a();
    b();
  };
}
function subscribeMembros() {
  if (S.memUnsub) return;
  S.memUnsub = S.db.listenCol(
    P() + "/membros",
    null,
    l => {
      S.membros = l;
      if (["escudo", "rolagens"].includes(S.tool) && !isEditing()) renderPanel();
    },
    () => {}
  );
}
function nomeMembro(uid) {
  if (uid === (S.mesa && S.mesa.mestre)) return "Mestre";
  const m = (S.membros || []).find(x => x.id === uid);
  if (m) return m.nome;
  const f = Object.values(S.fichas).find(x => x.dono === uid && !x.npc);
  return f ? f.nome : "Jogador";
}
function acessoHTML() {
  const m = S.mesa || {};
  const ac = m.acesso || "livre";
  const link = location.origin + location.pathname + "#mesa-" + S.mesaId;
  const ent = S.entrada || [];
  const mem = (S.membros || []).filter(x => x.id !== S.uid);
  const blq = S.bloqueados || [];
  return `<details class="box" ${ent.length ? "open" : ""}><summary class="row between" style="cursor:pointer"><h3 style="display:inline">Acesso à mesa</h3><span class="muted small">${mem.length} jogador(es)${ent.length ? ` · <b style="color:var(--warn)">${ent.length} pedido(s)</b>` : ""}</span></summary>
   <div class="stack" style="margin-top:10px">
    <div class="row" style="flex-wrap:nowrap"><input type="text" readonly value="${esc(link)}" id="acLink" aria-label="Link da mesa"><button class="btn sm" id="acCopy">Copiar link</button></div>
    <div class="fields"><div class="field"><label class="label" for="acSel">Quem pode entrar</label><select id="acSel"><option value="livre" ${ac === "livre" ? "selected" : ""}>Quem tiver o link ou o código</option><option value="senha" ${ac === "senha" ? "selected" : ""}>Só com senha</option><option value="aprovacao" ${ac === "aprovacao" ? "selected" : ""}>Só quem eu aprovar</option></select></div>
     <div class="field" id="acSnW" ${ac === "senha" ? "" : "hidden"}><label class="label" for="acSn">Nova senha</label><div class="row" style="flex-wrap:nowrap"><input type="text" id="acSn" maxlength="40" autocomplete="off" placeholder="digite para trocar"><button class="btn sm" id="acSnOk">Salvar</button></div></div></div>
    <label class="check"><input type="checkbox" id="acList" ${m.listada ? "checked" : ""}> Mostrar na lista pública do site</label>
    ${ent.length ? `<div class="sub">Pedidos para entrar</div><div class="cards">${ent.map(x => `<div class="row between condrow" style="border-left-color:var(--warn);grid-template-columns:1fr auto"><b>${esc(x.nome)}</b><span class="row"><button class="btn sm primary" data-acok="${esc(x.id)}">Aprovar</button><button class="btn sm ghost" data-acno="${esc(x.id)}">Recusar</button></span></div>`).join("")}</div>` : ""}
    <div class="sub">Jogadores na mesa</div>${
      mem.length
        ? `<div class="cards">${mem
            .map(
              x =>
                `<div class="row between condrow" style="border-left-color:var(--purple);grid-template-columns:1fr auto"><span><b>${esc(x.nome)}</b>${(() => {
                  const f = Object.values(S.fichas)
                    .filter(y => y.dono === x.id && !y.npc)
                    .map(y => y.nome);
                  return f.length ? ` <span class="muted small">· ${esc(f.join(", "))}</span>` : "";
                })()}</span><span class="row"><button class="btn sm ghost" data-acexp="${esc(x.id)}">Expulsar</button><button class="btn sm danger" data-acblq="${esc(x.id)}">Bloquear</button></span></div>`
            )
            .join("")}</div>`
        : `<div class="muted small">Ninguém entrou ainda. Mande o link.</div>`
    }
    ${blq.length ? `<div class="sub">Bloqueados</div><div class="cards">${blq.map(x => `<div class="row between condrow" style="grid-template-columns:1fr auto"><span>${esc(x.nome || "Jogador")}</span><button class="btn sm" data-acdes="${esc(x.id)}">Desbloquear</button></div>`).join("")}</div>` : ""}
   </div></details>`;
}
async function salvarAcesso(patch) {
  try {
    await S.db.merge(P(), patch);
    await S.db.merge("portas/" + S.mesaId, patch);
    toast("Acesso atualizado.");
  } catch (e) {
    fail(e);
  }
}
function bindAcesso() {
  const cp = $("#acCopy");
  if (!cp) return;
  cp.onclick = () => {
    const v = $("#acLink").value;
    (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject())
      .then(() => toast("Link copiado."))
      .catch(() => {
        $("#acLink").select();
        toast("Selecione e copie o link.");
      });
  };
  $("#acSel").onchange = async () => {
    const v = $("#acSel").value;
    $("#acSnW").hidden = v !== "senha";
    if (v === "senha") {
      const sg = await S.db.get(P() + "/segredo/senha").catch(() => null);
      if (!sg) {
        toast("Defina a senha e toque em Salvar.");
        $("#acSn").focus();
        return;
      }
    }
    salvarAcesso({ acesso: v });
  };
  $("#acSnOk").onclick = async () => {
    const v = $("#acSn").value.trim();
    if (v.length < 3) {
      toast("A senha precisa de pelo menos 3 caracteres.");
      return;
    }
    try {
      await S.db.set(P() + "/segredo/senha", { valor: v });
      await salvarAcesso({ acesso: "senha" });
      $("#acSn").value = "";
    } catch (e) {
      fail(e);
    }
  };
  $("#acList").onchange = () => salvarAcesso({ listada: $("#acList").checked });
  $$("[data-acok]").forEach(
    b =>
      (b.onclick = async () => {
        const x = (S.entrada || []).find(y => y.id === b.dataset.acok);
        if (!x) return;
        try {
          await S.db.set(P() + "/membros/" + x.id, { nome: x.nome, ts: Date.now() });
          await S.db.del(P() + "/entrada/" + x.id);
          toast(`${x.nome} entrou na mesa.`);
        } catch (e) {
          fail(e);
        }
      })
  );
  $$("[data-acno]").forEach(
    b => (b.onclick = () => S.db.del(P() + "/entrada/" + b.dataset.acno).catch(fail))
  );
  $$("[data-acexp]").forEach(
    b =>
      (b.onclick = async () => {
        const uid = b.dataset.acexp;
        if (
          !(await confirmBox(
            `Expulsar ${nomeMembro(uid)}?`,
            "Sai da mesa agora. As fichas dele continuam aqui. Se a mesa estiver aberta para quem tiver o link, ele pode voltar.",
            "Expulsar"
          ))
        )
          return;
        try {
          await S.db.del(P() + "/membros/" + uid);
          await S.db.del(P() + "/call/" + uid).catch(() => {});
        } catch (e) {
          fail(e);
        }
      })
  );
  $$("[data-acblq]").forEach(
    b =>
      (b.onclick = async () => {
        const uid = b.dataset.acblq;
        const nome = nomeMembro(uid);
        if (
          !(await confirmBox(
            `Bloquear ${nome}?`,
            "Sai da mesa agora e não consegue mais entrar, nem com link ou senha.",
            "Bloquear"
          ))
        )
          return;
        try {
          await S.db.set(P() + "/bloqueados/" + uid, { nome, ts: Date.now() });
          await S.db.del(P() + "/membros/" + uid);
          await S.db.del(P() + "/call/" + uid).catch(() => {});
        } catch (e) {
          fail(e);
        }
      })
  );
  $$("[data-acdes]").forEach(
    b => (b.onclick = () => S.db.del(P() + "/bloqueados/" + b.dataset.acdes).catch(fail))
  );
}

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
  return P() + (f && f.npc ? "/npcs/" : "/fichas/") + id;
}

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

/* ===================== TRILHA SONORA ===================== */
const MZ = { el: null, yt: null, ytReady: false, cur: null, unlocked: false, vol: +lsGet("ms_mvol", 0.6) };
function ytId(u) {
  const m = String(u).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}
function subscribeTrilha() {
  subscribeMapDocs(); // documentos no mapa (5s-docs-mapa.js)
  if (S.trilhaUnsub) return;
  S.trilhaUnsub = S.db.listenDoc(
    P() + "/estado/trilhas",
    d => {
      S.trilha = d || { lista: [], tocando: null };
      aplicarTrilha();
      if (S.tool === "trilha") renderPanel();
      renderBoardTop();
    },
    () => {}
  );
}
function posAlvo(t) {
  return (t.pos || 0) + (t.play ? Math.max(0, (Date.now() - (t.at || Date.now())) / 1000) : 0);
}
function pararLocal() {
  if (MZ.el) {
    MZ.el.pause();
    MZ.el.removeAttribute("src");
    MZ.el.load();
  }
  if (MZ.yt && MZ.ytReady) {
    try {
      MZ.yt.stopVideo();
    } catch (e) {}
  }
  MZ.cur = null;
}
function aplicarTrilha() {
  const t = S.trilha && S.trilha.tocando;
  if (!t || !t.src) {
    pararLocal();
    return;
  }
  const vid = ytId(t.src);
  const vol = Math.max(0, Math.min(1, MZ.vol * (t.vol ?? 1)));
  if (vid) {
    if (MZ.el) MZ.el.pause();
    carregarYT(() => {
      if (MZ.cur !== t.src) {
        MZ.cur = t.src;
        MZ.yt.loadVideoById({ videoId: vid, startSeconds: posAlvo(t) });
        if (!t.play) setTimeout(() => MZ.yt.pauseVideo(), 400);
      }
      MZ.yt.setVolume(Math.round(vol * 100));
      const ct = MZ.yt.getCurrentTime ? MZ.yt.getCurrentTime() : 0;
      if (Math.abs(ct - posAlvo(t)) > 3) MZ.yt.seekTo(posAlvo(t), true);
      if (t.play) MZ.yt.playVideo();
      else MZ.yt.pauseVideo();
    });
    return;
  }
  if (MZ.yt && MZ.ytReady) {
    try {
      MZ.yt.stopVideo();
    } catch (e) {}
  }
  if (!MZ.el) {
    MZ.el = new Audio();
    MZ.el.preload = "auto";
    MZ.el.onerror = () => {
      if (S.isM)
        toast("Não consegui tocar essa música. Use um link direto de MP3/OGG ou de vídeo do YouTube.");
    };
  }
  MZ.el.loop = !!t.loop;
  MZ.el.volume = vol;
  const go = () => {
    if (Math.abs(MZ.el.currentTime - posAlvo(t)) > 2) {
      try {
        MZ.el.currentTime = t.loop && MZ.el.duration ? posAlvo(t) % MZ.el.duration : posAlvo(t);
      } catch (e) {}
    }
    if (t.play)
      MZ.el
        .play()
        .then(() => {
          MZ.unlocked = true;
          renderBoardTop();
        })
        .catch(() => {
          MZ.bloqueado = true;
          renderBoardTop();
        });
    else MZ.el.pause();
  };
  if (MZ.cur !== t.src) {
    MZ.cur = t.src;
    MZ.el.src = t.src;
    MZ.el.addEventListener("loadedmetadata", go, { once: true });
    MZ.el.load();
  } else go();
}
function carregarYT(cb) {
  if (MZ.ytReady) return cb();
  (MZ.ytQ = MZ.ytQ || []).push(cb);
  if (MZ.ytLoading) return;
  MZ.ytLoading = true;
  let div = $("#ytBox");
  if (!div) {
    div = document.createElement("div");
    div.id = "ytBox";
    div.style.cssText =
      "position:fixed;width:1px;height:1px;left:-10px;bottom:0;opacity:0;pointer-events:none";
    div.innerHTML = '<div id="ytP"></div>';
    document.body.appendChild(div);
  }
  window.onYouTubeIframeAPIReady = () => {
    MZ.yt = new YT.Player("ytP", {
      width: 1,
      height: 1,
      playerVars: { autoplay: 1, controls: 0, playsinline: 1 },
      events: {
        onReady: () => {
          MZ.ytReady = true;
          (MZ.ytQ || []).forEach(f => f());
          MZ.ytQ = [];
        },
        onStateChange: e => {
          const t = S.trilha && S.trilha.tocando;
          if (e.data === 0 && t && t.loop) MZ.yt.seekTo(0, true);
          if (e.data === 1) {
            MZ.unlocked = true;
            MZ.bloqueado = false;
            renderBoardTop();
          }
        },
        onError: e => {
          if (S.isM)
            toast(
              e.data === 101 || e.data === 150
                ? "Esse vídeo do YouTube não permite tocar fora do YouTube. Escolha outro."
                : "Não consegui tocar esse vídeo."
            );
        },
        onAutoplayBlocked: () => {
          MZ.bloqueado = true;
          renderBoardTop();
        }
      }
    });
  };
  const s = document.createElement("script");
  s.src = "https://www.youtube.com/iframe_api";
  s.onerror = () => toast("Não consegui carregar o YouTube.");
  document.head.appendChild(s);
}
function destravarSom() {
  MZ.bloqueado = false;
  MZ.unlocked = true;
  const t = S.trilha && S.trilha.tocando;
  if (!t) return;
  if (ytId(t.src) && MZ.ytReady) {
    MZ.yt.playVideo();
  } else if (MZ.el) {
    MZ.el.play().catch(() => {});
  }
  aplicarTrilha();
  renderBoardTop();
}
document.addEventListener(
  "pointerdown",
  () => {
    if (MZ.bloqueado) destravarSom();
  },
  { capture: true }
);
async function salvarTrilha(p) {
  const d = {
    lista: (S.trilha && S.trilha.lista) || [],
    tocando: (S.trilha && S.trilha.tocando) || null,
    ...p
  };
  S.trilha = d;
  aplicarTrilha();
  renderPanel();
  renderBoardTop();
  try {
    await S.db.set(P() + "/estado/trilhas", d);
  } catch (e) {
    fail(e);
  }
}
/* Músicas livres (sem anúncio): arquivos MP3 na pasta audio/ do próprio site.
   Todas de Kevin MacLeod (incompetech.com), licença Creative Commons BY 4.0.
   [ocasião, nome da música, arquivo] */
const TRILHAS_LIVRES = [
  ["Calma", "Healing", "healing.mp3"],
  ["Calma", "Dreamy Flashback", "dreamy-flashback.mp3"],
  ["Investigação", "Investigations", "investigations.mp3"],
  ["Investigação", "Hiding Your Reality", "hiding-your-reality.mp3"],
  ["Tensão", "Long Note Four", "long-note-four.mp3"],
  ["Tensão", "Gathering Darkness", "gathering-darkness.mp3"],
  ["Tensão", "Dark Times", "dark-times.mp3"],
  ["Terror", "Ossuary 6 - Air", "ossuary-6-air.mp3"],
  ["Terror", "Darkest Child", "darkest-child.mp3"],
  ["Terror", "Ghost Story", "ghost-story.mp3"],
  ["Ritual", "Satiate", "satiate.mp3"],
  ["Ritual", "Rites", "rites.mp3"],
  ["Combate", "Volatile Reaction", "volatile-reaction.mp3"],
  ["Combate", "Five Armies", "five-armies.mp3"],
  ["Combate", "Clash Defiant", "clash-defiant.mp3"],
  ["Combate", "Unholy Knight", "unholy-knight.mp3"],
  ["Triste", "Sad Trio", "sad-trio.mp3"],
  ["Triste", "Lightless Dawn", "lightless-dawn.mp3"]
];
const livreUrl = arq => new URL("audio/" + arq, location.href.split("#")[0]).href;
// Confere uma vez por sessão quais arquivos já estão na pasta audio/ do site.
async function checarTrilhasLivres() {
  if (S.livresOk) return;
  S.livresOk = {};
  await Promise.all(
    TRILHAS_LIVRES.map(async ([, , arq]) => {
      try {
        const r = await fetch(livreUrl(arq), { method: "HEAD", cache: "no-store" });
        S.livresOk[arq] = r.ok && !/text\/html/.test(r.headers.get("content-type") || "");
      } catch (e) {
        S.livresOk[arq] = false;
      }
    })
  );
  if (S.tool === "trilha") renderPanel();
}
// Ocasião de uma música livre (só o mestre vê).
function ocasiaoDe(src) {
  const x = TRILHAS_LIVRES.find(([, , arq]) => src === livreUrl(arq));
  return x ? x[0] : "";
}
function trilhasLivresHTML() {
  if (!S.livresOk) {
    checarTrilhasLivres();
    return `<div class="sub">Músicas livres (sem anúncio)</div><div class="muted small">Procurando as músicas…</div>`;
  }
  const tem = TRILHAS_LIVRES.filter(([, , a]) => S.livresOk[a]);
  const faltam = TRILHAS_LIVRES.filter(([, , a]) => !S.livresOk[a]);
  const cats = [...new Set(tem.map(x => x[0]))];
  return `<div class="sub">Músicas livres (sem anúncio)</div>
   ${
     tem.length
       ? cats
           .map(
             c => `<div class="stack" style="gap:4px"><span class="label">${esc(c)}</span>
       ${tem
         .filter(x => x[0] === c)
         .map(
           ([, n, a]) =>
             `<div class="tokrow" style="grid-template-columns:minmax(0,1fr) auto"><div style="min-width:0;font-weight:600">${esc(n)}</div><div class="row" style="flex-wrap:nowrap"><button class="btn sm primary" data-mzl="${esc(a)}">Tocar</button><button class="btn sm ghost" data-mzls="${esc(a)}">Salvar</button></div></div>`
         )
         .join("")}</div>`
           )
           .join("")
       : `<div class="muted small">Nenhuma música livre no site ainda.</div>`
   }
   ${
     faltam.length
       ? `<details class="box"><summary class="small"><b>${faltam.length === TRILHAS_LIVRES.length ? "Como colocar as músicas livres" : `Faltam ${faltam.length} músicas`}</b></summary>
     <p class="muted small">Baixe cada música em incompetech.com (procure pelo nome e toque em Download), salve com o nome da direita e suba na pasta <b>audio</b> do repositório do site no GitHub.</p>
     <div class="stack small" style="gap:2px">${faltam.map(([c, n, a]) => `<div>${esc(c)} · ${esc(n)} → <code>audio/${esc(a)}</code></div>`).join("")}</div></details>`
       : ""
   }
   <p class="muted small" style="margin:0">Músicas de Kevin MacLeod (incompetech.com), licença Creative Commons BY 4.0.</p>`;
}

function trilhaHTML() {
  const t = S.trilha || { lista: [], tocando: null };
  const tc = t.tocando;
  const agora = tc
    ? `<div class="box stack"><span class="label">Tocando agora${S.isM && ocasiaoDe(tc.src) ? " · " + esc(ocasiaoDe(tc.src)) : ""}</span><b style="font-size:16px">${esc(tc.titulo || "Música")}</b>
     <span class="muted small">${tc.play ? "tocando" : "pausada"}${tc.loop ? " · repetindo" : ""}</span>
     ${
       S.isM
         ? `<div class="row"><button class="btn sm primary" id="mzPlay">${tc.play ? "Pausar" : "Tocar"}</button><button class="btn sm" id="mzStop">Parar</button><label class="check small"><input type="checkbox" id="mzLoop" ${tc.loop ? "checked" : ""}> Repetir</label></div>
     <label class="row small muted" style="gap:6px;flex-wrap:nowrap">Volume para todos <input type="range" id="mzVolM" min="0" max="1" step="0.05" value="${tc.vol ?? 1}" style="flex:1"></label>`
         : ""
     }</div>`
    : `<div class="empty">Nenhuma música tocando.</div>`;
  return `${agora}
   <label class="row small" style="gap:6px;flex-wrap:nowrap">Meu volume <input type="range" id="mzVol" min="0" max="1" step="0.05" value="${MZ.vol}" style="flex:1" aria-label="Meu volume da trilha"></label>
   ${MZ.bloqueado ? `<button class="btn primary block" id="mzUnlock">Ativar o som da mesa</button>` : ""}
   ${
     S.isM
       ? `${trilhasLivresHTML()}<div class="sub">Trilhas da mesa</div>
    ${(t.lista || []).length ? `<div class="cards">${t.lista.map((x, i) => `<div class="tokrow" style="grid-template-columns:auto minmax(0,1fr) auto"><span class="amedot" style="--c:${ytId(x.src) ? "#ff4d5e" : "#b47dff"};font-size:13px">${ytId(x.src) ? "YT" : "♪"}</span><div style="min-width:0"><div style="font-weight:600">${esc(x.titulo)}</div><div class="muted small" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.src)}</div></div><div class="row" style="flex-wrap:nowrap"><button class="btn sm primary" data-mzt="${i}">Tocar</button><button class="btn sm ghost" data-mzd="${i}" aria-label="Remover">✕</button></div></div>`).join("")}</div>` : `<div class="muted small">Nenhuma trilha salva ainda.</div>`}
    <form class="box stack" id="fMz"><div class="field"><label class="label" for="mzT">Nome</label><input type="text" id="mzT" maxlength="60" placeholder="Ex.: Tensão na floresta" required></div>
     <div class="field"><label class="label" for="mzU">Link</label><input type="url" id="mzU" placeholder="Link do YouTube ou de um arquivo MP3/OGG" required></div>
     <button class="btn">Adicionar trilha</button></form>
    <p class="muted small" style="margin:0">Funciona com vídeos do YouTube que permitem incorporação e com links diretos de áudio (por exemplo, MP3 do seu GitHub). Todos ouvem ao mesmo tempo; cada um ajusta o próprio volume.</p>`
       : `<p class="muted small" style="margin:0">O mestre escolhe a trilha. Se não ouvir nada, toque em qualquer lugar da página.</p>`
   }`;
}
function bindTrilha() {
  const v = $("#mzVol");
  if (v)
    v.oninput = () => {
      MZ.vol = +v.value;
      lsSet("ms_mvol", MZ.vol);
      aplicarTrilha();
    };
  const u = $("#mzUnlock");
  if (u) u.onclick = destravarSom;
  if (!S.isM) return;
  const t = S.trilha || { lista: [] };
  const f = $("#fMz");
  if (f)
    f.onsubmit = e => {
      e.preventDefault();
      const titulo = $("#mzT").value.trim(),
        src = $("#mzU").value.trim();
      if (!/^https:\/\//.test(src)) {
        toast("Use um link que comece com https://");
        return;
      }
      salvarTrilha({ lista: [...(t.lista || []), { titulo, src }] });
    };
  $$("[data-mzt]").forEach(
    b =>
      (b.onclick = () => {
        const x = t.lista[+b.dataset.mzt];
        destravarSom();
        salvarTrilha({ tocando: { ...x, play: true, pos: 0, at: Date.now(), loop: true, vol: 1 } });
      })
  );
  const livre = a => TRILHAS_LIVRES.find(x => x[2] === a);
  $$("[data-mzl]").forEach(
    b =>
      (b.onclick = () => {
        const x = livre(b.dataset.mzl);
        destravarSom();
        salvarTrilha({
          tocando: {
            titulo: x[1],
            src: livreUrl(x[2]),
            play: true,
            pos: 0,
            at: Date.now(),
            loop: true,
            vol: 1
          }
        });
      })
  );
  $$("[data-mzls]").forEach(
    b =>
      (b.onclick = () => {
        const x = livre(b.dataset.mzls);
        if ((t.lista || []).some(y => y.src === livreUrl(x[2]))) {
          toast("Essa música já está nas trilhas da mesa.");
          return;
        }
        salvarTrilha({ lista: [...(t.lista || []), { titulo: x[1], src: livreUrl(x[2]) }] });
      })
  );
  $$("[data-mzd]").forEach(
    b =>
      (b.onclick = () => {
        const l = [...t.lista];
        l.splice(+b.dataset.mzd, 1);
        salvarTrilha({ lista: l });
      })
  );
  const tc = t.tocando;
  if (!tc) return;
  $("#mzPlay").onclick = () => {
    const pos = posAlvo(tc);
    salvarTrilha({ tocando: { ...tc, play: !tc.play, pos, at: Date.now() } });
  };
  $("#mzStop").onclick = () => salvarTrilha({ tocando: null });
  $("#mzLoop").onchange = e =>
    salvarTrilha({ tocando: { ...tc, loop: e.target.checked, pos: posAlvo(tc), at: Date.now() } });
  $("#mzVolM").onchange = e =>
    salvarTrilha({ tocando: { ...tc, vol: +e.target.value, pos: posAlvo(tc), at: Date.now() } });
}
</script>
