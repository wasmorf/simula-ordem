<script>
"use strict";
/* =====================================================================
   PORTAS QUE ABREM E ANDARES LIGADOS
   Portas: ao virar cena, as portas do criador de mapas saem da imagem e
   viram peças na mesa. O mestre toca para abrir/fechar; abrir revela os
   locais escondidos dos dois lados.
     cena.portas = [{id,o,x,y,len,th,t,cor,aberta,trancada,locais:[ids]}]  (pixels)
   Porta trancada: o mestre segura o dedo (ou clica com o botão direito)
   numa porta fechada para trancar; ao tocar numa trancada, destranca.
   A "Porta trancada" do criador de mapas já entra trancada.
   Andares: o mestre põe passagens (escada, elevador...) que levam o grupo
   para outra cena, com os tokens dos agentes.
     cena.passagens = [{id,x,y,alvo,nome}]  (pixels)
   ===================================================================== */
const PORTA_TIPOS = ["porta", "portat", "portam", "portad", "portaf", "portao", "secreta"];

/* ---------- do mapa para a cena ---------- */
// Tira as portas da imagem e devolve a lista delas (em quadrados), juntando portas duplas e portões largos.
function portasDoMapa(M) {
  const ficam = [];
  const achadas = [];
  (M.paredes || []).forEach(s => {
    const [o, x, y, ...resto] = s.split(",");
    const v = resto.join(",");
    const m = v.match(/^a:([^:]+):(.*)$/);
    if (m && PORTA_TIPOS.includes(m[1])) achadas.push({ o, x: +x, y: +y, t: m[1], st: m[2] || "ordem" });
    else ficam.push(s);
  });
  achadas.sort(
    (a, b) =>
      (a.o + (a.o === "h" ? a.y : a.x)).localeCompare(b.o + (b.o === "h" ? b.y : b.x)) ||
      (a.o === "h" ? a.x - b.x : a.y - b.y)
  );
  const lista = [];
  achadas.forEach(p => {
    const u = lista[lista.length - 1];
    const ao = p.o === "h" ? p.x : p.y;
    if (
      u &&
      u.o === p.o &&
      u.t === p.t &&
      (p.o === "h" ? u.y === p.y : u.x === p.x) &&
      (p.o === "h" ? u.x : u.y) + u.n === ao
    )
      u.n++;
    else lista.push({ ...p, n: 1 });
  });
  // locais escondidos dos dois lados de cada porta
  const locais = (M.ocultos || []).map(a => ({ id: a.id, cel: ocCells(a) }));
  lista.forEach(p => {
    const lados = [];
    for (let i = 0; i < p.n; i++) {
      if (p.o === "h") lados.push([p.x + i, p.y - 1], [p.x + i, p.y]);
      else lados.push([p.x - 1, p.y + i], [p.x, p.y + i]);
    }
    p.locais = locais.filter(l => lados.some(([cx, cy]) => l.cel.has(cx + "," + cy))).map(l => l.id);
  });
  return { paredes: ficam, lista };
}
function portasEmPixels(lista, k, velhas) {
  const ab = {};
  (velhas || []).forEach(p => (ab[p.id] = p));
  return lista.map(p => {
    const P = (typeof MA_PAREDES !== "undefined" && MA_PAREDES.find(w => w.id === p.st)) || {
      t: 0.3,
      cor: "#151518"
    };
    const id = `${p.o},${p.x},${p.y}`;
    return {
      id,
      o: p.o,
      x: Math.round(p.x * k),
      y: Math.round(p.y * k),
      len: Math.round(p.n * k),
      th: Math.max(6, Math.round((P.t || 0.3) * k)),
      t: p.t === "portat" ? "porta" : p.t,
      cor: P.cor || "#151518",
      aberta: !!(ab[id] && ab[id].aberta),
      trancada: ab[id] ? !!ab[id].trancada : p.t === "portat",
      locais: p.locais
    };
  });
}

