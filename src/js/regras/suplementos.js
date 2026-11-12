"use strict";
/* Suplementos: Sobrevivendo ao Horror e Arquivos Secretos (só nomes e números). */
/* =====================================================================
   SUPLEMENTOS: Sobrevivendo ao Horror (SaH) e Arquivos Secretos (AS01–AS07)
   Só nomes, perícias e números de regra. Sem textos de ambientação.
   Tudo é somado às listas do livro básico.
   ===================================================================== */
const PODERES_GERAIS = []; // [nome, fonte]
const FONTE_DE = {}; // nome -> fonte (para mostrar nas listas)
const FONTE_CLASSE = {};
const FONTE_AME = {}; // fonte das ameaças (separado: "Investigador" é origem e ficha de ameaça)            // poder que é de classe (não só geral)
Object.values(CLASSES).forEach(c => c.poderes.forEach(p => (FONTE_CLASSE[p] = 1)));
function fonteTag(n) {
  const f = FONTE_DE[n];
  return f ? " [" + f + "]" : "";
}
function supOrigem(nome, pericias, poder, fonte) {
  if (!ORIGENS[nome]) ORIGENS[nome] = [pericias, poder];
  FONTE_DE[nome] = fonte;
}
function supPoderClasse(classe, nomes, fonte) {
  const c = CLASSES[classe];
  nomes.forEach(n => {
    if (!c.poderes.includes(n)) c.poderes.push(n);
    FONTE_CLASSE[n] = 1;
    if (!FONTE_DE[n]) FONTE_DE[n] = fonte;
  });
}
function supTrilha(classe, nome, habs, fonte) {
  CLASSES[classe].trilhas[nome] = habs;
  FONTE_DE[nome] = fonte;
}
function supGeral(nomes, fonte) {
  nomes.forEach(n => {
    if (!PODERES_GERAIS.some(p => p[0] === n)) PODERES_GERAIS.push([n, fonte]);
    if (!FONTE_DE[n] && !FONTE_CLASSE[n]) FONTE_DE[n] = fonte;
  });
}
function supParanormal(lista, fonte) {
  lista.forEach(([n, el]) => {
    if (!PODERES_PARANORMAIS.some(p => p[0] === n)) PODERES_PARANORMAIS.push([n, el]);
    FONTE_DE[n] = fonte;
  });
}
function supRitual(r, fonte) {
  if (!RITUAIS_LIVRO.some(x => x[0] === r[0])) RITUAIS_LIVRO.push(r);
  FONTE_DE[r[0]] = fonte;
}
function supItem(lista, fonte) {
  lista.forEach(i => {
    if (!ITENS_GERAIS.some(x => x[0] === i[0])) ITENS_GERAIS.push(i);
    FONTE_DE[i[0]] = fonte;
  });
}
function supAmaldicoado(lista, fonte) {
  lista.forEach(i => {
    if (!AMALDICOADOS.some(x => x[0] === i[0])) AMALDICOADOS.push(i);
    FONTE_DE[i[0]] = fonte;
  });
}
function supArma(lista, fonte) {
  lista.forEach(a => {
    if (!ARMAS_LIVRO.some(x => x[0] === a[0])) ARMAS_LIVRO.push(a);
    FONTE_DE[a[0]] = fonte;
  });
}

