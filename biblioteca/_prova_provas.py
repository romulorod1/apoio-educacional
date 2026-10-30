"""Provas do tipo de fonte provas (OBMEP Mirim e ENEM, biblioteca/provas.py), com um veneno por trava.

    python biblioteca/_prova_provas.py
        amostra sintetica (o que roda no portao, sem o Drive): as provas de
        biblioteca/_amostra/fazer_amostra_provas.py, cada colecao gerada DUAS
        vezes.

    python biblioteca/_prova_provas.py --real --serie m1|m2|3em --pdfs <pasta das provas>
            --trabalho <A> --trabalho2 <B> [--zip <pacote.zip>]
        as mesmas travas sobre um pacote de verdade gerado duas vezes.

    --sem-navegador pula a fidelidade (Chrome headless).

Travas proprias das provas:
  contagens    toda questao da prova (1 a N na Mirim, N lido do PDF da solucao
               por expressao propria; 136 a 180 no ENEM) esta no pacote ou
               excluida com motivo, e nada alem delas
  campos       serie, series_equivalentes, fonte, aula, id, objetiva com A a E,
               dificuldade, rotulo nulo, sem solucao so no ENEM, e o modulo e o
               assunto do aplicativo (tema_app) ou "Diversos"
  recorte      o recorte comeca pelo numero (lido pelos caracteres do PDF, sem o
               detector), nenhum pedaco menor que 8 pt, nenhum sobrepondo outro,
               nenhuma borda cortando tinta
  um marcador  o enunciado tem UM numero de questao na margem, no comeco
  resposta     a da Mirim e a letra depois de "ALTERNATIVA" na solucao; a do
               ENEM e a do gabarito lido em ordem de texto (o gerador le pela
               posicao na tabela); questao anulada fica de fora
  entre        nenhuma linha de texto entre duas questoes seguidas da mesma
               prova fica fora dos dois recortes
  cabecalho    nenhuma linha de cabecalho ou rodape corrido dentro de recorte
e as genericas da prova do Portal (determinismo, svg, xml, manifesto, tracos,
PyMuPDF no manifest, curadoria, glifos e fidelidade no Chrome), estas sobre uma
vista em que o enunciado e a solucao de cada questao sao itens separados,
porque a solucao da Mirim vem de outro PDF.
"""
import argparse
import collections
import copy
import io
import json
import os
import re
import shutil
import sys
import tempfile

import pymupdf

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import gerar_pacote  # noqa: E402
import portal  # noqa: E402
import provas  # noqa: E402
import _prova_gerador as pg  # noqa: E402
from _prova_banco import borda_corta_tinta  # noqa: E402

sys.path.insert(0, os.path.join(AQUI, '_amostra'))
import fazer_amostra_provas  # noqa: E402

QUESTAO = re.compile(r'QUEST[ÃA]O\s*(\d{1,3})', re.I)
LETRA = re.compile(r'ALTERNATIVA\s*\(?([A-E])\)?(?![A-Za-z])', re.I)


class PacoteProvas(pg.Pacote):
    """Pacote de provas: os PDFs ficam todos numa pasta so (a da colecao)."""

    def doc(self, arquivo):
        if arquivo not in self._docs:
            self._docs[arquivo] = pymupdf.open(os.path.join(self.pdfs, os.path.basename(arquivo)))
        return self._docs[arquivo]


def arquivo_de(it, tipo):
    o = it['origem'].get(tipo) or {}
    return o.get('arquivo', it['origem']['arquivo'])


def vista(p):
    """O pacote com enunciado e solucao como itens separados, cada um com o seu PDF.

    As travas genericas do Portal leem o PDF de it['origem']['arquivo'] para os
    dois recortes; na Mirim a solucao vem de outro arquivo.
    """
    q = copy.copy(p)
    q.itens = []
    for it in p.itens:
        for tipo, suf in (('enunciado', '#e'), ('solucao', '#s')):
            if not it['assets'].get(tipo):
                continue
            j = copy.deepcopy(it)
            j['id'] = it['id'] + suf
            outro = 'solucao' if tipo == 'enunciado' else 'enunciado'
            j['assets'] = {tipo: it['assets'][tipo], outro: None}
            j['origem'] = {'arquivo': arquivo_de(it, tipo), tipo: it['origem'][tipo]}
            q.itens.append(j)
    return q


# ------------------------------------------------------------------ travas

