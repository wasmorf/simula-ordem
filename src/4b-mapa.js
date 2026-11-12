<script>
"use strict";
/* ===================== RECORTE DE IMAGEM (foto da ficha e tokens) ===================== */
function cropImage(
  file,
  { size = 240, round = false, type = "image/jpeg", title = "Ajustar imagem", ratio = 1, radius = 0 } = {}
) {
  return new Promise(async res => {
    let im;
    try {
      im = await loadImg(file);
    } catch (e) {
      toast("Não consegui abrir essa imagem.");
      return res(null);
    }
    const V0 = 280,
      VH = Math.round(V0 * ratio);
    const base = Math.max(V0 / im.naturalWidth, VH / im.naturalHeight);
    let z = 1,
      ox = 0,
      oy = 0;
    const h = $("#modalHost");
    h.innerHTML = `<div class="modal-back"><div class="modal" role="dialog" aria-label="${esc(title)}"><h3>${esc(title)}</h3>
      <div class="crop ${round ? "round" : ""}" style="${ratio !== 1 ? `aspect-ratio:1/${ratio};` : ""}${radius ? `border-radius:${radius * 100}%;` : ""}"><canvas id="cropC" width="${V0}" height="${VH}"></canvas></div>
      <div class="row" style="flex-wrap:nowrap"><span class="muted small">Zoom</span><input type="range" id="cropZ" min="1" max="4" step="0.01" value="1" style="flex:1" aria-label="Zoom"></div>
      <p class="muted small" style="margin:0">Arraste a imagem para posicionar.</p>
      <div class="row" style="justify-content:flex-end"><button class="btn" id="cNo">Cancelar</button><button class="btn primary" id="cOk">Usar imagem</button></div></div></div>`;
    const c = $("#cropC"),
      g = c.getContext("2d");
    const clamp = () => {
      const s = base * z;
      const w = im.naturalWidth * s,
        hh = im.naturalHeight * s;
      ox = Math.min(0, Math.max(V0 - w, ox));
      oy = Math.min(0, Math.max(VH - hh, oy));
    };
    const center = () => {
      const s = base * z;
      ox = (V0 - im.naturalWidth * s) / 2;
      oy = (VH - im.naturalHeight * s) / 2.6;
      clamp();
    };
    const draw = () => {
      const s = base * z;
      g.clearRect(0, 0, V0, VH);
      g.drawImage(im, ox, oy, im.naturalWidth * s, im.naturalHeight * s);
    };
    center();
    draw();
    $("#cropZ").oninput = e => {
      const cx = V0 / 2,
        cy = VH / 2;
      const s0 = base * z;
      z = +e.target.value;
      const s1 = base * z;
      ox = cx - ((cx - ox) * s1) / s0;
      oy = cy - ((cy - oy) * s1) / s0;
      clamp();
      draw();
    };
    let drag = null;
    c.onpointerdown = e => {
      drag = { x: e.clientX, y: e.clientY, ox, oy };
      try {
        c.setPointerCapture(e.pointerId);
      } catch (_) {}
    };
    c.onpointermove = e => {
      if (!drag) return;
      ox = drag.ox + e.clientX - drag.x;
      oy = drag.oy + e.clientY - drag.y;
      clamp();
      draw();
    };
    c.onpointerup = c.onpointercancel = () => (drag = null);
    c.onwheel = e => {
      e.preventDefault();
      const r = $("#cropZ");
      r.value = Math.max(1, Math.min(4, z * (e.deltaY < 0 ? 1.08 : 1 / 1.08)));
      r.oninput({ target: r });
    };
    $("#cNo").onclick = () => {
      h.innerHTML = "";
      res(null);
    };
    $("#cOk").onclick = () => {
      const s = base * z;
      const out = document.createElement("canvas");
      out.width = size;
      out.height = Math.round(size * ratio);
      const o = out.getContext("2d");
      o.imageSmoothingQuality = "high";
      if (round) {
        o.beginPath();
        o.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        o.clip();
      }
      const k = size / V0;
      o.drawImage(im, ox * k, oy * k, im.naturalWidth * s * k, im.naturalHeight * s * k);
      let url = out.toDataURL(type, 0.85);
      if (type === "image/webp" && !url.startsWith("data:image/webp")) url = out.toDataURL("image/png");
      h.innerHTML = "";
      res(url);
    };
  });
}

