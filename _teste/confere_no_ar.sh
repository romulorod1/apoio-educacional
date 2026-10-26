#!/bin/sh
# O site publicado bate com a arvore deste checkout?
#
#   sh _teste/confere_no_ar.sh https://romulorod1.github.io/apoio-educacional [segundos]
#
# Compara o sha256 de sw.js, app.js e index.html servidos com os do disco, ate
# todos baterem ou o prazo acabar (padrao 900 s). Cada pedido leva um parametro
# novo na URL, para nao ler uma copia de cache do caminho. Imprime a VERSAO do
# app.js e o nome do cache do sw.js que estao no ar, que e o que se confere a
# olho numa release.
#
# Saida: 0 bateu, 1 nao bateu no prazo. Nunca sai 0 sem ter lido os tres
# arquivos do ar: pedido que falha conta como "ainda nao", e nao como igual.
cd "$(dirname "$0")/.."

site="${1:?uso: confere_no_ar.sh URL [segundos]}"
prazo="${2:-900}"
arquivos="sw.js app.js index.html"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

versao_de() { sed -n "s/^ *var VERSAO = '\([^']*\)'.*/\1/p" "$1" | head -1; }
cache_de()  { sed -n "s/^var CACHE = '\([^']*\)'.*/\1/p" "$1" | head -1; }
# Sem o CR: no Windows o checkout pode ter CRLF e o ar tem LF. Sem isto, a
# conferencia rodada a mao numa maquina Windows reprova o site que esta certo.
hash_de()   { tr -d '\r' < "$1" | sha256sum | cut -d' ' -f1; }

printf 'esperado: VERSAO %s, cache %s\n' "$(versao_de app.js)" "$(cache_de sw.js)"
[ -n "$(versao_de app.js)" ] && [ -n "$(cache_de sw.js)" ] || {
  printf 'FALHOU  nao consegui ler VERSAO no app.js ou CACHE no sw.js deste checkout\n'
  exit 1
}

inicio=$(date +%s)
rodada=0
while :; do
  rodada=$((rodada + 1))
  diferentes=""
  for f in $arquivos; do
    if curl -fsS -m 30 -H 'Cache-Control: no-cache' \
         -o "$tmp/$f" "$site/$f?conferencia=$(date +%s)$rodada" 2>"$tmp/erro"; then
      [ "$(hash_de "$tmp/$f")" = "$(hash_de "$f")" ] || diferentes="$diferentes $f"
    else
      diferentes="$diferentes $f(sem resposta: $(head -c 120 "$tmp/erro"))"
    fi
  done
  passou=$(( $(date +%s) - inicio ))
  if [ -z "$diferentes" ]; then
    printf 'ok      no ar em %s s: VERSAO %s, cache %s; sw.js, app.js e index.html iguais ao commit\n' \
      "$passou" "$(versao_de "$tmp/app.js")" "$(cache_de "$tmp/sw.js")"
    exit 0
  fi
  if [ "$passou" -ge "$prazo" ]; then
    printf 'FALHOU  depois de %s s o ar ainda difere do commit:%s\n' "$passou" "$diferentes"
    [ -f "$tmp/app.js" ] && printf '        no ar: VERSAO %s, cache %s\n' \
      "$(versao_de "$tmp/app.js")" "$(cache_de "$tmp/sw.js" 2>/dev/null)"
    exit 1
  fi
  printf '  ainda nao (%s s):%s\n' "$passou" "$diferentes"
  sleep 20
done
