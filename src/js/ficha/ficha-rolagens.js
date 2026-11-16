"use strict";
/* Ficha: testes de perícia, ataques e rituais. */
/* ---------- rolagens da ficha ---------- */
/* Teste de perícia da ficha: rola, registra e devolve o resultado (r.total) ou null.
   opc.perito: gastar PE no Perito; opc.titulo: outro nome no registro (ex.: "Investigação · DT 15").
   Usado pela ficha (testePericia) e pelo mestre do Jogar sozinho. */
function rolarPericia(f, p, opc = {}) {
  const a = PERICIAS.find(x => x[0] === p)[1];
  let mod = modPericia(f, p);
  let extra = "";
  const D = derivados(f);
  if (opc.perito) {
    if (!grau(f, p)) {
      toast("Perito só funciona em perícia treinada.");
      return null;
    }
    if (cur(f, "pe") < D.perito[1]) {
      toast("PE insuficiente para Perito.");
      return null;
    }
    f.pe = cur(f, "pe") - D.perito[1];
    const r = rollExpr(D.perito[2]);
    mod += r.total;
    extra = ` · Perito ${r.detail} (−${D.perito[1]} PE)`;
  }
  const pen = penalidade(f, { tipo: "pericia", attr: a, nome: p });
  mod += pen.mod;
  const r = rollTest(f.attr[a], mod, pen.dados);
  logEntry({
    quem: f.nome,
    titulo: opc.titulo || p,
    total: r.total,
    det: `${r.dice.length}d20[${r.dice.join(",")}] fica ${r.mode} ${r.kept}${sgn(mod)}${extra}${pen.quem.length ? ` · condições: ${pen.quem.join(", ")}` : ""}`,
    flag: r.kept === 20 ? "crit" : r.kept === 1 ? "fail" : "",
    para: S.paraRolagem || ""
  });
  return r;
}
function testePericia(p) {
  const pc = $("#usarPerito");
  const perito = !!(pc && pc.checked);
  if (!rolarPericia(fA(), p, { perito })) return;
  if (perito) {
    saveFicha(S.openFicha, true);
    renderPanel();
  }
}
/* Ataque com a arma da ficha: rola o teste e o dano, registra e devolve o resultado.
   Usado pela ficha (atacar) e pelos bots do modo Jogar sozinho (sozinho/bots).
   opc.esp: usar o Ataque Especial; opc.noTeste: quanto do bônus dele vai para o teste. */
