"use strict";
/* NPCs: ficha rápida, modelos prontos, duplicar e pastas. */
/* =====================================================================
   NPCs: ficha rápida, modelos prontos, duplicar e pastas
   Os números dos modelos são sugestões genéricas para pessoas comuns
   (não são fichas do livro); o mestre ajusta como quiser.
   ===================================================================== */
const NPC_MODELOS = [
  {
    id: "branco",
    nome: "Em branco",
    tipo: "",
    pv: 10,
    def: 10,
    desl: 9,
    attr: { AGI: 1, FOR: 1, INT: 1, PRE: 1, VIG: 1 },
    per: [],
    atq: [],
    notas: ""
  },
  {
    id: "civil",
    nome: "Civil",
    tipo: "Pessoa comum",
    pv: 8,
    def: 10,
    desl: 9,
    san: 10,
    attr: { AGI: 1, FOR: 1, INT: 1, PRE: 1, VIG: 1 },
    per: [
      ["Percepção", "PRE", 0],
      ["Atletismo", "FOR", 0]
    ],
    atq: [["Soco", "FOR", 0, "1d3", "20/x2"]],
    notas: "Foge ou se esconde quando o paranormal aparece."
  },
  {
    id: "policial",
    nome: "Policial",
    tipo: "Policial militar",
    pv: 20,
    def: 14,
    desl: 9,
    attr: { AGI: 2, FOR: 2, INT: 1, PRE: 1, VIG: 2 },
    per: [
      ["Pontaria", "AGI", 5],
      ["Luta", "FOR", 5],
      ["Percepção", "PRE", 5],
      ["Intimidação", "PRE", 5]
    ],
    atq: [
      ["Pistola", "AGI", 5, "1d12", "18/x2"],
      ["Cassetete", "FOR", 5, "1d6", "20/x2"]
    ],
    notas: "Colete leve. Chama reforços se a situação sair do controle."
  },
  {
    id: "seguranca",
    nome: "Segurança",
    tipo: "Segurança particular",
    pv: 16,
    def: 13,
    desl: 9,
    attr: { AGI: 1, FOR: 2, INT: 1, PRE: 1, VIG: 2 },
    per: [
      ["Luta", "FOR", 5],
      ["Percepção", "PRE", 5],
      ["Fortitude", "VIG", 5]
    ],
    atq: [
      ["Cassetete", "FOR", 5, "1d6", "20/x2"],
      ["Taser", "AGI", 0, "1d4 + atordoado (Fortitude DT 15)", "20/x2"]
    ],
    notas: "Rádio para chamar os colegas."
  },
  {
    id: "capanga",
    nome: "Capanga",
    tipo: "Criminoso armado",
    pv: 14,
    def: 12,
    desl: 9,
    attr: { AGI: 2, FOR: 2, INT: 0, PRE: 1, VIG: 1 },
    per: [
      ["Pontaria", "AGI", 5],
      ["Luta", "FOR", 5],
      ["Furtividade", "AGI", 0]
    ],
    atq: [
      ["Revólver", "AGI", 5, "2d4", "19/x3"],
      ["Faca", "FOR", 5, "1d4", "19/x2"]
    ],
    notas: "Covarde: foge com metade da vida."
  },
  {
    id: "cultista",
    nome: "Cultista",
    tipo: "Membro de seita",
    pv: 12,
    def: 11,
    desl: 9,
    san: 6,
    attr: { AGI: 1, FOR: 1, INT: 2, PRE: 2, VIG: 1 },
    per: [
      ["Ocultismo", "INT", 5],
      ["Religião", "PRE", 5],
      ["Vontade", "PRE", 5]
    ],
    atq: [["Adaga ritualística", "FOR", 0, "1d4", "19/x2"]],
    notas: "Pode conhecer um ritual de 1º círculo. Fanático: não se rende."
  },
  {
    id: "medico",
    nome: "Médico(a)",
    tipo: "Profissional de saúde",
    pv: 10,
    def: 10,
    desl: 9,
    attr: { AGI: 1, FOR: 1, INT: 3, PRE: 1, VIG: 1 },
    per: [
      ["Medicina", "INT", 10],
      ["Ciências", "INT", 5],
      ["Percepção", "PRE", 5]
    ],
    atq: [["Bisturi", "AGI", 0, "1d4", "19/x2"]],
    notas: "Pode estabilizar alguém morrendo."
  },
  {
    id: "jornalista",
    nome: "Jornalista",
    tipo: "Repórter investigativo",
    pv: 10,
    def: 11,
    desl: 9,
    attr: { AGI: 1, FOR: 1, INT: 2, PRE: 2, VIG: 1 },
    per: [
      ["Investigação", "INT", 10],
      ["Diplomacia", "PRE", 5],
      ["Enganação", "PRE", 5]
    ],
    atq: [],
    notas: "Sabe mais do que conta. Grava tudo no celular."
  },
  {
    id: "agente",
    nome: "Agente veterano",
    tipo: "Agente experiente",
    pv: 40,
    def: 17,
    desl: 9,
    pe: 12,
    san: 30,
    attr: { AGI: 3, FOR: 2, INT: 2, PRE: 2, VIG: 3 },
    per: [
      ["Pontaria", "AGI", 10],
      ["Luta", "FOR", 10],
      ["Reflexos", "AGI", 10],
      ["Vontade", "PRE", 10],
      ["Ocultismo", "INT", 5]
    ],
    atq: [
      ["Fuzil", "AGI", 10, "2d10", "19/x3"],
      ["Faca tática", "FOR", 10, "1d6", "19/x2"]
    ],
    notas: "Aliado ou rival à altura dos agentes."
  },
  {
    id: "ocultista",
    nome: "Ocultista",
    tipo: "Estudioso do paranormal",
    pv: 18,
    def: 12,
    desl: 9,
    pe: 10,
    san: 16,
    attr: { AGI: 1, FOR: 1, INT: 3, PRE: 3, VIG: 1 },
    per: [
      ["Ocultismo", "INT", 10],
      ["Vontade", "PRE", 10],
      ["Investigação", "INT", 5]
    ],
    atq: [["Ritual", "PRE", 5, "2d6 (elemento)", "20/x2"]],
    notas: "Conhece rituais de 1º e 2º círculo."
  }
];
const NPC_ATTRS = ["AGI", "FOR", "INT", "PRE", "VIG"];

