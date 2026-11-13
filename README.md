# Simula Ordem

Mesa virtual gratuita para jogar **Ordem Paranormal RPG** com os amigos: fichas, mapas, tokens, rolagens,
NPCs, criaturas, documentos com tarjas e escudo do mestre. Feito por wasmorf.

Projeto de fã, sem fins lucrativos e sem ligação oficial com Ordem Paranormal, Rafael Lange (Cellbit) ou
Jambô Editora.

- **Site:** https://wasmorf.github.io/simula-ordem/
- **Hospedagem:** GitHub Pages, que serve só o arquivo `index.html`.
- **Banco e login:** Firebase (plano Spark gratuito), com Firestore e login anônimo ou Google.

## Como funciona o projeto

O site inteiro é **um único arquivo**, o `index.html`. Para ninguém precisar editar um arquivo de 30 mil
linhas, o código fica em pedaços na pasta `src/`, separados por assunto, e o `build.sh` junta tudo:

```sh
sh build.sh        # gera index.html a partir de src/ (na ordem de src/ordem.txt)
```

O `build.sh` também carimba a data e hora em `VERSAO_SITE` (`js/nucleo/versao.js`). É por ela que o site
avisa os jogadores "Saiu uma versão nova do site" quando você sobe uma atualização.

Para publicar: rode o `build.sh`, suba o `index.html` no GitHub e, se as regras mudaram, cole o
`firestore.rules` no Firebase (Firestore → Regras → Publicar).

### Testar sem Firebase

Abra o site com `#teste` no fim do endereço (`index.html#teste`). Ele usa um banco falso dentro do navegador,
sem regras de segurança, e o selo **MODO DE TESTE** aparece na tela. Servidor local para testar:

```sh
python3 -m http.server 8765    # e abra http://localhost:8765/index.html#teste
```

Os testes automáticos ficam em `testes/` (veja `testes/LEIA.md`).

### Quando algo der errado

- No site, **Como usar → Algo deu errado?** mostra os últimos erros daquela visita, com a versão, o aparelho
  e a mesa. O jogador copia e manda; você já sabe por onde começar.
- Para achar onde mexer: a tabela abaixo diz o que tem em cada arquivo, e todo arquivo começa com uma linha
  explicando o assunto dele.
- Uma função nunca é trocada por outra escondida em outro arquivo. Quando uma parte especial (NPC de ficha
  rápida, classe Sobrevivente, personagem fora de mesa, locais escondidos...) muda o comportamento de uma
  função, a própria função chama a parte especial pelo nome, com um comentário dizendo o arquivo. Exemplo,
  em `js/ficha/ficha-eventos.js`:

```js
function bindSheet() {
  const id = S.openFicha;
  const f = S.fichas[id];
  if (f && f.rapido) bindNpcRapido(id, f); // ficha rápida de NPC (ficha/npcs)
  else bindFichaCompleta();
  ...
  bindEstagio(f, id); // classe Sobrevivente (regras/sobrevivente)
}
```

### Organização do código

- Cada `.js` e cada `.css` é um arquivo normal (sem `<script>` nem `<style>`): o editor colore direito e o
  Prettier formata direto. O `build.sh` põe cada `.js` no seu `<script>` e todo o CSS num `<style>`.
- Tudo fica no escopo global: uma função de um arquivo pode chamar a de outro, desde que só rode depois que a
  página carregou (o `boot()` em `js/iniciar.js` é sempre o último).
- `"use strict"` em todo arquivo.
- Formatação: Prettier com `.prettierrc` (110 colunas). Para formatar tudo:
  `prettier --write "src/**/*.{js,css}"`.
- Ações que gravam no banco e não podem rodar duas vezes num toque duplo começam com
  `if (toqueDuplo("nome")) return;` (`js/nucleo/utilitarios.js`).
- Menus "Opções ▾" e "Mais ▾" usam `menuHTML(id, rótulo, botões)`, também em `utilitarios.js`.

### Travas da ficha (regras do NEX)

Toda regra de limite fica em `js/regras/limites.js`:

- `limitesFicha(f)` calcula quanto a ficha pode ter de cada coisa no NEX dela.
- `problemas(f)` lista o que passou do limite.
- `permitido(f, mudança)` aplica a mudança numa cópia da ficha e só deixa passar se nenhum problema aparecer
  ou aumentar. Tirar sempre passa. Na ficha, cada botão chama `mudar(x => ...)` (em `ficha-eventos.js`),
  que usa essa conta; os botões e opções que não passariam aparecem desligados.
- `pendencias(f)` diz o que ainda falta escolher (a caixa no topo da ficha e o aviso de NEX novo).
- Valem para agentes. NPCs, criaturas e fichas com **Regras livres** não travam. O mestre dá extras em
  `f.extra` (Principal → Regras da ficha).
- NEX, prestígio, bônus e números de arma: só o mestre muda (`podeAjustarNivel`).
- Classe e origem: o jogador escolhe na criação (NEX 5%); trilha: escolhe uma vez, a partir de NEX 10%.
  Depois, só o mestre troca (`motivoTroca`). Antes de qualquer troca, `trocarEscolha` mostra o que muda
  na ficha (poderes de fora da classe, trilha que sai, o que passa do limite) e pede confirmação.

### O que o jogador não vê

O que o mestre esconde não aparece para o jogador em lugar nenhum:

- **Mapa:** token oculto ou dentro de local escondido/névoa não é desenhado (`tokVisivel`, em `mapa/tabuleiro.js`).
- **Painel Tokens:** em cena, só o que ele enxerga no mapa; na biblioteca, só os tokens dele.
- **Combate e registro:** `entradaVisivel` / `entradaVisivelParaJogadores` (`jogo/combate-no-mapa.js`). Criatura
  com token oculto ou NPC escondido não aparece na ordem de iniciativa, não entra no texto da iniciativa nem no
  "Vez de…", e um ataque dela aparece como "???". O mestre vê tudo, com a etiqueta "oculto".
- **Agentes:** a ficha de NPC escondido nem chega ao jogador (regra `npcs` no `firestore.rules`).

Para mudar uma regra (por exemplo, quantas perícias o grau de treinamento dá), o número está em
`CLASSES` (`js/regras/livro.js`, campo `grauTreino`) ou na conta em `limitesFicha`.

### Como a ficha salva

A ficha guarda a última versão que veio do banco (`S.fichaBase`) e, ao salvar, grava só os campos que mudaram
(`queueMerge`). Assim, se o mestre e o jogador mexem na mesma ficha ao mesmo tempo, um não apaga o que o outro
fez. Se chega uma versão nova enquanto a ficha está salvando, ela espera e entra logo depois
(`fichaDoBanco` em `js/ficha/ficha.js`).

## Pastas

| Pasta / arquivo | O que tem |
| --- | --- |
| `src/` | O código, em pedaços (lista abaixo) |
| `src/ordem.txt` | A ordem em que os pedaços entram no `index.html` |
| `build.sh` | Junta `src/` em `index.html` e carimba a versão |
| `index.html` | O site pronto: é o arquivo que vai para o GitHub |
| `firestore.rules` | Quem pode ler e escrever o quê no Firebase |
| `testes/` | Testes automáticos (abrem o site num navegador e conferem cada recurso) |
| `data/` | Material de origem usado para montar a lista de rituais (o site não carrega) |
| `assets/` | Logos em PNG e WebP (para redes sociais e divulgação; o site usa o logo em SVG) |
| `audio/` | Músicas livres (MP3) da Trilha sonora, sem anúncio. Os nomes dos arquivos estão em `TRILHAS_LIVRES` (`js/jogo/trilha-sonora.js`). Músicas de Kevin MacLeod (incompetech.com), licença CC BY 4.0 |

## O que tem em `src/`

`pagina/cabecalho.html` é o `<head>` (título, ícone, fontes) e `pagina/corpo.html` é o esqueleto da página
(barra lateral, tabuleiro, painel e os scripts do Firebase).

### `estilo/` (o visual)

A ordem dos `.css` importa: quando duas regras empatam, vale a que vem depois.

