<script>
"use strict";
/* ===================== SISTEMA — Ordem Paranormal RPG (Livro de Regras) =====================
   Nomes e números seguem o livro. Os textos descritivos do livro NÃO estão aqui:
   cada entrada traz o nome oficial e os números; descrições ficam a cargo do grupo. */
const ATTRS = ["AGI", "FOR", "INT", "PRE", "VIG"];
const ATTR_NOME = { AGI: "Agilidade", FOR: "Força", INT: "Intelecto", PRE: "Presença", VIG: "Vigor" };
// [perícia, atributo, regras]
const PERICIAS = [
  ["Acrobacia", "AGI", "carga"],
  ["Adestramento", "PRE", "só treinada"],
  ["Artes", "PRE", "só treinada"],
  ["Atletismo", "FOR", ""],
  ["Atualidades", "INT", ""],
  ["Ciências", "INT", "só treinada"],
  ["Crime", "AGI", "só treinada · carga · kit"],
  ["Diplomacia", "PRE", ""],
  ["Enganação", "PRE", ""],
  ["Fortitude", "VIG", ""],
  ["Furtividade", "AGI", "carga"],
  ["Iniciativa", "AGI", ""],
  ["Intimidação", "PRE", ""],
  ["Intuição", "PRE", ""],
  ["Investigação", "INT", ""],
  ["Luta", "FOR", ""],
  ["Medicina", "INT", "kit"],
  ["Ocultismo", "INT", "só treinada"],
  ["Percepção", "PRE", ""],
  ["Pilotagem", "AGI", "só treinada"],
  ["Pontaria", "AGI", ""],
  ["Profissão", "INT", "só treinada"],
  ["Reflexos", "AGI", ""],
  ["Religião", "PRE", "só treinada"],
  ["Sobrevivência", "INT", ""],
  ["Tática", "INT", "só treinada"],
  ["Tecnologia", "INT", "só treinada · kit"],
  ["Vontade", "PRE", ""]
];
const GRAUS = [
  [0, "—"],
  [5, "Treinado"],
  [10, "Veterano"],
  [15, "Expert"]
];

// Origem: [perícias treinadas, poder da origem]
const ORIGENS = {
  Acadêmico: [["Ciências", "Investigação"], "Saber é Poder"],
  "Agente de Saúde": [["Intuição", "Medicina"], "Técnica Medicinal"],
  Amnésico: [[], "Vislumbres do Passado"],
  Artista: [["Artes", "Enganação"], "Magnum Opus"],
  Atleta: [["Acrobacia", "Atletismo"], "110%"],
  Chef: [["Fortitude", "Profissão"], "Ingrediente Secreto"],
  Criminoso: [["Crime", "Furtividade"], "O Crime Compensa"],
  "Cientista Forense": [["Ciências", "Investigação"], "Investigação Científica"],
  Jornalista: [["Atualidades", "Investigação"], "Fontes Confiáveis"],
  "Membro de MotoClube": [["Luta", "Pilotagem"], "Irmandade da Estrada"],
  Professor: [["Ciências", "Intuição"], "Aula de Campo"],
  Revoltado: [["Furtividade", "Vontade"], "Antes Só"],
  "Cultista Arrependido": [["Ocultismo", "Religião"], "Traços do Outro Lado"],
  Desgarrado: [["Fortitude", "Sobrevivência"], "Calejado"],
  Dublê: [["Pilotagem", "Reflexos"], "Destemido"],
  Engenheiro: [["Profissão", "Tecnologia"], "Ferramentas Favoritas"],
  Executivo: [["Diplomacia", "Profissão"], "Processo Otimizado"],
  Investigador: [["Investigação", "Percepção"], "Faro para Pistas"],
  Lutador: [["Luta", "Reflexos"], "Mão Pesada"],
  Magnata: [["Diplomacia", "Pilotagem"], "Patrocinador da Ordem"],
  Mercenário: [["Iniciativa", "Intimidação"], "Posição de Combate"],
  Militar: [["Pontaria", "Tática"], "Para Bellum"],
  Operário: [["Fortitude", "Profissão"], "Ferramentas de Trabalho"],
  Policial: [["Percepção", "Pontaria"], "Patrulha"],
  Religioso: [["Religião", "Vontade"], "Acalentar"],
  "Servidor Público": [["Intuição", "Vontade"], "Espírito Cívico"],
  "Teórico da Conspiração": [["Investigação", "Ocultismo"], "Eu Já Sabia"],
  "T.I.": [["Investigação", "Tecnologia"], "Motor de Busca"],
  "Trabalhador Rural": [["Adestramento", "Sobrevivência"], "Desbravador"],
  Trambiqueiro: [["Crime", "Enganação"], "Impostor"],
  Universitário: [["Atualidades", "Investigação"], "Dedicação"],
  Vítima: [["Reflexos", "Vontade"], "Cicatrizes Psicológicas"]
};

const CLASSES = {
  Combatente: {
    pv: 20,
    pvN: 4,
    pe: 2,
    peN: 2,
    san: 12,
    sanN: 3,
    fixasTxt: "Luta ou Pontaria, e Fortitude ou Reflexos",
    escolhaFixa: [
      ["Luta", "Pontaria"],
      ["Fortitude", "Reflexos"]
    ],
    fixas: [],
    livres: 1,
    prof: ["simples", "táticas", "leves"],
    poder: "Ataque Especial",
    prog: {
      5: "Ataque especial (2 PE, +5)",
      10: "Habilidade de trilha",
      15: "Poder de combatente",
      20: "Aumento de atributo",
      25: "Ataque especial (3 PE, +10)",
      30: "Poder de combatente",
      35: "Grau de treinamento",
      40: "Habilidade de trilha",
      45: "Poder de combatente",
      50: "Aumento de atributo, versatilidade",
      55: "Ataque especial (4 PE, +15)",
      60: "Poder de combatente",
      65: "Habilidade de trilha",
      70: "Grau de treinamento",
      75: "Poder de combatente",
      80: "Aumento de atributo",
      85: "Ataque especial (5 PE, +20)",
      90: "Poder de combatente",
      95: "Aumento de atributo",
      99: "Habilidade de trilha"
    },
    trilhas: {
      Aniquilador: ["A Favorita", "Técnica Secreta", "Técnica Sublime", "Máquina de Matar"],
      "Comandante de Campo": ["Inspirar Confiança", "Estrategista", "Brecha na Guarda", "Oficial Comandante"],
      Guerreiro: ["Técnica Letal", "Revidar", "Força Opressora", "Potência Máxima"],
      "Operações Especiais": [
        "Iniciativa Aprimorada",
        "Ataque Extra",
        "Surto de Adrenalina",
        "Sempre Alerta"
      ],
      "Tropa de Choque": ["Casca Grossa", "Cai Dentro", "Duro de Matar", "Inquebrável"]
    },
    poderes: [
      "Armamento Pesado",
      "Artista Marcial",
      "Ataque de Oportunidade",
      "Combater com Duas Armas",
      "Combate Defensivo",
      "Golpe Demolidor",
      "Golpe Pesado",
      "Incansável",
      "Presteza Atlética",
      "Proteção Pesada",
      "Reflexos Defensivos",
      "Saque Rápido",
      "Segurar o Gatilho",
      "Sentido Tático",
      "Tanque de Guerra",
      "Tiro Certeiro",
      "Tiro de Cobertura",
      "Transcender",
      "Treinamento em Perícia"
    ]
  },
  Especialista: {
    pv: 16,
    pvN: 3,
    pe: 3,
    peN: 3,
    san: 16,
    sanN: 4,
    fixasTxt: "",
    escolhaFixa: [],
    fixas: [],
    livres: 7,
    prof: ["simples", "leves"],
    poder: "Eclético e Perito",
    prog: {
      5: "Eclético, perito (2 PE, +1d6)",
      10: "Habilidade de trilha",
      15: "Poder de especialista",
      20: "Aumento de atributo",
      25: "Perito (3 PE, +1d8)",
      30: "Poder de especialista",
      35: "Grau de treinamento",
      40: "Engenhosidade (veterano), habilidade de trilha",
      45: "Poder de especialista",
      50: "Aumento de atributo, versatilidade",
      55: "Perito (4 PE, +1d10)",
      60: "Poder de especialista",
      65: "Habilidade de trilha",
      70: "Grau de treinamento",
      75: "Engenhosidade (expert), poder de especialista",
      80: "Aumento de atributo",
      85: "Perito (5 PE, +1d12)",
      90: "Poder de especialista",
      95: "Aumento de atributo",
      99: "Habilidade de trilha"
    },
    trilhas: {
      "Atirador de Elite": ["Mira de Elite", "Disparo Letal", "Disparo Impactante", "Atirar para Matar"],
      Infiltrador: ["Ataque Furtivo", "Gatuno", "Assassinar", "Sombra Fugaz"],
      "Médico de Campo": ["Paramédico", "Equipe de Trauma", "Resgate", "Reanimação"],
      Negociador: ["Eloquência", "Discurso Motivador", "Eu Conheço um Cara", "Truque de Mestre"],
      Técnico: ["Inventário Otimizado", "Remendão", "Improvisar", "Preparado para Tudo"]
    },
    poderes: [
      "Artista Marcial",
      "Balística Avançada",
      "Conhecimento Aplicado",
      "Hacker",
      "Mãos Rápidas",
      "Mochila de Utilidades",
      "Movimento Tático",
      "Na Trilha Certa",
      "Nerd",
      "Ninja Urbano",
      "Pensamento Ágil",
      "Perito em Explosivos",
      "Primeira Impressão",
      "Transcender",
      "Treinamento em Perícia"
    ]
  },
  Ocultista: {
    pv: 12,
    pvN: 2,
    pe: 4,
    peN: 4,
    san: 20,
    sanN: 5,
    fixasTxt: "Ocultismo e Vontade",
    escolhaFixa: [],
    fixas: ["Ocultismo", "Vontade"],
    livres: 3,
    prof: ["simples"],
    poder: "Escolhido pelo Outro Lado",
    prog: {
      5: "Escolhido pelo Outro Lado (1º círculo)",
      10: "Habilidade de trilha",
      15: "Poder de ocultista",
      20: "Aumento de atributo",
      25: "Escolhido pelo Outro Lado (2º círculo)",
      30: "Poder de ocultista",
      35: "Grau de treinamento",
      40: "Habilidade de trilha",
      45: "Poder de ocultista",
      50: "Aumento de atributo, versatilidade",
      55: "Escolhido pelo Outro Lado (3º círculo)",
      60: "Poder de ocultista",
      65: "Habilidade de trilha",
      70: "Grau de treinamento",
      75: "Poder de ocultista",
      80: "Aumento de atributo",
      85: "Escolhido pelo Outro Lado (4º círculo)",
      90: "Poder de ocultista",
      95: "Aumento de atributo",
      99: "Habilidade de trilha"
    },
    trilhas: {
      Conduíte: ["Ampliar Ritual", "Acelerar Ritual", "Anular Ritual", "Canalizar o Medo"],
      Flagelador: ["Poder do Flagelo", "Abraçar a Dor", "Absorver Agonia", "Medo Tangível"],
      Graduado: ["Saber Ampliado", "Grimório Ritualístico", "Rituais Eficientes", "Conhecendo o Medo"],
      Intuitivo: ["Mente Sã", "Presença Poderosa", "Inabalável", "Presença do Medo"],
      "Lâmina Paranormal": ["Lâmina Maldita", "Gladiador Paranormal", "Conjuração Marcial", "Lâmina do Medo"]
    },
    poderes: [
      "Camuflar Ocultismo",
      "Criar Selo",
      "Envolto em Mistério",
      "Especialista em Elemento",
      "Ferramentas Paranormais",
      "Fluxo de Poder",
      "Guiado pelo Paranormal",
      "Identificação Paranormal",
      "Improvisar Componentes",
      "Intuição Paranormal",
      "Mestre em Elemento",
      "Ritual Potente",
      "Ritual Predileto",
      "Tatuagem Ritualística",
      "Transcender",
      "Treinamento em Perícia"
    ]
  }
};
const TRILHA_NEX = [10, 40, 65, 99];
const TIERS_ATQ = [
  [85, 5, 20],
  [55, 4, 15],
  [25, 3, 10],
  [5, 2, 5]
]; // NEX, PE, bônus
const TIERS_PERITO = [
  [85, 5, "1d12"],
  [55, 4, "1d10"],
  [25, 3, "1d8"],
  [5, 2, "1d6"]
];
const CIRC_OCULT = [
  [85, 4],
  [55, 3],
  [25, 2],
  [5, 1]
];
const CUSTO_CIRCULO = { 1: 1, 2: 3, 3: 6, 4: 10 };

