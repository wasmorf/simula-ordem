"use strict";
/* Jogar sozinho — Missão: o site faz o papel do mestre. Sorteia um caso (cidade, elemento, pessoa que
   pediu ajuda, lugar da investigação e lugar do confronto), conta a história num cartão em cima do mapa,
   pede os testes de perícia, entrega as pistas como documentos e termina num combate com os bots
   (sozinho/bots). Cada pista achada deixa o confronto mais fácil; cada falha, mais difícil.
   O texto do mestre sai de modelos escritos aqui; com a IA ligada (sozinho/ia), sai dela. */

const MIS_CIDADES = [
  "Vila Aurora",
  "São Brás do Ribeirão",
  "Pedra Funda",
  "Santa Luzia do Vale",
  "Porto Cinzento",
  "Lagoa Rasa",
  "Carvalhal",
  "Serra do Breu"
];
const MIS_PESSOAS = [
  "Dona Cida, dona da padaria",
  "Seu Ademar, o vigia noturno",
  "Marta Quintela, professora",
  "o padre Osvaldo",
  "Joana, dona do bar da esquina",
  "Lia, enfermeira do posto",
  "o delegado Bastos",
  "Caio, um entregador"
];
/* Cada elemento: o que está acontecendo, os sinais, a causa e onde termina */
const MIS_TEMAS = {
  Sangue: {
    titulo: "Noites de Caça",
    fato: "três pessoas apareceram mortas, sem uma gota de sangue no corpo",
    sinais: [
      "marcas fundas de garras na madeira",
      "um cheiro de ferro que não sai do ar",
      "sangue seco desenhando um símbolo torto"
    ],
    causa: "alguém está alimentando uma criatura com sangue, de propósito",
    final: ["Clareira do ritual", "Galpão", "Floresta"]
  },
  Morte: {
    titulo: "A Hora Parada",
    fato: "os relógios pararam todos na mesma hora e quem dorme depois das três não acorda mais",
    sinais: [
      "um lodo preto escorrendo do ralo",
      "flores murchas em vasos trocados ontem",
      "um relógio de bolso parado às 3h03"
    ],
    causa: "alguém está roubando o tempo dos outros para não morrer",
    final: ["Cemitério à noite", "Paróquia", "Hospital"]
  },
  Conhecimento: {
    titulo: "Nomes Esquecidos",
    fato: "os moradores estão esquecendo o próprio nome, um por um",
    sinais: [
      "letras douradas riscadas na parede",
      "livros com todas as páginas em branco",
      "a mesma frase escrita centenas de vezes num caderno"
    ],
    causa: "alguém está tentando aprender o que ninguém deveria saber",
    final: ["Escola", "Mansão antiga", "Prédio de apartamentos"]
  },
  Energia: {
    titulo: "Curto-Circuito",
    fato: "as luzes piscam sozinhas à noite e duas casas pegaram fogo sem explicação",
    sinais: [
      "aparelhos ligando sozinhos",
      "um zumbido que só alguns ouvem",
      "marcas de queimado em espiral no chão"
    ],
    causa: "alguém abriu uma passagem para algo que não segue regra nenhuma",
    final: ["Galpão", "Estação de metrô", "Rua à noite"]
  }
};
const MIS_LOCAL1 = [
  "Casa abandonada",
  "Mercado",
  "Rua à noite",
  "Motel de estrada",
  "Prédio de apartamentos",
  "Fazenda"
];
/* O que dá para investigar. A pista que cada um dá depende da ordem (causa, onde, quem). */
const MIS_PONTOS = [
  { id: "lugar", nome: "Revistar o lugar onde tudo começou", per: "Investigação", doc: "diario" },
  { id: "pessoa", nome: "Conversar com {pessoa}", per: "Diplomacia", doc: "carta" },
  { id: "sinais", nome: "Estudar os sinais estranhos", per: "Ocultismo", doc: "amaldicoado" },
  { id: "rastros", nome: "Procurar rastros por perto", per: "Percepção", doc: "bilhete" },
  { id: "jornal", nome: "Ler as notícias da cidade", per: "Atualidades", doc: "jornal" },
  { id: "corpo", nome: "Examinar o laudo da última vítima", per: "Medicina", doc: "laudo" }
];
const MIS_PISTAS = ["causa", "onde", "quem"];
const pickR = (l, R) => l[Math.floor(R() * l.length)];
const comArtigo = lugar =>
  (/^(Casa|Rua|Floresta|Clareira|Paróquia|Escola|Mansão|Estação|Fazenda)/.test(lugar) ? "a " : "o ") +
  lugar.toLowerCase();

