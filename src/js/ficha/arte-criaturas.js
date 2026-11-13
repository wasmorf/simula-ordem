"use strict";
/* Arte das criaturas sem imagem: desenhada na hora, original do Simula Ordem.
   Cada elemento tem cores e formas próprias, e várias formas de corpo; o nome da criatura
   escolhe a forma e os detalhes (a mesma criatura sai sempre igual).
   Uso: arteCriatura(elemento, semente) → imagem (data URL) com fundo transparente. */

const AC_N = 320; // tamanho do desenho
const AC_PAL = {
  // silhueta escura com luz de borda na cor do elemento; olhos, bocas e símbolos acesos
  Sangue: {
    base: "#120306",
    mid: "#3d0b14",
    luz: "#7e1c28",
    brilho: "#ff7480",
    olho: "#ffcf86",
    aura: "#e2283d",
    ink: "#050102"
  },
  Morte: {
    base: "#060507",
    mid: "#1b191e",
    luz: "#403b45",
    brilho: "#ddd6c8",
    olho: "#f1ead8",
    aura: "#9a92a6",
    ink: "#020203"
  },
  Conhecimento: {
    base: "#0c0803",
    mid: "#2b2009",
    luz: "#6e5414",
    brilho: "#ffd76a",
    olho: "#fff3c4",
    aura: "#f0b232",
    ink: "#040301"
  },
  Energia: {
    base: "#0d0320",
    mid: "#2b0c58",
    luz: "#6c2ad0",
    brilho: "#ecd4ff",
    olho: "#ffffff",
    aura: "#b45cff",
    ink: "#040009"
  },
  Medo: {
    base: "#aab2c2",
    mid: "#dfe4ee",
    luz: "#ffffff",
    brilho: "#ffffff",
    olho: "#030407",
    aura: "#dce4ff",
    ink: "#2a2e38"
  },
  "": {
    base: "#09090c",
    mid: "#1d1c23",
    luz: "#3b3a47",
    brilho: "#bcd6ff",
    olho: "#d6e6ff",
    aura: "#6b9be0",
    ink: "#030304"
  }
};
/* "Energia e Conhecimento" → principal Energia, segundo Conhecimento; o que não é elemento vira "" */
function acElementos(el) {
  const l = String(el || "")
    .split(/\s+e\s+|,\s*/)
    .map(s => s.trim())
    .filter(s => AC_PAL[s] && s);
  return [l[0] || "", l[1] || ""];
}
/* semente a partir do nome inteiro (antes só o tamanho e a primeira letra contavam) */
function sementeDe(s) {
  let h = 2166136261;
  for (const ch of String(s || "x")) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0 || 1;
}

