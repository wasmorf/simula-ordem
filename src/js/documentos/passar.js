"use strict";
/* Documentos: passar de mão em mão, recolher, mover. */
/* =====================================================================
   DOCUMENTOS ENTREGUES: o mestre move ou recolhe; o jogador passa adiante.
   A entrega é um único item em privado/ que troca de "para" (assim a
   revelação de trechos continua chegando, esteja com quem estiver).
   ===================================================================== */
const docsEntregues = () => (S.priv || []).filter(x => x.tipo === "doc" && x.autor === S.uid);
function opcoesJogadores(excluir) {
  return (S.membros || [])
    .filter(m => m.id !== (S.mesa && S.mesa.mestre) && !excluir.includes(m.id))
    .map(m => [m.id, m.nome || "Jogador"]);
}
async function docMover(x) {
  if (toqueDuplo("docMover")) return; // evita rodar duas vezes num toque duplo
  const ops = [["todos", "Todos os jogadores"], ...opcoesJogadores([x.para])];
  const r = await formBox(
    `Passar "${x.titulo}" para outra pessoa`,
    `<p class="muted small" style="margin:0">Hoje está com: <b>${esc(x.para === "todos" ? "todos" : nomeMembro(x.para))}</b>. Sai da pasta dessa pessoa e vai para quem você escolher.</p>
   <div class="field"><label class="label" for="dmP">Para</label><select id="dmP" name="para">${ops.map(([v, n]) => `<option value="${esc(v)}">${esc(n)}</option>`).join("")}</select></div>`,
    "Passar"
  );
  if (!r) return;
  try {
    await S.db.merge(P() + "/privado/" + x.id, {
      para: r.para,
      paraNome: r.para === "todos" ? "todos" : nomeMembro(r.para),
      passadoPor: null,
      ts: Date.now()
    });
    toast("Documento passado.");
  } catch (e) {
    fail(e);
  }
}
async function docRecolher(x) {
  if (toqueDuplo("docRecolher")) return; // evita rodar duas vezes num toque duplo
  if (
    !(await confirmBox(
      `Tirar "${x.titulo}" de ${x.para === "todos" ? "todos" : nomeMembro(x.para)}?`,
      "Some da pasta de quem estava com ele. O original continua na sua biblioteca.",
      "Tirar"
    ))
  )
    return;
  try {
    await S.db.del(P() + "/privado/" + x.id);
    toast("Documento recolhido.");
  } catch (e) {
    fail(e);
  }
}
async function docPassar(x) {
  if (toqueDuplo("docPassar")) return; // evita rodar duas vezes num toque duplo
  const ops = [["todos", "Todos os jogadores"], ...opcoesJogadores([S.uid])];
  if (!ops.length) {
    toast("Não tem outro jogador na mesa para receber.");
    return;
  }
  const r = await formBox(
    `Passar "${x.titulo}"`,
    `<p class="muted small" style="margin:0">O documento sai da sua pasta e vai para a pasta da pessoa escolhida.</p>
   <div class="field"><label class="label" for="dpP">Para</label><select id="dpP" name="para">${ops.map(([v, n]) => `<option value="${esc(v)}">${esc(n)}</option>`).join("")}</select></div>`,
    "Passar"
  );
  if (!r) return;
  try {
    await S.db.merge(P() + "/privado/" + x.id, {
      para: r.para,
      paraNome: r.para === "todos" ? "todos" : nomeMembro(r.para),
      passadoPor: nomeMembro(S.uid) || myName(),
      ts: Date.now()
    });
    toast(
      r.para === "todos"
        ? "Agora todos os jogadores têm o documento."
        : `Você passou o documento para ${nomeMembro(r.para)}.`
    );
  } catch (e) {
    if (e && e.code === "permission-denied")
      toast(
        "O mestre ainda precisa atualizar as regras do Firebase para os jogadores poderem passar documentos."
      );
    else fail(e);
  }
}

/* Mestre: lista dos documentos entregues, para passar a outro jogador ou recolher. */
function docsEntreguesHTML() {
  const L = docsEntregues();
  if (!L.length) return "";
  return `<div class="sub" style="margin-top:14px">Documentos entregues (${L.length})</div><p class="muted small" style="margin:0">Mude de quem está com cada um ou recolha.</p>
 <div class="stack" style="gap:6px">${L.map(
   x => `<div class="row" style="gap:6px;flex-wrap:wrap;border:1px solid var(--line);border-radius:8px;padding:8px 10px"><div style="flex:1;min-width:160px"><b>${esc(x.titulo)}</b><div class="muted small">Com: ${esc(x.para === "todos" ? "todos os jogadores" : nomeMembro(x.para))}${x.passadoPor ? ` (passado por ${esc(x.passadoPor)})` : ""}</div></div>
   <button class="btn sm" data-dmov="${esc(x.id)}">Passar para…</button><button class="btn sm ghost" data-drec="${esc(x.id)}">Tirar</button></div>`
 ).join("")}</div>`;
}
function bindDocsPassar() {
  const F = id => (S.priv || []).find(y => y.id === id);
  $$("[data-dmov]").forEach(
    b =>
      (b.onclick = () => {
        const x = F(b.dataset.dmov);
        if (x) docMover(x);
      })
  );
  $$("[data-drec]").forEach(
    b =>
      (b.onclick = () => {
        const x = F(b.dataset.drec);
        if (x) docRecolher(x);
      })
  );
  $$("[data-dpass]").forEach(
    b =>
      (b.onclick = ev => {
        ev.stopPropagation();
        const x = F(b.dataset.dpass);
        if (x) docPassar(x);
      })
  );
}
