"""Provas do pacote do Banco de Questoes, com um veneno por trava.

    python biblioteca/_prova_banco.py
        amostra sintetica (o que roda no portao, sem o Drive): o volume de
        biblioteca/_amostra/fazer_amostra_banco.py, gerado DUAS vezes.

    python biblioteca/_prova_banco.py --real --pdfs <PDF/matematica> --nivel N --trabalho <A> --trabalho2 <B> [--zip <pacote.zip>]
        as mesmas travas sobre um pacote de verdade gerado duas vezes, mais as
        contagens medidas pela sonda da B2 (ESPEC_detector_banco.md).

    --sem-navegador pula a fidelidade (Chrome headless).

Travas proprias do Banco:
  contagens   por ano, enunciados 1..N; cada numero no pacote ou excluido com
              motivo; no real, igual a tabela medida pela sonda
  recorte     o primeiro pedaco comeca por "N " (lido pelos caracteres do PDF,
              sem o detector); nenhum pedaco menor que 8 pt; nenhum recorte
              sobrepondo outro; nenhuma borda cortando tinta
  campos      os da secao 8b do contrato: serie n<N>, series_equivalentes,
              modulo banco-<ano>, aula nivel-<N>, titulo, dificuldade = nivel,
              rotulo nulo
  tinta       todo texto de corpo normal com tinta, do nivel, esta num recorte,
              menos o enunciado repetido na secao de solucoes
e as genericas da prova do Portal (determinismo, svg, xml, manifesto, tracos,
PyMuPDF no manifest, fidelidade no Chrome).
"""
import argparse
import collections
import copy
import io
import json
import math
import os
import re
import shutil
import sys
import tempfile

import pymupdf

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import banco  # noqa: E402
import gerar_pacote  # noqa: E402
import portal  # noqa: E402
import _prova_gerador as pg  # noqa: E402

sys.path.insert(0, os.path.join(AQUI, '_amostra'))
import fazer_amostra_banco  # noqa: E402

# medido pela sonda da B2 (Biblioteca/b2_insumos/sonda_banco.py), independente do detector
ESPERADO = {1: {2016: 30, 2017: 30, 2018: 31, 2019: 30, 2020: 30},
            2: {2016: 31, 2017: 30, 2018: 35, 2019: 31, 2020: 31},
            3: {2016: 34, 2017: 35, 2018: 34, 2019: 42, 2020: 41}}


class PacoteBanco(pg.Pacote):
    """Pacote do Banco: os PDFs ficam em PDF/matematica e numa subpasta."""

    def doc(self, arquivo):
        if arquivo not in self._docs:
            rel = arquivo.split('PDF/matematica/', 1)[-1]
            self._docs[arquivo] = pymupdf.open(os.path.join(self.pdfs, *rel.split('/')))
        return self._docs[arquivo]


def trava_contagens(p, esperado=None):
    erros = []
    por_ano = collections.defaultdict(list)
    for i in p.itens:
        por_ano[int(i['modulo']['slug'].split('-')[1])].append(i['numero'])
    for a in p.relatorio['anos']:
        ne = a['enunciados']
        n = len(ne)
        if ne != list(range(1, n + 1)):
            erros.append('%d: enunciados fora de sequencia %s' % (a['ano'], ne))
        no = sorted(por_ano.get(a['ano'], []))
        ex = sorted(e['numero'] for e in a['excluidos'])
        if sorted(no + ex) != list(range(1, n + 1)):
            erros.append('%d: no pacote %s mais excluidos %s nao dao 1..%d' % (a['ano'], no, ex, n))
        if any(not e.get('motivo') for e in a['excluidos']):
            erros.append('%d: excluido sem motivo' % a['ano'])
        if esperado is not None and n != esperado.get(a['ano']):
            erros.append('%d: %d enunciados, e a sonda mediu %s' % (a['ano'], n, esperado.get(a['ano'])))
    c = p.manifest['contagens']
    if c['itens'] != len(p.itens) or c['itens_excluidos'] != sum(len(a['excluidos']) for a in p.relatorio['anos']):
        erros.append('manifest.contagens nao bate com itens.json e o relatorio')
    return erros


