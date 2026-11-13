"use strict";
/* Limites da ficha pelas regras: quantos pontos de atributo, perícias, graus, poderes, rituais e
   itens o agente pode ter no NEX dele. A ficha usa isto para travar o que passaria do limite e para
   mostrar "o que falta escolher". Tudo de regra de limite fica neste arquivo.

   Como funciona a trava: permitido(f, mudança) aplica a mudança numa cópia da ficha e compara os
   problemas() antes e depois. Se algum problema aparece ou aumenta, a mudança não passa. Tirar
   alguma coisa sempre passa, mesmo numa ficha que já estava acima do limite. */

/* As regras valem para agentes. NPCs, criaturas e fichas liberadas pelo mestre ficam livres. */
function regrasAtivas(f) {
  return !!f && !f.npc && !f.criatura && !f.rapido && !f.regrasLivres;
}
/* NEX, estágio, prestígio, bônus e extras: só o mestre muda (ou o dono, fora de mesa ou com a ficha liberada). */
function podeAjustarNivel(f) {
  return canEditFicha(f) && (S.isM || !!S.solo || !regrasAtivas(f));
}
/* Extras que o mestre deu na ficha (homebrew, recompensa): f.extra = { attr, pericias, graus, ... } */
const EXTRAS = [
  ["attr", "Pontos de atributo"],
  ["pericias", "Perícias treinadas"],
  ["graus", "Graus de treinamento"],
  ["poderes", "Poderes de classe"],
  ["paranormais", "Poderes paranormais"],
  ["rituais", "Rituais"]
];
const extraDe = (f, k) => +(f.extra || {})[k] || 0;
const contar = (lista, nome) => (lista || []).filter(x => x === nome).length;
/* Textos da progressão da classe já alcançados (NEX da ficha ou outro). */
function progAte(f, nex = +f.nex || 5) {
  const c = CLASSES[f.classe] || CLASSES.Combatente;
  return Object.entries(c.prog)
    .filter(([n]) => +n <= nex)
    .map(([, t]) => t);
}

/* Todos os números de limite da ficha. */
function limitesFicha(f) {
  const c = CLASSES[f.classe] || CLASSES.Combatente;
  const nex = +f.nex || 5;
  const sob = ehSobrevivente(f);
  const INT = Math.max(0, +f.attr.INT || 0);
  const prog = progAte(f);
  const quantos = re => prog.filter(t => re.test(t)).length;
  const D = derivados(f);

  // Atributos: 4 pontos na criação (Sobrevivente: 3), +1 a cada "aumento de atributo".
  // Máximo 3 na criação; cada aumento deixa um atributo passar disso, até 5.
  const aumentos = quantos(/aumento de atributo/i);
  const attr = {
    total: (sob ? 3 : 4) + aumentos + extraDe(f, "attr"),
    usados: ATTRS.reduce((s, k) => s + (+f.attr[k] || 0), 0) - 5,
    max: Math.min(5, 3 + aumentos + Math.max(0, extraDe(f, "attr"))),
    aumentos
  };

  // Perícias treinadas: origem (2) + classe (fixas + à escolha + INT) + trilha Esperto + extras.
  // Graus (veterano/expert): em cada "grau de treinamento", grauTreino + INT perícias sobem um grau.
  // Treinamento em Perícia: 2 por poder, para treinar ou (a partir de NEX 35%) subir um grau.
  const og = ORIGENS[f.origem] || [[]];
  const graus = PERICIAS.map(([p]) => grau(f, p));
  const per = {
    base:
      (og[0].length || 2) +
      c.fixas.length +
      c.escolhaFixa.length +
      c.livres +
      INT +
      (sob && f.trilha === "Esperto" && nex >= 10 ? 1 : 0) +
      extraDe(f, "pericias"),
    usadas: graus.filter(g => g >= 5).length,
    flex: 2 * contar(f.poderes, "Treinamento em Perícia"),
    grausBase: quantos(/grau de treinamento/i) * ((c.grauTreino || 0) + INT) + extraDe(f, "graus"),
    grausUsados: graus.reduce((s, g) => s + Math.max(0, (g - 5) / 5), 0),
    veteranoLiberado: nex >= 35,
    expertLiberado: nex >= 70
  };
  const excT = Math.max(0, per.usadas - per.base);
  const excG = Math.max(0, per.grausUsados - per.grausBase);
  per.flexUsado = excT + (nex >= 35 ? excG : 0);
  per.flexSobra = per.flex - per.flexUsado;
  per.max = per.base + Math.max(0, per.flex - (nex >= 35 ? excG : 0)); // treinadas possíveis agora
  per.grausMax = per.grausBase + (nex >= 35 ? Math.max(0, per.flex - excT) : 0);

  // Poderes de classe: um em cada "poder de <classe>" e mais um na versatilidade (NEX 50%).
  // Poderes paranormais: um por Transcender.
  const poderes = {
    max:
      quantos(/poder de (combatente|especialista|ocultista)/i) +
      quantos(/versatilidade/i) +
      extraDe(f, "poderes"),
    usados: (f.poderes || []).length
  };
  const paranormais = {
    max: contar(f.poderes, "Transcender") + extraDe(f, "paranormais"),
    usados: (f.paranormais || []).length
  };

  // Rituais: ocultista começa com 3 e aprende 1 a cada NEX; Aprender Ritual dá 1;
  // Sobrevivente Esotérico (Iniciado, estágio 4) dá 1. Círculo máximo vem de derivados().
  const rituais = {
    max:
      (f.classe === "Ocultista" ? 2 + nexN(nex) : 0) +
      contar(f.paranormais, "Aprender Ritual") +
      (sob && f.trilha === "Esotérico" && nex >= 40 ? 1 : 0) +
      extraDe(f, "rituais"),
    usados: (f.rituais || []).length,
    circulo: D.circ
  };

  // Itens por categoria (patente; Sobrevivente: 1 de categoria I) e carga (até o dobro do limite).
  const lim = D.pat;
  const itens = {
    cat: [0, 1, 2, 3, 4].map(i =>
      i === 0 ? Infinity : (sob ? [0, 1, 0, 0, 0][i] : lim[2 + i]) + (+f["catx" + i] || 0)
    ),
    uso: D.usoCat,
    carga: D.carga,
    usados: D.usados
  };
  return { attr, per, poderes, paranormais, rituais, itens, trilhaLiberada: nex >= 10, nex, D };
}

