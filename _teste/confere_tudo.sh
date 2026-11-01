#!/bin/sh
# Roda tudo que precisa passar antes de um merge para a main.
#
# Existe porque a conferencia estava espalhada em quinze comandos e era facil
# esquecer um. Sai com codigo diferente de zero se qualquer coisa falhar, entao
# serve tanto para olhar quanto para travar.
#
#   sh _teste/confere_tudo.sh            o portao inteiro, com Chrome
#   sh _teste/confere_tudo.sh --rapido   tudo menos o que abre navegador
#   sh _teste/confere_tudo.sh --pedaco 2/4
#                                        so as provas de navegador da fatia 2
#                                        de 4 (o CI roda as fatias em maquinas
#                                        paralelas; o que nao abre navegador
#                                        fica com o --rapido)
#   sh _teste/confere_tudo.sh --listar [--pedaco K/N]
#                                        nao roda nada: diz, uma por linha, que
#                                        prova de navegador rodaria (a prova das
#                                        fatias e o testa_pedacos_do_portao)
#
# O --rapido e o que o GitHub roda em todo PR (.github/workflows/portao.yml),
# porque o inteiro passa de dez minutos e quase todo esse tempo e Chrome. Ele
# NAO substitui o inteiro antes do merge: no fim ele diz que as provas de
# navegador nao rodaram, em vez de "TUDO PASSOU".
set -e
cd "$(dirname "$0")/.."

falhou=0
instavel=0
# CONFERENCIA PULADA nao e teste instavel (A4c). `instavel` e o teste que
# so passou na segunda vez; `pulada` e a conferencia que nao pode rodar aqui
# (sem a lista de nomes, sem base de merge). No CI a lista de nomes nao
# existe, e cada fatia dizia "algum teste so passou na segunda vez" sem
# nenhum ter falhado.
pulada=0
rapido=0
listar=0
pedaco=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --rapido) rapido=1 ;;
    --listar) listar=1 ;;
    --pedaco) pedaco_dado=1; pedaco="${2:-}"; if [ "$#" -gt 1 ]; then shift; fi ;;
    *) printf 'opcao desconhecida: %s\n' "$1"; exit 2 ;;
  esac
  shift
done

# AS FATIAS DO PORTAO INTEIRO. O inteiro passou de oitenta minutos numa maquina
# so, e quase todo esse tempo e Chrome, uma prova depois da outra. No CI ele
# roda em N maquinas paralelas, cada uma com a sua fatia: a prova de navegador
# de numero i (na ordem em que este arquivo as chama, contando de 1) vai para a
# fatia ((i - 1) mod N) + 1. A ordem e a mesma em toda maquina, porque o arquivo
# e o mesmo, entao as fatias nao se cruzam e juntas cobrem todas; quem prova
# isso e o testa_pedacos_do_portao, sem navegador, no --rapido.
pk=""; pn=""
if [ "${pedaco_dado:-0}" = "1" ]; then
  # sem barra ("4") ou vazio nao e fatia: viraria o 4/4 ou o portao inteiro, calado
  case "$pedaco" in */*) ;; *) printf 'fatia invalida: "%s" (use K/N)\n' "$pedaco"; exit 2 ;; esac
  pk="${pedaco%/*}"; pn="${pedaco#*/}"
  # Cada metade por si: na concatenacao, "1/" e "/4" passavam (uma metade vazia,
  # a outra numerica) e viravam o portao inteiro, calado. Zero a esquerda
  # tambem sai: a conta do shell le "010" como octal e o teste como decimal.
  for metade in "$pk" "$pn"; do
    case "$metade" in ''|0*|*[!0-9]*) printf 'fatia invalida: %s (use K/N, de 1 a N)\n' "$pedaco"; exit 2 ;; esac
  done
  if [ "$pk" -gt "$pn" ]; then printf 'fatia invalida: %s (K de 1 a N)\n' "$pedaco"; exit 2; fi
  # Fatia e o portao rapido nao combinam: o rapido pula o navegador, e a fatia
  # diria que rodou as provas que so pulou.
  if [ "$rapido" = "1" ]; then printf 'o --rapido nao roda navegador; nao combina com --pedaco\n'; exit 2; fi
fi
numero_navegador=0
rodadas_aqui=0

# O CAMINHO DE CADA PROVA QUE O PORTAO CHAMOU, uma por linha.
#
# E a lista que a conferencia "toda prova no portao", no fim, compara com os
# arquivos de prova que existem no repositorio. Ela sai de quem RODA, e nao de
# um grep neste arquivo: um nome citado num comentario daqui passaria por
# "esta no portao" sem rodar nunca.
chamadas=""
anota() { chamadas="$chamadas
$1"; }
# Na secao de navegador, o --rapido anota a prova sem rodar: ela continua
# contando como "esta no portao", porque esta, e o inteiro a roda.
na_secao_navegador=0
pulados=0

# ONDE A SAIDA DE QUEM REPROVOU FICA GUARDADA.
#
# O `roda()` captura a saida do teste numa variavel e imprime so a linha de
# resumo. Quando a segunda tentativa tambem falha, a saida inteira era
# DESCARTADA: sobrava "15 passaram, 46 falharam" e nenhuma das 46. Em 24/09
# isso transformou um diagnostico que devia ser leitura numa reproducao de
# quase uma hora, e havia o caso pior a caminho, o da reprovacao que NAO
# reproduz fora do portao, em que a evidencia some para sempre.
#
# Portao que joga fora a prova do proprio vermelho ensina a desconfiar do
# vermelho, que e o comeco de ignorar alarme.
FALHAS_EM="${FALHAS_EM:-_falhas_do_portao}"
guarda_saida() {
  mkdir -p "$FALHAS_EM" 2>/dev/null || return 0
  arq="$FALHAS_EM/$(printf '%s' "$1" | tr -c 'A-Za-z0-9._-' '_').txt"
  printf '%s
' "$2" > "$arq" 2>/dev/null || return 0
  printf '          saida inteira em %s
' "$arq"
}
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
  # $1 e o interpretador (node, python, sh) e $2 o arquivo da prova.
  anota "${2:-}"
  # Fatia e listagem: o numero conta toda prova de navegador, rode ela aqui ou
  # nao, para a conta ser a mesma em todas as maquinas.
  # (return 0 sempre explicito: com o set -e, um `return` que herdasse o status
  # de um teste falso derrubaria o portao inteiro na primeira prova)
  if [ "$na_secao_navegador" = "1" ]; then
    numero_navegador=$((numero_navegador + 1))
    if [ -n "$pn" ] && [ $(( (numero_navegador - 1) % pn + 1 )) -ne "$pk" ]; then
      return 0
    fi
  elif [ -n "$pn" ]; then
    # o que nao abre navegador roda no portao-rapido, em todo PR
    return 0
  fi
  if [ "$listar" = "1" ]; then
    if [ "$na_secao_navegador" = "1" ]; then printf '  vai     %s %s\n' "$numero_navegador" "$nome"; fi
    return 0
  fi
  if [ "$na_secao_navegador" = "1" ]; then rodadas_aqui=$((rodadas_aqui + 1)); fi
  if [ "$rapido" = "1" ] && [ "$na_secao_navegador" = "1" ]; then
    # Dito pelo nome, um por um: pular calado fazia o --rapido parecer que
    # rodou o que nao rodou.
    printf '  pulado  %-24s abre navegador; so o portao inteiro roda\n' "$nome"
    pulados=$((pulados + 1))
    return
  fi
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
      guarda_saida "$nome" "$saida2"
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
      guarda_saida "$nome" "$saida2"
    fi
    falhou=1
  else
    printf '  INSTAVEL %-23s passou na segunda vez\n' "$nome"
    instavel=1
  fi
}

# A secao do banco de temas (o verificar.py dos 148 temas, a prova do
# verificador e a das fontes de portugues) saiu no B14 com o material autoral.
titulo "sem navegador"
roda "notacao"        node _teste/testa_notacao.js
roda "busca (regras)" node _teste/testa_busca_regras.js
# FRENTE 2: bloco de citacao com numero de linha, fio e credito, italico por F4/F5,
# alternativas e gabarito em criterio, e a folha legada byte a byte igual a base do merge.
roda "citacao (PDF)"  node _teste/testa_citacao_pdf.js
roda "trilha (dados)" node _teste/testa_trilha_dados.js
# C7 (entrega 1): o grafo de pre-requisitos imediatos dos 148 assuntos de
# matematica. Sem ciclo, sem aresta para ano posterior, sem redundancia pela
# transitividade, raizes so no 2o ano, ids e titulos congelados; com veneno.
roda "grafo (C7)"     node _teste/testa_grafo.js
roda "trilha (motor)" node _teste/testa_trilha.js
roda "trilha (listas C7)" node _teste/testa_trilha_listas.js
roda "dinheiro"      node _teste/testa_dinheiro.js
roda "cartao do mes" node _teste/testa_cartao.js
roda "proposta"      node _teste/testa_proposta.js
roda "textos e novidades" node _teste/testa_textos_e_novidades.js
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
# FRENTE B (biblioteca): o leitor de zip e a conferencia do pacote, com o pacote
# SINTETICO gerado na hora (o real mora no Drive e nunca entra no repositorio).
# Cada veneno (corrompido deflate e stored, hash, sobrando, faltando, asset
# citado, esquema) tem de ser recusado pelo motivo certo.
roda "biblioteca (zip)" node _teste/testa_biblioteca_zip.js
# Os quatro sem navegador que as frentes de UX (T01 a T12) escreveram e nao
# puseram aqui. Passavam sozinhos; ninguem os rodava antes do merge.
roda "fechamento em ordem"   node _teste/testa_fechamento_ordem_alfabetica.js
roda "rotulos da aula"       node _teste/testa_rotulos_aula.js
roda "sugestoes matematica"  node _teste/testa_sugestoes_matematica.js
roda "virada anual"          node _teste/testa_virada_anual.js
# A regra do merge na main (_teste/merge_seguro.sh), que segura o processo
# quando a protecao de branch do GitHub sumir com o repositorio privado.
roda "merge seguro"          node _teste/testa_merge_seguro.js
# As fatias do portao inteiro no CI: toda prova de navegador em exatamente uma
# fatia, para qualquer numero de fatias, com controle que reprova.
roda "fatias do portao"      node _teste/testa_pedacos_do_portao.js
# Oito que moravam no laco "com navegador" sem abrir navegador nenhum (nem
# puppeteer, nem a porta 8777). La, o --rapido os pulava; aqui o GitHub os roda
# em todo PR.
for t in testa_registro testa_mapeamento testa_exclusoes testa_feriados \
         testa_mover testa_retroativo testa_series testa_a3_edicao_repeticao testa_aluno testa_rotulos_de_familia \
         testa_vocabulario testa_dominio testa_sondagem testa_pagamentos; do
  roda "$t" node "_teste/$t.js"