/* ---------------- Sobrevivendo ao Horror ---------------- */
[
  ["Amigo dos Animais", ["Adestramento", "Percepção"], "Companheiro Animal"],
  ["Astronauta", ["Ciências", "Fortitude"], "Acostumado ao Extremo"],
  ["Chef do Outro Lado", ["Ocultismo", "Profissão"], "Fome do Outro Lado"],
  ["Colegial", ["Atualidades", "Tecnologia"], "Poder da Amizade"],
  ["Cosplayer", ["Artes", "Vontade"], "Não é Fantasia, é Cosplay!"],
  ["Diplomata", ["Atualidades", "Diplomacia"], "Conexões"],
  ["Explorador", ["Fortitude", "Sobrevivência"], "Manual do Sobrevivente"],
  ["Experimento", ["Atletismo", "Fortitude"], "Mutação"],
  ["Fanático por Criaturas", ["Investigação", "Ocultismo"], "Conhecimento Oculto"],
  ["Fotógrafo", ["Artes", "Percepção"], "Através da Lente"],
  ["Inventor Paranormal", ["Profissão", "Vontade"], "Invenção Paranormal"],
  ["Jovem Místico", ["Ocultismo", "Religião"], "A Culpa é das Estrelas"],
  ["Legista do Turno da Noite", ["Ciências", "Medicina"], "Luto Habitual"],
  ["Mateiro", ["Percepção", "Sobrevivência"], "Mapa Celeste"],
  ["Mergulhador", ["Atletismo", "Fortitude"], "Fôlego de Nadador"],
  ["Motorista", ["Pilotagem", "Reflexos"], "Mãos no Volante"],
  ["Nerd Entusiasta", ["Ciências", "Tecnologia"], "O Inteligentão"],
  ["Profetizado", ["Vontade"], "Luta ou Fuga"],
  ["Psicólogo", ["Intuição", "Profissão"], "Terapia"],
  ["Repórter Investigativo", ["Atualidades", "Investigação"], "Encontrar a Verdade"]
].forEach(([n, p, po]) => supOrigem(n, p, po, "SaH"));
supPoderClasse(
  "Combatente",
  [
    "Caminho para Forca",
    "Ciente das Cicatrizes",
    "Correria Desesperada",
    "Engolir o Choro",
    "Instinto de Fuga",
    "Mochileiro",
    "Paranoia Defensiva",
    "Sacrificar os Joelhos",
    "Valentão"
  ],
  "SaH"
);
supPoderClasse(
  "Especialista",
  [
    "Acolher o Terror",
    "Contatos Oportunos",
    "Esconderijo Desesperado",
    "Especialista Diletante",
    "Flashback",
    "Leitura Fria",
    "Mãos Firmes",
    "Plano de Fuga",
    "Remoer Memórias",
    "Resistir à Pressão"
  ],
  "SaH"
);
supPoderClasse(
  "Ocultista",
  [
    "Deixe os Sussurros Guiarem",
    "Domínio Esotérico",
    "Nos Olhos do Monstro",
    "Olhar Sinistro",
    "Sentido Premonitório",
    "Sincronia Paranormal"
  ],
  "SaH"
);
supTrilha(
  "Combatente",
  "Agente Secreto",
  ["Carteirada", "O Sorriso", "Método Investigativo", "Multifacetado"],
  "SaH"
);
supTrilha(
  "Combatente",
  "Caçador",
  ["Rastrear o Paranormal", "Estudar Fraquezas", "Atacar das Sombras", "Estudar a Presa"],
  "SaH"
);
supTrilha(
  "Combatente",
  "Monstruoso",
  ["Ser Amaldiçoado", "Ser Macabro", "Ser Assustador", "Ser Aterrorizante"],
  "SaH"
);
supTrilha(
  "Especialista",
  "Bibliotecário",
  ["Conhecimento Prático", "Leitor Contumaz", "Rato de Biblioteca", "A Força do Saber"],
  "SaH"
);
supTrilha(
  "Especialista",
  "Perseverante",
  ["Soluções Improvisadas", "Fuga Obstinada", "Determinação Inquestionável", "Só Mais um Passo..."],
  "SaH"
);
supTrilha(
  "Especialista",
  "Muambeiro",
  ["Mascate", "Fabricação Própria", "Laboratório de Campo", "Achado Conveniente"],
  "SaH"
);
supTrilha(
  "Ocultista",
  "Exorcista",
  ["Revelação do Mal", "Poder da Fé", "Parareligiosidade", "Chagas da Resistência"],
  "SaH"
);
supTrilha(
  "Ocultista",
  "Possuído",
  ["Poder Não Desejado", "As Sombras Dentro de Mim", "Ele Me Ensina", "Tornamo-nos Um"],
  "SaH"
);
supTrilha(
  "Ocultista",
  "Parapsicólogo",
  ["Terapia", "Palavras-chave", "Reprogramação Mental", "A Sanidade Está Lá Fora"],
  "SaH"
);
supGeral(
  [
    "Acrobático",
    "Ás do Volante",
    "Atlético",
    "Atraente",
    "Dedos Ágeis",
    "Detector de Mentiras",
    "Especialista em Emergências",
    "Estigmado",
    "Foco em Perícia",
    "Inventário Organizado",
    "Informado",
    "Interrogador",
    "Mentiroso Nato",
    "Observador",
    "Pai de Pet",
    "Palavras de Devoção",
    "Parceiro",
    "Pensamento Tático",
    "Personalidade Esotérica",
    "Persuasivo",
    "Pesquisador Científico",
    "Proativo",
    "Provisões de Emergência",
    "Racionalidade Inflexível",
    "Rato de Computador",
    "Resposta Rápida",
    "Talentoso",
    "Teimosia Obstinada",
    "Tenacidade",
    "Sentidos Aguçados",
    "Sobrevivencialista",
    "Sorrateiro",
    "Vitalidade Reforçada",
    "Vontade Inabalável",
    "Artista Marcial",
    "Combater com Duas Armas",
    "Saque Rápido",
    "Tiro Certeiro"
  ],
  "SaH"
);
supParanormal(
  [
    ["Absorver Conhecimento", "Conhecimento"],
    ["Apatia Herege", "Conhecimento"],
    ["Antecipar Vitalidade", "Morte"],
    ["Aura de Pavor", "Morte"],
    ["Conexão Empática", "Energia"],
    ["Valer-se do Caos", "Energia"],
    ["Espreitar da Besta", "Sangue"],
    ["Instintos Sanguinários", "Sangue"]
  ],
  "SaH"
);
[
  [
    "Esfolar",
    "Sangue",
    1,
    "padrão",
    "curto",
    "1 ser",
    "instantânea",
    "Reflexos parcial",
    "3d4+3",
    [2, "5d4+5", "2º círculo"],
    [5, "10d4+10", "3º círculo"],
    "dano"
  ],
  [
    "Sede de Adrenalina",
    "Sangue",
    2,
    "reação",
    "pessoal",
    "você",
    "instantânea",
    "",
    "",
    [3, "", ""],
    [7, "", "4º círculo e afinidade"],
    ""
  ],
  [
    "Odor da Caçada",
    "Sangue",
    3,
    "padrão",
    "pessoal",
    "você",
    "cena",
    "",
    "",
    [4, "", ""],
    [9, "", "afinidade"],
    ""
  ],
  [
    "Martírio de Sangue",
    "Sangue",
    4,
    "padrão",
    "pessoal",
    "você",
    "veja texto",
    "",
    "",
    [5, "", "afinidade"],
    null,
    ""
  ],
  [
    "Apagar as Luzes",
    "Morte",
    1,
    "padrão",
    "pessoal",
    "você",
    "instantânea",
    "",
    "",
    [2, "", "2º círculo"],
    [5, "", "3º círculo"],
    ""
  ],
  [
    "Língua Morta",
    "Morte",
    2,
    "padrão",
    "toque",
    "1 cadáver",
    "sustentada",
    "",
    "",
    [3, "", ""],
    [7, "", "4º círculo e afinidade"],
    ""
  ],
  [
    "Fedor Pútrido",
    "Morte",
    3,
    "padrão",
    "pessoal",
    "você",
    "sustentada",
    "",
    "",
    [4, "", ""],
    [9, "", "afinidade"],
    ""
  ],
  [
    "Singularidade Temporal",
    "Morte",
    4,
    "padrão",
    "curto",
    "1 objeto não paranormal Médio",
    "instantânea",
    "veja texto",
    "",
    [5, "", ""],
    [10, "", ""],
    ""
  ],
  [
    "Desfazer Sinapses",
    "Conhecimento",
    1,
    "padrão",
    "curto",
    "1 ser",
    "instantânea",
    "Vontade parcial",
    "2d6+2",
    [2, "3d6+3", "2º círculo"],
    [5, "8d6+8", "3º círculo"],
    "dano"
  ],
  [
    "Aurora da Verdade",
    "Conhecimento",
    2,
    "padrão",
    "curto",
    "esfera com 3m de raio",
    "sustentada",
    "Vontade parcial",
    "",
    [3, "", ""],
    [7, "", "4º círculo e afinidade"],
    ""
  ],
  [
    "Relembrar Fragmento",
    "Conhecimento",
    3,
    "padrão",
    "toque",
    "1 objeto",
    "instantânea",
    "",
    "",
    [4, "", ""],
    [9, "", "afinidade"],
    ""
  ],
  [
    "Pronunciar Sigilo",
    "Conhecimento",
    4,
    "padrão",
    "curto",
    "1 ser",
    "instantânea / veja texto",
    "Vontade parcial",
    "",
    [5, "", ""],
    [10, "", "afinidade"],
    ""
  ],
  [
    "Overclock",
    "Energia",
    1,
    "reação",
    "pessoal",
    "você",
    "instantânea",
    "",
    "",
    [2, "", "2º círculo"],
    [5, "", "3º círculo"],
    ""
  ],
  [
    "Tremeluzir",
    "Energia",
    2,
    "padrão",
    "pessoal",
    "você",
    "sustentada",
    "",
    "",
    [3, "", ""],
    [7, "", "4º círculo"],
    ""
  ],
  [
    "Mutar",
    "Energia",
    3,
    "padrão",
    "pessoal",
    "você",
    "cena",
    "",
    "",
    [4, "", ""],
    [9, "", "afinidade com Energia"],
    ""
  ],
  ["Milagre Ionizante", "Energia", 3, "completa", "toque", "1 ser", "instantânea", "", "", null, null, ""]
].forEach(r => supRitual(r, "SaH"));
supArma(
  [
    ["Pregador pneumático", "simples", "Disparo · uma mão", "0", "1d4", "x4", "Curto", "P", 1, 0],
    ["Estilingue", "simples", "Disparo · duas mãos", "0", "1d4", "x2", "Curto", "I", 1, 0],
    ["Revólver compacto", "simples", "Fogo · leve", "I", "2d4", "19/x3", "Curto", "P", 1, 0],
    ["Baioneta", "táticas", "Corpo a corpo · leve", "0", "1d4", "19", "—", "P", 1, 1],
    ["Faca tática", "táticas", "Corpo a corpo · leve", "I", "1d6", "19", "Curto", "C", 1, 1],
    ["Gancho de carne", "táticas", "Corpo a corpo · leve", "0", "1d4", "x4", "—", "P", 1, 1],
    ["Bastão policial", "táticas", "Corpo a corpo · uma mão", "I", "1d6", "x2", "Curto", "I", 1, 0],
    ["Picareta", "táticas", "Corpo a corpo · uma mão", "0", "1d6", "x4", "—", "P", 1, 0],
    ["Shuriken", "táticas", "Arremesso", "I", "1d4", "x2", "Curto", "P", 0.5, 1],
    ["Pistola pesada", "táticas", "Fogo · uma mão", "I", "2d8", "18", "Curto", "B", 1, 0],
    ["Espingarda de cano duplo", "táticas", "Fogo · duas mãos", "II", "4d6", "x3", "Curto", "B", 2, 0]
  ],
  "SaH"
);
supItem(
  [
    ["Amuleto sagrado", "Acessórios", "0", 1],
    ["Celular", "Acessórios", "0", 1],
    ["Chave de fenda universal", "Acessórios", "0", 1],
    ["Chaves", "Acessórios", "0", 1],
    ["Documentos falsos", "Acessórios", "I", 1],
    ["Manual operacional", "Acessórios", "I", 1],
    ["Notebook", "Acessórios", "0", 2],
    ["Dinamite", "Explosivos", "I", 1],
    ["Explosivo plástico", "Explosivos", "I", 1],
    ["Galão vermelho", "Explosivos", "0", 2],
    ["Granada de gás sonífero", "Explosivos", "I", 1],
    ["Granada de PEM", "Explosivos", "I", 1],
    ["Alarme de movimento", "Itens operacionais", "0", 1],
    ["Alimento energético", "Itens operacionais", "II", 1],
    ["Aplicador de medicamentos", "Itens operacionais", "I", 1],
    ["Braçadeira reforçada", "Itens operacionais", "I", 1],
    ["Cão adestrado", "Itens operacionais", "I", 0],
    ["Coldre saque rápido", "Itens operacionais", "I", 1],
    ["Equipamento de escuta", "Itens operacionais", "I", 1],
    ["Estrepes (saco)", "Itens operacionais", "0", 1],
    ["Faixa de pregos", "Itens operacionais", "I", 2],
    ["Isqueiro", "Itens operacionais", "0", 0.5],
    ["Antibiótico", "Medicamentos", "I", 0.5],
    ["Antídoto", "Medicamentos", "I", 0.5],
    ["Antiemético", "Medicamentos", "I", 0.5],
    ["Anti-histamínico", "Medicamentos", "I", 0.5],
    ["Anti-inflamatório", "Medicamentos", "I", 0.5],
    ["Antitérmico", "Medicamentos", "I", 0.5],
    ["Broncodilatador", "Medicamentos", "I", 0.5],
    ["Coagulante", "Medicamentos", "I", 0.5],
    ["Óculos de visão noturna", "Itens operacionais", "I", 1],
    ["Óculos escuros", "Itens operacionais", "0", 1],
    ["Pá", "Itens operacionais", "0", 2],
    ["Paraquedas", "Itens operacionais", "I", 2],
    ["Traje de mergulho", "Itens operacionais", "I", 2],
    ["Traje espacial", "Itens operacionais", "II", 5],
    ["Catalisador ritualístico ampliador", "Itens paranormais", "I", 0.5],
    ["Catalisador ritualístico perturbador", "Itens paranormais", "I", 0.5],
    ["Catalisador ritualístico potencializador", "Itens paranormais", "I", 0.5],
    ["Catalisador ritualístico prolongador", "Itens paranormais", "I", 0.5],
    ["Ligação Direta Infernal", "Itens paranormais", "II", 1],
    ["Medidor de Condição Vertebral", "Itens paranormais", "II", 1],
    ["Pé de Morto", "Itens paranormais", "II", 1],
    ["Pendrive selado", "Itens paranormais", "II", 0.5],
    ["Valete da Salvação", "Itens paranormais", "I", 0.5]
  ],
  "SaH"
);
supAmaldicoado(
  [
    ["Ampulheta do Tempo Sofrido", "Morte", "II", 1],
    ["Arreio Neural", "Energia", "II", 1],
    ["Câmera Obscura", "Conhecimento", "III", 1],
    ["Centrifugador Existencial", "Energia", "III", 1],
    ["Conector de Membros", "Sangue", "III", 1],
    ["Dose d'A Praga", "Sangue", "III", 1],
    ["Enxame Fantasmagórico", "Conhecimento", "III", 1],
    ["Espelho Refletor", "Energia", "II", 1],
    ["Fuzil Alheio", "Energia", "IV", 2],
    ["Injeção de Lodo", "Morte", "II", 0.5],
    ["Instantâneo Mortal", "Morte", "II", 0.5],
    ["Mandíbula Agonizante", "Sangue", "II", 1],
    ["Primeira Adaga, A", "Medo", "III", 1],
    ["Projétil de Lodo, curto", "Morte", "I", 1],
    ["Projétil de Lodo, longo", "Morte", "II", 1],
    ["Rádio Chiador", "Morte", "II", 1],
    ["Repositório do Fracasso", "Conhecimento", "II", 1],
    ["Retalho Tenebroso", "Sangue", "II", 1],
    ["Tablet do Saber Custoso", "Conhecimento", "II", 1]
  ],
  "SaH"
);

