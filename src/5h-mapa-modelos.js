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

/* Base de Operações: biblioteca na superfície e, atrás do acervo raro, uma escada secreta até a base */
function mbBase() {
  const B = mbNovo(48, 41);
  // ---------- SUPERFÍCIE: rua e biblioteca ----------
  B.fill(0, 0, 47, 1, "A");
  B.fill(0, 2, 47, 2, "s");
  B.room(1, 3, 33, 14, "m", "tijolo");
  B.room(34, 3, 46, 8, "r", "tijolo");
  B.room(34, 9, 39, 14, "P", "tijolo");
  B.room(40, 9, 46, 14, "C", "pedra");
  B.door("h", 16, 3, "portad");
  B.door("h", 17, 3, "portad");
  B.door("v", 34, 6);
  B.door("v", 34, 12);
  B.door("h", 43, 9, "secreta");
  // rua
  B.obj("poste", 5, 2.4);
  B.obj("poste", 29, 2.4);
  B.obj("banco", 24, 2.7);
  B.obj("lixeira", 12, 2.5);
  B.obj("carro", 40, 0.9, { r: 90, v: 1 });
  B.obj("carro", 8, 0.9, { r: 90, v: 3 });
  // salão de leitura: estantes
  [6.5, 9, 11.5].forEach(y => [3.5, 7, 10.5, 14].forEach(x => B.obj("estantebib", x, y)));
  [5.5, 8.5, 11.5].forEach(y => B.obj("estante", 1.25, y, { r: 90 }));
  [3.5, 6, 8.5, 11].forEach(x => B.obj("estante", x, 3.25));
  [4, 6.5, 9, 11.5, 14].forEach(x => B.obj("estante", x, 14.75, { r: 180 }));
  // balcão de atendimento
  B.obj("bancada", 21, 4.6, { v: 0 });
  B.obj("giratoria", 21, 3.75);
  B.obj("papeis", 22.4, 4.5);
  // mesas de leitura
  [22, 27].forEach(x =>
    [8, 11.5].forEach(y => {
      B.obj("mesa", x, y, { v: 0 });
      [-0.5, 0.5].forEach(d => {
        B.obj("cadeira", x + d, y - 0.8);
        B.obj("cadeira", x + d, y + 0.8);
      });
      B.obj("lampada", x, y, { lr: 0.45 });
    })
  );
  // canto da lareira
  B.obj("tapete", 30.5, 6, { v: 1 });
  B.obj("lareira", 30.5, 3.5);
  B.obj("poltrona", 29.3, 6.2, { v: 0, r: 160 });
  B.obj("poltrona", 31.7, 6.2, { v: 0, r: -160 });
  B.obj("globo", 32.5, 9.5);
  B.obj("planta", 33.4, 14.4);
  B.obj("planta", 18.6, 14.4);
  B.obj("lustre", 9, 9);
  B.obj("lustre", 24.5, 9.8);
  B.obj("luzteto", 9, 9, { lr: 1.3 });
  B.obj("luzteto", 24.5, 9.8, { lr: 1.2 });
  B.obj("luzteto", 30.5, 5, { lr: 0.8 });
  // acervo raro
  [35.5, 38, 40.5, 43].forEach(x => B.obj("estante", x, 3.25));
  B.obj("vitrine", 37, 6);
  B.obj("vitrine", 40.5, 6);
  B.obj("mesa", 44.5, 5.5, { v: 0 });
  B.obj("livro", 44.5, 5.4);
  B.obj("cadeira", 44.5, 6.3);
  B.obj("cofre", 46.5, 8.5);
  B.obj("estante", 45.5, 8.75, { r: 180 });
  B.obj("luzteto", 40, 6, { lr: 0.9 });
  // depósito
  B.obj("caixotes", 36, 13);
  B.obj("caixas", 38.5, 10);
  B.obj("caixas", 38.5, 11.2);
  B.obj("pallet", 35, 10);
  B.obj("teia", 34.6, 14.4);
  B.obj("lixo", 38.5, 13.6);
  // escada secreta (topo)
  B.obj("escada", 43.5, 12);
  B.obj("teia", 46.4, 9.6);
  B.obj("lanterna", 41, 10, { lr: 0.6 });
  // ---------- BASE (subsolo) ----------
  B.fill(1, 23, 46, 24, "g");
  B.fill(1, 32, 46, 33, "g");
  B.fill(20, 17, 21, 39, "g");
  B.wall("v", 1, 23, 2);
  B.wall("v", 47, 23, 2);
  B.wall("v", 1, 32, 2);
  B.wall("v", 47, 32, 2);
  B.wall("h", 20, 17, 2);
  B.wall("h", 20, 40, 2);
  // salas de cima
  B.room(1, 17, 9, 22, "a");
  B.room(10, 17, 19, 22, "u");
  B.room(22, 17, 30, 22, "q");
  B.room(31, 17, 39, 22, "O");
  B.room(40, 17, 46, 22, "k");
  // salas do meio
  B.room(1, 25, 7, 31, "h");
  B.room(8, 25, 19, 31, "B");
  B.room(22, 25, 33, 31, "M");
  B.room(34, 25, 46, 31, "v");
  // salas de baixo
  B.room(1, 34, 12, 39, "y");
  B.room(13, 34, 19, 39, "k");
  B.room(22, 34, 30, 39, "C");
  B.room(31, 34, 46, 39, "n");
  // divisórias
  B.wall("v", 3, 25, 1);
  B.wall("v", 5, 25, 1);
  B.wall("h", 22, 37, 9, "grade");
  B.wall("v", 25, 37, 3, "grade");
  B.wall("v", 28, 37, 3, "grade");
  // portas
  B.door("h", 5, 23);
  B.door("h", 11, 23, "portad");
  B.door("v", 22, 20);
  B.door("h", 26, 23);
  B.door("h", 35, 23, "portaf");
  B.door("h", 43, 23, "portam");
  B.door("h", 15, 25);
  B.door("v", 20, 28);
  B.door("h", 6, 32);
  B.door("v", 22, 28, "portad");
  B.door("h", 23, 25);
  B.door("h", 40, 25);
  B.door("h", 40, 32);
  B.door("h", 9, 34);
  B.door("h", 16, 34, "portam");
  B.door("h", 26, 34, "portaf");
  [23, 26, 29].forEach(x => B.door("h", x, 37, "portao"));
  B.door("h", 38, 34, "portad");
  B.door("h", 38, 32, "portad");
  // chegada da escada
  B.obj("escada", 43.5, 18.5, { v: 1 });
  B.obj("lockers", 41.5, 22.7, { r: 180 });
  B.obj("luzteto", 43.5, 21, { lr: 0.8 });
  // laboratório
  B.obj("bancadal", 2.5, 17.5);
  B.obj("bancadal", 6.5, 17.5);
  B.obj("giratoria", 3, 18.6);
  B.obj("giratoria", 7, 18.6);
  B.obj("tanque", 8.5, 21);
  B.obj("servidor", 2, 22.7, { r: 180 });
  B.obj("carrinho", 5, 21);
  B.obj("papeis", 6.5, 20);
  B.obj("luzbranca", 5, 20, { lr: 1 });
  // sala de reunião
  B.obj("sofaroxo", 15, 19.5);
  B.obj("monitor", 15, 22.6, { r: 180 });
  B.obj("planta", 10.6, 17.6);
  B.obj("planta", 19.4, 17.6);
  B.obj("luzroxa", 15, 19.5, { lr: 1.2 });
  // escritório
  B.obj("tapete", 26, 20.3, { v: 0 });
  B.obj("escrivaninha", 26, 18.6, { v: 0 });
  B.obj("giratoria", 26, 17.7);
  B.obj("estante", 23, 17.25);
  B.obj("poltrona", 25, 21, { v: 0, r: 45 });
  B.obj("poltrona", 27, 21, { v: 0, r: -45 });
  B.obj("arquivo", 30.6, 17.5);
  B.obj("planta", 30.6, 22.4);
  B.obj("luzteto", 26, 20, { lr: 0.9 });
  // sala de ritual
  B.obj("circ_sangue", 35.5, 20);
  B.obj("altar", 35.5, 17.5);
  B.obj("livro", 35.5, 17.5);
  B.obj("velas", 32, 18);
  B.obj("velas", 39, 18);
  B.obj("velas", 32, 22);
  B.obj("velas", 39, 22);
  B.obj("sangue", 33.2, 21.4);
  B.obj("luzverm", 35.5, 20, { lr: 0.9 });
  // corredores
  [5, 15, 28, 40].forEach(x => {
    B.obj("luzteto", x, 24, { lr: 0.6 });
    B.obj("luzteto", x, 33, { lr: 0.6 });
  });
  [20, 30, 37].forEach(y => B.obj("luzteto", 21, y, { lr: 0.6 }));
  B.obj("sujeira", 30, 24);
  // banheiros
  [2, 4, 6].forEach(x => B.obj("vaso", x, 25.4));
  B.obj("pia", 2.5, 31.7, { r: 180 });
  B.obj("pia", 4.5, 31.7, { r: 180 });
  B.obj("chuveiro", 7.5, 28.5);
  B.obj("luzbranca", 4, 28.5, { lr: 0.7 });
  // refeitório
  B.obj("bancada", 9.5, 25.5, { v: 0 });
  B.obj("geladeira", 11.5, 25.5);
  B.obj("fogao", 12.5, 25.5, { v: 1 });
  B.obj("mesaj", 11, 28.5, { v: 3 });
  B.obj("mesaj", 16, 28.5, { v: 3 });
  B.obj("tv", 17.5, 25.3, { v: 3 });
  B.obj("luzteto", 11, 28.5, { lr: 0.9 });
  B.obj("luzteto", 16, 28.5, { lr: 0.9 });
  // bar
  B.obj("balcaobar", 28, 25.5);
  [26.5, 27.5, 28.5, 29.5].forEach(x => B.obj("banqueta", x, 26.4, { v: 0 }));
  B.obj("sinuca", 31.5, 29);
  B.obj("mesabar", 23.5, 28, { v: 0 });
  B.obj("mesabar", 23.5, 30.5, { v: 0 });
  B.obj("mesabar", 26, 30.5, { v: 0 });
  B.obj("jukebox", 28.5, 31.7, { r: 180 });
  B.obj("fliperama", 27, 31.7, { r: 180 });
  B.obj("luzteto", 24.5, 29, { lr: 0.8 });
  B.obj("luzteto", 31.5, 29, { lr: 0.8 });
  // enfermaria
  [35, 36.5, 38].forEach(x => {
    B.obj("leito", x, 26, { v: 0 });
    B.obj("leito", x, 30.9, { v: 0, r: 180 });
  });
  B.obj("soro", 35.8, 27.4);
  B.obj("bancadal", 44, 25.5);
  B.obj("maca", 45.5, 29.5);
  B.obj("carrinho", 42, 28);
  B.obj("luzbranca", 40, 28, { lr: 1 });
  // dormitórios
  [1.6, 3.2, 4.8].forEach((x, i) => {
    B.obj("camah", x, 35.5, { v: i % 3 });
    B.obj("camah", x, 38.5, { v: (i + 1) % 3 });
  });
  B.obj("comoda", 8, 39.7, { r: 180 });
  B.obj("tapeteb", 9, 37);
  B.obj("caixas", 11.5, 38.5);
  B.obj("luzteto", 6, 37, { lr: 0.8 });
  // arsenal
  B.obj("armas", 14.4, 34.3);
  B.obj("armas", 18, 34.3);
  B.obj("bancadaa", 16, 37);
  B.obj("municao", 14, 39.7);
  B.obj("municao", 15.3, 39.7);
  B.obj("lockers", 17.5, 39.7, { r: 180 });
  B.obj("cofre", 19.5, 38.5);
  B.obj("luzteto", 16, 37, { lr: 0.8 });
  // contenção
  [22, 25, 28].forEach((x, i) => {
    B.obj("cama", x + 0.6, 38.5, { v: i });
    B.obj("vaso", x + 2.3, 39.6);
  });
  B.obj("garras", 26.4, 38.2);
  B.obj("maos", 29.6, 37.6);
  B.obj("arquivo", 29.6, 34.6);
  B.obj("luzverm", 26, 35.5, { lr: 0.7 });
  // sala de treino
  B.obj("tatame", 35, 37);
  [35, 37, 39].forEach(y => B.obj("alvo", 46.6, y, { r: 90 }));
  B.obj("saco", 40, 35.5);
  B.obj("saco", 40, 38);
  B.obj("lockers", 33, 39.7, { r: 180 });
  B.obj("caixote", 44, 39.3);
  B.obj("luzteto", 38, 37, { lr: 1 });
  // nomes
  B.txt("Biblioteca", 16.5, 13.3);
  B.txt("Acervo raro", 40.5, 8.2, { tam: 0.36 });
  B.txt("Depósito", 36.5, 14.3, { tam: 0.32 });
  B.txt("Escada secreta", 43.5, 14.3, { tam: 0.32 });
  B.txt("A escada desce até a base", 43.5, 16, { tam: 0.32, cor: "#9a8fb0" });
  B.txt("Laboratório", 5, 22.2, { tam: 0.36 });
  B.txt("Sala de reunião", 15, 17.5, { tam: 0.36 });
  B.txt("Escritório", 26, 22.2, { tam: 0.36 });
  B.txt("Sala de ritual", 35.5, 22.5, { tam: 0.36 });
  B.txt("Chegada", 43.5, 21.4, { tam: 0.32 });
  B.txt("Banheiros", 4, 29.5, { tam: 0.32 });
  B.txt("Refeitório", 13.5, 30.6);
  B.txt("Bar", 26, 27.3);
  B.txt("Enfermaria", 40, 29.8);
  B.txt("Dormitórios", 9, 35.4, { tam: 0.36 });
  B.txt("Arsenal", 16, 38.4, { tam: 0.36 });
  B.txt("Contenção", 26, 35.3, { tam: 0.36 });
  B.txt("Sala de treino", 41.5, 36.8, { tam: 0.36 });
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

/* Base de Operações 2: galpão de cargas no aeroporto (fachada) com elevador para o bunker */
function mbBunker() {
  const B = mbNovo(60, 48);
  // ---------- SUPERFÍCIE: galpão e pátio ----------
  B.room(1, 1, 34, 10, "c", "concreto");
  B.room(28, 1, 34, 5, "q", "concreto");
  B.room(13, 8, 15, 10, "t", "metal");
  B.fill(35, 1, 58, 10, "A");
  B.door("h", 31, 6);
  B.door("h", 14, 8, "portam");
  [6, 7, 8, 9].forEach(y => B.door("v", 35, y, "portao"));
  // galpão
  B.obj("conteiner", 2.5, 4.5);
  B.obj("conteiner", 5, 4.5, { v: 1 });
  B.obj("caixotes", 8.5, 2.5);
  B.obj("caixotes", 10.5, 2.5);
  B.obj("caixotes", 8.5, 4.6);
  B.obj("pallet", 12.5, 2.5);
  B.obj("pallet", 12.5, 4);
  B.obj("prateleira", 18.5, 1.5);
  B.obj("prateleira", 22.5, 1.5);
  B.obj("empilhadeira", 10.5, 7.5);
  B.obj("esteira", 22, 9.5);
  B.obj("carrinhobag", 27, 7.5);
  B.obj("van", 24, 4.8, { v: 0 });
  B.obj("elevador", 14.5, 9.5);
  B.obj("caixote", 18, 5);
  B.obj("caixote", 19.2, 5.6);
  B.obj("barril", 26.6, 9.5, { v: 0 });
  B.obj("barril", 27.4, 9.5, { v: 1 });
  B.obj("mancha_oleo", 21, 8.5);
  B.obj("luzgrande", 8, 5, { lr: 1.4 });
  B.obj("luzgrande", 21, 5, { lr: 1.4 });
  B.obj("luzbranca", 14.5, 9.5, { lr: 0.6 });
  // escritório do galpão
  B.obj("escrivaninha", 31, 2.5, { v: 0 });
  B.obj("giratoria", 31, 3.4);
  B.obj("arquivo", 28.6, 1.5);
  B.obj("arquivo", 29.4, 1.5);
  B.obj("papeis", 33.5, 4.5);
  B.obj("luzteto", 31, 3, { lr: 0.7 });
  // pátio
  B.obj("aviao", 47.5, 5);
  B.obj("carrinhobag", 39, 3);
  B.obj("carrinhobag", 39, 4.4);
  B.obj("empilhadeira", 41.5, 8.5, { r: 90 });
  B.obj("viatura", 56, 8, { v: 1 });
  B.obj("cone", 43, 9.4);
  B.obj("cone", 52, 9.4);
  B.obj("barreira", 56, 2.2);
  B.obj("poste", 36, 1.4);
  B.obj("poste", 57.6, 1.4);
  B.obj("placa", 57.6, 9.6);
  // ---------- BUNKER (subsolo) ----------
  B.fill(1, 23, 58, 24, "g");
  B.fill(1, 36, 58, 37, "g");
  B.fill(29, 14, 30, 46, "g");
  B.wall("v", 1, 23, 2);
  B.wall("v", 59, 23, 2);
  B.wall("v", 1, 36, 2);
  B.wall("v", 59, 36, 2);
  B.wall("h", 29, 14, 2);
  B.wall("h", 29, 47, 2);
  // fileira de cima
  B.room(1, 14, 11, 22, "C");
  B.room(12, 14, 28, 22, "k");
  B.room(13, 14, 15, 16, "t", "metal");
  B.room(31, 14, 44, 22, "t");
  B.room(45, 14, 58, 22, "u");
  // fileira do meio
  B.room(1, 25, 9, 35, "k");
  B.room(10, 25, 19, 35, "a");
  B.room(20, 25, 28, 35, "v");
  B.room(31, 25, 40, 35, "r");
  B.room(41, 25, 49, 35, "q");
  B.room(50, 25, 58, 35, "O");
  // fileira de baixo
  B.room(1, 38, 9, 46, "C");
  B.room(10, 38, 17, 46, "k");
  B.room(18, 38, 28, 46, "n");
  B.room(31, 38, 42, 46, "B");
  B.room(43, 38, 50, 46, "y");
  B.room(51, 38, 58, 46, "h");
  // celas, vidro do interrogatório e boxes do banheiro
  B.wall("h", 1, 42, 9, "grade");
  B.wall("v", 4, 42, 5, "grade");
  B.wall("v", 7, 42, 5, "grade");
  B.wall("v", 14, 38, 9, "vidro");
  B.wall("v", 53, 45, 2);
  B.wall("v", 55, 45, 2);
  B.wall("v", 57, 45, 2);
  // portas
  B.door("h", 14, 17, "portam");
  B.door("h", 6, 23, "portam");
  B.door("h", 20, 23, "portad");
  B.door("h", 21, 23, "portad");
  B.door("v", 29, 18, "portad");
  B.door("v", 31, 18);
  B.door("h", 37, 23, "portad");
  B.door("h", 38, 23, "portad");
  B.door("v", 45, 18);
  B.door("h", 51, 23);
  B.door("h", 5, 25, "portam");
  B.door("h", 14, 25);
  B.door("h", 14, 36);
  B.door("v", 20, 30);
  B.door("h", 24, 25, "portad");
  B.door("h", 24, 36);
  B.door("v", 31, 30);
  B.door("h", 35, 25);
  B.door("h", 45, 25);
  B.door("h", 51, 25, "portaf");
  B.door("h", 5, 38, "portaf");
  [2, 5, 8].forEach(x => B.door("h", x, 42, "portao"));
  B.door("h", 12, 38, "portam");
  B.door("v", 14, 45);
  B.door("h", 23, 38, "portad");
  B.door("v", 31, 42, "portad");
  B.door("h", 36, 38, "portad");
  B.door("h", 37, 38, "portad");
  B.door("h", 46, 38);
  B.door("h", 57, 38);
  // gerador e manutenção
  B.obj("gerador", 3, 15.5);
  B.obj("gerador", 3, 17.5);
  B.obj("canos", 8.5, 14.5);
  B.obj("maquina", 9, 18.5);
  B.obj("barril", 1.6, 21.6, { v: 0 });
  B.obj("barril", 2.4, 21.6, { v: 2 });
  B.obj("toxico", 3.4, 21.6);
  B.obj("caixas", 6, 20.5);
  B.obj("mancha_oleo", 5, 17);
  B.obj("painel", 5.5, 14.3);
  B.obj("ventilacao", 10.5, 21.5);
  B.obj("luzverde", 6, 18, { lr: 0.9 });
  // recepção e segurança (chegada do elevador)
  B.obj("monitor", 22, 16, { r: 180 });
  B.obj("giratoria", 22, 15.1);
  B.obj("lockers", 19, 14.3);
  B.obj("lockers", 26.5, 14.3);
  [18.5, 19.5, 20.5, 21.5].forEach(x => B.obj("catraca", x, 19.3));
  B.obj("sofa", 25.5, 21.5, { v: 2, r: 180 });
  B.obj("planta", 12.6, 22.4);
  B.obj("planta", 28.4, 22.4);
  B.obj("luzteto", 20.5, 19, { lr: 1.1 });
  B.obj("elevador", 14.5, 15.5);
  B.obj("luzbranca", 14.5, 15.5, { lr: 0.5 });
  // centro de comando
  [33.5, 37.5, 41.5].forEach(x => {
    B.obj("monitor", x, 14.6);
    B.obj("giratoria", x, 15.6);
  });
  B.obj("reuniao", 38, 19);
  B.obj("servidor", 32, 22.6, { r: 180 });
  B.obj("servidor", 33.2, 22.6, { r: 180 });
  B.obj("servidor", 43.8, 22.6, { r: 180 });
  B.obj("painel", 31.3, 18.5, { r: 90 });
  B.obj("luzazul", 38, 18.5, { lr: 1.3 });
  // sala de briefing
  B.obj("sofaroxo", 51.5, 17.5);
  B.obj("monitor", 51.5, 21.6, { r: 180 });
  B.obj("quadrop", 47, 14.3);
  B.obj("planta", 45.6, 21.4);
  B.obj("planta", 58.4, 14.6);
  B.obj("luzroxa", 51.5, 17.5, { lr: 1.4 });
  // corredores
  [5, 15, 25, 35, 45, 55].forEach(x => {
    B.obj("luzteto", x, 24, { lr: 0.6 });
    B.obj("luzteto", x, 37, { lr: 0.6 });
  });
  [19, 30, 42].forEach(y => B.obj("luzteto", 30, y, { lr: 0.6 }));
  B.obj("sujeira", 12, 24);
  B.obj("sujeira", 47, 37);
  // arsenal
  B.obj("armas", 2.5, 25.3);
  B.obj("armas", 8, 25.3);
  B.obj("armas", 1.3, 29, { r: 90 });
  B.obj("armas", 1.3, 32, { r: 90 });
  B.obj("bancadaa", 5.5, 30);
  B.obj("municao", 6.5, 34.7);
  B.obj("municao", 8, 34.7);
  B.obj("cofre", 8.6, 28);
  B.obj("lockers", 3.5, 35.7, { r: 180 });
  B.obj("luzteto", 5, 30, { lr: 0.9 });
  // laboratório
  B.obj("bancadal", 12, 26);
  B.obj("bancadal", 17, 26);
  B.obj("giratoria", 12, 27);
  B.obj("giratoria", 17, 27);
  B.obj("tanque", 10.6, 30);
  B.obj("tanque", 10.6, 32);
  B.obj("cirurgia", 15, 30.5);
  B.obj("carrinho", 16.4, 30);
  B.obj("servidor", 11.5, 35.6, { r: 180 });
  B.obj("papeis", 18, 33);
  B.obj("luzbranca", 15, 30, { lr: 1.1 });
  // enfermaria
  [21, 22.5, 26, 27.5].forEach(x => {
    B.obj("leito", x, 26.5, { v: 0 });
    B.obj("leito", x, 34, { v: 0, r: 180 });
  });
  B.obj("soro", 21.8, 28.2);
  B.obj("soro", 26.8, 28.2);
  B.obj("maca", 27.5, 30.5);
  B.obj("carrinho", 26.4, 31);
  B.obj("luzbranca", 24, 30, { lr: 1 });
  // arquivo e biblioteca
  B.obj("estante", 32.5, 25.3);
  B.obj("estante", 37.5, 25.3);
  B.obj("estante", 39.6, 25.3);
  [32.5, 34.6, 36.7, 38.8].forEach(x => B.obj("estante", x, 35.7, { r: 180 }));
  [28, 29, 30].forEach(y => B.obj("arquivo", 40.6, y));
  B.obj("mesa", 35.5, 30.5, { v: 0 });
  B.obj("cadeira", 35, 31.4);
  B.obj("cadeira", 36, 31.4);
  B.obj("livro", 35.5, 30.4);
  B.obj("papeis", 33, 32);
  B.obj("luzteto", 35.5, 30, { lr: 1 });
  // coordenação
  B.obj("tapete", 45, 30, { v: 0 });
  B.obj("escrivaninha", 45, 28, { v: 0 });
  B.obj("giratoria", 45, 27.2);
  B.obj("poltrona", 44, 31.5, { v: 0, r: 30 });
  B.obj("poltrona", 46, 31.5, { v: 0, r: -30 });
  B.obj("estante", 42.5, 25.3);
  B.obj("estante", 47.5, 25.3);
  B.obj("arquivo", 48.6, 34.6);
  B.obj("cofre", 48.6, 33.6);
  B.obj("planta", 41.6, 34.6);
  B.obj("quadrop", 45, 35.7, { r: 180 });
  B.obj("luzteto", 45, 30, { lr: 1 });
  // sala de ritual
  B.obj("circ_sangue", 54.5, 30.5);
  B.obj("altar", 55, 26.5);
  B.obj("livro", 55, 26.5);
  B.obj("estante", 57.2, 25.3, { v: 3 });
  B.obj("velas", 51, 28);
  B.obj("velas", 58, 28);
  B.obj("velas", 51, 33);
  B.obj("velas", 58, 33);
  B.obj("sigilo", 56.5, 34);
  B.obj("sangue", 52, 34.5);
  B.obj("luzverm", 54.5, 30.5, { lr: 1 });
  // contenção
  [1.5, 4.5, 7.5].forEach((x, i) => {
    B.obj("cama", x + 0.1, 44.5, { v: i });
    B.obj("vaso", x + 1.4, 46.4);
  });
  B.obj("garras", 5.4, 44);
  B.obj("maos", 8.2, 43.4);
  B.obj("ossos", 2.6, 45.6);
  B.obj("arquivo", 1.4, 38.6);
  B.obj("luzverm", 5, 40, { lr: 0.8 });
  // interrogatório e observação
  B.obj("giratoria", 12, 41);
  B.obj("monitor", 11.6, 39.8, { r: 0 });
  B.obj("arquivo", 10.6, 46.4);
  B.obj("mesa", 16, 42, { v: 2, r: 90 });
  B.obj("cadeira", 15.3, 42);
  B.obj("cadeira", 16.7, 42);
  B.obj("luzbranca", 16, 42, { lr: 0.6 });
  // sala de treino
  B.obj("tatame", 21, 42.5);
  [40, 42, 44].forEach(y => B.obj("alvo", 28.6, y, { r: 90 }));
  B.obj("saco", 25, 40.5);
  B.obj("saco", 25, 42.5);
  B.obj("caixote", 19.5, 45.8);
  B.obj("lockers", 23, 46.7, { r: 180 });
  B.obj("pallet", 19, 39.5);
  B.obj("luzteto", 23, 42, { lr: 1.1 });
  // refeitório e cozinha
  B.obj("geladeira", 31.6, 46.4);
  B.obj("bancada", 33.5, 46.5, { v: 0, r: 180 });
  B.obj("fogao", 35.6, 46.4, { v: 1 });
  B.obj("pia", 37.5, 46.7, { r: 180 });
  B.obj("mesaj", 34, 41.5, { v: 3 });
  B.obj("mesaj", 39, 41.5, { v: 3 });
  B.obj("tv", 40.5, 38.3, { v: 3 });
  B.obj("luzteto", 34, 41.5, { lr: 0.9 });
  B.obj("luzteto", 39, 41.5, { lr: 0.9 });
  // dormitórios
  [40.5, 43.5].forEach((y, i) => {
    B.obj("camah", 43.6, y, { v: i });
    B.obj("camah", 50.4, y, { v: i + 1 });
  });
  B.obj("comoda", 44, 46.7, { r: 180 });
  B.obj("comoda", 50, 46.7, { r: 180 });
  B.obj("tapeteb", 46.5, 42);
  B.obj("luzteto", 46.5, 42.5, { lr: 0.8 });
  // banheiros
  [52, 54, 56].forEach(x => B.obj("vaso", x, 46.4));
  B.obj("pia", 52, 38.3);
  B.obj("pia", 54, 38.3);
  B.obj("chuveiro", 58, 40);
  B.obj("chuveiro", 58, 42);
  B.obj("luzbranca", 55, 42, { lr: 0.7 });
  // nomes
  B.txt("Galpão de cargas (fachada)", 9, 6.7);
  B.txt("Elevador", 14.5, 10.75, { tam: 0.3 });
  B.txt("Escritório", 31, 4.6, { tam: 0.3 });
  B.txt("Pátio do aeroporto", 38.5, 1.6, { tam: 0.36 });
  B.txt("O elevador desce até o bunker", 14.5, 12.5, { tam: 0.35, cor: "#9a8fb0" });
  B.txt("Elevador", 14.5, 16.75, { tam: 0.3 });
  B.txt("Gerador e manutenção", 6, 20.2, { tam: 0.35 });
  B.txt("Recepção e segurança", 20.5, 17.8);
  B.txt("Centro de comando", 38, 21.6);
  B.txt("Sala de briefing", 51.5, 20.2);
  B.txt("Arsenal", 5, 32.4);
  B.txt("Laboratório", 15, 33.6);
  B.txt("Enfermaria", 24, 31.6);
  B.txt("Arquivo e biblioteca", 35.5, 33.6, { tam: 0.36 });
  B.txt("Coordenação", 45, 33.4);
  B.txt("Sala de ritual", 54.5, 35.2, { tam: 0.36 });
  B.txt("Contenção", 5, 40.8);
  B.txt("Observação", 12, 43.8, { tam: 0.3 });
  B.txt("Interrogatório", 15.9, 45.2, { tam: 0.3 });
  B.txt("Sala de treino", 23, 40.2);
  B.txt("Refeitório", 36.5, 44);
  B.txt("Dormitórios", 46.5, 45.6, { tam: 0.36 });
  B.txt("Banheiros", 55, 41.5, { tam: 0.36 });
  const M = B.done();
  M.amb = "sombrio";
  return M;
}

/* Cemitério à noite: cerca de grade, quadras de túmulos, mausoléu e casa do coveiro */
function mbCemiterio() {
  const B = mbNovo(40, 31, "H");
  B.fill(0, 29, 39, 30, "s");
  B.fill(19, 1, 20, 28, "K");
  B.fill(1, 14, 38, 15, "K");
  B.wall("h", 1, 1, 38, "grade");
  B.wall("h", 1, 29, 38, "grade");
  B.wall("v", 1, 1, 28, "grade");
  B.wall("v", 39, 1, 28, "grade");
  B.door("h", 19, 29, "portao");
  B.door("h", 20, 29, "portao");
  // casa do coveiro
  B.room(2, 22, 7, 27, "P", "madeira");
  B.door("v", 8, 24);
  B.obj("caixas", 3, 23);
  B.obj("barril", 6.6, 22.6, { v: 0 });
  B.obj("mesa", 4.5, 26.4, { v: 1 });
  B.obj("cadeira", 4.5, 25.6);
  B.obj("lanterna", 4.5, 26.3, { lr: 0.5 });
  B.obj("teia", 2.4, 27.6);
  B.obj("pegadas", 9, 24.5, { r: 90 });
  // mausoléu grande (dá para entrar)
  B.room(24, 17, 31, 23, "O", "pedra");
  B.door("h", 27, 24, "portad");
  B.door("h", 28, 24, "portad");
  B.obj("altar", 27.5, 17.6);
  B.obj("velas", 25, 18);
  B.obj("velas", 30.5, 18);
  [19.5, 22].forEach(y => {
    B.obj("tumulo", 25, y, { v: 1 });
    B.obj("tumulo", 30.5, y, { v: 1 });
  });
  B.obj("coroa", 27.5, 21);
  B.obj("luzverm", 27.5, 20, { lr: 0.7 });
  B.obj("anjo", 25.5, 25);
  B.obj("anjo", 29.5, 25);
  // quadras de túmulos
  const quadra = (x0, x1, ys) =>
    ys.forEach((y, j) => {
      for (let x = x0, k = 0; x <= x1; x += 2, k++) B.obj("tumulo", x, y, { v: (k + j) % 4 });
    });
  quadra(3.5, 17.5, [3.5, 7, 10.5]);
  quadra(22.5, 37.5, [3.5, 7, 10.5]);
  [17.5, 20, 22.5, 25].forEach((y, j) => {
    for (let x = 10.5, k = 0; x <= 17.5; x += 1.5, k++)
      B.obj(j % 2 ? "cruz" : "lapide", x, y, { v: (j + k) % 3 });
  });
  [33, 35.5].forEach(x => [18, 21.5, 25].forEach(y => B.obj("lapide", x + 1, y, { v: 1 })));
  B.obj("mausoleu", 5, 18);
  B.obj("mausoleu", 36, 26.5, { v: 1 });
  B.obj("cova", 13, 27, { r: 90 });
  [
    [5.2, 4.6],
    [12.2, 8.1],
    [24.2, 11.6],
    [34.2, 4.6]
  ].forEach(([x, y]) => B.obj("coroa", x, y));
  // árvores, estátuas e luzes
  B.obj("morta", 17.5, 26.5);
  B.obj("morta", 37, 15.5);
  B.obj("morta", 3, 14.5, { v: 1 });
  B.obj("anjo", 20, 14.5);
  B.obj("poste", 18.5, 6.5);
  B.obj("poste", 21.5, 22);
  B.obj("luzgrande", 18.5, 6.5, { lr: 1 });
  B.obj("luzgrande", 21.5, 22, { lr: 1 });
  B.obj("folhas", 22, 9);
  B.obj("folhas", 9, 16);
  B.obj("poste", 6, 30.4);
  B.txt("Cemitério Jardim da Paz", 20, 30.2, { tam: 0.4 });
  B.txt("Mausoléu", 27.5, 21.2, { tam: 0.34 });
  B.txt("Coveiro", 4.5, 24.6, { tam: 0.32 });
  const M = B.done();
  M.amb = "noite";
  return M;
}

/* Paróquia: nave com bancos, sacristia e o salão onde funciona o grupo de luto */
function mbIgreja() {
  const B = mbNovo(36, 26, "G");
  B.fill(0, 23, 35, 25, "s");
  B.room(6, 1, 23, 22, "o", "pedra");
  B.fill(14, 5, 15, 22, "r");
  B.room(24, 1, 35, 8, "q", "pedra");
  B.room(24, 9, 35, 22, "m", "pedra");
  B.door("h", 14, 23, "portad");
  B.door("h", 15, 23, "portad");
  B.door("v", 24, 5);
  B.door("v", 24, 15);
  B.door("h", 30, 23);
  B.door("h", 30, 9);
  // nave
  B.obj("crucifixo", 15, 1.25);
  B.obj("altar", 15, 2.6);
  B.obj("velas", 12.5, 2.5);
  B.obj("velas", 17.5, 2.5);
  B.obj("pulpito", 10.5, 4.5);
  [8, 10, 12, 14, 16, 18, 20].forEach(y =>
    [8.5, 11.5, 17.5, 20.5].forEach(x => B.obj("bancoigreja", x, y, { v: 1 }))
  );
  [6, 11, 16].forEach(y => {
    B.obj("vitral", 6.25, y, { r: 90 });
    B.obj("vitral", 23.75, y, { r: 90 });
  });
  B.obj("piabatismal", 8, 21.5);
  B.obj("confessionario", 21.5, 21.4);
  B.obj("planta", 6.6, 1.6);
  B.obj("planta", 23.4, 1.6);
  B.obj("luzteto", 15, 3, { lr: 1.1 });
  B.obj("luzteto", 15, 12, { lr: 1.2 });
  B.obj("luzteto", 15, 19, { lr: 1 });
  // sacristia
  B.obj("armario", 26, 1.25);
  B.obj("mesa", 30, 4, { v: 0 });
  B.obj("cadeira", 30, 4.8);
  B.obj("arquivo", 34.6, 1.5);
  B.obj("velas", 34.4, 7.4);
  B.obj("luzteto", 30, 4.5, { lr: 0.8 });
  // salão do grupo de luto
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    B.obj("cadeira", 29.5 + Math.cos(a) * 3, 15.5 + Math.sin(a) * 3);
  }
  B.obj("mesa", 33.5, 21.4, { v: 0 });
  B.obj("papeis", 33, 21.3);
  B.obj("caixas", 25, 21.5);
  B.obj("sujeira", 29.5, 15.5);
  B.obj("quadrop", 29.5, 9.3);
  B.obj("luzteto", 29.5, 15.5, { lr: 1.1 });
  // jardim e rua
  B.obj("arvore", 3, 4);
  B.obj("arvore", 3, 14, { v: 1 });
  B.obj("cruz", 3, 9);
  B.obj("banco", 3, 19, { r: 90 });
  B.obj("poste", 5, 23.4);
  B.obj("poste", 33, 23.4);
  B.txt("Paróquia de Santa Rita", 15, 24.6, { tam: 0.42 });
  B.txt("Sacristia", 30, 7.3, { tam: 0.34 });
  B.txt("Salão paroquial", 29.5, 19.8, { tam: 0.36 });
  const M = B.done();
  M.amb = "sombrio";
  return M;
}

