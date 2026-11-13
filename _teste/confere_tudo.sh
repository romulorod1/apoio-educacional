#!/bin/sh
# Roda tudo que precisa passar antes de um merge para a main.
#
# Existe porque a conferencia estava espalhada em quinze comandos e era facil
# esquecer um. Sai com codigo diferente de zero se qualquer coisa falhar, entao
# serve tanto para olhar quanto para travar.
#
#   sh _teste/confere_tudo.sh            o portao inteiro, com Chrome
#   sh _teste/confere_tudo.sh --rapido   tudo menos o que abre navegador
#   sh _teste/confere_tudo.sh --pedaco 2/8
#                                        so as provas de navegador da fatia 2
#                                        de 8 (o CI roda as fatias em maquinas
#                                        paralelas; o que nao abre navegador
#                                        fica com o --rapido)
#   sh _teste/confere_tudo.sh --listar [--pedaco K/N]
#                                        nao roda nada: diz, uma por linha, que
#                                        prova de navegador rodaria (a prova das
#                                        fatias e o testa_pedacos_do_portao)
#   sh _teste/confere_tudo.sh --provas ARQUIVO
#                                        so as provas de navegador cujos
#                                        arquivos estao em ARQUIVO (um caminho
#                                        por linha, como diz o --listar na
#                                        linha "arq"). E o nivel 1 do CI: as
#                                        provas mapeadas pelos arquivos tocados
#                                        no PR (_teste/provas_tocadas.js). Caminho
#                                        da lista que nao casa prova nenhuma e
#                                        HA FALHA, nao pulo calado. Combina com
#                                        --pedaco K/N: so as da lista que caem
#                                        na fatia K (o nivel 1 em oito maquinas).
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
provas_arq=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --rapido) rapido=1 ;;
    --listar) listar=1 ;;
    --pedaco) pedaco_dado=1; pedaco="${2:-}"; if [ "$#" -gt 1 ]; then shift; fi ;;
    --provas) provas_arq="${2:-}"; if [ "$#" -gt 1 ]; then shift; fi; [ -n "$provas_arq" ] || { printf -- '--provas pede o arquivo com a lista\n'; exit 2; } ;;
    *) printf 'opcao desconhecida: %s\n' "$1"; exit 2 ;;
  esac
  shift
done

# AS FATIAS DO PORTAO INTEIRO. O inteiro passou de oitenta minutos numa maquina
# so, e quase todo esse tempo e Chrome, uma prova depois da outra. No CI ele
# roda em N maquinas paralelas (hoje 8), cada uma com a sua fatia. A divisao e
# pelo TEMPO MEDIDO de cada prova (_teste/tempos_do_portao.tsv), gulosa: a mais
# demorada primeiro, para a fatia mais leve (_teste/divide_portao.js; prova nova
# sem tempo recebe a mediana). A divisao pela contagem deixou uma fatia em 32
# min e outra em 47. A conta e a mesma em toda maquina, porque a lista e a
# tabela sao as mesmas, entao as fatias nao se cruzam e juntas cobrem todas; quem
# prova isso e o testa_pedacos_do_portao, sem navegador, no --rapido.
minhas_provas=""
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
  # Os nomes das provas desta fatia. Se o divisor falhar a fatia NAO pode virar
  # "nenhuma prova" calada (nem o portao inteiro): sai com 2.
  minhas_provas=$(node _teste/divide_portao.js "$pk" "$pn") || { printf 'nao consegui dividir o portao em fatias (divide_portao.js)\n'; exit 2; }
fi
# Nivel 1 do CI: so as provas de navegador da lista. Lista ilegivel ou vazia
# nao vira "nenhuma prova" calada nem o portao inteiro: sai com 2.
provas_lista=""
if [ -n "$provas_arq" ]; then
  if [ "$rapido" = "1" ]; then printf -- '--provas nao combina com --rapido\n'; exit 2; fi
  [ -f "$provas_arq" ] || { printf 'lista de provas nao existe: %s\n' "$provas_arq"; exit 2; }
  provas_lista=$(tr -d '\r' < "$provas_arq" | grep . || true)
  [ -n "$provas_lista" ] || { printf 'a lista de provas esta vazia: %s\n' "$provas_arq"; exit 2; }
fi
provas_vistas=""
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
    provas_vistas="$provas_vistas
${2:-}"
    if [ -n "$pn" ] && ! printf '%s\n' "$minhas_provas" | grep -Fxq -- "$nome"; then
      return 0
    fi
    if [ -n "$provas_lista" ] && ! printf '%s\n' "$provas_lista" | grep -Fxq -- "${2:-}"; then
      return 0
    fi
  elif [ -n "$pn" ] || [ -n "$provas_lista" ]; then
    # o que nao abre navegador roda no portao-rapido, em todo PR
    return 0
  fi
  if [ "$listar" = "1" ]; then
    if [ "$na_secao_navegador" = "1" ]; then printf '  vai     %s %s\n  arq     %s %s\n' "$numero_navegador" "$nome" "$numero_navegador" "${2:-}"; fi
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
roda "cobertura C7 valida pacotes" python biblioteca/_prova_cobertura_c7.py
roda "dinheiro"      node _teste/testa_dinheiro.js
roda "cartao do mes" node _teste/testa_cartao.js
roda "proposta"      node _teste/testa_proposta.js
roda "textos e novidades" node _teste/testa_textos_e_novidades.js
# todo veneno pedido por este portão existe na prova chamada (um nome errado
# roda calado como modo normal e passa)
roda "venenos existem" node _teste/testa_venenos_existem.js
roda "venenos existem --envenenado-nome-falso" node _teste/testa_venenos_existem.js --envenenado-nome-falso
roda "venenos existem --envenenado-letra-trocada" node _teste/testa_venenos_existem.js --envenenado-letra-trocada
roda "venenos existem --envenenado-prefixo" node _teste/testa_venenos_existem.js --envenenado-prefixo
# Nada da fonte privada de anos iniciais no repositorio publico: a arvore de
# git ls-files e o historico que o merge leva (origin/main..HEAD; no push na
# main, o before do evento), pelo TIPO (PDF, zip, gzip, 7z, rar e companhia
# reprovam pelos bytes do comeco) e pelas marcas no nome e no conteudo. O SHA
# contra a lista privada so roda na maquina que tem a lista; sem ela, a prova
# diz que pulou e nao reprova (no CI nao ha segredo nenhum). Fica nesta secao, e nao no
# mapa, para rodar no portao-rapido em TODO push, mexa o PR no que mexer:
# arquivo novo de qualquer nome e pego. O veneno monta um repositorio temporario
# com cada caso e tem de acusar cada um.
roda "sem fonte privada" node _teste/testa_sem_fonte_privada.js
roda "sem fonte privada --envenenado-com-fonte-privada" node _teste/testa_sem_fonte_privada.js --envenenado-com-fonte-privada
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
roda "vagos e repeticoes (F3)" node _teste/testa_vagos_repeticao.js
# Remarcar aula de repeticao para um dia da PROPRIA serie, em mes nao lancado,
# nao apaga a fixa daquele dia (12/11/2026: dezembro dava 1080 em vez de 1200).
# So a ocorrencia original do dia ocupa a vaga; a aula vinda de outro dia, ao
# sair de novo ou ser apagada, nao exclui o dia. E o lado da SOBRA: dado antigo
# (id aleatorio) com o mes relancado (editarSerie, materializadoAte nulo ou
# recuado) nao dobra. Tres venenos, um de cada lado: a regra antiga erra a
# falta; "nunca e original" erra a sobra (o dia apagado volta); "lancado so
# pelo campo" da gemea a aula antiga que so mudou de horario.
roda "remarcar na repeticao" node _teste/testa_remarcar_repeticao.js
roda "remarcar na repeticao --envenenado-regra-antiga" node _teste/testa_remarcar_repeticao.js --envenenado-regra-antiga
roda "remarcar na repeticao --envenenado-nunca-original" node _teste/testa_remarcar_repeticao.js --envenenado-nunca-original
roda "remarcar na repeticao --envenenado-lancado-so-pelo-campo" node _teste/testa_remarcar_repeticao.js --envenenado-lancado-so-pelo-campo
roda "sugestoes matematica"  node _teste/testa_sugestoes_matematica.js
roda "virada anual"          node _teste/testa_virada_anual.js
# A regra do merge na main (_teste/merge_seguro.sh), que segura o processo
# quando a protecao de branch do GitHub sumir com o repositorio privado.
# F7 (#159): no "todas" e no "desta em diante", a aula com relato fica de fora
# (core, alvosDoEscopo); o veneno tira a regra e so o lado da aula com relato cai.
roda "escopo sem a aula com relato" node _teste/testa_escopo_relato.js
roda "escopo sem a aula com relato --envenenado-sem-regra-do-relato" node _teste/testa_escopo_relato.js --envenenado-sem-regra-do-relato
roda "escopo sem a aula com relato --envenenado-so-o-relato" node _teste/testa_escopo_relato.js --envenenado-so-o-relato
# F7 (decisao do dono, 13/11): a aula passada de mes ja pago tambem fica fora do lote; os
# venenos tiram a regra, protegem toda passada e protegem a futura.
roda "escopo sem a aula paga" node _teste/testa_escopo_pago.js
roda "escopo sem a aula paga --envenenado-sem-regra-da-paga" node _teste/testa_escopo_pago.js --envenenado-sem-regra-da-paga
roda "escopo sem a aula paga --envenenado-protege-toda-passada" node _teste/testa_escopo_pago.js --envenenado-protege-toda-passada
roda "escopo sem a aula paga --envenenado-protege-futura" node _teste/testa_escopo_pago.js --envenenado-protege-futura
# F7 (rodada 5): o Encerrar da ficha e a mudanca de padrao passam pela mesma regra; os venenos
# tiram a regra do Encerrar, fazem ele guardar tudo e deixam o "desta em diante" criar serie ao contrario.
roda "encerrar repeticao" node _teste/testa_encerrar_repeticao.js
roda "encerrar repeticao --envenenado-encerrar-sem-regra" node _teste/testa_encerrar_repeticao.js --envenenado-encerrar-sem-regra
roda "encerrar repeticao --envenenado-encerrar-guarda-tudo" node _teste/testa_encerrar_repeticao.js --envenenado-encerrar-guarda-tudo
roda "encerrar repeticao --envenenado-serie-ao-contrario" node _teste/testa_encerrar_repeticao.js --envenenado-serie-ao-contrario
roda "merge seguro"          node _teste/testa_merge_seguro.js
# O guarda de merge no CI (item 13c): o guarda_merge.js julga pelo merge_seguro
# e publica o status portao-merge na cabeca que julgou. Com gh e git falsos:
# pending no comeco, success ou failure com o motivo, cabeca que andou nao
# publica, fork e pulado, e o merge nunca e chamado; quando a main anda, todos os
# PRs abertos sao rejulgados (o caso dos dois PRs com a mesma versao); o guarda
# nao julga a si mesmo (com controle sem a regra); e o workflow so roda codigo da
# main, sem checkout da cabeca do PR, com so a escrita de status e sem strict.
roda "guarda de merge"       node _teste/testa_guarda_merge.js
# 13f: VERSAO e CACHE sao gerados na publicacao (_teste/versao_publicada.js) e
# ficam fixos no repositorio. A regra do merge: o PR nao os muda, e o PR que leva
# arquivo do site traz novidades/<nome>.txt. A prova a exercita dos dois lados e
# num repositorio de mentira pelo caminho real do --conferir, inclusive o ramo
# atras de uma main que andou com outro PR do app (o conflito que o 13f tira).
# Os venenos tiram uma exigencia de cada vez, e os casos dela TEM de sair
# errados. A conferencia do repositorio roda mais abaixo, na secao do cache.
roda "versao no deploy"      node _teste/testa_ordem_versao.js
roda "versao no deploy --envenenado-sem-novidade" node _teste/testa_ordem_versao.js --envenenado-sem-novidade
roda "versao no deploy --envenenado-versao-livre" node _teste/testa_ordem_versao.js --envenenado-versao-livre
# O gerador da publicacao: o contador sobe exatamente quando o que o tablet
# baixa muda, so cresce, cada novidade leva a versao do commit que a trouxe, e a
# primeira publicacao sai MAIOR que o valor fixo do repositorio (1.42.121 e
# v201), que e o piso. Com os venenos da regra de contagem (conta tudo, esquece
# o banco) dentro da prova.
roda "versao publicada"      node _teste/testa_versao_publicada.js
# As fatias do portao inteiro no CI: toda prova de navegador em exatamente uma
# fatia, para qualquer numero de fatias, com controle que reprova.
roda "fatias do portao"      node _teste/testa_pedacos_do_portao.js
# B4: o deploy no Cloudflare Pages so depois do portao inteiro verde na main,
# com venenos, e o site montado com tudo o que o aplicativo pede.
roda "publica cloudflare (B4)" node _teste/testa_publica_cloudflare.js
# O endpoint de IA (fase 1 do projeto IA no app): login, lista de uids, limites,
# modelo decidido no servidor, erro traduzido e registro sem conteudo. Sem rede.
roda "endpoint de IA"         node _teste/testa_ia_endpoint.js
# O mesmo empacotamento que o deploy faz (npm ci e wrangler pages functions
# build), antes do merge: sem ele, um import quebrado so apareceria travando
# o deploy da main. Precisa do registro do npm; sem rede, falha.
roda "endpoint de IA (empacota)" node _teste/testa_ia_empacota.js
# O planejamento de estudos com IA (fase 2): o modulo puro (pedido, leitura da
# resposta, ajuste com o content intacto, a folha de uma pagina), dados sinteticos.
roda "planejamento com IA (fase 2)" node _teste/testa_planejamento.js
# o salvar com a gravacao pendente: a mudanca no meio grava de novo, com o mesmo id
roda "planejamento (salvar pendente)" node _teste/testa_planejamento_salvar.js
roda "planejamento --envenenado-zera-sem-comparar" node _teste/testa_planejamento_salvar.js --envenenado-zera-sem-comparar
# O assistente so de leitura com IA (fase 3): cada ferramenta sobre um banco
# sintetico CONGELADO (nada grava, byte a byte), o laco com o content intacto,
# o teto de 5 voltas e as 20 frases de datas relativas.
roda "assistente com IA (fase 3)" node _teste/testa_assistente.js
# O assistente que GRAVA uma aula (fase 4a): cada proposta conferida contra o
# banco nos dois lados, o efeito igual ao da funcao da tela, as tres saidas do
# cancelamento com o dinheiro, o K2 aula por aula (veneno: 'seguintes') e nada
# grava sem Confirmar (banco congelado).
roda "assistente que grava (fase 4a)" node _teste/testa_assistente_grava.js
# Politica de testes por checkpoint (09/11/2026): o nivel 1 (quais provas de
# navegador rodam pelos arquivos tocados, com o mapa em mapa_provas.tsv) e o
# nivel 3 (a main reaproveita a bateria inteira se o tree for igual ao da cabeca
# do PR que passou). Sem navegador.
roda "provas tocadas (nivel 1)" node _teste/testa_provas_tocadas.js
roda "arvore da main (nivel 3)" node _teste/testa_arvore_da_main.js
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
# Todo var(--x) do CSS e do app tem definicao (ou e posto pelo JS, com nome):
# a F1 tirou a --letra-3 e o aviso do #136 caiu na letra herdada, calado.
roda "vars definidas"         node _teste/testa_vars_definidas.js
roda "vars definidas --envenenado-letra-3" node _teste/testa_vars_definidas.js --envenenado-letra-3
roda "vars definidas --envenenado-excecao-velha" node _teste/testa_vars_definidas.js --envenenado-excecao-velha
# B6: alvos de toque de 44 px e tipografia base
roda "alvos de toque (B6)"    node _teste/testa_alvos_toque.js
# B12: nenhuma cor literal fora do :root no styles.css e no maximo 6 tamanhos de
# letra; os venenos (cor solta, setimo tamanho) TEM de reprovar, e regra que usa
# variavel nao pode ser acusada.
roda "sistema visual (B12)"   node _teste/testa_sistema_visual.js

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
         testa_desenho_incremental \
         testa_documento_familia_navegador \
         testa_tabela_no_app \
         testa_ano_cadastro \
         testa_sugestoes_matematica_navegador \
         testa_virada_anual_navegador \
         testa_zoom_calendario_navegador \
         testa_dominio_navegador \
         testa_sondagem_navegador \
         testa_relogio_padrao \
         e2e e2e_correcoes; do
  roda "$t" node "_teste/$t.js"
