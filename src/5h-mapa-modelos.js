<script>
"use strict";
/* =====================================================================
   CRIADOR DE MAPAS — MAPAS PRONTOS (todos originais)
   ===================================================================== */
function mbNovo(w, h, piso = ".") {
  const M = meNovo(w, h, piso);
  const E = new Map();
  let n = 1;
  const B = {
    M,
    E,
    set(x, y, k) {
      if (x < 0 || y < 0 || x >= M.w || y >= M.h) return;
      const i = y * M.w + x;
      M.chao = M.chao.slice(0, i) + k + M.chao.slice(i + 1);
    },
    fill(x0, y0, x1, y1, k) {
      const a = M.chao.split("");
      for (let y = Math.max(0, y0); y <= Math.min(M.h - 1, y1); y++)
        for (let x = Math.max(0, x0); x <= Math.min(M.w - 1, x1); x++) a[y * M.w + x] = k;
      M.chao = a.join("");
    },
    edge(k, v) {
      const c = E.get(k);
      if (c && c.startsWith("a:")) return;
      E.set(k, v);
    },
    room(x0, y0, x1, y1, k, st = "ordem") {
      B.fill(x0, y0, x1, y1, k);
      for (let x = x0; x <= x1; x++) {
        B.edge(`h,${x},${y0}`, st);
        B.edge(`h,${x},${y1 + 1}`, st);
      }
      for (let y = y0; y <= y1; y++) {
        B.edge(`v,${x0},${y}`, st);
        B.edge(`v,${x1 + 1},${y}`, st);
      }
    },
    wall(o, x, y, len, st = "ordem") {
      for (let i = 0; i < len; i++) B.edge(o === "h" ? `h,${x + i},${y}` : `v,${x},${y + i}`, st);
    },
    door(o, x, y, t = "porta") {
      const k = `${o},${x},${y}`;
      const c = E.get(k);
      const st = c ? (c.startsWith("a:") ? c.split(":")[2] : c) : "ordem";
      E.set(k, `a:${t}:${st}`);
    },
    open(o, x, y) {
      E.delete(`${o},${x},${y}`);
    },
    obj(t, x, y, o = {}) {
      M.objs.push({
        id: "o" + n++,
        t,
        x,
        y,
        r: o.r || 0,
        v: o.v || 0,
        e: o.e || 1,
        seed: o.seed || n * 7 + 3,
        n: n,
        ...(o.lr ? { lr: o.lr } : {}),
        ...(o.f ? { f: true } : {})
      });
    },
    txt(t, x, y, o = {}) {
      M.textos.push({ id: "t" + n++, t, x, y, tam: o.tam || 0.42, cor: o.cor || "#d8d2c4", fonte: "serif" });
    },
    done() {
      M.paredes = [...E].map(([k, v]) => k + "," + v);
      M.nx = n + 1;
      return M;
    }
  };
  return B;
}

