"use strict";
/* Criador de mapas: todos os objetos (móveis, carros, árvores...). */
/* =====================================================================
   CRIADOR DE MAPAS — OBJETOS (vista de cima, arte original)
   w,h em quadrados; z: 0 = no chão (tapetes, manchas), 1 = móveis, 2 = alto (copas, lustres)
   cores: variações que o mestre escolhe; luz: {r em quadrados, c cor}
   ===================================================================== */
const MC = {
  // paleta
  mad: ["#6a4630", "#3e2b1f", "#8a6440", "#2d211a"],
  tec: ["#5e1f2a", "#3f2b5c", "#4a4a52", "#2f4a3a", "#7a6a52", "#23324a"],
  met: ["#4a5058", "#2e3238", "#6b7078", "#8a2a2a"],
  car: ["#1d1e23", "#8d9098", "#6e1c22", "#d2d2d2", "#1f3550", "#3a4a2a"],
  pla: ["#d8d4ca", "#2b2b30", "#5a6a5a", "#8a2a2a"]
};
function mChair(g, x, y, sz, c, rot = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  maBox(g, -sz / 2, -sz / 2, sz, sz, sz * 0.18, c);
  maBox(g, -sz / 2, -sz / 2 - sz * 0.22, sz, sz * 0.28, sz * 0.1, maTone(c, -0.15));
  g.restore();
}
function mCushion(g, x, y, w, h, c) {
  maBox(g, x, y, w, h, Math.min(w, h) * 0.25, c, { k: 0.2 });
}
function mPaper(g, x, y, sz, R) {
  g.save();
  g.translate(x, y);
  g.rotate((R() - 0.5) * 1.2);
  maBox(g, -sz / 2, -sz * 0.65, sz, sz * 1.3, 0, "#d9d3c4", { lw: 0.6, k: 0.05 });
  g.fillStyle = "rgba(40,40,40,.45)";
  for (let i = 0; i < 4; i++)
    g.fillRect(-sz * 0.35, -sz * 0.45 + i * sz * 0.25, sz * 0.7 * (0.5 + R() * 0.5), Math.max(1, sz * 0.06));
  g.restore();
}
function mLeaf(g, x, y, r, R, c) {
  for (let i = 0; i < 7; i++) {
    const a = R() * 7,
      d = r * 0.45 * R();
    maBlob(
      g,
      x + Math.cos(a) * d,
      y + Math.sin(a) * d,
      r * (0.35 + R() * 0.25),
      R,
      maTone(c, (R() - 0.5) * 0.25),
      { ink: i === 0, n: 8 }
    );
  }
}
function mTree(g, W, H, R, c, { dead = false, pine = false } = {}) {
  const cx = W / 2,
    cy = H / 2,
    r = Math.min(W, H) * 0.47;
  if (dead) {
    maCirc(g, cx, cy, r * 0.18, "#3a2c22");
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * 6.28 + R() * 0.4,
        l = r * (0.6 + R() * 0.4);
      maLine(
        g,
        [
          [cx, cy],
          [cx + Math.cos(a) * l * 0.55, cy + Math.sin(a) * l * 0.55],
          [cx + Math.cos(a + 0.3) * l, cy + Math.sin(a + 0.3) * l]
        ],
        MA_INK,
        maLW(2.4)
      );
      maLine(
        g,
        [
          [cx, cy],
          [cx + Math.cos(a) * l * 0.55, cy + Math.sin(a) * l * 0.55],
          [cx + Math.cos(a + 0.3) * l, cy + Math.sin(a + 0.3) * l]
        ],
        "#4a382a",
        maLW(1.2)
      );
    }
    return;
  }
  if (pine) {
    for (let k = 0; k < 4; k++) {
      const rr = r * (1 - k * 0.22);
      g.beginPath();
      for (let i = 0; i <= 16; i++) {
        const a = (i / 16) * 6.28,
          q = i % 2 ? rr * 0.72 : rr;
        g.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q);
      }
      g.closePath();
      g.fillStyle = maTone(c, -0.15 + k * 0.08);
      g.fill();
      g.lineWidth = maLW();
      g.strokeStyle = MA_INK;
      g.stroke();
    }
    return;
  }
  maBlob(g, cx + r * 0.06, cy + r * 0.08, r, R, maTone(c, -0.35), { ink: true, n: 14, j: 0.22 });
  for (let i = 0; i < 6; i++) {
    const a = R() * 7,
      d = r * 0.45 * R();
    maBlob(
      g,
      cx + Math.cos(a) * d,
      cy + Math.sin(a) * d,
      r * (0.35 + R() * 0.25),
      R,
      maTone(c, (R() - 0.6) * 0.25),
      { ink: false, n: 10 }
    );
  }
  maBlob(g, cx - r * 0.25, cy - r * 0.25, r * 0.3, R, maTone(c, 0.12), { ink: false });
}
function mCar(g, W, H, c, { pol = false, van = false } = {}) {
  const w = W * 0.86,
    h = H * 0.92,
    x = (W - w) / 2,
    y = (H - h) / 2;
  [
    [0.08, 0.18],
    [0.92, 0.18],
    [0.08, 0.8],
    [0.92, 0.8]
  ].forEach(([a, b]) => maBox(g, x + w * a - w * 0.1, y + h * b - h * 0.07, w * 0.2, h * 0.14, 2, "#111"));
  maBox(g, x, y, w, h, w * 0.28, c, { k: 0.22 });
  if (!van) {
    maBox(g, x + w * 0.12, y + h * 0.2, w * 0.76, h * 0.17, w * 0.12, "#1d2b36", { k: 0.3 });
    maBox(g, x + w * 0.16, y + h * 0.38, w * 0.68, h * 0.3, w * 0.1, maTone(c, 0.08), { k: 0.18 });
    maBox(g, x + w * 0.14, y + h * 0.69, w * 0.72, h * 0.1, w * 0.08, "#1d2b36", { k: 0.3 });
  } else {
    maBox(g, x + w * 0.12, y + h * 0.12, w * 0.76, h * 0.12, w * 0.1, "#1d2b36", { k: 0.3 });
    maBox(g, x + w * 0.1, y + h * 0.27, w * 0.8, h * 0.65, w * 0.06, maTone(c, 0.06), { k: 0.12 });
  }
  g.fillStyle = "#f6e9a8";
  g.fillRect(x + w * 0.12, y + 1, w * 0.18, h * 0.03);
  g.fillRect(x + w * 0.7, y + 1, w * 0.18, h * 0.03);
  g.fillStyle = "#b3222c";
  g.fillRect(x + w * 0.1, y + h - 3, w * 0.2, h * 0.025);
  g.fillRect(x + w * 0.7, y + h - 3, w * 0.2, h * 0.025);
  if (pol) {
    maBox(g, x + w * 0.2, y + h * 0.47, w * 0.6, h * 0.06, 2, "#222");
    g.fillStyle = "#e0303f";
    g.fillRect(x + w * 0.22, y + h * 0.48, w * 0.27, h * 0.04);
    g.fillStyle = "#2f6be0";
    g.fillRect(x + w * 0.51, y + h * 0.48, w * 0.27, h * 0.04);
  }
}
function mCircle(g, W, H, R, col, kind) {
  const cx = W / 2,
    cy = H / 2,
    r = Math.min(W, H) * 0.46;
  g.save();
  g.shadowColor = col;
  g.shadowBlur = r * 0.25;
  g.strokeStyle = col;
  g.lineWidth = Math.max(1.5, r * 0.035);
  g.beginPath();
  g.arc(cx, cy, r, 0, 7);
  g.stroke();
  g.beginPath();
  g.arc(cx, cy, r * 0.82, 0, 7);
  g.stroke();
  g.lineWidth = Math.max(1, r * 0.02);
  g.beginPath();
  g.arc(cx, cy, r * 0.36, 0, 7);
  g.stroke();
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * 6.28,
      x = cx + Math.cos(a) * r * 0.91,
      y = cy + Math.sin(a) * r * 0.91;
    g.save();
    g.translate(x, y);
    g.rotate(a + R());
    g.beginPath();
    const q = r * 0.05;
    g.moveTo(-q, -q);
    g.lineTo(q * (R() - 0.5) * 2, q);
    g.lineTo(q, -q * R());
    g.stroke();
    g.restore();
  }
  g.lineWidth = Math.max(1.5, r * 0.03);
  g.beginPath();
  if (kind === "sangue") {
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + i * 2.094;
      g.lineTo(cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8);
    }
    g.closePath();
    g.moveTo(cx, cy - r * 0.36);
    g.lineTo(cx, cy + r * 0.5);
  }
  if (kind === "morte") {
    for (let t = 0; t < 16; t += 0.2) {
      const rr = r * 0.05 * t * 0.5;
      g.lineTo(cx + Math.cos(t) * rr, cy + Math.sin(t) * rr);
    }
  }
  if (kind === "conhecimento") {
    g.moveTo(cx - r * 0.7, cy);
    g.quadraticCurveTo(cx, cy - r * 0.55, cx + r * 0.7, cy);
    g.quadraticCurveTo(cx, cy + r * 0.55, cx - r * 0.7, cy);
    g.moveTo(cx + r * 0.16, cy);
    g.arc(cx, cy, r * 0.16, 0, 7);
  }
  if (kind === "energia") {
    for (let i = 0; i <= 10; i++) {
      const a = -Math.PI / 2 + i * 0.628,
        q = i % 2 ? r * 0.3 : r * 0.8;
      g.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q);
    }
  }
  if (kind === "medo") {
    g.moveTo(cx - r * 0.8, cy);
    g.lineTo(cx + r * 0.8, cy);
    g.moveTo(cx, cy - r * 0.8);
    g.lineTo(cx, cy + r * 0.8);
    g.moveTo(cx + r * 0.55, cy);
    g.arc(cx, cy, r * 0.55, 0, 7);
  }
  g.stroke();
  g.restore();
}
function mSplat(g, W, H, R, c, { n = 12, big = 0.32 } = {}) {
  const cx = W / 2,
    cy = H / 2,
    r = Math.min(W, H) * big;
  maBlob(g, cx, cy, r, R, c, { ink: false, n: 12, j: 0.45, k: 0.08 });
  for (let i = 0; i < n; i++) {
    const a = R() * 7,
      d = r * (1 + R() * 0.9);
    g.fillStyle = maTone(c, (R() - 0.5) * 0.2);
    g.beginPath();
    g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * (0.05 + R() * 0.12), 0, 7);
    g.fill();
  }
  g.fillStyle = "rgba(255,200,200,.12)";
  g.beginPath();
  g.ellipse(cx - r * 0.3, cy - r * 0.3, r * 0.25, r * 0.1, -0.6, 0, 7);
  g.fill();
}
function mCandle(g, x, y, r) {
  maCirc(g, x, y, r, "#d8cfb8", { k: 0.25 });
  g.fillStyle = "#ffcf6a";
  g.beginPath();
  g.arc(x, y, r * 0.4, 0, 7);
  g.fill();
}
function mBottles(g, x, y, w, h, R, n = 6) {
  for (let i = 0; i < n; i++)
    maCirc(
      g,
      x + R() * w,
      y + R() * h,
      Math.min(w, h) * 0.08,
      maPick(["#3a6a4a", "#6a3a2a", "#2a4a6a", "#a0a0a0", "#7a2a5a"], R),
      { lw: 0.7 }
    );
}

