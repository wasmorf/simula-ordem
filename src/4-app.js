<script>
"use strict";
/* ===================== ESTADO ===================== */
const S = {
  db: null,
  uid: null,
  authUser: null,
  mesaId: null,
  mesa: null,
  isM: false,
  mesas: [],
  fichas: {},
  log: [],
  combate: null,
  cenas: [],
  tokens: [],
  pos: {},
  homebrew: [],
  notas: "",
  secret: [],
  viewSid: null,
  sceneImg: {},
  tool: null,
  openFicha: null,
  dirty: {},
  unsub: [],
  posUnsub: null,
  sel: null,
  seenLog: new Set(),
  logPrimed: false,
  loaded: {},
  lobbyUnsub: null,
  ruleTab: "testes",
  tokTab: "todos"
};
const P = () => "mesas/" + S.mesaId;

/* gravação em fila por documento (uma de cada vez) */
const writeQ = {};
function queueSet(path, data) {
  const q = writeQ[path] || (writeQ[path] = { run: false, next: null });
  q.next = data;
  if (q.run) return;
  (async () => {
    q.run = true;
    while (q.next) {
      const b = q.next;
      q.next = null;
      try {
        await S.db.set(path, b);
      } catch (e) {
        fail(e);
      }
    }
    q.run = false;
  })();
}
function fail(e) {
  console.error(e);
  const c = e && e.code;
  if (c === "permission-denied")
    toast(
      "O banco recusou. Só o mestre (ou o dono da ficha) pode fazer isso, ou as regras do Firestore não foram publicadas."
    );
  else if (c === "resource-exhausted")
    toast("O limite grátis do dia do Firebase acabou. Amanhã volta ao normal.");
  else if (c === "invalid-argument" && /longer than|exceeds/i.test(e.message || ""))
    toast("Essa imagem ficou grande demais. Tente uma menor.");
  else toast("Não deu para salvar agora. Confira a internet e tente de novo.");
}

