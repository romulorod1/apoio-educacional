"""Prova da chave estável do capítulo (fase 1b, biblioteca/chaves.py), sem rede e sem livro.

    python _teste/testa_chaves_capitulos.py [--envenenado-chave-pela-pagina | --envenenado-sem-heranca]

O que se prova, com mapas sintéticos:
  1. gerar duas vezes o mesmo mapa dá as mesmas chaves, e a chave nova é
     determinística (o mesmo livro e a mesma entrada, a mesma chave);
  2. um capítulo novo no meio (o Praticando 9) não muda as chaves dos outros,
     e só ele ganha chave nova, listada como nova;
  3. o título que muda pouco na mesma página (palavras em comum) fica com a
     chave; o título trocado na MESMA página (outro capítulo) ganha chave nova:
     o começo sozinho não basta, porque o aplicativo (resolverCorrecoes) só
     segue a chave com o título igual ou com o par da herança;
  4. o par da tabela de herança (HERANCA_L1) leva a chave do título antigo
     para o novo, mesmo em outra página;
  5. no EPUB, o começo é o par (capitulo, ancora): dois capítulos na mesma
     parte com âncoras diferentes não se confundem;
  6. duas entradas antigas de mesmo título: nenhuma herda pelo título (as duas
     novas de mesmo título ficam, cada uma, pelo começo); nenhuma chave
     repete;
  7. livro sem registro: todas as chaves são novas e nenhuma é listada (não
     havia mapa com chave a conferir).
  8. o título que se repete no mapa novo (um segundo "Exercícios" em outra
     página) não leva a chave de outro capítulo: só casa pelo título quando
     ele é único dos dois lados;
  9. o título repetido no mesmo começo, ou sem começo, tem as mesmas chaves
     em três rodadas.
Venenos:
  --envenenado-titulo-sem-unicidade  o título casa mesmo repetido: o caso 8
                                  leva a chave para o capítulo errado;
  --envenenado-repetido-sem-ordem  sem o casamento em ordem dos repetidos: as
                                  chaves do caso 9 mudam a cada rodada;
  --envenenado-chave-pela-pagina  o mesmo começo basta, sem título parecido: o
                                  capítulo trocado do caso 3 herda a chave;
  --envenenado-sem-heranca        a tabela de herança é ignorada: o caso 4 perde
                                  a chave.
Saída no dialeto do portão: "N passaram, M falharam."
"""
import os
import sys
import types

AQUI = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'biblioteca')
TROCAS = {
    '--envenenado-chave-pela-pagina': ['(semelhanca(a.get(\'titulo\'), e.get(\'titulo\')) >= SEMELHANCA_MINIMA or herda(a, e))', 'True'],
    '--envenenado-sem-heranca': ['    pares = pares_da_heranca(heranca)\n', '    pares = set()\n'],
    '--envenenado-titulo-sem-unicidade': ['passo(lambda a, e: tn(a) == tn(e) and conta_a.get(tn(a)) == 1 and conta_n.get(tn(e)) == 1)', 'passo(lambda a, e: tn(a) == tn(e))'],
    '--envenenado-repetido-sem-ordem': ['        if velhos and len(velhos) == len(novos):\n', '        if False:\n'],
}
MODO = next((m for m in TROCAS if m in sys.argv), '')
passes = falhas = 0


def conf(rotulo, obtido, esperado):
    global passes, falhas
    ok = obtido == esperado
    passes += ok
    falhas += not ok
    print(('  OK    ' if ok else '  FALHA ') + rotulo + ('' if ok else '  [obtido: %r | esperado: %r]' % (obtido, esperado)))
    return ok


def carregar():
    with open(os.path.join(AQUI, 'chaves.py'), encoding='utf-8') as f:
        texto = f.read().replace('\r\n', '\n')
    if MODO:
        de, para = TROCAS[MODO]
        if not conf('o ponto do veneno existe uma vez em chaves.py', texto.count(de), 1):
            sys.exit(1)
        texto = texto.replace(de, para)
    m = types.ModuleType('chaves')
    exec(compile(texto, os.path.join(AQUI, 'chaves.py'), 'exec'), m.__dict__)
    return m


def terminar():
    if MODO:
        print('\nmodo ' + MODO)
    print('\n%d passaram, %d falharam.' % (passes, falhas))
    sys.exit(1 if falhas or not passes else 0)


C = carregar()
cap = lambda titulo, pagina: {'titulo': titulo, 'pagina': pagina, 'assuntos': []}
chaves_de = lambda mapa: [e['chave'] for e in mapa]

