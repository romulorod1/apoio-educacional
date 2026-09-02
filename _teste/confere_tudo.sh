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
instavel=0
titulo() { printf '\n=== %s ===\n' "$1"; }

# Quantas verificacoes falharam na saida de um teste (vazio = nenhuma).
quantas_falhas() {
  printf '%s\n' "$1" | grep -oE "[0-9]+ falharam" | grep -oE "^[0-9]+" | tail -1
}
resumo() {
  printf '%s\n' "$1" | grep -E "passaram|PASSARAM|CONFIRMAD" | tail -1
}

# Roda um teste. Se falhar, roda UMA segunda vez antes de reprovar.
#
# Os testes de navegador esperam por tempo fixo depois de recarregar a pagina
# (2000, 1500 e 3000 ms). Com a maquina ocupada essas esperas nao bastam e o
# teste falha sem haver defeito: o testa_atualizacao reprovou com 2 falhas
# enquanto rodavam outros processos e passou com 32 de 32 sozinho, logo em
# seguida. Alarme falso no portao de merge e pior do que parece, porque ensina a
# ignorar alarme, e foi ignorando conferencia que uma regressao de tabela ja
# subiu para producao.
#
# Repetir NAO esconde defeito: quem falha duas vezes reprova igual. O que passa
# na segunda sai marcado como INSTAVEL, aparece no resumo do fim e continua
# pedindo olho humano, em vez de sumir como se nada tivesse acontecido.
# Um teste so passa se ele DISSER que passou. Ausencia de falha nao e aprovacao:
# um teste que morre no require nao imprime "N falharam" nenhum, e a versao
# anterior desta funcao marcava isso como ok. Aconteceu de verdade: rodando a
# suite numa copia do repo sem as dependencias, o testa_temas morria no
# puppeteer-core e o portao dizia "TUDO PASSOU. Pode seguir para o merge."
passou_de_verdade() {
  printf '%s\n' "$1" | grep -qE "passaram|PASSARAM|CONFIRMAD"
}
roda() {
  nome="$1"; shift
  saida=$("$@" 2>&1) || true
  n=$(quantas_falhas "$saida")
  ruim=0
  [ -n "$n" ] && [ "$n" != "0" ] && ruim=1
  passou_de_verdade "$saida" || ruim=1

  if [ "$ruim" = "0" ]; then
    printf '  ok      %-24s %s\n' "$nome" "$(resumo "$saida")"
    return
  fi

  # Falhou. Roda UMA segunda vez antes de reprovar, porque os testes de navegador
  # esperam por tempo fixo depois de recarregar a pagina (2000, 1500 e 3000 ms) e
  # com a maquina ocupada essas esperas nao bastam: o testa_atualizacao reprovou
  # com 2 falhas e passou com 32 de 32 sozinho um minuto depois. Alarme falso em
  # portao de merge ensina a ignorar alarme, e foi ignorando conferencia que uma
  # regressao de tabela ja subiu para producao aqui.
  #
  # Repetir NAO esconde defeito: quem falha duas vezes reprova igual.
  saida2=$("$@" 2>&1) || true
  n2=$(quantas_falhas "$saida2")
  ruim2=0
  [ -n "$n2" ] && [ "$n2" != "0" ] && ruim2=1
  passou_de_verdade "$saida2" || ruim2=1

  if [ "$ruim2" = "1" ]; then
    if passou_de_verdade "$saida2"; then
      printf '  FALHOU  %-24s %s\n' "$nome" "$(resumo "$saida2")"
    else
      printf '  FALHOU  %-24s nao chegou a rodar: %s\n' "$nome" \
        "$(printf '%s\n' "$saida2" | grep -iE "error|cannot find|not found" | head -1 | cut -c1-90)"
    fi
    falhou=1
  else
    printf '  INSTAVEL %-23s passou na segunda vez\n' "$nome"
    instavel=1
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
# O primeiro nome do aluno da prova adaptada NAO aparece escrito neste script:
# senao o portao acusa a si mesmo. Ele e lido de um arquivo fora do repositorio,
# e as duas conferencias abaixo (por nome de arquivo e por conteudo) usam o
# mesmo valor.
nome_lista="$HOME/.claude/projects/C--Users-romul/memory/.aluno-sensivel"
padrao=""
[ -f "$nome_lista" ] && padrao=$(cat "$nome_lista")
# Pelo NOME do arquivo.
if [ -n "$padrao" ]; then
  sujo=$(git status --short | grep -icE "experimento|$padrao|_antes|pdf_antes" || true)
else
  sujo=$(git status --short | grep -icE "experimento|_antes|pdf_antes" || true)
fi
if [ "$sujo" = "0" ]; then
  printf '  ok      nenhum arquivo identificavel entra no commit\n'
else
  printf '  FALHOU  %s arquivo(s) de aluno apareceriam no commit\n' "$sujo"
  falhou=1
fi
# E pelo CONTEUDO. O primeiro nome do aluno da prova adaptada apareceu num
# comentario do figuras/base.js, num arquivo prestes a ir para o repositorio
# publico, e a conferencia acima nao viu porque so olha nome de arquivo.
#
# A unica ocorrencia permitida e a linha dele na lista ALUNOS_INICIAIS do
# app.js (alunos-semente so com primeiro nome, aprovados para o repositorio e
# ja publicados). O nome nao aparece escrito neste script de proposito: senao
# o portao acusa a si mesmo. Ele e lido de um arquivo fora do repositorio.
nome_lista="$HOME/.claude/projects/C--Users-romul/memory/.aluno-sensivel"
if [ -f "$nome_lista" ]; then
  padrao=$(cat "$nome_lista")
  dentro=""
  for f in $(git ls-files -mo --exclude-standard 2>/dev/null | grep -vE "^_teste/node_modules"); do
    [ -f "$f" ] || continue
    n=$(grep -i "$padrao" "$f" 2>/dev/null | grep -vc "nome: '[A-Z][a-z]*', horasJulho" || true)
    [ "$n" != "0" ] && dentro="$dentro $f"
  done
  if [ -z "$dentro" ]; then
    printf '  ok      nenhum arquivo do commit cita o aluno por dentro\n'
  else
    printf '  FALHOU  nome do aluno DENTRO de arquivo que entraria no commit:%s\n' "$dentro"
    falhou=1
  fi
else
  printf '  INSTAVEL conferencia de conteudo pulada: falta %s\n' "$nome_lista"
  instavel=1
fi

printf '\n'
if [ "$falhou" != "0" ]; then
  printf 'HA FALHA. Nao faca o merge antes de resolver.\n'
elif [ "$instavel" != "0" ]; then
  printf 'TUDO PASSOU, mas algum teste so passou na segunda vez (INSTAVEL acima).\n'
  printf 'Nao e impedimento de merge; e aviso de que aquele teste depende de tempo.\n'
else
  printf 'TUDO PASSOU. Pode seguir para o merge.\n'
fi
exit "$falhou"