/* ---------- na mesa: portas ---------- */
function portaEscondida(p) {
  if (S.isM) return false;
  const k = p.th;
  const mx = p.o === "h" ? p.x + p.len / 2 : p.x;
  const my = p.o === "h" ? p.y : p.y + p.len / 2;
  const a = p.o === "h" ? [mx, my - k] : [mx - k, my];
  const b = p.o === "h" ? [mx, my + k] : [mx + k, my];
  return hiddenAt(a[0], a[1]) && hiddenAt(b[0], b[1]);
}
const CADEADO_ICO =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm2 0h6V7a3 3 0 0 0-6 0z"/></svg>';
function renderPortas() {
  const el = $("#portasL");
  if (!el) return;
  const sc = curScene();
  const L = (sc && sc.portas) || [];
  el.innerHTML = L.map((p, i) => {
    if (portaEscondida(p)) return "";
    if (p.t === "secreta" && !S.isM && !p.aberta) return ""; // os jogadores só veem parede
    const box =
      p.o === "h"
        ? `left:${p.x}px;top:${p.y - p.th / 2}px;width:${p.len}px;height:${p.th}px`
        : `left:${p.x - p.th / 2}px;top:${p.y}px;width:${p.th}px;height:${p.len}px`;
    const dupla = p.t === "portad" || (p.t !== "portao" && p.len > p.th * 4.2);
    const folhas = dupla ? `<i class="folha f1"></i><i class="folha f2"></i>` : `<i class="folha"></i>`;
    const tranc = p.trancada && !p.aberta;
    const dica = !S.isM
      ? tranc
        ? "Trancada"
        : ""
      : tranc
        ? "Trancada: toque para destrancar"
        : p.aberta
          ? "Fechar a porta"
          : "Abrir a porta (segure para trancar)";
    return `<div class="porta ${p.o} t-${p.t} ${p.aberta ? "aberta" : ""} ${dupla ? "dupla" : ""} ${tranc ? "trancada" : ""}" data-porta="${i}" style="${box};--cor:${p.cor}" title="${dica}">${folhas}${tranc ? `<b class="cadeado">${CADEADO_ICO}</b>` : ""}</div>`;
  }).join("");
  el.classList.toggle("mestre", !!S.isM);
  $$("#portasL [data-porta]").forEach(d => {
    const i = +d.dataset.porta;
    let segurou = false,
      tm = 0;
    d.onpointerdown = e => {
      e.stopPropagation();
      segurou = false;
      clearTimeout(tm);
      if (S.isM && e.button === 0)
        tm = setTimeout(() => {
          segurou = true;
          trancarPorta(i);
        }, 550);
    };
    d.onpointerup = d.onpointerleave = d.onpointercancel = () => clearTimeout(tm);
    d.oncontextmenu = e => {
      e.preventDefault();
      e.stopPropagation();
      clearTimeout(tm);
      if (S.isM && !segurou) trancarPorta(i);
      segurou = true;
    };
    d.onclick = e => {
      e.stopPropagation();
      if (segurou) {
        segurou = false;
        return;
      }
      const p = (curScene().portas || [])[i];
      if (!S.isM) {
        toast(
          p && p.trancada && !p.aberta
            ? "Esta porta está trancada. Fale com o mestre: talvez um teste de Crime ou Força abra."
            : "Só o mestre abre e fecha as portas."
        );
        return;
      }
      if (p && p.trancada && !p.aberta) destrancarPorta(i);
      else alternarPorta(i);
    };
  });
}
// Tranca uma porta fechada (ou destranca). Trancar uma porta aberta também fecha.
async function trancarPorta(i) {
  const sc = curScene();
  if (!sc || !sc.portas || !sc.portas[i]) return;
  const portas = JSON.parse(JSON.stringify(sc.portas));
  const p = portas[i];
  if (p.t === "portao" || p.t === "secreta") {
    if (!p.trancada) {
      toast("Este tipo de passagem não tranca.");
      return;
    }
  }
  p.trancada = !p.trancada;
  if (p.trancada) p.aberta = false;
  sc.portas = portas;
  renderPortas();
  toast(p.trancada ? "Porta trancada. Toque nela para destrancar." : "Porta destrancada.");
  try {
    await S.db.merge(P() + "/cenas/" + sc.id, { portas });
  } catch (e) {
    fail(e);
  }
}
async function destrancarPorta(i) {
  const r = await formBox(
    "Porta trancada",
    `<p class="muted small" style="margin:0">Os jogadores veem um cadeado. Destranque quando alguém passar no teste (Crime para abrir a fechadura, Força para arrombar) ou achar a chave.</p>
     <label class="check"><input type="checkbox" name="abrir" checked> Abrir a porta também</label>`,
    "Destrancar"
  );
  if (!r) return;
  const sc = curScene();
  if (!sc || !sc.portas || !sc.portas[i]) return;
  sc.portas = JSON.parse(JSON.stringify(sc.portas));
  sc.portas[i].trancada = false;
  if (r.abrir) await alternarPorta(i);
  else {
    renderPortas();
    try {
      await S.db.merge(P() + "/cenas/" + sc.id, { portas: sc.portas });
    } catch (e) {
      fail(e);
    }
  }
}
async function alternarPorta(i) {
  const sc = curScene();
  if (!sc || !sc.portas || !sc.portas[i]) return;
  const portas = JSON.parse(JSON.stringify(sc.portas));
  const p = portas[i];
  p.aberta = !p.aberta;
  const up = { portas };
  if (
    p.aberta &&
    (p.locais || []).length &&
    (sc.locais || []).some(l => p.locais.includes(l.id) && !l.aberto)
  )
    up.locais = sc.locais.map(l => (p.locais.includes(l.id) ? { ...l, aberto: true } : l));
  Object.assign(sc, up);
  renderPortas();
  if (up.locais) {
    renderFog();
    renderNomes();
  }
  try {
    await S.db.merge(P() + "/cenas/" + sc.id, up);
  } catch (e) {
    fail(e);
  }
}

