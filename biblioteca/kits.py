"""kits-v1, listas-v1 e tempo-v1: monta as listas prontas de um pacote.

    python biblioteca/kits.py <pacote.zip ou pasta com os json> [--saida kits.json]
                              [--regra listas-v1] [--niveis 2,3] [--sem-teoria]

DUAS REGRAS. A `listas-v1` e a que se gera hoje; a `kits-v1` fica com a medida
que a matou colada nela, logo abaixo.

--------------------------------------------------------------------- listas-v1

A lista pronta da B10, e o que ela afirma e so isto: e uma lista dentro do
tempo, do mais simples ao mais dificil, para ela mudar a vontade. NAO afirma
curadoria, e nenhum texto de tela pode dizer que afirma. O ganho dela e o
TRABALHO POUPADO, tres toques em vez de dezoito, que nunca foi medido porque
nunca esteve em disputa.

A regra esta na secao 8f do CONTRATO_pacote_biblioteca.md. Ela herda da 8e a
tempo-v1, a I1, a I2, a I3, a I5, a I6, a I7 e a tabela do T2, e muda tres
coisas, cada uma nascida de um defeito que os revisores cegos da B9 nomearam e
que a kits-v1 nao olhava:

1. REFERENCIA A OUTRO EXERCICIO (referencia-v1). Item que remete a outro so
   entra se o referido entrar junto e antes. Este gerador resolve por EXCLUSAO,
   que e mais estrito do que a regra manda: item com referencia nao entra. O
   conferidor e que implementa a regra inteira, e por isso ele aceita lista que
   este gerador nunca produziria. Regra e o que se confere; gerador e um jeito
   de satisfazer.
2. ENUNCIADOS QUASE REPETIDOS (repetidos-v1). Dois itens com semelhanca de
   0,45 ou mais nao entram na mesma lista. Resolvido podando o bolo antes da
   busca: de cada grupo de quase iguais fica o de menor numero.
3. PORTA DE ENTRADA (entrada-v2). O primeiro item e sempre um ponto de entrada,
   inclusive no nivel 3, e por isso o T3 passou a admitir UM item de degrau 1,
   que e o da abertura. Medido: nas 11 listas de nivel 3 da B9, 11 de 11 abriam
   no degrau 2 porque a tabela mandava, e os revisores disseram que faltava
   aquecimento em onze dos doze pares.

As tres reguas estao escritas duas vezes de proposito, uma aqui e uma no
confere_kits.py, as duas a partir do texto da 8f.

---------------------------------------------------------------------- kits-v1

REGRA TESTADA E REJEITADA EM 24/09/2026. NAO GERE kits.json COM ELA.

Comparada as cegas contra um concorrente do mesmo modulo, com o mesmo numero
de exercicios, o mesmo orcamento ao decimo e ORDENADO POR DEGRAU, sorteando so
quais itens entram: a regra venceu 21 dos 40 julgamentos de dois revisores
cegos, e o limiar declarado antes era 26 (p = 0,4373). Os dois revisores
concordaram entre si em 15 dos 20 pares, entao o instrumento discrimina e o
que ele nao acha e vantagem da curadoria.

O que isso quer dizer: a ESTRUTURA vale (rampa mais orcamento), e o que nao
paga e a esperteza na escolha dentro dela. Nao e derrota da ideia de kit.

Este arquivo fica porque regra rejeitada COM A MEDIDA JUNTO impede que alguem
a reinvente daqui a seis meses achando que e ideia nova, e porque foi ele que
produziu as listas que a comparacao julgou. Os numeros e o metodo estao em
Biblioteca\\PACOTES.md, na secao da versao 5 do 9o ano; o veredito esta na
secao 8e do CONTRATO.

Um erro de conceito desta regra, nomeado para quem for escrever a proxima:
"escola de elite" nao quer dizer "sem aquecimento", e a tabela do T3 manda
abrir no degrau 2 com a massa no 3. Toda lista precisa de porta de entrada.

A regra esta escrita no CONTRATO_pacote_biblioteca.md, secoes 8d e 8e, e quem
confere e o biblioteca/confere_kits.py, que NAO importa este arquivo. Este
arquivo tambem nao importa aquele: a formula da tempo-v1 esta escrita duas
vezes de proposito, uma de cada lado, porque conferencia que pergunta ao
gerador se ele concorda consigo mesmo nao confere nada. Se os dois lados
discordarem, quem manda e a conferencia.

Determinismo: nao ha sorteio, nao ha relogio e nao ha iteracao sobre conjunto
de texto (a ordem de um `set` de strings muda com o PYTHONHASHSEED, e isso ja
derrubou reprodutibilidade nesta casa). Toda ordem sai de `sorted` sobre dado
do pacote.

COMO A REGRA ESCOLHE, e isto e parte da regra, nao detalhe de implementacao:

1. Os candidatos de um modulo sao os itens com solucao e com o degrau que o
   nivel admite. O degrau e o `dificuldade` do item, que ja e "curadoria quando
   existe, senao o terco".
2. A trajetoria e a ordem: degrau crescente, e dentro do degrau minutos
   crescentes, desempate pelo numero do exercicio na fonte. O primeiro item do
   kit e, portanto, o mais curto do degrau mais baixo, o que faz a entrada ser
   curta por construcao.
3. Ancoras, escolhidas antes da busca e por criterio declarado:
   - T1, a bateria: o item com dois ou mais subitens de menor degrau e menor
     numero entra no kit, quando o modulo tem algum. E a "bateria a), b), c)"
     que a tabela dos niveis pede.
   - T2 e T3, o citado: um item com `origem_citada` do degrau mais alto entra
     como ULTIMO do kit. Entre eles, o de minutos mais perto da mediana do seu
     degrau, desempate pelo numero. O T1 nunca leva citado.
4. O resto sai de uma busca exata (programacao dinamica sobre contagem e soma
   de minutos em decimos), que devolve, para cada tamanho e cada soma possivel,
   a escolha de MENOR CUSTO DE COBERTURA. O custo de cobertura de um item e
   quantos itens da mesma aula e do mesmo degrau vem antes dele na ordem da
   fonte: pegar o primeiro de tres aulas custa 0, pegar tres da mesma aula
   custa 0+1+2. E o que faz o kit cobrir o modulo em vez de virar kit de uma
   lista so, que e o que ela pediu ao falar em "kit por assunto".
5. Entre as escolhas viaveis, vence, nesta ordem: mais aulas distintas; soma
   mais perto de 30 minutos; menos exercicios; a lista de ids menor em ordem
   alfabetica. As quatro sao deterministicas e a ultima nunca empata.
6. Se nada for viavel, a regra afrouxa UMA coisa de cada vez, na ordem escrita
   em AFROUXAMENTOS, e `relaxou` diz o que caiu de verdade, medido no kit
   pronto e nao no que a busca pediu.
"""
import argparse
import collections
import io
import json
import math
import os
import re
import sys
import zipfile
from decimal import Decimal, ROUND_HALF_UP