/* Mercado de bairro com depósito e estacionamento */
function mbMercado() {
  const B = mbNovo(30, 22, "A");
  B.room(1, 1, 28, 14, "B", "concreto");
  B.room(20, 1, 28, 5, "c", "concreto");
  B.wall("h", 1, 15, 28, "vidro");
  B.door("h", 22, 15, "portad");
  B.door("h", 23, 15, "portad");
  B.door("h", 24, 6, "portam");
  [4, 7, 10].forEach(y => [3.5, 7, 10.5, 14].forEach(x => B.obj("gondola", x, y)));
  [2.5, 4.6, 6.7, 8.8, 10.9, 13, 15.1, 17.2].forEach(x => B.obj("geladeiravert", x + 0.5, 1.25));
  [8, 10, 12].forEach(y => B.obj("freezer", 18.5, y));
  [4, 8, 12].forEach(x => B.obj("caixareg", x, 13));
  B.obj("carrinhomerc", 26, 12.5);
  B.obj("carrinhomerc", 26.6, 12.5);
  B.obj("carrinhomerc", 27.2, 12.5);
  B.obj("caixotes", 22, 3);
  B.obj("pallet", 25, 2);
  B.obj("pallet", 26.2, 2);
  B.obj("caixas", 27.5, 4.5);
  B.obj("prateleira", 24.5, 4.6);
  B.obj("luzbranca", 8, 7, { lr: 1.2 });
  B.obj("luzbranca", 16, 7, { lr: 1 });
  B.obj("luzbranca", 24, 10, { lr: 0.9 });
  // estacionamento
  [4, 8, 12, 16].forEach(x => B.obj("listra", x, 19.5, { r: 90 }));
  B.obj("carro", 6, 19.5, { v: 2 });
  B.obj("carro", 14, 19.5, { v: 4 });
  B.obj("carrinhomerc", 20, 18);
  B.obj("lixeira", 27, 16.4);
  B.obj("poste", 2, 16.4);
  B.obj("poste", 18, 21.4);
  B.txt("Mercado", 10, 15.6, { tam: 0.42 });
  B.txt("Depósito", 24, 2.8, { tam: 0.34 });
  const M = B.done();
  M.amb = "noite";
  return M;
}

