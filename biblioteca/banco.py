"""Gera o pacote de biblioteca do Banco de Questoes da OBMEP, por nivel.

    python biblioteca/banco.py --pdfs <PDF/matematica> --nivel 1 --versao 1
        --saida <Biblioteca/pacotes> --curadoria <Biblioteca/curadoria>
        [--anos 2016-2020] [--trabalho <pasta>] [--gerado-em ...] [--commit ...]

Saida: <saida>/matematica-obmep-banco-n<N>-v<versao>.zip, no formato do
CONTRATO_pacote_biblioteca.md, esquema 1, com a secao 8b (o Banco nao tem
serie, modulo nem aula: serie "n<N>" com series_equivalentes, modulo
"banco-<ano>", aula "nivel-<N>").

So o modelo A de pagina, o dos volumes de 2016 a 2020 (medido pela B2, ver
Biblioteca/ESPEC_detector_banco.md): uma coluna, margem que alterna entre
paginas pares e impares, cabecalho do problema "N Titulo" em negrito de 13,2 pt,
secoes "Nivel N" (enunciados) e "Enunciados e Solucoes do Nivel N" (o
enunciado repetido e "N Titulo - Solucao"). De 2011 a 2015 sao quatro modelos
diferentes; ficam para uma versao seguinte.
"""
import argparse
import collections
import datetime
import glob
import json
import math
import os
import re
import sys
import time
import unicodedata

import pymupdf

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import gerar_pacote  # noqa: E402
import portal  # noqa: E402

TOPO_UTIL = 55.0          # abaixo do cabecalho corrido (y ~ 39)
RODAPE = 725.0            # pe util quando a pagina nao tem a linha do rodape (ver pe_util)
CORPO_SECAO = 15.0        # titulos de secao em 15,8 pt
CORPO_CAB = (12.5, 14.5)  # cabecalho de problema em 13,2 pt
ENTRE_LINHAS_CAB = 20.0   # a segunda linha do cabecalho quebrado vem ate 20 pt abaixo
ACIMA_DO_CAB = 3.0        # a caixa do numero sobe ~2 pt acima do texto do cabecalho
FOLGA = 3.0
ALTURA_MIN = 9.0
ANOS_MODELO_A = (2016, 2017, 2018, 2019, 2020)
SERIES_EQUIVALENTES = {'n1': ['6ano', '7ano'], 'n2': ['8ano', '9ano'], 'n3': ['1em', '2em', '3em']}

FONTE = {
    'id': 'obmep-banco',
    'nome': 'Banco de Questões da OBMEP',
    'url': 'https://www.obmep.org.br/banco.htm',
    'licenca': 'material de distribuição gratuita para uso educacional; conteúdo do IMPA/OBMEP',
}

# regras do detector que a prova desliga uma a uma (venenos)
JUNTA_CABECALHO = True
SEGUNDA_E_SOLUCAO = True


FIM_REMISSIVO = True  # indice remissivo e errata fecham o conteudo (marcos); False so no veneno


def pe_util(pg):
    """Fim util da pagina: 3 pt acima da linha "www.obmep.org.br" do rodape.

    Medido, e nao fixo: o volume de 2016 e A4 (595 x 842) com o rodape em
    y 794,7; os de 2017 a 2020 tem o rodape em 732,4. Com o limite fixo de 725,
    as ultimas linhas das paginas de 2016 saiam cortadas.
    """
    alto = pg.rect.height * 0.8
    pe = None
    for b in pg.get_text('dict')['blocks']:
        if b['type'] != 0:
            continue
        for l in b['lines']:
            if l['bbox'][1] > alto and 'obmep.org' in ''.join(s['text'] for s in l['spans']):
                pe = l['bbox'][1] - 3.0
    if pe is None:
        return RODAPE
    # o fio do rodape fica uns 5 pt acima do texto dele (y 727 contra 732 em 2017),
    # e numa pagina em branco virava um pedaco de 5 pt
    # colado ao texto do rodape: as linhas de um quadriculado largo no pe da pagina
    # (2020, p. 17) tambem tem mais de 300 pt e eram tomadas pelo fio
    fios = [d['rect'].y0 for d in pg.get_drawings() if d['rect'].width > 300 and d['rect'].height < 1.5
            and pe - 10 < d['rect'].y0 <= pe + 3]
    return min([pe] + [y - 1.5 for y in fios])


