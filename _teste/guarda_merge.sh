#!/bin/sh
# O guarda de merge no CI (item 13c da FILA): refaz as conferencias do
# merge_seguro (bateria inteira verde na cabeca, revisao adversarial no sha7,
# CACHE e VERSAO maiores que os da main, ramo em dia quando e risco) e publica o
# veredito como STATUS de commit, de contexto portao-merge, na cabeca que ele
# julgou. E esse status que a protecao da main pode exigir, fechando o botao de
# merge do GitHub para o que o merge_seguro recusaria.
#
# Por que status, e nao o proprio check do job: no issue_comment e no
# workflow_run o job roda no commit da main, e o check dele cairia na main, nao
# no PR. O status vai para o sha que se escolhe.
#
# Entradas (ambiente):
#   REPO_MERGE_SEGURO  dono/repositorio
#   PR_NUM             numero do PR, quando o evento o traz
#   SHA_DO_EVENTO      cabeca do workflow_run, para achar o PR quando o numero nao vem
#   URL_DA_RODADA      link desta rodada, para o status
#   GH, GIT            a costura das provas: terminado em .js roda pelo node
#
# Saida: 0 publicou (ou nao havia o que publicar, com o motivo dito); 1 nao
# conseguiu publicar. Recusa do merge_seguro NAO e erro do job: e um status
# failure publicado.
set -u
cd "$(dirname "$0")/.."
REPO="${REPO_MERGE_SEGURO:-romulorod1/apoio-educacional}"
GH="${GH:-gh}"
gh_() { case "$GH" in *.js) node "$GH" "$@" ;; *) "$GH" "$@" ;; esac; }

numero="${PR_NUM:-}"
if [ -z "$numero" ] && [ -n "${SHA_DO_EVENTO:-}" ]; then
  numero=$(gh_ pr list -R "$REPO" --state open --search "${SHA_DO_EVENTO}" --json number,headRefOid \
    --jq "[.[] | select(.headRefOid == \"${SHA_DO_EVENTO}\")][0].number // empty" 2>/dev/null || true)
fi
if [ -z "$numero" ]; then
  printf 'nada a julgar: o evento nao traz PR aberto (sha %s)\n' "${SHA_DO_EVENTO:-nenhum}"
  exit 0
fi

saida=$(node _teste/merge_seguro.js "$numero" --guarda 2>&1) && codigo=0 || codigo=$?
printf '%s\n' "$saida"
cabeca=$(printf '%s\n' "$saida" | sed -n 's/^cabeca *\([0-9a-f]\{40\}\)$/\1/p' | head -1)
if [ -z "$cabeca" ]; then
  printf 'nao publico: o merge_seguro nao chegou a ler a cabeca do PR #%s\n' "$numero"
  exit 1
fi
# A cabeca andou enquanto ele julgava: o veredito e de um commit que ja nao e a
# cabeca, e o push novo dispara outra rodada, que decide.
agora=$(gh_ pr view "$numero" -R "$REPO" --json headRefOid --jq .headRefOid 2>/dev/null || true)
if [ "$agora" != "$cabeca" ]; then
  printf 'nao publico: a cabeca do PR #%s mudou de %s para %s durante a conferencia\n' "$numero" "$cabeca" "${agora:-?}"
  exit 0
fi
if [ "$codigo" = "0" ]; then
  estado=success
  descricao="cumpre o processo no commit $(printf '%s' "$cabeca" | cut -c1-7)"
else
  estado=failure
  # O primeiro motivo da recusa, que e o que se conserta primeiro.
  descricao=$(printf '%s\n' "$saida" | sed -n 's/^  - //p; s/^RECUSADO  \(.\{1,\}[^:]\)$/\1/p' | head -1)
  [ -n "$descricao" ] || descricao="o merge_seguro recusou (veja a rodada)"
fi
# O GitHub corta a descricao em 140 caracteres; cortado aqui, sem quebrar acento.
descricao=$(printf '%s' "$descricao" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const a=Array.from(s);process.stdout.write(a.length>140?a.slice(0,139).join('')+'.':s)})")
if ! gh_ api -X POST "repos/$REPO/statuses/$cabeca" -f state="$estado" -f context=portao-merge \
    -f description="$descricao" -f target_url="${URL_DA_RODADA:-}" > /dev/null; then
  printf 'FALHOU   nao consegui publicar o status portao-merge em %s\n' "$cabeca"
  exit 1
fi
printf 'publicado portao-merge=%s em %s: %s\n' "$estado" "$cabeca" "$descricao"
exit 0
