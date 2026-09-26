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
import re
import subprocess
import sys
import tempfile
from fractions import Fraction

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)

import confere_kits as CK


# ------------------------------------------------------------- a amostra

MOD = '9ano:modulo-de-prova'
CURTO = '9ano:modulo-curto'
FRONT = '9ano:modulo-fronteira'


def item(mod_slug, lista, n, dificuldade, altura, subitens=None, citado=None, sem_solucao=False,
         texto=None, titulo=None):
    base = 'assets/9ano/%s/%s/ex-%02d' % (mod_slug, lista, n)
    return {
        'id': '9ano:%s:%s:ex:%d' % (mod_slug, lista, n),
        'fonte': 'obmep-portal', 'serie': '9ano',
        'modulo': {'slug': mod_slug,
                   'titulo': titulo or ('Modulo de Prova' if mod_slug == 'modulo-de-prova' else 'Modulo Curto')},
        'aula': {'slug': lista, 'titulo': 'Lista', 'n': 1},
        'numero': n, 'formato': 'aberta', 'alternativas': None, 'resposta': None,
        'subitens': subitens or [], 'texto': texto if texto is not None else 'exercicio %d' % n,
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


def fr(n):
    return '9ano:modulo-fronteira:lista-f:ex:%d' % n


"""Alturas escolhidas para a tempo-v1 dar numero redondo, conferido no teste
`a tempo-v1 da o que a amostra supoe`: 139 pt da 4,5 min; 208 pt da 6,0; 41 pt
da 2,4. Se a formula mudar, aquele teste reprova antes de qualquer veneno."""
H45, H60, H24 = 139, 208, 41
# e as do modulo da fronteira: 5,0 / 7,0 / 8,0 / 10,0 minutos
H50, H70, H80, H100 = 162, 255, 301, 394


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
        # Modulo desenhado para a FRONTEIRA do arredondamento e para a mediana
        # par. Sem ele, `_teto` com floor no lugar de ceil e a mediana par
        # trocada pelo valor de cima passavam sem nada reclamar: a amostra so
        # tinha kits de n = 4, 5 e 6, e neles ceil e floor dao o mesmo numero,
        # e os dois valores do meio eram iguais. Medido pela lente 1 do PR #56.
        item('modulo-fronteira', 'lista-f', 1, 1, H45),
        item('modulo-fronteira', 'lista-f', 2, 1, H45),
        item('modulo-fronteira', 'lista-f', 3, 1, H45),
        item('modulo-fronteira', 'lista-f', 4, 1, H45),
        item('modulo-fronteira', 'lista-f', 5, 1, H45),
        item('modulo-fronteira', 'lista-f', 6, 2, H45),
        item('modulo-fronteira', 'lista-f', 7, 2, H45),
        item('modulo-fronteira', 'lista-f', 8, 2, H45),
        item('modulo-fronteira', 'lista-f', 9, 3, H45),
        item('modulo-fronteira', 'lista-f', 10, 3, H45),
        item('modulo-fronteira', 'lista-f', 11, 3, H45),
        item('modulo-fronteira', 'lista-f', 12, 2, H80),
        item('modulo-fronteira', 'lista-f', 13, 3, H50),
        # dois citados, e nao um: com UM so, `citados[0]` e `citados[-1]` sao
        # o mesmo elemento, e a regra do T3 ("havendo citado, o ultimo e
        # citado") nao pode ser medida. Achado pela lente estreita do PR #56.
        item('modulo-fronteira', 'lista-f', 14, 3, H70, citado='Extraido da Olimpiada da Fronteira'),
        item('modulo-fronteira', 'lista-f', 15, 3, H100),
        item('modulo-fronteira', 'lista-f', 16, 2, H45),
        item('modulo-fronteira', 'lista-f', 17, 3, H100, citado='Adaptado da Olimpiada da Fronteira'),
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
        # Os tres da fronteira. O T2 com n = 7 e tres itens de degrau 3 e o
        # que distingue teto de piso: ceil(7/3) = 3 admite, floor(7/3) = 2
        # nao. O T3 tem n par com os dois valores do meio DIFERENTES (7,0 e
        # 10,0), que e o que a mediana par precisa para poder ser medida.
        kit(FRONT, 1, [fr(1), fr(2), fr(3), fr(4), fr(5), fr(6), fr(7)], [], {}),
        kit(FRONT, 2, [fr(1), fr(2), fr(6), fr(7), fr(9), fr(10), fr(11)], [], {}),
        kit(FRONT, 3, [fr(16), fr(14), fr(15), fr(17)], [], {}),
    ]
    kits.sort(key=lambda k: (k['serie'], k['modulo'], k['nivel']))
    exclusoes = [
        {'id': ex(20), 'motivo': 'a figura da solucao veio da fonte fora do lugar', 'quem': 'curadoria', 'data': '2026-09-22'},
        {'id': ex(21), 'motivo': 'o recorte do enunciado nao comeca pelo numero'},
    ]
    exclusoes.sort(key=lambda e: e['id'])
    manifest = {
        'esquema': 1, 'pacote': 'matematica-prova-9ano', 'versao': 1,
        # modulos sai do proprio dado: cravado em 2 ele mentia desde que o
        # modulo da fronteira entrou, e 2 era o mesmo numero de exclusoes,
        # dois valores iguais que deviam ser diferentes (lente estreita, #56)
        'contagens': {'modulos': len({i['modulo']['slug'] for i in itens}),
                      'itens': len(itens), 'itens_excluidos': len(exclusoes), 'kits': len(kits)},
    }
    # lista, e nao tupla, para os venenos poderem trocar um arquivo inteiro por None
    return [manifest, itens, teoria, kits, exclusoes]


# --------------------------------------------- a amostra da listas-v1 (8f)
#
# Amostra propria, e nao a de cima com um campo a mais, porque as tres reguas
# da 8f leem o `texto` do enunciado e a amostra de cima tem "exercicio 1" em
# todos: com ela, a semelhanca entre dois itens quaisquer daria o mesmo numero
# e a regua ficaria cega por construcao.
#
# TRES ASSIMETRIAS ESTAO CRAVADAS AQUI DE PROPOSITO, e cada uma existe porque
# sem ela a assercao correspondente passaria com a regra invertida:
#
# 1. O par 4 e 10 fica ABAIXO do limiar (0,429) e o par 5 e 14 fica ACIMA
#    (0,667). Um so dos dois nao mede o limiar: com so o de cima, limiar zero
#    passaria na amostra limpa; com so o de baixo, limiar 1 passaria no veneno.
# 2. Os itens 3 e 4 do `modulo-com-referencia` tem o MESMO degrau e os MESMOS
#    minutos, e por isso trocar os dois de lugar nao mexe em mais nada da
#    lista: so a ordem da referencia muda de veredito. Fixture que so tira o
#    alvo mediria "esta na lista" e nao "esta antes".
# 3. O `modulo-sem-porta` tem itens de degrau 1 que NAO servem de abertura (um
#    citado, um pedindo demonstracao), e a lista limpa dele abre no degrau 2.
#    Se a clausula 4 ignorasse a elegibilidade, essa lista limpa reprovaria.

