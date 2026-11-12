"use strict";
/* Criador de mapas: pisos, paredes, portas e acabamento desenhados por código. */
/* =====================================================================
   CRIADOR DE MAPAS — ARTE
   Tudo desenhado por código (arte original), em estilo sombrio:
   fundo preto, paredes grossas escuras, texturas sujas, luz de teto.
   ===================================================================== */
const MA_INK = "#09080b";
function maRng(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function maH(x, y, k = 0) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(k | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}
function maRGB(c) {
  if (c.startsWith("rgb")) {
    const m = c.match(/[\d.]+/g).map(Number);
    return [m[0], m[1], m[2]];
  }
  c = c.replace("#", "");
  if (c.length === 3)
    c = c
      .split("")
      .map(x => x + x)
      .join("");
  const n = parseInt(c, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function maTone(c, k) {
  const [r, g, b] = maRGB(c);
  const t = k > 0 ? 255 : 0,
    a = Math.abs(k);
  const f = v => Math.round(v + (t - v) * a);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
function maA(c, a) {
  const [r, g, b] = maRGB(c);
  return `rgba(${r},${g},${b},${a})`;
}
function maPick(arr, R) {
  return arr[Math.floor(R() * arr.length) % arr.length];
}
function maRR(g, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
function maGrad(g, x, y, w, h, c, k = 0.14) {
  const gr = g.createLinearGradient(x, y, x + w * 0.6, y + h);
  gr.addColorStop(0, maTone(c, k));
  gr.addColorStop(1, maTone(c, -k * 1.3));
  return gr;
}
// traço de tinta proporcional ao tamanho da célula
let MA_S = 64;
function maLW(f = 1) {
  return Math.max(1, MA_S * 0.035 * f);
}
function maBox(g, x, y, w, h, r, c, { ink = true, k = 0.14, lw = 1 } = {}) {
  maRR(g, x, y, w, h, r);
  g.fillStyle = maGrad(g, x, y, w, h, c, k);
  g.fill();
  if (ink) {
    g.lineWidth = maLW(lw);
    g.strokeStyle = MA_INK;
    g.stroke();
  }
}
function maCirc(g, x, y, r, c, { ink = true, k = 0.16, lw = 1 } = {}) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  gr.addColorStop(0, maTone(c, k));
  gr.addColorStop(1, maTone(c, -k));
  g.fillStyle = gr;
  g.fill();
  if (ink) {
    g.lineWidth = maLW(lw);
    g.strokeStyle = MA_INK;
    g.stroke();
  }
}
function maEll(g, x, y, rx, ry, c, { ink = true, rot = 0, k = 0.14 } = {}) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  const gr = g.createRadialGradient(x - rx * 0.3, y - ry * 0.3, 1, x, y, Math.max(rx, ry));
  gr.addColorStop(0, maTone(c, k));
  gr.addColorStop(1, maTone(c, -k));
  g.fillStyle = gr;
  g.fill();
  if (ink) {
    g.lineWidth = maLW();
    g.strokeStyle = MA_INK;
    g.stroke();
  }
}
function maBlob(g, x, y, r, R, c, { n = 9, j = 0.28, ink = true, k = 0.12 } = {}) {
  g.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2,
      rr = r * (1 - j / 2 + R() * j);
    const px = x + Math.cos(a) * rr,
      py = y + Math.sin(a) * rr;
    i ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.closePath();
  const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r * 1.1);
  gr.addColorStop(0, maTone(c, k));
  gr.addColorStop(1, maTone(c, -k));
  g.fillStyle = gr;
  g.fill();
  if (ink) {
    g.lineWidth = maLW();
    g.strokeStyle = MA_INK;
    g.stroke();
  }
}
function maLine(g, pts, c, w, cap = "round") {
  g.beginPath();
  pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
  g.strokeStyle = c;
  g.lineWidth = w;
  g.lineCap = cap;
  g.lineJoin = "round";
  g.stroke();
}
function maSpeck(g, x, y, w, h, R, n, cols, r0, r1) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = maPick(cols, R);
    const r = r0 + R() * (r1 - r0);
    g.beginPath();
    g.arc(x + R() * w, y + R() * h, r, 0, 7);
    g.fill();
  }
}
function maGrime(g, x, y, w, h, R, a = 0.18) {
  for (let i = 0; i < 3; i++) {
    const cx = x + R() * w,
      cy = y + R() * h,
      r = w * (0.2 + R() * 0.5);
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r);
    gr.addColorStop(0, `rgba(0,0,0,${a * R()})`);
    gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr;
    g.fillRect(x, y, w, h);
  }
}

