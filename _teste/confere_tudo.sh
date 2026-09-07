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
      # Sem placar nenhum na saida. Sao dois casos, e o texto vale para os dois:
      # o teste morreu antes de comecar, ou ele rodou e falou um dialeto que
      # este portao nao le. Dizer "nao chegou a rodar" para o segundo manda quem
      # le procurar defeito no lugar errado.
      #
      # E o motivo nunca sai vazio. Saia: quando nao havia linha de erro para
      # citar, o portao imprimia "nao chegou a rodar: " e nada depois, e quem
      # lia ficava sem nada para chasear. Na falta de linha de erro, a ultima
      # linha nao vazia da saida e o que o teste deixou dito.
      motivo=$(printf '%s\n' "$saida2" | grep -iE "error|cannot find|not found" | head -1 | cut -c1-90)
      [ -n "$motivo" ] || motivo=$(printf '%s\n' "$saida2" | grep -v '^[[:space:]]*$' | tail -1 | cut -c1-90)
      [ -n "$motivo" ] || motivo="nao imprimiu nada"
      printf '  FALHOU  %-24s nao disse que passou: %s\n' "$nome" "$motivo"
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

# QUEM CONFERE O CONFERENTE.
#
# O verificar.py acima diz que os 148 temas estao bons. Ele so vale se ele
# souber reprovar: um verificador que aprova tudo tambem imprime "0 reprovados".
# O testa_verificador.py estraga um tema saudavel de 11 formas diferentes e
# exige que cada defeito seja pego, mais 14 frases e 6 decisoes do ambiente
# simbolico. Ele existia desde o comeco e o portao nunca o rodou, entao a linha
# acima vinha sendo uma afirmacao sobre um instrumento que ninguem aferia.
roda "provas do verificador" python temas/_ferramentas/testa_verificador.py

# FRENTE 2 (portugues e literatura). A colecao fontes/ tem travas proprias (dominio
# publico pela conta da Lei 9.610/98, largura de linha medida pelo pdf.js, cabecalho),
# provadas nos dois sentidos pelo testa_fontes.py: par envenenado por trava, com o ano
# fixo em 2026 e um segundo par em 2027 provando que a conta so afrouxa.
roda "provas das fontes"    python temas/_ferramentas/testa_fontes.py

titulo "sem navegador"
roda "notacao"        node _teste/testa_notacao.js
roda "busca (regras)" node _teste/testa_busca_regras.js
roda "material (PDF)" node _teste/testa_material.js
# FRENTE 2: bloco de citacao com numero de linha, fio e credito, italico por F4/F5,
# alternativas e gabarito em criterio, e a folha legada byte a byte igual a base do merge.
roda "citacao (PDF)"  node _teste/testa_citacao_pdf.js
roda "trilha (dados)" node _teste/testa_trilha_dados.js
roda "trilha (motor)" node _teste/testa_trilha.js
roda "dinheiro"      node _teste/testa_dinheiro.js
roda "cartao do mes" node _teste/testa_cartao.js
roda "proposta"      node _teste/testa_proposta.js
# A tabela de materias e uma so (core.js) e as copias tem que bater com ela:
# a do cartao.js, a do pdf.js, o banco/topicos/indice.json e a exportada para
# o Python. Foi a divergencia entre quatro vocabularios de materia que deixou
# "matematica" escrita a mao em oito pontos do app.js.
roda "materias"      node _teste/testa_materias.js
# Os 2.513 titulos do catalogo de topicos tem identificador estavel gravado
# como lista paralela 'ids', com registro congelado em banco/topicos/_ids.json.
# O risco real e o desalinhamento: um titulo inserido sem id deslocaria todos
# os seguintes em silencio, e o item gravado no tablet passaria a apontar para
# outro topico. Este teste casa titulo por titulo com o registro.
roda "ids de topicos" node _teste/testa_topicos_ids.js

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
# rodada cujo tema era o nome do cache do service worker.
#
# Ele falava sozinho: "ATUALIZACAO CONFIRMADA" quando passava e "N FALHA(S)"
# quando falhava. O segundo nao casa com "N falharam" nem com "passaram", entao
# uma falha de asercao REAL saia daqui como "nao chegou a rodar: " e nada
# depois, tendo o teste rodado inteiro e impresso 14 OK mais uma FALHA. Hoje ele
# imprime "N verificacoes passaram, M falharam", que e o dialeto de todos os
# irmaos, e a frase da confirmacao segue na linha seguinte, que e o nome pelo
# qual ele aparece no resumo quando passa.
# O PORTAO LEVANTA O PROPRIO SERVIDOR.
#
# Os dez testes de navegador apontam para http://127.0.0.1:8777/index.html e
# NENHUM deles levanta servidor: eles dependiam de alguem ter deixado um
# `python -m http.server 8777` rodando a mao. Numa maquina recem-ligada, num
# clone novo, ou depois que alguem limpa processos parados, todos falhavam por
# conexao recusada, e o portao acusava dez defeitos que nao existiam. Aconteceu
# de verdade em 07/09/2026: um servidor esquecido foi derrubado como lixo de
# sessao antiga e derrubou a bateria inteira junto.
#
# So sobe se a porta estiver muda, e so derruba o que ELE subiu: quem ja tem um
# servidor proprio ali continua com o dele.
servidor_pid=""
porta_responde() { curl -s -o /dev/null -m 2 "http://127.0.0.1:8777/index.html" 2>/dev/null; }
if porta_responde; then
  printf '\n  (servidor ja estava no ar em 127.0.0.1:8777)\n'
