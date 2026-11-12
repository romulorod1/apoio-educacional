"""Provas do tipo de fonte cadernos-sme-sp (biblioteca/cadernos_sme.py, item C5), com um veneno por trava.

    python biblioteca/_prova_cadernos_sme.py
        amostra sintetica (o que roda no portao, sem o Drive): o caderno de
        biblioteca/_amostra/fazer_amostra_cadernos.py, gerado DUAS vezes.

    python biblioteca/_prova_cadernos_sme.py --real --pdfs <pasta dos cadernos> --vinculos <csv>
            --trabalho <A> --trabalho2 <B> [--zip <pacote.zip>]
        as mesmas travas sobre um pacote de verdade gerado duas vezes.

    --sem-navegador pula a fidelidade (Chrome headless).

Travas proprias (cada uma le a pagina, e nao o detector):
  contagens   todo id do csv de vinculos esta no pacote, nos excluidos ou fora
              do alvo, e todo item do pacote tem vinculo para um dos 33 assuntos
  campos      fonte, serie, assunto do alvo com o modulo do mesmo titulo, tom
              pelo ano, licenca, atribuicao e origem citando o ano e as paginas
              do recorte, sem solucao, sem resposta, dificuldade sem inventar
  recorte     o primeiro pedaco comeca pelo titulo (ou pelo numero da questao),
              nenhum pedaco menor que 9 pt, nenhum sobrepondo outro, nenhuma
              borda cortando tinta (a beira da pagina nao conta)
  credito     nenhum credito de foto ou reproducao de terceiro dentro de recorte
  corrido     nenhuma linha do rodape corrido dentro de recorte
  revisao     a questao da revisao tem so o(s) seu(s) numero(s); revisao
              inteira num item so so quando o relatorio diz que a numeracao
              da fonte nao fecha
  entre       nenhuma linha de texto entre duas unidades seguidas da mesma
              pagina fica fora dos dois recortes
e as genericas do Portal (determinismo, svg, xml, manifesto, tracos, PyMuPDF
no manifest, curadoria, glifos e fidelidade no Chrome).
"""
import argparse
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
import cadernos_sme  # noqa: E402
import _prova_gerador as pg  # noqa: E402
from _prova_banco import borda_corta_tinta  # noqa: E402

sys.path.insert(0, os.path.join(AQUI, '_amostra'))
import fazer_amostra_cadernos  # noqa: E402

TOM = {'2ano': 'lúdico', '3ano': 'lúdico'}  # do 4o ao 9o, 'escolar' (pedido do C5)
CREDITO = re.compile(r'foto|wiki|getty|pulsar|folha|imagens?\b|©|reprodu|acervo|stock|\bafp\b|\bnasa\b', re.I)


def sem_acento(t):
    import unicodedata
    t = unicodedata.normalize('NFD', t)
    return ''.join(c for c in t if unicodedata.category(c) != 'Mn').lower()


def letras(t):
    return re.sub(r'[^a-z0-9]', '', sem_acento(t.replace('º', 'o').replace('ª', 'a')))


def linhas_no(pgn, r):
    """As linhas de texto com o centro dentro de r: (bbox, texto, corpo, girada, negrito)."""
    r = pymupdf.Rect(r)
    out = []
    for b in pgn.get_text('dict')['blocks']:
        if b['type'] != 0:
            continue
        for l in b['lines']:
            t = ''.join(s['text'] for s in l['spans']).strip()
            if not t:
                continue
            c = pymupdf.Point((l['bbox'][0] + l['bbox'][2]) / 2, (l['bbox'][1] + l['bbox'][3]) / 2)
            if r.contains(c):
                sp = next((s for s in l['spans'] if s['text'].strip()), l['spans'][0])
                out.append((l['bbox'], t, sp['size'], abs(l['dir'][1]) > 0.05,
                            bool(sp['flags'] & 16) or bool(re.search('Bold|Black|Ultra|Heavy', sp['font']))))
    return out


def ler_vinculos(caminho):
    return cadernos_sme.ler_vinculos(caminho)


# ------------------------------------------------------------------ travas

