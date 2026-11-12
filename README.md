# Simula Ordem

Mesa virtual gratuita para jogar **Ordem Paranormal RPG** com os amigos: fichas, mapas, tokens, rolagens,
NPCs, criaturas, documentos com tarjas e escudo do mestre. Feito por wasmorf.

Projeto de fã, sem fins lucrativos e sem ligação oficial com Ordem Paranormal, Rafael Lange (Cellbit) ou
Jambô Editora.

- **Site:** https://wasmorf.github.io/simula-ordem/
- **Hospedagem:** GitHub Pages, que serve só o arquivo `index.html`.
- **Banco e login:** Firebase (plano Spark gratuito), com Firestore e login anônimo ou Google.

## Como funciona o projeto

O site inteiro é **um único arquivo**, o `index.html`. Para não editar um arquivo de 20 mil linhas, o código
fica dividido na pasta `src/` e o `build.sh` junta tudo:

```sh
sh build.sh        # gera index.html a partir de src/
```

O `build.sh` também carimba a data e hora em `VERSAO_SITE`. É por ela que o site avisa os jogadores
"Saiu uma versão nova do site" quando você sobe uma atualização.

Para publicar: rode o `build.sh`, suba o `index.html` no GitHub e, se as regras mudaram, cole o
`firestore.rules` no Firebase (Firestore → Regras → Publicar).

### Testar sem Firebase

Abra o site com `#teste` no fim do endereço (`index.html#teste`). Ele usa um banco falso dentro do navegador,
sem regras de segurança, e o selo **MODO DE TESTE** aparece na tela. Servidor local para testar:

```sh
python3 -m http.server 8765    # e abra http://localhost:8765/index.html#teste
```

## Pastas

| Pasta / arquivo | O que tem |
| --- | --- |
| `src/` | O código, em pedaços (lista abaixo) |
| `build.sh` | Junta `src/` em `index.html` e carimba a versão |
| `index.html` | O site pronto: é o arquivo que vai para o GitHub |
| `firestore.rules` | Quem pode ler e escrever o quê no Firebase |
| `data/` | Material de origem usado para montar a lista de rituais (o site não carrega) |
| `assets/` | Logos em PNG e WebP (para redes sociais e divulgação; o site usa o logo em SVG) |
| `audio/` | Músicas livres (MP3) da Trilha sonora, sem anúncio. Os nomes dos arquivos estão em `TRILHAS_LIVRES` (`5d-extra.js`). Músicas de Kevin MacLeod (incompetech.com), licença CC BY 4.0 |

## Os arquivos de `src/`, na ordem em que entram no site

| Arquivo | O que faz |
| --- | --- |
| `1-head.html` | Cabeçalho da página e todo o CSS (cores, layout, ficha, mapa, documentos) |
| `2-body.html` | Esqueleto da página: barra lateral, tabuleiro e painel |
| `3-core.js` | Regras do livro (classes, origens, perícias, armas, rituais, ameaças), rolagem de dados e a camada do banco (Firebase ou o banco de teste) |
| `3c-suplementos.js` | Conteúdo dos suplementos (Sobrevivendo ao Horror e Arquivos Secretos) e a etiqueta de fonte de cada item |
| `4-app.js` | Estado do app, entrar e sair de mesa, tela inicial, painel lateral, cenas |
| `4b-mapa.js` | Tabuleiro: zoom, arrastar, tokens, névoa, réguas, desenhos e pings |
| `5a-ficha.js` | A ficha do agente inteira (abas, cálculos, inventário, rituais, ataques) |
| `5c-resto.js` | Rolagens, combate, escudo do mestre, regras e homebrew |
| `5d-extra.js` | Condições, membros da mesa, backup da mesa e de fichas, trilha sonora (com as músicas livres da pasta `audio/`), NPCs |
| `5e-mapa-arte.js` | Desenho dos pisos, paredes e portas do criador de mapas (inclui pisos e paredes dos elementos: Sangue, Morte, Conhecimento, Energia) |
| `5f-mapa-objetos.js` | Os objetos e decorações do criador de mapas (inclui Aeroporto e bunker, Biblioteca, Cemitério e igreja, Comércio, Transporte, Escola, Rural, Porto e praia, Prédio, Hospital e laboratório, Delegacia, Mansão e hotel) |
| `5g-mapa-editor.js` | O criador de mapas (ferramentas, salvar, usar como cena) |
| `5h-mapa-modelos.js` | Mapas prontos (base sob a biblioteca, bunker do aeroporto, cemitério, paróquia, mercado, metrô, escola, fazenda, porto, prédio de apartamentos, hospital, delegacia, mansão, motel, Outro Lado, rua, casa, clareira...) |
| `5i-documentos.js` | Documentos com tarjas: modelos, editor, entregar, revelar |
| `5j-ajuda.js` | Tela "Como usar o site" |
| `5k-npcs.js` | NPCs do mestre com ficha rápida e modelos prontos |
| `5l-criaturas.js` | Criaturas do bestiário, artes do bestiário, pôr grupos na cena |
| `5m-solo.js` | "Meus personagens": personagens fora de mesa, importar e baixar |
| `5n-gestao.js` | Retirar da mesa, virar NPC ou agente, dar a um jogador, apagar mesa, limpar repetidos |
| `5o-locais.js` | Locais escondidos no mapa (pintar no criador e revelar na mesa) |
| `5p-capa.js` | Capa da mesa e dica de nome na barra lateral |
| `5q-sobrevivente.js` | Classe Sobrevivente, aba de suplementos nas regras e aviso de versão nova |
| `5r-docs-passar.js` | Documentos entregues: passar para outro jogador, mudar de dono, recolher |
| `5s-docs-mapa.js` | Documentos no mapa, foto de NPC no token, copiar cena ou mapa para outra mesa |
| `5t-portas-andares.js` | Portas que abrem, fecham e trancam na cena (e revelam o local do outro lado) e passagens entre cenas (andares ligados) |
| `7-end.html` | Fecha a página e chama `boot()` |

