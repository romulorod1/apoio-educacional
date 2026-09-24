"""Compara dois pacotes de biblioteca arquivo a arquivo, pelo sha256 do conteudo.

    python biblioteca/_compara_pacotes.py <a.zip ou pasta> <b.zip ou pasta> [--novos kits.json,exclusoes.json]

Serve a duas perguntas, e as duas exigem o mesmo tipo de resposta, que e um
numero e nao uma impressao:

  1. DETERMINISMO. Duas geracoes do mesmo pacote, com data, commit e pasta de
     trabalho diferentes, tem de sair iguais. O manifest e comparado SEM
     `gerado_em` e sem `gerador.commit`, que sao justamente o que mudou de
     proposito; o resto, inclusive a lista de hashes, tem de bater.

  2. O QUE MUDOU DE UMA VERSAO PARA A OUTRA. Com `--novos`, os arquivos
     nomeados ali podem existir so no segundo pacote; qualquer outra diferenca
     e defeito. E assim que se prova que ligar os kits nao mexeu em recorte
     nenhum: os 1.403 arquivos da v4 saem com o mesmo sha256 e os unicos nomes
     novos sao os dois que o contrato mandou acrescentar.

O hash sai do CONTEUDO de cada arquivo, lido aqui, e nao da lista do manifest:
manifest copiado de um lado para o outro concordaria consigo mesmo.

Saida no dialeto do portao: "N verificacoes passaram, M falharam".
"""
import argparse
import hashlib
import io
import json
import os
import sys
import zipfile

SEM_COMPARAR_NO_MANIFEST = (('gerado_em',), ('gerador', 'commit'))


def sha(b):
    return hashlib.sha256(b).hexdigest()


def ler(caminho):
    """Devolve {nome: bytes} de um zip ou de uma pasta de trabalho."""
    if os.path.isdir(caminho):
        saida = {}
        for raiz, _, arqs in os.walk(caminho):
            for a in arqs:
                inteiro = os.path.join(raiz, a)
                rel = os.path.relpath(inteiro, caminho).replace(os.sep, '/')
                with open(inteiro, 'rb') as f:
                    saida[rel] = f.read()
        return saida
    with zipfile.ZipFile(caminho) as z:
        return {n: z.read(n) for n in z.namelist()}


def diferencas_do_manifest(bruto_a, bruto_b):
    """Em QUE o manifest mudou, campo a campo. Entre duas geracoes do mesmo
    pacote a resposta tem de ser "em nada"; entre uma versao e a seguinte ela
    tem de ser uma lista curta e explicavel. Dizer so "o manifest mudou" esconde
    a unica coisa que interessa, que e o que mudou dentro dele."""
    a = json.loads(bruto_a.decode('utf-8'))
    b = json.loads(bruto_b.decode('utf-8'))
    for caminho in SEM_COMPARAR_NO_MANIFEST:
        for m in (a, b):
            alvo = m
            for passo in caminho[:-1]:
                alvo = alvo.get(passo) or {}
            alvo.pop(caminho[-1], None)
    saida = []
    lista_a = a.pop('arquivos', {}) or {}
    lista_b = b.pop('arquivos', {}) or {}
    entraram = sorted(set(lista_b) - set(lista_a))
    sairam = sorted(set(lista_a) - set(lista_b))
    mudaram = sorted(n for n in set(lista_a) & set(lista_b) if lista_a[n] != lista_b[n])
    if entraram:
        saida.append('arquivos: entraram %s' % ', '.join(entraram))
    if sairam:
        saida.append('arquivos: sairam %s' % ', '.join(sairam))
    if mudaram:
        saida.append('arquivos: %d hash(es) mudaram, o primeiro e %s' % (len(mudaram), mudaram[0]))

    def anda(pa, pb, prefixo=''):
        for k in sorted(set(pa) | set(pb)):
            va, vb = pa.get(k, '(nao existia)'), pb.get(k, '(saiu)')
            if isinstance(va, dict) and isinstance(vb, dict):
                anda(va, vb, prefixo + k + '.')
            elif va != vb:
                saida.append('%s%s: %s vira %s' % (prefixo, k, json.dumps(va, ensure_ascii=False),
                                                   json.dumps(vb, ensure_ascii=False)))
    anda(a, b)
    return saida


