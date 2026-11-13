"use strict";
/* Painel Regras: resumo das regras do livro em abas. */
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
    ["ameacas", "Ameaças"],
    ["suplementos", "Suplementos"]
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
    ameacas: `<div class="scroll-x"><table class="t"><thead><tr><th>Ameaça</th><th>Elemento</th><th>VD</th><th>Def.</th><th>PV</th><th>Ataque</th></tr></thead><tbody>${AMEACAS.map(a => `<tr><td>${a[0]}</td><td>${a[1] || "Pessoa ou animal"}</td><td>${a[2]}</td><td>${a[3]}</td><td>${a[4] ?? "?"}</td><td>${a[6] ? `${a[6][1]}d20+${a[6][2]} · ${a[6][3]}` : "—"}</td></tr>`).join("")}</tbody></table></div>`
  };
  return `<div class="tabs2">${tabs.map(([k, n]) => `<button data-rt="${k}" aria-pressed="${t === k}">${n}</button>`).join("")}</div><div class="stack">${t === "suplementos" ? regrasSuplementosHTML() : body[t] || body.testes}</div>
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
