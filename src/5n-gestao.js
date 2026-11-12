<script>
"use strict";
/* =====================================================================
   GESTÃO: apagar mesa, retirar personagem da mesa, transformar em NPC
   ===================================================================== */
const MESA_SUBCOLS = [
  "log",
  "privado",
  "pings",
  "desenhos",
  "pos",
  "nevoa",
  "cenaImg",
  "cenas",
  "tokens",
  "fichas",
  "npcs",
  "homebrew",
  "estado",
  "mestre",
  "docs",
  "mapas",
  "arteBest",
  "pedidos",
  "entrada",
  "bloqueados",
  "segredo",
  "membros"
];
async function apagarMesa(id, nome) {
  const r = await formBox(
    `Apagar a mesa "${nome || id}"?`,
    `<p style="margin:0">Some tudo para todos: fichas da mesa, NPCs, cenas, mapas, documentos, rolagens. <b>Não dá para desfazer.</b></p>
   <p class="muted small" style="margin:0">Se quiser guardar, baixe antes o backup no Escudo do mestre. Personagens guardados em "Meus personagens" não são apagados.</p>
   <div class="field"><label class="label" for="dmC">Para confirmar, escreva o código da mesa: <b>${esc(id)}</b></label><input type="text" id="dmC" name="cod" maxlength="10" autocomplete="off" style="text-transform:uppercase" required></div>`,
    "Apagar para sempre"
  );
  if (!r) return;
  if (r.cod.trim().toUpperCase() !== id) {
    toast("O código não confere. Nada foi apagado.");
    return;
  }
  toast("Apagando a mesa…");
  const p = "mesas/" + id;
  try {
    if (S.mesaId === id) {
      location.hash = "";
      await new Promise(z => setTimeout(z, 300));
    }
    for (const col of MESA_SUBCOLS) {
      let docs = [];
      try {
        docs = await S.db.getCol(p + "/" + col);
      } catch (e) {}
      for (const d of docs) {
        try {
          await S.db.del(p + "/" + col + "/" + d.id);
        } catch (e) {}
      }
    }
    try {
      await S.db.del("portas/" + id);
    } catch (e) {}
    await S.db.del(p);
    try {
      await S.db.del("usuarios/" + S.uid + "/mesas/" + id);
    } catch (e) {}
    try {
      const L = lsGet("ms_visitadas", []);
      if (Array.isArray(L))
        lsSet(
          "ms_visitadas",
          L.filter(x => x !== id)
        );
    } catch (e) {}
    toast("Mesa apagada.");
    if (!S.mesaId) showLobby();
  } catch (e) {
    fail(e);
  }
}
async function retirarFicha(id) {
  const f = S.fichas[id];
  if (!f) return;
  const meu = f.dono === S.uid && !f.rapido;
  const r = await formBox(
    `Retirar ${f.nome} da mesa?`,
    `<p style="margin:0">A ficha sai desta mesa${f.npc ? " (é um NPC)" : meu ? "" : " (é de outro jogador)"}.</p>
   ${meu ? `<label class="check"><input type="checkbox" name="guardar" checked> Salvar em Meus personagens antes (atualiza o que já está lá)</label>` : ""}
   <label class="check"><input type="checkbox" name="tok" checked> Tirar também os tokens dela</label>`,
    "Retirar"
  );
  if (!r) return;
  try {
    if (r.guardar) await soloGuardarCopia(id, true);
    if (r.tok)
      for (const t of S.tokens.filter(t => t.fichaId === id)) {
        try {
          await S.db.del(P() + "/tokens/" + t.id);
        } catch (e) {}
      }
    await S.db.del(fichaPath(id));
    delete S.fichas[id];
    S.openFicha = null;
    renderPanel();
    renderBoard();
    toast(`${f.nome} saiu da mesa.`);
  } catch (e) {
    fail(e);
  }
}
async function virarNpc(id) {
  const f = S.fichas[id];
  if (!f || !S.isM || f.npc) return;
  const r = await formBox(
    `Transformar ${f.nome} em NPC?`,
    `<p style="margin:0">A ficha passa a ser sua, como NPC, e sai da lista de agentes${f.dono !== S.uid ? " do jogador" : ""}. Os tokens continuam ligados a ela.</p>
   <label class="check"><input type="checkbox" name="vis"> Deixar a ficha visível para os jogadores</label>
   <div class="field"><label class="label" for="vnP">Pasta (opcional)</label><input type="text" id="vnP" name="pasta" maxlength="40" list="vnPastas"><datalist id="vnPastas">${npcPastas()
     .map(p => `<option value="${esc(p)}">`)
     .join("")}</datalist></div>`,
    "Transformar"
  );
  if (!r) return;
  const dados = JSON.parse(JSON.stringify(f));
  Object.assign(dados, { npc: true, visivel: !!r.vis, dono: S.uid, donoAntes: f.dono || S.uid });
  if (r.pasta.trim()) dados.pasta = r.pasta.trim();
  delete dados.solo;
  try {
    await S.db.set(P() + "/npcs/" + id, dados);
    await S.db.del(P() + "/fichas/" + id);
    S.fichas[id] = dados;
    tokensDono(id, S.uid);
    S.openFicha = id;
    renderPanel();
    renderBoard();
    toast(`${f.nome} agora é um NPC.`);
  } catch (e) {
    fail(e);
  }
}

