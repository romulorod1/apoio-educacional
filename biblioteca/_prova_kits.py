"""Provas da confere_kits.py, com um veneno por invariante e por linha da tabela.

    python biblioteca/_prova_kits.py

Monta uma amostra minima a mao (itens, teoria, kits, exclusoes e manifest), no
formato da secao 8d do contrato e dentro da regra da 8e, confere que ela passa
LIMPA, e depois quebra uma condicao de cada vez para mostrar que a conferencia
sabe reprovar. Assercao que nao pode falhar nao mede nada, e essa e regra desta
casa desde o PR #55.

A amostra e escrita neste arquivo, e nao gerada pelo biblioteca/kits.py, de
proposito: se a peca de teste saisse do gerador, um erro do gerador viraria
"comportamento esperado" e a prova aplaudiria o defeito.

Saida no dialeto do portao: "N verificacoes passaram, M falharam".
"""
import copy
import io
import json
import os
import sys
from fractions import Fraction

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)

import confere_kits as CK


# ------------------------------------------------------------- a amostra

MOD = '9ano:modulo-de-prova'
CURTO = '9ano:modulo-curto'


def item(mod_slug, lista, n, dificuldade, altura, subitens=None, citado=None, sem_solucao=False):
    base = 'assets/9ano/%s/%s/ex-%02d' % (mod_slug, lista, n)
    return {
        'id': '9ano:%s:%s:ex:%d' % (mod_slug, lista, n),
        'fonte': 'obmep-portal', 'serie': '9ano',
        'modulo': {'slug': mod_slug, 'titulo': 'Modulo de Prova' if mod_slug == 'modulo-de-prova' else 'Modulo Curto'},
        'aula': {'slug': lista, 'titulo': 'Lista', 'n': 1},
        'numero': n, 'formato': 'aberta', 'alternativas': None, 'resposta': None,
        'subitens': subitens or [], 'texto': 'exercicio %d' % n,
        'origem_citada': citado, 'dificuldade': dificuldade, 'dificuldade_origem': 'proxy',
        'proxy': {'posicao': 0.1, 'terco': dificuldade}, 'tema_app': None,
        'assets': {'enunciado': base + '.svg', 'solucao': None if sem_solucao else base + '-sol.svg'},
        'medidas': {'enunciado': {'largura_pt': 262, 'altura_pt': 100},
                    'solucao': None if sem_solucao else {'largura_pt': 262, 'altura_pt': altura}},
        'sem_solucao': True if sem_solucao else None,
    }


def ex(n):
    return '9ano:modulo-de-prova:lista-a:ex:%d' % n


def cu(n):
    return '9ano:modulo-curto:lista-c:ex:%d' % n


"""Alturas escolhidas para a tempo-v1 dar numero redondo, conferido no teste
`a tempo-v1 da o que a amostra supoe`: 139 pt da 4,5 min; 208 pt da 6,0; 41 pt
da 2,4. Se a formula mudar, aquele teste reprova antes de qualquer veneno."""
H45, H60, H24 = 139, 208, 41


