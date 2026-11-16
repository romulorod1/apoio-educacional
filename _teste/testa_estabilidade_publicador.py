"""Prova de estabilidade do publicador (item 12c, passo 2), sem rede e sem livro de verdade.

    python _teste/testa_estabilidade_publicador.py [--envenenado-chave-pelos-assuntos]

O 12c liga o capítulo de um livro a um assunto de OUTRA matéria (o capítulo de
química sobre pH liga o MATEM1-08, Logaritmos). Antes de pôr essas ligações nos
mapas de verdade, esta prova mostra o que a ligação nova muda no catálogo, pelo
caminho real do publicador (biblioteca/publicar_catalogo.py: livros_da_planilha,
que chama o gerador biblioteca/livros.py, e planejar, que dá as chaves pelo
biblioteca/chaves.py), sem rede, sem gcloud e nunca com --publicar.

Os dados são SINTÉTICOS, escritos aqui na hora: dois PDFs de texto (um de
química e um de matemática, da 1ª série), a planilha deles, dois mapas da
orquestradora e um pacote de exercícios de prova. Nenhum aluno, nenhum livro
de verdade. Os ids de assunto são os do banco do repositório.

    mapa A  química: 1 Grandezas e medidas  QUIEM1-T02
                     2 Produto iônico e pH  QUIEM1-T01
            matemática: 1 Logaritmos        MATEM1-08
    mapa B  o mesmo, e o MATEM1-08 de matemática nos capítulos 1 e 2 da química

O que se prova:
  1. o gerador aceita a ligação: o capítulo 2 de química passa a ter o
     MATEM1-08, a nota conta "1 assunto(s) de outra matéria", e o meta não
     ganha campo de disciplina;
  2. com o registro de chaves da publicação A, a publicação B dá as MESMAS
     chaves a todos os capítulos dos dois livros, nenhuma chave nova, os
     mesmos ids de livro e o mesmo registro de ids;
  3. sem registro nenhum (a primeira publicação, refeita do zero), o mapa A e o
     mapa B dão as mesmas chaves: a chave sai do título e do começo, nunca dos
     assuntos;
  4. no índice, só o metaHash (e o metaVersao) do livro de química muda; o
     sha256 e o tamanho dos dois livros, o metaHash do de matemática e os
     pacotes (os mesmos nomes, as mesmas entradas) ficam iguais; o lote só
     regrava o documento do livro de química, por "meta trocado";
  5. a correção dela vence: o capítulo 2 que ela já corrigiu na publicação A
     (db.ajustes.mapaDosLivros, gravada com a chave do capítulo) continua com a
     escolha dela no meta B, pelo próprio biblioteca.js (Biblioteca.mapaDoLivro),
     e a ligação nova NÃO aparece nele; o capítulo 1, que ela não corrigiu,
     mostra a ligação; "Abrir no livro" (Biblioteca.livrosComAssunto) acha o
     MATEM1-08 só no capítulo 1 da química e no livro de matemática.

Veneno (TEM de ser visto: "VENENO visto"):
  --envenenado-chave-pelos-assuntos  a chave nova sai também dos assuntos do
                                  capítulo: o caso 3 muda as chaves dos
                                  capítulos que ganharam a ligação.

Saída no dialeto do portão: "N passaram, M falharam."
"""
import copy
import csv
import json
import os
import shutil
import subprocess
import sys
import tempfile
import types
import zipfile

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BIBLIOTECA = os.path.join(RAIZ, 'biblioteca')
TROCAS = {
    '--envenenado-chave-pelos-assuntos': [
        "    base = '%s|%s|%s' % (livro_id, titulo_normalizado(entrada.get('titulo')), comeco(entrada))\n",
        "    base = '%s|%s|%s|%r' % (livro_id, titulo_normalizado(entrada.get('titulo')), comeco(entrada), entrada.get('assuntos'))\n"],
}
MODO = next((m for m in TROCAS if m in sys.argv), '')
desconhecidos = [a for a in sys.argv[1:] if a.startswith('--envenenado-') and a not in TROCAS]
passes = falhas = 0
AGORA = '2026-11-16T10:00:00-03:00'
UID = 'uidDeProva'


def conf(rotulo, obtido, esperado):
    global passes, falhas
    ok = obtido == esperado
    passes += ok
    falhas += not ok
    print(('  OK    ' if ok else '  FALHA ') + rotulo + ('' if ok else '  [obtido: %r | esperado: %r]' % (obtido, esperado)))
    return ok