/* ===================== INÍCIO ===================== */
async function boot() {
  const configured =
    window.firebase && FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.projectId !== "COLE_AQUI";
  if (!configured) {
    if (location.hash === "#teste" || lsGet("ms_teste", false)) {
      lsSet("ms_teste", true);
      if (location.hash === "#teste") history.replaceState(null, "", location.pathname);
      S.db = localDB();
      S.uid = (() => {
        try {
          let u = sessionStorage.getItem("ms_uid");
          if (!u) {
            u = "local-" + rid(6);
            sessionStorage.setItem("ms_uid", u);
          }
          return u;
        } catch (e) {
          return "local-" + rid(6);
        }
      })();
      S.testMode = true;
      return start();
    }
    return renderSetup();
  }
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    S.db = firebaseDB();
    await new Promise(res => {
      const off = firebase.auth().onAuthStateChanged(u => {
        off();
        res(u);
      });
    });
    let u = firebase.auth().currentUser;
    if (!u) u = (await firebase.auth().signInAnonymously()).user;
    S.uid = u.uid;
    S.authUser = u;
  } catch (e) {
    console.error(e);
    return renderNoDb(e);
  }
  start();
}
function start() {
  subscribeLobby();
  route();
  window.addEventListener("hashchange", route);
  window.addEventListener("resize", () => {
    if (S.mesaId && !S.userMoved) fitView();
  });
}
function route() {
  const m = location.hash.match(/^#mesa-([A-Z0-9]{4,10})$/);
  if (!m) S.gate = null;
  if (m && m[1] !== S.mesaId) enterMesa(m[1]);
  else if (!m && S.mesaId) leaveMesa(true);
  else if (!m) showLobby();
}
function renderSetup() {
  $("#lobby").hidden = false;
  $("#vtt").hidden = true;
  $("#lobby").innerHTML =
    `<div class="lwrap"><div class="brand">${I.logo()}<div>Simula Ordem<small>Ordo Realitas · sistema de Ordem</small></div></div>
  <div class="stack" style="max-width:640px;margin-top:40px"><h2>Falta ligar o banco</h2>
  <p class="muted">Abra o <b>index.html</b> e cole a configuração do seu projeto Firebase no bloco <code>FIREBASE_CONFIG</code>. Sem isso, a mesa não sincroniza entre os jogadores.</p>
  <p class="muted">Quer ver como funciona antes? O modo de teste guarda tudo só neste navegador (abas abertas juntas conversam entre si) e apaga quando você fecha.</p>
  <div><button class="btn primary" id="btnTeste">Abrir modo de teste</button></div></div></div>`;
  $("#btnTeste").onclick = () => {
    location.hash = "teste";
    location.reload();
  };
}
function renderNoDb(e) {
  $("#lobby").hidden = false;
  const why =
    e && e.code === "auth/operation-not-allowed"
      ? "O login anônimo está desligado. No Firebase, vá em Authentication → Sign-in method e ative Anônimo."
      : e && /unauthorized-domain/.test(e.code || "")
        ? "Este endereço não está autorizado. No Firebase, vá em Authentication → Settings → Domínios autorizados e adicione o domínio do seu site."
        : "Não consegui conectar ao Firebase. Confira a configuração colada no index.html e a internet.";
  $("#lobby").innerHTML =
    `<div class="lwrap"><div class="brand">${I.logo()}<div>Simula Ordem</div></div><div class="stack" style="max-width:620px;margin-top:40px"><h2>Não deu para abrir a mesa</h2><p class="muted">${esc(why)}</p></div></div>`;
}

/* ===================== LOBBY ===================== */
/* Índice pessoal: usuarios/<uid>/fichas guarda um resumo de cada ficha da pessoa, em todas as mesas */
function subscribeMeus() {
  subscribeSolos(); // Meus personagens sem mesa (5m-solo.js)
  if (S.meusUnsub || !S.uid) return;
  S.meus = [];
  subscribeMinhas();
  S.meusUnsub = S.db.listenCol(
    "usuarios/" + S.uid + "/fichas",
    null,
    list => {
      S.meus = list;
      S.loaded.meus = true;
      if (!S.mesaId) showLobby();
    },
    () => {
      S.loaded.meus = true;
    }
  );
}
function syncIndice() {
  // atualiza o índice das minhas fichas desta mesa (só quando algo muda)
  if (!S.mesaId || !S.uid) return;
  const mesaNome = (S.mesa && S.mesa.nome) || "";
  for (const [fid, f] of Object.entries(S.fichas)) {
    if (f.dono !== S.uid || f.npc) continue;
    const r = {
      mesaId: S.mesaId,
      fichaId: fid,
      mesaNome,
      nome: f.nome || "",
      classe: f.classe || "",
      trilha: f.trilha || "",
      origem: f.origem || "",
      nex: +f.nex || 5,
      foto: f.foto || "",
      ts: Date.now()
    };
    const key = S.mesaId + "_" + fid;
    const old = (S.meus || []).find(x => x.id === key);
    if (old && ["mesaNome", "nome", "classe", "trilha", "origem", "nex", "foto"].every(k => old[k] === r[k]))
      continue;
    S.db.set("usuarios/" + S.uid + "/fichas/" + key, r).catch(() => {});
  }
  // fichas que deixaram de ser minhas nesta mesa
  (S.meus || [])
    .filter(
      x =>
        x.mesaId === S.mesaId &&
        S.loaded.fichas &&
        !(S.fichas[x.fichaId] && S.fichas[x.fichaId].dono === S.uid && !S.fichas[x.fichaId].npc)
    )
    .forEach(x => S.db.del("usuarios/" + S.uid + "/fichas/" + x.id).catch(() => {}));
}
function subscribeMinhas() {
  if (S.minhasUnsub || !S.uid) return;
  S.minhas = [];
  S.minhasUnsub = S.db.listenCol(
    "usuarios/" + S.uid + "/mesas",
    null,
    list => {
      S.minhas = list;
      if (!S.mesaId) showLobby();
    },
    () => {}
  );
}
function subscribeLobby() {
  subscribeMeus();
  subscribeMinhas();
  if (S.lobbyUnsub) return;
  // só as mesas marcadas como públicas aparecem na lista; as outras só entram pelo link ou código
  S.lobbyUnsub = S.db.listenCol(
    "portas",
    { where: ["listada", true], limit: 100 },
    list => {
      S.loaded.lobby = true;
      S.mesas = list.sort((a, b) => (b.criada || 0) - (a.criada || 0));
      if (!S.mesaId) showLobby();
    },
    e => {
      S.loaded.lobby = true;
      S.lobbyErr = true;
      if (!S.mesaId) showLobby();
    }
  );
}
function showLobby() {
  if (S.gate || S.mesaId) return; // portão de entrada aberto: não atropelar
  $("#vtt").hidden = true;
  const L = $("#lobby");
  L.hidden = false;
  document.title = "Simula Ordem";
  // "Suas mesas" e "Mesas em que você joga" vêm da conta (valem em qualquer aparelho); o histórico local completa
  const idx = S.minhas || [];
  const seen = new Set();
  const fromIdx = papel =>
    idx
      .filter(x => x.papel === papel)
      .sort((a, b) => (b.ts || 0) - (a.ts || 0))
      .map(
        x =>
          S.mesas.find(m => m.id === x.id) || {
            id: x.id,
            nome: x.nome,
            desc: x.desc,
            mestre: papel === "mestre" ? S.uid : ""
          }
      );
  const mine = [...fromIdx("mestre"), ...S.mesas.filter(m => m.mestre === S.uid)].filter(
    m => !seen.has(m.id) && seen.add(m.id)
  );
  const local = lsGet("ms_visitadas", []);
  const visited = [...fromIdx("jogador"), ...S.mesas.filter(m => local.includes(m.id))].filter(
    m => m.mestre !== S.uid && !seen.has(m.id) && seen.add(m.id)
  );
  const minhas = [...seen];
  const card = m =>
    `<div class="mesa-wrap"><button class="mesa-card" data-mesa="${esc(m.id)}"><span class="label">Mesa ${esc(m.id)}${m.mestre === S.uid ? " · você é o mestre" : ""}</span><b>${esc(m.nome)}</b><span class="muted small">${esc(m.desc || "Sem descrição")}</span></button>${m.mestre === S.uid ? `<button class="btn sm ghost mesa-del" data-delmesa="${esc(m.id)}" data-nome="${esc(m.nome)}" aria-label="Apagar mesa">Apagar</button>` : ""}</div>`;
  const others = S.mesas.filter(m => m.mestre !== S.uid && !minhas.includes(m.id));
  const anon = S.authUser && S.authUser.isAnonymous;
  L.innerHTML = `<div class="lwrap">
   <div class="row between"><div class="brand">${I.logo()}<div>Simula Ordem<small>Ordo Realitas · sistema de Ordem</small></div></div>
    <div class="who">${S.testMode ? '<span class="tag red">Modo de teste</span>' : anon ? `Convidado neste aparelho <button class="btn sm" id="btnGoogle">Entrar com Google</button>` : S.authUser ? `Conectado como ${esc(S.authUser.displayName || S.authUser.email || "agente")} <button class="btn sm ghost" id="btnSair">Sair</button>` : ""}</div></div>
   <section class="hero">
    <div class="stack"><span class="label">Mesa virtual de Ordem Paranormal</span>
     <h1>Abra o <em>Outro Lado</em><br>para os seus <b>agentes</b>.</h1>
     <p>Fichas com as regras do livro, rolagens que todo mundo vê na hora, cenas e mapas com tokens, escudo do mestre, combate e homebrew. Crie uma mesa e mande o link para o grupo.</p>
     <div class="feats">${["Fichas digitais", "Rolagens ao vivo", "Cenas e tokens", "Escudo do mestre", "Combate", "Homebrew"].map(x => `<span class="tag on">${x}</span>`).join("")}</div>
    </div>
    <form class="box stack" id="fNova"><h3>Nova mesa</h3>
     <div class="field"><label class="label" for="nmMesa">Nome da campanha</label><input type="text" id="nmMesa" maxlength="60" placeholder="Ex.: O Segredo na Floresta" required></div>
     <div class="field"><label class="label" for="dsMesa">Descrição curta</label><input type="text" id="dsMesa" maxlength="120" placeholder="Ex.: Missão de NEX 5% no interior"></div>
     <div class="field"><label class="label" for="acMesa">Quem pode entrar</label><select id="acMesa"><option value="livre">Quem tiver o link ou o código</option><option value="senha">Só com senha</option><option value="aprovacao">Só quem eu aprovar</option></select></div>
     <div class="field" id="snWrap" hidden><label class="label" for="snMesa">Senha da mesa</label><input type="text" id="snMesa" maxlength="40" autocomplete="off"></div>
     <label class="check"><input type="checkbox" id="lsMesa"> Mostrar na lista pública do site</label>
     <button class="btn primary">Criar mesa como mestre</button>
     <div class="sub">Já tem um código?</div>
     <div class="row"><input type="text" id="codeIn" placeholder="Ex.: K7RQ2M" maxlength="10" style="flex:1;text-transform:uppercase"><button type="button" class="btn" id="btnEntrar">Entrar</button></div>
     <div class="row"><button type="button" class="btn sm ghost" id="btnAjuda">Como usar o site</button><button type="button" class="btn sm ghost" id="btnRestaurar">Restaurar mesa de um backup</button></div>
    </form>
   </section>
   <section class="stack" style="margin-top:30px"><div class="row between"><h2>Meus personagens</h2><span class="row" style="gap:6px"><button class="btn sm ghost" id="btnImpSolo" title="Abrir um arquivo de personagem baixado aqui ou recebido de um amigo">Importar personagem</button><button class="btn sm primary" id="btnNovoSolo">Criar personagem</button></span></div>
    <p class="muted small" style="margin:0">Crie aqui, sem mesa, e leve para qualquer mesa depois. Entre com Google para ter seus personagens em qualquer aparelho.</p>
    ${soloCardsHTML()}
    ${
      (S.meus || []).length
        ? `<div class="mesas" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">${S.meus
            .slice()
            .sort((x, y) => (y.ts || 0) - (x.ts || 0))
            .map(
              c =>
                `<div class="mesa-card pchar"><button class="pc-open" data-meu="${esc(c.id)}">${c.foto ? `<img class="avatar" src="${c.foto}" alt="" style="width:52px;height:52px;object-fit:cover">` : `<div class="avatar ph" style="width:52px;height:52px">${esc((c.nome || "?").charAt(0).toUpperCase())}</div>`}<div style="min-width:0;text-align:left"><b>${esc(c.nome)}</b><div class="muted small">${esc(c.classe)}${c.trilha ? " · " + esc(c.trilha) : ""} · NEX ${c.nex}%</div><div class="muted small">Mesa: ${esc(c.mesaNome || c.mesaId)}</div></div></button><button class="btn sm ghost" data-copiar="${esc(c.id)}">Levar para outra mesa</button></div>`
            )
            .join("")}</div>`
        : (S.solos || []).length
          ? ""
          : `<div class="empty">${S.loaded.meus ? "Nenhum personagem ainda. Toque em <b>Criar personagem</b>, ou entre numa mesa e crie lá." : "Carregando…"}</div>`
    }
   </section>
   ${mine.length ? `<section class="stack" style="margin-top:30px"><h2>Suas mesas</h2><div class="mesas">${mine.map(card).join("")}</div></section>` : ""}
   ${visited.length ? `<section class="stack" style="margin-top:26px"><h2>Mesas em que você joga</h2><div class="mesas">${visited.map(card).join("")}</div></section>` : ""}
   <section class="stack" style="margin-top:26px"><h2>Mesas públicas</h2>${others.length ? `<div class="mesas">${others.map(card).join("")}</div>` : `<div class="empty">${S.loaded.lobby ? (S.lobbyErr ? "Não consegui carregar a lista de mesas." : "Nenhuma mesa pública agora. As mesas de grupos de amigos ficam fora desta lista e entram pelo link.") : "Carregando mesas…"}</div>`}</section>
   ${anon ? `<p class="muted small" style="margin-top:30px">Como convidado, você é reconhecido só neste navegador. Entre com Google para ser o mesmo agente (e o mesmo mestre) em qualquer aparelho.</p>` : ""}
   <footer class="foot">Simula Ordem é um projeto de fã, gratuito e sem fins lucrativos, feito por wasmorf. Não é um produto oficial nem tem ligação com Ordem Paranormal, Rafael Lange (Cellbit) ou a Jambô Editora. Ordem Paranormal e seus símbolos pertencem aos seus donos. Para jogar, use o Livro de Regras oficial.</footer>
  </div>`;
  $$("[data-mesa]").forEach(
    b =>
      (b.onclick = () => {
        location.hash = "mesa-" + b.dataset.mesa;
      })
  );
  $$("[data-meu]").forEach(
    b =>
      (b.onclick = () => {
        const c = S.meus.find(x => x.id === b.dataset.meu);
        if (!c) return;
        S.abrirFicha = c.fichaId;
        location.hash = "mesa-" + c.mesaId;
      })
  );
  bindSoloCards();
  $$("[data-delmesa]").forEach(b => (b.onclick = () => apagarMesa(b.dataset.delmesa, b.dataset.nome)));
  $$("[data-copiar]").forEach(
    b => (b.onclick = () => copiarFicha(S.meus.find(x => x.id === b.dataset.copiar)))
  );
  $("#acMesa").onchange = () => {
    $("#snWrap").hidden = $("#acMesa").value !== "senha";
  };
  $("#fNova").onsubmit = async ev => {
    ev.preventDefault();
    const nome = $("#nmMesa").value.trim();
    if (!nome) return;
    const acesso = $("#acMesa").value,
      senha = $("#snMesa").value.trim();
    if (acesso === "senha" && senha.length < 3) {
      toast("Escolha uma senha com pelo menos 3 caracteres.");
      return;
    }
    try {
      const id = await criarMesa({
        nome,
        desc: $("#dsMesa").value.trim(),
        acesso,
        listada: $("#lsMesa").checked,
        senha
      });
      location.hash = "mesa-" + id;
      toast("Mesa criada. Mande o link para os jogadores.");
    } catch (e) {
      fail(e);
    }
  };
  $("#btnEntrar").onclick = () => {
    const c = $("#codeIn").value.trim().toUpperCase();
    if (/^[A-Z0-9]{4,10}$/.test(c)) location.hash = "mesa-" + c;
    else toast("Digite um código válido, como K7RQ2M.");
  };
  $("#btnRestaurar").onclick = importarMesa;
  $("#btnAjuda").onclick = ajudaModal;
  const g = $("#btnGoogle");
  if (g) g.onclick = googleLogin;
  const sa = $("#btnSair");
  if (sa) sa.onclick = sairConta;
}
async function copiarFicha(c) {
  if (!c) return;
  const r = await formBox(
    "Levar " + c.nome + " para outra mesa",
    `<p class="muted small" style="margin:0">Uma cópia da ficha vai para a outra mesa. A original continua onde está.</p>
    <div class="field"><label class="label" for="cpCod">Código da mesa de destino</label><input type="text" id="cpCod" name="cod" maxlength="10" placeholder="Ex.: K7RQ2M" style="text-transform:uppercase" required></div>`,
    "Copiar ficha"
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
    const f = await S.db.get("mesas/" + c.mesaId + "/fichas/" + c.fichaId);
    if (!f) {
      toast("A ficha original não existe mais.");
      return;
    }
    const id = "f" + rid(8);
    const nova = { ...f, dono: S.uid, criada: Date.now(), pv: null, pe: null, san: null, cond: [] };
    try {
      await S.db.set("mesas/" + cod + "/fichas/" + id, nova);
    } catch (e) {
      if (e && e.code === "permission-denied") {
        toast("Entre nessa mesa primeiro (pelo link ou código) e depois leve a ficha.");
        return;
      }
      throw e;
    }
    toast(`${c.nome} foi para a mesa ${m.nome}.`);
    S.abrirFicha = id;
    location.hash = "mesa-" + cod;
  } catch (e) {
    fail(e);
  }
}
async function trocarUsuario(u) {
  // depois de entrar com Google em outro aparelho
  if (S.solosUnsub) {
    S.solosUnsub();
    S.solosUnsub = null;
  }
  S.uid = u.uid;
  S.authUser = u;
  if (S.meusUnsub) {
    S.meusUnsub();
    S.meusUnsub = null;
  }
  if (S.minhasUnsub) {
    S.minhasUnsub();
    S.minhasUnsub = null;
  }
  subscribeMeus();
}
async function googleLogin() {
  const auth = firebase.auth();
  const prov = new firebase.auth.GoogleAuthProvider();
  try {
    const r = await auth.currentUser.linkWithPopup(prov);
    S.authUser = r.user;
    toast("Conta Google ligada. Agora você é o mesmo agente em qualquer aparelho.");
  } catch (e) {
    if (e.code === "auth/credential-already-in-use" || e.code === "auth/email-already-in-use") {
      // essa conta Google já existe (entrou em outro aparelho antes): troca para ela
      try {
        const cred =
          e.credential ||
          (firebase.auth.GoogleAuthProvider.credentialFromError &&
            firebase.auth.GoogleAuthProvider.credentialFromError(e));
        const r = cred ? await auth.signInWithCredential(cred) : await auth.signInWithPopup(prov);
        await trocarUsuario(r.user);
        toast("Entrou com a sua conta Google.");
      } catch (e2) {
        fail(e2);
      }
    } else if (e.code === "auth/operation-not-allowed")
      toast("Ative o login com Google no Firebase: Authentication → Sign-in method → Google.");
    else if (e.code === "auth/unauthorized-domain")
      toast("Adicione o domínio do site em Authentication → Settings → Domínios autorizados.");
    else if (e.code === "auth/popup-blocked")
      toast("O navegador bloqueou a janela do Google. Libere pop-ups para este site e tente de novo.");
    else if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request")
      toast("Não deu para entrar com Google agora.");
  }
  showLobby();
}
async function sairConta() {
  if (
    !(await confirmBox(
      "Sair da conta Google?",
      "Neste aparelho você volta a ser convidado. Suas fichas continuam salvas na conta: é só entrar de novo.",
      "Sair"
    ))
  )
    return;
  try {
    await firebase.auth().signOut();
    const r = await firebase.auth().signInAnonymously();
    await trocarUsuario(r.user);
    toast("Você saiu da conta.");
  } catch (e) {
    fail(e);
  }
  showLobby();
}

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
          const old = S.fichas[fid];
          if (old && S.dirty[fid]) next[fid] = old;
          else if (old) {
            for (const k of Object.keys(old)) if (!(k in rest)) delete old[k];
            Object.assign(old, rest);
            next[fid] = old;
          } // mantém o mesmo objeto (a ficha aberta continua ligada)
          else next[fid] = rest;
        });
        Object.entries(S.fichas).forEach(([k, f]) => {
          if (f.npc) next[k] = f;
        });
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
  pararMapDocs(); // 5s-docs-mapa.js
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
    "notasUnsub",
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
  S.notas = {};
  S.mural = null;
  S.loaded.entrada = false;
  if (typeof pararLocal === "function") pararLocal();
  if (S.cenasUnsub) {
    S.cenasUnsub();
    S.cenasUnsub = null;
  }
  S.cenasMode = null;
  if (S.notasUnsub) {
    S.notasUnsub();
    S.notasUnsub = null;
  }
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

