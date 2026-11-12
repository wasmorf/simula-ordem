"use strict";
/* Criador de mapas: o editor (ferramentas, desfazer, virar cena). */
/* =====================================================================
   CRIADOR DE MAPAS — EDITOR
   ===================================================================== */
const ES = 48; // pixels por quadrado dentro do editor
const ME = {
  M: null,
  id: null,
  z: 1,
  ox: 0,
  oy: 0,
  tool: "piso",
  piso: "c",
  pincel: 1,
  parede: "ordem",
  abert: "porta",
  obj: "cama",
  objV: 0,
  objR: 0,
  cat: "Casa",
  busca: "",
  borr: "tudo",
  sel: new Set(),
  undo: [],
  redo: [],
  dirty: false,
  edges: new Map(),
  fc: null,
  wc: null,
  lc: null,
  luzPrev: true,
  hover: null,
  drag: null,
  raf: 0,
  txtCor: "#e9e4d8",
  txtTam: 0.5,
  side: true
};
const ME_TOOLS = [
  ["sel", "Selecionar e mover", "V", "M4 3l14 8-6 2-2 6z"],
  ["piso", "Pintar piso", "B", "M3 21l4-1 11-11-3-3L4 17zM14 6l3 3"],
  ["balde", "Balde (encher área)", "G", "M5 10l7-7 7 7-7 7zM19 15c0 2 2 3 2 5a2 2 0 01-4 0c0-2 2-3 2-5z"],
  ["sala", "Sala (piso + paredes)", "S", "M3 3h18v18H3zM3 9h6"],
  ["parede", "Parede", "W", "M3 12h18M3 8h18M3 16h18"],
  ["porta", "Porta e janela", "D", "M5 21V3h11v18M13 12h.01"],
  ["obj", "Objetos e decoração", "O", "M4 7l8-4 8 4-8 4zM4 7v10l8 4 8-4V7"],
  ["texto", "Texto (nome da sala)", "T", "M4 6V4h16v2M12 4v16M9 20h6"],
  ["borr", "Borracha", "E", "M7 21h10M5 15l9-9 5 5-9 9H8z"],
  [
    "mao",
    "Mover a vista",
    "H",
    "M7 11V5a1.5 1.5 0 013 0v5V4a1.5 1.5 0 013 0v6-4a1.5 1.5 0 013 0v8a7 7 0 01-14 0v-3a1.5 1.5 0 013 0"
  ]
];
function meIco(p) {
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${p}"/></svg>`;
}
function meNovo(w = 24, h = 16, piso = ".") {
  return {
    nome: "Novo mapa",
    w,
    h,
    chao: piso.repeat(w * h),
    paredes: [],
    objs: [],
    textos: [],
    amb: "sombrio",
    grade: true,
    acab: true,
    nx: 1
  };
}

/* ---------- cache dos desenhos ---------- */
function meSyncEdges() {
  ME.edges = new Map();
  for (const e of ME.M.paredes || []) {
    const i = e.split(",");
    ME.edges.set(i[0] + "," + i[1] + "," + i[2], i.slice(3).join(","));
  }
}
function meFlushEdges() {
  ME.M.paredes = [...ME.edges].map(([k, v]) => k + "," + v);
}
function meFloorAll() {
  const M = ME.M;
  ME.fc = document.createElement("canvas");
  ME.fc.width = M.w * ES;
  ME.fc.height = M.h * ES;
  const g = ME.fc.getContext("2d");
  g.fillStyle = "#040405";
  g.fillRect(0, 0, ME.fc.width, ME.fc.height);
  maDrawFloor(g, M, ES);
}
function meFloorArea(x0, y0, x1, y1) {
  const M = ME.M,
    g = ME.fc.getContext("2d");
  x0 = Math.max(0, x0 - 1);
  y0 = Math.max(0, y0 - 1);
  x1 = Math.min(M.w - 1, x1 + 1);
  y1 = Math.min(M.h - 1, y1 + 1);
  g.fillStyle = "#040405";
  g.fillRect(x0 * ES, y0 * ES, (x1 - x0 + 1) * ES, (y1 - y0 + 1) * ES);
  maDrawFloor(g, M, ES, [x0, y0, x1, y1]);
}
function meWalls() {
  meFlushEdges();
  const M = ME.M;
  ME.wc = document.createElement("canvas");
  ME.wc.width = M.w * ES + ES;
  ME.wc.height = M.h * ES + ES;
  const g = ME.wc.getContext("2d");
  g.translate(ES / 2, ES / 2);
  maDrawWalls(g, M, ES);
}
function meLights() {
  const M = ME.M;
  ME.lc = null;
  if (!ME.luzPrev) return;
  const A = MA_AMB[M.amb] || MA_AMB.sombrio;
  const has = (M.objs || []).some(o => MA_OBJ[o.t] && MA_OBJ[o.t].luz);
  if (!A.a && !has) return;
  ME.lc = document.createElement("canvas");
  ME.lc.width = M.w * ES;
  ME.lc.height = M.h * ES;
  maDrawLight(ME.lc.getContext("2d"), M, ES, { max: 0.62 });
}
function meAll() {
  meFloorAll();
  meWalls();
  meLights();
  meDraw();
}

