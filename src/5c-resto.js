<script>
"use strict";
/* ===================== ROLAGENS ===================== */
function rolagensHTML() {
  const opts = Object.entries(S.fichas).filter(([id, f]) => S.isM || f.dono === S.uid);
  return `<form class="box stack" id="fRoll">
    <div class="field"><label class="label" for="rollQuem">Quem rola</label><select id="rollQuem">${S.isM ? `<option value="">Mestre</option>` : ""}${opts.map(([id, f]) => `<option value="${esc(id)}">${esc(f.nome)}</option>`).join("")}${!S.isM && !opts.length ? `<option value="">Jogador</option>` : ""}</select></div>
    <div class="row" style="flex-wrap:nowrap"><input type="text" id="rollExpr" placeholder="Ex.: 2d6+3" autocomplete="off" aria-label="Expressão de dados"><button class="btn primary">Rolar</button></div>
    <div class="dicebar">${["1d20", "1d4", "1d6", "1d8", "1d10", "1d12", "2d6", "1d100"].map(x => `<button type="button" class="btn sm" data-quick="${x}">${x}</button>`).join("")}</div>
    <div class="field"><span class="label">Teste de Ordem (Xd20, fica com o maior)</span><div class="row"><input type="number" id="testeAttr" value="2" style="width:64px" aria-label="Atributo"><span class="muted">d20 +</span><input type="number" id="testeMod" value="0" style="width:64px" aria-label="Modificador"><button type="button" class="btn" id="btnTeste">Testar</button></div></div>
   </form>
   <div class="row" style="flex-wrap:nowrap"><label class="label" for="paraSel" style="white-space:nowrap;margin:0">Para</label><select id="paraSel">${destinos()
     .map(
       ([v, n]) =>
         `<option value="${esc(v)}" ${(S.paraRolagem || "") === v ? "selected" : ""}>${esc(n)}</option>`
     )
     .join("")}</select></div>
   <form class="row" id="fChat" style="flex-wrap:nowrap"><input type="text" id="chatIn" maxlength="300" placeholder="${S.paraRolagem ? "Mensagem privada…" : "Falar na mesa…"}" aria-label="Mensagem"><button class="btn">Enviar</button></form>
   <p class="muted small" style="margin:0">O "Para" vale para o chat, para as rolagens daqui e para os testes feitos na ficha.</p>
   ${S.isM ? `<button class="btn" id="btnDoc">Enviar documento ou pista</button>` : ""}
   <div class="row between"><span class="sub">Registro da mesa</span>${S.isM ? `<button class="btn sm ghost" id="btnLimparLog">Limpar registro</button>` : ""}</div>
   <div class="log" id="log"></div>`;
}
function renderLog() {
  const el = $("#log");
  if (!el) return;
  if (!S.log.length && !(S.priv || []).length) {
    el.innerHTML = `<div class="empty">${S.loaded.log ? "Nada rolado ainda. Abra uma ficha e toque numa perícia, ou role aqui em cima." : "Carregando registro…"}</div>`;
    return;
  }
  const all = [...S.log.map(x => ({ ...x, _p: 0 })), ...(S.priv || []).map(x => ({ ...x, _p: 1 }))]
    .sort((a, b) => (b.ts || 0) - (a.ts || 0))
    .slice(0, 150);
  el.innerHTML = all.map(x => (x._p ? privRow(x) : logRow(x))).join("");
  el.querySelectorAll("[data-doc]").forEach(
    b =>
      (b.onclick = () => {
        const d = (S.priv || []).find(x => x.id === b.dataset.doc);
        if (d) abrirDoc(d);
      })
  );
}
function logRow(e) {
  const t = new Date(e.ts || 0).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (e.tipo === "chat")
    return `<div class="entry chat"><span class="wh"><b>${esc(e.quem || "Jogador")}</b> · ${t}</span><span class="wt">${esc(e.titulo)}</span></div>`;
  return `<div class="entry ${esc(e.flag)}${e.secreto ? " secret" : ""}"><span class="wh"><b>${esc(e.quem || "Mestre")}</b> · ${t}</span><span class="wt">${esc(e.titulo)}${e.flag === "crit" ? " · crítico" : ""}</span><span class="det">${esc(e.det)}</span><span class="tot">${e.total ?? "✦"}</span></div>`;
}
function quemNome() {
  const id = $("#rollQuem") && $("#rollQuem").value;
  return id && S.fichas[id] ? S.fichas[id].nome : S.isM ? "Mestre" : "Jogador";
}
function bindRolagens() {
  const sec = () => false;
  const para = () => S.paraRolagem || "";
  $("#paraSel").onchange = () => {
    S.paraRolagem = $("#paraSel").value;
    const ci = $("#chatIn");
    if (ci) ci.placeholder = S.paraRolagem ? "Mensagem privada…" : "Falar na mesa…";
  };
  {
    const bd = $("#btnDoc");
    if (bd) bd.onclick = novoDocumento;
  }
  $$("[data-quick]").forEach(
    b =>
      (b.onclick = () => {
        $("#rollExpr").value = b.dataset.quick;
        $("#fRoll").requestSubmit();
      })
  );
  $("#fRoll").onsubmit = ev => {
    ev.preventDefault();
    const ex = $("#rollExpr").value.trim() || "1d20";
    const r = rollExpr(ex);
    if (!r) {
      toast("Expressão inválida. Use algo como 2d6+3.");
      return;
    }
    const n20 = /^1d20\[20\]/.test(r.detail);
    logEntry({
      quem: quemNome(),
      titulo: `Rolagem ${ex}`,
      total: r.total,
      det: r.detail,
      flag: n20 ? "crit" : "",
      para: para()
    });
  };
  $("#btnTeste").onclick = () => {
    const a = +$("#testeAttr").value || 0,
      m = +$("#testeMod").value || 0;
    const r = rollTest(a, m);
    logEntry({
      quem: quemNome(),
      titulo: `Teste (${a}d20)`,
      total: r.total,
      det: `${r.dice.length}d20[${r.dice.join(",")}] fica ${r.mode} ${r.kept}${sgn(m)}`,
      flag: r.kept === 20 ? "crit" : r.kept === 1 ? "fail" : "",
      para: para()
    });
  };
  $("#fChat").onsubmit = ev => {
    ev.preventDefault();
    const t = $("#chatIn").value.trim();
    if (!t) return;
    $("#chatIn").value = "";
    logEntry({ quem: quemNome(), titulo: t, tipo: "chat", para: para() });
  };
  const lim = $("#btnLimparLog");
  if (lim)
    lim.onclick = async () => {
      if (
        !(await confirmBox("Limpar o registro?", "Todas as rolagens e mensagens somem para todos.", "Limpar"))
      )
        return;
      for (const e of S.log) {
        try {
          await S.db.del(P() + "/log/" + e.id);
        } catch (err) {
          fail(err);
          break;
        }
      }
      toast("Registro limpo.");
    };
}

