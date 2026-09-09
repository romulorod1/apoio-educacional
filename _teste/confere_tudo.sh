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
# O TERCEIRO ESTADO. Nao e ok, porque nao conferiu; nao e FALHOU, porque nao ha
# defeito. E o portao dizendo que uma parte dele nao rodou, e por isso ele nao
# pode dizer TUDO PASSOU nem sair com zero: "portao verde rodado solto uma vez"
# deixa de estar satisfeito EXPLICITAMENTE, e nao por omissao.
nao_conferido=0
# O QUE ficou sem conferir, para o resumo dizer em vez de supor.
nao_conferido_motivos=""
anota_nao_conferido() {
  nao_conferido=1
  nao_conferido_motivos="$nao_conferido_motivos
  - $1"
}
titulo() { printf '\n=== %s ===\n' "$1"; }

# Quantas verificacoes falharam na saida de um teste (vazio = nenhuma).
quantas_falhas() {
  printf '%s\n' "$1" | grep -oE "[0-9]+ falharam" | grep -oE "^[0-9]+" | tail -1
}
resumo() {
  printf '%s\n' "$1" | grep -E "passaram|PASSARAM|CONFIRMAD" | tail -1
}

# MEMORIA LIVRE E NAVEGADORES VIVOS, para um FALHOU se explicar sozinho.
#
# Em 08/09/2026 este portao imprimiu TRES FALHOU falsos seguidos, todos
# ERR_CONNECTION_REFUSED, numa maquina de 8 GB com 713 MB livres. O servidor
# ficou intermitentemente indisponivel sob pressao de memoria, e o testa_aluno
# PASSOU no meio dos tres, com 145 conferencias: prova de que ele nao tinha
# caido de vez. Repetir nao resolve, porque a causa dura mais que a segunda
# tentativa, e a repeticao ja tinha acontecido nos tres.
#
# Os vinte testes de navegador rodam num laco, um node por teste, cada um
# subindo o proprio Chrome, e o laco nao mata nada entre um e outro: depende de
# cada teste chamar o close() dele. Teste morto no meio deixa o Chrome vivo e o
# proximo sobe por cima, entao o acumulo e por construcao.
#
# Matar orfao consertaria o sintoma. Isto aqui conserta o DIAGNOSTICO, que e o
# dano maior: um FALHOU sem contexto manda quem le procurar defeito no ramo, e
# alarme falso em portao de merge ensina a ignorar alarme, que foi como uma
# regressao de tabela ja subiu para producao aqui.
#
# Degrada sozinho: sem powershell ou sem tasklist sai "?" e nada quebra.
livre_mb_agora() {
  powershell -NoProfile -Command \
    "[int]((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1024)" 2>/dev/null | tr -d '\r'
}
# CONTAR SEM O FILTRO DO TASKLIST, e isto e conserto de um defeito antigo.
#
# A forma anterior era `tasklist /FI "IMAGENAME eq chrome.exe" /NH`, e ela NUNCA
# funcionou aqui: o MSYS converte o `/FI` num caminho do Windows antes de o
# tasklist o ver, e sai
#
#   ERROR: Invalid argument/option - 'C:/Program Files/Git/FI'.
#
# O comando sai com codigo 1, a saida nao contem o nome do processo, e o grep -c
# devolve ZERO. Medido com oito Chrome vivos na maquina: a forma antiga dizia 0.
#
# Ou seja TODA linha "N navegador(es) vivo(s)" de ontem e de hoje foi zero por
# defeito, e nao por medida. A parte da memoria da mesma linha sempre esteve
# certa, porque `livre_mb_agora` usa PowerShell e nao passa por aqui.
#
# `//FI` funcionaria neste shell, e nao e usado de proposito: depender de como
# cada shell trata a barra foi exatamente o que quebrou. Sem filtro, conta-se na
# saida e acabou.
# ZERO SO PODE SIGNIFICAR ZERO. O codigo de saida do tasklist e a unica
# testemunha de que a contagem aconteceu, e a versao anterior descartava-o:
# `tasklist 2>/dev/null | grep -c ...` devolve 0 tanto para "nenhum processo"
# como para "o comando nao rodou", e o 2>/dev/null ainda esconde o motivo.
#
# Foi assim que a forma com switch enganou toda a gente durante dois dias. Nao
# repetir o mesmo padrao um nivel acima.
conta_processo() {
  saida_tl=$(tasklist 2>&1) && codigo_tl=0 || codigo_tl=$?
  if [ "$codigo_tl" != "0" ] || [ -z "$saida_tl" ]; then
    printf '?'
    return
  fi
  printf '%s\n' "$saida_tl" | grep -c "$1" || true
}
quantos_node() { conta_processo "node.exe"; }
estado_da_maquina() {
  livre=$(livre_mb_agora)
  navs=$(conta_processo "chrome.exe")
  nodes=$(quantos_node)
  [ -n "$livre" ] || livre="?"
  [ -n "$navs" ] || navs="?"
  [ -n "$nodes" ] || nodes="?"
  printf '%s MB livres, %s navegador(es) e %s node vivo(s)' "$livre" "$navs" "$nodes"
}

