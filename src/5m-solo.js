<script>
"use strict";
/* =====================================================================
   PERSONAGENS SEM MESA
   Ficam em usuarios/<uid>/personagens. Dá para criar, editar, rolar
   (só na sua tela) e depois levar para qualquer mesa.
   ===================================================================== */
function subscribeSolos() {
  if (S.solosUnsub || !S.uid) return;
  S.solos = [];
  S.solosUnsub = S.db.listenCol(
    "usuarios/" + S.uid + "/personagens",
    null,
    l => {
      S.solos = l.sort((a, b) => (b.atualizada || b.criada || 0) - (a.atualizada || a.criada || 0));
      S.loaded.solos = true;
      if (!S.mesaId && !S.solo) showLobby();
      if (S.mesaId && S.tool === "agentes" && !S.openFicha) renderPanel();
    },
    () => {
      S.loaded.solos = true;
    }
  );
}

const nomeIgual = (a, b) => {
  a = (a || "").trim().toLowerCase();
  return !!a && a === (b || "").trim().toLowerCase();
};
/* fichas desta conta que já são esse personagem (mesmo vínculo ou mesmo nome) */
const jaNaMesa = (lista, c) =>
  lista.filter(
    x => (x.npc ? S.isM : x.dono === S.uid) && (x.origemSolo === c.id || nomeIgual(x.nome, c.nome))
  );
function soloCardsHTML() {
  const L = S.solos || [];
  // botão para apagar cópias repetidas (gruposRepetidos fica em 5n-gestao.js)
  const n = gruposRepetidos(L, c => (c.nome || "").trim().toLowerCase()).reduce(
    (t, a) => t + a.length - 1,
    0
  );
  const rep = n
    ? `<div class="row" style="justify-content:flex-start"><button class="btn sm ghost" id="btnJuntarSolos" style="border-color:var(--red)">Apagar cópias repetidas (${n})</button></div>`
    : "";
  if (!L.length) return rep;
  return (
    rep +
    `<div class="mesas" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">${L.map(
      c => `<div class="mesa-card pchar"><button class="pc-open" data-solo="${esc(c.id)}">${c.foto ? `<img class="avatar" src="${c.foto}" alt="" style="width:52px;height:69px;object-fit:cover;object-position:50% 15%">` : `<div class="avatar ph" style="width:52px;height:52px">${esc((c.nome || "?").charAt(0).toUpperCase())}</div>`}<div style="min-width:0;text-align:left"><b>${esc(c.nome || "Sem nome")}</b><div class="muted small">${esc(c.classe || "")}${c.trilha ? " · " + esc(c.trilha) : ""} · NEX ${c.nex || 5}%</div><div class="muted small">Sem mesa (guardado na sua conta)</div></div></button>
    <div class="row" style="gap:6px"><button class="btn sm" data-sololevar="${esc(c.id)}">Levar para uma mesa</button><button class="btn sm ghost" data-solobx="${esc(c.id)}" title="Baixar um arquivo com este personagem para guardar ou mandar a um amigo">Baixar</button><button class="btn sm ghost" data-solodel="${esc(c.id)}" aria-label="Apagar personagem">✕</button></div></div>`
    ).join("")}</div>`
  );
}
function bindSoloCards() {
  {
    const im = $("#btnImpSolo");
    if (im) im.onclick = importarSolo;
  }
  $$("[data-solobx]").forEach(
    b =>
      (b.onclick = () => {
        const c = (S.solos || []).find(x => x.id === b.dataset.solobx);
        if (c) baixarPersonagem(c);
      })
  );
  const nv = $("#btnNovoSolo");
  if (nv)
    nv.onclick = () => {
      const id = "p" + rid(8);
      const f = novaFicha();
      f.dono = S.uid;
      f.criada = Date.now();
      soloAbrir(id, f, true);
    };
  $$("[data-solo]").forEach(
    b =>
      (b.onclick = () => {
        const c = (S.solos || []).find(x => x.id === b.dataset.solo);
        if (c) {
          const { id, ...f } = c;
          soloAbrir(id, f);
        }
      })
  );
  $$("[data-sololevar]").forEach(
    b => (b.onclick = () => soloLevar((S.solos || []).find(x => x.id === b.dataset.sololevar)))
  );
  $$("[data-solodel]").forEach(
    b =>
      (b.onclick = async () => {
        const c = (S.solos || []).find(x => x.id === b.dataset.solodel);
        if (!c) return;
        if (
          !(await confirmBox(
            `Apagar ${c.nome || "este personagem"}?`,
            "Some da sua conta. As cópias que você já levou para mesas continuam lá.",
            "Apagar"
          ))
        )
          return;
        try {
          await S.db.del("usuarios/" + S.uid + "/personagens/" + c.id);
        } catch (e) {
          fail(e);
        }
      })
  );
  const b = $("#btnJuntarSolos");
  if (b) b.onclick = juntarSolos;
  setTimeout(() => {
    const f = $("#fNova");
    if (f && f.onsubmit && !f._u) {
      const o = f.onsubmit;
      f.onsubmit = ev => {
        ev.preventDefault();
        if (f._b) return;
        f._b = 1;
        setTimeout(() => (f._b = 0), 2500);
        return o(ev);
      };
      f._u = 1;
    }
  }, 0);
}
/* Backup de personagem: o mesmo arquivo das mesas ("Baixar ficha"), então serve para guardar
   e para mandar a um amigo, que importa em Meus personagens ou direto numa mesa. */