else
  python -m http.server 8777 --bind 127.0.0.1 >/dev/null 2>&1 &
  servidor_pid=$!
  espera=0
  while [ "$espera" -lt 40 ] && ! porta_responde; do
    sleep 0.25
    espera=$((espera + 1))
  done
  if porta_responde; then
    printf '\n  (portao levantou o servidor em 127.0.0.1:8777, pid %s)\n' "$servidor_pid"
  else
    printf '\n  FALHOU  nao subiu servidor em 127.0.0.1:8777; os testes de navegador nao rodam\n'
    falhou=1
  fi
fi
# Derruba no fim, aconteca o que acontecer, inclusive se o portao for
# interrompido no meio: comando de fundo morto pelo terminal deixa filho vivo,
# e servidor orfao na porta e pior que nenhum, porque o proximo processo que
# tentar subir ali no Windows sobe junto e as conexoes vao para o antigo.
limpa_servidor() {
  [ -n "$servidor_pid" ] && kill "$servidor_pid" 2>/dev/null || true
}
trap limpa_servidor EXIT INT TERM

titulo "com navegador"
for t in testa_temas testa_registro testa_busca testa_mapa_e2e testa_mapeamento \
         testa_perfil testa_olho testa_atualizacao testa_atualizacao_real \
         testa_biblioteca_offline \
         testa_exclusoes testa_feriados testa_mover testa_retroativo testa_series \
         testa_assunto testa_aluno testa_familia testa_proposta_tela \
         testa_tabela_no_app; do
  roda "$t" node "_teste/$t.js"
done
# O mesmo teste duas vezes de proposito. Sem argumento ele prova que a serie
# de temas baixada sobrevive a uma atualizacao feita sem sinal; com
# --envenenado a versao publicada troca o caminho das series no app.js e ele
# tem que ENXERGAR a perda. Se o segundo passar sem o defeito aparecer, o
# primeiro nao esta provando nada. Fica fora do laco porque o laco nao passa
# argumento.
roda "testa_biblioteca_offline --envenenado" node "_teste/testa_biblioteca_offline.js" --envenenado
# E uma terceira vez, com o veneno do incidente real de sw.js:12-16: o activate
# publicado deixa de poupar o BAIXADOS e apaga a biblioteca. O primeiro veneno
# nunca faz as duas asserções de cache falharem; este faz. Sem ele, um activate
# que apagasse o BAIXADOS passaria pelas duas sem ninguem ter provado que elas
# sabem reprovar.
roda "testa_biblioteca_offline --envenenado-activate" node "_teste/testa_biblioteca_offline.js" --envenenado-activate

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

