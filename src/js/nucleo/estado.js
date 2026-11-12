"use strict";
/* Estado do site (objeto S) e início: login, modo de teste, abrir a mesa do link. */
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
  registrarErro((e && (e.code || e.message)) || e, "fail"); // vai para o relatório (nucleo/erros.js)
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