/* ===================== COMBATE ===================== */
function combateHTML() {
  const c = S.combate || { lista: [], turno: 0, rodada: 1 };
  const L = c.lista || [];
  const B = allBest();
  const rows = L.map((x, i) => {
    const f = x.fichaId && S.fichas[x.fichaId];
    const pv = f ? cur(f, "pv") : (x.pv ?? "?");
    const pvMax = f ? derivados(migrar(f)).pvMax : (x.pvMax ?? "?");
    const def = f ? derivados(f).def : (x.def ?? "?");
    const tk = tokenDeEntrada(x);
    return `<div class="cb ${x.tipo} ${i === c.turno ? "now" : ""} ${pv <= 0 ? "down" : ""}"><span class="iv">${x.ini ?? "–"}</span><div style="min-width:0"><div class="cn">${tk ? `<button class="lnk" data-foco="${esc(tk)}" title="Mostrar no mapa">${esc(f ? f.nome : x.nome)} ⌖</button>` : esc(f ? f.nome : x.nome)}${x.el ? ` <span class="tag el-${esc(x.el)}" style="border-color:var(--el);color:var(--el)">${esc(x.el)}</span>` : ""}</div><div class="cs">PV ${pv}/${pvMax} · DEF ${def}${x.vd ? ` · VD ${x.vd}` : ""}${x.atk ? ` · ${esc(x.atk[0])} ${x.atk[1]}d20+${x.atk[2]} · ${esc(x.atk[3])}` : ""}</div></div>
     <div class="act">${f && f.npc && S.isM ? `<button class="btn sm" data-cfic="${esc(x.fichaId)}">Ficha</button><button class="btn sm" data-cfd="${esc(x.fichaId)}" data-d="-5" aria-label="Tirar 5 PV">−5</button><button class="btn sm" data-cfd="${esc(x.fichaId)}" data-d="5" aria-label="Dar 5 PV">+5</button>` : ""}${x.tipo === "npc" && S.isM ? `<button class="rollbtn" data-npcatk="${i}" ${x.atk ? "" : "disabled"}>Atacar</button><button class="btn sm" data-npcdmg="${i}" data-d="-1" aria-label="Tirar 5 PV">−5</button><button class="btn sm" data-npcdmg="${i}" data-d="1" aria-label="Dar 5 PV">+5</button>` : ""}${S.isM ? `<button class="btn sm ghost" data-rm="${i}" aria-label="Tirar do combate">✕</button>` : ""}</div></div>`;
  }).join("");
  return `<div class="row between"><h3>Rodada ${c.rodada || 1}</h3>${S.isM ? `<div class="row"><button class="btn sm" id="btnIni">Rolar iniciativa</button><button class="btn sm primary" id="btnProx" ${L.length ? "" : "disabled"}>Próximo turno</button></div>` : ""}</div>
   ${L.length ? `<div class="cards">${rows}</div>` : `<div class="empty">${S.isM ? "Ninguém em combate. Adicione os agentes e os inimigos abaixo, depois toque em <b>Rolar iniciativa</b>." : "Nenhum combate agora."}</div>`}
   ${
     S.isM
       ? `<button class="btn sm" id="btnTokCena" ${S.viewSid ? "" : "disabled"}>Adicionar os tokens da cena</button>
   <div class="sub">Agentes</div><div class="row">${
     Object.entries(S.fichas)
       .sort(
         (a, b) =>
           !!a[1].npc - !!b[1].npc ||
           String(a[1].nome).localeCompare(String(b[1].nome), "pt-BR", { numeric: true })
       )
       .map(
         ([id, f]) =>
           `<button class="btn sm${f.npc ? " ghost" : ""}" data-addpc="${esc(id)}">${esc(f.nome)}</button>`
       )
       .join("") || '<span class="muted small">Crie fichas primeiro.</span>'
   }</div>
   <div class="sub">Bestiário</div><div class="row" style="flex-wrap:nowrap"><select id="bestSel">${B.map((b, i) => `<option value="${i}">${esc(b.n)}${b.el ? " · " + esc(b.el) : ""} · VD ${b.vd}${b.hb ? " (homebrew)" : ""}</option>`).join("")}</select><button class="btn" id="btnAddBest">Adicionar</button></div>
   <div class="muted small" id="bestInfo"></div>
   <button class="btn sm ghost" id="btnFim">Encerrar combate</button>`
       : ""
   }
   <p class="muted small" style="margin:0">Rodada: sua ação → aliados → inimigo. Inimigos rolam os d20 do ataque (fica o maior) + bônus contra a Defesa; 20 natural é crítico e dobra os dados de dano.</p>`;
}
function saveCombate(c) {
  S.combate = c;
  queueSet(P() + "/estado/combate", JSON.parse(JSON.stringify(c)));
  renderPanel();
}
const combBase = () => JSON.parse(JSON.stringify(S.combate || { lista: [], turno: 0, rodada: 1 }));
function bindCombate() {
  $$("[data-foco]").forEach(
    b =>
      (b.onclick = () => {
        if (window.innerWidth <= 760) openTool(null);
        centrarNo(b.dataset.foco);
      })
  );
  if (!S.isM) return;
  const B = allBest();
  {
    const tc = $("#btnTokCena");
    if (tc) tc.onclick = addTokensAoCombate;
  }
  const show = () => {
    const b = B[+$("#bestSel").value];
    if (b)
      $("#bestInfo").textContent =
        `${b.el || "Realidade"} · VD ${b.vd} · DEF ${b.def} · PV ${b.pv}${b.atk ? ` · ${b.atk[0]} ${b.atk[1]}d20+${b.atk[2]} (${b.atk[3]})` : ""}${b.pres ? " · Presença perturbadora " + b.pres : ""} · AGI ${b.at[0]} FOR ${b.at[1]} INT ${b.at[2]} PRE ${b.at[3]} VIG ${b.at[4]}`;
  };
  $("#bestSel").onchange = show;
  show();
  $("#btnAddBest").onclick = () => {
    const b = B[+$("#bestSel").value];
    const c = combBase();
    const n = c.lista.filter(x => x.base === b.n).length;
    c.lista.push({
      id: rid(5),
      tipo: "npc",
      base: b.n,
      nome: b.n + (n ? " " + (n + 1) : ""),
      pv: b.pv,
      pvMax: b.pv,
      def: b.def,
      atk: b.atk,
      el: b.el,
      vd: b.vd,
      agi: b.at[0],
      ini: null
    });
    saveCombate(c);
  };
  $$("[data-addpc]").forEach(
    btn =>
      (btn.onclick = () => {
        const id = btn.dataset.addpc;
        const c = combBase();
        if (c.lista.some(x => x.fichaId === id)) {
          toast("Esse agente já está no combate.");
          return;
        }
        c.lista.push({ id: rid(5), tipo: "pc", fichaId: id, nome: S.fichas[id].nome, ini: null });
        saveCombate(c);
      })
  );
  $("#btnIni").onclick = () => {
    const c = combBase();
    const det = [];
    c.lista.forEach(x => {
      if (x.fichaId) {
        const f = S.fichas[x.fichaId];
        if (!f) return;
        migrar(f);
        const r = rollTest(f.attr.AGI, modPericia(f, "Iniciativa"));
        x.ini = r.total;
        x.nome = f.nome;
        det.push(`${f.nome} ${r.total}`);
      } else {
        const r = rollTest(Math.max(1, x.agi || 1), Math.round((x.vd || 20) / 10));
        x.ini = r.total;
        det.push(`${x.nome} ${x.ini}`);
      }
    });
    c.lista.sort((a, b) => (b.ini ?? -99) - (a.ini ?? -99));
    c.turno = 0;
    c.rodada = 1;
    saveCombate(c);
    logEntry({ quem: "Mestre", titulo: "Iniciativa", total: null, det: det.join(" · ") });
  };
  $("#btnProx").onclick = () => {
    const c = combBase();
    if (!c.lista.length) return;
    c.turno = (c.turno || 0) + 1;
    if (c.turno >= c.lista.length) {
      c.turno = 0;
      c.rodada = (c.rodada || 1) + 1;
    }
    saveCombate(c);
    const x = c.lista[c.turno];
    const f = x.fichaId && S.fichas[x.fichaId];
    logEntry({ quem: "Mestre", titulo: `Vez de ${f ? f.nome : x.nome}`, tipo: "chat" });
  };
  $$("[data-rm]").forEach(
    b =>
      (b.onclick = () => {
        const c = combBase();
        c.lista.splice(+b.dataset.rm, 1);
        if (c.turno >= c.lista.length) c.turno = 0;
        saveCombate(c);
      })
  );
  $$("[data-npcdmg]").forEach(
    b =>
      (b.onclick = () => {
        const c = combBase();
        const x = c.lista[+b.dataset.npcdmg];
        x.pv = Math.max(0, Math.min(x.pvMax, x.pv + +b.dataset.d * 5));
        saveCombate(c);
      })
  );
  $$("[data-npcatk]").forEach(
    b =>
      (b.onclick = () => {
        const x = (S.combate.lista || [])[+b.dataset.npcatk];
        if (!x.atk) {
          toast("Essa ameaça não tem ataque simples: use as habilidades do livro.");
          return;
        }
        const r = rollTest(x.atk[1], x.atk[2]);
        const crit = r.kept === 20;
        const dm = rollExpr(x.atk[3], { critMult: crit ? 2 : 1 });
        logEntry({
          quem: x.nome,
          titulo: `${x.atk[0]} · dano ${dm ? dm.total : "?"}`,
          total: r.total,
          flag: crit ? "crit" : r.kept === 1 ? "fail" : "",
          det: `${r.dice.length}d20[${r.dice.join(",")}] ${r.kept} +${x.atk[2]}${crit ? " · crítico" : ""} → dano ${dm ? dm.detail : x.atk[3]}`
        });
      })
  );
  $("#btnFim").onclick = () => saveCombate({ lista: [], turno: 0, rodada: 1 });
}

