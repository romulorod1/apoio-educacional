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
  gabarito    o gabarito de fora (--gabarito-externo): so origem
              agente-conferido, so em item sem solucao, cada entrada no seu
              item, a contagem itens_com_gabarito_agente do manifest bate, e
              o item sem entrada fica byte a byte como sem a opcao; a
              resposta parcial (subitem sem resposta conferida) conta em
              itens_com_gabarito_agente_parcial; origem recusada, id
              desconhecido ou que nao e texto, item com solucao, subitem que
              o item nao tem, subitem null em item com subitens, " - " e
              caractere que o PDF nao desenha param o gerador
  desenho     as listas do Python do que o PDF desenha sao as do pdf.js
  linha de comando  o --gabarito-externo chega ao gerador pelo principal(),
              o json mal formado e recusado, e o --fonte livros o recusa
  só com resposta  com --so-com-resposta (depois do gabarito de fora), só
              fica item com solução, resposta oficial ou gabarito; cada lista
              vai de 1 a N; nenhum módulo vazio, exercício tirado ou SVG sem
              item na busca e no manifest; contagens e relatório batem; a
              regra do gerador em itens sintéticos de toda fonte (o módulo
              com teoria fica)
  dinâmica    com --sem-dinamica, as frases sintéticas de cada padrão de
              DINAMICA_DE_SALA saem e as de história ficam; na amostra
              trocada (dinamica=True), a questão em dupla e a de medir o
              lápis saem com o motivo no relatório, e "o jogo terminou 3 a 1"
              e "a turma da escola" ficam; sem as duas opções, nada delas
              aparece no pacote
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
    # com --so-com-resposta, o item sem resposta tem a lista própria no relatório
    sem_resp = {e['id'] for e in r.get('sem_resposta') or []}
    for iid in sorted(vinc):
        if iid not in itens | excl | fora | sem_resp:
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
        if it.get('link') != cadernos_sme.FONTE['url'] or not str(it.get('link')).startswith('https://'):
            e('link %r e o acervo e %r (o credito do app leva o endereco)' % (it.get('link'), cadernos_sme.FONTE['url']))
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


def casa_forte(texto, titulo):
    """A linha e o titulo: cobre ao menos 10 letras dele (ou ele todo)."""
    a, t = letras(titulo), letras(texto)
    return bool(t) and bool(a) and len(t) >= min(len(a), 10) and (a.startswith(t) or t.startswith(a))


def fontes_no(pgn, r):
    """{indice da linha: (fonte, corpo)} das linhas com centro em r, na ordem de linhas_no."""
    r = pymupdf.Rect(r)
    out = []
    for b in pgn.get_text('dict')['blocks']:
        if b['type'] != 0:
            continue
        for l in b['lines']:
            t = ''.join(sp['text'] for sp in l['spans']).strip()
            if not t:
                continue
            c = pymupdf.Point((l['bbox'][0] + l['bbox'][2]) / 2, (l['bbox'][1] + l['bbox'][3]) / 2)
            if r.contains(c):
                sp = next((x for x in l['spans'] if x['text'].strip()), l['spans'][0])
                out.append((sp['font'], round(sp['size'], 1)))
    return out


def trava_titulo_alheio(p):
    """Nenhum recorte leva a linha de titulo de OUTRA atividade do caderno.

    A linha de titulo e a que esta na MESMA fonte e no mesmo corpo do titulo
    da propria atividade (o titulo e desenhado numa fonte so): uma linha do
    corpo do texto que comeca pela palavra de um titulo curto ("comprimento",
    "formas geometricas") nao conta."""
    erros = []
    titulos = {}
    for lista in (p.itens, p.relatorio['excluidos'], p.relatorio['fora_do_alvo']):
        for x in lista:
            if ':q' not in x['id'] and not letras(x['titulo']).startswith('agoraecomvoce'):
                titulos.setdefault(x['id'].split(':')[1], {})[x['id']] = x['titulo']
    for it in p.itens:
        doc = p.doc(it['origem']['arquivo'])
        outros = {k: v for k, v in titulos.get(it['serie'], {}).items() if k != it['id']}
        proprio = it['origem_detalhe']['atividade']
        if it['origem_detalhe'].get('questao'):
            continue  # a questao solta nao tem titulo proprio no recorte
        ps = pg.pedacos(it, 'enunciado')
        ls0 = linhas_no(doc[ps[0]['pagina'] - 1], ps[0]['bbox'])
        fs0 = fontes_no(doc[ps[0]['pagina'] - 1], ps[0]['bbox'])
        fonte_titulo = set(f for l, f in zip(ls0, fs0) if casa_forte(l[1], proprio))
        if not fonte_titulo:
            continue
        for pz in ps:
            pgn = doc[pz['pagina'] - 1]
            for (bb, t, corpo, girada, _), f in zip(linhas_no(pgn, pz['bbox']), fontes_no(pgn, pz['bbox'])):
                # a segunda linha do proprio titulo ("formas geometricas", de
                # "Descobertas sobre as formas geometricas") tambem e dele
                if girada or f not in fonte_titulo or casa_forte(t, proprio) or (letras(t) and letras(t) in letras(proprio)):
                    continue
                for k, tit in outros.items():
                    if casa_forte(t, tit):
                        erros.append('%s: leva o titulo %r, de %s (p%d)' % (it['id'], t[:40], k, pz['pagina']))
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
        def com_a_de_baixo(l):
            # o titulo quebrado em linha curta ("O JARDIM" e "DOS SENTIDOS"): soma
            # a linha logo abaixo, no mesmo corpo
            t = l[1]
            for o in sorted(ls, key=lambda o: o[0][1]):
                if o is not l and abs(o[2] - l[2]) < 0.6 and 0 < o[0][1] - l[0][1] <= 1.6 * (l[0][3] - l[0][1]):
                    t += ' ' + o[1]
                    break
            return t
        casa = [l for l in ls if casa_forte(l[1], alvo) or (letras(alvo).startswith(letras(l[1])) and len(letras(l[1])) >= 3
                                                           and casa_forte(com_a_de_baixo(l), alvo))]
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
                # ao lado da imagem, e nao dentro dela (o rotulo do eixo do grafico em imagem)
                dentro = any(not (pymupdf.Rect(bb) & i).is_empty and (pymupdf.Rect(bb) & i).get_area() > 0.2 * pymupdf.Rect(bb).get_area()
                             for i in ims)
                junto_de_imagem = not dentro and any((pymupdf.Rect(bb) + (-6, -6, 6, 6)).intersects(i) for i in ims)
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
        # da primeira unidade ate a pagina de anotacoes do fim (e nao so ate a
        # ultima unidade: a pagina que sobra depois dela tambem precisa de dono)
        for pno in range(min(pags), doc.page_count + 1):
            pgn = doc[pno - 1]
            W, H = pgn.rect.width, pgn.rect.height
            if pno > max(pags) and 'anotacoes' in letras(pgn.get_text()):
                break
            ls = [l for l in linhas_no(pgn, (0, H * 0.12, W, H * 0.88)) if not l[3] and l[2] > 6
                  and not (l[2] <= 8.5 and CREDITO.search(l[1]))]
            ims = [pymupdf.Rect(b['bbox']) for b in pgn.get_text('dict')['blocks'] if b['type'] == 1
                   and b['bbox'][2] - b['bbox'][0] >= 10 and b['bbox'][3] - b['bbox'][1] >= 10
                   and pymupdf.Rect(b['bbox']).get_area() > 400 and b['bbox'][1] < H * 0.88]
            rs = pags.get(pno)
            if not rs:
                txt = ' '.join(letras(l[1]) for l in ls)
                # o desenho vetorial tambem e conteudo (o tabuleiro do 5o ano, p. 91, e so desenho)
                des = [d for d in pgn.get_drawings() if d['rect'].get_area() > 100 and d['rect'].y0 >= H * 0.12
                       and d['rect'].y1 <= H * 0.88 and (d.get('color') or d.get('fill'))]
                if re.search(r'unidade\d', txt) or txt.startswith('anotacoes') or (not ls and not ims and not des):
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


