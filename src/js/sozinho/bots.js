"use strict";
/* Jogar sozinho: no combate, os aliados feitos pelo bot e os inimigos agem sozinhos na vez deles —
   andam pelo mapa (sem atravessar paredes), escolhem o alvo, atacam ou conjuram, curam quem está mal
   e aplicam o dano com as resistências da criatura. Tudo no navegador de quem joga, sem custo. */

/* a mesa é de Jogar sozinho e quem está aqui é quem joga (o dono da mesa) */
function sozinho() {
  return !!(S.mesa && S.mesa.sozinho && S.isM);
}
const ladoDe = f => (f.npc ? "inimigo" : "agente");
// o que aconteceu, no registro (um instante depois, para ficar abaixo da rolagem que veio antes)
const botDiz = titulo => setTimeout(() => logEntry({ quem: "Mestre", titulo, tipo: "chat" }), 40);

/* O mapa da cena do combate como grade (sozinho/gerar), guardado enquanto a cena não muda */
async function botMapa() {
  const sc = curScene();
  if (!sc || !sc.mapaId) return null;
  if (S.botMapa && S.botMapa.sid === sc.id) return S.botMapa;
  const M = await S.db.get(P() + "/mapas/" + sc.mapaId);
  if (!M) return null;
  S.botMapa = { sid: sc.id, M, G: gradeDoMapa(M), tam: sc.tam || tokenBase() };
  return S.botMapa;
}
/* Quem está no combate, com a ficha, o token na cena e se ainda está de pé */
function emCombate() {
  return ((S.combate && S.combate.lista) || [])
    .map(x => {
      const f = x.fichaId && S.fichas[x.fichaId];
      if (!f) return null;
      const t = S.tokens.find(k => k.fichaId === x.fichaId && S.pos[k.id]);
      return { x, f, id: x.fichaId, t, vivo: cur(f, "pv") > 0 };
    })
    .filter(Boolean);
}
const celulaDe = (c, tam) => [Math.floor(S.pos[c.t.id].x / tam), Math.floor(S.pos[c.t.id].y / tam)];
const chebyshev = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
/* deslocamento em quadrados (1,5 m cada) */
function passosDe(f) {
  const m = f.rapido ? +f.rdesl || 9 : parseFloat(String(f.desl || "9").replace(",", ".")) || 9;
  return Math.max(1, Math.floor(m / 1.5));
}
/* alcance em quadrados: corpo a corpo é do lado; curto 9 m, médio 18 m, longo 36 m */
const BOT_ALC = { toque: 1, curto: 6, médio: 12, medio: 12, longo: 24, extremo: 48 };
function alcanceArma(w) {
  if (w.pericia === "Luta") return 1;
  return BOT_ALC[String(w.alc || "").toLowerCase()] || 6;
}
const alcanceRitual = r => BOT_ALC[String(r.al || "").toLowerCase()] || 0;

/* A forma mais forte do ritual que a ficha conjura e paga agora (Normal, Discente, Verdadeiro) */
function formaQuePaga(f, r, reserva = 0) {
  const D = derivados(f);
  const pe = cur(f, "pe") - reserva;
  let k = -1;
  r.formas.forEach((fm, i) => {
    const circ = +((fm.req || "").match(/(\d)º círculo/) || [0, 0])[1];
    const extra = /afinidade/i.test(fm.req || "") && i > 0;
    if (fm.custo <= pe && circ <= D.circ && !extra) k = i;
  });
  return k;
}
/* Os rituais que o bot sabe usar: de dano em alguém e de cura */
function ritualDo(f, tipo, reserva = 0) {
  for (const n of f.rituais || []) {
    const r = allRituais().find(x => x.n === n);
    if (!r || r.tipo !== tipo || !alcanceRitual(r)) continue;
    const k = formaQuePaga(f, r, reserva);
    if (k >= 0) return { r, k };
  }
  return null;
}
/* O jeito de atacar, na ordem que o bot prefere: criatura usa o ataque dela; ocultista conjura;
   especialista atira de longe; combatente vai para o corpo a corpo. */
function ataquesDe(f) {
  if (f.rapido)
    return (f.ratq || [])
      .filter(w => w.d)
      .map(w => ({ tipo: "rapido", w, alc: 1, vezes: +((w.n || "").match(/\((\d)\s*[×x]\)/) || [0, 1])[1] }));
  const armas = (f.armas || []).map(w => ({ tipo: "arma", w, alc: alcanceArma(w) }));
  const longe = armas.filter(a => a.alc > 1),
    perto = armas.filter(a => a.alc === 1 && a.w.nome !== "Ataque desarmado"),
    soco = armas.filter(a => a.w.nome === "Ataque desarmado");
  const rit = ritualDo(f, "dano", 2);
  const rits = rit ? [{ tipo: "ritual", ...rit, alc: alcanceRitual(rit.r) }] : [];
  if (f.classe === "Ocultista") return [...rits, ...perto, ...longe, ...soco];
  if (f.classe === "Especialista") return [...longe, ...perto, ...soco];
  return [...perto, ...longe, ...soco];
}
/* Para onde andar (até o deslocamento) para ter um alvo ao alcance: o menor caminho; empate, o
   alvo com menos PV. Sem ninguém ao alcance, chega o mais perto que der do inimigo mais próximo. */