// Poderes paranormais: [nome, elemento]
const PODERES_PARANORMAIS = [
  ["Afinidade Elemental", "—"],
  ["Aprender Ritual", "—"],
  ["Resistir a <Elemento>", "—"],
  ["Expansão de Conhecimento", "Conhecimento"],
  ["Percepção Paranormal", "Conhecimento"],
  ["Precognição", "Conhecimento"],
  ["Sensitivo", "Conhecimento"],
  ["Visão do Oculto", "Conhecimento"],
  ["Afortunado", "Energia"],
  ["Campo Protetor", "Energia"],
  ["Causalidade Fortuita", "Energia"],
  ["Golpe de Sorte", "Energia"],
  ["Manipular Entropia", "Energia"],
  ["Encarar a Morte", "Morte"],
  ["Escapar da Morte", "Morte"],
  ["Potencial Aprimorado", "Morte"],
  ["Potencial Reaproveitado", "Morte"],
  ["Surto Temporal", "Morte"],
  ["Anatomia Insana", "Sangue"],
  ["Arma de Sangue", "Sangue"],
  ["Sangue de Ferro", "Sangue"],
  ["Sangue Fervente", "Sangue"],
  ["Sangue Vivo", "Sangue"]
];

// Patentes: [PP mínimo, nome, crédito, limite I, II, III, IV]
const PATENTES = [
  [0, "Recruta", "Baixo", 2, 0, 0, 0],
  [20, "Operador", "Médio", 3, 1, 0, 0],
  [50, "Agente especial", "Médio", 3, 2, 1, 0],
  [100, "Oficial de operações", "Alto", 3, 3, 2, 1],
  [200, "Agente de elite", "Ilimitado", 3, 3, 3, 2]
];
const PP_EVENTOS = [
  ["Solução do caso", 10],
  ["Pista adicional encontrada", 2],
  ["Morte de inocente", -2],
  ["Morte de membro do grupo", -5]
];