/* ---------- sortear o caso ---------- */
function missaoGerar(nex, tamGrupo, nivel, R = Math.random) {
  const el = pickR(Object.keys(MIS_TEMAS), R);
  const T = MIS_TEMAS[el];
  const pontos = MIS_PONTOS.slice()
    .sort(() => R() - 0.5)
    .slice(0, 4)
    .map(p => p.id);
  // a criatura por trás de tudo já fica escolhida (a pista "quem" fala dela)
  const chefe = inimigosPara(nex, tamGrupo, nivel, R, { el })[0];
  return {
    el,
    titulo: T.titulo,
    cidade: pickR(MIS_CIDADES, R),
    pessoa: pickR(MIS_PESSOAS, R),
    sinal: pickR(T.sinais, R),
    local1: pickR(MIS_LOCAL1, R),
    local2: pickR(T.final, R),
    pontos,
    chefe: chefe ? chefe.n : ""
  };
}
/* DT dos testes da investigação pelo NEX */
const missaoDT = nex => (nex >= 75 ? 25 : nex >= 40 ? 20 : 15);

/* ---------- o texto do mestre (modelos; a IA troca quando está ligada) ---------- */
function missaoTextoPadrao(tipo, c) {
  const m = c.m,
    T = MIS_TEMAS[m.el];
  if (tipo === "briefing")
    return `${c.eu}, a Ordem precisa de você em ${m.cidade}. Na última semana, ${T.fato}. Quem chamou foi ${m.pessoa}, que jura ter visto ${m.sinal}. Vá até ${comArtigo(m.local1)} com ${c.aliados || "a sua coragem"} e descubra o que está por trás disso antes que piore.`;
  if (tipo === "pista") {
    if (c.pista === "causa")
      return `Você junta as peças: ${m.sinal} não é coincidência. ${T.causa[0].toUpperCase() + T.causa.slice(1)}.`;
    if (c.pista === "onde")
      return `Tudo aponta para o mesmo lugar: ${comArtigo(m.local2)}. É lá que vai acontecer de novo.`;
    if (c.pista === "quem") {
      const b = allBest().find(x => x.n === m.chefe);
      return `Os registros da Ordem descrevem algo parecido: ${m.chefe || "uma criatura de " + m.el}.${b && b.vul ? ` É vulnerável a ${b.vul}.` : ""}`;
    }
    return `Mais um detalhe confirma o que vocês já sabiam: o elemento por trás de tudo é ${m.el}.`;
  }
  if (tipo === "falha") return c.consequencia;
  if (tipo === "chegada")
    return `Vocês chegam ${comArtigo(m.local2)}. O ar pesa, e ${m.sinal} está por toda parte. ${c.pistas >= 3 ? "Graças à investigação, vocês chegam antes de tudo começar." : c.semOnde ? "Sem saber direito para onde ir, vocês demoram, e chegam tarde." : "Não dá para voltar atrás."} Preparem-se!`;
  if (tipo === "vitoria")
    return `Acabou. ${m.cidade} amanhece em silêncio, e ninguém mais vai sofrer com ${m.sinal}. A Ordem registra a missão "${m.titulo}" como cumprida.`;
  if (tipo === "derrota")
    return `O grupo caiu ${comArtigo(m.local2)}. A Ordem vai mandar outra equipe para ${m.cidade}… e o que aconteceu com vocês vira mais um arquivo confidencial.`;
  return "";
}
/* O mestre fala: com a IA ligada pergunta a ela; sem IA (ou se ela falhar), usa o modelo */
async function missaoTexto(tipo, c) {
  const padrao = missaoTextoPadrao(tipo, c);
  if (iaLigada()) {
    try {
      const t = await iaNarrar(tipo, c, padrao);
      if (t) return t;
    } catch (e) {
      iaFalhou(e);
    }
  }
  return padrao;
}

/* ---------- estado da missão ---------- */
function missaoSalvar() {
  S.db.set(P() + "/estado/missao", JSON.parse(JSON.stringify(S.missao))).catch(fail);
}
const nomeGrupo = () => {
  const n = Object.values(S.fichas)
    .filter(f => f.bot)
    .map(f => f.nome);
  return n.length > 1 ? n.slice(0, -1).join(", ") + " e " + n[n.length - 1] : n[0] || "";
};