def trava_tudo_no_pacote(p):
    """Na amostra, os tres problemas do nivel 1 entram, todos (nada excluido)."""
    nums = sorted(i['numero'] for i in p.itens)
    if nums != [1, 2, 3]:
        return ['na amostra entraram %s (excluidos: %s)' % (
            nums, [(e['numero'], e['motivo'][:60]) for a in p.relatorio['anos'] for e in a['excluidos']])]
    return []


def trava_campos(p):
    erros = []
    serie = p.manifest['series'][0]
    nivel = int(serie[1:])
    if p.manifest.get('series_equivalentes') != banco.SERIES_EQUIVALENTES:
        erros.append('manifest sem series_equivalentes da secao 8b')
    for i in p.itens:
        ano = i['id'].split(':')[1]
        certo = {'serie': serie, 'series_equivalentes': banco.SERIES_EQUIVALENTES[serie], 'fonte': 'obmep-banco',
                 'modulo': {'slug': 'banco-%s' % ano, 'titulo': 'Banco de Questões %s' % ano},
                 'aula': {'slug': 'nivel-%d' % nivel, 'titulo': 'Nível %d' % nivel, 'n': nivel},
                 'formato': 'aberta', 'resposta': None, 'proxy': {'nivel': nivel}}
        for k, v in certo.items():
            if i.get(k) != v:
                erros.append('%s: %s = %r, e nao %r' % (i['id'], k, i.get(k), v))
        if not re.match(r'^banco:\d{4}:n%d:\d+$' % nivel, i['id']):
            erros.append('%s: id fora do contrato' % i['id'])
        if not i.get('titulo'):
            erros.append('%s: sem titulo' % i['id'])
        if i['dificuldade_origem'] == 'proxy' and i['dificuldade'] != nivel:
            erros.append('%s: dificuldade %s por proxy, e o nivel e %d' % (i['id'], i['dificuldade'], nivel))
        for t in ('enunciado', 'solucao'):
            if i['medidas'][t].get('rotulo') is not None:
                erros.append('%s: rotulo no %s (o Banco nao tem caixa segura de cobrir)' % (i['id'], t))
    return erros[:10]


def trava_recorte(p):
    erros = []
    ocupado = collections.defaultdict(list)
    for it in p.itens:
        doc = p.doc(it['origem']['arquivo'])
        for tipo in ('enunciado', 'solucao'):
            ps = pg.pedacos(it, tipo)
            # o numero e o comeco do titulo, sem espacos: o titulo pode comecar por
            # numero ("14 1.000 Relogios?", 2019), e "141.000" sozinho seria ambiguo
            # sem maiuscula nem acento: a fonte escreve o titulo do enunciado e o da
            # solucao com caixa diferente ("As cinco amigas" x "As Cinco Amigas", 2019)
            linha = re.sub(r'\s+', '', banco.norm(pg.comeco_do_recorte(doc[ps[0]['pagina'] - 1], ps[0]['bbox'])))
            inicio = '%d%s' % (it['numero'], re.sub(r'\s+', '', banco.norm(it['titulo']))[:6])
            if not linha.startswith(inicio):
                erros.append('%s %s: o recorte nao comeca por "%d %s": %r' % (
                    it['id'], tipo, it['numero'], it['titulo'][:12], linha[:40]))
            for pz in ps:
                x0, y0, x1, y1 = pz['bbox']
                if y1 - y0 < 8:
                    erros.append('%s %s: pedaco de %.1f pt na p%d (lasca de outra coisa)' % (it['id'], tipo, y1 - y0, pz['pagina']))
                chave = (it['origem']['arquivo'], pz['pagina'])
                for a, b, dono in ocupado[chave]:
                    if y0 < b - 0.01 and a < y1 - 0.01:
                        erros.append('%s %s: sobrepoe o recorte de %s' % (it['id'], tipo, dono))
                ocupado[chave].append((y0, y1, it['id']))
                corte = borda_corta_tinta(doc, pz)
                if corte:
                    erros.append('%s %s: tinta cortada na borda %s (p%d)' % (it['id'], tipo, corte, pz['pagina']))
    return erros[:10]