/* ---------- desenho do editor ---------- */
function meDraw() {
  if (ME.raf) return;
  ME.raf = requestAnimationFrame(() => {
    ME.raf = 0;
    meDrawNow();
  });
}
function meDrawNow() {
  const cv = $("#meCv");
  if (!cv || !ME.M) return;
  const M = ME.M,
    dpr = window.devicePixelRatio || 1;
  const r = cv.parentElement.getBoundingClientRect();
  if (cv.width !== Math.round(r.width * dpr) || cv.height !== Math.round(r.height * dpr)) {
    cv.width = Math.round(r.width * dpr);
    cv.height = Math.round(r.height * dpr);
  }
  const g = cv.getContext("2d");
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = "#020203";
  g.fillRect(0, 0, cv.width, cv.height);
  g.setTransform(dpr * ME.z, 0, 0, dpr * ME.z, dpr * ME.ox, dpr * ME.oy);
  g.imageSmoothingQuality = "high";
  g.drawImage(ME.fc, 0, 0);
  maDrawObjs(g, M, ES, 0, { editor: true, sel: ME.sel });
  maGrid(g, M, ES, M.grade === false ? 0.06 : 0.13);
  g.drawImage(ME.wc, -ES / 2, -ES / 2);
  maDrawObjs(g, M, ES, 1, { editor: true, sel: ME.sel });
  maDrawObjs(g, M, ES, 2, { editor: true, sel: ME.sel });
  if (ME.lc) {
    g.drawImage(ME.lc, 0, 0);
  }
  maDrawTexts(g, M, ES);
  // seleção de textos
  (M.textos || []).forEach(t => {
    if (!ME.sel.has(t.id)) return;
    g.strokeStyle = "#b47dff";
    g.lineWidth = 2 / ME.z;
    g.setLineDash([6 / ME.z, 4 / ME.z]);
    const w = t.t.length * (t.tam || 0.5) * ES * 0.55,
      h = (t.tam || 0.5) * ES * 1.2;
    g.strokeRect(t.x * ES - w / 2, t.y * ES - h / 2, w, h);
    g.setLineDash([]);
  });
  g.strokeStyle = "rgba(180,125,255,.5)";
  g.lineWidth = 2 / ME.z;
  g.strokeRect(0, 0, M.w * ES, M.h * ES);
  // pré-visualização da ferramenta
  const H = ME.hover;
  if (H) {
    g.save();
    if (ME.tool === "piso" || ME.tool === "balde") {
      const n = ME.tool === "piso" ? ME.pincel : 1;
      const cx = Math.floor(H.x - (n - 1) / 2),
        cy = Math.floor(H.y - (n - 1) / 2);
      g.strokeStyle = "#fff";
      g.lineWidth = 2 / ME.z;
      g.strokeRect(cx * ES, cy * ES, n * ES, n * ES);
    }
    if (ME.tool === "obj") {
      const T = MA_OBJ[ME.obj];
      if (T) {
        const p = meSnap(H.x, H.y, T);
        g.globalAlpha = 0.65;
        g.translate(p.x * ES, p.y * ES);
        g.rotate((ME.objR * Math.PI) / 180);
        if (T.invis) {
          g.beginPath();
          g.arc(0, 0, ES * 0.2, 0, 7);
          g.fillStyle = T.luz.c;
          g.fill();
        } else {
          const sp = maSprite(T, ME.objV, ES, 7);
          g.drawImage(sp, (-T.w * ES) / 2 - sp.pad, (-T.h * ES) / 2 - sp.pad);
        }
      }
    }
    if (
      ME.tool === "porta" ||
      (ME.tool === "parede" && !ME.drag) ||
      (ME.tool === "borr" && ME.borr === "paredes")
    ) {
      const e = meEdgeAt(H.x, H.y);
      if (e) {
        const [o, x, y] = e.split(",").map((v, i) => (i ? +v : v));
        g.strokeStyle = "#b47dff";
        g.lineWidth = 6 / ME.z;
        g.beginPath();
        g.moveTo(x * ES, y * ES);
        g.lineTo((o === "h" ? x + 1 : x) * ES, (o === "h" ? y : y + 1) * ES);
        g.stroke();
      }
    }
    if (ME.tool === "borr" && ME.borr !== "paredes") {
      g.strokeStyle = "#ff4d5e";
      g.lineWidth = 2 / ME.z;
      g.strokeRect(Math.floor(H.x) * ES, Math.floor(H.y) * ES, ES, ES);
    }
    g.restore();
  }
  const D = ME.drag;
  if (D && D.kind === "sala") {
    const [x0, y0, x1, y1] = meRect(D);
    g.fillStyle = "rgba(180,125,255,.18)";
    g.fillRect(x0 * ES, y0 * ES, (x1 - x0 + 1) * ES, (y1 - y0 + 1) * ES);
    g.strokeStyle = "#b47dff";
    g.lineWidth = 3 / ME.z;
    g.strokeRect(x0 * ES, y0 * ES, (x1 - x0 + 1) * ES, (y1 - y0 + 1) * ES);
    g.font = `${14 / ME.z}px Inter,sans-serif`;
    g.fillStyle = "#fff";
    g.fillText(`${x1 - x0 + 1} × ${y1 - y0 + 1}`, x0 * ES + 4 / ME.z, y0 * ES - 6 / ME.z);
  }
  if (D && D.kind === "parede") {
    const v = meWallLine(D);
    g.strokeStyle = "#b47dff";
    g.lineWidth = 5 / ME.z;
    g.beginPath();
    g.moveTo(v[0] * ES, v[1] * ES);
    g.lineTo(v[2] * ES, v[3] * ES);
    g.stroke();
  }
  ocDesenharNoEditor(); // locais escondidos (mapa/locais)
}
function meRect(D) {
  return [Math.min(D.cx0, D.cx1), Math.min(D.cy0, D.cy1), Math.max(D.cx0, D.cx1), Math.max(D.cy0, D.cy1)];
}
function meWallLine(D) {
  const x0 = Math.round(D.mx0),
    y0 = Math.round(D.my0);
  let x1 = Math.round(D.mx1),
    y1 = Math.round(D.my1);
  if (Math.abs(x1 - x0) >= Math.abs(y1 - y0)) y1 = y0;
  else x1 = x0;
  return [x0, y0, x1, y1];
}
function meEdgeAt(mx, my) {
  const M = ME.M;
  const dx = Math.abs(mx - Math.round(mx)),
    dy = Math.abs(my - Math.round(my));
  if (Math.min(dx, dy) > 0.35) return null;
  if (dy < dx) {
    const x = Math.floor(mx),
      y = Math.round(my);
    if (x < 0 || x >= M.w || y < 0 || y > M.h) return null;
    return `h,${x},${y}`;
  }
  const x = Math.round(mx),
    y = Math.floor(my);
  if (y < 0 || y >= M.h || x < 0 || x > M.w) return null;
  return `v,${x},${y}`;
}
function meSnap(mx, my, T, free) {
  if (free) return { x: mx, y: my };
  const rot = Math.round((ME.objR || 0) / 90) % 2 !== 0;
  const w = rot ? T.h : T.w,
    h = rot ? T.w : T.h;
  const sx = w % 1 === 0 ? Math.round(mx - w / 2) + w / 2 : Math.round(mx * 2) / 2,
    sy = h % 1 === 0 ? Math.round(my - h / 2) + h / 2 : Math.round(my * 2) / 2;
  return { x: sx, y: sy };
}
function meObjAt(mx, my) {
  const L = [...(ME.M.objs || [])]
    .filter(o => MA_OBJ[o.t])
    .sort((a, b) => MA_OBJ[b.t].z - MA_OBJ[a.t].z || (b.n || 0) - (a.n || 0));
  for (const o of L) {
    const T = MA_OBJ[o.t];
    const e = o.e || 1;
    if (T.invis) {
      if (Math.hypot(mx - o.x, my - o.y) < 0.3) return o;
      continue;
    }
    const a = (-(o.r || 0) * Math.PI) / 180;
    const dx = mx - o.x,
      dy = my - o.y;
    const lx = (dx * Math.cos(a) - dy * Math.sin(a)) / e,
      ly = (dx * Math.sin(a) + dy * Math.cos(a)) / e;
    if (Math.abs(lx) <= T.w / 2 && Math.abs(ly) <= T.h / 2) return o;
  }
  return null;
}
function meTxtAt(mx, my) {
  for (const t of [...(ME.M.textos || [])].reverse()) {
    const w = t.t.length * (t.tam || 0.5) * 0.55,
      h = (t.tam || 0.5) * 1.2;
    if (Math.abs(mx - t.x) <= w / 2 && Math.abs(my - t.y) <= h / 2) return t;
  }
  return null;
}

/* ---------- desfazer ---------- */
function meSnapState() {
  meFlushEdges();
  const M = ME.M;
  return JSON.stringify({
    w: M.w,
    h: M.h,
    chao: M.chao,
    paredes: M.paredes,
    objs: M.objs,
    textos: M.textos,
    ocultos: M.ocultos || [] // locais escondidos (mapa/locais)
  });
}
function mePush() {
  ME.undo.push(meSnapState());
  if (ME.undo.length > 80) ME.undo.shift();
  ME.redo = [];
  ME.dirty = true;
  meTopState();
}
function meRestore(s) {
  Object.assign(ME.M, JSON.parse(s));
  meSyncEdges();
  ME.sel.clear();
  meAll();
  meSide();
  meTopState();
}
function meUndo() {
  if (!ME.undo.length) return;
  ME.redo.push(meSnapState());
  meRestore(ME.undo.pop());
  ME.dirty = true;
}
function meRedo() {
  if (!ME.redo.length) return;
  ME.undo.push(meSnapState());
  meRestore(ME.redo.pop());
  ME.dirty = true;
}