/* Estação de metrô: duas plataformas, trilhos, vagões e bilheteria */
function mbMetro() {
  const B = mbNovo(36, 20, "c");
  B.room(0, 0, 35, 19, "c", "concreto");
  B.fill(0, 8, 35, 11, "C");
  B.room(1, 14, 4, 17, "q", "concreto");
  B.door("h", 3, 14, "portam");
  [6, 12, 18, 24, 30].forEach(x => {
    B.room(x, 4, x, 4, "C", "concreto");
    B.room(x, 15, x, 15, "C", "concreto");
  });
  for (let x = 1.5; x <= 34.5; x += 3) B.obj("trilhos", x, 9.5, { r: 90 });
  for (let x = 1.5; x <= 34.5; x += 3) {
    B.obj("faixaplat", x, 7.75);
    B.obj("faixaplat", x, 12.25);
  }
  [10, 16.3, 22.6].forEach(x => B.obj("vagao", x, 9.5, { r: 90, v: 2 }));
  [2, 3, 4, 5].forEach(x => B.obj("catraca", x + 0.5, 2.6));
  B.obj("escada", 33.5, 2.5, { r: 180 });
  B.obj("escada", 33.5, 16.5);
  [9, 15, 21, 27].forEach(x => {
    B.obj("banco", x, 1.3);
    B.obj("banco", x, 18.7, { r: 180 });
  });
  B.obj("caixareg", 2.5, 15.5, { r: 180 });
  B.obj("giratoria", 2.5, 16.6);
  B.obj("lixeira", 13, 6.6);
  B.obj("lixeira", 25, 13.4);
  B.obj("placa", 8, 6.6);
  B.obj("sujeira", 20, 5);
  B.obj("lixo", 28, 14);
  [6, 18, 30].forEach(x => {
    B.obj("luzbranca", x, 5, { lr: 1 });
    B.obj("luzbranca", x, 14, { lr: 1 });
  });
  B.obj("luzverm", 35, 9.5, { lr: 0.6 });
  B.txt("Plataforma 1", 15, 6.4, { tam: 0.38 });
  B.txt("Plataforma 2", 15, 13.6, { tam: 0.38 });
  B.txt("Bilheteria", 2.5, 17.4, { tam: 0.3 });
  const M = B.done();
  M.amb = "sombrio";
  return M;
}

