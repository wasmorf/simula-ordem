"use strict";
/* Homebrew: itens, rituais e habilidades criados pelo mestre. */
/* ===================== HOMEBREW ===================== */
const HB_TIPOS = [
  ["ritual", "Ritual"],
  ["habilidade", "Habilidade"],
  ["item", "Item"],
  ["arma", "Arma"],
  ["criatura", "Criatura"]
];
function homebrewHTML() {
  const t = S.hbTipo || "ritual";
  const list = S.homebrew;
  const fieldsFor = {
    ritual: `<div class="fields"><div class="field"><label class="label" for="h_el">Elemento</label><select id="h_el" name="el">${ELEMENTOS.map(e => `<option>${e}</option>`).join("")}</select></div>
    <div class="field"><label class="label" for="h_ef">Efeito</label><select id="h_ef" name="efeito">${["Dano", "Cura", "Defesa", "Suporte"].map(e => `<option>${e}</option>`).join("")}</select></div>
    <div class="field"><label class="label" for="h_c">Custo (PE, vazio = pelo círculo)</label><input type="number" id="h_c" name="custo" min="0"></div>
    <div class="field"><label class="label" for="h_d">Dados (opcional)</label><input type="text" id="h_d" name="dado" placeholder="2d8+2"></div>
    <div class="field"><label class="label" for="h_ci">Círculo</label><select id="h_ci" name="circulo"><option>1</option><option>2</option><option>3</option><option>4</option></select></div></div>
    <div class="fields"><div class="field"><label class="label" for="h_dd">Discente: dados</label><input type="text" id="h_dd" name="dadoD" placeholder="5d8+5"></div>
    <div class="field"><label class="label" for="h_cd">Discente: custo</label><input type="number" id="h_cd" name="custoD" placeholder="3" min="0"></div>
    <div class="field"><label class="label" for="h_dv">Verdadeiro: dados</label><input type="text" id="h_dv" name="dadoV" placeholder="7d8+7"></div>
    <div class="field"><label class="label" for="h_cv">Verdadeiro: custo</label><input type="number" id="h_cv" name="custoV" placeholder="6" min="0"></div></div>
    <p class="muted small" style="margin:0">Deixe Discente e Verdadeiro em branco se o ritual não tiver essas formas.</p>`,
    habilidade: `<div class="fields"><div class="field"><label class="label" for="h_el">Elemento / tipo</label><select id="h_el" name="el">${["Medo", ...ELEMENTOS.filter(e => e !== "Medo")].map(e => `<option>${e}</option>`).join("")}</select></div>
    <div class="field"><label class="label" for="h_c">Custo (PE)</label><input type="number" id="h_c" name="custo" value="0" min="0"></div>
    <div class="field"><label class="label" for="h_d">Dados (opcional)</label><input type="text" id="h_d" name="dado" placeholder="1d6"></div></div>`,
    item: `<div class="fields"><div class="field"><label class="label" for="h_cat">Categoria</label><select id="h_cat" name="cat">${["0", "I", "II", "III", "IV"].map(e => `<option>${e}</option>`).join("")}</select></div>
    <div class="field"><label class="label" for="h_esp">Espaços</label><input type="number" id="h_esp" name="esp" value="1" min="0"></div></div>`,
    arma: `<div class="fields"><div class="field"><label class="label" for="h_d">Dano</label><input type="text" id="h_d" name="dado" value="1d8" required></div>
    <div class="field"><label class="label" for="h_m">Margem</label><input type="number" id="h_m" name="margem" value="20"></div>
    <div class="field"><label class="label" for="h_x">Multiplicador</label><input type="number" id="h_x" name="mult" value="2"></div>
    <div class="field"><label class="label" for="h_p">Perícia</label><select id="h_p" name="pericia"><option>Luta</option><option>Pontaria</option></select></div>
    <div class="field"><label class="label" for="h_g">Grupo</label><select id="h_g" name="grupo"><option>simples</option><option selected>táticas</option><option>pesadas</option></select></div>
    <div class="field"><label class="label" for="h_cat2">Categoria</label><select id="h_cat2" name="cat">${["0", "I", "II", "III", "IV"].map(e => `<option ${e === "I" ? "selected" : ""}>${e}</option>`).join("")}</select></div></div>`,
    criatura: `<div class="fields"><div class="field"><label class="label" for="h_el">Elemento</label><select id="h_el" name="el"><option value="">Humano</option>${ELEMENTOS.map(e => `<option>${e}</option>`).join("")}</select></div>
    <div class="field"><label class="label" for="h_pv">PV</label><input type="number" id="h_pv" name="pv" value="30"></div>
    <div class="field"><label class="label" for="h_def">Defesa</label><input type="number" id="h_def" name="def" value="12"></div>
    <div class="field"><label class="label" for="h_vd">VD</label><input type="number" id="h_vd" name="vd" value="40"></div>
    <div class="field"><label class="label" for="h_atkD">Dados de ataque (d20)</label><input type="number" id="h_atkD" name="atkD" value="2" min="1"></div>
    <div class="field"><label class="label" for="h_atk">Bônus de ataque</label><input type="number" id="h_atk" name="atk" value="5"></div>
    <div class="field"><label class="label" for="h_d">Dano</label><input type="text" id="h_d" name="dado" value="1d8+2"></div>
</div>`
  };
  const meta = h =>
    ({
      ritual: `${ROMAN[+h.circulo || 1]} · ${h.el} · ${h.efeito} · ${h.custo} PE${h.dado ? " · " + h.dado : ""}${h.dadoD ? " · Discente " + h.dadoD : ""}${h.dadoV ? " · Verdadeiro " + h.dadoV : ""}`,
      habilidade: `${h.el || ""}${+h.custo ? ` · ${h.custo} PE` : ""}${h.dado ? " · " + h.dado : ""}`,
      item: `Categoria ${h.cat || "0"} · ${h.esp ?? 1} espaço(s)`,
      arma: `${h.pericia} · ${h.dado} · ${h.margem}/×${h.mult}`,
      criatura: `${h.el || "Realidade"} · VD ${h.vd || "?"} · PV ${h.pv} · DEF ${h.def} · ${h.atkD || 2}d20+${h.atk} (${h.dado})`
    })[h.tipo] || "";
  return `<p class="muted small" style="margin:0">Os nomes e números do livro já estão nas fichas. Aqui vocês cadastram conteúdo próprio da mesa (ou descrições que quiserem guardar): aparece nas fichas, no bestiário e para todo mundo.</p>
   <form class="box stack" id="fHB"><div class="tabs2">${HB_TIPOS.map(([k, n]) => `<button type="button" data-hbt="${k}" aria-pressed="${t === k}">${n}</button>`).join("")}</div>
    <div class="field"><label class="label" for="h_n">Nome</label><input type="text" id="h_n" name="nome" maxlength="50" required></div>
    ${fieldsFor[t]}
    <div class="field"><label class="label" for="h_desc">Descrição</label><textarea id="h_desc" name="desc" maxlength="600" style="min-height:70px"></textarea></div>
    <button class="btn primary">Criar ${HB_TIPOS.find(x => x[0] === t)[1].toLowerCase()}</button></form>
   ${HB_TIPOS.map(([k, n]) => {
     const l = list.filter(h => h.tipo === k);
     return l.length
       ? `<div class="sub">${n}s</div><div class="cards">${l.map(h => `<div class="hb el-${esc(h.el || "Medo")}"><div class="row between"><span class="hn">${esc(h.nome)}</span>${h.autor === S.uid || S.isM ? `<button class="btn sm ghost" data-delhb="${esc(h.id)}" aria-label="Apagar">✕</button>` : ""}</div><span class="muted small" style="font-family:var(--f-mono)">${esc(meta(h))}</span>${h.desc ? `<span class="small">${esc(h.desc)}</span>` : ""}</div>`).join("")}</div>`
       : "";
   }).join("")}
   ${!list.length ? `<div class="empty">Nada criado ainda.</div>` : ""}`;
}
function bindHomebrew() {
  $$("[data-hbt]").forEach(
    b =>
      (b.onclick = () => {
        S.hbTipo = b.dataset.hbt;
        renderPanel();
      })
  );
  $("#fHB").onsubmit = async e => {
    e.preventDefault();
    const o = { tipo: S.hbTipo || "ritual", autor: S.uid, criada: Date.now() };
    $$("#fHB [name]").forEach(el => (o[el.name] = el.type === "number" ? +el.value || 0 : el.value.trim()));
    if ([o.dado, o.dadoD, o.dadoV].some(x => x && !parseExpr(x))) {
      toast("Os dados precisam ser algo como 2d6+3.");
      return;
    }
    try {
      await S.db.add(P() + "/homebrew", o);
      toast(`${o.nome} criado.`);
      $("#fHB").reset();
    } catch (err) {
      fail(err);
    }
  };
  $$("[data-delhb]").forEach(
    b =>
      (b.onclick = async () => {
        const h = S.homebrew.find(x => x.id === b.dataset.delhb);
        if (!(await confirmBox("Apagar " + h.nome + "?", "Some da mesa para todos."))) return;
        try {
          await S.db.del(P() + "/homebrew/" + h.id);
        } catch (e) {
          fail(e);
        }
      })
  );
}