# A PORTA DECIDE POR AMOSTRA, E NAO POR UMA LEITURA.
#
# Medido em 08/09, quatro leituras em oito minutos com a carga parada (o total do
# claude variou 15 MB): o LIVRE variou 429 MB, de 418 a 847. Uma leitura
# instantanea de memoria livre erra por mais de 400 MB nesta maquina, e a
# diferenca entre passar e ser recusado cabe inteira dentro desse ruido.
#
# Entao a porta le TRES vezes, com alguns segundos entre elas, e decide pela
# MENOR. Menor e a escolha conservadora: a bateria vai entrar num instante que
# ninguem escolhe, e o que importa e o pior momento provavel, e nao o melhor.
# Custa nove segundos num portao de quinze minutos.
#
# O QUE ESTA AFIRMADO E SO ISTO: o livre variou 429 MB com a carga parada. A
# causa NAO foi isolada. O salto coincidiu com a Memory Compression esvaziando de
# 211 para 28 MB, o que e indicio e nao prova: quatro medidas numa maquina, sem
# repeticao em outra condicao e sem isolar o que esvaziava a compressao. A
# amostra vale mesmo que a causa seja outra, e e por isso que ela e o conserto.
#
# A medida do estado_da_maquina continua uma leitura so, de proposito: la ela e
# DIAGNOSTICO e nao decisao, e o custo de errar e uma linha imprecisa no log, e
# nao uma rodada perdida.
livre_amostrado() {
  # Ecoa "menor|l1 l2 l3".
  la_1=$(livre_mb_agora); sleep 3
  la_2=$(livre_mb_agora); sleep 3
  la_3=$(livre_mb_agora)
  la_menor=$la_1
  for la_v in $la_2 $la_3; do
    if [ -n "$la_v" ] && [ -n "$la_menor" ] && [ "$la_v" -lt "$la_menor" ] 2>/dev/null; then
      la_menor=$la_v
    fi
  done
  printf '%s|%s %s %s' "$la_menor" "$la_1" "$la_2" "$la_3"
}