/* Escola: três salas de aula, corredor com armários, secretaria, banheiros, biblioteca e pátio */
function mbEscola() {
  const B = mbNovo(36, 26, "s");
  B.fill(1, 11, 34, 13, "g");
  B.wall("h", 1, 11, 34);
  B.wall("h", 1, 14, 34);
  B.wall("v", 35, 11, 3);
  const salas = [
    [1, 11],
    [12, 22],
    [23, 34]
  ];
  salas.forEach(([x0, x1], i) => {
    B.room(x0, 1, x1, 10, "q");
    const cx = (x0 + x1 + 1) / 2;
    B.door("h", Math.floor(cx), 11);
    B.obj("lousa", cx, 1.25);
    B.obj("mesaprof", cx, 3);
    [5, 6.6, 8.2].forEach(y => {
      B.obj("carteiras", cx - 1.9, y);
      B.obj("carteiras", cx + 1.9, y);
    });
    B.obj("luzbranca", cx, 6, { lr: 1 });
    B.txt(`Sala ${i + 1}`, cx, 9.8, { tam: 0.34 });
  });
  B.room(1, 14, 9, 24, "q");
  B.room(10, 14, 15, 24, "h");
  B.room(16, 14, 24, 24, "y");
  B.room(25, 14, 34, 24, "A", "concreto");
  B.door("v", 1, 12, "portad");
  B.door("h", 5, 14);
  B.door("h", 12, 14);
  B.door("h", 20, 14);
  B.door("h", 29, 14, "portad");
  B.door("h", 30, 14, "portad");
  // corredor
  [4, 8, 15, 19, 26, 30].forEach(x => {
    B.obj("armarioesc", x, 11.25, { v: x % 4 });
    B.obj("armarioesc", x, 13.75, { r: 180, v: (x + 1) % 4 });
  });
  B.obj("bebedouro", 23.5, 12);
  [6, 17, 28].forEach(x => B.obj("luzteto", x, 12, { lr: 0.7 }));
  // secretaria
  B.obj("escrivaninha", 5, 17, { v: 0 });
  B.obj("giratoria", 5, 16.1);
  B.obj("arquivo", 1.6, 15);
  B.obj("arquivo", 2.4, 15);
  B.obj("cadeira", 4.5, 18);
  B.obj("cadeira", 5.5, 18);
  B.obj("papeis", 7.5, 22);
  B.obj("quadrop", 5, 24.7, { r: 180 });
  B.obj("luzteto", 5, 19, { lr: 0.9 });
  // banheiros
  B.wall("v", 12, 22, 3);
  B.wall("v", 14, 22, 3);
  [11, 13, 15].forEach(x => B.obj("vaso", x - 0.2, 24.4));
  B.obj("pia", 11.5, 14.3);
  B.obj("pia", 13.5, 14.3);
  B.obj("luzbranca", 13, 18, { lr: 0.7 });
  // biblioteca escolar
  [17.5, 20, 22.5].forEach(x => B.obj("estante", x, 14.25));
  B.obj("estantebib", 18.5, 19);
  B.obj("estantebib", 22, 19);
  B.obj("mesa", 20, 22.5, { v: 0 });
  [19.5, 20.5].forEach(x => {
    B.obj("cadeira", x, 21.7);
    B.obj("cadeira", x, 23.3);
  });
  B.obj("luzteto", 20, 20, { lr: 0.9 });
  // pátio
  B.obj("banco", 26.5, 24.5);
  B.obj("banco", 32.5, 24.5);
  B.obj("arvore", 33, 16);
  B.obj("folhas", 27, 17);
  B.txt("Secretaria", 5, 20.6, { tam: 0.36 });
  B.txt("Banheiros", 13, 19.6, { tam: 0.32 });
  B.txt("Biblioteca", 20, 17.4, { tam: 0.36 });
  B.txt("Pátio", 29.5, 22.4);
  B.txt("Entrada", 0.6, 15.4, { tam: 0.3 });
  const M = B.done();
  M.amb = "sombrio";
  return M;
}

