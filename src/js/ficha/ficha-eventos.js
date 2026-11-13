"use strict";
/* Ficha: o que cada botão e campo faz. */
/* ---------- ficha: eventos ---------- */
/* Nome comprido não cabe no campo do celular: diminui a letra até caber (mínimo 15px). */
function ajustarFonteNome(el) {
  if (!el) return;
  el.style.fontSize = "";
  let fs = parseFloat(getComputedStyle(el).fontSize) || 26;
  while (el.scrollWidth > el.clientWidth + 1 && fs > 15) {
    fs -= 1;
    el.style.fontSize = fs + "px";
  }
}
/* Liga os botões da ficha aberta. As partes especiais ficam nos arquivos delas. */
function bindSheet() {
  const id = S.openFicha;
  const f = S.fichas[id];
  if (f && f.rapido)
    bindNpcRapido(id, f); // ficha rápida de NPC (ficha/npcs)
  else bindFichaCompleta();
  if (S.solo)
    $$("[data-back]").forEach(b => (b.onclick = soloFechar)); // personagem fora de mesa (mesa/personagens)
  else bindFichaAcoes(f, id); // menu Opções: duplicar, dar, retirar, virar NPC (mestre/gestao)
  bindEstagio(f, id); // classe Sobrevivente (regras/sobrevivente)
  // "Falta escolher": cada item leva para a aba certa (regras/limites)
  $$("[data-irpara]").forEach(
    b =>
      (b.onclick = () => {
        S.sheetTab = b.dataset.irpara;
        renderPanel();
      })
  );
  avisoNivelNovo(f, id); // o mestre subiu o NEX: o jogador vê o que ganhou (ficha/subir-nex)
}
function bindFichaCompleta() {
  {
    const nm = $("#s_nome");
    if (nm) {
      requestAnimationFrame(() => ajustarFonteNome(nm));
      nm.addEventListener("input", () => ajustarFonteNome(nm));
    }
  }
  $$("[data-back]").forEach(
    b =>
      (b.onclick = () => {
        S.openFicha = null;
        renderPanel();
      })
  );
  $$("[data-stab]").forEach(
    b =>
      (b.onclick = () => {
        S.sheetTab = b.dataset.stab;
        renderPanel();
        $("#pbody").scrollTop = 0;
      })
  );
  const id = S.openFicha;
  const f = fA();
  if (!f) return;
  $$("[data-roll]").forEach(b => (b.onclick = () => testePericia(b.dataset.roll)));
  $$("[data-atk]").forEach(b => (b.onclick = () => atacar(+b.dataset.atk)));
  $$("[data-conj]").forEach(b => (b.onclick = () => conjurar(b.dataset.conj, +b.dataset.forma || 0)));
  $$("[data-wtog]").forEach(
    b =>
      (b.onclick = () => {
        const i = +b.dataset.wtog;
        S.openArma = S.openArma === i ? null : i;
        renderPanel();
      })
  );
  $$("[data-ritf]").forEach(
    b =>
      (b.onclick = () => {
        S.ritFiltro = b.dataset.ritf;
        renderPanel();
      })
  );
  const bc = $("#btnClaim");
  if (bc)
    bc.onclick = async () => {
      const r = await formBox(
        "Pedir a ficha " + f.nome,
        `<div class="field"><label class="label" for="clQuem">Seu nome (para o mestre saber quem é)</label><input type="text" id="clQuem" name="quem" maxlength="40" value="${esc(f.jogador || "")}" required></div>`,
        "Enviar pedido"
      );
      if (!r) return;
      try {
        await S.db.set(P() + "/pedidos/" + S.uid, {
          fichaId: id,
          nome: f.nome,
          quem: r.quem.trim(),
          ts: Date.now()
        });
        toast("Pedido enviado ao mestre.");
      } catch (e) {
        fail(e);
      }
    };
  $$("[data-aprova]").forEach(
    b =>
      (b.onclick = async () => {
        const uid = b.dataset.aprova;
        const pd = (S.pedidos || []).find(x => x.id === uid);
        if (!pd) return;
        if (
          !(await confirmBox(
            "Dar a ficha para " + (pd.quem || "este jogador") + "?",
            "A ficha passa a ser dele. Quem era o dono antes perde a edição.",
            "Dar a ficha"
          ))
        )
          return;
        try {
          f.dono = uid;
          await S.db.merge(P() + "/fichas/" + id, { dono: uid });
          await S.db.del(P() + "/pedidos/" + uid);
          (S.tokens || [])
            .filter(t => t.fichaId === id)
            .forEach(t => S.db.merge(P() + "/tokens/" + t.id, { dono: uid }).catch(() => {}));
          toast("Ficha transferida.");
        } catch (e) {
          fail(e);
        }
      })
  );
  $$("[data-recusa]").forEach(
    b => (b.onclick = () => S.db.del(P() + "/pedidos/" + b.dataset.recusa).catch(fail))
  );
  if (!canEditFicha(f)) return;
  const sv = now => {
    saveFicha(id, now);
  };
  const rr = () => {
    renderPanel();
  };
  // Muda a ficha só se as regras deixam (regras/limites). fn recebe a ficha (ou uma cópia, no teste).
  const mudar = fn => {
    if (!trava(f, fn)) {
      rr(); // desfaz o que apareceu na tela (um select que mudou, por exemplo)
      return false;
    }
    fn(f);
    return true;
  };
  $$("#pbody [data-f]").forEach(el => {
    const k = el.dataset.f;
    const num = el.type === "number";
    if (k === "classe" || k === "origem" || k === "trilha")
      el.onchange = () => trocarEscolha(f, id, k, el.value); // confere a regra e avisa o que muda (regras/limites)
    else if (el.tagName === "SELECT" || num)
      el.onchange = () => {
        f[k] = num ? +el.value || 0 : el.value;
        sv();
        rr();
        renderBoard();
      };
    else
      el.oninput = () => {
        f[k] = el.value;
        sv();
      };
  });
  $$("#pbody [data-patsel]").forEach(
    el =>
      (el.onchange = () => {
        const p = PATENTES[+el.value];
        if (!p) return;
        f.pp = p[0];
        sv();
        rr();
        toast(`Patente ${p[1]}: os pontos de prestígio foram para ${p[0]}.`);
      })
  );
  const on = (sel, fn, ev = "onclick") => {
    const e = $(sel);
    if (e) e[ev] = fn;
  };
  on("#s_nex", () => mudarNivel(f, id, +$("#s_nex").value), "onchange"); // subir de NEX guiado (ficha/subir-nex)
  const mestre = S.isM || !!S.solo; // regras livres e extras: só o mestre (ou o dono fora de mesa)
  on(
    "#regLivres",
    () => {
      if (!mestre) return;
      f.regrasLivres = $("#regLivres").checked;
      sv(true);
      rr();
      toast(
        f.regrasLivres
          ? "Ficha sem travas: vale o que estiver escrito."
          : "Travas ligadas: a ficha segue as regras do NEX."
      );
    },
    "onchange"
  );
  $$("[data-extra]").forEach(
    el =>
      (el.onchange = () => {
        if (!mestre) return;
        f.extra = { ...(f.extra || {}), [el.dataset.extra]: +el.value || 0 };
        sv(true);
        rr();
      })
  );

  on("#foto", async () => {
    const file = await pickImage();
    if (!file) return;
    const url = await cropImage(file, {
      size: 300,
      ratio: 4 / 3,
      radius: 0.06,
      type: "image/jpeg",
      title: "Ajustar a arte do agente"
    });
    if (!url) return;
    f.foto = url;
    sv(true);
    rr();
    renderBoard();
  });
  $$("[data-attr]").forEach(
    b =>
      (b.onclick = () => {
        const k = b.dataset.attr;
        if (!mudar(x => (x.attr[k] = Math.max(0, Math.min(5, x.attr[k] + +b.dataset.d))))) return;
        sv();
        rr();
      })
  );
  $$("[data-res]").forEach(
    b =>
      (b.onclick = () => {
        const k = b.dataset.res;
        const max = derivados(f)[k + "Max"];
        f[k] = Math.max(k === "pv" ? -max : 0, Math.min(max, cur(f, k) + +b.dataset.d));
        if (k === "pv" && f.pv > 0) f.morrendo = 0;
        sv();
        rr();
        renderBoard();
      })
  );
  on("#mrMais", () => {
    f.morrendo = (+f.morrendo || 0) + 1;
    sv(true);
    rr();
    if (f.morrendo >= 4)
      logEntry({ quem: f.nome, titulo: "chegou ao fim da contagem de Morrendo", tipo: "chat" });
  });
  on("#mrZera", () => {
    f.morrendo = 0;
    sv(true);
    rr();
  });
  on("#btnBaixar", () => exportarFicha(id));
  on("#btnGuardarConta", () => soloGuardarCopia(id)); // cópia em Meus personagens (mesa/personagens)
  {
    const nv = $("#npcVis");
    if (nv)
      nv.onchange = () => {
        f.visivel = nv.checked;
        sv(true);
        toast(nv.checked ? "Os jogadores agora veem esta ficha." : "Ficha escondida dos jogadores.");
      };
  }
  $$("[data-perg]").forEach(
    s =>
      (s.onchange = () => {
        const p = s.dataset.perg;
        if (!mudar(x => (x.per[p] = { ...(x.per[p] || { b: 0 }), g: +s.value }))) return;
        sv();
        rr();
      })
  );
  $$("[data-perb]").forEach(
    c =>
      (c.onchange = () => {
        if (!podeAjustarNivel(f)) return; // bônus: quem dá é o mestre
        const p = c.dataset.perb;
        f.per[p] = f.per[p] || { g: 0, b: 0 };
        f.per[p].b = +c.value || 0;
        sv();
        rr();
      })
  );
  on("#condAdd", async () => {
    let c = $("#condSel").value;
    if (c === "__outra") {
      const r = await formBox(
        "Nova condição ou efeito",
        `<div class="field"><label class="label" for="cnd">Nome</label><input type="text" id="cnd" name="c" maxlength="40" required></div>`,
        "Adicionar"
      );
      if (!r) return;
      c = r.c.trim();
    }
    if (!c) return;
    f.cond = [...new Set([...(f.cond || []), c])];
    sv(true);
    rr();
    renderBoard();
  });
  $$("[data-uncond]").forEach(
    b =>
      (b.onclick = () => {
        f.cond.splice(+b.dataset.uncond, 1);
        sv(true);
        rr();
      })
  );
  const mult = () => DESCANSO[+($("#descSel") || {}).value || 1][1];
  on("#itDormir", () => {
    const D = derivados(f);
    const g = Math.floor(D.limPE * mult());
    f.pv = Math.min(D.pvMax, cur(f, "pv") + g);
    f.pe = Math.min(D.peMax, cur(f, "pe") + g);
    sv(true);
    rr();
    logEntry({
      quem: f.nome,
      titulo: "Interlúdio: dormir",
      total: g,
      det: `+${g} PV e +${g} PE (${DESCANSO[+$("#descSel").value][0].toLowerCase()})`
    });
  });
  on("#itRelaxar", () => {
    const D = derivados(f);
    const g = Math.floor(D.limPE * mult());
    f.san = Math.min(D.sanMax, cur(f, "san") + g);
    sv(true);
    rr();
    logEntry({ quem: f.nome, titulo: "Interlúdio: relaxar", total: g, det: `+${g} Sanidade` });
  });
  on("#itPE", () => {
    f.pe = derivados(f).peMax;
    sv(true);
    rr();
  });
  on("#btnAplicar", () => {
    const c = CLASSES[f.classe];
    const marcar = x =>
      [...ORIGENS[x.origem][0], ...c.fixas].forEach(p => {
        x.per[p] = x.per[p] || { g: 0, b: 0 };
        if (!x.per[p].g) x.per[p].g = 5;
      });
    if (!mudar(marcar)) return;
    if (c.escolhaFixa.length) toast(`Escolha também: ${c.fixasTxt}.`);
    else toast("Perícias da origem e da classe marcadas.");
    sv();
    rr();
  });
  // combate
  $$("[data-arma]").forEach(
    el =>
      (el.onchange = () => {
        const i = +el.dataset.arma,
          k = el.dataset.k;
        if (k !== "nome" && k !== "pericia" && !podeAjustarNivel(f)) return; // números da arma: só o mestre
        f.armas[i][k] = el.type === "number" ? +el.value || 0 : el.value;
        sv();
        rr();
      })
  );
  $$("[data-armaagil]").forEach(
    c =>
      (c.onchange = () => {
        if (!podeAjustarNivel(f)) return;
        f.armas[+c.dataset.armaagil].agil = c.checked;
        sv();
      })
  );
  $$("[data-delarma]").forEach(
    b =>
      (b.onclick = () => {
        f.armas.splice(+b.dataset.delarma, 1);
        S.openArma = null;
        sv();
        rr();
      })
  );
  on("#btnAddArma", () => {
    const a = allArmas()[+$("#addArmaSel").value];
    if (!a) return;
    const nova = {
      nome: a.nome,
      pericia: /Fogo|Disparo|distância/.test(a.emp) ? "Pontaria" : "Luta",
      dano: a.dano,
      crit: a.crit,
      alc: a.alc,
      tipo: a.tipo,
      cat: a.cat,
      esp: a.esp,
      agil: a.agil,
      grupo: a.grupo,
      emp: a.emp,
      bonus: 0,
      bdano: 0,
      mods: []
    };
    if (!mudar(x => (x.armas = [...(x.armas || []), { ...nova }]))) return;
    sv();
    rr();
  });
  $$("[data-modadd]").forEach(
    b =>
      (b.onclick = () => {
        const i = +b.dataset.modadd;
        const m = $(`[data-modsel="${i}"]`).value;
        if ((f.armas[i].mods || []).includes(m)) return;
        const md = (MODIFICACOES.find(x => x[0] === m) || [])[3] || {};
        const modificar = x => {
          const a = x.armas[i];
          a.mods = [...(a.mods || []), m];
          a.cat = catPlus(a.cat, 1); // cada modificação sobe a categoria
          if (md.esp) a.esp = Math.max(0, (+a.esp || 0) + md.esp);
        };
        if (!mudar(modificar)) return;
        sv();
        rr();
      })
  );
  $$("[data-modrm]").forEach(
    b =>
      (b.onclick = () => {
        const [i, k] = b.dataset.modrm.split(":").map(Number);
        const a = f.armas[i];
        const m = a.mods.splice(k, 1)[0];
        a.cat = catPlus(a.cat, -1);
        const md = (MODIFICACOES.find(x => x[0] === m) || [])[3] || {};
        if (md.esp) a.esp = Math.max(0, (+a.esp || 0) - md.esp);
        sv();
        rr();
      })
  );
  on("#protAdd", () => {
    const p = PROTECOES[+$("#protSel").value];
    if (!p) return;
    const nova = { nome: p[0], cat: p[1], esp: p[2], def: p[3], rd: p[4], usando: true, mods: [] };
    if (!mudar(x => (x.protecoes = [...(x.protecoes || []), { ...nova }]))) return;
    sv();
    rr();
  });
  $$("[data-protuse]").forEach(
    c =>
      (c.onchange = () => {
        f.protecoes[+c.dataset.protuse].usando = c.checked;
        sv();
        rr();
      })
  );
  $$("[data-protrm]").forEach(
    b =>
      (b.onclick = () => {
        f.protecoes.splice(+b.dataset.protrm, 1);
        sv();
        rr();
      })
  );
  $$("[data-pmodadd]").forEach(
    b =>
      (b.onclick = () => {
        const i = +b.dataset.pmodadd;
        const m = $(`[data-pmodsel="${i}"]`).value;
        if ((f.protecoes[i].mods || []).includes(m)) return;
        const md = (MODIFICACOES.find(x => x[0] === m) || [])[3] || {};
        const modificar = x => {
          const p = x.protecoes[i];
          p.mods = [...(p.mods || []), m];
          p.cat = catPlus(p.cat, 1);
          if (md.def) p.def += md.def;
          if (md.rd) p.rd = Math.max(+p.rd || 0, md.rd);
          if (md.esp) p.esp = Math.max(0, p.esp + md.esp);
        };
        if (!mudar(modificar)) return;
        sv();
        rr();
      })
  );
  // rituais: o resumo embaixo da lista acompanha o ritual escolhido (regras/rituais-resumo)
  on(
    "#ritSel",
    e => {
      const r = allRituais().find(x => x.n === e.target.value);
      $("#ritRes").textContent = (r && r.desc) || "";
    },
    "onchange"
  );
  on("#ritAdd", () => {
    const v = $("#ritSel").value;
    if (!v) return;
    if (!mudar(x => (x.rituais = [...new Set([...(x.rituais || []), v])]))) return;
    sv();
    rr();
  });
  $$("[data-unrit]").forEach(
    b =>
      (b.onclick = () => {
        f.rituais = (f.rituais || []).filter(x => x !== b.dataset.unrit);
        sv();
        rr();
      })
  );
  // habilidades
  on("#podAdd", () => {
    const v = $("#podSel").value;
    if (!v || !mudar(x => (x.poderes = [...(x.poderes || []), v]))) return;
    sv();
    rr();
  });
  $$("[data-podrm]").forEach(
    b =>
      (b.onclick = () => {
        f.poderes.splice(+b.dataset.podrm, 1);
        sv();
        rr();
      })
  );
  on("#parAdd", () => {
    const v = $("#parSel").value;
    if ((f.paranormais || []).includes(v) && v !== "Aprender Ritual" && v !== "Resistir a <Elemento>") {
      toast("Esse poder já está na ficha (escolha de novo para ganhar a afinidade).");
    }
    if (!mudar(x => (x.paranormais = [...(x.paranormais || []), v]))) return;
    sv();
    rr();
  });
  $$("[data-parrm]").forEach(
    b =>
      (b.onclick = () => {
        f.paranormais.splice(+b.dataset.parrm, 1);
        sv();
        rr();
      })
  );
  $$("[data-hab]").forEach(
    c =>
      (c.onchange = () => {
        const n = c.dataset.hab;
        f.hab = f.hab || [];
        f.hab = c.checked ? [...new Set([...f.hab, n])] : f.hab.filter(x => x !== n);
        sv();
        rr();
      })
  );
  $$("[data-usehab]").forEach(
    b =>
      (b.onclick = () => {
        const h = S.homebrew.find(x => x.id === b.dataset.usehab);
        if (!h) return;
        const c = +h.custo || 0;
        if (c && cur(f, "pe") < c) {
          toast("PE insuficiente.");
          return;
        }
        if (c) f.pe = cur(f, "pe") - c;
        const r = h.dado ? rollExpr(h.dado) : null;
        logEntry({
          quem: f.nome,
          titulo: `Habilidade · ${h.nome}`,
          total: r ? r.total : null,
          det: `${r ? r.detail + " · " : ""}${c ? `−${c} PE · ` : ""}${h.desc || ""}`
        });
        sv(true);
        rr();
      })
  );
  // inventário
  on("#itemAdd", () => {
    const opts = [
      ...ITENS_GERAIS.map(i => ({ n: i[0], g: i[1], cat: i[2], esp: i[3] })),
      ...MUNICOES.map(m => ({ n: m[0], g: "Munição", cat: m[1], esp: m[2] })),
      ...AMALDICOADOS.map(([n, e, c, sp]) => ({
        n,
        g: "Itens amaldiçoados (" + e + ")",
        cat: c || "II",
        esp: sp ?? 1
      })),
      ...hbOf("item").map(h => ({ n: h.nome, g: "Homebrew", cat: h.cat || "0", esp: +h.esp || 1 }))
    ];
    const o = opts[+$("#itemSel").value];
    if (!o) return;
    const novo = { nome: o.n, grupo: o.g, cat: o.cat, esp: o.esp, qtd: 1, mods: [] };
    if (!mudar(x => (x.itens = [...(x.itens || []), { ...novo }]))) return;
    sv();
    rr();
  });
  $$("[data-itemrm]").forEach(
    b =>
      (b.onclick = () => {
        f.itens.splice(+b.dataset.itemrm, 1);
        sv();
        rr();
      })
  );
  // travar = true: categoria e espaços de um item que já existe só o mestre muda
  const itemForm = async (it, titulo, ok, travar = false) => {
    const C = ["0", "I", "II", "III", "IV"];
    const tv = travar ? 'disabled title="Só o mestre muda"' : "";
    return formBox(
      titulo,
      `<div class="field"><label class="label" for="icN">Nome</label><input type="text" id="icN" name="nome" maxlength="60" required value="${esc(it.nome || "")}"></div>
     <div class="row" style="gap:8px;flex-wrap:wrap"><div class="field" style="width:110px"><label class="label" for="icC">Categoria</label><select id="icC" name="cat" ${tv}>${C.map(c => `<option value="${c}" ${String(it.cat ?? "0") === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
     <div class="field" style="width:100px"><label class="label" for="icE">Espaços</label><input type="number" id="icE" name="esp" min="0" max="20" step="0.5" value="${it.esp ?? 1}" ${tv}></div>
     <div class="field" style="width:100px"><label class="label" for="icQ">Quantidade</label><input type="number" id="icQ" name="qtd" min="1" max="999" value="${+it.qtd || 1}"></div></div>
     <div class="field"><label class="label" for="icT">Descrição ou efeito (opcional)</label><textarea id="icT" name="nota" maxlength="400" placeholder="Ex.: dá +2 em Investigação; 3 usos; foto antiga do pai…">${esc(it.nota || "")}</textarea></div>
     <p class="muted small" style="margin:0">Categoria 0 não conta no limite da patente. Espaços contam na carga.</p>`,
      ok
    );
  };
  on("#itemCriar", async () => {
    const r = await itemForm({}, "Criar item", "Criar");
    if (!r || !r.nome.trim()) return;
    const novo = {
      nome: r.nome.trim(),
      grupo: "Item criado",
      cat: r.cat,
      esp: Math.max(0, +r.esp || 0),
      qtd: Math.max(1, +r.qtd || 1),
      nota: r.nota.trim(),
      mods: []
    };
    if (!mudar(x => (x.itens = [...(x.itens || []), { ...novo }]))) return;
    sv();
    rr();
    toast(`${r.nome.trim()} entrou no inventário.`);
  });
  $$("[data-itemed]").forEach(
    b =>
      (b.onclick = async () => {
        const i = +b.dataset.itemed;
        const it = f.itens[i];
        if (!it) return;
        const travar = regrasAtivas(f) && !podeAjustarNivel(f);
        const r = await itemForm(it, "Editar item", "Salvar", travar);
        if (!r || !r.nome.trim()) return;
        const novo = {
          nome: r.nome.trim(),
          cat: travar ? it.cat : r.cat,
          esp: travar ? it.esp : Math.max(0, +r.esp || 0),
          qtd: Math.max(1, +r.qtd || 1),
          nota: r.nota.trim()
        };
        if (!mudar(x => Object.assign(x.itens[i], novo))) return;
        sv();
        rr();
      })
  );
  $$("[data-iqtd]").forEach(
    i =>
      (i.onchange = () => {
        const q = Math.max(1, +i.value || 1);
        if (!mudar(x => (x.itens[+i.dataset.iqtd].qtd = q))) return;
        sv();
        rr();
      })
  );
  $$("[data-imodadd]").forEach(
    b =>
      (b.onclick = () => {
        const i = +b.dataset.imodadd;
        const m = $(`[data-imodsel="${i}"]`).value;
        if ((f.itens[i].mods || []).includes(m)) return;
        const md = (MODIFICACOES.find(x => x[0] === m) || [])[3] || {};
        const modificar = x => {
          const it = x.itens[i];
          it.mods = [...(it.mods || []), m];
          it.cat = catPlus(it.cat, 1);
          if (md.esp) it.esp = Math.max(0, it.esp + md.esp);
        };
        if (!mudar(modificar)) return;
        sv();
        rr();
      })
  );
  $$("[data-ppev]").forEach(
    b =>
      (b.onclick = () => {
        if (!podeAjustarNivel(f)) return; // prestígio: quem dá é o mestre
        const [n, v] = PP_EVENTOS[+b.dataset.ppev];
        f.pp = Math.max(0, (+f.pp || 0) + v);
        sv(true);
        rr();
        toast(`${n}: ${v > 0 ? "+" : ""}${v} PP`);
      })
  );
  // história
  on("#btnTokFicha", () => tokenDaFicha(id));
  on("#btnDelFicha", async () => {
    if (!(await confirmBox("Apagar " + f.nome + "?", "A ficha some para todos na mesa."))) return;
    try {
      await S.db.del(fichaPath(id));
      if (f.dono === S.uid && !f.npc)
        S.db.del("usuarios/" + S.uid + "/fichas/" + S.mesaId + "_" + id).catch(() => {});
      delete S.fichas[id];
      S.openFicha = null;
      renderPanel();
    } catch (e) {
      fail(e);
    }
  });
}