GABARITO_DA_AMOSTRA = [
    {'id_item': 'sme:3ano:p007', 'subitem': '2', 'resposta': '14 ovelhas', 'origem': 'agente-conferido'},
    {'id_item': 'sme:3ano:p007', 'subitem': '1', 'resposta': '8', 'origem': 'agente-conferido'},
    {'id_item': 'sme:3ano:p008:q1', 'subitem': None, 'resposta': '25 figurinhas', 'origem': 'agente-conferido'},
]


def trava_gabarito(p, entradas=None, sem=None):
    """O campo gabarito de cada item e a contagem do manifest. Com `entradas`,
    cada uma esta no seu item, na ordem dos subitens, e o item sem entrada nao
    tem o campo. Com `sem` (o pacote gerado sem a opcao), todo item e identico
    ao dele tirado o campo gabarito, e o manifest dele nao tem a contagem."""
    erros = []
    com = [i for i in p.itens if 'gabarito' in i]
    for it in com:
        g, iid = it['gabarito'], it['id']
        if not isinstance(g, dict) or g.get('origem') != 'agente-conferido':
            erros.append('%s: gabarito com origem %r (so vale agente-conferido)' % (iid, (g or {}).get('origem')))
            continue
        rs = g.get('respostas')
        if not rs or any(set(r) != {'subitem', 'resposta'} or not str(r['resposta']).strip() for r in rs):
            erros.append('%s: respostas mal formadas: %r' % (iid, rs))
        if it['assets'].get('solucao') or not it.get('sem_solucao') or it.get('resposta') is not None:
            erros.append('%s: gabarito de fora num item que ja tem solucao ou resposta da fonte' % iid)
        subs = it.get('subitens') or []
        for r in rs or []:
            if (r.get('subitem') not in subs) if subs else (r.get('subitem') is not None or len(rs) != 1):
                erros.append('%s: resposta do subitem %r e o item tem os subitens %r' % (iid, r.get('subitem'), subs))
    c = p.manifest['contagens']
    if com and c.get('itens_com_gabarito_agente') != len(com):
        erros.append('manifest diz itens_com_gabarito_agente %r e o itens.json tem %d'
                     % (c.get('itens_com_gabarito_agente'), len(com)))
    parciais = sum(1 for i in com if i.get('subitens') and len(i['gabarito'].get('respostas') or []) < len(i['subitens']))
    if com and c.get('itens_com_gabarito_agente_parcial') != parciais:
        erros.append('manifest diz itens_com_gabarito_agente_parcial %r e o itens.json tem %d parciais'
                     % (c.get('itens_com_gabarito_agente_parcial'), parciais))
    if entradas is not None:
        esperado = {}
        for e in entradas:
            esperado.setdefault(e['id_item'], []).append({'subitem': e['subitem'], 'resposta': e['resposta']})
        por = {i['id']: i for i in p.itens}
        for iid, rs in esperado.items():
            ordem = (por.get(iid) or {}).get('subitens') or []
            rs.sort(key=lambda r: ordem.index(r['subitem']) if r['subitem'] in ordem else len(ordem))
            got = (por.get(iid) or {}).get('gabarito')
            if not got or got.get('respostas') != rs:
                erros.append('%s: o gabarito de fora devia ser %r e e %r' % (iid, rs, got))
        for it in com:
            if it['id'] not in esperado:
                erros.append('%s: ganhou gabarito sem entrada' % it['id'])
    if sem is not None:
        antes = {i['id']: i for i in sem.itens}
        for it in p.itens:
            sem_campo = {k: v for k, v in it.items() if k != 'gabarito'}
            if json.dumps(sem_campo, sort_keys=True) != json.dumps(antes.get(it['id']), sort_keys=True):
                erros.append('%s: mudou alem do campo gabarito' % it['id'])
        if 'itens_com_gabarito_agente' in sem.manifest['contagens']:
            erros.append('sem --gabarito-externo, o manifest ganhou itens_com_gabarito_agente')
    return erros