# A LINHA DE carregarSerie QUE MONTA O CAMINHO DAS SERIES DA MATEMATICA.
#
# O app.js le a tabela de materias (Core.MATERIAS) para saber de que raiz vem
# cada serie, e a raiz da matematica e 'banco/' por legado: a chave no cache
# BAIXADOS dos tablets e a URL que o app pediu no dia em que a serie foi
# baixada, e nao ha codigo que renomeie chave. Se a linha de codigo de
# carregarSerie deixar de produzir o literal 'banco/serie-', toda serie que ela
# ja baixou some sem sinal, na casa da familia (o incidente de sw.js:12-16). O
# testa_biblioteca_offline prova isso no navegador, em tres minutos; esta e a
# versao de um segundo, sem Chrome e sem servidor.
#
# Casa a LINHA de codigo dentro da funcao, e nao o arquivo inteiro: o proprio
# comentario de carregarSerie cita o literal, e um grep no arquivo passaria com
# a linha de codigo trocada. E a prova vem antes da conferencia: dois venenos
# tem que dar zero. O primeiro e o mesmo do testa_biblioteca_offline (o literal
# trocado por 'banco/matematica/serie-'); o segundo tira o literal da linha de
# codigo e o deixa so no comentario, que e o buraco de casar o arquivo.
linhas_serie_mat() {
  printf '%s\n' "$1" | sed -n '/^  function carregarSerie(/,/^  }$/p' \
    | grep -vE '^[[:space:]]*(/\*|\*|//)' | grep -cE "'banco/serie-'[[:space:]]*\+" || true
}
app_agora=$(tr -d '\r' < app.js 2>/dev/null || true)
veneno_troca=$(printf '%s\n' "$app_agora" | sed "s|'banco/serie-'|'banco/matematica/serie-'|g")
veneno_some=$(printf '%s\n' "$app_agora" \
  | sed "/^  function carregarSerie(/,/^  }$/{ /^[[:space:]]*var url = /s|'banco/serie-'[[:space:]]*+[[:space:]]*serie|raiz + 'serie-' + serie|; }")
n_agora=$(linhas_serie_mat "$app_agora"); [ -n "$n_agora" ] || n_agora=0
n_troca=$(linhas_serie_mat "$veneno_troca"); [ -n "$n_troca" ] || n_troca=0
n_some=$(linhas_serie_mat "$veneno_some"); [ -n "$n_some" ] || n_some=0
if [ -z "$app_agora" ]; then
  printf '  FALHOU  %-24s nao consegui ler o app.js\n' "serie da matematica"
  falhou=1
elif [ "$veneno_troca" = "$app_agora" ] || [ "$veneno_some" = "$app_agora" ]; then
  printf '  FALHOU  %-24s um dos venenos nao mudou o app.js: a prova da trava nao prova nada\n' "serie da matematica"
  falhou=1
elif [ "$n_troca" != "0" ] || [ "$n_some" != "0" ]; then
  printf '  FALHOU  %-24s a trava nao enxerga o veneno (literal trocado: %s linha, literal so no comentario: %s linha)\n' \
    "serie da matematica" "$n_troca" "$n_some"
  falhou=1
elif [ "$n_agora" = "0" ]; then
  printf '  FALHOU  %-24s a linha de carregarSerie nao produz mais o literal banco/serie- para a matematica\n' "serie da matematica"
  falhou=1
else
  printf '  ok      %-24s carregarSerie produz banco/serie- para a matematica (%s linha), e a trava pega os dois venenos\n' \
    "serie da matematica" "$n_agora"
fi

# A PROVA VEM ANTES DA CONFERENCIA que ela prova.
#
# As duas travas de privacidade passaram meses imprimindo ok sem olhar arquivo
# nenhum, porque liam a arvore suja e o portao roda com a branch ja comitada.
# A prova monta os casos que TEM que reprovar (nome dentro de arquivo novo, nome
# no nome do arquivo, lista de nomes ausente) e confere que cada um reprova
# mesmo. Se a prova cair, a conferencia abaixo nao vale nada, e e por isso que
# ela roda primeiro.
roda "prova da privacidade" sh _teste/prova_privacidade.sh

titulo "nada de aluno no commit"
# A conferencia vive em _teste/confere_privacidade.sh para poder ser rodada
# sozinha, em um segundo, em vez de so no fim dos quinze minutos da bateria.
# Saida: 0 passou, 1 reprovou, 2 instavel.
saida=$(sh _teste/confere_privacidade.sh 2>&1) && codigo=0 || codigo=$?
printf '%s\n' "$saida"
# Ifs explicitos, e nao `[ ... ] && var=1`: sob `set -e`, uma lista com && cujo
# teste falha devolve codigo diferente de zero e derruba o portao inteiro ali,
# calado, antes de imprimir o resumo. Custa duas linhas a mais e nao tem
# armadilha.
if [ "$codigo" = "1" ]; then
  falhou=1
fi
if [ "$codigo" = "2" ]; then
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