/* Fazenda: casa, celeiro, curral, plantação e poço */
function mbFazenda() {
  const B = mbNovo(40, 30, "H");
  B.fill(17, 13, 20, 29, "T");
  B.fill(21, 15, 33, 16, "T");
  // casa
  B.room(3, 3, 9, 8, "m", "madeira");
  B.room(10, 3, 14, 8, "B", "madeira");
  B.room(3, 9, 8, 12, "m", "madeira");
  B.room(9, 9, 14, 12, "m", "madeira");
  B.door("h", 9, 13, "porta");
  B.door("v", 10, 6);
  B.door("h", 6, 9);
  B.door("h", 12, 9);
  B.door("v", 3, 5, "janelaq");
  B.door("h", 6, 3, "janela");
  B.obj("sofa", 6, 7.5, { v: 3, r: 180 });
  B.obj("tapete", 6, 5.5, { v: 2 });
  B.obj("lareira", 6, 3.5);
  B.obj("poltrona", 8.5, 5.5, { v: 1, r: -90 });
  B.obj("fogao", 11, 3.5, { v: 0 });
  B.obj("bancada", 12.8, 3.5, { v: 1 });
  B.obj("mesa", 12, 6, { v: 0 });
  B.obj("cadeira", 11.5, 6.8);
  B.obj("cadeira", 12.5, 6.8);
  B.obj("cama", 4, 10.5, { v: 1 });
  B.obj("criado", 5, 9.4);
  B.obj("camac", 12, 10.5, { v: 0 });
  B.obj("comoda", 10, 12.7, { r: 180 });
  B.obj("lampada", 6, 5.5, { lr: 0.7 });
  B.obj("lampada", 12, 10.5, { lr: 0.5 });
  // celeiro
  B.room(24, 3, 37, 14, "P", "madeira");
  B.door("h", 30, 15, "portao");
  B.door("h", 31, 15, "portao");
  B.obj("trator", 27, 11.5);
  [
    [25, 4],
    [26, 4],
    [25, 5],
    [33, 4],
    [34, 4],
    [35, 4],
    [36, 4]
  ].forEach(([x, y]) => B.obj("fardoq", x + 0.5, y + 0.5));
  B.obj("fardo", 35.5, 7);
  B.obj("fardo", 36.5, 8.2);
  B.obj("fardo", 35.5, 9.4);
  B.obj("cocho", 31, 4.3);
  B.obj("folhas", 30, 8);
  B.obj("folhas", 33, 11);
  B.obj("sangue", 34.5, 12.5);
  B.obj("rastro", 32, 13, { r: 90 });
  B.obj("lanterna", 30.5, 8, { lr: 0.8 });
  // curral
  B.wall("h", 24, 18, 14, "cercam");
  B.wall("h", 24, 28, 14, "cercam");
  B.wall("v", 24, 18, 10, "cercam");
  B.wall("v", 38, 18, 10, "cercam");
  B.door("h", 30, 18, "portao");
  B.fill(24, 18, 37, 27, "T");
  B.obj("cocho", 26, 18.4);
  B.obj("cocho", 26, 27.6);
  B.fill(29, 22, 33, 24, "U");
  B.obj("pegadas", 29, 21);
  B.obj("ossos", 35, 25);
  // plantação
  [18.5, 21.5, 24.5].forEach(y =>
    [4.5, 7.5, 10.5, 13.5].forEach(x => B.obj("plantacao", x, y, { v: x === 13.5 ? 1 : 0 }))
  );
  B.obj("espantalho", 9, 23);
  // quintal
  B.obj("poco", 18.5, 9.5);
  B.obj("arvore", 21, 4);
  B.obj("arvore", 2, 16, { v: 1 });
  B.obj("morta", 37, 1.5);
  B.obj("morta", 2, 28);
  B.obj("caixote", 16, 12.5);
  B.obj("barril", 15.6, 11.4, { v: 0 });
  B.obj("lanterna", 9, 13.6, { lr: 0.7 });
  B.obj("luzgrande", 30.5, 16, { lr: 1 });
  B.txt("Casa", 6, 4.6, { tam: 0.34 });
  B.txt("Celeiro", 30.5, 6.5);
  B.txt("Curral", 31, 26.6);
  B.txt("Plantação", 9, 27.4);
  B.txt("Poço", 18.5, 10.8, { tam: 0.3 });
  const M = B.done();
  M.amb = "noite";
  return M;
}

/* Porto: cais, píer, galpão de pesca, barcos e uma praia ao lado */
function mbPorto() {
  const B = mbNovo(40, 28, "e");
  B.fill(0, 16, 39, 27, "W");
  B.fill(0, 15, 39, 15, "w");
  B.fill(0, 7, 13, 15, "D");
  B.fill(0, 15, 13, 16, "w");
  B.fill(22, 15, 25, 26, "m");
  B.fill(26, 22, 33, 23, "m");
  B.room(26, 2, 37, 11, "c", "madeira");
  B.door("h", 31, 12, "portao");
  B.door("h", 32, 12, "portao");
  B.door("v", 26, 6, "porta");
  // galpão de pesca
  B.obj("rede", 28.5, 4);
  B.obj("rede", 34.5, 9, { v: 1 });
  B.obj("freezer", 36, 3);
  B.obj("caixotes", 29, 9.5);
  B.obj("barril", 27, 2.6, { v: 0 });
  B.obj("barril", 27.8, 2.6, { v: 1 });
  B.obj("mesa", 32.5, 6, { v: 1 });
  B.obj("cadeira", 32.5, 6.8);
  B.obj("ancora", 36.5, 6);
  B.obj("boia", 31.5, 2.4);
  B.obj("boia", 33.5, 2.4);
  B.obj("lanterna", 32.5, 6, { lr: 0.8 });
  // cais e píer
  [
    [22.3, 17],
    [25.7, 17],
    [22.3, 21],
    [25.7, 21],
    [22.3, 25],
    [25.7, 25],
    [33.5, 22.3]
  ].forEach(([x, y]) => B.obj("cabeco", x, y));
  B.obj("barco", 20, 20, { v: 0 });
  B.obj("barco", 30, 25.5, { r: 90, v: 1 });
  B.obj("barco", 36, 18.5, { r: 90, v: 2 });
  B.obj("boia", 17, 24);
  B.obj("boia", 37.5, 26);
  B.obj("caixote", 23, 15.5);
  B.obj("caixotes", 19, 12);
  B.obj("carro", 16, 4, { r: 90, v: 2 });
  B.obj("van", 21, 4, { r: 90, v: 1 });
  B.obj("poste", 15, 9.5);
  B.obj("poste", 24, 14.4);
  B.obj("luzgrande", 24, 14.4, { lr: 1.1 });
  B.obj("luzgrande", 15, 9.5, { lr: 1 });
  B.obj("lixeira", 18, 14.4);
  // praia
  B.obj("guardasol", 4, 10, { v: 0 });
  B.obj("guardasol", 9, 12.5, { v: 1 });
  B.obj("cadeirapraia", 3, 11.8, { v: 0 });
  B.obj("cadeirapraia", 5, 11.8, { v: 1 });
  B.obj("cadeirapraia", 8, 14, { v: 2 });
  B.obj("pegadas", 6, 9, { r: 30 });
  B.obj("pedras", 1.5, 14.5);
  B.txt("Galpão de pesca", 31.5, 10.2, { tam: 0.36 });
  B.txt("Píer", 23.5, 23.6);
  B.txt("Praia", 6.5, 8.3);
  B.txt("Cais", 18, 7);
  const M = B.done();
  M.amb = "noite";
  return M;
}