/* Começo: o lugar da investigação, o grupo no mapa, o dossiê e o primeiro texto do mestre */
async function missaoMontar(plano) {
  toast("Preparando a missão…");
  plano = { ...plano };
  const R = Math.random;
  for (let i = 0; i < 50 && !S.fichas[plano.fid]; i++) await espera(100);
  const eu = S.fichas[plano.fid];
  if (!eu) throw new Error("Não achei a ficha do seu agente.");
  const nex = +eu.nex || 5;
  const m = missaoGerar(nex, 1 + (plano.aliados || 0), plano.nivel, R);
  const c = await sozinhoCena(m.local1);
  Object.assign(plano, { sid: c.sid, mapaId: c.mapaId });
  const grupo = await sozinhoGrupo(plano);
  await sozinhoPosicionar(c.M, grupo);
  S.missao = {
    m,
    etapa: "briefing",
    feitos: {},
    pistas: [],
    fator: 1,
    textos: [],
    nivel: plano.nivel,
    fid: plano.fid
  };
  const texto = await missaoTexto("briefing", { m, eu: eu.nome, aliados: nomeGrupo() });
  S.missao.textos.push({ t: texto, quem: "Mestre" });
  await S.db.merge(P(), { sozPlano: { ...plano, montado: true } });
  missaoSalvar();
  await missaoDoc(
    "relatorio",
    `Dossiê: ${m.titulo}`,
    {
      org: "Ordem · Divisão de Campo",
      numero: "Nº " + (100 + Math.floor(R() * 899)) + "/26",
      agente: eu.nome,
      local: m.cidade
    },
    texto
  );
  missaoMostrar();
}
/* Ao voltar para a mesa no meio da missão */
async function missaoRetomar() {
  if (S.missao && S.missao.m) return missaoMostrar();
  S.missao = await S.db.get(P() + "/estado/missao");
  if (S.missao) missaoMostrar();
}
/* Um documento da missão: vai para a pasta Documentos e abre na tela */
async function missaoDoc(modelo, titulo, campos, texto) {
  const d = { modelo, titulo, nome: titulo, campos, texto, criado: Date.now() };
  try {
    const id = await S.db.add(P() + "/docs", d);
    abrirDoc({ titulo, quem: "Mestre", para: "todos", doc: docSnapshot({ ...d, id }) });
  } catch (e) {
    fail(e);
  }
}

/* ---------- o cartão do mestre (em cima do mapa) ---------- */
function missaoMostrar() {
  const M = S.missao;
  let el = $("#narrador");
  if (!M || !sozinho()) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("div");
    el.id = "narrador";
    el.className = "narrador";
    $("#board").appendChild(el);
  }
  const m = M.m;
  const eu = S.fichas[M.fid];
  const ult = M.textos.slice(-2);
  const dt = missaoDT(+((eu && eu.nex) || 5));
  let acoes = "";
  if (M.etapa === "briefing")
    acoes = `<button class="btn primary" data-nar="investigar">Começar a investigação</button>`;
  else if (M.etapa === "investigar") {
    const falta = m.pontos.filter(id => !M.feitos[id]);
    acoes = `<div class="nar-ops">${falta
      .map(id => {
        const p = MIS_PONTOS.find(x => x.id === id);
        return `<button class="btn sm" data-narp="${id}">${esc(p.nome.replace("{pessoa}", m.pessoa.split(",")[0]))} <small>${esc(p.per)} · DT ${dt}</small></button>`;
      })
      .join("")}</div>
     ${iaLigada() ? `<form class="row nar-livre" id="narLivre" style="flex-wrap:nowrap"><input type="text" id="narTxt" maxlength="200" placeholder="Ou escreva o que você faz…" style="flex:1"><button class="btn sm">Fazer</button></form>` : ""}
     <div class="row between"><span class="muted small">Pistas: ${M.pistas.length}/3</span><button class="btn sm primary" data-nar="seguir" ${M.pistas.length || !falta.length ? "" : "disabled"}>Seguir para ${esc(m.local2.toLowerCase())}</button></div>`;
  } else if (M.etapa === "fim")
    acoes = `<div class="row" style="justify-content:flex-end"><button class="btn" data-nar="sair">Voltar ao início</button><button class="btn primary" data-nar="nova">Nova missão</button></div>`;
  el.innerHTML = `<div class="row between nar-topo"><span class="label">${esc(m.titulo)} · ${esc(m.cidade)} · ${iaLigada() ? "mestre com IA" : "mestre sem IA"}</span><button class="btn sm ghost" id="narMin" aria-label="${M.min ? "Abrir" : "Esconder"} o cartão do mestre">${M.min ? "▴" : "▾"}</button></div>
   ${M.min ? "" : `<div class="nar-txt">${ult.map(x => `<p${x.quem !== "Mestre" ? ' class="nar-eu"' : ""}>${esc(x.t)}</p>`).join("")}</div>${M.etapa === "combate" ? "" : acoes}`}`;
  $("#narMin").onclick = () => {
    M.min = !M.min;
    missaoMostrar();
  };
  $$("[data-narp]", el).forEach(b => (b.onclick = () => missaoInvestigar(b.dataset.narp)));
  $$("[data-nar]", el).forEach(
    b =>
      (b.onclick = () => {
        const k = b.dataset.nar;
        if (k === "investigar") {
          M.etapa = "investigar";
          missaoSalvar();
          missaoMostrar();
        } else if (k === "seguir") missaoConfronto().catch(fail);
        else if (k === "sair") location.hash = "";
        else if (k === "nova") missaoNova().catch(fail);
      })
  );
  const fl = $("#narLivre");
  if (fl)
    fl.onsubmit = ev => {
      ev.preventDefault();
      const t = $("#narTxt").value.trim();
      if (t) missaoLivre(t).catch(fail);
    };
}

