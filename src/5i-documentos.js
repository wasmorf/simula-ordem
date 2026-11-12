<script>
"use strict";
/* =====================================================================
   DOCUMENTOS — criar, guardar, enviar, revelar trechos
   Trechos entre [[ e ]] ficam tarjados para os jogadores até o mestre revelar.
   A tarja pode ter um estilo: [[sangue:texto]], [[rabisco:texto]]... Cada modelo
   aceita os estilos que fazem sentido nele (DOC_TARJAS); o primeiro é o padrão.
   ===================================================================== */
const DOC_MODELOS = [
  {
    id: "relatorio",
    nome: "Relatório de missão",
    desc: "Papel oficial com carimbo de CONFIDENCIAL.",
    campos: [
      ["org", "Organização", "Ordem · Divisão de Campo"],
      ["numero", "Número", "Nº 0427/26"],
      ["agente", "Agente responsável", ""],
      ["data", "Data", ""],
      ["local", "Local", ""]
    ],
    img: true
  },
  {
    id: "carta",
    nome: "Carta à mão",
    desc: "Papel amarelado, letra cursiva.",
    campos: [
      ["data", "Data / lugar", "São Paulo, 3 de março"],
      ["assinatura", "Assinatura", ""]
    ],
    img: false
  },
  {
    id: "jornal",
    nome: "Recorte de jornal",
    desc: "Manchete, foto e colunas.",
    campos: [
      ["jornal", "Nome do jornal", "Diário da Cidade"],
      ["data", "Data", "Terça-feira, 14 de outubro"],
      ["sub", "Subtítulo", ""],
      ["legenda", "Legenda da foto", ""]
    ],
    img: true
  },
  {
    id: "bilhete",
    nome: "Bilhete rasgado",
    desc: "Pedaço de papel escrito às pressas.",
    campos: [],
    img: false
  },
  {
    id: "policial",
    nome: "Boletim de ocorrência",
    desc: "Ficha policial datilografada com foto.",
    campos: [
      ["delegacia", "Delegacia", "Polícia Civil · 4ª Delegacia"],
      ["numero", "Nº do B.O.", "B.O. 1182/26"],
      ["data", "Data e hora", ""],
      ["envolvido", "Envolvido", ""],
      ["natureza", "Natureza", "Desaparecimento"]
    ],
    img: true
  },
  {
    id: "laudo",
    nome: "Laudo médico",
    desc: "Laudo de hospital ou necrópsia.",
    campos: [
      ["hospital", "Instituição", "Hospital Santa Clara · IML"],
      ["paciente", "Paciente", ""],
      ["data", "Data", ""],
      ["medico", "Médico(a)", ""],
      ["causa", "Conclusão", ""]
    ],
    img: true
  },
  {
    id: "diario",
    nome: "Página de diário",
    desc: "Folha pautada escrita à mão.",
    campos: [["data", "Data", "12 de agosto"]],
    img: false
  },
  {
    id: "celular",
    nome: "Mensagens de celular",
    desc: "Conversa de celular. Escreva uma mensagem por linha, como 'Ana: oi'. Quem é 'Eu' fica à direita.",
    campos: [["contato", "Nome do contato", "Desconhecido"]],
    img: false
  },
  {
    id: "amaldicoado",
    nome: "Página amaldiçoada",
    desc: "Papel escuro com escrita ritualística.",
    campos: [["elemento", "Elemento (Sangue, Morte, Conhecimento, Energia, Medo)", "Sangue"]],
    img: false
  },
  {
    id: "foto",
    nome: "Foto",
    desc: "Foto revelada com borda branca. Suba a imagem; o título vira o que está escrito à mão na borda e o texto vira a anotação no verso.",
    campos: [["data", "Data no canto da foto (opcional)", ""]],
    img: true
  },
  {
    id: "cartaz",
    nome: "Cartaz",
    desc: "Cartaz colado no poste ou no mural, com faixa no topo, foto e tirinhas de contato para destacar.",
    campos: [
      ["topo", "Faixa do topo", "DESAPARECIDO"],
      ["contato", "Tirinhas de contato (opcional)", ""]
    ],
    img: true
  },
  {
    id: "email",
    nome: "E-mail",
    desc: "Tela de e-mail. O título vira o assunto.",
    campos: [
      ["de", "De", ""],
      ["para", "Para", ""],
      ["data", "Data", ""],
      ["anexo", "Anexo (opcional)", ""]
    ],
    img: true
  },
  {
    id: "audio",
    nome: "Áudio",
    desc: "Gravação para os jogadores ouvirem: recado na secretária eletrônica, áudio de celular, fita. Grave pelo microfone, suba um arquivo pequeno ou cole um link. O texto vira a transcrição.",
    campos: [
      ["origem", "De onde vem", "Secretária eletrônica"],
      ["hora", "Quando", ""]
    ],
    img: false
  },
  {
    id: "simples",
    nome: "Documento simples",
    desc: "Folha em branco, para qualquer coisa.",
    campos: [],
    img: true
  }
];
function docNome(d) {
  if (d.nome && d.nome.trim()) return d.nome.trim();
  if (d.titulo && d.titulo.trim()) return d.titulo.trim();
  const m = DOC_MOD[d.modelo];
  const c = d.campos || {};
  return (m ? m.nome : "Documento") + (c.contato ? " · " + c.contato : c.data ? " · " + c.data : "");
}
const DOC_MOD = {};
DOC_MODELOS.forEach(m => (DOC_MOD[m.id] = m));
const DOC_ELCOR = {
  Sangue: "#d3283b",
  Morte: "#9aa0a8",
  Conhecimento: "#e0b84a",
  Energia: "#b45cff",
  Medo: "#e8f0ff"
};