/* ---------------- Arquivos Secretos 01 ---------------- */
supOrigem("Ferido por Ritual", ["Ocultismo"], "Mácula Ritualística", "AS01"); // + 1 perícia pelo elemento do ritual
supOrigem("Transtornado Arrependido", ["Luta", "Ocultismo"], "Sofrimento de Sangue", "AS01");
supPoderClasse(
  "Ocultista",
  ["Acostumado à Maldição de <Elemento>", "Reter Ritual de Combate", "Ritual Intenso", "Saúde Sobrenatural"],
  "AS01"
);
supTrilha(
  "Ocultista",
  "Maledictólogo",
  ["Identificação Macabra", "Compreensão de Maldições", "Reproduzir Maldição", "Maldição Suprema"],
  "AS01"
);
supGeral(
  [
    "Cicatrizes Expostas",
    "Curiosidade Oculta",
    "Especialista Exotérico",
    "<Habilidade> Aprimorada",
    "Instintos Urbanos"
  ],
  "AS01"
);
supParanormal(
  [
    ["Ferro Maculado", "Sangue"],
    ["Placas Sanguinolentas", "Sangue"],
    ["Sangue Corrosivo", "Sangue"],
    ["Sangue Prazeroso", "Sangue"]
  ],
  "AS01"
);
supRitual(
  [
    "Passagem de Conhecimento",
    "Sangue e Conhecimento",
    2,
    "completa",
    "toque",
    "1 pessoa",
    "cena",
    "Vontade evita",
    "",
    [3, "", "2º círculo"],
    [7, "", "4º círculo e afinidade"],
    ""
  ],
  "AS01"
);
supRitual(
  [
    "Passagem de Conhecimento Expandido",
    "Sangue e Conhecimento",
    4,
    "1 dia",
    "curto",
    "até 10 pessoas",
    "permanente",
    "",
    "",
    null,
    null,
    ""
  ],
  "AS01"
);

