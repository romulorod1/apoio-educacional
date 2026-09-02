#!/bin/sh
# Roda tudo que precisa passar antes de um merge para a main.
#
# Existe porque a conferencia estava espalhada em quinze comandos e era facil
# esquecer um. Sai com codigo diferente de zero se qualquer coisa falhar, entao
# serve tanto para olhar quanto para travar.
#
#   sh _teste/confere_tudo.sh
set -e
cd "$(dirname "$0")/.."

falhou=0
titulo() { printf '\n=== %s ===\n' "$1"; }
roda() {
  nome="$1"; shift
  saida=$("$@" 2>&1) || true
  linha=$(printf '%s\n' "$saida" | grep -E "passaram|PASSARAM|CONFIRMAD" | tail -1)
  ruim=$(printf '%s\n' "$saida" | grep -cE "FALHA|falharam\.$|REPROVADO" || true)
  n=$(printf '%s\n' "$saida" | grep -oE "[0-9]+ falharam" | grep -oE "^[0-9]+" | tail -1)
  if [ -n "$n" ] && [ "$n" != "0" ]; then
    printf '  FALHOU  %-24s %s\n' "$nome" "$linha"
    falhou=1
  else
    printf '  ok      %-24s %s\n' "$nome" "$linha"
  fi
}

titulo "banco de temas"
saida=$(python temas/_ferramentas/verificar.py 2>&1) || true
rep=$(printf '%s\n' "$saida" | grep -c "REPROVADO" || true)
ok=$(printf '%s\n' "$saida" | grep -cE "^  ok" || true)
printf '  %s     verificar.py             %s temas ok, %s reprovados\n' \
  "$([ "$rep" = "0" ] && echo 'ok    ' || echo 'FALHOU')" "$ok" "$rep"
[ "$rep" = "0" ] || falhou=1

titulo "sem navegador"
roda "notacao"        node _teste/testa_notacao.js
roda "busca (regras)" node _teste/testa_busca_regras.js
roda "material (PDF)" node _teste/testa_material.js

titulo "com navegador"
for t in testa_temas testa_registro testa_busca testa_mapa_e2e testa_mapeamento \
         testa_perfil testa_olho testa_atualizacao testa_exclusoes testa_feriados \
         testa_mover testa_retroativo testa_series; do
  roda "$t" node "_teste/$t.js"
done

titulo "nada de aluno no commit"
sujo=$(git status --short | grep -icE "experimento|mateus|_antes|pdf_antes" || true)
if [ "$sujo" = "0" ]; then
  printf '  ok      nenhum arquivo identificavel entra no commit\n'
else
  printf '  FALHOU  %s arquivo(s) de aluno apareceriam no commit\n' "$sujo"
  falhou=1
fi

printf '\n'
if [ "$falhou" = "0" ]; then
  printf 'TUDO PASSOU. Pode seguir para o merge.\n'
else
  printf 'HA FALHA. Nao faca o merge antes de resolver.\n'
fi
exit "$falhou"
