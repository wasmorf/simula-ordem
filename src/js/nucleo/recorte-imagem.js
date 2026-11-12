"use strict";
/* Recortar imagem (foto da ficha e tokens). */
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