/* ---------------- Arquivos Secretos 04 ---------------- */
supOrigem("Influencer Paranormal", ["Enganação", "Tecnologia"], "Registrar o Paranormal", "AS04");
supOrigem("Caçador de Recompensas", ["Crime", "Investigação"], "Quem Não Arrisca, Não Petisca", "AS04");
supPoderClasse("Combatente", ["Chuva de Balas", "Combatente Esforçado", "Treinamento Militarizado"], "AS04");
supPoderClasse("Especialista", ["Análise Conturbada", "Profissão Perigo", "Quase Novo"], "AS04");
supPoderClasse("Ocultista", ["Explorador da Névoa", "Sinestesia Paranormal", "Terrores Noturnos"], "AS04");
supGeral(["Gororoba", "Ruído Branco", "Uma Última Olhada"], "AS04");
supParanormal(
  [
    ["Foco Gravitacional", "Energia"],
    ["Sobrepor Imprevisível", "Energia"],
    ["Traço de Inconsistência", "Energia"]
  ],
  "AS04"
);
supRitual(
  [
    "Backup",
    "Energia",
    2,
    "padrão",
    "curto",
    "veja texto",
    "24 horas",
    "",
    "",
    [2, "", "2º círculo"],
    [5, "6d6", "3º círculo"],
    ""
  ],
  "AS04"
);
supTrilha(
  "Especialista",
  "Granadeiro Blaster",
  ["Meus Bebês", "Fogo Amigo", "O Calor do Momento", "Memória Muscular"],
  "AS04"
);
supItem(
  [
    ["Granada de gás lacrimogêneo", "Explosivos", "I", 1],
    ["Granada de tinta", "Explosivos", "0", 1]
  ],
  "AS04"
);
supAmaldicoado([["Granada Ctrl+C Ctrl+V", "Energia", "II", 1]], "AS04");

/* ---------------- Arquivos Secretos 05 ---------------- */
supOrigem("Ufólogo", ["Ciências", "Ocultismo"], "Minha Teoria Absurda", "AS05");
supOrigem("Funcionário de Beira de Estrada", ["Fortitude", "Intuição"], "Turno Invertido", "AS05");
supPoderClasse("Combatente", ["Aura de Confiança", "Fôlego de Emergência", "Parede de Carne"], "AS05");
supPoderClasse("Especialista", ["Adepto do Escuro", "Saudosista Hi-Tech", "Treinado nas Telas"], "AS05");
supPoderClasse(
  "Ocultista",
  ["Catálogo de Criaturas Ambulante", "Meditação Ocultista", "Ruído de Comunicação"],
  "AS05"
);
supGeral(["Apaixonado por Veículos", "Desafiar o Ego", "Direção Defensiva"], "AS05");
supParanormal(
  [
    ["Ácido Corrosivo", "Energia"],
    ["Dead Man Switch", "Conhecimento"],
    ["Paralinguística Ampliada", "Conhecimento"]
  ],
  "AS05"
);
supTrilha(
  "Ocultista",
  "Criptologista do Oculto",
  ["Método Intuitivo", "Caligrafia Eficiente", "Decifrar à Distância", "Selo Supremo"],
  "AS05"
);
supItem([["Câmera filmadora", "Acessórios", "0", 1]], "AS05");
supAmaldicoado(
  [
    ["Faixas da Vidência", "Morte", "III", 1],
    ["Joias da Mente", "Conhecimento", "III", 1],
    ["Larva da Fúria", "Sangue", "II", 1],
    ["Skate Caótico", "Energia", "II", 2],
    ["Tênis Lépidos", "Energia", "III", 1]
  ],
  "AS05"
);

/* ---------------- Arquivos Secretos 06 ---------------- */
supOrigem("Cientista Ex-Panacea", ["Atualidades", "Ciências"], "Existe uma Explicação", "AS06");
supOrigem("Segurança Ex-Panacea", ["Luta", "Pontaria"], "Técnicas de Contenção", "AS06");
supOrigem("Cobaia Sobrevivente", ["Fortitude", "Vontade"], "Forças para Enfrentar", "AS06");
supPoderClasse("Combatente", ["Análise Combativa", "Especialista em Proteção Leve"], "AS06");
supPoderClasse(
  "Especialista",
  [
    "Doutor em Emergências",
    "Farmacêutico de Campo",
    "Médico da Salvação",
    "Resgatar da Morte",
    "Veterano da Equipe de Trauma"
  ],
  "AS06"
);
supPoderClasse("Ocultista", ["Dominador de Elemento", "Grão-Mestre em Elemento"], "AS06");
supGeral(["Adaptação Climática", "Especialista em Armas Improvisadas", "Muito Sorrateiro"], "AS06");
supParanormal(
  [
    ["Escudo Espiral Temporal", "Morte"],
    ["Grilhões de Lodo", "Morte"],
    ["Salto de Dados", "Energia"]
  ],
  "AS06"
);
supRitual(
  [
    "Hesitação Forçada",
    "Sangue e Conhecimento",
    1,
    "padrão",
    "curto",
    "1 pessoa",
    "sustentada",
    "Vontade parcial",
    "",
    [2, "", "2º círculo"],
    [5, "", "3º círculo e afinidade"],
    ""
  ],
  "AS06"
);

/* ---------------- Arquivos Secretos 07 ---------------- */
supOrigem("Exorcizado", ["Fortitude", "Ocultismo"], "O Que Restou", "AS07");
supOrigem("Sensitivo Rebelde", ["Intuição", "Vontade"], "Sussurros e Vultos", "AS07");
supRitual(
  [
    "Vampirismo",
    "Sangue",
    2,
    "completa",
    "toque",
    "1 pessoa",
    "cena",
    "",
    "",
    [5, "", "3º círculo"],
    [10, "", "4º círculo e afinidade"],
    ""
  ],
  "AS07"
);
supTrilha(
  "Especialista",
  "Monstruoso",
  ["Ser Experimentado", "Ser Testado", "Ser Expurgado", "Ser Apavorante"],
  "AS07"
);
supTrilha(
  "Ocultista",
  "Monstruoso",
  ["Ser Escarificado", "Ser Perfurado", "Ser Rasgado", "Ser Mutilado"],
  "AS07"
);
supItem(
  [
    ["Carranca Caçadora", "Itens paranormais", "II", 2],
    ["Pé de Coelho", "Itens paranormais", "I", 1],
    ["Sal Dourado", "Itens paranormais", "I", 1]
  ],
  "AS07"
);
supAmaldicoado(
  [
    ["Cajado da Cruz de Sangue", "Sangue", "III", 2],
    ["Terço Maculado", "Sangue", "II", 1]
  ],
  "AS07"
);