def borda_corta_tinta(doc, pz):
    """Tinta que atravessa a borda: escura no ultimo pixel de dentro e no primeiro de fora."""
    r = pymupdf.Rect(pz['bbox'])
    tmp = pymupdf.open()
    tmp.insert_pdf(doc, from_page=pz['pagina'] - 1, to_page=pz['pagina'] - 1)
    k = pg.DPI_FIDELIDADE / 72.0
    fora = r + (-2, -2, 2, 2)
    pix = tmp[0].get_pixmap(dpi=pg.DPI_FIDELIDADE, colorspace=pymupdf.csGRAY, clip=fora)
    tmp.close()
    w, h, s = pix.width, pix.height, pix.samples
    x0, y0 = int(round((r.x0 - fora.x0) * k)), int(round((r.y0 - fora.y0) * k))
    x1, y1 = int(round((r.x1 - fora.x0) * k)) - 1, int(round((r.y1 - fora.y0) * k)) - 1
    esc = lambda x, y: 0 <= x < w and 0 <= y < h and s[y * w + x] < 128
    lados = {'de cima': any(esc(x, y0) and esc(x, y0 - 1) for x in range(x0, x1 + 1)),
             'de baixo': any(esc(x, y1) and esc(x, y1 + 1) for x in range(x0, x1 + 1)),
             'esquerda': any(esc(x0, y) and esc(x0 - 1, y) for y in range(y0, y1 + 1)),
             'direita': any(esc(x1, y) and esc(x1 + 1, y) for y in range(y0, y1 + 1))}
    return ' e '.join(k for k, v in lados.items() if v)


def trava_tinta(p):
    """Todo texto de corpo normal com tinta, do nivel, esta num recorte.

    Le a pagina, e nao o detector: as secoes pelos titulos de 15 pt ou mais;
    na secao de solucoes, a PRIMEIRA vez que um numero aparece como cabecalho
    (13,2 pt) e o enunciado repetido, que fica de fora; a segunda e a solucao.
    """
    erros = []
    nivel = int(p.manifest['series'][0][1:])
    for a in p.relatorio['anos']:
        doc = p.doc('PDF/matematica/' + a['arquivo'])
        excl = {e['numero'] for e in a['excluidos']}
        rects = collections.defaultdict(list)
        for it in p.itens:
            if it['modulo']['slug'] == 'banco-%d' % a['ano']:
                for t in ('enunciado', 'solucao'):
                    for pz in pg.pedacos(it, t):
                        rects[pz['pagina']].append(pymupdf.Rect(pz['bbox']))
        secao, dono, vistos = None, None, collections.Counter()
        for pno in range(doc.page_count):
            linhas, tem_tinta = _linhas_banco(doc, pno)
            pe = banco.pe_util(doc[pno])
            for tam, cs, bruto in linhas:
                texto = portal.recompor(bruto).strip()
                n = banco.norm(texto)
                y = cs[0][3]
                if y < banco.TOPO_UTIL or y > pe:
                    continue
                if tam >= banco.CORPO_SECAO:
                    m = re.match(r'^(ENUNCIADOS E SOLUCOES DO )?NIVEL (\d)$', n)
                    if m:
                        secao = ('sol' if m.group(1) else 'enun', int(m.group(2)))
                        dono = None
                        continue
                    if n.startswith('INDICE'):
                        secao = None
                        continue
                if secao is None or secao[1] != nivel:
                    continue
                mm = re.match(r'^(\d+)\s', texto)
                if banco.CORPO_CAB[0] <= tam <= banco.CORPO_CAB[1] and mm:
                    num = int(mm.group(1))
                    if secao[0] == 'enun':
                        dono = num
                    else:
                        vistos[num] += 1
                        dono = num if vistos[num] == 2 else None
                if dono is None or dono in excl:
                    continue
                fora = [c for c in cs if not any(r.contains(pymupdf.Point(c[2], c[3])) for r in rects[pno + 1])]
                if [c for c in fora if tem_tinta(c[4], rects[pno + 1])]:
                    erros.append('%d p%d: linha fora de todo recorte, no problema %d: %r' % (a['ano'], pno + 1, dono, texto[:50]))
    return erros[:10]


