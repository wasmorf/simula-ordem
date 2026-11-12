"use strict";
/* Funções pequenas usadas no site todo: $, esc, toast, caixas de confirmação, menus. */
/* ===================== UTILITÁRIOS ===================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s =>
  String(s ?? "").replace(
    /[&<>"']/g,
    c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
function rid(n = 6) {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < n; i++) s += a[d(a.length) - 1];
  return s;
}
/* Toque duplo: devolve true se a mesma ação já rodou há menos de ms milissegundos.
   Uso no começo de uma função: if (toqueDuplo("nome")) return; */
function toqueDuplo(chave, ms = 1200) {
  const agora = Date.now();
  if (agora - (toqueDuplo.ultimo[chave] || 0) < ms) return true;
  toqueDuplo.ultimo[chave] = agora;
  return false;
}
toqueDuplo.ultimo = {};
// fecha o menu "Opções" ao escolher um item ou clicar fora dele
document.addEventListener("click", e => {
  $$("details.menu[open]").forEach(m => {
    if (!m.contains(e.target) || e.target.closest(".menu-lista button")) m.open = false;
  });
});
/* Menu suspenso "Opções ▾" (some sozinho se não tiver itens). itens = lista de HTML de botões. */
function menuHTML(id, rotulo, itens) {
  if (!itens.length) return "";
  return `<details class="menu" id="${id}"><summary class="btn sm ghost">${rotulo} <span aria-hidden="true">▾</span></summary><div class="menu-lista" role="menu">${itens.join("")}</div></details>`;
}
function toast(msg) {
  const h = $("#toastHost");
  h.innerHTML = `<div class="toast" role="status">${esc(msg)}</div>`;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (h.innerHTML = ""), 3200);
}
function lsGet(k, def) {
  try {
    const v = localStorage.getItem(k);
    return v == null ? def : JSON.parse(v);
  } catch (e) {
    return def;
  }
}
function lsSet(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {}
}
function confirmBox(title, text, okLabel = "Apagar") {
  return new Promise(res => {
    const h = $("#modalHost");
    h.innerHTML = `<div class="modal-back"><div class="modal" role="dialog" aria-label="${esc(title)}"><h3>${esc(title)}</h3><p class="muted" style="margin:0">${esc(text)}</p><div class="row" style="justify-content:flex-end"><button class="btn" id="mNo">Cancelar</button><button class="btn danger" id="mYes">${esc(okLabel)}</button></div></div></div>`;
    $("#mNo").onclick = () => {
      h.innerHTML = "";
      res(false);
    };
    $("#mYes").onclick = () => {
      h.innerHTML = "";
      res(true);
    };
  });
}
function formBox(title, inner, okLabel = "Salvar") {
  return new Promise(res => {
    const h = $("#modalHost");
    h.innerHTML = `<div class="modal-back"><form class="modal" id="mForm"><h3>${esc(title)}</h3>${inner}<div class="row" style="justify-content:flex-end"><button type="button" class="btn" id="mNo">Cancelar</button><button class="btn primary">${esc(okLabel)}</button></div></form></div>`;
    $("#mNo").onclick = () => {
      h.innerHTML = "";
      res(null);
    };
    $("#mForm").onsubmit = e => {
      e.preventDefault();
      const out = {};
      $$("#mForm [name]").forEach(el => {
        if (el.type === "radio") {
          if (el.checked) out[el.name] = el.value;
        } else out[el.name] = el.type === "checkbox" ? el.checked : el.value;
      });
      h.innerHTML = "";
      res(out);
    };
    setTimeout(() => {
      const f = $("#mForm input,#mForm select");
      f && f.focus();
    }, 30);
  });
}
/* Nome de quem está jogando: "Mestre", o nome do agente ou o da conta. */
function myName() {
  const f = Object.values(S.fichas).find(x => x.dono === S.uid && !x.npc);
  return S.isM ? "Mestre" : f ? f.nome : (S.authUser && S.authUser.displayName) || "Agente";
}
