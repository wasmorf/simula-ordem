"use strict";
/* Jogar sozinho: começar pelo início do site, montar a cena (mapa, grupo com aliados bots e
   inimigos do bestiário), a vez de quem joga no combate e o fim do combate.
   O que os bots fazem na vez deles fica em sozinho/bots; o que o bot cria, em sozinho/gerar. */

const SOZ_NIVEIS = [
  ["facil", "Fácil"],
  ["normal", "Normal"],
  ["dificil", "Difícil"]
];
const espera = ms => new Promise(r => setTimeout(r, ms));

/* ---------- começar ---------- */
async function sozinhoNovo() {
  if (toqueDuplo("sozinhoNovo")) return;
  const meus = S.solos || [];
  const p = formBox(
    "Jogar sozinho",
    `<p class="muted small" style="margin:0">O site faz o papel do mestre e dos outros jogadores. Os aliados e os inimigos jogam sozinhos na vez deles; na sua vez, você anda com o seu token e escolhe o que fazer.</p>
     <div class="field"><label class="label" for="szMo">O que jogar</label><select id="szMo" name="modo"><option value="missao">Missão (investigação e combate)</option><option value="combate">Só um combate</option></select></div>
     <div class="field"><label class="label" for="szAg">Seu agente</label><select id="szAg" name="ag">${meus
       .map(
         c =>
           `<option value="s:${esc(c.id)}">${esc(c.nome)} · ${esc(c.classe)} · NEX ${+c.nex || 5}%</option>`
       )
       .join("")}${Object.keys(BOT_PERFIS)
       .map(k => `<option value="p:${k}">Agente pronto: ${k}</option>`)
       .join("")}</select></div>
     <div class="field" id="szNexW"><label class="label" for="szNex">NEX do agente pronto</label><select id="szNex" name="nex">${[5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 99].map(n => `<option value="${n}">${n}%</option>`).join("")}</select></div>
     <div class="row" style="flex-wrap:nowrap"><div class="field" style="flex:1"><label class="label" for="szAl">Aliados</label><select id="szAl" name="aliados">${[0, 1, 2, 3].map(n => `<option value="${n}" ${n === 2 ? "selected" : ""}>${n}</option>`).join("")}</select></div>
     <div class="field" style="flex:1"><label class="label" for="szNv">Desafio</label><select id="szNv" name="nivel">${SOZ_NIVEIS.map(([k, n]) => `<option value="${k}" ${k === "normal" ? "selected" : ""}>${n}</option>`).join("")}</select></div></div>
     <details class="box stack sz-ia"><summary>Mestre com IA (grátis, opcional)</summary>
      <p class="muted small" style="margin:0">Com a IA, o mestre escreve a história e você pode escrever o que quer fazer na investigação. Ela usa o Gemini do Google no plano grátis, com uma chave sua: entre em <b>aistudio.google.com/apikey</b> com a sua conta Google, toque em <b>Create API key</b> e cole aqui. A chave fica só neste navegador, e o limite grátis do dia é seu. No plano grátis, o Google pode usar o que é enviado para melhorar os produtos dele.</p>
      <div class="field"><label class="label" for="szIa">Chave do Gemini</label><input type="password" id="szIa" name="chave" autocomplete="off" value="${esc(iaChave())}" placeholder="Deixe vazio para jogar sem IA"></div>
     </details>
     <div class="field" id="szLuW"><label class="label" for="szLu">Lugar</label><select id="szLu" name="lugar"><option value="">Sortear</option>${BOT_LUGARES.map(n => `<option>${esc(n)}</option>`).join("")}</select></div>`,
    "Começar"
  );
  const ag = $("#szAg"),
    mo = $("#szMo");
  const vis = () => {
    $("#szNexW").hidden = !ag.value.startsWith("p:");
    $("#szLuW").hidden = mo.value === "missao"; // na missão, o caso escolhe os lugares
  };
  ag.onchange = mo.onchange = vis;
  vis();
  const r = await p;
  if (!r) return;
  iaGuardarChave(r.chave);
  const lugar = r.lugar || BOT_LUGARES[Math.floor(Math.random() * BOT_LUGARES.length)];
  let f;
  if (r.ag.startsWith("s:")) {
    const c = meus.find(x => "s:" + x.id === r.ag);
    if (!c) return;
    const { id: _id, solo: _solo, ...dados } = c;
    f = { ...dados, dono: S.uid, criada: Date.now(), pv: null, pe: null, san: null, cond: [] };
  } else {
    const nome = BOT_NOMES[Math.floor(Math.random() * BOT_NOMES.length)];
    const { bot: _bot, ...dados } = agenteBot(r.ag.slice(2), +r.nex || 5, nome);
    f = { ...dados, jogador: "" };
  }
  try {
    const nivel = (SOZ_NIVEIS.find(x => x[0] === r.nivel) || SOZ_NIVEIS[1])[1];
    const missao = r.modo === "missao";
    const id = await criarMesa({
      nome: "Sozinho · " + (missao ? "Missão" : lugar),
      desc: `${missao ? "Missão" : "Combate"} com bots · ${nivel}`,
      acesso: "aprovacao",
      listada: false,
      sozinho: true
    });
    const fid = "f" + rid(8);
    await S.db.set("mesas/" + id + "/fichas/" + fid, JSON.parse(JSON.stringify(f)));
    await S.db.merge("mesas/" + id, {
      sozPlano: { fid, aliados: +r.aliados || 0, nivel: r.nivel, lugar, modo: missao ? "missao" : "combate" }
    });
    location.hash = "mesa-" + id;
  } catch (e) {
    fail(e);
  }
}
/* Ao entrar na mesa de Jogar sozinho: na primeira vez monta tudo; depois, a missão volta de onde parou */
function sozinhoAoEntrar(m) {
  const pl = m.sozPlano;
  if (!S.isM || !pl || S.sozMontando === m.id) return;
  if (pl.montado) {
    if (pl.modo === "missao" && S.narRetomado !== m.id) {
      S.narRetomado = m.id;
      missaoRetomar().catch(fail);
    }
    return;
  }
  S.sozMontando = S.narRetomado = m.id;
  (pl.modo === "missao" ? missaoMontar(pl) : sozinhoMontar(pl))
    .catch(fail)
    .finally(() => (S.sozMontando = null));
}
/* ---------- montar a cena e o combate ---------- */
async function tokenNoLugar(id, cel, tam) {
  const f = S.fichas[id];
  let t = S.tokens.find(x => x.fichaId === id);
  if (!t) {
    const doc = f.npc
      ? {
          nome: f.nome,
          url: arteCriatura(f.rel || "", sementeDe(f.base || f.nome)),
          fichaId: id,
          ameaca: f.base,
          forma: "livre",
          usaFoto: true
        }
      : {
          nome: f.nome,
          url: f.foto ? "" : artePessoa(maH((f.nome || "").length, (f.nome || "x").charCodeAt(0), 9)),
          fichaId: id,
          forma: "quadrado",
          cor: f.bot ? "#6d5a8c" : corDe(S.uid),
          usaFoto: true
        };
    const tid = await criarToken(doc, false);
    if (!tid) return;
    t = { id: tid, ...doc, dono: S.uid };
    S.tokens.push(t);
  }
  if (cel) porEmCena(t.id, { x: Math.round((cel[0] + 0.5) * tam), y: Math.round((cel[1] + 0.5) * tam) });
}
/* O mapa de um lugar (criador de mapas) vira a cena exibida. Devolve { sid, mapaId, M }. */
async function sozinhoCena(lugar) {
  const mod = MA_MODELOS.find(x => x.nome === lugar && x.fn) || MA_MODELOS.find(x => x.fn === mbRua);
  const M = mod.fn();
  M.nome = lugar;
  const mapaId = "m" + rid(8);
  await S.db.set(P() + "/mapas/" + mapaId, JSON.parse(JSON.stringify({ ...M, atualizado: Date.now() })));
  const sid = await cenaDoMapa(M, mapaId);
  await S.db.merge(P(), { cenaAtiva: sid });
  for (let i = 0; i < 50 && !(S.cenas.some(c => c.id === sid) && S.loaded.fichas); i++) await espera(100);
  await viewScene(sid);
  S.botMapa = null;
  return { sid, mapaId, M };
}
/* O grupo: quem joga e os aliados que o bot cria (uma vez só). Devolve os ids, quem joga primeiro. */
async function sozinhoGrupo(plano, R = Math.random) {
  for (let i = 0; i < 50 && !S.fichas[plano.fid]; i++) await espera(100);
  const eu = S.fichas[plano.fid];
  if (!eu) throw new Error("Não achei a ficha do seu agente.");
  if (!plano.grupoPronto) {
    const usados = new Set([eu.nome]);
    for (const cls of classesDosAliados(eu.classe, plano.aliados || 0)) {
      const livres = BOT_NOMES.filter(n => !usados.has(n));
      const nome = livres[Math.floor(R() * livres.length)] || "Agente " + (usados.size + 1);
      usados.add(nome);
      const id = "f" + rid(8);
      S.fichas[id] = agenteBot(cls, +eu.nex || 5, nome);
      saveFicha(id, true);
    }
    plano.grupoPronto = true;
  }
  return Object.keys(S.fichas)
    .filter(id => !S.fichas[id].npc)
    .sort((a, b) => (a === plano.fid ? -1 : b === plano.fid ? 1 : 0));
}
/* Inimigos novos do bestiário (fichas de criatura). opc.el: só desse elemento; opc.fator: mais ou menos. */
function sozinhoInimigos(nex, tamGrupo, nivel, opc = {}, R = Math.random) {
  const inim = [];
  for (const b of inimigosPara(nex, tamGrupo, nivel, R, opc)) {
    const n = Object.values(S.fichas).filter(f => f.npc && f.base === b.n).length;
    const f = criaturaDe(b);
    f.nome = b.n + (n ? " " + (n + 1) : "");
    f.criada = Date.now();
    const id = "n" + rid(8);
    S.fichas[id] = f;
    saveFicha(id, true);
    inim.push(id);
  }
  return inim;
}
/* Põe o grupo (e os inimigos) nos pontos de início do mapa M da cena exibida */
async function sozinhoPosicionar(M, grupo, inim = [], R = Math.random) {
  const tam = (curScene() || {}).tam || tokenBase();
  const pts = (M && pontosDeInicio(M, grupo.length, inim.length, R)) || { agentes: [], inimigos: [] };
  for (const [i, id] of grupo.entries()) await tokenNoLugar(id, pts.agentes[i], tam);
  for (const [i, id] of inim.entries()) await tokenNoLugar(id, pts.inimigos[i], tam);
}
/* Começa o combate com todos e rola a iniciativa */
function sozinhoCombate(ids, lugar) {
  S.combate = {
    lista: ids.map(id => ({
      id: rid(5),
      tipo: S.fichas[id].npc ? "npcf" : "pc",
      fichaId: id,
      nome: S.fichas[id].nome,
      ini: null
    })),
    turno: 0,
    rodada: 1,
    inicio: Date.now()
  };
  botDiz(
    `Combate em ${lugar}: ${ids
      .filter(id => S.fichas[id].npc)
      .map(id => S.fichas[id].nome)
      .join(", ")}.`
  );
  rolarIniciativa();
  openTool("combate");
}
/* Monta o combate rápido: na primeira vez cria o mapa, a cena e os aliados; depois (outro combate)
   usa a mesma cena e o mesmo grupo. Os inimigos saem do bestiário pelo NEX e pelo desafio. */