MODL = '9ano:modulo-da-lista'
MODR = '9ano:modulo-com-referencia'
MODS = '9ano:modulo-sem-porta'
MODF = '9ano:modulo-da-referencia-forcada'
MODP = '9ano:modulo-do-par-repetido'


def li(n):
    return '9ano:modulo-da-lista:lista-l:ex:%d' % n


def rf(n):
    return '9ano:modulo-com-referencia:lista-r:ex:%d' % n


def sp(n):
    return '9ano:modulo-sem-porta:lista-s:ex:%d' % n


def fo(n):
    return '9ano:modulo-da-referencia-forcada:lista-o:ex:%d' % n


def pr(n):
    return '9ano:modulo-do-par-repetido:lista-p:ex:%d' % n


def amostra_listas():
    def it(slug, lista, titulo, n, d, altura, texto, citado=None):
        return item(slug, lista, n, d, altura, citado=citado, texto=texto, titulo=titulo)

    L = lambda n, d, h, t, c=None: it('modulo-da-lista', 'lista-l', 'Modulo da Lista', n, d, h, t, c)
    R = lambda n, d, h, t, c=None: it('modulo-com-referencia', 'lista-r', 'Modulo com Referencia', n, d, h, t, c)
    S = lambda n, d, h, t, c=None: it('modulo-sem-porta', 'lista-s', 'Modulo sem Porta', n, d, h, t, c)
    F = lambda n, d, h, t, c=None: it('modulo-da-referencia-forcada', 'lista-o',
                                      'Modulo da Referencia Forcada', n, d, h, t, c)
    P_ = lambda n, d, h, t, c=None: it('modulo-do-par-repetido', 'lista-p',
                                       'Modulo do Par Repetido', n, d, h, t, c)

    itens = [
        # --------------------------------------------------- modulo-da-lista
        L(1, 1, H24, 'exercicio 1. determine a area do quadrado de lado 3 cm.'),
        # degrau 1, mas pede demonstracao: nao serve de porta de entrada
        L(2, 1, H45, 'exercicio 2. mostre que a soma dos angulos internos de um triangulo vale 180 graus.'),
        # degrau 1, mas remete ao anterior: nao serve de porta e nao entra
        L(3, 1, H45, 'exercicio 3. no exercicio anterior, determine tambem o angulo externo.'),
        L(4, 2, H45, 'exercicio 4. calcule o perimetro do retangulo de lados 4 e 7.'),
        L(5, 2, H60, 'exercicio 5. calcule a area do trapezio de bases 5 e 9 e altura 6 usando a formula da area.'),
        L(6, 3, H60, 'exercicio 6. determine o raio da circunferencia inscrita no triangulo de lados 6, 8 e 10.'),
        L(7, 3, H60, 'exercicio 7. um ponto interior do triangulo equilatero dista 3, 4 e 5 dos vertices.',
          'Extraido da Olimpiada de Prova'),
        L(8, 3, H45, 'exercicio 8. seja abcd um quadrado de lado 2 e m o ponto medio de bc.'),
        L(9, 3, H45, 'exercicio 9. no losango de diagonais 6 e 8, determine a altura relativa ao lado.'),
        # quase igual ao 4, mas ABAIXO do limiar: fica na lista limpa
        L(10, 2, H45, 'exercicio 10. calcule o perimetro do retangulo de lados 5 e 9.'),
        L(11, 1, H45, 'exercicio 11. encontre os divisores positivos do numero 36.'),
        # a fonte partiu "exercicio" no fim da coluna, como parte 125 dos 482
        # itens do 9o ano. Este item remete ao 8 e so se le assim desfazendo o
        # hifen de quebra: sem o remendo, a referencia passa batida em silencio.
        L(12, 3, H45, 'exercicio 12. como no exerci- cio 8, use a diagonal do quadrado.'),
        # quase igual ao 5, ACIMA do limiar: so entra no veneno
        L(14, 2, H45, 'exercicio 14. calcule a area do trapezio de bases 5 e 9 e altura 4 usando a formula da area.'),
        # ---------------------------------------------- modulo-com-referencia
        R(1, 1, H24, 'exercicio 1. determine o dobro de cada numero abaixo.'),
        R(2, 2, H45, 'exercicio 2. calcule a media aritmetica de 4, 8 e 12.'),
        R(3, 3, H45, 'exercicio 3. determine o valor de x na figura do triangulo retangulo.'),
        # remete ao 3 pelo NUMERO, e o 3 tem o mesmo degrau e os mesmos minutos
        R(4, 3, H45, 'exercicio 4. no exercicio 3, determine tambem o valor de y.'),
        R(5, 3, H60, 'exercicio 5. encontre a soma dos angulos internos do poligono de 12 lados.'),
        R(6, 3, H60, 'exercicio 6. determine a razao entre as areas de dois triangulos semelhantes.'),
        # --------------------------------------------------- modulo-sem-porta
        S(1, 1, H45, 'exercicio 1. um tabuleiro tem 64 casas pintadas de preto e branco.',
          'Extraido da Olimpiada sem Porta'),
        S(2, 1, H45, 'exercicio 2. mostre que todo quadrado e um losango.'),
        S(3, 2, H45, 'exercicio 3. calcule o lado do quadrado de area 49.'),
        S(4, 3, H60, 'exercicio 4. determine a diagonal do cubo de aresta 5.'),
        S(5, 3, H60, 'exercicio 5. calcule o volume do cilindro de raio 3 e altura 7.'),
        S(6, 3, H45, 'exercicio 6. encontre o apotema do hexagono regular de lado 4.'),
        S(7, 3, H45, 'exercicio 7. determine a area do setor circular de 60 graus e raio 6.'),
        S(8, 2, H45, 'exercicio 8. calcule a hipotenusa do triangulo de catetos 9 e 12.'),
        # ------------------------------------------ modulo-da-referencia-forcada
        # Desenhado para o veneno do GERADOR, e a conta esta escrita porque e
        # ela que faz o veneno morder: sao quatro itens de degrau 3 e o T3 de
        # seis itens pede exatamente quatro, entao com o conserto 1 desligado
        # o item 6, que remete a um exercicio que nao existe no pacote, NAO
        # tem como ficar de fora. Com o conserto ligado sobram tres, o seis
        # nunca entra, e a lista que sai e menor e declara o que caiu.
        F(1, 1, H24, 'exercicio 1. some os numeros de 1 ate 10.'),
        F(2, 2, H45, 'exercicio 2. calcule a raiz quadrada de 144.'),
        F(3, 3, H60, 'exercicio 3. determine a area do triangulo de lados 13, 14 e 15.'),
        F(4, 3, H60, 'exercicio 4. calcule o volume da piramide de base quadrada de lado 6.'),
        F(5, 3, H60, 'exercicio 5. encontre a distancia entre os pontos medios das diagonais.'),
        F(6, 3, H60, 'exercicio 6. no exercicio 20, use o resultado para achar o angulo.'),
        # ------------------------------------------------ modulo-do-par-repetido
        # A mesma ideia para o conserto 2: os itens 2 e 3 sao o par acima do
        # limiar e sao os UNICOS dois de degrau 2. O T2 de cinco itens pede
        # dois de degrau 2, entao com a poda desligada os dois entram juntos.
        P_(1, 1, H45, 'exercicio 1. escreva os cinco primeiros multiplos de 7.'),
        P_(2, 2, H60, 'exercicio 2. calcule a area do trapezio de bases 5 e 9 e altura 6 usando a formula da area.'),
        P_(3, 2, H60, 'exercicio 3. calcule a area do trapezio de bases 5 e 9 e altura 4 usando a formula da area.'),
        P_(4, 3, H60, 'exercicio 4. determine a soma dos n primeiros numeros impares.'),
        P_(5, 3, H60, 'exercicio 5. encontre o resto da divisao de 7 elevado a 100 por 5.'),
        P_(6, 3, H60, 'exercicio 6. calcule a area da regiao entre a circunferencia e o quadrado.'),
    ]
    por_id = {i['id']: i for i in itens}

    def lista(mod, nivel, ids, relaxou=None):
        ds = []
        for k, i in enumerate(ids):
            it_ = por_id[i]
            ds.append({'n': k + 1, 'item': i, 'degrau': it_['dificuldade'],
                       'minutos': float(CK.minutos_do_item(it_))})
        return {
            'id': '%s:kit:%d' % (mod, nivel), 'modulo': mod, 'serie': '9ano', 'nivel': nivel,
            'titulo': por_id[ids[0]]['modulo']['titulo'],
            'regra': 'listas-v1', 'tempo_regra': 'tempo-v1',
            'minutos': round(sum(d['minutos'] for d in ds), 1),
            'teoria': [], 'degraus': ds, 'alternativas': {}, 'relaxou': relaxou,
        }

    kits = [
        # T2: os tres degraus, abre no 1, fecha no 3, citado no fim, e leva o
        # par 4 e 10, que fica logo ABAIXO do limiar de repeticao. 27,9 min.
        lista(MODL, 2, [li(1), li(11), li(4), li(10), li(6), li(7)]),
        # T3 da listas-v1: UM item de degrau 1 na abertura, massa no 3. 27,9.
        lista(MODL, 3, [li(1), li(4), li(8), li(9), li(6), li(7)]),
        # T3 com a referencia RESOLVIDA: o 3 entra antes do 4. 27,9.
        lista(MODR, 3, [rf(1), rf(2), rf(3), rf(4), rf(5), rf(6)]),
        # T3 que abre no degrau 2 e PASSA, porque os dois itens de degrau 1
        # deste modulo nao servem de abertura. 30,0.
        lista(MODS, 3, [sp(3), sp(8), sp(6), sp(7), sp(4), sp(5)]),
    ]
    kits.sort(key=lambda k: (k['modulo'], k['nivel']))
    exclusoes = [{'id': li(20), 'motivo': 'recorte do enunciado cortado ao meio'},
                 {'id': rf(20), 'motivo': 'a solucao veio da fonte sem a figura'}]
    exclusoes.sort(key=lambda e: e['id'])
    manifest = {
        'esquema': 1, 'pacote': 'matematica-prova-listas', 'versao': 1,
        'contagens': {'modulos': len({i['modulo']['slug'] for i in itens}),
                      'itens': len(itens), 'itens_excluidos': len(exclusoes), 'kits': len(kits)},
    }
    return [manifest, itens, [], kits, exclusoes]


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