def amostra():
    itens = [
        item('modulo-de-prova', 'lista-a', 1, 1, H45, subitens=['a', 'b', 'c']),
        item('modulo-de-prova', 'lista-a', 2, 1, H45),
        item('modulo-de-prova', 'lista-a', 3, 1, H45),
        item('modulo-de-prova', 'lista-a', 4, 1, H45),
        item('modulo-de-prova', 'lista-a', 5, 2, H60),
        item('modulo-de-prova', 'lista-a', 6, 2, H60),
        item('modulo-de-prova', 'lista-a', 7, 3, H60, citado='Extraido da Olimpiada de Prova'),
        item('modulo-de-prova', 'lista-a', 8, 3, H60),
        item('modulo-de-prova', 'lista-a', 9, 3, H45),
        item('modulo-de-prova', 'lista-a', 10, 3, H45),
        item('modulo-de-prova', 'lista-a', 11, 2, H60),
        item('modulo-de-prova', 'lista-a', 12, 1, H45),
        item('modulo-de-prova', 'lista-a', 13, 1, H45, sem_solucao=True),
        item('modulo-de-prova', 'lista-a', 14, 2, H60),
        item('modulo-de-prova', 'lista-a', 15, 3, H45),
        item('modulo-de-prova', 'lista-a', 16, 3, H45),
        item('modulo-curto', 'lista-c', 1, 1, H24),
        item('modulo-curto', 'lista-c', 2, 1, H24),
        item('modulo-curto', 'lista-c', 3, 1, H24),
        item('modulo-curto', 'lista-c', 4, 1, H24),
        item('modulo-curto', 'lista-c', 5, 2, H24),
    ]
    teoria = []
    for slug, titulo in (('modulo-de-prova', 'Modulo de Prova'), ('modulo-curto', 'Modulo Curto')):
        tid = '9ano:%s:aula-t:teo' % slug
        teoria.append({
            'id': tid, 'fonte': 'obmep-portal', 'serie': '9ano',
            'modulo': {'slug': slug, 'titulo': titulo},
            'aula': {'slug': 'aula-t', 'titulo': 'Teoria', 'n': 1},
            'exercicios_pareados': [],
            'paginas': [{'id': '%s:p%02d' % (tid, p), 'n': p, 'capa': p == 1,
                         'asset': 'assets/9ano/%s/aula-t/teo-p%02d.svg' % (slug, p),
                         'medidas': {'largura_pt': 612, 'altura_pt': 792}, 'texto': 'teoria'}
                        for p in (1, 2, 3)],
        })

    def degrau(ids, itens_por_id):
        saida = []
        for k, i in enumerate(ids):
            it = itens_por_id[i]
            saida.append({'n': k + 1, 'item': i, 'degrau': it['dificuldade'],
                          'minutos': float(CK.minutos_do_item(it))})
        return saida

    por_id = {it['id']: it for it in itens}

    def kit(mod, nivel, ids, teoria_ids, alternativas, relaxou=None):
        ds = degrau(ids, por_id)
        return {
            'id': '%s:kit:%d' % (mod, nivel), 'modulo': mod, 'serie': '9ano', 'nivel': nivel,
            'titulo': 'Modulo de Prova' if mod == MOD else 'Modulo Curto',
            'regra': 'kits-v1', 'tempo_regra': 'tempo-v1',
            'minutos': round(sum(d['minutos'] for d in ds), 1),
            'teoria': teoria_ids, 'degraus': ds, 'alternativas': alternativas, 'relaxou': relaxou,
        }

    pag = lambda slug, p: '9ano:%s:aula-t:teo:p%02d' % (slug, p)
    kits = [
        # T1: degraus 1 e 2, massa no 1, comeca no 1, termina no 2, sem citado,
        # com a bateria de subitens do ex 1. 4,5 x 4 + 6,0 x 2 = 30,0.
        kit(CURTO, 1, [cu(1), cu(2), cu(3), cu(4), cu(5)], [], {}, relaxou=['minutos']),
        kit(MOD, 1, [ex(1), ex(2), ex(3), ex(4), ex(5), ex(6)], [pag('modulo-de-prova', 2)],
            {ex(1): [ex(12)], ex(5): [ex(11)]}),
        # T2: os tres degraus, massa do 3 no teto, citado no fim. 33,0.
        kit(MOD, 2, [ex(1), ex(2), ex(5), ex(6), ex(8), ex(7)], [], {ex(5): [ex(11)]}),
        # T3: degraus 2 e 3, massa no 3, comeca no 2, termina no 3. 33,0.
        kit(MOD, 3, [ex(5), ex(6), ex(9), ex(10), ex(8), ex(7)], [], {ex(5): [ex(11)]}),
    ]
    kits.sort(key=lambda k: (k['serie'], k['modulo'], k['nivel']))
    exclusoes = [
        {'id': ex(20), 'motivo': 'a figura da solucao veio da fonte fora do lugar', 'quem': 'curadoria', 'data': '2026-09-22'},
        {'id': ex(21), 'motivo': 'o recorte do enunciado nao comeca pelo numero'},
    ]
    exclusoes.sort(key=lambda e: e['id'])
    manifest = {
        'esquema': 1, 'pacote': 'matematica-prova-9ano', 'versao': 1,
        'contagens': {'modulos': 2, 'itens': len(itens), 'itens_excluidos': len(exclusoes), 'kits': len(kits)},
    }
    # lista, e nao tupla, para os venenos poderem trocar um arquivo inteiro por None
    return [manifest, itens, teoria, kits, exclusoes]


# -------------------------------------------------------------- o placar