def norm(t):
    t = unicodedata.normalize('NFD', t)
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    return re.sub(r'\s+', ' ', t).strip().upper()


def negrito(sp):
    return bool(sp['flags'] & 16) or 'Bold' in sp['font']


def arquivos_do_banco(base, anos):
    """{ano: caminho} dos volumes, em PDF/matematica e em PDF/matematica/obmep-banco-de-questoes."""
    out = {}
    for f in glob.glob(os.path.join(base, '*banco-de-questoes-20*.pdf')) + \
            glob.glob(os.path.join(base, 'obmep-banco-de-questoes', '*.pdf')):
        m = re.search(r'(20\d\d)\.pdf$', f)
        if m and int(m.group(1)) in anos:
            out[int(m.group(1))] = f
    return dict(sorted(out.items()))


# ------------------------------------------------------------------ detector

def _linhas(pg):
    out = []
    for b in pg.get_text('dict')['blocks']:
        if b['type'] != 0:
            continue
        for l in b['lines']:
            t = ''.join(s['text'] for s in l['spans']).strip()
            if t:
                sp = l['spans'][0]
                out.append({'bb': tuple(l['bbox']), 'texto': t, 'tam': sp['size'], 'neg': negrito(sp)})
    return out


def _eh_cab(l):
    return l['neg'] and CORPO_CAB[0] <= l['tam'] <= CORPO_CAB[1]


def _juntar(partes):
    s = partes[0]
    for p in partes[1:]:
        s = s[:-1] + p if s.endswith('-') else s + ' ' + p
    return re.sub(r'\s+', ' ', s).strip()


SOLUCAO_FIM = re.compile(r'\s*[–—-]\s*Solu[cç][aã]o\s*$')


def marcos(doc):
    """Secoes e cabecalhos, em ordem de leitura: (pagina, y0, tipo, dados)."""
    out = []
    for i, pg in enumerate(doc):
        ls = _linhas(pg)
        pe = pe_util(pg)
        k = 0
        while k < len(ls):
            l = ls[k]
            y0 = l['bb'][1]
            if y0 < TOPO_UTIL or y0 > pe:
                k += 1
                continue
            n = norm(l['texto'])
            if l['tam'] >= CORPO_SECAO:
                m = re.match(r'^(ENUNCIADOS E SOLUCOES DO )?NIVEL (\d)$', n)
                # titulo de secao abre pagina (os 33 dos cinco volumes, medido): corta no
                # topo dela, senao a moldura decorativa acima do titulo virava pedaco do
                # ultimo problema do nivel anterior. Se houver corpo de texto acima
                # dele na pagina, corta logo acima do titulo
                corpo_acima = any(TOPO_UTIL < o['bb'][1] < y0 - 3 and o['tam'] < CORPO_CAB[0] for o in ls)
                corte = y0 - ACIMA_DO_CAB if corpo_acima else TOPO_UTIL - 1
                if m:
                    out.append((i, corte, 'secao', {'tipo': 'sol' if m.group(1) else 'enun', 'nivel': int(m.group(2))}))
                    k += 1
                    continue
                # fim do conteudo: o indice de problemas (2016 e 2017) ou o indice
                # remissivo e a errata (2018 a 2020), sem o que a ultima solucao do
                # nivel 3 ia ate o fim do livro
                if n.startswith('INDICE DE PROBLEMAS') or (FIM_REMISSIVO and (n.startswith('INDICE REMISSIVO') or n == 'ERRATA')):
                    out.append((i, corte, 'fim', {}))
                    k += 1
                    continue
            if _eh_cab(l) and re.match(r'^\d+\s', l['texto']):
                partes, j = [l['texto']], k + 1
                # cabecalho quebrado em ate duas linhas, as vezes em outro bloco e com
                # hifen ("- So-" / "lucao"): 2017 N2 #26 e #29, N3 #17; 2018 N1 #13
                while (JUNTA_CABECALHO and j < len(ls) and _eh_cab(ls[j])
                       and -4 <= ls[j]['bb'][1] - ls[j - 1]['bb'][3] < ENTRE_LINHAS_CAB
                       and not re.match(r'^\d+\s', ls[j]['texto'])):
                    partes.append(ls[j]['texto'])
                    j += 1
                m = re.match(r'^(\d+)\s+(.*)$', _juntar(partes))
                titulo = m.group(2)
                sol = bool(SOLUCAO_FIM.search(titulo))
                # a fronteira sobe ACIMA_DO_CAB: o numero vem numa caixa cinza com borda,
                # e a borda de cima fica ~2 pt acima do texto (2017, p. 13). Sem isto, a
                # borda caia no fim do problema anterior, como um pedaco de 5 pt
                out.append((i, y0 - ACIMA_DO_CAB, 'cab', {'numero': int(m.group(1)), 'titulo': SOLUCAO_FIM.sub('', titulo),
                                           'solucao': sol, 'bb': l['bb']}))
                k = j
                continue
            k += 1
    return out


