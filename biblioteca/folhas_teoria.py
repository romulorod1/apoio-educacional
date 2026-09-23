"""Folhas de contato das paginas de teoria: a fonte ao lado da pagina do pacote.

    python biblioteca/folhas_teoria.py <pasta de trabalho> <pasta dos PDFs da serie>
        <pasta de saida> [--paginas N] [--todas] [--semente N]

Cada par e a mesma pagina duas vezes: a esquerda o PDF do Portal como ele e, a
direita o SVG que foi para o pacote, renderizado NO CHROME (o caminho do
tablet). A pergunta de quem revisa e uma so: a pagina do pacote perdeu a marca
d'agua e NADA MAIS -- mesmo texto, mesmas figuras, mesmo lugar?

Sem --todas, sorteia N paginas (padrao 80) com semente fixa, metade entre as que
tem a marca e metade entre as que nao tem, para a folha mostrar tambem o caso em
que a remocao nao podia mexer.
"""
import argparse
import io
import json
import os
import random
import shutil
import subprocess
import sys
import tempfile

import pymupdf

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)

ESCALA = 0.42          # do tamanho da pagina, na folha
DPI_FONTE = 110        # com que a pagina do PDF e renderizada
ESCALA_CHROME = DPI_FONTE / 72.0
MARGEM = 14.0
LEGENDA = 15.0
PARES_POR_LINHA = 2
LINHAS_POR_FOLHA = 4


def tem_marca(pg):
    """Linha girada, clara e de corpo grande: a marca d'agua do Portal."""
    for b in pg.get_text('rawdict')['blocks']:
        if b['type'] != 0:
            continue
        for l in b['lines']:
            s0 = l['spans'][0]
            if abs(l['dir'][1]) > 1e-6 and s0['color'] > 0xAAAAAA and s0['size'] > 30:
                return True
    return False