def trava_contagens(p, vinc):
    erros = []
    r = p.relatorio
    itens = {i['id'] for i in p.itens}
    excl = {e['id'] for e in r['excluidos']}
    fora = {e['id'] for e in r['fora_do_alvo']}
    for iid in sorted(vinc):
        if iid not in itens | excl | fora:
            erros.append('%s esta no csv de vinculos e nem no pacote, nem nos excluidos, nem fora do alvo' % iid)
    for i in p.itens:
        v = vinc.get(i['id'])
        if not v or v['tema'] not in cadernos_sme.ALVO:
            erros.append('%s esta no pacote sem vinculo para um dos 33 assuntos' % i['id'])
    for e in r['fora_do_alvo']:
        if e['tema'] in cadernos_sme.ALVO:
            erros.append('%s esta fora do alvo com o assunto %s, que e do alvo' % (e['id'], e['tema']))
    if r.get('sem_vinculo'):
        erros.append('%d unidades sem linha no csv de vinculos, por exemplo %s' % (len(r['sem_vinculo']), r['sem_vinculo'][0]['id']))
    if r.get('vinculo_sem_unidade'):
        erros.append('%d linhas do csv sem unidade no caderno, por exemplo %s' % (len(r['vinculo_sem_unidade']), r['vinculo_sem_unidade'][0]))
    if p.manifest['contagens']['itens_excluidos'] != len(r['excluidos']):
        erros.append('manifest diz %d excluidos e o relatorio %d' % (p.manifest['contagens']['itens_excluidos'], len(r['excluidos'])))
    if p.manifest['contagens']['itens'] != len(p.itens):
        erros.append('manifest diz %d itens e o itens.json tem %d' % (p.manifest['contagens']['itens'], len(p.itens)))
    destinos = {u['id']: u['destino'] for u in r['unidades']}
    for i in p.itens:
        if destinos.get(i['id']) != 'item':
            erros.append('%s no pacote, e o relatorio da a unidade como %r' % (i['id'], destinos.get(i['id'])))
    return erros


def paginas_do_item(p, it):
    desl = {c['arquivo']: c['deslocamento'] for c in p.relatorio['cadernos']}[os.path.basename(it['origem']['arquivo'])]
    return sorted(set(pz['pagina'] - 1 - desl for pz in pg.pedacos(it, 'enunciado')))


def trava_campos(p, vinc):
    erros = []
    temas = cadernos_sme.carregar_temas()
    for it in p.itens:
        iid, s = it['id'], it['serie']
        e = lambda m: erros.append('%s: %s' % (iid, m))
        if it.get('fonte') != 'cadernos-sme-sp':
            e('fonte %r' % it.get('fonte'))
        if s not in cadernos_sme.NOME_SERIE or not iid.startswith('sme:%s:' % s):
            e('serie %r fora de 2ano a 9ano ou fora do id' % s)
            continue
        if ('Aluno%sAno.pdf' % s[0]) not in it['origem']['arquivo']:
            e('serie %s e o caderno %s' % (s, it['origem']['arquivo']))
        t = it.get('tema_app')
        if t not in cadernos_sme.ALVO or t not in temas:
            e('assunto %r fora dos 33' % t)
        elif it['modulo']['titulo'] != temas[t]['titulo']:
            e('modulo %r e o assunto %s se chama %r' % (it['modulo']['titulo'], t, temas[t]['titulo']))
        if vinc.get(iid, {}).get('tema') != t:
            e('assunto %s e o csv de vinculos diz %r' % (t, vinc.get(iid, {}).get('tema')))
        tom = 'escolar' if ':q' in iid else TOM.get(s, 'escolar')  # questao da revisao: escolar em todo ano
        if it.get('tom') != tom:
            e('tom %r no %s' % (it.get('tom'), s))
        if not it.get('licenca') or '52.681/2011' not in it['licenca'] or 'não comercial' not in it['licenca']:
            e('licenca sem o decreto ou sem o uso nao comercial: %r' % it.get('licenca'))
        pags = paginas_do_item(p, it)
        cita = 'p. %d' % pags[0] if len(pags) == 1 else 'p. %d a %d' % (pags[0], pags[-1])
        ano = cadernos_sme.NOME_SERIE[s]
        for campo in ('atribuicao', 'origem_citada'):
            v = it.get(campo) or ''
            if ano not in v or cita not in v or 'SME-SP' not in v:
                e('%s nao cita o ano (%s), a pagina (%s) e a SME-SP: %r' % (campo, ano, cita, v))
        if it['origem_detalhe'].get('paginas') != pags:
            e('origem_detalhe.paginas %s e o recorte esta em %s' % (it['origem_detalhe'].get('paginas'), pags))
        if it['assets'].get('solucao') is not None or not it.get('sem_solucao') or it.get('resposta') is not None:
            e('o caderno nao tem solucao nem resposta, e o item diz ter')
        if it.get('dificuldade') is not None and it.get('dificuldade_origem') != 'curadoria':
            e('dificuldade %r sem curadoria (o caderno nao da referencia)' % it.get('dificuldade'))
        if it['medidas']['enunciado'].get('rotulo') is not None:
            e('rotulo nao nulo')
    return erros


def borda_fora_da_beira(doc, pz):
    lados = borda_corta_tinta(doc, pz)
    W, H = doc[pz['pagina'] - 1].rect.width, doc[pz['pagina'] - 1].rect.height
    b = pz['bbox']
    # na beira da pagina nao ha o que cortar (a imagem sangra ate a beira; e o
    # pixmap de fora, que passaria da pagina, fica preso nela)
    lados = [l for l in lados.split(' e ') if l and not (l == 'esquerda' and b[0] <= 1)
             and not (l == 'direita' and b[2] >= math.floor(W) - 1)
             and not (l == 'de cima' and b[1] <= 1) and not (l == 'de baixo' and b[3] >= math.floor(H) - 1)]
    return ' e '.join(lados)