def trava_desenho():
    """As listas do que o PDF desenha (gerar_pacote) sao as do pdf.js."""
    import gerar_pacote as gp
    js = io.open(os.path.join(os.path.dirname(AQUI), 'pdf.js'), encoding='utf-8').read()
    erros = []
    m = re.search(r'var CP1252 = \{([^}]*)\}', js)
    cp = {chr(int(h, 16)) for h in re.findall(r'0x([0-9A-F]{4}):', m.group(1))} if m else set()
    m = re.search(r'var SIMBOLOS = \{([^}]*)\}', js)
    sim = set(re.findall(r"'(.)':", m.group(1))) if m else set()
    m = re.search(r'var WINANSI_VAZIO = \{([^}]*)\}', js)
    vaz = {int(h, 16) for h in re.findall(r'0x([0-9A-F]{2}):', m.group(1))} if m else set()
    for nome, py, dojs in (('CP1252', gp.PDF_CP1252, cp), ('SIMBOLOS', gp.PDF_SIMBOLOS, sim),
                           ('WINANSI_VAZIO', gp.PDF_WINANSI_VAZIO, vaz)):
        if not dojs or set(py) != dojs:
            erros.append('%s do gerador difere do pdf.js: sobra %r, falta %r'
                         % (nome, sorted(set(py) - dojs), sorted(dojs - set(py))))
    return erros


def recusa_do_gerador(fn):
    """A frase com que o gerador parou, ou '' se ele seguiu."""
    try:
        fn()
    except SystemExit as e:
        return str(e)
    return ''


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
    placar.conferir('cadernos%s: nenhum titulo de outra atividade' % rot, trava_titulo_alheio(p))
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
    placar.conferir('cadernos: gabarito, sem a opcao nada muda', trava_gabarito(p, entradas=[]))
    g = os.path.join(temp, 'g')
    gerar_amostra(pdfs, vinc_c, g, cur, gabarito_externo=GABARITO_DA_AMOSTRA)
    pgab = pg.Pacote(g, pdfs)
    placar.conferir('cadernos: gabarito de fora no item e na contagem',
                    trava_gabarito(pgab, GABARITO_DA_AMOSTRA, sem=p))
    c = pgab.manifest['contagens']
    placar.conferir('cadernos: a amostra tem 2 itens com gabarito, 1 parcial (p007 so com 1 e 2 de 4)',
                    [] if (c.get('itens_com_gabarito_agente'), c.get('itens_com_gabarito_agente_parcial')) == (2, 1)
                    else ['contagens %r' % c])
    placar.conferir('cadernos: listas do que o PDF desenha iguais as do pdf.js', trava_desenho())
    linha_de_comando(temp, pdfs, vinc_c, cur, placar)
    travas(pgab, vinc, placar, zip_caminho=os.path.join(g + '_zip', 'matematica-cadernos-sme-sp-v1.zip'),
           rot=' (com gabarito)')
    venenos(temp, pdfs, vinc_c, vinc, cur, placar, p)
    venenos_do_gabarito(temp, pdfs, vinc_c, cur, placar, pgab, p)
    so_com_resposta_e_dinamica(temp, pdfs, vinc_c, vinc, cur, placar, p)
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
    # (a conferencia de borda do gerador sai junto: ela ve o selo cortado e tira a unidade)
    q = com('CONFERE_BORDA', False, lambda: com('SELO_DO_RODAPE', False, lambda: gera('selo')))
    placar.conferir('selo do numero da pagina no recorte', trava_corrido(q), True, 'selo')
    # e a borda do gerador e a rede: sem o selo como rodape, a unidade cortada sai com motivo
    q = com('SELO_DO_RODAPE', False, lambda: gera('selo_rede'))
    motivos = ' '.join(e['motivo'] for e in q.relatorio['excluidos'])
    placar.conferir('sem o selo, a borda do gerador tira a unidade que o corta',
                    [] if 'corta um desenho na borda de baixo' in motivos else ['nada saiu pelo desenho: %r' % motivos[:80]])
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
    # sem o titulo forte, "QUADRO:" em corpo maior passa pelo titulo de "Quadro de numeros"
    q = com('TITULO_FORTE', False, lambda: gera('titulo_forte'))
    placar.conferir('titulo pela linha errada', trava_titulo_alheio(q) + trava_recorte(q), True, 'QUADRO DE')
    # a pagina so de desenho encerrava a revisao, e o tabuleiro ficava sem dono
    q = com('PAGINA_SO_DE_DESENHO', False, lambda: gera('so_desenho'))
    placar.conferir('pagina so de desenho sem dono', trava_cobertura(q), True, 'sem unidade nenhuma')
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
    q = pg.copia(boa, temp, 'v_link')
    del q.itens[0]['link']
    placar.conferir('item sem o link do acervo', trava_campos(q, vinc), True, 'link')
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


