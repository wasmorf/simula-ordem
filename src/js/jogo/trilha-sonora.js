"use strict";
/* Trilha sonora: YouTube, arquivos e músicas livres sincronizadas para todos. */
/* ===================== TRILHA SONORA ===================== */
const MZ = { el: null, yt: null, ytReady: false, cur: null, unlocked: false, vol: +lsGet("ms_mvol", 0.6) };
function ytId(u) {
  const m = String(u).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}
function subscribeTrilha() {
  subscribeMapDocs(); // documentos no mapa (documentos/no-mapa)
  if (S.trilhaUnsub) return;
  S.trilhaUnsub = S.db.listenDoc(
    P() + "/estado/trilhas",
    d => {
      S.trilha = d || { lista: [], tocando: null };
      aplicarTrilha();
      if (S.tool === "trilha") renderPanel();
      renderBoardTop();
    },
    () => {}
  );
}
function posAlvo(t) {
  return (t.pos || 0) + (t.play ? Math.max(0, (Date.now() - (t.at || Date.now())) / 1000) : 0);
}
function pararLocal() {
  if (MZ.el) {
    MZ.el.pause();
    MZ.el.removeAttribute("src");
    MZ.el.load();
  }
  if (MZ.yt && MZ.ytReady) {
    try {
      MZ.yt.stopVideo();
    } catch (e) {}
  }
  MZ.cur = null;
}
function aplicarTrilha() {
  const t = S.trilha && S.trilha.tocando;
  if (!t || !t.src) {
    pararLocal();
    return;
  }
  const vid = ytId(t.src);
  const vol = Math.max(0, Math.min(1, MZ.vol * (t.vol ?? 1)));
  if (vid) {
    if (MZ.el) MZ.el.pause();
    carregarYT(() => {
      if (MZ.cur !== t.src) {
        MZ.cur = t.src;
        MZ.yt.loadVideoById({ videoId: vid, startSeconds: posAlvo(t) });
        if (!t.play) setTimeout(() => MZ.yt.pauseVideo(), 400);
      }
      MZ.yt.setVolume(Math.round(vol * 100));
      const ct = MZ.yt.getCurrentTime ? MZ.yt.getCurrentTime() : 0;
      if (Math.abs(ct - posAlvo(t)) > 3) MZ.yt.seekTo(posAlvo(t), true);
      if (t.play) MZ.yt.playVideo();
      else MZ.yt.pauseVideo();
    });
    return;
  }
  if (MZ.yt && MZ.ytReady) {
    try {
      MZ.yt.stopVideo();
    } catch (e) {}
  }
  if (!MZ.el) {
    MZ.el = new Audio();
    MZ.el.preload = "auto";
    MZ.el.onerror = () => {
      if (S.isM)
        toast("Não consegui tocar essa música. Use um link direto de MP3/OGG ou de vídeo do YouTube.");
    };
  }
  MZ.el.loop = !!t.loop;
  MZ.el.volume = vol;
  const go = () => {
    if (Math.abs(MZ.el.currentTime - posAlvo(t)) > 2) {
      try {
        MZ.el.currentTime = t.loop && MZ.el.duration ? posAlvo(t) % MZ.el.duration : posAlvo(t);
      } catch (e) {}
    }
    if (t.play)
      MZ.el
        .play()
        .then(() => {
          MZ.unlocked = true;
          renderBoardTop();
        })
        .catch(() => {
          MZ.bloqueado = true;
          renderBoardTop();
        });
    else MZ.el.pause();
  };
  if (MZ.cur !== t.src) {
    MZ.cur = t.src;
    MZ.el.src = t.src;
    MZ.el.addEventListener("loadedmetadata", go, { once: true });
    MZ.el.load();
  } else go();
}
function carregarYT(cb) {
  if (MZ.ytReady) return cb();
  (MZ.ytQ = MZ.ytQ || []).push(cb);
  if (MZ.ytLoading) return;
  MZ.ytLoading = true;
  let div = $("#ytBox");
  if (!div) {
    div = document.createElement("div");
    div.id = "ytBox";
    div.style.cssText =
      "position:fixed;width:1px;height:1px;left:-10px;bottom:0;opacity:0;pointer-events:none";
    div.innerHTML = '<div id="ytP"></div>';
    document.body.appendChild(div);
  }
  window.onYouTubeIframeAPIReady = () => {
    MZ.yt = new YT.Player("ytP", {
      width: 1,
      height: 1,
      playerVars: { autoplay: 1, controls: 0, playsinline: 1 },
      events: {
        onReady: () => {
          MZ.ytReady = true;
          (MZ.ytQ || []).forEach(f => f());
          MZ.ytQ = [];
        },
        onStateChange: e => {
          const t = S.trilha && S.trilha.tocando;
          if (e.data === 0 && t && t.loop) MZ.yt.seekTo(0, true);
          if (e.data === 1) {
            MZ.unlocked = true;
            MZ.bloqueado = false;
            renderBoardTop();
          }
        },
        onError: e => {
          if (S.isM)
            toast(
              e.data === 101 || e.data === 150
                ? "Esse vídeo do YouTube não permite tocar fora do YouTube. Escolha outro."
                : "Não consegui tocar esse vídeo."
            );
        },
        onAutoplayBlocked: () => {
          MZ.bloqueado = true;
          renderBoardTop();
        }
      }
    });
  };
  const s = document.createElement("script");
  s.src = "https://www.youtube.com/iframe_api";
  s.onerror = () => toast("Não consegui carregar o YouTube.");
  document.head.appendChild(s);
}
function destravarSom() {
  MZ.bloqueado = false;
  MZ.unlocked = true;
  const t = S.trilha && S.trilha.tocando;
  if (!t) return;
  if (ytId(t.src) && MZ.ytReady) {
    MZ.yt.playVideo();
  } else if (MZ.el) {
    MZ.el.play().catch(() => {});
  }
  aplicarTrilha();
  renderBoardTop();
}
document.addEventListener(
  "pointerdown",
  () => {
    if (MZ.bloqueado) destravarSom();
  },
  { capture: true }
);
async function salvarTrilha(p) {
  const d = {
    lista: (S.trilha && S.trilha.lista) || [],
    tocando: (S.trilha && S.trilha.tocando) || null,
    ...p
  };
  S.trilha = d;
  aplicarTrilha();
  renderPanel();
  renderBoardTop();
  try {
    await S.db.set(P() + "/estado/trilhas", d);
  } catch (e) {
    fail(e);
  }
}
/* Músicas livres (sem anúncio): arquivos MP3 na pasta audio/ do próprio site.
   Todas de Kevin MacLeod (incompetech.com), licença Creative Commons BY 4.0.
   [ocasião, nome da música, arquivo] */
