<script>
"use strict";
/* =====================================================================
   LOCAIS ESCONDIDOS
   No criador de mapas o mestre marca salas/áreas. Na cena elas ficam
   pretas para os jogadores até o mestre revelar (painel "Locais").
   Mapa: M.ocultos=[{id,nome,r:[x,y,w,h,...]}]  (em quadrados)
   Cena: sc.locais=[{id,nome,aberto,r:[x,y,w,h,...]}] (em pixels)
   (listas planas: o Firestore não aceita lista dentro de lista)
   ===================================================================== */
const OC_ICO =
  "M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6A17 17 0 0 0 2 12s4 7 10 7a9.6 9.6 0 0 0 5.4-1.6";
{
  const i = ME_TOOLS.findIndex(t => t[0] === "borr");
  ME_TOOLS.splice(i < 0 ? ME_TOOLS.length : i, 0, ["ocultar", "Esconder local", "X", OC_ICO]);
}

/* ---------- geometria ---------- */
function ocRects(r) {
  const L = [];
  for (let i = 0; i + 3 < (r || []).length; i += 4) L.push([r[i], r[i + 1], r[i + 2], r[i + 3]]);
  return L;
}
function ocCells(a) {
  const s = new Set();
  ocRects(a.r).forEach(([x, y, w, h]) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) s.add(i + "," + j);
  });
  return s;
}
function ocDeCells(set) {
  // junta as células em retângulos (faixas por linha, depois empilha as iguais)
  const rows = {};
  set.forEach(k => {
    const [x, y] = k.split(",").map(Number);
    (rows[y] = rows[y] || []).push(x);
  });
  const runs = [];
  Object.keys(rows)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach(y => {
      const xs = rows[y].sort((a, b) => a - b);
      let s = xs[0],
        p = xs[0];
      for (let i = 1; i <= xs.length; i++) {
        if (i < xs.length && xs[i] === p + 1) {
          p = xs[i];
          continue;
        }
        runs.push({ x: s, y, w: p - s + 1, h: 1 });
        if (i < xs.length) {
          s = p = xs[i];
        }
      }
    });
  const out = [];
  runs.forEach(r => {
    const up = out.find(o => o.x === r.x && o.w === r.w && o.y + o.h === r.y);
    if (up) up.h++;
    else out.push({ ...r });
  });
  return out.flatMap(o => [o.x, o.y, o.w, o.h]);
}
function ocAreaEm(cx, cy) {
  return (ME.M.ocultos || []).find(a => ocCells(a).has(cx + "," + cy));
}
function ocFlood(x, y) {
  const M = ME.M;
  if (x < 0 || y < 0 || x >= M.w || y >= M.h || M.chao[y * M.w + x] === ".") return null;
  meFlushEdges();
  const vis = new Set(),
    st = [[x, y]];
  while (st.length && vis.size < 4000) {
    const [cx, cy] = st.pop();
    const k = cx + "," + cy;
    if (vis.has(k) || cx < 0 || cy < 0 || cx >= M.w || cy >= M.h) continue;
    if (M.chao[cy * M.w + cx] === ".") continue;
    vis.add(k);
    if (!ME.edges.has(`v,${cx + 1},${cy}`)) st.push([cx + 1, cy]);
    if (!ME.edges.has(`v,${cx},${cy}`)) st.push([cx - 1, cy]);
    if (!ME.edges.has(`h,${cx},${cy + 1}`)) st.push([cx, cy + 1]);
    if (!ME.edges.has(`h,${cx},${cy}`)) st.push([cx, cy - 1]);
  }
  return vis;
}
function ocNomeDe(set) {
  const t = (ME.M.textos || []).find(
    t =>
      set.has(Math.floor(t.x) + "," + Math.floor(t.y)) ||
      set.has(Math.floor(t.x - 0.01) + "," + Math.floor(t.y - 0.01))
  );
  return t ? t.t : "Local " + ((ME.M.ocultos || []).length + 1);
}
function ocAdd(set, nome) {
  if (!set || !set.size) return;
  mePush();
  const M = ME.M;
  M.ocultos = M.ocultos || [];
  // uma célula só pertence a um local: tira das áreas antigas
  M.ocultos.forEach(a => {
    const c = ocCells(a);
    let mud = false;
    set.forEach(k => {
      if (c.delete(k)) mud = true;
    });
    if (mud) a.r = ocDeCells(c);
  });
  M.ocultos = M.ocultos.filter(a => a.r.length);
  M.ocultos.push({ id: "l" + rid(6), nome: nome || ocNomeDe(set), r: ocDeCells(set) });
  meSide();
  meDraw();
}
function ocTodasComNome() {
  const M = ME.M;
  const floor = [...M.chao].filter(c => c !== ".").length;
  let n = 0,
    pul = [];
  const ja = new Set();
  (M.ocultos || []).forEach(a => ocCells(a).forEach(k => ja.add(k)));
  const novos = [];
  for (const t of M.textos || []) {
    const set =
      ocFlood(Math.floor(t.x), Math.floor(t.y)) || ocFlood(Math.floor(t.x - 0.01), Math.floor(t.y - 0.01));
    if (!set || [...set].some(k => ja.has(k))) continue;
    if (set.size > floor * 0.6) {
      pul.push(t.t);
      continue;
    }
    set.forEach(k => ja.add(k));
    novos.push({ id: "l" + rid(6), nome: t.t, r: ocDeCells(set) });
    n++;
  }
  if (!novos.length) {
    toast(
      pul.length
        ? "As salas com nome não têm paredes fechando. Marque arrastando um retângulo."
        : "Nenhuma sala com nome nova para esconder."
    );
    return;
  }
  mePush();
  M.ocultos = [...(M.ocultos || []), ...novos];
  meSide();
  meDraw();
  toast(
    `${n} sala(s) marcada(s) para ficar escondida(s).` +
      (pul.length ? ` Não deu em: ${pul.join(", ")} (sem parede fechando).` : "")
  );
}
async function ocEditar(a) {
  const r = await formBox(
    "Local escondido",
    `<div class="field"><label class="label" for="ocN">Nome (só o mestre vê)</label><input type="text" id="ocN" name="nome" maxlength="40" value="${esc(a.nome)}"></div>
  <label class="check"><input type="checkbox" name="tirar"> Não esconder mais este local</label>`,
    "Salvar"
  );
  if (!r) return;
  mePush();
  if (r.tirar) ME.M.ocultos = ME.M.ocultos.filter(x => x !== a);
  else a.nome = r.nome.trim() || a.nome;
  meSide();
  meDraw();
}

