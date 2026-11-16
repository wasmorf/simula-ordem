"use strict";
/* Jogar sozinho: o que o bot cria sozinho — os aliados (agentes prontos), os inimigos do bestiário
   e onde cada um começa no mapa. */

const BOT_NOMES = [
  "Rafa Sales",
  "Bia Torres",
  "Caio Mendes",
  "Lu Ferraz",
  "Duda Rocha",
  "Igor Prado",
  "Nina Alves",
  "Téo Brandão",
  "Jade Moreira",
  "Vítor Lacerda",
  "Malu Siqueira",
  "Davi Paixão"
];
/* Como o bot monta cada classe: atributos, os que sobem nos NEX 20/50/80/95, perícias
   (as duas primeiras sobem de grau com o NEX), armas da tabela do livro e rituais. */
const BOT_PERFIS = {
  Combatente: {
    origem: "Lutador",
    attr: { AGI: 2, FOR: 3, INT: 1, PRE: 1, VIG: 2 },
    sobe: ["FOR", "VIG", "AGI", "FOR"],
    per: ["Luta", "Fortitude", "Reflexos", "Iniciativa", "Percepção"],
    armas: ["Espada", "Pistola"],
    rituais: []
  },
  Especialista: {
    origem: "Militar",
    attr: { AGI: 3, FOR: 1, INT: 2, PRE: 1, VIG: 2 },
    sobe: ["AGI", "INT", "VIG", "AGI"],
    per: ["Pontaria", "Reflexos", "Iniciativa", "Percepção", "Furtividade"],
    armas: ["Revólver", "Faca"],
    rituais: []
  },
  Ocultista: {
    origem: "Acadêmico",
    attr: { AGI: 1, FOR: 1, INT: 3, PRE: 2, VIG: 2 },
    sobe: ["PRE", "INT", "VIG", "PRE"],
    per: ["Ocultismo", "Vontade", "Percepção", "Iniciativa", "Luta"],
    armas: ["Faca"],
    rituais: ["Eletrocussão", "Cicatrização", "Decadência", "Descarnar"]
  }
};
/* Um agente feito pelo bot, na classe e no NEX pedidos. */
function agenteBot(classe, nex, nome) {
  const P = BOT_PERFIS[classe] || BOT_PERFIS.Combatente;
  const f = novaFicha();
  Object.assign(f, {
    nome,
    classe: BOT_PERFIS[classe] ? classe : "Combatente",
    nex,
    origem: P.origem,
    jogador: "Bot",
    bot: true,
    dono: S.uid,
    criada: Date.now(),
    attr: { ...P.attr }
  });
  [20, 50, 80, 95].forEach((n, k) => {
    if (nex >= n && f.attr[P.sobe[k]] < 5) f.attr[P.sobe[k]]++;
  });
  const g = nex >= 70 ? 15 : nex >= 35 ? 10 : 5;
  P.per.forEach((p, k) => (f.per[p] = { g: k < 2 ? g : 5, b: 0 }));
  f.armas = P.armas.map(n => armaNova(armaInfo(n)));
  migrar(f);
  const circ = Math.max(1, derivados(f).circ || 0);
  f.rituais = P.rituais.filter(n => (allRituais().find(r => r.n === n) || { c: 9 }).c <= circ);
  return f;
}
/* Classes dos aliados: sempre a que menos aparece no grupo (quem joga + quem já entrou) */
function classesDosAliados(minha, n) {
  const ordem = ["Combatente", "Ocultista", "Especialista"];
  const tem = [minha];
  const out = [];
  for (let i = 0; i < n; i++) {
    const conta = c => tem.filter(x => x === c).length;
    const c = ordem.slice().sort((a, b) => conta(a) - conta(b))[0];
    out.push(c);
    tem.push(c);
  }
  return out;
}
/* Os inimigos do combate: criaturas do bestiário cuja soma de VD chega perto do desafio.
   No normal, cada agente do grupo "vale" uns 3/4 do NEX dele em VD. */