/* ============================ PISOS ============================ */
// cada piso: código de 1 letra (guardado no mapa), nome, categoria, cor de referência, prioridade de borda e função de desenho de 1 célula
function fpPlanks(cols, { n = 4, podre = false, dir = 0 } = {}) {
  return (g, x, y, s, R, cx, cy) => {
    for (let i = 0; i < n; i++) {
      const row = dir ? cx * n + i : cy * n + i,
        col = dir ? cy : cx;
      const c = cols[maH(row, 7, 1) % cols.length];
      const v = ((maH(row, col, 3) % 100) / 100) * 0.12 - 0.06;
      const px = dir ? x + (i * s) / n : x,
        py = dir ? y : y + (i * s) / n,
        pw = dir ? s / n : s,
        ph = dir ? s : s / n;
      g.fillStyle = maTone(c, v);
      g.fillRect(px, py, pw, ph);
      g.strokeStyle = "rgba(255,240,220,.05)";
      g.lineWidth = 1;
      for (let k = 0; k < 2; k++) {
        g.beginPath();
        if (dir) {
          const gx = px + pw * (0.3 + 0.4 * R());
          g.moveTo(gx, py);
          g.bezierCurveTo(gx + pw * 0.2, py + ph * 0.4, gx - pw * 0.2, py + ph * 0.6, gx, py + ph);
        } else {
          const gy = py + ph * (0.3 + 0.4 * R());
          g.moveTo(px, gy);
          g.bezierCurveTo(px + pw * 0.4, gy + ph * 0.2, px + pw * 0.6, gy - ph * 0.2, px + pw, gy);
        }
        g.stroke();
      }
      g.fillStyle = "rgba(0,0,0,.55)";
      dir ? g.fillRect(px, py, Math.max(1, s * 0.015), ph) : g.fillRect(px, py, pw, Math.max(1, s * 0.015));
      if (maH(row, col, 9) % 3 === 0) {
        const j = (dir ? py : px) + s * (0.15 + 0.7 * ((maH(row, col, 11) % 100) / 100));
        g.fillStyle = "rgba(0,0,0,.5)";
        dir ? g.fillRect(px, j, pw, Math.max(1, s * 0.015)) : g.fillRect(j, py, Math.max(1, s * 0.015), ph);
      }
      if (podre && maH(row, col, 13) % 9 === 0) {
        g.fillStyle = "rgba(5,4,6,.85)";
        const hx = dir ? px : x + s * R() * 0.6,
          hy = dir ? y + s * R() * 0.6 : py;
        g.fillRect(hx, hy, dir ? pw : s * 0.35, dir ? s * 0.35 : ph);
      }
    }
    maGrime(g, x, y, s, s, R, podre ? 0.35 : 0.14);
  };
}
function fpTiles(n, c1, c2, grout, { chk = false, jit = 0.05, shine = true } = {}) {
  return (g, x, y, s, R, cx, cy) => {
    g.fillStyle = grout;
    g.fillRect(x, y, s, s);
    const t = s / n,
      gw = Math.max(1, s * 0.02);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const alt = chk && (cx * n + i + cy * n + j) % 2;
        const c = alt ? c2 : c1;
        g.fillStyle = maTone(c, (R() - 0.5) * jit * 2);
        g.fillRect(x + i * t + gw / 2, y + j * t + gw / 2, t - gw, t - gw);
        if (shine) {
          g.fillStyle = "rgba(255,255,255,.05)";
          g.fillRect(x + i * t + gw / 2, y + j * t + gw / 2, t - gw, (t - gw) * 0.3);
        }
      }
    maGrime(g, x, y, s, s, R, 0.12);
  };
}
function fpNoise(base, cols, { n = 40, r0 = 0.004, r1 = 0.02, grime = 0.16, crack = 0 } = {}) {
  return (g, x, y, s, R) => {
    g.fillStyle = base;
    g.fillRect(x, y, s, s);
    maSpeck(g, x, y, s, s, R, n, cols, s * r0, s * r1);
    maGrime(g, x, y, s, s, R, grime);
    if (crack && R() < crack) {
      let px = x + R() * s,
        py = y + R() * s;
      g.beginPath();
      g.moveTo(px, py);
      for (let i = 0; i < 4; i++) {
        px += (R() - 0.5) * s * 0.5;
        py += (R() - 0.5) * s * 0.5;
        g.lineTo(px, py);
      }
      g.strokeStyle = "rgba(0,0,0,.5)";
      g.lineWidth = Math.max(1, s * 0.012);
      g.stroke();
    }
  };
}
function fpGrass(base, cols, { n = 70, len = 0.13 } = {}) {
  return (g, x, y, s, R) => {
    g.fillStyle = base;
    g.fillRect(x, y, s, s);
    maGrime(g, x, y, s, s, R, 0.2);
    for (let i = 0; i < n; i++) {
      const px = x + R() * s,
        py = y + R() * s,
        a = -Math.PI / 2 + (R() - 0.5) * 1.2,
        l = s * len * (0.5 + R());
      g.strokeStyle = maPick(cols, R);
      g.lineWidth = Math.max(1, s * 0.014);
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l);
      g.stroke();
    }
  };
}
function fpStones(cols, grout, { n = 2, round = 0.18 } = {}) {
  return (g, x, y, s, R, cx, cy) => {
    g.fillStyle = grout;
    g.fillRect(x, y, s, s);
    const t = s / n;
    for (let j = 0; j < n; j++) {
      const off = (((cy * n + j) % 2) * t) / 2;
      for (let i = -1; i <= n; i++) {
        const px = x + i * t + off,
          py = y + j * t;
        const c = cols[maH(cx * n + i, cy * n + j, 5) % cols.length];
        g.save();
        g.beginPath();
        g.rect(x, y, s, s);
        g.clip();
        maRR(g, px + s * 0.02, py + s * 0.02, t - s * 0.04, t - s * 0.04, t * round);
        g.fillStyle = maGrad(g, px, py, t, t, c, 0.1);
        g.fill();
        g.restore();
      }
    }
    maGrime(g, x, y, s, s, R, 0.15);
  };
}
function fpWater(c1, c2, { deep = false } = {}) {
  return (g, x, y, s, R) => {
    const gr = g.createLinearGradient(x, y, x + s, y + s);
    gr.addColorStop(0, c1);
    gr.addColorStop(1, c2);
    g.fillStyle = gr;
    g.fillRect(x, y, s, s);
    g.strokeStyle = deep ? "rgba(160,200,230,.10)" : "rgba(190,230,240,.16)";
    g.lineWidth = Math.max(1, s * 0.015);
    for (let i = 0; i < 3; i++) {
      const px = x + R() * s,
        py = y + R() * s,
        w = s * (0.15 + R() * 0.25);
      g.beginPath();
      g.moveTo(px, py);
      g.quadraticCurveTo(px + w / 2, py - s * 0.04, px + w, py);
      g.stroke();
    }
  };
}
function fpLeaves(base, cols) {
  return (g, x, y, s, R) => {
    g.fillStyle = base;
    g.fillRect(x, y, s, s);
    maGrime(g, x, y, s, s, R, 0.25);
    for (let i = 0; i < 26; i++) {
      g.save();
      g.translate(x + R() * s, y + R() * s);
      g.rotate(R() * 7);
      g.fillStyle = maPick(cols, R);
      g.beginPath();
      g.ellipse(0, 0, s * 0.05, s * 0.022, 0, 0, 7);
      g.fill();
      g.restore();
    }
  };
}
function fpFlesh(g, x, y, s, R) {
  g.fillStyle = "#4a0f17";
  g.fillRect(x, y, s, s);
  maGrime(g, x, y, s, s, R, 0.3);
  for (let i = 0; i < 3; i++) {
    g.beginPath();
    let px = x + R() * s,
      py = y + R() * s;
    g.moveTo(px, py);
    for (let k = 0; k < 3; k++) {
      const nx = px + (R() - 0.5) * s * 0.7,
        ny = py + (R() - 0.5) * s * 0.7;
      g.quadraticCurveTo((px + nx) / 2 + (R() - 0.5) * s * 0.3, (py + ny) / 2, nx, ny);
      px = nx;
      py = ny;
    }
    g.strokeStyle = "rgba(20,0,4,.7)";
    g.lineWidth = Math.max(1, s * 0.025);
    g.stroke();
    g.strokeStyle = "rgba(200,40,60,.35)";
    g.lineWidth = Math.max(1, s * 0.01);
    g.stroke();
  }
  for (let i = 0; i < 4; i++) {
    g.fillStyle = "rgba(255,120,130,.12)";
    g.beginPath();
    g.ellipse(x + R() * s, y + R() * s, s * 0.06, s * 0.03, R() * 3, 0, 7);
    g.fill();
  }
}
function fpHex(c1, c2, grout) {
  return (g, x, y, s, R, cx, cy) => {
    g.fillStyle = grout;
    g.fillRect(x, y, s, s);
    const r = s / 6;
    g.save();
    g.beginPath();
    g.rect(x, y, s, s);
    g.clip();
    for (let j = -1; j < 5; j++)
      for (let i = -1; i < 5; i++) {
        const px = x + i * r * 1.75 + (j % 2) * r * 0.87,
          py = y + j * r * 1.5;
        g.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = Math.PI / 6 + (k * Math.PI) / 3;
          g.lineTo(px + Math.cos(a) * r * 0.86, py + Math.sin(a) * r * 0.86);
        }
        g.closePath();
        g.fillStyle = maH(cx * 9 + i, cy * 9 + j, 2) % 4 ? c1 : c2;
        g.fill();
      }
    g.restore();
    maGrime(g, x, y, s, s, R, 0.15);
  };
}
function fpCarpet(base, { pat = 0, c2 } = {}) {
  return (g, x, y, s, R, cx, cy) => {
    g.fillStyle = base;
    g.fillRect(x, y, s, s);
    maSpeck(g, x, y, s, s, R, 60, [maTone(base, 0.08), maTone(base, -0.1)], s * 0.004, s * 0.01);
    if (pat === 1) {
      g.strokeStyle = maA(c2, 0.35);
      g.lineWidth = Math.max(1, s * 0.02);
      g.beginPath();
      g.moveTo(x + s / 2, y);
      g.lineTo(x + s, y + s / 2);
      g.lineTo(x + s / 2, y + s);
      g.lineTo(x, y + s / 2);
      g.closePath();
      g.stroke();
    }
    if (pat === 2) {
      g.fillStyle = maA(c2, 0.28);
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.arc(x + (((i % 2) + 0.5) * s) / 2, y + ((Math.floor(i / 2) + 0.5) * s) / 2, s * 0.07, 0, 7);
        g.fill();
      }
    }
    maGrime(g, x, y, s, s, R, 0.12);
  };
}
function fpGrate(g, x, y, s, R) {
  g.fillStyle = "#1d1f22";
  g.fillRect(x, y, s, s);
  g.strokeStyle = "#3a3e44";
  g.lineWidth = Math.max(1, s * 0.03);
  const n = 5;
  for (let i = 0; i <= n; i++) {
    g.beginPath();
    g.moveTo(x + (i * s) / n, y);
    g.lineTo(x, y + (i * s) / n);
    g.stroke();
    g.beginPath();
    g.moveTo(x + s - (i * s) / n, y + s);
    g.lineTo(x + s, y + s - (i * s) / n);
    g.stroke();
  }
  g.fillStyle = "rgba(0,0,0,.3)";
  g.fillRect(x, y, s, s * 0.03);
  maGrime(g, x, y, s, s, R, 0.2);
}
function fpMarble(base, vein) {
  return (g, x, y, s, R) => {
    g.fillStyle = base;
    g.fillRect(x, y, s, s);
    g.strokeStyle = vein;
    g.lineWidth = Math.max(1, s * 0.01);
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(x + R() * s, y);
      g.bezierCurveTo(x + R() * s, y + s * 0.3, x + R() * s, y + s * 0.7, x + R() * s, y + s);
      g.stroke();
    }
    g.strokeStyle = "rgba(0,0,0,.25)";
    g.strokeRect(x, y, s, s);
    maGrime(g, x, y, s, s, R, 0.08);
  };
}
function fpParquet(c1, c2) {
  return (g, x, y, s, R, cx, cy) => {
    const h = s / 2;
    for (let i = 0; i < 2; i++)
      for (let j = 0; j < 2; j++) {
        const px = x + i * h,
          py = y + j * h,
          vert = (i + j + cx + cy) % 2;
        for (let k = 0; k < 3; k++) {
          g.fillStyle = maTone(k % 2 ? c1 : c2, (R() - 0.5) * 0.12);
          const w = h / 3;
          if (vert) g.fillRect(px + k * w, py, w, h);
          else g.fillRect(px, py + k * w, h, w);
          g.fillStyle = "rgba(0,0,0,.45)";
          if (vert) g.fillRect(px + k * w, py, 1, h);
          else g.fillRect(px, py + k * w, h, 1);
        }
      }
    maGrime(g, x, y, s, s, R, 0.12);
  };
}