/* ===================== ESCUDO DO MESTRE ===================== */
function escudoHTML() {
  if (!S.isM) return `<div class="empty">Só o mestre abre o escudo.</div>`;
  const ids = Object.keys(S.fichas).sort((a, b) => (S.fichas[a].criada || 0) - (S.fichas[b].criada || 0));
  const sb = (f, id, k, lab, max) => {
    const v = cur(f, k);
    return `<div class="label" style="text-align:center;margin-top:2px">${lab}</div><div class="sbar ${k}"><button data-sb="${esc(id)}" data-k="${k}" data-d="-1" aria-label="Diminuir ${lab}">‹</button><div class="t"><i style="width:${Math.max(0, Math.min(100, (v / max) * 100))}%"></i><span>${v} / ${max}</span></div><button data-sb="${esc(id)}" data-k="${k}" data-d="1" aria-label="Aumentar ${lab}">›</button></div>`;
  };
  const cards = ids
    .map(id => {
      const f = migrar(S.fichas[id]);
      const D = derivados(f);
      return `<div class="scard"><div class="top">${avatar(f)}<div style="min-width:0"><div class="nm">${esc(f.nome)}</div><div class="muted small">${esc(f.classe)} · ${esc(f.origem)} · NEX ${f.nex}%</div></div></div>
    <div class="mini">${ATTRS.map(k => `<div><b>${f.attr[k]}</b><span>${k}</span></div>`).join("")}</div>
    <div>${sb(f, id, "pv", "Vida", D.pvMax)}${sb(f, id, "san", "Sanidade", D.sanMax)}${sb(f, id, "pe", "Esforço", D.peMax)}</div>
    <div class="muted small" style="font-family:var(--f-mono)">DEF ${D.def} · RD ${D.rd} · PE/turno ${D.limPE} · DESL ${esc(f.desl || "9m")} · DT ritual ${D.dtRit} · ${esc(D.pat[1])}</div>
    ${[...condAuto(f), ...(f.cond || [])].length ? `<div class="conds">${[...condAuto(f), ...(f.cond || [])].map(c => `<span class="tag red" title="${esc(CONDICOES_LIVRO[c] || "")}">${esc(c)}</span>`).join("")}</div>` : ""}
    <div class="row"><button class="btn sm" data-sopen="${esc(id)}">Abrir ficha</button><button class="btn sm" data-svont="${esc(id)}">Vontade</button><button class="btn sm" data-sperc="${esc(id)}">Percepção</button></div></div>`;
    })
    .join("");
  const peds = (S.pedidos || []).filter(x => S.fichas[x.fichaId]);
  const pedHTML = peds.length
    ? `<div class="banner" style="border-color:var(--purple);color:var(--fg);background:var(--purple-soft)"><b>Pedidos de ficha:</b> ${peds.map(x => `${esc(x.quem || "Jogador")} pede <b>${esc(S.fichas[x.fichaId].nome)}</b> <button class="btn sm" data-sopen="${esc(x.fichaId)}">Ver</button>`).join(" · ")}</div>`
    : "";
  const backup = `<details class="box"><summary style="cursor:pointer"><b>Backup da mesa</b></summary><div class="stack" style="margin-top:10px"><p class="muted small" style="margin:0">Baixa um arquivo com tudo: fichas, NPCs, cenas, tokens, névoa, desenhos, homebrew, anotações e trilhas. Para restaurar, use "Restaurar mesa de um backup" na página inicial.</p><button class="btn" id="btnBkp">Baixar backup da mesa</button></div></details>`;
  // capa da mesa (5p-capa.js) em cima; apagar mesa (5n-gestao.js) embaixo
  return (
    escudoCapaHTML() +
    acessoHTML() +
    pedHTML +
    `<div class="shield">${cards || `<div class="empty">Nenhum agente na mesa ainda.</div>`}</div>
   <div class="sgrid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">
    <div class="box stack"><h3>Anotações do mestre</h3><p class="muted small" style="margin:0">Só você vê. Ganchos, segredos, próximos passos.</p><textarea id="notasM" style="min-height:180px" aria-label="Anotações do mestre">${esc(S.notas)}</textarea><span class="muted small" id="notasSt"></span></div>
    <div class="box stack"><h3>Referência rápida</h3>
     <table class="t dtref"><thead><tr><th>Dificuldade</th><th>DT</th></tr></thead><tbody>${DT_REF.map(([n, v]) => `<tr><td style="font-family:var(--f-body)">${n}</td><td>${v}</td></tr>`).join("")}</tbody></table>
     <p class="muted small" style="margin:0">Presença perturbadora: teste de Vontade contra a DT da criatura; falhar causa o dano mental indicado. Agentes com NEX igual ou acima do indicado são imunes. Fraquezas: Sangue teme Morte, Morte teme Energia, Energia teme Conhecimento, Conhecimento teme Sangue.</p></div>
    <div class="box stack"><h3>Rolagens secretas</h3>
     <div class="row" style="flex-wrap:nowrap"><input type="text" id="secExpr" placeholder="1d20+5" aria-label="Rolagem secreta"><button class="btn primary" id="secRoll">Rolar escondido</button></div>
     <div class="log">${S.secret.length ? S.secret.map(logRow).join("") : `<div class="empty">Rolagens que os jogadores não veem aparecem aqui (somem ao fechar a página).</div>`}</div></div>
   </div>
   ${backup}` +
    escudoApagarHTML()
  );
}
let notasT = null;
function bindEscudo() {
  bindEscudoCapa(); // 5p-capa.js
  bindEscudoApagar(); // 5n-gestao.js
  if (!S.isM) return;
  $$("[data-sb]").forEach(
    b =>
      (b.onclick = () => {
        const id = b.dataset.sb,
          k = b.dataset.k;
        const f = S.fichas[id];
        const max = derivados(f)[k + "Max"];
        f[k] = Math.max(k === "pv" ? -max : 0, Math.min(max, cur(f, k) + +b.dataset.d));
        saveFicha(id);
        renderPanel();
        renderBoard();
      })
  );
  $$("[data-sopen]").forEach(
    b =>
      (b.onclick = () => {
        S.openFicha = b.dataset.sopen;
        openTool("agentes");
      })
  );
  const quick = (id, p) => {
    const f = migrar(S.fichas[id]);
    const a = PERICIAS.find(x => x[0] === p)[1];
    const m = modPericia(f, p);
    const r = rollTest(f.attr[a], m);
    logEntry({
      quem: f.nome,
      titulo: `${p} (pedido do mestre)`,
      total: r.total,
      det: `${r.dice.length}d20[${r.dice.join(",")}] fica ${r.mode} ${r.kept}${sgn(m)}`,
      flag: r.kept === 20 ? "crit" : r.kept === 1 ? "fail" : "",
      secreto: true
    });
  };
  $$("[data-svont]").forEach(b => (b.onclick = () => quick(b.dataset.svont, "Vontade")));
  $$("[data-sperc]").forEach(b => (b.onclick = () => quick(b.dataset.sperc, "Percepção")));
  bindAcesso();
  {
    const bk = $("#btnBkp");
    if (bk) bk.onclick = exportarMesa;
  }
  const ta = $("#notasM");
  ta.oninput = () => {
    S.notas = ta.value;
    $("#notasSt").textContent = "Salvando…";
    clearTimeout(notasT);
    notasT = setTimeout(async () => {
      try {
        await S.db.set(P() + "/mestre/notas", { texto: S.notas });
        $("#notasSt") && ($("#notasSt").textContent = "Salvo");
      } catch (e) {
        fail(e);
      }
    }, 800);
  };
  $("#secRoll").onclick = () => {
    const ex = $("#secExpr").value.trim() || "1d20";
    const r = rollExpr(ex);
    if (!r) {
      toast("Expressão inválida.");
      return;
    }
    logEntry({ quem: "Mestre", titulo: `Secreta ${ex}`, total: r.total, det: r.detail, secreto: true });
  };
}