done
# C9: o documento do ciclo. Os numeros do periodo, o dominio, o rascunho das
# quatro secoes, so os pontos de atencao marcados, o texto e o PDF sem nada
# interno; e dois venenos (ponto nao marcado, rotulo interno) que TEM de
# reprovar, com o controle pelo mesmo carregador.
roda "documento do ciclo"    node _teste/testa_documento_do_ciclo.js
# B5: cabecalho em uma unica linha de 64 px e abas de toque de 44 px no tablet em pe.
roda "cabecalho tablet (B5)"  node _teste/testa_cabecalho_tablet.js
# B6: alvos de toque de 44 px e tipografia base
roda "alvos de toque (B6)"    node _teste/testa_alvos_toque.js

# A secao do kit de figuras (31 provas de figuras/) saiu no B14 com o material
# autoral: o kit so servia aos temas.

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
na_secao_navegador=1
if [ "$rapido" = "1" ]; then
  printf '\n  (--rapido: a secao de navegador e anotada e nao roda; o portao inteiro a roda)\n'
elif [ "$listar" = "1" ]; then
  printf '\n  (--listar: nada roda, e nenhum servidor sobe)\n'
elif porta_responde; then
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
for t in testa_temas testa_busca testa_mapa_e2e \
         testa_perfil testa_olho testa_atualizacao testa_atualizacao_real \
         testa_assunto testa_familia testa_proposta_tela \
         testa_novidades_navegador \
         testa_modal_aula_navegador \
         testa_folha_navegador \
         testa_folha_resiliencia_navegador \
         testa_documento_familia_navegador \
         testa_tabela_no_app \
         testa_ano_cadastro \
         testa_sugestoes_matematica_navegador \
         testa_virada_anual_navegador \
         testa_zoom_calendario_navegador \
         testa_dominio_navegador \
         testa_sondagem_navegador \
         e2e e2e_correcoes; do
  roda "$t" node "_teste/$t.js"
done

# O painel "Cada aluno, desde quando e por quanto" nasce recolhido no
# Fechamento. Esta trava guarda quatro coisas: ele nasce fechado, o botao
# Mostrar abre, a escolha dela fica lembrada e abrir ou fechar nao mexe na
# rolagem. O Fechamento e a tela que ela abre todo fim de mes com a familia
# esperando, e o painel aberto empurrava os botoes de PDF para fora da tela.
#
# Os venenos sao DOIS porque as perdas sao de naturezas diferentes e nenhum
# pega a do outro. Com --envenenado-aberto o painel nasce aberto mesmo sem a
# preferencia gravada: e a perda visivel, aparece na primeira tela. Com
# --envenenado-esquece o painel abre e fecha certinho e nunca grava a escolha:
# e a perda silenciosa, na tela tudo funciona e so a visita seguinte mostra o
# defeito. Um veneno que so cobre a primeira nao prova nada sobre a segunda.
# Ficam fora do laco porque o laco nao passa argumento.
# FRENTE B: importar a biblioteca em Ajustes (migracao do banco para a versao 2,
# substituicao por versao, venenos na tela, copia de seguranca com uso e
# etiquetas). O modo envenenado serve um biblioteca.js que nao confere o hash,
# e o teste tem que enxergar o pacote errado entrando.
roda "biblioteca importar"                      node "_teste/testa_biblioteca_importar.js"
roda "biblioteca importar --envenenado-hash"    node "_teste/testa_biblioteca_importar.js" --envenenado-hash
# FRENTE B: a aba Biblioteca (sem pacote, "Em construcao"; com pacote, serie,
# modulo, aula, miniaturas sob demanda, lista de 40 abaixo de 2 s, tela cheia,
# busca "bhaskara" agrupada, abrir como folha). O modo envenenado serve um app.js
# que ignora os apelidos do pacote, e "bhaskara" tem de perder as listas.
roda "biblioteca navegar"                       node "_teste/testa_biblioteca_navegar.js"
roda "biblioteca navegar --envenenado-apelidos" node "_teste/testa_biblioteca_navegar.js" --envenenado-apelidos
# C12: os pacotes de provas (OBMEP Mirim por nivel e ENEM) importam, as abas vao
# do 2o ao 5o ano e os assuntos do aplicativo aparecem como modulos. O modo
# envenenado serve o app.js que so espalhava o Banco pelas series equivalentes.
roda "biblioteca mirim"                         node "_teste/testa_biblioteca_mirim.js"
roda "biblioteca mirim --envenenado-equivalentes" node "_teste/testa_biblioteca_mirim.js" --envenenado-equivalentes
# e o "Diversos" das provas nao vira assunto da aula: o veneno trata todo modulo
# de prova como assunto
roda "biblioteca mirim --envenenado-diversos"   node "_teste/testa_biblioteca_mirim.js" --envenenado-diversos
# FRENTE B: selecionar e compor. Sem navegador, o compositor do pdf.js (lista
# renumerada, gabarito separado, sem solucao escrito, quebra entre pedacos, marca
# por cima so nesta folha e os outros documentos byte a byte iguais aos de main).
# No navegador, caixas, carrinho, gerar, anexar, uso, etiqueta e lista como folha;
# o modo envenenado serve um pdf.js que nao escreve "Sem solucao na fonte.", e o
# teste tem que enxergar o numero vazio no gabarito.
na_secao_navegador=0  # sem Chrome: o --rapido roda (conferido com CHROME envenenado)
roda "biblioteca compor (pdf)"                 node "_teste/testa_biblioteca_compor.js"
na_secao_navegador=1
roda "biblioteca compor"                       node "_teste/testa_biblioteca_compor_tela.js"
roda "biblioteca compor --envenenado-sem-solucao" node "_teste/testa_biblioteca_compor_tela.js" --envenenado-sem-solucao
# FRENTE B: a biblioteca a partir da aula (botao Material do assunto, filtro
# "ainda nao usei com", fechamento com os modulos, e o fechamento sem biblioteca
# byte a byte igual ao de main). O veneno conta o uso de qualquer aluno.
roda "biblioteca aula"                         node "_teste/testa_biblioteca_aula.js"
roda "biblioteca aula --envenenado-aluno"      node "_teste/testa_biblioteca_aula.js" --envenenado-aluno
roda "biblioteca aula --envenenado-acento"     node "_teste/testa_biblioteca_aula.js" --envenenado-acento
# FRENTE B: a dificuldade na lista (rotulo estimada/revisada, filtro Facil, Medio,
# Dificil com a etiqueta dela valendo, e o CSV das etiquetas no formato da
# curadoria). O veneno ignora a etiqueta dela no filtro.
roda "biblioteca dificuldade"                  node "_teste/testa_biblioteca_dificuldade.js"
roda "biblioteca dificuldade --envenenado-etiqueta" node "_teste/testa_biblioteca_dificuldade.js" --envenenado-etiqueta
# FRENTE B: o acervo de 14/09 saiu do repositorio (arquivos, lista do sw.js, aba
# Temas antiga); sem pacote a Biblioteca segue "Em construcao", e uma aula com
# assunto gravado do acervo abre como assunto comum. O veneno devolve um arquivo
# que nao existe a lista do sw.js, e o service worker nao pode instalar.
roda "limpeza do acervo"                        node "_teste/testa_limpeza_acervo.js"
roda "limpeza do acervo --envenenado-lista"     node "_teste/testa_limpeza_acervo.js" --envenenado-lista
# B14: o material autoral saiu do repositorio. Sem navegador, a chave fora do
# app.js, o material fora do repositorio e do pacote do service worker, o indice
# de assuntos com os 148 ids, e a TRILHA ANTES E DEPOIS da migracao (os 148
# assuntos como alvo, com o motor e o indice de antes contra os de hoje, enquanto
# a base do merge ainda tiver o indice antigo). No navegador, a janela da aula
# sem o botao, o assunto do indice como assunto comum, o material ja anexado
# numa aula antiga ainda abrindo, e a trilha sem "Ver os temas soltos". O veneno
# --envenenado-liga, que religava a chave, saiu junto com ela.
roda "sem material autoral"                     node "_teste/testa_sem_material_autoral.js"
# FRENTE B (B7): o caminho curto da aula ate o material da biblioteca. Da aula,
# o modulo inteiro ja marcado (menos o que ela ja usou com aquele aluno); marcar
# de dentro da tela cheia, com selo e com as caixas da lista de acordo ao fechar;
# e "Marcar os N deste modulo" na navegacao livre. Mais a troca do carrinho que
# deixou de ser silenciosa: o aviso comeca pelo que SAIU e a volta fica na faixa
# ate a proxima acao dela. Sao QUATRO venenos, cada um desligando UMA regra: o
# carrinho que nao enche, a lista que mente depois da tela cheia, o botao do
# modulo que nunca vira "Desmarcar", e a volta que some da faixa sobrando so a
# do aviso, que morre em nove segundos. Este ultimo e o mais silencioso dos
# quatro, porque por nove segundos o aplicativo envenenado parece inteiro.
roda "biblioteca caminho curto"                 node "_teste/testa_biblioteca_caminho_curto.js"
roda "caminho curto --envenenado-cheio"         node "_teste/testa_biblioteca_caminho_curto.js" --envenenado-cheio
roda "caminho curto --envenenado-visor"         node "_teste/testa_biblioteca_caminho_curto.js" --envenenado-visor
roda "caminho curto --envenenado-modulo"        node "_teste/testa_biblioteca_caminho_curto.js" --envenenado-modulo
roda "caminho curto --envenenado-volta"         node "_teste/testa_biblioteca_caminho_curto.js" --envenenado-volta
# FRENTE B (B7): remover um pacote importado em Ajustes. Sai tudo o que veio do
# pacote e a contagem por deposito prova; FICAM as etiquetas de dificuldade dela
# e o registro de uso, que sao dela e nao do pacote. O veneno leva os dois junto
# na mesma transacao, que e a perda SILENCIOSA que este teste existe para pegar.
roda "biblioteca remover pacote"                node "_teste/testa_biblioteca_remover.js"
roda "remover pacote --envenenado-dela"         node "_teste/testa_biblioteca_remover.js" --envenenado-dela