/* ficha rápida: PV, Defesa etc. vêm direto da ficha */
/* Ficha rápida: PV, PE, SAN e Defesa são os números que o mestre digitou. */
function ajustarNpcRapido(f, D) {
  if (!f || !f.rapido) return;
  D.pvMax = Math.max(1, +f.rpv || 1);
  D.peMax = Math.max(0, +f.rpe || 0);
  D.sanMax = Math.max(0, +f.rsan || 0);
  D.def = (+f.rdef || 10) - (f.cond || []).reduce((m, c) => Math.max(m, DEF_COND[c] || 0), 0);
}

function npcDeModelo(mid) {
  const m = NPC_MODELOS.find(x => x.id === mid) || NPC_MODELOS[0];
  const f = novaFicha();
  Object.assign(f, {
    npc: true,
    visivel: false,
    dono: S.uid,
    rapido: true,
    nome: m.id === "branco" ? "Novo NPC" : m.nome,
    rtipo: m.tipo,
    rpv: m.pv,
    pv: m.pv,
    rdef: m.def,
    rdesl: m.desl,
    rpe: m.pe || 0,
    rsan: m.san || 0,
    attr: { ...m.attr },
    rper: m.per.map(([n, a, b]) => ({ n, a, b })),
    ratq: m.atq.map(([n, a, b, d, c]) => ({ n, a, b, d, c })),
    rnotas: m.notas
  });
  if (f.rpe) f.pe = f.rpe;
  if (f.rsan) f.san = f.rsan;
  return f;
}
function npcPastas() {
  return [
    ...new Set(
      Object.values(S.fichas)
        .filter(f => f.npc && f.pasta)
        .map(f => f.pasta)
    )
  ].sort();
}
async function novoNpc() {
  const r = await formBox(
    "Criar NPC",
    `<div class="field"><span class="label">Tipo de ficha</span>
     <label class="check"><input type="radio" name="tipo" value="rapido" checked> <span><b>Rápida</b>: só o essencial (vida, defesa, ataques, perícias principais)</span></label>
     <label class="check"><input type="radio" name="tipo" value="completo"> <span><b>Completa</b>: ficha de agente com classe, NEX e rituais</span></label></div>
   <div class="field"><label class="label" for="npM">Começar de um modelo (ficha rápida)</label><select id="npM" name="modelo">${NPC_MODELOS.map(m => `<option value="${m.id}">${esc(m.nome)}${m.tipo ? " · " + esc(m.tipo) : ""}</option>`).join("")}</select></div>
   <div class="row" style="flex-wrap:nowrap"><div class="field" style="flex:2"><label class="label" for="npN">Nome</label><input type="text" id="npN" name="nome" maxlength="40" placeholder="Deixe vazio para usar o do modelo"></div>
    <div class="field" style="flex:1"><label class="label" for="npQ">Quantos</label><input type="number" id="npQ" name="qtd" min="1" max="12" value="1"></div></div>
   <div class="field"><label class="label" for="npP">Pasta (missão, lugar, grupo…)</label><input type="text" id="npP" name="pasta" maxlength="40" list="npPastas" value="${esc(S.npcPasta && S.npcPasta !== "*" ? S.npcPasta : "")}" placeholder="Ex.: Missão do hospital"><datalist id="npPastas">${npcPastas()
     .map(p => `<option value="${esc(p)}">`)
     .join("")}</datalist></div>
   <p class="muted small" style="margin:0">Com mais de um, eles saem numerados (Capanga 1, Capanga 2…), cada um com a própria vida.</p>`,
    "Criar"
  );
  if (!r) return;
  const q = Math.max(1, Math.min(12, +r.qtd || 1));
  let first = null;
  for (let i = 0; i < q; i++) {
    const id = "n" + rid(8);
    let f;
    if (r.tipo === "completo") {
      f = novaFicha();
      Object.assign(f, { npc: true, visivel: false, dono: S.uid, nome: "Novo NPC" });
    } else f = npcDeModelo(r.modelo);
    if (r.nome.trim()) f.nome = r.nome.trim();
    if (q > 1) f.nome += " " + (i + 1);
    if (r.pasta.trim()) f.pasta = r.pasta.trim();
    f.criada = Date.now() + i;
    S.fichas[id] = f;
    saveFicha(id, true);
    first = first || id;
    await new Promise(z => setTimeout(z, 20));
  }
  if (q === 1) {
    S.openFicha = first;
    S.sheetTab = "principal";
  }
  renderPanel();
  toast(q > 1 ? `${q} NPCs criados.` : "NPC criado.");
}
async function npcDuplicar(id) {
  const f0 = S.fichas[id];
  if (!f0) return;
  const r = await formBox(
    `Duplicar ${f0.nome}`,
    `<div class="field"><label class="label" for="ndQ">Quantas cópias</label><input type="number" id="ndQ" name="qtd" min="1" max="12" value="1"></div>
   <label class="check"><input type="checkbox" name="cheia" checked> Cópias com a vida cheia</label>`,
    "Duplicar"
  );
  if (!r) return;
  const q = Math.max(1, Math.min(12, +r.qtd || 1));
  const base = f0.nome.replace(/\s+\d+$/, "");
  const usados = Object.values(S.fichas)
    .filter(f => f.npc && f.nome.replace(/\s+\d+$/, "") === base)
    .map(f => +(f.nome.match(/(\d+)$/) || [0, 1])[1]);
  let n = Math.max(1, ...usados);
  if (!/\d+$/.test(f0.nome)) {
    f0.nome = base + " 1";
    saveFicha(id, true);
  }
  for (let i = 0; i < q; i++) {
    const nid = "n" + rid(8);
    const f = JSON.parse(JSON.stringify(f0));
    f.nome = base + " " + ++n;
    f.criada = Date.now() + i;
    if (r.cheia) {
      delete f.pv;
      delete f.pe;
      delete f.san;
      f.morrendo = 0;
      f.cond = [];
    }
    S.fichas[nid] = f;
    saveFicha(nid, true);
    await new Promise(z => setTimeout(z, 20));
  }
  renderPanel();
  toast(q > 1 ? `${q} cópias criadas.` : "Cópia criada.");
}