def escolher(teoria, pdfs, quantas, semente, todas):
    """[(t, pagina, arquivo, com_marca)] das paginas que vao para as folhas."""
    fora = []
    for t in teoria:
        arquivo = '%s__teoria-%s.pdf' % (t['modulo']['slug'], t['aula']['slug'])
        doc = pymupdf.open(os.path.join(pdfs, arquivo))
        for pag in t['paginas']:
            fora.append((t, pag, arquivo, tem_marca(doc[pag['n'] - 1])))
        doc.close()
    if todas:
        return fora
    rnd = random.Random(semente)
    com = [x for x in fora if x[3]]
    sem = [x for x in fora if not x[3]]
    n_sem = min(len(sem), quantas // 2)
    escolhidas = rnd.sample(sem, n_sem) + rnd.sample(com, min(len(com), quantas - n_sem))
    return sorted(escolhidas, key=lambda x: (x[2], x[1]['n']))


def desenhar(bloco, destino, titulo, pngs, pdfs):
    largura_pg = max(p['medidas']['largura_pt'] for _, p, _, _ in bloco) * ESCALA
    altura_pg = max(p['medidas']['altura_pt'] for _, p, _, _ in bloco) * ESCALA
    larg_par = 2 * largura_pg + MARGEM
    doc = pymupdf.open()
    pg = doc.new_page(width=PARES_POR_LINHA * (larg_par + MARGEM) + MARGEM,
                      height=LINHAS_POR_FOLHA * (altura_pg + LEGENDA + MARGEM) + 40)
    pg.insert_text((MARGEM, 16), titulo, fontname='helv', fontsize=10)
    abertos = {}
    for k, (t, pag, arquivo, com) in enumerate(bloco):
        lin, col = divmod(k, PARES_POR_LINHA)
        x = MARGEM + col * (larg_par + MARGEM)
        y = 30 + lin * (altura_pg + LEGENDA + MARGEM)
        if arquivo not in abertos:
            abertos[arquivo] = pymupdf.open(os.path.join(pdfs, arquivo))
        fonte = abertos[arquivo][pag['n'] - 1].get_pixmap(dpi=DPI_FONTE)
        for i, caixa in enumerate((pymupdf.Rect(x, y, x + largura_pg, y + altura_pg),
                                   pymupdf.Rect(x + largura_pg + MARGEM, y, x + 2 * largura_pg + MARGEM, y + altura_pg))):
            pg.draw_rect(caixa + (-2, -2, 2, 2), color=None, fill=(0.88, 0.88, 0.88))
            pg.draw_rect(caixa, color=None, fill=(1, 1, 1))
            if i == 0:
                pg.insert_image(caixa, pixmap=fonte)
            else:
                pg.insert_image(caixa, filename=pngs[pag['asset']])
        # a legenda nao diz o que mudou nem o que esperar: quem revisa tem de
        # olhar a pagina, e nao o rotulo (o revisor da primeira rodada leu
        # "com marca d'agua" no titulo e ja sabia o que procurar)
        pg.insert_text((x, y + altura_pg + 11), '%s  p%d  (fonte | pacote)' % (t['aula']['titulo'][:46], pag['n']),
                       fontname='helv', fontsize=8, color=(0.1, 0.1, 0.5))
    for d in abertos.values():
        d.close()
    pg.get_pixmap(dpi=DPI_FONTE).save(destino)


def gerar(pasta_trab, pdfs, saida, quantas=80, semente=2026, todas=False):
    os.makedirs(saida, exist_ok=True)
    teoria = json.load(io.open(os.path.join(pasta_trab, 'teoria.json'), encoding='utf-8'))
    escolhidas = escolher(teoria, pdfs, quantas, semente, todas)
    temp = tempfile.mkdtemp(prefix='folhas_teoria_')
    try:
        pedidos, pngs = [], {}
        for _, pag, _, _ in escolhidas:
            png = os.path.join(temp, '%05d.png' % len(pedidos))
            pedidos.append({'svg': os.path.join(pasta_trab, *pag['asset'].split('/')), 'png': png,
                            'largura_pt': pag['medidas']['largura_pt'], 'altura_pt': pag['medidas']['altura_pt'],
                            'escala': ESCALA_CHROME})
            pngs[pag['asset']] = png
        arq = os.path.join(temp, 'pedidos.json')
        json.dump(pedidos, open(arq, 'w', encoding='utf-8'))
        r = subprocess.run(['node', os.path.join(AQUI, '_fidelidade.js'), arq], capture_output=True, text=True)
        if r.returncode != 0:
            raise SystemExit('o Chrome nao renderizou: %s' % r.stderr[-300:])
        por_folha = PARES_POR_LINHA * LINHAS_POR_FOLHA
        feitas = []
        for n in range(0, len(escolhidas), por_folha):
            bloco = escolhidas[n:n + por_folha]
            destino = os.path.join(saida, 'teoria-%03d.png' % (n // por_folha + 1))
            titulo = 'teoria, folha %d de %d: %d paginas' % (
                n // por_folha + 1, (len(escolhidas) + por_folha - 1) // por_folha, len(bloco))
            desenhar(bloco, destino, titulo, pngs, pdfs)
            feitas.append(destino)
        return feitas, escolhidas
    finally:
        shutil.rmtree(temp, ignore_errors=True)


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('trabalho')
    ap.add_argument('pdfs')
    ap.add_argument('saida')
    ap.add_argument('--paginas', type=int, default=80)
    ap.add_argument('--todas', action='store_true')
    ap.add_argument('--semente', type=int, default=2026)
    a = ap.parse_args()
    feitas, escolhidas = gerar(a.trabalho, a.pdfs, a.saida, a.paginas, a.semente, a.todas)
    print('%d folhas em %s (%d paginas, %d com marca na fonte)'
          % (len(feitas), a.saida, len(escolhidas), sum(1 for x in escolhidas if x[3])))
