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
falhas=0
for t in testes/*.py; do
  n=$(basename "$t" .py)
  timeout 300 python3 "$t" "$OUT/fotos" > "$OUT/$n.txt" 2>&1
  rc=$?
  # falhou se o teste quebrou ou se a página teve erro de JavaScript (ERRS [...] com algo dentro)
  if [ $rc -ne 0 ] || grep -qE "ERRS \[.+\]|Traceback|^FALHOU" "$OUT/$n.txt"; then
    echo "FALHOU  $n"
    falhas=$((falhas + 1))
  else
    echo "OK      $n"
  fi
done
echo
[ $falhas -eq 0 ] && echo "Tudo certo: todos os testes passaram." || echo "$falhas teste(s) falharam. Veja testes/saida/<nome>.txt"
exit $falhas
