#!/bin/sh
# Roda um teste e imprime "OK nome" ou "FALHOU nome". Usado pelo rodar.sh (vários ao mesmo tempo).
# Uso: OUT=testes/saida sh testes/um-teste.sh testes/<nome>.py
n=$(basename "$1" .py)
timeout 300 python3 "$1" "$OUT/fotos" > "$OUT/$n.txt" 2>&1
rc=$?
# falhou se o teste quebrou ou se a página teve erro de JavaScript (ERRS [...] com algo dentro)
if [ $rc -ne 0 ] || grep -qE "ERRS \[.+\]|Traceback|^FALHOU" "$OUT/$n.txt"; then
  echo "FALHOU  $n"
else
  echo "OK      $n"
fi
