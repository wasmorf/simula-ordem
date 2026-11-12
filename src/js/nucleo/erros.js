"use strict";
/* Erros: o site guarda os últimos erros desta visita. Em Como usar → "Algo deu errado?"
   dá para copiar um relatório e mandar para quem for consertar. */
const ERROS = [];
function registrarErro(msg, onde = "") {
  ERROS.push({
    quando: new Date().toLocaleTimeString("pt-BR"),
    msg: String(msg || "erro").slice(0, 300),
    onde
  });
  if (ERROS.length > 20) ERROS.shift();
}
window.addEventListener("error", e => registrarErro(e.message, "linha " + e.lineno));
window.addEventListener("unhandledrejection", e => {
  const r = e.reason;
  registrarErro((r && (r.code || r.message)) || r, "promessa");
});
function relatorioErros() {
  return [
    "Simula Ordem · versão " + VERSAO_SITE,
    "Aparelho: " + navigator.userAgent,
    "Tela: " + innerWidth + "×" + innerHeight,
    "Mesa: " +
      (S.mesaId || "nenhuma") +
      " · " +
      (S.isM ? "mestre" : "jogador") +
      (S.testMode ? " · teste" : ""),
    "Painel aberto: " + (S.tool || "nenhum"),
    "",
    ...(ERROS.length
      ? ERROS.map(e => `[${e.quando}] ${e.msg}${e.onde ? " (" + e.onde + ")" : ""}`)
      : ["Nenhum erro registrado nesta visita."])
  ].join("\n");
}
/* Caixa "Algo deu errado?" no fim do Como usar. */
function relatorioHTML() {
  return `<details class="box aj" id="relErros"><summary><b>Algo deu errado?</b>${ERROS.length ? ` <span class="tag red">${ERROS.length} erro${ERROS.length > 1 ? "s" : ""}</span>` : ""}</summary>
   <p>Copie este relatório e mande para quem cuida do site, junto com o que você estava fazendo. Ele não tem senha nem nada pessoal.</p>
   <textarea id="relTexto" readonly rows="6" style="font-family:var(--f-mono);font-size:12px">${esc(relatorioErros())}</textarea>
   <button type="button" class="btn sm" id="relCopiar">Copiar relatório</button></details>`;
}
function bindRelatorio() {
  const b = $("#relCopiar");
  if (!b) return;
  b.onclick = async () => {
    const ta = $("#relTexto");
    try {
      await navigator.clipboard.writeText(ta.value);
      toast("Relatório copiado.");
    } catch (e) {
      ta.select(); // sem permissão de copiar: deixa selecionado para a pessoa copiar
      toast("Selecionei o texto. Copie com Ctrl+C (ou segure e copie no celular).");
    }
  };
}
