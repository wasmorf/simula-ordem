"use strict";
/* Ficha: números calculados (PV, PE, SAN, Defesa...), salvar e lista de Agentes. */
/* ===================== FICHA ===================== */
function novaFicha() {
  const per = {};
  PERICIAS.forEach(([p]) => (per[p] = { g: 0, b: 0 }));
  return {
    v: 2,
    nome: "Novo agente",
    jogador: "",
    idade: "",
    origem: "Investigador",
    classe: "Combatente",
    trilha: "",
    nex: 5,
    pp: 0,
    attr: { AGI: 1, FOR: 1, INT: 1, PRE: 1, VIG: 1 },
    per,
    pv: null,
    pe: null,
    san: null,
    bonusPV: 0,
    bonusPE: 0,
    bonusSAN: 0,
    outrosDef: 0,
    desl: "9m",
    armas: [
      {
        nome: "Ataque desarmado",
        pericia: "Luta",
        dano: "1d3",
        crit: "x2",
        alc: "—",
        tipo: "I",
        cat: "—",
        esp: 0,
        agil: false,
        grupo: "—",
        bonus: 0,
        mods: []
      }
    ],
    protecoes: [],
    itens: [],
    poderes: [],
    paranormais: [],
    rituais: [],
    afinidade: "",
    aprimorado: false,
    cond: [],
    notas: "",
    aparencia: "",
    foto: "",
    dono: S.uid || "",
    criada: Date.now()
  };
}
// Fichas da versão anterior (treinada sim/não) viram graus
function migrar(f) {
  if (f.v === 2) return f;
  for (const p in f.per) {
    const v = f.per[p] || {};
    if (v.g == null) f.per[p] = { g: v.t ? 5 : 0, b: +v.b || 0 };
  }
  PERICIAS.forEach(([p]) => {
    if (!f.per[p]) f.per[p] = { g: 0, b: 0 };
  });
  f.protecoes = f.protecoes || [];
  f.itens = f.itens || [];
  f.poderes = f.poderes || [];
  f.paranormais = f.paranormais || [];
  f.pp = f.pp || 0;
  f.trilha = f.trilha || "";
  (f.armas || []).forEach(a => {
    if (!a.crit) {
      const m = +a.margem || 20,
        x = +a.mult || 2;
      a.crit = m < 20 && x > 2 ? `${m}/x${x}` : m < 20 ? String(m) : `x${x}`;
    }
    a.mods = a.mods || [];
  });
  if (!ORIGENS[f.origem]) f.origem = "Investigador";
  if (!CLASSES[f.classe]) f.classe = "Combatente";
  f.v = 2;
  return f;
}
const nexN = nex => (+nex >= 99 ? 20 : Math.max(1, Math.round((+nex || 5) / 5)));
function patenteDe(pp) {
  let p = PATENTES[0];
  for (const x of PATENTES) if ((+pp || 0) >= x[0]) p = x;
  return p;
}
function grau(f, p) {
  const v = f.per[p] || {};
  return +v.g || 0;
}
/* Danos extras da arma, cada um com o seu tipo: [{v: "2" ou "1d6", t: "Energia"}].
   Lê também o formato antigo (bônus de dano + um tipo só: a.bdano e a.tdano).
   comVazios: o editor mostra também as linhas ainda sem valor. */
