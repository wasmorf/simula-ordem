"use strict";
/* Versão do site e aviso de versão nova. */
// prettier-ignore
// (sem espaços de propósito: versões antigas do site procuram exatamente este formato)
const VERSAO_SITE="11/11 13h05";
/* Avisa quando sai uma versão nova do site (o navegador às vezes guarda a antiga) */
(() => {
  let avisou = false;
  async function checar() {
    if (avisou || location.protocol === "file:") return;
    try {
      const r = await fetch(location.pathname + "?v=" + Date.now(), { cache: "no-store" });
      if (!r.ok) return;
      const t = await r.text();
      const m = t.match(/const VERSAO_SITE\s*=\s*"([^"]+)"/);
      if (!m || m[1] === VERSAO_SITE) return;
      avisou = true;
      const b = document.createElement("div");
      b.id = "novaVersao";
      b.setAttribute("role", "status");
      b.innerHTML = `<span>Saiu uma versão nova do site.</span><button class="btn sm primary" id="nvRec">Atualizar agora</button><button class="btn sm ghost" id="nvX" aria-label="Fechar">✕</button>`;
      document.body.appendChild(b);
      $("#nvRec").onclick = () => {
        for (const id in S.dirty)
          if (S.dirty[id])
            try {
              saveFicha(id, true);
            } catch (e) {}
        setTimeout(() => location.replace(location.pathname + "?v=" + Date.now() + location.hash), 600);
      };
      $("#nvX").onclick = () => b.remove();
    } catch (e) {}
  }
  setTimeout(checar, 4000);
  setInterval(checar, 3 * 60 * 1000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) checar();
  });
})();
