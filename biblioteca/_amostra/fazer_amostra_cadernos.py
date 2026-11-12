"""Faz um caderno sintetico no formato dos Cadernos de Apoio e Aprendizagem da SME-SP,
para a prova do tipo de fonte cadernos-sme-sp (biblioteca/_prova_cadernos_sme.py).

    python biblioteca/_amostra/fazer_amostra_cadernos.py <pasta>

Conteudo proprio, escrito aqui, para a prova rodar no portao sem o Drive. Imita
o que o C5 mediu nos cadernos reais (ver o cabecalho de biblioteca/cadernos_sme.py):

CadernosApoioAprendizagemMatematicaAluno3Ano.pdf, 11 paginas:
- p1 capa; p2 o Indice em DUAS colunas, com guia de pontos, a linha da
  unidade com pontos depois do numero, um titulo que quebra em duas linhas e
  uma guia de um ponto so;
- p3 (impressa 3) a abertura da Unidade 1 (conversa, nao e atividade);
- p4 e p5 (4 e 5) "Pastores e ovelhas", que atravessa a pagina: itens 1 e 2
  com um desenho proprio (vetorial, sem credito), itens 3 e 4 na pagina 5;
- p6 (6) "O album de fotos", com uma imagem raster e o credito girado de 5 pt
  ao lado ("Fulano de Tal/Agencia Imagens"): tem de SAIR, com o credito no
  motivo; e, na mesma pagina, abaixo, "Quadro de numeros", que comeca no meio
  da pagina;
- p7 (7) "Duas colunas": itens 1 e 2 na coluna da esquerda e 3 e 4 na da
  direita, lado a lado; a atividade sai inteira, num recorte so;
- p8 (8) "Agora, e com voce" (revisao): questoes 1 e 2 na margem, a 2 com um
  quadro que sobe acima da caixa da linha do numero, e a 1 com uma linha de
  resposta fina (0,5 pt, cinza) que some na tinta de 72 dpi; 3 e 4 lado a lado (saem
  juntas); a 5 com uma foto creditada (sai); a 6 com uma cedula desenhada,
  que a curadoria tira; a 7, de massa, assunto fora dos 33;
- p9 (9) a revisao continua: um desenho no alto, que e da questao 8, e a 8;
  a questao 7 acaba na p8 (o desenho nao e dela);
  e a 9, que remete a "questao anterior" (sai: nao se resolve sozinha);
- p10 (10) outra revisao, com "Use a tabela abaixo..." e a tabela antes da
  questao 1: sai inteira, num item so;
- p11 ANOTACOES (fim: nada dali entra).
O numero de cada pagina fica num selo (circulo claro) que sobe acima do
texto do numero; a questao 5 tem o credito da foto em 8 pt, girado, sem
palavra de credito, encostado na foto.
Toda pagina de conteudo tem o rodape corrido: o numero da pagina, a linha
"cadernos de apoio e aprendizagem SMESP" e o numero por extenso.
"""
import os
import sys

import pymupdf

FIXO = {'creationDate': 'D:20261113000000', 'modDate': 'D:20261113000000', 'producer': 'amostra', 'creator': 'amostra'}
W, H = 555.0, 774.0
NOME = 'CadernosApoioAprendizagemMatematicaAluno3Ano.pdf'
EXTENSO = {3: 'tres', 4: 'quatro', 5: 'cinco', 6: 'seis', 7: 'sete', 8: 'oito', 9: 'nove', 10: 'dez', 11: 'onze'}


def texto(pg, x, y, t, corpo=12, fonte='helv', rot=0):
    pg.insert_text((x, y), t, fontname=fonte, fontsize=corpo, rotate=rot)


def rodape(pg, n):
    x = 30 if n % 2 == 0 else W - 50
    # o selo do numero da pagina: circulo verde que sobe acima do texto
    pg.draw_circle((x + 6, 736), 14, color=None, fill=(0.45, 0.7, 0.5))
    texto(pg, x, 740, str(n), corpo=10)
    texto(pg, 300 if n % 2 == 0 else 110, 745, 'cadernos de apoio e aprendizagem SMESP', corpo=9)
    texto(pg, 60 if n % 2 == 0 else W - 120, 752, EXTENSO.get(n, ''), corpo=7)


def titulo(pg, y, t):
    texto(pg, 100, y, t, corpo=16, fonte='hebo')


def item(pg, x, y, n, t):
    texto(pg, x, y, '%d.' % n, corpo=12, fonte='hebo')
    texto(pg, x + 16, y, t)


def desenho(pg, r, cor=(0.2, 0.5, 0.4)):
    pg.draw_rect(pymupdf.Rect(r), color=cor, fill=None, width=1.5)
    pg.draw_line((r[0], r[1]), (r[2], r[3]), color=cor, width=1)


