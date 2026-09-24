"""A kits-v1 e a tempo-v1 como especificacao executavel: le um pacote e reprova.

    python biblioteca/confere_kits.py <pacote.zip ou pasta>

Este arquivo e a secao 8e do CONTRATO_pacote_biblioteca.md escrita em codigo.
Ele NAO importa o gerador (biblioteca/kits.py) e nao conhece nenhuma escolha
dele: le kits.json, itens.json, teoria.json, exclusoes.json e o manifest, e diz
o que esta fora da regra. Regua e peca nao podem sair da mesma matriz, e por
isso a unica coisa que os dois lados compartilham e o texto do contrato.

Se alguem algum dia fizer este arquivo importar o kits.py para "nao repetir
codigo", a conferencia deixa de conferir: passa a perguntar ao gerador se o
gerador concorda consigo mesmo. Foi esse o defeito que dominou dois dias em
22 e 23/09 (oraculo gemeo da regra, trava de pixel com o limite tirado do
proprio resultado). A trava_independencia do _prova_gerador.py existe pelo
mesmo motivo, e a do _prova_kits.py cobre este arquivo.

Saida: uma linha por problema. Codigo 0 quando nao ha nenhum.
"""
import io
import json
import math
import os
import sys
import zipfile
from decimal import Decimal, ROUND_HALF_UP

# --------------------------------------------------------------- tempo-v1

MEDIANA_SOLUCAO_PT = Decimal(139)   # mediana medida nos 4.299 itens das 7 series
BASE = Decimal('1.5')
FATOR = Decimal('3.0')
PISO = Decimal(2)
TETO = Decimal(15)


def minutos_da_altura(altura_pt):
    """tempo-v1: limita(1,5 + 3,0 * altura / 139, entre 2 e 15), a uma casa,
    meio para cima. Decimal, e nao float, para o total do kit fechar ao decimo
    sem depender de como a maquina guarda 0,1."""
    v = BASE + FATOR * Decimal(str(altura_pt)) / MEDIANA_SOLUCAO_PT
    if v < PISO:
        v = PISO
    if v > TETO:
        v = TETO
    return v.quantize(Decimal('0.1'), rounding=ROUND_HALF_UP)


def altura_da_solucao(item):
    """A altura que a tempo-v1 usa. Item sem medidas.solucao usa a mediana, e a
    regra precisa ser total: nas sete series isso nao acontece, mas um pacote
    futuro pode trazer item sem solucao medida."""
    medidas = item.get('medidas') or {}
    sol = medidas.get('solucao')
    if not sol or sol.get('altura_pt') is None:
        return MEDIANA_SOLUCAO_PT
    return sol['altura_pt']


def minutos_do_item(item):
    return minutos_da_altura(altura_da_solucao(item))