async function sozinhoMontar(plano) {
  toast("Montando o combate…");
  plano = { ...plano };
  let M = null;
  if (!plano.sid) {
    const c = await sozinhoCena(plano.lugar);
    Object.assign(plano, { sid: c.sid, mapaId: c.mapaId });
    M = c.M;
  } else {
    M = await S.db.get(P() + "/mapas/" + plano.mapaId);
    if (S.viewSid !== plano.sid) await viewScene(plano.sid);
  }
  const grupo = await sozinhoGrupo(plano);
  const eu = S.fichas[plano.fid];
  const inim = sozinhoInimigos(+eu.nex || 5, grupo.length, plano.nivel);
  await sozinhoPosicionar(M, grupo, inim);
  await S.db.merge(P(), { sozPlano: { ...plano, montado: true } });
  sozinhoCombate([...grupo, ...inim], plano.lugar);
}

/* ---------- a vez de quem joga ---------- */
const sozChave = () => {
  const c = S.combate || {};
  return `${c.inicio || 0}:${c.rodada}:${c.turno}`;
};
function sozinhoVezHTML() {
  if (!sozinho()) return "";
  const x = vezAtual();
  const f = x && x.fichaId && S.fichas[x.fichaId];
  if (!f || f.npc || f.bot || cur(f, "pv") <= 0 || (S.combate.lista || []).some(y => y.ini == null))
    return "";
  if (S.sozAgiu === sozChave())
    return `<div class="box sozvez muted">Pronto. Agora é a vez do próximo…</div>`;
  const todos = emCombate();
  const eu = todos.find(c => c.id === x.fichaId);
  const tam = (curScene() || {}).tam || tokenBase();
  const dist = c => (eu && eu.t && c.t ? chebyshev(celulaDe(eu, tam), celulaDe(c, tam)) : 99);
  const inim = todos.filter(c => c.vivo && c.f.npc && c.t).sort((a, b) => dist(a) - dist(b));
  const amigos = todos.filter(c => c.vivo && !c.f.npc);
  const D = derivados(f);
  const rits = (f.rituais || [])
    .map(n => allRituais().find(r => r.n === n))
    .filter(r => r && (r.tipo === "dano" || r.tipo === "cura") && alcanceRitual(r));
  const alc = w => (alcanceArma(w) === 1 ? "do lado" : `até ${alcanceArma(w) * 1.5} m`);
  return `<div class="box stack sozvez"><div class="row between"><b>Sua vez, ${esc(f.nome)}</b><span class="muted small">PV ${cur(f, "pv")}/${D.pvMax} · PE ${cur(f, "pe")}/${D.peMax}</span></div>
   <div class="field"><label class="label" for="szAlvo">Alvo</label><select id="szAlvo">${inim.map(c => `<option value="${esc(c.id)}">${esc(c.f.nome)} · a ${dist(c) * 1.5} m · PV ${cur(c.f, "pv")}</option>`).join("")}</select></div>
   <div class="row">${(f.armas || []).map((w, i) => `<button class="btn sm primary" data-szatk="${i}">${esc(w.nome)} <small>${alc(w)}</small></button>`).join("")}</div>
   ${rits.length ? `<div class="row">${rits.map(r => `<button class="btn sm" data-szrit="${esc(r.n)}">${esc(r.n)} <small>${r.formas[0].custo} PE · ${r.tipo === "cura" ? "cura" : "dano"}</small></button>`).join("")}</div>` : ""}
   ${rits.some(r => r.tipo === "cura") ? `<div class="field"><label class="label" for="szCura">Curar quem</label><select id="szCura">${amigos.map(c => `<option value="${esc(c.id)}">${esc(c.f.nome)} · PV ${cur(c.f, "pv")}/${derivados(c.f).pvMax}</option>`).join("")}</select></div>` : ""}
   <div class="row between"><span class="muted small">Arraste o seu token para andar (até ${passosDe(f)} quadrados) e depois ataque.</span><button class="btn sm ghost" id="szPassa">Passar a vez</button></div></div>`;
}
function bindSozinhoVez() {
  $$("[data-szatk]").forEach(b => (b.onclick = () => sozinhoAgir({ arma: +b.dataset.szatk })));
  $$("[data-szrit]").forEach(b => (b.onclick = () => sozinhoAgir({ ritual: b.dataset.szrit })));
  const ps = $("#szPassa");
  if (ps)
    ps.onclick = () => {
      const f = S.fichas[vezAtual().fichaId];
      botDiz(`${f.nome} passa a vez.`);
      sozinhoFimDaVez();
    };
}
/* O ataque (arma ou ritual) de quem joga, com o alcance conferido no mapa */
function sozinhoAgir({ arma, ritual }) {
  const x = vezAtual();
  const todos = emCombate();
  const eu = todos.find(c => c.id === (x && x.fichaId));
  if (!eu || S.sozAgiu === sozChave()) return;
  const f = eu.f;
  const tam = (curScene() || {}).tam || tokenBase();
  const longe = (c, alc) => {
    const d = eu.t && c.t ? chebyshev(celulaDe(eu, tam), celulaDe(c, tam)) : 99;
    if (d <= alc) return false;
    toast(
      alc === 1
        ? `Chegue do lado de ${c.f.nome} primeiro (arraste o seu token).`
        : `${c.f.nome} está longe demais (${d * 1.5} m).`
    );
    return true;
  };
  const r = ritual && allRituais().find(k => k.n === ritual);
  if (r && r.tipo === "cura") {
    const alvo = todos.find(c => c.id === ($("#szCura") || {}).value);
    if (!alvo || (alvo !== eu && longe(alvo, alcanceRitual(r)))) return;
    if (!rolarRitual(f, r.n, 0, { alvo: alvo.f })) return;
    saveFicha(eu.id, true);
    saveFicha(alvo.id, true);
    return sozinhoFimDaVez();
  }
  const alvo = todos.find(c => c.id === ($("#szAlvo") || {}).value);
  if (!alvo) {
    toast("Nenhum inimigo de pé.");
    return;
  }
  if (r) {
    if (longe(alvo, alcanceRitual(r))) return;
    const res = rolarRitual(f, r.n, 0, { alvoNome: alvo.f.nome });
    if (!res) return;
    saveFicha(eu.id, true);
    if (res.total) {
      const passou = resistiu(alvo, r, res.dt);
      const v = passou ? (/reduz|parcial|metade/i.test(r.res) ? Math.floor(res.total / 2) : 0) : res.total;
      botDiz(
        `${alvo.f.nome} ${passou ? "resistiu em parte" : "não resistiu"} a ${r.n}: ${botFerir(alvo, danoContra(alvo.f, [{ v, t: r.el }]))}`
      );
    }
    return sozinhoFimDaVez();
  }
  const w = (f.armas || [])[arma];
  if (!w || longe(alvo, alcanceArma(w))) return;
  const a = rolarAtaque(f, w, { alvo: alvo.f.nome });
  if (!a) return;
  const def = derivados(alvo.f).def;
  botDiz(
    a.r.total >= def
      ? `${f.nome} acertou: ${botFerir(alvo, danoContra(alvo.f, a.partes))}`
      : `${f.nome} errou ${alvo.f.nome} (${a.r.total} contra Defesa ${def}).`
  );
  sozinhoFimDaVez();
}
function sozinhoFimDaVez() {
  const chave = sozChave();
  S.sozAgiu = chave;
  renderPanel();
  renderBoard();
  setTimeout(() => {
    if (sozChave() === chave && !sozinhoFim()) proximoTurno();
  }, 900);
}