done
# O RELOGIO FIXO PADRAO do _bib_navegador (a bomba-relogio de 01/01/2027: o app
# abre a virada anual sozinho num relogio de 2027 em diante). A prova simula o
# mundo em 02/01/2027 e confere que a virada NAO abre com o padrao e ABRE com
# { relogioReal: true }; o veneno serve o helper sem o padrao e a virada tem de
# abrir ("VENENO visto").
roda "relogio padrao --envenenado-sem-padrao"   node "_teste/testa_relogio_padrao.js" --envenenado-sem-padrao
# F6 (#157): a janela da aula com a grade antiga (cartoes de altura fixa, cada um
# com rolagem propria, o "Escrever a mao" cortado). A prova de rolagem e da
# primeira dobra tem de ve-la ("VENENO visto").
roda "modal aula --envenenado-grade-antiga"     node "_teste/testa_modal_aula_navegador.js" --envenenado-grade-antiga

# D2: o service worker com cache primeiro. Fechar o aplicativo sem tocar no
# aviso nao troca a versao (o navegador ativa o worker em espera sozinho, e a
# escolha gravada segura), a instalacao que falha pela metade nao vira aviso, a
# janela com gravacao pendente fica na versao dela, e a abertura com a rede
# segurando 40 s nao espera a rede. O --migracao e o --corte-sobre-a-main partem
# de um commit fixo de antes do D2 (a main com o B8b), lido do git: o CI tem o
# historico inteiro (fetch-depth 0). O corte cai no meio do install com o mesmo
# nome de cache da main, e o app tem de abrir sem rede; o veneno devolve a guarda
# antiga, que apagava o cache ativo, e a trava tem de ve-lo.
roda "atualizacao apos fechar"                  node "_teste/testa_atualizacao_apos_fechar.js"
roda "atualizacao --migracao"                   node "_teste/testa_atualizacao_apos_fechar.js" --migracao
roda "atualizacao --corte-sobre-a-main"         node "_teste/testa_atualizacao_apos_fechar.js" --corte-sobre-a-main
roda "atualizacao corte --envenenado-apaga-ativo" node "_teste/testa_atualizacao_apos_fechar.js" --corte-sobre-a-main --envenenado-apaga-ativo
# D2b: a versao aberta acha no cache dela o arquivo que saiu da lista nova, sem
# rede; o veneno volta a regra de servir do cache so o que esta na lista do
# worker novo, e a trava tem de ve-lo. E a troca do "Atualizar agora" e inteira
# com a rede segurando 40 s e o processador lento, nos dois caminhos.
roda "atualizacao --lista-encolhe"              node "_teste/testa_atualizacao_apos_fechar.js" --lista-encolhe
roda "atualizacao lista --envenenado-lista-do-worker" node "_teste/testa_atualizacao_apos_fechar.js" --lista-encolhe --envenenado-lista-do-worker
roda "atualizacao --troca-atomica"              node "_teste/testa_atualizacao_apos_fechar.js" --troca-atomica
# D2b: abrir o aplicativo no meio do download da versao nova nao apaga o cache
# em obra; o veneno tira a marca 'instalando' da limpeza.
roda "atualizacao --abre-no-meio-do-install"    node "_teste/testa_atualizacao_apos_fechar.js" --abre-no-meio-do-install
roda "atualizacao meio --envenenado-sem-marca"  node "_teste/testa_atualizacao_apos_fechar.js" --abre-no-meio-do-install --envenenado-sem-marca
roda "atualizacao --falha-instalacao"           node "_teste/testa_atualizacao_apos_fechar.js" --falha-instalacao
roda "atualizacao --duas-janelas"               node "_teste/testa_atualizacao_apos_fechar.js" --duas-janelas
roda "atualizacao --rede-lenta"                 node "_teste/testa_atualizacao_apos_fechar.js" --rede-lenta

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
roda "biblioteca importar --envenenado-aviso-fica" node "_teste/testa_biblioteca_importar.js" --envenenado-aviso-fica
roda "importar varios"                           node "_teste/testa_biblioteca_importar_varios.js"
roda "importar varios --envenenado-para-na-falha"   node "_teste/testa_biblioteca_importar_varios.js" --envenenado-para-na-falha
roda "importar varios --envenenado-reimporta-igual" node "_teste/testa_biblioteca_importar_varios.js" --envenenado-reimporta-igual
roda "importar varios --envenenado-le-todos-antes"  node "_teste/testa_biblioteca_importar_varios.js" --envenenado-le-todos-antes
roda "importar varios --envenenado-livro-velho-volta" node "_teste/testa_biblioteca_importar_varios.js" --envenenado-livro-velho-volta
# FRENTE B: a aba Biblioteca (sem pacote, "Em construcao"; com pacote, serie,
# modulo, aula, miniaturas sob demanda, lista de 40 abaixo de 2 s, tela cheia,
# busca "bhaskara" agrupada, abrir como folha). O modo envenenado serve um app.js
# que ignora os apelidos do pacote, e "bhaskara" tem de perder as listas.
roda "biblioteca navegar"                       node "_teste/testa_biblioteca_navegar.js"
roda "biblioteca navegar --envenenado-apelidos" node "_teste/testa_biblioteca_navegar.js" --envenenado-apelidos
# B1: a navegacao com a Biblioteca. O trilho lateral do tablet (o "+" no alto,
# Agenda, Alunos, Biblioteca, Fechamento, Ajustes no pe) e a barra de baixo do
# celular com a Biblioteca, a 360, 390 e 412 px e a 360 com a letra a 130%. O
# veneno deixa a coluna da barra encolher abaixo do rotulo, e o "Fechamento"
# estourado tem de ser visto.
roda "navegacao biblioteca"                     node "_teste/testa_navegacao_biblioteca.js"
roda "navegacao biblioteca --envenenado-rotulo-corta" node "_teste/testa_navegacao_biblioteca.js" --envenenado-rotulo-corta
# B2: a aba Biblioteca do tablet por disciplina e ano, com os livros
# sinteticos, o Continuar lendo e a tela do livro com o sumario clicavel (o
# capitulo abre o leitor na pagina do arquivo dele). O veneno abre todo
# capitulo na pagina 1, e a prova tem de ver.
roda "biblioteca livros tela"                   node "_teste/testa_biblioteca_livros_tela.js"
roda "biblioteca livros tela --envenenado-capitulo-abre-pagina-errada" node "_teste/testa_biblioteca_livros_tela.js" --envenenado-capitulo-abre-pagina-errada
roda "biblioteca livros tela --envenenado-zoom-sem-ancora" node "_teste/testa_biblioteca_livros_tela.js" --envenenado-zoom-sem-ancora
roda "biblioteca livros tela --envenenado-giro-sem-ancora-guardada" node "_teste/testa_biblioteca_livros_tela.js" --envenenado-giro-sem-ancora-guardada
roda "biblioteca livros tela --envenenado-largura-vai-ao-alto" node "_teste/testa_biblioteca_livros_tela.js" --envenenado-largura-vai-ao-alto
roda "biblioteca livros tela --envenenado-vizinhas-sem-desenho" node "_teste/testa_biblioteca_livros_tela.js" --envenenado-vizinhas-sem-desenho
roda "biblioteca livros tela --envenenado-canvas-sem-soltar" node "_teste/testa_biblioteca_livros_tela.js" --envenenado-canvas-sem-soltar
roda "biblioteca livros tela --envenenado-sumario-dos-marcadores" node "_teste/testa_biblioteca_livros_tela.js" --envenenado-sumario-dos-marcadores
# B1 (revisao cega do #192): a navegacao sai da pagina do assunto; o veneno a
# deixa presa, e ela volta no Limpar e no Voltar do modulo.
roda "biblioteca livros tela --envenenado-pagina-presa" node "_teste/testa_biblioteca_livros_tela.js" --envenenado-pagina-presa
# P2: a busca em tres blocos (Assuntos, Capitulos nos livros, Listas e
# exercicios). Veneno dos dois lados no bloco Assuntos (o termo so de capitulo
# entra nele; o termo do assunto some dele), e os dois casos reais de
# 13/11/2026: com o ano escrito, o livro de outro ano que casa so no texto
# volta ("volume 9o ano"), e os assuntos de outro ano ficam no mesmo nivel
# ("volume 8o ano"). Cada veneno vai direto a secao 11 e tem de ser visto.
roda "biblioteca livros tela --envenenado-capitulo-vira-assunto" node "_teste/testa_biblioteca_livros_tela.js" --envenenado-capitulo-vira-assunto
roda "biblioteca livros tela --envenenado-assunto-sumido" node "_teste/testa_biblioteca_livros_tela.js" --envenenado-assunto-sumido
roda "biblioteca livros tela --envenenado-ano-nao-filtra" node "_teste/testa_biblioteca_livros_tela.js" --envenenado-ano-nao-filtra
roda "biblioteca livros tela --envenenado-outros-anos-juntos" node "_teste/testa_biblioteca_livros_tela.js" --envenenado-outros-anos-juntos
# Fatia 2 do leitor: pinca e duplo toque no livro sintetico de 400 paginas,
# com toques de verdade do Chrome. O ponto sob os dedos fica sob eles (24 px),
# o duplo toque leva o ponto ao meio e volta, a caneta nao da zoom e um dedo
# rola. O veneno ancora o gesto no meio da tela, e a prova tem de ver.
roda "leitor pinca"                              node "_teste/testa_leitor_pinca.js"
roda "leitor pinca --envenenado-gesto-sem-ponto" node "_teste/testa_leitor_pinca.js" --envenenado-gesto-sem-ponto
roda "leitor pinca --envenenado-gesto-grava-pela-ancora" node "_teste/testa_leitor_pinca.js" --envenenado-gesto-grava-pela-ancora
# Fatia 3 do leitor: nitido em qualquer zoom e mais rapido no escaneado, com
# densidade de tela 2. No zoom maximo, em pe e deitado, a nitidez fica em 1,9
# ou mais (o canvas de detalhe) e os pixels de canvas vivos em 16 milhoes ou
# menos; parada a rolagem, a pagina seguinte NA DIRECAO dela ja tem canvas; o
# escaneado sai primeiro a meia densidade. Um veneno para cada peca.
roda "leitor nitidez"                               node "_teste/testa_leitor_nitidez.js"
roda "leitor nitidez --envenenado-sem-detalhe"      node "_teste/testa_leitor_nitidez.js" --envenenado-sem-detalhe
roda "leitor nitidez --envenenado-sem-teto"         node "_teste/testa_leitor_nitidez.js" --envenenado-sem-teto
roda "leitor nitidez --envenenado-direcao-errada"   node "_teste/testa_leitor_nitidez.js" --envenenado-direcao-errada
roda "leitor nitidez --envenenado-sem-meia-densidade" node "_teste/testa_leitor_nitidez.js" --envenenado-sem-meia-densidade
# Fatia 7 do leitor: texto selecionavel sobre a pagina. Na p. 206 a camada de
# texto existe, arrastar pela linha desenhada e copiar traz "Exercicio 206", a
# caneta (pen) nao seleciona, so as paginas desenhadas tem texto vivo e o
# escaneado nao tem camada e diz a frase uma vez. Um veneno por criterio.
roda "leitor texto"                                 node "_teste/testa_leitor_texto.js"
roda "leitor texto --envenenado-sem-camada"         node "_teste/testa_leitor_texto.js" --envenenado-sem-camada
roda "leitor texto --envenenado-sem-selecao"        node "_teste/testa_leitor_texto.js" --envenenado-sem-selecao
roda "leitor texto --envenenado-caneta-seleciona"   node "_teste/testa_leitor_texto.js" --envenenado-caneta-seleciona
roda "leitor texto --envenenado-texto-sem-soltar"   node "_teste/testa_leitor_texto.js" --envenenado-texto-sem-soltar
roda "leitor texto --envenenado-escaneado-com-camada" node "_teste/testa_leitor_texto.js" --envenenado-escaneado-com-camada
roda "leitor texto --envenenado-aviso-repetido"     node "_teste/testa_leitor_texto.js" --envenenado-aviso-repetido
roda "leitor texto --envenenado-sem-fim-do-conteudo" node "_teste/testa_leitor_texto.js" --envenenado-sem-fim-do-conteudo
roda "leitor texto --envenenado-camada-visivel"     node "_teste/testa_leitor_texto.js" --envenenado-camada-visivel
roda "leitor texto --envenenado-letra-fora-da-camada" node "_teste/testa_leitor_texto.js" --envenenado-letra-fora-da-camada
# B6: o assunto lado a lado. A tabela de um assunto com os livros sinteticos do
# 6o ano (um trata em dois capitulos, um sem vinculo no mapa, dois sem mapa
# revisado): o capitulo e as paginas do arquivo em cada celula, as tres entradas
# (aba, painel do capitulo, aula), a busca que atravessa
# os anos e a correcao dela. Os venenos trocam as duas ausencias, contam o mapa
# vazio como revisado e o livro parcialmente confirmado como revisado; a prova
# tem de ver cada um.
roda "assunto lado a lado"                      node "_teste/testa_assunto_lado_a_lado.js"
roda "assunto lado a lado --envenenado-nao-trata-vira-sem-mapa" node "_teste/testa_assunto_lado_a_lado.js" --envenenado-nao-trata-vira-sem-mapa
roda "assunto lado a lado --envenenado-mapa-vazio-nao-trata" node "_teste/testa_assunto_lado_a_lado.js" --envenenado-mapa-vazio-nao-trata
roda "assunto lado a lado --envenenado-parcial-nao-trata" node "_teste/testa_assunto_lado_a_lado.js" --envenenado-parcial-nao-trata
# T2 (listas): o bloco "Teoria e exercicios" da pagina do assunto, numa pagina
# de prova (a pagina do assunto e de outra executora), a 1280x800, 800x1280 e
# 412x915: as quatro secoes, o exercicio grande numa coluna, nada marcado, o
# selo graduado com o "Para mim" por cima, Abrir e Anexar pelos caminhos de
# sempre e o vazio numa linha.
roda "bloco teoria e exercicios"                node "_teste/testa_bloco_teoria_exercicios_navegador.js"
roda "bloco teoria e exercicios --envenenado-sem-outro-ano" node "_teste/testa_bloco_teoria_exercicios_navegador.js" --envenenado-sem-outro-ano
# C12: os pacotes de provas (OBMEP Mirim por nivel e ENEM) importam, as abas vao
# do 2o ao 5o ano e os assuntos do aplicativo aparecem como modulos. O modo
# envenenado serve o app.js que so espalhava o Banco pelas series equivalentes.
roda "biblioteca mirim"                         node "_teste/testa_biblioteca_mirim.js"
roda "biblioteca mirim --envenenado-equivalentes" node "_teste/testa_biblioteca_mirim.js" --envenenado-equivalentes
# e o "Diversos" das provas nao vira assunto da aula: o veneno trata todo modulo
# de prova como assunto
roda "biblioteca mirim --envenenado-diversos"   node "_teste/testa_biblioteca_mirim.js" --envenenado-diversos
# C5: o pacote dos Cadernos de Apoio da SME-SP (campos novos tom, licenca,
# atribuicao e dificuldade nula) importa sem mudar o app, os assuntos viram
# modulos do 3o e do 7o ano e a atribuicao aparece em cada cartao. O veneno
# serve o app.js sem a origem no cartao.
roda "biblioteca cadernos sme"                 node "_teste/testa_biblioteca_cadernos_sme.js"
roda "biblioteca cadernos sme --envenenado-sem-origem" node "_teste/testa_biblioteca_cadernos_sme.js" --envenenado-sem-origem
# L6: o credito que a licenca da fonte pede (atribuicao, licenca e link do
# item) no cartao da lista do assunto, na previa e na edicao da lista pronta,
# na tela cheia, queimado no recorte do "Abrir como folha" e da lista como
# folha, e no bloco "Creditos" da lista e do gabarito em PDF, sem depender da
# caixa "origem"; item sem os campos nao ganha linha. Um veneno por superficie.
roda "biblioteca credito da licenca"           node "_teste/testa_biblioteca_credito.js"
roda "biblioteca credito da licenca --envenenado-cartao" node "_teste/testa_biblioteca_credito.js" --envenenado-cartao
roda "biblioteca credito da licenca --envenenado-visor" node "_teste/testa_biblioteca_credito.js" --envenenado-visor
roda "biblioteca credito da licenca --envenenado-previa" node "_teste/testa_biblioteca_credito.js" --envenenado-previa
roda "biblioteca credito da licenca --envenenado-edicao" node "_teste/testa_biblioteca_credito.js" --envenenado-edicao
roda "biblioteca credito da licenca --envenenado-link" node "_teste/testa_biblioteca_credito.js" --envenenado-link
roda "biblioteca credito da licenca --envenenado-abrir" node "_teste/testa_biblioteca_credito.js" --envenenado-abrir
roda "biblioteca credito da licenca --envenenado-listafolha" node "_teste/testa_biblioteca_credito.js" --envenenado-listafolha
roda "biblioteca credito da licenca --envenenado-pdf" node "_teste/testa_biblioteca_credito.js" --envenenado-pdf
# O gabarito resolvido por agente e conferido: o item sem solucao que traz
# gabarito (origem agente-conferido) mostra as respostas e, sempre, a marca
# "Resposta conferida por duas IAs" na tela cheia e no gabarito do PDF, sem
# depender da caixa "origem"; item sem o campo nao ganha nada. Um veneno por
# superficie.
roda "gabarito do agente"                     node "_teste/testa_gabarito_agente.js"
roda "gabarito do agente --envenenado-sem-marca-visor" node "_teste/testa_gabarito_agente.js" --envenenado-sem-marca-visor
roda "gabarito do agente --envenenado-sem-marca-pdf" node "_teste/testa_gabarito_agente.js" --envenenado-sem-marca-pdf
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
# B4: a faixa "O aplicativo mudou de endereço" so na origem github.io (nunca no
# pages.dev nem no local), o app seguindo com os dados, e o activate do sw.js
# sem tocar cache de outra origem. Servidor proprio na 8881, sem internet.
roda "mudou de endereco (B4)"                   node "_teste/testa_mudou_de_endereco_navegador.js"
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
# antigo e tem de acusar os tres caminhos que passam por ele; --envenenado-escreve-no-pedido
# faz o escrever responder no pedido e tem de acusar oito dos nove (o
# registrarHistorico poda o historico depois de gravar, e a leitura da poda
# espera a escrita confirmar). A linha da reprovacao se ve com --controle, que
# nao entra aqui porque tem de falhar.
roda "salvar grava no commit"                   node "_teste/testa_store_grava_no_commit.js"
roda "salvar --envenenado-grava-no-pedido"      node "_teste/testa_store_grava_no_commit.js" --envenenado-grava-no-pedido
roda "salvar --envenenado-escreve-no-pedido"    node "_teste/testa_store_grava_no_commit.js" --envenenado-escreve-no-pedido
# N1: o salvar do documento tem transacao propria (principal mais a diferenca em
# registros) e veneno proprio: --envenenado-salvar-no-pedido faz o salvar responder
# com a transacao aberta e tem de acusar exatamente o salvar.
roda "salvar --envenenado-salvar-no-pedido"     node "_teste/testa_store_grava_no_commit.js" --envenenado-salvar-no-pedido
# N2 (folha por pagina): o salvarNota tem transacao propria (notas, controle e
# saida); --envenenado-nota-no-pedido o faz responder com ela aberta e tem de
# acusar EXATAMENTE o salvarNota
roda "salvar --envenenado-nota-no-pedido"       node "_teste/testa_store_grava_no_commit.js" --envenenado-nota-no-pedido
# N2 (fatia 2, anexos na nuvem): o salvarMidia, o salvarAnexo e o apagarAnexo
# tem transacao propria (deposito, estado e fila); --envenenado-arquivo-no-pedido
# os faz responder com ela aberta e tem de acusar EXATAMENTE os tres
roda "salvar --envenenado-arquivo-no-pedido"    node "_teste/testa_store_grava_no_commit.js" --envenenado-arquivo-no-pedido
# E o outro lado, que o conserto criou: a escrita que falha passa a REJEITAR.
# --envenenado-nao-rejeita tira o onabort do escrever (a miniatura 'bib:' passa
# por ele) e os dois tratamentos de falha do salvarArquivo, e a transacao
# abortada depois do sucesso do pedido tem de deixar as duas promessas penduradas;
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
# L1 da nova montagem de listas (D1, D8 revista e D10, 12/11/2026): a janela
# "PDF pronto" com compartilhar, baixar e ver (cancelar nao baixa nada), as
# proximas aulas no "Gerar material" com a do aluno em contexto escolhida, e o
# tutorial sem imprimir. Um veneno por regra.
roda "pdf pronto"                                node "_teste/testa_biblioteca_pdf_pronto.js"
roda "pdf pronto --envenenado-baixa-ao-cancelar" node "_teste/testa_biblioteca_pdf_pronto.js" --envenenado-baixa-ao-cancelar
roda "pdf pronto --envenenado-so-hoje"           node "_teste/testa_biblioteca_pdf_pronto.js" --envenenado-so-hoje
roda "pdf pronto --envenenado-sem-sugestao"      node "_teste/testa_biblioteca_pdf_pronto.js" --envenenado-sem-sugestao
roda "pdf pronto --envenenado-sugere-depois"     node "_teste/testa_biblioteca_pdf_pronto.js" --envenenado-sugere-depois
roda "pdf pronto --envenenado-filtro-fora"       node "_teste/testa_biblioteca_pdf_pronto.js" --envenenado-filtro-fora
roda "pdf pronto --envenenado-voltar"            node "_teste/testa_biblioteca_pdf_pronto.js" --envenenado-voltar
# C2a: o banco sobe de 2 para 3. A subida nao perde nada; codigo mais velho que
# o banco diz o que fazer; a janela antiga larga o banco e avisa.
roda "banco v3"                                   node "_teste/testa_banco_v3.js"
roda "banco v3 --envenenado-versao-tecnica"       node "_teste/testa_banco_v3.js" --envenenado-versao-tecnica
roda "banco v3 --envenenado-troca-calada"         node "_teste/testa_banco_v3.js" --envenenado-troca-calada
# N1 (fase 1 da nuvem, fatia 1): o banco sobe de 4 para 5 com um registro por
# item, migrado dentro da transacao de versao a partir do codigo REAL da versao 4
# (_store_v4_historico.js); o salvar grava so a diferenca, medido por fora; ida e
# volta carregar(salvar(db)) == db; o principal gravado por fora vence; desfazer,
# exclusao em cascata, restauracao e apagar tudo deixam registros e principal
# iguais. Venenos: a migracao que perde um registro e o salvar que regrava tudo
# TEM de ser vistos. A mesma migracao sobre as copias reais do Drive roda fora do
# portao (_prova_migracao_copias_reais.js), so com contagens.
roda "banco v5 (N1)"                              node "_teste/testa_banco_v5.js"
roda "banco v5 --envenenado-perde-registro"       node "_teste/testa_banco_v5.js" --envenenado-perde-registro
roda "banco v5 --envenenado-regrava-tudo"         node "_teste/testa_banco_v5.js" --envenenado-regrava-tudo
# fatia 2 (revisao): a restauracao vinda da nuvem enfileira tudo no aparelho que
# escreve, e nada no que so le; o veneno sem fila para todos TEM de ser visto.
roda "banco v5 --envenenado-restauro-sem-fila"    node "_teste/testa_banco_v5.js" --envenenado-restauro-sem-fila
# N1: o rollback de verdade. O codigo REAL da versao 4, republicado com
# VERSAO_BANCO = 5, le, edita e apaga o principal; a 5 volta e ve o que a 4 fez,
# inclusive o "Apagar tudo" (o apagamento de fora vence: tudo vira lapide e
# carregar() e null). O veneno volta a regra antiga, que ressuscitava os
# registros, e TEM de ser visto.
roda "rollback v4 (N1)"                           node "_teste/testa_rollback_v4.js"
roda "rollback v4 --envenenado-registros-ressuscitam" node "_teste/testa_rollback_v4.js" --envenenado-registros-ressuscitam
# IA, fase 2: o fluxo do planejamento no app (ficha, atalho do +, previa em PDF,
# ajuste, salvar, compartilhar, erros, observador e transbordo), com o /api/ia falso;
# e a pergunta de producao: o plano salvo como ajuste sobrevive ao store.js de antes
# (1f0b839), e o tipo novo seria apagado por ele (controle).
roda "planejamento (fluxo, IA fase 2)"              node "_teste/testa_planejamento_navegador.js"
roda "planejamento --envenenado-salva-duplo"       node "_teste/testa_planejamento_navegador.js" --envenenado-salva-duplo
roda "planejamento (registro e versao antiga)"      node "_teste/testa_planejamento_registro_navegador.js"
roda "planejamento --envenenado-cascata-deixa-plano" node "_teste/testa_planejamento_registro_navegador.js" --envenenado-cascata-deixa-plano
# IA, fase 3: o assistente no app (tablet e celular), com o /api/ia falso num roteiro
# de tool_use: quem ve o botao, os cartoes que so abrem com o toque, o teto de 5
# voltas, os erros, nada grava e o transbordo a 360, 390 e 412 px e 130%.
roda "assistente (fluxo, IA fase 3)"                node "_teste/testa_assistente_navegador.js"
# IA, fase 4a: o cartao de confirmacao (tablet e celular): nada grava sem o
# Confirmar, o registro igual ao da tela do celular, o Desfazer, a acao declarada
# (D6b), quem so le, o toque duplo e o transbordo. Os venenos TEM de reprovar.
roda "assistente que grava (fluxo, IA fase 4a)"      node "_teste/testa_assistente_grava_navegador.js"
roda "assistente --envenenado-toque-duplo"          node "_teste/testa_assistente_grava_navegador.js" --envenenado-toque-duplo
roda "assistente --envenenado-sem-acao"             node "_teste/testa_assistente_grava_navegador.js" --envenenado-sem-acao
roda "assistente --envenenado-sem-conferencia"      node "_teste/testa_assistente_grava_navegador.js" --envenenado-sem-conferencia
# N1: a volta depois do rollback. O codigo da 4 republicado com o numero novo abre
# um banco nesse numero sem os depositos novos; o codigo novo, voltando, sonda o
# banco, cria o que falta na versao mais um e migra. O veneno sem a deteccao TEM
# de cair em NotFoundError.
roda "banco cura (N1)"                            node "_teste/testa_banco_cura.js"
roda "banco cura --envenenado-sem-cura"           node "_teste/testa_banco_cura.js" --envenenado-sem-cura
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
# B12: o indice de texto dos livros, num banco IndexedDB a parte
# (indice-livros), lido por um Web Worker com o PDF.js do app. Acha o termo sem
# acento e sem caixa, na pagina do arquivo e agrupado pelo capitulo; conta a
# pagina sem texto; retoma no meio sem refazer o livro pronto; fica fora da
# copia e sobrevive a restauracao; o "Apagar tudo" o apaga; o banco principal
# segue na v6 e o store.js do commit pai o le. Porta 8898. Um veneno por regra.
roda "livros indice"                              node "_teste/testa_livros_indice.js"
roda "livros indice --envenenado-indice-na-copia" node "_teste/testa_livros_indice.js" --envenenado-indice-na-copia
roda "livros indice --envenenado-refaz-indexado"  node "_teste/testa_livros_indice.js" --envenenado-refaz-indexado
roda "livros indice --envenenado-com-acento"      node "_teste/testa_livros_indice.js" --envenenado-com-acento
# A revisao do B12 (duas lentes): a falha passageira (o Worker que morre no
# meio) nao tira o livro da leitura, e o "Apagar tudo" nao espera o banco do
# indice (outra janela segurando a conexao nao o deixa pela metade).
roda "livros indice --envenenado-erro-vira-pronto"    node "_teste/testa_livros_indice.js" --envenenado-erro-vira-pronto
roda "livros indice --envenenado-apagar-espera-indice" node "_teste/testa_livros_indice.js" --envenenado-apagar-espera-indice
# A pagina que sempre falha (de forma passageira) sai sozinha; o livro fica na busca.
roda "livros indice --envenenado-pagina-ruim-derruba-livro" node "_teste/testa_livros_indice.js" --envenenado-pagina-ruim-derruba-livro
# 12/11/2026: a busca tambem acha os capitulos pelo titulo e pelos assuntos do
# mapa, inclusive no livro escaneado (sem texto). O veneno desliga a busca por
# capitulo, e o livro escaneado some do resultado.
roda "livros indice --envenenado-busca-sem-capitulos" node "_teste/testa_livros_indice.js" --envenenado-busca-sem-capitulos
# P2: a pagina fora de todo capitulo nao e resultado (substitui o veneno do
# topo vazio do #181); o veneno a devolve como linha.
roda "livros indice --envenenado-pagina-solta-vira-resultado" node "_teste/testa_livros_indice.js" --envenenado-pagina-solta-vira-resultado
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
# 12a, parte 0 (13/11/2026): o mapa de capitulos de EPUB, por parte e ancora,
# sobre o EPUB sintetico do gerador (dois capitulos na mesma parte). O meta
# novo nao mexe na posicao antiga, a tela e o leitor mostram o sumario do mapa
# e o "Abrir no livro" leva a parte e a ancora, com a faixa do capitulo certo.
# Porta 8983.
roda "livros mapa epub"                           node "_teste/testa_livros_mapa_epub.js"
roda "livros mapa epub --envenenado-sem-ancora"   node "_teste/testa_livros_mapa_epub.js" --envenenado-sem-ancora
roda "livros mapa epub --envenenado-cobre-sem-ancora" node "_teste/testa_livros_mapa_epub.js" --envenenado-cobre-sem-ancora
roda "livros mapa epub --envenenado-posicao-solta" node "_teste/testa_livros_mapa_epub.js" --envenenado-posicao-solta
# 12/11/2026: a versao nova de um pacote de livros que so muda o mapa (o MAT08-15
# de volume): mesmo arquivo, versao maior, so o meta trocado; a posicao de
# leitura e a correcao dela intactas, inclusive no livro cujo sumario era vazio;
# o v1 depois do v2 nao rebaixa. O veneno deixa de trocar o meta. Porta 8887.
roda "livros reimportar mapa"                     node "_teste/testa_livros_reimportar_mapa.js"
roda "livros reimportar mapa --envenenado-meta-nao-troca" node "_teste/testa_livros_reimportar_mapa.js" --envenenado-meta-nao-troca
# Fase 1a da biblioteca na nuvem (12/11/2026): a posicao de leitura fica quando
# o meta ou o arquivo do livro muda (o sumario novo nao a solta mais); a pagina
# que nao existe no arquivo novo vai para a ultima, com o aviso "voce estava na
# p. X" na tela do livro e no leitor; o EPUB do FME remontado em PDF vai pela
# ancora page_N para a pagina N; o livro que sai do pacote nao leva a posicao; o
# ajuste fica ate ela mudar de pagina; a correcao orfa aparece na tela do livro,
# com a sugestao de um toque, Ligar (que pergunta antes de trocar) e Descartar, e
# o Desfazer devolve so o que a acao mexeu; o Confirmar num numero que guarda
# outra correcao nao a apaga. Cada veneno tira uma regra. Porta 8972.
roda "livros nuvem posicao"                       node "_teste/testa_livros_nuvem_posicao.js"
roda "livros nuvem posicao --envenenado-solta-no-meta" node "_teste/testa_livros_nuvem_posicao.js" --envenenado-solta-no-meta
roda "livros nuvem posicao --envenenado-solta-no-sumario" node "_teste/testa_livros_nuvem_posicao.js" --envenenado-solta-no-sumario
roda "livros nuvem posicao --envenenado-solta-na-troca" node "_teste/testa_livros_nuvem_posicao.js" --envenenado-solta-na-troca
roda "livros nuvem posicao --envenenado-nao-ajusta" node "_teste/testa_livros_nuvem_posicao.js" --envenenado-nao-ajusta
roda "livros nuvem posicao --envenenado-sem-traducao" node "_teste/testa_livros_nuvem_posicao.js" --envenenado-sem-traducao
roda "livros nuvem posicao --envenenado-sem-aviso" node "_teste/testa_livros_nuvem_posicao.js" --envenenado-sem-aviso
roda "livros nuvem posicao --envenenado-orfa-some-da-tela" node "_teste/testa_livros_nuvem_posicao.js" --envenenado-orfa-some-da-tela
roda "livros nuvem posicao --envenenado-grava-por-cima-na-tela" node "_teste/testa_livros_nuvem_posicao.js" --envenenado-grava-por-cima-na-tela
roda "livros nuvem posicao --envenenado-solta-no-removido" node "_teste/testa_livros_nuvem_posicao.js" --envenenado-solta-no-removido
roda "livros nuvem posicao --envenenado-volta-sem-regra" node "_teste/testa_livros_nuvem_posicao.js" --envenenado-volta-sem-regra
roda "livros nuvem posicao --envenenado-ajuste-sai-na-abertura" node "_teste/testa_livros_nuvem_posicao.js" --envenenado-ajuste-sai-na-abertura
roda "livros nuvem posicao --envenenado-troca-sem-perguntar" node "_teste/testa_livros_nuvem_posicao.js" --envenenado-troca-sem-perguntar
roda "livros nuvem posicao --envenenado-desfazer-tudo" node "_teste/testa_livros_nuvem_posicao.js" --envenenado-desfazer-tudo
# 12/11/2026, item 12c: a ligacao de assunto entre materias. O capitulo de
# quimica ligado ao assunto de fisica diz "Fisica: ..." na tela do livro, na
# busca, na faixa e no Corrigir; a correcao dela com o id de fisica vale; o id
# fora do indice nao ganha materia pelo prefixo; o da propria materia fica
# igual; o lado a lado diz "livro de Quimica". Quatro venenos. Porta 8993.
roda "livros entre materias"                      node "_teste/testa_livros_entre_materias.js"
roda "livros entre materias --envenenado-sem-materia-no-nome" node "_teste/testa_livros_entre_materias.js" --envenenado-sem-materia-no-nome
roda "livros entre materias --envenenado-materia-pelo-prefixo" node "_teste/testa_livros_entre_materias.js" --envenenado-materia-pelo-prefixo
roda "livros entre materias --envenenado-propria-materia-marcada" node "_teste/testa_livros_entre_materias.js" --envenenado-propria-materia-marcada
roda "livros entre materias --envenenado-corrigir-sem-a-de-fora" node "_teste/testa_livros_entre_materias.js" --envenenado-corrigir-sem-a-de-fora
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
# Item 7: o lembrete da copia considera a nuvem (estado da nuvem simulado na
# pagina, sem conta e sem emulador). Em dia: so a linha "Na nuvem, salvo as";
# fila parada ha mais de 24 h: o alerta fala da nuvem; desligada: o de antes;
# celular e observador: nada. O veneno volta ao lembrete so pela copia local.
roda "alerta da copia com a nuvem"                node "_teste/testa_alerta_copia_nuvem.js"
roda "alerta da copia --envenenado-alerta-so-local" node "_teste/testa_alerta_copia_nuvem.js" --envenenado-alerta-so-local
# a idade do que parou sai da fila, e nao do ultimo envio: o veneno volta a
# medir pelo envio e a quarentena com envio recente fica calada
roda "alerta da copia --envenenado-idade-do-envio" node "_teste/testa_alerta_copia_nuvem.js" --envenenado-idade-do-envio
roda "exclusao de aluno em cascata"                node "_teste/testa_exclusao_aluno_cascata.js"
roda "relato e Voltar"                            node "_teste/testa_relato_voltar.js"
# a entrada de janela que veio da recarga vira a da tela: o veneno a deixa
# como estava e o historico nunca mais fica sem janela
roda "Voltar sem entrada velha"                  node "_teste/testa_voltar_entrada_velha.js"
roda "Voltar sem entrada velha --envenenado-entrada-velha" node "_teste/testa_voltar_entrada_velha.js" --envenenado-entrada-velha
# F7 (#159): na aula que ja existe, o relato salva sozinho e data, horario, duracao,
# situacao e cobranca gravam so ao Fechar ou Concluir (com Desfazer); nunca por cima de
# versao mais nova, mesmo campo ou outro; Descartar volta ao que havia; a repeticao pede
# o escopo. Os venenos tiram a conferencia, o rascunho na saida e o retrato por chave (A1).
roda "aula salva sozinha"                          node "_teste/testa_aula_salva_sozinha.js"
roda "aula salva sozinha --envenenado-grava-por-cima" node "_teste/testa_aula_salva_sozinha.js" --envenenado-grava-por-cima
roda "aula salva sozinha --envenenado-sem-rascunho-ao-sair" node "_teste/testa_aula_salva_sozinha.js" --envenenado-sem-rascunho-ao-sair
roda "aula salva sozinha --envenenado-retrato-absorve-tudo" node "_teste/testa_aula_salva_sozinha.js" --envenenado-retrato-absorve-tudo
roda "aula salva sozinha --envenenado-descartar-velho" node "_teste/testa_aula_salva_sozinha.js" --envenenado-descartar-velho
roda "aula salva sozinha --envenenado-volta-atras" node "_teste/testa_aula_salva_sozinha.js" --envenenado-volta-atras
roda "aula salva sozinha --envenenado-desfazer-tudo" node "_teste/testa_aula_salva_sozinha.js" --envenenado-desfazer-tudo
roda "aula salva sozinha --envenenado-desfazer-so-no-lote" node "_teste/testa_aula_salva_sozinha.js" --envenenado-desfazer-so-no-lote
roda "Voltar do aparelho nas telas"              node "_teste/testa_voltar_android.js"
roda "Voltar do aparelho --envenenado-voltar-sem-tela" node "_teste/testa_voltar_android.js" --envenenado-voltar-sem-tela
roda "Voltar do aparelho --envenenado-volta-dois-passos" node "_teste/testa_voltar_android.js" --envenenado-volta-dois-passos
roda "Voltar do aparelho --envenenado-seta-nao-tira" node "_teste/testa_voltar_android.js" --envenenado-seta-nao-tira
roda "Voltar do aparelho --envenenado-pergunta-da-lista-some" node "_teste/testa_voltar_android.js" --envenenado-pergunta-da-lista-some
roda "Voltar do aparelho --envenenado-folha-fora-do-historico" node "_teste/testa_voltar_android.js" --envenenado-folha-fora-do-historico
roda "Voltar do aparelho --envenenado-pergunta-do-formulario-some" node "_teste/testa_voltar_android.js" --envenenado-pergunta-do-formulario-some
roda "Voltar do aparelho --envenenado-guarda-depois-da-janela" node "_teste/testa_voltar_android.js" --envenenado-guarda-depois-da-janela
roda "Voltar do aparelho --envenenado-sem-ramo-bib" node "_teste/testa_voltar_android.js" --envenenado-sem-ramo-bib
roda "copia ZIP e restauracao atomica"              node "_teste/testa_copia_zip.js"
# N0: a copia na nuvem contra o Firebase Emulator Suite: as regras nos tres
# casos (dona, observador, estranho), a ida e volta entre dois aparelhos pela
# restauracao so com o login (sem cifra, sem chave: decisao do dono de 08/11), a
# copia automatica ao fechar e as regras por caminho. Precisa do firebase-tools
# FORA do repositorio (FIREBASE_TOOLS ou o caminho padrao da prova) e de um JDK
# 21 em JAVA_HOME; sem eles, a prova diz onde procurou e REPROVA, nunca passa
# calada. Os venenos: a regra que deixa qualquer conta ler tem de ser vista pela
# parte das regras; a que deixa quem le escrever registro, idem.
# Fase 1b da biblioteca na nuvem (13/11/2026): o publicador do catalogo
# (biblioteca/publicar_catalogo.py) contra o emulador do Firestore e do Auth,
# com manifests sinteticos: sem --publicar nada e gravado; publicar grava num
# commit so; republicar igual nao escreve; a falha no meio do lote deixa a
# versao anterior; as recusas (id trocado, livro que some, formato, assunto
# fora do banco, caminho fora da lista); a classificacao do acervo; e as
# regras do catalogo (a dona le e nao escreve); os registros que somem sao recusa
# e o que ficou para tras e refeito pelo indice da nuvem. Portas 9031 a 9035.
roda "publicador do catalogo"                       node "_teste/testa_publicador_catalogo.js"
roda "publicador do catalogo --envenenado-aceita-id-trocado" node "_teste/testa_publicador_catalogo.js" --envenenado-aceita-id-trocado
roda "publicador do catalogo --envenenado-escreve-fora-da-lista" node "_teste/testa_publicador_catalogo.js" --envenenado-escreve-fora-da-lista
roda "publicador do catalogo --envenenado-dois-lotes" node "_teste/testa_publicador_catalogo.js" --envenenado-dois-lotes
roda "publicador do catalogo --envenenado-regra-herda-escrita" node "_teste/testa_publicador_catalogo.js" --envenenado-regra-herda-escrita
roda "publicador do catalogo --envenenado-repetido-ultima-vence" node "_teste/testa_publicador_catalogo.js" --envenenado-repetido-ultima-vence
roda "publicador do catalogo --envenenado-nome-cortado" node "_teste/testa_publicador_catalogo.js" --envenenado-nome-cortado
roda "publicador do catalogo --envenenado-registro-vazio-passa" node "_teste/testa_publicador_catalogo.js" --envenenado-registro-vazio-passa
roda "publicador do catalogo --envenenado-relatorio-grava" node "_teste/testa_publicador_catalogo.js" --envenenado-relatorio-grava
roda "publicador do catalogo --envenenado-so-pelo-id" node "_teste/testa_publicador_catalogo.js" --envenenado-so-pelo-id
roda "publicador do catalogo --envenenado-homonimo-na-lista" node "_teste/testa_publicador_catalogo.js" --envenenado-homonimo-na-lista
# Fase 1c (13/11/2026): o mapa novo chega ao tablet pelo catalogo, de ponta a
# ponta no emulador: o publicador da 1b publica os metas vivos; o "Atualizar a
# biblioteca" troca so o meta dos livros de mesmo arquivo; a defasagem da
# romul-c0 vai a zero nos que ficam; Blob, posicao e correcoes byte a byte; o
# SAI, o de outro arquivo e o de meta invalido intocados; nada na abertura.
# Portas 9041 a 9046.
roda "biblioteca na nuvem, metas"                   node "_teste/testa_biblioteca_nuvem_metas.js"
roda "biblioteca na nuvem, metas --envenenado-troca-o-blob" node "_teste/testa_biblioteca_nuvem_metas.js" --envenenado-troca-o-blob
roda "biblioteca na nuvem, metas --envenenado-solta-a-posicao" node "_teste/testa_biblioteca_nuvem_metas.js" --envenenado-solta-a-posicao
roda "biblioteca na nuvem, metas --envenenado-aceita-meta-invalido" node "_teste/testa_biblioteca_nuvem_metas.js" --envenenado-aceita-meta-invalido
roda "biblioteca na nuvem, metas --envenenado-liga-na-abertura" node "_teste/testa_biblioteca_nuvem_metas.js" --envenenado-liga-na-abertura
roda "biblioteca na nuvem, metas --envenenado-regrava-o-igual" node "_teste/testa_biblioteca_nuvem_metas.js" --envenenado-regrava-o-igual
roda "biblioteca na nuvem, metas --envenenado-store-aceita-outro-id" node "_teste/testa_biblioteca_nuvem_metas.js" --envenenado-store-aceita-outro-id
roda "biblioteca na nuvem, metas --envenenado-aceita-outro-formato" node "_teste/testa_biblioteca_nuvem_metas.js" --envenenado-aceita-outro-formato
roda "biblioteca na nuvem, metas --envenenado-aceita-outras-paginas" node "_teste/testa_biblioteca_nuvem_metas.js" --envenenado-aceita-outras-paginas
roda "biblioteca na nuvem, metas --envenenado-aceita-mapa-texto" node "_teste/testa_biblioteca_nuvem_metas.js" --envenenado-aceita-mapa-texto
roda "biblioteca na nuvem, metas --envenenado-um-lote-so" node "_teste/testa_biblioteca_nuvem_metas.js" --envenenado-um-lote-so
roda "biblioteca na nuvem, metas --envenenado-app-aceita-outro-id" node "_teste/testa_biblioteca_nuvem_metas.js" --envenenado-app-aceita-outro-id
roda "biblioteca na nuvem, metas --envenenado-vencida-pede-tente" node "_teste/testa_biblioteca_nuvem_metas.js" --envenenado-vencida-pede-tente
roda "nuvem fase 0"                                 node "_teste/testa_nuvem.js"
roda "nuvem fase 0 --envenenado-regra-aberta"       node "_teste/testa_nuvem.js" --envenenado-regra-aberta
roda "nuvem fase 0 --envenenado-leitor-escreve"     node "_teste/testa_nuvem.js" --envenenado-leitor-escreve
# (D7) o observador de outra conta, em tela larga, nunca "passa a editar"
roda "nuvem fase 0 --envenenado-observador-edita"   node "_teste/testa_nuvem.js" --envenenado-observador-edita
# o medio da revisao adversarial (07/11): o banco vazio que subiria por cima da
# copia boa depois do "Apagar tudo"
roda "nuvem fase 0 --envenenado-sobe-vazio"         node "_teste/testa_nuvem.js" --envenenado-sobe-vazio
# segunda rodada: a rotacao que so olhava o conteudo quando a nova era vazia
# apagava a boa quando a atual era vazia e a anterior boa
roda "nuvem fase 0 --envenenado-anterior-cega"      node "_teste/testa_nuvem.js" --envenenado-anterior-cega
# N0b: a gravacao feita DURANTE o envio continua pendente e sobe no envio
# seguinte; o veneno zera o pendente no fim do envio, como antes
roda "nuvem fase 0 --envenenado-pendente-zerado"    node "_teste/testa_nuvem.js" --envenenado-pendente-zerado
# D6, parte 1: o modo celular so leitura, em 390x844 e contra o mesmo
# emulador: as tres telas sem rolagem de lado e com alvos de 44 px, a copia
# restaurada em Hoje, nenhuma gravacao no banco alem da restauracao, nenhum
# envio a nuvem do celular (nem ao fechar, nem a diaria, nem deitado). Os
# venenos: o celular que envia, o que mostra botao de edicao e o que grava a
# carga inicial ao abrir TEM de ser vistos.
# N1 fatia 2: os registros sobem um a um, da fila `saida` gravada na mesma
# transacao do dado, com os metadados e o conteudo legivel (sem cifra; o
# estranho nao le nem escreve); a nuvem recusando (regras velhas) guarda a fila
# e Ajustes diz; a fila sobrevive a fechar sem sinal e sobe ao voltar; o celular
# so leitura nunca envia. Veneno: fila fora da transacao TEM de ser visto.
roda "nuvem registros (N1 fatia 2)"                 node "_teste/testa_nuvem_registros.js"
roda "nuvem registros --envenenado-fila-fora-da-transacao" node "_teste/testa_nuvem_registros.js" --envenenado-fila-fora-da-transacao
# (revisao) recusa total da nuvem nunca conta tentativa: o veneno que culpa quem ja
# tinha tentativa leva um bom sozinho a quarentena, e TEM de ser visto.
roda "nuvem registros --envenenado-culpa-na-recusa-total" node "_teste/testa_nuvem_registros.js" --envenenado-culpa-na-recusa-total
# N1 fatia 3: o recebimento. Dois tablets e um celular contra o emulador: cursor por
# servidorEm, ultima escrita vence por registro pelo carimbo do servidor, a versao
# que perde vai ao historico, lapide de um nao volta pelo outro, duas abas em ordem
# cruzada (precondicao updateTime), r1 e r2 na mesma data (fica a de maior r), o
# celular recebe e nunca envia. Venenos: ignorar a lapide e aplicar o mais velho
# por cima TEM de ser vistos.
roda "nuvem recebe (N1 fatia 3)"                    node "_teste/testa_nuvem_recebe.js"
roda "nuvem recebe --envenenado-ignora-lapide"      node "_teste/testa_nuvem_recebe.js" --envenenado-ignora-lapide
roda "nuvem recebe --envenenado-velho-por-cima"     node "_teste/testa_nuvem_recebe.js" --envenenado-velho-por-cima
# (revisao da fatia 3) a paginacao pelo par carimbo e nome (mil registros em cinco
# commits), o ALREADY_EXISTS tratado como a precondicao, e a fusao que nao mata
# aula legitima: os tres venenos TEM de ser vistos.
roda "nuvem recebe --envenenado-pagina-so-carimbo"  node "_teste/testa_nuvem_recebe.js" --envenenado-pagina-so-carimbo
roda "nuvem recebe --envenenado-sem-already-exists" node "_teste/testa_nuvem_recebe.js" --envenenado-sem-already-exists
roda "nuvem recebe --envenenado-fusao-pelo-prefixo" node "_teste/testa_nuvem_recebe.js" --envenenado-fusao-pelo-prefixo
# (terceira rodada) a resposta do commit perdida depois de o servidor aplicar: o eco
# atualiza o carimbo e tira a entrada da fila; o veneno que so anota quando falta TEM
# de ser visto.
roda "nuvem recebe --envenenado-eco-so-sem-carimbo" node "_teste/testa_nuvem_recebe.js" --envenenado-eco-so-sem-carimbo
# D7: o aparelho observador (o iPhone). O diagnostico por aparelho em
# usuarios/{uid}/diagnostico/{aparelhoId} (so metadados, forma fechada pelas
# regras, so a dona escreve, o leitor le; sobe quando muda, no maximo um por
# hora); o painel "Diagnostico" do observador; o Safari de iPhone simulado
# (persist recusado, sem Background Sync, fora da Tela de Inicio) com o motivo
# em uma frase; zero commits do observador; reaberto, rele da nuvem. Venenos: o
# diagnostico com campo de dado de crianca aceito e o observador que grava TEM
# de ser vistos.
roda "nuvem diagnostico (D7)"                       node "_teste/testa_nuvem_diagnostico.js"
roda "nuvem diagnostico --envenenado-diagnostico-aberto" node "_teste/testa_nuvem_diagnostico.js" --envenenado-diagnostico-aberto
roda "nuvem diagnostico --envenenado-observador-grava" node "_teste/testa_nuvem_diagnostico.js" --envenenado-observador-grava
# N2 (fase 2 da nuvem, fatia 1): a folha sobe POR PAGINA (hash SHA-256 do texto
# canonico, pontos a 0,1, gzip pelo CompressionStream) em usuarios/{uid}/folhas,
# so do tablet; o celular da dona e o observador recebem e abrem so para ler;
# a pagina igual nao sobe de novo; a lapide apaga a pagina no outro; quem recebe
# confere o hash. Venenos: a pagina sem hash TEM de ser recusada pelas regras; a
# regravacao da pagina igual TEM de ser vista; a folha editada no celular TEM de
# ser vista; o documento adulterado aplicado sem conferir o hash TEM de ser visto.
roda "nuvem folhas (N2 fatia 1)"                    node "_teste/testa_nuvem_folhas.js"
roda "nuvem folhas --envenenado-sem-hash"           node "_teste/testa_nuvem_folhas.js" --envenenado-sem-hash
roda "nuvem folhas --envenenado-regrava-igual"      node "_teste/testa_nuvem_folhas.js" --envenenado-regrava-igual
roda "nuvem folhas --envenenado-celular-edita-folha" node "_teste/testa_nuvem_folhas.js" --envenenado-celular-edita-folha
roda "nuvem folhas --envenenado-aplica-sem-conferir-hash" node "_teste/testa_nuvem_folhas.js" --envenenado-aplica-sem-conferir-hash
# (revisao do PR 133) a lapide da pagina que nunca subiu nao vira documento
# orfao; a aula excluida lapida a folha (e a que volta a traz); a restauracao
# apaga o estado por faixa (o cursor apagava os puts da propria restauracao) e
# lapida na nuvem a pagina que a copia nao tem; a precondicao que nao se resolve
# recebendo isola a culpada em vez de prender a fila; o "Apagar tudo" lapida as
# folhas para o "Enviar copia agora" leva-las; a pagina grande demais vai direto
# para a quarentena com a frase que diz qual folha; a volta de versao reconcilia
# as folhas com estado. Os oito venenos TEM de ser vistos.
roda "nuvem folhas --envenenado-lapide-orfa"        node "_teste/testa_nuvem_folhas.js" --envenenado-lapide-orfa
roda "nuvem folhas --envenenado-exclui-sem-lapide"  node "_teste/testa_nuvem_folhas.js" --envenenado-exclui-sem-lapide
roda "nuvem folhas --envenenado-limpa-por-cursor"   node "_teste/testa_nuvem_folhas.js" --envenenado-limpa-por-cursor
roda "nuvem folhas --envenenado-restauro-sem-lapide" node "_teste/testa_nuvem_folhas.js" --envenenado-restauro-sem-lapide
roda "nuvem folhas --envenenado-precondicao-prende" node "_teste/testa_nuvem_folhas.js" --envenenado-precondicao-prende
roda "nuvem folhas --envenenado-apaga-estado-no-apagar-tudo" node "_teste/testa_nuvem_folhas.js" --envenenado-apaga-estado-no-apagar-tudo
roda "nuvem folhas --envenenado-pagina-grande-tenta" node "_teste/testa_nuvem_folhas.js" --envenenado-pagina-grande-tenta
roda "nuvem folhas --envenenado-sem-reconciliar"    node "_teste/testa_nuvem_folhas.js" --envenenado-sem-reconciliar
# (lente B, 2a rodada) a pagina grande na quarentena que a copia restaurada nao tem sai da fila
roda "nuvem folhas --envenenado-quarentena-sobrevive-ao-restauro" node "_teste/testa_nuvem_folhas.js" --envenenado-quarentena-sobrevive-ao-restauro
# N2 (fase 2 da nuvem, fatia 2): os anexos e as imagens das folhas sobem pelo
# sha256 (arquivos/{sha} em partes de 768 KiB, anexos/{id} liga o arquivo a
# aula), so do tablet; o celular baixa ao abrir e confere o sha256; o mesmo
# arquivo em duas aulas sobe uma vez; o Remover e a exclusao em cascata
# lapidam; o anexo de antes desta versao nao sobe sozinho; a restauracao e a
# volta para a versao do ar nao perdem nem duplicam nada. Venenos: o sha256
# errado no envio TEM de ser recusado por quem baixa; a dedupe que sai TEM de
# ser vista no segundo envio.
roda "nuvem anexos (N2 fatia 2)"                    node "_teste/testa_nuvem_anexos.js"
roda "nuvem anexos --envenenado-sha-errado"         node "_teste/testa_nuvem_anexos.js" --envenenado-sha-errado
roda "nuvem anexos --envenenado-sobe-duas-vezes"    node "_teste/testa_nuvem_anexos.js" --envenenado-sobe-duas-vezes
# (lente B da fatia 2) o download que falha no segundo tablet fica "a baixar" e
# nunca vira lapide; a lapide de anexo que a aula viva ainda cita nao apaga o
# arquivo. Venenos: a reconciliacao que lapida o recebido TEM de apagar o PDF
# do tablet A; sem a defesa, a lapide TEM de apagar o PDF.
roda "nuvem anexos --envenenado-lapida-o-recebido"  node "_teste/testa_nuvem_anexos.js" --envenenado-lapida-o-recebido
roda "nuvem anexos --envenenado-sem-defesa"         node "_teste/testa_nuvem_anexos.js" --envenenado-sem-defesa
# (revisao do PR 118) o "Apagar tudo" zera a fila deste aparelho e o recebimento
# em curso confere a marca dentro da transacao; o celular nao enfileira a lapide
# da fusao; a restauracao enfileira tambem o que e igual a copia; a confirmacao
# do envio leva apagadoEm. Os cinco venenos TEM de ser vistos.
roda "nuvem recebe --envenenado-fila-sobrevive-ao-apagar" node "_teste/testa_nuvem_recebe.js" --envenenado-fila-sobrevive-ao-apagar
roda "nuvem recebe --envenenado-aplica-desligado"   node "_teste/testa_nuvem_recebe.js" --envenenado-aplica-desligado
roda "nuvem recebe --envenenado-celular-enfileira-fusao" node "_teste/testa_nuvem_recebe.js" --envenenado-celular-enfileira-fusao
roda "nuvem recebe --envenenado-restauro-sem-iguais" node "_teste/testa_nuvem_recebe.js" --envenenado-restauro-sem-iguais
roda "nuvem recebe --envenenado-confirma-sem-apagado" node "_teste/testa_nuvem_recebe.js" --envenenado-confirma-sem-apagado
# (segunda rodada) o religar pelo "Enviar copia agora" enfileira o que esta no aparelho
roda "nuvem recebe --envenenado-religar-sem-enfileirar" node "_teste/testa_nuvem_recebe.js" --envenenado-religar-sem-enfileirar
# o documento do formato antigo (cifrado) e pulado no recebimento, e o cursor passa por cima
roda "nuvem recebe --envenenado-sem-pulo"           node "_teste/testa_nuvem_recebe.js" --envenenado-sem-pulo
roda "celular so leitura"                           node "_teste/testa_celular_leitura.js"
roda "celular so leitura --envenenado-envia"        node "_teste/testa_celular_leitura.js" --envenenado-envia
roda "celular so leitura --envenenado-edicao"       node "_teste/testa_celular_leitura.js" --envenenado-edicao
roda "celular so leitura --envenenado-grava"        node "_teste/testa_celular_leitura.js" --envenenado-grava
# a guarda da tela de celular (lado menor abaixo de 640): o celular deitado,
# sem a marca, que restaurou pelo cartao de Ajustes, TEM de ser visto subindo
roda "celular so leitura --envenenado-tela"         node "_teste/testa_celular_leitura.js" --envenenado-tela
# o limite de 640 no lado menor bloquearia calado o tablet de 8 polegadas
roda "celular so leitura --envenenado-limite-640"   node "_teste/testa_celular_leitura.js" --envenenado-limite-640
# a escolha do modo celular pela janela de 640 tomaria o tablet pequeno em pe
roda "celular so leitura --envenenado-janela-640"   node "_teste/testa_celular_leitura.js" --envenenado-janela-640
# a abertura do celular que tenta gravar a migracao do corte dos pagamentos
# mostra "Este celular so le" sem ela ter tocado em nada
roda "celular so leitura --envenenado-grava-abertura" node "_teste/testa_celular_leitura.js" --envenenado-grava-abertura
# D6b: o celular da dona edita nas quatro acoes (marcar e cancelar aula, registrar
# como foi, cadastrar aluno, pago em), que sobem pela fila de registros e chegam ao
# tablet ao abrir; sem sinal, a fila espera e o alto diz; a copia completa nunca
# sobe do celular; o observador de outra conta nao ve botao de edicao. Venenos: o
# celular que envia a copia completa e o observador que edita TEM de ser vistos.
roda "celular edita (D6b)"                          node "_teste/testa_celular_edita.js"
roda "celular edita --envenenado-celular-envia-copia" node "_teste/testa_celular_edita.js" --envenenado-celular-envia-copia
roda "celular edita --envenenado-observador-edita"  node "_teste/testa_celular_edita.js" --envenenado-observador-edita
roda "celular edita --envenenado-corte-sobe"        node "_teste/testa_celular_edita.js" --envenenado-corte-sobe
# D6c (lote 1): Hoje como linha do tempo, a folha da aula (realizada, faltou,
# cancelar com e sem cobranca, remarcar, registrar como foi) e o "Marcar aula as
# HH:MM" do horario livre, na mesma rodada do D6b. Venenos: remarcar que muda a
# repeticao inteira, remarcar que solta a aula da serie, o choque que nao ve,
# a duracao que nao vem preenchida (junho deixa de dar 10:30 e R$ 1.050,00) e o
# cancelar com cobranca que grava sem cobranca TEM de ser vistos.
roda "celular edita --envenenado-remarca-todas"     node "_teste/testa_celular_edita.js" --envenenado-remarca-todas
roda "celular edita --envenenado-remarca-solta"     node "_teste/testa_celular_edita.js" --envenenado-remarca-solta
roda "celular edita --envenenado-sem-choque"        node "_teste/testa_celular_edita.js" --envenenado-sem-choque
roda "celular edita --envenenado-duracao-padrao"    node "_teste/testa_celular_edita.js" --envenenado-duracao-padrao
roda "celular edita --envenenado-cancela-sempre-sem" node "_teste/testa_celular_edita.js" --envenenado-cancela-sempre-sem
# (revisao do lote 1) tocar na situacao que a aula ja tem nao volta a cobranca ao padrao
roda "celular edita --envenenado-cobranca-volta"    node "_teste/testa_celular_edita.js" --envenenado-cobranca-volta
# (portao de 09/11) a rolagem inicial com o relogio fixo em varias horas: a folga antiga deixa
# a linha de agora cortada sob a faixa dos dias as 00:30 e as 06:00
roda "celular edita --envenenado-rolagem-antiga"   node "_teste/testa_celular_edita.js" --envenenado-rolagem-antiga
# (#168) Ajustar duracao: gravar com escopo todas muda a repeticao inteira e o dinheiro do mes; a
# lista fixa faz a aula de 1h15 abrir marcando outra duracao
roda "celular edita --envenenado-ajuste-todas"     node "_teste/testa_celular_edita.js" --envenenado-ajuste-todas
roda "celular edita --envenenado-ajuste-lista-fixa" node "_teste/testa_celular_edita.js" --envenenado-ajuste-lista-fixa
# D6c (lote 2): a aba Alunos e a ficha minima (ligar, WhatsApp, valor por hora,
# ultimo relato, casa ou online), as mensagens prontas em wa.me, os campos
# opcionais que sobem pela fila e chegam ao tablet, e a cobranca do "Escrever
# como foi" pelo estado atual da aula. Venenos: o numero sem 55, o texto
# errado, a ficha que abre o WhatsApp sozinha, o campo lido sem conferir, os
# campos que nao sobem, a cobranca pelo retrato e o observador que cadastra.
roda "celular ficha (D6c lote 2)"                   node "_teste/testa_celular_ficha.js"
roda "celular ficha --envenenado-sem-55"            node "_teste/testa_celular_ficha.js" --envenenado-sem-55
roda "celular ficha --envenenado-texto-errado"      node "_teste/testa_celular_ficha.js" --envenenado-texto-errado
roda "celular ficha --envenenado-abre-sozinho"      node "_teste/testa_celular_ficha.js" --envenenado-abre-sozinho
roda "celular ficha --envenenado-campo-obrigatorio" node "_teste/testa_celular_ficha.js" --envenenado-campo-obrigatorio
roda "celular ficha --envenenado-campos-nao-sobem"  node "_teste/testa_celular_ficha.js" --envenenado-campos-nao-sobem
roda "celular ficha --envenenado-cobranca-retrato"  node "_teste/testa_celular_ficha.js" --envenenado-cobranca-retrato
roda "celular ficha --envenenado-observador-cadastra" node "_teste/testa_celular_ficha.js" --envenenado-observador-cadastra
# (revisao do lote 2) a extracao antiga do telefone do texto livre (o telefone
# de um estranho; a tabela dos 28 casos dela), o link online com http, e o alto que nunca avisa que pode
# estar desatualizado
roda "celular ficha --envenenado-extracao-antiga"   node "_teste/testa_celular_ficha.js" --envenenado-extracao-antiga
roda "celular ficha --envenenado-planejamento-solto" node "_teste/testa_celular_ficha.js" --envenenado-planejamento-solto
roda "celular ficha --envenenado-aceita-http"       node "_teste/testa_celular_ficha.js" --envenenado-aceita-http
roda "celular ficha --envenenado-nunca-desatualizado" node "_teste/testa_celular_ficha.js" --envenenado-nunca-desatualizado
# D6c (lote 3): dinheiro de relance. O selo de cada familia (pago, parcial, em
# aberto) e o total a receber do Fechamento do celular batem com o tablet ao
# centavo (Core.seloDoPagamento e Core.totaisDoMes); o "Pago" em dois toques
# propoe o valor das aulas ja dadas, sobe pela fila e chega ao tablet; a
# cancelada sem cobranca nao entra e os dois cancelamentos tem nomes que nao se
# confundem; junho continua 10 encontros, 10:30 e R$ 1.050,00; o observador ve
# o selo e o total sem marcar pago. Um veneno para cada propriedade.
roda "celular dinheiro (D6c lote 3)"                node "_teste/testa_celular_dinheiro.js"
roda "celular dinheiro --envenenado-selo-pelo-mes"  node "_teste/testa_celular_dinheiro.js" --envenenado-selo-pelo-mes
roda "celular dinheiro --envenenado-parcial-vira-pago" node "_teste/testa_celular_dinheiro.js" --envenenado-parcial-vira-pago
roda "celular dinheiro --envenenado-aberto-vira-nada" node "_teste/testa_celular_dinheiro.js" --envenenado-aberto-vira-nada
roda "celular dinheiro --envenenado-total-do-mes"   node "_teste/testa_celular_dinheiro.js" --envenenado-total-do-mes
roda "celular dinheiro --envenenado-proposto-do-mes" node "_teste/testa_celular_dinheiro.js" --envenenado-proposto-do-mes
roda "celular dinheiro --envenenado-cancelada-cobra" node "_teste/testa_celular_dinheiro.js" --envenenado-cancelada-cobra
roda "celular dinheiro --envenenado-nome-antigo"    node "_teste/testa_celular_dinheiro.js" --envenenado-nome-antigo
roda "celular dinheiro --envenenado-pago-fora-da-acao" node "_teste/testa_celular_dinheiro.js" --envenenado-pago-fora-da-acao
roda "celular dinheiro --envenenado-preco-de-hoje"  node "_teste/testa_celular_dinheiro.js" --envenenado-preco-de-hoje
roda "celular dinheiro --envenenado-observador-paga" node "_teste/testa_celular_dinheiro.js" --envenenado-observador-paga
# (revisao do lote 3) o proposto com a cancelada e cobrada a frente e sem a aula
# de hoje que ainda nao acabou; o numero grande e o que falta; os meses
# anteriores em aberto; cancelar a aula dada pergunta; pagar e desmarcar redesenham
roda "celular dinheiro --envenenado-sem-cancelada-a-frente" node "_teste/testa_celular_dinheiro.js" --envenenado-sem-cancelada-a-frente
roda "celular dinheiro --envenenado-tira-hoje-do-proposto" node "_teste/testa_celular_dinheiro.js" --envenenado-tira-hoje-do-proposto
roda "celular dinheiro --envenenado-falta-e-o-total" node "_teste/testa_celular_dinheiro.js" --envenenado-falta-e-o-total
roda "celular dinheiro --envenenado-sem-meses-anteriores" node "_teste/testa_celular_dinheiro.js" --envenenado-sem-meses-anteriores
roda "celular dinheiro --envenenado-cancela-sem-confirmar" node "_teste/testa_celular_dinheiro.js" --envenenado-cancela-sem-confirmar
roda "celular dinheiro --envenenado-sem-redesenho"  node "_teste/testa_celular_dinheiro.js" --envenenado-sem-redesenho
# A carga de exemplo e so das provas (09/11/2026, com o app em producao): ela
# entra so na origem local (127.0.0.1, localhost). Nas origens de producao
# (pages.dev e github.io, servidas do disco pela interceptacao) o banco vazio
# abre vazio, tambem depois do "Apagar tudo"; e o aparelho novo que entra na
# conta e liga a nuvem (no emulador) nao sobe nenhum registro de exemplo. O
# controle positivo e a mesma carga, em 127.0.0.1, subindo numa outra conta. O
# veneno volta a carga em qualquer origem e a nuvem tem de mostrar os registros.
roda "carga inicial so nas provas"                  node "_teste/testa_carga_inicial.js"
roda "carga inicial --envenenado-carga-em-producao" node "_teste/testa_carga_inicial.js" --envenenado-carga-em-producao
# D6c (lote 4): o que o app mostra sozinho no alto de Hoje do celular. A
# proxima aula (a mesma marca do lote 1), a aula passada sem registro (o
# criterio do tablet, Core.aulaTemRegistro), a familia em aberto do dia 6 em
# diante com o WhatsApp so do telefone validado e o valor do selo, e o
# lembrete de fechar o mes (3 ultimos dias e 5 primeiros do seguinte). No
# a agenda na primeira tela de 360 x 740; o observador sem cobrar.
roda "celular avisos (D6c lote 4)"                  node "_teste/testa_celular_avisos.js"
roda "celular avisos --envenenado-cobra-antes-do-dia-6" node "_teste/testa_celular_avisos.js" --envenenado-cobra-antes-do-dia-6
roda "celular avisos --envenenado-observador-cobra" node "_teste/testa_celular_avisos.js" --envenenado-observador-cobra
roda "celular avisos --envenenado-telefone-de-texto-vira-link" node "_teste/testa_celular_avisos.js" --envenenado-telefone-de-texto-vira-link
roda "celular avisos --envenenado-valor-fora-do-selo" node "_teste/testa_celular_avisos.js" --envenenado-valor-fora-do-selo
roda "celular avisos --envenenado-registrada-falta-registrar" node "_teste/testa_celular_avisos.js" --envenenado-registrada-falta-registrar
roda "celular avisos --envenenado-lembrete-fora-da-janela" node "_teste/testa_celular_avisos.js" --envenenado-lembrete-fora-da-janela
# (revisao do lote 4) cobrar e fechar o mes so no celular que e da dona, nunca pela falta de observador
roda "celular avisos --envenenado-observador-sem-sessao" node "_teste/testa_celular_avisos.js" --envenenado-observador-sem-sessao
# A trava de transbordo do celular (e o alvo de 48 px das abas): todas as telas e estados (entrar, Hoje com e
# sem avisos e com o aviso de versao nova, Alunos, ficha, Fechamento, Enviar, os
# formularios, a folha so leitura, o observador e o Diagnostico) em 360, 390 e
# 412 px, com a letra normal e em 130%: nenhum elemento rola de lado, nenhum
# texto sai da caixa e nada passa da borda. Venenos: o aviso de versao antigo
# ("Atualizar agora" e "Depois da aula" lado a lado) e um elemento de 500 px.
roda "celular transbordo"                           node "_teste/testa_celular_transbordo.js"
roda "celular transbordo --envenenado-aviso-largo"  node "_teste/testa_celular_transbordo.js" --envenenado-aviso-largo
roda "celular transbordo --envenenado-elemento-largo" node "_teste/testa_celular_transbordo.js" --envenenado-elemento-largo
# as cinco abas do observador com a regra que deixava o "Hoje" com 47 px (alvo de 48)
roda "celular transbordo --envenenado-aba-estreita" node "_teste/testa_celular_transbordo.js" --envenenado-aba-estreita
# A mensagem do mes (o feedback do fechamento) editada no celular: o mesmo
# campo do tablet (Core.textoDoMes e Core.gravarTextoDoMes), o texto salvo sai
# no PDF do Enviar e do Ver, sobe pela fila e chega ao tablet; a edicao do
# tablet chega com "Editado no tablet hoje as HH:MM"; nos dois lados vale a
# ultima gravacao; o observador nao ve; o rascunho volta; junho de referencia
# igual quando o texto nao muda. Um veneno para cada propriedade.
roda "celular mensagem do mes"                      node "_teste/testa_celular_fechamento_texto.js"
roda "celular mensagem --envenenado-texto-fora-do-pdf" node "_teste/testa_celular_fechamento_texto.js" --envenenado-texto-fora-do-pdf
roda "celular mensagem --envenenado-texto-nao-sobe" node "_teste/testa_celular_fechamento_texto.js" --envenenado-texto-nao-sobe
roda "celular mensagem --envenenado-observador-edita-texto" node "_teste/testa_celular_fechamento_texto.js" --envenenado-observador-edita-texto
roda "celular mensagem --envenenado-vale-o-primeiro" node "_teste/testa_celular_fechamento_texto.js" --envenenado-vale-o-primeiro
# (revisao) na mensagem do mes vence a escrita mais recente: o texto escrito no
# onibus sem sinal nao cobre a correcao feita depois no tablet
roda "celular mensagem --envenenado-vale-quem-chega-depois" node "_teste/testa_celular_fechamento_texto.js" --envenenado-vale-quem-chega-depois
# (lente B) K4: a mensagem nova sem carimbo sobe com a precondicao "nao existe";
# K6: com o tablet numa versao anterior, o celular nao edita a mensagem
roda "celular mensagem --envenenado-resumo-sem-precondicao" node "_teste/testa_celular_fechamento_texto.js" --envenenado-resumo-sem-precondicao
roda "celular mensagem --envenenado-tablet-antigo-edita" node "_teste/testa_celular_fechamento_texto.js" --envenenado-tablet-antigo-edita
# (avisos compactos, 09/11, desenho final base C) recolhidos num selinho na linha
# da data, o painel por cima da agenda (uma linha por tipo, Dispensar todos, a
# sincronia no rodape), o ponto no bloco da aula sem registro pela mesma lista, e o
# deslizar que dispensa ate o dia seguinte, guardado so no aparelho. Venenos: o
# painel aberto sem toque, o ponto na aula registrada, o ponto por outro
# criterio, os avisos empilhados de antes (a agenda desce dos 422 px), o selinho
# numa linha so dele, o dispensado que nao volta no dia seguinte, o arrasto que
# nao tira o aviso e o dispensado que entra na fila de registros
roda "celular avisos --envenenado-lista-aberta-por-padrao" node "_teste/testa_celular_avisos.js" --envenenado-lista-aberta-por-padrao
roda "celular avisos --envenenado-marca-em-registrada" node "_teste/testa_celular_avisos.js" --envenenado-marca-em-registrada
roda "celular avisos --envenenado-marca-e-lista-discordam" node "_teste/testa_celular_avisos.js" --envenenado-marca-e-lista-discordam
roda "celular avisos --envenenado-avisos-empilhados" node "_teste/testa_celular_avisos.js" --envenenado-avisos-empilhados
roda "celular avisos --envenenado-recolhido-empurra" node "_teste/testa_celular_avisos.js" --envenenado-recolhido-empurra
roda "celular avisos --envenenado-dispensa-para-sempre" node "_teste/testa_celular_avisos.js" --envenenado-dispensa-para-sempre
roda "celular avisos --envenenado-dispensa-nao-some" node "_teste/testa_celular_avisos.js" --envenenado-dispensa-nao-some
roda "celular avisos --envenenado-dispensa-na-nuvem" node "_teste/testa_celular_avisos.js" --envenenado-dispensa-na-nuvem
# (auditoria de 09/11) o topo fixo do Hoje em no maximo 20% da altura (360 x 780,
# 390 x 844 e 412 x 915, letra normal e a 130%): os avisos abertos e os dias da
# semana de volta no alto preso TEM de reprovar
roda "celular avisos --envenenado-topo-alto"        node "_teste/testa_celular_avisos.js" --envenenado-topo-alto
roda "cabecalho tablet em pe"                       node "_teste/testa_cabecalho_tablet_navegador.js"
roda "alvos de toque tablet (B6)"                 node "_teste/testa_alvos_toque_navegador.js"
# F1 (sistema visual do redesenho): no celular a 412 px e no tablet a 1280 x 800,
# pelo estilo computado, a cor de acao so marinho, letra de 12 px para cima e na
# escala de 5, pesos 400 e 600, sem caixa alta nem italico, nenhum glifo solto
# nos botoes e contraste de 4,5:1. Os tres venenos TEM de ser vistos. Porta 8934.
roda "sistema visual na tela (F1)"                 node "_teste/testa_sistema_visual_navegador.js"
roda "sistema visual --envenenado-botao-verde"     node "_teste/testa_sistema_visual_navegador.js" --envenenado-botao-verde
roda "sistema visual --envenenado-fonte-11px"      node "_teste/testa_sistema_visual_navegador.js" --envenenado-fonte-11px
roda "sistema visual --envenenado-glifo-solto"     node "_teste/testa_sistema_visual_navegador.js" --envenenado-glifo-solto
roda "sistema visual --envenenado-icone-vazio"     node "_teste/testa_sistema_visual_navegador.js" --envenenado-icone-vazio
roda "trilha vinculos corrigidos"                  node "_teste/testa_trilha_vinculos_navegador.js"
roda "preço descartado não vaza"                  node "_teste/testa_preco_cancelado.js"
roda "ações de aula no fechamento"                node "_teste/testa_acoes_fechamento.js"
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
# C5: o tipo de fonte cadernos-sme-sp (Cadernos de Apoio da SME-SP), sobre um
# caderno sintetico: indice em duas colunas, atividade que atravessa a pagina,
# foto com credito de terceiro (sai), duas colunas, revisao por questao. A
# fidelidade e no Chrome.
roda "cadernos sme da biblioteca"               python biblioteca/_prova_cadernos_sme.py
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
# 12a, parte 0: o mapa de capitulos de EPUB no gerador (parte, fim e ancora,
# a ancora conferida na parte), o sumario do mapa sem sumario no EPUB e com
# "sumario": "mapa", e o mapa de PDF fora do EPUB. Os venenos rodam dentro da
# prova. Sem Chrome.
roda "mapa de EPUB (gerador)"                   python biblioteca/_prova_mapa_epub.py
# O lado do aplicativo, no biblioteca.js: o sumario do EPUB sem sumario sai do
# mapa, e a ancora escolhe o capitulo na parte de varios. Sem Chrome.
roda "mapa de EPUB (regras)"                    node "_teste/testa_livros_mapa_epub_regras.js"
roda "mapa de EPUB (regras) --envenenado-sumario-so-do-pacote" node "_teste/testa_livros_mapa_epub_regras.js" --envenenado-sumario-so-do-pacote
roda "mapa de EPUB (regras) --envenenado-cobre-sem-ancora" node "_teste/testa_livros_mapa_epub_regras.js" --envenenado-cobre-sem-ancora
# Fase 1b: a chave estavel do capitulo (biblioteca/chaves.py), pelos mesmos
# criterios que o aplicativo confere (titulo igual, par da heranca; o mesmo
# comeco so com titulo parecido ou com o par). Sem Chrome e sem rede.
roda "chaves dos capitulos"                     python _teste/testa_chaves_capitulos.py
roda "chaves dos capitulos --envenenado-chave-pela-pagina" python _teste/testa_chaves_capitulos.py --envenenado-chave-pela-pagina
roda "chaves dos capitulos --envenenado-sem-heranca" python _teste/testa_chaves_capitulos.py --envenenado-sem-heranca
roda "chaves dos capitulos --envenenado-titulo-sem-unicidade" python _teste/testa_chaves_capitulos.py --envenenado-titulo-sem-unicidade
roda "chaves dos capitulos --envenenado-repetido-sem-ordem" python _teste/testa_chaves_capitulos.py --envenenado-repetido-sem-ordem
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
# Fase 1a da biblioteca na nuvem (12/11/2026): a correcao dela casa pela chave
# estavel do capitulo, pelo numero e titulo, pelo titulo normalizado unico e
# pela heranca de titulos (o caso da unidade 8 do ga7 e do ga9); o titulo unico
# so sugere, nunca aplica calado; a mais recente vence no mesmo capitulo; o
# Praticando 9 renumerado; a orfa listada e nunca no vizinho; a palavra nova nunca apaga a
# de outro capitulo; o tablet na versao antiga lendo as correcoes novas. Um
# veneno por regra. Sem Chrome.
roda "livros mapa correcao"                       node "_teste/testa_livros_mapa_correcao.js"
roda "livros mapa correcao --envenenado-so-numero-e-titulo" node "_teste/testa_livros_mapa_correcao.js" --envenenado-so-numero-e-titulo
roda "livros mapa correcao --envenenado-chave-sem-titulo" node "_teste/testa_livros_mapa_correcao.js" --envenenado-chave-sem-titulo
roda "livros mapa correcao --envenenado-chave-herda-sem-assunto" node "_teste/testa_livros_mapa_correcao.js" --envenenado-chave-herda-sem-assunto
roda "livros mapa correcao --envenenado-titulo-aplica-calado" node "_teste/testa_livros_mapa_correcao.js" --envenenado-titulo-aplica-calado
roda "livros mapa correcao --envenenado-mais-forte-vence" node "_teste/testa_livros_mapa_correcao.js" --envenenado-mais-forte-vence
roda "livros mapa correcao --envenenado-heranca-pelo-inicio" node "_teste/testa_livros_mapa_correcao.js" --envenenado-heranca-pelo-inicio
roda "livros mapa correcao --envenenado-orfa-some" node "_teste/testa_livros_mapa_correcao.js" --envenenado-orfa-some
roda "livros mapa correcao --envenenado-grava-por-cima" node "_teste/testa_livros_mapa_correcao.js" --envenenado-grava-por-cima
# C15.4 e C15.5: o que vai no PDF exportado (o capitulo sem as respostas do
# livro, e o gabarito daquele capitulo depois, so quando pedido), as paginas
# escolhidas e o rodape de fonte. O veneno deixa as respostas no capitulo.
roda "livros (regras) --envenenado-respostas-no-capitulo" node "_teste/testa_livros_regras.js" --envenenado-respostas-no-capitulo
# Revisao do C15.5: o gabarito do fim do capitulo (achado so pelo lugar) nunca
# tira pagina do capitulo exportado. O veneno volta a regra antiga.
roda "livros (regras) --envenenado-fim-do-capitulo-tira" node "_teste/testa_livros_regras.js" --envenenado-fim-do-capitulo-tira
# O sumario que a tela usa: marcadores lixo e sumario vazio dao lugar ao mapa.
roda "livros (regras) --envenenado-sumario-dos-marcadores" node "_teste/testa_livros_regras.js" --envenenado-sumario-dos-marcadores
roda "livros (regras) --envenenado-mapa-parcial-troca" node "_teste/testa_livros_regras.js" --envenenado-mapa-parcial-troca
# T2 (listas): a Biblioteca.fontesDoAssunto, as fontes da pagina do assunto
# (teoria, lista de base, exercicios e OBMEP) pelo modulo, pelo tema_app e pela
# tabela de vinculos, com o acervo sintetico. O veneno tira a guarda do id ja
# visto, e o item repetido aparece duas vezes no mesmo assunto. Sem Chrome.
roda "fontes do assunto"                        node "_teste/testa_fontes_do_assunto.js"
roda "fontes do assunto --envenenado-repete-item" node "_teste/testa_fontes_do_assunto.js" --envenenado-repete-item
# 13/11: o ENEM separado da OBMEP, a lista de base com buraco e a entrada que nao pode mudar
roda "fontes do assunto --envenenado-enem-na-obmep" node "_teste/testa_fontes_do_assunto.js" --envenenado-enem-na-obmep
roda "fontes do assunto --envenenado-base-com-buraco" node "_teste/testa_fontes_do_assunto.js" --envenenado-base-com-buraco
roda "fontes do assunto --envenenado-muda-entrada" node "_teste/testa_fontes_do_assunto.js" --envenenado-muda-entrada
# o caso real do MAT08-15: sem modulo proprio, herda os vizinhos declarados no indice
roda "fontes do assunto --envenenado-sem-vizinhos" node "_teste/testa_fontes_do_assunto.js" --envenenado-sem-vizinhos
# B3: a pagina impressa do livro (trechos romanos e arabicos, mudanca no meio,
# ida e volta em todas as paginas, tela e leitor mostrando a impressa e abrindo
# e gravando em pagina do arquivo, e recusa so do livro com numeracao invalida).
roda "livros (pagina impressa)"                 node "_teste/testa_livros_impressa.js"
roda "livros (pagina impressa) --envenenado-impressa-fora-por-um" node "_teste/testa_livros_impressa.js" --envenenado-impressa-fora-por-um
roda "livros (pagina impressa) --envenenado-posicao-lida-como-impressa" node "_teste/testa_livros_impressa.js" --envenenado-posicao-lida-como-impressa
roda "livros (pagina impressa) --envenenado-trecho-romano-zero" node "_teste/testa_livros_impressa.js" --envenenado-trecho-romano-zero
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
# 13f: o nome do cache que o tablet ve e o GERADO na publicacao, a partir do
# contador de publicacoes (_teste/versao_publicada.js). O CACHE do sw.js do
# repositorio fica fixo. Entao a pergunta das duas travas abaixo deixa de ser
# "o PR subiu o nome?" e passa a ser "o merge deste PR na main sobe o
# contador?" (--sobe): sobe se o diff base..HEAD muda algum arquivo que conta,
# que e exatamente o que o commit de merge na main conta. E a mesma regra do
# deploy (contaParaPublicacao): se alguem quebrar a regra do que conta (tirar
# o banco, por exemplo), a trava reprova o PR que muda o banco.
# (Na primeira rodada a trava comparava o contador do HEAD com o da base, e
# dava FALSO VERMELHO local quando a main tinha andado mais que o ramo: a
# historia de primeiro pai do ramo passa pelos commits dele, e nao pelos da
# main. No CI nao acontecia, porque la o HEAD e o merge sobre a ponta da main.)
sobe=""
if [ -n "$base" ]; then
  sobe=$(node _teste/versao_publicada.js --sobe "$base" HEAD 2>/dev/null || true)