/* ---------- ações ---------- */
function meSetCell(x, y, k) {
  const M = ME.M;
  if (x < 0 || y < 0 || x >= M.w || y >= M.h) return false;
  const i = y * M.w + x;
  if (M.chao[i] === k) return false;
  M.chao = M.chao.slice(0, i) + k + M.chao.slice(i + 1);
  return true;
}
function mePaint(mx, my) {
  const n = ME.pincel;
  const cx = Math.floor(mx - (n - 1) / 2),
    cy = Math.floor(my - (n - 1) / 2);
  let ch = false;
  for (let y = cy; y < cy + n; y++) for (let x = cx; x < cx + n; x++) ch = meSetCell(x, y, ME.piso) || ch;
  if (ch) meFloorArea(cx, cy, cx + n - 1, cy + n - 1);
}
function meFill(mx, my) {
  const M = ME.M;
  const x = Math.floor(mx),
    y = Math.floor(my);
  if (x < 0 || y < 0 || x >= M.w || y >= M.h) return;
  const from = M.chao[y * M.w + x];
  if (from === ME.piso) return;
  mePush();
  const arr = M.chao.split("");
  const st = [[x, y]];
  let n = 0;
  while (st.length && n < 20000) {
    const [cx, cy] = st.pop();
    if (cx < 0 || cy < 0 || cx >= M.w || cy >= M.h) continue;
    const i = cy * M.w + cx;
    if (arr[i] !== from) continue;
    arr[i] = ME.piso;
    n++;
    // paredes param o balde
    if (!ME.edges.has(`v,${cx + 1},${cy}`)) st.push([cx + 1, cy]);
    if (!ME.edges.has(`v,${cx},${cy}`)) st.push([cx - 1, cy]);
    if (!ME.edges.has(`h,${cx},${cy + 1}`)) st.push([cx, cy + 1]);
    if (!ME.edges.has(`h,${cx},${cy}`)) st.push([cx, cy - 1]);
  }
  M.chao = arr.join("");
  meFloorAll();
  meDraw();
}
function meSala(D) {
  const [x0, y0, x1, y1] = meRect(D);
  const M = ME.M;
  mePush();
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) meSetCell(x, y, ME.piso);
  for (const k of [...ME.edges.keys()]) {
    const [o, a, b] = k.split(",");
    const ex = +a,
      ey = +b;
    if (o === "h" && ey > y0 && ey <= y1 && ex >= x0 && ex <= x1) ME.edges.delete(k);
    if (o === "v" && ex > x0 && ex <= x1 && ey >= y0 && ey <= y1) ME.edges.delete(k);
  }
  for (let x = x0; x <= x1; x++) {
    meSetEdge(`h,${x},${y0}`, ME.parede, true);
    meSetEdge(`h,${x},${y1 + 1}`, ME.parede, true);
  }
  for (let y = y0; y <= y1; y++) {
    meSetEdge(`v,${x0},${y}`, ME.parede, true);
    meSetEdge(`v,${x1 + 1},${y}`, ME.parede, true);
  }
  meFloorArea(x0, y0, x1, y1);
  meWalls();
  meDraw();
}
function meSetEdge(k, v, keepDoors) {
  const cur = ME.edges.get(k);
  if (keepDoors && cur && cur.startsWith("a:")) return;
  if (v == null) ME.edges.delete(k);
  else ME.edges.set(k, v);
}
function meParede(D) {
  const [x0, y0, x1, y1] = meWallLine(D);
  if (x0 === x1 && y0 === y1) return;
  mePush();
  const M = ME.M;
  if (y0 === y1) {
    for (let x = Math.min(x0, x1); x < Math.max(x0, x1); x++)
      if (x >= 0 && x < M.w && y0 >= 0 && y0 <= M.h) meSetEdge(`h,${x},${y0}`, ME.parede);
  } else {
    for (let y = Math.min(y0, y1); y < Math.max(y0, y1); y++)
      if (y >= 0 && y < M.h && x0 >= 0 && x0 <= M.w) meSetEdge(`v,${x0},${y}`, ME.parede);
  }
  meWalls();
  meDraw();
}
function mePorta(mx, my) {
  const k = meEdgeAt(mx, my);
  if (!k) return;
  mePush();
  const cur = ME.edges.get(k);
  let est = cur && !cur.startsWith("a:") ? cur : cur ? cur.split(":")[2] : ME.parede;
  ME.edges.set(k, `a:${ME.abert}:${est}`);
  meWalls();
  meDraw();
}
function mePlace(mx, my, free) {
  const T = MA_OBJ[ME.obj];
  if (!T) return;
  const p = meSnap(mx, my, T, free);
  const M = ME.M;
  if (p.x < 0 || p.y < 0 || p.x > M.w || p.y > M.h) return;
  mePush();
  const o = {
    id: rid(6),
    t: T.id,
    x: p.x,
    y: p.y,
    r: ME.objR || 0,
    seed: 1 + Math.floor(Math.random() * 999),
    n: (M.nx = (M.nx || 1) + 1)
  };
  if (ME.objV) o.v = ME.objV;
  M.objs.push(o);
  if (T.luz) meLights();
  meDraw();
}
function meErase(mx, my) {
  const M = ME.M;
  const m = ME.borr;
  if (m === "tudo" || m === "objetos") {
    const o = meObjAt(mx, my);
    if (o) {
      M.objs = M.objs.filter(x => x !== o);
      if (MA_OBJ[o.t].luz) meLights();
      meDraw();
      return true;
    }
    const t = meTxtAt(mx, my);
    if (t) {
      M.textos = M.textos.filter(x => x !== t);
      meDraw();
      return true;
    }
    if (m === "objetos") return false;
  }
  if (m === "tudo" || m === "paredes") {
    const k = meEdgeAt(mx, my);
    if (
      k &&
      ME.edges.has(k) &&
      (m === "paredes" || Math.min(Math.abs(mx - Math.round(mx)), Math.abs(my - Math.round(my))) < 0.2)
    ) {
      const cur = ME.edges.get(k);
      if (cur.startsWith("a:")) ME.edges.set(k, cur.split(":")[2]);
      else ME.edges.delete(k);
      meWalls();
      meDraw();
      return true;
    }
    if (m === "paredes") return false;
  }
  if (m === "tudo" || m === "piso") {
    const x = Math.floor(mx),
      y = Math.floor(my);
    if (meSetCell(x, y, ".")) {
      meFloorArea(x, y, x, y);
      meDraw();
      return true;
    }
  }
  return false;
}
async function meTexto(mx, my, t0) {
  const r = await formBox(
    t0 ? "Editar texto" : "Novo texto",
    `<div class="field"><label class="label" for="mtT">Texto</label><input type="text" id="mtT" name="t" maxlength="40" value="${esc(t0 ? t0.t : "")}" required></div>
  <div class="field"><label class="label" for="mtS">Tamanho</label><select id="mtS" name="tam">${[
    [0.3, "Pequeno"],
    [0.5, "Médio"],
    [0.8, "Grande"],
    [1.2, "Enorme"]
  ]
    .map(([v, n]) => `<option value="${v}" ${(t0 ? t0.tam : ME.txtTam) == v ? "selected" : ""}>${n}</option>`)
    .join("")}</select></div>
  <div class="field"><span class="label">Cor</span><div class="swatches">${["#e9e4d8", "#d3283b", "#b47dff", "#e0a03c", "#7ab0ff", "#111111"].map(c => `<label><input type="radio" name="cor" value="${c}" ${(t0 ? t0.cor : ME.txtCor) === c ? "checked" : ""}><span style="background:${c}"></span></label>`).join("")}</div></div>
  <label class="check"><input type="checkbox" name="serif" ${(t0 && t0.fonte === "serif") || !t0 ? "checked" : ""}> Letra de título (serifada)</label>`,
    t0 ? "Salvar" : "Pôr no mapa"
  );
  if (!r || !r.t.trim()) return;
  mePush();
  ME.txtCor = r.cor || ME.txtCor;
  ME.txtTam = +r.tam;
  if (t0)
    Object.assign(t0, { t: r.t.trim(), tam: +r.tam, cor: r.cor || t0.cor, fonte: r.serif ? "serif" : "" });
  else
    ME.M.textos.push({
      id: "t" + rid(5),
      t: r.t.trim(),
      x: Math.round(mx * 2) / 2,
      y: Math.round(my * 2) / 2,
      tam: +r.tam,
      cor: r.cor || ME.txtCor,
      fonte: r.serif ? "serif" : ""
    });
  meDraw();
}