/* ---------- lista de NPCs (em Agentes) ---------- */
function npcCard(id) {
  const f = S.fichas[id];
  const D = derivados(migrar(f));
  const pv = cur(f, "pv");
  const pct = Math.max(0, Math.min(100, (pv / D.pvMax) * 100));
  return `<button class="fcard ${f.visivel || !S.isM ? "" : "npchid"}" data-open="${esc(id)}">${npcAvatar(f)}<div style="min-width:0"><div class="label">${f.rapido ? esc(f.rtipo || "NPC") : esc(f.classe) + " · NEX " + f.nex + "%"}${S.isM && !f.visivel ? " · escondido" : ""}</div><div class="nm">${esc(f.nome)}</div>
   <div class="npcpv"><i style="width:${pct}%"></i><span>PV ${pv}/${D.pvMax} · DEF ${D.def}</span></div></div></button>`;
}
/* Lista de Agentes, parte de baixo: NPCs (pessoas) e depois Criaturas (ficha/criaturas). */
function npcSecaoHTML(ids) {
  const pessoas = ids.filter(id => !S.fichas[id].criatura);
  const criaturas = ids.filter(id => S.fichas[id].criatura);
  return npcPessoasHTML(pessoas) + criaturasSecaoHTML(criaturas);
}
function npcPessoasHTML(ids) {
  if (!ids.length && !S.isM) return "";
  const pastas = npcPastas();
  const filtro = S.npcPasta || "*";
  const vis = ids.filter(
    id => filtro === "*" || (filtro === "—" ? !S.fichas[id].pasta : S.fichas[id].pasta === filtro)
  );
  const grupos = {};
  vis.forEach(id => {
    const p = S.fichas[id].pasta || "";
    (grupos[p] = grupos[p] || []).push(id);
  });
  return `<div class="row between"><span class="sub" style="margin:0">NPCs${S.isM ? " do mestre" : ""}</span>${npcPorNaCenaHTML(ids)}${S.isM ? `<button class="btn sm" id="novoNpc">Criar NPC</button>` : ""}</div>
   ${pastas.length ? `<div class="me-cats"><button class="chip ${filtro === "*" ? "on" : ""}" data-npast="*">Todos</button>${pastas.map(p => `<button class="chip ${filtro === p ? "on" : ""}" data-npast="${esc(p)}">${esc(p)}</button>`).join("")}<button class="chip ${filtro === "—" ? "on" : ""}" data-npast="—">Sem pasta</button></div>` : ""}
   ${
     vis.length
       ? Object.keys(grupos)
           .sort((a, b) => (a === "" ? 1 : 0) - (b === "" ? 1 : 0) || a.localeCompare(b))
           .map(
             p =>
               `${pastas.length && filtro === "*" ? `<div class="muted small" style="margin-top:4px">${p ? esc(p) : "Sem pasta"}</div>` : ""}<div class="cards">${grupos[p].map(npcCard).join("")}</div>`
           )
           .join("")
       : `<div class="muted small">${S.isM ? "Aliados, vilões, capangas e civis. Só você vê, a não ser que marque “visível”." : "Nenhum NPC visível."}</div>`
   }`;
}
function bindNpcSecao() {
  $$("[data-npast]").forEach(
    b =>
      (b.onclick = () => {
        S.npcPasta = b.dataset.npast;
        renderPanel();
      })
  );
  // criaturas (ficha/criaturas)
  const nc = $("#novaCri");
  if (nc) nc.onclick = novaCriatura;
  const ga = $("#galArtes");
  if (ga) ga.onclick = galeriaArtes;
  $$("[data-pgc]").forEach(b => (b.onclick = () => porGrupoEmCena(b.dataset.pgc, b.dataset.pgk)));
}