def venenos_do_gabarito(temp, pdfs, vinc_c, cur, placar, boa, sem):
    def gera(nome, entradas):
        return recusa_do_gerador(lambda: gerar_amostra(pdfs, vinc_c, os.path.join(temp, 'vg_' + nome), cur,
                                                       gabarito_externo=entradas))
    um = dict(GABARITO_DA_AMOSTRA[2])
    # o gerador recusa: origem fora da lista, id que nao e item, subitem que o item nao tem
    r = gera('origem', [dict(um, origem='agente')])
    placar.conferir('gabarito de origem recusada', [r] if r else [], True, 'origem')
    r = gera('id', [dict(um, id_item='sme:3ano:p999')])
    placar.conferir('gabarito de item desconhecido', [r] if r else [], True, 'nao e item')
    r = gera('subitem', [dict(GABARITO_DA_AMOSTRA[0], subitem='9')])
    placar.conferir('gabarito de subitem que o item nao tem', [r] if r else [], True, 'subitem')
    # o item sem subitens (a questao da revisao) com a resposta de um subitem '7'
    r = gera('subitem7', [dict(um, subitem='7')])
    placar.conferir('gabarito de subitem num item sem subitens', [r] if r else [], True, 'nao tem subitens')
    # subitem null num item com subitens: nao diz de qual e a resposta
    r = gera('nulo', [dict(GABARITO_DA_AMOSTRA[0], subitem=None)])
    placar.conferir('gabarito sem subitem num item com subitens', [r] if r else [], True, 'subitem null')
    # id que nao e texto: recusa com frase, e nao TypeError
    try:
        r = gera('id_numero', [dict(um, id_item=['sme:3ano:p007'])])
    except TypeError as e:
        r = 'TypeError: %s' % e
    placar.conferir('gabarito com id que nao e texto', [r] if r else [], True, 'nao e texto')
    r = gera('desenho', [dict(um, resposta='raiz c\u00fabica \u221b8 = 2')])
    placar.conferir('gabarito com caractere que o PDF nao desenha', [r] if r else [], True, 'U+221B')
    r = gera('emoji', [dict(um, resposta='25 \U0001F600')])
    placar.conferir('gabarito com emoji', [r] if r else [], True, 'nao desenha')
    r = gera('hifen', [dict(um, resposta='25 - 3')])
    placar.conferir('gabarito com " - "', [r] if r else [], True, '" - "')
    r = gera('menos', [dict(um, resposta='\u22123')])
    placar.conferir('gabarito com o sinal de menos U+2212', [r] if r else [], True, 'U+2212')
    # e o que o PDF desenha passa: pi, raiz, acento, ordinal
    r = gera('desenha', [dict(um, resposta='\u221a9 = 3; 2\u03c0 cm; 3\u00ba lugar; n\u00e3o')])
    placar.conferir('gabarito com o que o PDF desenha passa', [r] if r else [])
    # a regra e do gerador, para toda fonte: item com solucao de verdade (o Portal) recusa
    com_sol = [{'id': 'x:1', 'sem_solucao': False, 'resposta': None, 'subitens': [],
                'assets': {'enunciado': 'e.svg', 'solucao': 's.svg'}}]
    r = recusa_do_gerador(lambda: cadernos_sme.gerar_pacote.aplicar_gabarito_externo(com_sol, [dict(um, id_item='x:1')]))
    placar.conferir('gabarito num item com solucao', [r] if r else [], True, 'ja tem solucao')
    # pacote envenenado: a trava ve origem trocada, contagem errada, gabarito sem entrada e item mexido
    q = pg.copia(boa, temp, 'vg_origem_trocada')
    next(i for i in q.itens if 'gabarito' in i)['gabarito']['origem'] = 'humano'
    placar.conferir('gabarito com origem trocada no pacote', trava_gabarito(q), True, 'origem')
    q = pg.copia(boa, temp, 'vg_contagem')
    q.manifest['contagens']['itens_com_gabarito_agente'] = 1
    placar.conferir('contagem de gabarito errada', trava_gabarito(q), True, 'itens_com_gabarito_agente')
    q = pg.copia(boa, temp, 'vg_parcial')
    q.manifest['contagens']['itens_com_gabarito_agente_parcial'] = 0
    placar.conferir('contagem de parciais errada', trava_gabarito(q), True, 'parcial')
    q = pg.copia(boa, temp, 'vg_sub_fora')
    next(i for i in q.itens if i['id'] == 'sme:3ano:p008:q1')['gabarito']['respostas'][0]['subitem'] = '7'
    placar.conferir('resposta de subitem que o item nao tem no pacote', trava_gabarito(q), True, 'subitem')
    q = pg.copia(boa, temp, 'vg_sobra')
    next(i for i in q.itens if 'gabarito' not in i)['gabarito'] = {
        'origem': 'agente-conferido', 'respostas': [{'subitem': None, 'resposta': '3'}]}
    placar.conferir('gabarito em item sem entrada', trava_gabarito(q, GABARITO_DA_AMOSTRA), True, 'sem entrada')
    q = pg.copia(boa, temp, 'vg_mexe')
    next(i for i in q.itens if 'gabarito' not in i)['tom'] = 'outro'
    placar.conferir('item sem entrada mudou', trava_gabarito(q, sem=sem), True, 'alem do campo')


# ------------------------------------------------------------------ só com resposta

def tem_resposta(it):
    """A leitura da prova, sem o gerador: solução da fonte, resposta oficial ou gabarito com resposta."""
    return bool(it['assets'].get('solucao')) or it.get('resposta') is not None or \
        bool((it.get('gabarito') or {}).get('respostas'))


