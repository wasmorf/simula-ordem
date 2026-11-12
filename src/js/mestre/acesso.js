"use strict";
/* Acesso à mesa: quem entra, senha, aprovação, bloqueio. */
/* ===================== ACESSO À MESA (mestre) ===================== */
function subscribeAcesso() {
  if (S.acUnsub || !S.isM) return;
  const p = P();
  const a = S.db.listenCol(
    p + "/entrada",
    null,
    l => {
      const novos = l.filter(x => !(S.entrada || []).some(y => y.id === x.id));
      S.entrada = l;
      if (novos.length && S.loaded.entrada) toast(`${novos[0].nome} quer entrar na mesa. Aprove no Escudo.`);
      S.loaded.entrada = true;
      renderRail();
      if (S.tool === "escudo") renderPanel();
    },
    () => {}
  );
  const b = S.db.listenCol(
    p + "/bloqueados",
    null,
    l => {
      S.bloqueados = l;
      if (S.tool === "escudo") renderPanel();
    },
    () => {}
  );
  S.acUnsub = () => {
    a();
    b();
  };
}
function subscribeMembros() {
  if (S.memUnsub) return;
  S.memUnsub = S.db.listenCol(
    P() + "/membros",
    null,
    l => {
      S.membros = l;
      if (["escudo", "rolagens"].includes(S.tool) && !isEditing()) renderPanel();
    },
    () => {}
  );
}
function nomeMembro(uid) {
  if (uid === (S.mesa && S.mesa.mestre)) return "Mestre";
  const m = (S.membros || []).find(x => x.id === uid);
  if (m) return m.nome;
  const f = Object.values(S.fichas).find(x => x.dono === uid && !x.npc);
  return f ? f.nome : "Jogador";
}
function acessoHTML() {
  const m = S.mesa || {};
  const ac = m.acesso || "livre";
  const link = location.origin + location.pathname + "#mesa-" + S.mesaId;
  const ent = S.entrada || [];
  const mem = (S.membros || []).filter(x => x.id !== S.uid);
  const blq = S.bloqueados || [];
  return `<details class="box" ${ent.length ? "open" : ""}><summary class="row between" style="cursor:pointer"><h3 style="display:inline">Acesso à mesa</h3><span class="muted small">${mem.length} jogador(es)${ent.length ? ` · <b style="color:var(--warn)">${ent.length} pedido(s)</b>` : ""}</span></summary>
   <div class="stack" style="margin-top:10px">
    <div class="row" style="flex-wrap:nowrap"><input type="text" readonly value="${esc(link)}" id="acLink" aria-label="Link da mesa"><button class="btn sm" id="acCopy">Copiar link</button></div>
    <div class="fields"><div class="field"><label class="label" for="acSel">Quem pode entrar</label><select id="acSel"><option value="livre" ${ac === "livre" ? "selected" : ""}>Quem tiver o link ou o código</option><option value="senha" ${ac === "senha" ? "selected" : ""}>Só com senha</option><option value="aprovacao" ${ac === "aprovacao" ? "selected" : ""}>Só quem eu aprovar</option></select></div>
     <div class="field" id="acSnW" ${ac === "senha" ? "" : "hidden"}><label class="label" for="acSn">Nova senha</label><div class="row" style="flex-wrap:nowrap"><input type="text" id="acSn" maxlength="40" autocomplete="off" placeholder="digite para trocar"><button class="btn sm" id="acSnOk">Salvar</button></div></div></div>
    <label class="check"><input type="checkbox" id="acList" ${m.listada ? "checked" : ""}> Mostrar na lista pública do site</label>
    ${ent.length ? `<div class="sub">Pedidos para entrar</div><div class="cards">${ent.map(x => `<div class="row between condrow" style="border-left-color:var(--warn);grid-template-columns:1fr auto"><b>${esc(x.nome)}</b><span class="row"><button class="btn sm primary" data-acok="${esc(x.id)}">Aprovar</button><button class="btn sm ghost" data-acno="${esc(x.id)}">Recusar</button></span></div>`).join("")}</div>` : ""}
    <div class="sub">Jogadores na mesa</div>${
      mem.length
        ? `<div class="cards">${mem
            .map(
              x =>
                `<div class="row between condrow" style="border-left-color:var(--purple);grid-template-columns:1fr auto"><span><b>${esc(x.nome)}</b>${(() => {
                  const f = Object.values(S.fichas)
                    .filter(y => y.dono === x.id && !y.npc)
                    .map(y => y.nome);
                  return f.length ? ` <span class="muted small">· ${esc(f.join(", "))}</span>` : "";
                })()}</span><span class="row"><button class="btn sm ghost" data-acexp="${esc(x.id)}">Expulsar</button><button class="btn sm danger" data-acblq="${esc(x.id)}">Bloquear</button></span></div>`
            )
            .join("")}</div>`
        : `<div class="muted small">Ninguém entrou ainda. Mande o link.</div>`
    }
    ${blq.length ? `<div class="sub">Bloqueados</div><div class="cards">${blq.map(x => `<div class="row between condrow" style="grid-template-columns:1fr auto"><span>${esc(x.nome || "Jogador")}</span><button class="btn sm" data-acdes="${esc(x.id)}">Desbloquear</button></div>`).join("")}</div>` : ""}
   </div></details>`;
}
async function salvarAcesso(patch) {
  try {
    await S.db.merge(P(), patch);
    await S.db.merge("portas/" + S.mesaId, patch);
    toast("Acesso atualizado.");
  } catch (e) {
    fail(e);
  }
}
function bindAcesso() {
  const cp = $("#acCopy");
  if (!cp) return;
  cp.onclick = () => {
    const v = $("#acLink").value;
    (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject())
      .then(() => toast("Link copiado."))
      .catch(() => {
        $("#acLink").select();
        toast("Selecione e copie o link.");
      });
  };
  $("#acSel").onchange = async () => {
    const v = $("#acSel").value;
    $("#acSnW").hidden = v !== "senha";
    if (v === "senha") {
      const sg = await S.db.get(P() + "/segredo/senha").catch(() => null);
      if (!sg) {
        toast("Defina a senha e toque em Salvar.");
        $("#acSn").focus();
        return;
      }
    }
    salvarAcesso({ acesso: v });
  };
  $("#acSnOk").onclick = async () => {
    const v = $("#acSn").value.trim();
    if (v.length < 3) {
      toast("A senha precisa de pelo menos 3 caracteres.");
      return;
    }
    try {
      await S.db.set(P() + "/segredo/senha", { valor: v });
      await salvarAcesso({ acesso: "senha" });
      $("#acSn").value = "";
    } catch (e) {
      fail(e);
    }
  };
  $("#acList").onchange = () => salvarAcesso({ listada: $("#acList").checked });
  $$("[data-acok]").forEach(
    b =>
      (b.onclick = async () => {
        const x = (S.entrada || []).find(y => y.id === b.dataset.acok);
        if (!x) return;
        try {
          await S.db.set(P() + "/membros/" + x.id, { nome: x.nome, ts: Date.now() });
          await S.db.del(P() + "/entrada/" + x.id);
          toast(`${x.nome} entrou na mesa.`);
        } catch (e) {
          fail(e);
        }
      })
  );
  $$("[data-acno]").forEach(
    b => (b.onclick = () => S.db.del(P() + "/entrada/" + b.dataset.acno).catch(fail))
  );
  $$("[data-acexp]").forEach(
    b =>
      (b.onclick = async () => {
        const uid = b.dataset.acexp;
        if (
          !(await confirmBox(
            `Expulsar ${nomeMembro(uid)}?`,
            "Sai da mesa agora. As fichas dele continuam aqui. Se a mesa estiver aberta para quem tiver o link, ele pode voltar.",
            "Expulsar"
          ))
        )
          return;
        try {
          await S.db.del(P() + "/membros/" + uid);
          await S.db.del(P() + "/call/" + uid).catch(() => {});
        } catch (e) {
          fail(e);
        }
      })
  );
  $$("[data-acblq]").forEach(
    b =>
      (b.onclick = async () => {
        const uid = b.dataset.acblq;
        const nome = nomeMembro(uid);
        if (
          !(await confirmBox(
            `Bloquear ${nome}?`,
            "Sai da mesa agora e não consegue mais entrar, nem com link ou senha.",
            "Bloquear"
          ))
        )
          return;
        try {
          await S.db.set(P() + "/bloqueados/" + uid, { nome, ts: Date.now() });
          await S.db.del(P() + "/membros/" + uid);
          await S.db.del(P() + "/call/" + uid).catch(() => {});
        } catch (e) {
          fail(e);
        }
      })
  );
  $$("[data-acdes]").forEach(
    b => (b.onclick = () => S.db.del(P() + "/bloqueados/" + b.dataset.acdes).catch(fail))
  );
}
