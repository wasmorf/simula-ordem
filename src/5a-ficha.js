<script>
"use strict";
/* ===================== CATÁLOGOS + HOMEBREW ===================== */
const hbOf = t => S.homebrew.filter(h => h.tipo === t);
const ROMAN = ["", "I", "II", "III", "IV"];
const CAT_N = { 0: 0, I: 1, II: 2, III: 3, IV: 4, "—": -1 };
function catPlus(c, k) {
  const v = Math.max(0, (CAT_N[c] ?? 0) + k);
  return ["0", "I", "II", "III", "IV", "V", "VI"][v] || String(v);
}
// Ritual normalizado: {n, el, c, ex, al, alvo, du, res, tipo, formas:[{k, dado, custo, req}], hb}
function allRituais() {
  const base = RITUAIS_LIVRO.map(([n, el, c, ex, al, alvo, du, res, dado, D, V, tipo]) => {
    const custo = CUSTO_CIRCULO[c];
    const formas = [{ k: "Normal", dado, custo, req: "" }];
    if (D) formas.push({ k: "Discente", dado: D[1], custo: custo + D[0], req: D[2] });
    if (V) formas.push({ k: "Verdadeiro", dado: V[1], custo: custo + V[0], req: V[2] });
    return { n, el, c, ex, al, alvo, du, res, tipo, formas };
  });
  const hb = hbOf("ritual").map(h => {
    const c = +h.circulo || 1;
    const custo = +h.custo || CUSTO_CIRCULO[c];
    const formas = [{ k: "Normal", dado: h.dado || "", custo, req: "" }];
    if (h.dadoD || +h.custoD)
      formas.push({ k: "Discente", dado: h.dadoD || "", custo: +h.custoD || custo + 2, req: "" });
    if (h.dadoV || +h.custoV)
      formas.push({ k: "Verdadeiro", dado: h.dadoV || "", custo: +h.custoV || custo + 5, req: "" });
    return {
      n: h.nome,
      el: h.el || "Medo",
      c,
      ex: "",
      al: "",
      alvo: "",
      du: "",
      res: "",
      tipo: (h.efeito || "").toLowerCase(),
      formas,
      hb: true,
      desc: h.desc || ""
    };
  });
  return base.concat(hb);
}
function armaInfo(nome) {
  const a = ARMAS_LIVRO.find(x => x[0] === nome);
  return a
    ? {
        nome: a[0],
        grupo: a[1],
        emp: a[2],
        cat: a[3],
        dano: a[4],
        crit: a[5],
        alc: a[6],
        tipo: a[7],
        esp: a[8],
        agil: !!a[9]
      }
    : null;
}
function allArmas() {
  return ARMAS_LIVRO.map(a => armaInfo(a[0])).concat(
    hbOf("arma").map(h => ({
      nome: h.nome,
      grupo: h.grupo || "táticas",
      emp: h.pericia === "Pontaria" ? "Fogo · uma mão" : "Corpo a corpo · uma mão",
      cat: h.cat || "I",
      dano: h.dado || "1d6",
      crit:
        (+h.margem < 20 ? h.margem : "") +
        ((+h.mult || 2) > 2 || +h.margem >= 20 ? (+h.margem < 20 ? "/" : "") + "x" + (+h.mult || 2) : ""),
      alc: "—",
      tipo: "",
      esp: 1,
      agil: false,
      hb: true
    }))
  );
}
function allBest() {
  return AMEACAS.map(([n, el, vd, def, pv, pres, atk, at]) => ({ n, el, vd, def, pv, pres, atk, at })).concat(
    hbOf("criatura").map(h => ({
      n: h.nome,
      el: h.el || "",
      vd: +h.vd || 0,
      def: +h.def || 10,
      pv: +h.pv || 10,
      pres: h.desc || "",
      atk: ["Ataque", Math.max(1, +h.atkD || 2), +h.atk || 0, h.dado || "1d6"],
      at: [1, 1, 1, 1, 1],
      hb: true
    }))
  );
}
function parseCrit(s) {
  s = String(s || "x2");
  const m = s.match(/^(\d+)?\/?x?(\d+)?$/);
  let marg = 20,
    mult = 2;
  if (/^\d+$/.test(s)) {
    marg = +s;
  } else if (/^x\d+$/.test(s)) {
    mult = +s.slice(1);
  } else {
    const p = s.split("/");
    marg = +p[0] || 20;
    mult = +(p[1] || "x2").replace("x", "") || 2;
  }
  return { marg, mult };
}

