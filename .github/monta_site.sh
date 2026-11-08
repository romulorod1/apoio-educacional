#!/bin/sh
# Monta em _site/ o que o Cloudflare Pages publica (B4).
#
#   sh .github/monta_site.sh [pasta]     padrao: _site
#
# Sai do `git ls-files`, e nao da pasta: nada que nao esta no commit (perfil de
# Chrome esquecido, node_modules, rascunho) sobe. E fica de fora o que so serve a
# quem trabalha no repositorio, que o GitHub Pages publicava junto: as provas
# (_teste/), os geradores da biblioteca (biblioteca/), os workflows (.github/),
# o README e todo caminho com um pedaco que comeca por "_" ou ponto
# (banco/topicos/_ids.json, rascunhos). Sem as paginas de _teste/ na origem, nenhuma
# delas roda ao lado do IndexedDB das criancas.
#
# O que o aplicativo pede tem que estar aqui: a prova e o
# _teste/testa_publica_cloudflare.js, que confere toda entrada do ARQUIVOS do
# sw.js e os assuntos do banco/topicos dentro da pasta montada.
set -e
cd "$(dirname "$0")/.."
destino="${1:-_site}"
rm -rf "$destino"
mkdir -p "$destino"
git ls-files -z | tr '\0' '\n' | while IFS= read -r f; do
  case "$f" in
    _teste/*|biblioteca/*|.github/*|README.md|*.md|*.py|*.sh) continue ;;
    _*|*/_*|.*|*/.*) continue ;;
  esac
  mkdir -p "$destino/$(dirname "$f")"
  cp "$f" "$destino/$f"
done
printf 'site montado em %s: %s arquivos\n' "$destino" "$(find "$destino" -type f | wc -l | tr -d ' ')"