/* ---------- na mesa: passagens entre cenas ---------- */
const PASS_ICO =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h5v-5h5v-5h5V5h3"/></svg>';
function nomeCenaId(id) {
  const c = (S.cenas || []).find(x => x.id === id);
  return c ? c.nome : "cena apagada";
}
function renderPassagens() {
  const el = $("#passL");
  if (!el) return;
  const sc = curScene();
  const L = (sc && sc.passagens) || [];
  el.innerHTML = L.map((p, i) =>
    !S.isM && hiddenAt(p.x, p.y)
      ? ""
      : `<button class="passagem" data-pass="${i}" style="left:${p.x}px;top:${p.y}px" title="${esc(p.nome || "Passagem")}">${PASS_ICO}<span>${esc(p.nome || "Passagem")} → ${esc(nomeCenaId(p.alvo))}</span></button>`
  ).join("");
  $$("#passL [data-pass]").forEach(b => {
    const i = +b.dataset.pass;
    b.onpointerdown = e => {
      e.stopPropagation();
      if (!S.isM) return;
      const p = L[i];
      const st = { x: e.clientX, y: e.clientY, px: p.x, py: p.y };
      let moved = false;
      try {
        b.setPointerCapture(e.pointerId);
      } catch (_) {}
      b.onpointermove = ev => {
        const dx = (ev.clientX - st.x) / V.z,
          dy = (ev.clientY - st.y) / V.z;
        if (!moved && Math.hypot(dx, dy) * V.z < 5) return;
        moved = true;
        p.x = Math.round(st.px + dx);
        p.y = Math.round(st.py + dy);
        b.style.left = p.x + "px";
        b.style.top = p.y + "px";
      };
      b.onpointerup = () => {
        b.onpointermove = b.onpointerup = null;
        if (moved) S.db.merge(P() + "/cenas/" + sc.id, { passagens: L }).catch(fail);
        else usarPassagem(i);
      };
    };
    b.onclick = e => {
      e.stopPropagation();
      if (!S.isM) toast("Só o mestre leva o grupo para outra cena.");
    };
  });
}
async function usarPassagem(i) {
  const sc = curScene();
  const p = sc && (sc.passagens || [])[i];
  if (!p) return;
  const alvo = (S.cenas || []).find(c => c.id === p.alvo);
  if (!alvo) {
    toast("A cena de destino foi apagada. Escolha outra em Cenas → Passagens.");
    return;
  }
  const r = await formBox(
    `${p.nome || "Passagem"} → ${alvo.nome}`,
    `<p class="muted small" style="margin:0">Todos vão para a cena <b>${esc(alvo.nome)}</b>.</p>
     <label class="check"><input type="checkbox" name="toks" checked> Levar os tokens dos agentes junto</label>`,
    "Levar o grupo"
  );
  if (!r) return;
  try {
    if (r.toks) await levarTokens(sc, alvo);
    await exibir(alvo.id);
    viewScene(alvo.id);
  } catch (e) {
    fail(e);
  }
}
// Leva os tokens dos agentes (fichas de jogadores) para perto da passagem que volta, ou para o meio da outra cena.
async function levarTokens(de, para) {
  const posDe = (await S.db.get(P() + "/pos/" + de.id)) || {};
  const tokens = (posDe && posDe.tokens) || {};
  const ag = Object.keys(tokens).filter(tid => {
    const t = (S.tokens || []).find(x => x.id === tid);
    const f = t && t.fichaId && S.fichas[t.fichaId];
    return f && !f.npc;
  });
  if (!ag.length) return;
  const volta = (para.passagens || []).find(q => q.alvo === de.id);
  const base = (para.tam || 50) * 1;
  const cx = volta ? volta.x : (para.w || 1000) / 2,
    cy = volta ? volta.y + base * 1.2 : (para.h || 800) / 2;
  for (let n = 0; n < ag.length; n++) {
    const a = (n / Math.max(1, ag.length)) * Math.PI * 2;
    const d = ag.length > 1 ? base * 0.9 : 0;
    const pos = {
      ...tokens[ag[n]],
      x: Math.round(cx + Math.cos(a) * d),
      y: Math.round(cy + Math.sin(a) * d)
    };
    await S.db.setKey(P() + "/pos/" + para.id, "tokens", ag[n], pos, { ult: ag[n] });
    await S.db.setKey(P() + "/pos/" + de.id, "tokens", ag[n], DEL, { ult: ag[n] });
  }
}
usarPassagem = umaVez(usarPassagem);

