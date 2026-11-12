"use strict";
/* Condições nas rolagens (a mais severa vale) e o aviso de Morrendo. */
/* ===================== CONDIÇÕES NAS ROLAGENS =====================
   Regra do livro: condições com o mesmo efeito não se acumulam; vale a mais severa. */
const PEN_COND = {
  // [d20 a tirar, alcance] alcance: tudo | pericia | ataque | ataque-cac | AGI/FOR/VIG… | nome da perícia
  Abalado: [1, "tudo"],
  Apavorado: [2, "pericia"],
  Agarrado: [1, "ataque"],
  Cego: [2, "AGI FOR"],
  Debilitado: [2, "AGI FOR VIG"],
  Fraco: [1, "AGI FOR VIG"],
  Esmorecido: [2, "INT PRE"],
  Frustrado: [1, "INT PRE"],
  Enredado: [1, "ataque"],
  Ofuscado: [1, "ataque Percepção"],
  Fascinado: [2, "Percepção"],
  Surdo: [2, "Iniciativa"],
  Caído: [2, "ataque-cac"],
  Desprevenido: [1, "Reflexos"]
};
const DEF_COND = {
  Desprevenido: 5,
  Vulnerável: 5,
  Indefeso: 10,
  Agarrado: 5,
  Atordoado: 5,
  Cego: 5,
  Surpreendido: 5,
  Exausto: 5,
  Fatigado: 5,
  Enredado: 5,
  Paralisado: 10,
  Inconsciente: 10
};
function condsAtivas(f) {
  return [...new Set([...condAuto(f), ...(f.cond || [])])];
}
// tipo: "pericia" ou "ataque"; attr: atributo usado; nome: perícia; cac: ataque corpo a corpo
function penalidade(f, { tipo, attr, nome, cac }) {
  let max = 0;
  const quem = [];
  for (const c of condsAtivas(f)) {
    const p = PEN_COND[c];
    if (!p) continue;
    const [d, al] = p;
    const alc = al.split(" ");
    const vale =
      alc.includes("tudo") ||
      (tipo === "pericia" && alc.includes("pericia")) ||
      (tipo === "ataque" && alc.includes("ataque")) ||
      (tipo === "ataque" && cac && alc.includes("ataque-cac")) ||
      alc.includes(attr) ||
      alc.includes(nome);
    if (vale) {
      quem.push(c);
      max = Math.max(max, d);
    }
  }
  // proteção sem proficiência: −2d20 em testes de FOR e AGI
  const c0 = CLASSES[f.classe] || {};
  const semProf = (f.protecoes || []).some(
    p =>
      p.usando !== false &&
      (/pesada|Escudo/i.test(p.nome)
        ? !(f.poderes || []).includes("Proteção Pesada")
        : !(c0.prof || []).includes("leves"))
  );
  if (semProf && (attr === "FOR" || attr === "AGI")) {
    max = Math.max(max, 2);
    quem.push("proteção sem proficiência");
  }
  let mod = 0;
  const D = derivados(f);
  if (
    D.usados > D.carga &&
    tipo === "pericia" &&
    /carga/.test((PERICIAS.find(x => x[0] === nome) || [])[2] || "")
  ) {
    mod -= 5;
    quem.push("sobrecarregado −5");
  }
  return { dados: max, mod, quem };
}

/* ===================== MORRENDO ===================== */
function morrendoHTML(f) {
  const pv = cur(f, "pv");
  if (pv > 0) return "";
  const n = +f.morrendo || 0;
  return `<div class="banner" style="border-color:var(--red);color:var(--fg);background:var(--red-soft)"><b>Morrendo.</b> Rodadas morrendo nesta cena: <b style="font-family:var(--f-mono)">${n}/3</b>${n > 3 ? " · <b>o agente morreu</b>" : ""}
   <div class="row" style="margin-top:6px"><button type="button" class="btn sm" id="mrMais">+1 rodada</button><button type="button" class="btn sm ghost" id="mrZera">Zerar</button></div>
   <div class="muted small" style="margin-top:4px">Mais de 3 rodadas morrendo na mesma cena, sem voltar a ter 1 PV, e o agente morre.</div></div>`;
}