function danosExtras(a, comVazios) {
  const l = (a.extras || []).filter(x => x && (comVazios || String(x.v || "").trim()));
  return a.tdano && +a.bdano ? [{ v: String(a.bdano), t: a.tdano }, ...l] : l;
}
function bonusDanoSemTipo(a) {
  return a.tdano ? 0 : +a.bdano || 0;
}
const RESISTENCIAS = ["Fortitude", "Reflexos", "Vontade"];
function modPericia(f, p) {
  const v = f.per[p] || {};
  const refl = RESISTENCIAS.includes(p) && (f.poderes || []).includes("Reflexos Defensivos") ? 2 : 0;
  return (+v.g || 0) + (+v.b || 0) + refl;
}
function derivados(f) {
  const c = CLASSES[f.classe] || CLASSES.Combatente;
  const n = nexN(f.nex);
  const inc = n - 1;
  const A = f.attr;
  const nex = +f.nex || 5;
  const temTrilha = (nome, idx) =>
    f.trilha && c.trilhas[f.trilha] && nex >= TRILHA_NEX[idx] && c.trilhas[f.trilha][idx] === nome;
  let pvMax = c.pv + A.VIG + inc * (c.pvN + A.VIG) + (+f.bonusPV || 0);
  if (f.origem === "Desgarrado") pvMax += n; // Calejado
  if (temTrilha("Casca Grossa", 0)) pvMax += n; // Tropa de Choque
  const paranormal = nome => (f.paranormais || []).includes(nome);
  if (paranormal("Sangue de Ferro")) pvMax += 2 * n; // +2 PV por NEX
  let peMax = c.pe + A.PRE + inc * (c.peN + A.PRE) + (+f.bonusPE || 0);
  if (f.origem === "Universitário") {
    peMax += 1;
    for (let k = 15; k <= Math.min(95, nex); k += 10) peMax += 1;
  } // Dedicação
  if (paranormal("Potencial Aprimorado")) peMax += n; // +1 PE por NEX
  let sanMax = c.san + inc * c.sanN + (+f.bonusSAN || 0);
  if (f.origem === "Vítima") sanMax += n; // Cicatrizes Psicológicas
  const transc = (f.poderes || []).filter(p => p === "Transcender").length;
  sanMax -= transc * c.sanN; // Transcender: sem Sanidade naquele aumento
  let def = 10 + A.AGI + (+f.outrosDef || 0),
    rd = 0;
  (f.protecoes || []).forEach(p => {
    if (p.usando === false) return;
    def += +p.def || 0;
    rd = Math.max(rd, +p.rd || 0);
  });
  if (f.origem === "Policial") def += 2; // Patrulha
  if ((f.poderes || []).includes("Reflexos Defensivos")) def += 2; // e +2 nas resistências (modPericia)
  def -= (f.cond || []).reduce(
    (m, c) => Math.max(m, (typeof DEF_COND !== "undefined" && DEF_COND[c]) || 0),
    0
  ); // condições (a mais severa)
  const limPE = n;
  const dtRit = 10 + limPE + A.PRE + (temTrilha("Rituais Eficientes", 2) ? 5 : 0); // Graduado
  const mochila = (f.itens || []).some(i => i.nome === "Mochila militar") ? 2 : 0;
  const carga =
    (temTrilha("Inventário Otimizado", 0) ? (A.FOR + A.INT) * 5 : A.FOR > 0 ? A.FOR * 5 : 2) +
    mochila +
    (+f.cargaExtra || 0);
  const usados = [...(f.armas || []), ...(f.protecoes || []), ...(f.itens || [])].reduce(
    (s, i) => s + (+i.esp || 0) * (+i.qtd || 1),
    0
  );
  const pat = patenteDe(f.pp);
  const usoCat = [0, 0, 0, 0, 0];
  [...(f.armas || []), ...(f.protecoes || []), ...(f.itens || [])].forEach(i => {
    const k = CAT_N[i.cat];
    if (k >= 1 && k <= 4) usoCat[k] += +i.qtd || 1;
  });
  const atq = TIERS_ATQ.find(t => nex >= t[0]);
  const perito = TIERS_PERITO.find(t => nex >= t[0]);
  let circ = 0;
  if (f.classe === "Ocultista") circ = (CIRC_OCULT.find(t => nex >= t[0]) || [0, 0])[1];
  else if ((f.poderes || []).includes("Transcender") || (f.paranormais || []).includes("Aprender Ritual"))
    circ = nex >= 75 ? 3 : nex >= 45 ? 2 : 1;
  const D = {
    pvMax,
    peMax,
    sanMax,
    def,
    rd,
    limPE,
    peRod: limPE,
    dtRit,
    carga,
    mochila,
    usados,
    pat,
    usoCat,
    atq,
    perito,
    circ,
    n
  };
  ajustarNpcRapido(f, D); // NPC de ficha rápida: números digitados pelo mestre (ficha/npcs)
  ajustarSobrevivente(f, D); // classe Sobrevivente: estágios no lugar do NEX (regras/sobrevivente)
  return D;
}
function cur(f, k) {
  const max = derivados(f)[k + "Max"];
  return f[k] == null ? max : f[k];
}
/* "NEX 35%" ou, para o Sobrevivente, "Estágio 2" */
function nivelDe(f) {
  return ehSobrevivente(f) ? "Estágio " + estagioDe(f) : "NEX " + f.nex + "%";
}
function canEditFicha(f) {
  return !!f && (S.isM || f.dono === S.uid);
}
let saveTimer = null;
/* Junta o que veio do banco na ficha que já está na tela (mantém o mesmo objeto). */
function mesclarFicha(old, novo, manter = []) {
  for (const k of Object.keys(old)) if (!(k in novo) && !manter.includes(k)) delete old[k];
  return Object.assign(old, novo);
}
/* Chegou uma versão da ficha do banco. Se ela está salvando agora, não dá para trocar no meio:
   guarda a versão e aplica quando o salvamento terminar (assim nada que o mestre mudou se perde). */