def distancia(a, b):
    ant = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(ant[j] + 1, cur[j - 1] + 1, ant[j - 1] + (ca != cb)))
        ant = cur
    return ant[-1]


def titulos_conferem(a, b):
    """Iguais, ou erro de digitacao da fonte (2019: "do/de M. A. Luco", "2.019", "Llago")."""
    a, b = norm(a), norm(b)
    return a == b or (distancia(a, b) <= 3 and abs(len(a.split()) - len(b.split())) <= 1)


def trechos(doc, nivel):
    """Enunciado e solucao de cada problema do nivel, como trechos (pagina, y inicio, pagina, y fim)."""
    ms = marcos(doc)
    fim_doc = (doc.page_count - 1, pe_util(doc[doc.page_count - 1]) + 1)
    secao = None
    enun, sol, vistas = {}, {}, {}
    reprovados, anomalias = [], []
    for k, (p, y, tipo, d) in enumerate(ms):
        if tipo == 'secao':
            secao = d
            continue
        if tipo != 'cab' or secao is None or secao['nivel'] != nivel:
            continue
        prox = next(((q, yq) for q, yq, t, _ in ms[k + 1:] if t in ('cab', 'secao', 'fim')), fim_doc)
        reg = {'titulo': d['titulo'], 'ini': (p, y), 'fim': prox}
        n = d['numero']
        if secao['tipo'] == 'enun':
            if d['solucao']:
                reprovados.append((n, 'cabecalho de solucao na secao de enunciados'))
            elif n in enun:
                reprovados.append((n, 'numero %d repetido nos enunciados' % n))
            else:
                enun[n] = reg
            continue
        # na secao de solucoes cada numero vem duas vezes: o enunciado repetido e a
        # solucao. A fonte as vezes esquece o " - Solucao" (2018 N1 #13): a SEGUNDA
        # ocorrencia e a solucao, o titulo tem de conferir, e a terceira reprova
        vistas[n] = vistas.get(n, 0) + 1
        if vistas[n] > 2:
            reprovados.append((n, 'numero %d aparece mais de duas vezes na secao de solucoes' % n))
            continue
        if not (d['solucao'] or (SEGUNDA_E_SOLUCAO and vistas[n] == 2)):
            continue
        if n in sol:
            reprovados.append((n, 'numero %d repetido nas solucoes' % n))
            continue
        if not d['solucao']:
            anomalias.append({'numero': n, 'nota': 'cabecalho da solucao sem o sufixo "Solucao" na fonte'})
        sol[n] = reg
    return enun, sol, reprovados, anomalias