def numeros_da_solucao(doc):
    """Os numeros de questao que o PDF da solucao escreve, por expressao propria (sem o detector)."""
    t = '\n'.join(pgn.get_text() for pgn in doc)
    ns = set(int(n) for n in QUESTAO.findall(t))
    ns |= set(int(n) for n in re.findall(r'(?m)^\s*(\d{1,2})\s*\.\s*ALTERNATIVA', t))
    return ns


def trava_contagens(p):
    erros = []
    serie = p.manifest['series'][0]
    for r in p.relatorio['provas']:
        excl = {e['numero']: e['motivo'] for e in r['excluidos']}
        if serie == '3em':
            esperado = set(range(136, 181))
        else:
            ns = numeros_da_solucao(p.doc(r['solucao'])) if r['solucao'] else set()
            esperado = set(range(1, max(ns | set(excl) | {0}) + 1))
        dentro = set(i['numero'] for i in p.itens if i['aula']['titulo'] == r['aula'])
        for n in sorted(esperado):
            if n in dentro and n in excl:
                erros.append('%s: questao %d no pacote E excluida' % (r['aula'], n))
            elif n not in dentro and not excl.get(n):
                erros.append('%s: questao %d nem no pacote nem excluida com motivo' % (r['aula'], n))
        for n in sorted(dentro - esperado):
            erros.append('%s: questao %d no pacote, e a prova vai de %s a %s' % (r['aula'], n, min(esperado), max(esperado)))
    if len(p.itens) != p.manifest['contagens']['itens']:
        erros.append('manifest.contagens.itens nao bate com itens.json')
    return erros[:12]


def trava_campos(p):
    erros = []
    serie = p.manifest['series'][0]
    col = provas.COLECOES.get(serie)
    if not col:
        return ['serie %r fora das colecoes de provas' % serie]
    temas = provas.carregar_temas()
    if col['equivalentes'] and p.manifest.get('series_equivalentes') != {serie: col['equivalentes']}:
        erros.append('manifest sem series_equivalentes de %s' % serie)
    for it in p.itens:
        eid = it['id']
        if col['fonte'] == 'enem':
            if not re.match(r'^enem:\d{4}:\d{3}$', eid):
                erros.append('%s: id fora do formato enem:<ano>:<numero>' % eid)
            if it['assets']['solucao'] is not None or not it.get('sem_solucao'):
                erros.append('%s: o ENEM nao tem solucao, e o item diz que tem' % eid)
        else:
            if not re.match(r'^mirim:\d{4}:(f\d:m\d|a):\d{1,2}$', eid):
                erros.append('%s: id fora do formato da Mirim' % eid)
            if not it['assets'].get('solucao') or not it['origem'].get('solucao', {}).get('arquivo'):
                erros.append('%s: sem solucao, ou sem origem.solucao.arquivo' % eid)
        if it['serie'] != serie or it.get('series_equivalentes') != col['equivalentes']:
            erros.append('%s: serie %r e equivalentes %r' % (eid, it['serie'], it.get('series_equivalentes')))
        if it['formato'] != 'objetiva' or it['alternativas'] != list('ABCDE') or not re.match(r'^[A-E]$', it['resposta'] or ''):
            erros.append('%s: objetiva sem A a E ou sem resposta' % eid)
        if it['dificuldade'] not in (1, 2, 3):
            erros.append('%s: dificuldade %r' % (eid, it['dificuldade']))
        for t in ('enunciado', 'solucao'):
            m = it['medidas'].get(t)
            if m and m.get('rotulo') is not None:
                erros.append('%s: rotulo no %s' % (eid, t))
        tid = it.get('tema_app')
        if tid is None:
            if it['modulo']['titulo'] != 'Diversos':
                erros.append('%s: sem assunto e fora de Diversos' % eid)
        elif tid not in temas or temas[tid]['serie'] not in col['temas']:
            erros.append('%s: assunto %s fora das series da colecao' % (eid, tid))
        elif it['modulo']['titulo'] != temas[tid]['titulo']:
            erros.append('%s: modulo %r e o assunto %s e %r' % (eid, it['modulo']['titulo'], tid, temas[tid]['titulo']))
        if not it['aula'].get('slug') or not it['aula'].get('titulo'):
            erros.append('%s: aula sem slug ou titulo' % eid)
    return erros[:12]