function fichaDoBanco(id, novo, path, manter = []) {
  const old = S.fichas[id];
  if (old && S.dirty[id]) {
    S.fichaRemota[id] = { novo, path };
    return old;
  }
  delete S.fichaRemota[id];
  S.fichaBase[path] = JSON.parse(JSON.stringify(novo)); // o que o banco tem (para salvar só o que mudar)
  return old ? mesclarFicha(old, novo, manter) : novo;
}
/* Esquece a versão do banco das fichas que sumiram da coleção (apagadas ou movidas). */
function esquecerBases(prefixo, lista) {
  const tem = new Set(lista.map(x => prefixo + x.id));
  for (const k in S.fichaBase) if (k.startsWith(prefixo) && !tem.has(k)) delete S.fichaBase[k];
}
/* O que mudou na ficha desde a última versão do banco (campo de cima a campo de cima). */
function camposMudados(base, dados) {
  const mud = {};
  for (const k in dados) if (JSON.stringify(dados[k]) !== JSON.stringify(base[k])) mud[k] = dados[k];
  for (const k in base) if (!(k in dados)) mud[k] = DEL;
  return mud;
}
function saveFicha(id, now) {
  const stamp = Date.now() + Math.random();
  S.dirty[id] = stamp;
  const st = $("#saveState");
  if (st) st.textContent = "Salvando…";
  clearTimeout(saveTimer);
  const go = () => {
    const f = S.fichas[id];
    if (!f) return;
    const mine = S.dirty[id];
    const dados = JSON.parse(JSON.stringify(f));
    const path = fichaPath(id);
    const base = S.fichaBase[path];
    // Salva só os campos que mudaram: se o mestre e o jogador mexem ao mesmo tempo, um não apaga o outro.
    if (base) {
      const mud = camposMudados(base, dados);
      if (Object.keys(mud).length) queueMerge(path, mud);
    } else queueSet(path, dados); // ficha nova (ou num lugar novo): grava inteira
    S.fichaBase[path] = dados;
    setTimeout(() => {
      if (S.dirty[id] === mine) {
        S.dirty[id] = 0;
        const s = $("#saveState");
        if (s) s.textContent = "Salvo";
        const remota = S.fichaRemota[id]; // chegou mudança de outra pessoa enquanto salvava
        if (remota && S.fichas[id]) {
          delete S.fichaRemota[id];
          mesclarFicha(S.fichas[id], remota.novo, ["npc"]);
          S.fichaBase[remota.path] = JSON.parse(JSON.stringify(remota.novo));
          renderBoard();
          if (!isEditing()) renderPanel();
        }
      }
    }, 1500);
  };
  if (now) go();
  else saveTimer = setTimeout(go, 700);
}
const fA = () => {
  const f = S.fichas[S.openFicha];
  return f ? migrar(f) : f;
};
/* Fotos por estado (aba História): machucado, morrendo, perturbado e enlouquecido trocam a foto sozinhas. */
const FOTOS_ESTADO = [
  ["machucado", "Machucado", "Vida pela metade ou menos"],
  ["morrendo", "Morrendo", "Vida zerada"],
  ["perturbado", "Perturbado", "Sanidade pela metade ou menos"],
  ["enlouquecido", "Enlouquecendo", "Sanidade zerada"]
];
function fotoAtual(f) {
  if (!f) return "";
  const fs = f.fotos || {};
  if (f.npc || !Object.keys(fs).length) return f.foto || "";
  const D = derivados(f);
  const pv = cur(f, "pv"),
    san = cur(f, "san");
  const estado =
    (pv <= 0 && fs.morrendo) ||
    (san <= 0 && fs.enlouquecido) ||
    (pv <= D.pvMax / 2 && fs.machucado) ||
    (san <= D.sanMax / 2 && fs.perturbado);
  return estado || f.foto || "";
}
/* Barra com metade ou menos fica mais escura (CSS .baixa). */
const metadeOuMenos = (v, max) => (max && v <= max / 2 ? " baixa" : "");
/* "9m" → "9m · 6 quadrados" (cada quadrado tem 1,5 m) */
function deslQuad(desl) {
  const m = parseFloat(String(desl || "9").replace(",", "."));
  return `${desl || "9m"}${m > 0 ? ` · ${Math.floor(m / 1.5)} ▢` : ""}`;
}
function avatar(f, size = 52) {
  return f && fotoAtual(f)
    ? `<img class="avatar" src="${fotoAtual(f)}" alt="" style="width:${size}px;height:${Math.round((size * 4) / 3)}px;object-fit:cover;object-position:50% 15%">`
    : `<div class="avatar ph" style="width:${size}px;height:${size}px">${esc(((f && f.nome) || "?").trim().charAt(0).toUpperCase())}</div>`;
}
function bars(f) {
  const D = derivados(f);
  const b = (k, lab, max) => {
    const v = cur(f, k);
    const p = Math.max(0, Math.min(100, max ? (v / max) * 100 : 0));
    return `<div class="bar ${k}"><span class="label">${lab}</span><span class="t"><i style="width:${p}%"></i></span><span class="v">${v}/${max}</span></div>`;
  };
  return `<div class="bars">${b("pv", "PV", D.pvMax)}${b("san", "SAN", D.sanMax)}${b("pe", "PE", D.peMax)}</div>`;
}
function condAuto(f) {
  const D = derivados(f);
  const out = [];
  const pv = cur(f, "pv"),
    san = cur(f, "san");
  if (pv <= 0) out.push("Morrendo");
  else if (pv < D.pvMax / 2) out.push("Machucado");
  if (san <= 0) out.push("Enlouquecendo");
  return out;
}