const TRILHAS_LIVRES = [
  ["Calma", "Healing", "healing.mp3"],
  ["Calma", "Dreamy Flashback", "dreamy-flashback.mp3"],
  ["Investigação", "Investigations", "investigations.mp3"],
  ["Investigação", "Hiding Your Reality", "hiding-your-reality.mp3"],
  ["Tensão", "Long Note Four", "long-note-four.mp3"],
  ["Tensão", "Gathering Darkness", "gathering-darkness.mp3"],
  ["Tensão", "Dark Times", "dark-times.mp3"],
  ["Terror", "Ossuary 6 - Air", "ossuary-6-air.mp3"],
  ["Terror", "Darkest Child", "darkest-child.mp3"],
  ["Terror", "Ghost Story", "ghost-story.mp3"],
  ["Ritual", "Satiate", "satiate.mp3"],
  ["Ritual", "Rites", "rites.mp3"],
  ["Combate", "Volatile Reaction", "volatile-reaction.mp3"],
  ["Combate", "Five Armies", "five-armies.mp3"],
  ["Combate", "Clash Defiant", "clash-defiant.mp3"],
  ["Combate", "Unholy Knight", "unholy-knight.mp3"],
  ["Triste", "Sad Trio", "sad-trio.mp3"],
  ["Triste", "Lightless Dawn", "lightless-dawn.mp3"]
];
const livreUrl = arq => new URL("audio/" + arq, location.href.split("#")[0]).href;
// Confere uma vez por sessão quais arquivos já estão na pasta audio/ do site.
async function checarTrilhasLivres() {
  if (S.livresOk) return;
  S.livresOk = {};
  await Promise.all(
    TRILHAS_LIVRES.map(async ([, , arq]) => {
      try {
        const r = await fetch(livreUrl(arq), { method: "HEAD", cache: "no-store" });
        S.livresOk[arq] = r.ok && !/text\/html/.test(r.headers.get("content-type") || "");
      } catch (e) {
        S.livresOk[arq] = false;
      }
    })
  );
  if (S.tool === "trilha") renderPanel();
}
// Ocasião de uma música livre (só o mestre vê).
function ocasiaoDe(src) {
  const x = TRILHAS_LIVRES.find(([, , arq]) => src === livreUrl(arq));
  return x ? x[0] : "";
}
function trilhasLivresHTML() {
  if (!S.livresOk) {
    checarTrilhasLivres();
    return `<div class="sub">Músicas livres (sem anúncio)</div><div class="muted small">Procurando as músicas…</div>`;
  }
  const tem = TRILHAS_LIVRES.filter(([, , a]) => S.livresOk[a]);
  const faltam = TRILHAS_LIVRES.filter(([, , a]) => !S.livresOk[a]);
  const cats = [...new Set(tem.map(x => x[0]))];
  return `<div class="sub">Músicas livres (sem anúncio)</div>
   ${
     tem.length
       ? cats
           .map(
             c => `<div class="stack" style="gap:4px"><span class="label">${esc(c)}</span>
       ${tem
         .filter(x => x[0] === c)
         .map(
           ([, n, a]) =>
             `<div class="tokrow" style="grid-template-columns:minmax(0,1fr) auto"><div style="min-width:0;font-weight:600">${esc(n)}</div><div class="row" style="flex-wrap:nowrap"><button class="btn sm primary" data-mzl="${esc(a)}">Tocar</button><button class="btn sm ghost" data-mzls="${esc(a)}">Salvar</button></div></div>`
         )
         .join("")}</div>`
           )
           .join("")
       : `<div class="muted small">Nenhuma música livre no site ainda.</div>`
   }
   ${
     faltam.length
       ? `<details class="box"><summary class="small"><b>${faltam.length === TRILHAS_LIVRES.length ? "Como colocar as músicas livres" : `Faltam ${faltam.length} músicas`}</b></summary>
     <p class="muted small">Baixe cada música em incompetech.com (procure pelo nome e toque em Download), salve com o nome da direita e suba na pasta <b>audio</b> do repositório do site no GitHub.</p>
     <div class="stack small" style="gap:2px">${faltam.map(([c, n, a]) => `<div>${esc(c)} · ${esc(n)} → <code>audio/${esc(a)}</code></div>`).join("")}</div></details>`
       : ""
   }
   <p class="muted small" style="margin:0">Músicas de Kevin MacLeod (incompetech.com), licença Creative Commons BY 4.0.</p>`;
}