const MA_PISOS = [
  // código, id, nome, categoria, cor, prioridade, desenho
  [
    ".",
    "vazio",
    "Vazio (preto)",
    "Básico",
    "#040405",
    0,
    (g, x, y, s) => {
      g.fillStyle = "#040405";
      g.fillRect(x, y, s, s);
    }
  ],
  [
    "c",
    "concreto",
    "Concreto manchado",
    "Interior",
    "#5d605f",
    6,
    fpNoise("#5b5e5d", ["#6a6d6b", "#4c4f4e", "#55584f", "#3f4240"], { n: 70, crack: 0.25, grime: 0.22 })
  ],
  [
    "C",
    "concretoe",
    "Concreto escuro",
    "Interior",
    "#35383a",
    6,
    fpNoise("#36393b", ["#2b2e30", "#41444a", "#2f3234"], { n: 60, crack: 0.3, grime: 0.25 })
  ],
  [
    "m",
    "madeira",
    "Madeira",
    "Interior",
    "#6a4630",
    6,
    fpPlanks(["#6b4630", "#73502f", "#5f3e2a", "#7a5534"])
  ],
  ["M", "madeirae", "Madeira escura", "Interior", "#3c2a1f", 6, fpPlanks(["#3c2a1f", "#46301f", "#33241a"])],
  ["q", "taco", "Taco (escritório)", "Interior", "#8a4a24", 6, fpParquet("#8f4c22", "#7a3e1b")],
  [
    "P",
    "podre",
    "Tábuas podres",
    "Interior",
    "#3b3128",
    6,
    fpPlanks(["#3d3328", "#463a2c", "#2f2820", "#4a3d2e"], { podre: true })
  ],
  [
    "B",
    "ceramica",
    "Cerâmica branca grande",
    "Interior",
    "#cfd3cf",
    6,
    fpTiles(2, "#d3d6d1", "#d3d6d1", "#8d918d", { jit: 0.06 })
  ],
  [
    "x",
    "xadrez",
    "Xadrez preto e branco",
    "Interior",
    "#888",
    6,
    fpTiles(3, "#d8d8d2", "#1e1e22", "#555", { chk: true })
  ],
  ["h", "hexagonal", "Mosaico (banheiro)", "Interior", "#44403c", 6, fpHex("#4b4743", "#a6a29a", "#25221f")],
  [
    "a",
    "azulejo",
    "Azulejo azul-claro (laboratório)",
    "Interior",
    "#8fb3bb",
    6,
    fpTiles(2, "#93b6bd", "#9bbec4", "#5f7b82", { jit: 0.08 })
  ],
  [
    "v",
    "vinil",
    "Vinil verde (hospital)",
    "Interior",
    "#a8bfa8",
    6,
    fpTiles(2, "#aec4ad", "#a4ba9f", "#7a8e78", { jit: 0.05 })
  ],
  [
    "k",
    "escura",
    "Lajota escura",
    "Interior",
    "#25282a",
    6,
    fpTiles(2, "#26292b", "#2c2f31", "#151718", { jit: 0.08 })
  ],
  [
    "g",
    "gradeada",
    "Lajota com grade (corredor)",
    "Interior",
    "#3b3d3c",
    6,
    fpTiles(4, "#3d3f3e", "#3d3f3e", "#232524", { jit: 0.1, shine: false })
  ],
  [
    "r",
    "carpeter",
    "Carpete vinho",
    "Interior",
    "#5a1b24",
    6,
    fpCarpet("#5a1c25", { pat: 2, c2: "#c9a35b" })
  ],
  ["u", "carpetep", "Carpete roxo", "Interior", "#3e1f5a", 6, fpCarpet("#3f205b", { pat: 1, c2: "#a27bff" })],
  ["y", "carpeteg", "Carpete cinza", "Interior", "#3d3f44", 6, fpCarpet("#3e4045")],
  [
    "n",
    "carpetev",
    "Carpete verde-escuro",
    "Interior",
    "#1f3a30",
    6,
    fpCarpet("#1f3a2f", { pat: 1, c2: "#7fbf8f" })
  ],
  ["o", "marmore", "Mármore", "Interior", "#c9c4bb", 6, fpMarble("#cdc8be", "rgba(90,85,80,.35)")],
  ["O", "marmoren", "Mármore negro", "Interior", "#1d1c1f", 6, fpMarble("#1e1d20", "rgba(200,190,170,.18)")],
  ["t", "metal", "Grade metálica", "Interior", "#2a2d31", 6, fpGrate],
  [
    "L",
    "laje",
    "Laje de pedra",
    "Exterior",
    "#5e5a54",
    5,
    fpStones(["#605c55", "#57534c", "#6a655d", "#4f4b45"], "#2e2b28")
  ],
  [
    "s",
    "calcada",
    "Calçada",
    "Exterior",
    "#7b7c78",
    5,
    fpTiles(2, "#7d7e7a", "#76776f", "#4c4d4a", { jit: 0.07, shine: false })
  ],
  [
    "e",
    "paralele",
    "Paralelepípedo",
    "Exterior",
    "#5a5650",
    5,
    fpStones(["#5c5852", "#665f56", "#514d47", "#6e675d"], "#2a2724", { n: 4, round: 0.35 })
  ],
  [
    "A",
    "asfalto",
    "Asfalto",
    "Exterior",
    "#2b2c2e",
    4,
    fpNoise("#2a2b2d", ["#343538", "#232426", "#3c3d40"], {
      n: 110,
      r0: 0.003,
      r1: 0.01,
      crack: 0.15,
      grime: 0.2
    })
  ],
  [
    "G",
    "grama",
    "Grama",
    "Exterior",
    "#2f4426",
    3,
    fpGrass("#2c4124", ["#3c5a2c", "#24361d", "#4a6a34", "#334d27"])
  ],
  [
    "H",
    "gramas",
    "Grama seca",
    "Exterior",
    "#5a5530",
    3,
    fpGrass("#56512e", ["#6d6638", "#4a4527", "#7a7040", "#5e5833"])
  ],
  [
    "T",
    "terra",
    "Terra",
    "Exterior",
    "#4b3826",
    3,
    fpNoise("#4a3726", ["#58432e", "#3c2c1e", "#6a5640", "#2f2318"], {
      n: 60,
      r0: 0.006,
      r1: 0.02,
      grime: 0.25
    })
  ],
  [
    "U",
    "lama",
    "Lama",
    "Exterior",
    "#2f2519",
    3,
    (g, x, y, s, R) => {
      fpNoise("#2f2519", ["#3a2e1f", "#241c13"], { n: 30, grime: 0.3 })(g, x, y, s, R);
      for (let i = 0; i < 3; i++) {
        g.fillStyle = "rgba(200,180,140,.08)";
        g.beginPath();
        g.ellipse(x + R() * s, y + R() * s, s * 0.12, s * 0.05, R() * 3, 0, 7);
        g.fill();
      }
    }
  ],
  [
    "D",
    "areia",
    "Areia",
    "Exterior",
    "#8a7550",
    3,
    fpNoise("#8b7651", ["#9c8760", "#7a6644", "#a8946c"], { n: 80, r0: 0.003, r1: 0.008, grime: 0.1 })
  ],
  [
    "K",
    "cascalho",
    "Cascalho",
    "Exterior",
    "#56524c",
    3,
    (g, x, y, s, R) => {
      g.fillStyle = "#3c3934";
      g.fillRect(x, y, s, s);
      for (let i = 0; i < 45; i++) {
        maEll(
          g,
          x + R() * s,
          y + R() * s,
          s * (0.02 + R() * 0.03),
          s * (0.015 + R() * 0.02),
          maPick(["#6a655d", "#58534c", "#7a746a", "#4a463f"], R),
          { ink: false, rot: R() * 3 }
        );
      }
    }
  ],
  [
    "F",
    "folhas",
    "Chão de floresta",
    "Exterior",
    "#2e2618",
    3,
    fpLeaves("#2a2317", ["#5a3e1c", "#6e4a1e", "#3f3a1c", "#4c2d16", "#2f3a1e"])
  ],
  [
    "N",
    "neve",
    "Neve",
    "Exterior",
    "#d6dde3",
    3,
    fpNoise("#d4dbe1", ["#e6ecf0", "#c3ccd4", "#b8c2cb"], { n: 40, r0: 0.004, r1: 0.02, grime: 0.06 })
  ],
  [
    "R",
    "rocha",
    "Rocha (caverna)",
    "Exterior",
    "#3f3a35",
    4,
    (g, x, y, s, R) => {
      g.fillStyle = "#38332e";
      g.fillRect(x, y, s, s);
      for (let i = 0; i < 5; i++)
        maBlob(
          g,
          x + R() * s,
          y + R() * s,
          s * (0.12 + R() * 0.15),
          R,
          maPick(["#443e38", "#4d463f", "#332e29"], R),
          { ink: false }
        );
      maGrime(g, x, y, s, s, R, 0.3);
    }
  ],
  ["w", "aguar", "Água rasa", "Água", "#2f5560", 1, fpWater("#30586a", "#244652")],
  ["W", "aguaf", "Água funda", "Água", "#14303d", 1, fpWater("#16334a", "#0c1f2c", { deep: true })],
  ["E", "esgoto", "Água de esgoto", "Água", "#2d3a22", 1, fpWater("#334128", "#1f2a17")],
  [
    "Q",
    "pantano",
    "Pântano",
    "Água",
    "#26301e",
    2,
    (g, x, y, s, R) => {
      fpWater("#28331f", "#1c2416")(g, x, y, s, R);
      for (let i = 0; i < 5; i++) {
        g.fillStyle = maPick(["rgba(90,120,50,.5)", "rgba(60,90,40,.5)"], R);
        g.beginPath();
        g.ellipse(x + R() * s, y + R() * s, s * 0.08, s * 0.05, R() * 3, 0, 7);
        g.fill();
      }
    }
  ],
  ["Z", "carne", "Carne (Sangue)", "Paranormal", "#4a0f17", 7, fpFlesh],
  [
    "I",
    "cinzas",
    "Chão queimado",
    "Paranormal",
    "#1f1b19",
    5,
    (g, x, y, s, R) => {
      fpNoise("#1e1a18", ["#2a2522", "#141110", "#3a312b"], { n: 60, crack: 0.4, grime: 0.3 })(g, x, y, s, R);
      for (let i = 0; i < 3; i++) {
        g.fillStyle = "rgba(255,110,40,.35)";
        g.beginPath();
        g.arc(x + R() * s, y + R() * s, s * 0.008, 0, 7);
        g.fill();
      }
    }
  ],
  [
    "J",
    "sangrento",
    "Piso ensanguentado",
    "Paranormal",
    "#3a2a28",
    6,
    (g, x, y, s, R, cx, cy) => {
      fpTiles(2, "#55504c", "#55504c", "#2a2725")(g, x, y, s, R, cx, cy);
      for (let i = 0; i < 3; i++) {
        g.fillStyle = "rgba(110,8,16,.55)";
        g.beginPath();
        g.ellipse(x + R() * s, y + R() * s, s * (0.08 + R() * 0.2), s * (0.05 + R() * 0.12), R() * 3, 0, 7);
        g.fill();
      }
    }
  ],
  [
    "V",
    "vazioe",
    "Vazio dimensional",
    "Paranormal",
    "#0d0716",
    8,
    (g, x, y, s, R) => {
      const gr = g.createRadialGradient(x + s / 2, y + s / 2, 0, x + s / 2, y + s / 2, s * 0.8);
      gr.addColorStop(0, "#1a0d2c");
      gr.addColorStop(1, "#07040c");
      g.fillStyle = gr;
      g.fillRect(x, y, s, s);
      maSpeck(g, x, y, s, s, R, 8, ["rgba(190,140,255,.6)", "rgba(255,255,255,.5)"], s * 0.003, s * 0.008);
    }
  ],
  [
    "X",
    "lodo",
    "Lodo da Morte",
    "Paranormal",
    "#1c1d1f",
    7,
    (g, x, y, s, R) => {
      fpNoise("#1b1c1e", ["#26282b", "#121314", "#2f3134"], { n: 40, grime: 0.35 })(g, x, y, s, R);
      // espirais de lodo
      g.strokeStyle = "rgba(150,150,160,.16)";
      g.lineWidth = Math.max(1, s * 0.02);
      const cx = x + s * (0.3 + R() * 0.4),
        cy = y + s * (0.3 + R() * 0.4);
      g.beginPath();
      for (let a = 0; a < 12; a += 0.25) {
        const r = s * 0.025 * a;
        g[a ? "lineTo" : "moveTo"](cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      }
      g.stroke();
      g.fillStyle = "rgba(0,0,0,.35)";
      g.beginPath();
      g.ellipse(x + R() * s, y + R() * s, s * 0.18, s * 0.1, R() * 3, 0, 7);
      g.fill();
    }
  ],
  [
    "Y",
    "sigilos",
    "Sigilos do Conhecimento",
    "Paranormal",
    "#2a2316",
    7,
    (g, x, y, s, R, cx, cy) => {
      fpTiles(1, "#2b2418", "#2b2418", "#1a150d", { shine: false })(g, x, y, s, R, cx, cy);
      if (R() < 0.55) {
        // um sigilo dourado e apagado
        const mx = x + s * (0.3 + R() * 0.4),
          my = y + s * (0.3 + R() * 0.4),
          r = s * (0.12 + R() * 0.1);
        g.strokeStyle = "rgba(230,180,60,.5)";
        g.lineWidth = Math.max(1, s * 0.018);
        g.beginPath();
        g.arc(mx, my, r, 0, 7);
        const n = 3 + Math.floor(R() * 3);
        for (let i = 0; i < n; i++) {
          const a = R() * 6.28;
          g.moveTo(mx, my);
          g.lineTo(mx + Math.cos(a) * r * 1.35, my + Math.sin(a) * r * 1.35);
        }
        g.stroke();
      }
    }
  ],
  [
    "z",
    "energia",
    "Fendas de Energia",
    "Paranormal",
    "#140f1e",
    8,
    (g, x, y, s, R) => {
      fpNoise("#15101f", ["#1d1630", "#0e0a16", "#241a3a"], { n: 30, grime: 0.2 })(g, x, y, s, R);
      // rachaduras que brilham em cores que não combinam
      const cor = maPick(["rgba(190,90,255,.75)", "rgba(60,230,230,.7)", "rgba(255,90,170,.65)"], R);
      g.strokeStyle = cor;
      g.shadowColor = cor;
      g.shadowBlur = s * 0.08;
      g.lineWidth = Math.max(1, s * 0.022);
      g.beginPath();
      let px = x + R() * s,
        py = y;
      g.moveTo(px, py);
      for (let i = 0; i < 5; i++) {
        px += (R() - 0.5) * s * 0.4;
        py += s / 5;
        g.lineTo(px, py);
      }
      g.stroke();
      g.shadowBlur = 0;
    }
  ]
];
const MA_PISO = {};
MA_PISOS.forEach(
  p => (MA_PISO[p[0]] = { cod: p[0], id: p[1], nome: p[2], cat: p[3], cor: p[4], pri: p[5], fn: p[6] })
);

/* desenha todas as células (ou uma área) de chão */
function maDrawFloor(g, M, s, area) {
  const x0 = area ? Math.max(0, area[0]) : 0,
    y0 = area ? Math.max(0, area[1]) : 0,
    x1 = area ? Math.min(M.w - 1, area[2]) : M.w - 1,
    y1 = area ? Math.min(M.h - 1, area[3]) : M.h - 1;
  MA_S = s;
  for (let cy = y0; cy <= y1; cy++)
    for (let cx = x0; cx <= x1; cx++) {
      const k = M.chao[cy * M.w + cx] || ".";
      const F = MA_PISO[k] || MA_PISO["."];
      g.save();
      g.beginPath();
      g.rect(cx * s, cy * s, s, s);
      g.clip();
      F.fn(g, cx * s, cy * s, s, maRng(maH(cx, cy, k.charCodeAt(0))), cx, cy);
      g.restore();
    }
  // bordas entre pisos diferentes: sombra no piso "de baixo" e espuma na água
  for (let cy = y0; cy <= y1; cy++)
    for (let cx = x0; cx <= x1; cx++) {
      const k = M.chao[cy * M.w + cx] || ".";
      const F = MA_PISO[k] || MA_PISO["."];
      if (k === ".") continue;
      [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0]
      ].forEach(([dx, dy]) => {
        const nx = cx + dx,
          ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= M.w || ny >= M.h) return;
        const nk = M.chao[ny * M.w + nx] || ".";
        if (nk === k) return;
        const N = MA_PISO[nk] || MA_PISO["."];
        const px = cx * s,
          py = cy * s,
          b = s * 0.22;
        let gr;
        if (dx === 0) gr = g.createLinearGradient(0, dy < 0 ? py : py + s, 0, dy < 0 ? py + b : py + s - b);
        else gr = g.createLinearGradient(dx < 0 ? px : px + s, 0, dx < 0 ? px + b : px + s - b, 0);
        if (N.pri > F.pri || nk === ".") {
          gr.addColorStop(0, nk === "." ? "rgba(0,0,0,.6)" : "rgba(0,0,0,.32)");
          gr.addColorStop(1, "rgba(0,0,0,0)");
          g.fillStyle = gr;
          g.fillRect(px, py, s, s);
        }
        if (F.cat === "Água" && N.cat !== "Água" && nk !== ".") {
          const gw = g.createLinearGradient(0, 0, 0, 0);
          g.strokeStyle = "rgba(200,230,235,.28)";
          g.lineWidth = Math.max(1, s * 0.025);
          g.beginPath();
          const R = maRng(maH(cx, cy, dx + 3 * dy));
          if (dx === 0) {
            const yy = dy < 0 ? py + s * 0.05 : py + s * 0.95;
            g.moveTo(px, yy);
            for (let i = 1; i <= 4; i++) g.lineTo(px + (i * s) / 4, yy + (R() - 0.5) * s * 0.05);
          } else {
            const xx = dx < 0 ? px + s * 0.05 : px + s * 0.95;
            g.moveTo(xx, py);
            for (let i = 1; i <= 4; i++) g.lineTo(xx + (R() - 0.5) * s * 0.05, py + (i * s) / 4);
          }
          g.stroke();
        }
        if (N.cat === "Exterior" && F.cat === "Exterior" && N.pri <= 3 && F.pri > 3) {
          /* grama/terra invadindo a calçada: tufos */ const R = maRng(maH(cx, cy, 9 + dx + 3 * dy));
          g.fillStyle = maA(N.cor, 0.8);
          for (let i = 0; i < 5; i++) {
            const t = R();
            const bx = dx === 0 ? px + t * s : dx < 0 ? px : px + s,
              by = dx === 0 ? (dy < 0 ? py : py + s) : py + t * s;
            g.beginPath();
            g.arc(bx, by, s * (0.03 + R() * 0.05), 0, 7);
            g.fill();
          }
        }
      });
    }
}