/* Armas (Tabela 3.3): nome, grupo, empunhadura, categoria, dano, crítico, alcance, tipo, espaços, ágil */
const ARMAS_LIVRO = [
  ["Coronhada", "simples", "Corpo a corpo · leve", "—", "1d4/1d6", "x2", "—", "I", 0, 0],
  ["Faca", "simples", "Corpo a corpo · leve", "0", "1d4", "19", "Curto", "C", 1, 1],
  ["Martelo", "simples", "Corpo a corpo · leve", "0", "1d6", "x2", "—", "I", 1, 0],
  ["Punhal", "simples", "Corpo a corpo · leve", "0", "1d4", "x3", "—", "P", 1, 1],
  ["Bastão", "simples", "Corpo a corpo · uma mão", "0", "1d6/1d8", "x2", "—", "I", 1, 0],
  ["Machete", "simples", "Corpo a corpo · uma mão", "0", "1d6", "19", "—", "C", 1, 0],
  ["Lança", "simples", "Corpo a corpo · uma mão", "0", "1d6", "x2", "Curto", "P", 1, 0],
  ["Cajado", "simples", "Corpo a corpo · duas mãos", "0", "1d6/1d6", "x2", "—", "I", 2, 1],
  ["Arco", "simples", "Disparo · duas mãos", "0", "1d6", "x3", "Médio", "P", 2, 0],
  ["Besta", "simples", "Disparo · duas mãos", "0", "1d8", "19", "Médio", "P", 2, 0],
  ["Pistola", "simples", "Fogo · leve", "I", "1d12", "18", "Curto", "B", 1, 0],
  ["Revólver", "simples", "Fogo · leve", "I", "2d6", "19/x3", "Curto", "B", 1, 0],
  ["Fuzil de caça", "simples", "Fogo · duas mãos", "I", "2d8", "19/x3", "Médio", "B", 2, 0],
  ["Machadinha", "táticas", "Corpo a corpo · leve", "0", "1d6", "x3", "Curto", "C", 1, 0],
  ["Nunchaku", "táticas", "Corpo a corpo · leve", "0", "1d8", "x2", "—", "I", 1, 1],
  ["Corrente", "táticas", "Corpo a corpo · uma mão", "0", "1d8", "x2", "—", "I", 1, 0],
  ["Espada", "táticas", "Corpo a corpo · uma mão", "I", "1d8/1d10", "19", "—", "C", 1, 0],
  ["Florete", "táticas", "Corpo a corpo · uma mão", "I", "1d6", "18", "—", "C", 1, 1],
  ["Machado", "táticas", "Corpo a corpo · uma mão", "I", "1d8", "x3", "—", "C", 1, 0],
  ["Maça", "táticas", "Corpo a corpo · uma mão", "I", "2d4", "x2", "—", "I", 1, 0],
  ["Acha", "táticas", "Corpo a corpo · duas mãos", "I", "1d12", "x3", "—", "C", 2, 0],
  ["Gadanho", "táticas", "Corpo a corpo · duas mãos", "I", "2d4", "x4", "—", "C", 2, 0],
  ["Katana", "táticas", "Corpo a corpo · duas mãos", "I", "1d10", "19", "—", "C", 2, 1],
  ["Marreta", "táticas", "Corpo a corpo · duas mãos", "I", "3d4", "x2", "—", "I", 2, 0],
  ["Montante", "táticas", "Corpo a corpo · duas mãos", "I", "2d6", "19", "—", "C", 2, 0],
  ["Motosserra", "táticas", "Corpo a corpo · duas mãos", "I", "3d6", "x2", "—", "C", 2, 0],
  ["Arco composto", "táticas", "Disparo · duas mãos", "I", "1d10", "x3", "Médio", "P", 2, 0],
  ["Balestra", "táticas", "Disparo · duas mãos", "I", "1d12", "19", "Médio", "P", 2, 0],
  ["Submetralhadora", "táticas", "Fogo · uma mão", "I", "2d6", "19/x3", "Curto", "B", 1, 0],
  ["Espingarda", "táticas", "Fogo · duas mãos", "I", "4d6", "x3", "Curto", "B", 2, 0],
  ["Fuzil de assalto", "táticas", "Fogo · duas mãos", "II", "2d10", "19/x3", "Médio", "B", 2, 0],
  ["Fuzil de precisão", "táticas", "Fogo · duas mãos", "III", "2d10", "19/x3", "Longo", "B", 2, 0],
  ["Bazuca", "pesadas", "À distância · duas mãos", "III", "10d8", "x2", "Médio", "I", 2, 0],
  ["Lança-chamas", "pesadas", "À distância · duas mãos", "III", "6d6", "x2", "Curto", "Fogo", 2, 0],
  ["Metralhadora", "pesadas", "À distância · duas mãos", "II", "2d12", "19/x3", "Médio", "B", 2, 0],
  ["Ataque desarmado", "—", "Corpo a corpo · leve", "—", "1d3", "x2", "—", "I", 0, 0],
  ["Arma improvisada", "—", "Corpo a corpo · uma mão", "—", "1d6", "x2", "—", "I", 1, 0]
];
const MUNICOES = [
  ["Flechas", "0", 1],
  ["Balas curtas", "0", 1],
  ["Balas longas", "I", 1],
  ["Cartuchos", "I", 1],
  ["Foguete", "I", 1],
  ["Combustível", "I", 1]
];
const PROTECOES = [
  ["Proteção leve", "I", 2, 5, 0],
  ["Proteção pesada", "II", 5, 10, 2],
  ["Escudo", "I", 2, 2, 0]
]; // nome, cat, esp, defesa, RD
// Equipamento geral (Tabela 3.8) e itens paranormais (Tabela 3.10): nome, grupo, categoria, espaços
const ITENS_GERAIS = [
  ["Kit de perícia", "Acessórios", "0", 1],
  ["Utensílio", "Acessórios", "I", 1],
  ["Vestimenta", "Acessórios", "I", 1],
  ["Granada de atordoamento", "Explosivos", "0", 1],
  ["Granada de fragmentação", "Explosivos", "I", 1],
  ["Granada de fumaça", "Explosivos", "0", 1],
  ["Granada incendiária", "Explosivos", "I", 1],
  ["Mina antipessoal", "Explosivos", "I", 1],
  ["Algemas", "Itens operacionais", "0", 1],
  ["Arpéu", "Itens operacionais", "0", 1],
  ["Bandoleira", "Itens operacionais", "I", 1],
  ["Binóculos", "Itens operacionais", "0", 1],
  ["Bloqueador de sinal", "Itens operacionais", "I", 1],
  ["Cicatrizante", "Itens operacionais", "I", 1],
  ["Corda", "Itens operacionais", "0", 1],
  ["Equipamento de sobrevivência", "Itens operacionais", "0", 2],
  ["Lanterna tática", "Itens operacionais", "I", 1],
  ["Máscara de gás", "Itens operacionais", "0", 1],
  ["Mochila militar", "Itens operacionais", "I", 0],
  ["Óculos de visão térmica", "Itens operacionais", "I", 1],
  ["Pé de cabra", "Itens operacionais", "0", 1],
  ["Pistola de dardos", "Itens operacionais", "I", 1],
  ["Pistola sinalizadora", "Itens operacionais", "0", 1],
  ["Soqueira", "Itens operacionais", "0", 1],
  ["Spray de pimenta", "Itens operacionais", "I", 1],
  ["Taser", "Itens operacionais", "I", 1],
  ["Traje hazmat", "Itens operacionais", "I", 2],
  ["Amarras de (elemento)", "Itens paranormais", "II", 1],
  ["Câmera de aura paranormal", "Itens paranormais", "II", 1],
  ["Componentes ritualísticos de (elemento)", "Itens paranormais", "0", 1],
  ["Emissor de pulsos paranormais", "Itens paranormais", "II", 1],
  ["Escuta de ruídos paranormais", "Itens paranormais", "II", 1],
  ["Medidor de estabilidade da membrana", "Itens paranormais", "II", 1],
  ["Scanner de manifestação paranormal de (elemento)", "Itens paranormais", "II", 1]
];
// Modificações (+1 categoria cada): [nome, para, efeito resumido em números]
const MODIFICACOES = [
  ["Certeira", "corpo a corpo e disparo", "+2 em testes de ataque", { atk: 2 }],
  ["Cruel", "corpo a corpo e disparo", "+2 em rolagens de dano", { dmg: 2 }],
  ["Discreta", "corpo a corpo e disparo", "+10 para ocultar", {}],
  ["Perigosa", "corpo a corpo e disparo", "+2 na margem de ameaça", { marg: 2 }],
  ["Tática", "corpo a corpo e disparo", "sacar é ação livre", {}],
  ["Alongada", "fogo", "+2 em testes de ataque", { atk: 2 }],
  ["Calibre Grosso", "fogo", "+1 dado de dano", { dado: 1 }],
  ["Compensador", "fogo", "anula penalidade por rajadas", {}],
  ["Discreta (fogo)", "fogo", "+5 para ocultar, −1 espaço", { esp: -1 }],
  ["Ferrolho Automático", "fogo", "arma se torna automática", {}],
  ["Mira Laser", "fogo", "+2 na margem de ameaça", { marg: 2 }],
  ["Mira Telescópica", "fogo", "aumenta o alcance", {}],
  ["Silenciador", "fogo", "−10 a menos na penalidade de Furtividade", {}],
  ["Tática (fogo)", "fogo", "sacar é ação livre", {}],
  ["Visão de Calor", "fogo", "ignora camuflagem", {}],
  ["Dum dum", "munição", "+1 no multiplicador de crítico", { mult: 1 }],
  ["Explosiva", "munição", "+2d6 de dano", { extra: "2d6" }],
  ["Antibombas", "proteção", "+5 contra efeitos de área", {}],
  ["Blindada", "proteção", "RD 5, +1 espaço", { rd: 5, esp: 1 }],
  ["Discreta (proteção)", "proteção", "+5 para ocultar, −1 espaço", { esp: -1 }],
  ["Reforçada", "proteção", "+2 Defesa, +1 espaço", { def: 2, esp: 1 }],
  ["Aprimorado", "acessório", "bônus da perícia vira +5", {}],
  ["Discreto", "acessório", "+5 para ocultar, −1 espaço", { esp: -1 }],
  ["Função adicional", "acessório", "+2 em uma perícia adicional", {}],
  ["Instrumental", "acessório", "funciona como kit de perícia", {}]
];
const MALDICOES = {
  arma: {
    Conhecimento: ["Antielemento", "Ritualística", "Senciente"],
    Energia: ["Empuxo", "Energética", "Vibrante"],
    Morte: ["Consumidora", "Erosiva", "Repulsora"],
    Sangue: ["Lancinante", "Predadora", "Sanguinária"]
  },
  proteção: {
    Conhecimento: ["Abascanta", "Profética", "Sombria"],
    Energia: ["Cinética", "Lépida", "Voltaica"],
    Morte: ["Letárgica", "Repulsiva"],
    Sangue: ["Regenerativa", "Sádica"]
  },
  acessório: {
    Conhecimento: ["Carisma", "Conjuração", "Escudo Mental", "Reflexão", "Sagacidade"],
    Energia: ["Defesa", "Destreza", "Potência"],
    Morte: ["Esforço Adicional"],
    Sangue: ["Disposição", "Pujança", "Vitalidade"],
    Varia: ["Proteção Elemental"]
  }
};
const AMALDICOADOS = [
  ["Coração Pulsante", "Sangue"],
  ["Coroa de Espinhos", "Sangue"],
  ["Frasco de Vitalidade", "Sangue"],
  ["Pérola de Sangue", "Sangue"],
  ["Punhos Enraivecidos", "Sangue"],
  ["Seringa de Transfiguração", "Sangue"],
  ["Amarras Mortais", "Morte"],
  ["Casaco de Lodo", "Morte"],
  ["Coletora", "Morte"],
  ["Crânio Espiral", "Morte"],
  ["Frasco de Lodo", "Morte"],
  ["Vislumbre do Fim", "Morte"],
  ["Anéis do Elo Mental", "Conhecimento"],
  ["Lanterna Reveladora", "Conhecimento"],
  ["Máscara das Pessoas nas Sombras", "Conhecimento"],
  ["Munição Jurada", "Conhecimento"],
  ["Pergaminho da Pertinácia", "Conhecimento"],
  ["Arcabuz dos Moretti", "Energia"],
  ["Bateria Reversa", "Energia"],
  ["Peitoral da Segunda Chance", "Energia"],
  ["Relógio de Arnaldo", "Energia"],
  ["Talismã da Sorte", "Energia"],
  ["Teclado de Conexão Neural", "Energia"],
  ["Tela do Pesadelo", "Energia"],
  ["Veículo Energizado", "Energia"],
  ["Jaqueta de Veríssimo", "Medo"],
  ["Dedo Decepado", "Varia"],
  ["Selos Paranormais", "Varia"]
];

/* Condições (Apêndice) — efeitos resumidos com nossas palavras */
const CONDICOES_LIVRO = {
  Abalado: "−1d20 em testes; de novo vira apavorado (medo)",
  Agarrado: "desprevenido, imóvel, −1d20 em ataques, só armas leves (paralisia)",
  Alquebrado: "+1 PE no custo de habilidades e rituais (mental)",
  Apavorado: "−2d20 em perícias e foge da fonte do medo (medo)",
  Asfixiado: "segura o fôlego por rodadas = Vigor; depois fica morrendo",
  Atordoado: "desprevenido e sem ações (mental)",
  Caído: "−2d20 corpo a corpo, desloc. 1,5m, −5 Def. corpo a corpo, +5 Def. à distância",
  Cego: "desprevenido, lento, −2d20 em AGI/FOR, alvos com camuflagem total (sentidos)",
  Confuso: "age ao acaso (1d6 no início do turno) (mental)",
  Debilitado: "−2d20 em AGI, FOR e VIG; de novo vira inconsciente",
  Desprevenido: "−5 na Defesa e −1d20 em Reflexos",
  Doente: "sob efeito de uma doença",
  "Em chamas": "1d6 de fogo no início do turno; ação padrão apaga",
  Enjoado: "só uma ação padrão ou de movimento por rodada",
  Enredado: "lento, vulnerável, −1d20 em ataques (paralisia)",
  Envenenado: "efeito do veneno; dano recorrente se acumula",
  Esmorecido: "−2d20 em INT e PRE (mental)",
  Exausto: "debilitado, lento e vulnerável; de novo vira inconsciente (fadiga)",
  Fascinado: "−2d20 em Percepção, só observa (mental)",
  Fatigado: "fraco e vulnerável; de novo vira exausto (fadiga)",
  Fraco: "−1d20 em AGI, FOR e VIG; de novo vira debilitado",
  Frustrado: "−1d20 em INT e PRE; de novo vira esmorecido (mental)",
  Imóvel: "deslocamento 0 (paralisia)",
  Inconsciente: "indefeso e sem ações nem reações",
  Indefeso: "desprevenido, −10 na Defesa, falha em Reflexos",
  Lento: "deslocamento à metade, sem correr (paralisia)",
  Machucado: "menos da metade dos PV",
  Morrendo: "0 PV; mais de 3 rodadas morrendo na cena = morte",
  Ofuscado: "−1d20 em ataques e Percepção (sentidos)",
  Paralisado: "imóvel e indefeso, só ações mentais (paralisia)",
  Pasmo: "sem ações (mental)",
  Petrificado: "inconsciente, resistência a dano 10",
  Sangrando: "Vigor DT 20 no início do turno ou perde 1d6 PV",
  Surdo: "−2d20 em Iniciativa, condição ruim para rituais (sentidos)",
  Surpreendido: "desprevenido e sem ações",
  Vulnerável: "−5 na Defesa",
  Enlouquecendo: "Sanidade 0: o mestre decide (insanidade)"
};
const CONDICOES = Object.keys(CONDICOES_LIVRO);