/* ---------- entrada (mouse, toque, teclado) ---------- */
function meMap(e) {
  const r = $("#meCv").getBoundingClientRect();
  return { x: (e.clientX - r.left - ME.ox) / ME.z / ES, y: (e.clientY - r.top - ME.oy) / ME.z / ES };
}
function meZoomAt(f, px, py) {
  const z = Math.max(0.15, Math.min(4, ME.z * f));
  ME.ox = px - ((px - ME.ox) * z) / ME.z;
  ME.oy = py - ((py - ME.oy) * z) / ME.z;
  ME.z = z;
  meDraw();
}
function meFit() {
  const st = $("#meStage");
  if (!st || !ME.M) return;
  const r = st.getBoundingClientRect();
  const z = Math.min((r.width - 40) / (ME.M.w * ES), (r.height - 40) / (ME.M.h * ES));
  ME.z = Math.max(0.15, Math.min(2, z));
  ME.ox = (r.width - ME.M.w * ES * ME.z) / 2;
  ME.oy = (r.height - ME.M.h * ES * ME.z) / 2;
  meDraw();
}
function meBind() {
  const cv = $("#meCv");
  const pts = new Map();
  let pinch = null;
  cv.oncontextmenu = e => e.preventDefault();
  cv.onwheel = e => {
    e.preventDefault();
    const r = cv.getBoundingClientRect();
    if (e.ctrlKey || Math.abs(e.deltaY) >= Math.abs(e.deltaX))
      meZoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top);
    else {
      ME.ox -= e.deltaX;
      meDraw();
    }
  };
  const apertar = e => {
    cv.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
      ME.drag = null;
      return;
    }
    const m = meMap(e);
    const pan = e.button === 1 || e.button === 2 || ME.tool === "mao" || ME.space;
    if (pan) {
      ME.drag = { kind: "pan", x: e.clientX, y: e.clientY, ox: ME.ox, oy: ME.oy };
      return;
    }
    const T = ME.tool;
    if (T === "piso") {
      mePush();
      ME.drag = { kind: "piso" };
      mePaint(m.x, m.y);
      meDraw();
    } else if (T === "balde") meFill(m.x, m.y);
    else if (T === "sala") {
      const cx = Math.floor(m.x),
        cy = Math.floor(m.y);
      ME.drag = { kind: "sala", cx0: cx, cy0: cy, cx1: cx, cy1: cy };
      meDraw();
    } else if (T === "parede") ME.drag = { kind: "parede", mx0: m.x, my0: m.y, mx1: m.x, my1: m.y };
    else if (T === "porta") mePorta(m.x, m.y);
    else if (T === "obj") mePlace(m.x, m.y, e.altKey);
    else if (T === "texto") meTexto(m.x, m.y);
    else if (T === "borr") {
      mePush();
      ME.drag = { kind: "borr", any: meErase(m.x, m.y) };
      if (!ME.drag.any) ME.undo.pop();
    } else if (T === "sel") {
      const o = meObjAt(m.x, m.y) || meTxtAt(m.x, m.y);
      if (!o) {
        if (!e.shiftKey) ME.sel.clear();
        ME.drag = { kind: "pan", x: e.clientX, y: e.clientY, ox: ME.ox, oy: ME.oy };
        meSide();
        meDraw();
        return;
      }
      if (e.shiftKey) {
        ME.sel.has(o.id) ? ME.sel.delete(o.id) : ME.sel.add(o.id);
      } else if (!ME.sel.has(o.id)) {
        ME.sel.clear();
        ME.sel.add(o.id);
      }
      const items = [...ME.M.objs, ...ME.M.textos].filter(x => ME.sel.has(x.id));
      ME.drag = {
        kind: "move",
        m0: m,
        start: items.map(x => ({ x, ox: x.x, oy: x.y })),
        pushed: false,
        free: e.altKey
      };
      meSide();
      meDraw();
    }
  };
  const mover = e => {
    if (pts.has(e.pointerId)) pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pts.size === 2) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y),
        cx = (a.x + b.x) / 2,
        cy = (a.y + b.y) / 2;
      const r = cv.getBoundingClientRect();
      ME.ox += cx - pinch.cx;
      ME.oy += cy - pinch.cy;
      meZoomAt(d / pinch.d, cx - r.left, cy - r.top);
      pinch = { d, cx, cy };
      return;
    }
    const m = meMap(e);
    ME.hover = m;
    const D = ME.drag;
    if (!D) {
      meDraw();
      return;
    }
    if (D.kind === "pan") {
      ME.ox = D.ox + e.clientX - D.x;
      ME.oy = D.oy + e.clientY - D.y;
      meDraw();
    } else if (D.kind === "piso") {
      mePaint(m.x, m.y);
      meDraw();
    } else if (D.kind === "sala") {
      D.cx1 = Math.max(0, Math.min(ME.M.w - 1, Math.floor(m.x)));
      D.cy1 = Math.max(0, Math.min(ME.M.h - 1, Math.floor(m.y)));
      meDraw();
    } else if (D.kind === "parede") {
      D.mx1 = m.x;
      D.my1 = m.y;
      meDraw();
    } else if (D.kind === "borr") {
      if (meErase(m.x, m.y)) D.any = true;
    } else if (D.kind === "move") {
      let dx = m.x - D.m0.x,
        dy = m.y - D.m0.y;
      if (!D.free && !e.altKey) {
        dx = Math.round(dx * 2) / 2;
        dy = Math.round(dy * 2) / 2;
      }
      if (!dx && !dy && !D.pushed) return;
      if (!D.pushed) {
        D.pushed = true;
        ME.undo.push(
          JSON.stringify({
            ...JSON.parse(meSnapState()),
            objs: ME.M.objs.map(o => {
              const s = D.start.find(q => q.x === o);
              return s ? { ...o, x: s.ox, y: s.oy } : o;
            })
          })
        );
        ME.redo = [];
        ME.dirty = true;
        meTopState();
      }
      D.start.forEach(s => {
        s.x.x = s.ox + dx;
        s.x.y = s.oy + dy;
      });
      if (D.start.some(s => MA_OBJ[s.x.t] && MA_OBJ[s.x.t].luz)) meLights();
      meDraw();
    }
  };
  const soltar = e => {
    pts.delete(e.pointerId);
    if (pts.size < 2) pinch = null;
    const D = ME.drag;
    ME.drag = null;
    if (!D) return;
    if (D.kind === "sala") meSala(D);
    if (D.kind === "parede") meParede(D);
    if (D.kind === "borr" && !D.any) return;
    if (D.kind === "piso" || D.kind === "borr") {
      meLights();
      meDraw();
    }
  };
  // cada gesto passa também pela ferramenta "Esconder local" (mapa/locais)
  cv.onpointerdown = e => {
    apertar(e);
    ocApertar(e);
  };
  cv.onpointermove = e => {
    mover(e);
    ocMover(e);
  };
  cv.onpointerup = cv.onpointercancel = e => {
    const D = ME.drag; // soltar() limpa ME.drag; a ferramenta de esconder precisa dele
    soltar(e);
    ocSoltar(e, D);
  };
  cv.onpointerleave = () => {
    ME.hover = null;
    meDraw();
  };
  cv.ondblclick = e => {
    const m = meMap(e);
    const t = meTxtAt(m.x, m.y);
    if (t) meTexto(0, 0, t);
  };
}
function meKey(e) {
  if (!$("#mapEd")) return;
  if (e.target.closest("input,textarea,select") && e.key !== "Escape") return;
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === "z") {
    e.preventDefault();
    e.shiftKey ? meRedo() : meUndo();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && k === "y") {
    e.preventDefault();
    meRedo();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && k === "s") {
    e.preventDefault();
    meSalvar();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && k === "d") {
    e.preventDefault();
    meSelAcao("dup");
    return;
  }
  if (e.key === " ") {
    ME.space = true;
    e.preventDefault();
    return;
  }
  if (k === "delete" || k === "backspace") {
    if (ME.sel.size) {
      e.preventDefault();
      meSelAcao("del");
    }
    return;
  }
  if (k === "r") {
    if (ME.tool === "obj") {
      ME.objR = (ME.objR + (e.shiftKey ? 45 : 90)) % 360;
      meDraw();
    } else if (ME.sel.size) meSelAcao(e.shiftKey ? "r45" : "r90");
    return;
  }
  if (k === "escape") {
    ME.sel.clear();
    meSide();
    meDraw();
    return;
  }
  const t = ME_TOOLS.find(x => x[2].toLowerCase() === k);
  if (t && !e.ctrlKey && !e.metaKey) meSetTool(t[0]);
}
function meKeyUp(e) {
  if (e.key === " ") ME.space = false;
}