function mbBase() {
  const B = mbNovo(38, 30);
  // salas de cima
  B.room(1, 1, 9, 7, "a");
  B.room(10, 1, 19, 7, "u");
  B.room(20, 1, 27, 7, "q");
  B.room(28, 1, 36, 7, "n");
  // corredor
  B.room(1, 8, 36, 9, "g");
  // meio
  B.room(1, 10, 8, 14, "h");
  B.room(1, 15, 8, 28, "g");
  B.room(9, 10, 27, 19, "c");
  B.room(28, 10, 36, 19, "M");
  // baixo
  B.room(9, 20, 20, 28, "B");
  B.room(21, 20, 27, 28, "k");
  B.room(28, 20, 36, 28, "A");
  // portas
  B.door("h", 5, 8);
  B.door("h", 14, 8, "portad");
  B.door("h", 15, 8, "portad");
  B.door("h", 23, 8);
  B.door("h", 32, 8, "portaf");
  B.door("h", 4, 10);
  B.door("h", 4, 15);
  B.door("h", 18, 10, "portad");
  B.door("h", 19, 10, "portad");
  B.door("h", 32, 10);
  B.door("v", 9, 22);
  B.door("h", 15, 20);
  B.door("h", 24, 20, "portam");
  B.door("h", 32, 20, "portao");
  B.door("h", 33, 20, "portao");
  B.door("v", 28, 15, "portad");
  // banheiro: divisórias
  B.wall("v", 3, 10, 1);
  B.wall("v", 5, 10, 1);
  B.wall("v", 7, 10, 1);
  // LABORATÓRIO
  B.obj("bancadal", 2.5, 1.5);
  B.obj("bancadal", 6.5, 1.5);
  B.obj("giratoria", 3, 2.6);
  B.obj("giratoria", 7, 2.6);
  B.obj("tanque", 8.5, 4.5);
  B.obj("tanque", 8.5, 6.5);
  B.obj("servidor", 2, 7.25, { r: 180 });
  B.obj("carrinho", 4.5, 5);
  B.obj("papeis", 5.5, 6);
  B.obj("luzbranca", 5, 4.3, { lr: 1.2 });
  // SALA DE REUNIÃO (roxa)
  B.obj("sofaroxo", 15, 3.5);
  B.obj("monitor", 15, 6.5, { r: 180 });
  B.obj("luzroxa", 15, 4, { lr: 1.3 });
  B.obj("planta", 10.6, 1.6);
  B.obj("planta", 19.4, 1.6);
  B.obj("quadrop", 11, 7.75, { r: 180 });
  // ESCRITÓRIO
  B.obj("tapete", 24, 4.5, { v: 0 });
  B.obj("escrivaninha", 24, 3, { v: 0 });
  B.obj("estante", 21, 1.25);
  B.obj("estante", 26.5, 1.25);
  B.obj("poltrona", 22, 5.5, { v: 0, r: 45 });
  B.obj("poltrona", 26, 5.5, { v: 0, r: -45 });
  B.obj("centro", 24, 5.7);
  B.obj("planta", 27.5, 7.4);
  B.obj("arquivo", 20.4, 7.5);
  B.obj("luzteto", 24, 4, { lr: 1.1 });
  // SALA DE RITUAL
  B.obj("circ_sangue", 32.5, 4.5);
  B.obj("altar", 32.5, 1.5);
  B.obj("velas", 29.5, 2.5);
  B.obj("velas", 35.5, 2.5);
  B.obj("velas", 35.5, 6.5);
  B.obj("sangue", 29.6, 6.3);
  B.obj("sigilo", 35.5, 4.5);
  B.obj("estante", 29.5, 1.25, { v: 3 });
  B.obj("livro", 32.5, 3.1);
  B.obj("luzverm", 32.5, 4.5, { lr: 0.9 });
  // CORREDOR
  B.obj("lockers", 3, 8.25);
  B.obj("luzteto", 7, 9, { lr: 0.7 });
  B.obj("luzteto", 18, 9, { lr: 0.7 });
  B.obj("luzteto", 30, 9, { lr: 0.7 });
  B.obj("planta", 36.5, 8.5);
  B.obj("sujeira", 24, 9);
  // BANHEIROS
  [2, 4, 6].forEach(x => B.obj("vaso", x + 0.5, 10.35));
  B.obj("pia", 2.5, 14.75, { r: 180 });
  B.obj("pia", 4.5, 14.75, { r: 180 });
  B.obj("chuveiro", 7.5, 13.5);
  B.obj("chuveiro", 7.5, 12.5);
  B.obj("luzbranca", 4.5, 12.5, { lr: 0.7 });
  // DORMITÓRIOS
  [16, 18.5, 21, 23.5, 26].forEach((y, i) => {
    B.obj("camah", 1.5, y + 0.5, { v: i % 3 });
    B.obj("camah", 7.5, y + 0.5, { v: (i + 1) % 3 });
  });
  B.obj("comoda", 1.5, 28.75, { r: 180 });
  B.obj("caixas", 4.5, 27.5);
  B.obj("tapeteb", 4.5, 15.25);
  B.obj("luzteto", 4.5, 18.5, { lr: 0.8 });
  B.obj("luzteto", 4.5, 25, { lr: 0.8 });
  // REFEITÓRIO / QG
  B.obj("bancada", 10.5, 10.5, { v: 0 });
  B.obj("geladeira", 12.5, 10.5);
  B.obj("fogao", 13.5, 10.5, { v: 1 });
  [13.5, 18.5, 23.5].forEach(x => B.obj("mesaj", x, 14, { v: 3 }));
  B.obj("mesar", 25, 18, { v: 0 });
  B.obj("sofa", 13.5, 18.5, { v: 2 });
  B.obj("poltrona", 10.5, 17, { v: 2, r: 90 });
  B.obj("centro", 13.5, 17.2, { v: 3 });
  B.obj("quadrop", 20, 19.75, { r: 180 });
  B.obj("tv", 18, 10.25, { v: 3 });
  B.obj("luzteto", 13.5, 14, { lr: 0.9 });
  B.obj("luzteto", 18.5, 14, { lr: 0.9 });
  B.obj("luzteto", 23.5, 14, { lr: 0.9 });
  B.obj("luzteto", 13, 17.5, { lr: 0.8 });
  B.obj("luzteto", 25, 17.5, { lr: 0.8 });
  B.obj("sujeira", 20, 17);
  // BAR
  B.obj("balcaobar", 32, 10.5);
  [30.5, 31.5, 32.5, 33.5].forEach(x => B.obj("banqueta", x, 11.4, { v: 0 }));
  B.obj("sinuca", 34, 15.5);
  B.obj("mesabar", 29.5, 13.5, { v: 0 });
  B.obj("mesabar", 30.5, 16, { v: 0 });
  B.obj("mesabar", 29.5, 18.5, { v: 0 });
  B.obj("jukebox", 35.5, 19.75, { r: 180 });
  B.obj("fliperama", 32, 19.75, { r: 180 });
  B.obj("luzteto", 30.5, 15, { lr: 0.8 });
  B.obj("sujeira", 31, 17);
  B.obj("lixo", 33, 18.5);
  // ENFERMARIA
  [10.5, 12.5, 14.5].forEach((x, i) => {
    B.obj("leito", x, 21, { v: 0 });
    B.obj("leito", x, 27, { v: 0, r: 180 });
  });
  B.obj("soro", 11.5, 22.4);
  B.obj("soro", 13.5, 25.6);
  B.obj("bancadal", 18.5, 20.5);
  B.obj("carrinho", 17, 23);
  B.obj("maca", 19.5, 26.5);
  B.obj("rodas", 16.5, 27.5);
  B.obj("luzbranca", 12.5, 24, { lr: 1 });
  B.obj("luzbranca", 18, 24, { lr: 0.8 });
  // ARSENAL
  B.obj("armas", 22.5, 20.25);
  B.obj("armas", 26, 20.25);
  B.obj("bancadaa", 24, 24.5);
  B.obj("municao", 22, 27.75);
  B.obj("municao", 23.5, 27.75);
  B.obj("lockers", 25.5, 28.75, { r: 180 });
  B.obj("cofre", 27.5, 25);
  B.obj("luzteto", 24, 24, { lr: 0.8 });
  // GARAGEM
  B.obj("van", 30.5, 24.5, { v: 0 });
  B.obj("viatura", 34, 24.5, { v: 1 });
  B.obj("caixotes", 35.5, 27.5);
  B.obj("barril", 29, 27.9, { v: 0 });
  B.obj("toxico", 29.6, 28.3);
  B.obj("mancha_oleo", 31.5, 26.5);
  B.obj("luzbranca", 32.5, 24, { lr: 0.9 });
  // nomes
  B.txt("Laboratório", 5, 6.6);
  B.txt("Sala de reunião", 15, 1.1 + 0.35);
  B.txt("Escritório", 24, 6.6);
  B.txt("Sala de ritual", 32.5, 7.3);
  B.txt("Banheiros", 4.5, 13.3);
  B.txt("Dormitórios", 4.5, 21.8);
  B.txt("Refeitório", 18.5, 11.3);
  B.txt("Bar", 33, 13);
  B.txt("Enfermaria", 15, 24);
  B.txt("Arsenal", 24, 22.5);
  B.txt("Garagem", 32.5, 21.3);
  const M = B.done();
  M.amb = "sombrio";
  return M;
}

