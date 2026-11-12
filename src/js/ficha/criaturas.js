"use strict";
/* Criaturas: ficha de criatura, arte por elemento, pôr pasta inteira na cena. */
/* =====================================================================
   CRIATURAS: ficha de criatura, criar criatura nova, arte por elemento,
   token automático para NPC e "pôr a pasta inteira na cena"
   ===================================================================== */
function maToURL(c) {
  let u = c.toDataURL("image/webp", 0.86);
  if (!u.startsWith("data:image/webp")) u = c.toDataURL("image/png");
  return u;
}
/* silhuetas originais de criatura, vistas de cima (fundo transparente) */
function arteCriatura(el, seed = 1) {
  const N = 256,
    c = document.createElement("canvas");
  c.width = c.height = N;
  const g = c.getContext("2d");
  const R = maRng(seed || 1);
  const cx = N / 2,
    cy = N / 2;
  const oldS = MA_S;
  MA_S = 78;
  g.shadowColor = "rgba(0,0,0,.6)";
  g.shadowBlur = 14;
  g.shadowOffsetY = 6;
  const halo = (col, r) => {
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r);
    gr.addColorStop(0, maA(col, 0.35));
    gr.addColorStop(1, maA(col, 0));
    g.save();
    g.shadowColor = "transparent";
    g.fillStyle = gr;
    g.fillRect(0, 0, N, N);
    g.restore();
  };
  const membro = (a, len, w, col, garra) => {
    const pts = [[cx, cy]];
    let x = cx,
      y = cy,
      ang = a;
    for (let i = 0; i < 4; i++) {
      ang += (R() - 0.5) * 0.6;
      x += (Math.cos(ang) * len) / 4;
      y += (Math.sin(ang) * len) / 4;
      pts.push([x, y]);
    }
    maLine(g, pts, MA_INK, w + 5);
    maLine(g, pts, col, w);
    if (garra)
      for (let k = -1; k <= 1; k++)
        maLine(
          g,
          [
            [x, y],
            [x + Math.cos(ang + k * 0.45) * w * 1.6, y + Math.sin(ang + k * 0.45) * w * 1.6]
          ],
          MA_INK,
          4
        );
  };
  if (el === "Sangue") {
    halo("#d3283b", 120);
    for (let i = 0; i < 6; i++)
      membro((i / 6) * 6.28 + R() * 0.3, 70 + R() * 30, 10 + R() * 6, "#6a1520", true);
    maBlob(g, cx, cy, 58, R, "#5a0f18", { n: 14, j: 0.35, k: 0.2 });
    for (let i = 0; i < 9; i++)
      maBlob(g, cx + (R() - 0.5) * 70, cy + (R() - 0.5) * 70, 8 + R() * 12, R, maTone("#8a1a26", R() * 0.2), {
        n: 8,
        ink: false
      });
    g.shadowColor = "transparent";
    for (let i = 0; i < 5; i++) {
      g.strokeStyle = "rgba(20,0,4,.7)";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(cx, cy);
      g.quadraticCurveTo(
        cx + (R() - 0.5) * 90,
        cy + (R() - 0.5) * 90,
        cx + (R() - 0.5) * 100,
        cy + (R() - 0.5) * 100
      );
      g.stroke();
    }
    maEll(g, cx, cy - 18, 22, 12, "#1a0205");
    g.fillStyle = "#e8d8c8";
    for (let i = 0; i < 7; i++) {
      g.beginPath();
      g.moveTo(cx - 18 + i * 6, cy - 24);
      g.lineTo(cx - 15 + i * 6, cy - 14);
      g.lineTo(cx - 12 + i * 6, cy - 24);
      g.fill();
    }
  } else if (el === "Morte") {
    halo("#3a3640", 125);
    g.save();
    g.shadowColor = "transparent";
    for (let i = 0; i < 14; i++) {
      const a = R() * 6.28,
        d = 50 + R() * 55;
      g.fillStyle = `rgba(20,18,24,${0.25 + R() * 0.3})`;
      g.beginPath();
      g.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 22 + R() * 20, 10 + R() * 8, a, 0, 7);
      g.fill();
    }
    g.restore();
    for (let i = 0; i < 4; i++) membro((i / 4) * 6.28 + 0.78, 62 + R() * 20, 7, "#3d3a40", true);
    maEll(g, cx, cy + 6, 42, 54, "#2a282d", { k: 0.2 });
    g.save();
    g.shadowColor = "transparent";
    g.strokeStyle = "rgba(190,190,200,.6)";
    g.lineWidth = 3;
    g.beginPath();
    for (let t = 0; t < 14; t += 0.15) {
      const r = 2.6 * t;
      g.lineTo(cx + Math.cos(t) * r, cy + 10 + Math.sin(t) * r);
    }
    g.stroke();
    g.restore();
    maCirc(g, cx, cy - 44, 20, "#cfcac0", { k: 0.25 });
    g.fillStyle = "#111";
    g.beginPath();
    g.arc(cx - 7, cy - 46, 5, 0, 7);
    g.arc(cx + 7, cy - 46, 5, 0, 7);
    g.fill();
  } else if (el === "Conhecimento") {
    halo("#e0b84a", 125);
    g.save();
    g.shadowColor = "#e0b84a";
    g.shadowBlur = 12;
    g.strokeStyle = "#e8c35a";
    for (let k = 0; k < 3; k++) {
      g.lineWidth = 3 - k * 0.6;
      g.beginPath();
      g.arc(cx, cy, 64 + k * 22, R() * 6, R() * 6 + 4.5);
      g.stroke();
    }
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * 6.28,
        d = 86;
      g.save();
      g.translate(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
      g.rotate(a);
      g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(-6, -6);
      g.lineTo(6, 0);
      g.lineTo(-6, 6);
      if (R() < 0.5) {
        g.moveTo(0, -7);
        g.lineTo(0, 7);
      }
      g.stroke();
      g.restore();
    }
    g.restore();
    maBlob(g, cx, cy, 50, R, "#2a2214", { n: 12, j: 0.25, k: 0.2 });
    for (let i = 0; i < 4; i++) membro((i / 4) * 6.28 + R(), 58, 6, "#3a2f18", false);
    maEll(g, cx, cy, 30, 18, "#f2e6c0", { k: 0.2 });
    maCirc(g, cx, cy, 13, "#d9a22a", { k: 0.3 });
    maCirc(g, cx, cy, 6, "#120d05", { ink: false });
  } else if (el === "Energia") {
    halo("#b45cff", 128);
    g.save();
    g.shadowColor = "#c88aff";
    g.shadowBlur = 16;
    for (let i = 0; i < 9; i++) {
      let x = cx,
        y = cy,
        a = R() * 6.28;
      g.beginPath();
      g.moveTo(x, y);
      for (let k = 0; k < 6; k++) {
        a += (R() - 0.5) * 1.4;
        x += Math.cos(a) * 16;
        y += Math.sin(a) * 16;
        g.lineTo(x, y);
      }
      g.strokeStyle = R() < 0.5 ? "#d9b0ff" : "#9a4aff";
      g.lineWidth = 2 + R() * 3;
      g.stroke();
    }
    g.restore();
    for (let i = 0; i < 7; i++) {
      g.save();
      g.translate(cx + (R() - 0.5) * 80, cy + (R() - 0.5) * 80);
      g.rotate(R() * 6);
      g.beginPath();
      g.moveTo(0, -24);
      g.lineTo(10, 0);
      g.lineTo(0, 10);
      g.lineTo(-10, 0);
      g.closePath();
      g.fillStyle = maGrad(g, -10, -24, 20, 34, "#7a2ad8", 0.35);
      g.fill();
      g.lineWidth = 3;
      g.strokeStyle = MA_INK;
      g.stroke();
      g.restore();
    }
    maBlob(g, cx, cy, 30, R, "#2a0a4a", { n: 9, j: 0.5 });
    maCirc(g, cx, cy, 14, "#f0dcff", { k: 0.1 });
  } else if (el === "Medo") {
    halo("#e8f0ff", 130);
    g.save();
    g.shadowColor = "transparent";
    for (let i = 0; i < 10; i++) {
      const a = R() * 6.28,
        d = 40 + R() * 60;
      g.fillStyle = `rgba(230,236,250,${0.06 + R() * 0.08})`;
      g.beginPath();
      g.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 30, 14, a, 0, 7);
      g.fill();
    }
    g.restore();
    for (let i = 0; i < 4; i++) membro([0.6, 2.5, 3.8, 5.6][i] + (R() - 0.5) * 0.3, 95, 5, "#d8dce6", true);
    maEll(g, cx, cy + 12, 22, 46, "#c9ced8", { k: 0.25 });
    maCirc(g, cx, cy - 40, 24, "#e6e9f0", { k: 0.2 });
    g.shadowColor = "transparent";
    g.fillStyle = "#0a0a10";
    for (let i = 0; i < 7; i++) {
      g.beginPath();
      g.ellipse(cx + (R() - 0.5) * 30, cy - 40 + (R() - 0.5) * 26, 3 + R() * 3, 2 + R() * 2, 0, 0, 7);
      g.fill();
    }
  } else {
    halo("#5aa8ff", 110);
    for (let i = 0; i < 4; i++) membro((i / 4) * 6.28 + 0.78 + R() * 0.4, 70, 9, "#2c2a33", true);
    maBlob(g, cx, cy, 50, R, "#24222b", { n: 12, j: 0.3, k: 0.2 });
    maCirc(g, cx - 14, cy - 16, 6, "#e0e6ff", { k: 0.1 });
    maCirc(g, cx + 14, cy - 16, 6, "#e0e6ff", { k: 0.1 });
  }
  MA_S = oldS;
  return maToURL(c);
}
/* retrato genérico para NPC sem arte (busto, sem rosto definido) */
function artePessoa(seed = 1) {
  const N = 256,
    c = document.createElement("canvas");
  c.width = c.height = N;
  const g = c.getContext("2d");
  const R = maRng(seed || 1);
  const oldS = MA_S;
  MA_S = 80;
  const bg = g.createRadialGradient(N * 0.5, N * 0.35, 10, N * 0.5, N * 0.5, N * 0.75);
  bg.addColorStop(0, "#3a3442");
  bg.addColorStop(1, "#0d0b10");
  g.fillStyle = bg;
  g.fillRect(0, 0, N, N);
  const roupa = maPick(["#2b2b33", "#3a2a22", "#1f3550", "#4a1c24", "#2f4a3a", "#55504a", "#1d1e23"], R),
    pele = maPick(["#e2b48f", "#c8946a", "#a06a45", "#7a4a2e", "#5a3622", "#f0c8a8"], R),
    cab = maPick(["#1a1410", "#3a2416", "#6a4a2a", "#2a2a2a", "#8a8a8a", "#b48a4a"], R);
  g.beginPath();
  g.moveTo(10, N);
  g.bezierCurveTo(14, 178, 70, 160, 128, 160);
  g.bezierCurveTo(186, 160, 242, 178, 246, N);
  g.closePath();
  g.fillStyle = maGrad(g, 0, 150, N, 110, roupa, 0.18);
  g.fill();
  g.lineWidth = 4;
  g.strokeStyle = MA_INK;
  g.stroke();
  g.beginPath();
  g.moveTo(104, 162);
  g.lineTo(128, 206);
  g.lineTo(152, 162);
  g.fillStyle = maTone(roupa, 0.35);
  g.fill();
  g.stroke();
  g.fillStyle = maTone(pele, -0.15);
  g.fillRect(112, 128, 32, 38);
  g.strokeRect(112, 128, 32, 38);
  maEll(g, 128, 104, 40, 50, pele, { k: 0.18 });
  const h = Math.floor(R() * 4);
  g.fillStyle = cab;
  g.beginPath();
  if (h === 0) {
    g.ellipse(128, 76, 44, 30, 0, Math.PI, 0);
    g.fill();
  } else if (h === 1) {
    g.ellipse(128, 82, 46, 38, 0, Math.PI * 1.05, -0.05);
    g.lineTo(172, 140);
    g.lineTo(162, 96);
    g.lineTo(94, 96);
    g.lineTo(84, 140);
    g.fill();
  } else if (h === 2) {
    g.ellipse(128, 70, 38, 18, 0, Math.PI, 0);
    g.fill();
  } else {
    g.ellipse(128, 90, 54, 62, 0, Math.PI * 1.08, -0.08);
    g.lineTo(182, 170);
    g.lineTo(166, 110);
    g.lineTo(90, 110);
    g.lineTo(74, 170);
    g.closePath();
    g.fillStyle = maTone(roupa, -0.1);
    g.fill();
  }
  g.fillStyle = "rgba(10,8,12,.55)";
  g.fillRect(104, 102, 16, 6);
  g.fillRect(136, 102, 16, 6);
  MA_S = oldS;
  return maToURL(c);
}