class Placar:
    def __init__(self):
        self.ok = 0
        self.falhas = 0

    def limpo(self, nome, erros):
        if erros:
            self.falhas += 1
            print('  FALHOU  %-52s %d problema(s): %s' % (nome, len(erros), ' | '.join(e[:150] for e in erros[:3])))
        else:
            self.ok += 1
            print('  ok      %s' % nome)

    def veneno(self, nome, erros, motivo):
        """O veneno so conta quando reprova PELO motivo esperado: reprovar por
        outra coisa e coincidencia, nao prova."""
        certos = [e for e in erros if motivo in e]
        if certos:
            self.ok += 1
            print('  ok      veneno %-45s reprovou: %s' % (nome, certos[0][:110]))
        else:
            self.falhas += 1
            print('  FALHOU  veneno %-45s passou sem ver o defeito (esperava %r); achou: %s'
                  % (nome, motivo, ' | '.join(e[:80] for e in erros[:3]) or 'nada'))


def confere(peca):
    return CK.confere(*peca)


def com(mudanca):
    """Uma copia da amostra com uma mudanca aplicada. A mudanca recebe a tupla
    (manifest, itens, teoria, kits, exclusoes)."""
    peca = copy.deepcopy(amostra())
    mudanca(peca)
    return peca


def kit_de(peca, nivel, mod=MOD):
    return next(k for k in peca[3] if k['nivel'] == nivel and k['modulo'] == mod)


def troca_itens(kit, ids, itens):
    """Reescreve a lista de degraus do kit a partir de uma nova lista de ids,
    recalculando degrau e minutos a partir do PROPRIO itens.json, para o veneno
    ser da invariante que se quer e nao de um numero desalinhado."""
    por_id = {it['id']: it for it in itens}
    kit['degraus'] = [{'n': k + 1, 'item': i, 'degrau': por_id[i]['dificuldade'],
                       'minutos': float(CK.minutos_do_item(por_id[i]))} for k, i in enumerate(ids)]
    kit['minutos'] = round(sum(d['minutos'] for d in kit['degraus']), 1)
    kit['alternativas'] = {}