/* ---------- estilos de tarja ---------- */
const TARJA_ESTILOS = {
  censura: "Tarja preta",
  corretivo: "Corretivo branco",
  rabisco: "Rabiscado à caneta",
  sangue: "Mancha de sangue",
  rasgado: "Pedaço rasgado",
  queimado: "Queimado",
  borrado: "Molhado / tinta borrada",
  apagada: "Mensagem apagada",
  pixel: "Pixelado",
  corrompido: "Texto corrompido",
  estatica: "Chiado (inaudível)",
  simbolos: "Símbolos que se mexem"
};
const TJ_OFICIAL = ["censura", "corretivo", "rasgado", "sangue", "queimado", "borrado"];
const TJ_MAO = ["rabisco", "rasgado", "sangue", "borrado", "queimado"];
// o primeiro de cada lista é o estilo padrão daquele modelo
const DOC_TARJAS = {
  relatorio: TJ_OFICIAL,
  policial: TJ_OFICIAL,
  laudo: TJ_OFICIAL,
  simples: ["censura", "rabisco", "corretivo", "rasgado", "sangue", "queimado", "borrado"],
  carta: TJ_MAO,
  diario: TJ_MAO,
  foto: TJ_MAO,
  bilhete: ["rasgado", "rabisco", "sangue", "borrado", "queimado"],
  jornal: ["rasgado", "censura", "borrado", "sangue", "queimado"],
  cartaz: ["rasgado", "rabisco", "borrado", "sangue", "queimado"],
  amaldicoado: ["simbolos", "sangue", "queimado"],
  celular: ["apagada", "pixel", "corrompido"],
  email: ["corrompido", "censura", "pixel"],
  audio: ["estatica", "corrompido"]
};
function tarjaEstilo(modelo, e) {
  const L = DOC_TARJAS[modelo] || DOC_TARJAS.simples;
  return L.includes(e) ? e : L[0];
}
// letras para as tarjas "corrompido" e "símbolos" (sempre as mesmas para o mesmo trecho)
function tarjaLetras(e, n, i) {
  const A = e === "simbolos" ? "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ" : "▓▒░#%&@$¤§¶╳";
  const R = maRng(n * 31 + i * 7 + 3);
  let t = "";
  for (let k = 0; k < Math.max(3, Math.min(40, n)); k++) t += A[Math.floor(R() * A.length)];
  return t;
}

/* ---------- texto com trechos escondidos ---------- */
function docPartesDe(texto) {
  const out = [];
  const re = /\[\[([\s\S]*?)\]\]/g;
  let i = 0,
    m;
  while ((m = re.exec(texto || ""))) {
    if (m.index > i) out.push({ t: texto.slice(i, m.index) });
    const em = m[1].match(/^([a-z]+):([\s\S]*)$/);
    if (em && TARJA_ESTILOS[em[1]]) out.push({ t: em[2], h: true, e: em[1] });
    else out.push({ t: m[1], h: true });
    i = re.lastIndex;
  }
  if (i < (texto || "").length) out.push({ t: texto.slice(i) });
  return out;
}
// versão que vai para o jogador: os trechos escondidos não levam o texto, só o tamanho
function docPartesEnvio(texto, revelados = []) {
  let k = 0;
  return docPartesDe(texto).map(p => {
    if (!p.h) return { t: p.t };
    const i = k++;
    return revelados.includes(i) ? { t: p.t, r: 1 } : { h: 1, n: p.t.length, i, ...(p.e ? { e: p.e } : {}) };
  });
}
function docFmt(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/\n/g, "<br>");
}
function docTextoHTML(partes, mestre, modelo) {
  let k = 0;
  return partes
    .map(p => {
      if (p.h && p.t !== undefined && mestre) {
        const i = k++;
        const e = tarjaEstilo(modelo, p.e);
        return `<mark class="dh" title="Trecho escondido nº ${i + 1} · ${esc(TARJA_ESTILOS[e])}">${docFmt(p.t)}<sup class="tjl">${esc(TARJA_ESTILOS[e])}</sup></mark>`;
      }
      if (p.h) {
        const i = k++;
        const e = tarjaEstilo(modelo, p.e);
        const n = Math.max(3, Math.min(400, p.n || (p.t || "").length));
        if (e === "apagada") return `<span class="tj t-apagada">⊘ mensagem apagada</span>`;
        if (e === "estatica")
          return `<span class="tj t-estatica" style="min-width:${Math.min(16, n * 0.35)}em">inaudível</span>`;
        if (e === "corrompido" || e === "simbolos")
          return `<span class="tj t-${e}">${tarjaLetras(e, n, i)}</span>`;
        const bar = w =>
          `<span class="redact t-${e}" style="width:${Math.min(30, w * 0.52)}em">&nbsp;</span>`;
        return bar(n) + (n > 58 ? bar(n - 58) : "");
      }
      return p.r ? `<span class="revealed">${docFmt(p.t)}</span>` : docFmt(p.t);
    })
    .join("");
}
function docLinhas(partes) {
  // para o celular: separa as partes em linhas (uma mensagem por linha), sem perder as tarjas
  const out = [[]];
  partes.forEach(p => {
    if (p.h) {
      out[out.length - 1].push(p);
      return;
    }
    (p.t || "").split("\n").forEach((t, j) => {
      if (j > 0) out.push([]);
      if (t) out[out.length - 1].push({ ...p, t });
    });
  });
  return out.filter(l => l.some(p => p.h || (p.t || "").trim()));
}