def trava_fim_do_livro(p):
    """Nenhum pedaco passa do fim do conteudo do livro.

    Le a pagina, e nao o detector: o fim e o primeiro titulo de 15 pt ou mais
    que comeca por "INDICE" ou e "ERRATA" (indice de problemas em 2016 e 2017,
    indice remissivo e errata de 2018 a 2020). Nenhum pedaco fica numa pagina
    depois dele, nem abaixo dele na mesma pagina.
    """
    erros = []
    for a in p.relatorio['anos']:
        doc = p.doc('PDF/matematica/' + a['arquivo'])
        fim = None
        for pno in range(doc.page_count):
            for tam, cs, bruto in _linhas_banco(doc, pno)[0]:
                n = banco.norm(portal.recompor(bruto).strip())
                if tam >= banco.CORPO_SECAO and (n.startswith('INDICE') or n == 'ERRATA') and cs[0][3] > banco.TOPO_UTIL:
                    fim = (pno + 1, min(c[4][1] for c in cs))
                    break
            if fim:
                break
        if not fim:
            continue
        for it in p.itens:
            if it['modulo']['slug'] != 'banco-%d' % a['ano']:
                continue
            for t in ('enunciado', 'solucao'):
                for pz in pg.pedacos(it, t):
                    if pz['pagina'] > fim[0] or (pz['pagina'] == fim[0] and pz['bbox'][3] > fim[1]):
                        erros.append('%s %s: pedaco na p%d passa do fim do conteudo (p%d)' % (it['id'], t, pz['pagina'], fim[0]))
    return erros


def _linhas_banco(doc, pno):
    """Linhas de texto de corpo normal da pagina (uma coluna), com o corpo e o teste de tinta."""
    import numpy as np
    pgn = doc[pno]
    tmp = pymupdf.open()
    tmp.insert_pdf(doc, from_page=pno, to_page=pno)
    pix = tmp[0].get_pixmap(dpi=100, colorspace=pymupdf.csGRAY)
    tmp.close()
    arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width)
    k = 100 / 72.0

    def tem_tinta(bb, fora_de=()):
        """Tinta na caixa do glifo, so nos pixels fora dos retangulos (ver _prova_gerador)."""
        ya, xa = max(0, int(bb[1] * k)), max(0, int(bb[0] * k))
        sub = arr[ya:int(bb[3] * k) + 1, xa:int(bb[2] * k) + 1] < pg.LIMIAR_TINTA_PROVA
        for r in fora_de:
            y0, y1 = max(0, int(math.ceil(r.y0 * k - 0.5)) - ya), int(r.y1 * k - 0.5) + 1 - ya
            x0, x1 = max(0, int(math.ceil(r.x0 * k - 0.5)) - xa), int(r.x1 * k - 0.5) + 1 - xa
            if y1 > 0 and x1 > 0:
                sub[max(0, y0):y1, max(0, x0):x1] = False
        return bool(sub.any())

    out = []
    for b in pgn.get_text('rawdict')['blocks']:
        if b['type'] != 0:
            continue
        for l in b['lines']:
            # o texto leva os espacos (o cabecalho e "1 O cachorro", a secao e
            # "ENUNCIADOS E SOLUCOES"); a tinta so se confere nos caracteres visiveis
            todos = sorted((c['bbox'][0], c['c'], (c['bbox'][0] + c['bbox'][2]) / 2, (c['bbox'][1] + c['bbox'][3]) / 2,
                            tuple(c['bbox'])) for sp in l['spans'] if sp['size'] > 8.5 for c in sp['chars'])
            cs = [c for c in todos if c[1].strip()]
            if cs:
                out.append((max(sp['size'] for sp in l['spans']), cs, ''.join(c[1] for c in todos)))
    out.sort(key=lambda t: t[1][0][3])
    return out, tem_tinta


