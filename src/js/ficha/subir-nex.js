"use strict";
/* Subir de NEX guiado: quando o NEX (ou o estágio do Sobrevivente) sobe, mostra o que o agente ganhou
   em cada nível e o que falta escolher. Quem sobe o NEX é o mestre; o jogador vê o aviso na próxima
   vez que abrir a ficha (f.nexVisto guarda até onde ele já viu). */

/* O que muda de um NEX para outro: PV, PE e SAN máximos e as linhas da progressão da classe. */
function ganhosDeNivel(f, de, para) {
  const c = CLASSES[f.classe] || CLASSES.Combatente;
  const antes = derivados({ ...f, nex: de });
  const depois = derivados({ ...f, nex: para });
  const trilha = (f.trilha && c.trilhas[f.trilha]) || null;
  const linhas = Object.entries(c.prog)
    .filter(([n]) => +n > de && +n <= para)
    .map(([n, t]) => {
      // habilidade de trilha: diz qual é, se a trilha já foi escolhida
      const i = TRILHA_NEX.indexOf(+n);
      const qual = /trilha/i.test(t) && trilha && i >= 0 && trilha[i] ? `: ${trilha[i]}` : "";
      return { nivel: ehSobrevivente(f) ? "Estágio " + NEX_ESTAGIO[n] : n + "%", texto: t + qual };
    });
  return {
    pv: depois.pvMax - antes.pvMax,
    pe: depois.peMax - antes.peMax,
    san: depois.sanMax - antes.sanMax,
    linhas
  };
}
const nomeNivel = (f, nex) => (ehSobrevivente(f) ? "estágio " + NEX_ESTAGIO[nex] : "NEX " + nex + "%");

/* Janela "Subiu de NEX": o que ganhou e o que falta escolher (com atalhos para a aba certa). */
function janelaNivel(f, de, para) {
  const g = ganhosDeNivel(f, de, para);
  const pend = pendencias(f);
  const num = (v, n) => (v ? `<span class="tag on">${v > 0 ? "+" : ""}${v} ${n}</span>` : "");
  const h = $("#modalHost");
  h.innerHTML = `<div class="modal-back"><div class="modal nivel-novo" role="dialog" aria-label="Subiu de nível">
    <span class="label">${esc(f.nome)}</span>
    <h3>${nomeNivel(f, de)} → ${nomeNivel(f, para)}</h3>
    <div class="row" style="gap:6px">${num(g.pv, "PV")}${num(g.pe, "PE")}${num(g.san, "SAN")}</div>
    ${
      g.linhas.length
        ? `<div class="stack" style="gap:6px">${g.linhas.map(l => `<div class="condrow" style="border-left-color:var(--purple)"><span class="tag on">${l.nivel}</span><div class="small">${esc(l.texto)}</div><span></span></div>`).join("")}</div>`
        : ""
    }
    ${
      pend.length
        ? `<div class="stack" style="gap:6px"><span class="label">Agora escolha</span><div class="pends">${pend.map(x => `<button type="button" class="pend" data-nvpara="${x.aba}">${esc(x.texto)}</button>`).join("")}</div></div>`
        : `<p class="muted small" style="margin:0">Nada para escolher agora: o site já somou tudo.</p>`
    }
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn primary" id="nvOk">Certo</button></div>
  </div></div>`;
  const fechar = () => (h.innerHTML = "");
  $("#nvOk").onclick = fechar;
  $$("[data-nvpara]").forEach(
    b =>
      (b.onclick = () => {
        fechar();
        S.sheetTab = b.dataset.nvpara;
        renderPanel();
      })
  );
}

/* Muda o NEX da ficha (select de NEX e de estágio). Subindo, mostra a janela de ganhos. */
function mudarNivel(f, id, novoNex) {
  if (!podeAjustarNivel(f)) return;
  const velho = +f.nex || 5;
  if (novoNex === velho) return;
  f.nex = novoNex;
  if (ehSobrevivente(f)) f.estagio = NEX_ESTAGIO[novoNex];
  // o dono vê o aviso quando abrir a ficha; se é ele mesmo quem sobe, já viu
  if (f.dono === S.uid) f.nexVisto = novoNex;
  else if (f.nexVisto == null || f.nexVisto > velho) f.nexVisto = velho;
  saveFicha(id, true);
  renderPanel();
  renderBoard();
  if (novoNex > velho) janelaNivel(f, velho, novoNex);
}

/* Jogador abrindo a própria ficha depois que o mestre subiu o NEX: mostra o aviso uma vez. */
function avisoNivelNovo(f, id) {
  if (!f || S.isM || f.dono !== S.uid || !canEditFicha(f)) return;
  const visto = f.nexVisto;
  if (visto == null || visto >= +f.nex) return;
  f.nexVisto = +f.nex;
  saveFicha(id, true);
  janelaNivel(f, visto, +f.nex);
}