/* ---------- investigar ---------- */
/* Quem do grupo é melhor na perícia (os aliados investigam junto: vale o melhor resultado) */
function melhorAjudante(per) {
  return Object.entries(S.fichas)
    .filter(([, f]) => f.bot && cur(f, "pv") > 0)
    .sort((a, b) => modPericia(b[1], per) - modPericia(a[1], per))[0];
}
/* Um teste de perícia de quem joga (e do melhor aliado), contra a DT. Devolve se passou. */
function missaoTeste(per, titulo) {
  const M = S.missao;
  const eu = S.fichas[M.fid];
  const dt = missaoDT(+eu.nex || 5);
  const r1 = rolarPericia(eu, per, { titulo: `${titulo} · ${per} DT ${dt}` });
  const aj = melhorAjudante(per);
  const r2 = aj && rolarPericia(aj[1], per, { titulo: `Ajuda: ${per} DT ${dt}` });
  return Math.max(r1 ? r1.total : 0, r2 ? r2.total : 0) >= dt;
}
async function missaoInvestigar(id) {
  const M = S.missao;
  if (!M || M.feitos[id] || S.narOcupado) return;
  S.narOcupado = true;
  try {
    const p = MIS_PONTOS.find(x => x.id === id);
    const m = M.m;
    const nome = p.nome.replace("{pessoa}", m.pessoa.split(",")[0]);
    const passou = missaoTeste(p.per, nome);
    M.feitos[id] = passou ? "ok" : "falha";
    await missaoResultado(passou, p.per, nome, p.doc);
  } finally {
    S.narOcupado = false;
  }
}
/* O que acontece depois do teste: pista (com documento) ou consequência */
async function missaoResultado(passou, per, nome, modeloDoc, extra = "") {
  const M = S.missao;
  const m = M.m;
  const eu = S.fichas[M.fid];
  let texto;
  if (passou) {
    const pista = MIS_PISTAS.find(k => !M.pistas.includes(k)) || "extra";
    if (pista !== "extra") M.pistas.push(pista);
    M.fator = Math.max(0.6, M.fator - 0.1);
    texto = await missaoTexto("pista", { m, pista, eu: eu.nome, acao: nome, extra });
    if (modeloDoc)
      await missaoDoc(
        modeloDoc,
        modeloDoc === "jornal" ? `Coisas estranhas em ${m.cidade}` : `Pista: ${nome}`,
        modeloDoc === "jornal"
          ? { jornal: `Gazeta de ${m.cidade}`, sub: "Moradores pedem explicações" }
          : modeloDoc === "amaldicoado"
            ? { elemento: m.el }
            : {},
        texto
      );
  } else {
    // a falha custa: tempo (o confronto fica mais difícil), sanidade ou vida
    M.fator += 0.15;
    let consequencia = `${nome}: nada de útil, e o tempo passa. O que está por trás disso fica mais forte.`;
    if (per === "Ocultismo") {
      const r = rollExpr("1d4");
      eu.san = Math.max(0, cur(eu, "san") - r.total);
      saveFicha(M.fid, true);
      consequencia = `Os sinais parecem se mexer quando você olha. Você perde ${r.total} de Sanidade.`;
    } else if (per === "Medicina" || per === "Percepção") {
      const r = rollExpr("1d4");
      eu.pv = Math.max(1, cur(eu, "pv") - r.total);
      saveFicha(M.fid, true);
      consequencia = `Você se machuca no meio da busca: ${r.total} de dano.`;
    } else if (per === "Diplomacia")
      consequencia = `${m.pessoa.split(",")[0]} se fecha e não quer mais conversar. O tempo passa.`;
    texto = await missaoTexto("falha", { m, eu: eu.nome, acao: nome, consequencia, extra });
  }
  M.textos.push({ t: texto, quem: "Mestre" });
  missaoSalvar();
  missaoMostrar();
}

