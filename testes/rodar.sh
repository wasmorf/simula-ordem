#!/bin/sh
# Roda todos os testes do site. Uso (na pasta do projeto):  sh testes/rodar.sh
# Precisa de: Python 3 com Playwright e o Google Chrome em /usr/bin/google-chrome.
# Cada teste abre o site em modo de teste (#teste), usa um recurso e imprime o que viu.
# No fim sai um resumo: OK ou FALHOU por teste. Os detalhes ficam em testes/saida/.
cd "$(dirname "$0")/.."
sh build.sh || exit 1
OUT=testes/saida
rm -rf "$OUT" && mkdir -p "$OUT/fotos"
# imagem qualquer para o teste da foto da ficha
python3 -c "from PIL import Image; Image.new('RGB',(400,400),(120,60,160)).save('$OUT/fotos/foto_t.jpg')"
# servidor local só durante os testes
python3 -m http.server 8765 >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT
sleep 1
# vários testes ao mesmo tempo (um Chrome cada): um por núcleo do processador, até 4.
# Para mudar: JUNTOS=1 sh testes/rodar.sh (um de cada vez, como antes)
JUNTOS=${JUNTOS:-$(n=$(nproc 2>/dev/null || echo 2); [ "$n" -gt 4 ] && echo 4 || echo "$n")}
export OUT
inicio=$(date +%s)
ls testes/*.py | xargs -P "$JUNTOS" -n 1 sh testes/um-teste.sh > "$OUT/resumo.txt"
sort -k2 "$OUT/resumo.txt"
falhas=$(grep -c "^FALHOU" "$OUT/resumo.txt")
echo
echo "($JUNTOS teste(s) ao mesmo tempo, $(( ($(date +%s) - inicio) / 60 )) min)"
[ "$falhas" -eq 0 ] && echo "Tudo certo: todos os testes passaram." || echo "$falhas teste(s) falharam. Veja testes/saida/<nome>.txt"
exit "$falhas"