function mbCasa() {
  const B = mbNovo(24, 18, "G");
  const R = maRng(41);
  B.fill(0, 15, 23, 17, "T");
  B.fill(10, 14, 12, 17, "L");
  B.room(2, 2, 11, 8, "P", "tijolo");
  B.room(12, 2, 20, 8, "x", "tijolo");
  B.room(2, 9, 9, 13, "M", "tijolo");
  B.room(10, 9, 13, 13, "h", "tijolo");
  B.room(14, 9, 20, 13, "P", "tijolo");
  B.door("h", 11, 14, "portaq");
  B.door("v", 12, 5);
  B.door("h", 5, 9);
  B.door("h", 11, 9);
  B.door("v", 14, 11);
  B.door("h", 16, 9);
  B.door("h", 5, 2, "janelaq");
  B.door("h", 8, 2, "janela");
  B.door("h", 16, 2, "janelaq");
  B.door("v", 2, 11, "janelaq");
  B.door("v", 21, 5, "janela");
  B.door("v", 21, 11, "janelaq");
  B.obj("sofa", 6.5, 7.5, { v: 4, r: 180 });
  B.obj("poltrona", 3.5, 4.5, { v: 0, r: 90 });
  B.obj("centro", 6.5, 5.5, { v: 3 });
  B.obj("tv", 6.5, 2.25, { v: 3 });
  B.obj("tapete", 6.5, 5.5, { v: 2 });
  B.obj("estante", 10.5, 2.25, { v: 1 });
  B.obj("lampada", 6.5, 5, { lr: 0.9 });
  B.obj("bancada", 14.5, 2.5, { v: 1 });
  B.obj("geladeira", 19.5, 2.5, { v: 0 });
  B.obj("fogao", 17.5, 2.5, { v: 0 });
  B.obj("mesa", 16.5, 6, { v: 1 });
  B.obj("cadeira", 15.6, 6.9);
  B.obj("cadeira", 17.4, 5.1, { r: 180 });
  B.obj("sangue", 18.5, 6.5);
  B.obj("respingos", 19.5, 5.5);
  B.obj("camac", 4, 11, { v: 0 });
  B.obj("guarda", 8, 12.75, { v: 3, r: 180 });
  B.obj("criado", 2.5, 9.5, { v: 3 });
  B.obj("corpo", 6.5, 11.5, { r: 90 });
  B.obj("banheira", 12, 9.75, { v: 0 });
  B.obj("vaso", 10.5, 12.5);
  B.obj("pia", 12.5, 13.75, { r: 180 });
  B.obj("espelho", 12.6, 12.9, { r: 180 });
  B.obj("caixas", 18.5, 11);
  B.obj("escombros", 16.5, 12);
  for (let i = 0; i < 6; i++)
    B.obj("teia", [2.5, 11.5, 12.5, 20.5, 2.5, 20.5][i], [2.5, 2.5, 2.5, 2.5, 9.5, 9.5][i], {
      r: [0, 90, 0, 90, 0, 90][i]
    });
  for (let i = 0; i < 5; i++) B.obj("sujeira", 3 + R() * 16, 3 + R() * 9);
  B.obj("pegadas", 11, 15.5);
  B.obj("garras", 15, 11);
  B.obj("folhas", 11, 14.5);
  [
    [0.8, 0.8],
    [22.5, 1.5],
    [1, 16],
    [22, 16],
    [17, 16.5]
  ].forEach(([x, y]) => B.obj(R() < 0.5 ? "morta" : "arvore", x, y, { v: 1 }));
  B.obj("arbusto", 8, 15.5, { v: 2 });
  B.obj("arbusto", 15, 15.5, { v: 2 });
  B.txt("Sala", 4, 3.4);
  B.txt("Cozinha", 14.5, 4.5);
  B.txt("Quarto", 3.5, 13.3);
  const M = B.done();
  M.objs = M.objs.filter(o => MA_OBJ[o.t]);
  M.amb = "noite";
  return M;
}