/* ===================== TOKENS ===================== */
const COR_TOKEN = ["#b47dff", "#ff4d5e", "#e0a03c", "#5fae70", "#4fa3e0", "#e9e9f0", "#ff7ac8", "#2e2540"];
const COR_EL = {
  Sangue: "#e0303f",
  Morte: "#8f8b94",
  Energia: "#a35ce0",
  Conhecimento: "#d6ad45",
  Medo: "#e9e9f0",
  "": "#4fa3e0"
};
function corDe(uid) {
  let h = 0;
  for (const c of String(uid || "")) h = (h * 31 + c.charCodeAt(0)) | 0;
  return COR_TOKEN[Math.abs(h) % 6];
}
function tokUrl(t) {
  if (t.usaFoto && t.fichaId) {
    const f = S.fichas[t.fichaId];
    if (f && f.foto) return f.foto;
  }
  return t.url || "";
}
function tokNome(t) {
  const f = t.fichaId && S.fichas[t.fichaId];
  return f ? f.nome : t.nome;
}
function tokHP(t) {
  const f = t.fichaId && S.fichas[t.fichaId];
  if (f) {
    migrar(f);
    return [cur(f, "pv"), derivados(f).pvMax];
  }
  if (t.combId && S.combate) {
    const x = (S.combate.lista || []).find(y => y.id === t.combId);
    if (x) return [x.pv, x.pvMax];
  }
  return null;
}
function tokThumb(t) {
  const u = tokUrl(t);
  return u
    ? `<img src="${u}" alt="" style="${t.forma === "redondo" ? `border-radius:50%;border:2px solid ${t.cor || "#b47dff"};object-fit:cover` : t.forma === "quadrado" ? `border-radius:12px;border:2px solid ${t.cor || "#b47dff"};object-fit:cover;object-position:50% 18%` : ""}">`
    : `<div class="avatar ph">${esc((tokNome(t) || "?").charAt(0))}</div>`;
}
// arte de token para ameaças: círculo com a cor do elemento e as iniciais
function arteAmeaca(nome, el) {
  const S2 = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S2;
  const g = c.getContext("2d");
  const cor = COR_EL[el] || COR_EL[""];
  const gr = g.createRadialGradient(S2 * 0.4, S2 * 0.35, 10, S2 / 2, S2 / 2, S2 / 2);
  gr.addColorStop(0, "#2a2033");
  gr.addColorStop(1, "#0b090f");
  g.beginPath();
  g.arc(S2 / 2, S2 / 2, S2 / 2 - 6, 0, Math.PI * 2);
  g.fillStyle = gr;
  g.fill();
  g.lineWidth = 12;
  g.strokeStyle = cor;
  g.stroke();
  g.lineWidth = 2;
  g.globalAlpha = 0.5;
  g.beginPath();
  g.arc(S2 / 2, S2 / 2, S2 / 2 - 26, 0, Math.PI * 2);
  g.stroke();
  g.globalAlpha = 1;
  const ini =
    nome
      .split(/\s+/)
      .filter(w => w.length > 2 || /^[A-ZÁÉ]/.test(w))
      .slice(0, 2)
      .map(w => w[0])
      .join("")
      .toUpperCase() || nome[0];
  g.fillStyle = cor;
  g.font = `700 ${ini.length > 1 ? 96 : 120}px Georgia,serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(ini, S2 / 2, S2 / 2 - 6);
  g.fillStyle = "#ede7f3";
  g.font = "600 22px system-ui,sans-serif";
  g.fillText((el || "Realidade").toUpperCase(), S2 / 2, S2 - 62);
  let u = c.toDataURL("image/webp", 0.85);
  if (!u.startsWith("data:image/webp")) u = c.toDataURL("image/png");
  return u;
}

function tokensHTML() {
  const q = (S.tokQ || "").toLowerCase();
  const inScene = new Set(Object.keys(S.pos));
  const match = t => !q || (tokNome(t) || "").toLowerCase().includes(q);
  const row = (t, on) => {
    const f = t.fichaId && S.fichas[t.fichaId];
    const mine = canMove(t);
    return `<div class="tokrow">${tokThumb(t)}<div style="min-width:0"><div style="font-weight:600">${esc(tokNome(t))}${t.oculto ? ' <span class="tag">oculto</span>' : ""}</div>
    <div class="row" style="margin-top:4px">${S.viewSid && mine ? (on ? `<button class="btn sm" data-out="${esc(t.id)}">✕ Tirar de cena</button>` : `<button class="btn sm" data-in="${esc(t.id)}">+ Adicionar</button>`) : ""}${f ? `<span class="tag">ficha</span>` : ""}${t.ameaca ? `<span class="tag red">ameaça</span>` : ""}</div></div>
    <div class="row" style="flex-direction:column;gap:4px">${S.isM ? `<button class="btn sm ghost" data-fav="${esc(t.id)}" aria-label="Favoritar" style="color:${t.fav ? "var(--purple-hi)" : "var(--muted)"}">${t.fav ? "★" : "☆"}</button>` : ""}${mine ? `<button class="btn sm ghost" data-deltok="${esc(t.id)}" aria-label="Apagar token">🗑</button>` : ""}</div></div>`;
  };
  if (S.tokTab === "ameacas") {
    const B = allBest().filter(b => !q || b.n.toLowerCase().includes(q));
    return `<input type="search" id="tokQ" placeholder="Pesquisar" value="${esc(S.tokQ || "")}">${tabsTok()}${S.isM ? `<button class="btn sm ghost" id="galArtes2">Artes do bestiário (imagens suas)</button>` : ""}
     ${
       !S.isM
         ? `<div class="empty">Só o mestre coloca ameaças no mapa.</div>`
         : `${!S.viewSid ? `<div class="banner">Abra uma cena para colocar ameaças nela.</div>` : ""}
     <label class="check"><input type="checkbox" id="ameCombate" ${S.ameCombate !== false ? "checked" : ""}> Também colocar no combate (a vida aparece no token)</label>
     <label class="check"><input type="checkbox" id="ameOculto" ${S.ameOculto ? "checked" : ""}> Entrar oculto para os jogadores</label>
     <div class="cards">${B.map((b, i) => `<div class="tokrow"><img src="${(typeof arteDaBase === "function" && arteDaBase(b.n)) || arteThumbEl(b.el)}" alt="" style="width:52px;height:52px;object-fit:contain;border-radius:6px;background:#2a2c2e"><div style="min-width:0"><div style="font-weight:600">${esc(b.n)}${b.hb ? " (homebrew)" : ""}</div><div class="muted small">${esc(b.el || "Realidade")} · VD ${b.vd} · PV ${b.pv} · DEF ${b.def}</div></div><button class="btn sm primary" data-ame="${i}" ${S.viewSid ? "" : "disabled"}>Pôr em cena</button></div>`).join("")}</div>`
     }`;
  }
  const em = S.tokens.filter(t => inScene.has(t.id) && match(t));
  let lib = S.tokens.filter(t => !inScene.has(t.id) && match(t));
  if (S.tokTab === "meus") lib = lib.filter(t => t.dono === S.uid);
  if (S.tokTab === "agentes") lib = lib.filter(t => t.fichaId);
  if (S.tokTab === "criaturas") lib = lib.filter(t => !t.fichaId);
  lib.sort((a, b) => (b.fav ? 1 : 0) - (a.fav ? 1 : 0));
  const minhas = Object.entries(S.fichas).filter(([id, f]) => f.dono === S.uid || S.isM);
  return `<input type="search" id="tokQ" placeholder="Pesquisar" value="${esc(S.tokQ || "")}">${tabsTok()}
   ${!S.viewSid ? `<div class="banner">Abra uma cena para colocar tokens nela.</div>` : ""}
   <div class="sub">Em cena</div>${em.length ? `<div class="cards">${em.map(t => row(t, true)).join("")}</div>` : `<div class="empty">Nenhum token nesta cena.</div>`}
   <div class="sub">Biblioteca</div>${lib.length ? `<div class="cards">${lib.map(t => row(t, false)).join("")}</div>` : `<div class="empty">Nenhum token aqui.</div>`}
   <div class="row" style="flex-wrap:nowrap">${minhas.length ? `<button class="btn primary" id="tokFicha" style="flex:1">Token da minha ficha</button>` : ""}<button class="btn ${minhas.length ? "" : "primary"}" id="novoTok" style="flex:1">Token com imagem</button></div>
   <p class="muted small" style="margin:0">O token da ficha usa a foto do agente com moldura redonda e mostra a vida no mapa. Para criaturas do livro, use a aba Ameaças.</p>`;
}
function tabsTok() {
  return `<div class="tabs2">${[
    ["todos", "Todos"],
    ["meus", "Meus"],
    ["agentes", "Agentes"],
    ["criaturas", "Criaturas e NPCs"],
    ["ameacas", "Ameaças"]
  ]
    .map(([k, n]) => `<button data-ttab="${k}" aria-pressed="${(S.tokTab || "todos") === k}">${n}</button>`)
    .join("")}</div>`;
}
const ARTE_EL_CACHE = {};
function arteThumbEl(el) {
  return ARTE_EL_CACHE[el || ""] || (ARTE_EL_CACHE[el || ""] = arteCriatura(el || "", 3));
}
function bindTokens() {
  {
    const g2 = $("#galArtes2");
    if (g2) g2.onclick = galeriaArtes;
  }
  const q = $("#tokQ");
  q.oninput = () => {
    S.tokQ = q.value;
    const p = q.selectionStart;
    renderPanel();
    const n = $("#tokQ");
    n.focus();
    n.setSelectionRange(p, p);
  };
  $$("[data-ttab]").forEach(
    b =>
      (b.onclick = () => {
        S.tokTab = b.dataset.ttab;
        renderPanel();
      })
  );
  $$("[data-in]").forEach(b => (b.onclick = () => porEmCena(b.dataset.in)));
  $$("[data-out]").forEach(b => (b.onclick = () => tirarDeCena(b.dataset.out)));
  $$("[data-fav]").forEach(
    b =>
      (b.onclick = () => {
        const t = S.tokens.find(x => x.id === b.dataset.fav);
        S.db.merge(P() + "/tokens/" + t.id, { fav: !t.fav }).catch(fail);
      })
  );
  $$("[data-deltok]").forEach(
    b =>
      (b.onclick = async () => {
        const t = S.tokens.find(x => x.id === b.dataset.deltok);
        if (
          !(await confirmBox(
            "Apagar o token " + tokNome(t) + "?",
            "Ele sai da biblioteca e de todas as cenas."
          ))
        )
          return;
        try {
          if (S.pos[t.id]) await tirarDeCena(t.id);
          await S.db.del(P() + "/tokens/" + t.id);
        } catch (e) {
          fail(e);
        }
      })
  );
  const nt = $("#novoTok");
  if (nt) nt.onclick = () => novoToken();
  const tf = $("#tokFicha");
  if (tf) tf.onclick = () => tokenDaFicha();
  const ac = $("#ameCombate");
  if (ac) ac.onchange = () => (S.ameCombate = ac.checked);
  const ao = $("#ameOculto");
  if (ao) ao.onchange = () => (S.ameOculto = ao.checked);
  $$("[data-ame]").forEach(b => (b.onclick = () => ameacaEmCena(allBest()[+b.dataset.ame])));
}
function porEmCena(tid, at) {
  if (!S.viewSid) {
    toast("Abra uma cena primeiro.");
    return;
  }
  const r = board.getBoundingClientRect();
  let x = Math.round((r.width / 2 - V.x) / V.z),
    y = Math.round((r.height / 2 - V.y) / V.z);
  if (at) {
    x = at.x;
    y = at.y;
  } else {
    const n = Object.keys(S.pos).length;
    x += ((n % 5) - 2) * tokenBase() * 0.7;
  }
  x = Math.max(0, Math.min(V.w, x));
  y = Math.max(0, Math.min(V.h, y));
  S.pos[tid] = { x, y, s: 1 };
  S.db.setKey(P() + "/pos/" + S.viewSid, "tokens", tid, S.pos[tid], { ult: tid }).catch(fail);
  renderBoard();
  if (S.tool === "tokens") renderPanel();
}
async function tirarDeCena(tid) {
  delete S.pos[tid];
  if (S.sel === tid) S.sel = null;
  renderBoard();
  if (S.tool === "tokens") renderPanel();
  try {
    await S.db.setKey(P() + "/pos/" + S.viewSid, "tokens", tid, DEL, { ult: tid });
  } catch (e) {
    fail(e);
  }
}
async function criarToken(doc, cena) {
  try {
    const id = await S.db.add(P() + "/tokens", { fav: false, criada: Date.now(), dono: S.uid, ...doc });
    if (cena && S.viewSid) {
      S.tokens.push({ id, ...doc, dono: S.uid });
      porEmCena(id);
    }
    return id;
  } catch (e) {
    fail(e);
    return null;
  }
}
async function tokenDaFicha(pre) {
  const minhas = Object.entries(S.fichas).filter(([id, f]) => f.dono === S.uid || S.isM);
  if (!minhas.length) {
    toast("Crie uma ficha primeiro.");
    return;
  }
  const id0 = pre || (minhas.find(([id, f]) => f.dono === S.uid) || minhas[0])[0];
  const r = await formBox(
    "Token da ficha",
    `<div class="field"><label class="label" for="tfF">Ficha</label><select id="tfF" name="ficha">${minhas.map(([id, f]) => `<option value="${esc(id)}" ${id === id0 ? "selected" : ""}>${esc(f.nome)}${f.foto ? "" : " (sem foto)"}</option>`).join("")}</select></div>
    <div class="field"><span class="label">Cor da moldura</span><div class="swatches">${COR_TOKEN.map((c, i) => `<label><input type="radio" name="cor" value="${c}" ${c === corDe(S.uid) ? "checked" : ""}><span style="background:${c}"></span></label>`).join("")}</div></div>
    <div class="field"><span class="label">Formato</span><label class="check"><input type="radio" name="forma" value="quadrado" checked> Quadrado (estilo carta)</label><label class="check"><input type="radio" name="forma" value="redondo"> Redondo</label></div>
    ${S.viewSid ? `<label class="check"><input type="checkbox" name="cena" checked> Colocar na cena agora</label>` : ""}`,
    "Criar token"
  );
  if (!r) return;
  const f = S.fichas[r.ficha];
  if (!f) return;
  const forma = r.forma || "quadrado";
  if (!f.foto && f.npc) {
    const url = f.criatura
      ? arteCriatura(f.rel || "", maH((f.nome || "").length, (f.base || f.nome || "x").charCodeAt(0), 5))
      : artePessoa(maH((f.nome || "").length, (f.rtipo || f.nome || "x").charCodeAt(0), 9));
    await criarToken(
      {
        nome: f.nome,
        url,
        fichaId: r.ficha,
        forma: f.criatura ? "livre" : forma,
        cor: r.cor || corDe(S.uid),
        usaFoto: true
      },
      r.cena
    );
    toast("Token criado. Se você puser uma arte na ficha, ele passa a usar a arte.");
    return;
  }
  if (!f.foto) {
    toast("Essa ficha não tem foto. Escolha uma imagem para o token.");
    const file = await pickImage();
    if (!file) return;
    const url = await cropImage(file, {
      size: 256,
      round: forma === "redondo",
      radius: forma === "quadrado" ? 0.14 : 0,
      type: "image/webp",
      title: "Ajustar o token"
    });
    if (!url) return;
    return criarToken(
      { nome: f.nome, url, fichaId: r.ficha, forma, cor: r.cor || corDe(S.uid), usaFoto: false },
      r.cena
    );
  }
  await criarToken(
    { nome: f.nome, url: "", fichaId: r.ficha, forma, cor: r.cor || corDe(S.uid), usaFoto: true },
    r.cena
  );
  toast("Token criado com a foto da ficha.");
}
async function novoToken() {
  const r0 = await formBox(
    "Token com imagem",
    `<div class="field"><span class="label">Formato</span>
     <label class="check"><input type="radio" name="forma" value="quadrado" checked> Quadrado com moldura, estilo carta (arte do personagem)</label>
     <label class="check"><input type="radio" name="forma" value="redondo"> Redondo com moldura (foto, rosto)</label>
     <label class="check"><input type="radio" name="forma" value="livre"> Imagem livre (PNG sem fundo, objeto, criatura inteira)</label></div>`,
    "Escolher imagem"
  );
  if (!r0) return;
  const file = await pickImage();
  if (!file) return;
  let url;
  if (r0.forma !== "livre") {
    url = await cropImage(file, {
      size: 256,
      round: r0.forma === "redondo",
      radius: r0.forma === "quadrado" ? 0.14 : 0,
      type: "image/webp",
      title: "Ajustar o token"
    });
    if (!url) return;
  } else {
    try {
      url = (await compressToken(file)).url;
    } catch (e) {
      toast("Não consegui usar essa imagem.");
      return;
    }
  }
  const mine = Object.entries(S.fichas).filter(([id, f]) => S.isM || f.dono === S.uid);
  const r = await formBox(
    "Novo token",
    `<img src="${url}" alt="" style="max-height:120px;object-fit:contain;align-self:center${r0.forma === "redondo" ? ";border-radius:50%" : r0.forma === "quadrado" ? ";border-radius:14px" : ""}">
   <div class="field"><label class="label" for="tn">Nome</label><input type="text" id="tn" name="nome" maxlength="40" value="${esc(file.name.replace(/\.[^.]+$/, "").slice(0, 40))}" required></div>
   <div class="field"><label class="label" for="tf">Ligar a uma ficha (mostra a vida no mapa)</label><select id="tf" name="ficha"><option value="">Nenhuma (criatura, NPC, objeto)</option>${mine.map(([id, f]) => `<option value="${esc(id)}">${esc(f.nome)}</option>`).join("")}</select></div>
   ${r0.forma !== "livre" ? `<div class="field"><span class="label">Cor da moldura</span><div class="swatches">${COR_TOKEN.map(c => `<label><input type="radio" name="cor" value="${c}" ${c === corDe(S.uid) ? "checked" : ""}><span style="background:${c}"></span></label>`).join("")}</div></div>` : ""}
   ${S.viewSid ? `<label class="check"><input type="checkbox" name="cena" checked> Colocar na cena agora</label>` : ""}`,
    "Criar token"
  );
  if (!r) return;
  await criarToken(
    {
      nome: r.nome.trim() || "Token",
      url,
      fichaId: r.ficha || null,
      forma: r0.forma,
      cor: r.cor || corDe(S.uid)
    },
    r.cena
  );
  toast("Token criado.");
}
async function ameacaEmCena(b) {
  if (!b || !S.viewSid) return;
  const n = S.tokens.filter(t => t.ameaca === b.n).length;
  const nome = b.n + (n ? " " + (n + 1) : "");
  let combId = null;
  if (S.ameCombate !== false) {
    combId = rid(5);
    const c = combBase();
    c.lista.push({
      id: combId,
      tipo: "npc",
      base: b.n,
      nome,
      pv: b.pv,
      pvMax: b.pv,
      def: b.def,
      atk: b.atk,
      el: b.el,
      vd: b.vd,
      agi: b.at[0],
      ini: null
    });
    saveCombate(c);
  }
  await criarToken(
    { nome, url: arteAmeaca(b.n, b.el), ameaca: b.n, combId, forma: "livre", oculto: !!S.ameOculto },
    true
  );
  toast(`${nome} entrou em cena${combId ? " e no combate" : ""}.`);
}

/* ===================== TABULEIRO ===================== */
const V = { x: 0, y: 0, z: 1, w: 0, h: 0 };
const board = $("#board"),
  vp = $("#viewport");
function applyView() {
  vp.style.transform = `translate(${V.x}px,${V.y}px) scale(${V.z})`;
  $("#zVal").textContent = Math.round(V.z * 100) + "%";
  const r = $("#ovL");
  if (r) r.style.setProperty("--k", 1 / V.z);
  vp.style.setProperty("--mk", 1 / V.z);
}
function fitView() {
  if (!V.w) return;
  const r = board.getBoundingClientRect();
  if (!r.width) return;
  const z = Math.min(r.width / V.w, r.height / V.h) * 0.94;
  V.z = Math.max(0.05, Math.min(4, z));
  V.x = (r.width - V.w * V.z) / 2;
  V.y = (r.height - V.h * V.z) / 2;
  applyView();
}
function zoomAt(f, cx, cy) {
  const nz = Math.max(0.05, Math.min(4, V.z * f));
  V.x = cx - (cx - V.x) * (nz / V.z);
  V.y = cy - (cy - V.y) * (nz / V.z);
  V.z = nz;
  S.userMoved = true;
  applyView();
  renderOverlay();
}
$("#zIn").onclick = () => {
  const r = board.getBoundingClientRect();
  zoomAt(1.2, r.width / 2, r.height / 2);
};
$("#zOut").onclick = () => {
  const r = board.getBoundingClientRect();
  zoomAt(1 / 1.2, r.width / 2, r.height / 2);
};
$("#zFit").onclick = () => {
  S.userMoved = false;
  fitView();
  renderOverlay();
};
board.addEventListener(
  "wheel",
  e => {
    if (!V.w) return;
    e.preventDefault();
    const r = board.getBoundingClientRect();
    zoomAt(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX - r.left, e.clientY - r.top);
  },
  { passive: false }
);
board.addEventListener("contextmenu", e => {
  if (e.target.closest("#viewport")) e.preventDefault();
});
function mapPt(e) {
  const r = board.getBoundingClientRect();
  return { x: (e.clientX - r.left - V.x) / V.z, y: (e.clientY - r.top - V.y) / V.z };
}
const ptr = new Map();
let pan = null,
  pinch = null,
  act = null;
board.addEventListener("pointerdown", e => {
  if (
    e.target.closest(
      ".tok,.mdoc,.porta,.passagem,.zoom,.board-top,.tokbar,.board-empty button,.callbar,.screens,.maptools"
    )
  )
    return;
  if (e.isPrimary) {
    ptr.clear();
    pinch = null;
    pan = null;
  } // dedo novo começa um gesto do zero (evita dedo "fantasma" que travava o arrastar)
  ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
  try {
    board.setPointerCapture(e.pointerId);
  } catch (_) {}
  if (ptr.size === 2) {
    const [a, b] = [...ptr.values()];
    pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: V.z };
    pan = null;
    if (act) {
      act = null;
      S.live = null;
      renderOverlay();
    }
    return;
  }
  if (ptr.size !== 1) return;
  const tool = S.mode || "mover";
  if (tool !== "mover" && e.button === 0 && V.w) {
    act = toolDown(tool, mapPt(e), e);
    if (act) return;
  }
  pan = { x: e.clientX, y: e.clientY, vx: V.x, vy: V.y };
  if (S.sel) {
    S.sel = null;
    renderBoard();
  }
});
board.addEventListener("pointermove", e => {
  if (!ptr.has(e.pointerId)) return;
  ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && ptr.size === 2) {
    const [a, b] = [...ptr.values()];
    const r = board.getBoundingClientRect();
    const dd = Math.hypot(a.x - b.x, a.y - b.y);
    zoomAt((pinch.z * dd) / pinch.d / V.z, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
    return;
  }
  if (act) {
    act.move(mapPt(e));
    return;
  }
  if (pan) {
    V.x = pan.vx + e.clientX - pan.x;
    V.y = pan.vy + e.clientY - pan.y;
    S.userMoved = true;
    applyView();
  }
});
function endPtr(e) {
  ptr.delete(e.pointerId);
  if (act && ptr.size === 0) {
    const a = act;
    act = null;
    a.up(mapPt(e));
  }
  if (ptr.size < 2) pinch = null;
  if (ptr.size === 0) pan = null;
}
board.addEventListener("pointerup", endPtr);
board.addEventListener("pointercancel", e => {
  ptr.delete(e.pointerId);
  if (ptr.size === 0) {
    act = null;
    pan = null;
    S.live = null;
    renderOverlay();
  }
});
document.addEventListener("keydown", e => {
  if (
    !S.mesaId ||
    /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || "") ||
    e.ctrlKey ||
    e.metaKey ||
    e.altKey
  )
    return;
  const k = { v: "mover", r: "regua", p: "ping", d: "desenho", e: "borracha" }[e.key.toLowerCase()];
  if (k) {
    setMode(k);
  } else if (e.key === "Escape") {
    setMode("mover");
  }
});

function curScene() {
  return S.cenas.find(c => c.id === S.viewSid) || null;
}
function limparCenaSubs() {
  ["posUnsub", "fogUnsub", "drawUnsub", "pingUnsub"].forEach(k => {
    if (S[k]) {
      try {
        S[k]();
      } catch (e) {}
      S[k] = null;
    }
  });
  S.fog = null;
  S.draws = [];
  S.pings = [];
}
async function viewScene(sid) {
  if (S.viewSid === sid && (!sid || S.sceneImg[sid])) return;
  S.viewSid = sid;
  S.sel = null;
  S.userMoved = false;
  S.live = null;
  S.regua = null;
  limparCenaSubs();
  S.pos = {};
  renderBoard();
  renderBoardTop();
  if (!sid) return;
  S.posUnsub = S.db.listenDoc(
    P() + "/pos/" + sid,
    p => {
      S.pos = (p && p.tokens) || {};
      if (!S.dragging) renderBoard();
    },
    () => {}
  );
  S.fogUnsub = S.db.listenDoc(
    P() + "/nevoa/" + sid,
    d => {
      S.fog = d;
      renderFog();
      renderBoard();
      renderMapTools();
    },
    () => {}
  );
  S.drawUnsub = S.db.listenCol(
    P() + "/desenhos",
    { where: ["sid", sid] },
    list => {
      S.draws = list;
      renderDraws();
    },
    () => {}
  );
  S.pingSeen = new Set();
  S.pingUnsub = S.db.listenCol(
    P() + "/pings",
    { where: ["sid", sid] },
    list => {
      S.pings = list;
      const now = Date.now();
      list.forEach(p => {
        if (S.pingSeen.has(p.id)) return;
        S.pingSeen.add(p.id);
        if (now - (p.ts || 0) < 20000) showPing(p);
      });
    },
    () => {}
  );
  if (!S.sceneImg[sid]) {
    try {
      const im = await S.db.get(P() + "/cenaImg/" + sid);
      if (im && im.url) S.sceneImg[sid] = im.url;
    } catch (e) {
      console.error(e);
    }
  }
  if (S.viewSid === sid) {
    renderBoard();
  }
}
function tokenBase() {
  const sc = curScene();
  return (sc && sc.tam) || Math.max(40, Math.round((V.w || 1400) / 18));
}
function canMove(t) {
  if (!t) return false;
  if (S.isM) return true;
  if (t.dono === S.uid) return true;
  const f = t.fichaId && S.fichas[t.fichaId];
  return !!(f && f.dono === S.uid);
}

/* ---------- névoa de guerra ---------- */
function fogOn() {
  return !!(S.fog && S.fog.on);
}
function hiddenAt(x, y) {
  if (!fogOn()) return false;
  let hid = true;
  for (const o of S.fog.ops || []) {
    if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h) hid = o.t !== "r";
  }
  return hid;
}
function renderFog() {
  const c = $("#fogC");
  if (!c) return;
  const g = c.getContext("2d");
  g.clearRect(0, 0, c.width, c.height);
  c.hidden = !fogOn();
  if (!fogOn()) return;
  c.style.opacity = S.isM ? 0.5 : 1;
  g.globalCompositeOperation = "source-over";
  g.fillStyle = "#07050a";
  g.fillRect(0, 0, c.width, c.height);
  for (const o of S.fog.ops || []) {
    if (o.t === "r") {
      g.globalCompositeOperation = "destination-out";
      g.fillStyle = "#000";
    } else {
      g.globalCompositeOperation = "source-over";
      g.fillStyle = "#07050a";
    }
    g.fillRect(o.x, o.y, o.w, o.h);
  }
  g.globalCompositeOperation = "source-over";
}
async function salvarFog(f) {
  S.fog = f;
  renderFog();
  renderBoard();
  try {
    await S.db.set(P() + "/nevoa/" + S.viewSid, f);
  } catch (e) {
    fail(e);
  }
}
function fogOp(t, r) {
  const f = { on: true, ops: [...((S.fog && S.fog.ops) || [])] };
  f.ops.push({ t, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) });
  if (f.ops.length > 400) {
    toast("A névoa tem marcações demais. Use Cobrir tudo e revele de novo.");
    return;
  }
  salvarFog(f);
}

/* ---------- desenhos ---------- */
function drawPath(pts) {
  if (!pts || pts.length < 2) return "";
  let d = `M${pts[0]} ${pts[1]}`;
  for (let i = 2; i < pts.length; i += 2) d += ` L${pts[i]} ${pts[i + 1]}`;
  return d;
}
function renderDraws() {
  const s = $("#drawL");
  if (!s) return;
  s.innerHTML = (S.draws || [])
    .slice()
    .sort((a, b) => (a.ts || 0) - (b.ts || 0))
    .map(d =>
      d.pts && d.pts.length === 2
        ? `<circle cx="${d.pts[0]}" cy="${d.pts[1]}" r="${(d.w || 4) / 1.5}" fill="${esc(d.cor)}"/>`
        : `<path d="${drawPath(d.pts)}" fill="none" stroke="${esc(d.cor)}" stroke-width="${d.w || 4}" stroke-linecap="round" stroke-linejoin="round"/>`
    )
    .join("");
}
function simplificar(pts, tol) {
  // reduz pontos de um traço (Ramer–Douglas–Peucker)
  const P2 = [];
  for (let i = 0; i < pts.length; i += 2) P2.push([pts[i], pts[i + 1]]);
  const keep = new Array(P2.length).fill(false);
  keep[0] = keep[P2.length - 1] = true;
  const st = [[0, P2.length - 1]];
  while (st.length) {
    const [a, b] = st.pop();
    let md = 0,
      mi = -1;
    const [x1, y1] = P2[a],
      [x2, y2] = P2[b];
    const L = Math.hypot(x2 - x1, y2 - y1) || 1;
    for (let i = a + 1; i < b; i++) {
      const [x, y] = P2[i];
      const dd = Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) / L;
      if (dd > md) {
        md = dd;
        mi = i;
      }
    }
    if (md > tol && mi > 0) {
      keep[mi] = true;
      st.push([a, mi], [mi, b]);
    }
  }
  const out = [];
  P2.forEach((p, i) => {
    if (keep[i]) out.push(Math.round(p[0]), Math.round(p[1]));
  });
  return out;
}

/* ---------- ping e régua ---------- */
function showPing(p) {
  const s = $("#ovL");
  if (!s) return;
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("class", "ping");
  g.innerHTML = `<circle cx="${p.x}" cy="${p.y}" r="10" fill="${esc(p.cor)}"/><circle class="pr" cx="${p.x}" cy="${p.y}" r="10" fill="none" stroke="${esc(p.cor)}"/><circle class="pr d2" cx="${p.x}" cy="${p.y}" r="10" fill="none" stroke="${esc(p.cor)}"/><text x="${p.x}" y="${p.y}" dy="-26" text-anchor="middle">${esc(p.quem || "")}</text>`;
  s.appendChild(g);
  setTimeout(() => g.remove(), 2600);
}
function metros(px) {
  const b = tokenBase();
  const cas = px / b;
  return { cas, m: Math.round(cas * 1.5 * 2) / 2 };
}
function renderOverlay() {
  const s = $("#ovL");
  if (!s) return;
  s.querySelectorAll(".live").forEach(n => n.remove());
  const k = 1 / V.z;
  let h = "";
  if (S.regua) {
    const { a, b } = S.regua;
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    const { cas, m } = metros(d);
    h += `<g class="live"><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#fff" stroke-width="${4 * k}" stroke-dasharray="${10 * k} ${6 * k}"/><circle cx="${a.x}" cy="${a.y}" r="${6 * k}" fill="#b47dff"/><circle cx="${b.x}" cy="${b.y}" r="${6 * k}" fill="#b47dff"/>
      <g transform="translate(${b.x} ${b.y}) scale(${k})"><rect x="12" y="-34" width="${m >= 100 ? 132 : 118}" height="28" rx="6" fill="rgba(20,16,25,.92)" stroke="#8b3ff0"/><text x="22" y="-15" class="rt">${m.toLocaleString("pt-BR")} m · ${cas.toFixed(1).replace(".", ",")} q</text></g></g>`;
  }
  if (S.live && S.live.pts) {
    h += `<path class="live" d="${drawPath(S.live.pts)}" fill="none" stroke="${esc(S.live.cor)}" stroke-width="${S.live.w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  if (S.live && S.live.rect) {
    const r = S.live.rect;
    h += `<rect class="live" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${S.live.t === "r" ? "rgba(180,125,255,.18)" : "rgba(0,0,0,.45)"}" stroke="${S.live.t === "r" ? "#b47dff" : "#ff4d5e"}" stroke-width="${2 * k}" stroke-dasharray="${8 * k} ${5 * k}"/>`;
  }
  if (h) s.insertAdjacentHTML("beforeend", h);
}