print('modo: ' + (MODO or 'normal'))
print('\n=== 1. Duas gerações iguais, e a chave nova determinística ===')
v1 = [cap('Números reais', 1), cap('Potências e raízes', 41), cap('Proporcionalidade', 81), cap('Semelhança', 242)]
m1, r1, n1 = C.estabilizar('pr9', v1)
m1b, r1b, _ = C.estabilizar('pr9', v1)
conf('sem registro, as chaves nascem iguais nas duas rodadas', chaves_de(m1), chaves_de(m1b))
conf('nenhuma repete', len(set(chaves_de(m1))), 4)
conf('e nenhuma é listada como nova (não havia registro)', n1, [])
m2, r2, n2 = C.estabilizar('pr9', v1, r1)
conf('com o registro, a segunda geração dá as mesmas chaves', chaves_de(m2), chaves_de(m1))
conf('o mapa de entrada não muda (a chave vai numa cópia)', any('chave' in e for e in v1), False)

print('\n=== 2. Um capítulo novo no meio (o Praticando 9) ===')
v2 = [cap('Números reais', 1), cap('Potências e raízes', 41), cap('Círculo e cilindro', 222), cap('Proporcionalidade', 81),
      cap('Semelhança', 242)]
m3, r3, n3 = C.estabilizar('pr9', v2, r1)
conf('os quatro de antes ficam com as chaves deles', [m3[i]['chave'] for i in (0, 1, 3, 4)], chaves_de(m1))
conf('só o novo ganha chave nova, e é listado', (m3[2]['chave'] not in chaves_de(m1), n3), (True, ['Círculo e cilindro']))

print('\n=== 3. O título na mesma página: parecido fica, trocado ganha chave nova ===')
base = [cap('Frações', 31), cap('Geometria plana', 61)]
mb, rb, _ = C.estabilizar('ga6', base)
parecido = [cap('Frações e decimais', 31), cap('Geometria plana', 61)]
mp, _, np_ = C.estabilizar('ga6', parecido, rb)
conf('o título que muda pouco na mesma página fica com a chave', mp[0]['chave'], mb[0]['chave'])
trocado = [cap('Estatística', 31), cap('Geometria plana', 61)]
mt, _, nt = C.estabilizar('ga6', trocado, rb)
if MODO == '--envenenado-chave-pela-pagina':
    conf('VENENO visto: o capítulo trocado na mesma página herdou a chave de "Frações"', mt[0]['chave'] == mb[0]['chave'], True)
    terminar()
conf('o capítulo trocado na mesma página ganha chave nova', mt[0]['chave'] != mb[0]['chave'], True)
conf('e é listado como novo', nt, ['Estatística'])
conf('o capítulo de título igual segue com a dele', mt[1]['chave'], mb[1]['chave'])

print('\n=== 4. O par da tabela de herança (HERANCA_L1) ===')
antigo = [cap('GA_MAT_7_LP_4ED_PNLD24_OB1_U8_278A307_FECHADO', 392)]
ma, ra, _ = C.estabilizar('ga7', antigo)
heranca = [{'titulo_antigo': 'GA_MAT_7_LP_4ED_PNLD24_OB1_U8_278A307_FECHADO', 'titulo_novo': 'Medições', 'pag_arquivo_inicio_antiga': 392}]
novo = [cap('Medições', 394), cap('Volume e capacidade', 406)]
mh, _, nh = C.estabilizar('ga7', novo, ra, heranca)
if MODO == '--envenenado-sem-heranca':
    conf('VENENO visto: sem a herança, "Medições" perdeu a chave do título antigo', mh[0]['chave'] != ma[0]['chave'], True)
    terminar()
conf('o título novo da tabela herda a chave do antigo, mesmo em outra página', mh[0]['chave'], ma[0]['chave'])
conf('o capítulo de volume, sem par, ganha chave nova', (mh[1]['chave'] != ma[0]['chave'], nh), (True, ['Volume e capacidade']))
sem_tabela = [cap('Medições', 392)]
ms, _, _ = C.estabilizar('ga7', sem_tabela, ra)
conf('sem a tabela, o mesmo começo com título nada parecido não herda', ms[0]['chave'] != ma[0]['chave'], True)