def secao(t):
    print('\n' + t)


def terminar():
    if MODO:
        print('\nmodo ' + MODO)
    print('\n%d passaram, %d falharam.' % (passes, falhas))
    sys.exit(1 if falhas or not passes else 0)


def carregar_chaves():
    """O chaves.py do repositório (com o veneno, no modo dele) no lugar do módulo
    `chaves`, antes de o publicador o importar."""
    with open(os.path.join(BIBLIOTECA, 'chaves.py'), encoding='utf-8') as f:
        texto = f.read().replace('\r\n', '\n')
    if MODO:
        de, para = TROCAS[MODO]
        if not conf('o ponto do veneno existe uma vez em chaves.py', texto.count(de), 1):
            terminar()
        texto = texto.replace(de, para)
    m = types.ModuleType('chaves')
    exec(compile(texto, os.path.join(BIBLIOTECA, 'chaves.py'), 'exec'), m.__dict__)
    sys.modules['chaves'] = m
    return m


# ------------------------------------------------------------------ os dados sintéticos

CABECALHO = ['Matéria', 'Kit', 'Título', 'Volume', 'Autoria', 'Editora', 'Edição', 'Ano', 'ISBN', 'Segmento',
             'Relevância (1 a 5)', 'Uso', 'Fonte do ISBN', 'Formato digital', 'Onde comprar ou assinar', 'ISBN digital',
             'Fonte digital', 'Arquivo', 'Tamanho (KB)', 'EPUB convertido (caminho a partir de Livros)', 'materia_id']


def pdf_de_paginas(caminho, rotulo, paginas):
    import pymupdf
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    doc = pymupdf.open()
    for i in range(paginas):
        pg = doc.new_page(width=595, height=842)
        pg.insert_text((72, 90), '%s, página %d.' % (rotulo, i + 1), fontname='helv', fontsize=14)
    doc.set_metadata({'creationDate': 'D:20261116000000', 'modDate': 'D:20261116000000', 'producer': 'prova', 'creator': 'prova'})
    doc.save(caminho, garbage=3, deflate=True, no_new_id=True)
    doc.close()


def linha(materia, titulo, arquivo):
    l = dict.fromkeys(CABECALHO, '')
    l.update({'Matéria': materia.capitalize(), 'Título': titulo, 'Arquivo': arquivo, 'materia_id': materia,
              'Autoria': 'Autora de Prova', 'Editora': 'Editora de Prova', 'Edição': '1ª edição', 'Ano': '2026',
              'Segmento': 'Ensino médio'})
    return l


def capitulo(n, titulo, ini, fim, ids):
    return {'n': n, 'titulo': titulo, 'pag_impressa': ini, 'pag_arquivo_inicio': ini, 'pag_arquivo_fim': fim,
            'assuntos': [{'id': i, 'confianca': 'alta'} for i in ids]}


MAPA_QUI_A = [{'livro': 'qui-prova', 'arquivo': 'quimica-de-prova.pdf', 'serie': 'em1', 'deslocamento': 0, 'capitulos': [
    capitulo(1, 'Grandezas e medidas', 1, 2, ['QUIEM1-T02']),
    capitulo(2, 'Produto iônico e pH', 3, 4, ['QUIEM1-T01'])]}]
MAPA_MAT = [{'livro': 'mat-prova', 'arquivo': 'matematica-de-prova.pdf', 'serie': 'em1', 'deslocamento': 0, 'capitulos': [
    capitulo(1, 'Logaritmos', 1, 2, ['MATEM1-08'])]}]


def mapa_qui_b():
    m = copy.deepcopy(MAPA_QUI_A)
    for cap in m[0]['capitulos']:
        cap['assuntos'].append({'id': 'MATEM1-08', 'confianca': 'media'})
    return m


def escrever_mapas(pasta, mapa_qui):
    os.makedirs(pasta, exist_ok=True)
    for nome, dados in (('mapa_quimica_prova.json', mapa_qui), ('mapa_matematica_prova.json', MAPA_MAT)):
        with open(os.path.join(pasta, nome), 'w', encoding='utf-8', newline='') as f:
            json.dump(dados, f, ensure_ascii=False)
    return pasta


