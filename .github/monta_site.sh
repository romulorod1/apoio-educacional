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
# Sem um 404.html na raiz, o Cloudflare Pages trata o site como aplicacao de
# pagina unica e responde 200 com o index.html para QUALQUER caminho que nao
# existe (medido no preview do B4: _teste/confere_tudo.sh voltava 200). Ai um
# arquivo esquecido no ARQUIVOS entraria no cache do worker como index.html,
# calado, e a conferencia-no-ar leria 200. Com ele, caminho que nao existe e 404.
printf '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Apoio Educacional</title><p>Endereço não encontrado. <a href="./">Abrir o aplicativo</a></p></html>\n' > "$destino/404.html"
printf 'site montado em %s: %s arquivos\n' "$destino" "$(find "$destino" -type f | wc -l | tr -d ' ')"