/* Interlúdio */
const DESCANSO = [
  ["Precária", 0.5],
  ["Normal", 1],
  ["Confortável", 2],
  ["Luxuosa", 3]
];
const INTERLUDIO = ["Alimentar-se", "Dormir", "Exercitar-se", "Ler", "Manutenção", "Relaxar", "Revisar caso"];
const DT_REF = [
  ["Fácil", 5],
  ["Média", 10],
  ["Difícil", 15],
  ["Desafiadora", 20],
  ["Formidável", 25],
  ["Heroica", 30],
  ["Quase impossível", 40]
];
const NEX_OPTS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 99];
const ELEMENTOS = ["Conhecimento", "Energia", "Morte", "Sangue", "Medo"];

/* Ameaças (Capítulo 7): nome, elemento, VD, Defesa, PV, Presença (DT · dano mental), ataque principal [nome, dados d20, bônus, dano], atributos AGI FOR INT PRE VIG */
const AMEACAS = [
  ["Aberração de Carne", "Sangue", 40, 19, 70, "DT 15 · 3d6", ["Pancada", 3, 10, "2d6+6"], [1, 3, 0, 1, 3]],
  ["Carente", "Sangue", 300, 40, 700, "DT 35 · 7d8", ["Garras de Sangue", 4, 35, "2d8+20"], [4, 4, 2, 3, 4]],
  ["Dama de Sangue", "Sangue", 60, 20, 105, "DT 20 · 3d6", ["Tentáculo", 3, 10, "2d6+5"], [2, 3, 1, 2, 2]],
  ["Enpap-X", "Sangue", 180, 36, 360, "DT 25 · 6d6", ["Socão", 4, 20, "2d10+10"], [2, 4, 1, 2, 3]],
  ["Kerberos", "Sangue", 340, 46, 1150, "DT 35 · 10d6", ["Mordida", 5, 40, "4d12+30"], [4, 5, 0, 3, 5]],
  ["Minotauro", "Sangue", 280, 44, 750, "DT 35 · 8d6", ["Chifres", 5, 30, "6d12+20"], [4, 5, 1, 3, 5]],
  ["Titã de Sangue", "Sangue", 220, 35, 550, "DT 30 · 7d6", ["Mordida", 5, 25, "4d12+10"], [2, 5, 1, 1, 4]],
  ["Zumbi de Sangue", "Sangue", 20, 17, 45, "DT 15 · 2d6", ["Garras", 2, 5, "1d6+5"], [2, 2, 0, 1, 2]],
  [
    "Zumbi de Sangue Bestial",
    "Sangue",
    100,
    23,
    200,
    "DT 20 · 4d6",
    ["Mordida de Sangue", 3, 15, "2d10+5"],
    [2, 3, 0, 2, 3]
  ],
  ["O Diabo", "Sangue", 400, 66, 1666, "DT 45 · 10d8", ["Arma Sangrenta", 6, 45, "2d10+50"], [6, 6, 6, 6, 6]],
  ["Aracnasita", "Morte", 80, 23, 140, "DT 20 · 4d6", ["Mordida", 3, 15, "2d10+10"], [3, 2, 1, 1, 2]],
  [
    "Carniçal Preto da Morte",
    "Morte",
    200,
    38,
    400,
    "DT 30 · 6d6",
    ["Garra da Morte", 4, 25, "4d10+20"],
    [4, 4, 3, 3, 3]
  ],
  [
    "Ceifador Espiral",
    "Morte",
    380,
    58,
    999,
    "DT 45 · 9d8",
    ["Foice da Morte", 5, 40, "5d10+20"],
    [5, 5, 5, 5, 5]
  ],
  ["Enraizado", "Morte", 120, 28, 140, "DT 20 · 4d6", ["Punho Espinhento", 3, 15, "2d8+8"], [3, 3, 1, 1, 3]],
  ["Escutado", "Morte", 160, 29, 290, "DT 25 · 4d8", ["Mordida", 3, 20, "3d6+10"], [4, 3, 1, 2, 3]],
  ["Esqueleto de Lodo", "Morte", 20, 14, 40, "DT 14 · 2d4", ["Garras", 2, 5, "2d6+2"], [2, 2, 0, 1, 1]],
  ["Marionete", "Morte", 280, 40, 700, "DT 35 · 8d6", ["Foice da Morte", 5, 30, "10d8+10"], [3, 5, 1, 5, 2]],
  [
    "Múmia Xipófaga",
    "Morte",
    240,
    35,
    400,
    "DT 30 · 6d8",
    ["Garra Enfaixada", 4, 30, "4d8+30"],
    [5, 4, 2, 3, 4]
  ],
  ["Sempiternal", "Morte", 360, 53, 990, "DT 40 · 8d8", ["Dedos Alongados", 5, 40, "4d10"], [5, 5, 4, 5, 4]],
  ["Succ", "Morte", 40, 20, 65, "DT 15 · 3d6", ["Mordida", 4, 10, "2d8+2"], [4, 2, 0, 1, 1]],
  [
    "Anjo",
    "Conhecimento",
    380,
    57,
    1111,
    "DT 40 · 10d6",
    ["Asas do Conhecimento", 5, 40, "4d10+40"],
    [4, 5, 5, 5, 5]
  ],
  [
    "Bicho-Papão",
    "Conhecimento",
    300,
    41,
    750,
    "DT 35 · 7d8",
    ["Garras Atormentadoras", 5, 35, "4d10+10"],
    [5, 4, 3, 5, 4]
  ],
  ["Espreitador", "Conhecimento", 220, 34, 500, "DT 30 · 7d6", ["Pancada", 2, 10, "1d6+2"], [4, 2, 3, 3, 2]],
  ["Existido", "Conhecimento", 20, 13, 36, "DT 14 · 1d6", ["Pancada", 2, 5, "1d4+1"], [1, 1, 4, 2, 2]],
  ["Lembrado", "Conhecimento", 100, 22, 180, "DT 20 · 4d6", ["Pancada", 2, 5, "2d4+7"], [2, 2, 4, 2, 2]],
  ["Ocioso", "Conhecimento", 260, 37, 390, "DT 35 · 8d6", ["Retaliação", 5, 30, "4d10+20"], [1, 5, 1, 5, 3]],
  ["Parasita de Culpa", "Conhecimento", 60, 15, 90, "DT 20 · 2d6", ["Pancada", 1, 0, "1d4"], [2, 0, 4, 4, 1]],
  [
    "Rastejador Sombrio",
    "Conhecimento",
    180,
    41,
    330,
    "DT 25 · 6d6",
    ["Toque da Dor", 4, 20, "4d8+5"],
    [4, 3, 3, 3, 3]
  ],
  ["Vulto", "Conhecimento", 40, 19, 60, "DT 15 · 3d6", ["Toque Macabro", 4, 10, "2d6"], [4, 2, 2, 2, 1]],
  ["Máscara do Desespero", "Conhecimento", 400, 55, 1200, "DT 45 · 10d8", null, [4, 4, 6, 6, 5]],
  ["Anárquico", "Energia", 20, 21, 30, "DT 14 · 2d6", ["Pancada Errática", 2, 5, "2d12"], [3, 2, 0, 0, 1]],
  [
    "Anárquico Descontrolado",
    "Energia",
    120,
    28,
    120,
    "DT 21 · 4d6",
    ["Pancada Energética", 4, 15, "4d12"],
    [4, 3, 2, 2, 3]
  ],
  [
    "Anomiático",
    "Energia",
    240,
    41,
    600,
    "DT 30 · 6d8",
    ["Garra Desintegradora", 5, 30, "4d12+20"],
    [5, 3, 1, 4, 3]
  ],
  ["Ciborgue", "Energia", 80, 25, 160, "DT 15 · 2d6", ["Braço Laminado", 3, 10, "1d12+10"], [3, 3, 2, 2, 3]],
  [
    "Infecticídio",
    "Energia",
    280,
    25,
    600,
    "DT 35 · 8d6",
    ["Pancadas Infectadas", 5, 30, "4d12+20"],
    [3, 5, 1, 1, 5]
  ],
  [
    "Perturbado de Energia",
    "Energia",
    40,
    19,
    60,
    "DT 15 · 2d8",
    ["Toque Plasmático", 4, 10, "2d12"],
    [4, 1, 0, 0, 0]
  ],
  [
    "Sukkalgir",
    "Energia",
    160,
    34,
    220,
    "DT 25 · 4d8",
    ["Mordida do Outro Lado", 3, 15, "2d12"],
    [3, 2, 3, 3, 2]
  ],
  [
    "Telopsia",
    "Energia",
    340,
    48,
    560,
    "DT 40 · 10d6",
    ["Toque Desintegrador", 4, 35, "6d12+30"],
    [4, 2, 3, 5, 2]
  ],
  [
    "Tempestuoso",
    "Energia",
    360,
    56,
    950,
    "DT 40 · 8d8",
    ["Garras Radioativas", 5, 40, "4d20+20"],
    [5, 4, 2, 5, 4]
  ],
  ["Viajante", "Energia", 200, 34, 360, "DT 20 · 6d6", ["Pancada", 4, 15, "2d12+10"], [4, 2, 3, 4, 2]],
  ["Anfitrião", "Energia", 400, 59, 1413, "DT 45 · 10d8", null, [7, 5, 6, 6, 5]],
  ["Degolificada", "Medo", 320, 45, 850, "DT 40 · 9d6", ["Pancada", 5, 35, "8d8+20"], [3, 5, 3, 4, 4]],
  ["Bandido", "", 10, 14, 8, "", ["Faca", 2, 5, "1d4+2"], [2, 2, 1, 1, 1]],
  ["Capanga", "", 20, 13, 17, "", ["Bastão", 2, 5, "1d8+7"], [1, 2, 1, 1, 2]],
  ["Soldado de Aluguel", "", 40, 18, 25, "", ["Machete", 2, 10, "1d6+9"], [2, 2, 1, 1, 2]],
  ["Assassino", "", 80, 26, 90, "", ["Faca", 4, 17, "1d4+11"], [4, 2, 3, 3, 2]],
  ["Comandante Mercenário", "", 120, 29, 145, "", ["Machete", 3, 17, "1d6+15"], [3, 3, 2, 3, 3]],
  ["Iniciado", "", 20, 16, 15, "", ["Faca", 1, 5, "1d4+1"], [1, 1, 2, 2, 1]],
  ["Investido", "", 40, 17, 35, "", ["Faca", 2, 10, "1d4+1"], [2, 1, 2, 2, 1]],
  ["Líder de Culto", "", 140, 27, 150, "", null, [2, 1, 3, 3, 2]],
  ["Policial", "", 20, 19, 15, "", ["Bastão", 2, 5, "1d8+7"], [2, 2, 1, 1, 2]],
  ["Policial de Elite", "", 60, 27, 40, "", ["Bastão", 3, 10, "1d8+13"], [3, 3, 1, 1, 3]],
  ["Chefe de Polícia", "", 100, 25, 105, "", ["Bastão", 3, 15, "1d8+8"], [2, 3, 2, 3, 3]],
  ["Cão de Guarda", "", 10, 14, 12, "", ["Mordida", 2, 5, "1d6+2"], [2, 2, 0, 1, 2]],
  ["Enxame de Abelhas", "", 10, 15, 10, "", null, [1, 0, 0, 1, 0]],
  ["Enxame de Ratos", "", 10, 13, 15, "", null, [1, 0, 0, 1, 0]],
  ["Jacaré", "", 40, 16, 40, "", ["Mordida", 3, 5, "1d8+8"], [1, 3, 0, 1, 2]],
  ["Javaporco", "", 20, 14, 35, "", ["Mordida", 2, 5, "1d8+4"], [1, 2, 0, 1, 3]],
  ["Onça-pintada", "", 40, 16, 55, "", ["Mordida", 3, 10, "1d8+5"], [3, 3, 0, 1, 2]],
  ["Sucuri", "", 40, 16, 68, "", ["Mordida", 3, 10, "1d6+8"], [2, 3, 0, 1, 3]]
];