const BOT_DESAFIO = { facil: 0.5, normal: 0.75, dificil: 1.15 };
function inimigosPara(nex, tamGrupo, nivel, R = Math.random, opc = {}) {
  const alvo = Math.max(5, nex) * tamGrupo * (BOT_DESAFIO[nivel] || 0.75) * (opc.fator || 1);
  const todos = allBest().filter(b => b.el && +b.pv > 0 && b.atk && !/\(/.test(b.n));
  const doEl = opc.el ? todos.filter(b => b.el.split(" e ").includes(opc.el)) : todos;
  const ok = doEl.some(b => b.vd <= alvo * 1.1) ? doEl : todos;
  let pool = ok.filter(b => b.vd <= alvo * 1.1);
  if (!pool.length)
    pool = ok
      .slice()
      .sort((a, b) => a.vd - b.vd)
      .slice(0, 3);
  const out = [];
  let soma = 0;
  // um mais forte (até metade do desafio, ou o que couber) e o resto de ameaças menores
  const fortes = pool.filter(b => b.vd >= alvo * 0.35);
  const lider = (fortes.length ? fortes : pool)[Math.floor(R() * (fortes.length || pool.length))];
  out.push(lider);
  soma += lider.vd;
  while (soma < alvo * 0.85 && out.length < 4) {
    const cabe = pool.filter(b => b.vd <= alvo - soma + 5);
    if (!cabe.length) break;
    const b = cabe[Math.floor(R() * cabe.length)];
    out.push(b);
    soma += b.vd;
  }
  return out;
}
/* Mapas bons para combate (do criador de mapas) */
const BOT_LUGARES = [
  "Rua à noite",
  "Floresta",
  "Galpão",
  "Cemitério à noite",
  "Casa abandonada",
  "Esgoto",
  "Mercado",
  "Clareira do ritual",
  "Fazenda",
  "Porto"
];

/* ---------- o mapa como grade: onde dá para pisar e por onde dá para passar ---------- */
const BOT_PISO_FECHADO = new Set([".", "W", "V"]); // vazio, água funda, vazio dimensional
/* Grade do mapa do criador de mapas (M): paredes (sem contar portas, que o bot abre), chão que
   não dá para pisar e objetos que ocupam o lugar (móveis, carros; tapetes e manchas não). */
function gradeDoMapa(M) {
  const w = M.w,
    h = M.h;
  const paredes = new Set();
  (M.paredes || []).forEach(s => {
    const [o, x, y, ...resto] = s.split(",");
    const v = resto.join(",");
    const porta = v.match(/^a:([^:]+):/);
    if (porta && !/janela/.test(porta[1])) return; // porta, portão: passa
    paredes.add(`${o},${x},${y}`);
  });
  const ocupado = new Uint8Array(w * h);
  (M.objs || []).forEach(o => {
    const T = typeof MA_OBJ !== "undefined" && MA_OBJ[o.t];
    if (!T || (T.z ?? 1) !== 1 || (T.w || 1) * (T.h || 1) < 0.5) return;
    const a = ((o.r || 0) * Math.PI) / 180;
    const ow = (T.w || 1) * (o.e || 1),
      oh = (T.h || 1) * (o.e || 1);
    const rx = (Math.abs(Math.cos(a)) * ow + Math.abs(Math.sin(a)) * oh) / 2;
    const ry = (Math.abs(Math.sin(a)) * ow + Math.abs(Math.cos(a)) * oh) / 2;
    for (let y = Math.floor(o.y - ry); y <= Math.floor(o.y + ry); y++)
      for (let x = Math.floor(o.x - rx); x <= Math.floor(o.x + rx); x++) {
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        if (Math.abs(x + 0.5 - o.x) < rx && Math.abs(y + 0.5 - o.y) < ry) ocupado[y * w + x] = 1;
      }
  });
  const piso = (x, y) => x >= 0 && y >= 0 && x < w && y < h && !BOT_PISO_FECHADO.has(M.chao[y * w + x]);
  const livre = (x, y) => piso(x, y) && !ocupado[y * w + x];
  // passo de uma célula para a vizinha (na diagonal, as duas retas também têm de dar)
  const reto = (x, y, dx, dy) => {
    if (dx === 1) return !paredes.has(`v,${x + 1},${y}`);
    if (dx === -1) return !paredes.has(`v,${x},${y}`);
    if (dy === 1) return !paredes.has(`h,${x},${y + 1}`);
    return !paredes.has(`h,${x},${y}`);
  };
  const passa = (x, y, dx, dy) => {
    if (!piso(x + dx, y + dy)) return false;
    if (!dx || !dy) return reto(x, y, dx, dy);
    return (
      reto(x, y, dx, 0) &&
      reto(x + dx, y, 0, dy) &&
      reto(x, y, 0, dy) &&
      reto(x, y + dy, dx, 0) &&
      piso(x + dx, y) &&
      piso(x, y + dy)
    );
  };
  return { w, h, livre, passa };
}
const BOT_VIZ = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1]
];
/* Caminhos a partir de uma célula: distância (em passos) e de onde veio cada célula alcançada.
   bloq: células ocupadas por outros tokens (não dá para parar nem passar por elas). */
