"use strict";
/* Rolagem de dados (1d20, 2d6+3, testes de atributo). */
/* ===================== DADOS ===================== */
function d(n) {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return 1 + (a[0] % n);
}
function rollN(n, f) {
  const r = [];
  for (let i = 0; i < n; i++) r.push(d(f));
  return r;
}
function parseExpr(s) {
  s = String(s || "")
    .replace(/\s+/g, "")
    .toLowerCase();
  if (!s) return null;
  const re = /([+-]?)(\d*d\d+|\d+)/g;
  let m,
    pos = 0;
  const terms = [];
  while ((m = re.exec(s))) {
    if (m.index !== pos) return null;
    pos = re.lastIndex;
    const sign = m[1] === "-" ? -1 : 1;
    const t = m[2];
    if (t.includes("d")) {
      let [n, f] = t.split("d");
      n = n === "" ? 1 : +n;
      f = +f;
      if (n < 1 || n > 60 || f < 2 || f > 1000) return null;
      terms.push({ sign, n, f });
    } else terms.push({ sign, c: +t });
  }
  if (pos !== s.length || !terms.length) return null;
  return terms;
}
function rollExpr(expr, { critMult = 1, explode6 = false, extraDice = 0 } = {}) {
  const terms = parseExpr(expr);
  if (!terms) return null;
  let total = 0;
  const parts = [];
  let first = true;
  for (const t of terms) {
    if (t.c !== undefined) {
      total += t.sign * t.c;
      parts.push((t.sign < 0 ? "−" : "+") + t.c);
      continue;
    }
    let n = t.n;
    if (t.sign > 0) {
      if (first) {
        n += extraDice;
        first = false;
      }
      n *= critMult;
    }
    let r = rollN(n, t.f);
    if (explode6) {
      let ex = r.filter(x => x === 6).length;
      while (ex > 0) {
        const nr = rollN(ex, t.f);
        r = r.concat(nr);
        ex = nr.filter(x => x === 6).length;
      }
    }
    const sum = r.reduce((a, b) => a + b, 0);
    total += t.sign * sum;
    parts.push((t.sign < 0 ? "−" : "+") + r.length + "d" + t.f + "[" + r.join(",") + "]");
  }
  return { total, detail: parts.join(" ").replace(/^\+/, "") };
}
// Teste de Ordem: 1d20 por ponto de atributo, fica com o maior. ≤0: 2d20 (+1 por ponto abaixo de 0), fica com o menor.
function rollTest(attr, mod, penDice = 0) {
  const n = attr - penDice;
  let dice, kept, mode;
  if (n >= 1) {
    dice = rollN(n, 20);
    kept = Math.max(...dice);
    mode = "maior";
  } else {
    dice = rollN(2 + -n, 20);
    kept = Math.min(...dice);
    mode = "menor";
  }
  return { dice, kept, mode, total: kept + mod };
}
const sgn = m => (m ? ` ${m > 0 ? "+" : "−"}${Math.abs(m)}` : "");
