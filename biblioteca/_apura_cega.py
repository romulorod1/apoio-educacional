"""Apura a comparacao cega: quem ganhou, se ganhou acima do acaso, e se os dois
revisores concordam.

    python biblioteca/_apura_cega.py <GABARITO_nao_mostrar.json> <respostas...>

Cada arquivo de respostas e um JSON:
    {"braco": "A", "revisor": "revisor1", "respostas": [{"par": 1, "escolha": "A", "porque": "..."}, ...]}

O CRITERIO ESTA ESCRITO AQUI, E FOI ESCRITO ANTES DE EXISTIR RESPOSTA. Teste
binomial de uma cauda a 5%: com N julgamentos, o minimo de vitorias que nao se
explica por acaso e o menor k com P(X >= k) <= 0,05 para X binomial(N, 1/2).
Com 20 pares sao 15 vitorias; com 40 julgamentos somados, 26; com 10 pares, 9.
O programa recalcula esse numero a partir do N que encontrar, para ninguem
precisar confiar nesta frase.

Por que uma cauda: a pergunta e "a regra ganha do sorteio?", e nao "as duas
sao diferentes". Perder feio e o mesmo desfecho pratico que empatar, e a
arvore de decisao da orquestradora ja trata os dois.

A medida principal do braco A sao os 40 julgamentos somados dos dois
revisores. Cada revisor sai tambem sozinho, e a concordancia entre os dois sai
ao lado: ela e o que separa "o resultado e do instrumento" de "o resultado e
do juiz".
"""
import argparse
import io
import json
import sys
from fractions import Fraction


def combinacoes(n, k):
    r = 1
    for i in range(k):
        r = r * (n - i) // (i + 1)
    return r


def p_de_cauda(n, k):
    """P(X >= k) para X binomial(n, 1/2), exato."""
    return Fraction(sum(combinacoes(n, i) for i in range(k, n + 1)), 2 ** n)


def minimo_para_5_por_cento(n):
    for k in range(n + 1):
        if p_de_cauda(n, k) <= Fraction(1, 20):
            return k
    return n + 1