/* ============================ PAREDES ============================ */
// estilos de parede: grossura (fração da célula), desenho do miolo
function maPatCanvas(s, fn) {
  const c = document.createElement("canvas");
  c.width = c.height = Math.max(8, Math.round(s));
  fn(c.getContext("2d"), c.width);
  return c;
}
const MA_PAREDES = [
  {
    id: "ordem",
    nome: "Escura (estilo base)",
    t: 0.44,
    cor: "#0b0b0d",
    miolo: (g, s) => {
      g.fillStyle = "#0c0c0e";
      g.fillRect(0, 0, s, s);
    },
    borda: "#26262b"
  },
  {
    id: "concreto",
    nome: "Concreto",
    t: 0.26,
    cor: "#55585a",
    miolo: (g, s) => {
      g.fillStyle = "#53575a";
      g.fillRect(0, 0, s, s);
      maSpeck(g, 0, 0, s, s, maRng(3), 40, ["#62666a", "#45494c"], 1, s * 0.02);
    }
  },
  {
    id: "tijolo",
    nome: "Tijolo",
    t: 0.26,
    cor: "#6e3426",
    miolo: (g, s) => {
      g.fillStyle = "#3a2620";
      g.fillRect(0, 0, s, s);
      const R = maRng(5);
      for (let j = 0; j < 4; j++)
        for (let i = -1; i < 3; i++) {
          g.fillStyle = maPick(["#7a3a2a", "#6a3123", "#84432f", "#5e2c20"], R);
          g.fillRect((i * s) / 2 + ((j % 2) * s) / 4 + 1, (j * s) / 4 + 1, s / 2 - 2, s / 4 - 2);
        }
    }
  },
  {
    id: "madeira",
    nome: "Madeira",
    t: 0.22,
    cor: "#5a3c27",
    miolo: (g, s) => {
      const R = maRng(8);
      for (let i = 0; i < 4; i++) {
        g.fillStyle = maPick(["#5d3e28", "#4f3421", "#6a472e"], R);
        g.fillRect(0, (i * s) / 4, s, s / 4);
        g.fillStyle = "rgba(0,0,0,.4)";
        g.fillRect(0, (i * s) / 4, s, 1);
      }
    }
  },
  {
    id: "pedra",
    nome: "Pedra",
    t: 0.32,
    cor: "#5d5850",
    miolo: (g, s) => {
      g.fillStyle = "#2c2926";
      g.fillRect(0, 0, s, s);
      const R = maRng(9);
      for (let j = 0; j < 3; j++)
        for (let i = 0; i < 3; i++) {
          maRR(g, (i * s) / 3 + 1 + R() * 2, (j * s) / 3 + 1 + R() * 2, s / 3 - 3, s / 3 - 3, s * 0.05);
          g.fillStyle = maPick(["#615b52", "#6e675d", "#555048"], R);
          g.fill();
        }
    }
  },
  {
    id: "metal",
    nome: "Metal",
    t: 0.22,
    cor: "#3a3f45",
    miolo: (g, s) => {
      const gr = g.createLinearGradient(0, 0, 0, s);
      gr.addColorStop(0, "#4a5058");
      gr.addColorStop(1, "#2e3237");
      g.fillStyle = gr;
      g.fillRect(0, 0, s, s);
      g.fillStyle = "#1b1d20";
      [
        [0.2, 0.5],
        [0.8, 0.5]
      ].forEach(([a, b]) => {
        g.beginPath();
        g.arc(a * s, b * s, s * 0.04, 0, 7);
        g.fill();
      });
    }
  },
  {
    id: "azulejo",
    nome: "Azulejo branco",
    t: 0.24,
    cor: "#bfc4c2",
    miolo: (g, s) => {
      g.fillStyle = "#8a8f8d";
      g.fillRect(0, 0, s, s);
      for (let j = 0; j < 3; j++)
        for (let i = 0; i < 3; i++) {
          g.fillStyle = "#c6cbc8";
          g.fillRect((i * s) / 3 + 1, (j * s) / 3 + 1, s / 3 - 2, s / 3 - 2);
        }
    }
  },
  {
    id: "vidro",
    nome: "Vidro",
    t: 0.12,
    cor: "#86b5c8",
    miolo: (g, s) => {
      g.fillStyle = "rgba(140,195,215,.75)";
      g.fillRect(0, 0, s, s);
      g.fillStyle = "rgba(255,255,255,.35)";
      g.fillRect(0, s * 0.2, s, s * 0.12);
    }
  },
  {
    id: "rocha",
    nome: "Rocha (caverna)",
    t: 0.5,
    cor: "#2c2824",
    miolo: (g, s) => {
      g.fillStyle = "#2a2622";
      g.fillRect(0, 0, s, s);
      const R = maRng(4);
      for (let i = 0; i < 5; i++)
        maBlob(g, R() * s, R() * s, s * 0.25, R, maPick(["#36312b", "#3f3932", "#2f2a25"], R), {
          ink: false
        });
    }
  },
  {
    id: "sebe",
    nome: "Cerca viva (arbustos)",
    t: 0.44,
    cor: "#24391d",
    miolo: (g, s) => {
      g.fillStyle = "#1a2a15";
      g.fillRect(0, 0, s, s);
      const R = maRng(6);
      for (let i = 0; i < 9; i++)
        maBlob(g, R() * s, R() * s, s * 0.2, R, maPick(["#2c4723", "#355628", "#24391d"], R), { ink: false });
    }
  },
  {
    id: "carne",
    nome: "Carne (Sangue)",
    t: 0.38,
    cor: "#5a1018",
    miolo: (g, s) => {
      g.fillStyle = "#4d0d15";
      g.fillRect(0, 0, s, s);
      const R = maRng(2);
      for (let i = 0; i < 4; i++)
        maBlob(g, R() * s, R() * s, s * 0.22, R, maPick(["#6a1520", "#5a1018", "#7a1a26"], R), {
          ink: false
        });
    }
  },
  {
    id: "morte",
    nome: "Lodo e ossos (Morte)",
    t: 0.36,
    cor: "#202124",
    miolo: (g, s) => {
      g.fillStyle = "#1d1e21";
      g.fillRect(0, 0, s, s);
      const R = maRng(7);
      for (let i = 0; i < 3; i++)
        maBlob(g, R() * s, R() * s, s * 0.2, R, maPick(["#2a2b2f", "#141517"], R), { ink: false });
      for (let i = 0; i < 2; i++) {
        g.fillStyle = "rgba(205,198,180,.55)";
        g.beginPath();
        g.ellipse(R() * s, R() * s, s * 0.12, s * 0.04, R() * 3, 0, 7);
        g.fill();
      }
    }
  },
  {
    id: "energia",
    nome: "Estática (Energia)",
    t: 0.3,
    cor: "#1a1030",
    miolo: (g, s) => {
      g.fillStyle = "#170e2a";
      g.fillRect(0, 0, s, s);
      const R = maRng(11);
      g.lineWidth = Math.max(1, s * 0.05);
      for (let i = 0; i < 3; i++) {
        g.strokeStyle = maPick(["#b45cff", "#3ee6e6", "#ff5aa8"], R);
        g.beginPath();
        g.moveTo(R() * s, 0);
        g.lineTo(R() * s, s * 0.5);
        g.lineTo(R() * s, s);
        g.stroke();
      }
    }
  },
  { id: "cercam", nome: "Cerca de madeira", t: 0.1, cor: "#5a3e28", cerca: "madeira" },
  { id: "cercaa", nome: "Cerca de arame", t: 0.06, cor: "#8a8f94", cerca: "arame" },
  { id: "grade", nome: "Grade de ferro", t: 0.08, cor: "#2a2c30", cerca: "grade" }
];
const MA_PAREDE = {};
MA_PAREDES.forEach(p => (MA_PAREDE[p.id] = p));
// portas e janelas (ficam no lugar de um trecho de parede)
const MA_ABERTURAS = [
  { id: "porta", nome: "Porta de madeira", cor: "#6a4a30" },
  { id: "portat", nome: "Porta trancada (cadeado na mesa)", cor: "#6a4a30" },
  { id: "portam", nome: "Porta de metal", cor: "#4a5058" },
  { id: "portad", nome: "Porta dupla", cor: "#5a3c26" },
  { id: "portaq", nome: "Porta arrombada", cor: "#5a3c26" },
  { id: "portaf", nome: "Porta de ferro (cela)", cor: "#2e3034" },
  { id: "janela", nome: "Janela", cor: "#86b5c8" },
  { id: "janelaq", nome: "Janela quebrada", cor: "#86b5c8" },
  { id: "portao", nome: "Portão de grade", cor: "#2a2c30" },
  { id: "cortina", nome: "Cortina / passagem", cor: "#5a1c25" },
  { id: "secreta", nome: "Passagem secreta (parece parede)", cor: "#0c0c0e" }
];
const MA_ABERT = {};
MA_ABERTURAS.forEach(p => (MA_ABERT[p.id] = p));