# ------------------------------------------------------------------ recorte

def caixa_pela_tinta(doc, pno, y0, y1, cache):
    """Retangulo apertado pela tinta da pagina entre y0 e y1 (mais os objetos claros), com folga."""
    import numpy as np
    if pno not in cache:
        tmp = pymupdf.open()
        tmp.insert_pdf(doc, from_page=pno, to_page=pno)
        pix = tmp[0].get_pixmap(dpi=72, colorspace=pymupdf.csGRAY)
        tmp.close()
        tinta = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width) < gerar_pacote.LIMIAR_TINTA
        cache[pno] = (tinta, gerar_pacote.objetos_claros(doc[pno]))
    tinta, claros = cache[pno]
    h, w = tinta.shape
    ya, yb = max(int(TOPO_UTIL) - 2, int(math.floor(y0))), min(int(pe_util(doc[pno])), int(math.ceil(y1)), h)
    faixa = tinta[ya:yb]
    linhas = [ya + int(y) for y in np.nonzero(faixa.any(axis=1))[0]]
    xs = np.nonzero(faixa.any(axis=0))[0]
    colunas = [int(xs[0]), int(xs[-1])] if len(xs) else []
    for cy0, cy1, cx in claros:
        if cy0 >= ya and cy1 <= yb:
            linhas.extend((int(cy0), int(math.ceil(cy1))))
            colunas.append(int(cx))
    if not linhas:
        return None
    # dentro da pagina: o pixmap arredonda a largura para cima (581,1 pt viram 582 px)
    x0 = max(0.0, math.floor(min(colunas) - FOLGA))
    x1 = min(math.floor(doc[pno].rect.width), math.ceil(max(colunas) + 1 + FOLGA))
    top = max(math.floor(y0), math.floor(min(linhas) - FOLGA))
    bot = min(math.floor(y1), math.ceil(max(linhas) + 1 + FOLGA))
    return (float(x0), float(top), float(x1), float(bot))


def pedacos(doc, trecho, cache):
    (p0, y0), (p1, y1) = trecho['ini'], trecho['fim']
    out = []
    for p in range(p0, p1 + 1):
        a = y0 if p == p0 else TOPO_UTIL
        b = (y1 - 0.5) if p == p1 else pe_util(doc[p])
        if b - a < 2:
            continue
        r = caixa_pela_tinta(doc, p, a, b, cache)
        if r and r[3] - r[1] >= 2:
            out.append({'pno': p, 'rect': r})
    return out


def primeira_linha(doc, pz):
    """Texto da linha mais alta do recorte, pela ordem de leitura do PDF."""
    ws = doc[pz['pno']].get_text('words', clip=pymupdf.Rect(pz['rect']))
    if not ws:
        return ''
    topo = min(ws, key=lambda w: (w[1], w[0]))
    cy = (topo[1] + topo[3]) / 2.0
    return ' '.join(w[4] for w in sorted([w for w in ws if abs((w[1] + w[3]) / 2.0 - cy) < 4], key=lambda w: w[0]))


# ------------------------------------------------------------------ pacote

