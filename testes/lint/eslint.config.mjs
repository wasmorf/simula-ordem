// Regras do lint (sh testes/lint.sh). O site roda tudo no escopo global, então o lint olha o
// index.html montado inteiro, e o lint.sh traduz cada aviso de volta para o arquivo de src/.
import fs from "fs";
const navegador = JSON.parse(fs.readFileSync(new URL("./navegador.json", import.meta.url)));
export default [
  {
    files: ["*.js"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "script",
      globals: { ...navegador, firebase: "readonly", YT: "readonly" }
    },
    rules: {
      "no-undef": "error",
      // ignoreRestSiblings: "const { foto, ...resto } = f" é o jeito de tirar um campo da cópia
      "no-unused-vars": ["warn", { vars: "all", args: "none", caughtErrors: "none", ignoreRestSiblings: true }],
      "no-redeclare": "error",
      "no-dupe-keys": "error",
      "no-unreachable": "warn",
      "no-func-assign": "error",
      "no-const-assign": "error",
      "no-dupe-else-if": "error",
      "no-self-assign": "warn"
    }
  }
];