/* O que está acima do que as regras permitem. Cada problema tem um número (quanto passou) e um texto. */
function problemas(f) {
  const P = {};
  if (!regrasAtivas(f)) return P;
  const L = limitesFicha(f);
  const c = CLASSES[f.classe] || CLASSES.Combatente;
  const add = (k, n, texto, aba) => {
    if (n > 0) P[k] = { n, texto, aba };
  };
  const { attr, per } = L;
  add(
    "attr",
    attr.usados - attr.total,
    `Atributos: ${attr.usados - attr.total} ponto(s) acima do permitido`,
    "principal"
  );
  const acima = ATTRS.filter(k => f.attr[k] > attr.max);
  add(
    "attrMax",
    acima.reduce((s, k) => s + f.attr[k] - attr.max, 0),
    `${acima.join(", ")} acima de ${attr.max}${attr.aumentos ? "" : " (máximo na criação)"}`,
    "principal"
  );
  add(
    "attrZero",
    ATTRS.filter(k => f.attr[k] <= 0).length - 1,
    "Só um atributo pode ser reduzido a 0",
    "principal"
  );
  add(
    "pericias",
    per.flexUsado - per.flex,
    `Perícias: ${per.flexUsado - per.flex} treino(s) ou grau(s) acima do permitido`,
    "pericias"
  );
  const grauCedo = PERICIAS.filter(([p]) => {
    const g = grau(f, p);
    return (g >= 10 && !per.veteranoLiberado) || (g >= 15 && !per.expertLiberado);
  }).length;
  add("grauNex", grauCedo, "Veterano só a partir de NEX 35% e expert a partir de 70%", "pericias");
  add(
    "poderes",
    L.poderes.usados - L.poderes.max,
    `Poderes: ${L.poderes.usados - L.poderes.max} acima do permitido`,
    "habilidades"
  );
  const deFora = (f.poderes || []).filter(p => !c.poderes.includes(p));
  add(
    "poderClasse",
    deFora.length,
    `${deFora.join(", ")}: não é poder de ${f.classe.toLowerCase()}`,
    "habilidades"
  );
  add(
    "paranormais",
    L.paranormais.usados - L.paranormais.max,
    `Poderes paranormais: ${L.paranormais.usados - L.paranormais.max} acima (cada um vem de um Transcender)`,
    "habilidades"
  );
  add(
    "rituais",
    L.rituais.usados - L.rituais.max,
    `Rituais: ${L.rituais.usados - L.rituais.max} acima do permitido`,
    "rituais"
  );
  const altos = allRituais().filter(r => (f.rituais || []).includes(r.n) && r.c > L.rituais.circulo);
  add(
    "circulo",
    altos.length,
    `${altos.map(r => r.n).join(", ")}: círculo acima do ${L.rituais.circulo || "permitido"}${L.rituais.circulo ? "º" : ""}`,
    "rituais"
  );
  add("trilha", f.trilha && !L.trilhaLiberada ? 1 : 0, "Trilha só a partir de NEX 10%", "principal");
  ["I", "II", "III", "IV"].forEach((cat, i) => {
    const n = L.itens.uso[i + 1] - L.itens.cat[i + 1];
    add("cat" + (i + 1), n, `Itens de categoria ${cat}: ${n} acima do limite da patente`, "inventario");
  });
  add(
    "carga",
    L.itens.usados - L.itens.carga * 2,
    `Carga: ${L.itens.usados} espaços, acima do dobro do limite (${L.itens.carga * 2})`,
    "inventario"
  );
  return P;
}