/* ---------- fim do combate ---------- */
/* Todos os inimigos caíram (vitória) ou todo o grupo caiu (derrota)? Avisa uma vez só. */
function sozinhoFim() {
  const c = S.combate;
  if (!c || !c.inicio) return false;
  const todos = emCombate();
  const ag = todos.filter(x => !x.f.npc),
    ini = todos.filter(x => x.f.npc);
  const venceu = ini.length > 0 && ini.every(x => !x.vivo);
  const perdeu = ag.length > 0 && ag.every(x => !x.vivo);
  if (!venceu && !perdeu) return false;
  if (S.sozFim !== c.inicio) {
    S.sozFim = c.inicio;
    clearTimeout(S.botT);
    if (S.mesa.sozPlano && S.mesa.sozPlano.modo === "missao") {
      missaoFim(venceu).catch(fail); // a missão termina com o mestre fechando a história
      return true;
    }
    botDiz(venceu ? "Vitória! Todos os inimigos caíram." : "Derrota. Todo o grupo caiu.");
    const h = $("#modalHost");
    h.innerHTML = `<div class="modal-back"><div class="modal" role="dialog" aria-label="Fim do combate"><h3>${venceu ? "Vitória!" : "Derrota"}</h3><p class="muted" style="margin:0">${venceu ? "Todos os inimigos caíram." : "Todo o grupo caiu."} Quer jogar outro combate? O grupo volta com a vida e o PE cheios.</p><div class="row" style="justify-content:flex-end"><button class="btn" id="szSair">Voltar ao início</button><button class="btn primary" id="szDeNovo">Outro combate</button></div></div></div>`;
    $("#szSair").onclick = () => {
      h.innerHTML = "";
      location.hash = "";
    };
    $("#szDeNovo").onclick = () => {
      h.innerHTML = "";
      sozinhoDeNovo().catch(fail);
    };
  }
  return true;
}
/* Outro combate na mesma cena: os inimigos saem, o grupo volta inteiro e entram inimigos novos */
async function sozinhoDeNovo() {
  for (const [id, f] of Object.entries(S.fichas)) {
    if (f.npc) {
      for (const t of S.tokens.filter(k => k.fichaId === id)) {
        if (S.pos[t.id]) await tirarDeCena(t.id);
        await S.db.del(P() + "/tokens/" + t.id);
      }
      S.tokens = S.tokens.filter(k => k.fichaId !== id);
      await S.db.del(fichaPath(id));
      delete S.fichas[id];
    } else {
      Object.assign(f, { pv: null, pe: null, cond: [] });
      saveFicha(id, true);
    }
  }
  await sozinhoMontar({ ...S.mesa.sozPlano });
}