fi
if [ -z "$sw_antes" ] || [ -z "$sw_agora" ]; then
  printf '  INSTAVEL %-23s sem base de merge com sw.js para comparar\n' "nome do cache"
  pulada=1
elif [ "$lista_agora" = "$(entradas_sw "$(lista_sw "$sw_antes")")" ]; then
  printf '  ok      %-24s a lista nao mudou desde a base do merge\n' "nome do cache"
elif [ "$sobe" != "sim" ] && [ "$sobe" != "nao" ]; then
  printf '  FALHOU  %-24s a lista mudou e nao consegui perguntar se a publicacao sobe (--sobe:[%s])\n' \
    "nome do cache" "$sobe"
  falhou=1
elif [ "$sobe" = "sim" ]; then
  printf '  ok      %-24s lista nova desde a base; o merge sobe o contador e a publicacao troca o nome do cache\n' "nome do cache"
else
  printf '  FALHOU  %-24s a lista de ARQUIVOS mudou desde a base e o merge nao sobe o contador da publicacao\n' \
    "nome do cache"
  falhou=1
fi

# A VERSAO NO DEPLOY (13f): pela arvore do merge com a origin/main (a do CI e
# buscada no job), e nao pela base, VERSAO e CACHE do PR tem de ser IGUAIS aos
# da main (sao gerados na publicacao), e o PR que leva arquivo do site traz
# novidades/<nome>.txt. PR que nao leva arquivo do site passa sem novidade. A
# regra e a do merge_seguro, que confere de novo contra a origin/main buscada na
# hora do merge. Le o HEAD commitado, nao o disco. Saida: 0 passou, 1 reprovou,
# 2 sem main (INSTAVEL).
saida=$(node _teste/testa_ordem_versao.js --conferir 2>&1) && codigo=0 || codigo=$?
printf '%s\n' "$saida"
if [ "$codigo" = "1" ]; then
  falhou=1