/* ---------- pincéis ---------- */
// contorno orgânico: raio com ondas (lobos) e um pouco de acaso
function acForma(g, cx, cy, r, R, { lobos = 5, amp = 0.18, sx = 1, sy = 1, rot = 0, pts = 64 } = {}) {
  const fases = [R() * 6.28, R() * 6.28, R() * 6.28];
  g.beginPath();
  for (let i = 0; i <= pts; i++) {
    const a = (i / pts) * Math.PI * 2;
    const k =
      1 +
      amp * Math.sin(lobos * a + fases[0]) * 0.6 +
      amp * 0.5 * Math.sin((lobos * 2 + 1) * a + fases[1]) +
      amp * 0.3 * Math.sin(3 * a + fases[2]);
    const x = Math.cos(a) * r * k * sx,
      y = Math.sin(a) * r * k * sy;
    const px = cx + x * Math.cos(rot) - y * Math.sin(rot),
      py = cy + x * Math.sin(rot) + y * Math.cos(rot);
    i ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.closePath();
}
// preenche o caminho atual com volume: luz em cima à esquerda, sombra embaixo, contorno e brilho de borda
function acVolume(g, cx, cy, r, P, { borda = true } = {}) {
  g.save(); // brilho da aura em volta da silhueta
  g.shadowColor = maA(P.aura, 0.6);
  g.shadowBlur = 16;
  g.fillStyle = P.base;
  g.fill();
  g.restore();
  const gr = g.createRadialGradient(cx - r * 0.35, cy - r * 0.45, r * 0.05, cx, cy, r * 1.25);
  gr.addColorStop(0, P.luz);
  gr.addColorStop(0.45, P.mid);
  gr.addColorStop(1, P.base);
  g.fillStyle = gr;
  g.fill();
  if (borda) {
    g.save();
    g.clip();
    g.lineWidth = r * 0.14;
    g.strokeStyle = maA(P.aura, 0.55); // luz da aura batendo na borda
    g.shadowColor = "transparent";
    g.stroke();
    g.restore();
  }
  g.lineWidth = 2.2;
  g.strokeStyle = maA(P.ink, 0.9);
  g.stroke();
}
// pontos de uma linha torta, saindo de (x,y) na direção a
function acTrilha(R, x, y, a, len, n = 7, curva = 0.5) {
  const p = [[x, y]];
  let ang = a;
  const vira = (R() - 0.5) * curva;
  for (let i = 1; i <= n; i++) {
    ang += vira + (R() - 0.5) * curva * 0.6;
    x += (Math.cos(ang) * len) / n;
    y += (Math.sin(ang) * len) / n;
    p.push([x, y]);
  }
  return p;
}
// membro afinando (tentáculo, braço, perna) com volume e contorno
function acMembro(g, pts, w0, w1, P, { cor, garra = 0 } = {}) {
  const L = [],
    Rt = [];
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    const [ax, ay] = pts[Math.max(0, i - 1)],
      [bx, by] = pts[Math.min(pts.length - 1, i + 1)];
    const dx = bx - ax,
      dy = by - ay,
      d = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * (i / (pts.length - 1))) / 2;
    L.push([x - (dy / d) * w, y + (dx / d) * w]);
    Rt.push([x + (dy / d) * w, y - (dx / d) * w]);
  }
  g.beginPath();
  g.moveTo(L[0][0], L[0][1]);
  for (let i = 1; i < L.length; i++) g.lineTo(L[i][0], L[i][1]);
  for (let i = Rt.length - 1; i >= 0; i--) g.lineTo(Rt[i][0], Rt[i][1]);
  g.closePath();
  const [x0, y0] = pts[0],
    [x1, y1] = pts[pts.length - 1];
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, cor || P.mid);
  gr.addColorStop(1, maTone(cor || P.mid, -0.35));
  g.save();
  g.shadowColor = maA(P.aura, 0.5);
  g.shadowBlur = 10;
  g.fillStyle = gr;
  g.fill();
  g.restore();
  g.lineWidth = 2.5;
  g.strokeStyle = P.ink;
  g.stroke();
  // linha de luz por cima do membro
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x - 1, y - 1) : g.moveTo(x - 1, y - 1)));
  g.lineWidth = Math.max(1, w0 * 0.16);
  g.strokeStyle = maA(P.aura, 0.45);
  g.stroke();
  if (garra) {
    const [px, py] = pts[pts.length - 2];
    const a = Math.atan2(y1 - py, x1 - px);
    for (let k = -1; k <= 1; k++) {
      const b = a + k * 0.5;
      g.beginPath();
      g.moveTo(x1 + Math.cos(b + 1.5) * 2, y1 + Math.sin(b + 1.5) * 2);
      g.quadraticCurveTo(
        x1 + Math.cos(b) * garra * 0.7 + Math.cos(b + 1.6) * garra * 0.25,
        y1 + Math.sin(b) * garra * 0.7 + Math.sin(b + 1.6) * garra * 0.25,
        x1 + Math.cos(b) * garra,
        y1 + Math.sin(b) * garra
      );
      g.lineTo(x1 + Math.cos(b - 1.5) * 2, y1 + Math.sin(b - 1.5) * 2);
      g.fillStyle = P.brilho === "#ffffff" ? "#20232c" : "#e9dfcf";
      g.fill();
      g.lineWidth = 1.5;
      g.strokeStyle = P.ink;
      g.stroke();
    }
  }
}
function acOlho(g, x, y, r, P, { fenda = true, cor } = {}) {
  g.save();
  g.shadowColor = cor || P.olho;
  g.shadowBlur = r * 2.2;
  g.beginPath();
  g.ellipse(x, y, r, r * 0.72, 0, 0, 7);
  g.fillStyle = cor || P.olho;
  g.fill();
  g.restore();
  g.beginPath();
  g.ellipse(x, y, r, r * 0.72, 0, 0, 7);
  g.lineWidth = 1.5;
  g.strokeStyle = P.ink;
  g.stroke();
  g.fillStyle = P.ink;
  g.beginPath();
  if (fenda) g.ellipse(x, y, r * 0.18, r * 0.62, 0, 0, 7);
  else g.arc(x, y, r * 0.38, 0, 7);
  g.fill();
}
function acBoca(g, x, y, w, h, P, rot = 0, n = 9) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.beginPath();
  g.ellipse(0, 0, w, h, 0, 0, 7);
  g.fillStyle = P.ink;
  g.fill();
  g.fillStyle = "#efe4d2";
  for (let i = 0; i < n; i++) {
    const t = -w * 0.85 + (i / (n - 1)) * w * 1.7;
    const hh = h * (0.55 + 0.35 * Math.sin((i / (n - 1)) * Math.PI));
    g.beginPath();
    g.moveTo(t - w * 0.09, -h * 0.75);
    g.lineTo(t, -h * 0.75 + hh);
    g.lineTo(t + w * 0.09, -h * 0.75);
    g.fill();
    g.beginPath();
    g.moveTo(t - w * 0.08, h * 0.75);
    g.lineTo(t + w * 0.02, h * 0.75 - hh * 0.8);
    g.lineTo(t + w * 0.1, h * 0.75);
    g.fill();
  }
  g.restore();
}
// símbolo inventado (não é sigilo oficial): 3 ou 4 traços numa grade 3×3
function acSimbolo(g, x, y, s, R, cor) {
  const P = [-1, 0, 1].flatMap(i => [-1, 0, 1].map(j => [i * s, j * s]));
  g.save();
  g.translate(x, y);
  g.strokeStyle = cor;
  g.lineWidth = Math.max(1.4, s * 0.28);
  g.lineCap = "round";
  g.beginPath();
  let a = P[Math.floor(R() * 9)];
  g.moveTo(a[0], a[1]);
  for (let k = 0; k < 3 + Math.floor(R() * 2); k++) {
    const b = P[Math.floor(R() * 9)];
    if (R() < 0.3) g.arc(b[0], b[1], s * 0.5, 0, 6.28);
    else g.lineTo(b[0], b[1]);
    a = b;
  }
  g.stroke();
  g.restore();
}
function acPoeira(g, n, R, cor, cx, cy, r0, r1, tam = 2.5) {
  g.save();
  g.shadowColor = "transparent";
  for (let i = 0; i < n; i++) {
    const a = R() * 6.28,
      d = r0 + R() * (r1 - r0);
    g.fillStyle = maA(cor, 0.25 + R() * 0.6);
    g.beginPath();
    g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 0.6 + R() * tam, 0, 7);
    g.fill();
  }
  g.restore();
}
function acAura(g, cx, cy, P, P2, r = 150) {
  const gr = g.createRadialGradient(cx, cy, r * 0.15, cx, cy, r);
  gr.addColorStop(0, maA(P.aura, 0.42));
  gr.addColorStop(0.6, maA(P2 ? P2.aura : P.aura, 0.16));
  gr.addColorStop(1, maA(P.aura, 0));
  g.fillStyle = gr;
  g.fillRect(0, 0, AC_N, AC_N);
}
function acSombra(g, cx, cy, rx, ry) {
  const gr = g.createRadialGradient(cx, cy, 2, cx, cy, rx);
  gr.addColorStop(0, "rgba(0,0,0,.55)");
  gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr;
  g.beginPath();
  g.ellipse(cx, cy, rx, ry, 0, 0, 7);
  g.fill();
}

