"use strict";
/* Imagens: carregar e comprimir no navegador antes de salvar. */
/* ===================== IMAGENS (comprimidas no navegador) ===================== */
function pickImage() {
  return new Promise(res => {
    const inp = $("#fileIn");
    inp.value = "";
    inp.onchange = () => res(inp.files[0] || null);
    inp.click();
  });
}
function loadImg(file) {
  return new Promise((res, rej) => {
    const u = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      res(im);
      setTimeout(() => URL.revokeObjectURL(u), 1000);
    };
    im.onerror = () => rej(new Error("imagem"));
    im.src = u;
  });
}
function drawTo(im, w, h, sx = 0, sy = 0, sw = im.naturalWidth, sh = im.naturalHeight) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  const g = c.getContext("2d");
  g.imageSmoothingQuality = "high";
  g.drawImage(im, sx, sy, sw, sh, 0, 0, c.width, c.height);
  return c;
}
async function compressScene(file) {
  // mapa/cenário: cabe num documento do Firestore (< 1 MB)
  const im = await loadImg(file);
  let max = 2000;
  const LIMIT = 880000;
  for (let tries = 0; tries < 8; tries++) {
    const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
    const c = drawTo(im, im.naturalWidth * k, im.naturalHeight * k);
    for (const q of [0.82, 0.7, 0.58, 0.48]) {
      const url = c.toDataURL("image/jpeg", q);
      if (url.length <= LIMIT) return { url, w: c.width, h: c.height };
    }
    max = Math.round(max * 0.8);
  }
  throw new Error("grande");
}
function thumbOf(url, w = 192) {
  return new Promise(res => {
    const im = new Image();
    im.onload = () => {
      const k = w / im.naturalWidth;
      res(drawTo(im, w, im.naturalHeight * k).toDataURL("image/jpeg", 0.6));
    };
    im.onerror = () => res("");
    im.src = url;
  });
}
async function compressToken(file) {
  // token: mantém transparência
  const im = await loadImg(file);
  const k = Math.min(1, 260 / Math.max(im.naturalWidth, im.naturalHeight));
  const c = drawTo(im, im.naturalWidth * k, im.naturalHeight * k);
  let url = c.toDataURL("image/webp", 0.85);
  if (!url.startsWith("data:image/webp")) url = c.toDataURL("image/png");
  return { url, w: c.width, h: c.height };
}
