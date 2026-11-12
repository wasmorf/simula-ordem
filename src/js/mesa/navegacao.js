"use strict";
/* Barra de ferramentas (trilho e barra de baixo) e o painel lateral. */
/* ===================== TRILHO / NAVEGAÇÃO ===================== */
function tools() {
  return [
    ["cenas", "Cenas", I.mapa],
    ["tokens", "Tokens", I.token],
    ["agentes", "Agentes", I.agente],
    ["rolagens", "Rolagens", I.dado],
    ["documentos", "Documentos", I.papel],
    ["trilha", "Trilha", I.musica],
    ["combate", "Combate", I.combate],
    ...(S.isM ? [["escudo", "Escudo", I.escudo]] : []),
    ["homebrew", "Homebrew", I.frasco],
    ["regras", "Regras", I.livro],
    ["ajuda", "Como usar", I.ajuda]
  ];
}
function renderRail() {
  const t = tools();
  $("#rail").innerHTML =
    `<button class="tool logo" id="toLobby" aria-label="Voltar às mesas">${I.logo(40)}<span class="tip">Voltar às mesas</span></button><div class="sep"></div>` +
    t
      .map(
        ([k, n, ic]) =>
          `<button class="tool" data-tool="${k}" aria-pressed="${S.tool === k}" aria-label="${n}">${ic}${k === "escudo" && (S.entrada || []).length ? '<i class="badge"></i>' : ""}<span class="tip">${n}</span></button>`
      )
      .join("") +
    `<div class="grow"></div><div class="tag ${S.isM ? "on" : ""}" style="font-size:9px;padding:2px 4px">${S.isM ? "Mestre" : "Agente"}</div>`;
  $("#bottomnav").innerHTML =
    t
      .map(
        ([k, n, ic]) =>
          `<button data-tool="${k}" aria-pressed="${S.tool === k}">${ic}<span>${n}</span></button>`
      )
      .join("") + `<button id="toLobby2">${I.sair}<span>Mesas</span></button>`;
  {
    // marca quando ainda há ferramentas escondidas à direita (o CSS mostra uma sombra)
    const nav = $("#bottomnav");
    const marcar = () => nav.classList.toggle("mais", nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 4);
    nav.onscroll = marcar;
    requestAnimationFrame(marcar);
  }
  $$("[data-tool]").forEach(
    b => (b.onclick = () => openTool(S.tool === b.dataset.tool ? null : b.dataset.tool))
  );
  $("#toLobby").onclick = () => {
    location.hash = "";
  };
  $("#toLobby2").onclick = () => {
    location.hash = "";
  };
}
function openTool(k) {
  S.tool = k;
  if (k !== "agentes") S.openFicha = null;
  $$("[data-tool]").forEach(b => b.setAttribute("aria-pressed", b.dataset.tool === k));
  const p = $("#panel");
  p.hidden = !k;
  p.classList.toggle("wide", k === "escudo" || (k === "agentes" && !!S.openFicha));
  if (k === "escudo") subscribeNotas();
  renderPanel();
  if (window.innerWidth > 760)
    requestAnimationFrame(() => {
      if (!S.userMoved) fitView();
    });
}
$("#pclose").onclick = () => openTool(null);
function renderPanel() {
  if (S.solo && S.openFicha !== S.solo) {
    soloFechar(); // personagem fora de mesa: fechar a ficha volta para o lobby (mesa/personagens)
    return;
  }
  if (!S.tool) return;
  const T = {
    ajuda: "Como usar",
    documentos: "Documentos",
    trilha: "Trilha sonora",
    cenas: "Cenas",
    tokens: "Tokens",
    agentes: "Agentes",
    rolagens: "Rolagens",
    combate: "Combate",
    escudo: "Escudo do mestre",
    homebrew: "Homebrew",
    regras: "Regras"
  };
  $("#panel").classList.toggle("wide", S.tool === "escudo" || (S.tool === "agentes" && !!S.openFicha));
  $("#ptitle").textContent =
    S.tool === "agentes" && S.openFicha && S.fichas[S.openFicha] ? "Ficha" : T[S.tool];
  const b = $("#pbody");
  const y = b.scrollTop;
  const fn = {
    ajuda: ajudaHTML,
    documentos: documentosHTML,
    trilha: trilhaHTML,
    cenas: cenasHTML,
    tokens: tokensHTML,
    agentes: () => (S.openFicha ? sheetHTML() : agentesHTML()),
    rolagens: rolagensHTML,
    combate: combateHTML,
    escudo: escudoHTML,
    homebrew: homebrewHTML,
    regras: regrasHTML
  }[S.tool];
  b.innerHTML = fn();
  b.scrollTop = y;
  ({
    ajuda: bindAjuda,
    documentos: bindDocumentos,
    trilha: bindTrilha,
    cenas: bindCenas,
    tokens: bindTokens,
    agentes: () => (S.openFicha ? bindSheet() : bindAgentes()),
    rolagens: bindRolagens,
    combate: bindCombate,
    escudo: bindEscudo,
    homebrew: bindHomebrew,
    regras: bindRegras
  })[S.tool]();
  if (S.tool === "rolagens") renderLog();
}
function isEditing() {
  const a = document.activeElement;
  return a && $("#pbody").contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && a.type !== "checkbox";
}

/* (tabuleiro: ver mapa/tabuleiro) */