/* ---------- formas por elemento ---------- */
const AC_FORMAS = {
  Sangue: [
    // fera vista de cima: corpo comprido, quatro patas com garras, cabeça de bocarra e espinhos na coluna
    (g, R, P, c) => {
      const rot = (R() - 0.5) * 0.5;
      acSombra(g, c, c + 14, 110, 90);
      for (const [lado, frente] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1]
      ]) {
        const bx = c + lado * 30,
          by = c + frente * 34;
        acMembro(
          g,
          acTrilha(R, bx, by, Math.atan2(frente * 0.8, lado) + (R() - 0.5) * 0.4, 78 + R() * 18, 6, 0.35),
          32,
          13,
          P,
          {
            garra: 17
          }
        );
      }
      acForma(g, c, c + 8, 58, R, { lobos: 6, amp: 0.12, sx: 0.9, sy: 1.25, rot });
      acVolume(g, c, c + 8, 66, P);
      // músculos expostos
      g.save();
      g.lineCap = "round";
      for (let i = 0; i < 9; i++) {
        const y = c - 40 + i * 11;
        g.beginPath();
        g.moveTo(c - 30 + R() * 8, y);
        g.quadraticCurveTo(c, y + 8 + R() * 6, c + 30 - R() * 8, y);
        g.lineWidth = 2;
        g.strokeStyle = maA(P.brilho, 0.25 + R() * 0.25);
        g.stroke();
      }
      g.restore();
      for (let i = 0; i < 7; i++) {
        const y = c - 36 + i * 13;
        g.beginPath();
        g.moveTo(c - 6, y + 6);
        g.lineTo(c, y - 8 - R() * 6);
        g.lineTo(c + 6, y + 6);
        g.fillStyle = "#e7dccb";
        g.fill();
        g.lineWidth = 1.5;
        g.strokeStyle = P.ink;
        g.stroke();
      }
      acForma(g, c, c - 74, 30, R, { lobos: 4, amp: 0.1, sx: 1.1, sy: 0.9 });
      acVolume(g, c, c - 74, 32, P);
      acBoca(g, c, c - 86, 22, 12, P, 0, 9);
      acOlho(g, c - 18, c - 66, 5, P);
      acOlho(g, c + 18, c - 66, 5, P);
    },
    // massa de carne com várias bocas e tentáculos
    (g, R, P, c) => {
      acSombra(g, c, c + 12, 120, 110);
      const n = 6 + Math.floor(R() * 4);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.28 + R() * 0.4;
        acMembro(
          g,
          acTrilha(R, c + Math.cos(a) * 40, c + Math.sin(a) * 40, a, 70 + R() * 40, 8, 0.9),
          20,
          3,
          P,
          {
            cor: maTone(P.mid, (R() - 0.5) * 0.2)
          }
        );
      }
      acForma(g, c, c, 72, R, { lobos: 7, amp: 0.16 });
      acVolume(g, c, c, 78, P);
      // veias
      g.save();
      acForma(g, c, c, 72, R, { lobos: 7, amp: 0.16 });
      g.clip();
      for (let i = 0; i < 10; i++) {
        g.beginPath();
        let x = c + (R() - 0.5) * 120,
          y = c + (R() - 0.5) * 120;
        g.moveTo(x, y);
        for (let k = 0; k < 4; k++) g.lineTo((x += (R() - 0.5) * 40), (y += (R() - 0.5) * 40));
        g.lineWidth = 1.5 + R() * 2;
        g.strokeStyle = maA(P.ink, 0.55);
        g.stroke();
      }
      g.restore();
      const bocas = 2 + Math.floor(R() * 3);
      for (let i = 0; i < bocas; i++)
        acBoca(
          g,
          c + (R() - 0.5) * 70,
          c + (R() - 0.5) * 70,
          14 + R() * 10,
          7 + R() * 4,
          P,
          (R() - 0.5) * 1.2,
          7
        );
      for (let i = 0; i < 3; i++) acOlho(g, c + (R() - 0.5) * 80, c + (R() - 0.5) * 80, 4 + R() * 3, P);
    },
    // rastejante curvado: tronco largo com costelas, braços grossos com garras, espinhos nas costas
    (g, R, P, c) => {
      acSombra(g, c, c + 24, 120, 100);
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i - 2) * 0.42 + (R() - 0.5) * 0.2;
        acMembro(g, acTrilha(R, c + (i - 2) * 10, c - 4, a, 70 + R() * 30, 7, 0.4), 15, 2, P, {
          cor: P.base
        });
      }
      for (const lado of [-1, 1])
        acMembro(g, acTrilha(R, c + lado * 40, c - 4, Math.PI / 2 - lado * 1.0, 112, 7, 0.25), 28, 12, P, {
          garra: 24
        });
      acForma(g, c, c + 18, 54, R, { lobos: 3, amp: 0.08, sx: 1.25, sy: 0.95 });
      acVolume(g, c, c + 18, 62, P);
      g.save();
      g.lineCap = "round";
      for (let i = 0; i < 5; i++)
        for (const lado of [-1, 1]) {
          const y = c + 2 + i * 10;
          g.beginPath();
          g.moveTo(c + lado * 6, y);
          g.quadraticCurveTo(c + lado * 30, y - 6, c + lado * (46 - i * 3), y + 8);
          g.lineWidth = 3;
          g.strokeStyle = maA(P.brilho, 0.45);
          g.stroke();
        }
      g.restore();
      acForma(g, c, c - 36, 30, R, { lobos: 3, amp: 0.08, sx: 1.05 });
      acVolume(g, c, c - 36, 34, P);
      acBoca(g, c, c - 28, 22, 12, P, 0, 9);
      acOlho(g, c - 13, c - 50, 5, P);
      acOlho(g, c + 13, c - 50, 5, P);
      acOlho(g, c, c - 58, 3.5, P);
    }
  ],
  Morte: [
    // poça de lodo com espiral, crânios e cinzas
    (g, R, P, c) => {
      acForma(g, c, c, 96, R, { lobos: 9, amp: 0.13, pts: 90 });
      acVolume(g, c, c, 100, P, { borda: false });
      g.save();
      acForma(g, c, c, 96, R, { lobos: 9, amp: 0.13, pts: 90 });
      g.clip();
      for (let i = 0; i < 6; i++) {
        g.beginPath();
        g.ellipse(c - 30 + R() * 60, c - 40 + R() * 70, 18 + R() * 20, 5 + R() * 4, R() * 3, 0, 7);
        g.fillStyle = maA(P.brilho, 0.06 + R() * 0.08); // brilho molhado do lodo
        g.fill();
      }
      g.restore();
      g.save();
      g.shadowColor = P.brilho;
      g.shadowBlur = 8;
      for (let k = 0; k < 2; k++) {
        g.beginPath();
        for (let t = 0; t < 17; t += 0.12) {
          const r = 2.6 * t + k * 9;
          g.lineTo(c + Math.cos(t + k * 3) * r, c + Math.sin(t + k * 3) * r);
        }
        g.lineWidth = 3.5 - k * 1.5;
        g.strokeStyle = maA(P.brilho, 0.75 - k * 0.3);
        g.stroke();
      }
      g.restore();
      for (let i = 0; i < 3; i++) {
        const a = R() * 6.28,
          d = 50 + R() * 30;
        acCranio(g, c + Math.cos(a) * d, c + Math.sin(a) * d, 9 + R() * 4, P);
      }
      acPoeira(g, 70, R, "#bdb6aa", c, c, 60, 150, 2);
    },
    // esqueleto curvado: costelas, crânio e braços ossudos pingando lodo
    (g, R, P, c) => {
      acSombra(g, c, c + 16, 100, 90);
      for (const lado of [-1, 1]) {
        const pts = acTrilha(R, c + lado * 26, c - 20, (lado < 0 ? Math.PI : 0) + lado * 0.6, 100, 6, 0.4);
        acMembro(g, pts, 10, 5, P, { cor: "#bdb6a8", garra: 16 });
      }
      acForma(g, c, c + 18, 44, R, { lobos: 4, amp: 0.12, sx: 1.1, sy: 1.25 });
      acVolume(g, c, c + 18, 52, P);
      g.save();
      g.lineCap = "round";
      for (let i = 0; i < 6; i++) {
        const y = c - 6 + i * 10;
        for (const lado of [-1, 1]) {
          g.beginPath();
          g.moveTo(c + lado * 3, y);
          g.quadraticCurveTo(c + lado * 26, y - 4, c + lado * (34 - i * 2), y + 10);
          g.lineWidth = 4;
          g.strokeStyle = "#d6cfc0";
          g.stroke();
        }
      }
      g.beginPath();
      g.moveTo(c, c - 12);
      g.lineTo(c, c + 58);
      g.lineWidth = 5;
      g.strokeStyle = "#cfc8b8";
      g.stroke();
      g.restore();
      acCranio(g, c, c - 40, 24, P);
      for (let i = 0; i < 6; i++) {
        const x = c + (R() - 0.5) * 120,
          y = c + 40 + R() * 40;
        g.beginPath();
        g.ellipse(x, y, 4 + R() * 6, 2 + R() * 3, 0, 0, 7);
        g.fillStyle = maA(P.base, 0.9);
        g.fill();
      }
    },
    // aranha de lodo: corpo duplo e oito patas finas articuladas
    (g, R, P, c) => {
      acSombra(g, c, c + 10, 125, 110);
      for (let i = 0; i < 8; i++) {
        const lado = i < 4 ? -1 : 1,
          k = i % 4;
        const a = (lado < 0 ? Math.PI : 0) + lado * (-0.9 + k * 0.6);
        const x0 = c + lado * 18,
          y0 = c - 10 + k * 8;
        const jx = x0 + Math.cos(a) * 55,
          jy = y0 + Math.sin(a) * 55 - 14;
        const ex = jx + Math.cos(a + lado * 0.9) * 60,
          ey = jy + Math.sin(a + lado * 0.9) * 60;
        acMembro(
          g,
          [
            [x0, y0],
            [(x0 + jx) / 2, (y0 + jy) / 2 - 6],
            [jx, jy],
            [(jx + ex) / 2, (jy + ey) / 2],
            [ex, ey]
          ],
          9,
          3,
          P,
          { cor: "#3a3540" }
        );
      }
      acForma(g, c, c + 34, 40, R, { lobos: 5, amp: 0.1, sy: 1.2 });
      acVolume(g, c, c + 34, 46, P);
      g.save();
      g.lineWidth = 2.5;
      g.strokeStyle = maA(P.brilho, 0.6);
      g.beginPath();
      for (let t = 0; t < 12; t += 0.15) g.lineTo(c + Math.cos(t) * t * 2.4, c + 34 + Math.sin(t) * t * 2.4);
      g.stroke();
      g.restore();
      acForma(g, c, c - 20, 26, R, { lobos: 4, amp: 0.08 });
      acVolume(g, c, c - 20, 30, P);
      for (let i = 0; i < 6; i++)
        acOlho(g, c - 12 + (i % 3) * 12, c - 26 + Math.floor(i / 3) * 9, 3, P, { fenda: false });
    }
  ],
  Conhecimento: [
    // olho central dentro de anéis de símbolos dourados
    (g, R, P, c) => {
      g.save();
      g.shadowColor = P.aura;
      g.shadowBlur = 14;
      for (let k = 0; k < 3; k++) {
        const r = 70 + k * 26;
        g.beginPath();
        g.arc(c, c, r, R() * 6, R() * 6 + 4 + R());
        g.lineWidth = 2.6 - k * 0.6;
        g.strokeStyle = maA(P.brilho, 0.85 - k * 0.2);
        g.stroke();
        const n = 10 + k * 4;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * 6.28 + k;
          acSimbolo(
            g,
            c + Math.cos(a) * (r + 12),
            c + Math.sin(a) * (r + 12),
            4 - k * 0.6,
            R,
            maA(P.brilho, 0.9 - k * 0.2)
          );
        }
      }
      g.restore();
      acForma(g, c, c, 56, R, { lobos: 5, amp: 0.12 });
      acVolume(g, c, c, 62, P);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * 6.28 + R() * 0.5;
        acMembro(g, acTrilha(R, c + Math.cos(a) * 44, c + Math.sin(a) * 44, a, 40, 5, 0.6), 9, 2, P, {
          cor: P.mid
        });
      }
      g.beginPath();
      g.ellipse(c, c, 34, 20, 0, 0, 7);
      g.fillStyle = "#f6ecc8";
      g.fill();
      g.lineWidth = 3;
      g.strokeStyle = P.ink;
      g.stroke();
      acOlho(g, c, c, 15, P, { fenda: false, cor: P.brilho });
    },
    // figura sem rosto, rachada de luz dourada, com símbolos girando em volta
    (g, R, P, c) => {
      acSombra(g, c, c + 14, 100, 90);
      for (const lado of [-1, 1])
        acMembro(
          g,
          acTrilha(R, c + lado * 30, c, (lado < 0 ? Math.PI : 0) - lado * 0.3, 92, 6, 0.4),
          15,
          7,
          P,
          { garra: 12 }
        );
      acForma(g, c, c + 10, 44, R, { lobos: 3, amp: 0.06, sx: 1.3 });
      acVolume(g, c, c + 10, 52, P);
      acForma(g, c, c - 38, 26, R, { lobos: 2, amp: 0.04, sy: 1.15 });
      acVolume(g, c, c - 38, 30, P);
      g.save();
      g.shadowColor = P.brilho;
      g.shadowBlur = 10;
      g.strokeStyle = P.brilho;
      g.lineCap = "round";
      for (let i = 0; i < 7; i++) {
        let x = c + (R() - 0.5) * 30,
          y = c - 50 + R() * 90;
        g.beginPath();
        g.moveTo(x, y);
        for (let k = 0; k < 4; k++) g.lineTo((x += (R() - 0.5) * 22), (y += (R() - 0.5) * 22));
        g.lineWidth = 1.5 + R() * 1.5;
        g.stroke();
      }
      g.restore();
      g.save();
      g.shadowColor = P.aura;
      g.shadowBlur = 8;
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * 6.28,
          r = 112 + (i % 2) * 18;
        acSimbolo(g, c + Math.cos(a) * r, c + Math.sin(a) * r, 4.5, R, P.brilho);
      }
      g.restore();
    },
    // máscara rachada de onde saem fitas escritas com símbolos que brilham
    (g, R, P, c) => {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * 6.28 + R() * 0.3;
        const pts = acTrilha(R, c, c, a, 118, 10, 0.9);
        acMembro(g, pts, 20, 5, P, { cor: "#4a3814" });
        g.save();
        g.shadowColor = P.aura;
        g.shadowBlur = 8;
        for (let k = 2; k < pts.length - 1; k += 2) acSimbolo(g, pts[k][0], pts[k][1], 2.8, R, P.brilho);
        g.restore();
      }
      acForma(g, c, c, 34, R, { lobos: 2, amp: 0.03, sy: 1.3 });
      g.save();
      g.shadowColor = P.aura;
      g.shadowBlur = 18;
      g.fillStyle = P.base;
      g.fill();
      g.restore();
      const gr = g.createLinearGradient(c - 30, c - 50, c + 30, c + 50);
      gr.addColorStop(0, "#5c4716");
      gr.addColorStop(1, "#140e04");
      g.fillStyle = gr;
      g.fill();
      g.lineWidth = 2.5;
      g.strokeStyle = P.ink;
      g.stroke();
      g.save();
      g.shadowColor = P.brilho;
      g.shadowBlur = 10;
      g.strokeStyle = P.brilho;
      g.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        let x = c + (R() - 0.5) * 30,
          y = c + (R() - 0.5) * 60;
        g.beginPath();
        g.moveTo(x, y);
        for (let k = 0; k < 3; k++) g.lineTo((x += (R() - 0.5) * 18), (y += (R() - 0.5) * 18));
        g.stroke();
      }
      g.fillStyle = P.brilho;
      for (const [x, y, w, h] of [
        [c - 14, c - 10, 9, 3],
        [c + 14, c - 10, 9, 3],
        [c, c - 30, 3, 8]
      ]) {
        g.beginPath();
        g.ellipse(x, y, w, h, 0, 0, 7);
        g.fill();
      }
      g.restore();
    }
  ],
  Energia: [
    // gente feita de chamas roxas, com arcos elétricos
    (g, R, P, c) => {
      acRaios(g, R, P, c, 6);
      const up = -Math.PI / 2;
      for (const lado of [-1, 1]) {
        acChama(g, c + lado * 14, c + 40, Math.PI / 2 + lado * 0.35, 80, 30, R, P); // pernas
        acChama(g, c + lado * 22, c - 26, (lado < 0 ? Math.PI : 0) - lado * 0.5, 90, 26, R, P); // braços
      }
      for (let i = 0; i < 9; i++) {
        const y = c + 40 - i * 12;
        acChama(g, c + (R() - 0.5) * 30, y, up + (R() - 0.5) * 1.1, 45 + R() * 45, 34 - i, R, P);
      }
      g.save();
      g.shadowColor = P.brilho;
      g.shadowBlur = 24;
      acForma(g, c, c - 10, 16, R, { lobos: 5, amp: 0.25, sy: 1.8 });
      g.fillStyle = maA("#f4e6ff", 0.45);
      g.fill();
      g.restore();
      acOlho(g, c - 8, c - 44, 4.5, P, { fenda: false });
      acOlho(g, c + 8, c - 44, 4.5, P, { fenda: false });
    },
    // cristais angulosos em volta de um núcleo
    (g, R, P, c) => {
      acRaios(g, R, P, c, 6);
      const n = 9 + Math.floor(R() * 4);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.28 + R() * 0.3,
          d = 30 + R() * 30,
          L = 40 + R() * 60;
        g.save();
        g.translate(c + Math.cos(a) * d, c + Math.sin(a) * d);
        g.rotate(a + Math.PI / 2);
        g.beginPath();
        g.moveTo(0, -L);
        g.lineTo(12, -L * 0.3);
        g.lineTo(8, 10);
        g.lineTo(-8, 10);
        g.lineTo(-12, -L * 0.3);
        g.closePath();
        const gr = g.createLinearGradient(-12, -L, 12, 10);
        gr.addColorStop(0, P.brilho);
        gr.addColorStop(0.5, P.luz);
        gr.addColorStop(1, P.base);
        g.fillStyle = gr;
        g.fill();
        g.lineWidth = 2.5;
        g.strokeStyle = P.ink;
        g.stroke();
        g.beginPath();
        g.moveTo(0, -L);
        g.lineTo(0, 8);
        g.lineWidth = 1.2;
        g.strokeStyle = maA("#ffffff", 0.5);
        g.stroke();
        g.restore();
      }
      g.save();
      g.shadowColor = P.brilho;
      g.shadowBlur = 30;
      acForma(g, c, c, 24, R, { lobos: 5, amp: 0.2 });
      g.fillStyle = "#f6ecff";
      g.fill();
      g.restore();
    },
    // falha: uma criatura cortada em fatias deslocadas, com cores separadas
    (g, R, P, c) => {
      const tmp = document.createElement("canvas");
      tmp.width = tmp.height = AC_N;
      const t = tmp.getContext("2d");
      AC_FORMAS.Energia[R() < 0.5 ? 0 : 1](t, R, P, c); // a mesma criatura, com defeito
      // camadas de cor deslocadas
      g.save();
      g.globalAlpha = 0.55;
      g.globalCompositeOperation = "lighter";
      g.filter = "hue-rotate(-60deg)";
      g.drawImage(tmp, -6, 0);
      g.filter = "hue-rotate(80deg)";
      g.drawImage(tmp, 6, 0);
      g.restore();
      // fatias
      let y = 0;
      while (y < AC_N) {
        const h = 6 + Math.floor(R() * 26),
          dx = R() < 0.35 ? (R() - 0.5) * 34 : 0;
        g.drawImage(tmp, 0, y, AC_N, h, dx, y, AC_N, h);
        y += h;
      }
      acRaios(g, R, P, c, 4);
    }
  ],
  Medo: [
    // massa branca cheia de olhos negros
    (g, R, P, c) => {
      acForma(g, c, c, 78, R, { lobos: 8, amp: 0.15 });
      acVolume(g, c, c, 86, P);
      for (let i = 0; i < 14; i++) {
        const a = R() * 6.28,
          d = R() * 58;
        const r = 4 + R() * 8;
        g.save();
        g.translate(c + Math.cos(a) * d, c + Math.sin(a) * d);
        g.rotate(R() * 3);
        g.beginPath();
        g.ellipse(0, 0, r * 1.5, r, 0, 0, 7);
        g.fillStyle = P.olho;
        g.fill();
        g.beginPath();
        g.ellipse(0, 0, r * 1.5, r, 0, 0, 7);
        g.lineWidth = 1.5;
        g.strokeStyle = "#7c8496";
        g.stroke();
        g.fillStyle = "#ffffff";
        g.beginPath();
        g.arc(-r * 0.4, -r * 0.3, r * 0.22, 0, 7);
        g.fill();
        g.restore();
      }
      acPoeira(g, 60, R, "#ffffff", c, c, 80, 150, 3);
    },
    // silhueta negativa: buraco escuro em forma de gente, cercado de névoa branca
    (g, R, P, c) => {
      for (let i = 0; i < 18; i++) {
        const a = R() * 6.28,
          d = 30 + R() * 70;
        g.beginPath();
        g.ellipse(c + Math.cos(a) * d, c + Math.sin(a) * d, 30 + R() * 30, 12 + R() * 10, a, 0, 7);
        g.fillStyle = maA("#ffffff", 0.08 + R() * 0.1);
        g.fill();
      }
      g.save();
      g.shadowColor = "#ffffff";
      g.shadowBlur = 24;
      g.fillStyle = "#04050a";
      acForma(g, c, c - 52, 20, R, { lobos: 2, amp: 0.05, sy: 1.2 });
      g.fill();
      acForma(g, c, c + 10, 30, R, { lobos: 3, amp: 0.1, sy: 1.9 });
      g.fill();
      for (const lado of [-1, 1]) {
        g.beginPath();
        const p = acTrilha(R, c + lado * 22, c - 26, Math.PI / 2 + lado * 0.35, 100, 6, 0.3);
        p.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
        g.lineWidth = 12;
        g.lineCap = "round";
        g.strokeStyle = "#04050a";
        g.stroke();
      }
      g.restore();
      g.fillStyle = "#ffffff";
      g.beginPath();
      g.arc(c - 7, c - 56, 2.2, 0, 7);
      g.arc(c + 7, c - 56, 2.2, 0, 7);
      g.fill();
    }
  ],
  "": [
    // vulto encapuzado (pessoas e cultistas sem arte)
    (g, R, P, c) => {
      acSombra(g, c, c + 16, 100, 90);
      for (const lado of [-1, 1])
        acMembro(
          g,
          acTrilha(R, c + lado * 32, c + 6, (lado < 0 ? Math.PI : 0) - lado * 0.7, 62, 5, 0.3),
          16,
          10,
          P
        );
      acForma(g, c, c + 14, 54, R, { lobos: 3, amp: 0.06, sx: 1.2 });
      acVolume(g, c, c + 14, 60, P);
      acForma(g, c, c - 28, 30, R, { lobos: 2, amp: 0.04 });
      acVolume(g, c, c - 28, 34, P);
      g.beginPath();
      g.ellipse(c, c - 22, 17, 13, 0, 0, 7);
      g.fillStyle = P.ink;
      g.fill();
      acOlho(g, c - 6, c - 23, 3, P, { fenda: false });
      acOlho(g, c + 6, c - 23, 3, P, { fenda: false });
    },
    // fera de quatro patas vista de cima (animais)
    (g, R, P, c) => {
      acSombra(g, c, c + 10, 105, 95);
      for (const [lado, frente] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1]
      ])
        acMembro(
          g,
          acTrilha(R, c + lado * 26, c + frente * 34, Math.atan2(frente * 1.2, lado), 46, 5, 0.25),
          24,
          13,
          P,
          {
            garra: 10
          }
        );
      acMembro(g, acTrilha(R, c, c + 56, Math.PI / 2, 66, 6, 0.9), 16, 3, P);
      acForma(g, c, c + 6, 46, R, { lobos: 3, amp: 0.06, sx: 0.82, sy: 1.4 });
      acVolume(g, c, c + 6, 56, P);
      for (const lado of [-1, 1]) {
        g.beginPath();
        g.moveTo(c + lado * 8, c - 70);
        g.lineTo(c + lado * 20, c - 98);
        g.lineTo(c + lado * 22, c - 66);
        g.closePath();
        acVolume(g, c + lado * 16, c - 80, 14, P, { borda: false });
      }
      acForma(g, c, c - 66, 20, R, { lobos: 2, amp: 0.04, sy: 1.5 });
      acVolume(g, c, c - 66, 28, P);
      acOlho(g, c - 8, c - 70, 3.5, P);
      acOlho(g, c + 8, c - 70, 3.5, P);
    }
  ]
};
function acCranio(g, x, y, r, P) {
  g.beginPath();
  g.ellipse(x, y, r, r * 1.05, 0, 0, 7);
  const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.4, 1, x, y, r * 1.1);
  gr.addColorStop(0, "#f4eee0");
  gr.addColorStop(1, "#9a9284");
  g.fillStyle = gr;
  g.fill();
  g.lineWidth = 2;
  g.strokeStyle = P.ink;
  g.stroke();
  g.fillStyle = P.ink;
  g.beginPath();
  g.ellipse(x - r * 0.38, y - r * 0.05, r * 0.24, r * 0.3, 0, 0, 7);
  g.ellipse(x + r * 0.38, y - r * 0.05, r * 0.24, r * 0.3, 0, 0, 7);
  g.fill();
  g.beginPath();
  g.moveTo(x, y + r * 0.25);
  g.lineTo(x - r * 0.12, y + r * 0.45);
  g.lineTo(x + r * 0.12, y + r * 0.45);
  g.fill();
}
function acRaios(g, R, P, c, n) {
  g.save();
  g.shadowColor = P.brilho;
  g.shadowBlur = 14;
  g.lineCap = "round";
  for (let i = 0; i < n; i++) {
    let x = c,
      y = c,
      a = R() * 6.28;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 8; k++) {
      a += (R() - 0.5) * 1.5;
      x += Math.cos(a) * 16;
      y += Math.sin(a) * 16;
      g.lineTo(x, y);
    }
    g.lineWidth = 1.5 + R() * 2.5;
    g.strokeStyle = R() < 0.5 ? P.brilho : P.luz;
    g.stroke();
  }
  g.restore();
}
function acChama(g, x, y, a, L, w, R, P) {
  const p = acTrilha(R, x, y, a, L, 6, 0.7);
  const [ex, ey] = p[p.length - 1];
  g.save();
  g.beginPath();
  g.moveTo(x + Math.cos(a + 1.57) * w * 0.5, y + Math.sin(a + 1.57) * w * 0.5);
  p.forEach(([px, py], i) => {
    const k = 1 - i / p.length;
    g.lineTo(px + Math.cos(a + 1.57) * w * 0.5 * k, py + Math.sin(a + 1.57) * w * 0.5 * k);
  });
  g.lineTo(ex, ey);
  for (let i = p.length - 1; i >= 0; i--) {
    const k = 1 - i / p.length;
    g.lineTo(p[i][0] - Math.cos(a + 1.57) * w * 0.5 * k, p[i][1] - Math.sin(a + 1.57) * w * 0.5 * k);
  }
  g.closePath();
  const gr = g.createLinearGradient(x, y, ex, ey);
  gr.addColorStop(0, P.brilho);
  gr.addColorStop(0.35, P.luz);
  gr.addColorStop(1, maA(P.mid, 0.2));
  g.fillStyle = gr;
  g.shadowColor = P.aura;
  g.shadowBlur = 12;
  g.fill();
  g.restore();
}