def trava_recorte(p):
    erros = []
    ocupado = collections.defaultdict(list)
    for it in p.itens:
        for tipo in ('enunciado', 'solucao'):
            ps = pg.pedacos(it, tipo)
            if not ps:
                continue
            arq = arquivo_de(it, tipo)
            doc = p.doc(arq)
            linha = pg.comeco_do_recorte(doc[ps[0]['pagina'] - 1], ps[0]['bbox'])
            if not re.match(r'^(QUEST[ÃA]O\s*)?%d(?!\d)' % it['numero'], linha.strip(), re.I):
                erros.append('%s %s: o recorte nao comeca pelo numero: %r' % (it['id'], tipo, linha[:40]))
            for pz in ps:
                x0, y0, x1, y1 = pz['bbox']
                if y1 - y0 < 8:
                    erros.append('%s %s: pedaco de %.1f pt na p%d' % (it['id'], tipo, y1 - y0, pz['pagina']))
                for a, dono in ocupado[(arq, pz['pagina'])]:
                    if min(x1, a[2]) - max(x0, a[0]) > 0.5 and min(y1, a[3]) - max(y0, a[1]) > 0.5:
                        erros.append('%s %s: sobrepoe o recorte de %s na p%d' % (it['id'], tipo, dono, pz['pagina']))
                ocupado[(arq, pz['pagina'])].append(((x0, y0, x1, y1), it['id']))
                corte = borda_corta_tinta(doc, pz)
                if corte:
                    erros.append('%s %s: tinta cortada na borda %s (p%d)' % (it['id'], tipo, corte, pz['pagina']))
    return erros[:12]