/* Prédio de apartamentos: um andar com hall, escadas, elevadores e oito apartamentos */
function mbPredio() {
  const B = mbNovo(36, 26, "s");
  B.fill(1, 11, 34, 13, "y");
  B.wall("h", 1, 11, 15);
  B.wall("h", 20, 11, 15);
  B.wall("h", 1, 14, 15);
  B.wall("h", 20, 14, 15);
  B.wall("v", 1, 11, 3);
  B.wall("v", 35, 11, 3);
  B.room(16, 1, 19, 10, "C", "concreto");
  B.room(16, 14, 19, 24, "k");
  B.open("h", 17, 11);
  B.open("h", 18, 11);
  B.open("h", 17, 14);
  B.open("h", 18, 14);
  B.obj("escadasobe", 17, 3.5);
  B.obj("escada", 17, 8, { v: 1 });
  B.obj("elevadorap", 17, 16);
  B.obj("elevadorap", 17, 19);
  B.obj("correio", 17, 23.7, { r: 180 });
  B.obj("extintor", 19.6, 12);
  B.obj("planta", 16.4, 21.5);
  const apto = (x0, x1, y0, y1, cima, num, quebrado) => {
    B.room(x0, y0, x1, y1, "q");
    const meio = Math.floor((x0 + x1) / 2);
    B.wall("v", meio + 1, y0, y1 - y0 + 1);
    const portaX = cima ? x1 - 1 : x1 - 1;
    B.door("h", portaX, cima ? y1 + 1 : y0, quebrado ? "portaq" : "porta");
    B.door("v", meio + 1, cima ? y0 + 2 : y1 - 2);
    B.obj("capacho", portaX + 0.5, cima ? y1 + 1.3 : y0 - 0.3);
    const sx = (x0 + meio + 1) / 2;
    const qx = (meio + 1 + x1 + 1) / 2;
    B.obj("sofa", sx, cima ? y0 + 1 : y1 - 0.5, { v: (num + 1) % 4, r: cima ? 0 : 180 });
    B.obj("tv", sx, cima ? y1 + 0.7 : y0 + 0.3, { r: cima ? 180 : 0 });
    B.obj("cama", qx, cima ? y0 + 1.2 : y1 - 0.7, { v: num % 3 });
    B.obj("bancada", qx, cima ? y1 + 0.5 : y0 + 0.5, { v: num % 2, r: cima ? 180 : 0 });
    B.obj("lampada", sx, (y0 + y1 + 1) / 2, { lr: 0.6 });
    B.txt(`Apto ${num}`, sx, (y0 + y1 + 1) / 2 + 0.6, { tam: 0.32 });
    if (quebrado) {
      B.obj("sangue", sx + 0.5, (y0 + y1) / 2);
      B.obj("vidros", qx, (y0 + y1) / 2);
      B.obj("rastro", portaX + 0.5, cima ? y1 - 0.5 : y0 + 1, { r: 90 });
    }
  };
  apto(1, 8, 1, 10, true, 201);
  apto(9, 15, 1, 10, true, 202);
  apto(20, 27, 1, 10, true, 203, true);
  apto(28, 34, 1, 10, true, 204);
  apto(1, 8, 15, 24, false, 205);
  apto(9, 15, 15, 24, false, 206);
  apto(20, 27, 15, 24, false, 207);
  apto(28, 34, 15, 24, false, 208);
  B.door("v", 1, 12, "portad");
  [6, 12, 24, 30].forEach(x => B.obj("luzteto", x, 12, { lr: 0.6 }));
  B.obj("luzbranca", 17.5, 12, { lr: 0.8 });
  B.txt("Hall do 2º andar", 17.5, 13.6, { tam: 0.34 });
  B.txt("Escadas", 17.5, 9.9, { tam: 0.3 });
  B.txt("Elevadores", 17.5, 21.4, { tam: 0.3 });
  const M = B.done();
  M.amb = "sombrio";
  return M;
}

/* Hospital: recepção, quartos, centro cirúrgico, UTI, necrotério, farmácia e capela */
function mbHospital() {
  const B = mbNovo(44, 32, "s");
  B.fill(1, 12, 42, 13, "g");
  B.fill(20, 1, 21, 30, "g");
  B.fill(1, 23, 42, 23, "g");
  B.wall("v", 1, 12, 2);
  B.wall("v", 43, 12, 2);
  B.wall("v", 1, 23, 1);
  B.wall("v", 43, 23, 1);
  B.wall("h", 20, 1, 2);
  B.wall("h", 20, 31, 2);
  // recepção
  B.room(22, 1, 42, 11, "B");
  B.door("h", 31, 1, "portad");
  B.door("h", 32, 1, "portad");
  B.door("v", 22, 6, "portad");
  B.door("h", 26, 12);
  B.door("h", 38, 12);
  B.obj("bancada", 32, 7, { v: 0, r: 180 });
  B.obj("giratoria", 32, 7.9);
  B.obj("monitor", 35.5, 7.8, { r: 180 });
  [
    [25, 4],
    [25, 6],
    [39, 4],
    [39, 6]
  ].forEach(([x, y]) => B.obj("esperacad", x, y));
  B.obj("planta", 22.6, 1.6);
  B.obj("planta", 42.4, 1.6);
  B.obj("bebedouro", 42.4, 10.4);
  B.obj("luzbranca", 32, 5, { lr: 1.3 });
  // quartos
  [
    [1, 6],
    [7, 12],
    [13, 19]
  ].forEach(([x0, x1], i) => {
    B.room(x0, 1, x1, 11, "v");
    const cx = (x0 + x1 + 1) / 2;
    B.door("h", Math.floor(cx), 12);
    B.obj("leito", cx - 1.2, 3, { v: 0 });
    B.obj("leito", cx + 1.2, 3, { v: 0 });
    B.obj("monitorcard", cx - 1.2, 1.5);
    B.obj("soro", cx + 2, 1.6);
    B.obj("cortina", cx, 5.2);
    B.obj("leito", cx - 1.2, 8, { v: 0, r: 180 });
    B.obj("criado", cx + 1.4, 9);
    B.obj("luzbranca", cx, 6, { lr: 0.8 });
    B.txt(`Quarto ${i + 1}`, cx, 10.6, { tam: 0.3 });
  });
  // centro cirúrgico e UTI
  B.room(22, 14, 32, 22, "a");
  B.room(33, 14, 42, 22, "v");
  B.door("h", 27, 14, "portad");
  B.door("h", 28, 14, "portad");
  B.door("h", 37, 14);
  B.obj("cirurgia", 27.5, 18);
  B.obj("luzgrande", 27.5, 18, { lr: 1.2 });
  B.obj("carrinho", 26, 17);
  B.obj("carrinho", 29, 19);
  B.obj("monitorcard", 29.5, 16.5);
  B.obj("bancadal", 24, 22.4, { r: 180 });
  B.obj("tanque", 31.5, 21.5);
  [34.5, 37.5, 40.5].forEach(x => {
    B.obj("leito", x, 16, { v: 0 });
    B.obj("monitorcard", x + 0.8, 15);
    B.obj("cortina", x + 1.5, 17.5, { r: 90 });
  });
  B.obj("luzbranca", 37.5, 19, { lr: 0.9 });
  // necrotério
  B.room(1, 14, 19, 22, "k");
  B.door("v", 20, 18, "portam");
  B.door("h", 10, 14, "portam");
  [2.5, 5.6, 8.7, 12.8, 15.9].forEach(x => B.obj("gavetas", x, 14.5));
  B.obj("autopsia", 6, 19);
  B.obj("corpo", 6, 19);
  B.obj("autopsia", 11, 19);
  B.obj("bancadal", 16.5, 22.4, { r: 180 });
  B.obj("carrinho", 8, 19);
  B.obj("sangue", 11.5, 20.5);
  B.obj("luzbranca", 8.5, 19, { lr: 0.6 });
  // ala de baixo
  B.room(1, 24, 10, 30, "B");
  B.room(11, 24, 19, 30, "c");
  B.room(22, 24, 30, 30, "o");
  B.room(31, 24, 42, 30, "y");
  B.door("h", 5, 24);
  B.door("h", 15, 24, "portam");
  B.door("h", 26, 24, "portad");
  B.door("h", 36, 24);
  B.obj("prateleira", 3.5, 24.5);
  B.obj("prateleira", 7.5, 24.5);
  B.obj("bancada", 5.5, 28, { v: 2 });
  B.obj("armario", 2, 30.7, { r: 180 });
  B.obj("caixas", 12.5, 29.5);
  B.obj("caixas", 13.7, 29.5);
  B.obj("maca", 17.5, 27);
  B.obj("rodas", 15, 28.5);
  B.obj("crucifixo", 26, 30.75, { r: 180 });
  [26.5, 28.5].forEach(y => B.obj("bancoigreja", 26, y, { r: 180 }));
  B.obj("velas", 23, 30);
  B.obj("velas", 29, 30);
  B.obj("sofa", 34, 30.4, { r: 180, v: 1 });
  B.obj("mesa", 39, 27.5, { v: 0 });
  B.obj("geladeira", 41.4, 24.6);
  B.obj("tv", 34, 24.3, { v: 1 });
  [5, 15, 26, 36].forEach(x => B.obj("luzteto", x, 27, { lr: 0.8 }));
  [5, 15, 30, 40].forEach(x => B.obj("luzteto", x, 12.5, { lr: 0.6 }));
  B.txt("Recepção", 32, 3.4);
  B.txt("Centro cirúrgico", 27.5, 21.2, { tam: 0.36 });
  B.txt("UTI", 37.5, 21.2);
  B.txt("Necrotério", 13, 20.6);
  B.txt("Farmácia", 5.5, 26.3, { tam: 0.34 });
  B.txt("Depósito", 15, 26, { tam: 0.34 });
  B.txt("Capela", 26, 25.6, { tam: 0.34 });
  B.txt("Descanso", 38, 29.6, { tam: 0.34 });
  const M = B.done();
  M.amb = "sombrio";
  return M;
}

