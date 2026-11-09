#!/bin/sh
# Merge na main so com o processo cumprido. A regra inteira esta escrita no
# cabecalho de _teste/merge_seguro.js, e a prova dela em
# _teste/testa_merge_seguro.js.
# Antes de tudo ele confere que o proprio merge_seguro.js e o da origin/main
# (git fetch); copia velha ou fetch que falha recusa. Rode de uma pasta em dia.
#
#   sh _teste/merge_seguro.sh 74            confere e faz o merge
#   sh _teste/merge_seguro.sh 74 --conferir so confere
exec node "$(dirname "$0")/merge_seguro.js" "$@"