def linhas_no_retangulo(pgn, r):
    out = []
    for b in pgn.get_text('dict')['blocks']:
        if b['type'] != 0:
            continue
        for l in b['lines']:
            t = ''.join(s['text'] for s in l['spans']).strip()
            bb = l['bbox']
            if t and r.contains(pymupdf.Point((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2)):
                sp = next((s for s in l['spans'] if s['text'].strip()), l['spans'][0])
                neg = bool(sp['flags'] & 16) or 'Bold' in sp['font'] or 'Black' in sp['font']
                # "12" no span proprio em negrito e o texto depois (Nivel A de 2021)
                out.append((bb, sp['text'].strip() if neg and re.match(r'^\d{1,2}$', sp['text'].strip()) else t,
                            sp['size'], neg))
    return out


def trava_um_marcador(p):
    """O enunciado tem um numero de questao na margem, so no comeco do primeiro pedaco."""
    erros = []
    for it in p.itens:
        ps = pg.pedacos(it, 'enunciado')
        doc = p.doc(arquivo_de(it, 'enunciado'))
        achados = []
        for k, pz in enumerate(ps):
            r = pymupdf.Rect(pz['bbox'])
            ls = [x for x in linhas_no_retangulo(doc[pz['pagina'] - 1], r) if x[2] >= 9.5]
            # o marcador fica na margem do texto do pedaco (a linha mais a
            # esquerda); o enunciado que comeca por "3." numa linha quebrada fica
            # recuado (Nivel A de 2021, questao 13)
            margem = min([x[0][0] for x in ls] or [r.x0])
            for bb, t, tam, neg in ls:
                if QUESTAO.match(t):
                    # "QUESTAO N" nao se confunde com lista numerada: conta em
                    # qualquer lugar do recorte
                    achados.append((k, t[:20]))
                    continue
                if bb[0] > margem + 8 or it['id'].startswith('enem:'):
                    continue
                if re.match(r'^\d{1,2}\s*[.)](\s|$)', t) or (neg and re.match(r'^\d{1,2}$', t)):
                    achados.append((k, t[:20]))
        if len(achados) != 1 or achados[0][0] != 0:
            erros.append('%s: %d marcadores de questao no enunciado: %s' % (it['id'], len(achados), achados[:3]))
    return erros[:12]


def gabarito_em_ordem(doc):
    """{numero: letra ou None} lendo o texto do gabarito em ordem (numero, depois a letra)."""
    toks = [t.strip() for t in doc[0].get_text().split('\n') if t.strip()]
    out = {}
    for k, t in enumerate(toks):
        if re.match(r'^\d{2,3}$', t) and 91 <= int(t) <= 180:
            prox = toks[k + 1] if k + 1 < len(toks) else ''
            out[int(t)] = prox if re.match(r'^[A-E]$', prox) else None
    return out


def trava_resposta(p):
    erros = []
    serie = p.manifest['series'][0]
    if serie == '3em':
        gabs = {}
        for r in p.relatorio['provas']:
            gabs[r['chave']] = gabarito_em_ordem(p.doc(r['gabarito'])) if r['gabarito'] else {}
            for e in r['excluidos']:
                if 'anulada' in e['motivo'] and gabs[r['chave']].get(e['numero']):
                    erros.append('%s: excluida como anulada, e o gabarito da %s' % (e['id'], gabs[r['chave']][e['numero']]))
        for it in p.itens:
            g = gabs.get(it['id'].split(':')[1], {})
            if g.get(it['numero']) != it['resposta']:
                erros.append('%s: resposta %s, e o gabarito lido em ordem da %s' % (it['id'], it['resposta'], g.get(it['numero'])))
        return erros[:12]
    for it in p.itens:
        doc = p.doc(arquivo_de(it, 'solucao'))
        ps = pg.pedacos(it, 'solucao')
        t = ' '.join(doc[pz['pagina'] - 1].get_text('text', clip=pymupdf.Rect(pz['bbox'])) for pz in ps)
        m = LETRA.search(t)
        if not m or m.group(1).upper() != it['resposta']:
            erros.append('%s: resposta %s, e a solucao escreve %s' % (it['id'], it['resposta'], m.group(1) if m else 'nada'))
    return erros[:12]


def corridas(doc):
    """Linhas de cabecalho e rodape corrido, lidas da pagina (sem o detector): (pagina, bbox, texto)."""
    vistas = collections.defaultdict(list)
    for pno, pgn in enumerate(doc):
        H = pgn.rect.height
        for b in pgn.get_text('dict')['blocks']:
            if b['type'] != 0:
                continue
            for l in b['lines']:
                t = ''.join(s['text'] for s in l['spans']).strip()
                bb = l['bbox']
                # alternativa ("D) 8" na Mirim, "E 28" no ENEM) no pe de duas
                # paginas e conteudo, nao rodape
                if t and (bb[3] < H * 0.12 or bb[1] > H * 0.92) and not QUESTAO.match(t) \
                        and not re.match(r'^\d{1,2}\s*[.)]?\s', t + ' ') and not re.match(r'^\(?[A-E](\)|\s|$)', t):
                    vistas[(int(round(bb[1] / 3.0)), re.sub(r'\d+', '#', portal.para_busca(t)))].append((pno, bb, t))
    return [x for v in vistas.values() if len(set(pno for pno, _, _ in v)) >= 2 for x in v]


def trava_cabecalho(p):
    erros = []
    por_arq = collections.defaultdict(list)
    for it in p.itens:
        for tipo in ('enunciado', 'solucao'):
            for pz in pg.pedacos(it, tipo):
                por_arq[arquivo_de(it, tipo)].append((pz, it['id']))
    for arq, pzs in por_arq.items():
        for pno, bb, t in corridas(p.doc(arq)):
            c = pymupdf.Point((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2)
            for pz, iid in pzs:
                if pz['pagina'] == pno + 1 and pymupdf.Rect(pz['bbox']).contains(c):
                    erros.append('%s: cabecalho ou rodape corrido %r dentro do recorte (p%d)' % (iid, t[:30], pno + 1))
    return erros[:12]


FECHO = re.compile(r'^\s*(atividade extra|obrigad[oa] por participar)', re.I)


def trava_fecho(p):
    """Nenhum recorte de enunciado passa do fecho da prova ("Atividade Extra", "Obrigado por participar")."""
    erros = []
    fechos = {}
    for it in p.itens:
        arq = arquivo_de(it, 'enunciado')
        if arq not in fechos:
            fechos[arq] = None
            doc = p.doc(arq)
            for pno in range(doc.page_count):
                ys = [l['bbox'][1] for b in doc[pno].get_text('dict')['blocks'] if b['type'] == 0 for l in b['lines']
                      if FECHO.match(sem_acento(''.join(s['text'] for s in l['spans'])))]
                if ys:
                    fechos[arq] = (pno + 1, min(ys))
                    break
        f = fechos[arq]
        if not f:
            continue
        for pz in pg.pedacos(it, 'enunciado'):
            if pz['pagina'] > f[0] or (pz['pagina'] == f[0] and pz['bbox'][3] > f[1]):
                erros.append('%s: pedaco na p%d passa do fecho da prova (p%d)' % (it['id'], pz['pagina'], f[0]))
    return erros[:12]


def sem_acento(t):
    return portal.para_busca(t)


def trava_entre(p):
    """Nenhuma linha de texto entre duas questoes seguidas (mesma pagina e coluna) fica fora dos recortes."""
    erros = []
    grupos = collections.defaultdict(list)
    for it in p.itens:
        for tipo in ('enunciado', 'solucao'):
            if pg.pedacos(it, tipo):
                grupos[(arquivo_de(it, tipo), it['id'].rsplit(':', 1)[0], tipo)].append(it)
    for (arq, _, tipo), its in grupos.items():
        doc = p.doc(arq)
        its.sort(key=lambda i: i['numero'])
        for a, b in zip(its, its[1:]):
            if b['numero'] != a['numero'] + 1:
                continue
            fim, ini = pg.pedacos(a, tipo)[-1], pg.pedacos(b, tipo)[0]
            if fim['pagina'] != ini['pagina']:
                continue
            fa, ib = fim['bbox'], ini['bbox']
            if min(fa[2], ib[2]) - max(fa[0], ib[0]) < 20 or ib[1] <= fa[3]:
                continue
            vao = pymupdf.Rect(min(fa[0], ib[0]), fa[3], max(fa[2], ib[2]), ib[1])
            for bb, t, tam, neg in linhas_no_retangulo(doc[fim['pagina'] - 1], vao):
                if tam >= 6:
                    erros.append('%s: a linha %r fica entre a %d e a %d, fora dos dois recortes (p%d)' % (
                        a['id'], t[:30], a['numero'], b['numero'], fim['pagina']))
    return erros[:12]


# ------------------------------------------------------------------ amostra e venenos

def gerar_amostra(pdfs, serie, trabalho, curadoria, **kw):
    kw.setdefault('gerado_em', '2026-10-30T00:00:00-03:00')
    kw.setdefault('commit', 'amostra')
    pasta = os.path.join(pdfs, 'enem' if serie == '3em' else 'mirim')
    return provas.gerar(pasta, serie, 1, trabalho + '_zip', curadoria, trabalho=trabalho, **kw)


def pacote(trabalho, pdfs, serie):
    return PacoteProvas(trabalho, os.path.join(pdfs, 'enem' if serie == '3em' else 'mirim'))


def travas(p, placar, zip_caminho=None, rot=''):
    placar.conferir('provas%s: contagens' % rot, trava_contagens(p))
    placar.conferir('provas%s: campos' % rot, trava_campos(p))
    placar.conferir('provas%s: recorte' % rot, trava_recorte(p))
    placar.conferir('provas%s: um marcador por enunciado' % rot, trava_um_marcador(p))
    placar.conferir('provas%s: resposta' % rot, trava_resposta(p))
    placar.conferir('provas%s: nada entre duas questoes' % rot, trava_entre(p))
    placar.conferir('provas%s: cabecalho corrido fora' % rot, trava_cabecalho(p))
    placar.conferir('provas%s: nada depois do fecho da prova' % rot, trava_fecho(p))
    v = vista(p)
    placar.conferir('provas%s: svg autocontido' % rot, pg.trava_svg(v))
    placar.conferir('provas%s: svg bem formado' % rot, pg.trava_xml(p))
    placar.conferir('provas%s: manifesto' % rot, pg.trava_manifesto(p, zip_caminho))
    placar.conferir('provas%s: sem travessao' % rot, pg.trava_tracos(p))
    placar.conferir('provas%s: PyMuPDF no manifest' % rot, pg.trava_gerador_no_manifest(p))
    placar.conferir('provas%s: curadoria aplicada' % rot, pg.trava_curadoria(p))
    placar.conferir('provas%s: todo caractere com o seu glifo' % rot, pg.trava_glifos(v))


def amostra(temp, placar, navegador):
    pdfs = os.path.join(temp, 'pdfs')
    fazer_amostra_provas.fazer(pdfs)
    pdfs_b = os.path.join(temp, 'pdfs_b')
    fazer_amostra_provas.fazer(pdfs_b)
    cur = pg.curadoria_da_amostra(os.path.join(temp, 'curadoria'))
    feitos = {}
    for serie in ('m1', '3em'):
        a = os.path.join(temp, 'a_' + serie)
        gerar_amostra(pdfs, serie, a, cur)
        gerar_amostra(pdfs_b, serie, os.path.join(temp, 'b_' + serie), cur, gerado_em='2031-01-01T00:00:00-03:00',
                      commit='outro')
        p = pacote(a, pdfs, serie)
        feitos[serie] = p
        print('amostra %s: %d itens, %d excluidos' % (serie, len(p.itens), p.manifest['contagens']['itens_excluidos']))
        placar.conferir('provas %s: determinismo' % serie, pg.trava_determinismo(p, pacote(os.path.join(temp, 'b_' + serie), pdfs, serie)))
        travas(p, placar, rot=' ' + serie)
    # o que a amostra tem de mostrar, alem de passar
    m1, en = feitos['m1'], feitos['3em']
    placar.conferir('amostra m1: as quatro questoes entram', [] if sorted(i['numero'] for i in m1.itens) == [1, 2, 3, 4]
                    else ['entraram %s' % sorted(i['numero'] for i in m1.itens)])
    q3 = [i for i in m1.itens if i['numero'] == 3][0]
    placar.conferir('amostra m1: a questao 3 atravessa a pagina', [] if len(pg.pedacos(q3, 'enunciado')) == 2
                    else ['a questao 3 tem %d pedacos' % len(pg.pedacos(q3, 'enunciado'))])
    nums = sorted(i['numero'] for i in en.itens)
    exc = {e['numero']: e['motivo'] for e in en.relatorio['excluidos']}
    erros = []
    if nums != [136, 137, 140]:
        erros.append('entraram %s' % nums)
    if 'anulada' not in exc.get(138, ''):
        erros.append('a 138 nao saiu como anulada: %r' % exc.get(138))
    if 'divisa' not in exc.get(139, ''):
        erros.append('a 139 nao saiu pela divisa: %r' % exc.get(139))
    placar.conferir('amostra ENEM: 136, 137 e 140; 138 anulada; 139 na divisa', erros)
    venenos(temp, pdfs, cur, placar)
    if navegador:
        for serie, p in feitos.items():
            fidelidade(p, temp, placar, serie)


def com(attr, valor, fn):
    antes = getattr(provas, attr)
    setattr(provas, attr, valor)
    try:
        return fn()
    finally:
        setattr(provas, attr, antes)


def venenos(temp, pdfs, cur, placar):
    def gera(nome, serie):
        t = os.path.join(temp, 'v_' + nome)
        gerar_amostra(pdfs, serie, t, cur)
        return pacote(t, pdfs, serie)
    # sem a cadeia de tras, o "1." da capa vira a questao 1
    q = com('CADEIA_DE_TRAS', False, lambda: gera('cadeia', 'm1'))
    placar.conferir('instrucao da capa como questao', trava_um_marcador(q) + trava_recorte(q), True, 'marcador')
    # sem tirar o cabecalho corrido, a continuacao da questao 3 o leva junto
    q = com('TIRA_DECORACAO', False, lambda: gera('deco', 'm1'))
    placar.conferir('cabecalho corrido no recorte', trava_cabecalho(q), True, 'corrido')
    # sem o fio separador como fronteira, a figura da questao 2 (que sobe acima
    # do numero) e cortada entre a 1 e a 2. A conferencia de borda do proprio
    # gerador sai junto, senao ela tiraria a questao antes de a trava ver
    q = com('CONFERE_BORDA', False, lambda: com('TIRA_SEPARADOR', False, lambda: gera('fio', 'm1')))
    placar.conferir('fronteira na linha do numero', trava_recorte(q), True, 'tinta cortada')
    # a conferencia de borda do gerador e a rede: sem o fio, mas com ela, a
    # questao cortada sai com motivo em vez de entrar
    q = com('TIRA_SEPARADOR', False, lambda: gera('fio_rede', 'm1'))
    motivos = ' '.join(e['motivo'] for e in q.relatorio['excluidos'])
    placar.conferir('sem o fio, a borda do gerador tira a questao cortada',
                    [] if 'corta tinta na borda' in motivos else ['nada saiu pela borda: %r' % motivos[:80]])
    q = com('CONFERE_BORDA', False, lambda: com('TIRA_SEPARADOR', False, lambda: gera('fio_sem_rede', 'm1')))
    placar.conferir('sem o fio e sem a borda do gerador', [] if not any('corta tinta' in e['motivo'] for e in q.relatorio['excluidos'])
                    else ['saiu pela borda'], False)
    # sem conferir a divisa, a figura que cruza as colunas entra cortada
    q = com('CONFERE_BORDA', False, lambda: com('CONFERE_DIVISA', False, lambda: gera('divisa', '3em')))
    placar.conferir('figura que cruza a divisa', trava_recorte(q), True, 'tinta cortada')
    # sem o fecho, a ultima questao leva a atividade extra da ultima pagina
    q = com('FIM_DA_PROVA', False, lambda: gera('fecho', 'm1'))
    placar.conferir('ultima questao com a atividade extra', trava_fecho(q), True, 'passa do fecho')
    # resposta trocada
    q = pg.copia(pacote(os.path.join(temp, 'a_m1'), pdfs, 'm1'), temp, 'v_resp')
    q.__class__ = PacoteProvas
    q.itens[0]['resposta'] = 'E' if q.itens[0]['resposta'] != 'E' else 'A'
    placar.conferir('resposta trocada (Mirim)', trava_resposta(q), True, 'a solucao escreve')
    q = pg.copia(pacote(os.path.join(temp, 'a_3em'), pdfs, '3em'), temp, 'v_gab')
    q.__class__ = PacoteProvas
    q.itens[0]['resposta'] = 'E' if q.itens[0]['resposta'] != 'E' else 'A'
    placar.conferir('resposta trocada (ENEM)', trava_resposta(q), True, 'gabarito')
    # recorte encolhido: a ultima linha da questao 1 fica entre a 1 e a 2
    q = pg.copia(pacote(os.path.join(temp, 'a_m1'), pdfs, 'm1'), temp, 'v_encolhe')
    q.__class__ = PacoteProvas
    for i in q.itens:
        if i['numero'] == 1:
            b = i['origem']['enunciado']['bbox']
            i['origem']['enunciado']['bbox'] = [b[0], b[1], b[2], b[3] - 40]
    placar.conferir('recorte encolhido', trava_entre(q), True, 'fora dos dois recortes')
    # assunto de outra serie, e modulo que nao e o do assunto
    q = pg.copia(pacote(os.path.join(temp, 'a_m1'), pdfs, 'm1'), temp, 'v_campos')
    q.__class__ = PacoteProvas
    q.itens[0]['tema_app'] = 'MAT09-01'
    placar.conferir('assunto de outra serie', trava_campos(q), True, 'fora das series')
    # questao sumida do pacote e do relatorio
    q = pg.copia(pacote(os.path.join(temp, 'a_m1'), pdfs, 'm1'), temp, 'v_some')
    q.__class__ = PacoteProvas
    q.itens = [i for i in q.itens if i['numero'] != 2]
    placar.conferir('questao sumida', trava_contagens(q), True, 'nem no pacote')


def fidelidade(p, temp, placar, rot):
    v = vista(p)
    sorteio = pg.sortear_pedacos(v)
    erros, medidas = pg.trava_fidelidade(v, sorteio, temp)
    placar.conferir('provas %s: fidelidade (%d pedacos, semente %d)' % (rot, len(sorteio), pg.SEMENTE), erros)
    if medidas:
        fr = [m[0] for m in medidas]
        print('          fidelidade: media %.3f%%, pior %.3f%%' % (100 * sum(fr) / len(fr), 100 * max(fr)))


def principal():
    ap = argparse.ArgumentParser()
    ap.add_argument('--real', action='store_true')
    ap.add_argument('--serie')
    ap.add_argument('--pdfs')
    ap.add_argument('--trabalho')
    ap.add_argument('--trabalho2')
    ap.add_argument('--zip')
    ap.add_argument('--sem-navegador', action='store_true')
    a = ap.parse_args()
    placar = pg.Placar()
    temp = tempfile.mkdtemp(prefix='prova_provas_')
    try:
        if a.real:
            p = PacoteProvas(a.trabalho, a.pdfs)
            print('pacote real %s: %d itens, %d excluidos' % (a.serie, len(p.itens), p.manifest['contagens']['itens_excluidos']))
            placar.conferir('provas: determinismo', pg.trava_determinismo(p, PacoteProvas(a.trabalho2, a.pdfs)))
            travas(p, placar, a.zip)
            if not a.sem_navegador:
                fidelidade(p, temp, placar, a.serie)
        else:
            amostra(temp, placar, not a.sem_navegador)
    finally:
        shutil.rmtree(temp, ignore_errors=True)
    print('%d verificacoes passaram, %d falharam' % (placar.ok, placar.falhas))
    sys.exit(1 if placar.falhas else 0)


if __name__ == '__main__':
    principal()
