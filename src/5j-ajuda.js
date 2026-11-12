<script>
"use strict";
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
        `Abra ${AJ_I("Agentes")} → <b>Criar ficha</b>. Escolha origem, classe, trilha e NEX; distribua os atributos e toque em <b>Marcar perícias da origem e classe</b>. Vida, PE, Sanidade e Defesa são calculados sozinhos. Na aba <b>História</b> você põe a arte do personagem.`
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
        "Documentos e pistas",
        `O que o mestre te entrega abre sozinho na tela e fica guardado em ${AJ_I("Documentos")}. Partes pretas são trechos que você ainda não descobriu: o mestre pode revelar depois.`
      ]
    ]
  },
  mestre: {
    nome: "Mestre",
    itens: [
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
        "Comece de um mapa pronto (Base de Operações, casa, rua, floresta…) ou em branco. Ferramentas: <b>Sala</b> (arraste um retângulo e já sai com piso e paredes), <b>Piso</b>, <b>Balde</b>, <b>Parede</b>, <b>Porta</b>, <b>Objetos</b> (tem busca), <b>Texto</b> e <b>Borracha</b>. Ctrl+Z desfaz; R gira; Delete apaga. No fim, <b>Usar como cena</b>."
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
        `Em ${AJ_I("Documentos")} → <b>Criar documento</b>. Escolha o modelo (relatório, carta, jornal, B.O., laudo, diário, celular…). Escreva entre [[ e ]] o que deve chegar tarjado. Guarde na biblioteca e toque em <b>Entregar</b> na hora certa; depois, <b>Revelar trechos</b>.`
      ],
      [
        "Trilha sonora",
        `Em ${AJ_I("Trilha")}, cole links do YouTube ou de MP3 e toque para tocar para todos ao mesmo tempo. Cada um ajusta o próprio volume.`
      ],
      [
        "Escudo do mestre",
        `O ${AJ_I("Escudo")} mostra a vida, sanidade e PE de todos os agentes, as rolagens secretas e suas anotações. Lá também fica o <b>Backup da mesa</b>: baixe de vez em quando.`
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
   <div class="stack" style="gap:8px">${AJUDA[t].itens.map(([h, p], i) => `<details class="box aj" ${i < 2 ? "open" : ""}><summary><b>${h}</b></summary><p>${p}</p></details>`).join("")}</div>`;
}
function bindAjuda() {
  $$("[data-ajt]").forEach(
    b =>
      (b.onclick = () => {
        S.ajTab = b.dataset.ajt;
        renderPanel();
      })
  );
}
</script>
<script>
function ajudaModal() {
  const h = $("#modalHost");
  const r = () => {
    h.innerHTML = `<div class="modal-back"><div class="modal" style="max-width:640px" role="dialog" aria-label="Como usar"><div class="row between"><h3 style="margin:0">Como usar o Simula Ordem</h3><button class="btn sm" id="ajX">Fechar</button></div>${ajudaHTML()}</div></div>`;
    $("#ajX").onclick = () => (h.innerHTML = "");
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
</script>