function planoDeMovimento(B, eu, alvos, alc, outros) {
  const de = celulaDe(eu, B.tam);
  const bloq = new Set(outros.filter(c => c.t && c.id !== eu.id).map(c => celulaDe(c, B.tam).join(",")));
  const dist = caminhos(B.G, de[0], de[1], bloq, passosDe(eu.f));
  let melhor = null;
  for (const [k, d] of dist) {
    const cel = k.split(",").map(Number);
    for (const a of alvos) {
      if (chebyshev(cel, celulaDe(a, B.tam)) > alc) continue;
      const pv = cur(a.f, "pv");
      if (!melhor || d < melhor.d || (d === melhor.d && pv < melhor.pv)) melhor = { cel, d, alvo: a, pv };
    }
  }
  if (melhor) return melhor;
  // ninguém ao alcance: aproxima do mais perto
  let perto = null;
  for (const [k, d] of dist) {
    const cel = k.split(",").map(Number);
    for (const a of alvos) {
      const dd = chebyshev(cel, celulaDe(a, B.tam));
      if (!perto || dd < perto.dd || (dd === perto.dd && d < perto.d))
        perto = { cel, d, dd, alvo: a, longe: true };
    }
  }
  return perto;
}
function botAndar(B, eu, cel) {
  const de = celulaDe(eu, B.tam);
  if (de[0] === cel[0] && de[1] === cel[1]) return;
  porEmCena(eu.t.id, { x: Math.round((cel[0] + 0.5) * B.tam), y: Math.round((cel[1] + 0.5) * B.tam) });
}

/* ---------- dano ---------- */
/* Quanto do dano entra, com imunidade, resistência e vulnerabilidade da criatura (rimu, rres, rvul).
   "dano 20" vale para tudo; "Corte 5" só para aquele tipo; vulnerável sofre o dobro. */
function danoContra(f, partes) {
  const low = s => String(s || "").toLowerCase();
  const imu = low(f.rimu),
    vul = low(f.rvul),
    res = low(f.rres);
  let geral = 0;
  const porTipo = {};
  res.split(/[;,\n]/).forEach(p => {
    const m = p.match(/([a-zà-ú][a-zà-ú ]*?)\s*(\d+)/i);
    if (!m) return;
    const t = m[1].trim();
    if (t === "dano") geral = Math.max(geral, +m[2]);
    else porTipo[t] = +m[2];
  });
  let tot = 0;
  partes.forEach(({ v, t }) => {
    const k = low(t);
    if (!v) return;
    if (k && imu.includes(k)) return;
    let d = v;
    if (k && porTipo[k]) d = Math.max(0, d - porTipo[k]);
    if (k && vul.includes(k)) d *= 2;
    tot += d;
  });
  return Math.max(0, tot - geral);
}
/* Tira PV da ficha, grava e conta no registro como ficou */
function botFerir(alvo, n) {
  const f = alvo.f;
  const max = derivados(f).pvMax;
  f.pv = Math.max(0, cur(f, "pv") - n);
  saveFicha(alvo.id, true);
  if (f.pv <= 0) alvo.vivo = false;
  return `${n} de dano em ${f.nome} (PV ${f.pv}/${max})${f.pv <= 0 ? (f.npc ? " — caiu!" : " — caiu, morrendo!") : ""}`;
}
/* O teste de resistência do alvo contra um ritual (Fortitude, Reflexos ou Vontade) */
function resistiu(alvo, r, dt) {
  const m = String(r.res || "").match(/Fortitude|Reflexos|Vontade/);
  if (!m) return false;
  const f = alvo.f;
  let t;
  if (f.rapido) {
    const p = (f.rper || []).find(x => x.n === m[0]) || { a: "VIG", b: 0 };
    t = rollTest(f.attr[p.a] || 1, +p.b || 0);
  } else {
    const a = (PERICIAS.find(x => x[0] === m[0]) || [])[1] || "VIG";
    t = rollTest(f.attr[a], modPericia(f, m[0]));
  }
  return t.total >= dt;
}

