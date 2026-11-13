"use strict";
/* Como usar o site (painel e janela de ajuda). */
/* ============================ COMO USAR ============================ */
const AJ_I = n => `<span class="aj-i">${n}</span>`;
const AJUDA = {
  jogador: {
    nome: "Jogador",
    itens: [
      [
        "Entrar na mesa",
        'Abra o link que o mestre mandou e escreva seu nome. Se a mesa tiver senha, o mestre te passa. Se for "só quem eu aprovar", espere ele aceitar: você entra sozinho.'
      ],
      [
        "Não perder seus personagens",
        "Toque em <b>Entrar com Google</b> na página inicial. Assim suas fichas aparecem em qualquer aparelho em que você entrar com a mesma conta. Sem isso, elas ficam só neste navegador."
      ],
      [
        "Criar sua ficha",
        `Abra ${AJ_I("Agentes")} → <b>Criar ficha</b>. Escolha origem e classe, distribua os atributos e toque em <b>Marcar perícias da origem e classe</b>. Vida, PE, Sanidade e Defesa são calculados sozinhos. Na aba <b>História</b> você põe a arte do personagem.`
      ],
      [
        "O que a ficha deixa escolher",
        "A ficha segue as regras do seu NEX: mostra quantos pontos de atributo, perícias, poderes e rituais você tem (<b>2 de 4</b>) e trava o que passaria do limite. A caixa <b>Falta escolher</b> no topo diz o que ainda está livre; toque num item para ir à aba certa. Tirar sempre pode. <b>Classe e origem</b> você escolhe na criação (NEX 5%) e a <b>trilha</b> uma vez, em NEX 10%; antes de trocar, a ficha mostra o que muda. Depois disso, quem troca é o mestre, assim como o <b>NEX</b>, o prestígio e os bônus. Quando ele sobe o seu NEX, a ficha mostra o que você ganhou."
      ],
      [
        "Rolar dados",
        "Na ficha, aba <b>Perícias</b>, toque no botão de dados ao lado da perícia. Na aba <b>Combate</b>, toque em <b>Atacar</b> na arma; na aba <b>Rituais</b>, toque na forma do ritual para conjurar. Condições marcadas na ficha já tiram dados sozinhas. Em " +
          AJ_I("Rolagens") +
          " você rola qualquer dado (ex.: 2d6+3)."
      ],
      [
        "Falar só com o mestre",
        `Em ${AJ_I("Rolagens")}, mude <b>Para</b> de \"Todos\" para \"Só o mestre\". Vale para o chat, para as rolagens e para os testes da ficha.`
      ],
      [
        "Seu token no mapa",
        `Na ficha, aba História → <b>Criar token deste agente</b>. Ele usa a arte da ficha. Arraste para andar; só você e o mestre movem o seu token. Toque no token para mudar o formato (quadrado ou redondo) e a cor da moldura.`
      ],
      [
        "Ferramentas do mapa",
        "Na barrinha do mapa: <b>régua</b> (mede em metros), <b>ping</b> (chama a atenção de todos para um ponto), <b>desenho</b> e <b>borracha</b>. Atalhos no computador: V, R, P, D, E."
      ],
      [
        "Portas, cadeados e escadas",
        "As portas do mapa abrem e fecham na hora, mas quem mexe nelas é o mestre: diga o que seu agente faz. Quando uma porta abre, a sala do outro lado aparece. Uma porta com <b>cadeado</b> está trancada; toque nela para ver e combine com o mestre um teste (Crime para a fechadura, Força para arrombar). Um botão roxo com uma escadinha é uma <b>passagem</b> para outro lugar (outro andar, a rua...): o mestre usa e leva o grupo junto, com os tokens."
      ],
      [
        "Documentos e pistas",
        `O que o mestre te entrega abre sozinho na tela e fica guardado em ${AJ_I("Documentos")}. Partes pretas são trechos que você ainda não descobriu: o mestre pode revelar depois. Documentos também podem aparecer jogados em cima do mapa, como papéis numa mesa: toque para ler. Os seus você pode <b>passar</b> para outro jogador.`
      ],
      [
        "Grifar, anotar e montar o mural",
        `Com um documento aberto, selecione um trecho e toque em <b>Grifar trecho</b>; embaixo, escreva suas <b>anotações</b> (só você vê). Toque em <b>Pôr no mural</b> para pregar o documento no <b>Mural de pistas</b> (em ${AJ_I("Documentos")}), onde o grupo todo arruma as pistas, prega bilhetes e liga uma à outra com barbante.`
      ],
      [
        "Guardar e compartilhar personagens",
        "Na página inicial, em <b>Meus personagens</b>, toque em <b>Baixar</b> para guardar um arquivo do personagem. Mande esse arquivo para um amigo e ele usa <b>Importar personagem</b>. <b>Baixar todos</b> faz um arquivo só com todos os seus personagens; ao importar esse arquivo de volta, os que já estão na sua conta são substituídos (sem criar cópias)."
      ]
    ]
  },
  mestre: {
    nome: "Mestre",
    itens: [
      [
        "Subir o NEX e as travas da ficha",
        "Abra a ficha do agente e mude o <b>NEX</b> (ou o estágio do Sobrevivente): aparece o que ele ganhou em cada nível e o que falta escolher, e o jogador vê o mesmo aviso quando abrir a ficha. As fichas dos agentes travam no limite das regras. Para homebrew ou recompensa, em Principal → <b>Regras da ficha</b> dê extras (+1 poder, +2 perícias…) ou marque <b>Regras livres</b> para tirar as travas daquela ficha. NPCs e criaturas não têm trava."
      ],
      [
        "Criar a mesa e chamar os jogadores",
        "Na página inicial, crie a mesa e escolha quem pode entrar: qualquer um com o link, só com senha, ou só quem você aprovar. Mande o link. No " +
          AJ_I("Escudo") +
          " → <b>Acesso à mesa</b> você aprova pedidos, expulsa, bloqueia e muda a senha."
      ],
      [
        "Cenas",
        `Em ${AJ_I("Cenas")}: <b>Cena com imagem</b> (sobe um mapa ou cenário seu) ou <b>Criar mapa</b>. Só a cena marcada como <b>Exibir para jogadores</b> aparece para eles; as outras ficam escondidas, e você pode olhar e preparar sem ninguém ver.`
      ],
      [
        "Criador de mapas",
        "Comece de um mapa pronto (Base de Operações, bunker, casa, rua, floresta, cemitério, escola, hospital, delegacia, mansão, motel, Outro Lado…) ou em branco. Ferramentas: <b>Sala</b> (arraste um retângulo e já sai com piso e paredes), <b>Piso</b>, <b>Balde</b>, <b>Parede</b>, <b>Porta</b>, <b>Objetos</b> (tem busca), <b>Texto</b> e <b>Borracha</b>. Ctrl+Z desfaz; R gira; Delete apaga. No fim, <b>Usar como cena</b>. Em Cenas, <b>Copiar p/ outra mesa</b> leva a cena ou o mapa para outra mesa sua."
      ],
      [
        "Portas que abrem e fecham",
        "As portas que você põe no criador viram portas de verdade na mesa (em cenas feitas ou atualizadas com <b>Usar como cena</b>). Toque numa porta para abrir ou fechar: ao abrir, o local escondido do outro lado aparece para os jogadores. <b>Segure o dedo</b> (ou clique com o botão direito) numa porta para trancar: os jogadores veem um cadeado, e você toca nela para destrancar quando alguém passar no teste. A <b>Porta trancada</b> do criador já começa assim. A <b>passagem secreta</b> parece parede para os jogadores até você abrir."
      ],
      [
        "Andares e lugares ligados",
        `Em ${AJ_I("Cenas")}, no cartão da cena, toque em <b>Passagens</b>: dê um nome (Escada, Elevador, Saída) e escolha para qual cena leva. Marque para criar a volta na outra cena. A passagem aparece no mapa; arraste para cima da escada. Na hora, toque nela: todos vão para a outra cena, e os tokens dos agentes vão junto.`
      ],
      [
        "Locais escondidos",
        "No criador de mapas, use a ferramenta <b>Esconder local</b> (olho riscado, tecla X): clique numa sala ou arraste um retângulo. Na mesa esses locais ficam pretos para os jogadores; revele um por um pelo botão <b>Locais</b> na barrinha do mapa."
      ],
      [
        "Nomes dos lugares",
        "Os nomes escritos no mapa ligam e desligam pelo botão <b>T</b> na barrinha do mapa. Em Cenas → Editar você esconde só alguns."
      ],
      [
        "Névoa de guerra",
        "Na barrinha do mapa, use <b>revelar</b> (olho) e <b>esconder</b> (olho riscado) arrastando sobre o mapa. Os jogadores só veem o que você revelou."
      ],
      [
        "Tokens e criaturas",
        `Em ${AJ_I("Tokens")} você cria tokens com imagem e, na aba <b>Ameaças</b>, põe criaturas do bestiário direto na cena: cada uma ganha uma ficha (Agentes → Criaturas) e entra no combate. Em <b>Artes do bestiário</b> você sobe uma imagem sua para cada criatura e ela vira o token. Em Agentes → <b>Criar criatura</b> você faz uma do zero ou a partir do bestiário. Em uma pasta de NPCs ou criaturas, <b>Pôr na cena</b> coloca todos de uma vez. Marque um token como <b>oculto</b> para só você ver.`
      ],
      [
        "Combate",
        `Em ${AJ_I("Combate")}: <b>Adicionar os tokens da cena</b>, depois <b>rolar iniciativa</b>. O token de quem está na vez brilha em vermelho no mapa. Toque no nome para centralizar nele.`
      ],
      [
        "NPCs",
        `Em ${AJ_I("Agentes")} → <b>Criar NPC</b>. A ficha <b>rápida</b> tem só o essencial (vida, defesa, perícias e ataques) e pode começar de um modelo: civil, policial, segurança, capanga, cultista, médico, jornalista, agente veterano, ocultista. A <b>completa</b> é igual à de um agente. Crie vários de uma vez (Capanga 1, 2, 3…), use <b>Duplicar</b> e organize por <b>pasta</b>. Só você vê; marque <b>visível</b> para os jogadores lerem.`
      ],
      [
        "Documentos",
        `Em ${AJ_I("Documentos")} → <b>Criar documento</b>. Escolha o modelo (relatório, carta, jornal, B.O., laudo, diário, celular…). Escreva entre [[ e ]] o que deve chegar tarjado. Guarde na biblioteca e toque em <b>Entregar</b> na hora certa (para um jogador ou para todos); depois, <b>Revelar trechos</b>. O modelo <b>Foto</b> vira uma foto com legenda; <b>Cartaz</b>, <b>E-mail</b> e <b>Áudio</b> (grave pelo microfone; o texto vira a transcrição) também existem. Ao lado de <b>Tarjar trecho</b>, escolha o estilo da tarja: tarja preta, rabisco, mancha de sangue, pedaço rasgado, queimado, mensagem apagada, chiado... cada modelo mostra só os que fazem sentido nele. Em <b>Aparência</b>, ponha um <b>carimbo</b> (texto e cor), e o botão <b>Caneta</b> escreve anotações à mão em vermelho (entre (( e ))). <b>Pôr no mapa</b> joga o papel na cena, meio torto, por cima dos outros; arraste para mover e, passando o mouse, use ↺ ↻ para girar e − + para mudar o tamanho; e <b>Mural</b> prega no Mural de pistas do grupo.`
      ],
      [
        "Trilha sonora",
        `Em ${AJ_I("Trilha")}, cole links do YouTube ou de MP3 e toque para tocar para todos ao mesmo tempo. Cada um ajusta o próprio volume.`
      ],
      [
        "Escudo do mestre",
        `O ${AJ_I("Escudo")} mostra a vida, sanidade e PE de todos os agentes, as rolagens secretas e suas anotações. Lá também fica o <b>Backup da mesa</b>: baixe de vez em quando. Para entregar um personagem a um jogador (ou tomar de volta), abra a ficha dele em ${AJ_I("Agentes")} e use <b>Dar a um jogador</b>.`
      ]
    ]
  },
  dicas: {
    nome: "Dicas",
    itens: [
      [
        "Não está sincronizando?",
        "Recarregue a página. Se continuar, confira a internet: tudo é salvo na nuvem na hora."
      ],
      [
        "Celular",
        "Funciona tudo no celular, mas mapa e criador de mapas são mais confortáveis no computador. No celular, use dois dedos para dar zoom no mapa."
      ],
      [
        "Backup",
        "Baixe a ficha em Agentes (aba História) e a mesa inteira no Escudo. Dá para restaurar pela página inicial."
      ]
    ]
  }
};
function ajudaHTML() {
  const t = S.ajTab || (S.isM ? "mestre" : "jogador");
  return `<div class="tabs2">${Object.entries(AJUDA)
    .map(([k, a]) => `<button data-ajt="${k}" aria-pressed="${t === k}">${a.nome}</button>`)
    .join("")}</div>
   <div class="stack" style="gap:8px">${AJUDA[t].itens.map(([h, p], i) => `<details class="box aj" ${i < 2 ? "open" : ""}><summary><b>${h}</b></summary><p>${p}</p></details>`).join("")}${relatorioHTML()}</div>`;
}
function bindAjuda() {
  $$("[data-ajt]").forEach(
    b =>
      (b.onclick = () => {
        S.ajTab = b.dataset.ajt;
        renderPanel();
      })
  );
  bindRelatorio(); // "Algo deu errado?" (nucleo/erros.js)
}
function ajudaModal() {
  const h = $("#modalHost");
  const r = () => {
    h.innerHTML = `<div class="modal-back"><div class="modal" style="max-width:640px" role="dialog" aria-label="Como usar"><div class="row between"><h3 style="margin:0">Como usar o Simula Ordem</h3><button class="btn sm" id="ajX">Fechar</button></div>${ajudaHTML()}</div></div>`;
    $("#ajX").onclick = () => (h.innerHTML = "");
    bindRelatorio();
    $$("[data-ajt]").forEach(
      b =>
        (b.onclick = () => {
          S.ajTab = b.dataset.ajt;
          r();
        })
    );
  };
  r();
}
function ajudaPrimeiraVez() {
  if (lsGet("ms_ajuda", false)) return;
  lsSet("ms_ajuda", true);
  setTimeout(() => toast("Primeira vez aqui? Toque em ? (Como usar) na barra lateral."), 1500);
}