fi
if [ "$codigo" != "0" ] && [ "$codigo" != "1" ]; then
  pulada=1
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
# $1 = lista de mudados (vazia = nada mudou); $2 = o merge sobe o contador da
# publicacao (sim/nao, do --sobe; 13f: o nome publicado sai do contador)
decide_cache() {
  if [ -n "$1" ]; then dc_mudou=sim; else dc_mudou=nao; fi
  if [ "$2" = "sim" ]; then dc_novo=sim; else dc_novo=nao; fi
  veredito_cache "$dc_mudou" "$dc_novo"
}
p_cache=0; f_cache=0
# $1 = mudados; $2 = o merge sobe (sim/nao); $3 = o veredito esperado
afere_cache() {
  obtido=$(decide_cache "$1" "$2")
  if [ "$obtido" = "$3" ]; then
    p_cache=$((p_cache + 1))
  else
    f_cache=$((f_cache + 1))
    printf '    prova do cache: mudados=[%s] sobe=[%s] deu %s, esperado %s\n' \
      "$1" "$2" "$obtido" "$3"
  fi
}
afere_cache "app.js" nao reprova
afere_cache "app.js" sim passa
afere_cache ""       sim passa
afere_cache ""       nao passa
# so "sim" e sim: resposta vazia ou estranha nao vira subida
afere_cache "app.js" "" reprova
if [ "$f_cache" != "0" ]; then
  printf '  FALHOU  %-24s a prova da trava nao passou: %s de 5\n' "conteudo no cache" "$p_cache"
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
  if [ "$sobe" != "sim" ] && [ "$sobe" != "nao" ]; then
    # Nome vazio passava como "promovido", porque vazio e diferente de v22. Uma
    # reformatacao do sw.js (aspas duplas, const, espaco a mais) faria nome_sw
    # devolver vazio, e a trava imprimiria ok com o nome em branco.
    printf '  FALHOU  %-24s nao consegui perguntar se a publicacao sobe (--sobe:[%s])\n' \
      "conteudo no cache" "$sobe"
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
    if [ "$(decide_cache "$mudados" "$sobe")" = "reprova" ]; then
      printf '  FALHOU  %-24s mudou de conteudo e o merge nao sobe o contador da publicacao:%s\n' \
        "conteudo no cache" "$mudados"
      falhou=1
    elif [ -z "$mudados" ]; then
      printf '  ok      %-24s nenhum arquivo do pacote mudou de conteudo desde a base\n' "conteudo no cache"
    else
      printf '  ok      %-24s%s arquivo(s) do pacote mudaram e o merge sobe o contador da publicacao\n' \
        "conteudo no cache" "$(printf '%s' "$mudados" | wc -w | tr -d ' ')"
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