| Arquivo | O que tem |
| --- | --- |
| `base.css` | Cores, fontes, botões, campos e caixas usados no site todo |
| `lobby.css` | Tela inicial |
| `mesa.css` | Mesa virtual: trilho, tabuleiro, painel lateral e barra de baixo no celular |
| `listas.css` | Listas e cards do painel |
| `ficha.css` | Ficha do agente |
| `rolagens.css` | Rolagens, registro e popup de dado |
| `combate-escudo.css` | Combate, escudo do mestre e homebrew |
| `janelas.css` | Janelas (modal), avisos (toast) e chamadas |
| `ficha-detalhes.css` | Ficha: barras de vida, cards de arma e ritual |
| `mapa.css` | Mapa: camadas, ferramentas, tokens, NPCs e vez no combate |
| `criador-mapas.css` | Criador de mapas |
| `documentos.css` | Documentos: papéis de cada modelo, biblioteca, editor; ajuda, NPCs e galeria |
| `toque-celular.css` | Ajustes de toque e de celular, capa, aviso de versão nova e documentos no mapa |
| `tarjas.css` | Estilos de tarja dos documentos |
| `cartaz-email-audio.css` | Modelos de documento: cartaz, e-mail e áudio |
| `notas-mural.css` | Anotações do jogador e mural de pistas |
| `portas.css` | Portas e passagens entre cenas |

### `js/` (o código), por pasta

#### `js/nucleo/` — O motor do site: banco, dados, estado, utilitários, erros, versão