/* ---------- desenho do papel ---------- */
function docHtml(d, { mestre = false } = {}) {
  const M = DOC_MOD[d.modelo] || DOC_MOD.simples;
  const c = d.campos || {};
  const v = k => esc(c[k] ?? "");
  const partes = d.partes || docPartesDe(d.texto || "");
  const txt = docTextoHTML(partes, mestre, M.id);
  const tit = esc(d.titulo || "");
  const R = maRng(maH((d.titulo || "").length, (d.texto || "").length + 7, 3));
  const sangue = d.sangue
    ? [0, 1]
        .map(() => {
          const x = 8 + R() * 80,
            y = 8 + R() * 75,
            s = 26 + R() * 40;
          let h = `<i class="bl" style="left:${x}%;top:${y}%;width:${s}px;height:${s * (0.7 + R() * 0.5)}px;transform:rotate(${Math.round(R() * 180)}deg)"></i>`;
          for (let k = 0; k < 7; k++) {
            const a = R() * 6.28,
              dd = s * (0.6 + R() * 1.4),
              z = 3 + R() * 8;
            h += `<i class="bl gota" style="left:calc(${x}% + ${Math.round(Math.cos(a) * dd)}px);top:calc(${y}% + ${Math.round(Math.sin(a) * dd)}px);width:${z}px;height:${z}px"></i>`;
          }
          return h;
        })
        .join("") +
      (R() < 0.6
        ? `<i class="bl risco" style="left:${10 + R() * 60}%;top:${10 + R() * 70}%;transform:rotate(${Math.round(R() * 180)}deg)"></i>`
        : "")
    : "";
  const img = d.img ? `<img class="dimg" src="${d.img}" alt="">` : "";
  const cls = `docp m-${M.id} i${d.idade || 0} ${d.queimado ? "burn" : ""}`;
  let body = "";
  if (M.id === "relatorio")
    body = `<div class="d-head"><span>${v("org")}</span><span>${v("numero")}</span></div><h2>${tit || "Relatório de missão"}</h2>
    <table class="d-tab">${[
      ["Agente", "agente"],
      ["Data", "data"],
      ["Local", "local"]
    ]
      .filter(([, k]) => c[k])
      .map(([n, k]) => `<tr><th>${n}</th><td>${v(k)}</td></tr>`)
      .join("")}</table>
    <div class="carimbo">CONFIDENCIAL</div>${img}<div class="d-txt">${txt}</div><div class="d-ass">_______________________<br>${v("agente") || "Agente responsável"}</div>`;
  else if (M.id === "carta")
    body = `<div class="d-data">${v("data")}</div>${tit ? `<div class="d-saud">${tit}</div>` : ""}<div class="d-txt">${txt}</div><div class="d-ass">${v("assinatura")}</div>`;
  else if (M.id === "jornal")
    body = `<div class="d-mast">${v("jornal") || "Diário"}</div><div class="d-line">${v("data")}<span>R$ 3,50</span></div><h2>${tit}</h2>${c.sub ? `<div class="d-sub">${v("sub")}</div>` : ""}
    ${img ? `<figure>${img}${c.legenda ? `<figcaption>${v("legenda")}</figcaption>` : ""}</figure>` : ""}<div class="d-txt cols">${txt}</div>`;
  else if (M.id === "bilhete")
    body = `${tit ? `<div class="d-saud">${tit}</div>` : ""}<div class="d-txt">${txt}</div>`;
  else if (M.id === "policial")
    body = `<div class="d-head"><span>${v("delegacia")}</span><span>${v("numero")}</span></div><h2>${tit || "Boletim de ocorrência"}</h2>
    <div class="d-grid">${img ? `<div class="d-foto">${img}</div>` : ""}<table class="d-tab">${[
      ["Data/hora", "data"],
      ["Envolvido", "envolvido"],
      ["Natureza", "natureza"]
    ]
      .filter(([, k]) => c[k])
      .map(([n, k]) => `<tr><th>${n}</th><td>${v(k)}</td></tr>`)
      .join("")}</table></div>
    <div class="d-lbl">Histórico</div><div class="d-txt">${txt}</div>`;
  else if (M.id === "laudo")
    body = `<div class="d-head"><span>${v("hospital")}</span><span>${v("data")}</span></div><h2>${tit || "Laudo"}</h2>
    <table class="d-tab">${[
      ["Paciente", "paciente"],
      ["Médico(a)", "medico"]
    ]
      .filter(([, k]) => c[k])
      .map(([n, k]) => `<tr><th>${n}</th><td>${v(k)}</td></tr>`)
      .join("")}</table>${img}<div class="d-txt">${txt}</div>
    ${c.causa ? `<div class="d-concl"><b>Conclusão:</b> ${v("causa")}</div>` : ""}`;
  else if (M.id === "diario")
    body = `<div class="d-data">${v("data")}</div>${tit ? `<div class="d-saud">${tit}</div>` : ""}<div class="d-txt">${txt}</div>`;
  else if (M.id === "celular") {
    const linhas = docLinhas(partes);
    body = `<div class="ph-top"><span class="ph-av">${esc((c.contato || "?").charAt(0))}</span><b>${v("contato") || "Desconhecido"}</b><span class="ph-st">online</span></div>
    <div class="ph-msgs">${linhas
      .map(l => {
        let resto = l;
        let quem = "";
        if (l[0] && !l[0].h) {
          const m = l[0].t.match(/^([^:]{1,24}):\s*([\s\S]*)$/);
          if (m) {
            quem = m[1].trim();
            resto = [{ ...l[0], t: m[2] }, ...l.slice(1)].filter(p => p.h || p.t);
          }
        }
        const eu = /^eu$/i.test(quem);
        const so = resto.length === 1 && resto[0].h && resto[0].t === undefined;
        const apagada = so && tarjaEstilo("celular", resto[0].e) === "apagada";
        const conteudo = apagada
          ? `<span class="t-apagada">⊘ Esta mensagem foi apagada</span>`
          : docTextoHTML(resto, mestre, "celular");
        return `<div class="ph-b ${eu ? "eu" : ""} ${apagada ? "apag" : ""}">${!eu && quem && quem !== c.contato ? `<span class="ph-q">${esc(quem)}</span>` : ""}${conteudo}</div>`;
      })
      .join("")}</div>`;
  } else if (M.id === "cartaz") {
    body = `${c.topo ? `<div class="c-topo">${v("topo")}</div>` : ""}${d.img ? `<div class="c-foto"><img src="${d.img}" alt=""></div>` : ""}${tit ? `<h2>${tit}</h2>` : ""}<div class="d-txt">${txt}</div>
    ${c.contato ? `<div class="c-tiras">${Array.from({ length: 7 }, () => `<span>${v("contato")}</span>`).join("")}</div>` : ""}`;
  } else if (M.id === "email") {
    body = `<div class="e-bar"><i></i><i></i><i></i><span>Caixa de entrada</span></div><h2>${tit || "(sem assunto)"}</h2>
    <table class="e-cab">${[
      ["De", "de"],
      ["Para", "para"],
      ["Data", "data"]
    ]
      .filter(([, k]) => c[k])
      .map(([n, k]) => `<tr><th>${n}:</th><td>${v(k)}</td></tr>`)
      .join(
        ""
      )}</table><div class="d-txt">${txt}</div>${img}${c.anexo ? `<div class="e-anexo">📎 ${v("anexo")}</div>` : ""}`;
  } else if (M.id === "audio") {
    const temTxt = partes.some(p => p.h || (p.t || "").trim());
    const Rw = maRng((d.titulo || "x").length * 13 + 5);
    const barras = Array.from(
      { length: 42 },
      () => `<i style="height:${Math.round(18 + Rw() * 82)}%"></i>`
    ).join("");
    body = `<div class="a-dev"><div class="a-top"><span>● ${v("origem") || "Gravação"}</span><span>${v("hora")}</span></div>${tit ? `<div class="a-tit">${tit}</div>` : ""}<div class="a-wave">${barras}</div>
    ${d.audio ? `<audio controls preload="metadata" src="${esc(d.audio)}"></audio>` : `<div class="a-vazio">Grave, suba ou cole o link do áudio</div>`}</div>
    ${temTxt ? `<div class="a-trans"><span class="f-vl">Transcrição</span><div class="d-txt">${txt}</div></div>` : ""}`;
  } else if (M.id === "amaldicoado") {
    const cor = DOC_ELCOR[c.elemento] || DOC_ELCOR.Sangue;
    body = `<div class="sig" style="--el:${cor}"></div>${tit ? `<h2 style="color:${cor}">${tit}</h2>` : ""}<div class="d-txt" style="--el:${cor}">${txt}</div><div class="sig b" style="--el:${cor}"></div>`;
  } else if (M.id === "foto") {
    const temTxt = partes.some(p => (p.t || "").trim());
    body = `<div class="f-foto">${d.img ? `<img src="${d.img}" alt="${tit}">` : `<div class="f-vazia">Suba a imagem da foto</div>`}${c.data ? `<span class="f-data">${v("data")}</span>` : ""}</div>${tit ? `<div class="f-leg">${tit}</div>` : ""}${temTxt ? `<div class="f-verso"><span class="f-vl">Anotado no verso</span><div class="d-txt">${txt}</div></div>` : ""}`;
  } else body = `${tit ? `<h2>${tit}</h2>` : ""}${img}<div class="d-txt">${txt}</div>`;
  return `<div class="${cls}">${body}${sangue}</div>`;
}