def trava_so_com_resposta(p):
    """Pacote gerado com --so-com-resposta: todo item tem resposta, cada lista
    vai de 1 a N, nenhum módulo da busca sem item, nenhum documento da busca ou
    SVG de item que saiu, e as contagens batem com o itens.json e o relatório."""
    erros = []
    ids = {i['id'] for i in p.itens}
    for it in p.itens:
        if not tem_resposta(it):
            erros.append('%s: no pacote sem resposta' % it['id'])
    listas = {}
    for i in p.itens:
        listas.setdefault('%s:%s' % (i['serie'], i['modulo']['slug']), []).append(i['numero'])
    for k, ns in sorted(listas.items()):
        if sorted(ns) != list(range(1, len(ns) + 1)):
            erros.append('lista %s numerada %s' % (k, sorted(ns)))
    mods_busca = set()
    for d in p.busca['temas']:
        if d['k'] == 'exercicio' and d['i'] not in ids:
            erros.append('busca: o exercício %s, que não está no pacote' % d['i'])
        if d['k'] == 'modulo':
            mods_busca.add(d['i'])
            if d['i'] not in listas:
                erros.append('busca: o módulo %s ficou vazio e continua' % d['i'])
    for k in sorted(set(listas) - mods_busca):
        erros.append('busca: o módulo %s tem item e não tem documento' % k)
    usados = {i['assets'][t] for i in p.itens for t in ('enunciado', 'solucao') if i['assets'].get(t)}
    for k in sorted(p.manifest['arquivos']):
        if k.startswith('assets/') and k not in usados:
            erros.append('%s no pacote sem item' % k)
    c, sr = p.manifest['contagens'], p.relatorio.get('sem_resposta')
    if sr is None or c.get('itens_sem_resposta_excluidos') != len(sr):
        erros.append('manifest diz itens_sem_resposta_excluidos %r e o relatório lista %r'
                     % (c.get('itens_sem_resposta_excluidos'), None if sr is None else len(sr)))
    if c['modulos'] != len(listas):
        erros.append('manifest diz %d módulos e o itens.json tem %d' % (c['modulos'], len(listas)))
    if p.manifest['series'] != sorted({i['serie'] for i in p.itens}, key=lambda s: int(s[0])):
        erros.append('manifest com as séries %s, e os itens são de %s' % (p.manifest['series'],
                                                                        sorted({i['serie'] for i in p.itens})))
    for e in sr or []:
        if e['id'] in ids:
            erros.append('%s: tirado por falta de resposta e ainda no pacote' % e['id'])
        if not e.get('motivo'):
            erros.append('%s: tirado sem motivo' % e['id'])
    em_assunto = {x for v in p.relatorio['assuntos'].values() for x in v}
    for x in sorted(em_assunto - ids):
        erros.append('relatório: o assunto ainda lista %s, que saiu' % x)
    return erros


def esperado_so_com_resposta(p):
    """Na amostra com o gabarito de fora, ficam só os dois itens com gabarito."""
    erros = []
    ids = sorted(i['id'] for i in p.itens)
    if ids != ['sme:3ano:p007', 'sme:3ano:p008:q1']:
        erros.append('com gabarito ficaram %s, e o certo é p007 e p008:q1' % ids)
    tirados = sorted(e['id'] for e in p.relatorio.get('sem_resposta') or [])
    certos = ['sme:3ano:p004', 'sme:3ano:p006b', 'sme:3ano:p008:q2', 'sme:3ano:p008:q3', 'sme:3ano:p008:q8',
              'sme:3ano:p010']
    if tirados != certos:
        erros.append('sem resposta saíram %s, e o certo é %s' % (tirados, certos))
    return erros


def trava_regra_so_com_resposta():
    """gerar_pacote.tirar_sem_resposta em itens sintéticos de toda fonte: fica o
    item com solução, com resposta oficial ou com gabarito; sai o sem nada e o
    de gabarito vazio, com os SVG e a busca; o módulo com teoria fica, o
    módulo que ficou vazio some, e o pareamento da teoria esquece a lista que sumiu."""
    gp = cadernos_sme.gerar_pacote

    def item(iid, mod, aula, **kw):
        it = {'id': iid, 'serie': 's', 'modulo': {'slug': mod}, 'aula': {'slug': aula}, 'numero': 1, 'resposta': None,
              'assets': {'enunciado': iid + '.svg', 'solucao': None}, 'origem': {'arquivo': 'x/' + aula + '.pdf'}}
        it.update(kw)
        return it
    itens = [item('a', 'm1', 'l1', assets={'enunciado': 'a.svg', 'solucao': 'a-sol.svg'}),
             item('b', 'm1', 'l1', resposta='C'),
             item('c', 'm2', 'l2', gabarito={'origem': 'agente-conferido', 'respostas': [{'subitem': None, 'resposta': '3'}]}),
             item('d', 'm3', 'l3'),
             item('e', 'm4', 'l4', gabarito={'origem': 'agente-conferido', 'respostas': []}),
             item('f', 'm1', 'l5')]
    conteudo = {k: b'' for k in ('a.svg', 'a-sol.svg', 'b.svg', 'c.svg', 'd.svg', 'e.svg', 'f.svg', 'teo.svg')}
    docs = [{'id': x, 'tipo': 'exercicio'} for x in 'abcdef'] + \
        [{'id': 's:m%d' % n, 'tipo': 'modulo'} for n in (1, 2, 3, 4)] + [{'id': 's:m4:t:teo', 'tipo': 'teoria'}]
    teoria = [{'id': 's:m4:t:teo', 'serie': 's', 'modulo': {'slug': 'm4'}, 'exercicios_pareados': ['s:m4:l4']},
              {'id': 's:m1:t:teo', 'serie': 's', 'modulo': {'slug': 'm1'}, 'exercicios_pareados': ['s:m1:l1', 's:m1:l5']}]
    fora = gp.tirar_sem_resposta(itens, conteudo, docs, teoria)
    erros = []
    if [i['id'] for i in itens] != ['a', 'b', 'c']:
        erros.append('ficaram %s, e o certo é a, b, c' % [i['id'] for i in itens])
    if [(e['id'], e['arquivo']) for e in fora] != [('d', 'l3.pdf'), ('e', 'l4.pdf'), ('f', 'l5.pdf')]:
        erros.append('a linha do relatório: %r' % fora)
    if sorted(conteudo) != ['a-sol.svg', 'a.svg', 'b.svg', 'c.svg', 'teo.svg']:
        erros.append('os SVG que ficaram: %s' % sorted(conteudo))
    if [d['id'] for d in docs] != ['a', 'b', 'c', 's:m1', 's:m2', 's:m4', 's:m4:t:teo']:
        erros.append('a busca ficou com %s (m3 vazio sai, m4 com teoria fica)' % [d['id'] for d in docs])
    if [t['exercicios_pareados'] for t in teoria] != [[], ['s:m1:l1']]:
        erros.append('o pareamento da teoria: %r' % [t['exercicios_pareados'] for t in teoria])
    if gp.tirar_sem_resposta(itens, conteudo, docs, teoria) != [] or len(itens) != 3:
        erros.append('a segunda passada tirou mais alguma coisa')
    return erros