# O SALVAR SO RESPONDE QUANDO A TRANSACAO CONFIRMA. O store.js respondia no
# onsuccess do PEDIDO, e nao no oncomplete da TRANSACAO; se a pagina morre entre
# os dois (aba fechada, tablet matando o aplicativo), a transacao aborta e a
# escrita some depois de o aplicativo ter seguido como se estivesse salvo.
# Medido em 24/09: 7 perdas em 300 cortes antes, 0 em 300 depois. A prova
# interrompe no instante exato da resposta: nove caminhos exercitados um a um
# (salvar, salvarNota, salvarMidia, salvarAnexo, apagarAnexo, uso, etiqueta,
# registrarHistorico e limparHistorico; os outros so passam pelo mesmo
# escrever) tem a transacao abortada na microtarefa em que respondem
# (deterministico), e a regua do corte recarrega a pagina 300 vezes dentro dessa
# microtarefa. Sob veneno a regua so informa; quem decide e a parte
# deterministica. Os venenos: --envenenado-grava-no-pedido devolve o gravar
# antigo e tem de acusar os quatro caminhos que passam por ele; --envenenado-escreve-no-pedido
# faz o escrever responder no pedido e tem de acusar oito dos nove (o
# registrarHistorico poda o historico depois de gravar, e a leitura da poda
# espera a escrita confirmar). A linha da reprovacao se ve com --controle, que
# nao entra aqui porque tem de falhar.
roda "salvar grava no commit"                   node "_teste/testa_store_grava_no_commit.js"
roda "salvar --envenenado-grava-no-pedido"      node "_teste/testa_store_grava_no_commit.js" --envenenado-grava-no-pedido
roda "salvar --envenenado-escreve-no-pedido"    node "_teste/testa_store_grava_no_commit.js" --envenenado-escreve-no-pedido
# E o outro lado, que o conserto criou: a escrita que falha passa a REJEITAR.
# --envenenado-nao-rejeita tira o onabort do escrever, e a transacao abortada
# depois do sucesso do pedido tem de deixar a promessa pendurada a vista;
# --envenenado-nao-rele tira a releitura do disco do app.js, e uma copia que
# rejeita no meio tem de deixar o proximo salvar gravar o estado velho.
roda "salvar --envenenado-nao-rejeita"          node "_teste/testa_store_grava_no_commit.js" --envenenado-nao-rejeita
roda "salvar --envenenado-nao-rele"             node "_teste/testa_store_grava_no_commit.js" --envenenado-nao-rele
# B3: e a rejeicao que o salvar devolve e tratada num lugar so. O tablet sem
# espaco e simulado abortando a transacao de gravacao no IndexedDB: a faixa
# aparece, a mudanca fica na memoria, "Tentar de novo agora" e a nova tentativa
# de 15 s gravam, e a rejeicao avisada nao vira erro de pagina. O veneno tira a
# ligacao do tratamento central, e a falha tem de voltar a ser calada.
roda "falha de gravacao"                        node "_teste/testa_falha_de_gravacao.js"
roda "falha --envenenado-sem-tratamento"        node "_teste/testa_falha_de_gravacao.js" --envenenado-sem-tratamento
# Um veneno para cada regra: o olho esconde na hora mesmo quando a gravacao
# falha; a faixa nao cobre as abas nem o olho; o releDoDisco nao grava a
# memoria velha por cima do que ela escolheu substituir, e diz quando uma
# mudanca pendente saiu; o comDesfazer fecha a janela na falha; e o ponto de
# retorno que nao cabe nao segura a gravacao da mudanca.
roda "falha --envenenado-olho-espera"           node "_teste/testa_falha_de_gravacao.js" --envenenado-olho-espera
roda "falha --envenenado-faixa-por-cima"        node "_teste/testa_falha_de_gravacao.js" --envenenado-faixa-por-cima
roda "falha --envenenado-rele-grava"            node "_teste/testa_falha_de_gravacao.js" --envenenado-rele-grava
roda "falha --envenenado-rele-calado"           node "_teste/testa_falha_de_gravacao.js" --envenenado-rele-calado
roda "falha --envenenado-desfazer-trava"        node "_teste/testa_falha_de_gravacao.js" --envenenado-desfazer-trava
roda "falha --envenenado-ponto-segura"          node "_teste/testa_falha_de_gravacao.js" --envenenado-ponto-segura
# e a pergunta de confirmacao das tres substituicoes ja avisa que a mudanca
# pendente vai se perder, antes de ela decidir
roda "falha --envenenado-confirma-calado"       node "_teste/testa_falha_de_gravacao.js" --envenenado-confirma-calado
# e, quando a substituicao nao grava nada, a memoria e a faixa ficam
roda "falha --envenenado-nada-descarta"         node "_teste/testa_falha_de_gravacao.js" --envenenado-nada-descarta
# o Atualizar grava antes ou pergunta, e nunca recarrega calado com pendencia
roda "falha --envenenado-atualiza-calado"       node "_teste/testa_falha_de_gravacao.js" --envenenado-atualiza-calado
# quem desfaz a mudanca na memoria tira a faixa so quando ela era so daquela
# mudanca: um veneno de cada lado
roda "falha --envenenado-desfeita-calada"       node "_teste/testa_falha_de_gravacao.js" --envenenado-desfeita-calada
roda "falha --envenenado-desfeita-apaga"        node "_teste/testa_falha_de_gravacao.js" --envenenado-desfeita-apaga

# FRENTE B (B9): kits.json e exclusoes.json sao aditivos do esquema 1 (CONTRATO
# 8d). A prova nao le o biblioteca.js: ela IMPORTA um pacote de brinquedo com os
# dois arquivos no aplicativo servido do repositorio e mede o que ficou gravado,
# que tem de ser byte por byte a mesma contagem do pacote sem eles. O veneno
# serve um biblioteca.js que RECUSA arquivo de raiz desconhecido, ou seja um
# aplicativo que nao e indiferente ao kits.json, e o teste tem de enxergar a
# recusa. Para ver a LINHA DA REPROVACAO, o mesmo veneno com --controle, que
# nao entra aqui porque tem de falhar.
roda "biblioteca kits (aditivo)"                node "_teste/testa_biblioteca_kits.js"
roda "biblioteca kits --envenenado-app-recusa"  node "_teste/testa_biblioteca_kits.js" --envenenado-app-recusa