/* ---------- ficha de criatura ---------- */
function criaturaDe(b) {
  const f = novaFicha();
  const at = (b && b.at) || [1, 1, 1, 1, 1];
  Object.assign(f, {
    npc: true,
    criatura: true,
    rapido: true,
    visivel: false,
    dono: S.uid,
    nome: b ? b.n : "Nova criatura",
    base: b ? b.n : "",
    rel: b ? b.el || "" : "",
    rvd: b ? +b.vd || 0 : 0,
    rtipo: b ? `Criatura${b.el ? " de " + b.el : ""} · VD ${b.vd}` : "Criatura",
    rpv: b ? +b.pv || 10 : 20,
    rdef: b ? +b.def || 10 : 12,
    rdesl: 9,
    attr: { AGI: at[0] ?? 1, FOR: at[1] ?? 1, INT: at[2] ?? 1, PRE: at[3] ?? 1, VIG: at[4] ?? 1 },
    rper: [
      { n: "Fortitude", a: "VIG", b: 0 },
      { n: "Reflexos", a: "AGI", b: 0 },
      { n: "Vontade", a: "PRE", b: 0 }
    ],
    ratq:
      b && b.atk
        ? [{ n: b.atk[0], dd: +b.atk[1] || 1, a: "FOR", b: +b.atk[2] || 0, d: b.atk[3] || "", c: "20/x2" }]
        : [],
    rnotas: ""
  });
  const pm = b && String(b.pres || "").match(/DT\s*(\d+)\s*·?\s*(.*)/i);
  if (pm) {
    f.pdt = +pm[1];
    f.pdano = pm[2].trim();
  }
  f.pv = f.rpv;
  return f;
}
async function novaCriatura() {
  const B = allBest();
  const r = await formBox(
    "Criar criatura",
    `<div class="field"><label class="label" for="ncB">Começar de</label><select id="ncB" name="base"><option value="">Criatura nova (em branco)</option>${B.map((b, i) => `<option value="${i}">${esc(b.n)}${b.el ? " · " + esc(b.el) : ""} · VD ${b.vd}${b.hb ? " (homebrew)" : ""}</option>`).join("")}</select></div>
   <div class="row" style="flex-wrap:nowrap"><div class="field" style="flex:2"><label class="label" for="ncN">Nome</label><input type="text" id="ncN" name="nome" maxlength="40" placeholder="Deixe vazio para usar o da base"></div><div class="field" style="flex:1"><label class="label" for="ncQ">Quantas</label><input type="number" id="ncQ" name="qtd" min="1" max="12" value="1"></div></div>
   <div class="field"><label class="label" for="ncE">Elemento (para criatura nova)</label><select id="ncE" name="el">${["Sangue", "Morte", "Conhecimento", "Energia", "Medo", ""].map(e => `<option value="${e}">${e || "Nenhum"}</option>`).join("")}</select></div>
   <div class="field"><label class="label" for="ncP">Pasta</label><input type="text" id="ncP" name="pasta" maxlength="40" list="ncPastas" placeholder="Ex.: Missão do hospital"><datalist id="ncPastas">${npcPastas()
     .map(p => `<option value="${esc(p)}">`)
     .join("")}</datalist></div>
   <label class="check"><input type="checkbox" name="arte"> Escolher uma arte minha agora (senão usa a silhueta do elemento)</label>`,
    "Criar"
  );
  if (!r) return;
  const b = r.base === "" ? null : B[+r.base];
  const q = Math.max(1, Math.min(12, +r.qtd || 1));
  let foto = null;
  if (r.arte) {
    const file = await pickImage();
    if (file) {
      foto = await cropImage(file, {
        size: 300,
        ratio: 4 / 3,
        radius: 0.06,
        type: "image/webp",
        title: "Ajustar a arte da criatura"
      });
    }
  }
  let first = null;
  for (let i = 0; i < q; i++) {
    const id = "n" + rid(8);
    const f = criaturaDe(b);
    if (!b) {
      f.rel = r.el || "";
      f.rtipo = "Criatura" + (f.rel ? " de " + f.rel : "");
    }
    if (r.nome.trim()) f.nome = r.nome.trim();
    if (q > 1) f.nome += " " + (i + 1);
    if (r.pasta.trim()) f.pasta = r.pasta.trim();
    if (foto) f.foto = foto;
    f.criada = Date.now() + i;
    S.fichas[id] = f;
    saveFicha(id, true);
    first = first || id;
    await new Promise(z => setTimeout(z, 20));
  }
  if (q === 1) {
    S.openFicha = first;
    S.sheetTab = "principal";
  }
  renderPanel();
  toast(q > 1 ? `${q} criaturas criadas.` : "Criatura criada.");
}