// "h,x,y" = linha de cima da célula (x,y); "v,x,y" = linha da esquerda. valor: id da parede ou "a:" + id da abertura + ":" + estilo da parede em volta
function maSegs(M) {
  const H = new Map(),
    Vv = new Map(),
    A = [];
  for (const e of M.paredes || []) {
    const [o, x, y, v] = e.split(",");
    const key = x + "," + y;
    if (v.startsWith("a:")) A.push({ o, x: +x, y: +y, v });
    else (o === "h" ? H : Vv).set(key, v);
  }
  const runs = []; // agrupa trechos retos do mesmo estilo
  for (let y = 0; y <= M.h; y++) {
    let st = null,
      x0 = 0;
    for (let x = 0; x <= M.w; x++) {
      const v = H.get(x + "," + y) || null;
      if (v !== st) {
        if (st) runs.push({ st, x0, y0: y, x1: x, y1: y });
        st = v;
        x0 = x;
      }
    }
  }
  for (let x = 0; x <= M.w; x++) {
    let st = null,
      y0 = 0;
    for (let y = 0; y <= M.h; y++) {
      const v = Vv.get(x + "," + y) || null;
      if (v !== st) {
        if (st) runs.push({ st, x0: x, y0, x1: x, y1: y });
        st = v;
        y0 = y;
      }
    }
  }
  return { runs, A };
}
function maDrawWalls(g, M, s) {
  MA_S = s;
  const { runs, A } = maSegs(M);
  const pats = {};
  const pat = id => {
    if (!pats[id]) {
      const P = MA_PAREDE[id];
      if (P && P.miolo) pats[id] = g.createPattern(maPatCanvas(s, P.miolo), "repeat");
    }
    return pats[id];
  };
  const solid = runs.filter(r => MA_PAREDE[r.st] && !MA_PAREDE[r.st].cerca),
    fences = runs.filter(r => MA_PAREDE[r.st] && MA_PAREDE[r.st].cerca);
  const path = r => {
    g.beginPath();
    g.moveTo(r.x0 * s, r.y0 * s);
    g.lineTo(r.x1 * s, r.y1 * s);
  };
  g.save();
  g.lineCap = "square";
  // sombra no chão
  solid.forEach(r => {
    const P = MA_PAREDE[r.st];
    g.shadowColor = "rgba(0,0,0,.75)";
    g.shadowBlur = s * 0.35;
    g.shadowOffsetX = s * 0.05;
    g.shadowOffsetY = s * 0.08;
    path(r);
    g.strokeStyle = "#000";
    g.lineWidth = P.t * s;
    g.stroke();
  });
  g.shadowColor = "transparent";
  g.shadowBlur = 0;
  g.shadowOffsetX = g.shadowOffsetY = 0;
  // contorno de tinta por baixo (une as junções)
  solid.forEach(r => {
    const P = MA_PAREDE[r.st];
    path(r);
    g.strokeStyle = P.borda || MA_INK;
    g.lineWidth = P.t * s + maLW(2.2);
    g.stroke();
  });
  solid.forEach(r => {
    const P = MA_PAREDE[r.st];
    path(r);
    g.strokeStyle = pat(r.st) || P.cor;
    g.lineWidth = P.t * s;
    g.stroke();
  });
  // brilho na borda de cima das paredes escuras
  solid.forEach(r => {
    const P = MA_PAREDE[r.st];
    if (r.st !== "ordem") return;
    g.strokeStyle = "rgba(255,255,255,.05)";
    g.lineWidth = Math.max(1, s * 0.03);
    g.beginPath();
    if (r.y0 === r.y1) {
      g.moveTo(r.x0 * s, r.y0 * s - (P.t * s) / 2 + 1);
      g.lineTo(r.x1 * s, r.y1 * s - (P.t * s) / 2 + 1);
    } else {
      g.moveTo(r.x0 * s - (P.t * s) / 2 + 1, r.y0 * s);
      g.lineTo(r.x1 * s - (P.t * s) / 2 + 1, r.y1 * s);
    }
    g.stroke();
  });
  g.lineCap = "butt";
  fences.forEach(r => {
    const P = MA_PAREDE[r.st];
    const hz = r.y0 === r.y1;
    const n = Math.round(Math.abs(hz ? r.x1 - r.x0 : r.y1 - r.y0));
    for (let i = 0; i < n; i++) {
      const ax = (hz ? r.x0 + i : r.x0) * s,
        ay = (hz ? r.y0 : r.y0 + i) * s,
        bx = hz ? ax + s : ax,
        by = hz ? ay : ay + s;
      if (P.cerca === "madeira") {
        maLine(
          g,
          [
            [ax, ay],
            [bx, by]
          ],
          MA_INK,
          s * 0.12,
          "butt"
        );
        maLine(
          g,
          [
            [ax, ay],
            [bx, by]
          ],
          "#5d4029",
          s * 0.08,
          "butt"
        );
        maBox(g, ax - s * 0.06, ay - s * 0.06, s * 0.12, s * 0.12, s * 0.02, "#4a3220");
      }
      if (P.cerca === "arame") {
        g.setLineDash([s * 0.04, s * 0.04]);
        maLine(
          g,
          [
            [ax, ay],
            [bx, by]
          ],
          "#8a9096",
          Math.max(1, s * 0.025),
          "butt"
        );
        g.setLineDash([]);
        maCirc(g, ax, ay, s * 0.05, "#6a6f74");
      }
      if (P.cerca === "grade") {
        maLine(
          g,
          [
            [ax, ay],
            [bx, by]
          ],
          MA_INK,
          s * 0.1,
          "butt"
        );
        maLine(
          g,
          [
            [ax, ay],
            [bx, by]
          ],
          "#30333a",
          s * 0.06,
          "butt"
        );
        for (let k = 1; k < 4; k++) {
          const px = ax + ((bx - ax) * k) / 4,
            py = ay + ((by - ay) * k) / 4;
          maCirc(g, px, py, s * 0.04, "#3a3d44");
        }
        maBox(g, ax - s * 0.06, ay - s * 0.06, s * 0.12, s * 0.12, 0, "#25272b");
      }
    }
    const ex = r.x1 * s,
      ey = r.y1 * s;
    if (P.cerca === "madeira")
      maBox(g, ex - s * 0.06, ey - s * 0.06, s * 0.12, s * 0.12, s * 0.02, "#4a3220");
    if (P.cerca === "arame") maCirc(g, ex, ey, s * 0.05, "#6a6f74");
    if (P.cerca === "grade") maBox(g, ex - s * 0.06, ey - s * 0.06, s * 0.12, s * 0.12, 0, "#25272b");
  });
  // portas e janelas
  A.forEach(a => {
    const [, tipo, est] = a.v.split(":");
    const P = MA_PAREDE[est] || MA_PAREDE.ordem;
    const t = P.cerca ? s * 0.12 : P.t * s;
    const hz = a.o === "h";
    const x0 = a.x * s,
      y0 = a.y * s,
      x1 = hz ? x0 + s : x0,
      y1 = hz ? y0 : y0 + s;
    g.save();
    g.translate(x0, y0);
    if (!hz) {
      g.rotate(Math.PI / 2);
    } // desenha sempre na horizontal
    const L = s,
      post = t * 0.9;
    const jamb = () => {
      maBox(g, -post * 0.25, -t / 2 - 1, post * 0.5 + 1, t + 2, 0, "#121214", { k: 0.05 });
      maBox(g, L - post * 0.25 - 1, -t / 2 - 1, post * 0.5 + 1, t + 2, 0, "#121214", { k: 0.05 });
    };
    if (tipo === "secreta") {
      g.strokeStyle = MA_INK;
      g.lineWidth = t + maLW(2.2);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(L, 0);
      g.stroke();
      g.strokeStyle = "#0f0f12";
      g.lineWidth = t;
      g.stroke();
      g.strokeStyle = "rgba(120,90,200,.08)";
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(L * 0.5, -t / 2);
      g.lineTo(L * 0.5, t / 2);
      g.stroke();
    } else if (tipo === "janela" || tipo === "janelaq") {
      g.strokeStyle = MA_INK;
      g.lineWidth = t + maLW(2.2);
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(L, 0);
      g.stroke();
      g.strokeStyle = P.cerca ? "#222" : P.id === "ordem" ? "#151518" : P.cor;
      g.lineWidth = t;
      g.stroke();
      maBox(g, L * 0.12, -t * 0.22, L * 0.76, t * 0.44, 1, "#9ccbe0", { k: 0.2 });
      if (tipo === "janelaq") {
        maLine(
          g,
          [
            [L * 0.3, -t * 0.2],
            [L * 0.45, 0],
            [L * 0.38, t * 0.2]
          ],
          MA_INK,
          maLW()
        );
        maLine(
          g,
          [
            [L * 0.6, -t * 0.2],
            [L * 0.55, t * 0.1]
          ],
          MA_INK,
          maLW()
        );
        const R = maRng(a.x * 7 + a.y);
        maSpeck(
          g,
          L * 0.1,
          t * 0.4,
          L * 0.8,
          s * 0.25,
          R,
          10,
          ["rgba(200,230,245,.7)"],
          s * 0.008,
          s * 0.018
        );
      } else {
        g.fillStyle = "rgba(255,255,255,.35)";
        g.fillRect(L * 0.15, -t * 0.15, L * 0.7, t * 0.08);
      }
    } else if (tipo === "portao") {
      jamb();
      for (let i = 0; i < 8; i++)
        maLine(
          g,
          [
            [L * 0.1 + (i * L * 0.8) / 7, -t * 0.25],
            [L * 0.1 + (i * L * 0.8) / 7, t * 0.25]
          ],
          "#33363c",
          Math.max(1, s * 0.03)
        );
      maLine(
        g,
        [
          [L * 0.08, 0],
          [L * 0.92, 0]
        ],
        "#2a2c30",
        Math.max(1, s * 0.035)
      );
    } else if (tipo === "cortina") {
      jamb();
      for (let i = 0; i < 6; i++) {
        maEll(g, L * 0.15 + i * L * 0.14, 0, L * 0.08, t * 0.35, maTone("#5a1c25", i % 2 ? 0.05 : -0.05), {
          k: 0.2
        });
      }
    } else {
      jamb();
      const dbl = tipo === "portad";
      const col = MA_ABERT[tipo].cor;
      const leaf = (px, len, ang, flip) => {
        g.save();
        g.translate(px, 0);
        g.rotate(ang);
        maBox(g, flip ? -len : 0, -t * 0.18, len, t * 0.36, 1, col, { k: 0.15 });
        if (tipo === "portaf") {
          for (let k = 1; k < 4; k++)
            maLine(
              g,
              [
                [(flip ? -len : 0) + (len * k) / 4, -t * 0.15],
                [(flip ? -len : 0) + (len * k) / 4, t * 0.15]
              ],
              "#55595f",
              Math.max(1, s * 0.02)
            );
        }
        g.restore();
      };
      // arco de abertura tracejado
      g.setLineDash([s * 0.04, s * 0.05]);
      g.strokeStyle = "rgba(255,255,255,.12)";
      g.lineWidth = Math.max(1, s * 0.015);
      g.beginPath();
      if (dbl) {
        g.arc(post * 0.25, 0, L / 2 - post * 0.3, 0, Math.PI / 2);
        g.moveTo(L - post * 0.25, L / 2 - post * 0.3);
        g.arc(L - post * 0.25, 0, L / 2 - post * 0.3, Math.PI / 2, Math.PI);
      } else g.arc(post * 0.25, 0, L - post * 0.5, 0, Math.PI / 2);
      g.stroke();
      g.setLineDash([]);
      if (tipo === "portaq") {
        leaf(post * 0.25, (L - post * 0.5) * 0.55, 1.2);
        maSpeck(
          g,
          L * 0.4,
          0,
          L * 0.5,
          s * 0.4,
          maRng(a.x + a.y * 3),
          9,
          ["#5a3c26", "#3c2a1c"],
          s * 0.01,
          s * 0.03
        );
      } else if (dbl) {
        leaf(post * 0.25, L / 2 - post * 0.3, 0.55);
        leaf(L - post * 0.25, L / 2 - post * 0.3, -0.55, true);
      } else leaf(post * 0.25, L - post * 0.5, 0.5);
      if (tipo === "portat") maCirc(g, L / 2, 0, Math.max(2, s * 0.09), "#d9a441", { k: 0.25 });
    }
    g.restore();
  });
  g.restore();
}