const RITUAIS_LIVRO = [
  [
    "Alterar Destino",
    "Energia",
    4,
    "reação",
    "pessoal",
    "você",
    "instantânea",
    "",
    "",
    null,
    [5, "", ""],
    ""
  ],
  [
    "Alterar Memória",
    "Conhecimento",
    3,
    "padrão",
    "toque",
    "1 pessoa",
    "instantânea",
    "Vontade anula",
    "",
    null,
    [4, "", "4º círculo"],
    ""
  ],
  [
    "Amaldiçoar Arma",
    "Conhecimento",
    1,
    "padrão",
    "toque",
    "1 arma corpo a corpo ou pacote de munição",
    "cena",
    "",
    "+1d6",
    [2, "+2d6", "2º círculo"],
    [5, "+4d6", "3º círculo e afinidade"],
    "dano"
  ],
  [
    "Amaldiçoar Tecnologia",
    "Energia",
    1,
    "padrão",
    "toque",
    "1 acessório ou arma de fogo",
    "cena",
    "",
    "",
    [2, "", "2º círculo"],
    [5, "", "3º círculo e afinidade"],
    ""
  ],
  [
    "Âncora Temporal",
    "Morte",
    3,
    "padrão",
    "curto",
    "1 ser",
    "cena",
    "Vontade parcial",
    "",
    null,
    [4, "", "4º círculo"],
    ""
  ],
  [
    "Aprimorar Físico",
    "Sangue",
    2,
    "padrão",
    "toque",
    "1 ser",
    "cena",
    "",
    "",
    [3, "", "3º círculo"],
    [7, "", "4º círculo e afinidade"],
    ""
  ],
  [
    "Aprimorar Mente",
    "Conhecimento",
    2,
    "padrão",
    "toque",
    "1 ser",
    "cena",
    "",
    "",
    [3, "", "3º círculo"],
    [7, "", "4º círculo e afinidade"],
    ""
  ],
  [
    "Arma Atroz",
    "Sangue",
    1,
    "padrão",
    "toque",
    "1 arma corpo a corpo",
    "sustentada",
    "",
    "",
    [2, "", "2º círculo"],
    [5, "", "3º círculo e afinidade"],
    ""
  ],
  [
    "Armadura de Sangue",
    "Sangue",
    1,
    "padrão",
    "pessoal",
    "você",
    "cena",
    "",
    "",
    [5, "", "3º círculo"],
    [9, "", "4º círculo e afinidade"],
    ""
  ],
  [
    "Canalizar o Medo",
    "Medo",
    4,
    "padrão",
    "toque",
    "1 pessoa",
    "permanente até ser descarregada",
    "",
    "",
    null,
    null,
    ""
  ],
  [
    "Capturar o Coração",
    "Sangue",
    4,
    "padrão",
    "curto",
    "1 pessoa",
    "cena",
    "Vontade parcial",
    "",
    null,
    null,
    ""
  ],
  [
    "Chamas do Caos",
    "Energia",
    2,
    "padrão",
    "curto",
    "veja texto",
    "cena",
    "",
    "1d6",
    [3, "", ""],
    [7, "8d6", "3º círculo"],
    "dano"
  ],
  [
    "Cicatrização",
    "Morte",
    1,
    "padrão",
    "toque",
    "1 ser",
    "instantânea",
    "",
    "3d8+3",
    [2, "5d8+5", "2º círculo"],
    [9, "7d8+7", "4º círculo e afinidade com Morte"],
    "cura"
  ],
  [
    "Cinerária",
    "Medo",
    1,
    "padrão",
    "curto",
    "nuvem de 6m de raio",
    "cena",
    "",
    "",
    [2, "", ""],
    [5, "", ""],
    ""
  ],
  [
    "Coincidência Forçada",
    "Energia",
    1,
    "padrão",
    "curto",
    "1 ser",
    "cena",
    "",
    "",
    [2, "", "2º círculo"],
    [5, "", "3º círculo e afinidade"],
    ""
  ],
  [
    "Compreensão Paranormal",
    "Conhecimento",
    1,
    "padrão",
    "toque",
    "1 ser ou objeto",
    "cena",
    "Vontade anula",
    "",
    [2, "", "2º círculo"],
    [5, "", "3º círculo"],
    ""
  ],
  [
    "Conhecendo o Medo",
    "Medo",
    4,
    "padrão",
    "toque",
    "1 pessoa",
    "cena",
    "Vontade parcial",
    "10d6",
    null,
    null,
    "dano"
  ],
  [
    "Consumir Manancial",
    "Morte",
    1,
    "padrão",
    "pessoal",
    "você",
    "instantânea",
    "",
    "3d6",
    [2, "6d6", "2º círculo"],
    [5, "", "3º círculo, e afinidade"],
    "pvtemp"
  ],
  [
    "Contato Paranormal",
    "Conhecimento",
    3,
    "completa",
    "pessoal",
    "você",
    "1 dia",
    "",
    "",
    [4, "", "4º círculo"],
    [9, "", "4º círculo e afinidade"],
    ""
  ],
  [
    "Contenção Fantasmagórica",
    "Energia",
    2,
    "padrão",
    "médio",
    "1 ser",
    "cena",
    "Reflexos anula",
    "",
    [3, "", "3º círculo"],
    [5, "", "3º círculo e afinidade"],
    ""
  ],
  [
    "Controle Mental",
    "Conhecimento",
    4,
    "padrão",
    "médio",
    "1 pessoa ou animal",
    "sustentada",
    "Vontade parcial",
    "",
    [5, "", ""],
    [10, "", "afinidade com Conhecimento"],
    ""
  ],
  [
    "Convocação Instantânea",
    "Energia",
    3,
    "padrão",
    "ilimitado",
    "1 objeto de até 2 espaços",
    "instantânea",
    "Vontade anula",
    "",
    [4, "", ""],
    [9, "", ""],
    ""
  ],
  [
    "Convocar o Algoz",
    "Morte",
    4,
    "padrão",
    "1,5m",
    "1 pessoa",
    "sustentada",
    "Vontade parcial",
    "6d6",
    null,
    null,
    "dano"
  ],
  [
    "Corpo Adaptado",
    "Sangue",
    1,
    "padrão",
    "toque",
    "1 pessoa ou animal",
    "cena",
    "",
    "",
    [2, "", ""],
    [5, "", ""],
    ""
  ],
  [
    "Decadência",
    "Morte",
    1,
    "padrão",
    "toque",
    "1 ser",
    "instantânea",
    "Fortitude reduz",
    "2d8+2",
    [2, "3d8+3", ""],
    [5, "8d8+8", "3º círculo"],
    "dano"
  ],
  [
    "Definhar",
    "Morte",
    1,
    "padrão",
    "curto",
    "1 ser",
    "cena",
    "Fortitude parcial",
    "",
    [2, "", "2º círculo"],
    [5, "", "3º círculo e afinidade com Morte"],
    ""
  ],
  [
    "Deflagração de Energia",
    "Energia",
    4,
    "completa",
    "pessoal",
    "explosão de 15m de raio",
    "instantânea",
    "Fortitude parcial",
    "",
    null,
    [5, "", ""],
    ""
  ],
  [
    "Desacelerar Impacto",
    "Morte",
    2,
    "reação",
    "curto",
    "1 ser ou objetos somando até 10 espaços",
    "até chegar ao solo ou cena",
    "",
    "",
    [3, "", ""],
    null,
    ""
  ],
  [
    "Descarnar",
    "Sangue",
    2,
    "padrão",
    "toque",
    "1 ser",
    "instantânea",
    "Fortitude parcial",
    "6d8",
    [3, "10d8", "3º círculo"],
    [7, "", "3º círculo e afinidade"],
    "dano"
  ],
  [
    "Detecção de Ameaças",
    "Conhecimento",
    2,
    "padrão",
    "pessoal",
    "esfera de 18m de raio",
    "cena",
    "",
    "",
    [3, "", "3º círculo"],
    [5, "", "4º círculo"],
    ""
  ],
  [
    "Dissipar Ritual",
    "Medo",
    3,
    "padrão",
    "médio",
    "1 ser ou objeto, ou esfera com 3m de raio",
    "instantânea",
    "",
    "",
    null,
    null,
    ""
  ],
  [
    "Dissonância Acústica",
    "Energia",
    2,
    "padrão",
    "médio",
    "esfera com 6m de raio",
    "sustentada",
    "",
    "",
    [1, "", ""],
    [3, "", "3º círculo"],
    ""
  ],
  ["Distorção Temporal", "Morte", 4, "padrão", "pessoal", "veja texto", "veja texto", "", "", null, null, ""],
  [
    "Distorcer Aparência",
    "Sangue",
    1,
    "padrão",
    "pessoal",
    "você",
    "cena",
    "Vontade desacredita",
    "",
    [2, "", ""],
    [5, "", "3º círculo"],
    ""
  ],
  [
    "Eco Espiral",
    "Morte",
    2,
    "padrão",
    "curto",
    "1 ser",
    "2 rodadas",
    "Fortitude reduz",
    "",
    [3, "", ""],
    [7, "", "4º círculo e afinidade"],
    ""
  ],
  [
    "Eletrocussão",
    "Energia",
    1,
    "padrão",
    "curto",
    "1 ser ou objeto",
    "instantânea",
    "Fortitude parcial",
    "3d6",
    [2, "6d6", "2º círculo"],
    [5, "8d6", "3º círculo"],
    "dano"
  ],
  [
    "Embaralhar",
    "Energia",
    1,
    "padrão",
    "pessoal",
    "você",
    "cena",
    "",
    "",
    [2, "", "2º círculo"],
    [5, "", "3º círculo"],
    ""
  ],
  [
    "Enfeitiçar",
    "Conhecimento",
    1,
    "padrão",
    "curto",
    "1 pessoa",
    "cena",
    "Vontade anula",
    "",
    [2, "", "2º círculo"],
    [5, "", "3º círculo"],
    ""
  ],
  [
    "Esconder dos Olhos",
    "Conhecimento",
    2,
    "livre",
    "pessoal",
    "você",
    "1 rodada",
    "",
    "",
    [3, "", "3º círculo"],
    [7, "", "4º círculo e afinidade"],
    ""
  ],
  [
    "Espirais da Perdição",
    "Morte",
    1,
    "padrão",
    "curto",
    "1 ser",
    "cena",
    "",
    "",
    [2, "", "2º círculo"],
    [8, "", "3º círculo"],
    ""
  ],
  [
    "Ferver Sangue",
    "Sangue",
    3,
    "padrão",
    "curto",
    "1 ser",
    "sustentada",
    "Fortitude parcial",
    "4d8",
    null,
    [4, "", "4º círculo e afinidade"],
    "dano"
  ],
  [
    "Fim Inevitável",
    "Morte",
    4,
    "completa",
    "extremo",
    "buraco negro",
    "4 rodadas",
    "Fortitude parcial",
    "",
    [5, "", "afinidade"],
    [10, "", "afinidade"],
    ""
  ],
  [
    "Flagelo de Sangue",
    "Sangue",
    2,
    "padrão",
    "toque",
    "1 pessoa",
    "cena",
    "Fortitude parcial",
    "10d6",
    [3, "", "3º círculo"],
    [7, "", "4º círculo e afinidade"],
    "dano"
  ],
  [
    "Forma Monstruosa",
    "Sangue",
    3,
    "padrão",
    "pessoal",
    "você",
    "cena",
    "",
    "",
    [3, "", "3º círculo"],
    [9, "", "4º círculo e afinidade"],
    ""
  ],
  [
    "Fortalecimento Sensorial",
    "Sangue",
    1,
    "padrão",
    "pessoal",
    "você",
    "cena",
    "",
    "",
    [2, "", "2º círculo"],
    [5, "", "4º círculo e afinidade"],
    ""
  ],
  [
    "Hemofagia",
    "Sangue",
    2,
    "padrão",
    "toque",
    "1 ser",
    "instantânea",
    "Fortitude reduz",
    "6d6",
    [3, "", ""],
    [7, "", "4º círculo"],
    "dano"
  ],
  [
    "Inexistir",
    "Conhecimento",
    4,
    "padrão",
    "toque",
    "1 ser",
    "instantânea",
    "Vontade parcial",
    "10d12+10",
    [5, "15d12+15", ""],
    [10, "20d12+20", "afinidade"],
    "dano"
  ],
  [
    "Invadir Mente",
    "Conhecimento",
    2,
    "padrão",
    "médio ou toque",
    "1 ser ou 2 pessoas",
    "instantânea ou 1 dia",
    "Vontade parcial ou nenhuma",
    "6d6",
    [3, "10d6", "3º círculo"],
    [7, "10d6", ""],
    "dano"
  ],
  ["Invólucro de Carne", "Sangue", 4, "padrão", "curto", "1 clone seu", "cena", "", "", null, null, ""],
  [
    "Lâmina do Medo",
    "Medo",
    4,
    "padrão",
    "toque",
    "1 ser",
    "instantânea",
    "Fortitude parcial",
    "10d8",
    null,
    null,
    "dano"
  ],
  [
    "Localização",
    "Conhecimento",
    2,
    "padrão",
    "pessoal",
    "círculo com 90m de raio",
    "cena",
    "",
    "",
    [3, "", ""],
    [7, "", "4º círculo"],
    ""
  ],
  [
    "Luz",
    "Energia",
    1,
    "padrão",
    "curto",
    "1 objeto",
    "cena",
    "Vontade anula",
    "",
    [2, "", "2º círculo"],
    [5, "", "3º círculo"],
    ""
  ],
  ["Medo Tangível", "Medo", 4, "padrão", "pessoal", "você", "cena", "", "", null, null, ""],
  [
    "Mergulho Mental",
    "Conhecimento",
    3,
    "padrão",
    "toque",
    "1 pessoa",
    "sustentada",
    "Vontade parcial (veja texto)",
    "",
    null,
    [4, "", "4º círculo"],
    ""
  ],
  [
    "Miasma Entrópico",
    "Morte",
    2,
    "padrão",
    "médio",
    "nuvem com 6m de raio",
    "instantânea",
    "Fortitude parcial",
    "4d8",
    [3, "6d8", ""],
    [7, "", "3º círculo"],
    "dano"
  ],
  [
    "Nuvem de Cinzas",
    "Morte",
    1,
    "padrão",
    "curto",
    "nuvem com 6m de raio e 6m de altura",
    "cena",
    "",
    "",
    [2, "", "2º círculo"],
    [5, "", "3º círculo"],
    ""
  ],
  [
    "Ódio Incontrolável",
    "Sangue",
    1,
    "padrão",
    "toque",
    "1 pessoa",
    "cena",
    "",
    "",
    [2, "", ""],
    [5, "", "3º círculo e afinidade"],
    ""
  ],
  [
    "Ouvir os Sussurros",
    "Conhecimento",
    1,
    "completa",
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
    "Paradoxo",
    "Morte",
    2,
    "padrão",
    "médio",
    "esfera com 6m de raio",
    "instantânea",
    "Fortitude reduz",
    "6d6",
    [3, "", ""],
    [7, "13d6", "4º círculo"],
    "dano"
  ],
  [
    "Perturbação",
    "Conhecimento",
    1,
    "padrão",
    "curto",
    "1 pessoa",
    "1 rodada",
    "Vontade anula",
    "",
    [2, "3d8", ""],
    [5, "", "3º círculo e afinidade"],
    "dano"
  ],
  [
    "Poeira da Podridão",
    "Morte",
    3,
    "padrão",
    "médio",
    "nuvem com 6m de raio",
    "sustentada",
    "Fortitude (veja texto)",
    "4d8",
    null,
    [4, "4d8+16", ""],
    "dano"
  ],
  [
    "Polarização Caótica",
    "Energia",
    1,
    "padrão",
    "curto",
    "você",
    "sustentada",
    "Vontade anula",
    "",
    [2, "", ""],
    [5, "", ""],
    ""
  ],
  [
    "Possessão",
    "Conhecimento",
    4,
    "padrão",
    "longo",
    "1 pessoa viva ou morta",
    "1 dia",
    "Vontade anula",
    "",
    null,
    null,
    ""
  ],
  [
    "Presença do Medo",
    "Medo",
    4,
    "padrão",
    "pessoal",
    "emanação de 9m de raio",
    "sustentada",
    "",
    "5d8",
    null,
    null,
    "dano"
  ],
  [
    "Proteção contra Rituais",
    "Medo",
    2,
    "padrão",
    "toque",
    "1 ser",
    "cena",
    "",
    "",
    [3, "", "3º círculo"],
    [6, "", "4º círculo"],
    ""
  ],
  [
    "Purgatório",
    "Sangue",
    3,
    "padrão",
    "curto",
    "área de 6m de raio",
    "sustentada",
    "Fortitude parcial",
    "6d6",
    null,
    null,
    "dano"
  ],
  [
    "Rejeitar Névoa",
    "Medo",
    2,
    "padrão",
    "curto",
    "nuvem de 6m de raio",
    "cena",
    "",
    "",
    [2, "", ""],
    [5, "", ""],
    ""
  ],
  [
    "Salto Fantasma",
    "Energia",
    3,
    "padrão",
    "médio",
    "você",
    "instantânea",
    "",
    "",
    [2, "", ""],
    [4, "", ""],
    ""
  ],
  [
    "Sopro do Caos",
    "Energia",
    2,
    "padrão",
    "médio",
    "varia",
    "sustentada",
    "veja texto",
    "",
    [3, "", ""],
    [9, "", ""],
    ""
  ],
  [
    "Tecer Ilusão",
    "Conhecimento",
    1,
    "padrão",
    "médio",
    "ilusão de até 4 cubos de 1,5m",
    "cena",
    "Vontade desacredita",
    "",
    [2, "", "2º círculo"],
    [5, "", "3º círculo"],
    ""
  ],
  [
    "Tela de Ruído",
    "Energia",
    2,
    "padrão",
    "pessoal",
    "você",
    "cena",
    "",
    "",
    [3, "", ""],
    [7, "", "4º círculo"],
    ""
  ],
  [
    "Teletransporte",
    "Energia",
    4,
    "padrão",
    "toque",
    "até 5 seres voluntários",
    "instantânea",
    "",
    "",
    null,
    [5, "", ""],
    ""
  ],
  [
    "Tentáculos de Lodo",
    "Morte",
    3,
    "padrão",
    "médio",
    "círculo com 6m de raio",
    "cena",
    "",
    "4d6",
    null,
    [5, "6d6", ""],
    "dano"
  ],
  [
    "Terceiro Olho",
    "Conhecimento",
    1,
    "padrão",
    "pessoal",
    "você",
    "cena",
    "",
    "",
    [2, "", ""],
    [5, "", ""],
    ""
  ],
  [
    "Transfigurar Água",
    "Energia",
    3,
    "padrão",
    "longo",
    "esfera com 30m de raio",
    "cena",
    "veja texto",
    "5d8",
    null,
    [5, "10d8", ""],
    "dano"
  ],
  [
    "Transfigurar Terra",
    "Energia",
    3,
    "padrão",
    "longo",
    "9 cubos com 1,5m de lado",
    "instantânea",
    "veja texto",
    "10d6",
    [3, "", ""],
    [7, "", "4º círculo"],
    "dano"
  ],
  [
    "Transfusão Vital",
    "Sangue",
    2,
    "padrão",
    "toque",
    "1 ser",
    "instantânea",
    "",
    "",
    [3, "", "3º círculo"],
    [7, "", "4º círculo"],
    ""
  ],
  [
    "Velocidade Mortal",
    "Morte",
    2,
    "padrão",
    "curto",
    "1 ser",
    "sustentada",
    "",
    "",
    [3, "", ""],
    [7, "", "4º círculo e afinidade"],
    ""
  ],
  [
    "Vidência",
    "Conhecimento",
    3,
    "completa",
    "ilimitado",
    "1 ser",
    "5 rodadas",
    "Vontade anula",
    "",
    null,
    null,
    ""
  ],
  [
    "Vínculo de Sangue",
    "Sangue",
    4,
    "padrão",
    "curto",
    "1 ser",
    "cena",
    "Fortitude anula",
    "",
    null,
    null,
    ""
  ],
  [
    "Vomitar Pestes",
    "Sangue",
    3,
    "padrão",
    "médio",
    "1 enxame Grande",
    "sustentada",
    "Reflexos reduz",
    "5d12",
    [2, "", ""],
    [5, "", ""],
    "dano"
  ],
  [
    "Zerar Entropia",
    "Morte",
    3,
    "padrão",
    "curto",
    "1 pessoa",
    "cena",
    "Vontade parcial",
    "",
    [4, "", "4º círculo"],
    [11, "", "4º círculo e afinidade"],
    ""
  ]
];