function mbRua() {
  const B = mbNovo(30, 20, "A");
  const R = maRng(5);
  B.fill(0, 0, 29, 4, ".");
  B.fill(0, 5, 29, 6, "s");
  B.fill(0, 13, 29, 14, "s");
  B.fill(0, 15, 29, 19, "G");
  B.room(1, 0, 8, 4, "c", "tijolo");
  B.room(10, 0, 17, 4, "y", "concreto");
  B.room(19, 0, 28, 4, "P", "tijolo");
  B.door("h", 4, 5);
  B.door("h", 13, 5, "portam");
  B.door("h", 14, 5, "portam");
  B.door("h", 23, 5, "portaq");
  B.door("h", 6, 5, "janela");
  B.door("h", 2, 5, "janela");
  B.door("h", 16, 5, "janela");
  B.door("h", 21, 5, "janelaq");
  B.door("h", 26, 5, "janela");
  for (let x = 0; x < 30; x++) {
    B.edge(`h,${x},15`, "cercaa");
  }
  B.door("h", 14, 15, "portao");
  B.door("h", 15, 15, "portao");
  for (let x = 1; x < 30; x += 4) B.obj("listra", x + 1, 10);
  B.obj("faixa", 14, 8.5, { r: 90 });
  B.obj("faixa", 14, 11.5, { r: 90 });
  B.obj("carro", 4.5, 8.5, { v: 0, r: 90 });
  B.obj("carro", 22.5, 11.5, { v: 2, r: 270 });
  B.obj("viatura", 9, 11.5, { v: 0, r: 270 });
  B.obj("van", 25, 8.5, { v: 3, r: 90 });
  [3, 11, 19, 27].forEach(x => B.obj("poste", x, 6.6));
  [7, 23].forEach(x => B.obj("poste", x, 13.4));
  B.obj("lixeira", 9.5, 5.5, { v: 0 });
  B.obj("hidrante", 17.5, 6.6);
  B.obj("bueiro", 12, 12.6);
  B.obj("orelhao", 21, 5.6);
  B.obj("barreira", 9, 9.3);
  B.obj("cone", 7.5, 9.6);
  B.obj("cone", 10.5, 9.6);
  B.obj("cacamba", 27.5, 14, { v: 0 });
  B.obj("ponto", 5.5, 14.2);
  B.obj("sangue", 10.5, 13.7);
  B.obj("lixo", 18, 13.8);
  B.obj("poca", 15, 9.5);
  for (let i = 0; i < 7; i++)
    B.obj(R() < 0.3 ? "pinheiro" : "arvore", 2 + R() * 26, 16.5 + R() * 2.5, { v: Math.floor(R() * 3) });
  B.obj("banco", 10, 17, {});
  B.obj("banco", 20, 17, {});
  B.obj("arbusto", 14, 18.5, { v: 0 });
  B.obj("flores", 6, 18);
  B.obj("caixas", 4, 2);
  B.obj("estante", 14, 1.25, { v: 3 });
  B.obj("escrivaninha", 13.5, 3, { v: 1 });
  B.obj("balcaobar", 24, 1.5);
  B.obj("mesabar", 21, 3.5);
  B.obj("luzteto", 24, 2.5, { lr: 0.8 });
  B.obj("luzteto", 14, 2.5, { lr: 0.7 });
  B.txt("Bar do Zé", 24, 4.3, { tam: 0.38 });
  B.txt("Escritório de advocacia", 13.9, 4.3, { tam: 0.3 });
  const M = B.done();
  M.amb = "noite";
  return M;
}