/* ---------- ficha rápida ---------- */
function npcRapidoHTML(id, f) {
  const D = derivados(f);
  const ed = canEditFicha(f);
  const dis = ed ? "" : "disabled";
  const pv = cur(f, "pv");
  const num = (k, lbl, v, min = 0) =>
    `<div class="field"><label class="label" for="q_${k}">${lbl}</label><input type="number" id="q_${k}" data-q="${k}" value="${v ?? ""}" min="${min}" max="999" ${dis}></div>`;
  const attrSel = (v, attr) =>
    `<select ${attr} ${dis}>${NPC_ATTRS.map(a => `<option ${a === v ? "selected" : ""}>${a}</option>`).join("")}</select>`;
  const recurso = (k, n, max) =>
    max
      ? `<div class="qres"><span class="label">${n}</span><button class="btn sm" data-qr="${k}" data-d="-5" ${dis}>−5</button><button class="btn sm" data-qr="${k}" data-d="-1" ${dis}>−1</button><b>${cur(f, k)}/${max}</b><button class="btn sm" data-qr="${k}" data-d="1" ${dis}>+1</button><button class="btn sm" data-qr="${k}" data-d="5" ${dis}>+5</button></div>`
      : "";
  return `<div class="row between"><button class="btn sm ghost" data-back>← Agentes</button><span class="row" style="gap:6px">${fichaAcoesHTML(f)}<span class="muted small" id="saveState">${ed ? "Salvo" : "Só leitura"}</span></span></div>
   ${S.isM ? `<label class="check banner" style="border-color:var(--purple);color:var(--fg);background:var(--purple-soft)"><input type="checkbox" id="npcVis" ${f.visivel ? "checked" : ""}> ${f.criatura ? "Ficha da criatura visível" : "NPC visível"} para os jogadores (eles só leem)</label>` : ""}
   <div class="sheet-top"><button type="button" class="photo" id="foto" aria-label="Trocar arte" ${dis}>${f.foto ? `<img src="${f.foto}" alt="">` : `<span>Toque para pôr a arte</span>`}</button>
    <div class="stack" style="gap:6px;min-width:0"><input type="text" id="q_nome" data-qt="nome" value="${esc(f.nome)}" maxlength="40" class="qname" ${dis} aria-label="Nome">
     <input type="text" data-qt="rtipo" value="${esc(f.rtipo || "")}" maxlength="60" placeholder="O que é (ex.: segurança do hospital)" ${dis} aria-label="Tipo">
     ${
       S.isM
         ? `<input type="text" data-qt="pasta" value="${esc(f.pasta || "")}" maxlength="40" list="npPastas2" placeholder="Pasta (opcional)" aria-label="Pasta"><datalist id="npPastas2">${npcPastas()
             .map(p => `<option value="${esc(p)}">`)
             .join("")}</datalist>`
         : ""
     }</div></div>
   <div class="box stack">${recurso("pv", "Vida", D.pvMax)}${f.criatura ? "" : recurso("san", "Sanidade", D.sanMax) + recurso("pe", "PE", D.peMax)}</div>
   ${f.criatura ? (cur(f, "pv") <= 0 ? `<div class="banner">Derrotada.</div>` : "") : morrendoHTML(f)}
   ${
     f.criatura
       ? `<div class="box stack"><div class="qgrid"><div class="field"><label class="label" for="q_rel">Elemento</label><select id="q_rel" data-qs="rel" ${dis}>${["", "Sangue", "Morte", "Conhecimento", "Energia", "Medo"].map(e => `<option value="${e}" ${(f.rel || "") === e ? "selected" : ""}>${e || "Nenhum"}</option>`).join("")}</select></div>
     ${num("rvd", "VD", f.rvd || "")}<div class="field"><label class="label" for="q_pdt">Presença: DT</label><input type="number" id="q_pdt" data-q="pdt" value="${f.pdt || ""}" ${dis}></div><div class="field" style="grid-column:span 2"><label class="label" for="q_pdano">Presença: dano mental</label><input type="text" id="q_pdano" data-qt="pdano" value="${esc(f.pdano || "")}" placeholder="ex.: 3d6" ${dis}></div></div>
     ${f.pdt || f.pdano ? `<button class="btn sm" id="qPres">Presença Perturbadora (DT ${f.pdt || "?"} · ${esc(f.pdano || "—")})</button>` : ""}
     <div class="field"><label class="label">Resistências</label><input type="text" data-qt="rres" value="${esc(f.rres || "")}" placeholder="ex.: balístico 5, Morte 10" ${dis}></div>
     <div class="field"><label class="label">Vulnerabilidades</label><input type="text" data-qt="rvul" value="${esc(f.rvul || "")}" placeholder="ex.: Energia" ${dis}></div>
     <div class="field"><label class="label">Imunidades</label><input type="text" data-qt="rimu" value="${esc(f.rimu || "")}" placeholder="ex.: Sangue, condições de medo" ${dis}></div></div>`
       : ""
   }
   <div class="qgrid">${num("rpv", "Vida máx.", f.rpv, 1)}${num("rdef", "Defesa", f.rdef)}${num("rdesl", "Desloc. (m)", f.rdesl)}${f.criatura ? "" : num("rsan", "Sanidade máx.", f.rsan || "") + num("rpe", "PE máx.", f.rpe || "")}</div>
   <div class="qgrid a">${NPC_ATTRS.map(a => `<div class="field"><label class="label" for="qa_${a}">${a}</label><input type="number" id="qa_${a}" data-qa="${a}" value="${f.attr[a]}" min="0" max="9" ${dis}></div>`).join("")}</div>
   <div class="box stack"><div class="row between"><h3 style="margin:0">Perícias</h3>${ed ? `<button class="btn sm" id="qPerAdd">+ Perícia</button>` : ""}</div>
    ${(f.rper || []).map((p, i) => `<div class="qrow"><input type="text" list="qPerList" data-qp="${i}" data-k="n" value="${esc(p.n)}" ${dis}>${attrSel(p.a, `data-qp="${i}" data-k="a"`)}<input type="number" data-qp="${i}" data-k="b" value="${+p.b || 0}" ${dis} aria-label="Bônus"><button class="btn sm primary" data-qroll="${i}">${f.attr[p.a] || 0}d20${sgn(+p.b || 0)}</button>${ed ? `<button class="btn sm ghost" data-qpdel="${i}" aria-label="Tirar">✕</button>` : ""}</div>`).join("") || `<p class="muted small" style="margin:0">Só as perícias que importam para a cena.</p>`}
    <datalist id="qPerList">${PERICIAS.map(([p]) => `<option value="${esc(p)}">`).join("")}</datalist>
    <div class="row"><button class="btn sm" id="qIni">Iniciativa (${f.attr.AGI}d20)</button><button class="btn sm" id="qLivre">Teste de atributo…</button></div></div>
   <div class="box stack"><div class="row between"><h3 style="margin:0">Ataques</h3>${ed ? `<button class="btn sm" id="qAtqAdd">+ Ataque</button>` : ""}</div>
    ${
      (f.ratq || [])
        .map(
          (
            w,
            i
          ) => `<div class="qatq"><input type="text" data-qw="${i}" data-k="n" value="${esc(w.n)}" placeholder="${f.criatura ? "Ataque" : "Arma"}" ${dis}>${f.criatura ? `<input type="number" data-qw="${i}" data-k="dd" value="${+w.dd || 1}" min="1" max="9" ${dis} aria-label="Dados (d20)" title="Quantos d20">` : attrSel(w.a, `data-qw="${i}" data-k="a"`)}<input type="number" data-qw="${i}" data-k="b" value="${+w.b || 0}" ${dis} aria-label="Bônus no teste">
      <input type="text" data-qw="${i}" data-k="d" value="${esc(w.d || "")}" placeholder="Dano (ex.: 1d8+2)" ${dis}><input type="text" data-qw="${i}" data-k="c" value="${esc(w.c || "")}" placeholder="Crítico (19/x2)" ${dis}>
      <button class="btn sm primary" data-qatk="${i}">Atacar</button>${ed ? `<button class="btn sm ghost" data-qwdel="${i}" aria-label="Tirar">✕</button>` : ""}</div>`
        )
        .join("") || `<p class="muted small" style="margin:0">Nenhum ataque.</p>`
    }</div>
   <div class="box stack"><h3 style="margin:0">Condições</h3><div class="me-cats">${CONDICOES.map(c => `<button class="chip ${(f.cond || []).includes(c) ? "on" : ""}" data-qcond="${esc(c)}" ${dis}>${esc(c)}</button>`).join("")}</div></div>
   <div class="box stack"><h3 style="margin:0">Habilidades e anotações</h3><textarea data-qt="rnotas" rows="5" maxlength="3000" ${dis}>${esc(f.rnotas || "")}</textarea></div>
   ${S.isM ? `<div class="row between"><span class="row"><button class="btn sm" id="btnTokFicha">Criar token</button><button class="btn sm" id="qDup">Duplicar</button>${f.criatura ? "" : `<button class="btn sm" id="qFull">Virar ficha completa</button>`}</span><button class="btn sm danger" id="btnDelFicha">Apagar</button></div>` : ""}`;
}
function npcRolar(f, titulo, dados, bonus, extra = "") {
  const pen = penalidade(f, { tipo: "pericia", attr: "", nome: titulo });
  const r = rollTest(dados, bonus + pen.mod, pen.dados);
  logEntry({
    quem: f.nome,
    titulo,
    total: r.total,
    det: `${r.dice.length}d20[${r.dice.join(",")}] fica ${r.mode} ${r.kept}${sgn(bonus + pen.mod)}${extra}${pen.quem.length ? ` · condições: ${pen.quem.join(", ")}` : ""}`,
    flag: r.kept === 20 ? "crit" : r.kept === 1 ? "fail" : "",
    para: S.paraRolagem || ""
  });
  return r;
}
function bindNpcRapido(id, f) {
  const sv = now => saveFicha(id, now),
    rr = () => renderPanel();
  const ed = canEditFicha(f);
  $$("[data-back]").forEach(
    b =>
      (b.onclick = () => {
        S.openFicha = null;
        renderPanel();
      })
  );
  const nv = $("#npcVis");
  if (nv)
    nv.onchange = () => {
      f.visivel = nv.checked;
      sv(true);
      toast(nv.checked ? "Os jogadores agora veem esta ficha." : "Ficha escondida dos jogadores.");
      rr();
    };
  $$("[data-qroll]").forEach(
    b =>
      (b.onclick = () => {
        const p = f.rper[+b.dataset.qroll];
        npcRolar(f, p.n || "Teste", f.attr[p.a] || 0, +p.b || 0);
      })
  );
  $$("[data-qatk]").forEach(
    b =>
      (b.onclick = () => {
        const w = f.ratq[+b.dataset.qatk];
        const r = npcRolar(f, `${w.n || "Ataque"}`, f.criatura && w.dd ? +w.dd : f.attr[w.a] || 0, +w.b || 0);
        const cm = (w.c || "").match(/(\d+)\s*\/\s*x?(\d+)/i);
        const mar = cm ? +cm[1] : 20,
          mult = cm ? +cm[2] : 2;
        const crit = r.kept >= mar;
        if (w.d && /\d*d\d+/i.test(w.d)) {
          const expr = (w.d.match(/[\dd+\-\s]+/i) || [w.d])[0].replace(/\s/g, "");
          try {
            const dm = rollExpr(expr, { critMult: crit ? mult : 1 });
            logEntry({
              quem: f.nome,
              titulo: `${w.n} · dano${crit ? " (crítico!)" : ""}`,
              total: dm.total,
              det: dm.detail + (w.d.length > expr.length ? " · " + w.d : ""),
              flag: crit ? "crit" : "",
              para: S.paraRolagem || ""
            });
          } catch (e) {}
        }
      })
  );
  on2("#qIni", () => npcRolar(f, "Iniciativa", f.attr.AGI || 0, 0));
  on2("#qPres", () => {
    let det = `DT ${f.pdt || "?"} (Vontade)`;
    let tot = null;
    const ex = (f.pdano || "").match(/\d*d\d+([+-]\d+)?/i);
    if (ex) {
      try {
        const r = rollExpr(ex[0]);
        tot = r.total;
        det += ` · dano mental ${r.detail}`;
      } catch (e) {}
    }
    logEntry({
      quem: f.nome,
      titulo: "Presença Perturbadora",
      total: tot,
      det,
      flag: "",
      para: S.paraRolagem || ""
    });
  });
  on2("#qLivre", async () => {
    const r = await formBox(
      "Teste de atributo",
      `<div class="row" style="flex-wrap:nowrap"><select name="a">${NPC_ATTRS.map(a => `<option>${a}</option>`).join("")}</select><input type="number" name="b" value="0" aria-label="Bônus"></div>`,
      "Rolar"
    );
    if (r) npcRolar(f, `Teste de ${r.a}`, f.attr[r.a] || 0, +r.b || 0);
  });
  if (!ed) return;
  $$("[data-qt]").forEach(
    i =>
      (i.oninput = () => {
        f[i.dataset.qt] = i.value;
        sv();
      })
  );
  $$("[data-qs]").forEach(
    i =>
      (i.onchange = () => {
        f[i.dataset.qs] = i.value;
        sv();
        rr();
      })
  );
  $$("[data-q]").forEach(
    i =>
      (i.onchange = () => {
        const k = i.dataset.q;
        f[k] = i.value === "" ? 0 : +i.value;
        if (k === "rpv" && cur(f, "pv") > f.rpv) f.pv = f.rpv;
        sv();
        rr();
        renderBoard();
      })
  );
  $$("[data-qa]").forEach(
    i =>
      (i.onchange = () => {
        f.attr[i.dataset.qa] = Math.max(0, +i.value || 0);
        sv();
        rr();
      })
  );
  $$("[data-qr]").forEach(
    b =>
      (b.onclick = () => {
        const k = b.dataset.qr;
        const max = derivados(f)[k + "Max"];
        f[k] = Math.max(k === "pv" ? -max : 0, Math.min(max, cur(f, k) + +b.dataset.d));
        if (k === "pv" && f.pv > 0) f.morrendo = 0;
        sv();
        rr();
        renderBoard();
      })
  );
  on2("#mrMais", () => {
    f.morrendo = (+f.morrendo || 0) + 1;
    sv(true);
    rr();
  });
  on2("#mrZera", () => {
    f.morrendo = 0;
    sv(true);
    rr();
  });
  $$("[data-qp]").forEach(
    i =>
      (i.onchange = () => {
        const p = f.rper[+i.dataset.qp];
        p[i.dataset.k] = i.dataset.k === "b" ? +i.value || 0 : i.value;
        sv();
        rr();
      })
  );
  $$("[data-qw]").forEach(
    i =>
      (i.onchange = () => {
        const w = f.ratq[+i.dataset.qw];
        w[i.dataset.k] = i.dataset.k === "b" || i.dataset.k === "dd" ? +i.value || 0 : i.value;
        sv();
        rr();
      })
  );
  $$("[data-qpdel]").forEach(
    b =>
      (b.onclick = () => {
        f.rper.splice(+b.dataset.qpdel, 1);
        sv();
        rr();
      })
  );
  $$("[data-qwdel]").forEach(
    b =>
      (b.onclick = () => {
        f.ratq.splice(+b.dataset.qwdel, 1);
        sv();
        rr();
      })
  );
  on2("#qPerAdd", () => {
    (f.rper = f.rper || []).push({ n: "", a: "AGI", b: 0 });
    sv();
    rr();
  });
  on2("#qAtqAdd", () => {
    (f.ratq = f.ratq || []).push({ n: "", a: "FOR", b: 0, d: "", c: "20/x2" });
    sv();
    rr();
  });
  $$("[data-qcond]").forEach(
    b =>
      (b.onclick = () => {
        const c = b.dataset.qcond;
        f.cond = f.cond || [];
        f.cond = f.cond.includes(c) ? f.cond.filter(x => x !== c) : [...f.cond, c];
        sv();
        rr();
        renderBoard();
      })
  );
  on2("#foto", async () => {
    const file = await pickImage();
    if (!file) return;
    const url = await cropImage(file, {
      size: 300,
      ratio: 4 / 3,
      radius: 0.06,
      type: "image/jpeg",
      title: "Ajustar a arte do NPC"
    });
    if (!url) return;
    f.foto = url;
    sv(true);
    rr();
    renderBoard();
  });
  on2("#btnTokFicha", () => tokenDaFicha(id));
  on2("#qDup", () => npcDuplicar(id));
  on2("#qFull", async () => {
    if (
      !(await confirmBox(
        "Virar ficha completa?",
        "A ficha passa a ter classe, NEX, rituais e inventário como a de um agente. Vida e Defesa passam a ser calculadas pelas regras.",
        "Virar completa"
      ))
    )
      return;
    f.rapido = false;
    delete f.pv;
    sv(true);
    rr();
  });
  on2("#btnDelFicha", async () => {
    if (!(await confirmBox(`Apagar ${f.nome}?`, "Não dá para desfazer.", "Apagar"))) return;
    try {
      await S.db.del(fichaPath(id));
      delete S.fichas[id];
      S.openFicha = null;
      renderPanel();
      renderBoard();
    } catch (e) {
      fail(e);
    }
  });
}
function on2(sel, fn) {
  const e = $(sel);
  if (e) e.onclick = fn;
}

/* ganchos na ficha e na lista */