/* ===================== DADOS ===================== */
function d(n) {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return 1 + (a[0] % n);
}
function rollN(n, f) {
  const r = [];
  for (let i = 0; i < n; i++) r.push(d(f));
  return r;
}
function parseExpr(s) {
  s = String(s || "")
    .replace(/\s+/g, "")
    .toLowerCase();
  if (!s) return null;
  const re = /([+-]?)(\d*d\d+|\d+)/g;
  let m,
    pos = 0;
  const terms = [];
  while ((m = re.exec(s))) {
    if (m.index !== pos) return null;
    pos = re.lastIndex;
    const sign = m[1] === "-" ? -1 : 1;
    const t = m[2];
    if (t.includes("d")) {
      let [n, f] = t.split("d");
      n = n === "" ? 1 : +n;
      f = +f;
      if (n < 1 || n > 60 || f < 2 || f > 1000) return null;
      terms.push({ sign, n, f });
    } else terms.push({ sign, c: +t });
  }
  if (pos !== s.length || !terms.length) return null;
  return terms;
}
function rollExpr(expr, { critMult = 1, explode6 = false, extraDice = 0 } = {}) {
  const terms = parseExpr(expr);
  if (!terms) return null;
  let total = 0;
  const parts = [];
  let first = true;
  for (const t of terms) {
    if (t.c !== undefined) {
      total += t.sign * t.c;
      parts.push((t.sign < 0 ? "−" : "+") + t.c);
      continue;
    }
    let n = t.n;
    if (t.sign > 0) {
      if (first) {
        n += extraDice;
        first = false;
      }
      n *= critMult;
    }
    let r = rollN(n, t.f);
    if (explode6) {
      let ex = r.filter(x => x === 6).length;
      while (ex > 0) {
        const nr = rollN(ex, t.f);
        r = r.concat(nr);
        ex = nr.filter(x => x === 6).length;
      }
    }
    const sum = r.reduce((a, b) => a + b, 0);
    total += t.sign * sum;
    parts.push((t.sign < 0 ? "−" : "+") + r.length + "d" + t.f + "[" + r.join(",") + "]");
  }
  return { total, detail: parts.join(" ").replace(/^\+/, "") };
}
// Teste de Ordem: 1d20 por ponto de atributo, fica com o maior. ≤0: 2d20 (+1 por ponto abaixo de 0), fica com o menor.
function rollTest(attr, mod, penDice = 0) {
  const n = attr - penDice;
  let dice, kept, mode;
  if (n >= 1) {
    dice = rollN(n, 20);
    kept = Math.max(...dice);
    mode = "maior";
  } else {
    dice = rollN(2 + -n, 20);
    kept = Math.min(...dice);
    mode = "menor";
  }
  return { dice, kept, mode, total: kept + mod };
}
const sgn = m => (m ? ` ${m > 0 ? "+" : "−"}${Math.abs(m)}` : "");