REGRA = 'kits-v1'
REGRA_LISTAS = 'listas-v1'
# A listas-v2 e a listas-v1 inteira com o orcamento de UMA AULA (60 minutos) em
# vez de meia. Pedido do Romulo em 24/09, depois de a Nathalia olhar as 22
# listas do 9o ano e achar curto (4 a 7 exercicios). Mudar o orcamento muda o
# que cada numero da tela quer dizer, e regra nova pede nome novo (8f).
REGRA_AULA = 'listas-v2'
LISTAS = (REGRA_LISTAS, REGRA_AULA)
TEMPO_REGRA = 'tempo-v1'
TETO_TEORIA = 8


# ------------------------------------------- as tres reguas da listas-v1
# Escritas da secao 8f do contrato, e NAO importadas do confere_kits.py. Se os
# dois lados discordarem, quem manda e a conferencia.

_ROTULO = re.compile(r'^\s*exerc[ií]cio\s+\d+[a-z]?\s*[.)]?\s*')
# o hifen de quebra de coluna da fonte; a 8f diz por que ele se desfaz
_HIFEN_DE_QUEBRA = re.compile(r'(\w)-\s+(\w)')
_ANTERIOR = re.compile(r'(exerc[ií]cio|quest[aã]o|problema)\s+anterior')
_NUMERADO = re.compile(r'(?:exerc[ií]cio|quest[aã]o|problema)s?\s+(\d+)')
_DEMONSTRACAO = re.compile(r'^(mostre|prove|demonstre|justifique|verifique|deduza)\b')

LIMIAR_REPETIDOS = 0.45
_PARADAS = frozenset(
    'a e o os as de da do das dos que em um uma no na nos nas por para com se '
    'ao aos sua seu suas seus'.split())


def sem_rotulo(item):
    return _ROTULO.sub('', _HIFEN_DE_QUEBRA.sub(r'\1\2', item.get('texto') or ''))


def referencia(item):
    """O id do exercicio a que este remete, ou None. So OUTRO EXERCICIO: "item
    anterior", "passo anterior", "modelo anterior" e "acima" ficam de fora, e a
    8f diz por que (sao auto-referencia dentro do proprio enunciado)."""
    texto = sem_rotulo(item)
    base, _, _ = item['id'].rpartition(':')
    if _ANTERIOR.search(texto):
        anterior = (item.get('numero') or 0) - 1
        return '%s:%d' % (base, anterior) if anterior >= 1 else None
    achado = _NUMERADO.search(texto)
    if achado:
        n = int(achado.group(1))
        if n != item.get('numero'):
            return '%s:%d' % (base, n)
    return None


def pede_demonstracao(item):
    return bool(_DEMONSTRACAO.match(sem_rotulo(item)))


def _bigramas(item):
    palavras = [p for p in re.findall(r'[a-z0-9]+', sem_rotulo(item)) if p not in _PARADAS]
    return set(zip(palavras, palavras[1:])) or set((p,) for p in palavras)


def semelhanca(a, b):
    fa, fb = _bigramas(a), _bigramas(b)
    if not fa or not fb:
        return 0.0
    return len(fa & fb) / float(len(fa | fb))


def abre_lista(item):
    """Se este item serve de porta de entrada, pela 8f. O degrau nao entra
    aqui: quem escolhe o degrau e a tabela do nivel."""
    if item.get('sem_solucao') or not (item.get('assets') or {}).get('solucao'):
        return False
    return not item.get('origem_citada') and not pede_demonstracao(item) and not referencia(item)


def poda_repetidos(itens):
    """De cada grupo de quase iguais fica um so: o de menor numero, desempate
    pelo id. Deterministico e sem sorteio. Devolve (ficaram, podados)."""
    ficaram, podados = [], []
    for it in sorted(itens, key=lambda i: (i['numero'], i['id'])):
        if any(semelhanca(it, ja) >= LIMIAR_REPETIDOS for ja in ficaram):
            podados.append(it)
        else:
            ficaram.append(it)
    return ficaram, podados

# --------------------------------------------------------------- tempo-v1
# A formula do CONTRATO 8e, escrita aqui do texto e nao importada da
# conferencia. Os minutos andam em DECIMOS e como inteiro dentro da busca: a
# soma de doze decimais binarios nao fecha, e o total do kit e um numero que vai
# para a tela dela.

MEDIANA_SOLUCAO_PT = Decimal(139)


def minutos_decimos(altura_pt):
    """tempo-v1 em decimos de minuto, inteiro."""
    v = Decimal('1.5') + Decimal('3.0') * Decimal(str(altura_pt)) / MEDIANA_SOLUCAO_PT
    if v < 2:
        v = Decimal(2)
    if v > 15:
        v = Decimal(15)
    return int((v * 10).quantize(Decimal('1'), rounding=ROUND_HALF_UP))