def comparar(a, b, novos=()):
    """Devolve (linhas de problema, numeros medidos)."""
    problemas = []
    nomes_a, nomes_b = set(a), set(b)
    so_em_a = sorted(nomes_a - nomes_b)
    so_em_b = sorted(nomes_b - nomes_a)
    comuns = sorted(nomes_a & nomes_b)

    inesperados_b = [n for n in so_em_b if n not in novos]
    if so_em_a:
        problemas.append('%d arquivo(s) so no primeiro pacote, o primeiro e %s' % (len(so_em_a), so_em_a[0]))
    if inesperados_b:
        problemas.append('%d arquivo(s) novo(s) que nao foram declarados, o primeiro e %s'
                         % (len(inesperados_b), inesperados_b[0]))
    faltou_declarado = [n for n in novos if n not in so_em_b]
    if faltou_declarado:
        problemas.append('declarado como novo e nao apareceu: %s' % ', '.join(faltou_declarado))

    diferentes = []
    no_manifest = []
    for n in comuns:
        if n == 'manifest.json':
            no_manifest = diferencas_do_manifest(a[n], b[n])
            continue
        if sha(a[n]) != sha(b[n]):
            diferentes.append(n)
    if diferentes:
        problemas.append('%d arquivo(s) com conteudo diferente, os primeiros: %s'
                         % (len(diferentes), ', '.join(diferentes[:5])))
    if no_manifest and not novos:
        # sem nomes novos declarados, isto e uma comparacao entre duas geracoes
        # do MESMO pacote, e ali o manifest nao pode mudar em nada
        problemas.append('o manifest mudou: %s' % ' | '.join(no_manifest))

    numeros = {
        'comparados': len(comuns) - 1, 'iguais': len(comuns) - 1 - len(diferentes),
        'diferentes': len(diferentes), 'so_no_primeiro': len(so_em_a), 'so_no_segundo': len(so_em_b),
        'novos_declarados': sorted(novos), 'manifest': no_manifest,
    }
    return problemas, numeros


def _pacote_de_mentira(versao=4, extra=None, mexer=None, tirar=None):
    """Um pacote minusculo em memoria, para o autoteste. Nao toca em disco e
    nao depende do Drive, entao roda no portao."""
    arquivos = {'itens.json': b'[{"id":"9ano:m:l:ex:1"}]\n',
                'teoria.json': b'[]\n', 'busca.json': b'{}\n', 'apelidos.json': b'{}\n',
                'assets/9ano/m/l/ex-01.svg': b'<svg/>\n'}
    arquivos.update(extra or {})
    if mexer:
        arquivos[mexer] = arquivos[mexer] + b' '
    # tirar de verdade: some do pacote E da lista do manifest, que e o que
    # acontece quando um item sai por curadoria
    if tirar:
        arquivos.pop(tirar, None)
    manifest = {'esquema': 1, 'pacote': 'matematica-mentira', 'versao': versao,
                'gerado_em': '2026-09-23T00:00:00-03:00',
                'gerador': {'nome': 'x', 'commit': 'aaa', 'pymupdf': '1.27.2.3'},
                'contagens': {'itens': 1, 'itens_excluidos': 0},
                'arquivos': {k: sha(v) for k, v in sorted(arquivos.items())}}
    arquivos['manifest.json'] = (json.dumps(manifest, ensure_ascii=False, indent=1) + '\n').encode('utf-8')
    return arquivos


