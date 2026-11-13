"use strict";
/* Catálogos da ficha (rituais, armas, itens) somando o homebrew da mesa. */
/* ===================== CATÁLOGOS + HOMEBREW ===================== */
const hbOf = t => S.homebrew.filter(h => h.tipo === t);
const ROMAN = ["", "I", "II", "III", "IV"];
const CAT_N = { 0: 0, I: 1, II: 2, III: 3, IV: 4, "—": -1 };
function catPlus(c, k) {
  const v = Math.max(0, (CAT_N[c] ?? 0) + k);
  return ["0", "I", "II", "III", "IV", "V", "VI"][v] || String(v);
}
// Ritual normalizado: {n, el, c, ex, al, alvo, du, res, tipo, formas:[{k, dado, custo, req}], desc, hb}
function allRituais() {
  const base = RITUAIS_LIVRO.map(([n, el, c, ex, al, alvo, du, res, dado, D, V, tipo]) => {
    const custo = CUSTO_CIRCULO[c];
    const formas = [{ k: "Normal", dado, custo, req: "" }];
    if (D) formas.push({ k: "Discente", dado: D[1], custo: custo + D[0], req: D[2] });
    if (V) formas.push({ k: "Verdadeiro", dado: V[1], custo: custo + V[0], req: V[2] });
    return { n, el, c, ex, al, alvo, du, res, tipo, formas, desc: RITUAL_RESUMO[n] || "" }; // resumo: regras/rituais-resumo
  });
  const hb = hbOf("ritual").map(h => {
    const c = +h.circulo || 1;
    const custo = +h.custo || CUSTO_CIRCULO[c];
    const formas = [{ k: "Normal", dado: h.dado || "", custo, req: "" }];
    if (h.dadoD || +h.custoD)
      formas.push({ k: "Discente", dado: h.dadoD || "", custo: +h.custoD || custo + 2, req: "" });
    if (h.dadoV || +h.custoV)
      formas.push({ k: "Verdadeiro", dado: h.dadoV || "", custo: +h.custoV || custo + 5, req: "" });
    return {
      n: h.nome,
      el: h.el || "Medo",
      c,
      ex: "",
      al: "",
      alvo: "",
      du: "",
      res: "",
      tipo: (h.efeito || "").toLowerCase(),
      formas,
      hb: true,
      desc: h.desc || ""
    };
  });
  return base.concat(hb);
}
function armaInfo(nome) {
  const a = ARMAS_LIVRO.find(x => x[0] === nome);
  return a
    ? {
        nome: a[0],
        grupo: a[1],
        emp: a[2],
        cat: a[3],
        dano: a[4],
        crit: a[5],
        alc: a[6],
        tipo: a[7],
        esp: a[8],
        agil: !!a[9]
      }
    : null;
}
function allArmas() {
  return ARMAS_LIVRO.map(a => armaInfo(a[0])).concat(
    hbOf("arma").map(h => ({
      nome: h.nome,
      grupo: h.grupo || "táticas",
      emp: h.pericia === "Pontaria" ? "Fogo · uma mão" : "Corpo a corpo · uma mão",
      cat: h.cat || "I",
      dano: h.dado || "1d6",
      crit:
        (+h.margem < 20 ? h.margem : "") +
        ((+h.mult || 2) > 2 || +h.margem >= 20 ? (+h.margem < 20 ? "/" : "") + "x" + (+h.mult || 2) : ""),
      alc: "—",
      tipo: "",
      esp: 1,
      agil: false,
      hb: true
    }))
  );
}
function allBest() {
  return AMEACAS.map(([n, el, vd, def, pv, pres, atk, at]) => ({ n, el, vd, def, pv, pres, atk, at })).concat(
    hbOf("criatura").map(h => ({
      n: h.nome,
      el: h.el || "",
      vd: +h.vd || 0,
      def: +h.def || 10,
      pv: +h.pv || 10,
      pres: h.desc || "",
      atk: ["Ataque", Math.max(1, +h.atkD || 2), +h.atk || 0, h.dado || "1d6"],
      at: [1, 1, 1, 1, 1],
      hb: true
    }))
  );
}
function parseCrit(s) {
  s = String(s || "x2");
  const m = s.match(/^(\d+)?\/?x?(\d+)?$/);
  let marg = 20,
    mult = 2;
  if (/^\d+$/.test(s)) {
    marg = +s;
  } else if (/^x\d+$/.test(s)) {
    mult = +s.slice(1);
  } else {
    const p = s.split("/");
    marg = +p[0] || 20;
    mult = +(p[1] || "x2").replace("x", "") || 2;
  }
  return { marg, mult };
}