# ------------------------------------------------------------------ dinâmica de sala

# frases sintéticas, uma ou mais por padrão de cadernos_sme.DINAMICA_DE_SALA, e
# as palavras de história que não podem tirar o item (None)
CASOS_DINAMICA = (
    ('1. Em dupla, resolvam os problemas.', 'trabalho em grupo ou dupla'),
    ('Com o seu grupo, montem uma tabela.', 'trabalho em grupo ou dupla'),
    ('Converse com um colega sobre a resposta.', 'trabalho com colegas'),
    ('Compare a sua resposta com a de um colega.', 'trabalho com colegas'),
    ('Peça ao professor uma folha.', 'trabalho com colegas'),
    ('Con-\nversem com a turma.', 'trabalho com colegas'),
    ('Vamos jogar? Cada um lança o dado na sua vez.', 'jogo para jogar'),
    ('Lance o dado e ande as casas.', 'jogo para jogar'),
    ('Recorte as peças e monte o quebra-cabeça.', 'material para recortar'),
    ('Faça uma pesquisa sobre a fruta preferida.', 'pesquisa com a turma'),
    ('Pergunte a dez colegas a idade deles.', 'pesquisa com a turma'),
    ('Quantos alunos há na sua turma?', 'pesquisa com a turma'),
    ('O professor vai ditar alguns números.', 'atividade conduzida pelo professor'),
    ('Ouça o que o professor vai ler.', 'atividade conduzida pelo professor'),
    ('Use o material dourado para representar 125.', 'material concreto'),
    ('Monte um triângulo com três palitos.', 'material concreto'),
    ('Meça a sua carteira com palmos.', 'medir objetos da sala'),
    ('Meça o comprimento do seu lápis.', 'medir objetos da sala'),
    ('A turma da escola tem 30 alunos. Quantas filas de 6?', None),
    ('O jogo terminou 3 a 1. Quantos gols foram marcados?', None),
    ('A professora dividiu os 28 alunos em grupos de 4. Quantos grupos?', None),
    ('Em grupos de 5, quantos grupos formam 35 crianças?', None),
    ('Ana fez um quadrado com 12 palitos. Quantos palitos em cada lado?', None),
    ('A professora vai ler 3 livros por mês. Quantos em um ano?', None),
    ('Pedro joga futebol com os amigos todo sábado.', None),
    ('Meça o segmento AB com a régua e escreva a medida.', None),
    ('Observe o recorte do mapa e responda.', None),
    ('O número em destaque é o maior.', None),
    ('Dobre o número 14.', None),
    ('A sala de Ana tem 6 fileiras de 5 carteiras.', None),
)
# na amostra com dinamica=True: o que sai pela dinâmica de sala, com o rótulo, e o que fica
DINAMICA_NA_AMOSTRA = {'sme:3ano:p008:q2': 'medir objetos da sala', 'sme:3ano:p008:q3': 'trabalho em grupo ou dupla'}
HISTORIA_NA_AMOSTRA = ('sme:3ano:p008:q8', 'sme:3ano:p010')  # "o jogo terminou 3 a 1", "a turma da escola"


def trava_casos_dinamica():
    erros = []
    for texto, certo in CASOS_DINAMICA:
        r = cadernos_sme.dinamica_de_sala(texto)
        if (r[0] if r else None) != certo:
            erros.append('%r: %s, e o certo é %s' % (texto, 'tirou por %r' % (r,) if r else 'ficou',
                                                    'tirar por %r' % certo if certo else 'ficar'))
    return erros


def trava_dinamica(p):
    """A amostra com dinamica=True gerada com --sem-dinamica: a dinâmica de sala
    sai com o motivo no relatório, a palavra de história fica, nada mais sai
    por ela, e a contagem do manifest bate."""
    erros = []
    ids = {i['id'] for i in p.itens}
    exc = {e['id']: e['motivo'] for e in p.relatorio['excluidos']}
    for iid, rot in sorted(DINAMICA_NA_AMOSTRA.items()):
        if iid in ids:
            erros.append('%s: dinâmica de sala no pacote' % iid)
        elif not exc.get(iid, '').startswith('dinâmica de sala (%s): ' % rot):
            erros.append('%s: fora do pacote sem o motivo da dinâmica de sala (%r)' % (iid, exc.get(iid)))
    for iid in HISTORIA_NA_AMOSTRA:
        if iid not in ids:
            erros.append('%s: a palavra de história tirou o item (%r)' % (iid, exc.get(iid)))
    din = sorted(k for k, m in exc.items() if m.startswith('dinâmica de sala'))
    extra = [k for k in din if k not in DINAMICA_NA_AMOSTRA]
    if extra:
        erros.append('a dinâmica de sala tirou também %s' % extra)
    if p.manifest['contagens'].get('itens_dinamica_de_sala_excluidos') != len(din):
        erros.append('manifest diz itens_dinamica_de_sala_excluidos %r e o relatório tem %d'
                     % (p.manifest['contagens'].get('itens_dinamica_de_sala_excluidos'), len(din)))
    return erros


def sem_opcao_nada_muda(p):
    """O pacote sem --so-com-resposta e sem --sem-dinamica não ganha campo nenhum delas."""
    erros = []
    for k in ('itens_sem_resposta_excluidos', 'itens_dinamica_de_sala_excluidos'):
        if k in p.manifest['contagens']:
            erros.append('sem a opção, o manifest ganhou %s' % k)
    if 'sem_resposta' in p.relatorio:
        erros.append('sem a opção, o relatório ganhou sem_resposta')
    if any(e['motivo'].startswith('dinâmica de sala') for e in p.relatorio['excluidos']):
        erros.append('sem a opção, saiu item pela dinâmica de sala')
    return erros