/* ---------- a vez do bot ---------- */
/* Faz o bot agir. Devolve quando terminou (o turno passa depois). */
async function botAgir(id) {
  const B = await botMapa();
  const todos = emCombate();
  const eu = todos.find(c => c.id === id);
  if (!B || !eu || !eu.t) return;
  const f = eu.f;
  const meus = todos.filter(c => c.vivo && c.t && ladoDe(c.f) === ladoDe(f));
  const deles = todos.filter(c => c.vivo && c.t && ladoDe(c.f) !== ladoDe(f));
  if (!deles.length) return;
  // quem cura: socorre o aliado com menos de 40% da vida
  const cura = !f.npc && ritualDo(f, "cura");
  if (cura) {
    const fr = c => cur(c.f, "pv") / derivados(c.f).pvMax;
    const mal = meus.filter(c => fr(c) <= 0.4).sort((a, b) => fr(a) - fr(b));
    for (const ferido of mal) {
      const p = planoDeMovimento(B, eu, [ferido], alcanceRitual(cura.r), todos);
      if (!p || p.longe) continue;
      botAndar(B, eu, p.cel);
      const res = rolarRitual(f, cura.r.n, cura.k, { alvo: ferido.f });
      if (res) {
        saveFicha(id, true);
        saveFicha(ferido.id, true);
        return;
      }
    }
  }
  // ataque: o primeiro jeito de atacar que alcança alguém andando até o deslocamento
  const jeitos = ataquesDe(f);
  let plano = null,
    jeito = null;
  for (const j of jeitos) {
    const p = planoDeMovimento(B, eu, deles, j.alc, todos);
    if (p && !p.longe) {
      plano = p;
      jeito = j;
      break;
    }
  }
  if (!plano) {
    const p = planoDeMovimento(B, eu, deles, 1, todos);
    if (p) botAndar(B, eu, p.cel);
    botDiz(`${f.nome} avança${p ? " na direção de " + p.alvo.f.nome : ""}.`);
    return;
  }
  botAndar(B, eu, plano.cel);
  const alvo = plano.alvo;
  const def = derivados(alvo.f).def;
  if (jeito.tipo === "ritual") {
    const res = rolarRitual(f, jeito.r.n, jeito.k, { alvoNome: alvo.f.nome });
    saveFicha(id, true);
    if (!res || !res.total) return;
    const passou = resistiu(alvo, jeito.r, res.dt);
    const v = passou
      ? /reduz|parcial|metade/i.test(jeito.r.res)
        ? Math.floor(res.total / 2)
        : 0
      : res.total;
    const n = danoContra(alvo.f, [{ v, t: jeito.r.el }]);
    botDiz(
      `${alvo.f.nome} ${passou ? "resistiu em parte" : "não resistiu"} a ${jeito.r.n}: ${botFerir(alvo, n)}`
    );
    return;
  }
  for (let i = 0; i < (jeito.vezes || 1) && alvo.vivo; i++) {
    let a, partes;
    if (jeito.tipo === "rapido") {
      a = rolarAtaqueRapido(f, jeito.w, { alvo: alvo.f.nome });
      partes = [{ v: a.tot || 0, t: a.tipo }];
    } else {
      const D = derivados(f);
      // combatente usa o Ataque Especial enquanto tiver mais da metade do PE
      const esp = !!(D.atq && cur(f, "pe") - D.atq[1] >= D.peMax / 2);
      a = rolarAtaque(f, jeito.w, { alvo: alvo.f.nome, esp, noTeste: esp ? D.atq[2] : 0 });
      if (!a) return;
      if (a.esp) saveFicha(id, true);
      partes = a.partes;
    }
    if (a.r.total >= def) botDiz(`${f.nome} acertou: ${botFerir(alvo, danoContra(alvo.f, partes))}`);
    else botDiz(`${f.nome} errou ${alvo.f.nome} (${a.r.total} contra Defesa ${def}).`);
  }
}
/* Chamado sempre que o combate muda: se a vez é de um bot (ou de alguém caído), age sozinho e
   passa o turno. Na vez de quem joga, só avisa. */
function botVez() {
  if (!sozinho()) return;
  const c = S.combate;
  if (!c || !(c.lista || []).length || c.lista.some(x => x.ini == null)) return;
  if (sozinhoFim()) return;
  const x = c.lista[c.turno || 0];
  const f = x && x.fichaId && S.fichas[x.fichaId];
  if (!f) return;
  const chave = `${c.inicio || 0}:${c.rodada}:${c.turno}`;
  if (S.botFeito === chave) return;
  S.botFeito = chave;
  clearTimeout(S.botT);
  const mesma = () =>
    S.combate && `${S.combate.inicio || 0}:${S.combate.rodada}:${S.combate.turno}` === chave;
  if (cur(f, "pv") <= 0) {
    S.botT = setTimeout(() => {
      if (!mesma()) return;
      botDiz(`${f.nome} está caído e perde a vez.`);
      proximoTurno();
    }, 700);
    return;
  }
  if (!f.bot && !f.npc) {
    toast(`Sua vez, ${f.nome}!`);
    if (S.tool !== "combate" && window.innerWidth > 760) openTool("combate");
    return;
  }
  S.botT = setTimeout(async () => {
    if (!mesma()) return;
    try {
      await botAgir(x.fichaId);
    } catch (e) {
      console.error(e);
    }
    renderBoard();
    S.botT = setTimeout(() => {
      if (mesma() && !sozinhoFim()) proximoTurno();
    }, 900);
  }, 900);
}