# FRENTE B (B10): a TELA DA LISTA PRONTA. As duas linhas no modulo com o numero
# daquela lista, o carregamento NA ORDEM DELA, as setas de subir e descer, tirar
# pela caixa, acrescentar do modulo, e a ferramenta de tapar na folha. Quatro
# venenos, e o da ordem e o mais silencioso: o carrinho fica com os MESMOS ids e
# so a ordem muda. O das camadas mede PIXEL, e nao a constante exportada: a
# ordem pode estar escrita certa e o laco que a usa, errado.
roda "biblioteca listas prontas"                    node "_teste/testa_biblioteca_listas.js"
roda "biblioteca listas --envenenado-ordem"         node "_teste/testa_biblioteca_listas.js" --envenenado-ordem
roda "biblioteca listas --envenenado-seta"          node "_teste/testa_biblioteca_listas.js" --envenenado-seta
roda "biblioteca listas --envenenado-curadoria"     node "_teste/testa_biblioteca_listas.js" --envenenado-curadoria
roda "biblioteca listas --envenenado-camadas"       node "_teste/testa_biblioteca_listas.js" --envenenado-camadas
# FRENTE B (B10): OS QUATRO CONSERTOS DE TELA que o olho de fora cego pediu.
# Uma coluna na grade, o aviso no fluxo em vez de flutuando por cima das setas,
# a frase dizendo o total resultante em vez de somar em voz alta, e o cartao
# sem etiqueta de dificuldade. Cada regua nova e medida tambem na lista CHEIA do
# modulo, onde ela TEM de achar o contrario. O veneno da coluna e o unico que
# mexe so no styles.css: se a regua lesse o codigo e nao a tela, ele passaria.
roda "biblioteca listas --envenenado-coluna"        node "_teste/testa_biblioteca_listas.js" --envenenado-coluna
roda "biblioteca listas --envenenado-flutua"        node "_teste/testa_biblioteca_listas.js" --envenenado-flutua
roda "biblioteca listas --envenenado-frase"         node "_teste/testa_biblioteca_listas.js" --envenenado-frase
roda "biblioteca listas --envenenado-dificuldade"   node "_teste/testa_biblioteca_listas.js" --envenenado-dificuldade
# E os dois que a segunda rodada do olho de fora cego achou, ambos filhos da
# coluna unica: a caixa "No material" no meio do caminho entre dois cartoes, e o
# aviso sobrevivendo a troca de ordem enquanto afirma a lista do pacote.
roda "biblioteca listas --envenenado-agrupa"        node "_teste/testa_biblioteca_listas.js" --envenenado-agrupa
roda "biblioteca listas --envenenado-aviso-velho"   node "_teste/testa_biblioteca_listas.js" --envenenado-aviso-velho
# E os quatro que as duas lentes cegas do PR acharam: o aviso sobrevivendo ao
# Desfazer por uma porta que a cerca nao cobria, o sairam cego para a ordem, a
# linha do modulo recarregando por cima do trabalho dela, e o caminho de volta
# da lista cheia levando para o modulo em vez de para a lista pronta.
roda "biblioteca listas --envenenado-sairam"        node "_teste/testa_biblioteca_listas.js" --envenenado-sairam
roda "biblioteca listas --envenenado-recarrega"     node "_teste/testa_biblioteca_listas.js" --envenenado-recarrega
roda "biblioteca listas --envenenado-volta"         node "_teste/testa_biblioteca_listas.js" --envenenado-volta
# A lixeira do tapar: sem o aviso de selecao ela nunca acende, e a ferramenta
# cria um branco que a professora nao consegue tirar.
roda "biblioteca listas --envenenado-lixeira"       node "_teste/testa_biblioteca_listas.js" --envenenado-lixeira
roda "biblioteca listas --envenenado-redesenho"     node "_teste/testa_biblioteca_listas.js" --envenenado-redesenho
roda "biblioteca listas --envenenado-uma-aula"      node "_teste/testa_biblioteca_listas.js" --envenenado-uma-aula
roda "biblioteca listas --envenenado-anexada"       node "_teste/testa_biblioteca_listas.js" --envenenado-anexada
roda "biblioteca listas --envenenado-nome-anexo"    node "_teste/testa_biblioteca_listas.js" --envenenado-nome-anexo
roda "biblioteca listas --envenenado-gabarito-junto" node "_teste/testa_biblioteca_listas.js" --envenenado-gabarito-junto
roda "biblioteca listas --envenenado-troca-ao-ver"  node "_teste/testa_biblioteca_listas.js" --envenenado-troca-ao-ver
roda "biblioteca listas --envenenado-desfazer-apaga" node "_teste/testa_biblioteca_listas.js" --envenenado-desfazer-apaga
roda "biblioteca listas --envenenado-anexar-apaga"  node "_teste/testa_biblioteca_listas.js" --envenenado-anexar-apaga
roda "biblioteca listas --envenenado-intacta-entra" node "_teste/testa_biblioteca_listas.js" --envenenado-intacta-entra
roda "biblioteca listas --envenenado-quarta-fica"   node "_teste/testa_biblioteca_listas.js" --envenenado-quarta-fica
roda "biblioteca listas --envenenado-heranca"   node "_teste/testa_biblioteca_listas.js" --envenenado-heranca
roda "biblioteca listas --envenenado-restam"        node "_teste/testa_biblioteca_listas.js" --envenenado-restam
roda "biblioteca listas --envenenado-porta-usar"    node "_teste/testa_biblioteca_listas.js" --envenenado-porta-usar
roda "biblioteca listas --envenenado-porta-carregar" node "_teste/testa_biblioteca_listas.js" --envenenado-porta-carregar
roda "biblioteca listas --envenenado-porta-aula"    node "_teste/testa_biblioteca_listas.js" --envenenado-porta-aula
roda "biblioteca listas --envenenado-porta-anexar"  node "_teste/testa_biblioteca_listas.js" --envenenado-porta-anexar
roda "biblioteca listas --envenenado-porta-desmarcar" node "_teste/testa_biblioteca_listas.js" --envenenado-porta-desmarcar
roda "biblioteca listas --envenenado-recencia"      node "_teste/testa_biblioteca_listas.js" --envenenado-recencia
roda "biblioteca listas --envenenado-grava-falha"   node "_teste/testa_biblioteca_listas.js" --envenenado-grava-falha
roda "biblioteca listas --envenenado-atribuicao-solta" node "_teste/testa_biblioteca_listas.js" --envenenado-atribuicao-solta
roda "biblioteca listas --envenenado-sem-etiqueta"  node "_teste/testa_biblioteca_listas.js" --envenenado-sem-etiqueta
roda "biblioteca listas --envenenado-orfao"         node "_teste/testa_biblioteca_listas.js" --envenenado-orfao
# C2a: Minhas listas. Criar no Preparar aula, cartao, duplicar, editar, usar,
# usada com, apagar com Desfazer, copia de seguranca de ida e volta, as tres
# guardadas pelo aplicativo, e a migracao do diario do localStorage. Um veneno
# por regra.
roda "minhas listas"                              node "_teste/testa_minhas_listas.js"
roda "minhas listas --envenenado-sem-espelho"     node "_teste/testa_minhas_listas.js" --envenenado-sem-espelho
roda "minhas listas --envenenado-copia-sem-listas" node "_teste/testa_minhas_listas.js" --envenenado-copia-sem-listas
roda "minhas listas --envenenado-uso-sem-lista"   node "_teste/testa_minhas_listas.js" --envenenado-uso-sem-lista
roda "minhas listas --envenenado-ordem-velha"     node "_teste/testa_minhas_listas.js" --envenenado-ordem-velha
# os achados das revisoes de 547c3c7: so sai do diario o que esta no deposito;
# a memoria das listas segue uma restauracao e um apagar tudo feitos pela tela;
# o uso fica com a lista carregada, e nao com a copia de mesmo conteudo; dar
# nome pelo "Salvar como lista" nao deixa a guardada pelo aplicativo ao lado
roda "minhas listas --envenenado-diario-antes"    node "_teste/testa_minhas_listas.js" --envenenado-diario-antes
roda "minhas listas --envenenado-memoria-velha"   node "_teste/testa_minhas_listas.js" --envenenado-memoria-velha
roda "minhas listas --envenenado-uso-por-conteudo" node "_teste/testa_minhas_listas.js" --envenenado-uso-por-conteudo
roda "minhas listas --envenenado-nomear-duplica"  node "_teste/testa_minhas_listas.js" --envenenado-nomear-duplica
# C2a: o banco sobe de 2 para 3. A subida nao perde nada; codigo mais velho que
# o banco diz o que fazer; a janela antiga larga o banco e avisa.
roda "banco v3"                                   node "_teste/testa_banco_v3.js"
roda "banco v3 --envenenado-versao-tecnica"       node "_teste/testa_banco_v3.js" --envenenado-versao-tecnica
roda "banco v3 --envenenado-troca-calada"         node "_teste/testa_banco_v3.js" --envenenado-troca-calada
# C15.1: o banco sobe de 3 para 4 sem perder nada; o pacote de livros sintetico
# importa por Ajustes; a copia de seguranca nao cresce com 1,2 MB de livro no
# tablet; o PDF abre pelo sumario no capitulo 2 e reabre onde parou; o EPUB abre
# numa caixa sem scripts e troca de capitulo; remover derruba o total. Um veneno
# por aceite: copia com os livros, caixa com scripts, PDF sem posicao.
roda "livros"                                     node "_teste/testa_livros.js"
roda "livros --envenenado-copia-com-livros"       node "_teste/testa_livros.js" --envenenado-copia-com-livros
roda "livros --envenenado-epub-com-scripts"       node "_teste/testa_livros.js" --envenenado-epub-com-scripts
roda "livros --envenenado-sem-posicao"            node "_teste/testa_livros.js" --envenenado-sem-posicao
# A revisao do C15.1: o segundo PDF da sessao (o doc.destroy() do C14) e o
# pacote lido livro a livro, sem o arquivo inteiro na memoria.
roda "livros --envenenado-destroy"                node "_teste/testa_livros.js" --envenenado-destroy
roda "livros --envenenado-zip-inteiro"            node "_teste/testa_livros.js" --envenenado-zip-inteiro
# A revisao do C15.1 pela orquestradora: o mesmo pacote com dois PDFs trocados
# (mesmo id, mesma versao) atualiza pelo hash; o veneno compara so o id.
roda "livros --envenenado-so-id"                  node "_teste/testa_livros.js" --envenenado-so-id
# C15.2 e C15.3: "Este capitulo cobre" no leitor, Confirmar e Corrigir (so a
# materia e o ano do livro), a correcao depois de recarregar e na copia de
# seguranca (os livros nao), e o "Abrir no livro" da aula na pagina do PDF e no
# capitulo do EPUB, so com livro do ano do aluno. Porta 8863.
roda "livros mapa"                                node "_teste/testa_livros_mapa.js"
roda "livros mapa --envenenado-correcao-so-na-memoria" node "_teste/testa_livros_mapa.js" --envenenado-correcao-so-na-memoria
roda "livros mapa --envenenado-sem-ano-na-tela"   node "_teste/testa_livros_mapa.js" --envenenado-sem-ano-na-tela
# 31/10: a pagina desenhada de novo (sumario na mesma pagina, zoom) refazia a
# faixa e apagava a lista do Corrigir aberta; a prova esperava pela pagina que
# ja estava a vista e falhava uma vez em dez. O veneno volta a refazer a faixa.
roda "livros mapa --envenenado-faixa-refeita"     node "_teste/testa_livros_mapa.js" --envenenado-faixa-refeita
# C15.4 e C15.5: "Exportar em PDF" do capitulo 2 com o gabarito dele no mesmo
# arquivo, anexado na aula: o texto do capitulo e DEPOIS o do gabarito do 2 (e
# nao o do 1), o rodape de fonte, nenhum travessao; sem o gabarito; paginas
# escolhidas; o livro sem gabarito diz isso; o EPUB com o aviso. Porta 8864.
roda "livros exportar"                            node "_teste/testa_livros_exportar.js"
roda "livros exportar --envenenado-gabarito-do-outro" node "_teste/testa_livros_exportar.js" --envenenado-gabarito-do-outro
roda "livros exportar --envenenado-sem-fonte"     node "_teste/testa_livros_exportar.js" --envenenado-sem-fonte
roda "livros exportar --envenenado-travessao"     node "_teste/testa_livros_exportar.js" --envenenado-travessao
# Revisao do C15.4: o PDF exportado mora fora da copia de seguranca (a copia
# cresce so o registro), e "Gerar de novo" o refaz depois de restaurar. O
# veneno guarda o PDF no deposito de anexos, que a copia leva.
roda "livros exportar --envenenado-pdf-na-copia"  node "_teste/testa_livros_exportar.js" --envenenado-pdf-na-copia
# C2b: a lista de base (base-v1) importa, vem primeiro com o nome dela e a
# frase de posicao na fonte; as tres listas com a etiqueta de nivel. A regra
# em si e do biblioteca/_prova_kits.py (sem navegador).
roda "lista de base"                              node "_teste/testa_lista_de_base.js"
roda "lista de base --envenenado-base-recusada"   node "_teste/testa_lista_de_base.js" --envenenado-base-recusada
roda "lista de base --envenenado-sem-etiqueta"    node "_teste/testa_lista_de_base.js" --envenenado-sem-etiqueta
roda "titulos e roteiro do fechamento"            node "_teste/testa_titulos_e_roteiro.js"
# C10b: um botao principal por aluno no Fechamento, os formatos em "Mais formatos"
# (cada um entrega o arquivo) e o envio as familias em sequencia, sem gravar nada.
roda "preparar e enviar"                          node "_teste/testa_preparar_e_enviar.js"
# C14: o PDF anexado abre no leitor do aplicativo (PDF.js em vendor/, fora do
# pre-cache), pagina e zoom, a pagina vira folha com o traco salvo, e a segunda
# abertura funciona com a rede cortada.
roda "leitor de pdf"                              node "_teste/testa_leitor_pdf.js"
# C3: a foto e o PDF anexados viram folha da MESMA aula, sem perguntar qual
# (a foto direto, o PDF pelo leitor na pagina escolhida), com o traco salvo;
# o .docx nao ganha a acao, e os tres anexos ficam byte a byte iguais.
roda "anexo como folha"                           node "_teste/testa_anexo_como_folha.js"
# C4: "pago em" no cartao do Fechamento (marcar, trocar o valor, desmarcar), a
# lista de pendentes, recarregar, a copia de seguranca de ida e volta, e o
# documento da familia (janela, PDF e texto) sem citar pagamento.
roda "pago em"                                    node "_teste/testa_pago_em.js"
# A2a: a cópia preparada e o compartilhamento cancelado não atualizam a data;
# download pede confirmação, e share resolvido marca a data.
roda "copia confirmada"                           node "_teste/testa_copia_confirmada.js"
roda "exclusao de aluno em cascata"                node "_teste/testa_exclusao_aluno_cascata.js"
roda "relato e Voltar"                            node "_teste/testa_relato_voltar.js"
roda "copia ZIP e restauracao atomica"              node "_teste/testa_copia_zip.js"
roda "cabecalho tablet em pe"                       node "_teste/testa_cabecalho_tablet_navegador.js"
roda "alvos de toque tablet (B6)"                 node "_teste/testa_alvos_toque_navegador.js"
# C9: o documento do ciclo na tela. A contagem do que abre sozinho (janelas,
# aviso, faixas, dialogos) no codigo da origin/main e no de hoje, igual, com
# controle de que o contador ve; a entrada discreta na ficha; editar, recarregar
# e ver o texto guardado; o texto e o PDF pelos botoes, sem rotulo interno; a
# copia de seguranca leva o ciclo. Porta 8865.
roda "documento do ciclo (tela)"                  node "_teste/testa_documento_do_ciclo_navegador.js"
# FRENTE B (B10): o que o lerKits recusa e o que a tela descarta (lista com
# exercicio que saiu por curadoria). O veneno tira o guarda do app.js, e sem
# ele a aba Biblioteca inteira nao abre.
roda "biblioteca lerKits"                          node "_teste/testa_biblioteca_lerkits.js"
roda "biblioteca lerKits --envenenado-guarda"      node "_teste/testa_biblioteca_lerkits.js" --envenenado-guarda
roda "biblioteca lerKits --envenenado-empate"      node "_teste/testa_biblioteca_lerkits.js" --envenenado-empate
roda "biblioteca lerKits --envenenado-ajuda"       node "_teste/testa_biblioteca_lerkits.js" --envenenado-ajuda
# FRENTE B (B10): toda mudanca na folha avisa quem grava, inclusive o
# cancelamento depois de a borracha ou o arrasto ja terem mudado algo, e a
# lixeira da selecao. Um veneno para cada.
roda "folha avisa mudancas"                        node "_teste/testa_folha_mudancas.js"
roda "folha --envenenado-cancela"                  node "_teste/testa_folha_mudancas.js" --envenenado-cancela
roda "folha --envenenado-lixeira-muda"             node "_teste/testa_folha_mudancas.js" --envenenado-lixeira-muda
roda "folha --envenenado-alca"                     node "_teste/testa_folha_mudancas.js" --envenenado-alca
roda "folha --envenenado-traco-cancelado"          node "_teste/testa_folha_mudancas.js" --envenenado-traco-cancelado
# FRENTE B (B10): retangulo de tapar com posicao que nao e numero nao vai
# para o papel. Sem navegador.
na_secao_navegador=0  # sem Chrome: o --rapido roda
roda "tapar so com numero"                         node "_teste/testa_tapar_numeros.js"
roda "tapar --envenenado-numeros"                  node "_teste/testa_tapar_numeros.js" --envenenado-numeros
na_secao_navegador=1
roda "biblioteca listas --envenenado-palma"         node "_teste/testa_biblioteca_listas.js" --envenenado-palma
roda "biblioteca listas --envenenado-contorno"      node "_teste/testa_biblioteca_listas.js" --envenenado-contorno
# O aparo do tapar nos TRES caminhos: criar, mover e redimensionar.
roda "biblioteca listas --envenenado-apara"         node "_teste/testa_biblioteca_listas.js" --envenenado-apara
# A memoria de qual lista ela mexia tem de atravessar o reinicio do aplicativo.
roda "biblioteca listas --envenenado-lembra"        node "_teste/testa_biblioteca_listas.js" --envenenado-lembra
# FRENTE B (B10): A FOLHA IMPRESSA NAO MUDOU. A unificacao das camadas foi pelo
# lado da TELA de proposito, porque o papel e o que ela entrega ao aluno. A
# prova gera a MESMA folha com o pdf.js de hoje e com o do d80bb90 e compara
# byte a byte e pixel a pixel a 200 dpi, com controle de que o medidor sabe
# acusar (duas paginas diferentes do mesmo PDF dao diferenca aos milhares).
na_secao_navegador=0  # sem Chrome (rasteriza pelo Python): o --rapido roda os quatro
roda "folha impressa igual ao publicado"        node "_teste/testa_folha_impressa_igual.js"
# E O VENENO DELA, que estava FORA da bateria. Guarda fora do portao nao e
# guarda: esta prova e inerte contra o diff que a estreia, e o que lhe da
# sentido e ela saber MORDER no proximo diff. Se as ancoras do veneno deixarem
# de casar, e aqui que se descobre, e nao no dia em que a folha mudar calada.
roda "folha impressa --envenenado-ordem"        node "_teste/testa_folha_impressa_igual.js" --envenenado-ordem
# E o guarda da medida nova: sem o laco do tapar, o retangulo nao sai no papel.
roda "folha impressa --envenenado-tapar"        node "_teste/testa_folha_impressa_igual.js" --envenenado-tapar
# E o guarda do TETO: um contorno desenhado no caminho do PDF estoura o teto.
roda "folha impressa --envenenado-contorno"     node "_teste/testa_folha_impressa_igual.js" --envenenado-contorno-no-papel
na_secao_navegador=1