const CAMPOS_DA_MESA = [
  "id",
  "dono",
  "npc",
  "visivel",
  "pasta",
  "donoAntes",
  "solo",
  "origemSolo",
  "atualizada"
];
function limparPersonagem(f) {
  const c = JSON.parse(JSON.stringify(f || {}));
  CAMPOS_DA_MESA.forEach(k => delete c[k]);
  return c;
}
function baixarPersonagem(c) {
  baixar(`personagem-${slug(c.nome)}.json`, {
    tipo: "simula-ordem-ficha",
    v: 1,
    exportada: Date.now(),
    ficha: limparPersonagem(c)
  });
  toast(`${c.nome || "Personagem"} baixado. Mande o arquivo para quem quiser.`);
}
async function importarSolo() {
  if (!S.uid) {
    toast("Espere carregar e tente de novo.");
    return;
  }
  const d = await lerJSON();
  if (!d) return;
  const lista =
    d.tipo === "simula-ordem-ficha" && d.ficha
      ? [d.ficha]
      : d.tipo === "simula-ordem-mesa"
        ? (d.fichas || []).filter(f => !f.npc)
        : null;
  if (!lista || !lista.length) {
    toast("Esse arquivo não é um personagem do Simula Ordem.");
    return;
  }
  let escolhidos = lista;
  if (lista.length > 1) {
    const r = await formBox(
      "Quais personagens importar?",
      `<p class="muted small" style="margin:0">Esse arquivo é o backup de uma mesa. Escolha os agentes que vão para Meus personagens.</p>${lista.map((f, i) => `<label class="check"><input type="checkbox" name="p${i}" checked> ${esc(f.nome || "Sem nome")}</label>`).join("")}`,
      "Importar"
    );
    if (!r) return;
    escolhidos = lista.filter((f, i) => r["p" + i]);
    if (!escolhidos.length) return;
  }
  try {
    for (const f0 of escolhidos) {
      const f = migrar({ ...limparPersonagem(f0), dono: S.uid, criada: Date.now(), atualizada: Date.now() });
      const ja = (S.solos || []).some(x => nomeIgual(x.nome, f.nome));
      if (ja) f.nome = (f.nome || "Personagem") + " (cópia)";
      await S.db.set("usuarios/" + S.uid + "/personagens/p" + rid(8), f);
    }
    toast(
      escolhidos.length > 1
        ? `${escolhidos.length} personagens importados.`
        : `${escolhidos[0].nome || "Personagem"} está em Meus personagens.`
    );
  } catch (e) {
    fail(e);
  }
}