def altura_da_solucao(item):
    sol = (item.get('medidas') or {}).get('solucao')
    if not sol or sol.get('altura_pt') is None:
        return MEDIANA_SOLUCAO_PT
    return sol['altura_pt']


def minutos_do_item(item):
    return minutos_decimos(altura_da_solucao(item))


def decimos_para_numero(d):
    """Decimos viram o numero que vai para o JSON, com uma casa."""
    return float(Decimal(d) / 10)


# ------------------------------------------------------- a tabela dos niveis

BANDA = (270, 330)          # I5, em decimos
TAMANHO = (4, 12)           # I6
ALVO = 300                  # o centro da banda, para desempate

# O orcamento de cada regra de lista pronta, em decimos de minuto. A listas-v2
# dobra tudo o que e tempo: a banda estrita continua sendo 10% em volta do
# alvo (27 a 33 vira 54 a 66), a larga 20% (24 a 36 vira 48 a 72) e a ultima
# tentativa segue a mesma proporcao (20 a 45 vira 40 a 90). O teto de
# exercicios dobra junto (12 vira 24) para nao ser ele a encurtar a lista; o
# piso fica em 4, que e o que ainda e lista. Medido no 9o ano: as 22 listas
# fecham dentro de 54 a 66, com 6 a 15 exercicios, e o teto nunca pesou.
ORCAMENTO = {
    REGRA_LISTAS: {'banda': BANDA, 'larga': (240, 360), 'ultima': (200, 450),
                   'tamanho': TAMANHO, 'alvo': ALVO},
    REGRA_AULA: {'banda': (540, 660), 'larga': (480, 720), 'ultima': (400, 900),
                 'tamanho': (4, 24), 'alvo': 600, 'resto': (0, 660)},
}
# O 'resto' e o passo que so a listas-v2 tem, e e o ultimo: MODULO PEQUENO. Um
# modulo de 18 exercicios nem sempre chega a 40 minutos com a rampa do nivel,
# e sem este passo ele ficava SEM lista, que e pior que lista curta. O pedido
# do Romulo foi "gere o que der": a lista sai com o que couber ate 66 minutos,
# sem repetir exercicio e sem trazer de outro modulo, e `relaxou` diz
# "minutos". Medido na amostra das provas: sem ele, 9 das 10 listas sumiam.


def degraus_do_nivel(nivel, regra=REGRA):
    """A unica diferenca entre as duas regras esta no T3: a kits-v1 proibia o
    degrau 1, e foi isso que deixou as onze listas de nivel 3 da B9 sem porta
    de entrada."""
    if regra in LISTAS and nivel == 3:
        return (1, 2, 3)
    return {1: (1, 2), 2: (1, 2, 3), 3: (2, 3)}[nivel]


def teto(x):
    return int(math.ceil(x))


def composicoes(nivel, n, regra=REGRA, com_degrau_1=True):
    """As contagens por degrau que a tabela dos niveis admite, para este n.
    Devolve lista de (c1, c2, c3), em ordem deterministica.

    `com_degrau_1` so vale para o T3 da listas-v1: diz se a lista leva o item
    de abertura de degrau 1. Quando leva, a I3 (sem salto de dois) obriga ao
    menos um item de degrau 2, e com a massa do 3 isso so fecha com n >= 6."""
    saida = []
    if nivel == 1:
        for c1 in range(teto(2 * n / 3), n):      # c2 = n - c1 >= 1, termina no 2
            saida.append((c1, n - c1, 0))
    elif nivel == 2:
        for c3 in range(1, min(teto(n / 3), n - 2) + 1):
            for c1 in range(1, n - c3):
                saida.append((c1, n - c3 - c1, c3))
    elif regra in LISTAS and com_degrau_1:
        for c3 in range(teto(2 * n / 3), n - 1):  # c2 = n - 1 - c3 >= 1
            saida.append((1, n - 1 - c3, c3))
    else:
        for c3 in range(teto(2 * n / 3), n):      # c2 = n - c3 >= 1, comeca no 2
            saida.append((0, n - c3, c3))
    return saida


# ---------------------------------------------------------------- a busca

def custo_de_cobertura(candidatos):
    """Quantos itens da mesma aula e do mesmo degrau vem antes deste, na ordem
    da fonte. Pegar o primeiro de tres aulas custa 0; tres da mesma aula custa
    0 + 1 + 2. E o que espalha o kit pelo modulo."""
    custo = {}
    vistos = collections.Counter()
    for it in sorted(candidatos, key=lambda i: (i['dificuldade'], i['aula']['slug'], i['numero'])):
        chave = (it['dificuldade'], it['aula']['slug'])
        custo[it['id']] = vistos[chave]
        vistos[chave] += 1
    return custo


def tabela(itens, custo, max_conta, teto_soma):
    """Programacao dinamica exata: para cada (quantidade, soma em decimos), a
    escolha de menor (custo de cobertura, lista de ids). Determinista: a ordem
    de entrada e por id e o desempate e a propria lista de ids."""
    vazio = (0, ())
    dp = [[None] * (teto_soma + 1) for _ in range(max_conta + 1)]
    dp[0][0] = vazio
    for it in sorted(itens, key=lambda i: i['id']):
        m = it['_min']
        c = custo[it['id']]
        for conta in range(min(max_conta, len(itens)) - 1, -1, -1):
            linha = dp[conta]
            destino = dp[conta + 1]
            for soma in range(teto_soma - m, -1, -1):
                atual = linha[soma]
                if atual is None:
                    continue
                novo = (atual[0] + c, atual[1] + (it['id'],))
                alvo = destino[soma + m]
                if alvo is None or novo < alvo:
                    destino[soma + m] = novo
    return dp