def apura(gabarito, respostas):
    print('COMPARACAO CEGA, apuracao')
    print('pacote: %s | semente: %s' % (gabarito['pacote'], gabarito['semente']))
    print('')
    resumo = {}
    for nome_braco in sorted(gabarito['bracos']):
        braco = gabarito['bracos'][nome_braco]
        por_par = {p['par']: p for p in braco['pares']}
        print('=== BRACO %s (%s) ===' % (nome_braco,
              'concorrente ordenado por degrau' if braco['ordenado_por_degrau'] else 'sorteio puro, inclusive a ordem'))
        print('%d pares montados, %d descartados' % (len(braco['pares']), len(braco['descartados'])))
        for d in braco['descartados']:
            print('   descartado: %s (%s)' % (d['kit'], d['motivo']))
        escolhas_por_revisor = {}
        for r in respostas:
            if r['braco'] != nome_braco:
                continue
            rev = r['revisor']
            escolhas = {}
            problemas = []
            for item in r['respostas']:
                num = item.get('par')
                if not isinstance(num, int):
                    problemas.append('par %r nao e numero inteiro' % (num,))
                    continue
                par = por_par.get(num)
                if par is None:
                    problemas.append('resposta para o par %d, que nao existe neste braco' % num)
                    continue
                if num in escolhas:
                    problemas.append('o par %d foi respondido duas vezes' % num)
                    continue
                lado = par['por_revisor'].get(rev)
                if lado is None:
                    problemas.append('%s nao recebeu folha do par %d' % (rev, num))
                    continue
                escolha = item.get('escolha')
                if escolha not in ('A', 'B'):
                    problemas.append('o par %d veio com escolha %r, e so existem A e B' % (num, escolha))
                    continue
                escolhas[num] = lado[escolha]
            faltando = sorted(set(por_par) - set(escolhas))
            if faltando:
                problemas.append('%s nao respondeu os pares %s' % (rev, ', '.join(str(p) for p in faltando)))
            if problemas:
                # A contagem sai do campo que a diz: resposta incompleta ou
                # torta nao vira placar menor em silencio, vira parada.
                for p in problemas:
                    print('   RESPOSTA INVALIDA: %s' % p)
                raise SystemExit('a apuracao para aqui: %d problema(s) nas respostas de %s no braco %s'
                                 % (len(problemas), rev, nome_braco))
            escolhas_por_revisor[rev] = escolhas
        if not escolhas_por_revisor:
            print('   (sem respostas)')
            print('')
            continue

        soma_regra = soma_total = 0
        for rev in sorted(escolhas_por_revisor):
            e = escolhas_por_revisor[rev]
            regra = sum(1 for v in e.values() if v == 'regra')
            n = len(e)
            k = minimo_para_5_por_cento(n)
            print('   %s: a regra venceu %d de %d (acima do acaso pede %d; p = %.4f)'
                  % (rev, regra, n, k, float(p_de_cauda(n, regra))))
            soma_regra += regra
            soma_total += n
        if len(escolhas_por_revisor) > 1:
            k = minimo_para_5_por_cento(soma_total)
            print('   SOMADOS: a regra venceu %d de %d (acima do acaso pede %d; p = %.4f)'
                  % (soma_regra, soma_total, k, float(p_de_cauda(soma_total, soma_regra))))
            revs = sorted(escolhas_por_revisor)
            comuns = sorted(set(escolhas_por_revisor[revs[0]]) & set(escolhas_por_revisor[revs[1]]))
            iguais = sum(1 for p in comuns if escolhas_por_revisor[revs[0]][p] == escolhas_por_revisor[revs[1]][p])
            print('   concordancia entre os dois revisores: %d de %d pares (%.0f%%)'
                  % (iguais, len(comuns), 100.0 * iguais / len(comuns) if comuns else 0))
        resumo[nome_braco] = {'regra': soma_regra, 'total': soma_total,
                              'minimo': minimo_para_5_por_cento(soma_total),
                              'venceu': soma_regra >= minimo_para_5_por_cento(soma_total)}
        print('')

    print('=== O QUE ISTO SIGNIFICA, pela leitura escrita antes ===')
    a, b = resumo.get('A'), resumo.get('B')
    if a and a['venceu']:
        print('A regra venceu no braco A: a kits-v1 fica como esta.')
    elif a and b and b['venceu']:
        print('O braco A nao venceu e o B venceu: a regra se simplifica para rampa mais orcamento.')
    elif a and b:
        print('Nem A nem B venceram: e a saida do DESENHO_kits.md 8(f), desligar o kit automatico.')
    else:
        print('(faltam respostas de algum braco para ler o desfecho)')
    return resumo


