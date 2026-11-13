"use strict";
/* Ficha: o que aparece em cada aba (Principal, Perícias, Combate...). */
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
  if (f.rapido) return npcRapidoHTML(id, f); // NPC de ficha rápida (ficha/npcs)
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
  const head = `<div class="row between"><button class="btn sm ghost" data-back>← Agentes</button><span class="row" style="gap:6px">${fichaAcoesHTML(f)}<span class="muted small" id="saveState">${ed ? "Salvo" : "Só leitura"}</span></span></div>${claim}${npcBar}${transf}
  <div class="sheet-top"><button type="button" class="photo" id="foto" aria-label="Trocar foto" ${ed ? "" : "disabled"}>${f.foto ? `<img src="${f.foto}" alt="">` : `<span>Toque para pôr a arte do agente</span>`}</button>
   <div class="stack" style="gap:6px;min-width:0"><input class="nmin" type="text" id="s_nome" data-f="nome" value="${esc(f.nome)}" maxlength="50" aria-label="Nome do agente" ${ed ? "" : "disabled"}>
    <div class="muted small">${esc(f.classe)}${f.trilha ? " · " + esc(f.trilha) : ""} · ${esc(f.origem)} · ${nivelDe(f)}${ehSobrevivente(f) ? "" : " · " + esc(D.pat[1])}</div>
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
    regrasFichaHTML(f) + // "Falta escolher" e avisos de regra (regras/limites)
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
  const sob = ehSobrevivente(f); // Sobrevivente: estágio no lugar do NEX, 3 pontos de atributo, sem patente
  const og = ORIGENS[f.origem];
  const travas = regrasAtivas(f);
  const L = limitesFicha(f);
  const nivel = podeAjustarNivel(f) ? "" : 'disabled title="Só o mestre muda"'; // NEX, prestígio e bônus
  const sobra = L.attr.total - L.attr.usados;
  const pode = (k, d) => permitido(f, x => (x.attr[k] += d)).ok;
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
   <div class="field"><label class="label" for="s_trilha">Trilha</label>${
     travas && !L.trilhaLiberada
       ? `<select id="s_trilha" disabled><option>Em ${sob ? "estágio 2" : "NEX 10%"}</option></select>`
       : sel("trilha", Object.keys(c.trilhas), f.trilha, "", "Escolha a trilha")
   }</div>
   ${
     sob
       ? `<div class="field"><label class="label" for="s_est">Estágio</label><select id="s_est" ${nivel}>${[1, 2, 3, 4, 5].map(i => `<option value="${i}" ${i === estagioDe(f) ? "selected" : ""}>Estágio ${i}</option>`).join("")}</select></div>`
       : `<div class="field"><label class="label" for="s_nex">NEX</label><select id="s_nex" ${nivel}>${NEX_OPTS.map(n => `<option value="${n}" ${+f.nex === n ? "selected" : ""}>${n}%</option>`).join("")}</select></div>
   <div class="field"><label class="label" for="s_pp">Pontos de prestígio</label><input type="number" id="s_pp" data-f="pp" value="${+f.pp || 0}" min="0" ${nivel}></div>
   <div class="field"><label class="label" for="s_pat">Patente</label><select id="s_pat" data-patsel ${canEditFicha(f) && !nivel ? "" : "disabled"}>${PATENTES.map((p, i) => `<option value="${i}" ${patenteDe(f.pp) === p ? "selected" : ""}>${esc(p[1])}</option>`).join("")}</select></div>`
   }
  </div>
  ${travas && nivel ? `<p class="muted small" style="margin:0">${sob ? "Estágio" : "NEX, prestígio"} e bônus: quem muda é o mestre.</p>` : ""}
  <p class="muted small" style="margin:0">Origem: <b style="color:var(--fg)">${esc(og[1])}</b> · perícias ${og[0].join(" e ") || "à escolha do mestre"}. Classe: ${c.fixasTxt ? esc(c.fixasTxt) + " + " : ""}${c.livres} + INT perícias à escolha. <button type="button" class="btn sm" id="btnAplicar">Marcar perícias da origem e classe</button></p>
  <div class="box stack"><div class="row between"><h3>Atributos</h3><span class="contador ${sobra < 0 ? "ruim" : sobra ? "falta" : ""}">${L.attr.usados} de ${L.attr.total} pontos${sobra > 0 ? ` · faltam ${sobra}` : sobra < 0 ? ` · ${-sobra} acima` : ""}</span></div>
   <div class="attrs">${ATTRS.map(k => `<div class="attr" title="${ATTR_NOME[k]}"><span class="k">${k}</span><span class="n">${f.attr[k]}</span><div class="pm"><button type="button" data-attr="${k}" data-d="-1" aria-label="Diminuir ${ATTR_NOME[k]}" ${pode(k, -1) && f.attr[k] > 0 ? "" : "disabled"}>−</button><button type="button" data-attr="${k}" data-d="1" aria-label="Aumentar ${ATTR_NOME[k]}" ${pode(k, 1) && f.attr[k] < 5 ? "" : "disabled"}>+</button></div></div>`).join("")}</div>
   ${travas ? `<p class="muted small" style="margin:0">Todos começam em 1. ${sob ? "3 pontos" : "4 pontos"} para distribuir, máximo ${L.attr.max} em cada${L.attr.aumentos ? ` (já conta ${L.attr.aumentos} aumento${L.attr.aumentos > 1 ? "s" : ""} de atributo)` : " na criação"}. Reduzir um atributo a 0 dá 1 ponto a mais.</p>` : ""}
   ${regrasMestreHTML(f)}</div>
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
    <div class="field"><label class="label" for="s_outrosDef">Outros na Defesa</label><input type="number" id="s_outrosDef" data-f="outrosDef" value="${+f.outrosDef || 0}" ${nivel}></div>
    <div class="field"><label class="label" for="s_desl">Deslocamento</label><input type="text" id="s_desl" data-f="desl" value="${esc(f.desl || "9m")}" maxlength="12" ${nivel}></div>
    <div class="field"><label class="label" for="s_bonusPV">Ajuste PV máx.</label><input type="number" id="s_bonusPV" data-f="bonusPV" value="${+f.bonusPV || 0}" ${nivel}></div>
    <div class="field"><label class="label" for="s_bonusSAN">Ajuste SAN máx.</label><input type="number" id="s_bonusSAN" data-f="bonusSAN" value="${+f.bonusSAN || 0}" ${nivel}></div>
    <div class="field"><label class="label" for="s_bonusPE">Ajuste PE máx.</label><input type="number" id="s_bonusPE" data-f="bonusPE" value="${+f.bonusPE || 0}" ${nivel}></div>
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
  const travas = regrasAtivas(f);
  const L = limitesFicha(f).per;
  // um grau pode ser escolhido se a regra deixa (o atual sempre aparece)
  const pode = (p, g, n) => g === n || permitido(f, x => (x.per[p] = { ...(x.per[p] || { b: 0 }), g: n })).ok;
  const cont = (usado, max, nome) =>
    `<span class="contador ${usado > max ? "ruim" : usado < max ? "falta" : ""}">${nome} ${usado} de ${max}</span>`;
  return `<div class="box stack"><div class="row between"><h3>Perícias</h3>${
    travas
      ? `<span class="row" style="gap:6px">${cont(L.usadas, L.max, "treinadas")}${L.grausMax || L.grausUsados ? cont(L.grausUsados, L.grausMax, "graus") : ""}</span>`
      : `<span class="muted small">grau · outros · rolar</span>`
  }</div>
   ${travas ? `<p class="muted small" style="margin:0">Treinadas: origem, classe e Intelecto${L.flex ? `, mais ${L.flex} do Treinamento em Perícia` : ""}. ${L.veteranoLiberado ? `Grau de treinamento: cada perícia que sobe de grau (veterano, ${L.expertLiberado ? "expert" : "expert em NEX 70%"}) gasta 1.` : "Veterano a partir de NEX 35%."}</p>` : ""}
   ${f.classe === "Especialista" && D.perito ? `<label class="check"><input type="checkbox" id="usarPerito"> Perito no próximo teste (${D.perito[1]} PE: +${D.perito[2]})</label>` : ""}
   <div>${PERICIAS.map(([p, a, r]) => {
     const v = f.per[p] || { g: 0, b: 0 };
     const g = +v.g || 0;
     return `<div class="per2 ${g ? "tr" : ""}"><span class="pn">${esc(p)}${r ? ` <span class="only">${esc(r)}</span>` : ""}</span><span class="a">${a}</span>
     <select data-perg="${esc(p)}" aria-label="Grau em ${esc(p)}">${GRAUS.map(([n, l]) => `<option value="${n}" ${g === n ? "selected" : ""} ${pode(p, g, n) ? "" : "disabled"}>${l}</option>`).join("")}</select>
     <input type="number" data-perb="${esc(p)}" value="${+v.b || 0}" aria-label="Outros bônus em ${esc(p)}" ${podeAjustarNivel(f) ? "" : 'disabled title="Bônus: quem dá é o mestre"'}>
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
  const nivel = podeAjustarNivel(f) ? "" : 'disabled title="Só o mestre muda"'; // números da arma
  const L = limitesFicha(f);
  const naoCabe = (cat, esp) => itemNaoCabe(f, L, cat, esp); // categoria cheia ou pesado demais (regras/limites)
  return `<div class="box stack"><div class="row between"><h3>Ataques</h3><div class="row" style="flex-wrap:nowrap"><select id="addArmaSel" style="width:auto;max-width:180px">${allArmas()
    .map(
      (a, i) =>
        `<option value="${i}" ${naoCabe(a.cat, a.esp) ? "disabled" : ""}>${esc(a.nome)} · ${a.dano}${a.hb ? " (homebrew)" : ""}${naoCabe(a.cat, a.esp) ? " · " + naoCabe(a.cat, a.esp) : ""}</option>`
    )
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
      <div class="field"><label class="label">Dano</label><input type="text" data-arma="${i}" data-k="dano" value="${esc(a.dano)}" ${nivel}></div>
      <div class="field"><label class="label">Crítico</label><input type="text" data-arma="${i}" data-k="crit" value="${esc(a.crit)}" placeholder="19/x3" ${nivel}></div>
      <div class="field"><label class="label">Bônus ataque</label><input type="number" data-arma="${i}" data-k="bonus" value="${a.bonus || 0}" ${nivel}></div>
      <div class="field"><label class="label">Bônus dano</label><input type="number" data-arma="${i}" data-k="bdano" value="${a.bdano || 0}" ${nivel}></div>
      <div class="field"><label class="label">Categoria</label><input type="text" data-arma="${i}" data-k="cat" value="${esc(a.cat ?? "0")}" ${nivel}></div>
      <div class="field"><label class="label">Espaço</label><input type="number" data-arma="${i}" data-k="esp" value="${a.esp ?? 1}" ${nivel}></div>
      <label class="check"><input type="checkbox" data-armaagil="${i}" ${a.agil ? "checked" : ""} ${nivel}> Arma ágil</label>
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
  <div class="box stack"><div class="row between"><h3>Proteções</h3><div class="row" style="flex-wrap:nowrap"><select id="protSel" style="width:auto">${PROTECOES.map((p, i) => `<option value="${i}" ${naoCabe(p[1], p[2]) ? "disabled" : ""}>${p[0]} · +${p[3]} Def${naoCabe(p[1], p[2]) ? " · " + naoCabe(p[1], p[2]) : ""}</option>`).join("")}</select><button type="button" class="btn sm" id="protAdd">Adicionar</button></div></div>
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
  const travas = regrasAtivas(f);
  const L = limitesFicha(f).rituais;
  const cheio = travas && L.usados >= L.max;
  const circOk = c => !travas || c <= L.circulo;
  return `<div class="box stack"><div class="row between"><h3>Rituais ${travas ? `<span class="contador ${L.usados > L.max ? "ruim" : L.usados < L.max ? "falta" : ""}">${L.usados} de ${L.max}</span>` : ""}</h3><span class="muted small">DT ${D.dtRit} · ${D.circ ? `até ${D.circ}º círculo` : "sem acesso a rituais"}</span></div>
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
   ${travas ? `<p class="muted small" style="margin:0">${ocult ? "Ocultista: 3 rituais no começo e mais 1 a cada NEX." : "Cada Aprender Ritual (poder paranormal) ensina 1 ritual."}${cheio ? " Você já aprendeu todos os rituais que pode agora." : ""}</p>` : ""}
   <div class="tabs2">${["", ...ELEMENTOS].map(e => `<button type="button" data-ritf="${e}" aria-pressed="${(S.ritFiltro || "") === e}">${e || "Todos"}</button>`).join("")}</div>
   <div class="row" style="flex-wrap:nowrap"><select id="ritSel" ${cheio ? "disabled" : ""}>${[1, 2, 3, 4]
     .map(c => {
       const l = avail.filter(r => r.c === c);
       return l.length
         ? `<optgroup label="${c}º círculo · ${CUSTO_CIRCULO[c]} PE${circOk(c) ? "" : " · ainda não"}" ${circOk(c) ? "" : "disabled"}>${l.map(r => `<option value="${esc(r.n)}">${esc(r.n)} · ${esc(r.el)}${r.hb ? " (homebrew)" : ""}${fonteTag(r.n)}</option>`).join("")}</optgroup>`
         : "";
     })
     .join(
       ""
     )}</select><button type="button" class="btn sm" id="ritAdd" ${cheio ? "disabled" : ""}>Aprender</button></div>
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
  const travas = regrasAtivas(f);
  const L = limitesFicha(f);
  const cont = ({ usados, max }) =>
    travas
      ? `<span class="contador ${usados > max ? "ruim" : usados < max ? "falta" : ""}">${usados} de ${max}</span>`
      : "";
  const cheioPod = travas && L.poderes.usados >= L.poderes.max;
  const cheioPar = travas && L.paranormais.usados >= L.paranormais.max;
  return `<div class="box stack"><h3>Classe: ${esc(f.classe)}</h3>
    <div class="cards">${progs.map(([n, h]) => `<div class="condrow" style="border-left-color:var(--purple)"><span class="tag on">${ehSobrevivente(f) ? "Estágio " + NEX_ESTAGIO[n] : n + "%"}</span><div class="small">${esc(h)}</div><span></span></div>`).join("")}</div>
    ${f.classe === "Combatente" && D.atq ? `<p class="muted small" style="margin:0">Ataque Especial agora: ${D.atq[1]} PE, +${D.atq[2]}.</p>` : ""}
    ${f.classe === "Especialista" && D.perito ? `<p class="muted small" style="margin:0">Perito agora: ${D.perito[1]} PE, +${D.perito[2]}.</p>` : ""}
    ${f.classe === "Ocultista" ? `<p class="muted small" style="margin:0">Escolhido pelo Outro Lado: rituais até o ${D.circ}º círculo.</p>` : ""}
   </div>
   <div class="box stack"><h3>Trilha${f.trilha ? ": " + esc(f.trilha) : ""}</h3>
    ${tr ? `<div class="cards">${tr.map((h, i) => `<div class="condrow" style="border-left-color:${nex >= TRILHA_NEX[i] ? "var(--purple)" : "var(--line)"}"><span class="tag ${nex >= TRILHA_NEX[i] ? "on" : ""}">${TRILHA_NEX[i]}%</span><div><b>${esc(h)}</b>${nex < TRILHA_NEX[i] ? `<div class="muted small">Libera em NEX ${TRILHA_NEX[i]}%</div>` : ""}</div><span></span></div>`).join("")}</div>` : `<div class="muted small">Escolha a trilha na aba Principal (a partir de NEX 10%).</div>`}
   </div>
   <div class="box stack"><div class="row between"><h3>Poderes de ${esc(f.classe.toLowerCase())} ${cont(L.poderes)}</h3><div class="row" style="flex-wrap:nowrap"><select id="podSel" style="width:auto;max-width:180px" ${cheioPod ? "disabled" : ""}>${c.poderes
     .filter(p => p === "Transcender" || p === "Treinamento em Perícia" || !pod.includes(p))
     .map(
       p =>
         `<option value="${esc(p)}">${esc(p)}${PODERES_GERAIS.some(g => g[0] === p) && !FONTE_CLASSE[p] ? " (geral)" : ""}${fonteTag(p)}</option>`
     )
     .join(
       ""
     )}</select><button type="button" class="btn sm" id="podAdd" aria-label="Adicionar poder" ${cheioPod ? "disabled" : ""}>+</button></div></div>
    ${pod.length ? `<div class="conds">${pod.map((p, i) => `<button type="button" class="cond" aria-pressed="true" data-podrm="${i}">${esc(p)} ✕</button>`).join("")}</div>` : `<div class="muted small">Nenhum poder escolhido. Você recebe um em NEX 15% e a cada 15% depois.</div>`}
    ${cheioPod && travas ? `<div class="muted small">${L.poderes.max ? "Todos os poderes deste NEX já foram escolhidos." : "Ainda sem poderes: o primeiro vem em NEX 15%."}</div>` : ""}
   </div>
   <div class="box stack"><div class="row between"><h3>Poderes paranormais ${cont(L.paranormais)}</h3><div class="row" style="flex-wrap:nowrap"><select id="parSel" style="width:auto;max-width:180px" ${cheioPar ? "disabled" : ""}>${PODERES_PARANORMAIS.map(([n, e]) => `<option value="${esc(n)}">${esc(n)}${e !== "—" ? " · " + e : ""}${fonteTag(n)}</option>`).join("")}</select><button type="button" class="btn sm" id="parAdd" aria-label="Adicionar poder paranormal" ${cheioPar ? "disabled" : ""}>+</button></div></div>
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
  const L = limitesFicha(f);
  const nivel = podeAjustarNivel(f) ? "" : 'disabled title="Só o mestre muda"'; // patente, prestígio e extras
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
  return `<div class="box stack"><div class="row between" style="flex-wrap:wrap;gap:8px"><label class="row" style="gap:8px;flex-wrap:nowrap"><h3 style="margin:0">Patente</h3><select id="s_pat2" data-patsel ${canEditFicha(f) && !nivel ? "" : "disabled"}>${PATENTES.map((p, i) => `<option value="${i}" ${patenteDe(f.pp) === p ? "selected" : ""}>${esc(p[1])}</option>`).join("")}</select></label><span class="muted small">${+f.pp || 0} PP · crédito ${esc(lim[2])}</span></div>
    <div class="stats" style="grid-template-columns:repeat(4,minmax(0,1fr))">${cats
      .map((c, i) => {
        const max = regrasAtivas(f) ? L.itens.cat[i + 1] : lim[3 + i] + (+f["catx" + (i + 1)] || 0);
        const u = D.usoCat[i + 1];
        return `<div style="${u > max ? "border-color:var(--red)" : ""}"><b>${u}/${max}</b><span>Categoria ${c}</span></div>`;
      })
      .join("")}</div>
    <div class="muted small">Espaços: ${D.usados}/${D.carga} (dobro: ${D.carga * 2})${D.mochila ? " · Mochila militar +2" : ""}${+f.cargaExtra ? ` · extra ${+f.cargaExtra > 0 ? "+" : ""}${+f.cargaExtra}` : ""}. Categoria 0 é livre.</div>
    <details class="more"><summary>Aumentar espaços e itens por categoria</summary><div class="stack" style="margin-top:8px;gap:8px">
     <p class="muted small" style="margin:0">Pelas regras: mais <b>Força</b> dá mais espaço (5 por ponto), a <b>Mochila militar</b> dá +2 espaços (já conta sozinha), e subir de <b>patente</b> com pontos de prestígio libera mais itens por categoria. Use os campos abaixo para bônus que o mestre der (poder, homebrew, recompensa).</p>
     <div class="row" style="flex-wrap:wrap;gap:8px"><div class="field" style="width:120px"><label class="label" for="s_cx">Espaços extras</label><input type="number" id="s_cx" data-f="cargaExtra" value="${+f.cargaExtra || 0}" min="-20" max="50" ${nivel}></div>
      ${cats.map((c, i) => `<div class="field" style="width:96px"><label class="label" for="s_catx${i + 1}">Extra cat. ${c}</label><input type="number" id="s_catx${i + 1}" data-f="catx${i + 1}" value="${+f["catx" + (i + 1)] || 0}" min="-5" max="20" ${nivel}></div>`).join("")}</div></div></details>
    <details class="more"><summary>Pontos de prestígio por missão</summary><div class="row" style="margin-top:8px">${PP_EVENTOS.map(([n, v], i) => `<button type="button" class="btn sm" data-ppev="${i}" ${nivel}>${esc(n)} ${v > 0 ? "+" : ""}${v}</button>`).join("")}</div></details>
   </div>
   <div class="box stack"><div class="row between"><h3>Itens</h3></div>
    <div class="row" style="flex-wrap:nowrap"><select id="itemSel">${grupos.map(g => `<optgroup label="${esc(g)}">${opts.map((o, i) => (o.g === g ? `<option value="${i}" ${itemNaoCabe(f, L, o.cat, o.esp) ? "disabled" : ""}>${esc(o.n)} · cat. ${o.cat} · ${o.esp} esp.${itemNaoCabe(f, L, o.cat, o.esp) ? " · " + itemNaoCabe(f, L, o.cat, o.esp) : ""}</option>` : "")).join("")}</optgroup>`).join("")}</select><button type="button" class="btn sm" id="itemAdd">Adicionar</button><button type="button" class="btn sm ghost" id="itemCriar" style="white-space:nowrap">Criar item</button></div>
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
   <div class="row between"><span class="row"><button type="button" class="btn sm" id="btnTokFicha">Criar token deste agente</button><button type="button" class="btn sm" id="btnBaixar">Baixar ficha (backup)</button>${!S.solo && !f.npc && f.dono === S.uid ? `<button type="button" class="btn sm" id="btnGuardarConta">Salvar em Meus personagens</button>` : ""}</span><button type="button" class="btn sm danger" id="btnDelFicha">Apagar ficha</button></div></div>`;
}