def trava_recorte(p):
    erros = []
    for it in p.itens:
        doc = p.doc(it['origem']['arquivo'])
        ps = pg.pedacos(it, 'enunciado')
        for k, pz in enumerate(ps):
            b = pz['bbox']
            if b[3] - b[1] < 9:
                erros.append('%s: pedaco %d com %.1f pt' % (it['id'], k + 1, b[3] - b[1]))
            lado = borda_fora_da_beira(doc, pz)
            if lado:
                erros.append('%s: tinta cortada na borda %s (p%d)' % (it['id'], lado, pz['pagina']))
        ls = [l for l in linhas_no(doc[ps[0]['pagina'] - 1], ps[0]['bbox']) if not l[3] and l[2] > 6]
        if not ls:
            erros.append('%s: o primeiro pedaco nao tem texto' % it['id'])
            continue
        q = it['origem_detalhe'].get('questao')
        alvo = q.split(' ')[0] if q else it['origem_detalhe']['atividade']
        a = letras(alvo)
        # a linha do titulo (ou do numero) e a mais alta da margem: acima dela, so
        # texto a direita (balao de fala do desenho que abre a atividade)
        casa = [l for l in ls if letras(l[1]) and (a.startswith(letras(l[1])) or letras(l[1]).startswith(a))]
        if not casa:
            erros.append('%s: o primeiro pedaco nao tem a linha %r' % (it['id'], alvo[:40]))
            continue
        t = min(casa, key=lambda l: (round(l[0][1]), l[0][0]))
        acima = [l for l in ls if l is not t and l[0][3] <= t[0][1] + 1 and l[0][0] < t[0][0] + 20]
        if acima:
            erros.append('%s: o recorte comeca por %r, acima de %r' % (it['id'], acima[0][1][:40], alvo[:40]))
    # nenhum pedaco de unidade sobrepondo outro, na mesma pagina do mesmo caderno
    por_pag = {}
    for u in p.relatorio['unidades']:
        cad = u['id'].split(':')[1]
        for pz in u['pedacos']:
            por_pag.setdefault((cad, pz['pagina']), []).append((u['id'], pymupdf.Rect(pz['bbox'])))
    for chave, rs in por_pag.items():
        for i in range(len(rs)):
            for j in range(i + 1, len(rs)):
                inter = rs[i][1] & rs[j][1]
                if rs[i][0] != rs[j][0] and not inter.is_empty and inter.height > 0.5 and inter.width > 0.5:
                    erros.append('%s e %s se sobrepoem na p%d' % (rs[i][0], rs[j][0], chave[1]))
    return erros


def trava_credito(p):
    erros = []
    for it in p.itens:
        doc = p.doc(it['origem']['arquivo'])
        for pz in pg.pedacos(it, 'enunciado'):
            pgn = doc[pz['pagina'] - 1]
            ims = [pymupdf.Rect(b['bbox']) for b in pgn.get_text('dict')['blocks'] if b['type'] == 1]
            for bb, t, corpo, girada, _ in linhas_no(pgn, pz['bbox']):
                tem_letra = sum(c.isalpha() for c in t) >= 2
                junto_de_imagem = any((pymupdf.Rect(bb) + (-6, -6, 6, 6)).intersects(i) for i in ims)
                if tem_letra and ((girada and corpo <= 7) or (girada and corpo <= 8.5 and junto_de_imagem)
                                  or (corpo <= 8.5 and CREDITO.search(t))):
                    erros.append('%s: credito de imagem de terceiro no recorte: %r (p%d)' % (it['id'], t[:50], pz['pagina']))
    return erros


def trava_corrido(p):
    erros = []
    for it in p.itens:
        doc = p.doc(it['origem']['arquivo'])
        for pz in pg.pedacos(it, 'enunciado'):
            pgn = doc[pz['pagina'] - 1]
            H = pgn.rect.height
            for bb, t, *_ in linhas_no(pgn, pz['bbox']):
                if bb[1] >= H * 0.88 and (re.match(r'^\d{1,3}$', t) or 'cadernos de apoio' in sem_acento(t)):
                    erros.append('%s: rodape corrido no recorte: %r (p%d)' % (it['id'], t[:40], pz['pagina']))
            # e nenhum pedaco do selo do numero da pagina (o desenho em volta do numero)
            numeros = [pymupdf.Rect(bb) for bb, t, *_ in linhas_no(pgn, (0, H * 0.88, pgn.rect.width, H))
                       if re.match(r'^\d{1,3}$', t)]
            r = pymupdf.Rect(pz['bbox'])
            for d in pgn.get_drawings():
                # o selo: desenho pequeno no pe, que se sobrepoe de fato ao numero
                selo = d['rect'].height < H * 0.2 and d['rect'].y0 >= H * 0.8 and \
                    any(not (d['rect'] & n).is_empty and (d['rect'] & n).get_area() > 1 for n in numeros)
                dentro = (d['rect'] & r)
                if selo and not dentro.is_empty and dentro.height > 0.5 and dentro.width > 0.5:
                    erros.append('%s: selo do numero da pagina no recorte (p%d)' % (it['id'], pz['pagina']))
    return erros


