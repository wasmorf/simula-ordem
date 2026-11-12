"use strict";
/* Escudo do mestre: capa, acesso, anotações, tabelas rápidas. */
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
  // capa da mesa (mesa/capa) em cima; apagar mesa (mestre/gestao) embaixo
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
  bindEscudoCapa(); // mesa/capa
  bindEscudoApagar(); // mestre/gestao
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
