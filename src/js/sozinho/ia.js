"use strict";
/* Jogar sozinho — mestre com IA. Usa o Gemini do Google no plano grátis, com a chave de quem joga:
   cada pessoa usa a sua, então o limite grátis do dia é de cada um, e nada passa por servidor nosso.
   A chave fica só neste navegador. A IA só escreve: os testes, a DT, o dano e as criaturas continuam
   com as regras do site. Se ela falhar ou o limite do dia acabar, a missão segue com os modelos. */

const IA_URL = "https://generativelanguage.googleapis.com/v1beta/";
const iaChave = () => String(lsGet("ms_iaChave", "") || "").trim();
const iaHoje = () => new Date().toISOString().slice(0, 10);
function iaLigada() {
  return !!iaChave() && lsGet("ms_iaPausa", "") !== iaHoje();
}
function iaGuardarChave(chave) {
  chave = String(chave || "").trim();
  if (chave === iaChave()) return;
  lsSet("ms_iaChave", chave);
  lsSet("ms_iaModelo", "");
  lsSet("ms_iaPausa", "");
  S.iaModelo = null;
}
/* Erro da IA com o motivo que importa para quem joga */
function iaErro(status, corpo) {
  const e = new Error("ia " + status);
  e.status = status;
  e.limite = status === 429;
  e.chave = status === 403 || (status === 400 && /API_KEY|api key/i.test(corpo || ""));
  return e;
}
/* Quando a IA não dá: avisa uma vez e o mestre continua com os modelos */
function iaFalhou(e) {
  console.warn("IA:", e && e.message);
  if (e && e.limite) {
    lsSet("ms_iaPausa", iaHoje());
    toast("A IA chegou no limite grátis de hoje. O mestre continua sem IA até amanhã.");
  } else if (e && e.chave) {
    lsSet("ms_iaChave", "");
    toast("A chave do Gemini não funcionou. O mestre continua sem IA. Confira a chave em Jogar sozinho.");
  } else if (!S.iaAvisou) {
    S.iaAvisou = true;
    toast("A IA não respondeu agora. Esta parte foi com o texto padrão.");
  }
  if (S.missao) missaoMostrar();
}
/* O modelo: o Flash-Lite mais novo (é o que tem mais pedidos grátis por dia); senão, o Flash */
async function iaModelo() {
  if (S.iaModelo) return S.iaModelo;
  const salvo = lsGet("ms_iaModelo", "");
  if (salvo) return (S.iaModelo = salvo);
  const r = await fetch(IA_URL + "models?pageSize=200", { headers: { "x-goog-api-key": iaChave() } });
  if (!r.ok) throw iaErro(r.status, await r.text());
  const j = await r.json();
  const ok = (j.models || []).filter(
    m =>
      (m.supportedGenerationMethods || []).includes("generateContent") &&
      /gemini/.test(m.name) &&
      !/preview|exp|tts|image|live|embedding|audio|thinking/i.test(m.name)
  );
  const ver = n => parseFloat((n.match(/gemini-(\d+(\.\d+)?)/) || [0, 0])[1]);
  const melhor = re => ok.filter(m => re.test(m.name)).sort((a, b) => ver(b.name) - ver(a.name))[0];
  const m = melhor(/flash-lite/) || melhor(/flash/) || ok[0];
  if (!m) throw new Error("sem modelo");
  S.iaModelo = m.name.replace(/^models\//, "");
  lsSet("ms_iaModelo", S.iaModelo);
  return S.iaModelo;
}
/* Um pedido para a IA. json: a resposta vem como objeto. */
async function iaPedir(sistema, texto, json = false, tentativa = 0) {
  const modelo = await iaModelo();
  const r = await fetch(`${IA_URL}models/${modelo}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": iaChave() },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: sistema }] },
      contents: [{ role: "user", parts: [{ text: texto }] }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 600,
        ...(json ? { responseMimeType: "application/json" } : {})
      }
    })
  });
  if (r.status === 404 && !tentativa) {
    // o modelo guardado saiu do ar: escolhe outro e tenta de novo
    lsSet("ms_iaModelo", "");
    S.iaModelo = null;
    return iaPedir(sistema, texto, json, 1);
  }
  if (!r.ok) throw iaErro(r.status, await r.text());
  const j = await r.json();
  const c = (j.candidates || [])[0];
  const out = ((c && c.content && c.content.parts) || [])
    .map(p => p.text || "")
    .join("")
    .trim();
  if (!out) throw new Error("resposta vazia");
  return json ? JSON.parse(out.replace(/^```(json)?|```$/g, "")) : out;
}
const IA_MESTRE =
  "Você é o mestre de uma partida solo de RPG de investigação paranormal, no clima de Ordem Paranormal: agentes da Ordem investigam o Outro Lado e as criaturas dos elementos Sangue, Morte, Conhecimento, Energia e Medo. " +
  "Escreva em português do Brasil, falando com o agente em segunda pessoa, com 2 a 4 frases curtas e clima de suspense. " +
  "Mantenha todos os fatos do texto-base (nomes, lugares, a pista, a consequência e os números). Você pode trocar as palavras e acrescentar detalhes de ambiente, sons e reações das pessoas. " +
  "Não invente regras, números, itens nem criaturas novas, não decida resultados de testes e não copie textos de livros. Responda só com o texto, sem aspas nem títulos.";
/* O texto do mestre escrito pela IA, a partir do texto-base dos modelos (sozinho/missao) */
async function iaNarrar(tipo, c, base) {
  const m = c.m;
  const ctx = [
    `Momento da história: ${tipo}.`,
    `Caso: "${m.titulo}" em ${m.cidade}; elemento ${m.el}; quem pediu ajuda: ${m.pessoa}.`,
    `Agente: ${c.eu}${c.aliados ? `; aliados: ${c.aliados}` : ""}.`,
    c.acao ? `O que o agente fez: ${c.acao}.` : "",
    c.extra ? `Nas palavras do jogador: "${c.extra}".` : "",
    `Texto-base: ${base}`
  ]
    .filter(Boolean)
    .join("\n");
  const t = await iaPedir(IA_MESTRE, ctx);
  return t.slice(0, 900);
}
/* Ação escrita pelo jogador: a IA escolhe a perícia do teste (a DT e a rolagem são do site) */
async function iaInterpretar(acao, M) {
  const pericias = PERICIAS.map(p => p[0]).filter(p => !["Profissão"].includes(p));
  const j = await iaPedir(
    "Você ajuda o mestre de um RPG de investigação paranormal a aplicar as regras. O jogador escreveu o que o agente faz. " +
      `Escolha UMA perícia desta lista que represente a ação: ${pericias.join(", ")}. ` +
      'Diga também se a ação faz sentido na cena (investigar, conversar, procurar, estudar algo do caso). Responda só em JSON: {"pericia": "...", "faz_sentido": true, "motivo": "uma frase curta, em português, para quando não faz sentido"}.',
    `Caso: "${M.m.titulo}" em ${M.m.cidade}, elemento ${M.m.el}, lugar: ${M.m.local1}. Ação do jogador: "${acao}"`,
    true
  );
  const pericia =
    pericias.find(p => p.toLowerCase() === String(j.pericia || "").toLowerCase()) || "Investigação";
  return { pericia, ok: j.faz_sentido !== false, motivo: String(j.motivo || "").slice(0, 200) };
}