/* ---------- lista: NPCs e criaturas separados, com "pôr na cena" por pasta ---------- */
/* Seção "Criaturas" da lista de Agentes, agrupada por pasta. */
function criaturasSecaoHTML(cri) {
  if (!cri.length && !S.isM) return "";
  const grupos = {};
  cri.forEach(id => {
    const p = S.fichas[id].pasta || "";
    (grupos[p] = grupos[p] || []).push(id);
  });
  return `<div class="row between" style="margin-top:6px"><span class="sub" style="margin:0">Criaturas</span>${S.isM ? `<span class="row" style="gap:4px"><button class="btn sm ghost" id="galArtes">Artes do bestiário</button><button class="btn sm" id="novaCri">Criar criatura</button></span>` : ""}</div>
     ${
       cri.length
         ? Object.keys(grupos)
             .sort()
             .map(
               p =>
                 `<div class="row between"><span class="muted small">${p ? esc(p) : Object.keys(grupos).length > 1 ? "Sem pasta" : ""}</span>${S.isM && S.viewSid ? `<button class="btn sm ghost" data-pgc="${esc(p)}" data-pgk="cri">Pôr ${p ? "a pasta" : "todas"} na cena</button>` : ""}</div><div class="cards">${grupos[p].map(npcCard).join("")}</div>`
             )
             .join("")
         : `<div class="muted small">${S.isM ? "Crie do zero ou a partir do bestiário. As criaturas que você põe em cena pelo painel Tokens também aparecem aqui." : "Nenhuma criatura visível."}</div>`
     }`;
}
/* Botão "Pôr a pasta / todos na cena" ao lado do título dos NPCs (mestre, com cena aberta). */
function npcPorNaCenaHTML(pessoas) {
  if (!S.isM || !S.viewSid || !pessoas.length) return "";
  const pastas = [...new Set(pessoas.map(id => S.fichas[id].pasta || ""))];
  const fp = S.npcPasta;
  const btn =
    fp && fp !== "*" && fp !== "—"
      ? `<button class="btn sm ghost" data-pgc="${esc(fp)}" data-pgk="npc">Pôr a pasta na cena</button>`
      : pastas.length === 1
        ? `<button class="btn sm ghost" data-pgc="${esc(pastas[0])}" data-pgk="npc">Pôr todos na cena</button>`
        : "";
  return `<span class="row" style="gap:4px">${btn}</span>`;
}
/* Avatar no card de NPC/criatura: foto; criatura sem foto usa a arte do bestiário ou a gerada. */
function npcAvatar(f) {
  if (f.foto || !f.criatura) return avatar(f);
  const url =
    arteDaBase(f.base) ||
    arteCriatura(f.rel || "", maH((f.nome || "").length, (f.base || f.nome || "x").charCodeAt(0), 5));
  return `<img class="avatar" src="${url}" alt="" style="width:52px;height:52px;object-fit:contain;background:#0d0b10">`;
}
async function porGrupoEmCena(pasta, kind) {
  if (!S.viewSid) {
    toast("Abra uma cena primeiro.");
    return;
  }
  const ids = Object.keys(S.fichas).filter(id => {
    const f = S.fichas[id];
    return f.npc && (kind === "cri" ? f.criatura : !f.criatura) && (f.pasta || "") === pasta;
  });
  if (!ids.length) return;
  const r = await formBox(
    `Pôr ${ids.length} na cena`,
    `<p class="muted small" style="margin:0">${ids.map(id => esc(S.fichas[id].nome)).join(", ")}</p>
   <label class="check"><input type="checkbox" name="oculto" checked> Começam ocultos (só você vê até revelar)</label><label class="check"><input type="checkbox" name="comb" ${kind === "cri" ? "checked" : ""}> Já entram no combate</label>`,
    "Pôr na cena"
  );
  if (!r) return;
  const base = tokenBase();
  const rr = board.getBoundingClientRect();
  const cx = (rr.width / 2 - V.x) / V.z,
    cy = (rr.height / 2 - V.y) / V.z;
  const cols = Math.min(5, ids.length);
  let k = 0;
  const c = r.comb ? combBase() : null;
  for (const id of ids) {
    const f = S.fichas[id];
    let t = S.tokens.find(x => x.fichaId === id);
    if (!t) {
      const url = f.foto
        ? ""
        : f.criatura
          ? arteCriatura(f.rel || "", maH((f.nome || "").length, (f.base || f.nome || "x").charCodeAt(0), 5))
          : artePessoa(maH((f.nome || "").length, (f.rtipo || f.nome || "x").charCodeAt(0), 9));
      const doc = {
        nome: f.nome,
        url,
        fichaId: id,
        forma: f.criatura ? "livre" : "quadrado",
        cor: "#4a4a52",
        usaFoto: true,
        oculto: !!r.oculto
      };
      const tid = await criarToken(doc, false);
      if (!tid) continue;
      t = { id: tid, ...doc, dono: S.uid };
      S.tokens.push(t);
    } else if (!!t.oculto !== !!r.oculto) {
      t.oculto = !!r.oculto;
      S.db.merge(P() + "/tokens/" + t.id, { oculto: t.oculto }).catch(() => {});
    }
    if (!S.pos[t.id]) {
      let spot = null;
      for (let ring = 0; ring < 12 && !spot; ring++)
        for (let dy = -ring; dy <= ring && !spot; dy++)
          for (let dx = -ring; dx <= ring && !spot; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
            const x = cx + dx * base * 1.15,
              y = cy + dy * base * 1.15;
            if (x < 0 || y < 0 || x > V.w || y > V.h) continue;
            if (!Object.values(S.pos).some(p => Math.hypot(p.x - x, p.y - y) < base * 0.9)) spot = { x, y };
          }
      porEmCena(t.id, spot || { x: cx, y: cy });
    }
    k++;
    if (c && !c.lista.some(x => x.fichaId === id))
      c.lista.push({ id: rid(5), tipo: "npcf", fichaId: id, nome: f.nome, ini: null });
  }
  if (c) saveCombate(c);
  renderBoard();
  toast(`${ids.length} na cena${r.oculto ? " (ocultos)" : ""}${c ? " e no combate" : ""}.`);
}