function mbFloresta() {
  const B = mbNovo(30, 22, "F");
  const R = maRng(17);
  for (let i = 0; i < 14; i++) {
    const x = Math.floor(R() * 30),
      y = Math.floor(R() * 22),
      r = 1.5 + R() * 2.5,
      k = R() < 0.7 ? "G" : "H";
    for (let yy = Math.floor(y - r); yy <= y + r; yy++)
      for (let xx = Math.floor(x - r); xx <= x + r; xx++)
        if (Math.hypot(xx - x, yy - y) <= r) B.set(xx, yy, k);
  }
  const trilha = [];
  for (let x = 0; x < 30; x++) {
    const y = Math.round(11 + Math.sin(x / 4) * 3);
    trilha.push([x, y]);
    B.fill(x, y, x, y + 1, "T");
  }
  B.fill(12, 8, 18, 14, "T");
  B.fill(13, 9, 17, 13, "H");
  B.fill(24, 2, 28, 5, "Q");
  B.fill(25, 3, 27, 4, "W");
  const livre = (x, y) =>
    !(x > 10 && x < 20 && y > 6 && y < 16) &&
    !trilha.some(([a, b]) => Math.abs(a - x) < 2 && Math.abs(b - y) < 3) &&
    !(x > 22 && y < 7);
  let n = 0;
  for (let i = 0; i < 400 && n < 34; i++) {
    const x = 1 + R() * 28,
      y = 1 + R() * 20;
    if (!livre(x, y)) continue;
    n++;
    const t = R();
    B.obj(t < 0.15 ? "morta" : t < 0.45 ? "pinheiro" : t < 0.6 ? "arvoreg" : "arvore", x, y, {
      v: Math.floor(R() * 3)
    });
  }
  for (let i = 0; i < 14; i++) {
    const x = 1 + R() * 28,
      y = 1 + R() * 20;
    if (livre(x, y))
      B.obj(R() < 0.5 ? "arbusto" : R() < 0.5 ? "pedra" : "juncos", x, y, { v: Math.floor(R() * 3) });
  }
  B.obj("fogueira", 15, 11);
  B.obj("barraca", 13, 9);
  B.obj("barraca", 17.5, 9.5, { v: 2, r: 20 });
  B.obj("tronco", 15, 13.3);
  B.obj("toco", 12.6, 12);
  B.obj("caixas", 17.5, 12.5);
  B.obj("lanterna", 13, 13, { r: 30 });
  B.obj("canoa", 23, 4, { r: 60 });
  B.obj("juncos", 24, 6);
  B.obj("pegadas", 6, 12, { r: 90 });
  B.obj("sangue", 22, 15);
  B.obj("garras", 21.2, 15);
  B.obj("ossos", 3, 4);
  B.obj("cogumelos", 8, 18);
  B.obj("folhas", 9, 10);
  const M = B.done();
  M.amb = "noite";
  return M;
}