/* ===================== TRILHO / NAVEGAÇÃO ===================== */
function tools() {
  return [
    ["cenas", "Cenas", I.mapa],
    ["tokens", "Tokens", I.token],
    ["agentes", "Agentes", I.agente],
    ["rolagens", "Rolagens", I.dado],
    ["documentos", "Documentos", I.papel],
    ["trilha", "Trilha", I.musica],
    ["combate", "Combate", I.combate],
    ...(S.isM ? [["escudo", "Escudo", I.escudo]] : []),
    ["homebrew", "Homebrew", I.frasco],
    ["regras", "Regras", I.livro],
    ["ajuda", "Como usar", I.ajuda]
  ];
}
function renderRail() {
  const t = tools();
  $("#rail").innerHTML =
    `<button class="tool logo" id="toLobby" aria-label="Voltar às mesas">${I.logo(40)}<span class="tip">Voltar às mesas</span></button><div class="sep"></div>` +
    t
      .map(
        ([k, n, ic]) =>
          `<button class="tool" data-tool="${k}" aria-pressed="${S.tool === k}" aria-label="${n}">${ic}${k === "escudo" && (S.entrada || []).length ? '<i class="badge"></i>' : ""}<span class="tip">${n}</span></button>`
      )
      .join("") +
    `<div class="grow"></div><div class="tag ${S.isM ? "on" : ""}" style="font-size:9px;padding:2px 4px">${S.isM ? "Mestre" : "Agente"}</div>`;
  $("#bottomnav").innerHTML =
    t
      .map(
        ([k, n, ic]) =>
          `<button data-tool="${k}" aria-pressed="${S.tool === k}">${ic}<span>${n}</span></button>`
      )
      .join("") + `<button id="toLobby2">${I.sair}<span>Mesas</span></button>`;
  {
    // marca quando ainda há ferramentas escondidas à direita (o CSS mostra uma sombra)
    const nav = $("#bottomnav");
    const marcar = () => nav.classList.toggle("mais", nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 4);
    nav.onscroll = marcar;
    requestAnimationFrame(marcar);
  }
  $$("[data-tool]").forEach(
    b => (b.onclick = () => openTool(S.tool === b.dataset.tool ? null : b.dataset.tool))
  );
  $("#toLobby").onclick = () => {
    location.hash = "";
  };
  $("#toLobby2").onclick = () => {
    location.hash = "";
  };
}
function openTool(k) {
  S.tool = k;
  if (k !== "agentes") S.openFicha = null;
  $$("[data-tool]").forEach(b => b.setAttribute("aria-pressed", b.dataset.tool === k));
  const p = $("#panel");
  p.hidden = !k;
  p.classList.toggle("wide", k === "escudo" || (k === "agentes" && !!S.openFicha));
  if (k === "escudo") subscribeNotas();
  renderPanel();
  if (window.innerWidth > 760)
    requestAnimationFrame(() => {
      if (!S.userMoved) fitView();
    });
}
$("#pclose").onclick = () => openTool(null);
function renderPanel() {
  if (!S.tool) return;
  const T = {
    ajuda: "Como usar",
    documentos: "Documentos",
    trilha: "Trilha sonora",
    cenas: "Cenas",
    tokens: "Tokens",
    agentes: "Agentes",
    rolagens: "Rolagens",
    combate: "Combate",
    escudo: "Escudo do mestre",
    homebrew: "Homebrew",
    regras: "Regras"
  };
  $("#panel").classList.toggle("wide", S.tool === "escudo" || (S.tool === "agentes" && !!S.openFicha));
  $("#ptitle").textContent =
    S.tool === "agentes" && S.openFicha && S.fichas[S.openFicha] ? "Ficha" : T[S.tool];
  const b = $("#pbody");
  const y = b.scrollTop;
  const fn = {
    ajuda: ajudaHTML,
    documentos: documentosHTML,
    trilha: trilhaHTML,
    cenas: cenasHTML,
    tokens: tokensHTML,
    agentes: () => (S.openFicha ? sheetHTML() : agentesHTML()),
    rolagens: rolagensHTML,
    combate: combateHTML,
    escudo: escudoHTML,
    homebrew: homebrewHTML,
    regras: regrasHTML
  }[S.tool];
  b.innerHTML = fn();
  b.scrollTop = y;
  ({
    ajuda: bindAjuda,
    documentos: bindDocumentos,
    trilha: bindTrilha,
    cenas: bindCenas,
    tokens: bindTokens,
    agentes: () => (S.openFicha ? bindSheet() : bindAgentes()),
    rolagens: bindRolagens,
    combate: bindCombate,
    escudo: bindEscudo,
    homebrew: bindHomebrew,
    regras: bindRegras
  })[S.tool]();
  if (S.tool === "rolagens") renderLog();
}
function isEditing() {
  const a = document.activeElement;
  return a && $("#pbody").contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && a.type !== "checkbox";
}