def foto(pg, r):
    pix = pymupdf.Pixmap(pymupdf.csRGB, pymupdf.IRect(0, 0, 48, 32), False)
    pix.clear_with(200)
    pix.set_rect(pymupdf.IRect(4, 4, 30, 20), (180, 60, 60))
    pix.set_rect(pymupdf.IRect(20, 14, 44, 30), (60, 90, 180))
    pg.insert_image(pymupdf.Rect(r), pixmap=pix)


def fazer(pasta):
    os.makedirs(pasta, exist_ok=True)
    doc = pymupdf.open()
    # p1 capa
    pg = doc.new_page(width=W, height=H)
    texto(pg, 120, 300, 'Cadernos de apoio e aprendizagem', corpo=20, fonte='hebo')
    texto(pg, 120, 330, 'MATEMATICA 3o ano (sintetico)', corpo=14)
    # p2 indice em duas colunas
    pg = doc.new_page(width=W, height=H)
    texto(pg, 60, 60, 'Indice', corpo=30, fonte='hebo')
    esq = [('Unidade 1. . . . . . . . . . . . . 3 . . .', 'hebo'),
           ('PASTORES E OVELHAS . . . . . . . . . 4', 'helv'),
           ('O ALBUM DE FOTOS . . . . . . . . . . 6', 'helv'),
           ('QUADRO DE NUMEROS . . . . . . . . 6', 'helv')]
    dir_ = [('DUAS COLUNAS LADO', 'helv'),
            ('A LADO . . . . . . . . . . . . . . . . 7', 'helv'),
            ('AGORA, E COM VOCE. 8', 'helv'),
            ('AGORA, E COM VOCE . . . . . . . 10', 'helv')]
    for k, (t, f) in enumerate(esq):
        texto(pg, 60, 100 + 18 * k, t, corpo=10, fonte=f)
    for k, (t, f) in enumerate(dir_):
        texto(pg, 300, 100 + 18 * k, t, corpo=10, fonte=f)
    # p3 abertura da unidade
    pg = doc.new_page(width=W, height=H)
    texto(pg, 100, 120, 'Unidade 1', corpo=40, fonte='hebo')
    texto(pg, 100, 170, 'Nesta unidade voce vai contar ovelhas com os pastores.')
    item(pg, 100, 200, 1, 'Converse com os colegas sobre a historia.')
    rodape(pg, 3)
    # p4 e p5: Pastores e ovelhas
    pg = doc.new_page(width=W, height=H)
    titulo(pg, 100, 'PASTORES E OVELHAS')
    item(pg, 100, 130, 1, 'Conte as ovelhas de cada pastor e escreva o numero.')
    desenho(pg, (110, 145, 440, 330))
    item(pg, 100, 360, 2, 'Qual pastor tem mais ovelhas: Joao, com 34, ou Pedro, com 43?')
    rodape(pg, 4)
    pg = doc.new_page(width=W, height=H)
    item(pg, 100, 100, 3, 'Quantas dezenas ha em 58 ovelhas?')
    item(pg, 100, 140, 4, 'Escreva por extenso o numero 72.')
    rodape(pg, 5)
    # p6: O album de fotos (foto creditada) e Quadro de numeros (meio da pagina)
    pg = doc.new_page(width=W, height=H)
    titulo(pg, 100, 'O ALBUM DE FOTOS')
    item(pg, 100, 130, 1, 'Quantas figurinhas ha na foto?')
    foto(pg, (120, 145, 300, 265))
    texto(pg, 112, 262, 'Fulano de Tal/Agencia Imagens', corpo=5, rot=90)
    item(pg, 100, 300, 2, 'Se ganhar mais 12, com quantas ficara?')
    titulo(pg, 380, 'QUADRO DE NUMEROS')
    item(pg, 100, 410, 1, 'Complete o quadro com os numeros de 101 a 110.')
    desenho(pg, (110, 425, 450, 520), cor=(0.6, 0.3, 0.1))
    item(pg, 100, 550, 2, 'Qual numero vem depois de 199?')
    rodape(pg, 6)
    # p7: duas colunas
    pg = doc.new_page(width=W, height=H)
    titulo(pg, 100, 'DUAS COLUNAS LADO A LADO')
    item(pg, 60, 140, 1, 'Some 23 + 14.')
    item(pg, 60, 200, 2, 'Some 45 + 32.')
    item(pg, 300, 140, 3, 'Some 51 + 26.')
    item(pg, 300, 200, 4, 'Some 12 + 67.')
    pg.draw_line((280, 120), (280, 260), color=(0.5, 0.5, 0.5), width=0.8, dashes='[3] 0')
    rodape(pg, 7)
    # p8: revisao
    pg = doc.new_page(width=W, height=H)
    texto(pg, 100, 90, 'AGORA, E COM VOCE', corpo=26, fonte='hebo')
    item(pg, 100, 130, 1, 'Calcule 85 - 32.')
    texto(pg, 116, 146, 'Mostre como pensou.')
    pg.draw_line((116, 160), (480, 160), color=(0.5, 0.51, 0.52), width=0.5)  # linha de resposta fina
    item(pg, 100, 190, 2, 'Meca o lapis em centimetros.')
    pg.draw_rect(pymupdf.Rect(380, 165, 500, 230), color=(0.7, 0.2, 0.5), width=1.5)  # sobe 8 pt acima do "2."
    item(pg, 100, 270, 3, 'Joao tem 5 reais.')
    item(pg, 310, 270, 4, 'Ana tem 3 reais.')
    texto(pg, 116, 286, 'Quanto falta para 10?')
    texto(pg, 326, 286, 'Quanto falta para 10?')
    item(pg, 100, 340, 5, 'Que horas o relogio da foto marca?')
    foto(pg, (130, 355, 260, 440))
    texto(pg, 124, 438, 'Beltrano Sicrano', corpo=8, rot=90)  # credito de 8 pt, sem palavra de credito, encostado na foto
    item(pg, 100, 480, 6, 'Circule a cedula de 20 reais.')
    desenho(pg, (120, 495, 300, 560), cor=(0.1, 0.6, 0.2))
    item(pg, 100, 600, 7, 'Quantos quilos tem a mochila da balanca?')
    texto(pg, 116, 616, 'Escreva a resposta no quadro.')
    rodape(pg, 8)
    # p9: a revisao continua, com um desenho no alto que e da questao 8
    pg = doc.new_page(width=W, height=H)
    desenho(pg, (150, 90, 400, 200), cor=(0.3, 0.3, 0.7))
    item(pg, 100, 230, 8, 'Quantos lados tem a figura desenhada acima?')
    texto(pg, 116, 246, 'Escreva o numero de lados.')
    item(pg, 100, 320, 9, 'Some 5 ao numero de lados da figura da questao anterior.')
    texto(pg, 116, 336, 'Escreva a conta.')
    rodape(pg, 9)
    # p10: outra revisao, com enunciado comum antes da questao 1 (sai inteira)
    pg = doc.new_page(width=W, height=H)
    texto(pg, 100, 90, 'AGORA, E COM VOCE', corpo=26, fonte='hebo')
    texto(pg, 100, 125, 'Use a tabela abaixo nas questoes 1 e 2.')
    desenho(pg, (110, 140, 400, 220), cor=(0.4, 0.2, 0.6))
    item(pg, 100, 250, 1, 'Qual coluna tem o maior valor?')
    item(pg, 100, 300, 2, 'Quanto a primeira coluna tem a mais que a segunda?')
    rodape(pg, 10)
    # p11: anotacoes
    pg = doc.new_page(width=W, height=H)
    texto(pg, 100, 100, 'ANOTACOES', corpo=15, fonte='hebo')
    rodape(pg, 11)
    doc.set_metadata(FIXO)
    caminho = os.path.join(pasta, NOME)
    doc.save(caminho, garbage=3, deflate=True, no_new_id=True)
    return caminho