async function virarAgente(id) {
  const f = S.fichas[id];
  if (!f || !S.isM || !f.npc) return;
  if (
    !(await confirmBox(
      `${f.nome} volta a ser agente?`,
      "A ficha sai dos NPCs e volta para a lista de agentes" +
        (f.donoAntes && f.donoAntes !== S.uid ? ", de novo com o jogador dono dela." : "."),
      "Voltar a ser agente"
    ))
  )
    return;
  const { npc, visivel, pasta, donoAntes, ...dados } = JSON.parse(JSON.stringify(f));
  dados.dono = donoAntes || S.uid;
  try {
    await S.db.set(P() + "/fichas/" + id, dados);
    await S.db.del(P() + "/npcs/" + id);
    S.fichas[id] = dados;
    tokensDono(id, dados.dono);
    S.openFicha = id;
    renderPanel();
    renderBoard();
    toast(`${f.nome} voltou a ser agente.`);
  } catch (e) {
    fail(e);
  }
}
function tokensDono(id, uid) {
  (S.tokens || [])
    .filter(t => t.fichaId === id && t.dono !== uid)
    .forEach(t => {
      t.dono = uid;
      S.db.merge(P() + "/tokens/" + t.id, { dono: uid }).catch(() => {});
    });
}
/* Dar o personagem para um jogador ou tirar dele (volta a ser NPC do mestre). Os tokens acompanham. */
async function darFicha(id) {
  const f = S.fichas[id];
  if (!f || !S.isM) return;
  const mestre = S.mesa && S.mesa.mestre;
  const atual = f.npc ? "" : f.dono === mestre ? "" : f.dono;
  const ops = opcoesJogadores([]);
  const r = await formBox(
    `Com quem fica ${f.nome}?`,
    `<p class="muted small" style="margin:0">Quem recebe passa a ver a ficha nos agentes dele, editar e mover o token. Ao tirar, a ficha volta a ser um NPC seu, escondido, e o jogador perde o token.</p>
   <div class="field"><label class="label" for="dfQ">Fica com</label><select id="dfQ" name="quem"><option value="">Ninguém: volta a ser NPC do mestre</option>${ops.map(([u, n]) => `<option value="${esc(u)}" ${u === atual ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></div>
   ${ops.length ? "" : `<p class="muted small" style="margin:0">Nenhum jogador entrou na mesa ainda.</p>`}`,
    "Confirmar"
  );
  if (!r) return;
  const uid = r.quem || "";
  try {
    if (!uid) {
      // tirar do jogador
      if (f.npc) {
        tokensDono(id, S.uid);
        toast(`${f.nome} já está com você.`);
        return;
      }
      const dados = JSON.parse(JSON.stringify(f));
      Object.assign(dados, { npc: true, visivel: false, dono: S.uid, donoAntes: f.dono || S.uid });
      delete dados.solo;
      await S.db.set(P() + "/npcs/" + id, dados);
      await S.db.del(P() + "/fichas/" + id);
      S.fichas[id] = dados;
      tokensDono(id, S.uid);
      toast(`${f.nome} saiu do jogador e voltou a ser NPC (escondido).`);
    } else if (f.npc) {
      const { npc, visivel, pasta, donoAntes, ...dados } = JSON.parse(JSON.stringify(f));
      dados.dono = uid;
      await S.db.set(P() + "/fichas/" + id, dados);
      await S.db.del(P() + "/npcs/" + id);
      S.fichas[id] = dados;
      tokensDono(id, uid);
      toast(`${f.nome} agora está com ${nomeMembro(uid)}.`);
    } else {
      f.dono = uid;
      await S.db.merge(P() + "/fichas/" + id, { dono: uid });
      tokensDono(id, uid);
      toast(`${f.nome} agora está com ${nomeMembro(uid)}.`);
    }
    S.openFicha = id;
    renderPanel();
    renderBoard();
  } catch (e) {
    fail(e);
  }
}
darFicha = umaVez(darFicha);
/* botões na ficha */
{
  const _bs = bindSheet;
  bindSheet = function () {
    _bs();
    if (S.solo) return;
    const id = S.openFicha;
    const f = S.fichas[id];
    if (!f || $("#gestBtns")) return;
    const st = $("#saveState");
    if (!st) return;
    const bt = [];
    if (S.isM && !f.criatura)
      bt.push(
        `<button class="btn sm ghost" id="btnDarFicha">${f.npc || f.dono === (S.mesa && S.mesa.mestre) ? "Dar a um jogador" : "Dar / tirar do jogador"}</button>`
      );
    if (f.npc) {
      if (!S.isM) return;
      bt.push(`<button class="btn sm ghost" id="btnRetirar">Retirar da mesa</button>`);
      if (!f.rapido) bt.push(`<button class="btn sm ghost" id="btnVirarAg">Voltar a ser agente</button>`);
    } else {
      if (f.rapido) return;
      if (canEditFicha(f)) bt.push(`<button class="btn sm ghost" id="btnRetirar">Retirar da mesa</button>`);
      if (S.isM) bt.push(`<button class="btn sm ghost" id="btnVirarNpc">Transformar em NPC</button>`);
    }
    if (!bt.length) return;
    st.insertAdjacentHTML(
      "beforebegin",
      `<span class="row" id="gestBtns" style="gap:4px;flex-wrap:wrap">${bt.join("")}</span>`
    );
    const a = $("#btnRetirar");
    if (a) a.onclick = () => retirarFicha(id);
    const b = $("#btnVirarNpc");
    if (b) b.onclick = () => virarNpc(id);
    const c = $("#btnVirarAg");
    if (c) c.onclick = () => virarAgente(id);
    const dd = $("#btnDarFicha");
    if (dd) dd.onclick = () => darFicha(id);
  };
}
/* apagar mesa também pelo Escudo */
function escudoApagarHTML() {
  return `<details class="box"><summary style="cursor:pointer"><b style="color:var(--red)">Apagar esta mesa</b></summary><div class="stack" style="margin-top:10px"><p class="muted small" style="margin:0">Some tudo para todos e não dá para desfazer. Baixe o backup antes se quiser guardar.</p><button class="btn danger" id="btnApagarMesa">Apagar a mesa ${esc(S.mesaId || "")}</button></div></details>`;
}
function bindEscudoApagar() {
  const b = $("#btnApagarMesa");
  if (b) b.onclick = () => apagarMesa(S.mesaId, S.mesa && S.mesa.nome);
}

/* ---------- limpar repetidos ---------- */
function gruposRepetidos(lista, chave) {
  const g = {};
  lista.forEach(x => {
    const k = chave(x);
    if (k) (g[k] = g[k] || []).push(x);
  });
  return Object.values(g).filter(a => a.length > 1);
}
async function juntarSolos() {
  const G = gruposRepetidos(S.solos || [], c => (c.nome || "").trim().toLowerCase());
  const n = G.reduce((t, a) => t + a.length - 1, 0);
  if (!n) return;
  if (
    !(await confirmBox(
      `Apagar ${n} cópia(s) repetida(s)?`,
      `Fica só a versão mais recente de cada personagem (${G.map(a => a[0].nome).join(", ")}). As fichas que já estão em mesas não mudam.`,
      "Apagar repetidos"
    ))
  )
    return;
  try {
    for (const a of G) {
      a.sort((x, y) => (y.atualizada || y.criada || 0) - (x.atualizada || x.criada || 0));
      for (const c of a.slice(1)) await S.db.del("usuarios/" + S.uid + "/personagens/" + c.id);
    }
    toast("Pronto, sem repetidos.");
  } catch (e) {
    fail(e);
  }
}
function repetidosMesa() {
  const L = Object.entries(S.fichas)
    .map(([id, f]) => ({ ...f, id }))
    .filter(f => !f.npc && !f.solo && (S.isM || f.dono === S.uid));
  return gruposRepetidos(L, f => (f.nome && f.nome.trim() ? f.dono + "|" + f.nome.trim().toLowerCase() : ""));
}
async function tirarRepetidosMesa() {
  const G = repetidosMesa();
  const n = G.reduce((t, a) => t + a.length - 1, 0);
  if (!n) return;
  if (
    !(await confirmBox(
      `Tirar ${n} ficha(s) repetida(s) da mesa?`,
      `Fica uma ficha de cada (${G.map(a => a[0].nome).join(", ")}): a que já tem token no mapa ou, se nenhuma tiver, a mais antiga.`,
      "Tirar repetidos"
    ))
  )
    return;
  try {
    for (const a of G) {
      const tk = f => (S.tokens.some(t => t.fichaId === f.id) ? 1 : 0);
      a.sort((x, y) => tk(y) - tk(x) || (x.criada || 0) - (y.criada || 0));
      for (const f of a.slice(1)) {
        await S.db.del(fichaPath(f.id));
        delete S.fichas[f.id];
      }
    }
    S.openFicha = null;
    renderPanel();
    renderBoard();
    toast("Pronto, sem fichas repetidas.");
  } catch (e) {
    fail(e);
  }
}
{
  const _ba = bindAgentes;
  bindAgentes = function () {
    _ba();
    const n = repetidosMesa().reduce((t, a) => t + a.length - 1, 0);
    const nf = $("#btnTrazerSolo") || $("#novaFicha");
    if (n && nf && !$("#btnRepMesa")) {
      nf.insertAdjacentHTML(
        "afterend",
        `<button class="btn block ghost" id="btnRepMesa" style="margin-top:6px;border-color:var(--red)">Tirar fichas repetidas (${n})</button>`
      );
      $("#btnRepMesa").onclick = tirarRepetidosMesa;
    }
    // evita criar duas fichas com toque duplo
    const nv = $("#novaFicha");
    if (nv && nv.onclick && !nv._u) {
      nv.onclick = umaVez(nv.onclick);
      nv._u = 1;
    }
  };
}
// prettier-ignore
// (sem espaços de propósito: versões antigas do site procuram exatamente este formato)
const VERSAO_SITE="11/11 13h05";

/* ---------- toque duplo: a mesma ação não roda duas vezes seguidas ---------- */
function umaVez(fn, ms = 1200) {
  let t = 0;
  return function (...a) {
    const n = Date.now();
    if (n - t < ms) return;
    t = n;
    return fn.apply(this, a);
  };
}
soloAbrir = umaVez(soloAbrir);
soloTrazer = umaVez(soloTrazer);
soloLevar = umaVez(soloLevar);
soloGuardarCopia = umaVez(soloGuardarCopia);
retirarFicha = umaVez(retirarFicha);
virarNpc = umaVez(virarNpc);
virarAgente = umaVez(virarAgente);
apagarMesa = umaVez(apagarMesa);
importarSolo = umaVez(importarSolo);
copiarFicha = umaVez(copiarFicha);
juntarSolos = umaVez(juntarSolos);
tirarRepetidosMesa = umaVez(tirarRepetidosMesa);
</script>