function trilhaHTML() {
  const t = S.trilha || { lista: [], tocando: null };
  const tc = t.tocando;
  const agora = tc
    ? `<div class="box stack"><span class="label">Tocando agora${S.isM && ocasiaoDe(tc.src) ? " · " + esc(ocasiaoDe(tc.src)) : ""}</span><b style="font-size:16px">${esc(tc.titulo || "Música")}</b>
     <span class="muted small">${tc.play ? "tocando" : "pausada"}${tc.loop ? " · repetindo" : ""}</span>
     ${
       S.isM
         ? `<div class="row"><button class="btn sm primary" id="mzPlay">${tc.play ? "Pausar" : "Tocar"}</button><button class="btn sm" id="mzStop">Parar</button><label class="check small"><input type="checkbox" id="mzLoop" ${tc.loop ? "checked" : ""}> Repetir</label></div>
     <label class="row small muted" style="gap:6px;flex-wrap:nowrap">Volume para todos <input type="range" id="mzVolM" min="0" max="1" step="0.05" value="${tc.vol ?? 1}" style="flex:1"></label>`
         : ""
     }</div>`
    : `<div class="empty">Nenhuma música tocando.</div>`;
  return `${agora}
   <label class="row small" style="gap:6px;flex-wrap:nowrap">Meu volume <input type="range" id="mzVol" min="0" max="1" step="0.05" value="${MZ.vol}" style="flex:1" aria-label="Meu volume da trilha"></label>
   ${MZ.bloqueado ? `<button class="btn primary block" id="mzUnlock">Ativar o som da mesa</button>` : ""}
   ${
     S.isM
       ? `${trilhasLivresHTML()}<div class="sub">Trilhas da mesa</div>
    ${(t.lista || []).length ? `<div class="cards">${t.lista.map((x, i) => `<div class="tokrow" style="grid-template-columns:auto minmax(0,1fr) auto"><span class="amedot" style="--c:${ytId(x.src) ? "#ff4d5e" : "#b47dff"};font-size:13px">${ytId(x.src) ? "YT" : "♪"}</span><div style="min-width:0"><div style="font-weight:600">${esc(x.titulo)}</div><div class="muted small" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.src)}</div></div><div class="row" style="flex-wrap:nowrap"><button class="btn sm primary" data-mzt="${i}">Tocar</button><button class="btn sm ghost" data-mzd="${i}" aria-label="Remover">✕</button></div></div>`).join("")}</div>` : `<div class="muted small">Nenhuma trilha salva ainda.</div>`}
    <form class="box stack" id="fMz"><div class="field"><label class="label" for="mzT">Nome</label><input type="text" id="mzT" maxlength="60" placeholder="Ex.: Tensão na floresta" required></div>
     <div class="field"><label class="label" for="mzU">Link</label><input type="url" id="mzU" placeholder="Link do YouTube ou de um arquivo MP3/OGG" required></div>
     <button class="btn">Adicionar trilha</button></form>
    <p class="muted small" style="margin:0">Funciona com vídeos do YouTube que permitem incorporação e com links diretos de áudio (por exemplo, MP3 do seu GitHub). Todos ouvem ao mesmo tempo; cada um ajusta o próprio volume.</p>`
       : `<p class="muted small" style="margin:0">O mestre escolhe a trilha. Se não ouvir nada, toque em qualquer lugar da página.</p>`
   }`;
}
function bindTrilha() {
  const v = $("#mzVol");
  if (v)
    v.oninput = () => {
      MZ.vol = +v.value;
      lsSet("ms_mvol", MZ.vol);
      aplicarTrilha();
    };
  const u = $("#mzUnlock");
  if (u) u.onclick = destravarSom;
  if (!S.isM) return;
  const t = S.trilha || { lista: [] };
  const f = $("#fMz");
  if (f)
    f.onsubmit = e => {
      e.preventDefault();
      const titulo = $("#mzT").value.trim(),
        src = $("#mzU").value.trim();
      if (!/^https:\/\//.test(src)) {
        toast("Use um link que comece com https://");
        return;
      }
      salvarTrilha({ lista: [...(t.lista || []), { titulo, src }] });
    };
  $$("[data-mzt]").forEach(
    b =>
      (b.onclick = () => {
        const x = t.lista[+b.dataset.mzt];
        destravarSom();
        salvarTrilha({ tocando: { ...x, play: true, pos: 0, at: Date.now(), loop: true, vol: 1 } });
      })
  );
  const livre = a => TRILHAS_LIVRES.find(x => x[2] === a);
  $$("[data-mzl]").forEach(
    b =>
      (b.onclick = () => {
        const x = livre(b.dataset.mzl);
        destravarSom();
        salvarTrilha({
          tocando: {
            titulo: x[1],
            src: livreUrl(x[2]),
            play: true,
            pos: 0,
            at: Date.now(),
            loop: true,
            vol: 1
          }
        });
      })
  );
  $$("[data-mzls]").forEach(
    b =>
      (b.onclick = () => {
        const x = livre(b.dataset.mzls);
        if ((t.lista || []).some(y => y.src === livreUrl(x[2]))) {
          toast("Essa música já está nas trilhas da mesa.");
          return;
        }
        salvarTrilha({ lista: [...(t.lista || []), { titulo: x[1], src: livreUrl(x[2]) }] });
      })
  );
  $$("[data-mzd]").forEach(
    b =>
      (b.onclick = () => {
        const l = [...t.lista];
        l.splice(+b.dataset.mzd, 1);
        salvarTrilha({ lista: l });
      })
  );
  const tc = t.tocando;
  if (!tc) return;
  $("#mzPlay").onclick = () => {
    const pos = posAlvo(tc);
    salvarTrilha({ tocando: { ...tc, play: !tc.play, pos, at: Date.now() } });
  };
  $("#mzStop").onclick = () => salvarTrilha({ tocando: null });
  $("#mzLoop").onchange = e =>
    salvarTrilha({ tocando: { ...tc, loop: e.target.checked, pos: posAlvo(tc), at: Date.now() } });
  $("#mzVolM").onchange = e =>
    salvarTrilha({ tocando: { ...tc, vol: +e.target.value, pos: posAlvo(tc), at: Date.now() } });
}
