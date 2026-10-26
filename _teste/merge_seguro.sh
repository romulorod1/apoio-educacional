#!/bin/sh
# Merge na main so com o processo cumprido. A regra inteira esta escrita no
# cabecalho de _teste/merge_seguro.js, e a prova dela em
# _teste/testa_merge_seguro.js.
#
#   sh _teste/merge_seguro.sh 74            confere e faz o merge
#   sh _teste/merge_seguro.sh 74 --conferir so confere
exec node "$(dirname "$0")/merge_seguro.js" "$@"
