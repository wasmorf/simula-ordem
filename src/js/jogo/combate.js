"use strict";
/* Painel Combate: iniciativa, turnos, ataques do bestiário. */
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
  // criaturas no combate: abrir a ficha e mudar PV direto (ficha/criaturas)
  $$("[data-cfic]").forEach(
    b =>
      (b.onclick = () => {
        S.openFicha = b.dataset.cfic;
        S.sheetTab = "principal";
        openTool("agentes");
      })
  );
  $$("[data-cfd]").forEach(
    b =>
      (b.onclick = () => {
        const f = S.fichas[b.dataset.cfd];
        if (!f) return;
        const max = derivados(migrar(f)).pvMax;
        f.pv = Math.max(-max, Math.min(max, cur(f, "pv") + +b.dataset.d));
        saveFicha(b.dataset.cfd, true);
        renderPanel();
        renderBoard();
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