def fixtures(tmp):
    livros = os.path.join(tmp, 'Livros')
    pdf_de_paginas(os.path.join(livros, 'quimica', 'quimica-de-prova.pdf'), 'Química de prova', 4)
    pdf_de_paginas(os.path.join(livros, 'matematica', 'matematica-de-prova.pdf'), 'Matemática de prova', 2)
    planilha = os.path.join(livros, 'livros_prova.csv')
    with open(planilha, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=CABECALHO)
        w.writeheader()
        w.writerows([linha('quimica', 'Química de prova', 'quimica/quimica-de-prova.pdf'),
                     linha('matematica', 'Matemática de prova', 'matematica/matematica-de-prova.pdf')])
    pacotes = os.path.join(tmp, 'pacotes')
    os.makedirs(pacotes)
    with zipfile.ZipFile(os.path.join(pacotes, 'exercicios-prova-v1.zip'), 'w') as z:
        z.writestr('manifest.json', json.dumps({'esquema': 1, 'pacote': 'exercicios-prova', 'versao': 1, 'conteudo': 'exercicios'}))
    return {'livros': livros, 'planilha': planilha, 'pacotes': pacotes,
            'mapas_a': escrever_mapas(os.path.join(tmp, 'mapa_a'), MAPA_QUI_A),
            'mapas_b': escrever_mapas(os.path.join(tmp, 'mapa_b'), mapa_qui_b())}


# ------------------------------------------------------------------ o publicador, sem rede

def metas_do_gerador(P, f, mapas):
    novos = P.livros_da_planilha(f['planilha'], f['livros'], mapas)
    # sem a classificação, o publicador tira o arquivo_origem antes de planejar
    return [{k: v for k, v in m.items() if k != 'arquivo_origem'} for m in novos]


def planejar(P, f, metas, mapas, anterior=None):
    pacotes, recusas, _ = P.pacotes_das_pastas([f['pacotes']])
    citados = P.assuntos_dos_mapas(mapas)
    a = anterior or {}
    plano = P.planejar(metas, a.get('indice'), a.get('registro_ids'), None, None, P.ids_do_banco(), citados,
                       a.get('registros_chaves'), None, AGORA, 'prova', UID, None, pacotes)
    plano['recusas'] = recusas + plano['recusas']
    return plano


def meta_do_plano(plano, lid):
    for d_lid, doc, _campos in plano['docs']:
        if d_lid == lid and doc and doc.get('metaJson'):
            return json.loads(doc['metaJson'])
    return None


def chaves_do_meta(meta):
    return [(e.get('titulo'), e.get('chave')) for e in (meta or {}).get('mapa') or []]


def ids_do_mapa(meta):
    return [[a['id'] for a in e.get('assuntos') or []] for e in (meta or {}).get('mapa') or []]


# ------------------------------------------------------------------ o aplicativo, pelo biblioteca.js

APLICATIVO_JS = r"""
const fs = require('fs'), path = require('path'), vm = require('vm');
const [raiz, arq] = process.argv.slice(2);
const ctx = { Math, JSON, Object, Array, String, Number, Error, RegExp, parseInt, isFinite, Promise, setTimeout, clearTimeout,
              TextDecoder, Uint8Array, ArrayBuffer };
ctx.self = ctx;
vm.runInNewContext(fs.readFileSync(path.join(raiz, 'biblioteca.js'), 'utf8'), ctx, { filename: 'biblioteca.js' });
const B = ctx.Biblioteca;
const d = JSON.parse(fs.readFileSync(arq, 'utf8'));
// a correção que ela gravou na publicação A, do mesmo jeito que o app grava (gravarCorrecaoDoMapa)
const entradaA = B.mapaDoLivro(d.metaA, {}).filter(e => e.n === d.n)[0];
const registro = { titulo: entradaA.titulo, assuntos: d.escolha, acao: 'corrigiu', quando: '2026-11-16T10:00:00.000Z', n: entradaA.n };
if (entradaA.chave) registro.chave = entradaA.chave;
const doLivro = {};
doLivro[B.chaveParaGravarCorrecao(doLivro, entradaA)] = registro;
const ver = m => B.mapaDoLivro(m, doLivro).map(e => ({ n: e.n, titulo: e.titulo, chave: e.chave, assuntos: e.assuntos, estado: e.estado }));
const livros = [{ id: d.metaB.id, meta: d.metaB }, { id: d.metaMat.id, meta: d.metaMat }];
const corr = {}; corr[d.metaB.id] = doLivro;
process.stdout.write(JSON.stringify({ chaveGravada: registro.chave || null, a: ver(d.metaA), b: ver(d.metaB),
  abrir: B.livrosComAssunto(livros, corr, 'MATEM1-08', 'em1').map(x => x.id + '#' + x.entrada.n) }));
"""