def busca_por_nivel(nivel, pool, forcados, banda, tamanho, ultimo=None,
                    primeiro=None, regra=REGRA, com_degrau_1=True, alvo=ALVO):
    """A melhor escolha para este nivel, ou None. `forcados` ja entram no kit
    (a bateria do T1, o citado do fim e a abertura da listas-v1), e saem dos
    candidatos da busca.

    Devolve a lista de itens ja na ordem da trajetoria."""
    ids_forcados = [i['id'] for i in forcados]
    livres = [i for i in pool if i['id'] not in ids_forcados]
    min_forcado = sum(i['_min'] for i in forcados)
    conta_forcada = collections.Counter(i['dificuldade'] for i in forcados)

    por_degrau = {d: [i for i in livres if i['dificuldade'] == d]
                  for d in degraus_do_nivel(nivel, regra)}
    custo = custo_de_cobertura(pool)
    teto_soma = banda[1] - min_forcado
    if teto_soma < 0:
        return None
    tabelas = {d: tabela(por_degrau[d], custo, tamanho[1], teto_soma) for d in por_degrau}
    por_id = {i['id']: i for i in pool}

    melhor = None
    for n in range(tamanho[0], tamanho[1] + 1):
        for (c1, c2, c3) in composicoes(nivel, n, regra, com_degrau_1):
            pedido = {1: c1, 2: c2, 3: c3}
            falta = {}
            viavel = True
            for d in (1, 2, 3):
                f = pedido.get(d, 0) - conta_forcada.get(d, 0)
                if f < 0 or (f and d not in por_degrau):
                    viavel = False
                    break
                falta[d] = f
            if not viavel:
                continue
            # O desempate do _combina compara a soma SEM os forcados com o alvo
            # cheio. E assim desde a kits-v1, e as listas gravadas saem disso:
            # descontar os forcados aqui muda 7 das 22 listas da v6 do 9o ano
            # (medido em 24/09, B11). Fica como esta, dito, e nao consertado
            # por baixo de uma mudanca de orcamento.
            combinado = _combina(tabelas, falta, banda[0] - min_forcado, banda[1] - min_forcado,
                                 alvo)
            if combinado is None:
                continue
            custo_total, ids, soma = combinado
            soma += min_forcado
            escolhidos = ordena(list(ids) + ids_forcados, por_id, ultimo, primeiro)
            chave = _chave(escolhidos, custo_total, soma, alvo)
            if melhor is None or chave < melhor[0]:
                melhor = (chave, escolhidos)
    return melhor[1] if melhor else None