def trava_cobertura(p):
    """Toda a tinta das paginas do caderno, da primeira a ultima unidade, tem dono.

    Pagina com pedaco de unidade: toda linha de texto e toda imagem cai num
    pedaco (fora o rodape e o cabecalho, o titulo "Agora, e com voce" das
    revisoes separadas e o credito de foto). Pagina sem pedaco: so a abertura
    de unidade ("Unidade N") e as anotacoes; qualquer outra com texto ou
    imagem e pagina sem dono (o tabuleiro de 5o ano, p. 91, achado da revisao)."""
    erros = []
    arquivos = {c['serie']: c['arquivo'] for c in p.relatorio['cadernos']}
    por_cad = {}
    for u in p.relatorio['unidades']:
        cad = u['id'].split(':')[1]
        for pz in u['pedacos']:
            por_cad.setdefault(cad, {}).setdefault(pz['pagina'], []).append(pymupdf.Rect(pz['bbox']) + (-1, -1, 1, 1))
    for cad, pags in sorted(por_cad.items()):
        doc = p.doc(arquivos[cad])
        for pno in range(min(pags), max(pags) + 1):
            pgn = doc[pno - 1]
            W, H = pgn.rect.width, pgn.rect.height
            ls = [l for l in linhas_no(pgn, (0, H * 0.12, W, H * 0.88)) if not l[3] and l[2] > 6
                  and not (l[2] <= 8.5 and CREDITO.search(l[1]))]
            ims = [pymupdf.Rect(b['bbox']) for b in pgn.get_text('dict')['blocks'] if b['type'] == 1
                   and b['bbox'][2] - b['bbox'][0] >= 10 and b['bbox'][3] - b['bbox'][1] >= 10
                   and pymupdf.Rect(b['bbox']).get_area() > 400 and b['bbox'][1] < H * 0.88]
            rs = pags.get(pno)
            if not rs:
                txt = ' '.join(letras(l[1]) for l in ls)
                if re.search(r'unidade\d', txt) or txt.startswith('anotacoes') or (not ls and not ims):
                    continue
                erros.append('%s p%d: pagina com conteudo e sem unidade nenhuma' % (cad, pno))
                continue
            for bb, t, *_ in ls:
                c = pymupdf.Point((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2)
                if not any(r.contains(c) for r in rs) and not letras(t).startswith('agoraecomvoce'):
                    erros.append('%s p%d: %r fora de toda unidade' % (cad, pno, t[:40]))
            for im in ims:
                if not any(r.intersects(im) for r in rs):
                    erros.append('%s p%d: imagem em %s fora de toda unidade' % (cad, pno, [round(v) for v in im]))
    return erros


REF = re.compile(r'(atividade|questao|pagina|exercicio)s?\s+anterior|anteriormente|pagina\s+\d', re.I)


def trava_referencia(p):
    """Nenhum item do pacote remete a outra atividade, questao ou pagina (nao se resolveria sozinho)."""
    return ['%s: remete a %r' % (it['id'], m.group(0)) for it in p.itens for m in [REF.search(sem_acento(it['texto']))] if m]


def trava_enunciado_comum(p):
    """Revisao separada por questao nao deixa de fora texto entre o titulo dela e a questao 1."""
    erros = []
    arquivos = {c['serie']: c['arquivo'] for c in p.relatorio['cadernos']}
    for u in p.relatorio['unidades']:
        if not u['id'].endswith(':q1') or not u['pedacos']:
            continue
        doc = p.doc(arquivos[u['id'].split(':')[1]])
        pz = u['pedacos'][0]
        pgn = doc[pz['pagina'] - 1]
        ls = linhas_no(pgn, (0, 0, pgn.rect.width, pz['bbox'][1]))
        tit = [l for l in ls if letras(l[1]).startswith('agora')]
        if not tit:
            continue
        y = max(l[0][3] for l in tit)
        for bb, t, corpo, girada, _ in ls:
            if not girada and bb[1] >= y - 1 and not letras(t).startswith('agora') and corpo > 8.5:
                erros.append('%s: %r fica entre o titulo da revisao e a questao 1, fora das questoes' % (u['id'], t[:40]))
    return erros


def trava_revisao(p):
    erros = []
    inteiras = set(re.findall(r'revisao (sme:\S+): (?:a numeracao|enunciado comum)', ' '.join(n for c in p.relatorio['cadernos'] for n in c['notas'])))
    for it in p.itens:
        doc = p.doc(it['origem']['arquivo'])
        q = it['origem_detalhe'].get('questao')
        nums = set()
        for pz in pg.pedacos(it, 'enunciado'):
            pgn = doc[pz['pagina'] - 1]
            ls = [l for l in linhas_no(pgn, pz['bbox']) if l[4] and not l[3] and re.match(r'^\d{1,2}\s*[.)](?!\d)', l[1])]
            if not ls:
                continue
            margem = min(l[0][0] for l in ls)
            for l in ls:
                if l[0][0] - margem <= 14 or l[0][0] > pgn.rect.width * 0.4:
                    nums.add(int(re.match(r'^(\d+)', l[1]).group(1)))
        if q:
            esperado = set(int(x) for x in q.split(' e '))
            if nums != esperado:
                erros.append('%s: a questao %s tem os numeros %s no recorte' % (it['id'], q, sorted(nums)))
        elif letras(it['origem_detalhe']['atividade']).startswith('agoraecomvoce') and it['id'] not in inteiras:
            erros.append('%s: revisao inteira num item so (questoes %s), sem a nota de numeracao que nao fecha' % (
                it['id'], sorted(nums)))
    return erros


def trava_entre(p):
    """Nada de texto entre duas unidades seguidas da mesma pagina, fora dos dois recortes."""
    erros = []
    us = p.relatorio['unidades']
    arquivos = {c['serie']: c['arquivo'] for c in p.relatorio['cadernos']}
    for a, b in zip(us, us[1:]):
        if a['id'].split(':')[1] != b['id'].split(':')[1] or not a['pedacos'] or not b['pedacos']:
            continue
        pa, pb = a['pedacos'][-1], b['pedacos'][0]
        if pa['pagina'] != pb['pagina']:
            continue
        doc = p.doc(arquivos[a['id'].split(':')[1]])
        pgn = doc[pa['pagina'] - 1]
        faixa = (0, pa['bbox'][3], pgn.rect.width, pb['bbox'][1])
        if faixa[3] - faixa[1] <= 0:
            continue
        for bb, t, corpo, girada, _ in linhas_no(pgn, faixa):
            if not girada:
                erros.append('%s e %s: %r fica entre os dois recortes (p%d)' % (a['id'], b['id'], t[:40], pa['pagina']))
        # e nenhum traco desenhado (a linha de resposta fina) entre os dois
        for d in pgn.get_drawings():
            r, cor = d['rect'], d.get('color') or d.get('fill')
            if cor and sum(cor[:3]) / 3.0 <= 0.9 and r.width >= 20 and faixa[1] < (r.y0 + r.y1) / 2 < faixa[3]:
                erros.append('%s e %s: um traco desenhado em y %.0f fica entre os dois recortes (p%d)' % (
                    a['id'], b['id'], (r.y0 + r.y1) / 2, pa['pagina']))
    return erros


def trava_continuacao(p):
    """A questao da revisao que passa para a pagina seguinte leva texto dela la; se o
    pedaco da pagina seguinte so tem desenho e a questao seguinte comeca nessa
    pagina, o desenho e da seguinte (fica acima do numero dela)."""
    erros = []
    us = p.relatorio['unidades']
    arquivos = {c['serie']: c['arquivo'] for c in p.relatorio['cadernos']}
    for a, b in zip(us, us[1:]):
        if a['tipo'] != 'questao' or b['tipo'] != 'questao' or len(a['pedacos']) < 2 or not b['pedacos']:
            continue
        ult = a['pedacos'][-1]
        if ult['pagina'] != b['pedacos'][0]['pagina']:
            continue
        doc = p.doc(arquivos[a['id'].split(':')[1]])
        if not [l for l in linhas_no(doc[ult['pagina'] - 1], ult['bbox']) if not l[3]]:
            erros.append('%s: o pedaco da p%d so tem desenho, e %s comeca nessa pagina' % (a['id'], ult['pagina'], b['id']))
    return erros


def travas(p, vinc, placar, zip_caminho=None, rot=''):
    placar.conferir('cadernos%s: contagens' % rot, trava_contagens(p, vinc))
    placar.conferir('cadernos%s: campos' % rot, trava_campos(p, vinc))
    placar.conferir('cadernos%s: recorte' % rot, trava_recorte(p))
    placar.conferir('cadernos%s: nenhum credito de terceiro' % rot, trava_credito(p))
    placar.conferir('cadernos%s: rodape corrido fora' % rot, trava_corrido(p))
    placar.conferir('cadernos%s: uma questao da revisao por item' % rot, trava_revisao(p))
    placar.conferir('cadernos%s: nada entre duas unidades' % rot, trava_entre(p))
    placar.conferir('cadernos%s: desenho da questao seguinte fica com ela' % rot, trava_continuacao(p))
    placar.conferir('cadernos%s: nada que remete a outra atividade' % rot, trava_referencia(p))
    placar.conferir('cadernos%s: toda a tinta do caderno tem dono' % rot, trava_cobertura(p))
    placar.conferir('cadernos%s: enunciado comum da revisao nao se perde' % rot, trava_enunciado_comum(p))
    placar.conferir('cadernos%s: svg autocontido' % rot, pg.trava_svg(p))
    placar.conferir('cadernos%s: svg bem formado' % rot, pg.trava_xml(p))
    placar.conferir('cadernos%s: manifesto' % rot, pg.trava_manifesto(p, zip_caminho))
    placar.conferir('cadernos%s: sem travessao' % rot, pg.trava_tracos(p))
    placar.conferir('cadernos%s: PyMuPDF no manifest' % rot, pg.trava_gerador_no_manifest(p))
    placar.conferir('cadernos%s: curadoria aplicada' % rot, pg.trava_curadoria(p))
    placar.conferir('cadernos%s: todo caractere com o seu glifo' % rot, pg.trava_glifos(p))


# ------------------------------------------------------------------ amostra

def gerar_amostra(pdfs, vinculos, trabalho, curadoria, **kw):
    kw.setdefault('gerado_em', '2026-11-13T00:00:00-03:00')
    kw.setdefault('commit', 'amostra')
    return cadernos_sme.gerar(pdfs, vinculos, 1, trabalho + '_zip', curadoria, trabalho=trabalho, **kw)


def com(attr, valor, fn):
    antes = getattr(cadernos_sme, attr)
    setattr(cadernos_sme, attr, valor)
    try:
        return fn()
    finally:
        setattr(cadernos_sme, attr, antes)


def esperado_da_amostra(p):
    """O que a amostra tem de mostrar, alem de passar nas travas."""
    erros = []
    ids = sorted(i['id'] for i in p.itens)
    certos = ['sme:3ano:p004', 'sme:3ano:p006b', 'sme:3ano:p007', 'sme:3ano:p008:q1', 'sme:3ano:p008:q2', 'sme:3ano:p008:q3',
              'sme:3ano:p008:q8', 'sme:3ano:p010']
    if ids != certos:
        erros.append('entraram %s, e o certo e %s' % (ids, certos))
    exc = {e['id']: e['motivo'] for e in p.relatorio['excluidos']}
    if 'Fulano de Tal/Agencia Imagens' not in exc.get('sme:3ano:p006', ''):
        erros.append('o album de fotos nao saiu pelo credito: %r' % exc.get('sme:3ano:p006'))
    if 'Beltrano Sicrano' not in exc.get('sme:3ano:p008:q5', ''):
        erros.append('a questao 5 nao saiu pelo credito: %r' % exc.get('sme:3ano:p008:q5'))
    if not exc.get('sme:3ano:p008:q6', '').startswith('curadoria: cedula'):
        erros.append('a questao 6 nao saiu pela curadoria: %r' % exc.get('sme:3ano:p008:q6'))
    if 'questao anterior' not in exc.get('sme:3ano:p008:q9', ''):
        erros.append('a questao 9 nao saiu por remeter a outra: %r' % exc.get('sme:3ano:p008:q9'))
    if [e['id'] for e in p.relatorio['fora_do_alvo']] != ['sme:3ano:p008:q7']:
        erros.append('fora do alvo: %s' % [e['id'] for e in p.relatorio['fora_do_alvo']])
    por = {i['id']: i for i in p.itens}
    if 'sme:3ano:p004' in por and len(pg.pedacos(por['sme:3ano:p004'], 'enunciado')) != 2:
        erros.append('Pastores e ovelhas nao atravessou a pagina em dois pedacos')
    if 'sme:3ano:p007' in por and (por['sme:3ano:p007']['subitens'] != ['1', '2', '3', '4']
                                   or len(pg.pedacos(por['sme:3ano:p007'], 'enunciado')) != 1):
        erros.append('a atividade de duas colunas nao saiu inteira, com 1 a 4: %s' % por['sme:3ano:p007']['subitens'])
    if 'sme:3ano:p008:q3' in por and por['sme:3ano:p008:q3']['origem_detalhe']['questao'] != '3 e 4':
        erros.append('as questoes 3 e 4 lado a lado nao sairam juntas: %r' % por['sme:3ano:p008:q3']['origem_detalhe']['questao'])
    return erros


def amostra(temp, placar, navegador):
    pdfs = os.path.join(temp, 'pdfs')
    fazer_amostra_cadernos.fazer(pdfs)
    pdfs_b = os.path.join(temp, 'pdfs_b')
    fazer_amostra_cadernos.fazer(pdfs_b)
    vinc_c = fazer_amostra_cadernos.vinculos(os.path.join(temp, 'vinculos.csv'))
    vinc = ler_vinculos(vinc_c)
    cur = pg.curadoria_da_amostra(os.path.join(temp, 'curadoria'))
    a = os.path.join(temp, 'a')
    gerar_amostra(pdfs, vinc_c, a, cur)
    gerar_amostra(pdfs_b, vinc_c, os.path.join(temp, 'b'), cur, gerado_em='2031-01-01T00:00:00-03:00', commit='outro')
    p = pg.Pacote(a, pdfs)
    print('amostra: %d itens, %d excluidos, %d fora do alvo' % (len(p.itens), len(p.relatorio['excluidos']),
                                                                len(p.relatorio['fora_do_alvo'])))
    placar.conferir('cadernos: determinismo', pg.trava_determinismo(p, pg.Pacote(os.path.join(temp, 'b'), pdfs)))
    travas(p, vinc, placar, zip_caminho=os.path.join(a + '_zip', 'matematica-cadernos-sme-sp-v1.zip'))
    placar.conferir('amostra: o que entra, o que sai e por que', esperado_da_amostra(p))
    venenos(temp, pdfs, vinc_c, vinc, cur, placar, p)
    if navegador:
        sorteio = pg.sortear_pedacos(p)
        erros, medidas = pg.trava_fidelidade(p, sorteio, temp)
        placar.conferir('cadernos: fidelidade (%d pedacos, semente %d)' % (len(sorteio), pg.SEMENTE), erros)


def venenos(temp, pdfs, vinc_c, vinc, cur, placar, boa):
    def gera(nome):
        t = os.path.join(temp, 'v_' + nome)
        gerar_amostra(pdfs, vinc_c, t, cur)
        return pg.Pacote(t, pdfs)
    # sem tirar a atividade com credito, a foto de terceiro entra no pacote
    q = com('TIRA_CREDITO', False, lambda: gera('credito'))
    placar.conferir('foto de terceiro no pacote', trava_credito(q), True, 'credito de imagem')
    # sem separar a revisao, as questoes vao todas num item so
    # (o csv ganha a linha do id da revisao inteira, para ela virar item)
    v2 = os.path.join(temp, 'vinculos_revisao.csv')
    with io.open(v2, 'w', encoding='utf-8', newline='') as f:
        f.write(io.open(vinc_c, encoding='utf-8').read() + 'sme:3ano:p008;MAT03-03;;prova;revisao inteira\n')
    t = os.path.join(temp, 'v_revisao')
    # (e o credito sai junto: a revisao inteira tem a foto da questao 5 e sairia por ela)
    com('TIRA_CREDITO', False, lambda: com('SEPARA_REVISAO', False, lambda: gerar_amostra(pdfs, v2, t, cur)))
    q = pg.Pacote(t, pdfs)
    placar.conferir('revisao inteira num item', trava_revisao(q), True, 'revisao inteira')
    # sem tirar o rodape corrido, ele entra no recorte que chega ao pe da pagina
    q = com('TIRA_CORRIDO', False, lambda: gera('corrido'))
    placar.conferir('rodape corrido no recorte', trava_corrido(q), True, 'rodape corrido')
    # sem subir a fronteira, o quadro da questao 2 (que sobe acima do numero) e
    # cortado entre a 1 e a 2; a conferencia de borda do gerador sai junto
    q = com('CONFERE_BORDA', False, lambda: com('FRONTEIRA_LIVRE', False, lambda: gera('fronteira')))
    placar.conferir('fronteira na linha do numero', trava_recorte(q), True, 'tinta cortada')
    # a conferencia de borda do gerador e a rede: sem a fronteira livre, a
    # questao cortada sai com motivo em vez de entrar
    q = com('FRONTEIRA_LIVRE', False, lambda: gera('fronteira_rede'))
    motivos = ' '.join(e['motivo'] for e in q.relatorio['excluidos'])
    placar.conferir('sem a fronteira livre, a borda do gerador tira a questao cortada',
                    [] if 'corta tinta na borda' in motivos else ['nada saiu pela borda: %r' % motivos[:80]])
    # sem o traco fino, a linha de resposta da questao 1 fica fora dos recortes
    q = com('FIO_FINO', False, lambda: gera('fio_fino'))
    placar.conferir('linha de resposta fina fora do recorte', trava_entre(q), True, 'traco desenhado')
    # sem dar o desenho do alto da pagina a questao seguinte, a 7 o leva
    q = com('IMAGEM_ACIMA_E_DA_SEGUINTE', False, lambda: gera('imagem_acima'))
    placar.conferir('desenho da questao 8 na questao 7', trava_continuacao(q), True, 'so tem desenho')
    # sem o selo como rodape, o topo do circulo do numero da pagina entra no recorte
    q = com('SELO_DO_RODAPE', False, lambda: gera('selo'))
    placar.conferir('selo do numero da pagina no recorte', trava_corrido(q), True, 'selo')
    # o credito de 8 pt encostado na foto so e pego pela regra da imagem
    q = com('CREDITO_GIRADO_IMAGEM', 7.0, lambda: gera('credito8'))
    placar.conferir('credito de 8 pt junto da foto', trava_credito(q), True, 'Beltrano')
    # sem tirar o que remete a outra questao, a 9 entra e nao se resolve sozinha
    q = com('TIRA_REFERENCIA', False, lambda: gera('referencia'))
    placar.conferir('questao que remete a anterior', trava_referencia(q), True, 'questao anterior')
    # separando a revisao com enunciado comum, o texto antes da 1 fica de fora
    q = com('REVISAO_COM_ENUNCIADO_INTEIRA', False, lambda: gera('enunciado'))
    placar.conferir('enunciado comum da revisao perdido', trava_enunciado_comum(q), True, 'Use a tabela')
    # sem a excecao da revisao, a questao solta do 3o ano sai ludica
    q = com('TOM_REVISAO_ESCOLAR', False, lambda: gera('tom_revisao'))
    placar.conferir('questao da revisao do 3o ano ludica', trava_campos(q, vinc), True, "tom 'lúdico'")
    # recorte encolhido: o fim de uma unidade fica entre ela e a seguinte
    q = pg.copia(boa, temp, 'v_encolhe')
    for u in q.relatorio['unidades']:
        if u['id'] == 'sme:3ano:p008:q1':
            b = u['pedacos'][0]['bbox']
            u['pedacos'][0]['bbox'] = [b[0], b[1], b[2], b[3] - 30]
    placar.conferir('recorte encolhido', trava_entre(q), True, 'Mostre como pensou')
    # pagina que nenhuma unidade cobre (a continuacao de "Pastores e ovelhas" some)
    q = pg.copia(boa, temp, 'v_cobertura')
    for u in q.relatorio['unidades']:
        if u['id'] == 'sme:3ano:p004':
            u['pedacos'] = u['pedacos'][:1]
    placar.conferir('pagina sem dono', trava_cobertura(q), True, 'sem unidade nenhuma')
    # recorte que sobe para a unidade de cima: o fim do album de fotos fica no
    # alto do recorte do quadro de numeros
    q = pg.copia(boa, temp, 'v_sobe')
    for i in q.itens:
        if i['id'] == 'sme:3ano:p006b':
            b = i['origem']['enunciado']['bbox']
            i['origem']['enunciado']['bbox'] = [b[0], b[1] - 80, b[2], b[3]]
    placar.conferir('recorte que sobe para a unidade de cima', trava_recorte(q), True, 'acima de')
    # campos: tom do 3o ano como escolar, licenca sem o decreto, pagina errada na atribuicao
    q = pg.copia(boa, temp, 'v_campos')
    q.itens[0]['tom'] = 'escolar'
    placar.conferir('tom errado', trava_campos(q, vinc), True, 'tom')
    q = pg.copia(boa, temp, 'v_licenca')
    q.itens[0]['licenca'] = 'livre'
    placar.conferir('licenca sem o decreto', trava_campos(q, vinc), True, 'licenca')
    q = pg.copia(boa, temp, 'v_pagina')
    q.itens[0]['atribuicao'] = q.itens[0]['atribuicao'].replace('p. ', 'p. 9')
    placar.conferir('atribuicao com a pagina errada', trava_campos(q, vinc), True, 'atribuicao')
    q = pg.copia(boa, temp, 'v_tema')
    q.itens[0]['tema_app'] = 'MAT03-08'
    placar.conferir('assunto fora dos 33', trava_campos(q, vinc), True, 'fora dos 33')
    # item sumido do pacote e do relatorio
    q = pg.copia(boa, temp, 'v_some')
    q.itens = [i for i in q.itens if i['id'] != 'sme:3ano:p007']
    placar.conferir('item sumido', trava_contagens(q, vinc), True, 'nem no pacote')


def principal():
    ap = argparse.ArgumentParser()
    ap.add_argument('--real', action='store_true')
    ap.add_argument('--pdfs')
    ap.add_argument('--vinculos')
    ap.add_argument('--trabalho')
    ap.add_argument('--trabalho2')
    ap.add_argument('--zip')
    ap.add_argument('--sem-navegador', action='store_true')
    a = ap.parse_args()
    placar = pg.Placar()
    temp = tempfile.mkdtemp(prefix='prova_cadernos_')
    try:
        if a.real:
            p = pg.Pacote(a.trabalho, a.pdfs)
            vinc = ler_vinculos(a.vinculos)
            print('pacote real: %d itens, %d excluidos' % (len(p.itens), p.manifest['contagens']['itens_excluidos']))
            if a.trabalho2:
                placar.conferir('cadernos: determinismo', pg.trava_determinismo(p, pg.Pacote(a.trabalho2, a.pdfs)))
            travas(p, vinc, placar, a.zip)
            if not a.sem_navegador:
                sorteio = pg.sortear_pedacos(p)
                erros, medidas = pg.trava_fidelidade(p, sorteio, temp)
                placar.conferir('cadernos: fidelidade (%d pedacos, semente %d)' % (len(sorteio), pg.SEMENTE), erros)
                if medidas:
                    fr = [m[0] for m in medidas]
                    print('          fidelidade: media %.3f%%, pior %.3f%%' % (100 * sum(fr) / len(fr), 100 * max(fr)))
        else:
            amostra(temp, placar, not a.sem_navegador)
    finally:
        shutil.rmtree(temp, ignore_errors=True)
    print('%d verificacoes passaram, %d falharam' % (placar.ok, placar.falhas))
    sys.exit(1 if placar.falhas else 0)


if __name__ == '__main__':
    principal()