/* ---------------- Arquivos Secretos 03 (Hexatombe) ---------------- */
supPoderClasse("Combatente", ["Guardião da Tropa", "Vitalidade Sofrida"], "AS03");
supPoderClasse("Ocultista", ["Flagelo Bem Aproveitado", "Recuperação Flagelante"], "AS03");
supGeral(["Ambidestria", "Entrada Triunfal", "Papinho Sedutor"], "AS03");
supParanormal(
  [
    ["Conhecimento de Direção Precognitiva", "Conhecimento"],
    ["Instrumento Elétrico de Combate", "Energia"]
  ],
  "AS03"
);
["Combatente", "Especialista", "Ocultista"].forEach(c =>
  supTrilha(c, "Performático", ["Ensaio", "Frase de Efeito", "Mosh Pit", "Ritmo Contagiante"], "AS03")
); // trilha geral
supArma(
  [["Garra do Harpia", "táticas", "Corpo a corpo · duas mãos", "I", "2d8", "19/x2", "Curto", "C", 2, 1]],
  "AS03"
);
supItem(
  [
    ["Bloody Mary Batizada", "Itens operacionais", "II", 1],
    ["Paçoca", "Itens operacionais", "0", 0.5],
    ["Crânio Dominador", "Itens paranormais", "III", 1],
    ["Gaiola do Corvo", "Itens paranormais", "IV", 2]
  ],
  "AS03"
);
supAmaldicoado(
  [
    ["Camiseta Psikolera", "Sangue", "II", 1],
    ["Dupla Obsessiva", "Sangue", "III", 2]
  ],
  "AS03"
);

/* ---------------- Arquivos Secretos 02 (Hexatombe: "na sua mesa") ---------------- */
supGeral(["Revidar Violento", "Corpo Fechado", "Esquiva Tática", "Palpite Confiante"], "AS02");
supPoderClasse("Combatente", ["Predador Perfeito", "Golpes de Arena"], "AS02");
supPoderClasse("Especialista", ["Assassinato Furtivo", "Especialista em Matar"], "AS02");
supParanormal(
  [
    ["Predador de Sangue", "Sangue"],
    ["Pressão Atmosférica", "Energia"],
    ["Zona dos Sussurros", "Conhecimento"],
    ["Disparo da Morte", "Morte"]
  ],
  "AS02"
);
supAmaldicoado(
  [
    ["Machado do Mutilador", "Sangue", "IV", 1],
    ["Elmo do Colosso", "Energia", "III", 2],
    ["Manoplas do Colosso", "Energia", "IV", 2],
    ["Punhal X", "Conhecimento", "IV", 1],
    ["Sniper Fantasma", "Morte", "IV", 2]
  ],
  "AS02"
);
[
  [
    "Mapa Sanguíneo",
    "Sangue",
    2,
    "padrão",
    "toque",
    "1 superfície",
    "cena",
    "Vontade evita",
    "",
    [3, "", ""],
    null,
    ""
  ],
  [
    "Capturar Momento",
    "Morte",
    2,
    "padrão",
    "médio",
    "esfera de 18m de raio",
    "cena",
    "permanente até ser dissipado",
    "",
    [3, "4d8", ""],
    [7, "8d8", "3º círculo"],
    "dano"
  ],
  [
    "Labirinto Mental",
    "Conhecimento",
    2,
    "padrão",
    "médio",
    "1 pessoa",
    "1d4 rodadas",
    "Vontade evita",
    "",
    [3, "", ""],
    [7, "", "3º círculo"],
    ""
  ],
  [
    "Rajada Caótica",
    "Energia",
    2,
    "padrão",
    "médio",
    "1 ser",
    "instantânea",
    "Reflexos reduz à metade",
    "8d6",
    [3, "8d8", ""],
    [7, "8d10", "3º círculo"],
    "dano"
  ]
].forEach(r => supRitual(r, "AS02"));
supAmaldicoado([["A Antena", "Medo", "IV", 2]], "AS02");
supGeral(
  [
    "Especialista em Correntes (prender itens)",
    "Especialista em Correntes (puxar)",
    "Prática com Materiais Ritualísticos"
  ],
  "AS02"
);
supPoderClasse("Ocultista", ["Dominar Habilidade Ritualística"], "AS02");
supItem([["Catalisador Sofisticado e Horrorizado", "Itens paranormais", "III", 1]], "AS02");
supGeral(
  [
    "Estágio Terminal",
    "Kian Vai Nos Salvar",
    "Tratamento de Emergência",
    "Arte da Música Macabra",
    "Sintonização Mental com Arma",
    "Sintonização Mental com Proteção",
    "Movimentação Tática",
    "Sentido Tático"
  ],
  "AS02"
);
supPoderClasse("Combatente", ["Marteladas"], "AS02");
supPoderClasse("Ocultista", ["Liturgia de Fortalecimento Ritualístico"], "AS02");
supParanormal([["Engolir Sangue", "Sangue"]], "AS02");
supAmaldicoado([["Faca Predadora", "Sangue", "IV", 1]], "AS02");