def mediana(valores):
    """Mediana de uma lista de Decimal. Com tamanho par, a media dos dois do
    meio, como o contrato diz."""
    v = sorted(valores)
    n = len(v)
    if n == 0:
        return Decimal(0)
    if n % 2:
        return v[n // 2]
    return (v[n // 2 - 1] + v[n // 2]) / 2


# ------------------------------------------------- vocabulario de `relaxou`

RELAXAVEIS = ('minutos', 'entrada', 'degraus', 'citado', 'subitens')


class Achados:
    """Junta os problemas de um kit separando o que pode ser afrouxado do que
    nao pode. O que pode so vira erro quando `relaxou` nao declarou."""

    def __init__(self, kit_id):
        self.kit_id = kit_id
        self.duros = []
        self.frouxos = []     # [(nome, texto)]

    def duro(self, texto):
        self.duros.append('%s: %s' % (self.kit_id, texto))

    def frouxo(self, nome, texto):
        assert nome in RELAXAVEIS, nome
        self.frouxos.append((nome, '%s: %s' % (self.kit_id, texto)))


# --------------------------------------------------------------- kits-v1

def _teto(x):
    return int(math.ceil(x))


def confere_um_kit(kit, por_id, paginas_de_teoria, a):
    """Todas as travas de um kit. `a` e o Achados deste kit."""
    # ---------------------------------------------------------- a forma
    for campo in ('id', 'modulo', 'serie', 'nivel', 'titulo', 'regra', 'tempo_regra',
                  'minutos', 'teoria', 'degraus', 'alternativas'):
        if campo not in kit:
            a.duro('falta o campo %s' % campo)
    if 'relaxou' not in kit:
        a.duro('falta o campo relaxou (use null quando nada foi afrouxado)')
    if a.duros:
        return
    if kit['regra'] != 'kits-v1':
        a.duro('regra e %r, e esta conferencia so conhece kits-v1' % kit['regra'])
    if kit['tempo_regra'] != 'tempo-v1':
        a.duro('tempo_regra e %r, e esta conferencia so conhece tempo-v1' % kit['tempo_regra'])
    nivel = kit['nivel']
    if nivel not in (1, 2, 3):
        a.duro('nivel e %r, e so existem 1, 2 e 3' % nivel)
        return
    esperado = '%s:kit:%d' % (kit['modulo'], nivel)
    if kit['id'] != esperado:
        a.duro('o id deveria ser %s (gramatica da secao 3)' % esperado)
    if not kit['modulo'].startswith(kit['serie'] + ':'):
        a.duro('o modulo %r nao comeca pela serie %r' % (kit['modulo'], kit['serie']))

    degraus = kit['degraus']
    if not isinstance(degraus, list) or not degraus:
        a.duro('degraus vazio ou fora de forma')
        return
    for k, d in enumerate(degraus):
        for campo in ('n', 'item', 'degrau', 'minutos'):
            if campo not in d:
                a.duro('degraus[%d] sem o campo %s' % (k, campo))
        if d.get('n') != k + 1:
            a.duro('degraus[%d].n e %r, e a lista e ordenada de 1 em diante' % (k, d.get('n')))
    if a.duros:
        return

    ids = [d['item'] for d in degraus]
    faltando = [i for i in ids if i not in por_id]
    if faltando:
        a.duro('cita item que nao esta no itens.json: %s' % faltando[0])
        return
    itens = [por_id[i] for i in ids]
    n = len(itens)

    # o degrau do kit e o `dificuldade` do item, e nada mais (secao 10.2 do desenho)
    for d, it in zip(degraus, itens):
        if d['degrau'] != it.get('dificuldade'):
            a.duro('%s traz degrau %r e o item tem dificuldade %r' % (d['item'], d['degrau'], it.get('dificuldade')))
    # e os minutos sao os da tempo-v1, recalculados aqui a partir de medidas.solucao
    for d in degraus:
        certo = minutos_do_item(por_id[d['item']])
        if Decimal(str(d['minutos'])) != certo:
            a.duro('%s traz %s minutos e a tempo-v1 da %s' % (d['item'], d['minutos'], certo))
    minutos = [Decimal(str(d['minutos'])) for d in degraus]
    total = sum(minutos, Decimal(0))
    if Decimal(str(kit['minutos'])) != total:
        a.duro('minutos do kit e %s e a soma dos itens da %s' % (kit['minutos'], total))

    # a teoria e selecao de paginas, com teto de 8 (decisao 10.4 da orquestradora)
    teoria = kit['teoria']
    if not isinstance(teoria, list):
        a.duro('teoria nao e lista')
    else:
        if len(teoria) > 8:
            a.duro('teoria com %d paginas, e o teto e 8' % len(teoria))
        for p in teoria:
            if p not in paginas_de_teoria:
                a.duro('cita a pagina de teoria %s, que nao esta no teoria.json' % p)
            elif paginas_de_teoria[p] != kit['modulo']:
                a.duro('cita a pagina %s, que e do modulo %s' % (p, paginas_de_teoria[p]))

    # alternativas: mesmo modulo, mesmo degrau, fora do kit
    alt = kit['alternativas']
    if not isinstance(alt, dict):
        a.duro('alternativas nao e objeto')
    else:
        dentro = set(ids)
        degrau_de = {d['item']: d['degrau'] for d in degraus}
        for chave, lista in alt.items():
            if chave not in dentro:
                a.duro('alternativas tem a chave %s, que nao e item deste kit' % chave)
                continue
            for outro in lista:
                if outro not in por_id:
                    a.duro('alternativa %s nao esta no itens.json' % outro)
                elif outro in dentro:
                    a.duro('alternativa %s ja esta no proprio kit' % outro)
                elif id_do_modulo(por_id[outro]) != kit['modulo']:
                    a.duro('alternativa %s e de outro modulo' % outro)
                elif por_id[outro].get('dificuldade') != degrau_de[chave]:
                    a.duro('alternativa %s esta noutro degrau que %s' % (outro, chave))

    # ------------------------------------------------------------- I1 a I7
    fora = [i for i in ids if id_do_modulo(por_id[i]) != kit['modulo']]
    if fora:
        a.duro('I1: %s nao e do modulo %s' % (fora[0], kit['modulo']))

    seq = [d['degrau'] for d in degraus]
    for k in range(len(seq) - 1):
        if seq[k + 1] < seq[k]:
            a.duro('I2: o degrau cai de %d para %d entre os itens %d e %d' % (seq[k], seq[k + 1], k + 1, k + 2))
        if seq[k + 1] - seq[k] > 1:
            a.duro('I3: salto de %d degraus entre os itens %d e %d' % (seq[k + 1] - seq[k], k + 1, k + 2))

    med = mediana(minutos)
    if minutos[0] > med:
        a.frouxo('entrada', 'I4: o primeiro item tem %s minutos, acima da mediana %s do kit' % (minutos[0], med))
    if itens[0].get('origem_citada'):
        a.frouxo('entrada', 'I4: o primeiro item traz origem_citada %r' % itens[0]['origem_citada'])

    if not (Decimal(27) <= total <= Decimal(33)):
        a.frouxo('minutos', 'I5: o kit soma %s minutos, fora da banda de 27 a 33' % total)

    if not (4 <= n <= 12):
        a.duro('I6: o kit tem %d exercicios, fora da banda de 4 a 12' % n)

    if len(set(ids)) != n:
        repetido = next(i for i in ids if ids.count(i) > 1)
        a.duro('I7: o item %s aparece mais de uma vez' % repetido)
    sem_solucao = [it['id'] for it in itens
                   if it.get('sem_solucao') or not (it.get('assets') or {}).get('solucao')]
    if sem_solucao:
        a.duro('I7: %s nao tem solucao, e o kit sempre preve gabarito' % sem_solucao[0])

    # ------------------------------------------------- a tabela dos niveis
    usados = set(seq)
    citados = [k for k, it in enumerate(itens) if it.get('origem_citada')]
    conta3 = seq.count(3)
    conta1 = seq.count(1)

    if nivel == 1:
        if usados - {1, 2}:
            a.frouxo('degraus', 'T1: usa o degrau %d, e o T1 so usa 1 e 2' % max(usados - {1, 2}))
        if conta1 < _teto(2 * n / 3):
            a.frouxo('degraus', 'T1: %d itens de degrau 1, e a massa pede ao menos %d' % (conta1, _teto(2 * n / 3)))
        if seq[0] != 1:
            a.frouxo('degraus', 'T1: comeca no degrau %d, e devia comecar no 1' % seq[0])
        if seq[-1] != 2:
            a.frouxo('degraus', 'T1: termina no degrau %d, e devia terminar no 2' % seq[-1])
        if citados:
            a.frouxo('citado', 'T1: %d item(ns) com origem_citada, e o T1 nao leva nenhum' % len(citados))
    elif nivel == 2:
        if usados != {1, 2, 3}:
            a.frouxo('degraus', 'T2: usa os degraus %s, e o T2 leva os tres' % sorted(usados))
        if conta3 > _teto(n / 3):
            a.frouxo('degraus', 'T2: %d itens de degrau 3, e a massa admite no maximo %d' % (conta3, _teto(n / 3)))
        if seq[0] != 1:
            a.frouxo('degraus', 'T2: comeca no degrau %d, e devia comecar no 1' % seq[0])
        if seq[-1] != 3:
            a.frouxo('degraus', 'T2: termina no degrau %d, e devia terminar no 3' % seq[-1])
        if len(citados) > 1:
            a.frouxo('citado', 'T2: %d itens com origem_citada, e o T2 admite no maximo um' % len(citados))
        elif len(citados) == 1 and citados[0] != n - 1:
            a.frouxo('citado', 'T2: o item citado esta na posicao %d, e devia ser o ultimo' % (citados[0] + 1))
    else:
        if usados - {2, 3}:
            a.frouxo('degraus', 'T3: usa o degrau %d, e o T3 so usa 2 e 3' % min(usados - {2, 3}))
        if conta3 < _teto(2 * n / 3):
            a.frouxo('degraus', 'T3: %d itens de degrau 3, e a massa pede ao menos %d' % (conta3, _teto(2 * n / 3)))
        if seq[0] != 2:
            a.frouxo('degraus', 'T3: comeca no degrau %d, e devia comecar no 2' % seq[0])
        if seq[-1] != 3:
            a.frouxo('degraus', 'T3: termina no degrau %d, e devia terminar no 3' % seq[-1])
        # "preferir no fim; zero aceitavel": zero passa, e havendo citado o ultimo e citado
        if citados and citados[-1] != n - 1:
            a.frouxo('citado', 'T3: ha item citado e o ultimo nao e citado')

    return itens


def bateria_de_subitens(kit, itens_do_kit, itens_do_modulo, a):
    """T1: ao menos um item com subitens >= 2, SE houver no modulo. A condicao
    'se houver' se mede no modulo inteiro, e nao no kit: senao a trava nunca
    poderia reprovar, que e o defeito de assercao vazia do PR #55."""
    if kit['nivel'] != 1:
        return
    tem_no_modulo = any(len(it.get('subitens') or []) >= 2 for it in itens_do_modulo)
    if not tem_no_modulo:
        return
    if not any(len(it.get('subitens') or []) >= 2 for it in itens_do_kit):
        a.frouxo('subitens', 'T1: o modulo tem bateria de subitens e o kit nao leva nenhuma')


def id_do_modulo(item):
    return '%s:%s' % (item['serie'], item['modulo']['slug'])


# ------------------------------------------------------------------ o todo

def confere(manifest, itens, teoria, kits, exclusoes):
    """Devolve a lista de problemas. Lista vazia quer dizer que o pacote esta
    dentro da secao 8e do contrato."""
    erros = []
    por_id = {it['id']: it for it in itens}
    por_modulo = {}
    for it in itens:
        por_modulo.setdefault(id_do_modulo(it), []).append(it)
    paginas_de_teoria = {}
    for aula in teoria:
        mod = '%s:%s' % (aula['serie'], aula['modulo']['slug'])
        for p in aula.get('paginas') or []:
            paginas_de_teoria[p['id']] = mod

    # ------------------------------------------------------ kits.json
    if not isinstance(kits, list):
        return ['kits.json nao e uma lista']
    vistos = set()
    for kit in kits:
        kid = kit.get('id', '(sem id)')
        if kid in vistos:
            erros.append('%s: id repetido no kits.json' % kid)
        vistos.add(kid)
        a = Achados(kid)
        itens_do_kit = confere_um_kit(kit, por_id, paginas_de_teoria, a) or []
        if itens_do_kit:
            bateria_de_subitens(kit, itens_do_kit, por_modulo.get(kit['modulo'], []), a)
        erros.extend(a.duros)

        # `relaxou` nos DOIS sentidos: tudo o que caiu esta declarado, e nada
        # declarado deixou de cair.
        declarado = kit.get('relaxou')
        if declarado is None:
            declarado = []
        if not isinstance(declarado, list) or any(x not in RELAXAVEIS for x in declarado):
            erros.append('%s: relaxou e %r, e o vocabulario e %s (ou null)' % (kid, kit.get('relaxou'), list(RELAXAVEIS)))
            declarado = [x for x in (declarado if isinstance(declarado, list) else []) if x in RELAXAVEIS]
        caiu = sorted({nome for nome, _ in a.frouxos})
        for nome, texto in a.frouxos:
            if nome not in declarado:
                erros.append('%s [nao declarado em relaxou]' % texto)
        for nome in declarado:
            if nome not in caiu:
                erros.append('%s: relaxou diz %r, e nada de %r caiu neste kit' % (kid, nome, nome))

    ordem = [(k.get('serie'), k.get('modulo'), k.get('nivel')) for k in kits]
    if ordem != sorted(ordem, key=lambda t: (str(t[0]), str(t[1]), t[2] if isinstance(t[2], int) else 0)):
        erros.append('kits.json fora de ordem (serie, modulo, nivel)')

    cont = manifest.get('contagens') or {}
    if cont.get('kits') != len(kits):
        erros.append('manifest.contagens.kits e %r e o kits.json tem %d' % (cont.get('kits'), len(kits)))

    # ------------------------------------------------- exclusoes.json
    erros.extend(confere_exclusoes(manifest, itens, exclusoes))
    return erros


def confere_exclusoes(manifest, itens, exclusoes):
    erros = []
    if exclusoes is None:
        return ['exclusoes.json nao esta no pacote']
    if not isinstance(exclusoes, list):
        return ['exclusoes.json nao e uma lista']
    por_id = {it['id'] for it in itens}
    vistos = set()
    for e in exclusoes:
        eid = e.get('id')
        if not isinstance(eid, str) or not eid:
            erros.append('exclusoes.json: linha sem id')
            continue
        if not isinstance(e.get('motivo'), str) or not e['motivo'].strip():
            erros.append('exclusoes.json: %s sem motivo' % eid)
        if eid in vistos:
            erros.append('exclusoes.json: %s aparece duas vezes' % eid)
        vistos.add(eid)
        if eid in por_id:
            erros.append('exclusoes.json: %s foi excluido e esta no itens.json' % eid)
    ids = [e.get('id') for e in exclusoes if isinstance(e.get('id'), str)]
    if ids != sorted(ids):
        erros.append('exclusoes.json fora de ordem de id')
    cont = manifest.get('contagens') or {}
    if cont.get('itens_excluidos') != len(exclusoes):
        erros.append('manifest.contagens.itens_excluidos e %r e o exclusoes.json tem %d'
                     % (cont.get('itens_excluidos'), len(exclusoes)))
    return erros


# ------------------------------------------------------------------- leitura

NOMES = ('manifest.json', 'itens.json', 'teoria.json', 'kits.json', 'exclusoes.json')


def ler_pacote(caminho):
    """Um zip ou uma pasta com os json do pacote. Arquivo que falta volta None,
    e quem conferir diz o que fazer com a ausencia: o exclusoes.json ausente e
    problema, e este leitor nao e quem julga isso."""
    if os.path.isdir(caminho):
        saida = []
        for nome in NOMES:
            alvo = os.path.join(caminho, nome)
            if os.path.exists(alvo):
                with io.open(alvo, encoding='utf-8') as f:
                    saida.append(json.load(f))
            else:
                saida.append(None)
        return tuple(saida)
    with zipfile.ZipFile(caminho) as z:
        dentro = set(z.namelist())
        return tuple(json.loads(z.read(n).decode('utf-8')) if n in dentro else None for n in NOMES)


def main(argv):
    if len(argv) != 2:
        print(__doc__)
        return 2
    manifest, itens, teoria, kits, exclusoes = ler_pacote(argv[1])
    erros = confere(manifest, itens, teoria, kits, exclusoes)
    for e in erros:
        print('  FORA DA REGRA  %s' % e)
    print('%d kits conferidos, %d problemas' % (len(kits or []), len(erros)))
    return 1 if erros else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
