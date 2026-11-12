<script>
"use strict";
/* Classe Sobrevivente: estágios no lugar do NEX, PE limite 1, sem patente */
const estagioDe = f => Math.max(1, Math.min(5, +f.estagio || 1));
{
  const _d = derivados;
  derivados = function (f) {
    const r = _d(f);
    if (f.classe !== "Sobrevivente") return r;
    const e = estagioDe(f),
      A = f.attr;
    r.pvMax =
      8 +
      A.VIG +
      (e - 1) * 2 +
      (+f.bonusPV || 0) +
      (f.trilha === "Durão" && e >= 2 ? 4 : 0) +
      (f.trilha === "Durão" && e >= 3 ? 2 : 0);
    r.peMax = 2 + A.PRE + (e - 1) + (+f.bonusPE || 0);
    r.sanMax = 8 + (e - 1) * 2 + (+f.bonusSAN || 0);
    r.limPE = 1;
    r.peRod = 1;
    r.dtRit = 11 + A.PRE;
    return r;
  };
}
{
  const _sh = sheetHTML;
  sheetHTML = function (...a) {
    let h = _sh(...a);
    const f = S.fichas[S.openFicha];
    if (!f || f.classe !== "Sobrevivente") return h;
    const e = estagioDe(f);
    h = h.replace(
      /<label class="label" for="s_nex">NEX<\/label><select[\s\S]*?<\/select>/,
      `<label class="label" for="s_est">Estágio</label><select id="s_est" data-estagio>${[1, 2, 3, 4, 5].map(i => `<option value="${i}" ${i === e ? "selected" : ""}>Estágio ${i}</option>`).join("")}</select>`
    );
    h = h.replace(new RegExp(" · NEX " + f.nex + "% · [^<]*</div>"), " · Estágio " + e + "</div>");
    h = h.replace(/\$\{?4-pts\}?/, "");
    {
      const pts = ATTRS.reduce((a, k) => a + f.attr[k], 0) - 5;
      h = h.replace(
        /<span class="muted small">[^<]*(pontos distribuídos|ponto\(s\) livre\(s\)|pontos \(criação: 4[^<]*)<\/span>/,
        `<span class="muted small">${pts === 3 ? "3 pontos distribuídos" : pts > 3 ? `${pts} pontos (criação: 3; +1 no estágio 3)` : `${3 - pts} ponto(s) livre(s)`} · Sobrevivente: 3 pontos</span>`
      );
    }
    h = h.replace(
      /<div class="field"><label class="label" for="s_pp">[\s\S]*?<\/div>\s*<div class="field"><label class="label" for="s_pat">[\s\S]*?<\/select><\/div>/,
      ""
    );
    const P = {
      "10%": "Estágio 2",
      "40%": "Estágio 4",
      "5%": "Estágio 1",
      "15%": "Estágio 3",
      "45%": "Estágio 5"
    };
    h = h.replace(/(<span class="tag[^"]*">)(5|10|15|40|45)%(<\/span>)/g, (m, a, n, b) => a + P[n + "%"] + b);
    return h;
  };
}
{
  const _bs = bindSheet;
  bindSheet = function () {
    _bs();
    const s = $("#s_est");
    const f = S.fichas[S.openFicha];
    if (!s || !f) return;
    s.onchange = () => {
      f.estagio = +s.value;
      f.nex = ESTAGIO_NEX[f.estagio];
      saveFicha(S.openFicha);
      renderPanel();
    };
  };
}
</script>
<script>
"use strict";
/* Aba "Suplementos" na tela de Regras: resumo do Sobrevivente e onde achar cada regra opcional */
{
  const _rh = regrasHTML;
  regrasHTML = function () {
    const sup = S.ruleTab === "suplementos";
    if (sup) S.ruleTab = "testes";
    let h = _rh();
    if (sup) S.ruleTab = "suplementos";
    h = h.replace(
      '</div><div class="stack">',
      `<button data-rt="suplementos" aria-pressed="${sup}">Suplementos</button></div><div class="stack">`
    );
    if (!sup) return h;
    const L = [
      [
        "Sobrevivendo ao Horror (SaH)",
        [
          ["Investigação: atributos negativos, eventos e cenas", "81–86"],
          ["Investigações livres", "86"],
          ["Perseguições", "90"],
          ["Furtividade (cenas furtivas)", "92"],
          ["Fabricação em campo", "94"],
          ["Interesses e buscas pessoais", "95–97"],
          ["Ganhando NEX / separar Nível e NEX", "98–99"],
          ["Alterações por elemento (Sangue, Morte, Conhecimento, Energia)", "100–103"],
          ["Jogando sem Sanidade", "104"],
          ["Ferimentos debilitantes", "105"],
          ["Jogando sem mapa", "106"],
          ["Evolução por patentes", "108–110"],
          ["Compreensão: os limites da conjuração humana / conjuração complexa", "113–117"],
          ["Desastres paranormais", "118"],
          ["Combate narrativo, sem rolagens de dano e coreografia de luta", "119–123"]
        ]
      ],
      [
        "Arquivos Secretos 01",
        [
          ["Transcender com itens", "p. do PDF 56"],
          ["Reter ritual", "p. do PDF 58–59"]
        ]
      ],
      [
        "Arquivos Secretos 03",
        [
          ["Trilha geral", "p. do PDF 119"],
          ["Veículos: regalias e dano", "p. do PDF 128–130"],
          ["Jogando com o animal", "p. do PDF 132–134"]
        ]
      ],
      ["Arquivos Secretos 06", [["Evolução modular", "p. do PDF 80–81"]]]
    ];
    const body = `<div class="box stack"><h3 style="margin:0">Classe Sobrevivente (SaH)</h3>
   <p class="muted small" style="margin:0">Para gente comum que ainda não é agente. Sobe por estágios (1 a 5), um por missão, no lugar do NEX. A ficha do site já calcula tudo ao escolher a classe.</p>
   <table class="t"><tbody><tr><td>PV</td><td>8 + VIG, +2 por estágio</td></tr><tr><td>PE</td><td>2 + PRE, +1 por estágio (limite de PE sempre 1)</td></tr><tr><td>Sanidade</td><td>8, +2 por estágio</td></tr><tr><td>Atributos</td><td>3 pontos (não 4)</td></tr><tr><td>Perícias</td><td>1 + INT à escolha</td></tr><tr><td>Armas</td><td>simples</td></tr><tr><td>Equipamento</td><td>1 item de categoria I e itens de categoria 0; sem patente</td></tr></tbody></table>
   <table class="t"><thead><tr><th>Estágio</th><th>Ganha</th></tr></thead><tbody><tr><td>1</td><td>Empenho (1 PE: +2 no teste)</td></tr><tr><td>2</td><td>Trilha, 1ª habilidade</td></tr><tr><td>3</td><td>+1 em um atributo</td></tr><tr><td>4</td><td>Trilha, 2ª habilidade</td></tr><tr><td>5</td><td>Cicatrizado</td></tr></tbody></table>
   <p class="muted small" style="margin:0">Trilhas: Durão (+4 PV no estágio 2, +2 no 3; Pancada Forte), Esperto (perícia extra; Entendido), Esotérico (sentir energias; Iniciado: 1 ritual de 1º círculo). Com treinamento da Ordem, vira Combatente, Especialista ou Ocultista de NEX 5%.</p></div>
   <div class="box stack"><h3 style="margin:0">Regras opcionais: onde achar</h3><p class="muted small" style="margin:0">O texto completo fica nos livros. Páginas impressas do SaH; nos Arquivos Secretos, a página do PDF.</p>
   ${L.map(([l, it]) => `<div><b>${l}</b><table class="t"><tbody>${it.map(([n, pg]) => `<tr><td>${n}</td><td style="white-space:nowrap">${/PDF/.test(pg) ? pg : "p. " + pg}</td></tr>`).join("")}</tbody></table></div>`).join("")}</div>`;
    return h.replace(/<div class="stack">[\s\S]*$/, `<div class="stack">${body}</div>`);
  };
}
</script>
<script>
"use strict";
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
</script>