def gerar(base, nivel, versao, saida, curadoria, anos=ANOS_MODELO_A, trabalho=None, gerado_em=None,
          commit=None, gravar_zip=True, arquivos=None):
    t_ini = time.time()
    serie = 'n%d' % nivel
    nome = 'matematica-obmep-banco-%s' % serie
    trabalho = trabalho or os.path.join(os.path.dirname(os.path.abspath(saida)), 'trabalho', '%s-v%d' % (nome, versao))
    arquivos = arquivos or arquivos_do_banco(base, anos)
    dif_cur, apelidos, excl_cur = gerar_pacote.ler_curadoria(curadoria)
    conteudo, itens, docs_busca = {}, [], []
    relatorio = {'pacote': nome, 'versao': versao, 'serie': serie, 'pymupdf': portal.versao_pymupdf(),
                 'anos': [], 'excluidos': [], 'fora_desta_versao': [
                     {'anos': '2011 a 2015', 'motivo': 'quatro modelos de pagina diferentes do de 2016 a 2020; '
                                                       'cada um pede detector, prova e veneno proprios'},
                     {'anos': '2006 a 2010', 'motivo': 'volumes escaneados (texto por OCR sobre imagem)'}]}
    for ano, caminho in arquivos.items():
        t0 = time.time()
        doc = pymupdf.open(caminho)
        rel_arq = os.path.relpath(caminho, base).replace(os.sep, '/')
        enun, sol, reprovados, anomalias = trechos(doc, nivel)
        rel = {'ano': ano, 'arquivo': rel_arq, 'enunciados': sorted(enun), 'solucoes': sorted(sol),
               'excluidos': [], 'notas': anomalias}
        relatorio['anos'].append(rel)
        modulo = {'slug': 'banco-%d' % ano, 'titulo': 'Banco de Questões %d' % ano}
        aula = {'slug': 'nivel-%d' % nivel, 'titulo': 'Nível %d' % nivel, 'n': nivel}
        cache = {}
        motivo_de = dict(reprovados)
        titulos = []
        for n in sorted(enun):
            iid = 'banco:%d:%s:%d' % (ano, serie, n)
            e, s = enun[n], sol.get(n)
            motivo = None
            if iid in excl_cur:
                motivo = 'curadoria: ' + excl_cur[iid]
            elif n in motivo_de:
                motivo = motivo_de[n]
            elif s is None:
                motivo = 'sem solucao na secao Enunciados e Solucoes do Nivel %d' % nivel
            elif not titulos_conferem(e['titulo'], s['titulo']):
                motivo = 'titulo do enunciado e da solucao nao conferem: %r x %r' % (e['titulo'], s['titulo'])
            p_e = pedacos(doc, e, cache) if not motivo else []
            p_s = pedacos(doc, s, cache) if not motivo else []
            if not motivo and (not p_e or not p_s):
                motivo = 'recorte vazio'
            if not motivo:
                for tipo, ps in (('enunciado', p_e), ('solucao', p_s)):
                    lin = primeira_linha(doc, ps[0])
                    if not re.match(r'^%d\s' % n, lin):
                        motivo = 'o recorte do %s nao comeca por "%d ": %r' % (tipo, n, lin[:40])
                    elif sum(p['rect'][3] - p['rect'][1] for p in ps) < ALTURA_MIN:
                        motivo = '%s com menos de %g pt de altura' % (tipo, ALTURA_MIN)
            if motivo:
                rel['excluidos'].append({'id': iid, 'numero': n, 'motivo': motivo})
                continue
            base_a = 'assets/%s/%s/%s/ex-%02d' % (serie, modulo['slug'], aula['slug'], n)
            assets, medidas, origem, falhou = {}, {}, {}, None
            for tipo, ps, suf in (('enunciado', p_e, '.svg'), ('solucao', p_s, '-sol.svg')):
                svgs, meds = [], []
                for p in ps:
                    svg, dif, obs = gerar_pacote.svg_redigido(doc, p['pno'], p['rect'])
                    if dif > gerar_pacote.LIMITE_REDACAO:
                        falhou = '%s: apagar o de fora mudou %.2f%% dos pixels do recorte' % (tipo, 100 * dif)
                    if obs:
                        rel['notas'].append({'id': iid, 'nota': '%s p%d: %s' % (tipo, p['pno'] + 1, obs)})
                    svgs.append(svg)
                    meds.append((p['rect'][2] - p['rect'][0], p['rect'][3] - p['rect'][1]))
                svg, (w, h) = gerar_pacote.empilhar(svgs, meds)
                conteudo[base_a + suf] = svg.encode('utf-8')
                assets[tipo] = base_a + suf
                # sem caixa de rotulo: o numero do Banco vem colado no titulo ("17
                # Quadrados perfeitos"); cobrir so os digitos e escrever "Exercicio 1."
                # por cima invadiria o titulo. O app escreve o numero novo acima.
                medidas[tipo] = {'largura_pt': round(w, 1), 'altura_pt': round(h, 1), 'rotulo': None}
                o = {'pagina': ps[0]['pno'] + 1, 'coluna': 1, 'bbox': list(ps[0]['rect'])}
                if len(ps) > 1:
                    o['pedacos'] = [{'pagina': p['pno'] + 1, 'coluna': 1, 'bbox': list(p['rect'])} for p in ps]
                origem[tipo] = o
            if falhou:
                for c in assets.values():
                    conteudo.pop(c, None)
                rel['excluidos'].append({'id': iid, 'numero': n, 'motivo': falhou})
                continue
            txt_e = '\n'.join(gerar_pacote.texto_do_retangulo(doc, p['pno'], p['rect']) for p in p_e)
            txt_s = '\n'.join(gerar_pacote.texto_do_retangulo(doc, p['pno'], p['rect']) for p in p_s)
            titulo = portal.sem_tracos(e['titulo'])
            titulos.append(titulo)
            item = {
                'id': iid, 'fonte': FONTE['id'], 'serie': serie, 'series_equivalentes': SERIES_EQUIVALENTES[serie],
                'modulo': modulo, 'aula': aula, 'numero': n, 'titulo': titulo,
                'formato': 'aberta', 'alternativas': None, 'resposta': None,
                'subitens': gerar_pacote.rotulos(portal.recompor(txt_e)),
                'texto': portal.para_busca(txt_e), 'origem_citada': None,
            }
            if iid in dif_cur:
                item.update({'dificuldade': dif_cur[iid], 'dificuldade_origem': 'curadoria'})
            else:
                item.update({'dificuldade': nivel, 'dificuldade_origem': 'proxy'})
            item['proxy'] = {'nivel': nivel}
            item['tema_app'] = None
            item['assets'] = assets
            item['medidas'] = medidas
            item['origem'] = dict({'arquivo': 'PDF/matematica/' + rel_arq}, **origem)
            itens.append(item)
            docs_busca.append({'id': iid, 'serie': serie, 'tipo': 'exercicio', 'titulo': titulo,
                               'resumo': '%s %s' % (modulo['titulo'], aula['titulo']),
                               'texto': portal.sem_tracos(portal.recompor(txt_e)),
                               'explicacao': portal.sem_tracos(portal.recompor(txt_s))})
        docs_busca.append({'id': '%s:%s' % (serie, modulo['slug']), 'serie': serie, 'tipo': 'modulo',
                           'titulo': '%s, %s' % (modulo['titulo'], aula['titulo']), 'resumo': ' '.join(titulos),
                           'texto': ''})
        rel['itens_no_pacote'] = sum(1 for i in itens if i['modulo']['slug'] == modulo['slug'])
        rel['segundos'] = round(time.time() - t0, 1)
        relatorio['excluidos'].extend(rel['excluidos'])
        doc.close()

    itens.sort(key=lambda i: (i['modulo']['slug'], i['numero']))
    docs_busca.sort(key=lambda d: d['id'])
    conteudo['itens.json'] = gerar_pacote.json_bytes(itens)
    conteudo['teoria.json'] = gerar_pacote.json_bytes([])
    conteudo['busca.json'] = gerar_pacote.json_bytes(gerar_pacote.montar_busca(docs_busca))
    conteudo['apelidos.json'] = gerar_pacote.json_bytes(apelidos)
    contagens = {'modulos': len(arquivos), 'aulas_teoria': 0, 'paginas_teoria': 0, 'aulas_exercicios': len(arquivos),
                 'itens': len(itens), 'itens_com_solucao': len(itens), 'itens_excluidos': len(relatorio['excluidos'])}
    manifest = {
        'esquema': 1, 'pacote': nome, 'versao': versao,
        'gerado_em': gerado_em or datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-3))).replace(microsecond=0).isoformat(),
        'gerador': {'nome': 'biblioteca/banco.py', 'commit': commit or gerar_pacote.commit_do_gerador(),
                    'pymupdf': pymupdf.VersionBind},
        'materia': 'matematica', 'fonte': FONTE, 'series': [serie], 'series_equivalentes': SERIES_EQUIVALENTES,
        'contagens': contagens, 'arquivos': {k: gerar_pacote.sha(conteudo[k]) for k in sorted(conteudo)},
    }
    manifest_b = (json.dumps(manifest, ensure_ascii=False, indent=1) + '\n').encode('utf-8')
    zip_caminho = gerar_pacote.gravar_pacote(conteudo, manifest_b, nome, versao, saida, trabalho, gravar_zip)
    ids = {i['id'] for i in itens}
    ids_excl = {e['id'] for e in relatorio['excluidos']}
    relatorio['curadoria_sem_item'] = sorted(
        ['dificuldade.csv: ' + k for k in dif_cur if k.startswith('banco:') and ':%s:' % serie in k and k not in ids | ids_excl] +
        ['exclusoes.csv: ' + k for k in excl_cur if k.startswith('banco:') and ':%s:' % serie in k and k not in ids_excl])
    tam = collections.Counter()
    for k, v in conteudo.items():
        if k.startswith('assets/'):
            t = 'solucao' if k.endswith('-sol.svg') else 'enunciado'
            tam[t] += len(v)
            tam['n_' + t] += 1
        else:
            tam[k] += len(v)
    relatorio.update({
        'contagens': contagens, 'hash_manifest': gerar_pacote.sha(manifest_b),
        'zip': {'caminho': zip_caminho if gravar_zip else None,
                'bytes': os.path.getsize(zip_caminho) if gravar_zip else None},
        'bytes_por_tipo': dict(sorted(tam.items())), 'segundos': round(time.time() - t_ini, 1),
    })
    with open(os.path.join(trabalho, 'relatorio.json'), 'w', encoding='utf-8', newline='') as f:
        f.write(json.dumps(relatorio, ensure_ascii=False, indent=1) + '\n')
    return manifest, relatorio, trabalho