/* ===================== HOMEBREW ===================== */
const HB_TIPOS = [
  ["ritual", "Ritual"],
  ["habilidade", "Habilidade"],
  ["item", "Item"],
  ["arma", "Arma"],
  ["criatura", "Criatura"]
];
function homebrewHTML() {
  const t = S.hbTipo || "ritual";
  const list = S.homebrew;
  const fieldsFor = {
    ritual: `<div class="fields"><div class="field"><label class="label" for="h_el">Elemento</label><select id="h_el" name="el">${ELEMENTOS.map(e => `<option>${e}</option>`).join("")}</select></div>
    <div class="field"><label class="label" for="h_ef">Efeito</label><select id="h_ef" name="efeito">${["Dano", "Cura", "Defesa", "Suporte"].map(e => `<option>${e}</option>`).join("")}</select></div>
    <div class="field"><label class="label" for="h_c">Custo (PE, vazio = pelo círculo)</label><input type="number" id="h_c" name="custo" min="0"></div>
    <div class="field"><label class="label" for="h_d">Dados (opcional)</label><input type="text" id="h_d" name="dado" placeholder="2d8+2"></div>
    <div class="field"><label class="label" for="h_ci">Círculo</label><select id="h_ci" name="circulo"><option>1</option><option>2</option><option>3</option><option>4</option></select></div></div>
    <div class="fields"><div class="field"><label class="label" for="h_dd">Discente: dados</label><input type="text" id="h_dd" name="dadoD" placeholder="5d8+5"></div>
    <div class="field"><label class="label" for="h_cd">Discente: custo</label><input type="number" id="h_cd" name="custoD" placeholder="3" min="0"></div>
    <div class="field"><label class="label" for="h_dv">Verdadeiro: dados</label><input type="text" id="h_dv" name="dadoV" placeholder="7d8+7"></div>
    <div class="field"><label class="label" for="h_cv">Verdadeiro: custo</label><input type="number" id="h_cv" name="custoV" placeholder="6" min="0"></div></div>
    <p class="muted small" style="margin:0">Deixe Discente e Verdadeiro em branco se o ritual não tiver essas formas.</p>`,
    habilidade: `<div class="fields"><div class="field"><label class="label" for="h_el">Elemento / tipo</label><select id="h_el" name="el">${["Medo", ...ELEMENTOS.filter(e => e !== "Medo")].map(e => `<option>${e}</option>`).join("")}</select></div>
    <div class="field"><label class="label" for="h_c">Custo (PE)</label><input type="number" id="h_c" name="custo" value="0" min="0"></div>
    <div class="field"><label class="label" for="h_d">Dados (opcional)</label><input type="text" id="h_d" name="dado" placeholder="1d6"></div></div>`,
    item: `<div class="fields"><div class="field"><label class="label" for="h_cat">Categoria</label><select id="h_cat" name="cat">${["0", "I", "II", "III", "IV"].map(e => `<option>${e}</option>`).join("")}</select></div>
    <div class="field"><label class="label" for="h_esp">Espaços</label><input type="number" id="h_esp" name="esp" value="1" min="0"></div></div>`,
    arma: `<div class="fields"><div class="field"><label class="label" for="h_d">Dano</label><input type="text" id="h_d" name="dado" value="1d8" required></div>
    <div class="field"><label class="label" for="h_m">Margem</label><input type="number" id="h_m" name="margem" value="20"></div>
    <div class="field"><label class="label" for="h_x">Multiplicador</label><input type="number" id="h_x" name="mult" value="2"></div>
    <div class="field"><label class="label" for="h_p">Perícia</label><select id="h_p" name="pericia"><option>Luta</option><option>Pontaria</option></select></div>
    <div class="field"><label class="label" for="h_g">Grupo</label><select id="h_g" name="grupo"><option>simples</option><option selected>táticas</option><option>pesadas</option></select></div>
    <div class="field"><label class="label" for="h_cat2">Categoria</label><select id="h_cat2" name="cat">${["0", "I", "II", "III", "IV"].map(e => `<option ${e === "I" ? "selected" : ""}>${e}</option>`).join("")}</select></div></div>`,
    criatura: `<div class="fields"><div class="field"><label class="label" for="h_el">Elemento</label><select id="h_el" name="el"><option value="">Humano</option>${ELEMENTOS.map(e => `<option>${e}</option>`).join("")}</select></div>
    <div class="field"><label class="label" for="h_pv">PV</label><input type="number" id="h_pv" name="pv" value="30"></div>
    <div class="field"><label class="label" for="h_def">Defesa</label><input type="number" id="h_def" name="def" value="12"></div>
    <div class="field"><label class="label" for="h_vd">VD</label><input type="number" id="h_vd" name="vd" value="40"></div>
    <div class="field"><label class="label" for="h_atkD">Dados de ataque (d20)</label><input type="number" id="h_atkD" name="atkD" value="2" min="1"></div>
    <div class="field"><label class="label" for="h_atk">Bônus de ataque</label><input type="number" id="h_atk" name="atk" value="5"></div>
    <div class="field"><label class="label" for="h_d">Dano</label><input type="text" id="h_d" name="dado" value="1d8+2"></div>
</div>`
  };
  const meta = h =>
    ({
      ritual: `${ROMAN[+h.circulo || 1]} · ${h.el} · ${h.efeito} · ${h.custo} PE${h.dado ? " · " + h.dado : ""}${h.dadoD ? " · Discente " + h.dadoD : ""}${h.dadoV ? " · Verdadeiro " + h.dadoV : ""}`,
      habilidade: `${h.el || ""}${+h.custo ? ` · ${h.custo} PE` : ""}${h.dado ? " · " + h.dado : ""}`,
      item: `Categoria ${h.cat || "0"} · ${h.esp ?? 1} espaço(s)`,
      arma: `${h.pericia} · ${h.dado} · ${h.margem}/×${h.mult}`,
      criatura: `${h.el || "Realidade"} · VD ${h.vd || "?"} · PV ${h.pv} · DEF ${h.def} · ${h.atkD || 2}d20+${h.atk} (${h.dado})`
    })[h.tipo] || "";
  return `<p class="muted small" style="margin:0">Os nomes e números do livro já estão nas fichas. Aqui vocês cadastram conteúdo próprio da mesa (ou descrições que quiserem guardar): aparece nas fichas, no bestiário e para todo mundo.</p>
   <form class="box stack" id="fHB"><div class="tabs2">${HB_TIPOS.map(([k, n]) => `<button type="button" data-hbt="${k}" aria-pressed="${t === k}">${n}</button>`).join("")}</div>
    <div class="field"><label class="label" for="h_n">Nome</label><input type="text" id="h_n" name="nome" maxlength="50" required></div>
    ${fieldsFor[t]}
    <div class="field"><label class="label" for="h_desc">Descrição</label><textarea id="h_desc" name="desc" maxlength="600" style="min-height:70px"></textarea></div>
    <button class="btn primary">Criar ${HB_TIPOS.find(x => x[0] === t)[1].toLowerCase()}</button></form>
   ${HB_TIPOS.map(([k, n]) => {
     const l = list.filter(h => h.tipo === k);
     return l.length
       ? `<div class="sub">${n}s</div><div class="cards">${l.map(h => `<div class="hb el-${esc(h.el || "Medo")}"><div class="row between"><span class="hn">${esc(h.nome)}</span>${h.autor === S.uid || S.isM ? `<button class="btn sm ghost" data-delhb="${esc(h.id)}" aria-label="Apagar">✕</button>` : ""}</div><span class="muted small" style="font-family:var(--f-mono)">${esc(meta(h))}</span>${h.desc ? `<span class="small">${esc(h.desc)}</span>` : ""}</div>`).join("")}</div>`
       : "";
   }).join("")}
   ${!list.length ? `<div class="empty">Nada criado ainda.</div>` : ""}`;
}
function bindHomebrew() {
  $$("[data-hbt]").forEach(
    b =>
      (b.onclick = () => {
        S.hbTipo = b.dataset.hbt;
        renderPanel();
      })
  );
  $("#fHB").onsubmit = async e => {
    e.preventDefault();
    const o = { tipo: S.hbTipo || "ritual", autor: S.uid, criada: Date.now() };
    $$("#fHB [name]").forEach(el => (o[el.name] = el.type === "number" ? +el.value || 0 : el.value.trim()));
    if ([o.dado, o.dadoD, o.dadoV].some(x => x && !parseExpr(x))) {
      toast("Os dados precisam ser algo como 2d6+3.");
      return;
    }
    try {
      await S.db.add(P() + "/homebrew", o);
      toast(`${o.nome} criado.`);
      $("#fHB").reset();
    } catch (err) {
      fail(err);
    }
  };
  $$("[data-delhb]").forEach(
    b =>
      (b.onclick = async () => {
        const h = S.homebrew.find(x => x.id === b.dataset.delhb);
        if (!(await confirmBox("Apagar " + h.nome + "?", "Some da mesa para todos."))) return;
        try {
          await S.db.del(P() + "/homebrew/" + h.id);
        } catch (e) {
          fail(e);
        }
      })
  );
}