/* ---------------- Ameaças dos Arquivos Secretos (só números) ---------------- */
[
  ["Assecla", "", 40, 18, 30, "", ["Corrente Farpada", 2, 5, "1d8+10"], [1, 2, 2, 1, 2], "AS01"],
  ["Investido", "", 80, 23, 90, "", ["Cutelo", 4, 15, "1d6+15"], [1, 3, 2, 2, 2], "AS01"],
  [
    "Apóstolo do Sangue",
    "",
    200,
    30,
    300,
    "",
    ["Marreta Sanguinária", 4, 20, "4d10+30"],
    [1, 2, 1, 2, 3],
    "AS01"
  ],
  ["Giovanni", "", 80, 23, 70, "", ["Revólver", 2, 5, "2d6+10"], [2, 1, 4, 3, 1], "AS01"],
  ["Mosto", "", 60, 20, 100, "", ["Cutelo", 4, 10, "1d6+10"], [1, 4, 1, 1, 3], "AS01"],
  ["Tarrafa", "", 60, 21, 80, "", ["Arpão Do Pescador", 3, 10, "1d6+10"], [3, 2, 1, 1, 2], "AS01"],
  ["Carrara", "", 60, 18, 70, "", ["Soco com Pregos", 2, 10, "1d4+10"], [2, 1, 2, 2, 1], "AS01"],
  ["Nando Salles", "", 20, 16, 35, "", ["Pistola", 2, 5, "1d12+5"], [2, 1, 2, 2, 2], "AS01"],
  [
    "Anulado",
    "Sangue",
    100,
    25,
    190,
    "DT 20 · 4d6",
    ["Braços Grotescos", 3, 15, "1d8+10"],
    [2, 3, 1, 1, 1],
    "AS01"
  ],
  ["Cleo", "", 60, 20, 80, "", ["Pé De Cabra", 2, 10, "1d8+10"], [2, 2, 2, 2, 2], "AS01"],
  ["Cristino", "", 180, 36, 240, "", ["Peixeira", 3, 20, "3d8+30"], [3, 3, 2, 2, 1], "AS01"],
  ["Arara-vermelha", "", 10, 12, 8, "", ["Bicada", 2, 5, "1d6+2"], [2, 1, 0, 2, 1], "AS02"],
  [
    "Arara-devorada",
    "Sangue",
    80,
    21,
    120,
    "DT 20 · 3d8",
    ["Bicada", 3, 5, "1d8+5"],
    [1, 1, 1, 1, 1],
    "AS02"
  ],
  ["Arara-infernal", "Sangue", 120, 26, 220, "", ["Bicada", 4, 10, "1d10+10"], [4, 2, 0, 2, 3], "AS02"],
  ["Jaguatirica", "", 10, 13, 16, "", ["Mordida", 2, 5, "1d6+2"], [2, 1, 0, 1, 1], "AS02"],
  [
    "Felino-devorado",
    "Sangue",
    80,
    23,
    140,
    "DT 20 · 3d8",
    ["Garras", 3, 10, "1d6+5"],
    [3, 2, 0, 2, 2],
    "AS02"
  ],
  [
    "Felino-infernal",
    "Sangue",
    120,
    28,
    230,
    "DT 23 · 4d6",
    ["Mordidas", 4, 10, "2d8+5"],
    [4, 2, 0, 2, 3],
    "AS02"
  ],
  ["Jonas Aguiar", "", 80, 21, 120, "", ["Machado", 3, 10, "1d8+10"], [1, 1, 1, 1, 1], "AS02"],
  ["Mutilador Noturno", "", 140, 29, 260, "", ["Machado", 3, 15, "1d8+20"], [1, 1, 1, 1, 1], "AS02"],
  ["Dalmo Magno", "", 80, 23, 140, "", ["Pancada", 4, 10, "2d6+10"], [1, 1, 1, 1, 1], "AS02"],
  ["Colosso", "", 140, 31, 280, "", ["Pancada", 4, 15, "4d6+20"], [1, 1, 1, 1, 1], "AS02"],
  ["Jae-Yoon", "", 80, 22, 100, "", ["Punhal", 3, 10, "2d4+10"], [1, 1, 1, 1, 1], "AS02"],
  ["X", "", 140, 30, 200, "", ["Punhal", 3, 15, "4d4+20"], [1, 1, 1, 1, 1], "AS02"],
  ["Kemi", "", 80, 23, 90, "", ["Facada", 3, 10, "2d4+10"], [1, 1, 1, 1, 1], "AS02"],
  ["Fantasma", "", 140, 30, 180, "", ["Facada", 3, 15, "4d4+20"], [1, 1, 1, 1, 1], "AS02"],
  ["Labirinto", "", 80, 20, 120, "", ["Pancada Com Antena", 1, 5, "1d8+10"], [1, 1, 1, 1, 1], "AS02"],
  ["Labirinto (intenção assassina)", "", 140, 28, 240, "", null, [1, 1, 1, 1, 1], "AS02"],
  ["Jasper", "", 80, 23, 90, "", ["Foices Acorrentadas", 3, 10, "3d4+10"], [3, 3, 1, 1, 2], "AS02"],
  ["Lena Viegas", "", 80, 22, 80, "", ["Pistola", 2, 10, "1d12+10"], [2, 1, 3, 3, 1], "AS02"],
  ["Maria", "", 80, 21, 80, "", ["Pistola", 2, 10, "1d12+10"], [3, 1, 3, 2, 1], "AS02"],
  ["Remi", "", 80, 21, 90, "", ["Espada Enferrujada", 3, 10, "2d8+10"], [2, 1, 3, 2, 2], "AS02"],
  ["Tuco", "", 80, 24, 90, "", ["Pistola", 1, 10, "1d12+10"], [1, 3, 1, 2, 3], "AS02"],
  ["Juan", "", 80, 20, 100, "", ["Facada", 2, 10, "2d4+10"], [1, 1, 1, 1, 1], "AS02"],
  ["Juan (forma diabólica)", "", 140, 31, 280, "", ["Facada", 2, 15, "4d4+20"], [1, 1, 1, 1, 1], "AS02"],
  ["Alê", "", 80, 18, 45, "", ["Cortar Com Teclado", 1, 10, "2d6+10"], [3, 1, 3, 3, 1], "AS03"],
  ["Caio", "", 80, 17, 60, "", ["Ataque Com Espada", 2, 10, "2d8+10"], [2, 2, 1, 2, 2], "AS03"],
  ["Eloy", "", 80, 16, 70, "", ["Pancada", 3, 10, "4d4+10"], [1, 3, 1, 1, 3], "AS03"],
  ["Franco", "", 80, 16, 55, "", ["Bater Com Guitarra", 2, 5, "d10+5"], [2, 2, 1, 1, 2], "AS03"],
  ["Cindy", "", 80, 17, 50, "", ["Pancada Com Baixo", 1, 10, "1d6+10"], [3, 1, 2, 3, 1], "AS03"],
  ["Caíto", "", 20, 17, 20, "", ["Disparo De Pistola", 2, 5, "1d12+5"], [2, 1, 2, 1, 1], "AS03"],
  ["Ana", "", 100, 27, 90, "", ["Ataque Com Maça", 3, 15, "6d4+10"], [2, 3, 1, 1, 3], "AS03"],
  ["Argano", "", 100, 26, 120, "", ["Maça Pesada", 4, 15, "4d8+20"], [1, 4, 1, 0, 4], "AS03"],
  ["Chispa", "", 100, 26, 90, "", null, [3, 1, 4, 1, 1], "AS03"],
  ["Torvo", "", 20, 21, 30, "", ["Manopla Espinhenta", 1, 10, "1d6+5"], [1, 1, 1, 1, 2], "AS03"],
  ["Escarlata", "", 120, 28, 100, "", null, [3, 2, 3, 4, 2], "AS03"],
  ["Miasma", "", 40, 18, 30, "", ["Golpe Com Correntes", 2, 5, "2d8+5"], [2, 2, 1, 1, 2], "AS03"],
  ["Coruja", "", 40, 19, 50, "", ["Tiro De Zarabatana", 3, 10, "1d4+1"], [3, 1, 3, 2, 1], "AS03"],
  ["Corvo", "", 40, 18, 60, "", ["Pancada", 1, 5, "1d4+5"], [2, 1, 3, 3, 1], "AS03"],
  ["Papagaio", "", 40, 21, 60, "", ["Garrafada", 2, 10, "1d4+10"], [2, 2, 1, 3, 2], "AS03"],
  ["Pomba", "", 40, 20, 50, "", ["Ataque Com Canivete", 2, 10, "1d4+5"], [2, 1, 3, 3, 1], "AS03"],
  ["Harpia", "", 80, 22, 100, "", ["Garra Do Harpia", 3, 10, "2d8+10"], [3, 3, 2, 2, 1], "AS03"],
  ["Suellen", "", 20, 15, 30, "", ["Golpe Com Cutelo", 2, 5, "1d8+5"], [1, 2, 2, 2, 2], "AS03"],
  ["Assistente de Produção", "", 40, 14, 20, "", ["Pistola", 1, 5, "1d12+5"], [1, 1, 3, 2, 1], "AS04"],
  ["Produtor", "", 80, 20, 100, "", ["Martelo Meteoro Usb", 2, 10, "1d12+10"], [2, 2, 2, 1, 1], "AS04"],
  ["Diretor", "", 200, 28, 280, "", ["Carga Eletrificada", 3, 20, "4d8+20"], [3, 3, 3, 4, 3], "AS04"],
  ["Simulacro", "Energia e Conhecimento", 32, 10, 70, "DT 15 · 2d6", null, [1, 1, 1, 1, 1], "AS04"],
  ["Hospedeiro Parasitado", "", 20, 15, 10, "", ["Pancada", 1, 5, "1d4+5"], [1, 1, 1, 1, 1], "AS05"],
  [
    "Hospedeiro Aflorado",
    "Transmissão",
    60,
    25,
    100,
    "DT 19 · 3d6",
    ["Pancada", 2, 10, "1d6+5"],
    [2, 2, 1, 2, 3],
    "AS05"
  ],
  ["Interflorado", "Transmissão", 40, 19, 70, "DT 15 · 2d8", null, [1, 2, 1, 1, 1], "AS05"],
  [
    "Fummu",
    "Transmissão",
    100,
    25,
    200,
    "DT 21 · 4d6",
    ["Toque Ácido", 3, 15, "2d10+10"],
    [3, 2, 2, 2, 2],
    "AS05"
  ],
  [
    "Doppelganger Civil",
    "Transmissão",
    20,
    14,
    14,
    "DT 15 · 1d6",
    ["Pancada", 1, 0, "1d4+2"],
    [1, 1, 1, 1, 1],
    "AS05"
  ],
  [
    "Doppelganger Combatente",
    "Transmissão",
    60,
    19,
    70,
    "DT 20 · 3d6",
    ["Pistola De Plasma", 2, 10, "2d6+5"],
    [2, 2, 3, 2, 1],
    "AS05"
  ],
  ["Doppelganger Cultista", "Transmissão", 160, 28, 240, "DT 25 · 4d8", null, [3, 2, 3, 4, 2], "AS05"],
  ["Bilu", "Transmissão", 42, 12, 42, "DT 15 · 1d4", null, [3, 2, 3, 4, 2], "AS05"],
  [
    "Rastropoda",
    "Transmissão",
    140,
    31,
    200,
    "DT 24 · 4d8",
    ["Gosma Plasmática", 2, 15, "4d10+15"],
    [1, 2, 1, 3, 1],
    "AS05"
  ],
  [
    "Memoflígico",
    "Transmissão",
    200,
    38,
    400,
    "DT 29 · 6d6",
    ["Toque Psicônico", 3, 25, "6d6"],
    [3, 1, 3, 4, 1],
    "AS05"
  ],
  ["Alice Cruzes", "", 40, 18, 30, "", ["Pistola", 2, 5, "1d12+5"], [2, 1, 4, 2, 1], "AS06"],
  ["Ketan Arjuna", "", 100, 20, 90, "", ["Revólver", 4, 10, "3d6+10"], [4, 3, 2, 2, 1], "AS06"],
  ["Laila Verdante", "", 80, 19, 70, "", ["Arremesso De Agulha", 2, 10, "1d4+5"], [2, 1, 3, 4, 1], "AS06"],
  ["Dr. Neruda", "", 20, 14, 15, "", ["Seringa", 2, 5, "1d4+5"], [2, 0, 3, 2, 1], "AS06"],
  ["Cientista da Panacea", "", 40, 16, 20, "", ["Pancada", 1, 5, "1d4+5"], [2, 1, 4, 1, 1], "AS06"],
  ["Manda-Chuva da Panacea", "", 120, 23, 120, "", ["Pancada", 1, 10, "1d6+5"], [2, 1, 3, 3, 3], "AS06"],
  ["Segurança da Panacea", "", 48, 21, 80, "", ["Pistola", 3, 10, "1d12+10"], [1, 3, 1, 2, 1], "AS06"],
  [
    "Hikikomori",
    "Energia",
    20,
    16,
    35,
    "DT 14 · 2d6",
    ["Disparo Infectado", 2, 5, "2d12"],
    [2, 1, 1, 1, 1],
    "AS06"
  ],
  [
    "Marca-Passo",
    "Energia",
    80,
    23,
    140,
    "DT 20 · 3d8",
    ["Golpe Infectado", 3, 10, "2d12+5"],
    [3, 3, 1, 2, 1],
    "AS06"
  ],
  ["Estímulo", "Energia", 320, 50, 800, "DT 35 · 9d6", null, [5, 0, 5, 5, 4], "AS06"],
  [
    "Experimento Ssabáka",
    "Morte e Sangue",
    180,
    36,
    360,
    "DT 28 · 6d6",
    ["Mordida", 3, 20, "4d12+20"],
    [3, 3, 0, 2, 4],
    "AS06"
  ],
  ["Raziel", "", 120, 28, 240, "", ["Garras", 4, 15, "2d10+20"], [4, 3, 3, 2, 1], "AS07"],
  ["O Verdadeiro Raziel", "", 200, 38, 400, "", ["Garras", 4, 25, "5d10+30"], [4, 3, 3, 2, 3], "AS07"],
  ["Alvira", "", 120, 26, 210, "", ["Cruz De Sangue", 1, 15, "2d12+10"], [3, 1, 2, 4, 2], "AS07"],
  ["Sabara", "", 100, 25, 200, "", ["Espada E Adaga", 3, 15, "2d6+10"], [1, 3, 2, 2, 1], "AS07"],
  ["Velisar", "", 100, 25, 180, "", ["Garras", 3, 15, "2d10+10"], [2, 1, 4, 3, 1], "AS07"],
  ["Zéfero", "", 80, 23, 140, "", ["Garras", 3, 10, "1d10+10"], [2, 3, 0, 2, 1], "AS07"],
  [
    "Incinerado",
    "Energia e Sangue",
    60,
    21,
    100,
    "DT 19 · 3d6",
    ["Disparo De Labaredas", 3, 10, "2d8+5"],
    [3, 3, 0, 0, 1],
    "AS07"
  ],
  [
    "Stryzga",
    "Sangue e Morte",
    120,
    28,
    240,
    "DT 23 · 4d6",
    ["Mordida E Garras", 3, 15, "4d10+10"],
    [3, 2, 3, 4, 2],
    "AS07"
  ],
  [
    "Apóstata",
    "Conhecimento e Morte",
    80,
    23,
    111,
    "DT 20 · 3d8",
    ["Flagellum", 3, 10, "6d10"],
    [2, 2, 3, 4, 1],
    "AS07"
  ]
].forEach(([n, el, vd, df, pv, pres, atk, at, src]) => {
  if (!AMEACAS.some(a => a[0] === n)) AMEACAS.push([n, el, vd, df, pv, pres, atk, at]);
  FONTE_AME[n] = src;
});

