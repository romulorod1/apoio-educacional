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