function mbGalpao() {
  const B = mbNovo(30, 20);
  const R = maRng(9);
  B.room(1, 1, 28, 18, "C", "metal");
  B.room(22, 1, 28, 6, "y", "concreto");
  B.room(1, 14, 6, 18, "c", "concreto");
  B.door("v", 22, 4, "portam");
  B.door("h", 4, 14, "porta");
  B.door("v", 1, 9, "portam");
  B.door("h", 12, 19, "portao");
  B.door("h", 13, 19, "portao");
  B.door("h", 14, 19, "portao");
  B.door("h", 15, 19, "portao");
  B.obj("conteiner", 4, 5.5, { v: 0 });
  B.obj("conteiner", 7.5, 5.5, { v: 1 });
  B.obj("conteiner", 18, 9, { v: 2, r: 90 });
  B.obj("caixotes", 11, 3);
  B.obj("caixotes", 13, 3);
  B.obj("caixote", 15, 2.5, { v: 1 });
  B.obj("pallet", 15, 4);
  B.obj("pallet", 10.5, 13);
  B.obj("caixote", 10.5, 13, { v: 0 });
  B.obj("prateleira", 12.5, 17.5);
  B.obj("prateleira", 17.5, 17.5);
  B.obj("gerador", 9, 10);
  B.obj("maquina", 20, 14);
  B.obj("canos", 5.5, 11.8);
  B.obj("barril", 14, 8, { v: 0 });
  B.obj("barril", 14.6, 8.5, { v: 1 });
  B.obj("toxico", 15, 7.8);
  B.obj("mancha_oleo", 12, 10);
  B.obj("escombros", 16, 13);
  B.obj("escrivaninha", 25, 2.5, { v: 3 });
  B.obj("arquivo", 27.5, 1.5);
  B.obj("arquivo", 27.5, 2.1);
  B.obj("quadrop", 25, 6.75, { r: 180 });
  B.obj("papeis", 24, 4.5);
  B.obj("luzteto", 25, 3.5, { lr: 0.7 });
  B.obj("lockers", 3.5, 14.25);
  B.obj("pia", 5.5, 18.75, { r: 180 });
  B.obj("vaso", 1.6, 17.6);
  B.obj("luzbranca", 3.5, 16, { lr: 0.6 });
  B.obj("lampada", 9, 6, { lr: 1.1 });
  B.obj("lampada", 14, 12, { lr: 1.1 });
  B.obj("lampada", 20, 6, { lr: 1 });
  B.obj("corpo", 19, 4, { r: 30 });
  B.obj("sangue", 19.5, 5);
  B.obj("rastro", 21, 5.5, { r: 20 });
  B.obj("teia", 1.5, 1.5);
  B.obj("teia", 21.5, 1.5, { r: 90 });
  for (let i = 0; i < 6; i++) B.obj("sujeira", 3 + R() * 22, 3 + R() * 13);
  B.txt("Escritório", 25, 5.6, { tam: 0.36 });
  const M = B.done();
  M.amb = "sombrio";
  return M;
}