/* ---------- biblioteca do mestre ---------- */
function subscribeDocs() {
  if (!S.isM || S.docsUnsub) return;
  S.docsUnsub = S.db.listenCol(
    P() + "/docs",
    {},
    l => {
      S.docs = l.sort((a, b) => (b.criado || 0) - (a.criado || 0));
      if (S.tool === "documentos") renderPanel();
    },
    () => {}
  );
}
function docsRecebidos() {
  return (S.priv || []).filter(x => x.tipo === "doc" && x.autor !== S.uid);
}
/* O painel junta três partes: a biblioteca (aqui), os entregues e o "passar" (5r-docs-passar.js)
   e os documentos no mapa (5s-docs-mapa.js). */
function documentosHTML() {
  return muralBotaoHTML() + docsMapaHTML(docsPassarHTML(documentosBaseHTML()));
}
function bindDocumentos() {
  bindMural(); // 5u-mural-notas.js
  bindDocumentosBase();
  bindDocsPassar();
  bindDocsMapa();
}
function documentosBaseHTML() {
  if (!S.isM) {
    subscribeNotas(); // 5u-mural-notas.js
    const L = docsRecebidos();
    return `<p class="muted small" style="margin:0">Tudo o que o mestre te entregou fica guardado aqui.</p>
    ${L.length ? `<div class="cards">${L.map(x => `<button class="fcard doccard" data-dver="${esc(x.id)}"><span class="docico m-${esc((x.doc && x.doc.modelo) || "simples")}"></span><div style="min-width:0"><div class="label">${esc(DOC_MOD[(x.doc && x.doc.modelo) || "simples"].nome)}${x.para === "todos" ? "" : " · só para você"}</div><div class="nm">${esc(x.titulo)}</div><div class="muted small">${new Date(x.ts || 0).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}${((x.doc && x.doc.partes) || []).some(p => p.h) ? " · tem trechos tarjados" : ""}${temNota(x.id) ? " · 📝 anotado" : ""}</div></div></button>`).join("")}</div>` : `<div class="empty">Nenhum documento recebido ainda.</div>`}`;
  }
  subscribeDocs();
  const L = S.docs || [];
  const env = id => (S.priv || []).filter(x => x.docId === id && x.autor === S.uid);
  return `<button class="btn primary block" id="docNovo">Criar documento</button>
   <p class="muted small" style="margin:0">Prepare antes da sessão e entregue na hora certa. Escreva entre [[ e ]] o que deve chegar tarjado; você revela depois.</p>
   ${
     L.length
       ? `<div class="cards">${L.map(d => {
           const e = env(d.id);
           const nh = docPartesDe(d.texto).filter(p => p.h).length;
           return `<div class="scene"><div class="th docthumb">${docHtml(d, { mestre: true })}</div><div class="stack" style="gap:4px;min-width:0">
     <div class="st">${esc(DOC_MOD[d.modelo] ? DOC_MOD[d.modelo].nome : "Documento")}${e.length ? ` · entregue ${e.length}×` : " · ainda não entregue"}${nh ? ` · ${(d.revelados || []).length}/${nh} trechos revelados` : ""}</div><div class="nm">${esc(docNome(d))}</div>
     <div class="row"><button class="btn sm primary" data-denv="${esc(d.id)}">Entregar</button><button class="btn sm" data-ded="${esc(d.id)}">Editar</button><button class="btn sm ghost" data-dren="${esc(d.id)}">Renomear</button>${nh && e.length ? `<button class="btn sm" data-drev="${esc(d.id)}">Revelar trechos</button>` : ""}<button class="btn sm ghost" data-dmural="${esc(d.id)}">Mural</button><button class="btn sm ghost" data-ddup="${esc(d.id)}">Duplicar</button><button class="btn sm ghost" data-ddel="${esc(d.id)}" aria-label="Apagar documento">✕</button></div></div></div>`;
         }).join("")}</div>`
       : `<div class="empty">Nenhum documento na biblioteca. Toque em <b>Criar documento</b>.</div>`
   }`;
}
function bindDocumentosBase() {
  $$("[data-dver]").forEach(
    b =>
      (b.onclick = () => {
        const x = (S.priv || []).find(y => y.id === b.dataset.dver);
        if (x) abrirDoc(x);
      })
  );
  const nv = $("#docNovo");
  if (nv) nv.onclick = () => docEditor();
  const D = id => (S.docs || []).find(d => d.id === id);
  $$("[data-ded]").forEach(b => (b.onclick = () => docEditor(D(b.dataset.ded))));
  $$("[data-dren]").forEach(
    b =>
      (b.onclick = async () => {
        const d = D(b.dataset.dren);
        if (!d) return;
        const r = await formBox(
          "Renomear documento",
          `<div class="field"><label class="label" for="drN">Nome na biblioteca</label><input type="text" id="drN" name="nome" maxlength="80" value="${esc(docNome(d))}" required></div><p class="muted small" style="margin:0">É o nome que aparece na lista e na pasta dos jogadores. O texto do documento não muda.</p>`,
          "Salvar"
        );
        if (!r || !r.nome.trim()) return;
        try {
          await S.db.merge(P() + "/docs/" + d.id, { nome: r.nome.trim() });
        } catch (e) {
          fail(e);
        }
      })
  );
  $$("[data-ddup]").forEach(
    b =>
      (b.onclick = async () => {
        const { id, revelados, ...d } = D(b.dataset.ddup);
        try {
          await S.db.add(P() + "/docs", { ...d, nome: docNome(d) + " (cópia)", criado: Date.now() });
        } catch (e) {
          fail(e);
        }
      })
  );
  $$("[data-ddel]").forEach(
    b =>
      (b.onclick = async () => {
        const d = D(b.dataset.ddel);
        if (
          !(await confirmBox(
            `Apagar "${docNome(d)}" da biblioteca?`,
            "Quem já recebeu continua com a sua cópia."
          ))
        )
          return;
        try {
          await S.db.del(P() + "/docs/" + d.id);
        } catch (e) {
          fail(e);
        }
      })
  );
  $$("[data-denv]").forEach(b => (b.onclick = () => docEntregar(D(b.dataset.denv))));
  $$("[data-drev]").forEach(b => (b.onclick = () => docRevelar(D(b.dataset.drev))));
}
async function docEntregar(d) {
  if (!d) return;
  const ops = [
    ["todos", "Todos os jogadores"],
    ...(S.membros || []).filter(m => m.id !== S.uid).map(m => [m.id, m.nome])
  ];
  const r = await formBox(
    `Entregar "${docNome(d)}"`,
    `<div class="field"><label class="label" for="deP">Para</label><select id="deP" name="para">${ops.map(([v, n]) => `<option value="${esc(v)}">${esc(n)}</option>`).join("")}</select></div>
   <p class="muted small" style="margin:0">O documento abre na tela de quem recebe e fica guardado na pasta Documentos da pessoa.</p>`,
    "Entregar"
  );
  if (!r) return;
  await docEnviar(d, r.para);
}
// A versão do documento que sai da biblioteca (para um jogador, para o mapa ou para o mural):
// os trechos tarjados não levam o texto.
function docSnapshot(d) {
  return {
    modelo: d.modelo,
    campos: d.campos || {},
    idade: d.idade || 0,
    sangue: !!d.sangue,
    queimado: !!d.queimado,
    partes: docPartesEnvio(d.texto, d.revelados || []),
    ...(d.img ? { img: d.img } : {}),
    ...(d.audio ? { audio: d.audio } : {}),
    titulo: d.titulo || "",
    nome: docNome(d)
  };
}
async function docEnviar(d, para) {
  const doc = docSnapshot(d);
  const body = {
    autor: S.uid,
    quem: "Mestre",
    para,
    paraNome: para === "todos" ? "todos" : nomeMembro(para),
    tipo: "doc",
    titulo: String(docNome(d)).slice(0, 200),
    det: "",
    ts: Date.now(),
    docId: d.id || null,
    doc
  };
  try {
    await S.db.add(P() + "/privado", body);
    toast("Documento entregue.");
  } catch (e) {
    fail(e);
  }
}
async function docRevelar(d) {
  const hs = docPartesDe(d.texto).filter(p => p.h);
  const rev = new Set(d.revelados || []);
  const r = await formBox(
    "Revelar trechos",
    `<p class="muted small" style="margin:0">Marque o que os jogadores passam a ler. Vale para todas as cópias já entregues deste documento.</p>
   ${hs.map((p, i) => `<label class="check"><input type="checkbox" name="r${i}" ${rev.has(i) ? "checked" : ""}> <span>${esc(p.t.length > 90 ? p.t.slice(0, 90) + "…" : p.t)}</span></label>`).join("")}`,
    "Revelar"
  );
  if (!r) return;
  const novos = hs.map((p, i) => (r["r" + i] ? i : -1)).filter(i => i >= 0);
  try {
    await S.db.merge(P() + "/docs/" + d.id, { revelados: novos });
    const partes = docPartesEnvio(d.texto, novos);
    for (const x of (S.priv || []).filter(y => y.docId === d.id && y.autor === S.uid))
      await S.db.merge(P() + "/privado/" + x.id, { doc: { ...x.doc, partes }, rev: (x.rev || 0) + 1 });
    for (const m of (S.mapDocs || []).filter(y => y.docId === d.id))
      await S.db.merge(P() + "/estado/" + m.id, { doc: { ...m.doc, partes }, rev: (m.rev || 0) + 1 });
    const mural = S.mural || (await S.db.getCol(P() + "/mural"));
    for (const m of mural.filter(y => y.tipo === "doc" && y.docId === d.id))
      await S.db.merge(P() + "/mural/" + m.id, { doc: { ...m.doc, partes } });
    toast(novos.length > (d.revelados || []).length ? "Trechos revelados para os jogadores." : "Pronto.");
  } catch (e) {
    fail(e);
  }
}