roda "painel de valores"                        node "_teste/testa_painel_valores.js"
roda "painel de valores --envenenado-aberto"    node "_teste/testa_painel_valores.js" --envenenado-aberto
roda "painel de valores --envenenado-esquece"   node "_teste/testa_painel_valores.js" --envenenado-esquece

# Gerador do pacote da Biblioteca (frente B). Roda sobre a amostra sintetica
# que a propria prova desenha na hora, nos dois modelos de pagina do Portal,
# porque PDF do Portal nao entra no repositorio. Cada trava tem o seu veneno e
# o veneno so conta se reprovar PELO motivo esperado. Fica aqui, e nao em "sem
# navegador", porque a fidelidade renderiza os SVG no Chrome.
roda "gerador da biblioteca"                    python biblioteca/_prova_gerador.py
# O Banco de Questoes (2016 a 2020), sobre um volume sintetico do mesmo modelo.
roda "banco da biblioteca"                      python biblioteca/_prova_banco.py
# C12: o tipo de fonte provas (OBMEP Mirim e ENEM), sobre provas sinteticas dos
# dois formatos, com um veneno por regra do detector. A fidelidade e no Chrome.
roda "provas da biblioteca"                     python biblioteca/_prova_provas.py
# Daqui ate o fim da secao, nada abre Chrome (conferido com CHROME envenenado
# em 26/10): o --rapido roda. O _prova_gerador e o _prova_banco acima ficam no
# navegador porque a trava de fidelidade dos dois renderiza o SVG no Chrome
# (o _prova_banco a chama pelo gerador; sem Chrome ele da 22 de 23).
na_secao_navegador=0
# A kits-v1 e a tempo-v1 (CONTRATO 8e), sobre uma amostra escrita a mao na
# propria prova: um veneno por invariante de I1 a I7, um por linha da tabela dos
# tres niveis, um por campo, e `relaxou` conferido nos dois sentidos. A amostra
# nao sai do gerador de proposito, senao um erro do gerador viraria o esperado.
roda "kits e tempo (regra)"                     python biblioteca/_prova_kits.py
roda "corrigir pacote Mirim C7"                 python biblioteca/_prova_corrigir_mirim_c7.py
# C15.1: o tipo de fonte livros, sobre livros sinteticos (tres PDF, um EPUB e um
# arquivo de 161 MB): o teto de 160 MB nos dois lados da fronteira (o grande
# recusado, listado no relatorio e nunca aberto) e igual ao do aplicativo, o
# manifesto (zip e lista nos dois sentidos, hash, campos, sumario dentro do
# livro), a origem do sumario (marcadores, mapa, nenhum, nav do EPUB) e o
# determinismo. Sem Chrome.
roda "livros (gerador)"                         python biblioteca/_prova_livros.py
# A revisao do C15.1: o pacote cortado recusado ja na espiada, sem ler o
# arquivo inteiro, e o teto de 160 MB do aplicativo. Sem Chrome.
roda "livros (regras)"                          node "_teste/testa_livros_regras.js"
roda "livros (regras) --envenenado-cortado-le-tudo" node "_teste/testa_livros_regras.js" --envenenado-cortado-le-tudo
roda "livros (regras) --envenenado-teto-antigo" node "_teste/testa_livros_regras.js" --envenenado-teto-antigo
# C15.2 e C15.3: o mapa que vale (o do pacote com a correcao dela, so no
# capitulo de mesmo titulo) e os livros do "Abrir no livro" (so os do ano do
# aluno com o assunto). Um veneno pela regra do ano e dois pela correcao.
roda "livros (regras) --envenenado-sem-ano"     node "_teste/testa_livros_regras.js" --envenenado-sem-ano
roda "livros (regras) --envenenado-correcao-ignorada" node "_teste/testa_livros_regras.js" --envenenado-correcao-ignorada
roda "livros (regras) --envenenado-correcao-sem-titulo" node "_teste/testa_livros_regras.js" --envenenado-correcao-sem-titulo
# C15.4 e C15.5: o que vai no PDF exportado (o capitulo sem as respostas do
# livro, e o gabarito daquele capitulo depois, so quando pedido), as paginas
# escolhidas e o rodape de fonte. O veneno deixa as respostas no capitulo.
roda "livros (regras) --envenenado-respostas-no-capitulo" node "_teste/testa_livros_regras.js" --envenenado-respostas-no-capitulo
# Revisao do C15.5: o gabarito do fim do capitulo (achado so pelo lugar) nunca
# tira pagina do capitulo exportado. O veneno volta a regra antiga.
roda "livros (regras) --envenenado-fim-do-capitulo-tira" node "_teste/testa_livros_regras.js" --envenenado-fim-do-capitulo-tira
# C15.5: o passe semiautomatico do gabarito (titulos de respostas, numero do
# capitulo, o fim do capitulo, so as impares, manual do professor, sem texto),
# a trava do casamento medida pelo texto e os venenos dentro da prova (casar
# pela ordem, casar com o seguinte, o fim do capitulo em qualquer lugar,
# "Resposta pessoal" como titulo, a secao sem respostas). Sem Chrome.
roda "livros (gabarito)"                        python biblioteca/_prova_gabaritos.py
# A comparacao pacote a pacote (determinismo e "o que mudou de uma versao para
# a outra") rodando contra si mesma: um veneno por tipo de diferenca que ela
# existe para achar, mais dois controles. A comparacao de verdade precisa dos
# pacotes do Drive e por isso nao roda aqui; o que roda aqui e a prova de que
# ela sabe reprovar, sem a qual o numero que ela imprime nao vale nada.
roda "comparacao de pacotes"                    python biblioteca/_compara_pacotes.py --autoteste
# O limiar que decide se a kits-v1 ganhou do sorteio. Fica no portao porque e o
# numero que decide o projeto, e numero que decide nao vai para o registro sem
# conferencia: alem dos valores que se checam a mao, a cauda binomial e batida
# contra uma contagem por forca bruta de todas as 2^n sequencias.
roda "limiar da comparacao cega"                python biblioteca/_apura_cega.py --autoteste
# O corte das folhas da comparacao cega. Exercicio partido ao meio vira defeito
# da folha disfarcado de juizo sobre a lista, entao o corte tem prova: nenhum
# item entre dois pedacos, nenhum pedaco passando do teto, e cobertura sem
# buraco nem sobreposicao.
roda "corte das folhas cegas"                  node biblioteca/_folhas_cegas.js --autoteste
na_secao_navegador=0