def gerar_amostra(pdfs, trabalho, curadoria, **kw):
    kw.setdefault('gerado_em', '2026-09-22T00:00:00-03:00')
    kw.setdefault('commit', 'amostra')
    arquivos = {2099: os.path.join(pdfs, 'banco-de-questoes-2099.pdf')}
    return banco.gerar(pdfs, 1, 1, trabalho + '_zip', curadoria, trabalho=trabalho, arquivos=arquivos, **kw)


def travas(p, placar, zip_caminho=None, esperado=None, amostra=False):
    placar.conferir('banco: contagens', trava_contagens(p, esperado))
    if amostra:
        placar.conferir('banco: todos na amostra', trava_tudo_no_pacote(p))
    placar.conferir('banco: campos da secao 8b', trava_campos(p))
    placar.conferir('banco: recorte', trava_recorte(p))
    placar.conferir('banco: nenhum texto fora de recorte', trava_tinta(p))
    placar.conferir('banco: svg autocontido', pg.trava_svg(p))
    placar.conferir('banco: svg bem formado', pg.trava_xml(p))
    placar.conferir('banco: manifesto', pg.trava_manifesto(p, zip_caminho))
    placar.conferir('banco: sem travessao', pg.trava_tracos(p))
    placar.conferir('banco: PyMuPDF no manifest', pg.trava_gerador_no_manifest(p))
    placar.conferir('banco: curadoria aplicada', pg.trava_curadoria(p))
    placar.conferir('banco: todo caractere com o seu glifo', pg.trava_glifos(p))
    placar.conferir('banco: nada depois do fim do conteudo', trava_fim_do_livro(p))


def venenos(p, temp, placar, cur):
    for nome, attr, valor in (('cabecalho quebrado sem juntar', 'JUNTA_CABECALHO', False),
                              ('sufixo Solucao esquecido', 'SEGUNDA_E_SOLUCAO', False)):
        antes = getattr(banco, attr)
        setattr(banco, attr, valor)
        try:
            gerar_amostra(p.pdfs, os.path.join(temp, 'v_' + attr.lower()), cur)
        finally:
            setattr(banco, attr, antes)
        placar.conferir(nome, trava_tudo_no_pacote(PacoteBanco(os.path.join(temp, 'v_' + attr.lower()), p.pdfs)),
                        True, 'entraram')
    # sem o indice remissivo como fim, a ultima solucao vai ate o fim do livro
    antes = banco.FIM_REMISSIVO
    banco.FIM_REMISSIVO = False
    try:
        gerar_amostra(p.pdfs, os.path.join(temp, 'v_remissivo'), cur)
    finally:
        banco.FIM_REMISSIVO = antes
    placar.conferir('ultima solucao com o indice remissivo', trava_fim_do_livro(PacoteBanco(os.path.join(temp, 'v_remissivo'), p.pdfs)),
                    True, 'passa do fim do conteudo')
    # a fronteira no topo do texto, e nao da caixa do numero: sobra uma lasca
    antes = banco.ACIMA_DO_CAB
    banco.ACIMA_DO_CAB = 0.0
    try:
        gerar_amostra(p.pdfs, os.path.join(temp, 'v_acima'), cur)
    finally:
        banco.ACIMA_DO_CAB = antes
    q = PacoteBanco(os.path.join(temp, 'v_acima'), p.pdfs)
    placar.conferir('caixa do numero cortada', trava_recorte(q), True, 'tinta cortada')
    # titulo trocado por outro problema: tem de sair
    antes = banco.titulos_conferem
    banco.titulos_conferem = lambda a, b: banco.norm(a) == banco.norm(b)
    try:
        gerar_amostra(p.pdfs, os.path.join(temp, 'v_titulo'), cur)
    finally:
        banco.titulos_conferem = antes
    placar.conferir('titulo com erro de digitacao sem tolerancia',
                    trava_tudo_no_pacote(PacoteBanco(os.path.join(temp, 'v_titulo'), p.pdfs)), True, 'entraram')
    if banco.titulos_conferem('O cachorro e o gato', 'Caixas e mentiras'):
        placar.conferir('titulo de outro problema aceito', ['a tolerancia aceitou um titulo de outro problema'])
    # recorte encolhido: a linha de baixo da solucao 1 fica de fora
    q = pg.copia(p, temp, 'v_encolhe')
    q.__class__ = PacoteBanco
    for i in q.itens:
        if i['numero'] == 1:
            b = i['origem']['solucao']['bbox']
            i['origem']['solucao']['bbox'] = [b[0], b[1], b[2], b[3] - 16]
    placar.conferir('recorte encolhido', trava_tinta(q), True, 'fora de todo recorte')
    # campos: aula nula e rotulo preenchido
    q = pg.copia(p, temp, 'v_campos')
    q.itens[0]['aula'] = None
    q.itens[1]['medidas']['enunciado']['rotulo'] = [0, 0, 10, 10]
    placar.conferir('campos fora da secao 8b', trava_campos(q), True, 'aula')
    # contagem: o ultimo problema some do pacote e do relatorio
    q = pg.copia(p, temp, 'v_some')
    q.itens = [i for i in q.itens if i['numero'] != 3]
    placar.conferir('problema sumido', trava_contagens(q), True, 'nao dao')


