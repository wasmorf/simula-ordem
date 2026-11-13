"use strict";
/* Painel Rolagens: rolar dados, teste de Ordem, chat. */
/* ===================== ROLAGENS ===================== */
function rolagensHTML() {
  const opts = Object.entries(S.fichas).filter(([id, f]) => S.isM || f.dono === S.uid);
  return `<form class="box stack" id="fRoll">
    <div class="field"><label class="label" for="rollQuem">Quem rola</label><select id="rollQuem">${S.isM ? `<option value="">Mestre</option>` : ""}${opts.map(([id, f]) => `<option value="${esc(id)}">${esc(f.nome)}</option>`).join("")}${!S.isM && !opts.length ? `<option value="">Jogador</option>` : ""}</select></div>
    <div class="row" style="flex-wrap:nowrap"><input type="text" id="rollExpr" placeholder="Ex.: 2d6+3" autocomplete="off" aria-label="Expressão de dados"><button class="btn primary">Rolar</button></div>
    <div class="dicebar">${["1d20", "1d4", "1d6", "1d8", "1d10", "1d12", "2d6", "1d100"].map(x => `<button type="button" class="btn sm" data-quick="${x}">${x}</button>`).join("")}</div>
    <div class="field"><span class="label">Teste de Ordem (Xd20, fica com o maior)</span><div class="row"><input type="number" id="testeAttr" value="2" style="width:64px" aria-label="Atributo"><span class="muted">d20 +</span><input type="number" id="testeMod" value="0" style="width:64px" aria-label="Modificador"><button type="button" class="btn" id="btnTeste">Testar</button></div></div>
   </form>
   <div class="row" style="flex-wrap:nowrap"><label class="label" for="paraSel" style="white-space:nowrap;margin:0">Para</label><select id="paraSel">${destinos()
     .map(
       ([v, n]) =>
         `<option value="${esc(v)}" ${(S.paraRolagem || "") === v ? "selected" : ""}>${esc(n)}</option>`
     )
     .join("")}</select></div>
   <form class="row" id="fChat" style="flex-wrap:nowrap"><input type="text" id="chatIn" maxlength="300" placeholder="${S.paraRolagem ? "Mensagem privada…" : "Falar na mesa…"}" aria-label="Mensagem"><button class="btn">Enviar</button></form>
   <p class="muted small" style="margin:0">O "Para" vale para o chat, para as rolagens daqui e para os testes feitos na ficha.</p>
   <div class="row" style="flex-wrap:nowrap"><label class="label" for="skinSel" style="white-space:nowrap;margin:0">Seu dado</label><select id="skinSel">${SKINS_DADO.map(([k, n]) => `<option value="${k}" ${skinDado() === k ? "selected" : ""}>${n}</option>`).join("")}</select><button type="button" class="btn sm" id="btnMudo" style="white-space:nowrap" aria-pressed="${somMudo()}">${somMudo() ? "Som desligado" : "Som ligado"}</button></div>
   ${S.isM ? `<button class="btn" id="btnDoc">Enviar documento ou pista</button>` : ""}
   <div class="row between"><span class="sub">Registro da mesa</span>${S.isM ? `<button class="btn sm ghost" id="btnLimparLog">Limpar registro</button>` : ""}</div>
   <div class="log" id="log"></div>`;
}
function renderLog() {
  const el = $("#log");
  if (!el) return;
  if (!S.log.length && !(S.priv || []).length) {
    el.innerHTML = `<div class="empty">${S.loaded.log ? "Nada rolado ainda. Abra uma ficha e toque numa perícia, ou role aqui em cima." : "Carregando registro…"}</div>`;
    return;
  }
  const all = [...S.log.map(x => ({ ...x, _p: 0 })), ...(S.priv || []).map(x => ({ ...x, _p: 1 }))]
    .sort((a, b) => (b.ts || 0) - (a.ts || 0))
    .slice(0, 200);
  el.innerHTML = all.map(x => (x._p ? privRow(x) : logRow(x))).join("");
  el.querySelectorAll("[data-doc]").forEach(
    b =>
      (b.onclick = () => {
        const d = (S.priv || []).find(x => x.id === b.dataset.doc);
        if (d) abrirDoc(d);
      })
  );
}
/* Hora da rolagem: só a hora se foi hoje; senão dd/mm/aa hh:mm. */
function quandoRolou(ts) {
  const d = new Date(ts || 0);
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === new Date().toDateString()) return hora;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) + " " + hora;
}
function logRow(e) {
  const t = quandoRolou(e.ts);
  if (e.tipo === "chat")
    return `<div class="entry chat"><span class="wh"><b>${esc(e.quem || "Jogador")}</b> · ${t}</span><span class="wt">${esc(e.titulo)}</span></div>`;
  return `<div class="entry ${esc(e.flag)}${e.secreto ? " secret" : ""}${skinClasse(e.skin)}"><span class="wh"><b>${esc(e.quem || "Mestre")}</b> · ${t}</span><span class="wt">${esc(e.titulo)}${e.flag === "crit" ? " · crítico" : ""}</span><span class="det">${esc(e.det)}</span><span class="tot">${e.total ?? "✦"}</span></div>`;
}
function quemNome() {
  const id = $("#rollQuem") && $("#rollQuem").value;
  return id && S.fichas[id] ? S.fichas[id].nome : S.isM ? "Mestre" : "Jogador";
}
function bindRolagens() {
  const sec = () => false;
  const para = () => S.paraRolagem || "";
  $("#paraSel").onchange = () => {
    S.paraRolagem = $("#paraSel").value;
    const ci = $("#chatIn");
    if (ci) ci.placeholder = S.paraRolagem ? "Mensagem privada…" : "Falar na mesa…";
  };
  {
    const bd = $("#btnDoc");
    if (bd) bd.onclick = novoDocumento;
  }
  $("#skinSel").onchange = () => {
    lsSet("ms_skin", $("#skinSel").value);
    dicePop({
      quem: quemNome(),
      titulo: "Assim fica o seu dado",
      total: 20,
      det: "",
      flag: "crit",
      skin: skinDado()
    });
  };
  $("#btnMudo").onclick = () => {
    lsSet("ms_mudo", !somMudo());
    renderPanel();
  };
  $$("[data-quick]").forEach(
    b =>
      (b.onclick = () => {
        $("#rollExpr").value = b.dataset.quick;
        $("#fRoll").requestSubmit();
      })
  );
  $("#fRoll").onsubmit = ev => {
    ev.preventDefault();
    const ex = $("#rollExpr").value.trim() || "1d20";
    const r = rollExpr(ex);
    if (!r) {
      toast("Expressão inválida. Use algo como 2d6+3.");
      return;
    }
    const n20 = /^1d20\[20\]/.test(r.detail),
      n1 = /^1d20\[1\]/.test(r.detail);
    logEntry({
      quem: quemNome(),
      titulo: `Rolagem ${ex}`,
      total: r.total,
      det: r.detail,
      flag: n20 ? "crit" : n1 ? "fail" : "",
      para: para()
    });
  };
  $("#btnTeste").onclick = () => {
    const a = +$("#testeAttr").value || 0,
      m = +$("#testeMod").value || 0;
    const r = rollTest(a, m);
    logEntry({
      quem: quemNome(),
      titulo: `Teste (${a}d20)`,
      total: r.total,
      det: `${r.dice.length}d20[${r.dice.join(",")}] fica ${r.mode} ${r.kept}${sgn(m)}`,
      flag: r.kept === 20 ? "crit" : r.kept === 1 ? "fail" : "",
      para: para()
    });
  };
  $("#fChat").onsubmit = ev => {
    ev.preventDefault();
    const t = $("#chatIn").value.trim();
    if (!t) return;
    $("#chatIn").value = "";
    logEntry({ quem: quemNome(), titulo: t, tipo: "chat", para: para() });
  };
  const lim = $("#btnLimparLog");
  if (lim)
    lim.onclick = async () => {
      if (
        !(await confirmBox("Limpar o registro?", "Todas as rolagens e mensagens somem para todos.", "Limpar"))
      )
        return;
      for (const e of S.log) {
        try {
          await S.db.del(P() + "/log/" + e.id);
        } catch (err) {
          fail(err);
          break;
        }
      }
      toast("Registro limpo.");
    };
}