/* ---------- editor: desenho, entrada, painel ---------- */
{
  const _d = meDrawNow;
  meDrawNow = function () {
    _d();
    const cv = $("#meCv");
    if (!cv || !ME.M) return;
    const L = ME.M.ocultos || [];
    const D = ME.drag;
    if (!L.length && !(D && D.kind === "ocultar")) return;
    const g = cv.getContext("2d"),
      dpr = window.devicePixelRatio || 1;
    g.save();
    g.setTransform(dpr * ME.z, 0, 0, dpr * ME.z, dpr * ME.ox, dpr * ME.oy);
    const on = ME.tool === "ocultar";
    L.forEach(a => {
      const R = ocRects(a.r);
      g.fillStyle = on ? "rgba(6,4,10,.72)" : "rgba(6,4,10,.38)";
      R.forEach(([x, y, w, h]) => g.fillRect(x * ES, y * ES, w * ES, h * ES));
      if (on) {
        g.strokeStyle = "rgba(211,40,59,.9)";
        g.lineWidth = 2 / ME.z;
        g.setLineDash([8 / ME.z, 5 / ME.z]);
        R.forEach(([x, y, w, h]) => g.strokeRect(x * ES, y * ES, w * ES, h * ES));
        g.setLineDash([]);
      }
      const b = R.reduce((m, [x, y, w, h]) => (w * h > m[2] * m[3] ? [x, y, w, h] : m), [0, 0, 0, 0]);
      const fs = Math.max(11, Math.min(22, ES * 0.42));
      g.font = `700 ${fs}px Inter,sans-serif`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      const tx = (b[0] + b[2] / 2) * ES,
        ty = (b[1] + b[3] / 2) * ES;
      g.fillStyle = "rgba(0,0,0,.6)";
      const tw = g.measureText("◼ " + a.nome).width + 14;
      g.fillRect(tx - tw / 2, ty - fs * 0.8, tw, fs * 1.6);
      g.fillStyle = on ? "#ff8090" : "rgba(255,255,255,.75)";
      g.fillText("◼ " + a.nome, tx, ty);
    });
    if (D && D.kind === "ocultar") {
      const [x0, y0, x1, y1] = meRect(D);
      g.fillStyle = "rgba(211,40,59,.22)";
      g.fillRect(x0 * ES, y0 * ES, (x1 - x0 + 1) * ES, (y1 - y0 + 1) * ES);
      g.strokeStyle = "#d3283b";
      g.lineWidth = 3 / ME.z;
      g.strokeRect(x0 * ES, y0 * ES, (x1 - x0 + 1) * ES, (y1 - y0 + 1) * ES);
    } else if (on && ME.hover) {
      const x = Math.floor(ME.hover.x),
        y = Math.floor(ME.hover.y);
      g.strokeStyle = "#d3283b";
      g.lineWidth = 2 / ME.z;
      g.strokeRect(x * ES, y * ES, ES, ES);
    }
    g.restore();
  };
}
{
  const _b = meBind;
  meBind = function () {
    _b();
    const cv = $("#meCv");
    const pd = cv.onpointerdown,
      pm = cv.onpointermove,
      pu = cv.onpointerup;
    cv.onpointerdown = e => {
      pd(e);
      if (ME.tool === "ocultar" && !ME.drag && e.button === 0 && e.isPrimary && !ME.space) {
        const m = meMap(e);
        const cx = Math.floor(m.x),
          cy = Math.floor(m.y);
        ME.drag = { kind: "ocultar", cx0: cx, cy0: cy, cx1: cx, cy1: cy };
        meDraw();
      }
    };
    cv.onpointermove = e => {
      pm(e);
      const D = ME.drag;
      if (D && D.kind === "ocultar") {
        const m = meMap(e);
        D.cx1 = Math.max(0, Math.min(ME.M.w - 1, Math.floor(m.x)));
        D.cy1 = Math.max(0, Math.min(ME.M.h - 1, Math.floor(m.y)));
        meDraw();
      }
    };
    cv.onpointerup = cv.onpointercancel = e => {
      const D = ME.drag;
      pu(e);
      if (!D || D.kind !== "ocultar" || e.type === "pointercancel") return;
      const [x0, y0, x1, y1] = meRect(D);
      if (x0 === x1 && y0 === y1) {
        const a = ocAreaEm(x0, y0);
        if (a) {
          ocEditar(a);
          return;
        }
        const set = ocFlood(x0, y0);
        if (!set) {
          toast("Clique dentro de uma sala (num quadrado com piso) ou arraste um retângulo.");
          return;
        }
        const floor = [...ME.M.chao].filter(c => c !== ".").length;
        if (set.size > floor * 0.6 && floor > 40) {
          toast(
            "Essa sala não tem parede fechando e pegaria o mapa quase todo. Arraste um retângulo em volta dela."
          );
          return;
        }
        ocAdd(set);
        return;
      }
      const set = new Set();
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set.add(x + "," + y);
      ocAdd(set, ocNomeDe(set));
    };
  };
}
{
  const _s = meSnapState;
  meSnapState = function () {
    const o = JSON.parse(_s());
    o.ocultos = JSON.parse(JSON.stringify(ME.M.ocultos || []));
    return JSON.stringify(o);
  };
}
{
  const _st = meSetTool;
  meSetTool = function (t) {
    _st(t);
    if (t === "ocultar") {
      const h = $("#meHint");
      if (h)
        h.textContent =
          "Clique numa sala para escondê-la (as paredes e portas limitam). Arraste para marcar um retângulo. Clique num local marcado para renomear ou desmarcar.";
    }
  };
}
{
  const _sd = meSide;
  meSide = function () {
    if (ME.tool !== "ocultar") return _sd();
    const el = $("#meSide");
    if (!el) return;
    const L = ME.M.ocultos || [];
    el.innerHTML = `<div class="stack" style="gap:8px"><p class="muted small" style="margin:0">Locais marcados aqui ficam <b>pretos para os jogadores</b> quando o mapa vira cena. Na mesa, você revela cada um pelo botão <b>Locais</b> da barrinha do mapa.</p>
   <button class="btn sm" id="ocTodas">Esconder todas as salas com nome</button>
   <div class="sub">Locais escondidos (${L.length})</div>
   ${L.length ? L.map((a, i) => `<div class="row" style="gap:6px;flex-wrap:nowrap"><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">◼ ${esc(a.nome)}</span><button class="btn sm ghost" data-ocren="${i}">Renomear</button><button class="btn sm ghost" data-ocdel="${i}" aria-label="Não esconder ${esc(a.nome)}">✕</button></div>`).join("") : `<p class="muted small" style="margin:0">Nenhum ainda.</p>`}
   ${L.length ? `<button class="btn sm ghost" id="ocLimpar">Não esconder nenhum</button>` : ""}</div>`;
    $("#ocTodas").onclick = ocTodasComNome;
    const lp = $("#ocLimpar");
    if (lp)
      lp.onclick = () => {
        mePush();
        ME.M.ocultos = [];
        meSide();
        meDraw();
      };
    $$("[data-ocren]", el).forEach(b => (b.onclick = () => ocEditar(L[+b.dataset.ocren])));
    $$("[data-ocdel]", el).forEach(
      b =>
        (b.onclick = () => {
          mePush();
          ME.M.ocultos = L.filter((_, i) => i !== +b.dataset.ocdel);
          meSide();
          meDraw();
        })
    );
  };
}
{
  const _cfg = meConfig;
  meConfig = async function () {
    await _cfg();
    const M = ME.M;
    if (!M.ocultos) return;
    M.ocultos.forEach(a => {
      const c = new Set(
        [...ocCells(a)].filter(k => {
          const [x, y] = k.split(",").map(Number);
          return x < M.w && y < M.h;
        })
      );
      a.r = ocDeCells(c);
    });
    M.ocultos = M.ocultos.filter(a => a.r.length);
    meDraw();
  };
}

/* ---------- virar cena: leva os locais em pixels ---------- */
{
  const _u = meUsarCena;
  meUsarCena = async function () {
    const antes = ME.M && ME.M.cenaId;
    await _u();
    const M = ME.M;
    if (!M || !M.cenaId) return;
    const sid = M.cenaId;
    try {
      const sc = await S.db.get(P() + "/cenas/" + sid);
      if (!sc || !sc.tam) return;
      const k = sc.tam;
      const velhos = {};
      (sc.locais || []).forEach(l => (velhos[l.id] = l));
      const locais = (M.ocultos || []).map(a => ({
        id: a.id,
        nome: a.nome,
        aberto: velhos[a.id] ? !!velhos[a.id].aberto : false,
        r: a.r.map(v => Math.round(v * k))
      }));
      if (!locais.length && !(sc.locais || []).length) return;
      await S.db.merge(P() + "/cenas/" + sid, { locais });
      const c = S.cenas.find(x => x.id === sid);
      if (c) c.locais = locais;
      if (locais.length && !antes)
        toast(`Cena criada com ${locais.length} local(is) escondido(s). Revele pelo botão Locais no mapa.`);
    } catch (e) {
      fail(e);
    }
  };
}

/* ---------- na mesa ---------- */
function locaisFechados() {
  const sc = curScene();
  return ((sc && sc.locais) || []).filter(l => !l.aberto);
}
function localFechadoEm(x, y) {
  return locaisFechados().some(l =>
    ocRects(l.r).some(([a, b, w, h]) => x >= a && x <= a + w && y >= b && y <= b + h)
  );
}
{
  const _h = hiddenAt;
  hiddenAt = function (x, y) {
    return localFechadoEm(x, y) || _h(x, y);
  };
}
{
  const _f = renderFog;
  renderFog = function () {
    _f();
    const c = $("#fogC");
    if (!c) return;
    const L = locaisFechados();
    if (!L.length) return;
    const g = c.getContext("2d");
    if (c.hidden) {
      g.clearRect(0, 0, c.width, c.height);
      c.hidden = false;
    }
    c.style.opacity = S.isM ? 0.55 : 1;
    g.globalCompositeOperation = "source-over";
    L.forEach(l => {
      const R = ocRects(l.r);
      g.fillStyle = "#07050a";
      R.forEach(([x, y, w, h]) => g.fillRect(x, y, w, h));
      if (S.isM) {
        const b = R.reduce((m, r) => (r[2] * r[3] > m[2] * m[3] ? r : m), [0, 0, 0, 0]);
        const fs = Math.max(14, Math.min(34, b[3] / 6));
        g.font = `700 ${fs}px Inter,sans-serif`;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillStyle = "#ff8090";
        g.fillText("◼ " + l.nome + " (escondido)", b[0] + b[2] / 2, b[1] + b[3] / 2);
      }
    });
  };
}
{
  const _n = renderNomes;
  renderNomes = function () {
    const sc = curScene();
    if (!S.isM && sc && (sc.locais || []).length && sc.nomes) {
      const o = sc.nomes;
      sc.nomes = o.map(n => (localFechadoEm(n.x, n.y) ? { ...n, h: true } : n));
      try {
        _n();
      } finally {
        sc.nomes = o;
      }
    } else _n();
    renderFog();
  };
}
async function locaisSalvar(sc) {
  renderFog();
  renderNomes();
  renderBoard();
  try {
    await S.db.merge(P() + "/cenas/" + sc.id, { locais: sc.locais });
  } catch (e) {
    fail(e);
  }
}
function locaisModal() {
  const sc = curScene();
  if (!sc || !(sc.locais || []).length) return;
  const h = $("#modalHost");
  const draw = () => {
    const L = sc.locais;
    h.innerHTML = `<div class="modal-back"><div class="modal" role="dialog" aria-label="Locais escondidos"><h3>Locais do mapa</h3>
    <p class="muted small" style="margin:0">Os escondidos ficam pretos para os jogadores, e o que estiver dentro não aparece.</p>
    <div class="stack" style="gap:6px;max-height:50vh;overflow:auto">${L.map((l, i) => `<div class="row" style="gap:8px;flex-wrap:nowrap"><span style="flex:1;min-width:0">${l.aberto ? "👁" : "◼"} ${esc(l.nome)}</span><button class="btn sm ${l.aberto ? "ghost" : "primary"}" data-loc="${i}">${l.aberto ? "Esconder" : "Revelar"}</button></div>`).join("")}</div>
    <div class="row" style="justify-content:space-between"><span class="row" style="gap:6px"><button class="btn sm ghost" id="locTodos">Revelar todos</button><button class="btn sm ghost" id="locNenhum">Esconder todos</button></span><button class="btn" id="locX">Fechar</button></div></div></div>`;
    $("#locX").onclick = () => (h.innerHTML = "");
    $$("[data-loc]", h).forEach(
      b =>
        (b.onclick = () => {
          const l = sc.locais[+b.dataset.loc];
          l.aberto = !l.aberto;
          draw();
          locaisSalvar(sc);
          toast(l.aberto ? `${l.nome} revelado para os jogadores.` : `${l.nome} escondido.`);
        })
    );
    $("#locTodos").onclick = () => {
      sc.locais.forEach(l => (l.aberto = true));
      draw();
      locaisSalvar(sc);
    };
    $("#locNenhum").onclick = () => {
      sc.locais.forEach(l => (l.aberto = false));
      draw();
      locaisSalvar(sc);
    };
  };
  draw();
}
{
  const _mt = renderMapTools;
  renderMapTools = function () {
    _mt();
    const el = $("#mapTools");
    const sc = curScene();
    if (!el || el.hidden || !S.isM || !sc || !(sc.locais || []).length) return;
    const n = locaisFechados().length;
    el.insertAdjacentHTML(
      "beforeend",
      `<span class="mtsep"></span><button class="mtb" id="locBtn" title="Revelar ou esconder locais do mapa">Locais${n ? ` (${n} escondido${n > 1 ? "s" : ""})` : ""}</button>`
    );
    $("#locBtn").onclick = locaisModal;
  };
}
</script>