print('\n=== 5. EPUB: o começo é o par (capitulo, ancora) ===')
ep = lambda titulo, c, ancora: {'titulo': titulo, 'capitulo': c, 'capitulo_fim': c, 'ancora': ancora, 'assuntos': []}
e1 = [ep('Capítulo I', 2, 'p9'), ep('Capítulo II', 2, 'p26'), ep('Capítulo III', 2, 'p48')]
me, re_, _ = C.estabilizar('fme01', e1)
e2 = [ep('Capítulo I: conjuntos', 2, 'p9'), ep('Capítulo II: relações', 2, 'p26'), ep('Capítulo III: funções', 2, 'p48')]
me2, _, _ = C.estabilizar('fme01', e2, re_)
conf('na mesma parte, cada âncora leva a chave do seu capítulo (títulos parecidos)', chaves_de(me2), chaves_de(me))
conf('o registro do EPUB guarda capítulo e âncora', [(x['capitulo'], x['ancora']) for x in re_['entradas']], [(2, 'p9'), (2, 'p26'), (2, 'p48')])

print('\n=== 6. Títulos repetidos ===')
rep = [cap('Exercícios', 20), cap('Revisão', 30), cap('Exercícios', 50)]
mr, rr, _ = C.estabilizar('pt8', rep)
rep2 = [cap('Exercícios', 20), cap('Revisão', 30), cap('Exercícios', 50)]
mr2, _, nr2 = C.estabilizar('pt8', rep2, rr)
conf('os dois "Exercícios" ficam, cada um, com a chave do mesmo começo', chaves_de(mr2), chaves_de(mr))
conf('sem chave nova', nr2, [])
um_so = [cap('Exercícios', 20), cap('Revisão', 30)]
mu, _, nu = C.estabilizar('pt8', um_so, rr)
conf('com um "Exercícios" só no novo, ele fica com a do mesmo começo (a da p. 20)', mu[0]['chave'], mr[0]['chave'])

print('\n=== 7. A chave nova não repete o registro ===')
cheio = {'livro': 'x', 'entradas': [{'chave': C.chave_nova('x', cap('A', 1), set()), 'titulo': 'Outro', 'pagina': 99}]}
mx, _, _ = C.estabilizar('x', [cap('A', 1)], cheio)
conf('a chave que o registro já usa não é dada de novo', mx[0]['chave'] != cheio['entradas'][0]['chave'], True)

print('\n=== 8. Um título que se repete no mapa novo não leva a chave de outro capítulo ===')
ant8 = [cap('Exercícios', 50), cap('Exercícios', 70)]
m8, r8, _ = C.estabilizar('ga9', ant8)
nov8 = [cap('Exercícios', 50), cap('Exercícios', 20)]   # o da p. 70 saiu; nasceu um na p. 20
n8m, _, n8n = C.estabilizar('ga9', nov8, r8)
if MODO == '--envenenado-titulo-sem-unicidade':
    conf('VENENO visto: o "Exercícios" novo da p. 20 levou a chave do da p. 70', n8m[1]['chave'] == m8[1]['chave'], True)
    terminar()
conf('o da p. 50 fica com a chave dele (o mesmo título e o mesmo começo)', n8m[0]['chave'], m8[0]['chave'])
conf('o da p. 20 ganha chave nova, e é listado', (n8m[1]['chave'] not in chaves_de(m8), n8n), (True, ['Exercícios']))
ant8b = [cap('Revisão', 10), cap('Exercícios', 50)]
m8b, r8b, _ = C.estabilizar('pt8', ant8b)
n8bm, _, _ = C.estabilizar('pt8', [cap('Revisão', 10), cap('Exercícios', 20), cap('Exercícios', 50)], r8b)
conf('um antigo para dois novos: a chave fica no da mesma página, e não no que nasceu antes', (n8bm[2]['chave'] == m8b[1]['chave'], n8bm[1]['chave'] != m8b[1]['chave']), (True, True))

print('\n=== 9. O título repetido no mesmo começo, ou sem começo, fica estável entre rodadas ===')
for nome, mapa in [('na mesma página', [cap('Exercícios', 20), cap('Exercícios', 20)]),
                   ('sem página', [{'titulo': 'Exercícios', 'assuntos': []}, {'titulo': 'Exercícios', 'assuntos': []}])]:
    a9, ra9, _ = C.estabilizar('pt9', mapa)
    b9, rb9, nb9 = C.estabilizar('pt9', mapa, ra9)
    c9, _, _ = C.estabilizar('pt9', mapa, rb9)
    estavel = chaves_de(a9) == chaves_de(b9) == chaves_de(c9)
    if MODO == '--envenenado-repetido-sem-ordem':
        conf('VENENO visto: as chaves do título repetido ' + nome + ' mudam a cada rodada', estavel, False)
        terminar()
    conf('as chaves do título repetido ' + nome + ' são as mesmas em três rodadas, sem chave nova', (estavel, nb9), (True, []))

if MODO:
    conf('o veneno pedido foi visto pela seção dele', 'não visto', 'visto')
terminar()