/* ===================== BANCO: Firebase ou modo de teste ===================== */
const DEL = { __del: true };
function firebaseDB() {
  const fs = firebase.firestore();
  try {
    fs.settings({ ignoreUndefinedProperties: true, merge: true });
  } catch (e) {}
  const toList = s => s.docs.map(x => ({ id: x.id, ...x.data() }));
  return {
    mode: "firebase",
    listenCol(path, o, cb, err) {
      let q = fs.collection(path);
      if (o && o.where) q = q.where(o.where[0], "==", o.where[1]);
      if (o && o.orderBy) q = q.orderBy(o.orderBy, o.dir || "asc");
      if (o && o.limit) q = q.limit(o.limit);
      return q.onSnapshot(
        s => cb(toList(s), { fromCache: s.metadata.fromCache }),
        e => err && err(e)
      );
    },
    listenDoc(path, cb, err) {
      return fs.doc(path).onSnapshot(
        s => cb(s.exists ? s.data() : null),
        e => err && err(e)
      );
    },
    async get(path) {
      const s = await fs.doc(path).get();
      return s.exists ? s.data() : null;
    },
    async getCol(path) {
      const s = await fs.collection(path).get();
      return s.docs.map(x => ({ id: x.id, ...x.data() }));
    },
    set(path, data) {
      return fs.doc(path).set(data);
    },
    merge(path, data) {
      return fs.doc(path).set(data, { merge: true });
    },
    setKey(path, key, sub, val, extra) {
      // grava/remove data[key][sub] sem tocar no resto
      if (val === DEL)
        return fs
          .doc(path)
          .update({ [key + "." + sub]: firebase.firestore.FieldValue.delete(), ...(extra || {}) })
          .catch(e => {
            if (e.code !== "not-found") throw e;
          });
      return fs.doc(path).set({ [key]: { [sub]: val }, ...(extra || {}) }, { merge: true });
    },
    async add(col, data) {
      const r = await fs.collection(col).add(data);
      return r.id;
    },
    del(path) {
      return fs.doc(path).delete();
    }
  };
}
function localDB() {
  // tudo em memória, só neste navegador; abas abertas ao mesmo tempo se sincronizam (para testar antes de configurar o Firebase)
  const docs = new Map();
  const ls = new Set();
  const clone = o => (o == null ? o : JSON.parse(JSON.stringify(o)));
  const parent = p => p.slice(0, p.lastIndexOf("/"));
  let bc = null;
  try {
    bc = new BroadcastChannel("simula-ordem-teste");
  } catch (e) {}
  function notify(changed) {
    setTimeout(() => ls.forEach(l => l.fire()), 0);
    if (bc && changed)
      changed.forEach(path => {
        try {
          bc.postMessage({ t: "put", path, data: docs.has(path) ? docs.get(path) : null });
        } catch (e) {}
      });
  }
  if (bc) {
    bc.onmessage = ev => {
      const m = ev.data;
      if (m.t === "put") {
        if (m.data == null) docs.delete(m.path);
        else docs.set(m.path, m.data);
        setTimeout(() => ls.forEach(l => l.fire()), 0);
      } else if (m.t === "hello") bc.postMessage({ t: "dump", entries: [...docs.entries()] });
      else if (m.t === "dump" && !docs.size) {
        m.entries.forEach(([k, v]) => docs.set(k, v));
        setTimeout(() => ls.forEach(l => l.fire()), 0);
      }
    };
    bc.postMessage({ t: "hello" });
  }
  function deepMerge(a, b) {
    for (const k in b) {
      const v = b[k];
      if (v === DEL) {
        delete a[k];
        continue;
      }
      if (
        v &&
        typeof v === "object" &&
        !Array.isArray(v) &&
        a[k] &&
        typeof a[k] === "object" &&
        !Array.isArray(a[k])
      )
        deepMerge(a[k], v);
      else a[k] = clone(v);
    }
    return a;
  }
  return {
    mode: "local",
    listenCol(path, o, cb) {
      const l = {
        fire() {
          let list = [];
          docs.forEach((v, k) => {
            if (parent(k) === path && (!o || !o.where || v[o.where[0]] === o.where[1]))
              list.push({ id: k.slice(path.length + 1), ...clone(v) });
          });
          if (o && o.orderBy) {
            const f = o.orderBy,
              s = o.dir === "desc" ? -1 : 1;
            list.sort((a, b) => ((a[f] ?? 0) > (b[f] ?? 0) ? 1 : (a[f] ?? 0) < (b[f] ?? 0) ? -1 : 0) * s);
          } else list.sort((a, b) => (a.id < b.id ? -1 : 1));
          if (o && o.limit) list = list.slice(0, o.limit);
          cb(list, { fromCache: false });
        }
      };
      ls.add(l);
      setTimeout(() => l.fire(), 0);
      return () => ls.delete(l);
    },
    listenDoc(path, cb) {
      const l = {
        fire() {
          cb(clone(docs.get(path) ?? null));
        }
      };
      ls.add(l);
      setTimeout(() => l.fire(), 0);
      return () => ls.delete(l);
    },
    async get(path) {
      return clone(docs.get(path) ?? null);
    },
    async getCol(path) {
      const out = [];
      docs.forEach((v, k) => {
        if (parent(k) === path) out.push({ id: k.slice(path.length + 1), ...clone(v) });
      });
      return out;
    },
    async set(path, data) {
      docs.set(path, clone(data));
      notify([path]);
    },
    async merge(path, data) {
      docs.set(path, deepMerge(docs.get(path) || {}, data));
      notify([path]);
    },
    async setKey(path, key, sub, val, extra) {
      const o = docs.get(path) || {};
      Object.assign(o, extra || {});
      o[key] = o[key] || {};
      if (val === DEL) delete o[key][sub];
      else o[key][sub] = clone(val);
      docs.set(path, o);
      notify([path]);
    },
    async add(col, data) {
      const id = rid(16);
      docs.set(col + "/" + id, clone(data));
      notify([col + "/" + id]);
      return id;
    },
    async del(path) {
      docs.delete(path);
      notify([path]);
    }
  };
}