# Duas conferencias aqui, e a primeira e a que pega o defeito de verdade.
#
# 1) O pacote offline tem DUAS listas que precisam bater: os <script src=...>
# do index.html e a lista ARQUIVOS do sw.js. Ela da aula na casa das familias,
# muitas vezes sem sinal: arquivo que o index.html carrega e o cache nao guarda
# vira 503 quando falta rede. Por isso a conferencia sai dos DOIS arquivos de
# HOJE. A versao anterior comparava o sw.js com o sw.js e nunca olhou o
# index.html: nao veria isso nunca. Ate o B14 ela olhava so os scripts de
# figuras/ (o kit, que degradava calado); com o kit fora, ela passou a olhar
# TODO script local do index.html, que e a mesma protecao, maior.
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
# A listagem para aqui: daqui para baixo nao ha prova de navegador, so as
# conferencias do repositorio, que o --rapido ja roda em todo PR.
if [ "$listar" = "1" ]; then
  printf '\nLISTAGEM: %s provas de navegador no portao%s. Nada rodou.\n' "$numero_navegador" \
    "${pn:+, as acima sao as da fatia $pk de $pn}"
  exit 0
fi

titulo "cache do aplicativo"
lista_sw() { printf '%s\n' "$1" | sed -n '/^var ARQUIVOS = \[/,/^\];/p'; }
nome_sw()  { printf '%s\n' "$1" | sed -n "s/^var CACHE = '\(.*\)';.*/\1/p" | head -1; }
# So as ENTRADAS da lista: linha que e um caminho entre aspas, e nada de
# comentario. Procurar o nome no arquivo inteiro nao serve: um comentario do
# proprio sw.js que cite './figuras/solidos.js' satisfaria a trava sozinho.
entradas_sw() { printf '%s\n' "$1" | sed -n "s|^ *'\(\./\)\{0,1\}\([^']*\)' *,\{0,1\} *\$|\2|p"; }

sw_agora=$(tr -d '\r' < sw.js 2>/dev/null || true)
lista_agora=$(entradas_sw "$(lista_sw "$sw_agora")")
# So script LOCAL: endereco com "//" (de fora) nao e do pacote.
scripts_html=$(tr -d '\r' < index.html 2>/dev/null | grep -oE '<script src="[^"]+"' \
  | sed 's|<script src="||; s|"$||; s|^\./||' | grep -v '//' | sort -u)
if [ -z "$lista_agora" ] || [ -z "$scripts_html" ]; then
  printf '  FALHOU  %-24s nao achei a lista ARQUIVOS no sw.js ou os scripts no index.html\n' \
    "scripts no cache"
  falhou=1
else
  fora=""
  for f in $scripts_html; do
    if ! printf '%s\n' "$lista_agora" | grep -Fqx "$f"; then fora="$fora $f"; fi
  done
  if [ -z "$fora" ]; then
    printf '  ok      %-24s os %s scripts do index.html estao na lista do sw.js\n' \
      "scripts no cache" "$(printf '%s\n' "$scripts_html" | wc -l | tr -d ' ')"
  else
    printf '  FALHOU  %-24s o index.html carrega e o sw.js nao guarda:%s\n' "scripts no cache" "$fora"
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
  pulada=1