def principal():
    ap = argparse.ArgumentParser()
    ap.add_argument('--real', action='store_true')
    ap.add_argument('--pdfs')
    ap.add_argument('--nivel', type=int)
    ap.add_argument('--trabalho')
    ap.add_argument('--trabalho2')
    ap.add_argument('--zip')
    ap.add_argument('--sem-navegador', action='store_true')
    a = ap.parse_args()
    placar = pg.Placar()
    temp = tempfile.mkdtemp(prefix='prova_banco_')
    try:
        if a.real:
            p = PacoteBanco(a.trabalho, a.pdfs)
            print('pacote real: %d itens, %d excluidos' % (len(p.itens), p.manifest['contagens']['itens_excluidos']))
            placar.conferir('banco: determinismo', pg.trava_determinismo(p, PacoteBanco(a.trabalho2, a.pdfs)))
            travas(p, placar, a.zip, ESPERADO[a.nivel])
        else:
            pdfs = os.path.join(temp, 'pdfs')
            fazer_amostra_banco.fazer(pdfs)
            cur = pg.curadoria_da_amostra(os.path.join(temp, 'curadoria'))
            gerar_amostra(pdfs, os.path.join(temp, 'a'), cur)
            pdfs_b = os.path.join(temp, 'pdfs_b')
            fazer_amostra_banco.fazer(pdfs_b)
            gerar_amostra(pdfs_b, os.path.join(temp, 'b'), cur, gerado_em='2031-01-01T00:00:00-03:00', commit='outro')
            p = PacoteBanco(os.path.join(temp, 'a'), pdfs)
            print('amostra do banco: %d itens' % len(p.itens))
            placar.conferir('banco: determinismo', pg.trava_determinismo(p, PacoteBanco(os.path.join(temp, 'b'), pdfs)))
            travas(p, placar, None, None, amostra=True)
            venenos(p, temp, placar, cur)
        if not a.sem_navegador:
            sorteio = pg.sortear_pedacos(p)
            erros, medidas = pg.trava_fidelidade(p, sorteio, temp)
            placar.conferir('banco: fidelidade (%d pedacos, semente %d)' % (len(sorteio), pg.SEMENTE), erros)
            if medidas:
                fr = [m[0] for m in medidas]
                print('          fidelidade: media %.3f%%, pior %.3f%%' % (100 * sum(fr) / len(fr), 100 * max(fr)))
    finally:
        shutil.rmtree(temp, ignore_errors=True)
    print('%d verificacoes passaram, %d falharam' % (placar.ok, placar.falhas))
    sys.exit(1 if placar.falhas else 0)


if __name__ == '__main__':
    principal()