/* ===================== REGRAS ===================== */
function regrasHTML() {
  const tabs = [
    ["testes", "Testes"],
    ["criacao", "Criação"],
    ["classes", "Classes"],
    ["nex", "NEX"],
    ["combate", "Combate"],
    ["rituais", "Rituais"],
    ["equip", "Equipamento"],
    ["interludio", "Interlúdio"],
    ["condicoes", "Condições"],
    ["ameacas", "Ameaças"]
  ];
  const t = S.ruleTab;
  const body = {
    testes: `<p>Role 1d20 por ponto do atributo e fique com o maior; com atributo 0, role 2d20 e fique com o menor. Some o grau de treinamento (treinado +5, veterano +10, expert +15) e outros bônus. Igualar ou superar a DT é sucesso.</p><table class="t"><thead><tr><th>Dificuldade</th><th>DT</th></tr></thead><tbody>${DT_REF.map(([n, v]) => `<tr><td>${n}</td><td>${v}</td></tr>`).join("")}</tbody></table>`,
    criacao: `<p>Atributos começam em 1, com 4 pontos para distribuir (máximo 3 na criação); reduzir um atributo para 0 dá 1 ponto extra. Origem: 2 perícias treinadas e um poder. Classe: perícias, proficiências e habilidades. Cada ponto de Intelecto dá uma perícia treinada a mais.</p><table class="t"><thead><tr><th>Origem</th><th>Perícias</th><th>Poder</th></tr></thead><tbody>${Object.entries(
      ORIGENS
    )
      .map(
        ([n, [p, po]]) =>
          `<tr><td>${n}</td><td>${p.join(" e ") || "à escolha do mestre"}</td><td>${po}</td></tr>`
      )
      .join("")}</tbody></table>`,
    classes: `<div class="scroll-x"><table class="t"><thead><tr><th>Classe</th><th>PV</th><th>PE</th><th>SAN</th><th>Perícias</th><th>Trilhas</th></tr></thead><tbody>${Object.entries(
      CLASSES
    )
      .map(
        ([n, c]) =>
          `<tr><td>${n}</td><td>${c.pv}+VIG (+${c.pvN}+VIG)</td><td>${c.pe}+PRE (+${c.peN}+PRE)</td><td>${c.san} (+${c.sanN})</td><td>${c.fixasTxt ? c.fixasTxt + " + " : ""}${c.livres} + INT</td><td>${Object.keys(c.trilhas).join(", ")}</td></tr>`
      )
      .join("")}</tbody></table></div><p class="muted small">Entre parênteses: ganho a cada novo NEX.</p>`,
    nex: `<p>O NEX começa em 5% e sobe de 5 em 5 até 99%. A cada aumento, PV, PE e SAN crescem conforme a classe. O limite de PE por turno é igual ao NEX dividido por 5 (1 em 5%, 20 em 99%).</p><div class="scroll-x"><table class="t"><thead><tr><th>NEX</th><th>Limite PE</th><th>Combatente</th><th>Especialista</th><th>Ocultista</th></tr></thead><tbody>${NEX_OPTS.map(n => `<tr><td>${n}%</td><td>${nexN(n)}</td><td>${CLASSES.Combatente.prog[n]}</td><td>${CLASSES.Especialista.prog[n]}</td><td>${CLASSES.Ocultista.prog[n]}</td></tr>`).join("")}</tbody></table></div>`,
    combate: `<p>Ataque corpo a corpo: Luta (FOR). À distância: Pontaria (AGI). O teste é contra a Defesa do alvo (10 + AGI + bônus). Crítico: o d20 mantido dentro da margem de ameaça multiplica os dados de dano. Armas sem proficiência: −2d20 no ataque.</p><p>Ao chegar a 0 PV, o personagem fica morrendo; mais de três rodadas morrendo na mesma cena e ele morre. Com 0 de Sanidade, fica enlouquecendo.</p>`,
    rituais: `<p>Conjurar exige gestos, componentes do elemento (exceto Medo) e PE pelo círculo: 1º 1 PE, 2º 3 PE, 3º 6 PE, 4º 10 PE. Discente e Verdadeiro somam um custo extra. DT para resistir: 10 + limite de PE + Presença.</p><div class="scroll-x"><table class="t"><thead><tr><th>Ritual</th><th>Elemento</th><th>Círculo</th><th>Execução</th><th>Alcance</th><th>Resistência</th></tr></thead><tbody>${allRituais()
      .map(
        r =>
          `<tr><td>${esc(r.n)}</td><td>${esc(r.el)}</td><td>${r.c}º</td><td>${esc(r.ex)}</td><td>${esc(r.al)}</td><td>${esc(r.res)}</td></tr>`
      )
      .join("")}</tbody></table></div>`,
    equip: `<div class="scroll-x"><table class="t"><thead><tr><th>Arma</th><th>Cat.</th><th>Dano</th><th>Crítico</th><th>Alcance</th><th>Tipo</th><th>Esp.</th></tr></thead><tbody>${ARMAS_LIVRO.map(a => `<tr><td>${a[0]}</td><td>${a[3]}</td><td>${a[4]}</td><td>${a[5]}</td><td>${a[6]}</td><td>${a[7]}</td><td>${a[8]}</td></tr>`).join("")}</tbody></table></div>
    <table class="t"><thead><tr><th>Patente</th><th>PP</th><th>Crédito</th><th>I</th><th>II</th><th>III</th><th>IV</th></tr></thead><tbody>${PATENTES.map(p => `<tr><td>${p[1]}</td><td>${p[0]}</td><td>${p[2]}</td><td>${p[3]}</td><td>${p[4] || "—"}</td><td>${p[5] || "—"}</td><td>${p[6] || "—"}</td></tr>`).join("")}</tbody></table>
    <p class="muted small">Carga: 5 espaços por ponto de Força (2 com Força 0). Acima disso, sobrecarregado; nunca acima do dobro.</p>`,
    interludio: `<p>Ações de interlúdio: ${INTERLUDIO.join(", ")}. Dormir recupera PV e PE iguais ao limite de PE; Relaxar recupera Sanidade da mesma forma. Descanso precário: metade; confortável: dobro; luxuoso: triplo.</p>`,
    condicoes: `<table class="t"><tbody>${Object.entries(CONDICOES_LIVRO)
      .map(([a, b]) => `<tr><td><b>${a}</b></td><td>${b}</td></tr>`)
      .join("")}</tbody></table>`,
    ameacas: `<div class="scroll-x"><table class="t"><thead><tr><th>Ameaça</th><th>Elemento</th><th>VD</th><th>Def.</th><th>PV</th><th>Ataque</th></tr></thead><tbody>${AMEACAS.map(a => `<tr><td>${a[0]}</td><td>${a[1] || "Realidade"}</td><td>${a[2]}</td><td>${a[3]}</td><td>${a[4]}</td><td>${a[6] ? `${a[6][1]}d20+${a[6][2]} · ${a[6][3]}` : "—"}</td></tr>`).join("")}</tbody></table></div>`
  };
  return `<div class="tabs2">${tabs.map(([k, n]) => `<button data-rt="${k}" aria-pressed="${t === k}">${n}</button>`).join("")}</div><div class="stack">${body[t] || body.testes}</div>
   <p class="muted small">Regras de Ordem Paranormal RPG (Rafael Lange; Jambô Editora) resumidas para a mesa. Os textos completos estão no livro. Simula Ordem é um projeto de fã, não oficial.</p>`;
}
function bindRegras() {
  $$("[data-rt]").forEach(
    b =>
      (b.onclick = () => {
        S.ruleTab = b.dataset.rt;
        renderPanel();
      })
  );
}
</script>