def so_com_resposta_e_dinamica(temp, pdfs, vinc_c, vinc, cur, placar, boa):
    gp = cadernos_sme.gerar_pacote
    placar.conferir('cadernos: sem as duas opções, nada delas no pacote', sem_opcao_nada_muda(boa))
    placar.conferir('so-com-resposta: a regra do gerador em itens sintéticos', trava_regra_so_com_resposta())
    s = os.path.join(temp, 's')
    gerar_amostra(pdfs, vinc_c, s, cur, gabarito_externo=GABARITO_DA_AMOSTRA, so_com_resposta=True)
    ps = pg.Pacote(s, pdfs)
    placar.conferir('cadernos: so-com-resposta tira só o item sem resposta', esperado_so_com_resposta(ps))
    placar.conferir('cadernos: so-com-resposta sem módulo vazio e com as contagens', trava_so_com_resposta(ps))
    travas(ps, vinc, placar, zip_caminho=os.path.join(s + '_zip', 'matematica-cadernos-sme-sp-v1.zip'),
           rot=' (so com resposta)')
    placar.conferir('cadernos: so-com-resposta, o gabarito de fora intacto',
                    trava_gabarito(ps, GABARITO_DA_AMOSTRA))
    # venenos do so-com-resposta
    sem_gab = next(i for i in boa.itens if i['id'] == 'sme:3ano:p004')
    q = pg.copia(ps, temp, 'vs_item')
    q.itens.append(sem_gab)
    placar.conferir('item sem resposta no pacote', trava_so_com_resposta(q), True, 'sem resposta')
    q = pg.copia(ps, temp, 'vs_modulo')
    q.busca['temas'].append({'i': 'sme:3ano:sme-sequencia-vazia', 'k': 'modulo'})
    placar.conferir('módulo vazio na busca', trava_so_com_resposta(q), True, 'ficou vazio')
    q = pg.copia(ps, temp, 'vs_busca')
    q.busca['temas'].append({'i': 'sme:3ano:p004', 'k': 'exercicio'})
    placar.conferir('exercício tirado na busca', trava_so_com_resposta(q), True, 'não está no pacote')
    q = pg.copia(ps, temp, 'vs_svg')
    q.manifest['arquivos'][sem_gab['assets']['enunciado']] = 'sha256:0'
    placar.conferir('SVG de item tirado no pacote', trava_so_com_resposta(q), True, 'sem item')
    q = pg.copia(ps, temp, 'vs_numero')
    q.itens[0]['numero'] = 2
    placar.conferir('lista com buraco na numeração', trava_so_com_resposta(q), True, 'numerada')
    q = pg.copia(ps, temp, 'vs_contagem')
    q.manifest['contagens']['itens_sem_resposta_excluidos'] = 0
    placar.conferir('contagem de sem resposta errada', trava_so_com_resposta(q), True, 'itens_sem_resposta_excluidos')
    q = pg.copia(ps, temp, 'vs_some')
    q.relatorio['sem_resposta'] = q.relatorio['sem_resposta'][1:]
    placar.conferir('item tirado sumido do relatório', trava_contagens(q, vinc), True, 'nem no pacote')
    # a regra que esquece o gabarito de fora tira o que tinha resposta
    antes = gp.tem_resposta
    gp.tem_resposta = lambda it: bool((it.get('assets') or {}).get('solucao'))
    try:
        t = os.path.join(temp, 'vs_regra')
        gerar_amostra(pdfs, vinc_c, t, cur, gabarito_externo=GABARITO_DA_AMOSTRA, so_com_resposta=True)
        q = pg.Pacote(t, pdfs)
    finally:
        gp.tem_resposta = antes
    placar.conferir('so-com-resposta que ignora o gabarito', esperado_so_com_resposta(q), True, 'com gabarito')
    # a dinâmica de sala: as frases sintéticas e a amostra trocada
    placar.conferir('dinâmica de sala: as frases de cada padrão e as de história', trava_casos_dinamica())
    pd = os.path.join(temp, 'pdfs_dinamica')
    fazer_amostra_cadernos.fazer(pd, dinamica=True)
    d = os.path.join(temp, 'd')
    gerar_amostra(pd, vinc_c, d, cur, sem_dinamica=True)
    pdin = pg.Pacote(d, pd)
    placar.conferir('cadernos: dinâmica de sala fora, com o motivo, e a história fica', trava_dinamica(pdin))
    travas(pdin, vinc, placar, zip_caminho=os.path.join(d + '_zip', 'matematica-cadernos-sme-sp-v1.zip'),
           rot=' (sem dinamica)')
    # venenos da dinâmica de sala
    t = os.path.join(temp, 'vd_sem')
    gerar_amostra(pd, vinc_c, t, cur)
    q = pg.Pacote(t, pd)
    placar.conferir('dinâmica de sala sem a opção', trava_dinamica(q), True, 'no pacote')
    q = pg.copia(pdin, temp, 'vd_motivo')
    for e in q.relatorio['excluidos']:
        if e['id'] == 'sme:3ano:p008:q3':
            e['motivo'] = 'fora'
    placar.conferir('dinâmica fora sem o motivo', trava_dinamica(q), True, 'sem o motivo')
    ingenuo = cadernos_sme.DINAMICA_DE_SALA + (('palavra solta', re.compile(r'\bjogo\b|\bturma\b')),)
    t = os.path.join(temp, 'vd_ingenuo')
    com('DINAMICA_DE_SALA', ingenuo, lambda: gerar_amostra(pd, vinc_c, t, cur, sem_dinamica=True))
    q = pg.Pacote(t, pd)
    placar.conferir('palavra de história tira o item', trava_dinamica(q), True, 'palavra de história')
    placar.conferir('padrão solto nas frases', com('DINAMICA_DE_SALA', ingenuo, trava_casos_dinamica),
                    True, 'ficar')
    placar.conferir('lista de padrões vazia', com('DINAMICA_DE_SALA', (), trava_casos_dinamica), True, 'tirar por')
    q = pg.copia(pdin, temp, 'vd_contagem')
    q.manifest['contagens']['itens_dinamica_de_sala_excluidos'] = 0
    placar.conferir('contagem da dinâmica errada', trava_dinamica(q), True, 'itens_dinamica_de_sala_excluidos')
    # a linha de comando: as duas opções chegam ao gerador, e as fontes erradas recusam
    arq = os.path.join(temp, 'gabarito_s.json')
    with io.open(arq, 'w', encoding='utf-8') as f:
        json.dump(GABARITO_DA_AMOSTRA, f, ensure_ascii=False)
    antes = gp.confere_versao_do_pymupdf
    gp.confere_versao_do_pymupdf = lambda versao=None: None
    try:
        t = os.path.join(temp, 'cli_s')
        gp.principal(['--fonte', 'cadernos-sme-sp', '--pdfs', pd, '--vinculos', vinc_c, '--curadoria', cur,
                      '--versao', '1', '--saida', t + '_zip', '--trabalho', t, '--gerado-em',
                      '2026-11-13T00:00:00-03:00', '--commit', 'amostra', '--sem-zip', '--gabarito-externo', arq,
                      '--so-com-resposta', '--sem-dinamica'])
        q = pg.Pacote(t, pd)
        c = q.manifest['contagens']
        placar.conferir('linha de comando: --so-com-resposta e --sem-dinamica chegam ao pacote',
                        trava_so_com_resposta(q) +
                        ([] if (c.get('itens_dinamica_de_sala_excluidos'), sorted(i['id'] for i in q.itens)) ==
                         (2, ['sme:3ano:p007', 'sme:3ano:p008:q1']) else ['contagens %r, itens %s' % (
                             c, sorted(i['id'] for i in q.itens))]))
        r = recusa_do_gerador(lambda: gp.principal(['--fonte', 'livros', '--planilha', 'x.csv', '--rotulo', 'x',
                                                    '--versao', '1', '--saida', os.path.join(temp, 'livros'),
                                                    '--so-com-resposta']))
        placar.conferir('linha de comando: --fonte livros recusa o --so-com-resposta', [r] if r else [], True,
                        'não vale com --fonte livros')
        r = recusa_do_gerador(lambda: gp.principal(['--fonte', 'portal', '--pdfs', pd, '--serie', '9ano',
                                                    '--curadoria', cur, '--versao', '1',
                                                    '--saida', os.path.join(temp, 'portal'), '--sem-dinamica']))
        placar.conferir('linha de comando: --sem-dinamica fora dos cadernos recusa', [r] if r else [], True,
                        'só vale com --fonte cadernos-sme-sp')
    finally:
        gp.confere_versao_do_pymupdf = antes