/* ---------- ferramentas ---------- */
function toolDown(tool, p, e) {
  if (tool === "regua") {
    S.regua = { a: p, b: p };
    renderOverlay();
    return {
      move: q => {
        S.regua.b = q;
        renderOverlay();
      },
      up: () => {
        clearTimeout(S.reguaT);
        S.reguaT = setTimeout(() => {
          S.regua = null;
          renderOverlay();
        }, 4000);
      }
    };
  }
  if (tool === "ping") {
    const doc = {
      sid: S.viewSid,
      x: Math.round(p.x),
      y: Math.round(p.y),
      cor: S.drawCor || corDe(S.uid),
      quem: myName(),
      autor: S.uid,
      ts: Date.now()
    };
    S.db
      .add(P() + "/pings", doc)
      .then(id => {
        S.pingSeen.add(id);
      })
      .catch(fail);
    showPing(doc);
    (S.pings || [])
      .filter(x => x.autor === S.uid && Date.now() - (x.ts || 0) > 60000)
      .forEach(x => S.db.del(P() + "/pings/" + x.id).catch(() => {}));
    return { move() {}, up() {} };
  }
  if (tool === "desenho") {
    const cor = S.drawCor || corDe(S.uid);
    const w = Math.max(2, Math.round((S.drawW || 4) / Math.max(0.25, V.z)));
    S.live = { pts: [Math.round(p.x), Math.round(p.y)], cor, w };
    renderOverlay();
    return {
      move: q => {
        const L = S.live.pts;
        const lx = L[L.length - 2],
          ly = L[L.length - 1];
        if (Math.hypot(q.x - lx, q.y - ly) < 2 / V.z) return;
        L.push(Math.round(q.x), Math.round(q.y));
        renderOverlay();
      },
      up: () => {
        const L = S.live.pts;
        S.live = null;
        renderOverlay();
        let pts = L.length > 4 ? simplificar(L, 1 / V.z) : L;
        if (pts.length > 1000) pts = simplificar(L, 3 / V.z).slice(0, 1000);
        const doc = { sid: S.viewSid, autor: S.uid, cor, w, pts, ts: Date.now() };
        S.draws = [...(S.draws || []), { id: "tmp", ...doc }];
        renderDraws();
        S.db.add(P() + "/desenhos", doc).catch(fail);
      }
    };
  }
  if (tool === "borracha") {
    apagarPerto(p);
    return { move: q => apagarPerto(q), up() {} };
  }
  if ((tool === "revelar" || tool === "esconder") && S.isM) {
    const t = tool === "revelar" ? "r" : "h";
    S.live = { rect: { x: p.x, y: p.y, w: 0, h: 0 }, t, a: p };
    return {
      move: q => {
        const a = S.live.a;
        S.live.rect = {
          x: Math.min(a.x, q.x),
          y: Math.min(a.y, q.y),
          w: Math.abs(q.x - a.x),
          h: Math.abs(q.y - a.y)
        };
        renderOverlay();
      },
      up: () => {
        const r = S.live.rect;
        S.live = null;
        renderOverlay();
        if (r.w > 4 && r.h > 4) fogOp(t, r);
      }
    };
  }
  return null;
}
function apagarPerto(p) {
  const tol = 14 / V.z;
  (S.draws || []).forEach(d => {
    if (d.id === "tmp" || !(S.isM || d.autor === S.uid) || (S.apagando && S.apagando.has(d.id))) return;
    const P2 = d.pts || [];
    for (let i = 0; i < P2.length; i += 2) {
      if (Math.hypot(P2[i] - p.x, P2[i + 1] - p.y) < tol + (d.w || 4) / 2) {
        (S.apagando = S.apagando || new Set()).add(d.id);
        S.draws = S.draws.filter(x => x.id !== d.id);
        renderDraws();
        S.db.del(P() + "/desenhos/" + d.id).catch(fail);
        break;
      }
    }
  });
}
function setMode(m) {
  S.mode = m;
  S.regua = null;
  S.live = null;
  board.dataset.mode = m;
  renderOverlay();
  renderMapTools();
}
const TOOLS = [
  ["mover", "Mover e selecionar (V)", '<path d="M5 3l14 8-6 2-2 6Z"/>'],
  ["regua", "Régua (R)", '<path d="M3 17 17 3l4 4L7 21Z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>'],
  ["ping", "Apontar (P)", '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/>'],
  ["desenho", "Desenhar (D)", '<path d="M4 20c4 0 4-4 8-4s4 4 8 4"/><path d="M14 4l6 6-8 8H6v-6Z"/>'],
  ["borracha", "Apagar desenhos (E)", '<path d="M4 16 14 6l6 6-8 8H8Z"/><path d="M4 20h16"/>']
];
function renderMapTools() {
  const el = $("#mapTools");
  if (!el) return;
  const sc = curScene();
  if (!sc || !S.sceneImg[S.viewSid]) {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  const m = S.mode || "mover";
  const svg = d =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  el.innerHTML =
    TOOLS.map(
      ([k, n, d]) =>
        `<button class="mt" data-mt="${k}" aria-pressed="${m === k}" title="${n}" aria-label="${n}">${svg(d)}</button>`
    ).join("") +
    (S.isM
      ? `<span class="mtsep"></span><button class="mt" data-mt="revelar" aria-pressed="${m === "revelar"}" title="Névoa: revelar área" aria-label="Revelar área da névoa">${svg('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>')}</button><button class="mt" data-mt="esconder" aria-pressed="${m === "esconder"}" title="Névoa: esconder área" aria-label="Esconder área com névoa">${svg('<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6A17 17 0 0 0 2 12s4 7 10 7a9.6 9.6 0 0 0 5.4-1.6"/>')}</button>`
      : "") +
    (m === "desenho" || m === "ping"
      ? `<span class="mtsep"></span>${COR_TOKEN.slice(0, 6)
          .map(
            c =>
              `<button class="mtc" data-cor="${c}" aria-pressed="${(S.drawCor || corDe(S.uid)) === c}" style="--c:${c}" aria-label="Cor ${c}"></button>`
          )
          .join("")}`
      : "") +
    (m === "borracha"
      ? `<span class="mtsep"></span><button class="mtb" id="mtLimpar">${S.isM ? "Apagar todos" : "Apagar meus"}</button>`
      : "") +
    (S.isM && (sc.nomes || []).length
      ? `<span class="mtsep"></span><button class="mt" id="nomesTog" aria-pressed="${sc.nomesOn !== false}" title="${sc.nomesOn !== false ? "Nomes dos lugares: ligados (clique para esconder dos jogadores)" : "Nomes dos lugares: desligados (clique para mostrar)"}" aria-label="Ligar ou desligar nomes dos lugares">${svg('<path d="M4 7V5h16v2M12 5v14M9 19h6"/>' + (sc.nomesOn !== false ? "" : '<path d="M3 3l18 18"/>'))}</button>`
      : "") +
    (m === "revelar" || m === "esconder"
      ? `<span class="mtsep"></span><button class="mtb" id="fogTog">${fogOn() ? "Desligar névoa" : "Ligar névoa"}</button><button class="mtb" id="fogAll">Revelar tudo</button><button class="mtb" id="fogNone">Cobrir tudo</button>`
      : "");
  $$("[data-mt]").forEach(b => (b.onclick = () => setMode(b.dataset.mt)));
  $$("[data-cor]").forEach(
    b =>
      (b.onclick = () => {
        S.drawCor = b.dataset.cor;
        renderMapTools();
      })
  );
  const lp = $("#mtLimpar");
  if (lp)
    lp.onclick = async () => {
      const alvo = (S.draws || []).filter(d => d.id !== "tmp" && (S.isM || d.autor === S.uid));
      if (!alvo.length) return;
      if (
        !(await confirmBox(
          S.isM ? "Apagar todos os desenhos desta cena?" : "Apagar seus desenhos desta cena?",
          "Some para todo mundo.",
          "Apagar"
        ))
      )
        return;
      S.draws = S.draws.filter(d => !alvo.includes(d));
      renderDraws();
      for (const d of alvo) {
        try {
          await S.db.del(P() + "/desenhos/" + d.id);
        } catch (e) {
          fail(e);
          break;
        }
      }
    };
  const nt = $("#nomesTog");
  if (nt)
    nt.onclick = async () => {
      const on = sc.nomesOn === false;
      sc.nomesOn = on;
      renderNomes();
      renderMapTools();
      toast(
        on ? "Nomes dos lugares aparecem para os jogadores." : "Nomes dos lugares escondidos dos jogadores."
      );
      try {
        await S.db.merge(P() + "/cenas/" + sc.id, { nomesOn: on });
      } catch (e) {
        fail(e);
      }
    };
  const ft = $("#fogTog");
  if (ft) ft.onclick = () => salvarFog({ on: !fogOn(), ops: (S.fog && S.fog.ops) || [] });
  const fa = $("#fogAll");
  if (fa) fa.onclick = () => salvarFog({ on: true, ops: [{ t: "r", x: 0, y: 0, w: V.w, h: V.h }] });
  const fn = $("#fogNone");
  if (fn) fn.onclick = () => salvarFog({ on: true, ops: [] });
}

/* ---------- desenho do tabuleiro ---------- */
function tokVisivel(t, p) {
  if (S.isM) return true;
  if (canMove(t)) return true;
  if (t.oculto) return false;
  return !hiddenAt(p.x, p.y);
}
function renderBoard() {
  // o mestre copia fotos/artes de NPC para os tokens logo depois (5s-docs-mapa.js)
  if (S.isM && typeof agendarSyncFotoNpc === "function") agendarSyncFotoNpc();
  // enquanto alguém arrasta um token, não redesenha por baixo do dedo; redesenha ao soltar
  if (S.dragging) {
    S.boardPend = true;
    return;
  }
  S.boardPend = false;
  const empty = $("#boardEmpty");
  const sc = curScene();
  const url = S.viewSid && S.sceneImg[S.viewSid];
  if (!S.mesaId) return;
  if (!S.viewSid || !url || !sc) {
    vp.innerHTML = "";
    V.w = 0;
    $("#zoomCtl").hidden = true;
    $("#tokbar").hidden = true;
    empty.hidden = false;
    renderMapTools();
    let msg;
    if (S.viewSid && (!url || !sc)) msg = `<div class="in"><p>Carregando a cena…</p></div>`;
    else if (S.isM && !S.cenas.length)
      msg = `<div class="in">${I.mapa.replace("<svg", '<svg width="56" height="56"')}<h2>A mesa está vazia</h2><p>Crie uma cena com um mapa, cenário ou documento. Depois coloque os tokens dos agentes e das criaturas.</p><button class="btn primary" data-open-tool="cenas">Criar a primeira cena</button></div>`;
    else if (S.isM)
      msg = `<div class="in">${I.mapa.replace("<svg", '<svg width="56" height="56"')}<h2>Nenhuma cena aberta</h2><p>Escolha uma cena no painel Cenas para ver ou exibir para os jogadores.</p><button class="btn primary" data-open-tool="cenas">Abrir cenas</button></div>`;
    else
      msg = `<div class="in">${I.logo(96)}<h2>Aguardando o mestre</h2><p>Quando o mestre exibir uma cena, ela aparece aqui. Enquanto isso, monte sua ficha em Agentes.</p><button class="btn primary" data-open-tool="agentes">Abrir agentes</button></div>`;
    empty.innerHTML = msg;
    $$("[data-open-tool]").forEach(b => (b.onclick = () => openTool(b.dataset.openTool)));
    return;
  }
  empty.hidden = true;
  $("#zoomCtl").hidden = false;
  const first =
    !vp.querySelector("img.map") || vp.dataset.sid !== S.viewSid + ":" + sc.w + ":" + (sc.ver || 0);
  V.w = sc.w;
  V.h = sc.h;
  const base = tokenBase();
  const toks = Object.entries(S.pos)
    .map(([tid, p]) => {
      const t = S.tokens.find(x => x.id === tid);
      if (!t || !tokVisivel(t, p)) return "";
      const h = Math.round(base * (p.s || 1));
      const hp = tokHP(t);
      const u = tokUrl(t);
      const dim = S.isM && (t.oculto || hiddenAt(p.x, p.y));
      const hpb = hp
        ? `<div class="hp" style="width:${Math.max(30, h * 0.8)}px"><i style="width:${Math.max(0, Math.min(100, (hp[0] / hp[1]) * 100))}%"></i></div>`
        : "";
      const img =
        t.forma === "redondo" || t.forma === "quadrado"
          ? `<div class="tokr ${t.forma === "quadrado" ? "q" : ""}" style="width:${h}px;height:${h}px;--c:${esc(t.cor || "#b47dff")};border-width:${Math.max(2, Math.round(h / (t.forma === "quadrado" ? 30 : 18)))}px">${u ? `<img src="${u}" alt="">` : `<b style="font-size:${h * 0.45}px">${esc((tokNome(t) || "?").charAt(0))}</b>`}</div>`
          : `<img src="${u}" alt="" style="height:${h}px">`;
      return `<div class="tok ${S.sel === tid ? "sel" : ""} ${canMove(t) ? "" : "locked"} ${dim ? "dim" : ""} ${tokenDaVez(t) ? "vez" : ""}" data-tok="${esc(tid)}" style="left:${p.x}px;top:${p.y}px">${img}${hpb}<span class="tn">${esc(tokNome(t))}${t.oculto && S.isM ? " (oculto)" : ""}</span></div>`;
    })
    .join("");
  const grid =
    sc && sc.grade ? `<div class="grid-ov" style="background-size:${base}px ${base}px"></div>` : "";
  if (first) {
    vp.innerHTML = `<img class="map" src="${url}" alt="${esc(sc ? sc.nome : "")}" width="${V.w}" height="${V.h}">${grid}
     <svg id="drawL" class="layer" viewBox="0 0 ${V.w} ${V.h}" width="${V.w}" height="${V.h}"></svg>
     <div id="nomesL" class="layer nomes" style="width:${V.w}px;height:${V.h}px"></div>
     <canvas id="fogC" class="layer" width="${V.w}" height="${V.h}" hidden></canvas>
     <div id="portasL" class="layer portas" style="width:${V.w}px;height:${V.h}px"></div>
     <div id="passL" class="layer passagens" style="width:${V.w}px;height:${V.h}px"></div>
     <div id="toks">${toks}</div>
     <svg id="ovL" class="layer" viewBox="0 0 ${V.w} ${V.h}" width="${V.w}" height="${V.h}"></svg>`;
    vp.dataset.sid = S.viewSid + ":" + sc.w + ":" + (sc.ver || 0);
    if (!S.userMoved)
      requestAnimationFrame(() => {
        fitView();
        renderOverlay();
      });
    renderDraws();
    renderFog();
    renderNomes();
    renderPortas();
    renderPassagens();
  } else {
    renderNomes();
    renderPortas();
    renderPassagens();
    const g = vp.querySelector(".grid-ov");
    if (g) g.remove();
    if (grid) vp.querySelector("img.map").insertAdjacentHTML("afterend", grid);
    $("#toks").innerHTML = toks;
  }
  board.dataset.mode = S.mode || "mover";
  applyView();
  bindTokens_board();
  renderTokbar();
  renderMapTools();
}
function renderNomes() {
  const el = $("#nomesL");
  if (!el) return;
  const sc = curScene();
  const L = (sc && sc.nomes) || [];
  const on = sc && sc.nomesOn !== false;
  if (!S.isM && !on) {
    el.innerHTML = "";
    return;
  }
  el.innerHTML = L.map(n => {
    if (n.h && !S.isM) return "";
    const off = !on || n.h;
    return `<span class="${off ? "off" : ""}" style="left:${n.x}px;top:${n.y}px;font-size:${n.s}px;color:${esc(n.cor || "#e9e4d8")};${n.fonte === "serif" ? "font-family:var(--f-display);" : "font-weight:700;"}${n.r ? `transform:translate(-50%,-50%) rotate(${n.r}deg);` : ""}">${esc(n.t)}</span>`;
  }).join("");
}
function bindTokens_board() {
  $$(".tok").forEach(el => {
    const tid = el.dataset.tok;
    const t = S.tokens.find(x => x.id === tid);
    el.onpointerdown = e => {
      if ((S.mode || "mover") !== "mover") return;
      e.stopPropagation();
      e.preventDefault();
      const p = S.pos[tid];
      if (!p) return;
      const start = { x: e.clientX, y: e.clientY, px: p.x, py: p.y };
      let moved = false;
      const mv = canMove(t);
      try {
        el.setPointerCapture(e.pointerId);
      } catch (_) {}
      if (mv) S.dragging = true;
      let avisou = false;
      el.onpointermove = ev => {
        if (!mv) {
          if (!avisou && Math.abs(ev.clientX - start.x) + Math.abs(ev.clientY - start.y) > 12) {
            avisou = true;
            toast("Você só pode mover o seu personagem.");
          }
          return;
        }
        const dx = (ev.clientX - start.x) / V.z,
          dy = (ev.clientY - start.y) / V.z;
        if (Math.abs(dx) + Math.abs(dy) > 3 / V.z) moved = true;
        if (moved) {
          el.style.left = start.px + dx + "px";
          el.style.top = start.py + dy + "px";
        }
      };
      el.onpointerup = el.onpointercancel = ev => {
        el.onpointermove = null;
        el.onpointerup = null;
        el.onpointercancel = null;
        S.dragging = false;
        if (moved) {
          let nx = Math.round(start.px + (ev.clientX - start.x) / V.z),
            ny = Math.round(start.py + (ev.clientY - start.y) / V.z);
          const sc = curScene();
          if (sc && sc.grade && sc.encaixe) {
            const b = tokenBase();
            nx = Math.floor(nx / b) * b + b / 2;
            ny = Math.floor(ny / b) * b + b / 2;
          }
          nx = Math.max(0, Math.min(V.w, nx));
          ny = Math.max(0, Math.min(V.h, ny));
          S.pos[tid] = { ...S.pos[tid], x: nx, y: ny };
          S.db.setKey(P() + "/pos/" + S.viewSid, "tokens", tid, S.pos[tid], { ult: tid }).catch(fail);
          renderBoard();
        } else {
          S.sel = S.sel === tid ? null : tid;
          renderBoard();
        }
      };
    };
  });
}
function renderTokbar() {
  const bar = $("#tokbar");
  const tid = S.sel;
  const t = tid && S.tokens.find(x => x.id === tid);
  const p = tid && S.pos[tid];
  if (!t || !p) {
    bar.hidden = true;
    return;
  }
  const f = t.fichaId && S.fichas[t.fichaId];
  const mv = canMove(t);
  bar.hidden = false;
  const hp = tokHP(t);
  bar.innerHTML = `<div class="row between"><b>${esc(tokNome(t))}</b><button class="x" id="tbX" aria-label="Fechar">✕</button></div>
   ${f ? `<div class="muted small">PV ${cur(f, "pv")}/${derivados(f).pvMax} · SAN ${cur(f, "san")}/${derivados(f).sanMax} · DEF ${derivados(f).def}</div>` : hp ? `<div class="muted small">PV ${hp[0]}/${hp[1]}</div>` : ""}
   ${
     mv
       ? `<div class="row"><span class="muted small">Tamanho</span><button class="btn sm" id="tbM">−</button><span class="small" style="font-family:var(--f-mono)">${Math.round((p.s || 1) * 100)}%</span><button class="btn sm" id="tbP">+</button></div>
   ${(t.forma === "redondo" || t.forma === "quadrado") && (t.dono === S.uid || S.isM) ? `<div class="row" style="flex-wrap:nowrap;gap:6px"><button class="btn sm ${t.forma === "quadrado" ? "primary" : ""}" data-tforma="quadrado">▢ Quadrado</button><button class="btn sm ${t.forma === "redondo" ? "primary" : ""}" data-tforma="redondo">◯ Redondo</button></div><div class="swatches sm">${COR_TOKEN.map(c => `<button class="mtc" data-tcor="${c}" aria-pressed="${t.cor === c}" style="--c:${c}" aria-label="Moldura ${c}"></button>`).join("")}</div>` : ""}
   ${S.isM ? `<label class="check small"><input type="checkbox" id="tbOc" ${t.oculto ? "checked" : ""}> Oculto para os jogadores</label>` : ""}
   ${t.combId && S.isM ? `<div class="row"><button class="btn sm" id="tbDm">−5 PV</button><button class="btn sm" id="tbCu">+5 PV</button></div>` : ""}
   <div class="row">${f ? `<button class="btn sm" id="tbF">Ver ficha</button>` : ""}<button class="btn sm danger" id="tbR">Tirar de cena</button></div>`
       : f
         ? `<button class="btn sm" id="tbF">Ver ficha</button>`
         : ""
   }`;
  $("#tbX").onclick = () => {
    S.sel = null;
    renderBoard();
  };
  const sz = k => {
    S.pos[tid] = { ...p, s: Math.max(0.3, Math.min(5, Math.round(((p.s || 1) + k) * 10) / 10)) };
    S.db.setKey(P() + "/pos/" + S.viewSid, "tokens", tid, S.pos[tid], { ult: tid }).catch(fail);
    renderBoard();
  };
  if ($("#tbM")) {
    $("#tbM").onclick = () => sz(-0.1);
    $("#tbP").onclick = () => sz(0.1);
    $("#tbR").onclick = () => {
      tirarDeCena(tid);
    };
  }
  if ($("#tbF"))
    $("#tbF").onclick = () => {
      S.openFicha = t.fichaId;
      openTool("agentes");
    };
  $$("[data-tforma]").forEach(
    b =>
      (b.onclick = () => {
        t.forma = b.dataset.tforma;
        renderBoard();
        S.db.merge(P() + "/tokens/" + t.id, { forma: t.forma }).catch(fail);
      })
  );
  $$("[data-tcor]").forEach(
    b =>
      (b.onclick = () => {
        t.cor = b.dataset.tcor;
        renderBoard();
        S.db.merge(P() + "/tokens/" + t.id, { cor: t.cor }).catch(fail);
      })
  );
  const oc = $("#tbOc");
  if (oc)
    oc.onchange = () => {
      t.oculto = oc.checked;
      renderBoard();
      S.db.merge(P() + "/tokens/" + t.id, { oculto: t.oculto }).catch(fail);
    };
  const dpv = k => {
    const c = combBase();
    const x = c.lista.find(y => y.id === t.combId);
    if (!x) {
      toast("Essa ameaça não está mais no combate.");
      return;
    }
    x.pv = Math.max(0, Math.min(x.pvMax, x.pv + k));
    saveCombate(c);
    renderBoard();
  };
  if ($("#tbDm")) {
    $("#tbDm").onclick = () => dpv(-5);
    $("#tbCu").onclick = () => dpv(5);
  }
}
function renderBoardTop() {
  const top = $("#boardTop");
  if (!S.mesaId) {
    top.innerHTML = "";
    return;
  }
  const sc = curScene();
  const live = S.mesa && S.mesa.cenaAtiva;
  let h = `<span class="chip"><b style="font-family:var(--f-display);font-weight:400;font-size:15px">${esc(S.mesa ? S.mesa.nome : "")}</b><span class="muted" style="font-family:var(--f-mono);font-size:12px">${esc(S.mesaId)}</span></span>`;
  if (sc) {
    const isLive = sc.id === live;
    h += `<span class="chip ${isLive ? "" : "hidden-scene"}"><span class="dot"></span>${esc(sc.nome)}${S.isM ? ` · <span class="muted">${isLive ? "exibindo para jogadores" : "oculta para jogadores"}</span>` : ""}</span>`;
    if (S.isM && !isLive) h += `<button class="btn sm primary" id="btLive">Exibir para jogadores</button>`;
    if (S.isM && live && !isLive) h += `<button class="btn sm" id="btBack">Voltar à cena exibida</button>`;
  }
  const tc = S.trilha && S.trilha.tocando;
  if (tc)
    h += MZ.bloqueado
      ? `<button class="btn sm primary" id="btSom">♪ Ativar som da mesa</button>`
      : `<button class="chip" id="btTr" style="cursor:pointer;color:var(--fg)">♪ ${esc(tc.titulo || "Trilha")}${tc.play ? "" : " (pausada)"}</button>`;
  if (S.testMode) h += `<span class="tag red">Modo de teste</span>`;
  top.innerHTML = h;
  const bs = $("#btSom");
  if (bs) bs.onclick = destravarSom;
  const bt = $("#btTr");
  if (bt) bt.onclick = () => openTool("trilha");
  const b = $("#btLive");
  if (b) b.onclick = () => exibir(sc.id);
  const bb = $("#btBack");
  if (bb) bb.onclick = () => viewScene(live);
}
</script>