VINCULOS = """id;tema;exclusao;quem;justificativa
sme:3ano:p004;MAT03-01;;amostra;dezenas e numeros ate cem
sme:3ano:p006;MAT03-02;;amostra;adicao de figurinhas
sme:3ano:p006b;MAT03-01;;amostra;sequencia numerica ate 200
sme:3ano:p007;MAT03-02;;amostra;quatro adicoes
sme:3ano:p008:q1;MAT03-03;;amostra;subtracao
sme:3ano:p008:q2;MAT02-08;;amostra;medida em centimetros
sme:3ano:p008:q3;MAT03-10;;amostra;troco
sme:3ano:p008:q5;MAT03-11;;amostra;horas
sme:3ano:p008:q6;MAT03-10;cedula de dinheiro sem credito, imagem de terceiro;amostra;dinheiro
sme:3ano:p008:q7;MAT03-09;;amostra;massa, fora dos 33
sme:3ano:p008:q8;MAT03-07;;amostra;lados de figura plana
sme:3ano:p008:q9;MAT03-02;;amostra;adicao com a figura de outra questao
sme:3ano:p010;MAT03-12;;amostra;leitura de tabela
"""


def vinculos(caminho):
    with open(caminho, 'w', encoding='utf-8', newline='') as f:
        f.write(VINCULOS)
    return caminho


if __name__ == '__main__':
    print(fazer(sys.argv[1]))
