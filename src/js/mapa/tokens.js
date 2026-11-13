"use strict";
/* Tokens: criar, mover, imagem, cor. */
/* ===================== TOKENS ===================== */
const COR_TOKEN = ["#b47dff", "#ff4d5e", "#e0a03c", "#5fae70", "#4fa3e0", "#e9e9f0", "#ff7ac8", "#2e2540"];
function corDe(uid) {
  let h = 0;
  for (const c of String(uid || "")) h = (h * 31 + c.charCodeAt(0)) | 0;
  return COR_TOKEN[Math.abs(h) % 6];
}
/* Imagem do token para quem está olhando. Jogador que não consegue ler a ficha do NPC
   usa a cópia da foto guardada no token (fotoNpc, ver documentos/no-mapa). */
function tokUrl(t) {
  const f = t && t.fichaId && S.fichas[t.fichaId];
  if (t && t.fotoNpc && !f) return t.fotoNpc;
  return tokUrlMestre(t);
}
/* Imagem que o mestre vê: foto da ficha, senão arte do bestiário, senão a imagem do token. */
function tokUrlMestre(t) {
  const f = t.fichaId && S.fichas[t.fichaId];
  if (t.usaFoto && f && f.foto) return fotoAtual(f); // foto por estado (ficha/ficha)
  const arte = arteDaBase((f && f.base) || t.ameaca); // arte que o mestre subiu (ficha/criaturas)
  if (arte) return arte;
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
    // filtro por elemento e ordem por VD; "Realidade" = sem elemento (pessoas e animais)
    const elDe = b => b.el || "Realidade";
    const B = allBest()
      .filter(b => !q || b.n.toLowerCase().includes(q))
      .filter(b => !S.ameEl || elDe(b) === S.ameEl)
      .sort((a, b) => (+a.vd || 0) - (+b.vd || 0));
    const chips = ["", "Sangue", "Morte", "Conhecimento", "Energia", "Medo", "Realidade"]
      .map(
        e =>
          `<button type="button" data-ameel="${e}" aria-pressed="${(S.ameEl || "") === e}">${e || "Todos"}</button>`
      )
      .join("");
    return `<input type="search" id="tokQ" placeholder="Pesquisar" value="${esc(S.tokQ || "")}">${tabsTok()}<div class="tabs2 ame-els">${chips}</div>${S.isM ? `<button class="btn sm ghost" id="galArtes2">Artes do bestiário (imagens suas)</button>` : ""}
     ${
       !S.isM
         ? `<div class="empty">Só o mestre coloca ameaças no mapa.</div>`
         : `${!S.viewSid ? `<div class="banner">Abra uma cena para colocar ameaças nela.</div>` : ""}
     <label class="check"><input type="checkbox" id="ameCombate" ${S.ameCombate !== false ? "checked" : ""}> Também colocar no combate (a vida aparece no token)</label>
     <label class="check"><input type="checkbox" id="ameOculto" ${S.ameOculto ? "checked" : ""}> Entrar oculto para os jogadores</label>
     <div class="cards">${B.map(b => `<div class="tokrow ame el-${esc(elDe(b))}"><img src="${(typeof arteDaBase === "function" && arteDaBase(b.n)) || arteThumbEl(b.el)}" alt="" style="width:52px;height:52px;object-fit:contain;border-radius:6px;background:#2a2c2e"><div style="min-width:0"><div style="font-weight:600">${esc(b.n)}${b.hb ? " (homebrew)" : ""}</div><div class="muted small">${esc(b.el || "Realidade")} · VD ${b.vd} · PV ${b.pv ?? "?"} · DEF ${b.def}</div></div><button class="btn sm primary" data-ame="${esc(b.n)}" ${S.viewSid ? "" : "disabled"}>Pôr em cena</button></div>`).join("")}</div>`
     }`;
  }
  // jogador: em cena só o que ele enxerga no mapa; na biblioteca só os tokens dele
  const em = S.tokens.filter(t => inScene.has(t.id) && match(t) && tokVisivel(t, S.pos[t.id]));
  let lib = S.tokens.filter(t => !inScene.has(t.id) && match(t) && (S.isM || canMove(t)));
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
  $$("[data-ame]").forEach(b => (b.onclick = () => ameacaEmCena(allBest().find(x => x.n === b.dataset.ame))));
  $$("[data-ameel]").forEach(
    b =>
      (b.onclick = () => {
        S.ameEl = b.dataset.ameel;
        renderPanel();
      })
  );
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
