#!/bin/sh
# Lint do site: sh testes/lint.sh (na pasta do projeto). Precisa do ESLint (npm i -g eslint).
# Monta o index.html, junta os <script> num arquivo só (o site é todo global) e mostra cada
# aviso no arquivo de src/ de onde ele veio. Erro faz o comando sair com código 1.
cd "$(dirname "$0")/.."
sh build.sh >/dev/null || exit 1
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
cp testes/lint/eslint.config.mjs testes/lint/navegador.json "$T/"
python3 - "$T" <<'PY'
import re, sys, json
T = sys.argv[1]
ordem = [l.strip() for l in open("src/ordem.txt") if l.strip() and not l.strip().startswith("#") and l.strip().endswith(".js")]
html = open("index.html").read()
blocos = re.findall(r"<script>\n([\s\S]*?)</script>", html)
if len(blocos) != len(ordem):
    sys.exit("lint: o index.html não bate com src/ordem.txt")
mapa, linha = [], 1
for f, b in zip(ordem, blocos):
    mapa.append((linha, f))
    linha += b.count("\n")
open(T + "/site.js", "w").write("".join(blocos))
json.dump(mapa, open(T + "/mapa.json", "w"))
PY
( cd "$T" && eslint -c eslint.config.mjs -f json site.js > saida.json ) 
python3 - "$T" <<'PY'
import json, sys
T = sys.argv[1]
mapa = json.load(open(T + "/mapa.json"))
r = json.load(open(T + "/saida.json"))[0]["messages"]
erros = 0
for m in r:
    ini, f = max((x for x in mapa if x[0] <= m["line"]), key=lambda x: x[0])
    tipo = "erro" if m["severity"] == 2 else "aviso"
    erros += m["severity"] == 2
    print(f"src/{f}:{m['line'] - ini + 1}  {tipo}  {m['message']}")
print(f"\n{len(r)} problema(s): {erros} erro(s), {len(r) - erros} aviso(s)" if r else "Lint limpo.")
sys.exit(1 if erros else 0)
PY