/* abre a ficha numa tela própria, usando o mesmo editor das mesas */
function soloAbrir(id, f, novo) {
  const pb = $("#pbody");
  if (!pb) return;
  S.soloBack = {
    isM: S.isM,
    tool: S.tool,
    open: S.openFicha,
    parent: pb.parentElement,
    next: pb.nextSibling
  };
  S.solo = id;
  S.isM = false;
  S.tool = "agentes";
  S.openFicha = id;
  S.sheetTab = "principal";
  S.fichas[id] = { ...f, solo: true, dono: S.uid };
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div class="soloEd" id="soloEd"><div class="me-top"><button class="btn sm ghost" id="soloX">← Voltar</button><b style="font-family:var(--f-display);font-size:18px">Personagem sem mesa</b><span class="me-gap"></span><span class="muted small">Salva sozinho na sua conta</span></div><div class="solo-in" id="soloIn"></div></div>`
  );
  $("#soloIn").appendChild(pb);
  document.body.classList.add("me-open");
  $("#soloX").onclick = soloFechar;
  if (novo) saveFicha(id, true);
  renderPanel();
}
function soloFechar() {
  const id = S.solo;
  if (!id) return;
  if (S.dirty[id]) saveFicha(id, true);
  const B = S.soloBack || {};
  const pb = $("#pbody");
  if (pb && B.parent) B.parent.insertBefore(pb, B.next || null);
  pb.innerHTML = "";
  const el = $("#soloEd");
  if (el) el.remove();
  document.body.classList.remove("me-open");
  delete S.fichas[id];
  S.solo = null;
  S.isM = !!B.isM;
  S.tool = B.tool || null;
  S.openFicha = B.open || null;
  showLobby();
}
async function soloLevar(c) {
  if (!c) return;
  const r = await formBox(
    `Levar ${c.nome || "personagem"} para uma mesa`,
    `<p class="muted small" style="margin:0">Uma cópia vai para a mesa. A ficha guardada na sua conta continua aqui para levar a outras mesas.</p>
   <div class="field"><label class="label" for="slCod">Código da mesa</label><input type="text" id="slCod" name="cod" maxlength="10" placeholder="Ex.: K7RQ2M" style="text-transform:uppercase" required></div>
   <p class="muted small" style="margin:0">Se ainda não entrou nessa mesa, entre uma vez pelo link do mestre e depois volte aqui (ou use "Trazer um personagem meu" dentro da mesa).</p>`,
    "Levar"
  );
  if (!r) return;
  const cod = r.cod.trim().toUpperCase();
  if (!/^[A-Z0-9]{4,10}$/.test(cod)) {
    toast("Código inválido.");
    return;
  }
  try {
    const m = await S.db.get("portas/" + cod);
    if (!m) {
      toast("Não achei uma mesa com esse código.");
      return;
    }
    let ja = [];
    try {
      ja = await S.db.getCol("mesas/" + cod + "/fichas");
    } catch (e) {}
    const dup = jaNaMesa(ja, c);
    if (
      dup.length &&
      !(await confirmBox(
        `${c.nome} já está nessa mesa`,
        "Ele já aparece em Agentes nessa mesa. Levar mais uma cópia mesmo assim?",
        "Levar outra cópia"
      ))
    ) {
      S.abrirFicha = dup[0].id;
      location.hash = "mesa-" + cod;
      return;
    }
    const { id: _i, solo, ...f } = c;
    const nid = "f" + rid(8);
    try {
      await S.db.set("mesas/" + cod + "/fichas/" + nid, {
        ...f,
        origemSolo: c.id,
        dono: S.uid,
        criada: Date.now(),
        pv: null,
        pe: null,
        san: null,
        cond: [],
        morrendo: 0
      });
    } catch (e) {
      if (e && e.code === "permission-denied") {
        toast("Entre nessa mesa primeiro (pelo link ou código) e depois leve o personagem.");
        return;
      }
      throw e;
    }
    toast(`${c.nome} foi para a mesa ${m.nome}.`);
    S.abrirFicha = nid;
    location.hash = "mesa-" + cod;
  } catch (e) {
    fail(e);
  }
}
/* dentro de uma mesa: trazer um personagem guardado */
async function soloTrazer() {
  const L = S.solos || [];
  if (!L.length) {
    toast("Você ainda não tem personagens guardados na conta.");
    return;
  }
  const r = await formBox(
    "Trazer um personagem meu",
    `<div class="field"><label class="label" for="stSel">Personagem</label><select id="stSel" name="id">${L.map(c => `<option value="${esc(c.id)}">${esc(c.nome || "Sem nome")} · ${esc(c.classe || "")} NEX ${c.nex || 5}%</option>`).join("")}</select></div>
   <p class="muted small" style="margin:0">Uma cópia entra nesta mesa. A ficha da sua conta continua guardada.</p>`,
    "Trazer"
  );
  if (!r) return;
  const c = L.find(x => x.id === r.id);
  if (!c) return;
  const ja = jaNaMesa(
    Object.entries(S.fichas).map(([id, x]) => ({ ...x, id })),
    c
  );
  if (ja.length) {
    const q = await formBox(
      `${c.nome} já está nesta mesa`,
      `<p class="muted small" style="margin:0">Ele já aparece em Agentes${ja[0].npc ? " (como NPC)" : ""}. Para continuar jogando com ele, é só abrir a ficha que já está aqui.</p>
     <label class="check"><input type="radio" name="o" value="abrir" checked> Abrir a ficha que já está na mesa</label><label class="check"><input type="radio" name="o" value="copia"> Trazer outra cópia mesmo assim</label>`,
      "Continuar"
    );
    if (!q) return;
    if (q.o !== "copia") {
      S.openFicha = ja[0].id;
      S.sheetTab = "principal";
      renderPanel();
      return;
    }
  }
  const { id: _i, solo, ...f } = c;
  const nid = "f" + rid(8);
  S.fichas[nid] = {
    ...f,
    origemSolo: c.id,
    dono: S.uid,
    criada: Date.now(),
    pv: null,
    pe: null,
    san: null,
    cond: [],
    morrendo: 0
  };
  saveFicha(nid, true);
  S.openFicha = nid;
  S.sheetTab = "principal";
  renderPanel();
  toast(`${c.nome} entrou na mesa.`);
}
async function soloGuardarCopia(id, semVinculo) {
  const f = S.fichas[id];
  if (!f) return;
  const { npc, visivel, pasta, origemSolo, solo, ...dados } = JSON.parse(JSON.stringify(f));
  const L = S.solos || [];
  const alvo = L.find(c => c.id === f.origemSolo) || L.find(c => nomeIgual(c.nome, f.nome));
  const pid = alvo ? alvo.id : "p" + rid(8);
  try {
    await S.db.set("usuarios/" + S.uid + "/personagens/" + pid, {
      ...dados,
      dono: S.uid,
      criada: (alvo && alvo.criada) || Date.now(),
      atualizada: Date.now()
    });
    if (!semVinculo && f.origemSolo !== pid) {
      f.origemSolo = pid;
      saveFicha(id, true);
    }
    toast(alvo ? `${f.nome} atualizado em Meus personagens.` : `${f.nome} guardado em Meus personagens.`);
  } catch (e) {
    fail(e);
  }
}

/* ganchos */
{
  const _fp = fichaPath;
  fichaPath = function (id) {
    const f = S.fichas[id];
    if (f && f.solo) return "usuarios/" + S.uid + "/personagens/" + id;
    return _fp(id);
  };
}
{
  const _le = logEntry;
  logEntry = async function (e) {
    if (S.solo) {
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
    return _le(e);
  };
}
{
  const _rp = renderPanel;
  renderPanel = function () {
    if (S.solo && S.openFicha !== S.solo) {
      soloFechar();
      return;
    }
    _rp();
  };
}
{
  const _bs = bindSheet;
  bindSheet = function () {
    _bs();
    if (S.solo) {
      $$("[data-back]").forEach(b => (b.onclick = soloFechar));
      return;
    }
    const f = S.fichas[S.openFicha];
    if (f && !f.npc && f.dono === S.uid && !$("#btnGuardarConta")) {
      const bx = $("#btnBaixar");
      if (bx)
        bx.insertAdjacentHTML(
          "afterend",
          `<button type="button" class="btn sm" id="btnGuardarConta">Salvar em Meus personagens</button>`
        );
      const g = $("#btnGuardarConta");
      if (g) g.onclick = () => soloGuardarCopia(S.openFicha);
    }
  };
}
{
  const _ba = bindAgentes;
  bindAgentes = function () {
    _ba();
    const nf = $("#novaFicha");
    if (nf && !$("#btnTrazerSolo") && (S.solos || []).length) {
      nf.insertAdjacentHTML(
        "afterend",
        `<button class="btn block" id="btnTrazerSolo" style="margin-top:6px">Trazer um personagem meu (${S.solos.length})</button>`
      );
      $("#btnTrazerSolo").onclick = soloTrazer;
    }
  };
}
</script>