/* ===================== IMAGENS (comprimidas no navegador) ===================== */
function pickImage() {
  return new Promise(res => {
    const inp = $("#fileIn");
    inp.value = "";
    inp.onchange = () => res(inp.files[0] || null);
    inp.click();
  });
}
function loadImg(file) {
  return new Promise((res, rej) => {
    const u = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      res(im);
      setTimeout(() => URL.revokeObjectURL(u), 1000);
    };
    im.onerror = () => rej(new Error("imagem"));
    im.src = u;
  });
}
function drawTo(im, w, h, sx = 0, sy = 0, sw = im.naturalWidth, sh = im.naturalHeight) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  const g = c.getContext("2d");
  g.imageSmoothingQuality = "high";
  g.drawImage(im, sx, sy, sw, sh, 0, 0, c.width, c.height);
  return c;
}
async function compressScene(file) {
  // mapa/cenário: cabe num documento do Firestore (< 1 MB)
  const im = await loadImg(file);
  let max = 2000;
  const LIMIT = 880000;
  for (let tries = 0; tries < 8; tries++) {
    const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
    const c = drawTo(im, im.naturalWidth * k, im.naturalHeight * k);
    for (const q of [0.82, 0.7, 0.58, 0.48]) {
      const url = c.toDataURL("image/jpeg", q);
      if (url.length <= LIMIT) return { url, w: c.width, h: c.height };
    }
    max = Math.round(max * 0.8);
  }
  throw new Error("grande");
}
function thumbOf(url, w = 192) {
  return new Promise(res => {
    const im = new Image();
    im.onload = () => {
      const k = w / im.naturalWidth;
      res(drawTo(im, w, im.naturalHeight * k).toDataURL("image/jpeg", 0.6));
    };
    im.onerror = () => res("");
    im.src = url;
  });
}
async function compressToken(file) {
  // token: mantém transparência
  const im = await loadImg(file);
  const k = Math.min(1, 260 / Math.max(im.naturalWidth, im.naturalHeight));
  const c = drawTo(im, im.naturalWidth * k, im.naturalHeight * k);
  let url = c.toDataURL("image/webp", 0.85);
  if (!url.startsWith("data:image/webp")) url = c.toDataURL("image/png");
  return { url, w: c.width, h: c.height };
}
async function compressPhoto(file) {
  // foto da ficha: quadrada, 240 px
  const im = await loadImg(file);
  const s = Math.min(im.naturalWidth, im.naturalHeight);
  const c = drawTo(im, 240, 240, (im.naturalWidth - s) / 2, (im.naturalHeight - s) / 3, s, s);
  return c.toDataURL("image/jpeg", 0.8);
}

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

/* ===================== ÍCONES ===================== */
const LOGO_SRC =
  "data:image/webp;base64,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";
const I = {
  logo: (n = 56) => `<img class="logo-img" src="${LOGO_SRC}" alt="" width="${n}" height="${n}">`,
  sigil: `<svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="none" stroke="#8b3ff0" stroke-width="1.6"/><circle cx="20" cy="20" r="12.5" fill="none" stroke="#d3283b" stroke-width="1" stroke-dasharray="2 2.4"/><path d="M20 5.5 L32.6 27.3 L7.4 27.3 Z" fill="none" stroke="#b47dff" stroke-width="1.3"/><circle cx="20" cy="20" r="3.4" fill="#d3283b"/></svg>`,
  mapa: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 8h18M3 16h18M7 4v16M17 4v16"/></svg>`,
  dado: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 2.5 21 7.5v9L12 21.5 3 16.5v-9Z"/><path d="M12 2.5 7.5 15h9Z M3 7.5l4.5 7.5M21 7.5 16.5 15M7.5 15 12 21.5 16.5 15"/></svg>`,
  escudo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><rect x="2.5" y="5" width="5.5" height="14" rx="1.2"/><rect x="9.25" y="3.5" width="5.5" height="17" rx="1.2"/><rect x="16" y="5" width="5.5" height="14" rx="1.2"/></svg>`,
  token: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>`,
  agente: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M4 4c3 1 5 1 8 0 3 1 5 1 8 0v7c0 5-4 8.5-8 10-4-1.5-8-5-8-10Z"/><path d="M8 10.5c1 .8 2 .8 3 0M13 10.5c1 .8 2 .8 3 0M9 15.5c2 1.3 4 1.3 6 0"/></svg>`,
  combate: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 4l10 10M4 4h4M4 4v4M20 4 10 14M20 4h-4M20 4v4M7 17l-3 3M17 17l3 3M12 14l-2 2-2-2 2-2M12 14l2 2 2-2-2-2"/></svg>`,
  frasco: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7 15h10"/></svg>`,
  livro: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Z"/><path d="M4 19V5M8 7h7"/></svg>`,
  fone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4.5" height="6.5" rx="1.5"/><rect x="16.5" y="14" width="4.5" height="6.5" rx="1.5"/></svg>`,
  mic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>`,
  micOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M4 4l16 16"/></svg>`,
  tela: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4M12 13V7M9 10l3-3 3 3"/></svg>`,
  desligar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 14.5c4.7-4.6 12.3-4.6 17 0l-2.3 2.3-3.2-1.6v-2.4a9 9 0 0 0-6 0v2.4l-3.2 1.6Z"/></svg>`,
  ajuda: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 015 .5c0 1.7-2.5 2-2.5 3.5M12 17h.01"/></svg>`,
  papel: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg>`,
  musica: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>`,
  sair: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M9 8l-4 4 4 4M5 12h11"/></svg>`
};
</script>