if [ -n "$provas_lista" ]; then
  # caminho da lista que nenhuma prova de navegador tem: erro de quem montou a
  # lista, e prova que nao rodou nao pode sair como verde
  sem_prova=$(printf '%s\n' "$provas_lista" | while IFS= read -r a; do
    printf '%s\n' "$provas_vistas" | grep -Fxq -- "$a" || printf '%s ' "$a"
  done)
  if [ -n "$sem_prova" ]; then
    printf '  FALHOU  %-24s caminho da lista sem prova de navegador: %s\n' "provas mapeadas" "$sem_prova"
    falhou=1
  fi
fi

printf '\n'
if [ -n "$pn" ] && [ -n "$provas_lista" ] && [ "$rodadas_aqui" = "0" ] && [ "$falhou" = "0" ]; then
  # o nivel 1 em fatias (#174): o plano so abre a fatia que tem prova da
  # selecao (provas_tocadas.js e divide_portao.js com PORTAO_SELECAO). Fatia do
  # nivel 1 sem prova e plano e fatia desencontrados, e era o unico verde sem
  # prova nenhuma: agora falha.
  printf 'HA FALHA. A fatia %s de %s do nivel 1 nao rodou prova nenhuma da lista: o plano e a fatia nao batem.\n' "$pk" "$pn"
  exit 1
fi
if [ -n "$pn" ] && [ "$rodadas_aqui" = "0" ] && [ "$falhou" = "0" ]; then
  # fatia vazia nao e fatia verde: com mais fatias que provas, a conta esta errada
  printf 'HA FALHA. A fatia %s de %s nao rodou prova nenhuma.\n' "$pk" "$pn"
  exit 1
fi
if [ "$falhou" != "0" ]; then
  printf 'HA FALHA. Nao faca o merge antes de resolver.\n'
elif [ -n "$provas_lista" ]; then
  # So o nivel 1 (com --pedaco, so a parte dele que cai nesta fatia): o verde dele nao e o portao inteiro, e diz isso.
  printf 'PROVAS MAPEADAS PASSARAM: %s das %s provas de navegador rodaram aqui (nivel 1). A bateria inteira so roda com o rotulo pronto.\n' \
    "$rodadas_aqui" "$numero_navegador"
  if [ "$instavel" != "0" ]; then printf 'Algum teste so passou na segunda vez (INSTAVEL acima).\n'; fi
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