function rolarAtaque(f, w, opc = {}) {
  const D = derivados(f);
  const corpo = w.pericia === "Luta";
  const attrK = corpo ? (w.agil && f.attr.AGI > f.attr.FOR ? "AGI" : "FOR") : "AGI";
  let mod = modPericia(f, w.pericia) + (+w.bonus || 0);
  let dmgB = corpo ? f.attr[attrK === "AGI" ? "AGI" : "FOR"] : 0;
  dmgB += bonusDanoSemTipo(w);
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
  const useEsp = opc.esp && D.atq;
  if (useEsp) {
    if (cur(f, "pe") < D.atq[1]) {
      toast("PE insuficiente para Ataque Especial.");
      return null;
    }
    f.pe = cur(f, "pe") - D.atq[1];
    const noTeste = Math.max(0, Math.min(D.atq[2], +opc.noTeste || 0));
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
    return null;
  }
  let tot = dm.total + dmgB;
  // danos extras de outro tipo: somam no total e aparecem separados (não multiplicam no crítico)
  const extras = danosExtras(w)
    .map(x => ({ t: x.t || "", r: rollExpr(String(x.v)) }))
    .filter(x => x.r);
  extras.forEach(x => (tot += x.r.total));
  const exTipos = extras.map(x => `${x.r.total} de ${x.t}`).join(", ");
  const exDet = extras.map(x => ` +${/d/i.test(x.r.detail) ? x.r.detail : x.r.total} ${x.t}`).join("");
  let exTxt = "";
  if (extraDmg) {
    const e = rollExpr(extraDmg);
    tot += e.total;
    exTxt = " + " + e.detail;
  }
  const det = `${w.pericia} ${r.dice.length}d20[${r.dice.join(",")}] ${r.kept}${sgn(mod)}${crit ? ` · CRÍTICO ×${mult}` : ""} → dano ${dm.detail}${sgn(dmgB)}${exDet}${exTxt}${notes.length ? " · " + notes.join(", ") : ""}`;
  // as partes do dano com o tipo de cada uma (para resistências e vulnerabilidades)
  const partes = [
    { v: tot - extras.reduce((s, x) => s + x.r.total, 0), t: TIPO_ARMA[w.tipo] || w.tipo || "" }
  ].concat(extras.map(x => ({ v: x.r.total, t: x.t })));
  if (!opc.semRegistro)
    logEntry({
      quem: f.nome,
      titulo: `${w.nome}${opc.alvo ? " em " + opc.alvo : ""} · dano ${tot}${exTipos ? ` (${exTipos})` : ""}`,
      total: r.total,
      flag: crit ? "crit" : r.kept === 1 ? "fail" : "",
      para: S.paraRolagem || "",
      det
    });
  return { r, crit, tot, partes, det, esp: !!useEsp };
}
function atacar(i) {
  const f = fA();
  const w = f.armas[i];
  if (!w) return;
  const esp = $("#usarPoderAtk");
  const a = rolarAtaque(f, w, { esp: esp && esp.checked, noTeste: ($("#atqNoTeste") || {}).value });
  if (a && a.esp) {
    saveFicha(S.openFicha, true);
    renderPanel();
  }
}
/* Conjura um ritual da ficha: paga o PE, rola o dado e registra. A cura vai para quem conjura ou
   para opc.alvo (outra ficha); opc.alvoNome só diz em quem foi. Devolve { total, r, fm, dt } ou null.
   Usado pela ficha e pelo Jogar sozinho. */
function rolarRitual(f, n, k = 0, opc = {}) {
  const r = allRituais().find(x => x.n === n);
  if (!r) return null;
  const D = derivados(f);
  const fm = r.formas[k] || r.formas[0];
  if (r.c > D.circ && !r.hb) {
    toast(`Você ainda não conjura rituais de ${r.c}º círculo.`);
    return null;
  }
  let custo = fm.custo;
  if ((f.cond || []).includes("Alquebrado")) custo += 1;
  if (cur(f, "pe") < custo) {
    toast("PE insuficiente para conjurar.");
    return null;
  }
  f.pe = cur(f, "pe") - custo;
  let total = null,
    det = `${r.el} · ${fm.k} · −${custo} PE${fm.req ? " · requer " + fm.req : ""}`;
  if (fm.dado && parseExpr(fm.dado.replace(/^\+/, ""))) {
    const roll = rollExpr(fm.dado.replace(/^\+/, ""));
    total = roll.total;
    det = `${roll.detail} · ${det}`;
    if (r.tipo === "cura") {
      const a = opc.alvo || f;
      a.pv = Math.min(derivados(a).pvMax, cur(a, "pv") + total);
      det += a === f ? " · cura aplicada" : ` · cura em ${a.nome}`;
    } else if (r.res) det += ` · ${r.res} DT ${D.dtRit}`;
  } else if (r.res) det += ` · ${r.res} DT ${D.dtRit}`;
  const alvoNome = opc.alvo && opc.alvo !== f ? opc.alvo.nome : opc.alvoNome;
  logEntry({
    quem: f.nome,
    titulo: `Ritual · ${r.n}${k ? ` (${fm.k})` : ""}${alvoNome ? " em " + alvoNome : ""}`,
    total,
    det,
    para: S.paraRolagem || ""
  });
  return { total, r, fm, dt: D.dtRit };
}
function conjurar(n, k = 0) {
  const f = fA();
  const r = allRituais().find(x => x.n === n);
  if (!r) return;
  if ($("#semComp") && $("#semComp").checked && r.el !== "Medo") {
    toast("Sem componentes ritualísticos não dá para conjurar este ritual.");
    return;
  }
  if (!rolarRitual(f, n, k)) return;
  saveFicha(S.openFicha, true);
  renderPanel();
}