/* Com a IA: o jogador escreve o que faz; a IA escolhe a perícia e o site rola o teste */
async function missaoLivre(t) {
  const M = S.missao;
  if (!M || S.narOcupado || M.etapa !== "investigar") return;
  S.narOcupado = true;
  try {
    M.textos.push({ t, quem: "eu" });
    missaoMostrar();
    let j = { pericia: "Investigação", ok: true, motivo: "" };
    try {
      j = await iaInterpretar(t, M);
    } catch (e) {
      iaFalhou(e);
    }
    if (!j.ok) {
      M.textos.push({ t: j.motivo || "Isso não ajuda na investigação agora.", quem: "Mestre" });
      missaoSalvar();
      missaoMostrar();
      return;
    }
    const nome = t.length > 60 ? t.slice(0, 57) + "…" : t;
    await missaoResultado(missaoTeste(j.pericia, nome), j.pericia, nome, null, t);
  } finally {
    S.narOcupado = false;
  }
}

/* ---------- o confronto ---------- */
async function missaoConfronto() {
  const M = S.missao;
  if (!M || S.narOcupado) return;
  S.narOcupado = true;
  try {
    const plano = { ...S.mesa.sozPlano };
    const eu = S.fichas[M.fid];
    const semOnde = !M.pistas.includes("onde");
    if (semOnde) M.fator += 0.2;
    M.etapa = "combate";
    const texto = await missaoTexto("chegada", { m: M.m, eu: eu.nome, pistas: M.pistas.length, semOnde });
    M.textos.push({ t: texto, quem: "Mestre" });
    missaoSalvar();
    missaoMostrar();
    const c = await sozinhoCena(M.m.local2);
    await S.db.merge(P(), { sozPlano: { ...plano, sid: c.sid, mapaId: c.mapaId } });
    const grupo = await sozinhoGrupo(plano);
    // o chefe da pista "quem" vem primeiro; o resto completa o desafio
    const inim = [];
    const chefe = allBest().find(b => b.n === M.m.chefe);
    if (chefe) {
      const f = criaturaDe(chefe);
      const id = "n" + rid(8);
      S.fichas[id] = f;
      saveFicha(id, true);
      inim.push(id);
    }
    const resto = sozinhoInimigos(+eu.nex || 5, grupo.length, M.nivel, {
      el: M.m.el,
      fator: Math.max(0, M.fator - (chefe ? 0.6 : 0))
    });
    inim.push(...resto.slice(0, chefe ? 2 : 4));
    await sozinhoPosicionar(c.M, grupo, inim);
    sozinhoCombate([...grupo, ...inim], M.m.local2);
  } finally {
    S.narOcupado = false;
  }
}
/* Fim do combate da missão: o mestre fecha a história */
async function missaoFim(venceu) {
  const M = S.missao;
  if (!M || M.etapa === "fim") return;
  M.etapa = "fim";
  M.min = false;
  const eu = S.fichas[M.fid];
  M.textos.push({
    t: await missaoTexto(venceu ? "vitoria" : "derrota", { m: M.m, eu: eu.nome, pistas: M.pistas.length }),
    quem: "Mestre"
  });
  missaoSalvar();
  missaoMostrar();
}
/* Nova missão na mesma mesa: limpa criaturas e documentos, cura o grupo e sorteia outro caso */
async function missaoNova() {
  for (const [id, f] of Object.entries(S.fichas)) {
    if (f.npc) {
      for (const t of S.tokens.filter(k => k.fichaId === id)) await S.db.del(P() + "/tokens/" + t.id);
      S.tokens = S.tokens.filter(k => k.fichaId !== id);
      await S.db.del(fichaPath(id));
      delete S.fichas[id];
    } else {
      Object.assign(f, { pv: null, pe: null, san: null, cond: [] });
      saveFicha(id, true);
    }
  }
  saveCombate({ lista: [], turno: 0, rodada: 1 });
  S.missao = null;
  const nar = $("#narrador");
  if (nar) nar.remove();
  await missaoMontar({ ...S.mesa.sozPlano, sid: null, mapaId: null });
}