function caminhos(G, x0, y0, bloq = new Set(), max = 999) {
  const dist = new Map([[x0 + "," + y0, 0]]);
  const fila = [[x0, y0]];
  while (fila.length) {
    const [x, y] = fila.shift();
    const d = dist.get(x + "," + y);
    if (d >= max) continue;
    for (const [dx, dy] of BOT_VIZ) {
      const k = x + dx + "," + (y + dy);
      if (dist.has(k) || bloq.has(k) || !G.passa(x, y, dx, dy)) continue;
      dist.set(k, d + 1);
      fila.push([x + dx, y + dy]);
    }
  }
  return dist;
}
/* Onde cada lado começa: os agentes num canto livre do mapa e os inimigos a uns 10 passos
   (ou o mais longe que der), todos em células livres e ligadas entre si. */
function pontosDeInicio(M, nAgentes, nInimigos, R = Math.random) {
  const G = gradeDoMapa(M);
  const livres = [];
  for (let y = 0; y < G.h; y++) for (let x = 0; x < G.w; x++) if (G.livre(x, y)) livres.push([x, y]);
  if (!livres.length) return null;
  // a maior área ligada: parte do meio do mapa
  const meio = livres
    .slice()
    .sort(
      (a, b) => Math.hypot(a[0] - G.w / 2, a[1] - G.h / 2) - Math.hypot(b[0] - G.w / 2, b[1] - G.h / 2)
    )[0];
  const daqui = caminhos(G, meio[0], meio[1]);
  const ligadas = livres.filter(([x, y]) => daqui.has(x + "," + y));
  const lado = R() < 0.5;
  const ancoraA = ligadas
    .slice()
    .sort(
      (a, b) => (lado ? a[0] - b[0] : b[0] - a[0]) || Math.abs(a[1] - G.h / 2) - Math.abs(b[1] - G.h / 2)
    )[0];
  const dA = caminhos(G, ancoraA[0], ancoraA[1]);
  const longe = Math.min(10, Math.max(...dA.values()));
  const candB = ligadas.filter(([x, y]) => {
    const d = dA.get(x + "," + y) || 0;
    return d >= longe && d <= longe + 3;
  });
  const ancoraB = candB[Math.floor(R() * candB.length)] || ligadas[ligadas.length - 1];
  const usados = new Set();
  const grupo = (anc, n) => {
    const out = [];
    const perto = [...caminhos(G, anc[0], anc[1]).entries()].sort((a, b) => a[1] - b[1]);
    for (const [k] of perto) {
      if (out.length >= n) break;
      const [x, y] = k.split(",").map(Number);
      if (!G.livre(x, y) || usados.has(k)) continue;
      usados.add(k);
      out.push([x, y]);
    }
    return out;
  };
  return { agentes: grupo(ancoraA, nAgentes), inimigos: grupo(ancoraB, nInimigos) };
}