def linha_de_comando(temp, pdfs, vinc_c, cur, placar):
    """O --gabarito-externo pelo principal() do gerador, como a linha de comando o chama."""
    gp = cadernos_sme.gerar_pacote
    arq = os.path.join(temp, 'gabarito.json')
    with io.open(arq, 'w', encoding='utf-8') as f:
        json.dump(GABARITO_DA_AMOSTRA, f, ensure_ascii=False)
    torto = os.path.join(temp, 'gabarito_torto.json')
    with io.open(torto, 'w', encoding='utf-8') as f:
        f.write('{"id_item": "sme:3ano:p007"}')
    quebrado = os.path.join(temp, 'gabarito_quebrado.json')
    with io.open(quebrado, 'w', encoding='utf-8') as f:
        f.write('[{"id_item": ')
    placar.conferir('linha de comando: ler_gabarito_externo le a lista',
                    [] if gp.ler_gabarito_externo(arq) == GABARITO_DA_AMOSTRA else ['leu outra coisa'])
    r = recusa_do_gerador(lambda: gp.ler_gabarito_externo(torto))
    placar.conferir('linha de comando: json que nao e lista', [r] if r else [], True, 'lista de entradas')
    r = recusa_do_gerador(lambda: gp.ler_gabarito_externo(quebrado))
    placar.conferir('linha de comando: json quebrado', [r] if r else [], True, 'nao consegui ler')
    # a versao do PyMuPDF e conferida antes de tudo; aqui ela nao e o assunto
    antes = gp.confere_versao_do_pymupdf
    gp.confere_versao_do_pymupdf = lambda versao=None: None
    try:
        t = os.path.join(temp, 'cli')
        gp.principal(['--fonte', 'cadernos-sme-sp', '--pdfs', pdfs, '--vinculos', vinc_c, '--curadoria', cur,
                      '--versao', '1', '--saida', t + '_zip', '--trabalho', t, '--gerado-em',
                      '2026-11-13T00:00:00-03:00', '--commit', 'amostra', '--sem-zip', '--gabarito-externo', arq])
        q = pg.Pacote(t, pdfs)
        placar.conferir('linha de comando: o --gabarito-externo chega ao pacote',
                        trava_gabarito(q, GABARITO_DA_AMOSTRA) or
                        ([] if q.manifest['contagens'].get('itens_com_gabarito_agente') == 2 else ['sem a contagem']))
        r = recusa_do_gerador(lambda: gp.principal(['--fonte', 'livros', '--planilha', 'x.csv', '--rotulo', 'x',
                                                    '--versao', '1', '--saida', os.path.join(temp, 'livros'),
                                                    '--gabarito-externo', arq]))
        placar.conferir('linha de comando: --fonte livros recusa o --gabarito-externo', [r] if r else [], True,
                        'nao vale com --fonte livros')
    finally:
        gp.confere_versao_do_pymupdf = antes


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
