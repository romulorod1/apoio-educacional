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
roda "trilha (dados)" node _teste/testa_trilha_dados.js

# As provas do kit de figuras nao rodavam aqui. Duas delas estavam falhando
# desde o commit que as criou, algumas horas antes (_base_prova_travas, 34 de
# 36: ce5d842 as 17:56 e o conserto as 01:42 do dia seguinte, 7h46), e ninguem
# viu, porque so o verificar.py e as suites de _teste entravam no portao.
# Regressao no kit passaria pelo merge. Cada prova imprime "N passaram, M
# falharam"; a _prova_desenho imprime so "avisos: N", e e conferida por esse
# token. Nem todas as provas de figuras/ entram: as que dizem "nenhuma reprova"
# ou "todos os resultados como esperado" o `roda` nao sabe ler, e o
# _audita_receitas_gab reprova hoje (dois arcos rotulados com angulo diferente
# do que varrem, na main tambem). Entram as que imprimem contagem.
titulo "kit de figuras"
roda "fundacao"         node figuras/_prova_fundacao.js
roda "marcas"           node figuras/_prova_marcas.js
roda "receitas"         node figuras/_prova_receitas.js
roda "receitas circ."   node figuras/_prova_receitas_circulo.js
roda "curvas"           node figuras/_prova_desenho_curvas.js
roda "solidos"          node figuras/_prova_solidos.js
roda "travas do base"   node figuras/_base_prova_travas.js
roda "travas de hoje"   node figuras/_prova_base_travas_hoje.js
roda "formula"          node figuras/testa_formula.js
roda "piloto MAT07-12"  node figuras/_piloto_MAT07-12.js
roda "receitas sol."    node figuras/_prova_receitas_solidos.js
roda "piloto MAT08-13"  node figuras/_piloto_MAT08-13.js
roda "piloto MATEM3-04" node figuras/_piloto_MATEM3-04.js
roda "tinta"            node figuras/_prova_desenho_tinta.js
saida=$(node figuras/_prova_desenho.js 2>&1) || true
if printf '%s\n' "$saida" | grep -qE "^avisos: 0$" && printf '%s\n' "$saida" | grep -qE "^vazamentos de estado: 0$"; then
  printf '  ok      %-24s %s\n' "desenho" "$(printf '%s\n' "$saida" | grep -E '^figuras:' | head -1)"
else
  printf '  FALHOU  %-24s %s\n' "desenho" "$(printf '%s\n' "$saida" | grep -E 'avisos|vazamentos' | tr '\n' ' ')"
  falhou=1
fi

# O testa_atualizacao_real entra aqui porque e o UNICO que percorre uma transicao
# de versao de verdade, com os cabecalhos reais do GitHub Pages (max-age=600 e
# ETag) e o cache do navegador quente e vencido. Ele ficou de fora justamente da
# rodada cujo tema era o nome do cache do service worker. Ele nao imprime
# "N falharam": diz "ATUALIZACAO CONFIRMADA..." quando passa, e o `roda` aceita
# pelo CONFIRMAD; quando falha imprime "N FALHA(S)", sem CONFIRMAD, e reprova.
titulo "com navegador"
for t in testa_temas testa_registro testa_busca testa_mapa_e2e testa_mapeamento \
         testa_perfil testa_olho testa_atualizacao testa_atualizacao_real \
         testa_exclusoes testa_feriados testa_mover testa_retroativo testa_series; do
  roda "$t" node "_teste/$t.js"
done