elif [ "$lista_agora" = "$(entradas_sw "$(lista_sw "$sw_antes")")" ]; then
  printf '  ok      %-24s a lista nao mudou desde a base do merge\n' "nome do cache"
elif [ "$(nome_sw "$sw_agora")" != "$(nome_sw "$sw_antes")" ]; then
  printf '  ok      %-24s lista nova desde a base, cache %s\n' "nome do cache" "$(nome_sw "$sw_agora")"
else
  printf '  FALHOU  %-24s a lista de ARQUIVOS mudou desde a base do merge e o cache continua %s\n' \
    "nome do cache" "$(nome_sw "$sw_agora")"
  falhou=1
fi

# O CONTEUDO DOS ARQUIVOS DO CACHE, e nao so a lista.
#
# A trava de cima compara a LISTA de ARQUIVOS com a base do merge e exige nome
# novo quando ela muda. Ela nao olha o CONTEUDO dos arquivos listados, e dois
# deles sao gerados: './banco/indice.json' e './banco/busca.json' saem do
# gerar_banco.py. A varredura de figuras regenera o banco uma vez por lote, e
# sao mais uns dezessete lotes: cada um muda o conteudo sem mudar a lista.
#
# Sem esta trava, esse merge passa verde e o tablet dela continua servindo o
# banco velho do cache antigo, com o aplicativo novo por cima, ate o proximo
# release que por acaso promova o nome. E o mesmo defeito do incidente de
# sw.js:12-16 por outra porta: some sem erro, e so aparece na casa da familia.
#
# A PROVA VEM ANTES DA CONFERENCIA. O veredito e uma funcao de duas entradas, e
# as quatro combinacoes sao afirmadas aqui antes de a funcao ser usada de
# verdade. Os dois lados do par importam: mudar conteudo sem promover REPROVA, e
# promover sem mudar conteudo PASSA. Sem o segundo lado, uma trava que exigisse
# nome novo sempre ficaria verde e ninguem veria que ela virou carimbo.
veredito_cache() {
  # $1 = mudou conteudo (sim/nao); $2 = nome novo (sim/nao)
  if [ "$1" = "sim" ] && [ "$2" = "nao" ]; then echo "reprova"; else echo "passa"; fi
}
# QUEM DECIDE RECEBE AS FORMAS REAIS, e nao sim/nao ja mastigado.
#
# A versao anterior desta trava provava so o VEREDITO, e o mapeamento das
# entradas ficava numa cadeia solta ao lado. Trocar um caractere ali, um != por
# um =, virava a trava em carimbo: conteudo mudado, cache parado, saida "ok o
# cache subiu para" com o MESMO nome de antes, e a prova continuando 4 de 4 sem
# uma palavra. Numa trava que existe para pegar divergencia, era a categoria se
# fechando sobre si mesma. Agora o mapeamento esta aqui dentro, e as quatro
# asercoes abaixo o exercitam com argumento de verdade.
#
# $1 = lista de mudados (vazia = nada mudou); $2 = nome de agora; $3 = nome da base
decide_cache() {
  if [ -n "$1" ]; then dc_mudou=sim; else dc_mudou=nao; fi
  if [ "$2" != "$3" ]; then dc_novo=sim; else dc_novo=nao; fi
  veredito_cache "$dc_mudou" "$dc_novo"
}
p_cache=0; f_cache=0
afere_cache() {
  obtido=$(decide_cache "$1" "$2" "$3")
  if [ "$obtido" = "$4" ]; then
    p_cache=$((p_cache + 1))
  else
    f_cache=$((f_cache + 1))
    printf '    prova do cache: mudados=[%s] agora=%s antes=%s deu %s, esperado %s\n' \
      "$1" "$2" "$3" "$obtido" "$4"
  fi
}
afere_cache "app.js" apoio-v22 apoio-v22 reprova
afere_cache "app.js" apoio-v23 apoio-v22 passa
afere_cache ""       apoio-v23 apoio-v22 passa
afere_cache ""       apoio-v22 apoio-v22 passa
if [ "$f_cache" != "0" ]; then
  printf '  FALHOU  %-24s a prova da trava nao passou: %s de 4\n' "conteudo no cache" "$p_cache"
  falhou=1
elif [ -z "$base" ] || [ -z "$sw_antes" ] || [ -z "$sw_agora" ]; then
  # A MESMA guarda da trava vizinha, de proposito. Com base presente e sw.js
  # ausente na base, a vizinha dizia INSTAVEL e esta dizia ok verde.
  printf '  INSTAVEL %-23s sem base de merge com sw.js para comparar o conteudo\n' "conteudo no cache"
  pulada=1
else
  # A entrada './' e a raiz e sai como linha VAZIA da extracao, porque o grupo
  # opcional come o './' e o resto casa nada. Quem a remove e este grep -v '^$'.
  #
  # O `|| true` e obrigatorio e nao e enfeite: sob set -e, um grep que filtra a
  # lista inteira devolve 1, a atribuicao devolve 1, e o portao MORRE aqui,
  # calado, antes do resumo e antes das travas seguintes. Uma delas e a que
  # impede nome de aluno de entrar num repositorio publico.
  caminhos=$(printf '%s\n' "$lista_agora" | grep -v '^$' || true)
  mudados=""
  sumidos=""
  fora_do_git=""
  caixa_trocada=""
  # IFS so com quebra de linha, e glob desligado em volta do laco. Sem isso,
  # caminho com espaco vira duas palavras, nenhuma existe, as duas caem no
  # continue, e o arquivo sai da conferencia sem uma linha de aviso.
  #
  # E --literal-pathspecs nos comandos do git, porque set -f desliga o glob do
  # SHELL e o git faz o glob DELE, por dentro, no pathspec. Sem a flag, uma lista
  # pedindo './banco/tudo[1].json' era atestada lendo o irmao 'banco/tudo1.json',
  # que existe, esta rastreado e nao mudou: a trava dava ok sobre o arquivo
  # errado, e o proprio teste de rastreado era enganado pelo mesmo glob.
  ifs_antes=$IFS
  IFS='
'
  set -f
  for c in $caminhos; do
    if [ ! -f "$c" ]; then
      # Caixa trocada quer dizer o literal falhar E o icase achar. Sondar so o
      # icase aqui acusava caixa para arquivo rastreado no caminho EXATO e
      # apagado do disco, que e coisa banal: alguem apaga para regerar e esquece.
      # A pessoa ia comparar maiuscula que nao existe em vez de reparar que o
      # arquivo sumiu e que o install morre no 404.
      if [ -z "$(git ls-files -- ":(literal)$c" 2>/dev/null)" ] \
         && [ -n "$(git ls-files -- ":(literal,icase)$c" 2>/dev/null)" ]; then
        caixa_trocada="$caixa_trocada $c"
      else
        sumidos="$sumidos $c"
      fi
      continue
    fi
    # git diff so enxerga o que o git rastreia. Arquivo do pacote ignorado pelo
    # .gitignore, ou que entrou na lista e ficou fora do commit, seria invisivel
    # para esta trava: ponto cego dentro de uma trava que existe para nao ter
    # ponto cego.
    if [ -z "$(git --literal-pathspecs ls-files -- "$c" 2>/dev/null)" ]; then
      # A SONDA DE CAIXA roda nos DOIS ramos de proposito, e o motivo e que sem
      # ela o MESMO defeito sai com mensagens diferentes conforme o computador:
      # no NTFS o [ -f ] acha 'Core.js' e o git nao, entao caia aqui; num sistema
      # sensivel a caixa o [ -f ] falha e caia nos sumidos. Reprovar certo pelo
      # motivo errado custa a hora de quem procura, que e a licao que este
      # arquivo ja tem escrita na ordem do carregarSerie.
      #
      # A sonda usa o prefixo magico :(literal,icase) e NAO a flag global
      # --icase-pathspecs, e a diferenca importa: a flag de caixa nao desliga o
      # glob, entao 'cor[e].js' casaria 'core.js' e a trava acusaria caixa onde o
      # defeito e outro. A magica combina os dois; ela e a flag global sao
      # mutuamente exclusivas e dao fatal na mesma invocacao, e e por isso que o
      # ls-files e o diff do caminho principal ficam com a flag e as sondas nao.
      if [ -n "$(git ls-files -- ":(literal,icase)$c" 2>/dev/null)" ]; then
        caixa_trocada="$caixa_trocada $c"
      else
        fora_do_git="$fora_do_git $c"
      fi
      continue
    fi
    if ! git --literal-pathspecs diff --quiet "$base" -- "$c" 2>/dev/null; then
      mudados="$mudados $c"
    fi
  done
  set +f
  IFS=$ifs_antes
  nome_agora=$(nome_sw "$sw_agora")
  nome_antes=$(nome_sw "$sw_antes")
  if [ -z "$nome_agora" ] || [ -z "$nome_antes" ]; then
    # Nome vazio passava como "promovido", porque vazio e diferente de v22. Uma
    # reformatacao do sw.js (aspas duplas, const, espaco a mais) faria nome_sw
    # devolver vazio, e a trava imprimiria ok com o nome em branco.
    printf '  FALHOU  %-24s nao consegui ler o nome do cache no sw.js (agora:[%s] base:[%s])\n' \
      "conteudo no cache" "$nome_agora" "$nome_antes"
    falhou=1
  elif [ -n "$caixa_trocada" ] || [ -n "$sumidos" ] || [ -n "$fora_do_git" ]; then
    # UMA falha so, com os TRES motivos: separados em falhas diferentes, quem
    # conserta um roda de novo e so entao descobre o proximo, e cada volta e
    # quinze minutos de portao. A primeira versao disto juntava dois e deixava a
    # caixa trocada de fora, que era o mesmo erro que ela consertava.
    #
    # Cada motivo so imprime a propria linha se tiver o que dizer, e em linha de
    # continuacao indentada: numa linha so, com poucos arquivos, ela passava de
    # mil colunas e enterrava o proprio FALHOU no comeco do paragrafo.
    #
    # If explicito e nao lista curta com ||, que aqui seria segura mas casa o
    # padrao que este arquivo proibe por escrito em outras duas secoes.
    printf '  FALHOU  %-24s a lista pede o que o portao nao consegue conferir\n' "conteudo no cache"
    if [ -n "$caixa_trocada" ]; then
      printf '            caixa diferente da do git, e o GitHub Pages e sensivel a ela:%s\n' "$caixa_trocada"
    fi
    if [ -n "$sumidos" ]; then
      printf '            fora do disco, o install morre no primeiro 404:%s\n' "$sumidos"
    fi
    if [ -n "$fora_do_git" ]; then
      printf '            fora do git, esta trava nao ve o conteudo:%s\n' "$fora_do_git"
    fi
    falhou=1
  else
    if [ "$(decide_cache "$mudados" "$nome_agora" "$nome_antes")" = "reprova" ]; then
      printf '  FALHOU  %-24s mudou de conteudo e o cache continua %s:%s\n' \
        "conteudo no cache" "$nome_agora" "$mudados"
      falhou=1
    elif [ -z "$mudados" ]; then
      printf '  ok      %-24s nenhum arquivo do pacote mudou de conteudo desde a base\n' "conteudo no cache"
    else
      printf '  ok      %-24s%s arquivo(s) do pacote mudaram e o cache subiu para %s\n' \
        "conteudo no cache" "$(printf '%s' "$mudados" | wc -w | tr -d ' ')" "$nome_agora"
    fi
  fi
