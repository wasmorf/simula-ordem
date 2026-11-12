#!/bin/sh
# Monta o index.html juntando as partes de src/ na ordem de src/ordem.txt.
# Uso: sh build.sh
set -e
cd "$(dirname "$0")"
arquivos() { grep -v '^\s*#' src/ordem.txt | grep "\.$1\$"; }
for f in $(grep -v '^\s*#' src/ordem.txt | grep .); do
  [ -f "src/$f" ] || { echo "Falta o arquivo src/$f (listado em src/ordem.txt)"; exit 1; }
done
{
  cat src/pagina/cabecalho.html
  echo "    <style>"
  for f in $(arquivos css); do cat "src/$f"; done
  echo "    </style>"
  echo "  </head>"
  echo "  <body>"
  cat src/pagina/corpo.html
  for f in $(arquivos js); do
    echo "<script>"
    cat "src/$f"
    echo "</script>"
  done
  echo "  </body>"
  echo "</html>"
} > index.html
# carimba a versão (o site avisa "nova versão" quando ela muda)
V=$(TZ=America/Sao_Paulo date +"%d/%m %Hh%M%S")
sed -i "s#const VERSAO_SITE=\"[^\"]*\";#const VERSAO_SITE=\"$V\";#" index.html
echo "index.html montado ($(grep -v '^\s*#' src/ordem.txt | grep -c .) arquivos, versão $V)"