/* ---------- ameaça do bestiário em cena = criatura com ficha ---------- */
/* Põe uma ameaça do bestiário na cena: cria a ficha de criatura, o token e (se marcado) entra no combate. */
async function ameacaEmCena(b) {
  if (!b || !S.viewSid) return;
  const n = Object.values(S.fichas).filter(f => f.criatura && f.base === b.n).length;
  const id = "n" + rid(8);
  const f = criaturaDe(b);
  f.nome = b.n + (n ? " " + (n + 1) : "");
  f.criada = Date.now();
  S.fichas[id] = f;
  saveFicha(id, true);
  await criarToken(
    {
      nome: f.nome,
      url: arteCriatura(b.el, maH(f.nome.length, b.n.charCodeAt(0), 5)),
      fichaId: id,
      ameaca: b.n,
      forma: "livre",
      usaFoto: true,
      oculto: !!S.ameOculto
    },
    true
  );
  if (S.ameCombate !== false) {
    const c = combBase();
    c.lista.push({ id: rid(5), tipo: "npcf", fichaId: id, nome: f.nome, ini: null });
    saveCombate(c);
  }
  toast(
    `${f.nome} entrou em cena${S.ameCombate !== false ? " e no combate" : ""}. A ficha dela está em Agentes → Criaturas.`
  );
}

/* ---------- combate: abrir ficha e mexer na vida de NPCs/criaturas com ficha ---------- */