const MA_OBJS = [
  /* ---------- CASA ---------- */
  {
    id: "cama",
    nome: "Cama de solteiro",
    cat: "Casa",
    w: 1,
    h: 2,
    cores: MC.tec,
    draw: (g, W, H, R, c) => {
      maBox(g, W * 0.06, H * 0.03, W * 0.88, H * 0.94, W * 0.08, "#3a2a20");
      maBox(g, W * 0.1, H * 0.06, W * 0.8, H * 0.88, W * 0.06, "#d8d3c8", { k: 0.1 });
      mCushion(g, W * 0.18, H * 0.08, W * 0.64, H * 0.16, "#ece8de");
      maBox(g, W * 0.1, H * 0.36, W * 0.8, H * 0.58, W * 0.06, c, { k: 0.2 });
      maLine(
        g,
        [
          [W * 0.12, H * 0.4],
          [W * 0.88, H * 0.4]
        ],
        maTone(c, 0.25),
        maLW(1.4)
      );
    }
  },
  {
    id: "camac",
    nome: "Cama de casal",
    cat: "Casa",
    w: 2,
    h: 2,
    cores: MC.tec,
    draw: (g, W, H, R, c) => {
      maBox(g, W * 0.04, H * 0.02, W * 0.92, H * 0.96, W * 0.05, "#3a2a20");
      maBox(g, W * 0.07, H * 0.05, W * 0.86, H * 0.9, W * 0.04, "#d8d3c8", { k: 0.1 });
      mCushion(g, W * 0.12, H * 0.08, W * 0.34, H * 0.15, "#ece8de");
      mCushion(g, W * 0.54, H * 0.08, W * 0.34, H * 0.15, "#ece8de");
      maBox(g, W * 0.07, H * 0.34, W * 0.86, H * 0.61, W * 0.04, c, { k: 0.2 });
      maLine(
        g,
        [
          [W * 0.09, H * 0.38],
          [W * 0.91, H * 0.38]
        ],
        maTone(c, 0.25),
        maLW(1.4)
      );
    }
  },
  {
    id: "camah",
    nome: "Leito de dormitório",
    cat: "Casa",
    w: 1,
    h: 2,
    cores: ["#4a5a32", "#3b4a2a", "#55553a"],
    draw: (g, W, H, R, c) => {
      maBox(g, W * 0.05, H * 0.02, W * 0.9, H * 0.96, 2, "#2a2c2e");
      maBox(g, W * 0.1, H * 0.05, W * 0.8, H * 0.9, 2, c, { k: 0.12 });
      mCushion(g, W * 0.2, H * 0.07, W * 0.6, H * 0.14, "#c9c4b4");
      g.strokeStyle = maA("#000", 0.25);
      g.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.moveTo(W * 0.12, H * (0.35 + i * 0.14));
        g.lineTo(W * 0.88, H * (0.37 + i * 0.14));
        g.stroke();
      }
    }
  },
  {
    id: "sofa",
    nome: "Sofá",
    cat: "Casa",
    w: 3,
    h: 1,
    cores: MC.tec,
    draw: (g, W, H, R, c) => {
      maBox(g, 0, H * 0.08, W, H * 0.86, H * 0.2, maTone(c, -0.15));
      maBox(g, W * 0.02, H * 0.1, W * 0.96, H * 0.3, H * 0.12, maTone(c, -0.05));
      for (let i = 0; i < 3; i++) mCushion(g, W * (0.08 + i * 0.285), H * 0.38, W * 0.27, H * 0.48, c);
      maBox(g, 0, H * 0.12, W * 0.07, H * 0.8, H * 0.1, maTone(c, -0.1));
      maBox(g, W * 0.93, H * 0.12, W * 0.07, H * 0.8, H * 0.1, maTone(c, -0.1));
    }
  },
  {
    id: "poltrona",
    nome: "Poltrona",
    cat: "Casa",
    w: 1,
    h: 1,
    cores: MC.tec,
    draw: (g, W, H, R, c) => {
      maBox(g, W * 0.06, H * 0.08, W * 0.88, H * 0.86, W * 0.2, maTone(c, -0.15));
      maBox(g, W * 0.08, H * 0.08, W * 0.84, H * 0.28, W * 0.12, maTone(c, -0.05));
      mCushion(g, W * 0.22, H * 0.32, W * 0.56, H * 0.56, c);
    }
  },
  {
    id: "mesaj",
    nome: "Mesa de jantar (6 lugares)",
    cat: "Casa",
    w: 3,
    h: 2,
    cores: MC.mad,
    draw: (g, W, H, R, c) => {
      const s = H * 0.24;
      [
        [0.25, 0.08],
        [0.5, 0.08],
        [0.75, 0.08]
      ].forEach(([a]) => {
        mChair(g, W * a, H * 0.12, s, "#2b2420", 0);
        mChair(g, W * a, H * 0.88, s, "#2b2420", Math.PI);
      });
      maBox(g, W * 0.1, H * 0.22, W * 0.8, H * 0.56, W * 0.03, c, { k: 0.18 });
      mPaper(g, W * 0.4, H * 0.5, H * 0.12, R);
    }
  },
  {
    id: "mesar",
    nome: "Mesa redonda com cadeiras",
    cat: "Casa",
    w: 2,
    h: 2,
    cores: ["#5a3a24", "#6e1c22", "#2b2b30"],
    draw: (g, W, H, R, c) => {
      const cx = W / 2,
        cy = H / 2,
        s = W * 0.18;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * 6.28 - 1.57;
        mChair(
          g,
          cx + Math.cos(a) * W * 0.38,
          cy + Math.sin(a) * H * 0.38,
          s,
          "#8a2028",
          a + Math.PI / 2 + Math.PI
        );
      }
      maCirc(g, cx, cy, W * 0.27, c, { k: 0.2 });
      mCandle(g, cx, cy, W * 0.04);
    }
  },
  {
    id: "mesa",
    nome: "Mesa simples",
    cat: "Casa",
    w: 2,
    h: 1,
    cores: MC.mad,
    draw: (g, W, H, R, c) => {
      maBox(g, W * 0.04, H * 0.1, W * 0.92, H * 0.8, 3, c, { k: 0.18 });
      g.strokeStyle = "rgba(0,0,0,.25)";
      g.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        g.beginPath();
        g.moveTo(W * 0.05, H * (0.1 + i * 0.2));
        g.lineTo(W * 0.95, H * (0.1 + i * 0.2));
        g.stroke();
      }
    }
  },
  {
    id: "cadeira",
    nome: "Cadeira",
    cat: "Casa",
    w: 0.5,
    h: 0.5,
    cores: ["#2b2420", ...MC.mad, "#8a2028"],
    draw: (g, W, H, R, c) => mChair(g, W / 2, H * 0.56, W * 0.7, c)
  },
  {
    id: "centro",
    nome: "Mesa de centro",
    cat: "Casa",
    w: 1,
    h: 1,
    cores: MC.mad,
    draw: (g, W, H, R, c) => {
      maBox(g, W * 0.1, H * 0.2, W * 0.8, H * 0.6, 4, c, { k: 0.2 });
      mPaper(g, W * 0.4, H * 0.45, W * 0.14, R);
      maCirc(g, W * 0.66, H * 0.5, W * 0.08, "#d8d3c8");
    }
  },
  {
    id: "estante",
    nome: "Estante de livros",
    cat: "Casa",
    w: 2,
    h: 0.5,
    cores: MC.mad,
    draw: (g, W, H, R, c) => {
      maBox(g, 0, 0, W, H, 1, c);
      for (let i = 0; i < 14; i++) {
        const x = W * 0.03 + i * W * 0.068;
        maBox(
          g,
          x,
          H * 0.12,
          W * 0.06,
          H * 0.7,
          0,
          maPick(["#6e1c22", "#23324a", "#3a5a3a", "#8a6a3a", "#4a2a5a", "#d8d0c0"], R),
          { lw: 0.5, k: 0.1 }
        );
      }
    }
  },
  {
    id: "guarda",
    nome: "Guarda-roupa",
    cat: "Casa",
    w: 2,
    h: 1,
    cores: MC.mad,
    draw: (g, W, H, R, c) => {
      maBox(g, 0, H * 0.05, W, H * 0.9, 2, c, { k: 0.2 });
      maLine(
        g,
        [
          [W / 2, H * 0.08],
          [W / 2, H * 0.92]
        ],
        MA_INK,
        maLW()
      );
      maCirc(g, W * 0.46, H * 0.5, W * 0.015, "#c9b37a");
      maCirc(g, W * 0.54, H * 0.5, W * 0.015, "#c9b37a");
    }
  },
  {
    id: "comoda",
    nome: "Cômoda",
    cat: "Casa",
    w: 1,
    h: 0.5,
    cores: MC.mad,
    draw: (g, W, H, R, c) => {
      maBox(g, 0, 0, W, H, 2, c, { k: 0.2 });
      for (let i = 0; i < 3; i++) maCirc(g, W * (0.2 + i * 0.3), H * 0.5, W * 0.03, "#c9b37a");
    }
  },
  {
    id: "criado",
    nome: "Criado-mudo com abajur",
    cat: "Casa",
    w: 0.5,
    h: 0.5,
    luz: { r: 2.2, c: "#ffcf88" },
    cores: MC.mad,
    draw: (g, W, H, R, c) => {
      maBox(g, W * 0.05, H * 0.05, W * 0.9, H * 0.9, 2, c);
      maCirc(g, W * 0.5, H * 0.5, W * 0.28, "#e8d6a8", { k: 0.3 });
    }
  },
  {
    id: "tv",
    nome: "Rack com TV",
    cat: "Casa",
    w: 2,
    h: 0.5,
    cores: MC.mad,
    draw: (g, W, H, R, c) => {
      maBox(g, 0, H * 0.2, W, H * 0.75, 2, c);
      maBox(g, W * 0.15, H * 0.05, W * 0.7, H * 0.28, 2, "#111317", { k: 0.3 });
      g.fillStyle = "rgba(120,160,255,.25)";
      g.fillRect(W * 0.17, H * 0.1, W * 0.66, H * 0.05);
    }
  },
  {
    id: "tapete",
    nome: "Tapete persa",
    cat: "Casa",
    w: 3,
    h: 2,
    z: 0,
    cores: ["#6e1c22", "#2a3a5a", "#5a3a20", "#3f2b5c"],
    draw: (g, W, H, R, c) => {
      maBox(g, 0, 0, W, H, 2, c, { ink: false, k: 0.05 });
      g.strokeStyle = "#c9a35b";
      g.lineWidth = Math.max(1, H * 0.02);
      g.strokeRect(W * 0.05, H * 0.07, W * 0.9, H * 0.86);
      g.strokeStyle = maTone(c, -0.4);
      g.lineWidth = Math.max(1, H * 0.05);
      g.strokeRect(W * 0.09, H * 0.13, W * 0.82, H * 0.74);
      g.strokeStyle = "#c9a35b";
      g.lineWidth = Math.max(1, H * 0.015);
      g.beginPath();
      g.ellipse(W / 2, H / 2, W * 0.22, H * 0.22, 0, 0, 7);
      g.stroke();
      g.beginPath();
      g.moveTo(W / 2, H * 0.2);
      g.lineTo(W * 0.7, H / 2);
      g.lineTo(W / 2, H * 0.8);
      g.lineTo(W * 0.3, H / 2);
      g.closePath();
      g.stroke();
      g.fillStyle = "#d8cfb8";
      for (let i = 0; i < 20; i++) {
        g.fillRect(-2, H * (i / 20), 3, 1);
        g.fillRect(W - 1, H * (i / 20), 3, 1);
      }
    }
  },
  {
    id: "tapeter",
    nome: "Tapete redondo",
    cat: "Casa",
    w: 2,
    h: 2,
    z: 0,
    cores: ["#2b2b30", "#6e1c22", "#5a3a20", "#d8d0c0"],
    draw: (g, W, H, R, c) => {
      g.beginPath();
      g.arc(W / 2, H / 2, W * 0.47, 0, 7);
      g.fillStyle = c;
      g.fill();
      for (let i = 1; i < 5; i++) {
        g.beginPath();
        g.arc(W / 2, H / 2, (W * 0.47 * i) / 5, 0, 7);
        g.strokeStyle = i % 2 ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.4)";
        g.lineWidth = Math.max(1, W * 0.025);
        g.stroke();
      }
    }
  },
  {
    id: "geladeira",
    nome: "Geladeira",
    cat: "Casa",
    w: 1,
    h: 1,
    cores: ["#cfd2d4", "#3a3d42", "#8a2a2a"],
    draw: (g, W, H, R, c) => {
      maBox(g, W * 0.08, H * 0.1, W * 0.84, H * 0.8, 4, c, { k: 0.2 });
      maLine(
        g,
        [
          [W * 0.2, H * 0.75],
          [W * 0.8, H * 0.75]
        ],
        "rgba(0,0,0,.35)",
        maLW()
      );
    }
  },
  {
    id: "fogao",
    nome: "Fogão",
    cat: "Casa",
    w: 1,
    h: 1,
    cores: ["#cfd2d4", "#2b2d30"],
    draw: (g, W, H, R, c) => {
      maBox(g, W * 0.08, H * 0.1, W * 0.84, H * 0.8, 3, c);
      [
        [0.3, 0.33],
        [0.7, 0.33],
        [0.3, 0.67],
        [0.7, 0.67]
      ].forEach(([a, b]) => {
        maCirc(g, W * a, H * b, W * 0.13, "#1a1a1c", { k: 0.1 });
        maCirc(g, W * a, H * b, W * 0.05, "#3a3a3e", { ink: false });
      });
    }
  },
  {
    id: "bancada",
    nome: "Balcão de cozinha",
    cat: "Casa",
    w: 3,
    h: 1,
    cores: ["#3a3a3e", "#d8d3c8", "#5a3a24"],
    draw: (g, W, H, R, c) => {
      maBox(g, 0, H * 0.05, W, H * 0.9, 2, c, { k: 0.15 });
      maBox(g, W * 0.38, H * 0.2, W * 0.24, H * 0.55, 4, "#9aa0a6", { k: 0.25 });
      maCirc(g, W * 0.5, H * 0.3, W * 0.012, "#555");
      mBottles(g, W * 0.05, H * 0.2, W * 0.25, H * 0.6, R, 5);
    }
  },
  {
    id: "banheira",
    nome: "Banheira",
    cat: "Casa",
    w: 2,
    h: 1,
    cores: ["#e8e6e0", "#c9b37a"],
    draw: (g, W, H, R, c) => {
      maBox(g, W * 0.02, H * 0.06, W * 0.96, H * 0.88, H * 0.3, c, { k: 0.15 });
      maBox(g, W * 0.08, H * 0.16, W * 0.84, H * 0.68, H * 0.26, "#8fb7c4", { k: 0.25 });
      maCirc(g, W * 0.9, H * 0.5, H * 0.05, "#9aa0a6");
    }
  },
  {
    id: "vaso",
    nome: "Vaso sanitário",
    cat: "Casa",
    w: 0.5,
    h: 0.5,
    cores: ["#ecebe6"],
    draw: (g, W, H, R, c) => {
      maBox(g, W * 0.18, H * 0.02, W * 0.64, H * 0.3, 3, c);
      maEll(g, W * 0.5, H * 0.6, W * 0.32, H * 0.36, c, { k: 0.2 });
      maEll(g, W * 0.5, H * 0.62, W * 0.2, H * 0.24, "#a8c7cf", { k: 0.2 });
    }
  },
  {
    id: "pia",
    nome: "Pia de banheiro",
    cat: "Casa",
    w: 1,
    h: 0.5,
    cores: ["#ecebe6", "#c9b37a"],
    draw: (g, W, H, R, c) => {
      maBox(g, 0, 0, W, H, 3, "#5a4a3a");
      maEll(g, W * 0.5, H * 0.55, W * 0.28, H * 0.3, c, { k: 0.2 });
      maCirc(g, W * 0.5, H * 0.18, W * 0.035, "#9aa0a6");
    }
  },
  {
    id: "chuveiro",
    nome: "Box com chuveiro",
    cat: "Casa",
    w: 1,
    h: 1,
    cores: ["#9fbac2"],
    draw: (g, W, H, R, c) => {
      maBox(g, W * 0.04, H * 0.04, W * 0.92, H * 0.92, 2, "#c9ccc8", { k: 0.05 });
      g.strokeStyle = "rgba(0,0,0,.2)";
      for (let i = 1; i < 4; i++) {
        g.beginPath();
        g.moveTo(W * 0.04 + i * W * 0.23, H * 0.04);
        g.lineTo(W * 0.04 + i * W * 0.23, H * 0.96);
        g.stroke();
        g.beginPath();
        g.moveTo(W * 0.04, H * 0.04 + i * H * 0.23);
        g.lineTo(W * 0.96, H * 0.04 + i * H * 0.23);
        g.stroke();
      }
      maCirc(g, W * 0.5, H * 0.5, W * 0.06, "#555");
      maLine(
        g,
        [
          [W * 0.04, H * 0.96],
          [W * 0.96, H * 0.96]
        ],
        maA(c, 0.9),
        maLW(2)
      );
    }
  },
  {
    id: "lareira",
    nome: "Lareira acesa",
    cat: "Casa",
    w: 2,
    h: 1,
    luz: { r: 4, c: "#ff8a3a" },
    cores: ["#4a4440", "#6e3426"],
    draw: (g, W, H, R, c) => {
      maBox(g, 0, 0, W, H * 0.85, 2, c);
      maBox(g, W * 0.22, H * 0.15, W * 0.56, H * 0.55, 3, "#120c0a");
      for (let i = 0; i < 5; i++) {
        g.fillStyle = maPick(["#ff7a2a", "#ffb34a", "#e04a1a"], R);
        g.beginPath();
        g.ellipse(W * (0.32 + R() * 0.36), H * (0.35 + R() * 0.25), W * 0.05, H * 0.12, 0, 0, 7);
        g.fill();
      }
    }
  },
  {
    id: "piano",
    nome: "Piano",
    cat: "Casa",
    w: 2,
    h: 1,
    cores: ["#151517", "#5a3a24"],
    draw: (g, W, H, R, c) => {
      maBox(g, 0, 0, W, H * 0.72, 4, c, { k: 0.25 });
      maBox(g, W * 0.08, H * 0.6, W * 0.84, H * 0.2, 1, "#e8e6e0", { lw: 0.7 });
      g.fillStyle = "#111";
      for (let i = 0; i < 14; i++)
        if (i % 7 !== 2 && i % 7 !== 6) g.fillRect(W * 0.1 + i * W * 0.058, H * 0.6, W * 0.03, H * 0.11);
      maBox(g, W * 0.36, H * 0.82, W * 0.28, H * 0.16, 3, "#2b2420");
    }
  },
  {
    id: "planta",
    nome: "Planta em vaso",
    cat: "Casa",
    w: 0.5,
    h: 0.5,
    cores: ["#2f5a2a", "#4a6a2a", "#3a4a2a"],
    draw: (g, W, H, R, c) => {
      maCirc(g, W / 2, H / 2, W * 0.3, "#6a3a24");
      mLeaf(g, W / 2, H / 2, W * 0.42, R, c);
    }
  },
  {
    id: "lustre",
    nome: "Lustre",
    cat: "Casa",
    w: 1,
    h: 1,
    z: 2,
    luz: { r: 4, c: "#ffd9a0" },
    draw: (g, W, H, R) => {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * 6.28;
        maLine(
          g,
          [
            [W / 2, H / 2],
            [W / 2 + Math.cos(a) * W * 0.35, H / 2 + Math.sin(a) * H * 0.35]
          ],
          "#c9a35b",
          maLW(1.2)
        );
        mCandle(g, W / 2 + Math.cos(a) * W * 0.35, H / 2 + Math.sin(a) * H * 0.35, W * 0.05);
      }
      maCirc(g, W / 2, H / 2, W * 0.1, "#c9a35b");
    }
  },
  {
    id: "caixas",
    nome: "Caixas de papelão",
    cat: "Casa",
    w: 1,
    h: 1,
    draw: (g, W, H, R) => {
      for (let i = 0; i < 3; i++) {
        const s = W * (0.35 + R() * 0.15);
        g.save();
        g.translate(W * (0.3 + R() * 0.4), H * (0.3 + R() * 0.4));
        g.rotate((R() - 0.5) * 0.6);
        maBox(g, -s / 2, -s / 2, s, s, 1, "#9a7a4a", { k: 0.15 });
        maLine(
          g,
          [
            [-s / 2, 0],
            [s / 2, 0]
          ],
          "#c9b48a",
          Math.max(1, s * 0.08),
          "butt"
        );
        g.restore();
      }
    }
  },
  /* ---------- ESCRITÓRIO / ESCOLA ---------- */
  {
    id: "escrivaninha",
    nome: "Mesa de escritório com PC",
    cat: "Escritório",
    w: 2,
    h: 1,
    cores: MC.mad,
    draw: (g, W, H, R, c) => {
      maBox(g, 0, H * 0.05, W, H * 0.9, 2, c, { k: 0.18 });
      maBox(g, W * 0.32, H * 0.12, W * 0.36, H * 0.12, 1, "#16181c");
      maBox(g, W * 0.3, H * 0.4, W * 0.3, H * 0.16, 1, "#2a2c30", { lw: 0.6 });
      g.fillStyle = "#aab6c8";
      g.fillRect(W * 0.34, H * 0.14, W * 0.32, H * 0.05);
      mPaper(g, W * 0.15, H * 0.5, H * 0.25, R);
      maCirc(g, W * 0.85, H * 0.35, H * 0.08, "#d8d3c8");
      mChair(g, W * 0.48, H * 0.95, H * 0.42, "#1d1e22", Math.PI);
    }
  },
  {
    id: "giratoria",
    nome: "Cadeira giratória",
    cat: "Escritório",
    w: 0.5,
    h: 0.5,
    draw: (g, W, H, R) => {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * 6.28;
        maLine(
          g,
          [
            [W / 2, H / 2],
            [W / 2 + Math.cos(a) * W * 0.42, H / 2 + Math.sin(a) * H * 0.42]
          ],
          "#222",
          maLW(1.6)
        );
      }
      mChair(g, W / 2, H * 0.55, W * 0.66, "#1d1e22");
    }
  },
  {
    id: "reuniao",
    nome: "Mesa de reunião",
    cat: "Escritório",
    w: 4,
    h: 2,
    cores: ["#151517", ...MC.mad],
    draw: (g, W, H, R, c) => {
      const s = H * 0.2;
      for (let i = 0; i < 4; i++) {
        mChair(g, W * (0.2 + i * 0.2), H * 0.1, s, "#1d1e22", 0);
        mChair(g, W * (0.2 + i * 0.2), H * 0.9, s, "#1d1e22", Math.PI);
      }
      mChair(g, W * 0.05, H * 0.5, s, "#1d1e22", -Math.PI / 2);
      mChair(g, W * 0.95, H * 0.5, s, "#1d1e22", Math.PI / 2);
      maBox(g, W * 0.1, H * 0.2, W * 0.8, H * 0.6, H * 0.25, c, { k: 0.22 });
      for (let i = 0; i < 6; i++) mPaper(g, W * (0.2 + R() * 0.6), H * (0.35 + R() * 0.3), H * 0.1, R);
    }
  },
  {
    id: "arquivo",
    nome: "Arquivo de metal",
    cat: "Escritório",
    w: 0.5,
    h: 0.5,
    cores: ["#5a6068", "#3a4a3a", "#4a3a2a"],
    draw: (g, W, H, R, c) => {
      maBox(g, W * 0.05, H * 0.05, W * 0.9, H * 0.9, 2, c);
      maLine(
        g,
        [
          [W * 0.3, H * 0.8],
          [W * 0.7, H * 0.8]
        ],
        "#ccc",
        maLW(1.2)
      );
    }
  },
  {
    id: "armario",
    nome: "Armário de aço",
    cat: "Escritório",
    w: 1,
    h: 0.5,
    cores: ["#4a5a6a", "#5a6068", "#3a3d42"],
    draw: (g, W, H, R, c) => {
      maBox(g, 0, 0, W, H, 1, c);
      maLine(
        g,
        [
          [W / 2, 0],
          [W / 2, H]
        ],
        MA_INK,
        maLW()
      );
      for (let i = 0; i < 2; i++) {
        g.fillStyle = "rgba(0,0,0,.4)";
        for (let k = 0; k < 3; k++) g.fillRect(W * (0.1 + i * 0.5), H * (0.2 + k * 0.15), W * 0.3, 1);
      }
    }
  },
  {
    id: "cofre",
    nome: "Cofre",
    cat: "Escritório",
    w: 0.5,
    h: 0.5,
    draw: (g, W, H, R) => {
      maBox(g, W * 0.05, H * 0.05, W * 0.9, H * 0.9, 2, "#2a2c30", { k: 0.25 });
      maCirc(g, W * 0.5, H * 0.5, W * 0.18, "#8a8f96");
      maLine(
        g,
        [
          [W * 0.5, H * 0.5],
          [W * 0.62, H * 0.38]
        ],
        "#222",
        maLW()
      );
    }
  },
  {
    id: "quadro",
    nome: "Quadro negro",
    cat: "Escritório",
    w: 3,
    h: 0.5,
    draw: (g, W, H, R) => {
      maBox(g, 0, H * 0.2, W, H * 0.6, 1, "#5a3a24");
      maBox(g, W * 0.02, H * 0.28, W * 0.96, H * 0.44, 0, "#1e2e24", { k: 0.05 });
      g.strokeStyle = "rgba(230,230,220,.6)";
      g.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        g.beginPath();
        const x = W * (0.06 + R() * 0.8);
        g.moveTo(x, H * (0.35 + R() * 0.25));
        g.lineTo(x + W * 0.08 * R(), H * (0.35 + R() * 0.25));
        g.stroke();
      }
    }
  },
  {
    id: "carteira",
    nome: "Carteira escolar",
    cat: "Escritório",
    w: 0.5,
    h: 0.5,
    draw: (g, W, H, R) => {
      maBox(g, W * 0.08, H * 0.04, W * 0.84, H * 0.42, 2, "#8a6a44");
      mChair(g, W * 0.5, H * 0.75, W * 0.5, "#2f4a6a");
    }
  },
  {
    id: "servidor",
    nome: "Rack de servidores",
    cat: "Escritório",
    w: 1,
    h: 0.5,
    luz: { r: 1.6, c: "#4ab0ff" },
    draw: (g, W, H, R) => {
      maBox(g, 0, 0, W, H, 1, "#16181c", { k: 0.2 });
      for (let i = 0; i < 10; i++) {
        g.fillStyle = maPick(["#3aff7a", "#4ab0ff", "#ff4a4a", "#3aff7a"], R);
        g.fillRect(W * (0.08 + i * 0.09), H * 0.3, W * 0.03, H * 0.1);
        g.fillRect(W * (0.08 + i * 0.09), H * 0.6, W * 0.03, H * 0.1);
      }
    }
  },
  {
    id: "papeis",
    nome: "Papéis espalhados",
    cat: "Escritório",
    w: 1,
    h: 1,
    z: 0,
    draw: (g, W, H, R) => {
      for (let i = 0; i < 7; i++) mPaper(g, W * (0.15 + R() * 0.7), H * (0.15 + R() * 0.7), W * 0.16, R);
    }
  },
  {
    id: "quadrop",
    nome: "Mural de investigação",
    cat: "Escritório",
    w: 2,
    h: 0.5,
    draw: (g, W, H, R) => {
      maBox(g, 0, H * 0.15, W, H * 0.7, 1, "#7a5a3a");
      for (let i = 0; i < 7; i++) mPaper(g, W * (0.08 + i * 0.13), H * (0.3 + R() * 0.4), H * 0.25, R);
      g.strokeStyle = "#c0202a";
      g.lineWidth = Math.max(1, W * 0.006);
      g.beginPath();
      for (let i = 0; i < 5; i++) g.lineTo(W * (0.1 + R() * 0.8), H * (0.3 + R() * 0.4));
      g.stroke();
    }
  },
  /* ---------- HOSPITAL / LABORATÓRIO ---------- */
  {
    id: "leito",
    nome: "Leito de hospital",
    cat: "Hospital e laboratório",
    w: 1,
    h: 2,
    cores: ["#a8c8a8", "#c8d8d8", "#d8d3c8"],
    draw: (g, W, H, R, c) => {
      maBox(g, W * 0.06, H * 0.02, W * 0.88, H * 0.96, 3, "#9aa0a6");
      maBox(g, W * 0.1, H * 0.06, W * 0.8, H * 0.88, 3, "#e6e8e4", { k: 0.06 });
      mCushion(g, W * 0.2, H * 0.08, W * 0.6, H * 0.13, "#f2f2ee");
      maBox(g, W * 0.1, H * 0.36, W * 0.8, H * 0.56, 3, c, { k: 0.15 });
      maLine(
        g,
        [
          [W * 0.04, H * 0.3],
          [W * 0.04, H * 0.7]
        ],
        "#c9ccd0",
        maLW(1.6)
      );
      maLine(
        g,
        [
          [W * 0.96, H * 0.3],
          [W * 0.96, H * 0.7]
        ],
        "#c9ccd0",
        maLW(1.6)
      );
    }
  },
  {
    id: "cirurgia",
    nome: "Mesa cirúrgica",
    cat: "Hospital e laboratório",
    w: 1,
    h: 2,
    luz: { r: 2.5, c: "#e8f6ff" },
    draw: (g, W, H, R) => {
      maBox(g, W * 0.12, H * 0.05, W * 0.76, H * 0.9, 4, "#8a9096", { k: 0.25 });
      maBox(g, W * 0.16, H * 0.08, W * 0.68, H * 0.84, 4, "#2f5a5a", { k: 0.12 });
      mSplat(g, W, H * 1.1, R, "#6a0a12", { n: 5, big: 0.18 });
    }
  },
  {
    id: "carrinho",
    nome: "Carrinho de instrumentos",
    cat: "Hospital e laboratório",
    w: 0.5,
    h: 0.5,
    draw: (g, W, H, R) => {
      maBox(g, W * 0.05, H * 0.1, W * 0.9, H * 0.8, 2, "#a8b0b6", { k: 0.25 });
      for (let i = 0; i < 4; i++)
        maLine(
          g,
          [
            [W * 0.15, H * (0.25 + i * 0.15)],
            [W * 0.65, H * (0.25 + i * 0.15)]
          ],
          "#4a4e54",
          maLW(0.8)
        );
    }
  },
  {
    id: "tanque",
    nome: "Tanque com espécime",
    cat: "Hospital e laboratório",
    w: 1,
    h: 1,
    luz: { r: 2.6, c: "#5aff9a" },
    draw: (g, W, H, R) => {
      maCirc(g, W / 2, H / 2, W * 0.45, "#3a3e44", { k: 0.25 });
      const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.38);
      gr.addColorStop(0, "#9affc0");
      gr.addColorStop(1, "#1f6a4a");
      g.fillStyle = gr;
      g.beginPath();
      g.arc(W / 2, H / 2, W * 0.38, 0, 7);
      g.fill();
      maBlob(g, W / 2, H / 2, W * 0.16, R, "#3a2a2a", { n: 10, j: 0.5 });
      maSpeck(g, W * 0.25, H * 0.25, W * 0.5, H * 0.5, R, 6, ["rgba(230,255,240,.8)"], W * 0.01, W * 0.025);
    }
  },
  {
    id: "bancadal",
    nome: "Bancada de laboratório",
    cat: "Hospital e laboratório",
    w: 3,
    h: 1,
    draw: (g, W, H, R) => {
      maBox(g, 0, H * 0.05, W, H * 0.9, 2, "#2a7a8a", { k: 0.18 });
      maBox(g, W * 0.02, H * 0.08, W * 0.96, H * 0.84, 2, "#d8e6ea", { k: 0.05, lw: 0.6 });
      mBottles(g, W * 0.05, H * 0.2, W * 0.5, H * 0.6, R, 9);
      maBox(g, W * 0.65, H * 0.2, W * 0.2, H * 0.5, 2, "#2b2d30");
      maCirc(g, W * 0.75, H * 0.45, H * 0.12, "#9aa0a6");
    }
  },
  {
    id: "rodas",
    nome: "Cadeira de rodas",
    cat: "Hospital e laboratório",
    w: 0.5,
    h: 0.5,
    draw: (g, W, H, R) => {
      maBox(g, W * 0.08, H * 0.15, W * 0.12, H * 0.7, 2, "#222");
      maBox(g, W * 0.8, H * 0.15, W * 0.12, H * 0.7, 2, "#222");
      mChair(g, W / 2, H * 0.55, W * 0.6, "#2f4a6a");
    }
  },
  {
    id: "soro",
    nome: "Suporte de soro",
    cat: "Hospital e laboratório",
    w: 0.5,
    h: 0.5,
    draw: (g, W, H, R) => {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * 6.28;
        maLine(
          g,
          [
            [W / 2, H / 2],
            [W / 2 + Math.cos(a) * W * 0.35, H / 2 + Math.sin(a) * H * 0.35]
          ],
          "#9aa0a6",
          maLW(1.3)
        );
      }
      maBox(g, W * 0.32, H * 0.2, W * 0.36, H * 0.3, 4, "rgba(200,230,240,.9)");
    }
  },
  {
    id: "maca",
    nome: "Maca com corpo coberto",
    cat: "Hospital e laboratório",
    w: 1,
    h: 2,
    draw: (g, W, H, R) => {
      maBox(g, W * 0.08, H * 0.02, W * 0.84, H * 0.96, 3, "#8a9096");
      maBlob(g, W / 2, H * 0.22, W * 0.22, R, "#d8d8d0", { n: 10, j: 0.1 });
      maBox(g, W * 0.15, H * 0.2, W * 0.7, H * 0.72, W * 0.25, "#d8d8d0", { k: 0.12 });
      g.fillStyle = "#7a0a12";
      g.beginPath();
      g.ellipse(W * 0.6, H * 0.55, W * 0.12, H * 0.05, 0.3, 0, 7);
      g.fill();
    }
  },
  /* ---------- RUA ---------- */
  {
    id: "carro",
    nome: "Carro",
    cat: "Rua",
    w: 1,
    h: 2,
    cores: MC.car,
    draw: (g, W, H, R, c) => mCar(g, W, H, c)
  },
  {
    id: "viatura",
    nome: "Viatura policial",
    cat: "Rua",
    w: 1,
    h: 2,
    luz: { r: 2.5, c: "#ff3a5a" },
    cores: ["#e8e8e8", "#1d1e23"],
    draw: (g, W, H, R, c) => mCar(g, W, H, c, { pol: true })
  },
  {
    id: "van",
    nome: "Van",
    cat: "Rua",
    w: 1,
    h: 2.5,
    cores: MC.car,
    draw: (g, W, H, R, c) => mCar(g, W, H, c, { van: true })
  },
  {
    id: "onibus",
    nome: "Ônibus",
    cat: "Transporte",
    w: 1.5,
    h: 5,
    cores: ["#d8d0c0", "#2a4a6a", "#6e1c22"],
    draw: (g, W, H, R, c) => {
      maBox(g, W * 0.04, H * 0.01, W * 0.92, H * 0.98, W * 0.12, c, { k: 0.15 });
      maBox(g, W * 0.1, H * 0.02, W * 0.8, H * 0.05, W * 0.06, "#1d2b36");
      for (let i = 0; i < 4; i++)
        maBox(g, W * 0.3, H * (0.15 + i * 0.2), W * 0.4, H * 0.06, 2, "#5a5e64", { lw: 0.6 });
    }
  },
  {
    id: "moto",
    nome: "Moto",
    cat: "Rua",
    w: 0.5,
    h: 1,
    cores: MC.car,
    draw: (g, W, H, R, c) => {
      maEll(g, W / 2, H * 0.15, W * 0.12, H * 0.12, "#111");
      maEll(g, W / 2, H * 0.85, W * 0.12, H * 0.12, "#111");
      maBox(g, W * 0.3, H * 0.2, W * 0.4, H * 0.6, W * 0.18, c, { k: 0.25 });
      maLine(
        g,
        [
          [W * 0.05, H * 0.22],
          [W * 0.95, H * 0.22]
        ],
        "#333",
        maLW(1.6)
      );
    }
  },
  {
    id: "poste",
    nome: "Poste de luz",
    cat: "Rua",
    w: 0.5,
    h: 0.5,
    z: 2,
    luz: { r: 4, c: "#ffd27a" },
    draw: (g, W, H, R) => {
      maCirc(g, W / 2, H / 2, W * 0.22, "#3a3d42");
      maCirc(g, W / 2, H / 2, W * 0.12, "#fff1c0", { k: 0.1 });
    }
  },
  {
    id: "lixeira",
    nome: "Lixeira",
    cat: "Rua",
    w: 0.5,
    h: 0.5,
    cores: ["#2a4a2a", "#3a3d42", "#6a5a2a"],
    draw: (g, W, H, R, c) => {
      maCirc(g, W / 2, H / 2, W * 0.38, c, { k: 0.25 });
      maCirc(g, W / 2, H / 2, W * 0.26, "#1a1a1a", { ink: false });
    }
  },
  {
    id: "cacamba",
    nome: "Caçamba de lixo",
    cat: "Rua",
    w: 2,
    h: 1,
    cores: ["#2a4a2a", "#6a3a1a", "#3a3d42"],
    draw: (g, W, H, R, c) => {
      maBox(g, 0, H * 0.05, W, H * 0.9, 2, c, { k: 0.2 });
      maBox(g, W * 0.04, H * 0.12, W * 0.92, H * 0.76, 2, "#151515", { k: 0.05 });
      for (let i = 0; i < 9; i++)
        maBlob(
          g,
          W * (0.1 + R() * 0.8),
          H * (0.25 + R() * 0.5),
          H * 0.12,
          R,
          maPick(["#2b2b2b", "#3a3a3a", "#1f2a1f", "#4a3a2a"], R),
          { n: 7 }
        );
    }
  },
  {
    id: "hidrante",
    nome: "Hidrante",
    cat: "Rua",
    w: 0.5,
    h: 0.5,
    draw: (g, W, H, R) => {
      maCirc(g, W / 2, H / 2, W * 0.22, "#b3222c", { k: 0.3 });
      maBox(g, W * 0.15, H * 0.42, W * 0.7, H * 0.16, 3, "#8a1a22");
    }
  },
  {
    id: "banco",
    nome: "Banco de praça",
    cat: "Rua",
    w: 2,
    h: 0.5,
    draw: (g, W, H, R) => {
      maBox(g, W * 0.02, H * 0.1, W * 0.96, H * 0.25, 1, "#5a3a24");
      maBox(g, W * 0.02, H * 0.42, W * 0.96, H * 0.22, 1, "#6a4630");
      maBox(g, W * 0.02, H * 0.7, W * 0.96, H * 0.22, 1, "#6a4630");
      maBox(g, W * 0.05, 0, W * 0.05, H, 1, "#222");
      maBox(g, W * 0.9, 0, W * 0.05, H, 1, "#222");
    }
  },
  {
    id: "orelhao",
    nome: "Orelhão",
    cat: "Rua",
    w: 0.5,
    h: 0.5,
    draw: (g, W, H, R) => {
      maEll(g, W / 2, H / 2, W * 0.45, H * 0.4, "#e0a03c", { k: 0.25 });
      maBox(g, W * 0.38, H * 0.35, W * 0.24, H * 0.3, 2, "#2b2d30");
    }
  },
  {
    id: "cone",
    nome: "Cone",
    cat: "Rua",
    w: 0.5,
    h: 0.5,
    draw: (g, W, H, R) => {
      maBox(g, W * 0.15, H * 0.15, W * 0.7, H * 0.7, 2, "#222");
      maCirc(g, W / 2, H / 2, W * 0.28, "#ff6a1a", { k: 0.25 });
      maCirc(g, W / 2, H / 2, W * 0.16, "#f2f2f2", { ink: false });
      maCirc(g, W / 2, H / 2, W * 0.08, "#ff6a1a", { ink: false });
    }
  },
  {
    id: "barreira",
    nome: "Barreira policial",
    cat: "Rua",
    w: 2,
    h: 0.5,
    draw: (g, W, H, R) => {
      maBox(g, 0, H * 0.3, W, H * 0.4, 1, "#f2f2f2");
      g.save();
      g.beginPath();
      g.rect(0, H * 0.3, W, H * 0.4);
      g.clip();
      g.fillStyle = "#d0202a";
      for (let i = -2; i < 12; i++) {
        g.beginPath();
        g.moveTo(i * W * 0.1, H * 0.3);
        g.lineTo(i * W * 0.1 + W * 0.05, H * 0.3);
        g.lineTo(i * W * 0.1 + W * 0.05 - H * 0.4, H * 0.7);
        g.lineTo(i * W * 0.1 - H * 0.4, H * 0.7);
        g.fill();
      }
      g.restore();
      g.strokeStyle = MA_INK;
      g.lineWidth = maLW();
      g.strokeRect(0, H * 0.3, W, H * 0.4);
    }
  },
  {
    id: "faixa",
    nome: "Faixa de pedestre",
    cat: "Rua",
    w: 2,
    h: 1,
    z: 0,
    draw: (g, W, H, R) => {
      g.fillStyle = "rgba(230,230,220,.75)";
      for (let i = 0; i < 6; i++) g.fillRect(W * (0.03 + i * 0.165), H * 0.08, W * 0.1, H * 0.84);
    }
  },
  {
    id: "listra",
    nome: "Faixa de rua (tracejada)",
    cat: "Rua",
    w: 2,
    h: 0.5,
    z: 0,
    draw: (g, W, H, R) => {
      g.fillStyle = "rgba(230,200,80,.8)";
      g.fillRect(W * 0.05, H * 0.42, W * 0.38, H * 0.16);
      g.fillRect(W * 0.57, H * 0.42, W * 0.38, H * 0.16);
    }
  },
  {
    id: "bueiro",
    nome: "Bueiro",
    cat: "Rua",
    w: 0.5,
    h: 0.5,
    z: 0,
    draw: (g, W, H, R) => {
      maCirc(g, W / 2, H / 2, W * 0.4, "#2b2c2e", { k: 0.2 });
      for (let i = -2; i <= 2; i++)
        maLine(
          g,
          [
            [W * 0.3, H / 2 + i * H * 0.08],
            [W * 0.7, H / 2 + i * H * 0.08]
          ],
          "#111",
          maLW(1.2)
        );
    }
  },
  {
    id: "placa",
    nome: "Placa de rua",
    cat: "Rua",
    w: 0.5,
    h: 0.5,
    draw: (g, W, H, R) => {
      maCirc(g, W / 2, H / 2, W * 0.08, "#555");
      maBox(g, W * 0.05, H * 0.32, W * 0.9, H * 0.24, 2, "#1f5a2a");
    }
  },
  {
    id: "ponto",
    nome: "Ponto de ônibus",
    cat: "Rua",
    w: 3,
    h: 1,
    draw: (g, W, H, R) => {
      maBox(g, 0, 0, W, H * 0.8, 2, "rgba(120,160,180,.6)");
      maBox(g, W * 0.02, H * 0.05, W * 0.96, H * 0.25, 1, "#3a3d42");
      maBox(g, W * 0.2, H * 0.45, W * 0.6, H * 0.2, 1, "#5a5e64");
    }
  },
  /* ---------- NATUREZA ---------- */
  {
    id: "arvore",
    nome: "Árvore",
    cat: "Natureza",
    w: 2,
    h: 2,
    z: 2,
    cores: ["#2c4523", "#3a4a20", "#24361d", "#5a3a1a"],
    draw: (g, W, H, R, c) => mTree(g, W, H, R, c)
  },
  {
    id: "arvoreg",
    nome: "Árvore grande",
    cat: "Natureza",
    w: 3,
    h: 3,
    z: 2,
    cores: ["#24361d", "#2c4523", "#3a4a20"],
    draw: (g, W, H, R, c) => mTree(g, W, H, R, c)
  },
  {
    id: "pinheiro",
    nome: "Pinheiro",
    cat: "Natureza",
    w: 2,
    h: 2,
    z: 2,
    cores: ["#1f3a2a", "#24402a"],
    draw: (g, W, H, R, c) => mTree(g, W, H, R, c, { pine: true })
  },
  {
    id: "morta",
    nome: "Árvore morta",
    cat: "Natureza",
    w: 2,
    h: 2,
    z: 2,
    draw: (g, W, H, R) => mTree(g, W, H, R, "#3a2c22", { dead: true })
  },
  {
    id: "arbusto",
    nome: "Arbusto",
    cat: "Natureza",
    w: 1,
    h: 1,
    cores: ["#2c4523", "#3a4a20", "#4a3a20"],
    draw: (g, W, H, R, c) => mLeaf(g, W / 2, H / 2, W * 0.45, R, c)
  },
  {
    id: "pedra",
    nome: "Pedra grande",
    cat: "Natureza",
    w: 1,
    h: 1,
    cores: ["#5a564f", "#4a4038", "#6a6a6a"],
    draw: (g, W, H, R, c) => {
      maBlob(g, W / 2, H / 2, W * 0.42, R, c, { n: 8, j: 0.3, k: 0.25 });
      maBlob(g, W * 0.4, H * 0.4, W * 0.15, R, maTone(c, 0.15), { ink: false });
    }
  },
  {
    id: "pedras",
    nome: "Pedras pequenas",
    cat: "Natureza",
    w: 1,
    h: 1,
    draw: (g, W, H, R) => {
      for (let i = 0; i < 6; i++)
        maBlob(
          g,
          W * (0.15 + R() * 0.7),
          H * (0.15 + R() * 0.7),
          W * (0.06 + R() * 0.08),
          R,
          maPick(["#5a564f", "#6a645a", "#4a463f"], R),
          { n: 7, k: 0.25 }
        );
    }
  },
  {
    id: "tronco",
    nome: "Tronco caído",
    cat: "Natureza",
    w: 3,
    h: 1,
    draw: (g, W, H, R) => {
      maBox(g, W * 0.02, H * 0.25, W * 0.96, H * 0.5, H * 0.25, "#4a3424", { k: 0.2 });
      g.strokeStyle = "rgba(0,0,0,.35)";
      g.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        g.beginPath();
        g.moveTo(W * 0.1, H * (0.35 + i * 0.07));
        g.lineTo(W * 0.85, H * (0.35 + i * 0.07));
        g.stroke();
      }
      maEll(g, W * 0.93, H * 0.5, W * 0.05, H * 0.24, "#8a6a44", { k: 0.2 });
    }
  },
  {
    id: "toco",
    nome: "Toco",
    cat: "Natureza",
    w: 0.5,
    h: 0.5,
    draw: (g, W, H, R) => {
      maCirc(g, W / 2, H / 2, W * 0.4, "#4a3424");
      for (let i = 1; i < 4; i++) {
        g.beginPath();
        g.arc(W / 2, H / 2, (W * 0.4 * i) / 4, 0, 7);
        g.strokeStyle = "rgba(0,0,0,.3)";
        g.stroke();
      }
    }
  },
  {
    id: "cogumelos",
    nome: "Cogumelos",
    cat: "Natureza",
    w: 0.5,
    h: 0.5,
    draw: (g, W, H, R) => {
      for (let i = 0; i < 4; i++)
        maCirc(
          g,
          W * (0.25 + R() * 0.5),
          H * (0.25 + R() * 0.5),
          W * (0.08 + R() * 0.07),
          maPick(["#a83a2a", "#d8c8a8", "#8a6a4a"], R),
          { k: 0.3 }
        );
    }
  },
  {
    id: "flores",
    nome: "Flores",
    cat: "Natureza",
    w: 1,
    h: 1,
    z: 0,
    draw: (g, W, H, R) => {
      for (let i = 0; i < 12; i++) {
        const c = maPick(["#d8d0e8", "#c03a4a", "#e0c04a", "#8a6ad8"], R);
        const x = W * (0.1 + R() * 0.8),
          y = H * (0.1 + R() * 0.8);
        for (let k = 0; k < 5; k++) {
          g.fillStyle = c;
          g.beginPath();
          g.arc(x + Math.cos(k * 1.25) * W * 0.025, y + Math.sin(k * 1.25) * W * 0.025, W * 0.02, 0, 7);
          g.fill();
        }
      }
    }
  },
  {
    id: "fogueira",
    nome: "Fogueira",
    cat: "Natureza",
    w: 1,
    h: 1,
    luz: { r: 4.5, c: "#ff9a3a" },
    draw: (g, W, H, R) => {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * 6.28;
        maCirc(g, W / 2 + Math.cos(a) * W * 0.32, H / 2 + Math.sin(a) * H * 0.32, W * 0.08, "#5a564f");
      }
      for (let i = 0; i < 4; i++) {
        const a = i * 0.8;
        maLine(
          g,
          [
            [W / 2 - Math.cos(a) * W * 0.22, H / 2 - Math.sin(a) * H * 0.22],
            [W / 2 + Math.cos(a) * W * 0.22, H / 2 + Math.sin(a) * H * 0.22]
          ],
          "#3a2818",
          maLW(3)
        );
      }
      for (let i = 0; i < 6; i++) {
        g.fillStyle = maPick(["#ff7a2a", "#ffcf5a", "#e04a1a"], R);
        g.beginPath();
        g.ellipse(
          W / 2 + (R() - 0.5) * W * 0.2,
          H / 2 + (R() - 0.5) * H * 0.2,
          W * 0.08,
          W * 0.05,
          R() * 3,
          0,
          7
        );
        g.fill();
      }
    }
  },
  {
    id: "barraca",
    nome: "Barraca",
    cat: "Natureza",
    w: 2,
    h: 2,
    cores: ["#3a5a3a", "#6a3a1a", "#2a3a5a"],
    draw: (g, W, H, R, c) => {
      g.beginPath();
      g.moveTo(W * 0.5, H * 0.05);
      g.lineTo(W * 0.95, H * 0.9);
      g.lineTo(W * 0.05, H * 0.9);
      g.closePath();
      g.fillStyle = maGrad(g, 0, 0, W, H, c, 0.2);
      g.fill();
      g.lineWidth = maLW();
      g.strokeStyle = MA_INK;
      g.stroke();
      g.beginPath();
      g.moveTo(W * 0.5, H * 0.05);
      g.lineTo(W * 0.5, H * 0.9);
      g.stroke();
      g.beginPath();
      g.moveTo(W * 0.4, H * 0.9);
      g.lineTo(W * 0.5, H * 0.6);
      g.lineTo(W * 0.6, H * 0.9);
      g.fillStyle = "#111";
      g.fill();
    }
  },
  {
    id: "canoa",
    nome: "Canoa",
    cat: "Natureza",
    w: 1,
    h: 3,
    draw: (g, W, H, R) => {
      g.beginPath();
      g.moveTo(W / 2, 0);
      g.quadraticCurveTo(W * 1.05, H / 2, W / 2, H);
      g.quadraticCurveTo(-W * 0.05, H / 2, W / 2, 0);
      g.fillStyle = maGrad(g, 0, 0, W, H, "#6a4630", 0.2);
      g.fill();
      g.lineWidth = maLW();
      g.strokeStyle = MA_INK;
      g.stroke();
      for (let i = 1; i < 4; i++)
        maLine(
          g,
          [
            [W * 0.2, (H * i) / 4],
            [W * 0.8, (H * i) / 4]
          ],
          "#4a3020",
          maLW(1.6)
        );
    }
  },
  {
    id: "juncos",
    nome: "Juncos / mato alto",
    cat: "Natureza",
    w: 1,
    h: 1,
    draw: (g, W, H, R) => {
      for (let i = 0; i < 30; i++) {
        const x = W * (0.1 + R() * 0.8),
          y = H * (0.1 + R() * 0.8),
          a = R() * 7;
        maLine(
          g,
          [
            [x, y],
            [x + Math.cos(a) * W * 0.15, y + Math.sin(a) * H * 0.15]
          ],
          maPick(["#4a5a2a", "#5a6a32", "#3a4a22"], R),
          maLW(1.1)
        );
      }
    }
  },
  /* ---------- INDUSTRIAL ---------- */
  {
    id: "barril",
    nome: "Barril",
    cat: "Industrial",
    w: 0.5,
    h: 0.5,
    cores: ["#3a4a5a", "#6a2a1a", "#2a4a2a", "#5a5a5a"],
    draw: (g, W, H, R, c) => {
      maCirc(g, W / 2, H / 2, W * 0.42, c, { k: 0.25 });
      g.strokeStyle = "rgba(0,0,0,.4)";
      g.lineWidth = maLW();
      g.beginPath();
      g.arc(W / 2, H / 2, W * 0.3, 0, 7);
      g.stroke();
      maCirc(g, W * 0.38, H * 0.38, W * 0.06, "#222");
    }
  },
  {
    id: "toxico",
    nome: "Barril tóxico",
    cat: "Industrial",
    w: 0.5,
    h: 0.5,
    luz: { r: 1.2, c: "#9aff3a" },
    draw: (g, W, H, R) => {
      maCirc(g, W / 2, H / 2, W * 0.42, "#c9a01a", { k: 0.25 });
      maCirc(g, W / 2, H / 2, W * 0.18, "#9aff3a", { k: 0.3 });
    }
  },
  {
    id: "caixote",
    nome: "Caixote de madeira",
    cat: "Industrial",
    w: 1,
    h: 1,
    cores: ["#7a5a34", "#5a4028"],
    draw: (g, W, H, R, c) => {
      maBox(g, W * 0.06, H * 0.06, W * 0.88, H * 0.88, 1, c, { k: 0.2 });
      maLine(
        g,
        [
          [W * 0.1, H * 0.1],
          [W * 0.9, H * 0.9]
        ],
        maTone(c, -0.25),
        maLW(2.2)
      );
      maLine(
        g,
        [
          [W * 0.9, H * 0.1],
          [W * 0.1, H * 0.9]
        ],
        maTone(c, -0.25),
        maLW(2.2)
      );
      g.strokeStyle = MA_INK;
      g.lineWidth = maLW();
      g.strokeRect(W * 0.12, H * 0.12, W * 0.76, H * 0.76);
    }
  },
  {
    id: "caixotes",
    nome: "Pilha de caixotes",
    cat: "Industrial",
    w: 2,
    h: 2,
    draw: (g, W, H, R) => {
      [
        [0.05, 0.05],
        [0.52, 0.05],
        [0.05, 0.52],
        [0.3, 0.28]
      ].forEach(([a, b], i) => {
        const s = W * 0.44;
        maBox(g, W * a, H * b, s, s, 1, i === 3 ? "#8a6a40" : "#6e5030", { k: 0.2 });
        maLine(
          g,
          [
            [W * a + s * 0.1, H * b + s * 0.1],
            [W * a + s * 0.9, H * b + s * 0.9]
          ],
          "#4a3420",
          maLW(2)
        );
      });
    }
  },
  {
    id: "pallet",
    nome: "Pallet",
    cat: "Industrial",
    w: 1,
    h: 1,
    z: 0,
    draw: (g, W, H, R) => {
      for (let i = 0; i < 5; i++)
        maBox(g, W * 0.06, H * (0.06 + i * 0.18), W * 0.88, H * 0.13, 1, "#9a7a4a", { k: 0.1, lw: 0.7 });
    }
  },
  {
    id: "prateleira",
    nome: "Prateleira industrial",
    cat: "Industrial",
    w: 3,
    h: 1,
    draw: (g, W, H, R) => {
      maBox(g, 0, 0, W, H, 1, "#3a4048");
      for (let i = 0; i < 6; i++) {
        const s = H * (0.5 + R() * 0.3);
        maBox(
          g,
          W * (0.03 + i * 0.16),
          H * 0.1,
          W * 0.13,
          s,
          1,
          maPick(["#8a6a40", "#5a5e64", "#6e1c22", "#2a4a6a"], R),
          { k: 0.2 }
        );
      }
    }
  },
  {
    id: "gerador",
    nome: "Gerador",
    cat: "Industrial",
    w: 2,
    h: 1,
    luz: { r: 1.2, c: "#ffcf3a" },
    draw: (g, W, H, R) => {
      maBox(g, 0, H * 0.08, W, H * 0.84, 3, "#c9a01a", { k: 0.22 });
      maBox(g, W * 0.08, H * 0.2, W * 0.5, H * 0.6, 2, "#2b2d30");
      for (let i = 0; i < 5; i++)
        maLine(
          g,
          [
            [W * 0.12, H * (0.28 + i * 0.1)],
            [W * 0.54, H * (0.28 + i * 0.1)]
          ],
          "#555",
          maLW(0.8)
        );
      maCirc(g, W * 0.78, H * 0.5, H * 0.18, "#3a3d42");
    }
  },
  {
    id: "canos",
    nome: "Canos",
    cat: "Industrial",
    w: 3,
    h: 1,
    draw: (g, W, H, R) => {
      for (let i = 0; i < 2; i++) {
        maBox(
          g,
          0,
          H * (0.15 + i * 0.38),
          W,
          H * 0.3,
          H * 0.15,
          maPick(["#5a6068", "#6a4a2a", "#3a5a4a"], R),
          { k: 0.3 }
        );
        for (let k = 1; k < 4; k++)
          maBox(g, (W * k) / 4 - W * 0.02, H * (0.12 + i * 0.38), W * 0.04, H * 0.36, 2, "#2b2d30");
      }
    }
  },
  {
    id: "conteiner",
    nome: "Contêiner",
    cat: "Industrial",
    w: 2,
    h: 5,
    cores: ["#6e1c22", "#2a4a6a", "#3a5a3a", "#8a6a2a"],
    draw: (g, W, H, R, c) => {
      maBox(g, 0, 0, W, H, 1, c, { k: 0.15 });
      g.strokeStyle = "rgba(0,0,0,.3)";
      g.lineWidth = 1;
      for (let i = 1; i < 20; i++) {
        g.beginPath();
        g.moveTo(0, (H * i) / 20);
        g.lineTo(W, (H * i) / 20);
        g.stroke();
      }
      maBox(g, W * 0.05, H * 0.95, W * 0.9, H * 0.04, 0, "#222");
    }
  },
  {
    id: "mancha_oleo",
    nome: "Mancha de óleo",
    cat: "Industrial",
    w: 1,
    h: 1,
    z: 0,
    draw: (g, W, H, R) => mSplat(g, W, H, R, "rgba(10,10,12,.75)", { n: 6, big: 0.3 })
  },
  {
    id: "maquina",
    nome: "Máquina industrial",
    cat: "Industrial",
    w: 2,
    h: 2,
    draw: (g, W, H, R) => {
      maBox(g, W * 0.04, H * 0.04, W * 0.92, H * 0.92, 3, "#4a5058", { k: 0.2 });
      maCirc(g, W * 0.35, H * 0.4, W * 0.2, "#2b2d30");
      maCirc(g, W * 0.35, H * 0.4, W * 0.08, "#8a8f96");
      maBox(g, W * 0.62, H * 0.15, W * 0.25, H * 0.3, 2, "#1a1c20");
      g.fillStyle = "#3aff7a";
      g.fillRect(W * 0.66, H * 0.2, W * 0.06, H * 0.04);
      g.fillStyle = "#ff4a4a";
      g.fillRect(W * 0.76, H * 0.2, W * 0.06, H * 0.04);
      for (let i = 0; i < 4; i++)
        maLine(
          g,
          [
            [W * 0.15, H * (0.72 + i * 0.05)],
            [W * 0.85, H * (0.72 + i * 0.05)]
          ],
          "#2b2d30",
          maLW()
        );
    }
  },
  /* ---------- BAR / LAZER ---------- */
  {
    id: "sinuca",
    nome: "Mesa de sinuca",
    cat: "Bar e lazer",
    w: 2,
    h: 3,
    luz: { r: 2.6, c: "#fff0b0" },
    cores: ["#3a8a2a", "#2a5a8a", "#8a2a2a"],
    draw: (g, W, H, R, c) => {
      maBox(g, 0, 0, W, H, W * 0.08, "#4a2a18", { k: 0.2 });
      maBox(g, W * 0.1, H * 0.07, W * 0.8, H * 0.86, 2, c, { k: 0.12 });
      [
        [0.1, 0.07],
        [0.9, 0.07],
        [0.1, 0.5],
        [0.9, 0.5],
        [0.1, 0.93],
        [0.9, 0.93]
      ].forEach(([a, b]) => maCirc(g, W * a, H * b, W * 0.05, "#0a0a0a", { ink: false }));
      for (let i = 0; i < 7; i++)
        maCirc(
          g,
          W * (0.25 + R() * 0.5),
          H * (0.2 + R() * 0.6),
          W * 0.035,
          maPick(["#e0c03a", "#c0202a", "#2a4aa0", "#f2f2f2", "#111", "#6a2a8a"], R),
          { lw: 0.5 }
        );
      maLine(
        g,
        [
          [W * 0.2, H * 0.75],
          [W * 0.75, H * 0.35]
        ],
        "#c9a36b",
        maLW(1.2)
      );
    }
  },
  {
    id: "balcaobar",
    nome: "Balcão de bar",
    cat: "Bar e lazer",
    w: 4,
    h: 1,
    draw: (g, W, H, R) => {
      maBox(g, 0, H * 0.08, W, H * 0.84, 3, "#6e1c22", { k: 0.2 });
      maBox(g, W * 0.01, H * 0.12, W * 0.98, H * 0.3, 2, "#3a1a14", { k: 0.15 });
      mBottles(g, W * 0.05, H * 0.45, W * 0.9, H * 0.4, R, 12);
    }
  },
  {
    id: "banqueta",
    nome: "Banqueta",
    cat: "Bar e lazer",
    w: 0.5,
    h: 0.5,
    cores: ["#c0202a", "#2b2b30", "#c9a01a"],
    draw: (g, W, H, R, c) => {
      maCirc(g, W / 2, H / 2, W * 0.3, c, { k: 0.3 });
    }
  },
  {
    id: "mesabar",
    nome: "Mesa de bar com cadeiras",
    cat: "Bar e lazer",
    w: 1,
    h: 1,
    cores: ["#d8b02a", "#c0202a", "#d8d8d0"],
    draw: (g, W, H, R, c) => {
      for (let i = 0; i < 4; i++) {
        const a = i * 1.571 + R() * 0.5;
        mChair(
          g,
          W / 2 + Math.cos(a) * W * 0.32,
          H / 2 + Math.sin(a) * H * 0.32,
          W * 0.26,
          c,
          a + Math.PI / 2 + Math.PI
        );
      }
      maBox(g, W * 0.28, H * 0.28, W * 0.44, H * 0.44, 2, c, { k: 0.25 });
      maCirc(g, W * 0.45, H * 0.45, W * 0.05, "#7a3a1a");
    }
  },
  {
    id: "fliperama",
    nome: "Fliperama",
    cat: "Bar e lazer",
    w: 1,
    h: 0.5,
    luz: { r: 1.8, c: "#ff4ab0" },
    draw: (g, W, H, R) => {
      maBox(g, 0, 0, W, H, 2, "#2a1a3a", { k: 0.25 });
      maBox(g, W * 0.1, H * 0.15, W * 0.8, H * 0.45, 2, "#ff4ab0", { k: 0.35 });
      maCirc(g, W * 0.3, H * 0.78, H * 0.08, "#e0303f");
      maCirc(g, W * 0.6, H * 0.78, H * 0.08, "#3ab0ff");
    }
  },
  {
    id: "jukebox",
    nome: "Jukebox",
    cat: "Bar e lazer",
    w: 1,
    h: 0.5,
    luz: { r: 1.8, c: "#ffb03a" },
    draw: (g, W, H, R) => {
      maBox(g, 0, 0, W, H, H * 0.4, "#6e1c22", { k: 0.25 });
      maBox(g, W * 0.15, H * 0.2, W * 0.7, H * 0.5, H * 0.2, "#ffcf5a", { k: 0.35 });
    }
  },
  {
    id: "palco",
    nome: "Palco pequeno",
    cat: "Bar e lazer",
    w: 3,
    h: 2,
    z: 0,
    draw: (g, W, H, R) => {
      maBox(g, 0, 0, W, H, 2, "#2a1e18", { k: 0.1 });
      for (let i = 1; i < 6; i++)
        maLine(
          g,
          [
            [0, (H * i) / 6],
            [W, (H * i) / 6]
          ],
          "rgba(0,0,0,.35)",
          1
        );
      maCirc(g, W * 0.5, H * 0.5, W * 0.05, "#333");
      maBox(g, W * 0.1, H * 0.2, W * 0.15, H * 0.2, 2, "#111");
    }
  },
  /* ---------- ORDEM / ARSENAL ---------- */
  {
    id: "armas",
    nome: "Armário de armas",
    cat: "Ordem e arsenal",
    w: 2,
    h: 0.5,
    draw: (g, W, H, R) => {
      maBox(g, 0, 0, W, H, 1, "#2a3a2a");
      for (let i = 0; i < 5; i++) {
        maLine(
          g,
          [
            [W * (0.1 + i * 0.18), H * 0.2],
            [W * (0.1 + i * 0.18), H * 0.85]
          ],
          "#111",
          maLW(2.4)
        );
        maLine(
          g,
          [
            [W * (0.1 + i * 0.18), H * 0.2],
            [W * (0.1 + i * 0.18), H * 0.85]
          ],
          "#3a3d42",
          maLW(1.2)
        );
      }
    }
  },
  {
    id: "bancadaa",
    nome: "Bancada de armas",
    cat: "Ordem e arsenal",
    w: 3,
    h: 1,
    draw: (g, W, H, R) => {
      maBox(g, 0, H * 0.05, W, H * 0.9, 2, "#2a3a2a", { k: 0.15 });
      for (let i = 0; i < 4; i++) {
        g.save();
        g.translate(W * (0.15 + i * 0.22), H * 0.5);
        g.rotate((R() - 0.5) * 0.8);
        maBox(g, -W * 0.07, -H * 0.06, W * 0.14, H * 0.12, 2, "#1a1a1c");
        maBox(g, -W * 0.02, 0, W * 0.03, H * 0.18, 1, "#3a2a1a");
        g.restore();
      }
      mPaper(g, W * 0.9, H * 0.4, H * 0.2, R);
    }
  },
  {
    id: "municao",
    nome: "Caixas de munição",
    cat: "Ordem e arsenal",
    w: 1,
    h: 0.5,
    draw: (g, W, H, R) => {
      for (let i = 0; i < 3; i++)
        maBox(g, W * (0.03 + i * 0.33), H * 0.15, W * 0.3, H * 0.7, 1, "#3a4a2a", { k: 0.2 });
    }
  },
  {
    id: "monitor",
    nome: "Mesa de vigilância",
    cat: "Ordem e arsenal",
    w: 3,
    h: 1,
    luz: { r: 2, c: "#7ab0ff" },
    draw: (g, W, H, R) => {
      maBox(g, 0, H * 0.1, W, H * 0.85, 3, "#1d1e22", { k: 0.2 });
      for (let i = 0; i < 4; i++) {
        maBox(g, W * (0.05 + i * 0.24), H * 0.12, W * 0.2, H * 0.2, 1, "#0d0f12");
        g.fillStyle = "rgba(120,170,255,.45)";
        g.fillRect(W * (0.06 + i * 0.24), H * 0.14, W * 0.18, H * 0.15);
      }
      mChair(g, W * 0.3, H * 0.85, H * 0.35, "#2a2c30", Math.PI);
      mChair(g, W * 0.7, H * 0.85, H * 0.35, "#2a2c30", Math.PI);
    }
  },
  {
    id: "sofaroxo",
    nome: "Sofá em U (sala roxa)",
    cat: "Ordem e arsenal",
    w: 4,
    h: 3,
    draw: (g, W, H, R) => {
      const c = "#2a2a30";
      maBox(g, 0, 0, W, H * 0.22, H * 0.08, c);
      maBox(g, 0, 0, W * 0.12, H, H * 0.08, c);
      maBox(g, W * 0.88, 0, W * 0.12, H, H * 0.08, c);
      for (let i = 0; i < 4; i++) mCushion(g, W * (0.14 + i * 0.18), H * 0.05, W * 0.16, H * 0.14, "#3a3a44");
      maBox(g, W * 0.3, H * 0.4, W * 0.4, H * 0.35, 4, "#1a1a1e", { k: 0.2 });
      g.strokeStyle = "rgba(180,120,255,.6)";
      g.lineWidth = Math.max(1, W * 0.006);
      g.strokeRect(W * 0.31, H * 0.41, W * 0.38, H * 0.33);
      mPaper(g, W * 0.45, H * 0.55, H * 0.1, R);
    }
  },
  {
    id: "lockers",
    nome: "Armários (vestiário)",
    cat: "Ordem e arsenal",
    w: 3,
    h: 0.5,
    draw: (g, W, H, R) => {
      for (let i = 0; i < 6; i++) {
        maBox(g, (W * i) / 6, 0, W / 6, H, 1, "#4a5a6a", { k: 0.15 });
        g.fillStyle = "rgba(0,0,0,.4)";
        for (let k = 0; k < 3; k++) g.fillRect((W * i) / 6 + W * 0.03, H * (0.2 + k * 0.12), W * 0.1, 1);
      }
    }
  },
  {
    id: "bandeira",
    nome: "Símbolo no chão (genérico)",
    cat: "Ordem e arsenal",
    w: 2,
    h: 2,
    z: 0,
    draw: (g, W, H, R) => {
      g.strokeStyle = "rgba(200,180,120,.5)";
      g.lineWidth = Math.max(1, W * 0.02);
      g.beginPath();
      g.arc(W / 2, H / 2, W * 0.42, 0, 7);
      g.stroke();
      g.beginPath();
      for (let i = 0; i <= 5; i++) {
        const a = -1.57 + i * 2.513;
        g.lineTo(W / 2 + Math.cos(a) * W * 0.38, H / 2 + Math.sin(a) * H * 0.38);
      }
      g.stroke();
    }
  },
  /* ---------- PARANORMAL ---------- */
  {
    id: "circ_sangue",
    nome: "Círculo de ritual — Sangue",
    cat: "Paranormal",
    w: 3,
    h: 3,
    z: 0,
    luz: { r: 3, c: "#ff2a3a" },
    draw: (g, W, H, R) => mCircle(g, W, H, R, "#e0202e", "sangue")
  },
  {
    id: "circ_morte",
    nome: "Círculo de ritual — Morte",
    cat: "Paranormal",
    w: 3,
    h: 3,
    z: 0,
    luz: { r: 2.5, c: "#8a8f9a" },
    draw: (g, W, H, R) => mCircle(g, W, H, R, "#b8bcc4", "morte")
  },
  {
    id: "circ_conh",
    nome: "Círculo de ritual — Conhecimento",
    cat: "Paranormal",
    w: 3,
    h: 3,
    z: 0,
    luz: { r: 3, c: "#ffcc4a" },
    draw: (g, W, H, R) => mCircle(g, W, H, R, "#f0c040", "conhecimento")
  },
  {
    id: "circ_energia",
    nome: "Círculo de ritual — Energia",
    cat: "Paranormal",
    w: 3,
    h: 3,
    z: 0,
    luz: { r: 3, c: "#b45cff" },
    draw: (g, W, H, R) => mCircle(g, W, H, R, "#b45cff", "energia")
  },
  {
    id: "circ_medo",
    nome: "Círculo de ritual — Medo",
    cat: "Paranormal",
    w: 3,
    h: 3,
    z: 0,
    luz: { r: 3, c: "#e8f0ff" },
    draw: (g, W, H, R) => mCircle(g, W, H, R, "#eef2ff", "medo")
  },
  {
    id: "velas",
    nome: "Velas",
    cat: "Paranormal",
    w: 1,
    h: 1,
    luz: { r: 2.4, c: "#ffb85a" },
    draw: (g, W, H, R) => {
      for (let i = 0; i < 5; i++)
        mCandle(g, W * (0.2 + R() * 0.6), H * (0.2 + R() * 0.6), W * (0.05 + R() * 0.04));
    }
  },
  {
    id: "altar",
    nome: "Altar",
    cat: "Paranormal",
    w: 2,
    h: 1,
    draw: (g, W, H, R) => {
      maBox(g, 0, H * 0.1, W, H * 0.8, 2, "#2a2422", { k: 0.2 });
      g.fillStyle = "#6e1c22";
      g.fillRect(W * 0.1, H * 0.15, W * 0.8, H * 0.7);
      mCandle(g, W * 0.12, H * 0.3, W * 0.035);
      mCandle(g, W * 0.88, H * 0.3, W * 0.035);
      maBox(g, W * 0.38, H * 0.3, W * 0.24, H * 0.4, 2, "#3a2a1a");
      maCirc(g, W * 0.5, H * 0.5, H * 0.08, "#e0303f");
    }
  },
  {
    id: "sangue",
    nome: "Poça de sangue",
    cat: "Paranormal",
    w: 1,
    h: 1,
    z: 0,
    draw: (g, W, H, R) => mSplat(g, W, H, R, "#5e0810")
  },
  {
    id: "respingos",
    nome: "Respingos de sangue",
    cat: "Paranormal",
    w: 1,
    h: 1,
    z: 0,
    draw: (g, W, H, R) => {
      for (let i = 0; i < 22; i++) {
        g.fillStyle = maPick(["#6a0a12", "#4a060c", "#7a1018"], R);
        const a = R() * 7,
          d = W * 0.4 * R();
        g.beginPath();
        g.ellipse(
          W / 2 + Math.cos(a) * d,
          H / 2 + Math.sin(a) * d,
          W * (0.01 + R() * 0.04),
          W * (0.008 + R() * 0.02),
          a,
          0,
          7
        );
        g.fill();
      }
    }
  },
  {
    id: "rastro",
    nome: "Rastro de sangue",
    cat: "Paranormal",
    w: 3,
    h: 1,
    z: 0,
    draw: (g, W, H, R) => {
      g.strokeStyle = "rgba(90,8,16,.85)";
      g.lineCap = "round";
      for (let k = 0; k < 3; k++) {
        g.lineWidth = H * (0.08 + R() * 0.08);
        g.beginPath();
        g.moveTo(W * 0.03, H * (0.4 + R() * 0.2));
        g.bezierCurveTo(
          W * 0.35,
          H * (0.2 + R() * 0.6),
          W * 0.65,
          H * (0.2 + R() * 0.6),
          W * 0.97,
          H * (0.4 + R() * 0.2)
        );
        g.stroke();
      }
    }
  },
  {
    id: "maos",
    nome: "Marcas de mãos",
    cat: "Paranormal",
    w: 1,
    h: 1,
    z: 0,
    draw: (g, W, H, R) => {
      for (let i = 0; i < 3; i++) {
        const x = W * (0.2 + R() * 0.6),
          y = H * (0.2 + R() * 0.6);
        g.fillStyle = "rgba(100,8,16,.8)";
        g.beginPath();
        g.ellipse(x, y, W * 0.06, H * 0.07, 0, 0, 7);
        g.fill();
        for (let k = 0; k < 5; k++) {
          g.beginPath();
          g.ellipse(x + (k - 2) * W * 0.03, y - H * 0.1, W * 0.012, H * 0.035, (k - 2) * 0.15, 0, 7);
          g.fill();
        }
      }
    }
  },
  {
    id: "garras",
    nome: "Marcas de garra",
    cat: "Paranormal",
    w: 1,
    h: 1,
    z: 0,
    draw: (g, W, H, R) => {
      for (let k = 0; k < 4; k++)
        maLine(
          g,
          [
            [W * (0.2 + k * 0.15), H * 0.15],
            [W * (0.3 + k * 0.15), H * 0.85]
          ],
          "rgba(0,0,0,.75)",
          W * 0.035
        );
      for (let k = 0; k < 4; k++)
        maLine(
          g,
          [
            [W * (0.2 + k * 0.15), H * 0.15],
            [W * (0.3 + k * 0.15), H * 0.85]
          ],
          "rgba(160,140,130,.25)",
          W * 0.01
        );
    }
  },
  {
    id: "corpo",
    nome: "Corpo coberto",
    cat: "Paranormal",
    w: 1,
    h: 2,
    draw: (g, W, H, R) => {
      maBlob(g, W / 2, H * 0.15, W * 0.22, R, "#cfcabc", { n: 10, j: 0.1 });
      maBox(g, W * 0.12, H * 0.15, W * 0.76, H * 0.8, W * 0.3, "#cfcabc", { k: 0.15 });
      g.fillStyle = "rgba(110,10,18,.8)";
      g.beginPath();
      g.ellipse(W * 0.4, H * 0.5, W * 0.2, H * 0.08, 0.4, 0, 7);
      g.fill();
      mSplat(g, W * 1.4, H * 0.6, R, "rgba(80,6,12,.7)", { n: 4, big: 0.2 });
    }
  },
  {
    id: "ossos",
    nome: "Ossos",
    cat: "Paranormal",
    w: 1,
    h: 1,
    z: 0,
    draw: (g, W, H, R) => {
      for (let i = 0; i < 5; i++) {
        g.save();
        g.translate(W * (0.2 + R() * 0.6), H * (0.2 + R() * 0.6));
        g.rotate(R() * 7);
        const l = W * (0.15 + R() * 0.12);
        maLine(
          g,
          [
            [-l, 0],
            [l, 0]
          ],
          MA_INK,
          W * 0.07
        );
        maLine(
          g,
          [
            [-l, 0],
            [l, 0]
          ],
          "#d8d0b8",
          W * 0.045
        );
        [
          [-l, 0],
          [l, 0]
        ].forEach(([x]) => {
          maCirc(g, x, -W * 0.02, W * 0.03, "#d8d0b8", { lw: 0.6 });
          maCirc(g, x, W * 0.02, W * 0.03, "#d8d0b8", { lw: 0.6 });
        });
        g.restore();
      }
      maCirc(g, W * 0.6, H * 0.6, W * 0.1, "#d8d0b8");
      g.fillStyle = "#111";
      g.beginPath();
      g.arc(W * 0.57, H * 0.58, W * 0.025, 0, 7);
      g.arc(W * 0.64, H * 0.58, W * 0.025, 0, 7);
      g.fill();
    }
  },
  {
    id: "gaiola",
    nome: "Gaiola",
    cat: "Paranormal",
    w: 1,
    h: 1,
    draw: (g, W, H, R) => {
      maBox(g, W * 0.06, H * 0.06, W * 0.88, H * 0.88, 2, "rgba(0,0,0,.25)");
      for (let i = 0; i < 7; i++) {
        maLine(
          g,
          [
            [W * (0.06 + i * 0.147), H * 0.06],
            [W * (0.06 + i * 0.147), H * 0.94]
          ],
          "#2b2d30",
          maLW(1.4)
        );
      }
      g.strokeStyle = MA_INK;
      g.lineWidth = maLW(1.6);
      g.strokeRect(W * 0.06, H * 0.06, W * 0.88, H * 0.88);
    }
  },
  {
    id: "livro",
    nome: "Livro amaldiçoado",
    cat: "Paranormal",
    w: 0.5,
    h: 0.5,
    luz: { r: 1.6, c: "#b45cff" },
    draw: (g, W, H, R) => {
      maBox(g, W * 0.08, H * 0.22, W * 0.84, H * 0.56, 2, "#3a1a2a");
      maBox(g, W * 0.12, H * 0.26, W * 0.37, H * 0.48, 1, "#d8cfb8", { lw: 0.6 });
      maBox(g, W * 0.51, H * 0.26, W * 0.37, H * 0.48, 1, "#d8cfb8", { lw: 0.6 });
      g.fillStyle = "#6a2a9a";
      for (let i = 0; i < 4; i++) {
        g.fillRect(W * 0.16, H * (0.34 + i * 0.09), W * 0.28, 1);
        g.fillRect(W * 0.55, H * (0.34 + i * 0.09), W * 0.28, 1);
      }
    }
  },
  {
    id: "espelho",
    nome: "Espelho quebrado",
    cat: "Paranormal",
    w: 1,
    h: 0.5,
    draw: (g, W, H, R) => {
      maBox(g, 0, H * 0.1, W, H * 0.8, 3, "#6a5030");
      maBox(g, W * 0.08, H * 0.2, W * 0.84, H * 0.6, 2, "#8fa6b0", { k: 0.3 });
      g.strokeStyle = "rgba(20,20,20,.7)";
      g.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        g.beginPath();
        g.moveTo(W * 0.45, H * 0.5);
        g.lineTo(W * (0.1 + R() * 0.8), H * (0.2 + R() * 0.6));
        g.stroke();
      }
    }
  },
  {
    id: "fenda",
    nome: "Fenda dimensional",
    cat: "Paranormal",
    w: 2,
    h: 2,
    z: 0,
    luz: { r: 3.5, c: "#a24aff" },
    draw: (g, W, H, R) => {
      const cx = W / 2,
        cy = H / 2;
      g.save();
      g.shadowColor = "#b45cff";
      g.shadowBlur = W * 0.15;
      g.beginPath();
      g.moveTo(cx - W * 0.05, cy - H * 0.45);
      for (let i = 0; i < 8; i++)
        g.lineTo(
          cx + (i % 2 ? W * 0.14 : -W * 0.12) * (1 - Math.abs(i - 4) / 5),
          cy - H * 0.45 + i * H * 0.12
        );
      g.lineTo(cx + W * 0.04, cy + H * 0.45);
      for (let i = 7; i >= 0; i--)
        g.lineTo(cx + (i % 2 ? W * 0.04 : -W * 0.03), cy - H * 0.45 + i * H * 0.12);
      g.closePath();
      g.fillStyle = "#0a0412";
      g.fill();
      g.strokeStyle = "#c88aff";
      g.lineWidth = Math.max(1.5, W * 0.02);
      g.stroke();
      g.restore();
      for (let i = 0; i < 10; i++) {
        g.strokeStyle = "rgba(160,90,255,.35)";
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(cx, cy);
        const a = R() * 7;
        g.lineTo(cx + Math.cos(a) * W * 0.45, cy + Math.sin(a) * H * 0.45);
        g.stroke();
      }
    }
  },
  {
    id: "tentaculos",
    nome: "Raízes / tentáculos",
    cat: "Paranormal",
    w: 2,
    h: 2,
    draw: (g, W, H, R) => {
      for (let i = 0; i < 6; i++) {
        const a = R() * 7;
        let x = W / 2,
          y = H / 2;
        const pts = [[x, y]];
        for (let k = 0; k < 5; k++) {
          x += Math.cos(a + (R() - 0.5)) * W * 0.1;
          y += Math.sin(a + (R() - 0.5)) * H * 0.1;
          pts.push([x, y]);
        }
        maLine(g, pts, MA_INK, W * 0.08);
        maLine(g, pts, maPick(["#3a1a24", "#4a2030", "#2a1a1a"], R), W * 0.05);
      }
      maBlob(g, W / 2, H / 2, W * 0.14, R, "#3a1520", { n: 10 });
    }
  },
  {
    id: "casulo",
    nome: "Casulos",
    cat: "Paranormal",
    w: 1,
    h: 1,
    draw: (g, W, H, R) => {
      for (let i = 0; i < 3; i++)
        maEll(g, W * (0.25 + R() * 0.5), H * (0.25 + R() * 0.5), W * 0.13, H * 0.2, "#c8c0a8", {
          rot: R() * 3,
          k: 0.25
        });
      g.strokeStyle = "rgba(230,230,230,.35)";
      g.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        g.beginPath();
        g.moveTo(W * R(), H * R());
        g.lineTo(W * R(), H * R());
        g.stroke();
      }
    }
  },
  {
    id: "cristal",
    nome: "Cristais de Energia",
    cat: "Paranormal",
    w: 1,
    h: 1,
    luz: { r: 2.2, c: "#b45cff" },
    draw: (g, W, H, R) => {
      for (let i = 0; i < 5; i++) {
        g.save();
        g.translate(W * (0.3 + R() * 0.4), H * (0.3 + R() * 0.4));
        g.rotate(R() * 7);
        g.beginPath();
        g.moveTo(0, -H * 0.2);
        g.lineTo(W * 0.07, 0);
        g.lineTo(0, H * 0.08);
        g.lineTo(-W * 0.07, 0);
        g.closePath();
        g.fillStyle = maGrad(g, -W * 0.07, -H * 0.2, W * 0.14, H * 0.28, "#9a4aff", 0.35);
        g.fill();
        g.lineWidth = maLW();
        g.strokeStyle = MA_INK;
        g.stroke();
        g.restore();
      }
    }
  },
  {
    id: "sigilo",
    nome: "Sigilos pintados",
    cat: "Paranormal",
    w: 2,
    h: 2,
    z: 0,
    draw: (g, W, H, R) => {
      g.strokeStyle = "rgba(150,10,20,.85)";
      g.lineWidth = Math.max(1.5, W * 0.025);
      g.lineCap = "round";
      for (let i = 0; i < 4; i++) {
        const x = W * (0.2 + R() * 0.6),
          y = H * (0.2 + R() * 0.6),
          s = W * 0.12;
        g.beginPath();
        g.moveTo(x - s, y - s);
        g.lineTo(x + s * (R() - 0.5), y + s);
        g.lineTo(x + s, y - s * R());
        g.moveTo(x - s * 0.6, y);
        g.lineTo(x + s * 0.6, y);
        g.stroke();
      }
    }
  },
  {
    id: "cinzasd",
    nome: "Corpo carbonizado",
    cat: "Paranormal",
    w: 1,
    h: 2,
    z: 0,
    draw: (g, W, H, R) => {
      mSplat(g, W, H, R, "rgba(15,12,10,.85)", { n: 10, big: 0.4 });
      maBlob(g, W / 2, H * 0.25, W * 0.18, R, "#1a1412", { n: 9 });
      maBox(g, W * 0.28, H * 0.33, W * 0.44, H * 0.5, W * 0.18, "#1a1412");
    }
  },
  /* ---------- MARCAS E SUJEIRA (no chão) ---------- */
  {
    id: "sujeira",
    nome: "Sujeira",
    cat: "Marcas",
    w: 2,
    h: 2,
    z: 0,
    draw: (g, W, H, R) => {
      for (let i = 0; i < 5; i++) {
        const x = W * R(),
          y = H * R(),
          r = W * (0.15 + R() * 0.25);
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, "rgba(20,15,10,.35)");
        gr.addColorStop(1, "rgba(20,15,10,0)");
        g.fillStyle = gr;
        g.fillRect(0, 0, W, H);
      }
    }
  },
  {
    id: "rachadura",
    nome: "Rachadura",
    cat: "Marcas",
    w: 2,
    h: 2,
    z: 0,
    draw: (g, W, H, R) => {
      const br = (x, y, a, l, d) => {
        if (d > 4 || l < W * 0.03) return;
        const nx = x + Math.cos(a) * l,
          ny = y + Math.sin(a) * l;
        maLine(
          g,
          [
            [x, y],
            [nx, ny]
          ],
          "rgba(0,0,0,.7)",
          Math.max(1, (W * 0.012 * (5 - d)) / 2)
        );
        br(nx, ny, a + (R() - 0.5), l * 0.7, d + 1);
        if (R() < 0.5) br(nx, ny, a + (R() - 0.5) * 2, l * 0.5, d + 1);
      };
      for (let i = 0; i < 3; i++) br(W / 2, H / 2, R() * 7, W * 0.2, 0);
    }
  },
  {
    id: "folhas",
    nome: "Folhas secas",
    cat: "Marcas",
    w: 1,
    h: 1,
    z: 0,
    draw: (g, W, H, R) => {
      for (let i = 0; i < 14; i++) {
        g.save();
        g.translate(W * R(), H * R());
        g.rotate(R() * 7);
        g.fillStyle = maPick(["#6a4a1c", "#8a5a1e", "#5a3a16"], R);
        g.beginPath();
        g.ellipse(0, 0, W * 0.06, W * 0.03, 0, 0, 7);
        g.fill();
        g.restore();
      }
    }
  },
  {
    id: "poca",
    nome: "Poça d'água",
    cat: "Marcas",
    w: 1,
    h: 1,
    z: 0,
    draw: (g, W, H, R) => {
      maBlob(g, W / 2, H / 2, W * 0.38, R, "#2a3a44", { ink: false, n: 12, j: 0.4, k: 0.15 });
      g.fillStyle = "rgba(200,230,240,.18)";
      g.beginPath();
      g.ellipse(W * 0.4, H * 0.4, W * 0.15, H * 0.05, -0.4, 0, 7);
      g.fill();
    }
  },
  {
    id: "vidros",
    nome: "Cacos de vidro",
    cat: "Marcas",
    w: 1,
    h: 1,
    z: 0,
    draw: (g, W, H, R) => {
      for (let i = 0; i < 14; i++) {
        g.save();
        g.translate(W * R(), H * R());
        g.rotate(R() * 7);
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(W * 0.06 * R() + 2, W * 0.02);
        g.lineTo(W * 0.02, W * 0.05 * R() + 2);
        g.closePath();
        g.fillStyle = "rgba(200,230,245,.6)";
        g.fill();
        g.restore();
      }
    }
  },
  {
    id: "escombros",
    nome: "Escombros",
    cat: "Marcas",
    w: 2,
    h: 2,
    draw: (g, W, H, R) => {
      for (let i = 0; i < 14; i++) {
        g.save();
        g.translate(W * (0.15 + R() * 0.7), H * (0.15 + R() * 0.7));
        g.rotate(R() * 7);
        const s = W * (0.05 + R() * 0.1);
        maBox(
          g,
          -s / 2,
          -s / 2,
          s,
          s * (0.5 + R() * 0.6),
          1,
          maPick(["#5a5e60", "#6a6058", "#4a4e50", "#7a3a2a"], R),
          { k: 0.2, lw: 0.7 }
        );
        g.restore();
      }
    }
  },
  {
    id: "teia",
    nome: "Teia de aranha",
    cat: "Marcas",
    w: 1,
    h: 1,
    z: 2,
    draw: (g, W, H, R) => {
      g.strokeStyle = "rgba(230,230,230,.35)";
      g.lineWidth = 1;
      for (let i = 0; i < 7; i++) {
        g.beginPath();
        g.moveTo(0, 0);
        const a = (i / 6) * 1.57;
        g.lineTo(Math.cos(a) * W, Math.sin(a) * H);
        g.stroke();
      }
      for (let k = 1; k < 5; k++) {
        g.beginPath();
        for (let i = 0; i < 7; i++) {
          const a = (i / 6) * 1.57;
          g.lineTo((Math.cos(a) * W * k) / 5, (Math.sin(a) * H * k) / 5);
        }
        g.stroke();
      }
    }
  },
  {
    id: "pegadas",
    nome: "Pegadas",
    cat: "Marcas",
    w: 1,
    h: 2,
    z: 0,
    draw: (g, W, H, R) => {
      g.fillStyle = "rgba(20,12,8,.55)";
      for (let i = 0; i < 5; i++) {
        g.beginPath();
        g.ellipse(W * (i % 2 ? 0.62 : 0.38), H * (0.9 - i * 0.19), W * 0.07, H * 0.05, 0, 0, 7);
        g.fill();
      }
    }
  },
  {
    id: "lixo",
    nome: "Lixo espalhado",
    cat: "Marcas",
    w: 1,
    h: 1,
    z: 0,
    draw: (g, W, H, R) => {
      for (let i = 0; i < 9; i++) {
        if (R() < 0.5) mPaper(g, W * R(), H * R(), W * 0.12, R);
        else
          maCirc(g, W * R(), H * R(), W * 0.04, maPick(["#8a2a2a", "#3a6a3a", "#d8d0c0", "#2a2a2a"], R), {
            lw: 0.6
          });
      }
    }
  },
  {
    id: "tapeteb",
    nome: "Tapete de entrada",
    cat: "Marcas",
    w: 1,
    h: 0.5,
    z: 0,
    draw: (g, W, H, R) => maBox(g, W * 0.05, H * 0.1, W * 0.9, H * 0.8, 2, "#3a2a22", { k: 0.05 })
  },
  /* ---------- LUZES (só iluminam; não aparecem) ---------- */
  {
    id: "luzteto",
    nome: "Luz de teto (amarela)",
    cat: "Luzes",
    w: 0.5,
    h: 0.5,
    z: 2,
    luz: { r: 4, c: "#ffe0a8" },
    invis: true
  },
  {
    id: "luzbranca",
    nome: "Luz fria (branca)",
    cat: "Luzes",
    w: 0.5,
    h: 0.5,
    z: 2,
    luz: { r: 4, c: "#e8f4ff" },
    invis: true
  },
  {
    id: "luzverm",
    nome: "Luz vermelha",
    cat: "Luzes",
    w: 0.5,
    h: 0.5,
    z: 2,
    luz: { r: 3.5, c: "#ff3040" },
    invis: true
  },
  {
    id: "luzroxa",
    nome: "Luz roxa",
    cat: "Luzes",
    w: 0.5,
    h: 0.5,
    z: 2,
    luz: { r: 3.5, c: "#a24aff" },
    invis: true
  },
  {
    id: "luzverde",
    nome: "Luz verde",
    cat: "Luzes",
    w: 0.5,
    h: 0.5,
    z: 2,
    luz: { r: 3.5, c: "#5aff8a" },
    invis: true
  },
  {
    id: "luzazul",
    nome: "Luz azul",
    cat: "Luzes",
    w: 0.5,
    h: 0.5,
    z: 2,
    luz: { r: 3.5, c: "#5aa8ff" },
    invis: true
  },
  {
    id: "luzgrande",
    nome: "Luz grande (sala inteira)",
    cat: "Luzes",
    w: 0.5,
    h: 0.5,
    z: 2,
    luz: { r: 8, c: "#ffe8c0" },
    invis: true
  },
  {
    id: "lampada",
    nome: "Lâmpada pendurada",
    cat: "Luzes",
    w: 0.5,
    h: 0.5,
    z: 2,
    luz: { r: 3.5, c: "#ffd890" },
    draw: (g, W, H, R) => {
      maCirc(g, W / 2, H / 2, W * 0.16, "#fff3c8", { k: 0.1 });
    }
  },
  {
    id: "lanterna",
    nome: "Lanterna no chão",
    cat: "Luzes",
    w: 0.5,
    h: 0.5,
    luz: { r: 3, c: "#f0f4ff" },
    draw: (g, W, H, R) => {
      maBox(g, W * 0.2, H * 0.4, W * 0.6, H * 0.2, W * 0.08, "#222");
      maCirc(g, W * 0.8, H * 0.5, W * 0.1, "#f0f4ff", { k: 0.1 });
    }
  },
  /* ---------- AEROPORTO E BUNKER ---------- */
  {
    id: "elevador",
    nome: "Elevador de carga",
    cat: "Aeroporto e bunker",
    w: 3,
    h: 3,
    z: 0,
    draw: (g, W, H) => {
      maBox(g, 0, 0, W, H, 2, "#3a3e44", { k: 0.1 });
      // faixa zebrada de segurança na borda
      const b = W * 0.08;
      g.save();
      maRR(g, 0, 0, W, H, 2);
      g.clip();
      for (let i = -H; i < W + H; i += b * 1.6) {
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i + b * 0.8, 0);
        g.lineTo(i + b * 0.8 - H, H);
        g.lineTo(i - H, H);
        g.closePath();
        g.fillStyle = "#c9a227";
        g.fill();
      }
      g.restore();
      maBox(g, b, b, W - b * 2, H - b * 2, 1, "#4a4f56", { k: 0.12 });
      // chapa xadrez
      g.strokeStyle = "rgba(255,255,255,.08)";
      g.lineWidth = 1;
      for (let x = b * 1.5; x < W - b; x += W * 0.07)
        for (let y = b * 1.5; y < H - b; y += H * 0.07) {
          g.beginPath();
          g.moveTo(x, y);
          g.lineTo(x + W * 0.03, y + H * 0.02);
          g.stroke();
        }
      // portas (em cima) e seta para baixo
      maBox(g, W * 0.12, 0, W * 0.37, H * 0.06, 1, "#7a8088");
      maBox(g, W * 0.51, 0, W * 0.37, H * 0.06, 1, "#7a8088");
      g.fillStyle = "rgba(201,162,39,.85)";
      g.beginPath();
      g.moveTo(W * 0.5, H * 0.72);
      g.lineTo(W * 0.36, H * 0.52);
      g.lineTo(W * 0.45, H * 0.52);
      g.lineTo(W * 0.45, H * 0.3);
      g.lineTo(W * 0.55, H * 0.3);
      g.lineTo(W * 0.55, H * 0.52);
      g.lineTo(W * 0.64, H * 0.52);
      g.closePath();
      g.fill();
      maBox(g, W * 0.88, H * 0.12, W * 0.08, H * 0.14, 1, "#22262a");
      maCirc(g, W * 0.92, H * 0.17, W * 0.018, "#e04040", { ink: false });
    }
  },
  {
    id: "aviao",
    nome: "Avião de carga",
    cat: "Aeroporto e bunker",
    w: 8,
    h: 7,
    cores: ["#d9dde2", "#c8ccd0", "#e6e1d4"],
    draw: (g, W, H, R, c) => {
      const poly = (pts, cor) => {
        g.beginPath();
        pts.forEach(([x, y], i) => (i ? g.lineTo(x * W, y * H) : g.moveTo(x * W, y * H)));
        g.closePath();
        g.fillStyle = maGrad(g, 0, 0, W, H, cor, 0.1);
        g.fill();
        g.lineWidth = maLW();
        g.strokeStyle = MA_INK;
        g.stroke();
      };
      // asas e cauda
      poly(
        [
          [0.42, 0.44],
          [0.62, 0.44],
          [0.5, 0.02],
          [0.44, 0.02]
        ],
        maTone(c, -0.08)
      );
      poly(
        [
          [0.42, 0.56],
          [0.62, 0.56],
          [0.5, 0.98],
          [0.44, 0.98]
        ],
        maTone(c, -0.08)
      );
      poly(
        [
          [0.06, 0.47],
          [0.16, 0.47],
          [0.1, 0.27],
          [0.06, 0.27]
        ],
        maTone(c, -0.08)
      );
      poly(
        [
          [0.06, 0.53],
          [0.16, 0.53],
          [0.1, 0.73],
          [0.06, 0.73]
        ],
        maTone(c, -0.08)
      );
      // motores
      [0.2, 0.32, 0.68, 0.8].forEach(y =>
        maBox(g, W * 0.52, H * y - H * 0.03, W * 0.11, H * 0.06, H * 0.03, "#8a9098")
      );
      // fuselagem
      maEll(g, W * 0.5, H * 0.5, W * 0.47, H * 0.075, c);
      maEll(g, W * 0.93, H * 0.5, W * 0.035, H * 0.045, "#2a3440", { ink: false });
      g.fillStyle = "rgba(0,0,0,.12)";
      g.fillRect(W * 0.1, H * 0.5, W * 0.78, H * 0.012);
      g.fillStyle = "#6e1c22";
      g.fillRect(W * 0.04, H * 0.485, W * 0.06, H * 0.03);
    }
  },
  {
    id: "empilhadeira",
    nome: "Empilhadeira",
    cat: "Aeroporto e bunker",
    w: 1,
    h: 2,
    draw: (g, W, H) => {
      maBox(g, W * 0.3, 0, W * 0.08, H * 0.32, 1, "#9aa0a6");
      maBox(g, W * 0.62, 0, W * 0.08, H * 0.32, 1, "#9aa0a6");
      maBox(g, W * 0.15, H * 0.3, W * 0.7, H * 0.06, 1, "#2a2c30");
      maBox(g, W * 0.1, H * 0.36, W * 0.8, H * 0.6, W * 0.12, "#d4a017", { k: 0.18 });
      maBox(g, W * 0.24, H * 0.5, W * 0.52, H * 0.26, 2, "#2a2c30");
      [0.42, 0.86].forEach(y => {
        maBox(g, 0, H * y - H * 0.05, W * 0.12, H * 0.1, 2, "#111");
        maBox(g, W * 0.88, H * y - H * 0.05, W * 0.12, H * 0.1, 2, "#111");
      });
    }
  },
  {
    id: "carrinhobag",
    nome: "Carrinho de bagagens",
    cat: "Aeroporto e bunker",
    w: 2,
    h: 1,
    draw: (g, W, H, R) => {
      maBox(g, W * 0.02, H * 0.1, W * 0.96, H * 0.8, 2, "#5a6068", { k: 0.1 });
      const cs = ["#6e1c22", "#2a4a6a", "#3c3c3c", "#7a5a2a", "#4a6a3a"];
      let x = W * 0.06;
      while (x < W * 0.86) {
        const w = W * (0.16 + R() * 0.12);
        maBox(
          g,
          x,
          H * (0.18 + R() * 0.08),
          Math.min(w, W * 0.92 - x),
          H * 0.56,
          2,
          cs[Math.floor(R() * cs.length)]
        );
        x += w + W * 0.02;
      }
      maLine(
        g,
        [
          [W * 0.98, H * 0.3],
          [W, H * 0.3],
          [W, H * 0.7],
          [W * 0.98, H * 0.7]
        ],
        "#222",
        maLW(1.4)
      );
    }
  },
  {
    id: "esteira",
    nome: "Esteira de bagagens",
    cat: "Aeroporto e bunker",
    w: 4,
    h: 1,
    draw: (g, W, H, R) => {
      maBox(g, 0, 0, W, H, 3, "#4a4e54", { k: 0.08 });
      maBox(g, W * 0.02, H * 0.15, W * 0.96, H * 0.7, 2, "#1d1f22", { k: 0.05 });
      g.strokeStyle = "rgba(255,255,255,.1)";
      g.lineWidth = 1;
      for (let x = W * 0.03; x < W * 0.97; x += W * 0.03) {
        g.beginPath();
        g.moveTo(x, H * 0.16);
        g.lineTo(x, H * 0.84);
        g.stroke();
      }
      [0.15, 0.45, 0.72].forEach(f =>
        maBox(
          g,
          W * f,
          H * 0.25,
          W * 0.12,
          H * 0.5,
          2,
          maPick(["#6e1c22", "#2a4a6a", "#7a5a2a", "#3c3c3c"], R)
        )
      );
    }
  },
  {
    id: "catraca",
    nome: "Catraca de segurança",
    cat: "Aeroporto e bunker",
    w: 1,
    h: 0.5,
    draw: (g, W, H) => {
      maBox(g, 0, H * 0.15, W * 0.25, H * 0.7, 2, "#8a9098");
      maBox(g, W * 0.75, H * 0.15, W * 0.25, H * 0.7, 2, "#8a9098");
      maLine(
        g,
        [
          [W * 0.25, H * 0.5],
          [W * 0.75, H * 0.5]
        ],
        "#c9a227",
        maLW(1.6)
      );
      maCirc(g, W * 0.12, H * 0.5, H * 0.12, "#3fbf5f", { ink: false });
    }
  },
  {
    id: "portacofre",
    nome: "Porta blindada (cofre)",
    cat: "Aeroporto e bunker",
    w: 2,
    h: 0.5,
    draw: (g, W, H) => {
      maBox(g, 0, 0, W, H, 2, "#3a3e44");
      maBox(g, W * 0.06, H * 0.15, W * 0.88, H * 0.7, 2, "#6a7078", { k: 0.2 });
      maCirc(g, W * 0.5, H * 0.5, H * 0.3, "#8a9098");
      maLine(
        g,
        [
          [W * 0.5 - H * 0.3, H * 0.5],
          [W * 0.5 + H * 0.3, H * 0.5]
        ],
        "#2a2c30",
        maLW(0.8)
      );
      maLine(
        g,
        [
          [W * 0.5, H * 0.2],
          [W * 0.5, H * 0.8]
        ],
        "#2a2c30",
        maLW(0.8)
      );
    }
  },
  {
    id: "alvo",
    nome: "Alvo de tiro",
    cat: "Aeroporto e bunker",
    w: 1,
    h: 0.5,
    draw: (g, W, H) => {
      maBox(g, W * 0.05, H * 0.35, W * 0.9, H * 0.3, 1, "#5a3e28");
      maBox(g, W * 0.2, H * 0.1, W * 0.6, H * 0.8, 1, "#e8e2d0");
      maCirc(g, W * 0.5, H * 0.5, H * 0.32, "#e8e2d0", { lw: 0.7 });
      maCirc(g, W * 0.5, H * 0.5, H * 0.2, "#c0392b", { lw: 0.7 });
      maCirc(g, W * 0.5, H * 0.5, H * 0.08, "#111", { ink: false });
    }
  },
  {
    id: "saco",
    nome: "Saco de pancada",
    cat: "Aeroporto e bunker",
    w: 0.5,
    h: 0.5,
    draw: (g, W, H) => {
      maCirc(g, W / 2, H / 2, W * 0.42, "#6e1c22", { k: 0.25 });
      maCirc(g, W / 2, H / 2, W * 0.1, "#9aa0a6", { ink: false });
    }
  },
  {
    id: "tatame",
    nome: "Tatame",
    cat: "Aeroporto e bunker",
    w: 3,
    h: 3,
    z: 0,
    cores: ["#2a4a6a", "#6e1c22", "#2f5a3a"],
    draw: (g, W, H, R, c) => {
      maBox(g, 0, 0, W, H, 3, c, { k: 0.06 });
      g.strokeStyle = "rgba(0,0,0,.35)";
      g.lineWidth = 1;
      for (let i = 1; i < 3; i++) {
        g.beginPath();
        g.moveTo((W * i) / 3, 0);
        g.lineTo((W * i) / 3, H);
        g.moveTo(0, (H * i) / 3);
        g.lineTo(W, (H * i) / 3);
        g.stroke();
      }
      g.strokeStyle = "rgba(255,255,255,.25)";
      g.lineWidth = maLW(0.8);
      g.beginPath();
      g.arc(W / 2, H / 2, W * 0.28, 0, Math.PI * 2);
      g.stroke();
    }
  },
  {
    id: "ventilacao",
    nome: "Grade de ventilação",
    cat: "Aeroporto e bunker",
    w: 1,
    h: 1,
    z: 0,
    draw: (g, W, H) => {
      maBox(g, W * 0.1, H * 0.1, W * 0.8, H * 0.8, 2, "#3a3e44");
      g.strokeStyle = "rgba(0,0,0,.55)";
      g.lineWidth = maLW(0.6);
      for (let y = H * 0.2; y < H * 0.85; y += H * 0.1) {
        g.beginPath();
        g.moveTo(W * 0.18, y);
        g.lineTo(W * 0.82, y);
        g.stroke();
      }
    }
  },
  {
    id: "painel",
    nome: "Painel de controle",
    cat: "Aeroporto e bunker",
    w: 2,
    h: 0.5,
    draw: (g, W, H, R) => {
      maBox(g, 0, 0, W, H, 2, "#2a2e34");
      for (let i = 0; i < 10; i++)
        maCirc(
          g,
          W * (0.08 + i * 0.09),
          H * 0.35,
          H * 0.08,
          maPick(["#3fbf5f", "#e04040", "#e0b030", "#3f8fbf"], R),
          { ink: false }
        );
      maBox(g, W * 0.06, H * 0.6, W * 0.88, H * 0.22, 1, "#14171b");
    }
  },
  /* ---------- BIBLIOTECA ---------- */
  {
    id: "escada",
    nome: "Escada (descendo)",
    cat: "Biblioteca",
    w: 2,
    h: 3,
    z: 0,
    cores: ["#4a4038", "#5a5e64", "#3a2a20"],
    draw: (g, W, H, R, c) => {
      maBox(g, 0, 0, W, H, 2, "#15161a", { k: 0.05 });
      const n = 9;
      for (let i = 0; i < n; i++) {
        // degraus ficam mais escuros conforme descem
        const k = -0.06 * i;
        maBox(g, W * 0.06, (H * i) / n + 1, W * 0.88, H / n - 2, 1, maTone(c, k), { k: 0.08, lw: 0.6 });
      }
      g.fillStyle = "rgba(0,0,0,.45)";
      g.fillRect(0, H * 0.7, W, H * 0.3);
      maLine(
        g,
        [
          [W * 0.04, H * 0.02],
          [W * 0.04, H * 0.98]
        ],
        "#2a2c30",
        maLW(1.2)
      );
      maLine(
        g,
        [
          [W * 0.96, H * 0.02],
          [W * 0.96, H * 0.98]
        ],
        "#2a2c30",
        maLW(1.2)
      );
    }
  },
  {
    id: "estantebib",
    nome: "Estante dupla de biblioteca",
    cat: "Biblioteca",
    w: 3,
    h: 1,
    cores: MC.mad,
    draw: (g, W, H, R, c) => {
      maBox(g, 0, 0, W, H, 1, c);
      const cs = ["#6e1c22", "#23324a", "#3a5a3a", "#8a6a3a", "#4a2a5a", "#d8d0c0", "#5a3a2a"];
      [0.06, 0.54].forEach(y0 => {
        let x = W * 0.02;
        while (x < W * 0.97) {
          const w = W * (0.03 + R() * 0.02);
          maBox(g, x, H * y0, Math.min(w, W * 0.98 - x), H * 0.4, 0, maPick(cs, R), { lw: 0.4, k: 0.12 });
          x += w + 0.5;
        }
      });
      g.fillStyle = maTone(c, -0.3);
      g.fillRect(0, H * 0.48, W, H * 0.04);
    }
  },
  {
    id: "globo",
    nome: "Globo antigo",
    cat: "Biblioteca",
    w: 1,
    h: 1,
    draw: (g, W, H) => {
      maCirc(g, W / 2, H / 2, W * 0.42, "#5a3e28");
      maCirc(g, W / 2, H / 2, W * 0.32, "#3f6a7a");
      g.fillStyle = "rgba(170,150,90,.75)";
      [
        [0.4, 0.4, 0.1],
        [0.58, 0.55, 0.08],
        [0.45, 0.62, 0.06]
      ].forEach(([x, y, r]) => {
        g.beginPath();
        g.ellipse(W * x, H * y, W * r, H * r * 0.7, 0.6, 0, Math.PI * 2);
        g.fill();
      });
      maLine(
        g,
        [
          [W * 0.2, H * 0.2],
          [W * 0.8, H * 0.8]
        ],
        "#c9a227",
        maLW(0.8)
      );
    }
  },
  {
    id: "vitrine",
    nome: "Vitrine de relíquias",
    cat: "Biblioteca",
    w: 2,
    h: 1,
    draw: (g, W, H, R) => {
      maBox(g, 0, 0, W, H, 2, "#3e2b1f");
      maBox(g, W * 0.05, H * 0.1, W * 0.9, H * 0.8, 1, "#1d2a30", { k: 0.05 });
      [0.22, 0.5, 0.78].forEach(x => {
        const t = R();
        if (t < 0.33) maCirc(g, W * x, H * 0.5, H * 0.18, "#c9a227", { lw: 0.6 });
        else if (t < 0.66) maBox(g, W * x - W * 0.07, H * 0.3, W * 0.14, H * 0.4, 1, "#d8d0c0", { lw: 0.6 });
        else maCirc(g, W * x, H * 0.5, H * 0.15, "#8a2a2a", { lw: 0.6 });
      });
      g.fillStyle = "rgba(200,230,255,.12)";
      g.fillRect(W * 0.05, H * 0.1, W * 0.9, H * 0.25);
    }
  },
  /* ---------- CEMITÉRIO E IGREJA ---------- */
  {
    id: "lapide",
    nome: "Lápide",
    cat: "Cemitério e igreja",
    w: 1,
    h: 0.5,
    cores: ["#8a8d90", "#6a6d70", "#b8b4aa", "#4a4c50"],
    draw: (g, W, H, R, c) => {
      maRR(g, W * 0.12, H * 0.08, W * 0.76, H * 0.84, H * 0.4);
      g.fillStyle = maGrad(g, 0, 0, W, H, c, 0.18);
      g.fill();
      g.lineWidth = maLW();
      g.strokeStyle = MA_INK;
      g.stroke();
      maLine(
        g,
        [
          [W * 0.5, H * 0.25],
          [W * 0.5, H * 0.72]
        ],
        "rgba(0,0,0,.35)",
        maLW(0.6)
      );
      maLine(
        g,
        [
          [W * 0.4, H * 0.4],
          [W * 0.6, H * 0.4]
        ],
        "rgba(0,0,0,.35)",
        maLW(0.6)
      );
      if (R() < 0.5) maBox(g, W * 0.7, H * 0.55, W * 0.14, H * 0.3, 2, "#3a5a2a", { ink: false });
    }
  },
  {
    id: "tumulo",
    nome: "Túmulo",
    cat: "Cemitério e igreja",
    w: 1,
    h: 2,
    cores: ["#9a9c9e", "#d8d4ca", "#5a5c60", "#7a6a5a"],
    draw: (g, W, H, R, c) => {
      maBox(g, W * 0.06, H * 0.02, W * 0.88, H * 0.96, 2, maTone(c, -0.1));
      maBox(g, W * 0.14, H * 0.2, W * 0.72, H * 0.74, 2, c, { k: 0.2 });
      maRR(g, W * 0.12, H * 0.02, W * 0.76, H * 0.2, W * 0.25);
      g.fillStyle = maTone(c, 0.12);
      g.fill();
      g.lineWidth = maLW();
      g.strokeStyle = MA_INK;
      g.stroke();
      maLine(
        g,
        [
          [W * 0.5, H * 0.35],
          [W * 0.5, H * 0.75]
        ],
        "rgba(0,0,0,.3)",
        maLW(0.7)
      );
      maLine(
        g,
        [
          [W * 0.35, H * 0.47],
          [W * 0.65, H * 0.47]
        ],
        "rgba(0,0,0,.3)",
        maLW(0.7)
      );
      if (R() < 0.6)
        for (let i = 0; i < 5; i++)
          maCirc(
            g,
            W * (0.3 + R() * 0.4),
            H * (0.82 + R() * 0.1),
            W * 0.06,
            maPick(["#c0392b", "#e8d24a", "#e8e2d0", "#8e44ad"], R),
            { ink: false }
          );
    }
  },
  {
    id: "cova",
    nome: "Cova aberta",
    cat: "Cemitério e igreja",
    w: 1,
    h: 2,
    z: 0,
    draw: (g, W, H, R) => {
      maBlob(g, W * 0.5, H * 0.08, W * 0.45, R, "#5a4030", { n: 10 });
      maBox(g, W * 0.12, H * 0.2, W * 0.76, H * 0.76, 2, "#14100c", { k: 0.05 });
      g.fillStyle = "rgba(90,64,48,.5)";
      g.fillRect(W * 0.12, H * 0.2, W * 0.76, H * 0.06);
    }
  },
  {
    id: "mausoleu",
    nome: "Mausoléu pequeno",
    cat: "Cemitério e igreja",
    w: 3,
    h: 3,
    cores: ["#a8a49a", "#6a6c70", "#d8d4ca"],
    draw: (g, W, H, R, c) => {
      maBox(g, W * 0.04, H * 0.04, W * 0.92, H * 0.86, 3, maTone(c, -0.12));
      // telhado de duas águas
      g.beginPath();
      g.moveTo(W * 0.08, H * 0.08);
      g.lineTo(W * 0.92, H * 0.08);
      g.lineTo(W * 0.92, H * 0.47);
      g.lineTo(W * 0.08, H * 0.47);
      g.closePath();
      g.fillStyle = maGrad(g, 0, 0, W, H * 0.5, c, 0.2);
      g.fill();
      g.beginPath();
      g.moveTo(W * 0.08, H * 0.47);
      g.lineTo(W * 0.92, H * 0.47);
      g.lineTo(W * 0.92, H * 0.86);
      g.lineTo(W * 0.08, H * 0.86);
      g.closePath();
      g.fillStyle = maGrad(g, 0, H * 0.5, W, H * 0.5, maTone(c, -0.15), 0.2);
      g.fill();
      g.lineWidth = maLW();
      g.strokeStyle = MA_INK;
      g.strokeRect(W * 0.08, H * 0.08, W * 0.84, H * 0.78);
      maLine(
        g,
        [
          [W * 0.08, H * 0.47],
          [W * 0.92, H * 0.47]
        ],
        MA_INK,
        maLW()
      );
      // cruz no topo, colunas e porta
      maLine(
        g,
        [
          [W * 0.5, H * 0.2],
          [W * 0.5, H * 0.38]
        ],
        "rgba(0,0,0,.45)",
        maLW(1.2)
      );
      maLine(
        g,
        [
          [W * 0.43, H * 0.26],
          [W * 0.57, H * 0.26]
        ],
        "rgba(0,0,0,.45)",
        maLW(1.2)
      );
      [0.14, 0.86].forEach(x => maCirc(g, W * x, H * 0.92, W * 0.05, maTone(c, 0.1)));
      maBox(g, W * 0.38, H * 0.84, W * 0.24, H * 0.13, 1, "#2a2420");
    }
  },
  {
    id: "cruz",
    nome: "Cruz",
    cat: "Cemitério e igreja",
    w: 1,
    h: 1,
    cores: ["#5a3e28", "#8a8d90", "#2d211a"],
    draw: (g, W, H, R, c) => {
      g.fillStyle = "rgba(0,0,0,.3)";
      g.fillRect(W * 0.5, H * 0.18, W * 0.14, H * 0.76);
      maBox(g, W * 0.43, H * 0.06, W * 0.14, H * 0.88, 1, c);
      maBox(g, W * 0.18, H * 0.26, W * 0.64, H * 0.14, 1, c);
    }
  },
  {
    id: "coroa",
    nome: "Coroa de flores",
    cat: "Cemitério e igreja",
    w: 0.5,
    h: 0.5,
    draw: (g, W, H, R) => {
      g.lineWidth = W * 0.16;
      g.strokeStyle = "#2f5a2a";
      g.beginPath();
      g.arc(W / 2, H / 2, W * 0.32, 0, Math.PI * 2);
      g.stroke();
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        maCirc(
          g,
          W / 2 + Math.cos(a) * W * 0.32,
          H / 2 + Math.sin(a) * H * 0.32,
          W * 0.07,
          maPick(["#c0392b", "#e8e2d0", "#e8d24a", "#8e44ad"], R),
          { ink: false }
        );
      }
      maLine(
        g,
        [
          [W * 0.45, H * 0.85],
          [W * 0.38, H],
          [W * 0.55, H * 0.85],
          [W * 0.62, H]
        ],
        "#6e1c22",
        maLW(0.8)
      );
    }
  },
  {
    id: "anjo",
    nome: "Estátua de anjo",
    cat: "Cemitério e igreja",
    w: 1,
    h: 1,
    draw: (g, W, H) => {
      maBox(g, W * 0.1, H * 0.1, W * 0.8, H * 0.8, 2, "#6a6c70");
      [-1, 1].forEach(sd =>
        maEll(g, W * (0.5 + sd * 0.2), H * 0.45, W * 0.2, H * 0.12, "#b8b4aa", { rot: sd * 0.5 })
      );
      maCirc(g, W * 0.5, H * 0.52, W * 0.15, "#c8c4ba");
      maCirc(g, W * 0.5, H * 0.32, W * 0.09, "#d0ccc2");
    }
  },
  {
    id: "bancoigreja",
    nome: "Banco de igreja",
    cat: "Cemitério e igreja",
    w: 3,
    h: 1,
    cores: MC.mad,
    draw: (g, W, H, R, c) => {
      maBox(g, 0, H * 0.1, W, H * 0.5, 2, c, { k: 0.18 });
      maBox(g, 0, H * 0.62, W, H * 0.18, 1, maTone(c, -0.15));
      maBox(g, 0, H * 0.05, W * 0.04, H * 0.8, 1, maTone(c, -0.2));
      maBox(g, W * 0.96, H * 0.05, W * 0.04, H * 0.8, 1, maTone(c, -0.2));
    }
  },
  {
    id: "pulpito",
    nome: "Púlpito",
    cat: "Cemitério e igreja",
    w: 1,
    h: 1,
    draw: (g, W, H) => {
      maBox(g, W * 0.1, H * 0.15, W * 0.8, H * 0.7, W * 0.12, "#5a3e28", { k: 0.2 });
      maBox(g, W * 0.22, H * 0.2, W * 0.56, H * 0.35, 1, "#3e2b1f");
      maBox(g, W * 0.3, H * 0.25, W * 0.4, H * 0.25, 1, "#d8d0c0", { lw: 0.5 });
    }
  },
  {
    id: "crucifixo",
    nome: "Crucifixo de parede",
    cat: "Cemitério e igreja",
    w: 1,
    h: 0.5,
    draw: (g, W, H) => {
      maBox(g, W * 0.44, 0, W * 0.12, H * 0.95, 1, "#5a3e28");
      maBox(g, W * 0.2, H * 0.22, W * 0.6, H * 0.16, 1, "#5a3e28");
      maCirc(g, W * 0.5, H * 0.3, W * 0.05, "#c9a227", { ink: false });
    }
  },
  {
    id: "vitral",
    nome: "Vitral",
    cat: "Cemitério e igreja",
    w: 2,
    h: 0.5,
    draw: (g, W, H, R) => {
      maBox(g, 0, 0, W, H, 2, "#22262a");
      const cs = ["#8e2a3a", "#2a4a8e", "#c9a227", "#2f7a4a", "#6a2a8e"];
      for (let i = 0; i < 8; i++)
        maBox(g, W * (0.04 + i * 0.115), H * 0.18, W * 0.105, H * 0.64, 0, maPick(cs, R), {
          lw: 0.4,
          k: 0.25
        });
      g.fillStyle = "rgba(255,240,200,.18)";
      g.fillRect(0, H, W, 0);
    }
  },
  {
    id: "confessionario",
    nome: "Confessionário",
    cat: "Cemitério e igreja",
    w: 2,
    h: 1,
    draw: (g, W, H) => {
      maBox(g, 0, 0, W, H, 2, "#3e2b1f", { k: 0.16 });
      maBox(g, W * 0.05, H * 0.1, W * 0.42, H * 0.8, 1, "#2d211a");
      maBox(g, W * 0.53, H * 0.1, W * 0.42, H * 0.8, 1, "#2d211a");
      g.strokeStyle = "rgba(201,162,39,.4)";
      g.lineWidth = 1;
      for (let x = W * 0.48; x < W * 0.53; x += 2) {
        g.beginPath();
        g.moveTo(x, H * 0.2);
        g.lineTo(x, H * 0.8);
        g.stroke();
      }
    }
  },
  {
    id: "piabatismal",
    nome: "Pia batismal",
    cat: "Cemitério e igreja",
    w: 1,
    h: 1,
    draw: (g, W, H) => {
      maCirc(g, W / 2, H / 2, W * 0.42, "#c8c4ba");
      maCirc(g, W / 2, H / 2, W * 0.28, "#5a8aa0", { k: 0.3 });
    }
  },
  /* ---------- COMÉRCIO ---------- */
  {
    id: "gondola",
    nome: "Gôndola de mercado",
    cat: "Comércio",
    w: 3,
    h: 1,
    draw: (g, W, H, R) => {
      maBox(g, 0, 0, W, H, 1, "#c8ccd0", { k: 0.08 });
      const cs = ["#c0392b", "#e8d24a", "#2a6a9a", "#3f9a4a", "#e07a2a", "#e8e2d0", "#7a3a8a"];
      [0.06, 0.54].forEach(y0 => {
        let x = W * 0.02;
        while (x < W * 0.96) {
          const w = W * (0.04 + R() * 0.05);
          maBox(g, x, H * y0, Math.min(w, W * 0.98 - x), H * 0.38, 1, maPick(cs, R), { lw: 0.4 });
          x += w + 1;
        }
      });
      g.fillStyle = "#8a8f94";
      g.fillRect(0, H * 0.47, W, H * 0.06);
    }
  },
  {
    id: "caixareg",
    nome: "Caixa (checkout)",
    cat: "Comércio",
    w: 2,
    h: 1,
    draw: (g, W, H) => {
      maBox(g, 0, H * 0.1, W, H * 0.55, 2, "#3a3e44");
      maBox(g, W * 0.04, H * 0.18, W * 0.5, H * 0.38, 1, "#1d1f22");
      maBox(g, W * 0.62, H * 0.15, W * 0.3, H * 0.4, 2, "#d8d4ca");
      maBox(g, W * 0.66, H * 0.2, W * 0.16, H * 0.14, 1, "#2a6a5a", { ink: false });
      mChair(g, W * 0.77, H * 0.85, W * 0.2, "#2f4a6a");
    }
  },
  {
    id: "freezer",
    nome: "Freezer horizontal",
    cat: "Comércio",
    w: 2,
    h: 1,
    draw: (g, W, H) => {
      maBox(g, 0, 0, W, H, 3, "#e0e4e8");
      maBox(g, W * 0.05, H * 0.12, W * 0.43, H * 0.76, 2, "#9ad0e8", { k: 0.25 });
      maBox(g, W * 0.52, H * 0.12, W * 0.43, H * 0.76, 2, "#9ad0e8", { k: 0.25 });
      g.fillStyle = "rgba(255,255,255,.35)";
      g.fillRect(W * 0.08, H * 0.18, W * 0.15, H * 0.1);
      g.fillRect(W * 0.55, H * 0.18, W * 0.15, H * 0.1);
    }
  },
  {
    id: "geladeiravert",
    nome: "Geladeira de bebidas",
    cat: "Comércio",
    w: 2,
    h: 0.5,
    draw: (g, W, H, R) => {
      maBox(g, 0, 0, W, H, 2, "#2a2e34");
      for (let i = 0; i < 12; i++)
        maBox(
          g,
          W * (0.04 + i * 0.077),
          H * 0.2,
          W * 0.06,
          H * 0.55,
          1,
          maPick(["#c0392b", "#2a6a9a", "#3f9a4a", "#e8d24a"], R),
          { lw: 0.4 }
        );
      g.fillStyle = "rgba(200,230,255,.15)";
      g.fillRect(0, 0, W, H * 0.3);
    }
  },
  {
    id: "carrinhomerc",
    nome: "Carrinho de compras",
    cat: "Comércio",
    w: 0.5,
    h: 1,
    draw: (g, W, H) => {
      maBox(g, W * 0.1, H * 0.15, W * 0.8, H * 0.65, 2, "#8a9098", { k: 0.1 });
      g.strokeStyle = "rgba(0,0,0,.35)";
      g.lineWidth = 1;
      for (let y = H * 0.22; y < H * 0.78; y += H * 0.08) {
        g.beginPath();
        g.moveTo(W * 0.15, y);
        g.lineTo(W * 0.85, y);
        g.stroke();
      }
      maLine(
        g,
        [
          [W * 0.05, H * 0.9],
          [W * 0.95, H * 0.9]
        ],
        "#c0392b",
        maLW(1.4)
      );
    }
  },
  /* ---------- TRANSPORTE ---------- */
  {
    id: "trilhos",
    nome: "Trilhos (trecho)",
    cat: "Transporte",
    w: 2,
    h: 3,
    z: 0,
    draw: (g, W, H) => {
      g.fillStyle = "#3a332c";
      g.fillRect(W * 0.08, 0, W * 0.84, H);
      for (let y = H * 0.04; y < H; y += H / 9)
        maBox(g, W * 0.06, y, W * 0.88, H * 0.06, 1, "#4a3420", { lw: 0.5 });
      [0.24, 0.76].forEach(x => {
        g.fillStyle = "#9aa0a6";
        g.fillRect(W * x - W * 0.03, 0, W * 0.06, H);
        g.fillStyle = "rgba(255,255,255,.3)";
        g.fillRect(W * x - W * 0.01, 0, W * 0.015, H);
      });
    }
  },
  {
    id: "vagao",
    nome: "Vagão (trem ou metrô)",
    cat: "Transporte",
    w: 2,
    h: 6,
    cores: ["#c8ccd0", "#6e1c22", "#2a4a6a", "#3a4a2a"],
    draw: (g, W, H, R, c) => {
      maBox(g, W * 0.04, H * 0.01, W * 0.92, H * 0.98, W * 0.25, c, { k: 0.12 });
      maBox(g, W * 0.14, H * 0.05, W * 0.72, H * 0.9, W * 0.12, maTone(c, -0.12), { k: 0.08 });
      for (let i = 0; i < 6; i++)
        maBox(g, W * 0.3, H * (0.1 + i * 0.14), W * 0.4, H * 0.05, 1, "#5a5e64", { lw: 0.5 });
      [0.25, 0.5, 0.75].forEach(y => {
        maBox(g, 0, H * y - H * 0.04, W * 0.05, H * 0.08, 0, "#1d1f22", { ink: false });
        maBox(g, W * 0.95, H * y - H * 0.04, W * 0.05, H * 0.08, 0, "#1d1f22", { ink: false });
      });
    }
  },
  {
    id: "barco",
    nome: "Barco a motor",
    cat: "Transporte",
    w: 2,
    h: 4,
    cores: ["#e8e2d0", "#2a4a6a", "#6e1c22"],
    draw: (g, W, H, R, c) => {
      g.beginPath();
      g.moveTo(W * 0.5, H * 0.02);
      g.quadraticCurveTo(W * 0.98, H * 0.25, W * 0.92, H * 0.96);
      g.lineTo(W * 0.08, H * 0.96);
      g.quadraticCurveTo(W * 0.02, H * 0.25, W * 0.5, H * 0.02);
      g.closePath();
      g.fillStyle = maGrad(g, 0, 0, W, H, c, 0.15);
      g.fill();
      g.lineWidth = maLW();
      g.strokeStyle = MA_INK;
      g.stroke();
      maBox(g, W * 0.22, H * 0.4, W * 0.56, H * 0.25, 3, "#5a3e28");
      maBox(g, W * 0.3, H * 0.3, W * 0.4, H * 0.1, 2, "#9ad0e8", { k: 0.2 });
      maBox(g, W * 0.38, H * 0.95, W * 0.24, H * 0.05, 1, "#1d1f22");
    }
  },
  {
    id: "helicoptero",
    nome: "Helicóptero",
    cat: "Transporte",
    w: 5,
    h: 5,
    cores: ["#2a2e34", "#c8ccd0", "#6e1c22"],
    draw: (g, W, H, R, c) => {
      maBox(g, W * 0.47, H * 0.5, W * 0.06, H * 0.42, 2, maTone(c, -0.1));
      maBox(g, W * 0.38, H * 0.88, W * 0.24, H * 0.04, 2, maTone(c, -0.1));
      [0.33, 0.67].forEach(x => maBox(g, W * x - W * 0.015, H * 0.25, W * 0.03, H * 0.45, 1, "#4a4e54"));
      maEll(g, W * 0.5, H * 0.42, W * 0.13, H * 0.2, c);
      maEll(g, W * 0.5, H * 0.3, W * 0.09, H * 0.08, "#5a8aa0", { k: 0.3 });
      g.strokeStyle = "rgba(30,30,34,.85)";
      g.lineWidth = W * 0.025;
      g.lineCap = "round";
      [0.4, 0.4 + Math.PI / 2].forEach(a => {
        g.beginPath();
        g.moveTo(W * 0.5 - Math.cos(a) * W * 0.47, H * 0.42 - Math.sin(a) * H * 0.47);
        g.lineTo(W * 0.5 + Math.cos(a) * W * 0.47, H * 0.42 + Math.sin(a) * H * 0.47);
        g.stroke();
      });
      maCirc(g, W * 0.5, H * 0.42, W * 0.03, "#888", { ink: false });
    }
  },
  {
    id: "heliponto",
    nome: "Heliponto",
    cat: "Transporte",
    w: 4,
    h: 4,
    z: 0,
    draw: (g, W, H) => {
      maCirc(g, W / 2, H / 2, W * 0.46, "#3a3e44", { k: 0.05 });
      g.strokeStyle = "#e8e2d0";
      g.lineWidth = W * 0.02;
      g.beginPath();
      g.arc(W / 2, H / 2, W * 0.4, 0, Math.PI * 2);
      g.stroke();
      g.lineWidth = W * 0.05;
      g.beginPath();
      g.moveTo(W * 0.36, H * 0.32);
      g.lineTo(W * 0.36, H * 0.68);
      g.moveTo(W * 0.64, H * 0.32);
      g.lineTo(W * 0.64, H * 0.68);
      g.moveTo(W * 0.36, H * 0.5);
      g.lineTo(W * 0.64, H * 0.5);
      g.stroke();
    }
  },
  {
    id: "faixaplat",
    nome: "Faixa amarela de plataforma",
    cat: "Transporte",
    w: 3,
    h: 0.5,
    z: 0,
    draw: (g, W, H) => {
      g.fillStyle = "#c9a227";
      g.fillRect(0, H * 0.25, W, H * 0.5);
      g.fillStyle = "rgba(0,0,0,.25)";
      for (let x = W * 0.02; x < W; x += W * 0.04) g.fillRect(x, H * 0.35, W * 0.015, H * 0.3);
    }
  },
  /* ---------- ESCOLA ---------- */
  {
    id: "lousa",
    nome: "Lousa grande",
    cat: "Escola",
    w: 4,
    h: 0.5,
    draw: (g, W, H, R) => {
      maBox(g, 0, 0, W, H, 1, "#5a3e28");
      maBox(g, W * 0.02, H * 0.15, W * 0.96, H * 0.6, 0, "#2a4a3a", { k: 0.06 });
      g.strokeStyle = "rgba(240,240,230,.55)";
      g.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const x = W * (0.08 + R() * 0.6);
        g.beginPath();
        g.moveTo(x, H * (0.3 + i * 0.1));
        g.lineTo(x + W * (0.1 + R() * 0.15), H * (0.3 + i * 0.1));
        g.stroke();
      }
    }
  },
  {
    id: "carteiras",
    nome: "Fileira de carteiras",
    cat: "Escola",
    w: 3,
    h: 1,
    draw: (g, W, H) => {
      for (let i = 0; i < 4; i++) {
        const x = W * (0.02 + i * 0.25);
        maBox(g, x, H * 0.04, W * 0.21, H * 0.38, 2, "#8a6a44");
        mChair(g, x + W * 0.105, H * 0.72, H * 0.42, "#2f4a6a");
      }
    }
  },
  {
    id: "mesaprof",
    nome: "Mesa do professor",
    cat: "Escola",
    w: 2,
    h: 1,
    draw: (g, W, H, R) => {
      maBox(g, 0, H * 0.05, W, H * 0.62, 2, "#6a4630");
      maBox(g, W * 0.1, H * 0.15, W * 0.25, H * 0.3, 1, "#d8d0c0", { lw: 0.5 });
      maCirc(g, W * 0.75, H * 0.3, H * 0.1, "#c0392b", { lw: 0.5 });
      mChair(g, W * 0.5, H * 0.85, H * 0.32, "#3e2b1f");
    }
  },
  {
    id: "armarioesc",
    nome: "Armários de corredor",
    cat: "Escola",
    w: 3,
    h: 0.5,
    cores: ["#2a6a9a", "#c0392b", "#3f7a4a", "#c9a227"],
    draw: (g, W, H, R, c) => {
      for (let i = 0; i < 6; i++) {
        maBox(g, (W * i) / 6, 0, W / 6, H, 1, c, { k: 0.15 });
        g.fillStyle = "rgba(0,0,0,.35)";
        for (let k = 0; k < 3; k++) g.fillRect((W * i) / 6 + W * 0.03, H * (0.2 + k * 0.12), W * 0.1, 1);
        maCirc(g, (W * i) / 6 + W * 0.14, H * 0.6, H * 0.06, "#ccc", { ink: false });
      }
    }
  },
  {
    id: "bebedouro",
    nome: "Bebedouro",
    cat: "Escola",
    w: 0.5,
    h: 0.5,
    draw: (g, W, H) => {
      maBox(g, W * 0.1, H * 0.1, W * 0.8, H * 0.8, 3, "#c8ccd0");
      maCirc(g, W / 2, H / 2, W * 0.2, "#7ab0c8", { ink: false });
    }
  },
  /* ---------- RURAL ---------- */
  {
    id: "fardo",
    nome: "Fardo de feno (redondo)",
    cat: "Rural",
    w: 1,
    h: 1,
    draw: (g, W, H) => {
      maCirc(g, W / 2, H / 2, W * 0.45, "#c8a24a", { k: 0.2 });
      g.strokeStyle = "rgba(90,60,20,.45)";
      g.lineWidth = 1;
      for (let r = W * 0.1; r < W * 0.44; r += W * 0.07) {
        g.beginPath();
        g.arc(W / 2, H / 2, r, 0.3, Math.PI * 1.8);
        g.stroke();
      }
    }
  },
  {
    id: "fardoq",
    nome: "Fardo de feno (quadrado)",
    cat: "Rural",
    w: 1,
    h: 0.5,
    draw: (g, W, H) => {
      maBox(g, W * 0.03, H * 0.06, W * 0.94, H * 0.88, 2, "#d0ae58", { k: 0.18 });
      maLine(
        g,
        [
          [W * 0.3, H * 0.06],
          [W * 0.3, H * 0.94]
        ],
        "#7a5a2a",
        maLW(0.6)
      );
      maLine(
        g,
        [
          [W * 0.7, H * 0.06],
          [W * 0.7, H * 0.94]
        ],
        "#7a5a2a",
        maLW(0.6)
      );
    }
  },
  {
    id: "trator",
    nome: "Trator",
    cat: "Rural",
    w: 2,
    h: 3,
    cores: ["#c0392b", "#2f7a3a", "#2a4a8e"],
    draw: (g, W, H, R, c) => {
      maBox(g, 0, H * 0.55, W * 0.24, H * 0.4, 4, "#1a1a1a");
      maBox(g, W * 0.76, H * 0.55, W * 0.24, H * 0.4, 4, "#1a1a1a");
      maBox(g, W * 0.08, H * 0.04, W * 0.16, H * 0.22, 3, "#1a1a1a");
      maBox(g, W * 0.76, H * 0.04, W * 0.16, H * 0.22, 3, "#1a1a1a");
      maBox(g, W * 0.28, H * 0.02, W * 0.44, H * 0.5, 4, c, { k: 0.2 });
      maBox(g, W * 0.22, H * 0.5, W * 0.56, H * 0.46, 3, maTone(c, -0.1));
      maBox(g, W * 0.3, H * 0.58, W * 0.4, H * 0.3, 2, "#2a2c30");
      maCirc(g, W * 0.5, H * 0.08, W * 0.05, "#3a3a3a", { ink: false });
    }
  },
  {
    id: "poco",
    nome: "Poço",
    cat: "Rural",
    w: 1,
    h: 1,
    draw: (g, W, H) => {
      maCirc(g, W / 2, H / 2, W * 0.46, "#7a7468");
      maCirc(g, W / 2, H / 2, W * 0.3, "#08090a", { k: 0.02 });
      maLine(
        g,
        [
          [W * 0.08, H * 0.5],
          [W * 0.92, H * 0.5]
        ],
        "#5a3e28",
        maLW(1.6)
      );
      maBox(g, W * 0.44, H * 0.42, W * 0.12, H * 0.16, 1, "#5a3e28");
    }
  },
  {
    id: "plantacao",
    nome: "Plantação",
    cat: "Rural",
    w: 3,
    h: 3,
    z: 0,
    cores: ["#4a7a2a", "#8a8a2a", "#5a3a20"],
    draw: (g, W, H, R, c) => {
      g.fillStyle = "#3a2a1c";
      g.fillRect(0, 0, W, H);
      for (let i = 0; i < 6; i++) {
        const x = W * (0.08 + i * 0.168);
        g.fillStyle = "rgba(0,0,0,.25)";
        g.fillRect(x - W * 0.02, 0, W * 0.04, H);
        for (let y = H * 0.05; y < H; y += H * 0.09)
          maCirc(g, x + (R() - 0.5) * W * 0.02, y, W * (0.035 + R() * 0.02), maTone(c, (R() - 0.5) * 0.2), {
            ink: false
          });
      }
    }
  },
  {
    id: "espantalho",
    nome: "Espantalho",
    cat: "Rural",
    w: 1,
    h: 1,
    draw: (g, W, H) => {
      maLine(
        g,
        [
          [W * 0.1, H * 0.42],
          [W * 0.9, H * 0.42]
        ],
        "#5a3e28",
        maLW(1.4)
      );
      maLine(
        g,
        [
          [W * 0.5, H * 0.1],
          [W * 0.5, H * 0.95]
        ],
        "#5a3e28",
        maLW(1.4)
      );
      maBox(g, W * 0.3, H * 0.34, W * 0.4, H * 0.36, 3, "#6a5a3a");
      maCirc(g, W * 0.5, H * 0.24, W * 0.13, "#c8a86a");
      maEll(g, W * 0.5, H * 0.2, W * 0.22, H * 0.07, "#8a6a2a");
      g.fillStyle = "#111";
      g.fillRect(W * 0.45, H * 0.23, 2, 2);
      g.fillRect(W * 0.53, H * 0.23, 2, 2);
    }
  },
  {
    id: "cocho",
    nome: "Cocho (bebedouro de gado)",
    cat: "Rural",
    w: 2,
    h: 0.5,
    draw: (g, W, H) => {
      maBox(g, 0, 0, W, H, 3, "#5a3e28");
      maBox(g, W * 0.04, H * 0.2, W * 0.92, H * 0.6, 2, "#3a5a5a", { k: 0.2 });
    }
  },
  /* ---------- PORTO E PRAIA ---------- */
  {
    id: "boia",
    nome: "Boia",
    cat: "Porto e praia",
    w: 0.5,
    h: 0.5,
    draw: (g, W, H) => {
      g.lineWidth = W * 0.22;
      for (let i = 0; i < 4; i++) {
        g.strokeStyle = i % 2 ? "#e8e2d0" : "#c0392b";
        g.beginPath();
        g.arc(W / 2, H / 2, W * 0.3, (i * Math.PI) / 2, ((i + 1) * Math.PI) / 2);
        g.stroke();
      }
    }
  },
  {
    id: "rede",
    nome: "Rede de pesca",
    cat: "Porto e praia",
    w: 2,
    h: 2,
    z: 0,
    draw: (g, W, H, R) => {
      g.strokeStyle = "rgba(200,190,160,.55)";
      g.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        g.beginPath();
        g.moveTo(W * 0.05 + (W * 0.9 * i) / 10, H * 0.1 + R() * 4);
        g.lineTo(W * 0.1 + (W * 0.8 * i) / 10, H * 0.9);
        g.stroke();
        g.beginPath();
        g.moveTo(W * 0.08, H * 0.1 + (H * 0.8 * i) / 10);
        g.lineTo(W * 0.92, H * 0.12 + (H * 0.8 * i) / 10);
        g.stroke();
      }
      [0.2, 0.5, 0.8].forEach(x => maCirc(g, W * x, H * 0.1, W * 0.04, "#e07a2a", { ink: false }));
    }
  },
  {
    id: "guardasol",
    nome: "Guarda-sol",
    cat: "Porto e praia",
    w: 2,
    h: 2,
    cores: ["#c0392b", "#2a6a9a", "#e8d24a", "#3f9a4a"],
    draw: (g, W, H, R, c) => {
      for (let i = 0; i < 8; i++) {
        g.beginPath();
        g.moveTo(W / 2, H / 2);
        g.arc(W / 2, H / 2, W * 0.46, (i * Math.PI) / 4, ((i + 1) * Math.PI) / 4);
        g.closePath();
        g.fillStyle = i % 2 ? "#e8e2d0" : c;
        g.fill();
      }
      g.lineWidth = maLW();
      g.strokeStyle = MA_INK;
      g.beginPath();
      g.arc(W / 2, H / 2, W * 0.46, 0, Math.PI * 2);
      g.stroke();
      maCirc(g, W / 2, H / 2, W * 0.03, "#555", { ink: false });
    }
  },
  {
    id: "cadeirapraia",
    nome: "Cadeira de praia",
    cat: "Porto e praia",
    w: 0.5,
    h: 1,
    cores: ["#2a6a9a", "#c0392b", "#e8d24a"],
    draw: (g, W, H, R, c) => {
      maBox(g, W * 0.08, H * 0.04, W * 0.84, H * 0.92, 2, "#c8ccd0");
      for (let y = H * 0.1; y < H * 0.9; y += H * 0.16)
        maBox(g, W * 0.14, y, W * 0.72, H * 0.08, 0, c, { ink: false });
    }
  },
  {
    id: "cabeco",
    nome: "Poste de amarração",
    cat: "Porto e praia",
    w: 0.5,
    h: 0.5,
    draw: (g, W, H) => {
      maCirc(g, W / 2, H / 2, W * 0.38, "#2a2c30", { k: 0.3 });
      g.strokeStyle = "#c8a86a";
      g.lineWidth = maLW(0.8);
      g.beginPath();
      g.arc(W / 2, H / 2, W * 0.44, 0.5, 2.6);
      g.stroke();
    }
  },
  {
    id: "ancora",
    nome: "Âncora",
    cat: "Porto e praia",
    w: 1,
    h: 1,
    draw: (g, W, H) => {
      const c = "#4a4e54";
      maLine(
        g,
        [
          [W * 0.5, H * 0.15],
          [W * 0.5, H * 0.85]
        ],
        c,
        maLW(2)
      );
      maLine(
        g,
        [
          [W * 0.32, H * 0.28],
          [W * 0.68, H * 0.28]
        ],
        c,
        maLW(1.6)
      );
      g.strokeStyle = c;
      g.lineWidth = maLW(2);
      g.beginPath();
      g.arc(W * 0.5, H * 0.55, W * 0.3, 0.3, Math.PI - 0.3);
      g.stroke();
      maCirc(g, W * 0.5, H * 0.12, W * 0.06, c, { ink: false });
    }
  },
  /* ---------- PRÉDIO ---------- */
  {
    id: "escadasobe",
    nome: "Escada (subindo)",
    cat: "Prédio",
    w: 2,
    h: 3,
    z: 0,
    cores: ["#8a8478", "#5a5e64", "#6a4630"],
    draw: (g, W, H, R, c) => {
      maBox(g, 0, 0, W, H, 2, "#2a2c30", { k: 0.05 });
      const n = 9;
      for (let i = 0; i < n; i++)
        maBox(g, W * 0.06, (H * i) / n + 1, W * 0.88, H / n - 2, 1, maTone(c, 0.05 * (n - i) - 0.2), {
          k: 0.08,
          lw: 0.6
        });
      g.fillStyle = "rgba(201,162,39,.8)";
      g.beginPath();
      g.moveTo(W * 0.5, H * 0.22);
      g.lineTo(W * 0.32, H * 0.42);
      g.lineTo(W * 0.68, H * 0.42);
      g.closePath();
      g.fill();
      maLine(
        g,
        [
          [W * 0.04, H * 0.02],
          [W * 0.04, H * 0.98]
        ],
        "#2a2c30",
        maLW(1.2)
      );
      maLine(
        g,
        [
          [W * 0.96, H * 0.02],
          [W * 0.96, H * 0.98]
        ],
        "#2a2c30",
        maLW(1.2)
      );
    }
  },
  {
    id: "elevadorap",
    nome: "Elevador de prédio",
    cat: "Prédio",
    w: 2,
    h: 2,
    draw: (g, W, H) => {
      maBox(g, 0, 0, W, H, 2, "#3a3e44");
      maBox(g, W * 0.08, H * 0.08, W * 0.84, H * 0.8, 1, "#5a5e64", { k: 0.1 });
      maBox(g, W * 0.12, H * 0.86, W * 0.37, H * 0.12, 1, "#a8aeb4");
      maBox(g, W * 0.51, H * 0.86, W * 0.37, H * 0.12, 1, "#a8aeb4");
      maBox(g, W * 0.92, H * 0.55, W * 0.06, H * 0.18, 1, "#22262a");
      maCirc(g, W * 0.95, H * 0.6, W * 0.015, "#e0b030", { ink: false });
    }
  },
  {
    id: "capacho",
    nome: "Capacho",
    cat: "Prédio",
    w: 1,
    h: 0.5,
    z: 0,
    cores: ["#5a3e28", "#3a3e44", "#6e1c22"],
    draw: (g, W, H, R, c) => {
      maBox(g, W * 0.05, H * 0.1, W * 0.9, H * 0.8, 2, c, { k: 0.08, lw: 0.5 });
      g.strokeStyle = "rgba(0,0,0,.25)";
      for (let x = W * 0.1; x < W * 0.9; x += 3) {
        g.beginPath();
        g.moveTo(x, H * 0.15);
        g.lineTo(x, H * 0.85);
        g.stroke();
      }
    }
  },
  {
    id: "correio",
    nome: "Caixas de correio",
    cat: "Prédio",
    w: 2,
    h: 0.5,
    draw: (g, W, H) => {
      for (let i = 0; i < 8; i++) {
        maBox(g, (W * i) / 8, 0, W / 8, H, 1, "#8a7a4a", { k: 0.15, lw: 0.5 });
        g.fillStyle = "rgba(0,0,0,.5)";
        g.fillRect((W * i) / 8 + W * 0.02, H * 0.4, W * 0.08, 1.5);
      }
    }
  },
  {
    id: "extintor",
    nome: "Extintor",
    cat: "Prédio",
    w: 0.5,
    h: 0.5,
    draw: (g, W, H) => {
      maCirc(g, W / 2, H / 2, W * 0.28, "#c0392b", { k: 0.3 });
      maCirc(g, W / 2, H / 2, W * 0.08, "#222", { ink: false });
    }
  },
  /* ---------- HOSPITAL ---------- */
  {
    id: "gavetas",
    nome: "Gavetas do necrotério",
    cat: "Hospital e laboratório",
    w: 3,
    h: 1,
    draw: (g, W, H) => {
      maBox(g, 0, 0, W, H, 1, "#6a7078");
      for (let i = 0; i < 3; i++)
        for (let j = 0; j < 2; j++) {
          maBox(g, W * (0.02 + i * 0.33), H * (0.06 + j * 0.47), W * 0.3, H * 0.42, 1, "#a8aeb4", {
            k: 0.15,
            lw: 0.6
          });
          maBox(g, W * (0.14 + i * 0.33), H * (0.22 + j * 0.47), W * 0.06, H * 0.1, 1, "#3a3e44", {
            ink: false
          });
        }
    }
  },
  {
    id: "autopsia",
    nome: "Mesa de autópsia",
    cat: "Hospital e laboratório",
    w: 1,
    h: 2,
    draw: (g, W, H) => {
      maBox(g, W * 0.06, H * 0.03, W * 0.88, H * 0.94, 3, "#9aa0a6", { k: 0.2 });
      maBox(g, W * 0.14, H * 0.08, W * 0.72, H * 0.84, 2, "#b8bec4", { k: 0.1 });
      maCirc(g, W * 0.5, H * 0.88, W * 0.06, "#2a2c30", { ink: false });
      g.strokeStyle = "rgba(0,0,0,.2)";
      for (let y = H * 0.15; y < H * 0.85; y += H * 0.06) {
        g.beginPath();
        g.moveTo(W * 0.2, y);
        g.lineTo(W * 0.8, y);
        g.stroke();
      }
    }
  },
  {
    id: "esperacad",
    nome: "Cadeiras de espera",
    cat: "Hospital e laboratório",
    w: 3,
    h: 0.5,
    cores: ["#2a4a6a", "#3a3e44", "#6e1c22"],
    draw: (g, W, H, R, c) => {
      maBox(g, 0, H * 0.7, W, H * 0.12, 1, "#5a5e64", { lw: 0.5 });
      for (let i = 0; i < 5; i++)
        maBox(g, W * (0.02 + i * 0.196), H * 0.08, W * 0.17, H * 0.78, 2, c, { k: 0.18 });
    }
  },
  {
    id: "cortina",
    nome: "Cortina hospitalar",
    cat: "Hospital e laboratório",
    w: 2,
    h: 0.5,
    draw: (g, W, H) => {
      g.strokeStyle = "#6a9aa8";
      g.lineWidth = H * 0.35;
      g.lineCap = "round";
      g.beginPath();
      for (let x = 0; x <= W; x += W * 0.05) g.lineTo(x, H * 0.5 + Math.sin(x / (W * 0.05)) * H * 0.18);
      g.stroke();
    }
  },
  {
    id: "monitorcard",
    nome: "Monitor cardíaco",
    cat: "Hospital e laboratório",
    w: 0.5,
    h: 0.5,
    draw: (g, W, H) => {
      maBox(g, W * 0.05, H * 0.15, W * 0.9, H * 0.7, 2, "#2a2e34");
      maLine(
        g,
        [
          [W * 0.12, H * 0.5],
          [W * 0.35, H * 0.5],
          [W * 0.45, H * 0.25],
          [W * 0.55, H * 0.72],
          [W * 0.62, H * 0.5],
          [W * 0.88, H * 0.5]
        ],
        "#3fbf5f",
        maLW(0.6)
      );
    }
  },
  /* ---------- DELEGACIA ---------- */
  {
    id: "balcaodp",
    nome: "Balcão de atendimento",
    cat: "Delegacia",
    w: 3,
    h: 1,
    cores: MC.mad,
    draw: (g, W, H, R, c) => {
      maBox(g, 0, H * 0.1, W, H * 0.8, 3, c, { k: 0.18 });
      maBox(g, W * 0.02, H * 0.14, W * 0.96, H * 0.3, 2, "rgba(170,210,225,.55)", { k: 0.1, lw: 0.6 });
      mPaper(g, W * 0.2, H * 0.62, H * 0.32, R);
      mPaper(g, W * 0.62, H * 0.6, H * 0.3, R);
      maCirc(g, W * 0.85, H * 0.62, H * 0.1, "#c9a227");
      maBox(g, W * 0.38, H * 0.5, W * 0.14, H * 0.3, 2, "#2a2c30");
    }
  },
  {
    id: "beliche",
    nome: "Cama de cela",
    cat: "Delegacia",
    w: 1,
    h: 2,
    draw: (g, W, H) => {
      maBox(g, W * 0.06, H * 0.03, W * 0.88, H * 0.94, 2, "#3a3e44");
      maBox(g, W * 0.12, H * 0.07, W * 0.76, H * 0.86, 2, "#7a7a70", { k: 0.12 });
      maBox(g, W * 0.18, H * 0.1, W * 0.64, H * 0.14, 3, "#a8a69a", { k: 0.1 });
      maLine(
        g,
        [
          [W * 0.14, H * 0.6],
          [W * 0.86, H * 0.62]
        ],
        "rgba(0,0,0,.35)",
        maLW(1)
      );
    }
  },
  {
    id: "evidencias",
    nome: "Estante de evidências",
    cat: "Delegacia",
    w: 2,
    h: 1,
    draw: (g, W, H, R) => {
      maBox(g, 0, H * 0.1, W, H * 0.8, 2, "#4a5058", { k: 0.12 });
      for (let i = 0; i < 6; i++) {
        const x = W * (0.04 + i * 0.16);
        if (R() < 0.5) maBox(g, x, H * 0.2, W * 0.13, H * 0.6, 2, "#9a7a4a", { k: 0.15, lw: 0.6 });
        else maBox(g, x, H * 0.25, W * 0.12, H * 0.5, 4, "rgba(220,225,230,.75)", { k: 0.08, lw: 0.6 });
        maBox(g, x + W * 0.02, H * 0.32, W * 0.06, H * 0.12, 1, "#c03030", { ink: false });
      }
    }
  },
  {
    id: "mesainterr",
    nome: "Mesa de interrogatório",
    cat: "Delegacia",
    w: 2,
    h: 1,
    luz: { r: 2, c: "#ffe2a8" },
    draw: (g, W, H, R) => {
      maBox(g, W * 0.05, H * 0.08, W * 0.9, H * 0.84, 2, "#6a7078", { k: 0.15 });
      mPaper(g, W * 0.3, H * 0.5, H * 0.4, R);
      maCirc(g, W * 0.7, H * 0.45, H * 0.12, "#2a2c30");
      maCirc(g, W * 0.7, H * 0.45, H * 0.05, "#fff3c0", { ink: false });
    }
  },
  /* ---------- MANSÃO E HOTEL ---------- */
  {
    id: "dossel",
    nome: "Cama de dossel",
    cat: "Mansão e hotel",
    w: 2,
    h: 3,
    cores: ["#5e1f2a", "#2f4a3a", "#3f2b5c", "#7a6a52"],
    draw: (g, W, H, R, c) => {
      maBox(g, W * 0.04, H * 0.02, W * 0.92, H * 0.96, W * 0.04, "#2d211a");
      maBox(g, W * 0.1, H * 0.06, W * 0.8, H * 0.88, W * 0.04, "#e4dccb", { k: 0.1 });
      mCushion(g, W * 0.15, H * 0.09, W * 0.32, H * 0.1, "#efe8da");
      mCushion(g, W * 0.53, H * 0.09, W * 0.32, H * 0.1, "#efe8da");
      maBox(g, W * 0.1, H * 0.3, W * 0.8, H * 0.64, W * 0.04, c, { k: 0.22 });
      // cortinas do dossel nas laterais e colunas
      g.fillStyle = maA(maTone(c, -0.15), 0.85);
      g.fillRect(W * 0.02, H * 0.02, W * 0.08, H * 0.96);
      g.fillRect(W * 0.9, H * 0.02, W * 0.08, H * 0.96);
      [
        [0.06, 0.03],
        [0.94, 0.03],
        [0.06, 0.97],
        [0.94, 0.97]
      ].forEach(([a, b]) => maCirc(g, W * a, H * b, W * 0.06, "#4a3424"));
    }
  },
  {
    id: "armadura",
    nome: "Armadura antiga",
    cat: "Mansão e hotel",
    w: 1,
    h: 1,
    draw: (g, W, H) => {
      maCirc(g, W * 0.5, H * 0.5, W * 0.42, "#2d211a");
      maEll(g, W * 0.5, H * 0.55, W * 0.3, H * 0.2, "#8a9098", { k: 0.3 });
      maCirc(g, W * 0.5, H * 0.45, W * 0.15, "#a8aeb6", { k: 0.35 });
      maLine(
        g,
        [
          [W * 0.42, H * 0.45],
          [W * 0.58, H * 0.45]
        ],
        "#1a1c20",
        maLW(1)
      );
      maLine(
        g,
        [
          [W * 0.85, H * 0.1],
          [W * 0.85, H * 0.9]
        ],
        "#6b7078",
        maLW(1.4)
      );
    }
  },
  {
    id: "relogio",
    nome: "Relógio de pêndulo",
    cat: "Mansão e hotel",
    w: 1,
    h: 0.5,
    draw: (g, W, H) => {
      maBox(g, W * 0.15, 0, W * 0.7, H, 2, "#3e2b1f", { k: 0.2 });
      maCirc(g, W * 0.5, H * 0.45, H * 0.3, "#e8dcc0");
      maLine(
        g,
        [
          [W * 0.5, H * 0.45],
          [W * 0.5, H * 0.25]
        ],
        "#1a1a1a",
        maLW(0.6)
      );
      maLine(
        g,
        [
          [W * 0.5, H * 0.45],
          [W * 0.62, H * 0.5]
        ],
        "#1a1a1a",
        maLW(0.6)
      );
    }
  },
  {
    id: "chafariz",
    nome: "Chafariz",
    cat: "Mansão e hotel",
    w: 3,
    h: 3,
    draw: (g, W, H, R) => {
      maCirc(g, W / 2, H / 2, W * 0.47, "#8a8478", { k: 0.2 });
      maCirc(g, W / 2, H / 2, W * 0.4, "#2e4a52", { k: 0.25 });
      g.strokeStyle = "rgba(200,230,235,.3)";
      g.lineWidth = maLW(0.8);
      for (let i = 1; i < 4; i++) {
        g.beginPath();
        g.arc(W / 2, H / 2, W * 0.08 * i + W * 0.05, 0, 7);
        g.stroke();
      }
      maCirc(g, W / 2, H / 2, W * 0.1, "#9a948a", { k: 0.3 });
      maSpeck(g, W * 0.15, H * 0.15, W * 0.7, H * 0.7, R, 6, ["rgba(60,90,40,.6)"], W * 0.01, W * 0.025);
    }
  },
  {
    id: "vending",
    nome: "Máquina de refrigerante",
    cat: "Mansão e hotel",
    w: 1,
    h: 1,
    cores: ["#a01e24", "#1f3f8a", "#2a2c30"],
    luz: { r: 1.6, c: "#cfe8ff" },
    draw: (g, W, H, R, c) => {
      maBox(g, W * 0.06, H * 0.12, W * 0.88, H * 0.76, 3, c, { k: 0.2 });
      maBox(g, W * 0.12, H * 0.2, W * 0.5, H * 0.5, 2, "rgba(200,230,255,.8)", { k: 0.05, lw: 0.6 });
      for (let i = 0; i < 4; i++)
        maBox(g, W * 0.7, H * (0.22 + i * 0.1), W * 0.14, H * 0.06, 1, "#e0e0e0", { ink: false });
    }
  },
  {
    id: "neon",
    nome: "Letreiro neon",
    cat: "Mansão e hotel",
    w: 3,
    h: 1,
    z: 2,
    cores: ["#ff3a8a", "#3ae6ff", "#ff4030"],
    luz: { r: 3, c: "#ff3a8a" },
    draw: (g, W, H, R, c) => {
      maBox(g, 0, H * 0.15, W, H * 0.7, 4, "#15121a", { k: 0.05 });
      g.save();
      g.font = `bold ${Math.round(H * 0.42)}px sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.shadowColor = c;
      g.shadowBlur = H * 0.25;
      g.fillStyle = c;
      g.fillText("MOTEL", W / 2, H / 2 + 1);
      g.restore();
    }
  },
  {
    id: "carrinholimp",
    nome: "Carrinho de camareira",
    cat: "Mansão e hotel",
    w: 1,
    h: 1,
    draw: (g, W, H, R) => {
      maBox(g, W * 0.1, H * 0.2, W * 0.8, H * 0.6, 2, "#5a6068");
      maBox(g, W * 0.14, H * 0.25, W * 0.34, H * 0.5, 2, "#e8e8e0", { k: 0.08, lw: 0.6 });
      maBox(g, W * 0.52, H * 0.25, W * 0.34, H * 0.5, 2, "#2b2b30", { k: 0.1, lw: 0.6 });
      maCirc(g, W * 0.7, H * 0.4, W * 0.06, "#3a7ac8");
    }
  },
  {
    id: "lavadora",
    nome: "Máquina de lavar",
    cat: "Mansão e hotel",
    w: 1,
    h: 1,
    draw: (g, W, H) => {
      maBox(g, W * 0.08, H * 0.08, W * 0.84, H * 0.84, 3, "#e4e4de", { k: 0.12 });
      maCirc(g, W * 0.5, H * 0.55, W * 0.28, "#5a6068");
      maCirc(g, W * 0.5, H * 0.55, W * 0.2, "#9ab4c4", { k: 0.3 });
      maBox(g, W * 0.15, H * 0.13, W * 0.4, H * 0.08, 1, "#3a3e44", { ink: false });
    }
  },
  /* ---------- PARANORMAL (Outro Lado) ---------- */
  {
    id: "monolito",
    nome: "Monólito",
    cat: "Paranormal",
    w: 1,
    h: 1,
    luz: { r: 1.8, c: "#c9a227" },
    draw: (g, W, H) => {
      g.beginPath();
      g.moveTo(W * 0.5, H * 0.05);
      g.lineTo(W * 0.85, H * 0.4);
      g.lineTo(W * 0.68, H * 0.95);
      g.lineTo(W * 0.32, H * 0.95);
      g.lineTo(W * 0.15, H * 0.4);
      g.closePath();
      g.fillStyle = maGrad(g, 0, 0, W, H, "#16151a", 0.3);
      g.fill();
      g.lineWidth = maLW();
      g.strokeStyle = MA_INK;
      g.stroke();
      g.strokeStyle = "rgba(230,180,60,.85)";
      g.lineWidth = maLW(0.8);
      g.beginPath();
      g.arc(W * 0.5, H * 0.52, W * 0.13, 0, 7);
      g.moveTo(W * 0.5, H * 0.32);
      g.lineTo(W * 0.5, H * 0.75);
      g.moveTo(W * 0.36, H * 0.42);
      g.lineTo(W * 0.64, H * 0.62);
      g.stroke();
    }
  },
  {
    id: "olhos",
    nome: "Olhos",
    cat: "Paranormal",
    w: 1,
    h: 1,
    draw: (g, W, H, R) => {
      for (let i = 0; i < 6; i++) {
        const x = W * (0.2 + R() * 0.6),
          y = H * (0.2 + R() * 0.6),
          r = W * (0.06 + R() * 0.07);
        maEll(g, x, y, r * 1.4, r, "#e8e0d0", { k: 0.1 });
        maCirc(g, x + (R() - 0.5) * r * 0.5, y, r * 0.55, maPick(["#7a1018", "#c9a227", "#5a2a8a"], R), {
          ink: false
        });
        maCirc(g, x, y, r * 0.22, "#050505", { ink: false });
      }
    }
  },
  {
    id: "portal",
    nome: "Portal para o Outro Lado",
    cat: "Paranormal",
    w: 2,
    h: 2,
    z: 0,
    luz: { r: 3.5, c: "#a24aff" },
    draw: (g, W, H, R) => {
      const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.48);
      gr.addColorStop(0, "#000");
      gr.addColorStop(0.55, "#1a0830");
      gr.addColorStop(0.85, "rgba(160,70,255,.75)");
      gr.addColorStop(1, "rgba(160,70,255,0)");
      g.fillStyle = gr;
      g.beginPath();
      g.arc(W / 2, H / 2, W * 0.48, 0, 7);
      g.fill();
      g.strokeStyle = "rgba(220,180,255,.5)";
      g.lineWidth = maLW(0.8);
      for (let k = 0; k < 3; k++) {
        g.beginPath();
        for (let a = 0; a < 9; a += 0.2) {
          const r = W * (0.04 + a * 0.042);
          const t = a + k * 2.1;
          g[a ? "lineTo" : "moveTo"](W / 2 + Math.cos(t) * r, H / 2 + Math.sin(t) * r);
        }
        g.stroke();
      }
    }
  },
  {
    id: "raizes",
    nome: "Veias de Sangue",
    cat: "Paranormal",
    w: 2,
    h: 2,
    z: 0,
    draw: (g, W, H, R) => {
      g.lineCap = "round";
      for (let i = 0; i < 7; i++) {
        let x = W / 2,
          y = H / 2,
          a = R() * 6.28;
        g.strokeStyle = maPick(["#6a1520", "#8a1a26", "#4d0d15"], R);
        g.lineWidth = maLW(1.6 - i * 0.12);
        g.beginPath();
        g.moveTo(x, y);
        for (let k = 0; k < 6; k++) {
          a += (R() - 0.5) * 1.2;
          x += Math.cos(a) * W * 0.08;
          y += Math.sin(a) * H * 0.08;
          g.lineTo(x, y);
        }
        g.stroke();
      }
      maCirc(g, W / 2, H / 2, W * 0.09, "#7a1a26", { k: 0.3 });
    }
  }
];
const MA_OBJ = {};
MA_OBJS.forEach(o => {
  o.z = o.z ?? 1;
  MA_OBJ[o.id] = o;
});
const MA_CATS = [
  "Casa",
  "Escritório",
  "Hospital e laboratório",
  "Bar e lazer",
  "Ordem e arsenal",
  "Rua",
  "Natureza",
  "Industrial",
  "Paranormal",
  "Aeroporto e bunker",
  "Biblioteca",
  "Cemitério e igreja",
  "Comércio",
  "Transporte",
  "Escola",
  "Rural",
  "Porto e praia",
  "Prédio",
  "Delegacia",
  "Mansão e hotel",
  "Marcas",
  "Luzes"
];

/* sprite em cache: o objeto desenhado com sombra, no tamanho da célula atual */
const MA_SPR = new Map();
function maSprite(o, v, s, seed) {
  const key = o.id + "|" + v + "|" + s + "|" + (seed % 7);
  let c = MA_SPR.get(key);
  if (c) return c;
  const W = Math.max(2, Math.round(o.w * s)),
    H = Math.max(2, Math.round(o.h * s)),
    pad = Math.round(s * 0.35);
  c = document.createElement("canvas");
  c.width = W + pad * 2;
  c.height = H + pad * 2;
  c.pad = pad;
  if (o.invis || !o.draw) {
    MA_SPR.set(key, c);
    return c;
  }
  const t = document.createElement("canvas");
  t.width = W + pad * 2;
  t.height = H + pad * 2;
  const tg = t.getContext("2d");
  tg.translate(pad, pad);
  MA_S = s;
  try {
    o.draw(tg, W, H, maRng(seed || 1), o.cores ? o.cores[(v || 0) % o.cores.length] : undefined);
  } catch (e) {
    console.error(o.id, e);
  }
  const g = c.getContext("2d");
  if (o.z > 0) {
    g.shadowColor = "rgba(0,0,0,.6)";
    g.shadowBlur = s * 0.18;
    g.shadowOffsetX = s * 0.05;
    g.shadowOffsetY = s * 0.08;
  }
  g.drawImage(t, 0, 0);
  if (MA_SPR.size > 600) MA_SPR.clear();
  MA_SPR.set(key, c);
  return c;
}
function maDrawObjs(g, M, s, zf, { editor = false, sel = null } = {}) {
  const list = (M.objs || [])
    .filter(o => MA_OBJ[o.t] && (zf === undefined || MA_OBJ[o.t].z === zf))
    .sort((a, b) => MA_OBJ[a.t].z - MA_OBJ[b.t].z || (a.n || 0) - (b.n || 0));
  for (const o of list) {
    const T = MA_OBJ[o.t];
    if (T.invis && !editor) continue;
    const e = o.e || 1;
    g.save();
    g.translate(o.x * s, o.y * s);
    g.rotate(((o.r || 0) * Math.PI) / 180);
    g.scale((o.f ? -1 : 1) * e, e);
    if (T.invis) {
      g.beginPath();
      g.arc(0, 0, s * 0.2, 0, 7);
      g.fillStyle = maA(T.luz.c, 0.85);
      g.fill();
      g.lineWidth = 2;
      g.strokeStyle = "#000";
      g.stroke();
      g.beginPath();
      g.arc(0, 0, (T.luz.r * s) / e, 0, 7);
      g.setLineDash([6, 6]);
      g.strokeStyle = maA(T.luz.c, 0.45);
      g.lineWidth = 1.5 / e;
      g.stroke();
      g.setLineDash([]);
    } else {
      const sp = maSprite(T, o.v || 0, s, o.seed || 1);
      g.drawImage(sp, (-T.w * s) / 2 - sp.pad, (-T.h * s) / 2 - sp.pad);
    }
    if (sel && sel.has(o.id)) {
      g.strokeStyle = "#b47dff";
      g.lineWidth = 2.5 / e;
      g.setLineDash([6 / e, 4 / e]);
      g.strokeRect((-T.w * s) / 2 - 3, (-T.h * s) / 2 - 3, T.w * s + 6, T.h * s + 6);
      g.setLineDash([]);
    }
    g.restore();
  }
}

/* textos (nomes de salas) */
function maDrawTexts(g, M, s) {
  for (const t of M.textos || []) {
    g.save();
    g.translate(t.x * s, t.y * s);
    g.rotate(((t.r || 0) * Math.PI) / 180);
    g.font = `${t.b ? "700 " : ""}${Math.round((t.tam || 0.5) * s)}px ${t.fonte === "serif" ? "'IM Fell English SC',serif" : "Inter,system-ui,sans-serif"}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineWidth = Math.max(2, (t.tam || 0.5) * s * 0.16);
    g.strokeStyle = "rgba(0,0,0,.85)";
    g.strokeText(t.t, 0, 0);
    g.fillStyle = t.cor || "#e9e4d8";
    g.fillText(t.t, 0, 0);
    g.restore();
  }
}