/* ---------- seleção ---------- */
function meSelItems() {
  return [...ME.M.objs.filter(o => ME.sel.has(o.id)), ...ME.M.textos.filter(t => ME.sel.has(t.id))];
}
function meSelAcao(a) {
  const L = meSelItems();
  if (!L.length) return;
  mePush();
  const M = ME.M;
  if (a === "del") {
    M.objs = M.objs.filter(o => !ME.sel.has(o.id));
    M.textos = M.textos.filter(t => !ME.sel.has(t.id));
    ME.sel.clear();
  }
  if (a === "r90" || a === "r45" || a === "rm")
    L.forEach(o => (o.r = ((((o.r || 0) + (a === "r90" ? 90 : a === "r45" ? 45 : -45)) % 360) + 360) % 360));
  if (a === "maior" || a === "menor")
    L.forEach(o => {
      if ("tam" in o) o.tam = Math.max(0.2, Math.min(2, o.tam * (a === "maior" ? 1.2 : 1 / 1.2)));
      else o.e = Math.max(0.3, Math.min(4, (o.e || 1) * (a === "maior" ? 1.15 : 1 / 1.15)));
    });
  if (a === "flip")
    L.forEach(o => {
      if (!("tam" in o)) o.f = !o.f;
    });
  if (a === "frente")
    L.forEach(o => {
      if (!("tam" in o)) o.n = M.nx = (M.nx || 1) + 1;
    });
  if (a === "tras")
    L.forEach(o => {
      if (!("tam" in o)) o.n = -(M.nx = (M.nx || 1) + 1);
    });
  if (a === "dup") {
    const novos = L.map(o => ({
      ...o,
      id: ("tam" in o ? "t" : "") + rid(6),
      x: o.x + 0.5,
      y: o.y + 0.5,
      n: (M.nx = (M.nx || 1) + 1)
    }));
    ME.sel.clear();
    novos.forEach(o => {
      ("tam" in o ? M.textos : M.objs).push(o);
      ME.sel.add(o.id);
    });
  }
  if (a === "luzm" || a === "luzM")
    L.forEach(o => {
      o.lr = Math.max(0.3, Math.min(4, (o.lr || 1) * (a === "luzM" ? 1.25 : 0.8)));
    });
  meLights();
  meSide();
  meDraw();
}

