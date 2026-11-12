"use strict";
/* Ficha: testes de perícia, ataques e rituais. */
/* ---------- rolagens da ficha ---------- */
function testePericia(p) {
  const f = fA();
  const a = PERICIAS.find(x => x[0] === p)[1];
  let mod = modPericia(f, p);
  let extra = "";
  const pc = $("#usarPerito");
  const D = derivados(f);
  if (pc && pc.checked) {
    if (!grau(f, p)) {
      toast("Perito só funciona em perícia treinada.");
      return;
    }
    if (cur(f, "pe") < D.perito[1]) {
      toast("PE insuficiente para Perito.");
      return;
    }
    f.pe = cur(f, "pe") - D.perito[1];
    const r = rollExpr(D.perito[2]);
    mod += r.total;
    extra = ` · Perito ${r.detail} (−${D.perito[1]} PE)`;
    saveFicha(S.openFicha, true);
  }
  const pen = penalidade(f, { tipo: "pericia", attr: a, nome: p });
  mod += pen.mod;
  const r = rollTest(f.attr[a], mod, pen.dados);
  logEntry({
    quem: f.nome,
    titulo: p,
    total: r.total,
    det: `${r.dice.length}d20[${r.dice.join(",")}] fica ${r.mode} ${r.kept}${sgn(mod)}${extra}${pen.quem.length ? ` · condições: ${pen.quem.join(", ")}` : ""}`,
    flag: r.kept === 20 ? "crit" : r.kept === 1 ? "fail" : "",
    para: S.paraRolagem || ""
  });
  if (pc && pc.checked) renderPanel();
}
function atacar(i) {
  const f = fA();
  const w = f.armas[i];
  if (!w) return;
  const D = derivados(f);
  const corpo = w.pericia === "Luta";
  const attrK = corpo ? (w.agil && f.attr.AGI > f.attr.FOR ? "AGI" : "FOR") : "AGI";
  let mod = modPericia(f, w.pericia) + (+w.bonus || 0);
  let dmgB = (corpo ? f.attr[attrK === "AGI" ? "AGI" : "FOR"] : 0) + (+w.bdano || 0);
  const notes = [];
  let pen = 0;
  if (!profOK(f, w)) {
    pen += 2;
    notes.push("sem proficiência −2d20");
  }
  if (/motosserra/i.test(w.nome)) pen += 1;
  let { marg, mult } = parseCrit(w.crit);
  let extraDice = 0;
  let extraDmg = "";
  (w.mods || []).forEach(m => {
    const md = (MODIFICACOES.find(x => x[0] === m) || [])[3] || {};
    mod += md.atk || 0;
    dmgB += md.dmg || 0;
    marg -= md.marg || 0;
    mult += md.mult || 0;
    extraDice += md.dado || 0;
    if (md.extra) extraDmg = md.extra;
  });
  if (f.origem === "Lutador" && corpo) dmgB += 2;
  if (f.origem === "Militar" && /Fogo/.test(w.emp || w.nome)) dmgB += 2;
  const esp = $("#usarPoderAtk");
  const useEsp = esp && esp.checked && D.atq;
  if (useEsp) {
    if (cur(f, "pe") < D.atq[1]) {
      toast("PE insuficiente para Ataque Especial.");
      return;
    }
    f.pe = cur(f, "pe") - D.atq[1];
    const noTeste = Math.max(0, Math.min(D.atq[2], +($("#atqNoTeste") || {}).value || 0));
    mod += noTeste;
    dmgB += D.atq[2] - noTeste;
    notes.push(`Ataque Especial −${D.atq[1]} PE`);
  }
  const pc = penalidade(f, { tipo: "ataque", attr: attrK, nome: w.pericia, cac: corpo });
  mod += pc.mod;
  if (pc.quem.length) notes.push(`condições: ${pc.quem.join(", ")}`);
  const r = rollTest(f.attr[attrK], mod, pen + pc.dados);
  const crit = r.kept >= marg;
  const dano = String(w.dano).split("/")[0];
  const dm = rollExpr(dano, { critMult: crit ? mult : 1, explode6: false, extraDice });
  if (!dm) {
    toast("Dano inválido. Use algo como 2d6+2.");
    return;
  }
  let tot = dm.total + dmgB;
  let exTxt = "";
  if (extraDmg) {
    const e = rollExpr(extraDmg);
    tot += e.total;
    exTxt = " + " + e.detail;
  }
  logEntry({
    quem: f.nome,
    titulo: `${w.nome} · dano ${tot}`,
    total: r.total,
    flag: crit ? "crit" : r.kept === 1 ? "fail" : "",
    para: S.paraRolagem || "",
    det: `${w.pericia} ${r.dice.length}d20[${r.dice.join(",")}] ${r.kept}${sgn(mod)}${crit ? ` · CRÍTICO ×${mult}` : ""} → dano ${dm.detail}${sgn(dmgB)}${exTxt}${notes.length ? " · " + notes.join(", ") : ""}`
  });
  if (useEsp) {
    saveFicha(S.openFicha, true);
    renderPanel();
  }
}
function conjurar(n, k = 0) {
  const f = fA();
  const r = allRituais().find(x => x.n === n);
  if (!r) return;
  const D = derivados(f);
  const fm = r.formas[k] || r.formas[0];
  if (r.c > D.circ && !r.hb) {
    toast(`Você ainda não conjura rituais de ${r.c}º círculo.`);
    return;
  }
  if ($("#semComp") && $("#semComp").checked && r.el !== "Medo") {
    toast("Sem componentes ritualísticos não dá para conjurar este ritual.");
    return;
  }
  let custo = fm.custo;
  if ((f.cond || []).includes("Alquebrado")) custo += 1;
  if (cur(f, "pe") < custo) {
    toast("PE insuficiente para conjurar.");
    return;
  }
  f.pe = cur(f, "pe") - custo;
  let total = null,
    det = `${r.el} · ${fm.k} · −${custo} PE${fm.req ? " · requer " + fm.req : ""}`;
  if (fm.dado && parseExpr(fm.dado.replace(/^\+/, ""))) {
    const roll = rollExpr(fm.dado.replace(/^\+/, ""));
    total = roll.total;
    det = `${roll.detail} · ${det}`;
    if (r.tipo === "cura") {
      f.pv = Math.min(D.pvMax, cur(f, "pv") + total);
      det += " · cura aplicada";
    } else if (r.res) det += ` · ${r.res} DT ${D.dtRit}`;
  } else if (r.res) det += ` · ${r.res} DT ${D.dtRit}`;
  logEntry({
    quem: f.nome,
    titulo: `Ritual · ${r.n}${k ? ` (${fm.k})` : ""}`,
    total,
    det,
    para: S.paraRolagem || ""
  });
  saveFicha(S.openFicha, true);
  renderPanel();
}
