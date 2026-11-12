"use strict";
/* Cenas: criar, exibir para os jogadores, trocar de cena. */
/* ===================== CENAS ===================== */
async function exibir(sid) {
  try {
    await S.db.merge(P(), { cenaAtiva: sid });
    toast(sid ? "Cena exibida para os jogadores." : "Nenhuma cena exibida agora.");
  } catch (e) {
    fail(e);
  }
}
function cenasHTML() {
  if (!S.isM) {
    const sc = S.cenas.find(c => c.id === (S.mesa && S.mesa.cenaAtiva));
    return `<p class="muted" style="margin:0">Só o mestre cria e troca as cenas.</p>${sc ? `<div class="scene live">${sc.thumb ? `<img class="th" src="${sc.thumb}" alt="">` : `<div class="th"></div>`}<div><div class="st">Exibindo agora</div><div class="nm">${esc(sc.nome)}</div></div></div>` : `<div class="empty">Nenhuma cena exibida agora.</div>`}`;
  }
  const live = S.mesa && S.mesa.cenaAtiva;
  const list = S.cenas
    .map(c => {
      const isL = c.id === live;
      return `<div class="scene ${isL ? "live" : ""}">${c.thumb ? `<img class="th" src="${c.thumb}" alt="">` : `<div class="th"></div>`}
    <div class="stack" style="gap:4px;min-width:0"><div class="st">${isL ? "Exibindo para jogadores" : "Oculta para jogadores"}${S.viewSid === c.id ? " · você está vendo" : ""}</div><div class="nm">${esc(c.nome)}</div>
    <div class="row">${isL ? `<button class="btn sm" data-stop>Parar de exibir</button>` : `<button class="btn sm primary" data-live="${esc(c.id)}">Exibir para jogadores</button>`}${S.viewSid !== c.id ? `<button class="btn sm" data-view="${esc(c.id)}">Ver</button>` : ""}${c.mapaId ? `<button class="btn sm ghost" data-emapa="${esc(c.mapaId)}">Editar mapa</button>` : ""}<button class="btn sm ghost" data-edit="${esc(c.id)}">Editar</button><button class="btn sm ghost" data-scopy="${esc(c.id)}" title="Copiar esta cena para outra mesa sua">Copiar p/ outra mesa</button><button class="btn sm ghost" data-spass="${esc(c.id)}" title="Escadas e elevadores que levam o grupo para outra cena">Passagens${(c.passagens || []).length ? ` (${c.passagens.length})` : ""}</button><button class="btn sm ghost" data-del="${esc(c.id)}" aria-label="Apagar cena">✕</button></div></div></div>`;
    })
    .join("");
  return `<div class="row" style="flex-wrap:nowrap"><button class="btn primary" style="flex:1" id="novaCena">Cena com imagem</button><button class="btn primary" style="flex:1" id="btnCriarMapa2">Criar mapa</button></div>
   <p class="muted small" style="margin:0">Use uma imagem sua (mapa, cenário, documento, pista) ou monte um mapa no criador, do zero ou a partir de um mapa pronto.</p>
   ${S.cenas.length ? `<div class="cards">${list}</div>` : `<div class="empty">Nenhuma cena ainda. Use uma imagem ou crie um mapa.</div>`}
   <details class="box" id="mapasBox"><summary style="cursor:pointer"><b>Meus mapas</b> <span class="muted small">(feitos no criador)</span></summary><div class="stack" style="margin-top:10px"><button class="btn sm" id="btnCriarMapa">Criar mapa novo</button><div class="cards" id="mapasList"><p class="muted small">Carregando…</p></div></div></details>`;
}
function bindCenas() {
  const n = $("#novaCena");
  if (n) n.onclick = novaCena;
  $$("[data-scopy]").forEach(b => (b.onclick = () => copiarCena(b.dataset.scopy))); // documentos/no-mapa
  $$("[data-spass]").forEach(b => (b.onclick = () => passagensModal(b.dataset.spass))); // mapa/portas
  const cm = $("#btnCriarMapa2");
  if (cm) cm.onclick = escolherModelo;
  const mb = $("#mapasBox");
  if (mb)
    mb.ontoggle = () => {
      if (mb.open && !mb.dataset.ok) {
        mb.dataset.ok = 1;
        bindMapas();
      }
    };
  $$("[data-emapa]").forEach(
    b =>
      (b.onclick = async () => {
        try {
          const m = await S.db.get(P() + "/mapas/" + b.dataset.emapa);
          if (!m) {
            toast("O mapa dessa cena foi apagado.");
            return;
          }
          meAbrir(m, b.dataset.emapa);
        } catch (e) {
          fail(e);
        }
      })
  );
  $$("[data-live]").forEach(
    b =>
      (b.onclick = async () => {
        await exibir(b.dataset.live);
        viewScene(b.dataset.live);
      })
  );
  $$("[data-stop]").forEach(b => (b.onclick = () => exibir(null)));
  $$("[data-view]").forEach(
    b =>
      (b.onclick = () => {
        viewScene(b.dataset.view);
        renderPanel();
      })
  );
  $$("[data-edit]").forEach(b => (b.onclick = () => editarCena(b.dataset.edit)));
  $$("[data-del]").forEach(
    b =>
      (b.onclick = async () => {
        const c = S.cenas.find(x => x.id === b.dataset.del);
        if (
          !(await confirmBox(
            "Apagar " + c.nome + "?",
            "A cena e a posição dos tokens nela somem para todos."
          ))
        )
          return;
        try {
          if (S.mesa.cenaAtiva === c.id) await S.db.merge(P(), { cenaAtiva: null });
          await S.db.del(P() + "/cenas/" + c.id);
          await S.db.del(P() + "/cenaImg/" + c.id);
          await S.db.del(P() + "/pos/" + c.id);
          delete S.sceneImg[c.id];
          if (S.viewSid === c.id) viewScene(S.mesa.cenaAtiva === c.id ? null : S.mesa.cenaAtiva);
        } catch (e) {
          fail(e);
        }
      })
  );
}
async function novaCena() {
  const file = await pickImage();
  if (!file) return;
  toast("Preparando a imagem…");
  let img;
  try {
    img = await compressScene(file);
  } catch (e) {
    toast("Não consegui usar essa imagem. Tente outra (JPG ou PNG).");
    return;
  }
  const nome0 = file.name.replace(/\.[^.]+$/, "").slice(0, 50);
  const r = await formBox(
    "Nova cena",
    `<img src="${img.url}" alt="" style="border-radius:6px;max-height:180px;object-fit:contain;background:var(--bg)">
    <div class="field"><label class="label" for="cn">Nome da cena</label><input type="text" id="cn" name="nome" value="${esc(nome0)}" maxlength="50" required></div>
    <label class="check"><input type="checkbox" name="grade"> Mostrar grade sobre o mapa</label>
    <label class="check"><input type="checkbox" name="exibir"> Já exibir para os jogadores</label>`,
    "Criar cena"
  );
  if (!r) return;
  const id = "c" + rid(8);
  const thumb = await thumbOf(img.url);
  try {
    await S.db.set(P() + "/cenaImg/" + id, { url: img.url });
    await S.db.set(P() + "/cenas/" + id, {
      nome: r.nome.trim() || "Cena",
      thumb,
      w: img.w,
      h: img.h,
      grade: !!r.grade,
      encaixe: false,
      tam: 0,
      criada: Date.now()
    });
    S.sceneImg[id] = img.url;
    if (r.exibir) await exibir(id);
    viewScene(id);
    toast("Cena criada.");
  } catch (e) {
    fail(e);
  }
}
async function editarCena(sid) {
  const c = S.cenas.find(x => x.id === sid);
  if (!c) return;
  const r = await formBox(
    "Editar cena",
    `<div class="field"><label class="label" for="en">Nome</label><input type="text" id="en" name="nome" value="${esc(c.nome)}" maxlength="50"></div>
   <label class="check"><input type="checkbox" name="grade" ${c.grade ? "checked" : ""}> Mostrar grade</label>
   <label class="check"><input type="checkbox" name="encaixe" ${c.encaixe ? "checked" : ""}> Tokens encaixam na grade</label>
   <div class="field"><label class="label" for="et">Tamanho da casa / token (px no mapa, 0 = automático)</label><input type="number" id="et" name="tam" value="${c.tam || 0}" min="0" max="600"></div>
   ${
     (c.nomes || []).length
       ? `<div class="sub" style="margin:0">Nomes dos lugares</div><label class="check"><input type="checkbox" name="nomesOn" ${c.nomesOn !== false ? "checked" : ""}> Mostrar nomes para os jogadores</label>
     <div class="stack" style="gap:2px;padding-left:22px">${c.nomes.map((n, i) => `<label class="check small"><input type="checkbox" name="nm${i}" ${n.h ? "" : "checked"}> ${esc(n.t)}</label>`).join("")}</div>`
       : ""
   }`
  );
  if (!r) return;
  const up = {
    nome: r.nome.trim() || c.nome,
    grade: !!r.grade,
    encaixe: !!r.encaixe,
    tam: Math.max(0, +r.tam || 0)
  };
  if ((c.nomes || []).length) {
    up.nomesOn = !!r.nomesOn;
    up.nomes = c.nomes.map((n, i) => ({ ...n, h: !r["nm" + i] }));
  }
  try {
    await S.db.merge(P() + "/cenas/" + sid, up);
  } catch (e) {
    fail(e);
  }
}

/* (tokens: ver mapa/tabuleiro) */