# LINHA ANOTADA A MAO DEIXA A COLUNA DA PORTA VAZIA quando a medida nao for de
# porta. Nome de coluna e uma AFIRMACAO sobre o numero que esta nela, e quem le
# a tabela depois le a afirmacao da coluna, nao a ressalva no texto ao lado.
#
# Aconteceu comigo em 09/09/2026: pus os 595 MB medidos NO MEIO da bateria na
# coluna livre_na_porta_MB, escrevi "nao e leitura de porta" no desfecho, e
# depois li a minha propria tabela concluindo que havia uma morte com 713 ACIMA
# de uma sobrevivencia com 595, e que o numero da porta nao predizia a morte.
# Falso: 713 e 579 sao medidas de PORTA e 595 e de TRAVESSIA, e o bloco do piso
# la embaixo ja explicava a diferenca. Nome igual e unidade igual nao fazem duas
# medidas comparaveis.
#
# UMA LINHA DE HISTORICO POR RODADA, para o piso poder descer com dado.
#
# O numero da porta ja existe, e se perde no log de uma corrida so. Guardando uma
# linha por rodada, a primeira rodada VERDE de qualquer frente entra sozinha, e
# em tres ou quatro rodadas o piso se calibra pela distribuicao real em vez de
# por opiniao. Hoje falta exatamente isso: ha duas mortes anotadas (713 e 579) e
# nenhuma entrada bem sucedida.
#
# O caminho e configuravel e o padrao fica DENTRO do repositorio, ignorado pelo
# git. Cravar aqui o caminho de um Drive pessoal seria fragil e desnecessario:
# quem quiser o historico compartilhado entre as frentes aponta PORTAO_HISTORICO
# para o arquivo comum. Falha de escrita nao derruba o portao: historico e
# registro, e nao conferencia.
HISTORICO_MEM="${PORTAO_HISTORICO:-_teste/_memoria.tsv}"
registra_memoria() {
  # $1 = livre na porta da bateria (ou vazio), $2 = desfecho
  # As chaves em volta importam: o 2>/dev/null solto silencia o printf, e quem
  # reclama de caminho impossivel e o SHELL, na redirecao. Sem elas, um
  # PORTAO_HISTORICO invalido imprime linha de erro no meio do log do portao.
  cabecalho='data\thora\tlivre_na_porta_MB\tpiso_MB\tdesfecho\torigem\tleituras'
  if [ ! -f "$HISTORICO_MEM" ]; then
    { printf '%b\n' "$cabecalho" > "$HISTORICO_MEM"; } 2>/dev/null || return 0
  else
    # CONFERIR O CABECALHO, e nao so a existencia do arquivo. A coluna das tres
    # leituras entrou depois de o arquivo nascer: um arquivo antigo tem seis
    # colunas no cabecalho e passaria a receber linhas de sete, em silencio, e
    # quem calibrasse o piso depois leria a coluna errada. Historico e registro
    # e nao conferencia, entao aqui se AVISA e segue; nunca derruba o portao.
    primeira=$(head -n 1 "$HISTORICO_MEM" 2>/dev/null || true)
    esperado=$(printf '%b' "$cabecalho")
    if [ "$primeira" != "$esperado" ]; then
      printf '  (aviso: %s tem cabecalho de outra versao; as linhas novas tem 7 colunas)\n' \
        "$HISTORICO_MEM"
    fi
  fi
  # A coluna de origem existe para uma linha anotada a mao nunca se passar por
  # medida do portao. Daqui a um mes ninguem lembra qual e qual, e o piso vai ser
  # calibrado com estas linhas.
  # A coluna das leituras existe porque o numero da porta e a MENOR de tres, e
  # sem as tres a distribuicao que vai calibrar o piso nasce com o ruido de 429
  # MB dentro dela, sem ninguem poder ver.
  { printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$(date +%Y-%m-%d)" "$(date +%H:%M)" "${1:-?}" "${PISO_MB:-?}" "$2" "portao" "${leituras:-?}" >> "$HISTORICO_MEM"; } 2>/dev/null || true
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
      printf '          (na hora da falha: %s)\n' "$(estado_da_maquina)"
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
      # O servidor mudo tem nome proprio, e nao e "o teste falhou". Ele foi a
      # causa dos tres FALHOU falsos de 08/09, e sai separado para quem le nao
      # comecar procurando no ramo.
      if printf '%s\n' "$saida2" | grep -q "ERR_CONNECTION_REFUSED"; then
        printf '  FALHOU  %-24s o servidor de 8777 nao respondeu; pode nao ser defeito do ramo\n' "$nome"
      else
        printf '  FALHOU  %-24s nao disse que passou: %s\n' "$nome" "$motivo"
      fi
      printf '          (na hora da falha: %s)\n' "$(estado_da_maquina)"
    fi
    falhou=1
  else
    printf '  INSTAVEL %-23s passou na segunda vez\n' "$nome"
    instavel=1
  fi
}

# A MAQUINA NO COMECO DE TUDO, e nao so na porta da bateria.
#
# Medido em 08/09: uma rodada lancada com 1.035 MB livres, conferidos a mao antes
# de comecar, chegou na bateria com 783. O PROPRIO portao consome uns 250 MB nas
# secoes anteriores, antes de abrir o primeiro navegador.
#
# Por isso o par de numeros fica no log. Medir antes de lancar NAO basta: quem
# lanca com 1.000 chega na porta da bateria com 750 e e recusado, depois de ja ter
# gasto os cinco minutos das secoes anteriores. Com os dois numeros em toda
# rodada, esse custo deixa de ser deducao e vira dado.
printf '\n  (maquina no comeco do portao: %s)\n' "$(estado_da_maquina)"

# TODA PROVA ESTA NO PORTAO, OU NA LISTA DE FORA COM MOTIVO.
#
# Aconteceu DUAS vezes na frente de figuras: uma prova de 1013 linhas e 171
# conferencias existia e nao estava aqui. Na primeira vez foi um revisor que
# achou; na segunda, a propria frente, muito trabalho depois. Ela afirmava so
# enquanto alguem lembrasse de roda-la a mao, e ninguem lembra duas vezes.
#
# Duas ocorrencias do mesmo esquecimento querem dizer que ele NAO PODE VIVER NA
# LEMBRANCA. Aqui ele reprova.
#
# A lista de fora nao e escape: e declaracao. Cada linha carrega o motivo, e o
# motivo fica no arquivo para quem vier depois discordar dele. Prova nova que
# ninguem ligou nao entra na lista sozinha: ela reprova ate alguem decidir.
#
# Medido em 09/09/2026: 56 candidatos, 51 no portao, 5 fora. Tres sao exclusao
# legitima e DOIS sao divida declarada, que e diferente de esquecimento.
#
# A REGRA DO CANDIDATO, escrita porque ela e uma lista implicita.
#
# O conjunto abaixo e definido por CONVENCAO DE NOME, e isso e o mesmo defeito da
# lista de exclusao implicita, um nivel acima: quem escrever _confere_x.js escapa
# sem ninguem ver. Nao da para consertar de vez sem inventar outra convencao, e
# por isso a regra fica escrita aqui, para quem ampliar depois saber o que estava
# coberto e o que nao estava.
#
# Sao candidatos hoje:
#   _teste/testa_*.js            as suites do aplicativo
#   _teste/e2e*.js               ponta a ponta, que imprimem o mesmo dialeto
#   figuras/_prova_*.js          as provas do kit
#   figuras/_piloto_*.js         os pilotos de tema
#   figuras/_audita_*.js         os auditores
#   temas/_ferramentas/testa_*.py as provas do verificador
#
# NAO sao candidatos, de proposito: rasterizadores (*_png.py, *_render.py), que
# geram imagem para olhar e nao afirmam nada, e o resto do codigo de producao.
#
# O e2e*.js entrou nesta lista por medida e nao por simetria: os dois imprimem
# "N passaram, M falharam" e nenhum dos dois estava ligado. Escapavam so pelo
# nome, que e exatamente o que esta regra existe para nao deixar acontecer.
FORA_DO_PORTAO="figuras/_piloto_base.js|biblioteca do piloto de tema, nao afirma nada sozinha; quem afirma e o _prova_piloto_base.js, que esta no portao
figuras/_prova_desenho_auditor.js|auditor usado pelo _prova_desenho.js, nao roda sozinho
figuras/_prova_formula.js|gera a folha _prova_formula.pdf para OLHAR, nao imprime placar; quem afirma e o figuras/testa_formula.js
figuras/_prova_marcas_bloco.js|DIVIDA: imprime 'nenhuma reprova', dialeto que a funcao roda nao le. A prova existe e nao roda. Sai da divida ensinando o dialeto a ela ou trocando a saida da prova
figuras/_prova_marcas_travas.js|DIVIDA: imprime 'todos os resultados', mesmo caso do bloco acima
_teste/e2e.js|DIVIDA: imprime no dialeto do portao e nao roda. Escapava por se chamar e2e e nao testa_. Precisa de decisao: ligar no portao ou aposentar
_teste/e2e_correcoes.js|DIVIDA: mesmo caso do e2e.js
figuras/_audita_desenho.js|biblioteca do _prova_desenho.js, nao roda sozinha
figuras/_audita_receitas.js|auditor rodado a mao pela frente de figuras, nao imprime placar no dialeto do portao
figuras/_audita_receitas_cor.js|mesmo caso do _audita_receitas.js
figuras/_audita_receitas_gab.js|reprova hoje na main: dois arcos rotulados com angulo diferente do que varrem. Ja estava citado no comentario da secao do kit"

titulo "toda prova no portao"
# A TRAVA TIRA DO TEXTO A SUA PROPRIA MAQUINARIA, e nao so os comentarios.
#
# Ela procura nomes de arquivo dentro deste arquivo, e ela FAZ PARTE dele. A
# mesma armadilha apareceu tres vezes seguidas aqui, em tres formas:
#
#   1. o comentario que cita o nome de uma prova (tirado pelo grep -v)
#   2. a lista FORA_DO_PORTAO, que nao e comentario, e atribuicao: os cinco
#      nomes dela contavam como "esta no portao", e o ensaio deu 56 de 56 onde a
#      medida a mao dava 51 e 5
#   3. o proprio padrao de candidatos do laco abaixo, que contem os globs que
#      ele procura: o _teste/e2e.js casava com o '_teste/e2e*.js' da linha do
#      for, e a conta deu 52 onde a mao dava 51
#
# E o mesmo defeito que este arquivo ja documenta em outros dois lugares, de
# procurar um nome no arquivo inteiro e ser cegado por uma mencao que nao e
# chamada. Quem procura no proprio arquivo tira TODA a sua maquinaria do texto.
sem_comentario=$(sed -e '/^FORA_DO_PORTAO="/,/"$/d' -e '/^for prova in /,/; do$/d' "$0" \
  | grep -v '^[[:space:]]*#')
candidatos=0
no_portao=0
esquecidas=""
declaradas=0
for prova in _teste/testa_*.js _teste/e2e*.js figuras/_prova_*.js figuras/_piloto_*.js \
             figuras/_audita_*.js temas/_ferramentas/testa_*.py; do
  [ -f "$prova" ] || continue
  candidatos=$((candidatos + 1))
  nu=$(basename "$prova"); nu=${nu%.js}; nu=${nu%.py}
  # Nome NU, porque a bateria de navegador chama pelo laco, sem extensao. E o
  # comentario fica de fora da busca: citar o nome num comentario nao roda nada,
  # e foi assim que uma medicao minha errou antes de eu conferir.
  if printf '%s\n' "$sem_comentario" | grep -qE "(^|[^A-Za-z0-9_-])$nu([^A-Za-z0-9_-]|\$)"; then
    no_portao=$((no_portao + 1))
  # O VALOR INTEIRO, e nao o comeco dele. Este braco casava por subcadeia
  # enquanto o irmao acima casa com fronteira de palavra, e a assimetria abria
  # dois buracos, os dois medidos com veneno: um motivo que nomeia outra prova
  # seguida de barra vertical dava a prova por declarada, e uma entrada cujo
  # caminho TERMINA com o nome da prova tambem passava. A lista ja e cheia de
  # motivos que citam o nome de outra prova, entao a protecao era acidental.
  #
  # O awk compara o primeiro campo por IGUALDADE e exige motivo nao vazio no
  # segundo, para entrada sem motivo continuar reprovando.
  elif printf '%s\n' "$FORA_DO_PORTAO" \
       | awk -F'|' -v p="$prova" '$1 == p && $2 != "" { achou = 1 } END { exit !achou }'; then
    declaradas=$((declaradas + 1))
  else
    esquecidas="$esquecidas $prova"
  fi
done
if [ "$candidatos" = "0" ]; then
  printf '  FALHOU  %-24s nao achei prova nenhuma para conferir: o padrao de nomes mudou?\n' "toda prova no portao"
  falhou=1
elif [ -n "$esquecidas" ]; then
  printf '  FALHOU  %-24s prova que existe e ninguem roda, e nao esta na lista de fora:%s\n' \
    "toda prova no portao" "$esquecidas"
  printf '            ou entra no portao, ou entra no FORA_DO_PORTAO com o motivo escrito.\n'
  falhou=1
else
  printf '  ok      %-24s %s de %s provas no portao, %s fora com motivo declarado\n' \
    "toda prova no portao" "$no_portao" "$candidatos" "$declaradas"
fi


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
# Frente 3 (figuras), 07/09/2026. Os dois pilotos novos rodam SEM argumento, ou
# seja, contra o temas/banco.json, que e como os outros tres ja rodam aqui: o
# retrato figuras/_tema_<ID>.json e gitignored e serve so a autoria. O
# _varredura_banco nao prova receita nenhuma, prova o BANCO: e o verificador do
# criterio de pronto desta frente (nenhum exercicio manda olhar uma figura que a
# folha nao tem), e por isso ele fica aqui e nao no piloto de um tema.
roda "prova do piloto"  node figuras/_prova_piloto_base.js
roda "receitas plano"   node figuras/_prova_receitas_plano.js
roda "piloto MATEM3-12" node figuras/_piloto_MATEM3-12.js
roda "piloto MATEM3-03" node figuras/_piloto_MATEM3-03.js
roda "varredura banco"  node figuras/_varredura_banco.js
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
# O PORTAO SE RECUSA A COMECAR A BATERIA SEM MEMORIA.
#
# Duas mortes medidas em 08/09/2026, as duas pelo sistema, por falta de memoria,
# as duas deixando o python da 8777 pendurado e nenhuma delas dizendo o motivo:
#
#   713 MB livres: morreu NO MEIO da bateria, depois de tres FALHOU falsos por
#                  ERR_CONNECTION_REFUSED, com o testa_aluno passando entre eles,
#                  com 145 conferencias, o que provou que o servidor nao tinha
#                  caido de vez: ficou intermitente sob pressao
#   579 MB livres: morreu AO ENTRAR na bateria, logo depois de levantar o
#                  servidor, com 38 ok e zero FALHOU
#
# Morrer no meio custa quinze minutos, nao imprime veredito nenhum e deixa
# servidor orfao, que envenena a rodada seguinte. Recusar-se a comecar custa dois
# segundos, diz o numero que falta e nao suja nada.
#
# DE ONDE VEM O PISO, e ele e DERIVADO e nao escolhido.
#
#   maior fracasso conhecido na porta ... 713 MB livres
#   pior custo medido quando o piso foi fixado, tres perfis ... 567 MB
#   ------------------------------------------------------
#   piso ................................ 1280 MB (713 + 567)
#
# O PIOR MEDIDO JA SUBIU DESDE ENTAO, e o piso NAO acompanhou, de proposito. Com
# cinco perfis o pior e 591, replicado em 590 na corrida seguinte, e a formula
# daria 1304. A diferenca e de 24 MB, que e menos que o espalhamento das proprias
# medidas, e persegui-la commit a commit e exatamente a corrida atras do recorde
# que a nota do vies, mais abaixo, diz que nao acaba.
#
# A REGRA PARA MEXER, entao, e esta: atualizar o piso quando o pior medido o
# ultrapassar por MAIS do que o espalhamento das medidas, e nao a cada recorde
# novo. Hoje: pior 591, custos observados de 472 a 591, espalhamento 119, piso
# 1280 contra formula 1304. Nao mexe.
#
# O PISO SUBIU EM 09/09/2026, e a formula nao mudou: mudou a segunda parcela.
# Ela era 257 MB, o pico de UM navegador medido ISOLADO, e a grandeza certa e
# quanto a bateria consome A PARTIR DA PORTA, porque e com a leitura da porta
# que o piso e comparado. Sao grandezas diferentes, e a antiga estava no lugar
# da nova.
#
# O numero passou por duas correcoes antes de assentar, e as duas ficam ditas
# porque explicam por que nao se deve confiar na primeira medida de nada:
#
#   1. o primeiro valor reportado, 510, era a QUEDA entre amostras vizinhas, e
#      nao o consumo a partir da porta. Foi retirado por quem o mediu;
#   2. o segundo, tirado da amostra mais funda de cada perfil, estava inflado por
#      leitura solta. Com "fundo" definido como PATAMAR (a mediana das cinco
#      leituras mais baixas) os tres perfis descem. A escolha escondida dentro da
#      palavra "fundo" valia 40 MB em dois perfis e 131 MB no terceiro.
#
# Os tres perfis, dois operadores, mesma regua:
#
#   figuras-eq     porta 1761  fundo 1194  ->  567   <- o pior, e o que a formula usa
#   figuras-lote1  porta 1560  fundo 1047  ->  513
#   frente1        porta 1512  fundo 1040  ->  472
#
# Medidos com um amostrador que roda POR FORA do portao, porque por dentro nao
# da: quando o portao le, o navegador do primeiro teste ja fechou.
#
# O 1280 NAO E UM NUMERO PRECISO, e os quatro digitos enganam. As duas parcelas
# sao grossas: 713 e UMA morte, e 567 e o pior de tres perfis que variaram de 472
# a 567. Qualquer valor numa faixa de umas dezenas de MB em volta serve
# igualmente bem, e nenhum dado observado distingue um do outro.
#
# E ha um caso em que a precisao aparente engana de verdade: em 09/09/2026 este
# piso recusou uma entrada com 1274 MB, ou seja por SEIS MB, numa amostra cujas
# tres leituras variavam TREZE. A margem da decisao ficou menor que o ruido da
# leitura, e quando isso acontece QUEM DECIDE E A REGRA, E NAO A MEDIDA.
#
# A regra continua boa por assimetria, e nao por precisao: decidir pela MENOR das
# tres erra para o lado seguro, recusando maquina que talvez aguentasse e nunca
# aceitando maquina que nao aguenta. Errar recusando custa espera; errar
# aceitando custa a rodada e deixa orfaos.
#
# Corolario para quem for ajustar: nao vale a pena mexer no piso por dezenas de
# MB. Mexer vale quando a DERIVACAO muda, como mudou duas vezes hoje.
#
# E DE QUE LADO ELE ERRA, que e diferente de quanto ele erra.
#
# A parcela do custo e "o pior observado", ou seja um MAXIMO SOBRE A AMOSTRA, e
# isso e um estimador ENVIESADO PARA BAIXO do pior real: cada perfil novo tem
# chance de bater o recorde, e entao a sequencia sobe por construcao. Ate agora:
#
#   472  ->  567  ->  591
#
# Uma parcela definida como "o pior que eu ja vi" tem GARANTIA de ser excedida
# outra vez. O piso e portanto OTIMISTA por construcao, e sempre para o mesmo
# lado.
#
# A consequencia que muda o comportamento de quem le: se uma rodada morrer com a
# leitura da porta ACIMA do piso, isso NAO e surpresa nem defeito da regra. E o
# comportamento esperado de uma parcela enviesada para baixo. A resposta certa e
# atualizar a parcela com o novo pior, e nao desconfiar do desenho.
#
# O QUE ESTA MUDANCA NAO E, e isto importa para quem ajustar depois: NAO e
# fronteira medida. Nenhum ponto de porta conhecido cai entre 950 e 1280, entao
# qualquer piso nessa faixa classifica os observados igualmente bem e o dado NAO
# distingue um do outro. E correcao da DERIVACAO, e nao medicao do LIMITE.
#
# E a propria formula e HEURISTICA, e nao derivacao de um limiar de sobrevivencia:
# "pior fracasso na porta mais o custo" exige, com custo de 567, um fundo de 713,
# que por acaso e o valor de uma PORTA de uma morte. A forma coincidir nao faz
# principio. O que os dados dizem e sobre o FUNDO: morre com fundo perto de zero
# ou de cem, sobrevive com fundo de 1040 para cima. Entre cem e mil nao ha medida
# nenhuma, e e essa a evidencia que falta.
#
# O que ela corrige e uma promessa implicita. Com custo de 567, um piso de 950
# deixaria 440 MB de fundo; o menor fundo ja observado a sobreviver e 856, na
# rodada que entrou com 1366. O piso antigo afirmava seguranca 416 MB abaixo de
# qualquer coisa observada.
#
#   porta  579  fundo   69  morreu
#   porta  713  fundo  203  morreu
#   porta 1366  fundo  856  passou   <- o menor fundo que se sabe sobreviver
#   porta 1542  fundo 1032  passou
#   porta 1659  fundo 1149  passou
#   porta 1761  fundo 1251  passou
#
# Tres perfis, dois operadores. O quarto entra na mesma tabela com a mesma regua.
#
# Os 257 MB foram medidos em 08/09/2026 subindo UM Chrome do jeito que os testes
# sobem (headless novo, perfil proprio, o aplicativo aberto e uma tela usada) e
# amostrando a memoria livre do sistema a cada 600 ms: caiu de 604 para 347 no
# vale, e voltou a 962 depois de fechar.
#
# A soma tem logica: 713 MB nao bastaram para o laco continuar, entao o piso
# precisa cobrir aquele fracasso MAIS o custo de entrar na bateria.
#
# O PISO E CONFERIDO UMA VEZ, NA PORTA, E ISSO E UMA ESCOLHA COM LIMITE CONHECIDO.
#
# Ate 09/09/2026 o motivo escrito aqui era que o pico e a ENTRADA: o primeiro
# navegador sobe com todo o resto ainda carregado, e depois o consumo cai porque
# cada teste fecha o dele. Vinha de tres pontos grossos de 08/09 (595 MB no meio
# da bateria nao matou; 579 e 713 ao entrar mataram).
#
# NAO SE SABE ONDE FICA O PIOR MOMENTO, e a premissa velha nunca foi medida.
#
# Ela foi inferida de tres leituras grossas de porta, e nao de nenhum perfil.
# Cinco perfis completos foram medidos em 09/09 e NENHUM responde a pergunta,
# por um defeito do instrumento que quem o escreveu retirou: a fronteira entre a
# janela de "entrada" e a de "tardio" e uma CONSTANTE de 180 s, e as corridas
# duram cerca de 560. A constante nao separa entrada de sustentacao: separa o
# primeiro terco do resto.
#
# E o sinal da comparacao inverteu entre dois perfis seguidos, o que confirma que
# ela nao esta a medir o que o nome dela diz:
#
#   lote2      entrada 810, tardio 757
#   solidos    entrada 787, tardio 801
#
# Entao o estado da questao e NAO SE SABE, que e mais fraco e mais honesto que
# "nao tem lugar fixo", como eu tinha escrito aqui a partir de uma comparacao que
# o autor dela depois retirou. Responder exige uma fronteira DERIVADA da corrida,
# e nao fixa, o que e mudanca de instrumento e nao de leitura.
#
# Entao conferir so na porta nao e "suficiente porque o pico e ali": e uma
# escolha que troca cobertura por simplicidade, e cujo limite agora esta medido.
# Ela continua defensavel, porque a margem do piso cobre o tardio nas tres
# rodadas observadas, e porque abortar no meio custa a rodada de qualquer jeito.
#
# PENDENCIA REGISTRADA, e nao consertada aqui: uma conferencia no MEIO da
# bateria, que abortasse limpo em vez de deixar o sistema matar. Morrer no meio
# custa quinze minutos, nao imprime veredito e deixa servidor orfao; abortar
# custa dois segundos e diz o numero. E o mesmo argumento que criou a conferencia
# da porta, aplicado ao lugar que os perfis mostraram.
#
# COMO AJUSTAR, e o numero nao e sagrado. Sobe quando uma morte acontecer acima
# dele, e a data entra na lista de cima. DESCE quando alguem registrar uma
# rodada inteira BEM SUCEDIDA abaixo dele, que e a evidencia que hoje falta:
# ninguem anotou a memoria livre das rodadas que passaram.
#
# Piso baixo demais deixa o portao morrer; piso alto demais deixa o portao
# recusar sem precisar. As duas falhas sao VISIVEIS, e e isso que torna o ajuste
# barato: uma imprime NAO CONFERIDO com o numero, a outra deixa cadaver.
PISO_MB=1280
amostra=$(livre_amostrado)
livre_mb=${amostra%%|*}
leituras=${amostra#*|}
# Estes numeros ficam no log de PROPOSITO, em toda rodada, inclusive nas que
# passam: e a evidencia que falta hoje para o piso poder DESCER com fundamento.
# As TRES leituras vao junto porque a decisao e pela menor, e quem for calibrar o
# piso precisa ver a dispersao e nao so o numero escolhido.
printf '  (maquina no comeco da bateria: %s, piso %s MB)\n' "$(estado_da_maquina)" "$PISO_MB"
printf '  (memoria na porta, tres leituras: %s MB; decide a menor, %s MB)\n' "$leituras" "$livre_mb"
# ORFAO DA RODADA ANTERIOR, avisado ANTES de a memoria ser julgada.
#
# Ideia da frente 3, com argumento medido: a alternativa era lembrar de parar o
# amostrador depois de ler o perfil, e a taxa de acerto da lembranca hoje foi
# ZERO EM DOIS, uma falha de cada frente. Varredura nao depende de lembranca.
#
# Conta `node` e nao `chrome`: nesta maquina o node so existe por causa da
# bateria, e o Chrome pode ser o navegador do Romulo aberto.
#
# AVISA e nao RECUSA, de proposito. Orfao derruba a leitura livre, ou seja
# empurra a decisao para o lado SEGURO e nao cria risco de entrar mal. O dano
# dele e de DIAGNOSTICO: quem le "pouca memoria" fecha programas quando o que
# precisava era matar o proprio lixo da rodada morta.
nodes_na_porta=$(quantos_node)
if [ "$nodes_na_porta" = "?" ]; then
  printf '  (a contagem de processos NAO MEDIU: o tasklist nao rodou. Nao e zero.)\n'
elif [ -n "$nodes_na_porta" ] && [ "$nodes_na_porta" -gt 0 ] 2>/dev/null; then
  printf '  (ATENCAO: %s processo(s) node vivos ANTES da bateria. Nesta maquina o node\n' "$nodes_na_porta"
  printf '   so roda por causa dela, entao provavelmente sao orfaos de uma rodada morta.\n'
  printf '   Eles derrubam a leitura acima. Antes de fechar programas, mate-os pela raiz.)\n'
fi
livre_na_porta=$livre_mb
roda_bateria=sim
if [ -n "$livre_mb" ] && [ "$livre_mb" -lt "$PISO_MB" ] 2>/dev/null; then
  roda_bateria=nao
  anota_nao_conferido "a bateria de navegador, por falta de memoria na maquina"
  printf '  NAO CONFERIDO %-19s a bateria nao rodou: %s MB livres, piso %s MB\n' \
    "com navegador" "$livre_mb" "$PISO_MB"
  printf '                isto e a MAQUINA e nao o ramo. Feche o que puder e rode de novo.\n'
  printf '                Duas mortes medidas em 08/09, com 713 MB e com 579 MB livres.\n'
fi
if [ "$roda_bateria" = "sim" ]; then
# A SEGUNDA MEDIDA, DEPOIS DO PRIMEIRO TESTE DE NAVEGADOR, e ela NAO e o custo
# de entrada. Ja foi rotulada assim e o rotulo era falso.
#
# Medido na primeira rodada verde, em 09/09/2026: linha de base 1404 MB, esta
# medida 1417 MB. SUBIU 13 MB. Nao ha custo nenhum a ler aqui, e o motivo e a
# posicao: a linha esta depois de `roda` retornar, e `roda` espera o teste
# terminar, entao o navegador ja fechou e devolveu tudo.
#
# CORRECAO DE UMA EVIDENCIA MINHA: eu escrevi aqui que "o proprio texto denuncia,
# ao dizer 0 navegador(es) vivo(s) ao lado do numero". A conclusao esta certa e a
# evidencia era ARTEFATO: naquela altura a contagem de navegadores estava
# quebrada e imprimia zero sempre, com Chrome vivo ou nao. Ver o bloco de
# `conta_processo`. A conclusao vale pela POSICAO, medida, e nao por aquele zero.
#
# O que ela serve para ver: se a maquina ficou pior DEPOIS de um ciclo completo
# de teste, o que acusaria navegador orfao ou memoria nao devolvida.
#
# O CUSTO DE ENTRADA TEM MEDIDA DESDE 09/09/2026, e ela vive no BLOCO DO PISO,
# la em cima, com os tres perfis e a regua. Nao repito o numero aqui de
# proposito: este comentario ja teve de ser reescrito TRES vezes em duas horas,
# porque citava um valor que estava a mudar. Apontar para onde o numero vive nao
# envelhece; copiar o numero envelhece a cada correcao.
#
# O que importa saber neste ponto do arquivo e so isto: a medida NAO sai daqui,
# e sai de um amostrador que roda POR FORA do portao, comecando antes da bateria.
# Aqui o navegador ja fechou.
primeiro_navegador=sim
for t in testa_temas testa_registro testa_busca testa_mapa_e2e testa_mapeamento \
         testa_perfil testa_olho testa_atualizacao testa_atualizacao_real \
         testa_biblioteca_offline \
         testa_exclusoes testa_feriados testa_mover testa_retroativo testa_series \
         testa_assunto testa_aluno testa_familia testa_proposta_tela \
         testa_tabela_no_app; do
  roda "$t" node "_teste/$t.js"
  if [ "$primeiro_navegador" = "sim" ]; then
    primeiro_navegador=nao
    printf '  (depois do primeiro teste, com o navegador dele ja fechado: %s)\n' \
      "$(estado_da_maquina)"
  fi
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
fi

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
roda "painel de valores"                        node "_teste/testa_painel_valores.js"
roda "painel de valores --envenenado-aberto"    node "_teste/testa_painel_valores.js" --envenenado-aberto
roda "painel de valores --envenenado-esquece"   node "_teste/testa_painel_valores.js" --envenenado-esquece

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
  # NAO CONFERIDO, e nao instavel: nao comparar nao e passar na segunda vez.
  printf '  NAO CONFERIDO %-19s sem base de merge com sw.js para comparar\n' "nome do cache"
  anota_nao_conferido "o nome do cache no sw.js, por falta de base de merge"
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
  # NAO CONFERIDO, pelo mesmo motivo da vizinha.
  printf '  NAO CONFERIDO %-19s sem base de merge com sw.js para comparar o conteudo\n' "conteudo no cache"
  anota_nao_conferido "o conteudo do cache no sw.js, por falta de base de merge"
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
  # QUEM PROCURA TEM QUE DIZER QUANTO OLHOU.
  #
  # Sem estes contadores, uma lista_agora vazia faz o laco nao rodar, mudados
  # ficar vazio, e esta trava imprimir "ok: nenhum arquivo do pacote mudou".
  # Verde, afirmando sobre ZERO arquivos. A trava vizinha reprova a lista vazia,
  # entao o portao nao aprovaria o merge, mas esta linha continuaria mentindo, e
  # mentira verde no meio de um log e o que ensina a nao ler o log.
  #
  # "Zero achados" sozinho e indistinguivel de cegueira. "Zero achados em 37 de
  # 37" e uma afirmacao.
  na_lista=0
  conferidos=0
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
    na_lista=$((na_lista + 1))
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
    conferidos=$((conferidos + 1))
    if ! git --literal-pathspecs diff --quiet "$base" -- "$c" 2>/dev/null; then
      mudados="$mudados $c"
    fi
  done
  set +f
  IFS=$ifs_antes
  nome_agora=$(nome_sw "$sw_agora")
  nome_antes=$(nome_sw "$sw_antes")
  if [ "$na_lista" = "0" ]; then
    # Nao e "nada mudou": e "nao olhei nada". As duas saidas sao iguais para quem
    # le, e so uma delas e uma conferencia.
    printf '  FALHOU  %-24s a lista ARQUIVOS do sw.js veio vazia: nao conferi arquivo nenhum\n' \
      "conteudo no cache"
    falhou=1
  elif [ -z "$nome_agora" ] || [ -z "$nome_antes" ]; then
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
      printf '  ok      %-24s nenhum dos %s arquivos do pacote mudou de conteudo desde a base\n' \
        "conteudo no cache" "$conferidos"
    else
      printf '  ok      %-24s%s arquivo(s) do pacote mudaram e o cache subiu para %s\n' \
        "conteudo no cache" "$(printf '%s' "$mudados" | wc -w | tr -d ' ')" "$nome_agora"
    fi
  fi
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
#
# A ORDEM DESTES TESTES E O CONSERTO, e nao detalhe de estilo.
#
# Antes, a pergunta "algum veneno deixou de mudar o app.js?" vinha ANTES de
# "o codigo de hoje ainda produz o literal?". Isso da o diagnostico trocado
# justamente no caso que a trava existe para pegar: quando alguem tira o literal
# da linha de codigo de carregarSerie, o sed do veneno_some nao acha mais o que
# substituir, o texto sai igual ao original, e o portao reprovava dizendo "um dos
# venenos nao mudou o app.js: a prova da trava nao prova nada". Quem lia ia
# conferir a prova da trava, que estava boa, em vez de olhar o app.js, que estava
# quebrado. Reprovar certo pelo motivo errado custa a hora de quem procura.
#
# Perguntando n_agora primeiro, o defeito real e nomeado pelo nome, e a queixa
# sobre o veneno so aparece quando o codigo de hoje esta bom e a prova e que
# apodreceu.
if [ -z "$app_agora" ]; then
  printf '  FALHOU  %-24s nao consegui ler o app.js\n' "serie da matematica"
  falhou=1
elif [ "$n_agora" = "0" ]; then
  printf '  FALHOU  %-24s a linha de carregarSerie nao produz mais o literal banco/serie- para a matematica\n' "serie da matematica"
  falhou=1
elif [ "$veneno_troca" = "$app_agora" ] || [ "$veneno_some" = "$app_agora" ]; then
  printf '  FALHOU  %-24s um dos venenos nao mudou o app.js: a prova da trava nao prova nada\n' "serie da matematica"
  falhou=1
elif [ "$n_troca" != "0" ] || [ "$n_some" != "0" ]; then
  printf '  FALHOU  %-24s a trava nao enxerga o veneno (literal trocado: %s linha, literal so no comentario: %s linha)\n' \
    "serie da matematica" "$n_troca" "$n_some"
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
  # NAO CONFERIDO, e nao instavel. Sao coisas diferentes e a diferenca decide o
  # merge: `instavel` neste portao quer dizer "passou na segunda tentativa,
  # depende de tempo, NAO impede merge", e o 2 desta trava quer dizer "eu nao
  # consegui conferir".
  #
  # Medido em 09/09/2026: a conferencia de conteudo le o nome sensivel de um
  # arquivo que vive FORA do repositorio e fora do Drive
  # (~/.claude/projects/C--Users-romul/memory/.aluno-sensivel). Sem ele ela sai
  # com 2, o portao marcava instavel e imprimia TUDO PASSOU com codigo 0. Numa
  # maquina nova, onde esse arquivo nao existe, o portao aprovaria o merge com a
  # conferencia do nome de uma crianca sem ter rodado.
  #
  # Guarda ausente lida como guarda que passou e o pior silencio que este
  # repositorio pode ter, porque o repositorio e publico.
  anota_nao_conferido "o nome do aluno DENTRO dos arquivos, por falta da lista de nomes"
fi

printf '\n'
if [ "$falhou" != "0" ]; then
  registra_memoria "$livre_na_porta" "HA FALHA"
  printf 'HA FALHA. Nao faca o merge antes de resolver.\n'
elif [ "$nao_conferido" != "0" ]; then
  registra_memoria "$livre_na_porta" "NAO CONFERIDO"
  # Sem a bateria de navegador o portao NAO conferiu o que promete conferir.
  # Dizer TUDO PASSOU aqui seria aprovar por nao ter rodado, que e a versao
  # macro do teste que aprova por nao afirmar nada.
  printf 'NAO CONFERIDO. O portao nao rodou inteiro, entao ele nao aprova nada.\n'
  # DIZER o que ficou de fora, e nao supor a causa. Enquanto a unica entrada
  # neste estado era a bateria, "libere memoria" era conselho certo; com tres
  # entradas, mandar liberar memoria por falta de base de merge e conselho
  # errado, e conselho errado num resumo e pior que conselho nenhum.
  printf 'Ficou sem conferir:%b\n' "$nao_conferido_motivos"
elif [ "$instavel" != "0" ]; then
  registra_memoria "$livre_na_porta" "TUDO PASSOU (instavel)"
  printf 'TUDO PASSOU, mas algum teste so passou na segunda vez (INSTAVEL acima).\n'
  printf 'Nao e impedimento de merge; e aviso de que aquele teste depende de tempo.\n'
else
  # A linha que mais falta hoje: uma rodada VERDE com o numero da porta. E ela
  # que permite o piso descer com fundamento.
  registra_memoria "$livre_na_porta" "TUDO PASSOU"
  printf 'TUDO PASSOU. Pode seguir para o merge.\n'
fi
# Sai diferente de zero tambem quando nao conferiu: quem automatizar em cima do
# codigo de saida nao pode ler "nao rodou" como "passou".
if [ "$falhou" != "0" ]; then
  exit 1
fi
if [ "$nao_conferido" != "0" ]; then
  exit 2
fi
exit 0
