#!/bin/sh
# Nada de aluno no commit: por NOME de arquivo e por CONTEUDO.
#
# Vive num arquivo proprio, e nao dentro do confere_tudo.sh, por um motivo so:
# para poder ser PROVADO. Enquanto estava embutido no portao, a unica forma de
# exercitar esta trava era rodar os quinze minutos da bateria inteira, e trava
# que ninguem consegue exercitar e trava que ninguem descobre estar vazia. A
# prova dos dois sentidos vive em _teste/prova_privacidade.sh.
#
#   sh _teste/confere_privacidade.sh
#
# Saida: 0 passou, 1 reprovou, 2 instavel (falta a lista de nomes).
cd "$(dirname "$0")/.."

falhou=0
instavel=0

# O primeiro nome do aluno da prova adaptada NAO aparece escrito neste script:
# senao o portao acusa a si mesmo. Ele e lido de um arquivo fora do repositorio,
# e as duas conferencias abaixo (por nome de arquivo e por conteudo) usam o
# mesmo valor.
nome_lista="${ALUNO_SENSIVEL:-$HOME/.claude/projects/C--Users-romul/memory/.aluno-sensivel}"
padrao=""
[ -f "$nome_lista" ] && padrao=$(cat "$nome_lista")

# O QUE ENTRA NO COMMIT, e nao o que esta sujo na arvore.
#
# As duas conferencias liam `git status` e `git ls-files -mo`, que so enxergam
# arquivo modificado ou nao rastreado. O portao roda com a branch JA COMITADA,
# quando a arvore esta limpa por construcao: as duas listas voltavam vazias e as
# duas conferencias imprimiam ok sem ter olhado arquivo nenhum. E a terceira vez
# que esta mesma armadilha aparece neste portao, sempre pelo mesmo motivo:
# conferencia escrita olhando a arvore suja de quem a escreveu, e nao o estado em
# que ela vai rodar.
#
# A lista certa e a uniao do que a branch mudou desde a base do merge com o que
# ainda esta solto na arvore, para valer nos dois momentos.
base=$(git merge-base HEAD origin/main 2>/dev/null || git rev-parse --verify -q main 2>/dev/null || true)
if [ -n "$base" ]; then
  arquivos=$( { git diff --name-only "$base"...HEAD 2>/dev/null;
                git ls-files -mo --exclude-standard 2>/dev/null; } \
              | grep -vE "^_teste/node_modules" | sort -u)
else
  arquivos=$(git ls-files -mo --exclude-standard 2>/dev/null | grep -vE "^_teste/node_modules" | sort -u)
fi

# ---------------------------------------------------------------- pelo NOME
if [ -n "$padrao" ]; then
  sujo=$(printf '%s\n' "$arquivos" | grep -icE "experimento|$padrao|_antes|pdf_antes" || true)
else
  sujo=$(printf '%s\n' "$arquivos" | grep -icE "experimento|_antes|pdf_antes" || true)
fi
if [ "$sujo" = "0" ]; then
  printf '  ok      nenhum arquivo identificavel entra no commit\n'
else
  printf '  FALHOU  %s arquivo(s) de aluno apareceriam no commit\n' "$sujo"
  falhou=1
fi

# ---------------------------------------------------------------- pelo CONTEUDO
# O primeiro nome do aluno da prova adaptada apareceu num comentario do
# figuras/base.js, num arquivo prestes a ir para o repositorio publico, e a
# conferencia acima nao viu porque so olha nome de arquivo.
if [ -f "$nome_lista" ]; then
  # AS OCORRENCIAS APROVADAS SAO TRES, e nao uma.
  #
  # A isencao antiga liberava so a linha da lista ALUNOS_INICIAIS do app.js. Mas
  # o mesmo primeiro nome ja vive, aprovado e publicado, em outros dois lugares
  # da mesma natureza: a frase do README que descreve os alunos-semente e a
  # tabela de dados dos prints. Nenhum dos dois era isento, entao o dia em que
  # alguem editasse qualquer um deles o portao acusaria vazamento onde nao ha.
  #
  # A isencao e pela LINHA, e nao pelo arquivo: uma frase nova sobre o mesmo
  # aluno noutro ponto do mesmo arquivo continua reprovando. Se alguem reescrever
  # uma dessas linhas, o padrao deixa de casar e o portao reprova: alarme falso e
  # o lado seguro de errar aqui.
  linha_aprovada_de() {
    case "$1" in
      app.js)                  printf "nome: '[A-Z][a-z]*', horasJulho" ;;
      README.md)               printf 'Junho do Marcelo' ;;
      _teste/_prints_dados.js) printf "nome: '[A-Z][a-z]*', *cor: '#" ;;
      *)                       printf '' ;;
    esac
  }

  dentro=""
  for f in $arquivos; do
    [ -f "$f" ] || continue
    achadas=$(grep -i "$padrao" "$f" 2>/dev/null || true)
    [ -n "$achadas" ] || continue
    livre=$(linha_aprovada_de "$f")
    if [ -n "$livre" ]; then
      achadas=$(printf '%s\n' "$achadas" | grep -vE "$livre" || true)
    fi
    [ -n "$achadas" ] && dentro="$dentro $f"
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

[ "$falhou" != "0" ] && exit 1
[ "$instavel" != "0" ] && exit 2
exit 0