def _chave(itens, custo_total, soma, alvo=ALVO):
    """A ordem de preferencia da regra, e ela comeca pela I4 porque entrada boa
    vale mais que cobertura: kit grande tem itens curtos, itens curtos derrubam
    a mediana, e a mediana derrubada quebra a entrada. Descoberto medindo: com
    a cobertura na frente, 13 dos 33 kits afrouxavam a entrada."""
    minutos = sorted(i['_min'] for i in itens)
    n = len(minutos)
    mediana = minutos[n // 2] if n % 2 else (minutos[n // 2 - 1] + minutos[n // 2]) / 2
    entrada_ok = 0 if (itens[0]['_min'] <= mediana and not itens[0].get('origem_citada')) else 1
    aulas = len({i['aula']['slug'] for i in itens})
    return (entrada_ok, -aulas, abs(soma - alvo), n, tuple(i['id'] for i in itens))


def _combina(tabelas, falta, soma_min, soma_max, alvo=ALVO):
    """Combina as tabelas dos degraus pedidos. Como cada nivel usa no maximo
    tres degraus e as contagens ja estao fixas, isto e uma convolucao pequena
    sobre as somas alcancaveis."""
    graus = [d for d in (1, 2, 3) if falta.get(d)]
    if not graus:
        return (0, (), 0) if soma_min <= 0 <= soma_max else None
    atual = {0: (0, ())}
    for d in graus:
        linha = tabelas[d][falta[d]]
        proximo = {}
        for s0, (c0, ids0) in atual.items():
            for s1 in range(len(linha)):
                cel = linha[s1]
                if cel is None:
                    continue
                s = s0 + s1
                if s > soma_max:
                    break
                novo = (c0 + cel[0], ids0 + cel[1])
                velho = proximo.get(s)
                if velho is None or novo < velho:
                    proximo[s] = novo
        atual = proximo
        if not atual:
            return None
    melhor = None
    for s in sorted(atual):
        if not (soma_min <= s <= soma_max):
            continue
        c, ids = atual[s]
        cand = (c, abs(s - alvo), ids, s)
        if melhor is None or cand < melhor:
            melhor = cand
    if melhor is None:
        return None
    return (melhor[0], melhor[2], melhor[3])


# ------------------------------------------------------------------ ancoras

def ancora_bateria(candidatos):
    """T1: o item com dois ou mais subitens de menor degrau e menor numero."""
    com = [i for i in candidatos if len(i.get('subitens') or []) >= 2]
    if not com:
        return None
    return sorted(com, key=lambda i: (i['dificuldade'], i['numero'], i['id']))[0]


def ancoras_citado(candidatos, nivel, regra=REGRA):
    """T2 e T3: os itens com origem_citada do degrau mais alto do nivel, em
    ordem de preferencia: minutos mais perto da mediana do degrau, depois
    numero. Devolve lista, para a busca tentar o segundo se o primeiro nao
    couber."""
    alto = max(degraus_do_nivel(nivel, regra))
    com = [i for i in candidatos if i.get('origem_citada') and i['dificuldade'] == alto]
    if not com:
        return []
    do_degrau = sorted(i['_min'] for i in candidatos if i['dificuldade'] == alto)
    meio = do_degrau[len(do_degrau) // 2] if do_degrau else 45
    return sorted(com, key=lambda i: (abs(i['_min'] - meio), i['numero'], i['id']))


# ------------------------------------------------------ afrouxar, na ordem

# A ordem em que a busca vai soltando restricoes, da mais estrita para a mais
# frouxa. O primeiro campo e so o rotulo da TENTATIVA, para quem le o codigo:
# ele nao vai para `relaxou` e nao pertence ao vocabulario fechado da 8e.
# Quem escreve `relaxou` e a relaxou_do_kit, medindo o kit PRONTO, e nao o que
# a busca teve de pedir. (Observacao da lente 1 do PR #56: a lista sugeria o
# contrario para quem lesse rapido.)
AFROUXAMENTOS = [
    # (rotulo da tentativa, banda, exigir bateria, exigir citado no fim)
    ('estrita', BANDA, True, True),
    ('sem bateria', BANDA, False, True),
    ('sem citado no fim', BANDA, True, False),
    ('sem bateria e sem citado', BANDA, False, False),
    ('banda larga', (240, 360), True, True),
    ('banda larga sem bateria', (240, 360), False, True),
    ('banda larga sem citado', (240, 360), True, False),
    ('banda larga sem os dois', (240, 360), False, False),
    ('ultima tentativa', (200, 450), False, False),
]


# --------------------------------------------------- listas-v1: o montador

# A ordem em que a listas-v1 vai soltando restricoes. Os dois consertos que sao
# EXCLUSAO (referencia e repetidos) nao aparecem aqui e nunca sao soltos: eles
# saem do bolo antes da busca.
#
# A ABERTURA CAI DEPOIS DA BANDA, e isso e decisao e nao descuido. A banda de
# 27 a 33 ja e uma janela de 10% em volta de meia aula, e alargar para 24 a 36
# continua cabendo em "cerca de meia aula", que e o que a tela diz; abrir sem
# aquecimento e exatamente a queixa que os revisores cegos fizeram de onze dos
# doze pares de nivel 3. Medido no 9o ano: com a ordem invertida, o modulo do
# teorema de Pitagoras perdia o aquecimento por 0,1 minuto de estouro.
def afrouxamentos_listas(regra=REGRA_LISTAS):
    """A mesma ordem de afrouxar nas duas regras de lista; so as bandas vem
    do orcamento da regra."""
    o = ORCAMENTO[regra]
    est, larga = o['banda'], o['larga']
    return [
        # (rotulo da tentativa, banda, exigir citado no fim, exigir abertura no degrau 1)
        ('estrita', est, True, True),
        ('sem citado no fim', est, False, True),
        ('banda larga', larga, True, True),
        ('banda larga sem citado', larga, False, True),
        ('sem abertura no degrau 1', est, True, False),
        ('sem citado e sem abertura', est, False, False),
        ('banda larga sem abertura', larga, True, False),
        ('banda larga sem os dois', larga, False, False),
        ('ultima tentativa', o['ultima'], False, False),
    ] + ([('o que o modulo tiver', o['resto'], False, False)] if o.get('resto') else [])


AFROUXAMENTOS_LISTAS = afrouxamentos_listas(REGRA_LISTAS)

# Quantos candidatos a abertura a busca tenta antes de desistir. Nao e um: o
# melhor pela posicao na fonte pode ser longo demais para o orcamento, e no
# modulo de conjuntos o primeiro candidato tem 11,3 minutos num modulo cujo
# degrau 1 vai de 2,8 a 15,0. Com um so, a lista abria no degrau 2 por causa
# dele.
CANDIDATOS_DE_ABERTURA = 10


def _ordem_de_abertura(itens):
    """A preferencia entre candidatos a abertura e a POSICAO NA FONTE: o
    primeiro exercicio da lista do Portal e o aquecimento que o proprio autor
    escreveu, e essa e uma regua diferente da que escolheu o resto da lista
    (degrau e minutos)."""
    return sorted(itens, key=lambda i: ((i.get('proxy') or {}).get('posicao', 1.0),
                                        i['_min'], i['numero'], i['id']))


def aberturas(pool, nivel, degrau=None):
    """Os candidatos a porta de entrada, em ordem de preferencia, e o degrau em
    que eles estao.

    O degrau de abertura nao e "o menor que existir": e o que a tabela do nivel
    manda. O T2 abre no degrau 1 sempre; o T3 abre no 1 quando o modulo tem
    porta de entrada ali, e no 2 quando nao tem. Sem isso, um modulo cujo unico
    item elegivel de abertura esta no degrau 2 fazia a lista de nivel 2 abrir no
    2 e cair para o 1 no item seguinte, que quebra a I2. Achado pela prova de
    ida e volta contra a conferencia, e nao por leitura."""
    elegiveis = [i for i in pool if abre_lista(i)]
    if degrau is None:
        if nivel == 3:
            degrau = 1 if any(i['dificuldade'] == 1 for i in elegiveis) else 2
        else:
            degrau = 1
    candidatos = [i for i in elegiveis if i['dificuldade'] == degrau]
    if not candidatos:
        # nenhum item do degrau de abertura serve de porta. A lista abre com o
        # que houver ali e a entrada-v2 cai DECLARADA, porque lista com entrada
        # declarada vale mais que modulo sem lista.
        candidatos = [i for i in pool if i['dificuldade'] == degrau]
    return degrau, _ordem_de_abertura(candidatos)


def monta_lista(nivel, itens_do_modulo, regra=REGRA_LISTAS):
    """Uma lista pronta da listas-v1, ou None. Os dois consertos de exclusao
    acontecem antes de qualquer busca, e o terceiro entra como ancora."""
    orc = ORCAMENTO[regra]
    elegiveis = [i for i in itens_do_modulo
                 if i['dificuldade'] in degraus_do_nivel(nivel, regra)
                 and not i.get('sem_solucao') and (i.get('assets') or {}).get('solucao')]
    # conserto 1, por exclusao
    elegiveis = [i for i in elegiveis if not referencia(i)]
    # conserto 2, podando o bolo
    base, _podados = poda_repetidos(elegiveis)
    if len(base) < orc['tamanho'][0]:
        return None
    sem_citado = [i for i in base if not i.get('origem_citada')]
    _degrau, candidatos = aberturas(base, nivel)

    for (_nome, banda, quer_citado, quer_abertura) in afrouxamentos_listas(regra):
        entradas = candidatos[:CANDIDATOS_DE_ABERTURA]
        if not quer_abertura and nivel == 3:
            # a tentativa "sem abertura no degrau 1" devolve o T3 ao formato da
            # kits-v1: abre no degrau 2
            entradas = aberturas(base, nivel, degrau=2)[1][:CANDIDATOS_DE_ABERTURA]
        # Quando o citado no fim cai, o bolo passa a ser o `base` inteiro, com
        # os citados dentro. Sem isso o modulo de funcao afim ficava SEM lista
        # de nivel 3: ele tem 36 itens elegiveis e so 12 sem origem_citada, um
        # unico deles no degrau 3. A tabela do T3 nunca poe teto no numero de
        # citados: ela so diz que, havendo, o ultimo e citado.
        achados = []
        for entrada in entradas:
            fonte = sem_citado if quer_citado else base
            # nada abaixo do degrau da abertura entra: a lista comeca nela, e
            # um item de degrau menor la dentro faria a rampa cair (I2)
            bolo = [i for i in fonte if i['id'] != entrada['id']
                    and i['dificuldade'] >= entrada['dificuldade']]
            achado = None
            if quer_citado:
                # o citado entra so como ancora do fim, e o resto do bolo nao
                # tem citado nenhum: e isso que impede citado no meio
                for c in ancoras_citado(base, nivel, regra)[:3]:
                    if c['id'] == entrada['id']:
                        continue
                    achado = busca_por_nivel(nivel, bolo + [c, entrada], [c, entrada], banda,
                                             orc['tamanho'], ultimo=c['id'], primeiro=entrada['id'],
                                             regra=regra,
                                             com_degrau_1=entrada['dificuldade'] == 1,
                                             alvo=orc['alvo'])
                    if achado:
                        break
            if not achado:
                # sem ancora: zero citado, que a tabela do T3 aceita sem
                # afrouxar nada, e que no T2 tambem cabe em "no maximo um"
                achado = busca_por_nivel(nivel, bolo + [entrada], [entrada], banda, orc['tamanho'],
                                         primeiro=entrada['id'], regra=regra,
                                         com_degrau_1=entrada['dificuldade'] == 1,
                                         alvo=orc['alvo'])
            if achado:
                achados.append(achado)
        if achados:
            # Entre as aberturas que fecham, vence a que deixa MENOS restricao
            # afrouxada, e o desempate e a ordem dos candidatos, que ja e
            # deterministica. Sem isto a primeira abertura viavel ganhava mesmo
            # quando ela sozinha derrubava a clausula dos minutos da entrada-v2.
            achados.sort(key=lambda r: len(relaxou_da_lista(nivel, r, itens_do_modulo, regra)))
            return achados[0]
    return None


def relaxou_da_lista(nivel, itens, itens_do_modulo, regra=REGRA_LISTAS):
    """O que caiu NESTA lista, medido na lista pronta e nao no que a busca
    pediu. Quem julga de verdade e o confere_kits.py, que le so o arquivo."""
    caiu = set()
    n = len(itens)
    seq = [i['dificuldade'] for i in itens]
    minutos = [i['_min'] for i in itens]
    total = sum(minutos)
    med = sorted(minutos)
    mediana = med[n // 2] if n % 2 else (med[n // 2 - 1] + med[n // 2]) / 2
    citados = [k for k, i in enumerate(itens) if i.get('origem_citada')]

    banda = ORCAMENTO[regra]['banda']
    if not (banda[0] <= total <= banda[1]):
        caiu.add('minutos')
    # entrada-v2, as quatro clausulas
    if minutos[0] > mediana or itens[0].get('origem_citada') or pede_demonstracao(itens[0]):
        caiu.add('entrada')
    permitidos = degraus_do_nivel(nivel, regra)
    if any(it['dificuldade'] in permitidos and it['dificuldade'] < seq[0] and abre_lista(it)
           for it in itens_do_modulo):
        caiu.add('entrada')
    if nivel == 2:
        if set(seq) != {1, 2, 3} or seq.count(3) > teto(n / 3) or seq[0] != 1 or seq[-1] != 3:
            caiu.add('degraus')
        if len(citados) > 1 or (len(citados) == 1 and citados[0] != n - 1):
            caiu.add('citado')
    else:
        if seq.count(1) > 1 or (seq.count(1) == 1 and seq[0] != 1):
            caiu.add('degraus')
        if seq.count(3) < teto(2 * n / 3) or seq[-1] != 3:
            caiu.add('degraus')
        if citados and citados[-1] != n - 1:
            caiu.add('citado')
    # os dois consertos de exclusao, medidos na lista pronta: o gerador nunca
    # deveria produzir nenhum dos dois, e se produzir a declaracao tem de sair
    # junto, senao a conferencia reprova o pacote inteiro (que e o certo)
    ids = [i['id'] for i in itens]
    for k, it in enumerate(itens):
        alvo = referencia(it)
        if alvo and (alvo not in ids or ids.index(alvo) > k):
            caiu.add('referencia')
    for x in range(n):
        for y in range(x + 1, n):
            if semelhanca(itens[x], itens[y]) >= LIMIAR_REPETIDOS:
                caiu.add('repetidos')
    return sorted(caiu)


def monta_kit(modulo, nivel, itens_do_modulo, paginas):
    base = [i for i in itens_do_modulo
            if i['dificuldade'] in degraus_do_nivel(nivel)
            and not i.get('sem_solucao') and (i.get('assets') or {}).get('solucao')]
    if len(base) < TAMANHO[0]:
        return None
    sem_citado = [i for i in base if not i.get('origem_citada')]

    for (_nome, banda, quer_bateria, quer_citado) in AFROUXAMENTOS:
        if nivel == 1:
            # o T1 nao leva citado nenhum; so o afrouxamento abre essa porta
            pool = sem_citado if quer_citado else base
            forcados = []
            if quer_bateria:
                b = ancora_bateria(pool)
                if b is not None:
                    forcados.append(b)
            r = busca_por_nivel(nivel, pool, forcados, banda, TAMANHO)
            if r:
                return r
            continue
        # T2 e T3: no maximo UM citado, e e o ultimo. Por isso os citados ficam
        # fora do bolo da busca, e so a ancora entra, ja no fim. Sem isso a
        # busca punha citado no meio e o kit precisava declarar "citado", que
        # foi o que a primeira geracao mostrou em 8 dos 11 modulos.
        if quer_citado:
            for c in ancoras_citado(base, nivel)[:3]:
                r = busca_por_nivel(nivel, sem_citado + [c], [c], banda, TAMANHO, ultimo=c['id'])
                if r:
                    return r
        r = busca_por_nivel(nivel, sem_citado if quer_citado else base, [], banda, TAMANHO)
        if r:
            return r
    return None


def ordena(ids, por_id, ultimo=None, primeiro=None):
    """A trajetoria: degrau crescente, minutos crescentes dentro do degrau,
    desempate pelo numero. O item citado escolhido como ancora vai para o fim
    do seu degrau, que e o degrau mais alto do kit; a abertura escolhida pela
    listas-v1 vai para o comeco.

    `primeiro` e explicito e nao "sai de graca da ordenacao": no T2 a abertura
    e um item de degrau 1 entre varios, e a ordem por minutos poria outro na
    frente."""
    itens = [por_id[i] for i in ids]
    itens.sort(key=lambda i: (i['dificuldade'], i['_min'], i['numero'], i['id']))
    if ultimo:
        alvo = next(i for i in itens if i['id'] == ultimo)
        itens.remove(alvo)
        itens.append(alvo)
    if primeiro:
        alvo = next(i for i in itens if i['id'] == primeiro)
        itens.remove(alvo)
        itens.insert(0, alvo)
        return itens
    # a entrada nao pode ser citada; troca pelo proximo do mesmo degrau
    if itens[0].get('origem_citada'):
        d0 = itens[0]['dificuldade']
        troca = next((k for k, i in enumerate(itens)
                      if k > 0 and i['dificuldade'] == d0 and not i.get('origem_citada')), None)
        if troca is not None:
            itens[0], itens[troca] = itens[troca], itens[0]
    return itens


# ------------------------------------------------ o que caiu, medido no kit

def relaxou_do_kit(nivel, itens, itens_do_modulo):
    """Quais restricoes cairam NESTE kit, medidas no kit pronto. O gerador nao
    escreve o que pediu a busca: escreve o que sobrou. Quem julga de verdade e
    o confere_kits.py, que le so o arquivo."""
    caiu = set()
    n = len(itens)
    seq = [i['dificuldade'] for i in itens]
    minutos = [i['_min'] for i in itens]
    total = sum(minutos)
    med = sorted(minutos)
    mediana = med[n // 2] if n % 2 else (med[n // 2 - 1] + med[n // 2]) / 2
    citados = [k for k, i in enumerate(itens) if i.get('origem_citada')]

    if minutos[0] > mediana or itens[0].get('origem_citada'):
        caiu.add('entrada')
    if not (BANDA[0] <= total <= BANDA[1]):
        caiu.add('minutos')
    permitidos = set(degraus_do_nivel(nivel))
    if nivel == 1:
        if set(seq) - permitidos or seq.count(1) < teto(2 * n / 3) or seq[0] != 1 or seq[-1] != 2:
            caiu.add('degraus')
        if citados:
            caiu.add('citado')
        tem_no_modulo = any(len(i.get('subitens') or []) >= 2 for i in itens_do_modulo)
        if tem_no_modulo and not any(len(i.get('subitens') or []) >= 2 for i in itens):
            caiu.add('subitens')
    elif nivel == 2:
        if set(seq) != {1, 2, 3} or seq.count(3) > teto(n / 3) or seq[0] != 1 or seq[-1] != 3:
            caiu.add('degraus')
        if len(citados) > 1 or (len(citados) == 1 and citados[0] != n - 1):
            caiu.add('citado')
    else:
        if set(seq) - permitidos or seq.count(3) < teto(2 * n / 3) or seq[0] != 2 or seq[-1] != 3:
            caiu.add('degraus')
        if citados and citados[-1] != n - 1:
            caiu.add('citado')
    return sorted(caiu)


# ------------------------------------------------------------- alternativas

def alternativas_do_kit(itens, itens_do_modulo, regra=REGRA):
    """Por item do kit, ate tres outros do mesmo modulo, no mesmo degrau, fora
    do kit, com minutos parecidos. E o que resolve "ja usei este com o PH" sem
    quebrar a rampa.

    Na listas-v1 a alternativa passa pelos mesmos dois consertos de exclusao:
    oferecer como troca um item com referencia quebrada, ou quase igual a outro
    que ja esta na lista, poria de volta pela porta da edicao o defeito que a
    geracao tirou pela porta da frente."""
    dentro = {i['id'] for i in itens}
    saida = {}
    for it in itens:
        vizinhos = [o for o in itens_do_modulo
                    if o['id'] not in dentro and o['dificuldade'] == it['dificuldade']
                    and not o.get('sem_solucao') and (o.get('assets') or {}).get('solucao')]
        if regra in LISTAS:
            vizinhos = [o for o in vizinhos if not referencia(o)
                        and not any(semelhanca(o, d) >= LIMIAR_REPETIDOS
                                    for d in itens if d['id'] != it['id'])]
        vizinhos.sort(key=lambda o: (abs(o['_min'] - it['_min']), o['numero'], o['id']))
        if vizinhos:
            saida[it['id']] = [o['id'] for o in vizinhos[:3]]
    return saida


# ------------------------------------------------------------------ teoria

def teoria_do_kit(paginas, itens):
    """Ate 8 paginas do modulo, comecando pela primeira pagina de conteudo de
    cada aula de teoria pareada com as aulas de exercicio do kit; capa fora. O
    kit nunca leva o modulo inteiro: um modulo do 9o ano tem 96 paginas."""
    aulas_do_kit = sorted({i['aula']['slug'] for i in itens})
    escolhidas = []
    for aula_teo in paginas:
        # as duas metades do `or` que estavam aqui eram a mesma expressao
        # escrita de dois jeitos (lente 1 do PR #56)
        pareada = any(a.split(':')[-1] in aulas_do_kit for a in aula_teo['pareados'])
        if not pareada:
            continue
        for p in aula_teo['paginas']:
            if p['capa']:
                continue
            escolhidas.append(p['id'])
            break
    if not escolhidas:
        for aula_teo in paginas:
            for p in aula_teo['paginas']:
                if not p['capa']:
                    escolhidas.append(p['id'])
                    break
    return escolhidas[:TETO_TEORIA]


# --------------------------------------------------------------------- todo

def gerar(itens_de_fora, teoria, regra=REGRA, niveis=(1, 2, 3), com_teoria=True):
    """Os kits de um pacote. Trabalha sobre COPIAS rasas dos itens: o gerador do
    pacote ja escreveu o itens.json quando chama isto, e um campo de trabalho
    vazando para o dado de quem chama e o tipo de coisa que so aparece muito
    depois, no hash de outro arquivo."""
    if regra not in (REGRA,) + LISTAS:
        raise ValueError('regra desconhecida: %r' % regra)
    itens = [dict(i) for i in itens_de_fora]
    por_modulo = collections.OrderedDict()
    for it in itens:
        it['_min'] = minutos_do_item(it)
        por_modulo.setdefault('%s:%s' % (it['serie'], it['modulo']['slug']), []).append(it)
    teoria_por_modulo = collections.OrderedDict()
    for a in teoria:
        mid = '%s:%s' % (a['serie'], a['modulo']['slug'])
        teoria_por_modulo.setdefault(mid, []).append(
            {'paginas': a['paginas'], 'pareados': a.get('exercicios_pareados') or []})

    kits, sem_kit = [], []
    for mid in sorted(por_modulo):
        do_modulo = sorted(por_modulo[mid], key=lambda i: (i['aula']['n'], i['numero']))
        for nivel in niveis:
            if regra in LISTAS:
                itens_kit = monta_lista(nivel, do_modulo, regra)
            else:
                itens_kit = monta_kit(mid, nivel, do_modulo, teoria_por_modulo.get(mid, []))
            if not itens_kit:
                sem_kit.append((mid, nivel))
                continue
            caiu = (relaxou_da_lista(nivel, itens_kit, do_modulo, regra) if regra in LISTAS
                    else relaxou_do_kit(nivel, itens_kit, do_modulo))
            kits.append({
                'id': '%s:kit:%d' % (mid, nivel), 'modulo': mid, 'serie': itens_kit[0]['serie'],
                'nivel': nivel, 'titulo': itens_kit[0]['modulo']['titulo'],
                'regra': regra, 'tempo_regra': TEMPO_REGRA,
                'minutos': decimos_para_numero(sum(i['_min'] for i in itens_kit)),
                'teoria': (teoria_do_kit(teoria_por_modulo.get(mid, []), itens_kit)
                           if com_teoria else []),
                'degraus': [{'n': k + 1, 'item': i['id'], 'degrau': i['dificuldade'],
                             'minutos': decimos_para_numero(i['_min'])}
                            for k, i in enumerate(itens_kit)],
                'alternativas': alternativas_do_kit(itens_kit, do_modulo, regra),
                'relaxou': caiu or None,
            })
    modulos_sem_exercicio = sorted(set(teoria_por_modulo) - set(por_modulo))
    return kits, sem_kit, modulos_sem_exercicio


def ler(caminho):
    nomes = ('itens.json', 'teoria.json')
    if os.path.isdir(caminho):
        return [json.load(io.open(os.path.join(caminho, n), encoding='utf-8')) for n in nomes]
    with zipfile.ZipFile(caminho) as z:
        return [json.loads(z.read(n).decode('utf-8')) for n in nomes]


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('pacote')
    ap.add_argument('--saida', default=None)
    ap.add_argument('--regra', default=REGRA_LISTAS, choices=[REGRA, REGRA_LISTAS, REGRA_AULA])
    ap.add_argument('--niveis', default='2,3',
                    help='os niveis a gerar, separados por virgula (padrao 2,3)')
    ap.add_argument('--sem-teoria', dest='sem_teoria', action='store_true', default=True)
    ap.add_argument('--com-teoria', dest='sem_teoria', action='store_false')
    a = ap.parse_args(argv)
    niveis = tuple(int(x) for x in a.niveis.split(','))
    itens, teoria = ler(a.pacote)
    kits, sem_kit, sem_exercicio = gerar(itens, teoria, a.regra, niveis, not a.sem_teoria)
    texto = json.dumps(kits, ensure_ascii=False, indent=1) + '\n'
    if a.saida:
        io.open(a.saida, 'w', encoding='utf-8', newline='\n').write(texto)
    print('%d kits' % len(kits))
    for mid in sem_exercicio:
        print('  modulo sem exercicio, e por isso sem kit: %s' % mid)
    for mid, nivel in sem_kit:
        print('  sem kit: %s nivel %d' % (mid, nivel))
    afrouxados = [k for k in kits if k['relaxou']]
    for k in afrouxados:
        print('  relaxou %-14s %s (%s min, %d ex)' % (','.join(k['relaxou']), k['id'], k['minutos'], len(k['degraus'])))
    return 0


if __name__ == '__main__':
    sys.exit(main())