/* ===================== ÍCONES ===================== */
const sv = d =>
  `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const SIGILO = {
  Sangue: sv(
    '<circle cx="20" cy="20" r="17"/><path d="M20 7c5 7 8 11 8 15a8 8 0 0 1-16 0c0-4 3-8 8-15Z"/><path d="M20 30v6M14 4l2 4M26 4l-2 4"/>'
  ),
  Morte: sv(
    '<circle cx="20" cy="20" r="17"/><path d="M20 20m-2 0a2 2 0 1 1 4 0a4 4 0 1 1-8 0a6 6 0 1 1 12 0a8 8 0 1 1-16 0a10 10 0 1 1 20 0"/>'
  ),
  Energia: sv('<path d="M20 3 37 20 20 37 3 20Z"/><path d="M22 9l-7 12h6l-3 10 8-13h-6Z"/>'),
  Conhecimento: sv(
    '<circle cx="20" cy="20" r="17"/><path d="M6 20c4-6 9-9 14-9s10 3 14 9c-4 6-9 9-14 9s-10-3-14-9Z"/><circle cx="20" cy="20" r="4"/><path d="M20 3v5M20 32v5"/>'
  ),
  Medo: sv(
    '<circle cx="20" cy="20" r="17"/><circle cx="20" cy="20" r="11"/><circle cx="20" cy="20" r="5"/><path d="M20 3v34M3 20h34"/>'
  )
};
const RIC = {
  pv: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.5-9.3C1 8.1 3.3 4.5 6.9 4.5c2.1 0 3.6 1.1 5.1 3 1.5-1.9 3-3 5.1-3 3.6 0 5.9 3.6 4.4 7.2C19.5 16.4 12 21 12 21Z"/></svg>`,
  san: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 4.5a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a3 3 0 0 0-3-.5ZM15 4.5a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"/></svg>`,
  pe: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.6 6 6.4.6-4.9 4.2 1.5 6.3L12 16.3l-5.6 3.3 1.5-6.3L3 9.1l6.4-.6Z"/></svg>`
};
const WI = {
  fogo: `<svg viewBox="0 0 48 20" fill="currentColor"><path d="M2 6h30l2-2h8v5h4v3H34l-3 2h-6l-2 5h-6l2-5H2Z"/></svg>`,
  arco: `<svg viewBox="0 0 48 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2c10 4 10 12 0 16M8 2v16M4 10h40M38 6l6 4-6 4"/></svg>`,
  punho: `<svg viewBox="0 0 48 20" fill="currentColor"><rect x="14" y="4" width="18" height="12" rx="4"/><rect x="30" y="7" width="6" height="7" rx="2"/><path d="M2 8h12v5H2Z"/></svg>`,
  impacto: `<svg viewBox="0 0 48 20" fill="currentColor"><path d="M2 8.5h30v3H2Z"/><rect x="30" y="2" width="12" height="16" rx="2"/></svg>`,
  lamina: `<svg viewBox="0 0 48 20" fill="currentColor"><path d="M2 8.5h12v3H2ZM14 6h3v8h-3ZM17 8l25-2 4 4-4 4-25-2Z"/></svg>`,
  pesada: `<svg viewBox="0 0 48 20" fill="currentColor"><path d="M2 7h34l4-3h6v12h-6l-4-3H2Z"/><rect x="14" y="13" width="5" height="6"/></svg>`
};

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
function modPericia(f, p) {
  const v = f.per[p] || {};
  return (+v.g || 0) + (+v.b || 0);
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
  let peMax = c.pe + A.PRE + inc * (c.peN + A.PRE) + (+f.bonusPE || 0);
  if (f.origem === "Universitário") {
    peMax += 1;
    for (let k = 15; k <= Math.min(95, nex); k += 10) peMax += 1;
  } // Dedicação
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
  def -= (f.cond || []).reduce(
    (m, c) => Math.max(m, (typeof DEF_COND !== "undefined" && DEF_COND[c]) || 0),
    0
  ); // condições (a mais severa)
  const limPE = n;
  const dtRit = 10 + limPE + A.PRE;
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
  return {
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
}
function cur(f, k) {
  const max = derivados(f)[k + "Max"];
  return f[k] == null ? max : f[k];
}
function canEditFicha(f) {
  return !!f && (S.isM || f.dono === S.uid);
}
let saveTimer = null;
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
    queueSet(fichaPath(id), dados);
    setTimeout(() => {
      if (S.dirty[id] === mine) {
        S.dirty[id] = 0;
        const s = $("#saveState");
        if (s) s.textContent = "Salvo";
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
function avatar(f, size = 52) {
  return f && f.foto
    ? `<img class="avatar" src="${f.foto}" alt="" style="width:${size}px;height:${Math.round((size * 4) / 3)}px;object-fit:cover;object-position:50% 15%">`
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
    return `<button class="fcard" data-open="${esc(id)}">${avatar(f)}<div style="min-width:0"><div class="label">${esc(f.classe)}${f.trilha ? " · " + esc(f.trilha) : ""} · ${f.classe === "Sobrevivente" ? "Estágio " + (+f.estagio || 1) : "NEX " + f.nex + "%"}</div><div class="nm">${esc(f.nome)}</div><div class="muted small">${esc(f.origem)}${f.jogador ? " · " + esc(f.jogador) : ""} · DEF ${D.def} · ${esc(D.pat[1])}</div></div>${bars(f)}${cs.length ? `<div class="conds" style="grid-column:1/-1">${cs.map(c => `<span class="tag red">${esc(c)}</span>`).join("")}</div>` : ""}</button>`;
  };
  return `<button class="btn primary block" id="novaFicha">Criar ficha</button>
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
  $("#novaFicha").onclick = () => {
    const id = "f" + rid(8);
    S.fichas[id] = novaFicha();
    S.openFicha = id;
    S.sheetTab = "principal";
    renderPanel();
    saveFicha(id, true);
  };
}

/* ---------- ficha: HTML ---------- */
const SHEET_TABS = [
  ["principal", "Principal"],
  ["pericias", "Perícias"],
  ["combate", "Combate"],
  ["rituais", "Rituais"],
  ["habilidades", "Habilidades"],
  ["inventario", "Inventário"],
  ["historia", "História"]
];
function sheetHTML() {
  const id = S.openFicha;
  const f = fA();
  if (!f)
    return `<div class="empty">Esta ficha não existe mais. <button class="btn sm" data-back>Voltar</button></div>`;
  const D = derivados(f);
  const c = CLASSES[f.classe];
  const ed = canEditFicha(f);
  const t = S.sheetTab || "principal";
  const sel = (name, opts, val, suf = "", ph) =>
    `<select id="s_${name}" data-f="${name}">${ph ? `<option value="">${ph}</option>` : ""}${opts.map(o => `<option ${String(o) === String(val) ? "selected" : ""} value="${esc(o)}">${esc(o)}${suf}${fonteTag(o)}</option>`).join("")}</select>`;
  const pedi = (S.pedidos || []).find(x => x.id === S.uid && x.fichaId === id);
  const claim =
    !ed && f.dono !== S.uid && !f.npc
      ? `<div class="banner" style="border-color:var(--purple);color:var(--fg);background:var(--purple-soft)">${pedi ? "Pedido enviado. Quando o mestre aprovar, a ficha volta a ser sua." : `Esta ficha é sua e você perdeu o acesso (trocou de aparelho ou limpou o navegador)? <button type="button" class="btn sm primary" id="btnClaim">Pedir minha ficha de volta</button>`}</div>`
      : "";
  const npcBar =
    f.npc && S.isM
      ? `<label class="check banner" style="border-color:var(--purple);color:var(--fg);background:var(--purple-soft)"><input type="checkbox" id="npcVis" ${f.visivel ? "checked" : ""}> NPC visível para os jogadores (eles só leem)</label>`
      : "";
  const transf =
    S.isM && !f.npc
      ? `<details class="more"><summary>Dono da ficha (mestre)</summary><div class="stack" style="margin-top:8px;gap:6px">${
          (S.pedidos || [])
            .filter(x => x.fichaId === id)
            .map(
              x =>
                `<div class="row between"><span class="small">${esc(x.quem || "Jogador")} pediu esta ficha</span><span class="row"><button type="button" class="btn sm primary" data-aprova="${esc(x.id)}">Dar a ficha</button><button type="button" class="btn sm ghost" data-recusa="${esc(x.id)}">Recusar</button></span></div>`
            )
            .join("") ||
          `<span class="muted small">Nenhum pedido. Quando um jogador perder o acesso, ele pede a ficha de volta por aqui e você aprova.</span>`
        }</div></details>`
      : "";
  const head = `<div class="row between"><button class="btn sm ghost" data-back>← Agentes</button><span class="muted small" id="saveState">${ed ? "Salvo" : "Só leitura"}</span></div>${claim}${npcBar}${transf}
  <div class="sheet-top"><button type="button" class="photo" id="foto" aria-label="Trocar foto" ${ed ? "" : "disabled"}>${f.foto ? `<img src="${f.foto}" alt="">` : `<span>Toque para pôr a arte do agente</span>`}</button>
   <div class="stack" style="gap:6px;min-width:0"><input class="nmin" type="text" id="s_nome" data-f="nome" value="${esc(f.nome)}" maxlength="50" aria-label="Nome do agente" ${ed ? "" : "disabled"}>
    <div class="muted small">${esc(f.classe)}${f.trilha ? " · " + esc(f.trilha) : ""} · ${esc(f.origem)} · NEX ${f.nex}% · ${esc(D.pat[1])}</div>
    ${rbarMini(f, D)}</div></div>
  <div class="tabs2" role="tablist">${SHEET_TABS.map(([k, n]) => `<button type="button" data-stab="${k}" aria-pressed="${t === k}">${n}</button>`).join("")}</div>`;
  const body = {
    principal: () => tabPrincipal(f, D, c, sel),
    pericias: () => tabPericias(f, D),
    combate: () => tabCombate(f, D, c),
    rituais: () => tabRituais(f, D),
    habilidades: () => tabHabilidades(f, D, c),
    inventario: () => tabInventario(f, D),
    historia: () => tabHistoria(f)
  }[t]();
  return (
    head +
    `<fieldset ${ed ? "" : "disabled"} style="border:0;padding:0;margin:0;min-width:0" class="stack">${body}</fieldset>`
  );
}
function rbarMini(f, D) {
  const b = (k, max) => {
    const v = cur(f, k);
    return `<div class="mbar ${k}"><i style="width:${Math.max(0, Math.min(100, (v / max) * 100))}%"></i><span>${k.toUpperCase()} ${v}/${max}</span></div>`;
  };
  return `<div class="mbars">${b("pv", D.pvMax)}${b("san", D.sanMax)}${b("pe", D.peMax)}</div>`;
}
function rbar(k, lab, v, max) {
  const p = Math.max(0, Math.min(100, max ? (v / max) * 100 : 0));
  return `<div class="rbar ${k}"><span class="ric">${RIC[k]}</span><div style="flex:1;min-width:0"><div class="label">${lab}</div><div class="rtr"><i style="width:${p}%"></i><button type="button" data-res="${k}" data-d="-5" aria-label="${lab} −5">«</button><button type="button" data-res="${k}" data-d="-1" aria-label="${lab} −1">‹</button><span>${v}/${max}</span><button type="button" data-res="${k}" data-d="1" aria-label="${lab} +1">›</button><button type="button" data-res="${k}" data-d="5" aria-label="${lab} +5">»</button></div></div></div>`;
}

function tabPrincipal(f, D, c, sel) {
  const pts = ATTRS.reduce((a, k) => a + f.attr[k], 0) - 5;
  const og = ORIGENS[f.origem];
  const auto = condAuto(f);
  return `<div class="fields">
   <div class="field"><label class="label" for="s_jogador">Jogador</label><input type="text" id="s_jogador" data-f="jogador" value="${esc(f.jogador)}" maxlength="40"></div>
   <div class="field"><label class="label" for="s_idade">Idade</label><input type="text" id="s_idade" data-f="idade" value="${esc(f.idade || "")}" maxlength="20"></div>
   <div class="field"><label class="label" for="s_origem">Origem</label>${sel(
     "origem",
     Object.keys(ORIGENS).sort((a, b) => a.localeCompare(b, "pt")),
     f.origem
   )}</div>
   <div class="field"><label class="label" for="s_classe">Classe</label>${sel("classe", Object.keys(CLASSES), f.classe)}</div>
   <div class="field"><label class="label" for="s_trilha">Trilha</label>${sel("trilha", Object.keys(c.trilhas), f.trilha, "", "— escolha em NEX 10% —")}</div>
   <div class="field"><label class="label" for="s_nex">NEX</label>${sel("nex", NEX_OPTS, f.nex, "%")}</div>
   <div class="field"><label class="label" for="s_pp">Pontos de prestígio</label><input type="number" id="s_pp" data-f="pp" value="${+f.pp || 0}" min="0"></div>
   <div class="field"><label class="label" for="s_pat">Patente</label><select id="s_pat" data-patsel ${canEditFicha(f) ? "" : "disabled"}>${PATENTES.map((p, i) => `<option value="${i}" ${patenteDe(f.pp) === p ? "selected" : ""}>${esc(p[1])}</option>`).join("")}</select></div>
  </div>
  <p class="muted small" style="margin:0">Origem: <b style="color:var(--fg)">${esc(og[1])}</b> · perícias ${og[0].join(" e ") || "à escolha do mestre"}. Classe: ${c.fixasTxt ? esc(c.fixasTxt) + " + " : ""}${c.livres} + INT perícias à escolha. <button type="button" class="btn sm" id="btnAplicar">Marcar perícias da origem e classe</button></p>
  <div class="box stack"><div class="row between"><h3>Atributos</h3><span class="muted small">${pts === 4 ? "4 pontos distribuídos" : pts > 4 ? `${pts} pontos (criação: 4; aumentos em NEX 20/50/80/95%)` : `${4 - pts} ponto(s) livre(s)`}</span></div>
   <div class="attrs">${ATTRS.map(k => `<div class="attr" title="${ATTR_NOME[k]}"><span class="k">${k}</span><span class="n">${f.attr[k]}</span><div class="pm"><button type="button" data-attr="${k}" data-d="-1" aria-label="Diminuir ${ATTR_NOME[k]}">−</button><button type="button" data-attr="${k}" data-d="1" aria-label="Aumentar ${ATTR_NOME[k]}">+</button></div></div>`).join("")}</div></div>
  ${morrendoHTML(f)}
  <div class="box stack"><h3>Recursos</h3>
   ${rbar("pv", "Vida", cur(f, "pv"), D.pvMax)}${rbar("san", "Sanidade", cur(f, "san"), D.sanMax)}${rbar("pe", "Esforço", cur(f, "pe"), D.peMax)}
   <div class="stats">${[
     ["Defesa", D.def],
     ["Resist. dano", D.rd],
     ["Limite PE/turno", D.limPE],
     ["Desloc.", esc(f.desl || "9m")],
     ["DT rituais", D.dtRit],
     ["Carga", `${D.usados}/${D.carga}`]
   ]
     .map(([k, v]) => `<div><b>${v}</b><span>${k}</span></div>`)
     .join("")}</div>
   ${D.usados > D.carga ? `<div class="banner">Sobrecarregado: −5 na Defesa e em perícias com carga, deslocamento −3m.${D.usados > D.carga * 2 ? " Acima do dobro do limite: não dá para carregar tudo isso." : ""}</div>` : ""}
   <details class="more"><summary>Ajustar bônus e máximos</summary><div class="fields" style="margin-top:8px">
    <div class="field"><label class="label" for="s_outrosDef">Outros na Defesa</label><input type="number" id="s_outrosDef" data-f="outrosDef" value="${+f.outrosDef || 0}"></div>
    <div class="field"><label class="label" for="s_desl">Deslocamento</label><input type="text" id="s_desl" data-f="desl" value="${esc(f.desl || "9m")}" maxlength="12"></div>
    <div class="field"><label class="label" for="s_bonusPV">Ajuste PV máx.</label><input type="number" id="s_bonusPV" data-f="bonusPV" value="${+f.bonusPV || 0}"></div>
    <div class="field"><label class="label" for="s_bonusSAN">Ajuste SAN máx.</label><input type="number" id="s_bonusSAN" data-f="bonusSAN" value="${+f.bonusSAN || 0}"></div>
    <div class="field"><label class="label" for="s_bonusPE">Ajuste PE máx.</label><input type="number" id="s_bonusPE" data-f="bonusPE" value="${+f.bonusPE || 0}"></div>
   </div></details>
  </div>
  <div class="box stack"><div class="row between"><h3>Condições</h3><div class="row" style="flex-wrap:nowrap"><select id="condSel" style="width:auto;max-width:170px">${CONDICOES.filter(
    x => !(f.cond || []).includes(x)
  )
    .map(x => `<option>${esc(x)}</option>`)
    .join(
      ""
    )}<option value="__outra">Outra…</option></select><button type="button" class="btn sm primary" id="condAdd" aria-label="Adicionar condição">+</button></div></div>
   ${auto.length ? `<div class="conds">${auto.map(x => `<span class="tag red" title="${esc(CONDICOES_LIVRO[x] || "")}">${esc(x)} (automático)</span>`).join("")}</div>` : ""}
   ${(f.cond || []).length ? `<div class="cards">${f.cond.map((x, i) => `<div class="condrow"><span>${I.sigil.replace('width="38" height="38"', 'width="22" height="22"')}</span><div style="min-width:0"><b>${esc(x)}</b>${CONDICOES_LIVRO[x] ? `<div class="muted small">${esc(CONDICOES_LIVRO[x])}</div>` : ""}</div><button type="button" class="x" data-uncond="${i}" aria-label="Tirar ${esc(x)}">✕</button></div>`).join("")}</div>` : auto.length ? "" : `<div class="muted small">Nenhuma condição.</div>`}
  </div>
  <div class="box stack"><h3>Interlúdio</h3>
   <div class="row" style="flex-wrap:nowrap"><label class="label" for="descSel" style="white-space:nowrap">Descanso</label><select id="descSel">${DESCANSO.map(([n, m], i) => `<option value="${i}" ${i === 1 ? "selected" : ""}>${n} (×${m})</option>`).join("")}</select></div>
   <div class="row"><button type="button" class="btn sm" id="itDormir">Dormir</button><button type="button" class="btn sm" id="itRelaxar">Relaxar</button><button type="button" class="btn sm" id="itPE">PE cheios</button></div>
   <p class="muted small" style="margin:0">Dormir recupera PV e PE iguais ao limite de PE (${D.limPE}) vezes o descanso; Relaxar recupera Sanidade do mesmo jeito. Outras ações: ${INTERLUDIO.filter(x => !["Dormir", "Relaxar"].includes(x)).join(", ")}.</p>
  </div>`;
}
function tabPericias(f, D) {
  const c = CLASSES[f.classe];
  return `<div class="box stack"><div class="row between"><h3>Perícias</h3><span class="muted small">grau · outros · rolar</span></div>
   ${f.classe === "Especialista" && D.perito ? `<label class="check"><input type="checkbox" id="usarPerito"> Perito no próximo teste (${D.perito[1]} PE: +${D.perito[2]})</label>` : ""}
   <div>${PERICIAS.map(([p, a, r]) => {
     const v = f.per[p] || { g: 0, b: 0 };
     const g = +v.g || 0;
     return `<div class="per2 ${g ? "tr" : ""}"><span class="pn">${esc(p)}${r ? ` <span class="only">${esc(r)}</span>` : ""}</span><span class="a">${a}</span>
     <select data-perg="${esc(p)}" aria-label="Grau em ${esc(p)}">${GRAUS.map(([n, l]) => `<option value="${n}" ${g === n ? "selected" : ""}>${l}</option>`).join("")}</select>
     <input type="number" data-perb="${esc(p)}" value="${+v.b || 0}" aria-label="Outros bônus em ${esc(p)}">
     <button type="button" class="rollbtn" data-roll="${esc(p)}" ${/só treinada/.test(r) && !g ? 'title="Só pode ser usada treinada"' : ""}>${rollLabel(f, p, a)}</button></div>`;
   }).join("")}</div>
   <p class="muted small" style="margin:0">Treinado +5, veterano +10, expert +15. Perícias "só treinada" não podem ser usadas sem treino; "kit" sofre −5 sem o kit.</p></div>`;
}
function rollLabel(f, p, a) {
  const m = modPericia(f, p);
  const n = f.attr[a];
  return `${n >= 1 ? n : 2 - n}d20${m ? (m > 0 ? "+" : "") + m : ""}`;
}
function weaponIcon(a) {
  const n = a.nome || "";
  return /bazuca|lança-chamas|metralhadora$/i.test(n)
    ? WI.pesada
    : /pistola|revólver|fuzil|metralhadora|espingarda|sinalizadora/i.test(n)
      ? WI.fogo
      : /arco|besta|balestra/i.test(n)
        ? WI.arco
        : /desarmado|soqueira|coronhada/i.test(n)
          ? WI.punho
          : /bastão|martelo|maça|marreta|cajado|nunchaku|corrente/i.test(n)
            ? WI.impacto
            : WI.lamina;
}
function profOK(f, a) {
  const c = CLASSES[f.classe];
  if (!a.grupo || a.grupo === "—" || a.grupo === "simples") return true;
  if (a.grupo === "táticas")
    return (
      c.prof.includes("táticas") ||
      ((f.poderes || []).includes("Ninja Urbano") && !/Fogo/.test(a.emp || "")) ||
      ((f.poderes || []).includes("Balística Avançada") && /Fogo/.test(a.emp || ""))
    );
  if (a.grupo === "pesadas") return (f.poderes || []).includes("Armamento Pesado");
  return true;
}
function tabCombate(f, D, c) {
  return `<div class="box stack"><div class="row between"><h3>Ataques</h3><div class="row" style="flex-wrap:nowrap"><select id="addArmaSel" style="width:auto;max-width:180px">${allArmas()
    .map((a, i) => `<option value="${i}">${esc(a.nome)} · ${a.dano}${a.hb ? " (homebrew)" : ""}</option>`)
    .join("")}</select><button type="button" class="btn sm" id="btnAddArma">Adicionar</button></div></div>
   ${
     f.classe === "Combatente" && D.atq
       ? `<label class="check"><input type="checkbox" id="usarPoderAtk"> Ataque Especial (${D.atq[1]} PE: +${D.atq[2]} a dividir entre ataque e dano)</label>
     <div class="row" id="atqSplit"><span class="muted small">No ataque</span><input type="number" id="atqNoTeste" value="${D.atq[2]}" min="0" max="${D.atq[2]}" step="5" style="width:70px" aria-label="Bônus no teste de ataque"><span class="muted small">o resto vai para o dano</span></div>`
       : ""
   }
   <div class="cards">${
     (f.armas || [])
       .map((a, i) => {
         const open = S.openArma === i;
         const ok = profOK(f, a);
         return `<div class="wcard ${open ? "open" : ""}"><div class="wh"><span class="wi">${weaponIcon(a)}</span><button type="button" class="wn" data-wtog="${i}" aria-expanded="${open}">${esc(a.nome)}</button><button type="button" class="rollbtn" data-atk="${i}">Atacar</button><button type="button" class="chev" data-wtog="${i}" aria-label="${open ? "Fechar" : "Editar"} ${esc(a.nome)}">${open ? "▴" : "▾"}</button></div>
     <div class="wst"><span>DANO <b>${esc(a.dano)}</b></span><span>CRÍTICO <b>${esc(a.crit)}</b></span>${a.alc && a.alc !== "—" ? `<span>ALCANCE <b>${esc(a.alc)}</b></span>` : ""}${a.tipo ? `<span>TIPO <b>${esc(a.tipo)}</b></span>` : ""}<span>CATEGORIA <b>${esc(a.cat ?? "0")}</b></span><span>ESPAÇO <b>${a.esp ?? 1}</b></span><span>${esc(a.pericia)}${+a.bonus ? ` <b>${sgn(+a.bonus).trim()}</b>` : ""}</span>${(a.mods || []).length ? `<span>MODS <b>${esc(a.mods.join(", "))}</b></span>` : ""}${!ok ? `<span style="color:var(--red-hi)">SEM PROFICIÊNCIA −2d20</span>` : ""}</div>
     ${
       open
         ? `<div class="fields" style="margin-top:8px;grid-template-columns:repeat(auto-fit,minmax(96px,1fr))">
      <div class="field"><label class="label">Nome</label><input type="text" data-arma="${i}" data-k="nome" value="${esc(a.nome)}"></div>
      <div class="field"><label class="label">Perícia</label><select data-arma="${i}" data-k="pericia">${["Luta", "Pontaria"].map(p => `<option ${a.pericia === p ? "selected" : ""}>${p}</option>`).join("")}</select></div>
      <div class="field"><label class="label">Dano</label><input type="text" data-arma="${i}" data-k="dano" value="${esc(a.dano)}"></div>
      <div class="field"><label class="label">Crítico</label><input type="text" data-arma="${i}" data-k="crit" value="${esc(a.crit)}" placeholder="19/x3"></div>
      <div class="field"><label class="label">Bônus ataque</label><input type="number" data-arma="${i}" data-k="bonus" value="${a.bonus || 0}"></div>
      <div class="field"><label class="label">Bônus dano</label><input type="number" data-arma="${i}" data-k="bdano" value="${a.bdano || 0}"></div>
      <div class="field"><label class="label">Categoria</label><input type="text" data-arma="${i}" data-k="cat" value="${esc(a.cat ?? "0")}"></div>
      <div class="field"><label class="label">Espaço</label><input type="number" data-arma="${i}" data-k="esp" value="${a.esp ?? 1}"></div>
      <label class="check"><input type="checkbox" data-armaagil="${i}" ${a.agil ? "checked" : ""}> Arma ágil</label>
      <div class="field" style="grid-column:1/-1"><label class="label">Modificações e maldições</label><div class="row" style="flex-wrap:nowrap"><select data-modsel="${i}">${MODIFICACOES.filter(
        m => /corpo|fogo|munição/.test(m[1])
      )
        .map(m => `<option value="${esc(m[0])}">${esc(m[0])} · ${esc(m[2])}</option>`)
        .join("")}${Object.entries(MALDICOES.arma)
        .map(([el, ns]) =>
          ns.map(n => `<option value="${esc(n)}">Maldição: ${esc(n)} (${el})</option>`).join("")
        )
        .join("")}</select><button type="button" class="btn sm" data-modadd="${i}">+</button></div>
       ${(a.mods || []).length ? `<div class="conds" style="margin-top:6px">${a.mods.map((m, k) => `<button type="button" class="cond" aria-pressed="true" data-modrm="${i}:${k}">${esc(m)} ✕</button>`).join("")}</div>` : ""}</div>
      <button type="button" class="btn sm danger" data-delarma="${i}">Remover arma</button></div>`
         : ""
     }</div>`;
       })
       .join("") || `<div class="empty">Nenhuma arma.</div>`
   }</div>
   <p class="muted small" style="margin:0">Luta usa FOR (armas ágeis podem usar AGI) e soma FOR no dano; Pontaria usa AGI. No crítico, os dados de dano são multiplicados. Cada modificação aumenta a categoria em I.</p>
  </div>
  <div class="box stack"><div class="row between"><h3>Proteções</h3><div class="row" style="flex-wrap:nowrap"><select id="protSel" style="width:auto">${PROTECOES.map((p, i) => `<option value="${i}">${p[0]} · +${p[3]} Def</option>`).join("")}</select><button type="button" class="btn sm" id="protAdd">Adicionar</button></div></div>
   ${
     (f.protecoes || []).length
       ? `<div class="cards">${f.protecoes
           .map(
             (
               p,
               i
             ) => `<div class="condrow" style="border-left-color:var(--purple)"><input type="checkbox" data-protuse="${i}" ${p.usando !== false ? "checked" : ""} aria-label="Vestindo ${esc(p.nome)}"><div style="min-width:0"><b>${esc(p.nome)}</b><div class="muted small">+${p.def} Defesa${p.rd ? ` · RD ${p.rd}` : ""} · categoria ${esc(p.cat)} · ${p.esp} espaços${(p.mods || []).length ? " · " + esc(p.mods.join(", ")) : ""}</div>
     <div class="row" style="flex-wrap:nowrap;margin-top:4px"><select data-pmodsel="${i}" style="font-size:12px">${MODIFICACOES.filter(
       m => m[1] === "proteção"
     )
       .map(m => `<option value="${esc(m[0])}">${esc(m[0])}</option>`)
       .join("")}${Object.entries(MALDICOES["proteção"])
       .map(([el, ns]) =>
         ns.map(n => `<option value="${esc(n)}">Maldição: ${esc(n)} (${el})</option>`).join("")
       )
       .join(
         ""
       )}</select><button type="button" class="btn sm" data-pmodadd="${i}">+</button></div></div><button type="button" class="x" data-protrm="${i}" aria-label="Remover ${esc(p.nome)}">✕</button></div>`
           )
           .join("")}</div>`
       : `<div class="muted small">Sem proteção. ${CLASSES[f.classe].prof.includes("leves") ? "Você tem proficiência em proteções leves." : "Sem proficiência: −2d20 em testes de FOR e AGI."}</div>`
   }
  </div>`;
}
function tabRituais(f, D) {
  const rits = allRituais();
  const known = rits.filter(r => (f.rituais || []).includes(r.n));
  const avail = rits
    .filter(r => !(f.rituais || []).includes(r.n))
    .filter(r => !S.ritFiltro || String(r.el).split(" e ").includes(S.ritFiltro));
  const ocult = f.classe === "Ocultista";
  return `<div class="box stack"><div class="row between"><h3>Rituais</h3><span class="muted small">DT ${D.dtRit} · ${D.circ ? `até ${D.circ}º círculo` : "sem acesso a rituais"}</span></div>
   ${!ocult ? `<p class="muted small" style="margin:0">Sem ser ocultista, você aprende rituais com o poder paranormal Aprender Ritual (via Transcender).</p>` : ""}
   <label class="check"><input type="checkbox" id="semComp"> Sem componentes ritualísticos (não dá para conjurar, exceto Medo)</label>
   ${
     known.length
       ? `<div class="cards">${known
           .map(
             r => `<div class="rcard el-${esc(String(r.el).split(" e ")[0])}"><div class="rh"><span class="rsig">${SIGILO[String(r.el).split(" e ")[0]] || SIGILO.Medo}</span><div style="min-width:0;flex:1"><div class="rt"><span class="rc">${ROMAN[r.c]}</span> ${esc(r.n)}</div>
     <div class="rdsc">${esc(r.el)}${r.ex ? ` · ${esc(r.ex)}` : ""}${r.al ? ` · ${esc(r.al)}` : ""}${r.alvo ? ` · ${esc(r.alvo)}` : ""}${r.du ? ` · ${esc(r.du)}` : ""}${r.res ? ` · ${esc(r.res)}` : ""}${r.hb ? " · homebrew" : ""}</div>${r.desc ? `<div class="rdsc">${esc(r.desc)}</div>` : ""}</div><button type="button" class="x" data-unrit="${esc(r.n)}" aria-label="Esquecer ${esc(r.n)}">✕</button></div>
     <div class="rforms">${r.formas.map((fm, k) => `<button type="button" class="rform" data-conj="${esc(r.n)}" data-forma="${k}" title="${esc(fm.req ? "Requer " + fm.req : "")}"><b>${esc(fm.dado || "—")}</b><span>${fm.k} · ${fm.custo} PE</span></button>`).join("")}</div></div>`
           )
           .join("")}</div>`
       : `<div class="muted small">Nenhum ritual aprendido.</div>`
   }
   <div class="sub">Aprender ritual</div>
   <div class="tabs2">${["", ...ELEMENTOS].map(e => `<button type="button" data-ritf="${e}" aria-pressed="${(S.ritFiltro || "") === e}">${e || "Todos"}</button>`).join("")}</div>
   <div class="row" style="flex-wrap:nowrap"><select id="ritSel">${[1, 2, 3, 4]
     .map(c => {
       const l = avail.filter(r => r.c === c);
       return l.length
         ? `<optgroup label="${c}º círculo · ${CUSTO_CIRCULO[c]} PE">${l.map(r => `<option value="${esc(r.n)}">${esc(r.n)} · ${esc(r.el)}${r.hb ? " (homebrew)" : ""}${fonteTag(r.n)}</option>`).join("")}</optgroup>`
         : "";
     })
     .join("")}</select><button type="button" class="btn sm" id="ritAdd">Aprender</button></div>
   <p class="muted small" style="margin:0">Custo por círculo: 1º 1 PE, 2º 3 PE, 3º 6 PE, 4º 10 PE; Discente e Verdadeiro somam o custo extra e pedem o círculo indicado. Os textos completos dos rituais estão no livro.</p>
  </div>`;
}
function tabHabilidades(f, D, c) {
  const nex = +f.nex || 5;
  const progs = Object.entries(c.prog).filter(([n]) => +n <= nex);
  const tr = f.trilha && c.trilhas[f.trilha];
  const pod = f.poderes || [];
  const par = f.paranormais || [];
  const habs = hbOf("habilidade");
  return `<div class="box stack"><h3>Classe: ${esc(f.classe)}</h3>
    <div class="cards">${progs.map(([n, h]) => `<div class="condrow" style="border-left-color:var(--purple)"><span class="tag on">${n}%</span><div class="small">${esc(h)}</div><span></span></div>`).join("")}</div>
    ${f.classe === "Combatente" && D.atq ? `<p class="muted small" style="margin:0">Ataque Especial agora: ${D.atq[1]} PE, +${D.atq[2]}.</p>` : ""}
    ${f.classe === "Especialista" && D.perito ? `<p class="muted small" style="margin:0">Perito agora: ${D.perito[1]} PE, +${D.perito[2]}.</p>` : ""}
    ${f.classe === "Ocultista" ? `<p class="muted small" style="margin:0">Escolhido pelo Outro Lado: rituais até o ${D.circ}º círculo.</p>` : ""}
   </div>
   <div class="box stack"><h3>Trilha${f.trilha ? ": " + esc(f.trilha) : ""}</h3>
    ${tr ? `<div class="cards">${tr.map((h, i) => `<div class="condrow" style="border-left-color:${nex >= TRILHA_NEX[i] ? "var(--purple)" : "var(--line)"}"><span class="tag ${nex >= TRILHA_NEX[i] ? "on" : ""}">${TRILHA_NEX[i]}%</span><div><b>${esc(h)}</b>${nex < TRILHA_NEX[i] ? `<div class="muted small">Libera em NEX ${TRILHA_NEX[i]}%</div>` : ""}</div><span></span></div>`).join("")}</div>` : `<div class="muted small">Escolha a trilha na aba Principal (a partir de NEX 10%).</div>`}
   </div>
   <div class="box stack"><div class="row between"><h3>Poderes de ${esc(f.classe.toLowerCase())}</h3><div class="row" style="flex-wrap:nowrap"><select id="podSel" style="width:auto;max-width:180px">${c.poderes
     .filter(p => p === "Transcender" || p === "Treinamento em Perícia" || !pod.includes(p))
     .map(
       p =>
         `<option value="${esc(p)}">${esc(p)}${PODERES_GERAIS.some(g => g[0] === p) && !FONTE_CLASSE[p] ? " (geral)" : ""}${fonteTag(p)}</option>`
     )
     .join("")}</select><button type="button" class="btn sm" id="podAdd">+</button></div></div>
    ${pod.length ? `<div class="conds">${pod.map((p, i) => `<button type="button" class="cond" aria-pressed="true" data-podrm="${i}">${esc(p)} ✕</button>`).join("")}</div>` : `<div class="muted small">Nenhum poder escolhido. Você recebe um em NEX 15% e a cada 15% depois.</div>`}
   </div>
   <div class="box stack"><div class="row between"><h3>Poderes paranormais</h3><div class="row" style="flex-wrap:nowrap"><select id="parSel" style="width:auto;max-width:180px">${PODERES_PARANORMAIS.map(([n, e]) => `<option value="${esc(n)}">${esc(n)}${e !== "—" ? " · " + e : ""}${fonteTag(n)}</option>`).join("")}</select><button type="button" class="btn sm" id="parAdd">+</button></div></div>
    ${par.length ? `<div class="conds">${par.map((p, i) => `<button type="button" class="cond" aria-pressed="true" data-parrm="${i}">${esc(p)} ✕</button>`).join("")}</div>` : `<div class="muted small">Recebidos com o poder Transcender (sem ganhar Sanidade naquele aumento de NEX).</div>`}
    ${
      +f.nex >= 50
        ? `<div class="field"><label class="label" for="s_afinidade">Afinidade (NEX 50%)</label><select id="s_afinidade" data-f="afinidade"><option value="">Nenhuma</option>${ELEMENTOS.filter(
            e => e !== "Medo"
          )
            .map(e => `<option ${f.afinidade === e ? "selected" : ""}>${e}</option>`)
            .join("")}</select></div>`
        : ""
    }
   </div>
   <div class="box stack"><h3>Origem: ${esc(ORIGENS[f.origem][1])}</h3><p class="muted small" style="margin:0">Poder da origem ${esc(f.origem)}. ${f.origem === "Desgarrado" ? "Já somado: +1 PV por 5% de NEX." : f.origem === "Vítima" ? "Já somado: +1 SAN por 5% de NEX." : f.origem === "Universitário" ? "Já somado: +1 PE e +1 a cada NEX ímpar." : f.origem === "Policial" ? "Já somado: +2 na Defesa." : ""}</p></div>
   ${
     habs.length
       ? `<div class="box stack"><h3>Habilidades da mesa (homebrew)</h3><div class="stack" style="gap:6px">${habs
           .map(h => {
             const has = (f.hab || []).includes(h.nome);
             return `<div class="ritual el-${esc(h.el || "Medo")}"><input type="checkbox" data-hab="${esc(h.nome)}" ${has ? "checked" : ""} aria-label="Tem ${esc(h.nome)}"><div><div class="rn">${esc(h.nome)}${+h.custo ? ` <span class="tag">${+h.custo} PE</span>` : ""}</div><div class="rd">${esc(h.desc || "")}</div></div><button type="button" class="rollbtn" data-usehab="${esc(h.id)}" ${has ? "" : "disabled"}>Usar</button></div>`;
           })
           .join("")}</div></div>`
       : ""
   }`;
}
function tabInventario(f, D) {
  const lim = D.pat;
  const cats = ["I", "II", "III", "IV"];
  const opts = [
    ...ITENS_GERAIS.map(i => ({ n: i[0], g: i[1], cat: i[2], esp: i[3] })),
    ...MUNICOES.map(m => ({ n: m[0], g: "Munição", cat: m[1], esp: m[2] })),
    ...AMALDICOADOS.map(([n, e, c, sp]) => ({
      n,
      g: "Itens amaldiçoados (" + e + ")",
      cat: c || "II",
      esp: sp ?? 1
    })),
    ...hbOf("item").map(h => ({ n: h.nome, g: "Homebrew", cat: h.cat || "0", esp: +h.esp || 1 }))
  ];
  const grupos = [...new Set(opts.map(o => o.g))];
  return `<div class="box stack"><div class="row between" style="flex-wrap:wrap;gap:8px"><label class="row" style="gap:8px;flex-wrap:nowrap"><h3 style="margin:0">Patente</h3><select id="s_pat2" data-patsel ${canEditFicha(f) ? "" : "disabled"}>${PATENTES.map((p, i) => `<option value="${i}" ${patenteDe(f.pp) === p ? "selected" : ""}>${esc(p[1])}</option>`).join("")}</select></label><span class="muted small">${+f.pp || 0} PP · crédito ${esc(lim[2])}</span></div>
    <div class="stats" style="grid-template-columns:repeat(4,minmax(0,1fr))">${cats
      .map((c, i) => {
        const max = lim[3 + i] + (+f["catx" + (i + 1)] || 0);
        const u = D.usoCat[i + 1];
        return `<div style="${u > max ? "border-color:var(--red)" : ""}"><b>${u}/${max}</b><span>Categoria ${c}</span></div>`;
      })
      .join("")}</div>
    <div class="muted small">Espaços: ${D.usados}/${D.carga} (dobro: ${D.carga * 2})${D.mochila ? " · Mochila militar +2" : ""}${+f.cargaExtra ? ` · extra ${+f.cargaExtra > 0 ? "+" : ""}${+f.cargaExtra}` : ""}. Categoria 0 é livre.</div>
    <details class="more"><summary>Aumentar espaços e itens por categoria</summary><div class="stack" style="margin-top:8px;gap:8px">
     <p class="muted small" style="margin:0">Pelas regras: mais <b>Força</b> dá mais espaço (5 por ponto), a <b>Mochila militar</b> dá +2 espaços (já conta sozinha), e subir de <b>patente</b> com pontos de prestígio libera mais itens por categoria. Use os campos abaixo para bônus que o mestre der (poder, homebrew, recompensa).</p>
     <div class="row" style="flex-wrap:wrap;gap:8px"><div class="field" style="width:120px"><label class="label" for="s_cx">Espaços extras</label><input type="number" id="s_cx" data-f="cargaExtra" value="${+f.cargaExtra || 0}" min="-20" max="50"></div>
      ${cats.map((c, i) => `<div class="field" style="width:96px"><label class="label" for="s_catx${i + 1}">Extra cat. ${c}</label><input type="number" id="s_catx${i + 1}" data-f="catx${i + 1}" value="${+f["catx" + (i + 1)] || 0}" min="-5" max="20"></div>`).join("")}</div></div></details>
    <details class="more"><summary>Pontos de prestígio por missão</summary><div class="row" style="margin-top:8px">${PP_EVENTOS.map(([n, v], i) => `<button type="button" class="btn sm" data-ppev="${i}">${esc(n)} ${v > 0 ? "+" : ""}${v}</button>`).join("")}</div></details>
   </div>
   <div class="box stack"><div class="row between"><h3>Itens</h3></div>
    <div class="row" style="flex-wrap:nowrap"><select id="itemSel">${grupos.map(g => `<optgroup label="${esc(g)}">${opts.map((o, i) => (o.g === g ? `<option value="${i}">${esc(o.n)} · cat. ${o.cat} · ${o.esp} esp.</option>` : "")).join("")}</optgroup>`).join("")}</select><button type="button" class="btn sm" id="itemAdd">Adicionar</button><button type="button" class="btn sm ghost" id="itemCriar" style="white-space:nowrap">Criar item</button></div>
    ${
      (f.itens || []).length
        ? `<div class="cards">${f.itens
            .map(
              (
                it,
                i
              ) => `<div class="condrow" style="border-left-color:var(--warn)"><span class="tag">${esc(it.cat)}</span><div style="min-width:0"><b>${esc(it.nome)}</b><div class="muted small">${esc(it.grupo || "")} · ${it.esp} espaço(s)${it.nota ? " · " + esc(it.nota) : ""}${(it.mods || []).length ? " · " + esc(it.mods.join(", ")) : ""}</div>
      ${
        it.grupo === "Acessórios"
          ? `<div class="row" style="flex-wrap:nowrap;margin-top:4px"><select data-imodsel="${i}" style="font-size:12px">${MODIFICACOES.filter(
              m => m[1] === "acessório"
            )
              .map(m => `<option value="${esc(m[0])}">${esc(m[0])}</option>`)
              .join("")}${Object.entries(MALDICOES["acessório"])
              .map(([el, ns]) =>
                ns.map(n => `<option value="${esc(n)}">Maldição: ${esc(n)} (${el})</option>`).join("")
              )
              .join("")}</select><button type="button" class="btn sm" data-imodadd="${i}">+</button></div>`
          : ""
      }</div>
      <div class="row" style="flex-direction:column;gap:2px"><input type="number" data-iqtd="${i}" value="${+it.qtd || 1}" min="1" style="width:54px" aria-label="Quantidade"><span class="row" style="gap:2px;flex-wrap:nowrap"><button type="button" class="x" data-itemed="${i}" aria-label="Editar ${esc(it.nome)}" title="Editar">✎</button><button type="button" class="x" data-itemrm="${i}" aria-label="Remover ${esc(it.nome)}">✕</button></span></div></div>`
            )
            .join("")}</div>`
        : `<div class="muted small">Nenhum item.</div>`
    }
    <div class="field"><label class="label" for="s_inventario">Anotações do inventário</label><textarea id="s_inventario" data-f="inventario" placeholder="Munição usada, cargas, detalhes…">${esc(f.inventario || "")}</textarea></div>
   </div>`;
}
function tabHistoria(f) {
  return `<div class="box stack"><h3>História</h3>
   <div class="field"><label class="label" for="s_aparencia">Aparência</label><textarea id="s_aparencia" data-f="aparencia" style="min-height:90px" placeholder="Nome, gênero, idade, descrição física…">${esc(f.aparencia || "")}</textarea></div>
   <div class="field"><label class="label" for="s_personalidade">Personalidade</label><textarea id="s_personalidade" data-f="personalidade" style="min-height:90px" placeholder="Traços marcantes, opiniões, ideais…">${esc(f.personalidade || "")}</textarea></div>
   <div class="field"><label class="label" for="s_historico">Histórico</label><textarea id="s_historico" data-f="historico" style="min-height:110px" placeholder="Infância, relação com a família, contato com o Paranormal, eventos bons e ruins…">${esc(f.historico || "")}</textarea></div>
   <div class="field"><label class="label" for="s_objetivo">Objetivo</label><textarea id="s_objetivo" data-f="objetivo" style="min-height:80px" placeholder="Por que ele faz parte da Ordem? Por que luta contra o Outro Lado?">${esc(f.objetivo || "")}</textarea></div>
   <div class="field"><label class="label" for="s_notas">Anotações (pistas, vínculos, lembretes)</label><textarea id="s_notas" data-f="notas" style="min-height:110px" placeholder="O que o agente descobriu nas missões, pessoas que conhece…">${esc(f.notas || "")}</textarea></div>
   <div class="row between"><span class="row"><button type="button" class="btn sm" id="btnTokFicha">Criar token deste agente</button><button type="button" class="btn sm" id="btnBaixar">Baixar ficha (backup)</button></span><button type="button" class="btn sm danger" id="btnDelFicha">Apagar ficha</button></div></div>`;
}

/* ---------- rolagens da ficha ---------- */
function testePericia(p) {
  const f = fA();
  const a = PERICIAS.find(x => x[0] === p)[1];
  let mod = modPericia(f, p);
  let extra = "";
  const pc = $("#usarPerito");
  const D = derivados(f);
  if (pc && pc.checked) {
    if (!grau(f, p)) {
      toast("Perito só funciona em perícia treinada.");
      return;
    }
    if (cur(f, "pe") < D.perito[1]) {
      toast("PE insuficiente para Perito.");
      return;
    }
    f.pe = cur(f, "pe") - D.perito[1];
    const r = rollExpr(D.perito[2]);
    mod += r.total;
    extra = ` · Perito ${r.detail} (−${D.perito[1]} PE)`;
    saveFicha(S.openFicha, true);
  }
  const pen = penalidade(f, { tipo: "pericia", attr: a, nome: p });
  mod += pen.mod;
  const r = rollTest(f.attr[a], mod, pen.dados);
  logEntry({
    quem: f.nome,
    titulo: p,
    total: r.total,
    det: `${r.dice.length}d20[${r.dice.join(",")}] fica ${r.mode} ${r.kept}${sgn(mod)}${extra}${pen.quem.length ? ` · condições: ${pen.quem.join(", ")}` : ""}`,
    flag: r.kept === 20 ? "crit" : r.kept === 1 ? "fail" : "",
    para: S.paraRolagem || ""
  });
  if (pc && pc.checked) renderPanel();
}
function atacar(i) {
  const f = fA();
  const w = f.armas[i];
  if (!w) return;
  const D = derivados(f);
  const corpo = w.pericia === "Luta";
  const attrK = corpo ? (w.agil && f.attr.AGI > f.attr.FOR ? "AGI" : "FOR") : "AGI";
  let mod = modPericia(f, w.pericia) + (+w.bonus || 0);
  let dmgB = (corpo ? f.attr[attrK === "AGI" ? "AGI" : "FOR"] : 0) + (+w.bdano || 0);
  const notes = [];
  let pen = 0;
  if (!profOK(f, w)) {
    pen += 2;
    notes.push("sem proficiência −2d20");
  }
  if (/motosserra/i.test(w.nome)) pen += 1;
  let { marg, mult } = parseCrit(w.crit);
  let extraDice = 0;
  let extraDmg = "";
  (w.mods || []).forEach(m => {
    const md = (MODIFICACOES.find(x => x[0] === m) || [])[3] || {};
    mod += md.atk || 0;
    dmgB += md.dmg || 0;
    marg -= md.marg || 0;
    mult += md.mult || 0;
    extraDice += md.dado || 0;
    if (md.extra) extraDmg = md.extra;
  });
  if (f.origem === "Lutador" && corpo) dmgB += 2;
  if (f.origem === "Militar" && /Fogo/.test(w.emp || w.nome)) dmgB += 2;
  const esp = $("#usarPoderAtk");
  const useEsp = esp && esp.checked && D.atq;
  if (useEsp) {
    if (cur(f, "pe") < D.atq[1]) {
      toast("PE insuficiente para Ataque Especial.");
      return;
    }
    f.pe = cur(f, "pe") - D.atq[1];
    const noTeste = Math.max(0, Math.min(D.atq[2], +($("#atqNoTeste") || {}).value || 0));
    mod += noTeste;
    dmgB += D.atq[2] - noTeste;
    notes.push(`Ataque Especial −${D.atq[1]} PE`);
  }
  const pc = penalidade(f, { tipo: "ataque", attr: attrK, nome: w.pericia, cac: corpo });
  mod += pc.mod;
  if (pc.quem.length) notes.push(`condições: ${pc.quem.join(", ")}`);
  const r = rollTest(f.attr[attrK], mod, pen + pc.dados);
  const crit = r.kept >= marg;
  const dano = String(w.dano).split("/")[0];
  const dm = rollExpr(dano, { critMult: crit ? mult : 1, explode6: false, extraDice });
  if (!dm) {
    toast("Dano inválido. Use algo como 2d6+2.");
    return;
  }
  let tot = dm.total + dmgB;
  let exTxt = "";
  if (extraDmg) {
    const e = rollExpr(extraDmg);
    tot += e.total;
    exTxt = " + " + e.detail;
  }
  logEntry({
    quem: f.nome,
    titulo: `${w.nome} · dano ${tot}`,
    total: r.total,
    flag: crit ? "crit" : r.kept === 1 ? "fail" : "",
    para: S.paraRolagem || "",
    det: `${w.pericia} ${r.dice.length}d20[${r.dice.join(",")}] ${r.kept}${sgn(mod)}${crit ? ` · CRÍTICO ×${mult}` : ""} → dano ${dm.detail}${sgn(dmgB)}${exTxt}${notes.length ? " · " + notes.join(", ") : ""}`
  });
  if (useEsp) {
    saveFicha(S.openFicha, true);
    renderPanel();
  }
}
function conjurar(n, k = 0) {
  const f = fA();
  const r = allRituais().find(x => x.n === n);
  if (!r) return;
  const D = derivados(f);
  const fm = r.formas[k] || r.formas[0];
  if (r.c > D.circ && !r.hb) {
    toast(`Você ainda não conjura rituais de ${r.c}º círculo.`);
    return;
  }
  if ($("#semComp") && $("#semComp").checked && r.el !== "Medo") {
    toast("Sem componentes ritualísticos não dá para conjurar este ritual.");
    return;
  }
  let custo = fm.custo;
  if ((f.cond || []).includes("Alquebrado")) custo += 1;
  if (cur(f, "pe") < custo) {
    toast("PE insuficiente para conjurar.");
    return;
  }
  f.pe = cur(f, "pe") - custo;
  let total = null,
    det = `${r.el} · ${fm.k} · −${custo} PE${fm.req ? " · requer " + fm.req : ""}`;
  if (fm.dado && parseExpr(fm.dado.replace(/^\+/, ""))) {
    const roll = rollExpr(fm.dado.replace(/^\+/, ""));
    total = roll.total;
    det = `${roll.detail} · ${det}`;
    if (r.tipo === "cura") {
      f.pv = Math.min(D.pvMax, cur(f, "pv") + total);
      det += " · cura aplicada";
    } else if (r.res) det += ` · ${r.res} DT ${D.dtRit}`;
  } else if (r.res) det += ` · ${r.res} DT ${D.dtRit}`;
  logEntry({
    quem: f.nome,
    titulo: `Ritual · ${r.n}${k ? ` (${fm.k})` : ""}`,
    total,
    det,
    para: S.paraRolagem || ""
  });
  saveFicha(S.openFicha, true);
  renderPanel();
}

/* ---------- ficha: eventos ---------- */
function bindSheet() {
  $$("[data-back]").forEach(
    b =>
      (b.onclick = () => {
        S.openFicha = null;
        renderPanel();
      })
  );
  $$("[data-stab]").forEach(
    b =>
      (b.onclick = () => {
        S.sheetTab = b.dataset.stab;
        renderPanel();
        $("#pbody").scrollTop = 0;
      })
  );
  const id = S.openFicha;
  const f = fA();
  if (!f) return;
  $$("[data-roll]").forEach(b => (b.onclick = () => testePericia(b.dataset.roll)));
  $$("[data-atk]").forEach(b => (b.onclick = () => atacar(+b.dataset.atk)));
  $$("[data-conj]").forEach(b => (b.onclick = () => conjurar(b.dataset.conj, +b.dataset.forma || 0)));
  $$("[data-wtog]").forEach(
    b =>
      (b.onclick = () => {
        const i = +b.dataset.wtog;
        S.openArma = S.openArma === i ? null : i;
        renderPanel();
      })
  );
  $$("[data-ritf]").forEach(
    b =>
      (b.onclick = () => {
        S.ritFiltro = b.dataset.ritf;
        renderPanel();
      })
  );
  const bc = $("#btnClaim");
  if (bc)
    bc.onclick = async () => {
      const r = await formBox(
        "Pedir a ficha " + f.nome,
        `<div class="field"><label class="label" for="clQuem">Seu nome (para o mestre saber quem é)</label><input type="text" id="clQuem" name="quem" maxlength="40" value="${esc(f.jogador || "")}" required></div>`,
        "Enviar pedido"
      );
      if (!r) return;
      try {
        await S.db.set(P() + "/pedidos/" + S.uid, {
          fichaId: id,
          nome: f.nome,
          quem: r.quem.trim(),
          ts: Date.now()
        });
        toast("Pedido enviado ao mestre.");
      } catch (e) {
        fail(e);
      }
    };
  $$("[data-aprova]").forEach(
    b =>
      (b.onclick = async () => {
        const uid = b.dataset.aprova;
        const pd = (S.pedidos || []).find(x => x.id === uid);
        if (!pd) return;
        if (
          !(await confirmBox(
            "Dar a ficha para " + (pd.quem || "este jogador") + "?",
            "A ficha passa a ser dele. Quem era o dono antes perde a edição.",
            "Dar a ficha"
          ))
        )
          return;
        try {
          f.dono = uid;
          await S.db.merge(P() + "/fichas/" + id, { dono: uid });
          await S.db.del(P() + "/pedidos/" + uid);
          (S.tokens || [])
            .filter(t => t.fichaId === id)
            .forEach(t => S.db.merge(P() + "/tokens/" + t.id, { dono: uid }).catch(() => {}));
          toast("Ficha transferida.");
        } catch (e) {
          fail(e);
        }
      })
  );
  $$("[data-recusa]").forEach(
    b => (b.onclick = () => S.db.del(P() + "/pedidos/" + b.dataset.recusa).catch(fail))
  );
  if (!canEditFicha(f)) return;
  const sv = now => {
    saveFicha(id, now);
  };
  const rr = () => {
    renderPanel();
  };
  $$("#pbody [data-f]").forEach(el => {
    const k = el.dataset.f;
    const num = el.type === "number" || k === "nex";
    if (el.tagName === "SELECT" || num)
      el.onchange = () => {
        f[k] = num ? +el.value || 0 : el.value;
        if (k === "classe") f.trilha = "";
        sv();
        rr();
        renderBoard();
      };
    else
      el.oninput = () => {
        f[k] = el.value;
        sv();
      };
  });
  $$("#pbody [data-patsel]").forEach(
    el =>
      (el.onchange = () => {
        const p = PATENTES[+el.value];
        if (!p) return;
        f.pp = p[0];
        sv();
        rr();
        toast(`Patente ${p[1]}: os pontos de prestígio foram para ${p[0]}.`);
      })
  );
  const on = (sel, fn, ev = "onclick") => {
    const e = $(sel);
    if (e) e[ev] = fn;
  };
  on("#foto", async () => {
    const file = await pickImage();
    if (!file) return;
    const url = await cropImage(file, {
      size: 300,
      ratio: 4 / 3,
      radius: 0.06,
      type: "image/jpeg",
      title: "Ajustar a arte do agente"
    });
    if (!url) return;
    f.foto = url;
    sv(true);
    rr();
    renderBoard();
  });
  $$("[data-attr]").forEach(
    b =>
      (b.onclick = () => {
        const k = b.dataset.attr;
        f.attr[k] = Math.max(0, Math.min(5, f.attr[k] + +b.dataset.d));
        sv();
        rr();
      })
  );
  $$("[data-res]").forEach(
    b =>
      (b.onclick = () => {
        const k = b.dataset.res;
        const max = derivados(f)[k + "Max"];
        f[k] = Math.max(k === "pv" ? -max : 0, Math.min(max, cur(f, k) + +b.dataset.d));
        if (k === "pv" && f.pv > 0) f.morrendo = 0;
        sv();
        rr();
        renderBoard();
      })
  );
  on("#mrMais", () => {
    f.morrendo = (+f.morrendo || 0) + 1;
    sv(true);
    rr();
    if (f.morrendo >= 4)
      logEntry({ quem: f.nome, titulo: "chegou ao fim da contagem de Morrendo", tipo: "chat" });
  });
  on("#mrZera", () => {
    f.morrendo = 0;
    sv(true);
    rr();
  });
  on("#btnBaixar", () => exportarFicha(id));
  {
    const nv = $("#npcVis");
    if (nv)
      nv.onchange = () => {
        f.visivel = nv.checked;
        sv(true);
        toast(nv.checked ? "Os jogadores agora veem esta ficha." : "Ficha escondida dos jogadores.");
      };
  }
  $$("[data-perg]").forEach(
    s =>
      (s.onchange = () => {
        const p = s.dataset.perg;
        f.per[p] = f.per[p] || { g: 0, b: 0 };
        f.per[p].g = +s.value;
        sv();
        rr();
      })
  );
  $$("[data-perb]").forEach(
    c =>
      (c.onchange = () => {
        const p = c.dataset.perb;
        f.per[p] = f.per[p] || { g: 0, b: 0 };
        f.per[p].b = +c.value || 0;
        sv();
        rr();
      })
  );
  on("#condAdd", async () => {
    let c = $("#condSel").value;
    if (c === "__outra") {
      const r = await formBox(
        "Nova condição ou efeito",
        `<div class="field"><label class="label" for="cnd">Nome</label><input type="text" id="cnd" name="c" maxlength="40" required></div>`,
        "Adicionar"
      );
      if (!r) return;
      c = r.c.trim();
    }
    if (!c) return;
    f.cond = [...new Set([...(f.cond || []), c])];
    sv(true);
    rr();
    renderBoard();
  });
  $$("[data-uncond]").forEach(
    b =>
      (b.onclick = () => {
        f.cond.splice(+b.dataset.uncond, 1);
        sv(true);
        rr();
      })
  );
  const mult = () => DESCANSO[+($("#descSel") || {}).value || 1][1];
  on("#itDormir", () => {
    const D = derivados(f);
    const g = Math.floor(D.limPE * mult());
    f.pv = Math.min(D.pvMax, cur(f, "pv") + g);
    f.pe = Math.min(D.peMax, cur(f, "pe") + g);
    sv(true);
    rr();
    logEntry({
      quem: f.nome,
      titulo: "Interlúdio: dormir",
      total: g,
      det: `+${g} PV e +${g} PE (${DESCANSO[+$("#descSel").value][0].toLowerCase()})`
    });
  });
  on("#itRelaxar", () => {
    const D = derivados(f);
    const g = Math.floor(D.limPE * mult());
    f.san = Math.min(D.sanMax, cur(f, "san") + g);
    sv(true);
    rr();
    logEntry({ quem: f.nome, titulo: "Interlúdio: relaxar", total: g, det: `+${g} Sanidade` });
  });
  on("#itPE", () => {
    f.pe = derivados(f).peMax;
    sv(true);
    rr();
  });
  on("#btnAplicar", () => {
    const c = CLASSES[f.classe];
    [...ORIGENS[f.origem][0], ...c.fixas].forEach(p => {
      f.per[p] = f.per[p] || { g: 0, b: 0 };
      if (!f.per[p].g) f.per[p].g = 5;
    });
    if (c.escolhaFixa.length) toast(`Escolha também: ${c.fixasTxt}.`);
    else toast("Perícias da origem e da classe marcadas.");
    sv();
    rr();
  });
  // combate
  $$("[data-arma]").forEach(
    el =>
      (el.onchange = () => {
        const i = +el.dataset.arma,
          k = el.dataset.k;
        f.armas[i][k] = el.type === "number" ? +el.value || 0 : el.value;
        sv();
        rr();
      })
  );
  $$("[data-armaagil]").forEach(
    c =>
      (c.onchange = () => {
        f.armas[+c.dataset.armaagil].agil = c.checked;
        sv();
      })
  );
  $$("[data-delarma]").forEach(
    b =>
      (b.onclick = () => {
        f.armas.splice(+b.dataset.delarma, 1);
        S.openArma = null;
        sv();
        rr();
      })
  );
  on("#btnAddArma", () => {
    const a = allArmas()[+$("#addArmaSel").value];
    f.armas = f.armas || [];
    f.armas.push({
      nome: a.nome,
      pericia: /Fogo|Disparo|distância/.test(a.emp) ? "Pontaria" : "Luta",
      dano: a.dano,
      crit: a.crit,
      alc: a.alc,
      tipo: a.tipo,
      cat: a.cat,
      esp: a.esp,
      agil: a.agil,
      grupo: a.grupo,
      emp: a.emp,
      bonus: 0,
      bdano: 0,
      mods: []
    });
    sv();
    rr();
  });
  $$("[data-modadd]").forEach(
    b =>
      (b.onclick = () => {
        const i = +b.dataset.modadd;
        const m = $(`[data-modsel="${i}"]`).value;
        const a = f.armas[i];
        a.mods = a.mods || [];
        if (a.mods.includes(m)) return;
        a.mods.push(m);
        a.cat = catPlus(a.cat, 1);
        const md = (MODIFICACOES.find(x => x[0] === m) || [])[3] || {};
        if (md.esp) a.esp = Math.max(0, (+a.esp || 0) + md.esp);
        sv();
        rr();
      })
  );
  $$("[data-modrm]").forEach(
    b =>
      (b.onclick = () => {
        const [i, k] = b.dataset.modrm.split(":").map(Number);
        const a = f.armas[i];
        const m = a.mods.splice(k, 1)[0];
        a.cat = catPlus(a.cat, -1);
        const md = (MODIFICACOES.find(x => x[0] === m) || [])[3] || {};
        if (md.esp) a.esp = Math.max(0, (+a.esp || 0) - md.esp);
        sv();
        rr();
      })
  );
  on("#protAdd", () => {
    const p = PROTECOES[+$("#protSel").value];
    f.protecoes = f.protecoes || [];
    f.protecoes.push({ nome: p[0], cat: p[1], esp: p[2], def: p[3], rd: p[4], usando: true, mods: [] });
    sv();
    rr();
  });
  $$("[data-protuse]").forEach(
    c =>
      (c.onchange = () => {
        f.protecoes[+c.dataset.protuse].usando = c.checked;
        sv();
        rr();
      })
  );
  $$("[data-protrm]").forEach(
    b =>
      (b.onclick = () => {
        f.protecoes.splice(+b.dataset.protrm, 1);
        sv();
        rr();
      })
  );
  $$("[data-pmodadd]").forEach(
    b =>
      (b.onclick = () => {
        const i = +b.dataset.pmodadd;
        const m = $(`[data-pmodsel="${i}"]`).value;
        const p = f.protecoes[i];
        p.mods = p.mods || [];
        if (p.mods.includes(m)) return;
        p.mods.push(m);
        p.cat = catPlus(p.cat, 1);
        const md = (MODIFICACOES.find(x => x[0] === m) || [])[3] || {};
        if (md.def) p.def += md.def;
        if (md.rd) p.rd = Math.max(+p.rd || 0, md.rd);
        if (md.esp) p.esp = Math.max(0, p.esp + md.esp);
        sv();
        rr();
      })
  );
  // rituais
  on("#ritAdd", () => {
    const v = $("#ritSel").value;
    if (!v) return;
    f.rituais = [...new Set([...(f.rituais || []), v])];
    sv();
    rr();
  });
  $$("[data-unrit]").forEach(
    b =>
      (b.onclick = () => {
        f.rituais = (f.rituais || []).filter(x => x !== b.dataset.unrit);
        sv();
        rr();
      })
  );
  // habilidades
  on("#podAdd", () => {
    f.poderes = [...(f.poderes || []), $("#podSel").value];
    sv();
    rr();
  });
  $$("[data-podrm]").forEach(
    b =>
      (b.onclick = () => {
        f.poderes.splice(+b.dataset.podrm, 1);
        sv();
        rr();
      })
  );
  on("#parAdd", () => {
    const v = $("#parSel").value;
    if ((f.paranormais || []).includes(v) && v !== "Aprender Ritual" && v !== "Resistir a <Elemento>") {
      toast("Esse poder já está na ficha (escolha de novo para ganhar a afinidade).");
    }
    f.paranormais = [...(f.paranormais || []), v];
    sv();
    rr();
  });
  $$("[data-parrm]").forEach(
    b =>
      (b.onclick = () => {
        f.paranormais.splice(+b.dataset.parrm, 1);
        sv();
        rr();
      })
  );
  $$("[data-hab]").forEach(
    c =>
      (c.onchange = () => {
        const n = c.dataset.hab;
        f.hab = f.hab || [];
        f.hab = c.checked ? [...new Set([...f.hab, n])] : f.hab.filter(x => x !== n);
        sv();
        rr();
      })
  );
  $$("[data-usehab]").forEach(
    b =>
      (b.onclick = () => {
        const h = S.homebrew.find(x => x.id === b.dataset.usehab);
        if (!h) return;
        const c = +h.custo || 0;
        if (c && cur(f, "pe") < c) {
          toast("PE insuficiente.");
          return;
        }
        if (c) f.pe = cur(f, "pe") - c;
        const r = h.dado ? rollExpr(h.dado) : null;
        logEntry({
          quem: f.nome,
          titulo: `Habilidade · ${h.nome}`,
          total: r ? r.total : null,
          det: `${r ? r.detail + " · " : ""}${c ? `−${c} PE · ` : ""}${h.desc || ""}`
        });
        sv(true);
        rr();
      })
  );
  // inventário
  on("#itemAdd", () => {
    const opts = [
      ...ITENS_GERAIS.map(i => ({ n: i[0], g: i[1], cat: i[2], esp: i[3] })),
      ...MUNICOES.map(m => ({ n: m[0], g: "Munição", cat: m[1], esp: m[2] })),
      ...AMALDICOADOS.map(([n, e, c, sp]) => ({
        n,
        g: "Itens amaldiçoados (" + e + ")",
        cat: c || "II",
        esp: sp ?? 1
      })),
      ...hbOf("item").map(h => ({ n: h.nome, g: "Homebrew", cat: h.cat || "0", esp: +h.esp || 1 }))
    ];
    const o = opts[+$("#itemSel").value];
    if (!o) return;
    f.itens = f.itens || [];
    if (o.g === "Itens operacionais" && o.n === "Mochila militar") {
    }
    f.itens.push({ nome: o.n, grupo: o.g, cat: o.cat, esp: o.esp, qtd: 1, mods: [] });
    sv();
    rr();
  });
  $$("[data-itemrm]").forEach(
    b =>
      (b.onclick = () => {
        f.itens.splice(+b.dataset.itemrm, 1);
        sv();
        rr();
      })
  );
  const itemForm = async (it, titulo, ok) => {
    const C = ["0", "I", "II", "III", "IV"];
    return formBox(
      titulo,
      `<div class="field"><label class="label" for="icN">Nome</label><input type="text" id="icN" name="nome" maxlength="60" required value="${esc(it.nome || "")}"></div>
     <div class="row" style="gap:8px;flex-wrap:wrap"><div class="field" style="width:110px"><label class="label" for="icC">Categoria</label><select id="icC" name="cat">${C.map(c => `<option value="${c}" ${String(it.cat ?? "0") === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
     <div class="field" style="width:100px"><label class="label" for="icE">Espaços</label><input type="number" id="icE" name="esp" min="0" max="20" step="0.5" value="${it.esp ?? 1}"></div>
     <div class="field" style="width:100px"><label class="label" for="icQ">Quantidade</label><input type="number" id="icQ" name="qtd" min="1" max="999" value="${+it.qtd || 1}"></div></div>
     <div class="field"><label class="label" for="icT">Descrição ou efeito (opcional)</label><textarea id="icT" name="nota" maxlength="400" placeholder="Ex.: dá +2 em Investigação; 3 usos; foto antiga do pai…">${esc(it.nota || "")}</textarea></div>
     <p class="muted small" style="margin:0">Categoria 0 não conta no limite da patente. Espaços contam na carga.</p>`,
      ok
    );
  };
  on("#itemCriar", async () => {
    const r = await itemForm({}, "Criar item", "Criar");
    if (!r || !r.nome.trim()) return;
    f.itens = f.itens || [];
    f.itens.push({
      nome: r.nome.trim(),
      grupo: "Item criado",
      cat: r.cat,
      esp: Math.max(0, +r.esp || 0),
      qtd: Math.max(1, +r.qtd || 1),
      nota: r.nota.trim(),
      mods: []
    });
    sv();
    rr();
    toast(`${r.nome.trim()} entrou no inventário.`);
  });
  $$("[data-itemed]").forEach(
    b =>
      (b.onclick = async () => {
        const it = f.itens[+b.dataset.itemed];
        if (!it) return;
        const r = await itemForm(it, "Editar item", "Salvar");
        if (!r || !r.nome.trim()) return;
        Object.assign(it, {
          nome: r.nome.trim(),
          cat: r.cat,
          esp: Math.max(0, +r.esp || 0),
          qtd: Math.max(1, +r.qtd || 1),
          nota: r.nota.trim()
        });
        sv();
        rr();
      })
  );
  $$("[data-iqtd]").forEach(
    i =>
      (i.onchange = () => {
        f.itens[+i.dataset.iqtd].qtd = Math.max(1, +i.value || 1);
        sv();
        rr();
      })
  );
  $$("[data-imodadd]").forEach(
    b =>
      (b.onclick = () => {
        const i = +b.dataset.imodadd;
        const m = $(`[data-imodsel="${i}"]`).value;
        const it = f.itens[i];
        it.mods = it.mods || [];
        if (it.mods.includes(m)) return;
        it.mods.push(m);
        it.cat = catPlus(it.cat, 1);
        const md = (MODIFICACOES.find(x => x[0] === m) || [])[3] || {};
        if (md.esp) it.esp = Math.max(0, it.esp + md.esp);
        sv();
        rr();
      })
  );
  $$("[data-ppev]").forEach(
    b =>
      (b.onclick = () => {
        const [n, v] = PP_EVENTOS[+b.dataset.ppev];
        f.pp = Math.max(0, (+f.pp || 0) + v);
        sv(true);
        rr();
        toast(`${n}: ${v > 0 ? "+" : ""}${v} PP`);
      })
  );
  // história
  on("#btnTokFicha", () => tokenDaFicha(id));
  on("#btnDelFicha", async () => {
    if (!(await confirmBox("Apagar " + f.nome + "?", "A ficha some para todos na mesa."))) return;
    try {
      await S.db.del(fichaPath(id));
      if (f.dono === S.uid && !f.npc)
        S.db.del("usuarios/" + S.uid + "/fichas/" + S.mesaId + "_" + id).catch(() => {});
      delete S.fichas[id];
      S.openFicha = null;
      renderPanel();
    } catch (e) {
      fail(e);
    }
  });
}
</script>