def autoteste():
    """O limiar que decide o projeto inteiro nao pode ir para o registro sem
    conferencia. Aqui ele e batido contra valores que se checam a mao e contra
    uma contagem por forca bruta de todas as 2^n sequencias de caras e coroas,
    que e uma regua independente da formula das combinacoes."""
    ok = falhas = 0

    def caso(nome, obtido, esperado):
        nonlocal ok, falhas
        if obtido == esperado:
            ok += 1
            print('  ok      %-56s %s' % (nome, obtido))
        else:
            falhas += 1
            print('  FALHOU  %-56s obtido %s, esperado %s' % (nome, obtido, esperado))

    # valores que se conferem a mao
    caso('P(X >= 10) com n = 10 e 1 em 1024', p_de_cauda(10, 10), Fraction(1, 1024))
    caso('P(X >= 0) com n = 10 e 1', p_de_cauda(10, 0), Fraction(1))
    caso('P(X >= 6) com n = 10 e 386 em 1024', p_de_cauda(10, 6), Fraction(386, 1024))

    # regua independente: conta as sequencias uma a uma, sem combinacoes
    for n in (8, 12, 15):
        for k in range(n + 1):
            bruto = sum(1 for m in range(2 ** n) if bin(m).count('1') >= k)
            if Fraction(bruto, 2 ** n) != p_de_cauda(n, k):
                falhas += 1
                print('  FALHOU  forca bruta discorda em n=%d k=%d' % (n, k))
                break
        else:
            ok += 1
            print('  ok      %-56s %s' % ('forca bruta concorda com a formula, n = %d' % n, 'todos os k'))

    caso('limiar de 5% com 10 pares', minimo_para_5_por_cento(10), 9)
    caso('limiar de 5% com 20 pares', minimo_para_5_por_cento(20), 15)
    caso('limiar de 5% com 40 julgamentos', minimo_para_5_por_cento(40), 26)
    # e o limiar e o MENOR k que passa: o de baixo tem de falhar
    caso('14 de 20 nao passa de 5%', p_de_cauda(20, 14) > Fraction(1, 20), True)
    caso('25 de 40 nao passa de 5%', p_de_cauda(40, 25) > Fraction(1, 20), True)

    # A PONTA MAIS PERIGOSA DE TUDO ISTO: o mapa de "lista A" para "regra ou
    # sorteio". Invertido, o resultado da comparacao cega sai ao contrario e
    # nada mais no programa reclama.
    #
    # A primeira versao desta prova usava DOIS pares de disposicao OPOSTA com
    # a MESMA letra respondida, e afirmava num comentario que o mapa invertido
    # daria 2 ou 0. Era falso, e a lente 2 do PR #56 mediu: inverter o mapa
    # troca os dois pares ao mesmo tempo e o placar fica em 1 de 2 nas duas
    # versoes. Fixture simetrico NUNCA distingue inversao, por construcao.
    #
    # O que distingue e fixture ASSIMETRICO: um par, disposicao conhecida, e a
    # assercao do LADO. Os quatro casos abaixo, juntos, pegam a inversao, o
    # mapa cravado em 'regra' e o mapa cravado em 'sorteio'.
    def um_par(lado):
        return {'pacote': 'x', 'semente': 1, 'revisores': 1, 'bracos': {'A': {
            'ordenado_por_degrau': True, 'descartados': [], 'pares': [
                {'par': 1, 'kit': 'k1', 'nivel': 1, 'modulo': 'm', 'n': 4, 'minutos': '30.0',
                 'regra': [], 'sorteio': [], 'por_revisor': {'revisor1': lado}}]}}}

    def placar(gab, letra):
        resp = [{'braco': 'A', 'revisor': 'revisor1',
                 'respostas': [{'par': 1, 'escolha': letra, 'porque': ''}]}]
        saida = io.StringIO()
        antigo, sys.stdout = sys.stdout, saida
        try:
            r = apura(gab, resp)
        finally:
            sys.stdout = antigo
        return (r['A']['regra'], r['A']['total']), saida.getvalue()

    reta = {'A': 'regra', 'B': 'sorteio'}
    virada = {'A': 'sorteio', 'B': 'regra'}
    caso('lista A e a regra, e ela responde A: conta para a regra', placar(um_par(reta), 'A')[0], (1, 1))
    caso('lista A e a regra, e ela responde B: conta para o sorteio', placar(um_par(reta), 'B')[0], (0, 1))
    caso('lista A e o sorteio, e ela responde A: conta para o sorteio', placar(um_par(virada), 'A')[0], (0, 1))
    caso('lista A e o sorteio, e ela responde B: conta para a regra', placar(um_par(virada), 'B')[0], (1, 1))

    # O veredito e a leitura final tambem precisam de assercao. Sem isto,
    # trocar `>=` por `<` na linha do `venceu`, ou trocar a frase do desfecho,
    # passa calado: a lente 2 fez as duas coisas e a prova nao viu.
    def muitos(n_pares, vitorias, braco='A'):
        """n_pares com a regra sempre na lista A; as `vitorias` primeiras
        respondidas A (regra) e o resto B (sorteio)."""
        pares = [{'par': k, 'kit': 'k%d' % k, 'nivel': 1, 'modulo': 'm', 'n': 4, 'minutos': '30.0',
                  'regra': [], 'sorteio': [], 'por_revisor': {'revisor1': {'A': 'regra', 'B': 'sorteio'}}}
                 for k in range(1, n_pares + 1)]
        gab = {'pacote': 'x', 'semente': 1, 'revisores': 1,
               'bracos': {braco: {'ordenado_por_degrau': braco == 'A', 'descartados': [], 'pares': pares}}}
        resp = [{'braco': braco, 'revisor': 'revisor1', 'respostas': [
            {'par': k, 'escolha': 'A' if k <= vitorias else 'B', 'porque': ''} for k in range(1, n_pares + 1)]}]
        saida = io.StringIO()
        antigo, sys.stdout = sys.stdout, saida
        try:
            r = apura(gab, resp)
        finally:
            sys.stdout = antigo
        return r, saida.getvalue()

    caso('com 8 pares o limiar e 7', minimo_para_5_por_cento(8), 7)
    r, texto = muitos(8, 8)
    caso('8 vitorias de 8: venceu', r['A']['venceu'], True)
    caso('e a leitura final diz que a regra fica como esta',
         'a kits-v1 fica como esta' in texto, True)
    r, texto = muitos(8, 7)
    caso('7 de 8 e exatamente o limiar: venceu', r['A']['venceu'], True)
    r, texto = muitos(8, 6)
    caso('6 de 8 esta abaixo do limiar: nao venceu', r['A']['venceu'], False)
    caso('e sem o braco B a leitura nao arrisca desfecho',
         'faltam respostas' in texto, True)

    # os tres desfechos da arvore, cada um com a sua frase
    def dois_bracos(vit_a, vit_b):
        pares = lambda n, br: [{'par': k, 'kit': 'k%d' % k, 'nivel': 1, 'modulo': 'm', 'n': 4,
                                'minutos': '30.0', 'regra': [], 'sorteio': [],
                                'por_revisor': {'revisor1': {'A': 'regra', 'B': 'sorteio'}}}
                               for k in range(1, n + 1)]
        gab = {'pacote': 'x', 'semente': 1, 'revisores': 1, 'bracos': {
            'A': {'ordenado_por_degrau': True, 'descartados': [], 'pares': pares(8, 'A')},
            'B': {'ordenado_por_degrau': False, 'descartados': [], 'pares': pares(8, 'B')}}}
        resp = [{'braco': br, 'revisor': 'revisor1', 'respostas': [
                    {'par': k, 'escolha': 'A' if k <= vit else 'B', 'porque': ''} for k in range(1, 9)]}
                for br, vit in (('A', vit_a), ('B', vit_b))]
        saida = io.StringIO()
        antigo, sys.stdout = sys.stdout, saida
        try:
            apura(gab, resp)
        finally:
            sys.stdout = antigo
        return saida.getvalue()

    caso('A vence: a regra fica como esta', 'a kits-v1 fica como esta' in dois_bracos(8, 0), True)
    caso('A nao vence e B vence: a regra se simplifica',
         'se simplifica para rampa mais orcamento' in dois_bracos(4, 8), True)
    caso('nem A nem B vencem: a saida do desenho',
         'desligar o kit automatico' in dois_bracos(4, 4), True)

    # a concordancia entre os dois revisores
    def concordancia(letras1, letras2):
        pares = [{'par': k, 'kit': 'k%d' % k, 'nivel': 1, 'modulo': 'm', 'n': 4, 'minutos': '30.0',
                  'regra': [], 'sorteio': [],
                  'por_revisor': {'revisor1': {'A': 'regra', 'B': 'sorteio'},
                                  'revisor2': {'A': 'regra', 'B': 'sorteio'}}}
                 for k in range(1, len(letras1) + 1)]
        gab = {'pacote': 'x', 'semente': 1, 'revisores': 2,
               'bracos': {'A': {'ordenado_por_degrau': True, 'descartados': [], 'pares': pares}}}
        resp = [{'braco': 'A', 'revisor': 'revisor%d' % (i + 1), 'respostas': [
                    {'par': k, 'escolha': l, 'porque': ''} for k, l in enumerate(letras, 1)]}
                for i, letras in enumerate((letras1, letras2))]
        saida = io.StringIO()
        antigo, sys.stdout = sys.stdout, saida
        try:
            apura(gab, resp)
        finally:
            sys.stdout = antigo
        return saida.getvalue()

    caso('dois revisores iguais: concordancia de 4 de 4',
         'concordancia entre os dois revisores: 4 de 4' in concordancia('AABB', 'AABB'), True)
    caso('dois revisores opostos: concordancia de 0 de 4',
         'concordancia entre os dois revisores: 0 de 4' in concordancia('AABB', 'BBAA'), True)

    # Resposta torta tem de PARAR a apuracao, e nao virar placar menor em
    # silencio. Um caso por ramo de RESPOSTA INVALIDA: a lente 2 apagou os
    # quatro que nao tinham prova e nenhum foi acusado.
    dois = {'pacote': 'x', 'semente': 1, 'revisores': 1, 'bracos': {'A': {
        'ordenado_por_degrau': True, 'descartados': [], 'pares': [
            {'par': k, 'kit': 'k%d' % k, 'nivel': 1, 'modulo': 'm', 'n': 4, 'minutos': '30.0',
             'regra': [], 'sorteio': [], 'por_revisor': {'revisor1': {'A': 'regra', 'B': 'sorteio'}}}
            for k in (1, 2)]}}}

    def para(nome, respostas, revisor='revisor1'):
        parou = False
        saida = io.StringIO()
        antigo, sys.stdout = sys.stdout, saida
        try:
            apura(dois, [{'braco': 'A', 'revisor': revisor, 'respostas': respostas}])
        except SystemExit:
            parou = True
        finally:
            sys.stdout = antigo
        caso(nome, parou, True)

    ok_1 = {'par': 1, 'escolha': 'A', 'porque': ''}
    para('resposta faltando um par para a apuracao', [ok_1])
    para('escolha que nao e A nem B para a apuracao',
         [{'par': 1, 'escolha': 'C', 'porque': ''}, {'par': 2, 'escolha': 'A', 'porque': ''}])
    para('par respondido duas vezes para a apuracao',
         [ok_1, dict(ok_1), {'par': 2, 'escolha': 'A', 'porque': ''}])
    para('par que nao existe neste braco para a apuracao',
         [ok_1, {'par': 2, 'escolha': 'A', 'porque': ''}, {'par': 9, 'escolha': 'A', 'porque': ''}])
    para('par que nao e numero inteiro para a apuracao',
         [ok_1, {'par': 2, 'escolha': 'A', 'porque': ''}, {'par': '3', 'escolha': 'A', 'porque': ''}])
    para('revisor que nao recebeu folha para a apuracao',
         [ok_1, {'par': 2, 'escolha': 'A', 'porque': ''}], revisor='revisor2')

    print('%d verificacoes passaram, %d falharam' % (ok, falhas))
    return 1 if falhas else 0


def main(argv=None):
    if (argv if argv is not None else sys.argv[1:]).count('--autoteste'):
        return autoteste()
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('gabarito')
    ap.add_argument('respostas', nargs='+')
    x = ap.parse_args(argv)
    g = json.load(io.open(x.gabarito, encoding='utf-8'))
    rs = [json.load(io.open(p, encoding='utf-8')) for p in x.respostas]
    apura(g, rs)
    return 0


if __name__ == '__main__':
    sys.exit(main())