function mbEsgoto() {
  const B = mbNovo(30, 18);
  const R = maRng(23);
  B.room(1, 5, 28, 12, "C", "concreto");
  B.fill(1, 7, 28, 10, "E");
  B.room(12, 1, 15, 4, "C", "concreto");
  B.room(20, 13, 23, 16, "C", "concreto");
  B.open("h", 13, 5);
  B.open("h", 14, 5);
  B.open("h", 21, 13);
  B.open("h", 22, 13);
  B.fill(13, 1, 14, 4, "g");
  B.fill(21, 13, 22, 16, "g");
  B.fill(6, 7, 7, 10, "t");
  B.fill(18, 7, 19, 10, "t");
  B.door("v", 1, 6, "portao");
  B.door("v", 29, 11, "portao");
  B.obj("canos", 5, 5.4);
  B.obj("canos", 24, 12.6, { r: 180 });
  B.obj("bueiro", 13.5, 1.5);
  B.obj("bueiro", 21.5, 16.4);
  B.obj("lanterna", 9, 6, { r: 20 });
  B.obj("lanterna", 22, 11.5, { r: 200 });
  B.obj("poca", 4, 11.3);
  B.obj("lixo", 11, 11.5);
  B.obj("lixo", 25, 6);
  B.obj("ossos", 16, 6);
  B.obj("casulo", 27, 6.2);
  B.obj("casulo", 26.4, 11.4);
  B.obj("tentaculos", 27.5, 8.5);
  B.obj("sangue", 16, 11.5);
  B.obj("corpo", 17, 6.2, { r: 90 });
  for (let i = 0; i < 6; i++) B.obj("sujeira", 2 + R() * 25, 5 + R() * 7);
  B.obj("teia", 1.5, 5.5);
  B.obj("teia", 28.5, 5.5, { r: 90 });
  B.obj("luzverde", 27, 8.5, { lr: 0.8 });
  B.obj("lampada", 5, 6, { lr: 0.9 });
  B.obj("lampada", 14, 11.4, { lr: 0.9 });
  B.obj("lampada", 13.5, 3, { lr: 0.7 });
  B.obj("lampada", 21.5, 15, { lr: 0.7 });
  const M = B.done();
  M.amb = "noite";
  return M;
}

function mbClareira() {
  const B = mbNovo(22, 22, "F");
  const R = maRng(3);
  for (let y = 0; y < 22; y++)
    for (let x = 0; x < 22; x++) {
      const d = Math.hypot(x - 10.5, y - 10.5);
      if (d < 6.5) B.set(x, y, d < 4 ? "I" : "H");
    }
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * 6.283 + R() * 0.2,
      d = 8 + R() * 2.5;
    B.obj(R() < 0.55 ? "morta" : "pinheiro", 10.5 + Math.cos(a) * d + 0.5, 10.5 + Math.sin(a) * d + 0.5, {
      v: 1
    });
  }
  B.obj("circ_sangue", 11, 11, { e: 1.4 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 6.283;
    B.obj("velas", 11 + Math.cos(a) * 3.3, 11 + Math.sin(a) * 3.3);
  }
  B.obj("corpo", 11, 11);
  B.obj("sigilo", 7, 15);
  B.obj("sigilo", 15, 7, { r: 90 });
  B.obj("respingos", 12.5, 12);
  B.obj("ossos", 15.5, 14.5);
  B.obj("pegadas", 4, 11, { r: 90 });
  B.obj("pedra", 5.5, 6, { v: 0 });
  B.obj("fenda", 16, 15.5, { e: 0.8 });
  const M = B.done();
  M.amb = "sangue";
  return M;
}

const MA_MODELOS = [
  { nome: "Em branco", desc: "Comece do zero, no tamanho que quiser.", vazio: true },
  {
    nome: "Base de Operações",
    desc: "Laboratório, sala de reunião, escritório, sala de ritual, refeitório, bar, enfermaria, arsenal e garagem.",
    fn: mbBase
  },
  { nome: "Casa abandonada", desc: "Casa de madeira com janelas quebradas, à noite.", fn: mbCasa },
  { nome: "Rua à noite", desc: "Rua com prédios, carros, viatura e uma praça.", fn: mbRua },
  { nome: "Floresta", desc: "Mata fechada com trilha, acampamento e lago.", fn: mbFloresta },
  { nome: "Galpão", desc: "Galpão industrial com contêineres e um escritório.", fn: mbGalpao },
  { nome: "Esgoto", desc: "Túnel com canal de água, pontes de grade e algo vivendo lá.", fn: mbEsgoto },
  { nome: "Clareira do ritual", desc: "Clareira queimada com um círculo de Sangue no meio.", fn: mbClareira }
];
</script>