# Duas conferencias aqui, e a primeira e a que pega o defeito de verdade.
#
# 1) O pacote offline tem DUAS listas que precisam bater: os <script src=
# "figuras/*.js"> do index.html e a lista ARQUIVOS do sw.js. Ela da aula na casa
# das familias, muitas vezes sem sinal: arquivo que o index.html carrega e o
# cache nao guarda vira 503 quando falta rede, e some calado, porque cada modulo
# de figuras procura o global do vizinho e, nao achando, desiste sem erro. A
# figura sai sem marca nenhuma e so se descobre na folha impressa. Por isso a
# conferencia sai dos DOIS arquivos de HOJE. A versao anterior comparava o sw.js
# com o sw.js e nunca olhou o index.html: nao veria isso nunca.
#
# 2) O nome do cache tem que mudar quando a lista muda. Nos dez commits que
# mexeram no sw.js a constante CACHE foi promovida toda vez (v1 ate v11); depois
# a lista ganhou o figuras/solidos.js e o nome quase ficou parado. Sem nome novo
# o install abre caches.open(CACHE) no MESMO cache de onde a versao ATIVA esta
# servindo e da put() em cada arquivo, entao o codigo novo entra la antes de ela
# mandar atualizar; e como o .catch() por arquivo deixa a instalacao dar certo
# quando a conexao cai no meio, o cache vivo fica parte novo e parte velho.
# Com nome novo o cache anterior fica inteiro ate o activate.
#
# A comparacao e com a BASE DO MERGE, e nao com o HEAD. Numa branch ja comitada,
# que e o unico estado em que este portao roda de verdade, o HEAD e igual a
# arvore por construcao: a versao anterior comparava o arquivo consigo mesmo e
# imprimia ok sem ter afirmado nada. Sem base (copia do repo sem historico) sai
# INSTAVEL, nunca ok silencioso.
titulo "cache do aplicativo"
lista_sw() { printf '%s\n' "$1" | sed -n '/^var ARQUIVOS = \[/,/^\];/p'; }
nome_sw()  { printf '%s\n' "$1" | sed -n "s/^var CACHE = '\(.*\)';.*/\1/p" | head -1; }
# So as ENTRADAS da lista: linha que e um caminho entre aspas, e nada de
# comentario. Procurar o nome no arquivo inteiro nao serve: um comentario do
# proprio sw.js que cite './figuras/solidos.js' satisfaria a trava sozinho.
entradas_sw() { printf '%s\n' "$1" | sed -n "s|^ *'\(\./\)\{0,1\}\([^']*\)' *,\{0,1\} *\$|\2|p"; }

sw_agora=$(tr -d '\r' < sw.js 2>/dev/null || true)
lista_agora=$(entradas_sw "$(lista_sw "$sw_agora")")
figs_html=$(grep -oE 'src="figuras/[A-Za-z0-9_.-]+\.js"' index.html 2>/dev/null \
  | sed 's|.*figuras/||; s|"$||' | sort -u)
if [ -z "$lista_agora" ] || [ -z "$figs_html" ]; then
  printf '  FALHOU  %-24s nao achei a lista ARQUIVOS no sw.js ou os scripts de figuras no index.html\n' \
    "kit no cache"
  falhou=1
else
  fora=""
  for f in $figs_html; do
    printf '%s\n' "$lista_agora" | grep -Fqx "figuras/$f" || fora="$fora $f"
  done
  if [ -z "$fora" ]; then
    printf '  ok      %-24s os %s arquivos de figuras do index.html estao na lista do sw.js\n' \
      "kit no cache" "$(printf '%s\n' "$figs_html" | wc -l | tr -d ' ')"
  else
    printf '  FALHOU  %-24s o index.html carrega e o sw.js nao guarda:%s\n' "kit no cache" "$fora"
    falhou=1
  fi
fi

base=$(git merge-base HEAD origin/main 2>/dev/null || git merge-base HEAD main 2>/dev/null || true)
[ -n "$base" ] || base=$(git rev-parse --verify -q origin/main 2>/dev/null || true)
[ -n "$base" ] || base=$(git rev-parse --verify -q main 2>/dev/null || true)
sw_antes=""
if [ -n "$base" ]; then
  sw_antes=$(git show "$base:sw.js" 2>/dev/null | tr -d '\r' || true)
fi
if [ -z "$sw_antes" ] || [ -z "$sw_agora" ]; then
  printf '  INSTAVEL %-23s sem base de merge com sw.js para comparar\n' "nome do cache"
  instavel=1
elif [ "$lista_agora" = "$(entradas_sw "$(lista_sw "$sw_antes")")" ]; then
  printf '  ok      %-24s a lista nao mudou desde a base do merge\n' "nome do cache"
elif [ "$(nome_sw "$sw_agora")" != "$(nome_sw "$sw_antes")" ]; then
  printf '  ok      %-24s lista nova desde a base, cache %s\n' "nome do cache" "$(nome_sw "$sw_agora")"
else
  printf '  FALHOU  %-24s a lista de ARQUIVOS mudou desde a base do merge e o cache continua %s\n' \
    "nome do cache" "$(nome_sw "$sw_agora")"
  falhou=1
fi

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