/* A mudança pode ser feita? mudar(cópia) altera a cópia da ficha. Devolve { ok, motivo }. */
function permitido(f, mudar) {
  if (!regrasAtivas(f)) return { ok: true };
  const { foto, ...resto } = f; // a foto não entra na conta e deixa a cópia pesada
  const copia = JSON.parse(JSON.stringify(resto));
  mudar(copia);
  const antes = problemas(f),
    depois = problemas(copia);
  for (const k in depois)
    if (depois[k].n > ((antes[k] || {}).n || 0)) return { ok: false, motivo: depois[k].texto };
  return { ok: true };
}
/* Para os botões: tenta a mudança; se a regra não deixa, avisa o motivo e devolve false. */
function trava(f, mudar) {
  const r = permitido(f, mudar);
  if (!r.ok) toast(r.motivo + ".");
  return r.ok;
}

/* O que ainda falta escolher (para a caixa no topo da ficha e o aviso de NEX novo). */
function pendencias(f) {
  if (!regrasAtivas(f)) return [];
  const L = limitesFicha(f);
  const c = CLASSES[f.classe] || CLASSES.Combatente;
  const out = [];
  const add = (n, um, varios, aba) => {
    if (n > 0) out.push({ n, texto: n === 1 ? um : `${n} ${varios}`, aba });
  };
  add(L.attr.total - L.attr.usados, "1 ponto de atributo", "pontos de atributo", "principal");
  add(L.per.base - L.per.usadas, "1 perícia para treinar", "perícias para treinar", "pericias");
  add(
    L.per.grausBase - L.per.grausUsados,
    "1 grau de treinamento (subir uma perícia)",
    "graus de treinamento",
    "pericias"
  );
  add(
    L.per.flexUsado < L.per.flex ? L.per.flex - L.per.flexUsado : 0,
    "1 perícia do Treinamento em Perícia",
    "perícias do Treinamento em Perícia",
    "pericias"
  );
  if (L.trilhaLiberada && !f.trilha) out.push({ n: 1, texto: "a trilha", aba: "principal" });
  add(
    L.poderes.max - L.poderes.usados,
    `1 poder de ${f.classe.toLowerCase()}`,
    `poderes de ${f.classe.toLowerCase()}`,
    "habilidades"
  );
  add(L.paranormais.max - L.paranormais.usados, "1 poder paranormal", "poderes paranormais", "habilidades");
  add(L.rituais.max - L.rituais.usados, "1 ritual", "rituais", "rituais");
  if (L.nex >= 50 && !f.afinidade && !ehSobrevivente(f) && (f.paranormais || []).length)
    out.push({ n: 1, texto: "a afinidade (NEX 50%)", aba: "habilidades" });
  return out;
}

/* Caixa "O que falta escolher" e os avisos de regra, no topo da ficha. */
function regrasFichaHTML(f) {
  if (!regrasAtivas(f) || !canEditFicha(f)) return "";
  const pend = pendencias(f);
  const prob = Object.values(problemas(f));
  if (!pend.length && !prob.length) return "";
  const aba = (x, cls) =>
    `<button type="button" class="pend ${cls}" data-irpara="${x.aba}">${esc(x.texto)}</button>`;
  return `<div class="regras-ficha">
    ${pend.length ? `<div><span class="label">Falta escolher</span><div class="pends">${pend.map(x => aba(x, "")).join("")}</div></div>` : ""}
    ${prob.length ? `<div><span class="label" style="color:var(--red-hi)">Acima do que as regras deixam</span><div class="pends">${prob.map(x => aba(x, "ruim")).join("")}</div><div class="muted small">Tire o que passou do limite ou peça ao mestre para liberar.</div></div>` : ""}
  </div>`;
}

/* Caixa do mestre na aba Principal: regras livres nesta ficha e extras. */
function regrasMestreHTML(f) {
  if (f.npc || f.criatura || f.rapido) return "";
  const pode = S.isM || !!S.solo;
  return `<details class="more"><summary>Regras da ficha${pode ? "" : " (o mestre ajusta)"}</summary><div class="stack" style="margin-top:8px;gap:8px">
    <label class="check"><input type="checkbox" id="regLivres" ${f.regrasLivres ? "checked" : ""} ${pode ? "" : "disabled"}> Regras livres nesta ficha (sem travas)</label>
    <p class="muted small" style="margin:0">Com as travas, a ficha só deixa pôr o que o NEX permite. Para homebrew ou recompensa, dê extras:</p>
    <div class="row" style="flex-wrap:wrap;gap:8px">${EXTRAS.map(
      ([k, n]) =>
        `<div class="field" style="width:132px"><label class="label" for="ex_${k}">${n}</label><input type="number" id="ex_${k}" data-extra="${k}" value="${extraDe(f, k)}" min="-10" max="30" ${pode ? "" : "disabled"}></div>`
    ).join("")}</div></div></details>`;
}

/* Um item novo (categoria cat, esp espaços) cabe? Devolve "" ou o motivo curto, para as listas de itens. */
function itemNaoCabe(f, L, cat, esp) {
  if (!regrasAtivas(f)) return "";
  const k = CAT_N[cat];
  if (k >= 1 && k <= 4 && L.itens.uso[k] + 1 > L.itens.cat[k]) return `categoria ${cat} cheia`;
  if (L.itens.usados + (+esp || 0) > L.itens.carga * 2) return "pesado demais";
  return "";
}