/* ---------------- Ameaças do Sobrevivendo ao Horror ---------------- */
[
  ["Sepultado", "Morte", 20, 16, 50, "DT 15 · 2d4", ["Dedos Ósseos", 3, 5, "1d6+5"], [1, 3, 0, 1, 3], "SaH"],
  ["Mescla", "Sangue e Medo", 60, 21, 100, "DT 20 · 3d6", ["Garras", 3, 10, "2d6+5"], [3, 3, 0, 1, 2], "SaH"],
  [
    "Espectro Inesquecido",
    "Energia",
    220,
    27,
    340,
    "DT 35 · 6d8",
    ["Lâmina Espectral", 2, 10, "1d4+31"],
    [2, 2, 1, 1, 3],
    "SaH"
  ],
  ["Derretido", "Sangue e Energia", 80, 23, 140, "DT 20 · 4d6", null, [1, 4, 0, 1, 4], "SaH"],
  ["Quibungo", "Sangue", 160, 34, 320, "DT 25 · 4d8", ["Garras", 4, 20, "2d6+10"], [4, 4, 1, 3, 4], "SaH"],
  [
    "Profundo",
    "Energia e Sangue",
    200,
    34,
    380,
    "DT 30 · 6d6",
    ["Mordida", 4, 25, "4d10+20"],
    [4, 4, 2, 2, 2],
    "SaH"
  ],
  [
    "Memento Mori",
    "Morte",
    260,
    44,
    650,
    "DT 35 · 8d6",
    ["Garras", 5, 30, "4d10+30"],
    [1, 1, 3, 3, 3],
    "SaH"
  ],
  ["Rascunho", "Conhecimento e Energia", 300, 48, 750, "DT 35 · 7d8", null, [2, 2, 5, 5, 2], "SaH"],
  [
    "Medusa",
    "Conhecimento e Morte",
    320,
    50,
    380,
    "DT 40 · 9d6",
    ["Garras", 5, 35, "8d8+20"],
    [4, 3, 4, 5, 3],
    "SaH"
  ],
  [
    "Amigo Imaginário",
    "Morte e Sangue",
    360,
    56,
    1000,
    "DT 40 · 8d8",
    ["Garras", 5, 40, "4d10+10"],
    [5, 5, 3, 5, 4],
    "SaH"
  ],
  [
    "O Terminal",
    "Morte e Medo",
    260,
    28,
    700,
    "DT 30 · 8d6",
    ["Tentáculos", 5, 30, "3d6+3d6"],
    [0, 5, 2, 4, 5],
    "SaH"
  ],
  ["Bêbado Local", "", 10, 12, 6, "", ["Soco", 1, 0, "1d3+1"], [1, 1, 0, 0, 1], "SaH"],
  ["Burocrata", "", 10, 11, 6, "", ["Soco", 1, 0, "1d3+1"], [1, 1, 2, 2, 1], "SaH"],
  ["Fazendeiro Isolado", "", 20, 16, 16, "", ["Peixeira", 2, 5, "1d8+5"], [1, 2, 1, 2, 2], "SaH"],
  ["Investigador", "", 40, 18, 68, "", ["Revólver", 2, 10, "2d6+6"], [2, 1, 2, 1, 2], "SaH"],
  ["Médico", "", 20, 13, 14, "", ["Bisturi", 2, 5, "1d4+1"], [1, 1, 2, 2, 1], "SaH"],
  ["Religioso", "", 40, 15, 32, "", ["Pancada", 1, 5, "1d3+1"], [1, 1, 2, 3, 1], "SaH"],
  ["Predador Sofisticado", "", 60, 21, 60, "", ["Machado", 3, 10, "2d8+13"], [2, 2, 2, 3, 1], "SaH"],
  ["Caçador de Gente", "", 80, 23, 80, "", ["Motosserra", 3, 15, "3d6+15"], [2, 3, 1, 1, 3], "SaH"],
  ["Artista da Morte", "", 140, 27, 150, "", ["Bisturi", 3, 15, "1d4+17"], [3, 1, 3, 3, 1], "SaH"],
  ["Ariranha", "", 20, 16, 32, "", ["Mordida", 2, 5, "2d4+2"], [2, 1, 0, 1, 2], "SaH"],
  ["Cavalo", "", 10, 13, 12, "", ["Cascos", 1, 5, "2d4+3"], [1, 3, 0, 1, 2], "SaH"],
  ["Enxame de Tocandiras", "", 20, 16, 22, "", null, [1, 0, 0, 1, 0], "SaH"],
  ["Gorila", "", 40, 19, 70, "", ["Pancada", 2, 10, "1d6+3"], [2, 3, 0, 1, 3], "SaH"],
  ["Leão", "", 60, 18, 80, "", ["Mordida", 3, 10, "1d8+4"], [3, 3, 0, 1, 2], "SaH"],
  ["Lobo", "", 20, 15, 18, "", ["Mordida", 2, 5, "1d6+4"], [3, 3, 0, 1, 2], "SaH"],
  ["Touro", "", 20, 15, 38, "", ["Chifres", 2, 5, "2d6+6"], [1, 3, 0, 1, 2], "SaH"],
  ["Urso Pardo", "", 60, 19, 90, "", ["Mordida", 3, 10, "1d8+4"], [1, 3, 0, 1, 3], "SaH"]
].forEach(([n, el, vd, df, pv, pres, atk, at, src]) => {
  if (!AMEACAS.some(a => a[0] === n)) AMEACAS.push([n, el, vd, df, pv, pres, atk, at]);
  FONTE_AME[n] = src;
});