/* Delegacia: celas, interrogatório, sala de investigação, evidências e arsenal trancados */
function mbDelegacia() {
  const B = mbNovo(40, 31, "s");
  B.fill(0, 26, 39, 30, "A");
  B.obj("viatura", 7, 28.5, { r: 90 });
  B.obj("viatura", 12, 28.5, { r: 90 });
  B.obj("carro", 31, 28.5, { r: 90, v: 1 });
  B.obj("poste", 2, 25.5);
  B.obj("poste", 37, 25.5);
  B.obj("lixeira", 26, 25.5);
  // corredor
  B.fill(1, 13, 38, 14, "g");
  B.wall("v", 1, 13, 2);
  B.wall("v", 39, 13, 2);
  // gabinete do delegado
  B.room(1, 1, 9, 12, "q");
  B.door("h", 5, 13);
  B.obj("escrivaninha", 5, 5, { r: 180 });
  B.obj("giratoria", 5, 4);
  B.obj("cadeira", 4.4, 6.2);
  B.obj("cadeira", 5.6, 6.2);
  B.obj("arquivo", 1.6, 1.4);
  B.obj("arquivo", 2.2, 1.4);
  B.obj("estante", 7.5, 1.3);
  B.obj("tapete", 5, 9.5, { v: 1 });
  B.obj("sofa", 5, 12.4, { r: 180, v: 1 });
  B.obj("planta", 9.6, 1.5);
  B.obj("luzteto", 5, 7, { lr: 0.7 });
  // sala de investigação
  B.room(10, 1, 22, 12, "y");
  B.door("h", 16, 13);
  B.obj("quadrop", 13, 1.3);
  B.obj("quadrop", 19, 1.3);
  [
    [12, 4.5],
    [12, 9],
    [20.5, 4.5],
    [20.5, 9]
  ].forEach(([x, y]) => {
    B.obj("escrivaninha", x, y, { r: 180 });
    B.obj("giratoria", x, y - 1);
  });
  B.obj("reuniao", 16, 7);
  B.obj("papeis", 16, 7);
  B.obj("arquivo", 22.2, 11.6);
  B.obj("arquivo", 22.2, 11);
  B.obj("luzteto", 16, 4, { lr: 0.7 });
  B.obj("luzteto", 16, 10, { lr: 0.7 });
  // interrogatório
  B.room(23, 1, 30, 12, "c");
  B.door("h", 26, 13, "portam");
  B.obj("mesainterr", 27, 6);
  B.obj("cadeira", 27, 4.9);
  B.obj("cadeira", 27, 7.1);
  B.obj("espelho", 27, 1.3);
  B.obj("respingos", 29, 9);
  // evidências (trancada)
  B.room(31, 1, 38, 12, "C");
  B.door("h", 34, 13, "portat");
  [2, 5.5, 9].forEach(y => {
    B.obj("evidencias", 33, y);
    B.obj("evidencias", 37, y);
  });
  B.obj("cofre", 38.6, 12.5);
  B.obj("caixas", 32, 12);
  B.obj("cristal", 35, 11.4);
  B.obj("lampada", 35, 7.2, { lr: 0.6 });
  // celas
  B.room(1, 15, 13, 23, "C");
  B.door("h", 7, 15, "portam");
  B.wall("h", 1, 19, 12, "grade");
  B.wall("v", 5, 19, 5);
  B.wall("v", 9, 19, 5);
  B.wall("v", 13, 19, 5);
  [1, 5, 9].forEach((x, i) => {
    B.door("h", x + 1, 19, "portaf");
    B.obj("beliche", x + 0.5, 21.5);
    B.obj("vaso", x + 3.5, 23.5);
    B.txt(`Cela ${i + 1}`, x + 2.6, 20, { tam: 0.26 });
  });
  B.obj("garras", 11.5, 22);
  B.obj("respingos", 10.5, 21);
  B.obj("mesa", 11, 16.3, { v: 0 });
  B.obj("cadeira", 11, 17.2);
  B.obj("banco", 4, 15.4);
  B.obj("luzteto", 7, 17, { lr: 0.8 });
  // recepção
  B.room(14, 15, 25, 23, "B");
  B.door("h", 19, 15, "portad");
  B.door("h", 20, 15, "portad");
  B.door("h", 19, 24, "portad");
  B.door("h", 20, 24, "portad");
  B.obj("balcaodp", 20, 18);
  B.obj("giratoria", 19.2, 17.2);
  B.obj("giratoria", 20.8, 17.2);
  B.obj("esperacad", 16, 21.5);
  B.obj("esperacad", 24, 21.5);
  B.obj("planta", 14.5, 15.5);
  B.obj("planta", 25.5, 15.5);
  B.obj("luzbranca", 20, 20, { lr: 1 });
  // copa
  B.room(26, 15, 31, 23, "k");
  B.door("h", 28, 15);
  B.obj("geladeira", 30.5, 15.6);
  B.obj("bancada", 27.6, 23.5, { r: 180 });
  B.obj("mesa", 28.5, 19.5, { v: 0 });
  B.obj("cadeira", 28, 20.4);
  B.obj("cadeira", 29, 18.6);
  B.obj("lixeira", 31.6, 22.6);
  // arsenal (trancado)
  B.room(32, 15, 38, 23, "c");
  B.door("h", 35, 15, "portat");
  B.obj("armas", 34, 23.7, { r: 180 });
  B.obj("armas", 37, 23.7, { r: 180 });
  B.obj("lockers", 38.7, 19, { r: 90 });
  B.obj("bancadaa", 35, 19.5);
  B.obj("municao", 33, 21.5);
  B.obj("lampada", 35, 17.5, { lr: 0.6 });
  [5, 16, 26, 34].forEach(x => B.obj("luzteto", x, 14, { lr: 0.6 }));
  B.txt("Gabinete do delegado", 5, 11.2, { tam: 0.32 });
  B.txt("Investigação", 16, 11.4, { tam: 0.36 });
  B.txt("Interrogatório", 27, 11.4, { tam: 0.32 });
  B.txt("Evidências", 34.8, 11.4, { tam: 0.32 });
  B.txt("Carceragem", 7, 18.4, { tam: 0.32 });
  B.txt("Recepção", 20, 22.6);
  B.txt("Copa", 28.5, 22.2, { tam: 0.3 });
  B.txt("Arsenal", 35, 22.4, { tam: 0.32 });
  const M = B.done();
  M.amb = "sombrio";
  return M;
}

/* Mansão antiga: hall com escadaria, salão, jantar, biblioteca, quartos, porão trancado e jardim com chafariz */
function mbMansao() {
  const B = mbNovo(44, 36, "G");
  // jardim e caminho
  B.fill(19, 26, 24, 35, "e");
  B.obj("chafariz", 21.5, 31);
  B.obj("arvoreg", 6, 30);
  B.obj("arvoreg", 31, 31);
  B.obj("morta", 13, 33);
  B.obj("arbusto", 16, 27.5);
  B.obj("arbusto", 27, 27.5);
  B.obj("anjo", 16, 31);
  B.obj("anjo", 27, 31);
  B.obj("poste", 18.5, 34.5);
  B.obj("poste", 24.5, 34.5);
  B.wall("h", 0, 35, 19, "grade");
  B.wall("h", 25, 35, 19, "grade");
  B.door("h", 19, 35, "portao");
  B.door("h", 20, 35, "portao");
  B.door("h", 23, 35, "portao");
  B.door("h", 24, 35, "portao");
  B.open("h", 21, 35);
  B.open("h", 22, 35);
  // hall
  B.room(16, 13, 27, 25, "o", "pedra");
  B.door("h", 21, 26, "portad");
  B.door("h", 22, 26, "portad");
  B.obj("tapete", 21.5, 21.5, { v: 0, r: 90 });
  B.obj("escadasobe", 21.5, 15.5, { v: 2 });
  B.obj("lustre", 21.5, 20);
  B.obj("armadura", 17, 14);
  B.obj("armadura", 26.5, 14);
  B.obj("relogio", 17, 24.7, { r: 180 });
  B.obj("anjo", 26.5, 24.5);
  B.obj("luzteto", 21.5, 20, { lr: 1.3 });
  // salão
  B.room(1, 13, 15, 25, "q", "pedra");
  B.door("v", 16, 19, "portad");
  B.door("v", 16, 20, "portad");
  B.obj("lareira", 8, 13.5);
  B.obj("poltrona", 6, 16, { v: 0 });
  B.obj("poltrona", 10, 16, { v: 0 });
  B.obj("tapete", 8, 17.5, { v: 2 });
  B.obj("sofa", 8, 19.5, { v: 0 });
  B.obj("piano", 3, 23.5, { r: 180 });
  B.obj("relogio", 14.5, 13.4);
  B.obj("lustre", 8, 18);
  B.obj("luzteto", 8, 17, { lr: 1 });
  B.door("h", 4, 26, "janela");
  B.door("h", 11, 26, "janela");
  // sala de jantar e cozinha
  B.room(28, 13, 42, 25, "m", "pedra");
  B.door("v", 28, 19, "portad");
  B.door("v", 28, 20, "portad");
  B.wall("v", 36, 13, 13, "pedra");
  B.door("v", 36, 22);
  B.obj("mesaj", 32, 18.5, { r: 90 });
  B.obj("lustre", 32, 18.5);
  B.obj("comoda", 32, 13.4);
  B.obj("luzteto", 32, 18.5, { lr: 1 });
  B.fill(36, 13, 42, 25, "x");
  B.obj("fogao", 41.5, 14);
  B.obj("bancada", 39, 13.6);
  B.obj("geladeira", 41.5, 18);
  B.obj("mesa", 39, 21.5, { v: 0 });
  B.obj("lampada", 39, 19, { lr: 0.6 });
  B.door("h", 38, 26);
  B.door("h", 33, 26, "janela");
  // andar de cima (ala dos quartos)
  B.fill(1, 10, 42, 12, "r");
  B.wall("v", 1, 10, 3, "pedra");
  B.wall("v", 43, 10, 3, "pedra");
  B.open("h", 21, 13);
  B.open("h", 22, 13);
  B.room(1, 1, 10, 9, "r", "pedra");
  B.room(11, 1, 20, 9, "n", "pedra");
  B.room(21, 1, 31, 9, "q", "pedra");
  B.room(32, 1, 42, 9, "u", "pedra");
  B.door("h", 5, 10);
  B.door("h", 15, 10);
  B.door("h", 26, 10);
  B.door("h", 37, 10, "portat");
  // quarto principal
  B.obj("dossel", 5.5, 3.5, { v: 0 });
  B.obj("criado", 3.6, 1.6);
  B.obj("criado", 7.4, 1.6);
  B.obj("guarda", 9.5, 7, { r: 270 });
  B.obj("lareira", 2, 6, { r: 90 });
  // quarto de hóspedes
  B.obj("cama", 13, 3, { v: 1 });
  B.obj("cama", 18, 3, { v: 1 });
  B.obj("comoda", 15.5, 1.3);
  B.obj("teia", 19.5, 8.5);
  // biblioteca
  B.obj("estantebib", 23.5, 1.6);
  B.obj("estantebib", 28.5, 1.6);
  B.obj("estantebib", 23.5, 5);
  B.obj("estantebib", 28.5, 5);
  B.obj("globo", 22, 8);
  B.obj("escrivaninha", 29, 8, { r: 180 });
  B.obj("livro", 29, 8);
  B.obj("velas", 26, 8);
  // quarto fechado (trancado): a filha que sumiu
  B.obj("cama", 34, 3, { v: 2 });
  B.obj("comoda", 37, 1.3);
  B.obj("espelho", 41, 1.3);
  B.obj("sigilo", 38.5, 6);
  B.obj("velas", 36, 7.5);
  B.obj("maos", 41, 5);
  B.obj("luzroxa", 38.5, 5.5, { lr: 0.7 });
  B.obj("luzteto", 10, 11, { lr: 0.6 });
  B.obj("luzteto", 34, 11, { lr: 0.6 });
  // porão (trancado) atrás da cozinha
  B.room(36, 27, 42, 34, "C", "pedra");
  B.door("h", 38, 27, "portat");
  B.obj("barril", 37, 33.5);
  B.obj("caixas", 41.5, 28);
  B.obj("circ_sangue", 39.5, 31);
  B.obj("corpo", 41.5, 32.5);
  B.obj("lampada", 39.5, 30, { lr: 0.5 });
  B.txt("Hall", 21.5, 24.6);
  B.txt("Salão", 8, 24.4);
  B.txt("Jantar", 32, 24.4);
  B.txt("Cozinha", 39.5, 24.4, { tam: 0.34 });
  B.txt("Quarto principal", 5.5, 8.6, { tam: 0.3 });
  B.txt("Hóspedes", 15.5, 8.6, { tam: 0.3 });
  B.txt("Biblioteca", 26, 9.3, { tam: 0.3 });
  B.txt("Quarto fechado", 37, 8.6, { tam: 0.3 });
  B.txt("Porão", 39, 34.4, { tam: 0.3 });
  B.txt("Galeria", 21.5, 11, { tam: 0.3 });
  const M = B.done();
  M.amb = "noite";
  return M;
}