/* ---------- painel Cenas: gerenciar passagens ---------- */
async function passagensModal(sid) {
  const sc = (S.cenas || []).find(c => c.id === sid);
  if (!sc) return;
  const outras = (S.cenas || []).filter(c => c.id !== sid);
  if (!outras.length) {
    toast("Crie outra cena primeiro: a passagem leva de uma cena para outra.");
    return;
  }
  const L = sc.passagens || [];
  const r = await formBox(
    `Passagens em "${sc.nome}"`,
    `<p class="muted small" style="margin:0">Uma passagem (escada, elevador, porta para fora) aparece no mapa. Quando você toca nela, o grupo vai para a outra cena, com os tokens dos agentes. Ela entra no meio do mapa que está na tela; arraste para o lugar certo.</p>
     ${L.length ? `<div class="stack" style="gap:4px">${L.map((p, i) => `<label class="check"><input type="checkbox" name="del${i}"> Tirar "${esc(p.nome || "Passagem")}" → ${esc(nomeCenaId(p.alvo))}</label>`).join("")}</div>` : ""}
     <div class="sub" style="margin:6px 0 0">Nova passagem</div>
     <div class="field"><label class="label" for="psN">Nome</label><input type="text" id="psN" name="nome" maxlength="30" placeholder="Ex.: Escada, Elevador, Saída"></div>
     <div class="field"><label class="label" for="psA">Leva para</label><select id="psA" name="alvo"><option value="">(nenhuma)</option>${outras.map(c => `<option value="${esc(c.id)}">${esc(c.nome)}</option>`).join("")}</select></div>
     <label class="check"><input type="checkbox" name="volta" checked> Criar também a passagem de volta na outra cena</label>`,
    "Salvar"
  );
  if (!r) return;
  try {
    let nova = L.filter((p, i) => !r["del" + i]);
    if (r.alvo) {
      const vendo = S.viewSid === sid && V.w;
      const rr = board.getBoundingClientRect();
      const x = vendo ? Math.round((rr.width / 2 - V.x) / V.z) : Math.round((sc.w || 1000) / 2);
      const y = vendo ? Math.round((rr.height / 2 - V.y) / V.z) : Math.round((sc.h || 800) / 2);
      nova = nova.concat({ id: "p" + rid(6), x, y, alvo: r.alvo, nome: (r.nome || "").trim() || "Passagem" });
      if (r.volta) {
        const o = (S.cenas || []).find(c => c.id === r.alvo);
        if (o && !(o.passagens || []).some(q => q.alvo === sid)) {
          const vol = (o.passagens || []).concat({
            id: "p" + rid(6),
            x: Math.round((o.w || 1000) / 2),
            y: Math.round((o.h || 800) / 2),
            alvo: sid,
            nome: (r.nome || "").trim() || "Passagem"
          });
          await S.db.merge(P() + "/cenas/" + o.id, { passagens: vol });
        }
      }
    }
    await S.db.merge(P() + "/cenas/" + sid, { passagens: nova });
    toast(r.alvo ? "Passagem criada. Arraste no mapa para o lugar certo." : "Pronto.");
  } catch (e) {
    fail(e);
  }
}
</script>