PROIBIDOS = ('kits', 'gerar_pacote', 'portal')


def _o_que_carrega(codigo, pasta=None):
    """Roda `codigo` num interpretador limpo e devolve quais dos PROIBIDOS
    entraram no sys.modules. Medida, e nao leitura: pega import direto,
    `importlib.import_module`, `__import__` e `exec`, que nenhuma varredura de
    texto ou de arvore sintatica pega."""
    programa = ('import sys\n'
                'sys.path.insert(0, %r)\n' % (pasta or AQUI) +
                codigo + '\n'
                'print(",".join(sorted(m for m in %r if m in sys.modules)))\n' % (PROIBIDOS,))
    r = subprocess.run([sys.executable, '-c', programa], capture_output=True, text=True)
    if r.returncode != 0:
        return ['o interpretador limpo nao rodou: %s' % (r.stderr.strip().splitlines() or [''])[-1]]
    return [m for m in r.stdout.strip().split(',') if m]


def modulos_que_a_conferencia_carrega():
    carregou = _o_que_carrega('import confere_kits')
    if carregou and carregou[0].startswith('o interpretador'):
        return carregou
    return ['a confere_kits carregou %s' % ', '.join(carregou)] if carregou else []


def carrega_o_gerador_de_teste():
    """O controle da trava acima: um arquivo que importa o gerador por um
    caminho que varredura de texto nao enxerga."""
    pasta = tempfile.mkdtemp()
    with io.open(os.path.join(pasta, 'peca_de_controle.py'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('import importlib\n'
                'importlib.import_module("ki" + "ts")\n')
    carregou = _o_que_carrega('sys.path.insert(0, %r)\nimport peca_de_controle' % pasta)
    return ['carregou %s' % ', '.join(carregou)] if carregou else []


def confere(peca):
    return CK.confere(*peca)


def com(mudanca):
    """Uma copia da amostra com uma mudanca aplicada. A mudanca recebe a tupla
    (manifest, itens, teoria, kits, exclusoes)."""
    peca = copy.deepcopy(amostra())
    mudanca(peca)
    return peca


def com_listas(mudanca):
    peca = copy.deepcopy(amostra_listas())
    mudanca(peca)
    return peca


def kit_de(peca, nivel, mod=MOD):
    return next(k for k in peca[3] if k['nivel'] == nivel and k['modulo'] == mod)


def kit_l(peca, mod, nivel=3):
    return next(k for k in peca[3] if k['modulo'] == mod and k['nivel'] == nivel)


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

    # A CONFERENCIA NAO PODE SER GEMEA DO GERADOR, e isto se MEDE, nao se le.
    #
    # A primeira versao desta trava procurava o texto `import kits` no
    # arquivo. Regua fraca, e as duas lentes do PR #56 mediram por que:
    # comentario com a frase daria falso positivo, e `importlib.import_module`,
    # `__import__` e `exec` passavam batido. Ler os imports pela arvore
    # sintatica resolve os dois primeiros e ainda perde os dois ultimos.
    #
    # O que mede de verdade e abrir um interpretador limpo, importar SO a
    # conferencia, e olhar o que entrou no sys.modules. Subprocesso porque
    # este arquivo importa o gerar_pacote, que importa o kits: no processo
    # daqui a resposta ja estaria contaminada antes da pergunta.
    p.limpo('a confere_kits nao carrega o gerador, medido em processo limpo',
            modulos_que_a_conferencia_carrega())
    # o controle: o mesmo medidor, apontado para um arquivo que IMPORTA o
    # gerador, tem de acusar. Sem isto a trava acima nao prova que sabe olhar.
    p.veneno('um arquivo que importa o gerador', carrega_o_gerador_de_teste(), 'carregou')

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

    # ---------------------------------------- a fronteira do arredondamento
    print('\n=== a fronteira do arredondamento e a mediana par ===')
    # Com n = 7, a massa do T1 pede ceil(14/3) = 5 e piso daria 4. Este kit
    # tem 4, entao ele SO reprova se o arredondamento for para cima. Trocar
    # ceil por floor na `_teto` faz este veneno passar calado, e era o que
    # acontecia antes do modulo-fronteira existir.
    p.veneno('T1 com a massa um item abaixo do teto', confere(com(
        lambda x: troca_itens(kit_de(x, 1, FRONT), [fr(1), fr(2), fr(3), fr(4), fr(6), fr(7), fr(8)], x[1]))),
        'T1: 4 itens de degrau 1')
    # E o T2 limpo da amostra, com n = 7 e tres itens de degrau 3, reprova se
    # o arredondamento virar piso: e o mesmo defeito pego do outro lado, pela
    # amostra em vez do veneno.
    p.limpo('o T2 da fronteira, com 3 de degrau 3 em 7, passa',
            [e for e in confere(amostra()) if 'modulo-fronteira:kit:2' in e])
    # A mediana par: sorteados 5,0 / 7,0 / 8,0 / 10,0, a mediana e 7,5 e o
    # primeiro item tem 8,0, entao a I4 cai. Trocando a media dos dois do meio
    # pelo valor de cima a mediana viraria 8,0 e o veneno passaria calado.
    p.veneno('I4 com mediana par, que so a media dos dois do meio pega', confere(com(
        lambda x: troca_itens(kit_de(x, 3, FRONT), [fr(12), fr(13), fr(14), fr(15)], x[1]))), 'I4')
    # O veneno do citado do T3 la em cima tem UM citado so, entao ele nao mede
    # o CARDINAL: enfraquecer a guarda para `len(citados) == 1` passava calado.
    # Aqui sao DOIS citados (fr 14 e fr 17) com o ultimo NAO citado, que e o
    # unico caso que a guarda enfraquecida deixaria passar. Segunda rodada da
    # lente estreita, #56.
    p.veneno('T3 com dois citados e o ultimo sem citacao', confere(com(
        lambda x: troca_itens(kit_de(x, 3, FRONT), [fr(16), fr(14), fr(17), fr(15)], x[1]))),
        'T3: ha item citado e o ultimo nao e citado')

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
        lambda x: x[3].reverse())), 'kits.json fora de ordem (modulo e nivel')
    # O `reverse()` acima quebra a ordem dos MODULOS, entao ele nao mede a
    # perna do NIVEL: tirar o nivel da chave passava calado. Este veneno troca
    # dois kits do MESMO modulo, niveis 1 e 2, e e o unico que a perna do
    # nivel pode acusar. Achado pela segunda rodada da lente estreita, #56.
    def troca_dois_niveis_do_mesmo_modulo(x):
        kits = x[3]
        i = next(k for k, v in enumerate(kits) if v['modulo'] == MOD and v['nivel'] == 1)
        j = next(k for k, v in enumerate(kits) if v['modulo'] == MOD and v['nivel'] == 2)
        kits[i], kits[j] = kits[j], kits[i]
    p.veneno('dois kits do mesmo modulo com os niveis trocados', confere(com(
        troca_dois_niveis_do_mesmo_modulo)), 'kits.json fora de ordem (modulo e nivel')
    # o numero do veneno sai do proprio dado: cravar 7 aqui deixou de acusar
    # no dia em que a amostra passou a ter sete kits, e a prova reprovou
    # sozinha em vez de calar
    p.veneno('contagens.kits fora do kits.json', confere(com(
        lambda x: x[0]['contagens'].__setitem__('kits', len(x[3]) + 1))), 'manifest.contagens.kits')

    # ------------------------------------------- a forma, campo a campo
    # Dezesseis conferencias de forma que nao tinham veneno nenhum: a lente 2
    # do PR #56 apagou as dezesseis, uma a uma, e a prova nao viu nenhuma.
    print('\n=== um veneno por conferencia de forma ===')
    p.veneno('kit sem o campo titulo', confere(com(
        lambda x: kit_de(x, 1).pop('titulo'))), 'falta o campo titulo')
    p.veneno('kit sem o campo alternativas', confere(com(
        lambda x: kit_de(x, 1).pop('alternativas'))), 'falta o campo alternativas')
    p.veneno('kit sem o campo relaxou', confere(com(
        lambda x: kit_de(x, 1).pop('relaxou'))), 'falta o campo relaxou')
    p.veneno('nivel fora de 1, 2 e 3', confere(com(
        lambda x: kit_de(x, 1).__setitem__('nivel', 4))), 'e so existem 1, 2 e 3')
    p.veneno('modulo que nao comeca pela serie', confere(com(
        lambda x: kit_de(x, 1).__setitem__('serie', '8ano'))), 'nao comeca pela serie')
    p.veneno('degraus[].n fora da ordem', confere(com(
        lambda x: kit_de(x, 1)['degraus'][2].__setitem__('n', 9))), 'e a lista e ordenada de 1 em diante')
    p.veneno('entrada de degraus sem o campo item', confere(com(
        lambda x: kit_de(x, 1)['degraus'][0].pop('item'))), 'sem o campo item')
    p.veneno('degraus vazio', confere(com(
        lambda x: kit_de(x, 1).__setitem__('degraus', []))), 'degraus vazio ou fora de forma')
    p.veneno('teoria que nao e lista', confere(com(
        lambda x: kit_de(x, 1).__setitem__('teoria', 'p01'))), 'teoria nao e lista')
    p.veneno('alternativas que nao e objeto', confere(com(
        lambda x: kit_de(x, 1).__setitem__('alternativas', []))), 'alternativas nao e objeto')
    p.veneno('alternativas com chave que nao e do kit', confere(com(
        lambda x: kit_de(x, 1).__setitem__('alternativas', {ex(11): [ex(12)]}))), 'que nao e item deste kit')
    p.veneno('alternativa que nao existe no itens.json', confere(com(
        lambda x: kit_de(x, 1).__setitem__('alternativas', {ex(1): [ex(98)]}))), 'nao esta no itens.json')
    p.veneno('id de kit repetido', confere(com(
        lambda x: x[3].append(copy.deepcopy(x[3][1])))), 'id repetido no kits.json')
    p.veneno('kits.json que nao e lista', confere(com(
        lambda x: x.__setitem__(3, {}))), 'kits.json nao e uma lista')
    p.veneno('exclusoes.json que nao e lista', confere(com(
        lambda x: x.__setitem__(4, {}))), 'exclusoes.json nao e uma lista')
    p.veneno('exclusoes fora de ordem de id', confere(com(
        lambda x: x[4].reverse())), 'exclusoes.json fora de ordem')
    p.veneno('exclusao sem id', confere(com(
        lambda x: x[4][0].__setitem__('id', ''))), 'linha sem id')
    p.veneno('kits.json ausente no pacote', confere(com(
        lambda x: x.__setitem__(3, None))), 'kits.json nao esta no pacote')

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

    # ==================================================== listas-v1, secao 8f
    print('\n=== listas-v1: a amostra limpa e as tres reguas ===')
    peca_l = amostra_listas()
    itens_l = {i['id']: i for i in peca_l[1]}
    p.limpo('a amostra da listas-v1 passa inteira na confere_kits', confere(peca_l))

    # AS REGUAS DAO O QUE A AMOSTRA SUPOE. Sem isto, mudar uma palavra de um
    # enunciado moveria a semelhanca e os venenos abaixo virariam ruido: o
    # limiar continuaria escrito e nenhum par estaria mais de um lado dele.
    s_baixo = CK.semelhanca(itens_l[li(4)], itens_l[li(10)])
    s_alto = CK.semelhanca(itens_l[li(5)], itens_l[li(14)])
    p.limpo('o par 4 e 10 fica ABAIXO do limiar (%.3f < %.2f)' % (s_baixo, CK.LIMIAR_REPETIDOS),
            [] if s_baixo < CK.LIMIAR_REPETIDOS else ['deu %.3f' % s_baixo])
    p.limpo('o par 5 e 14 fica ACIMA do limiar (%.3f >= %.2f)' % (s_alto, CK.LIMIAR_REPETIDOS),
            [] if s_alto >= CK.LIMIAR_REPETIDOS else ['deu %.3f' % s_alto])
    # a regua da referencia le so o que a 8f manda ler
    p.limpo('"no exercicio anterior" e referencia, e aponta para o numero de tras',
            [] if CK.referencia(itens_l[li(3)]) == li(2) else ['deu %r' % CK.referencia(itens_l[li(3)])])
    p.limpo('"no exercicio 3" e referencia, e aponta para o numero citado',
            [] if CK.referencia(itens_l[rf(4)]) == rf(3) else ['deu %r' % CK.referencia(itens_l[rf(4)])])
    # o remendo do hifen de quebra da fonte, dos dois lados
    p.limpo('"exerci- cio 8", partido pela fonte, continua sendo referencia',
            [] if CK.referencia(itens_l[li(12)]) == li(8) else ['deu %r' % CK.referencia(itens_l[li(12)])])
    # e o veneno do proprio remendo: sem ele, a mesma frase vira nada. Medido
    # aqui e nao argumentado, porque e a unica forma de saber que a linha do
    # remendo esta fazendo trabalho.
    guardado = CK.RE_HIFEN_DE_QUEBRA
    try:
        # nunca casa, e mantem os dois grupos que o `sub` do remendo usa
        CK.RE_HIFEN_DE_QUEBRA = re.compile(r'(\w)-REMENDO-DESLIGADO-(\w)')
        p.veneno('a regua sem o remendo do hifen',
                 ['perdeu a referencia: leu %r' % CK.referencia(itens_l[li(12)])]
                 if CK.referencia(itens_l[li(12)]) != li(8) else [], 'perdeu a referencia')
    finally:
        CK.RE_HIFEN_DE_QUEBRA = guardado
    p.limpo('o remendo voltou ao lugar depois do veneno',
            [] if CK.referencia(itens_l[li(12)]) == li(8) else ['nao voltou'])
    # e NAO le o que a 8f manda deixar de fora. Sem estas quatro, alargar a
    # expressao para pegar "item anterior" tiraria itens bons do pacote real
    # sem nada reclamar: medidos no 9o ano, sao quatro itens em 482.
    for frase, nome in (('nos itens anteriores, some os resultados.', 'item anterior'),
                        ('no passo anterior, divida ao meio.', 'passo anterior'),
                        ('seguindo o modelo anterior, resolva.', 'modelo anterior'),
                        ('adapte o metodo acima para as dizimas abaixo.', 'acima')):
        falso = dict(itens_l[li(4)], texto='exercicio 4. ' + frase)
        p.limpo('%r nao e referencia a outro exercicio' % nome,
                [] if CK.referencia(falso) is None else ['leu %r' % CK.referencia(falso)])

    print('\n=== listas-v1: um veneno por regra nova ===')
    # ---- conserto 1: referencia. Os dois modos de falhar, e o segundo so
    # existe porque a ordem importa.
    # cirurgico: o item 3 do modulo-da-lista remete ao 2, tem degrau 1 e os
    # mesmos 4,5 minutos do que ele substitui, entao a lista continua dentro de
    # TODO o resto da regra e so a referencia cai
    p.veneno('referencia cujo alvo nao esta na lista', confere(com_listas(
        lambda x: troca_itens(kit_l(x, MODL, 3), [li(3), li(4), li(8), li(9), li(6), li(7)], x[1]))),
        'que nao esta na lista')
    # O VENENO ASSIMETRICO: trocar de lugar os itens 3 e 4, que tem o mesmo
    # degrau e os mesmos minutos. Nada mais na lista muda; so a ordem da
    # referencia. Uma trava que so perguntasse "o alvo esta na lista?" passaria
    # aqui 1 de 1, e e por isso que este veneno existe.
    p.veneno('referencia cujo alvo vem DEPOIS dela', confere(com_listas(
        lambda x: troca_itens(kit_l(x, MODR), [rf(1), rf(2), rf(4), rf(3), rf(5), rf(6)], x[1]))),
        'vem depois dele')

    # ---- conserto 2: enunciados quase repetidos
    p.veneno('par de enunciados acima do limiar na mesma lista', confere(com_listas(
        lambda x: troca_itens(kit_l(x, MODL, 2), [li(1), li(11), li(5), li(14), li(6), li(7)], x[1]))),
        'repetidos-v1')

    # ---- conserto 3: porta de entrada, as duas clausulas novas
    p.veneno('a lista abre pedindo demonstracao', confere(com_listas(
        lambda x: troca_itens(kit_l(x, MODL, 2), [li(2), li(11), li(4), li(10), li(6), li(7)], x[1]))),
        'abre pedindo demonstracao')
    p.veneno('nivel 3 que abre no degrau 2 tendo porta no degrau 1', confere(com_listas(
        lambda x: troca_itens(kit_l(x, MODL, 3), [li(4), li(10), li(8), li(9), li(6), li(7)], x[1]))),
        'tem item de abertura no degrau 1')
    # O CONTROLE DA CLAUSULA 4, no outro sentido: a lista limpa do
    # modulo-sem-porta abre no degrau 2 e PASSA, porque os dois itens de
    # degrau 1 de la nao servem de abertura. Tirar o "mostre que" de um deles
    # tem de fazer a MESMA lista reprovar. Sem este par, trocar `abre_lista`
    # por "todo item de degrau menor conta" passaria calado.
    p.limpo('nivel 3 que abre no degrau 2 PASSA quando o modulo nao tem porta no degrau 1',
            [e for e in confere(peca_l) if MODS in e])
    p.veneno('um degrau 1 do modulo-sem-porta vira porta de entrada', confere(com_listas(
        lambda x: x[1].__setitem__(
            next(k for k, i in enumerate(x[1]) if i['id'] == sp(2)),
            dict(x[1][next(k for k, i in enumerate(x[1]) if i['id'] == sp(2))],
                 texto='exercicio 2. calcule a area do losango de diagonais 6 e 8.')))),
        'tem item de abertura no degrau 1')

    # ---- a tabela do T3 da listas-v1
    print('\n=== listas-v1: um veneno por linha da tabela do T3 ===')
    p.veneno('T3 com dois itens de degrau 1', confere(com_listas(
        lambda x: troca_itens(kit_l(x, MODL, 3), [li(1), li(11), li(8), li(9), li(6), li(7)], x[1]))),
        'T3: 2 itens de degrau 1')
    p.veneno('T3 com massa insuficiente no degrau 3', confere(com_listas(
        lambda x: troca_itens(kit_l(x, MODL, 3), [li(1), li(4), li(10), li(8), li(6), li(7)], x[1]))),
        'itens de degrau 3, e a massa pede ao menos')
    p.veneno('T3 que termina no degrau 2', confere(com_listas(
        lambda x: troca_itens(kit_l(x, MODL, 3), [li(1), li(8), li(9), li(6), li(7), li(4)], x[1]))),
        'T3: termina no degrau')
    # o degrau 1 fora da abertura nao tem trava propria, e a I2 e quem acusa:
    # este veneno prova que a regiao nao ficou descoberta
    p.veneno('T3 com o degrau 1 fora da abertura, que a I2 acusa', confere(com_listas(
        lambda x: troca_itens(kit_l(x, MODL, 3), [li(4), li(1), li(8), li(9), li(6), li(7)], x[1]))), 'I2')

    # ---- a regra declarada, e o vocabulario novo de relaxou
    print('\n=== listas-v1: a regra declarada e o relaxou ===')
    # (Antes da B11 o nome inventado aqui era 'listas-v2'. A listas-v2 passou a
    # existir, a de uma aula, e o nome que ninguem conhece virou outro.)
    p.veneno('regra que nenhuma das conferencias conhece', confere(com_listas(
        lambda x: x[3][0].__setitem__('regra', 'listas-v9'))), 'so conhece kits-v1 e listas-v1 e listas-v2')
    # uma lista que declara kits-v1 e usa o T3 da listas-v1 tem de reprovar:
    # sem isto, o campo `regra` seria enfeite e as duas tabelas se misturariam
    p.veneno('lista com o T3 novo declarando a regra velha', confere(com_listas(
        lambda x: x[3][next(k for k, v in enumerate(x[3]) if v['modulo'] == MODL and v['nivel'] == 3)]
        .__setitem__('regra', 'kits-v1'))), 'T3: usa o degrau 1')
    p.veneno('afrouxou a referencia sem declarar', confere(com_listas(
        lambda x: troca_itens(kit_l(x, MODR), [rf(1), rf(2), rf(4), rf(3), rf(5), rf(6)], x[1]))),
        'nao declarado em relaxou')
    p.veneno('declarou repetidos e nada repetiu', confere(com_listas(
        lambda x: x[3][0].__setitem__('relaxou', ['repetidos']))), "e nada de 'repetidos'")

    # ------------------------------- o gerador contra a conferencia, de ponta
    # Aqui a peca SAI do gerador de proposito, e por isso esta secao fica
    # separada das de cima: ela nao mede a conferencia, mede se o que o gerador
    # produz sobrevive a uma regua que nao e a dele. O oraculo nunca e o
    # gerador: quem reprova e o confere_kits, que nao o importa.
    print('\n=== listas-v1: o que o gerador produz passa na conferencia ===')
    import kits as GK
    base_l = amostra_listas()

    def gera_e_confere():
        kits_g, _sem, _sx = GK.gerar(base_l[1], [], GK.REGRA_LISTAS, (2, 3), False)
        manifest = copy.deepcopy(base_l[0])
        manifest['contagens']['kits'] = len(kits_g)
        return kits_g, CK.confere(manifest, base_l[1], [], kits_g, base_l[4])

    kits_g, erros_g = gera_e_confere()
    p.limpo('as listas que o gerador monta da amostra passam na confere_kits', erros_g)
    # e o conserto 1 tem consequencia VISIVEL no que o gerador escolhe: o item
    # 6 do modulo-da-referencia-forcada remete a um exercicio que nao existe, e
    # por isso nao aparece em lista nenhuma, embora seja um dos quatro itens de
    # degrau 3 daquele modulo.
    onde = [k['id'] for k in kits_g if any(d['item'] == fo(6) for d in k['degraus'])]
    p.limpo('com o conserto 1 ligado, o item que remete a outro nao entra em lista nenhuma',
            ['o gerador pos %s em %s' % (fo(6), ', '.join(onde))] if onde else [])

    # O VENENO DO GERADOR: desligar o conserto 1 dentro dele e ver a
    # CONFERENCIA acusar o que ele passou a produzir. E o unico teste daqui em
    # que a reprovacao atravessa os dois lados, e ele so vale porque a
    # conferencia nao foi tocada: o oraculo nao e o gerador.
    original = GK.referencia
    try:
        GK.referencia = lambda item: None
        kits_sem, erros_sem = gera_e_confere()
        montou = [k for k in kits_sem if k['modulo'] == MODF and k['nivel'] == 3]
        p.veneno('gerador com o conserto 1 desligado',
                 erros_sem if montou else ['o gerador nem chegou a montar a lista do MODF'],
                 'referencia-v1')
    finally:
        GK.referencia = original

    # conserto 2 desligado: a poda para de podar, e os dois enunciados quase
    # iguais do modulo-do-par-repetido, que sao os unicos dois de degrau 2,
    # entram juntos na lista de nivel 2.
    onde2 = [k['id'] for k in kits_g if any(d['item'] == pr(3) for d in k['degraus'])]
    p.limpo('com o conserto 2 ligado, o segundo do par quase igual nao entra em lista nenhuma',
            ['o gerador pos %s em %s' % (pr(3), ', '.join(onde2))] if onde2 else [])
    # Aqui o veneno mede a SAIDA do gerador, e nao o veredito da conferencia,
    # e a diferenca em relacao ao conserto 1 e instrutiva: com a poda
    # desligada o gerador leva o par E DECLARA `repetidos`, entao a
    # conferencia aceita, corretamente. O defeito nao e a lista ficar
    # invalida: e a lista ficar pior. Uma prova que so olhasse o veredito
    # passaria calada, e foi o que ela fez na primeira escrita.
    original2 = GK.poda_repetidos
    try:
        GK.poda_repetidos = lambda itens: (list(itens), [])
        kits2, _e2 = gera_e_confere()
        k2 = next(k for k in kits2 if k['modulo'] == MODP and k['nivel'] == 2)
        dentro = [d['item'] for d in k2['degraus']]
        piorou2 = []
        if pr(2) in dentro and pr(3) in dentro:
            piorou2 = ['a lista passou a levar o par quase igual (itens 2 e 3), e a declarar '
                       'relaxou=%s' % (k2['relaxou'],)]
        p.veneno('gerador com o conserto 2 desligado', piorou2, 'passou a levar o par')
    finally:
        GK.poda_repetidos = original2

    # conserto 3 desligado: sem elegibilidade, todo item de degrau 1 vira porta
    # de entrada, e o modulo-sem-porta passa a abrir a lista de nivel 3 com um
    # exercicio de olimpiada. Aqui o veneno mede a SAIDA do gerador e nao a
    # conferencia, porque o gerador continua declarando o que caiu e a
    # conferencia continua aceitando: o defeito e a lista ter ficado pior, e e
    # isso que precisa aparecer.
    limpo3 = next(k for k in kits_g if k['modulo'] == MODS and k['nivel'] == 3)
    p.limpo('com o conserto 3 ligado, o modulo-sem-porta abre no degrau 2 e nao declara nada',
            [] if (limpo3['degraus'][0]['degrau'] == 2 and not limpo3['relaxou'])
            else ['abriu no degrau %d com relaxou=%s' % (limpo3['degraus'][0]['degrau'], limpo3['relaxou'])])
    original3 = GK.abre_lista
    try:
        GK.abre_lista = lambda item: True
        kits3, _e3 = gera_e_confere()
        k3 = next(k for k in kits3 if k['modulo'] == MODS and k['nivel'] == 3)
        primeiro = itens_l[k3['degraus'][0]['item']]
        piorou = []
        if primeiro.get('origem_citada') or CK.pede_demonstracao(primeiro):
            piorou = ['a lista passou a abrir com %s, e a declarar relaxou=%s'
                      % (k3['degraus'][0]['item'], k3['relaxou'])]
        p.veneno('gerador com o conserto 3 desligado', piorou, 'passou a abrir com')
    finally:
        GK.abre_lista = original3

    # e a trava de que os tres restauros funcionaram, senao os testes seguintes
    # rodariam com o gerador mutilado e ninguem veria
    p.limpo('os tres consertos voltaram ao lugar depois dos venenos',
            [] if (GK.referencia(itens_l[li(3)]) == li(2)
                   and GK.poda_repetidos is original2 and GK.abre_lista is original3)
            else ['alguma funcao nao voltou'])

    # ============================================ listas-v2, a lista de uma aula
    # A listas-v1 inteira com o orcamento de 60 minutos (pedido do Romulo em
    # 24/09). Tudo o que nao e tempo ja esta provado acima; aqui se prova o que
    # muda: a banda da I5 (54 a 66), o teto da I6 (24) e o passo do modulo
    # pequeno. O primeiro veneno e o que o pedido pediu por extenso: uma lista
    # de MEIA AULA declarando a regra de uma aula tem de reprovar.
    print('\n=== listas-v2: o orcamento de uma aula ===')
    ml = kit_l(peca_l, MODL, 2)
    p.limpo('a lista de meia aula do modulo-da-lista (%.1f min) passa como listas-v1' % ml['minutos'],
            [e for e in confere(peca_l) if MODL in e and 'kit:2' in e])
    p.veneno('lista de meia aula declarando listas-v2', confere(com_listas(
        lambda x: kit_l(x, MODL, 2).__setitem__('regra', 'listas-v2'))), 'fora da banda de 54 a 66')
    # As listas de uma aula que o gerador monta da amostra. A amostra e pequena
    # (13 itens no maior modulo), entao quase todas ficam abaixo de 54 minutos
    # e tem de DECLARAR isso: e o passo do modulo pequeno em acao.
    base_2 = amostra_listas()
    kits_2, _sem2, _sx2 = GK.gerar(base_2[1], [], GK.REGRA_AULA, (2, 3), False)
    manif_2 = copy.deepcopy(base_2[0])
    manif_2['contagens']['kits'] = len(kits_2)
    p.limpo('as listas-v2 que o gerador monta da amostra passam na confere_kits',
            CK.confere(manif_2, base_2[1], [], kits_2, base_2[4]))
    p.limpo('o passo do modulo pequeno deixa todo modulo com as duas listas (10 de 10)',
            [] if len(kits_2) == 10 else ['sairam %d listas' % len(kits_2)])
    pequenas = [k for k in kits_2 if float(k['minutos']) < 54]
    p.limpo('toda lista abaixo de 54 minutos declara minutos em relaxou',
            ['%s com %s min e relaxou=%s' % (k['id'], k['minutos'], k['relaxou'])
             for k in pequenas if 'minutos' not in (k['relaxou'] or [])])
    # e o veneno do passo: sem ele, os modulos pequenos da amostra ficam sem
    # lista, que e o que acontecia antes dele existir
    guardado_orc = copy.deepcopy(GK.ORCAMENTO)
    try:
        del GK.ORCAMENTO[GK.REGRA_AULA]['resto']
        sem_resto, _s, _x = GK.gerar(base_2[1], [], GK.REGRA_AULA, (2, 3), False)
        p.veneno('listas-v2 sem o passo do modulo pequeno',
                 ['so sairam %d listas de 10' % len(sem_resto)] if len(sem_resto) < 10 else [],
                 'so sairam')
        # O VENENO QUE ATRAVESSA OS DOIS LADOS: o gerador passa a achar que a
        # listas-v2 e de meia aula. Ele monta listas de meia aula, nao declara
        # minutos (pela banda dele, estao dentro), e a CONFERENCIA, que tem a
        # banda escrita por conta propria, acusa.
        GK.ORCAMENTO[GK.REGRA_AULA] = dict(guardado_orc[GK.REGRA_LISTAS])
        meia, _s, _x = GK.gerar(base_2[1], [], GK.REGRA_AULA, (2, 3), False)
        manif_m = copy.deepcopy(base_2[0])
        manif_m['contagens']['kits'] = len(meia)
        p.veneno('gerador que monta a listas-v2 com o orcamento de meia aula',
                 CK.confere(manif_m, base_2[1], [], meia, base_2[4]), 'fora da banda de 54 a 66')
    finally:
        GK.ORCAMENTO.clear()
        GK.ORCAMENTO.update(guardado_orc)
    p.limpo('o orcamento voltou ao lugar depois dos venenos',
            [] if GK.ORCAMENTO[GK.REGRA_AULA].get('resto') == (0, 660)
            and GK.ORCAMENTO[GK.REGRA_AULA]['banda'] == (540, 660) else ['nao voltou'])

    # I6: o teto de exercicios depende da regra. 13 itens e duro na v1 e nao e
    # na v2; 25 e duro nas duas. Os ids repetem de proposito (a I7 reclama
    # tambem), e o que se mede e SO a linha da I6.
    ids13 = [d['item'] for d in ml['degraus']] * 3
    def com_n(n, regra):
        def muda(x):
            k = kit_l(x, MODL, 2)
            k['regra'] = regra
            troca_itens(k, (ids13 * 3)[:n], x[1])
        return confere(com_listas(muda))
    so_i6 = lambda erros: [e for e in erros if 'I6' in e]
    p.veneno('13 exercicios na listas-v1', com_n(13, 'listas-v1'), 'fora da banda de 4 a 12')
    p.limpo('13 exercicios na listas-v2 nao tocam a I6', so_i6(com_n(13, 'listas-v2')))
    p.veneno('25 exercicios na listas-v2', com_n(25, 'listas-v2'), 'fora da banda de 4 a 24')

    # -------------------------------------------- o zip leva o que promete
    print('\n=== o zip leva o que o manifest promete ===')
    import gerar_pacote as GP
    conteudo = {'itens.json': b'[]', 'teoria.json': b'[]', 'busca.json': b'{}',
                'apelidos.json': b'{}', 'kits.json': b'[]', 'exclusoes.json': b'[]',
                'assets/9ano/m/l/ex-01.svg': b'<svg/>'}
    p.limpo('a ordem derivada do conteudo leva os dois arquivos novos',
            [GP.conferir_ordem_do_zip(GP.ordem_do_zip(conteudo), conteudo)] if
            GP.conferir_ordem_do_zip(GP.ordem_do_zip(conteudo), conteudo) else [])
    # A ORDEM E A ORDEM, e nao o conjunto. Trocar a ordem troca o sha256 do
    # zip, que e o numero que identifica os dez pacotes gravados, e a
    # conferencia acima compara CONJUNTOS: ela aceita a lista de cabeca para
    # baixo. A lente 2 do PR #56 mediu isso invertendo a raiz fixa e gerando os
    # dois zips: shas diferentes, conferencia calada. Entao a ordem inteira
    # entra aqui, escrita a mao, na ordem.
    esperada = ['manifest.json', 'itens.json', 'teoria.json', 'busca.json', 'apelidos.json',
                'exclusoes.json', 'kits.json', 'assets/9ano/m/l/ex-01.svg']
    p.limpo('a ordem do zip e exatamente esta, na ordem',
            [] if GP.ordem_do_zip(conteudo) == esperada
            else ['deu %s' % GP.ordem_do_zip(conteudo)])
    # o veneno e a propria lista cravada que existia antes da B9: com ela, o
    # kits.json entrava no manifest e nao entrava no zip, em silencio
    lista_cravada = (GP.RAIZ_FIXA_DO_ZIP + sorted(k for k in conteudo if k.startswith('assets/')))
    erro = GP.conferir_ordem_do_zip(lista_cravada, conteudo)
    p.veneno('a lista cravada de antes da B9', [erro] if erro else [], 'Faltando: exclusoes.json, kits.json')
    sobrando = GP.ordem_do_zip(conteudo) + ['assets/9ano/m/l/ex-99.svg']
    erro = GP.conferir_ordem_do_zip(sobrando, conteudo)
    p.veneno('um arquivo no zip que o manifest nao promete', [erro] if erro else [], 'Sobrando: assets/9ano/m/l/ex-99.svg')

    # tres venenos da ORDEM, que o conjunto nao pega e o sha do zip sente
    original = list(GP.RAIZ_FIXA_DO_ZIP)
    try:
        GP.RAIZ_FIXA_DO_ZIP[:] = list(reversed(original))
        p.veneno('a raiz fixa de cabeca para baixo',
                 [] if GP.ordem_do_zip(conteudo) == esperada else ['a ordem mudou'], 'a ordem mudou')
    finally:
        GP.RAIZ_FIXA_DO_ZIP[:] = original
    fora_de_ordem = [k for k in esperada if k.startswith('assets/')] + [k for k in esperada if not k.startswith('assets/')]
    p.veneno('os assets antes da raiz',
             [] if fora_de_ordem == esperada else ['a ordem mudou'], 'a ordem mudou')
    trocado = esperada[:5] + [esperada[6], esperada[5]] + esperada[7:]
    p.veneno('dois arquivos de raiz trocados entre si',
             [] if trocado == esperada else ['a ordem mudou'], 'a ordem mudou')

    print('\n%d verificacoes passaram, %d falharam' % (p.ok, p.falhas))
    return 1 if p.falhas else 0


if __name__ == '__main__':
    sys.exit(main())
