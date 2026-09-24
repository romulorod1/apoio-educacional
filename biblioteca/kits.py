"""kits-v1 e tempo-v1: monta os kits de um pacote da biblioteca.

    python biblioteca/kits.py <pacote.zip ou pasta com os json> [--saida kits.json]

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
import sys
import zipfile
from decimal import Decimal, ROUND_HALF_UP

REGRA = 'kits-v1'
TEMPO_REGRA = 'tempo-v1'
TETO_TEORIA = 8

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


def degraus_do_nivel(nivel):
    return {1: (1, 2), 2: (1, 2, 3), 3: (2, 3)}[nivel]


def teto(x):
    return int(math.ceil(x))


def composicoes(nivel, n):
    """As contagens por degrau que a tabela dos niveis admite, para este n.
    Devolve lista de (c1, c2, c3), em ordem deterministica."""
    saida = []
    if nivel == 1:
        for c1 in range(teto(2 * n / 3), n):      # c2 = n - c1 >= 1, termina no 2
            saida.append((c1, n - c1, 0))
    elif nivel == 2:
        for c3 in range(1, min(teto(n / 3), n - 2) + 1):
            for c1 in range(1, n - c3):
                saida.append((c1, n - c3 - c1, c3))
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


def busca_por_nivel(nivel, pool, forcados, banda, tamanho, ultimo=None):
    """A melhor escolha para este nivel, ou None. `forcados` ja entram no kit
    (a bateria do T1 e o citado do fim), e saem dos candidatos da busca.

    Devolve a lista de itens ja na ordem da trajetoria."""
    ids_forcados = [i['id'] for i in forcados]
    livres = [i for i in pool if i['id'] not in ids_forcados]
    min_forcado = sum(i['_min'] for i in forcados)
    conta_forcada = collections.Counter(i['dificuldade'] for i in forcados)

    por_degrau = {d: [i for i in livres if i['dificuldade'] == d] for d in degraus_do_nivel(nivel)}
    custo = custo_de_cobertura(pool)
    teto_soma = banda[1] - min_forcado
    if teto_soma < 0:
        return None
    tabelas = {d: tabela(por_degrau[d], custo, tamanho[1], teto_soma) for d in por_degrau}
    por_id = {i['id']: i for i in pool}

    melhor = None
    for n in range(tamanho[0], tamanho[1] + 1):
        for (c1, c2, c3) in composicoes(nivel, n):
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
            combinado = _combina(tabelas, falta, banda[0] - min_forcado, banda[1] - min_forcado)
            if combinado is None:
                continue
            custo_total, ids, soma = combinado
            soma += min_forcado
            escolhidos = ordena(list(ids) + ids_forcados, por_id, ultimo)
            chave = _chave(escolhidos, custo_total, soma)
            if melhor is None or chave < melhor[0]:
                melhor = (chave, escolhidos)
    return melhor[1] if melhor else None


def _chave(itens, custo_total, soma):
    """A ordem de preferencia da regra, e ela comeca pela I4 porque entrada boa
    vale mais que cobertura: kit grande tem itens curtos, itens curtos derrubam
    a mediana, e a mediana derrubada quebra a entrada. Descoberto medindo: com
    a cobertura na frente, 13 dos 33 kits afrouxavam a entrada."""
    minutos = sorted(i['_min'] for i in itens)
    n = len(minutos)
    mediana = minutos[n // 2] if n % 2 else (minutos[n // 2 - 1] + minutos[n // 2]) / 2
    entrada_ok = 0 if (itens[0]['_min'] <= mediana and not itens[0].get('origem_citada')) else 1
    aulas = len({i['aula']['slug'] for i in itens})
    return (entrada_ok, -aulas, abs(soma - ALVO), n, tuple(i['id'] for i in itens))


def _combina(tabelas, falta, soma_min, soma_max):
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
        cand = (c, abs(s - ALVO), ids, s)
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


def ancoras_citado(candidatos, nivel):
    """T2 e T3: os itens com origem_citada do degrau mais alto do nivel, em
    ordem de preferencia: minutos mais perto da mediana do degrau, depois
    numero. Devolve lista, para a busca tentar o segundo se o primeiro nao
    couber."""
    alto = max(degraus_do_nivel(nivel))
    com = [i for i in candidatos if i.get('origem_citada') and i['dificuldade'] == alto]
    if not com:
        return []
    do_degrau = sorted(i['_min'] for i in candidatos if i['dificuldade'] == alto)
    meio = do_degrau[len(do_degrau) // 2] if do_degrau else 45
    return sorted(com, key=lambda i: (abs(i['_min'] - meio), i['numero'], i['id']))


# ------------------------------------------------------ afrouxar, na ordem

AFROUXAMENTOS = [
    # (nome ou None, banda, exigir bateria, exigir citado no fim)
    (None, BANDA, True, True),
    ('subitens', BANDA, False, True),
    ('citado', BANDA, True, False),
    ('subitens+citado', BANDA, False, False),
    ('minutos', (240, 360), True, True),
    ('minutos+subitens', (240, 360), False, True),
    ('minutos+citado', (240, 360), True, False),
    ('minutos+subitens+citado', (240, 360), False, False),
    ('minutos-larga', (200, 450), False, False),
]


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


def ordena(ids, por_id, ultimo=None):
    """A trajetoria: degrau crescente, minutos crescentes dentro do degrau,
    desempate pelo numero. O item citado escolhido como ancora vai para o fim
    do seu degrau, que e o degrau mais alto do kit."""
    itens = [por_id[i] for i in ids]
    itens.sort(key=lambda i: (i['dificuldade'], i['_min'], i['numero'], i['id']))
    if ultimo:
        alvo = next(i for i in itens if i['id'] == ultimo)
        itens.remove(alvo)
        itens.append(alvo)
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

def alternativas_do_kit(itens, itens_do_modulo):
    """Por item do kit, ate tres outros do mesmo modulo, no mesmo degrau, fora
    do kit, com minutos parecidos. E o que resolve "ja usei este com o PH" sem
    quebrar a rampa."""
    dentro = {i['id'] for i in itens}
    saida = {}
    for it in itens:
        vizinhos = [o for o in itens_do_modulo
                    if o['id'] not in dentro and o['dificuldade'] == it['dificuldade']
                    and not o.get('sem_solucao') and (o.get('assets') or {}).get('solucao')]
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
        pareada = any(a.split(':')[-1] in aulas_do_kit or aulas_do_kit_casa(a, aulas_do_kit)
                      for a in aula_teo['pareados']) if aula_teo['pareados'] else False
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


def aulas_do_kit_casa(pareado, aulas):
    return pareado.split(':')[-1] in aulas


# --------------------------------------------------------------------- todo

def gerar(itens_de_fora, teoria):
    """Os kits de um pacote. Trabalha sobre COPIAS rasas dos itens: o gerador do
    pacote ja escreveu o itens.json quando chama isto, e um campo de trabalho
    vazando para o dado de quem chama e o tipo de coisa que so aparece muito
    depois, no hash de outro arquivo."""
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
        for nivel in (1, 2, 3):
            itens_kit = monta_kit(mid, nivel, do_modulo, teoria_por_modulo.get(mid, []))
            if not itens_kit:
                sem_kit.append((mid, nivel))
                continue
            caiu = relaxou_do_kit(nivel, itens_kit, do_modulo)
            kits.append({
                'id': '%s:kit:%d' % (mid, nivel), 'modulo': mid, 'serie': itens_kit[0]['serie'],
                'nivel': nivel, 'titulo': itens_kit[0]['modulo']['titulo'],
                'regra': REGRA, 'tempo_regra': TEMPO_REGRA,
                'minutos': decimos_para_numero(sum(i['_min'] for i in itens_kit)),
                'teoria': teoria_do_kit(teoria_por_modulo.get(mid, []), itens_kit),
                'degraus': [{'n': k + 1, 'item': i['id'], 'degrau': i['dificuldade'],
                             'minutos': decimos_para_numero(i['_min'])}
                            for k, i in enumerate(itens_kit)],
                'alternativas': alternativas_do_kit(itens_kit, do_modulo),
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
    a = ap.parse_args(argv)
    itens, teoria = ler(a.pacote)
    kits, sem_kit, sem_exercicio = gerar(itens, teoria)
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
