"use strict";
/* Capa da mesa (lobby e tela de entrada). */
/* =====================================================================
   CAPA DA MESA: o mestre sobe uma imagem; ela aparece no cartão da mesa
   na tela inicial e na tela de entrada. Fica em portas/<id>.capa
   (todo mundo logado lê a porta).
   ===================================================================== */
S.capas = S.capas || {};
async function comprimirCapa(file) {
  const im = await loadImg(file);
  let w = 1280;
  for (let t = 0; t < 6; t++) {
    const k = Math.min(1, w / im.naturalWidth);
    const c = drawTo(im, im.naturalWidth * k, im.naturalHeight * k);
    for (const q of [0.8, 0.7, 0.6, 0.5]) {
      const u = c.toDataURL("image/jpeg", q);
      if (u.length <= 230000) return u;
    }
    w = Math.round(w * 0.8);
  }
  throw new Error("grande");
}
async function capaAtual(id, forcar) {
  if (!forcar && id in S.capas) return S.capas[id];
  try {
    const p = await S.db.get("portas/" + id);
    S.capas[id] = (p && p.capa) || "";
  } catch (e) {
    S.capas[id] = "";
  }
  return S.capas[id];
}
async function salvarCapa(url) {
  const id = S.mesaId;
  try {
    await S.db.merge("portas/" + id, { capa: url || "" });
    S.capas[id] = url || "";
    toast(url ? "Capa da mesa salva." : "Capa tirada.");
    if (S.tool === "escudo") renderPanel();
  } catch (e) {
    fail(e);
  }
}
function escolherCapa() {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = "image/*";
  inp.onchange = async () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    toast("Preparando a imagem…");
    try {
      await salvarCapa(await comprimirCapa(f));
    } catch (e) {
      toast("Não deu para usar essa imagem. Tente outra.");
    }
  };
  inp.click();
}

/* Escudo do mestre */
function escudoCapaHTML() {
  const u = S.capas[S.mesaId];
  return `<details class="box" open><summary style="cursor:pointer"><b>Capa da mesa</b> <span class="muted small">aparece na tela inicial e na tela de entrada</span></summary><div class="stack" style="margin-top:10px">
   ${u ? `<img class="capa-prev" src="${u}" alt="Capa da mesa">` : `<div class="capa-prev vazia">Sem capa ainda</div>`}
   <div class="row" style="gap:6px"><button class="btn sm" id="capaEsc">${u ? "Trocar imagem" : "Escolher imagem"}</button>${u ? `<button class="btn sm ghost" id="capaTira">Tirar capa</button>` : ""}</div>
   <p class="muted small" style="margin:0">Melhor em formato deitado (16:9). A imagem é reduzida para caber no banco grátis.</p></div></details>`;
}
function bindEscudoCapa() {
  const a = $("#capaEsc");
  if (a) a.onclick = escolherCapa;
  const b = $("#capaTira");
  if (b)
    b.onclick = async () => {
      if (await confirmBox("Tirar a capa da mesa?", "A mesa volta a aparecer sem imagem.", "Tirar"))
        salvarCapa("");
    };
  if (S.mesaId && !(S.mesaId in S.capas))
    capaAtual(S.mesaId).then(() => {
      if (S.tool === "escudo") renderPanel();
    });
}

/* tela inicial: capa em cima de cada cartão */
/* Lobby: põe a capa de cada mesa no card dela. */
function capasNoLobby() {
  $$("#lobby [data-mesa]").forEach(b => {
    const id = b.dataset.mesa;
    const pr = u => {
      if (u && !b.querySelector(".mesa-capa"))
        b.insertAdjacentHTML("afterbegin", `<img class="mesa-capa" src="${u}" alt="">`);
    };
    if (id in S.capas) pr(S.capas[id]);
    else capaAtual(id).then(pr);
  });
}

/* nome da ferramenta ao passar o mouse na barra lateral */
(() => {
  const tip = document.createElement("div");
  tip.id = "railTip";
  tip.setAttribute("aria-hidden", "true");
  document.body.appendChild(tip);
  const show = b => {
    const n = b.getAttribute("aria-label") || b.title;
    if (!n) return;
    const r = b.getBoundingClientRect();
    tip.textContent = n;
    tip.style.left = r.right + 8 + "px";
    tip.style.top = r.top + r.height / 2 + "px";
    tip.classList.add("on");
  };
  const hide = () => tip.classList.remove("on");
  document.addEventListener("mouseover", e => {
    const b = e.target.closest && e.target.closest(".rail button");
    if (b) show(b);
    else hide();
  });
  document.addEventListener("scroll", hide, true);
  document.addEventListener("pointerdown", hide, true);
})();
