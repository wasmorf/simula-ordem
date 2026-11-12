"use strict";
/* Classe Sobrevivente (SaH): estágios no lugar do NEX e aba Suplementos. */
/* Classe Sobrevivente: estágios no lugar do NEX, PE limite 1, sem patente */
const estagioDe = f => Math.max(1, Math.min(5, +f.estagio || 1));
const ehSobrevivente = f => !!f && f.classe === "Sobrevivente";
/* Números da ficha do Sobrevivente (SaH): PV, PE, SAN por estágio, limite de PE sempre 1. */
function ajustarSobrevivente(f, D) {
  if (!f || f.classe !== "Sobrevivente") return;
  const e = estagioDe(f),
    A = f.attr;
  const durao = f.trilha === "Durão";
  D.pvMax =
    8 + A.VIG + (e - 1) * 2 + (+f.bonusPV || 0) + (durao && e >= 2 ? 4 : 0) + (durao && e >= 3 ? 2 : 0);
  D.peMax = 2 + A.PRE + (e - 1) + (+f.bonusPE || 0);
  D.sanMax = 8 + (e - 1) * 2 + (+f.bonusSAN || 0);
  D.limPE = 1;
  D.peRod = 1;
  D.dtRit = 11 + A.PRE;
}
/* Troca de estágio na ficha (o campo s_est é desenhado em tabPrincipal). */
function bindEstagio(f, id) {
  const s = $("#s_est");
  if (!s || !f) return;
  s.onchange = () => {
    f.estagio = +s.value;
    f.nex = ESTAGIO_NEX[f.estagio];
    saveFicha(id);
    renderPanel();
  };
}
/* Aba Suplementos das Regras: classe Sobrevivente e onde achar as regras opcionais. */
function regrasSuplementosHTML() {
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
  return `<div class="box stack"><h3 style="margin:0">Classe Sobrevivente (SaH)</h3>
   <p class="muted small" style="margin:0">Para gente comum que ainda não é agente. Sobe por estágios (1 a 5), um por missão, no lugar do NEX. A ficha do site já calcula tudo ao escolher a classe.</p>
   <table class="t"><tbody><tr><td>PV</td><td>8 + VIG, +2 por estágio</td></tr><tr><td>PE</td><td>2 + PRE, +1 por estágio (limite de PE sempre 1)</td></tr><tr><td>Sanidade</td><td>8, +2 por estágio</td></tr><tr><td>Atributos</td><td>3 pontos (não 4)</td></tr><tr><td>Perícias</td><td>1 + INT à escolha</td></tr><tr><td>Armas</td><td>simples</td></tr><tr><td>Equipamento</td><td>1 item de categoria I e itens de categoria 0; sem patente</td></tr></tbody></table>
   <table class="t"><thead><tr><th>Estágio</th><th>Ganha</th></tr></thead><tbody><tr><td>1</td><td>Empenho (1 PE: +2 no teste)</td></tr><tr><td>2</td><td>Trilha, 1ª habilidade</td></tr><tr><td>3</td><td>+1 em um atributo</td></tr><tr><td>4</td><td>Trilha, 2ª habilidade</td></tr><tr><td>5</td><td>Cicatrizado</td></tr></tbody></table>
   <p class="muted small" style="margin:0">Trilhas: Durão (+4 PV no estágio 2, +2 no 3; Pancada Forte), Esperto (perícia extra; Entendido), Esotérico (sentir energias; Iniciado: 1 ritual de 1º círculo). Com treinamento da Ordem, vira Combatente, Especialista ou Ocultista de NEX 5%.</p></div>
   <div class="box stack"><h3 style="margin:0">Regras opcionais: onde achar</h3><p class="muted small" style="margin:0">O texto completo fica nos livros. Páginas impressas do SaH; nos Arquivos Secretos, a página do PDF.</p>
   ${L.map(([l, it]) => `<div><b>${l}</b><table class="t"><tbody>${it.map(([n, pg]) => `<tr><td>${n}</td><td style="white-space:nowrap">${/PDF/.test(pg) ? pg : "p. " + pg}</td></tr>`).join("")}</tbody></table></div>`).join("")}</div>`;
}
