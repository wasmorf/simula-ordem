# Testes do Simula Ordem

Cada arquivo `.py` abre o site num navegador de verdade (em modo de teste, sem Firebase), usa um recurso
como um mestre ou jogador usaria e imprime o que viu. Se a página der erro de JavaScript, o teste falha.

```sh
sh testes/rodar.sh
```

O comando monta o `index.html`, liga um servidor local, roda todos os testes e mostra `OK` ou `FALHOU`
para cada um. A saída de cada teste e as fotos de tela ficam em `testes/saida/` (essa pasta não vai para
o GitHub).

Precisa de Python 3 com `playwright` e `Pillow`, e do Google Chrome em `/usr/bin/google-chrome`.

| Teste | O que confere |
| --- | --- |
| `aviso-versao-nova` | O aviso "Saiu uma versão nova do site" |
| `backup` | Baixar e restaurar fichas e mesa |
| `baixar-todos-personagens` | Meus personagens: Baixar todos e importar de volta substituindo, com a arte |
| `classe-origem-trilha` | Classe e origem livres só na criação, trilha escolhida uma vez; aviso do que a troca muda |
| `combate` | Painel de combate sem erros |
| `copiar-cena` | Copiar cena e mapa para outra mesa do mesmo mestre |
| `edicao-ao-mesmo-tempo` | Mestre e jogador mexendo na mesma ficha juntos: nenhum apaga o outro |
| `dar-ficha` | Dar uma ficha a um jogador e tirar; o token acompanha |
| `documentos-no-mapa` | Pôr documento no mapa, ler, arrastar e tirar |
| `documentos-na-mesa` | Papéis no mapa: girados, por cima um do outro, carimbo, caneta, controles só do mestre |
| `documentos-passar` | Jogador passa documento adiante; mestre recolhe |
| `documentos-renomear` | Renomear documento da biblioteca |
| `documentos-tarjas-mural` | Estilos de tarja, áudio, grifos, anotações e mural de pistas |
| `escudo-e-botoes` | Botões do lobby, do escudo, de agentes e documentos |
| `ficha-do-jogador` | Ficha de jogador: dono, pedir de volta |
| `foto-da-ficha` | Pôr e recortar a foto do agente |
| `foto-npc-no-token` | Jogador vê a foto do NPC no token |
| `layout-no-celular` | Nenhum painel cortado ou vazando no celular |
| `locais-escondidos` | Esconder salas no criador de mapas e revelar na mesa |
| `menus-notas-relatorio` | Menus Opções e Mais, anotações do mestre, Sobrevivente, relatório de erros |
| `meus-personagens` | Personagens fora de mesa: criar, levar e trazer |
| `mover-tokens` | Quem pode mover qual token |
| `mural-no-celular` | Mural de pistas no celular |
| `musicas-livres` | Músicas livres da trilha sonora |
| `npcs` | NPCs: ficha rápida, pastas, duplicar, rolagens |
| `ocultos-para-jogador` | NPCs, criaturas e tokens ocultos não aparecem para o jogador (mapa, Tokens, Combate, registro) |
| `passagens` | Passagens entre cenas (andares) |
| `portas` | Portas que abrem e fecham |
| `portas-trancadas` | Trancar e destrancar portas |
| `rituais-resumo` | Todo ritual tem resumo; aparece no cartão e ao escolher para aprender |
| `dano-bonus-tipo` | Danos extras da arma, vários tipos (ex.: +2 Energia, +1d6 Sangue), na linha e na rolagem; dado aparece fora de mesa |
| `melhorias-ficha-dados` | Poderes que mudam números, barra pela metade, fotos por estado, graus, deslocamento, visual/som do dado, data no registro, bestiário por elemento e criaturas novas (PV a preencher) |
| `artes-em-lote` | Artes do bestiário: várias de uma vez pelo nome do arquivo; o backup leva as artes; mesa nova do mestre já começa com elas |
| `regras-da-ficha` | Travas da ficha (atributos, perícias, poderes, rituais, itens), extras do mestre e subir de NEX |
| `sobrevivente` | Classe Sobrevivente e ameaças dos suplementos |
| `suplementos` | Origens, poderes e rituais dos suplementos |
