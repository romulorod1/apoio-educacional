"""Folhas de contato de um pacote: os recortes de cada lista em grade, para olhar.

    python biblioteca/folhas_contato.py <pasta de trabalho do pacote> <pasta de saida>

Uma folha (PNG) para os enunciados de cada lista e outra para as solucoes; lista
comprida vira mais de uma folha ("-1", "-2"). Cada recorte e o proprio SVG do
pacote renderizado NO CHROME (o caminho do tablet; o leitor de SVG do MuPDF
ignora o clipPath e reescala o texto, e deu alarme falso de recorte cortado em
21/09), com o rotulo embaixo ("ex 7", o id curto) e a caixa do
rotulo original desenhada em vermelho fino, porque e ela que o aplicativo cobre
para renumerar. Fundo cinza claro em volta de cada recorte, para a borda do
recorte aparecer.

A pergunta de quem revisa e uma so: cada recorte contem o enunciado inteiro e so
ele, com a figura, e o numero bate com o rotulo?
"""
import io
import json
import os
import shutil
import subprocess
import sys
import tempfile

import pymupdf

LARGURA_COLUNA = 300.0
COLUNAS = 3
MARGEM = 14.0
LEGENDA = 16.0
ALTURA_MAX = 1500.0
DPI = 110
ESCALA_CHROME = 110 / 72.0
AQUI = os.path.dirname(os.path.abspath(__file__))


def folhas(itens, tipo, pasta_trab):
    """Distribui os recortes em folhas de ate ALTURA_MAX pt, em linhas de COLUNAS."""
    paginas, linha, atual, y = [], [], [], MARGEM
    def fecha_linha():
        nonlocal y, linha
        if linha:
            atual.append((y, linha))
            y += max(h for _, _, h in linha) + LEGENDA + MARGEM
            linha = []
    for it in itens:
        cam = it['assets'].get(tipo)
        if not cam:
            continue
        med = it['medidas'][tipo]
        escala = min(1.0, (LARGURA_COLUNA - 2 * MARGEM) / med['largura_pt'])
        h = med['altura_pt'] * escala
        if len(linha) == COLUNAS:
            fecha_linha()
        if linha and y + max([h] + [x[2] for x in linha]) > ALTURA_MAX:
            fecha_linha()
        if atual and not linha and y + h > ALTURA_MAX:
            paginas.append(atual)
            atual, y = [], MARGEM
        linha.append((it, escala, h))
    fecha_linha()
    if atual:
        paginas.append(atual)
    return paginas


def desenhar(pagina_itens, tipo, pasta_trab, destino, titulo, pngs):
    altura = max(y + max(h for _, _, h in linha) + LEGENDA + MARGEM for y, linha in pagina_itens) + 20
    doc = pymupdf.open()
    pg = doc.new_page(width=COLUNAS * LARGURA_COLUNA + MARGEM, height=altura + 20)
    pg.insert_text((MARGEM, 16), titulo, fontname='helv', fontsize=10)
    for y, linha in pagina_itens:
        for k, (it, escala, h) in enumerate(linha):
            med = it['medidas'][tipo]
            x = MARGEM + k * LARGURA_COLUNA
            w = med['largura_pt'] * escala
            caixa = pymupdf.Rect(x, y + 20, x + w, y + 20 + h)
            pg.draw_rect(caixa + (-3, -3, 3, 3), color=None, fill=(0.88, 0.88, 0.88))
            pg.draw_rect(caixa, color=None, fill=(1, 1, 1))
            pg.insert_image(caixa, filename=pngs[it['assets'][tipo]])
            rot = med.get('rotulo')
            if rot:
                r = pymupdf.Rect(x + rot[0] * escala, y + 20 + rot[1] * escala, x + rot[2] * escala, y + 20 + rot[3] * escala)
                pg.draw_rect(r, color=(0.85, 0, 0), width=0.6)
            n_ped = len(it['origem'][tipo].get('pedacos') or [1])
            legenda = 'ex %d%s%s' % (it['numero'], '' if tipo == 'enunciado' else ' (solução)',
                                     '  [%d pedaços]' % n_ped if n_ped > 1 else '')
            pg.insert_text((x, y + 20 + h + 12), legenda, fontname='helv', fontsize=9, color=(0.1, 0.1, 0.5))
    pg.get_pixmap(dpi=DPI).save(destino)
    return destino


def gerar(pasta_trab, saida):
    os.makedirs(saida, exist_ok=True)
    itens = json.load(io.open(os.path.join(pasta_trab, 'itens.json'), encoding='utf-8'))
    por_aula = {}
    for it in itens:
        por_aula.setdefault((it['modulo']['slug'], it['aula']['slug']), []).append(it)
    # todos os recortes renderizados no Chrome de uma vez, um navegador so
    temp = tempfile.mkdtemp(prefix='contato_')
    pedidos, pngs = [], {}
    for it in itens:
        for tipo in ('enunciado', 'solucao'):
            cam = it['assets'].get(tipo)
            if cam:
                png = os.path.join(temp, '%05d.png' % len(pedidos))
                med = it['medidas'][tipo]
                pedidos.append({'svg': os.path.join(pasta_trab, *cam.split('/')), 'png': png,
                                'largura_pt': med['largura_pt'], 'altura_pt': med['altura_pt'], 'escala': ESCALA_CHROME})
                pngs[cam] = png
    arq = os.path.join(temp, 'pedidos.json')
    json.dump(pedidos, open(arq, 'w', encoding='utf-8'))
    r = subprocess.run(['node', os.path.join(AQUI, '_fidelidade.js'), arq], capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit('o Chrome nao renderizou: %s' % r.stderr[-300:])
    feitas = []
    for (mod, aula), lst in sorted(por_aula.items()):
        for tipo, nome in (('enunciado', 'enunciados'), ('solucao', 'solucoes')):
            pags = folhas(lst, tipo, pasta_trab)
            for n, pagina in enumerate(pags, 1):
                destino = os.path.join(saida, '%s__%s__%s-%d.png' % (mod, aula, nome, n))
                titulo = '%s / %s: %s, folha %d de %d' % (mod, aula, nome, n, len(pags))
                feitas.append(desenhar(pagina, tipo, pasta_trab, destino, titulo, pngs))
    shutil.rmtree(temp, ignore_errors=True)
    return feitas


if __name__ == '__main__':
    f = gerar(sys.argv[1], sys.argv[2])
    print('%d folhas em %s' % (len(f), sys.argv[2]))