/* Textura de pintura (grão) e sombra embaixo, só por cima do que já foi desenhado. */
function acAcabamento(g, R) {
  g.save();
  g.globalCompositeOperation = "source-atop";
  const sombra = g.createLinearGradient(0, AC_N * 0.25, 0, AC_N);
  sombra.addColorStop(0, "rgba(0,0,0,0)");
  sombra.addColorStop(1, "rgba(0,0,0,.38)");
  g.fillStyle = sombra;
  g.fillRect(0, 0, AC_N, AC_N);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = R() < 0.5 ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.12)";
    g.fillRect(R() * AC_N, R() * AC_N, 1 + R() * 2, 1 + R() * 2);
  }
  g.restore();
}
/* Desenha a criatura. el pode ser "Sangue", "Energia e Conhecimento"… ; seed escolhe forma e detalhes. */
function arteCriatura(el, seed = 1) {
  const c = document.createElement("canvas");
  c.width = c.height = AC_N;
  const g = c.getContext("2d");
  const R = maRng(seed || 1);
  const [e1, e2] = acElementos(el);
  const P = AC_PAL[e1],
    P2 = e2 ? AC_PAL[e2] : null;
  const formas = AC_FORMAS[e1];
  const meio = AC_N / 2;
  acAura(g, meio, meio, P, P2);
  const camada = document.createElement("canvas");
  camada.width = camada.height = AC_N;
  const k = camada.getContext("2d");
  k.lineJoin = "round";
  k.translate(meio, meio);
  k.rotate((R() - 0.5) * 0.3);
  k.translate(-meio, -meio);
  formas[Math.floor(R() * formas.length)](k, R, P, meio);
  k.setTransform(1, 0, 0, 1, 0, 0);
  acAcabamento(k, R);
  g.drawImage(camada, 0, 0);
  if (P2) acPoeira(g, 40, R, P2.brilho, meio, meio, 70, 150, 3); // segundo elemento: brilho em volta
  return maToURL(c);
}