def autoteste():
    """Um veneno por tipo de diferenca que esta comparacao existe para achar.
    Comparacao que nao sabe reprovar nao vale como prova, e o par identico
    logo abaixo e o controle: se ELE reprovasse, os outros nao provariam nada."""
    ok = falhas = 0

    def caso(nome, problemas, esperado):
        nonlocal ok, falhas
        achou = bool(problemas)
        if achou == esperado:
            ok += 1
            print('  ok      %-46s %s' % (nome, (problemas[0][:95] if problemas else 'sem problema, como devia')))
        else:
            falhas += 1
            print('  FALHOU  %-46s %s' % (nome, problemas or 'nao viu nada'))

    def valor(nome, obtido, esperado):
        nonlocal ok, falhas
        if obtido == esperado:
            ok += 1
            print('  ok      %-46s %s' % (nome, obtido))
        else:
            falhas += 1
            print('  FALHOU  %-46s obtido %s, esperado %s' % (nome, obtido, esperado))

    base = _pacote_de_mentira()
    caso('controle: dois pacotes iguais passam', comparar(base, _pacote_de_mentira())[0], False)
    caso('um byte diferente num SVG reprova',
         comparar(base, _pacote_de_mentira(mexer='assets/9ano/m/l/ex-01.svg'))[0], True)
    caso('um byte diferente no itens.json reprova',
         comparar(base, _pacote_de_mentira(mexer='itens.json'))[0], True)

    # O CASO QUE A DOCSTRING DESCREVE, e que faltava. Nos dois venenos acima o
    # `_pacote_de_mentira` recalcula a lista do manifest a partir dos bytes,
    # entao quem reprovava era a lista do manifest, nao o conteudo: a lente 2
    # do PR #56 desligou a comparacao de conteudo inteira e o autoteste
    # continuou 9/0. Aqui o manifest do segundo pacote e copiado byte a byte
    # do primeiro, exatamente o "manifest copiado de um lado para o outro
    # concordaria consigo mesmo": so o sha do CONTEUDO pode pegar.
    mentiroso = _pacote_de_mentira(mexer='assets/9ano/m/l/ex-01.svg')
    mentiroso['manifest.json'] = base['manifest.json']
    problemas, numeros = comparar(base, mentiroso)
    caso('conteudo diferente com o manifest copiado reprova', problemas, True)
    valor('e reprova PELO conteudo, nao pela lista do manifest',
          any('conteudo diferente' in p for p in problemas), True)
    valor('e o numero de diferentes e 1', numeros['diferentes'], 1)
    # os numeros que vao para o registro tambem precisam de assercao: o
    # "11.298 iguais" da prova dos dez pacotes sai daqui
    _, n_limpo = comparar(base, _pacote_de_mentira())
    valor('num par igual, comparados e iguais batem com o pacote',
          (n_limpo['comparados'], n_limpo['iguais'], n_limpo['diferentes']),
          (len(base) - 1, len(base) - 1, 0))
    sem_um = {k: v for k, v in _pacote_de_mentira().items() if k != 'assets/9ano/m/l/ex-01.svg'}
    caso('arquivo que sumiu reprova', comparar(base, sem_um)[0], True)
    com_novo = _pacote_de_mentira(extra={'kits.json': b'[]\n'})
    caso('arquivo novo NAO declarado reprova', comparar(base, com_novo)[0], True)
    # e o mesmo caso com o manifest copiado, para quem acusa ser a conferencia
    # de nomes e nao a lista do manifest
    novo_calado = _pacote_de_mentira(extra={'kits.json': b'[]\n'})
    novo_calado['manifest.json'] = base['manifest.json']
    problemas_calado = comparar(base, novo_calado)[0]
    caso('arquivo novo que o manifest nem menciona reprova', problemas_calado, True)
    valor('e reprova por nome novo, nao pelo manifest',
          any('nao foram declarados' in p for p in problemas_calado), True)
    caso('o mesmo arquivo novo, declarado, passa',
         comparar(base, com_novo, novos=('kits.json',))[0], False)
    caso('declarei um novo que nao apareceu e reprova',
         comparar(base, _pacote_de_mentira(), novos=('kits.json',))[0], True)
    caso('manifest diferente reprova quando nao ha versao nova',
         comparar(base, _pacote_de_mentira(versao=5))[0], True)
    # O TEXTO do diff do manifest tem LADO, e ninguem o lia: trocar "entraram"
    # por "sairam", ou inverter o "vira", passava calado, e e esse texto que o
    # registro cita para dizer que os dois arquivos novos ENTRARAM. Achado
    # pela lente estreita do PR #56.
    valor('o diff do manifest diz a direcao da versao',
          comparar(base, _pacote_de_mentira(versao=5))[1]['manifest'], ['versao: 4 vira 5'])
    valor('e diz que o arquivo novo ENTROU, e nao que saiu',
          comparar(base, _pacote_de_mentira(extra={'kits.json': b'[]\n'}), novos=('kits.json',))[1]['manifest'],
          ['arquivos: entraram kits.json'])
    valor('e diz que o arquivo sumido SAIU',
          comparar(base, _pacote_de_mentira(tirar='assets/9ano/m/l/ex-01.svg'))[1]['manifest'],
          ['arquivos: sairam assets/9ano/m/l/ex-01.svg'])
    valor('e nomeia o hash que mudou',
          comparar(base, _pacote_de_mentira(mexer='itens.json'))[1]['manifest'],
          ['arquivos: 1 hash(es) mudaram, o primeiro e itens.json'])
    # chave que nasce e chave que some, para os rotulos "(nao existia)" e
    # "(saiu)" nao poderem ser trocados entre si sem ninguem ver
    def com_chave_no_manifest(**campos):
        p = _pacote_de_mentira()
        m = json.loads(p['manifest.json'].decode('utf-8'))
        m.update(campos)
        p['manifest.json'] = (json.dumps(m, ensure_ascii=False, indent=1) + '\n').encode('utf-8')
        return p
    valor('chave que nasce no manifest sai como "(nao existia)"',
          comparar(base, com_chave_no_manifest(series=['9ano']))[1]['manifest'],
          ['series: "(nao existia)" vira ["9ano"]'])
    valor('e chave que some sai como "(saiu)"',
          comparar(com_chave_no_manifest(series=['9ano']), base)[1]['manifest'],
          ['series: ["9ano"] vira "(saiu)"'])
    # gerado_em e gerador.commit sao os dois campos que MUDAM de proposito
    outro_dia = _pacote_de_mentira()
    m = json.loads(outro_dia['manifest.json'].decode('utf-8'))
    m['gerado_em'] = '2027-03-14T06:15:00-03:00'
    m['gerador']['commit'] = 'bbb'
    outro_dia['manifest.json'] = (json.dumps(m, ensure_ascii=False, indent=1) + '\n').encode('utf-8')
    caso('controle: so a data e o commit mudando, passa', comparar(base, outro_dia)[0], False)
    print('%d verificacoes passaram, %d falharam' % (ok, falhas))
    return 1 if falhas else 0


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    if argv is None:
        argv = sys.argv[1:]
    if '--autoteste' in argv:
        return autoteste()
    ap.add_argument('primeiro')
    ap.add_argument('segundo')
    ap.add_argument('--novos', default='', help='nomes que podem existir so no segundo pacote, separados por virgula')
    ap.add_argument('--rotulo', default='comparacao')
    x = ap.parse_args(argv)
    novos = tuple(n for n in x.novos.split(',') if n)

    a, b = ler(x.primeiro), ler(x.segundo)
    problemas, numeros = comparar(a, b, novos)
    print('%s:' % x.rotulo)
    print('  primeiro: %s (%d arquivos)' % (x.primeiro, len(a)))
    print('  segundo:  %s (%d arquivos)' % (x.segundo, len(b)))
    print('  %d arquivos comparados fora o manifest, %d iguais hash a hash, %d diferentes' %
          (numeros['comparados'], numeros['iguais'], numeros['diferentes']))
    print('  %d so no primeiro, %d so no segundo (declarados novos: %s)' %
          (numeros['so_no_primeiro'], numeros['so_no_segundo'], ', '.join(numeros['novos_declarados']) or 'nenhum'))
    print('  manifest: %s' % ('igual em tudo fora gerado_em e gerador.commit' if not numeros['manifest'] else ''))
    for linha in numeros['manifest']:
        print('      %s' % linha)
    for p in problemas:
        print('  FALHOU  %s' % p)
    # uma verificacao por pergunta que esta comparacao responde
    total = 3
    print('%d verificacoes passaram, %d falharam' % (total - len(problemas), len(problemas)))
    return 1 if problemas else 0


if __name__ == '__main__':
    sys.exit(main())