/* ---------------- Classe Sobrevivente (SaH): sobe por estágios 1–5 ---------------- */
const ESTAGIO_NEX = { 1: 5, 2: 10, 3: 15, 4: 40, 5: 45 }; // estágio guardado também como "nex" para as trilhas funcionarem
const NEX_ESTAGIO = { 5: 1, 10: 2, 15: 3, 40: 4, 45: 5 }; // o contrário: NEX das habilidades -> estágio
CLASSES.Sobrevivente = {
  pv: 8,
  pvN: 2,
  pe: 2,
  peN: 1,
  san: 8,
  sanN: 2,
  fixasTxt: "nenhuma (1 + Intelecto à escolha)",
  escolhaFixa: [],
  fixas: [],
  livres: 1,
  prof: ["simples"],
  poder: "Empenho",
  prog: {
    5: "Empenho",
    10: "Trilha (1ª habilidade)",
    15: "Aumento de atributo",
    40: "Trilha (2ª habilidade)",
    45: "Cicatrizado"
  },
  poderes: [],
  trilhas: {
    Durão: ["Durão", "Pancada Forte"],
    Esperto: ["Esperto", "Entendido"],
    Esotérico: ["Esotérico", "Iniciado"]
  }
};
FONTE_DE.Sobrevivente = "SaH";
/* poderes gerais podem ser escolhidos por qualquer classe */
Object.values(CLASSES).forEach(c =>
  PODERES_GERAIS.forEach(([n]) => {
    if (!c.poderes.includes(n)) c.poderes.push(n);
  })
);
Object.values(CLASSES).forEach(c =>
  c.poderes.sort((a, b) =>
    a === "Transcender" || a === "Treinamento em Perícia"
      ? 1
      : b === "Transcender" || b === "Treinamento em Perícia"
        ? -1
        : a.localeCompare(b, "pt")
  )
);