/* ---------- leitura ---------- */
function abrirDoc(e) {
  const h = $("#modalHost");
  const d = e.doc || { modelo: "simples", titulo: e.titulo, partes: [{ t: e.det || "" }], img: e.img };
  h.innerHTML = `<div class="modal-back docback"><div class="docview" role="dialog" aria-label="${esc(e.titulo)}">
   <div class="row between" style="margin-bottom:10px"><span class="label">${(e.quem || "Mestre") === "Mestre" ? "Documento do mestre" : "Documento de " + esc(e.quem)}${e.para === "todos" ? "" : " · só para você"}</span><button class="btn sm" id="dOk">Fechar</button></div>
   ${docHtml({ ...d, titulo: d.titulo || e.titulo })}</div></div>`;
  $("#dOk").onclick = () => {
    h.innerHTML = "";
    S.docAberto = null;
  };
  h.querySelector(".modal-back").onclick = ev => {
    if (ev.target.classList.contains("modal-back")) {
      h.innerHTML = "";
      S.docAberto = null;
    }
  };
  S.docAberto = e.id;
  docLeituraExtras(e); // anotações e mural (5u-mural-notas.js)
}

/* ---------- editor ---------- */
async function docEditor(d0) {
  if (!S.isM) return;
  const d = JSON.parse(
    JSON.stringify(
      d0 || {
        modelo: "relatorio",
        titulo: "",
        campos: {},
        texto: "",
        idade: 1,
        sangue: false,
        queimado: false
      }
    )
  );
  DOC_MODELOS.forEach(m =>
    m.campos.forEach(([k, , def]) => {
      if (d.modelo === m.id && d.campos[k] === undefined && def) d.campos[k] = def;
    })
  );
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div class="docEd" id="docEd"><div class="me-top"><button class="btn sm ghost" id="deX">✕ Fechar</button><b style="font-family:var(--f-display);font-size:18px">${d0 ? "Editar documento" : "Novo documento"}</b><span class="me-gap"></span><button class="btn sm" id="deSalvar">Salvar na biblioteca</button><button class="btn sm primary" id="deEnviar">Salvar e entregar…</button></div>
   <div class="de-main"><form class="de-form" id="deForm" onsubmit="return false"></form><div class="de-prev" id="dePrev"></div></div></div>`
  );
  document.body.classList.add("me-open");
  const form = $("#deForm"),
    prev = $("#dePrev");
  const draw = () => {
    prev.innerHTML = docHtml(d, { mestre: true });
  };
  const build = () => {
    const M = DOC_MOD[d.modelo];
    form.innerHTML = `<div class="sub" style="margin:0">Modelo</div><div class="de-mods">${DOC_MODELOS.map(m => `<button type="button" class="de-mod ${d.modelo === m.id ? "on" : ""}" data-dm="${m.id}"><span class="docico m-${m.id}"></span><b>${esc(m.nome)}</b></button>`).join("")}</div>
     <p class="muted small" style="margin:0">${esc(M.desc)}</p>
     <div class="field"><label class="label" for="deT">${M.id === "carta" || M.id === "bilhete" || M.id === "diario" ? "Primeira linha (opcional)" : "Título"}</label><input type="text" id="deT" maxlength="120" value="${esc(d.titulo || "")}" placeholder="${M.id === "jornal" ? "Manchete" : M.id === "carta" ? "Querida Ana," : ""}"></div>
     ${M.campos.map(([k, n, def]) => `<div class="field"><label class="label" for="dc_${k}">${esc(n)}</label><input type="text" id="dc_${k}" data-ck="${k}" maxlength="120" value="${esc(d.campos[k] ?? "")}" placeholder="${esc(def)}"></div>`).join("")}
     <div class="field"><div class="row between"><label class="label" for="deTx">Texto</label><span class="row" style="gap:4px"><select id="deTj" aria-label="Estilo da tarja" title="Estilo da tarja">${(DOC_TARJAS[M.id] || DOC_TARJAS.simples).map(e => `<option value="${e}">${esc(TARJA_ESTILOS[e])}</option>`).join("")}</select><button type="button" class="btn sm" id="deHide" title="Escolha um trecho do texto e toque aqui">Tarjar trecho</button><button type="button" class="btn sm" id="deBold"><b>N</b></button></span></div>
      <textarea id="deTx" rows="12" maxlength="6000" placeholder="${M.id === "celular" ? "Ana: você viu aquilo?\nEu: vi. não conta pra ninguém\nAna: [[eles estão no porão]]" : "Escreva aqui. Use [[ e ]] em volta do que deve chegar tarjado."}">${esc(d.texto || "")}</textarea></div>
     ${
       M.id === "audio"
         ? `<div class="row">${S.gravando ? `<button type="button" class="btn sm danger" id="deRecStop">■ Parar a gravação</button>` : `<button type="button" class="btn sm primary" id="deRec">● Gravar pelo microfone</button>`}<button type="button" class="btn sm" id="deAudF">Subir arquivo</button><button type="button" class="btn sm" id="deAudL">Colar link</button>${d.audio ? `<button type="button" class="btn sm ghost" id="deAudX">Tirar áudio</button>` : ""}</div>
     <p class="muted small" style="margin:0">Gravação de até 90 segundos. Arquivo de até 500 KB (um MP3 curto); para um áudio maior, suba no GitHub e cole o link.</p>`
         : ""
     }
     ${M.img || d.img ? `<div class="row"><button type="button" class="btn sm" id="deImg">${d.img ? (d.modelo === "foto" ? "Trocar a foto" : "Trocar imagem") : d.modelo === "foto" ? "Subir a foto" : "Pôr uma imagem"}</button>${d.img ? `<button type="button" class="btn sm ghost" id="deImgX">Tirar imagem</button>` : ""}</div>` : ""}
     <div class="sub" style="margin:0">Aparência</div>
     <div class="row" style="flex-wrap:nowrap"><label class="label" for="deI" style="white-space:nowrap;margin:0">Papel</label><select id="deI">${["Novo", "Usado", "Velho e manchado"].map((n, i) => `<option value="${i}" ${(+d.idade || 0) === i ? "selected" : ""}>${n}</option>`).join("")}</select></div>
     <label class="check"><input type="checkbox" id="deS" ${d.sangue ? "checked" : ""}> Manchas de sangue</label><label class="check"><input type="checkbox" id="deQ" ${d.queimado ? "checked" : ""}> Bordas queimadas</label>`;
    $$("[data-dm]", form).forEach(
      b =>
        (b.onclick = () => {
          d.modelo = b.dataset.dm;
          DOC_MOD[d.modelo].campos.forEach(([k, , def]) => {
            if (!d.campos[k] && def) d.campos[k] = def;
          });
          build();
          draw();
        })
    );
    $("#deT").oninput = e => {
      d.titulo = e.target.value;
      draw();
    };
    $$("[data-ck]", form).forEach(
      i =>
        (i.oninput = () => {
          d.campos[i.dataset.ck] = i.value;
          draw();
        })
    );
    const tx = $("#deTx");
    tx.oninput = () => {
      d.texto = tx.value;
      draw();
    };
    const wrap = (a, b) => {
      const s = tx.selectionStart,
        e = tx.selectionEnd;
      if (s === e) {
        toast("Escolha (selecione) um trecho do texto primeiro.");
        return;
      }
      tx.value = tx.value.slice(0, s) + a + tx.value.slice(s, e) + b + tx.value.slice(e);
      d.texto = tx.value;
      draw();
      tx.focus();
    };
    $("#deHide").onclick = () => {
      const e = $("#deTj").value;
      wrap(e === (DOC_TARJAS[M.id] || DOC_TARJAS.simples)[0] ? "[[" : "[[" + e + ":", "]]");
    };
    const aud = url => {
      d.audio = url;
      build();
      draw();
    };
    const rec = $("#deRec");
    if (rec)
      rec.onclick = async () => {
        try {
          const st = await navigator.mediaDevices.getUserMedia({ audio: true });
          const tipo = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"].find(
            t => window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)
          );
          const mr = new MediaRecorder(st, {
            ...(tipo ? { mimeType: tipo } : {}),
            audioBitsPerSecond: 24000
          });
          const pedacos = [];
          mr.ondataavailable = ev => ev.data.size && pedacos.push(ev.data);
          mr.onstop = () => {
            st.getTracks().forEach(t => t.stop());
            S.gravando = null;
            const fr = new FileReader();
            fr.onload = () => {
              if (fr.result.length > 700000) {
                toast("A gravação ficou grande demais. Grave um trecho mais curto.");
                build();
                return;
              }
              aud(fr.result);
            };
            fr.readAsDataURL(new Blob(pedacos, { type: mr.mimeType || tipo || "audio/webm" }));
          };
          mr.start();
          S.gravando = { mr, fim: setTimeout(() => mr.state === "recording" && mr.stop(), 90000) };
          build();
        } catch (e) {
          toast("Não consegui usar o microfone. Libere o acesso ao microfone no navegador.");
        }
      };
    const recStop = $("#deRecStop");
    if (recStop)
      recStop.onclick = () => {
        if (!S.gravando) return;
        clearTimeout(S.gravando.fim);
        S.gravando.mr.stop();
      };
    const audF = $("#deAudF");
    if (audF)
      audF.onclick = () => {
        const inp = document.createElement("input");
        inp.type = "file";
        inp.accept = "audio/*";
        inp.onchange = () => {
          const f = inp.files && inp.files[0];
          if (!f) return;
          if (f.size > 500000) {
            toast("Arquivo grande (máximo 500 KB). Grave pelo microfone ou suba no GitHub e cole o link.");
            return;
          }
          const fr = new FileReader();
          fr.onload = () => aud(fr.result);
          fr.readAsDataURL(f);
        };
        inp.click();
      };
    const audL = $("#deAudL");
    if (audL)
      audL.onclick = async () => {
        const r = await formBox(
          "Link do áudio",
          `<div class="field"><label class="label" for="daL">Link direto de um MP3 ou OGG</label><input type="url" id="daL" name="url" placeholder="https://..." required></div>`,
          "Usar"
        );
        if (!r) return;
        if (!/^https:\/\//.test(r.url.trim())) {
          toast("Use um link que comece com https://");
          return;
        }
        aud(r.url.trim());
      };
    const audX = $("#deAudX");
    if (audX)
      audX.onclick = () => {
        delete d.audio;
        build();
        draw();
      };
    $("#deBold").onclick = () => wrap("**", "**");
    const im = $("#deImg");
    if (im)
      im.onclick = async () => {
        const f = await pickImage();
        if (!f) return;
        try {
          d.img = (await compressScene(f)).url;
          if (d.img.length > 600000) {
            toast("Imagem grande: diminuí a qualidade.");
          }
          build();
          draw();
        } catch (e) {
          toast("Não consegui usar essa imagem.");
        }
      };
    const ix = $("#deImgX");
    if (ix)
      ix.onclick = () => {
        delete d.img;
        build();
        draw();
      };
    $("#deI").onchange = e => {
      d.idade = +e.target.value;
      draw();
    };
    $("#deS").onchange = e => {
      d.sangue = e.target.checked;
      draw();
    };
    $("#deQ").onchange = e => {
      d.queimado = e.target.checked;
      draw();
    };
  };
  build();
  draw();
  const fechar = () => {
    if (S.gravando) {
      clearTimeout(S.gravando.fim);
      S.gravando.mr.onstop = null;
      S.gravando.mr.stop();
      S.gravando.mr.stream.getTracks().forEach(t => t.stop());
      S.gravando = null;
    }
    const el = $("#docEd");
    if (el) el.remove();
    document.body.classList.remove("me-open");
  };
  const salvar = async () => {
    if (d.modelo === "foto" && !d.img) {
      toast("Suba a imagem da foto primeiro.");
      return null;
    }
    const { id, ...dados } = d;
    dados.criado = dados.criado || Date.now();
    dados.atualizado = Date.now();
    // se mudou o texto, os trechos revelados podem não bater mais: mantém só os que ainda existem
    const nh = docPartesDe(dados.texto).filter(p => p.h).length;
    dados.revelados = (dados.revelados || []).filter(i => i < nh);
    try {
      if (id) {
        await S.db.set(P() + "/docs/" + id, dados);
        return { id, ...dados };
      }
      const nid = await S.db.add(P() + "/docs", dados);
      return { id: nid, ...dados };
    } catch (e) {
      fail(e);
      return null;
    }
  };
  $("#deX").onclick = async () => {
    if (
      JSON.stringify(d) !==
        JSON.stringify(
          d0 || {
            modelo: "relatorio",
            titulo: "",
            campos: {},
            texto: "",
            idade: 1,
            sangue: false,
            queimado: false
          }
        ) &&
      !(await confirmBox("Fechar sem salvar?", "O que você escreveu aqui se perde.", "Fechar"))
    )
      return;
    fechar();
  };
  $("#deSalvar").onclick = async () => {
    const s = await salvar();
    if (s) {
      toast("Documento guardado na biblioteca.");
      fechar();
    }
  };
  $("#deEnviar").onclick = async () => {
    const s = await salvar();
    if (!s) return;
    fechar();
    docEntregar(s);
  };
}
</script>