| Arquivo | O que faz |
| --- | --- |
| `firebase-config.js` | Configuração do projeto Firebase (banco de dados e login) |
| `dados.js` | Rolagem de dados (1d20, 2d6+3, testes de atributo) |
| `banco.js` | Banco de dados: Firebase de verdade ou banco de teste no navegador (#teste) |
| `imagens.js` | Imagens: carregar e comprimir no navegador antes de salvar |
| `utilitarios.js` | Funções pequenas usadas no site todo: $, esc, toast, caixas de confirmação, menus |
| `erros.js` | Erros: o site guarda os últimos erros desta visita. Em Como usar → "Algo deu errado?" |
| `icones.js` | Ícones SVG da interface |
| `estado.js` | Estado do site (objeto S) e início: login, modo de teste, abrir a mesa do link |
| `recorte-imagem.js` | Recortar imagem (foto da ficha e tokens) |
| `versao.js` | Versão do site e aviso de versão nova |

#### `js/regras/` — Regras do livro e suplementos (só nomes e números), condições, Sobrevivente

| Arquivo | O que faz |
| --- | --- |
| `livro.js` | Regras do Livro de Regras: atributos, perícias, classes, origens, armas, tipos de dano, rituais, ameaças (só nomes e números) |
| `suplementos.js` | Suplementos: Sobrevivendo ao Horror e Arquivos Secretos (só nomes e números) |
| `rituais-resumo.js` | Uma frase do que cada ritual faz (escrita para o site), mostrada no cartão do ritual e ao aprender |
| `aba-regras.js` | Painel Regras: resumo das regras do livro em abas |
| `condicoes.js` | Condições nas rolagens (a mais severa vale) e o aviso de Morrendo |
| `sobrevivente.js` | Classe Sobrevivente (SaH): estágios no lugar do NEX e aba Suplementos |
| `limites.js` | Limites da ficha pelas regras (atributos, perícias, graus, poderes, rituais, itens), o que falta escolher e a trava `permitido()` |

#### `js/mesa/` — Tela inicial, entrar na mesa, barra de ferramentas, ajuda, backup, Meus personagens

| Arquivo | O que faz |
| --- | --- |
| `lobby.js` | Tela inicial: criar mesa, entrar com código, Meus personagens, mesas públicas |
| `mesa.js` | Entrar e sair de uma mesa: senha, aprovação, assinaturas do banco |
| `navegacao.js` | Barra de ferramentas (trilho e barra de baixo) e o painel lateral |
| `backup.js` | Backup: baixar e restaurar fichas e mesas inteiras (.json) |
| `ajuda.js` | Como usar o site (painel e janela de ajuda) |
| `personagens.js` | Meus personagens: fichas fora de mesa, levar e trazer de mesas |
| `capa.js` | Capa da mesa (lobby e tela de entrada) |

#### `js/ficha/` — Ficha do agente, NPCs e criaturas

| Arquivo | O que faz |
| --- | --- |
| `catalogos.js` | Catálogos da ficha (rituais, armas, itens) somando o homebrew da mesa |
| `sigilos.js` | Sigilos dos elementos (desenhos SVG usados na ficha) |
| `ficha.js` | Ficha: números calculados (PV, PE, SAN, Defesa... com os poderes que mudam números), fotos por estado (`fotoAtual`), salvar e lista de Agentes |
| `ficha-html.js` | Ficha: o que aparece em cada aba (Principal, Perícias, Combate...) |
| `ficha-rolagens.js` | Ficha: testes de perícia, ataques (danos extras com tipo: `arma.extras`, lidos por `danosExtras` em `ficha.js`) e rituais |
| `ficha-eventos.js` | Ficha: o que cada botão e campo faz |
| `subir-nex.js` | Subir de NEX guiado: o que o agente ganhou em cada nível e o aviso para o jogador |
| `npcs-sincronia.js` | NPCs do mestre: receber do banco e onde cada ficha é salva |
| `npcs.js` | NPCs: ficha rápida, modelos prontos, duplicar e pastas |
| `criaturas.js` | Criaturas: ficha de criatura, arte por elemento, pôr pasta inteira na cena |
| `galeria-artes.js` | Galeria de artes do bestiário (imagens que o mestre sobe) |

#### `js/mapa/` — Tabuleiro, cenas, tokens, portas, locais escondidos e o criador de mapas

| Arquivo | O que faz |
| --- | --- |
| `cenas.js` | Cenas: criar, exibir para os jogadores, trocar de cena |
| `tokens.js` | Tokens: criar, mover, imagem, cor; aba Ameaças com filtro por elemento |
| `tabuleiro.js` | Tabuleiro: zoom, névoa, desenhos, régua, ferramentas do mapa e desenho da cena |
| `arte.js` | Criador de mapas: pisos, paredes, portas e acabamento desenhados por código |
| `objetos.js` | Criador de mapas: todos os objetos (móveis, carros, árvores...) |
| `editor.js` | Criador de mapas: o editor (ferramentas, desfazer, virar cena) |
| `modelos.js` | Criador de mapas: mapas prontos |
| `locais.js` | Locais escondidos do mapa (salas pretas até o mestre revelar) |
| `tokens-extras.js` | Tokens: não redesenhar durante o arrasto e foto de NPC no token |
| `portas.js` | Portas que abrem, portas trancadas e passagens entre cenas |

#### `js/jogo/` — Rolagens, combate, privado e trilha sonora

| Arquivo | O que faz |
| --- | --- |
| `popup-dados.js` | Resultado de dado que aparece na tela de todos e registro da mesa; visual do dado (`SKINS_DADO`) e som com mudo |
| `rolagens.js` | Painel Rolagens: rolar dados, teste de Ordem, chat, escolher o visual do dado; registro com data (`quandoRolou`) |
| `combate.js` | Painel Combate: iniciativa, turnos, ataques do bestiário |
| `privado.js` | Privado: sussurros, rolagens só para o mestre e entrega de documentos |
| `combate-no-mapa.js` | Combate no mapa: de quem é a vez, centrar no token, pôr tokens no combate |
| `trilha-sonora.js` | Trilha sonora: YouTube, arquivos e músicas livres sincronizadas para todos |

#### `js/mestre/` — Ferramentas do mestre: escudo, acesso, homebrew, gestão, copiar cena

| Arquivo | O que faz |
| --- | --- |
| `escudo.js` | Escudo do mestre: capa, acesso, anotações, tabelas rápidas |
| `homebrew.js` | Homebrew: itens, rituais e habilidades criados pelo mestre |
| `acesso.js` | Acesso à mesa: quem entra, senha, aprovação, bloqueio |
| `gestao.js` | Gestão: apagar mesa, retirar ficha, virar NPC, dar ficha a um jogador, repetidas |
| `copiar-cena.js` | Copiar cena ou mapa para outra mesa do mesmo mestre |

#### `js/documentos/` — Documentos com tarjas, passar, no mapa, anotações e mural

| Arquivo | O que faz |
| --- | --- |
| `documentos.js` | Documentos: modelos, tarjas, carimbo (`carimboHTML`), caneta `((…))` (`docFmt`), biblioteca do mestre, leitura e editor |
| `passar.js` | Documentos: passar de mão em mão, recolher, mover |
| `no-mapa.js` | Documentos jogados no mapa como papéis numa mesa: girados (`rot`), tamanho (`esc`), o último mexido por cima (`z`); `papelHTML` desenha, `medirPapel` acerta a altura |
| `mural-notas.js` | Anotações e grifos do jogador e o mural de pistas |

`js/iniciar.js` chama `boot()` e é sempre o último arquivo.

### Quem chama quem (os pontos principais)

- `documentosHTML()` (`documentos/documentos.js`) monta o painel: mural, biblioteca, entregues
  (`docsEntreguesHTML`, em `passar.js`) e no mapa (`docsNoMapaHTML`, em `no-mapa.js`).
- `escudoHTML()` (`mestre/escudo.js`) chama `escudoCapaHTML()` (`mesa/capa.js`) e `escudoApagarHTML()`
  (`mestre/gestao.js`).
- `renderBoard()` (`mapa/tabuleiro.js`) desenha portas e passagens (`mapa/portas.js`); `renderNomes()` mostra
  os documentos no mapa (`renderMapDocs`) e `renderFog()` pinta os locais escondidos (`fogLocais`).
- `derivados(f)` (`ficha/ficha.js`) calcula PV, PE, SAN e Defesa e no fim chama `ajustarNpcRapido` e
  `ajustarSobrevivente`.
- `sheetHTML()` e `bindSheet()` desenham e ligam a ficha; a ficha rápida de NPC fica em `ficha/npcs.js`, o
  menu Opções em `mestre/gestao.js` (`fichaAcoes`).

## Firebase: onde cada coisa fica

Tudo de uma mesa fica em `mesas/<código>/...`. As regras completas estão em `firestore.rules`.

| Caminho | O que é | Quem lê / escreve |
| --- | --- | --- |
| `portas/<código>` | Nome, descrição, tipo de acesso e capa da mesa | Todos leem; o mestre escreve |
| `mesas/<código>` | A mesa (mestre, cena exibida) | Membros leem; o mestre escreve |
| `.../membros`, `.../bloqueados`, `.../entrada` | Quem está na mesa, quem foi bloqueado, pedidos de entrada | Ver regras |
| `.../fichas` | Fichas dos agentes | Todos leem; cada um edita a sua; o mestre edita todas |
| `.../npcs` | NPCs e criaturas | O mestre; jogadores só leem os visíveis |
| `.../cenas`, `.../cenaImg`, `.../nevoa` | Cenas (com portas e passagens), imagens e névoa | O mestre; jogadores só a cena exibida |
| `.../pos` | Posição dos tokens | O mestre move todos; cada jogador só o próprio |
| `.../tokens` | Biblioteca de tokens | Todos leem; cada um edita os seus |
| `.../docs` | Biblioteca de documentos com as tarjas originais | Só o mestre |
| `.../privado` | Sussurros, rolagens secretas e documentos entregues | Só quem mandou e quem recebeu |
| `.../estado` | Combate, trilha sonora e documentos no mapa | Todos leem; o mestre escreve |
| `.../mapas` | Mapas do criador | Só o mestre |
| `.../mural` | Mural de pistas: documentos, bilhetes e barbantes (`tipo`: doc, nota, fio) | Todos leem e pregam; qualquer um arruma; o texto só muda quem pregou ou o mestre |
| `usuarios/<uid>/...` | Minhas mesas, Meus personagens, anotações nos documentos (`notasDoc`) | Só a própria pessoa |
