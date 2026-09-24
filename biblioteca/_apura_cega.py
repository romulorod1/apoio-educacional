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
            for item in r['respostas']:
                par = por_par.get(item['par'])
                if par is None:
                    print('   AVISO: resposta para o par %s, que nao existe neste braco' % item['par'])
                    continue
                lado = par['por_revisor'].get(rev)
                if lado is None:
                    print('   AVISO: %s nao tem folha do par %d' % (rev, item['par']))
                    continue
                escolhas[item['par']] = lado[item['escolha']]
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
        print('Nem A nem B venceram: e a saida da secao 8(f), desligar o kit automatico.')
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
