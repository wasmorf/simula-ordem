"use strict";
/* Tela inicial: criar mesa, entrar com código, Meus personagens, mesas públicas. */
/* ===================== LOBBY ===================== */
/* Índice pessoal: usuarios/<uid>/fichas guarda um resumo de cada ficha da pessoa, em todas as mesas */
function subscribeMeus() {
  subscribeSolos(); // Meus personagens sem mesa (mesa/personagens)
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
  capasNoLobby(); // capa de cada mesa nos cards (mesa/capa)
}
async function copiarFicha(c) {
  if (toqueDuplo("copiarFicha")) return; // evita rodar duas vezes num toque duplo
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