Cada `.js` é um ou mais blocos `<script>` independentes. Tudo fica no escopo global: uma função de um arquivo
pode ser chamada por outro, desde que seja usada só depois que a página terminou de carregar.

## Como os módulos se conectam

Os recursos mais novos chamam uns aos outros **pelo nome, de forma explícita**. Exemplos:

- `documentosHTML()` (em `5i`) monta o painel juntando `documentosBaseHTML()`, `docsPassarHTML()` (`5r`) e
  `docsMapaHTML()` (`5s`).
- `escudoHTML()` (em `5c`) chama `escudoCapaHTML()` (`5p`) e `escudoApagarHTML()` (`5n`).
- `renderBoard()` (em `4b`) desenha as portas e passagens com `renderPortas()` e `renderPassagens()` (`5t`), segura o redesenho enquanto um token é arrastado e agenda `agendarSyncFotoNpc()` (`5s`).

Alguns módulos ainda **estendem** uma função de outro arquivo, guardando a original e trocando por uma versão
que faz algo a mais:

```js
{
  const _bs = bindSheet;      // guarda a original
  bindSheet = function () {
    _bs();                    // roda a original
    /* ...e faz algo a mais */
  };
}
```

Funciona porque as funções são globais. Se uma função parece fazer mais do que o código dela mostra, procure
por `= nomeDaFuncao;` na pasta `src/`. Estas são as extensões que ainda existem:

| Função original | Estendida em |
| --- | --- |
| `sheetHTML`, `bindSheet` (ficha) | `5k-npcs`, `5m-solo`, `5n-gestao`, `5q-sobrevivente` |
| `derivados` (PV, PE, SAN, Defesa) | `5k-npcs` (ficha rápida), `5q-sobrevivente` (estágios) |
| `bindAgentes` | `5m-solo`, `5n-gestao` |
| `fichaPath`, `logEntry`, `renderPanel` | `5m-solo` (personagem sem mesa) |
| `npcSecaoHTML`, `npcCard`, `bindNpcSecao` | `5l-criaturas` |
| `bindCombate`, `tokUrl` | `5l-criaturas` (e `tokUrl` também em `5s`) |
| Funções do criador de mapas (`meDrawNow`, `meBind`, `meSetTool`...) | `5o-locais` |
| `hiddenAt`, `renderFog`, `renderNomes`, `renderMapTools` | `5o-locais` (e `renderNomes` também em `5s`) |
| `showLobby` | `5p-capa` |
| `regrasHTML` | `5q-sobrevivente` |

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
| `usuarios/<uid>/...` | Minhas mesas, Meus personagens | Só a própria pessoa |