function agentesHTML() {
  const ids = Object.keys(S.fichas).sort((a, b) => (S.fichas[a].criada || 0) - (S.fichas[b].criada || 0));
  const npcs = ids.filter(id => S.fichas[id].npc);
  const mine = ids.filter(id => S.fichas[id].dono === S.uid && !S.fichas[id].npc),
    rest = ids.filter(id => S.fichas[id].dono !== S.uid && !S.fichas[id].npc);
  const card = id => {
    const f = migrar(S.fichas[id]);
    const D = derivados(f);
    const cs = [...condAuto(f), ...(f.cond || [])];
    return `<button class="fcard" data-open="${esc(id)}">${avatar(f)}<div style="min-width:0"><div class="label">${esc(f.classe)}${f.trilha ? " · " + esc(f.trilha) : ""} · ${nivelDe(f)}</div><div class="nm">${esc(f.nome)}</div><div class="muted small">${esc(f.origem)}${f.jogador ? " · " + esc(f.jogador) : ""} · DEF ${D.def} · ${esc(D.pat[1])}</div></div>${bars(f)}${cs.length ? `<div class="conds" style="grid-column:1/-1">${cs.map(c => `<span class="tag red">${esc(c)}</span>`).join("")}</div>` : ""}</button>`;
  };
  return `<button class="btn primary block" id="novaFicha">Criar ficha</button>${soloTrazerBotaoHTML()}${repetidosBotaoHTML()}
   ${mine.length ? `<div class="sub">${S.isM ? "Fichas que você criou" : "Seus agentes"}</div><div class="cards">${mine.map(card).join("")}</div>` : ""}
   ${rest.length ? `<div class="sub">${S.isM ? "Agentes dos jogadores" : "Outros agentes da mesa"}</div><div class="cards">${rest.map(card).join("")}</div>` : ""}
   ${npcSecaoHTML(npcs)}
   <button class="btn sm ghost" id="impFicha">Importar ficha de um backup</button>
   ${!ids.length ? `<div class="empty">${S.loaded.fichas ? "Nenhum agente ainda. Toque em <b>Criar ficha</b>: classes, trilhas, origens, perícias, armas e rituais seguem o Livro de Regras." : "Carregando fichas…"}</div>` : ""}`;
}
function bindAgentes() {
  $$("[data-open]").forEach(
    b =>
      (b.onclick = () => {
        S.openFicha = b.dataset.open;
        S.sheetTab = "principal";
        renderPanel();
        $("#pbody").scrollTop = 0;
      })
  );
  {
    const nn = $("#novoNpc");
    if (nn) nn.onclick = novoNpc;
  }
  bindNpcSecao();
  $("#impFicha").onclick = importarFicha;
  const trazer = $("#btnTrazerSolo");
  if (trazer) trazer.onclick = soloTrazer; // personagens da conta (mesa/personagens)
  const rep = $("#btnRepMesa");
  if (rep) rep.onclick = tirarRepetidosMesa; // fichas repetidas (mestre/gestao)
  $("#novaFicha").onclick = () => {
    if (toqueDuplo("novaFicha")) return;
    const id = "f" + rid(8);
    S.fichas[id] = novaFicha();
    S.openFicha = id;
    S.sheetTab = "principal";
    renderPanel();
    saveFicha(id, true);
  };
}