/* iluminação: escuridão do ambiente + luzes dos objetos */
const MA_AMB = {
  dia: { nome: "Claro (sem escuridão)", a: 0, c: "#000" },
  sombrio: { nome: "Sombrio (estilo base)", a: 0.5, c: "#05040a" },
  noite: { nome: "Noite", a: 0.68, c: "#050818" },
  escuro: { nome: "Escuridão total", a: 0.92, c: "#000" },
  sangue: { nome: "Névoa vermelha", a: 0.55, c: "#1a0206" }
};
function maDrawLight(g, M, s, { max = 1 } = {}) {
  const A = MA_AMB[M.amb || "sombrio"] || MA_AMB.sombrio;
  const W = M.w * s,
    H = M.h * s;
  const lights = (M.objs || [])
    .filter(o => MA_OBJ[o.t] && MA_OBJ[o.t].luz)
    .map(o => ({
      x: o.x * s,
      y: o.y * s,
      r: MA_OBJ[o.t].luz.r * s * (o.e || 1) * (o.lr || 1),
      c: o.lc || MA_OBJ[o.t].luz.c
    }));
  if (A.a > 0) {
    const d = document.createElement("canvas");
    d.width = W;
    d.height = H;
    const dg = d.getContext("2d");
    dg.fillStyle = maA(A.c, Math.min(max, A.a));
    dg.fillRect(0, 0, W, H);
    dg.globalCompositeOperation = "destination-out";
    for (const L of lights) {
      const gr = dg.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r);
      gr.addColorStop(0, "rgba(0,0,0,1)");
      gr.addColorStop(0.55, "rgba(0,0,0,.75)");
      gr.addColorStop(1, "rgba(0,0,0,0)");
      dg.fillStyle = gr;
      dg.beginPath();
      dg.arc(L.x, L.y, L.r, 0, 7);
      dg.fill();
    }
    g.drawImage(d, 0, 0);
  }
  g.save();
  g.globalCompositeOperation = "lighter";
  for (const L of lights) {
    const gr = g.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r);
    gr.addColorStop(0, maA(L.c, 0.22));
    gr.addColorStop(0.5, maA(L.c, 0.08));
    gr.addColorStop(1, maA(L.c, 0));
    g.fillStyle = gr;
    g.beginPath();
    g.arc(L.x, L.y, L.r, 0, 7);
    g.fill();
  }
  g.restore();
}
function maFinish(g, M, s) {
  const W = M.w * s,
    H = M.h * s; // grão e vinheta para o acabamento sombrio
  const R = maRng(77);
  g.save();
  g.globalAlpha = 0.06;
  for (let i = 0; i < (W * H) / 900; i++) {
    g.fillStyle = R() < 0.5 ? "#fff" : "#000";
    g.fillRect(R() * W, R() * H, 1.5, 1.5);
  }
  g.restore();
  const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,.45)");
  g.fillStyle = v;
  g.fillRect(0, 0, W, H);
}
function maGrid(g, M, s, a = 0.13) {
  g.save();
  g.strokeStyle = `rgba(0,0,0,${a * 1.6})`;
  g.lineWidth = 1;
  g.beginPath();
  for (let x = 0; x <= M.w; x++) {
    g.moveTo(x * s + 0.5, 0);
    g.lineTo(x * s + 0.5, M.h * s);
  }
  for (let y = 0; y <= M.h; y++) {
    g.moveTo(0, y * s + 0.5);
    g.lineTo(M.w * s, y * s + 0.5);
  }
  g.stroke();
  g.strokeStyle = `rgba(255,255,255,${a * 0.5})`;
  g.beginPath();
  for (let x = 0; x <= M.w; x++) {
    g.moveTo(x * s + 1.5, 0);
    g.lineTo(x * s + 1.5, M.h * s);
  }
  for (let y = 0; y <= M.h; y++) {
    g.moveTo(0, y * s + 1.5);
    g.lineTo(M.w * s, y * s + 1.5);
  }
  g.stroke();
  g.restore();
}
/* desenha o mapa completo (para virar cena) */
function maRender(M, s) {
  const c = document.createElement("canvas");
  c.width = M.w * s;
  c.height = M.h * s;
  const g = c.getContext("2d");
  g.fillStyle = "#040405";
  g.fillRect(0, 0, c.width, c.height);
  maDrawFloor(g, M, s);
  maDrawObjs(g, M, s, 0);
  if (M.grade !== false) maGrid(g, M, s);
  maDrawWalls(g, M, s);
  maDrawObjs(g, M, s, 1);
  maDrawObjs(g, M, s, 2);
  maDrawLight(g, M, s);
  maDrawTexts(g, M, s);
  if (M.acab !== false) maFinish(g, M, s);
  return c;
}
