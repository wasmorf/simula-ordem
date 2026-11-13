"use strict";
/* Entrar e sair de uma mesa: senha, aprovação, assinaturas do banco. */
/* ===================== MESA ===================== */
function setMesa(m) {
  const prevActive = S.mesa && S.mesa.cenaAtiva;
  const wasM = S.isM;
  S.mesa = m;
  S.isM = m.mestre === S.uid;
  if (S.uid && m.nome) {
    const old = (S.minhas || []).find(x => x.id === m.id);
    const papel = S.isM ? "mestre" : "jogador";
    if (!old || old.nome !== m.nome || old.papel !== papel)
      S.db
        .set("usuarios/" + S.uid + "/mesas/" + m.id, {
          nome: m.nome,
          desc: m.desc || "",
          papel,
          ts: Date.now()
        })
        .catch(() => {});
  }
  document.title = m.nome + " · Simula Ordem";
  syncCenasSub(prevActive, wasM);
  syncNpcs();
  if (S.isM) subscribeAcesso();
  if (!S.isM) viewScene(m.cenaAtiva || null);
  else if (m.cenaAtiva && (!S.viewSid || S.viewSid === prevActive)) viewScene(m.cenaAtiva);
  renderRail();
  renderBoardTop();
  if (S.tool === "cenas") renderPanel();
}
/* ---------- entrada na mesa (acesso) ---------- */
async function criarMesa({ nome, desc, acesso, listada, senha }, id = rid()) {
  const base = {
    nome,
    desc: desc || "",
    mestre: S.uid,
    criada: Date.now(),
    acesso: acesso || "livre",
    listada: !!listada
  };
  await S.db.set("mesas/" + id, { ...base, cenaAtiva: null });
  await S.db.set("portas/" + id, { ...base, mestreNome: (S.authUser && S.authUser.displayName) || "" });
  if (base.acesso === "senha") await S.db.set("mesas/" + id + "/segredo/senha", { valor: senha });
  await S.db.set("mesas/" + id + "/membros/" + S.uid, { nome: "Mestre", ts: Date.now(), papel: "mestre" });
  return id;
}
function telaPorta(html) {
  leaveMesa(false);
  $("#vtt").hidden = true;
  const L = $("#lobby");
  L.hidden = false;
  L.innerHTML = `<div class="lwrap"><div class="row between"><button class="brand" id="pVolta" style="background:none;border:0;color:inherit;padding:0">${I.logo()}<div>Simula Ordem</div></button></div><div class="porta box stack">${html}</div></div>`;
  $("#pVolta").onclick = () => {
    location.hash = "";
  };
}
async function enterMesa(id) {
  leaveMesa(false);
  S.gate = id;
  telaPorta(`<p class="muted" style="margin:0">Abrindo a mesa ${esc(id)}…</p>`);
  let porta = null,
    eu = null,
    bloq = null;
  for (let i = 0; i < (S.testMode ? 8 : 1) && !porta; i++) {
    // no modo de teste a aba nova ainda está recebendo os dados das outras
    if (i) await new Promise(r => setTimeout(r, 400));
    try {
      porta = await S.db.get("portas/" + id);
    } catch (e) {}
    if (S.gate !== id) return;
  }
  if (S.gate !== id) return;
  if (!porta) {
    telaPorta(
      `<h2>Mesa não encontrada</h2><p class="muted" style="margin:0">Confira o código ${esc(id)} ou peça o link de novo para o mestre.</p><button class="btn" onclick="location.hash=''">Voltar</button>`
    );
    return;
  }
  if (porta.mestre === S.uid) return startMesa(id);
  try {
    eu = await S.db.get("mesas/" + id + "/membros/" + S.uid);
  } catch (e) {}
  if (eu) return startMesa(id);
  try {
    bloq = await S.db.get("mesas/" + id + "/bloqueados/" + S.uid);
  } catch (e) {}
  if (S.gate !== id) return;
  if (bloq) {
    telaPorta(
      `<h2>${esc(porta.nome)}</h2><p class="muted" style="margin:0">Você não tem acesso a esta mesa. Fale com o mestre.</p><button class="btn" onclick="location.hash=''">Voltar</button>`
    );
    return;
  }
  const ac = porta.acesso || "livre";
  const nome0 = (S.authUser && S.authUser.displayName) || lsGet("ms_nome", "");
  if (ac === "livre" && nome0) {
    try {
      await S.db.set("mesas/" + id + "/membros/" + S.uid, { nome: nome0, ts: Date.now() });
      if (S.gate === id) return startMesa(id);
    } catch (e) {}
  }
  telaPorta(`${porta.capa ? `<img class="porta-capa" src="${porta.capa}" alt="">` : ""}<span class="label">Mesa ${esc(id)}</span><h2>${esc(porta.nome)}</h2>${porta.desc ? `<p class="muted" style="margin:0">${esc(porta.desc)}</p>` : ""}
    <form class="stack" id="fPorta"><div class="field"><label class="label" for="pNome">Seu nome (o mestre vê)</label><input type="text" id="pNome" maxlength="40" value="${esc(nome0)}" required></div>
    ${ac === "senha" ? `<div class="field"><label class="label" for="pSenha">Senha da mesa</label><input type="text" id="pSenha" maxlength="40" autocomplete="off" required></div>` : ""}
    <button class="btn primary">${ac === "aprovacao" ? "Pedir para entrar" : "Entrar na mesa"}</button></form>
    ${ac === "aprovacao" ? `<p class="muted small" style="margin:0">O mestre precisa aprovar a sua entrada.</p>` : ""}`);
  $("#fPorta").onsubmit = async ev => {
    ev.preventDefault();
    const nome = $("#pNome").value.trim();
    if (!nome) return;
    lsSet("ms_nome", nome);
    try {
      if (ac === "aprovacao") {
        await S.db.set("mesas/" + id + "/entrada/" + S.uid, { nome, ts: Date.now() });
        telaPorta(
          `<h2>${esc(porta.nome)}</h2><p style="margin:0">Pedido enviado. Assim que o mestre aprovar, a mesa abre sozinha.</p><p class="muted small" style="margin:0">Pode deixar esta página aberta.</p>`
        );
        S.gate = id;
        const un = S.db.listenDoc(
          "mesas/" + id + "/membros/" + S.uid,
          d => {
            if (d && S.gate === id) {
              un();
              startMesa(id);
            }
          },
          () => {}
        );
        S.gateUnsub = un;
        return;
      }
      await S.db.set("mesas/" + id + "/membros/" + S.uid, {
        nome,
        ts: Date.now(),
        ...(ac === "senha" ? { senha: $("#pSenha").value.trim() } : {})
      });
      if (S.testMode && ac === "senha") {
        const sg = await S.db.get("mesas/" + id + "/segredo/senha");
        if (sg && sg.valor !== $("#pSenha").value.trim()) {
          await S.db.del("mesas/" + id + "/membros/" + S.uid);
          throw { code: "permission-denied" };
        }
      }
      if (ac === "senha")
        S.db.set("mesas/" + id + "/membros/" + S.uid, { nome, ts: Date.now() }).catch(() => {}); // não deixa a senha guardada no perfil do jogador
      startMesa(id);
    } catch (e) {
      if (e && e.code === "permission-denied")
        toast(ac === "senha" ? "Senha errada." : "Não foi possível entrar nesta mesa.");
      else fail(e);
    }
  };
}
function semAcesso() {
  if (!S.mesaId) return;
  const id = S.mesaId;
  toast("Você não tem mais acesso a esta mesa.");
  leaveMesa(false);
  location.hash = "";
}
function failMesa(e) {
  if (e && e.code === "permission-denied") semAcesso();
  else fail(e);
}
function startMesa(id) {
  leaveMesa(false);
  S.mesaId = id;
  S.mesa = { id, nome: "Mesa " + id };
  S.fichas = {};
  S.fichaBase = {};
  S.fichaRemota = {};
  S.log = [];
  S.combate = null;
  S.cenas = [];
  S.tokens = [];
  S.pos = {};
  S.homebrew = [];
  S.notas = "";
  S.viewSid = null;
  S.tool = null;
  S.openFicha = null;
  S.sel = null;
  S.loaded = { lobby: S.loaded.lobby };
  S.userMoved = false;
  const vis = lsGet("ms_visitadas", []);
  if (!vis.includes(id)) {
    vis.unshift(id);
    lsSet("ms_visitadas", vis.slice(0, 30));
  }
  $("#lobby").hidden = true;
  $("#vtt").hidden = false;
  const known = S.mesas.find(m => m.id === id);
  const u = S.unsub;
  const p = P();
  let nf = null;
  u.push(
    S.db.listenDoc(
      p,
      m => {
        clearTimeout(nf);
        if (!m) {
          nf = setTimeout(() => {
            if (S.mesaId === id && !S.loaded.mesa) {
              toast("Mesa não encontrada. Confira o código.");
              location.hash = "";
            }
          }, 3000);
          return;
        }
        S.loaded.mesa = true;
        setMesa({ id, ...m });
      },
      failMesa
    )
  );
  let fuiMembro = false;
  u.push(
    S.db.listenDoc(
      p + "/membros/" + S.uid,
      d => {
        if (d) fuiMembro = true;
        else if (fuiMembro && !S.isM) semAcesso();
      },
      () => {}
    )
  );
  u.push(
    S.db.listenCol(
      p + "/fichas",
      null,
      list => {
        S.loaded.fichas = true;
        const next = {};
        list.forEach(x => {
          const { id: fid, ...rest } = x;
          next[fid] = fichaDoBanco(fid, rest, p + "/fichas/" + fid); // mantém o mesmo objeto (a ficha aberta continua ligada)
        });
        Object.entries(S.fichas).forEach(([k, f]) => {
          if (f.npc) next[k] = f;
        });
        esquecerBases(p + "/fichas/", list); // ficha apagada: a próxima gravação vai inteira
        S.fichas = next;
        clearTimeout(S.idxT);
        S.idxT = setTimeout(syncIndice, 1500);
        if (S.abrirFicha && S.fichas[S.abrirFicha]) {
          S.openFicha = S.abrirFicha;
          S.abrirFicha = null;
          S.sheetTab = "principal";
          openTool("agentes");
        }
        renderBoard();
        if (["agentes", "escudo", "combate", "tokens"].includes(S.tool) && !isEditing()) renderPanel();
      },
      failMesa
    )
  );
  u.push(
    S.db.listenCol(
      p + "/log",
      { orderBy: "ts", dir: "desc", limit: 80 },
      list => {
        S.loaded.log = true;
        if (S.logPrimed)
          list
            .filter(x => !S.seenLog.has(x.id))
            .reverse()
            .forEach(dicePop);
        list.forEach(x => S.seenLog.add(x.id));
        S.logPrimed = true;
        S.log = list;
        if (S.tool === "rolagens") renderLog();
      },
      fail
    )
  );
  u.push(
    S.db.listenDoc(
      p + "/estado/combate",
      c => {
        S.combate = c;
        if (S.tool === "combate") renderPanel();
        if (!S.dragging) renderBoard();
      },
      () => {}
    )
  );
  u.push(
    S.db.listenCol(
      p + "/tokens",
      { orderBy: "criada", dir: "asc" },
      list => {
        S.loaded.tokens = true;
        S.tokens = list;
        renderBoard();
        if (S.tool === "tokens") renderPanel();
      },
      fail
    )
  );
  u.push(
    S.db.listenCol(
      p + "/homebrew",
      { orderBy: "criada", dir: "asc" },
      list => {
        S.homebrew = list;
        if (S.tool === "homebrew") renderPanel();
      },
      () => {}
    )
  );
  ajudaPrimeiraVez();
  subscribeArteBest();
  subscribeMembros();
  subscribePrivado();
  subscribeTrilha();
  if (known) setMesa(known);
  renderRail();
  renderBoard();
  renderBoardTop();
  u.push(
    S.db.listenCol(
      p + "/pedidos",
      null,
      list => {
        S.pedidos = list;
        if (S.tool === "escudo" || S.tool === "agentes") renderPanel();
      },
      () => {}
    )
  );
  if (window.innerWidth > 760 && !S.abrirFicha) openTool("agentes");
}
function leaveMesa(show) {
  pararMapDocs(); // documentos/no-mapa
  if (S.gateUnsub) {
    try {
      S.gateUnsub();
    } catch (e) {}
    S.gateUnsub = null;
  }
  if (show) S.gate = null;
  S.unsub.forEach(f => {
    try {
      f();
    } catch (e) {}
  });
  S.unsub = [];
  limparCenaSubs();
  [
    "acUnsub",
    "memUnsub",
    "privUnsub",
    "trilhaUnsub",
    "npcUnsub",
    "docsUnsub",
    "arteUnsub",
    "notasUnsub", // anotações do mestre (escudo)
    "notasDocUnsub", // anotações do jogador nos documentos (documentos/mural-notas)
    "muralUnsub"
  ].forEach(k => {
    if (S[k]) {
      try {
        S[k]();
      } catch (e) {}
      S[k] = null;
    }
  });
  S.npcMode = null;
  S.membros = [];
  S.entrada = [];
  S.bloqueados = [];
  S.priv = [];
  S.privA = [];
  S.privB = [];
  S.trilha = null;
  S.docs = [];
  S.notas = "";
  S.notasDoc = {};
  S.mural = null;
  S.loaded.entrada = false;
  if (typeof pararLocal === "function") pararLocal();
  if (S.cenasUnsub) {
    S.cenasUnsub();
    S.cenasUnsub = null;
  }
  S.cenasMode = null;
  S.mesaId = null;
  S.mesa = null;
  S.seenLog = new Set();
  S.logPrimed = false;
  if (show) showLobby();
}
/* O mestre vê a lista de cenas; os jogadores só recebem a cena exibida (as ocultas ficam em segredo). */
function syncCenasSub(prevActive, wasM) {
  const onList = list => {
    S.loaded.cenas = true;
    S.cenaVer = S.cenaVer || {};
    list.forEach(c => {
      const v = c.ver || 0;
      if (S.cenaVer[c.id] !== undefined && S.cenaVer[c.id] !== v && S.sceneImg[c.id]) {
        delete S.sceneImg[c.id];
        S.db
          .get(P() + "/cenaImg/" + c.id)
          .then(im => {
            if (im && im.url) {
              S.sceneImg[c.id] = im.url;
              renderBoard();
              renderMapTools();
            }
          })
          .catch(() => {});
      }
      S.cenaVer[c.id] = v;
    });
    S.cenas = list;
    renderBoardTop();
    if (S.tool === "cenas") renderPanel();
    renderBoard();
  };
  if (S.isM) {
    if (S.cenasMode === "all") return;
    if (S.cenasUnsub) S.cenasUnsub();
    S.cenasMode = "all";
    S.cenasUnsub = S.db.listenCol(P() + "/cenas", { orderBy: "criada", dir: "asc" }, onList, fail);
    return;
  }
  const a = S.mesa.cenaAtiva || null;
  if (S.cenasMode === "one:" + a) return;
  if (S.cenasUnsub) S.cenasUnsub();
  S.cenasMode = "one:" + a;
  S.cenas = [];
  if (!a) {
    S.cenasUnsub = null;
    onList([]);
    return;
  }
  S.cenasUnsub = S.db.listenDoc(
    P() + "/cenas/" + a,
    c => onList(c ? [{ id: a, ...c }] : []),
    () => {}
  );
}
/* Anotações do mestre (aba Escudo), salvas em mestre/notas. */
function subscribeNotas() {
  if (S.notasUnsub || !S.isM) return;
  S.notasUnsub = S.db.listenDoc(
    P() + "/mestre/notas",
    n => {
      S.notas = (n && n.texto) || "";
      const ta = $("#notasM");
      if (ta && document.activeElement !== ta) ta.value = S.notas;
    },
    () => {}
  );
}