/* ---------- interface ---------- */
const ME_THUMB = {};
function meThumbPiso(k) {
  if (ME_THUMB["p" + k]) return ME_THUMB["p" + k];
  const c = document.createElement("canvas");
  c.width = c.height = 56;
  const g = c.getContext("2d");
  const M = { w: 2, h: 2, chao: k.repeat(4) };
  maDrawFloor(g, M, 28);
  return (ME_THUMB["p" + k] = c.toDataURL("image/jpeg", 0.8));
}
function meThumbParede(id) {
  if (ME_THUMB["w" + id]) return ME_THUMB["w" + id];
  const c = document.createElement("canvas");
  c.width = 72;
  c.height = 40;
  const g = c.getContext("2d");
  g.fillStyle = "#5b5e5d";
  g.fillRect(0, 0, 72, 40);
  const M = { w: 3, h: 2, chao: "cccccc", paredes: [`h,0,1,${id}`, `h,1,1,${id}`, `v,2,1,${id}`] };
  g.translate(0, -4);
  maDrawWalls(g, M, 24);
  return (ME_THUMB["w" + id] = c.toDataURL());
}
function meThumbAbert(id) {
  if (ME_THUMB["a" + id]) return ME_THUMB["a" + id];
  const c = document.createElement("canvas");
  c.width = 72;
  c.height = 48;
  const g = c.getContext("2d");
  g.fillStyle = "#5b5e5d";
  g.fillRect(0, 0, 72, 48);
  const M = { w: 3, h: 2, chao: "cccccc", paredes: ["h,0,1,ordem", `h,1,1,a:${id}:ordem`, "h,2,1,ordem"] };
  g.translate(0, -2);
  maDrawWalls(g, M, 24);
  return (ME_THUMB["a" + id] = c.toDataURL());
}
function meThumbObj(id, v = 0) {
  const key = "o" + id + "|" + v;
  if (ME_THUMB[key]) return ME_THUMB[key];
  const T = MA_OBJ[id];
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  if (T.invis) {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 30);
    gr.addColorStop(0, maA(T.luz.c, 0.9));
    gr.addColorStop(1, maA(T.luz.c, 0));
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
  } else {
    const s = Math.min(56 / T.w, 56 / T.h, 40);
    const sp = maSprite(T, v, Math.round(s), 3);
    g.drawImage(sp, 32 - sp.width / 2, 32 - sp.height / 2);
  }
  return (ME_THUMB[key] = c.toDataURL());
}
function meSetTool(t) {
  ME.tool = t;
  if (t !== "sel") {
    ME.sel.clear();
  }
  $$("#meTools [data-mt]").forEach(b => b.setAttribute("aria-pressed", b.dataset.mt === t));
  meSide();
  meDraw();
  const tips = {
    sel: "Clique num objeto para escolher. Arraste para mover. Shift+clique escolhe vários. Alt solta da grade. Delete apaga.",
    piso: "Clique e arraste para pintar o piso.",
    balde: "Clique numa área para encher com o piso escolhido. As paredes param o balde.",
    sala: "Arraste um retângulo: vira uma sala com piso e paredes em volta.",
    parede: "Arraste ao longo das linhas da grade para fazer uma parede reta.",
    porta: "Clique numa linha da grade (de preferência numa parede) para pôr a porta ou janela.",
    obj: "Clique no mapa para colocar. R gira antes de colocar. Alt solta da grade.",
    texto: "Clique onde vai o texto. Clique duas vezes num texto para editar.",
    borr: "Clique ou arraste sobre o que quer apagar.",
    mao: "Arraste para mover a vista. A rodinha do mouse dá zoom.",
    ocultar:
      "Clique numa sala para escondê-la (as paredes e portas limitam). Arraste para marcar um retângulo. Clique num local marcado para renomear ou desmarcar."
  };
  const h = $("#meHint");
  if (h) h.textContent = tips[t] || "";
}
function meTopState() {
  const u = $("#meUndo"),
    r = $("#meRedo"),
    s = $("#meSave");
  if (u) u.disabled = !ME.undo.length;
  if (r) r.disabled = !ME.redo.length;
  if (s) s.textContent = ME.dirty ? "Salvar •" : "Salvo";
}
function meSide() {
  if (ME.tool === "ocultar") return ocSide(); // painel da ferramenta "Esconder local" (mapa/locais)
  const el = $("#meSide");
  if (!el) return;
  const T = ME.tool;
  let h = "";
  const pisos = () => {
    const cats = [...new Set(MA_PISOS.map(p => p[3]))];
    return cats
      .map(
        c =>
          `<div class="sub">${c}</div><div class="me-grid">${MA_PISOS.filter(p => p[3] === c)
            .map(
              p =>
                `<button class="me-sw ${ME.piso === p[0] ? "on" : ""}" data-piso="${esc(p[0])}" title="${esc(p[2])}"><img src="${meThumbPiso(p[0])}" alt=""><span>${esc(p[2])}</span></button>`
            )
            .join("")}</div>`
      )
      .join("");
  };
  const paredes = () =>
    `<div class="me-grid w">${MA_PAREDES.map(p => `<button class="me-sw ${ME.parede === p.id ? "on" : ""}" data-parede="${p.id}"><img src="${meThumbParede(p.id)}" alt=""><span>${esc(p.nome)}</span></button>`).join("")}</div>`;
  if (T === "piso")
    h = `<div class="sub">Tamanho do pincel</div><div class="row">${[1, 2, 3, 5].map(n => `<button class="btn sm ${ME.pincel === n ? "primary" : ""}" data-pincel="${n}">${n}×${n}</button>`).join("")}</div>${pisos()}`;
  else if (T === "balde") h = pisos();
  else if (T === "sala")
    h = `<div class="sub">Parede da sala</div>${paredes()}<div class="sub">Piso da sala</div>${pisos()}`;
  else if (T === "parede") h = paredes();
  else if (T === "porta")
    h = `<div class="me-grid w">${MA_ABERTURAS.map(p => `<button class="me-sw ${ME.abert === p.id ? "on" : ""}" data-abert="${p.id}"><img src="${meThumbAbert(p.id)}" alt=""><span>${esc(p.nome)}</span></button>`).join("")}</div>`;
  else if (T === "obj") {
    const q = ME.busca.trim().toLowerCase();
    const lista = MA_OBJS.filter(o => (q ? o.nome.toLowerCase().includes(q) : o.cat === ME.cat));
    const O = MA_OBJ[ME.obj];
    h = `<input type="search" id="meBusca" placeholder="Buscar objeto (ex.: cama, sangue, carro)" value="${esc(ME.busca)}">
     <div class="me-cats">${MA_CATS.map(c => `<button class="chip ${!q && ME.cat === c ? "on" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}</div>
     ${
       O
         ? `<div class="me-cur"><img src="${meThumbObj(O.id, ME.objV)}" alt=""><div style="min-width:0"><b>${esc(O.nome)}</b><div class="muted small">${O.w}×${O.h} quadrados${O.luz ? " · ilumina" : ""}</div>
       <div class="row" style="margin-top:4px"><button class="btn sm" id="meGirar">Girar (R) ${ME.objR}°</button></div></div></div>
       ${O.cores ? `<div class="row" style="gap:6px">${O.cores.map((c, i) => `<button class="me-cor ${ME.objV === i ? "on" : ""}" data-objv="${i}" style="background:${c}" aria-label="Variação ${i + 1}"></button>`).join("")}</div>` : ""}`
         : ""
     }
     <div class="me-grid o">${lista.map(o => `<button class="me-sw ${ME.obj === o.id ? "on" : ""}" data-obj="${o.id}" title="${esc(o.nome)}"><img src="${meThumbObj(o.id)}" alt=""><span>${esc(o.nome)}</span></button>`).join("") || `<p class="muted small">Nada encontrado.</p>`}</div>`;
  } else if (T === "borr")
    h = `<div class="sub">Apagar</div>${[
      ["tudo", "O que estiver em cima"],
      ["objetos", "Só objetos e textos"],
      ["paredes", "Só paredes e portas"],
      ["piso", "Só o piso"]
    ]
      .map(
        ([v, n]) =>
          `<label class="check"><input type="radio" name="meBorr" value="${v}" ${ME.borr === v ? "checked" : ""}> ${n}</label>`
      )
      .join("")}`;
  else if (T === "texto")
    h = `<p class="muted small" style="margin:0">Use para dar nome às salas: "Enfermaria", "Arsenal", "Sala de ritual"…</p>`;
  else if (T === "mao")
    h = `<p class="muted small" style="margin:0">Também dá para mover a vista com o botão direito ou segurando a barra de espaço.</p>`;
  else if (T === "sel") {
    const L = meSelItems();
    if (!L.length) h = `<p class="muted small" style="margin:0">Clique num objeto ou texto do mapa.</p>`;
    else {
      const o = L[0];
      const ob = !("tam" in o) && MA_OBJ[o.t];
      h = `<div class="sub">${L.length > 1 ? L.length + " itens escolhidos" : esc(ob ? ob.nome : "Texto: " + o.t)}</div>
      <div class="me-acts"><button class="btn sm" data-sa="rm">↺ 45°</button><button class="btn sm" data-sa="r45">↻ 45°</button><button class="btn sm" data-sa="r90">↻ 90°</button><button class="btn sm" data-sa="flip">Espelhar</button>
      <button class="btn sm" data-sa="menor">Menor</button><button class="btn sm" data-sa="maior">Maior</button><button class="btn sm" data-sa="frente">Para frente</button><button class="btn sm" data-sa="tras">Para trás</button>
      ${L.some(x => MA_OBJ[x.t] && MA_OBJ[x.t].luz) ? `<button class="btn sm" data-sa="luzm">Luz menor</button><button class="btn sm" data-sa="luzM">Luz maior</button>` : ""}
      <button class="btn sm" data-sa="dup">Duplicar</button><button class="btn sm danger" data-sa="del">Apagar</button>${L.length === 1 && "tam" in o ? `<button class="btn sm" id="meEdTxt">Editar texto</button>` : ""}</div>
      ${ob && ob.cores && L.length === 1 ? `<div class="sub">Cor</div><div class="row" style="gap:6px">${ob.cores.map((c, i) => `<button class="me-cor ${(o.v || 0) === i ? "on" : ""}" data-selv="${i}" style="background:${c}"></button>`).join("")}</div>` : ""}`;
    }
  }
  el.innerHTML = `<div class="stack" style="gap:8px">${h}</div>`;
  $$("[data-piso]", el).forEach(
    b =>
      (b.onclick = () => {
        ME.piso = b.dataset.piso;
        meSide();
      })
  );
  $$("[data-pincel]", el).forEach(
    b =>
      (b.onclick = () => {
        ME.pincel = +b.dataset.pincel;
        meSide();
      })
  );
  $$("[data-parede]", el).forEach(
    b =>
      (b.onclick = () => {
        ME.parede = b.dataset.parede;
        meSide();
      })
  );
  $$("[data-abert]", el).forEach(
    b =>
      (b.onclick = () => {
        ME.abert = b.dataset.abert;
        meSide();
      })
  );
  $$("[data-cat]", el).forEach(
    b =>
      (b.onclick = () => {
        ME.cat = b.dataset.cat;
        ME.busca = "";
        meSide();
      })
  );
  $$("[data-obj]", el).forEach(
    b =>
      (b.onclick = () => {
        ME.obj = b.dataset.obj;
        ME.objV = 0;
        meSide();
      })
  );
  $$("[data-objv]", el).forEach(
    b =>
      (b.onclick = () => {
        ME.objV = +b.dataset.objv;
        meSide();
      })
  );
  $$("[data-sa]", el).forEach(b => (b.onclick = () => meSelAcao(b.dataset.sa)));
  $$("[data-selv]", el).forEach(
    b =>
      (b.onclick = () => {
        mePush();
        meSelItems().forEach(o => (o.v = +b.dataset.selv));
        meSide();
        meDraw();
      })
  );
  $$("[name=meBorr]", el).forEach(
    r =>
      (r.onchange = () => {
        ME.borr = r.value;
        meDraw();
      })
  );
  const bu = $("#meBusca", el);
  if (bu) {
    bu.oninput = () => {
      ME.busca = bu.value;
      const pos = bu.selectionStart;
      meSide();
      const nb = $("#meBusca");
      nb.focus();
      nb.setSelectionRange(pos, pos);
    };
  }
  const gi = $("#meGirar", el);
  if (gi)
    gi.onclick = () => {
      ME.objR = (ME.objR + 90) % 360;
      meSide();
      meDraw();
    };
  const et = $("#meEdTxt", el);
  if (et) et.onclick = () => meTexto(0, 0, meSelItems()[0]);
}
function meHTML() {
  const M = ME.M;
  return `<div id="mapEd" class="mapEd ${ME.side ? "" : "noside"}">
  <div class="me-top">
   <button class="btn sm ghost" id="meClose">✕ Fechar</button>
   <input type="text" id="meNome" value="${esc(M.nome)}" maxlength="50" aria-label="Nome do mapa">
   <span class="me-gap"></span>
   <button class="btn sm" id="meUndo" title="Desfazer (Ctrl+Z)">↶</button><button class="btn sm" id="meRedo" title="Refazer (Ctrl+Y)">↷</button>
   <select id="meAmb" aria-label="Iluminação">${Object.entries(MA_AMB)
     .map(([k, a]) => `<option value="${k}" ${M.amb === k ? "selected" : ""}>${esc(a.nome)}</option>`)
     .join("")}</select>
   <button class="btn sm" id="meMais">Mapa…</button>
   <button class="btn sm" id="meSave">Salvo</button>
   <button class="btn sm primary" id="meCena">${M.cenaId ? "Atualizar a cena" : "Usar como cena"}</button>
  </div>
  <div class="me-main">
   <div class="me-tools" id="meTools">${ME_TOOLS.map(([k, n, a, p]) => `<button class="tool" data-mt="${k}" aria-pressed="${ME.tool === k}" aria-label="${n}">${meIco(p)}<span class="tip">${n} (${a})</span></button>`).join("")}</div>
   <div class="me-stage" id="meStage"><canvas id="meCv"></canvas><div class="me-hint" id="meHint"></div>
    <div class="me-zoom"><button class="btn sm" id="meZm">−</button><button class="btn sm" id="meFit">Ajustar</button><button class="btn sm" id="meZp">+</button><button class="btn sm" id="meSideT">Painel</button></div></div>
   <aside class="me-side" id="meSide"></aside>
  </div></div>`;
}
async function meAbrir(M, id) {
  ME.M = JSON.parse(JSON.stringify(M));
  ME.M.objs = ME.M.objs || [];
  ME.M.textos = ME.M.textos || [];
  ME.M.paredes = ME.M.paredes || [];
  ME.id = id || "m" + rid(8);
  ME.undo = [];
  ME.redo = [];
  ME.dirty = !id;
  ME.sel = new Set();
  ME.side = window.innerWidth > 760;
  meSyncEdges();
  document.body.insertAdjacentHTML("beforeend", meHTML());
  document.body.classList.add("me-open");
  $("#meClose").onclick = meFechar;
  $("#meUndo").onclick = meUndo;
  $("#meRedo").onclick = meRedo;
  $("#meSave").onclick = meSalvar;
  $("#meCena").onclick = meUsarCena;
  $("#meMais").onclick = meConfig;
  $("#meNome").oninput = () => {
    ME.M.nome = $("#meNome").value;
    ME.dirty = true;
    meTopState();
  };
  $("#meAmb").onchange = () => {
    mePush();
    ME.M.amb = $("#meAmb").value;
    meLights();
    meDraw();
  };
  $("#meZm").onclick = () => {
    const r = $("#meStage").getBoundingClientRect();
    meZoomAt(1 / 1.25, r.width / 2, r.height / 2);
  };
  $("#meZp").onclick = () => {
    const r = $("#meStage").getBoundingClientRect();
    meZoomAt(1.25, r.width / 2, r.height / 2);
  };
  $("#meFit").onclick = meFit;
  $("#meSideT").onclick = () => {
    ME.side = !ME.side;
    $("#mapEd").classList.toggle("noside", !ME.side);
    setTimeout(meDraw, 30);
  };
  $$("#meTools [data-mt]").forEach(b => (b.onclick = () => meSetTool(b.dataset.mt)));
  document.addEventListener("keydown", meKey);
  document.addEventListener("keyup", meKeyUp);
  window.addEventListener("resize", meDraw);
  meBind();
  toast("Montando o mapa…");
  await new Promise(r => setTimeout(r, 30));
  meAll();
  meFit();
  meSetTool(ME.tool);
  meTopState();
}
async function meFechar() {
  if (ME.dirty) {
    const r = await formBox(
      "Fechar o mapa?",
      `<p style="margin:0">Há mudanças não salvas.</p><label class="check"><input type="checkbox" name="salvar" checked> Salvar antes de fechar</label>`,
      "Fechar"
    );
    if (!r) return;
    if (r.salvar) {
      if (!(await meSalvar())) return;
    }
  }
  document.removeEventListener("keydown", meKey);
  document.removeEventListener("keyup", meKeyUp);
  window.removeEventListener("resize", meDraw);
  const el = $("#mapEd");
  if (el) el.remove();
  document.body.classList.remove("me-open");
  ME.M = null;
  ME.fc = ME.wc = ME.lc = null;
  if (S.tool === "cenas") renderPanel();
}
async function meSalvar() {
  if (!S.isM) return false;
  meFlushEdges();
  const M = ME.M;
  const doc = { ...M, atualizado: Date.now() };
  try {
    await S.db.set(P() + "/mapas/" + ME.id, JSON.parse(JSON.stringify(doc)));
    ME.dirty = false;
    meTopState();
    toast("Mapa salvo.");
    return true;
  } catch (e) {
    fail(e);
    return false;
  }
}
async function meConfig() {
  const M = ME.M;
  const r = await formBox(
    "Configurar o mapa",
    `<div class="row" style="flex-wrap:nowrap"><div class="field" style="flex:1"><label class="label" for="mcW">Largura (quadrados)</label><input type="number" id="mcW" name="w" min="5" max="60" value="${M.w}"></div><div class="field" style="flex:1"><label class="label" for="mcH">Altura</label><input type="number" id="mcH" name="h" min="5" max="60" value="${M.h}"></div></div>
   <p class="muted small" style="margin:0">Aumentar acrescenta espaço à direita e embaixo. Diminuir corta desses lados.</p>
   <label class="check"><input type="checkbox" name="grade" ${M.grade !== false ? "checked" : ""}> Grade desenhada no mapa</label>
   <label class="check"><input type="checkbox" name="acab" ${M.acab !== false ? "checked" : ""}> Acabamento sombrio (grão e bordas escuras)</label>
   <label class="check"><input type="checkbox" name="luz" ${ME.luzPrev ? "checked" : ""}> Mostrar a iluminação enquanto edito</label>`,
    "Aplicar"
  );
  if (!r) return;
  const w = Math.max(5, Math.min(60, +r.w || M.w)),
    h = Math.max(5, Math.min(60, +r.h || M.h));
  mePush();
  if (w !== M.w || h !== M.h) {
    let ch = "";
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) ch += x < M.w && y < M.h ? M.chao[y * M.w + x] : ".";
    M.chao = ch;
    M.w = w;
    M.h = h;
    for (const k of [...ME.edges.keys()]) {
      const [o, a, b] = k.split(",");
      const x = +a,
        y = +b;
      if (o === "h" ? x >= w || y > h : y >= h || x > w) ME.edges.delete(k);
    }
    M.objs = M.objs.filter(o => o.x <= w && o.y <= h);
    M.textos = M.textos.filter(t => t.x <= w && t.y <= h);
  }
  M.grade = !!r.grade;
  M.acab = !!r.acab;
  ME.luzPrev = !!r.luz;
  meAll();
  meFit();
  ocAjustarAoTamanho(); // locais escondidos que saíram do mapa (mapa/locais)
}

/* ---------- virar cena ---------- */
async function maImagem(M) {
  let E = Math.max(28, Math.min(72, Math.floor(2600 / Math.max(M.w, M.h))));
  const LIMIT = 880000;
  for (let tries = 0; tries < 6; tries++) {
    const c = maRender(M, E);
    for (const q of [0.86, 0.76, 0.66, 0.56]) {
      let url = c.toDataURL("image/webp", q);
      if (!url.startsWith("data:image/webp")) url = c.toDataURL("image/jpeg", q);
      if (url.length <= LIMIT) return { url, w: c.width, h: c.height, tam: E };
    }
    E = Math.floor(E * 0.85);
  }
  throw new Error("grande");
}
async function meUsarCena() {
  if (!S.isM) return;
  const jaTinhaCena = !!(ME.M && ME.M.cenaId);
  meFlushEdges();
  const M = ME.M;
  const btn = $("#meCena");
  btn.disabled = true;
  btn.textContent = "Desenhando…";
  try {
    await new Promise(r => setTimeout(r, 30));
    // as portas saem da imagem e viram peças que abrem e fecham na mesa (mapa/portas)
    const pm = portasDoMapa(M);
    const img = await maImagem({ ...M, paredes: pm.paredes, textos: [] });
    const nomes = (M.textos || []).map(t => ({
      t: t.t,
      x: Math.round(t.x * img.tam),
      y: Math.round(t.y * img.tam),
      s: Math.round((t.tam || 0.5) * img.tam),
      cor: t.cor || "#e9e4d8",
      fonte: t.fonte || "",
      ...(t.r ? { r: t.r } : {})
    }));
    const thumb = await thumbOf(img.url);
    let sid = M.cenaId && S.cenas.find(c => c.id === M.cenaId) ? M.cenaId : null;
    if (sid) {
      const old = S.cenas.find(c => c.id === sid);
      await S.db.set(P() + "/cenaImg/" + sid, { url: img.url });
      if (old && old.tam && old.tam !== img.tam) {
        const k = img.tam / old.tam;
        const pos = await S.db.get(P() + "/pos/" + sid);
        if (pos && pos.tokens) {
          for (const t of Object.values(pos.tokens)) {
            t.x *= k;
            t.y *= k;
          }
          await S.db.set(P() + "/pos/" + sid, pos);
        }
      }
      const portas = portasEmPixels(pm.lista, img.tam, old && old.portas);
      const hid = new Set(((old && old.nomes) || []).filter(n => n.h).map(n => n.t));
      nomes.forEach(n => {
        if (hid.has(n.t)) n.h = true;
      });
      await S.db.merge(P() + "/cenas/" + sid, {
        nome: M.nome,
        thumb,
        w: img.w,
        h: img.h,
        tam: img.tam,
        nomes,
        portas,
        ver: Date.now()
      });
      S.sceneImg[sid] = img.url;
      toast("Cena atualizada para todos.");
    } else {
      sid = "c" + rid(8);
      await S.db.set(P() + "/cenaImg/" + sid, { url: img.url });
      await S.db.set(P() + "/cenas/" + sid, {
        nome: M.nome || "Mapa",
        thumb,
        w: img.w,
        h: img.h,
        grade: false,
        encaixe: true,
        tam: img.tam,
        nomes,
        portas: portasEmPixels(pm.lista, img.tam),
        nomesOn: true,
        mapaId: ME.id,
        ver: Date.now(),
        criada: Date.now()
      });
      S.sceneImg[sid] = img.url;
      M.cenaId = sid;
      toast("Cena criada. Abra Cenas para exibir aos jogadores.");
    }
    await meSalvar();
    $("#meCena").textContent = "Atualizar a cena";
  } catch (e) {
    if (e && e.message === "grande") toast("O mapa ficou grande demais. Diminua o tamanho em Mapa…");
    else fail(e);
  } finally {
    const b = $("#meCena");
    if (b) {
      b.disabled = false;
      if (b.textContent === "Desenhando…") b.textContent = M.cenaId ? "Atualizar a cena" : "Usar como cena";
    }
  }
  await ocSalvarNaCena(jaTinhaCena); // locais escondidos viram locais da cena (mapa/locais)
}

/* ---------- lista de mapas (painel Cenas) ---------- */
async function mapasHTMLload() {
  if (!S.isM) return;
  try {
    S.mapas = (await S.db.getCol(P() + "/mapas")).sort((a, b) => (b.atualizado || 0) - (a.atualizado || 0));
  } catch (e) {
    S.mapas = [];
  }
  const el = $("#mapasList");
  if (el) el.innerHTML = mapasLista();
}
function mapasLista() {
  const L = S.mapas || [];
  if (!L.length) return `<p class="muted small" style="margin:0">Nenhum mapa criado ainda.</p>`;
  return L.map(
    m => `<div class="scene"><div class="th" style="display:grid;place-items:center;font-size:11px;color:var(--muted)">${m.w}×${m.h}</div><div class="stack" style="gap:4px;min-width:0"><div class="nm">${esc(m.nome || "Mapa")}</div><div class="st">${m.cenaId ? "Ligado a uma cena" : "Ainda não virou cena"}</div>
   <div class="row"><button class="btn sm primary" data-medit="${esc(m.id)}">Editar</button><button class="btn sm ghost" data-mdup="${esc(m.id)}">Duplicar</button><button class="btn sm ghost" data-mcopy="${esc(m.id)}">Copiar p/ outra mesa</button><button class="btn sm ghost" data-mdel="${esc(m.id)}" aria-label="Apagar mapa">✕</button></div></div></div>`
  ).join("");
}
function bindMapas() {
  const el = $("#mapasBox");
  if (!el) return;
  el.addEventListener("click", e => {
    const b = e.target.closest("[data-mcopy]");
    if (b) copiarMapa(b.dataset.mcopy); // documentos/no-mapa
  });
  $("#btnCriarMapa").onclick = escolherModelo;
  el.addEventListener("click", async e => {
    const b = e.target.closest("[data-medit],[data-mdup],[data-mdel]");
    if (!b) return;
    const m = (S.mapas || []).find(x => x.id === (b.dataset.medit || b.dataset.mdup || b.dataset.mdel));
    if (!m) return;
    if (b.dataset.medit) {
      const { id, ...M } = m;
      meAbrir(M, id);
    }
    if (b.dataset.mdup) {
      const { id, cenaId, ...M } = m;
      M.nome = (M.nome || "Mapa") + " (cópia)";
      meAbrir(M);
    }
    if (b.dataset.mdel) {
      if (!(await confirmBox(`Apagar o mapa "${m.nome}"?`, "A cena feita com ele continua existindo.")))
        return;
      try {
        await S.db.del(P() + "/mapas/" + m.id);
        mapasHTMLload();
      } catch (er) {
        fail(er);
      }
    }
  });
  mapasHTMLload();
}
async function escolherModelo() {
  const h = $("#modalHost");
  const L = MA_MODELOS;
  h.innerHTML = `<div class="modal-back"><div class="modal wide" role="dialog" aria-label="Novo mapa"><h3>Novo mapa</h3>
   <div class="me-models">${L.map((m, i) => `<button class="me-model" data-mod="${i}"><canvas width="440" height="280" data-mprev="${i}"></canvas><b>${esc(m.nome)}</b><span class="muted small">${esc(m.desc)}</span></button>`).join("")}</div>
   <div class="row" style="justify-content:flex-end"><button class="btn" id="mmNo">Cancelar</button></div></div></div>`;
  $("#mmNo").onclick = () => (h.innerHTML = "");
  $$("[data-mod]").forEach(
    b =>
      (b.onclick = async () => {
        const m = L[+b.dataset.mod];
        h.innerHTML = "";
        let M;
        if (m.vazio) {
          const r = await formBox(
            "Mapa em branco",
            `<div class="row" style="flex-wrap:nowrap"><div class="field" style="flex:1"><label class="label" for="nbW">Largura</label><input type="number" id="nbW" name="w" min="5" max="60" value="24"></div><div class="field" style="flex:1"><label class="label" for="nbH">Altura</label><input type="number" id="nbH" name="h" min="5" max="60" value="16"></div></div>
      <div class="field"><label class="label" for="nbP">Começar com o chão</label><select id="nbP" name="p">${MA_PISOS.map(p => `<option value="${esc(p[0])}">${esc(p[2])}</option>`).join("")}</select></div>`,
            "Criar"
          );
          if (!r) return;
          M = meNovo(
            Math.max(5, Math.min(60, +r.w || 24)),
            Math.max(5, Math.min(60, +r.h || 16)),
            r.p || "."
          );
        } else M = m.fn();
        M.nome = m.vazio ? "Novo mapa" : m.nome;
        meAbrir(M);
      })
  );
  // prévias pequenas
  setTimeout(() => {
    $$("[data-mprev]").forEach(c => {
      const m = L[+c.dataset.mprev];
      const g = c.getContext("2d");
      g.fillStyle = "#040405";
      g.fillRect(0, 0, c.width, c.height);
      if (m.vazio) {
        g.strokeStyle = "#3a3046";
        g.setLineDash([6, 6]);
        g.strokeRect(40, 40, 360, 200);
        g.fillStyle = "#8a809a";
        g.font = "28px Inter,sans-serif";
        g.textAlign = "center";
        g.fillText("Do zero", 220, 150);
        return;
      }
      if (!m._prev) {
        const M = m.fn();
        const s = Math.max(4, Math.floor(Math.min(440 / M.w, 280 / M.h)));
        m._prev = maRender({ ...M, acab: false, grade: false }, s);
      }
      const p = m._prev;
      const k = Math.min(c.width / p.width, c.height / p.height);
      g.drawImage(p, (c.width - p.width * k) / 2, (c.height - p.height * k) / 2, p.width * k, p.height * k);
    });
  }, 40);
}
