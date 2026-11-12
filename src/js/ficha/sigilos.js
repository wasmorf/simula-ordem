"use strict";
/* Sigilos dos elementos (desenhos SVG usados na ficha). */
/* ===================== ÍCONES ===================== */
const sv = d =>
  `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const SIGILO = {
  Sangue: sv(
    '<circle cx="20" cy="20" r="17"/><path d="M20 7c5 7 8 11 8 15a8 8 0 0 1-16 0c0-4 3-8 8-15Z"/><path d="M20 30v6M14 4l2 4M26 4l-2 4"/>'
  ),
  Morte: sv(
    '<circle cx="20" cy="20" r="17"/><path d="M20 20m-2 0a2 2 0 1 1 4 0a4 4 0 1 1-8 0a6 6 0 1 1 12 0a8 8 0 1 1-16 0a10 10 0 1 1 20 0"/>'
  ),
  Energia: sv('<path d="M20 3 37 20 20 37 3 20Z"/><path d="M22 9l-7 12h6l-3 10 8-13h-6Z"/>'),
  Conhecimento: sv(
    '<circle cx="20" cy="20" r="17"/><path d="M6 20c4-6 9-9 14-9s10 3 14 9c-4 6-9 9-14 9s-10-3-14-9Z"/><circle cx="20" cy="20" r="4"/><path d="M20 3v5M20 32v5"/>'
  ),
  Medo: sv(
    '<circle cx="20" cy="20" r="17"/><circle cx="20" cy="20" r="11"/><circle cx="20" cy="20" r="5"/><path d="M20 3v34M3 20h34"/>'
  )
};
const RIC = {
  pv: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.5-9.3C1 8.1 3.3 4.5 6.9 4.5c2.1 0 3.6 1.1 5.1 3 1.5-1.9 3-3 5.1-3 3.6 0 5.9 3.6 4.4 7.2C19.5 16.4 12 21 12 21Z"/></svg>`,
  san: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 4.5a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a3 3 0 0 0-3-.5ZM15 4.5a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"/></svg>`,
  pe: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.6 6 6.4.6-4.9 4.2 1.5 6.3L12 16.3l-5.6 3.3 1.5-6.3L3 9.1l6.4-.6Z"/></svg>`
};
const WI = {
  fogo: `<svg viewBox="0 0 48 20" fill="currentColor"><path d="M2 6h30l2-2h8v5h4v3H34l-3 2h-6l-2 5h-6l2-5H2Z"/></svg>`,
  arco: `<svg viewBox="0 0 48 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2c10 4 10 12 0 16M8 2v16M4 10h40M38 6l6 4-6 4"/></svg>`,
  punho: `<svg viewBox="0 0 48 20" fill="currentColor"><rect x="14" y="4" width="18" height="12" rx="4"/><rect x="30" y="7" width="6" height="7" rx="2"/><path d="M2 8h12v5H2Z"/></svg>`,
  impacto: `<svg viewBox="0 0 48 20" fill="currentColor"><path d="M2 8.5h30v3H2Z"/><rect x="30" y="2" width="12" height="16" rx="2"/></svg>`,
  lamina: `<svg viewBox="0 0 48 20" fill="currentColor"><path d="M2 8.5h12v3H2ZM14 6h3v8h-3ZM17 8l25-2 4 4-4 4-25-2Z"/></svg>`,
  pesada: `<svg viewBox="0 0 48 20" fill="currentColor"><path d="M2 7h34l4-3h6v12h-6l-4-3H2Z"/><rect x="14" y="13" width="5" height="6"/></svg>`
};
