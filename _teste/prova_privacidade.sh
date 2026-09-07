#!/bin/sh
# Prova que a conferencia de privacidade REPROVA quando tem que reprovar.
#
# Existe porque as duas travas de privacidade ja passaram meses imprimindo "ok"
# sem olhar arquivo nenhum: elas liam a arvore suja, e o portao roda com a
# branch ja comitada, quando a arvore esta limpa por construcao. Trava que so
# sabe passar nao e trava.
#
# Nao usa o nome real do aluno em lugar nenhum: monta uma lista de nomes falsa
# numa pasta temporaria e aponta a conferencia para ela por ALUNO_SENSIVEL.
# Assim a prova roda em qualquer maquina, inclusive numa que nao tenha a lista
# de verdade, e nunca escreve o nome real em disco.
#
#   sh _teste/prova_privacidade.sh
cd "$(dirname "$0")/.."

passaram=0
falharam=0
conf() { # rotulo, obtido, esperado
  if [ "$2" = "$3" ]; then
    passaram=$((passaram + 1)); printf '  OK     %s\n' "$1"
  else
    falharam=$((falharam + 1)); printf '  FALHA  %s  [obtido: %s | esperado: %s]\n' "$1" "$2" "$3"
  fi
}

tmp=$(mktemp -d 2>/dev/null || echo "${TMPDIR:-/tmp}/prova_priv_$$")
mkdir -p "$tmp"

# O NOME FALSO E MONTADO EM PEDACOS, e nao escrito inteiro aqui.
#
# Escrito inteiro, esta prova acusa a si mesma: ela e um arquivo do commit, a
# conferencia varre os arquivos do commit, e o caso 1 (arvore limpa tem que
# passar) reprovava apontando para a propria prova. Aconteceu na primeira
# execucao. E o mesmo motivo pelo qual o nome de verdade nunca aparece escrito
# no confere_privacidade.sh.
NOME_FALSO="$(printf 'Zora')$(printf 'ide')"
printf '%s\n' "$NOME_FALSO" > "$tmp/lista"

# Tudo que a prova cria dentro do repositorio sai daqui, aconteca o que
# acontecer. Uma prova de privacidade que deixa lixo para tras seria a piada
# pronta: foi exatamente assim que uma copia do repo com o nome do aluno ficou
# esquecida em _teste/sim_real e disparou esta mesma trava na rodada seguinte.
sujeira=""
limpa() {
  for x in $sujeira; do rm -rf "$x"; done
  rm -rf "$tmp"
}
trap limpa EXIT INT TERM

roda() { ALUNO_SENSIVEL="$tmp/lista" sh _teste/confere_privacidade.sh 2>&1; }
codigo_de() { ALUNO_SENSIVEL="$tmp/lista" sh _teste/confere_privacidade.sh >/dev/null 2>&1; echo $?; }

printf '\n=== 1. arvore limpa: as duas conferencias tem que passar ===\n'
saida=$(roda)
conf "passa por nome"     "$(printf '%s\n' "$saida" | grep -c 'ok      nenhum arquivo identificavel')" "1"
conf "passa por conteudo" "$(printf '%s\n' "$saida" | grep -c 'ok      nenhum arquivo do commit cita')" "1"
conf "codigo de saida"    "$(codigo_de)" "0"

printf '\n=== 2. nome dentro de arquivo novo: tem que REPROVAR ===\n'
alvo="figuras/_prova_privacidade_tmp.js"
sujeira="$sujeira $alvo"
printf '/* comentario com %s no meio, como ja aconteceu de verdade */\n' "$NOME_FALSO" > "$alvo"
saida=$(roda)
conf "acusa por conteudo"      "$(printf '%s\n' "$saida" | grep -c 'FALHOU  nome do aluno DENTRO')" "1"
conf "e nomeia o arquivo"      "$(printf '%s\n' "$saida" | grep -c "$alvo")" "1"
conf "codigo de saida reprova" "$(codigo_de)" "1"
rm -f "$alvo"; sujeira=""

printf '\n=== 3. nome no NOME do arquivo: tem que REPROVAR ===\n'
alvo="figuras/_${NOME_FALSO}_tmp.js"
sujeira="$sujeira $alvo"
printf '/* sem nome nenhum por dentro */\n' > "$alvo"
saida=$(roda)
conf "acusa por nome de arquivo" "$(printf '%s\n' "$saida" | grep -c 'FALHOU  1 arquivo(s) de aluno')" "1"
conf "codigo de saida reprova"   "$(codigo_de)" "1"
rm -f "$alvo"; sujeira=""

printf '\n=== 4. a linha aprovada continua liberada ===\n'
# Mesma forma da lista de alunos-semente do app.js, que e publica e aprovada.
alvo="figuras/_prova_aprovada_tmp.js"
sujeira="$sujeira $alvo"
printf "    { nome: '%s', horasJulho: 2, nota: '' },\n" "$NOME_FALSO" > "$alvo"
saida=$(roda)
conf "arquivo novo NAO e isento so por ter a forma" \
  "$(printf '%s\n' "$saida" | grep -c 'FALHOU  nome do aluno DENTRO')" "1"
rm -f "$alvo"; sujeira=""

printf '\n=== 5. sem a lista de nomes: instavel, nunca ok silencioso ===\n'
rm -f "$tmp/lista"
saida=$(roda)
conf "avisa que pulou"     "$(printf '%s\n' "$saida" | grep -c 'INSTAVEL conferencia de conteudo pulada')" "1"
conf "codigo de instavel"  "$(codigo_de)" "2"
printf '%s\n' "$NOME_FALSO" > "$tmp/lista"

printf '\n%d passaram, %d falharam.\n' "$passaram" "$falharam"
[ "$falharam" = "0" ] && printf 'A conferencia de privacidade sabe reprovar.\n'
[ "$falharam" = "0" ] || exit 1
exit 0