fi

# A trava da LINHA DE carregarSerie (o literal 'banco/serie-' das series da
# matematica) saiu no B14: o carregarSerie e as series sairam com o material
# autoral, e nao ha mais chave de cache de serie que um app novo possa perder.

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
  pulada=1
fi

# TODA PROVA ESTA NO PORTAO, ou na lista de fora com o motivo escrito.
#
# Em 26/10/2026 havia dez provas de _teste/ que nenhum portao rodava: as frentes
# de UX as escreveram, elas passavam sozinhas no dia do PR, e quatro delas ja
# reprovavam sem ninguem saber (duas presas ao relogio). Prova fora do portao
# nao e guarda: so roda quando alguem lembra.
#
# O que se compara: os arquivos que casam os padroes de prova do repositorio
# contra a lista de caminhos que o `roda` (e o `anota`) recebeu NESTA rodada.
# Quem fica de fora de proposito vai em FORA_DO_PORTAO, uma linha por arquivo,
# com o motivo depois de dois-pontos. Tres reprovas: prova esquecida, entrada
# da lista de fora que nao existe mais (a lista apodrece calada), e arquivo que
# esta nos dois lugares (a lista mente sobre ele).
FORA_DO_PORTAO='
'
# A lista ficou vazia no B14: as treze entradas eram de figuras/, que saiu com o
# material autoral. Prova nova que ficar fora do portao entra aqui, uma linha
# por arquivo, com o motivo depois de dois-pontos.
# $1 = arquivos de prova achados, $2 = chamadas, $3 = lista de fora (so os caminhos)
esquecidas_de() {
  printf '%s\n' "$1" | while IFS= read -r a; do
    [ -n "$a" ] || continue
    printf '%s\n' "$2" | grep -Fqx -- "$a" && continue
    printf '%s\n' "$3" | grep -Fqx -- "$a" && continue
    printf '%s\n' "$a"
  done
}
# A PROVA DA CONFERENCIA VEM ANTES DELA, com os dois lados: um arquivo que nao
# foi chamado nem esta na lista TEM de sair esquecido, e os que foram chamados
# ou estao na lista NAO podem sair.
p_cob=0; f_cob=0
afere_cob() {
  obtido=$(esquecidas_de "$1" "$2" "$3" | tr '\n' ' ')
  if [ "$obtido" = "$4" ]; then p_cob=$((p_cob + 1)); else
    f_cob=$((f_cob + 1))
    printf '    prova da cobertura: deu [%s], esperado [%s]\n' "$obtido" "$4"
  fi
}
afere_cob "_teste/testa_a.js
_teste/testa_b.js
_teste/testa_c.js" "_teste/testa_a.js" "_teste/testa_c.js" "_teste/testa_b.js "
afere_cob "_teste/testa_a.js" "_teste/testa_a.js" "" ""
afere_cob "_teste/testa_a.js" "" "" "_teste/testa_a.js "
# Nome que so COMECA igual nao vale: testa_a.js chamado nao cobre testa_a.js.bak.
afere_cob "_teste/testa_a.js.bak" "_teste/testa_a.js" "" "_teste/testa_a.js.bak "

titulo "toda prova no portao"
# figuras/ e temas/_ferramentas/ sairam no B14 com o material autoral.
achadas=$(ls _teste/testa_*.js _teste/e2e*.js biblioteca/_prova_*.py 2>/dev/null | sort -u || true)
fora_caminhos=$(printf '%s\n' "$FORA_DO_PORTAO" | sed -n 's/^\([^:]*\):.*/\1/p')
n_achadas=$(printf '%s\n' "$achadas" | grep -c . || true)
if [ "$f_cob" != "0" ]; then
  printf '  FALHOU  %-24s a prova da conferencia nao passou: %s de 4\n' "cobertura" "$p_cob"
  falhou=1
elif [ "$n_achadas" -lt 50 ]; then
  # Controle de que o instrumento ve: a listagem que volta quase vazia (rodando
  # da pasta errada, padrao quebrado) faria "nenhuma esquecida" por nao olhar.
  printf '  FALHOU  %-24s so achei %s arquivos de prova; esperava passar de 50\n' "cobertura" "$n_achadas"
  falhou=1
else
  esquecidas=$(esquecidas_de "$achadas" "$chamadas" "$fora_caminhos" | tr '\n' ' ')
  podres=""
  duplas=""
  for a in $fora_caminhos; do
    [ -f "$a" ] || podres="$podres $a"
    if printf '%s\n' "$chamadas" | grep -Fqx -- "$a"; then duplas="$duplas $a"; fi
  done
  if [ -n "$esquecidas" ] || [ -n "$podres" ] || [ -n "$duplas" ]; then
    printf '  FALHOU  %-24s uma prova esta fora do portao sem motivo escrito, ou a lista de fora mente\n' "cobertura"
    if [ -n "$esquecidas" ]; then
      printf '            fora do portao e fora da lista FORA_DO_PORTAO: %s\n' "$esquecidas"
    fi
    if [ -n "$podres" ]; then
      printf '            na lista de fora, mas nao existe mais:%s\n' "$podres"
    fi
    if [ -n "$duplas" ]; then
      printf '            na lista de fora E chamado pelo portao:%s\n' "$duplas"
    fi
    falhou=1
  else
    n_fora=$(printf '%s\n' "$fora_caminhos" | grep -c . || true)
    printf '  ok      %-24s %s arquivos de prova: %s chamados, %s fora com motivo\n' "cobertura" \
      "$n_achadas" "$((n_achadas - n_fora))" "$n_fora"
  fi
fi

printf '\n'
if [ -n "$pn" ] && [ "$rodadas_aqui" = "0" ] && [ "$falhou" = "0" ]; then
  # fatia vazia nao e fatia verde: com mais fatias que provas, a conta esta errada
  printf 'HA FALHA. A fatia %s de %s nao rodou prova nenhuma.\n' "$pk" "$pn"
  exit 1
fi
if [ "$falhou" != "0" ]; then
  printf 'HA FALHA. Nao faca o merge antes de resolver.\n'
elif [ -n "$pn" ]; then
  # So a fatia: o verde dela nao e o portao inteiro, e diz isso. O inteiro e o
  # job portao-navegador do CI, que so fica verde com todas as fatias verdes.
  printf 'FATIA %s DE %s PASSOU: %s das %s provas de navegador rodaram aqui; as outras ficam com as outras fatias.\n' \
    "$pk" "$pn" "$rodadas_aqui" "$numero_navegador"
  if [ "$instavel" != "0" ]; then printf 'Algum teste so passou na segunda vez (INSTAVEL acima).\n'; fi
  if [ "$pulada" != "0" ]; then printf 'Alguma conferencia foi pulada aqui (INSTAVEL acima): nao e teste que falhou.\n'; fi
elif [ "$rapido" = "1" ]; then
  printf 'PORTAO RAPIDO PASSOU. As %s provas de navegador (pulado, acima) NAO rodaram aqui: o merge ainda pede o portao inteiro.\n' "$pulados"
elif [ "$instavel" != "0" ] || [ "$pulada" != "0" ]; then
  if [ "$instavel" != "0" ]; then
    printf 'TUDO PASSOU, mas algum teste so passou na segunda vez (INSTAVEL acima).\n'
    printf 'Nao e impedimento de merge; e aviso de que aquele teste depende de tempo.\n'
  fi
  if [ "$pulada" != "0" ]; then
    printf 'TUDO O QUE RODOU PASSOU, mas alguma conferencia foi pulada (INSTAVEL acima).\n'
  fi
else
  printf 'TUDO PASSOU. Pode seguir para o merge.\n'
fi
exit "$falhou"