def main():
    p = Placar()
    peca = amostra()

    # ------------------------------------------------ a amostra e a regua
    print('\n=== a amostra limpa ===')
    m1 = CK.minutos_da_altura(H45), CK.minutos_da_altura(H60), CK.minutos_da_altura(H24)
    p.limpo('a tempo-v1 da o que a amostra supoe (4,5 / 6,0 / 2,4)',
            [] if [str(x) for x in m1] == ['4.5', '6.0', '2.4'] else ['deu %s' % (m1,)])
    # arredonda ao mais perto, e nao corta: 100 pt da 3,658..., que e 3,7 e nao 3,6
    p.limpo('tempo-v1 arredonda ao mais perto e nao corta (100 pt da 3,7)',
            [] if str(CK.minutos_da_altura(100)) == '3.7' else ['deu %s' % CK.minutos_da_altura(100)])
    # e o empate, que a regra manda para cima, nao existe: 139 e primo e nao
    # divide 60, entao 20*minutos nunca e inteiro impar. Medido com fracao
    # exata, e nao argumentado: se algum dia a constante mudar, esta varredura
    # acha o empate antes de alguem descobrir pela diferenca de um decimo.
    empates = [h for h in range(0, 3001)
               if (Fraction(3, 2) + Fraction(3 * h, 139)) * 20 % 2 == 1
               and Fraction(2) <= Fraction(3, 2) + Fraction(3 * h, 139) <= Fraction(15)]
    p.limpo('nenhuma altura inteira de 0 a 3000 cai no empate do decimo',
            ['%d alturas empatam, a primeira e %s pt' % (len(empates), empates[0])] if empates else [])
    p.limpo('tempo-v1 respeita o piso de 2 e o teto de 15',
            [] if (str(CK.minutos_da_altura(0)) == '2.0' and str(CK.minutos_da_altura(5000)) == '15.0')
            else ['piso %s teto %s' % (CK.minutos_da_altura(0), CK.minutos_da_altura(5000))])
    p.limpo('item sem medidas.solucao usa a mediana e da 4,5',
            [] if str(CK.minutos_do_item({'medidas': {}})) == '4.5' else ['deu %s' % CK.minutos_do_item({'medidas': {}})])
    p.limpo('a amostra inteira passa na confere_kits', confere(peca))

    # a conferencia nao pode ser gemea do gerador
    fonte = io.open(os.path.join(AQUI, 'confere_kits.py'), encoding='utf-8').read()
    p.limpo('a confere_kits nao importa o gerador de kits',
            ['confere_kits.py importa kits.py'] if ('import kits' in fonte or 'from kits' in fonte) else [])

    # ------------------------------------------------------ I1 a I7
    print('\n=== um veneno por invariante, I1 a I7 ===')
    p.veneno('I1 item de outro modulo', confere(com(
        lambda x: troca_itens(kit_de(x, 1), [ex(1), ex(2), ex(3), cu(4), ex(5), ex(6)], x[1]))), 'I1')
    p.veneno('I2 degrau que cai', confere(com(
        lambda x: troca_itens(kit_de(x, 1), [ex(5), ex(1), ex(2), ex(3), ex(4), ex(6)], x[1]))), 'I2')
    p.veneno('I3 salto de dois degraus', confere(com(
        lambda x: troca_itens(kit_de(x, 2), [ex(1), ex(2), ex(3), ex(9), ex(10), ex(7)], x[1]))), 'I3')
    # este veneno foi escolhido para fazer cair SO a I4: degraus 2,3,3,3,3,3,
    # 30,0 minutos, massa e pontas do T3 em ordem, e o primeiro item com 6,0
    # contra mediana 4,5
    p.veneno('I4 entrada acima da mediana', confere(com(
        lambda x: troca_itens(kit_de(x, 3), [ex(5), ex(9), ex(10), ex(15), ex(16), ex(7)], x[1]))), 'I4')
    p.veneno('I4 entrada com origem_citada', confere(com(
        lambda x: x[1].__setitem__(0, dict(x[1][0], origem_citada='Extraido de algum lugar')))), 'I4')
    p.veneno('I5 orcamento fora da banda', confere(com(
        lambda x: troca_itens(kit_de(x, 1), [ex(1), ex(2), ex(3), ex(4)], x[1]))), 'I5')
    p.veneno('I6 kit com tres exercicios', confere(com(
        lambda x: troca_itens(kit_de(x, 1), [ex(1), ex(2), ex(5)], x[1]))), 'I6')
    p.veneno('I7 item repetido', confere(com(
        lambda x: troca_itens(kit_de(x, 1), [ex(1), ex(1), ex(2), ex(3), ex(4), ex(5)], x[1]))), 'I7')
    p.veneno('I7 item sem solucao', confere(com(
        lambda x: troca_itens(kit_de(x, 1), [ex(1), ex(13), ex(2), ex(3), ex(4), ex(5)], x[1]))), 'I7')

    # -------------------------------------------- a tabela dos tres niveis
    print('\n=== um veneno por linha da tabela dos tres niveis ===')
    p.veneno('T1 usa um degrau 3', confere(com(
        lambda x: troca_itens(kit_de(x, 1), [ex(1), ex(2), ex(3), ex(4), ex(5), ex(8)], x[1]))), 'T1: usa o degrau 3')
    p.veneno('T1 massa insuficiente no degrau 1', confere(com(
        lambda x: troca_itens(kit_de(x, 1), [ex(1), ex(2), ex(3), ex(5), ex(6), ex(11)], x[1]))), 'T1: 3 itens de degrau 1')
    p.veneno('T1 comeca no degrau 2', confere(com(
        lambda x: troca_itens(kit_de(x, 1), [ex(5), ex(6), ex(11), ex(14)], x[1]))), 'T1: comeca no degrau 2')
    p.veneno('T1 termina no degrau 1', confere(com(
        lambda x: troca_itens(kit_de(x, 1), [ex(1), ex(2), ex(3), ex(4), ex(12)], x[1]))), 'T1: termina no degrau 1')
    p.veneno('T1 com origem_citada', confere(com(
        lambda x: troca_itens(kit_de(x, 1), [ex(1), ex(2), ex(3), ex(4), ex(5), ex(7)], x[1]))), 'T1: 1 item(ns) com origem_citada')
    p.veneno('T1 sem a bateria de subitens do modulo', confere(com(
        lambda x: troca_itens(kit_de(x, 1), [ex(2), ex(3), ex(4), ex(12), ex(5), ex(6)], x[1]))), 'bateria de subitens')
    p.veneno('T2 sem os tres degraus', confere(com(
        lambda x: troca_itens(kit_de(x, 2), [ex(1), ex(2), ex(3), ex(4), ex(5), ex(6)], x[1]))), 'T2: usa os degraus')
    p.veneno('T2 com massa demais no degrau 3', confere(com(
        lambda x: troca_itens(kit_de(x, 2), [ex(1), ex(5), ex(9), ex(10), ex(8), ex(7)], x[1]))), 'T2: 4 itens de degrau 3')
    p.veneno('T2 comeca no degrau 2', confere(com(
        lambda x: troca_itens(kit_de(x, 2), [ex(5), ex(6), ex(11), ex(9), ex(10), ex(7)], x[1]))), 'T2: comeca no degrau 2')
    p.veneno('T2 termina no degrau 2', confere(com(
        lambda x: troca_itens(kit_de(x, 2), [ex(1), ex(2), ex(9), ex(5), ex(6), ex(11)], x[1]))), 'T2: termina no degrau 2')
    p.veneno('T2 com dois itens citados', confere(com(
        lambda x: (x[1].__setitem__(7, dict(x[1][7], origem_citada='Extraido de outro lugar')),
                   troca_itens(kit_de(x, 2), [ex(1), ex(2), ex(5), ex(6), ex(8), ex(7)], x[1])))), 'T2: 2 itens com origem_citada')
    p.veneno('T2 com o citado fora do fim', confere(com(
        lambda x: troca_itens(kit_de(x, 2), [ex(1), ex(2), ex(5), ex(6), ex(7), ex(8)], x[1]))), 'T2: o item citado esta na posicao 5')
    p.veneno('T3 usa um degrau 1', confere(com(
        lambda x: troca_itens(kit_de(x, 3), [ex(1), ex(6), ex(9), ex(10), ex(8), ex(7)], x[1]))), 'T3: usa o degrau 1')
    p.veneno('T3 massa insuficiente no degrau 3', confere(com(
        lambda x: troca_itens(kit_de(x, 3), [ex(5), ex(6), ex(11), ex(9), ex(10), ex(7)], x[1]))), 'T3: 3 itens de degrau 3')
    p.veneno('T3 comeca no degrau 3', confere(com(
        lambda x: troca_itens(kit_de(x, 3), [ex(9), ex(10), ex(8), ex(7)], x[1]))), 'T3: comeca no degrau 3')
    p.veneno('T3 termina no degrau 2', confere(com(
        lambda x: troca_itens(kit_de(x, 3), [ex(5), ex(9), ex(10), ex(8), ex(7), ex(11)], x[1]))), 'T3: termina no degrau 2')
    p.veneno('T3 com o citado fora do fim', confere(com(
        lambda x: troca_itens(kit_de(x, 3), [ex(5), ex(6), ex(7), ex(9), ex(10), ex(8)], x[1]))), 'T3: ha item citado')

    # ------------------------------------------------ os campos e a forma
    print('\n=== um veneno por campo do contrato ===')
    p.veneno('minutos do item fora da tempo-v1', confere(com(
        lambda x: kit_de(x, 1)['degraus'][0].__setitem__('minutos', 9.9))), 'a tempo-v1 da')
    p.veneno('minutos do kit fora da soma', confere(com(
        lambda x: kit_de(x, 1).__setitem__('minutos', 30.5))), 'a soma dos itens da')
    p.veneno('degrau diferente da dificuldade do item', confere(com(
        lambda x: kit_de(x, 1)['degraus'][0].__setitem__('degrau', 3))), 'e o item tem dificuldade')
    p.veneno('id fora da gramatica da secao 3', confere(com(
        lambda x: kit_de(x, 1).__setitem__('id', '9ano:modulo-de-prova:kit-1'))), 'o id deveria ser')
    p.veneno('regra com outro nome', confere(com(
        lambda x: kit_de(x, 1).__setitem__('regra', 'kits-v2'))), 'so conhece kits-v1')
    p.veneno('tempo_regra com outro nome', confere(com(
        lambda x: kit_de(x, 1).__setitem__('tempo_regra', 'tempo-v2'))), 'so conhece tempo-v1')
    p.veneno('teoria acima do teto de 8 paginas', confere(com(
        lambda x: kit_de(x, 1).__setitem__('teoria', ['9ano:modulo-de-prova:aula-t:teo:p01'] * 9))), 'e o teto e 8')
    p.veneno('teoria de outro modulo', confere(com(
        lambda x: kit_de(x, 1).__setitem__('teoria', ['9ano:modulo-curto:aula-t:teo:p02']))), 'que e do modulo')
    p.veneno('teoria que nao existe', confere(com(
        lambda x: kit_de(x, 1).__setitem__('teoria', ['9ano:modulo-de-prova:aula-t:teo:p09']))), 'que nao esta no teoria.json')
    p.veneno('alternativa dentro do proprio kit', confere(com(
        lambda x: kit_de(x, 1).__setitem__('alternativas', {ex(1): [ex(2)]}))), 'ja esta no proprio kit')
    p.veneno('alternativa de outro degrau', confere(com(
        lambda x: kit_de(x, 1).__setitem__('alternativas', {ex(1): [ex(11)]}))), 'noutro degrau')
    p.veneno('alternativa de outro modulo', confere(com(
        lambda x: kit_de(x, 1).__setitem__('alternativas', {ex(1): [cu(1)]}))), 'e de outro modulo')
    p.veneno('item que nao esta no itens.json', confere(com(
        lambda x: kit_de(x, 1)['degraus'][0].__setitem__('item', ex(99)))), 'nao esta no itens.json')
    p.veneno('kits.json fora de ordem', confere(com(
        lambda x: x[3].reverse())), 'fora de ordem')
    p.veneno('contagens.kits fora do kits.json', confere(com(
        lambda x: x[0]['contagens'].__setitem__('kits', 7))), 'manifest.contagens.kits')

    # ------------------------------------------------------ relaxou, nos dois sentidos
    print('\n=== relaxou: tudo o que caiu declarado, nada declarado a mais ===')
    p.veneno('afrouxou sem declarar', confere(com(
        lambda x: kit_de(x, 1, CURTO).__setitem__('relaxou', None))), 'nao declarado em relaxou')
    p.veneno('declarou o que nao caiu', confere(com(
        lambda x: kit_de(x, 1).__setitem__('relaxou', ['minutos']))), 'e nada de')
    p.veneno('relaxou com nome de fora do vocabulario', confere(com(
        lambda x: kit_de(x, 1).__setitem__('relaxou', ['tamanho']))), 'e o vocabulario e')
    p.limpo('o kit do modulo curto passa COM a declaracao de relaxou',
            [e for e in confere(amostra()) if 'modulo-curto' in e])

    # ------------------------------------------------------------ exclusoes
    print('\n=== exclusoes.json ===')
    p.veneno('exclusoes fora do manifest', confere(com(
        lambda x: x[0]['contagens'].__setitem__('itens_excluidos', 9))), 'manifest.contagens.itens_excluidos')
    p.veneno('item excluido que esta no itens.json', confere(com(
        lambda x: x[4].append({'id': ex(1), 'motivo': 'qualquer'}))), 'esta no itens.json')
    p.veneno('exclusao sem motivo', confere(com(
        lambda x: x[4][0].__setitem__('motivo', '   '))), 'sem motivo')
    p.veneno('exclusao repetida', confere(com(
        lambda x: x[4].append(dict(x[4][0])))), 'aparece duas vezes')
    p.veneno('exclusoes.json ausente', confere(com(
        lambda x: x.__setitem__(4, None))), 'exclusoes.json nao esta no pacote')

    # -------------------------------------------- o zip leva o que promete
    print('\n=== o zip leva o que o manifest promete ===')
    import gerar_pacote as GP
    conteudo = {'itens.json': b'[]', 'teoria.json': b'[]', 'busca.json': b'{}',
                'apelidos.json': b'{}', 'kits.json': b'[]', 'exclusoes.json': b'[]',
                'assets/9ano/m/l/ex-01.svg': b'<svg/>'}
    p.limpo('a ordem derivada do conteudo leva os dois arquivos novos',
            [GP.conferir_ordem_do_zip(GP.ordem_do_zip(conteudo), conteudo)] if
            GP.conferir_ordem_do_zip(GP.ordem_do_zip(conteudo), conteudo) else [])
    # o veneno e a propria lista cravada que existia antes da B9: com ela, o
    # kits.json entrava no manifest e nao entrava no zip, em silencio
    lista_cravada = (GP.RAIZ_FIXA_DO_ZIP + sorted(k for k in conteudo if k.startswith('assets/')))
    erro = GP.conferir_ordem_do_zip(lista_cravada, conteudo)
    p.veneno('a lista cravada de antes da B9', [erro] if erro else [], 'Faltando: exclusoes.json, kits.json')
    sobrando = GP.ordem_do_zip(conteudo) + ['assets/9ano/m/l/ex-99.svg']
    erro = GP.conferir_ordem_do_zip(sobrando, conteudo)
    p.veneno('um arquivo no zip que o manifest nao promete', [erro] if erro else [], 'Sobrando: assets/9ano/m/l/ex-99.svg')

    print('\n%d verificacoes passaram, %d falharam' % (p.ok, p.falhas))
    return 1 if p.falhas else 0


if __name__ == '__main__':
    sys.exit(main())