def principal(argv=None):
    ap = argparse.ArgumentParser(description='Gera o pacote do Banco de Questoes da OBMEP de um nivel.')
    ap.add_argument('--pdfs', required=True, help='a pasta PDF/matematica')
    ap.add_argument('--nivel', type=int, required=True, choices=(1, 2, 3))
    ap.add_argument('--versao', type=int, required=True)
    ap.add_argument('--saida', required=True)
    ap.add_argument('--curadoria', required=True)
    ap.add_argument('--anos', default='2016-2020')
    ap.add_argument('--trabalho')
    ap.add_argument('--gerado-em')
    ap.add_argument('--commit')
    ap.add_argument('--sem-zip', action='store_true')
    a = ap.parse_args(argv)
    ini, fim = (int(x) for x in a.anos.split('-'))
    anos = tuple(x for x in range(ini, fim + 1))
    if any(x not in ANOS_MODELO_A for x in anos):
        raise SystemExit('esta versao do detector so conhece o modelo de 2016 a 2020')
    manifest, rel, trab = gerar(a.pdfs, a.nivel, a.versao, a.saida, a.curadoria, anos, a.trabalho, a.gerado_em,
                                a.commit, not a.sem_zip)
    print(json.dumps({'contagens': manifest['contagens'], 'zip': rel['zip'], 'bytes_por_tipo': rel['bytes_por_tipo'],
                      'excluidos': len(rel['excluidos']), 'segundos': rel['segundos'], 'trabalho': trab},
                     ensure_ascii=False, indent=1))


if __name__ == '__main__':
    principal()