/* Motel de beira de estrada: estacionamento, recepção, oito quartos, lavanderia e piscina vazia */
function mbMotel() {
  const B = mbNovo(44, 30, "A");
  B.fill(0, 26, 43, 29, "T");
  B.fill(0, 24, 43, 25, "s");
  // estrada
  B.fill(0, 27, 43, 29, "A");
  B.obj("carro", 25, 17, { v: 1 });
  B.obj("carro", 29, 17, { v: 4 });
  B.obj("van", 35, 17, { v: 0 });
  B.obj("poste", 1, 24.5);
  B.obj("poste", 42, 24.5);
  B.obj("neon", 3.5, 25);
  B.obj("cacamba", 41, 2);
  B.obj("lixo", 40, 4);
  // calçada coberta na frente dos quartos
  B.fill(1, 11, 41, 12, "s");
  // recepção
  B.room(1, 1, 7, 10, "k");
  B.door("h", 4, 11);
  B.door("h", 6, 11, "janela");
  B.obj("balcaodp", 4, 5);
  B.obj("giratoria", 4, 3.8);
  B.obj("vending", 1.6, 9.4);
  B.obj("esperacad", 5, 9.6);
  B.obj("quadro", 4, 1.3, { v: 1 });
  B.obj("luzbranca", 4, 6, { lr: 0.8 });
  // quartos
  for (let i = 0; i < 8; i++) {
    const x0 = 8 + i * 4,
      x1 = x0 + 3;
    B.room(x0, 1, x1, 10, i === 5 ? "J" : "y");
    B.door("h", x0 + 1, 11, i === 6 ? "portat" : i === 2 ? "portaq" : "porta");
    B.door("h", x0, 11, i === 2 ? "janelaq" : "janela");
    B.obj("camac", x0 + 2, 3, { v: i % 3 });
    B.obj("criado", x0 + 0.4, 1.5);
    B.obj("comoda", x0 + 1, 7.7, { r: 180 });
    // banheiro no canto
    B.wall("h", x0 + 2, 8, 2);
    B.wall("v", x0 + 2, 8, 3);
    B.door("v", x0 + 2, 9);
    B.obj("chuveiro", x0 + 3.5, 10.5);
    B.obj("vaso", x0 + 2.6, 8.5);
    B.txt(String(i + 1), x0 + 1, 10.3, { tam: 0.32 });
  }
  // quarto 3 revirado; quarto 6 é a cena do crime; quarto 7 trancado
  B.obj("vidros", 16.5, 10);
  B.obj("papeis", 17, 6);
  B.obj("sangue", 30, 4);
  B.obj("respingos", 31, 2);
  B.obj("corpo", 29, 6.5);
  B.obj("rastro", 29, 9.5, { r: 90 });
  B.obj("sigilo", 34, 5);
  B.obj("velas", 33, 9.5);
  B.obj("luzverm", 34, 5, { lr: 0.7 });
  // lavanderia e piscina
  B.room(1, 14, 9, 21, "c");
  B.door("h", 5, 14);
  B.obj("lavadora", 1.5, 16);
  B.obj("lavadora", 1.5, 17.2);
  B.obj("lavadora", 1.5, 18.4);
  B.obj("carrinholimp", 7.5, 17);
  B.obj("caixas", 2, 20.5);
  B.obj("lampada", 5, 18, { lr: 0.6 });
  B.fill(12, 14, 20, 18, "B");
  B.fill(13, 15, 19, 17, "c");
  B.obj("folhas", 16, 16);
  B.obj("sujeira", 14.5, 16);
  B.obj("cadeirapraia", 11.5, 14.5);
  B.obj("cadeirapraia", 20.5, 14.5);
  B.wall("h", 12, 14, 9, "cercaa");
  B.wall("h", 12, 19, 9, "cercaa");
  B.wall("v", 12, 14, 5, "cercaa");
  B.wall("v", 21, 14, 5, "cercaa");
  B.door("h", 16, 19, "portao");
  [6, 14, 22, 30, 38].forEach(x => B.obj("luzteto", x, 12, { lr: 0.6 }));
  B.txt("Recepção", 4, 7.6, { tam: 0.32 });
  B.txt("Lavanderia", 5, 20.6, { tam: 0.3 });
  B.txt("Piscina", 16, 18.4, { tam: 0.3 });
  const M = B.done();
  M.amb = "noite";
  return M;
}

/* Outro Lado: ilhas de realidade quebrada ligadas por pontes, com os quatro elementos e um portal */
function mbOutroLado() {
  const B = mbNovo(40, 32, "V");
  const ilha = (x0, y0, x1, y1, k) => {
    B.fill(x0, y0, x1, y1, k);
    B.set(x0, y0, "V");
    B.set(x1, y0, "V");
    B.set(x0, y1, "V");
    B.set(x1, y1, "V");
  };
  // centro: o portal
  ilha(15, 12, 24, 20, "R");
  B.obj("portal", 19.5, 16, { lr: 1 });
  B.obj("monolito", 16.5, 13.5);
  B.obj("monolito", 22.5, 13.5);
  B.obj("monolito", 16.5, 18.5);
  B.obj("monolito", 22.5, 18.5);
  // Sangue
  ilha(2, 2, 12, 10, "Z");
  B.wall("h", 3, 2, 8, "carne");
  B.wall("v", 2, 3, 6, "carne");
  B.obj("circ_sangue", 7, 6);
  B.obj("raizes", 4, 8);
  B.obj("raizes", 10, 4);
  B.obj("casulo", 11, 8.5);
  B.obj("sangue", 8.5, 9);
  B.obj("luzverm", 7, 6, { lr: 1.2 });
  // Morte
  ilha(27, 2, 37, 10, "X");
  B.wall("h", 28, 2, 8, "morte");
  B.wall("v", 38, 3, 6, "morte");
  B.obj("circ_morte", 32, 6);
  B.obj("ossos", 29, 8.5);
  B.obj("ossos", 35.5, 3.5);
  B.obj("morta", 35, 8.5);
  B.obj("cinzasd", 29.5, 4.5);
  B.obj("luzbranca", 32, 6, { lr: 1.1 });
  // Conhecimento
  ilha(2, 22, 12, 30, "Y");
  B.wall("h", 3, 31, 8, "pedra");
  B.obj("circ_conh", 7, 26);
  B.obj("estantebib", 4.5, 22.6);
  B.obj("livro", 10.5, 28.5);
  B.obj("olhos", 3.5, 28.5);
  B.obj("monolito", 10.5, 23.5);
  B.obj("luzteto", 7, 26, { lr: 1.2 });
  // Energia
  ilha(27, 22, 37, 30, "z");
  B.wall("v", 38, 23, 6, "energia");
  B.wall("h", 28, 31, 8, "energia");
  B.obj("circ_energia", 32, 26);
  B.obj("cristal", 29, 23.5);
  B.obj("cristal", 35.5, 28.5);
  B.obj("cristal", 29.5, 29);
  B.obj("fenda", 35, 24);
  B.obj("luzroxa", 32, 26, { lr: 1.2 });
  // pontes de pedra até o centro
  B.fill(12, 7, 16, 7, "L");
  B.fill(16, 7, 16, 11, "L");
  B.fill(23, 7, 27, 7, "L");
  B.fill(23, 7, 23, 11, "L");
  B.fill(12, 25, 16, 25, "L");
  B.fill(16, 21, 16, 25, "L");
  B.fill(23, 25, 27, 25, "L");
  B.fill(23, 21, 23, 25, "L");
  // Medo: o que sobra no meio do nada
  B.obj("tentaculos", 19.5, 4);
  B.obj("circ_medo", 19.5, 27.5);
  B.obj("olhos", 22, 29.5);
  B.obj("olhos", 17, 25.5);
  B.txt("Sangue", 7, 9.6, { tam: 0.34, cor: "#e06070" });
  B.txt("Morte", 32, 9.6, { tam: 0.34, cor: "#b8b8c0" });
  B.txt("Conhecimento", 7, 29.6, { tam: 0.32, cor: "#e6b43c" });
  B.txt("Energia", 32, 29.6, { tam: 0.34, cor: "#c08aff" });
  const M = B.done();
  M.amb = "noite";
  return M;
}

const MA_MODELOS = [
  { nome: "Em branco", desc: "Comece do zero, no tamanho que quiser.", vazio: true },
  {
    nome: "Base de Operações",
    desc: "Biblioteca com uma escada secreta até a base: laboratório, reunião, escritório, ritual, refeitório, bar, enfermaria, dormitórios, arsenal, contenção e treino.",
    fn: mbBase
  },
  {
    nome: "Base de Operações 2 (bunker)",
    desc: "Galpão de cargas num aeroporto com elevador para um bunker enorme: comando, briefing, arsenal, laboratório, enfermaria, ritual, contenção, interrogatório, treino e alojamento.",
    fn: mbBunker
  },
  { nome: "Casa abandonada", desc: "Casa de madeira com janelas quebradas, à noite.", fn: mbCasa },
  { nome: "Rua à noite", desc: "Rua com prédios, carros, viatura e uma praça.", fn: mbRua },
  { nome: "Floresta", desc: "Mata fechada com trilha, acampamento e lago.", fn: mbFloresta },
  { nome: "Galpão", desc: "Galpão industrial com contêineres e um escritório.", fn: mbGalpao },
  { nome: "Esgoto", desc: "Túnel com canal de água, pontes de grade e algo vivendo lá.", fn: mbEsgoto },
  {
    nome: "Cemitério à noite",
    desc: "Cemitério cercado com quadras de túmulos, cruzes, mausoléu e a casa do coveiro.",
    fn: mbCemiterio
  },
  {
    nome: "Paróquia",
    desc: "Igreja com bancos, altar e vitrais, sacristia e o salão do grupo de luto.",
    fn: mbIgreja
  },
  {
    nome: "Mercado",
    desc: "Mercado de bairro com gôndolas, caixas, freezers, depósito e estacionamento.",
    fn: mbMercado
  },
  {
    nome: "Estação de metrô",
    desc: "Duas plataformas, trilhos, vagões parados, catracas e bilheteria.",
    fn: mbMetro
  },
  {
    nome: "Escola",
    desc: "Três salas de aula, corredor com armários, secretaria, banheiros, biblioteca e pátio.",
    fn: mbEscola
  },
  { nome: "Fazenda", desc: "Casa de fazenda, celeiro com trator, curral, plantação e poço.", fn: mbFazenda },
  { nome: "Porto", desc: "Cais, píer, barcos, galpão de pesca e uma praia ao lado.", fn: mbPorto },
  {
    nome: "Prédio de apartamentos",
    desc: "Um andar com hall, escadas, elevadores e oito apartamentos (um arrombado).",
    fn: mbPredio
  },
  {
    nome: "Hospital",
    desc: "Recepção, quartos, centro cirúrgico, UTI, necrotério, farmácia, depósito e capela.",
    fn: mbHospital
  },
  {
    nome: "Delegacia",
    desc: "Recepção, celas, interrogatório, sala de investigação, gabinete, copa, e evidências e arsenal trancados.",
    fn: mbDelegacia
  },
  {
    nome: "Mansão antiga",
    desc: "Hall com escadaria, salão, jantar, cozinha, biblioteca, quartos (um trancado), porão trancado e jardim.",
    fn: mbMansao
  },
  {
    nome: "Motel de estrada",
    desc: "Letreiro neon, recepção, oito quartos (um revirado, um com a cena do crime, um trancado), lavanderia e piscina vazia.",
    fn: mbMotel
  },
  {
    nome: "Outro Lado",
    desc: "Ilhas de realidade quebrada sobre o vazio: Sangue, Morte, Conhecimento e Energia em volta de um portal.",
    fn: mbOutroLado
  },
  { nome: "Clareira do ritual", desc: "Clareira queimada com um círculo de Sangue no meio.", fn: mbClareira }
];
</script>