/* (tabuleiro: ver 4b-mapa.js) */
/* ===================== CENAS ===================== */
async function exibir(sid) {
  try {
    await S.db.merge(P(), { cenaAtiva: sid });
    toast(sid ? "Cena exibida para os jogadores." : "Nenhuma cena exibida agora.");
  } catch (e) {
    fail(e);
  }
}
function cenasHTML() {
  if (!S.isM) {
    const sc = S.cenas.find(c => c.id === (S.mesa && S.mesa.cenaAtiva));
    return `<p class="muted" style="margin:0">Só o mestre cria e troca as cenas.</p>${sc ? `<div class="scene live">${sc.thumb ? `<img class="th" src="${sc.thumb}" alt="">` : `<div class="th"></div>`}<div><div class="st">Exibindo agora</div><div class="nm">${esc(sc.nome)}</div></div></div>` : `<div class="empty">Nenhuma cena exibida agora.</div>`}`;
  }
  const live = S.mesa && S.mesa.cenaAtiva;
  const list = S.cenas
    .map(c => {
      const isL = c.id === live;
      return `<div class="scene ${isL ? "live" : ""}">${c.thumb ? `<img class="th" src="${c.thumb}" alt="">` : `<div class="th"></div>`}
    <div class="stack" style="gap:4px;min-width:0"><div class="st">${isL ? "Exibindo para jogadores" : "Oculta para jogadores"}${S.viewSid === c.id ? " · você está vendo" : ""}</div><div class="nm">${esc(c.nome)}</div>
    <div class="row">${isL ? `<button class="btn sm" data-stop>Parar de exibir</button>` : `<button class="btn sm primary" data-live="${esc(c.id)}">Exibir para jogadores</button>`}${S.viewSid !== c.id ? `<button class="btn sm" data-view="${esc(c.id)}">Ver</button>` : ""}${c.mapaId ? `<button class="btn sm ghost" data-emapa="${esc(c.mapaId)}">Editar mapa</button>` : ""}<button class="btn sm ghost" data-edit="${esc(c.id)}">Editar</button><button class="btn sm ghost" data-scopy="${esc(c.id)}" title="Copiar esta cena para outra mesa sua">Copiar p/ outra mesa</button><button class="btn sm ghost" data-spass="${esc(c.id)}" title="Escadas e elevadores que levam o grupo para outra cena">Passagens${(c.passagens || []).length ? ` (${c.passagens.length})` : ""}</button><button class="btn sm ghost" data-del="${esc(c.id)}" aria-label="Apagar cena">✕</button></div></div></div>`;
    })
    .join("");
  return `<div class="row" style="flex-wrap:nowrap"><button class="btn primary" style="flex:1" id="novaCena">Cena com imagem</button><button class="btn primary" style="flex:1" id="btnCriarMapa2">Criar mapa</button></div>
   <p class="muted small" style="margin:0">Use uma imagem sua (mapa, cenário, documento, pista) ou monte um mapa no criador, do zero ou a partir de um mapa pronto.</p>
   ${S.cenas.length ? `<div class="cards">${list}</div>` : `<div class="empty">Nenhuma cena ainda. Use uma imagem ou crie um mapa.</div>`}
   <details class="box" id="mapasBox"><summary style="cursor:pointer"><b>Meus mapas</b> <span class="muted small">(feitos no criador)</span></summary><div class="stack" style="margin-top:10px"><button class="btn sm" id="btnCriarMapa">Criar mapa novo</button><div class="cards" id="mapasList"><p class="muted small">Carregando…</p></div></div></details>`;
}
function bindCenas() {
  const n = $("#novaCena");
  if (n) n.onclick = novaCena;
  $$("[data-scopy]").forEach(b => (b.onclick = () => copiarCena(b.dataset.scopy))); // 5s-docs-mapa.js
  $$("[data-spass]").forEach(b => (b.onclick = () => passagensModal(b.dataset.spass))); // 5t-portas-andares.js
  const cm = $("#btnCriarMapa2");
  if (cm) cm.onclick = escolherModelo;
  const mb = $("#mapasBox");
  if (mb)
    mb.ontoggle = () => {
      if (mb.open && !mb.dataset.ok) {
        mb.dataset.ok = 1;
        bindMapas();
      }
    };
  $$("[data-emapa]").forEach(
    b =>
      (b.onclick = async () => {
        try {
          const m = await S.db.get(P() + "/mapas/" + b.dataset.emapa);
          if (!m) {
            toast("O mapa dessa cena foi apagado.");
            return;
          }
          meAbrir(m, b.dataset.emapa);
        } catch (e) {
          fail(e);
        }
      })
  );
  $$("[data-live]").forEach(
    b =>
      (b.onclick = async () => {
        await exibir(b.dataset.live);
        viewScene(b.dataset.live);
      })
  );
  $$("[data-stop]").forEach(b => (b.onclick = () => exibir(null)));
  $$("[data-view]").forEach(
    b =>
      (b.onclick = () => {
        viewScene(b.dataset.view);
        renderPanel();
      })
  );
  $$("[data-edit]").forEach(b => (b.onclick = () => editarCena(b.dataset.edit)));
  $$("[data-del]").forEach(
    b =>
      (b.onclick = async () => {
        const c = S.cenas.find(x => x.id === b.dataset.del);
        if (
          !(await confirmBox(
            "Apagar " + c.nome + "?",
            "A cena e a posição dos tokens nela somem para todos."
          ))
        )
          return;
        try {
          if (S.mesa.cenaAtiva === c.id) await S.db.merge(P(), { cenaAtiva: null });
          await S.db.del(P() + "/cenas/" + c.id);
          await S.db.del(P() + "/cenaImg/" + c.id);
          await S.db.del(P() + "/pos/" + c.id);
          delete S.sceneImg[c.id];
          if (S.viewSid === c.id) viewScene(S.mesa.cenaAtiva === c.id ? null : S.mesa.cenaAtiva);
        } catch (e) {
          fail(e);
        }
      })
  );
}
async function novaCena() {
  const file = await pickImage();
  if (!file) return;
  toast("Preparando a imagem…");
  let img;
  try {
    img = await compressScene(file);
  } catch (e) {
    toast("Não consegui usar essa imagem. Tente outra (JPG ou PNG).");
    return;
  }
  const nome0 = file.name.replace(/\.[^.]+$/, "").slice(0, 50);
  const r = await formBox(
    "Nova cena",
    `<img src="${img.url}" alt="" style="border-radius:6px;max-height:180px;object-fit:contain;background:var(--bg)">
    <div class="field"><label class="label" for="cn">Nome da cena</label><input type="text" id="cn" name="nome" value="${esc(nome0)}" maxlength="50" required></div>
    <label class="check"><input type="checkbox" name="grade"> Mostrar grade sobre o mapa</label>
    <label class="check"><input type="checkbox" name="exibir"> Já exibir para os jogadores</label>`,
    "Criar cena"
  );
  if (!r) return;
  const id = "c" + rid(8);
  const thumb = await thumbOf(img.url);
  try {
    await S.db.set(P() + "/cenaImg/" + id, { url: img.url });
    await S.db.set(P() + "/cenas/" + id, {
      nome: r.nome.trim() || "Cena",
      thumb,
      w: img.w,
      h: img.h,
      grade: !!r.grade,
      encaixe: false,
      tam: 0,
      criada: Date.now()
    });
    S.sceneImg[id] = img.url;
    if (r.exibir) await exibir(id);
    viewScene(id);
    toast("Cena criada.");
  } catch (e) {
    fail(e);
  }
}
async function editarCena(sid) {
  const c = S.cenas.find(x => x.id === sid);
  if (!c) return;
  const r = await formBox(
    "Editar cena",
    `<div class="field"><label class="label" for="en">Nome</label><input type="text" id="en" name="nome" value="${esc(c.nome)}" maxlength="50"></div>
   <label class="check"><input type="checkbox" name="grade" ${c.grade ? "checked" : ""}> Mostrar grade</label>
   <label class="check"><input type="checkbox" name="encaixe" ${c.encaixe ? "checked" : ""}> Tokens encaixam na grade</label>
   <div class="field"><label class="label" for="et">Tamanho da casa / token (px no mapa, 0 = automático)</label><input type="number" id="et" name="tam" value="${c.tam || 0}" min="0" max="600"></div>
   ${
     (c.nomes || []).length
       ? `<div class="sub" style="margin:0">Nomes dos lugares</div><label class="check"><input type="checkbox" name="nomesOn" ${c.nomesOn !== false ? "checked" : ""}> Mostrar nomes para os jogadores</label>
     <div class="stack" style="gap:2px;padding-left:22px">${c.nomes.map((n, i) => `<label class="check small"><input type="checkbox" name="nm${i}" ${n.h ? "" : "checked"}> ${esc(n.t)}</label>`).join("")}</div>`
       : ""
   }`
  );
  if (!r) return;
  const up = {
    nome: r.nome.trim() || c.nome,
    grade: !!r.grade,
    encaixe: !!r.encaixe,
    tam: Math.max(0, +r.tam || 0)
  };
  if ((c.nomes || []).length) {
    up.nomesOn = !!r.nomesOn;
    up.nomes = c.nomes.map((n, i) => ({ ...n, h: !r["nm" + i] }));
  }
  try {
    await S.db.merge(P() + "/cenas/" + sid, up);
  } catch (e) {
    fail(e);
  }
}

/* (tokens: ver 4b-mapa.js) */
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
</script>