def no_aplicativo(tmp, dados):
    js = os.path.join(tmp, 'aplicativo_correcao.js')
    arq = os.path.join(tmp, 'aplicativo_correcao.json')
    with open(js, 'w', encoding='utf-8') as f:
        f.write(APLICATIVO_JS)
    with open(arq, 'w', encoding='utf-8') as f:
        json.dump(dados, f, ensure_ascii=False)
    r = subprocess.run(['node', js, RAIZ, arq], capture_output=True, text=True, encoding='utf-8')
    if r.returncode != 0:
        raise RuntimeError('node falhou: %s' % r.stderr[-400:])
    return json.loads(r.stdout)


# ------------------------------------------------------------------ a prova

def principal():
    secao('0. A prova se confere')
    conf('nenhum veneno desconhecido foi pedido', desconhecidos, [])
    carregar_chaves()
    if BIBLIOTECA not in sys.path:
        sys.path.insert(0, BIBLIOTECA)
    import publicar_catalogo as P
    conf('o publicador usa o chaves.py desta prova', P.chaves is sys.modules['chaves'], True)
    banco = P.ids_do_banco()
    conf('os ids da prova estão no banco do repositório', all(i in banco for i in ('QUIEM1-T01', 'QUIEM1-T02', 'MATEM1-08')), True)

    tmp = tempfile.mkdtemp(prefix='prova_estabilidade_')
    try:
        f = fixtures(tmp)
        metas_a = metas_do_gerador(P, f, f['mapas_a'])
        metas_b = metas_do_gerador(P, f, f['mapas_b'])
        por_materia = lambda ms: {m.get('materia'): m for m in ms}
        qa, qb = por_materia(metas_a).get('quimica'), por_materia(metas_b).get('quimica')
        mat_a = por_materia(metas_a).get('matematica')
        if not conf('o gerador fez os dois livros nas duas rodadas', (len(metas_a), len(metas_b), bool(qa and qb and mat_a)), (2, 2, True)):
            terminar()
        LQ, LM = qa['id'], mat_a['id']

        secao('1. O gerador aceita a ligação de outra matéria')
        conf('mapa A: os assuntos dos capítulos de química', ids_do_mapa(qa), [['QUIEM1-T02'], ['QUIEM1-T01']])
        conf('mapa B: o MATEM1-08 entra nos capítulos 1 e 2 de química', ids_do_mapa(qb), [['QUIEM1-T02', 'MATEM1-08'], ['QUIEM1-T01', 'MATEM1-08']])
        conf('a nota do livro conta a ligação de outra matéria', '1 assunto(s) de outra matéria: MATEM1-08.' in (qb.get('mapa_nota') or ''), True)
        conf('nenhum assunto do meta ganha campo de disciplina', any('disciplina' in a for e in qb['mapa'] for a in e['assuntos']), False)
        conf('o arquivo dos livros não muda (o mesmo sha256 e o mesmo tamanho)',
             sorted((m['id'], m['hash'], m['bytes']) for m in metas_a), sorted((m['id'], m['hash'], m['bytes']) for m in metas_b))

        secao('2. Com o registro de chaves: as mesmas chaves, os mesmos ids')
        plano_a = planejar(P, f, metas_a, f['mapas_a'])
        conf('a publicação A não tem recusa', plano_a['recusas'], [])
        plano_b = planejar(P, f, metas_b, f['mapas_b'], plano_a)
        conf('a publicação B não tem recusa', plano_b['recusas'], [])
        conf('nenhuma chave nova na publicação B', [l for l in plano_b['linhas'] if 'chave nova' in l], [])
        conf('o registro de chaves dos dois livros é o mesmo', plano_b['registros_chaves'], plano_a['registros_chaves'])
        meta_qa, meta_qb = meta_do_plano(plano_a, LQ), meta_do_plano(plano_b, LQ)
        conf('as chaves dos capítulos de química, no meta publicado, são as mesmas', chaves_do_meta(meta_qb), chaves_do_meta(meta_qa))
        conf('todo capítulo tem chave', all(c for _t, c in chaves_do_meta(meta_qa)) and len(chaves_do_meta(meta_qa)) == 2, True)
        conf('os ids dos livros são os mesmos', sorted(plano_b['indice']['livros']), sorted(plano_a['indice']['livros']))
        conf('o registro de ids é o mesmo', plano_b['registro_ids'], plano_a['registro_ids'])

        secao('3. Sem registro nenhum: a chave não sai dos assuntos')
        zero_a = planejar(P, f, metas_a, f['mapas_a'])
        zero_b = planejar(P, f, metas_b, f['mapas_b'])
        ca, cb = chaves_do_meta(meta_do_plano(zero_a, LQ)), chaves_do_meta(meta_do_plano(zero_b, LQ))
        if MODO == '--envenenado-chave-pelos-assuntos':
            visto = bool(ca) and ca != cb
            conf('chave-pelos-assuntos: as chaves mudaram com a ligação nova (defeito detectado)', visto, True)
            if visto:
                print('VENENO visto: %r viraram %r' % (ca, cb))
            terminar()
        conf('o mapa A e o mapa B, cada um do zero, dão as mesmas chaves', cb, ca)
        conf('e são as mesmas da publicação com registro', ca, chaves_do_meta(meta_qa))

        secao('4. No índice, só o metaHash do livro de química muda')
        ia, ib = plano_a['indice']['livros'], plano_b['indice']['livros']
        conf('o metaHash do livro de química muda', ib[LQ]['metaHash'] != ia[LQ]['metaHash'], True)
        conf('e o metaVersao dele sobe um', (ia[LQ]['metaVersao'], ib[LQ]['metaVersao']), (1, 2))
        conf('o livro de matemática fica igual no índice', ib[LM], ia[LM])
        fora_do_hash = lambda e: {k: v for k, v in e.items() if k not in ('metaHash', 'metaVersao')}
        conf('no de química, fora o metaHash e o metaVersao, nada muda', fora_do_hash(ib[LQ]), fora_do_hash(ia[LQ]))
        conf('os pacotes: os mesmos nomes', sorted(plano_b['indice'].get('pacotes') or {}), ['exercicios-prova'])
        conf('os pacotes: as mesmas entradas', plano_b['indice'].get('pacotes'), plano_a['indice'].get('pacotes'))
        conf('o lote regrava só o documento do livro de química', [d[0] for d in plano_b['docs']], [LQ])
        conf('o motivo é "meta trocado"', [l for l in plano_b['linhas'] if l.startswith('- ' + LQ + ':')],
             ['- %s: meta trocado (%d bytes)' % (LQ, qb['bytes'])])
        conf('o meta B difere do A só no mapa e na nota', sorted(k for k in set(meta_qa) | set(meta_qb) if meta_qa.get(k) != meta_qb.get(k)),
             ['mapa', 'mapa_nota'])

        secao('5. A correção dela vence a ligação nova')
        app = no_aplicativo(tmp, {'metaA': meta_qa, 'metaB': meta_qb, 'metaMat': meta_do_plano(plano_a, LM), 'n': 2,
                                  'escolha': ['QUIEM1-T01', 'QUIEM1-T02']})
        print('   ' + json.dumps(app, ensure_ascii=False))
        b = {e['n']: e for e in app['b']}
        conf('a correção foi gravada com a chave do capítulo 2', app['chaveGravada'], dict(chaves_do_meta(meta_qa))['Produto iônico e pH'])
        conf('no meta A, o capítulo 2 tem a escolha dela', [e['assuntos'] for e in app['a'] if e['n'] == 2], [['QUIEM1-T01', 'QUIEM1-T02']])
        conf('no meta B, o capítulo 2 continua com a escolha dela, sem o MATEM1-08', (b[2]['assuntos'], b[2]['estado']),
             (['QUIEM1-T01', 'QUIEM1-T02'], 'corrigido'))
        conf('o capítulo 1, que ela não corrigiu, mostra a ligação nova', (b[1]['assuntos'], b[1]['estado']),
             (['QUIEM1-T02', 'MATEM1-08'], 'do_mapa'))
        conf('"Abrir no livro" acha o MATEM1-08 no capítulo 1 da química e no livro de matemática, e não no 2',
             sorted(app['abrir']), sorted([LQ + '#1', LM + '#1']))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    terminar()


if __name__ == '__main__':
    principal()
